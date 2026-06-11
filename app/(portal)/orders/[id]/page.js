'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/utils/appContext'

export default function OrderPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id
  const searchParams = useSearchParams()
  const isCreated = searchParams.get('created') === 'true'
  const { colors } = useApp()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/login'); return }
      const { data } = await supabase
        .from('deliveries')
        .select('*')
        .eq('id', id)
        .eq('client_id', user['id'])
        .single()
      setOrder(data || null)
      setLoading(false)
    })
  }, [id, router])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: colors?.bg || '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#888' }}>
      Loading order...
    </div>
  )

  if (!order) return (
    <div style={{ minHeight: '100vh', background: colors?.bg || '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF3B30', fontSize: 14 }}>
      Order not found
    </div>
  )

  const amount = parseFloat(order.amount_pln || order.price_total || 0)
  const revolutUser = process.env.NEXT_PUBLIC_REVOLUT_USER
  const revolutBase = revolutUser
    ? `https://revolut.me/${revolutUser}`
    : (process.env.NEXT_PUBLIC_REVOLUT_LINK || null)
  const revolutHref = revolutBase && amount > 0 ? revolutBase : null

  return (
    <div style={{ minHeight: '100vh', background: colors?.bg || '#f9fafb' }}>

      {/* Nav bar */}
      <div style={{ background: '#0A0A0A', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <a href="/orders" style={{ color: '#D4FF00', textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
          ← Orders
        </a>
        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>/</span>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
          {order.order_number || order['id'].slice(-8).toUpperCase()}
        </span>
      </div>

      {/* Payment banner — shown when ?created=true or payment pending */}
      {(isCreated || order.payment_status !== 'paid') && revolutHref && amount > 0 && (
        <div style={{
          background: '#0A0A0A',
          borderBottom: '1px solid #1E1E1E',
          padding: '16px 24px',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{ flex: 1 }}>
            {isCreated && (
              <div style={{ fontSize: 13, fontWeight: 700, color: '#D4FF00', marginBottom: 4 }}>
                ✓ Order placed — payment required to confirm pickup
              </div>
            )}
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
              Amount due: <strong style={{ color: '#fff' }}>PLN {amount.toFixed(2)}</strong>
            </div>
          </div>
          <a
            href={revolutHref}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#D4FF00',
              color: '#000',
              padding: '10px 20px',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 14,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            💳 Pay PLN {amount.toFixed(2)} →
          </a>
        </div>
      )}

      {/* Order details */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: colors?.text || '#0A0A0A' }}>
            {order.order_number || 'Order ' + order['id'].slice(-8).toUpperCase()}
          </h1>
          <span style={{
            fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 6,
            background: order.status === 'delivered' ? '#00C85320'
              : order.status === 'in_transit' ? '#007BFF20'
              : '#FF950020',
            color: order.status === 'delivered' ? '#00C853'
              : order.status === 'in_transit' ? '#007BFF'
              : '#FF9500',
          }}>
            {(order.status || 'pending').replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>

        {/* Address card */}
        <div style={{ background: colors?.card || '#fff', border: '1px solid ' + (colors?.border || '#E5E7EB'), borderRadius: 12, padding: 20, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Delivery details</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>FROM</div>
              <div style={{ fontSize: 14, color: colors?.text || '#0A0A0A' }}>{order.pickup_address || '—'}</div>
            </div>
            <div style={{ borderTop: '1px solid ' + (colors?.border || '#E5E7EB'), paddingTop: 8 }}>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>TO</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: colors?.text || '#0A0A0A' }}>{order.delivery_address || '—'}</div>
              {order.recipient_name && <div style={{ fontSize: 13, color: colors?.textSecondary || '#6B7280', marginTop: 2 }}>{order.recipient_name}</div>}
              {order.recipient_phone && <div style={{ fontSize: 12, color: colors?.textSecondary || '#6B7280' }}>{order.recipient_phone}</div>}
            </div>
          </div>
        </div>

        {/* Amount card */}
        <div style={{ background: colors?.card || '#fff', border: '1px solid ' + (colors?.border || '#E5E7EB'), borderRadius: 12, padding: 20, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Amount</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: colors?.text || '#0A0A0A', fontFamily: 'monospace' }}>
              PLN {amount.toFixed(2)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>Payment</div>
            <div style={{
              fontSize: 12, fontWeight: 700,
              color: order.payment_status === 'paid' ? '#00C853' : '#FF9500',
            }}>
              {order.payment_status === 'paid' ? '✓ Paid' : 'Pending'}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <a
            href={'/orders/' + order['id'] + '/label'}
            style={{ flex: 1, background: '#0A0A0A', color: '#D4FF00', padding: '12px 16px', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none', textAlign: 'center', display: 'block' }}
          >
            🖨️ View & print label
          </a>
          {revolutHref && order.payment_status !== 'paid' && (
            <a
              href={revolutHref}
              target="_blank"
              rel="noopener noreferrer"
              style={{ flex: 1, background: '#D4FF00', color: '#000', padding: '12px 16px', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none', textAlign: 'center', display: 'block' }}
            >
              💳 Pay via Revolut
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
