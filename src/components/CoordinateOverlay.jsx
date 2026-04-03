import { useState } from 'react';
import Kirari from './Kirari.jsx';
import Bubble from './Bubble.jsx';
import BodySilhouette from './BodySilhouette.jsx';
import { getCoordItems } from '../data/coordItems.js';
import { getCoordLine } from '../data/kirariDialogues.js';

const TPO_OPTIONS = [
  { id: 'office',  label: 'Office',  icon: '💼' },
  { id: 'casual',  label: 'Casual',  icon: '☕' },
  { id: 'date',    label: 'Date',    icon: '🌙' },
  { id: 'formal',  label: 'Formal',  icon: '🎩' },
];

const TAB_IDS = ['color', 'base', 'skincare'];

export default function CoordinateOverlay({ styleTab, selectedLook, weather, onClose }) {
  const [selectedTPO, setSelectedTPO] = useState('casual');
  const tabId = TAB_IDS[styleTab] || 'color';
  const items = getCoordItems(tabId, selectedTPO);
  const total = items.reduce((s, i) => s + i.price, 0);
  const kirariLine = getCoordLine({ styleTab, tpo: selectedTPO, weather });

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: 'linear-gradient(180deg, #faf5ff 0%, #fffbeb 50%, #fff 100%)',
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 16px 8px',
      }}>
        <p style={{ fontSize: 15, fontWeight: 800, color: '#334155', margin: 0 }}>
          Today's Total Look
        </p>
        <button onClick={onClose} style={{
          width: 32, height: 32, borderRadius: '50%', border: '1px solid #e2e8f0',
          background: '#fff', fontSize: 16, cursor: 'pointer', color: '#94a3b8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          ✕
        </button>
      </div>

      {/* Kirari message */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '4px 16px 10px' }}>
        <Kirari size={32} expression="sparkle" />
        <Bubble>
          <p style={{ fontSize: 11, color: '#334155', margin: 0, lineHeight: 1.6 }}>{kirariLine}</p>
        </Bubble>
      </div>

      {/* TPO Selector */}
      <div style={{ display: 'flex', gap: 6, padding: '0 16px', marginBottom: 12 }}>
        {TPO_OPTIONS.map(tpo => (
          <button key={tpo.id} onClick={() => setSelectedTPO(tpo.id)} style={{
            flex: 1, padding: '8px 0', borderRadius: 10, fontSize: 12, fontWeight: 600,
            border: selectedTPO === tpo.id ? '2px solid #f59e0b' : '1px solid #e2e8f0',
            background: selectedTPO === tpo.id ? '#fffbeb' : '#fff',
            color: selectedTPO === tpo.id ? '#d97706' : '#94a3b8',
            cursor: 'pointer',
          }}>
            {tpo.icon} {tpo.label}
          </button>
        ))}
      </div>

      {/* Style board */}
      <div style={{
        position: 'relative', margin: '0 16px 12px',
        background: 'linear-gradient(180deg, #fefce8 0%, #fff 100%)',
        borderRadius: 20, padding: '16px 0', minHeight: 340,
        border: '1px solid #fde68a',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        {/* Body silhouette */}
        <div style={{
          position: 'relative', width: '100%', display: 'flex', justifyContent: 'center',
          minHeight: 280,
        }}>
          <BodySilhouette items={items} />

          {/* Floating labels */}
          {items.map((item, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: ['12%','30%','50%','65%','80%'][i] || `${12 + i * 15}%`,
              ...(i % 2 === 0 ? { left: 8 } : { right: 8 }),
              background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)',
              borderRadius: 10, padding: '4px 8px', maxWidth: '35%',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)',
            }}>
              <p style={{ fontSize: 9, fontWeight: 600, color: '#a855f7', margin: 0 }}>{item.part}</p>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#334155', margin: 0 }}>{item.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Item list */}
      <div style={{ padding: '0 16px', marginBottom: 8 }}>
        {items.map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
            borderBottom: i < items.length - 1 ? '1px solid #f1f5f9' : 'none',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, background: item.color,
              border: '1.5px solid rgba(0,0,0,0.06)', flexShrink: 0,
            }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#334155', margin: 0 }}>{item.name}</p>
              <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>{item.part} / {item.shade}</p>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#334155', flexShrink: 0 }}>
              {'\u00A5'}{item.price.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {/* Total + CTA */}
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 0', borderTop: '2px solid #f59e0b', marginBottom: 10,
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
            コーデ合計
          </span>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#d97706' }}>
            {'\u00A5'}{total.toLocaleString()}
          </span>
        </div>

        <button onClick={() => alert('購入ページは準備中です')} style={{
          width: '100%', padding: 14, marginBottom: 8,
          background: 'linear-gradient(135deg, #f59e0b, #f97316)',
          border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700,
          color: '#fff', cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
        }}>
          🛒 まとめて購入する
        </button>

        <button onClick={onClose} style={{
          width: '100%', padding: 11,
          background: '#f8fafc', border: '1px solid #e2e8f0',
          borderRadius: 14, fontSize: 12, fontWeight: 600,
          color: '#64748b', cursor: 'pointer',
        }}>
          結果画面に戻る
        </button>
      </div>

      <p style={{ textAlign: 'center', fontSize: 10, color: '#cbd5e1', paddingBottom: 16 }}>
        ※ 価格はイメージです。実際の販売価格とは異なります。
      </p>
    </div>
  );
}
