'use client'
import { useState, useRef, useEffect } from 'react'
import { searchAddresses } from '@/lib/addressSearch'
import { useApp } from '@/utils/appContext'
import { supabase } from '@/lib/supabase'

export default function AddressInput({
  label,
  placeholder,
  value: controlledValue,
  addressType = 'delivery',
  required = false,
  onChange,
  // legacy props — accepted silently
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
  const [savedAddresses, setSavedAddresses] = useState([])
  const debounceRef = useRef(null)

  // Sync controlled value from parent
  useEffect(() => {
    if (controlledValue !== undefined && controlledValue !== value) {
      setValue(controlledValue || '')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlledValue])

  // Load saved addresses on mount
  useEffect(() => {
    let cancelled = false
    const loadSaved = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || cancelled) return
        const { data } = await supabase
          .from('saved_addresses')
          .select('id, label, recipient_name, recipient_phone, street, house_number, postal_code, city, notes, delivery_count')
          .eq('client_id', user['id'])
          .order('delivery_count', { ascending: false, nullsFirst: false })
          .limit(20)
        if (!cancelled) setSavedAddresses(data || [])
      } catch {}
    }
    loadSaved()
    return () => { cancelled = true }
  }, [])

  const defaultPlaceholder = lang === 'pl'
    ? 'Zacznij pisać lub wklej adres...'
    : 'Start typing or paste address...'

  const getFilteredSaved = (query) => {
    if (!query || query.length < 2) return []
    const q = query.toLowerCase()
    return savedAddresses.filter(a =>
      a.street?.toLowerCase().includes(q) ||
      a.recipient_name?.toLowerCase().includes(q) ||
      a.label?.toLowerCase().includes(q) ||
      a.city?.toLowerCase().includes(q)
    ).slice(0, 3).map(a => {
      const addr = [a.street, a.house_number && a.house_number !== a.street ? a.house_number : null].filter(Boolean).join(' ')
      return {
        label:         a.recipient_name ? `${a.recipient_name} — ${addr}` : addr,
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
    })
  }

  const handleChange = (e) => {
    const val = e.target.value
    setValue(val)
    setSearched(false)
    clearTimeout(debounceRef.current)
    if (val.trim()) {
      onChange?.({ address: val.trim(), street: '', houseNumber: '', city: 'Szczecin', postcode: '', lat: null, lng: null })
    }
    if (!val || val.length < 2) {
      setSuggestions([])
      setLoading(false)
      setOpen(false)
      return
    }

    const matched = getFilteredSaved(val)
    if (matched.length > 0) {
      setSuggestions(matched)
      setOpen(true)
    }

    setLoading(true)
    setOpen(true)
    debounceRef.current = setTimeout(async () => {
      const apiResults = await searchAddresses(val, lang)
      setSuggestions([...getFilteredSaved(val), ...apiResults])
      setLoading(false)
      setSearched(true)
    }, 300)
  }

  const handleSelect = (s) => {
    const display = s.isSaved
      ? [s.street, s.houseNumber].filter(Boolean).join(' ') || s.label
      : [s.street, s.houseNumber].filter(Boolean).join(' ') || s.label
    setValue(display)
    setSuggestions([])
    setOpen(false)
    setSearched(false)
    const payload = {
      address:      display,
      street:       s.street || '',
      houseNumber:  s.houseNumber || '',
      city:         s.city || 'Szczecin',
      postcode:     s.postcode || '',
      lat:          s.lat,
      lng:          s.lng,
      ...(s.isSaved ? {
        autofillName:  s.recipientName  || null,
        autofillPhone: s.recipientPhone || null,
        autofillNotes: s.notes          || null,
      } : {}),
    }
    onChange?.(payload)
    onSelect?.(payload)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (suggestions.length > 0) handleSelect(suggestions[0])
    }
    if (e.key === 'Escape') {
      setSuggestions([])
      setOpen(false)
    }
  }

  const showDropdown = open && (suggestions.length > 0 || (searched && !loading && value.length >= 2))

  return (
    <div style={{ position: 'relative' }}>
      <style>{`@keyframes lgk-spin { to { transform: rotate(360deg) } }`}</style>

      {label && (
        <div style={{ color: '#D4FF00', fontWeight: 700, fontSize: '15px', marginBottom: '10px' }}>
          {label}{required && <span style={{ color: '#FF3B30', marginLeft: 2 }}>*</span>}
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <input
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { setFocused(true); if (suggestions.length > 0) setOpen(true) }}
          onBlur={() => { setFocused(false); setTimeout(() => setOpen(false), 150) }}
          placeholder={placeholder || defaultPlaceholder}
          autoComplete="off"
          style={{
            width: '100%',
            padding: '12px 38px 12px 14px',
            background: '#FAFAFA',
            border: `1px solid ${focused ? '#D4FF00' : '#E0E0E0'}`,
            borderRadius: '8px',
            color: '#0A0A0A',
            fontSize: '15px',
            boxSizing: 'border-box',
            outline: 'none',
            transition: 'border-color 150ms ease',
          }}
        />
        {loading && (
          <div style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            width: 16, height: 16,
            border: '2px solid #E0E0E0',
            borderTopColor: '#D4FF00',
            borderRadius: '50%',
            animation: 'lgk-spin 0.7s linear infinite',
            pointerEvents: 'none',
          }} />
        )}
      </div>

      {showDropdown && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: '#FFFFFF',
          border: '1px solid #E0E0E0',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          zIndex: 9999,
          overflow: 'hidden',
        }}>
          {suggestions.map((s, i) => (
            <SuggestionRow
              key={(s.savedId || s.label) + i}
              s={s}
              onSelect={handleSelect}
              isLast={i === suggestions.length - 1}
              lang={lang}
            />
          ))}
          {searched && !loading && suggestions.length === 0 && (
            <div style={{ padding: '12px 14px', fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' }}>
              {lang === 'pl' ? 'Brak wyników — wpisz pełny adres ręcznie' : 'No results — type the full address manually'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SuggestionRow({ s, onSelect, isLast, lang }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onSelect(s) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', width: '100%',
        padding: '10px 14px',
        background: hovered ? '#F5F5F5' : '#FFFFFF',
        border: 'none',
        borderBottom: isLast ? 'none' : '0.5px solid #F0F0F0',
        textAlign: 'left', cursor: 'pointer',
        transition: 'background 100ms ease',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <span style={{ flexShrink: 0, fontSize: 14 }}>{s.isSaved ? '⭐' : '📍'}</span>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{
          color: '#0A0A0A', fontSize: '13px', fontWeight: 500,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {s.label || [s.street, s.houseNumber].filter(Boolean).join(' ')}
        </div>
        {s.isSaved && s.recipientPhone && (
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{s.recipientPhone}</div>
        )}
      </div>
      {s.isSaved && (
        <span style={{ fontSize: 10, padding: '1px 6px', background: 'rgba(212,255,0,0.15)', color: '#5a6a00', borderRadius: 4, flexShrink: 0 }}>
          {lang === 'pl' ? 'Zapisany' : 'Saved'}
        </span>
      )}
    </button>
  )
}
