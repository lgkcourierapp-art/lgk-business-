'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function LiveStatusBadge() {
  const [status, setStatus] = useState('checking')
  const [latency, setLatency] = useState(null)
  const [activeCouriers, setActiveCouriers] = useState(0)

  const check = async () => {
    try {
      const start = Date.now()
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
      const ms = Date.now() - start

      if (error) throw error

      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'courier')
        .eq('is_on_shift', true)

      setLatency(ms)
      setActiveCouriers(count || 0)
      setStatus('ok')
    } catch {
      setStatus('error')
      setLatency(null)
    }
  }

  useEffect(() => {
    check()
    const interval = setInterval(check, 30000)
    return () => clearInterval(interval)
  }, [])

  const isOk = status === 'ok'
  const isChecking = status === 'checking'

  const bgColor = isOk
    ? 'rgba(0,200,83,0.12)'
    : isChecking
    ? 'rgba(112,112,112,0.12)'
    : 'rgba(255,59,48,0.12)'

  const dotColor = isOk ? 'var(--success)' : isChecking ? 'var(--text3)' : 'var(--danger)'

  const textColor = isOk ? 'var(--success)' : isChecking ? 'var(--text2)' : 'var(--danger)'

  const label = isOk
    ? `All systems live${latency ? ` · ${latency}ms` : ''}`
    : isChecking
    ? 'Checking...'
    : '1 service down'

  const sublabel = isOk && activeCouriers > 0
    ? `${activeCouriers} courier${activeCouriers !== 1 ? 's' : ''} active`
    : isOk
    ? 'No active couriers'
    : 'Auto-rollback may be active'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        backgroundColor: bgColor,
        borderRadius: 8,
        cursor: 'pointer',
      }}
      onClick={check}
      title="Click to refresh"
    >
      <div style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: dotColor,
        flexShrink: 0,
        animation: isOk ? 'pulse 2s infinite' : 'none',
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          fontWeight: 500,
          color: textColor,
          margin: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          letterSpacing: '0.5px',
        }}>
          {label}
        </p>
        {sublabel && (
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: textColor,
            opacity: 0.7,
            margin: 0,
            letterSpacing: '0.5px',
          }}>
            {sublabel}
          </p>
        )}
      </div>
    </div>
  )
}
