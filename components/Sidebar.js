'use client'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/orders/new', label: 'New order', icon: '+' },
  { href: '/orders', label: 'Orders', icon: '≡' },
  { href: '/addresses', label: 'Addresses', icon: '📍' },
  { href: '/settings', label: 'Settings', icon: '⚙' },
]

export default function Sidebar() {
  const path = usePathname()
  const [signedLogoUrl, setSignedLogoUrl] = useState(null)
  const [businessName, setBusinessName] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data: prof } = await supabase
        .from('profiles')
        .select('logo_url, company_name')
        .eq('id', session.user['id'])
        .single()
      if (prof?.company_name) setBusinessName(prof.company_name)
      if (prof?.logo_url) {
        const { data } = await supabase.storage.from('avatars').createSignedUrl(prof.logo_url, 3600)
        if (data?.signedUrl) setSignedLogoUrl(data.signedUrl)
      }
    }
    load()
    window.addEventListener('lgk-profile-updated', load)
    return () => window.removeEventListener('lgk-profile-updated', load)
  }, [])

  return (
    <aside style={{
      width: 220,
      minHeight: '100vh',
      height: '100%',
      background: '#111111',
      borderRight: '1px solid #1A1A1A',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 200,
    }}>
      <div style={{ padding: '0 20px 28px', borderBottom: '1px solid #1A1A1A', display: 'flex', alignItems: 'center', gap: 10 }}>
        {signedLogoUrl ? (
          <img src={signedLogoUrl} alt={businessName || 'Logo'} style={{ height: 32, maxWidth: 120, objectFit: 'contain', borderRadius: 4 }} />
        ) : (
          <span style={{ fontWeight: 900, fontSize: 22, color: '#D4FF00', letterSpacing: 1, fontFamily: "'Fira Code', monospace" }}>L°</span>
        )}
        {businessName && !signedLogoUrl && (
          <span style={{ color: '#999', fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{businessName}</span>
        )}
      </div>

      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(({ href, label, icon }) => {
          const active = path === href || (href !== '/dashboard' && path.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 8,
                textDecoration: 'none',
                background: active ? '#D4FF0015' : 'transparent',
                color: active ? '#D4FF00' : '#888',
                fontWeight: active ? 700 : 500,
                fontSize: 14,
                transition: 'all 120ms ease',
              }}
            >
              <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '16px 20px', borderTop: '1px solid #1A1A1A' }}>
        <Link href="/orders/new" style={{
          display: 'block',
          background: '#D4FF00',
          color: '#000',
          padding: '12px 16px',
          borderRadius: 10,
          fontWeight: 800,
          textDecoration: 'none',
          fontSize: 14,
          textAlign: 'center',
        }}>
          + New order
        </Link>
      </div>

      <div style={{
        marginTop: 'auto',
        borderTop: '0.5px solid rgba(255,255,255,0.08)',
        padding: '10px 14px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              background: '#D4FF00', color: '#0A0A0A',
              fontSize: '10px', fontWeight: '700',
              padding: '2px 7px', borderRadius: '5px',
              letterSpacing: '-0.3px', flexShrink: 0,
            }}>L°</span>
            <div>
              <p style={{ fontSize: '10px', fontWeight: '600',
                color: '#D4FF00', margin: 0, lineHeight: '1.2',
                letterSpacing: '-0.2px' }}>
                LGK Courier
              </p>
              <p style={{ fontSize: '9px',
                color: 'rgba(255,255,255,0.25)',
                margin: 0, lineHeight: '1.2', letterSpacing: '0.3px' }}>
                Less guessing. More doing.
              </p>
              <p style={{ fontSize: '9px',
                color: 'rgba(255,255,255,0.2)',
                margin: '2px 0 0', letterSpacing: '.3px' }}>
                Built in Poland 🇵🇱
              </p>
            </div>
          </div>
          <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>
            v1.2
          </span>
        </div>
      </div>
    </aside>
  )
}
