# AI Project Manager - AI Meeting to Project CRM

> Built for **The Infinity Hack '26** (AI Project Manager: Meeting to Execution).
> Items marked **TODO** must be filled in by the team before submission.

## Team
- Team name: **Claude's Plan**
- Four members and responsibilities:

| Member | Responsibility |
| --- | --- |
| TODO: name | Backend and database (schema, seed script, transactional save) |
| TODO: name | Authentication, sessions, and role-based access control |
| TODO: name | AI integration (prompt, parsing, validation) |
| TODO: name | Frontend (screens, transcript workspace, states) |

- Repository: https://github.com/Ab-Wb-Sid/AI-Project-Manager

## What Works
A project management CRM for the fictional company NovaWorks Technologies. The administrator pastes a meeting transcript, clicks **Create from Transcript**, and the AI creates projects, tasks, assigned managers and developers, deadlines, and estimated hours as saved records.

Features (update each status honestly before submitting):

| Feature | Status |
| --- | --- |
| Seeded demo accounts (10 users, passwords hashed, re-run safe) | TODO: Done / Partial / Not done |
| Login and logout with session cookie | TODO |
| Admin home with all project cards | TODO |
| Create from Transcript (AI, loading state, success summary, error messages) | TODO |
| All-or-nothing save (database transaction; nothing saved if the AI output is invalid) | TODO |
| Correction flow for unresolved fields (revalidate without losing the transcript) | TODO |
| Project detail with client, manager, deadline, and task rows | TODO |
| Manager view limited to their own projects | TODO |
| Agent "My Tasks" view limited to their own tasks | TODO |
| Read-only team directory | TODO |
| Role-based access enforced on direct data requests (not only hidden buttons) | TODO |
| Saved projects and tasks persist after refresh | TODO |

Not included, by design: signup, forgot password, email verification, user-management screens, cost calculation, and progress monitoring.

Design documents are in the repository: `PRD.md`, `Architecture.md`, and `Design.md`.

## Technology Stack
- Frontend: Next.js (App Router) with React, TypeScript, and Tailwind CSS. See `package.json` for exact versions.
- Backend: Next.js route handlers (Node.js runtime) with Prisma ORM. Zod validates the AI output.
- Database: PostgreSQL, hosted on Supabase (local PostgreSQL also works).
- AI: Anthropic Claude via the Anthropic API. The model name is set with `LLM_MODEL`. TODO: write the model you actually use.
- Authentication/session approach: Email and password check against our own `User` table (passwords hashed with bcrypt). A signed, HTTP-only session cookie stores only the user ID. The role is read from the database on every request, never taken from the client. Supabase is used only as the database, not for auth.

## Links
- Live application: TODO: URL, or "Not deployed"
- Demo video: TODO: accessible recording URL (required if the database is local)

## Requirements
- Node.js 20 or newer
- npm 10 or newer
- A PostgreSQL database: a Supabase project (free tier works) or local PostgreSQL 15+
- An Anthropic API key (used by the server only)

## Run Locally
1. Clone this repository and enter its directory:
   ```sh
   git clone https://github.com/Ab-Wb-Sid/AI-Project-Manager.git
   cd AI-Project-Manager
   ```
2. Install dependencies (single project at the repository root):
   ```sh
   npm install
   ```
3. Copy the provided `.env.example` to `.env`:
   ```sh
   cp .env.example .env
   ```
4. Open `.env` and set the variables listed in the table below with your own private values.
5. Create or connect the database:
   - **Supabase:** create a project, then copy two connection strings from *Project Settings > Database*: the pooled string (port 6543, add `?pgbouncer=true`) for `DATABASE_URL` and the direct string (port 5432) for `DIRECT_URL`.
   - **Local PostgreSQL:** create an empty database, for example `createdb novaworks`, and use the same URL for both `DATABASE_URL` and `DIRECT_URL`.
6. Apply the schema:
   ```sh
   npx prisma migrate deploy
   ```
   (If no migrations folder exists, run `npx prisma db push` instead.)
7. Seed all ten demo users. Re-running does not create duplicates:
   ```sh
   npm run seed
   ```
8. Start the app (one process serves both frontend and backend):
   ```sh
   npm run dev
   ```
   Open http://localhost:3000. Keep this terminal running while you test.

## Environment Variables
| Variable | Purpose | Where configured |
| --- | --- | --- |
| `DATABASE_URL` | Database connection used by the app (Supabase pooled URL) | `.env` locally, hosting dashboard when deployed (server only) |
| `DIRECT_URL` | Direct database connection used by Prisma migrations | `.env`, server only |
| `SESSION_SECRET` | Signs the session cookie. Use a long random string | `.env`, server only |
| `LLM_PROVIDER` | AI provider name (`anthropic`) | `.env`, server only |
| `LLM_API_KEY` | AI provider credential | `.env`, server only. Never prefix with `NEXT_PUBLIC_` |
| `LLM_MODEL` | AI model name | `.env`, server only |
| `LLM_TIMEOUT_MS` | Maximum wait for the AI response (default `60000`) | `.env`, server only |

`.env.example` contains placeholders only. Real keys, database passwords, and session secrets are never committed. `.env` is listed in `.gitignore`. No AI or database secrets are exposed to the browser.

## Demo Login Accounts
These emails are fictional identifiers, not mailboxes. Signup, email verification, and forgot password are not part of this app. Run `npm run seed` once before testing (see step 7 above). The seeder is safe to run again.

| Role | Name | Demo email | Password |
| --- | --- | --- | --- |
| Admin | Admin | admin@novaworks.example | Demo123! |
| Manager | Ayesha Khan | ayesha@novaworks.example | Demo123! |
| Manager | Bilal Ahmed | bilal@novaworks.example | Demo123! |
| Manager | Hina Malik | hina@novaworks.example | Demo123! |
| Agent | Ali Raza | ali@novaworks.example | Demo123! |
| Agent | Hamza Shah | hamza@novaworks.example | Demo123! |
| Agent | Sara Noor | sara@novaworks.example | Demo123! |
| Agent | Usman Tariq | usman@novaworks.example | Demo123! |
| Agent | Zain Abbas | zain@novaworks.example | Demo123! |
| Agent | Maryam Asif | maryam@novaworks.example | Demo123! |

These are the supplied credentials, unchanged. TODO: confirm all ten accounts log in successfully on the submitted build.

## How Judges Can Test
1. Log in as admin (`admin@novaworks.example` / `Demo123!`) and open **Create from transcript**.
2. Paste the supplied meeting transcript. TODO: add the file to the repository as `docs/sample-transcript.txt` and open it, or copy the text from the challenge pack (section 7).
3. Click **Create from transcript** and wait for the result. Expect **three projects and twelve tasks**.
4. Open **UrbanCart Website**: manager Ayesha Khan, deadline 20 October 2026, four tasks (Ali: 12 h, 8 h, 6 h; Hamza: 14 h).
5. Log out and log in as Ayesha: only UrbanCart appears.
6. Log in as Ali: only his three UrbanCart tasks and the related project appear.
7. Log in as Hamza: his two API tasks appear, one in UrbanCart and one in QuickServe.
8. While logged in as Ali, open the URL of a QuickServe project directly (for example `/projects/<id>`, or call `GET /api/projects/<id>`). It must return "not found" or "forbidden" and no data.
9. Refresh the page and confirm projects and tasks are still there.
10. Paste a modified transcript, for example change the QuickServe "Mobile integration and testing" final estimate to **12 hours** and deadline to **23 October**, and confirm only that task changes.

**Expected results for the supplied transcript**

| Project | Manager | Deadline | Tasks | Hours |
| --- | --- | --- | --- | --- |
| UrbanCart Website | Ayesha | 2026-10-20 | 4 | 40 |
| QuickServe Mobile App | Bilal | 2026-10-24 | 4 | 46 |
| HelpDeskPro AI Assistant | Hina | 2026-10-22 | 4 | 38 |

Also check: no payment, inventory, maps, or real-email tasks; Kamran is not assigned anything; Maryam owns Assistant evaluation and testing.

**Resetting generated projects and tasks between tests (seeded users are kept)**
```sh
npm run reset:demo
```
TODO: add a `reset:demo` script that deletes all rows from `Task` and `Project` only (tasks first), and confirm it works. The `User` table is not touched.

## Deployment Details
- Deployment status: TODO: Live / Local only
- Frontend host: TODO: for example Vercel, with URL
- Backend host: Same as the frontend. Next.js route handlers run on the same deployment.
- Database: Supabase PostgreSQL (hosted). No credentials are listed here.
- Deployed branch/commit: TODO: branch and commit SHA

### How We Deployed
1. Import the GitHub repository into the hosting platform (for example Vercel). Build command: `npm run build`. Framework preset: Next.js. No separate output directory is needed.
2. There is no separate backend service. The API runs inside the same Next.js deployment. For the transcript route, raise the maximum function duration so the AI call can finish (about 60 seconds).
3. Create a Supabase project and copy the pooled connection string (port 6543, `?pgbouncer=true`) and the direct connection string (port 5432). Supabase requires SSL.
4. Set these environment variable names on the hosting platform (values are entered in its dashboard only): `DATABASE_URL`, `DIRECT_URL`, `SESSION_SECRET`, `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL`, `LLM_TIMEOUT_MS`.
5. From a local terminal with the deployment values in `.env`, run the schema and seed commands against the hosted database:
   ```sh
   npx prisma migrate deploy
   npm run seed
   ```
6. No frontend API URL or cross-origin setup is needed, because the frontend and API share one origin.
7. Judges open the live link and use the demo accounts above. The admin account can run the AI transcript conversion on the live site using the team's API key.

If the project is local only, state that here and provide the demo video link above.

## Known Limitations
- No signup, password reset, email verification, or user management, by design.
- Created projects and tasks cannot be edited after saving. TODO: update if editing is added.
- AI extraction is probabilistic. Validation catches structural problems such as unknown people, bad dates, and non-positive hours, but a plausible wrong value should be checked against the transcript.
- A duplicate-click guard exists in the UI and server, but the server-side lock is per instance only.
- Conversion can take 10 to 60 seconds. If the AI service is slow or its quota is exhausted, the app shows an error and saves nothing; try again.
- TODO: add any cold-start, quota, or extra manual steps that apply to your deployment.

## Submission Summary
- Source repository: https://github.com/Ab-Wb-Sid/AI-Project-Manager
- Live link or local demo video: TODO: URL
- Setup and seed commands: documented above (`npm install`, `npx prisma migrate deploy`, `npm run seed`, `npm run dev`)
- Demo login accounts: TODO: confirm working
- Features completed: TODO: short list, matching the table in "What Works"
