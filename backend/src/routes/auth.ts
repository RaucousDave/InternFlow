import { Router } from 'express'
import { requireAuth, type AuthedRequest } from '../middleware/auth.js'

// Authentication itself is owned by better-auth (mounted in index.ts):
//   POST /api/auth/sign-up/email { name, email, password }
//   POST /api/auth/sign-in/email { email, password }
//   POST /api/auth/sign-out
//   GET  /api/auth/get-session
//
// Student registration numbers are NOT a better-auth field. After sign-up
// the client calls PUT /api/students/profile, which validates the number
// (^\d{2}/SC/CO/\d{3}$), rejects duplicates (409), and creates the row
// keyed to the signed-in user — never trust a client-sent user id.

export const authRouter = Router()

// GET /api/me → { role, email }, role read from the DB via the session.
authRouter.get('/me', requireAuth, (req, res) => {
  const u = (req as AuthedRequest).user
  res.json({ role: u.role, email: u.email })
})
