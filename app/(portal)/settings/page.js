'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/utils/appContext'
import { t as tStr } from '@/lib/strings'
import BrandingSection from './components/BrandingSection'
import AddressesSection from './components/AddressesSection'
import IntegrationsSection from './components/IntegrationsSection'
import DeleteAccountSection from './components/DeleteAccountSection'

export default function SettingsPage() {
  const router = useRouter()
  const { t, colors, lang } = useApp()
  const [user, setUser] = useState(null)

  useEffect(() => { document.title = tStr(lang, 'pageSettings') }, [lang])
  const [savedAddresses, setSavedAddresses] = useState([])
  const [loadingAddresses, setLoadingAddresses] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUser(user)
      const { data: addrs } = await supabase
        .from('saved_addresses')
        .select('*')
        .eq('client_id', user['id'])
        .order('is_default_pickup', { ascending: false })
      setSavedAddresses(addrs || [])
      setLoadingAddresses(false)
    })
  }, [router])

  const setDefaultAddress = async (addrId) => {
    if (!user) return
    await supabase.from('saved_addresses').update({ is_default_pickup: false }).eq('client_id', user['id'])
    await supabase.from('saved_addresses').update({ is_default_pickup: true }).eq('id', addrId)
    setSavedAddresses(prev => prev.map(a => ({ ...a, is_default_pickup: a['id'] === addrId })))
  }

  const deleteAddress = async (addrId) => {
    if (!confirm('Delete this saved address?')) return
    await supabase.from('saved_addresses').delete().eq('id', addrId)
    setSavedAddresses(prev => prev.filter(a => a['id'] !== addrId))
  }

  const card = { background: colors.card, border: '1px solid ' + colors.border, borderRadius: 12, padding: 24, marginBottom: 16 }

  return (
    <div key={lang} style={{ minHeight: '100vh', background: colors.bg }}>
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: colors.text }}>{t('settings')}</h1>

        <BrandingSection user={user} />
        <AddressesSection user={user} />

        {/* Saved Addresses */}
        <div style={card}>
          <div style={{ color: '#374151', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>{t('savedAddresses')}</div>
          {loadingAddresses ? (
            <div style={{ color: colors.textSecondary, fontSize: 14 }}>{t('loading')}</div>
          ) : savedAddresses.length === 0 ? (
            <div style={{ color: colors.textSecondary, fontSize: 14 }}>{t('noSavedAddresses')}</div>
          ) : savedAddresses.map(addr => (
            <div key={addr['id']} style={{ background: addr.is_default_pickup ? '#D4FF0008' : colors.bg, border: '1px solid ' + (addr.is_default_pickup ? '#D4FF0040' : colors.border), borderRadius: 10, padding: '14px 16px', marginBottom: 10, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>{addr.is_default_pickup ? '⭐' : '📍'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: colors.text, fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{addr.label}</div>
                <div style={{ color: colors.textSecondary, fontSize: 13 }}>{addr.street} {addr.house_number}{addr.apartment ? '/' + addr.apartment : ''}, {addr.city}</div>
                {addr.contact_name && <div style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>{addr.contact_name}</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                {!addr.is_default_pickup && (
                  <button onClick={() => setDefaultAddress(addr['id'])} style={{ background: 'transparent', border: '1px solid #D4FF00', color: '#D4FF00', padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>{t('setDefault')}</button>
                )}
                <button onClick={() => deleteAddress(addr['id'])} style={{ background: 'transparent', border: '1px solid #FF3B30', color: '#FF3B30', padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{t('delete')}</button>
              </div>
            </div>
          ))}
        </div>

        <IntegrationsSection user={user} />
        <DeleteAccountSection />
      </main>
    </div>
  )
}
