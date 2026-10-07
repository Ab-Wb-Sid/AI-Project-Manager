# AI Project Manager: 90-Minute Build Plan

The Infinity Hack '26  |  NovaWorks meeting-to-project CRM

**Abdul Wahab: Data, Auth and Access Control   |   Saad Faisal: AI Transcript Pipeline**

> This copy is for: **Abdul Wahab (Person 1: Data, Auth and Access Control)**

# 1. Overview and ground rules

This document splits the backend between two people so you can build in parallel and merge cleanly in 90 minutes. The frontend teammate builds against the API contract in Section 5, so they are never blocked. Everything follows the stack and rules in your `Architecture.md` and `PRD.md`.

| Layer | Choice |
| --- | --- |
| Framework | Next.js (App Router) + TypeScript, one repo, one deploy |
| Database / ORM | PostgreSQL (Aiven free tier) with Prisma 6 (pinned: Prisma 7 changes setup) |
| Auth | `iron-session` signed HttpOnly cookie storing only `userId`; `bcryptjs` for hashing |
| Validation | Zod 3 for the AI draft, plus database checks for roles |
| AI | Anthropic SDK (`@anthropic-ai/sdk`), temperature 0, JSON output. OpenAI swap noted in Saad Faisal Step 3 |

## Who owns which files

Each person edits only their own files. This is what prevents merge conflicts.

| Path | Owner | Notes |
| --- | --- | --- |
| `package.json`, `prisma/schema.prisma`, `.env.example` | Abdul Wahab | Abdul Wahab installs ALL dependencies up front, so Saad Faisal never touches `package.json`. Need a column or package? Ask Abdul Wahab. |
| `prisma/seed.ts`, `reset.ts`, `sample.ts` | Abdul Wahab | Seed is idempotent (upsert by email). |
| `src/lib/db.ts`, `http.ts`, `session.ts` | Abdul Wahab | Saad Faisal imports `db`, `HttpError`, `errorResponse`, `requireUser`. |
| `src/lib/access/*` and read routes under `src/app/api/` | Abdul Wahab | `auth/*`, `me`, `team`, `projects`, `my-tasks`. |
| `src/lib/ai/*`, `src/lib/services/transcript.service.ts` | Saad Faisal | Prompt, client, Zod schema, validator, service. |
| `src/app/api/transcript/create/route.ts`, `scripts/*` | Saad Faisal | Admin-only route and the test script. |
| `src/app/(app)/*`, `src/components/*` | Frontend | Not covered here. |

## Git rules (keep it simple)

- One repo, everyone pushes straight to `main`. Before every push run `git pull --rebase origin main`.
- Commit small and often, especially at the sync points in Section 2.
- Never commit `.env`. Only `.env.example` with placeholders goes to GitHub.
- Abdul Wahab creates the GitHub repo and adds Saad Faisal and the frontend teammate as collaborators in the first 5 minutes.

# 2. 90-minute timeline

| Time | Abdul Wahab | Saad Faisal | Sync |
| --- | --- | --- | --- |
| 0:00 to 0:08 | Scaffold Next.js, install all dependencies, create the database, push to GitHub (Step 1) | Get the LLM API key and model name. Save the transcript to `scripts/transcript.txt`. Clone when Abdul Wahab pushes. | Abdul Wahab pushes the scaffold |
| 0:08 to 0:20 | Schema, `db push`, seed, `db.ts`, `http.ts`, `session.ts` (Steps 2 to 5) | `schema.ts`, `prompt.ts`, `client.ts` (Steps 1 to 3) | **0:20 SYNC 1.** Abdul Wahab pushes. Saad Faisal pulls. |
| 0:20 to 0:40 | Auth routes, access layer, read routes (Steps 6 to 8) | `validate.ts`, test script, run and tune against the answer key (Steps 4 to 6) |  |
| 0:40 to 0:55 | Sample and reset scripts, curl access tests (Steps 9 and 10) | Service and transcript route (Steps 7 and 8) | **0:45 SYNC 2.** Both pull. The route runs for real. |
| 0:55 to 1:10 | Fix access bugs, `.env.example`, README skeleton | End-to-end tests, error paths, changed-input test (Steps 9 and 10) | Frontend wires to the live routes |
| 1:10 to 1:25 | Deploy to Vercel with Aiven, seed the hosted DB, finish README (Step 11) | Prompt tweaks, run the full demo script with the frontend teammate | **1:10 SYNC 3.** Feature freeze |
| 1:25 to 1:30 | Final push, confirm the live link works | Final QA, help record the demo video | Submit |

> **If time runs short:** drop deployment first (a local app plus a demo video is acceptable per the brief), then the correction UI. Never drop the transaction, the admin-only check, or the access scoping, because judges test those directly.

# 3. Abdul Wahab: Data, Auth and Access Control

**Goal:** a running Next.js app with the database, ten seeded users, working login, and role-scoped read endpoints that cannot leak other people's work. Saad Faisal needs `db`, `HttpError`, `errorResponse`, and `requireUser` from you by minute 20, so build those first.

## Step 1: Scaffold, dependencies, database (0:00 to 0:08)

**terminal**

```bash
npx create-next-app@latest novaworks-crm --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
cd novaworks-crm

# ALL dependencies for both people, installed once
npm i prisma@6 @prisma/client@6 iron-session bcryptjs@2 zod@3 @anthropic-ai/sdk
npm i -D tsx @types/bcryptjs@2

npx prisma init
git init && git add . && git commit -m "scaffold" 
# create the GitHub repo, add collaborators, then:
git branch -M main
git remote add origin <YOUR_REPO_URL>
git push -u origin main
```

Add these to the `scripts` section of `package.json` (the `build` change makes Vercel generate the Prisma client):

**package.json (scripts)**

```json
"build": "prisma generate && next build",
"seed": "tsx prisma/seed.ts",
"reset": "tsx prisma/reset.ts",
"sample": "tsx prisma/sample.ts",
"test:ai": "tsx --env-file=.env scripts/test-ai.ts"
```

**Database.** Fastest for two people is one shared hosted database: create a free PostgreSQL at Aiven, copy the connection string, and send it to Saad Faisal privately (chat, not Git). The URL must end with `?sslmode=require`. Put it in your local `.env`:

**.env  (never commit)**

```ini
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/defaultdb?sslmode=require"
SESSION_SECRET="paste-a-random-string-of-at-least-32-characters"
LLM_API_KEY="your-anthropic-api-key"
LLM_MODEL="your-model-name"
LLM_TIMEOUT_MS="60000"
```

**generate SESSION_SECRET**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> **No Aiven account yet?** Use Docker for now: `docker run --name novaworks-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=novaworks -p 5432:5432 -d postgres:16` with `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/novaworks"`. Each person then runs their own copy and must run `db push` and `seed` themselves. If Aiven shows an SSL certificate error, try adding `&sslaccept=accept_invalid_certs` (demo only).

## Step 2: Schema and push (0:08)

**prisma/schema.prisma**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  MANAGER
  AGENT
}

model User {
  id              String    @id            // seeded: ADMIN, PM01, DEV01, ...
  name            String
  email           String    @unique
  passwordHash    String
  role            Role
  specialization  String?
  skills          String[]
  managedProjects Project[] @relation("ProjectManager")
  tasks           Task[]    @relation("TaskAssignee")
}

model Project {
  id          String   @id @default(cuid())
  name        String
  clientName  String
  description String?
  managerId   String
  manager     User     @relation("ProjectManager", fields: [managerId], references: [id])
  deadline    DateTime @db.Date
  tasks       Task[]

  @@index([managerId])
}

model Task {
  id             String   @id @default(cuid())
  projectId      String
  project        Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  title          String
  description    String?
  assigneeId     String
  assignee       User     @relation("TaskAssignee", fields: [assigneeId], references: [id])
  deadline       DateTime @db.Date
  estimatedHours Float

  @@index([projectId])
  @@index([assigneeId])
}
```

**terminal**

```bash
npx prisma db push
```

## Step 3: Prisma client (0:10)

**src/lib/db.ts**

```ts
import { PrismaClient } from "@prisma/client";

const g = globalThis as unknown as { prisma?: PrismaClient };

export const db = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = db;
```

## Step 4: Seed script, idempotent (0:11)

**prisma/seed.ts**

```ts
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const users = [
  { id: "ADMIN", name: "Admin", email: "admin@novaworks.example", role: Role.ADMIN,
    specialization: "Administrator", skills: ["Company overview", "Transcript creation"] },
  { id: "PM01", name: "Ayesha Khan", email: "ayesha@novaworks.example", role: Role.MANAGER,
    specialization: "Web PM", skills: ["Web projects", "Client coordination"] },
  { id: "PM02", name: "Bilal Ahmed", email: "bilal@novaworks.example", role: Role.MANAGER,
    specialization: "Mobile PM", skills: ["Mobile projects", "Delivery planning"] },
  { id: "PM03", name: "Hina Malik", email: "hina@novaworks.example", role: Role.MANAGER,
    specialization: "AI PM", skills: ["AI projects", "Requirement review"] },
  { id: "DEV01", name: "Ali Raza", email: "ali@novaworks.example", role: Role.AGENT,
    specialization: "Full-Stack", skills: ["React", "Frontend integration"] },
  { id: "DEV02", name: "Hamza Shah", email: "hamza@novaworks.example", role: Role.AGENT,
    specialization: "Full-Stack", skills: ["Node.js", "Databases", "APIs"] },
  { id: "DEV03", name: "Sara Noor", email: "sara@novaworks.example", role: Role.AGENT,
    specialization: "App Developer", skills: ["Flutter", "Mobile UI"] },
  { id: "DEV04", name: "Usman Tariq", email: "usman@novaworks.example", role: Role.AGENT,
    specialization: "App Developer", skills: ["Flutter", "Integration", "Testing"] },
  { id: "DEV05", name: "Zain Abbas", email: "zain@novaworks.example", role: Role.AGENT,
    specialization: "AI Developer", skills: ["LLMs", "Extraction", "Prompts"] },
  { id: "DEV06", name: "Maryam Asif", email: "maryam@novaworks.example", role: Role.AGENT,
    specialization: "AI Developer", skills: ["Retrieval", "Document processing"] },
];

async function main() {
  const passwordHash = await bcrypt.hash("Demo123!", 10);
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, specialization: u.specialization, skills: u.skills, passwordHash },
      create: { ...u, passwordHash },
    });
  }
  console.log("Seeded " + users.length + " users");
}

main().finally(() => prisma.$disconnect());
```

**terminal**

```bash
npm run seed
npm run seed     # run twice on purpose: still 10 users, no duplicates
```

## Step 5: HTTP helpers and session (0:13). Push right after this (SYNC 1)

**src/lib/http.ts**

```ts
import { NextResponse } from "next/server";

export class HttpError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
  }
}

export function errorResponse(e: unknown) {
  if (e instanceof HttpError) {
    return NextResponse.json(e.body ?? { error: e.message }, { status: e.status });
  }
  console.error(e);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
```

**src/lib/session.ts**

```ts
import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import type { Role } from "@prisma/client";
import { db } from "./db";
import { HttpError } from "./http";

export type CurrentUser = {
  id: string;
  name: string;
  role: Role;
  specialization: string | null;
};

interface SessionData {
  userId?: string;
}

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "novaworks_session",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

// Identity comes ONLY from the signed cookie. The role is re-read from the DB every time.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getSession();
  if (!session.userId) return null;
  return db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, role: true, specialization: true },
  });
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Not authenticated");
  return user;
}
```

> **SYNC 1 (about 0:20):** `git add . && git commit -m "db, seed, session" && git pull --rebase origin main && git push`. Message Saad Faisal: "pushed, pull now". From here Saad Faisal can write the service and route against your helpers.

## Step 6: Auth routes (0:20)

**src/app/api/auth/login/route.ts**

```ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

const invalid = () => NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { email, password } = body as { email?: unknown; password?: unknown };
  if (typeof email !== "string" || typeof password !== "string") return invalid();

  const user = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  const ok = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !ok) return invalid();   // same message for unknown email and wrong password

  const session = await getSession();
  session.userId = user.id;
  await session.save();
  return NextResponse.json({ user: { id: user.id, name: user.name, role: user.role } });
}
```

**src/app/api/auth/logout/route.ts**

```ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function POST() {
  const session = await getSession();
  session.destroy();
  return new NextResponse(null, { status: 204 });
}
```

**src/app/api/me/route.ts**

```ts
import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/http";
import { requireUser } from "@/lib/session";

export async function GET() {
  try {
    return NextResponse.json(await requireUser());
  } catch (e) {
    return errorResponse(e);
  }
}
```

## Step 7: Access-control layer (0:25). The part judges test hardest

All reads go through these functions. Routes never query Prisma directly, so there is no unscoped query to call by mistake. A request for an out-of-scope project returns `404` (not `403`), so the existence of other people's projects is not leaked. Dates are returned as `YYYY-MM-DD` strings. Passwords and emails are never selected.

**src/lib/access/index.ts**

```ts
import type { Prisma } from "@prisma/client";
import { db } from "../db";
import { HttpError } from "../http";
import type { CurrentUser } from "../session";

const day = (d: Date) => d.toISOString().slice(0, 10);

function projectScope(user: CurrentUser): Prisma.ProjectWhereInput {
  if (user.role === "ADMIN") return {};
  if (user.role === "MANAGER") return { managerId: user.id };
  return { tasks: { some: { assigneeId: user.id } } };       // AGENT
}

function taskScope(user: CurrentUser, projectId: string): Prisma.TaskWhereInput {
  if (user.role === "ADMIN") return { projectId };
  if (user.role === "MANAGER") return { projectId, project: { managerId: user.id } };
  return { projectId, assigneeId: user.id };                  // AGENT: only their own tasks
}

export async function getProjects(user: CurrentUser) {
  const rows = await db.project.findMany({
    where: projectScope(user),
    orderBy: { deadline: "asc" },
    include: {
      manager: { select: { id: true, name: true } },
      // an agent's task count only counts THEIR tasks
      tasks: {
        where: user.role === "AGENT" ? { assigneeId: user.id } : {},
        select: { id: true },
      },
    },
  });
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    clientName: p.clientName,
    description: p.description,
    deadline: day(p.deadline),
    manager: p.manager,
    taskCount: p.tasks.length,
  }));
}

export async function getTasks(user: CurrentUser, projectId: string) {
  const rows = await db.task.findMany({
    where: taskScope(user, projectId),
    orderBy: { deadline: "asc" },
    include: { assignee: { select: { id: true, name: true } } },
  });
  return rows.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    deadline: day(t.deadline),
    estimatedHours: t.estimatedHours,
    assignee: t.assignee,
  }));
}

export async function getProjectById(user: CurrentUser, projectId: string) {
  const project = (await getProjects(user)).find((p) => p.id === projectId);
  if (!project) throw new HttpError(404, "Not found");
  return { ...project, tasks: await getTasks(user, projectId) };
}

export async function getMyTasks(user: CurrentUser) {
  if (user.role !== "AGENT") throw new HttpError(403, "Agents only");
  const rows = await db.task.findMany({
    where: { assigneeId: user.id },
    orderBy: { deadline: "asc" },
    include: {
      project: {
        select: { id: true, name: true, clientName: true, manager: { select: { id: true, name: true } } },
      },
    },
  });
  return rows.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    deadline: day(t.deadline),
    estimatedHours: t.estimatedHours,
    project: t.project,
  }));
}

export async function getTeam() {
  return db.user.findMany({
    select: { id: true, name: true, role: true, specialization: true },
    orderBy: { id: "asc" },
  });
}
```

## Step 8: Read routes (0:32)

**src/app/api/projects/route.ts**

```ts
import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/http";
import { requireUser } from "@/lib/session";
import { getProjects } from "@/lib/access";

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json(await getProjects(user));
  } catch (e) {
    return errorResponse(e);
  }
}
```

**src/app/api/projects/[id]/route.ts**

```ts
import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/http";
import { requireUser } from "@/lib/session";
import { getProjectById } from "@/lib/access";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    return NextResponse.json(await getProjectById(user, id));
  } catch (e) {
    return errorResponse(e);
  }
}
```

**src/app/api/my-tasks/route.ts**

```ts
import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/http";
import { requireUser } from "@/lib/session";
import { getMyTasks } from "@/lib/access";

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json(await getMyTasks(user));
  } catch (e) {
    return errorResponse(e);
  }
}
```

**src/app/api/team/route.ts**

```ts
import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/http";
import { requireUser } from "@/lib/session";
import { getTeam } from "@/lib/access";

export async function GET() {
  try {
    await requireUser();
    return NextResponse.json(await getTeam());
  } catch (e) {
    return errorResponse(e);
  }
}
```

## Step 9: Sample data and reset scripts (0:40)

The sample script inserts the answer-key data directly so you can test access control before Saad Faisal's AI route is ready. It is for **development only**: never use it in the demo, because the brief requires results to come from the AI flow.

**prisma/sample.ts**

```ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// [title, assigneeId, deadline, hours]
type T = [string, string, string, number];
const data: { name: string; client: string; manager: string; deadline: string; tasks: T[] }[] = [
  { name: "UrbanCart Website", client: "UrbanCart Clothing", manager: "PM01", deadline: "2026-10-20", tasks: [
    ["Product catalog UI", "DEV01", "2026-10-12", 12], ["Demo cart UI", "DEV01", "2026-10-15", 8],
    ["Product and cart APIs", "DEV02", "2026-10-14", 14], ["Website integration and testing", "DEV01", "2026-10-19", 6] ] },
  { name: "QuickServe Mobile App", client: "QuickServe Services", manager: "PM02", deadline: "2026-10-24", tasks: [
    ["Login and profile screens", "DEV03", "2026-10-12", 8], ["Service booking screens", "DEV03", "2026-10-17", 12],
    ["Booking and account APIs", "DEV02", "2026-10-16", 16], ["Mobile integration and testing", "DEV04", "2026-10-22", 10] ] },
  { name: "HelpDeskPro AI Assistant", client: "HelpDeskPro Solutions", manager: "PM03", deadline: "2026-10-22", tasks: [
    ["FAQ document processing", "DEV06", "2026-10-13", 10], ["Assistant answer generation", "DEV05", "2026-10-17", 14],
    ["Human escalation flow", "DEV05", "2026-10-18", 6], ["Assistant evaluation and testing", "DEV06", "2026-10-21", 8] ] },
];

async function main() {
  for (const p of data) {
    await prisma.project.create({
      data: {
        name: p.name, clientName: p.client, description: "DEV SAMPLE", managerId: p.manager,
        deadline: new Date(p.deadline),
        tasks: { create: p.tasks.map(([title, assigneeId, deadline, estimatedHours]) => ({
          title, description: "DEV SAMPLE", assigneeId, deadline: new Date(deadline), estimatedHours })) },
      },
    });
  }
  console.log("Inserted sample projects");
}

main().finally(() => prisma.$disconnect());
```

**prisma/reset.ts**

```ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Deletes generated projects and tasks only. Seeded users are kept.
async function main() {
  const t = await prisma.task.deleteMany();
  const p = await prisma.project.deleteMany();
  console.log("Deleted " + p.count + " projects and " + t.count + " tasks");
}

main().finally(() => prisma.$disconnect());
```

## Step 10: Verify access control with curl (0:45)

Run `npm run dev`, then `npm run sample`. Use a cookie jar per user. (On Windows without curl or jq, use Postman or Thunder Client with the same requests.)

**terminal**

```bash
curl -s -c admin.jar -H "Content-Type: application/json" \
  -d '{"email":"admin@novaworks.example","password":"Demo123!"}' localhost:3000/api/auth/login
curl -s -b admin.jar localhost:3000/api/projects            # note the 3 project ids

curl -s -c ali.jar -H "Content-Type: application/json" \
  -d '{"email":"ali@novaworks.example","password":"Demo123!"}' localhost:3000/api/auth/login
curl -s -b ali.jar localhost:3000/api/projects               # only UrbanCart
curl -s -b ali.jar localhost:3000/api/projects/<QUICKSERVE_ID>   # 404
curl -s -b ali.jar localhost:3000/api/my-tasks               # 3 tasks
```

| Request | Expected result |
| --- | --- |
| GET `/api/projects` with no cookie | `401` |
| Login with a wrong password | `401` `Invalid credentials` |
| Admin: GET `/api/projects` | 3 projects |
| Ayesha: GET `/api/projects` | Only UrbanCart. `/api/my-tasks` returns `403` |
| Ali: GET `/api/projects`, then `/api/my-tasks` | Only UrbanCart, with only his 3 tasks |
| Ali: GET `/api/projects/<QuickServe id>` or `<HelpDeskPro id>` | `404` |
| Ali: GET `/api/projects/<UrbanCart id>` | Task list has ONLY Ali's 3 tasks, not Hamza's |
| Hamza: GET `/api/my-tasks` | 2 tasks, one from UrbanCart and one from QuickServe |
| Any response body | No `passwordHash` and no `email` anywhere |

Once Saad Faisal's route is merged, also confirm that Ali and Ayesha get `403` on `POST /api/transcript/create`. When finished, run `npm run reset` to clear the sample data.

## Step 11: README, .env.example, deployment (0:55 to 1:25)

- **`.env.example`:** copy `.env` and replace every value with a placeholder (the five variables in Step 1). Confirm `.env` is listed in `.gitignore`.
- **README.md:** fill in the provided template. Replace every bracket. Required content: team and stack, run commands (`npm i`, `npx prisma db push`, `npm run seed`, `npm run dev`), environment variable names, the demo accounts table, judge test steps, how to reset (`npm run reset`), known limitations. Saad Faisal gives you the AI test steps.
- **Deploy (bonus marks):** push to GitHub, import the repo into Vercel, add the five environment variables, deploy. Run `npx prisma db push` and `npm run seed` once against the Aiven database from your machine. Ask the frontend teammate to confirm login works on the live URL.
- **Aiven connection limits:** if Vercel shows too many connections, append `&connection_limit=5` to `DATABASE_URL`.
- **Fallback:** if deployment is not done by 1:20, stop and record the local demo video instead.

# 4. Integration and final checks

## Sync points

| Time | What must be true |
| --- | --- |
| 0:20 SYNC 1 | Abdul Wahab has pushed `db.ts`, `http.ts`, `session.ts`, the schema and the seed. Saad Faisal pulled and `npx prisma generate` runs cleanly. |
| 0:45 SYNC 2 | Auth, access layer and read routes are pushed (Abdul Wahab). The transcript route is pushed (Saad Faisal). Both pull and run `npm run dev`. |
| 1:10 SYNC 3 | Feature freeze. Only bug fixes, README, deployment, and the video after this point. |

## Demo script (mirrors PRD section 10)

1. Run `npm run seed`. Show the ten accounts and that there is no signup.
2. Log in as admin, paste the transcript, click Create from Transcript. Show the loading state, then 3 projects and 12 tasks.
3. Open a project: client, manager, deadline, and tasks with owner and hours.
4. Log in as Ayesha: only UrbanCart. Log in as Ali: only his 3 tasks. Try a direct URL to another project: denied.
5. Log in as Hamza: his 2 tasks across UrbanCart and QuickServe. Refresh: the data is still there.
6. Paste the modified transcript and show the changed task. Show the rollback proof (a `422` with nothing saved).

## Final checklist before submitting

- Seed twice gives exactly 10 users.
- All 10 accounts can log in. A wrong password shows an error.
- Non-admin `POST /api/transcript/create` returns `403`. Direct access to another user's project returns `404`.
- Supplied transcript gives 3 projects, 12 tasks, with hours 40, 46 and 38.
- No `.env` or real key on GitHub. `.env.example` has placeholders only.
- README placeholders are all replaced. Live link or demo video link is included.

# 5. API contract for the frontend teammate

All requests send and receive JSON. The session cookie is set by login and sent automatically by the browser, so use `fetch(url, { credentials: "include" })` if the frontend is on another origin (not needed in a single Next.js app).

| Method | Path | Who | Success response |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | Public | `{ user: { id, name, role } }`. `401` on bad credentials |
| POST | `/api/auth/logout` | Any | `204` |
| GET | `/api/me` | Logged in | `{ id, name, role, specialization }` |
| GET | `/api/team` | Logged in | `[{ id, name, role, specialization }]` |
| GET | `/api/projects` | Logged in (scoped) | `[{ id, name, clientName, description, deadline, manager:{id,name}, taskCount }]` |
| GET | `/api/projects/:id` | Logged in (scoped) | Project fields plus `tasks: [{ id, title, description, deadline, estimatedHours, assignee:{id,name} }]`. `404` if not allowed |
| GET | `/api/my-tasks` | AGENT only | `[{ id, title, description, deadline, estimatedHours, project:{ id, name, clientName, manager:{id,name} } }]` |
| POST | `/api/transcript/create` | ADMIN only | `201 { created: { projectCount, taskCount, projects: [{ id, name, taskCount }] } }` |

**Transcript endpoint request bodies.** First submit: `{ "transcript": "..." }`. Corrected resubmit: `{ "draft": { "projects": [...] } }` (skips the AI call).

| Status | Meaning and body |
| --- | --- |
| `400` | Empty transcript. `{ error }` |
| `401` / `403` | Not logged in / not an admin. `{ error }` |
| `409` | A conversion is already running for this admin. Keep the button disabled |
| `422` | Validation failed, nothing saved. `{ error, issues: [{ path, message }], draft }`. Show each issue next to an editable field and offer Revalidate and Save |
| `502` | AI failure or unreadable output, nothing saved. `{ error }`. Show it and allow retry |

# 6. Troubleshooting

| Problem | Fix |
| --- | --- |
| `Cannot find module '@prisma/client'` or missing types | Run `npx prisma generate` |
| Prisma cannot connect to Aiven | Check `?sslmode=require` at the end of `DATABASE_URL`. For certificate errors add `&sslaccept=accept_invalid_certs` (demo only) |
| `Password must be at least 32 characters long` | `SESSION_SECRET` is missing or too short. Restart `npm run dev` after editing `.env` |
| Login works but `/api/me` returns `401` | Cookie not stored. Check the browser sends cookies (same origin) and that `SESSION_SECRET` did not change |
| `params` type error in the `[id]` route | Your Next.js is older than 15. Change the signature to `{ params }: { params: { id: string } }` and drop the `await` |
| LLM rejects `temperature` or the model name | Remove `temperature: 0` and re-check `LLM_MODEL` |
| The AI picks old values (18 Oct, 8 hours, Zain as tester) | Strengthen Rule 3 in `prompt.ts` and re-run `npm run test:ai` until three runs in a row pass |
| Duplicate projects after repeated tests | Run `npm run reset`. The route creates new rows on every successful call by design |
| Vercel build fails on Prisma | Confirm `"build": "prisma generate && next build"` in `package.json` |
| Hosted app times out on Create | Keep `maxDuration = 60` in the route. If it still fails, submit the local app with the demo video |
