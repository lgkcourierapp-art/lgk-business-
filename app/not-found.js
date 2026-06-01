'use client'
import useStrings from '@/lib/useStrings'
import Link from 'next/link'

export default function NotFound() {
  const { s } = useStrings()
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#FFFFFF', padding: '32px',
    }}>
      <p style={{
        fontSize: '64px', fontWeight: '300', color: '#CCCCCC',
        margin: '0 0 8px', fontFamily: "'Fira Code', monospace",
      }}>404</p>
      <p style={{
        fontSize: '20px', fontWeight: '500', color: '#0A0A0A',
        margin: '0 0 8px',
      }}>
        {s('error.not_found_title')}
      </p>
      <p style={{
        fontSize: '14px', color: '#555555', margin: '0 0 24px',
        textAlign: 'center', maxWidth: '320px', lineHeight: '1.6',
      }}>
        {s('error.not_found_body')}
      </p>
      <Link href="/dashboard" style={{
        padding: '10px 24px', background: '#D4FF00', color: '#0A0A0A',
        borderRadius: '8px', fontWeight: '600', fontSize: '14px',
        textDecoration: 'none',
      }}>
        {s('error.back_home')}
      </Link>
    </div>
  )
}
