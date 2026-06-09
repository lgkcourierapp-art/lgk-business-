'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/utils/appContext'

const STATUS_COLORS = {
  online: '#00C853',
  offline: '#555',
  on_delivery: '#FF9500',
}

export default function DriversPage() {
  const router = useRouter()
  const { colors } = useApp()

  const [user, setUser] = useState(null)
  const [flagEnabled, setFlagEnabled] = useState(false)
  const [overflowEnabled, setOverflowEnabled] = useState(false)
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)

  const [driverName, setDriverName] = useState('')
  const [driverPhone, setDriverPhone] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) { router.push('/login'); return }
      setUser(u)

      const [{ data: flagRow }, { data: overflowRow }, { data: driverRows }] = await Promise.all([
        supabase.from('feature_flags').select('enabled').eq('name', 'own_fleet_dispatch').single(),
        supabase.from('feature_flags').select('enabled').eq('name', 'overflow_to_gig').single(),
        supabase.from('profiles').select('id, email, company_name, phone, driver_status')
          .eq('employer_id', u['id']),
      ])

      setFlagEnabled(flagRow?.enabled ?? false)
      setOverflowEnabled(overflowRow?.enabled ?? false)
      setDrivers(driverRows ?? [])
      setLoading(false)
    })
  }, [router])

  const handleAddDriver = async (e) => {
    e.preventDefault()
    if (!driverName.trim() || !driverPhone.trim()) { setAddError('Podaj imię i telefon.'); return }
    setAdding(true)
    setAddError('')

    // Find or create profile by phone — MVP: look up by phone in profiles
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', driverPhone.trim())
      .maybeSingle()

    if (existing) {
      await supabase.from('profiles').update({
        employer_id: user['id'],
        is_fleet_driver: true,
        driver_status: 'offline',
      }).eq('id', existing['id'])
      const { data: updated } = await supabase.from('profiles')
        .select('id, email, company_name, phone, driver_status').eq('id', existing['id']).single()
      if (updated) setDrivers(prev => [...prev, updated])
    } else {
      // Placeholder — cannot create auth user client-side; user must register first
      setAddError('Kurier musi się najpierw zarejestrować w aplikacji. Poproś go o rejestrację, a następnie dodaj go tutaj po numerze telefonu.')
    }

    setDriverName('')
    setDriverPhone('')
    setAdding(false)
  }

  const handleOverflowToggle = async () => {
    const prev = overflowEnabled
    const newVal = !prev
    setOverflowEnabled(newVal)
    const { data, error } = await supabase
      .from('feature_flags')
      .update({ enabled: newVal })
      .eq('name', 'overflow_to_gig')
      .select()
      .single()
    if (error || !data) {
      setOverflowEnabled(prev)
      setAddError(!data && !error
        ? 'Brak uprawnień — wymagany dostęp administratora'
        : `Błąd: ${error?.message}`)
    }
  }

  const cardStyle = { background: colors.card, border: '1px solid ' + colors.border, borderRadius: 12, padding: 24, marginBottom: 16 }
  const inp = { width: '100%', padding: '11px 14px', background: colors.input ?? '#F5F5F5', border: '1px solid ' + colors.border, borderRadius: 8, color: colors.text, fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit' }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111827', fontSize: 18, fontWeight: 700 }}>
      Ładowanie…
    </div>
  )

  if (!flagEnabled) return (
    <div style={{ minHeight: '100vh', background: colors.bg }}>
      <main style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: colors.text }}>Zarządzanie kierowcami</h1>
        <div style={{ ...cardStyle, textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>🚗</div>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 8, color: colors.text }}>Coming soon</div>
          <div style={{ color: colors.textSecondary, fontSize: 14 }}>
            Własna flota kierowców jest dostępna w planie Fleet.<br />
            Skontaktuj się: <a href="mailto:lgkcourierapp@gmail.com" style={{ color: '#2563EB' }}>lgkcourierapp@gmail.com</a>
          </div>
        </div>
      </main>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: colors.bg }}>
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>

        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: colors.text }}>Zarządzanie kierowcami</h1>

        {/* Driver list */}
        <div style={cardStyle}>
          <div style={{ color: '#374151', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
            Twoi kierowcy ({drivers.length})
          </div>
          {drivers.length === 0 ? (
            <div style={{ color: colors.textSecondary, fontSize: 14 }}>Nie dodano jeszcze żadnych kierowców.</div>
          ) : (
            drivers.map(d => (
              <div key={d['id']} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid ' + colors.border }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: STATUS_COLORS[d.driver_status] ?? '#555', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: colors.text }}>{d.company_name || d.email}</div>
                  {d.phone && <div style={{ color: colors.textSecondary, fontSize: 12 }}>{d.phone}</div>}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: STATUS_COLORS[d.driver_status] ?? '#555', textTransform: 'capitalize' }}>
                  {d.driver_status ?? 'offline'}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Add driver */}
        <div style={cardStyle}>
          <div style={{ color: '#374151', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Dodaj kierowcę</div>
          <form onSubmit={handleAddDriver}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: colors.textSecondary, marginBottom: 5 }}>Imię i nazwisko</label>
              <input value={driverName} onChange={e => setDriverName(e.target.value)} placeholder="Jan Kowalski" style={inp} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: colors.textSecondary, marginBottom: 5 }}>Numer telefonu</label>
              <input value={driverPhone} onChange={e => setDriverPhone(e.target.value)} placeholder="+48 XXX XXX XXX" type="tel" style={inp} />
            </div>
            {addError && (
              <div style={{ background: '#FF3B3010', border: '1px solid #FF3B3030', borderRadius: 8, padding: '10px 14px', marginBottom: 12, color: '#FF3B30', fontSize: 13 }}>
                {addError}
              </div>
            )}
            <button type="submit" disabled={adding}
              style={{ background: adding ? '#E5E5E5' : '#D4FF00', color: '#000', border: 'none', padding: '11px 22px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: adding ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {adding ? 'Dodawanie…' : 'Dodaj kierowcę →'}
            </button>
          </form>
        </div>

        {/* Overflow toggle */}
        <div style={cardStyle}>
          <div style={{ color: '#374151', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Przepełnienie do sieci LGK</div>
          <div style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 16 }}>
            Gdy Twoi kierowcy są niedostępni, zamówienia trafiają automatycznie do kurierów LGK.
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
            <button
              type="button"
              onClick={handleOverflowToggle}
              style={{
                width: 48, height: 26, borderRadius: 13,
                background: overflowEnabled ? '#00C853' : colors.border,
                border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0,
              }}
              aria-label={overflowEnabled ? 'Wyłącz overflow' : 'Włącz overflow'}
            >
              <span style={{
                position: 'absolute', top: 3,
                left: overflowEnabled ? 25 : 3,
                width: 20, height: 20, background: '#FFF', borderRadius: '50%',
                transition: 'left 200ms ease', display: 'block',
              }} />
            </button>
            <span style={{ fontWeight: 600, fontSize: 14, color: overflowEnabled ? '#00C853' : colors.textSecondary }}>
              {overflowEnabled ? 'Włączone' : 'Wyłączone'}
            </span>
          </label>
        </div>

      </main>
    </div>
  )
}
