'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const M = {
  mono: { fontFamily: "'Fira Code', monospace" },
  display: { fontFamily: "'Space Grotesk', sans-serif" },
};

const INPUT_STYLE = {
  background: '#0D0D0D',
  border: '1px solid #2A2A2A',
  borderRadius: '8px',
  color: '#FFF',
  padding: '9px 12px',
  fontFamily: "'Space Grotesk', sans-serif",
  fontSize: '13px',
  outline: 'none',
  width: '100%',
};

export default function AdminBrama() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [acting, setActing] = useState(null);

  // Add-code form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ address: '', brama_code: '', lat: '', lng: '' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('location_intel')
      .select('id, brama_code, address, lat, lng, worked_votes, is_active, created_at, submitted_by, profiles(name, email)')
      .order('created_at', { ascending: false });
    setCodes(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = async (id) => {
    setActing(id + '_approve');
    await supabase.from('location_intel').update({ is_active: true }).eq('id', id);
    setActing(null);
    load();
  };

  const remove = async (id) => {
    setActing(id + '_remove');
    await supabase.from('location_intel').update({ is_active: false, brama_code: null }).eq('id', id);
    setActing(null);
    load();
  };

  const submitCode = async () => {
    setFormError('');
    const addr = form.address.trim();
    if (!addr) { setFormError('Address is required'); return; }
    if (addr.length > 200) { setFormError('Address too long (max 200 characters)'); return; }
    const code = form.brama_code.trim().toUpperCase();
    if (!code) { setFormError('Brama code is required'); return; }
    if (!/^[A-Z0-9*#]{1,20}$/.test(code)) {
      setFormError('Code can only contain digits, letters, * and #, max 20 characters');
      return;
    }
    if (form.lat.trim() && isNaN(parseFloat(form.lat))) { setFormError('Latitude must be a number'); return; }
    if (form.lng.trim() && isNaN(parseFloat(form.lng))) { setFormError('Longitude must be a number'); return; }

    setSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();

    const payload = {
      address: addr,
      brama_code: code,
      is_active: true,
      worked_votes: 3,
      submitted_by: session?.user?.['id'] || null,
    };
    if (form.lat.trim()) payload.lat = parseFloat(form.lat);
    if (form.lng.trim()) payload.lng = parseFloat(form.lng);

    const { error } = await supabase.from('location_intel').insert(payload);
    setSubmitting(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    setForm({ address: '', brama_code: '', lat: '', lng: '' });
    setShowForm(false);
    setTab('live');
    load();
  };

  const pending = codes.filter(c => !c.is_active || c.worked_votes < 3);
  const live = codes.filter(c => c.is_active && c.worked_votes >= 3);
  const shown = tab === 'pending' ? pending : live;

  const stats = [
    { label: 'Total codes', value: codes.length,   color: '#FFF' },
    { label: 'Live',         value: live.length,    color: '#00C853' },
    { label: 'Pending',      value: pending.length, color: '#FF9500' },
    { label: 'Avg votes',    value: codes.length ? (codes.reduce((s, c) => s + (c.worked_votes || 0), 0) / codes.length).toFixed(1) : '—', color: '#D4FF00' },
  ];

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ ...M.display, fontSize: '22px', fontWeight: 900, color: '#FFF', margin: '0 0 3px' }}>Brama Codes</h1>
          <div style={{ ...M.mono, fontSize: '11px', color: '#444' }}>GPS-verified gate codes · 3-courier minimum · 90-day expiry</div>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setFormError(''); }}
          style={{
            background: showForm ? '#141414' : 'rgba(212,255,0,0.1)',
            border: `1px solid ${showForm ? '#2A2A2A' : 'rgba(212,255,0,0.3)'}`,
            color: showForm ? '#555' : '#D4FF00',
            padding: '9px 20px', borderRadius: '8px',
            cursor: 'pointer', ...M.display, fontSize: '13px', fontWeight: 700,
          }}
        >{showForm ? '✕ Cancel' : '+ Add code'}</button>
      </div>

      {/* Add-code form */}
      {showForm && (
        <div style={{
          background: '#141414', border: '1px solid #2A2A2A',
          borderRadius: '12px', padding: '20px 24px', marginBottom: '24px',
        }}>
          <div style={{ ...M.mono, fontSize: '10px', color: '#555', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '16px' }}>
            Manual seed — admin-verified · set live immediately (votes=3)
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <div style={{ ...M.display, fontSize: '11px', color: '#555', marginBottom: '5px' }}>Address *</div>
              <input
                style={INPUT_STYLE}
                placeholder="ul. Przykładowa 12, Szczecin"
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              />
            </div>
            <div>
              <div style={{ ...M.display, fontSize: '11px', color: '#555', marginBottom: '5px' }}>Brama code *</div>
              <input
                style={{ ...INPUT_STYLE, fontFamily: "'Fira Code', monospace", letterSpacing: '2px', color: '#D4FF00' }}
                placeholder="1234#"
                value={form.brama_code}
                onChange={e => setForm(f => ({ ...f, brama_code: e.target.value }))}
              />
            </div>
            <div>
              <div style={{ ...M.display, fontSize: '11px', color: '#555', marginBottom: '5px' }}>Latitude (optional)</div>
              <input
                style={INPUT_STYLE}
                placeholder="53.4285"
                value={form.lat}
                onChange={e => setForm(f => ({ ...f, lat: e.target.value }))}
              />
            </div>
            <div>
              <div style={{ ...M.display, fontSize: '11px', color: '#555', marginBottom: '5px' }}>Longitude (optional)</div>
              <input
                style={INPUT_STYLE}
                placeholder="14.5528"
                value={form.lng}
                onChange={e => setForm(f => ({ ...f, lng: e.target.value }))}
              />
            </div>
          </div>

          {formError && (
            <div style={{ ...M.display, fontSize: '12px', color: '#FF3B30', marginBottom: '12px' }}>{formError}</div>
          )}

          <button
            onClick={submitCode}
            disabled={submitting}
            style={{
              background: submitting ? '#1A1A1A' : '#D4FF00',
              color: '#000', border: 'none',
              padding: '10px 28px', borderRadius: '8px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              ...M.display, fontSize: '13px', fontWeight: 700,
            }}
          >{submitting ? 'Saving...' : 'Save & go live'}</button>
        </div>
      )}

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: '12px', padding: '14px 18px', flex: 1 }}>
            <div style={{ ...M.mono, fontSize: '22px', fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: '4px' }}>{s.value}</div>
            <div style={{ ...M.display, fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid #1E1E1E' }}>
        {[['pending', `Pending (${pending.length})`], ['live', `Live (${live.length})`]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '9px 18px', background: 'transparent', border: 'none',
            borderBottom: tab === key ? '2px solid #D4FF00' : '2px solid transparent',
            color: tab === key ? '#D4FF00' : '#555',
            cursor: 'pointer', ...M.display, fontSize: '13px',
            fontWeight: tab === key ? 700 : 400, marginBottom: '-1px',
          }}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ ...M.mono, color: '#333', fontSize: '13px', padding: '40px 0' }}>loading...</div>
      ) : shown.length === 0 ? (
        <div style={{ ...M.display, color: '#333', fontSize: '14px', padding: '60px', textAlign: 'center' }}>
          {tab === 'pending' ? 'No codes awaiting moderation' : 'No live codes yet — use "+ Add code" above to manually seed Szczecin.'}
        </div>
      ) : (
        <div style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 80px 120px 70px 160px', gap: '12px', padding: '10px 18px', borderBottom: '1px solid #1E1E1E' }}>
            {['Address', 'Code', 'Votes', 'Submitted by', 'Date', 'Actions'].map(h => (
              <span key={h} style={{ ...M.mono, fontSize: '10px', color: '#333', letterSpacing: '1px', textTransform: 'uppercase' }}>{h}</span>
            ))}
          </div>

          {shown.map((c, i) => (
            <div key={c['id']} style={{
              display: 'grid', gridTemplateColumns: '1fr 120px 80px 120px 70px 160px',
              gap: '12px', padding: '13px 18px',
              borderBottom: i < shown.length - 1 ? '1px solid #111' : 'none',
              alignItems: 'center',
            }}>
              <div>
                <div style={{ ...M.display, fontSize: '13px', color: '#CCC' }}>{c.address || 'Unknown address'}</div>
                {c.lat && c.lng && (
                  <div style={{ ...M.mono, fontSize: '10px', color: '#333', marginTop: '2px' }}>
                    {Number(c.lat).toFixed(4)}, {Number(c.lng).toFixed(4)}
                  </div>
                )}
              </div>

              <span style={{
                ...M.mono, fontSize: '15px', fontWeight: 700,
                color: '#D4FF00', background: '#000000',
                padding: '4px 10px', borderRadius: '6px', letterSpacing: '2px',
              }}>{c.brama_code || '—'}</span>

              <span style={{ ...M.mono, fontSize: '13px', fontWeight: 700, color: (c.worked_votes || 0) >= 3 ? '#00C853' : '#FF9500' }}>
                {c.worked_votes || 0}/3
              </span>

              <span style={{ ...M.display, fontSize: '12px', color: '#666' }}>
                {c.profiles?.name || c.profiles?.email?.split('@')[0] || '—'}
              </span>

              <span style={{ ...M.mono, fontSize: '11px', color: '#444' }}>
                {new Date(c.created_at).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })}
              </span>

              <div style={{ display: 'flex', gap: '6px' }}>
                {tab === 'pending' && (
                  <button
                    onClick={() => approve(c['id'])}
                    disabled={acting === c['id'] + '_approve'}
                    style={{
                      background: '#00C853', color: '#000', border: 'none',
                      padding: '5px 10px', borderRadius: '6px',
                      cursor: 'pointer', ...M.display, fontSize: '11px', fontWeight: 700,
                    }}>{acting === c['id'] + '_approve' ? '...' : '✓ Approve'}</button>
                )}
                <button
                  onClick={() => remove(c['id'])}
                  disabled={acting === c['id'] + '_remove'}
                  style={{
                    background: 'transparent', color: '#FF3B30',
                    border: '1px solid rgba(255,59,48,0.3)',
                    padding: '5px 10px', borderRadius: '6px',
                    cursor: 'pointer', ...M.display, fontSize: '11px', fontWeight: 700,
                  }}>{acting === c['id'] + '_remove' ? '...' : 'Remove'}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
