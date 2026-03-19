import React, { createContext, useContext, useEffect, useMemo, useState } from "react"

import { authApi, userApi } from "@/lib/api"
import { clearPersistedSession, getStoredAccessToken, getStoredUser, persistSession } from "@/lib/session"
import type { User } from "@/types/api"


interface AuthContextType {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (payload: { email: string; password: string }) => Promise<User>
  register: (payload: { name: string; email: string; password: string }) => Promise<User>
  authenticateWithGoogle: (idToken: string) => Promise<User>
  refreshUser: () => Promise<User | null>
  logout: () => void
}


const AuthContext = createContext<AuthContextType | undefined>(undefined)


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser())
  const [accessToken, setAccessToken] = useState<string | null>(() => getStoredAccessToken())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function restoreSession() {
      const storedToken = getStoredAccessToken()
      if (!storedToken) {
        if (active) {
          setUser(null)
          setAccessToken(null)
          setIsLoading(false)
        }
        return
      }

      try {
        const currentUser = await userApi.me(storedToken)
        if (!active) {
          return
        }
        setUser(currentUser)
        setAccessToken(storedToken)
        persistSession(storedToken, currentUser)
      } catch {
        if (!active) {
          return
        }
        clearPersistedSession()
        setUser(null)
        setAccessToken(null)
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void restoreSession()

    return () => {
      active = false
    }
  }, [])

  const commitSession = (nextAccessToken: string, nextUser: User) => {
    persistSession(nextAccessToken, nextUser)
    setAccessToken(nextAccessToken)
    setUser(nextUser)
  }

  const login = async (payload: { email: string; password: string }) => {
    const session = await authApi.login(payload)
    commitSession(session.token.accessToken, session.user)
    return session.user
  }

  const register = async (payload: { name: string; email: string; password: string }) => {
    const session = await authApi.register(payload)
    commitSession(session.token.accessToken, session.user)
    return session.user
  }

  const authenticateWithGoogle = async (idToken: string) => {
    const session = await authApi.google(idToken)
    commitSession(session.token.accessToken, session.user)
    return session.user
  }

  const refreshUser = async () => {
    const storedToken = getStoredAccessToken()
    if (!storedToken) {
      return null
    }

    try {
      const currentUser = await userApi.me(storedToken)
      commitSession(storedToken, currentUser)
      return currentUser
    } catch {
      clearPersistedSession()
      setUser(null)
      setAccessToken(null)
      return null
    }
  }

  const logout = () => {
    clearPersistedSession()
    setAccessToken(null)
    setUser(null)
  }

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      accessToken,
      isLoading,
      isAuthenticated: Boolean(user && accessToken),
      login,
      register,
      authenticateWithGoogle,
      refreshUser,
      logout,
    }),
    [accessToken, isLoading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}


export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
