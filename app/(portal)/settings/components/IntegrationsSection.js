'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/utils/appContext'

export default function IntegrationsSection({ user }) {
  const { colors } = useApp()
  const [integrationFlag, setIntegrationFlag] = useState(false)
  const [existingApiKey, setExistingApiKey] = useState(null)
  const [newRawKey, setNewRawKey] = useState(null)
  const [generatingKey, setGeneratingKey] = useState(false)
  const [copying, setCopying] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('feature_flags').select('enabled').eq('name', 'gloriaFood_integration').single()
      .then(({ data }) => setIntegrationFlag(data?.enabled ?? false))
    supabase.from('api_keys').select('id, key_prefix, last_used_at, is_active')
      .eq('client_id', user['id']).eq('integration_type', 'gloriaFood').eq('is_active', true).maybeSingle()
      .then(({ data }) => setExistingApiKey(data ?? null))
  }, [user])

  const generateKey = async () => {
    if (!user) return
    setGeneratingKey(true)
    try {
      const array = new Uint8Array(24)
      window.crypto.getRandomValues(array)
      const raw = 'lgk_' + Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
      const encoder = new TextEncoder()
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoder.encode(raw))
      const hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
      const { data: inserted } = await supabase.from('api_keys').insert({
        client_id: user['id'], key_hash: hash, key_prefix: raw.slice(0, 12),
        name: 'GloriaFood', integration_type: 'gloriaFood', is_active: true,
      }).select('id, key_prefix, last_used_at, is_active').single()
      if (inserted) { setExistingApiKey(inserted); setNewRawKey(raw) }
    } catch (err) {
      console.error('Key generation failed:', err.message)
    }
    setGeneratingKey(false)
  }

  const disconnectKey = async () => {
    if (!user || !existingApiKey) return
    await supabase.from('api_keys').update({ is_active: false }).eq('id', existingApiKey['id'])
    setExistingApiKey(null)
    setNewRawKey(null)
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopying(true)
      setTimeout(() => setCopying(false), 2000)
    } catch { /* silent */ }
  }

  const card = { background: colors.card, border: '1px solid ' + colors.border, borderRadius: 12, padding: 24, marginBottom: 16 }
  const tile = { border: '1px solid ' + colors.border, borderRadius: 10, padding: 16, marginBottom: 12 }
  const tileHeader = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }

  return (
    <div style={card}>
      <div style={{ color: '#D4FF00', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Integracje POS</div>

      {/* GloriaFood */}
      <div style={tile}>
        <div style={{ ...tileHeader, marginBottom: integrationFlag ? 12 : 0 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: colors.text }}>GloriaFood</div>
            {!integrationFlag && <div style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>Wkrótce dostępne / Coming soon</div>}
          </div>
          <span style={{ fontSize: 22 }}>🍕</span>
        </div>

        {integrationFlag && (
          existingApiKey && !newRawKey ? (
            <div>
              <div style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 8 }}>
                Połączono · Klucz: <span style={{ fontFamily: 'monospace', color: colors.text }}>{existingApiKey.key_prefix}…</span>
              </div>
              {existingApiKey.last_used_at && (
                <div style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 12 }}>
                  Ostatnio użyty: {new Date(existingApiKey.last_used_at).toLocaleString('pl-PL')}
                </div>
              )}
              <button onClick={disconnectKey} style={{ background: 'transparent', border: '1px solid #FF3B30', color: '#FF3B30', padding: '8px 14px', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Rozłącz</button>
            </div>
          ) : newRawKey ? (
            <div>
              <div style={{ color: '#00C853', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Klucz API (skopiuj — nie będzie widoczny ponownie):</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                <code style={{ flex: 1, background: '#0A0A0A', color: '#D4FF00', padding: '8px 12px', borderRadius: 6, fontSize: 12, wordBreak: 'break-all', fontFamily: 'monospace' }}>{newRawKey}</code>
                <button onClick={() => copyToClipboard(newRawKey)} style={{ background: copying ? '#00C853' : '#D4FF00', color: '#000', border: 'none', padding: '8px 12px', borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>
                  {copying ? '✓' : 'Kopiuj'}
                </button>
              </div>
              <div style={{ background: '#D4FF0010', border: '1px solid #D4FF0030', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: colors.text, marginBottom: 4 }}>URL webhooka:</div>
                <code style={{ fontSize: 12, color: colors.textSecondary, fontFamily: 'monospace', wordBreak: 'break-all' }}>https://lgk-business.vercel.app/api/integrations/gloriaFood</code>
                <div style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8 }}>Wklej URL i klucz w GloriaFood → Webhook → Delivery Partner</div>
              </div>
              <button onClick={disconnectKey} style={{ background: 'transparent', border: '1px solid #FF3B30', color: '#FF3B30', padding: '8px 14px', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Rozłącz</button>
            </div>
          ) : (
            <button onClick={generateKey} disabled={generatingKey}
              style={{ background: '#D4FF00', color: '#000', border: 'none', padding: '10px 18px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: generatingKey ? 'not-allowed' : 'pointer', opacity: generatingKey ? 0.7 : 1 }}>
              {generatingKey ? 'Generowanie…' : 'Połącz GloriaFood'}
            </button>
          )
        )}
      </div>

      {/* GoPOS */}
      <div style={tile}>
        <div style={tileHeader}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: colors.text }}>GoPOS</div>
            <div style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>Coming soon · Q3 2026</div>
          </div>
          <span style={{ fontSize: 22 }}>🖥️</span>
        </div>
      </div>

      {/* Lightspeed */}
      <div style={tile}>
        <div style={tileHeader}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: colors.text }}>Lightspeed</div>
            <div style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>Coming soon</div>
          </div>
          <span style={{ fontSize: 22 }}>⚡</span>
        </div>
      </div>

      {/* Other */}
      <div style={{ ...tile, marginBottom: 0 }}>
        <div style={tileHeader}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: colors.text }}>Inne systemy POS</div>
            <div style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
              Skontaktuj się:{' '}
              <a href="mailto:lgkcourierapp@gmail.com" style={{ color: colors.text, fontWeight: 600 }}>lgkcourierapp@gmail.com</a>
            </div>
          </div>
          <span style={{ fontSize: 22 }}>🔌</span>
        </div>
      </div>
    </div>
  )
}
