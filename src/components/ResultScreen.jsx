import { useState } from 'react';
import Kirari from './Kirari.jsx';
import Bubble from './Bubble.jsx';
import Score from './Score.jsx';
import ProductModal from './ProductModal.jsx';
import CoordinateOverlay from './CoordinateOverlay.jsx';
import { useT } from '../i18n/index.jsx';
import { SKIN_SCORES } from '../data/scores.js';
import { getCoordHint } from '../data/kirariDialogues.js';

function avg(scores) {
  const vals = Object.values(scores).map(v => v.score);
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

const STYLE_TAB_NAMES = ['Color makeup', 'Base makeup', 'Skin care'];
const WEATHER = { icon: '\u2600\uFE0F', temp: 22, label: '晴れ' };

function generateLookComment(selectedLook, styleTab, t) {
  if (styleTab === 2) return t("result.skincare_comment");
  if (!selectedLook) return t("result.makeup_comment");
  return `${selectedLook.name}${t("result.look_comment_suffix")} ${selectedLook.reason || t("result.look_comment_default")}`;
}

export default function ResultScreen({ skinScores: propSkin, onRestart, styleTab = 0, selectedLook = null }) {
  const { t } = useT();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showCoord, setShowCoord] = useState(false);
  const [showSkinScores, setShowSkinScores] = useState(false);

  const skinScores = propSkin || SKIN_SCORES;
  const overallSkin = avg(skinScores);
  const products = selectedLook?.products || [];
  const isColor = styleTab === 0;

  // Color swatches from the look
  const swatches = selectedLook
    ? (isColor
        ? [selectedLook.lip, selectedLook.cheek, selectedLook.eyeshadow].filter(Boolean)
        : [selectedLook.base, selectedLook.concealer, selectedLook.brow, selectedLook.lip].filter(Boolean))
    : [];

  return (
    <div style={{ position: 'relative', paddingBottom: 16, minHeight: '100%' }}>

      {/* ===== 1. Hero: Look name + swatches + Kirari comment ===== */}
      <div style={{
        margin: '8px 16px 12px', padding: '16px',
        background: 'linear-gradient(135deg, #faf5ff, #fdf2f8)',
        borderRadius: 20, border: '1px solid #ede9fe',
      }}>
        {/* Category badge */}
        <span style={{
          fontSize: 10, fontWeight: 600, color: '#a855f7',
          background: '#f3e8ff', padding: '3px 10px', borderRadius: 8,
        }}>
          {STYLE_TAB_NAMES[styleTab] || 'Color makeup'}
        </span>

        {/* Look name + swatches */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <p style={{ fontSize: 18, fontWeight: 800, color: '#334155', margin: 0 }}>
            {selectedLook?.name || 'Today\'s Look'}
          </p>
          {swatches.length > 0 && (
            <div style={{ display: 'flex', gap: 4 }}>
              {swatches.map((c, i) => (
                <div key={i} style={{
                  width: 24, height: 24, borderRadius: '50%', background: c,
                  border: '2px solid rgba(255,255,255,0.8)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                }} />
              ))}
            </div>
          )}
        </div>

        {selectedLook?.desc && (
          <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0', lineHeight: 1.5 }}>
            {selectedLook.desc}
          </p>
        )}

        {/* Kirari comment */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 12 }}>
          <Kirari size={36} expression="sparkle" bounce />
          <Bubble>
            <p style={{ fontSize: 12, color: '#334155', margin: 0, lineHeight: 1.6 }}>
              {generateLookComment(selectedLook, styleTab, t)}
            </p>
          </Bubble>
        </div>
      </div>

      {/* ===== 2. KIREI SELECT: Product cards ===== */}
      {products.length > 0 && (
        <div style={{ padding: '0 16px', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, color: '#a855f7', letterSpacing: 1,
              background: 'linear-gradient(135deg, #faf5ff, #f3e8ff)',
              padding: '3px 10px', borderRadius: 8, border: '1px solid #ede9fe',
            }}>
              KIREI SELECT
            </span>
            <span style={{ fontSize: 11, color: '#64748b' }}>{t("result.used_items")}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {products.map((p, i) => (
              <div key={i} onClick={() => setSelectedProduct(p)} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: '#fff', borderRadius: 14, padding: '12px 14px',
                boxShadow: '0 2px 8px rgba(139,92,246,0.06)',
                border: '1px solid #ede9fe', cursor: 'pointer',
              }}>
                <span style={{ fontSize: 22, width: 32, textAlign: 'center' }}>{p.emoji}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#334155', margin: 0 }}>{typeof p.name === 'object' ? t(p.name) : p.name}</p>
                  <p style={{ fontSize: 10, color: '#94a3b8', margin: '2px 0 0' }}>{p.shade}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#a855f7', margin: 0 }}>
                    {'\u00A5'}{p.price.toLocaleString()}
                  </p>
                  <span style={{ fontSize: 9, color: '#c084fc' }}>KIREI SELECT</span>
                </div>
              </div>
            ))}
          </div>
          {/* Total */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
            padding: '8px 4px 0', gap: 8,
          }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{t("result.total")}</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#a855f7' }}>
              {'\u00A5'}{products.reduce((s, p) => s + p.price, 0).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />

      {/* ===== 3. Coord hint + CTA ===== */}
      <div style={{ margin: '0 16px 12px', background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
        borderRadius: 18, padding: '14px 16px', border: '1px solid #fde68a' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
          <Kirari size={32} expression="sparkle"/>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#92400e', margin: '0 0 4px' }}>
              {WEATHER.icon} {t("result.coord_hint")}
            </p>
            <p style={{ fontSize: 11, color: '#78350f', margin: 0, lineHeight: 1.6 }}>
              {getCoordHint(selectedLook, styleTab, WEATHER)}
            </p>
          </div>
        </div>
        <button onClick={() => setShowCoord(true)} style={{
          width: '100%', padding: 12,
          background: 'linear-gradient(135deg, #f59e0b, #f97316)',
          border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700,
          color: '#fff', cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
        }}>
          {'👗'} {t("result.view_coord")} {'→'}
        </button>
      </div>

      {/* ===== 4. Skin score accordion ===== */}
      <div style={{ margin: '0 16px 12px' }}>
        <button onClick={() => setShowSkinScores(s => !s)} style={{
          width: '100%', padding: '10px 14px',
          background: '#fff', border: '1px solid #ede9fe', borderRadius: showSkinScores ? '14px 14px 0 0' : 14,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#64748b',
        }}>
          <span>{t("result.check_skin_score")}</span>
          <span style={{
            fontSize: 10, color: '#a855f7', fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <span style={{
              background: '#faf5ff', borderRadius: 6, padding: '2px 8px',
              fontSize: 12, fontWeight: 800, color: '#a855f7',
            }}>
              {overallSkin}
            </span>
            {showSkinScores ? '\u25B2' : '\u25BC'}
          </span>
        </button>
        {showSkinScores && (
          <div style={{
            background: '#fff', border: '1px solid #ede9fe', borderTop: 'none',
            borderRadius: '0 0 14px 14px', padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
              {Object.entries(skinScores).map(([k, v], i) => (
                <Score key={k} score={v.score} size={64} color={v.color} label={t(v.labelKey)} delay={50 + i * 100} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ===== 5. Restart / Disclaimer ===== */}
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        <button className="btn-secondary" onClick={onRestart} style={{ width: "100%", padding: 11, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, fontSize: 12, fontWeight: 600, color: "#64748b", cursor: "pointer" }}>{t("result.restart")}</button>
      </div>
      <p className="disclaimer" style={{ textAlign: "center", fontSize: 10, color: "#cbd5e1", marginTop: 12, padding: "0 20px" }}>{t("result.disclaimer")}</p>

      {/* Coordinate overlay */}
      {showCoord && (
        <CoordinateOverlay
          styleTab={styleTab}
          selectedLook={selectedLook}
          weather={WEATHER}
          onClose={() => setShowCoord(false)}
        />
      )}
    </div>
  );
}
