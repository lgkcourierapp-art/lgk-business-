/**
 * LGK Order Number Generation
 * Format: {CITY}-{ZONE}-{YYMMDD}-{SEQUENCE}-{CHECK}
 * Example: SZ-CEN-261231-10047-3
 */

const CITY_CODES = {
  szczecin: 'SZ', warszawa: 'WA', warsaw: 'WA',
  krakow: 'KR', kraków: 'KR', wroclaw: 'WR', wrocław: 'WR',
  gdansk: 'GD', gdańsk: 'GD', gdynia: 'GY', poznan: 'PO',
  poznań: 'PO', lodz: 'LO', łódź: 'LO', katowice: 'KA',
  lublin: 'LU', bydgoszcz: 'BY', torun: 'TO', toruń: 'TO',
  rzeszow: 'RZ', rzeszów: 'RZ', bialystok: 'BI', białystok: 'BI',
  london: 'LN', manchester: 'MC', birmingham: 'BM',
  leeds: 'LD', glasgow: 'GL', bristol: 'BS',
  berlin: 'BE', munich: 'MN', münchen: 'MN', hamburg: 'HH',
  cologne: 'KL', köln: 'KL', frankfurt: 'FF',
  nairobi: 'NBI', lagos: 'LOS', accra: 'ACC',
  dubai: 'DB', abudhabi: 'AD',
};

const ZONE_MAP = {
  szczecin: { '70': 'CEN', '71': 'NOR', '72': 'ZAC', '73': 'DAS', '74': 'POD', default: 'GEN' },
  warszawa: { '00': 'SRO', '01': 'ZOL', '02': 'MOK', '03': 'PRA', '04': 'WOL', default: 'GEN' },
  krakow:   { '30': 'STA', '31': 'KAZ', '32': 'NOH', '33': 'BRO', default: 'GEN' },
  wroclaw:  { '50': 'STA', '51': 'FAB', '52': 'KRZ', default: 'GEN' },
  gdansk:   { '80': 'SRO', '81': 'WRZ', '82': 'OLI', default: 'GEN' },
  london:   { 'E1': 'SHO', 'E2': 'BCK', 'N1': 'ISL', 'SE1': 'SBK', 'SW1': 'WES', 'W1': 'MAY', default: 'GEN' },
  berlin:   { '10': 'MIT', '12': 'FRI', '13': 'WED', '14': 'STE', default: 'GEN' },
  nairobi:  { default: 'CBD' },
  dubai:    { default: 'DIF' },
};

export function getCityCode(city) {
  const key = (city || '').toLowerCase().trim().replace(/[^a-z]/g, '');
  return CITY_CODES[key] || 'XX';
}

export function getZoneCode(city, postalCode) {
  const cityKey = (city || '').toLowerCase().trim().replace(/[^a-z]/g, '');
  const cityZones = ZONE_MAP[cityKey];
  if (!cityZones) return 'GEN';
  const postal = (postalCode || '').replace(/[\s-]/g, '');
  return cityZones[postal.slice(0, 2)] || cityZones[postal.slice(0, 1)] || cityZones['default'] || 'GEN';
}

export function formatDateCode(date = new Date()) {
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

export function calculateCheckDigit(input) {
  const digits = input.replace(/[^A-Z0-9]/g, '').split('')
    .map(c => isNaN(c) ? c.charCodeAt(0) - 55 : parseInt(c))
    .join('').split('').map(Number);
  let sum = 0, double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits[i];
    if (double) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    double = !double;
  }
  return String((10 - (sum % 10)) % 10);
}

export async function generateOrderNumber(supabase, pickupCity, pickupPostal) {
  const cityCode = getCityCode(pickupCity);
  const zoneCode = getZoneCode(pickupCity, pickupPostal);
  const dateCode = formatDateCode();
  try {
    const { data, error } = await supabase.rpc('get_next_order_sequence');
    if (error) throw error;
    const seq = String(data).padStart(5, '0');
    const base = `${cityCode}-${zoneCode}-${dateCode}-${seq}`;
    return `${base}-${calculateCheckDigit(base)}`;
  } catch (err) {
    console.error('Order number error:', err.message);
    const fallback = Date.now().toString().slice(-6);
    const base = `${cityCode}-${zoneCode}-${dateCode}-${fallback}`;
    return `${base}-${calculateCheckDigit(base)}`;
  }
}

export function validateOrderNumber(orderNumber) {
  if (!orderNumber || typeof orderNumber !== 'string') return false;
  const parts = orderNumber.split('-');
  if (parts.length !== 5) return false;
  const base = parts.slice(0, 4).join('-');
  return parts[4] === calculateCheckDigit(base);
}

export function parseOrderNumber(orderNumber) {
  if (!orderNumber) return null;
  const parts = orderNumber.split('-');
  if (parts.length !== 5) return null;
  const d = parts[2];
  return {
    cityCode: parts[0],
    zoneCode: parts[1],
    date: new Date(parseInt('20' + d.slice(0, 2)), parseInt(d.slice(2, 4)) - 1, parseInt(d.slice(4, 6))),
    sequence: parseInt(parts[3]),
    checkDigit: parts[4],
    isValid: validateOrderNumber(orderNumber),
  };
}
