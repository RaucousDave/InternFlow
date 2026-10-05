import { eq } from 'drizzle-orm'
import type { NextFunction, Request, Response } from 'express'
import { fromNodeHeaders } from 'better-auth/node'
import { auth } from '../auth.js'
import { db } from '../db/client.js'
import { students, supervisors, user as authUsers } from '../db/schema.js'

export interface AuthedRequest extends Request {
  user: { id: string; email: string; role: 'STUDENT' | 'SUPERVISOR'; studentId?: string; supervisorId?: string }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) })
    if (!session?.user) return res.status(401).json({ error: 'Not signed in', code: 'UNAUTHENTICATED' })
    const rows = await db
      .select({ id: authUsers.id, email: authUsers.email, role: authUsers.role })
      .from(authUsers)
      .where(eq(authUsers.id, session.user.id))
      .limit(1)
    const row = rows[0]
    if (!row) return res.status(401).json({ error: 'Account not found', code: 'UNAUTHENTICATED' })
    const role = row.role === 'SUPERVISOR' ? 'SUPERVISOR' : 'STUDENT'
    let studentId: string | undefined
    let supervisorId: string | undefined
    if (role === 'STUDENT') {
      const s = await db.select({ id: students.id }).from(students).where(eq(students.userId, row.id)).limit(1)
      studentId = s[0]?.id
    } else {
      const s = await db.select({ id: supervisors.id }).from(supervisors).where(eq(supervisors.userId, row.id)).limit(1)
      supervisorId = s[0]?.id
    }
    ;(req as AuthedRequest).user = { id: row.id, email: row.email, role, studentId, supervisorId }
    next()
  } catch {
    res.status(500).json({ error: 'Authentication check failed', code: 'AUTH_ERROR' })
  }
}
