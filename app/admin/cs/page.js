'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useApp } from '../../../utils/appContext';

const PRIORITY_CONFIG = {
  P1: { label: 'P1 Critical', color: '#FF3B30', bg: '#FF3B3020', note: 'Response: 30 min' },
  P2: { label: 'P2 High',     color: '#FF9500', bg: '#FF950020', note: 'Response: 2 hrs' },
  P3: { label: 'P3 Normal',   color: '#007BFF', bg: '#007BFF20', note: 'Response: 8 hrs' },
};

const CATEGORY_LABELS = {
  not_delivered: 'Package not delivered',
  damaged: 'Package damaged',
  missing_items: 'Items missing',
  wrong_address: 'Wrong address delivery',
  late_delivery: 'Delivery very late',
  courier_behaviour: 'Courier behaviour issue',
  other: 'Other',
};

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

export default function AdminCS() {
  const router = useRouter();
  const { lang } = useApp();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');
  const [expanded, setExpanded] = useState(null);
  const [notes, setNotes] = useState({});
  const [saving, setSaving] = useState(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('support_tickets').select('*, deliveries(pickup_city, delivery_city, price_total, client_id)').order('created_at', { ascending: false });
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    setTickets(data || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/admin/login'); return; }
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user['id'])
        .single();
      if (!profile?.is_admin) { router.push('/dashboard'); return; }
      fetchTickets();
    });
  }, [fetchTickets]);

  useEffect(() => {
    const interval = setInterval(fetchTickets, 30000);
    return () => clearInterval(interval);
  }, [fetchTickets]);

  const markResolved = async (id) => {
    setSaving(id);
    await supabase.from('support_tickets').update({ status: 'resolved', resolved_at: new Date().toISOString(), internal_notes: notes[id] || null }).eq('id', id);
    setSaving(null);
    fetchTickets();
  };

  const escalate = async (id) => {
    setSaving(id);
    await supabase.from('support_tickets').update({ priority: 'P1', internal_notes: (notes[id] ? notes[id] + '\n[Escalated]' : '[Escalated]') }).eq('id', id);
    setSaving(null);
    fetchTickets();
  };

  const saveNote = async (id) => {
    setSaving(id + '_note');
    await supabase.from('support_tickets').update({ internal_notes: notes[id] || '' }).eq('id', id);
    setSaving(null);
  };

  const p1Count = tickets.filter(t => t.priority === 'P1' && t.status === 'open').length;

  return (
    <div key={lang} style={{ minHeight: '100vh', background: '#0A0A0A', color: '#FFF' }}>
      <header style={{ background: '#1A1A1A', borderBottom: '1px solid #333', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ color: '#D4FF00', fontWeight: 900, fontSize: '20px', letterSpacing: '3px' }}>LGK</span>
            <span style={{ color: '#666', fontWeight: 300, fontSize: '12px', letterSpacing: '6px', textTransform: 'uppercase' }}>ADMIN</span>
            {p1Count > 0 && (
              <span style={{ background: '#FF3B30', color: '#FFF', borderRadius: '999px', padding: '2px 8px', fontSize: '11px', fontWeight: 900, marginLeft: 8 }}>{p1Count} P1</span>
            )}
          </div>
          <button onClick={fetchTickets} style={{ background: 'transparent', border: '1px solid #333', color: '#999', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>↻ Refresh</button>
        </div>
        <AdminNav active="/admin/cs" />
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 900, margin: 0 }}>CS Ops — Support Tickets</h1>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[['open', 'Open'], ['resolved', 'Resolved'], ['all', 'All']].map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #333', background: filter === val ? '#D4FF00' : 'transparent', color: filter === val ? '#000' : '#999', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}>{label}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#666', padding: '60px' }}>Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', padding: '60px' }}>No tickets found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tickets.map(ticket => {
              const pc = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.P3;
              const isOpen = expanded === ticket['id'];
              const shortId = ticket['id'].slice(-6).toUpperCase();
              const orderShortId = ticket.order_id?.slice(-6).toUpperCase() || '—';
              const createdAt = new Date(ticket.created_at).toLocaleString('pl-PL');

              return (
                <div key={ticket['id']} style={{ background: '#1A1A1A', border: '1px solid #333', borderRadius: '12px', overflow: 'hidden' }}>
                  {/* Row header */}
                  <div
                    onClick={() => setExpanded(isOpen ? null : ticket['id'])}
                    style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}
                  >
                    <span style={{ background: pc.bg, color: pc.color, borderRadius: '6px', padding: '3px 8px', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>{pc.label}</span>
                    <span style={{ color: '#FFF', fontWeight: 700, fontSize: '14px', flex: 1, minWidth: 120 }}>{CATEGORY_LABELS[ticket.category] || ticket.category}</span>
                    <span style={{ color: '#666', fontSize: '12px' }}>Order #{orderShortId}</span>
                    <span style={{ color: '#666', fontSize: '12px' }}>{createdAt}</span>
                    <span style={{ color: ticket.status === 'resolved' ? '#00C853' : '#FF9500', fontSize: '12px', fontWeight: 700 }}>{ticket.status === 'resolved' ? '✓ Resolved' : '● Open'}</span>
                    <span style={{ color: '#666', fontSize: '14px' }}>{isOpen ? '▲' : '▼'}</span>
                  </div>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div style={{ borderTop: '1px solid #333', padding: '20px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                        <div>
                          <div style={{ color: '#666', fontSize: '11px', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '6px' }}>Description</div>
                          <div style={{ color: '#FFF', fontSize: '14px', lineHeight: 1.6, background: '#111', borderRadius: '8px', padding: '12px' }}>{ticket.description || '—'}</div>
                        </div>
                        <div>
                          <div style={{ color: '#666', fontSize: '11px', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '6px' }}>Order info</div>
                          <div style={{ background: '#111', borderRadius: '8px', padding: '12px', fontSize: '13px', lineHeight: 1.8 }}>
                            <div style={{ color: '#999' }}>Ticket ID: <span style={{ color: '#FFF' }}>#{shortId}</span></div>
                            <div style={{ color: '#999' }}>Order ID: <span style={{ color: '#FFF' }}>#{orderShortId}</span></div>
                            {ticket.deliveries && (
                              <>
                                <div style={{ color: '#999' }}>Route: <span style={{ color: '#FFF' }}>{ticket.deliveries.pickup_city} → {ticket.deliveries.delivery_city}</span></div>
                                <div style={{ color: '#999' }}>Value: <span style={{ color: '#D4FF00' }}>PLN {(ticket.deliveries.price_total || 0).toFixed(2)}</span></div>
                              </>
                            )}
                            <div style={{ color: '#999', fontSize: '11px', marginTop: 4 }}>{pc.note}</div>
                          </div>
                        </div>
                      </div>

                      {/* Internal notes */}
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ color: '#666', fontSize: '11px', textTransform: 'uppercase', letterSpacing: 1, marginBottom: '6px' }}>Internal notes</div>
                        <textarea
                          value={notes[ticket['id']] !== undefined ? notes[ticket['id']] : (ticket.internal_notes || '')}
                          onChange={e => setNotes(n => ({ ...n, [ticket['id']]: e.target.value }))}
                          rows={3}
                          placeholder="Add internal notes..."
                          style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', borderRadius: '8px', color: '#FFF', fontSize: '13px', resize: 'none', boxSizing: 'border-box' }}
                        />
                        <button
                          onClick={() => saveNote(ticket['id'])}
                          disabled={saving === ticket['id'] + '_note'}
                          style={{ marginTop: '6px', background: 'transparent', border: '1px solid #444', color: '#999', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          {saving === ticket['id'] + '_note' ? 'Saving...' : 'Save note'}
                        </button>
                      </div>

                      {/* Actions */}
                      {ticket.status === 'open' && (
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => markResolved(ticket['id'])}
                            disabled={saving === ticket['id']}
                            style={{ background: '#00C853', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                          >
                            {saving === ticket['id'] ? 'Saving...' : '✓ Mark Resolved'}
                          </button>
                          <a
                            href={'mailto:?subject=LGK Order ' + orderShortId + ' — ' + (CATEGORY_LABELS[ticket.category] || ticket.category)}
                            style={{ background: '#007BFF', color: '#FFF', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', textDecoration: 'none', display: 'inline-block' }}
                          >
                            ✉ Email Client
                          </a>
                          {ticket.priority !== 'P1' && (
                            <button
                              onClick={() => escalate(ticket['id'])}
                              disabled={saving === ticket['id']}
                              style={{ background: 'transparent', border: '1px solid #FF3B30', color: '#FF3B30', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                            >
                              ↑ Escalate to P1
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
