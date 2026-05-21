'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const M = {
  mono: { fontFamily: "'Fira Code', monospace" },
  display: { fontFamily: "'Space Grotesk', sans-serif" },
};

function karmaInfo(score) {
  if (score >= 1000) return { tier: 'Platinum', color: '#00C8FF', symbol: '💎' };
  if (score >= 500)  return { tier: 'Gold',     color: '#D4FF00', symbol: '🥇' };
  if (score >= 100)  return { tier: 'Silver',   color: '#AAAAAA', symbol: '🥈' };
  return               { tier: 'Bronze',   color: '#CD7F32', symbol: '🥉' };
}

export default function AdminCouriers() {
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onlineIds, setOnlineIds] = useState(new Set());
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const [{ data: profiles }, { data: locations }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, email, karma_score, total_deliveries, created_at, phone')
        .eq('is_courier', true)
        .order('created_at', { ascending: true }),
      supabase
        .from('courier_locations')
        .select('courier_id, updated_at')
        .gte('updated_at', cutoff),
    ]);

    setOnlineIds(new Set((locations || []).map(l => l.courier_id)));
    setCouriers(profiles || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = couriers.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return c.full_name?.toLowerCase().includes(s) || c.email?.toLowerCase().includes(s);
  });

  const totalOnline = filtered.filter(c => onlineIds.has(c['id'])).length;

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1200px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ ...M.display, fontSize: '22px', fontWeight: 900, color: '#FFF', margin: '0 0 3px' }}>Couriers</h1>
          <div style={{ ...M.mono, fontSize: '11px', color: '#444' }}>
            {couriers.length} registered · <span style={{ color: '#00C853' }}>{totalOnline} online now</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            placeholder="search name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              background: '#141414', border: '1px solid #2A2A2A', borderRadius: '8px',
              color: '#FFF', padding: '8px 14px', fontSize: '12px',
              fontFamily: "'Fira Code', monospace", width: '220px', outline: 'none',
            }}
          />
          <button onClick={load} style={{
            background: 'transparent', border: '1px solid #1E1E1E', color: '#444',
            padding: '8px 14px', borderRadius: '8px', cursor: 'pointer',
            fontFamily: "'Fira Code', monospace", fontSize: '11px',
          }}>↻</button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total couriers',    value: couriers.length,                                                color: '#FFF' },
          { label: 'Online now',         value: totalOnline,                                                    color: '#00C853' },
          { label: 'Gold+',              value: couriers.filter(c => (c.karma_score || 0) >= 500).length,       color: '#D4FF00' },
          { label: 'Founding (first 20)',value: Math.min(couriers.length, 20),                                  color: '#FF9500' },
        ].map(k => (
          <div key={k.label} style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: '12px', padding: '14px 18px', flex: 1 }}>
            <div style={{ ...M.mono, fontSize: '22px', fontWeight: 700, color: k.color, lineHeight: 1, marginBottom: '4px' }}>{k.value}</div>
            <div style={{ ...M.display, fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ ...M.mono, color: '#333', fontSize: '13px', padding: '40px 0' }}>loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ ...M.display, color: '#333', fontSize: '14px', padding: '60px', textAlign: 'center' }}>No couriers found</div>
      ) : (
        <div style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 130px 90px 80px 80px 110px', gap: '12px', padding: '10px 18px', borderBottom: '1px solid #1E1E1E' }}>
            {['', 'Courier', 'Karma', 'Deliveries', 'Status', 'Joined', 'Badges'].map(h => (
              <span key={h} style={{ ...M.mono, fontSize: '10px', color: '#333', letterSpacing: '1px', textTransform: 'uppercase' }}>{h}</span>
            ))}
          </div>

          {filtered.map((c, i) => {
            const online = onlineIds.has(c['id']);
            const karma = karmaInfo(c.karma_score || 0);
            const isFounding = i < 20;

            return (
              <div key={c['id']} style={{
                display: 'grid', gridTemplateColumns: '32px 1fr 130px 90px 80px 80px 110px',
                gap: '12px', padding: '13px 18px',
                borderBottom: i < filtered.length - 1 ? '1px solid #111' : 'none',
                alignItems: 'center',
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: online ? '#00C853' : '#2A2A2A' }} />

                <div>
                  <div style={{ ...M.display, fontSize: '14px', fontWeight: 600, color: '#FFF' }}>
                    {c.full_name || c.email?.split('@')[0] || 'Courier'}
                  </div>
                  <div style={{ ...M.mono, fontSize: '10px', color: '#444', marginTop: '2px' }}>{c.email}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px' }}>{karma.symbol}</span>
                  <div>
                    <div style={{ ...M.mono, fontSize: '12px', fontWeight: 700, color: karma.color }}>{c.karma_score || 0}</div>
                    <div style={{ ...M.mono, fontSize: '10px', color: '#444' }}>{karma.tier}</div>
                  </div>
                </div>

                <span style={{ ...M.mono, fontSize: '14px', fontWeight: 700, color: '#FFF' }}>
                  {c.total_deliveries || 0}
                </span>

                <span style={{
                  ...M.mono, fontSize: '10px', fontWeight: 700,
                  color: online ? '#00C853' : '#444',
                  background: online ? 'rgba(0,200,83,0.1)' : '#1A1A1A',
                  padding: '3px 8px', borderRadius: '6px',
                }}>{online ? 'ONLINE' : 'OFFLINE'}</span>

                <span style={{ ...M.mono, fontSize: '11px', color: '#444' }}>
                  {new Date(c.created_at).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                </span>

                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {isFounding && (
                    <span style={{
                      background: 'rgba(255,149,0,0.15)', color: '#FF9500',
                      fontSize: '10px', fontWeight: 700, padding: '2px 7px',
                      borderRadius: '5px', ...M.mono,
                    }}>FOUNDING</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
