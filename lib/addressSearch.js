const HERE_API_KEY = process.env.NEXT_PUBLIC_HERE_API_KEY;
const SZCZECIN_BBOX = '14.39,53.35,14.61,53.50';

export const searchAddresses = async (query, lang = 'pl') => {
  if (!query || query.length < 3) return [];
  if (!HERE_API_KEY) return searchPhotonFallback(query);

  try {
    const params = new URLSearchParams({
      q: query + ' Szczecin',
      in: 'countryCode:POL',
      lang: lang === 'pl' ? 'pl' : 'en',
      limit: '5',
      apiKey: HERE_API_KEY,
    });

    const response = await fetch(
      `https://autocomplete.search.hereapi.com/v1/autocomplete?${params}`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) return searchPhotonFallback(query);

    const data = await response.json();

    return (data.items || [])
      .map(item => ({
        label: item.address?.label || '',
        street: item.address?.street || '',
        houseNumber: item.address?.houseNumber || '',
        apartment: '',
        postcode: item.address?.postalCode || '',
        city: item.address?.city || 'Szczecin',
        lat: item.position?.lat || null,
        lng: item.position?.lng || null,
        source: 'here',
      }))
      .filter(r => r.street);

  } catch {
    return searchPhotonFallback(query);
  }
};

const searchPhotonFallback = async (query) => {
  try {
    const url = `https://photon.komoot.io/api/?q=${
      encodeURIComponent(query + ' Szczecin')
    }&limit=5&lang=pl&bbox=${SZCZECIN_BBOX}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.features || [])
      .map(f => ({
        label: [f.properties?.street, f.properties?.housenumber,
          f.properties?.postcode, f.properties?.city].filter(Boolean).join(' '),
        street: f.properties?.street || f.properties?.name || '',
        houseNumber: f.properties?.housenumber || '',
        apartment: '',
        postcode: f.properties?.postcode || '',
        city: f.properties?.city || 'Szczecin',
        lat: f.geometry?.coordinates?.[1] || null,
        lng: f.geometry?.coordinates?.[0] || null,
        source: 'photon',
      }))
      .filter(r => r.street);
  } catch {
    return [];
  }
};

export default searchAddresses;
