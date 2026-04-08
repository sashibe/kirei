# KIREI パーソナルカラー判定仕様書

> Claude Code はこのファイルを読んで実装する。
> 実装先: `src/analysis/personalColor.js`
> BUGFIX_URGENT完了後に着手すること。

---

## 概要

カメラ映像からリアルタイムにパーソナルカラーのシーズンタイプを判定する。
判定結果はルック推薦・商品フィルタリング・キラリのセリフに使用する。

**4シーズン分類:**
- 🌸 Spring（スプリング）: イエローベース × 明るい・鮮やか
- 🌿 Summer（サマー）: ブルーベース × 明るい・ソフト
- 🍂 Autumn（オータム）: イエローベース × 深い・ソフト
- ❄️ Winter（ウィンター）: ブルーベース × 深い・鮮やか

---

## 判定ロジック

### Step 1｜サンプリング領域の定義

MediaPipeランドマークから3箇所のピクセル色を取得する。

```js
// src/analysis/personalColor.js

// サンプリング領域（各ランドマーク周辺 5×5px の平均色）
const SAMPLE_REGIONS = {
  // 頬（アンダートーン判定の主要点）
  cheekRight: [50, 101, 36, 205, 187],   // 右頬のランドマーク群
  cheekLeft:  [280, 330, 266, 425, 411], // 左頬のランドマーク群

  // 額（髪・眉の影響が少ない）
  forehead:   [10, 67, 297],

  // 唇（リップカラー判定）
  lipUpper:   [0, 267, 269, 270, 409],
  lipLower:   [17, 84, 181, 91, 146],

  // 虹彩（refineLandmarks: true が必要）
  irisRight:  [468], // 右虹彩中心
  irisLeft:   [473], // 左虹彩中心
};

// Canvas から指定ランドマーク周辺の平均色を取得
function sampleColor(ctx, landmarks, landmarkIds, W, H, radius = 5) {
  let r = 0, g = 0, b = 0, count = 0;
  landmarkIds.forEach(idx => {
    const lm = landmarks[idx];
    const x = Math.round((1 - lm.x) * W); // ミラー反転
    const y = Math.round(lm.y * H);
    const imageData = ctx.getImageData(
      x - radius, y - radius,
      radius * 2, radius * 2
    );
    for (let i = 0; i < imageData.data.length; i += 4) {
      r += imageData.data[i];
      g += imageData.data[i + 1];
      b += imageData.data[i + 2];
      count++;
    }
  });
  return { r: r / count, g: g / count, b: b / count };
}
```

---

### Step 2｜アンダートーン判定（Warm / Cool）

**核心指標: Yb（黄み-青みバランス）**

```js
// RGB → Lab 変換してbチャンネルを使う
// b > 0: 黄み（Warm）
// b < 0: 青み（Cool）

function rgbToLab(r, g, b) {
  // RGB → XYZ → Lab（標準的な変換式）
  let R = r / 255, G = g / 255, B = b / 255;

  // sRGBリニア化
  R = R > 0.04045 ? Math.pow((R + 0.055) / 1.055, 2.4) : R / 12.92;
  G = G > 0.04045 ? Math.pow((G + 0.055) / 1.055, 2.4) : G / 12.92;
  B = B > 0.04045 ? Math.pow((B + 0.055) / 1.055, 2.4) : B / 12.92;

  // XYZ（D65光源）
  const X = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  const Y = (R * 0.2126 + G * 0.7152 + B * 0.0722) / 1.00000;
  const Z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;

  const f = v => v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116;

  const L = 116 * f(Y) - 16;
  const a = 500 * (f(X) - f(Y));
  const bVal = 200 * (f(Y) - f(Z));

  return { L, a, b: bVal };
}

function detectUndertone(cheekColor) {
  const lab = rgbToLab(cheekColor.r, cheekColor.g, cheekColor.b);
  // b > 2: Warm（イエローベース）
  // b < -2: Cool（ブルーベース）
  // -2 〜 2: Neutral
  if (lab.b > 2)  return { type: 'warm', confidence: Math.min(lab.b / 10, 1) };
  if (lab.b < -2) return { type: 'cool', confidence: Math.min(-lab.b / 10, 1) };
  return { type: 'neutral', confidence: 0.5 };
}
```

---

### Step 3｜明度・彩度判定（Bright/Deep × Clear/Soft）

```js
function detectTone(cheekColor) {
  const lab = rgbToLab(cheekColor.r, cheekColor.g, cheekColor.b);
  const { r, g, b } = cheekColor;

  // 明度: Lab の L値（0〜100）
  // L > 65: 明るい（Spring/Summer）
  // L < 65: 深い（Autumn/Winter）
  const brightness = lab.L;

  // 彩度: RGBからHSVのS値
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const saturation = max === 0 ? 0 : (max - min) / max;

  // S > 0.3: 鮮やか・クリア（Spring/Winter）
  // S < 0.3: ソフト・くすみ（Summer/Autumn）

  return {
    brightness,       // L値（0〜100）
    saturation,       // S値（0〜1）
    isBright: brightness > 65,
    isClear:  saturation > 0.3,
  };
}
```

---

### Step 4｜シーズン判定

```js
function detectSeason(undertone, tone) {
  const { type: ut } = undertone;
  const { isBright, isClear } = tone;

  // 4シーズン判定マトリクス
  //              Warm          Cool
  // Bright      Spring        Summer
  // Deep        Autumn        Winter

  // さらに Clear/Soft で重み付け
  if (ut === 'warm' && isBright)  return 'spring';
  if (ut === 'cool' && isBright)  return 'summer';
  if (ut === 'warm' && !isBright) return 'autumn';
  if (ut === 'cool' && !isBright) return 'winter';

  // Neutral の場合: 彩度で分類
  if (ut === 'neutral') {
    if (isBright && isClear)  return 'spring';
    if (isBright && !isClear) return 'summer';
    if (!isBright && isClear) return 'winter';
    return 'autumn';
  }
}

// メイン判定関数
export function analyzePersonalColor(ctx, landmarks, W, H) {
  // 左右頬の平均
  const rightCheek = sampleColor(ctx, landmarks, SAMPLE_REGIONS.cheekRight, W, H);
  const leftCheek  = sampleColor(ctx, landmarks, SAMPLE_REGIONS.cheekLeft,  W, H);
  const cheekAvg = {
    r: (rightCheek.r + leftCheek.r) / 2,
    g: (rightCheek.g + leftCheek.g) / 2,
    b: (rightCheek.b + leftCheek.b) / 2,
  };

  const undertone = detectUndertone(cheekAvg);
  const tone      = detectTone(cheekAvg);
  const season    = detectSeason(undertone, tone);

  return {
    season,           // 'spring' | 'summer' | 'autumn' | 'winter'
    undertone,        // { type: 'warm'|'cool'|'neutral', confidence }
    brightness: tone.brightness,
    saturation: tone.saturation,
    raw: { cheekAvg },
  };
}
```

---

## シーズン別ルック対応表

パーソナルカラーに基づいてルックの優先順位を変更する。

```js
// src/data/makeupLooks.js に追記

export const SEASON_LOOK_MAP = {
  spring: {
    recommended: ['warm-glow', 'clean-natural', 'peach-fresh'],
    eyeshadow:   ['#F4A460', '#DEB887', '#FFDAB9'],  // コーラル・ピーチ・ゴールド系
    lip:         ['#FF7F7F', '#FF6B6B', '#FFA07A'],  // コーラル・サーモン系
    cheek:       ['#FFB6C1', '#FFA07A'],              // ピーチ・コーラル系
    avoid:       ['cool-elegant', 'berry-night'],
  },
  summer: {
    recommended: ['cool-rose', 'sheer-pink', 'lavender-soft'],
    eyeshadow:   ['#D8BFD8', '#C8A2C8', '#E6E6FA'],  // モーブ・ラベンダー系
    lip:         ['#C48EA1', '#DB7093', '#FFB6C1'],   // ローズ・モーブ系
    cheek:       ['#FFB6C1', '#DB7093'],              // ローズ・ソフトピンク系
    avoid:       ['warm-glow', 'orange-bold'],
  },
  autumn: {
    recommended: ['warm-terra', 'matt-chic', 'earthy-natural'],
    eyeshadow:   ['#8B4513', '#D2691E', '#CD853F'],  // テラコッタ・ブラウン系
    lip:         ['#8B0000', '#A0522D', '#CD853F'],  // レンガ・テラコッタ系
    cheek:       ['#D2691E', '#BC8F5F'],              // テラコッタ・ウォームブラウン系
    avoid:       ['cool-rose', 'pink-fresh'],
  },
  winter: {
    recommended: ['cool-elegant', 'berry-night', 'sharp-contrast'],
    eyeshadow:   ['#483D8B', '#4B0082', '#808080'],  // ネイビー・パープル・グレー系
    lip:         ['#8B008B', '#DC143C', '#FF1493'],  // バーガンディ・ルビー系
    cheek:       ['#DB7093', '#C71585'],              // クールローズ・フューシャ系
    avoid:       ['warm-terra', 'peach-fresh'],
  },
};
```

---

## 照明補正

店内・夜間など照明環境によって肌色の測定値がずれる。
既存のグレーワールド補正の結果を使って補正する。

```js
// skinAnalyzer.js のグレーワールド補正結果を受け取る
export function analyzePersonalColor(ctx, landmarks, W, H, lightingGain = null) {
  const cheekAvg = /* サンプリング */;

  // 照明補正（gainがある場合）
  if (lightingGain) {
    cheekAvg.r = Math.min(255, cheekAvg.r * lightingGain.r);
    cheekAvg.g = Math.min(255, cheekAvg.g * lightingGain.g);
    cheekAvg.b = Math.min(255, cheekAvg.b * lightingGain.b);
  }
  // 以降の判定ロジックへ
}
```

---

## 結果の表示

### MirrorScreen（スキャン後）

スキャン結果画面にパーソナルカラーバッジを追加する。

```jsx
const SEASON_INFO = {
  spring: { label: 'スプリング', emoji: '🌸', color: '#F59E0B', desc: 'イエベ春' },
  summer: { label: 'サマー',     emoji: '🌿', color: '#94A3B8', desc: 'ブルベ夏' },
  autumn: { label: 'オータム',   emoji: '🍂', color: '#D97706', desc: 'イエベ秋' },
  winter: { label: 'ウィンター', emoji: '❄️', color: '#6366F1', desc: 'ブルベ冬' },
};

// 結果画面に表示
<div style={{
  background: SEASON_INFO[season].color + '20',
  border: `2px solid ${SEASON_INFO[season].color}`,
  borderRadius: 16, padding: '12px 20px',
  display: 'flex', alignItems: 'center', gap: 12,
}}>
  <span style={{ fontSize: 32 }}>{SEASON_INFO[season].emoji}</span>
  <div>
    <div style={{ fontSize: 11, color: '#64748b' }}>パーソナルカラー</div>
    <div style={{ fontSize: 20, fontWeight: 800 }}>
      {SEASON_INFO[season].label}
    </div>
    <div style={{ fontSize: 12, color: '#94a3b8' }}>
      {SEASON_INFO[season].desc}
    </div>
  </div>
</div>
```

### キラリのセリフ

```js
const SEASON_KIRARI = {
  spring: 'イエベ春タイプだよ🌸 コーラル系が得意なの♪ ウォームカラーで明るく仕上げよう！',
  summer: 'ブルベ夏タイプだよ🌿 ローズやモーブが似合うよ♪ ソフトに上品に仕上げよう！',
  autumn: 'イエベ秋タイプだよ🍂 テラコッタやブラウンが得意なの♪ 深みのある大人カラーで！',
  winter: 'ブルベ冬タイプだよ❄️ ビビッドカラーやバーガンディが似合う♪ コントラストを楽しんで！',
};
```

---

## SuggestScreenへの連動

パーソナルカラー判定結果をもとにルックの並び順を変更する。

```js
// SuggestScreen.jsx
const rankedLooks = useMemo(() => {
  if (!personalColorSeason) return MAKEUP_LOOKS;
  const seasonMap = SEASON_LOOK_MAP[personalColorSeason];
  return [...MAKEUP_LOOKS].sort((a, b) => {
    const aRec = seasonMap.recommended.includes(a.id) ? -1 : 0;
    const bRec = seasonMap.recommended.includes(b.id) ? -1 : 0;
    return aRec - bRec;
  });
}, [personalColorSeason]);
```

---

## アイシャドウカテゴリーとの連携

```js
// ArTryOnScreen.jsx
// カラコンタブと同様に、アイシャドウタブを追加

const CATEGORIES = [
  { id: 'base',       label: 'ベース',     emoji: '🧴' },
  { id: 'lip',        label: 'リップ',     emoji: '💄' },
  { id: 'eyeshadow',  label: 'アイシャドウ', emoji: '✨' }, // ← 追加
  { id: 'cheek',      label: 'チーク',     emoji: '🌸' },
  { id: 'colorcon',   label: 'カラコン',   emoji: '👁' },
  { id: 'glasses',    label: 'メガネ',     emoji: '👓' },
  { id: 'earring',    label: 'イヤリング', emoji: '💍' },
  { id: 'lash',       label: 'まつげ',     emoji: '✨', soon: true },
];

// パーソナルカラーに基づくアイシャドウ色の初期選択
const defaultEyeshadowColor = personalColorSeason
  ? SEASON_LOOK_MAP[personalColorSeason].eyeshadow[0]
  : '#C4A882';
```

---

## 実装順序

1. `src/analysis/personalColor.js` を新規作成（analyzePersonalColor関数）
2. `MirrorScreen.jsx` のスキャン後処理でanalyzePersonalColorを呼び出す
3. 結果をAppレベルのstateに保存（全画面で参照できるように）
4. MirrorScreen結果画面にシーズンバッジを表示
5. `makeupLooks.js` に SEASON_LOOK_MAP を追加
6. `SuggestScreen.jsx` でルックをシーズン順にソート
7. `ArTryOnScreen.jsx` にアイシャドウカテゴリーを追加
8. useKirari.js にシーズン別セリフを追加

---

## 精度の限界と免責

- 照明環境・カメラ品質により判定が変動する
- 「参考値」として提示し、ユーザーが自分で調整できるようにする
- 結果画面に「※照明環境により変動します。参考値としてご利用ください」を表示する
- ユーザーが判定結果を手動で変更できるセレクターを用意する（将来実装）

---

## 判定タイミングとキャッシュ戦略

### 判定タイミング
ミラー画面のスキャン時に1回だけ判定する。
ARトライオン中のリアルタイム更新はしない。

### キャッシュ設計（デモ版）
一度判定した結果をlocalStorageに保存し、次回以降は再判定しない。
「再判定する」ボタンを押したときだけ上書きする。

```js
// 判定結果の保存
const savePersonalColor = (result) => {
  localStorage.setItem('kirei_personal_color', JSON.stringify({
    season: result.season,
    undertone: result.undertone,
    detectedAt: new Date().toISOString(),
  }));
};

// 起動時に復元
const loadPersonalColor = () => {
  const saved = localStorage.getItem('kirei_personal_color');
  return saved ? JSON.parse(saved) : null;
};
```

### 「再判定する」ボタン
結果画面のシーズンバッジの下に小さく配置する。

```jsx
<button
  onClick={() => {
    localStorage.removeItem('kirei_personal_color');
    onNavigate('mirror'); // ミラー画面に戻って再スキャン
  }}
  style={{
    background: 'none', border: 'none',
    fontSize: 12, color: '#94a3b8',
    textDecoration: 'underline', cursor: 'pointer',
    marginTop: 8,
  }}
>
  再判定する
</button>
```

### 安定化処理（ブレ対策）
スキャン中の30フレーム分の頬色を平均してから判定する。
1フレームの瞬間値で判定しない。

```js
const colorSamples = [];

// rAFループ内で蓄積（最大30フレーム）
if (isScanning && colorSamples.length < 30) {
  const cheek = sampleColor(ctx, landmarks, SAMPLE_REGIONS.cheekRight, W, H);
  colorSamples.push(cheek);
}

// 30フレーム揃ったら平均して判定
if (colorSamples.length === 30) {
  const avgColor = {
    r: colorSamples.reduce((s, c) => s + c.r, 0) / 30,
    g: colorSamples.reduce((s, c) => s + c.g, 0) / 30,
    b: colorSamples.reduce((s, c) => s + c.b, 0) / 30,
  };
  const result = analyzePersonalColor(avgColor);
  savePersonalColor(result);
}
```

### 将来の改善（後日再考）
手動選択オプションは現時点では採用しない。
カメラ精度・複数環境での検証を経た上で再検討する。

---

## 表記仕様（最終確定）

### 表示フォーマット

女性誌・SNSで最も普及している形式に統一する。

```
メイン表示:  イエベ春          ← 最も認知度が高い
サブ表示:   ライトスプリング   ← 英語トーン名
説明文:     明るく鮮やかな暖色が得意
```

### 16タイプの表記対応表

| season内部値 | tone内部値 | メイン表示 | サブ表示 | 説明文 |
|-------------|-----------|-----------|---------|--------|
| spring | light  | イエベ春 | ライトスプリング | 明るく軽やかな暖色が得意 |
| spring | warm   | イエベ春 | ウォームスプリング | 鮮やかで温かみのある色が得意 |
| spring | clear  | イエベ春 | クリアスプリング | 華やかでクリアな暖色が得意 |
| spring | muted  | イエベ春 | ソフトスプリング | やわらかくナチュラルな暖色が得意 |
| summer | light  | ブルベ夏 | ライトサマー | 明るく涼やかな淡色が得意 |
| summer | cool   | ブルベ夏 | クールサマー | 洗練された青みのある色が得意 |
| summer | soft   | ブルベ夏 | ソフトサマー | くすみのある穏やかな色が得意 |
| summer | medium | ブルベ夏 | ミディアムサマー | 中間的な青みカラーが得意 |
| autumn | soft   | イエベ秋 | ソフトオータム | やわらかく落ち着いた暖色が得意 |
| autumn | warm   | イエベ秋 | ウォームオータム | 深みのある温かい色が得意 |
| autumn | muted  | イエベ秋 | ミューテッドオータム | くすみのあるアースカラーが得意 |
| autumn | deep   | イエベ秋 | ディープオータム | 深く濃い暖色が得意 |
| winter | clear  | ブルベ冬 | クリアウィンター | 鮮やかでシャープな色が得意 |
| winter | cool   | ブルベ冬 | クールウィンター | 冷たくクールな色が得意 |
| winter | deep   | ブルベ冬 | ディープウィンター | 深みのある強い色が得意 |
| winter | vivid  | ブルベ冬 | ビビッドウィンター | 原色・モノトーンが得意 |

### UIコンポーネント

```jsx
const SEASON_DISPLAY = {
  'spring-light':  { main: 'イエベ春', sub: 'ライトスプリング',   color: '#F59E0B', emoji: '🌸' },
  'spring-warm':   { main: 'イエベ春', sub: 'ウォームスプリング', color: '#F59E0B', emoji: '🌸' },
  'spring-clear':  { main: 'イエベ春', sub: 'クリアスプリング',   color: '#F59E0B', emoji: '🌸' },
  'spring-muted':  { main: 'イエベ春', sub: 'ソフトスプリング',   color: '#F59E0B', emoji: '🌸' },
  'summer-light':  { main: 'ブルベ夏', sub: 'ライトサマー',       color: '#94A3B8', emoji: '🌿' },
  'summer-cool':   { main: 'ブルベ夏', sub: 'クールサマー',       color: '#94A3B8', emoji: '🌿' },
  'summer-soft':   { main: 'ブルベ夏', sub: 'ソフトサマー',       color: '#94A3B8', emoji: '🌿' },
  'summer-medium': { main: 'ブルベ夏', sub: 'ミディアムサマー',   color: '#94A3B8', emoji: '🌿' },
  'autumn-soft':   { main: 'イエベ秋', sub: 'ソフトオータム',     color: '#D97706', emoji: '🍂' },
  'autumn-warm':   { main: 'イベ秋',   sub: 'ウォームオータム',   color: '#D97706', emoji: '🍂' },
  'autumn-muted':  { main: 'イエベ秋', sub: 'ミューテッドオータム', color: '#D97706', emoji: '🍂' },
  'autumn-deep':   { main: 'イエベ秋', sub: 'ディープオータム',   color: '#D97706', emoji: '🍂' },
  'winter-clear':  { main: 'ブルベ冬', sub: 'クリアウィンター',   color: '#6366F1', emoji: '❄️' },
  'winter-cool':   { main: 'ブルベ冬', sub: 'クールウィンター',   color: '#6366F1', emoji: '❄️' },
  'winter-deep':   { main: 'ブルベ冬', sub: 'ディープウィンター', color: '#6366F1', emoji: '❄️' },
  'winter-vivid':  { main: 'ブルベ冬', sub: 'ビビッドウィンター', color: '#6366F1', emoji: '❄️' },
};

// 結果バッジ
const info = SEASON_DISPLAY[`${season}-${tone}`];
<div style={{
  background: info.color + '20',
  border: `2px solid ${info.color}`,
  borderRadius: 16, padding: '12px 20px',
  display: 'flex', alignItems: 'center', gap: 12,
}}>
  <span style={{ fontSize: 32 }}>{info.emoji}</span>
  <div>
    <div style={{ fontSize: 11, color: '#64748b' }}>パーソナルカラー</div>
    <div style={{ fontSize: 22, fontWeight: 800, color: '#1e293b' }}>
      {info.main}
    </div>
    <div style={{ fontSize: 13, color: info.color, fontWeight: 600 }}>
      {info.sub}
    </div>
    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
      {SEASON_DISPLAY[`${season}-${tone}`].desc}
    </div>
  </div>
</div>
```

### キラリのセリフ（メイン表記に合わせて更新）

```js
const SEASON_KIRARI = {
  spring: 'イエベ春タイプだよ🌸 コーラルやピーチ系が得意なの♪',
  summer: 'ブルベ夏タイプだよ🌿 ローズやラベンダー系が似合うよ♪',
  autumn: 'イエベ秋タイプだよ🍂 テラコッタやブラウン系がドンピシャ♪',
  winter: 'ブルベ冬タイプだよ❄️ ビビッドカラーやバーガンディが映えるよ♪',
};
```

### アイシャドウとの連携（パーソナルカラー連動）

```js
// SEASON_LOOK_MAPのeyeshadow色をパーソナルカラーで絞り込む
const getRecommendedEyeshadows = (season) =>
  products
    .filter(p => p.category === 'eyeshadow' && p.season === season)
    .sort((a, b) => 0); // レコメンド順はそのまま

// ArTryOnScreenでアイシャドウタブを開いたとき
// パーソナルカラーに合う商品が上位に来るよう並び替え
```
