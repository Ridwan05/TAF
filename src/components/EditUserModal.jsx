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
    <div className="modal-overlay" onMouseDown={onClose}>
      <form className="modal narrow" onMouseDown={e => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-header">
          <div>
            <h3>Edit user</h3>
            <p className="sub">{user.email}</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label>Role</label>
            <select value={role} onChange={e => setRole(e.target.value)}>
              {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="field">
            <label>New password</label>
            <input type="text" value={password} placeholder="leave blank to keep current"
              onChange={e => setPassword(e.target.value)} />
          </div>
          {error && <p className="form-error">{error}</p>}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="btn green" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
        </div>
      </form>
    </div>
  )
}
