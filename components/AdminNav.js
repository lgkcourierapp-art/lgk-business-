'use client'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  DragDropContext,
  Droppable,
  Draggable
} from '@hello-pangea/dnd'

const STORAGE_KEY = 'lgk_admin_nav_order'

const DEFAULT_NAV = [
  { key: 'finance',    label: 'Finance',    href: '/admin/finance',     icon: 'ti-cash' },
  { key: 'dashboard',  label: 'Dashboard',  href: '/admin',             icon: 'ti-layout-dashboard' },
  { key: 'orders',     label: 'Orders',     href: '/admin/orders',      icon: 'ti-package' },
  { key: 'couriers',   label: 'Couriers',   href: '/admin/couriers',    icon: 'ti-bike' },
  { key: 'clients',    label: 'Clients',    href: '/admin/clients',     icon: 'ti-building-store' },
  { key: 'flags',      label: 'Flags',      href: '/admin/flags',       icon: 'ti-toggle-right' },
  { key: 'waitlist',   label: 'Waitlist',   href: '/admin/waitlist',    icon: 'ti-clock' },
  { key: 'payouts',    label: 'Payouts',    href: '/admin/payouts',     icon: 'ti-wallet' },
  { key: 'earnings',   label: 'Earnings',   href: '/admin/earnings',    icon: 'ti-coins' },
  { key: 'moderation', label: 'Moderation', href: '/admin/moderation',  icon: 'ti-shield-check' },
  { key: 'brama',      label: 'Brama',      href: '/admin/brama',       icon: 'ti-door' },
  { key: 'analytics',  label: 'Analytics',  href: '/admin/analytics',   icon: 'ti-chart-bar' },
  { key: 'revenue',    label: 'Revenue',    href: '/admin/revenue',     icon: 'ti-chart-line' },
  { key: 'security',   label: 'Security',   href: '/admin/security',    icon: 'ti-lock' },
  { key: 'audit',      label: 'Audit log',  href: '/admin/audit',       icon: 'ti-history' },
  { key: 'regions',    label: 'Regions',    href: '/admin/regions',     icon: 'ti-map' },
  { key: 'messages',   label: 'Messages',   href: '/admin/messages',    icon: 'ti-message' },
  { key: 'cs',         label: 'CS',         href: '/admin/cs',          icon: 'ti-headset' },
  { key: 'enterprise', label: 'Enterprise', href: '/admin/enterprise',  icon: 'ti-building' },
  { key: 'monitoring', label: 'Monitoring', href: '/admin/monitoring',  icon: 'ti-activity' },
  { key: 'settings',   label: 'Settings',   href: '/admin/settings',    icon: 'ti-settings' },
]

export default function AdminNav() {
  const pathname = usePathname()
  const [navItems, setNavItems] = useState(DEFAULT_NAV)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const keys = JSON.parse(saved)
        const ordered = keys
          .map(k => DEFAULT_NAV.find(n => n.key === k))
          .filter(Boolean)
        const newItems = DEFAULT_NAV.filter(n => !keys.includes(n.key))
        setNavItems([...ordered, ...newItems])
      }
    } catch {}
  }, [])

  const handleDragEnd = (result) => {
    if (!result.destination) return
    if (result.destination.index === result.source.index) return
    const items = Array.from(navItems)
    const [removed] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, removed)
    setNavItems(items)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.map(i => i.key)))
    } catch {}
  }

  const resetOrder = () => {
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
    setNavItems(DEFAULT_NAV)
  }

  const isActive = (href) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  if (!mounted) {
    return (
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {DEFAULT_NAV.map(item => (
          <Link key={item.key} href={item.href} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 10px', borderRadius: '6px', fontSize: '13px',
            color: 'var(--text2)', textDecoration: 'none',
          }}>
            <i className={`ti ${item.icon}`} style={{ fontSize: '16px' }} aria-hidden="true" />
            {item.label}
          </Link>
        ))}
      </nav>
    )
  }

  return (
    <div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="admin-nav">
          {(provided) => (
            <nav
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}
            >
              {navItems.map((item, index) => (
                <Draggable key={item.key} draggableId={item.key} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      style={{
                        ...provided.draggableProps.style,
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '6px',
                        background: snapshot.isDragging
                          ? 'var(--card2)'
                          : isActive(item.href)
                          ? 'var(--card2)'
                          : 'transparent',
                        opacity: snapshot.isDragging ? 0.85 : 1,
                      }}
                    >
                      <div
                        {...provided.dragHandleProps}
                        style={{
                          padding: '8px 4px 8px 8px',
                          cursor: 'grab',
                          color: 'var(--text3)',
                          fontSize: '12px',
                          flexShrink: 0,
                          userSelect: 'none',
                        }}
                        title="Drag to reorder"
                      >
                        ⠿
                      </div>
                      <Link
                        href={item.href}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 10px 8px 4px',
                          flex: 1,
                          fontSize: '13px',
                          color: isActive(item.href) ? 'var(--text)' : 'var(--text2)',
                          textDecoration: 'none',
                          fontWeight: isActive(item.href) ? '500' : '400',
                        }}
                      >
                        <i
                          className={`ti ${item.icon}`}
                          style={{ fontSize: '16px', flexShrink: 0 }}
                          aria-hidden="true"
                        />
                        {item.label}
                      </Link>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </nav>
          )}
        </Droppable>
      </DragDropContext>

      <button
        onClick={resetOrder}
        style={{
          marginTop: '12px',
          padding: '6px 10px',
          fontSize: '11px',
          color: 'var(--text3)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          width: '100%',
          textAlign: 'left',
        }}
      >
        ↺ Reset nav order
      </button>
    </div>
  )
}
