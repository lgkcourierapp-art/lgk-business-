'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import AddressInput from '@/components/AddressInput'
import { PACKAGE_SIZES, getSizeById, calculatePrice, estimateBasePrice, applyPsychologicalPricing, getRoadDistanceKm, haversineDistance } from '@/lib/packageSizes'
import { emailOrderConfirmed } from '@/utils/emailService'
import { useApp } from '@/utils/appContext'
import { t } from '@/lib/strings'

const STRINGS = {
  pl: {
    title: 'Nowe zamówienie',
    step1: 'Paczka', step2: 'Odbiór', step3: 'Dostawa', step4: 'Podsumowanie',
    next: 'Dalej →', back: '← Wróć', submit: '✓ Złóż zamówienie',
    submitting: 'Tworzenie zamówienia...',
    qty_label: 'Liczba paczek',
    fragile: '🥚 Kruche',
    refrigerated: '❄️ Wymaga chłodzenia',
    requires_signature: '✍️ Podpis wymagany',
    from_price: 'od',
    quote_required: 'Wycena indywidualna — zadzwoń do nas',
    pickup_prefilled: 'Adres odbioru (z profilu)',
    pickup_address: 'Adres odbioru *',
    pickup_address_placeholder: 'Zacznij pisać adres...',
    ready_label: 'Kiedy paczka będzie gotowa?',
    ready_times: [
      { id: 'now', label: '🟢 Teraz (0–15 min)' },
      { id: '30min', label: '🕐 Za 30 minut' },
      { id: '1hr', label: '🕑 Za godzinę' },
      { id: 'custom', label: '📅 Inna godzina' },
    ],
    brama_label: 'Kod do bramy (opcjonalnie)',
    brama_placeholder: '#4321',
    brama_hint: 'Pomaga kurierowi wejść do budynku',
    pickup_notes_label: 'Wskazówki dla kuriera (odbiór)',
    pickup_notes_placeholder: 'np. Wejście od tyłu, piętro 2...',
    recipient_name: 'Imię i nazwisko odbiorcy *',
    recipient_phone: 'Telefon odbiorcy *',
    delivery_address: 'Adres dostawy *',
    delivery_address_placeholder: 'Zacznij pisać adres...',
    apartment: 'Piętro / mieszkanie',
    delivery_notes: 'Wskazówki dla kuriera (dostawa)',
    delivery_notes_placeholder: 'np. Domofon 15B, zostawić u sąsiadki...',
    delivery_pref: 'Preferowana pora dostawy',
    delivery_prefs: [
      { id: 'asap', label: '⚡ Jak najszybciej' },
      { id: 'morning', label: '🌅 Rano (8–12)' },
      { id: 'afternoon', label: '☀️ Południe (12–17)' },
      { id: 'evening', label: '🌙 Wieczór (17–21)' },
    ],
    sms_note: 'otrzyma SMS o statusie dostawy',
    eta_note: 'Szacowany czas dostawy: ~40 min po odbiorze',
    payment_title: 'Płatność',
    payment_revolut: 'Zapłać przez Revolut',
    payment_note: 'Otwórz link i opłać zamówienie. Kurier wyjedzie po potwierdzeniu płatności.',
    submit_revolut: '✓ Złóż zamówienie i zapłać',
    summary_package: 'Paczka',
    summary_pickup: 'Odbiór',
    summary_delivery: 'Dostawa',
    summary_recipient: 'Odbiorca',
    summary_price: 'Cena',
    field_required: 'To pole jest wymagane',
    phone_invalid: 'Podaj prawidłowy numer telefonu',
  },
  en: {
    title: 'New order',
    step1: 'Package', step2: 'Pickup', step3: 'Delivery', step4: 'Summary',
    next: 'Next →', back: '← Back', submit: '✓ Place order',
    submitting: 'Creating order...',
    qty_label: 'Number of packages',
    fragile: '🥚 Fragile',
    refrigerated: '❄️ Requires refrigeration',
    requires_signature: '✍️ Signature required',
    from_price: 'from',
    quote_required: 'Custom quote — call us',
    pickup_prefilled: 'Pickup address (from profile)',
    pickup_address: 'Pickup address *',
    pickup_address_placeholder: 'Start typing address...',
    ready_label: 'When will the package be ready?',
    ready_times: [
      { id: 'now', label: '🟢 Now (0–15 min)' },
      { id: '30min', label: '🕐 In 30 minutes' },
      { id: '1hr', label: '🕑 In 1 hour' },
      { id: 'custom', label: '📅 Choose time' },
    ],
    brama_label: 'Gate access code (optional)',
    brama_placeholder: '#4321',
    brama_hint: 'Helps our courier access the building',
    pickup_notes_label: 'Notes for courier (pickup)',
    pickup_notes_placeholder: 'e.g. Back entrance, 2nd floor...',
    recipient_name: 'Recipient name *',
    recipient_phone: 'Recipient phone *',
    delivery_address: 'Delivery address *',
    delivery_address_placeholder: 'Start typing address...',
    apartment: 'Floor / apartment',
    delivery_notes: 'Notes for courier (delivery)',
    delivery_notes_placeholder: 'e.g. Intercom 15B, leave with neighbour...',
    delivery_pref: 'Preferred delivery time',
    delivery_prefs: [
      { id: 'asap', label: '⚡ As soon as possible' },
      { id: 'morning', label: '🌅 Morning (8–12)' },
      { id: 'afternoon', label: '☀️ Afternoon (12–17)' },
      { id: 'evening', label: '🌙 Evening (17–21)' },
    ],
    sms_note: 'will receive SMS delivery updates',
    eta_note: 'Estimated delivery: ~40 min after pickup',
    payment_title: 'Payment',
    payment_revolut: 'Pay via Revolut',
    payment_note: 'Open the link and pay. Courier departs after payment is confirmed.',
    submit_revolut: '✓ Place order & pay',
    summary_package: 'Package',
    summary_pickup: 'Pickup',
    summary_delivery: 'Delivery',
    summary_recipient: 'Recipient',
    summary_price: 'Price',
    field_required: 'This field is required',
    phone_invalid: 'Enter a valid phone number',
  },
}

const SESSION_KEY = 'lgk_new_order_form'
const STEP_KEY = 'lgk_new_order_step'

export default function NewOrderPage() {
  const router = useRouter()
  const { colors, lang: appLang, setLang } = useApp()
  const s = STRINGS[appLang] || STRINGS.en
  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState(null)
  const [showPickupOverride, setShowPickupOverride] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [price, setPrice] = useState(null)
  const [orderMode, setOrderMode] = useState('parcel')
  const [roadDistanceKm, setRoadDistanceKm] = useState(null)
  const [fetchingDistance, setFetchingDistance] = useState(false)

  const displayPrice = price !== null ? applyPsychologicalPricing(price) : null

  useEffect(() => { document.title = t(appLang, 'pageNewOrder') }, [appLang])
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [])
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [step])

  const [form, setForm] = useState({
    packageSize: 'standard',
    quantity: 1,
    isFragile: false,
    isRefrigerated: false,
    requiresSignature: false,
    pickupAddress: '',
    pickupLat: null,
    pickupLng: null,
    readyTime: 'now',
    customReadyTime: '',
    bramaCode: '',
    pickupNotes: '',
    recipientName: '',
    recipientPhone: '',
    deliveryAddress: '',
    deliveryStreet: '',
    deliveryCity: 'Szczecin',
    deliveryPostcode: '',
    deliveryLat: null,
    deliveryLng: null,
    deliveryApartment: '',
    deliveryNotes: '',
    deliveryPref: 'asap',
    paymentMethod: 'revolut',
    pickupAddressOverride: '',
    pickupLatOverride: null,
    pickupLngOverride: null,
  })

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY)
      if (saved) setForm(JSON.parse(saved))
      const savedStep = sessionStorage.getItem(STEP_KEY)
      if (savedStep) {
        const n = parseInt(savedStep, 10)
        if (n >= 1 && n <= 4) setStep(n)
      }
    } catch {}
  }, [])

  useEffect(() => {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(form)) } catch {}
  }, [form])

  useEffect(() => {
    try { sessionStorage.setItem(STEP_KEY, step.toString()) } catch {}
  }, [step])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data } = await supabase
        .from('profiles')
        .select('id, pickup_address, pickup_lat, pickup_lng, pickup_contact_name, pickup_contact_phone, business_type, language, onboarding_completed')
        .eq('id', user['id'])
        .single()
      if (data) {
        setProfile(data)
        if (data.language) setLang(data.language)
        if (data.business_type === 'restaurant') {
          setOrderMode('restaurant')
          setForm(prev => ({ ...prev, readyTime: '15min' }))
        }
        if (data.pickup_address) {
          setForm(prev => ({
            ...prev,
            pickupAddress: data.pickup_address || prev.pickupAddress,
            pickupLat: data.pickup_lat || prev.pickupLat,
            pickupLng: data.pickup_lng || prev.pickupLng,
          }))
        }
      }
    })
  }, [router])

  useEffect(() => {
    const pickupLat = form.pickupLat || profile?.pickup_lat
    const pickupLng = form.pickupLng || profile?.pickup_lng
    const distanceKm = roadDistanceKm ||
      (form.deliveryLat && pickupLat
        ? haversineDistance(pickupLat, pickupLng, form.deliveryLat, form.deliveryLng)
        : null)
    const calculated = calculatePrice({
      sizeId: form.packageSize,
      distanceKm,
      isFragile: form.isFragile,
      isRefrigerated: form.isRefrigerated,
    })
    setPrice(calculated)
  }, [
    roadDistanceKm, form.packageSize, form.deliveryLat,
    form.isFragile, form.isRefrigerated,
    form.pickupLat, form.pickupLng,
    profile,
  ])

  const validateStep = useCallback(() => {
    const errs = {}
    if (step === 1) {
      const size = getSizeById(form.packageSize)
      if (size.requiresQuote) errs.packageSize = s.quote_required
    }
    if (step === 2) {
      if (!form.pickupAddress) errs.pickupAddress = s.field_required
    }
    if (step === 3) {
      if (!form.recipientName.trim()) errs.recipientName = s.field_required
      if (!form.recipientPhone.trim()) errs.recipientPhone = s.field_required
      else if (!/^\+?[\d\s\-]{7,20}$/.test(form.recipientPhone)) errs.recipientPhone = s.phone_invalid
      if (!form.deliveryAddress.trim()) errs.deliveryAddress = s.field_required
    }
    return errs
  }, [step, form, s])

  const generateOrderNumber = async () => {
    try {
      const { data, error } = await supabase.rpc('get_next_order_sequence')
      if (!error && data) {
        const year = new Date().getFullYear()
        return `SZ-${String(data).padStart(4, '0')}-${year}`
      }
    } catch {}
    return `SZ-${Date.now().toString(36).toUpperCase()}`
  }

  const handleDeliveryChange = (addr) => {
    if (!addr) return
    setField('deliveryAddress', [addr.street, addr.houseNumber].filter(Boolean).join(' ') || addr.address || '')
    setField('deliveryStreet', addr.street || addr.address || '')
    setField('deliveryCity', addr.city || 'Szczecin')
    setField('deliveryPostcode', addr.postcode || '')
    setField('deliveryLat', addr.lat)
    setField('deliveryLng', addr.lng)
    if (addr.autofillName  && !form.recipientName)   setField('recipientName',  addr.autofillName)
    if (addr.autofillPhone && !form.recipientPhone)  setField('recipientPhone', addr.autofillPhone)
    if (addr.autofillNotes && !form.deliveryNotes)   setField('deliveryNotes',  addr.autofillNotes)
    setFieldErrors(e => ({ ...e, deliveryAddress: undefined }))
    if (addr.lat && addr.lng) {
      const pickupLat = form.pickupLat || profile?.pickup_lat
      const pickupLng = form.pickupLng || profile?.pickup_lng
      if (pickupLat && pickupLng) {
        setFetchingDistance(true)
        getRoadDistanceKm(pickupLat, pickupLng, addr.lat, addr.lng, process.env.NEXT_PUBLIC_HERE_API_KEY)
          .then(km => { setRoadDistanceKm(km); setFetchingDistance(false) })
          .catch(() => setFetchingDistance(false))
      }
    } else {
      setRoadDistanceKm(null)
    }
  }

  const handleNext = () => {
    const errs = validateStep()
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return }
    setFieldErrors({})
    setStep(prev => prev + 1)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('[NewOrder] submit', { form, orderMode, price })
      }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const readyMinutes = { now: 15, '15min': 15, '30min': 30, '1hr': 60, custom: 90 }[form.readyTime] || 15
      const estimatedPickup = new Date(Date.now() + readyMinutes * 60 * 1000)
      const estimatedDelivery = new Date(estimatedPickup.getTime() + 40 * 60 * 1000)
      const pickupDeadline = new Date(Date.now() + 30 * 60 * 1000)

      const effectivePickupAddress = form.pickupAddressOverride || profile?.pickup_address || form.pickupAddress
      const effectivePickupLat = form.pickupLatOverride ?? form.pickupLat ?? profile?.pickup_lat
      const effectivePickupLng = form.pickupLngOverride ?? form.pickupLng ?? profile?.pickup_lng

      const orderNumber = await generateOrderNumber()

      const deliveryFull = [form.deliveryAddress, form.deliveryApartment]
        .filter(Boolean).join(', ')

      const { data: order, error: insertError } = await supabase
        .from('deliveries')
        .insert({
          order_number: orderNumber,
          client_id: user['id'],
          status: 'pending',
          order_source: 'portal',
          payment_status: 'awaiting',
          payment_method: form.paymentMethod,
          package_type: form.packageSize,
          package_quantity: form.quantity,
          is_fragile: form.isFragile,
          is_refrigerated: form.isRefrigerated,
          requires_signature: form.requiresSignature,
          pickup_address: effectivePickupAddress,
          pickup_lat: effectivePickupLat,
          pickup_lng: effectivePickupLng,
          pickup_contact_name: profile?.pickup_contact_name || '',
          pickup_contact_phone: profile?.pickup_contact_phone || '',
          pickup_notes: form.pickupNotes || '',
          pickup_access_code: form.bramaCode || null,
          pickup_deadline: pickupDeadline.toISOString(),
          delivery_address: deliveryFull,
          delivery_street: form.deliveryStreet,
          delivery_city: form.deliveryCity,
          delivery_postal_code: form.deliveryPostcode,
          delivery_lat: form.deliveryLat,
          delivery_lng: form.deliveryLng,
          delivery_notes: form.deliveryNotes || '',
          delivery_contact_name: form.recipientName,
          delivery_contact_phone: form.recipientPhone,
          recipient_name: form.recipientName,
          recipient_phone: form.recipientPhone,
          amount_pln: displayPrice ?? price,
          price_total: displayPrice ?? price,
          distance_km: roadDistanceKm,
          time_window: form.deliveryPref,
          estimated_pickup_at: estimatedPickup.toISOString(),
          estimated_delivery_at: estimatedDelivery.toISOString(),
          country: 'PL',
          market_currency: 'PLN',
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (insertError) throw insertError
      if (!order) throw new Error('Order creation returned no data')

      try {
        const { data: prof } = await supabase
          .from('profiles')
          .select('email, company_name')
          .eq('id', user['id'])
          .single()
        if (prof?.email) {
          emailOrderConfirmed(
            { id: order['id'], order_number: orderNumber, price_total: price, pickup_address: form.pickupAddress, delivery_address: deliveryFull },
            prof.email,
            prof.company_name || ''
          ).catch(() => {})
        }
      } catch {}

      try { sessionStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(STEP_KEY) } catch {}
      router.push('/orders/' + order['id'] + '?created=true')
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const readyTimes = orderMode === 'restaurant'
    ? [
        { id: '15min', label: t(appLang, 'order.ready15') },
        { id: '30min', label: t(appLang, 'order.ready30') },
        { id: '1hr', label: t(appLang, 'order.ready1hr') },
        { id: 'custom', label: t(appLang, 'order.readyCustom') },
      ]
    : [
        { id: 'now', label: t(appLang, 'order.readyNow') },
        { id: '30min', label: t(appLang, 'order.ready30') },
        { id: '1hr', label: t(appLang, 'order.ready1hr') },
        { id: 'custom', label: t(appLang, 'order.readyCustom') },
      ]

  const cardStyle = {
    background: colors.card,
    border: '1px solid ' + colors.border,
    borderRadius: 12,
    padding: '20px 24px',
    marginBottom: 16,
  }

  const pillStyle = (active) => ({
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid ' + (active ? '#D4FF00' : colors.border),
    background: active ? '#D4FF00' : colors.bg,
    color: active ? '#0A0A0A' : colors.textSecondary,
    fontWeight: active ? 700 : 400,
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'left',
  })

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    background: colors.bg,
    border: '1px solid ' + colors.border,
    borderRadius: 8,
    color: colors.text,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  }

  const labelStyle = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 16,
  }

  const fieldErr = (key) => fieldErrors[key] && (
    <p style={{ color: '#FF3B30', fontSize: 12, marginTop: 4, marginBottom: 0 }}>{fieldErrors[key]}</p>
  )

  const STEP_LABELS = [s.step1, s.step2, s.step3, s.step4]

  return (
    <div style={{ minHeight: '100vh', background: colors.bg }}>
      <main style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px', paddingBottom: 140 }}>

        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, color: colors.text }}>{s.title}</h1>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          {STEP_LABELS.map((label, i) => (
            <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{
                height: 3,
                borderRadius: 3,
                background: i + 1 <= step ? '#D4FF00' : colors.border,
                transition: 'background 0.2s',
              }} />
              <span style={{
                fontSize: 10,
                color: i + 1 === step ? '#111827' : colors.textSecondary,
                fontWeight: i + 1 === step ? 700 : 400,
                letterSpacing: 0.3,
                borderBottom: i + 1 === step ? '2px solid #D4FF00' : 'none',
                paddingBottom: 1,
              }}>{label}</span>
            </div>
          ))}
        </div>

        {/* ── STEP 1: PACKAGE ── */}
        {step === 1 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
              {PACKAGE_SIZES.map(size => {
                const selected = form.packageSize === size['id']
                const basePrice = estimateBasePrice(size['id'])
                return (
                  <button
                    key={size['id']}
                    type="button"
                    onClick={() => { setField('packageSize', size['id']); setFieldErrors({}) }}
                    style={{
                      padding: '16px',
                      border: selected ? '2.5px solid #0A0A0A' : '1px solid ' + colors.border,
                      borderRadius: 12,
                      background: selected ? '#F0F0F0' : colors.card,
                      color: colors.text,
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                      position: 'relative',
                    }}
                  >
                    {selected && (
                      <div style={{
                        position: 'absolute', top: 10, right: 10,
                        width: 24, height: 24, borderRadius: '50%',
                        background: '#0A0A0A', color: '#D4FF00',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700,
                      }}>✓</div>
                    )}
                    {!selected && size.recommended && (
                      <div style={{
                        position: 'absolute', top: 8, right: 8,
                        background: '#D4FF00', color: '#0A0A0A',
                        fontSize: 9, fontWeight: 700, padding: '2px 6px',
                        borderRadius: 4, letterSpacing: 0.3,
                      }}>★ Popularna</div>
                    )}
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{size.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, color: colors.text }}>
                      {appLang === 'pl' ? size.labelPL : size.labelEN}
                    </div>
                    <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 6 }}>
                      {appLang === 'pl' ? size.descPL : size.descEN}
                    </div>
                    <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 6 }}>
                      {appLang === 'pl' ? size.examplesPL : size.examplesEN}
                    </div>
                    <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 6 }}>
                      {size.maxWeightLabel}
                    </div>
                    {size.requiresQuote ? (
                      <div style={{ fontSize: 11, color: '#FF9500', fontWeight: 600 }}>
                        {s.quote_required}
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: '#111827', fontWeight: 700 }}>
                        {s.from_price} PLN {basePrice?.toFixed(2)}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
            {fieldErr('packageSize')}

            <div style={{ ...cardStyle, marginTop: 16 }}>
              <label style={{ ...labelStyle, marginTop: 0 }}>{s.qty_label}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <button
                  type="button"
                  onClick={() => setField('quantity', Math.max(1, form.quantity - 1))}
                  style={{ width: 40, height: 40, borderRadius: 8, border: '1px solid ' + colors.border, background: colors.bg, color: colors.text, fontSize: 20, cursor: 'pointer', fontFamily: 'inherit' }}
                >−</button>
                <span style={{ fontSize: 20, fontWeight: 700, color: colors.text, minWidth: 24, textAlign: 'center' }}>{form.quantity}</span>
                <button
                  type="button"
                  onClick={() => setField('quantity', Math.min(99, form.quantity + 1))}
                  style={{ width: 40, height: 40, borderRadius: 8, border: '1px solid ' + colors.border, background: colors.bg, color: colors.text, fontSize: 20, cursor: 'pointer', fontFamily: 'inherit' }}
                >+</button>
              </div>
            </div>

            <div style={cardStyle}>
              {[
                { key: 'isFragile', label: s.fragile },
                { key: 'isRefrigerated', label: s.refrigerated },
                { key: 'requiresSignature', label: s.requires_signature },
              ].map(({ key, label }, idx, arr) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '8px 0', borderBottom: idx < arr.length - 1 ? '1px solid ' + colors.border : 'none' }}>
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={e => setField(key, e.target.checked)}
                    style={{ accentColor: '#D4FF00', width: 18, height: 18, flexShrink: 0 }}
                  />
                  <span style={{ color: colors.text, fontSize: 14 }}>{label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2: PICKUP ── */}
        {step === 2 && (
          <div style={{ marginTop: 20 }}>
            <div style={cardStyle}>
              {/* Read-only card from profile */}
              <div style={{ border: '0.5px solid ' + colors.border, borderRadius: 8, padding: '12px 14px', background: colors.bg, marginBottom: 12 }}>
                <p style={{ fontSize: 10, color: colors.textSecondary, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {t(appLang, orderMode === 'restaurant' ? 'order.pickupRestaurant' : 'order.pickupFromProfile')}
                </p>
                <p style={{ fontSize: 14, fontWeight: 500, margin: '0 0 2px', color: colors.text }}>
                  {profile?.pickup_address || t(appLang, 'order.noAddress')}
                </p>
                {profile?.pickup_contact_name && (
                  <p style={{ fontSize: 12, color: colors.textSecondary, margin: 0 }}>
                    {profile.pickup_contact_name}{profile.pickup_contact_phone ? ' · ' + profile.pickup_contact_phone : ''}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => setShowPickupOverride(v => !v)}
                  style={{ fontSize: 11, color: '#2563EB', background: 'none', border: 'none', padding: '4px 0 0', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}
                >
                  {showPickupOverride
                    ? t(appLang, 'order.useProfileAddress')
                    : t(appLang, 'order.changePickup')}
                </button>
              </div>
              {showPickupOverride && (
                <div style={{ marginBottom: 4 }}>
                  <AddressInput
                    label={t(appLang, 'order.differentPickup')}
                    placeholder={s.pickup_address_placeholder}
                    addressType="pickup"
                    clientId={profile?.['id']}
                    showSaved={false}
                    required={false}
                    onChange={(addr) => {
                      if (!addr) { setField('pickupAddressOverride', ''); setField('pickupLatOverride', null); setField('pickupLngOverride', null); return }
                      setField('pickupAddressOverride', [addr.address, addr.city].filter(Boolean).join(', '))
                      setField('pickupLatOverride', addr.lat)
                      setField('pickupLngOverride', addr.lng)
                    }}
                  />
                  <p style={{ fontSize: 11, color: colors.textSecondary, margin: '4px 0 0' }}>
                    {t(appLang, 'order.orderOnly')}
                  </p>
                </div>
              )}
            </div>

            {orderMode === 'restaurant' && (
              <p style={{ fontSize: 12, color: colors.textSecondary, margin: '0 0 12px', padding: '10px 14px', background: '#D4FF0010', borderRadius: 8, border: '1px solid #D4FF0030' }}>
                {t(appLang, 'order.restaurantNote')}
              </p>
            )}

            <div style={cardStyle}>
              <label style={{ ...labelStyle, marginTop: 0 }}>{s.ready_label}</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {readyTimes.map(rt => (
                  <button
                    key={rt['id']}
                    type="button"
                    onClick={() => setField('readyTime', rt['id'])}
                    style={pillStyle(form.readyTime === rt['id'])}
                  >
                    {rt.label}
                  </button>
                ))}
              </div>
              {form.readyTime === 'custom' && (
                <input
                  type="time"
                  value={form.customReadyTime}
                  onChange={e => setField('customReadyTime', e.target.value)}
                  style={{ ...inputStyle, marginTop: 10 }}
                />
              )}
            </div>

            <div style={cardStyle}>
              <label style={{ ...labelStyle, marginTop: 0 }}>{s.brama_label}</label>
              <input
                type="text"
                value={form.bramaCode}
                onChange={e => setField('bramaCode', e.target.value)}
                placeholder={s.brama_placeholder}
                style={inputStyle}
              />
              <p style={{ fontSize: 11, color: colors.textSecondary, marginTop: 6, marginBottom: 0 }}>
                {s.brama_hint}
              </p>

              <label style={labelStyle}>{s.pickup_notes_label}</label>
              <textarea
                value={form.pickupNotes}
                onChange={e => setField('pickupNotes', e.target.value)}
                placeholder={s.pickup_notes_placeholder}
                rows={2}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>
          </div>
        )}

        {/* ── STEP 3: DELIVERY ── */}
        {step === 3 && (
          <div style={{ marginTop: 20 }}>
            <div style={cardStyle}>
              <label style={{ ...labelStyle, marginTop: 0 }}>
                {orderMode === 'restaurant' ? t(appLang, 'order.restaurantRecipient') : s.recipient_name}
              </label>
              <input
                type="text"
                value={form.recipientName}
                onChange={e => setField('recipientName', e.target.value)}
                placeholder="Anna Kowalska"
                style={inputStyle}
              />
              {fieldErr('recipientName')}

              <label style={labelStyle}>{s.recipient_phone}</label>
              <input
                type="tel"
                value={form.recipientPhone}
                onChange={e => setField('recipientPhone', e.target.value)}
                placeholder="+48 500 000 000"
                style={inputStyle}
              />
              {fieldErr('recipientPhone')}
              {form.recipientPhone && !fieldErrors.recipientPhone && (
                <p style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4, marginBottom: 0 }}>
                  {form.recipientName ? `${form.recipientName} ${s.sms_note}` : s.sms_note}
                </p>
              )}
            </div>

            <div style={cardStyle}>
              <AddressInput
                label={s.delivery_address}
                placeholder={s.delivery_address_placeholder}
                addressType="delivery"
                clientId={profile?.['id']}
                showSaved={true}
                required={true}
                onChange={handleDeliveryChange}
              />
              {fetchingDistance && (
                <p style={{ fontSize: 12, color: '#9CA3AF', margin: '4px 0 0' }}>
                  {appLang === 'pl' ? 'Obliczanie trasy...' : 'Calculating route...'}
                </p>
              )}
              {roadDistanceKm && !fetchingDistance && (
                <p style={{ fontSize: 12, color: colors.textSecondary, margin: '4px 0 0' }}>
                  {appLang === 'pl' ? `Trasa: ${roadDistanceKm.toFixed(1)} km drogi` : `Route: ${roadDistanceKm.toFixed(1)} km by road`}
                </p>
              )}
              {fieldErr('deliveryAddress')}

              <label style={labelStyle}>{s.apartment}</label>
              <input
                type="text"
                value={form.deliveryApartment}
                onChange={e => setField('deliveryApartment', e.target.value)}
                placeholder="m. 5 / pięt. 2"
                style={inputStyle}
              />
            </div>

            <div style={cardStyle}>
              <label style={{ ...labelStyle, marginTop: 0 }}>{s.delivery_pref}</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {s.delivery_prefs.map(dp => (
                  <button
                    key={dp['id']}
                    type="button"
                    onClick={() => setField('deliveryPref', dp['id'])}
                    style={pillStyle(form.deliveryPref === dp['id'])}
                  >
                    {dp.label}
                  </button>
                ))}
              </div>

              <label style={labelStyle}>{s.delivery_notes}</label>
              <textarea
                value={form.deliveryNotes}
                onChange={e => setField('deliveryNotes', e.target.value)}
                placeholder={s.delivery_notes_placeholder}
                rows={2}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            {displayPrice !== null && form.deliveryLat && (
              <div style={{ ...cardStyle, border: '2px solid #D4FF00' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: colors.textSecondary, fontSize: 14 }}>{s.summary_price}</span>
                  <span style={{ color: '#111827', fontWeight: 900, fontSize: 28, fontFamily: "'Fira Code', monospace" }}>
                    PLN {displayPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 4: SUMMARY ── */}
        {step === 4 && (
          <div style={{ marginTop: 20 }}>
            <div style={cardStyle}>
              {[
                { label: s.summary_package, value: (() => { const sz = getSizeById(form.packageSize); return (appLang === 'pl' ? sz.labelPL : sz.labelEN) + ' × ' + form.quantity })() },
                { label: s.summary_pickup, value: form.pickupAddress },
                { label: s.summary_delivery, value: [form.deliveryAddress, form.deliveryApartment].filter(Boolean).join(', ') },
                { label: s.summary_recipient, value: form.recipientName + ' · ' + form.recipientPhone },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid ' + colors.border }}>
                  <span style={{ fontSize: 12, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 0, marginRight: 16 }}>{label}</span>
                  <span style={{ fontSize: 13, color: colors.text, fontWeight: 500, textAlign: 'right' }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ ...cardStyle, border: '2px solid #D4FF00', textAlign: 'center', padding: '24px' }}>
              <div style={{ color: colors.textSecondary, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{s.summary_price}</div>
              <div style={{ color: '#111827', fontWeight: 900, fontSize: 40, fontFamily: "'Fira Code', monospace", marginBottom: 8 }}>
                PLN {displayPrice?.toFixed(2) ?? '—'}
              </div>
              <div style={{ color: colors.textSecondary, fontSize: 12 }}>{s.eta_note}</div>
              {roadDistanceKm && (
                <div style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                  {appLang === 'pl' ? `Trasa: ${roadDistanceKm.toFixed(1)} km drogi` : `Route: ${roadDistanceKm.toFixed(1)} km by road`}
                </div>
              )}
              {form.recipientPhone && (
                <div style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                  {form.recipientName ? `${form.recipientName} ${s.sms_note}` : s.sms_note}
                </div>
              )}
            </div>

            <div style={cardStyle}>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#111827', margin: '0 0 10px' }}>
                {s.payment_title}
              </p>
              <a
                href={process.env.NEXT_PUBLIC_REVOLUT_USER ? `https://revolut.me/${process.env.NEXT_PUBLIC_REVOLUT_USER}` : (process.env.NEXT_PUBLIC_REVOLUT_LINK || '#')}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 14px',
                  background: '#191C20',
                  borderRadius: 8, textDecoration: 'none', marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 20 }}>💳</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#fff', margin: 0 }}>
                    {s.payment_revolut}
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: '2px 0 0' }}>
                    {process.env.NEXT_PUBLIC_REVOLUT_USER ? `revolut.me/${process.env.NEXT_PUBLIC_REVOLUT_USER}` : '...'} → PLN {displayPrice != null ? parseFloat(displayPrice).toFixed(2) : ''}
                  </p>
                </div>
              </a>
              <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>
                {s.payment_note}
              </p>
            </div>
          </div>
        )}

      </main>

      {/* Fixed bottom bar */}
      <div className="portal-bottom-bar" style={{ position: 'fixed', bottom: 0, right: 0, background: colors.card, borderTop: '1px solid ' + colors.border, padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100, gap: 12 }}>
        {error && (
          <div style={{ position: 'absolute', top: '-44px', left: 0, right: 0, background: '#FF3B3020', borderTop: '1px solid #FF3B30', padding: '10px 24px', color: '#FF6B6B', fontSize: 13 }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, flex: 1 }}>
          {step > 1 && (
            <button
              type="button"
              onClick={() => { setStep(prev => prev - 1); setFieldErrors({}) }}
              style={{ padding: '12px 20px', border: '1px solid ' + colors.border, borderRadius: 10, background: 'transparent', color: colors.text, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {s.back}
            </button>
          )}
          {step < 4 && (
            <button
              type="button"
              onClick={handleNext}
              className="btn-primary"
              style={{ flex: 1, height: 48, fontSize: 15 }}
            >
              {s.next}
            </button>
          )}
          {step === 4 && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary"
              style={{ flex: 1, height: 48, fontSize: 15, opacity: submitting ? 0.6 : 1 }}
            >
              {submitting ? s.submitting : s.submit_revolut}
            </button>
          )}
        </div>
        {displayPrice !== null && step >= 3 && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase' }}>{s.summary_price}</div>
            <div style={{ color: '#111827', fontWeight: 900, fontSize: 20, fontFamily: "'Fira Code', monospace" }}>PLN {displayPrice.toFixed(2)}</div>
          </div>
        )}
      </div>
    </div>
  )
}
