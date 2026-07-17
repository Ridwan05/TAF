import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// When Supabase env vars are absent the app still runs against the bundled
// sample data. Rather than let createClient throw at import time, fall back to
// a minimal stub whose calls resolve to a "not configured" error, so callers
// hit their existing error-handling paths.
function createStub() {
  const notConfigured = () =>
    Promise.resolve({ data: null, error: new Error('Supabase not configured') })
  const query = {
    select: notConfigured,
    upsert: notConfigured,
    insert: notConfigured,
    delete: () => query,
    eq: notConfigured
  }
  return {
    from: () => query,
    auth: {
      getSession: async () => ({ data: { session: null } }),
      getUser: async () => ({ data: { user: null } }),
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: new Error('Supabase not configured')
      }),
      updateUser: async () => ({ data: { user: null }, error: new Error('Supabase not configured') }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } })
    }
  }
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createStub()
