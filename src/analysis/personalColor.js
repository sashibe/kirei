// === パーソナルカラー判定 ===
// 頬Lab平均から四季タイプ＋12サブタイプを推定する

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

export const SUBTYPES = {
  // ─── Spring ───
  'bright-spring': {
    season: 'spring',
    label: { ja: '明るいイエベ春', en: 'Bright Spring', ko: '밝은 스프링' },
    desc: { ja: '透明感のある明るい肌。淡いコーラルや水色が得意', en: 'Luminous bright skin tone', ko: '투명감 있는 밝은 피부' },
    condition: (s) => s.season === 'spring' && s.avgL > 70,
  },
  'true-spring': {
    season: 'spring',
    label: { ja: '真のイエベ春', en: 'True Spring', ko: '트루 스프링' },
    desc: { ja: '黄みがかった明るい肌。コーラルやゴールドが映える', en: 'Warm golden spring tone', ko: '황금빛 봄 피부 톤' },
    condition: (s) => s.season === 'spring' && s.avgL <= 70 && s.avgC >= 22,
  },
  'clear-spring': {
    season: 'spring',
    label: { ja: '華やかイエベ春', en: 'Clear Spring', ko: '클리어 스프링' },
    desc: { ja: 'コントラストのある鮮やかな肌。ビビッドな暖色が得意', en: 'Vivid warm spring tone', ko: '선명한 웜 스프링' },
    condition: (s) => s.season === 'spring' && s.avgC >= THRESHOLDS.chromaHigh,
  },

  // ─── Summer ───
  'light-summer': {
    season: 'summer',
    label: { ja: '明るいブルベ夏', en: 'Light Summer', ko: '라이트 서머' },
    desc: { ja: 'やわらかく明るい肌。パステルや淡いラベンダーが得意', en: 'Soft and light cool tone', ko: '부드럽고 밝은 쿨 톤' },
    condition: (s) => s.season === 'summer' && s.avgL > 68,
  },
  'true-summer': {
    season: 'summer',
    label: { ja: '真のブルベ夏', en: 'True Summer', ko: '트루 서머' },
    desc: { ja: 'ローズ系の清涼感ある肌。モーブやスモーキーピンクが得意', en: 'Rose-toned classic summer', ko: '로즈 톤 클래식 서머' },
    condition: (s) => s.season === 'summer' && s.avgL <= 68 && s.avgC >= 14,
  },
  'soft-summer': {
    season: 'summer',
    label: { ja: 'ソフトブルベ夏', en: 'Soft Summer', ko: '소프트 서머' },
    desc: { ja: 'くすみのある柔らかな肌。グレイッシュやアッシュが得意', en: 'Muted soft cool tone', ko: '뮤트 소프트 쿨 톤' },
    condition: (s) => s.season === 'summer' && s.avgC < THRESHOLDS.chromaLow,
  },

  // ─── Autumn ───
  'soft-autumn': {
    season: 'autumn',
    label: { ja: 'ソフトイエベ秋', en: 'Soft Autumn', ko: '소프트 오텀' },
    desc: { ja: 'くすみのある落ち着いた肌。テラコッタやカーキが得意', en: 'Muted warm earthy tone', ko: '뮤트 웜 어시 톤' },
    condition: (s) => s.season === 'autumn' && s.avgC < THRESHOLDS.chromaLow,
  },
  'true-autumn': {
    season: 'autumn',
    label: { ja: '真のイエベ秋', en: 'True Autumn', ko: '트루 오텀' },
    desc: { ja: '黄みのある深い肌。オリーブやブリックレッドが得意', en: 'Golden deep autumn tone', ko: '골든 딥 오텀 톤' },
    condition: (s) => s.season === 'autumn' && s.avgL >= 50 && s.avgC >= THRESHOLDS.chromaLow,
  },
  'deep-autumn': {
    season: 'autumn',
    label: { ja: '深みイエベ秋', en: 'Deep Autumn', ko: '딥 오텀' },
    desc: { ja: 'リッチで深みのある肌。バーガンディやダークブラウンが得意', en: 'Rich deep warm tone', ko: '리치 딥 웜 톤' },
    condition: (s) => s.season === 'autumn' && s.avgL < 50,
  },

  // ─── Winter ───
  'clear-winter': {
    season: 'winter',
    label: { ja: '鮮やかブルベ冬', en: 'Clear Winter', ko: '클리어 윈터' },
    desc: { ja: 'コントラストの強い肌。ビビッドな原色やロイヤルブルーが得意', en: 'High contrast vivid cool tone', ko: '하이 콘트라스트 비비드 쿨 톤' },
    condition: (s) => s.season === 'winter' && s.avgC >= THRESHOLDS.chromaHigh,
  },
  'true-winter': {
    season: 'winter',
    label: { ja: '真のブルベ冬', en: 'True Winter', ko: '트루 윈터' },
    desc: { ja: '青みのある透明感ある肌。アイシーカラーやワインが得意', en: 'Icy blue-toned classic winter', ko: '아이시 블루 클래식 윈터' },
    condition: (s) => s.season === 'winter' && s.avgL >= 52 && s.avgC < THRESHOLDS.chromaHigh,
  },
  'deep-winter': {
    season: 'winter',
    label: { ja: '深みブルベ冬', en: 'Deep Winter', ko: '딥 윈터' },
    desc: { ja: 'ダークで存在感のある肌。ディープネイビーやチャコールが得意', en: 'Deep cool dark tone', ko: '딥 쿨 다크 톤' },
    condition: (s) => s.season === 'winter' && s.avgL < 52,
  },
};

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

  const stats = { season, avgL, avgA, avgB, avgC };

  const subtypeEntry = Object.entries(SUBTYPES).find(
    ([, v]) => v.season === season && v.condition(stats)
  );
  const subtypeId = subtypeEntry?.[0] ?? `true-${season}`;
  const subtype = SUBTYPES[subtypeId];

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
    label: subtype.label,
    desc: subtype.desc,
    undertone: isWarm ? 'warm' : 'cool',
    brightness: isHighBrightness ? 'high' : 'low',
    chroma: avgC >= THRESHOLDS.chromaHigh ? 'clear'
          : avgC <= THRESHOLDS.chromaLow ? 'muted' : 'neutral',
    confidence,
    raw: { avgL, avgA, avgB, avgC },
  };
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
  summer: '🌊',
  autumn: '🍂',
  winter: '❄️',
};

export function getPcIcon(season) {
  return PC_ICONS[season] ?? '✨';
}
