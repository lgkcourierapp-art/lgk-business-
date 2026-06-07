'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import StatusBadge from '@/components/StatusBadge'
import Link from 'next/link'
import { useApp } from '@/utils/appContext'

const STATUS_DOTS = {
  pending:          { color: '#9CA3AF', pulse: false },
  accepted:         { color: '#3B82F6', pulse: true },
  assigned:         { color: '#3B82F6', pulse: true },
  collected:        { color: '#F59E0B', pulse: true },
  in_transit:       { color: '#D4FF00', pulse: true },
  delivered:        { color: '#10B981', pulse: false },
  failed:           { color: '#EF4444', pulse: false },
  expired:          { color: '#6B7280', pulse: false },
  cancelled:        { color: '#6B7280', pulse: false },
  awaiting_payment: { color: '#8B5CF6', pulse: false },
}

const FILTER_TABS = [
  { id: 'all',       labelPL: 'Wszystkie',  labelEN: 'All' },
  { id: 'active',    labelPL: 'Aktywne',    labelEN: 'Active' },
  { id: 'delivered', labelPL: 'Dostarczone', labelEN: 'Delivered' },
  { id: 'cancelled', labelPL: 'Anulowane',  labelEN: 'Cancelled' },
]

const ACTIVE_STATUSES = ['pending', 'accepted', 'assigned', 'collected', 'in_transit', 'awaiting_payment']

function matchesFilter(order, filter) {
  if (filter === 'all') return true
  if (filter === 'active') return ACTIVE_STATUSES.includes(order.status)
  if (filter === 'delivered') return order.status === 'delivered'
  if (filter === 'cancelled') return order.status === 'cancelled' || order.status === 'expired' || order.status === 'failed'
  return true
}

function matchesSearch(order, query) {
  if (!query) return true
  const q = query.toLowerCase()
  return (
    (order.order_number || '').toLowerCase().includes(q) ||
    (order['id'] || '').toLowerCase().includes(q) ||
    (order.recipient_name || '').toLowerCase().includes(q) ||
    (order.delivery_address || '').toLowerCase().includes(q) ||
    (order.pickup_address || '').toLowerCase().includes(q)
  )
}

export default function OrdersPage() {
  const router = useRouter()
  const { colors, lang } = useApp()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [userId, setUserId] = useState(null)

  const fetchOrders = useCallback(async (uid) => {
    if (!uid) return
    const { data } = await supabase
      .from('deliveries')
      .select('id, order_number, status, payment_status, pickup_address, delivery_address, recipient_name, recipient_phone, price_total, created_at, delivered_at')
      .eq('client_id', uid)
      .order('created_at', { ascending: false })
      .limit(200)
    setOrders(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user['id'])
      fetchOrders(user['id'])
    })
  }, [router, fetchOrders])

  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel('orders-list-' + userId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'deliveries',
        filter: 'client_id=eq.' + userId,
      }, () => {
        fetchOrders(userId)
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [userId, fetchOrders])

  const filtered = orders.filter(o => matchesFilter(o, filter) && matchesSearch(o, search))

  const fmt = (ts) => {
    if (!ts) return '—'
    const d = new Date(ts)
    const today = new Date()
    const isToday = d.toDateString() === today.toDateString()
    if (isToday) return d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.bg }}>
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: colors.text }}>
            {lang === 'pl' ? 'Zamówienia' : 'Orders'}
          </h1>
          <Link href="/orders/new"
            className="btn-primary"
            style={{ padding: '10px 20px', fontSize: 14, fontWeight: 700, textDecoration: 'none', borderRadius: 10 }}>
            + {lang === 'pl' ? 'Nowe' : 'New'}
          </Link>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder={lang === 'pl' ? 'Szukaj po numerze, odbiorcy, adresie...' : 'Search by number, recipient, address...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '11px 14px',
            background: colors.card,
            border: '1px solid ' + colors.border,
            borderRadius: 10,
            color: colors.text,
            fontSize: 14,
            outline: 'none',
            boxSizing: 'border-box',
            marginBottom: 14,
            fontFamily: 'inherit',
          }}
        />

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto' }}>
          {FILTER_TABS.map(tab => (
            <button
              key={tab['id']}
              type="button"
              onClick={() => setFilter(tab['id'])}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                border: '1px solid ' + (filter === tab['id'] ? '#D4FF00' : colors.border),
                background: filter === tab['id'] ? '#D4FF0015' : colors.card,
                color: filter === tab['id'] ? '#D4FF00' : colors.textSecondary,
                fontWeight: filter === tab['id'] ? 700 : 400,
                fontSize: 13,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontFamily: 'inherit',
              }}
            >
              {lang === 'pl' ? tab.labelPL : tab.labelEN}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div style={{ color: '#D4FF00', textAlign: 'center', padding: 40, fontWeight: 700 }}>
            {lang === 'pl' ? 'Ładowanie...' : 'Loading...'}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ color: colors.textSecondary, textAlign: 'center', padding: 40, fontSize: 14 }}>
            {lang === 'pl' ? 'Brak zamówień' : 'No orders found'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(order => {
              const dot = STATUS_DOTS[order.status] || STATUS_DOTS.pending
              const shortId = order.order_number || ('#' + order['id'].slice(-6).toUpperCase())
              return (
                <Link
                  key={order['id']}
                  href={'/orders/' + order['id']}
                  style={{
                    display: 'block',
                    background: colors.card,
                    border: '1px solid ' + colors.border,
                    borderRadius: 12,
                    padding: '14px 16px',
                    textDecoration: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: dot.color,
                          flexShrink: 0,
                          boxShadow: dot.pulse ? '0 0 0 2px ' + dot.color + '40' : 'none',
                        }} />
                        <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 12, color: '#D4FF00', fontWeight: 700 }}>
                          {shortId}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>
                      <div style={{ fontSize: 13, color: colors.text, fontWeight: 500, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {order.recipient_name || '—'}
                      </div>
                      <div style={{ fontSize: 12, color: colors.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {order.delivery_address || '—'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#D4FF00', fontFamily: "'Fira Code', monospace" }}>
                        PLN {(order.price_total || 0).toFixed(0)}
                      </div>
                      <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                        {fmt(order.delivered_at || order.created_at)}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

      </main>
    </div>
  )
}
