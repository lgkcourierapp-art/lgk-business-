'use client'
import Link from 'next/link'

export default function Topbar({ title }) {
  return (
    <header style={{
      background: '#111111',
      borderBottom: '1px solid #1A1A1A',
      padding: '0 20px',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
          <span style={{ fontWeight: 900, fontSize: 20, color: '#D4FF00', fontFamily: "'Fira Code', monospace", letterSpacing: 1 }}>L°</span>
        </Link>
        {title && (
          <>
            <span style={{ color: '#333', fontSize: 16 }}>›</span>
            <span style={{ color: '#FFF', fontWeight: 600, fontSize: 15 }}>{title}</span>
          </>
        )}
      </div>

      <Link
        href="/orders/new"
        style={{
          background: '#D4FF00',
          color: '#000',
          padding: '8px 18px',
          borderRadius: 8,
          fontWeight: 800,
          textDecoration: 'none',
          fontSize: 13,
          whiteSpace: 'nowrap',
        }}
      >
        + New order
      </Link>
    </header>
  )
}
