'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AddressInput from '@/components/AddressInput'
import { resolveLang } from '@/lib/lang'

const STRINGS = {
  pl: {
    title: 'Skonfiguruj swoje konto',
    step1: 'Rodzaj działalności',
    step2: 'Adres odbioru',
    step3: 'Preferencje',
    next: 'Dalej →',
    finish: 'Zacznij →',
    saving: 'Zapisywanie...',
    business_label: 'Czym się zajmujesz?',
    pickup_heading: 'Skąd zazwyczaj nadajesz paczki?',
    pickup_address: 'Adres odbioru',
    pickup_address_placeholder: 'ul. Piastów 1, Szczecin',
    contact_name: 'Imię i nazwisko do kontaktu',
    contact_phone: 'Telefon kontaktowy',
    contact_phone_placeholder: '+48 500 000 000',
    prefs_heading: 'Jak chcesz korzystać z portalu?',
    lang_label: 'Język interfejsu',
    required_field: 'To pole jest wymagane',
    business_types: [
      { id: 'restaurant', label: '🍽️ Restauracja / Gastronomia' },
      { id: 'shop', label: '🏪 Sklep stacjonarny' },
      { id: 'ecommerce', label: '📦 Sklep internetowy' },
      { id: 'other', label: '🏢 Inne' },
    ],
    languages: [
      { id: 'pl', label: '🇵🇱 Polski' },
      { id: 'en', label: '🇬🇧 English' },
      { id: 'uk', label: '🇺🇦 Українська' },
    ],
  },
  en: {
    title: 'Set up your account',
    step1: 'Business type',
    step2: 'Pickup address',
    step3: 'Preferences',
    next: 'Next →',
    finish: 'Get started →',
    saving: 'Saving...',
    business_label: 'What type of business are you?',
    pickup_heading: 'Where do you usually send packages from?',
    pickup_address: 'Pickup address',
    pickup_address_placeholder: 'ul. Piastów 1, Szczecin',
    contact_name: 'Contact name',
    contact_phone: 'Contact phone',
    contact_phone_placeholder: '+48 500 000 000',
    prefs_heading: 'How would you like to use the portal?',
    lang_label: 'Interface language',
    required_field: 'This field is required',
    business_types: [
      { id: 'restaurant', label: '🍽️ Restaurant / Food' },
      { id: 'shop', label: '🏪 Physical store' },
      { id: 'ecommerce', label: '📦 Online shop' },
      { id: 'other', label: '🏢 Other' },
    ],
    languages: [
      { id: 'pl', label: '🇵🇱 Polski' },
      { id: 'en', label: '🇬🇧 English' },
      { id: 'uk', label: '🇺🇦 Українська' },
    ],
  },
}

export default function OnboardingPage() {
  const router = useRouter()
  const [lang, setLang] = useState(() => resolveLang(null))
  const s = STRINGS[lang]
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const [form, setForm] = useState({
    businessType: '',
    pickupAddress: '',
    pickupLat: null,
    pickupLng: null,
    pickupContactName: '',
    pickupContactPhone: '',
    language: resolveLang(null),
  })

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const validate = () => {
    const errs = {}
    if (step === 1 && !form.businessType) errs.businessType = s.required_field
    if (step === 2 && !form.pickupAddress) errs.pickupAddress = s.required_field
    return errs
  }

  const handleNext = () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return }
    setFieldErrors({})
    setStep(prev => prev + 1)
  }

  const handleFinish = async () => {
    setSaving(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          business_type: form.businessType,
          pickup_address: form.pickupAddress,
          pickup_lat: form.pickupLat,
          pickup_lng: form.pickupLng,
          pickup_contact_name: form.pickupContactName,
          pickup_contact_phone: form.pickupContactPhone,
          language: form.language,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user['id'])

      if (updateError) throw updateError
      router.push('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  }

  const tileStyle = (selected) => ({
    padding: '16px 18px',
    border: '2px solid ' + (selected ? '#D4FF00' : '#E5E7EB'),
    borderRadius: 12,
    background: selected ? '#D4FF0015' : '#fff',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: 15,
    fontWeight: selected ? 700 : 400,
    color: '#111827',
    transition: 'all 0.15s',
  })

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F9FAFB',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{ maxWidth: 480, width: '100%' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-block',
            background: '#0A0A0A',
            borderRadius: 10,
            padding: '6px 14px',
            color: '#D4FF00',
            fontWeight: 900,
            fontSize: 20,
            letterSpacing: -0.5,
            marginBottom: 12,
          }}>L°</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#111827' }}>{s.title}</h1>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, justifyContent: 'center' }}>
          {[1, 2, 3].map(n => (
            <div key={n} style={{
              height: 4,
              flex: 1,
              borderRadius: 4,
              background: n <= step ? '#D4FF00' : '#E5E7EB',
              transition: 'background 0.2s',
            }} />
          ))}
        </div>

        {/* Step labels */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 24,
          fontSize: 11,
          color: '#9CA3AF',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}>
          <span style={{ color: step >= 1 ? '#111827' : '#9CA3AF', fontWeight: step === 1 ? 700 : 400 }}>{s.step1}</span>
          <span style={{ color: step >= 2 ? '#111827' : '#9CA3AF', fontWeight: step === 2 ? 700 : 400 }}>{s.step2}</span>
          <span style={{ color: step >= 3 ? '#111827' : '#9CA3AF', fontWeight: step === 3 ? 700 : 400 }}>{s.step3}</span>
        </div>

        {/* Card */}
        <div style={{
          background: '#fff',
          border: '1px solid #E5E7EB',
          borderRadius: 16,
          padding: '28px 24px',
          marginBottom: 16,
        }}>

          {/* Step 1: Business type */}
          {step === 1 && (
            <div>
              <p style={{ margin: '0 0 16px', fontSize: 15, color: '#374151', fontWeight: 500 }}>
                {s.business_label}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {s.business_types.map(bt => (
                  <button
                    key={bt['id']}
                    type="button"
                    onClick={() => { setField('businessType', bt['id']); setFieldErrors({}) }}
                    style={tileStyle(form.businessType === bt['id'])}
                  >
                    {bt.label}
                  </button>
                ))}
              </div>
              {fieldErrors.businessType && (
                <p style={{ color: '#EF4444', fontSize: 13, marginTop: 8 }}>{fieldErrors.businessType}</p>
              )}
            </div>
          )}

          {/* Step 2: Pickup address */}
          {step === 2 && (
            <div>
              <p style={{ margin: '0 0 16px', fontSize: 15, color: '#374151', fontWeight: 500 }}>
                {s.pickup_heading}
              </p>
              <div style={{ marginBottom: 14 }}>
                <AddressInput
                  label={s.pickup_address}
                  placeholder={s.pickup_address_placeholder}
                  addressType="pickup"
                  showSaved={false}
                  required={true}
                  onChange={(addr) => {
                    if (!addr) return
                    setField('pickupAddress', [addr.address, addr.city].filter(Boolean).join(', '))
                    setField('pickupLat', addr.lat)
                    setField('pickupLng', addr.lng)
                    setFieldErrors({})
                  }}
                />
                {fieldErrors.pickupAddress && (
                  <p style={{ color: '#EF4444', fontSize: 13, marginTop: 4 }}>{fieldErrors.pickupAddress}</p>
                )}
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
                  {s.contact_name}
                </label>
                <input
                  type="text"
                  value={form.pickupContactName}
                  onChange={e => setField('pickupContactName', e.target.value)}
                  placeholder="Jan Kowalski"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
                  {s.contact_phone}
                </label>
                <input
                  type="tel"
                  value={form.pickupContactPhone}
                  onChange={e => setField('pickupContactPhone', e.target.value)}
                  placeholder={s.contact_phone_placeholder}
                  style={inputStyle}
                />
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {step === 3 && (
            <div>
              <p style={{ margin: '0 0 16px', fontSize: 15, color: '#374151', fontWeight: 500 }}>
                {s.prefs_heading}
              </p>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 8 }}>
                  {s.lang_label}
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {s.languages.map(l => (
                    <button
                      key={l['id']}
                      type="button"
                      onClick={() => {
                        setField('language', l['id'])
                        setLang(l['id'] === 'uk' ? 'en' : l['id'])
                      }}
                      style={tileStyle(form.language === l['id'])}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {error && (
          <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</p>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 10 }}>
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(prev => prev - 1)}
              style={{
                flex: 1,
                padding: '14px',
                border: '1px solid #E5E7EB',
                borderRadius: 10,
                background: '#fff',
                fontSize: 15,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              ←
            </button>
          )}
          <button
            type="button"
            onClick={step < 3 ? handleNext : handleFinish}
            disabled={saving}
            style={{
              flex: 3,
              padding: '14px',
              border: 'none',
              borderRadius: 10,
              background: saving ? '#E5E7EB' : '#D4FF00',
              color: '#000',
              fontSize: 15,
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {saving ? s.saving : (step < 3 ? s.next : s.finish)}
          </button>
        </div>

      </div>
    </div>
  )
}
