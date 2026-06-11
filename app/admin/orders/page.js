'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const M = {
  mono: { fontFamily: "'Fira Code', monospace" },
  display: { fontFamily: "'Space Grotesk', sans-serif" },
};

const STATUS_CONFIG = {
  pending:          { label: 'Pending',       color: '#FF9500', bg: 'rgba(255,149,0,0.1)' },
  awaiting_payment: { label: 'Awaiting Pay',  color: '#FF9500', bg: 'rgba(255,149,0,0.1)' },
  assigned:         { label: 'Assigned',      color: '#007BFF', bg: 'rgba(0,123,255,0.1)' },
  collected:        { label: 'Collected',     color: '#007BFF', bg: 'rgba(0,123,255,0.1)' },
  in_transit:       { label: 'In Transit',    color: '#D4FF00', bg: 'rgba(212,255,0,0.1)' },
  delivered:        { label: 'Delivered',     color: '#00C853', bg: 'rgba(0,200,83,0.1)'  },
  failed:           { label: 'Failed',        color: '#FF3B30', bg: 'rgba(255,59,48,0.1)' },
  cancelled:        { label: 'Cancelled',     color: '#555',    bg: 'rgba(85,85,85,0.1)'  },
};

const COLS = '140px 1fr 1fr 100px 120px 70px 130px';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [approving, setApproving] = useState(null);
  const [confirmingPayment, setConfirmingPayment] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('deliveries')
      .select('id, status, payment_status, pickup_city, delivery_city, delivery_street, price_total, created_at, client_id, profiles(name, email)')
      .order('created_at', { ascending: false })
      .limit(100);
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    setOrders(data || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const confirmPayment = async (id) => {
    setConfirmingPayment(id);
    await supabase
      .from('deliveries')
      .update({ payment_status: 'paid' })
      .eq('id', id);
    setConfirmingPayment(null);
    load();
  };

  const approve = async (id) => {
    setApproving(id);
    await supabase
      .from('deliveries')
      .update({ status: 'pending' })
      .eq('id', id)
      .eq('status', 'awaiting_payment');
    setApproving(null);
    load();
  };

  const filtered = orders.filter(o => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      o['id']?.toLowerCase().includes(s) ||
      o.delivery_street?.toLowerCase().includes(s) ||
      o.pickup_city?.toLowerCase().includes(s) ||
      o.delivery_city?.toLowerCase().includes(s) ||
      o.profiles?.email?.toLowerCase().includes(s)
    );
  });

  const pendingApproval = orders.filter(o => o.status === 'awaiting_payment').length;
  const pendingPayments = orders.filter(o => o.payment_status === 'pending_verification').length;

  const FILTERS = [
    ['all',             'All'],
    ['awaiting_payment','Awaiting Pay'],
    ['pending',         'Pending'],
    ['in_transit',      'In Transit'],
    ['delivered',       'Delivered'],
    ['failed',          'Failed'],
  ];

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1400px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ ...M.display, fontSize: '22px', fontWeight: 900, color: '#FFF', margin: '0 0 3px' }}>Orders</h1>
          <div style={{ ...M.mono, fontSize: '11px', color: '#444' }}>Live order stream · last 100</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {pendingPayments > 0 && (
            <div style={{
              background: 'rgba(0,123,255,0.1)', border: '1px solid rgba(0,123,255,0.3)',
              borderRadius: '8px', padding: '7px 14px',
              ...M.display, fontSize: '12px', color: '#007BFF', fontWeight: 700,
            }}>
              💳 {pendingPayments} payment{pendingPayments > 1 ? 's' : ''} to confirm
            </div>
          )}
          {pendingApproval > 0 && (
            <div style={{
              background: 'rgba(255,149,0,0.1)', border: '1px solid rgba(255,149,0,0.3)',
              borderRadius: '8px', padding: '7px 14px',
              ...M.display, fontSize: '12px', color: '#FF9500', fontWeight: 700,
            }}>
              {pendingApproval} awaiting approval
            </div>
          )}
          <input
            placeholder="search id, address, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              background: '#141414', border: '1px solid #2A2A2A', borderRadius: '8px',
              color: '#FFF', padding: '8px 14px', fontSize: '12px',
              fontFamily: "'Fira Code', monospace", width: '240px', outline: 'none',
            }}
          />
          <button onClick={load} style={{
            background: 'transparent', border: '1px solid #1E1E1E', color: '#444',
            padding: '8px 14px', borderRadius: '8px', cursor: 'pointer',
            fontFamily: "'Fira Code', monospace", fontSize: '11px',
          }}>↻</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {FILTERS.map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            padding: '7px 14px', borderRadius: '7px',
            border: `1px solid ${val === 'awaiting_payment' && filter !== val && pendingApproval > 0 ? 'rgba(255,149,0,0.4)' : '#2A2A2A'}`,
            background: filter === val ? '#D4FF00' : '#141414',
            color: filter === val ? '#000' : '#666',
            cursor: 'pointer', ...M.display, fontSize: '12px', fontWeight: filter === val ? 700 : 400,
          }}>{label}{val === 'awaiting_payment' && pendingApproval > 0 && filter !== val ? ` (${pendingApproval})` : ''}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ ...M.mono, color: '#333', fontSize: '13px', padding: '40px 0' }}>loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ ...M.display, color: '#333', fontSize: '14px', padding: '60px', textAlign: 'center' }}>No orders found</div>
      ) : (
        <div style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: COLS, gap: '12px', padding: '10px 18px', borderBottom: '1px solid #1E1E1E' }}>
            {['Order ID', 'Route', 'Client', 'Value', 'Status', 'Date', 'Action'].map(h => (
              <span key={h} style={{ ...M.mono, fontSize: '10px', color: '#333', letterSpacing: '1px', textTransform: 'uppercase' }}>{h}</span>
            ))}
          </div>

          {filtered.map((o, i) => {
            const sc = STATUS_CONFIG[o.status] || { label: o.status, color: '#555', bg: 'transparent' };
            const shortId = o['id']?.slice(-8).toUpperCase();
            const needsApproval = o.status === 'awaiting_payment';
            return (
              <div key={o['id']} style={{
                display: 'grid', gridTemplateColumns: COLS,
                gap: '12px', padding: '12px 18px',
                borderBottom: i < filtered.length - 1 ? '1px solid #111' : 'none',
                alignItems: 'center',
                background: needsApproval ? 'rgba(255,149,0,0.03)' : 'transparent',
              }}>
                <span style={{ ...M.mono, fontSize: '12px', color: '#D4FF00' }}>#{shortId}</span>

                <div>
                  <span style={{ ...M.display, fontSize: '13px', color: '#CCC' }}>
                    {o.pickup_city} → {o.delivery_city}
                  </span>
                  {o.delivery_street && (
                    <div style={{ ...M.mono, fontSize: '10px', color: '#444', marginTop: '2px' }}>{o.delivery_street}</div>
                  )}
                </div>

                <span style={{ ...M.display, fontSize: '12px', color: '#888' }}>
                  {o.profiles?.name || o.profiles?.email?.split('@')[0] || '—'}
                </span>

                <span style={{ ...M.mono, fontSize: '13px', fontWeight: 700, color: '#D4FF00' }}>
                  PLN {(o.price_total || 0).toFixed(2)}
                </span>

                <span style={{
                  ...M.display, fontSize: '11px', fontWeight: 700,
                  color: sc.color, background: sc.bg,
                  padding: '3px 8px', borderRadius: '6px', textAlign: 'center',
                  display: 'inline-block',
                }}>{sc.label}</span>

                <span style={{ ...M.mono, fontSize: '10px', color: '#444' }}>
                  {new Date(o.created_at).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })}
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {o.payment_status === 'pending_verification' && (
                    <button
                      onClick={() => confirmPayment(o['id'])}
                      disabled={confirmingPayment === o['id']}
                      style={{
                        background: confirmingPayment === o['id'] ? '#1A1A1A' : '#007BFF',
                        color: confirmingPayment === o['id'] ? '#444' : '#fff',
                        border: 'none', padding: '6px 12px',
                        borderRadius: '7px', cursor: confirmingPayment === o['id'] ? 'not-allowed' : 'pointer',
                        ...M.display, fontSize: '11px', fontWeight: 700,
                        whiteSpace: 'nowrap',
                      }}
                    >{confirmingPayment === o['id'] ? '...' : '💳 Confirm Pay'}</button>
                  )}
                  {needsApproval && (
                    <button
                      onClick={() => approve(o['id'])}
                      disabled={approving === o['id']}
                      style={{
                        background: approving === o['id'] ? '#1A1A1A' : '#00C853',
                        color: approving === o['id'] ? '#444' : '#000',
                        border: 'none', padding: '6px 12px',
                        borderRadius: '7px', cursor: approving === o['id'] ? 'not-allowed' : 'pointer',
                        ...M.display, fontSize: '11px', fontWeight: 700,
                        whiteSpace: 'nowrap',
                      }}
                    >{approving === o['id'] ? '...' : '✓ Approve'}</button>
                  )}
                  {!needsApproval && o.payment_status !== 'pending_verification' && (
                    <span style={{ ...M.mono, fontSize: '10px', color: '#2A2A2A' }}>—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && (
        <div style={{ ...M.mono, fontSize: '10px', color: '#333', marginTop: '12px', textAlign: 'right' }}>
          {filtered.length} orders shown
        </div>
      )}
    </div>
  );
}
