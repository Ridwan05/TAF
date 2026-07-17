'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../lib/AuthProvider'
import LoginModal from './LoginModal'

function displayName(user) {
  return user?.user_metadata?.full_name || user?.email || ''
}

export default function Header() {
  const { user, role, canManageUsers, loading, signOut } = useAuth()
  const [showLogin, setShowLogin] = useState(false)

  return (
    <header className="app-header">
      <div className="brand">
        <Link href="/" className="logo">Infra<span className="accent">Credit</span></Link>
      </div>

      <div className="app-title">TAF Management System 1.0</div>

      <div className="user-area">
        {loading ? null : user ? (
          <>
            {canManageUsers && <Link href="/admin/users" className="btn ghost small">Users</Link>}
            <Link href="/account" className="user-name" style={{ textDecoration: 'none', color: 'inherit' }}>
              {displayName(user)}
              <span className="role">{role || ''}</span>
            </Link>
            <button className="btn ghost small" onClick={signOut}>Logout</button>
          </>
        ) : (
          <button className="btn small" onClick={() => setShowLogin(true)}>Login</button>
        )}
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </header>
  )
}
