'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getRouteSnapshotUrl } from '@/lib/mapyService'

// status → 0 (Zamówione) | 1 (Kurier w drodze) | 2 (Dostarczone)
function statusStep(status) {
  if (status === 'delivered') return 2
  if (status === 'accepted' || status === 'in_transit') return 1
  return 0
}

const STEPS = ['Zamówione', 'Kurier w drodze', 'Dostarczone']

const M = {
  mono: { fontFamily: "'Fira Code', monospace" },
  display: { fontFamily: "'Space Grotesk', sans-serif" },
}

export default function TrackPage() {
  const { orderNumber } = useParams()
  const [delivery, setDelivery] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!orderNumber) return
    const load = async () => {
      const { data, error } = await supabase
        .from('deliveries')
        .select('status, pickup_lat, pickup_lng, delivery_lat, delivery_lng, order_number, created_at')
        .eq('order_number', orderNumber)
        .single()
      if (error || !data) setNotFound(true)
      else setDelivery(data)
      setLoading(false)
    }
    load()
  }, [orderNumber])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ ...M.mono, color: '#444', fontSize: 13 }}>ładowanie...</div>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📦</div>
        <div style={{ ...M.display, fontWeight: 700, fontSize: 18, color: '#FFF', marginBottom: 6 }}>Zamówienie nie znalezione</div>
        <div style={{ ...M.mono, fontSize: 11, color: '#444' }}>{orderNumber}</div>
      </div>
    </div>
  )

  const step = statusStep(delivery.status)
  const mapUrl = getRouteSnapshotUrl({
    fromLat: delivery.pickup_lat,
    fromLng: delivery.pickup_lng,
    toLat: delivery.delivery_lat,
    toLng: delivery.delivery_lng,
    width: 440,
    height: 220,
  })

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px 48px' }}>

      {/* Header */}
      <div style={{ width: '100%', maxWidth: 440, marginBottom: 28 }}>
        <div style={{ ...M.display, color: '#D4FF00', fontWeight: 900, fontSize: 22, letterSpacing: '-0.5px', marginBottom: 4 }}>LGK Courier</div>
        <div style={{ ...M.mono, fontSize: 11, color: '#444' }}>{delivery.order_number}</div>
      </div>

      {/* Map */}
      {mapUrl && (
        <div style={{ width: '100%', maxWidth: 440, borderRadius: 12, overflow: 'hidden', marginBottom: 20, border: '1px solid #1E1E1E' }}>
          <img src={mapUrl} alt="Mapa trasy" style={{ width: '100%', display: 'block' }} />
        </div>
      )}

      {/* Status Stepper */}
      <div style={{ width: '100%', maxWidth: 440, background: '#141414', border: '1px solid #1E1E1E', borderRadius: 12, padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ ...M.mono, fontSize: 10, color: '#444', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '1px' }}>Status dostawy</div>
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          {STEPS.map((label, i) => (
            <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              {/* connector line */}
              {i < STEPS.length - 1 && (
                <div style={{
                  position: 'absolute',
                  top: 11,
                  left: '50%',
                  width: '100%',
                  height: 2,
                  background: i < step ? '#D4FF00' : '#2A2A2A',
                  zIndex: 0,
                }} />
              )}
              {/* dot */}
              <div style={{
                width: 24, height: 24, borderRadius: '50%', zIndex: 1, flexShrink: 0,
                background: i <= step ? '#D4FF00' : '#1E1E1E',
                border: `2px solid ${i <= step ? '#D4FF00' : '#2A2A2A'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 10,
              }}>
                {i < step
                  ? <span style={{ fontSize: 11, color: '#000', fontWeight: 700 }}>✓</span>
                  : i === step
                    ? <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#000' }} />
                    : null
                }
              </div>
              {/* label */}
              <div style={{
                ...M.display,
                fontSize: 10, fontWeight: i === step ? 700 : 500,
                color: i <= step ? '#FFF' : '#444',
                textAlign: 'center', lineHeight: 1.35,
              }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Live tracking coming soon badge */}
      <div style={{
        width: '100%', maxWidth: 440,
        background: 'rgba(212,255,0,0.04)',
        border: '1px solid rgba(212,255,0,0.12)',
        borderRadius: 12, padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: 12,
        marginBottom: 24,
      }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>🔴</span>
        <div>
          <div style={{ ...M.display, fontWeight: 700, fontSize: 13, color: '#D4FF00', marginBottom: 3 }}>
            Śledzenie na żywo — wkrótce
          </div>
          <div style={{ ...M.mono, fontSize: 11, color: '#666', lineHeight: 1.5 }}>
            Aktualizacje statusu są dostępne na tej stronie.
          </div>
        </div>
      </div>

      <div style={{ ...M.mono, fontSize: 10, color: '#333' }}>
        Zamówiono {new Date(delivery.created_at).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: '2-digit' })}
      </div>
    </div>
  )
}
