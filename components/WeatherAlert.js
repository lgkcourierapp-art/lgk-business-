'use client';
import { useState, useEffect } from 'react';
import { fetchWeather } from '../utils/weatherService';
import { useApp } from '../utils/appContext';

export default function WeatherAlert({ city = 'szczecin', compact = false }) {
  const { colors, lang } = useApp();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchWeather(city).then(data => {
      setWeather(data);
      setLoading(false);
    });
  }, [city]);

  if (loading) return (
    <div style={{ background: colors.card, border: '1px solid ' + colors.border, borderRadius: '10px', padding: '12px 16px', marginBottom: '16px' }}>
      <div style={{ color: colors.textSecondary, fontSize: '13px' }}>Loading weather...</div>
    </div>
  );

  if (!weather) return null;

  const hasAlerts = weather.alerts && weather.alerts.length > 0;

  if (compact && !hasAlerts) return null;

  if (compact) {
    return (
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          background: '#FF950015',
          border: '1px solid #FF9500',
          borderRadius: '10px',
          padding: '10px 14px',
          marginBottom: '16px',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>{weather.icon}</span>
            <div>
              <div style={{ color: '#FF9500', fontWeight: 700, fontSize: '13px' }}>
                Weather alert · {weather.currentTemp}°C
              </div>
              <div style={{ color: colors.textSecondary, fontSize: '12px' }}>
                {weather.alerts[0].icon} {weather.alerts[0].text}
              </div>
            </div>
          </div>
          <span style={{ color: colors.textSecondary, fontSize: '12px' }}>{expanded ? '▲' : '▼'}</span>
        </div>

        {expanded && (
          <div style={{ marginTop: '12px', borderTop: '1px solid #FF950030', paddingTop: '10px' }}>
            {weather.alerts.map((alert, i) => (
              <div key={i} style={{ marginBottom: '8px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '16px', flexShrink: 0 }}>{alert.icon}</span>
                <div>
                  <div style={{ color: colors.text, fontWeight: 600, fontSize: '13px' }}>{alert.text}</div>
                  <div style={{ color: colors.textSecondary, fontSize: '12px' }}>{alert.action}</div>
                </div>
              </div>
            ))}
            <div style={{ color: colors.textSecondary, fontSize: '10px', marginTop: '8px' }}>
              {weather.currentTemp}°C now · {weather.maxTemp}°C max · Wind {weather.maxWind} km/h · Rain {weather.totalRain}mm
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      background: hasAlerts ? '#FF950010' : colors.card,
      border: '1px solid ' + (hasAlerts ? '#FF9500' : colors.border),
      borderRadius: '12px',
      padding: '16px 20px',
      marginBottom: '20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: hasAlerts ? '14px' : '0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>{weather.icon}</span>
          <div>
            <div style={{ color: colors.text, fontWeight: 700, fontSize: '15px' }}>
              {weather.currentTemp}°C now · {weather.maxTemp}°C today
            </div>
            <div style={{ color: colors.textSecondary, fontSize: '12px' }}>
              {weather.city.charAt(0).toUpperCase() + weather.city.slice(1)} · Wind {weather.maxWind} km/h · Rain {weather.totalRain}mm
            </div>
          </div>
        </div>
        {!hasAlerts && (
          <div style={{ background: '#00C85320', border: '1px solid #00C853', borderRadius: '20px', padding: '4px 12px', color: '#00C853', fontSize: '12px', fontWeight: 700 }}>
            Good conditions
          </div>
        )}
      </div>

      {hasAlerts && weather.alerts.map((alert, i) => (
        <div
          key={i}
          style={{
            background: alert.color + '12',
            border: '1px solid ' + alert.color + '40',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '8px',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
          }}
        >
          <span style={{ fontSize: '20px', flexShrink: 0 }}>{alert.icon}</span>
          <div>
            <div style={{ color: colors.text, fontWeight: 700, fontSize: '13px', marginBottom: '2px' }}>
              {alert.text}
            </div>
            <div style={{ color: colors.textSecondary, fontSize: '12px' }}>
              → {alert.action}
            </div>
          </div>
          {alert.severity === 'high' && (
            <div style={{ marginLeft: 'auto', background: alert.color, color: '#000', borderRadius: '6px', padding: '2px 8px', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>
              ALERT
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
