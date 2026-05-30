'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/utils/appContext'

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
  const [logoUrl, setLogoUrl] = useState(null)
  const [signedLogoUrl, setSignedLogoUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [integrationFlag, setIntegrationFlag] = useState(false)
  const [existingApiKey, setExistingApiKey] = useState(null)
  const [newRawKey, setNewRawKey] = useState(null)
  const [generatingKey, setGeneratingKey] = useState(false)
  const [copying, setCopying] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUser(user)
      setProfile(p => ({ ...p, email: user.email || '' }))

      const { data: prof } = await supabase
        .from('profiles')
        .select('company_name, phone, business_type, logo_url')
        .eq('id', user['id'])
        .single()
      if (prof) {
        setProfile(p => ({ ...p, company_name: prof.company_name || '', phone: prof.phone || '' }))
        setBusinessType(prof.business_type || 'general')
        if (prof.logo_url) {
          setLogoUrl(prof.logo_url)
          const { data: signedData } = await supabase.storage.from('avatars').createSignedUrl(prof.logo_url, 3600)
          if (signedData?.signedUrl) setSignedLogoUrl(signedData.signedUrl)
        }
      }

      const { data: addrs } = await supabase
        .from('saved_addresses')
        .select('*')
        .eq('user_id', user['id'])
        .order('is_default_pickup', { ascending: false })
      setSavedAddresses(addrs || [])
      setLoadingAddresses(false)

      // Integration flag + existing key
      const { data: flagRow } = await supabase
        .from('feature_flags')
        .select('enabled')
        .eq('name', 'gloriaFood_integration')
        .single()
      setIntegrationFlag(flagRow?.enabled ?? false)

      const { data: keyRow } = await supabase
        .from('api_keys')
        .select('id, key_prefix, last_used_at, is_active')
        .eq('client_id', user['id'])
        .eq('integration_type', 'gloriaFood')
        .eq('is_active', true)
        .maybeSingle()
      setExistingApiKey(keyRow ?? null)
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

  const generateKey = async () => {
    if (!user) return
    setGeneratingKey(true)
    try {
      const array = new Uint8Array(24)
      window.crypto.getRandomValues(array)
      const raw = 'lgk_' + Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
      const encoder = new TextEncoder()
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoder.encode(raw))
      const hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
      const prefix = raw.slice(0, 12)
      const { data: inserted } = await supabase.from('api_keys').insert({
        client_id: user['id'],
        key_hash: hash,
        key_prefix: prefix,
        name: 'GloriaFood',
        integration_type: 'gloriaFood',
        is_active: true,
      }).select('id, key_prefix, last_used_at, is_active').single()
      if (inserted) {
        setExistingApiKey(inserted)
        setNewRawKey(raw)
      }
    } catch (err) {
      console.error('Key generation failed:', err)
    }
    setGeneratingKey(false)
  }

  const disconnectKey = async () => {
    if (!user || !existingApiKey) return
    await supabase.from('api_keys').update({ is_active: false }).eq('id', existingApiKey['id'])
    setExistingApiKey(null)
    setNewRawKey(null)
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopying(true)
      setTimeout(() => setCopying(false), 2000)
    } catch {
      // fallback: silent
    }
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setUploadError('Only image files allowed (PNG, JPG, SVG)'); return }
    if (file.size > 2 * 1024 * 1024) { setUploadError('File too large — max 2MB'); return }
    setUploadError(null)
    setUploading(true)
    try {
      const ext = file.name.split('.').pop().toLowerCase()
      const path = user['id'] + '/logo.' + ext
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data: signedData } = await supabase.storage.from('avatars').createSignedUrl(path, 3600)
      if (signedData?.signedUrl) setSignedLogoUrl(signedData.signedUrl)
      await supabase.from('profiles').update({ logo_url: path }).eq('id', user['id'])
      setLogoUrl(path)
      window.dispatchEvent(new Event('lgk-profile-updated'))
    } catch (err) {
      setUploadError('Upload failed — please try again')
    } finally {
      setUploading(false)
    }
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

        {/* Company branding */}
        <div style={cardStyle}>
          <div style={{ color: '#D4FF00', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Company Branding</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
            {signedLogoUrl ? (
              <img src={signedLogoUrl} alt="Company logo" style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: 8, border: '1px solid ' + colors.border, background: '#FFF' }} />
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: 8, border: '1px solid ' + colors.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, background: colors.bg }}>🏢</div>
            )}
            <div>
              <label style={{ display: 'inline-block', background: '#D4FF00', color: '#000', padding: '10px 20px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1 }}>
                {uploading ? 'Uploading…' : logoUrl ? 'Change logo' : 'Upload logo'}
                <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploading} style={{ display: 'none' }} />
              </label>
              <div style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8 }}>PNG, JPG or SVG · Max 2MB</div>
              {uploadError && <div style={{ color: '#FF3B30', fontSize: 12, marginTop: 6 }}>{uploadError}</div>}
            </div>
          </div>
        </div>

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

        {/* Integrations */}
        <div style={cardStyle}>
          <div style={{ color: '#D4FF00', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Integracje POS</div>

          {/* GloriaFood tile */}
          <div style={{ border: '1px solid ' + colors.border, borderRadius: 10, padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: integrationFlag ? 12 : 0 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: colors.text }}>GloriaFood</div>
                {!integrationFlag && (
                  <div style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>Wkrótce dostępne / Coming soon</div>
                )}
              </div>
              <span style={{ fontSize: 22 }}>🍕</span>
            </div>

            {integrationFlag && (
              <>
                {existingApiKey && !newRawKey ? (
                  // Already connected
                  <div>
                    <div style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 8 }}>
                      Połączono · Klucz: <span style={{ fontFamily: 'monospace', color: colors.text }}>{existingApiKey.key_prefix}…</span>
                    </div>
                    {existingApiKey.last_used_at && (
                      <div style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 12 }}>
                        Ostatnio użyty: {new Date(existingApiKey.last_used_at).toLocaleString('pl-PL')}
                      </div>
                    )}
                    <button
                      onClick={disconnectKey}
                      style={{ background: 'transparent', border: '1px solid #FF3B30', color: '#FF3B30', padding: '8px 14px', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Rozłącz
                    </button>
                  </div>
                ) : newRawKey ? (
                  // Key just generated — show once
                  <div>
                    <div style={{ color: '#00C853', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Klucz API (skopiuj — nie będzie widoczny ponownie):</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                      <code style={{ flex: 1, background: '#0A0A0A', color: '#D4FF00', padding: '8px 12px', borderRadius: 6, fontSize: 12, wordBreak: 'break-all', fontFamily: 'monospace' }}>{newRawKey}</code>
                      <button
                        onClick={() => copyToClipboard(newRawKey)}
                        style={{ background: copying ? '#00C853' : '#D4FF00', color: '#000', border: 'none', padding: '8px 12px', borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: 'pointer', flexShrink: 0 }}
                      >
                        {copying ? '✓' : 'Kopiuj'}
                      </button>
                    </div>
                    <div style={{ background: '#D4FF0010', border: '1px solid #D4FF0030', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: colors.text, marginBottom: 4 }}>URL webhooka:</div>
                      <code style={{ fontSize: 12, color: colors.textSecondary, fontFamily: 'monospace', wordBreak: 'break-all' }}>https://lgk-business.vercel.app/api/integrations/gloriaFood</code>
                      <div style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8 }}>
                        Wklej URL i klucz w GloriaFood → Webhook → Delivery Partner
                      </div>
                    </div>
                    <button
                      onClick={disconnectKey}
                      style={{ background: 'transparent', border: '1px solid #FF3B30', color: '#FF3B30', padding: '8px 14px', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Rozłącz
                    </button>
                  </div>
                ) : (
                  // Not yet connected
                  <button
                    onClick={generateKey}
                    disabled={generatingKey}
                    style={{ background: '#D4FF00', color: '#000', border: 'none', padding: '10px 18px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: generatingKey ? 'not-allowed' : 'pointer', opacity: generatingKey ? 0.7 : 1 }}
                  >
                    {generatingKey ? 'Generowanie…' : 'Połącz GloriaFood'}
                  </button>
                )}
              </>
            )}
          </div>

          {/* GoPOS tile */}
          <div style={{ border: '1px solid ' + colors.border, borderRadius: 10, padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: colors.text }}>GoPOS</div>
                <div style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>Coming soon · Q3 2026</div>
              </div>
              <span style={{ fontSize: 22 }}>🖥️</span>
            </div>
          </div>

          {/* Lightspeed tile */}
          <div style={{ border: '1px solid ' + colors.border, borderRadius: 10, padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: colors.text }}>Lightspeed</div>
                <div style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>Coming soon</div>
              </div>
              <span style={{ fontSize: 22 }}>⚡</span>
            </div>
          </div>

          {/* Other POS tile */}
          <div style={{ border: '1px solid ' + colors.border, borderRadius: 10, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: colors.text }}>Inne systemy POS</div>
                <div style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                  Skontaktuj się:{' '}
                  <a href="mailto:lgkcourierapp@gmail.com" style={{ color: colors.text, fontWeight: 600 }}>lgkcourierapp@gmail.com</a>
                </div>
              </div>
              <span style={{ fontSize: 22 }}>🔌</span>
            </div>
          </div>
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
