'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useApp } from '../../utils/appContext'

export default function SettingsPage() {
  const router = useRouter()
  const { t, colors, lang, toggleLang } = useApp()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState({ company_name: '', email: '', phone: '' })
  const [savedAddresses, setSavedAddresses] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loadingAddresses, setLoadingAddresses] = useState(true)
  const [businessType, setBusinessType] = useState('general')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUser(user)
      setProfile(p => ({ ...p, email: user.email || '' }))

      const { data: prof } = await supabase
        .from('profiles')
        .select('company_name, phone, business_type')
        .eq('id', user['id'])
        .single()
      if (prof) {
        setProfile(p => ({ ...p, company_name: prof.company_name || '', phone: prof.phone || '' }))
        setBusinessType(prof.business_type || 'general')
      }

      const { data: addrs } = await supabase
        .from('saved_addresses')
        .select('*')
        .eq('user_id', user['id'])
        .order('is_default_pickup', { ascending: false })
      setSavedAddresses(addrs || [])
      setLoadingAddresses(false)
    })
  }, [router])

  const saveProfile = async () => {
    if (!user) return
    setSaving(true)
    await supabase.from('profiles').update({
      company_name: profile.company_name,
      phone: profile.phone
    }).eq('id', user['id'])
    window.dispatchEvent(new Event('lgk-profile-updated'))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleBusinessTypeChange = async (type) => {
    setBusinessType(type)
    if (!user) return
    await supabase.from('profiles').update({ business_type: type }).eq('id', user['id'])
    window.dispatchEvent(new Event('lgk-profile-updated'))
  }

  const setDefaultAddress = async (addrId) => {
    if (!user) return
    await supabase
      .from('saved_addresses')
      .update({ is_default_pickup: false })
      .eq('user_id', user['id'])
    await supabase
      .from('saved_addresses')
      .update({ is_default_pickup: true })
      .eq('id', addrId)
    setSavedAddresses(prev =>
      prev.map(a => ({ ...a, is_default_pickup: a['id'] === addrId }))
    )
  }

  const deleteAddress = async (addrId) => {
    if (!confirm('Delete this saved address?')) return
    await supabase.from('saved_addresses').delete().eq('id', addrId)
    setSavedAddresses(prev => prev.filter(a => a['id'] !== addrId))
  }

  const cardStyle = { background: colors.card, border: '1px solid ' + colors.border, borderRadius: 12, padding: 24, marginBottom: 16 }
  const inp = (key, placeholder, type = 'text') => (
    <input
      type={type}
      placeholder={placeholder}
      value={profile[key]}
      onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))}
      style={{ width: '100%', padding: '12px 14px', background: colors.input, border: '1px solid ' + colors.border, borderRadius: 8, color: colors.text, fontSize: 15, boxSizing: 'border-box', WebkitAppearance: 'none' }}
    />
  )

  return (
    <div key={lang} style={{ minHeight: '100vh', background: colors.bg }}>
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>

        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: colors.text }}>{t('settings')}</h1>

        {/* Company info */}
        <div style={cardStyle}>
          <div style={{ color: '#D4FF00', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>{t('companyInfo')}</div>
          <div style={{ marginBottom: 12 }}>{inp('company_name', t('companyName'))}</div>
          <div style={{ marginBottom: 12 }}>{inp('email', t('email'), 'email')}</div>
          <div style={{ marginBottom: 20 }}>{inp('phone', '+48 XXX XXX XXX', 'tel')}</div>
          <button
            onClick={saveProfile}
            disabled={saving}
            style={{ background: '#D4FF00', color: '#000', padding: '12px 24px', borderRadius: 8, fontWeight: 700, fontSize: 14, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? t('saving') : saved ? t('saved') : t('saveChanges')}
          </button>
        </div>

        {/* Business type */}
        <div style={cardStyle}>
          <div style={{ color: '#D4FF00', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Business Type</div>
          {[
            { value: 'general', label: 'General Business', icon: '📦' },
            { value: 'restaurant', label: 'Restaurant / Food', icon: '🍽️' },
            { value: 'pharmacy', label: 'Pharmacy / Medical', icon: '💊' },
          ].map(opt => (
            <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: businessType === opt.value ? '#D4FF0015' : 'transparent', border: '1px solid ' + (businessType === opt.value ? '#D4FF00' : colors.border), borderRadius: 8, marginBottom: 8, cursor: 'pointer', fontSize: 14 }}>
              <input type="radio" name="businessType" value={opt.value} checked={businessType === opt.value} onChange={() => handleBusinessTypeChange(opt.value)} style={{ accentColor: '#D4FF00' }} />
              <span style={{ flex: 1, color: colors.text, fontWeight: 600, fontSize: 14 }}>{opt.label}</span>
              <span style={{ fontSize: 18 }}>{opt.icon}</span>
            </label>
          ))}
          {businessType === 'restaurant' && (
            <div style={{ background: '#FF950015', border: '1px solid #FF950040', borderRadius: 8, padding: '12px 14px', marginTop: 4 }}>
              <div style={{ color: '#FF9500', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Restaurant mode active</div>
              <div style={{ color: colors.textSecondary, fontSize: 13 }}>Order form will show prep time, item count, and food handling options for each new order.</div>
            </div>
          )}
        </div>

        {/* Language */}
        <div style={cardStyle}>
          <div style={{ color: '#D4FF00', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>{t('language')}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {['en', 'pl'].map(l => (
              <button
                key={l}
                onClick={toggleLang}
                style={{ padding: '10px 20px', borderRadius: 8, fontWeight: 700, fontSize: 14, border: '1px solid ' + (lang === l ? '#D4FF00' : colors.border), background: lang === l ? '#D4FF0015' : 'transparent', color: lang === l ? '#D4FF00' : colors.textSecondary, cursor: 'pointer' }}
              >
                {l === 'en' ? '🇬🇧 English' : '🇵🇱 Polski'}
              </button>
            ))}
          </div>
        </div>

        {/* Saved addresses */}
        <div style={cardStyle}>
          <div style={{ color: '#D4FF00', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>{t('savedAddresses')}</div>

          {loadingAddresses ? (
            <div style={{ color: colors.textSecondary, fontSize: 14 }}>{t('loading')}</div>
          ) : savedAddresses.length === 0 ? (
            <div style={{ color: colors.textSecondary, fontSize: 14 }}>{t('noSavedAddresses')}</div>
          ) : (
            savedAddresses.map(addr => (
              <div
                key={addr['id']}
                style={{ background: addr.is_default_pickup ? '#D4FF0008' : colors.bg, border: '1px solid ' + (addr.is_default_pickup ? '#D4FF0040' : colors.border), borderRadius: 10, padding: '14px 16px', marginBottom: 10, display: 'flex', alignItems: 'flex-start', gap: 12 }}
              >
                <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>{addr.is_default_pickup ? '⭐' : '📍'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: colors.text, fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{addr.label}</div>
                  <div style={{ color: colors.textSecondary, fontSize: 13 }}>
                    {addr.street} {addr.house_number}{addr.apartment ? '/' + addr.apartment : ''}, {addr.city}
                  </div>
                  {addr.contact_name && <div style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>{addr.contact_name}</div>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                  {!addr.is_default_pickup && (
                    <button
                      onClick={() => setDefaultAddress(addr['id'])}
                      style={{ background: 'transparent', border: '1px solid #D4FF00', color: '#D4FF00', padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      {t('setDefault')}
                    </button>
                  )}
                  <button
                    onClick={() => deleteAddress(addr['id'])}
                    style={{ background: 'transparent', border: '1px solid #FF3B30', color: '#FF3B30', padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Billing note */}
        <div style={cardStyle}>
          <div style={{ color: '#D4FF00', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>{t('billing')}</div>
          <div style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 8 }}>{t('manualInvoice')}</div>
          <div style={{ color: colors.textSecondary, fontSize: 13 }}>{t('stripeComingSoon')}</div>
        </div>

        {/* Danger zone */}
        <div style={{ ...cardStyle, border: '1px solid #FF3B3040' }}>
          <div style={{ color: '#FF3B30', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>{t('dangerZone')}</div>
          <div style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 16 }}>{t('dangerDescription')}</div>
          <button
            onClick={async () => {
              if (!confirm('Are you sure? This cannot be undone.')) return
              await supabase.auth.signOut()
              router.push('/login')
            }}
            style={{ background: 'transparent', border: '1px solid #FF3B30', color: '#FF3B30', padding: '10px 20px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
          >
            {t('deleteAccount')}
          </button>
        </div>

      </main>
    </div>
  )
}
