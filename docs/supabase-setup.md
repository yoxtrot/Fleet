# Supabase setup for Fleet

Follow these steps once. You do not need to write backend server code — Supabase provides Auth and Postgres.

## 1. Create a Supabase project

1. Go to [https://supabase.com](https://supabase.com) and sign in (GitHub login is fine).
2. Click **New project**.
3. Choose an organization, project name (for example `fleet`), a strong database password (save it somewhere safe), and a region close to you.
4. Wait until the project finishes provisioning.

## 2. Copy API keys into the app

1. In the Supabase dashboard, open **Project Settings → API**.
2. Copy **Project URL** and the **anon public** key.
3. In this repo, copy `.env.example` to `.env.local`:

```bash
copy .env.example .env.local
```

4. Paste your values:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

5. Restart `npm run dev` after changing env vars.

**Never put the `service_role` key in the frontend or commit it to git.** The anon key is safe to use in the browser only because Row Level Security protects your tables.

## 3. Configure Auth for local development

1. Open **Authentication → Providers** and confirm **Email** is enabled.
2. For easiest local testing, open Email settings and turn **off** “Confirm email” so you can sign up and sign in immediately. You can turn confirmation back on later.
3. Open **Authentication → URL Configuration**:
   - Site URL: `http://localhost:5173`
   - Redirect URLs: add `http://localhost:5173/**`

## 4. Create the database tables

1. Open **SQL Editor** in the Supabase dashboard.
2. Paste the contents of [`supabase/migrations/20260728120000_initial_fleet_schema.sql`](../supabase/migrations/20260728120000_initial_fleet_schema.sql).
3. Run the query.
4. Confirm tables exist under **Table Editor**: `vehicles`, `maintenance_records`, `fix_research_notes`.
5. Confirm each table shows **RLS enabled**.

## 5. Create your account in the app

1. Run the app: `npm run dev`
2. Open `http://localhost:5173`
3. Use **Create account** with your email and a password (at least 6 characters).
4. Sign in.

Optional hardening for a personal app: after your account exists, open **Authentication → Providers / Settings** and disable new public signups so strangers cannot create accounts against your project.

## 6. Sanity checklist

- [ ] `.env.local` has real URL + anon key
- [ ] Email auth enabled
- [ ] Site URL points at localhost
- [ ] Migration SQL ran without errors
- [ ] You can sign up / sign in
- [ ] You can add a vehicle and see it in the list

## Common errors

| Message / symptom | Likely fix |
| --- | --- |
| Supabase is not configured yet | Create `.env.local` and restart Vite |
| relation "vehicles" does not exist | Run the migration SQL |
| Invalid login credentials | Confirm email provider settings / password |
| new row violates row-level security | Make sure you are signed in and `user_id` matches `auth.uid()` |
