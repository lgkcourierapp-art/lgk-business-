'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const VAT_RATE = 0.23;
const CIT_RATE = 0.09;
const STRIPE_PCT = 0.014;
const STRIPE_FIXED = 1.0;
const OPS_PER_DELIVERY = 0.90;

function calcBuckets(grossRevenue, courierPayout) {
  const vatAmount = grossRevenue - (grossRevenue / (1 + VAT_RATE));
  const netRevenue = grossRevenue - vatAmount;
  const stripeFee = (grossRevenue * STRIPE_PCT) + STRIPE_FIXED;
  const ops = OPS_PER_DELIVERY;
  const grossProfit = netRevenue - courierPayout - stripeFee - ops;
  const citReserve = Math.max(0, grossProfit) * CIT_RATE;
  const lgkProfit = grossProfit - citReserve;
  return {
    vat: Math.max(0, vatAmount),
    courier: Math.max(0, courierPayout),
    stripe: Math.max(0, stripeFee),
    ops,
    cit: Math.max(0, citReserve),
    profit: lgkProfit,
    total: grossRevenue,
  };
}

function aggregateBuckets(deliveries) {
  return deliveries.reduce((acc, d) => {
    const gross = d.amount_pln || 0;
    const payout = d.courier_payout_pln || 0;
    if (gross === 0) return acc;
    const b = calcBuckets(gross, payout);
    return {
      vat: acc.vat + b.vat,
      courier: acc.courier + b.courier,
      stripe: acc.stripe + b.stripe,
      ops: acc.ops + b.ops,
      cit: acc.cit + b.cit,
      profit: acc.profit + b.profit,
      total: acc.total + b.total,
    };
  }, { vat: 0, courier: 0, stripe: 0, ops: 0, cit: 0, profit: 0, total: 0 });
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
  if (diff < 60) return `${Math.round(diff)} sek. temu`;
  if (diff < 3600) return `${Math.round(diff / 60)} min temu`;
  if (diff < 86400) return `${Math.round(diff / 3600)} godz. temu`;
  return `${Math.round(diff / 86400)} dni temu`;
}

const BUCKETS = [
  {
    key: 'vat',
    label: 'VAT',
    icon: '🏦',
    bg: 'rgba(255,59,48,0.08)',
    border: 'rgba(255,59,48,0.2)',
    color: '#FF3B30',
    bank: '→ Konto VAT · mBank',
    rule: 'Płatne kwartalnie do US · NIE RUSZAJ',
  },
  {
    key: 'courier',
    label: 'Wypłaty kurierów',
    icon: '🚴',
    bg: 'rgba(0,123,255,0.08)',
    border: 'rgba(0,123,255,0.2)',
    color: '#007BFF',
    bank: '→ Konto wypłat · Revolut Business',
    rule: 'Wypłacane co poniedziałek kurierom',
  },
  {
    key: 'stripe',
    label: 'Opłaty Stripe',
    icon: '💳',
    bg: 'rgba(255,149,0,0.08)',
    border: 'rgba(255,149,0,0.2)',
    color: '#FF9500',
    bank: 'Auto-pobierane przez Stripe',
    rule: '1.4% + PLN 1.00 za transakcję',
  },
  {
    key: 'ops',
    label: 'Operacje',
    icon: '⚙️',
    bg: 'rgba(255,255,255,0.03)',
    border: 'rgba(255,255,255,0.08)',
    color: '#888888',
    bank: '→ Konto operacyjne · mBank',
    rule: 'Supabase, Vercel, narzędzia, wynagrodzenie',
  },
  {
    key: 'cit',
    label: 'Rezerwa CIT',
    icon: '🧾',
    bg: 'rgba(255,149,0,0.05)',
    border: 'rgba(255,149,0,0.12)',
    color: '#CC7700',
    bank: '→ Oszczędności CIT · mBank',
    rule: '9% zysku · płatne rocznie · NIE RUSZAJ',
  },
  {
    key: 'profit',
    label: 'Zysk LGK',
    icon: '📈',
    bg: 'rgba(212,255,0,0.08)',
    border: 'rgba(212,255,0,0.25)',
    color: '#D4FF00',
    bank: '→ Konto zysku · Revolut Business',
    rule: 'Reinwestuj co kwartał · Sprawdź przed wydaniem',
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
  if (source === 'manual') return 'Ręcznie';
  return 'Portal';
}

export default function FinancePage() {
  const [summary, setSummary] = useState(null);
  const [completedDeliveries, setCompletedDeliveries] = useState([]);
  const [tierCounts, setTierCounts] = useState([]);
  const [recentDeliveries, setRecentDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [fee, setFee] = useState(35);
  const [comm, setComm] = useState(6);
  const [cpay, setCpay] = useState(20);

  const fetchData = useCallback(async () => {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const [summaryRes, completedRes, tiersRes, recentRes] = await Promise.all([
      supabase.from('deliveries').select('status, amount_pln').gte('created_at', monthStart),
      supabase.from('deliveries').select('id, amount_pln, courier_payout_pln, status, created_at, source').in('status', ['delivered', 'confirmed']).gte('created_at', monthStart).order('created_at', { ascending: false }),
      supabase.from('profiles').select('client_tier').in('client_tier', ['business', 'fleet']).eq('is_client', true),
      supabase.from('deliveries').select('order_number, amount_pln, courier_payout_pln, status, created_at, source, pickup_city').order('created_at', { ascending: false }).limit(20),
    ]);

    const all = summaryRes.data || [];
    setSummary({
      total_deliveries: all.length,
      completed: all.filter(d => ['delivered', 'confirmed'].includes(d.status)).length,
      pending: all.filter(d => d.status === 'pending').length,
    });

    setCompletedDeliveries(completedRes.data || []);

    const tiers = tiersRes.data || [];
    setTierCounts([
      { client_tier: 'business', client_count: tiers.filter(t => t.client_tier === 'business').length },
      { client_tier: 'fleet', client_count: tiers.filter(t => t.client_tier === 'fleet').length },
    ]);

    setRecentDeliveries(recentRes.data || []);
    setLastUpdated(new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }));
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

  const aggregated = aggregateBuckets(completedDeliveries);
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
        <span style={{ fontFamily: "'Fira Code', monospace", fontSize: '13px', color: '#333' }}>ładowanie finansów...</span>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1200px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '24px', margin: 0, color: '#FFF' }}>Finanse — Money Buckets</h1>
          <p style={{ fontFamily: "'Fira Code', monospace", fontSize: '12px', color: '#888', margin: '4px 0 0' }}>Gdzie idzie każda złotówka · Ten miesiąc</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontFamily: "'Fira Code', monospace", fontSize: '11px', color: '#555' }}>Zaktualizowano {lastUpdated}</span>
          <button
            onClick={fetchData}
            style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '8px', padding: '8px 14px', color: '#FFF', fontFamily: "'Space Grotesk', sans-serif", fontSize: '13px', cursor: 'pointer' }}
          >
            Odśwież
          </button>
        </div>
      </div>

      {/* SECTION 1 — Top Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '18px' }}>
          <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '10px', color: '#888', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Dostawy ten miesiąc</div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '32px', color: '#FFF' }}>{summary?.total_deliveries || 0}</div>
          <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '11px', color: '#555', marginTop: '4px' }}>{summary?.completed || 0} ukończonych · {summary?.pending || 0} oczekujących</div>
        </div>

        <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '18px' }}>
          <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '10px', color: '#888', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Przychód brutto</div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '28px', color: '#FFF' }}>{formatPLN(aggregated.total)}</div>
          <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '11px', color: '#555', marginTop: '4px' }}>Łącznie od klientów</div>
        </div>

        <div style={{ background: '#1A1A1A', border: `1px solid ${totalProfit > 0 ? '#00C853' : '#FF3B30'}`, borderRadius: '12px', padding: '18px' }}>
          <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '10px', color: '#888', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Zysk netto LGK</div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '28px', color: totalProfit > 0 ? '#00C853' : '#FF3B30' }}>{formatPLN(totalProfit)}</div>
          <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '11px', color: '#555', marginTop: '4px' }}>Po wszystkich kosztach i CIT</div>
        </div>

        <div style={{ background: 'rgba(212,255,0,0.04)', border: '1px solid rgba(212,255,0,0.15)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '10px', color: '#888', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Abonament</div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '28px', color: '#D4FF00' }}>{formatPLN(subscriptionRevenue)}</div>
          <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '11px', color: '#555', marginTop: '4px' }}>{businessCount} Business · {fleetCount} Fleet</div>
        </div>
      </div>

      {/* SECTION 2 — Flow Bar */}
      <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '14px', color: '#FFF', marginBottom: '14px' }}>Podział przychodu</div>
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
          <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '12px', color: '#444' }}>Brak danych za ten miesiąc</div>
        )}
      </div>

      {/* SECTION 3 — Six Bucket Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {BUCKETS.map(b => {
          const amount = aggregated[b.key];
          const pct = aggregated.total > 0 ? (Math.max(0, amount) / aggregated.total) * 100 : 0;
          return (
            <div key={b.key} style={{ background: b.bg, border: `0.5px solid ${b.border}`, borderRadius: '12px', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px' }}>{b.icon}</span>
                <span style={{ fontFamily: "'Fira Code', monospace", fontSize: '11px', color: '#888' }}>{b.label}</span>
              </div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: b.prominent ? '28px' : '24px', fontWeight: 600, color: b.color }}>
                {formatPLN(amount)}
              </div>
              <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '11px', color: '#888', marginTop: '2px' }}>
                {pct.toFixed(1)}% of gross
              </div>
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '0.5px solid #2A2A2A' }}>
                <div style={{ fontSize: '9px', color: '#555', fontFamily: "'Fira Code', monospace", textTransform: 'uppercase', letterSpacing: '0.5px' }}>KONTO BANKOWE</div>
                <div style={{ fontSize: '11px', color: '#aaa', fontFamily: "'Fira Code', monospace", marginTop: '2px' }}>{b.bank}</div>
              </div>
              <div style={{ fontSize: '10px', color: '#666', fontFamily: "'Fira Code', monospace", marginTop: '4px' }}>{b.rule}</div>
            </div>
          );
        })}
      </div>

      {/* SECTION 4 — Single Delivery Calculator */}
      <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '16px', color: '#FFF', marginBottom: '4px' }}>Kalkulator pojedynczej dostawy</div>
        <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '11px', color: '#888', marginBottom: '18px' }}>Przesuń suwaki aby zobaczyć podział</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
          {[
            { label: 'Opłata dostawy', value: fee, set: setFee, min: 28, max: 63, step: 1 },
            { label: 'Prowizja', value: comm, set: setComm, min: 0, max: 12, step: 0.5 },
            { label: 'Wypłata kuriera', value: cpay, set: setCpay, min: 14, max: 26, step: 1 },
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
              { label: 'Klient płaci (brutto)', amount: fee + comm },
              { label: '↳ VAT (do US)', amount: singleBuckets.vat },
              { label: '↳ Kurier', amount: singleBuckets.courier },
              { label: '↳ Stripe', amount: singleBuckets.stripe },
              { label: '↳ Ops', amount: singleBuckets.ops },
              { label: '↳ CIT rezerwa', amount: singleBuckets.cit },
              { label: '🟡 LGK zostaje', amount: singleBuckets.profit, highlight: true },
            ].map(({ label, amount, highlight }) => (
              <tr key={label} style={{ background: highlight ? 'rgba(212,255,0,0.05)' : 'transparent' }}>
                <td style={{ fontFamily: "'Fira Code', monospace", fontSize: '12px', color: highlight ? '#D4FF00' : '#aaa', padding: '8px 0', borderBottom: '0.5px solid #1A1A1A' }}>{label}</td>
                <td style={{ fontFamily: "'Fira Code', monospace", fontSize: '12px', color: highlight ? (singleBuckets.profit < 0 ? '#FF3B30' : '#D4FF00') : '#FFF', textAlign: 'right', padding: '8px 0', borderBottom: '0.5px solid #1A1A1A' }}>{formatPLN(amount)}</td>
                <td style={{ fontFamily: "'Fira Code', monospace", fontSize: '12px', color: '#555', textAlign: 'right', padding: '8px 0', borderBottom: '0.5px solid #1A1A1A' }}>
                  {(fee + comm > 0 ? (Math.abs(amount) / (fee + comm)) * 100 : 0).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {singleBuckets.profit < 0 && (
          <div style={{ marginTop: '12px', padding: '8px 12px', background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.3)', borderRadius: '8px', fontFamily: "'Fira Code', monospace", fontSize: '12px', color: '#FF3B30' }}>
            ⚠ Ta dostawa jest nierentowna
          </div>
        )}
      </div>

      {/* SECTION 5 — Volume Projections */}
      <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '16px', color: '#FFF', marginBottom: '16px' }}>Prognoza miesięczna (średnia dostawa PLN 41)</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Wolumen', 'Profit z dostaw', 'Abonament', 'Łącznie/miesiąc'].map((h, i) => (
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
                    {vol.toLocaleString('pl-PL')}/mies{isClosest ? ' ←' : ''}
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
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '16px', color: '#FFF' }}>Ostatnie dostawy · live</div>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00C853', animation: 'pulse 2.5s infinite' }} />
        </div>
        <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '11px', color: '#888', marginBottom: '16px' }}>Aktualizuje się automatycznie</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr>
                {['Zamówienie', 'Źródło', 'Brutto', 'Kurier', 'LGK', 'Status', 'Czas'].map(h => (
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
                      title={lgkProfit < 0 ? 'Sprawdź cennik' : ''}
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
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '16px', color: '#FFF', marginBottom: '4px' }}>Struktura kont bankowych</div>
        <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '11px', color: '#888', marginBottom: '16px' }}>Otwórz te konta po rejestracji LGK Holdings Sp. z o.o.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
          {[
            { title: 'VAT (mBank — konto firmowe restricted)', zasilić: 'Przy każdej wypłacie Stripe → 18.7% kwoty', wydać: 'Kwartalnie do US (VAT-7K)', saldo: formatPLN(aggregated.vat), color: '#FF3B30' },
            { title: 'Wypłaty kurierów (Revolut Business)', zasilić: 'Przy każdej dostawie → kwota wypłaty kuriera', wydać: 'Co poniedziałek — bulk payment do kurierów', saldo: formatPLN(aggregated.courier), color: '#007BFF' },
            { title: 'Rezerwa CIT (mBank — konto oszczędnościowe)', zasilić: '9% zysku przy każdej wypłacie Stripe', wydać: 'Rocznie — CIT-8 (do 31 marca)', saldo: formatPLN(aggregated.cit), color: '#CC7700' },
            { title: 'Koszty operacyjne (mBank — konto bieżące)', zasilić: 'Stały miesięczny transfer z konta głównego', wydać: 'Na bieżące koszty + wynagrodzenie Briana', saldo: 'PLN 2,000–5,000 bufor', color: '#888888' },
            { title: 'Zysk LGK (Revolut Business)', zasilić: 'Reszta po napełnieniu pozostałych kont', wydać: 'Przegląd co kwartał — reinwestycja lub dywidenda', saldo: formatPLN(Math.max(0, aggregated.profit)), color: '#D4FF00' },
          ].map(acc => (
            <div key={acc.title} style={{ background: '#0D0D0D', border: '0.5px solid #2A2A2A', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '13px', color: acc.color, marginBottom: '10px' }}>{acc.title}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '9px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Kiedy zasilić</div>
                  <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '11px', color: '#888', marginTop: '2px' }}>{acc.zasilić}</div>
                </div>
                <div>
                  <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '9px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Kiedy wydać</div>
                  <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '11px', color: '#888', marginTop: '2px' }}>{acc.wydać}</div>
                </div>
              </div>
              <div style={{ borderTop: '0.5px solid #2A2A2A', paddingTop: '8px' }}>
                <div style={{ fontFamily: "'Fira Code', monospace", fontSize: '9px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Szacowane saldo</div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '16px', color: acc.color, marginTop: '2px' }}>{acc.saldo}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
