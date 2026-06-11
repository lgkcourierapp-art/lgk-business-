'use client';
import { useState } from 'react';
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

    /* Desktop: sidebar visible, no topbar */
    .admin-sidebar { display: flex; }
    .admin-topbar { display: none; }
    .admin-main { margin-left: 196px; }
    .admin-drawer-overlay { display: none; }

    /* Mobile: topbar visible, sidebar hidden */
    @media (max-width: 768px) {
      .admin-sidebar { display: none !important; }
      .admin-topbar { display: flex !important; }
      .admin-main { margin-left: 0 !important; padding-top: 56px; }
      .admin-drawer { position: fixed; top: 0; left: 0; bottom: 0; width: 220px; background: #0D0D0D; border-right: 1px solid #1E1E1E; z-index: 300; display: flex; flex-direction: column; animation: slideIn 0.2s ease; }
      .admin-drawer-overlay { display: block !important; position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 299; }
    }
  `
};

export default function AdminShell({ adminRole, children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const logoBlock = (
    <>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 17, color: 'var(--yellow)', letterSpacing: 3 }}>LGK</span>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 8, color: 'rgba(255,255,255,0.6)', letterSpacing: 4, textTransform: 'uppercase' }}>HQ</span>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
        {adminRole === 'ops_assistant' ? 'OPS ASSISTANT' : 'OPERATIONS CONTROL'}
      </div>
    </>
  );

  return (
    <div id="lgk-admin-root" style={{ display: 'flex', minHeight: '100vh', background: '#0A0A0A' }}>
      <style>{STYLES.fonts}{STYLES.vars}</style>

      {/* DESKTOP SIDEBAR */}
      <aside className="admin-sidebar" style={{
        width: 196, flexShrink: 0,
        background: '#0D0D0D',
        borderRight: '1px solid var(--border)',
        position: 'fixed', top: 0, left: 0, bottom: 0,
        flexDirection: 'column',
        zIndex: 100, overflow: 'hidden',
      }}>
        <div style={{ flexShrink: 0, padding: '18px 16px 12px', borderBottom: '1px solid var(--border)', background: '#0D0D0D' }}>
          {logoBlock}
          <div style={{ marginTop: 10 }}>
            <LiveStatusBadge />
          </div>
        </div>
        <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
          <AdminNav />
        </nav>
      </aside>

      {/* MOBILE TOP BAR */}
      <div className="admin-topbar" style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 56,
        background: '#0D0D0D', borderBottom: '1px solid var(--border)',
        zIndex: 200, alignItems: 'center', padding: '0 16px', gap: 12,
      }}>
        <button
          onClick={() => setDrawerOpen(true)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, color: '#fff', display: 'flex', flexDirection: 'column', gap: 4 }}
          aria-label="Open menu"
        >
          <span style={{ display: 'block', width: 20, height: 2, background: '#fff', borderRadius: 1 }} />
          <span style={{ display: 'block', width: 20, height: 2, background: '#fff', borderRadius: 1 }} />
          <span style={{ display: 'block', width: 20, height: 2, background: '#fff', borderRadius: 1 }} />
        </button>

        <div style={{ flex: 1 }}>{logoBlock}</div>

        <NotificationBell />
      </div>

      {/* MOBILE DRAWER */}
      {drawerOpen && (
        <>
          <div className="admin-drawer-overlay" onClick={() => setDrawerOpen(false)} />
          <div className="admin-drawer">
            <div style={{ flexShrink: 0, padding: '18px 16px 12px', borderBottom: '1px solid var(--border)' }}>
              {logoBlock}
              <div style={{ marginTop: 10 }}>
                <LiveStatusBadge />
              </div>
            </div>
            <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }} onClick={() => setDrawerOpen(false)}>
              <AdminNav />
            </nav>
          </div>
        </>
      )}

      {/* MAIN */}
      <main className="admin-main" style={{ flex: 1, minHeight: '100vh' }}>
        {/* Desktop notification bell — top right */}
        <div style={{ position: 'fixed', top: 16, right: 20, zIndex: 150 }} className="admin-sidebar">
          <NotificationBell />
        </div>
        {children}
      </main>
    </div>
  );
}
