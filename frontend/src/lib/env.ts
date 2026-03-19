const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000/api/v1"
const DEFAULT_PUBLIC_APP_URL = "http://127.0.0.1:5173"

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, "")
}

function resolvePublicAppUrl() {
  const configuredPublicAppUrl = import.meta.env.VITE_PUBLIC_APP_URL?.trim()
  if (configuredPublicAppUrl) {
    return normalizeBaseUrl(configuredPublicAppUrl)
  }

  if (typeof window !== "undefined") {
    return normalizeBaseUrl(window.location.origin)
  }

  return DEFAULT_PUBLIC_APP_URL
}

export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL)
export const PUBLIC_APP_URL = resolvePublicAppUrl()
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ""
