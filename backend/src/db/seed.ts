// TODO (backend owner): seed the department supervisor account with
// role = SUPERVISOR. With better-auth, create the user through
// auth.api.signUpEmail (then flip role server-side in the DB) or insert
// directly with a hashed password. Needed before supervisor login works.
export async function seed() {
  throw new Error('seed not implemented')
}
