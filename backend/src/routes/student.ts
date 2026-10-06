import { and, desc, eq } from 'drizzle-orm'
import { Router, type Request, type Response } from 'express'
import { db } from '../db/client.js'
import { feedback, logbookEntries, placements, students } from '../db/schema.js'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'

export const studentRouter = Router()
studentRouter.use(requireAuth)

const REG_RE = /^\d{2}\/SC\/CO\/\d{3}$/

function fail(res: Response, status: number, error: string, code: string, extra: object = {}) {
  return res.status(status).json({ error, code, ...extra })
}
function idParam(v: string): string | null {
  const t = v?.trim()
  return t ? t : null
}
const isPgUnique = (e: unknown) =>
  typeof e === 'object' && e !== null && (e as { code?: string }).code === '23505'

function me(req: Request) {
  return (req as AuthedRequest).user
}

// Highest week number that may be filed: the week after the latest filed
// week (or week 1 when nothing is filed). Missed weeks may be back-filled,
// but nobody can skip ahead into weeks that have not arrived yet.
export function maxFileableWeek(existingWeeks: number[]): number {
  const valid = existingWeeks.filter((n) => Number.isInteger(n) && n > 0)
  return valid.length ? Math.max(...valid) + 1 : 1
}

function todayLocal(): string {
  const d = new Date()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

// ---------- profile ----------
studentRouter.get('/students/profile', async (req, res) => {
  const u = me(req)
  const rows = await db.select().from(students).where(eq(students.userId, u.id)).limit(1)
  const r = rows[0]
  if (!r) return res.json({})
  res.json({
    fullName: r.fullName,
    registrationNumber: r.registrationNumber,
    email: u.email,
    phone: r.phone,
    department: r.department,
    faculty: r.faculty,
  })
})

studentRouter.put('/students/profile', async (req, res) => {
  const u = me(req)
  const { fullName, registrationNumber, phone, department, faculty } = req.body as Record<string, string>
  const reg = (registrationNumber ?? '').trim().toUpperCase()
  if (!fullName?.trim()) return fail(res, 400, 'Full name is required.', 'MISSING_FIELDS')
  if (!REG_RE.test(reg)) return fail(res, 400, 'Registration number must look like 23/SC/CO/044.', 'INVALID_REGISTRATION')
  try {
    const existing = await db.select().from(students).where(eq(students.userId, u.id)).limit(1)
    const clash = await db.select({ id: students.id }).from(students).where(eq(students.registrationNumber, reg)).limit(1)
    if (clash[0] && clash[0].id !== existing[0]?.id) {
      return fail(res, 409, 'That registration number is already registered.', 'DUPLICATE_REGISTRATION')
    }
    let row
    if (existing[0]) {
      // email/role are never taken from the body — only these fields change
      const upd = await db
        .update(students)
        .set({
          fullName: fullName.trim(),
          registrationNumber: reg,
          phone: phone ?? null,
          department: department ?? null,
          faculty: faculty ?? null,
        })
        .where(eq(students.userId, u.id))
        .returning()
      row = upd[0]
    } else {
      const ins = await db
        .insert(students)
        .values({
          userId: u.id,
          fullName: fullName.trim(),
          registrationNumber: reg,
          phone: phone ?? null,
          department: department ?? null,
          faculty: faculty ?? null,
        })
        .returning()
      row = ins[0]
    }
    res.json({
      fullName: row.fullName,
      registrationNumber: row.registrationNumber,
      email: u.email,
      phone: row.phone,
      department: row.department,
      faculty: row.faculty,
    })
  } catch (e: unknown) {
    if (isPgUnique(e)) return fail(res, 409, 'That registration number is already registered.', 'DUPLICATE_REGISTRATION')
    throw e
  }
})

// ---------- placements ----------
async function needStudent(userId: string, res: Response): Promise<string | null> {
  const rows = await db.select({ id: students.id }).from(students).where(eq(students.userId, userId)).limit(1)
  if (!rows[0]) {
    res.status(404).json({ error: 'Complete your profile first.', code: 'PROFILE_NOT_SET' })
    return null
  }
  return rows[0].id
}

studentRouter.post('/placements', async (req, res) => {
  const sid = await needStudent(me(req).id, res)
  if (sid === null) return
  const b = req.body as Record<string, string>
  const need = ['orgName', 'orgAddress', 'position', 'startDate', 'endDate', 'industrySupervisorName', 'industrySupervisorContact']
  if (need.some((k) => !b[k]?.trim())) return fail(res, 400, 'All placement fields are required.', 'MISSING_FIELDS')
  const ins = await db
    .insert(placements)
    .values({
      studentId: sid,
      orgName: b.orgName.trim(),
      orgAddress: b.orgAddress.trim(),
      position: b.position.trim(),
      startDate: b.startDate,
      endDate: b.endDate,
      industrySupervisorName: b.industrySupervisorName.trim(),
      industrySupervisorContact: b.industrySupervisorContact.trim(),
    })
    .returning()
  res.status(201).json(ins[0])
})

studentRouter.get('/placements', async (req, res) => {
  const sid = await needStudent(me(req).id, res)
  if (sid === null) return res.json([])
  res.json(await db.select().from(placements).where(eq(placements.studentId, sid)))
})

studentRouter.put('/placements/:id', async (req, res) => {
  const pid = idParam(req.params.id)
  if (pid === null) return fail(res, 400, 'Invalid placement id.', 'INVALID_ID')
  const sid = await needStudent(me(req).id, res)
  if (sid === null) return
  const rows = await db
    .select()
    .from(placements)
    .where(and(eq(placements.id, pid), eq(placements.studentId, sid)))
    .limit(1)
  if (!rows[0]) return fail(res, 404, 'Placement not found.', 'NOT_FOUND')
  const b = req.body as Record<string, string | undefined>
  const patch: Record<string, string> = {}
  for (const k of ['orgName', 'orgAddress', 'position', 'startDate', 'endDate', 'industrySupervisorName', 'industrySupervisorContact']) {
    if (typeof b[k] === 'string' && (b[k] as string).trim()) patch[k] = (b[k] as string).trim()
  }
  const upd = await db.update(placements).set(patch).where(eq(placements.id, pid)).returning()
  res.json(upd[0])
})

// ---------- logbook ----------
studentRouter.post('/logbook', async (req, res) => {
  const sid = await needStudent(me(req).id, res)
  if (sid === null) return
  const b = req.body as Record<string, string | number>
  const week = Number(b.weekNumber)
  if (!Number.isInteger(week) || week < 1) return fail(res, 400, 'Week number must be a positive integer.', 'INVALID_WEEK')
  for (const k of ['startDate', 'endDate', 'activities', 'challenges', 'lessons']) {
    if (!String(b[k] ?? '').trim()) return fail(res, 400, 'All logbook fields are required.', 'MISSING_FIELDS')
  }
  const prior = await db
    .select({ weekNumber: logbookEntries.weekNumber })
    .from(logbookEntries)
    .where(eq(logbookEntries.studentId, sid))
  const cap = maxFileableWeek(prior.map((r) => r.weekNumber))
  if (week > cap) {
    return fail(res, 422, `Week ${week} has not started yet. You can file up to week ${cap}.`, 'WEEK_NOT_STARTED', { maxWeek: cap })
  }
  const today = todayLocal()
  if (String(b.startDate) > today || String(b.endDate) > today) {
    return fail(res, 400, 'Logbook dates cannot be in the future.', 'FUTURE_DATES')
  }
  try {
    const dup = await db
      .select({ id: logbookEntries.id })
      .from(logbookEntries)
      .where(and(eq(logbookEntries.studentId, sid), eq(logbookEntries.weekNumber, week)))
      .limit(1)
    if (dup[0]) return fail(res, 409, 'You already have an entry for that week.', 'DUPLICATE_WEEK')
    const ins = await db
      .insert(logbookEntries)
      .values({
        studentId: sid,
        weekNumber: week,
        startDate: String(b.startDate),
        endDate: String(b.endDate),
        activities: String(b.activities).trim(),
        challenges: String(b.challenges).trim(),
        lessons: String(b.lessons).trim(),
        status: 'DRAFT',
      })
      .returning()
    res.status(201).json(ins[0])
  } catch (e: unknown) {
    if (isPgUnique(e)) return fail(res, 409, 'You already have an entry for that week.', 'DUPLICATE_WEEK')
    throw e
  }
})

studentRouter.get('/logbook', async (req, res) => {
  const sid = await needStudent(me(req).id, res)
  if (sid === null) return res.json([])
  res.json(await db.select().from(logbookEntries).where(eq(logbookEntries.studentId, sid)).orderBy(logbookEntries.weekNumber))
})

async function ownEntry(studentId: string, id: string, res: Response) {
  const rows = await db
    .select()
    .from(logbookEntries)
    .where(and(eq(logbookEntries.id, id), eq(logbookEntries.studentId, studentId)))
    .limit(1)
  if (!rows[0]) {
    res.status(404).json({ error: 'Logbook entry not found.', code: 'NOT_FOUND' })
    return null
  }
  return rows[0]
}

studentRouter.get('/logbook/:id', async (req, res) => {
  const id = idParam(req.params.id)
  if (id === null) return fail(res, 400, 'Invalid logbook id.', 'INVALID_ID')
  const sid = await needStudent(me(req).id, res)
  if (sid === null) return
  const e = await ownEntry(sid, id, res)
  if (e) res.json(e)
})

studentRouter.put('/logbook/:id', async (req, res) => {
  const id = idParam(req.params.id)
  if (id === null) return fail(res, 400, 'Invalid logbook id.', 'INVALID_ID')
  const sid = await needStudent(me(req).id, res)
  if (sid === null) return
  const e = await ownEntry(sid, id, res)
  if (!e) return
  if (e.status !== 'DRAFT') return fail(res, 403, 'Submitted entries cannot be edited.', 'LOCKED')
  const b = req.body as Record<string, string | undefined>
  const patch: Record<string, string> = {}
  for (const k of ['startDate', 'endDate', 'activities', 'challenges', 'lessons']) {
    if (typeof b[k] === 'string' && (b[k] as string).trim()) patch[k] = (b[k] as string).trim()
  }
  const upd = await db.update(logbookEntries).set(patch).where(eq(logbookEntries.id, id)).returning()
  res.json(upd[0])
})

studentRouter.post('/logbook/:id/submit', async (req, res) => {
  const id = idParam(req.params.id)
  if (id === null) return fail(res, 400, 'Invalid logbook id.', 'INVALID_ID')
  const sid = await needStudent(me(req).id, res)
  if (sid === null) return
  const e = await ownEntry(sid, id, res)
  if (!e) return
  if (e.status !== 'DRAFT') return fail(res, 403, 'Only drafts can be submitted.', 'LOCKED')
  const upd = await db.update(logbookEntries).set({ status: 'SUBMITTED' }).where(eq(logbookEntries.id, id)).returning()
  res.json(upd[0])
})

// ---------- own feedback ----------
studentRouter.get('/feedback', async (req, res) => {
  const sid = await needStudent(me(req).id, res)
  if (sid === null) return res.json([])
  const rows = await db
    .select({ id: feedback.id, logbookEntryId: feedback.logbookEntryId, body: feedback.body, createdAt: feedback.createdAt })
    .from(feedback)
    .innerJoin(logbookEntries, eq(feedback.logbookEntryId, logbookEntries.id))
    .where(eq(logbookEntries.studentId, sid))
    .orderBy(desc(feedback.id))
  res.json(rows)
})
