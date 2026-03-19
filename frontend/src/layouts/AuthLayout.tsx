import { Outlet } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Globe } from "lucide-react"
import { getNextLanguage, normalizeLanguage } from "@/i18n/language"

export function AuthLayout() {
  const { t, i18n } = useTranslation()
  const currentLanguage = normalizeLanguage(i18n.resolvedLanguage || i18n.language)

  const toggleLanguage = () => {
    void i18n.changeLanguage(getNextLanguage(currentLanguage))
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 bg-white border border-zinc-200 rounded-md shadow-sm transition-colors"
        >
          <Globe className="w-4 h-4" />
          {currentLanguage === "en" ? t("common.portuguese") : t("common.english")}
        </button>
      </div>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex items-center justify-center">
            <img src="/logo.svg" alt="FlexQR Logo" className="h-12 w-auto object-contain" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-zinc-900">
          {t("auth.welcomeBack")}
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-600">
          {t("auth.subtitle")}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-zinc-200">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
