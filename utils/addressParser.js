const KNOWN_CITIES = [
  'szczecin','warszawa','warsaw','krakow','kraków','wroclaw','wrocław',
  'gdansk','gdańsk','gdynia','sopot','poznan','poznań','lodz','łódź',
  'katowice','lublin','bydgoszcz','torun','toruń','gliwice','zabrze',
  'bialystok','białystok','czestochowa','częstochowa','radom','kielce','olsztyn'
];

const CITY_KEY_MAP = {
  warsaw: 'warszawa', kraków: 'krakow', wrocław: 'wroclaw',
  gdańsk: 'gdansk', poznań: 'poznan', łódź: 'lodz',
  białystok: 'bialystok', częstochowa: 'czestochowa', toruń: 'torun'
};

export function parseAddress(raw) {
  if (!raw || raw.trim().length < 3) return null;

  let input = raw.trim();

  // Extract name if present (text before comma that has no digits)
  let contactName = '';
  const nameParts = input.split(',');
  if (nameParts.length > 1) {
    const firstPart = nameParts[0].trim();
    if (!/\d/.test(firstPart) && firstPart.split(' ').length <= 4 && firstPart.length < 40) {
      contactName = firstPart;
      input = nameParts.slice(1).join(',').trim();
    }
  }

  // Remove ul. al. pl. os. prefixes
  input = input.replace(/^(ul\.|al\.|pl\.|os\.|ulica\s|aleja\s|plac\s)/i, '').trim();

  // Extract postal code XX-XXX
  const postalMatch = input.match(/\b(\d{2}-\d{3})\b/);
  const postal = postalMatch ? postalMatch[1] : '';
  if (postal) input = input.replace(postal, '').trim();

  // Extract apartment (after / or m. or lok. or mieszkanie or apt)
  let apartment = '';
  const aptPatterns = [
    /[\/\\](\w+)/,
    /\bm\.?\s*(\w+)/i,
    /\blok\.?\s*(\w+)/i,
    /\bapt\.?\s*(\w+)/i,
    /\bmieszkanie\s+(\w+)/i
  ];
  for (const pattern of aptPatterns) {
    const match = input.match(pattern);
    if (match) {
      apartment = match[1];
      input = input.replace(match[0], '').trim();
      break;
    }
  }

  // Extract city
  let city = '';
  let cityKey = '';
  for (const c of KNOWN_CITIES) {
    if (input.toLowerCase().includes(c)) {
      city = c;
      cityKey = CITY_KEY_MAP[c] || c;
      input = input.toLowerCase().replace(c, '').trim();
      input = input.replace(/,$/, '').trim();
      break;
    }
  }

  // Extract house number (first sequence of digits possibly followed by letter)
  const houseMatch = input.match(/\b(\d+[a-zA-Z]?)\b/);
  const house = houseMatch ? houseMatch[1] : '';
  if (house) input = input.replace(houseMatch[0], '').trim();

  // What remains is street name
  const street = input.replace(/[,\-\.]+$/, '').trim();

  return {
    contactName,
    street: street || '',
    house: house || '',
    apartment: apartment || '',
    postal: postal || '',
    city: cityKey || city || '',
    confidence: street && house ? 'high' : street ? 'medium' : 'low'
  };
}

export function readClipboard() {
  if (navigator.clipboard && navigator.clipboard.readText) {
    return navigator.clipboard.readText();
  }
  return Promise.resolve('');
}
