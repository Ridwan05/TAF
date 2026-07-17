import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../src/lib/supabaseAdmin'
import { ALL_ROLES, canManageUsersRole, roleFromUser } from '../../../src/lib/roles'

// Resolve the caller from their bearer token and confirm they may manage users.
// Returns { admin } on success or { error, status } to short-circuit.
async function requireUserManager(request) {
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

  if (!canManageUsersRole(roleFromUser(userData.user))) {
    return { error: 'Admin access required', status: 403 }
  }

  return { admin }
}

export async function GET(request) {
  const gate = await requireUserManager(request)
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status })

  const { data, error } = await gate.admin.auth.admin.listUsers({ perPage: 1000 })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const users = (data?.users ?? []).map(u => ({
    id: u.id,
    email: u.email,
    role: roleFromUser(u)
  }))
  return NextResponse.json({ users })
}

export async function POST(request) {
  const gate = await requireUserManager(request)
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
  if (!ALL_ROLES.includes(role)) {
    return NextResponse.json({ error: `Role must be one of: ${ALL_ROLES.join(', ')}` }, { status: 400 })
  }

  // Store the role in BOTH app_metadata (authoritative; not user-editable, so
  // it's what RLS trusts) and user_metadata (consistent with existing users).
  const { data: created, error: createErr } = await gate.admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role },
    user_metadata: { role }
  })

  if (createErr) {
    return NextResponse.json({ error: createErr.message }, { status: 400 })
  }

  return NextResponse.json({
    user: { id: created.user.id, email, role }
  })
}
