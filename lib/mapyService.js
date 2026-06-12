const MAPY_KEY =
  process.env.EXPO_PUBLIC_MAPY_API_KEY ||
  process.env.NEXT_PUBLIC_MAPY_API_KEY ||
  ''

if (!MAPY_KEY && typeof window !== 'undefined') {
  console.warn('[mapyService] NEXT_PUBLIC_MAPY_API_KEY is not set — map snapshots disabled')
}

const STATIC_MAP = 'https://api.mapy.com/v1/static/map'

// ── Route snapshot URL ───────────────────────────────────────────
// shapes/markers must NOT go through URLSearchParams — it encodes :;[](),
// which Mapy static API requires raw. Base params (apikey etc.) use
// URLSearchParams safely; the overlay strings are appended literally.
export const getRouteSnapshotUrl = ({
  fromLat, fromLng,
  toLat, toLng,
  width = 600,
  height = 200,
  geometry = null,  // GeoJSON LineString from routing API — draws actual road
}) => {
  if (!MAPY_KEY || !fromLat || !toLat || !fromLng || !toLng) return null

  const centerLat = (fromLat + toLat) / 2
  const centerLng = (fromLng + toLng) / 2
  const maxDiff = Math.max(Math.abs(toLat - fromLat), Math.abs(toLng - fromLng))
  // Zoom 11 for city routes (~8km visible at 180px height), 10 for long routes
  const zoom = maxDiff > 0.15 ? 10 : 11

  const params = new URLSearchParams({
    apikey: MAPY_KEY, width, height,
    mapset: 'outdoor', zoom,
    lon: centerLng, lat: centerLat,
  })

  // Build path: actual road geometry if available, otherwise straight line
  let pathCoords
  if (geometry?.coordinates?.length > 1) {
    const coords = geometry.coordinates
    const step = Math.max(1, Math.floor(coords.length / 60))
    const sampled = coords.filter((_, i) => i % step === 0)
    if (sampled[sampled.length - 1] !== coords[coords.length - 1]) sampled.push(coords[coords.length - 1])
    pathCoords = sampled.map(c => `${c[0]},${c[1]}`).join(';')
  } else {
    pathCoords = `${fromLng},${fromLat};${toLng},${toLat}`
  }

  const base = `${STATIC_MAP}?${params.toString()}`
  const shape = `color:D4FF00;width:3;path:[(${pathCoords})]`
  const markerA = `color:red;size:normal;label:A;${fromLng},${fromLat}`
  const markerB = `color:red;size:normal;label:B;${toLng},${toLat}`
  return `${base}&shapes=${shape}&markers=${markerA}&markers=${markerB}`
}

// ── Building snapshot URL ─────────────────────────────────────────
// Returns a zoomed-in PNG of a specific building location.
export const getBuildingSnapshotUrl = ({
  lat, lng,
  zoom = 18,
  width = 400,
  height = 200,
}) => {
  if (!MAPY_KEY || !lat || !lng) return null

  const params = new URLSearchParams({
    apikey: MAPY_KEY, width, height,
    mapset: 'outdoor', zoom,
    lon: lng, lat,
  })
  return `${STATIC_MAP}?${params.toString()}&markers=color:red;size:normal;label:X;${lng},${lat}`
}

// ── Route data (distance + time) ──────────────────────────────────
// Returns { distanceKm, durationMin, geometry } from Mapy.com Routing API.
// Response is flat: { length (metres), duration (seconds), geometry, parts, routePoints }
export const getRouteData = async ({
  fromLat, fromLng,
  toLat, toLng,
  transport = 'bike',
}) => {
  if (!MAPY_KEY) return null
  const transportMap = {
    bike: 'bike_road', bicycle: 'bike_road', cargo_bike: 'bike_road',
    car: 'car_fast_traffic', scooter: 'car_fast_traffic', van: 'car_fast_traffic',
    foot: 'foot_fast',
  }
  try {
    const params = new URLSearchParams({
      apikey: MAPY_KEY,
      start: `${fromLng},${fromLat}`,
      end: `${toLng},${toLat}`,
      routeType: transportMap[transport] || 'bike_road',
    })
    const res = await fetch(`https://api.mapy.com/v1/routing/route?${params.toString()}`)
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.length) return null
    return {
      distanceKm: +(data.length / 1000).toFixed(2),
      durationMin: Math.round(data.duration / 60),
      geometry: data.geometry,
    }
  } catch { return null }
}

// Province center used as default proximity so results are biased toward
// Zachodniopomorskie without restricting to just Szczecin city.
const PROVINCE_CENTER = { lat: 53.4285, lng: 14.5528 }

// ── Address autocomplete (Mapy.com fallback) ──────────────────────
// Drop-in replacement for HERE autocomplete when HERE fails.
export const mapyAutocomplete = async (query, lat, lng) => {
  if (!MAPY_KEY || !query || query.length < 2) return []
  try {
    // NOTE: Mapy v1/suggest returns 422 for ANY request that includes a `type`
    // parameter — even `type=address` alone. Remove it entirely.
    const proximityLat = lat ?? PROVINCE_CENTER.lat
    const proximityLng = lng ?? PROVINCE_CENTER.lng
    const params = new URLSearchParams({ apikey: MAPY_KEY, query, lang: 'pl', country: 'POL' })
    params.set('proximity', `${proximityLng},${proximityLat}`)
    params.set('limit_proximity', lat && lng ? '1' : '3')
    const res = await fetch(`https://api.mapy.com/v1/suggest?${params.toString()}`)
    if (!res.ok) return []
    const data = await res.json()
    return (data.items || []).map(item => {
      const streetPart = [item.location?.street, item.location?.houseNumber].filter(Boolean).join(' ')
      const cityPart = [item.location?.zip, item.location?.city].filter(Boolean).join(' ')
      return {
        label: [streetPart, cityPart].filter(Boolean).join(', ') || item.name,
        street: item.location?.street || item.name,
        houseNumber: item.location?.houseNumber || '',
        city: item.location?.city || 'Szczecin',
        postcode: item.location?.zip || '',
        lat: item.position?.lat,
        lng: item.position?.lon,
        source: 'mapy',
      }
    })
  } catch { return [] }
}
