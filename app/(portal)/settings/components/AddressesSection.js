'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/utils/appContext'
import AddressInput from '@/components/AddressInput'

const STRINGS = {
  en: {
    title: 'Addresses',
    pickupTitle: 'Pickup Address',
    pickupDesc: 'Default pickup point pre-filled on every new order.',
    pickupContact: 'Contact name',
    pickupPhone: 'Contact phone',
    registeredTitle: 'Registered Business Address',
    registeredDesc: 'Your company\'s registered address for invoicing.',
    correspondenceTitle: 'Correspondence Address',
    correspondenceDesc: 'Where we send letters and documents.',
    sameAsRegistered: 'Same as registered address',
    addressPlaceholder: 'e.g. ul. Wały Chrobrego 1, 70-500 Szczecin',
    save: 'Save', saving: 'Saving...', saved: 'Saved ✓',
    edit: 'Edit', currentAddress: 'Current address',
    noAddress: 'Not set',
  },
  pl: {
    title: 'Adresy',
    pickupTitle: 'Adres odbioru',
    pickupDesc: 'Domyślny punkt odbioru — wypełnia się automatycznie przy każdym nowym zleceniu.',
    pickupContact: 'Imię i nazwisko kontaktu',
    pickupPhone: 'Telefon kontaktowy',
    registeredTitle: 'Adres siedziby',
    registeredDesc: 'Adres rejestrowy firmy do fakturowania.',
    correspondenceTitle: 'Adres korespondencyjny',
    correspondenceDesc: 'Adres do wysyłki listów i dokumentów.',
    sameAsRegistered: 'Taki sam jak adres siedziby',
    addressPlaceholder: 'np. ul. Wały Chrobrego 1, 70-500 Szczecin',
    save: 'Zapisz', saving: 'Zapisywanie...', saved: 'Zapisano ✓',
    edit: 'Zmień', currentAddress: 'Aktualny adres',
    noAddress: 'Nie ustawiono',
  },
}

function SaveButton({ saving, saved, onClick, s }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      style={{
        background: saved ? '#00C853' : '#D4FF00',
        color: '#000',
        border: 'none',
        borderRadius: 8,
        padding: '9px 20px',
        fontSize: 13,
        fontWeight: 700,
        cursor: saving ? 'not-allowed' : 'pointer',
        opacity: saving ? 0.7 : 1,
        marginTop: 12,
      }}
    >
      {saving ? s.saving : saved ? s.saved : s.save}
    </button>
  )
}

export default function AddressesSection({ user }) {
  const { colors, lang } = useApp()
  const s = STRINGS[lang] || STRINGS.en

  // pickup
  const [pickupAddress, setPickupAddress] = useState('')
  const [pickupLat, setPickupLat] = useState(null)
  const [pickupLng, setPickupLng] = useState(null)
  const [pickupContactName, setPickupContactName] = useState('')
  const [pickupContactPhone, setPickupContactPhone] = useState('')
  const [editingPickup, setEditingPickup] = useState(false)
  const [savingPickup, setSavingPickup] = useState(false)
  const [savedPickup, setSavedPickup] = useState(false)
  const [errorPickup, setErrorPickup] = useState('')

  // registered
  const [registeredAddress, setRegisteredAddress] = useState('')
  const [savingRegistered, setSavingRegistered] = useState(false)
  const [savedRegistered, setSavedRegistered] = useState(false)
  const [errorRegistered, setErrorRegistered] = useState('')

  // correspondence
  const [correspondenceAddress, setCorrespondenceAddress] = useState('')
  const [correspondenceSame, setCorrespondenceSame] = useState(false)
  const [savingCorrespondence, setSavingCorrespondence] = useState(false)
  const [savedCorrespondence, setSavedCorrespondence] = useState(false)
  const [errorCorrespondence, setErrorCorrespondence] = useState('')

  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('pickup_address, pickup_lat, pickup_lng, pickup_contact_name, pickup_contact_phone, registered_address, correspondence_address, correspondence_same_as_registered')
      .eq('id', user['id'])
      .single()
      .then(({ data }) => {
        if (!data) return
        setPickupAddress(data.pickup_address || '')
        setPickupLat(data.pickup_lat || null)
        setPickupLng(data.pickup_lng || null)
        setPickupContactName(data.pickup_contact_name || '')
        setPickupContactPhone(data.pickup_contact_phone || '')
        setRegisteredAddress(data.registered_address || '')
        setCorrespondenceAddress(data.correspondence_address || '')
        setCorrespondenceSame(data.correspondence_same_as_registered ?? false)
      })
  }, [user])

  const savePickup = async () => {
    if (!user) return
    if (pickupAddress && (!pickupLat || !pickupLng)) {
      setErrorPickup(lang === 'pl'
        ? 'Wybierz adres z listy podpowiedzi — wpisany ręcznie adres nie ma współrzędnych GPS.'
        : 'Select an address from the suggestions list — a manually typed address has no GPS coordinates.')
      return
    }
    setSavingPickup(true)
    setErrorPickup('')
    try {
      const { error } = await supabase.from('profiles').update({
        pickup_address: pickupAddress,
        pickup_lat: pickupLat,
        pickup_lng: pickupLng,
        pickup_contact_name: pickupContactName,
        pickup_contact_phone: pickupContactPhone,
        updated_at: new Date().toISOString(),
      }).eq('id', user['id'])
      if (error) throw error
      window.dispatchEvent(new Event('lgk-profile-updated'))
      setSavedPickup(true)
      setEditingPickup(false)
      setTimeout(() => setSavedPickup(false), 3000)
    } catch (err) {
      setErrorPickup(err.message || 'Save failed')
    } finally {
      setSavingPickup(false)
    }
  }

  const saveRegistered = async () => {
    if (!user) return
    setSavingRegistered(true)
    setErrorRegistered('')
    try {
      const { error } = await supabase.from('profiles').update({
        registered_address: registeredAddress,
        updated_at: new Date().toISOString(),
      }).eq('id', user['id'])
      if (error) throw error
      setSavedRegistered(true)
      setTimeout(() => setSavedRegistered(false), 3000)
    } catch (err) {
      setErrorRegistered(err.message || 'Save failed')
    } finally {
      setSavingRegistered(false)
    }
  }

  const saveCorrespondence = async () => {
    if (!user) return
    setSavingCorrespondence(true)
    setErrorCorrespondence('')
    try {
      const { error } = await supabase.from('profiles').update({
        correspondence_address: correspondenceSame ? registeredAddress : correspondenceAddress,
        correspondence_same_as_registered: correspondenceSame,
        updated_at: new Date().toISOString(),
      }).eq('id', user['id'])
      if (error) throw error
      setSavedCorrespondence(true)
      setTimeout(() => setSavedCorrespondence(false), 3000)
    } catch (err) {
      setErrorCorrespondence(err.message || 'Save failed')
    } finally {
      setSavingCorrespondence(false)
    }
  }

  const card = { background: colors.card, border: '1px solid ' + colors.border, borderRadius: 12, padding: 24, marginBottom: 16 }
  const sectionLabel = { color: '#374151', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }
  const subLabel = { color: colors.text, fontWeight: 700, fontSize: 14, marginBottom: 4 }
  const desc = { color: colors.textSecondary, fontSize: 12, marginBottom: 12 }
  const input = {
    width: '100%', boxSizing: 'border-box',
    background: colors.bg, border: '1px solid ' + colors.border,
    borderRadius: 8, padding: '9px 12px', fontSize: 14, color: colors.text,
    fontFamily: 'inherit', outline: 'none',
  }
  const readonlyChip = {
    background: colors.bg, border: '1px solid ' + colors.border,
    borderRadius: 8, padding: '10px 14px', fontSize: 14,
    color: pickupAddress ? colors.text : colors.textSecondary,
    marginBottom: 4,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
  }

  return (
    <div style={card}>
      <div style={sectionLabel}>{s.title}</div>

      {/* ── Adres odbioru ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={subLabel}>{s.pickupTitle}</div>
        <div style={{ ...desc, marginBottom: editingPickup ? 12 : 8 }}>{s.pickupDesc}</div>

        {!editingPickup ? (
          <div style={readonlyChip}>
            <span>{pickupAddress || s.noAddress}</span>
            <button
              onClick={() => setEditingPickup(true)}
              style={{ background: 'none', border: '1px solid ' + colors.border, borderRadius: 6, padding: '4px 10px', fontSize: 12, color: colors.textSecondary, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
            >
              {s.edit}
            </button>
          </div>
        ) : (
          <div style={{ marginBottom: 8 }}>
            <AddressInput
              label=""
              placeholder={lang === 'pl' ? 'Wpisz adres odbioru...' : 'Type pickup address...'}
              addressType="pickup"
              showSaved={false}
              onChange={(addr) => {
                const formatted = [
                  addr.street,
                  addr.houseNumber,
                  addr.apartment ? '/' + addr.apartment : '',
                  addr.postcode ? ', ' + addr.postcode : '',
                  addr.city ? ' ' + addr.city : '',
                ].filter(Boolean).join('')
                setPickupAddress(formatted.trim().replace(/,\s*$/, ''))
                setPickupLat(addr.lat)
                setPickupLng(addr.lng)
              }}
            />
          </div>
        )}

        {(editingPickup || pickupContactName || pickupContactPhone) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            <div>
              <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>{s.pickupContact}</div>
              <input
                value={pickupContactName}
                onChange={e => setPickupContactName(e.target.value)}
                style={input}
                placeholder={lang === 'pl' ? 'np. Jan Kowalski' : 'e.g. Jan Kowalski'}
              />
            </div>
            <div>
              <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>{s.pickupPhone}</div>
              <input
                value={pickupContactPhone}
                onChange={e => setPickupContactPhone(e.target.value)}
                style={input}
                placeholder="+48 000 000 000"
              />
            </div>
          </div>
        )}

        <SaveButton saving={savingPickup} saved={savedPickup} onClick={savePickup} s={s} />
        {errorPickup && <p style={{ color: '#FF3B30', fontSize: 12, marginTop: 6, marginBottom: 0 }}>{errorPickup}</p>}
      </div>

      <div style={{ borderTop: '1px solid ' + colors.border, marginBottom: 20 }} />

      {/* ── Adres siedziby ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={subLabel}>{s.registeredTitle}</div>
        <div style={desc}>{s.registeredDesc}</div>
        <input
          value={registeredAddress}
          onChange={e => setRegisteredAddress(e.target.value)}
          placeholder={s.addressPlaceholder}
          style={input}
        />
        <SaveButton saving={savingRegistered} saved={savedRegistered} onClick={saveRegistered} s={s} />
        {errorRegistered && <p style={{ color: '#FF3B30', fontSize: 12, marginTop: 6, marginBottom: 0 }}>{errorRegistered}</p>}
      </div>

      <div style={{ borderTop: '1px solid ' + colors.border, marginBottom: 20 }} />

      {/* ── Adres korespondencyjny ── */}
      <div>
        <div style={subLabel}>{s.correspondenceTitle}</div>
        <div style={desc}>{s.correspondenceDesc}</div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 12 }}>
          <input
            type="checkbox"
            checked={correspondenceSame}
            onChange={e => setCorrespondenceSame(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: '#D4FF00', cursor: 'pointer' }}
          />
          <span style={{ fontSize: 13, color: colors.text }}>{s.sameAsRegistered}</span>
        </label>

        {!correspondenceSame && (
          <input
            value={correspondenceAddress}
            onChange={e => setCorrespondenceAddress(e.target.value)}
            placeholder={s.addressPlaceholder}
            style={{ ...input, marginBottom: 0 }}
          />
        )}

        {correspondenceSame && registeredAddress && (
          <div style={{ fontSize: 13, color: colors.textSecondary, fontStyle: 'italic', marginBottom: 4 }}>
            {registeredAddress}
          </div>
        )}

        <SaveButton saving={savingCorrespondence} saved={savedCorrespondence} onClick={saveCorrespondence} s={s} />
        {errorCorrespondence && <p style={{ color: '#FF3B30', fontSize: 12, marginTop: 6, marginBottom: 0 }}>{errorCorrespondence}</p>}
      </div>
    </div>
  )
}
