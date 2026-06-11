'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import QRCode from 'qrcode'
import { useApp } from '@/utils/appContext'
import { parseOrderNumber } from '@/utils/orderNumber'

export default function LabelPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id
  const { t, lang } = useApp()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [qrDataUrl, setQrDataUrl] = useState(null)

  useEffect(() => {
    if (!id) return
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data } = await supabase
        .from('deliveries').select('*')
        .eq('id', id).eq('client_id', user['id']).single()
      if (!data) { setLoading(false); return }
      setOrder(data)

      const qrContent = data.order_number
        ? 'https://lgk.pl/track/' + data.order_number
        : 'LGK:' + data['id']
      const qr = await QRCode.toDataURL(qrContent, { width: 300, margin: 1, color: { dark: '#000000', light: '#FFFFFF' } })
      setQrDataUrl(qr)
      setLoading(false)
    })
  }, [id, router])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0A0A0A', fontSize: 16 }}>
      Preparing label...
    </div>
  )

  if (!order) return (
    <div style={{ minHeight: '100vh', background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF3B30' }}>
      Order not found
    </div>
  )

  if (order.status === 'awaiting_payment') return (
    <div style={{ minHeight: '100vh', background: '#FFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{ maxWidth: 400, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 12, color: '#0A0A0A' }}>{t('labelLockedTitle')}</div>
        <div style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 24, color: '#666' }}>{t('labelLockedDesc')}</div>
        <a href={'/orders/' + id} style={{ background: '#D4FF00', color: '#000', padding: '14px 28px', borderRadius: 8, fontWeight: 700, textDecoration: 'none', fontSize: 15, display: 'inline-block' }}>
          ← Back to order
        </a>
      </div>
    </div>
  )

  const parsedNum = order.order_number ? parseOrderNumber(order.order_number) : null
  const orderNum = order.order_number || order['id']
  const dateStr = new Date(order.created_at).toLocaleDateString('pl-PL')
  const trackUrl = order.order_number ? 'lgk.pl/track/' + order.order_number : null

  // Split order number into segments for the strip
  const segments = order.order_number ? order.order_number.split('-') : []
  // [city, zone, date, seq, check]

  return (
    <div key={lang}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          .label-page { padding: 0 !important; background: #FFF !important; }
        }
      `}</style>

      <div className="no-print" style={{ background: '#0A0A0A', padding: '16px 24px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <a href={'/orders/' + order['id']} style={{ color: '#D4FF00', textDecoration: 'none', fontWeight: 700 }}>← Back to order</a>
        <button
          onClick={() => window.print()}
          style={{ marginLeft: 'auto', background: '#D4FF00', color: '#000', border: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
        >
          🖨️ Print Label
        </button>
      </div>

      {order.payment_status === 'pending_verification' && (
        <div className="no-print" style={{ background: '#0A1A2A', borderBottom: '1px solid #1A3050', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 16 }}>✓</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Payment sent — awaiting confirmation</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>We'll confirm your payment shortly</div>
          </div>
        </div>
      )}
      {order.payment_status !== 'paid' && order.payment_status !== 'pending_verification' && (order.amount_pln || order.price_total) && (
        <div className="no-print" style={{ background: '#191C20', borderBottom: '1px solid #2A2A2A', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 16 }}>💳</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
              Payment pending — PLN {parseFloat(order.amount_pln || order.price_total || 0).toFixed(2)}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Pay via Revolut to unlock courier pickup</div>
          </div>
          <a
            href={process.env.NEXT_PUBLIC_REVOLUT_USER ? `https://revolut.me/${process.env.NEXT_PUBLIC_REVOLUT_USER}` : (process.env.NEXT_PUBLIC_REVOLUT_LINK || '#')}
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: '#D4FF00', color: '#000', padding: '8px 16px', borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            Pay now →
          </a>
        </div>
      )}

      <div className="label-page" style={{ background: '#FFF', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '32px 16px' }}>
        <div style={{ width: 420, border: '2px solid #000', borderRadius: 8, overflow: 'hidden', fontFamily: 'monospace' }}>

          {/* Header: black bg, L° left, order_number + date right */}
          <div style={{ background: '#0A0A0A', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 900, fontSize: 22, color: '#D4FF00', letterSpacing: 1 }}>L°</div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#D4FF00', fontWeight: 700, fontSize: 12, fontFamily: 'monospace', letterSpacing: 1 }}>{orderNum}</div>
              <div style={{ color: '#666', fontSize: 10, marginTop: 2 }}>{dateStr}</div>
            </div>
          </div>

          {/* Segment strip */}
          {segments.length === 5 && (
            <div style={{ display: 'flex', borderBottom: '1px solid #EEE' }}>
              {segments.map((seg, i) => {
                const isHighlighted = i === 0 || i === 4
                return (
                  <div key={i} style={{
                    flex: i === 2 || i === 3 ? 2 : 1,
                    padding: '6px 8px',
                    textAlign: 'center',
                    background: isHighlighted ? '#0A0A0A' : '#F5F5F5',
                    borderRight: i < 4 ? '1px solid #DDD' : 'none',
                    fontFamily: 'monospace',
                  }}>
                    <div style={{ fontSize: 9, color: isHighlighted ? '#888' : '#999', marginBottom: 2 }}>
                      {['CITY', 'ZONE', 'DATE', 'SEQ', 'CHK'][i]}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 900, color: isHighlighted ? '#D4FF00' : '#000' }}>{seg}</div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Two-col addresses + QR */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 0 }}>
            <div style={{ padding: '14px 16px 0' }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#666', marginBottom: 3 }}>Collecting from</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#000', marginBottom: 1 }}>{order.pickup_contact_name}</div>
              <div style={{ fontSize: 11, color: '#000' }}>{order.pickup_street} {order.pickup_house_number}</div>
              <div style={{ fontSize: 11, color: '#000', marginBottom: 12 }}>{order.pickup_city}</div>

              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#666', marginBottom: 3 }}>Delivering to</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#000', marginBottom: 1 }}>{order.delivery_contact_name || order.recipient_name}</div>
              <div style={{ fontSize: 12, color: '#000' }}>{order.delivery_street} {order.delivery_house_number}</div>
              <div style={{ fontSize: 12, color: '#000' }}>{order.delivery_city}</div>
              {(order.delivery_contact_phone || order.recipient_phone) && (
                <div style={{ fontSize: 11, color: '#444', marginTop: 3 }}>{order.delivery_contact_phone || order.recipient_phone}</div>
              )}
            </div>

            {qrDataUrl && (
              <div style={{ padding: '14px 16px 14px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={qrDataUrl} alt="Shipping QR" style={{ width: 110, height: 110 }} />
              </div>
            )}
          </div>

          {/* Meta row */}
          <div style={{ padding: '10px 16px', borderTop: '1px solid #EEE', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {order.is_fragile && (
              <div style={{ background: '#FF3B3015', border: '1px solid #FF3B30', borderRadius: 4, padding: '3px 8px', fontSize: 10, fontWeight: 700, color: '#FF3B30' }}>⚠️ FRAGILE</div>
            )}
            {order.insurance_selected && (
              <div style={{ background: '#00C85315', border: '1px solid #00C853', borderRadius: 4, padding: '3px 8px', fontSize: 10, fontWeight: 700, color: '#00C853' }}>🛡️ INSURED</div>
            )}
            {order.package_weight && (
              <div style={{ background: '#F5F5F5', border: '1px solid #DDD', borderRadius: 4, padding: '3px 8px', fontSize: 10, fontWeight: 700, color: '#333' }}>{order.package_weight}</div>
            )}
            {order.time_window && order.time_window !== 'any_time' && (
              <div style={{ background: '#F5F5F5', border: '1px solid #DDD', borderRadius: 4, padding: '3px 8px', fontSize: 10, fontWeight: 600, color: '#555' }}>⏰ {order.time_window}</div>
            )}
          </div>

          {/* Barcode strip (visual only) */}
          <div style={{ padding: '8px 16px', borderTop: '1px solid #EEE', display: 'flex', alignItems: 'center', gap: 2, height: 28 }}>
            {Array.from({ length: 60 }).map((_, i) => (
              <div key={i} style={{ width: Math.random() > 0.6 ? 3 : 1.5, height: 16 + (i % 3 === 0 ? 4 : 0), background: '#000', flexShrink: 0 }} />
            ))}
          </div>

          {/* Tracking URL + footer */}
          <div style={{ padding: '8px 16px 12px', borderTop: '1px solid #EEE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {trackUrl && (
              <div style={{ fontSize: 9, color: '#666', fontFamily: 'monospace' }}>{trackUrl}</div>
            )}
            <div style={{ fontSize: 9, color: '#999', marginLeft: 'auto' }}>LGK Courier · GPS-verified delivery</div>
          </div>

        </div>
      </div>
    </div>
  )
}
