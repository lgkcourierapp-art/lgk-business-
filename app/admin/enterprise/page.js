'use client';
export const dynamic = 'force-dynamic';

const M = {
  mono: { fontFamily: "'Fira Code', monospace" },
  display: { fontFamily: "'Space Grotesk', sans-serif" },
};

const TIERS = [
  {
    name: 'Starter',
    price: 'PLN 299/mo',
    target: 'Small businesses · <50 orders/mo',
    color: '#888',
    features: [
      'Up to 50 orders/month',
      'Business dashboard access',
      'Standard delivery SLA',
      'Email support',
      'Basic analytics',
    ],
  },
  {
    name: 'Growth',
    price: 'PLN 899/mo',
    target: 'Growing SMEs · 50–500 orders/mo',
    color: '#00C853',
    highlight: true,
    features: [
      'Up to 500 orders/month',
      'Priority courier assignment',
      'Same-day guaranteed SLA',
      'Dedicated CS contact',
      'Full analytics + CSV export',
      'Branded tracking page',
      'API access (read)',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    target: 'High-volume · custom SLA',
    color: '#D4FF00',
    features: [
      'Unlimited orders',
      'Dedicated courier team',
      'Custom SLA agreement',
      'Full API access (read/write)',
      'White-label tracking',
      'Volume pricing',
      'Quarterly business review',
      'On-site onboarding',
    ],
  },
];

const PIPELINE = [
  {
    company: 'Allegro Seller Hub',
    type: 'API integration',
    stage: 'Exploring',
    value: 0,
    note: 'High volume potential if feasible.',
  },
  {
    company: 'Erli.pl',
    type: 'Courier partner listing',
    stage: 'Contacted',
    value: 0,
    note: 'Awaiting response.',
  },
  {
    company: 'Local pharmacy chain',
    type: 'Same-day medical deliveries',
    stage: 'Proposal sent',
    value: 1200,
    note: '8 locations, Szczecin centre.',
  },
  {
    company: 'Neben',
    type: 'Future API integration',
    stage: 'Planned',
    value: 0,
    note: "Brian's own marketplace product. Will plug into LGK API when ready. No custom build needed — API key + volume pricing agreement.",
  },
];

const STAGE_COLORS = {
  'Exploring':     '#555',
  'Contacted':     '#007BFF',
  'Proposal sent': '#FF9500',
  'Planned':       '#D4FF00',
};

export default function AdminEnterprise() {
  return (
    <div style={{ padding: '28px 32px', maxWidth: '1100px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ ...M.display, fontSize: '22px', fontWeight: 900, color: '#FFF', margin: '0 0 3px' }}>Enterprise</h1>
        <div style={{ ...M.mono, fontSize: '11px', color: '#444' }}>Tier structure · pipeline · B2B strategy</div>
      </div>

      {/* Pricing tiers */}
      <div style={{ ...M.mono, fontSize: '10px', color: '#333', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '14px' }}>Pricing tiers</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '36px' }}>
        {TIERS.map(tier => (
          <div key={tier.name} style={{
            background: tier.highlight ? 'rgba(0,200,83,0.05)' : '#141414',
            border: `1px solid ${tier.highlight ? 'rgba(0,200,83,0.3)' : '#1E1E1E'}`,
            borderRadius: '14px', padding: '22px',
            position: 'relative',
          }}>
            {tier.highlight && (
              <div style={{ position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)' }}>
                <span style={{ background: '#00C853', color: '#000', fontSize: '10px', fontWeight: 900, padding: '2px 12px', borderRadius: '0 0 8px 8px', ...M.display }}>RECOMMENDED</span>
              </div>
            )}

            <div style={{ ...M.display, fontSize: '18px', fontWeight: 900, color: tier.color, marginBottom: '4px', marginTop: tier.highlight ? '10px' : 0 }}>{tier.name}</div>
            <div style={{ ...M.mono, fontSize: '20px', fontWeight: 700, color: '#FFF', marginBottom: '4px' }}>{tier.price}</div>
            <div style={{ ...M.display, fontSize: '12px', color: '#555', marginBottom: '18px' }}>{tier.target}</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {tier.features.map(f => (
                <div key={f} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span style={{ color: tier.color, fontSize: '12px', marginTop: '1px', flexShrink: 0 }}>✓</span>
                  <span style={{ ...M.display, fontSize: '13px', color: '#888', lineHeight: 1.4 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      <div style={{ ...M.mono, fontSize: '10px', color: '#333', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '14px' }}>B2B Pipeline</div>
      <div style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 130px 100px', gap: '12px', padding: '10px 18px', borderBottom: '1px solid #1E1E1E' }}>
          {['Company', 'Type', 'Stage', 'Est. MRR'].map(h => (
            <span key={h} style={{ ...M.mono, fontSize: '10px', color: '#333', letterSpacing: '1px', textTransform: 'uppercase' }}>{h}</span>
          ))}
        </div>

        {PIPELINE.map((p, i) => {
          const isNeben = p.company === 'Neben';
          const stageColor = STAGE_COLORS[p.stage] || '#555';

          return (
            <div key={p.company} style={{
              display: 'grid', gridTemplateColumns: '1fr 160px 130px 100px',
              gap: '12px', padding: '14px 18px',
              borderBottom: i < PIPELINE.length - 1 ? '1px solid #111' : 'none',
              alignItems: 'start',
              background: isNeben ? 'rgba(212,255,0,0.02)' : 'transparent',
            }}>
              <div>
                <div style={{ ...M.display, fontSize: '14px', fontWeight: 700, color: isNeben ? '#D4FF00' : '#FFF', marginBottom: '4px' }}>
                  {p.company}
                  {isNeben && <span style={{ ...M.mono, fontSize: '10px', color: '#555', marginLeft: '8px', fontWeight: 400 }}>personal project</span>}
                </div>
                <div style={{ ...M.display, fontSize: '12px', color: '#444', lineHeight: 1.5 }}>{p.note}</div>
              </div>

              <span style={{ ...M.display, fontSize: '12px', color: '#666', paddingTop: '2px' }}>{p.type}</span>

              <span style={{
                ...M.mono, fontSize: '11px', fontWeight: 700,
                color: stageColor, background: `${stageColor}18`,
                padding: '3px 8px', borderRadius: '5px',
                display: 'inline-block', alignSelf: 'start', marginTop: '2px',
              }}>{p.stage.toUpperCase()}</span>

              <span style={{ ...M.mono, fontSize: '13px', fontWeight: 700, color: p.value > 0 ? '#00C853' : '#333', paddingTop: '2px' }}>
                {p.value > 0 ? `PLN ${p.value}` : '—'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Strategy note */}
      <div style={{ background: 'rgba(212,255,0,0.04)', border: '1px solid rgba(212,255,0,0.1)', borderRadius: '10px', padding: '16px 20px' }}>
        <div style={{ ...M.display, fontSize: '13px', color: '#D4FF00', fontWeight: 700, marginBottom: '6px' }}>Strategy note</div>
        <div style={{ ...M.display, fontSize: '13px', color: '#555', lineHeight: 1.6 }}>
          Focus on Growth tier — right price point for Szczecin SMEs while covering logistics costs.
          Enterprise reserved for 3+ city expansion. Don't discount Starter — it's a funnel, not revenue.
          Neben integration will be self-serve via API key when the time comes.
        </div>
      </div>
    </div>
  );
}
