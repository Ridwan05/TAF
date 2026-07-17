import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../src/lib/supabaseAdmin'

const VALID_ROLES = ['viewer', 'editor', 'admin']

// Resolve the caller from their bearer token and confirm they are an admin.
// Returns { admin } on success or { error, status } to short-circuit.
async function requireAdmin(request) {
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) return { error: 'Missing authorization token', status: 401 }

  let admin
  try {
    admin = getSupabaseAdmin()
  } catch (err) {
    return { error: err.message, status: 500 }
  }

  const { data: userData, error: userErr } = await admin.auth.getUser(token)
  if (userErr || !userData?.user) {
    return { error: 'Invalid or expired session', status: 401 }
  }

  const { data: profile, error: profErr } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single()

  if (profErr || profile?.role !== 'admin') {
    return { error: 'Admin access required', status: 403 }
  }

  return { admin }
}

export async function GET(request) {
  const gate = await requireAdmin(request)
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const { data, error } = await gate.admin
    .from('profiles')
    .select('id, email, role')
    .order('email', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ users: data ?? [] })
}

export async function POST(request) {
  const gate = await requireAdmin(request)
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status })

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const email = (body.email || '').trim()
  const password = body.password || ''
  const role = body.role || 'editor'

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: `Role must be one of: ${VALID_ROLES.join(', ')}` }, { status: 400 })
  }

  const { admin } = gate

  // Create the auth user (confirmed so they can log in immediately).
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role }
  })

  if (createErr) {
    return NextResponse.json({ error: createErr.message }, { status: 400 })
  }

  // Ensure the profile row exists with the chosen role (the DB trigger also
  // does this; the upsert makes it robust if the trigger isn't installed).
  const { error: profErr } = await admin
    .from('profiles')
    .upsert({ id: created.user.id, email, role }, { onConflict: 'id' })

  if (profErr) {
    return NextResponse.json(
      { error: `User created but role assignment failed: ${profErr.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json({
    user: { id: created.user.id, email, role }
  })
}
