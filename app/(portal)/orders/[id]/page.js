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
  const [hasCopied, setHasCopied] = useState(false)
  const [paymentSent, setPaymentSent] = useState(false)

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
  const orderRef = order.order_number || order['id'].slice(-8).toUpperCase()
  const revolutUser = process.env.NEXT_PUBLIC_REVOLUT_USER
  const revolutBase = revolutUser
    ? `https://revolut.me/${revolutUser}`
    : (process.env.NEXT_PUBLIC_REVOLUT_LINK || null)
  const revolutHref = revolutBase || null

  const handlePay = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(orderRef).catch(() => {})
    }
    setHasCopied(true)
    window.open(revolutHref, '_blank', 'noopener,noreferrer')
  }

  const handlePaid = async () => {
    setPaymentSent(true)
    await supabase
      .from('deliveries')
      .update({ payment_status: 'pending_verification' })
      .eq('id', id)
  }

  const isPaid = order.payment_status === 'paid'
  const showPayment = !isPaid && amount > 0 && revolutHref

  return (
    <div style={{ minHeight: '100vh', background: colors?.bg || '#f9fafb' }}>

      {/* Nav bar */}
      <div style={{ background: '#0A0A0A', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <a href="/orders" style={{ color: '#D4FF00', textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
          ← Orders
        </a>
        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>/</span>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
          {orderRef}
        </span>
      </div>

      {/* Order placed confirmation strip */}
      {isCreated && (
        <div style={{ background: '#0F1A00', borderBottom: '1px solid #2A3800', padding: '12px 24px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#D4FF00' }}>
            ✓ Order placed — complete payment below to confirm pickup
          </div>
        </div>
      )}

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px' }}>

        {/* Header */}
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

        {/* Payment card */}
        <div style={{ background: '#0A0A0A', borderRadius: 12, padding: 20, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Amount due</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', fontFamily: 'monospace' }}>
                PLN {amount.toFixed(2)}
              </div>
            </div>
            <div style={{
              fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6,
              background: isPaid ? '#00C85320' : paymentSent ? '#007BFF20' : '#FF950020',
              color: isPaid ? '#00C853' : paymentSent ? '#007BFF' : '#FF9500',
            }}>
              {isPaid ? '✓ Paid' : paymentSent ? 'Sent' : 'Pending'}
            </div>
          </div>

          {paymentSent ? (
            <div style={{ background: '#00C85312', border: '1px solid #00C85340', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#00C853', marginBottom: 4 }}>✓ Thanks — we'll confirm shortly</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Your order will be confirmed once payment is verified</div>
            </div>
          ) : isPaid ? (
            <div style={{ fontSize: 13, color: '#00C853', fontWeight: 600 }}>✓ Payment confirmed</div>
          ) : showPayment ? (
            <>
              {hasCopied && (
                <div style={{ background: '#D4FF0010', border: '1px solid #D4FF0030', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#D4FF00', marginBottom: 6 }}>
                    📋 Order # copied to clipboard
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
                    1. Paste <span style={{ fontFamily: 'monospace', color: '#fff', background: '#1A1A1A', padding: '1px 6px', borderRadius: 4 }}>{orderRef}</span> in the Revolut payment note
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
                    2. Send <strong style={{ color: '#fff' }}>PLN {amount.toFixed(2)}</strong> to <strong style={{ color: '#fff' }}>@{revolutUser || 'lgk'}</strong>
                  </div>
                </div>
              )}

              <button
                onClick={handlePay}
                style={{ width: '100%', background: '#D4FF00', color: '#000', padding: '15px 20px', borderRadius: 10, fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', marginBottom: 10 }}
              >
                💳 Pay PLN {amount.toFixed(2)} via Revolut →
              </button>

              {hasCopied && (
                <button
                  onClick={handlePaid}
                  style={{ width: '100%', background: 'transparent', border: '1px solid #2A2A2A', color: 'rgba(255,255,255,0.6)', padding: '13px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
                >
                  ✓ I've paid
                </button>
              )}
            </>
          ) : null}
        </div>

        {/* Label button */}
        <a
          href={'/orders/' + order['id'] + '/label'}
          style={{ display: 'block', background: colors?.card || '#fff', border: '1px solid ' + (colors?.border || '#E5E7EB'), color: colors?.text || '#0A0A0A', padding: '14px 16px', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none', textAlign: 'center' }}
        >
          🖨️ View & print label
        </a>

      </div>
    </div>
  )
}
