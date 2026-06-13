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
import { getRouteSnapshotUrl, getRouteData, mapyAutocomplete } from '@/lib/mapyService'
import { fetchWeatherSzczecin } from '@/lib/weatherService'

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
    submit_revolut: '💳 Zamawiam i płacę',
    summary_package: 'Paczka',
    summary_pickup: 'Odbiór',
    summary_delivery: 'Dostawa',
    summary_recipient: 'Odbiorca',
    summary_price: 'Cena',
    field_required: 'To pole jest wymagane',
    phone_invalid: 'Podaj prawidłowy numer telefonu',
    popular: '★ Popularna',
    weather_now: 'Teraz', weather_evening: 'Wieczór', weather_night: 'Noc',
    calculating: 'Obliczanie trasy...',
    route_label: 'Trasa:',
    route_bike: 'Trasa rowerowa · Mapy.com',
    route_bike_short: 'Trasa rowerowa',
    route_arrival: 'Dotarcie ~',
    bike_info: 'Twój kurier może poruszać się rowerem — czas dostawy może być o kilka minut dłuższy niż szacowany.',
    bike_info_bold: 'Rower omija korki i dociera tam, gdzie samochód nie dotrze.',
    courier_ready_title: 'Kurier gotowy do wyjazdu',
    courier_ready_desc: 'Wyruszy natychmiast po potwierdzeniu płatności',
    track_live_title: 'Śledź status dostawy',
    track_live_desc: 'Po opłaceniu możesz śledzić status zamówienia — śledzenie na żywo wkrótce',
    cancellation_note: 'Anulowanie po przypisaniu kuriera: PLN 15.00',
    food_value_label: 'Wartość jedzenia (PLN) *',
    food_value_placeholder: 'np. 45.00',
    commission_label: 'Prowizja LGK (10%)',
    delivery_fee_label: 'Opłata za dostawę',
    food_order_label: 'Zamówienie',
    customer_total_label: 'Do zapłaty',
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
    popular: '★ Popular',
    weather_now: 'Now', weather_evening: 'Evening', weather_night: 'Night',
    calculating: 'Calculating route...',
    route_label: 'Route:',
    route_bike: 'Bike route · Mapy.com',
    route_bike_short: 'Bike route',
    route_arrival: 'ETA ~',
    bike_info: 'Your courier may be on a bike — delivery could take a few minutes longer than estimated.',
    bike_info_bold: 'Bikes skip traffic entirely and reach places cars simply can\'t.',
    courier_ready_title: 'Courier ready to depart',
    courier_ready_desc: 'Will depart immediately after payment is confirmed',
    track_live_title: 'Track your delivery',
    track_live_desc: 'After payment you can track your order status — live courier tracking coming soon',
    cancellation_note: 'Cancellation after courier assignment: PLN 15.00',
    food_value_label: 'Food order value (PLN) *',
    food_value_placeholder: 'e.g. 45.00',
    commission_label: 'LGK commission (10%)',
    delivery_fee_label: 'Delivery fee',
    food_order_label: 'Food order',
    customer_total_label: 'Total to pay',
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
  const [foodValue, setFoodValue] = useState('')
  const [roadDistanceKm, setRoadDistanceKm] = useState(null)
  const [fetchingDistance, setFetchingDistance] = useState(false)
  const [snapshotUrl, setSnapshotUrl] = useState(null)
  const [routeData, setRouteData] = useState(null)
  const [weather, setWeather] = useState(null)

  const displayPrice = price !== null ? applyPsychologicalPricing(price) : null
  const commissionPln = orderMode === 'restaurant' && parseFloat(foodValue) > 0
    ? Math.round(parseFloat(foodValue) * 0.10 * 100) / 100
    : 0
  const customerTotal = orderMode === 'restaurant' && parseFloat(foodValue) > 0 && displayPrice !== null
    ? Math.round((parseFloat(foodValue) + commissionPln + displayPrice) * 100) / 100
    : null
  const effectiveDisplayPrice = orderMode === 'restaurant' ? customerTotal : displayPrice

  useEffect(() => { fetchWeatherSzczecin().then(setWeather) }, [])

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
        const isRestaurant = data.business_type === 'restaurant'
        setOrderMode(isRestaurant ? 'restaurant' : 'parcel')
        if (isRestaurant) setForm(prev => ({ ...prev, readyTime: '15min' }))
        if (data.pickup_address) {
          if (data.pickup_lat && data.pickup_lng) {
            setForm(prev => ({
              ...prev,
              pickupAddress: data.pickup_address,
              pickupLat: data.pickup_lat,
              pickupLng: data.pickup_lng,
            }))
          } else {
            // Coordinates missing — geocode the saved address text and persist to profile.
            // Strip postcode/city portion (everything after first comma) so Mapy suggest
            // doesn't return 422 on queries containing commas.
            setForm(prev => ({ ...prev, pickupAddress: data.pickup_address }))
            const geocodeQuery = data.pickup_address.split(',')[0].trim()
            const results = await mapyAutocomplete(geocodeQuery)
            if (results.length > 0) {
              const { lat, lng } = results[0]
              if (lat && lng) {
                setForm(prev => ({ ...prev, pickupLat: lat, pickupLng: lng }))
                supabase.from('profiles').update({ pickup_lat: lat, pickup_lng: lng }).eq('id', data.id).then(() => {})
              }
            }
          }
        }
      }
    })
  }, [router])

  // Re-read business_type when settings dispatches lgk-profile-updated
  useEffect(() => {
    const userId = profile?.['id']
    if (!userId) return
    const reloadMode = async () => {
      const { data } = await supabase.from('profiles').select('business_type').eq('id', userId).single()
      if (data) setOrderMode(data.business_type === 'restaurant' ? 'restaurant' : 'parcel')
    }
    window.addEventListener('lgk-profile-updated', reloadMode)
    return () => window.removeEventListener('lgk-profile-updated', reloadMode)
  }, [profile?.['id']])

  // Re-read on tab focus / visibility (covers browser back-navigation)
  useEffect(() => {
    const userId = profile?.['id']
    if (!userId) return
    const reloadMode = async () => {
      const { data } = await supabase.from('profiles').select('business_type').eq('id', userId).single()
      if (data) setOrderMode(data.business_type === 'restaurant' ? 'restaurant' : 'parcel')
    }
    const onVisibility = () => { if (!document.hidden) reloadMode() }
    window.addEventListener('focus', reloadMode)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('focus', reloadMode)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [profile?.['id']])

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
      if (orderMode === 'restaurant' && (!foodValue || parseFloat(foodValue) <= 0)) errs.foodValue = s.field_required
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

  const handleDeliveryChange = async (addr) => {
    if (!addr) return
    const base = [addr.street, addr.houseNumber].filter(Boolean).join(' ') || addr.address || ''
    const cityPart = [addr.postcode, addr.city].filter(Boolean).join(' ')
    const fullAddress = [base, cityPart].filter(Boolean).join(', ')
    setField('deliveryAddress', fullAddress || base)
    setField('deliveryStreet', addr.street || addr.address || '')
    setField('deliveryCity', addr.city || 'Szczecin')
    setField('deliveryPostcode', addr.postcode || '')
    if (addr.autofillName  && !form.recipientName)   setField('recipientName',  addr.autofillName)
    if (addr.autofillPhone && !form.recipientPhone)  setField('recipientPhone', addr.autofillPhone)
    if (addr.autofillNotes && !form.deliveryNotes)   setField('deliveryNotes',  addr.autofillNotes)
    setFieldErrors(e => ({ ...e, deliveryAddress: undefined }))

    let lat = addr.lat
    let lng = addr.lng

    // HERE autocomplete doesn't return position — geocode to get coordinates.
    // Only geocode on real dropdown selections (addr.street is populated); on
    // raw keystrokes addr.street is '' and we must not fire a request per character.
    // Pass only base (no commas) — Mapy suggest returns 422 when query has commas.
    if ((!lat || !lng) && addr.street) {
      try {
        const results = await mapyAutocomplete(base)
        if (results.length > 0 && results[0].lat && results[0].lng) {
          lat = results[0].lat
          lng = results[0].lng
        }
      } catch {}
    }

    setField('deliveryLat', lat ?? null)
    setField('deliveryLng', lng ?? null)

    if (lat && lng) {
      const pickupLat = form.pickupLat || profile?.pickup_lat
      const pickupLng = form.pickupLng || profile?.pickup_lng
      if (pickupLat && pickupLng) {
        setFetchingDistance(true)
        setSnapshotUrl(null)
        const MIN_KM = 2.0
        const snapshotOpts = { fromLat: pickupLat, fromLng: pickupLng, toLat: lat, toLng: lng, width: 700, height: 180 }
        const fallbackDistance = () => {
          getRoadDistanceKm(pickupLat, pickupLng, lat, lng, process.env.NEXT_PUBLIC_HERE_API_KEY)
            .then(km => {
              setRoadDistanceKm(km || haversineDistance(pickupLat, pickupLng, lat, lng))
              setSnapshotUrl(getRouteSnapshotUrl(snapshotOpts))
              setFetchingDistance(false)
            })
            .catch(() => {
              setRoadDistanceKm(haversineDistance(pickupLat, pickupLng, lat, lng))
              setSnapshotUrl(getRouteSnapshotUrl(snapshotOpts))
              setFetchingDistance(false)
            })
        }
        Promise.all([
          getRouteData({ fromLat: pickupLat, fromLng: pickupLng, toLat: lat, toLng: lng, transport: 'bike' }),
          getRouteData({ fromLat: pickupLat, fromLng: pickupLng, toLat: lat, toLng: lng, transport: 'car' }),
        ]).then(([bikeData, carData]) => {
          if (!bikeData && !carData) { fallbackDistance(); return }
          const bikeKm = bikeData?.distanceKm || 0
          const carKm  = carData?.distanceKm  || 0
          // Car route is the customer baseline. If bike route is longer, add half
          // the detour on top — courier isn't penalised, customer isn't overcharged.
          // Formula: carKm + (bikeKm - carKm) / 2  when bike > car, else just carKm.
          const detour = Math.max(bikeKm - carKm, 0)
          const effectiveDistance = Math.max(carKm + detour / 2, MIN_KM)
          // Map always renders the car route geometry
          setSnapshotUrl(getRouteSnapshotUrl({ ...snapshotOpts, geometry: carData?.geometry || null }))
          setRoadDistanceKm(effectiveDistance)
          setRouteData(bikeData || carData)
          setForm(prev => ({
            ...prev,
            distanceKm: effectiveDistance,
            bikeRouteKm: bikeKm,
            carRouteKm:  carKm,
            durationMin: bikeData?.durationMin || 20,
          }))
          setFetchingDistance(false)
        }).catch(fallbackDistance)
      }
    } else {
      setRoadDistanceKm(null)
      setSnapshotUrl(null)
      setRouteData(null)
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
          status: 'awaiting_payment',
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
          amount_pln: effectiveDisplayPrice ?? displayPrice ?? price,
          price_total: effectiveDisplayPrice ?? displayPrice ?? price,
          distance_km: Math.ceil((form.distanceKm || roadDistanceKm || 0) * 2) / 2 || null,
          food_order_value: orderMode === 'restaurant' ? (parseFloat(foodValue) || null) : null,
          commission_pln: orderMode === 'restaurant' ? (commissionPln || null) : null,
          order_kind: orderMode,
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
                      }}>{s.popular}</div>
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

            {orderMode === 'restaurant' && (
              <div style={cardStyle}>
                <label style={{ ...labelStyle, marginTop: 0 }}>{s.food_value_label}</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={foodValue}
                  onChange={e => { setFoodValue(e.target.value); setFieldErrors(err => ({ ...err, foodValue: undefined })) }}
                  placeholder={s.food_value_placeholder}
                  style={inputStyle}
                />
                {fieldErr('foodValue')}
                {parseFloat(foodValue) > 0 && (
                  <div style={{ marginTop: 12, fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: colors.textSecondary }}>
                      <span>{s.food_order_label}</span>
                      <span style={{ fontFamily: "'Fira Code', monospace" }}>PLN {parseFloat(foodValue).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: colors.textSecondary }}>
                      <span>{s.commission_label}</span>
                      <span style={{ fontFamily: "'Fira Code', monospace" }}>PLN {commissionPln.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: colors.textSecondary }}>
                      <span>{s.delivery_fee_label}</span>
                      <span style={{ fontFamily: "'Fira Code', monospace", color: displayPrice ? colors.text : '#9CA3AF' }}>
                        {displayPrice ? `PLN ${displayPrice.toFixed(2)}` : '—'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0 0', borderTop: '1px solid ' + colors.border, marginTop: 4, fontWeight: 700, color: colors.text }}>
                      <span>{s.customer_total_label}</span>
                      <span style={{ fontFamily: "'Fira Code', monospace" }}>
                        {customerTotal ? `PLN ${customerTotal.toFixed(2)}` : '—'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

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

            {weather && (
              <div style={{ background: '#F9FAFB', border: '0.5px solid #E5E7EB', borderRadius: 10, overflow: 'hidden', marginTop: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
                  {[
                    { label: s.weather_now, d: weather.now },
                    { label: s.weather_evening, d: weather.evening },
                    { label: s.weather_night, d: weather.night },
                  ].map((p, i) => (
                    <div key={p.label} style={{ padding: '10px 8px', textAlign: 'center', borderRight: i < 2 ? '0.5px solid #E5E7EB' : 'none' }}>
                      <div style={{ fontSize: 9, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{p.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 600, color: '#111827' }}>{p.d.temp}°</div>
                      <div style={{ fontSize: 16, margin: '2px 0' }}>{p.d.icon}</div>
                      <div style={{ fontSize: 9, color: '#9CA3AF' }}>{p.d.rain}% 💨{p.d.wind}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: weather.bikeCondition.bg, padding: '5px 10px', fontSize: 10, color: weather.bikeCondition.color, fontWeight: 500, textAlign: 'center' }}>
                  {weather.bikeCondition.text}
                </div>
              </div>
            )}
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
              {fieldErr('deliveryAddress')}
              {snapshotUrl && (
                <div style={{ marginTop: 10, borderRadius: 10, overflow: 'hidden', position: 'relative' }}>
                  <img
                    src={snapshotUrl}
                    alt="Trasa dostawy"
                    style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
                  />
                  {form.distanceKm && (
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
                      padding: '24px 12px 8px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                    }}>
                      <span style={{ fontSize: 12, color: '#fff', fontWeight: 500 }}>
                        {form.distanceKm.toFixed(1)} km{form.durationMin ? ` · ~${form.durationMin} min` : ''}
                      </span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>Mapy.com</span>
                    </div>
                  )}
                </div>
              )}

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

            {effectiveDisplayPrice !== null && form.deliveryLat && (
              <div style={{ ...cardStyle, border: '2px solid #D4FF00' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: colors.textSecondary, fontSize: 14 }}>{s.summary_price}</span>
                  <span style={{ color: '#111827', fontWeight: 900, fontSize: 28, fontFamily: "'Fira Code', monospace" }}>
                    PLN {effectiveDisplayPrice.toFixed(2)}
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

            {snapshotUrl && (() => {
              const getETA = (durationMin) => {
                const now = new Date()
                now.setMinutes(now.getMinutes() + (durationMin || 20) + 5)
                return now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
              }
              return (
                <div style={{ borderRadius: 12, overflow: 'hidden', marginTop: 4, marginBottom: 16 }}>
                  <img
                    src={snapshotUrl}
                    alt="Trasa"
                    style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}
                  />
                  {form.distanceKm && (
                    <div style={{ background: '#0A0A0A', padding: '9px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 400 }}>
                        {form.distanceKm.toFixed(1)} km
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#D4FF00', letterSpacing: 0.2 }}>
                        ~{form.durationMin || routeData?.durationMin || 20} min · {s.route_arrival}{getETA(form.durationMin || routeData?.durationMin)}
                      </span>
                    </div>
                  )}
                  <div style={{
                    background: 'rgba(37,99,235,0.06)',
                    borderTop: '0.5px solid rgba(37,99,235,0.12)',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}>
                    <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>🚲</span>
                    <p style={{ fontSize: 11, color: '#374151', margin: 0, lineHeight: 1.6 }}>
                      {s.bike_info}{' '}
                      <strong style={{ color: '#111827' }}>
                        {s.bike_info_bold}
                      </strong>
                    </p>
                  </div>
                </div>
              )
            })()}

            <div style={{ ...cardStyle, border: '2px solid #D4FF00', padding: '28px 24px' }}>
              {orderMode === 'restaurant' && parseFloat(foodValue) > 0 ? (
                <>
                  <div style={{ marginBottom: 16 }}>
                    {[
                      { label: s.food_order_label, value: `PLN ${parseFloat(foodValue).toFixed(2)}` },
                      { label: s.commission_label, value: `PLN ${commissionPln.toFixed(2)}` },
                      { label: s.delivery_fee_label, value: displayPrice ? `PLN ${displayPrice.toFixed(2)}` : '—' },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13, color: colors.textSecondary, borderBottom: '1px solid ' + colors.border }}>
                        <span>{label}</span>
                        <span style={{ fontFamily: "'Fira Code', monospace", color: colors.text }}>{value}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: colors.textSecondary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2 }}>{s.customer_total_label}</div>
                    <div style={{ color: '#111827', fontWeight: 900, fontSize: 36, fontFamily: "'Fira Code', monospace", lineHeight: 1 }}>
                      {customerTotal ? `PLN ${customerTotal.toFixed(2)}` : '—'}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: colors.textSecondary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 }}>{s.summary_price}</div>
                  <div style={{ color: '#111827', fontWeight: 900, fontSize: 44, fontFamily: "'Fira Code', monospace", marginBottom: 10, lineHeight: 1 }}>
                    PLN {displayPrice?.toFixed(2) ?? '—'}
                  </div>
                </div>
              )}
              <div style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 1.5, marginTop: 10 }}>{s.eta_note}</div>
              {form.recipientPhone && (
                <div style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                  {form.recipientName ? `${form.recipientName} ${s.sms_note}` : s.sms_note}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <div style={{
                flex: 1,
                background: 'rgba(22,163,74,0.06)',
                border: '0.5px solid rgba(22,163,74,0.22)',
                borderRadius: 12,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16A34A', flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#111827', margin: 0 }}>
                    {s.courier_ready_title}
                  </p>
                  <p style={{ fontSize: 10, color: '#6B7280', margin: '2px 0 0', lineHeight: 1.4 }}>
                    {s.courier_ready_desc}
                  </p>
                </div>
              </div>
              <div style={{
                flex: 1,
                background: 'rgba(212,255,0,0.05)',
                border: '0.5px solid rgba(212,255,0,0.25)',
                borderRadius: 12,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>📡</span>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#111827', margin: 0 }}>
                    {s.track_live_title}
                  </p>
                  <p style={{ fontSize: 10, color: '#6B7280', margin: '2px 0 0', lineHeight: 1.4 }}>
                    {s.track_live_desc}
                  </p>
                </div>
              </div>
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
                    {process.env.NEXT_PUBLIC_REVOLUT_USER ? `revolut.me/${process.env.NEXT_PUBLIC_REVOLUT_USER}` : '...'} → PLN {effectiveDisplayPrice != null ? parseFloat(effectiveDisplayPrice).toFixed(2) : ''}
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
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 0 }}>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary"
                style={{ flex: 1, height: 48, fontSize: 15, opacity: submitting ? 0.6 : 1 }}
              >
                {submitting ? s.submitting : s.submit_revolut}
              </button>
              <p style={{ fontSize: 10, color: '#9CA3AF', textAlign: 'center', marginTop: 8, marginBottom: 0 }}>
                {s.cancellation_note}
              </p>
            </div>
          )}
        </div>
        {effectiveDisplayPrice !== null && step >= 3 && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase' }}>{s.summary_price}</div>
            <div style={{ color: '#111827', fontWeight: 900, fontSize: 20, fontFamily: "'Fira Code', monospace" }}>PLN {effectiveDisplayPrice.toFixed(2)}</div>
          </div>
        )}
      </div>
    </div>
  )
}
