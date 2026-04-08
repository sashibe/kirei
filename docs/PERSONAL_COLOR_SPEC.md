# パーソナルカラー判定 実装仕様書

> Claude Code はこのファイルを読んで実装する。
> `docs/PERSONAL_COLOR_SPEC.md` に配置してpushすること。

---

## 概要

MirrorScreenV3 のシャッター直後に肌色分析を実行し、
パーソナルカラー（四季タイプ＋サブタイプ）を判定する。
判定結果はミラー・提案・結果の全画面で使用する。

---

## 1. アルゴリズム設計

### 1-1. サンプリング領域

**頬ランドマーク中心の円形領域**のみを使用する。
唇・目・額・照明反射が強い鼻は除外。

```js
// 使用ランドマーク
const LEFT_CHEEK_LM  = 234;   // 左頬
const RIGHT_CHEEK_LM = 454;   // 右頬

// サンプリング半径 = 顔幅（耳間距離）の 13%
const SAMPLE_RADIUS_RATIO = 0.13;
```

実装:
```js
function sampleCheekPixels(imageData, landmarks) {
  const w = imageData.width;
  const h = imageData.height;
  const data = imageData.data;

  const lm = landmarks;
  const faceWidth = Math.abs(lm[454].x - lm[234].x) * w;
  const r = Math.round(faceWidth * SAMPLE_RADIUS_RATIO);

  const centers = [
    { cx: Math.round(lm[LEFT_CHEEK_LM].x  * w), cy: Math.round(lm[LEFT_CHEEK_LM].y  * h) },
    { cx: Math.round(lm[RIGHT_CHEEK_LM].x * w), cy: Math.round(lm[RIGHT_CHEEK_LM].y * h) },
  ];

  const pixels = [];
  for (const { cx, cy } of centers) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r) continue;
        const px = cx + dx, py = cy + dy;
        if (px < 0 || py < 0 || px >= w || py >= h) continue;
        const i = (py * w + px) * 4;
        pixels.push({ r: data[i], g: data[i+1], b: data[i+2] });
      }
    }
  }
  return pixels;
}
```

### 1-2. 分類軸

Lab色空間の3軸を以下のように解釈する。

| 軸 | 意味 | 低い | 高い |
|---|---|---|---|
| **L*** | 明度 | 深み・ダーク | 明るい・ライト |
| **b*** | 黄み（暖cool軸） | ブルーベース（cool） | イエローベース（warm） |
| **C*** = √(a*²+b*²) | 彩度・清澄度 | ミュート・ソフト | クリア・ビビッド |

a*（赤み）は b* が中間値のときのウォーム/クールの補助判定に使う。

### 1-3. 四季タイプ判定

```
               高明度 (L* > 62)
                    │
        ┌───────────┼───────────┐
      warm          │          cool
   イエベ春    ─────┼─────   ブルベ夏
        └───────────┼───────────┘
                    │
               低明度 (L* ≤ 62)
        ┌───────────┼───────────┐
      warm          │          cool
   イエベ秋    ─────┼─────   ブルベ冬
        └───────────┼───────────┘
```

**判定しきい値（頬Lab平均値）:**

```js
const THRESHOLDS = {
  // b* によるウォーム/クール判定
  warmCoolB:   15,    // b* > 15 → warm / b* < 15 → cool
  warmCoolA:    4,    // b*が境界付近の場合、a* > 4 → warm 補助
  // L* による明度判定
  brightness:  62,    // L* > 62 → high / L* ≤ 62 → low
  // C* による清澄度判定（サブタイプ用）
  chromaHigh:  28,    // C* > 28 → clear（ビビッド/クリア）
  chromaLow:   18,    // C* < 18 → muted（ソフト/ミュート）
};
```

### 1-4. サブタイプ分類（12種）

各タイプを3つのサブタイプに分類する。分類軸は C*（彩度）と L*（明度）の強度。

```js
export const SUBTYPES = {
  // ─── Spring ───
  'bright-spring': {
    season: 'spring',
    label: { ja: '明るいイエベ春', en: 'Bright Spring', ko: '밝은 스프링' },
    desc:   { ja: '透明感のある明るい肌。淡いコーラルや水色が得意', en: 'Luminous bright skin tone', ko: '투명감 있는 밝은 피부' },
    condition: s => s.season === 'spring' && s.avgL > 70,
  },
  'true-spring': {
    season: 'spring',
    label: { ja: '真のイエベ春', en: 'True Spring', ko: '트루 스프링' },
    desc:   { ja: '黄みがかった明るい肌。コーラルやゴールドが映える', en: 'Warm golden spring tone', ko: '황금빛 봄 피부 톤' },
    condition: s => s.season === 'spring' && s.avgL <= 70 && s.avgC >= 22,
  },
  'clear-spring': {
    season: 'spring',
    label: { ja: '華やかイエベ春', en: 'Clear Spring', ko: '클리어 스프링' },
    desc:   { ja: 'コントラストのある鮮やかな肌。ビビッドな暖色が得意', en: 'Vivid warm spring tone', ko: '선명한 웜 스프링' },
    condition: s => s.season === 'spring' && s.avgC >= THRESHOLDS.chromaHigh,
  },

  // ─── Summer ───
  'light-summer': {
    season: 'summer',
    label: { ja: '明るいブルベ夏', en: 'Light Summer', ko: '라이트 서머' },
    desc:   { ja: 'やわらかく明るい肌。パステルや淡いラベンダーが得意', en: 'Soft and light cool tone', ko: '부드럽고 밝은 쿨 톤' },
    condition: s => s.season === 'summer' && s.avgL > 68,
  },
  'true-summer': {
    season: 'summer',
    label: { ja: '真のブルベ夏', en: 'True Summer', ko: '트루 서머' },
    desc:   { ja: 'ローズ系の清涼感ある肌。モーブやスモーキーピンクが得意', en: 'Rose-toned classic summer', ko: '로즈 톤 클래식 서머' },
    condition: s => s.season === 'summer' && s.avgL <= 68 && s.avgC >= 14,
  },
  'soft-summer': {
    season: 'summer',
    label: { ja: 'ソフトブルベ夏', en: 'Soft Summer', ko: '소프트 서머' },
    desc:   { ja: 'くすみのある柔らかな肌。グレイッシュやアッシュが得意', en: 'Muted soft cool tone', ko: '뮤트 소프트 쿨 톤' },
    condition: s => s.season === 'summer' && s.avgC < THRESHOLDS.chromaLow,
  },

  // ─── Autumn ───
  'soft-autumn': {
    season: 'autumn',
    label: { ja: 'ソフトイエベ秋', en: 'Soft Autumn', ko: '소프트 오텀' },
    desc:   { ja: 'くすみのある落ち着いた肌。テラコッタやカーキが得意', en: 'Muted warm earthy tone', ko: '뮤트 웜 어시 톤' },
    condition: s => s.season === 'autumn' && s.avgC < THRESHOLDS.chromaLow,
  },
  'true-autumn': {
    season: 'autumn',
    label: { ja: '真のイエベ秋', en: 'True Autumn', ko: '트루 오텀' },
    desc:   { ja: '黄みのある深い肌。オリーブやブリックレッドが得意', en: 'Golden deep autumn tone', ko: '골든 딥 오텀 톤' },
    condition: s => s.season === 'autumn' && s.avgL >= 50 && s.avgC >= THRESHOLDS.chromaLow,
  },
  'deep-autumn': {
    season: 'autumn',
    label: { ja: '深みイエベ秋', en: 'Deep Autumn', ko: '딥 오텀' },
    desc:   { ja: 'リッチで深みのある肌。バーガンディやダークブラウンが得意', en: 'Rich deep warm tone', ko: '리치 딥 웜 톤' },
    condition: s => s.season === 'autumn' && s.avgL < 50,
  },

  // ─── Winter ───
  'clear-winter': {
    season: 'winter',
    label: { ja: '鮮やかブルベ冬', en: 'Clear Winter', ko: '클리어 윈터' },
    desc:   { ja: 'コントラストの強い肌。ビビッドな原色やロイヤルブルーが得意', en: 'High contrast vivid cool tone', ko: '하이 콘트라스트 비비드 쿨 톤' },
    condition: s => s.season === 'winter' && s.avgC >= THRESHOLDS.chromaHigh,
  },
  'true-winter': {
    season: 'winter',
    label: { ja: '真のブルベ冬', en: 'True Winter', ko: '트루 윈터' },
    desc:   { ja: '青みのある透明感ある肌。アイシーカラーやワインが得意', en: 'Icy blue-toned classic winter', ko: '아이시 블루 클래식 윈터' },
    condition: s => s.season === 'winter' && s.avgL >= 52 && s.avgC < THRESHOLDS.chromaHigh,
  },
  'deep-winter': {
    season: 'winter',
    label: { ja: '深みブルベ冬', en: 'Deep Winter', ko: '딥 윈터' },
    desc:   { ja: 'ダークで存在感のある肌。ディープネイビーやチャコールが得意', en: 'Deep cool dark tone', ko: '딥 쿨 다크 톤' },
    condition: s => s.season === 'winter' && s.avgL < 52,
  },
};
```

---

## 2. personalColor.js の実装

**ファイル**: `src/analysis/personalColor.js`（新規作成）

```js
import { rgbToLab } from './colorUtils.js';

// --- 定数 ---
const LEFT_CHEEK_LM  = 234;
const RIGHT_CHEEK_LM = 454;
const SAMPLE_RADIUS_RATIO = 0.13;

const THRESHOLDS = {
  warmCoolB:   15,
  warmCoolA:    4,
  brightness:  62,
  chromaHigh:  28,
  chromaLow:   18,
};

// SUBTYPES オブジェクト（上記1-4のコードをそのまま使用）
// ...

// --- 頬ピクセル抽出 ---
function sampleCheekPixels(imageData, landmarks) {
  // 上記1-1のコードをそのまま使用
}

// --- 主判定関数 ---
export function analyzePersonalColor(imageData, landmarks) {
  if (!landmarks || landmarks.length < 468) {
    return null; // ランドマーク不足はスキップ
  }

  const pixels = sampleCheekPixels(imageData, landmarks);
  if (pixels.length < 50) return null; // サンプル不足

  // Lab平均算出
  const labs = pixels.map(p => rgbToLab(p.r, p.g, p.b));
  const avgL = labs.reduce((s, l) => s + l[0], 0) / labs.length;
  const avgA = labs.reduce((s, l) => s + l[1], 0) / labs.length;
  const avgB = labs.reduce((s, l) => s + l[2], 0) / labs.length;
  const avgC = Math.sqrt(avgA * avgA + avgB * avgB); // 彩度

  // ウォーム/クール判定
  let isWarm;
  if (avgB > THRESHOLDS.warmCoolB) {
    isWarm = true;
  } else if (avgB < THRESHOLDS.warmCoolB - 4) {
    isWarm = false;
  } else {
    // 境界付近: a* で補助判定
    isWarm = avgA > THRESHOLDS.warmCoolA;
  }

  // 四季タイプ
  const isHighBrightness = avgL > THRESHOLDS.brightness;
  const season = isWarm
    ? (isHighBrightness ? 'spring' : 'autumn')
    : (isHighBrightness ? 'summer' : 'winter');

  const stats = { season, avgL, avgA, avgB, avgC };

  // サブタイプ: conditionが真になる最初のエントリを採用
  // conditionが複数マッチする場合は先に書いた方が優先される（上記1-4の順序）
  const subtypeEntry = Object.entries(SUBTYPES).find(
    ([, v]) => v.season === season && v.condition(stats)
  );
  // フォールバック: true-{season}
  const subtypeId = subtypeEntry?.[0] ?? `true-${season}`;
  const subtype   = SUBTYPES[subtypeId];

  // 信頼度: サンプル数 + C*の安定性で算出
  const labStdC = Math.sqrt(
    labs.reduce((s, l) => {
      const c = Math.sqrt(l[1]**2 + l[2]**2);
      return s + (c - avgC) ** 2;
    }, 0) / labs.length
  );
  const confidence = Math.max(0.4, Math.min(0.95,
    0.95 - labStdC * 0.02 - (pixels.length < 200 ? 0.15 : 0)
  ));

  return {
    season,                         // 'spring' | 'summer' | 'autumn' | 'winter'
    subtypeId,                      // 'bright-spring' | 'true-autumn' | ...
    label:      subtype.label,      // { ja, en, ko }
    desc:       subtype.desc,       // { ja, en, ko }
    undertone:  isWarm ? 'warm' : 'cool',
    brightness: isHighBrightness ? 'high' : 'low',
    chroma:     avgC >= THRESHOLDS.chromaHigh ? 'clear'
              : avgC <= THRESHOLDS.chromaLow  ? 'muted' : 'neutral',
    confidence,
    raw: { avgL, avgA, avgB, avgC }, // デバッグ・将来のチューニング用
  };
}

// --- UIカラー取得 ---
export const PC_COLORS = {
  spring: { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  summer: { bg: '#f0f9ff', color: '#0369a1', border: '#bae6fd' },
  autumn: { bg: '#fef3c7', color: '#b45309', border: '#fde68a' },
  winter: { bg: '#f5f3ff', color: '#6d28d9', border: '#ddd6fe' },
};

export function getPcColors(season) {
  return PC_COLORS[season] ?? PC_COLORS.winter;
}
```

---

## 3. データフロー変更

### 3-1. MirrorScreenV3.jsx

シャッター後に `analyzePersonalColor` を呼び出し、`onResult` に追加する。

```js
// 追加 import
import { analyzePersonalColor } from '../analysis/personalColor.js';

// applyScores の末尾に追加
const applyScores = useCallback(() => {
  // ... 既存のskinAnalyzer処理 ...

  // パーソナルカラー判定（ランドマークが取れている場合のみ）
  let personalColor = null;
  if (lastLandmarks && frozenImageData) {
    personalColor = analyzePersonalColor(frozenImageData, lastLandmarks);
  }

  setSkinScores(scores);
  setPersonalColor(personalColor); // 新規state
  return { scores, personalColor };
}, [lastLandmarks, frozenImageData]);

// state追加
const [personalColor, setPersonalColor] = useState(null);

// onResult の呼び出し箇所を更新
onResult({ skinScores, personalColor });
```

**注意**: `frozenImageData` は現在 `frozenFrame`（dataURL）として保持されている。
`analyzePersonalColor` は `ImageData` を必要とするため、canvas経由で変換する:

```js
// frozenFrame (dataURL) → ImageData への変換
async function dataUrlToImageData(dataUrl, width, height) {
  const img = new Image();
  img.src = dataUrl;
  await new Promise(r => img.onload = r);
  const offscreen = new OffscreenCanvas(width, height);
  const ctx = offscreen.getContext('2d');
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, width, height);
}
```

**代替案（シンプル）**: シャッター時点のcanvasから `getImageData` を直接取得する方法が
すでに実装されているなら、そのまま流用するのが確実。実装を確認してから選択すること。

### 3-2. App.jsx

```js
// scoresRef に personalColor を追加
const scoresRef = useRef({ skinScores: null, personalColor: null });

const handleResult = useCallback(({ skinScores, personalColor }) => {
  scoresRef.current = { skinScores, personalColor };
  setScreen(SC.SUGGEST);
}, []);

// 各画面への props 追加
<SuggestScreen
  skinScores={scoresRef.current.skinScores}
  personalColor={scoresRef.current.personalColor}   // ← 追加
  onSelectLook={handleSelectLook}
  onSkipToResult={handleSkipToResult}
/>

<ArTryOnScreen
  look={lookRef.current.selectedLook}
  styleTab={lookRef.current.styleTab}
  personalColor={scoresRef.current.personalColor}   // ← 追加
  onNext={handleArNext}
  onBack={() => setScreen(SC.SUGGEST)}
/>

<ResultScreen
  skinScores={scoresRef.current.skinScores}
  personalColor={scoresRef.current.personalColor}   // ← 追加
  styleTab={lookRef.current.styleTab}
  selectedLook={lookRef.current.selectedLook}
  capturedImage={lookRef.current.capturedImage}
  products={lookRef.current.products}
  onRestart={handleRestart}
/>
```

---

## 4. 画面別UI実装

### 4-1. MirrorScreen（分析完了後バッジ）

肌スコアが表示されるエリアに、パーソナルカラーバッジを追加する。

```jsx
// MirrorScreenV3.jsx — スコア表示エリア内
{personalColor && (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: getPcColors(personalColor.season).bg,
    border: `1px solid ${getPcColors(personalColor.season).border}`,
    borderRadius: 20, padding: '4px 12px', marginTop: 8,
  }}>
    <span style={{ fontSize: 12 }}>
      {personalColor.season === 'spring' ? '🌸'
     : personalColor.season === 'summer' ? '🌊'
     : personalColor.season === 'autumn' ? '🍂' : '❄️'}
    </span>
    <span style={{
      fontSize: 12, fontWeight: 700,
      color: getPcColors(personalColor.season).color,
    }}>
      {personalColor.label.ja}
    </span>
    {personalColor.confidence < 0.6 && (
      <span style={{ fontSize: 9, color: '#94a3b8' }}>（参考）</span>
    )}
  </div>
)}
```

### 4-2. SuggestScreen（ルック優先度調整）

`personalColor` prop を受け取り、ルックカードに「あなたに合う理由」を
パーソナルカラーベースで動的に生成する。またルックの並び順を pc との適合度で調整する。

**makeupLooks.js に `pcSeasons` を追加:**

```js
// src/data/makeupLooks.js — 既存ルックデータに追加
export const COLOR_LOOKS = [
  {
    id: 'glow',
    name: { ja: 'ツヤ肌ブルームルック', ... },
    pcSeasons: ['spring', 'summer'],  // ← 追加: 相性の良いシーズン
    // ... 既存フィールド
  },
  {
    id: 'matte',
    pcSeasons: ['winter', 'autumn'],
    // ...
  },
  {
    id: 'warm',
    pcSeasons: ['spring', 'autumn'],
    // ...
  },
];

export const BASE_LOOKS = [
  {
    id: 'clean-natural',
    pcSeasons: ['spring', 'summer'],
    // ...
  },
  {
    id: 'business-sharp',
    pcSeasons: ['winter', 'summer'],
    // ...
  },
  {
    id: 'weekend-fresh',
    pcSeasons: ['spring', 'autumn'],
    // ...
  },
];
```

**SuggestScreen.jsx でのルック並び替え:**

```js
// SuggestScreen.jsx 内
function sortLooksByPc(looks, personalColor) {
  if (!personalColor) return looks;
  return [...looks].sort((a, b) => {
    const aMatch = a.pcSeasons?.includes(personalColor.season) ? 0 : 1;
    const bMatch = b.pcSeasons?.includes(personalColor.season) ? 0 : 1;
    return aMatch - bMatch;
  });
}

const sortedLooks = sortLooksByPc(looks, personalColor);
```

**LookCard に pc バッジ追加:**

```jsx
// LookCard コンポーネント内
{personalColor && look.pcSeasons?.includes(personalColor.season) && (
  <div style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    background: getPcColors(personalColor.season).bg,
    borderRadius: 8, padding: '2px 8px', marginBottom: 6,
    fontSize: 10, fontWeight: 600,
    color: getPcColors(personalColor.season).color,
  }}>
    ✨ あなたのパーソナルカラーにマッチ
  </div>
)}
```

### 4-3. ResultScreen（パーソナルカラーカード）

既存の `pc.bg / pc.color / pc.label` の静的データを `personalColor` prop に差し替える。

```jsx
// ResultScreen.jsx — 既存のパーソナルカラー表示箇所を置き換え

// personalColor が null の場合はフォールバック表示
const pcDisplay = personalColor
  ? {
      label:  personalColor.label.ja,
      desc:   personalColor.desc.ja,
      bg:     getPcColors(personalColor.season).bg,
      color:  getPcColors(personalColor.season).color,
      border: getPcColors(personalColor.season).border,
      icon:   { spring: '🌸', summer: '🌊', autumn: '🍂', winter: '❄️' }[personalColor.season],
      confidence: personalColor.confidence,
    }
  : null;

// 表示UI
{pcDisplay && (
  <div style={{
    margin: '0 16px 12px', padding: '14px 16px',
    background: pcDisplay.bg,
    border: `1px solid ${pcDisplay.border}`,
    borderRadius: 18,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <span style={{ fontSize: 20 }}>{pcDisplay.icon}</span>
      <p style={{ fontSize: 14, fontWeight: 800, color: pcDisplay.color, margin: 0 }}>
        {pcDisplay.label}
      </p>
      {pcDisplay.confidence < 0.6 && (
        <span style={{ fontSize: 9, color: '#94a3b8', marginLeft: 'auto' }}>参考値</span>
      )}
    </div>
    <p style={{ fontSize: 11, color: '#475569', margin: 0, lineHeight: 1.6 }}>
      {pcDisplay.desc}
    </p>
  </div>
)}
```

### 4-4. キラリのセリフ追加

`src/data/kirariDialogues.js` に追加:

```js
export function getPcLine(personalColor, t) {
  if (!personalColor) return null;
  const lines = {
    'bright-spring': 'kirari.pc_bright_spring',
    'true-spring':   'kirari.pc_true_spring',
    'clear-spring':  'kirari.pc_clear_spring',
    'light-summer':  'kirari.pc_light_summer',
    'true-summer':   'kirari.pc_true_summer',
    'soft-summer':   'kirari.pc_soft_summer',
    'soft-autumn':   'kirari.pc_soft_autumn',
    'true-autumn':   'kirari.pc_true_autumn',
    'deep-autumn':   'kirari.pc_deep_autumn',
    'clear-winter':  'kirari.pc_clear_winter',
    'true-winter':   'kirari.pc_true_winter',
    'deep-winter':   'kirari.pc_deep_winter',
  };
  return t(lines[personalColor.subtypeId] ?? 'kirari.pc_fallback');
}
```

**i18n/ja.js に追加するキー:**

```js
// ja.js
'kirari.pc_bright_spring': '透明感バッチリの明るいイエベ春だよ♪ パステルコーラルが超似合う〜！',
'kirari.pc_true_spring':   '黄みのある明るいイエベ春♪ コーラルやゴールドが映えるよ〜！',
'kirari.pc_clear_spring':  '華やかなイエベ春！ ビビッドな暖色でトータルコーデが決まるよ♪',
'kirari.pc_light_summer':  'やわらかな明るいブルベ夏♪ パステルラベンダーがベストマッチ〜',
'kirari.pc_true_summer':   'ローズ系が得意なブルベ夏♪ モーブやスモーキーピンクで大人っぽく〜',
'kirari.pc_soft_summer':   'くすみが上品なソフトブルベ夏♪ グレイッシュカラーで洗練された印象に〜',
'kirari.pc_soft_autumn':   'くすみが魅力のイエベ秋♪ テラコッタやカーキで深みのある仕上がりに〜',
'kirari.pc_true_autumn':   'リッチな黄みのイエベ秋♪ オリーブやブリックレッドがとっても似合うよ〜',
'kirari.pc_deep_autumn':   '深みたっぷりのイエベ秋♪ バーガンディやダークブラウンで存在感UP〜',
'kirari.pc_clear_winter':  'コントラスト強めのブルベ冬♪ ビビッドな原色で個性が際立つよ〜！',
'kirari.pc_true_winter':   '透明感のあるブルベ冬♪ アイシーカラーやワインレッドが最高に似合う〜',
'kirari.pc_deep_winter':   '深みのあるブルベ冬♪ ディープネイビーやチャコールで圧倒的な存在感に〜',
'kirari.pc_fallback':      'パーソナルカラーが分かったよ♪ このタイプに合ったルックを選んだよ〜！',
```

en.js / ko.js にも同様に追加すること。

---

## 5. 実装順序

1. `src/analysis/personalColor.js` を新規作成
2. `src/data/makeupLooks.js` の全ルックに `pcSeasons` を追加
3. `MirrorScreenV3.jsx` でシャッター後に `analyzePersonalColor` を呼び出し、`onResult` に追加
4. `App.jsx` の `scoresRef` に `personalColor` を追加、全画面に props 配布
5. `MirrorScreenV3.jsx` にパーソナルカラーバッジ表示を追加
6. `SuggestScreen.jsx` にルック並び替えと pc バッジを追加
7. `ResultScreen.jsx` の静的 pc 表示を動的データに差し替え
8. `kirariDialogues.js` に `getPcLine` 追加
9. `i18n/ja.js` / `en.js` / `ko.js` にキーを追加
10. デプロイ・動作確認

### コミット単位
```
feat: personalColor.js — 四季タイプ＋12サブタイプ判定ロジック実装
feat: makeupLooks.js に pcSeasons フィールド追加
feat: MirrorScreenV3 — シャッター後にパーソナルカラー判定を実行
feat: App.jsx — personalColor を全画面へ props 配布
feat: SuggestScreen — pc ベースのルック並び替えとバッジ表示
feat: ResultScreen — パーソナルカラーカード動的表示
feat: kirariDialogues — 12サブタイプ対応セリフ追加
feat: i18n — パーソナルカラーセリフ三言語追加
```

---

## 6. 検証チェックリスト

- [ ] シャッター後にパーソナルカラー判定が実行される
- [ ] ランドマーク不足 / 低照度環境で `null` を返し、アプリがクラッシュしない
- [ ] ミラー画面に四季タイプ＋サブタイプのバッジが表示される
- [ ] 信頼度 < 0.6 のとき「（参考）」ラベルが表示される
- [ ] SuggestScreen でパーソナルカラーに合うルックが上に並ぶ
- [ ] マッチするルックカードに「✨ あなたのパーソナルカラーにマッチ」バッジが出る
- [ ] ResultScreen にパーソナルカラーカードが表示される（静的データでなく実測値）
- [ ] キラリのセリフがサブタイプに応じて切り替わる
- [ ] JA / EN / KO 全言語でパーソナルカラー表示が崩れない
- [ ] `personalColor === null`（判定失敗時）で全画面が正常動作する
