'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/utils/appContext'

export default function BrandingSection({ user }) {
  const { t, colors, lang, toggleLang } = useApp()
  const [profile, setProfile] = useState({ company_name: '', email: '', phone: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [businessType, setBusinessType] = useState('general')
  const [logoUrl, setLogoUrl] = useState(null)
  const [signedLogoUrl, setSignedLogoUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!user) return
    setProfile(p => ({ ...p, email: user.email || '' }))
    supabase
      .from('profiles')
      .select('company_name, phone, business_type, logo_url')
      .eq('id', user['id'])
      .single()
      .then(async ({ data: prof }) => {
        if (!prof) return
        setProfile(p => ({ ...p, company_name: prof.company_name || '', phone: prof.phone || '' }))
        setBusinessType(prof.business_type || 'general')
        if (prof.logo_url) {
          setLogoUrl(prof.logo_url)
          const { data: signed } = await supabase.storage.from('avatars').createSignedUrl(prof.logo_url, 3600)
          if (signed?.signedUrl) setSignedLogoUrl(signed.signedUrl)
        }
      })
  }, [user])

  const saveProfile = async () => {
    if (!user) return
    setSaving(true)
    await supabase.from('profiles').update({ company_name: profile.company_name, phone: profile.phone }).eq('id', user['id'])
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
      const { data: signed } = await supabase.storage.from('avatars').createSignedUrl(path, 3600)
      if (signed?.signedUrl) setSignedLogoUrl(signed.signedUrl)
      await supabase.from('profiles').update({ logo_url: path }).eq('id', user['id'])
      setLogoUrl(path)
      window.dispatchEvent(new Event('lgk-profile-updated'))
    } catch {
      setUploadError('Upload failed — please try again')
    } finally {
      setUploading(false)
    }
  }

  const handleLogoDelete = async () => {
    if (!confirm('Remove your company logo?')) return
    setDeleting(true)
    try {
      const { data: prof } = await supabase.from('profiles').select('logo_url').eq('id', user['id']).single()
      if (prof?.logo_url) {
        const ext = prof.logo_url.split('.').pop().split('?')[0]
        await supabase.storage.from('avatars').remove([`${user['id']}/logo.${ext}`])
      }
      await supabase.from('profiles').update({ logo_url: null }).eq('id', user['id'])
      setLogoUrl(null)
      setSignedLogoUrl(null)
      window.dispatchEvent(new Event('lgk-profile-updated'))
    } catch (err) {
      if (process.env.NODE_ENV === 'development') { console.error('Logo delete error:', err.message) }
    } finally {
      setDeleting(false)
    }
  }

  const card = { background: colors.card, border: '1px solid ' + colors.border, borderRadius: 12, padding: 24, marginBottom: 16 }
  const inp = (key, placeholder, type = 'text') => (
    <input type={type} placeholder={placeholder} value={profile[key]}
      onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))}
      style={{ width: '100%', padding: '12px 14px', background: colors.input, border: '1px solid ' + colors.border, borderRadius: 8, color: colors.text, fontSize: 15, boxSizing: 'border-box', WebkitAppearance: 'none' }} />
  )
  const sectionLabel = (label) => (
    <div style={{ color: '#374151', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>{label}</div>
  )

  return (
    <>
      {/* Company Branding */}
      <div style={card}>
        {sectionLabel('Company Branding')}
        {logoUrl ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <img src={signedLogoUrl || logoUrl} alt="Company logo" style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: 8, border: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary)' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', color: 'var(--color-text-secondary)', fontSize: 12, padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}>
                <i className="ti ti-pencil" aria-hidden="true" style={{ fontSize: 14 }} /> Change
                <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} disabled={uploading} />
              </label>
              <button onClick={handleLogoDelete} disabled={deleting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', border: '0.5px solid var(--color-background-danger)', color: 'var(--color-text-danger)', fontSize: 12, padding: '6px 12px', borderRadius: 6, cursor: deleting ? 'not-allowed' : 'pointer' }}>
                <i className="ti ti-trash" aria-hidden="true" style={{ fontSize: 14 }} />
                {deleting ? 'Removing...' : 'Remove'}
              </button>
            </div>
            {uploadError && <div style={{ color: '#FF3B30', fontSize: 12 }}>{uploadError}</div>}
          </div>
        ) : (
          <div>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#D4FF00', color: '#0A0A0A', fontWeight: 600, fontSize: 13, padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>
              {uploading ? 'Uploading...' : 'Upload logo'}
              <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} disabled={uploading} />
            </label>
            <div style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8 }}>PNG, JPG or SVG · Max 2MB</div>
            {uploadError && <div style={{ color: '#FF3B30', fontSize: 12, marginTop: 6 }}>{uploadError}</div>}
          </div>
        )}
      </div>

      {/* Company Info */}
      <div style={card}>
        {sectionLabel(t('companyInfo'))}
        <div style={{ marginBottom: 12 }}>{inp('company_name', t('companyName'))}</div>
        <div style={{ marginBottom: 12 }}>{inp('email', t('email'), 'email')}</div>
        <div style={{ marginBottom: 20 }}>{inp('phone', '+48 XXX XXX XXX', 'tel')}</div>
        <button onClick={saveProfile} disabled={saving}
          style={{ background: '#D4FF00', color: '#000', padding: '12px 24px', borderRadius: 8, fontWeight: 700, fontSize: 14, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? t('saving') : saved ? t('saved') : t('saveChanges')}
        </button>
      </div>

      {/* Business Type */}
      <div style={card}>
        {sectionLabel('Business Type')}
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
            <div style={{ color: colors.textSecondary, fontSize: 13 }}>Order form will show prep time, item count, and food handling options.</div>
          </div>
        )}
      </div>

      {/* Language */}
      <div style={card}>
        {sectionLabel(t('language'))}
        <div style={{ display: 'flex', gap: 10 }}>
          {['en', 'pl'].map(l => (
            <button key={l} onClick={toggleLang}
              style={{ padding: '10px 20px', borderRadius: 8, fontWeight: 700, fontSize: 14, border: '1px solid ' + (lang === l ? '#D4FF00' : colors.border), background: lang === l ? '#D4FF0015' : 'transparent', color: lang === l ? '#D4FF00' : colors.textSecondary, cursor: 'pointer' }}>
              {l === 'en' ? '🇬🇧 English' : '🇵🇱 Polski'}
            </button>
          ))}
        </div>
      </div>

      {/* Billing */}
      <div style={card}>
        {sectionLabel(t('billing'))}
        <div style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 8 }}>{t('manualInvoice')}</div>
        <div style={{ color: colors.textSecondary, fontSize: 13 }}>{t('stripeComingSoon')}</div>
      </div>
    </>
  )
}
