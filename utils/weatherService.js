const CITY_COORDS = {
  szczecin: { lat: 53.4285, lng: 14.5528 },
  warszawa: { lat: 52.2297, lng: 21.0122 },
  krakow: { lat: 50.0647, lng: 19.9450 },
  wroclaw: { lat: 51.1079, lng: 17.0385 },
  gdansk: { lat: 54.3520, lng: 18.6466 },
  gdynia: { lat: 54.5189, lng: 18.5305 },
  sopot: { lat: 54.4419, lng: 18.5602 },
  poznan: { lat: 52.4064, lng: 16.9252 },
  lodz: { lat: 51.7592, lng: 19.4560 },
  katowice: { lat: 50.2649, lng: 19.0238 },
  lublin: { lat: 51.2465, lng: 22.5684 },
  bydgoszcz: { lat: 53.1235, lng: 18.0084 },
  torun: { lat: 53.0138, lng: 18.5984 },
  gliwice: { lat: 50.2945, lng: 18.6714 },
  zabrze: { lat: 50.3249, lng: 18.7853 },
  bialystok: { lat: 53.1325, lng: 23.1688 },
  czestochowa: { lat: 50.8118, lng: 19.1203 },
  radom: { lat: 51.4027, lng: 21.1471 },
  kielce: { lat: 50.8661, lng: 20.6286 },
  olsztyn: { lat: 53.7784, lng: 20.4801 },
};

export async function fetchWeather(cityKey = 'szczecin') {
  const coords = CITY_COORDS[cityKey] || CITY_COORDS.szczecin;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&hourly=temperature_2m,precipitation_probability,precipitation,windspeed_10m,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max&timezone=Europe%2FWarsaw&forecast_days=1`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    const now = new Date();
    const currentHour = now.getHours();
    const shiftHours = Array.from({ length: 10 }, (_, i) => (currentHour + i) % 24);

    const hourly = data.hourly;
    const daily = data.daily;

    const shiftTemps = shiftHours.map(h => hourly.temperature_2m[h] || 0);
    const shiftRain = shiftHours.map(h => hourly.precipitation[h] || 0);
    const shiftRainProb = shiftHours.map(h => hourly.precipitation_probability[h] || 0);
    const shiftWind = shiftHours.map(h => hourly.windspeed_10m[h] || 0);

    const currentTemp = hourly.temperature_2m[currentHour] || 0;
    const maxTemp = daily.temperature_2m_max[0] || 0;
    const minTemp = daily.temperature_2m_min[0] || 0;
    const totalRain = daily.precipitation_sum[0] || 0;
    const maxWind = daily.windspeed_10m_max[0] || 0;
    const maxRainProb = Math.max(...shiftRainProb);
    const maxShiftWind = Math.max(...shiftWind);

    const alerts = generateAlerts({
      currentTemp, maxTemp, minTemp,
      totalRain, maxWind, maxRainProb,
      maxShiftWind, shiftRain, shiftHours
    });

    const rainHour = shiftHours.find((h, i) => (shiftRain[i] || 0) > 1);
    const rainStartTime = rainHour !== undefined
      ? `${String(rainHour).padStart(2, '0')}:00`
      : null;

    return {
      currentTemp: Math.round(currentTemp),
      maxTemp: Math.round(maxTemp),
      minTemp: Math.round(minTemp),
      totalRain: Math.round(totalRain * 10) / 10,
      maxWind: Math.round(maxWind),
      maxRainProb,
      alerts,
      rainStartTime,
      summary: getSummary(alerts, currentTemp, maxTemp),
      icon: getIcon(daily.weathercode[0], maxRainProb, maxWind),
      city: cityKey,
    };
  } catch (e) {
    return null;
  }
}

function generateAlerts({ currentTemp, maxTemp, minTemp, totalRain, maxWind, maxRainProb, maxShiftWind, shiftRain, shiftHours }) {
  const alerts = [];

  if (totalRain > 10 || maxRainProb > 70) {
    const rainHour = shiftHours.find((h, i) => (shiftRain[i] || 0) > 1);
    const timeNote = rainHour ? ` from ${String(rainHour).padStart(2, '0')}:00` : '';
    alerts.push({
      icon: '🌧️',
      text: `Heavy rain expected${timeNote}`,
      action: 'Waterproof fragile parcels before leaving',
      severity: 'high',
      color: '#007BFF',
    });
  } else if (totalRain > 2 || maxRainProb > 40) {
    alerts.push({
      icon: '🌦️',
      text: 'Light rain possible today',
      action: 'Consider bringing a rain cover',
      severity: 'low',
      color: '#007BFF',
    });
  }

  if (maxShiftWind > 50) {
    alerts.push({
      icon: '💨',
      text: `Strong wind ${Math.round(maxShiftWind)} km/h`,
      action: 'Cycling may be difficult — allow extra time',
      severity: 'high',
      color: '#FF9500',
    });
  } else if (maxShiftWind > 35) {
    alerts.push({
      icon: '🌬️',
      text: `Windy today ${Math.round(maxShiftWind)} km/h`,
      action: 'Secure packages on cargo bike',
      severity: 'medium',
      color: '#FF9500',
    });
  }

  if (minTemp < -5) {
    alerts.push({
      icon: '🥶',
      text: `Freezing temperatures ${Math.round(minTemp)}°C`,
      action: 'E-bike battery range reduced — plan shorter routes',
      severity: 'high',
      color: '#00C8FF',
    });
  } else if (minTemp < 2) {
    alerts.push({
      icon: '❄️',
      text: `Near freezing today ${Math.round(minTemp)}°C`,
      action: 'Watch for ice on roads and pavements',
      severity: 'medium',
      color: '#00C8FF',
    });
  }

  if (maxTemp > 33) {
    alerts.push({
      icon: '🌡️',
      text: `Very hot today ${Math.round(maxTemp)}°C`,
      action: 'Carry extra water — stay hydrated',
      severity: 'medium',
      color: '#FF3B30',
    });
  }

  return alerts;
}

function getSummary(alerts, currentTemp, maxTemp) {
  if (alerts.length === 0) return `Good conditions today · ${Math.round(currentTemp)}°C now → ${Math.round(maxTemp)}°C peak`;
  if (alerts.some(a => a.severity === 'high')) return `Challenging conditions — check alerts below`;
  return `Some weather to note today`;
}

function getIcon(weathercode, rainProb, wind) {
  if (weathercode >= 95) return '⛈️';
  if (weathercode >= 80 || rainProb > 70) return '🌧️';
  if (weathercode >= 61 || rainProb > 40) return '🌦️';
  if (weathercode >= 51) return '🌧️';
  if (weathercode >= 1 && weathercode <= 3) return '⛅';
  if (wind > 40) return '💨';
  return '☀️';
}

export function getWeatherAlertForCity(weatherData, lang = 'en') {
  if (!weatherData || !weatherData.alerts || weatherData.alerts.length === 0) return null;
  return weatherData;
}
