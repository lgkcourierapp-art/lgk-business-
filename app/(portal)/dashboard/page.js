'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import StatusBadge from '@/components/StatusBadge'
import { useApp } from '../../utils/appContext'
import WeatherAlert from '../../components/WeatherAlert'
import { formatStreetAddress, formatCity } from '../../utils/capitalize'
import { formatCurrency } from '../../utils/marketConfig'

function isToday(isoString) {
  if (!isoString) return false
  const d = new Date(isoString)
  const today = new Date()
  return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate()
}

export default function DashboardPage() {
  const router = useRouter()
  const { t, lang, colors } = useApp()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [hoveredCard, setHoveredCard] = useState(null)
  const [userId, setUserId] = useState(null)

  const fetchOrders = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserId(user['id'])
    const { data, error } = await supabase
      .from('deliveries')
      .select('*')
      .eq('client_id', user['id'])
      .order('created_at', { ascending: false })
      .limit(100)
    if (!error && data) setOrders(data)
    setLoading(false)
    setLastRefresh(new Date())
  }, [router])

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel('client-orders-' + userId)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'deliveries',
        filter: 'client_id=eq.' + userId,
      }, (payload) => {
        setOrders(prev => [payload.new, ...prev])
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [userId])

  const active    = orders.filter(o => ['collected', 'in_transit'].includes(o.status))
  const pending   = orders.filter(o => ['pending', 'assigned', 'awaiting_payment'].includes(o.status))
  const completed = orders.filter(o => o.status === 'delivered' && isToday(o.delivered_at || o.created_at))

  const now = new Date()
  const thisMonth = orders.filter(o => {
    const d = new Date(o.created_at)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  })
  const deliveredMonth = thisMonth.filter(o => o.status === 'delivered')
  const plnSpent = deliveredMonth.reduce((sum, o) => sum + (o.price_total || 0), 0)
  const successRate = thisMonth.length > 0 ? Math.round((deliveredMonth.length / thisMonth.length) * 100) : 0

  const statusBorderMap = {
    awaiting_payment: '#8B5CF6',
    pending:          '#FFD600',
    assigned:         '#007BFF',
    collected:        '#FF9500',
    in_transit:       '#007BFF',
    delivered:        '#00C853',
    cancelled:        '#666',
  }

  const card = (order) => {
    const isUrgent  = order.status === 'in_transit' || order.status === 'collected'
    const isWaiting = order.status === 'awaiting_payment'
    const isComplete = order.status === 'delivered'
    const orderId = order['id']

    const addrFrom = (
      formatStreetAddress(order.pickup_street, order.pickup_house_number) + ', ' + formatCity(order.pickup_city)
    ).replace(/^,\s*/, '').trim() || order.pickup_address || '—'

    const addrTo = (
      formatStreetAddress(order.delivery_street, order.delivery_house_number) + ', ' + formatCity(order.delivery_city)
    ).replace(/^,\s*/, '').trim() || order.delivery_address || '—'

    return (
      <div
        key={orderId}
        onClick={() => router.push('/orders/' + orderId)}
        onMouseEnter={() => setHoveredCard(orderId)}
        onMouseLeave={() => setHoveredCard(null)}
        style={{
          background: isWaiting ? '#8B5CF608' : colors.card,
          border: '1px solid ' + (
            isUrgent  ? '#007BFF40' :
            isWaiting ? '#8B5CF640' :
            hoveredCard === orderId ? '#D4FF00' :
            colors.border
          ),
          borderLeft: '4px solid ' + (statusBorderMap[order.status] || colors.border),
          borderRadius: '10px',
          padding: isUrgent ? '20px 20px 20px 17px' : '16px 16px 16px 13px',
          marginBottom: '10px',
          cursor: 'pointer',
          transition: 'all 150ms ease',
          transform: hoveredCard === orderId ? 'translateY(-1px)' : 'none',
          boxShadow: isUrgent
            ? '0 2px 12px rgba(0,123,255,0.12)'
            : hoveredCard === orderId
            ? '0 4px 16px rgba(0,0,0,0.4)'
            : 'none',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <span style={{
            fontWeight: 800,
            fontSize: isUrgent ? '16px' : '14px',
            color: '#D4FF00',
            fontFamily: "'Fira Code', monospace",
            letterSpacing: '0.5px',
          }}>
            #{orderId.slice(-6).toUpperCase()}
          </span>
          <StatusBadge status={order.status} />
        </div>

        <div style={{ color: colors.textSecondary, fontSize: '13px', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ opacity: 0.5, fontSize: 11, flexShrink: 0 }}>↗</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{addrFrom.slice(0, 44)}</span>
        </div>
        <div style={{ color: colors.textSecondary, fontSize: '13px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ opacity: 0.5, fontSize: 11, flexShrink: 0 }}>📍</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{addrTo.slice(0, 44)}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#D4FF00', fontWeight: 700, fontSize: '15px', fontFamily: "'Fira Code', monospace" }}>
            {formatCurrency(order.price_total || 0)}
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <a
              href={'/orders/' + orderId + '/qr'}
              onClick={e => e.stopPropagation()}
              style={{ background: 'transparent', color: '#007BFF', border: '1px solid #007BFF30', padding: '5px 10px', borderRadius: '6px', fontWeight: 600, textDecoration: 'none', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              ▣ QR
            </a>
            <span style={{ background: '#D4FF0015', color: '#D4FF00', border: '1px solid #D4FF0030', padding: '5px 12px', borderRadius: '6px', fontWeight: 600, fontSize: '12px', display: 'inline-flex', alignItems: 'center' }}>
              {isComplete ? t('viewProof') : t('track')}
            </span>
          </div>
        </div>
      </div>
    )
  }

  const sectionHead = (label, count) => (
    <div className="section-title" style={{ marginBottom: 12 }}>
      {label} <span style={{ color: '#D4FF00' }}>({count})</span>
    </div>
  )

  const emptyState = (msg) => (
    <div className="card" style={{ textAlign: 'center', color: colors.textSecondary, padding: 32, background: colors.card }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>📦</div>{msg}
    </div>
  )

  return (
    <div key={lang} style={{ minHeight: '100vh', background: colors.bg }}>
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{t('dashboard')}</h1>
            {lastRefresh && (
              <p style={{ margin: 0, color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                {t('updated')} {lastRefresh.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} &middot; {t('autoRefreshNote')}
              </p>
            )}
          </div>
          <button onClick={fetchOrders} style={{ background: colors.card, border: '1px solid ' + colors.border, color: colors.textSecondary, padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
            {t('refresh')}
          </button>
        </div>

        <WeatherAlert city="szczecin" compact={true} />

        {/* StatCards */}
        {!loading && orders.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: lang === 'pl' ? 'Zlecenia (mies.)' : 'Orders (month)', value: thisMonth.length, color: '#D4FF00' },
              { label: lang === 'pl' ? 'Wydatki (mies.)' : 'Spent (month)', value: 'PLN ' + plnSpent.toFixed(0), color: '#D4FF00' },
              { label: lang === 'pl' ? 'Skuteczność' : 'Success rate', value: successRate + '%', color: successRate >= 90 ? '#00C853' : successRate >= 70 ? '#FF9500' : '#FF3B30' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: colors.card, border: '1px solid ' + colors.border, borderRadius: 10, padding: '16px 18px' }}>
                <div style={{ color: colors.textSecondary, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
                <div style={{ color, fontWeight: 900, fontSize: 22, fontFamily: "'Fira Code', monospace" }}>{value}</div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: colors.textSecondary }}>{t('loading')}</div>
        ) : !loading && orders.length === 0 ? (
          <div style={{ background: colors.card, border: '2px dashed ' + colors.border, borderRadius: '14px', padding: '48px 24px', textAlign: 'center', marginTop: 24 }}>
            <div style={{ fontSize: '40px', marginBottom: '14px' }}>📦</div>
            <div style={{ fontFamily: "'Space Grotesk', system-ui", fontSize: '20px', fontWeight: 700, color: colors.text, marginBottom: '8px' }}>
              {lang === 'pl' ? 'Brak aktywnych dostaw' : 'No active deliveries'}
            </div>
            <div style={{ color: colors.textSecondary, fontSize: '15px', marginBottom: '24px' }}>
              {lang === 'pl'
                ? 'Złóż pierwsze zlecenie i przydzielimy kuriera w ciągu kilku minut.'
                : 'Place your first order and we will assign a courier within minutes.'}
            </div>
            <a href="/orders/new" style={{ display: 'inline-block', background: '#D4FF00', color: '#000', padding: '14px 32px', borderRadius: '10px', fontWeight: 800, textDecoration: 'none', fontFamily: "'Space Grotesk', system-ui", fontSize: '15px' }}>
              {lang === 'pl' ? 'Złóż pierwsze zlecenie →' : 'Place your first order →'}
            </a>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            <div>
              <div style={{ marginBottom: 24 }}>
                {sectionHead(t('activeDeliveries'), active.length)}
                {active.length === 0 ? emptyState(t('noActive')) : active.map(o => card(o))}
              </div>
              <div>
                {sectionHead(t('pendingOrders'), pending.length)}
                {pending.length === 0 ? emptyState(t('noPending')) : pending.map(o => card(o))}
              </div>
            </div>
            <div>
              {sectionHead(t('completedToday'), completed.length)}
              {completed.length === 0 ? emptyState(t('noCompleted')) : completed.map(o => card(o))}
            </div>
          </div>
        )}
      </main>

      <footer style={{ borderTop: '1px solid ' + colors.border, padding: '20px 16px', textAlign: 'center', color: colors.textSecondary, fontSize: 12, marginTop: 48 }}>
        <div style={{ fontFamily: "'Space Grotesk', system-ui", fontSize: '13px', color: colors.textSecondary, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
          Less guessing. More doing.
        </div>
        {t('poweredBy')} &middot; lgkcourierapp@gmail.com
      </footer>
    </div>
  )
}
