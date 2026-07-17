'use client'

import React, { useState } from 'react'
import { useAuth } from '../lib/AuthProvider'

export default function LoginModal({ onClose }) {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async e => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await signIn(email, password)
      onClose()
    } catch (err) {
      setError(err?.message || 'Sign in failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{position:'fixed',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.3)',zIndex:50}}>
      <form onSubmit={submit} style={{width:360,background:'#fff',padding:24,borderRadius:12}}>
        <h3 style={{marginTop:0}}>Sign in</h3>
        <div style={{marginBottom:12}}>
          <label style={{fontWeight:700,display:'block',marginBottom:4}}>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{width:'100%',padding:8,borderRadius:6,border:'1px solid #d1d5db'}}
          />
        </div>
        <div style={{marginBottom:12}}>
          <label style={{fontWeight:700,display:'block',marginBottom:4}}>Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{width:'100%',padding:8,borderRadius:6,border:'1px solid #d1d5db'}}
          />
        </div>
        {error && <p style={{color:'#e74c3c',margin:'0 0 12px'}}>{error}</p>}
        <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
          <button type="button" className="btn" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="btn green" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </div>
      </form>
    </div>
  )
}
