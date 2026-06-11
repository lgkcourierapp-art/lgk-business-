'use client'
import { useState, useEffect } from 'react'

export default function LangSwitcher() {
  const [lang, setLang] = useState('pl')

  useEffect(() => {
    const browserLang = navigator.language?.split('-')[0]?.toLowerCase()
    const detected = ['pl', 'en', 'uk'].includes(browserLang) ? browserLang : 'pl'
    setLang(detected)
  }, [])

  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {['PL', 'EN', 'UK'].map(l => (
        <button
          key={l}
          onClick={() => setLang(l.toLowerCase())}
          style={{
            padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700,
            background: lang === l.toLowerCase() ? '#D4FF00' : 'transparent',
            color: lang === l.toLowerCase() ? '#0A0A0A' : '#888',
            border: `1px solid ${lang === l.toLowerCase() ? '#D4FF00' : '#E5E5E5'}`,
            cursor: 'pointer',
          }}
        >{l}</button>
      ))}
    </div>
  )
}
