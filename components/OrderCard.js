'use client'
import Link from 'next/link'
import StatusBadge from './StatusBadge'
import { useApp } from '../utils/appContext'
import { formatCity } from '../utils/capitalize'

function truncate(str, n) {
  if (!str) return '—'
  return str.length > n ? str.slice(0, n) + '…' : str
}

function formatTime(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
}

export default function OrderCard({ order, showProof = false }) {
  const { t } = useApp()
  const orderId = order['id'] || order.id
  const shortId = orderId?.slice(-6)?.toUpperCase() || '??????'

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>#{shortId}</span>
          <StatusBadge status={order.status} />
        </div>
        {order.delivered_at && <span style={{ color: '#999', fontSize: 12 }}>{t('deliveredAt')} {formatTime(order.delivered_at)}</span>}
        {order.status === 'in_transit' && order.created_at && <span style={{ color: '#D4FF00', fontSize: 12 }}>{t('eta')}: {formatTime(new Date(new Date(order.created_at).getTime() + 90*60000))}</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12, fontSize: 13 }}>
        <div>
          <div style={{ color: '#666', fontSize: 11, marginBottom: 2 }}>{t('from')}</div>
          <div style={{ color: '#FFF' }}>{truncate(formatCity(order.pickup_city), 20)}</div>
          <div style={{ color: '#999' }}>{truncate(order.pickup_address, 40)}</div>
        </div>
        <div>
          <div style={{ color: '#666', fontSize: 11, marginBottom: 2 }}>{t('to')}</div>
          <div style={{ color: '#FFF' }}>{truncate(formatCity(order.delivery_city), 20)}</div>
          <div style={{ color: '#999' }}>{truncate(order.delivery_address, 40)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ color: '#D4FF00', fontWeight: 700 }}>PLN {order.price_total || '—'}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {showProof && order.proof_photo_url && (
            <a href={order.proof_photo_url} target="_blank" rel="noreferrer" style={{ background: '#1A1A1A', border: '1px solid #333', color: '#FFF', padding: '6px 14px', borderRadius: 6, fontSize: 12, textDecoration: 'none', cursor: 'pointer' }}>
              {t('viewProof')}
            </a>
          )}
          <Link href={`/orders/${orderId}`} style={{ background: '#D4FF00', color: '#0A0A0A', padding: '6px 16px', borderRadius: 6, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
            {showProof ? t('viewDetails') : t('track')}
          </Link>
        </div>
      </div>
    </div>
  )
}
