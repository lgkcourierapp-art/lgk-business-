'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '../../../utils/marketConfig';
import { useApp } from '../../../utils/appContext';

function AdminNav({ active }) {
  const links = [
    { label: 'Orders', href: '/admin/orders' },
    { label: 'Revenue', href: '/admin/revenue' },
    { label: 'Insurance', href: '/admin/insurance' },
    { label: 'CS Ops', href: '/admin/cs' },
    { label: 'Cities', href: '/admin/cities' },
    { label: 'Settings', href: '/admin/settings' },
  ];
  return (
    <nav style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
      {links.map(l => (
        <a key={l.href} href={l.href} style={{ color: active === l.href ? '#000' : '#999', textDecoration: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: active === l.href ? '#D4FF00' : 'transparent' }}>{l.label}</a>
      ))}
    </nav>
  );
}

export default function AdminRevenue() {
  const router = useRouter();
  const { lang } = useApp();
  const [period, setPeriod] = useState('today');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRevenue = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

    const ranges = {
      today: todayStart, week: weekStart, month: monthStart, all: '2024-01-01T00:00:00.000Z'
    };
    const since = ranges[period];

    const [{ data: orders }, { data: lastMonthOrders }, { data: insurance }, { data: allOrders }] = await Promise.all([
      supabase.from('deliveries').select('price_total, insurance_fee, insurance_selected, status, created_at, delivered_at, collected_at, delivery_city').gte('created_at', since),
      supabase.from('deliveries').select('price_total, status').gte('created_at', lastMonthStart).lte('created_at', lastMonthEnd),
      supabase.from('insurance_pool').select('amount, transaction_type, created_at').gte('created_at', since),
      supabase.from('deliveries').select('price_total, status, created_at')
    ]);

    const delivered = (orders || []).filter(o => o.status === 'delivered');
    const active = (orders || []).filter(o => ['assigned', 'collected', 'in_transit'].includes(o.status));
    const pending = (orders || []).filter(o => ['pending', 'awaiting_payment'].includes(o.status));

    const totalRevenue = delivered.reduce((s, o) => s + (o.price_total || 0), 0);
    const fleetRevenue = totalRevenue * 0.73;
    const marketplaceRevenue = totalRevenue * 0.14;
    const softwareRevenue = totalRevenue * 0.13;

    const insuranceCollected = (insurance || []).filter(i => i.transaction_type === 'collection').reduce((s, i) => s + (i.amount || 0), 0);
    const insurancePaidOut = (insurance || []).filter(i => i.transaction_type === 'payout').reduce((s, i) => s + Math.abs(i.amount || 0), 0);

    const lastMonthRevenue = (lastMonthOrders || []).filter(o => o.status === 'delivered').reduce((s, o) => s + (o.price_total || 0), 0);
    const revenueChange = lastMonthRevenue > 0 ? Math.round((totalRevenue - lastMonthRevenue) / lastMonthRevenue * 100) : 0;

    const deliveryTimes = delivered.filter(o => o.collected_at && o.delivered_at).map(o => (new Date(o.delivered_at) - new Date(o.collected_at)) / 60000);
    const avgDeliveryTime = deliveryTimes.length ? Math.round(deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length) : 0;

    const last7days = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).toISOString();
      const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1).toISOString();
      const dayOrders = (allOrders || []).filter(o => o.created_at >= dayStart && o.created_at < dayEnd && o.status === 'delivered');
      last7days.push({
        label: day.toLocaleDateString('pl-PL', { weekday: 'short' }),
        revenue: dayOrders.reduce((s, o) => s + (o.price_total || 0), 0),
        orders: dayOrders.length
      });
    }

    const maxDayRevenue = Math.max(...last7days.map(d => d.revenue), 1);
    const allTimeDelivered = (allOrders || []).filter(o => o.status === 'delivered');
    const allTimeRevenue = allTimeDelivered.reduce((s, o) => s + (o.price_total || 0), 0);
    const allTimeOrders = allTimeDelivered.length;

    setData({
      totalRevenue, fleetRevenue, marketplaceRevenue, softwareRevenue,
      totalOrders: (orders || []).length, deliveredOrders: delivered.length,
      activeOrders: active.length, pendingOrders: pending.length,
      avgOrderValue: delivered.length ? Math.round(totalRevenue / delivered.length) : 0,
      avgDeliveryTime, insuranceCollected, insurancePaidOut, revenueChange,
      last7days, maxDayRevenue, allTimeRevenue, allTimeOrders,
    });
    setLoading(false);
  }, [period]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/admin/login'); return; }
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user['id'])
        .single();
      if (!profile?.is_admin) { router.push('/dashboard'); return; }
      fetchRevenue();
    });
  }, [fetchRevenue]);

  const card = (label, value, sub, color) => (
    <div style={{ background: '#1A1A1A', border: '1px solid #333', borderRadius: '12px', padding: '20px', flex: 1, minWidth: '120px' }}>
      <div style={{ color: color || '#D4FF00', fontWeight: 900, fontSize: '22px', marginBottom: '2px' }}>{value}</div>
      <div style={{ color: '#FFF', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>{label}</div>
      {sub && <div style={{ color: '#666', fontSize: '11px' }}>{sub}</div>}
    </div>
  );

  return (
    <div key={lang} style={{ minHeight: '100vh', background: '#0A0A0A', color: '#FFF' }}>
      <header style={{ background: '#1A1A1A', borderBottom: '1px solid #333', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ color: '#D4FF00', fontWeight: 900, fontSize: '20px', letterSpacing: '3px' }}>LGK</span>
            <span style={{ color: '#666', fontWeight: 300, fontSize: '12px', letterSpacing: '6px', textTransform: 'uppercase' }}>ADMIN</span>
          </div>
          <button onClick={fetchRevenue} style={{ background: 'transparent', border: '1px solid #333', color: '#999', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>↻ Refresh</button>
        </div>
        <AdminNav active="/admin/revenue" />
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 900, margin: 0 }}>Revenue Dashboard</h1>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[['today', 'Today'], ['week', '7 Days'], ['month', 'This Month'], ['all', 'All Time']].map(([val, label]) => (
              <button key={val} onClick={() => setPeriod(val)} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #333', background: period === val ? '#D4FF00' : 'transparent', color: period === val ? '#000' : '#999', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}>{label}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#666', padding: '60px' }}>Loading revenue data...</div>
        ) : data && (
          <>
            <div style={{ marginBottom: '12px', color: '#999', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Revenue by stream</div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
              {card('Total Revenue', formatCurrency(Math.round(data.totalRevenue)), data.revenueChange !== 0 ? (data.revenueChange > 0 ? '+' + data.revenueChange + '% vs last month' : data.revenueChange + '% vs last month') : 'No prior month data', '#D4FF00')}
              {card('Fleet', formatCurrency(Math.round(data.fleetRevenue)), '~73% of revenue', '#00C853')}
              {card('Marketplace', formatCurrency(Math.round(data.marketplaceRevenue)), '~14% of revenue', '#007BFF')}
              {card('Software', formatCurrency(Math.round(data.softwareRevenue)), '~13% of revenue', '#FF9500')}
            </div>

            <div style={{ marginBottom: '12px', color: '#999', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Order metrics</div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
              {card('Total Orders', data.totalOrders, 'In period', '#FFF')}
              {card('Delivered', data.deliveredOrders, 'Completed successfully', '#00C853')}
              {card('Active Now', data.activeOrders, 'In progress', '#007BFF')}
              {card('Avg Order', formatCurrency(data.avgOrderValue), 'Per delivered order', '#D4FF00')}
              {card('Avg Delivery', data.avgDeliveryTime + ' min', 'Collection to delivery', '#FF9500')}
            </div>

            <div style={{ background: '#1A1A1A', border: '1px solid #333', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
              <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '20px', color: '#999', textTransform: 'uppercase', letterSpacing: '1px' }}>Last 7 days</div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '100px' }}>
                {data.last7days.map((day, i) => {
                  const barH = data.maxDayRevenue > 0 ? Math.max((day.revenue / data.maxDayRevenue) * 90, day.revenue > 0 ? 8 : 0) : 0;
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <div style={{ color: '#999', fontSize: '9px', fontWeight: 700 }}>{day.revenue > 0 ? formatCurrency(day.revenue) : ''}</div>
                      <div style={{ width: '100%', height: barH + 'px', background: day.revenue > 0 ? '#D4FF00' : '#333', borderRadius: '3px 3px 0 0', minHeight: '4px', transition: 'height 0.3s ease' }} />
                      <div style={{ color: '#666', fontSize: '9px' }}>{day.label}</div>
                      <div style={{ color: '#999', fontSize: '9px' }}>{day.orders > 0 ? day.orders + ' orders' : ''}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <div style={{ background: '#1A1A1A', border: '1px solid #333', borderRadius: '12px', padding: '20px', flex: 1 }}>
                <div style={{ color: '#999', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Insurance pool (period)</div>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <div><div style={{ color: '#00C853', fontWeight: 900, fontSize: '20px' }}>{formatCurrency(Math.round(data.insuranceCollected))}</div><div style={{ color: '#666', fontSize: '11px' }}>Collected</div></div>
                  <div><div style={{ color: '#FF3B30', fontWeight: 900, fontSize: '20px' }}>{formatCurrency(Math.round(data.insurancePaidOut))}</div><div style={{ color: '#666', fontSize: '11px' }}>Paid out</div></div>
                  <div><div style={{ color: '#D4FF00', fontWeight: 900, fontSize: '20px' }}>{formatCurrency(Math.round(data.insuranceCollected - data.insurancePaidOut))}</div><div style={{ color: '#666', fontSize: '11px' }}>Net</div></div>
                </div>
              </div>
            </div>

            <div style={{ background: '#1A1A1A', border: '1px solid #D4FF00', borderRadius: '12px', padding: '24px' }}>
              <div style={{ color: '#D4FF00', fontWeight: 700, fontSize: '14px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>All time totals</div>
              <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                {[
                  ['Total revenue', formatCurrency(Math.round(data.allTimeRevenue))],
                  ['Total orders delivered', data.allTimeOrders],
                  ['Avg revenue per order', formatCurrency(data.allTimeOrders > 0 ? Math.round(data.allTimeRevenue / data.allTimeOrders) : 0)],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div style={{ color: '#FFF', fontWeight: 900, fontSize: '20px' }}>{val}</div>
                    <div style={{ color: '#666', fontSize: '11px', marginTop: '2px' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
