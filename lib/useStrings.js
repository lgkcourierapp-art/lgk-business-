'use client'
import { useState, useEffect, useCallback } from 'react'
import STRINGS from './strings.js'

const LANG_KEY = 'lgk_portal_lang'
const DEFAULT_LANG = 'pl'
const SUPPORTED = ['pl', 'en']

export const useStrings = () => {
  const [lang, setLangState] = useState(DEFAULT_LANG)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem(LANG_KEY)
      if (stored && SUPPORTED.includes(stored)) {
        setLangState(stored)
      } else {
        const browser = navigator.language?.substring(0, 2).toLowerCase()
        if (browser === 'en') setLangState('en')
      }
    } catch {}
  }, [])

  const setLang = useCallback((newLang) => {
    if (!SUPPORTED.includes(newLang)) return
    setLangState(newLang)
    try { localStorage.setItem(LANG_KEY, newLang) } catch {}
  }, [])

  const s = useCallback((key, vars = {}) => {
    const dict = STRINGS[lang] || STRINGS[DEFAULT_LANG]
    let str = dict[key] ?? STRINGS[DEFAULT_LANG][key] ?? key
    if (process.env.NODE_ENV === 'development' && str === key) {
      console.warn(`[strings] Missing key: "${key}" in ${lang}`)
    }
    Object.entries(vars).forEach(([k, v]) => {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
    })
    return str
  }, [lang])

  return { s, lang, setLang, mounted }
}

export default useStrings
