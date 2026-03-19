export const LANGUAGE_STORAGE_KEY = "flexqr_language"
export const DEFAULT_LANGUAGE = "en"
export const SUPPORTED_LANGUAGES = ["en", "pt"] as const

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number]


export function normalizeLanguage(value?: string | null): AppLanguage {
  const normalizedValue = value?.toLowerCase().trim()

  if (!normalizedValue) {
    return DEFAULT_LANGUAGE
  }

  if (normalizedValue.startsWith("pt")) {
    return "pt"
  }

  return "en"
}


export function getStoredLanguage(): AppLanguage | null {
  const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY)
  return storedLanguage ? normalizeLanguage(storedLanguage) : null
}


export function detectBrowserLanguage(): AppLanguage {
  const preferredLanguages = navigator.languages?.length ? navigator.languages : [navigator.language]

  for (const language of preferredLanguages) {
    const normalizedLanguage = normalizeLanguage(language)
    if (SUPPORTED_LANGUAGES.includes(normalizedLanguage)) {
      return normalizedLanguage
    }
  }

  return DEFAULT_LANGUAGE
}


export function getInitialLanguage(): AppLanguage {
  return getStoredLanguage() || detectBrowserLanguage()
}


export function persistLanguage(language: string) {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, normalizeLanguage(language))
}


export function getDocumentLanguage(language: string): string {
  return normalizeLanguage(language) === "pt" ? "pt-BR" : "en"
}


export function getNextLanguage(language: string): AppLanguage {
  return normalizeLanguage(language) === "en" ? "pt" : "en"
}
