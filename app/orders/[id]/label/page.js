'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import QRCode from 'qrcode'
import { useApp } from '../../../../utils/appContext'

export default function LabelPage({ params }) {
  const router = useRouter()
  const { t, lang } = useApp()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [qrDataUrl, setQrDataUrl] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data } = await supabase
        .from('deliveries').select('*')
        .eq('id', params.id).eq('client_id', user['id']).single()
      if (!data) { setLoading(false); return }
      setOrder(data)

      const shortId = data['id'].slice(-6).toUpperCase()
      const labelText = [
        'LGK #' + shortId,
        'FROM: ' + data.pickup_street + ' ' + data.pickup_house_number + ', ' + data.pickup_city,
        'TO: ' + data.delivery_street + ' ' + data.delivery_house_number + ', ' + data.delivery_city,
        data.delivery_contact_name, data.delivery_contact_phone
      ].filter(Boolean).join('\n')

      const qr = await QRCode.toDataURL(labelText, { width: 300, margin: 1, color: { dark: '#000000', light: '#FFFFFF' } })
      setQrDataUrl(qr)
      setLoading(false)
    })
  }, [params.id, router])

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

  // Payment lock
  if (order.status === 'awaiting_payment') {
    return (
      <div style={{ minHeight: '100vh', background: '#FFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ maxWidth: 400, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 12, color: '#0A0A0A' }}>{t('labelLockedTitle')}</div>
          <div style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 16, color: '#666' }}>
            {t('labelLockedDesc')}
          </div>
          <div style={{ background: '#FFF9E6', border: '2px solid #FF9500', borderRadius: 8, padding: 16, marginBottom: 24, fontSize: 13, color: '#666', textAlign: 'left' }}>
            <div style={{ fontWeight: 700, marginBottom: 8, color: '#0A0A0A' }}>📋 Business handbook note:</div>
            A label with no QR code means the order has not been paid. Do not hand the package to a courier without a complete label showing the QR code. The QR code is the proof of collection — without it there is no confirmation the package was collected.
          </div>
          <a href={'/orders/' + params.id} style={{ background: '#D4FF00', color: '#000', padding: '14px 28px', borderRadius: 8, fontWeight: 700, textDecoration: 'none', fontSize: 15, display: 'inline-block' }}>
            ← Back to order
          </a>
        </div>
      </div>
    )
  }

  const shortId = order['id'].slice(-6).toUpperCase()
  const isFragile = order.is_fragile

  return (
    <div key={lang}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          .label-page { padding: 0 !important; background: #FFF !important; }
        }
      `}</style>

      {/* Print controls */}
      <div className="no-print" style={{ background: '#0A0A0A', padding: '16px 24px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <a href={'/orders/' + order['id']} style={{ color: '#D4FF00', textDecoration: 'none', fontWeight: 700 }}>← Back to order</a>
        <button
          onClick={() => window.print()}
          style={{ marginLeft: 'auto', background: '#D4FF00', color: '#000', border: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
        >
          🖨️ Print Label
        </button>
      </div>

      {/* Label (A6 / half-A4) */}
      <div className="label-page" style={{ background: '#FFF', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '32px 16px' }}>
        <div style={{ width: 420, border: '2px solid #000', borderRadius: 8, overflow: 'hidden', fontFamily: 'monospace' }}>

          {/* Header */}
          <div style={{ background: '#D4FF00', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 900, fontSize: 20, letterSpacing: 2, color: '#000' }}>LGK COURIER</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#000' }}>#{shortId}</div>
          </div>

          {/* Addresses + QR */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 0 }}>
            <div style={{ padding: '16px 16px 0' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#666', marginBottom: 4 }}>FROM</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#000', marginBottom: 2 }}>{order.pickup_contact_name}</div>
              <div style={{ fontSize: 12, color: '#000' }}>{order.pickup_street} {order.pickup_house_number}</div>
              <div style={{ fontSize: 12, color: '#000', marginBottom: 16 }}>{order.pickup_city}</div>

              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#666', marginBottom: 4 }}>TO</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#000', marginBottom: 2 }}>{order.delivery_contact_name}</div>
              <div style={{ fontSize: 13, color: '#000' }}>{order.delivery_street} {order.delivery_house_number}</div>
              <div style={{ fontSize: 13, color: '#000' }}>{order.delivery_city}</div>
              {order.delivery_contact_phone && <div style={{ fontSize: 12, color: '#444', marginTop: 4 }}>{order.delivery_contact_phone}</div>}
            </div>

            {qrDataUrl && (
              <div style={{ padding: '16px 16px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={qrDataUrl} alt="Shipping QR" style={{ width: 120, height: 120 }} />
              </div>
            )}
          </div>

          {/* Flags */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #EEE', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {isFragile && (
              <div style={{ background: '#FF3B3020', border: '1px solid #FF3B30', borderRadius: 4, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#FF3B30' }}>
                ⚠️ FRAGILE
              </div>
            )}
            {order.insurance_selected && (
              <div style={{ background: '#00C85320', border: '1px solid #00C853', borderRadius: 4, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#00C853' }}>
                🛡️ INSURED
              </div>
            )}
            {order.package_weight && (
              <div style={{ background: '#F5F5F5', border: '1px solid #DDD', borderRadius: 4, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#333' }}>
                {order.package_weight}
              </div>
            )}
            <div style={{ marginLeft: 'auto', fontSize: 10, color: '#999' }}>lgkcourier.pl</div>
          </div>

          {/* Notes */}
          {order.delivery_notes && (
            <div style={{ padding: '8px 16px 12px', borderTop: '1px solid #EEE', fontSize: 11, color: '#666' }}>
              📝 {order.delivery_notes}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
