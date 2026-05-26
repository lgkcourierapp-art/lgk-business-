'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const NAV = [
  { href: '/dashboard', label: 'Home', icon: '⊞' },
  { href: '/orders', label: 'Orders', icon: '≡' },
  { href: '/orders/new', label: 'New', icon: '+', primary: true },
  { href: '/addresses', label: 'Places', icon: '📍' },
  { href: '/settings', label: 'Settings', icon: '⚙' },
]

export default function BottomNav() {
  const path = usePathname()

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: '#111111',
      borderTop: '1px solid #1A1A1A',
      display: 'flex',
      zIndex: 200,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {NAV.map(({ href, label, icon, primary }) => {
        const active = path === href || (href !== '/dashboard' && href !== '/orders/new' && path.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 4px 8px',
              textDecoration: 'none',
              color: primary ? '#000' : active ? '#D4FF00' : '#555',
              gap: 3,
            }}
          >
            <span style={{
              fontSize: primary ? 22 : 18,
              background: primary ? '#D4FF00' : 'transparent',
              borderRadius: primary ? '50%' : 0,
              width: primary ? 40 : 'auto',
              height: primary ? 40 : 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: primary ? 2 : 0,
            }}>{icon}</span>
            <span style={{ fontSize: 10, fontWeight: active || primary ? 700 : 400 }}>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
