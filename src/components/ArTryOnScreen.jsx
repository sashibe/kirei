import { useState } from 'react';
import Kirari from './Kirari.jsx';
import Bubble from './Bubble.jsx';

export default function ArTryOnScreen({ look, styleTab, onNext, onBack }) {
  const [intensity, setIntensity] = useState(70);
  const isColor = styleTab === 0;

  // Color makeup overlays
  const lipColor = look?.lip || '#e8607c';
  const cheekColor = look?.cheek || 'rgba(232,96,124,0.25)';
  const eyeshadowColor = look?.eyeshadow || 'rgba(232,150,120,0.2)';

  // Base makeup overlays
  const baseColor = look?.base || '#e8d8c8';
  const concealerColor = look?.concealer;
  const browColor = look?.brow;

  const opacityFactor = intensity / 100;

  return (
    <div style={{ padding: '12px 0' }}>
      {/* Back button */}
      <button onClick={onBack} style={{
        background: 'none', border: 'none', fontSize: 13, color: '#94a3b8',
        cursor: 'pointer', padding: '0 16px 8px', fontWeight: 600,
      }}>
        {'<'} ルック選択に戻る
      </button>

      {/* AR Preview area */}
      <div style={{
        position: 'relative', margin: '0 16px 12px',
        borderRadius: 20, overflow: 'hidden',
        background: '#f8f5ff',
        aspectRatio: '3/4',
      }}>
        {/* Face placeholder */}
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(180deg, #faf5ff 0%, #fdf2f8 100%)',
          position: 'relative',
        }}>
          {/* Face silhouette */}
          <svg viewBox="0 0 200 260" style={{ width: '60%', height: '70%' }}>
            {/* Face */}
            <ellipse cx="100" cy="110" rx="65" ry="80" fill="#f5d0b0"/>
            {/* Hair */}
            <ellipse cx="100" cy="55" rx="70" ry="50" fill="#4a3728"/>
            <rect x="30" y="55" width="140" height="30" rx="5" fill="#4a3728"/>
            {/* Eyes */}
            <ellipse cx="75" cy="105" rx="10" ry="6" fill="#fff"/>
            <ellipse cx="125" cy="105" rx="10" ry="6" fill="#fff"/>
            <ellipse cx="75" cy="105" rx="5" ry="5" fill="#3a2a1a"/>
            <ellipse cx="125" cy="105" rx="5" ry="5" fill="#3a2a1a"/>
            {/* Eyebrows */}
            <path d="M58 90 Q75 82 90 88" stroke={browColor || '#5a4030'} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            <path d="M110 88 Q125 82 142 90" stroke={browColor || '#5a4030'} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            {/* Nose */}
            <path d="M100 108 L96 128 Q100 132 104 128 Z" fill="#e8c0a0" opacity="0.5"/>

            {isColor ? (
              <>
                {/* Eyeshadow overlay */}
                <ellipse cx="75" cy="100" rx="16" ry="10" fill={eyeshadowColor} opacity={opacityFactor * 0.8}/>
                <ellipse cx="125" cy="100" rx="16" ry="10" fill={eyeshadowColor} opacity={opacityFactor * 0.8}/>
                {/* Cheek overlay */}
                <ellipse cx="60" cy="135" rx="18" ry="14" fill={cheekColor} opacity={opacityFactor}/>
                <ellipse cx="140" cy="135" rx="18" ry="14" fill={cheekColor} opacity={opacityFactor}/>
                {/* Lip overlay */}
                <path d="M85 155 Q100 148 115 155 Q108 165 100 167 Q92 165 85 155 Z" fill={lipColor} opacity={opacityFactor * 0.85}/>
              </>
            ) : (
              <>
                {/* Base makeup: tone-up overlay */}
                <ellipse cx="100" cy="120" rx="60" ry="70" fill={baseColor} opacity={opacityFactor * 0.15} style={{ mixBlendMode: 'softLight' }}/>
                {/* Concealer under eyes */}
                {concealerColor && (
                  <>
                    <ellipse cx="75" cy="115" rx="12" ry="6" fill={concealerColor} opacity={opacityFactor * 0.3}/>
                    <ellipse cx="125" cy="115" rx="12" ry="6" fill={concealerColor} opacity={opacityFactor * 0.3}/>
                  </>
                )}
                {/* Lip (if base look has lip) */}
                {look?.lip && (
                  <path d="M85 155 Q100 148 115 155 Q108 165 100 167 Q92 165 85 155 Z" fill={look.lip} opacity={opacityFactor * 0.5}/>
                )}
              </>
            )}
          </svg>

          {/* Look name badge */}
          <div style={{
            position: 'absolute', top: 12, left: 12,
            background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)',
            borderRadius: 12, padding: '6px 12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#a855f7', margin: 0 }}>
              {look?.name || 'ルック'}
            </p>
          </div>

          {/* Product swatches */}
          <div style={{
            position: 'absolute', bottom: 12, right: 12,
            display: 'flex', gap: 6,
          }}>
            {look?.products?.map((p, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)',
                borderRadius: 10, padding: '4px 8px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}>
                <p style={{ fontSize: 9, color: '#64748b', margin: 0 }}>{p.emoji} {p.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Kirari comment */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '0 16px 10px' }}>
        <Kirari size={32} expression="sparkle" />
        <Bubble>
          <p style={{ fontSize: 12, color: '#334155', margin: 0, lineHeight: 1.6 }}>
            {isColor
              ? `${look?.name || 'メイク'}を試してるよ♪ スライダーで強さを調整してみてね！`
              : `${look?.name || 'ベースメイク'}でナチュラルに仕上げたよ♪ いい感じ！`}
          </p>
        </Bubble>
      </div>

      {/* Intensity slider */}
      <div style={{ padding: '0 16px', marginBottom: 14 }}>
        <div style={{
          background: '#fff', borderRadius: 14, padding: '12px 16px',
          boxShadow: '0 2px 8px rgba(139,92,246,0.06)', border: '1px solid #ede9fe',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>メイクの強さ</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#a855f7' }}>{intensity}%</span>
          </div>
          <input
            type="range" min="0" max="100" value={intensity}
            onChange={e => setIntensity(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#a855f7' }}
          />
        </div>
      </div>

      {/* Product list */}
      <div style={{ padding: '0 16px', marginBottom: 14 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#64748b', margin: '0 0 8px' }}>使用アイテム</p>
        {look?.products?.map((p, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
            borderBottom: i < look.products.length - 1 ? '1px solid #f1f5f9' : 'none',
          }}>
            <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{p.emoji}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#334155', margin: 0 }}>{p.name}</p>
              <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>{p.shade}</p>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#a855f7' }}>
              {'\u00A5'}{p.price.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
        <button onClick={onNext} style={{
          width: '100%', padding: 14,
          background: 'linear-gradient(135deg, #a855f7, #ec4899)',
          border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700,
          color: '#fff', cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(168,85,247,0.25)',
        }}>
          このルックで結果を見る →
        </button>
        <button onClick={onBack} style={{
          width: '100%', padding: 11,
          background: '#f8fafc', border: '1px solid #e2e8f0',
          borderRadius: 14, fontSize: 12, fontWeight: 600,
          color: '#64748b', cursor: 'pointer',
        }}>
          別のルックを試す
        </button>
      </div>
    </div>
  );
}
