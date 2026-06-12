const MAPY_KEY =
  process.env.EXPO_PUBLIC_MAPY_API_KEY ||
  process.env.NEXT_PUBLIC_MAPY_API_KEY ||
  ''

if (!MAPY_KEY && typeof window !== 'undefined') {
  console.warn('[mapyService] NEXT_PUBLIC_MAPY_API_KEY is not set — map snapshots disabled')
}

// ── Route snapshot URL ───────────────────────────────────────────
// Returns a PNG image URL of the route between two points.
// Rendered as <Image source={{ uri }} /> in React Native.
export const getRouteSnapshotUrl = ({
  fromLat, fromLng,
  toLat, toLng,
  transport = 'bike',
  width = 600,
  height = 200,
}) => {
  if (!MAPY_KEY || !fromLat || !toLat || !fromLng || !toLng) return null

  const centerLat = (fromLat + toLat) / 2
  const centerLng = (fromLng + toLng) / 2
  const latDiff = Math.abs(toLat - fromLat)
  const lngDiff = Math.abs(toLng - fromLng)
  const maxDiff = Math.max(latDiff, lngDiff)
  const zoom = maxDiff > 0.1 ? 12 : maxDiff > 0.05 ? 13 : maxDiff > 0.02 ? 14 : 15
  const path = `${fromLng},${fromLat};${toLng},${toLat}`

  return (
    `https://api.mapy.com/v1/static/map` +
    `?apikey=${MAPY_KEY}` +
    `&width=${width}&height=${height}` +
    `&mapset=outdoor` +
    `&zoom=${zoom}` +
    `&lon=${centerLng}&lat=${centerLat}` +
    `&shapes=color:D4FF00;path:[(${path})]` +
    `&markers=color:red;size:normal;label:A;${fromLng},${fromLat}` +
    `&markers=color:red;size:normal;label:B;${toLng},${toLat}`
  )
}

// ── Building snapshot URL ─────────────────────────────────────────
// Returns a zoomed-in PNG of a specific building location.
// Used in BRAMA INTEL reveal.
export const getBuildingSnapshotUrl = ({
  lat, lng,
  zoom = 18,
  width = 400,
  height = 200,
}) => {
  if (!MAPY_KEY || !lat || !lng) return null

  return (
    `https://api.mapy.com/v1/static/map` +
    `?apikey=${MAPY_KEY}` +
    `&width=${width}&height=${height}` +
    `&mapset=outdoor` +
    `&zoom=${zoom}` +
    `&lon=${lng}&lat=${lat}` +
    `&markers=color:red;size:normal;label:X;${lng},${lat}`
  )
}

// ── Route data (distance + time) ──────────────────────────────────
// Returns { distanceKm, durationMin, geometry } from Mapy.com Routing API.
export const getRouteData = async ({
  fromLat, fromLng,
  toLat, toLng,
  transport = 'bike',
}) => {
  if (!MAPY_KEY) return null
  try {
    const transportMap = {
      bike: 'bike_road', bicycle: 'bike_road', cargo_bike: 'bike_road',
      car: 'car_fast_traffic', scooter: 'car_fast_traffic', van: 'car_fast_traffic',
      foot: 'foot_fast',
    }
    const res = await fetch(
      `https://api.mapy.com/v1/routing/route` +
      `?apikey=${MAPY_KEY}` +
      `&start=${fromLng},${fromLat}` +
      `&end=${toLng},${toLat}` +
      `&routeType=${transportMap[transport] || 'bike_road'}`
    )
    if (!res.ok) return null
    const data = await res.json()
    const route = data?.route || data?.routes?.[0]
    if (!route) return null
    return {
      distanceKm: +(route.length / 1000).toFixed(2),
      durationMin: Math.round(route.duration / 60),
      geometry: route.geometry,
    }
  } catch { return null }
}

// ── Address autocomplete (Mapy.com fallback) ──────────────────────
// Drop-in replacement for HERE autocomplete when HERE fails.
export const mapyAutocomplete = async (query, lat, lng) => {
  if (!MAPY_KEY || !query || query.length < 2) return []
  try {
    const proximity = lat && lng ? `&proximity=${lng},${lat}&limit_proximity=1` : ''
    const res = await fetch(
      `https://api.mapy.com/v1/suggest` +
      `?apikey=${MAPY_KEY}` +
      `&query=${encodeURIComponent(query)}` +
      `&lang=pl&country=POL&type=address,region,poi` +
      proximity
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.items || []).map(item => ({
      label: item.name,
      street: item.location?.street || item.name,
      city: item.location?.city || 'Szczecin',
      postcode: item.location?.zip || '',
      lat: item.position?.lat,
      lng: item.position?.lon,
      source: 'mapy',
    }))
  } catch { return [] }
}
