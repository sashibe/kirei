/**
 * ResultScreen — 購入確認画面（CheckoutScreen）
 * カートアイテム一覧 + 購入CTA + スキンケア/メイク導線
 */
import { useState, useMemo } from 'react';
import ScoreHistory from './ScoreHistory.jsx';
import CoordinateOverlay from './CoordinateOverlay.jsx';
import { useT } from '../i18n/index.jsx';
import { getPcColors, getSeasonText } from '../analysis/personalColor.js';
import useWeather from '../hooks/useWeather.js';
import { shareImage } from '../utils/share.js';

export default function ResultScreen({ skinScores, personalColor, cart, capturedImage, currentArItems = [], onRestart, onSkincareAR, onBackToAR }) {
  const { t, lang } = useT();
  const weather = useWeather();
  const [showScores, setShowScores] = useState(false);
  const [showCoord, setShowCoord] = useState(false);

  const pcText = personalColor?.subtypeId ? getSeasonText(personalColor.subtypeId, lang) : null;
  const pcBg = personalColor ? getPcColors(personalColor.season) : null;
  const cartItems = cart?.cartItems || [];
  const txt = (v) => (typeof v === 'object' && v !== null) ? (v[lang] ?? v.ja ?? '') : (v ?? '');

  // AR試着中アイテム + カートアイテムの和集合（重複はカートを優先）
  const purchaseCandidates = useMemo(() => {
    const map = new Map();
    (currentArItems || []).forEach(item => {
      if (item.price > 0) map.set(item.uniqueKey, { ...item, source: 'ar' });
    });
    (cartItems || []).forEach(item => {
      if (map.has(item.uniqueKey)) {
        map.set(item.uniqueKey, { ...map.get(item.uniqueKey), source: 'both' });
      } else {
        map.set(item.uniqueKey, { ...item, source: 'cart' });
      }
    });
    return [...map.values()];
  }, [currentArItems, cartItems]);

  // 購入候補チェック状態（デフォルト全チェック）
  const [checkedKeys, setCheckedKeys] = useState(() => new Set(purchaseCandidates.map(i => i.uniqueKey)));

  const toggleCheck = (key) => setCheckedKeys(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const checkedTotal = purchaseCandidates
    .filter(i => checkedKeys.has(i.uniqueKey))
    .reduce((sum, i) => sum + (i.price || 0), 0);

  const handleCheckedCheckout = () => {
    purchaseCandidates
      .filter(i => checkedKeys.has(i.uniqueKey))
      .forEach((item, idx) => {
        const url = item.product?.affiliateUrl || item.product?.rakutenUrl;
        if (url && url !== '#') setTimeout(() => window.open(url, '_blank'), idx * 500);
      });
  };

  return (
    <div style={{ paddingBottom: 24 }}>

      {/* PC badge */}
      {personalColor && pcBg && pcText && (
        <div style={{ margin: '8px 16px 12px', padding: '12px 16px',
          background: pcBg.bg, border: `1px solid ${pcBg.border}`, borderRadius: 18 }}>
          <p style={{ fontSize: 10, color: pcBg.color, opacity: 0.7, margin: '0 0 4px', fontWeight: 600 }}>
            {t('pc.your_type') || '\u3042\u306A\u305F\u306E\u30D1\u30FC\u30BD\u30CA\u30EB\u30AB\u30E9\u30FC'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>{pcText.emoji}</span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: pcText.color, margin: 0 }}>{pcText.main}</p>
              {pcText.sub && <p style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, margin: '2px 0 0' }}>{pcText.sub}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Captured photo with share button */}
      {capturedImage && (
        <div style={{ position: 'relative', margin: '0 16px 16px' }}>
          <div style={{ width: '100%', aspectRatio: '3/4', borderRadius: 20, overflow: 'hidden' }}>
            <img src={capturedImage} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} alt="" />
          </div>
          <button onClick={() => shareImage(capturedImage, 'KIREI Makeup')} style={{
            position: 'absolute', bottom: 12, right: 12,
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
            border: 'none', borderRadius: 20,
            padding: '6px 12px',
            display: 'flex', alignItems: 'center', gap: 4,
            color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>{'\uD83D\uDCE4'} シェア</button>
        </div>
      )}

      {/* Score History */}
      <ScoreHistory />

      {/* 購入候補チェックリスト */}
      <div style={{ margin: '0 16px 14px', padding: '16px', background: '#fff', borderRadius: 16,
        boxShadow: '0 2px 8px rgba(139,92,246,0.06)', border: '1px solid #ede9fe' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#334155', margin: 0 }}>
            🛍️ {t('result.ar_items_title') || 'ARで試したアイテム'}
          </h3>
          {purchaseCandidates.length > 1 && (
            <button onClick={() => {
              const allChecked = purchaseCandidates.every(i => checkedKeys.has(i.uniqueKey));
              setCheckedKeys(allChecked ? new Set() : new Set(purchaseCandidates.map(i => i.uniqueKey)));
            }} style={{
              fontSize: 10, color: '#a855f7', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600,
            }}>
              {purchaseCandidates.every(i => checkedKeys.has(i.uniqueKey)) ? '全解除' : '全選択'}
            </button>
          )}
        </div>

        {purchaseCandidates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px 0', color: '#94a3b8' }}>
            <p style={{ fontSize: 14, margin: '0 0 12px' }}>{t('cart_empty') || 'ARで試した商品がありません'}</p>
            <button onClick={onBackToAR} style={{
              background: 'linear-gradient(135deg, #a855f7, #ec4899)', color: '#fff',
              border: 'none', borderRadius: 14, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>💄 {t('try_makeup') || 'メイクを試す →'}</button>
          </div>
        ) : (
          <>
            {purchaseCandidates.map(item => {
              const checked = checkedKeys.has(item.uniqueKey);
              return (
                <div key={item.uniqueKey} onClick={() => toggleCheck(item.uniqueKey)} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 0', borderBottom: '1px solid rgba(168,85,247,0.08)',
                  cursor: 'pointer', opacity: checked ? 1 : 0.45, transition: 'opacity 0.15s',
                }}>
                  {/* カスタムチェックボックス */}
                  <div style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    border: `2px solid ${checked ? '#a855f7' : '#cbd5e1'}`,
                    background: checked ? '#a855f7' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {checked && <span style={{ color: '#fff', fontSize: 13, lineHeight: 1, fontWeight: 700 }}>✓</span>}
                  </div>
                  {/* カラースウォッチ */}
                  <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: item.selectedColor?.hex || '#ccc',
                    border: '2px solid rgba(168,85,247,0.15)' }} />
                  {/* 商品名 + バッジ */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a2e',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {txt(item.product?.name)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <span style={{ fontSize: 10, color: '#7c7291' }}>{txt(item.selectedColor?.name)}</span>
                      {item.source === 'ar' && (
                        <span style={{ fontSize: 8, background: '#e0e7ff', color: '#4f46e5',
                          borderRadius: 4, padding: '1px 4px', fontWeight: 700 }}>AR試着</span>
                      )}
                      {item.source === 'cart' && (
                        <span style={{ fontSize: 8, background: '#fdf4ff', color: '#a855f7',
                          borderRadius: 4, padding: '1px 4px', fontWeight: 700 }}>カート済</span>
                      )}
                    </div>
                  </div>
                  {/* 価格 */}
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#a855f7', whiteSpace: 'nowrap' }}>
                    ¥{(item.price || 0).toLocaleString()}
                  </div>
                </div>
              );
            })}

            {/* 合計 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0 0', marginTop: 8 }}>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                {t('cart_total') || '合計'} ({checkedKeys.size}点)
              </span>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#a855f7' }}>¥{checkedTotal.toLocaleString()}</span>
            </div>
            <button onClick={handleCheckedCheckout} disabled={checkedKeys.size === 0} style={{
              width: '100%', padding: 14, marginTop: 12,
              background: checkedKeys.size === 0
                ? '#e2e8f0'
                : 'linear-gradient(135deg, #a855f7, #ec4899)',
              border: 'none', borderRadius: 14,
              fontSize: 14, fontWeight: 700,
              color: checkedKeys.size === 0 ? '#94a3b8' : '#fff',
              cursor: checkedKeys.size === 0 ? 'default' : 'pointer',
              boxShadow: checkedKeys.size === 0 ? 'none' : '0 4px 16px rgba(168,85,247,0.25)',
              transition: 'all 0.2s',
            }}>🛒 {t('checkout') || '選択した商品を購入する'}</button>
            <p style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center', margin: '6px 0 0' }}>
              {t('result.purchase_note') || '※外部サイト（MUSINSA）に移動します'}
            </p>
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

      {/* Coordinate hint — button to open overlay */}
      {weather && skinScores && (
        <>
          <div style={{ padding: '0 16px', marginBottom: 10 }}>
            <button onClick={() => setShowCoord(true)} style={{
              width: '100%', padding: 12,
              background: '#fffbeb', border: '1.5px solid #fde68a',
              borderRadius: 14, fontSize: 13, fontWeight: 700,
              color: '#b45309', cursor: 'pointer',
            }}>{'\uD83D\uDC57'} {t('result.view_coord') || '\u304A\u3059\u3059\u3081\u30B3\u30FC\u30C7\u3092\u898B\u308B \u2192'}</button>
          </div>
          {showCoord && (
            <CoordinateOverlay weather={weather} personalColor={personalColor} skinScores={skinScores}
              onClose={() => setShowCoord(false)} />
          )}
        </>
      )}

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
