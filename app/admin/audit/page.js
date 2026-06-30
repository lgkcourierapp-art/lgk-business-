'use client';
export const dynamic = 'force-dynamic';

// ─── Admin Audit Log ──────────────────────────────────────────────
// Read-only timeline of every consequential admin action recorded in
// audit_log. Built so a future regulator / investor / yourself can
// answer: "who marked this payout sent? when was this courier flagged?
// who edited this business's webhook secret?"
//
// Filters: actor (any user_id), event_type (substring), entity_type,
// since (today / 7d / 30d / all).
//
// Auth: assumes the standard /admin layout already gates on is_admin.
// audit_log RLS lets admins read all rows; non-admins read none.

import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'medium' }) : '—';

const SINCE = {
  today: () => new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
  '7d':   () => new Date(Date.now() - 7  * 86400 * 1000).toISOString(),
  '30d':  () => new Date(Date.now() - 30 * 86400 * 1000).toISOString(),
  all:    () => '2024-01-01T00:00:00.000Z',
};

export default function AdminAudit() {
  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [since, setSince]       = useState('7d');
  const [eventFilter, setEvent] = useState('');
  const [entityFilter, setEnt]  = useState('');
  const [actorFilter, setActor] = useState('');
  const [error, setError]       = useState(null);
  const [expanded, setExpanded] = useState(new Set());

  const sinceIso = useMemo(() => SINCE[since](), [since]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let q = supabase
        .from('audit_log')
        .select('id, created_at, event_type, actor_role, user_id, entity_type, entity_id, metadata')
        .gte('created_at', sinceIso)
        .order('created_at', { ascending: false })
        .limit(500);
      if (eventFilter)  q = q.ilike('event_type', `%${eventFilter}%`);
      if (entityFilter) q = q.eq('entity_type', entityFilter);
      if (actorFilter)  q = q.eq('user_id', actorFilter);
      const { data, error: err } = await q;
      if (err) throw err;
      setRows(data || []);
    } catch (e) {
      setError(e.message || 'Load failed');
    } finally { setLoading(false); }
  }, [sinceIso, eventFilter, entityFilter, actorFilter]);

  useEffect(() => { load(); }, [load]);

  const entityTypes = useMemo(() => {
    const set = new Set(rows.map(r => r.entity_type).filter(Boolean));
    return [...set].sort();
  }, [rows]);

  const toggleExpand = (id) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div style={{ padding: 24, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: -0.3 }}>
          Audit Log
        </h1>
        <button
          onClick={load}
          style={{
            padding: '6px 12px', fontSize: 12, fontWeight: 600,
            borderRadius: 8, border: '1px solid var(--border2)',
            background: 'transparent', color: 'var(--text2)', cursor: 'pointer',
          }}
          disabled={loading}
        >{loading ? '…' : 'Refresh'}</button>
      </div>

      {error && (
        <div style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.3)', color: 'var(--danger)', padding: 12, borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
          {error}. If this is an RLS error, confirm your profile has is_admin = true.
        </div>
      )}

      {/* ─── Filters ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 16 }}>
        <div>
          <Lbl>SINCE</Lbl>
          <div style={{ display: 'flex', gap: 4 }}>
            {Object.keys(SINCE).map(k => (
              <button
                key={k}
                onClick={() => setSince(k)}
                style={{
                  padding: '6px 10px', fontSize: 11.5, fontWeight: 600, borderRadius: 8,
                  border: 'none', cursor: 'pointer',
                  background: since === k ? 'var(--yellow)' : 'var(--card2)',
                  color: since === k ? '#000' : 'var(--text2)',
                  textTransform: 'capitalize', flex: 1,
                }}
              >{k}</button>
            ))}
          </div>
        </div>
        <div>
          <Lbl>EVENT TYPE</Lbl>
          <input
            value={eventFilter}
            onChange={(e) => setEvent(e.target.value)}
            placeholder="contains…"
            style={inputStyle}
          />
        </div>
        <div>
          <Lbl>ENTITY TYPE</Lbl>
          <select
            value={entityFilter}
            onChange={(e) => setEnt(e.target.value)}
            style={inputStyle}
          >
            <option value="">All</option>
            {entityTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <Lbl>ACTOR (user_id)</Lbl>
          <input
            value={actorFilter}
            onChange={(e) => setActor(e.target.value)}
            placeholder="uuid…"
            style={inputStyle}
          />
        </div>
      </div>

      {/* ─── Table ──────────────────────────────────────────── */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border2)', borderRadius: 12, overflow: 'hidden' }}>
        {rows.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
            {loading ? 'Loading…' : 'No entries in this window.'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--card2)' }}>
                <Th>When</Th>
                <Th>Actor</Th>
                <Th>Event</Th>
                <Th>Entity</Th>
                <Th>Payload</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} style={{ borderTop: '1px solid var(--border)' }}>
                  <Td mono>{fmtDate(r.created_at)}</Td>
                  <Td mono small>
                    <span style={{ color: 'var(--text2)' }}>{r.actor_role || '—'}</span>
                    {r.user_id ? <div style={{ color: 'var(--text3)', fontSize: 10.5 }}>{r.user_id.slice(0, 8)}…</div> : null}
                  </Td>
                  <Td><Pill text={r.event_type} /></Td>
                  <Td mono small>
                    {r.entity_type || '—'}
                    {r.entity_id ? <div style={{ color: 'var(--text3)', fontSize: 10.5 }}>{r.entity_id.slice(0, 8)}…</div> : null}
                  </Td>
                  <Td>
                    {r.metadata ? (
                      <button
                        onClick={() => toggleExpand(r.id)}
                        style={{
                          background: 'transparent', border: '1px solid var(--border2)',
                          color: 'var(--text2)', borderRadius: 6, padding: '3px 7px',
                          fontSize: 10.5, cursor: 'pointer',
                        }}
                      >{expanded.has(r.id) ? 'hide' : 'view'}</button>
                    ) : (
                      <span style={{ color: 'var(--text3)' }}>—</span>
                    )}
                    {expanded.has(r.id) && r.metadata && (
                      <pre style={{
                        marginTop: 6, padding: 8, background: 'var(--bg)',
                        border: '1px solid var(--border)', borderRadius: 6,
                        fontSize: 10.5, color: 'var(--text2)', maxWidth: 360,
                        overflowX: 'auto', maxHeight: 280, overflowY: 'auto',
                        fontFamily: 'var(--font-mono)',
                      }}>{JSON.stringify(r.metadata, null, 2)}</pre>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p style={{ marginTop: 14, color: 'var(--text3)', fontSize: 11 }}>
        Read-only. Existing inserts (payouts, waitlist, settings, moderation, etc.) appear here in real time.
      </p>
    </div>
  );
}

function Lbl({ children }) {
  return <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text3)', letterSpacing: 1.2, marginBottom: 6, textTransform: 'uppercase' }}>{children}</div>;
}
function Th({ children }) {
  return <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text3)', fontWeight: 600, fontSize: 10.5, letterSpacing: 0.4, textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>{children}</th>;
}
function Td({ children, mono, small }) {
  return <td style={{
    padding: '8px 10px',
    color: 'var(--text)',
    fontFamily: mono ? 'var(--font-mono)' : 'inherit',
    fontSize: small ? 11 : 12,
    verticalAlign: 'top',
  }}>{children}</td>;
}
function Pill({ text }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 999,
      background: 'var(--card2)', color: 'var(--text)', fontSize: 10.5, fontWeight: 700,
      letterSpacing: 0.3, fontFamily: 'var(--font-mono)',
    }}>{text || '—'}</span>
  );
}

const inputStyle = {
  width: '100%', padding: '7px 10px', borderRadius: 8,
  background: 'var(--card2)', border: '1px solid var(--border2)',
  color: 'var(--text)', fontSize: 12, fontFamily: 'var(--font-mono)',
};
