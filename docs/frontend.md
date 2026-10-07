# Frontend notes

The UI follows `Design.md` and talks to the backend only through `src/lib/api.ts`, using the API contract in Section 5 of the Person 1 and Person 2 docs. It never decides access: every screen shows what the server returns for the current session.

## Run the UI without the backend

```sh
# .env.local
NEXT_PUBLIC_USE_MOCK_API="true"
```

`npm run dev` then uses `src/lib/mock/mock-transport.ts`, an in-browser copy of the same HTTP contract with the ten demo users (password `Demo123!`). Use it only for development. With the flag off (the default), the app always calls the real `/api/*` routes and the real AI.

You can add these markers to a transcript to see each mock state: `[mock:422]` (correction flow), `[mock:502]` (AI failure), `[mock:unreadable]`, `[mock:409]`.

## What the UI expects from the API

- All routes and shapes match Section 5. `422` returns `{ issues: [{ path, message }], draft }`, with paths like `projects.2.tasks.1.assigneeId`.
- `GET /api/projects` may include `totalHours` on each project. When it's there, cards and the success summary show "4 tasks · 40 hours". To add it in `getProjects`, select `estimatedHours` for the scoped tasks and sum them.
- Project colors follow creation order, which comes from sorting the `cuid` ids.

## Where things live

| Path | What |
| --- | --- |
| `src/app/login` | Sign in, with the demo accounts box (hide it with `NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS=false`) |
| `src/app/(app)` | Signed-in screens: `/`, `/projects/[id]`, `/my-tasks`, `/team`, `/transcript` |
| `src/components/transcript` | Transcript workspace, which runs on one state: idle → working → success, correction or error |
| `src/lib/format.ts` | Shared date, hour, count and initials formatting |
| `src/lib/constants.ts` | Role navigation, project hues, demo accounts |
