'use client'

import React, { useState } from 'react'
import { useAuth } from '../../src/lib/AuthProvider'
import { supabase } from '../../src/lib/supabaseClient'

export default function AccountPage() {
  const { user, role, loading } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const submit = async e => {
    e.preventDefault()
    setError('')
    setNotice('')
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setBusy(true)
    try {
      const { error: e2 } = await supabase.auth.updateUser({ password })
      if (e2) { setError(e2.message); return }
      setNotice('Password updated successfully.')
      setPassword('')
      setConfirm('')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <p>Loading…</p>
  if (!user) {
    return <div className="card"><h1>My account</h1><p className="muted">Please sign in to manage your account.</p></div>
  }

  return (
    <div className="stack">
      <div className="page-header"><h1>My account</h1></div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <h3>Profile</h3>
          <div className="field"><label>Email</label><input value={user.email || ''} readOnly disabled /></div>
          <div className="field"><label>Role</label><input value={role || ''} readOnly disabled style={{ textTransform: 'capitalize' }} /></div>
          <p className="muted" style={{ margin: 0, fontSize: 13 }}>Your role is set by an administrator.</p>
        </div>

        <div className="card">
          <h3>Change password</h3>
          <form onSubmit={submit}>
            <div className="field">
              <label>New password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="min 8 characters" />
            </div>
            <div className="field">
              <label>Confirm new password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} />
            </div>
            {error && <p className="form-error">{error}</p>}
            {notice && <p className="form-ok">{notice}</p>}
            <button type="submit" className="btn green" disabled={busy}>{busy ? 'Updating…' : 'Update password'}</button>
          </form>
        </div>
      </div>
    </div>
  )
}
