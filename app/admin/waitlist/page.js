'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const M = {
  mono: { fontFamily: "'Fira Code', monospace" },
  display: { fontFamily: "'Space Grotesk', sans-serif" },
};

const FOUNDING_TARGET = 20;

export default function AdminWaitlist() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [acting, setActing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('waitlist')
      .select('*')
      .order('created_at', { ascending: true });
    setEntries(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const markContacted = async (id) => {
    setActing(id + '_contact');
    await supabase.from('waitlist').update({ status: 'contacted' }).eq('id', id);
    setActing(null);
    load();
  };

  const markFounding = async (id) => {
    setActing(id + '_founding');
    await supabase.from('waitlist').update({ status: 'founding', is_founding: true }).eq('id', id);
    setActing(null);
    load();
  };

  const foundingCount = entries.filter(e => e.status === 'founding' || e.is_founding).length;
  const contactedCount = entries.filter(e => e.status === 'contacted').length;
  const newCount = entries.filter(e => !e.status || e.status === 'new').length;
  const foundingPct = Math.min(100, Math.round((foundingCount / FOUNDING_TARGET) * 100));

  const filtered = entries.filter(e => {
    if (filter === 'all') return true;
    if (filter === 'new') return !e.status || e.status === 'new';
    if (filter === 'contacted') return e.status === 'contacted';
    if (filter === 'founding') return e.status === 'founding' || e.is_founding;
    return true;
  });

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1000px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ ...M.display, fontSize: '22px', fontWeight: 900, color: '#FFF', margin: '0 0 3px' }}>Waitlist</h1>
        <div style={{ ...M.mono, fontSize: '11px', color: '#444' }}>{entries.length} total signups · Szczecin launch</div>
      </div>

      {/* Founding 20 progress */}
      <div style={{ background: '#141414', border: '1px solid rgba(212,255,0,0.2)', borderRadius: '12px', padding: '18px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <span style={{ ...M.display, fontSize: '14px', fontWeight: 700, color: '#D4FF00' }}>Founding 20</span>
            <span style={{ ...M.mono, fontSize: '11px', color: '#555', marginLeft: '10px' }}>first clients who shape the product</span>
          </div>
          <span style={{ ...M.mono, fontSize: '18px', fontWeight: 700, color: '#D4FF00' }}>{foundingCount}/{FOUNDING_TARGET}</span>
        </div>
        <div style={{ height: '6px', background: '#1E1E1E', borderRadius: '3px' }}>
          <div style={{ height: '6px', width: `${foundingPct}%`, background: '#D4FF00', borderRadius: '3px', transition: 'width 600ms ease' }} />
        </div>
        <div style={{ ...M.mono, fontSize: '10px', color: '#444', marginTop: '6px' }}>{foundingPct}% of target</div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total',    value: entries.length,  color: '#FFF' },
          { label: 'New',       value: newCount,        color: '#007BFF' },
          { label: 'Contacted', value: contactedCount,  color: '#FF9500' },
          { label: 'Founding',  value: foundingCount,   color: '#D4FF00' },
        ].map(s => (
          <div key={s.label} style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: '10px', padding: '12px 16px', flex: 1 }}>
            <div style={{ ...M.mono, fontSize: '20px', fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: '4px' }}>{s.value}</div>
            <div style={{ ...M.display, fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
        {[['all', 'All'], ['new', 'New'], ['contacted', 'Contacted'], ['founding', 'Founding']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} style={{
            padding: '7px 14px', borderRadius: '7px', border: '1px solid #2A2A2A',
            background: filter === val ? '#D4FF00' : '#141414',
            color: filter === val ? '#000' : '#666',
            cursor: 'pointer', ...M.display, fontSize: '12px', fontWeight: filter === val ? 700 : 400,
          }}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ ...M.mono, color: '#333', fontSize: '13px', padding: '40px 0' }}>loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ ...M.display, color: '#333', fontSize: '14px', padding: '60px', textAlign: 'center' }}>No entries in this filter</div>
      ) : (
        <div style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 80px 90px 190px', gap: '12px', padding: '10px 18px', borderBottom: '1px solid #1E1E1E' }}>
            {['Email / Name', 'City', 'Signed up', 'Status', 'Actions'].map(h => (
              <span key={h} style={{ ...M.mono, fontSize: '10px', color: '#333', letterSpacing: '1px', textTransform: 'uppercase' }}>{h}</span>
            ))}
          </div>

          {filtered.map((e, i) => {
            const status = e.status || 'new';
            const statusColors = { new: '#007BFF', contacted: '#FF9500', founding: '#D4FF00' };
            const isFounding = status === 'founding' || e.is_founding;

            return (
              <div key={e['id']} style={{
                display: 'grid', gridTemplateColumns: '1fr 120px 80px 90px 190px',
                gap: '12px', padding: '12px 18px',
                borderBottom: i < filtered.length - 1 ? '1px solid #111' : 'none',
                alignItems: 'center',
                background: isFounding ? 'rgba(212,255,0,0.02)' : 'transparent',
              }}>
                <div>
                  <div style={{ ...M.display, fontSize: '13px', color: '#FFF', fontWeight: isFounding ? 700 : 400 }}>
                    {e.name || e.email?.split('@')[0] || '—'}
                    {isFounding && <span style={{ ...M.mono, fontSize: '10px', color: '#D4FF00', marginLeft: '8px' }}>★ FOUNDING</span>}
                  </div>
                  <div style={{ ...M.mono, fontSize: '10px', color: '#444', marginTop: '2px' }}>{e.email}</div>
                </div>

                <span style={{ ...M.display, fontSize: '12px', color: '#666' }}>{e.city || '—'}</span>

                <span style={{ ...M.mono, fontSize: '11px', color: '#444' }}>
                  {new Date(e.created_at).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })}
                </span>

                <span style={{
                  ...M.mono, fontSize: '10px', fontWeight: 700,
                  color: statusColors[status] || '#555',
                  background: `${statusColors[status] || '#555'}18`,
                  padding: '3px 7px', borderRadius: '5px',
                }}>{status.toUpperCase()}</span>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {status === 'new' && (
                    <button
                      onClick={() => markContacted(e['id'])}
                      disabled={acting === e['id'] + '_contact'}
                      style={{
                        background: 'transparent', color: '#FF9500',
                        border: '1px solid rgba(255,149,0,0.3)',
                        padding: '4px 10px', borderRadius: '6px',
                        cursor: 'pointer', ...M.display, fontSize: '11px', fontWeight: 700,
                      }}>{acting === e['id'] + '_contact' ? '...' : 'Contacted'}</button>
                  )}
                  {!isFounding && (
                    <button
                      onClick={() => markFounding(e['id'])}
                      disabled={acting === e['id'] + '_founding' || foundingCount >= FOUNDING_TARGET}
                      style={{
                        background: foundingCount < FOUNDING_TARGET ? 'rgba(212,255,0,0.1)' : 'transparent',
                        color: foundingCount < FOUNDING_TARGET ? '#D4FF00' : '#333',
                        border: `1px solid ${foundingCount < FOUNDING_TARGET ? 'rgba(212,255,0,0.3)' : '#2A2A2A'}`,
                        padding: '4px 10px', borderRadius: '6px',
                        cursor: foundingCount < FOUNDING_TARGET ? 'pointer' : 'not-allowed',
                        ...M.display, fontSize: '11px', fontWeight: 700,
                      }}>{acting === e['id'] + '_founding' ? '...' : '★ Founding'}</button>
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
