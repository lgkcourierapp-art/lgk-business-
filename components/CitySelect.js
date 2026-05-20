'use client'
import { CITIES } from '@/lib/cities'

export default function CitySelect({ value, onChange, name, required, label }) {
  const grouped = {}
  CITIES.forEach(c => {
    if (!grouped[c.region]) grouped[c.region] = []
    grouped[c.region].push(c)
  })

  return (
    <div>
      {label && <label>{label}</label>}
      <select name={name} value={value} onChange={e => onChange(e.target.value)} required={required}>
        <option value="">Select city...</option>
        {Object.entries(grouped).map(([region, cities]) => (
          <optgroup key={region} label={region}>
            {cities.map(c => (
              <option key={c.key} value={c.key}>
                {c.label} — {c.note}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  )
}
