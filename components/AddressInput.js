'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { parseAddress } from '../utils/addressParser';
import { useApp } from '../utils/appContext';

const CITIES = [
  { key: 'szczecin', label: 'Szczecin' },
  { key: 'warszawa', label: 'Warszawa' },
  { key: 'krakow', label: 'Kraków' },
  { key: 'wroclaw', label: 'Wrocław' },
  { key: 'gdansk', label: 'Gdańsk' },
  { key: 'gdynia', label: 'Gdynia' },
  { key: 'sopot', label: 'Sopot' },
  { key: 'poznan', label: 'Poznań' },
  { key: 'lodz', label: 'Łódź' },
  { key: 'katowice', label: 'Katowice' },
  { key: 'lublin', label: 'Lublin' },
  { key: 'bydgoszcz', label: 'Bydgoszcz' },
  { key: 'torun', label: 'Toruń' },
  { key: 'gliwice', label: 'Gliwice' },
  { key: 'zabrze', label: 'Zabrze' },
  { key: 'bialystok', label: 'Białystok' },
  { key: 'czestochowa', label: 'Częstochowa' },
  { key: 'radom', label: 'Radom' },
  { key: 'kielce', label: 'Kielce' },
  { key: 'olsztyn', label: 'Olsztyn' },
];

const CITY_KEYS = CITIES.map(c => c.key);

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export default function AddressInput({
  label,
  savedAddresses = [],
  onFill,
  defaultValues = {},
  showContactFields = true,
  placeholder = 'Type street and number, or paste full address...'
}) {
  const { colors, lang } = useApp();
  const [mode, setMode] = useState('saved');
  const [parsed, setParsed] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [fields, setFields] = useState({
    street: '',
    house: '',
    apartment: '',
    postal: '',
    city: '',
    contactName: '',
    contactPhone: '',
    accessCode: '',
    instructions: '',
    ...defaultValues
  });
  const inputRef = useRef();
  const suggestionsRef = useRef();

  useEffect(() => {
    if (!defaultValues || !defaultValues.street) return;
    const filled = {
      street: defaultValues.street || '',
      house: defaultValues.house || '',
      apartment: defaultValues.apartment || '',
      postal: defaultValues.postal || '',
      city: defaultValues.city || '',
      contactName: defaultValues.contactName || '',
      contactPhone: defaultValues.contactPhone || '',
      accessCode: defaultValues.accessCode || '',
      instructions: defaultValues.instructions || '',
    };
    setFields(filled);
    setMode('manual');
    setParsed({ street: filled.street, house: filled.house, confidence: 'high' });
    emit(filled);
  }, [defaultValues.street, defaultValues.contactName]);

  const emit = useCallback((updated) => {
    onFill && onFill(updated);
  }, [onFill]);

  const applyParsed = useCallback((text) => {
    if (!text || text.trim().length < 4) return false;
    const result = parseAddress(text);
    if (result && (result.street || result.house) && result.confidence !== 'low') {
      const updated = {
        ...fields,
        street: result.street || fields.street,
        house: result.house || fields.house,
        apartment: result.apartment || fields.apartment,
        postal: result.postal || fields.postal,
        city: result.city || fields.city,
        contactName: result.contactName || fields.contactName,
      };
      setFields(updated);
      setParsed(result);
      setSearchText('');
      setMode('manual');
      emit(updated);
      return true;
    }
    return false;
  }, [fields, emit]);

  const handlePaste = useCallback((e) => {
    const text = e.clipboardData.getData('text');
    if (!text) return;
    const success = applyParsed(text);
    if (success) {
      e.preventDefault();
    }
  }, [applyParsed]);

  const handleClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) applyParsed(text);
    } catch {
      inputRef.current && inputRef.current.focus();
    }
  }, [applyParsed]);

  const fetchNominatim = useCallback(debounce(async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setLoadingSuggestions(true);
    try {
      const country = 'Poland';
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ' ' + country)}&format=json&addressdetails=1&limit=5&countrycodes=pl`;
      const res = await fetch(url, {
        headers: { 'Accept-Language': lang === 'pl' ? 'pl' : 'en' }
      });
      const data = await res.json();
      const filtered = data.filter(r =>
        r.address && (r.address.road || r.address.pedestrian || r.address.footway)
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }, 350), [lang]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchText(val);
    fetchNominatim(val);
  };

  const selectSuggestion = (suggestion) => {
    const addr = suggestion.address;
    const street = addr.road || addr.pedestrian || addr.footway || '';
    const house = addr.house_number || '';
    const postal = addr.postcode || '';
    const cityRaw = (addr.city || addr.town || addr.village || addr.municipality || '').toLowerCase();
    const cityMatch = CITY_KEYS.find(k => cityRaw.includes(k)) || '';

    const updated = {
      ...fields,
      street,
      house,
      postal,
      city: cityMatch,
    };
    setFields(updated);
    setSearchText('');
    setSuggestions([]);
    setShowSuggestions(false);
    setParsed({ street, house, postal, city: cityMatch, confidence: 'high' });
    setMode('manual');
    emit(updated);
  };

  const selectSaved = (addr) => {
    const updated = {
      street: addr.street || '',
      house: addr.house_number || '',
      apartment: addr.apartment || '',
      postal: addr.postal_code || '',
      city: addr.city || '',
      contactName: addr.contact_name || '',
      contactPhone: addr.contact_phone || '',
      accessCode: addr.access_code || '',
      instructions: addr.instructions || '',
    };
    setFields(updated);
    setMode('manual');
    setParsed(null);
    emit(updated);
  };

  const updateField = (key, val) => {
    const updated = { ...fields, [key]: val };
    setFields(updated);
    emit(updated);
  };

  const inp = (key, ph, type = 'text') => (
    <input
      type={type}
      placeholder={ph}
      value={fields[key]}
      onChange={e => updateField(key, e.target.value)}
      style={{
        width: '100%',
        padding: '13px 14px',
        background: colors.bg,
        border: '1px solid ' + colors.border,
        borderRadius: '8px',
        color: colors.text,
        fontSize: '16px',
        boxSizing: 'border-box',
        WebkitAppearance: 'none',
        outline: 'none',
      }}
    />
  );

  const lbl = (text) => (
    <div style={{ color: colors.textSecondary, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', marginTop: '14px' }}>
      {text}
    </div>
  );

  return (
    <div>
      <div style={{ color: '#D4FF00', fontWeight: 700, fontSize: '15px', marginBottom: '14px' }}>{label}</div>

      {/* SAVED ADDRESS TILES */}
      {mode === 'saved' && savedAddresses.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          {savedAddresses.slice(0, 4).map(addr => (
            <button
              key={addr['id']}
              onClick={() => selectSaved(addr)}
              style={{
                width: '100%',
                background: addr.is_default_pickup ? '#D4FF0012' : colors.card,
                border: '1px solid ' + (addr.is_default_pickup ? '#D4FF00' : colors.border),
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <span style={{ fontSize: '18px', flexShrink: 0 }}>{addr.is_default_pickup ? '⭐' : '📍'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: colors.text, fontWeight: 700, fontSize: '14px' }}>{addr.label}</div>
                <div style={{ color: colors.textSecondary, fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {addr.street} {addr.house_number}{addr.apartment ? '/' + addr.apartment : ''}, {addr.city}
                </div>
              </div>
              <span style={{ color: '#D4FF00', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>Use →</span>
            </button>
          ))}
          <button
            onClick={() => setMode('search')}
            style={{ background: 'transparent', border: '1px dashed ' + colors.border, borderRadius: '10px', padding: '12px 16px', width: '100%', color: colors.textSecondary, cursor: 'pointer', fontSize: '14px', textAlign: 'left' }}
          >
            ✏️ Enter a different address
          </button>
        </div>
      )}

      {/* SEARCH MODE (empty address book or clicked different address) */}
      {(mode === 'search' || (mode === 'saved' && savedAddresses.length === 0)) && (
        <div style={{ marginBottom: '12px' }}>

          {/* PARSED SUCCESS BANNER */}
          {parsed && (
            <div style={{ background: '#00C85318', border: '1px solid #00C853', borderRadius: '8px', padding: '10px 14px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#00C853', fontSize: '13px', fontWeight: 600 }}>
                ✅ {fields.street} {fields.house}{fields.apartment ? '/' + fields.apartment : ''}{fields.city ? ', ' + fields.city : ''}
              </div>
              <button onClick={() => { setParsed(null); setSearchText(''); }} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '12px' }}>Edit</button>
            </div>
          )}

          {/* SEARCH + PASTE ROW */}
          {!parsed && (
            <div>
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input
                      ref={inputRef}
                      value={searchText}
                      onChange={handleSearchChange}
                      onPaste={handlePaste}
                      onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      placeholder={placeholder}
                      autoComplete="off"
                      style={{
                        width: '100%',
                        padding: '13px 14px',
                        background: colors.bg,
                        border: '1px solid ' + colors.border,
                        borderRadius: '8px',
                        color: colors.text,
                        fontSize: '16px',
                        boxSizing: 'border-box',
                        outline: 'none',
                        WebkitAppearance: 'none',
                      }}
                    />
                    {loadingSuggestions && (
                      <div style={{
                        position: 'absolute',
                        right: '56px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#D4FF00',
                        fontSize: '12px',
                        fontFamily: "'Fira Code', monospace",
                        pointerEvents: 'none',
                      }}>searching...</div>
                    )}
                  </div>
                  <button
                    onClick={handleClipboard}
                    title="Paste from clipboard"
                    style={{ background: '#D4FF00', color: '#000', border: 'none', borderRadius: '8px', padding: '0 16px', fontWeight: 700, fontSize: '20px', cursor: 'pointer', flexShrink: 0 }}
                  >
                    📋
                  </button>
                </div>

                {/* NOMINATIM SUGGESTIONS DROPDOWN */}
                {showSuggestions && suggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 48,
                      background: colors.card,
                      border: '1px solid ' + colors.border,
                      borderRadius: '8px',
                      zIndex: 999,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                      overflow: 'hidden'
                    }}
                  >
                    {suggestions.map((s, i) => {
                      const addr = s.address;
                      const road = addr.road || addr.pedestrian || '';
                      const house = addr.house_number ? ' ' + addr.house_number : '';
                      const city = addr.city || addr.town || addr.village || '';
                      const postal = addr.postcode || '';
                      return (
                        <button
                          key={i}
                          onMouseDown={() => selectSuggestion(s)}
                          style={{
                            display: 'block',
                            width: '100%',
                            padding: '12px 16px',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: i < suggestions.length - 1 ? '1px solid ' + colors.border : 'none',
                            textAlign: 'left',
                            cursor: 'pointer',
                            color: colors.text
                          }}
                        >
                          <div style={{ fontWeight: 600, fontSize: '14px' }}>
                            {road}{house}
                          </div>
                          <div style={{ color: colors.textSecondary, fontSize: '12px' }}>
                            {postal}{postal && city ? ' ' : ''}{city}
                          </div>
                        </button>
                      );
                    })}
                    <div style={{ padding: '6px 16px', borderTop: '1px solid ' + colors.border, background: colors.bg }}>
                      <span style={{ color: '#444', fontSize: '10px' }}>Powered by OpenStreetMap — free, no API key</span>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ color: colors.textSecondary, fontSize: '11px', marginBottom: '10px' }}>
                Type to search · or 📋 to paste from clipboard · or fill fields below
              </div>
            </div>
          )}

          {/* MANUAL FIELDS */}
          {lbl('Street')}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', marginBottom: '8px' }}>
            {inp('street', 'Street name')}
            {inp('house', 'No.')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            {inp('apartment', 'Apt/Office (optional)')}
            {inp('postal', '00-000')}
          </div>
          {lbl('City')}
          <select
            value={fields.city}
            onChange={e => updateField('city', e.target.value)}
            style={{ width: '100%', padding: '13px 14px', background: colors.bg, border: '1px solid ' + colors.border, borderRadius: '8px', color: fields.city ? colors.text : colors.textSecondary, fontSize: '16px', marginBottom: '8px', WebkitAppearance: 'none' }}
          >
            <option value="">Select city...</option>
            {CITIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>

          {showContactFields && (
            <>
              {lbl('Contact')}
              <div style={{ marginBottom: '8px' }}>{inp('contactName', 'Full name')}</div>
              <div style={{ marginBottom: '8px' }}>{inp('contactPhone', '+48 XXX XXX XXX', 'tel')}</div>
              <div style={{ marginBottom: '8px' }}>{inp('accessCode', 'Gate code / access (optional)')}</div>
              <textarea
                placeholder="Special instructions (optional)"
                value={fields.instructions}
                onChange={e => updateField('instructions', e.target.value)}
                rows={2}
                style={{ width: '100%', padding: '13px 14px', background: colors.bg, border: '1px solid ' + colors.border, borderRadius: '8px', color: colors.text, fontSize: '15px', resize: 'none', boxSizing: 'border-box', outline: 'none' }}
              />
            </>
          )}

          {savedAddresses.length > 0 && (
            <button
              onClick={() => { setMode('saved'); setParsed(null); setSearchText(''); }}
              style={{ background: 'transparent', border: 'none', color: colors.textSecondary, fontSize: '13px', cursor: 'pointer', padding: '8px 0', textDecoration: 'underline', marginTop: '4px' }}
            >
              ← Back to saved addresses
            </button>
          )}
        </div>
      )}

      {/* MANUAL MODE (after selecting saved address) */}
      {mode === 'manual' && (
        <div style={{ marginBottom: '12px' }}>
          {parsed && (
            <div style={{ background: '#00C85318', border: '1px solid #00C853', borderRadius: '8px', padding: '10px 14px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ color: '#00C853', fontSize: '13px', fontWeight: 600 }}>
                ✅ {fields.street} {fields.house}{fields.apartment ? '/' + fields.apartment : ''}{fields.city ? ', ' + fields.city : ''}
              </div>
              <button onClick={() => { setParsed(null); setMode('search'); setSearchText(''); }} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '12px' }}>Change</button>
            </div>
          )}

          {lbl('Street')}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', marginBottom: '8px' }}>
            {inp('street', 'Street name')}
            {inp('house', 'No.')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            {inp('apartment', 'Apt/Office (optional)')}
            {inp('postal', '00-000')}
          </div>
          {lbl('City')}
          <select
            value={fields.city}
            onChange={e => updateField('city', e.target.value)}
            style={{ width: '100%', padding: '13px 14px', background: colors.bg, border: '1px solid ' + colors.border, borderRadius: '8px', color: fields.city ? colors.text : colors.textSecondary, fontSize: '16px', marginBottom: '8px', WebkitAppearance: 'none' }}
          >
            <option value="">Select city...</option>
            {CITIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>

          {showContactFields && (
            <>
              {lbl('Contact')}
              <div style={{ marginBottom: '8px' }}>{inp('contactName', 'Full name')}</div>
              <div style={{ marginBottom: '8px' }}>{inp('contactPhone', '+48 XXX XXX XXX', 'tel')}</div>
              <div style={{ marginBottom: '8px' }}>{inp('accessCode', 'Gate code / access (optional)')}</div>
              <textarea
                placeholder="Special instructions (optional)"
                value={fields.instructions}
                onChange={e => updateField('instructions', e.target.value)}
                rows={2}
                style={{ width: '100%', padding: '13px 14px', background: colors.bg, border: '1px solid ' + colors.border, borderRadius: '8px', color: colors.text, fontSize: '15px', resize: 'none', boxSizing: 'border-box', outline: 'none' }}
              />
            </>
          )}

          <button
            onClick={() => { setMode('search'); setParsed(null); setSearchText(''); }}
            style={{ background: 'transparent', border: 'none', color: colors.textSecondary, fontSize: '13px', cursor: 'pointer', padding: '8px 0', textDecoration: 'underline' }}
          >
            ← Search different address
          </button>
        </div>
      )}
    </div>
  );
}
