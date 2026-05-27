'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import QRCode from 'qrcode'
import { useApp } from '@/utils/appContext'

export default function QRPage({ params }) {
  const router = useRouter()
  const { t, lang } = useApp()
  const [order, setOrder] = useState(null)
  const [token, setToken] = useState(null)
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState(null)
  const [expiresAt, setExpiresAt] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data } = await supabase
        .from('deliveries').select('*')
        .eq('id', params.id).eq('client_id', user['id']).single()
      if (!data) { setLoading(false); return }
      setOrder(data)

      const { data: tokenRow } = await supabase
        .from('qr_tokens')
        .select('token, expires_at, used_at')
        .eq('delivery_id', data['id'])
        .eq('type', 'collection')
        .maybeSingle()

      let qrContent
      if (tokenRow) {
        setToken(tokenRow)
        setExpiresAt(new Date(tokenRow.expires_at))
        qrContent = 'https://lgk.pl/collect/' + tokenRow.token
      } else {
        qrContent = 'LGK:' + data['id']
      }
      const qr = await QRCode.toDataURL(qrContent, {
        width: 400, margin: 2, color: { dark: '#000000', light: '#FFFFFF' },
      })
      setQrDataUrl(qr)
      setLoading(false)
    })
  }, [params.id, router])

  useEffect(() => {
    if (!expiresAt) return
    const tick = () => setTimeLeft(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  const fmt = ts => new Date(ts).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
  const fmtCountdown = secs => {
    const m = Math.floor(secs / 60), s = secs % 60
    return m + ':' + String(s).padStart(2, '0')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4FF00', fontSize: 18, fontWeight: 700 }}>
      Generating QR...
    </div>
  )

  if (!order) return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF3B30' }}>
      {t('orderNotFound')}
    </div>
  )

  if (order.status === 'awaiting_payment') return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{ maxWidth: 400, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <div style={{ color: '#FFF', fontWeight: 900, fontSize: 20, marginBottom: 12 }}>{t('qrLockedTitle')}</div>
        <div style={{ color: '#999', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>{t('qrLockedDesc')}</div>
        <a href={'/orders/' + params.id} style={{ background: '#D4FF00', color: '#000', padding: '14px 28px', borderRadius: 8, fontWeight: 700, textDecoration: 'none', fontSize: 15 }}>
          ← Back to order
        </a>
      </div>
    </div>
  )

  const isScanned = !!order.qr_scanned_at
  const orderNum = order.order_number || ('#' + order['id'].slice(-6).toUpperCase())
  const toAddress = [order.delivery_street, order.delivery_house_number].filter(Boolean).join(' ')
  const pickupNotes = order.pickup_notes || order.pickup_instructions

  return (
    <div key={lang} style={{ minHeight: '100vh', background: '#0A0A0A' }}>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>

      <div className="no-print" style={{ padding: '16px 20px', borderBottom: '1px solid #1A1A1A', display: 'flex', gap: 12, alignItems: 'center' }}>
        <Link href={'/orders/' + order['id']} style={{ color: '#D4FF00', textDecoration: 'none', fontWeight: 700, fontSize: 18 }}>←</Link>
        <span style={{ color: '#666', fontSize: 13 }}>Collection QR</span>
      </div>

      <main style={{ maxWidth: 480, margin: '0 auto', padding: '32px 16px' }}>

        {/* QR card */}
        <div style={{ background: '#000000', borderRadius: 16, padding: 32, textAlign: 'center', marginBottom: 20, border: '1px solid #1A1A1A' }}>
          {isScanned ? (
            <div style={{ padding: '32px 0' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
              <div style={{ color: '#00C853', fontWeight: 900, fontSize: 20, marginBottom: 8 }}>Collected</div>
              <div style={{ color: '#555', fontSize: 13, fontFamily: "'Fira Code', monospace" }}>
                at {fmt(order.qr_scanned_at)} · GPS logged
              </div>
            </div>
          ) : qrDataUrl ? (
            <>
              <div style={{ background: '#FFFFFF', borderRadius: 10, padding: 16, display: 'inline-block', marginBottom: 20 }}>
                <img src={qrDataUrl} alt="Collection QR" style={{ width: 240, height: 240, display: 'block' }} />
              </div>
              <div style={{ color: '#D4FF00', fontFamily: "'Fira Code', monospace", fontSize: 14, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>
                {orderNum}
              </div>
              {timeLeft !== null && (
                <div style={{ color: timeLeft < 300 ? '#FF3B30' : '#555', fontSize: 12, fontFamily: "'Fira Code', monospace" }}>
                  Valid {fmtCountdown(timeLeft)} · expires {expiresAt ? fmt(expiresAt) : '—'}
                </div>
              )}
            </>
          ) : (
            <div style={{ color: '#D4FF00', padding: 40 }}>Generating QR...</div>
          )}
        </div>

        {/* Order summary */}
        <div style={{ background: '#1A1A1A', border: '1px solid #333', borderRadius: 12, padding: 20, marginBottom: 12 }}>
          <div style={{ color: '#888', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Order summary</div>
          <div style={{ color: '#FFF', fontSize: 14, fontWeight: 600 }}>
            {[order.package_weight, toAddress ? 'to ' + toAddress : null].filter(Boolean).join(' · ')}
          </div>
          {order.delivery_city && <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>{order.delivery_city}</div>}
        </div>

        {/* Pickup notes */}
        {pickupNotes && (
          <div style={{ background: '#1A1A1A', border: '1px solid #D4FF0030', borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <div style={{ color: '#D4FF00', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Pickup notes</div>
            <div style={{ color: '#CCC', fontSize: 13, lineHeight: 1.6 }}>{pickupNotes}</div>
          </div>
        )}

        {/* Print label */}
        <a
          href={'/orders/' + order['id'] + '/label'}
          style={{ display: 'block', background: 'transparent', color: '#999', border: '1px solid #333', padding: '14px 20px', borderRadius: 10, fontWeight: 600, textDecoration: 'none', fontSize: 14, textAlign: 'center', marginTop: 8 }}
        >
          🖨️ Print label
        </a>

      </main>
    </div>
  )
}
