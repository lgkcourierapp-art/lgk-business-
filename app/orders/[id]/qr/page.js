'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import Link from 'next/link'
import QRCode from 'qrcode'
import { useApp } from '../../../../utils/appContext'

export default function QRPage({ params }) {
  const router = useRouter()
  const { t, colors, lang } = useApp()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pickupQR, setPickupQR] = useState(null)
  const [deliveryQR, setDeliveryQR] = useState(null)
  const [fullscreen, setFullscreen] = useState(null) // 'pickup' or 'delivery'

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data } = await supabase
        .from('deliveries').select('*')
        .eq('id', params.id).eq('client_id', user['id']).single()
      if (!data) { setLoading(false); return }
      setOrder(data)

      const shortId = data['id'].slice(-6).toUpperCase()
      const pickupText = [
        'LGK PICKUP #' + shortId,
        data.pickup_street + ' ' + data.pickup_house_number,
        data.pickup_city, data.pickup_contact_name, data.pickup_contact_phone
      ].filter(Boolean).join('\n')

      const deliveryText = [
        'LGK DELIVERY #' + shortId,
        data.delivery_street + ' ' + data.delivery_house_number,
        data.delivery_city, data.delivery_contact_name, data.delivery_contact_phone
      ].filter(Boolean).join('\n')

      const [pQR, dQR] = await Promise.all([
        QRCode.toDataURL(pickupText, { width: 600, margin: 2, color: { dark: '#000000', light: '#FFFFFF' } }),
        QRCode.toDataURL(deliveryText, { width: 600, margin: 2, color: { dark: '#000000', light: '#FFFFFF' } })
      ])
      setPickupQR(pQR)
      setDeliveryQR(dQR)
      setLoading(false)
    })
  }, [params.id, router])

  useEffect(() => {
    if (!fullscreen) return
    let wakeLock = null
    navigator.wakeLock?.request('screen').then(lock => { wakeLock = lock }).catch(() => {})
    return () => { wakeLock?.release() }
  }, [fullscreen])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4FF00', fontSize: 18, fontWeight: 700 }}>
      {t('generatingQr')}
    </div>
  )

  if (!order) return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF3B30' }}>
      {t('orderNotFound')}
    </div>
  )

  // Payment lock screen
  if (order.status === 'awaiting_payment') {
    return (
      <div style={{ minHeight: '100vh', background: colors.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ maxWidth: 400, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <div style={{ color: colors.text, fontWeight: 900, fontSize: 20, marginBottom: 12 }}>{t('qrLockedTitle')}</div>
          <div style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>{t('qrLockedDesc')}</div>
          <div style={{ background: '#FF950020', border: '1px solid #FF9500', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#FF9500', marginBottom: 24 }}>
            {t('blurredQRNote')}
          </div>
          <a href={'/orders/' + params.id} style={{ background: '#D4FF00', color: '#000', padding: '14px 28px', borderRadius: 8, fontWeight: 700, textDecoration: 'none', fontSize: 15 }}>
            ← Back to order
          </a>
        </div>
      </div>
    )
  }

  const shortId = order['id'].slice(-6).toUpperCase()
  const cardStyle = { background: '#1A1A1A', border: '1px solid #333', borderRadius: 12, padding: 24, marginBottom: 16 }

  const QRDisplay = ({ qrDataUrl, type }) => (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <img
        src={qrDataUrl}
        alt={type + ' QR'}
        style={{ width: 200, height: 200, display: 'block' }}
      />
    </div>
  )

  return (
    <div key={lang} style={{ minHeight: '100vh', background: '#0A0A0A' }}>

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#FFFFFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setFullscreen(null)}
        >
          <div style={{ color: '#000', fontWeight: 900, fontSize: 22, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            {fullscreen === 'pickup' ? t('qrPickupPoint') : t('qrDeliveryPoint')}
          </div>
          <div style={{ color: '#555', fontSize: 14, marginBottom: 24 }}>{t('orderPrefix')} #{shortId}</div>
          <img
            src={fullscreen === 'pickup' ? pickupQR : deliveryQR}
            alt={fullscreen + ' QR'}
            style={{ width: '100%', maxWidth: 400, height: 'auto', borderRadius: 8, border: '2px solid #000' }}
          />
          <div style={{ marginTop: 32, color: '#000', fontSize: 13, fontWeight: 600 }}>
            {fullscreen === 'pickup'
              ? order.pickup_street + ' ' + order.pickup_house_number + ', ' + order.pickup_city
              : order.delivery_street + ' ' + order.delivery_house_number + ', ' + order.delivery_city}
          </div>
          <div style={{ marginTop: 32, color: '#888', fontSize: 13 }}>{t('tapToClose')}</div>
        </div>
      )}

      <Header />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <Link href={'/orders/' + order['id']} style={{ color: '#D4FF00', textDecoration: 'none', fontSize: 20, fontWeight: 700 }}>←</Link>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{t('qrCodes')} — #{shortId}</h1>
        </div>

        <div style={{ color: '#999', fontSize: 13, marginBottom: 24 }}>{t('qrInstruction')}</div>

        {/* Pickup QR */}
        <div style={cardStyle}>
          <div style={{ color: '#D4FF00', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>{t('pickup')}</div>
          <div style={{ color: '#FFF', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
            {order.pickup_street} {order.pickup_house_number}
          </div>
          <div style={{ color: '#999', fontSize: 13, marginBottom: 16 }}>
            {order.pickup_city}{order.pickup_contact_name && ' · ' + order.pickup_contact_name}
          </div>
          {pickupQR ? (
            <>
              <div style={{ background: '#FFF', borderRadius: 8, padding: 16, display: 'inline-block', marginBottom: 16 }}>
                <QRDisplay qrDataUrl={pickupQR} type="pickup" />
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={() => setFullscreen('pickup')} style={{ background: '#D4FF00', color: '#000', padding: '10px 20px', borderRadius: 8, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>
                  {t('showToCourier')}
                </button>
                <a href={pickupQR} download={'lgk-pickup-' + shortId + '.png'} style={{ background: 'transparent', color: '#D4FF00', padding: '10px 20px', borderRadius: 8, fontWeight: 700, fontSize: 14, border: '1px solid #D4FF00', textDecoration: 'none' }}>
                  {t('download')}
                </a>
              </div>
            </>
          ) : (
            <div style={{ color: '#666', fontSize: 13 }}>{t('generating')}</div>
          )}
        </div>

        {/* Delivery QR */}
        <div style={cardStyle}>
          <div style={{ color: '#D4FF00', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>{t('delivery')}</div>
          <div style={{ color: '#FFF', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
            {order.delivery_street} {order.delivery_house_number}
          </div>
          <div style={{ color: '#999', fontSize: 13, marginBottom: 16 }}>
            {order.delivery_city}{order.delivery_contact_name && ' · ' + order.delivery_contact_name}
          </div>
          {deliveryQR ? (
            <>
              <div style={{ background: '#FFF', borderRadius: 8, padding: 16, display: 'inline-block', marginBottom: 16 }}>
                <QRDisplay qrDataUrl={deliveryQR} type="delivery" />
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={() => setFullscreen('delivery')} style={{ background: '#D4FF00', color: '#000', padding: '10px 20px', borderRadius: 8, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>
                  {t('showToCourier')}
                </button>
                <a href={deliveryQR} download={'lgk-delivery-' + shortId + '.png'} style={{ background: 'transparent', color: '#D4FF00', padding: '10px 20px', borderRadius: 8, fontWeight: 700, fontSize: 14, border: '1px solid #D4FF00', textDecoration: 'none' }}>
                  {t('download')}
                </a>
              </div>
            </>
          ) : (
            <div style={{ color: '#666', fontSize: 13 }}>{t('generating')}</div>
          )}
        </div>

        <button onClick={() => window.print()} style={{ background: 'transparent', color: '#999', padding: '12px 20px', borderRadius: 8, fontWeight: 700, fontSize: 14, border: '1px solid #333', cursor: 'pointer', width: '100%' }}>
          {t('printBothQr')}
        </button>

      </main>
    </div>
  )
}
