# Fleet agent guidance

This repo is a practice ground for Cursor agent workflows (rules, skills, and subagents) while building a personal garage app.

## Always-on rules

- `.cursor/rules/coding-philosophy.mdc` — readable names over comments
- `.cursor/rules/react-patterns.mdc` — feature-folder React conventions
- `.cursor/rules/supabase-data.mdc` — client-side Supabase + RLS safety

## Project skills

Use these intentionally while working:

| Skill | When |
| --- | --- |
| `fleet-domain` | Changing vehicle / maintenance / research behavior or schema vocabulary |
| `add-supabase-table` | Adding a new Postgres table with RLS and a CRUD feature slice |
| `auth-guard-check` | Verifying login, session, and protected routes |
| `fleet-sprint` | Planning a sprint, adding tasks to the current sprint, or summarizing Linear cycle work |
| `update-database` | Applying pending Supabase migrations (`update the database`, push/sync migrations) |

Invoke with `@skill-name` or by describing the matching task (for example “help me plan a sprint”).

## Subagent habits to practice

1. **Explore first** for unfamiliar areas: ask an explore subagent to map `src/features/**` before a large change.
2. **Keep tasks small**: one feature slice per chat (for example “add oil-change reminder field”), not “finish the whole app”.
3. **Name the domain**: say `MaintenanceRecord` / `FixResearchNote` so the agent stays aligned with schema language.
4. **Point at docs**: for Auth setup questions, read `docs/supabase-setup.md` before inventing a custom backend.
5. **Review against philosophy**: after a change, ask whether names are clear enough that comments are unnecessary.

## Useful file map

- `src/app/` — auth provider, shell, router, route guards
- `src/features/auth|vehicles|maintenance|research|dashboard/` — feature UI + API helpers
- `src/lib/supabase.ts` — browser Supabase client (anon key only)
- `supabase/migrations/` — SQL schema + RLS policies
- `docs/` — human setup and coding philosophy
