'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const M = {
  mono: { fontFamily: "'Fira Code', monospace" },
  display: { fontFamily: "'Space Grotesk', sans-serif" },
};

const TYPE_COLORS = { proof: '#007BFF', brama: '#D4FF00', avatar: '#888' };
const STATUS_COLORS = {
  pending_review: '#FF9500',
  approved: '#00C853',
  removed: '#FF3B30',
  disputed: '#8B5CF6',
};

const TABS = ['pending_review', 'approved', 'removed', 'disputed'];

function aiScoreBadge(score) {
  if (score == null) return null;
  const [color, label] =
    score < 1 ? ['#00C853', 'AI: Clean'] :
    score === 2 ? ['#FF9500', 'AI: Review'] :
                  ['#FF3B30', 'AI: Flag'];
  return (
    <span style={{
      ...M.mono, fontSize: '10px', fontWeight: 700, color,
      background: `${color}18`, padding: '2px 7px', borderRadius: '4px',
    }}>{label}</span>
  );
}

export default function AdminModeration() {
  const [images, setImages] = useState([]);
  const [activeTab, setActiveTab] = useState('pending_review');
  const [tabCounts, setTabCounts] = useState({ pending_review: 0, approved: 0, removed: 0, disputed: 0 });
  const [loading, setLoading] = useState(true);
  const [aiFlag, setAiFlag] = useState(false);

  useEffect(() => {
    fetchImages(activeTab);
    fetchTabCounts();
    fetchAiFlag();
  }, [activeTab]);

  const fetchImages = async (status) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('image_moderation')
      .select(`
        *,
        courier:profiles!courier_id(name, email),
        client:profiles!client_id(name, email, client_tier)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error) setImages(data ?? []);
    setLoading(false);
  };

  const fetchTabCounts = async () => {
    const counts = {};
    for (const s of TABS) {
      const { count } = await supabase
        .from('image_moderation')
        .select('*', { count: 'exact', head: true })
        .eq('status', s);
      counts[s] = count ?? 0;
    }
    setTabCounts(counts);
  };

  const fetchAiFlag = async () => {
    const { data } = await supabase
      .from('feature_flags')
      .select('enabled')
      .eq('name', 'ai_moderation_enabled')
      .single();
    setAiFlag(data?.enabled ?? false);
  };

  const handleAction = async (imageId, action, courierId) => {
    const { data: { user } } = await supabase.auth.getUser();
    const adminUid = user?.['id'];

    if (action === 'ban') {
      await supabase
        .from('image_moderation')
        .update({ status: 'removed', reviewed_by: adminUid, reviewed_at: new Date().toISOString() })
        .eq('id', imageId);

      await supabase
        .from('profiles')
        .update({ is_banned: true, updated_at: new Date().toISOString() })
        .eq('id', courierId);

      await supabase.from('audit_log').insert({
        event_type: 'courier_banned_via_moderation',
        user_id: adminUid,
        metadata: { image_id: imageId, banned_courier_id: courierId },
      });
    } else {
      await supabase
        .from('image_moderation')
        .update({
          status: action === 'approve' ? 'approved' : 'removed',
          reviewed_by: adminUid,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', imageId);
    }

    fetchImages(activeTab);
    fetchTabCounts();
  };

  const canAct = activeTab === 'pending_review' || activeTab === 'disputed';

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1200px', animation: 'fadeIn 0.3s ease' }}>

      {/* HEADER */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ ...M.display, fontSize: '22px', fontWeight: 900, color: '#FFF', margin: '0 0 3px' }}>Moderation</h1>
        <div style={{ ...M.mono, fontSize: '11px', color: '#444' }}>Image review queue · proof photos, brama uploads, avatars</div>
      </div>

      {/* AI STATUS BANNER */}
      {aiFlag ? (
        <div style={{
          background: 'rgba(0,200,83,0.07)', border: '1px solid rgba(0,200,83,0.2)',
          borderRadius: '10px', padding: '11px 16px', marginBottom: '20px',
          display: 'flex', gap: '10px', alignItems: 'center',
        }}>
          <span style={{ fontSize: '16px' }}>✓</span>
          <span style={{ ...M.display, fontSize: '13px', color: '#00C853' }}>
            AI moderation ACTIVE — Google Vision API running. Free tier: 1,000 images/month.
          </span>
        </div>
      ) : (
        <div style={{
          background: 'rgba(255,149,0,0.07)', border: '1px solid rgba(255,149,0,0.2)',
          borderRadius: '10px', padding: '11px 16px', marginBottom: '20px',
          display: 'flex', gap: '10px', alignItems: 'center',
        }}>
          <span style={{ fontSize: '16px' }}>⚠️</span>
          <span style={{ ...M.display, fontSize: '13px', color: '#FF9500' }}>
            AI moderation is OFF — all images are auto-approved. Activate in{' '}
            <a href="/admin/flags" style={{ color: '#FF9500', textDecoration: 'underline' }}>Feature Flags</a>
            {' '}when ready. First 1,000 images/month free.
          </span>
        </div>
      )}

      {/* TABS */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid #1E1E1E' }}>
        {TABS.map(tab => {
          const active = tab === activeTab;
          const color = STATUS_COLORS[tab] || '#555';
          return (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '9px 18px', background: 'transparent', borderTop: 0, borderRight: 0, borderLeft: 0,
              borderBottom: active ? `2px solid ${color}` : '2px solid transparent',
              color: active ? color : '#555',
              cursor: 'pointer', ...M.display, fontSize: '13px',
              fontWeight: active ? 700 : 400, marginBottom: '-1px',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              {tab.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              <span style={{
                ...M.mono, fontSize: '10px', fontWeight: 700,
                color: active ? color : '#444',
                background: active ? `${color}18` : '#1A1A1A',
                padding: '1px 6px', borderRadius: '4px',
              }}>{tabCounts[tab]}</span>
            </button>
          );
        })}
      </div>

      {/* CONTENT */}
      {loading ? (
        <div style={{ ...M.mono, color: '#333', fontSize: '13px', padding: '40px 0' }}>Loading...</div>
      ) : images.length === 0 ? (
        <div style={{
          background: '#141414', border: '1px solid #1E1E1E', borderRadius: '12px',
          padding: '60px', textAlign: 'center',
        }}>
          <div style={{ ...M.mono, fontSize: '13px', color: '#333' }}>
            No {activeTab.replace(/_/g, ' ')} images · Queue is clear ✓
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {images.map(item => (
            <div key={item['id']} style={{
              background: '#141414', border: '1px solid #1E1E1E',
              borderRadius: '12px', padding: '18px 20px',
            }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>

                {/* THUMBNAIL */}
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt=""
                    style={{ width: '100px', height: '80px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
                  />
                )}

                {/* DETAILS */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px', alignItems: 'center' }}>

                    {/* Type badge */}
                    {item.image_type && (
                      <span style={{
                        ...M.mono, fontSize: '10px', fontWeight: 700,
                        color: TYPE_COLORS[item.image_type] || '#888',
                        background: `${TYPE_COLORS[item.image_type] || '#888'}18`,
                        padding: '2px 7px', borderRadius: '4px',
                      }}>{item.image_type.toUpperCase()}</span>
                    )}

                    {/* Status badge */}
                    <span style={{
                      ...M.mono, fontSize: '10px', fontWeight: 700,
                      color: STATUS_COLORS[item.status] || '#555',
                      background: `${STATUS_COLORS[item.status] || '#555'}18`,
                      padding: '2px 7px', borderRadius: '4px',
                    }}>{(item.status || '').replace(/_/g, ' ').toUpperCase()}</span>

                    {/* AI score badge */}
                    {aiScoreBadge(item.ai_score)}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '6px 24px', marginBottom: '10px' }}>
                    <div>
                      <div style={{ ...M.mono, fontSize: '10px', color: '#444', marginBottom: '2px' }}>COURIER</div>
                      <div style={{ ...M.display, fontSize: '13px', color: '#CCC' }}>
                        {item.courier?.name ?? 'Unknown'}
                      </div>
                      {item.courier?.email && (
                        <div style={{ ...M.mono, fontSize: '10px', color: '#555' }}>{item.courier.email}</div>
                      )}
                    </div>

                    {item.client && (
                      <div>
                        <div style={{ ...M.mono, fontSize: '10px', color: '#444', marginBottom: '2px' }}>CLIENT</div>
                        <div style={{ ...M.display, fontSize: '13px', color: '#CCC' }}>{item.client.name}</div>
                        {item.client.client_tier && (
                          <div style={{ ...M.mono, fontSize: '10px', color: '#555' }}>{item.client.client_tier}</div>
                        )}
                      </div>
                    )}

                    {item.delivery_id && (
                      <div>
                        <div style={{ ...M.mono, fontSize: '10px', color: '#444', marginBottom: '2px' }}>DELIVERY</div>
                        <div style={{ ...M.mono, fontSize: '11px', color: '#555' }}>{item.delivery_id.slice(-12)}</div>
                      </div>
                    )}

                    <div>
                      <div style={{ ...M.mono, fontSize: '10px', color: '#444', marginBottom: '2px' }}>SUBMITTED</div>
                      <div style={{ ...M.mono, fontSize: '11px', color: '#555' }}>
                        {new Date(item.created_at).toLocaleString('pl-PL', {
                          day: '2-digit', month: '2-digit', year: '2-digit',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>

                  {/* AI flags breakdown */}
                  {item.ai_flags && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      {Object.entries(item.ai_flags).map(([k, v]) => (
                        <span key={k} style={{
                          ...M.mono, fontSize: '10px', color: v > 0.5 ? '#FF3B30' : '#444',
                          background: '#1A1A1A', padding: '2px 7px', borderRadius: '4px',
                        }}>{k}: {typeof v === 'number' ? v.toFixed(2) : v}</span>
                      ))}
                    </div>
                  )}

                  {/* ACTION BUTTONS */}
                  {canAct && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleAction(item['id'], 'approve', item.courier_id)}
                        style={{
                          minHeight: '44px', padding: '0 20px',
                          background: 'rgba(0,200,83,0.1)', border: '1px solid rgba(0,200,83,0.3)',
                          color: '#00C853', borderRadius: '8px', cursor: 'pointer',
                          ...M.display, fontSize: '13px', fontWeight: 700,
                        }}
                      >✓ Approve</button>

                      <button
                        onClick={() => handleAction(item['id'], 'remove', item.courier_id)}
                        style={{
                          minHeight: '44px', padding: '0 20px',
                          background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.2)',
                          color: '#FF3B30', borderRadius: '8px', cursor: 'pointer',
                          ...M.display, fontSize: '13px', fontWeight: 700,
                        }}
                      >✗ Remove</button>

                      <button
                        onClick={() => {
                          if (window.confirm(`Ban courier ${item.courier?.name ?? item.courier_id}?\n\nThis will set is_banned=true on their profile and remove this image. Action is logged to audit trail.`)) {
                            handleAction(item['id'], 'ban', item.courier_id);
                          }
                        }}
                        style={{
                          minHeight: '44px', padding: '0 20px',
                          background: 'rgba(255,59,48,0.15)', border: '1px solid rgba(255,59,48,0.4)',
                          color: '#FF3B30', borderRadius: '8px', cursor: 'pointer',
                          ...M.display, fontSize: '13px', fontWeight: 900,
                        }}
                      >⛔ Ban courier</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
