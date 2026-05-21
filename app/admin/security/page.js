'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const M = {
  mono: { fontFamily: "'Fira Code', monospace" },
  display: { fontFamily: "'Space Grotesk', sans-serif" },
};

const EVENT_COLORS = {
  auth:     '#007BFF',
  settings: '#FF9500',
  brama:    '#D4FF00',
  order:    '#00C853',
  courier:  '#8B5CF6',
  security: '#FF3B30',
};

export default function AdminSecurity() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableExists, setTableExists] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);

    // Try system_events first (auto-populated by DB triggers)
    let q = supabase
      .from('system_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (filter !== 'all') q = q.eq('event_type', filter);
    const { data: sysData, error: sysError } = await q;

    if (!sysError) {
      setTableExists(true);
      // Normalise system_events shape to match display expectations
      setEvents((sysData || []).map(e => ({
        ...e,
        // system_events uses actor_id; map to actor_email for display
        actor_email: e.actor_id ? `actor:${e.actor_id.slice(-6)}` : 'system',
        description: e.payload
          ? `${e.event_type} — ${e.entity_type} ${e.entity_id.slice(-8)}`
          : e.event_type,
      })));
    } else {
      // Fall back to admin_audit_log if system_events doesn't exist yet
      let q2 = supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (filter !== 'all') q2 = q2.eq('event_type', filter);
      const { data, error } = await q2;
      if (error?.code === '42P01') {
        setTableExists(false);
      } else {
        setTableExists(true);
        setEvents(data || []);
      }
    }

    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const exportCSV = () => {
    const header = 'timestamp,event_type,actor,description\n';
    const rows = events.map(e =>
      `"${e.created_at}","${e.event_type || ''}","${e.actor_email || ''}","${(e.description || '').replace(/"/g, '""')}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lgk-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const eventTypes = ['all', ...Object.keys(EVENT_COLORS)];

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ ...M.display, fontSize: '22px', fontWeight: 900, color: '#FFF', margin: '0 0 3px' }}>Security</h1>
          <div style={{ ...M.mono, fontSize: '11px', color: '#444' }}>Immutable audit log · admin actions only</div>
        </div>
        <button
          onClick={exportCSV}
          disabled={events.length === 0}
          style={{
            background: events.length > 0 ? 'rgba(212,255,0,0.1)' : '#141414',
            border: `1px solid ${events.length > 0 ? 'rgba(212,255,0,0.3)' : '#2A2A2A'}`,
            color: events.length > 0 ? '#D4FF00' : '#333',
            padding: '8px 18px', borderRadius: '8px',
            cursor: events.length > 0 ? 'pointer' : 'not-allowed',
            ...M.display, fontSize: '12px', fontWeight: 700,
          }}
        >↓ Export CSV</button>
      </div>

      {/* Filter by event type */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {eventTypes.map(type => {
          const color = EVENT_COLORS[type] || '#555';
          const active = filter === type;
          return (
            <button key={type} onClick={() => setFilter(type)} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: '7px',
              border: `1px solid ${active ? color : '#2A2A2A'}`,
              background: active ? `${color}15` : '#141414',
              cursor: 'pointer',
            }}>
              {type !== 'all' && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: color }} />}
              <span style={{ ...M.mono, fontSize: '11px', fontWeight: active ? 700 : 400, color: active ? color : '#555' }}>
                {type.toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ ...M.mono, color: '#333', fontSize: '13px', padding: '40px 0' }}>loading...</div>
      ) : !tableExists ? (
        <div style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: '12px', padding: '48px', textAlign: 'center' }}>
          <div style={{ ...M.mono, fontSize: '13px', color: '#333', marginBottom: '10px' }}>admin_audit_log table not found</div>
          <div style={{ ...M.display, fontSize: '12px', color: '#2A2A2A', lineHeight: 1.6 }}>
            Create the table in Supabase to start recording admin actions.<br />
            Schema: id, event_type, actor_email, actor_id, description, metadata (jsonb), created_at
          </div>
        </div>
      ) : events.length === 0 ? (
        <div style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: '12px', padding: '60px', textAlign: 'center' }}>
          <div style={{ ...M.mono, fontSize: '13px', color: '#333' }}>No audit events yet</div>
        </div>
      ) : (
        <div style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '160px 90px 160px 1fr', gap: '12px', padding: '10px 18px', borderBottom: '1px solid #1E1E1E' }}>
            {['Timestamp', 'Type', 'Actor', 'Description'].map(h => (
              <span key={h} style={{ ...M.mono, fontSize: '10px', color: '#333', letterSpacing: '1px', textTransform: 'uppercase' }}>{h}</span>
            ))}
          </div>

          {events.map((e, i) => {
            const color = EVENT_COLORS[e.event_type] || '#555';
            return (
              <div key={e['id']} style={{
                display: 'grid', gridTemplateColumns: '160px 90px 160px 1fr',
                gap: '12px', padding: '11px 18px',
                borderBottom: i < events.length - 1 ? '1px solid #111' : 'none',
                alignItems: 'center',
              }}>
                <span style={{ ...M.mono, fontSize: '11px', color: '#444' }}>
                  {new Date(e.created_at).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
                <span style={{
                  ...M.mono, fontSize: '10px', fontWeight: 700, color,
                  background: `${color}18`, padding: '2px 7px',
                  borderRadius: '4px', display: 'inline-block',
                }}>{(e.event_type || 'unknown').toUpperCase()}</span>
                <span style={{ ...M.display, fontSize: '12px', color: '#666' }}>
                  {e.actor_email || e.actor_id?.slice(-8) || 'system'}
                </span>
                <span style={{ ...M.display, fontSize: '13px', color: '#CCC', lineHeight: 1.4 }}>
                  {e.description || '—'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
