'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../lib/AuthProvider'
import LoginModal from './LoginModal'

function displayName(user) {
  return user?.user_metadata?.full_name || user?.email || ''
}

export default function Header() {
  const { user, role, isAdmin, loading, signOut } = useAuth()
  const [showLogin, setShowLogin] = useState(false)

  return (
    <header className="app-header">
      <div className="brand">
        <Link href="/" className="logo" style={{ textDecoration: 'none' }}>
          Infra<span className="accent">Credit</span>
        </Link>
        <div className="title">TAF Management System 1.0</div>
      </div>
      <div className="user-area">
        {loading ? null : user ? (
          <>
            {isAdmin && <Link href="/admin/users" className="btn small">Users</Link>}
            <div className="user-name">
              {displayName(user)}
              <span className="role">{role || ''}</span>
            </div>
            <button className="btn small" onClick={signOut}>Logout</button>
          </>
        ) : (
          <button className="btn small" onClick={() => setShowLogin(true)}>Login</button>
        )}
      </div>
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </header>
  )
}
