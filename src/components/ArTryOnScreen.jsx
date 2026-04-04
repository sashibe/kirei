import { useState, useRef, useEffect, useCallback } from 'react';
import Kirari from './Kirari.jsx';
import Bubble from './Bubble.jsx';
import MakeupCanvas from './MakeupCanvas.jsx';
import useCamera from '../hooks/useCamera.js';
import { useT } from '../i18n/index.jsx';
import { GLASSES_ITEMS, EARRING_ITEMS } from '../data/accessories.js';

const CATEGORIES = [
  { id: 'lip',     label: 'リップ',    icon: '💄' },
  { id: 'cheek',   label: 'チーク',    icon: '🌸' },
  { id: 'glasses', label: 'メガネ',    icon: '👓' },
  { id: 'earring', label: 'イヤリング', icon: '💍' },
];

export default function ArTryOnScreen({ look, styleTab, onDecide, onBack }) {
  const { t } = useT();
  const [intensity, setIntensity] = useState(70);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [showMesh, setShowMesh] = useState(false);
  const [videoAspect, setVideoAspect] = useState(null);
  const [activeCategory, setActiveCategory] = useState('lip');
  const [lipColor, setLipColor] = useState(look?.lip || '#e8607c');
  const [cheekColor, setCheekColor] = useState(look?.cheek || 'rgba(232,96,124,0.4)');
  const [selectedGlasses, setSelectedGlasses] = useState('none');
  const [selectedEarring, setSelectedEarring] = useState('none');
  const isColor = styleTab === 0;

  const canvasRef = useRef(null);
  const { videoRef, isActive, error: cameraError } = useCamera({ enabled: true });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlaying = () => {
      setVideoPlaying(true);
      if (video.videoWidth && video.videoHeight) {
        setVideoAspect(`${video.videoWidth} / ${video.videoHeight}`);
      }
    };
    if (video.readyState >= 2) { onPlaying(); return; }
    video.addEventListener('loadeddata', onPlaying);
    return () => video.removeEventListener('loadeddata', onPlaying);
  }, [isActive, videoRef]);

  const getVideo = useCallback(() => videoRef.current, [videoRef]);
  const cameraLive = isActive && !cameraError && videoPlaying;

  // 現在のlookにリップ/チークの選択を反映
  const activeLook = { ...look, lip: lipColor, cheek: cheekColor };

  const opacityFactor = intensity / 100;
  const eyeshadowColor = look?.eyeshadow || 'rgba(232,150,120,0.2)';
  const baseColor = look?.base || '#e8d8c8';
  const concealerColor = look?.concealer;
  const browColor = look?.brow;

  const glassesItem = GLASSES_ITEMS.find(i => i.id === selectedGlasses);
  const earringItem = EARRING_ITEMS.find(i => i.id === selectedEarring);

  const lookName = look?.name
    ? (typeof look.name === 'object' ? t(look.name) : look.name)
    : t('ar.look_fallback');

  // キャプチャ → 結果画面へ
  const handleDecide = () => {
    // video + canvas を合成してキャプチャ
    const video = videoRef.current;
    const arCanvas = canvasRef.current;

    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = video.videoWidth || 640;
    captureCanvas.height = video.videoHeight || 480;
    const cctx = captureCanvas.getContext('2d');

    // video描画（ミラー反転）
    cctx.save();
    cctx.translate(captureCanvas.width, 0);
    cctx.scale(-1, 1);
    cctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
    cctx.restore();

    // ARオーバーレイ描画（ミラー反転）
    if (arCanvas) {
      cctx.save();
      cctx.translate(captureCanvas.width, 0);
      cctx.scale(-1, 1);
      cctx.drawImage(arCanvas, 0, 0, captureCanvas.width, captureCanvas.height);
      cctx.restore();
    }

    const dataUrl = captureCanvas.toDataURL('image/jpeg', 0.92);

    const accessoryProducts = [
      ...(glassesItem && glassesItem.id !== 'none'
        ? [{ emoji: glassesItem.emoji, name: glassesItem.name,
             shade: glassesItem.shape || '', price: glassesItem.price,
             category: 'glasses' }]
        : []),
      ...(earringItem && earringItem.id !== 'none'
        ? [{ emoji: earringItem.emoji, name: earringItem.name,
             shade: earringItem.type || '', price: earringItem.price,
             category: 'earring' }]
        : []),
    ];

    onDecide({
      capturedImage: dataUrl,
      look: activeLook,
      products: [
        ...(look?.products || []),
        ...accessoryProducts,
      ],
    });
  };

  // リップカラーパレット
  const LIP_COLORS = ['#e8607c','#c05070','#d4826a','#b85050','#cf6080','#e07070'];
  // チークカラーパレット
  const CHEEK_COLORS = [
    'rgba(232,96,124,0.4)',
    'rgba(255,150,100,0.4)',
    'rgba(200,160,200,0.4)',
    'rgba(255,180,120,0.4)',
  ];

  return (
    <div style={{ padding: '12px 0' }}>
      {/* Back button */}
      <button onClick={onBack} style={{
        background: 'none', border: 'none', fontSize: 13, color: '#94a3b8',
        cursor: 'pointer', padding: '0 16px 8px', fontWeight: 600,
      }}>
        {'<'} {t('ar.back_to_looks')}
      </button>

      {/* AR Preview area */}
      <div style={{
        position: 'relative', margin: '0 16px 12px',
        borderRadius: 20, overflow: 'hidden',
        background: cameraLive ? '#000' : '#f8f5ff',
        aspectRatio: cameraLive && videoAspect ? videoAspect : '3/4',
        maxHeight: '55vh',
      }}>
        <video
          ref={videoRef}
          style={{
            width: '100%', height: '100%',
            objectFit: 'contain',
            transform: 'scaleX(-1)',
            display: cameraLive ? 'block' : 'none',
          }}
          playsInline muted autoPlay
        />

        {cameraLive && (
          <MakeupCanvas
            ref={canvasRef}
            getVideo={getVideo}
            look={activeLook}
            styleTab={styleTab}
            intensity={intensity}
            showMesh={showMesh}
            glassesItem={glassesItem}
            earringItem={earringItem}
          />
        )}

        {/* メッシュ表示トグル */}
        {cameraLive && (
          <button
            onClick={() => setShowMesh(v => !v)}
            style={{
              position: 'absolute', top: 12, right: 12,
              background: showMesh ? 'rgba(168,85,247,0.7)' : 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(8px)',
              border: showMesh ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.2)',
              borderRadius: 10, padding: '5px 10px',
              fontSize: 10, fontWeight: 600,
              color: '#fff', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {showMesh ? '◉ Mesh ON' : '○ Mesh'}
          </button>
        )}

        {/* SVG フォールバック */}
        {!cameraLive && (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(180deg, #faf5ff 0%, #fdf2f8 100%)',
            position: 'relative',
          }}>
            <svg viewBox="0 0 200 260" style={{ width: '60%', height: '70%' }}>
              <ellipse cx="100" cy="110" rx="65" ry="80" fill="#f5d0b0"/>
              <ellipse cx="100" cy="55" rx="70" ry="50" fill="#4a3728"/>
              <rect x="30" y="55" width="140" height="30" rx="5" fill="#4a3728"/>
              <ellipse cx="75" cy="105" rx="10" ry="6" fill="#fff"/>
              <ellipse cx="125" cy="105" rx="10" ry="6" fill="#fff"/>
              <ellipse cx="75" cy="105" rx="5" ry="5" fill="#3a2a1a"/>
              <ellipse cx="125" cy="105" rx="5" ry="5" fill="#3a2a1a"/>
              <path d="M58 90 Q75 82 90 88" stroke={browColor || '#5a4030'} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              <path d="M110 88 Q125 82 142 90" stroke={browColor || '#5a4030'} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              <path d="M100 108 L96 128 Q100 132 104 128 Z" fill="#e8c0a0" opacity="0.5"/>
              {isColor ? (
                <>
                  <ellipse cx="75" cy="100" rx="16" ry="10" fill={eyeshadowColor} opacity={opacityFactor * 0.8}/>
                  <ellipse cx="125" cy="100" rx="16" ry="10" fill={eyeshadowColor} opacity={opacityFactor * 0.8}/>
                  <ellipse cx="60" cy="135" rx="18" ry="14" fill={cheekColor} opacity={opacityFactor}/>
                  <ellipse cx="140" cy="135" rx="18" ry="14" fill={cheekColor} opacity={opacityFactor}/>
                  <path d="M85 155 Q100 148 115 155 Q108 165 100 167 Q92 165 85 155 Z" fill={lipColor} opacity={opacityFactor * 0.85}/>
                </>
              ) : (
                <>
                  <ellipse cx="100" cy="120" rx="60" ry="70" fill={baseColor} opacity={opacityFactor * 0.15} style={{ mixBlendMode: 'softLight' }}/>
                  {concealerColor && (
                    <>
                      <ellipse cx="75" cy="115" rx="12" ry="6" fill={concealerColor} opacity={opacityFactor * 0.3}/>
                      <ellipse cx="125" cy="115" rx="12" ry="6" fill={concealerColor} opacity={opacityFactor * 0.3}/>
                    </>
                  )}
                  {look?.lip && (
                    <path d="M85 155 Q100 148 115 155 Q108 165 100 167 Q92 165 85 155 Z" fill={look.lip} opacity={opacityFactor * 0.5}/>
                  )}
                </>
              )}
            </svg>
          </div>
        )}

        {/* Look name badge */}
        <div style={{
          position: 'absolute', top: 12, left: 12,
          background: cameraLive ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(8px)',
          borderRadius: 12, padding: '6px 12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}>
          <p style={{
            fontSize: 11, fontWeight: 700, margin: 0,
            color: cameraLive ? '#fff' : '#a855f7',
          }}>
            {lookName}
          </p>
        </div>
      </div>

      {/* Kirari comment */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '0 16px 10px' }}>
        <Kirari size={32} expression="sparkle" />
        <Bubble>
          <p style={{ fontSize: 12, color: '#334155', margin: 0, lineHeight: 1.6 }}>
            {isColor
              ? t('ar.color_comment', { name: lookName })
              : t('ar.base_comment', { name: lookName })}
          </p>
        </Bubble>
      </div>

      {/* Category tabs + selection panel */}
      <div style={{ padding: '0 16px', marginBottom: 10 }}>
        <div style={{
          background: '#fff', borderRadius: 16, padding: '10px 12px',
          boxShadow: '0 2px 8px rgba(139,92,246,0.06)', border: '1px solid #ede9fe',
        }}>
          {/* Category tab bar */}
          <div style={{
            display: 'flex', gap: 0,
            background: 'rgba(139,92,246,0.06)', borderRadius: 12,
            overflow: 'hidden', marginBottom: 10,
          }}>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)} style={{
                flex: 1, padding: '8px 0',
                background: activeCategory === cat.id
                  ? 'rgba(168,85,247,0.15)' : 'transparent',
                border: 'none',
                borderBottom: activeCategory === cat.id
                  ? '2px solid #a855f7' : '2px solid transparent',
                color: activeCategory === cat.id ? '#a855f7' : '#94a3b8',
                fontSize: 10, fontWeight: activeCategory === cat.id ? 700 : 400,
                cursor: 'pointer', transition: 'all 0.2s',
              }}>
                <div style={{ fontSize: 16 }}>{cat.icon}</div>
                <div>{cat.label}</div>
              </button>
            ))}
          </div>

          {/* Lip palette */}
          {activeCategory === 'lip' && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
              {LIP_COLORS.map(c => (
                <div key={c} onClick={() => setLipColor(c)} style={{
                  width: 32, height: 32, borderRadius: '50%', background: c, cursor: 'pointer',
                  border: lipColor === c ? '3px solid #a855f7' : '2px solid rgba(139,92,246,0.15)',
                  boxShadow: lipColor === c ? '0 0 10px rgba(168,85,247,0.3)' : 'none',
                  transition: 'all 0.2s',
                }}/>
              ))}
            </div>
          )}

          {/* Cheek palette */}
          {activeCategory === 'cheek' && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              {CHEEK_COLORS.map(c => (
                <div key={c} onClick={() => setCheekColor(c)} style={{
                  width: 32, height: 32, borderRadius: '50%', background: c, cursor: 'pointer',
                  border: cheekColor === c ? '3px solid #a855f7' : '2px solid rgba(139,92,246,0.15)',
                  transition: 'all 0.2s',
                }}/>
              ))}
            </div>
          )}

          {/* Glasses items */}
          {activeCategory === 'glasses' && (
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
              {GLASSES_ITEMS.map(item => (
                <button key={item.id} onClick={() => setSelectedGlasses(item.id)} style={{
                  padding: '6px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                  background: selectedGlasses === item.id
                    ? 'rgba(168,85,247,0.15)' : 'rgba(139,92,246,0.04)',
                  border: selectedGlasses === item.id
                    ? '2px solid #a855f7' : '1px solid #ede9fe',
                  color: selectedGlasses === item.id ? '#a855f7' : '#64748b',
                  cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                  transition: 'all 0.2s',
                }}>
                  {item.emoji} {item.name}
                </button>
              ))}
            </div>
          )}

          {/* Earring items */}
          {activeCategory === 'earring' && (
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
              {EARRING_ITEMS.map(item => (
                <button key={item.id} onClick={() => setSelectedEarring(item.id)} style={{
                  padding: '6px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                  background: selectedEarring === item.id
                    ? 'rgba(168,85,247,0.15)' : 'rgba(139,92,246,0.04)',
                  border: selectedEarring === item.id
                    ? '2px solid #a855f7' : '1px solid #ede9fe',
                  color: selectedEarring === item.id ? '#a855f7' : '#64748b',
                  cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                  transition: 'all 0.2s',
                }}>
                  {item.emoji} {item.name}
                </button>
              ))}
            </div>
          )}

          {/* Intensity slider (lip/cheek only) */}
          {(activeCategory === 'lip' || activeCategory === 'cheek') && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>{t('ar.intensity')}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#a855f7' }}>{intensity}%</span>
              </div>
              <input
                type="range" min="0" max="100" value={intensity}
                onChange={e => setIntensity(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#a855f7' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '0 16px', display: 'flex', gap: 8, marginBottom: 8 }}>
        <button onClick={onBack} style={{
          flex: 0.4, padding: 12,
          background: '#f8fafc', border: '1px solid #e2e8f0',
          borderRadius: 14, fontSize: 12, fontWeight: 600,
          color: '#64748b', cursor: 'pointer',
        }}>
          {t('ar.try_another')}
        </button>
        <button onClick={handleDecide} style={{
          flex: 1, padding: 12,
          background: 'linear-gradient(135deg, #a855f7, #ec4899)',
          border: 'none', borderRadius: 14, fontSize: 13, fontWeight: 700,
          color: '#fff', cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(168,85,247,0.25)',
        }}>
          このメイクで決定 ✓
        </button>
      </div>
    </div>
  );
}
