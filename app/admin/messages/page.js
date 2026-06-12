'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const M = {
  mono: { fontFamily: "'Fira Code', monospace" },
  display: { fontFamily: "'Space Grotesk', sans-serif" },
};

const BODY_LIMIT = 280;
const SUBJECT_LIMIT = 60;

export default function AdminMessages() {
  const [messages, setMessages] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [adminId, setAdminId] = useState(null);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    to_type: 'all',
    to_id: '',
    subject: '',
    body: '',
    priority: 'normal',
  });

  const showToast = (msg, color = '#00C853') => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: msgs }, { data: profiles }] = await Promise.all([
      supabase
        .from('operator_messages')
        .select('*, from_user:from_user_id(full_name), to_user:to_id(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('profiles')
        .select('id, full_name, email')
        .or('is_courier.eq.true,is_admin.eq.true')
        .order('full_name'),
    ]);
    setMessages(msgs || []);
    setCouriers(profiles || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setAdminId(session.user.id);
    });
    load();
  }, [load]);

  const handleSend = async () => {
    if (!form.subject.trim() || !form.body.trim()) return;
    setSending(true);
    const payload = {
      from_user_id: adminId,
      to_type: form.to_type,
      to_id: form.to_type === 'all' ? null : form.to_id || null,
      subject: form.subject.trim(),
      body: form.body.trim(),
      priority: form.priority,
    };
    const { error } = await supabase.from('operator_messages').insert([payload]);
    if (error) {
      showToast('Error: ' + error.message, '#FF3B30');
    } else {
      showToast('Message sent');
      setForm({ to_type: 'all', to_id: '', subject: '', body: '', priority: 'normal' });
      await load();
    }
    setSending(false);
  };

  const priorityColor = (p) => p === 'urgent' ? '#FF3B30' : '#666';
  const toLabel = (msg) => {
    if (msg.to_type === 'all') return 'All couriers';
    if (msg.to_type === 'courier') return msg.to_user?.full_name || msg.to_user?.email || 'Courier';
    if (msg.to_type === 'company') return 'Company';
    return msg.to_type;
  };

  const bodyLeft = BODY_LIMIT - form.body.length;
  const subjectLeft = SUBJECT_LIMIT - form.subject.length;

  return (
    <div style={{ padding: '28px 32px', maxWidth: '960px', animation: 'fadeIn 0.2s ease' }}>
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '24px', zIndex: 9999,
          background: '#1A1A1A', border: `1px solid ${toast.color}`,
          borderRadius: '10px', padding: '12px 20px',
          ...M.display, fontSize: '13px', color: toast.color,
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}>{toast.msg}</div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ ...M.display, fontSize: '22px', fontWeight: 900, color: '#FFF', margin: '0 0 4px' }}>Messages</h1>
          <div style={{ ...M.mono, fontSize: '11px', color: '#444', letterSpacing: '1px' }}>Operator broadcasts to couriers</div>
        </div>
        <button onClick={load} style={{
          background: 'transparent', border: '1px solid #1E1E1E', color: '#444',
          padding: '8px 14px', borderRadius: '8px', cursor: 'pointer',
          ...M.mono, fontSize: '11px',
        }}>↻</button>
      </div>

      {/* Compose */}
      <div style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: '14px', padding: '20px', marginBottom: '28px' }}>
        <div style={{ ...M.display, fontWeight: 700, fontSize: '13px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
          New message
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {/* Recipient type */}
          <div style={{ flex: '0 0 auto' }}>
            <div style={{ ...M.mono, fontSize: '9px', color: '#444', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '1px' }}>To</div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[['all', 'All couriers'], ['courier', 'Courier'], ['company', 'Company']].map(([val, lbl]) => (
                <button key={val} onClick={() => setForm(f => ({ ...f, to_type: val, to_id: '' }))} style={{
                  padding: '6px 12px', borderRadius: '6px', border: 'none',
                  background: form.to_type === val ? '#D4FF00' : '#1A1A1A',
                  color: form.to_type === val ? '#000' : '#666',
                  ...M.mono, fontSize: '11px', cursor: 'pointer', fontWeight: 600,
                }}>{lbl}</button>
              ))}
            </div>
          </div>

          {/* Courier picker */}
          {form.to_type === 'courier' && (
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ ...M.mono, fontSize: '9px', color: '#444', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '1px' }}>Select courier</div>
              <select
                value={form.to_id}
                onChange={e => setForm(f => ({ ...f, to_id: e.target.value }))}
                style={{
                  width: '100%', background: '#1A1A1A', border: '1px solid #2A2A2A',
                  borderRadius: '6px', color: '#FFF', padding: '7px 10px',
                  ...M.mono, fontSize: '11px', outline: 'none',
                }}
              >
                <option value="">— pick courier —</option>
                {couriers.map(c => (
                  <option key={c.id} value={c.id}>{c.full_name || c.email}</option>
                ))}
              </select>
            </div>
          )}

          {/* Priority */}
          <div style={{ flex: '0 0 auto' }}>
            <div style={{ ...M.mono, fontSize: '9px', color: '#444', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '1px' }}>Priority</div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[['normal', 'Normal'], ['urgent', 'Urgent']].map(([val, lbl]) => (
                <button key={val} onClick={() => setForm(f => ({ ...f, priority: val }))} style={{
                  padding: '6px 12px', borderRadius: '6px', border: 'none',
                  background: form.priority === val ? (val === 'urgent' ? '#FF3B30' : '#1A1A1A') : '#1A1A1A',
                  color: form.priority === val ? (val === 'urgent' ? '#FFF' : '#888') : '#555',
                  ...M.mono, fontSize: '11px', cursor: 'pointer', fontWeight: 600,
                  outline: form.priority === val && val === 'normal' ? '1px solid #333' : 'none',
                }}>{lbl}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Subject */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ ...M.mono, fontSize: '9px', color: '#444', textTransform: 'uppercase', letterSpacing: '1px' }}>Subject</span>
            <span style={{ ...M.mono, fontSize: '9px', color: subjectLeft < 10 ? '#FF3B30' : '#333' }}>{subjectLeft}</span>
          </div>
          <input
            value={form.subject}
            onChange={e => e.target.value.length <= SUBJECT_LIMIT && setForm(f => ({ ...f, subject: e.target.value }))}
            placeholder="e.g. Zone B closed until 18:00"
            style={{
              width: '100%', background: '#0A0A0A', border: '1px solid #2A2A2A',
              borderRadius: '8px', color: '#FFF', padding: '9px 14px',
              ...M.display, fontSize: '14px', outline: 'none',
            }}
          />
        </div>

        {/* Body */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ ...M.mono, fontSize: '9px', color: '#444', textTransform: 'uppercase', letterSpacing: '1px' }}>Message</span>
            <span style={{ ...M.mono, fontSize: '9px', color: bodyLeft < 30 ? '#FF9500' : '#333' }}>{bodyLeft} chars left</span>
          </div>
          <textarea
            value={form.body}
            onChange={e => e.target.value.length <= BODY_LIMIT && setForm(f => ({ ...f, body: e.target.value }))}
            placeholder="Message body visible to couriers in the app..."
            rows={4}
            style={{
              width: '100%', background: '#0A0A0A', border: '1px solid #2A2A2A',
              borderRadius: '8px', color: '#FFF', padding: '10px 14px',
              ...M.display, fontSize: '13px', outline: 'none',
              resize: 'vertical', lineHeight: 1.6,
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSend}
            disabled={sending || !form.subject.trim() || !form.body.trim()}
            style={{
              background: sending || !form.subject.trim() || !form.body.trim() ? '#1A1A1A' : '#D4FF00',
              color: sending || !form.subject.trim() || !form.body.trim() ? '#444' : '#000',
              border: 'none', borderRadius: '8px', padding: '10px 28px',
              ...M.display, fontWeight: 700, fontSize: '13px',
              cursor: sending ? 'default' : 'pointer',
              transition: 'all 120ms',
            }}
          >{sending ? 'Sending...' : 'Send message'}</button>
        </div>
      </div>

      {/* Message history */}
      <div style={{ ...M.display, fontWeight: 700, fontSize: '13px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>
        Sent ({messages.length})
      </div>

      {loading ? (
        <div style={{ ...M.mono, color: '#333', fontSize: '13px', padding: '40px 0' }}>loading...</div>
      ) : messages.length === 0 ? (
        <div style={{ ...M.display, color: '#333', fontSize: '14px', padding: '60px', textAlign: 'center', background: '#141414', borderRadius: '12px' }}>
          No messages sent yet
        </div>
      ) : messages.map(msg => (
        <div key={msg.id} style={{
          background: '#141414',
          borderTop: `1px solid ${msg.priority === 'urgent' ? 'rgba(255,59,48,0.3)' : '#1E1E1E'}`,
          borderRight: `1px solid ${msg.priority === 'urgent' ? 'rgba(255,59,48,0.3)' : '#1E1E1E'}`,
          borderBottom: `1px solid ${msg.priority === 'urgent' ? 'rgba(255,59,48,0.3)' : '#1E1E1E'}`,
          borderLeft: `3px solid ${msg.priority === 'urgent' ? '#FF3B30' : '#2A2A2A'}`,
          borderRadius: '10px', padding: '14px 16px',
          marginBottom: '8px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ ...M.display, fontWeight: 700, fontSize: '14px', color: '#FFF' }}>{msg.subject}</span>
              {msg.priority === 'urgent' && (
                <span style={{ ...M.mono, fontSize: '9px', color: '#FF3B30', background: 'rgba(255,59,48,0.1)', padding: '2px 7px', borderRadius: '4px', letterSpacing: '1px' }}>URGENT</span>
              )}
            </div>
            <span style={{ ...M.mono, fontSize: '10px', color: '#444', flexShrink: 0 }}>
              {new Date(msg.created_at).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p style={{ ...M.display, fontSize: '13px', color: '#AAA', margin: '0 0 8px', lineHeight: 1.5 }}>{msg.body}</p>
          <div style={{ display: 'flex', gap: '12px', ...M.mono, fontSize: '10px', color: '#444' }}>
            <span>→ {toLabel(msg)}</span>
            <span>from {msg.from_user?.full_name || 'Admin'}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
