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

// --- 16タイプ表記 ---
export const SEASON_DISPLAY = {
  'spring-light':  { main: 'イエベ春', sub: 'ライトスプリング',     color: '#F59E0B', emoji: '🌸', desc: '明るく軽やかな暖色が得意' },
  'spring-warm':   { main: 'イエベ春', sub: 'ウォームスプリング',   color: '#F59E0B', emoji: '🌸', desc: '鮮やかで温かみのある色が得意' },
  'spring-clear':  { main: 'イエベ春', sub: 'クリアスプリング',     color: '#F59E0B', emoji: '🌸', desc: '華やかでクリアな暖色が得意' },
  'spring-muted':  { main: 'イエベ春', sub: 'ソフトスプリング',     color: '#F59E0B', emoji: '🌸', desc: 'やわらかくナチュラルな暖色が得意' },
  'summer-light':  { main: 'ブルベ夏', sub: 'ライトサマー',         color: '#94A3B8', emoji: '🌿', desc: '明るく涼やかな淡色が得意' },
  'summer-cool':   { main: 'ブルベ夏', sub: 'クールサマー',         color: '#94A3B8', emoji: '🌿', desc: '洗練された青みのある色が得意' },
  'summer-soft':   { main: 'ブルベ夏', sub: 'ソフトサマー',         color: '#94A3B8', emoji: '🌿', desc: 'くすみのある穏やかな色が得意' },
  'summer-medium': { main: 'ブルベ夏', sub: 'ミディアムサマー',     color: '#94A3B8', emoji: '🌿', desc: '中間的な青みカラーが得意' },
  'autumn-soft':   { main: 'イエベ秋', sub: 'ソフトオータム',       color: '#D97706', emoji: '🍂', desc: 'やわらかく落ち着いた暖色が得意' },
  'autumn-warm':   { main: 'イエベ秋', sub: 'ウォームオータム',     color: '#D97706', emoji: '🍂', desc: '深みのある温かい色が得意' },
  'autumn-muted':  { main: 'イエベ秋', sub: 'ミューテッドオータム', color: '#D97706', emoji: '🍂', desc: 'くすみのあるアースカラーが得意' },
  'autumn-deep':   { main: 'イエベ秋', sub: 'ディープオータム',     color: '#D97706', emoji: '🍂', desc: '深く濃い暖色が得意' },
  'winter-clear':  { main: 'ブルベ冬', sub: 'クリアウィンター',     color: '#6366F1', emoji: '❄️', desc: '鮮やかでシャープな色が得意' },
  'winter-cool':   { main: 'ブルベ冬', sub: 'クールウィンター',     color: '#6366F1', emoji: '❄️', desc: '冷たくクールな色が得意' },
  'winter-deep':   { main: 'ブルベ冬', sub: 'ディープウィンター',   color: '#6366F1', emoji: '❄️', desc: '深みのある強い色が得意' },
  'winter-vivid':  { main: 'ブルベ冬', sub: 'ビビッドウィンター',   color: '#6366F1', emoji: '❄️', desc: '原色・モノトーンが得意' },
};

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
