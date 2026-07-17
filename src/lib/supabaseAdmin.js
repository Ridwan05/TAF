import { createClient } from '@supabase/supabase-js'

// SERVER-ONLY. This client uses the service_role key, which bypasses RLS and
// can manage users. It must never be imported into client components or code
// that ships to the browser — only into server API routes.
//
// Created lazily inside a function (not at module load) so a missing key
// surfaces as a clean runtime error in the route rather than breaking the build.
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error(
      'Supabase admin client not configured: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    )
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}
