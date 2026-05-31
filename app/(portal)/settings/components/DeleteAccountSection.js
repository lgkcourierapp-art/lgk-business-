'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/utils/appContext'

const CONFIRM_WORD = 'DELETE'

export default function DeleteAccountSection() {
  const { t, colors } = useApp()
  const [deleteStep, setDeleteStep] = useState(0)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleteError, setDeleteError] = useState(null)
  const inputMatches = deleteInput === CONFIRM_WORD

  const closeDeleteModal = () => {
    setDeleteStep(0)
    setDeleteInput('')
    setDeleteError(null)
  }

  const handleDeleteAccount = async () => {
    if (!inputMatches) return
    setDeleteStep(3)
    setDeleteError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: prof } = await supabase.from('profiles').select('logo_url').eq('id', user['id']).single()
      if (prof?.logo_url) {
        const ext = prof.logo_url.split('.').pop().split('?')[0]
        await supabase.storage.from('avatars').remove([`${user['id']}/logo.${ext}`])
      }

      await supabase.from('audit_log').insert({
        event: 'account_deleted', actor_id: user['id'],
        details: { reason: 'user_requested', gdpr_art17: true },
        created_at: new Date().toISOString()
      })

      const { error } = await supabase.rpc('delete_own_account')
      if (error) throw error

      await supabase.auth.signOut()
      window.location.href = '/?deleted=true'
    } catch (err) {
      console.error('Delete account error:', err.message)
      setDeleteError('Something went wrong. Contact lgkcourierapp@gmail.com')
      setDeleteStep(2)
    }
  }

  const btn = (onClick, label, style) => (
    <button onClick={onClick} style={{ padding: '10px', borderRadius: 8, border: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', ...style }}>{label}</button>
  )

  return (
    <>
      {/* Danger zone card */}
      <div style={{ background: colors.card, border: '1px solid #FF3B3040', borderRadius: 12, padding: 24, marginBottom: 16 }}>
        <div style={{ color: '#FF3B30', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>{t('dangerZone')}</div>
        <div style={{ borderTop: '0.5px solid var(--color-border-tertiary)', paddingTop: 20, marginTop: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', margin: '0 0 4px' }}>Delete account</p>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 12px', lineHeight: 1.6 }}>Permanently delete your account and all associated data. This action cannot be undone.</p>
          <button onClick={() => setDeleteStep(1)} style={{ padding: '8px 16px', borderRadius: 8, border: '0.5px solid var(--color-border-danger)', background: 'transparent', color: 'var(--color-text-danger)', fontSize: 13, cursor: 'pointer' }}>Delete account</button>
        </div>
      </div>

      {/* Deletion modal */}
      {deleteStep > 0 && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: 24, maxWidth: 440, width: '100%' }}>

            {/* Step 1 — Consequences */}
            {deleteStep === 1 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-background-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="ti ti-alert-triangle" style={{ fontSize: 18, color: 'var(--color-text-danger)' }} aria-hidden="true" />
                  </div>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-text-primary)', margin: 0 }}>Delete your account</p>
                    <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', margin: 0 }}>This action is permanent and cannot be undone</p>
                  </div>
                </div>
                <div style={{ background: 'var(--color-background-danger)', border: '0.5px solid var(--color-border-danger)', borderRadius: 8, padding: '12px 14px', marginBottom: 20 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-danger)', margin: '0 0 8px' }}>The following will be permanently deleted:</p>
                  {['Your account and login credentials', 'Your company profile and settings', 'All orders and delivery history', 'All GPS proof photos', 'Your saved addresses', 'All invoices and billing records'].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
                      <i className="ti ti-x" style={{ fontSize: 12, color: 'var(--color-text-danger)', flexShrink: 0 }} aria-hidden="true" />
                      <span style={{ fontSize: 12, color: 'var(--color-text-danger)' }}>{item}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {btn(closeDeleteModal, 'Cancel — keep my account', { flex: 1 })}
                  {btn(() => setDeleteStep(2), 'Continue', { background: 'transparent', border: '0.5px solid var(--color-border-tertiary)', color: 'var(--color-text-secondary)' })}
                </div>
              </>
            )}

            {/* Step 2 — Type to confirm */}
            {deleteStep === 2 && (
              <>
                <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-text-primary)', margin: '0 0 6px' }}>Confirm deletion</p>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 20px', lineHeight: 1.6 }}>
                  Type <strong style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>DELETE</strong> to permanently delete your account.
                </p>
                <input type="text" value={deleteInput} onChange={e => setDeleteInput(e.target.value)} placeholder="Type DELETE here"
                  autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14, fontFamily: 'var(--font-mono)', border: inputMatches ? '0.5px solid var(--color-border-danger)' : '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', marginBottom: 12, boxSizing: 'border-box', outline: 'none' }} />
                {deleteError && <p style={{ fontSize: 11, color: 'var(--color-text-danger)', margin: '0 0 12px' }}>{deleteError}</p>}
                <div style={{ display: 'flex', gap: 8 }}>
                  {btn(closeDeleteModal, 'Cancel', { flex: 1 })}
                  <button onClick={handleDeleteAccount} disabled={!inputMatches}
                    style={{ padding: '10px 20px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: inputMatches ? 'pointer' : 'not-allowed', background: inputMatches ? '#FF3B30' : 'var(--color-background-secondary)', color: inputMatches ? '#FFFFFF' : 'var(--color-text-tertiary)', transition: 'all 0.15s ease' }}>
                    Delete my account
                  </button>
                </div>
              </>
            )}

            {/* Step 3 — Deleting */}
            {deleteStep === 3 && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <i className="ti ti-trash" style={{ fontSize: 32, color: 'var(--color-text-danger)', marginBottom: 12, display: 'block' }} aria-hidden="true" />
                <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-text-primary)', margin: '0 0 6px' }}>Deleting your account...</p>
                <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', margin: 0 }}>Please do not close this window.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
