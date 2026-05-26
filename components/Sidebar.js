'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/orders/new', label: 'New order', icon: '+' },
  { href: '/orders', label: 'Orders', icon: '≡' },
  { href: '/addresses', label: 'Addresses', icon: '📍' },
  { href: '/settings', label: 'Settings', icon: '⚙' },
]

export default function Sidebar() {
  const path = usePathname()

  return (
    <aside style={{
      width: 220,
      minHeight: '100vh',
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
      <div style={{ padding: '0 20px 28px', borderBottom: '1px solid #1A1A1A' }}>
        <span style={{ fontWeight: 900, fontSize: 22, color: '#D4FF00', letterSpacing: 1, fontFamily: "'Fira Code', monospace" }}>L°</span>
        <span style={{ color: '#555', fontSize: 11, display: 'block', marginTop: 2, letterSpacing: 2, textTransform: 'uppercase' }}>Business</span>
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
    </aside>
  )
}
