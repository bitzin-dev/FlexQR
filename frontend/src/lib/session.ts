import type { User } from "@/types/api"

const ACCESS_TOKEN_STORAGE_KEY = "flexqr_access_token"
const USER_STORAGE_KEY = "flexqr_user"

export function getStoredAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
}

export function getStoredUser(): User | null {
  const rawValue = localStorage.getItem(USER_STORAGE_KEY)
  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue) as User
  } catch {
    localStorage.removeItem(USER_STORAGE_KEY)
    return null
  }
}

export function persistSession(accessToken: string, user: User) {
  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken)
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
}

export function clearPersistedSession() {
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY)
  localStorage.removeItem(USER_STORAGE_KEY)
}
