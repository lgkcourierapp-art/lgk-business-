'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useApp } from '../utils/appContext'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { t, lang, toggleLang, colors } = useApp()
  const [user, setUser] = useState(null)
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [hasCompany, setHasCompany] = useState(false)
  const ref = useRef(null)

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setUser(session.user);
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_name, email')
      .eq('id', session.user['id'])
      .single();
    if (profile?.company_name && profile.company_name.trim().length > 0) {
      setDisplayName(profile.company_name.trim());
      setHasCompany(true);
    } else {
      setDisplayName((session.user.email || '').split('@')[0]);
      setHasCompany(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    window.addEventListener('lgk-profile-updated', fetchProfile);
    return () => window.removeEventListener('lgk-profile-updated', fetchProfile);
  }, [])

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navLinks = [
    { key: 'dashboard', href: '/dashboard' },
    { key: 'newOrder', href: '/orders/new' },
    { key: 'settings', href: '/settings' },
  ]

  return (
    <header style={{ background: '#0A0A0A', borderBottom: '1px solid #333', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => setMenuOpen(p => !p)} style={{ display: 'none', background: 'none', border: 'none', color: '#FFF', fontSize: 22, cursor: 'pointer', padding: 8 }} className="mobile-menu-btn">
          &#9776;
        </button>

        <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: '5px' }}>
          <span style={{
            fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', system-ui",
            fontWeight: 900,
            fontSize: '18px',
            color: '#D4FF00',
            letterSpacing: '3px',
          }}>LGK</span>
          <span style={{
            fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', system-ui",
            fontWeight: 300,
            fontSize: '9px',
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: '6px',
            textTransform: 'uppercase',
          }}>COURIER</span>
        </Link>

        <nav style={{ display: 'flex', gap: 8, alignItems: 'center' }} className="desktop-nav">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href} style={{ color: '#999', textDecoration: 'none', padding: '8px 12px', fontSize: 14 }}>
              {t(l.key)}
            </Link>
          ))}
        </nav>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Language toggle */}
          <button
            onClick={toggleLang}
            title={t('language')}
            style={{ background: '#1A1A1A', border: '1px solid #333', color: '#FFF', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            {lang === 'en' ? '🇬🇧 EN' : '🇵🇱 PL'}
          </button>

          <Link href="/orders/new" className="btn-primary" style={{ fontSize: 13, padding: '0 16px', height: 40 }}>
            + {t('newOrder')}
          </Link>

          {user && (
            <div ref={ref} style={{ position: 'relative' }}>
              <button
                onClick={() => setOpen(!open)}
                style={{
                  background: 'transparent',
                  border: '1px solid #333',
                  color: '#FFF',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  maxWidth: '200px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {hasCompany ? (
                  <span style={{ color: '#D4FF00', fontSize: '12px' }}>🏢</span>
                ) : (
                  <span style={{ color: '#666', fontSize: '12px' }}>👤</span>
                )}
                {displayName || '...'} ▾
              </button>
              {open && (
                <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: '#1A1A1A', border: '1px solid #333', borderRadius: 8, minWidth: 180, boxShadow: '0 4px 16px rgba(0,0,0,0.5)', zIndex: 100 }}>
                  {!hasCompany && (
                    <a
                      href="/settings"
                      style={{
                        display: 'block',
                        padding: '10px 16px',
                        color: '#FF9500',
                        textDecoration: 'none',
                        borderBottom: '1px solid #333',
                        fontSize: '13px',
                        background: '#FF950010',
                      }}
                    >
                      + Add company name
                    </a>
                  )}
                  {navLinks.map(item => (
                    <Link key={item.href} href={item.href} onClick={() => setOpen(false)} style={{ display: 'block', padding: '12px 16px', color: '#FFF', textDecoration: 'none', fontSize: 14, borderBottom: '1px solid #222' }}>
                      {t(item.key)}
                    </Link>
                  ))}
                  <button onClick={handleSignOut} style={{ display: 'block', width: '100%', padding: '12px 16px', color: '#FF3B30', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 14 }}>
                    {t('logOut')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {menuOpen && (
        <div style={{ background: '#111', borderTop: '1px solid #333', padding: 16 }}>
          {navLinks.map(item => (
            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '12px 0', color: '#FFF', textDecoration: 'none', fontSize: 15, borderBottom: '1px solid #222' }}>
              {t(item.key)}
            </Link>
          ))}
          <button
            onClick={toggleLang}
            style={{ display: 'block', padding: '12px 0', color: '#D4FF00', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 15, width: '100%', borderBottom: '1px solid #222' }}
          >
            {lang === 'en' ? '🇵🇱 Przełącz na Polski' : '🇬🇧 Switch to English'}
          </button>
          <button onClick={handleSignOut} style={{ display: 'block', padding: '12px 0', color: '#FF3B30', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: 15, width: '100%' }}>
            {t('logOut')}
          </button>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </header>
  )
}
