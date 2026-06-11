'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const M = {
  card: { background: '#141414', border: '1px solid #1E1E1E', borderRadius: '12px', padding: '16px 20px' },
  mono: { fontFamily: "'Fira Code', monospace" },
  display: { fontFamily: "'Space Grotesk', sans-serif" },
};

function StatCard({ value, label, color = '#D4FF00', trend, alert }) {
  return (
    <div style={{ ...M.card, flex: 1, minWidth: 120, borderLeftWidth: alert ? 3 : 1, borderLeftColor: alert || '#1E1E1E' }}>
      <div style={{ ...M.mono, fontSize: '26px', fontWeight: 700, color, lineHeight: 1, marginBottom: '5px' }}>{value}</div>
      <div style={{ ...M.display, fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '1.2px' }}>{label}</div>
      {trend && <div style={{ ...M.mono, fontSize: '10px', color: trend > 0 ? '#00C853' : '#FF3B30', marginTop: '4px' }}>
        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs yesterday
      </div>}
    </div>
  );
}

function AlertItem({ level, text, href }) {
  const colors = { critical: '#FF3B30', warning: '#FF9500', info: '#00C853' };
  const c = colors[level] || '#666';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '11px 16px',
      background: '#141414',
      borderRadius: '10px',
      borderLeft: `3px solid ${c}`,
      marginBottom: '8px',
    }}>
      <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: c, flexShrink: 0,
        animation: level === 'critical' ? 'pulse 1.5s infinite' : 'none' }} />
      <span style={{ flex: 1, ...M.display, fontSize: '13px', color: '#CCC', lineHeight: 1.4 }}>{text}</span>
      {href && (
        <a href={href} style={{
          background: c, color: '#000', padding: '4px 12px',
          borderRadius: '6px', fontSize: '11px', fontWeight: 700,
          textDecoration: 'none', ...M.display, whiteSpace: 'nowrap',
        }}>OPEN →</a>
      )}
    </div>
  );
}

export default function AdminCommand() {
  const [data, setData] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());
  const [adminName, setAdminName] = useState('');

  const load = useCallback(async () => {
    const today = new Date(); today.setHours(0,0,0,0);

    const [
      { count: pendingPayment },
      { count: pendingVerification },
      { count: activeOrders },
      { data: todayDeliveries },
      { count: p1Tickets },
      { count: openTickets },
      { count: pendingCodes },
      { count: newWaitlist },
      { data: activeCouriers },
    ] = await Promise.all([
      supabase.from('deliveries').select('id', { count: 'exact', head: true }).eq('status', 'awaiting_payment'),
      supabase.from('deliveries').select('id', { count: 'exact', head: true }).eq('payment_status', 'pending_verification'),
      supabase.from('deliveries').select('id', { count: 'exact', head: true }).in('status', ['pending','assigned','collected','in_transit']),
      supabase.from('deliveries').select('price_total, status').gte('created_at', today.toISOString()),
      supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open').eq('priority', 'P1'),
      supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('location_intel').select('id', { count: 'exact', head: true }).lt('worked_votes', 3).eq('is_active', false),
      supabase.from('waitlist').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 86400000).toISOString()),
      supabase.from('courier_locations').select('courier_id, updated_at, profiles(full_name, email)').limit(8),
    ]);

    const delivered = (todayDeliveries || []).filter(d => d.status === 'delivered');
    const revenue = delivered.reduce((s, d) => s + (d.price_total || 0), 0);

    try {
      const w = await fetch('https://api.open-meteo.com/v1/forecast?latitude=53.4285&longitude=14.5528&current=temperature_2m,precipitation,weathercode&hourly=precipitation_probability&timezone=Europe/Warsaw&forecast_days=1');
      const wd = await w.json();
      setWeather({
        temp: Math.round(wd.current?.temperature_2m || 0),
        rain: wd.current?.precipitation > 0,
        rainProb: Math.max(...(wd.hourly?.precipitation_probability || [0])),
        code: wd.current?.weathercode,
      });
    } catch {}

    setData({
      pendingPayment: pendingPayment || 0,
      pendingVerification: pendingVerification || 0,
      activeOrders: activeOrders || 0,
      todayRevenue: Math.round(revenue),
      todayDelivered: delivered.length,
      todayTotal: (todayDeliveries || []).length,
      p1Tickets: p1Tickets || 0,
      openTickets: openTickets || 0,
      pendingCodes: pendingCodes || 0,
      newWaitlist: newWaitlist || 0,
      activeCouriers: (activeCouriers || []).filter(c =>
        new Date() - new Date(c.updated_at) < 5 * 60 * 1000
      ),
      allCouriers: activeCouriers || [],
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const { data: p } = await supabase.from('profiles').select('name, email').eq('id', session.user['id']).single();
      setAdminName(p?.name || session.user.email?.split('@')[0] || '');
    });
  }, []);

  useEffect(() => {
    load();
    const r = setInterval(load, 30000);

    const channel = supabase
      .channel('admin-command-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'deliveries' },
        () => load()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'support_tickets' },
        () => load()
      )
      .subscribe();

    const t = setInterval(() => setTime(new Date()), 60000);

    return () => {
      clearInterval(r);
      clearInterval(t);
      supabase.removeChannel(channel);
    };
  }, [load]);

  const h = time.getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1200px', animation: 'fadeIn 0.3s ease' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <div style={{ ...M.mono, fontSize: '11px', color: '#444', letterSpacing: '2px', marginBottom: '6px' }}>
            {time.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}
          </div>
          <h1 style={{ ...M.display, fontSize: '26px', fontWeight: 900, color: '#FFF', letterSpacing: '-0.5px', margin: 0 }}>
            {greeting}{adminName ? `, ${adminName}.` : '.'}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ ...M.mono, fontSize: '11px', color: '#333' }}>
            {time.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <button onClick={load} style={{
            background: 'transparent', border: '1px solid #1E1E1E', color: '#444',
            padding: '6px 14px', borderRadius: '8px', cursor: 'pointer',
            fontFamily: "'Fira Code', monospace", fontSize: '11px',
          }}>↻ refresh</button>
        </div>
      </div>

      {loading ? (
        <div style={{ ...M.mono, color: '#333', fontSize: '13px' }}>loading...</div>
      ) : (
        <>
          {/* WEATHER ALERT */}
          {weather?.rain && (
            <div style={{
              background: 'rgba(255,149,0,0.07)', border: '1px solid rgba(255,149,0,0.2)',
              borderRadius: '10px', padding: '11px 16px', marginBottom: '24px',
              display: 'flex', gap: '12px', alignItems: 'center',
            }}>
              <span style={{ fontSize: '18px' }}>🌧️</span>
              <div>
                <div style={{ ...M.display, fontSize: '13px', color: '#FF9500', fontWeight: 700 }}>Rain today — check courier assignments</div>
                <div style={{ ...M.display, fontSize: '12px', color: '#555', marginTop: '2px' }}>
                  {weather.rainProb}% precipitation probability · {weather.temp}°C in Szczecin
                </div>
              </div>
            </div>
          )}

          {/* STAT ROW */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <StatCard value={`PLN ${data.todayRevenue}`} label="Today revenue" color="#D4FF00" />
            <StatCard value={data.todayDelivered} label="Delivered today" color="#00C853" />
            <StatCard value={data.pendingVerification} label="Payments to confirm" color={data.pendingVerification > 0 ? '#007BFF' : '#333'} alert={data.pendingVerification > 0 ? '#007BFF' : null} />
            <StatCard value={data.pendingPayment} label="Awaiting payment" color={data.pendingPayment > 0 ? '#FF9500' : '#333'} alert={data.pendingPayment > 0 ? '#FF9500' : null} />
            <StatCard value={data.activeCouriers.length} label="Couriers online" color="#007BFF" />
            <StatCard value={data.p1Tickets > 0 ? data.p1Tickets : data.openTickets} label={data.p1Tickets > 0 ? 'P1 tickets !' : 'Open tickets'} color={data.p1Tickets > 0 ? '#FF3B30' : '#666'} alert={data.p1Tickets > 0 ? '#FF3B30' : null} />
          </div>

          {/* ACTIONS NEEDED */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ ...M.mono, fontSize: '10px', color: '#333', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>
              Actions needed
            </div>
            {data.p1Tickets > 0 && <AlertItem level="critical" text={`${data.p1Tickets} P1 ticket${data.p1Tickets > 1 ? 's' : ''} — respond within 1 hour`} href="/admin/cs" />}
            {data.pendingVerification > 0 && <AlertItem level="warning" text={`${data.pendingVerification} payment${data.pendingVerification > 1 ? 's' : ''} sent by clients — confirm to release to couriers`} href="/admin/orders" />}
            {data.pendingPayment > 0 && <AlertItem level="info" text={`${data.pendingPayment} order${data.pendingPayment > 1 ? 's' : ''} awaiting payment from client`} href="/admin/orders" />}
            {data.pendingCodes > 0 && <AlertItem level="info" text={`${data.pendingCodes} Brama code${data.pendingCodes > 1 ? 's' : ''} awaiting moderation`} href="/admin/brama" />}
            {data.newWaitlist > 0 && <AlertItem level="info" text={`${data.newWaitlist} new waitlist signup${data.newWaitlist > 1 ? 's' : ''} in last 24 hours`} href="/admin/waitlist" />}
            {data.p1Tickets === 0 && data.pendingVerification === 0 && data.pendingPayment === 0 && data.pendingCodes === 0 && data.newWaitlist === 0 && (
              <div style={{ padding: '14px 16px', background: 'rgba(0,200,83,0.06)', borderRadius: '10px', borderLeft: '3px solid #00C853', ...M.display, fontSize: '13px', color: '#00C853' }}>
                ✓ All clear — no actions needed right now
              </div>
            )}
          </div>

          {/* LIVE COURIERS + TODAY SUMMARY */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

            {/* Couriers */}
            <div style={{ ...M.card, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '13px 18px', borderBottom: '1px solid #1A1A1A', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ ...M.mono, fontSize: '10px', color: '#444', letterSpacing: '2px', textTransform: 'uppercase' }}>Active couriers</span>
                <span style={{ ...M.mono, fontSize: '10px', color: '#00C853' }}>{data.activeCouriers.length} online</span>
              </div>
              {data.allCouriers.length === 0 ? (
                <div style={{ padding: '28px', textAlign: 'center', color: '#333', ...M.display, fontSize: '13px' }}>No couriers active</div>
              ) : data.allCouriers.slice(0, 6).map((c, i) => {
                const online = new Date() - new Date(c.updated_at) < 5 * 60 * 1000;
                return (
                  <div key={c.courier_id || i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 18px', borderBottom: '1px solid #111' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: online ? '#00C853' : '#2A2A2A', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ ...M.display, fontSize: '13px', fontWeight: 600, color: '#FFF' }}>
                        {c.profiles?.full_name || c.profiles?.email?.split('@')[0] || 'Courier'}
                      </div>
                      <div style={{ ...M.mono, fontSize: '10px', color: '#444' }}>Szczecin</div>
                    </div>
                    <div style={{ ...M.mono, fontSize: '10px', color: online ? '#00C853' : '#333' }}>
                      {online ? 'ONLINE' : 'OFFLINE'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Today summary */}
            <div style={{ ...M.card }}>
              <div style={{ ...M.mono, fontSize: '10px', color: '#444', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>
                Today so far
              </div>
              {[
                { label: 'Orders placed',    value: data.todayTotal,              color: '#FFF' },
                { label: 'Delivered',         value: data.todayDelivered,          color: '#00C853' },
                { label: 'In progress',       value: data.activeOrders,            color: '#007BFF' },
                { label: 'Revenue',           value: `PLN ${data.todayRevenue}`,   color: '#D4FF00' },
                { label: 'Open CS tickets',   value: data.openTickets,             color: data.openTickets > 0 ? '#FF9500' : '#333' },
                { label: 'Pending Brama',     value: data.pendingCodes,            color: data.pendingCodes > 0 ? '#D4FF00' : '#333' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '9px', marginBottom: '9px', borderBottom: '1px solid #1A1A1A' }}>
                  <span style={{ ...M.display, fontSize: '13px', color: '#555' }}>{row.label}</span>
                  <span style={{ ...M.mono, fontSize: '16px', fontWeight: 700, color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>

          </div>
        </>
      )}
    </div>
  );
}
