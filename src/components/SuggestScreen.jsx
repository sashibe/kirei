import { useState } from 'react';
import Kirari from './Kirari.jsx';
import Bubble from './Bubble.jsx';
import { COLOR_LOOKS, BASE_LOOKS, recommendLooks } from '../data/makeupLooks.js';
import { getPcColors } from '../analysis/personalColor.js';
import { useT } from '../i18n/index.jsx';

function sortLooksByPc(looks, personalColor) {
  if (!personalColor) return looks;
  return [...looks].sort((a, b) => {
    const aMatch = a.pcSeasons?.includes(personalColor.season) ? 0 : 1;
    const bMatch = b.pcSeasons?.includes(personalColor.season) ? 0 : 1;
    return aMatch - bMatch;
  });
}

const PC_ICONS = { spring: '🌸', summer: '🌊', autumn: '🍂', winter: '❄️' };

export default function SuggestScreen({ skinScores, personalColor, onSelectLook }) {
  const { t } = useT();
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [explorerTab, setExplorerTab] = useState(0); // 0=Base 1=Color

  const { baseLook, colorLook } = recommendLooks(personalColor, skinScores);

  return (
    <div style={{ padding: '12px 0', minHeight: '100%' }}>
      <HeroCard
        baseLook={baseLook}
        colorLook={colorLook}
        personalColor={personalColor}
        skinScores={skinScores}
        onTry={() => onSelectLook({ baseLook, colorLook })}
        t={t}
      />

      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
        <button
          onClick={() => setExplorerOpen(v => !v)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: explorerOpen ? '#f3e8ff' : '#faf5ff',
            border: '1px solid #e9d5ff',
            borderRadius: 20, padding: '7px 18px',
            fontSize: 12, fontWeight: 600,
            color: '#a855f7', cursor: 'pointer',
          }}
        >
          {explorerOpen ? '▲' : '▼'} {t('suggest.see_other_looks')}
        </button>
      </div>

      {explorerOpen && (
        <div style={{ padding: '0 16px' }}>
          <ExplorerTabs tab={explorerTab} setTab={setExplorerTab} t={t} />

          {explorerTab === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {sortLooksByPc(BASE_LOOKS, personalColor).map(look => (
                <SmallLookCard
                  key={look.id}
                  look={look}
                  personalColor={personalColor}
                  isActive={look.id === baseLook.id}
                  onSelect={() => onSelectLook({ baseLook: look, colorLook })}
                  t={t}
                />
              ))}
            </div>
          )}

          {explorerTab === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {sortLooksByPc(COLOR_LOOKS, personalColor).map(look => (
                <SmallLookCard
                  key={look.id}
                  look={look}
                  personalColor={personalColor}
                  isActive={look.id === colorLook.id}
                  onSelect={() => onSelectLook({ baseLook, colorLook: look })}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HeroCard({ baseLook, colorLook, personalColor, skinScores, onTry, t }) {
  const pcColors = personalColor ? getPcColors(personalColor.season) : null;
  const swatches = [colorLook.lip, colorLook.cheek, colorLook.eyeshadow].filter(Boolean);
  const reason = buildHeroReason(personalColor, skinScores, baseLook, colorLook, t);

  return (
    <div style={{ margin: '0 16px 8px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
        <Kirari size={36} expression="sparkle" />
        <Bubble>
          <p style={{ fontSize: 12, color: '#334155', margin: 0, lineHeight: 1.6 }}>
            {reason}
          </p>
        </Bubble>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #faf5ff, #fdf2f8)',
        borderRadius: 20, padding: '16px',
        border: '1.5px solid #ede9fe',
        boxShadow: '0 4px 16px rgba(139,92,246,0.10)',
      }}>
        {pcColors && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: pcColors.bg, border: `1px solid ${pcColors.border}`,
            borderRadius: 20, padding: '3px 10px', marginBottom: 10,
          }}>
            <span style={{ fontSize: 11 }}>
              {PC_ICONS[personalColor.season] ?? '✨'}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: pcColors.color }}>
              {t(personalColor.label)} {t('suggest.recommended')}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, gap: 8 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: 10, color: '#94a3b8', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {t('suggest.hero_base')}: {t(baseLook.name)}
            </p>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#334155', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {t(colorLook.name)}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            {swatches.map((c, i) => (
              <div key={i} style={{
                width: 26, height: 26, borderRadius: '50%', background: c,
                border: '2px solid rgba(255,255,255,0.8)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
              }} />
            ))}
          </div>
        </div>

        <p style={{ fontSize: 11, color: '#7c3aed', margin: '4px 0 12px', fontStyle: 'italic' }}>
          {t(colorLook.reason)}
        </p>

        <button
          onClick={onTry}
          style={{
            width: '100%', padding: 14,
            background: 'linear-gradient(135deg, #a855f7, #ec4899)',
            border: 'none', borderRadius: 14,
            fontSize: 14, fontWeight: 700, color: '#fff',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(168,85,247,0.3)',
          }}
        >
          {t('suggest.try_this')} →
        </button>
      </div>
    </div>
  );
}

function buildHeroReason(personalColor, skinScores, baseLook, colorLook, t) {
  const dullness = skinScores?.dullness?.score ?? 70;
  const season = personalColor?.season;
  const label = personalColor?.label ? t(personalColor.label) : '';

  if (dullness < 60 && season) {
    return t('suggest.hero_reason_dullness', { pc: label, base: t(baseLook.name), color: t(colorLook.name) });
  }
  if (season) {
    return t('suggest.hero_reason_pc', { pc: label, color: t(colorLook.name) });
  }
  return t('suggest.hero_reason_default', { color: t(colorLook.name) });
}

function SmallLookCard({ look, personalColor, isActive, onSelect, t }) {
  const isColorLook = !!(look.lip || look.eyeshadow) && !look.base;
  const swatches = isColorLook
    ? [look.lip, look.cheek, look.eyeshadow].filter(Boolean)
    : [look.base, look.concealer, look.brow].filter(Boolean);
  const pcMatch = personalColor && look.pcSeasons?.includes(personalColor.season);
  const pcColors = pcMatch ? getPcColors(personalColor.season) : null;
  const totalPrice = (look.products || []).reduce((s, p) => s + p.price, 0);

  return (
    <div
      onClick={onSelect}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: '#fff', borderRadius: 14, padding: '10px 14px',
        border: isActive ? '2px solid #a855f7' : '1px solid #ede9fe',
        boxShadow: isActive
          ? '0 0 0 3px rgba(168,85,247,0.1)'
          : '0 1px 4px rgba(139,92,246,0.06)',
        cursor: 'pointer', transition: 'all 0.15s',
      }}
    >
      <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
        {swatches.map((c, i) => (
          <div key={i} style={{
            width: 20, height: 20, borderRadius: '50%', background: c,
            border: '1.5px solid rgba(0,0,0,0.06)',
          }} />
        ))}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 13, fontWeight: 700, color: '#334155',
          margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {t(look.name)}
        </p>
        <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>
          ¥{totalPrice.toLocaleString()}
        </p>
      </div>

      {pcColors && !isActive && (
        <span style={{
          fontSize: 10, fontWeight: 600, color: pcColors.color,
          background: pcColors.bg, borderRadius: 8, padding: '2px 6px',
          border: `1px solid ${pcColors.border}`, flexShrink: 0,
        }}>✨</span>
      )}
      {isActive && (
        <span style={{ fontSize: 16, color: '#a855f7', flexShrink: 0 }}>✓</span>
      )}
    </div>
  );
}

function ExplorerTabs({ tab, setTab, t }) {
  const tabs = [t('suggest.tab_base'), t('suggest.tab_color')];
  return (
    <div style={{
      display: 'flex', marginBottom: 10, borderRadius: 12,
      overflow: 'hidden', border: '1px solid #e2e8f0',
    }}>
      {tabs.map((label, i) => (
        <button key={i} onClick={() => setTab(i)} style={{
          flex: 1, padding: '9px 0', fontSize: 12,
          fontWeight: tab === i ? 700 : 400,
          background: tab === i ? '#fff' : 'transparent',
          color: tab === i ? '#a855f7' : '#94a3b8',
          border: 'none', borderRight: i < tabs.length - 1 ? '1px solid #e2e8f0' : 'none',
          cursor: 'pointer',
        }}>
          {label}
        </button>
      ))}
    </div>
  );
}
