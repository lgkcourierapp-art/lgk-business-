'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useApp } from '../../utils/appContext'

const BLANK = {
  label: '', address_type: 'pickup',
  street: '', house_number: '', apartment: '',
  postal_code: '', city: '', country: 'PL',
  contact_name: '', contact_phone: '',
  access_code: '', instructions: '',
  is_default_pickup: false,
}

export default function AddressesPage() {
  const router = useRouter()
  const { lang, colors } = useApp()
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const fetchAddresses = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUserId(user['id'])
    const { data } = await supabase
      .from('saved_addresses')
      .select('*')
      .eq('client_id', user['id'])
      .order('use_count', { ascending: false })
    setAddresses(data || [])
    setLoading(false)
  }, [router])

  useEffect(() => { fetchAddresses() }, [fetchAddresses])

  const set = (k, v) => setEditing(prev => ({ ...prev, [k]: v }))

  const save = async () => {
    if (!editing.label || !editing.street || !editing.city) return
    setSaving(true)
    const payload = { ...editing, client_id: userId }
    if (editing['id']) {
      await supabase.from('saved_addresses').update(payload).eq('id', editing['id'])
    } else {
      await supabase.from('saved_addresses').insert(payload)
    }
    setSaving(false)
    setEditing(null)
    fetchAddresses()
  }

  const remove = async (id) => {
    await supabase.from('saved_addresses').delete().eq('id', id)
    setDeleteConfirm(null)
    fetchAddresses()
  }

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

  const inputStyle = {
    width: '100%', padding: '10px 12px', background: colors.input,
    border: '1px solid ' + colors.border, borderRadius: 8, color: colors.text,
    fontSize: 14, boxSizing: 'border-box', marginBottom: 10,
  }
  const cardStyle = {
    background: colors.card, border: '1px solid ' + colors.border,
    borderRadius: 12, padding: 20, marginBottom: 12,
  }

  const pickupAddresses   = addresses.filter(a => a.address_type !== 'delivery')
  const deliveryAddresses = addresses.filter(a => a.address_type === 'delivery')

  return (
    <div key={lang} style={{ minHeight: '100vh', background: colors.bg }}>
      <main style={{ maxWidth: 700, margin: '0 auto', padding: '24px 16px', paddingBottom: 80 }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
            {lang === 'pl' ? 'Zapisane adresy' : 'Saved addresses'}
          </h1>
          <button
            onClick={() => setEditing({ ...BLANK })}
            style={{ background: '#D4FF00', color: '#000', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
          >
            + Add address
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: colors.textSecondary }}>Loading...</div>
        ) : addresses.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: 'center', padding: 48, color: colors.textSecondary }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📍</div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>No saved addresses yet</div>
            <div style={{ fontSize: 13, color: colors.textSecondary }}>Save your pickup and delivery locations to speed up order placement.</div>
          </div>
        ) : (
          <>
            {[
              { title: lang === 'pl' ? 'Adresy odbioru' : 'Pickup addresses', list: pickupAddresses },
              { title: lang === 'pl' ? 'Adresy dostawy' : 'Delivery addresses', list: deliveryAddresses },
            ].map(({ title, list }) => list.length > 0 && (
              <div key={title} style={{ marginBottom: 28 }}>
                <div style={{ color: '#D4FF00', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>{title}</div>
                {list.map(addr => (
                  <div key={addr['id']} style={{ ...cardStyle, borderLeft: addr.is_default_pickup ? '3px solid #D4FF00' : '1px solid ' + colors.border }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: colors.text, marginBottom: 2 }}>
                          {addr.label}
                          {addr.is_default_pickup && (
                            <span style={{ marginLeft: 8, background: '#D4FF0020', color: '#D4FF00', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>DEFAULT</span>
                          )}
                        </div>
                        <div style={{ color: colors.textSecondary, fontSize: 13 }}>
                          {addr.street} {addr.house_number}{addr.apartment ? '/' + addr.apartment : ''}, {addr.city}
                        </div>
                        {addr.contact_name && <div style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>{addr.contact_name} · {addr.contact_phone}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        {!addr.is_default_pickup && (
                          <button onClick={() => setDefault(addr)} style={{ background: 'transparent', border: '1px solid ' + colors.border, color: colors.textSecondary, padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                            Set default
                          </button>
                        )}
                        <button onClick={() => setEditing({ ...addr })} style={{ background: 'transparent', border: '1px solid ' + colors.border, color: '#D4FF00', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                          Edit
                        </button>
                        <button onClick={() => setDeleteConfirm(addr['id'])} style={{ background: 'transparent', border: '1px solid #FF3B3040', color: '#FF3B30', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                          Delete
                        </button>
                      </div>
                    </div>
                    {deleteConfirm === addr['id'] && (
                      <div style={{ marginTop: 12, padding: 12, background: '#FF3B3010', borderRadius: 8, border: '1px solid #FF3B3030', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#FF6B6B', fontSize: 13 }}>Delete "{addr.label}"?</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => remove(addr['id'])} style={{ background: '#FF3B30', color: '#FFF', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Delete</button>
                          <button onClick={() => setDeleteConfirm(null)} style={{ background: 'transparent', border: '1px solid ' + colors.border, color: colors.textSecondary, padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </>
        )}
      </main>

      {/* Edit / Add modal */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: colors.card, borderRadius: '16px 16px 0 0', padding: 24, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 17, color: colors.text }}>
                {editing['id'] ? 'Edit address' : 'Add address'}
              </div>
              <button onClick={() => setEditing(null)} style={{ background: 'transparent', border: 'none', color: colors.textSecondary, fontSize: 22, cursor: 'pointer' }}>×</button>
            </div>

            <input placeholder="Nickname (e.g. Warehouse, Home)" value={editing.label} onChange={e => set('label', e.target.value)} style={inputStyle} />

            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {['pickup', 'delivery'].map(type => (
                <button
                  key={type}
                  onClick={() => set('address_type', type)}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', border: '1px solid ' + (editing.address_type === type ? '#D4FF00' : colors.border), background: editing.address_type === type ? '#D4FF0015' : 'transparent', color: editing.address_type === type ? '#D4FF00' : colors.textSecondary }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
              <input placeholder="Street" value={editing.street} onChange={e => set('street', e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} />
              <input placeholder="No." value={editing.house_number} onChange={e => set('house_number', e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} />
            </div>
            <div style={{ height: 10 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input placeholder="City" value={editing.city} onChange={e => set('city', e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} />
              <input placeholder="Postal code" value={editing.postal_code} onChange={e => set('postal_code', e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} />
            </div>
            <div style={{ height: 10 }} />
            <input placeholder="Contact name" value={editing.contact_name} onChange={e => set('contact_name', e.target.value)} style={inputStyle} />
            <input placeholder="Contact phone" value={editing.contact_phone} onChange={e => set('contact_phone', e.target.value)} style={inputStyle} />
            <input placeholder="Access code / gate code" value={editing.access_code} onChange={e => set('access_code', e.target.value)} style={inputStyle} />
            <textarea placeholder="Notes for courier" value={editing.instructions} onChange={e => set('instructions', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }} />

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, cursor: 'pointer' }}>
              <input type="checkbox" checked={editing.is_default_pickup} onChange={e => set('is_default_pickup', e.target.checked)} style={{ accentColor: '#D4FF00', width: 16, height: 16 }} />
              <span style={{ color: colors.text, fontSize: 14 }}>Set as default {editing.address_type} address</span>
            </label>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={save}
                disabled={saving || !editing.label || !editing.street || !editing.city}
                style={{ flex: 1, background: (!saving && editing.label && editing.street && editing.city) ? '#D4FF00' : colors.border, color: (!saving && editing.label && editing.street && editing.city) ? '#000' : colors.textSecondary, border: 'none', padding: '14px 0', borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
              >
                {saving ? 'Saving...' : 'Save address'}
              </button>
              <button onClick={() => setEditing(null)} style={{ background: 'transparent', border: '1px solid ' + colors.border, color: colors.textSecondary, padding: '14px 20px', borderRadius: 10, cursor: 'pointer', fontSize: 14 }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
