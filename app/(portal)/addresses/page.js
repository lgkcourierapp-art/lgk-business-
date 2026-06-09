'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/utils/appContext'
import AddressInput from '@/components/AddressInput'

const BLANK_EDIT = {
  label: '', address_type: 'pickup',
  street: '', house_number: '', apartment: '',
  postal_code: '', city: '', country: 'PL',
  recipient_name: '', recipient_phone: '',
  access_code: '', instructions: '',
  is_default_pickup: false,
}

const BLANK_NEW = {
  label: '', name: '', phone: '',
  address: '',        // display text / fallback for street
  street: '',
  houseNumber: '',
  apartment: '',
  postcode: '', city: 'Szczecin', notes: '',
  lat: null, lng: null,
}

export default function AddressesPage() {
  const router = useRouter()
  const { lang, colors } = useApp()

  // List state
  const [addresses, setAddresses]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Edit modal state (for existing addresses)
  const [editing, setEditing]   = useState(null)
  const [saving, setSaving]     = useState(false)
  const [userId, setUserId]     = useState(null)

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAddress, setNewAddress]   = useState(BLANK_NEW)
  const [addSaving, setAddSaving]     = useState(false)
  const [addError, setAddError]       = useState(null)
  const [addSuccess, setAddSuccess]   = useState(false)

  // Import state
  const [importing, setImporting]       = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [importSuccess, setImportSuccess] = useState(null)

  // ─── Load ────────────────────────────────────────────────────────────────

  const fetchAddresses = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserId(user['id'])
    const { data } = await supabase
      .from('saved_addresses')
      .select('id, label, street, house_number, apartment, postal_code, city, recipient_name, recipient_phone, notes, delivery_count, use_count, is_default_pickup, address_type')
      .eq('client_id', user['id'])
      .order('use_count', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
    setAddresses(data || [])
    setLoading(false)
  }, [router])

  useEffect(() => { fetchAddresses() }, [fetchAddresses])

  // ─── Add address ─────────────────────────────────────────────────────────

  const handleAddAddress = async () => {
    if (!newAddress.street?.trim() && !newAddress.address?.trim()) {
      setAddError(lang === 'pl' ? 'Adres jest wymagany' : 'Address is required')
      return
    }
    setAddSaving(true)
    setAddError(null)
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('saved_addresses')
        .insert({
          client_id:      user['id'],
          label:          newAddress.label?.trim() || null,
          street:         newAddress.street?.trim() || newAddress.address?.trim() || null,
          house_number:   newAddress.houseNumber?.trim() || null,
          apartment:      newAddress.apartment?.trim() || null,
          postal_code:    newAddress.postcode?.trim() || null,
          city:           newAddress.city?.trim() || 'Szczecin',
          recipient_name:  newAddress.name?.trim() || null,
          recipient_phone: newAddress.phone?.trim() || null,
          notes:          newAddress.notes?.trim() || null,
          delivery_count: 0,
          use_count:      0,
          address_type:   'delivery',
          created_at:     new Date().toISOString(),
        })

      if (error) throw error

      setAddSuccess(true)
      setNewAddress(BLANK_NEW)
      setShowAddForm(false)
      await fetchAddresses()
      setTimeout(() => setAddSuccess(false), 3000)
    } catch (err) {
      setAddError(err.message)
    } finally {
      setAddSaving(false)
    }
  }

  // ─── Edit existing ───────────────────────────────────────────────────────

  const set = (k, v) => setEditing(prev => ({ ...prev, [k]: v }))

  const save = async () => {
    if (!editing.label || !editing.street || !editing.city) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const payload = {
        client_id:       user['id'],
        label:           editing.label?.trim() || null,
        street:          editing.street?.trim() || null,
        house_number:    editing.house_number?.trim() || null,
        apartment:       editing.apartment?.trim() || null,
        postal_code:     editing.postal_code?.trim() || null,
        city:            editing.city?.trim() || 'Szczecin',
        recipient_name:  editing.recipient_name?.trim() || null,
        recipient_phone: editing.recipient_phone?.trim() || null,
        notes:           editing.notes?.trim() || null,
        address_type:    editing.address_type || 'delivery',
        is_default_pickup: editing.is_default_pickup || false,
      }
      if (editing['id']) {
        await supabase.from('saved_addresses').update(payload).eq('id', editing['id'])
      } else {
        await supabase.from('saved_addresses').insert({ ...payload, delivery_count: 0, use_count: 0 })
      }
    } finally {
      setSaving(false)
      setEditing(null)
      fetchAddresses()
    }
  }

  // ─── Delete ──────────────────────────────────────────────────────────────

  const remove = async (id) => {
    await supabase.from('saved_addresses').delete().eq('id', id)
    setDeleteConfirm(null)
    fetchAddresses()
  }

  // ─── Set default ─────────────────────────────────────────────────────────

  const setDefault = async (addr) => {
    await supabase
      .from('saved_addresses')
      .update({ is_default_pickup: false })
      .eq('client_id', userId)
      .eq('address_type', addr.address_type)
    await supabase
      .from('saved_addresses')
      .update({ is_default_pickup: true })
      .eq('id', addr['id'])
    fetchAddresses()
  }

  // ─── CSV import ──────────────────────────────────────────────────────────

  const parseCSV = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 3)
    if (lines.length === 0) return []
    const delimiter = lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ','
    const rows = lines.map(l =>
      l.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''))
    )
    const firstRow = rows[0].map(c => c.toLowerCase())
    const hasHeader = firstRow.some(c =>
      ['name', 'address', 'phone', 'email', 'imie', 'adres', 'telefon', 'nazwisko'].includes(c)
    )
    const nameCol     = firstRow.findIndex(c => ['name','imie','nazwisko','recipient','odbiorca'].includes(c))
    const addressCol  = firstRow.findIndex(c => ['address','adres','ulica','street'].includes(c))
    const phoneCol    = firstRow.findIndex(c => ['phone','telefon','tel','mobile'].includes(c))
    const postcodeCol = firstRow.findIndex(c => ['postcode','kod','zip','postal'].includes(c))
    const cityCol     = firstRow.findIndex(c => ['city','miasto','town'].includes(c))
    const notesCol    = firstRow.findIndex(c => ['note','notes','notatka','uwagi','comment'].includes(c))
    const dataRows    = hasHeader ? rows.slice(1) : rows
    return dataRows.map(row => {
      if (addressCol >= 0) {
        return {
          name:     nameCol >= 0 ? row[nameCol] : '',
          address:  row[addressCol] || '',
          phone:    phoneCol >= 0 ? row[phoneCol] : '',
          postcode: postcodeCol >= 0 ? row[postcodeCol] : '',
          city:     cityCol >= 0 ? row[cityCol] : 'Szczecin',
          notes:    notesCol >= 0 ? row[notesCol] : '',
        }
      }
      const address  = row.find(c => /ul\.|al\.|os\.|\d+/.test(c)) || row[1] || ''
      const phone    = row.find(c => /\+?48\d{9}|\d{9}/.test(c.replace(/\s/g, ''))) || ''
      const postcode = row.find(c => /\d{2}-\d{3}/.test(c)) || ''
      const name     = row.find(c => /^[A-ZŁŻŹĆĄŚĘÓŃ][a-złżźćąśęóń]+\s+[A-ZŁŻŹĆĄŚĘÓŃ][a-złżźćąśęóń]+$/.test(c)) || ''
      return { name, address, phone, postcode, city: 'Szczecin', notes: '' }
    }).filter(a => a.address && a.address.length > 3)
  }

  const parseVCard = (text) => {
    const cards = text.split('BEGIN:VCARD').filter(c => c.includes('END:VCARD'))
    return cards.map(card => {
      const fnMatch  = card.match(/FN[^:]*:(.+)/i)
      const name     = fnMatch ? fnMatch[1].trim() : ''
      const telMatch = card.match(/TEL[^:]*:(.+)/i)
      const phone    = telMatch ? telMatch[1].trim().replace(/\s/g, '') : ''
      const adrMatch = card.match(/ADR[^:]*:([^\n\r]+)/i)
      let address = '', postcode = '', city = ''
      if (adrMatch) {
        const parts = adrMatch[1].split(';')
        address  = (parts[2] || parts[3] || '').trim()
        city     = (parts[3] || parts[5] || 'Szczecin').trim()
        postcode = (parts[5] || '').trim()
      }
      const noteMatch = card.match(/NOTE[^:]*:(.+)/i)
      const notes = noteMatch ? noteMatch[1].trim() : ''
      return { name, phone, address, postcode, city, notes }
    }).filter(a => a.address && a.address.length > 3)
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportResult(null)
    try {
      const text = await file.text()
      let parsed = []
      if (file.name.toLowerCase().endsWith('.vcf')) {
        parsed = parseVCard(text)
      } else if (file.name.toLowerCase().match(/\.(csv|txt)$/)) {
        parsed = parseCSV(text)
      } else {
        throw new Error(lang === 'pl' ? 'Obsługiwane formaty: CSV, VCF (vCard)' : 'Supported formats: CSV, VCF (vCard)')
      }
      if (parsed.length === 0) {
        throw new Error(lang === 'pl' ? 'Nie znaleziono adresów w pliku' : 'No addresses found in file')
      }
      setImportResult({ preview: parsed, file: file.name })
    } catch (err) {
      setImportResult({ error: err.message })
    } finally {
      setImporting(false)
    }
  }

  const handleConfirmImport = async () => {
    if (!importResult?.preview?.length) return
    setImporting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      let imported = 0
      for (let i = 0; i < importResult.preview.length; i += 50) {
        const batch = importResult.preview.slice(i, i + 50)
        const rows = batch.filter(a => a.address?.trim()).map(a => ({
          client_id:       user['id'],
          recipient_name:  a.name || null,
          recipient_phone: a.phone || null,
          street:          a.address.trim(),
          postal_code:     a.postcode || null,
          city:            a.city || 'Szczecin',
          notes:           a.notes || null,
          delivery_count:  0,
          use_count:       0,
          address_type:    'delivery',
          created_at:      new Date().toISOString(),
        }))
        const { error } = await supabase.from('saved_addresses').insert(rows)
        if (error) throw error
        imported += rows.length
      }
      setImportResult(null)
      await fetchAddresses()
      setImportSuccess(`${imported} ${lang === 'pl' ? 'adresów zaimportowano' : 'addresses imported'}`)
      setTimeout(() => setImportSuccess(null), 4000)
    } catch (err) {
      setImportResult(prev => ({ ...prev, error: err.message }))
    } finally {
      setImporting(false)
    }
  }

  // ─── Styles ──────────────────────────────────────────────────────────────

  const inputStyle = {
    width: '100%', padding: '10px 12px', background: colors.input,
    border: '1px solid ' + colors.border, borderRadius: 8, color: colors.text,
    fontSize: 14, boxSizing: 'border-box', outline: 'none',
  }
  const cardStyle = {
    background: colors.card, border: '1px solid ' + colors.border,
    borderRadius: 12, padding: 20, marginBottom: 12,
  }
  const btnSecondary = {
    padding: '10px 16px', border: '1px solid ' + colors.border,
    borderRadius: 8, fontSize: 14, cursor: 'pointer',
    color: colors.text, background: colors.card,
    display: 'inline-flex', alignItems: 'center', gap: 6,
  }

  const pickupAddresses   = addresses.filter(a => a.address_type !== 'delivery')
  const deliveryAddresses = addresses.filter(a => a.address_type === 'delivery')

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div key={lang} style={{ minHeight: '100vh', background: colors.bg }}>
      <main style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px', paddingBottom: 80 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: colors.text }}>
            {lang === 'pl' ? 'Zapisane adresy' : 'Saved addresses'}
          </h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="file"
              id="import-file"
              accept=".csv,.vcf,.txt"
              style={{ display: 'none' }}
              onChange={handleImport}
              onClick={e => { e.target.value = '' }}
            />
            <label htmlFor="import-file" style={btnSecondary}>
              ↥ {lang === 'pl' ? 'Importuj' : 'Import'}
            </label>
            <button
              onClick={() => { setShowAddForm(v => !v); setNewAddress(BLANK_NEW); setAddError(null) }}
              style={{ background: '#D4FF00', color: '#000', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
            >
              {showAddForm ? '× Cancel' : '+ ' + (lang === 'pl' ? 'Dodaj adres' : 'Add address')}
            </button>
          </div>
        </div>

        <p style={{ fontSize: 11, color: '#9CA3AF', margin: '-8px 0 12px' }}>
          {lang === 'pl' ? 'Import obsługuje: CSV (Excel), VCF (iPhone/Android kontakty)' : 'Import supports: CSV (Excel), VCF (iPhone/Android contacts)'}
        </p>

        {/* Toasts */}
        {addSuccess && (
          <div style={{ background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#065F46' }}>
            {lang === 'pl' ? 'Adres zapisany' : 'Address saved'}
          </div>
        )}
        {importSuccess && (
          <div style={{ background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#065F46' }}>
            {importSuccess}
          </div>
        )}

        {/* Import error */}
        {importResult?.error && (
          <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#991B1B' }}>
            {importResult.error}
          </div>
        )}

        {/* Import preview */}
        {importResult?.preview && (
          <div style={{ border: '1px solid ' + colors.border, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ background: colors.card, padding: '12px 16px', borderBottom: '1px solid ' + colors.border, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: colors.text }}>
                {lang === 'pl'
                  ? `Znaleziono ${importResult.preview.length} adresów — ${importResult.file}`
                  : `Found ${importResult.preview.length} addresses — ${importResult.file}`}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setImportResult(null)} style={{ ...btnSecondary, fontSize: 13 }}>
                  {lang === 'pl' ? 'Anuluj' : 'Cancel'}
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={importing}
                  style={{ padding: '8px 16px', background: importing ? colors.border : '#D4FF00', border: 'none', borderRadius: 6, fontWeight: 600, cursor: importing ? 'not-allowed' : 'pointer', fontSize: 13, color: '#000' }}
                >
                  {importing
                    ? (lang === 'pl' ? 'Importowanie...' : 'Importing...')
                    : (lang === 'pl' ? `Importuj wszystkie (${importResult.preview.length})` : `Import all (${importResult.preview.length})`)}
                </button>
              </div>
            </div>
            {importResult.preview.slice(0, 5).map((a, i) => (
              <div key={a.address + i} style={{ padding: '10px 16px', borderBottom: '1px solid ' + colors.border, fontSize: 13, color: colors.text }}>
                <span style={{ fontWeight: 600 }}>{a.name || '—'}</span>
                <span style={{ color: '#6B7280', marginLeft: 8 }}>{a.address}</span>
                {a.phone && <span style={{ color: '#9CA3AF', marginLeft: 8 }}>{a.phone}</span>}
              </div>
            ))}
            {importResult.preview.length > 5 && (
              <div style={{ padding: '10px 16px', fontSize: 12, color: '#9CA3AF' }}>
                + {importResult.preview.length - 5} {lang === 'pl' ? 'więcej' : 'more'}
              </div>
            )}
          </div>
        )}

        {/* Inline Add Form */}
        {showAddForm && (
          <div style={{ border: '1px solid ' + colors.border, borderRadius: 12, padding: 20, marginBottom: 20, background: colors.card }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px', color: colors.text }}>
              {lang === 'pl' ? 'Nowy adres' : 'New address'}
            </h3>

            <label style={{ display: 'block', fontSize: 13, color: '#6B7280', marginBottom: 4 }}>
              {lang === 'pl' ? 'Etykieta (opcjonalnie)' : 'Label (optional)'}
            </label>
            <input
              placeholder={lang === 'pl' ? 'np. Jan dom, Restauracja Centrum' : 'e.g. Jan home, Office'}
              value={newAddress.label}
              onChange={e => setNewAddress(p => ({ ...p, label: e.target.value }))}
              style={{ ...inputStyle, marginBottom: 12 }}
            />

            <label style={{ display: 'block', fontSize: 13, color: '#6B7280', marginBottom: 4 }}>
              {lang === 'pl' ? 'Imię i nazwisko' : 'Name'}
            </label>
            <input
              placeholder={lang === 'pl' ? 'Jan Kowalski' : 'Full name'}
              value={newAddress.name}
              onChange={e => setNewAddress(p => ({ ...p, name: e.target.value }))}
              style={{ ...inputStyle, marginBottom: 12 }}
            />

            <label style={{ display: 'block', fontSize: 13, color: '#6B7280', marginBottom: 4 }}>
              {lang === 'pl' ? 'Telefon' : 'Phone'}
            </label>
            <input
              type="tel"
              placeholder="+48 ___ ___ ___"
              value={newAddress.phone}
              onChange={e => setNewAddress(p => ({ ...p, phone: e.target.value }))}
              style={{ ...inputStyle, marginBottom: 12 }}
            />

            <label style={{ display: 'block', fontSize: 13, color: '#6B7280', marginBottom: 4 }}>
              {lang === 'pl' ? 'Adres *' : 'Address *'}
            </label>
            <div style={{ marginBottom: 12 }}>
              <AddressInput
                value={newAddress.address}
                onChange={s => setNewAddress(p => ({
                  ...p,
                  address:     s.address || [s.street, s.houseNumber].filter(Boolean).join(' ') || p.address,
                  street:      s.street || '',
                  houseNumber: s.houseNumber || '',
                  postcode:    s.postcode || p.postcode,
                  city:        s.city || p.city,
                  lat:         s.lat ?? p.lat,
                  lng:         s.lng ?? p.lng,
                }))}
                placeholder={lang === 'pl' ? 'ul. Piastów 44/3' : 'Street and number'}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#6B7280', marginBottom: 4 }}>
                  {lang === 'pl' ? 'Kod pocztowy' : 'Postcode'}
                </label>
                <input
                  placeholder="XX-XXX"
                  value={newAddress.postcode}
                  onChange={e => setNewAddress(p => ({ ...p, postcode: e.target.value }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#6B7280', marginBottom: 4 }}>
                  {lang === 'pl' ? 'Miasto' : 'City'}
                </label>
                <input
                  value={newAddress.city}
                  onChange={e => setNewAddress(p => ({ ...p, city: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            </div>

            <label style={{ display: 'block', fontSize: 13, color: '#6B7280', marginBottom: 4 }}>
              {lang === 'pl' ? 'Notatka dla kuriera' : 'Delivery note'}
            </label>
            <input
              placeholder={lang === 'pl' ? 'Domofon 12, III piętro' : 'Buzzer 12, 3rd floor'}
              value={newAddress.notes}
              onChange={e => setNewAddress(p => ({ ...p, notes: e.target.value }))}
              style={{ ...inputStyle, marginBottom: 12 }}
            />

            {addError && (
              <p style={{ color: '#DC2626', fontSize: 13, margin: '0 0 10px' }}>{addError}</p>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleAddAddress}
                disabled={addSaving}
                style={{ flex: 1, padding: '10px 16px', background: addSaving ? colors.border : '#D4FF00', color: addSaving ? '#9CA3AF' : '#000', border: 'none', borderRadius: 8, fontWeight: 600, cursor: addSaving ? 'not-allowed' : 'pointer', fontSize: 14 }}
              >
                {addSaving ? (lang === 'pl' ? 'Zapisywanie...' : 'Saving...') : (lang === 'pl' ? '+ Zapisz adres' : '+ Save address')}
              </button>
              <button
                onClick={() => { setShowAddForm(false); setNewAddress(BLANK_NEW); setAddError(null) }}
                style={btnSecondary}
              >
                {lang === 'pl' ? 'Anuluj' : 'Cancel'}
              </button>
            </div>
          </div>
        )}

        {/* Address list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: colors.textSecondary }}>Loading...</div>
        ) : addresses.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: 'center', padding: 48, color: colors.textSecondary }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📍</div>
            <div style={{ fontWeight: 600, marginBottom: 8, color: colors.text }}>
              {lang === 'pl' ? 'Brak zapisanych adresów' : 'No saved addresses yet'}
            </div>
            <div style={{ fontSize: 13 }}>
              {lang === 'pl' ? 'Kliknij „+ Dodaj adres" aby dodać pierwsze miejsce dostawy.' : 'Click "+ Add address" to add your first delivery location.'}
            </div>
          </div>
        ) : (
          <>
            {[
              { title: lang === 'pl' ? 'Adresy odbioru' : 'Pickup addresses', list: pickupAddresses },
              { title: lang === 'pl' ? 'Adresy dostawy' : 'Delivery addresses', list: deliveryAddresses },
            ].map(({ title, list }) => list.length > 0 && (
              <div key={title} style={{ marginBottom: 28 }}>
                <div style={{ color: '#374151', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>{title}</div>
                {list.map(addr => {
                  const fullAddress = [
                    addr.street,
                    addr.house_number,
                    addr.apartment ? `m. ${addr.apartment}` : null,
                    addr.postal_code,
                    addr.city,
                  ].filter(Boolean).join(', ')

                  return (
                    <div key={addr['id']} style={{ ...cardStyle, borderLeft: addr.is_default_pickup ? '3px solid #D4FF00' : undefined }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Label + badges */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                            <div style={{ fontWeight: 700, fontSize: 15, color: colors.text }}>
                              {addr.label || addr.street}
                            </div>
                            {addr.is_default_pickup && (
                              <span style={{ background: '#D4FF0020', color: '#D4FF00', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>DEFAULT</span>
                            )}
                            {addr.delivery_count >= 11 && (
                              <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 8, background: '#D4FF00', color: '#0A0A0A' }}>VIP</span>
                            )}
                            {addr.delivery_count >= 6 && addr.delivery_count < 11 && (
                              <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 8, background: 'rgba(212,255,0,0.15)', color: '#D4FF00' }}>Wierny</span>
                            )}
                            {addr.delivery_count >= 3 && addr.delivery_count < 6 && (
                              <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 8, background: 'rgba(212,255,0,0.08)', color: 'rgba(212,255,0,0.7)' }}>Stały</span>
                            )}
                          </div>
                          {/* Full address */}
                          <div style={{ fontSize: 13, color: colors.textSecondary }}>{fullAddress}</div>
                          {/* Recipient */}
                          {addr.recipient_name && (
                            <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                              {addr.recipient_name}{addr.recipient_phone ? ' · ' + addr.recipient_phone : ''}
                            </div>
                          )}
                          {/* Notes */}
                          {addr.notes && (
                            <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2, fontStyle: 'italic' }}>
                              {addr.notes}
                            </div>
                          )}
                          {/* Usage */}
                          {addr.delivery_count > 0 && (
                            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
                              {addr.delivery_count} {lang === 'pl' ? 'dostaw' : 'deliveries'}
                              {addr.use_count > 0 ? ` · ${addr.use_count} ${lang === 'pl' ? 'użyć' : 'uses'}` : ''}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 8 }}>
                          {!addr.is_default_pickup && (
                            <button onClick={() => setDefault(addr)} style={{ background: 'transparent', border: '1px solid ' + colors.border, color: colors.textSecondary, padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                              {lang === 'pl' ? 'Domyślny' : 'Set default'}
                            </button>
                          )}
                          <button onClick={() => setEditing({ ...addr })} style={{ background: 'transparent', border: '1px solid ' + colors.border, color: '#D4FF00', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                            {lang === 'pl' ? 'Edytuj' : 'Edit'}
                          </button>
                          <button onClick={() => setDeleteConfirm(addr['id'])} style={{ background: 'transparent', border: '1px solid #FF3B3040', color: '#FF3B30', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                            {lang === 'pl' ? 'Usuń' : 'Delete'}
                          </button>
                        </div>
                      </div>

                      {deleteConfirm === addr['id'] && (
                        <div style={{ marginTop: 10, padding: 12, background: '#FF3B3010', borderRadius: 8, border: '1px solid #FF3B3030', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#FF6B6B', fontSize: 13 }}>
                            {lang === 'pl' ? `Usunąć "${addr.label || addr.street}"?` : `Delete "${addr.label || addr.street}"?`}
                          </span>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => remove(addr['id'])} style={{ background: '#FF3B30', color: '#FFF', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                              {lang === 'pl' ? 'Usuń' : 'Delete'}
                            </button>
                            <button onClick={() => setDeleteConfirm(null)} style={{ background: 'transparent', border: '1px solid ' + colors.border, color: colors.textSecondary, padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                              {lang === 'pl' ? 'Anuluj' : 'Cancel'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </>
        )}
      </main>

      {/* Edit modal */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: colors.card, borderRadius: '16px 16px 0 0', padding: 24, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 17, color: colors.text }}>
                {editing['id'] ? (lang === 'pl' ? 'Edytuj adres' : 'Edit address') : (lang === 'pl' ? 'Dodaj adres' : 'Add address')}
              </div>
              <button onClick={() => setEditing(null)} style={{ background: 'transparent', border: 'none', color: colors.textSecondary, fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>

            <input
              placeholder={lang === 'pl' ? 'Etykieta (np. Magazyn, Dom)' : 'Nickname (e.g. Warehouse, Home)'}
              value={editing.label}
              onChange={e => set('label', e.target.value)}
              style={{ ...inputStyle, marginBottom: 10 }}
            />

            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {['pickup', 'delivery'].map(type => (
                <button
                  key={type}
                  onClick={() => set('address_type', type)}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', border: '1px solid ' + (editing.address_type === type ? '#D4FF00' : colors.border), background: editing.address_type === type ? '#D4FF0015' : 'transparent', color: editing.address_type === type ? '#D4FF00' : colors.textSecondary }}
                >
                  {type === 'pickup' ? (lang === 'pl' ? 'Odbiór' : 'Pickup') : (lang === 'pl' ? 'Dostawa' : 'Delivery')}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8, marginBottom: 10 }}>
              <input placeholder={lang === 'pl' ? 'Ulica' : 'Street'} value={editing.street} onChange={e => set('street', e.target.value)} style={inputStyle} />
              <input placeholder="Nr" value={editing.house_number} onChange={e => set('house_number', e.target.value)} style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              <input placeholder={lang === 'pl' ? 'Miasto' : 'City'} value={editing.city} onChange={e => set('city', e.target.value)} style={inputStyle} />
              <input placeholder={lang === 'pl' ? 'Kod pocztowy' : 'Postal code'} value={editing.postal_code} onChange={e => set('postal_code', e.target.value)} style={inputStyle} />
            </div>
            <input
              placeholder={lang === 'pl' ? 'Imię i nazwisko odbiorcy' : 'Recipient name'}
              value={editing.recipient_name}
              onChange={e => set('recipient_name', e.target.value)}
              style={{ ...inputStyle, marginBottom: 10 }}
            />
            <input
              placeholder={lang === 'pl' ? 'Telefon odbiorcy' : 'Recipient phone'}
              value={editing.recipient_phone}
              onChange={e => set('recipient_phone', e.target.value)}
              style={{ ...inputStyle, marginBottom: 10 }}
            />
            <textarea
              placeholder={lang === 'pl' ? 'Notatka dla kuriera' : 'Notes for courier'}
              value={editing.notes || ''}
              onChange={e => set('notes', e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit', marginBottom: 10 }}
            />

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, cursor: 'pointer' }}>
              <input type="checkbox" checked={editing.is_default_pickup} onChange={e => set('is_default_pickup', e.target.checked)} style={{ accentColor: '#D4FF00', width: 16, height: 16 }} />
              <span style={{ color: colors.text, fontSize: 14 }}>
                {lang === 'pl' ? `Domyślny adres ${editing.address_type === 'pickup' ? 'odbioru' : 'dostawy'}` : `Set as default ${editing.address_type} address`}
              </span>
            </label>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={save}
                disabled={saving || !editing.label || !editing.street || !editing.city}
                style={{ flex: 1, background: (!saving && editing.label && editing.street && editing.city) ? '#D4FF00' : colors.border, color: (!saving && editing.label && editing.street && editing.city) ? '#000' : colors.textSecondary, border: 'none', padding: '14px 0', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
              >
                {saving ? (lang === 'pl' ? 'Zapisywanie...' : 'Saving...') : (lang === 'pl' ? 'Zapisz' : 'Save')}
              </button>
              <button onClick={() => setEditing(null)} style={{ background: 'transparent', border: '1px solid ' + colors.border, color: colors.textSecondary, padding: '14px 20px', borderRadius: 10, cursor: 'pointer', fontSize: 14 }}>
                {lang === 'pl' ? 'Anuluj' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
