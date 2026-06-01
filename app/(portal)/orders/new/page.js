'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { calculatePrice } from '@/lib/pricing'
import { distanceBetweenCities } from '@/lib/cities'
import { useApp } from '@/utils/appContext'
import AddressInput from '@/components/AddressInput'
import { generateOrderNumber } from '@/utils/orderNumber'
import { emailOrderConfirmed } from '@/utils/emailService'
import { z } from 'zod'

const OrderSchema = z.object({
  pickup_address: z.string()
    .min(5, 'Pickup address must be at least 5 characters')
    .max(200, 'Pickup address too long'),
  delivery_address: z.string()
    .min(5, 'Delivery address must be at least 5 characters')
    .max(200, 'Delivery address too long'),
  recipient_name: z.string()
    .min(2, 'Recipient name required')
    .max(100, 'Recipient name too long'),
  recipient_phone: z.string()
    .regex(/^\+?[0-9\s\-]{9,15}$/, 'Invalid phone number format')
    .optional(),
  order_item_count: z.number()
    .int()
    .min(1, 'At least 1 item required')
    .max(99, 'Maximum 99 items per order')
    .optional(),
  amount_pln: z.number()
    .min(0, 'Amount cannot be negative')
    .max(50000, 'Amount exceeds maximum')
    .optional(),
  courier_note: z.string()
    .max(120, 'Courier note maximum 120 characters')
    .optional(),
  time_window_start: z.string().optional(),
  time_window_end: z.string().optional(),
  is_cod: z.boolean().optional(),
  is_fragile: z.boolean().optional(),
})

export default function NewOrderPage() {
  const router = useRouter()
  const { t, lang, colors } = useApp()
  const [user, setUser] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const prevTotal = useRef(0)
  const [priceFlash, setPriceFlash] = useState(false)

  const [savedAddresses, setSavedAddresses] = useState([])
  const [pickupData, setPickupData] = useState({})
  const [showSavePickup, setShowSavePickup] = useState(false)
  const [showSaveDelivery, setShowSaveDelivery] = useState(false)
  const [savePickupLabel, setSavePickupLabel] = useState('')
  const [saveDeliveryLabel, setSaveDeliveryLabel] = useState('')
  const [businessType, setBusinessType] = useState('general')
  const [readyTime, setReadyTime] = useState('')
  const [prepTime, setPrepTime] = useState('')
  const [itemCount, setItemCount] = useState(1)
  const [handlingFlags, setHandlingFlags] = useState([])
  const [courierNote, setCourierNote] = useState('')

  const [form, setForm] = useState({
    pickupCity: 'szczecin', pickupStreet: '', pickupHouse: '', pickupApartment: '',
    pickupPostal: '', pickupContact: '', pickupPhone: '', pickupAccess: '', pickupInstructions: '',
    deliveryCity: 'szczecin', deliveryStreet: '', deliveryHouse: '', deliveryApartment: '',
    deliveryPostal: '', deliveryContact: '', deliveryPhone: '', deliveryNotes: '',
    weight: '5-10kg', timeWindow: 'same_day',
    isFragile: false, hasInsurance: true,
    wantsWhatsApp: false, whatsAppPhone: ''
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const isRestaurant = businessType === 'restaurant'

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUser(user)
      const { data: addresses } = await supabase
        .from('saved_addresses')
        .select('*')
        .eq('client_id', user['id'])
        .order('use_count', { ascending: false })
      setSavedAddresses(addresses || [])
      const { data: prof } = await supabase
        .from('profiles')
        .select('business_type')
        .eq('id', user['id'])
        .single()
      if (prof?.business_type) setBusinessType(prof.business_type)
      const defaultPickup = (addresses || []).find(a => a.is_default_pickup)
      if (defaultPickup) {
        const filled = {
          street: defaultPickup.street || '',
          house: defaultPickup.house_number || '',
          apartment: defaultPickup.apartment || '',
          postal: defaultPickup.postal_code || '',
          city: defaultPickup.city || '',
          contactName: defaultPickup.contact_name || '',
          contactPhone: defaultPickup.contact_phone || '',
          accessCode: defaultPickup.access_code || '',
          instructions: defaultPickup.instructions || '',
        }
        setPickupData(filled)
        set('pickupCity', defaultPickup.city); set('pickupStreet', defaultPickup.street)
        set('pickupHouse', defaultPickup.house_number); set('pickupApartment', defaultPickup.apartment || '')
        set('pickupPostal', defaultPickup.postal_code || ''); set('pickupContact', defaultPickup.contact_name || '')
        set('pickupPhone', defaultPickup.contact_phone || ''); set('pickupAccess', defaultPickup.access_code || '')
      }
    })
  }, [router])

  const dist = distanceBetweenCities(form.pickupCity, form.deliveryCity)
  const price = calculatePrice({
    distance: dist, weight: form.weight, timeWindow: form.timeWindow,
    pickupCity: form.pickupCity, deliveryCity: form.deliveryCity,
    isCOD: false, isFragile: form.isFragile, hasInsurance: form.hasInsurance
  })

  useEffect(() => {
    if (prevTotal.current !== price.total && prevTotal.current !== 0) {
      setPriceFlash(true)
      setTimeout(() => setPriceFlash(false), 400)
    }
    prevTotal.current = price.total
  }, [price.total])

  const validate = () => {
    const e = {}
    if (!form.pickupStreet) e.pickup = 'Pickup address required'
    if (!form.pickupCity) e.pickup = 'Pickup city required'
    if (form.pickupStreet.length > 200) e.pickup = 'Pickup street too long'
    if (form.pickupAccess.length > 50) e.pickup = 'Access code too long (max 50)'
    if (form.pickupInstructions.length > 500) e.pickup = 'Pickup instructions too long (max 500)'
    if (!form.deliveryStreet) e.delivery = 'Delivery address required'
    if (!form.deliveryCity) e.delivery = 'Delivery city required'
    if (!form.deliveryContact) e.delivery = 'Recipient name required'
    if (form.deliveryContact.length > 100) e.delivery = 'Recipient name too long'
    if (!form.deliveryPhone) e.delivery = 'Recipient phone required'
    if (!/^\+?[\d\s\-()]{7,20}$/.test(form.deliveryPhone)) e.delivery = 'Enter a valid phone number'
    if (form.deliveryNotes.length > 500) e.delivery = 'Delivery notes too long (max 500)'
    if (form.wantsWhatsApp && form.whatsAppPhone && !/^\+?[\d\s\-()]{7,20}$/.test(form.whatsAppPhone)) e.delivery = 'Enter a valid WhatsApp number'
    return e
  }

  const submit = async () => {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setSubmitting(true)
    try {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { router.push('/login'); return }
      const orderId = await generateOrderNumber(
        supabase,
        form.pickupCity,
        form.pickupPostal
      )
      const hasStripe = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      const delivery = {
        id: orderId, order_number: orderId, client_id: u['id'],
        pickup_city: form.pickupCity, pickup_street: form.pickupStreet,
        pickup_house_number: form.pickupHouse, pickup_apartment: form.pickupApartment,
        pickup_access_code: form.pickupAccess, pickup_postal_code: form.pickupPostal,
        pickup_postal: form.pickupPostal,
        pickup_contact_name: form.pickupContact, pickup_contact_phone: form.pickupPhone,
        pickup_instructions: isRestaurant ? [courierNote, handlingFlags.join(' · ')].filter(Boolean).join(' | ') : form.pickupInstructions,
        pickup_notes: isRestaurant ? [courierNote, handlingFlags.join(' · ')].filter(Boolean).join(' | ') : form.pickupInstructions,
        order_item_count: isRestaurant ? itemCount : null,
        pickup_address: form.pickupStreet + ' ' + form.pickupHouse + ', ' + form.pickupCity,
        delivery_city: form.deliveryCity, delivery_street: form.deliveryStreet,
        delivery_house_number: form.deliveryHouse, delivery_apartment: form.deliveryApartment,
        delivery_postal_code: form.deliveryPostal, delivery_contact_name: form.deliveryContact,
        delivery_contact_phone: form.deliveryPhone, delivery_notes: form.deliveryNotes,
        delivery_address: form.deliveryStreet + ' ' + form.deliveryHouse + ', ' + form.deliveryCity,
        recipient_name: form.deliveryContact, recipient_phone: form.deliveryPhone,
        package_weight: form.weight, is_fragile: form.isFragile,
        insurance_selected: form.hasInsurance, insurance_fee: form.hasInsurance ? 3 : 0,
        whatsapp_updates: form.wantsWhatsApp, whatsapp_phone: form.wantsWhatsApp ? form.whatsAppPhone : null,
        time_window: isRestaurant ? (readyTime || 'any_time') : form.timeWindow, distance_km: dist, price_total: price.total,
        price_breakdown: price, status: hasStripe ? 'awaiting_payment' : 'pending', country: 'PL',
        market_currency: 'PLN', created_at: new Date().toISOString()
      }
      const validated = OrderSchema.safeParse({
        pickup_address: delivery.pickup_address,
        delivery_address: delivery.delivery_address,
        recipient_name: delivery.recipient_name,
        recipient_phone: delivery.recipient_phone ?? undefined,
        order_item_count: delivery.order_item_count ?? undefined,
        amount_pln: price.total,
        courier_note: courierNote || undefined,
        is_fragile: form.isFragile || undefined,
      })
      if (!validated.success) {
        const firstError = validated.error.issues[0]
        setErrors({ submit: firstError.message })
        return
      }

      const { error } = await supabase.from('deliveries').insert({
        ...delivery,
        ...validated.data,
      })
      if (error) throw error

      // Fire-and-forget confirmation email — never blocks order placement
      try {
        const { data: { user: u2 } } = await supabase.auth.getUser()
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, company_name')
          .eq('id', u2['id'])
          .single()
        if (profile?.email) {
          emailOrderConfirmed(delivery, profile.email, profile.company_name || '').catch(() => {})
        }
      } catch (emailError) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[DEBUG] Order confirmation email failed:', emailError.message)
        }
      }

      router.push('/orders/' + orderId + '?created=true')
    } catch (err) {
      setErrors({ submit: 'Something went wrong placing your order. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  const cardStyle = { background: colors.card, border: '1px solid ' + colors.border, borderRadius: '12px', padding: '24px', marginBottom: '16px' }
  const timeOptions = [
    { value: 'asap', label: t('asap'), note: '+PLN 8' },
    { value: 'same_day', label: t('sameDay'), note: 'No extra charge' },
    { value: 'scheduled', label: t('scheduled'), note: '-PLN 5' }
  ]

  return (
    <div key={lang} style={{ minHeight: '100vh', background: colors.bg }}>
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px', paddingBottom: 120 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>{t('newOrder')}</h1>

        {/* Section 1: Pickup */}
        <div style={cardStyle}>
          <AddressInput
            label={'1. ' + t('pickup')}
            savedAddresses={savedAddresses.filter(a => a.address_type !== 'delivery')}
            defaultValues={pickupData}
            placeholder={t('pickupPlaceholder')}
            onFill={(data) => {
              set('pickupStreet', data.street || ''); set('pickupHouse', data.house || '')
              set('pickupApartment', data.apartment || ''); set('pickupPostal', data.postal || '')
              set('pickupCity', data.city || 'szczecin'); set('pickupContact', data.contactName || '')
              set('pickupPhone', data.contactPhone || ''); set('pickupAccess', data.accessCode || '')
              set('pickupInstructions', data.instructions || '')
              setShowSavePickup(true)
              setErrors(e => ({ ...e, pickup: undefined }))
            }}
          />
          {errors.pickup && <div style={{ color: '#FF3B30', fontSize: 13, marginTop: 8 }}>{errors.pickup}</div>}
          {showSavePickup && (
            <div style={{ marginTop: 16, padding: 12, background: colors.bg, borderRadius: 8, border: '1px solid ' + colors.border }}>
              <div style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 8 }}>{t('saveAddress')}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  placeholder={t('labelPickup')}
                  value={savePickupLabel}
                  onChange={e => setSavePickupLabel(e.target.value)}
                  style={{ flex: 1, padding: 10, background: colors.input, border: '1px solid ' + colors.border, borderRadius: 8, color: colors.text, fontSize: 14, height: 40 }}
                />
                <button
                  onClick={async () => {
                    if (!savePickupLabel) return
                    const { data: { user: u } } = await supabase.auth.getUser()
                    await supabase.from('saved_addresses').insert({
                      client_id: u['id'], label: savePickupLabel, address_type: 'pickup',
                      street: form.pickupStreet, house_number: form.pickupHouse,
                      apartment: form.pickupApartment, postal_code: form.pickupPostal,
                      city: form.pickupCity, contact_name: form.pickupContact,
                      contact_phone: form.pickupPhone, access_code: form.pickupAccess,
                      instructions: form.pickupInstructions,
                      is_default_pickup: savedAddresses.filter(a => a.is_default_pickup).length === 0
                    })
                    setShowSavePickup(false); setSavePickupLabel('')
                    const { data } = await supabase.from('saved_addresses').select('*').eq('client_id', u['id']).order('use_count', { ascending: false })
                    setSavedAddresses(data || [])
                  }}
                  className="btn-primary"
                  style={{ height: 40, padding: '0 16px', fontSize: 14 }}
                >{t('save')}</button>
                <button onClick={() => setShowSavePickup(false)} style={{ background: 'transparent', border: '1px solid ' + colors.border, padding: '0 16px', borderRadius: 8, color: colors.textSecondary, cursor: 'pointer', fontSize: 14, height: 40 }}>{t('skip')}</button>
              </div>
            </div>
          )}
        </div>

        {/* Restaurant details */}
        {isRestaurant && (
          <div style={cardStyle}>
            <div style={{ color: '#FF9500', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>🍽️ Restaurant Details</div>

            <div style={{ color: colors.textSecondary, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Order Ready Time</div>
            <input
              type="time"
              value={readyTime}
              onChange={e => setReadyTime(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', background: colors.bg, border: '1px solid ' + colors.border, borderRadius: 8, color: colors.text, fontSize: 15, marginBottom: 16, boxSizing: 'border-box' }}
            />

            <div style={{ color: colors.textSecondary, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Prep Time</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {['10 min', '15 min', '20 min', '30 min', '45 min'].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPrepTime(prepTime === p ? '' : p)}
                  style={{ padding: '8px 14px', borderRadius: 20, fontWeight: 700, fontSize: 13, border: '1px solid ' + (prepTime === p ? '#FF9500' : colors.border), background: prepTime === p ? '#FF950020' : colors.bg, color: prepTime === p ? '#FF9500' : colors.textSecondary, cursor: 'pointer' }}
                >{p}</button>
              ))}
            </div>

            <div style={{ color: colors.textSecondary, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Number of Bags / Items</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setItemCount(n)}
                  style={{ width: 44, height: 44, borderRadius: 8, fontWeight: 700, fontSize: 15, border: '1px solid ' + (itemCount === n ? '#D4FF00' : colors.border), background: itemCount === n ? '#D4FF0020' : colors.bg, color: itemCount === n ? '#D4FF00' : colors.textSecondary, cursor: 'pointer' }}
                >{n === 5 ? '5+' : n}</button>
              ))}
            </div>

            <div style={{ color: colors.textSecondary, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Handling</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {['Hot food — keep warm', 'Liquid / spill risk', 'Keep upright', 'Contact-free dropoff'].map(flag => (
                <label key={flag} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={handlingFlags.includes(flag)}
                    onChange={e => setHandlingFlags(prev => e.target.checked ? [...prev, flag] : prev.filter(f => f !== flag))}
                    style={{ accentColor: '#D4FF00', width: 18, height: 18, flexShrink: 0 }}
                  />
                  <span style={{ color: colors.text, fontSize: 14 }}>{flag}</span>
                </label>
              ))}
            </div>

            <div style={{ color: colors.textSecondary, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Note for Courier</div>
            <textarea
              placeholder="e.g. Buzzer code 4B, collect from kitchen window..."
              value={courierNote}
              onChange={e => setCourierNote(e.target.value)}
              rows={2}
              style={{ width: '100%', padding: '12px 14px', background: colors.bg, border: '1px solid ' + colors.border, borderRadius: 8, color: colors.text, fontSize: 14, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
          </div>
        )}

        {/* Section 2: Delivery */}
        <div style={cardStyle}>
          <AddressInput
            label={'2. ' + t('delivery')}
            savedAddresses={savedAddresses.filter(a => a.address_type !== 'pickup')}
            placeholder={t('deliveryPlaceholder')}
            onFill={(data) => {
              set('deliveryStreet', data.street || ''); set('deliveryHouse', data.house || '')
              set('deliveryApartment', data.apartment || ''); set('deliveryPostal', data.postal || '')
              set('deliveryCity', data.city || 'szczecin'); set('deliveryContact', data.contactName || '')
              set('deliveryPhone', data.contactPhone || ''); set('deliveryNotes', data.instructions || '')
              setShowSaveDelivery(true)
              setErrors(e => ({ ...e, delivery: undefined }))
            }}
          />
          {errors.delivery && <div style={{ color: '#FF3B30', fontSize: 13, marginTop: 8 }}>{errors.delivery}</div>}
          {showSaveDelivery && (
            <div style={{ marginTop: 16, padding: 12, background: colors.bg, borderRadius: 8, border: '1px solid ' + colors.border }}>
              <div style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 8 }}>{t('saveRecipient')}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  placeholder={t('labelRecipient')}
                  value={saveDeliveryLabel}
                  onChange={e => setSaveDeliveryLabel(e.target.value)}
                  style={{ flex: 1, padding: 10, background: colors.input, border: '1px solid ' + colors.border, borderRadius: 8, color: colors.text, fontSize: 14, height: 40 }}
                />
                <button
                  onClick={async () => {
                    if (!saveDeliveryLabel) return
                    const { data: { user: u } } = await supabase.auth.getUser()
                    await supabase.from('saved_addresses').insert({
                      client_id: u['id'], label: saveDeliveryLabel, address_type: 'delivery',
                      street: form.deliveryStreet, house_number: form.deliveryHouse,
                      apartment: form.deliveryApartment, postal_code: form.deliveryPostal,
                      city: form.deliveryCity, contact_name: form.deliveryContact,
                      contact_phone: form.deliveryPhone,
                    })
                    setShowSaveDelivery(false); setSaveDeliveryLabel('')
                    const { data } = await supabase.from('saved_addresses').select('*').eq('client_id', u['id']).order('use_count', { ascending: false })
                    setSavedAddresses(data || [])
                  }}
                  className="btn-primary"
                  style={{ height: 40, padding: '0 16px', fontSize: 14 }}
                >{t('save')}</button>
                <button onClick={() => setShowSaveDelivery(false)} style={{ background: 'transparent', border: '1px solid ' + colors.border, padding: '0 16px', borderRadius: 8, color: colors.textSecondary, cursor: 'pointer', fontSize: 14, height: 40 }}>{t('skip')}</button>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Package */}
        <div style={cardStyle}>
          <div style={{ color: '#D4FF00', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>3. {t('package')}</div>
          <label>{t('weight')}</label>
          <select value={form.weight} onChange={e => set('weight', e.target.value)} style={{ marginBottom: 12 }}>
            <option value="5kg">Up to 5kg</option>
            <option value="5-10kg">5–10kg</option>
            <option value="10-20kg">10–20kg (+PLN 5)</option>
            <option value=">20kg">Over 20kg (+PLN 10)</option>
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textTransform: 'none', fontSize: 14, fontWeight: 400, letterSpacing: 0, marginBottom: 0 }}>
            <input type="checkbox" checked={form.isFragile} onChange={e => set('isFragile', e.target.checked)} style={{ accentColor: '#D4FF00', width: 18, height: 18, flexShrink: 0 }} />
            <span style={{ color: colors.text, fontWeight: 600, fontSize: 14 }}>{t('fragile')} <span style={{ color: colors.textSecondary, fontWeight: 400 }}>(+PLN 5)</span></span>
          </label>
        </div>

        {/* Section 4: Options */}
        <div style={cardStyle}>
          <div style={{ color: '#D4FF00', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>4. {t('options')}</div>
          <label>{t('timeWindow')}</label>
          <div style={{ marginBottom: 16 }}>
            {timeOptions.map(opt => (
              <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: form.timeWindow === opt.value ? '#D4FF0015' : colors.bg, border: '1px solid ' + (form.timeWindow === opt.value ? '#D4FF00' : colors.border), borderRadius: 8, marginBottom: 6, cursor: 'pointer', textTransform: 'none', fontSize: 14, fontWeight: 400, letterSpacing: 0 }}>
                <input type="radio" name="timeWindow" value={opt.value} checked={form.timeWindow === opt.value} onChange={() => set('timeWindow', opt.value)} style={{ accentColor: '#D4FF00' }} />
                <span style={{ flex: 1, color: colors.text, fontWeight: 600, fontSize: 14 }}>{opt.label}</span>
                <span style={{ color: colors.textSecondary, fontSize: 13 }}>{opt.note}</span>
              </label>
            ))}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 0', borderBottom: '1px solid ' + colors.border, textTransform: 'none', fontSize: 14, fontWeight: 400, letterSpacing: 0, marginBottom: 12 }}>
            <input type="checkbox" checked={form.hasInsurance} onChange={e => set('hasInsurance', e.target.checked)} style={{ accentColor: '#D4FF00', width: 14, height: 14 }} />
            <div>
              <span style={{ color: colors.textSecondary, fontSize: 13 }}>{t('shipmentProtection')}</span>
              <span style={{ color: colors.textSecondary, fontSize: 12, marginLeft: 6, opacity: 0.6 }}>{t('shipmentProtectionNote')}</span>
            </div>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textTransform: 'none', fontSize: 14, fontWeight: 400, letterSpacing: 0 }}>
            <input type="checkbox" checked={form.wantsWhatsApp} onChange={e => set('wantsWhatsApp', e.target.checked)} style={{ accentColor: '#D4FF00', width: 18, height: 18, flexShrink: 0 }} />
            <span style={{ color: colors.text, fontWeight: 600, fontSize: 14 }}>{t('whatsappUpdates')}</span>
          </label>
          {form.wantsWhatsApp && (
            <input type="tel" placeholder="+48 XXX XXX XXX" value={form.whatsAppPhone} onChange={e => set('whatsAppPhone', e.target.value)} style={{ marginTop: 8 }} />
          )}
        </div>

        {/* Section 5: Price breakdown */}
        <div style={{ ...cardStyle, border: '1px solid #D4FF00' }}>
          <div style={{ color: '#D4FF00', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>{t('priceBreakdown')}</div>
          {[
            [t('distanceLabel') + ': ' + dist + 'km', 'PLN ' + price.basePrice],
            price.weightFee > 0 && [t('weight'), '+PLN ' + price.weightFee],
            price.timeFee !== 0 && [t('timeWindowLine'), (price.timeFee > 0 ? '+' : '') + 'PLN ' + price.timeFee],
            price.specialFees > 0 && [t('addOns'), '+PLN ' + price.specialFees],
            price.cityMultiplier !== 1 && [t('cityRate'), 'x' + price.cityMultiplier]
          ].filter(Boolean).map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, color: colors.textSecondary }}>
              <span>{l}</span><span>{v}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid ' + colors.border, marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 16 }}>{t('total').toUpperCase()}</span>
            <span style={{ fontWeight: 900, fontSize: 28, color: '#D4FF00', fontFamily: "'Fira Code', monospace", fontVariantNumeric: 'tabular-nums' }}>PLN {price.total}</span>
          </div>
          {form.hasInsurance && (
            <div style={{ color: colors.textSecondary, fontSize: 11, opacity: 0.6, marginTop: 6, textAlign: 'right' }}>
              {t('shipmentProtection')}
            </div>
          )}
        </div>
      </main>

      {/* Fixed bottom bar — portal-bottom-bar CSS offsets left from sidebar on desktop, floats above BottomNav on mobile */}
      <div className="portal-bottom-bar" style={{ position: 'fixed', bottom: 0, right: 0, background: colors.card, borderTop: '1px solid ' + colors.border, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100 }}>
        {errors.submit && <div style={{ position: 'absolute', top: '-40px', left: 0, right: 0, background: '#FF3B3020', borderTop: '1px solid #FF3B30', padding: '10px 24px', color: '#FF6B6B', fontSize: 13 }}>{errors.submit}</div>}
        <div>
          <div style={{ color: colors.textSecondary, fontSize: 12 }}>{t('total')}</div>
          <div style={{ color: '#D4FF00', fontWeight: 900, fontSize: 24, fontFamily: "'Fira Code', monospace", fontVariantNumeric: 'tabular-nums' }}>PLN {price.total}</div>
        </div>
        <button onClick={submit} disabled={submitting} className="btn-primary" style={{ fontSize: 16, padding: '0 32px', height: 52 }}>
          {submitting ? t('placingOrder') : t('placeOrder')}
        </button>
      </div>
    </div>
  )
}
