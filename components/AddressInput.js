'use client'
import { useState, useRef } from 'react'
import { searchAddresses } from '@/lib/addressSearch'
import { useApp } from '@/utils/appContext'

export default function AddressInput({
  label,
  placeholder,
  addressType = 'delivery',
  required = false,
  onChange,
  // legacy props — accepted silently
  clientId,
  showSaved,
  onReuseNote,
}) {
  const { lang } = useApp()
  const [value, setValue] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [searched, setSearched] = useState(false)
  const [focused, setFocused] = useState(false)
  const debounceRef = useRef(null)

  const defaultPlaceholder = lang === 'pl'
    ? 'Zacznij pisać lub wklej adres...'
    : 'Start typing or paste address...'

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
    setLoading(true)
    setOpen(true)
    debounceRef.current = setTimeout(async () => {
      const results = await searchAddresses(val, lang)
      setSuggestions(results)
      setLoading(false)
      setSearched(true)
    }, 300)
  }

  const handleSelect = (s) => {
    const display = [s.street, s.houseNumber].filter(Boolean).join(' ') || s.label
    setValue(display)
    setSuggestions([])
    setOpen(false)
    setSearched(false)
    onChange?.({
      address: display,
      street: s.street || '',
      houseNumber: s.houseNumber || '',
      city: s.city || 'Szczecin',
      postcode: s.postcode || '',
      lat: s.lat,
      lng: s.lng,
    })
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
              key={s.label + i}
              s={s}
              onSelect={handleSelect}
              isLast={i === suggestions.length - 1}
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

function SuggestionRow({ s, onSelect, isLast }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onSelect(s) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block', width: '100%',
        padding: '10px 14px',
        background: hovered ? '#F5F5F5' : '#FFFFFF',
        border: 'none',
        borderBottom: isLast ? 'none' : '0.5px solid #F0F0F0',
        textAlign: 'left', cursor: 'pointer',
        transition: 'background 100ms ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ flexShrink: 0, fontSize: 13, opacity: 0.45 }}>📍</span>
        <span style={{
          color: '#0A0A0A', fontSize: '13px', fontWeight: 500,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {s.label || [s.street, s.houseNumber].filter(Boolean).join(' ')}
        </span>
      </div>
    </button>
  )
}
