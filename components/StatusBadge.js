'use client'
import { useApp } from '../utils/appContext'

const STATUS_STYLES = {
  awaiting_payment: { bg: '#8B5CF6', color: '#FFF' },
  pending:    { bg: '#FFD600', color: '#000' },
  assigned:   { bg: '#007BFF', color: '#FFF' },
  collected:  { bg: '#FF9500', color: '#000' },
  in_transit: { bg: '#007BFF', color: '#FFF' },
  delivered:  { bg: '#00C853', color: '#FFF' },
  cancelled:  { bg: '#FF3B30', color: '#FFF' },
}

export default function StatusBadge({ status }) {
  const { t } = useApp()
  const s = STATUS_STYLES[status] || { bg: '#333', color: '#FFF' }
  const label = status ? t('status_' + status) : 'Unknown'
  return (
    <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}
