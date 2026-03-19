import React, { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { GoogleIdentityButton } from "@/components/auth/GoogleIdentityButton"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useAuth } from "@/context/AuthContext"
import { ApiError } from "@/lib/api"


function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallbackMessage
}


export function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { login, authenticateWithGoogle } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      await login({ email, password })
      navigate("/dashboard")
    } catch (error) {
      toast.error(getErrorMessage(error, t("edit.error")))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleLogin = async (credential: string) => {
    setIsSubmitting(true)

    try {
      await authenticateWithGoogle(credential)
      navigate("/dashboard")
    } catch (error) {
      toast.error(getErrorMessage(error, t("edit.error")))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
            {t("auth.email")}
          </label>
          <div className="mt-1">
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={isSubmitting}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
            {t("auth.password")}
          </label>
          <div className="mt-1">
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={isSubmitting}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
        </div>

        <div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Connecting..." : t("auth.login")}
          </Button>
        </div>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-zinc-500">{t("common.or", "Or")}</span>
        </div>
      </div>

      <GoogleIdentityButton
        mode="login"
        onCredential={handleGoogleLogin}
        disabled={isSubmitting}
      />

      <div className="text-center text-sm">
        <span className="text-zinc-600">{t("auth.noAccount")} </span>
        <Link to="/register" className="font-medium text-zinc-900 hover:underline">
          {t("auth.register")}
        </Link>
      </div>
    </div>
  )
}
