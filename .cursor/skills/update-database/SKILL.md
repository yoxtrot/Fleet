---
name: update-database
description: >-
  Applies Fleet Supabase SQL migrations from supabase/migrations to the linked
  remote project. Use when the user says "update the database", "apply
  migrations", "push migrations", "sync the database", or asks to run pending
  Supabase schema changes against their project.
---

# Update the database

Apply local Fleet migrations to the user's remote Supabase project automatically.

## Phrases that should trigger this skill

Treat these (and close variants) as explicit requests to use this workflow:

- "update the database"
- "apply migrations"
- "push migrations"
- "sync the database"

## Prerequisites

Credentials live in **gitignored** `.env.supabase` (never commit them, never put them in Vite `VITE_*` vars):

1. Copy `.env.supabase.example` → `.env.supabase`
2. Set:
   - `SUPABASE_ACCESS_TOKEN` — [Personal access token](https://supabase.com/dashboard/account/tokens)
   - `SUPABASE_DB_PASSWORD` — database password from project creation / Settings → Database
   - `SUPABASE_PROJECT_ID` — project ref (also derived from `VITE_SUPABASE_URL` in `.env.local` if omitted)

Confirm `supabase/config.toml` exists and migrations are under `supabase/migrations/` (timestamp-prefixed `.sql` files).

## Workflow (agent must execute)

1. Read this skill and list files in `supabase/migrations/` (newest last).
2. Ensure `.env.supabase` exists. If missing, stop and tell the user to create it from `.env.supabase.example` — do not invent credentials.
3. Run from the repo root:

```bash
npm run db:push
```

On Windows PowerShell, ensure Node/Git are on `PATH` the same way as other Fleet commands.

4. Report the CLI output clearly:
   - Which migrations were applied (or that none were pending)
   - Any errors and the next fix
5. Optionally verify with a dry run first if the user sounds unsure:

```bash
npm run db:push:dry-run
```

## Failure handling

| Symptom | What to do |
| --- | --- |
| Missing token/password/project id | Point at `.env.supabase.example`; do not print secret values |
| Remote history missing older migrations | Re-run with include-all: `node scripts/apply-supabase-migrations.mjs --include-all` |
| Migration SQL errors | Fix the migration file; do not `--force` destructive resets unless the user explicitly asks |
| Not linked / config missing | Run `npx supabase init --yes` once, then retry `npm run db:push` |

## Safety

- Never commit `.env.supabase`, access tokens, or DB passwords.
- Never use the `service_role` / secret key in the Vite app or chat.
- Prefer applying migrations over editing production data by hand in the SQL editor.
- Do not run `db reset` against the remote project.
