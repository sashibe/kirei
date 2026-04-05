import { useState, useRef, useEffect, useCallback } from 'react';
import Kirari from './Kirari.jsx';
import Bubble from './Bubble.jsx';
import MakeupCanvas from './MakeupCanvas.jsx';
import useCamera from '../hooks/useCamera.js';
import { useT } from '../i18n/index.jsx';
import { GLASSES_ITEMS, EARRING_ITEMS } from '../data/accessories.js';
import { BASE_LOOKS } from '../data/makeupLooks.js';

const CATEGORIES = [
  { id: 'base',    labelKey: 'ar.cat_base',    icon: '🧴' },
  { id: 'lip',     labelKey: 'ar.cat_lip',     icon: '💄' },
  { id: 'cheek',   labelKey: 'ar.cat_cheek',   icon: '🌸' },
  { id: 'glasses', labelKey: 'ar.cat_glasses', icon: '👓' },
  { id: 'earring', labelKey: 'ar.cat_earring', icon: '💍' },
];

export default function ArTryOnScreen({ baseLook, colorLook, onDecide, onBack }) {
  const { t } = useT();
  const [intensity, setIntensity] = useState(70);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [showMesh, setShowMesh] = useState(false);
  const [videoAspect, setVideoAspect] = useState(null);
  const [activeCategory, setActiveCategory] = useState('base');
  const [selectedBase, setSelectedBase] = useState(baseLook?.id ?? 'clean-natural');
  const [lipColor, setLipColor] = useState(colorLook?.lip || '#e8607c');
  const [cheekColor, setCheekColor] = useState(colorLook?.cheek || 'rgba(232,96,124,0.4)');
  const [selectedGlasses, setSelectedGlasses] = useState('none');
  const [selectedEarring, setSelectedEarring] = useState('none');

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

  const currentBase = BASE_LOOKS.find(l => l.id === selectedBase) ?? baseLook;
  const activeColorLook = {
    ...colorLook,
    lip: lipColor,
    cheek: cheekColor,
    eyeshadow: colorLook?.eyeshadow || 'rgba(232,150,120,0.2)',
  };

  const opacityFactor = intensity / 100;
  const eyeshadowColor = colorLook?.eyeshadow || 'rgba(232,150,120,0.2)';
  const baseColor = currentBase?.base || '#e8d8c8';
  const concealerColor = currentBase?.concealer;
  const browColor = currentBase?.brow;

  const glassesItem = GLASSES_ITEMS.find(i => i.id === selectedGlasses);
  const earringItem = EARRING_ITEMS.find(i => i.id === selectedEarring);

  const baseName = currentBase?.name
    ? (typeof currentBase.name === 'object' ? t(currentBase.name) : currentBase.name)
    : '';
  const colorName = colorLook?.name
    ? (typeof colorLook.name === 'object' ? t(colorLook.name) : colorLook.name)
    : t('ar.look_fallback');

  const handleDecide = () => {
    const video = videoRef.current;
    const arCanvas = canvasRef.current;

    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = video.videoWidth || 640;
    captureCanvas.height = video.videoHeight || 480;
    const cctx = captureCanvas.getContext('2d');

    cctx.save();
    cctx.translate(captureCanvas.width, 0);
    cctx.scale(-1, 1);
    cctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
    cctx.restore();

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
      baseLook: currentBase,
      colorLook: { ...colorLook, lip: lipColor, cheek: cheekColor },
      products: [
        ...(currentBase?.products || []),
        ...(colorLook?.products || []),
        ...accessoryProducts,
      ],
    });
  };

  const LIP_COLORS = ['#e8607c','#c05070','#d4826a','#b85050','#cf6080','#e07070'];
  const CHEEK_COLORS = [
    'rgba(232,96,124,0.4)',
    'rgba(255,150,100,0.4)',
    'rgba(200,160,200,0.4)',
    'rgba(255,180,120,0.4)',
  ];

  return (
    <div style={{ padding: '12px 0' }}>
      <button onClick={onBack} style={{
        background: 'none', border: 'none', fontSize: 13, color: '#94a3b8',
        cursor: 'pointer', padding: '0 16px 8px', fontWeight: 600,
      }}>
        {'<'} {t('ar.back_to_looks')}
      </button>

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
            baseLook={currentBase}
            colorLook={activeColorLook}
            intensity={intensity}
            showMesh={showMesh}
            glassesItem={glassesItem}
            earringItem={earringItem}
          />
        )}

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
              <ellipse cx="100" cy="120" rx="60" ry="70" fill={baseColor} opacity={opacityFactor * 0.15} style={{ mixBlendMode: 'softLight' }}/>
              {concealerColor && (
                <>
                  <ellipse cx="75" cy="115" rx="12" ry="6" fill={concealerColor} opacity={opacityFactor * 0.3}/>
                  <ellipse cx="125" cy="115" rx="12" ry="6" fill={concealerColor} opacity={opacityFactor * 0.3}/>
                </>
              )}
              <ellipse cx="75" cy="100" rx="16" ry="10" fill={eyeshadowColor} opacity={opacityFactor * 0.8}/>
              <ellipse cx="125" cy="100" rx="16" ry="10" fill={eyeshadowColor} opacity={opacityFactor * 0.8}/>
              <ellipse cx="60" cy="135" rx="18" ry="14" fill={cheekColor} opacity={opacityFactor}/>
              <ellipse cx="140" cy="135" rx="18" ry="14" fill={cheekColor} opacity={opacityFactor}/>
              <path d="M85 155 Q100 148 115 155 Q108 165 100 167 Q92 165 85 155 Z" fill={lipColor} opacity={opacityFactor * 0.85}/>
            </svg>
          </div>
        )}

        <div style={{
          position: 'absolute', top: 12, left: 12,
          background: cameraLive ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(8px)',
          borderRadius: 12, padding: '6px 12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          maxWidth: '60%',
        }}>
          {baseName && (
            <p style={{
              fontSize: 9, margin: '0 0 1px',
              color: cameraLive ? 'rgba(255,255,255,0.6)' : '#94a3b8',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {baseName}
            </p>
          )}
          <p style={{
            fontSize: 11, fontWeight: 700, margin: 0,
            color: cameraLive ? '#fff' : '#a855f7',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {colorName}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '0 16px 10px' }}>
        <Kirari size={32} expression="sparkle" />
        <Bubble>
          <p style={{ fontSize: 12, color: '#334155', margin: 0, lineHeight: 1.6 }}>
            {t('ar.color_comment', { name: colorName })}
          </p>
        </Bubble>
      </div>

      <div style={{ padding: '0 16px', marginBottom: 10 }}>
        <div style={{
          background: '#fff', borderRadius: 16, padding: '10px 12px',
          boxShadow: '0 2px 8px rgba(139,92,246,0.06)', border: '1px solid #ede9fe',
        }}>
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
                <div>{t(cat.labelKey)}</div>
              </button>
            ))}
          </div>

          {activeCategory === 'base' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {BASE_LOOKS.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedBase(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 10,
                    background: selectedBase === item.id
                      ? 'rgba(168,85,247,0.12)' : 'rgba(139,92,246,0.04)',
                    border: selectedBase === item.id
                      ? '2px solid #a855f7' : '1px solid #ede9fe',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: item.base || item.brow || '#e8d8c8',
                    border: '1.5px solid rgba(0,0,0,0.06)', flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#334155', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t(item.name)}
                    </p>
                    <p style={{ fontSize: 10, color: '#94a3b8', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t(item.desc)}
                    </p>
                  </div>
                  {selectedBase === item.id && (
                    <span style={{ fontSize: 16, color: '#a855f7', flexShrink: 0 }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          )}

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
          {t('ar.decide')}
        </button>
      </div>
    </div>
  );
}
