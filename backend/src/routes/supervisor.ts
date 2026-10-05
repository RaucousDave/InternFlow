import { and, desc, eq } from 'drizzle-orm'
import { Router, type NextFunction, type Request, type Response } from 'express'
import { db } from '../db/client.js'
import { feedback, logbookEntries, placements, students, supervisors, user as authUsers } from '../db/schema.js'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'

export const supervisorRouter = Router()

const REQUIRED_WEEKS = Number(process.env.REQUIRED_WEEKS ?? 4) // demo-configurable

function fail(res: Response, status: number, error: string, code: string, extra: object = {}) {
  return res.status(status).json({ error, code, ...extra })
}
function idParam(v: string): string | null {
  const t = v?.trim()
  return t ? t : null
}
function me(req: Request) {
  return (req as AuthedRequest).user
}

function requireSupervisor(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    const u = me(req)
    if (u.role !== 'SUPERVISOR') return fail(res, 403, 'Supervisors only.', 'FORBIDDEN')
    if (u.supervisorId == null) return fail(res, 403, 'No supervisor profile.', 'FORBIDDEN')
    next()
  })
}
supervisorRouter.use(requireSupervisor)

async function getStudent(id: string) {
  const rows = await db
    .select({ id: students.id, fullName: students.fullName, registrationNumber: students.registrationNumber, email: authUsers.email })
    .from(students)
    .innerJoin(authUsers, eq(students.userId, authUsers.id))
    .where(eq(students.id, id))
    .limit(1)
  return rows[0] ?? null
}

supervisorRouter.get('/supervisor/students', async (_req, res) => {
  res.json(
    await db
      .select({ id: students.id, fullName: students.fullName, registrationNumber: students.registrationNumber, email: authUsers.email })
      .from(students)
      .innerJoin(authUsers, eq(students.userId, authUsers.id))
      .orderBy(students.id)
  )
})

supervisorRouter.get('/supervisor/students/:id', async (req, res) => {
  const id = idParam(req.params.id)
  if (id === null) return fail(res, 400, 'Invalid student id.', 'INVALID_ID')
  const s = await getStudent(id)
  if (!s) return fail(res, 404, 'Student not found.', 'NOT_FOUND')
  const pl = await db.select().from(placements).where(eq(placements.studentId, id))
  res.json({ ...s, placements: pl })
})

supervisorRouter.get('/supervisor/students/:id/logbook', async (req, res) => {
  const id = idParam(req.params.id)
  if (id === null) return fail(res, 400, 'Invalid student id.', 'INVALID_ID')
  if (!(await getStudent(id))) return fail(res, 404, 'Student not found.', 'NOT_FOUND')
  res.json(
    await db.select().from(logbookEntries).where(eq(logbookEntries.studentId, id)).orderBy(logbookEntries.weekNumber)
  )
})

supervisorRouter.post('/supervisor/logbook/:id/feedback', async (req, res) => {
  const id = idParam(req.params.id)
  if (id === null) return fail(res, 400, 'Invalid logbook id.', 'INVALID_ID')
  const { body } = req.body as { body?: string }
  if (!body?.trim()) return fail(res, 400, 'Feedback body is required.', 'MISSING_FIELDS')
  const rows = await db.select().from(logbookEntries).where(eq(logbookEntries.id, id)).limit(1)
  const entry = rows[0]
  if (!entry) return fail(res, 404, 'Logbook entry not found.', 'NOT_FOUND')
  if (entry.status === 'DRAFT') return fail(res, 422, 'Only submitted entries can be reviewed.', 'NOT_SUBMITTED')
  const supervisorId = me(req).supervisorId as string
  const ins = await db.insert(feedback).values({ logbookEntryId: id, supervisorId, body: body.trim() }).returning()
  await db.update(logbookEntries).set({ status: 'REVIEWED' }).where(eq(logbookEntries.id, id))
  res.status(201).json(ins[0])
})

supervisorRouter.patch('/supervisor/students/:id/complete', async (req, res) => {
  const id = idParam(req.params.id)
  if (id === null) return fail(res, 400, 'Invalid student id.', 'INVALID_ID')
  if (!(await getStudent(id))) return fail(res, 404, 'Student not found.', 'NOT_FOUND')
  const missing: string[] = []
  const prof = await db.select().from(students).where(eq(students.id, id)).limit(1)
  if (!prof[0]?.fullName || !prof[0]?.registrationNumber) missing.push('profile')
  const pl = await db.select({ id: placements.id }).from(placements).where(eq(placements.studentId, id)).limit(1)
  if (!pl[0]) missing.push('placement')
  const reviewed = await db
    .select({ id: logbookEntries.id })
    .from(logbookEntries)
    .where(and(eq(logbookEntries.studentId, id), eq(logbookEntries.status, 'REVIEWED')))
  if (reviewed.length < REQUIRED_WEEKS) missing.push(`reviewed weeks (${reviewed.length}/${REQUIRED_WEEKS})`)
  if (missing.length) {
    return fail(res, 422, 'Completion requirements are not met.', 'COMPLETION_BLOCKED', { missing })
  }
  const upd = await db.update(students).set({ completed: true, completedAt: new Date() }).where(eq(students.id, id)).returning()
  res.json({ completed: upd[0].completed })
})
