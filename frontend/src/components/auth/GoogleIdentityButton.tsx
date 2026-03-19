import { useEffect, useRef, useState } from "react"

import { GOOGLE_CLIENT_ID } from "@/lib/env"
import { isGoogleAuthConfigured, loadGoogleIdentityScript } from "@/lib/google"


interface GoogleIdentityButtonProps {
  mode: "login" | "register"
  onCredential: (credential: string) => Promise<void> | void
  disabled?: boolean
}


export function GoogleIdentityButton({
  mode,
  onCredential,
  disabled = false,
}: GoogleIdentityButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const callbackRef = useRef(onCredential)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    callbackRef.current = onCredential
  }, [onCredential])

  useEffect(() => {
    let active = true

    async function renderButton() {
      if (!containerRef.current) {
        return
      }

      if (!isGoogleAuthConfigured()) {
        setError("Google Sign-In is unavailable until VITE_GOOGLE_CLIENT_ID is configured.")
        return
      }

      try {
        await loadGoogleIdentityScript()
        if (!active || !containerRef.current || !window.google?.accounts?.id) {
          return
        }

        containerRef.current.innerHTML = ""
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            if (!response.credential) {
              return
            }
            await callbackRef.current(response.credential)
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        })

        window.google.accounts.id.renderButton(containerRef.current, {
          theme: "outline",
          size: "large",
          type: "standard",
          shape: "rectangular",
          text: mode === "register" ? "signup_with" : "signin_with",
          logo_alignment: "left",
          width: 320,
        })
        setIsReady(true)
        setError(null)
      } catch (renderError) {
        if (!active) {
          return
        }
        setError(renderError instanceof Error ? renderError.message : "Failed to load Google Sign-In.")
      }
    }

    void renderButton()

    return () => {
      active = false
      if (containerRef.current) {
        containerRef.current.innerHTML = ""
      }
    }
  }, [mode])

  return (
    <div className="space-y-2">
      <div className="relative min-h-10">
        <div
          ref={containerRef}
          className={disabled ? "pointer-events-none opacity-60" : undefined}
        />
        {!isReady && !error ? (
          <div className="h-10 w-full animate-pulse rounded-md border border-zinc-200 bg-zinc-50" />
        ) : null}
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  )
}
