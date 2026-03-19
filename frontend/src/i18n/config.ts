import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import {
  DEFAULT_LANGUAGE,
  getDocumentLanguage,
  getInitialLanguage,
  normalizeLanguage,
  persistLanguage,
  SUPPORTED_LANGUAGES,
} from "./language"
import enTranslations from "./locales/en.json"
import ptTranslations from "./locales/pt.json"

const initialLanguage = getInitialLanguage()

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      pt: { translation: ptTranslations },
    },
    lng: initialLanguage,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: [...SUPPORTED_LANGUAGES],
    nonExplicitSupportedLngs: true,
    interpolation: {
      escapeValue: false,
    },
  })

persistLanguage(initialLanguage)
document.documentElement.lang = getDocumentLanguage(initialLanguage)

i18n.on("languageChanged", (language) => {
  const normalizedLanguage = normalizeLanguage(language)
  persistLanguage(normalizedLanguage)
  document.documentElement.lang = getDocumentLanguage(normalizedLanguage)
})

export default i18n
