'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const M = {
  mono: { fontFamily: "'Fira Code', monospace" },
  display: { fontFamily: "'Space Grotesk', sans-serif" },
};

export default function AdminClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('revenue');

  const load = useCallback(async () => {
    setLoading(true);
    const { data: deliveries } = await supabase
      .from('deliveries')
      .select('client_id, price_total, status, created_at, profiles(id, full_name, email, created_at, business_type)')
      .not('client_id', 'is', null);

    const map = {};
    (deliveries || []).forEach(d => {
      const cid = d.client_id;
      if (!map[cid]) {
        map[cid] = {
          id: cid,
          name: d.profiles?.full_name || d.profiles?.email?.split('@')[0] || 'Unknown',
          email: d.profiles?.email || '',
          memberSince: d.profiles?.created_at,
          businessType: d.profiles?.business_type || 'general',
          totalSpent: 0,
          orderCount: 0,
          deliveredCount: 0,
          lastOrder: null,
        };
      }
      map[cid].orderCount++;
      if (d.status === 'delivered') {
        map[cid].totalSpent += d.price_total || 0;
        map[cid].deliveredCount++;
      }
      if (!map[cid].lastOrder || d.created_at > map[cid].lastOrder) {
        map[cid].lastOrder = d.created_at;
      }
    });

    setClients(Object.values(map));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = clients
    .filter(c => {
      if (!search) return true;
      const s = search.toLowerCase();
      return c.name.toLowerCase().includes(s) || c.email.toLowerCase().includes(s);
    })
    .sort((a, b) => {
      if (sort === 'revenue') return b.totalSpent - a.totalSpent;
      if (sort === 'orders')  return b.orderCount - a.orderCount;
      if (sort === 'recent')  return new Date(b.lastOrder) - new Date(a.lastOrder);
      return 0;
    });

  const totalRevenue = clients.reduce((s, c) => s + c.totalSpent, 0);

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1200px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ ...M.display, fontSize: '22px', fontWeight: 900, color: '#FFF', margin: '0 0 3px' }}>Clients</h1>
          <div style={{ ...M.mono, fontSize: '11px', color: '#444' }}>
            {clients.length} clients · PLN {Math.round(totalRevenue)} total revenue
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
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            style={{
              background: '#141414', border: '1px solid #2A2A2A', borderRadius: '8px',
              color: '#888', padding: '8px 12px', fontSize: '12px',
              fontFamily: "'Fira Code', monospace", outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="revenue">Sort: Revenue</option>
            <option value="orders">Sort: Orders</option>
            <option value="recent">Sort: Recent</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ ...M.mono, color: '#333', fontSize: '13px', padding: '40px 0' }}>loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ ...M.display, color: '#333', fontSize: '14px', padding: '60px', textAlign: 'center' }}>No clients found</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
          {filtered.map(c => {
            const isVip = c.totalSpent >= 500;
            return (
              <div key={c['id']} style={{
                background: '#141414',
                border: `1px solid ${isVip ? 'rgba(212,255,0,0.2)' : '#1E1E1E'}`,
                borderRadius: '12px', padding: '18px 20px',
                position: 'relative', overflow: 'hidden',
              }}>
                {isVip && (
                  <div style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(212,255,0,0.08)', padding: '3px 10px', borderRadius: '0 12px 0 8px' }}>
                    <span style={{ ...M.mono, fontSize: '9px', color: '#D4FF00', letterSpacing: '1px' }}>VIP</span>
                  </div>
                )}

                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <div style={{ ...M.display, fontSize: '15px', fontWeight: 700, color: '#FFF' }}>{c.name}</div>
                    <span style={{
                      fontSize: '11px', padding: '2px 10px', borderRadius: '20px', fontWeight: 600,
                      background: c.businessType === 'restaurant' ? 'rgba(234,88,12,0.12)' : 'rgba(37,99,235,0.12)',
                      color: c.businessType === 'restaurant' ? '#EA580C' : '#2563EB',
                    }}>
                      {c.businessType === 'restaurant' ? '🍽 Restauracja' : '📦 Paczki'}
                    </span>
                  </div>
                  <div style={{ ...M.mono, fontSize: '11px', color: '#444' }}>{c.email}</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                  {[
                    { label: 'Total spent', value: `PLN ${Math.round(c.totalSpent)}`, color: '#D4FF00' },
                    { label: 'Orders',       value: c.orderCount,                      color: '#FFF' },
                    { label: 'Delivered',    value: c.deliveredCount,                  color: '#00C853' },
                    { label: 'Last order',   value: c.lastOrder ? new Date(c.lastOrder).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—', color: '#888' },
                  ].map(stat => (
                    <div key={stat.label}>
                      <div style={{ ...M.mono, fontSize: '14px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                      <div style={{ ...M.display, fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: '2px' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                <a
                  href={`mailto:${c.email}?subject=LGK Courier — delivery update`}
                  style={{
                    display: 'block', textAlign: 'center',
                    background: 'transparent', border: '1px solid #2A2A2A',
                    color: '#666', padding: '8px', borderRadius: '8px',
                    textDecoration: 'none', ...M.display, fontSize: '12px', fontWeight: 600,
                  }}
                >✉ Email</a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
