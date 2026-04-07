import { useState, useRef, useEffect, useCallback } from 'react';
import Kirari from './Kirari.jsx';
import MakeupCanvas from './MakeupCanvas.jsx';
import useCamera from '../hooks/useCamera.js';
import { useT } from '../i18n/index.jsx';
import { GLASSES_ITEMS, EARRING_ITEMS, CONTACT_LENS_ITEMS } from '../data/accessories.js';
import { BASE_LOOKS } from '../data/makeupLooks.js';
import { PRODUCTS } from '../data/products.js';

// Vite: import all product images from assets/products/
const productImages = import.meta.glob('../assets/products/*.jpg', { eager: true, query: '?url', import: 'default' });
function getProductImage(product) {
  if (product.localImage) {
    const key = `../assets/products/${product.localImage}`;
    if (productImages[key]) return productImages[key];
  }
  return product.image || '';
}

const CATEGORIES = [
  { id: 'base',      labelKey: 'ar.cat_base',      icon: '\uD83E\uDDF4' },
  { id: 'lip',       labelKey: 'ar.cat_lip',       icon: '\uD83D\uDC84' },
  { id: 'eyeshadow', labelKey: 'ar.cat_eyeshadow', icon: '\u2728' },
  { id: 'cheek',     labelKey: 'ar.cat_cheek',     icon: '\uD83C\uDF38' },
  { id: 'contacts',  labelKey: 'ar.cat_contacts',  icon: '\uD83D\uDC41\uFE0F' },
  { id: 'glasses',   labelKey: 'ar.cat_glasses',   icon: '\uD83D\uDC53' },
  { id: 'earring',   labelKey: 'ar.cat_earring',   icon: '\uD83D\uDC8D' },
  { id: 'lashes',    labelKey: 'ar.cat_lashes',    icon: '\uD83E\uDEF6', comingSoon: true },
];

const LIP_COLORS = ['#e8607c','#c05070','#d4826a','#b85050','#cf6080','#e07070'];
const EYESHADOW_COLORS = [
  'rgba(196,149,106,0.25)', 'rgba(232,150,122,0.25)', 'rgba(200,162,200,0.25)',
  'rgba(139,69,19,0.20)',   'rgba(210,105,30,0.20)',  'rgba(75,0,130,0.20)',
  'rgba(128,128,128,0.20)', 'rgba(30,30,46,0.20)',
];
const CHEEK_COLORS = [
  'rgba(232,96,124,0.4)',
  'rgba(255,150,100,0.4)',
  'rgba(200,160,200,0.4)',
  'rgba(255,180,120,0.4)',
];

// Horizontal scroll style for color palettes (Bug⑧)
const SCROLL_ROW = {
  display: 'flex', gap: 8, flexWrap: 'nowrap',
  overflowX: 'auto', padding: '4px 2px',
  scrollbarWidth: 'none', msOverflowStyle: 'none',
  WebkitOverflowScrolling: 'touch',
};

export default function ArTryOnScreen({ baseLook, colorLook, onDecide, onBack }) {
  const { t } = useT();
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [showMesh, setShowMesh] = useState(false);
  const [activeCategory, setActiveCategory] = useState('base');

  // Per-category intensity (independent sliders) — must be after activeCategory
  const [intensities, setIntensities] = useState({ base: 70, lip: 70, eyeshadow: 70, cheek: 70, contacts: 70 });
  const intensity = intensities[activeCategory] ?? 70;
  const setIntensity = useCallback((val) => {
    setIntensities(prev => ({ ...prev, [activeCategory]: val }));
  }, [activeCategory]);
  const globalIntensity = Math.round(Object.values(intensities).reduce((a, b) => a + b, 0) / Object.keys(intensities).length);
  const [selectedBase, setSelectedBase] = useState(baseLook?.id ?? 'clean-natural');
  const [lipColor, setLipColor] = useState(colorLook?.lip || '#e8607c');
  const [cheekColor, setCheekColor] = useState(colorLook?.cheek || 'rgba(232,96,124,0.4)');
  const [eyeshadowColor, setEyeshadowColor] = useState(colorLook?.eyeshadow || 'rgba(196,149,106,0.25)');
  const [selectedGlasses, setSelectedGlasses] = useState('none');
  const [selectedEarring, setSelectedEarring] = useState('none');
  const [selectedContactLens, setSelectedContactLens] = useState('none');
  const [beforeAfter, setBeforeAfter] = useState(false);
  const [panelHeight, setPanelHeight] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);

  // Reset product/color selection when switching categories
  const handleCategoryChange = useCallback((catId) => {
    setActiveCategory(catId);
    setSelectedProduct(null);
    setSelectedColor(null);
  }, []);

  const canvasRef = useRef(null);
  const panelRef = useRef(null);
  const { videoRef, isActive, error: cameraError } = useCamera({ enabled: true });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlaying = () => setVideoPlaying(true);
    if (video.readyState >= 2) { onPlaying(); return; }
    video.addEventListener('loadeddata', onPlaying);
    return () => video.removeEventListener('loadeddata', onPlaying);
  }, [isActive, videoRef]);

  // Panel height observer for kirari positioning
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => setPanelHeight(entries[0].contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const getVideo = useCallback(() => videoRef.current, [videoRef]);
  const cameraLive = isActive && !cameraError && videoPlaying;

  const currentBase = BASE_LOOKS.find(l => l.id === selectedBase) ?? baseLook;
  const activeColorLook = {
    ...colorLook,
    lip: lipColor,
    cheek: cheekColor,
    eyeshadow: eyeshadowColor,
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
        ? [{ emoji: glassesItem.emoji, name: glassesItem.name, shade: glassesItem.shape || '', price: glassesItem.price, category: 'glasses' }] : []),
      ...(earringItem && earringItem.id !== 'none'
        ? [{ emoji: earringItem.emoji, name: earringItem.name, shade: earringItem.type || '', price: earringItem.price, category: 'earring' }] : []),
      ...(contactLensItem && contactLensItem.id !== 'none'
        ? [{ emoji: contactLensItem.emoji, name: contactLensItem.name, shade: '', price: contactLensItem.price, category: 'contacts' }] : []),
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

  // Apply color from product selection to AR
  const applyColor = useCallback((category, hex) => {
    if (category === 'lip') setLipColor(hex);
    else if (category === 'eyeshadow') setEyeshadowColor(`rgba(${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)},0.25)`);
    else if (category === 'cheek') setCheekColor(`rgba(${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)},0.4)`);
    else if (category === 'contacts') {
      const item = CONTACT_LENS_ITEMS.find(i => i.color === hex) || { id: 'custom', color: hex };
      setSelectedContactLens(item.id);
    }
  }, []);

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      background: '#000', overflow: 'hidden',
    }}>

      {/* Video: objectFit cover fills container */}
      <video
        ref={videoRef}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)',
          display: cameraLive ? 'block' : 'none',
        }}
        playsInline muted autoPlay
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />

      {/* AR Canvas: sized to match objectFit:cover positioning */}
      {cameraLive && !beforeAfter && (
        <MakeupCanvas
          ref={canvasRef}
          getVideo={getVideo}
          baseLook={currentBase}
          colorLook={activeColorLook}
          intensity={globalIntensity}
          showMesh={showMesh}
          glassesItem={glassesItem}
          earringItem={earringItem}
          contactLensItem={contactLensItem}
          coverFit
        />
      )}

      {/* Before/After indicator */}
      {beforeAfter && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          borderRadius: 16, padding: '10px 20px',
          color: '#fff', fontSize: 14, fontWeight: 700,
          pointerEvents: 'none', zIndex: 5,
        }}>
          Before
        </div>
      )}

      {/* Placeholder when camera not live */}
      {!cameraLive && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(180deg, #1a1025 0%, #0f0a1a 100%)',
        }}>
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>{'\uD83D\uDCF7'}</div>
            <p style={{ fontSize: 13 }}>Loading camera...</p>
          </div>
        </div>
      )}

      {/* Top-left: Look name label */}
      <div style={{
        position: 'absolute', top: 12, left: 12,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)',
        borderRadius: 12, padding: '6px 12px',
        maxWidth: '55%', zIndex: 2,
      }}>
        {baseName && (
          <p style={{ fontSize: 9, margin: '0 0 1px', color: 'rgba(255,255,255,0.6)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {baseName}
          </p>
        )}
        <p style={{ fontSize: 12, fontWeight: 700, margin: 0, color: '#fff',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {colorName}
        </p>
      </div>

      {/* Top-right: Mesh toggle */}
      {cameraLive && (
        <button onClick={() => setShowMesh(v => !v)} style={{
          position: 'absolute', top: 12, right: 12,
          background: showMesh ? 'rgba(168,85,247,0.7)' : 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(8px)',
          border: showMesh ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.2)',
          borderRadius: 10, padding: '5px 10px',
          fontSize: 10, fontWeight: 600, color: '#fff', cursor: 'pointer', zIndex: 2,
        }}>
          {showMesh ? '\u25C9 Mesh ON' : '\u25CB Mesh'}
        </button>
      )}

      {/* Back button */}
      <button onClick={onBack} style={{
        position: 'absolute', top: 48, left: 12,
        background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)',
        border: 'none', borderRadius: 20, color: '#fff',
        padding: '6px 14px', fontSize: 13, cursor: 'pointer',
        fontWeight: 600, zIndex: 2,
      }}>
        {'\u2190'} {t('ar.back_to_looks')}
      </button>

      {/* Kirari bubble (above panel) */}
      <div style={{
        position: 'absolute', bottom: panelHeight + 8, left: 12, right: 12,
        transition: 'bottom 0.2s ease',
        background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
        borderRadius: 16, padding: '8px 12px',
        display: 'flex', alignItems: 'center', gap: 8, zIndex: 2,
      }}>
        <Kirari size={28} expression="sparkle" />
        <p style={{ fontSize: 12, color: '#334155', margin: 0, lineHeight: 1.5, flex: 1 }}>
          {beforeAfter
            ? (t('ar.before_after_hint') || '\u9577\u62BC\u3057\u3067\u7D20\u9854\u3068\u6BD4\u3079\u3089\u308C\u308B\u3088\u2728')
            : t('ar.color_comment', { name: colorName })}
        </p>
      </div>

      {/* Bottom panel overlay */}
      <div ref={panelRef} style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)',
        borderRadius: '20px 20px 0 0',
        maxHeight: '35vh', overflowY: 'auto',
        zIndex: 3,
      }}>
        {/* Category tabs */}
        <div style={{
          display: 'flex', gap: 0,
          borderBottom: '1px solid #ede9fe',
          position: 'sticky', top: 0, background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(8px)', zIndex: 1,
        }}>
          {CATEGORIES.map(cat => (
            <button key={cat.id}
              onClick={() => !cat.comingSoon && handleCategoryChange(cat.id)}
              style={{
                flex: 1, padding: '8px 2px', minWidth: 0,
                background: activeCategory === cat.id ? 'rgba(168,85,247,0.1)' : 'transparent',
                border: 'none',
                borderBottom: activeCategory === cat.id ? '2.5px solid #a855f7' : '2.5px solid transparent',
                color: cat.comingSoon ? '#cbd5e1' : activeCategory === cat.id ? '#a855f7' : '#94a3b8',
                fontSize: 9, fontWeight: activeCategory === cat.id ? 700 : 400,
                cursor: cat.comingSoon ? 'default' : 'pointer',
                opacity: cat.comingSoon ? 0.5 : 1, position: 'relative',
              }}>
              <div style={{ fontSize: 14 }}>{cat.icon}</div>
              <div>{t(cat.labelKey)}</div>
              {cat.comingSoon && (
                <span style={{
                  position: 'absolute', top: 2, right: 2,
                  fontSize: 7, background: '#a855f7', color: '#fff',
                  borderRadius: 4, padding: '1px 3px', fontWeight: 700,
                }}>SOON</span>
              )}
            </button>
          ))}
        </div>

        {/* Category content */}
        <div style={{ padding: '10px 14px 12px' }}>
          {activeCategory === 'base' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {BASE_LOOKS.map(item => (
                <button key={item.id} onClick={() => setSelectedBase(item.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 10,
                  background: selectedBase === item.id ? 'rgba(168,85,247,0.12)' : 'rgba(139,92,246,0.04)',
                  border: selectedBase === item.id ? '2px solid #a855f7' : '1px solid #ede9fe',
                  cursor: 'pointer', textAlign: 'left',
                }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: item.base || item.brow || '#e8d8c8', border: '1.5px solid rgba(0,0,0,0.06)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#334155', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t(item.name)}</p>
                    <p style={{ fontSize: 10, color: '#94a3b8', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t(item.desc)}</p>
                  </div>
                  {selectedBase === item.id && <span style={{ fontSize: 16, color: '#a855f7', flexShrink: 0 }}>{'\u2713'}</span>}
                </button>
              ))}
            </div>
          )}

          {/* 3-layer product UI for lip/eyeshadow/cheek/contacts */}
          {['lip', 'eyeshadow', 'cheek', 'contacts'].includes(activeCategory) && (
            <ProductLayer
              category={activeCategory}
              selectedProduct={selectedProduct}
              selectedColor={selectedColor}
              intensity={intensity}
              onSelectProduct={(p) => {
                setSelectedProduct(p);
                const dc = p.colors[0];
                if (dc) {
                  setSelectedColor(dc);
                  applyColor(activeCategory, dc.hex);
                }
              }}
              onSelectColor={(c) => {
                setSelectedColor(c);
                applyColor(activeCategory, c.hex);
              }}
              onIntensityChange={setIntensity}
            />
          )}

          {activeCategory === 'glasses' && (
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
              {GLASSES_ITEMS.map(item => (
                <button key={item.id} onClick={() => setSelectedGlasses(item.id)} style={{
                  padding: '6px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                  background: selectedGlasses === item.id ? 'rgba(168,85,247,0.15)' : 'rgba(139,92,246,0.04)',
                  border: selectedGlasses === item.id ? '2px solid #a855f7' : '1px solid #ede9fe',
                  color: selectedGlasses === item.id ? '#a855f7' : '#64748b',
                  cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                }}>{item.emoji} {item.name}</button>
              ))}
            </div>
          )}

          {activeCategory === 'earring' && (
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
              {EARRING_ITEMS.map(item => (
                <button key={item.id} onClick={() => setSelectedEarring(item.id)} style={{
                  padding: '6px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                  background: selectedEarring === item.id ? 'rgba(168,85,247,0.15)' : 'rgba(139,92,246,0.04)',
                  border: selectedEarring === item.id ? '2px solid #a855f7' : '1px solid #ede9fe',
                  color: selectedEarring === item.id ? '#a855f7' : '#64748b',
                  cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                }}>{item.emoji} {item.name}</button>
              ))}
            </div>
          )}

          {false && ( // Removed: per-category slider is now inside ProductLayer
            <div />
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={onBack} style={{
              flex: '0 0 auto', padding: '10px 16px',
              background: 'transparent', border: '1px solid #e2e8f0',
              borderRadius: 14, fontSize: 12, fontWeight: 600,
              color: '#64748b', cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
              {t('ar.try_another')}
            </button>
            <button onClick={handleDecide} style={{
              flex: 1, padding: '10px 16px',
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              border: 'none', borderRadius: 14, fontSize: 13, fontWeight: 700,
              color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap',
              boxShadow: '0 4px 16px rgba(168,85,247,0.25)',
            }}>
              {t('ar.decide')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// === 3-Layer Product UI ===
function ProductLayer({ category, selectedProduct, selectedColor, intensity, onSelectProduct, onSelectColor, onIntensityChange }) {
  const categoryProducts = PRODUCTS.filter(p => p.category === category);
  if (categoryProducts.length === 0) return <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: 8 }}>Coming soon</div>;

  return (
    <div>
      {/* Layer 2: Product cards (horizontal scroll) */}
      <div style={{
        display: 'flex', overflowX: 'auto', gap: 10, padding: '0 2px 8px',
        scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-x',
      }}>
        {categoryProducts.map(product => (
          <div key={product.id} onClick={() => onSelectProduct(product)} style={{
            flexShrink: 0, width: 72, cursor: 'pointer',
            opacity: selectedProduct?.id === product.id ? 1 : 0.6,
            transition: 'all 0.15s ease',
          }}>
            {getProductImage(product) ? (
              <div style={{
                width: 72, height: 72, borderRadius: 12, overflow: 'hidden',
                border: selectedProduct?.id === product.id ? '2px solid #a855f7' : '2px solid #ede9fe',
              }}>
                <img src={getProductImage(product)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : (
              <div style={{
                width: 72, height: 72, borderRadius: 12,
                background: `linear-gradient(135deg, ${product.baseColor}40, ${product.baseColor}20)`,
                border: selectedProduct?.id === product.id ? '2px solid #a855f7' : '2px solid #ede9fe',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ display: 'flex', gap: 2 }}>
                  {product.colors.slice(0, 3).map(c => (
                    <div key={c.id} style={{ width: 14, height: 14, borderRadius: '50%', background: c.hex }} />
                  ))}
                </div>
              </div>
            )}
            <p style={{ fontSize: 9, fontWeight: 600, marginTop: 3, color: '#334155',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {product.name}
            </p>
            <p style={{ fontSize: 9, color: '#a855f7', fontWeight: 700, margin: 0 }}>
              {'\u00A5'}{product.price.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Layer 3: Color palette + slider */}
      {selectedProduct && selectedProduct.colors.length > 0 && (
        <div style={{ borderTop: '1px solid #f1f0ff', paddingTop: 8 }}>
          <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 6px', fontWeight: 600 }}>
            {selectedProduct.name}
          </p>
          <div style={{
            display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4,
            scrollbarWidth: 'none', touchAction: 'pan-x',
          }}>
            {selectedProduct.colors.map(color => (
              <div key={color.id} onClick={() => onSelectColor(color)} title={color.name} style={{
                flexShrink: 0, width: 32, height: 32, borderRadius: '50%',
                background: color.hex, cursor: 'pointer',
                border: selectedColor?.id === color.id ? '3px solid #a855f7' : '2px solid rgba(139,92,246,0.15)',
                boxShadow: selectedColor?.id === color.id ? '0 0 10px rgba(168,85,247,0.4)' : 'none',
                transition: 'all 0.15s',
              }} />
            ))}
          </div>
          {selectedColor && (
            <p style={{ fontSize: 9, color: '#94a3b8', margin: '4px 0 0' }}>{selectedColor.name}</p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <span style={{ fontSize: 10, color: '#64748b', whiteSpace: 'nowrap', fontWeight: 600 }}>
              {'\u6FC3\u3055'}
            </span>
            <input type="range" min={0} max={100} value={intensity}
              onChange={e => onIntensityChange(Number(e.target.value))}
              style={{ flex: 1, accentColor: '#a855f7' }}
            />
            <span style={{ fontSize: 11, color: '#a855f7', fontWeight: 700, minWidth: 28 }}>
              {intensity}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
