# Supabase setup for Fleet

Follow these steps once. You do not need to write backend server code — Supabase provides Auth and Postgres.

## 1. Create a Supabase project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and sign in (GitHub login is fine).
2. Click **New project**.
3. Choose an organization, project name (for example `fleet`), a strong database password (save it somewhere safe), and a region close to you.
4. Wait until the project finishes provisioning.

## 2. Copy API keys into the app

The dashboard no longer has a settings page named only **API**. Use **API Keys** (or the **Connect** button).

1. Open your project in the Supabase dashboard.
2. Get the **Project URL** from the **Connect** dialog (top of the project), or from environment-variable snippets. It looks like `https://YOUR_PROJECT_REF.supabase.co`.
3. Open **Project Settings → API Keys** and copy a **browser-safe** key:
   - **Legacy API Keys** tab: copy the **`anon` / `anon public`** key, or
   - **Publishable and secret API keys** tab: copy the **Publishable** key (`sb_publishable_...`)
4. In this repo, copy `.env.example` to `.env.local`:

```bash
copy .env.example .env.local
```

5. Paste your values:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_OR_PUBLISHABLE_KEY
```

6. Restart `npm run dev` after changing env vars.

**Never put `service_role`, `SUPABASE_SECRET_KEY`, or `sb_secret_...` in the frontend, `.env.local` for Vite, chat, or git.** Those keys bypass Row Level Security. If you ever paste a secret key somewhere public, rotate it immediately in **API Keys**.

The anon/publishable key is safe in the browser only because RLS protects your tables.

## 3. Configure Auth for local development

1. Open **Authentication → Sign In / Providers** (or **Providers**) and confirm **Email** is enabled.
2. For easiest local testing, turn **off** “Confirm email” so you can sign up and sign in immediately. You can turn confirmation back on later.
3. Open **Authentication → URL Configuration**:
   - Site URL: `http://localhost:5173`
   - Redirect URLs: add `http://localhost:5173/**`

## 4. Create the database tables

1. Open **SQL Editor** in the Supabase dashboard.
2. Paste the contents of [`supabase/migrations/20260728120000_initial_fleet_schema.sql`](../supabase/migrations/20260728120000_initial_fleet_schema.sql).
3. Run the query.
4. Confirm tables exist under **Table Editor**: `vehicles`, `maintenance_records`, `fix_research_notes`.
5. Confirm each table shows **RLS enabled**.

## 5. Enable vehicle photo storage

1. Open **SQL Editor** in the Supabase dashboard.
2. Paste the contents of [`supabase/migrations/20260728140000_vehicle_photos.sql`](../supabase/migrations/20260728140000_vehicle_photos.sql).
3. Run the query.
4. Confirm under **Storage** that the `vehicle-photos` bucket exists and is public (needed so the app can show images via public URLs).
5. Confirm `vehicles.photo_path` exists under **Table Editor**.

Photos are stored at `{user_id}/{vehicle_id}/photo.*`. Storage policies only allow the signed-in owner to upload, replace, or delete their own folder.

## 5b. Apply migrations from the CLI (recommended)

After the first manual setup, prefer applying new SQL files under `supabase/migrations/` with the Fleet script instead of pasting into the SQL Editor.

1. Create a [Supabase personal access token](https://supabase.com/dashboard/account/tokens).
2. Copy `.env.supabase.example` to `.env.supabase` and fill in:
   - `SUPABASE_ACCESS_TOKEN`
   - `SUPABASE_DB_PASSWORD` (database password)
   - `SUPABASE_PROJECT_ID` (optional if `.env.local` already has `VITE_SUPABASE_URL`)
3. From the repo root:

```bash
npm run db:push
```

Dry-run only:

```bash
npm run db:push:dry-run
```

In Cursor, saying **update the database** should trigger the `update-database` skill, which runs the same flow.

## 6. Create your account in the app

1. Run the app: `npm run dev`
2. Open `http://localhost:5173`
3. Use **Create account** with your email and a password (at least 6 characters).
4. Sign in.
5. Add a vehicle (optionally with a photo) to confirm reads/writes work.

Optional hardening for a personal app: after your account exists, disable new public signups in Auth settings so strangers cannot create accounts against your project.

## 7. Sanity checklist

- [ ] `.env.local` has real URL + anon/publishable key (no secret keys)
- [ ] Email auth enabled
- [ ] Site URL points at localhost
- [ ] Initial migration SQL ran without errors
- [ ] Vehicle photos migration SQL ran without errors
- [ ] You can sign up / sign in
- [ ] You can add a vehicle and see it in the list
- [ ] You can add/change a vehicle photo and see it on list and detail pages

## Common errors

| Message / symptom | Likely fix |
| --- | --- |
| Supabase is not configured yet | Create `.env.local` and restart Vite |
| relation "vehicles" does not exist | Run the migration SQL |
| column "photo_path" does not exist | Run the vehicle photos migration SQL |
| Bucket not found / storage upload failed | Run the vehicle photos migration SQL and confirm `vehicle-photos` exists |
| Invalid login credentials | Confirm email provider settings / password |
| new row violates row-level security | Make sure you are signed in and `user_id` matches `auth.uid()` |
| Looking for Settings → API and not finding it | Use **Settings → API Keys** or the **Connect** dialog instead |
