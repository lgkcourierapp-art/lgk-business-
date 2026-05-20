const CITY_MAP = {
  szczecin: 'Szczecin', warszawa: 'Warszawa', warsaw: 'Warszawa',
  krakow: 'Kraków', kraków: 'Kraków', wroclaw: 'Wrocław', wrocław: 'Wrocław',
  gdansk: 'Gdańsk', gdańsk: 'Gdańsk', gdynia: 'Gdynia', sopot: 'Sopot',
  poznan: 'Poznań', poznań: 'Poznań', lodz: 'Łódź', łódź: 'Łódź',
  katowice: 'Katowice', lublin: 'Lublin', bydgoszcz: 'Bydgoszcz',
  torun: 'Toruń', toruń: 'Toruń', gliwice: 'Gliwice', zabrze: 'Zabrze',
  bialystok: 'Białystok', białystok: 'Białystok', czestochowa: 'Częstochowa',
  częstochowa: 'Częstochowa', radom: 'Radom', kielce: 'Kielce', olsztyn: 'Olsztyn',
  dubai: 'Dubai', london: 'London', manchester: 'Manchester',
};

export function formatCity(city) {
  if (!city) return '';
  const key = city.toLowerCase().trim();
  return CITY_MAP[key] || capitaliseFirst(city.trim());
}

export function capitaliseFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatStreetAddress(street, house, apartment) {
  if (!street) return '';
  const base = `ul. ${capitaliseFirst(street.trim())} ${house || ''}`.trim();
  return apartment ? `${base}/${apartment}` : base;
}

export function formatFullAddress(street, house, apartment, postal, city) {
  const line1 = formatStreetAddress(street, house, apartment);
  const line2 = [postal, formatCity(city)].filter(Boolean).join(' ');
  return [line1, line2].filter(Boolean).join(', ');
}

export function formatStatusPL(status) {
  const map = {
    awaiting_payment: 'Oczekuje na płatność',
    pending: 'Oczekujące',
    assigned: 'Przydzielone',
    collected: 'Odebrane',
    in_transit: 'W drodze',
    delivered: 'Dostarczone',
    cancelled: 'Anulowane',
  };
  return map[status] || capitaliseFirst((status || '').replace(/_/g, ' '));
}
