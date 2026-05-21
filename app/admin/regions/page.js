'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const M = {
  mono: { fontFamily: "'Fira Code', monospace" },
  display: { fontFamily: "'Space Grotesk', sans-serif" },
};

const COUNTRIES = [
  { code: 'PL', name: 'Poland',  flag: '🇵🇱', status: 'live' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', status: 'planned' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦', status: 'planned' },
];

const FEATURE_FLAGS = [
  { key: 'brama_enabled',      label: 'Brama codes',         description: 'GPS-gated gate code reveal system',       country: 'PL' },
  { key: 'insurance_enabled',  label: 'Insurance',           description: 'Package insurance add-on at checkout',    country: 'PL' },
  { key: 'cod_enabled',        label: 'Cash on delivery',    description: 'COD payment option for orders',           country: 'PL' },
  { key: 'waitlist_open',      label: 'Waitlist open',       description: 'Allow new signups to the waitlist',       country: 'PL' },
  { key: 'express_enabled',    label: 'Express deliveries',  description: '2-hour express tier available',           country: 'PL' },
  { key: 'b2b_signup_open',    label: 'B2B self-signup',     description: 'Businesses can register without invite',  country: 'PL' },
];

export default function AdminRegions() {
  const [country, setCountry] = useState('PL');
  const [flags, setFlags] = useState({});
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: settings }, { data: cityData }] = await Promise.all([
      supabase.from('platform_settings').select('key, value'),
      supabase.from('cities').select('*').eq('country_code', country).order('name'),
    ]);

    const map = {};
    (settings || []).forEach(s => { map[s.key] = s.value; });
    setFlags(map);
    setCities(cityData || []);
    setLoading(false);
  }, [country]);

  useEffect(() => { load(); }, [load]);

  const toggleFlag = async (key, current) => {
    setSaving(key);
    const newVal = current === 'true' ? 'false' : 'true';
    await supabase
      .from('platform_settings')
      .upsert({ key, value: newVal }, { onConflict: 'key' });
    setFlags(prev => ({ ...prev, [key]: newVal }));
    setSaving(null);
  };

  const countryFlags = FEATURE_FLAGS.filter(f => f.country === country);
  const currentCountry = COUNTRIES.find(c => c.code === country);

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1000px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ ...M.display, fontSize: '22px', fontWeight: 900, color: '#FFF', margin: '0 0 3px' }}>Regions</h1>
        <div style={{ ...M.mono, fontSize: '11px', color: '#444' }}>Feature flags · city config · market status</div>
      </div>

      {/* Country tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
        {COUNTRIES.map(c => {
          const active = country === c.code;
          const liveColor = c.status === 'live' ? '#00C853' : '#444';
          return (
            <button key={c.code} onClick={() => setCountry(c.code)} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 18px', borderRadius: '10px',
              border: `1px solid ${active ? liveColor : '#2A2A2A'}`,
              background: active ? `${liveColor}12` : '#141414',
              cursor: 'pointer',
            }}>
              <span style={{ fontSize: '18px' }}>{c.flag}</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ ...M.display, fontSize: '13px', fontWeight: 700, color: active ? '#FFF' : '#555' }}>{c.name}</div>
                <div style={{ ...M.mono, fontSize: '10px', color: c.status === 'live' ? '#00C853' : '#444' }}>
                  {c.status === 'live' ? '● LIVE' : '○ PLANNED'}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ ...M.mono, color: '#333', fontSize: '13px', padding: '40px 0' }}>loading...</div>
      ) : (
        <>
          {/* Feature flags section */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ ...M.mono, fontSize: '10px', color: '#333', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '14px' }}>
              Feature flags — {currentCountry?.name}
            </div>

            {currentCountry?.status !== 'live' ? (
              <div style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: '12px', padding: '36px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', marginBottom: '10px' }}>{currentCountry?.flag}</div>
                <div style={{ ...M.display, fontSize: '14px', color: '#444', marginBottom: '6px' }}>
                  {currentCountry?.name} is not yet launched
                </div>
                <div style={{ ...M.mono, fontSize: '11px', color: '#2A2A2A' }}>Feature flags will appear here when this market goes live</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {countryFlags.map(flag => {
                  const isOn = flags[flag.key] === 'true';
                  const isSaving = saving === flag.key;
                  return (
                    <div key={flag.key} style={{
                      background: '#141414', border: '1px solid #1E1E1E',
                      borderRadius: '10px', padding: '14px 18px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ ...M.display, fontSize: '14px', fontWeight: 600, color: '#FFF', marginBottom: '3px' }}>{flag.label}</div>
                        <div style={{ ...M.mono, fontSize: '11px', color: '#444' }}>{flag.description}</div>
                        <div style={{ ...M.mono, fontSize: '10px', color: '#2A2A2A', marginTop: '3px' }}>{flag.key}</div>
                      </div>
                      <button
                        onClick={() => toggleFlag(flag.key, flags[flag.key])}
                        disabled={isSaving}
                        aria-label={`Toggle ${flag.label}`}
                        style={{
                          width: '48px', height: '26px',
                          borderRadius: '13px', border: 'none',
                          background: isSaving ? '#2A2A2A' : isOn ? '#D4FF00' : '#2A2A2A',
                          cursor: isSaving ? 'not-allowed' : 'pointer',
                          position: 'relative', transition: 'background 200ms',
                          flexShrink: 0,
                        }}
                      >
                        <div style={{
                          position: 'absolute', top: '3px',
                          left: isOn ? '25px' : '3px',
                          width: '20px', height: '20px', borderRadius: '50%',
                          background: isOn ? '#000' : '#555',
                          transition: 'left 200ms',
                        }} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cities */}
          <div>
            <div style={{ ...M.mono, fontSize: '10px', color: '#333', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '14px' }}>
              Cities — {currentCountry?.name}
            </div>
            {cities.length === 0 ? (
              <div style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
                <div style={{ ...M.display, fontSize: '13px', color: '#333' }}>No cities configured for this market</div>
              </div>
            ) : (
              <div style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: '12px', overflow: 'hidden' }}>
                {cities.map((city, i) => (
                  <div key={city['id']} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '13px 18px', borderBottom: i < cities.length - 1 ? '1px solid #111' : 'none',
                  }}>
                    <div>
                      <div style={{ ...M.display, fontSize: '14px', fontWeight: 600, color: '#FFF' }}>{city.name}</div>
                      <div style={{ ...M.mono, fontSize: '10px', color: '#444', marginTop: '2px' }}>
                        {city.country_code} · {city.timezone || 'Europe/Warsaw'}
                      </div>
                    </div>
                    <span style={{
                      ...M.mono, fontSize: '10px', fontWeight: 700,
                      color: city.is_active ? '#00C853' : '#444',
                      background: city.is_active ? 'rgba(0,200,83,0.1)' : '#1A1A1A',
                      padding: '3px 8px', borderRadius: '5px',
                    }}>{city.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
