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

const inp = {
  width: '100%', padding: '11px 14px',
  background: '#0A0A0A', border: '1px solid #2A2A2A',
  borderRadius: '8px', color: '#FFF', fontSize: '14px',
  boxSizing: 'border-box', outline: 'none',
  fontFamily: "'Space Grotesk', sans-serif",
};

const SETTINGS_META = [
  { key: 'cs_response_time',  label: 'CS Response Time',       note: 'Shown to clients when filing a support report',      multiline: true },
  { key: 'cs_email',          label: 'CS Email Address',        note: 'Used for client-facing support contact' },
  { key: 'revolut_username',  label: 'Revolut Username',        note: 'e.g. brianv7t — used to build payment links' },
  { key: 'insurance_fee',     label: 'Insurance Fee (PLN)',     note: 'Fixed fee added to orders with insurance selected' },
  { key: 'insurance_coverage',label: 'Insurance Coverage (PLN)',note: 'Max payout per claim shown to clients' },
];

const ROLE_CONFIG = {
  super_admin:   { label: 'Super Admin',   color: '#D4FF00', note: 'Full access — all sections, team management' },
  ops_assistant: { label: 'Ops Assistant', color: '#007BFF', note: 'Orders, couriers, CS, clients, waitlist only' },
};

// ─── Platform Settings Tab ────────────────────────────────────────────────────

function PlatformTab() {
  const [values, setValues] = useState({});
  const [original, setOriginal] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.from('platform_settings').select('key, value').then(({ data }) => {
      const map = {};
      (data || []).forEach(row => { map[row.key] = row.value; });
      setValues(map);
      setOriginal(map);
      setLoading(false);
    });
  }, []);

  const saveAll = async () => {
    setSaving(true);
    const upserts = SETTINGS_META.map(m => ({ key: m.key, value: values[m.key] || '' }));
    await supabase.from('platform_settings').upsert(upserts, { onConflict: 'key' });
    setOriginal({ ...values });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const hasChanges = SETTINGS_META.some(m => values[m.key] !== original[m.key]);

  if (loading) return <div style={{ ...M.mono, color: '#333', fontSize: '13px', padding: '40px 0' }}>loading...</div>;

  return (
    <div style={{ maxWidth: '640px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
        {SETTINGS_META.map(meta => (
          <div key={meta.key} style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: '12px', padding: '18px 20px' }}>
            <label style={{ display: 'block', ...M.display, fontWeight: 700, fontSize: '14px', marginBottom: '3px', color: '#FFF' }}>
              {meta.label}
            </label>
            <div style={{ ...M.mono, color: '#444', fontSize: '11px', marginBottom: '10px' }}>{meta.note}</div>
            {meta.multiline ? (
              <textarea
                value={values[meta.key] || ''}
                onChange={e => setValues(v => ({ ...v, [meta.key]: e.target.value }))}
                rows={3}
                style={{ ...inp, resize: 'vertical' }}
              />
            ) : (
              <input
                type="text"
                value={values[meta.key] || ''}
                onChange={e => setValues(v => ({ ...v, [meta.key]: e.target.value }))}
                style={inp}
              />
            )}
          </div>
        ))}
      </div>

      {saved && (
        <div style={{ background: 'rgba(0,200,83,0.08)', border: '1px solid rgba(0,200,83,0.2)', borderRadius: '8px', padding: '10px 16px', marginBottom: '16px', ...M.display, fontSize: '13px', color: '#00C853' }}>
          ✓ Settings saved
        </div>
      )}

      <button
        onClick={saveAll}
        disabled={saving || !hasChanges}
        style={{
          background: hasChanges ? '#D4FF00' : '#1A1A1A',
          color: hasChanges ? '#000' : '#444',
          border: 'none', padding: '14px 32px',
          borderRadius: '10px', fontWeight: 900,
          fontSize: '14px', cursor: hasChanges ? 'pointer' : 'not-allowed',
          width: '100%', ...M.display,
        }}
      >
        {saving ? 'Saving...' : 'Save All Settings'}
      </button>
      {!hasChanges && !saving && (
        <div style={{ textAlign: 'center', ...M.mono, color: '#333', fontSize: '11px', marginTop: '8px' }}>No changes to save</div>
      )}
    </div>
  );
}

// ─── Team Tab ─────────────────────────────────────────────────────────────────

function TeamTab({ myId }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addEmail, setAddEmail] = useState('');
  const [addRole, setAddRole] = useState('ops_assistant');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [acting, setActing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, name, email, admin_role, created_at')
      .eq('is_admin', true)
      .order('created_at');
    setAdmins(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addAdmin = async () => {
    const emailVal = addEmail.trim().toLowerCase();
    if (!emailVal) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      setAddError('Enter a valid email address.');
      return;
    }
    setAdding(true);
    setAddError('');
    setAddSuccess('');

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, name')
      .eq('email', emailVal)
      .single();

    if (!profile) {
      setAddError('No account found with that email. They must sign in to lgk-business.vercel.app at least once first.');
      setAdding(false);
      return;
    }

    await supabase
      .from('profiles')
      .update({ is_admin: true, admin_role: addRole })
      .eq('id', profile['id']);

    setAddSuccess(`${profile.name || profile.email} added as ${ROLE_CONFIG[addRole].label}`);
    setAddEmail('');
    setAdding(false);
    load();
  };

  const changeRole = async (id, newRole) => {
    setActing(id + '_role');
    await supabase.from('profiles').update({ admin_role: newRole }).eq('id', id);
    setActing(null);
    load();
  };

  const revoke = async (id, email) => {
    if (id === myId) return;
    setActing(id + '_revoke');
    await supabase.from('profiles').update({ is_admin: false, admin_role: null }).eq('id', id);
    setActing(null);
    load();
  };

  return (
    <div style={{ maxWidth: '720px' }}>

      {/* Add new admin */}
      <div style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <div style={{ ...M.mono, fontSize: '10px', color: '#444', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '14px' }}>
          Grant admin access
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <input
            type="email"
            placeholder="their email address..."
            value={addEmail}
            onChange={e => { setAddEmail(e.target.value); setAddError(''); setAddSuccess(''); }}
            onKeyDown={e => e.key === 'Enter' && addAdmin()}
            style={{ ...inp, flex: '1', minWidth: '220px' }}
          />
          <select
            value={addRole}
            onChange={e => setAddRole(e.target.value)}
            style={{
              ...inp, width: 'auto', padding: '11px 14px',
              cursor: 'pointer', color: '#CCC',
            }}
          >
            <option value="ops_assistant">Ops Assistant</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <button
            onClick={addAdmin}
            disabled={adding || !addEmail.trim()}
            style={{
              background: addEmail.trim() ? '#D4FF00' : '#1A1A1A',
              color: addEmail.trim() ? '#000' : '#444',
              border: 'none', padding: '11px 20px',
              borderRadius: '8px', cursor: addEmail.trim() ? 'pointer' : 'not-allowed',
              ...M.display, fontSize: '13px', fontWeight: 700, whiteSpace: 'nowrap',
            }}
          >{adding ? '...' : '+ Grant access'}</button>
        </div>

        {/* Role descriptions */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
            <div key={key} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{
                ...M.mono, fontSize: '10px', fontWeight: 700,
                color: cfg.color, background: `${cfg.color}18`,
                padding: '2px 7px', borderRadius: '4px',
              }}>{cfg.label}</span>
              <span style={{ ...M.display, fontSize: '11px', color: '#444' }}>{cfg.note}</span>
            </div>
          ))}
        </div>

        {addError && (
          <div style={{ marginTop: '10px', background: 'rgba(255,59,48,0.07)', border: '1px solid rgba(255,59,48,0.2)', borderRadius: '8px', padding: '10px 14px', ...M.display, fontSize: '13px', color: '#FF3B30' }}>
            {addError}
          </div>
        )}
        {addSuccess && (
          <div style={{ marginTop: '10px', background: 'rgba(0,200,83,0.07)', border: '1px solid rgba(0,200,83,0.2)', borderRadius: '8px', padding: '10px 14px', ...M.display, fontSize: '13px', color: '#00C853' }}>
            ✓ {addSuccess}
          </div>
        )}
      </div>

      {/* Current admins */}
      <div style={{ ...M.mono, fontSize: '10px', color: '#444', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>
        Admin team ({admins.length})
      </div>

      {loading ? (
        <div style={{ ...M.mono, color: '#333', fontSize: '13px', padding: '20px 0' }}>loading...</div>
      ) : (
        <div style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: '12px', overflow: 'hidden' }}>
          {admins.map((a, i) => {
            const rc = ROLE_CONFIG[a.admin_role] || ROLE_CONFIG.ops_assistant;
            const isMe = a['id'] === myId;
            return (
              <div key={a['id']} style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '14px 18px',
                borderBottom: i < admins.length - 1 ? '1px solid #111' : 'none',
              }}>
                {/* Avatar */}
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: `${rc.color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ ...M.display, fontSize: '14px', fontWeight: 700, color: rc.color }}>
                    {(a.name || a.email || '?')[0].toUpperCase()}
                  </span>
                </div>

                {/* Name + email */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...M.display, fontSize: '14px', fontWeight: 600, color: '#FFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {a.name || a.email?.split('@')[0] || 'Admin'}
                    {isMe && <span style={{ ...M.mono, fontSize: '10px', color: '#444' }}>you</span>}
                  </div>
                  <div style={{ ...M.mono, fontSize: '11px', color: '#444', marginTop: '2px' }}>{a.email}</div>
                </div>

                {/* Role badge / selector */}
                {isMe ? (
                  <span style={{
                    ...M.mono, fontSize: '11px', fontWeight: 700,
                    color: rc.color, background: `${rc.color}18`,
                    padding: '4px 10px', borderRadius: '6px',
                  }}>{rc.label}</span>
                ) : (
                  <select
                    value={a.admin_role || 'ops_assistant'}
                    onChange={e => changeRole(a['id'], e.target.value)}
                    disabled={acting === a['id'] + '_role'}
                    style={{
                      background: '#1A1A1A', border: `1px solid ${rc.color}44`,
                      borderRadius: '6px', color: rc.color,
                      padding: '5px 10px', fontSize: '11px',
                      fontFamily: "'Fira Code', monospace",
                      cursor: 'pointer', outline: 'none',
                      fontWeight: 700,
                    }}
                  >
                    <option value="ops_assistant">Ops Assistant</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                )}

                {/* Revoke */}
                {!isMe && (
                  <button
                    onClick={() => revoke(a['id'], a.email)}
                    disabled={acting === a['id'] + '_revoke'}
                    style={{
                      background: 'transparent', color: '#FF3B30',
                      border: '1px solid rgba(255,59,48,0.2)',
                      padding: '5px 12px', borderRadius: '6px',
                      cursor: 'pointer', ...M.display,
                      fontSize: '11px', fontWeight: 700, flexShrink: 0,
                    }}
                  >{acting === a['id'] + '_revoke' ? '...' : 'Revoke'}</button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminSettings() {
  const [tab, setTab] = useState('platform');
  const [myId, setMyId] = useState(null);
  const [myRole, setMyRole] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      setMyId(session.user['id']);
      supabase.from('profiles').select('admin_role').eq('id', session.user['id']).single()
        .then(({ data }) => setMyRole(data?.admin_role || 'ops_assistant'));
    });
  }, []);

  const TABS = [
    { key: 'platform', label: 'Platform' },
    { key: 'team',     label: 'Team',    superOnly: true },
  ];

  const visibleTabs = TABS.filter(t => !t.superOnly || myRole === 'super_admin');

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1000px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ ...M.display, fontSize: '22px', fontWeight: 900, color: '#FFF', margin: '0 0 3px' }}>Settings</h1>
        <div style={{ ...M.mono, fontSize: '11px', color: '#444' }}>Platform config · team access</div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '28px', borderBottom: '1px solid #1E1E1E' }}>
        {visibleTabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '9px 20px', background: 'transparent', border: 'none',
            borderBottom: tab === t.key ? '2px solid #D4FF00' : '2px solid transparent',
            color: tab === t.key ? '#D4FF00' : '#555',
            cursor: 'pointer', ...M.display, fontSize: '13px',
            fontWeight: tab === t.key ? 700 : 400, marginBottom: '-1px',
          }}>{t.label}</button>
        ))}
      </div>

      {tab === 'platform' && <PlatformTab />}
      {tab === 'team' && myRole === 'super_admin' && <TeamTab myId={myId} />}
    </div>
  );
}
