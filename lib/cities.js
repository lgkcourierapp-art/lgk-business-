export const CITY_COORDS = {
  szczecin:    { lat: 53.4285, lng: 14.5528 },
  warszawa:    { lat: 52.2297, lng: 21.0122 },
  krakow:      { lat: 50.0647, lng: 19.9450 },
  wroclaw:     { lat: 51.1079, lng: 17.0385 },
  gdansk:      { lat: 54.3520, lng: 18.6466 },
  poznan:      { lat: 52.4064, lng: 16.9252 },
  lodz:        { lat: 51.7592, lng: 19.4560 },
  katowice:    { lat: 50.2649, lng: 19.0238 },
  lublin:      { lat: 51.2465, lng: 22.5684 },
  bydgoszcz:   { lat: 53.1235, lng: 18.0084 },
  bialystok:   { lat: 53.1325, lng: 23.1688 },
  czestochowa: { lat: 50.8118, lng: 19.1203 },
  radom:       { lat: 51.4027, lng: 21.1471 },
  torun:       { lat: 53.0138, lng: 18.5984 },
  kielce:      { lat: 50.8661, lng: 20.6286 },
  gliwice:     { lat: 50.2945, lng: 18.6714 },
  zabrze:      { lat: 50.3249, lng: 18.7853 },
  olsztyn:     { lat: 53.7784, lng: 20.4801 },
  gdynia:      { lat: 54.5189, lng: 18.5305 },
  sopot:       { lat: 54.4419, lng: 18.5602 },
}

export const CITIES = [
  { key: 'szczecin',    label: 'Szczecin',    region: 'Zachodniopomorskie', note: 'Base market' },
  { key: 'warszawa',    label: 'Warszawa',     region: 'Mazowieckie',        note: 'Premium +30%' },
  { key: 'radom',       label: 'Radom',        region: 'Mazowieckie',        note: 'Budget -5%' },
  { key: 'krakow',      label: 'Kraków',       region: 'Małopolskie',        note: 'Premium +25%' },
  { key: 'wroclaw',     label: 'Wrocław',      region: 'Dolnośląskie',       note: 'High-value +20%' },
  { key: 'gdansk',      label: 'Gdańsk',       region: 'Pomorskie',          note: 'High-value +20%' },
  { key: 'gdynia',      label: 'Gdynia',       region: 'Pomorskie',          note: 'High-value +15%' },
  { key: 'sopot',       label: 'Sopot',        region: 'Pomorskie',          note: 'High-value +20%' },
  { key: 'poznan',      label: 'Poznań',       region: 'Wielkopolskie',      note: 'High-value +15%' },
  { key: 'lodz',        label: 'Łódź',         region: 'Łódzkie',            note: 'Standard +5%' },
  { key: 'katowice',    label: 'Katowice',     region: 'Śląskie',            note: 'Standard +10%' },
  { key: 'gliwice',     label: 'Gliwice',      region: 'Śląskie',            note: 'Standard +5%' },
  { key: 'zabrze',      label: 'Zabrze',       region: 'Śląskie',            note: 'Standard +5%' },
  { key: 'czestochowa', label: 'Częstochowa',  region: 'Śląskie',            note: 'Budget -5%' },
  { key: 'lublin',      label: 'Lublin',       region: 'Lubelskie',          note: 'Base market' },
  { key: 'bydgoszcz',   label: 'Bydgoszcz',   region: 'Kujawsko-Pomorskie', note: 'Base market' },
  { key: 'torun',       label: 'Toruń',        region: 'Kujawsko-Pomorskie', note: 'Base market' },
  { key: 'bialystok',   label: 'Białystok',    region: 'Podlaskie',          note: 'Budget -5%' },
  { key: 'kielce',      label: 'Kielce',       region: 'Świętokrzyskie',     note: 'Budget -5%' },
  { key: 'olsztyn',     label: 'Olsztyn',      region: 'Warmińsko-Mazurskie',note: 'Budget -5%' },
]

export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

export function distanceBetweenCities(cityKey1, cityKey2) {
  if (cityKey1 === cityKey2) return 5
  const c1 = CITY_COORDS[cityKey1]
  const c2 = CITY_COORDS[cityKey2]
  if (!c1 || !c2) return 5
  return Math.round(haversineKm(c1.lat, c1.lng, c2.lat, c2.lng) * 10) / 10
}
