'use client'
import { useState, useEffect } from 'react'

export default function InstallPrompt() {
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (localStorage.getItem('lgk-pwa-installed') || localStorage.getItem('lgk-pwa-dismissed')) return

    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())
    const standalone = window.matchMedia('(display-mode: standalone)').matches
    if (standalone) return

    if (ios) {
      setIsIOS(true)
      setShow(true)
      return
    }

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      localStorage.setItem('lgk-pwa-installed', '1')
    }
    setShow(false)
    setDeferredPrompt(null)
  }

  const dismiss = () => {
    localStorage.setItem('lgk-pwa-dismissed', '1')
    setShow(false)
  }

  if (!show) return null

  return (
    <div style={{
      position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 9000,
      background: '#111111', border: '1px solid #D4FF0040',
      borderRadius: 14, padding: '16px 18px',
      display: 'flex', alignItems: 'center', gap: 14,
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      maxWidth: 480, margin: '0 auto',
    }}>
      <div style={{
        width: 40, height: 40, background: '#0A0A0A', borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, border: '1px solid #D4FF0040',
      }}>
        <span style={{ color: '#D4FF00', fontWeight: 900, fontSize: 16, fontFamily: 'monospace' }}>L°</span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#FFF', fontWeight: 700, fontSize: 14, marginBottom: 2 }}>
          LGK Business
        </div>
        {isIOS ? (
          <div style={{ color: '#888', fontSize: 12, lineHeight: 1.5 }}>
            Stuknij <strong style={{ color: '#D4FF00' }}>Udostępnij</strong> → <strong style={{ color: '#D4FF00' }}>Dodaj do ekranu głównego</strong>
          </div>
        ) : (
          <div style={{ color: '#888', fontSize: 12 }}>Działa offline · Bez App Store</div>
        )}
      </div>

      {!isIOS && (
        <button
          onClick={install}
          style={{ background: '#D4FF00', color: '#000', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}
        >
          Dodaj do ekranu głównego
        </button>
      )}

      <button
        onClick={dismiss}
        style={{ background: '#333', border: 'none', color: '#AAA', fontSize: 12, cursor: 'pointer', padding: '8px 12px', borderRadius: 8, flexShrink: 0, fontWeight: 600 }}
      >
        Nie teraz
      </button>
    </div>
  )
}
