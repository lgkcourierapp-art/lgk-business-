'use client';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const NAV = [
  { href: '/admin',            label: 'Command',    icon: '⌂',  exact: true },
  { href: '/admin/orders',     label: 'Orders',     icon: '📦' },
  { href: '/admin/couriers',   label: 'Couriers',   icon: '🚴' },
  { href: '/admin/brama',      label: 'Brama',      icon: '🔑' },
  { href: '/admin/analytics',  label: 'Analytics',  icon: '📊' },
  { href: '/admin/revenue',    label: 'Revenue',    icon: '💰' },
  { href: '/admin/cs',         label: 'CS Ops',     icon: '🎫' },
  { href: '/admin/clients',    label: 'Clients',    icon: '👥' },
  { href: '/admin/enterprise', label: 'Enterprise', icon: '🚀' },
  { href: '/admin/regions',    label: 'Regions',    icon: '🌍' },
  { href: '/admin/waitlist',   label: 'Waitlist',   icon: '📋' },
  { href: '/admin/payouts',    label: 'Payouts',    icon: '💸' },
  { href: '/admin/messages',   label: 'Messages',   icon: '📣' },
  { href: '/admin/security',    label: 'Security',    icon: '🔒' },
  { href: '/admin/monitoring',  label: 'Monitoring',  icon: '🔭' },
  { href: '/admin/settings',    label: 'Settings',    icon: '⚙️' },
];

const STYLES = {
  fonts: `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;900&family=Fira+Code:wght@400;500;600;700&display=swap');`,
  vars: `
    #lgk-admin-root, #lgk-admin-root * { box-sizing: border-box; }
    #lgk-admin-root {
      --bg: #0A0A0A; --card: #141414; --card2: #1A1A1A;
      --border: #1E1E1E; --border2: #2A2A2A;
      --yellow: #D4FF00; --yellow-dim: rgba(212,255,0,0.08);
      --success: #00C853; --warning: #FF9500;
      --danger: #FF3B30; --info: #007BFF;
      --text: #FFFFFF; --text2: #888888; --text3: #707070;
      --font-display: 'Space Grotesk', system-ui, sans-serif;
      --font-mono: 'Fira Code', monospace;
      background: var(--bg); color: var(--text); font-family: var(--font-display);
      min-height: 100vh;
    }
    #lgk-admin-root ::-webkit-scrollbar { width: 3px; }
    #lgk-admin-root ::-webkit-scrollbar-track { background: var(--bg); }
    #lgk-admin-root ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
    @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
  `
};

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [adminRole, setAdminRole] = useState(null);
  const [time, setTime] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/login'); return; }
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin, admin_role')
        .eq('id', session.user['id'])
        .single();
      if (!profile?.is_admin) { router.push('/dashboard'); return; }
      setAdminRole(profile.admin_role || 'super_admin');
      setReady(true);
    });

    const tick = () => setTime(new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }));
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, []);

  if (!ready) return (
    <div id="lgk-admin-root" style={{ minHeight: '100vh', background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{STYLES.fonts}{STYLES.vars}</style>
      <span style={{ fontFamily: "'Fira Code', monospace", fontSize: '13px', color: '#333' }}>authenticating...</span>
    </div>
  );

  const isActive = (item) => item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const OPS_SECTIONS = ['/admin', '/admin/orders', '/admin/couriers', '/admin/cs', '/admin/clients', '/admin/waitlist', '/admin/payouts', '/admin/messages'];
  const visibleNav = adminRole === 'ops_assistant'
    ? NAV.filter(n => OPS_SECTIONS.some(s => n.href === s))
    : NAV;

  return (
    <div id="lgk-admin-root" style={{ display: 'flex', minHeight: '100vh', background: '#0A0A0A' }}>
      <style>{STYLES.fonts}{STYLES.vars}</style>

      {/* SIDEBAR */}
      <aside style={{
        width: '196px', flexShrink: 0,
        background: '#0D0D0D',
        borderRight: '1px solid var(--border)',
        position: 'fixed', top: 0, left: 0, bottom: 0,
        display: 'flex', flexDirection: 'column',
        zIndex: 100, overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '17px', color: 'var(--yellow)', letterSpacing: '3px' }}>LGK</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: '8px', color: 'rgba(255,255,255,0.6)', letterSpacing: '4px', textTransform: 'uppercase' }}>HQ</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text3)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            {adminRole === 'ops_assistant' ? 'OPS ASSISTANT' : 'OPERATIONS CONTROL'}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '6px 0', flex: 1 }}>
          {visibleNav.map(item => {
            const active = isActive(item);
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '9px',
                  padding: '9px 14px',
                  margin: '1px 8px',
                  borderRadius: '8px',
                  background: active ? 'rgba(212,255,0,0.08)' : 'transparent',
                  borderLeft: `2px solid ${active ? 'var(--yellow)' : 'transparent'}`,
                  transition: 'all 120ms ease',
                  cursor: 'pointer',
                }}>
                  <span style={{ fontSize: '13px', opacity: active ? 1 : 0.7, lineHeight: 1 }}>{item.icon}</span>
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '13px',
                    fontWeight: active ? 700 : 500,
                    color: active ? 'var(--yellow)' : '#AAAAAA',
                    letterSpacing: '-0.01em',
                  }}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Status footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2.5s infinite' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--success)', letterSpacing: '1px' }}>LIVE</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text3)' }}>Szczecin · {time}</div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ marginLeft: '196px', flex: 1, minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}
