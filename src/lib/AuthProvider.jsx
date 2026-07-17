'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { roleFromUser, canEditRole, canManageUsersRole } from './roles'

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setUser(data?.session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } = {} } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    )

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  // Returns the current session's access token, for authenticating API routes.
  const getAccessToken = async () => {
    const { data } = await supabase.auth.getSession()
    return data?.session?.access_token ?? null
  }

  // Role comes directly off the authenticated user's metadata (no DB lookup).
  const role = roleFromUser(user)
  const canEdit = canEditRole(role)
  const canManageUsers = canManageUsersRole(role)

  return (
    <AuthContext.Provider
      value={{ user, role, canEdit, canManageUsers, loading, signIn, signOut, getAccessToken }}
    >
      {children}
    </AuthContext.Provider>
  )
}
