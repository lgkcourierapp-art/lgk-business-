'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const M = {
  mono: { fontFamily: "'Fira Code', monospace" },
  display: { fontFamily: "'Space Grotesk', sans-serif" },
};

const GROUPS = [
  {
    title: 'Integracje POS',
    flags: ['gloriaFood_integration', 'gopos_integration'],
  },
  {
    title: 'Zarządzanie flotą',
    flags: ['own_fleet_dispatch', 'auto_dispatch', 'overflow_to_gig', 'customer_sms_tracking', 'multi_location'],
  },
];

function toTitle(name) {
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function Toggle({ enabled, disabled: isDisabled, onChange }) {
  return (
    <button
      onClick={onChange}
      disabled={isDisabled}
      style={{
        width: '48px', height: '26px', borderRadius: '13px',
        background: enabled ? '#00C853' : '#2A2A2A',
        border: 'none', cursor: isDisabled ? 'not-allowed' : 'pointer',
        position: 'relative', transition: 'background 200ms ease',
        flexShrink: 0,
        opacity: isDisabled ? 0.6 : 1,
      }}
      aria-label={enabled ? 'Disable' : 'Enable'}
    >
      <span style={{
        position: 'absolute',
        top: '3px',
        left: enabled ? '25px' : '3px',
        width: '20px', height: '20px',
        background: '#FFF', borderRadius: '50%',
        transition: 'left 200ms ease',
        display: 'block',
      }} />
    </button>
  );
}

export default function AdminFlags() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => { fetchFlags(); }, []);

  const fetchFlags = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .order('name', { ascending: true });
    if (!error) setFlags(data ?? []);
    setLoading(false);
  };

  const handleToggle = async (flagName, currentValue) => {
    if (flagName === 'ai_moderation_enabled' && !currentValue) {
      const confirmed = window.confirm(
        'Activate AI moderation?\n\nGoogle Vision API will be called for every new image upload.\nFirst 1,000 images/month are free. After that: $1.50 per 1,000.\n\nConfirm?'
      );
      if (!confirmed) return;
    }

    setSaving(flagName);

    const { data: { user } } = await supabase.auth.getUser();
    const adminUid = user?.['id'];

    const { error } = await supabase
      .from('feature_flags')
      .update({ enabled: !currentValue, updated_at: new Date().toISOString() })
      .eq('name', flagName);

    if (!error) {
      setFlags(prev =>
        prev.map(f => f.name === flagName ? { ...f, enabled: !currentValue } : f)
      );

      await supabase.from('audit_log').insert({
        event_type: 'feature_flag_toggled',
        user_id: adminUid,
        metadata: { flag: flagName, old_value: currentValue, new_value: !currentValue },
      });
    }

    setSaving(null);
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '800px', animation: 'fadeIn 0.3s ease' }}>

      {/* HEADER */}
      <div style={{ marginBottom: '8px' }}>
        <h1 style={{ ...M.display, fontSize: '22px', fontWeight: 900, color: '#FFF', margin: '0 0 3px' }}>
          Feature Flags
        </h1>
        <div style={{ ...M.mono, fontSize: '11px', color: '#444' }}>
          Changes take effect immediately. All toggles are logged to audit trail.
        </div>
      </div>

      <div style={{ marginBottom: '28px', height: '1px', background: '#1E1E1E' }} />

      {/* CONTENT */}
      {loading ? (
        <div style={{ ...M.mono, color: '#333', fontSize: '13px', padding: '40px 0' }}>
          Loading feature flags...
        </div>
      ) : flags.length === 0 ? (
        <div style={{
          background: '#141414', border: '1px solid #1E1E1E', borderRadius: '12px',
          padding: '60px', textAlign: 'center',
        }}>
          <div style={{ ...M.mono, fontSize: '13px', color: '#333' }}>No feature flags configured.</div>
        </div>
      ) : (() => {
          const groupedNames = new Set(GROUPS.flatMap(g => g.flags));
          const ungrouped = flags.filter(f => !groupedNames.has(f.name));

          const renderFlag = (flag) => {
            const isSaving = saving === flag.name;
            const isAiFlag = flag.name === 'ai_moderation_enabled';
            const isSmsFlag = flag.name === 'customer_sms_tracking';

            return (
              <div key={flag['id']} style={{
                background: '#141414',
                border: isSmsFlag ? '1px solid rgba(255,149,0,0.4)' : '1px solid #1E1E1E',
                borderRadius: '12px', padding: '20px 22px',
                borderLeftWidth: (isAiFlag || isSmsFlag) ? 3 : 1,
                borderLeftColor: isAiFlag
                  ? (flag.enabled ? '#00C853' : '#FF9500')
                  : isSmsFlag
                  ? '#FF9500'
                  : '#1E1E1E',
              }}>

                {/* Top row: name + toggle */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: flag.description || isAiFlag || isSmsFlag ? '12px' : 0 }}>
                  <div>
                    <div style={{ ...M.display, fontSize: '15px', fontWeight: 700, color: '#FFF', marginBottom: '2px' }}>
                      {toTitle(flag.name)}
                    </div>
                    <div style={{ ...M.mono, fontSize: '10px', color: '#333' }}>{flag.name}</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {isSaving && (
                      <span style={{ ...M.mono, fontSize: '10px', color: '#555' }}>saving...</span>
                    )}
                    <Toggle
                      enabled={flag.enabled}
                      disabled={isSaving}
                      onChange={() => handleToggle(flag.name, flag.enabled)}
                    />
                    <span style={{
                      ...M.mono, fontSize: '11px', fontWeight: 700,
                      color: flag.enabled ? '#00C853' : '#444',
                      minWidth: '28px',
                    }}>{flag.enabled ? 'ON' : 'OFF'}</span>
                  </div>
                </div>

                {/* Description */}
                {flag.description && (
                  <div style={{ ...M.display, fontSize: '13px', color: '#666', marginBottom: (isAiFlag || isSmsFlag) ? '12px' : '8px', lineHeight: 1.5 }}>
                    {flag.description}
                  </div>
                )}

                {/* SMS cost warning */}
                {isSmsFlag && (
                  <div style={{
                    background: 'rgba(255,149,0,0.06)',
                    border: '1px solid rgba(255,149,0,0.25)',
                    borderRadius: '8px', padding: '10px 14px',
                    marginBottom: '8px',
                  }}>
                    <div style={{ ...M.display, fontSize: '12px', color: '#FF9500', lineHeight: 1.6 }}>
                      Uwaga: każdy SMS kosztuje ~PLN 0.15 (Twilio)
                    </div>
                  </div>
                )}

                {/* AI flag info box */}
                {isAiFlag && (
                  <div style={{
                    background: flag.enabled ? 'rgba(0,200,83,0.06)' : 'rgba(255,149,0,0.06)',
                    border: `1px solid ${flag.enabled ? 'rgba(0,200,83,0.15)' : 'rgba(255,149,0,0.15)'}`,
                    borderRadius: '8px', padding: '10px 14px',
                    marginBottom: '8px',
                  }}>
                    {flag.enabled ? (
                      <div style={{ ...M.display, fontSize: '12px', color: '#00C853', lineHeight: 1.6 }}>
                        ACTIVE — Google Vision API running.<br />
                        Free tier: 1,000 images/month.<br />
                        After that: $1.50 per 1,000 images.<br />
                        <a
                          href="https://console.cloud.google.com"
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#00C853', opacity: 0.7 }}
                        >Monitor at console.cloud.google.com →</a>
                      </div>
                    ) : (
                      <div style={{ ...M.display, fontSize: '12px', color: '#FF9500', lineHeight: 1.6 }}>
                        OFF — All images auto-approved. Zero API cost.<br />
                        Free tier: 1,000 images/month when activated.
                      </div>
                    )}
                  </div>
                )}

                {/* Last updated */}
                {flag.updated_at && (
                  <div style={{ ...M.mono, fontSize: '10px', color: '#333' }}>
                    Last updated: {new Date(flag.updated_at).toLocaleString('pl-PL', {
                      day: '2-digit', month: '2-digit', year: '2-digit',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </div>
                )}
              </div>
            );
          };

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {GROUPS.map(group => {
                const groupFlags = group.flags
                  .map(name => flags.find(f => f.name === name))
                  .filter(Boolean);
                if (groupFlags.length === 0) return null;
                return (
                  <div key={group.title}>
                    <div style={{ ...M.mono, fontSize: '10px', color: '#444', letterSpacing: 1, textTransform: 'uppercase', marginBottom: '10px' }}>
                      {group.title}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {groupFlags.map(renderFlag)}
                    </div>
                  </div>
                );
              })}
              {ungrouped.length > 0 && (
                <div>
                  <div style={{ ...M.mono, fontSize: '10px', color: '#444', letterSpacing: 1, textTransform: 'uppercase', marginBottom: '10px' }}>
                    Inne
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {ungrouped.map(renderFlag)}
                  </div>
                </div>
              )}
            </div>
          );
        })()
      }
    </div>
  );
}
