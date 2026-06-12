'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { searchAddresses } from '@/lib/addressSearch'
import { useApp } from '@/utils/appContext'
import { supabase } from '@/lib/supabase'

const STYLES = `
  @keyframes lgk-spin { to { transform: rotate(360deg) } }
  @keyframes lgk-dropdown { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }
`

function Highlight({ text, query }) {
  if (!query || !text) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ background: 'rgba(212,255,0,0.45)', borderRadius: 2, padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  )
}

function toSavedSuggestion(a) {
  const street = [a.street, a.house_number && a.house_number !== a.street ? a.house_number : null].filter(Boolean).join(' ')
  return {
    label:         street,
    street:        a.street || '',
    houseNumber:   a.house_number || '',
    postcode:      a.postal_code || '',
    city:          a.city || 'Szczecin',
    lat:           a.lat ?? null,
    lng:           a.lng ?? null,
    isSaved:       true,
    savedId:       a['id'],
    recipientName:  a.recipient_name || null,
    recipientPhone: a.recipient_phone || null,
    notes:         a.notes || null,
  }
}

export default function AddressInput({
  label,
  placeholder,
  value: controlledValue,
  addressType = 'delivery',
  required = false,
  onChange,
  clientId,
  showSaved,
  onReuseNote,
  onSelect,
}) {
  const { lang } = useApp()
  const [value, setValue] = useState(controlledValue || '')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [searched, setSearched] = useState(false)
  const [focused, setFocused] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [savedAddresses, setSavedAddresses] = useState([])
  const debounceRef = useRef(null)

  useEffect(() => {
    if (controlledValue !== undefined && controlledValue !== value) {
      setValue(controlledValue || '')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlledValue])

  useEffect(() => {
    let cancelled = false
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || cancelled) return
      supabase
        .from('saved_addresses')
        .select('id, label, recipient_name, recipient_phone, street, house_number, postal_code, city, notes, delivery_count')
        .eq('client_id', user['id'])
        .order('delivery_count', { ascending: false, nullsFirst: false })
        .limit(20)
        .then(({ data }) => { if (!cancelled) setSavedAddresses(data || []) })
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  const getFilteredSaved = useCallback((query) => {
    const list = query && query.length >= 1
      ? savedAddresses.filter(a => {
          const q = query.toLowerCase()
          return a.street?.toLowerCase().includes(q) ||
                 a.recipient_name?.toLowerCase().includes(q) ||
                 a.city?.toLowerCase().includes(q)
        })
      : savedAddresses
    return list.slice(0, 3).map(toSavedSuggestion)
  }, [savedAddresses])

  const handleFocus = () => {
    setFocused(true)
    if (value.length >= 2 && suggestions.length > 0) { setOpen(true); return }
    // Show recent saved on focus before typing
    const recent = getFilteredSaved('')
    if (recent.length > 0) { setSuggestions(recent); setOpen(true) }
  }

  const handleChange = (e) => {
    const val = e.target.value
    setValue(val)
    setSearched(false)
    setActiveIndex(-1)
    clearTimeout(debounceRef.current)
    if (val.trim()) {
      onChange?.({ address: val.trim(), street: '', houseNumber: '', city: 'Szczecin', postcode: '', lat: null, lng: null })
    }
    if (!val) { setSuggestions([]); setLoading(false); setOpen(false); return }

    // Always show saved matches immediately
    const saved = getFilteredSaved(val)
    setSuggestions(saved)
    if (saved.length > 0) setOpen(true)

    if (val.length < 2) return

    setLoading(true)
    setOpen(true)
    debounceRef.current = setTimeout(async () => {
      const apiResults = await searchAddresses(val, lang)
      setSuggestions([...getFilteredSaved(val), ...apiResults])
      setLoading(false)
      setSearched(true)
    }, 150)
  }

  const handleSelect = (s) => {
    const display = [s.street, s.houseNumber].filter(Boolean).join(' ') || s.label || ''
    setValue(display)
    setSuggestions([])
    setOpen(false)
    setSearched(false)
    setActiveIndex(-1)
    onChange?.({
      address:      display,
      street:       s.street || '',
      houseNumber:  s.houseNumber || '',
      city:         s.city || 'Szczecin',
      postcode:     s.postcode || '',
      lat:          s.lat ?? null,
      lng:          s.lng ?? null,
      ...(s.isSaved ? {
        autofillName:  s.recipientName  || null,
        autofillPhone: s.recipientPhone || null,
        autofillNotes: s.notes          || null,
      } : {}),
    })
    onSelect?.({ address: display, street: s.street, city: s.city, lat: s.lat, lng: s.lng })
  }

  const handleKeyDown = (e) => {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const idx = activeIndex >= 0 ? activeIndex : 0
      if (suggestions[idx]) handleSelect(suggestions[idx])
    } else if (e.key === 'Escape') {
      setSuggestions([])
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  const showDropdown = open && (suggestions.length > 0 || (searched && !loading))
  const ph = placeholder || (lang === 'pl' ? 'Szukaj adresu w Szczecinie...' : 'Search address in Szczecin...')

  return (
    <div style={{ position: 'relative' }}>
      <style>{STYLES}</style>

      {label && (
        <div style={{ color: '#374151', fontWeight: 700, fontSize: 15, marginBottom: 10 }}>
          {label}{required && <span style={{ color: '#FF3B30', marginLeft: 2 }}>*</span>}
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <input
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={() => { setFocused(false); setTimeout(() => { setOpen(false); setActiveIndex(-1) }, 160) }}
          placeholder={ph}
          autoComplete="off"
          style={{
            width: '100%',
            padding: '12px 40px 12px 14px',
            background: '#FAFAFA',
            border: `1.5px solid ${focused ? '#D4FF00' : '#E0E0E0'}`,
            borderRadius: 10,
            color: '#0A0A0A',
            fontSize: 15,
            boxSizing: 'border-box',
            outline: 'none',
            transition: 'border-color 150ms ease',
          }}
        />
        {loading ? (
          <div style={{
            position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)',
            width: 16, height: 16,
            border: '2px solid #E0E0E0', borderTopColor: '#D4FF00',
            borderRadius: '50%', animation: 'lgk-spin 0.7s linear infinite',
            pointerEvents: 'none',
          }} />
        ) : (
          <svg style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.35 }}
            width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth={2.5}>
            <circle cx={11} cy={11} r={7} /><line x1={16.5} y1={16.5} x2={22} y2={22} />
          </svg>
        )}
      </div>

      {showDropdown && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: '#FFFFFF',
          border: '1.5px solid #E8E8E8',
          borderRadius: 12,
          boxShadow: '0 12px 32px rgba(0,0,0,0.14)',
          zIndex: 9999,
          overflow: 'hidden',
          animation: 'lgk-dropdown 140ms ease',
        }}>
          {suggestions.map((s, i) => (
            <SuggestionRow
              key={(s.savedId || s.label + s.lat) + i}
              s={s}
              query={value}
              active={i === activeIndex}
              onSelect={handleSelect}
              isLast={i === suggestions.length - 1}
              lang={lang}
            />
          ))}
          {searched && !loading && suggestions.length === 0 && (
            <div style={{ padding: '16px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>🔍</span>
              <div>
                <div style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>
                  {lang === 'pl' ? 'Brak wyników' : 'No results'}
                </div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                  {lang === 'pl' ? 'Spróbuj skrócić zapytanie lub wpisz sam adres' : 'Try a shorter query or type the address manually'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SuggestionRow({ s, query, active, onSelect, isLast, lang }) {
  const streetLine = [s.street, s.houseNumber].filter(Boolean).join(' ')
  const cityLine   = [s.postcode, s.city].filter(Boolean).join(' ')

  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onSelect(s) }}
      style={{
        display: 'flex', width: '100%',
        padding: '11px 14px',
        background: active ? '#F9FFD6' : '#FFFFFF',
        border: 'none',
        borderBottom: isLast ? 'none' : '1px solid #F3F4F6',
        textAlign: 'left', cursor: 'pointer',
        transition: 'background 80ms ease',
        alignItems: 'flex-start',
        gap: 10,
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#F5F5F5' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = '#FFFFFF' }}
    >
      <span style={{ flexShrink: 0, fontSize: 16, marginTop: 1, opacity: s.isSaved ? 1 : 0.6 }}>
        {s.isSaved ? '⭐' : '📍'}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {s.isSaved && s.recipientName && (
          <div style={{ fontSize: 11, fontWeight: 700, color: '#D4A000', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
            {s.recipientName}{s.recipientPhone ? ` · ${s.recipientPhone}` : ''}
          </div>
        )}
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A', lineHeight: 1.3 }}>
          <Highlight text={streetLine || s.label} query={query} />
        </div>
        {cityLine && (
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2, lineHeight: 1.3 }}>
            <Highlight text={cityLine} query={query} />
          </div>
        )}
      </div>
      {s.isSaved && (
        <span style={{ fontSize: 10, padding: '2px 7px', background: 'rgba(212,255,0,0.18)', color: '#5a6a00', borderRadius: 20, flexShrink: 0, marginTop: 2, fontWeight: 700 }}>
          {lang === 'pl' ? 'Zapisany' : 'Saved'}
        </span>
      )}
    </button>
  )
}
