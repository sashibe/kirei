// === パーソナルカラー判定 ===
// 頬Lab平均から四季タイプ＋16サブタイプを推定する

import { rgbToLab } from './colorUtils.js';

// --- 定数 ---
const LEFT_CHEEK_LM = 234;
const RIGHT_CHEEK_LM = 454;
const SAMPLE_RADIUS_RATIO = 0.13;

const THRESHOLDS = {
  warmCoolB: 15,
  warmCoolA: 4,
  brightness: 62,
  chromaHigh: 28,
  chromaLow: 18,
};

// --- 16タイプ表記（i18n対応） ---
export const SEASON_DISPLAY = {
  'spring-light':  { main: { ja: 'イエベ春', ko: '웜 봄', en: 'Warm Spring' }, sub: { ja: 'ライトスプリング', ko: '라이트 스프링', en: 'Light Spring' }, color: '#F59E0B', emoji: '🌸', desc: { ja: '明るく軽やかな暖色が得意', ko: '밝고 가벼운 웜톤이 잘 어울려요', en: 'Bright, light warm tones suit you' } },
  'spring-warm':   { main: { ja: 'イエベ春', ko: '웜 봄', en: 'Warm Spring' }, sub: { ja: 'ウォームスプリング', ko: '웜 스프링', en: 'Warm Spring' }, color: '#F59E0B', emoji: '🌸', desc: { ja: '鮮やかで温かみのある色が得意', ko: '선명하고 따뜻한 색이 잘 어울려요', en: 'Vivid, warm colors suit you' } },
  'spring-clear':  { main: { ja: 'イエベ春', ko: '웜 봄', en: 'Warm Spring' }, sub: { ja: 'クリアスプリング', ko: '클리어 스프링', en: 'Clear Spring' }, color: '#F59E0B', emoji: '🌸', desc: { ja: '華やかでクリアな暖色が得意', ko: '화사하고 클리어한 웜톤이 잘 어울려요', en: 'Gorgeous, clear warm tones suit you' } },
  'spring-muted':  { main: { ja: 'イエベ春', ko: '웜 봄', en: 'Warm Spring' }, sub: { ja: 'ソフトスプリング', ko: '소프트 스프링', en: 'Soft Spring' }, color: '#F59E0B', emoji: '🌸', desc: { ja: 'やわらかくナチュラルな暖色が得意', ko: '부드럽고 내추럴한 웜톤이 잘 어울려요', en: 'Soft, natural warm tones suit you' } },
  'summer-light':  { main: { ja: 'ブルベ夏', ko: '쿨 여름', en: 'Cool Summer' }, sub: { ja: 'ライトサマー', ko: '라이트 서머', en: 'Light Summer' }, color: '#94A3B8', emoji: '🌿', desc: { ja: '明るく涼やかな淡色が得意', ko: '밝고 시원한 파스텔이 잘 어울려요', en: 'Bright, cool pastels suit you' } },
  'summer-cool':   { main: { ja: 'ブルベ夏', ko: '쿨 여름', en: 'Cool Summer' }, sub: { ja: 'クールサマー', ko: '쿨 서머', en: 'Cool Summer' }, color: '#94A3B8', emoji: '🌿', desc: { ja: '洗練された青みのある色が得意', ko: '세련된 블루톤이 잘 어울려요', en: 'Refined blue-toned colors suit you' } },
  'summer-soft':   { main: { ja: 'ブルベ夏', ko: '쿨 여름', en: 'Cool Summer' }, sub: { ja: 'ソフトサマー', ko: '소프트 서머', en: 'Soft Summer' }, color: '#94A3B8', emoji: '🌿', desc: { ja: 'くすみのある穏やかな色が得意', ko: '뮤트된 차분한 색이 잘 어울려요', en: 'Muted, calm colors suit you' } },
  'summer-medium': { main: { ja: 'ブルベ夏', ko: '쿨 여름', en: 'Cool Summer' }, sub: { ja: 'ミディアムサマー', ko: '미디엄 서머', en: 'Medium Summer' }, color: '#94A3B8', emoji: '🌿', desc: { ja: '中間的な青みカラーが得意', ko: '중간 톤의 쿨 컬러가 잘 어울려요', en: 'Medium cool colors suit you' } },
  'autumn-soft':   { main: { ja: 'イエベ秋', ko: '웜 가을', en: 'Warm Autumn' }, sub: { ja: 'ソフトオータム', ko: '소프트 오텀', en: 'Soft Autumn' }, color: '#D97706', emoji: '🍂', desc: { ja: 'やわらかく落ち着いた暖色が得意', ko: '부드럽고 차분한 웜톤이 잘 어울려요', en: 'Soft, calm warm tones suit you' } },
  'autumn-warm':   { main: { ja: 'イエベ秋', ko: '웜 가을', en: 'Warm Autumn' }, sub: { ja: 'ウォームオータム', ko: '웜 오텀', en: 'Warm Autumn' }, color: '#D97706', emoji: '🍂', desc: { ja: '深みのある温かい色が得意', ko: '깊이 있는 따뜻한 색이 잘 어울려요', en: 'Deep, warm colors suit you' } },
  'autumn-muted':  { main: { ja: 'イエベ秋', ko: '웜 가을', en: 'Warm Autumn' }, sub: { ja: 'ミューテッドオータム', ko: '뮤티드 오텀', en: 'Muted Autumn' }, color: '#D97706', emoji: '🍂', desc: { ja: 'くすみのあるアースカラーが得意', ko: '뮤트된 어스 컬러가 잘 어울려요', en: 'Muted earth colors suit you' } },
  'autumn-deep':   { main: { ja: 'イエベ秋', ko: '웜 가을', en: 'Warm Autumn' }, sub: { ja: 'ディープオータム', ko: '딥 오텀', en: 'Deep Autumn' }, color: '#D97706', emoji: '🍂', desc: { ja: '深く濃い暖色が得意', ko: '깊고 진한 웜톤이 잘 어울려요', en: 'Deep, rich warm tones suit you' } },
  'winter-clear':  { main: { ja: 'ブルベ冬', ko: '쿨 겨울', en: 'Cool Winter' }, sub: { ja: 'クリアウィンター', ko: '클리어 윈터', en: 'Clear Winter' }, color: '#6366F1', emoji: '❄️', desc: { ja: '鮮やかでシャープな色が得意', ko: '선명하고 샤프한 색이 잘 어울려요', en: 'Vivid, sharp colors suit you' } },
  'winter-cool':   { main: { ja: 'ブルベ冬', ko: '쿨 겨울', en: 'Cool Winter' }, sub: { ja: 'クールウィンター', ko: '쿨 윈터', en: 'Cool Winter' }, color: '#6366F1', emoji: '❄️', desc: { ja: '冷たくクールな色が得意', ko: '차갑고 쿨한 색이 잘 어울려요', en: 'Cool, icy colors suit you' } },
  'winter-deep':   { main: { ja: 'ブルベ冬', ko: '쿨 겨울', en: 'Cool Winter' }, sub: { ja: 'ディープウィンター', ko: '딥 윈터', en: 'Deep Winter' }, color: '#6366F1', emoji: '❄️', desc: { ja: '深みのある強い色が得意', ko: '깊이 있는 강한 색이 잘 어울려요', en: 'Deep, bold colors suit you' } },
  'winter-vivid':  { main: { ja: 'ブルベ冬', ko: '쿨 겨울', en: 'Cool Winter' }, sub: { ja: 'ビビッドウィンター', ko: '비비드 윈터', en: 'Vivid Winter' }, color: '#6366F1', emoji: '❄️', desc: { ja: '原色・モノトーンが得意', ko: '원색·모노톤이 잘 어울려요', en: 'Primary colors & monotone suit you' } },
};

// i18nヘルパー: main/sub/descをlangで取得
export function getSeasonText(subtypeId, lang = 'ja') {
  const d = SEASON_DISPLAY[subtypeId];
  if (!d) return { main: '', sub: '', desc: '' };
  const l = (obj) => (typeof obj === 'object' && obj !== null) ? (obj[lang] ?? obj.ja ?? '') : (obj ?? '');
  return { main: l(d.main), sub: l(d.sub), desc: l(d.desc), color: d.color, emoji: d.emoji };
}

// --- シーズン別ルック対応表 ---
export const SEASON_LOOK_MAP = {
  spring: {
    recommended: ['warm-glow', 'clean-natural', 'peach-fresh'],
    eyeshadow: ['rgba(196,149,106,0.25)', 'rgba(232,150,122,0.25)', 'rgba(255,218,185,0.25)'],
    lip: ['#FF7F7F', '#FF6B6B', '#FFA07A'],
    cheek: ['rgba(255,182,193,0.4)', 'rgba(255,160,122,0.4)'],
  },
  summer: {
    recommended: ['cool-rose', 'sheer-pink', 'lavender-soft'],
    eyeshadow: ['rgba(200,162,200,0.25)', 'rgba(216,191,216,0.25)', 'rgba(230,230,250,0.25)'],
    lip: ['#C48EA1', '#DB7093', '#FFB6C1'],
    cheek: ['rgba(255,182,193,0.4)', 'rgba(219,112,147,0.4)'],
  },
  autumn: {
    recommended: ['warm-terra', 'matt-chic', 'earthy-natural'],
    eyeshadow: ['rgba(139,69,19,0.20)', 'rgba(210,105,30,0.20)', 'rgba(205,133,63,0.20)'],
    lip: ['#8B0000', '#A0522D', '#CD853F'],
    cheek: ['rgba(210,105,30,0.4)', 'rgba(188,143,95,0.4)'],
  },
  winter: {
    recommended: ['cool-elegant', 'berry-night', 'sharp-contrast'],
    eyeshadow: ['rgba(75,0,130,0.20)', 'rgba(72,61,139,0.20)', 'rgba(128,128,128,0.20)'],
    lip: ['#8B008B', '#DC143C', '#FF1493'],
    cheek: ['rgba(219,112,147,0.4)', 'rgba(199,21,133,0.4)'],
  },
};

// --- キラリセリフ ---
export const SEASON_KIRARI = {
  spring: 'イエベ春タイプだよ🌸 コーラルやピーチ系が得意なの♪',
  summer: 'ブルベ夏タイプだよ🌿 ローズやラベンダー系が似合うよ♪',
  autumn: 'イエベ秋タイプだよ🍂 テラコッタやブラウン系がドンピシャ♪',
  winter: 'ブルベ冬タイプだよ❄️ ビビッドカラーやバーガンディが映えるよ♪',
};

// --- 16タイプ判定ロジック ---
function detectSubtype(season, avgL, avgC) {
  switch (season) {
    case 'spring':
      if (avgL > 70) return 'spring-light';
      if (avgC >= THRESHOLDS.chromaHigh) return 'spring-clear';
      if (avgC < THRESHOLDS.chromaLow) return 'spring-muted';
      return 'spring-warm';
    case 'summer':
      if (avgL > 68) return 'summer-light';
      if (avgC < THRESHOLDS.chromaLow) return 'summer-soft';
      if (avgL <= 58) return 'summer-medium';
      return 'summer-cool';
    case 'autumn':
      if (avgC < THRESHOLDS.chromaLow) return 'autumn-soft';
      if (avgL < 50) return 'autumn-deep';
      if (avgC >= THRESHOLDS.chromaLow) return 'autumn-warm';
      return 'autumn-muted';
    case 'winter':
      if (avgC >= THRESHOLDS.chromaHigh) return 'winter-vivid';
      if (avgL < 52) return 'winter-deep';
      if (avgC >= 22) return 'winter-clear';
      return 'winter-cool';
    default:
      return `${season}-warm`;
  }
}

// --- 頬ピクセル抽出 ---
function sampleCheekPixels(imageData, landmarks) {
  const w = imageData.width;
  const h = imageData.height;
  const data = imageData.data;

  const lm = landmarks;
  const faceWidth = Math.abs(lm[RIGHT_CHEEK_LM].x - lm[LEFT_CHEEK_LM].x) * w;
  const r = Math.max(4, Math.round(faceWidth * SAMPLE_RADIUS_RATIO));

  const centers = [
    { cx: Math.round(lm[LEFT_CHEEK_LM].x * w), cy: Math.round(lm[LEFT_CHEEK_LM].y * h) },
    { cx: Math.round(lm[RIGHT_CHEEK_LM].x * w), cy: Math.round(lm[RIGHT_CHEEK_LM].y * h) },
  ];

  const pixels = [];
  for (const { cx, cy } of centers) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r) continue;
        const px = cx + dx;
        const py = cy + dy;
        if (px < 0 || py < 0 || px >= w || py >= h) continue;
        const i = (py * w + px) * 4;
        pixels.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
      }
    }
  }
  return pixels;
}

// --- 主判定関数 ---
export function analyzePersonalColor(imageData, landmarks) {
  if (!imageData || !landmarks || landmarks.length < 468) {
    return null;
  }

  const pixels = sampleCheekPixels(imageData, landmarks);
  if (pixels.length < 50) return null;

  // Lab平均
  const labs = pixels.map((p) => rgbToLab(p.r, p.g, p.b));
  const avgL = labs.reduce((s, l) => s + l[0], 0) / labs.length;
  const avgA = labs.reduce((s, l) => s + l[1], 0) / labs.length;
  const avgB = labs.reduce((s, l) => s + l[2], 0) / labs.length;
  const avgC = Math.sqrt(avgA * avgA + avgB * avgB);

  // ウォーム/クール判定
  let isWarm;
  if (avgB > THRESHOLDS.warmCoolB) {
    isWarm = true;
  } else if (avgB < THRESHOLDS.warmCoolB - 4) {
    isWarm = false;
  } else {
    isWarm = avgA > THRESHOLDS.warmCoolA;
  }

  const isHighBrightness = avgL > THRESHOLDS.brightness;
  const season = isWarm
    ? (isHighBrightness ? 'spring' : 'autumn')
    : (isHighBrightness ? 'summer' : 'winter');

  // 16タイプ判定
  const subtypeId = detectSubtype(season, avgL, avgC);
  const display = SEASON_DISPLAY[subtypeId];

  // 信頼度
  const labStdC = Math.sqrt(
    labs.reduce((s, l) => {
      const c = Math.sqrt(l[1] * l[1] + l[2] * l[2]);
      return s + (c - avgC) ** 2;
    }, 0) / labs.length
  );
  const confidence = Math.max(0.4, Math.min(0.95,
    0.95 - labStdC * 0.02 - (pixels.length < 200 ? 0.15 : 0)
  ));

  return {
    season,
    subtypeId,
    // i18n objects — use getSeasonText(subtypeId, lang) for display
    main: display?.main ?? season,
    sub: display?.sub ?? '',
    desc: display?.desc ?? '',
    emoji: display?.emoji ?? '✨',
    color: display?.color ?? '#a855f7',
    undertone: isWarm ? 'warm' : 'cool',
    confidence,
    raw: { avgL, avgA, avgB, avgC },
  };
}

// --- localStorage キャッシュ ---
export function savePersonalColor(result) {
  if (!result) return;
  localStorage.setItem('kirei_personal_color', JSON.stringify({
    ...result,
    detectedAt: new Date().toISOString(),
  }));
}

export function loadPersonalColor() {
  try {
    const saved = localStorage.getItem('kirei_personal_color');
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
}

export function clearPersonalColor() {
  localStorage.removeItem('kirei_personal_color');
}

// --- UIカラー ---
export const PC_COLORS = {
  spring: { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  summer: { bg: '#f0f9ff', color: '#0369a1', border: '#bae6fd' },
  autumn: { bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
  winter: { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' },
};

export function getPcColors(season) {
  return PC_COLORS[season] ?? PC_COLORS.winter;
}

export const PC_ICONS = {
  spring: '🌸',
  summer: '🌿',
  autumn: '🍂',
  winter: '❄️',
};

export function getPcIcon(season) {
  return PC_ICONS[season] ?? '✨';
}
