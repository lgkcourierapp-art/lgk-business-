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

const COLS = '140px 1fr 1fr 100px 110px 110px 70px 150px';
const REVOLUT_BASE = process.env.NEXT_PUBLIC_REVOLUT_LINK || 'revolut.me/brianv7t';

const isUnderpaid = (o) =>
  o.payment_status !== 'paid' &&
  (o.payment_received_pln || 0) > 0 &&
  (o.payment_received_pln || 0) < (o.price_total || 0);

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [approving, setApproving] = useState(null);
  const [confirmingPayment, setConfirmingPayment] = useState(null);
  const [chasing, setChasing] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payCourierPay, setPayCourierPay] = useState('');
  const [payResult, setPayResult] = useState(null);
  const [payError, setPayError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('deliveries')
      .select('id, order_number, status, payment_status, payment_received_pln, pickup_city, delivery_city, delivery_street, price_total, created_at, client_id, courier_id, profiles!client_id(name, company_name, business_name, business_type, phone, email)')
      .order('created_at', { ascending: false })
      .limit(100);
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    setOrders(data || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const openPayModal = (o) => {
    const dv = Math.max(0, (o.price_total || 0) - 5.95);
    const clientName = o.profiles?.business_name || o.profiles?.company_name || o.profiles?.name || o.profiles?.email?.split('@')[0] || '—';
    setPayModal({
      id: o['id'],
      orderNumber: o.order_number,
      priceTotal: o.price_total || 0,
      shortId: o['id']?.slice(-8).toUpperCase(),
      clientName,
      clientType: o.profiles?.business_type || 'general',
      clientPhone: o.profiles?.phone || '',
      courierId: o.courier_id || null,
    });
    setPayAmount((o.price_total || 0).toFixed(2));
    setPayCourierPay((dv * 0.72).toFixed(2));
    setPayResult(null);
    setPayError(null);
  };

  const doConfirmPayment = async () => {
    if (!payModal) return;
    if (!payModal.courierId) {
      setPayError('Assign a courier before confirming payment.');
      return;
    }
    setPayError(null);
    setConfirmingPayment(payModal.id);
    const received = parseFloat(payAmount) || payModal.priceTotal;
    await supabase
      .from('deliveries')
      .update({
        payment_status: 'paid',
        status: 'pending',
        courier_payout_pln: parseFloat(payCourierPay) || 0,
        payment_received_pln: received,
      })
      .eq('id', payModal.id);

    // Trigger fires on payment_status → 'paid'; read back the split:
    const { data: fin } = await supabase
      .from('order_financials')
      .select('courier_earnings, lgk_margin, insurance_contribution')
      .eq('order_id', payModal.id)
      .single();

    if (fin) {
      setPayResult({
        courierEarns: fin.courier_earnings,
        lgkMargin: fin.lgk_margin,
        insurance: fin.insurance_contribution,
      });
    }

    setConfirmingPayment(null);
    load();
  };

  const doRecordPartial = async () => {
    if (!payModal) return;
    setConfirmingPayment(payModal.id);
    const received = parseFloat(payAmount) || 0;
    const shortfall = (payModal.priceTotal - received).toFixed(2);
    const revolutLink = `${REVOLUT_BASE}/PLN/${shortfall}`;
    const orderRef = payModal.orderNumber || `#${payModal.shortId}`;
    const message =
      `Zamówienie ${orderRef} wymaga dopłaty PLN ${shortfall}.\n` +
      `Łącznie: PLN ${payModal.priceTotal.toFixed(2)} · Otrzymano: PLN ${received.toFixed(2)}\n` +
      `Dopłać: ${revolutLink}\n` +
      `Kurier wyjedzie po potwierdzeniu pełnej płatności.`;

    await supabase
      .from('deliveries')
      .update({
        payment_received_pln: received,
        payment_chased_at: new Date().toISOString(),
      })
      .eq('id', payModal.id);

    const phone = payModal.clientPhone?.replace(/\D/g, '');
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      navigator.clipboard?.writeText(message);
      alert('No phone on file — chase message copied to clipboard');
    }

    setPayModal(null);
    setConfirmingPayment(null);
    load();
  };

  const handleChasePayment = async (o) => {
    setChasing(o['id']);
    const shortfall = ((o.price_total || 0) - (o.payment_received_pln || 0)).toFixed(2);
    const revolutLink = `${REVOLUT_BASE}/PLN/${shortfall}`;
    const orderRef = o.order_number || `#${o['id']?.slice(-8).toUpperCase()}`;
    const message =
      `Zamówienie ${orderRef} wymaga dopłaty PLN ${shortfall}.\n` +
      `Łącznie: PLN ${(o.price_total || 0).toFixed(2)} · ` +
      `Otrzymano: PLN ${(o.payment_received_pln || 0).toFixed(2)}\n` +
      `Dopłać: ${revolutLink}\n` +
      `Kurier wyjedzie po potwierdzeniu pełnej płatności.`;

    await supabase
      .from('deliveries')
      .update({ payment_chased_at: new Date().toISOString() })
      .eq('id', o['id']);

    const phone = o.profiles?.phone?.replace(/\D/g, '');
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      navigator.clipboard?.writeText(message);
      alert('No phone on file — chase message copied to clipboard');
    }

    setChasing(null);
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
      o.order_number?.toLowerCase().includes(s) ||
      o.delivery_street?.toLowerCase().includes(s) ||
      o.pickup_city?.toLowerCase().includes(s) ||
      o.delivery_city?.toLowerCase().includes(s) ||
      o.profiles?.business_name?.toLowerCase().includes(s) ||
      o.profiles?.company_name?.toLowerCase().includes(s) ||
      o.profiles?.name?.toLowerCase().includes(s) ||
      o.profiles?.email?.toLowerCase().includes(s)
    );
  });

  const pendingApproval = orders.filter(o => o.status === 'awaiting_payment').length;
  const pendingPayments = orders.filter(o => o.payment_status === 'pending_verification').length;
  const underpaidCount = orders.filter(isUnderpaid).length;

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
          {underpaidCount > 0 && (
            <div style={{
              background: 'rgba(255,149,0,0.1)', border: '1px solid rgba(255,149,0,0.3)',
              borderRadius: '8px', padding: '7px 14px',
              ...M.display, fontSize: '12px', color: '#FF9500', fontWeight: 700,
            }}>
              ⚠ {underpaidCount} underpaid
            </div>
          )}
          {pendingPayments > 0 && (
            <div style={{
              background: 'rgba(0,123,255,0.1)', border: '1px solid rgba(0,123,255,0.3)',
              borderRadius: '8px', padding: '7px 14px',
              ...M.display, fontSize: '12px', color: '#007BFF', fontWeight: 700,
            }}>
              💳 {pendingPayments} to confirm
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
            placeholder="search id, name, address..."
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
            {['Order ID', 'Route', 'Client', 'Value', 'Status', 'Payment', 'Date', 'Action'].map(h => (
              <span key={h} style={{ ...M.mono, fontSize: '10px', color: '#333', letterSpacing: '1px', textTransform: 'uppercase' }}>{h}</span>
            ))}
          </div>

          {filtered.map((o, i) => {
            const sc = STATUS_CONFIG[o.status] || { label: o.status, color: '#555', bg: 'transparent' };
            const shortId = o['id']?.slice(-8).toUpperCase();
            const needsApproval = o.status === 'awaiting_payment';
            const underpaid = isUnderpaid(o);
            const shortfall = underpaid ? ((o.price_total || 0) - (o.payment_received_pln || 0)) : 0;
            const clientName = o.profiles?.business_name || o.profiles?.company_name || o.profiles?.name || '—';
            const isRestaurant = o.profiles?.business_type === 'restaurant';
            return (
              <div key={o['id']} style={{
                display: 'grid', gridTemplateColumns: COLS,
                gap: '12px', padding: '12px 18px',
                borderBottom: i < filtered.length - 1 ? '1px solid #111' : 'none',
                alignItems: 'center',
                background: underpaid ? 'rgba(255,149,0,0.03)' : needsApproval ? 'rgba(255,149,0,0.03)' : 'transparent',
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

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: '11px' }}>{isRestaurant ? '🍽️' : '📦'}</span>
                    <span style={{ ...M.display, fontSize: '12px', color: '#CCC', fontWeight: 600 }}>{clientName}</span>
                  </div>
                  {o.profiles?.email && (
                    <div style={{ ...M.mono, fontSize: '10px', color: '#444', marginTop: '1px' }}>
                      {o.profiles.email.split('@')[0]}
                    </div>
                  )}
                </div>

                <span style={{ ...M.mono, fontSize: '13px', fontWeight: 700, color: '#D4FF00' }}>
                  PLN {(o.price_total || 0).toFixed(2)}
                </span>

                <span style={{
                  ...M.display, fontSize: '11px', fontWeight: 700,
                  color: sc.color, background: sc.bg,
                  padding: '3px 8px', borderRadius: '6px', textAlign: 'center',
                  display: 'inline-block',
                }}>{sc.label}</span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{
                    ...M.display, fontSize: '11px', fontWeight: 700,
                    color: o.payment_status === 'paid' ? '#00C853'
                      : o.payment_status === 'pending_verification' ? '#007BFF'
                      : '#555',
                    background: o.payment_status === 'paid' ? 'rgba(0,200,83,0.1)'
                      : o.payment_status === 'pending_verification' ? 'rgba(0,123,255,0.1)'
                      : 'transparent',
                    padding: o.payment_status === 'paid' || o.payment_status === 'pending_verification' ? '3px 8px' : '0',
                    borderRadius: 6, display: 'inline-block',
                  }}>
                    {o.payment_status === 'paid' ? '✓ Paid'
                      : o.payment_status === 'pending_verification' ? '💳 Verifying'
                      : o.payment_status === 'awaiting' ? 'Awaiting'
                      : o.payment_status || '—'}
                  </span>
                  {underpaid && (
                    <span style={{
                      ...M.mono, fontSize: '10px', color: '#FF9500',
                      background: 'rgba(255,149,0,0.1)',
                      padding: '2px 6px', borderRadius: 4, display: 'inline-block',
                    }}>
                      ⚠ −PLN {shortfall.toFixed(2)}
                    </span>
                  )}
                  {o.payment_status === 'paid' && !o.courier_id && (
                    <span style={{
                      fontSize: 10, padding: '2px 8px',
                      borderRadius: 10, background: 'rgba(220,38,38,0.12)',
                      color: '#DC2626', fontWeight: 500, display: 'inline-block',
                    }}>
                      ⚠ No courier assigned
                    </span>
                  )}
                </div>

                <span style={{ ...M.mono, fontSize: '10px', color: '#444' }}>
                  {(() => {
                    const d = new Date(o.created_at);
                    const isToday = d.toDateString() === new Date().toDateString();
                    return isToday
                      ? d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
                      : d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' });
                  })()}
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {o.payment_status === 'pending_verification' && (
                    <button
                      onClick={() => openPayModal(o)}
                      disabled={confirmingPayment === o['id']}
                      style={{
                        background: confirmingPayment === o['id'] ? '#1A1A1A' : '#007BFF',
                        color: confirmingPayment === o['id'] ? '#444' : '#fff',
                        border: 'none', padding: '6px 12px',
                        borderRadius: '7px', cursor: confirmingPayment === o['id'] ? 'not-allowed' : 'pointer',
                        ...M.display, fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap',
                      }}
                    >{confirmingPayment === o['id'] ? '...' : '💳 Confirm Pay'}</button>
                  )}
                  {o.payment_status !== 'paid' && o.payment_status !== 'pending_verification' && (
                    <button
                      onClick={() => openPayModal(o)}
                      disabled={confirmingPayment === o['id']}
                      style={{
                        background: 'transparent',
                        color: confirmingPayment === o['id'] ? '#333' : '#555',
                        border: '1px solid #2A2A2A', padding: '6px 12px',
                        borderRadius: '7px', cursor: confirmingPayment === o['id'] ? 'not-allowed' : 'pointer',
                        ...M.display, fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap',
                      }}
                    >{confirmingPayment === o['id'] ? '...' : '✓ Mark Paid'}</button>
                  )}
                  {underpaid && (
                    <button
                      onClick={() => handleChasePayment(o)}
                      disabled={chasing === o['id']}
                      style={{
                        background: chasing === o['id'] ? '#1A1A1A' : 'rgba(255,149,0,0.15)',
                        color: chasing === o['id'] ? '#444' : '#FF9500',
                        border: '1px solid rgba(255,149,0,0.3)', padding: '6px 12px',
                        borderRadius: '7px', cursor: chasing === o['id'] ? 'not-allowed' : 'pointer',
                        ...M.display, fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap',
                      }}
                    >{chasing === o['id'] ? '...' : `📩 Chase ${shortfall.toFixed(0)}`}</button>
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
                        ...M.display, fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap',
                      }}
                    >{approving === o['id'] ? '...' : '✓ Approve'}</button>
                  )}
                  {!needsApproval && !underpaid && o.payment_status === 'paid' && (
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

      {payModal && (
        <div
          onClick={() => !confirmingPayment && setPayModal(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: '14px', padding: '24px', width: '400px', maxWidth: '92vw' }}
          >
            {/* Header — client name + business type badge */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div style={{ ...M.display, fontSize: '16px', fontWeight: 700, color: '#FFF' }}>Confirm payment</div>
              <span style={{
                fontSize: '10px', padding: '3px 9px', borderRadius: 10,
                background: payModal.clientType === 'restaurant' ? 'rgba(249,115,22,0.12)' : 'rgba(0,123,255,0.12)',
                color: payModal.clientType === 'restaurant' ? '#EA580C' : '#007BFF',
                fontWeight: 600, flexShrink: 0, marginLeft: 10,
              }}>
                {payModal.clientType === 'restaurant' ? '🍽️ Restaurant' : '📦 Business'}
              </span>
            </div>
            <div style={{ ...M.display, fontSize: '13px', color: '#888', fontWeight: 600, marginBottom: '3px' }}>
              {payModal.clientName}
            </div>
            <div style={{ ...M.mono, fontSize: '11px', color: '#555', marginBottom: '22px' }}>
              {payModal.orderNumber ? `Order ${payModal.orderNumber}` : `Order #${payModal.shortId}`} · billed PLN {payModal.priceTotal.toFixed(2)}
            </div>

            {payResult ? (
              <>
                <div style={{ background: 'rgba(0,200,83,0.08)', border: '1px solid rgba(0,200,83,0.25)', borderRadius: '8px', padding: '12px 14px', marginBottom: '18px', ...M.mono, fontSize: '11px' }}>
                  <div style={{ color: '#00C853', fontWeight: 700, marginBottom: '8px' }}>✓ Payment confirmed</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#555' }}>Courier earns</span>
                    <span style={{ color: '#FFF' }}>PLN {(payResult.courierEarns || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#555' }}>LGK margin</span>
                    <span style={{ color: '#D4FF00' }}>PLN {(payResult.lgkMargin || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#555' }}>Insurance reserve</span>
                    <span style={{ color: '#888' }}>PLN {(payResult.insurance || 3).toFixed(2)}</span>
                  </div>
                </div>
                <div style={{ ...M.mono, fontSize: '10px', color: '#444', marginBottom: '14px' }}>
                  Trigger not yet active? Run the order_financials SQL first — trigger populates on payment_status → paid.
                </div>
                <button
                  onClick={() => setPayModal(null)}
                  style={{ width: '100%', background: '#00C853', color: '#000', border: 'none', padding: '11px', borderRadius: '8px', cursor: 'pointer', ...M.display, fontSize: '13px', fontWeight: 700 }}
                >Close</button>
              </>
            ) : (
              <>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ ...M.mono, fontSize: '10px', color: '#555', display: 'block', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    Amount received (PLN)
                  </label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    style={{ width: '100%', background: '#0A0A0A', border: `1px solid ${parseFloat(payAmount) < payModal.priceTotal ? '#FF9500' : '#2A2A2A'}`, borderRadius: '8px', color: '#FFF', padding: '10px 12px', fontSize: '16px', fontFamily: "'Fira Code', monospace", outline: 'none', boxSizing: 'border-box' }}
                  />
                  {parseFloat(payAmount) > 0 && parseFloat(payAmount) < payModal.priceTotal && (
                    <div style={{ ...M.mono, fontSize: '11px', color: '#FF9500', marginTop: '5px' }}>
                      ⚠ PLN {(payModal.priceTotal - parseFloat(payAmount)).toFixed(2)} underpaid
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <label style={{ ...M.mono, fontSize: '10px', color: '#555', display: 'block', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    Courier payout (PLN)
                  </label>
                  <input
                    type="number"
                    value={payCourierPay}
                    onChange={e => setPayCourierPay(e.target.value)}
                    style={{ width: '100%', background: '#0A0A0A', border: '1px solid #2A2A2A', borderRadius: '8px', color: '#FFF', padding: '10px 12px', fontSize: '16px', fontFamily: "'Fira Code', monospace", outline: 'none', boxSizing: 'border-box' }}
                  />
                  <div style={{ ...M.mono, fontSize: '10px', color: '#444', marginTop: '4px' }}>Courier must be assigned before confirming payment</div>
                </div>

                {parseFloat(payAmount) > 0 && parseFloat(payCourierPay) >= 0 && (
                  <div style={{ background: '#0A0A0A', borderRadius: '8px', padding: '12px 14px', marginBottom: '18px', ...M.mono, fontSize: '11px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ color: '#555' }}>Gross received</span>
                      <span style={{ color: '#FFF' }}>PLN {parseFloat(payAmount || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ color: '#555' }}>Courier</span>
                      <span style={{ color: '#007BFF' }}>− PLN {parseFloat(payCourierPay || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #1E1E1E', paddingTop: '5px', marginTop: '5px' }}>
                      <span style={{ color: '#888' }}>LGK net (est.)</span>
                      <span style={{ color: '#D4FF00', fontWeight: 700 }}>
                        PLN {Math.max(0, (parseFloat(payAmount || 0) - 7.00 - parseFloat(payCourierPay || 0)) * 0.91).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {payError && (
                  <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px', ...M.mono, fontSize: '11px', color: '#DC2626' }}>
                    ⚠ {payError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setPayModal(null)}
                    style={{ flex: 1, minWidth: '80px', background: 'transparent', border: '1px solid #2A2A2A', color: '#666', padding: '11px', borderRadius: '8px', cursor: 'pointer', ...M.display, fontSize: '13px', fontWeight: 600 }}
                  >Cancel</button>
                  {parseFloat(payAmount) > 0 && parseFloat(payAmount) < payModal.priceTotal && (
                    <button
                      onClick={doRecordPartial}
                      disabled={!!confirmingPayment}
                      style={{ flex: 2, minWidth: '140px', background: confirmingPayment ? '#1A1A1A' : 'rgba(255,149,0,0.15)', color: confirmingPayment ? '#444' : '#FF9500', border: '1px solid rgba(255,149,0,0.3)', padding: '11px', borderRadius: '8px', cursor: confirmingPayment ? 'not-allowed' : 'pointer', ...M.display, fontSize: '12px', fontWeight: 700 }}
                    >{confirmingPayment ? '...' : '📩 Record & Chase'}</button>
                  )}
                  <button
                    onClick={doConfirmPayment}
                    disabled={!!confirmingPayment}
                    style={{ flex: 2, minWidth: '120px', background: confirmingPayment ? '#1A1A1A' : '#00C853', color: confirmingPayment ? '#444' : '#000', border: 'none', padding: '11px', borderRadius: '8px', cursor: confirmingPayment ? 'not-allowed' : 'pointer', ...M.display, fontSize: '13px', fontWeight: 700 }}
                  >{confirmingPayment ? 'Saving...' : '✓ Confirm Paid'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
