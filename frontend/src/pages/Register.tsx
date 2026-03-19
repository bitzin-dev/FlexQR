import React, { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Check, Minus } from "lucide-react"

import { GoogleIdentityButton } from "@/components/auth/GoogleIdentityButton"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useAuth } from "@/context/AuthContext"
import { ApiError } from "@/lib/api"
import { evaluatePasswordStrength, type PasswordRequirementKey } from "@/lib/auth-validation"


function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallbackMessage
}


export function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { register, authenticateWithGoogle } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const passwordStrength = useMemo(() => evaluatePasswordStrength(password), [password])

  const passwordToneClassName = {
    weak: "bg-zinc-400",
    fair: "bg-zinc-500",
    good: "bg-zinc-700",
    strong: "bg-zinc-950",
  }[passwordStrength.tone]

  const passwordToneLabelKey = {
    weak: "auth.passwordStrengthWeak",
    fair: "auth.passwordStrengthFair",
    good: "auth.passwordStrengthGood",
    strong: "auth.passwordStrengthStrong",
  }[passwordStrength.tone]

  const passwordRequirementLabelKeys: Record<PasswordRequirementKey, string> = {
    length: "auth.passwordRuleLength",
    lowercase: "auth.passwordRuleLowercase",
    uppercase: "auth.passwordRuleUppercase",
    number: "auth.passwordRuleNumber",
    special: "auth.passwordRuleSpecial",
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!passwordStrength.isValid) {
      toast.error(t("auth.passwordInvalid"))
      return
    }

    setIsSubmitting(true)

    try {
      await register({ name: name.trim(), email, password })
      navigate("/dashboard")
    } catch (error) {
      toast.error(getErrorMessage(error, t("edit.error")))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleRegister = async (credential: string) => {
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
          <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
            {t("auth.name")}
          </label>
          <div className="mt-1">
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              disabled={isSubmitting}
              maxLength={120}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
        </div>

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
              autoComplete="new-password"
              required
              disabled={isSubmitting}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                {t("auth.passwordStrength")}
              </p>
              <span className="text-xs font-medium text-zinc-700">
                {password ? t(passwordToneLabelKey) : t("auth.passwordStrengthPending")}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-colors ${
                    index < passwordStrength.activeSegments ? passwordToneClassName : "bg-zinc-200"
                  }`}
                />
              ))}
            </div>

            <div className="mt-4 space-y-2">
              {passwordStrength.requirements.map((requirement) => (
                <div key={requirement.key} className="flex items-center gap-2 text-xs text-zinc-600">
                  {requirement.passed ? (
                    <Check className="h-3.5 w-3.5 text-zinc-900" />
                  ) : (
                    <Minus className="h-3.5 w-3.5 text-zinc-400" />
                  )}
                  <span>{t(passwordRequirementLabelKeys[requirement.key])}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !name.trim() || !email.trim() || !passwordStrength.isValid}
          >
            {isSubmitting ? t("auth.creatingAccount") : t("auth.register")}
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
        mode="register"
        onCredential={handleGoogleRegister}
        disabled={isSubmitting}
      />

      <div className="text-center text-sm">
        <span className="text-zinc-600">{t("auth.hasAccount")} </span>
        <Link to="/login" className="font-medium text-zinc-900 hover:underline">
          {t("auth.login")}
        </Link>
      </div>
    </div>
  )
}
