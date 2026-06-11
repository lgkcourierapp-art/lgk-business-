export const PACKAGE_SIZES = [
  {
    id: 'koperta',
    icon: '✉️',
    labelPL: 'Koperta / Mała',
    labelEN: 'Envelope / Small',
    descPL: 'Dokumenty, biżuteria, małe przedmioty',
    descEN: 'Documents, jewellery, small items',
    examplesPL: 'Dokumenty · Klucze · Telefon',
    examplesEN: 'Documents · Keys · Phone',
    maxWeightLabel: 'do 2 kg',
    priceMultiplier: 1.0,
    vehicleRequired: 'any',
  },
  {
    id: 'standard',
    icon: '📦',
    labelPL: 'Standardowa',
    labelEN: 'Standard',
    descPL: 'Większość zamówień i zakupów',
    descEN: 'Most orders and purchases',
    examplesPL: 'Ubrania · Książki · Elektronika',
    examplesEN: 'Clothes · Books · Electronics',
    maxWeightLabel: 'do 10 kg',
    priceMultiplier: 1.0,
    vehicleRequired: 'any',
    recommended: true,
  },
  {
    id: 'duza',
    icon: '📦',
    labelPL: 'Duża',
    labelEN: 'Large',
    descPL: 'AGD, duże zakupy, meble',
    descEN: 'Appliances, large purchases, furniture',
    examplesPL: 'Mikrofala · Monitor · Walizka',
    examplesEN: 'Microwave · Monitor · Suitcase',
    maxWeightLabel: 'do 30 kg',
    priceMultiplier: 1.6,
    vehicleRequired: 'cargo_bike_or_car',
  },
  {
    id: 'niestandardowa',
    icon: '🏗️',
    labelPL: 'Niestandardowa',
    labelEN: 'Oversized',
    descPL: 'Powyżej 30 kg lub wymiarów standardowych',
    descEN: 'Over 30 kg or standard dimensions',
    examplesPL: 'Sofa · Sprzęt AGD · Paleta',
    examplesEN: 'Sofa · White goods · Pallet',
    maxWeightLabel: '30 kg+',
    priceMultiplier: null,
    vehicleRequired: 'van',
    requiresQuote: true,
  },
]

export const getSizeById = (id) =>
  PACKAGE_SIZES.find(s => s['id'] === id) || PACKAGE_SIZES[1]

export const haversineDistance = (lat1, lng1, lat2, lng2) => {
  if (!lat1 || !lng1 || !lat2 || !lng2) return 3
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export const getRoadDistanceKm = async (pickupLat, pickupLng, deliveryLat, deliveryLng, hereApiKey) => {
  if (!pickupLat || !pickupLng || !deliveryLat || !deliveryLng) return null
  if (!hereApiKey) return haversineDistance(pickupLat, pickupLng, deliveryLat, deliveryLng)
  try {
    const params = new URLSearchParams({
      transportMode: 'bicycle',
      origin: `${pickupLat},${pickupLng}`,
      destination: `${deliveryLat},${deliveryLng}`,
      return: 'summary',
      apiKey: hereApiKey,
    })
    const res = await fetch(
      `https://router.hereapi.com/v8/routes?${params}`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (!res.ok) throw new Error(`HERE Routing ${res.status}`)
    const data = await res.json()
    const metres = data.routes?.[0]?.sections?.[0]?.travelSummary?.length
    if (!metres) throw new Error('No route found')
    const km = metres / 1000
    if (process.env.NODE_ENV === 'development') {
      console.log('[Routing] Road:', km.toFixed(2), 'km  Haversine:', haversineDistance(pickupLat, pickupLng, deliveryLat, deliveryLng).toFixed(2), 'km')
    }
    return km
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Routing] HERE failed, using Haversine:', err.message)
    }
    return haversineDistance(pickupLat, pickupLng, deliveryLat, deliveryLng)
  }
}

export const calculatePrice = ({
  sizeId,
  distanceKm,
  isFragile = false,
  isRefrigerated = false,
  isExpress = false,
}) => {
  const size = getSizeById(sizeId)
  if (size.requiresQuote) return null

  const BASE = 14        // was 12
  const PER_KM = 2.5
  const FRAGILE = 5
  const REFRIGERATED = 10
  const EXPRESS = 12
  const INSURANCE = 3
  const PROCESSING = 2
  const MIN_KM = 2.0     // minimum billing distance

  const km = Math.max(distanceKm || MIN_KM, MIN_KM)

  let price = (BASE + km * PER_KM) * size.priceMultiplier
  if (isFragile) price += FRAGILE
  if (isRefrigerated) price += REFRIGERATED
  if (isExpress) price += EXPRESS
  price += INSURANCE + PROCESSING

  return price  // raw — caller applies applyPsychologicalPricing()
}

export const applyPsychologicalPricing = (price) => {
  if (price == null) return price
  return Math.floor(price) + 0.95
}

export const estimateBasePrice = (sizeId) => {
  const size = getSizeById(sizeId)
  if (size.requiresQuote) return null
  return applyPsychologicalPricing(calculatePrice({ sizeId, distanceKm: 2 }))
}

// ToS v1.2 Section 4.7.1 — surcharge = difference between correct price and declared price
// using the distance already embedded in the original order price.
export const calculateMismatchSurcharge = (declaredId, actualId, orderPrice) => {
  const declared = getSizeById(declaredId)
  const actual = getSizeById(actualId)
  if (!declared || !actual) return 0
  if (!declared.priceMultiplier || !actual.priceMultiplier) return 0
  if (actual.priceMultiplier <= declared.priceMultiplier) return 0
  const basePrice = orderPrice / declared.priceMultiplier
  const correctPrice = basePrice * actual.priceMultiplier
  return Math.max(0, Math.round(correctPrice - orderPrice))
}
