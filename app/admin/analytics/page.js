'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const M = {
  mono: { fontFamily: "'Fira Code', monospace" },
  display: { fontFamily: "'Space Grotesk', sans-serif" },
};

function LeafletMap({ points, type, height = 400 }) {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || typeof window === 'undefined') return;
    if (instanceRef.current) { instanceRef.current.remove(); instanceRef.current = null; }

    import('leaflet').then(L => {
      delete L.default.Icon.Default.prototype._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const map = L.default.map(mapRef.current, {
        center: [53.4285, 14.5528],
        zoom: 13,
        zoomControl: true,
      });

      L.default.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      if (type === 'delivery' && points?.length) {
        points.forEach(p => {
          if (!p.lat || !p.lng) return;
          L.default.circleMarker([p.lat, p.lng], {
            radius: 5, fillColor: '#D4FF00', color: '#000',
            weight: 1, opacity: 1, fillOpacity: 0.7,
          }).addTo(map).bindPopup(`<b>${p.address || 'Delivery'}</b><br/>PLN ${p.price || 0}`);
        });
      }

      if (type === 'brama' && points?.length) {
        points.forEach(p => {
          if (!p.lat || !p.lng) return;
          const color = p.worked_votes >= 3 ? '#00C853' : p.worked_votes > 0 ? '#FF9500' : '#FF3B30';
          L.default.circleMarker([p.lat, p.lng], {
            radius: 6, fillColor: color, color: '#000',
            weight: 1, opacity: 1, fillOpacity: 0.8,
          }).addTo(map).bindPopup(
            `<b style="color:${color}">${p.brama_code || 'Pending'}</b><br/>Verified by: ${p.worked_votes}/3`
          );
        });
      }

      if (type === 'failed' && points?.length) {
        const reasonColors = {
          not_home: '#FF9500', access_denied: '#FF3B30',
          wrong_address: '#8B5CF6', refused: '#007BFF',
        };
        points.forEach(p => {
          if (!p.lat || !p.lng) return;
          const color = reasonColors[p.failure_reason] || '#666';
          L.default.circleMarker([p.lat, p.lng], {
            radius: 5, fillColor: color, color: '#000',
            weight: 1, opacity: 1, fillOpacity: 0.75,
          }).addTo(map).bindPopup(`<b>Failed delivery</b><br/>${p.failure_reason || 'Unknown'}<br/>${p.address || ''}`);
        });
      }

      instanceRef.current = map;
    });

    return () => {
      if (instanceRef.current) { instanceRef.current.remove(); instanceRef.current = null; }
    };
  }, [points, type]);

  return (
    <>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
      <div ref={mapRef} style={{ height: `${height}px`, width: '100%', borderRadius: '10px', overflow: 'hidden', background: '#141414' }} />
    </>
  );
}

export default function AdminAnalytics() {
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState(null);
  const [mapPoints, setMapPoints] = useState({ delivery: [], brama: [], failed: [] });
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(7);

  const load = useCallback(async () => {
    const since = new Date(Date.now() - range * 86400000).toISOString();

    const [
      { data: deliveries },
      { data: bramaPoints },
      { data: failedDeliveries },
      { data: dailyStats },
    ] = await Promise.all([
      supabase.from('deliveries').select('delivery_lat, delivery_lng, delivery_street, delivery_city, price_total, status, created_at').gte('created_at', since).eq('status', 'delivered').limit(500),
      supabase.from('location_intel').select('lat, lng, brama_code, worked_votes').limit(500),
      supabase.from('deliveries').select('delivery_lat, delivery_lng, delivery_street, failure_reason').gte('created_at', since).eq('status', 'failed').limit(200),
      supabase.from('deliveries').select('created_at, price_total, status').gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()).order('created_at'),
    ]);

    const byDay = {};
    (dailyStats || []).forEach(d => {
      const day = d.created_at?.slice(0, 10);
      if (!byDay[day]) byDay[day] = 0;
      if (d.status === 'delivered') byDay[day] += (d.price_total || 0);
    });
    const sparkData = Object.values(byDay).slice(-14);

    const totalRevenue = (deliveries || []).reduce((s, d) => s + (d.price_total || 0), 0);
    const completionRate = deliveries && (deliveries.length + (failedDeliveries || []).length) > 0
      ? Math.round(deliveries.length / (deliveries.length + (failedDeliveries || []).length) * 100)
      : 0;

    const failureReasons = {};
    (failedDeliveries || []).forEach(d => {
      const r = d.failure_reason || 'unknown';
      failureReasons[r] = (failureReasons[r] || 0) + 1;
    });

    setData({
      totalDeliveries: (deliveries || []).length,
      totalRevenue: Math.round(totalRevenue),
      avgOrderValue: deliveries?.length ? Math.round(totalRevenue / deliveries.length) : 0,
      completionRate,
      totalFailed: (failedDeliveries || []).length,
      bramaLive: (bramaPoints || []).filter(b => b.worked_votes >= 3).length,
      bramaPending: (bramaPoints || []).filter(b => b.worked_votes < 3).length,
      coveragePercent: Math.round((bramaPoints || []).filter(b => b.worked_votes >= 3).length / 15000 * 100 * 10) / 10,
      sparkData,
      failureReasons,
    });

    setMapPoints({
      delivery: (deliveries || []).map(d => ({ lat: d.delivery_lat, lng: d.delivery_lng, address: d.delivery_street, price: d.price_total })),
      brama: (bramaPoints || []).map(b => ({ lat: b.lat, lng: b.lng, brama_code: b.brama_code, worked_votes: b.worked_votes })),
      failed: (failedDeliveries || []).map(d => ({ lat: d.delivery_lat, lng: d.delivery_lng, failure_reason: d.failure_reason, address: d.delivery_street })),
    });

    setLoading(false);
  }, [range]);

  useEffect(() => { load(); }, [load]);

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'delivery', label: 'Delivery map' },
    { key: 'brama',    label: 'Brama coverage' },
    { key: 'failed',   label: 'Failed analysis' },
  ];

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1200px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ ...M.display, fontSize: '22px', fontWeight: 900, color: '#FFF', margin: '0 0 3px' }}>Analytics</h1>
          <div style={{ ...M.mono, fontSize: '11px', color: '#444' }}>Real data · No vanity metrics · Actionable only</div>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ ...M.mono, fontSize: '11px', color: '#444' }}>Range:</span>
          {[7, 14, 30].map(d => (
            <button key={d} onClick={() => setRange(d)} style={{
              padding: '5px 12px', borderRadius: '6px',
              border: '1px solid #2A2A2A',
              background: range === d ? '#D4FF00' : 'transparent',
              color: range === d ? '#000' : '#666',
              cursor: 'pointer', ...M.mono, fontSize: '11px', fontWeight: 600,
            }}>{d}d</button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid #1E1E1E' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '9px 18px', background: 'transparent',
            border: 'none', borderBottom: tab === t.key ? '2px solid #D4FF00' : '2px solid transparent',
            color: tab === t.key ? '#D4FF00' : '#555',
            cursor: 'pointer', ...M.display, fontSize: '13px',
            fontWeight: tab === t.key ? 700 : 400, marginBottom: '-1px',
          }}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ ...M.mono, color: '#333', fontSize: '13px' }}>loading...</div>
      ) : (
        <>
          {tab === 'overview' && (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                {[
                  { label: `Deliveries (${range}d)`, value: data.totalDeliveries,         color: '#00C853' },
                  { label: `Revenue (${range}d)`,    value: `PLN ${data.totalRevenue}`,   color: '#D4FF00' },
                  { label: 'Avg order value',         value: `PLN ${data.avgOrderValue}`,  color: '#FFF' },
                  { label: 'Completion rate',         value: `${data.completionRate}%`,    color: data.completionRate >= 90 ? '#00C853' : '#FF9500' },
                ].map(k => (
                  <div key={k.label} style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: '12px', padding: '18px 20px' }}>
                    <div style={{ ...M.mono, fontSize: '24px', fontWeight: 700, color: k.color, lineHeight: 1, marginBottom: '5px' }}>{k.value}</div>
                    <div style={{ ...M.display, fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px' }}>{k.label}</div>
                  </div>
                ))}
              </div>

              {/* Revenue bar chart */}
              <div style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: '12px', padding: '20px' }}>
                <div style={{ ...M.mono, fontSize: '10px', color: '#444', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>Revenue — last 14 days</div>
                <div style={{ height: '80px', display: 'flex', alignItems: 'flex-end', gap: '3px' }}>
                  {data.sparkData.map((v, i) => {
                    const max = Math.max(...data.sparkData);
                    const pct = max > 0 ? (v / max) * 100 : 0;
                    return (
                      <div key={i} title={`PLN ${Math.round(v)}`} style={{
                        flex: 1,
                        height: `${Math.max(4, pct)}%`,
                        background: i === data.sparkData.length - 1 ? '#D4FF00' : '#2A2A2A',
                        borderRadius: '3px 3px 0 0',
                        transition: 'height 300ms ease',
                      }} />
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                {[
                  { label: 'Live Brama codes',    value: data.bramaLive,              color: '#00C853', sub: 'verified by 3+ couriers' },
                  { label: 'Pending codes',        value: data.bramaPending,           color: '#FF9500', sub: 'need more verifications' },
                  { label: 'Szczecin coverage',    value: `${data.coveragePercent}%`,  color: '#D4FF00', sub: 'of all buildings' },
                ].map(k => (
                  <div key={k.label} style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: '12px', padding: '18px 20px' }}>
                    <div style={{ ...M.mono, fontSize: '24px', fontWeight: 700, color: k.color, marginBottom: '5px' }}>{k.value}</div>
                    <div style={{ ...M.display, fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '3px' }}>{k.label}</div>
                    <div style={{ ...M.mono, fontSize: '10px', color: '#333' }}>{k.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'delivery' && (
            <div>
              <div style={{ ...M.mono, fontSize: '11px', color: '#444', marginBottom: '12px' }}>
                {mapPoints.delivery.length} delivered stops · yellow dots · {range}-day window
              </div>
              <LeafletMap points={mapPoints.delivery} type="delivery" height={520} />
              <div style={{ marginTop: '12px', ...M.display, fontSize: '12px', color: '#555' }}>
                Clusters = high-demand zones. Gaps = marketing opportunity.
              </div>
            </div>
          )}

          {tab === 'brama' && (
            <div>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', alignItems: 'center' }}>
                {[
                  { color: '#00C853', label: 'Verified (3+ couriers)' },
                  { color: '#FF9500', label: 'Pending verification' },
                  { color: '#FF3B30', label: 'Submitted (0 confirms)' },
                ].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: l.color }} />
                    <span style={{ ...M.mono, fontSize: '11px', color: '#555' }}>{l.label}</span>
                  </div>
                ))}
              </div>
              <LeafletMap points={mapPoints.brama} type="brama" height={520} />
              <div style={{ marginTop: '12px', background: 'rgba(212,255,0,0.05)', border: '1px solid rgba(212,255,0,0.1)', borderRadius: '8px', padding: '12px 16px' }}>
                <span style={{ ...M.display, fontSize: '12px', color: '#D4FF00' }}>
                  Red dots = buildings with no codes. Walk there first.
                </span>
              </div>
            </div>
          )}

          {tab === 'failed' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
                <div style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ ...M.mono, fontSize: '10px', color: '#444', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '16px' }}>Failure reasons</div>
                  {Object.entries(data.failureReasons).sort((a,b) => b[1]-a[1]).map(([reason, count]) => {
                    const total = data.totalFailed || 1;
                    const pct = Math.round(count / total * 100);
                    const colors = { not_home: '#FF9500', access_denied: '#FF3B30', wrong_address: '#8B5CF6', refused: '#007BFF' };
                    const color = colors[reason] || '#555';
                    return (
                      <div key={reason} style={{ marginBottom: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                          <span style={{ ...M.display, fontSize: '13px', color: '#CCC' }}>{reason.replace(/_/g, ' ')}</span>
                          <span style={{ ...M.mono, fontSize: '13px', fontWeight: 700, color }}>{count}</span>
                        </div>
                        <div style={{ height: '4px', background: '#1E1E1E', borderRadius: '2px' }}>
                          <div style={{ height: '4px', width: `${pct}%`, background: color, borderRadius: '2px' }} />
                        </div>
                      </div>
                    );
                  })}
                  {Object.keys(data.failureReasons).length === 0 && (
                    <div style={{ ...M.display, fontSize: '13px', color: '#333' }}>No failed deliveries in this period</div>
                  )}
                </div>
                <div>
                  <div style={{ ...M.mono, fontSize: '11px', color: '#444', marginBottom: '10px' }}>
                    {mapPoints.failed.length} failed deliveries · colour coded by reason
                  </div>
                  <LeafletMap points={mapPoints.failed} type="failed" height={360} />
                  <div style={{ marginTop: '10px', ...M.display, fontSize: '12px', color: '#555' }}>
                    Red clusters (access denied) = buildings that urgently need a Brama code.
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
