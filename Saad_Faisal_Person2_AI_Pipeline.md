# AI Project Manager: 90-Minute Build Plan

The Infinity Hack '26  |  NovaWorks meeting-to-project CRM

**Abdul Wahab: Data, Auth and Access Control   |   Saad Faisal: AI Transcript Pipeline**

> This copy is for: **Saad Faisal (Person 2: AI Transcript Pipeline)**

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

# 3. Saad Faisal: AI Transcript Pipeline

**Goal:** a `POST /api/transcript/create` route (admin only) that sends the transcript and the team directory to the LLM, validates the whole draft, and saves it in one transaction, or saves nothing and returns the unresolved fields. The first 40 minutes need **no database and no login**, so you do not wait for Abdul Wahab.

> **Why this part is graded hardest:** judges paste a modified transcript and check that the output changes. Never hardcode the answer. Keep the prompt generic (rules about final decisions, rejected features, unknown people), not transcript-specific.

## Step 0: Prepare (0:00 to 0:08)

- Get the LLM API key, confirm the exact model name you will use, and test it once in the provider console.
- Copy the transcript from Section 7 of the challenge PDF (from `Meeting: NovaWorks Client Delivery Planning` to the last line) into `scripts/transcript.txt`. Delete the page-footer lines the PDF adds (the ones starting `THE INFINITY HACK`).
- Clone the repo when Abdul Wahab pushes the scaffold, then create `.env` from the values Abdul Wahab sends you.

## Step 1: Zod schema (0:08)

**src/lib/ai/schema.ts**

```ts
import { z } from "zod";

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be a date in YYYY-MM-DD format");

export const TaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().default(""),
  assigneeId: z.string().min(1),
  deadline: dateStr,
  estimatedHours: z.number().positive(),
});

export const ProjectSchema = z.object({
  name: z.string().min(1),
  clientName: z.string().min(1),
  description: z.string().optional().default(""),
  managerId: z.string().min(1),
  deadline: dateStr,
  tasks: z.array(TaskSchema),
});

export const DraftSchema = z.object({ projects: z.array(ProjectSchema).min(1) });

export type Draft = z.infer<typeof DraftSchema>;
```

## Step 2: Prompt (0:12). Generic rules only

The rules map to the traps in the brief (corrected values, rejected features, people who are not employees, tasks that share an owner) without naming this transcript's answers.

**src/lib/ai/prompt.ts**

```ts
export type DirectoryEntry = { id: string; name: string; role: string; skills: string[] };

export const SYSTEM_PROMPT = [
  "You convert a meeting transcript into project-management records for NovaWorks Technologies.",
  "Return ONLY one JSON object in the shape given by the user. No prose and no markdown fences.",
  "",
  "RULES",
  "1. Create one project per client engagement discussed. Never merge separate projects.",
  "2. managerId is the id of the person who is the project manager of that project.",
  "   assigneeId is the id of the person who owns that task. Match people to the DIRECTORY by",
  "   name (the transcript uses first names). Use only ids that appear in the DIRECTORY.",
  "3. FINAL DECISIONS WIN. Later corrections override earlier statements (deadlines, hours,",
  "   owners, task dates). A final recap near the end of the meeting is authoritative; if the",
  "   recap and earlier discussion differ, use the recap.",
  "4. Do NOT create tasks for features that were rejected, excluded, or deferred to future work.",
  "   You may mention such exclusions in a description, but never create a task for them.",
  "5. Only people in the DIRECTORY may be managers or assignees. Anyone else mentioned (client",
  "   contacts, end users, outsiders) must never appear. Never invent a person.",
  "6. One task per separately named deliverable that has its own owner, estimate and date.",
  "   Do not merge tasks that share an owner or a similar name. Do not split a task further.",
  "   Use the task names as they are spoken in the meeting.",
  "7. estimatedHours is the final agreed developer effort as a number of hours. It is not a count",
  "   of calendar days. Do not add management hours.",
  "8. Dates are YYYY-MM-DD. Use the meeting year stated in the transcript (2026 if not stated).",
  "   A task deadline must not be later than its project deadline.",
  "9. The project deadline is the final agreed delivery date of the whole project.",
  "10. description: one or two sentences of the agreed scope. For projects, include stated limits",
  "    of this phase (for example, demo only).",
  "11. If a required value cannot be determined, set it to null. Do not guess.",
].join("\n");

const SHAPE = {
  projects: [
    {
      name: "<project name>",
      clientName: "<client name>",
      description: "<agreed scope>",
      managerId: "<manager id from DIRECTORY>",
      deadline: "<YYYY-MM-DD>",
      tasks: [
        {
          title: "<task name>",
          description: "<task scope>",
          assigneeId: "<agent id from DIRECTORY>",
          deadline: "<YYYY-MM-DD>",
          estimatedHours: 8,
        },
      ],
    },
  ],
};

export function buildUserMessage(directory: DirectoryEntry[], transcript: string) {
  return [
    "DIRECTORY (the only valid people; use their id values):",
    JSON.stringify(directory, null, 2),
    "",
    "OUTPUT SHAPE (structure only; the values are placeholders, not the answer):",
    JSON.stringify(SHAPE, null, 2),
    "",
    "TRANSCRIPT:",
    transcript,
  ].join("\n");
}
```

## Step 3: LLM client and JSON extraction (0:16)

**src/lib/ai/client.ts**

```ts
import Anthropic from "@anthropic-ai/sdk";
import { HttpError } from "../http";

export async function callLLM(system: string, user: string): Promise<string> {
  try {
    const client = new Anthropic({
      apiKey: process.env.LLM_API_KEY,
      timeout: Number(process.env.LLM_TIMEOUT_MS ?? 60000),
    });
    const res = await client.messages.create({
      model: process.env.LLM_MODEL as string,
      max_tokens: 8000,
      temperature: 0,
      system,
      messages: [{ role: "user", content: user }],
    });
    return res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  } catch (e) {
    console.error("LLM error", e);
    throw new HttpError(502, "AI service unavailable, try again");
  }
}

// Tolerates code fences or stray text around the JSON object.
export function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new HttpError(502, "Could not understand AI output, try again");
  }
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new HttpError(502, "Could not understand AI output, try again");
  }
}
```

> **Using OpenAI instead?** `npm i openai`, then replace the body of `callLLM` with `client.chat.completions.create({ model, temperature: 0, response_format: { type: "json_object" }, messages: [{ role: "system", content: system }, { role: "user", content: user }] })` and return `choices[0].message.content`. If your model rejects `temperature`, remove that line.

## Step 4: Validator, a pure function (0:20)

This is separate from the database on purpose: it takes a `roleById` map, so you can test it before the DB is wired in. It collects **all** issues instead of stopping at the first, so the admin can fix everything in one pass.

**src/lib/ai/validate.ts**

```ts
import { DraftSchema, type Draft } from "./schema";

export type Issue = { path: string; message: string };
export type ValidationResult = { ok: true; draft: Draft } | { ok: false; issues: Issue[] };

function dateProblem(s: string): string | null {
  const d = new Date(s + "T00:00:00Z");
  if (isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) {
    return '"' + s + '" is not a valid calendar date';
  }
  if (!s.startsWith("2026-")) return '"' + s + '" is not in 2026';
  return null;
}

export function validateDraft(raw: unknown, roleById: Map<string, string>): ValidationResult {
  const parsed = DraftSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message.includes("received null")
          ? "Could not be resolved from the transcript. Please correct it."
          : i.message,
      })),
    };
  }

  const draft = parsed.data;
  const issues: Issue[] = [];

  draft.projects.forEach((p, pi) => {
    const pp = "projects." + pi;
    if (roleById.get(p.managerId) !== "MANAGER") {
      issues.push({ path: pp + ".managerId", message: '"' + p.managerId + '" is not a known manager' });
    }
    const pDate = dateProblem(p.deadline);
    if (pDate) issues.push({ path: pp + ".deadline", message: pDate });

    p.tasks.forEach((t, ti) => {
      const tp = pp + ".tasks." + ti;
      if (roleById.get(t.assigneeId) !== "AGENT") {
        issues.push({ path: tp + ".assigneeId", message: '"' + t.assigneeId + '" is not a known developer' });
      }
      const tDate = dateProblem(t.deadline);
      if (tDate) issues.push({ path: tp + ".deadline", message: tDate });
      else if (!pDate && t.deadline > p.deadline) {
        issues.push({ path: tp + ".deadline", message: "is after the project deadline " + p.deadline });
      }
    });
  });

  return issues.length ? { ok: false, issues } : { ok: true, draft };
}
```

## Step 5: Test script against the answer key (0:24)

This calls the real LLM with a hardcoded directory and checks every row of the organizer answer key. No database or login needed. Run it with `npm run test:ai`.

**scripts/test-ai.ts**

```ts
import fs from "node:fs";
import { SYSTEM_PROMPT, buildUserMessage } from "../src/lib/ai/prompt";
import { callLLM, extractJson } from "../src/lib/ai/client";
import { validateDraft } from "../src/lib/ai/validate";

const D = (id: string, name: string, role: string, skills: string[]) => ({ id, name, role, skills });
const DIRECTORY = [
  D("PM01", "Ayesha Khan", "MANAGER", ["Web projects", "Client coordination"]),
  D("PM02", "Bilal Ahmed", "MANAGER", ["Mobile projects", "Delivery planning"]),
  D("PM03", "Hina Malik", "MANAGER", ["AI projects", "Requirement review"]),
  D("DEV01", "Ali Raza", "AGENT", ["React", "Frontend integration"]),
  D("DEV02", "Hamza Shah", "AGENT", ["Node.js", "Databases", "APIs"]),
  D("DEV03", "Sara Noor", "AGENT", ["Flutter", "Mobile UI"]),
  D("DEV04", "Usman Tariq", "AGENT", ["Flutter", "Integration", "Testing"]),
  D("DEV05", "Zain Abbas", "AGENT", ["LLMs", "Extraction", "Prompts"]),
  D("DEV06", "Maryam Asif", "AGENT", ["Retrieval", "Document processing"]),
];

// [title, assigneeId, deadline, hours]
const TASKS: [string, string, string, number][] = [
  ["Product catalog UI", "DEV01", "2026-10-12", 12],
  ["Demo cart UI", "DEV01", "2026-10-15", 8],
  ["Product and cart APIs", "DEV02", "2026-10-14", 14],
  ["Website integration and testing", "DEV01", "2026-10-19", 6],
  ["Login and profile screens", "DEV03", "2026-10-12", 8],
  ["Service booking screens", "DEV03", "2026-10-17", 12],
  ["Booking and account APIs", "DEV02", "2026-10-16", 16],
  ["Mobile integration and testing", "DEV04", "2026-10-22", 10],
  ["FAQ document processing", "DEV06", "2026-10-13", 10],
  ["Assistant answer generation", "DEV05", "2026-10-17", 14],
  ["Human escalation flow", "DEV05", "2026-10-18", 6],
  ["Assistant evaluation and testing", "DEV06", "2026-10-21", 8],
];
// [name contains, managerId, deadline]
const PROJECTS: [string, string, string][] = [
  ["UrbanCart", "PM01", "2026-10-20"],
  ["QuickServe", "PM02", "2026-10-24"],
  ["HelpDeskPro", "PM03", "2026-10-22"],
];

async function main() {
  const file = process.argv[2] ?? "scripts/transcript.txt";
  const transcript = fs.readFileSync(file, "utf8");
  const text = await callLLM(SYSTEM_PROMPT, buildUserMessage(DIRECTORY, transcript));
  const raw = extractJson(text);
  fs.writeFileSync("scripts/last-output.json", JSON.stringify(raw, null, 2));

  const result = validateDraft(raw, new Map(DIRECTORY.map((d) => [d.id, d.role])));
  if (!result.ok) {
    console.log("VALIDATION ISSUES", result.issues);
    return;
  }
  const projects = result.draft.projects;
  const tasks = projects.flatMap((p) => p.tasks);
  console.log(projects.length === 3 ? "PASS" : "FAIL", "3 projects, got", projects.length);
  console.log(tasks.length === 12 ? "PASS" : "FAIL", "12 tasks, got", tasks.length);

  for (const [key, mgr, date] of PROJECTS) {
    const p = projects.find((x) => x.name.includes(key));
    const ok = p && p.managerId === mgr && p.deadline === date;
    console.log(ok ? "PASS" : "FAIL", "project", key, ok ? "" : JSON.stringify(p && { m: p.managerId, d: p.deadline }));
  }
  for (const [title, who, date, hours] of TASKS) {
    const t = tasks.find((x) => x.title.toLowerCase() === title.toLowerCase());
    const ok = t && t.assigneeId === who && t.deadline === date && t.estimatedHours === hours;
    console.log(ok ? "PASS" : "FAIL", title, ok ? "" : JSON.stringify(t));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

## Step 6: Run and tune (0:28 to 0:40)

1. Run `npm run test:ai`. The full model output is saved to `scripts/last-output.json` so you can inspect what went wrong.
2. Every line must say `PASS`: 3 projects, 12 tasks, three project deadlines and managers, and all 12 tasks.
3. If a trap fails, adjust the matching rule in `prompt.ts` (corrected values, extra tasks for rejected features, Kamran assigned, Hamza's tasks merged, Ali's two tasks merged). Re-run until stable. Run it three times in a row to check consistency.
4. Also check by eye: no task mentions payments, inventory, maps, or email sending, and no assignee is outside the directory.

**Changed-input test:** copy `transcript.txt` to `transcript-changed.txt` and edit three places so Usman's task becomes **12 hours, due 23 October**: (1) Usman's line `Make the final estimate 10 hours. Keep the task deadline at 22 October`, (2) Bilal's line `Final agreement: Mobile integration and testing, Usman, 10 hours, 22 October`, and (3) the recap line `Usman owns Mobile integration and testing: 10 hours, 22 October`. Leave the project deadline at 24 October. Then run `npm run test:ai -- scripts/transcript-changed.txt`. Only the `Mobile integration and testing` line should FAIL against the old key, now showing 12 and 2026-10-23, and the other 11 tasks should still PASS.

## Step 7: Service, validation plus transaction (0:40, after SYNC 1)

Now wire in the database. This is the all-or-nothing save: `db.$transaction` rolls everything back on any error. The in-flight set rejects a second concurrent request from the same admin with `409`.

**src/lib/services/transcript.service.ts**

```ts
import { db } from "../db";
import { HttpError } from "../http";
import type { CurrentUser } from "../session";
import { SYSTEM_PROMPT, buildUserMessage } from "../ai/prompt";
import { callLLM, extractJson } from "../ai/client";
import { validateDraft } from "../ai/validate";
import type { Draft } from "../ai/schema";

const inFlight = new Set<string>();   // per-instance guard against double submit

async function saveDraft(draft: Draft) {
  return db.$transaction(
    async (tx) => {
      const projects = [];
      for (const p of draft.projects) {
        const created = await tx.project.create({
          data: {
            name: p.name,
            clientName: p.clientName,
            description: p.description,
            managerId: p.managerId,
            deadline: new Date(p.deadline),
            tasks: {
              create: p.tasks.map((t) => ({
                title: t.title,
                description: t.description,
                assigneeId: t.assigneeId,
                deadline: new Date(t.deadline),
                estimatedHours: t.estimatedHours,
              })),
            },
          },
          include: { _count: { select: { tasks: true } } },
        });
        projects.push({ id: created.id, name: created.name, taskCount: created._count.tasks });
      }
      return projects;
    },
    { timeout: 20000 },
  );
}

export async function createFromTranscript(
  user: CurrentUser,
  input: { transcript?: unknown; draft?: unknown },
) {
  if (user.role !== "ADMIN") throw new HttpError(403, "Forbidden");
  if (inFlight.has(user.id)) throw new HttpError(409, "A conversion is already running");
  inFlight.add(user.id);

  try {
    let raw: unknown;
    if (input.draft !== undefined) {
      raw = input.draft;                       // correction mode: skip the AI call
    } else {
      const transcript = typeof input.transcript === "string" ? input.transcript.trim() : "";
      if (!transcript) throw new HttpError(400, "Transcript is empty");

      // Only id, name, role, skills go to the AI. No emails, no password hashes.
      const directory = await db.user.findMany({
        where: { role: { in: ["MANAGER", "AGENT"] } },
        select: { id: true, name: true, role: true, skills: true },
        orderBy: { id: "asc" },
      });
      raw = extractJson(await callLLM(SYSTEM_PROMPT, buildUserMessage(directory, transcript)));
    }

    const users = await db.user.findMany({ select: { id: true, role: true } });
    const result = validateDraft(raw, new Map(users.map((u) => [u.id, u.role as string])));
    if (!result.ok) {
      throw new HttpError(422, "Validation failed", {
        error: "Validation failed",
        issues: result.issues,
        draft: raw,
      });
    }

    const projects = await saveDraft(result.draft);
    return {
      created: {
        projectCount: projects.length,
        taskCount: projects.reduce((n, p) => n + p.taskCount, 0),
        projects,
      },
    };
  } finally {
    inFlight.delete(user.id);
  }
}
```

## Step 8: The route (0:48)

**src/app/api/transcript/create/route.ts**

```ts
import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/http";
import { requireUser } from "@/lib/session";
import { createFromTranscript } from "@/lib/services/transcript.service";

export const maxDuration = 60;   // the LLM call can take 10 to 40 seconds

export async function POST(req: Request) {
  try {
    const user = await requireUser();                       // 401 if not logged in
    const body = await req.json().catch(() => ({}));
    const result = await createFromTranscript(user, {      // 403 if not ADMIN
      transcript: body.transcript,
      draft: body.draft,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
```

## Step 9: End-to-end tests (0:55)

Log in as admin with a cookie jar (first command below), then run these. After each test that creates data, run `npm run reset`, because the route intentionally creates new rows every time.

**terminal (needs jq; otherwise use the frontend form or Postman)**

```bash
# log in as admin and keep the cookie
curl -s -c admin.jar -H "Content-Type: application/json" \
  -d '{"email":"admin@novaworks.example","password":"Demo123!"}' localhost:3000/api/auth/login

# build the request body from the transcript file, then post it
jq -Rs '{transcript: .}' scripts/transcript.txt | curl -s -b admin.jar \
  -H "Content-Type: application/json" -d @- localhost:3000/api/transcript/create
```

| Test | Expect | How to check |
| --- | --- | --- |
| Supplied transcript as admin | `201` | `projectCount` 3, `taskCount` 12. Then `/api/projects` shows 3 projects |
| Same call as Ali or Ayesha | `403` | No rows created |
| No login cookie | `401` |  |
| Empty or whitespace transcript | `400` | `Transcript is empty`. No AI call is made |
| Wrong `LLM_API_KEY` in `.env` | `502` | `AI service unavailable`. Zero projects in the DB |
| POST a draft with `assigneeId` `DEV99` or `Kamran` | `422` | Body has `issues` and `draft`. Zero projects saved |
| POST a draft with a task dated after its project | `422` | Issue path points at that task's `deadline` |
| POST the corrected draft | `201` | Saved without calling the AI (correction mode) |
| Two simultaneous submits (two terminals) | `409` on one | Only one set of 3 projects exists |
| Modified transcript (Step 6 edit) | `201` | The QuickServe integration task shows 12 hours, 2026-10-23 |

**Rollback proof (use in the demo video):** POST a draft where the last task of the last project has an unknown assignee. The result is `422` and `/api/projects` still shows zero new projects, even though the earlier projects in the same draft were valid. This demonstrates the all-or-nothing rule.

## Step 10: Hardening (1:05 to 1:25)

- Run the supplied transcript three more times against the live route (resetting between runs). Fix any flaky field with a clearer prompt rule rather than special-casing.
- Confirm the browser never sees the LLM key: it is read only in `client.ts`, and no variable starts with `NEXT_PUBLIC_`.
- Confirm server logs do not print the transcript, the key, or hashes.
- Give Abdul Wahab the three AI test steps for the README: login as admin, paste the transcript, expect 3 projects and 12 tasks; paste the changed transcript, expect the changed task; `npm run reset` to clear data.
- Sit with the frontend teammate and run the 422 correction flow in the UI: the `issues` paths look like `projects.2.tasks.1.assigneeId`.
- On Vercel the `maxDuration` of 60 seconds in the route applies. If the LLM call is cut off on the hosted app, the fallback is a local demo for the video.

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
