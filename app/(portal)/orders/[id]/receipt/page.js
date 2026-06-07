'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ReceiptPage({ params }) {
  const { id } = params
  const [order, setOrder] = useState(null)
  const [proofUrl, setProofUrl] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('deliveries')
        .select('*, profiles!courier_id (name, email)')
        .eq('id', id)
        .eq('client_id', user['id'])
        .single()

      setOrder(data)

      if (data?.proof_photo_path) {
        const { data: signed } = await supabase.storage
          .from('proof-photos')
          .createSignedUrl(data.proof_photo_path, 86400)
        if (signed?.signedUrl) setProofUrl(signed.signedUrl)
      } else if (data?.proof_photo_url?.startsWith('https://')) {
        setProofUrl(data.proof_photo_url)
      }

      setLoading(false)
    }
    load()
  }, [id])

  useEffect(() => {
    if (!loading && order) {
      setTimeout(() => window.print(), 600)
    }
  }, [loading, order])

  if (loading) return <div style={{ padding: 40, fontFamily: 'system-ui, sans-serif' }}>Ładowanie...</div>
  if (!order) return <div style={{ padding: 40, fontFamily: 'system-ui, sans-serif', color: '#EF4444' }}>Zamówienie nie znalezione</div>

  const deliveredAt = order.delivered_at
    ? new Date(order.delivered_at).toLocaleString('pl-PL')
    : '—'

  const createdAt = order.created_at
    ? new Date(order.created_at).toLocaleString('pl-PL')
    : '—'

  const displayId = order.order_number || order['id'].split('-')[0].toUpperCase()

  return (
    <div style={{
      maxWidth: 600,
      margin: '0 auto',
      padding: 32,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#111',
    }}>
      <style>{`
        @media print {
          @page { margin: 15mm; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{
        background: '#0A0A0A',
        borderRadius: 12,
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            background: '#D4FF00', borderRadius: 6,
            padding: '4px 10px', fontWeight: 700,
            fontSize: 14, color: '#0A0A0A',
          }}>L°</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 500, fontSize: 14 }}>
              Potwierdzenie dostawy
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
              Delivery confirmation
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            color: '#D4FF00', fontFamily: 'monospace',
            fontWeight: 700, fontSize: 13,
          }}>
            {displayId}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
            {deliveredAt}
          </div>
        </div>
      </div>

      {/* From / To */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 16, marginBottom: 16,
        padding: '14px 16px',
        border: '1px solid #E5E7EB', borderRadius: 10,
      }}>
        <div>
          <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>Od / From</div>
          <div style={{ fontWeight: 500, fontSize: 13 }}>{order.pickup_contact_name || '—'}</div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>{order.pickup_address}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>Do / To</div>
          <div style={{ fontWeight: 500, fontSize: 13 }}>{order.recipient_name}</div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>{order.delivery_address}</div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>{order.recipient_phone}</div>
        </div>
      </div>

      {/* Order details */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
        gap: 10, marginBottom: 16,
        padding: '12px 16px',
        background: '#F9FAFB', borderRadius: 10,
      }}>
        {[
          { label: 'Paczka', value: order.package_type || 'Standardowa' },
          { label: 'Kurier', value: order.profiles?.name || '—' },
          { label: 'Dostarczona', value: order.delivered_at ? new Date(order.delivered_at).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) : '—' },
          { label: 'Status', value: order.status === 'delivered' ? '✓ Dostarczona' : order.status },
        ].map((item, i) => (
          <div key={i}>
            <div style={{ fontSize: 9, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{item.label}</div>
            <div style={{ fontSize: 12, fontWeight: 500 }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Price */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', border: '1px solid #E5E7EB', borderRadius: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 12, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>Cena / Price</span>
        <span style={{ fontWeight: 900, fontSize: 18, fontFamily: 'monospace' }}>PLN {(order.price_total || 0).toFixed(2)}</span>
      </div>

      {/* Proof photo + signature */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
            Zdjęcie dostawy / Proof photo
          </div>
          {proofUrl ? (
            <img src={proofUrl} alt="Proof of delivery"
              style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8 }} />
          ) : (
            <div style={{
              width: '100%', height: 120, background: '#F3F4F6',
              borderRadius: 8, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 12, color: '#9CA3AF',
            }}>Brak zdjęcia</div>
          )}
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
            Podpis / Signature
          </div>
          {order.signature_url ? (
            <img src={order.signature_url} alt="Signature"
              style={{ width: '100%', height: 120, objectFit: 'contain', borderRadius: 8, border: '1px solid #E5E7EB' }} />
          ) : (
            <div style={{
              width: '100%', height: 120, background: '#F3F4F6',
              borderRadius: 8, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 12, color: '#9CA3AF',
            }}>Brak podpisu</div>
          )}
        </div>
      </div>

      {/* GPS proof */}
      {(order.proof_gps_lat || order.proof_gps_lng) && (
        <div style={{ marginBottom: 16, padding: '12px 16px', border: '1px solid #E5E7EB', borderRadius: 10 }}>
          <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
            Lokalizacja GPS / GPS location
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div style={{ padding: 8, background: '#F9FAFB', borderRadius: 6 }}>
              <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>Szerokość</div>
              <div style={{ fontSize: 11, fontFamily: 'monospace' }}>{Number(order.proof_gps_lat).toFixed(6)}° N</div>
            </div>
            <div style={{ padding: 8, background: '#F9FAFB', borderRadius: 6 }}>
              <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>Długość</div>
              <div style={{ fontSize: 11, fontFamily: 'monospace' }}>{Number(order.proof_gps_lng).toFixed(6)}° E</div>
            </div>
            <div style={{ padding: 8, background: '#F9FAFB', borderRadius: 6 }}>
              <div style={{ fontSize: 9, color: '#9CA3AF', marginBottom: 2 }}>Czas dostawy</div>
              <div style={{ fontSize: 11 }}>{order.delivered_at ? new Date(order.delivered_at).toLocaleTimeString('pl-PL') : '—'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        padding: '10px 0', borderTop: '1px solid #E5E7EB',
        fontSize: 10, color: '#9CA3AF',
      }}>
        <span>Dostarczone przez LGK Courier · lgk-landing.vercel.app</span>
        <span>LGK Holdings Sp. z o.o. · Szczecin</span>
      </div>

      {/* Print button */}
      <div className="no-print" style={{ marginTop: 20, textAlign: 'center' }}>
        <button
          onClick={() => window.print()}
          style={{
            padding: '10px 24px',
            background: '#D4FF00',
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: 14,
            fontFamily: 'inherit',
          }}
        >
          🖨️ Pobierz PDF
        </button>
        <div style={{ marginTop: 12 }}>
          <a href={'../'} style={{ color: '#9CA3AF', fontSize: 12, textDecoration: 'none' }}>
            ← Powrót do zamówienia
          </a>
        </div>
      </div>
    </div>
  )
}
