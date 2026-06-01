'use client'
import useStrings from '@/lib/useStrings'

export default function Error({ error, reset }) {
  const { s } = useStrings()
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#FFFFFF', padding: '32px',
    }}>
      <p style={{
        fontSize: '20px', fontWeight: '500', color: '#0A0A0A',
        margin: '0 0 8px',
      }}>
        {s('error.generic_title')}
      </p>
      <p style={{
        fontSize: '14px', color: '#555555', margin: '0 0 24px',
        textAlign: 'center', maxWidth: '320px', lineHeight: '1.6',
      }}>
        {s('error.generic_body')}
      </p>
      <button
        onClick={reset}
        style={{
          padding: '10px 24px', background: '#D4FF00', color: '#0A0A0A',
          borderRadius: '8px', fontWeight: '600', fontSize: '14px',
          border: 'none', cursor: 'pointer',
        }}
      >
        {s('error.refresh')}
      </button>
    </div>
  )
}
