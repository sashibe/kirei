import { useState, useRef, useEffect, useCallback } from 'react';
import Kirari from './Kirari.jsx';
import MakeupCanvas from './MakeupCanvas.jsx';
import useCamera from '../hooks/useCamera.js';
import { useT } from '../i18n/index.jsx';
import { GLASSES_ITEMS, EARRING_ITEMS, CONTACT_LENS_ITEMS } from '../data/accessories.js';
import { BASE_LOOKS } from '../data/makeupLooks.js';

const CATEGORIES = [
  { id: 'base',    labelKey: 'ar.cat_base',    icon: '\uD83E\uDDF4' },
  { id: 'lip',     labelKey: 'ar.cat_lip',     icon: '\uD83D\uDC84' },
  { id: 'cheek',   labelKey: 'ar.cat_cheek',   icon: '\uD83C\uDF38' },
  { id: 'contacts', labelKey: 'ar.cat_contacts', icon: '\uD83D\uDC41\uFE0F' },
  { id: 'glasses', labelKey: 'ar.cat_glasses', icon: '\uD83D\uDC53' },
  { id: 'earring', labelKey: 'ar.cat_earring', icon: '\uD83D\uDC8D' },
  { id: 'lashes',  labelKey: 'ar.cat_lashes',  icon: '\u2728', comingSoon: true },
];

const LIP_COLORS = ['#e8607c','#c05070','#d4826a','#b85050','#cf6080','#e07070'];
const CHEEK_COLORS = [
  'rgba(232,96,124,0.4)',
  'rgba(255,150,100,0.4)',
  'rgba(200,160,200,0.4)',
  'rgba(255,180,120,0.4)',
];

/**
 * Compute CSS width/height to fit video inside viewport while preserving aspect ratio.
 * Uses CSS vw/vh units so it works without JS resize listeners.
 */
function fitVideoStyle(vw, vh) {
  // Aspect ratio of the video
  const aspect = vw / vh;
  // Use CSS max() equivalent via both constraints
  // If viewport is wider than video: height=100vh, width=100vh*aspect
  // If viewport is taller than video: width=100vw, height=100vw/aspect
  return {
    width: `min(100vw, ${100 * aspect}vh)`,
    height: `min(100vh, ${100 / aspect}vw)`,
    maxWidth: '100vw',
    maxHeight: '100vh',
  };
}

export default function ArTryOnScreen({ baseLook, colorLook, onDecide, onBack }) {
  const { t } = useT();
  const [intensity, setIntensity] = useState(70);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [showMesh, setShowMesh] = useState(false);
  const [activeCategory, setActiveCategory] = useState('base');
  const [selectedBase, setSelectedBase] = useState(baseLook?.id ?? 'clean-natural');
  const [lipColor, setLipColor] = useState(colorLook?.lip || '#e8607c');
  const [cheekColor, setCheekColor] = useState(colorLook?.cheek || 'rgba(232,96,124,0.4)');
  const [selectedGlasses, setSelectedGlasses] = useState('none');
  const [selectedEarring, setSelectedEarring] = useState('none');
  const [selectedContactLens, setSelectedContactLens] = useState('none');
  const [beforeAfter, setBeforeAfter] = useState(false);
  const [videoSize, setVideoSize] = useState(null); // { vw, vh }

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const { videoRef, isActive, error: cameraError } = useCamera({ enabled: true });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlaying = () => {
      setVideoPlaying(true);
      setVideoSize({ vw: video.videoWidth, vh: video.videoHeight });
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

  const glassesItem = GLASSES_ITEMS.find(i => i.id === selectedGlasses);
  const earringItem = EARRING_ITEMS.find(i => i.id === selectedEarring);
  const contactLensItem = CONTACT_LENS_ITEMS.find(i => i.id === selectedContactLens);

  const baseName = currentBase?.name
    ? (typeof currentBase.name === 'object' ? t(currentBase.name) : currentBase.name)
    : '';
  const colorName = colorLook?.name
    ? (typeof colorLook.name === 'object' ? t(colorLook.name) : colorLook.name)
    : t('ar.look_fallback');

  // Long-press before/after
  const handlePointerDown = useCallback(() => setBeforeAfter(true), []);
  const handlePointerUp = useCallback(() => setBeforeAfter(false), []);

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
      ...(contactLensItem && contactLensItem.id !== 'none'
        ? [{ emoji: contactLensItem.emoji, name: contactLensItem.name,
             shade: '', price: contactLensItem.price,
             category: 'contacts' }]
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

  return (
    <div style={{
      position: 'fixed', inset: 0,
      width: '100vw', height: '100vh',
      background: '#000', overflow: 'hidden',
      zIndex: 100,
    }}>

      {/* Camera + Canvas wrapper — aspect-ratio-locked so both align */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div style={{
          position: 'relative',
          width: videoSize ? undefined : '100%',
          height: videoSize ? undefined : '100%',
          ...(videoSize ? fitVideoStyle(videoSize.vw, videoSize.vh) : {}),
        }}>
          <video
            ref={videoRef}
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)',
              display: cameraLive ? 'block' : 'none',
            }}
            playsInline muted autoPlay
          />

          {/* AR Canvas overlay — same size as video */}
          {cameraLive && !beforeAfter && (
            <MakeupCanvas
              ref={canvasRef}
              getVideo={getVideo}
              baseLook={currentBase}
              colorLook={activeColorLook}
              intensity={intensity}
              showMesh={showMesh}
              glassesItem={glassesItem}
              earringItem={earringItem}
              contactLensItem={contactLensItem}
            />
          )}
        </div>
      </div>

      {/* Placeholder when camera not live */}
      {!cameraLive && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(180deg, #1a1025 0%, #0f0a1a 100%)',
        }}>
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>{'\uD83D\uDCF7'}</div>
            <p style={{ fontSize: 13 }}>{t('ar.loading_camera') || 'Loading camera...'}</p>
          </div>
        </div>
      )}

      {/* Before/After indicator */}
      {beforeAfter && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          borderRadius: 16, padding: '10px 20px',
          color: '#fff', fontSize: 14, fontWeight: 700,
          pointerEvents: 'none',
        }}>
          Before
        </div>
      )}

      {/* Top-left: Look name label */}
      <div style={{
        position: 'absolute',
        top: 'max(env(safe-area-inset-top, 0px), 12px)', left: 16,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)',
        borderRadius: 12, padding: '6px 12px',
        maxWidth: '55%', zIndex: 2,
      }}>
        {baseName && (
          <p style={{
            fontSize: 9, margin: '0 0 1px',
            color: 'rgba(255,255,255,0.6)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {baseName}
          </p>
        )}
        <p style={{
          fontSize: 12, fontWeight: 700, margin: 0,
          color: '#fff',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {colorName}
        </p>
      </div>

      {/* Top-right: Mesh toggle */}
      {cameraLive && (
        <button
          onClick={() => setShowMesh(v => !v)}
          style={{
            position: 'absolute',
            top: 'max(env(safe-area-inset-top, 0px), 12px)', right: 16,
            background: showMesh ? 'rgba(168,85,247,0.7)' : 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(8px)',
            border: showMesh ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.2)',
            borderRadius: 10, padding: '5px 10px',
            fontSize: 10, fontWeight: 600,
            color: '#fff', cursor: 'pointer',
            zIndex: 2,
          }}
        >
          {showMesh ? '\u25C9 Mesh ON' : '\u25CB Mesh'}
        </button>
      )}

      {/* Back button */}
      <button onClick={onBack} style={{
        position: 'absolute',
        top: 'calc(max(env(safe-area-inset-top, 0px), 12px) + 44px)', left: 16,
        background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)',
        border: 'none', borderRadius: 20, color: '#fff',
        padding: '6px 14px', fontSize: 13, cursor: 'pointer',
        fontWeight: 600, zIndex: 2,
      }}>
        {'\u2190'} {t('ar.back_to_looks')}
      </button>

      {/* Kirari speech bubble (above tab bar) */}
      <div style={{
        position: 'absolute',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 160px)',
        left: 16, right: 16,
        background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
        borderRadius: 16, padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
        zIndex: 2,
      }}>
        <Kirari size={32} expression="sparkle" />
        <p style={{ fontSize: 13, color: '#334155', margin: 0, lineHeight: 1.5, flex: 1 }}>
          {beforeAfter
            ? (t('ar.before_after_hint') || '\u9577\u62BC\u3057\u3067\u7D20\u9854\u3068\u6BD4\u3079\u3089\u308C\u308B\u3088\u2728')
            : t('ar.color_comment', { name: colorName })}
        </p>
      </div>

      {/* Category panel (bottom overlay) */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255,255,255,0.4)',
        borderRadius: '20px 20px 0 0',
        zIndex: 3,
        maxHeight: '40vh',
        overflowY: 'auto',
      }}>
        {/* Category tabs */}
        <div style={{
          display: 'flex', overflowX: 'auto', gap: 0,
          borderBottom: '1px solid #ede9fe',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}>
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} style={{
              flex: 1, padding: '8px 2px', minWidth: 0,
              background: 'transparent', border: 'none',
              borderBottom: activeCategory === cat.id
                ? '2.5px solid #a855f7' : '2.5px solid transparent',
              color: cat.comingSoon ? '#c4b5fd' : (activeCategory === cat.id ? '#a855f7' : '#94a3b8'),
              fontSize: 10, fontWeight: activeCategory === cat.id ? 700 : 400,
              cursor: 'pointer', transition: 'all 0.2s',
              opacity: cat.comingSoon ? 0.6 : 1,
              position: 'relative',
            }}>
              <div style={{ fontSize: 16 }}>{cat.icon}</div>
              <div>{t(cat.labelKey)}</div>
              {cat.comingSoon && (
                <span style={{
                  position: 'absolute', top: 2, right: 2,
                  background: '#a855f7', color: '#fff',
                  fontSize: 7, fontWeight: 700, borderRadius: 4,
                  padding: '1px 3px', lineHeight: 1.2,
                }}>SOON</span>
              )}
            </button>
          ))}
        </div>

        {/* Category content */}
        <div style={{ padding: '10px 16px 12px' }}>
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
                    <span style={{ fontSize: 16, color: '#a855f7', flexShrink: 0 }}>{'\u2713'}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {activeCategory === 'lip' && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', padding: '4px 0' }}>
              {LIP_COLORS.map(c => (
                <div key={c} onClick={() => setLipColor(c)} style={{
                  width: 36, height: 36, borderRadius: '50%', background: c, cursor: 'pointer',
                  border: lipColor === c ? '3px solid #a855f7' : '2px solid rgba(139,92,246,0.15)',
                  boxShadow: lipColor === c ? '0 0 12px rgba(168,85,247,0.4)' : 'none',
                  transition: 'all 0.2s',
                }}/>
              ))}
            </div>
          )}

          {activeCategory === 'cheek' && (
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', padding: '4px 0' }}>
              {CHEEK_COLORS.map(c => (
                <div key={c} onClick={() => setCheekColor(c)} style={{
                  width: 36, height: 36, borderRadius: '50%', background: c, cursor: 'pointer',
                  border: cheekColor === c ? '3px solid #a855f7' : '2px solid rgba(139,92,246,0.15)',
                  transition: 'all 0.2s',
                }}/>
              ))}
            </div>
          )}

          {activeCategory === 'contacts' && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', padding: '4px 0' }}>
              {CONTACT_LENS_ITEMS.map(item => (
                <div key={item.id} onClick={() => setSelectedContactLens(item.id)} style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: item.id === 'none' ? '#e2e8f0' : item.color,
                  cursor: 'pointer',
                  border: selectedContactLens === item.id ? '3px solid #a855f7' : '2px solid rgba(139,92,246,0.15)',
                  boxShadow: selectedContactLens === item.id ? '0 0 12px rgba(168,85,247,0.4)' : 'none',
                  transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, color: item.id === 'none' ? '#94a3b8' : 'transparent',
                }}>
                  {item.id === 'none' && '\u2715'}
                </div>
              ))}
            </div>
          )}

          {activeCategory === 'lashes' && (
            <div style={{
              textAlign: 'center', padding: '16px 0',
              color: '#94a3b8', fontSize: 13,
            }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{'\u2728'}</div>
              <p style={{ margin: 0, fontWeight: 600 }}>{t('ar.coming_soon') || 'Coming Soon'}</p>
              <p style={{ margin: '4px 0 0', fontSize: 11 }}>{t('ar.lashes_hint') || 'WebGL\u79FB\u884C\u5F8C\u306B\u5B9F\u88C5\u4E88\u5B9A'}</p>
            </div>
          )}

          {activeCategory === 'glasses' && (
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
              {GLASSES_ITEMS.map(item => (
                <button key={item.id} onClick={() => setSelectedGlasses(item.id)} style={{
                  padding: '6px 12px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                  background: selectedGlasses === item.id
                    ? 'rgba(168,85,247,0.15)' : 'rgba(139,92,246,0.04)',
                  border: selectedGlasses === item.id
                    ? '2px solid #a855f7' : '1px solid #ede9fe',
                  color: selectedGlasses === item.id ? '#a855f7' : '#64748b',
                  cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
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
                  padding: '6px 12px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                  background: selectedEarring === item.id
                    ? 'rgba(168,85,247,0.15)' : 'rgba(139,92,246,0.04)',
                  border: selectedEarring === item.id
                    ? '2px solid #a855f7' : '1px solid #ede9fe',
                  color: selectedEarring === item.id ? '#a855f7' : '#64748b',
                  cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  {item.emoji} {item.name}
                </button>
              ))}
            </div>
          )}

          {/* Intensity slider for lip/cheek */}
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

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={onBack} style={{
              flex: '0 0 auto', padding: '10px 16px',
              background: 'transparent', border: '1px solid #e2e8f0',
              borderRadius: 14, fontSize: 12, fontWeight: 600,
              color: '#64748b', cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}>
              {'\u2190'} {t('ar.try_another')}
            </button>
            <button onClick={handleDecide} style={{
              flex: 1, padding: '10px 16px',
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              border: 'none', borderRadius: 14, fontSize: 13, fontWeight: 700,
              color: '#fff', cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(168,85,247,0.25)',
              whiteSpace: 'nowrap',
            }}>
              {t('ar.decide')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
