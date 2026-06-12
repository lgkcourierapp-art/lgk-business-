import { mapyAutocomplete } from './mapyService'

const HERE_API_KEY = process.env.NEXT_PUBLIC_HERE_API_KEY;
// West Pomeranian Province (Zachodniopomorskie): west, south, east, north
const PROVINCE_BBOX = '13.8,52.85,17.1,54.65';

// Strip Polish address prefixes — HERE/Photon don't understand them
export const cleanQuery = (query) => query
  .replace(/^os\.\s*/i, '')
  .replace(/^ul\.\s*/i, '')
  .replace(/^al\.\s*/i, '')
  .replace(/^pl\.\s*/i, '')
  .replace(/^rondo\s*/i, '')
  .replace(/^sk\.\s*/i, '')
  .trim()

export const searchAddresses = async (query, lang = 'pl') => {
  if (!query || query.length < 2) return [];

  // Mapy.com primary — returns lat/lng directly so no separate geocoding step needed
  try {
    const mapyResults = await mapyAutocomplete(query)
    if (mapyResults.length > 0) return mapyResults
  } catch {}

  // HERE fallback
  if (!HERE_API_KEY) return searchPhotonFallback(query);

  const cleaned = cleanQuery(query)
  const searchTerm = cleaned.length >= 2 ? cleaned : query

  try {
    const params = new URLSearchParams({
      q: searchTerm,
      in: 'bbox:13.8,52.85,17.1,54.65',
      lang: lang === 'pl' ? 'pl' : 'en',
      limit: '5',
      apiKey: HERE_API_KEY,
    });

    const response = await fetch(
      `https://autocomplete.search.hereapi.com/v1/autocomplete?${params}`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[addressSearch] HERE ${response.status} — falling back to Photon`)
      }
      return searchPhotonFallback(query);
    }

    const data = await response.json();

    const results = (data.items || [])
      .map(item => ({
        label: item.address?.label || '',
        street: item.address?.street || '',
        houseNumber: item.address?.houseNumber || '',
        apartment: '',
        postcode: item.address?.postalCode || '',
        city: item.address?.city || '',
        lat: item.position?.lat || null,
        lng: item.position?.lng || null,
        source: 'here',
      }))
      .filter(r => r.street);

    if (process.env.NODE_ENV === 'development') {
      console.log(`[addressSearch] HERE → ${results.length} results for "${query}"`)
    }

    return results;

  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[addressSearch] HERE threw — falling back to Photon`, err?.message)
    }
    return searchPhotonFallback(query);
  }
};

const searchPhotonFallback = async (query) => {
  try {
    const term = cleanQuery(query).length >= 2 ? cleanQuery(query) : query
    const url = `https://photon.komoot.io/api/?q=${
      encodeURIComponent(term)
    }&limit=5&lang=pl&bbox=${PROVINCE_BBOX}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = await res.json();
    const results = (data.features || [])
      .map(f => {
        const p = f.properties || {}
        const street = p.street || p.name || p.suburb || p.district || p.locality || ''
        const houseNumber = p.housenumber || ''
        const city = p.city || p.town || p.village || ''
        const postcode = p.postcode || ''
        const label = [street, houseNumber, postcode, city].filter(Boolean).join(', ')
        return {
          label,
          street,
          houseNumber,
          apartment: '',
          postcode,
          city,
          lat: f.geometry?.coordinates?.[1] || null,
          lng: f.geometry?.coordinates?.[0] || null,
          source: 'photon',
        }
      })
      .filter(r => r.street);

    if (process.env.NODE_ENV === 'development') {
      console.log(`[addressSearch] Photon → ${results.length} results for "${query}"`)
    }

    return results;
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[addressSearch] Photon threw`, err?.message)
    }
    return [];
  }
};

export default searchAddresses;
