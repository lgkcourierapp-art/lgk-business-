'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { CIT_RATE } from '@/lib/constants';

// Fixed per-order fee components that come out of gross before split
const FIXED_FEES = 5.95;    // insurance 3 + processing 2 + psychological uplift 0.95
const INSURANCE_PER = 3.00;
const PROCESSING_PER = 2.00;
const PSYCH = 0.95;
const COURIER_RATE_STD = 0.72;

const ZERO_AGG = { vat: 0, courier: 0, stripe: 0, ops: 0, insurance: 0, cit: 0, profit: 0, total: 0 };

// For the single-order calculator (takes PLN payout directly)
function calcBuckets(grossRevenue, courierPayout) {
  if (!grossRevenue) return { ...ZERO_AGG };
  const dv = grossRevenue - FIXED_FEES;
  const lgkMargin = dv - courierPayout + PSYCH;
  const preCIT = lgkMargin - PROCESSING_PER;
  const cit = Math.max(0, preCIT) * CIT_RATE;
  return {
    vat: 0,
    courier: Math.max(0, courierPayout),
    stripe: 0,
    ops: PROCESSING_PER,
    insurance: INSURANCE_PER,
    cit: Math.max(0, cit),
    profit: preCIT - cit,
    total: grossRevenue,
  };
}

// Aggregate from order_financials rows (trigger-calculated, most accurate)
function aggregateFromTrigger(rows) {
  return rows.reduce((acc, r) => {
    const preCIT = (r.lgk_margin || 0) - (r.processing_fee || 0);
    return {
      vat: 0,
      courier: acc.courier + (r.courier_earnings || 0),
      stripe: 0,
      ops: acc.ops + (r.processing_fee || 0),
      insurance: acc.insurance + (r.insurance_contribution || 0),
      cit: acc.cit + Math.max(0, preCIT) * CIT_RATE,
      profit: acc.profit + Math.max(0, preCIT) * (1 - CIT_RATE),
      total: acc.total + (r.amount_total || 0),
    };
  }, { ...ZERO_AGG });
}

// Aggregate from deliveries table (fallback, uses assumed 72% rate)
function aggregateFromDeliveries(deliveries) {
  return deliveries.reduce((acc, d) => {
    const gross = d.amount_pln || 0;
    if (!gross) return acc;
    const dv = gross - FIXED_FEES;
    const courier = dv * COURIER_RATE_STD;
    const lgkMargin = dv * (1 - COURIER_RATE_STD) + PSYCH;
    const preCIT = lgkMargin - PROCESSING_PER;
    const cit = Math.max(0, preCIT) * CIT_RATE;
    return {
      vat: 0,
      courier: acc.courier + courier,
      stripe: 0,
      ops: acc.ops + PROCESSING_PER,
      insurance: acc.insurance + INSURANCE_PER,
      cit: acc.cit + Math.max(0, cit),
      profit: acc.profit + (preCIT - cit),
      total: acc.total + gross,
    };
  }, { ...ZERO_AGG });
}

function calcSubscriptionRevenue(tierCounts) {
  const business = tierCounts.find(t => t.client_tier === 'business')?.client_count || 0;
  const fleet = tierCounts.find(t => t.client_tier === 'fleet')?.client_count || 0;
  return (business * 169) + (fleet * 429);
}

function formatPLN(amount) {
  return `PLN ${Math.abs(amount).toFixed(2)}`;
}

function relativeTime(isoString) {
  const diff = (Date.now() - new Date(isoString)) / 1000;
  if (diff < 60) return `${Math.round(diff)} sec ago`;
  if (diff < 3600) return `${Math.round(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)} hours ago`;
  return `${Math.round(diff / 86400)} days ago`;
}

const BUCKETS = [
  {
    key: 'vat',
    label: 'VAT',
    icon: '🏦',
    bg: 'rgba(80,80,80,0.05)',
    border: 'rgba(80,80,80,0.12)',
    color: '#555',
    bank: '→ VAT account · mBank (when active)',
    rule: 'Active when PLN 200k annual revenue crossed — currently PLN 0',
    inactive: true,
  },
  {
    key: 'courier',
    label: 'Courier payouts',
    icon: '🚴',
    bg: 'rgba(0,123,255,0.08)',
    border: 'rgba(0,123,255,0.2)',
    color: '#007BFF',
    bank: '→ Courier payouts · Revolut Business',
    rule: 'Paid every Monday · 72% of delivery value (standard tier)',
  },
  {
    key: 'stripe',
    label: 'Stripe fees',
    icon: '💳',
    bg: 'rgba(80,80,80,0.05)',
    border: 'rgba(80,80,80,0.12)',
    color: '#555',
    bank: 'Auto-deducted by Stripe (when active)',
    rule: 'Active when Stripe goes live — currently PLN 0 (Revolut payments)',
    inactive: true,
  },
  {
    key: 'ops',
    label: 'Operations',
    icon: '⚙️',
    bg: 'rgba(255,255,255,0.03)',
    border: 'rgba(255,255,255,0.08)',
    color: '#888888',
    bank: '→ Operations account · mBank',
    rule: 'PLN 2.00 per order — Supabase, Vercel, HERE Maps, SMS, tools',
  },
  {
    key: 'cit',
    label: 'CIT reserve',
    icon: '🧾',
    bg: 'rgba(255,149,0,0.05)',
    border: 'rgba(255,149,0,0.12)',
    color: '#CC7700',
    bank: '→ CIT savings · mBank',
    rule: '9% of (LGK margin − ops) · paid annually · DO NOT TOUCH',
  },
  {
    key: 'profit',
    label: 'LGK Profit',
    icon: '📈',
    bg: 'rgba(212,255,0,0.08)',
    border: 'rgba(212,255,0,0.25)',
    color: '#D4FF00',
    bank: '→ Profit account · Revolut Business',
    rule: 'Reinvest quarterly · Check before spending',
    prominent: true,
  },
];

const FLOW_COLORS = {
  vat: '#FF3B30',
  courier: '#007BFF',
  stripe: '#FF9500',
  ops: '#666666',
  cit: '#CC7700',
  profit: '#D4FF00',
};

const AVG_GROSS = 41;
const AVG_PAYOUT = 20;
const VOLUMES = [100, 500, 1000, 3000, 10000];

function statusColor(status) {
  if (['delivered', 'confirmed'].includes(status)) return '#00C853';
  if (status === 'pending') return '#FF9500';
  if (status === 'cancelled') return '#FF3B30';
  return '#888';
}

function sourceLabel(source) {
  if (source === 'gloriaFood') return 'GloriaFood';
  if (source === 'manual') return 'Manual';
  return 'Portal';
}

export default function FinancePage() {
  const [summary, setSummary] = useState(null);
  const [aggregated, setAggregated] = useState({ ...ZERO_AGG });
  const [usingTrigger, setUsingTrigger] = useState(false);
  const [tierCounts, setTierCounts] = useState([]);
  const [recentDeliveries, setRecentDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [fee, setFee] = useState(35);
  const [comm, setComm] = useState(6);
  const [cpay, setCpay] = useState(20);

  const fetchData = useCallback(async () => {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const [summaryRes, ofRes, tiersRes, recentRes] = await Promise.all([
      supabase.from('deliveries').select('status, payment_status, amount_pln').gte('created_at', monthStart),
      supabase.from('order_financials').select('amount_total, courier_earnings, lgk_margin, insurance_contribution, processing_fee').gte('calculated_at', monthStart),
      supabase.from('profiles').select('client_tier').in('client_tier', ['business', 'fleet']).eq('is_client', true),
      supabase.from('deliveries').select('order_number, amount_pln, courier_payout_pln, status, payment_status, created_at, source, pickup_city').order('created_at', { ascending: false }).limit(20),
    ]);

    const all = summaryRes.data || [];
    setSummary({
      total_deliveries: all.length,
      completed: all.filter(d => ['delivered', 'confirmed'].includes(d.status)).length,
      paid_pipeline: all.filter(d => d.payment_status === 'paid' && !['delivered', 'confirmed'].includes(d.status)).length,
      pending: all.filter(d => d.status === 'pending').length,
    });

    // Primary: order_financials (trigger-calculated with real courier tier rates)
    // Fallback: calculate from deliveries with assumed 72% standard rate
    const ofRows = !ofRes.error ? (ofRes.data || []) : [];
    if (ofRows.length > 0) {
      setAggregated(aggregateFromTrigger(ofRows));
      setUsingTrigger(true);
    } else {
      const paidDeliveries = all.filter(d => d.payment_status === 'paid' && (d.amount_pln || 0) > 0);
      setAggregated(aggregateFromDeliveries(paidDeliveries));
      setUsingTrigger(false);
    }

    const tiers = tiersRes.data || [];
    setTierCounts([
      { client_tier: 'business', client_count: tiers.filter(t => t.client_tier === 'business').length },
      { client_tier: 'fleet', client_count: tiers.filter(t => t.client_tier === 'fleet').length },
    ]);

    setRecentDeliveries(recentRes.data || []);
    setLastUpdated(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    const channel = supabase
      .channel('admin-finance-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries' }, () => { fetchData(); })
      .subscribe();
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const subscriptionRevenue = calcSubscriptionRevenue(tierCounts);
  const singleBuckets = calcBuckets(fee + comm, cpay);
  const totalProfit = aggregated.profit + subscriptionRevenue;
  const businessCount = tierCounts.find(t => t.client_tier === 'business')?.client_count || 0;
  const fleetCount = tierCounts.find(t => t.client_tier === 'fleet')?.client_count || 0;
  const currentVolume = summary?.completed || 0;
  const perDeliveryBuckets = calcBuckets(AVG_GROSS, AVG_PAYOUT);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: "'Fira Code', monospace", fontSize: '13px', color: '#333' }}>loading finances...</span>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1200px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '24px', margin: 0, color: '#FFF' }}>Finance — Money Buckets</h1>
          <p style={{ fontFamily: "'Fira Code', monospace", fontSize: '12px', color: '#888', margin: '4px 0 0' }}>
            Where every PLN goes · {usingTrigger ? <span style={{ color: '#00C853' }}>live trigger data</span> : <span style={{ color: '#FF9500' }}>estimated — run Fix 3 SQL for exact rates</span>}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontFamily: "'Fira Code', monospace", fontSize: '11px', color: '#555' }}>Updated {lastUpdated}</span>
          <button
            onClick={fetchData}
            style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '8px', padding: '8px 14px', color: '#FFF', fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', cursor: 'pointer' }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* SECTION 1 — Top Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '18px' }}>
          <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '10px', color: '#888', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Deliveries this month</div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '32px', color: '#FFF' }}>{summary?.total_deliveries || 0}</div>
          <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '11px', color: '#555', marginTop: '4px' }}>
            {summary?.completed || 0} delivered
            {(summary?.paid_pipeline || 0) > 0 && <span style={{ color: '#007BFF' }}> · {summary.paid_pipeline} in pipeline</span>}
          </div>
        </div>

        <div style={{ background: '#1A1A1A', border: `1px solid ${aggregated.total > 0 ? 'rgba(0,200,83,0.3)' : '#2A2A2A'}`, borderRadius: '12px', padding: '18px' }}>
          <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '10px', color: '#888', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Cash collected</div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '28px', color: aggregated.total > 0 ? '#FFF' : '#333' }}>{formatPLN(aggregated.total)}</div>
          <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '11px', color: '#555', marginTop: '4px' }}>Paid orders this month</div>
        </div>

        <div style={{ background: '#1A1A1A', border: `1px solid ${totalProfit > 0 ? '#00C853' : '#FF3B30'}`, borderRadius: '12px', padding: '18px' }}>
          <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '10px', color: '#888', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>LGK net profit</div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '28px', color: totalProfit > 0 ? '#00C853' : '#FF3B30' }}>{formatPLN(totalProfit)}</div>
          <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '11px', color: '#555', marginTop: '4px' }}>After all costs and tax</div>
        </div>

        <div style={{ background: 'rgba(212,255,0,0.04)', border: '1px solid rgba(212,255,0,0.15)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '10px', color: '#888', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Subscriptions</div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '28px', color: '#D4FF00' }}>{formatPLN(subscriptionRevenue)}</div>
          <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '11px', color: '#555', marginTop: '4px' }}>{businessCount} Business · {fleetCount} Fleet</div>
        </div>
      </div>

      {/* SECTION 2 — Flow Bar */}
      <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '14px', color: '#FFF', marginBottom: '14px' }}>Revenue split</div>
        {aggregated.total > 0 ? (
          <>
            <div style={{ height: '10px', borderRadius: '5px', display: 'flex', overflow: 'hidden', marginBottom: '14px' }}>
              {Object.entries(FLOW_COLORS).map(([key, color]) => {
                const amount = key === 'profit' ? Math.max(0, aggregated[key]) : aggregated[key];
                const width = (amount / aggregated.total) * 100;
                if (width <= 0) return null;
                return <div key={key} style={{ width: `${width}%`, background: color }} />;
              })}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
              {BUCKETS.map(b => (
                <div key={b.key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: FLOW_COLORS[b.key], flexShrink: 0 }} />
                  <span style={{ fontFamily: "'Fira Code', monospace", fontSize: '11px', color: '#888' }}>{b.label}</span>
                  <span style={{ fontFamily: "'Fira Code', monospace", fontSize: '11px', color: '#fff' }}>{formatPLN(aggregated[b.key])}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '12px', color: '#444' }}>No confirmed payments this month — confirm payments in Orders to see buckets populate</div>
        )}
      </div>

      {/* SECTION 3 — Six Bucket Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
        {BUCKETS.map(b => {
          const amount = aggregated[b.key] || 0;
          const pct = aggregated.total > 0 ? (Math.max(0, amount) / aggregated.total) * 100 : 0;
          return (
            <div key={b.key} style={{ background: b.bg, border: `0.5px solid ${b.border}`, borderRadius: '12px', padding: '14px', opacity: b.inactive ? 0.5 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px' }}>{b.icon}</span>
                <span style={{ fontFamily: "'Fira Code', monospace", fontSize: '11px', color: '#888' }}>{b.label}</span>
                {b.inactive && <span style={{ fontFamily: "'Fira Code', monospace", fontSize: '9px', color: '#555', marginLeft: 'auto' }}>NOT ACTIVE</span>}
              </div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: b.prominent ? '28px' : '24px', fontWeight: 600, color: b.color }}>
                {formatPLN(amount)}
              </div>
              <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '11px', color: '#888', marginTop: '2px' }}>
                {pct.toFixed(1)}% of gross
              </div>
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '0.5px solid #2A2A2A' }}>
                <div style={{ fontSize: '9px', color: '#555', fontFamily: "'Fira Code', monospace", textTransform: 'uppercase', letterSpacing: '0.5px' }}>BANK ACCOUNT</div>
                <div style={{ fontSize: '11px', color: '#aaa', fontFamily: "'Fira Code', monospace", marginTop: '2px' }}>{b.bank}</div>
              </div>
              <div style={{ fontSize: '10px', color: '#666', fontFamily: "'Fira Code', monospace", marginTop: '4px' }}>{b.rule}</div>
            </div>
          );
        })}
      </div>

      {/* SECTION 3.5 — Insurance Reserve (separate ring-fenced pool) */}
      <div style={{ background: 'rgba(0,200,83,0.05)', border: '0.5px solid rgba(0,200,83,0.15)', borderRadius: '12px', padding: '14px 18px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <span style={{ fontSize: '18px' }}>🛡️</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '10px', color: '#555', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>Insurance reserve — ring-fenced</div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '22px', fontWeight: 700, color: '#00C853' }}>{formatPLN(aggregated.insurance || 0)}</div>
          <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '10px', color: '#555', marginTop: '3px' }}>PLN 3.00 per order · used for lost/damaged claims · DO NOT SPEND on ops</div>
        </div>
        <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '11px', color: '#333', textAlign: 'right' }}>
          <div>Not in the 6 buckets</div>
          <div style={{ marginTop: '4px' }}>Separate mBank account</div>
        </div>
      </div>

      {/* SECTION 4 — Single Delivery Calculator */}
      <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '16px', color: '#FFF', marginBottom: '4px' }}>Single delivery calculator</div>
        <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '11px', color: '#888', marginBottom: '18px' }}>Adjust sliders to see the split</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
          {[
            { label: 'Delivery fee', value: fee, set: setFee, min: 28, max: 63, step: 1 },
            { label: 'Commission', value: comm, set: setComm, min: 0, max: 12, step: 0.5 },
            { label: 'Courier payout', value: cpay, set: setCpay, min: 14, max: 26, step: 1 },
          ].map(({ label, value, set, min, max, step }) => (
            <div key={label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontFamily: "'Fira Code', monospace", fontSize: '11px', color: '#888' }}>{label}</span>
                <span style={{ fontFamily: "'Fira Code', monospace", fontSize: '11px', color: '#FFF' }}>PLN {value.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={min} max={max} step={step} value={value}
                onChange={e => set(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#D4FF00' }}
              />
            </div>
          ))}
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ fontFamily: "'Fira Code', monospace", fontSize: '10px', color: '#555', textAlign: 'left', padding: '6px 0', borderBottom: '1px solid #2A2A2A' }}></th>
              <th style={{ fontFamily: "'Fira Code', monospace", fontSize: '10px', color: '#555', textAlign: 'right', padding: '6px 0', borderBottom: '1px solid #2A2A2A' }}>PLN</th>
              <th style={{ fontFamily: "'Fira Code', monospace", fontSize: '10px', color: '#555', textAlign: 'right', padding: '6px 0', borderBottom: '1px solid #2A2A2A' }}>%</th>
            </tr>
          </thead>
          <tbody>
            {[
              { label: 'Client pays (gross)', amount: fee + comm },
              { label: '↳ Insurance reserve', amount: singleBuckets.insurance, note: 'ring-fenced' },
              { label: '↳ Courier payout', amount: singleBuckets.courier },
              { label: '↳ Operations (PLN 2)', amount: singleBuckets.ops },
              { label: '↳ CIT reserve (9%)', amount: singleBuckets.cit },
              { label: '↳ VAT (inactive)', amount: singleBuckets.vat, dim: true },
              { label: '↳ Stripe (inactive)', amount: singleBuckets.stripe, dim: true },
              { label: '🟡 LGK keeps', amount: singleBuckets.profit, highlight: true },
            ].map(({ label, amount, highlight, dim, note }) => (
              <tr key={label} style={{ background: highlight ? 'rgba(212,255,0,0.05)' : 'transparent', opacity: dim ? 0.35 : 1 }}>
                <td style={{ fontFamily: "'Fira Code', monospace", fontSize: '12px', color: highlight ? '#D4FF00' : '#aaa', padding: '7px 0', borderBottom: '0.5px solid #1A1A1A' }}>
                  {label}{note && <span style={{ color: '#333', fontSize: '10px', marginLeft: '6px' }}>{note}</span>}
                </td>
                <td style={{ fontFamily: "'Fira Code', monospace", fontSize: '12px', color: highlight ? (singleBuckets.profit < 0 ? '#FF3B30' : '#D4FF00') : '#FFF', textAlign: 'right', padding: '7px 0', borderBottom: '0.5px solid #1A1A1A' }}>{formatPLN(amount)}</td>
                <td style={{ fontFamily: "'Fira Code', monospace", fontSize: '12px', color: '#555', textAlign: 'right', padding: '7px 0', borderBottom: '0.5px solid #1A1A1A' }}>
                  {(fee + comm > 0 ? (Math.abs(amount) / (fee + comm)) * 100 : 0).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {singleBuckets.profit < 0 && (
          <div style={{ marginTop: '12px', padding: '8px 12px', background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.3)', borderRadius: '8px', fontFamily: "'Fira Code', monospace", fontSize: '12px', color: '#FF3B30' }}>
            ⚠ This delivery is unprofitable
          </div>
        )}
      </div>

      {/* SECTION 5 — Volume Projections */}
      <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '16px', color: '#FFF', marginBottom: '16px' }}>Monthly projections (avg delivery PLN 41)</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Volume', 'Delivery profit', 'Subscriptions', 'Total/month'].map((h, i) => (
                <th key={h} style={{ fontFamily: "'Fira Code', monospace", fontSize: '10px', color: '#555', textAlign: i === 0 ? 'left' : 'right', padding: '6px 0', borderBottom: '1px solid #2A2A2A' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {VOLUMES.map(vol => {
              const deliveryProfit = perDeliveryBuckets.profit * vol;
              const total = deliveryProfit + subscriptionRevenue;
              const closest = VOLUMES.reduce((prev, curr) => Math.abs(curr - currentVolume) < Math.abs(prev - currentVolume) ? curr : prev);
              const isClosest = closest === vol;
              return (
                <tr key={vol} style={{ background: isClosest ? 'rgba(212,255,0,0.04)' : 'transparent' }}>
                  <td style={{ fontFamily: "'Fira Code', monospace", fontSize: '12px', color: isClosest ? '#D4FF00' : '#aaa', padding: '8px 0', borderBottom: '0.5px solid #1A1A1A' }}>
                    {vol.toLocaleString('en-US')}/mo{isClosest ? ' ←' : ''}
                  </td>
                  <td style={{ fontFamily: "'Fira Code', monospace", fontSize: '12px', color: deliveryProfit > 0 ? '#00C853' : '#FF3B30', textAlign: 'right', padding: '8px 0', borderBottom: '0.5px solid #1A1A1A' }}>{formatPLN(deliveryProfit)}</td>
                  <td style={{ fontFamily: "'Fira Code', monospace", fontSize: '12px', color: '#D4FF00', textAlign: 'right', padding: '8px 0', borderBottom: '0.5px solid #1A1A1A' }}>{formatPLN(subscriptionRevenue)}</td>
                  <td style={{ fontFamily: "'Fira Code', monospace", fontSize: '12px', fontWeight: 600, color: total > 0 ? '#FFF' : '#FF3B30', textAlign: 'right', padding: '8px 0', borderBottom: '0.5px solid #1A1A1A' }}>{formatPLN(total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* SECTION 6 — Live Delivery Feed */}
      <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '16px', color: '#FFF' }}>Recent deliveries · live</div>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00C853', animation: 'pulse 2.5s infinite' }} />
        </div>
        <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '11px', color: '#888', marginBottom: '16px' }}>Updates automatically</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr>
                {['Order', 'Source', 'Gross', 'Courier', 'LGK', 'Status', 'Time'].map(h => (
                  <th key={h} style={{ fontFamily: "'Fira Code', monospace", fontSize: '10px', color: '#555', textAlign: 'left', padding: '6px 0', borderBottom: '1px solid #2A2A2A' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentDeliveries.map((d, i) => {
                const lgkProfit = d.amount_pln ? calcBuckets(d.amount_pln, d.courier_payout_pln || 0).profit : 0;
                return (
                  <tr key={d.order_number || i}>
                    <td style={{ fontFamily: "'Fira Code', monospace", fontSize: '12px', color: d.source === 'gloriaFood' ? '#D4FF00' : '#aaa', padding: '7px 0', borderBottom: '0.5px solid #1A1A1A' }}>{d.order_number || '—'}</td>
                    <td style={{ padding: '7px 0', borderBottom: '0.5px solid #1A1A1A' }}>
                      <span style={{ fontFamily: "'Fira Code', monospace", fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#2A2A2A', color: '#888' }}>{sourceLabel(d.source)}</span>
                    </td>
                    <td style={{ fontFamily: "'Fira Code', monospace", fontSize: '12px', color: '#FFF', padding: '7px 0', borderBottom: '0.5px solid #1A1A1A' }}>{d.amount_pln ? formatPLN(d.amount_pln) : '—'}</td>
                    <td style={{ fontFamily: "'Fira Code', monospace", fontSize: '12px', color: '#888', padding: '7px 0', borderBottom: '0.5px solid #1A1A1A' }}>{d.courier_payout_pln ? formatPLN(d.courier_payout_pln) : '—'}</td>
                    <td
                      style={{ fontFamily: "'Fira Code', monospace", fontSize: '12px', color: lgkProfit > 0 ? '#00C853' : '#FF3B30', padding: '7px 0', borderBottom: '0.5px solid #1A1A1A' }}
                      title={lgkProfit < 0 ? 'Check pricing' : ''}
                    >
                      {d.amount_pln ? formatPLN(lgkProfit) : '—'}
                    </td>
                    <td style={{ padding: '7px 0', borderBottom: '0.5px solid #1A1A1A' }}>
                      <span style={{ fontFamily: "'Fira Code', monospace", fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: `${statusColor(d.status)}22`, color: statusColor(d.status) }}>{d.status}</span>
                    </td>
                    <td style={{ fontFamily: "'Fira Code', monospace", fontSize: '11px', color: '#555', padding: '7px 0', borderBottom: '0.5px solid #1A1A1A' }}>{relativeTime(d.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 7 — Bank Account Guide */}
      <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '20px' }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '16px', color: '#FFF', marginBottom: '4px' }}>Bank account structure</div>
        <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '11px', color: '#888', marginBottom: '16px' }}>Open these accounts after registering LGK Holdings Sp. z o.o.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
          {[
            {
              title: 'VAT (mBank — restricted business account)',
              topUp: 'On each Stripe payout → 18.7% of amount',
              spend: 'Quarterly to tax office (VAT-7K)',
              balance: formatPLN(aggregated.vat),
              color: '#FF3B30',
            },
            {
              title: 'Courier payouts (Revolut Business)',
              topUp: 'Per delivery → courier payout amount',
              spend: 'Every Monday — bulk payment to couriers',
              balance: formatPLN(aggregated.courier),
              color: '#007BFF',
            },
            {
              title: 'CIT reserve (mBank — savings account)',
              topUp: '9% of profit on each Stripe payout',
              spend: 'Annually — CIT-8 (by 31 March)',
              balance: formatPLN(aggregated.cit),
              color: '#CC7700',
            },
            {
              title: 'Operations (mBank — current account)',
              topUp: 'Fixed monthly transfer from main account',
              spend: "Running costs + Brian's salary",
              balance: 'PLN 2,000–5,000 buffer',
              color: '#888888',
            },
            {
              title: 'LGK Profit (Revolut Business)',
              topUp: 'Remainder after filling other accounts',
              spend: 'Quarterly review — reinvest or dividend',
              balance: formatPLN(Math.max(0, aggregated.profit)),
              color: '#D4FF00',
            },
          ].map(acc => (
            <div key={acc.title} style={{ background: '#0D0D0D', border: '0.5px solid #2A2A2A', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '13px', color: acc.color, marginBottom: '10px' }}>{acc.title}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '9px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px' }}>When to fund</div>
                  <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '11px', color: '#888', marginTop: '2px' }}>{acc.topUp}</div>
                </div>
                <div>
                  <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '9px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px' }}>When to spend</div>
                  <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '11px', color: '#888', marginTop: '2px' }}>{acc.spend}</div>
                </div>
              </div>
              <div style={{ borderTop: '0.5px solid #2A2A2A', paddingTop: '8px' }}>
                <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '9px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estimated balance</div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '16px', color: acc.color, marginTop: '2px' }}>{acc.balance}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
