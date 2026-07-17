'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
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

  // Load the user's role from their profile whenever the user changes.
  useEffect(() => {
    let mounted = true
    if (!user) {
      setRole(null)
      return
    }
    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (mounted) setRole(data?.role ?? 'viewer')
      })
    return () => { mounted = false }
  }, [user])

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setRole(null)
  }

  // Returns the current session's access token, for authenticating API routes.
  const getAccessToken = async () => {
    const { data } = await supabase.auth.getSession()
    return data?.session?.access_token ?? null
  }

  const isAdmin = role === 'admin'
  const canEdit = role === 'editor' || role === 'admin'

  return (
    <AuthContext.Provider
      value={{ user, role, isAdmin, canEdit, loading, signIn, signOut, getAccessToken }}
    >
      {children}
    </AuthContext.Provider>
  )
}
