import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Kirari from './Kirari.jsx';
import Bubble from './Bubble.jsx';
import MakeupCanvas from './MakeupCanvas.jsx';
import CartSummaryBar from './CartSummaryBar.jsx';
import useCamera from '../hooks/useCamera.js';
import { useT } from '../i18n/index.jsx';
import { GLASSES_ITEMS, EARRING_ITEMS, CONTACT_LENS_ITEMS } from '../data/accessories.js';
import { BASE_LOOKS } from '../data/makeupLooks.js';
import { PRODUCTS } from '../data/products.js';
import { getSeasonText } from '../analysis/personalColor.js';
import { captureFrame, shareImage, saveImage } from '../utils/share.js';

// 旧仕様（60秒遅延ポップアップ + バッジ）に戻す場合は true に変更
const CART_CONFIRM_POPUP = false;

// 初回peekアニメーション: true で有効、false で無効（復活させる場合は true に）
const ENABLE_PEEK_ANIMATION = false;

// hex '#rrggbb' → 'rgba(r,g,b,a)'
function hexToRgba(hex, a) {
  return `rgba(${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)},${a})`;
}

// ヨイショメッセージ（カテゴリ別・多言語）
function getYoishoMessage(category, lang) {
  const L = (ja, ko, en) => lang === 'ko' ? ko : lang === 'en' ? en : ja;
  const POOLS = {
    lip: [
      L('そのリップ、似合ってる！', '그 립스틱, 잘 어울려!', 'That lip color suits you!'),
      L('その色、顔がパッと明るくなるね！', '그 색깔, 얼굴이 확 밝아지네!', 'That color really brightens your face!'),
      L('いい色♪ 唇が華やかになったよ！', '좋은 색이야♪ 입술이 화사해졌어!', 'Lovely color♪ Your lips look vibrant!'),
    ],
    eyeshadow: [
      L('目元に深みが出ていい感じ♪', '눈에 깊이가 생겨서 좋은 느낌♪', 'Adds such depth to your eyes♪'),
      L('その色、瞳がキラキラして見える！', '그 색, 눈동자가 반짝반짝해 보여!', 'Your eyes sparkle with that shade!'),
      L('アイシャドウで印象が変わったね！', '아이섀도로 인상이 달라졌네!', 'The eyeshadow really changes your look!'),
    ],
    cheek: [
      L('血色感アップ！自然でかわいい♪', '혈색감이 올라갔어! 자연스럽고 귀여워♪', 'Rosy cheeks! So natural and cute♪'),
      L('ほんのりピンクで健康的な感じ♪', '살짝 핑크로 건강한 느낌♪', 'A hint of pink — so healthy-looking♪'),
      L('チークで顔の立体感が出てるよ！', '블러셔로 얼굴에 입체감이 생겼어!', 'The blush adds such nice dimension!'),
    ],
    base: [
      L('肌がトーンアップして透明感あるね！', '피부가 톤업되어서 투명감이 있어!', 'Your skin looks brighter and radiant!'),
      L('ベースメイクで肌がなめらかに見える♪', '베이스 메이크업으로 피부가 매끄럽게 보여♪', 'Foundation makes your skin look so smooth♪'),
    ],
    eyebrow: [
      L('眉が整うと顔全体が引き締まるね！', '눈썹이 정돈되니 얼굴 전체가 조여드네!', 'Neat brows frame your whole face beautifully!'),
      L('ナチュラルな眉、いい感じ♪', '자연스러운 눈썹, 좋은 느낌♪', 'Natural brows look so good on you♪'),
    ],
  };
  const pool = POOLS[category] || POOLS.lip;
  return pool[Math.floor(Math.random() * pool.length)];
}

// デフォルト適用商品（ARページ起動時に自動適用: 各カテゴリ先頭商品）
const _DEFAULT_BASE = PRODUCTS.find(p => p.id === 'lesthemo_10000033');
const _DEFAULT_BASE_COLOR = _DEFAULT_BASE?.colors?.[0] ?? null; // c01 ライト #F5E0CC
const _DEFAULT_LIP = PRODUCTS.find(p => p.category === 'lip');
const _DEFAULT_LIP_COLOR = _DEFAULT_LIP?.colors?.[0] ?? null;
const _DEFAULT_EYESHADOW = PRODUCTS.find(p => p.category === 'eyeshadow');
const _DEFAULT_EYESHADOW_COLOR = _DEFAULT_EYESHADOW?.colors?.[0] ?? null;
const _DEFAULT_EYEBROW = PRODUCTS.find(p => p.category === 'eyebrow');
const _DEFAULT_EYEBROW_COLOR = _DEFAULT_EYEBROW?.colors?.[0] ?? null;
const _DEFAULT_CHEEK = PRODUCTS.find(p => p.category === 'cheek');
const _DEFAULT_CHEEK_COLOR = _DEFAULT_CHEEK?.colors?.[0] ?? null;

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
  { id: 'eyebrow',   labelKey: 'ar.cat_eyebrow',   icon: '\uD83D\uDD8A\uFE0F' },
  { id: 'lashes',    labelKey: 'ar.cat_lashes',    icon: '\u2728' },
  { id: 'cheek',     labelKey: 'ar.cat_cheek',     icon: '\uD83C\uDF38' },
  { id: 'contacts',  labelKey: 'ar.cat_contacts',  icon: '\uD83D\uDC41\uFE0F' },
  { id: 'glasses',   labelKey: 'ar.cat_glasses',   icon: '\uD83D\uDC53' },
  { id: 'earring',   labelKey: 'ar.cat_earring',   icon: '\uD83D\uDC8D' },
];

const SHEET_MIN = 56;
const SHEET_MAX = 400;
const MAKEUP_CATEGORIES = ['lip', 'eyeshadow', 'cheek', 'base', 'eyebrow'];

// i18n text helper
const txt = (v, lang) => (typeof v === 'object' && v !== null) ? (v[lang] ?? v.ja ?? '') : (v ?? '');

// PC連動ソート
function sortByPC(products, season) {
  if (!season) return products;
  return [...products].sort((a, b) => {
    const aMatch = a.season === season ? 1 : 0;
    const bMatch = b.season === season ? 1 : 0;
    return bMatch - aMatch;
  });
}

export default function ArTryOnScreen({ personalColor, cart, onCheckout, onCapture, onBack }) {
  const { t, lang } = useT();
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [showMesh, setShowMesh] = useState(false);
  const [activeCategory, setActiveCategory] = useState('base'); // デフォルト: ベースタブ
  const [sheetOpen, setSheetOpen] = useState(true);             // デフォルト: メニュー開いた状態
  const [justAdded, setJustAdded] = useState(false);
  const [pendingItem, setPendingItem] = useState(null);
  const [hasPendingBadge, setHasPendingBadge] = useState(false);
  const productSelectedAtRef = useRef(null);

  const [selectedBase, setSelectedBase] = useState(null);
  // デフォルト: 各カテゴリ先頭商品をフルメイクプリセットとして自動適用
  const [baseColor, setBaseColor] = useState(_DEFAULT_BASE_COLOR?.hex ?? null);
  const [lipColor, setLipColor] = useState(_DEFAULT_LIP_COLOR?.hex ?? null);
  const [cheekColor, setCheekColor] = useState(_DEFAULT_CHEEK_COLOR ? hexToRgba(_DEFAULT_CHEEK_COLOR.hex, 0.6) : null);
  const [eyeshadowColor, setEyeshadowColor] = useState(_DEFAULT_EYESHADOW_COLOR ? hexToRgba(_DEFAULT_EYESHADOW_COLOR.hex, 0.45) : null);
  const [browColor, setBrowColor] = useState(_DEFAULT_EYEBROW_COLOR?.hex ?? null);
  const [selectedGlasses, setSelectedGlasses] = useState('none');
  const [selectedEarring, setSelectedEarring] = useState('none');
  const [selectedContactLens, setSelectedContactLens] = useState('none');
  const [lashesColor, setLashesColor] = useState(null);
  const [beforeAfter, setBeforeAfter] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(_DEFAULT_BASE ?? null);
  const [selectedColor, setSelectedColor] = useState(_DEFAULT_BASE_COLOR ?? null);
  // カテゴリ別の適用済み商品を追跡: { [category]: { product, selectedColor } }
  const [appliedItems, setAppliedItems] = useState(() => {
    const items = {};
    if (_DEFAULT_BASE && _DEFAULT_BASE_COLOR) items.base = { product: _DEFAULT_BASE, selectedColor: _DEFAULT_BASE_COLOR };
    if (_DEFAULT_LIP && _DEFAULT_LIP_COLOR) items.lip = { product: _DEFAULT_LIP, selectedColor: _DEFAULT_LIP_COLOR };
    if (_DEFAULT_EYESHADOW && _DEFAULT_EYESHADOW_COLOR) items.eyeshadow = { product: _DEFAULT_EYESHADOW, selectedColor: _DEFAULT_EYESHADOW_COLOR };
    if (_DEFAULT_EYEBROW && _DEFAULT_EYEBROW_COLOR) items.eyebrow = { product: _DEFAULT_EYEBROW, selectedColor: _DEFAULT_EYEBROW_COLOR };
    if (_DEFAULT_CHEEK && _DEFAULT_CHEEK_COLOR) items.cheek = { product: _DEFAULT_CHEEK, selectedColor: _DEFAULT_CHEEK_COLOR };
    return items;
  });

  const canvasRef = useRef(null);
  const customContactRef = useRef(null);
  const touchStartY = useRef(0);
  const { videoRef, isActive, error: cameraError } = useCamera({ enabled: true });

  // キラリ ARメッセージ制御
  const [arKirariMsg, setArKirariMsg] = useState(null);
  const [arKirariVisible, setArKirariVisible] = useState(false);
  const kirariHideTimerRef = useRef(null);
  const arMountTimersRef = useRef([]);

  const showKirariMsg = useCallback((msg, duration = 5000) => {
    if (kirariHideTimerRef.current) clearTimeout(kirariHideTimerRef.current);
    setArKirariMsg(msg);
    setArKirariVisible(true);
    kirariHideTimerRef.current = setTimeout(() => setArKirariVisible(false), duration);
  }, []);

  // 起動時 時間差メッセージ: 0.5s→intro / 6s→ヨイショ / 11.5s→操作ガイド
  useEffect(() => {
    const L = (ja, ko, en) => lang === 'ko' ? ko : lang === 'en' ? en : ja;
    const msg0 = L('✨ あなたに似合うメイクをセットしてみたよ♪', '✨ 어울리는 메이크업을 세팅해 봤어♪', '✨ I set up a makeup look that suits you♪');
    const msg2 = L('他のアイテムも試せるよ！メニューをタップしてね♪', '다른 아이템도 시도해 봐! 메뉴를 탭해 봐♪', 'Try other items too! Tap the menu♪');
    const cats = ['lip', 'eyeshadow', 'cheek', 'base', 'eyebrow'];
    const yoishoMsg = getYoishoMessage(cats[Math.floor(Math.random() * cats.length)], lang);

    const DISPLAY = 5000; // ミラー画面と同じ5秒表示
    const GAP = 500;      // メッセージ間のギャップ
    const t0 = setTimeout(() => showKirariMsg(msg0, DISPLAY), 500);
    const t1 = setTimeout(() => showKirariMsg(yoishoMsg, DISPLAY), 500 + DISPLAY + GAP);
    const t2 = setTimeout(() => showKirariMsg(msg2, DISPLAY), 500 + (DISPLAY + GAP) * 2);
    const t3 = setTimeout(() => setArKirariMsg(null), 500 + (DISPLAY + GAP) * 3);
    arMountTimersRef.current = [t0, t1, t2, t3];
    return () => arMountTimersRef.current.forEach(clearTimeout);
  }, [showKirariMsg]); // showKirariMsg は安定（[] deps useCallback）

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlaying = () => setVideoPlaying(true);
    if (video.readyState >= 2) { onPlaying(); return; }
    video.addEventListener('loadeddata', onPlaying);
    return () => video.removeEventListener('loadeddata', onPlaying);
  }, [isActive, videoRef]);

  // peek animation: 初回のみ、0.5秒後にシートを開いて1.5秒見せてから閉じる
  // ENABLE_PEEK_ANIMATION = true で復活
  useEffect(() => {
    if (!ENABLE_PEEK_ANIMATION) return;
    if (sessionStorage.getItem('ar_peek_shown_v3')) return;
    let t2;
    const t1 = setTimeout(() => {
      setSheetOpen(true);
      t2 = setTimeout(() => {
        setSheetOpen(false);
        sessionStorage.setItem('ar_peek_shown_v3', '1');
      }, 1500);
    }, 500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const getVideo = useCallback(() => videoRef.current, [videoRef]);
  const cameraLive = isActive && !cameraError && videoPlaying;

  const currentBase = selectedBase
    ? (BASE_LOOKS.find(l => l.id === selectedBase) ?? BASE_LOOKS[0])
    : (baseColor ? { base: baseColor, brow: browColor } : null);
  const activeColorLook = { lip: lipColor, cheek: cheekColor, eyeshadow: eyeshadowColor };

  const glassesItem = GLASSES_ITEMS.find(i => i.id === selectedGlasses);
  const earringItem = EARRING_ITEMS.find(i => i.id === selectedEarring);
  const contactLensItem = selectedContactLens === 'custom'
    ? customContactRef.current
    : CONTACT_LENS_ITEMS.find(i => i.id === selectedContactLens);
  const lashesItem = lashesColor ? { id: 'custom', color: lashesColor } : null;

  // 現在ARに表示中の全アイテム（メイク + アクセサリ）
  const currentArItems = useMemo(() => {
    const items = [];
    // メイク系（カテゴリ別追跡）
    Object.entries(appliedItems).forEach(([cat, { product, selectedColor: sc }]) => {
      if (product && sc) {
        items.push({
          uniqueKey: `${product.id}_${sc.id}`,
          product, selectedColor: sc,
          category: cat, price: product.price,
        });
      }
    });
    // メガネ
    if (selectedGlasses !== 'none' && glassesItem) {
      items.push({
        uniqueKey: `glasses_${glassesItem.id}`,
        product: { id: `glasses_${glassesItem.id}`, name: glassesItem.name, price: glassesItem.price || 0, affiliateUrl: '#', category: 'glasses' },
        selectedColor: { id: glassesItem.id, name: glassesItem.name, hex: glassesItem.color || '#333' },
        category: 'glasses', price: glassesItem.price || 0,
      });
    }
    // イヤリング
    if (selectedEarring !== 'none' && earringItem) {
      items.push({
        uniqueKey: `earring_${earringItem.id}`,
        product: { id: `earring_${earringItem.id}`, name: earringItem.name, price: earringItem.price || 0, affiliateUrl: '#', category: 'earring' },
        selectedColor: { id: earringItem.id, name: earringItem.name, hex: earringItem.color || '#333' },
        category: 'earring', price: earringItem.price || 0,
      });
    }
    // カラコン
    if (selectedContactLens !== 'none' && contactLensItem && contactLensItem.price > 0) {
      items.push({
        uniqueKey: `contacts_${contactLensItem.id}`,
        product: { id: `contacts_${contactLensItem.id}`, name: contactLensItem.name, price: contactLensItem.price || 0, affiliateUrl: '#', category: 'contacts' },
        selectedColor: { id: contactLensItem.id, name: contactLensItem.name, hex: contactLensItem.color || '#333' },
        category: 'contacts', price: contactLensItem.price || 0,
      });
    }
    return items;
  }, [appliedItems, selectedGlasses, glassesItem, selectedEarring, earringItem, selectedContactLens, contactLensItem]);

  const handlePointerDown = useCallback(() => setBeforeAfter(true), []);
  const handlePointerUp = useCallback(() => setBeforeAfter(false), []);

  // 未カート商品の確認チェック（CART_CONFIRM_POPUP=true 時のみ動作）
  const checkPending = useCallback(() => {
    if (!CART_CONFIRM_POPUP) return;
    if (selectedProduct && selectedColor) {
      const uk = `${selectedProduct.id}_${selectedColor.id}`;
      if (!cart.cartItems.some(i => i.uniqueKey === uk)) {
        const elapsed = productSelectedAtRef.current
          ? Date.now() - productSelectedAtRef.current
          : 0;
        if (elapsed >= 60000) {
          setPendingItem({ product: selectedProduct, selectedColor, uniqueKey: uk });
          setHasPendingBadge(false);
        } else {
          setPendingItem(null);
          setHasPendingBadge(true);
        }
        return;
      }
    }
    setPendingItem(null);
    setHasPendingBadge(false);
  }, [selectedProduct, selectedColor, cart.cartItems]);

  const handleCategoryTap = useCallback((catId) => {
    if (catId === activeCategory && sheetOpen) {
      checkPending();
      setSheetOpen(false);
    } else {
      checkPending();
      setActiveCategory(catId);
      setSelectedProduct(null);
      setSelectedColor(null);
      setJustAdded(false);
      setSheetOpen(true);
    }
  }, [activeCategory, sheetOpen, checkPending]);

  // カメラエリアタップで縮小
  const handleCameraTap = useCallback(() => {
    if (sheetOpen) {
      checkPending();
      setSheetOpen(false);
    }
  }, [sheetOpen, checkPending]);

  // 📷 キャプチャ + シェア
  const [shareStatus, setShareStatus] = useState(null);
  const doCapture = useCallback(() => {
    const dataUrl = captureFrame(videoRef.current, canvasRef.current);
    if (dataUrl) onCapture?.(dataUrl);
    return dataUrl;
  }, [videoRef, onCapture]);

  // タップ → シェアシート
  const handleShare = useCallback(async () => {
    const dataUrl = doCapture();
    if (!dataUrl) return;
    const result = await shareImage(dataUrl);
    setShareStatus(result);
    setTimeout(() => setShareStatus(null), 2000);
  }, [doCapture]);

  // 長押し → 保存
  const shareTimerRef = useRef(null);
  const handleShareDown = useCallback(() => {
    shareTimerRef.current = setTimeout(() => {
      const dataUrl = doCapture();
      if (dataUrl) {
        saveImage(dataUrl);
        setShareStatus('saved');
        setTimeout(() => setShareStatus(null), 2000);
      }
    }, 600);
  }, [doCapture]);
  const handleShareUp = useCallback(() => {
    if (shareTimerRef.current) clearTimeout(shareTimerRef.current);
  }, []);

  // カラー適用
  const applyColor = useCallback((category, hex) => {
    if (category === 'base') { setBaseColor(hex); }
    else if (category === 'lip') setLipColor(hex);
    else if (category === 'eyebrow') setBrowColor(hex);
    else if (category === 'eyeshadow') setEyeshadowColor(`rgba(${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)},0.45)`);
    else if (category === 'cheek') setCheekColor(`rgba(${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)},0.6)`);
    else if (category === 'lashes') { setLashesColor(hex); }
    else if (category === 'contacts') {
      const item = CONTACT_LENS_ITEMS.find(i => i.color === hex);
      if (item) { setSelectedContactLens(item.id); }
      else { setSelectedContactLens('custom'); customContactRef.current = { id: 'custom', color: hex }; }
    }
  }, []);

  // カート追加 → 自動縮小 + バッジ消去
  const handleAddToCart = useCallback((product, color) => {
    cart.dispatch({ type: 'ADD', payload: { product, selectedColor: color } });
    if (CART_CONFIRM_POPUP) setHasPendingBadge(false);
    setTimeout(() => setSheetOpen(false), 400);
  }, [cart]);

  // BottomSheet スワイプ
  const onTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
  const onTouchEnd = (e) => {
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (dy < -30) setSheetOpen(true);
    if (dy > 30) setSheetOpen(false);
  };

  // PC season
  const pcSeason = personalColor?.season;
  const pcText = personalColor?.subtypeId ? getSeasonText(personalColor.subtypeId, lang) : null;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000', overflow: 'hidden' }}>

      {/* Camera full-screen */}
      <video ref={videoRef} style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        objectFit: 'cover', transform: 'scaleX(-1)',
        display: cameraLive ? 'block' : 'none',
      }} playsInline muted autoPlay />

      {/* Tap overlay to close sheet */}
      <div onClick={handleCameraTap} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}
        style={{ position: 'absolute', inset: 0, zIndex: 1 }} />

      {/* AR Canvas */}
      {cameraLive && !beforeAfter && (
        <MakeupCanvas ref={canvasRef} getVideo={getVideo}
          baseLook={browColor ? { ...currentBase, brow: browColor } : currentBase}
          colorLook={activeColorLook} intensity={70}
          showMesh={showMesh} glassesItem={glassesItem} earringItem={earringItem}
          contactLensItem={contactLensItem} lashesItem={lashesItem} coverFit />
      )}

      {beforeAfter && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', borderRadius: 16,
          padding: '10px 20px', color: '#fff', fontSize: 14, fontWeight: 700, pointerEvents: 'none', zIndex: 5 }}>
          Before
        </div>
      )}

      {/* Share status toast */}
      {shareStatus && (
        <div style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', borderRadius: 20,
          padding: '8px 20px', color: '#fff', fontSize: 13, fontWeight: 600, pointerEvents: 'none', zIndex: 50,
        }}>
          {shareStatus === 'saved' ? '\u2705 \u4FDD\u5B58\u3057\u307E\u3057\u305F' :
           shareStatus === 'shared' ? '\u2705 \u30B7\u30A7\u30A2\u3057\u307E\u3057\u305F' : ''}
        </div>
      )}

      {!cameraLive && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(180deg, #1a1025 0%, #0f0a1a 100%)' }}>
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>{'\uD83D\uDCF7'}</div>
            <p style={{ fontSize: 13 }}>Loading camera...</p>
          </div>
        </div>
      )}

      {/* Top-left: PC badge */}
      {pcText && (
        <div style={{ position: 'absolute', top: 12, left: 12, background: (pcText.color || '#a855f7') + '30',
          backdropFilter: 'blur(8px)', borderRadius: 12, padding: '4px 10px', zIndex: 10 }}>
          <span style={{ fontSize: 12 }}>{pcText.emoji}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: pcText.color, marginLeft: 4 }}>{pcText.main}</span>
        </div>
      )}

      {/* Top-right: Capture + Mesh + Back */}
      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8, zIndex: 10 }}>
        <button onClick={handleShare} onPointerDown={handleShareDown} onPointerUp={handleShareUp} onPointerCancel={handleShareUp} style={{
          background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', border: 'none',
          borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 16, cursor: 'pointer',
        }}>{'\uD83D\uDCF7'}</button>
        <button onClick={() => setShowMesh(v => !v)} style={{
          background: showMesh ? 'rgba(168,85,247,0.7)' : 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)',
          border: showMesh ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.2)',
          borderRadius: 10, padding: '5px 8px', fontSize: 9, fontWeight: 600, color: '#fff', cursor: 'pointer',
        }}>{showMesh ? 'Mesh' : 'Mesh'}</button>
      </div>

      {/* Back button */}
      <button onClick={onBack} style={{
        position: 'absolute', top: 52, right: 12, background: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(8px)', border: 'none', borderRadius: 20, color: '#fff',
        padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600, zIndex: 10,
      }}>{'\u2190'} {t('back_to_mirror') || '\u623B\u308B'}</button>

      {/* キラリ ARプリセット時間差メッセージ */}
      {arKirariMsg && (
        <div style={{
          position: 'absolute',
          bottom: (cart.cartItems.length > 0 ? 52 : 0) + (sheetOpen ? SHEET_MAX : SHEET_MIN) + 8,
          left: 12, right: 12,
          display: 'flex', alignItems: 'flex-end', gap: 8,
          opacity: arKirariVisible ? 1 : 0,
          transition: 'bottom 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.3s ease',
          zIndex: 60, pointerEvents: 'none',
        }}>
          <Kirari size={44} expression="sparkle" bounce />
          <Bubble><p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: '#3d1a6e' }}>{arKirariMsg}</p></Bubble>
        </div>
      )}

      {/* BottomSheet */}
      <div style={{
        position: 'absolute', bottom: cart.cartItems.length > 0 ? 52 : 0,
        left: 0, right: 0,
        background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(16px)',
        borderRadius: '20px 20px 0 0', boxShadow: '0 -4px 24px rgba(0,0,0,0.08)',
        maxHeight: sheetOpen ? `${SHEET_MAX}px` : `${SHEET_MIN}px`,
        transition: 'max-height 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
        overflow: 'hidden', zIndex: 50,
      }}>
        {/* Drag handle */}
        <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
          onClick={() => setSheetOpen(!sheetOpen)}
          style={{ display: 'flex', justifyContent: 'center', padding: '6px 0 2px', cursor: 'pointer' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.15)' }} />
        </div>

        {/* Category tabs with scroll fade indicator */}
        <CategoryTabRow
          categories={CATEGORIES} activeCategory={activeCategory}
          sheetOpen={sheetOpen} hasPendingBadge={hasPendingBadge}
          onTap={handleCategoryTap} t={t}
        />

        {/* Expanded content */}
        {sheetOpen && (
          <div style={{ padding: '8px 12px 12px', overflowY: 'auto', maxHeight: SHEET_MAX - SHEET_MIN - 20 }}>
            {['base','lip','eyeshadow','eyebrow','cheek','contacts','lashes'].includes(activeCategory) && (
              <ProductLayer
                category={activeCategory}
                selectedProduct={selectedProduct} selectedColor={selectedColor}
                personalColor={personalColor} cart={cart}
                onSelectProduct={(p) => {
                  if (MAKEUP_CATEGORIES.includes(activeCategory) && selectedProduct && selectedProduct.id !== p.id) {
                    checkPending();
                  }
                  setSelectedProduct(p);
                  productSelectedAtRef.current = Date.now();
                  if (CART_CONFIRM_POPUP) setHasPendingBadge(false);
                  const dc = p.colors[0];
                  if (dc) {
                    setSelectedColor(dc);
                    applyColor(activeCategory, dc.hex);
                    setAppliedItems(prev => ({ ...prev, [activeCategory]: { product: p, selectedColor: dc } }));
                    showKirariMsg(getYoishoMessage(activeCategory, lang));
                  }
                }}
                onSelectColor={(c) => {
                  setSelectedColor(c);
                  applyColor(activeCategory, c.hex);
                  productSelectedAtRef.current = Date.now();
                  if (CART_CONFIRM_POPUP) setHasPendingBadge(false);
                  if (selectedProduct) {
                    setAppliedItems(prev => ({ ...prev, [activeCategory]: { product: selectedProduct, selectedColor: c } }));
                  }
                  showKirariMsg(getYoishoMessage(activeCategory, lang));
                }}
                onAddToCart={handleAddToCart}
                lang={lang} t={t}
              />
            )}
            {activeCategory === 'glasses' && (
              <div>
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                  {GLASSES_ITEMS.map(item => (
                    <button key={item.id} onClick={() => setSelectedGlasses(item.id)} style={{
                      padding: '6px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                      background: selectedGlasses === item.id ? 'rgba(168,85,247,0.15)' : 'rgba(139,92,246,0.04)',
                      border: selectedGlasses === item.id ? '2px solid #a855f7' : '1px solid #ede9fe',
                      color: selectedGlasses === item.id ? '#a855f7' : '#64748b',
                      cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                    }}>{item.emoji} {txt(item.name, lang)}</button>
                  ))}
                </div>
                {selectedGlasses !== 'none' && (() => {
                  const gi = GLASSES_ITEMS.find(i => i.id === selectedGlasses);
                  if (!gi) return null;
                  const uk = `glasses_${gi.id}`;
                  const inCart = cart.cartItems.some(i => i.uniqueKey === uk);
                  return (
                    <button onClick={() => {
                      if (inCart) cart.dispatch({ type: 'REMOVE', payload: { uniqueKey: uk } });
                      else cart.dispatch({ type: 'ADD', payload: { product: { id: `glasses_${gi.id}`, name: gi.name, price: gi.price, affiliateUrl: '#', category: 'glasses' }, selectedColor: { id: gi.id, name: gi.name, hex: gi.color || '#333' } } });
                    }} style={{
                      marginTop: 6, padding: '6px 12px', borderRadius: 14, fontSize: 10, fontWeight: 700,
                      background: inCart ? '#e2e8f0' : 'linear-gradient(135deg, #a855f7, #ec4899)',
                      color: inCart ? '#94a3b8' : '#fff', border: 'none', cursor: 'pointer',
                    }}>{inCart ? '\u2713 \u8FFD\u52A0\u6E08' : '\uD83D\uDED2 \u30AB\u30FC\u30C8\u306B\u8FFD\u52A0'}</button>
                  );
                })()}
              </div>
            )}
            {activeCategory === 'earring' && (
              <div>
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                  {EARRING_ITEMS.map(item => (
                    <button key={item.id} onClick={() => setSelectedEarring(item.id)} style={{
                      padding: '6px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                      background: selectedEarring === item.id ? 'rgba(168,85,247,0.15)' : 'rgba(139,92,246,0.04)',
                      border: selectedEarring === item.id ? '2px solid #a855f7' : '1px solid #ede9fe',
                      color: selectedEarring === item.id ? '#a855f7' : '#64748b',
                      cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                    }}>{item.emoji} {txt(item.name, lang)}</button>
                  ))}
                </div>
                {selectedEarring !== 'none' && (() => {
                  const ei = EARRING_ITEMS.find(i => i.id === selectedEarring);
                  if (!ei) return null;
                  const uk = `earring_${ei.id}`;
                  const inCart = cart.cartItems.some(i => i.uniqueKey === uk);
                  return (
                    <button onClick={() => {
                      if (inCart) cart.dispatch({ type: 'REMOVE', payload: { uniqueKey: uk } });
                      else cart.dispatch({ type: 'ADD', payload: { product: { id: `earring_${ei.id}`, name: ei.name, price: ei.price, affiliateUrl: '#', category: 'earring' }, selectedColor: { id: ei.id, name: ei.name, hex: ei.color || '#333' } } });
                    }} style={{
                      marginTop: 6, padding: '6px 12px', borderRadius: 14, fontSize: 10, fontWeight: 700,
                      background: inCart ? '#e2e8f0' : 'linear-gradient(135deg, #a855f7, #ec4899)',
                      color: inCart ? '#94a3b8' : '#fff', border: 'none', cursor: 'pointer',
                    }}>{inCart ? '\u2713 \u8FFD\u52A0\u6E08' : '\uD83D\uDED2 \u30AB\u30FC\u30C8\u306B\u8FFD\u52A0'}</button>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirm bar: カート追加確認（CART_CONFIRM_POPUP=true 時のみ表示） */}
      {CART_CONFIRM_POPUP && pendingItem && (
        <div style={{
          position: 'absolute',
          bottom: (cart.cartItems.length > 0 ? 52 : 0) + (sheetOpen ? SHEET_MAX : SHEET_MIN),
          left: 0, right: 0,
          background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(168,85,247,0.12)',
          padding: '12px 16px', zIndex: 55,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%',
              background: pendingItem.selectedColor.hex,
              border: '2px solid rgba(168,85,247,0.2)', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {txt(pendingItem.product.name, lang)}
              </div>
              <div style={{ fontSize: 11, color: '#7c7291' }}>
                {txt(pendingItem.selectedColor.name, lang)}{'\u3000'}{'\u00A5'}{pendingItem.product.price.toLocaleString()}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => {
              cart.dispatch({ type: 'ADD', payload: { product: pendingItem.product, selectedColor: pendingItem.selectedColor } });
              setPendingItem(null);
            }} style={{
              flex: 1, background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              color: '#fff', border: 'none', borderRadius: 20,
              padding: '10px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>{t('confirm_add') || '\u30AB\u30FC\u30C8\u306B\u8FFD\u52A0'}</button>
            <button onClick={() => setPendingItem(null)} style={{
              flex: 1, background: 'transparent', color: '#7c7291',
              border: '1.5px solid rgba(168,85,247,0.2)', borderRadius: 20,
              padding: '10px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>{t('confirm_skip') || '\u4ED6\u306E\u5546\u54C1\u3092\u8A66\u3059'}</button>
          </div>
        </div>
      )}

      {/* CartSummaryBar */}
      {cart.cartItems.length > 0 && (
        <CartSummaryBar items={cart.cartItems} totalPrice={cart.totalPrice}
          onCheckout={() => { doCapture(); onCheckout(currentArItems); }} />
      )}
    </div>
  );
}

// === CategoryTabRow with scroll fade ===
function CategoryTabRow({ categories, activeCategory, sheetOpen, hasPendingBadge, onTap, t }) {
  const scrollRef = useRef(null);
  const [canScroll, setCanScroll] = useState(false);
  const [atEnd, setAtEnd] = useState(false);

  // マウント時にスクロール可能かチェック（rAFでレイアウト完了後に測定）
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => {
      const hasOverflow = el.scrollWidth > el.clientWidth + 4;
      setCanScroll(hasOverflow);
      setAtEnd(!hasOverflow || el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
    };
    const raf = requestAnimationFrame(check);
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  const showIndicator = canScroll && !atEnd;

  return (
    <div style={{ position: 'relative', borderBottom: sheetOpen ? '1px solid #ede9fe' : 'none' }}>
      <div ref={scrollRef} onScroll={onScroll}
        style={{ display: 'flex', gap: 0, overflowX: 'auto', scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch' }}>
        {categories.map(cat => {
          const showBadge = hasPendingBadge && cat.id === activeCategory;
          return (
            <button key={cat.id} onClick={() => !cat.comingSoon && onTap(cat.id)} style={{
              flexShrink: 0, padding: '6px 6px', minWidth: 48,
              background: activeCategory === cat.id ? 'rgba(168,85,247,0.1)' : 'transparent',
              border: 'none',
              borderBottom: activeCategory === cat.id ? '2px solid #a855f7' : '2px solid transparent',
              color: cat.comingSoon ? '#cbd5e1' : activeCategory === cat.id ? '#a855f7' : '#94a3b8',
              fontSize: 8, fontWeight: activeCategory === cat.id ? 700 : 400,
              cursor: cat.comingSoon ? 'default' : 'pointer',
              opacity: cat.comingSoon ? 0.5 : 1, position: 'relative',
            }}>
              <div style={{ fontSize: 13, position: 'relative', display: 'inline-block' }}>
                {cat.icon}
                {showBadge && (
                  <span style={{
                    position: 'absolute', top: -3, right: -4,
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#ec4899', border: '1px solid #fff',
                  }} />
                )}
              </div>
              <div>{t(cat.labelKey)}</div>
              {cat.comingSoon && (
                <span style={{ position: 'absolute', top: 1, right: 1, fontSize: 6, background: '#a855f7',
                  color: '#fff', borderRadius: 3, padding: '0 2px', fontWeight: 700 }}>SOON</span>
              )}
            </button>
          );
        })}
      </div>
      {/* 右端スクロールインジケーター */}
      {showIndicator && (
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: 36,
          background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.98))',
          pointerEvents: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        }}>
          <span style={{ fontSize: 10, color: '#a855f7', paddingRight: 4, fontWeight: 700 }}>›</span>
        </div>
      )}
    </div>
  );
}

// === ProductLayer ===
function ProductLayer({ category, selectedProduct, selectedColor, personalColor, cart, onSelectProduct, onSelectColor, onAddToCart, lang = 'ja', t }) {
  const categoryProducts = sortByPC(PRODUCTS.filter(p => p.category === category), personalColor?.season);
  if (categoryProducts.length === 0) return <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: 8 }}>Coming soon</div>;

  return (
    <div>
      {/* Product cards */}
      <div style={{ display: 'flex', overflowX: 'auto', gap: 10, padding: '0 2px 8px',
        scrollbarWidth: 'none', touchAction: 'pan-x' }}>
        {categoryProducts.map(product => (
          <div key={product.id} onClick={() => onSelectProduct(product)} style={{
            flexShrink: 0, width: 72, cursor: 'pointer', position: 'relative',
            opacity: selectedProduct?.id === product.id ? 1 : 0.6,
          }}>
            {/* PC match badge */}
            {product.season && product.season === personalColor?.season && (
              <div style={{ position: 'absolute', top: 2, right: 2, zIndex: 1,
                background: '#a855f7', color: '#fff', fontSize: 7, fontWeight: 700,
                padding: '1px 4px', borderRadius: 4 }}>PC {'\u2713'}</div>
            )}
            {getProductImage(product) ? (
              <div style={{ width: 72, height: 72, borderRadius: 12, overflow: 'hidden',
                border: selectedProduct?.id === product.id ? '2px solid #a855f7' : '2px solid #ede9fe' }}>
                <img src={getProductImage(product)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : (
              <div style={{ width: 72, height: 72, borderRadius: 12,
                background: `linear-gradient(135deg, ${product.baseColor}40, ${product.baseColor}20)`,
                border: selectedProduct?.id === product.id ? '2px solid #a855f7' : '2px solid #ede9fe',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ display: 'flex', gap: 2 }}>
                  {product.colors.slice(0,3).map(c => (
                    <div key={c.id} style={{ width: 14, height: 14, borderRadius: '50%', background: c.hex }} />
                  ))}
                </div>
              </div>
            )}
            <p style={{ fontSize: 9, fontWeight: 600, marginTop: 3, color: '#334155',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{txt(product.name, lang)}</p>
            <p style={{ fontSize: 9, color: '#a855f7', fontWeight: 700, margin: 0 }}>{'\u00A5'}{product.price.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Color palette + cart button */}
      {selectedProduct && selectedProduct.colors.length > 0 && (
        <div style={{ borderTop: '1px solid #f1f0ff', paddingTop: 8 }}>
          <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 6px', fontWeight: 600 }}>{txt(selectedProduct.name, lang)}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none', touchAction: 'pan-x', flex: 1 }}>
              {selectedProduct.colors.map(color => (
                <div key={color.id} onClick={() => onSelectColor(color)} style={{
                  flexShrink: 0, width: 32, height: 32, borderRadius: '50%', background: color.hex, cursor: 'pointer',
                  border: selectedColor?.id === color.id ? '3px solid #a855f7' : '2px solid rgba(139,92,246,0.15)',
                  boxShadow: selectedColor?.id === color.id ? '0 0 10px rgba(168,85,247,0.4)' : 'none',
                }} />
              ))}
            </div>
            {/* Mini cart button */}
            {selectedColor && (() => {
              const inCart = cart.isInCart(selectedProduct.id, selectedColor.id);
              return (
                <button onClick={() => {
                  if (inCart) {
                    cart.dispatch({ type: 'REMOVE', payload: { uniqueKey: `${selectedProduct.id}_${selectedColor.id}` } });
                  } else {
                    onAddToCart(selectedProduct, selectedColor);
                  }
                }} style={{
                  flexShrink: 0, padding: '6px 10px', borderRadius: 14,
                  background: inCart ? '#e2e8f0' : 'linear-gradient(135deg, #a855f7, #ec4899)',
                  color: inCart ? '#94a3b8' : '#fff',
                  border: 'none', fontSize: 10, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                  {inCart ? '\u2713' : '\uD83D\uDED2 ' + (t?.('cart_add') || 'Add')}
                </button>
              );
            })()}
          </div>
          {selectedColor && (
            <p style={{ fontSize: 9, color: '#94a3b8', margin: '4px 0 0' }}>{txt(selectedColor.name, lang)}</p>
          )}
          {/* Intensity slider (not for contacts/lashes) */}
          {!['contacts', 'lashes'].includes(category) && selectedColor && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: 10, color: '#64748b', whiteSpace: 'nowrap', fontWeight: 600 }}>
                {t?.('ar.intensity') || '\u6FC3\u3055'}
              </span>
              <input type="range" min={0} max={100} defaultValue={70}
                style={{ flex: 1, accentColor: '#a855f7' }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
