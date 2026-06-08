export const SUPPORTED_LANGS = ['pl', 'en', 'uk']
export const DEFAULT_LANG = 'pl'

export const getBrowserLang = () => {
  if (typeof window === 'undefined') return DEFAULT_LANG
  const nav = navigator.language || navigator.userLanguage || navigator.browserLanguage || ''
  const code = nav.toLowerCase().split('-')[0]
  if (code === 'uk') return 'uk'
  if (code === 'en') return 'en'
  return 'pl'
}

export const resolveLang = (profileLang) => {
  if (profileLang && SUPPORTED_LANGS.includes(profileLang)) return profileLang
  return getBrowserLang()
}
