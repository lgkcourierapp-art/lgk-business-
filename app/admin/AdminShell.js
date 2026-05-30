'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import AdminNav from '../../components/AdminNav';

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

export default function AdminShell({ adminRole, children }) {
  const pathname = usePathname();
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }));
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, []);

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
        <div style={{ padding: '6px 8px', flex: 1 }}>
          <AdminNav />
        </div>

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
