'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../../src/lib/AuthProvider'
import { ALL_ROLES } from '../../../src/lib/roles'
import EditUserModal from '../../../src/components/EditUserModal'

export default function AdminUsersPage() {
  const { canManageUsers, loading, getAccessToken } = useAuth()

  const [users, setUsers] = useState([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('editor')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editingUser, setEditingUser] = useState(null)

  const authedFetch = useCallback(async (url, options = {}) => {
    const token = await getAccessToken()
    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })
  }, [getAccessToken])

  const loadUsers = useCallback(async () => {
    setError('')
    const res = await authedFetch('/api/users')
    const body = await res.json()
    if (!res.ok) { setError(body.error || 'Failed to load users'); return }
    setUsers(body.users || [])
  }, [authedFetch])

  useEffect(() => {
    if (canManageUsers) loadUsers()
  }, [canManageUsers, loadUsers])

  const saveUser = async (id, payload) => {
    const res = await authedFetch('/api/users', {
      method: 'PATCH',
      body: JSON.stringify({ id, ...payload })
    })
    const body = await res.json()
    if (!res.ok) throw new Error(body.error || 'Update failed')
    setNotice(`Updated ${body.user.email} (${body.user.role})`)
    loadUsers()
  }

  const createUser = async e => {
    e.preventDefault()
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const res = await authedFetch('/api/users', {
        method: 'POST',
        body: JSON.stringify({ email, password, role })
      })
      const body = await res.json()
      if (!res.ok) { setError(body.error || 'Failed to create user'); return }
      setNotice(`Created ${body.user.email} (${body.user.role})`)
      setEmail('')
      setPassword('')
      setRole('editor')
      loadUsers()
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <p>Loading…</p>
  if (!canManageUsers) {
    return (
      <div className="card">
        <h1>User management</h1>
        <p>Access denied. You must be an admin to manage users.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>User management</h1>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '360px 1fr' }}>
        <div className="card">
          <h3>Create user</h3>
          <form onSubmit={createUser}>
            <div className="field">
              <label>Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="text" required value={password} onChange={e => setPassword(e.target.value)} placeholder="min 8 characters" />
            </div>
            <div className="field">
              <label>Role</label>
              <select value={role} onChange={e => setRole(e.target.value)}>
                {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            {error && <p className="form-error">{error}</p>}
            {notice && <p className="form-ok">{notice}</p>}
            <button type="submit" className="btn green" disabled={busy}>
              {busy ? 'Creating…' : 'Create user'}
            </button>
          </form>
        </div>

        <div className="table-card card">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={3} style={{ padding: 18 }}>No users yet.</td></tr>
                ) : users.map(u => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td><span className="pill role">{u.role}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn ghost small" onClick={() => setEditingUser(u)}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={saveUser}
        />
      )}
    </div>
  )
}
