'use client';
import { useState, useEffect } from 'react';
import AdminNav from '../../components/AdminNav';
import { LiveStatusBadge } from '../../components/admin/LiveStatusBadge';
import { NotificationBell } from '../../components/admin/NotificationBell';

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
    @keyframes slideIn { from{transform:translateX(-100%)} to{transform:translateX(0)} }
  `
};

export default function AdminShell({ adminRole, children }) {
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const roleLabel = adminRole === 'ops_assistant' ? 'OPS ASSISTANT' : 'OPERATIONS CONTROL';

  const logoBlock = (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 2 }}>
        <span style={{ fontWeight: 900, fontSize: 17, color: '#D4FF00', letterSpacing: 3, fontFamily: 'var(--font-display)' }}>LGK</span>
        <span style={{ fontWeight: 300, fontSize: 8, color: 'rgba(255,255,255,0.6)', letterSpacing: 4, textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>HQ</span>
      </div>
      <div style={{ fontSize: 9, color: '#555', letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
        {roleLabel}
      </div>
    </div>
  );

  return (
    <div id="lgk-admin-root" style={{ display: 'flex', minHeight: '100vh', background: '#0A0A0A' }}>
      <style>{STYLES.fonts}{STYLES.vars}</style>

      {isMobile ? (
        <>
          {/* MOBILE TOP BAR */}
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, height: 56,
            background: '#0D0D0D', borderBottom: '1px solid #1E1E1E',
            zIndex: 200, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12,
          }}>
            <button
              onClick={() => setDrawerOpen(true)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', flexDirection: 'column', gap: 4 }}
              aria-label="Open menu"
            >
              {[0,1,2].map(i => (
                <span key={i} style={{ display: 'block', width: 20, height: 2, background: '#fff', borderRadius: 1 }} />
              ))}
            </button>
            <div style={{ flex: 1 }}>{logoBlock}</div>
            <NotificationBell />
          </div>

          {/* MOBILE DRAWER OVERLAY */}
          {drawerOpen && (
            <div
              onClick={() => setDrawerOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 299 }}
            />
          )}

          {/* MOBILE DRAWER */}
          {drawerOpen && (
            <div style={{
              position: 'fixed', top: 0, left: 0, bottom: 0, width: 220,
              background: '#0D0D0D', borderRight: '1px solid #1E1E1E',
              zIndex: 300, display: 'flex', flexDirection: 'column',
              animation: 'slideIn 0.2s ease',
            }}>
              <div style={{ flexShrink: 0, padding: '18px 16px 12px', borderBottom: '1px solid #1E1E1E' }}>
                {logoBlock}
                <div style={{ marginTop: 10 }}><LiveStatusBadge /></div>
              </div>
              <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }} onClick={() => setDrawerOpen(false)}>
                <AdminNav />
              </nav>
            </div>
          )}

          {/* MOBILE MAIN */}
          <main style={{ flex: 1, minHeight: '100vh', paddingTop: 56, width: '100%' }}>
            {children}
          </main>
        </>
      ) : (
        <>
          {/* DESKTOP SIDEBAR */}
          <aside style={{
            width: 196, flexShrink: 0,
            background: '#0D0D0D', borderRight: '1px solid #1E1E1E',
            position: 'fixed', top: 0, left: 0, bottom: 0,
            display: 'flex', flexDirection: 'column',
            zIndex: 100, overflow: 'hidden',
          }}>
            <div style={{ flexShrink: 0, padding: '18px 16px 12px', borderBottom: '1px solid #1E1E1E', background: '#0D0D0D' }}>
              {logoBlock}
              <div style={{ marginTop: 10 }}><LiveStatusBadge /></div>
            </div>
            <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
              <AdminNav />
            </nav>
          </aside>

          {/* DESKTOP NOTIFICATION BELL */}
          <div style={{ position: 'fixed', top: 16, right: 20, zIndex: 150 }}>
            <NotificationBell />
          </div>

          {/* DESKTOP MAIN */}
          <main style={{ marginLeft: 196, flex: 1, minHeight: '100vh' }}>
            {children}
          </main>
        </>
      )}
    </div>
  );
}
