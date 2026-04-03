import { useState, useEffect } from 'react';
import Kirari from './Kirari.jsx';
import Bubble from './Bubble.jsx';
import SkincareRoutineView from './SkincareRoutineView.jsx';
import { COLOR_LOOKS, BASE_LOOKS } from '../data/makeupLooks.js';
import { useT } from '../i18n/index.jsx';

export default function SuggestScreen({ skinScores, onSelectLook, onSkipToResult }) {
  const { t } = useT();
  const [styleTab, setStyleTab] = useState(() => {
    const saved = localStorage.getItem('kirei_style_tab');
    return saved !== null ? Number(saved) : 0;
  });

  useEffect(() => {
    localStorage.setItem('kirei_style_tab', String(styleTab));
  }, [styleTab]);

  const looks = styleTab === 0 ? COLOR_LOOKS
              : styleTab === 1 ? BASE_LOOKS
              : null;

  // Skin care: skip AR, go directly to result
  if (styleTab === 2) {
    return (
      <div style={{ padding: '12px 0', minHeight: '100%' }}>
        <StyleTabs styleTab={styleTab} setStyleTab={setStyleTab} t={t} />
        <SkincareRoutineView onNext={() => onSkipToResult(styleTab)} />
      </div>
    );
  }

  return (
    <div style={{ padding: '12px 0' }}>
      <StyleTabs styleTab={styleTab} setStyleTab={setStyleTab} t={t} />

      {/* Skin condition summary */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 16px 12px' }}>
        <Kirari size={36} expression="sparkle" />
        <Bubble>
          <p style={{ fontSize: 12, color: '#334155', margin: 0, lineHeight: 1.6 }}>
            {styleTab === 0
              ? t('suggest.color_intro')
              : t('suggest.base_intro')}
          </p>
        </Bubble>
      </div>

      {/* Look cards */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {looks.map((look) => (
          <LookCard
            key={look.id}
            look={look}
            styleTab={styleTab}
            onSelect={() => onSelectLook(look, styleTab)}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}

function StyleTabs({ styleTab, setStyleTab, t }) {
  const tabs = [t('suggest.tab_color'), t('suggest.tab_base'), t('suggest.tab_skincare')];
  return (
    <div style={{
      display: 'flex', margin: '0 16px 12px', borderRadius: 12,
      overflow: 'hidden', border: '1px solid #e2e8f0',
    }}>
      {tabs.map((label, i) => (
        <button key={i} onClick={() => setStyleTab(i)} style={{
          flex: 1, padding: '10px 0', fontSize: 13, fontWeight: styleTab === i ? 700 : 400,
          background: styleTab === i ? '#fff' : 'transparent',
          color: styleTab === i ? '#a855f7' : '#94a3b8',
          border: 'none', borderRight: i < 2 ? '1px solid #e2e8f0' : 'none',
          cursor: 'pointer',
          boxShadow: styleTab === i ? '0 1px 4px rgba(168,85,247,0.1)' : 'none',
        }}>
          {label}
        </button>
      ))}
    </div>
  );
}

function LookCard({ look, styleTab, onSelect, t }) {
  const isColor = styleTab === 0;

  // Preview swatches
  const swatches = isColor
    ? [look.lip, look.cheek, look.eyeshadow].filter(Boolean)
    : [look.base, look.concealer, look.brow, look.lip].filter(Boolean);

  return (
    <div
      onClick={onSelect}
      style={{
        background: '#fff', borderRadius: 16, padding: '14px 16px',
        boxShadow: '0 2px 12px rgba(139,92,246,0.08)',
        border: '1px solid #ede9fe', cursor: 'pointer',
        transition: 'transform 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#334155', margin: '0 0 2px' }}>{t(look.name)}</p>
          <p style={{ fontSize: 11, color: '#64748b', margin: 0, lineHeight: 1.5 }}>{t(look.desc)}</p>
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 8 }}>
          {swatches.map((c, i) => (
            <div key={i} style={{
              width: 22, height: 22, borderRadius: '50%', background: c,
              border: '1.5px solid rgba(0,0,0,0.06)',
            }} />
          ))}
        </div>
      </div>

      <p style={{ fontSize: 10, color: '#a855f7', margin: '4px 0 8px', fontStyle: 'italic' }}>{t(look.reason)}</p>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {look.products.map((p, i) => (
          <span key={i} style={{
            fontSize: 10, background: '#faf5ff', color: '#7c3aed', padding: '3px 8px',
            borderRadius: 8, border: '1px solid #ede9fe',
          }}>
            {p.emoji} {t(p.name)} ({t(p.shade)})
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <span style={{ fontSize: 11, color: '#94a3b8' }}>
          {look.products.reduce((s, p) => s + p.price, 0).toLocaleString()}
        </span>
        <span style={{
          fontSize: 12, fontWeight: 600, color: '#a855f7',
          background: '#faf5ff', padding: '4px 12px', borderRadius: 10,
        }}>
          {isColor ? t('suggest.try_ar') : t('suggest.select')}
        </span>
      </div>
    </div>
  );
}
