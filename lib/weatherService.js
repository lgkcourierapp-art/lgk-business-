// Open-Meteo — completely free, no API key, no limit.
// Szczecin: lat=53.4289, lng=14.5530

const WMO_ICONS = {
  0:  { icon: '☀️', label: 'Słonecznie' },
  1:  { icon: '🌤', label: 'Prawie słonecznie' },
  2:  { icon: '⛅', label: 'Częściowe zachmurzenie' },
  3:  { icon: '☁️', label: 'Zachmurzenie' },
  45: { icon: '🌫️', label: 'Mgła' },
  48: { icon: '🌫️', label: 'Szadź' },
  51: { icon: '🌦️', label: 'Mżawka' },
  61: { icon: '🌧', label: 'Deszcz' },
  63: { icon: '🌧', label: 'Umiarkowany deszcz' },
  65: { icon: '🌧', label: 'Silny deszcz' },
  71: { icon: '❄️', label: 'Śnieg' },
  80: { icon: '🌦️', label: 'Przelotny deszcz' },
  95: { icon: '⛈️', label: 'Burza' },
}

function getWmo(code) {
  return WMO_ICONS[code] ||
    WMO_ICONS[Math.floor(code / 10) * 10] ||
    { icon: '🌥️', label: 'Zachmurzenie' }
}

function getBikeCondition(windKmh, rainPct) {
  if (windKmh > 30 || rainPct > 80) return {
    text: 'Warunki rowerowe: złe',
    color: '#FF3B30',
    bg: 'rgba(220,38,38,0.15)',
    level: 'bad',
  }
  if (windKmh > 20 || rainPct > 50) return {
    text: 'Warunki rowerowe: umiarkowane',
    color: '#FF9500',
    bg: 'rgba(255,149,0,0.15)',
    level: 'moderate',
  }
  return {
    text: 'Warunki rowerowe: dobre 🚲',
    color: '#16A34A',
    bg: 'rgba(22,163,74,0.15)',
    level: 'good',
  }
}

export async function fetchWeatherSzczecin() {
  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast' +
      '?latitude=53.4289&longitude=14.5530' +
      '&current=temperature_2m,weather_code,wind_speed_10m,' +
      'apparent_temperature,precipitation_probability' +
      '&hourly=temperature_2m,weather_code,' +
      'precipitation_probability,wind_speed_10m' +
      '&timezone=Europe%2FWarsaw&forecast_days=1'
    )
    if (!res.ok) return null
    const data = await res.json()
    const c = data.current
    const h = data.hourly

    const evIdx = h.time.findIndex(t => t.endsWith('T18:00'))
    const niIdx = h.time.findIndex(t => t.endsWith('T22:00'))

    return {
      now: {
        temp: Math.round(c.temperature_2m),
        feels: Math.round(c.apparent_temperature),
        wind: Math.round(c.wind_speed_10m),
        rain: c.precipitation_probability,
        ...getWmo(c.weather_code),
      },
      evening: {
        temp: Math.round(h.temperature_2m[evIdx]),
        wind: Math.round(h.wind_speed_10m[evIdx]),
        rain: h.precipitation_probability[evIdx],
        ...getWmo(h.weather_code[evIdx]),
      },
      night: {
        temp: Math.round(h.temperature_2m[niIdx]),
        wind: Math.round(h.wind_speed_10m[niIdx]),
        rain: h.precipitation_probability[niIdx],
        ...getWmo(h.weather_code[niIdx]),
      },
      bikeCondition: getBikeCondition(c.wind_speed_10m, c.precipitation_probability),
      fetchedAt: Date.now(),
    }
  } catch { return null }
}
