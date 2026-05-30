'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const NAV = [
  { href: '/admin',            label: 'Command',    icon: '⌂',  exact: true },
  { href: '/admin/finance',    label: 'Finanse',    icon: '💹' },
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
  { href: '/admin/moderation',  label: 'Moderation',  icon: '🛡️' },
  { href: '/admin/flags',       label: 'Flags',       icon: '🚩' },
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

const OPS_SECTIONS = ['/admin', '/admin/orders', '/admin/couriers', '/admin/cs', '/admin/clients', '/admin/waitlist', '/admin/payouts', '/admin/messages'];

const STORAGE_KEY = 'lgk_admin_nav_order';

export default function AdminShell({ adminRole, children }) {
  const pathname = usePathname();
  const [time, setTime] = useState('');
  const [navItems, setNavItems] = useState(NAV);

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }));
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const savedOrder = JSON.parse(saved);
        const reordered = savedOrder
          .map(href => NAV.find(n => n.href === href))
          .filter(Boolean);
        const newItems = NAV.filter(n => !savedOrder.includes(n.href));
        setNavItems([...reordered, ...newItems]);
      }
    } catch {}
  }, []);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(navItems);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setNavItems(items);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.map(n => n.href)));
  };

  const resetNavOrder = () => {
    localStorage.removeItem(STORAGE_KEY);
    setNavItems(NAV);
  };

  const isActive = (item) => item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const visibleNav = adminRole === 'ops_assistant'
    ? NAV.filter(n => OPS_SECTIONS.some(s => n.href === s))
    : navItems;

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
          {adminRole === 'ops_assistant' ? (
            visibleNav.map(item => {
              const active = isActive(item);
              return (
                <Link key={item.href} href={item.href} style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 14px', margin: '1px 8px', borderRadius: '8px', background: active ? 'rgba(212,255,0,0.08)' : 'transparent', borderLeft: `2px solid ${active ? 'var(--yellow)' : 'transparent'}`, transition: 'all 120ms ease', cursor: 'pointer' }}>
                    <span style={{ fontSize: '13px', opacity: active ? 1 : 0.7, lineHeight: 1 }}>{item.icon}</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: active ? 700 : 500, color: active ? 'var(--yellow)' : '#AAAAAA', letterSpacing: '-0.01em' }}>{item.label}</span>
                  </div>
                </Link>
              );
            })
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="admin-nav">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {visibleNav.map((item, index) => {
                      const active = isActive(item);
                      return (
                        <Draggable key={item.href} draggableId={item.href} index={index}>
                          {(drag, snapshot) => (
                            <div ref={drag.innerRef} {...drag.draggableProps} style={{ ...drag.draggableProps.style, opacity: snapshot.isDragging ? 0.8 : 1 }}>
                              <Link href={item.href} style={{ textDecoration: 'none', display: 'block' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 14px', margin: '1px 8px', borderRadius: '8px', background: active ? 'rgba(212,255,0,0.08)' : 'transparent', borderLeft: `2px solid ${active ? 'var(--yellow)' : 'transparent'}`, transition: 'background 120ms ease', cursor: snapshot.isDragging ? 'grabbing' : 'pointer' }}>
                                  <span {...drag.dragHandleProps} style={{ color: '#444', fontSize: '11px', lineHeight: 1, cursor: 'grab', flexShrink: 0, opacity: 0, transition: 'opacity 120ms' }}
                                    onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                                    onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                                  >⠿</span>
                                  <span style={{ fontSize: '13px', opacity: active ? 1 : 0.7, lineHeight: 1 }}>{item.icon}</span>
                                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: active ? 700 : 500, color: active ? 'var(--yellow)' : '#AAAAAA', letterSpacing: '-0.01em' }}>{item.label}</span>
                                </div>
                              </Link>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </nav>

        {/* Status footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2.5s infinite' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--success)', letterSpacing: '1px' }}>LIVE</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text3)' }}>Szczecin · {time}</div>
          {adminRole !== 'ops_assistant' && (
            <button onClick={resetNavOrder} style={{ marginTop: '8px', background: 'none', border: 'none', padding: 0, fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--text3)', cursor: 'pointer', letterSpacing: '0.5px', textDecoration: 'underline' }}>
              reset nav order
            </button>
          )}
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ marginLeft: '196px', flex: 1, minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}
