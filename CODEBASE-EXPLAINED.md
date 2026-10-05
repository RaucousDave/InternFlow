# InternFlow, Explained in Plain English

This guide explains how the InternFlow codebase works, step by step, for someone who
is still learning Vue or backend development. No prior knowledge is assumed.

## The big picture (30-second version)

InternFlow is a website where students record their internship (SIWES) journey:
their personal profile, where they were placed for work, and a weekly logbook of
what they did. Supervisors then read the logbooks, leave feedback, and finally
mark a student as complete.

The project has two halves that talk to each other:

- **Frontend** (`frontend/`) — everything the user sees and clicks in the browser.
  Built with Vue.
- **Backend** (`backend/`) — the behind-the-scenes helper that stores data and
  checks who is allowed to do what. It talks to a database where everything
  is saved.

Think of a restaurant: the frontend is the dining room and the menu (what you
see and touch), the backend is the kitchen (it prepares and stores things),
and the database is the pantry (where ingredients are kept).

## Part 1: The frontend (Vue)

### What is Vue?

Vue is a tool for building what you see in the browser. Instead of writing one
giant page, you build small reusable pieces called **components** — for example
a button, a form, or a whole page. Vue watches your data, and whenever the data
changes, it automatically updates what is shown on screen. You don't have to
refresh the page yourself.

### The main folders

| Folder / file              | What it is, simply                                            |
| -------------------------- | ------------------------------------------------------------- |
| `src/views/`               | The full pages of the app (Login, Dashboard, Logbook, ...).   |
| `src/components/`          | Small reusable pieces used inside pages (e.g. an empty-list message). |
| `src/router/index.ts`      | The "map" that decides which page shows for each web address. |
| `src/api/client.ts`        | The "messenger" that carries requests from the pages to the backend. |
| `src/api/types.ts`         | Descriptions of the shapes of data (a profile has a name, email, ...). |
| `src/App.vue`              | The outer frame of the whole app (header, menu, page area).   |
| `src/main.ts`              | The starting point — it launches the app.                     |
| `src/style.css`            | The app's visual styling (fonts, colours, spacing).          |

### How a page works: Login as an example

Open `src/views/Login.vue`. Every Vue page has two halves:

1. **`<template>` — what it looks like.** This is the visible part: the email
   box, the password box, the "Sign in" button, and the error message area.
   Special instructions like `v-model="email"` simply mean "keep this text box
   connected to a piece of data called `email` — when the user types, update
   the data automatically." And `v-if="error"` means "only show this message
   if there is an error to show."

2. **`<script>` — what it does.** This is the behaviour part. It holds the data
   (the typed email, the typed password, whether we are busy waiting) and one
   main action: `onLogin`. When the user clicks "Sign in":
   - it calls the `login` messenger function with the email and password,
   - if that works, it sends the user to the right home page (students go to
     the dashboard, supervisors go to the records office),
   - if it fails, it shows a friendly error message instead of crashing.

So the pattern for every page is the same: **show things, collect input, call
the messenger, react to the answer.**

### The router (the map)

`src/router/index.ts` lists every address in the app: `/login`, `/register`,
`/`, `/profile`, `/placement`, `/logbook`, `/feedback`, `/progress`, and the
supervisor-only `/admin` pages.

Before showing a page, the router runs a quick check: "Is this person signed
in? And if this page is supervisors-only, is this person actually a
supervisor?" If not, it redirects them (to the login page, or back home).
Important: this check is only for convenience and good user experience — the
backend always double-checks permission itself, so nobody can sneak in by
typing an address manually.

### The messenger (`api/client.ts`)

Pages never talk to the database directly. Instead they call small helper
functions like `login`, `getProfile`, `createLogbook`, or `giveFeedback`.
Each helper sends a request over the internet to the backend and brings back
the answer. Two helpers deserve a special mention:

- `refreshRole()` asks the backend "who is this person?" (`GET /api/me`) and
  remembers the answer (student or supervisor) in the browser's little
  notebook (`localStorage`), so the router can make quick decisions.
- `errMsg()` turns a failed request into a human-readable sentence instead of
  a scary technical error.

## Part 2: The backend

### What is the backend?

The backend is a program running on a server (a computer that is always on).
The browser can't be trusted to store important data or make important
decisions — anyone could open the browser's tools and change things. So all
the important work happens here: checking passwords, checking permissions,
saving to the database, and enforcing the rules (e.g. "you can't edit a
logbook after submitting it").

Our backend is built with **Express**, which is simply a popular toolkit for
receiving web requests and sending back answers. It is written in
**TypeScript**, which is JavaScript with extra labels describing what kind of
data each value is (text, number, etc.) — those labels catch mistakes early.
And it runs on **Bun**, which is just the engine that executes the code
(similar to Node.js, but faster to start).

### The main files

| File / folder            | What it is, simply                                              |
| ------------------------ | --------------------------------------------------------------- |
| `src/index.ts`           | The front door — receives every request and points it to the right handler. |
| `src/routes/`            | The handlers, grouped by topic: sign-in info, student stuff, supervisor stuff. |
| `src/middleware/auth.ts` | The security guard — checks "are you signed in, and who are you?" before letting a request through. |
| `src/auth.ts`            | The sign-in system itself (passwords, sessions), handled by a library called better-auth. |
| `src/db/schema.ts`       | A list of all the storage boxes (tables) in the database and what each one holds. |
| `src/db/client.ts`       | The connection to the database.                                 |
| `src/db/seed.ts`         | A placeholder for creating the first supervisor account (still to be finished). |

### The front door (`index.ts`)

When a request arrives, `index.ts` decides what to do with it:

- Requests starting with `/api/auth/` (sign up, sign in, sign out) go to the
  better-auth library, which is an expert system just for passwords and
  sessions — we let it handle that part.
- Everything else under `/api/` goes to one of our three handlers:
  `authRouter` (the "who am I?" question), `studentRouter` (profile,
  placements, logbooks), or `supervisorRouter` (reviewing students).
- There is also a `/health` address that simply answers "ok" — a quick way to
  check the backend is awake.

### The security guard (`middleware/auth.ts`)

Almost every request must pass this guard. It:

1. Reads the session cookie from the request. (A cookie is a small note the
   browser automatically attaches to prove "I signed in earlier.")
2. Asks better-auth whether that session is still valid.
3. Looks up the person in the database to find their role (student or
   supervisor) and their profile.
4. Attaches that info to the request so the handlers know who they're dealing
   with — or turns the request away with a `401 Not signed in` message.

### The handlers (`routes/`)

- **`routes/auth.ts`** — answers `GET /api/me` with just the person's role and
  email. That's how the frontend learns which home page to show.
- **`routes/student.ts`** — everything a student can do: save their profile
  (the registration number must look like `23/SC/CO/044` and can't be used by
  two people), add/edit their work placement, write weekly logbook entries,
  submit them (submitted entries lock and can't be edited), and read feedback
  on their own entries.
- **`routes/supervisor.ts`** — everything a supervisor can do: list students,
  read a student's logbook, leave feedback (which marks the entry as reviewed),
  and mark a student complete — but only if the checklist is satisfied
  (profile done, placement added, enough reviewed weeks). If not, it answers
  with a `422` message explaining exactly what is still missing.

Every answer from the backend has the same simple shape: either the requested
data, or `{ error, code }` — a human sentence plus a short machine-readable
label like `DUPLICATE_WEEK` or `COMPLETION_BLOCKED`.

### Sign-ins (better-auth)

Passwords are never stored as plain text, and the app never handles them
directly. The better-auth library takes care of creating accounts, checking
passwords, creating sessions (the "this person is signed in" proof stored in
a cookie), and ending sessions on sign-out. Our code just asks it "is this
session valid?" Our database has four tables that belong to better-auth
(`user`, `session`, `account`, `verification`) — the library manages them,
so we never write to them by hand.

### The database (Drizzle + PostgreSQL)

The actual data lives in a **PostgreSQL** database (hosted on Neon, so we
don't run it ourselves). **Drizzle** is the toolkit our code uses to talk to
it — instead of writing raw database language, we describe our storage boxes
in `schema.ts` using normal code, and Drizzle translates.

The storage boxes (tables) are:

- `user`, `session`, `account`, `verification` — sign-in data (managed by
  better-auth, hands off).
- `students` — one row per student: name, registration number (unique),
  phone, department, faculty, and whether they are marked complete.
- `supervisors` — one row per supervisor account.
- `placements` — where each student worked (organisation, position, dates,
  industry supervisor).
- `logbook_entries` — the weekly entries (week number, dates, activities,
  challenges, lessons, status). A student can only have one entry per week.
- `feedback` — supervisors' comments on submitted logbook entries.

Boxes are linked: for example, each logbook entry points to the student it
belongs to, so a student can only ever see and touch their own rows — the
handlers always check ownership.

## How it all fits together: signing in

Let's follow one click through the whole system:

1. The user types their email and password on the Login **page** and clicks
   "Sign in".
2. The page calls the `login` **messenger** function.
3. The messenger sends the details to the **backend** (`/api/auth/sign-in/email`),
   where **better-auth** checks the password and creates a session cookie.
4. The messenger then asks "who is this?" (`GET /api/me`). The **security
   guard** validates the cookie, looks up the role in the **database**, and
   the handler answers "supervisor" or "student".
5. The page sends the user to the right home page, and from then on every
   request carries the cookie, passes the guard, and reaches the right
   **handler**, which reads or writes the right **database** boxes.

## Words you'll see often

- **Component** — a reusable building block of a page.
- **Route** — a web address and the code that answers it (`/logbook` on the
  frontend, `/api/logbook` on the backend).
- **Request / response** — a question sent to the backend, and the answer sent
  back. Everything the app does is a series of these.
- **Session / cookie** — proof that "I already signed in," automatically
  attached by the browser to each request.
- **Role** — whether someone is a `STUDENT` or a `SUPERVISOR`. Stored in the
  database only; the browser's copy is just a convenience.
- **Table** — one storage box in the database (students, logbook entries, ...).
- **Migration** — a version-controlled instruction that creates or changes
  storage boxes in the real database, generated from `schema.ts`.
- **Status code** — a number summarising the answer: `200`/`201` worked, `400`
  bad input, `401` not signed in, `403` not allowed, `404` not found, `409`
  duplicate, `422` checklist not complete.
