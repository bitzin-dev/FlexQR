import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { CheckCircle2, Copy } from "lucide-react"

import { Button } from "@/components/ui/Button"
import { ApiError, qrCodeApi } from "@/lib/api"
import type { QRCodeAccessResult } from "@/types/api"


function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallbackMessage
}


export function Redirect() {
  const { shortCode } = useParams<{ shortCode: string }>()
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [accessResult, setAccessResult] = useState<QRCodeAccessResult | null>(null)

  useEffect(() => {
    let active = true

    async function resolveShortCode() {
      if (!shortCode) {
        setErrorMessage(t("redirect.notFound"))
        setIsLoading(false)
        return
      }

      try {
        const result = await qrCodeApi.registerAccess(shortCode)
        if (!active) {
          return
        }

        if (result.actionType === "redirect" && result.targetUrl) {
          window.location.replace(result.targetUrl)
          return
        }

        setAccessResult(result)
      } catch (error) {
        if (!active) {
          return
        }
        setErrorMessage(getErrorMessage(error, t("redirect.notFound")))
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void resolveShortCode()

    return () => {
      active = false
    }
  }, [shortCode, t])

  const handleCopyPix = async () => {
    const pixCode = accessResult?.copyValue
    if (!pixCode) {
      return
    }

    await navigator.clipboard.writeText(pixCode)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">404</h1>
          <p className="text-zinc-600">{errorMessage}</p>
        </div>
      </div>
    )
  }

  if (isLoading || !accessResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-600">{t("redirect.redirecting")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">{t("redirect.payPix")}</h1>
          <p className="text-zinc-500 text-sm">{t("redirect.pixDesc")}</p>
        </div>

        <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 break-all text-left text-sm font-mono text-zinc-700 h-32 overflow-y-auto">
          {accessResult.copyValue}
        </div>

        <Button
          onClick={() => void handleCopyPix()}
          className={`w-full h-12 text-base gap-2 transition-all ${copied ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
        >
          {copied ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              {t("redirect.copied")}
            </>
          ) : (
            <>
              <Copy className="w-5 h-5" />
              {t("redirect.copyPix")}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
