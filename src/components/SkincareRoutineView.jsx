import Kirari from './Kirari.jsx';
import Bubble from './Bubble.jsx';
import { SKINCARE_ROUTINE } from '../data/makeupLooks.js';

const STEP_ICONS = {
  '洗顔': '🧼',
  '化粧水': '💧',
  '乳液': '🥛',
  '日焼け止め': '☀️',
  'クレンジング': '🧴',
  '美容液': '✨',
  'クリーム': '🫧',
};

export default function SkincareRoutineView({ onNext }) {
  const morningTotal = SKINCARE_ROUTINE.morning.reduce((s, r) => s + r.price, 0);
  const nightTotal = SKINCARE_ROUTINE.night.reduce((s, r) => s + r.price, 0);
  const total = morningTotal + nightTotal;

  return (
    <div style={{ padding: '0 16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 14 }}>
        <Kirari size={36} expression="happy" />
        <Bubble>
          <p style={{ fontSize: 12, color: '#334155', margin: 0, lineHeight: 1.6 }}>
            あなたの肌スコアに合わせたスキンケアルーティンだよ♪ 朝と夜で使い分けてね！
          </p>
        </Bubble>
      </div>

      {/* Morning routine */}
      <RoutineSection
        title="☀️ 朝のルーティン"
        items={SKINCARE_ROUTINE.morning}
        gradient="linear-gradient(135deg, #fffbeb, #fef3c7)"
        borderColor="#fde68a"
      />

      {/* Night routine */}
      <RoutineSection
        title="🌙 夜のルーティン"
        items={SKINCARE_ROUTINE.night}
        gradient="linear-gradient(135deg, #ede9fe, #e0e7ff)"
        borderColor="#c4b5fd"
      />

      {/* Total */}
      <div style={{
        background: '#fff', borderRadius: 14, padding: '12px 16px', marginBottom: 14,
        boxShadow: '0 2px 8px rgba(139,92,246,0.06)', border: '1px solid #ede9fe',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 12, color: '#64748b' }}>ルーティン合計（8アイテム）</span>
        <span style={{ fontSize: 16, fontWeight: 800, color: '#a855f7' }}>{'\u00A5'}{total.toLocaleString()}</span>
      </div>

      {/* CTA */}
      <button onClick={onNext} style={{
        width: '100%', padding: 14, marginBottom: 12,
        background: 'linear-gradient(135deg, #a855f7, #ec4899)',
        border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700,
        color: '#fff', cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(168,85,247,0.25)',
      }}>
        ✨ 結果を見る →
      </button>
    </div>
  );
}

function RoutineSection({ title, items, gradient, borderColor }) {
  return (
    <div style={{
      background: gradient, borderRadius: 16, padding: '14px 16px', marginBottom: 10,
      border: `1px solid ${borderColor}`,
    }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#334155', margin: '0 0 10px' }}>{title}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(255,255,255,0.8)', borderRadius: 10, padding: '8px 12px',
          }}>
            <span style={{ fontSize: 16, width: 24, textAlign: 'center' }}>
              {STEP_ICONS[item.step] || '🧴'}
            </span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', margin: '0 0 1px' }}>STEP {i + 1}: {item.step}</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#334155', margin: 0 }}>{item.product}</p>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#a855f7', flexShrink: 0 }}>
              {'\u00A5'}{item.price.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
