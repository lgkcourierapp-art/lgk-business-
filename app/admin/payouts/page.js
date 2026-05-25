'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const M = {
  mono: { fontFamily: "'Fira Code', monospace" },
  display: { fontFamily: "'Space Grotesk', sans-serif" },
};

const pln = (n) => `${(n || 0).toFixed(2)} zł`;

const WEEK_START = (() => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d.setDate(diff));
  mon.setHours(0, 0, 0, 0);
  return mon.toISOString();
})();

const WEEK_END = (() => {
  const d = new Date(WEEK_START);
  d.setDate(d.getDate() + 7);
  return d.toISOString();
})();

export default function AdminPayouts() {
  const [summary, setSummary] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [tab, setTab] = useState('pending');
  const [processing, setProcessing] = useState(false);
  const [note, setNote] = useState('');
  const [adminId, setAdminId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, color = '#00C853') => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: weekly }, { data: past }] = await Promise.all([
      supabase.from('weekly_payout_summary').select('*'),
      supabase
        .from('payouts')
        .select('*, courier:courier_id(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(60),
    ]);
    setSummary(weekly || []);
    setHistory(past || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setAdminId(session.user.id);
    });
    load();
  }, [load]);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === summary.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(summary.map(c => c.courier_id)));
    }
  };

  const handleMarkPaid = async () => {
    if (selected.size === 0) return;
    setProcessing(true);
    const toPay = summary.filter(c => selected.has(c.courier_id));
    const inserts = toPay.map(c => ({
      courier_id: c.courier_id,
      amount: c.pending_earnings,
      currency: 'PLN',
      payment_method: c.preferred_payment || 'revolut',
      revolut_username: c.revolut_username || null,
      bank_iban: c.bank_iban || null,
      status: 'sent',
      period_from: WEEK_START,
      period_to: WEEK_END,
      delivery_count: c.deliveries_this_week || 0,
      note: note || null,
      paid_by: adminId,
      paid_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('payouts').insert(inserts);
    if (error) {
      showToast('Error: ' + error.message, '#FF3B30');
    } else {
      showToast(`${inserts.length} payout${inserts.length > 1 ? 's' : ''} recorded as sent`);
      setSelected(new Set());
      setNote('');
      await load();
    }
    setProcessing(false);
  };

  const selectedTotal = summary
    .filter(c => selected.has(c.courier_id))
    .reduce((s, c) => s + (c.pending_earnings || 0), 0);

  const totalPending = summary.reduce((s, c) => s + (c.pending_earnings || 0), 0);

  const statusColor = (s) => ({ sent: '#00C853', confirmed: '#D4FF00', pending: '#FF9500', failed: '#FF3B30' }[s] || '#666');

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1100px', animation: 'fadeIn 0.2s ease' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '24px', zIndex: 9999,
          background: '#1A1A1A', border: `1px solid ${toast.color}`,
          borderRadius: '10px', padding: '12px 20px',
          ...M.display, fontSize: '13px', color: toast.color,
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}>{toast.msg}</div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ ...M.display, fontSize: '22px', fontWeight: 900, color: '#FFF', margin: '0 0 4px' }}>Payouts</h1>
          <div style={{ ...M.mono, fontSize: '11px', color: '#444', letterSpacing: '1px' }}>
            Week {new Date(WEEK_START).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })} — {new Date(WEEK_END).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: '2-digit' })}
          </div>
        </div>
        <button onClick={load} style={{
          background: 'transparent', border: '1px solid #1E1E1E', color: '#444',
          padding: '8px 14px', borderRadius: '8px', cursor: 'pointer',
          ...M.mono, fontSize: '11px',
        }}>↻ Refresh</button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '28px' }}>
        {[
          { label: 'Couriers owed', value: summary.length, color: '#FFF' },
          { label: 'Total pending', value: pln(totalPending), color: '#D4FF00' },
          { label: 'Selected', value: selected.size > 0 ? `${selected.size} · ${pln(selectedTotal)}` : '—', color: '#FF9500' },
          { label: 'Paid this week', value: pln(history.filter(p => p.created_at >= WEEK_START).reduce((s, p) => s + (p.amount || 0), 0)), color: '#00C853' },
        ].map(k => (
          <div key={k.label} style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: '12px', padding: '14px 18px', flex: 1 }}>
            <div style={{ ...M.mono, fontSize: '22px', fontWeight: 700, color: k.color, lineHeight: 1, marginBottom: '4px' }}>{k.value}</div>
            <div style={{ ...M.display, fontSize: '10px', color: '#555', textTransform: 'uppercase', letterSpacing: '1.2px' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
        {[['pending', 'Pending payouts'], ['history', 'History']].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 18px', borderRadius: '8px', border: 'none',
            background: tab === t ? '#D4FF00' : '#141414',
            color: tab === t ? '#000' : '#666',
            ...M.display, fontWeight: 700, fontSize: '12px', cursor: 'pointer',
          }}>{l}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ ...M.mono, color: '#333', fontSize: '13px', padding: '40px 0' }}>loading...</div>
      ) : tab === 'pending' ? (
        <>
          {summary.length === 0 ? (
            <div style={{ ...M.display, color: '#333', fontSize: '14px', padding: '60px', textAlign: 'center', background: '#141414', borderRadius: '12px' }}>
              No pending payouts this week
            </div>
          ) : (
            <>
              {/* Action bar */}
              {selected.size > 0 && (
                <div style={{
                  background: '#141414', border: '1px solid #D4FF00',
                  borderRadius: '10px', padding: '12px 16px',
                  display: 'flex', alignItems: 'center', gap: '12px',
                  marginBottom: '16px', flexWrap: 'wrap',
                }}>
                  <span style={{ ...M.mono, fontSize: '12px', color: '#D4FF00' }}>
                    {selected.size} selected · {pln(selectedTotal)}
                  </span>
                  <input
                    placeholder="optional note..."
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    style={{
                      flex: 1, minWidth: '160px', background: '#0A0A0A', border: '1px solid #2A2A2A',
                      borderRadius: '6px', color: '#FFF', padding: '6px 12px',
                      ...M.mono, fontSize: '11px', outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleMarkPaid}
                    disabled={processing}
                    style={{
                      background: processing ? '#333' : '#D4FF00', color: '#000',
                      border: 'none', borderRadius: '8px', padding: '8px 20px',
                      ...M.display, fontWeight: 700, fontSize: '12px', cursor: processing ? 'default' : 'pointer',
                    }}
                  >{processing ? 'Processing...' : 'Mark as Sent'}</button>
                </div>
              )}

              {/* Table header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '36px 1fr 100px 100px 120px 110px',
                gap: '0 12px',
                padding: '8px 16px',
                ...M.mono, fontSize: '10px', color: '#444',
                textTransform: 'uppercase', letterSpacing: '1px',
                borderBottom: '1px solid #1A1A1A',
              }}>
                <div>
                  <input type="checkbox"
                    checked={selected.size === summary.length && summary.length > 0}
                    onChange={toggleAll}
                    style={{ cursor: 'pointer', accentColor: '#D4FF00' }}
                  />
                </div>
                <div>Courier</div>
                <div style={{ textAlign: 'right' }}>This week</div>
                <div style={{ textAlign: 'right' }}>Pending</div>
                <div>Method</div>
                <div>Account</div>
              </div>

              {summary.map(c => {
                const sel = selected.has(c.courier_id);
                return (
                  <div key={c.courier_id}
                    onClick={() => toggleSelect(c.courier_id)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '36px 1fr 100px 100px 120px 110px',
                      gap: '0 12px',
                      padding: '12px 16px',
                      background: sel ? 'rgba(212,255,0,0.04)' : 'transparent',
                      borderBottom: '1px solid #141414',
                      cursor: 'pointer',
                      alignItems: 'center',
                      transition: 'background 120ms',
                    }}>
                    <div>
                      <input type="checkbox" checked={sel} onChange={() => {}} style={{ cursor: 'pointer', accentColor: '#D4FF00' }} />
                    </div>
                    <div>
                      <div style={{ ...M.display, fontWeight: 600, fontSize: '13px', color: '#FFF', marginBottom: '2px' }}>{c.full_name || '—'}</div>
                      <div style={{ ...M.mono, fontSize: '10px', color: '#444' }}>{c.email}</div>
                    </div>
                    <div style={{ ...M.mono, fontSize: '13px', color: '#888', textAlign: 'right' }}>
                      {c.deliveries_this_week || 0}d · {pln(c.earnings_this_week)}
                    </div>
                    <div style={{ ...M.mono, fontSize: '14px', fontWeight: 700, color: '#D4FF00', textAlign: 'right' }}>
                      {pln(c.pending_earnings)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        width: '7px', height: '7px', borderRadius: '50%',
                        background: c.preferred_payment === 'revolut' ? '#6B64F5' : '#007BFF',
                        flexShrink: 0,
                      }} />
                      <span style={{ ...M.mono, fontSize: '10px', color: '#666', textTransform: 'uppercase' }}>
                        {c.preferred_payment || 'revolut'}
                      </span>
                    </div>
                    <div style={{ ...M.mono, fontSize: '10px', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.preferred_payment === 'revolut'
                        ? (c.revolut_username ? '@' + c.revolut_username : '—')
                        : (c.bank_iban || '—')}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </>
      ) : (
        /* History tab */
        <>
          {history.length === 0 ? (
            <div style={{ ...M.display, color: '#333', fontSize: '14px', padding: '60px', textAlign: 'center', background: '#141414', borderRadius: '12px' }}>
              No payout history yet
            </div>
          ) : (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 100px 100px 110px 90px 130px',
                gap: '0 12px',
                padding: '8px 16px',
                ...M.mono, fontSize: '10px', color: '#444',
                textTransform: 'uppercase', letterSpacing: '1px',
                borderBottom: '1px solid #1A1A1A',
              }}>
                <div>Courier</div>
                <div style={{ textAlign: 'right' }}>Amount</div>
                <div>Method</div>
                <div>Period</div>
                <div>Status</div>
                <div>Paid at</div>
              </div>
              {history.map(p => (
                <div key={p.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 100px 100px 110px 90px 130px',
                  gap: '0 12px',
                  padding: '11px 16px',
                  borderBottom: '1px solid #141414',
                  alignItems: 'center',
                }}>
                  <div>
                    <div style={{ ...M.display, fontWeight: 600, fontSize: '13px', color: '#FFF', marginBottom: '2px' }}>
                      {p.courier?.full_name || '—'}
                    </div>
                    <div style={{ ...M.mono, fontSize: '10px', color: '#444' }}>{p.courier?.email}</div>
                  </div>
                  <div style={{ ...M.mono, fontSize: '13px', fontWeight: 700, color: '#D4FF00', textAlign: 'right' }}>
                    {pln(p.amount)}
                  </div>
                  <div style={{ ...M.mono, fontSize: '10px', color: '#555', textTransform: 'uppercase' }}>
                    {p.payment_method}
                  </div>
                  <div style={{ ...M.mono, fontSize: '10px', color: '#444' }}>
                    {new Date(p.period_from).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })}–
                    {new Date(p.period_to).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })}
                  </div>
                  <div>
                    <span style={{
                      ...M.mono, fontSize: '10px', fontWeight: 700,
                      color: statusColor(p.status),
                      textTransform: 'uppercase', letterSpacing: '1px',
                    }}>{p.status}</span>
                  </div>
                  <div style={{ ...M.mono, fontSize: '10px', color: '#444' }}>
                    {p.paid_at ? new Date(p.paid_at).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </div>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}
