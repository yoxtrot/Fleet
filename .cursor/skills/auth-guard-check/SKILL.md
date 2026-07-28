---
name: auth-guard-check
description: >-
  Verifies Fleet login, signup, session restore, and protected route behavior.
  Use when changing auth, AuthProvider, ProtectedRoute, or login flows.
---

# Auth guard check

## Expected behavior

1. Unauthenticated users hitting `/`, `/vehicles`, or `/research` redirect to `/login`.
2. Signed-in users visiting `/login` redirect to `/`.
3. Session restores on refresh via `supabase.auth.getSession` + `onAuthStateChange`.
4. Sign out clears the session and returns the user to login on next protected navigation.
5. Missing/invalid `.env.local` shows the configured warning on the login page instead of a blank crash.

## Files to inspect

- `src/app/AuthProvider.tsx`
- `src/app/ProtectedRoute.tsx`
- `src/features/auth/LoginPage.tsx`
- `src/lib/supabase.ts`
- `docs/supabase-setup.md`

## Manual test script

1. Clear site data for localhost.
2. Open `/vehicles` → should land on `/login`.
3. Create account / sign in.
4. Confirm home dashboard loads.
5. Refresh → still signed in.
6. Sign out → protected routes require login again.
