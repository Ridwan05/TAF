import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../src/lib/supabaseAdmin'
import { ALL_ROLES, canManageUsersRole, roleFromUser } from '../../../src/lib/roles'

// Resolve the caller from their bearer token and confirm they may manage users.
// Returns { admin, caller } on success or { error, status } to short-circuit.
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

  return { admin, caller: userData.user }
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

export async function PATCH(request) {
  const gate = await requireUserManager(request)
  if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status })

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const id = (body.id || '').trim()
  const role = body.role
  const password = body.password

  if (!id) return NextResponse.json({ error: 'User id is required' }, { status: 400 })
  if (role === undefined && !password) {
    return NextResponse.json({ error: 'Nothing to update (provide role and/or password)' }, { status: 400 })
  }
  if (role !== undefined && !ALL_ROLES.includes(role)) {
    return NextResponse.json({ error: `Role must be one of: ${ALL_ROLES.join(', ')}` }, { status: 400 })
  }
  if (password && password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  // Safety: don't let an admin demote themselves (risks locking out user management).
  if (role !== undefined && id === gate.caller.id && !canManageUsersRole(role)) {
    return NextResponse.json({ error: 'You cannot remove your own admin role' }, { status: 400 })
  }

  const updates = {}
  if (password) updates.password = password
  if (role !== undefined) {
    // Merge role into existing metadata so other keys are preserved.
    const { data: existing, error: getErr } = await gate.admin.auth.admin.getUserById(id)
    if (getErr || !existing?.user) {
      return NextResponse.json({ error: getErr?.message || 'User not found' }, { status: 404 })
    }
    updates.app_metadata = { ...(existing.user.app_metadata || {}), role }
    updates.user_metadata = { ...(existing.user.user_metadata || {}), role }
  }

  const { data: updated, error } = await gate.admin.auth.admin.updateUserById(id, updates)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({
    user: { id: updated.user.id, email: updated.user.email, role: roleFromUser(updated.user) }
  })
}
