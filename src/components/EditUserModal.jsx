'use client'

import React, { useState } from 'react'
import { ALL_ROLES } from '../lib/roles'

// `onSave(id, { role, password })` should perform the PATCH and resolve, or
// throw an Error whose message is shown to the user.
export default function EditUserModal({ user, onClose, onSave }) {
  const [role, setRole] = useState(user.role)
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async e => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const payload = {}
      if (role !== user.role) payload.role = role
      if (password) payload.password = password
      if (Object.keys(payload).length === 0) {
        setError('Change the role or enter a new password.')
        return
      }
      await onSave(user.id, payload)
      onClose()
    } catch (err) {
      setError(err?.message || 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', zIndex: 50 }}>
      <form onSubmit={submit} style={{ width: 380, background: '#fff', padding: 24, borderRadius: 12 }}>
        <h3 style={{ marginTop: 0 }}>Edit user</h3>
        <p style={{ marginTop: 0, color: '#6b7280' }}>{user.email}</p>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontWeight: 700, display: 'block', marginBottom: 4 }}>Role</label>
          <select value={role} onChange={e => setRole(e.target.value)}
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }}>
            {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontWeight: 700, display: 'block', marginBottom: 4 }}>New password</label>
          <input type="text" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="leave blank to keep current"
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #d1d5db' }} />
        </div>

        {error && <p style={{ color: '#e74c3c', margin: '0 0 12px' }}>{error}</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="btn" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="btn green" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
        </div>
      </form>
    </div>
  )
}
