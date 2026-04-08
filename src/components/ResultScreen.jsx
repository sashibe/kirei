/**
 * ResultScreen — 購入確認画面（CheckoutScreen）
 * カートアイテム一覧 + 購入CTA + スキンケア/メイク導線
 */
import { useState } from 'react';
import ScoreHistory from './ScoreHistory.jsx';
import CoordinateOverlay from './CoordinateOverlay.jsx';
import { useT } from '../i18n/index.jsx';
import { getPcColors, getSeasonText } from '../analysis/personalColor.js';
import useWeather from '../hooks/useWeather.js';

export default function ResultScreen({ skinScores, personalColor, cart, capturedImage, onRestart, onSkincareAR, onBackToAR }) {
  const { t, lang } = useT();
  const weather = useWeather();
  const [showScores, setShowScores] = useState(false);

  const pcText = personalColor?.subtypeId ? getSeasonText(personalColor.subtypeId, lang) : null;
  const pcBg = personalColor ? getPcColors(personalColor.season) : null;
  const cartItems = cart?.cartItems || [];
  const totalPrice = cart?.totalPrice || 0;
  const txt = (v) => (typeof v === 'object' && v !== null) ? (v[lang] ?? v.ja ?? '') : (v ?? '');

  return (
    <div style={{ paddingBottom: 24 }}>

      {/* PC badge */}
      {personalColor && pcBg && pcText && (
        <div style={{ margin: '8px 16px 12px', padding: '12px 16px',
          background: pcBg.bg, border: `1px solid ${pcBg.border}`, borderRadius: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>{pcText.emoji}</span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: pcText.color, margin: 0 }}>{pcText.main}</p>
              {pcText.sub && <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, margin: '2px 0 0' }}>{pcText.sub}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Captured photo */}
      {capturedImage && (
        <div style={{ position: 'relative' }}>
          <img src={capturedImage} style={{ width: '100%', display: 'block', borderRadius: '0 0 24px 24px' }} alt="" />
        </div>
      )}

      {/* Score History */}
      <ScoreHistory />

      {/* Cart section */}
      <div style={{ margin: '0 16px 14px', padding: '16px', background: '#fff', borderRadius: 16,
        boxShadow: '0 2px 8px rgba(139,92,246,0.06)', border: '1px solid #ede9fe' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#334155', margin: '0 0 12px' }}>
          {'\uD83D\uDED2'} {t('cart_title') || '\u304A\u8CB7\u3044\u7269\u304B\u3054'}
        </h3>

        {cartItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px 0', color: '#94a3b8' }}>
            <p style={{ fontSize: 14, margin: '0 0 12px' }}>{t('cart_empty') || '\u30AB\u30FC\u30C8\u306B\u5546\u54C1\u304C\u3042\u308A\u307E\u305B\u3093'}</p>
            <button onClick={onBackToAR} style={{
              background: 'linear-gradient(135deg, #a855f7, #ec4899)', color: '#fff',
              border: 'none', borderRadius: 14, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>{'\uD83D\uDC84'} {t('try_makeup') || '\u30E1\u30A4\u30AF\u3092\u8A66\u3059 \u2192'}</button>
          </div>
        ) : (
          <>
            {cartItems.map(item => (
              <div key={item.uniqueKey} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0', borderBottom: '1px solid rgba(168,85,247,0.08)',
              }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%',
                  background: item.selectedColor?.hex || '#ccc', flexShrink: 0,
                  border: '2px solid rgba(168,85,247,0.15)' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{txt(item.product?.name)}</div>
                  <div style={{ fontSize: 11, color: '#7c7291' }}>{txt(item.selectedColor?.name)}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#a855f7', whiteSpace: 'nowrap' }}>
                  {'\u00A5'}{(item.price || 0).toLocaleString()}</div>
                <button onClick={() => cart.dispatch({ type: 'REMOVE', payload: { uniqueKey: item.uniqueKey } })} style={{
                  background: 'none', border: 'none', color: '#94a3b8', fontSize: 16, cursor: 'pointer', padding: 4,
                }}>{'\u2715'}</button>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 0', marginTop: 8 }}>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{t('cart_total') || '\u5408\u8A08'}</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#a855f7' }}>{'\u00A5'}{totalPrice.toLocaleString()}</span>
            </div>
            <button onClick={cart.handleCheckout} style={{
              width: '100%', padding: 14, marginTop: 12,
              background: 'linear-gradient(135deg, #a855f7, #ec4899)', border: 'none', borderRadius: 14,
              fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(168,85,247,0.25)',
            }}>{'\uD83D\uDED2'} {t('checkout') || '\u5546\u54C1\u3092\u8CFC\u5165\u3059\u308B'}</button>
          </>
        )}
      </div>

      {/* Change makeup */}
      <div style={{ padding: '0 16px', marginBottom: 10 }}>
        <button onClick={onBackToAR} style={{
          width: '100%', padding: 12, background: 'transparent', border: '1.5px solid #a855f7',
          borderRadius: 14, fontSize: 13, fontWeight: 700, color: '#a855f7', cursor: 'pointer',
        }}>{'\uD83D\uDC84'} {t('change_makeup') || '\u30E1\u30A4\u30AF\u3092\u5909\u66F4\u3059\u308B \u2192'}</button>
      </div>

      {/* Coordinate hint — removed from checkout screen (was full-screen overlay) */}

      {/* Skincare CTA */}
      <div style={{ padding: '0 16px', marginBottom: 10 }}>
        <button onClick={onSkincareAR} style={{
          width: '100%', padding: 12, background: 'linear-gradient(135deg, #22c55e, #16a34a)',
          border: 'none', borderRadius: 14, fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer',
        }}>{'\uD83C\uDF3F'} {t('skincare_also') || '\u30B9\u30AD\u30F3\u30B1\u30A2\u3082\u898B\u308B \u2192'}</button>
      </div>

      {/* Skin score accordion */}
      <div style={{ padding: '0 16px', marginBottom: 14 }}>
        <button onClick={() => setShowScores(v => !v)} style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: '#f8f7ff', border: '1px solid #ede9fe', borderRadius: 14, padding: '10px 14px', cursor: 'pointer',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>{t('result.check_skin_score') || '\u808C\u30B9\u30B3\u30A2\u3092\u78BA\u8A8D'}</span>
          <span style={{ fontSize: 11, color: '#a78bfa', transform: showScores ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>{'\u25BC'}</span>
        </button>
        {showScores && skinScores && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {Object.entries(skinScores).map(([key, val]) => (
              <div key={key} style={{ flex: 1, background: '#fff', borderRadius: 12, padding: '8px 6px', textAlign: 'center',
                border: `1px solid ${val.score < 60 ? '#fde68a' : '#d1fae5'}` }}>
                <p style={{ fontSize: 9, color: '#94a3b8', margin: '0 0 2px', fontWeight: 600 }}>{t(val.labelKey)}</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: val.score < 60 ? '#f59e0b' : '#22c55e', margin: 0 }}>{val.score}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Back to mirror */}
      <div style={{ padding: '0 16px', marginBottom: 8 }}>
        <button onClick={onRestart} style={{
          width: '100%', padding: 11, background: '#f8fafc', border: '1px solid #e2e8f0',
          borderRadius: 14, fontSize: 12, fontWeight: 600, color: '#64748b', cursor: 'pointer',
        }}>{'\uD83E\uDE9E'} {t('back_to_mirror') || '\u30DF\u30E9\u30FC\u306B\u623B\u308B'}</button>
      </div>

      <p style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center', padding: '0 16px' }}>
        {t('result.disclaimer') || '\u203B\u672C\u30A2\u30D7\u30EA\u306F\u533B\u7642\u8A3A\u65AD\u3092\u884C\u3046\u3082\u306E\u3067\u306F\u3042\u308A\u307E\u305B\u3093'}
      </p>
    </div>
  );
}
