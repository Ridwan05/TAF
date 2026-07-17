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
- Run `db/supabase_setup.sql` in the Supabase SQL editor. It is **additive only**: it creates the `partners`, `milestones`, and `kpis` tables, their RLS policies, and one helper function (`taf_user_role()`). It does **not** create or modify any `profiles` table, trigger, or existing users — so it is safe to run against a Supabase project shared with another app.

## Roles & access

Roles are read from the user's **auth metadata**, not a separate table. TAF checks
`app_metadata.role` first (authoritative — only settable by admins/service-role),
falling back to `user_metadata.role`. This lets TAF honor roles that a shared
project already assigns. Recognized roles and their TAF capabilities:

| Role | Can view | Can edit data | Can manage users |
|------|:--------:|:-------------:|:----------------:|
| (not signed in) | ✅ | — | — |
| `viewer` | ✅ | — | — |
| `editor` | ✅ | ✅ | — |
| `hr`     | ✅ | ✅ | — |
| `ceo`    | ✅ | ✅ | — |
| `admin`  | ✅ | ✅ | ✅ |

- Viewing the dashboard is public; editing requires `admin`/`ceo`/`hr`/`editor` (enforced by RLS via `taf_user_role()`, not just the UI). The edit/admin role sets are defined in `src/lib/roles.js`.
- Admins get a **Users** link in the header → `/admin/users`, where they create accounts (email + password + role). This calls the server-side `/api/users` route, which verifies the caller is an admin and uses the service_role key to create the user, writing the role to both `app_metadata` and `user_metadata`.

> **Security note:** `user_metadata` can be edited by the user themselves, so it is a
> weaker signal than `app_metadata`. TAF-created users get their role in `app_metadata`
> (which RLS trusts first). Pre-existing users whose role lives only in `user_metadata`
> could in principle change their own role; migrate important roles to `app_metadata`
> if that matters for your threat model.

### First admin

Any user whose metadata role is already `admin` can open **Users** and create the rest.
To promote an existing user to admin, set their role in the Supabase dashboard
(Authentication → the user → metadata) or via the admin API.

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
