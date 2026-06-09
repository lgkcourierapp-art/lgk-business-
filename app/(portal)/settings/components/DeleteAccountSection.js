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
        event_type: 'account_deleted',
        user_id: user['id'],
        metadata: { reason: 'user_requested', gdpr_art17: true },
        created_at: new Date().toISOString()
      })

      const { error } = await supabase.rpc('delete_own_account')
      if (error) throw error

      await supabase.auth.signOut()
      window.location.href = '/?deleted=true'
    } catch (err) {
      if (process.env.NODE_ENV === 'development') { console.error('Delete account error:', err.message) }
      setDeleteError(t('deleteError'))
      setDeleteStep(2)
    }
  }

  return (
    <>
      {/* Delete account section — no Danger Zone label */}
      <div style={{ background: colors.card, border: '1px solid #FF3B3040', borderRadius: 12, padding: 24, marginBottom: 16 }}>
        <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)', paddingTop: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: colors.text, margin: '0 0 4px' }}>{t('deleteAccount')}</p>
          <p style={{ fontSize: 12, color: colors.textSecondary, margin: '0 0 12px', lineHeight: 1.6 }}>{t('dangerDescription')}</p>
          <button onClick={() => setDeleteStep(1)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #FF3B30', background: 'transparent', color: '#FF3B30', fontSize: 13, cursor: 'pointer' }}>{t('deleteAccount')}</button>
        </div>
      </div>

      {/* Deletion modal */}
      {deleteStep > 0 && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          {/* Modal card — ALWAYS white, never theme-dependent */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '14px',
            padding: '28px 24px',
            maxWidth: '440px',
            width: '100%',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
            position: 'relative',
            zIndex: 1001,
          }}>

            {/* Step 1 — Consequences */}
            {deleteStep === 1 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FFF0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="ti ti-alert-triangle" style={{ fontSize: 18, color: '#CC0000' }} aria-hidden="true" />
                  </div>
                  <div>
                    <p style={{ color: '#111111', fontSize: '16px', fontWeight: '600', margin: 0 }}>{t('deleteModalTitle')}</p>
                    <p style={{ color: '#666666', fontSize: '12px', margin: 0 }}>{t('deleteModalSubtitle')}</p>
                  </div>
                </div>
                <div style={{ background: '#FFF5F5', border: '1px solid #FFCCCC', borderRadius: 8, padding: '12px 14px', marginBottom: 20 }}>
                  <p style={{ color: '#CC0000', fontSize: '12px', fontWeight: '500', margin: '0 0 8px' }}>{t('deleteModalWillDelete')}</p>
                  {[t('deleteItem1'), t('deleteItem2'), t('deleteItem3'), t('deleteItem4'), t('deleteItem5'), t('deleteItem6')].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
                      <i className="ti ti-x" style={{ fontSize: 12, color: '#CC0000', flexShrink: 0 }} aria-hidden="true" />
                      <span style={{ color: '#CC0000', fontSize: '12px' }}>{item}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={closeDeleteModal} style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #E0E0E0',
                    background: '#F5F5F5',
                    color: '#333333',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}>{t('cancelKeepAccount')}</button>
                  <button onClick={() => setDeleteStep(2)} style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '1px solid #E0E0E0',
                    background: '#FFFFFF',
                    color: '#666666',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}>{t('continueDelete')}</button>
                </div>
              </>
            )}

            {/* Step 2 — Type to confirm */}
            {deleteStep === 2 && (
              <>
                <p style={{ fontSize: 15, fontWeight: 500, color: '#111111', margin: '0 0 6px' }}>{t('confirmDeletion')}</p>
                <p style={{ fontSize: 12, color: '#666666', margin: '0 0 20px', lineHeight: 1.6 }}>
                  {t('typeDeletePrompt').split('DELETE').map((part, i, arr) =>
                    i < arr.length - 1
                      ? <>{part}<strong key={i} style={{ color: '#111111', fontFamily: 'monospace' }}>DELETE</strong></>
                      : part
                  )}
                </p>
                <input
                  type="text"
                  value={deleteInput}
                  onChange={e => setDeleteInput(e.target.value)}
                  placeholder={t('typeDeleteHere')}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    border: '1.5px solid #E0E0E0',
                    background: '#FAFAFA',
                    color: '#111111',
                    outline: 'none',
                    boxSizing: 'border-box',
                    marginBottom: 12,
                  }}
                />
                {deleteError && <p style={{ fontSize: 11, color: '#CC0000', margin: '0 0 12px' }}>{deleteError}</p>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={closeDeleteModal} style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #E0E0E0',
                    background: '#F5F5F5',
                    color: '#333333',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                  }}>{t('cancel')}</button>
                  <button onClick={handleDeleteAccount} disabled={!inputMatches}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: inputMatches ? 'pointer' : 'not-allowed',
                      background: inputMatches ? '#FF3B30' : '#F0F0F0',
                      color: inputMatches ? '#FFFFFF' : '#AAAAAA',
                      transition: 'all 0.15s ease',
                    }}>
                    {t('deleteMyAccount')}
                  </button>
                </div>
              </>
            )}

            {/* Step 3 — Deleting */}
            {deleteStep === 3 && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <i className="ti ti-trash" style={{ fontSize: 32, color: '#CC0000', marginBottom: 12, display: 'block' }} aria-hidden="true" />
                <p style={{ color: '#111111', fontSize: 15, fontWeight: 500, margin: '0 0 6px' }}>{t('deletingAccount')}</p>
                <p style={{ color: '#666666', fontSize: 12, margin: 0 }}>{t('doNotClose')}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
