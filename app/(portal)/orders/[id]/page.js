'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import StatusBadge from '@/components/StatusBadge'
import Link from 'next/link'
import { useApp } from '@/utils/appContext'
import { formatCity, formatStreetAddress } from '@/utils/capitalize'

const REVOLUT_USER = process.env.NEXT_PUBLIC_REVOLUT_USER || ''

const REPORT_CATEGORIES = [
  { value: 'not_delivered', label: 'Package not delivered', priority: 'P1' },
  { value: 'damaged', label: 'Package damaged', priority: 'P1' },
  { value: 'missing_items', label: 'Items missing', priority: 'P1' },
  { value: 'wrong_address', label: 'Wrong address delivery', priority: 'P2' },
  { value: 'late_delivery', label: 'Delivery very late', priority: 'P3' },
  { value: 'courier_behaviour', label: 'Courier behaviour issue', priority: 'P2' },
  { value: 'other', label: 'Other', priority: 'P3' },
]

export default function OrderPage({ params }) {
  const router = useRouter()
  const { t, colors, lang } = useApp()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statusFlash, setStatusFlash] = useState(false)

  const [showReportForm, setShowReportForm] = useState(false)
  const [reportCategory, setReportCategory] = useState('')
  const [reportDesc, setReportDesc] = useState('')
  const [reportSubmitted, setReportSubmitted] = useState(false)
  const [csResponseTime, setCsResponseTime] = useState('Within 4 hours during business hours (8am-8pm)')

  const [clientTier, setClientTier] = useState(null)
  const [fleetDispatchFlag, setFleetDispatchFlag] = useState(false)
  const [onlineDrivers, setOnlineDrivers] = useState([])
  const [selectedDriverId, setSelectedDriverId] = useState('')
  const [assigningDriver, setAssigningDriver] = useState(false)

  useEffect(() => {
    supabase.from('platform_settings').select('value').eq('key', 'cs_response_time').single()
      .then(({ data }) => { if (data) setCsResponseTime(data.value) })
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data } = await supabase
        .from('deliveries').select('*')
        .eq('id', params.id).eq('client_id', user['id']).single()
      setOrder(data)
      setLoading(false)

      // Fleet dispatch data
      const [{ data: profRow }, { data: flagRow }] = await Promise.all([
        supabase.from('profiles').select('client_tier').eq('id', user['id']).single(),
        supabase.from('feature_flags').select('enabled').eq('name', 'own_fleet_dispatch').single(),
      ])
      const tier = profRow?.client_tier ?? 'starter'
      setClientTier(tier)
      setFleetDispatchFlag(flagRow?.enabled ?? false)
      if (tier === 'fleet' && flagRow?.enabled) {
        const { data: drvs } = await supabase
          .from('profiles')
          .select('id, company_name, email, phone')
          .eq('employer_id', user['id'])
          .eq('driver_status', 'online')
        setOnlineDrivers(drvs ?? [])
      }
    })
  }, [params.id, router])

  useEffect(() => {
    if (!params.id) return
    const channel = supabase
      .channel('order-' + params.id)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'deliveries', filter: 'id=eq.' + params.id },
        (payload) => {
          setOrder(prev => {
            if (prev?.status !== payload.new.status) {
              setStatusFlash(true)
              setTimeout(() => setStatusFlash(false), 1000)
            }
            return { ...prev, ...payload.new }
          })
        }
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [params.id])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4FF00', fontSize: 18, fontWeight: 700 }}>
      {t('loading')}
    </div>
  )
  if (!order) return (
    <div style={{ minHeight: '100vh', background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF3B30' }}>
      {t('orderNotFound')}
    </div>
  )

  const isPaid = order.status !== 'awaiting_payment'
  const isDelivered = order.status === 'delivered'

  const submitReport = async () => {
    if (!reportCategory) return
    if (reportDesc.length > 2000) return
    const priority = REPORT_CATEGORIES.find(c => c.value === reportCategory)?.priority || 'P2'
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('support_tickets').insert({
      order_id: order['id'],
      client_id: session.user['id'],
      category: reportCategory,
      priority,
      description: reportDesc.trim().slice(0, 2000),
      status: 'open'
    })
    setReportSubmitted(true)
    setShowReportForm(false)
  }

  const revolutUrl = 'https://revolut.me/' + REVOLUT_USER + '?amount=' + Math.round((order.price_total || 0) * 100) + '&currency=PLN&description=LGK+Order+' + order['id'].slice(-6).toUpperCase()
  const shortId = order['id'].slice(-6).toUpperCase()
  const displayId = order.order_number || ('#' + shortId)
  const priceFormatted = 'PLN ' + (order.price_total || 0).toFixed(2)

  const steps = [
    { labelKey: 'orderPlaced', time: order.created_at },
    { labelKey: 'assignedCourier', time: order.assigned_at },
    { labelKey: 'collected', time: order.collected_at },
    { labelKey: 'inTransit', time: order.status === 'in_transit' || order.status === 'delivered' ? order.collected_at : null },
    { labelKey: 'delivered', time: order.delivered_at }
  ]

  const fmt = ts => ts ? new Date(ts).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) : null
  const cardStyle = { background: colors.card, border: '1px solid ' + colors.border, borderRadius: 12, padding: 20, marginBottom: 16 }

  const addressGrid = (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
      <div style={cardStyle}>
        <div style={{ color: '#D4FF00', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{t('pickup')}</div>
        <div style={{ fontSize: 13, color: colors.text }}>{formatStreetAddress(order.pickup_street, order.pickup_house_number)}</div>
        <div style={{ fontSize: 12, color: colors.textSecondary }}>{formatCity(order.pickup_city)}</div>
        <div style={{ fontSize: 13, marginTop: 8, color: colors.text }}>{order.pickup_contact_name}</div>
        <div style={{ fontSize: 12, color: colors.textSecondary }}>{order.pickup_contact_phone}</div>
      </div>
      <div style={cardStyle}>
        <div style={{ color: '#D4FF00', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{t('delivery')}</div>
        <div style={{ fontSize: 13, color: colors.text }}>{formatStreetAddress(order.delivery_street, order.delivery_house_number)}</div>
        <div style={{ fontSize: 12, color: colors.textSecondary }}>{formatCity(order.delivery_city)}</div>
        <div style={{ fontSize: 13, marginTop: 8, color: colors.text }}>{order.delivery_contact_name}</div>
        <div style={{ fontSize: 12, color: colors.textSecondary }}>{order.delivery_contact_phone}</div>
      </div>
    </div>
  )

  const priceRow = (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 900 }}>
        <span>{t('total')}</span>
        <span style={{ color: '#D4FF00', fontFamily: "'Fira Code', monospace" }}>{priceFormatted}</span>
      </div>
    </div>
  )

  const actionsBlock = (
    <div style={{ marginTop: 24 }}>
      {!isPaid && (
        <div style={{ marginBottom: 16 }}>
          <a href={revolutUrl} target="_blank" rel="noreferrer"
            style={{ display: 'block', background: '#D4FF00', color: '#000', padding: '18px 24px', borderRadius: 12, fontWeight: 900, textDecoration: 'none', fontSize: 18, textAlign: 'center', marginBottom: 8 }}>
            {t('payNow')} — {priceFormatted} →
          </a>
          <div style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center' }}>{t('alreadyPaid')}</div>
        </div>
      )}
      {isPaid && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          <a href={'/orders/' + order['id'] + '/qr'}
            style={{ flex: 1, minWidth: 120, background: '#007BFF', color: '#FFF', padding: '14px 16px', borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontSize: 14, textAlign: 'center', display: 'block' }}>
            📱 {t('showToCourier')}
          </a>
          <a href={'/orders/' + order['id'] + '/label'}
            style={{ flex: 1, minWidth: 120, background: '#FF9500', color: '#000', padding: '14px 16px', borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontSize: 14, textAlign: 'center', display: 'block' }}>
            🖨️ {t('printLabel')}
          </a>
          {isDelivered && (
            <Link href={'/orders/new?reorder=' + order['id']}
              style={{ flex: 1, minWidth: 120, background: 'transparent', color: '#D4FF00', padding: '14px 16px', borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontSize: 14, textAlign: 'center', border: '1px solid #D4FF00', display: 'block' }}>
              ↩ {t('reorder')}
            </Link>
          )}
        </div>
      )}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid ' + colors.border, paddingTop: 12 }}>
        {isDelivered && (
          <button onClick={() => window.print()}
            style={{ background: 'none', border: 'none', color: colors.textSecondary, fontSize: 13, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
            {t('invoiceDownload')}
          </button>
        )}
        <button onClick={() => setShowReportForm(!showReportForm)}
          style={{ background: 'none', border: 'none', color: colors.textSecondary, fontSize: 13, cursor: 'pointer', padding: 0, textDecoration: 'underline', marginLeft: 'auto' }}>
          {t('reportProblem')}
        </button>
      </div>
      {showReportForm && !reportSubmitted && (
        <div style={{ marginTop: 16, background: colors.card, border: '1px solid ' + colors.border, borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: colors.text, marginBottom: 16 }}>{t('reportTitle')}</div>
          <div style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>{t('reportCategory')}</div>
          <select value={reportCategory} onChange={e => setReportCategory(e.target.value)}
            style={{ width: '100%', padding: 12, background: colors.bg, border: '1px solid ' + colors.border, borderRadius: 8, color: colors.text, fontSize: 14, marginBottom: 12 }}>
            <option value="">-- Select --</option>
            {REPORT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <textarea placeholder={t('reportDesc')} value={reportDesc} onChange={e => setReportDesc(e.target.value)} rows={3}
            style={{ width: '100%', padding: 12, background: colors.bg, border: '1px solid ' + colors.border, borderRadius: 8, color: colors.text, fontSize: 14, resize: 'none', boxSizing: 'border-box', marginBottom: 12 }} />
          <div style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 12 }}>{csResponseTime}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={submitReport} disabled={!reportCategory}
              style={{ background: reportCategory ? '#D4FF00' : colors.border, color: reportCategory ? '#000' : colors.textSecondary, border: 'none', padding: '12px 24px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: reportCategory ? 'pointer' : 'not-allowed', flex: 1 }}>
              {t('reportSubmit')}
            </button>
            <button onClick={() => setShowReportForm(false)}
              style={{ background: 'transparent', border: '1px solid ' + colors.border, padding: '12px 20px', borderRadius: 8, color: colors.textSecondary, cursor: 'pointer', fontSize: 14 }}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {reportSubmitted && (
        <div style={{ marginTop: 16, background: '#00C85315', border: '1px solid #00C853', borderRadius: 8, padding: '12px 16px', color: '#00C853', fontSize: 14 }}>
          ✅ {t('reportSuccess')}
        </div>
      )}
    </div>
  )

  const assignDriverBlock = clientTier === 'fleet' && fleetDispatchFlag && order.status === 'pending' && (
    <div style={{ ...cardStyle, marginBottom: 16 }}>
      <div style={{ color: '#D4FF00', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
        Przypisz kierowcę
      </div>
      {onlineDrivers.length > 0 ? (
        <>
          <select
            value={selectedDriverId}
            onChange={e => setSelectedDriverId(e.target.value)}
            style={{ width: '100%', padding: '11px 14px', background: colors.bg, border: '1px solid ' + colors.border, borderRadius: 8, color: colors.text, fontSize: 14, marginBottom: 12 }}
          >
            <option value="">— Wybierz kierowcę —</option>
            {onlineDrivers.map(d => (
              <option key={d['id']} value={d['id']}>
                {d.company_name || d.email}{d.phone ? ' · ' + d.phone : ''}
              </option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              disabled={!selectedDriverId || assigningDriver}
              onClick={async () => {
                if (!selectedDriverId) return
                setAssigningDriver(true)
                await supabase.from('deliveries').update({ courier_id: selectedDriverId }).eq('id', order['id'])
                setOrder(prev => ({ ...prev, courier_id: selectedDriverId }))
                setAssigningDriver(false)
              }}
              style={{ background: selectedDriverId ? '#D4FF00' : colors.border, color: selectedDriverId ? '#000' : colors.textSecondary, border: 'none', padding: '11px 20px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: selectedDriverId ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}
            >
              {assigningDriver ? 'Przypisywanie…' : 'Przypisz →'}
            </button>
          </div>
        </>
      ) : (
        <div style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 12 }}>
          Brak dostępnych kierowców online.
        </div>
      )}
      <button
        style={{ background: 'transparent', border: '1px solid ' + colors.border, color: colors.textSecondary, padding: '9px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer', marginTop: 10, fontFamily: 'inherit' }}
        onClick={async () => {
          await supabase.from('deliveries').update({ courier_id: null, status: 'pending' }).eq('id', order['id'])
          setOrder(prev => ({ ...prev, courier_id: null, status: 'pending' }))
        }}
      >
        Zaoferuj sieci LGK →
      </button>
    </div>
  )

  const headerRow = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
      <div>
        <Link href="/dashboard" style={{ color: colors.textSecondary, fontSize: 13, textDecoration: 'none', display: 'inline-block', marginBottom: 6 }}>← {t('dashboard')}</Link>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
          {!order.order_number && t('orderPrefix') + ' '}
          <span style={{ fontFamily: "'Fira Code', monospace", color: '#D4FF00', fontSize: order.order_number ? 16 : 24 }}>{displayId}</span>
        </h1>
      </div>
      <div style={{
        transition: 'all 300ms ease',
        transform: statusFlash ? 'scale(1.08)' : 'scale(1)',
        boxShadow: statusFlash ? '0 0 16px rgba(212,255,0,0.4)' : 'none',
        borderRadius: '20px',
      }}>
        <StatusBadge status={order.status} />
      </div>
    </div>
  )

  return (
    <div key={lang} style={{ minHeight: '100vh', background: colors.bg }}>
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>

        {isDelivered ? (
          <>
            {order.proof_photo_url ? (
              <div style={{ background: colors.card, border: '1px solid #00C85360', borderRadius: 16, padding: 28, marginBottom: 24, boxShadow: '0 2px 16px rgba(0,200,83,0.08)' }}>
                <div style={{ fontWeight: 700, marginBottom: 16, color: '#00C853', fontSize: 18 }}>{t('proofOfDelivery')}</div>
                {order.proof_photo_url?.startsWith('https://') && (
                  <img src={order.proof_photo_url} alt="Proof" style={{ width: '100%', borderRadius: 8, marginBottom: 16 }} />
                )}
                {order.gps_proof && !isNaN(Number(order.gps_proof.lat)) && !isNaN(Number(order.gps_proof.lng)) && (
                  <div style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 12, fontFamily: "'Fira Code', monospace" }}>
                    GPS: {Number(order.gps_proof.lat).toFixed(6)}, {Number(order.gps_proof.lng).toFixed(6)}
                  </div>
                )}
                {order.proof_photo_url?.startsWith('https://') && (
                  <a href={order.proof_photo_url} download style={{ background: '#00C853', color: '#000', padding: '10px 20px', borderRadius: 8, fontWeight: 700, textDecoration: 'none', fontSize: 14, display: 'inline-block' }}>{t('downloadProof')}</a>
                )}
              </div>
            ) : (
              <div style={{ background: '#00C85310', border: '1px solid #00C85330', borderRadius: 12, padding: '14px 20px', marginBottom: 24, color: '#00C853', fontWeight: 600, fontSize: 14 }}>
                ✓ {t('delivered')} {order.delivered_at ? '— ' + fmt(order.delivered_at) : ''}
              </div>
            )}

            {headerRow}

            <div style={{ ...cardStyle, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
              {steps.filter(s => s.time).map((step, i, arr) => (
                <span key={step.labelKey} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#00C853', fontSize: 12 }}>✓</span>
                  <span style={{ color: colors.textSecondary, fontSize: 12 }}>{t(step.labelKey)}</span>
                  {step.time && <span style={{ color: colors.textSecondary, fontSize: 11, fontFamily: "'Fira Code', monospace" }}>{fmt(step.time)}</span>}
                  {i < arr.length - 1 && <span style={{ color: colors.border, margin: '0 4px' }}>→</span>}
                </span>
              ))}
            </div>

            {addressGrid}
            {priceRow}
            {actionsBlock}
          </>
        ) : (
          <>
            {!isPaid && (
              <div style={{ background: '#8B5CF615', border: '2px solid #8B5CF6', borderRadius: 12, padding: 24, marginBottom: 24 }}>
                <div style={{ color: '#8B5CF6', fontWeight: 900, fontSize: 20, marginBottom: 8 }}>{t('awaitingPaymentTitle')}</div>
                <div style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 16 }}>{t('awaitingPaymentDesc')}</div>
                <div style={{ color: colors.textSecondary, fontSize: 13 }}>{t('alreadyPaid')}</div>
              </div>
            )}

            {headerRow}

            <div style={cardStyle}>
              <div style={{ fontWeight: 700, marginBottom: 20, color: '#D4FF00' }}>{t('timeline')}</div>
              {steps.map((step, i) => (
                <div key={step.labelKey} style={{ display: 'flex', gap: 16, marginBottom: i < steps.length - 1 ? 16 : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: step.time ? '#00C853' : colors.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#000' }}>{step.time ? '✓' : ''}</div>
                    {i < steps.length - 1 && <div style={{ width: 2, flex: 1, background: step.time ? '#00C853' : colors.border, minHeight: 20, marginTop: 4 }} />}
                  </div>
                  <div style={{ paddingTop: 2 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: step.time ? colors.text : colors.textSecondary }}>{t(step.labelKey)}</div>
                    {step.time && <div style={{ color: colors.textSecondary, fontSize: 12, fontFamily: "'Fira Code', monospace" }}>{fmt(step.time)}</div>}
                  </div>
                </div>
              ))}
            </div>

            {assignDriverBlock}
            {addressGrid}
            {priceRow}
            {actionsBlock}
          </>
        )}

      </main>
    </div>
  )
}
