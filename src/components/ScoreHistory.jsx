import { useEffect, useState } from 'react';
import { fetchScoreHistory } from '../lib/scoreHistory.js';
import { useGuestId } from '../hooks/useGuestId.js';
import { useT } from '../i18n/index.jsx';

const METRIC_INFO = {
  skin_tone: { label: '肌トーン', color: '#a855f7' },
  pores:     { label: '毛穴',     color: '#22c55e' },
  dullness:  { label: 'くすみ',   color: '#f59e0b' },
};

export default function ScoreHistory() {
  const { guestId } = useGuestId();
  const { t } = useT();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScoreHistory(guestId).then(data => {
      setHistory(data);
      setLoading(false);
    });
  }, [guestId]);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 16, color: '#94a3b8', fontSize: 12 }}>
      {t('history.loading') || '...'}
    </div>
  );
  if (history.length === 0) return null; // No history = hide section

  const recent = [...history].reverse().slice(-7);

  return (
    <div style={{
      margin: '0 16px 14px', padding: '14px 16px',
      background: '#fff', borderRadius: 16,
      boxShadow: '0 2px 8px rgba(139,92,246,0.06)',
      border: '1px solid #ede9fe',
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 12 }}>
        {t('history.title') || '\uD83D\uDCC8 \u80CC\u30B9\u30B3\u30A2\u306E\u63A8\u79FB'}
      </div>

      {recent.length >= 2 && <ScoreTrendChart data={recent} />}

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        {Object.entries(METRIC_INFO).map(([key, info]) => {
          const latest = history[0]?.[key];
          const prev = history[1]?.[key];
          const diff = prev != null ? latest - prev : null;
          return (
            <div key={key} style={{
              flex: 1, background: '#faf5ff', borderRadius: 12,
              padding: '10px 6px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>
                {info.label}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: info.color }}>
                {latest ?? '--'}
              </div>
              {diff != null && (
                <div style={{ fontSize: 10, fontWeight: 700, color: diff >= 0 ? '#22c55e' : '#f97316' }}>
                  {diff >= 0 ? `\u25B2 +${diff}` : `\u25BC ${diff}`}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 10, color: '#94a3b8', textAlign: 'right', marginTop: 6 }}>
        {t('history.count', { count: String(history.length) }) || `\u76F4\u8FD1${history.length}\u56DE\u306E\u8A18\u9332`}
      </div>
    </div>
  );
}

function ScoreTrendChart({ data }) {
  const W = 300, H = 70;
  const metrics = [
    { key: 'skin_tone', color: '#a855f7' },
    { key: 'pores',     color: '#22c55e' },
    { key: 'dullness',  color: '#f59e0b' },
  ];

  const toPath = (key) => {
    return data.map((d, i) => {
      const x = data.length === 1 ? W / 2 : (i / (data.length - 1)) * W;
      const y = H - (d[key] / 100) * H;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 70 }}>
      <line x1="0" y1={H * 0.4} x2={W} y2={H * 0.4} stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="4,3" />
      {metrics.map(m => (
        <path key={m.key} d={toPath(m.key)}
          fill="none" stroke={m.color} strokeWidth={2}
          strokeLinecap="round" strokeLinejoin="round" opacity={0.8} />
      ))}
      {metrics.map(m => data.map((d, i) => (
        <circle key={`${m.key}-${i}`}
          cx={data.length === 1 ? W / 2 : (i / (data.length - 1)) * W}
          cy={H - (d[m.key] / 100) * H}
          r={2} fill={m.color} opacity={0.9} />
      )))}
    </svg>
  );
}
