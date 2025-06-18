"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useSupabase } from "./supabase-provider"

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const { supabase } = useSupabase()
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check active session
    const getSession = async () => {
      const { data } = await supabase.auth.getSession()
      // Only set user if email is confirmed
      const sessionUser = data.session?.user
      if (sessionUser && sessionUser.email_confirmed_at) {
        setUser(sessionUser)
      } else {
        setUser(null)
      }
      setIsLoading(false)
    }

    getSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const sessionUser = session?.user
      if (sessionUser && sessionUser.email_confirmed_at) {
        setUser(sessionUser)
      } else {
        setUser(null)
      }
      setIsLoading(false)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [supabase])

  const signUp = async (email, password) => {
    return await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
  }

  const signIn = async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password })
  }

  const signOut = async () => {
    return await supabase.auth.signOut()
  }

  const value = {
    user,
    isLoading,
    signUp,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}