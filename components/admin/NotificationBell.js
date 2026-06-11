'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export function NotificationBell() {
  const [unread, setUnread] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const [permission, setPermission] = useState('default')
  const ref = useRef(null)

  useEffect(() => {
    if ('Notification' in window) setPermission(Notification.permission)
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('admin-payment-alerts')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'deliveries',
      }, (payload) => {
        if (payload.new.payment_status !== 'pending_verification') return
        const o = payload.new
        const orderRef = o.order_number || o['id'].slice(-8).toUpperCase()
        const amount = parseFloat(o.amount_pln || o.price_total || 0)
        const entry = { id: o['id'], orderRef, amount, at: new Date(), read: false }
        setNotifications(prev => [entry, ...prev].slice(0, 30))
        setUnread(n => n + 1)
        if (Notification.permission === 'granted') {
          new Notification('💳 Payment sent', {
            body: `${orderRef} — PLN ${amount.toFixed(2)}`,
            icon: '/icons/icon-192.png',
            tag: o['id'],
            requireInteraction: true,
          })
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const requestPermission = async () => {
    const result = await Notification.requestPermission()
    setPermission(result)
  }

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnread(0)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => { setOpen(o => !o); if (!open && unread > 0) markAllRead() }}
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          position: 'relative', padding: '6px', borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        title="Notifications"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={unread > 0 ? '#D4FF00' : '#555'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            background: '#FF3B30', color: '#fff',
            fontSize: 9, fontWeight: 700, borderRadius: 999,
            minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px', lineHeight: 1,
          }}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: 300, background: '#141414', border: '1px solid #2A2A2A',
          borderRadius: 12, zIndex: 9999, overflow: 'hidden',
          boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
          animation: 'fadeIn 0.15s ease',
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #1E1E1E', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Notifications</span>
            {permission !== 'granted' && (
              <button onClick={requestPermission} style={{ background: '#D4FF00', color: '#000', border: 'none', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                Enable alerts
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: '#444', fontSize: 13 }}>
              No notifications yet
            </div>
          ) : (
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {notifications.map((n) => (
                <a
                  key={n.id + n.at}
                  href={'/admin/orders'}
                  style={{
                    display: 'block', padding: '12px 16px',
                    borderBottom: '1px solid #111', textDecoration: 'none',
                    background: n.read ? 'transparent' : '#D4FF0008',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>💳 Payment sent</span>
                    <span style={{ fontSize: 10, color: '#444' }}>
                      {n.at.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#888' }}>
                    <span style={{ fontFamily: 'monospace', color: '#D4FF00' }}>{n.orderRef}</span>
                    {' — PLN '}<strong style={{ color: '#fff' }}>{n.amount.toFixed(2)}</strong>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
