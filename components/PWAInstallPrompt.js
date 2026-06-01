'use client'
import { useState, useEffect } from 'react'

const DISMISSED_KEY = 'lgk_pwa_dismissed'
const INSTALLED_KEY  = 'lgk_pwa_installed'
const LOGIN_KEY      = 'lgk_login_count'
const ORDER_KEY      = 'lgk_order_count'

function meetsThreshold() {
  try {
    const orders = parseInt(localStorage.getItem(ORDER_KEY) || '0', 10)
    const logins = parseInt(localStorage.getItem(LOGIN_KEY) || '0', 10)
    return orders >= 2 || logins >= 3
  } catch {
    return false
  }
}

export default function PWAInstallPrompt() {
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    // Never show on the login page
    if (window.location.pathname.startsWith('/login')) return

    // Never show if already dismissed or installed
    try {
      if (localStorage.getItem(DISMISSED_KEY) || localStorage.getItem(INSTALLED_KEY)) return
    } catch { return }

    // Never show if already running as standalone PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // Only show after the engagement threshold is met
    if (!meetsThreshold()) return

    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())
    setIsIOS(ios)

    if (ios) {
      setShow(true)
      return
    }

    // Non-iOS: capture the browser's install prompt
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
      try { localStorage.setItem(INSTALLED_KEY, '1') } catch {}
    }
    setShow(false)
    setDeferredPrompt(null)
  }

  const dismiss = () => {
    try { localStorage.setItem(DISMISSED_KEY, '1') } catch {}
    setShow(false)
  }

  if (!show) return null

  return (
    <div style={{
      position: 'fixed',
      // Sits above the BottomNav (~56px content) + safe-area, with 12px gap
      bottom: 'calc(68px + env(safe-area-inset-bottom))',
      left: 12,
      right: 12,
      maxWidth: 480,
      margin: '0 auto',
      zIndex: 9000,
      background: '#111111',
      border: '1px solid #D4FF0040',
      borderRadius: 14,
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    }}>
      <div style={{
        width: 38,
        height: 38,
        background: '#0A0A0A',
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        border: '1px solid #D4FF0040',
      }}>
        <span style={{ color: '#D4FF00', fontWeight: 900, fontSize: 15, fontFamily: 'monospace' }}>L°</span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#FFF', fontWeight: 700, fontSize: 13, marginBottom: 3 }}>
          Szybszy dostęp do zamówień
        </div>
        {isIOS ? (
          <div style={{ color: '#888', fontSize: 11, lineHeight: 1.5 }}>
            Stuknij <strong style={{ color: '#D4FF00' }}>Udostępnij</strong>{' '}
            →{' '}
            <strong style={{ color: '#D4FF00' }}>Dodaj do ekranu głównego</strong>
          </div>
        ) : (
          <div style={{ color: '#888', fontSize: 11 }}>
            Dodaj LGK Business do ekranu głównego — bez otwierania przeglądarki.
          </div>
        )}
      </div>

      {!isIOS && (
        <button
          onClick={install}
          style={{
            background: '#D4FF00',
            color: '#000',
            border: 'none',
            padding: '8px 14px',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 12,
            cursor: 'pointer',
            flexShrink: 0,
            whiteSpace: 'nowrap',
          }}
        >
          Dodaj do ekranu →
        </button>
      )}

      <button
        onClick={dismiss}
        style={{
          background: 'transparent',
          border: '1px solid #333',
          color: '#888',
          fontSize: 11,
          cursor: 'pointer',
          padding: '7px 11px',
          borderRadius: 8,
          flexShrink: 0,
          fontWeight: 500,
        }}
      >
        Nie teraz
      </button>
    </div>
  )
}
