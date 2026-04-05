import { useState } from 'react';
import Kirari from './Kirari.jsx';
import Bubble from './Bubble.jsx';
import { SKINCARE_ROUTINE } from '../data/makeupLooks.js';
import { useT } from '../i18n/index.jsx';

const STEP_ICONS = {
  Cleanser: '🧼',
  Toner: '💧',
  Emulsion: '🥛',
  Sunscreen: '☀️',
  Cleansing: '🧴',
  Serum: '✨',
  Cream: '🫧',
};

function getStepIcon(step, t) {
  // Try matching by English key
  const en = typeof step === 'object' ? step.en : step;
  return STEP_ICONS[en] || '🧴';
}

export default function SkincareRoutineView({ onNext, skinScores }) {
  const { t } = useT();
  const morningTotal = SKINCARE_ROUTINE.morning.reduce((s, r) => s + r.price, 0);
  const nightTotal = SKINCARE_ROUTINE.night.reduce((s, r) => s + r.price, 0);
  const total = morningTotal + nightTotal;
  const itemCount = SKINCARE_ROUTINE.morning.length + SKINCARE_ROUTINE.night.length;

  return (
    <div style={{ padding: '0 16px' }}>
      {/* 肌スコアサマリー */}
      {skinScores && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {Object.entries(skinScores).map(([key, val]) => {
            const isLow = val.score < 60;
            const color = isLow ? '#f59e0b' : '#22c55e';
            return (
              <div key={key} style={{
                flex: 1, background: '#fff', borderRadius: 12,
                padding: '8px 6px', textAlign: 'center',
                border: `1px solid ${isLow ? '#fde68a' : '#d1fae5'}`,
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}>
                <p style={{ fontSize: 9, color: '#94a3b8', margin: '0 0 2px', fontWeight: 600 }}>
                  {t(val.labelKey)}
                </p>
                <p style={{ fontSize: 18, fontWeight: 800, color, margin: 0, lineHeight: 1 }}>
                  {val.score}
                </p>
                <p style={{ fontSize: 8, color, margin: '2px 0 0', fontWeight: 600 }}>
                  {isLow ? '▼ Care' : '▲ Good'}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 14 }}>
        <Kirari size={36} expression="happy" />
        <Bubble>
          <p style={{ fontSize: 12, color: '#334155', margin: 0, lineHeight: 1.6 }}>
            {t('skincare.intro')}
          </p>
        </Bubble>
      </div>

      {/* Morning routine */}
      <RoutineSection
        title={t('skincare.morning_title')}
        items={SKINCARE_ROUTINE.morning}
        gradient="linear-gradient(135deg, #fffbeb, #fef3c7)"
        borderColor="#fde68a"
        skinScores={skinScores}
        t={t}
      />

      {/* Night routine */}
      <RoutineSection
        title={t('skincare.night_title')}
        items={SKINCARE_ROUTINE.night}
        gradient="linear-gradient(135deg, #ede9fe, #e0e7ff)"
        borderColor="#c4b5fd"
        skinScores={skinScores}
        t={t}
      />

      {/* Total */}
      <div style={{
        background: '#fff', borderRadius: 14, padding: '12px 16px', marginBottom: 14,
        boxShadow: '0 2px 8px rgba(139,92,246,0.06)', border: '1px solid #ede9fe',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 12, color: '#64748b' }}>{t('skincare.total', { count: String(itemCount) })}</span>
        <span style={{ fontSize: 16, fontWeight: 800, color: '#a855f7' }}>{'\u00A5'}{total.toLocaleString()}</span>
      </div>

      {/* ③ なぜ2週間？ セクション */}
      <WhyTwoWeeksSection skinScores={skinScores} t={t} />

      {/* CTA */}
      <button onClick={onNext} style={{
        width: '100%', padding: 14, marginBottom: 12,
        background: 'linear-gradient(135deg, #a855f7, #ec4899)',
        border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700,
        color: '#fff', cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(168,85,247,0.25)',
      }}>
        {t('skincare.view_result')}
      </button>
    </div>
  );
}

function WhyTwoWeeksSection({ skinScores, t }) {
  const [open, setOpen] = useState(false);
  const dullness = skinScores?.dullness?.score ?? 70;
  const pores    = skinScores?.pores?.score    ?? 70;

  return (
    <div style={{
      marginBottom: 14,
      background: '#faf5ff', borderRadius: 14,
      border: '1px solid #e9d5ff', overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 18, height: 18, borderRadius: '50%',
            background: '#a855f7', color: '#fff',
            fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>?</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#7c3aed' }}>
            {t('skincare_ar.why_title')}
          </span>
        </div>
        <span style={{
          fontSize: 11, color: '#a78bfa',
          transform: open ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.2s',
        }}>▼</span>
      </button>

      {open && (
        <div style={{ padding: '0 16px 14px', fontSize: 12, color: '#475569', lineHeight: 1.8 }}>
          <p style={{ margin: '0 0 10px' }}>{t('skincare_ar.why_p1')}</p>
          <p style={{ margin: '0 0 10px' }}>{t('skincare_ar.why_p2')}</p>

          <div style={{
            background: 'rgba(168,85,247,0.06)',
            borderRadius: 10, padding: '10px 12px',
            border: '1px solid rgba(168,85,247,0.12)',
          }}>
            {dullness < 65 && (
              <p style={{ fontSize: 11, color: '#7c3aed', margin: '0 0 4px', lineHeight: 1.6 }}>
                {t('skincare_ar.why_personal_dullness', { score: String(dullness) })}
              </p>
            )}
            {pores < 65 && (
              <p style={{ fontSize: 11, color: '#7c3aed', margin: '0 0 4px', lineHeight: 1.6 }}>
                {t('skincare_ar.why_personal_pores', { score: String(pores) })}
              </p>
            )}
            <p style={{ fontSize: 11, color: '#7c3aed', margin: 0, lineHeight: 1.6 }}>
              {t('skincare_ar.why_encouragement')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function RoutineSection({ title, items, gradient, borderColor, skinScores, t }) {
  return (
    <div style={{
      background: gradient, borderRadius: 16, padding: '14px 16px', marginBottom: 10,
      border: `1px solid ${borderColor}`,
    }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#334155', margin: '0 0 10px' }}>{title}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item, i) => {
          const score = skinScores?.[item.targetScore]?.score ?? 100;
          const isCare = score < 65;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              background: 'rgba(255,255,255,0.8)', borderRadius: 10, padding: '8px 12px',
            }}>
              <span style={{ fontSize: 16, width: 24, textAlign: 'center', paddingTop: 2 }}>
                {getStepIcon(item.step, t)}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', margin: '0 0 1px' }}>STEP {i + 1}: {t(item.step)}</p>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#334155', margin: 0 }}>{t(item.product)}</p>
                {item.effect && (
                  <p style={{
                    fontSize: 10, margin: '3px 0 0', lineHeight: 1.5,
                    color: isCare ? '#d97706' : '#64748b',
                    fontWeight: isCare ? 600 : 400,
                  }}>
                    {isCare && '⚡ '}{t(item.effect)}
                  </p>
                )}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#a855f7', flexShrink: 0, paddingTop: 2 }}>
                {'\u00A5'}{item.price.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
