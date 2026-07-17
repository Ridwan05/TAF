'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../../src/lib/AuthProvider'

export default function AdminUsersPage() {
  const { isAdmin, loading, getAccessToken } = useAuth()

  const [users, setUsers] = useState([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('editor')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

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
    if (isAdmin) loadUsers()
  }, [isAdmin, loadUsers])

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
  if (!isAdmin) {
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
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontWeight: 700, display: 'block', marginBottom: 4 }}>Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontWeight: 700, display: 'block', marginBottom: 4 }}>Password</label>
              <input type="text" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="min 8 characters"
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontWeight: 700, display: 'block', marginBottom: 4 }}>Role</label>
              <select value={role} onChange={e => setRole(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }}>
                <option value="editor">Editor — can edit data</option>
                <option value="admin">Admin — can edit data and manage users</option>
                <option value="viewer">Viewer — read only</option>
              </select>
            </div>
            {error && <p style={{ color: '#e74c3c', margin: '0 0 12px' }}>{error}</p>}
            {notice && <p style={{ color: '#2d9f73', margin: '0 0 12px' }}>{notice}</p>}
            <button type="submit" className="btn green" disabled={busy}>
              {busy ? 'Creating…' : 'Create user'}
            </button>
          </form>
        </div>

        <div className="table-card card">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={2} style={{ padding: 18 }}>No users yet.</td></tr>
              ) : users.map(u => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td><span className="pill" style={{ background: '#4b6cb7' }}>{u.role}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
