'use client';
export const dynamic = 'force-dynamic';

// ─── Admin Earnings Ledger — Phase A oversight dashboard ──────────
// Reads from earnings_ledger + commission_ledger + shifts.
// Auth: requires profiles.is_admin = true (RLS policy on each table).
// Source of truth: the trigger that fires on delivery_events.delivered
// writes one row per delivered LGK platform job (business_id NOT NULL).
//
// This page does NOT replace /admin/finance or /admin/revenue —
// those read from deliveries + order_financials and stay as-is. This
// page surfaces the ledger directly so super-admin can confirm every
// accrual end-to-end.

import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const fmtPLN = (n) =>
  'PLN ' + Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '—';
const fmtDay = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—';

const PERIODS = {
  today:  () => new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
  week:   () => new Date(Date.now() - 7  * 86400 * 1000).toISOString(),
  month:  () => new Date(Date.now() - 30 * 86400 * 1000).toISOString(),
  all:    () => '2024-01-01T00:00:00.000Z',
};

export default function AdminEarnings() {
  const [period, setPeriod]     = useState('week');
  const [loading, setLoading]   = useState(true);
  const [earnings, setEarnings] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [shifts, setShifts]     = useState([]);
  const [error, setError]       = useState(null);

  const since = useMemo(() => PERIODS[period](), [period]);

  const advanceCleared = useCallback(async () => {
    if (loading) return;
    try {
      const { data, error: err } = await supabase.rpc('admin_advance_cleared', { p_courier_id: null });
      if (err) { setError(err.message); return; }
      setError(null);
      // Reload to reflect new cleared counts.
      load();
      alert(`Advanced ${data?.advanced ?? 0} earnings rows pending → cleared.`);
    } catch (e) {
      setError(e?.message || 'advance_failed');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data: e, error: eErr },
             { data: c, error: cErr },
             { data: s, error: sErr }] = await Promise.all([
        supabase.from('earnings_ledger')
          .select('id, courier_id, business_id, delivery_id, amount_pln, type, status, earned_at')
          .gte('earned_at', since)
          .order('earned_at', { ascending: false })
          .limit(500),
        supabase.from('commission_ledger')
          .select('id, courier_id, business_id, delivery_id, gross_pln, courier_pln, platform_pln, recorded_at')
          .gte('recorded_at', since)
          .limit(500),
        supabase.from('shifts')
          .select('id, courier_id, started_at, ended_at, gross_pln, stops_delivered, km_lgk')
          .gte('started_at', since)
          .order('started_at', { ascending: false })
          .limit(100),
      ]);
      if (eErr) throw eErr;
      if (cErr) throw cErr;
      if (sErr) throw sErr;
      setEarnings(e || []);
      setCommissions(c || []);
      setShifts(s || []);
    } catch (err) {
      setError(err.message || 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [since]);

  useEffect(() => { load(); }, [load]);

  // ─── Aggregates ──────────────────────────────────────────────────
  const totals = useMemo(() => {
    const t = {
      grossCourier:   0,
      grossPlatform:  0,
      grossBusiness:  0,
      pending:        0,
      cleared:        0,
      paid:           0,
      reversed:       0,
      deliveries:     0,
    };
    for (const row of earnings) {
      const a = Number(row.amount_pln) || 0;
      t.grossCourier += a;
      if (row.status === 'pending')  t.pending  += a;
      if (row.status === 'cleared')  t.cleared  += a;
      if (row.status === 'paid')     t.paid     += a;
      if (row.status === 'reversed') t.reversed += a;
      if (row.type === 'delivery')   t.deliveries += 1;
    }
    for (const row of commissions) {
      t.grossPlatform += Number(row.platform_pln) || 0;
      t.grossBusiness += Number(row.gross_pln)    || 0;
    }
    return t;
  }, [earnings, commissions]);

  // Per-courier breakdown
  const perCourier = useMemo(() => {
    const m = new Map();
    for (const row of earnings) {
      const k = row.courier_id;
      if (!m.has(k)) m.set(k, { courier_id: k, total: 0, count: 0 });
      const cur = m.get(k);
      cur.total += Number(row.amount_pln) || 0;
      cur.count += 1;
    }
    return [...m.values()].sort((a, b) => b.total - a.total).slice(0, 10);
  }, [earnings]);

  // Per-business breakdown
  const perBusiness = useMemo(() => {
    const m = new Map();
    for (const row of commissions) {
      const k = row.business_id;
      if (!m.has(k)) m.set(k, { business_id: k, gross: 0, platform: 0, courier: 0, count: 0 });
      const cur = m.get(k);
      cur.gross    += Number(row.gross_pln)    || 0;
      cur.platform += Number(row.platform_pln) || 0;
      cur.courier  += Number(row.courier_pln)  || 0;
      cur.count    += 1;
    }
    return [...m.values()].sort((a, b) => b.gross - a.gross).slice(0, 10);
  }, [commissions]);

  // Daily timeline
  const daily = useMemo(() => {
    const m = new Map();
    for (const row of earnings) {
      const day = row.earned_at?.slice(0, 10);
      if (!day) continue;
      if (!m.has(day)) m.set(day, { day, total: 0, count: 0 });
      const cur = m.get(day);
      cur.total += Number(row.amount_pln) || 0;
      cur.count += 1;
    }
    return [...m.values()].sort((a, b) => a.day.localeCompare(b.day));
  }, [earnings]);

  return (
    <div style={{ padding: 24, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: -0.3 }}>
          Earnings Ledger
        </h1>
        <div style={{ display: 'flex', gap: 6 }}>
          {Object.keys(PERIODS).map((k) => (
            <button
              key={k}
              onClick={() => setPeriod(k)}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                background: period === k ? 'var(--yellow)' : 'var(--card2)',
                color: period === k ? '#000' : 'var(--text2)',
                textTransform: 'capitalize',
              }}
            >
              {k}
            </button>
          ))}
          <button
            onClick={advanceCleared}
            style={{
              padding: '6px 12px', fontSize: 12, fontWeight: 700,
              borderRadius: 8, border: '1px solid var(--yellow)',
              background: 'var(--yellow-dim)', color: 'var(--yellow)', cursor: 'pointer',
            }}
            disabled={loading}
            title="Advance all pending earnings older than 48 hours to cleared status."
          >
            Advance pending → cleared
          </button>
          <button
            onClick={load}
            style={{
              padding: '6px 12px', fontSize: 12, fontWeight: 600,
              borderRadius: 8, border: '1px solid var(--border2)',
              background: 'transparent', color: 'var(--text2)', cursor: 'pointer',
            }}
            disabled={loading}
          >
            {loading ? '…' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.3)',
          color: 'var(--danger)', padding: 12, borderRadius: 10, marginBottom: 16, fontSize: 13,
        }}>
          {error}. If this is an RLS error, confirm your profile has is_admin = true.
        </div>
      )}

      {/* ─── KPIs ─────────────────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12, marginBottom: 24,
      }}>
        <Kpi label="Gross to couriers"   value={fmtPLN(totals.grossCourier)}  accent="var(--yellow)" />
        <Kpi label="Platform commission" value={fmtPLN(totals.grossPlatform)} accent="var(--success)" />
        <Kpi label="Pending"             value={fmtPLN(totals.pending)}       accent="var(--warning)" sub={`${totals.deliveries} deliveries`} />
        <Kpi label="Cleared"             value={fmtPLN(totals.cleared)}       accent="var(--info)" />
        <Kpi label="Paid out"            value={fmtPLN(totals.paid)}          accent="var(--text3)" />
        <Kpi label="Reversed"            value={fmtPLN(totals.reversed)}      accent="var(--danger)" />
      </div>

      {/* ─── Per-courier + Per-business ──────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16, marginBottom: 24 }}>
        <Card title="Top couriers">
          {perCourier.length === 0 ? <Empty/> : (
            <table style={tableStyle}>
              <thead><tr>
                <th style={thStyle}>Courier</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Deliveries</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Earned</th>
              </tr></thead>
              <tbody>
                {perCourier.map(r => (
                  <tr key={r.courier_id}>
                    <td style={tdMono}>{(r.courier_id || '').slice(0, 8)}…</td>
                    <td style={tdRight}>{r.count}</td>
                    <td style={tdRightStrong}>{fmtPLN(r.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="Top businesses">
          {perBusiness.length === 0 ? <Empty/> : (
            <table style={tableStyle}>
              <thead><tr>
                <th style={thStyle}>Business</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Orders</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Gross</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Platform</th>
              </tr></thead>
              <tbody>
                {perBusiness.map(r => (
                  <tr key={r.business_id}>
                    <td style={tdMono}>{(r.business_id || '').slice(0, 8)}…</td>
                    <td style={tdRight}>{r.count}</td>
                    <td style={tdRight}>{fmtPLN(r.gross)}</td>
                    <td style={tdRightStrong}>{fmtPLN(r.platform)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {/* ─── Daily timeline ─────────────────────────────────── */}
      <Card title="Daily accruals">
        {daily.length === 0 ? <Empty/> : (
          <table style={tableStyle}>
            <thead><tr>
              <th style={thStyle}>Day</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Deliveries</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Courier gross</th>
            </tr></thead>
            <tbody>
              {daily.map(r => (
                <tr key={r.day}>
                  <td style={tdMono}>{fmtDay(r.day)}</td>
                  <td style={tdRight}>{r.count}</td>
                  <td style={tdRightStrong}>{fmtPLN(r.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* ─── Recent transactions ─────────────────────────────── */}
      <Card title={`Recent accruals (${earnings.length})`} style={{ marginTop: 16 }}>
        {earnings.length === 0 ? <Empty/> : (
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            <table style={tableStyle}>
              <thead><tr>
                <th style={thStyle}>When</th>
                <th style={thStyle}>Delivery</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Amount</th>
              </tr></thead>
              <tbody>
                {earnings.map(r => (
                  <tr key={r.id}>
                    <td style={tdMono}>{fmtDate(r.earned_at)}</td>
                    <td style={tdMono}>{(r.delivery_id || '').slice(0, 8)}…</td>
                    <td style={tdStyle}><Pill text={r.type}/></td>
                    <td style={tdStyle}><Pill text={r.status} status/></td>
                    <td style={tdRightStrong}>{fmtPLN(r.amount_pln)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ─── Active shifts ─────────────────────────────────── */}
      <Card title={`Shifts (${shifts.length})`} style={{ marginTop: 16 }}>
        {shifts.length === 0 ? <Empty/> : (
          <table style={tableStyle}>
            <thead><tr>
              <th style={thStyle}>Started</th>
              <th style={thStyle}>Ended</th>
              <th style={thStyle}>Courier</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Stops</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>km LGK</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Gross</th>
            </tr></thead>
            <tbody>
              {shifts.map(s => (
                <tr key={s.id}>
                  <td style={tdMono}>{fmtDate(s.started_at)}</td>
                  <td style={tdMono}>{s.ended_at ? fmtDate(s.ended_at) : <span style={{ color: 'var(--success)' }}>• live</span>}</td>
                  <td style={tdMono}>{(s.courier_id || '').slice(0, 8)}…</td>
                  <td style={tdRight}>{s.stops_delivered ?? 0}</td>
                  <td style={tdRight}>{(s.km_lgk ?? 0).toFixed(1)}</td>
                  <td style={tdRightStrong}>{fmtPLN(s.gross_pln)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <p style={{ marginTop: 24, color: 'var(--text3)', fontSize: 11 }}>
        Source: earnings_ledger + commission_ledger + shifts (Phase A trigger writes on every delivery_events.delivered, business_id NOT NULL).
        Other admin pages (/admin/finance, /admin/revenue, /admin/payouts) keep reading from deliveries + order_financials — both paths are kept until you decide to unify.
      </p>
    </div>
  );
}

// ─── Small UI helpers ──────────────────────────────────────────────
function Kpi({ label, value, accent, sub }) {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border2)',
      borderRadius: 12, padding: 14,
    }}>
      <div style={{ color: 'var(--text3)', fontSize: 10.5, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ color: accent || 'var(--text)', fontSize: 22, fontWeight: 900, marginTop: 6, letterSpacing: -0.4 }}>
        {value}
      </div>
      {sub && <div style={{ color: 'var(--text3)', fontSize: 11, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Card({ title, children, style }) {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border2)',
      borderRadius: 12, padding: 14,
      ...style,
    }}>
      <div style={{ color: 'var(--text2)', fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Empty() {
  return (
    <div style={{ color: 'var(--text3)', fontSize: 12, padding: '20px 4px', textAlign: 'center' }}>
      No rows in this period yet.
    </div>
  );
}

function Pill({ text, status }) {
  const map = {
    delivery: ['#D4FF0011', '#D4FF00'],
    tip:      ['#00C85311', '#00C853'],
    bonus:    ['#007BFF11', '#007BFF'],
    adjustment: ['#FF950011', '#FF9500'],
    pending:  ['#FF950011', '#FF9500'],
    cleared:  ['#007BFF11', '#007BFF'],
    paid:     ['#00C85311', '#00C853'],
    reversed: ['#FF3B3011', '#FF3B30'],
  };
  const [bg, fg] = map[text] || ['#1A1A1A', 'var(--text2)'];
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 999,
      background: bg, color: fg, fontSize: 10.5, fontWeight: 700,
      letterSpacing: 0.4, textTransform: 'uppercase',
    }}>{text || '—'}</span>
  );
}

// Inline table style constants — keeps the JSX tidy.
const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: 12 };
const thStyle    = { textAlign: 'left', color: 'var(--text3)', fontWeight: 600, padding: '6px 6px', borderBottom: '1px solid var(--border)' };
const tdStyle    = { color: 'var(--text)', padding: '8px 6px', borderBottom: '1px solid var(--border)' };
const tdMono     = { ...tdStyle, fontFamily: 'var(--font-mono)', color: 'var(--text2)' };
const tdRight    = { ...tdStyle, textAlign: 'right' };
const tdRightStrong = { ...tdRight, fontWeight: 700, color: 'var(--text)' };
