import { GOOGLE_CLIENT_ID } from "@/lib/env"


let googleScriptPromise: Promise<void> | null = null


export function isGoogleAuthConfigured() {
  return Boolean(GOOGLE_CLIENT_ID)
}


export async function loadGoogleIdentityScript(): Promise<void> {
  if (window.google?.accounts?.id) {
    return
  }

  if (!GOOGLE_CLIENT_ID) {
    throw new Error("Google Sign-In is not configured. Set VITE_GOOGLE_CLIENT_ID in the frontend environment.")
  }

  if (!googleScriptPromise) {
    googleScriptPromise = new Promise<void>((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[src="https://accounts.google.com/gsi/client"]',
      )

      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(), { once: true })
        existingScript.addEventListener("error", () => reject(new Error("Failed to load Google Sign-In.")), {
          once: true,
        })
        return
      }

      const script = document.createElement("script")
      script.src = "https://accounts.google.com/gsi/client"
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error("Failed to load Google Sign-In."))
      document.head.appendChild(script)
    })
  }

  return googleScriptPromise
}
