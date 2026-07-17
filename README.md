# InfraTAF UI prototype

This is a small **Next.js (App Router) + React** prototype for the InfraTAF Management System. The front-end is intended to be deployed to Vercel and the backend/data/auth to Supabase.

## Quick start

1. Copy `.env.example` to `.env.local` and fill the Supabase values:

```bash
cp .env.example .env.local
# then edit .env.local and set values
```

2. Install dependencies and run locally:

```bash
npm install
npm run dev
```

The app runs at http://localhost:3000. It works without Supabase configured — it falls back to the bundled sample data in `src/data/sample.js`.

## Supabase setup

- Create a Supabase project at https://app.supabase.com
- In project settings > API, copy the values into your env file:
  - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public, browser-exposed)
  - `SUPABASE_SERVICE_ROLE_KEY` — the **service_role** key. **Server-only**; never prefix it with `NEXT_PUBLIC_` and never expose it to the browser. It is used only by the `/api/users` route to create users.
- Run `db/supabase_setup.sql` in the Supabase SQL editor. It creates the `partners`, `milestones`, `kpis`, and `profiles` tables, RLS policies, a role helper function, and a trigger that gives every new auth user a profile.

## Roles & access

Access is controlled by a `role` on each user's row in the `profiles` table:

| Role | Can view | Can edit data | Can manage users |
|------|:--------:|:-------------:|:----------------:|
| (not signed in) | ✅ | — | — |
| `viewer` | ✅ | — | — |
| `editor` | ✅ | ✅ | — |
| `admin`  | ✅ | ✅ | ✅ |

- Viewing the dashboard is public; editing requires `editor`/`admin` (enforced by RLS, not just the UI).
- Admins get a **Users** link in the header → `/admin/users`, where they create `editor`/`admin`/`viewer` accounts (email + password). This calls the server-side `/api/users` route, which verifies the caller is an admin and uses the service_role key to create the user.

### Bootstrapping the first admin (one-time)

There is no admin yet to create the first one, so:

1. In the Supabase dashboard → **Authentication → Users → Add user**, create your account (set a password and mark it confirmed).
2. In the SQL editor, promote it:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
3. Log in to the app → the **Users** link appears → create everyone else from there.

## Deploying to Vercel

- Connect your Git repo to Vercel. Vercel auto-detects Next.js — no build config needed.
- In Vercel project settings > Environment Variables, add all three: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
- Deploy; Vercel runs `next build`.

## Structure

- `app/` — App Router entry: `layout.jsx` (shell + providers), `page.jsx` (dashboard), `partner/[id]/page.jsx` (partner detail).
- `src/lib/DataProvider.jsx` — client context holding partner data (Supabase with sample-data fallback).
- `src/lib/supabaseClient.js` — Supabase client; degrades to a safe stub when env vars are missing.
- `src/pages/`, `src/components/` — the dashboard, partner detail, header, and edit modal (client components).

## Notes

- You'll need to implement RLS policies and server-side functions as needed for production.
- Env vars use the `NEXT_PUBLIC_` prefix so they are exposed to the browser (required for the anon-key Supabase client).
