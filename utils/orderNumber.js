const CITY_CODES = {
  szczecin: 'SZ', warszawa: 'WA', warsaw: 'WA',
  krakow: 'KR', kraków: 'KR', wroclaw: 'WR', wrocław: 'WR',
  gdansk: 'GD', gdańsk: 'GD', gdynia: 'GY', sopot: 'SO',
  poznan: 'PO', poznań: 'PO', lodz: 'LO', łódź: 'LO',
  katowice: 'KA', lublin: 'LU', bydgoszcz: 'BY',
  torun: 'TO', toruń: 'TO', gliwice: 'GL', zabrze: 'ZA',
  bialystok: 'BI', białystok: 'BI', czestochowa: 'CZ',
  częstochowa: 'CZ', radom: 'RA', kielce: 'KI', olsztyn: 'OL',
  dubai: 'DB', london: 'LN', manchester: 'MC',
};

const ZONE_MAP = {
  szczecin: { '70': 'CEN', '71': 'NOR', '72': 'ZAC', default: 'GEN' },
  warszawa: { '00': 'SRO', '01': 'ZOL', '02': 'MOK', '03': 'PRA', '04': 'WOL', default: 'GEN' },
  krakow:   { '30': 'STA', '31': 'KAZ', '32': 'NOH', default: 'GEN' },
  wroclaw:  { '50': 'STA', '51': 'FAB', '52': 'KRZ', default: 'GEN' },
  gdansk:   { '80': 'SRO', '81': 'WRZ', '82': 'OLI', default: 'GEN' },
};

export function getZoneCode(city, postalCode) {
  const normalised = (city || '').toLowerCase().trim();
  const cityZones = ZONE_MAP[normalised];
  if (!cityZones) return 'GEN';
  const prefix = (postalCode || '').replace('-', '').slice(0, 2);
  return cityZones[prefix] || cityZones.default || 'GEN';
}

export function getCityCode(city) {
  const normalised = (city || '').toLowerCase().trim();
  return CITY_CODES[normalised] || 'XX';
}

export function formatDateCode(date = new Date()) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = String(date.getFullYear()).slice(2);
  return `${d}${m}${y}`;
}

export async function generateOrderNumber(supabase, pickupCity, pickupPostal) {
  const cityCode = getCityCode(pickupCity);
  const zoneCode = getZoneCode(pickupCity, pickupPostal);
  const dateCode = formatDateCode();
  const prefix = `${cityCode}-${zoneCode}-${dateCode}`;

  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('deliveries')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startOfDay.toISOString());

    const seq = String((count || 0) + 1).padStart(4, '0');
    return `${prefix}-${seq}`;
  } catch {
    const seq = String(Math.floor(Math.random() * 9000) + 1000);
    return `${prefix}-${seq}`;
  }
}
