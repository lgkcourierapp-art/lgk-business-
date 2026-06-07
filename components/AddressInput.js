'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { searchAddresses } from '@/lib/addressSearch'
import { useApp } from '@/utils/appContext'

const ADDR_STRINGS = {
  pl: {
    loading: '…',
    searching: 'szukam…',
    use: 'Użyj →',
    otherPickup: 'Inny adres odbioru',
    otherDelivery: 'Inny adres dostawy',
    hint: 'Pisz aby szukać lub wklej pełny adres (Ctrl+V / ⌘V)',
    savedAddresses: '← Zapisane adresy',
    change: 'Zmień',
    orders1: 'zamówienie',
    orders2_4: 'zamówienia',
    orders5: 'zamówień',
    total: 'łącznie',
    lastOrder: 'Ostatnie zamówienie:',
    prevNote: 'Poprzednia notatka:',
    useNote: 'Użyj ↑',
    deliveredBefore: 'Dostarczyłeś tu już wcześniej.',
    savePermanent: 'Zapisać jako stały odbiorca?',
    saveLabelPlaceholder: 'Np. "Jan Kowalski", "Restaurant Morska"',
    save: 'Zapisz',
    notNow: 'Nie teraz',
    never: 'Nigdy',
    vip: 'VIP',
    regularLong: 'Stały klient',
    loyalLong: 'Wierny klient',
  },
  en: {
    loading: '…',
    searching: 'searching…',
    use: 'Use →',
    otherPickup: 'Different pickup address',
    otherDelivery: 'Different delivery address',
    hint: 'Type to search or paste full address (Ctrl+V / ⌘V)',
    savedAddresses: '← Saved addresses',
    change: 'Change',
    orders1: 'order',
    orders2_4: 'orders',
    orders5: 'orders',
    total: 'total',
    lastOrder: 'Last order:',
    prevNote: 'Previous note:',
    useNote: 'Use ↑',
    deliveredBefore: 'You have delivered here before.',
    savePermanent: 'Save as a regular recipient?',
    saveLabelPlaceholder: '"Jan Kowalski" or "Restaurant Marina"',
    save: 'Save',
    notNow: 'Not now',
    never: 'Never',
    vip: 'VIP',
    regularLong: 'Regular',
    loyalLong: 'Loyal',
  },
}

const parsePolishAddress = (raw) => {
  if (!raw || raw.length < 5) return null
  let s = raw.trim().replace(/^(ul\.|al\.|pl\.|os\.|sk\.|rondo\s)/i, '').trim()
  const postcodeMatch = s.match(/\b(\d{2}-\d{3})\b/)
  const postcode = postcodeMatch ? postcodeMatch[1] : ''
  if (postcode) s = s.replace(postcode, '').trim().replace(/,\s*$/, '').trim()
  const parts = s.split(',')
  let city = ''
  let addressPart = s
  if (parts.length > 1) {
    city = parts[parts.length - 1].trim()
    addressPart = parts.slice(0, -1).join(',').trim()
  }
  const numberMatch = addressPart.match(/(\d+[a-zA-Z]?)(?:\s*[\/m.]?\s*(\d+[a-zA-Z]?))?$/)
  const houseNumber = numberMatch ? numberMatch[1] : ''
  const street = numberMatch
    ? addressPart.replace(numberMatch[0], '').trim().replace(/,\s*$/, '').trim()
    : addressPart
  if (!street) return null
  return { street, houseNumber, postcode, city }
}

const hashAddress = (addr) =>
  'lgk_addr_' + (addr || '')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .substring(0, 40)

export default function AddressInput({
  label,
  placeholder,
  addressType = 'delivery',
  clientId,
  showSaved = true,
  required = false,
  onChange,
  onReuseNote,
}) {
  const { lang } = useApp()
  const a = ADDR_STRINGS[lang === 'pl' ? 'pl' : 'en']
  const defaultPlaceholder = lang === 'pl' ? 'Zacznij pisać lub wklej adres...' : 'Start typing or paste address...'

  const [savedAddresses, setSavedAddresses] = useState([])
  const [mode, setMode] = useState('loading')
  const [selected, setSelected] = useState(null)
  const [searchText, setSearchText] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [showSavePrompt, setShowSavePrompt] = useState(false)
  const [saveLabel, setSaveLabel] = useState('')
  const [savingAddress, setSavingAddress] = useState(false)
  const [currentHash, setCurrentHash] = useState('')
  const [customerInfo, setCustomerInfo] = useState(null)
  const debounceRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!clientId || !showSaved) { setMode('search'); return }
    supabase
      .from('saved_addresses')
      .select('*')
      .eq('client_id', clientId)
      .order('use_count', { ascending: false })
      .then(({ data }) => {
        const all = data || []
        const filtered = addressType === 'pickup'
          ? all.filter(a => a.address_type !== 'delivery')
          : all.filter(a => a.address_type !== 'pickup')
        setSavedAddresses(filtered)
        setMode(filtered.length > 0 ? 'saved' : 'search')
      })
  }, [clientId, showSaved, addressType])

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setSuggestions([])
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearchChange = (e) => {
    const val = e.target.value
    setSearchText(val)
    clearTimeout(debounceRef.current)
    if (!val || val.length < 3) { setSuggestions([]); setLoadingSuggestions(false); return }
    setLoadingSuggestions(true)
    debounceRef.current = setTimeout(async () => {
      const results = await searchAddresses(val, lang)
      setSuggestions(results)
      setLoadingSuggestions(false)
    }, 300)
  }

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text')
    const parsed = parsePolishAddress(text)
    if (parsed) {
      e.preventDefault()
      const addressStr = [parsed.street, parsed.houseNumber].filter(Boolean).join(' ')
      selectAddress({ address: addressStr, city: parsed.city || 'Szczecin', postcode: parsed.postcode || '', lat: null, lng: null }, true)
    }
  }

  const selectAddress = (addr, checkThresh = false) => {
    setSelected(addr)
    setSuggestions([])
    setSearchText('')
    setMode('selected')
    setCustomerInfo(null)
    onChange?.(addr)
    if (checkThresh) checkThreshold(addr.address)
  }

  const checkThreshold = (addressStr) => {
    const hash = hashAddress(addressStr)
    setCurrentHash(hash)
    try {
      if (localStorage.getItem('lgk_addr_never_' + hash)) return
      const stored = localStorage.getItem(hash)
      const data = stored ? JSON.parse(stored) : { count: 0 }
      data.count = (data.count || 0) + 1
      data.address = addressStr
      localStorage.setItem(hash, JSON.stringify(data))
      if (data.count >= 2) { setSaveLabel(''); setShowSavePrompt(true) }
    } catch {}
  }

  const handleSelectSuggestion = (s) => {
    const addressStr = [s.street, s.houseNumber].filter(Boolean).join(' ')
    selectAddress({ address: addressStr, city: s.city || 'Szczecin', postcode: s.postcode || '', lat: s.lat, lng: s.lng }, true)
  }

  const handleSelectSaved = async (addr) => {
    const addressStr = [addr.street, addr.house_number].filter(Boolean).join(' ')
    const addrObj = {
      address: addressStr,
      city: addr.city || 'Szczecin',
      postcode: addr.postal_code || '',
      lat: addr.lat || null,
      lng: addr.lng || null,
      savedAddressId: addr['id'],
    }
    selectAddress(addrObj, false)

    supabase.from('saved_addresses')
      .update({ use_count: (addr.use_count || 0) + 1 })
      .eq('id', addr['id'])
      .then(() => {})

    if (!clientId || !addressStr) return
    const { data: history } = await supabase
      .from('deliveries')
      .select('id, created_at, amount_pln, courier_note, status')
      .eq('client_id', clientId)
      .ilike('delivery_address', '%' + addressStr + '%')
      .order('created_at', { ascending: false })
      .limit(10)

    if (!history || history.length < 2) return
    const orderCount = history.length
    const totalValue = history.reduce((s, d) => s + (d.amount_pln || 0), 0)
    const lastOrder = history[0]?.created_at
    const lastNote = history[0]?.courier_note || ''
    const badge = orderCount >= 11 ? a.vip
      : orderCount >= 6 ? a.loyalLong
      : orderCount >= 3 ? a.regularLong
      : null
    setCustomerInfo({ orderCount, totalValue, lastOrder, lastNote, badge })
  }

  const handleSave = async () => {
    if (!saveLabel.trim() || !clientId || !selected) return
    setSavingAddress(true)
    try {
      await supabase.from('saved_addresses').insert({
        client_id: clientId,
        label: saveLabel.trim(),
        address_type: addressType,
        street: selected.address,
        house_number: '',
        city: selected.city || 'Szczecin',
        postal_code: selected.postcode || '',
        use_count: 1,
        is_default_pickup: false,
      })
      setSaveLabel('')
      setShowSavePrompt(false)
      const { data } = await supabase.from('saved_addresses').select('*')
        .eq('client_id', clientId).order('use_count', { ascending: false })
      const all = data || []
      const filtered = addressType === 'pickup'
        ? all.filter(x => x.address_type !== 'delivery')
        : all.filter(x => x.address_type !== 'pickup')
      setSavedAddresses(filtered)
    } catch (err) {
      console.error('Save address error:', err)
    } finally {
      setSavingAddress(false)
    }
  }

  const reset = () => {
    setSelected(null)
    setCustomerInfo(null)
    setShowSavePrompt(false)
    setSearchText('')
    setSuggestions([])
    setMode(savedAddresses.length > 0 ? 'saved' : 'search')
    onChange?.(null)
  }

  const orderCountLabel = (n) => {
    if (lang !== 'pl') return n + ' ' + (n === 1 ? a.orders1 : a.orders2_4)
    if (n === 1) return n + ' ' + a.orders1
    if (n >= 2 && n <= 4) return n + ' ' + a.orders2_4
    return n + ' ' + a.orders5
  }

  const inputBase = {
    width: '100%', padding: '12px 14px',
    background: 'var(--color-background-primary, #FAFAFA)',
    border: '0.5px solid var(--color-border-tertiary, #E0E0E0)',
    borderRadius: '8px',
    color: 'var(--color-text-primary, #0A0A0A)',
    fontSize: '15px', boxSizing: 'border-box', outline: 'none',
  }

  return (
    <div ref={containerRef}>
      <div style={{ color: '#D4FF00', fontWeight: 700, fontSize: '15px', marginBottom: '10px' }}>
        {label}{required && <span style={{ color: '#FF3B30', marginLeft: 2 }}>*</span>}
      </div>

      {mode === 'loading' && (
        <div style={{ color: 'var(--color-text-tertiary)', fontSize: 13, padding: '8px 0', opacity: 0.6 }}>{a.loading}</div>
      )}

      {mode === 'saved' && (
        <div>
          {savedAddresses.slice(0, 5).map(addr => (
            <button
              key={addr['id']}
              onClick={() => handleSelectSaved(addr)}
              style={{
                width: '100%',
                background: addr.is_default_pickup ? 'rgba(212,255,0,0.08)' : 'var(--color-background-secondary, #F5F5F5)',
                border: '0.5px solid ' + (addr.is_default_pickup ? 'rgba(212,255,0,0.3)' : 'var(--color-border-tertiary, #E0E0E0)'),
                borderRadius: '10px', padding: '12px 14px', marginBottom: '8px',
                cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px',
              }}
            >
              <span style={{ fontSize: '18px', flexShrink: 0 }}>{addr.is_default_pickup ? '⭐' : '📍'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'var(--color-text-primary)', fontWeight: 600, fontSize: '13px' }}>{addr.label}</div>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {addr.street} {addr.house_number}{addr.apartment ? '/' + addr.apartment : ''}, {addr.city}
                </div>
              </div>
              <span style={{ color: '#D4FF00', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>{a.use}</span>
            </button>
          ))}
          <button
            onClick={() => setMode('search')}
            style={{
              background: 'transparent', border: '0.5px dashed var(--color-border-tertiary, #E0E0E0)',
              borderRadius: '10px', padding: '12px 14px', width: '100%',
              color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '13px', textAlign: 'left',
            }}
          >
            ✏️ {addressType === 'pickup' ? a.otherPickup : a.otherDelivery}
          </button>
        </div>
      )}

      {mode === 'search' && (
        <div>
          <div style={{ position: 'relative' }}>
            <input
              value={searchText}
              onChange={handleSearchChange}
              onPaste={handlePaste}
              placeholder={placeholder || defaultPlaceholder}
              autoComplete="off"
              style={inputBase}
            />
            {loadingSuggestions && (
              <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#D4FF00', fontSize: 11 }}>
                {a.searching}
              </div>
            )}
            {suggestions.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                background: 'var(--color-background-secondary, #F5F5F5)',
                border: '0.5px solid var(--color-border-tertiary, #E0E0E0)',
                borderRadius: '8px', zIndex: 999, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', overflow: 'hidden',
              }}>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onMouseDown={() => handleSelectSuggestion(s)}
                    style={{
                      display: 'block', width: '100%', padding: '10px 14px',
                      background: 'transparent', border: 'none',
                      borderBottom: i < suggestions.length - 1 ? '0.5px solid var(--color-border-tertiary, #E0E0E0)' : 'none',
                      textAlign: 'left', cursor: 'pointer',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{s.street} {s.houseNumber}</div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '11px' }}>{s.postcode} {s.city}</div>
                  </button>
                ))}
                <div style={{ padding: '5px 14px', background: 'var(--color-background-primary)', borderTop: '0.5px solid var(--color-border-tertiary, #E0E0E0)' }}>
                  <span style={{ color: 'var(--color-text-tertiary)', fontSize: '10px' }}>HERE Maps · Photon fallback</span>
                </div>
              </div>
            )}
          </div>
          <div style={{ color: 'var(--color-text-tertiary, #9CA3AF)', fontSize: '11px', marginTop: '6px' }}>
            {a.hint}
          </div>
          {savedAddresses.length > 0 && (
            <button
              onClick={() => setMode('saved')}
              style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', fontSize: '12px', cursor: 'pointer', padding: '6px 0', textDecoration: 'underline' }}
            >
              {a.savedAddresses}
            </button>
          )}
        </div>
      )}

      {mode === 'selected' && selected && (
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 14px',
            background: 'rgba(212,255,0,0.06)',
            border: '0.5px solid rgba(212,255,0,0.2)',
            borderRadius: '10px', marginBottom: '6px',
          }}>
            <span style={{ fontSize: '16px' }}>📍</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: 'var(--color-text-primary)', fontWeight: 600, fontSize: '13px' }}>{selected.address}</div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                {selected.postcode ? selected.postcode + ' ' : ''}{selected.city}
              </div>
            </div>
            <button
              onClick={reset}
              style={{ background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', fontSize: '12px', cursor: 'pointer', flexShrink: 0 }}
            >
              {a.change}
            </button>
          </div>

          {customerInfo && customerInfo.orderCount >= 2 && (
            <div style={{
              background: 'rgba(212,255,0,0.04)',
              border: '0.5px solid rgba(212,255,0,0.15)',
              borderRadius: '8px', padding: '10px 12px', marginTop: '6px',
              display: 'flex', flexDirection: 'column', gap: '4px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {customerInfo.badge && (
                  <span style={{
                    fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px',
                    background: customerInfo.badge === a.vip ? '#D4FF00' : 'rgba(212,255,0,0.15)',
                    color: customerInfo.badge === a.vip ? '#0A0A0A' : '#D4FF00',
                    letterSpacing: '.3px',
                  }}>
                    {customerInfo.badge}
                  </span>
                )}
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  {orderCountLabel(customerInfo.orderCount)}
                  {customerInfo.totalValue > 0 && ` · PLN ${customerInfo.totalValue.toFixed(0)} ${a.total}`}
                </span>
              </div>

              {customerInfo.lastOrder && (
                <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                  {a.lastOrder} {new Date(customerInfo.lastOrder).toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-GB')}
                </span>
              )}

              {customerInfo.lastNote && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                  <span style={{
                    fontSize: '11px', color: 'var(--color-text-tertiary)',
                    flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {a.prevNote} &quot;{customerInfo.lastNote}&quot;
                  </span>
                  <button
                    onClick={() => onReuseNote?.(customerInfo.lastNote)}
                    style={{ fontSize: '10px', fontWeight: '600', color: '#D4FF00', background: 'transparent', border: 'none', cursor: 'pointer', flexShrink: 0, padding: '2px 6px' }}
                  >
                    {a.useNote}
                  </button>
                </div>
              )}
            </div>
          )}

          {showSavePrompt && (
            <div style={{
              marginTop: '10px',
              background: 'var(--color-background-secondary)',
              border: '0.5px solid var(--color-border-tertiary)',
              borderRadius: '8px', padding: '12px 14px',
            }}>
              <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-text-primary)', margin: '0 0 4px' }}>
                {a.deliveredBefore}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 0 10px' }}>
                {a.savePermanent}
              </p>

              <input
                type="text"
                value={saveLabel}
                onChange={e => setSaveLabel(e.target.value)}
                placeholder={a.saveLabelPlaceholder}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: '6px',
                  border: '0.5px solid var(--color-border-tertiary)',
                  background: 'var(--color-background-primary)',
                  color: 'var(--color-text-primary)',
                  fontSize: '12px', outline: 'none', boxSizing: 'border-box', marginBottom: '8px',
                }}
              />

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleSave}
                  disabled={!saveLabel.trim() || savingAddress}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '6px', border: 'none',
                    background: saveLabel.trim() ? '#D4FF00' : 'var(--color-border-tertiary)',
                    color: saveLabel.trim() ? '#0A0A0A' : 'var(--color-text-tertiary)',
                    fontSize: '12px', fontWeight: '600',
                    cursor: saveLabel.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  {savingAddress ? '...' : a.save}
                </button>
                <button
                  onClick={() => setShowSavePrompt(false)}
                  style={{
                    padding: '8px 12px', borderRadius: '6px',
                    border: '0.5px solid var(--color-border-tertiary)',
                    background: 'transparent', color: 'var(--color-text-secondary)',
                    fontSize: '12px', cursor: 'pointer',
                  }}
                >
                  {a.notNow}
                </button>
                <button
                  onClick={() => {
                    try { localStorage.setItem('lgk_addr_never_' + currentHash, 'true') } catch {}
                    setShowSavePrompt(false)
                  }}
                  style={{
                    padding: '8px 12px', borderRadius: '6px', border: 'none',
                    background: 'transparent', color: 'var(--color-text-tertiary)',
                    fontSize: '11px', cursor: 'pointer',
                  }}
                >
                  {a.never}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
