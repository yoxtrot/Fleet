---
name: add-supabase-table
description: >-
  Adds a new Supabase Postgres table with RLS, TypeScript types, and a feature
  CRUD slice for Fleet. Use when creating a new database table or extending the
  schema with a new domain entity.
---

# Add a Supabase table

## Workflow

1. Add a dated SQL migration under `supabase/migrations/`.
2. Include `user_id uuid not null references auth.users(id) on delete cascade`.
3. Enable RLS and create select/insert/update/delete policies using `auth.uid() = user_id`.
4. Update `src/lib/database.types.ts` with `Row`, `Insert`, and `Update` types.
5. Create `src/features/<feature>/<feature>Api.ts` with named helpers.
6. Add routes/pages only if the feature needs UI in this change.
7. Document any dashboard SQL steps in `docs/supabase-setup.md` if setup instructions change.
8. Tell the user to say **update the database** (or run `npm run db:push`) so the new migration is applied to Supabase.

## Checklist

- [ ] Migration is idempotent enough for first-run setup docs (or clearly one-shot)
- [ ] RLS enabled before relying on the anon key
- [ ] No `service_role` usage in the client
- [ ] Names follow `fleet-domain` vocabulary
- [ ] API helpers throw on Supabase `error`
