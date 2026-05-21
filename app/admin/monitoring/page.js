'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useCallback } from 'react';

const M = {
  mono: { fontFamily: "'Fira Code', monospace" },
  display: { fontFamily: "'Space Grotesk', sans-serif" },
};

const SENTRY_ORG     = 'lgk-courier';
const SENTRY_PROJECT = 'javascript-nextjs';
const SENTRY_URL     = `https://lgk-courier.sentry.io/issues/?project=${SENTRY_PROJECT}`;

const LEVEL_COLOR = {
  fatal:   '#FF3B30',
  error:   '#FF3B30',
  warning: '#FF9500',
  info:    '#007BFF',
  debug:   '#555',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AdminMonitoring() {
  const [issues, setIssues]       = useState([]);
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [token, setToken]         = useState('');
  const [savedToken, setSavedToken] = useState('');
  const [filter, setFilter]       = useState('is:unresolved');

  // Persist token in sessionStorage so it survives tab refreshes but not browser close
  useEffect(() => {
    const t = sessionStorage.getItem('sentry_token') || '';
    setSavedToken(t);
    setToken(t);
  }, []);

  const saveToken = () => {
    sessionStorage.setItem('sentry_token', token.trim());
    setSavedToken(token.trim());
  };

  const load = useCallback(async (authToken) => {
    if (!authToken) return;
    setLoading(true);
    setError('');

    try {
      const headers = { 'x-sentry-token': authToken };

      const [issuesRes, statsRes] = await Promise.all([
        fetch(`/api/sentry?type=issues&query=${encodeURIComponent(filter)}`, { headers }),
        fetch(`/api/sentry?type=stats`, { headers }),
      ]);

      if (issuesRes.status === 401) {
        setError('Invalid auth token — check it has project:read scope.');
        setLoading(false);
        return;
      }

      const issuesData = await issuesRes.json();
      const statsData  = await statsRes.json();

      setIssues(Array.isArray(issuesData) ? issuesData : []);
      setStats(statsData);
    } catch (e) {
      setError('Failed to reach Sentry API. Check your token and try again.');
    }

    setLoading(false);
  }, [filter]);

  useEffect(() => {
    if (savedToken) load(savedToken);
  }, [savedToken, load]);

  const errorCount   = issues.filter(i => i.level === 'error' || i.level === 'fatal').length;
  const warningCount = issues.filter(i => i.level === 'warning').length;
  const totalEvents  = Array.isArray(stats) ? stats.reduce((s, [, v]) => s + v, 0) : null;

  const FILTERS = [
    ['is:unresolved',                   'Unresolved'],
    ['is:unresolved level:error',       'Errors only'],
    ['is:unresolved level:warning',     'Warnings'],
    ['is:unresolved times_seen:>10',    'High frequency'],
    ['is:resolved',                     'Resolved'],
  ];

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1100px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ ...M.display, fontSize: '22px', fontWeight: 900, color: '#FFF', margin: '0 0 3px' }}>Monitoring</h1>
          <div style={{ ...M.mono, fontSize: '11px', color: '#444' }}>Sentry error tracking · real-time issue feed</div>
        </div>
        <a
          href={SENTRY_URL}
          target="_blank"
          rel="noreferrer"
          style={{
            background: 'rgba(212,255,0,0.1)', border: '1px solid rgba(212,255,0,0.3)',
            color: '#D4FF00', padding: '9px 18px', borderRadius: '8px',
            textDecoration: 'none', ...M.display, fontSize: '12px', fontWeight: 700,
          }}
        >↗ Open Sentry Dashboard</a>
      </div>

      {/* Token setup — shown when no token saved */}
      {!savedToken && (
        <div style={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ ...M.display, fontSize: '14px', fontWeight: 700, color: '#FFF', marginBottom: '6px' }}>
            Connect your Sentry account
          </div>
          <div style={{ ...M.display, fontSize: '13px', color: '#666', marginBottom: '16px', lineHeight: 1.6 }}>
            To pull live issues here, add a Sentry auth token.<br />
            Get one at <span style={{ color: '#D4FF00' }}>sentry.io → Settings → Auth Tokens → Create New Token</span> — enable <code style={{ ...M.mono, fontSize: '11px', color: '#999' }}>project:read</code> scope only.
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="password"
              placeholder="sntrys_eyJ..."
              value={token}
              onChange={e => setToken(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveToken()}
              style={{
                flex: 1, padding: '10px 14px',
                background: '#0D0D0D', border: '1px solid #2A2A2A',
                borderRadius: '8px', color: '#FFF', fontSize: '13px',
                fontFamily: "'Fira Code', monospace", outline: 'none',
              }}
            />
            <button
              onClick={saveToken}
              style={{
                background: '#D4FF00', color: '#000', border: 'none',
                padding: '10px 24px', borderRadius: '8px',
                cursor: 'pointer', ...M.display, fontSize: '13px', fontWeight: 700,
              }}
            >Connect</button>
          </div>
          <div style={{ ...M.mono, fontSize: '10px', color: '#333', marginTop: '10px' }}>
            Token is stored in session only — cleared when you close the browser.
          </div>
        </div>
      )}

      {/* Connected — token controls */}
      {savedToken && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00C853' }} />
            <span style={{ ...M.mono, fontSize: '11px', color: '#00C853' }}>Connected to Sentry</span>
          </div>
          <button
            onClick={() => { sessionStorage.removeItem('sentry_token'); setSavedToken(''); setToken(''); setIssues([]); setStats(null); }}
            style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid #2A2A2A', color: '#555', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', ...M.mono, fontSize: '10px' }}
          >Disconnect</button>
          <button
            onClick={() => load(savedToken)}
            style={{ background: 'transparent', border: '1px solid #2A2A2A', color: '#555', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', ...M.mono, fontSize: '10px' }}
          >↻ Refresh</button>
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.3)', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', ...M.display, fontSize: '13px', color: '#FF3B30' }}>
          {error}
        </div>
      )}

      {/* Stats row */}
      {savedToken && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Unresolved issues', value: issues.length,   color: '#FFF' },
            { label: 'Errors / fatal',    value: errorCount,       color: errorCount > 0 ? '#FF3B30' : '#333' },
            { label: 'Warnings',          value: warningCount,     color: warningCount > 0 ? '#FF9500' : '#333' },
            { label: 'Events (24h)',       value: totalEvents ?? '—', color: '#D4FF00' },
          ].map(s => (
            <div key={s.label} style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: '12px', padding: '14px 18px', flex: 1 }}>
              <div style={{ ...M.mono, fontSize: '22px', fontWeight: 700, color: s.color, lineHeight: 1, marginBottom: '4px' }}>{s.value}</div>
              <div style={{ ...M.display, fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      {savedToken && (
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {FILTERS.map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)} style={{
              padding: '7px 14px', borderRadius: '7px',
              border: '1px solid #2A2A2A',
              background: filter === val ? '#D4FF00' : '#141414',
              color: filter === val ? '#000' : '#666',
              cursor: 'pointer', ...M.display, fontSize: '12px', fontWeight: filter === val ? 700 : 400,
            }}>{label}</button>
          ))}
        </div>
      )}

      {/* Issues list */}
      {loading ? (
        <div style={{ ...M.mono, color: '#333', fontSize: '13px', padding: '40px 0' }}>loading issues...</div>
      ) : savedToken && issues.length === 0 && !error ? (
        <div style={{ background: 'rgba(0,200,83,0.06)', border: '1px solid rgba(0,200,83,0.2)', borderRadius: '12px', padding: '48px', textAlign: 'center' }}>
          <div style={{ ...M.display, fontSize: '14px', color: '#00C853', fontWeight: 700 }}>✓ No issues found</div>
          <div style={{ ...M.mono, fontSize: '11px', color: '#444', marginTop: '6px' }}>All clear for the selected filter</div>
        </div>
      ) : savedToken && issues.length > 0 ? (
        <div style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 80px 80px 120px', gap: '12px', padding: '10px 18px', borderBottom: '1px solid #1E1E1E' }}>
            {['Level', 'Issue', 'Events', 'Users', 'Last seen'].map(h => (
              <span key={h} style={{ ...M.mono, fontSize: '10px', color: '#333', letterSpacing: '1px', textTransform: 'uppercase' }}>{h}</span>
            ))}
          </div>

          {issues.map((issue, i) => {
            const color = LEVEL_COLOR[issue.level] || '#555';
            return (
              <a
                key={issue['id']}
                href={issue.permalink}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'grid', gridTemplateColumns: '60px 1fr 80px 80px 120px',
                  gap: '12px', padding: '13px 18px',
                  borderBottom: i < issues.length - 1 ? '1px solid #111' : 'none',
                  alignItems: 'center', textDecoration: 'none',
                  background: 'transparent',
                  transition: 'background 100ms',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#1A1A1A'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{
                  ...M.mono, fontSize: '10px', fontWeight: 700, color,
                  background: `${color}18`, padding: '2px 7px',
                  borderRadius: '4px', textTransform: 'uppercase',
                  display: 'inline-block',
                }}>{issue.level}</span>

                <div>
                  <div style={{ ...M.display, fontSize: '13px', color: '#CCC', fontWeight: 600, marginBottom: '2px' }}>
                    {issue.title}
                  </div>
                  <div style={{ ...M.mono, fontSize: '10px', color: '#444' }}>
                    {issue.culprit || issue.metadata?.filename || ''}
                  </div>
                </div>

                <span style={{ ...M.mono, fontSize: '13px', fontWeight: 700, color: '#888' }}>
                  {Number(issue.count).toLocaleString()}
                </span>

                <span style={{ ...M.mono, fontSize: '13px', fontWeight: 700, color: '#888' }}>
                  {Number(issue.userCount).toLocaleString()}
                </span>

                <span style={{ ...M.mono, fontSize: '11px', color: '#444' }}>
                  {timeAgo(issue.lastSeen)}
                </span>
              </a>
            );
          })}
        </div>
      ) : null}

      {/* No token — show placeholder */}
      {!savedToken && !error && (
        <div style={{ background: '#141414', border: '1px solid #1E1E1E', borderRadius: '12px', padding: '60px', textAlign: 'center' }}>
          <div style={{ ...M.mono, fontSize: '13px', color: '#333', marginBottom: '8px' }}>Add your auth token above to see live issues</div>
          <div style={{ ...M.display, fontSize: '12px', color: '#222' }}>Or use the button to open the full Sentry dashboard</div>
        </div>
      )}
    </div>
  );
}
