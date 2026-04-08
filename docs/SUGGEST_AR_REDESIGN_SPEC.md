# メイク提案＋ARトライオン 改修仕様書

> Claude Code はこのファイルを読んで実装する。
> `docs/SUGGEST_AR_REDESIGN_SPEC.md` に配置してpushすること。
> 既存ファイルへの差分修正。新規ファイルは `makeupLooks.js` の追記のみ。

---

## 概要

### 変更の目的

現状は「BaseかColorかどちらかを選ぶ」タブ構造だが、
実際のメイクはBase（下地）→ Color（仕上げ）の順に重ねるもの。
これを体験に組み込む。

### 変更後のフロー

```
SuggestScreen
  ├─ [ヒーローカード] PC×スコアから1組を自動選定（Base＋Color）
  │     └─「これで試す →」→ ARへ（両方プリセット済み）
  └─ [他のルックも見る ▼] タブ探索（Base / Color / Skin care）
        └─ カードタップ → ARへ（タップしたルック＋もう一方は推薦値）

ARTryOnScreen
  カテゴリパネル: [ 🧴 ベース | 💄 リップ | 🌸 チーク | 👓 メガネ | 💍 イヤリング ]
  Base / Color が同時にレンダリングされる（レイヤー合成）

ResultScreen
  KIREI SELECT にベース商品＋カラー商品が混在表示
```

---

## 1. makeupLooks.js — 推薦ロジック追加

ファイル末尾に以下を追記する。既存データは変更しない。

```js
// src/data/makeupLooks.js 末尾に追記

/**
 * PC×スコアからベース＋カラーの組み合わせを1つ推薦する。
 *
 * @param {object|null} personalColor  analyzePersonalColor() の戻り値
 * @param {object|null} skinScores     { tone, pores, dullness } スコアオブジェクト
 * @returns {{ baseLook, colorLook }}
 */
export function recommendLooks(personalColor, skinScores) {
  const season      = personalColor?.season ?? null;
  const dullness    = skinScores?.dullness?.score ?? 70;
  const tone        = skinScores?.tone?.score    ?? 70;
  const needsCoverage = dullness < 60 || tone < 60;

  // ── Base 選択 ──────────────────────────────────────────
  // 1. PCに合う かつ カバー力条件を満たすルック
  // 2. PCに合うルック（カバー力不問）
  // 3. フォールバック: 先頭
  const baseCandidates = season
    ? BASE_LOOKS.filter(l => l.pcSeasons.includes(season))
    : BASE_LOOKS;

  let baseLook;
  if (needsCoverage) {
    // weekend-fresh はカバー力が低いので除外
    baseLook = baseCandidates.find(l => l.id !== 'weekend-fresh')
            ?? BASE_LOOKS.find(l => l.id !== 'weekend-fresh')
            ?? BASE_LOOKS[0];
  } else {
    baseLook = baseCandidates[0] ?? BASE_LOOKS[0];
  }

  // ── Color 選択 ─────────────────────────────────────────
  // PCに合う最初のルック、なければ先頭
  const colorLook = (season
    ? COLOR_LOOKS.find(l => l.pcSeasons.includes(season))
    : null) ?? COLOR_LOOKS[0];

  return { baseLook, colorLook };
}
```

---

## 2. SuggestScreen.jsx — 全面改修

### 2-1. props 変更

```js
// 変更前
export default function SuggestScreen({ skinScores, personalColor, onSelectLook, onSkipToResult })

// 変更後（引数追加なし。内部ロジックのみ変更）
```

### 2-2. state 追加

```js
const [explorerOpen, setExplorerOpen] = useState(false); // 「他のルックも見る」開閉
const [explorerTab, setExplorerTab]   = useState(0);     // 0=Base 1=Color 2=Skincare
```

### 2-3. 推薦ルック計算

```js
import { COLOR_LOOKS, BASE_LOOKS, recommendLooks } from '../data/makeupLooks.js';

// コンポーネント内
const { baseLook, colorLook } = recommendLooks(personalColor, skinScores);
```

### 2-4. onSelectLook の呼び出し形式変更

`onSelectLook` に渡すオブジェクトを変更する。

```js
// ヒーローカードの「これで試す」
onSelectLook({ baseLook, colorLook })

// エクスプローラーでBaseルックをタップ
onSelectLook({ baseLook: tappedLook, colorLook })  // colorLookは推薦値を維持

// エクスプローラーでColorルックをタップ
onSelectLook({ baseLook, colorLook: tappedLook })  // baseLookは推薦値を維持

// Skin care タブ
onSkipToResult(2)  // 変更なし
```

### 2-5. 画面構成 JSX

```jsx
export default function SuggestScreen({ skinScores, personalColor, onSelectLook, onSkipToResult }) {
  const { t } = useT();
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [explorerTab, setExplorerTab]   = useState(0); // 0=Base 1=Color 2=Skincare

  const { baseLook, colorLook } = recommendLooks(personalColor, skinScores);

  return (
    <div style={{ padding: '12px 0', minHeight: '100%' }}>

      {/* ── ヒーローカード ── */}
      <HeroCard
        baseLook={baseLook}
        colorLook={colorLook}
        personalColor={personalColor}
        skinScores={skinScores}
        onTry={() => onSelectLook({ baseLook, colorLook })}
        t={t}
      />

      {/* ── 「他のルックも見る」トグル ── */}
      <button
        onClick={() => setExplorerOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 6, width: '100%', padding: '10px 0',
          background: 'none', border: 'none',
          fontSize: 12, fontWeight: 600, color: '#94a3b8', cursor: 'pointer',
        }}
      >
        {explorerOpen ? '▲' : '▼'} {t('suggest.see_other_looks')}
      </button>

      {/* ── エクスプローラー（開いているときのみ） ── */}
      {explorerOpen && (
        <div style={{ padding: '0 16px' }}>
          {/* タブ: Base / Color / Skin care */}
          <ExplorerTabs tab={explorerTab} setTab={setExplorerTab} t={t} />

          {/* Base タブ */}
          {explorerTab === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {sortLooksByPc(BASE_LOOKS, personalColor).map(look => (
                <SmallLookCard
                  key={look.id}
                  look={look}
                  personalColor={personalColor}
                  isActive={look.id === baseLook.id}
                  onSelect={() => onSelectLook({ baseLook: look, colorLook })}
                  t={t}
                />
              ))}
            </div>
          )}

          {/* Color タブ */}
          {explorerTab === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {sortLooksByPc(COLOR_LOOKS, personalColor).map(look => (
                <SmallLookCard
                  key={look.id}
                  look={look}
                  personalColor={personalColor}
                  isActive={look.id === colorLook.id}
                  onSelect={() => onSelectLook({ baseLook, colorLook: look })}
                  t={t}
                />
              ))}
            </div>
          )}

          {/* Skin care タブ */}
          {explorerTab === 2 && (
            <SkincareRoutineView onNext={() => onSkipToResult(2)} />
          )}
        </div>
      )}
    </div>
  );
}
```

### 2-6. HeroCard コンポーネント

```jsx
function HeroCard({ baseLook, colorLook, personalColor, skinScores, onTry, t }) {
  const pcColors = personalColor ? getPcColors(personalColor.season) : null;
  const pcIcon = { spring: '🌸', summer: '🌊', autumn: '🍂', winter: '❄️' };

  // カラースウォッチ: colorLookから取得
  const swatches = [colorLook.lip, colorLook.cheek, colorLook.eyeshadow].filter(Boolean);

  // 推薦理由を動的生成
  const reason = buildHeroReason(personalColor, skinScores, baseLook, colorLook, t);

  return (
    <div style={{ margin: '0 16px 8px' }}>

      {/* キラリ + 吹き出し */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
        <Kirari size={36} expression="sparkle" />
        <Bubble>
          <p style={{ fontSize: 12, color: '#334155', margin: 0, lineHeight: 1.6 }}>
            {reason}
          </p>
        </Bubble>
      </div>

      {/* ヒーローカード本体 */}
      <div style={{
        background: 'linear-gradient(135deg, #faf5ff, #fdf2f8)',
        borderRadius: 20, padding: '16px',
        border: '1.5px solid #ede9fe',
        boxShadow: '0 4px 16px rgba(139,92,246,0.10)',
      }}>
        {/* PCバッジ */}
        {pcColors && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: pcColors.bg, border: `1px solid ${pcColors.border}`,
            borderRadius: 20, padding: '3px 10px', marginBottom: 10,
          }}>
            <span style={{ fontSize: 11 }}>
              {pcIcon[personalColor.season] ?? '✨'}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: pcColors.color }}>
              {personalColor.label[t('lang')] ?? personalColor.label.ja} {t('suggest.recommended')}
            </span>
          </div>
        )}

        {/* ルック名 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <div>
            <p style={{ fontSize: 10, color: '#94a3b8', margin: '0 0 2px' }}>
              {t('suggest.hero_base')}: {t(baseLook.name)}
            </p>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#334155', margin: 0 }}>
              {t(colorLook.name)}
            </p>
          </div>
          {/* カラースウォッチ */}
          <div style={{ display: 'flex', gap: 4 }}>
            {swatches.map((c, i) => (
              <div key={i} style={{
                width: 26, height: 26, borderRadius: '50%', background: c,
                border: '2px solid rgba(255,255,255,0.8)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
              }} />
            ))}
          </div>
        </div>

        <p style={{ fontSize: 11, color: '#7c3aed', margin: '4px 0 12px', fontStyle: 'italic' }}>
          {t(colorLook.reason)}
        </p>

        {/* CTA */}
        <button
          onClick={onTry}
          style={{
            width: '100%', padding: 14,
            background: 'linear-gradient(135deg, #a855f7, #ec4899)',
            border: 'none', borderRadius: 14,
            fontSize: 14, fontWeight: 700, color: '#fff',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(168,85,247,0.3)',
          }}
        >
          {t('suggest.try_this')} →
        </button>
      </div>
    </div>
  );
}

// 推薦理由の動的生成
function buildHeroReason(personalColor, skinScores, baseLook, colorLook, t) {
  const dullness = skinScores?.dullness?.score ?? 70;
  const season   = personalColor?.season;
  const label    = personalColor?.label?.[t('lang')] ?? personalColor?.label?.ja ?? '';

  if (dullness < 60 && season) {
    return t('suggest.hero_reason_dullness', { pc: label, base: t(baseLook.name), color: t(colorLook.name) });
  }
  if (season) {
    return t('suggest.hero_reason_pc', { pc: label, color: t(colorLook.name) });
  }
  return t('suggest.hero_reason_default', { color: t(colorLook.name) });
}
```

### 2-7. SmallLookCard コンポーネント

エクスプローラー用のコンパクトなカード。既存 `LookCard` より小さい。

```jsx
function SmallLookCard({ look, personalColor, isActive, onSelect, t }) {
  const isColorLook = !!(look.lip || look.eyeshadow); // colorLookの判定
  const swatches = isColorLook
    ? [look.lip, look.cheek, look.eyeshadow].filter(Boolean)
    : [look.base, look.concealer].filter(Boolean);
  const pcMatch  = personalColor && look.pcSeasons?.includes(personalColor.season);
  const pcColors = pcMatch ? getPcColors(personalColor.season) : null;

  return (
    <div
      onClick={onSelect}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: '#fff', borderRadius: 14, padding: '10px 14px',
        border: isActive ? '2px solid #a855f7' : '1px solid #ede9fe',
        boxShadow: isActive
          ? '0 0 0 3px rgba(168,85,247,0.1)'
          : '0 1px 4px rgba(139,92,246,0.06)',
        cursor: 'pointer', transition: 'all 0.15s',
      }}
    >
      {/* スウォッチ群 */}
      <div style={{ display: 'flex', gap: 3 }}>
        {swatches.map((c, i) => (
          <div key={i} style={{
            width: 20, height: 20, borderRadius: '50%', background: c,
            border: '1.5px solid rgba(0,0,0,0.06)',
          }} />
        ))}
      </div>

      {/* 名前 + reason */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 13, fontWeight: 700, color: '#334155',
          margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {t(look.name)}
        </p>
        <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>
          {look.products.reduce((s, p) => s + p.price, 0).toLocaleString()}
        </p>
      </div>

      {/* PCバッジ or チェック */}
      {pcColors && !isActive && (
        <span style={{
          fontSize: 10, fontWeight: 600, color: pcColors.color,
          background: pcColors.bg, borderRadius: 8, padding: '2px 6px',
          border: `1px solid ${pcColors.border}`,
        }}>✨</span>
      )}
      {isActive && (
        <span style={{ fontSize: 16, color: '#a855f7' }}>✓</span>
      )}
    </div>
  );
}
```

### 2-8. ExplorerTabs コンポーネント

```jsx
function ExplorerTabs({ tab, setTab, t }) {
  const tabs = [t('suggest.tab_base'), t('suggest.tab_color'), t('suggest.tab_skincare')];
  return (
    <div style={{
      display: 'flex', marginBottom: 10, borderRadius: 12,
      overflow: 'hidden', border: '1px solid #e2e8f0',
    }}>
      {tabs.map((label, i) => (
        <button key={i} onClick={() => setTab(i)} style={{
          flex: 1, padding: '9px 0', fontSize: 12,
          fontWeight: tab === i ? 700 : 400,
          background: tab === i ? '#fff' : 'transparent',
          color: tab === i ? '#a855f7' : '#94a3b8',
          border: 'none', borderRight: i < 2 ? '1px solid #e2e8f0' : 'none',
          cursor: 'pointer',
        }}>
          {label}
        </button>
      ))}
    </div>
  );
}
```

---

## 3. App.jsx — lookRef 拡張

```js
// 変更前
const lookRef = useRef({ selectedLook: null, styleTab: 0 });

// 変更後
const lookRef = useRef({ baseLook: null, colorLook: null, styleTab: 0,
                         capturedImage: null, products: null });

// handleSelectLook
const handleSelectLook = useCallback(({ baseLook, colorLook }) => {
  lookRef.current = { ...lookRef.current, baseLook, colorLook, styleTab: 1 };
  // styleTab は不要になるが後方互換のため 1 (Color) を保持
  setScreen('ar');
}, []);

// handleArDecide
const handleArDecide = useCallback(({ capturedImage, baseLook, colorLook, products }) => {
  lookRef.current = { ...lookRef.current,
    baseLook, colorLook, capturedImage, products };
  setScreen('result');
}, []);

// handleSkipToResult
const handleSkipToResult = useCallback((styleTab) => {
  lookRef.current = { ...lookRef.current, baseLook: null, colorLook: null, styleTab };
  setScreen('result');
}, []);
```

ArTryOnScreen への props:

```jsx
{screen === 'ar' && (
  <ArTryOnScreen
    baseLook={lookRef.current.baseLook}
    colorLook={lookRef.current.colorLook}
    personalColor={scoresRef.current.personalColor}
    onDecide={handleArDecide}
    onBack={() => setScreen('suggest')}
  />
)}
```

ResultScreen への props:

```jsx
{screen === 'result' && (
  <ResultScreen
    skinScores={scoresRef.current.skinScores}
    personalColor={scoresRef.current.personalColor}
    baseLook={lookRef.current.baseLook}
    colorLook={lookRef.current.colorLook}
    capturedImage={lookRef.current.capturedImage}
    products={lookRef.current.products}
    onRestart={handleRestart}
  />
)}
```

---

## 4. ArTryOnScreen.jsx — カテゴリパネル拡張

### 4-1. props 変更

```js
// 変更前
export default function ArTryOnScreen({ look, styleTab, personalColor, onDecide, onBack })

// 変更後
export default function ArTryOnScreen({ baseLook, colorLook, personalColor, onDecide, onBack })
```

### 4-2. CATEGORIES 変更

```js
// 変更前
const CATEGORIES = [
  { id: 'lip',     label: 'リップ',    icon: '💄' },
  { id: 'cheek',   label: 'チーク',    icon: '🌸' },
  { id: 'glasses', label: 'メガネ',    icon: '👓' },
  { id: 'earring', label: 'イヤリング', icon: '💍' },
];

// 変更後（Baseを先頭に追加）
const CATEGORIES = [
  { id: 'base',    label: 'ベース',    icon: '🧴' },
  { id: 'lip',     label: 'リップ',    icon: '💄' },
  { id: 'cheek',   label: 'チーク',    icon: '🌸' },
  { id: 'glasses', label: 'メガネ',    icon: '👓' },
  { id: 'earring', label: 'イヤリング', icon: '💍' },
];
```

### 4-3. state 変更

```js
// 変更前
const [lipColor, setLipColor] = useState(look?.lip || '#e8607c');
const [cheekColor, setCheekColor] = useState(look?.cheek || 'rgba(232,96,124,0.4)');
const isColor = styleTab === 0;

// 変更後
const [selectedBase, setSelectedBase] = useState(baseLook?.id ?? 'clean-natural');
const [lipColor, setLipColor]         = useState(colorLook?.lip    || '#e8607c');
const [cheekColor, setCheekColor]     = useState(colorLook?.cheek  || 'rgba(232,96,124,0.4)');

// activeCategory のデフォルトを 'base' に変更
const [activeCategory, setActiveCategory] = useState('base');
```

### 4-4. activeLook の構成変更

```js
// activeLookはBase + Colorの合成
const currentBase = BASE_LOOKS.find(l => l.id === selectedBase) ?? baseLook;
const activeLook = {
  // Baseレイヤー
  base:      currentBase?.base,
  concealer: currentBase?.concealer,
  brow:      currentBase?.brow,
  // Colorレイヤー（ユーザーが調整したlip/cheekを使う）
  lip:        lipColor,
  cheek:      cheekColor,
  eyeshadow:  colorLook?.eyeshadow || 'rgba(232,150,120,0.2)',
};

// MakeupCanvas には styleTab=0（Color）を渡しつつ Base も描画するために
// MakeupCanvas の props に baseLook を追加する（後述）
```

### 4-5. Baseカテゴリパネル UI

```jsx
{/* Base switcher */}
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
        {/* ベースカラーのスウォッチ */}
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: item.base || item.brow || '#e8d8c8',
          border: '1.5px solid rgba(0,0,0,0.06)', flexShrink: 0,
        }} />
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#334155', margin: 0 }}>
            {t(item.name)}
          </p>
          <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>
            {t(item.desc)}
          </p>
        </div>
        {selectedBase === item.id && (
          <span style={{ marginLeft: 'auto', fontSize: 16, color: '#a855f7' }}>✓</span>
        )}
      </button>
    ))}
  </div>
)}
```

### 4-6. handleDecide 変更

```js
const handleDecide = () => {
  // ... 既存のキャプチャ処理（変更なし） ...

  const currentBase = BASE_LOOKS.find(l => l.id === selectedBase) ?? baseLook;

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
```

### 4-7. ルックバッジ表示

ARプレビュー左上のバッジ表示を更新する。

```jsx
// 変更前: look名 1つ
// 変更後: Base + Color の2段表示
<div style={{ ... }}>
  <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', margin: '0 0 1px' }}>
    {t(currentBase?.name ?? baseLook?.name)}
  </p>
  <p style={{ fontSize: 11, fontWeight: 700, margin: 0, color: '#fff' }}>
    {t(colorLook?.name)}
  </p>
</div>
```

---

## 5. MakeupCanvas.jsx — Base レイヤー常時描画

現状は `styleTab` で Base か Color かを切り替えているが、
常に Base → Color の順で描画するよう変更する。

### props 変更

```js
// 変更前
<MakeupCanvas look={activeLook} styleTab={styleTab} intensity={intensity} ... />

// 変更後: styleTab 廃止、baseLook と colorLook を個別に受け取る
<MakeupCanvas
  ref={canvasRef}
  getVideo={getVideo}
  baseLook={currentBase}    // 常に描画
  colorLook={activeLook}    // 常に描画
  intensity={intensity}
  showMesh={showMesh}
  glassesItem={glassesItem}
  earringItem={earringItem}
/>
```

### 描画順序

```js
// MakeupCanvas の rAF ループ内
// 1. ベース（ファンデ・コンシーラー）
if (baseLook) {
  drawBase(ctx, landmarks, baseLook, intensity);
}
// 2. カラー（アイシャドウ・チーク・リップ・眉）
if (colorLook) {
  drawColorMakeup(ctx, landmarks, colorLook, intensity);
}
// 3. アクセサリー
drawGlasses(ctx, landmarks, glassesItem, ...);
drawEarrings(ctx, landmarks, earringItem, ...);
```

`drawBase` と `drawColorMakeup` は既存の描画関数を分離して使用。
`makeupRenderer.js` にある既存の関数をタイプ別に整理すること。

---

## 6. ResultScreen.jsx — Base＋Color統合表示

### props 変更

```js
// 変更前
export default function ResultScreen({ skinScores, personalColor, styleTab, selectedLook,
                                       capturedImage, products, onRestart })

// 変更後
export default function ResultScreen({ skinScores, personalColor,
                                       baseLook, colorLook,        // ← 追加
                                       capturedImage, products, onRestart })
```

### KIREI SELECT 表示

`products` prop が渡されている場合はそのまま使用（ARキャプチャ時）。
`products` が null の場合（Skin care スキップ時など）は表示しない。

```jsx
// ルック名表示の更新
const lookDisplayName = colorLook?.name
  ? t(colorLook.name)
  : baseLook?.name ? t(baseLook.name) : 'Today\'s Look';

// カテゴリバッジ
<span style={{ ... }}>
  {baseLook && colorLook
    ? `Base + Color makeup`
    : baseLook ? 'Base makeup' : 'Color makeup'}
</span>

// カラースウォッチ: colorLookから取得
const swatches = colorLook
  ? [colorLook.lip, colorLook.cheek, colorLook.eyeshadow].filter(Boolean)
  : [];
```

---

## 7. i18n 追加キー

`ja.js` / `en.js` / `ko.js` に以下を追加する。

```js
// ja.js
'suggest.see_other_looks':    '他のルックも見る',
'suggest.recommended':        'おすすめ',
'suggest.try_this':           'これで試す',
'suggest.hero_base':          'ベース',
'suggest.tab_base':           'Base',
'suggest.tab_color':          'Color',
'suggest.tab_skincare':       'Skin care',
'suggest.hero_reason_dullness': '{pc}タイプのあなたに、{base}でくすみをカバーして{color}で仕上げる組み合わせだよ♪',
'suggest.hero_reason_pc':    '{pc}タイプにぴったりな{color}をチョイスしたよ♪',
'suggest.hero_reason_default': 'あなたの肌に合わせて{color}を選んだよ♪',

// en.js
'suggest.see_other_looks':    'See other looks',
'suggest.recommended':        'recommended',
'suggest.try_this':           'Try this look',
// ... etc

// ko.js
'suggest.see_other_looks':    '다른 룩도 보기',
'suggest.recommended':        '추천',
'suggest.try_this':           '이 룩으로 시도하기',
// ... etc
```

---

## 8. 実装順序

1. `makeupLooks.js` に `recommendLooks()` を追記
2. `MakeupCanvas.jsx` を `baseLook` / `colorLook` の2props 受け取りに変更し、描画順序を整理
3. `ArTryOnScreen.jsx` を props・state・カテゴリパネル・handleDecide 変更
4. `App.jsx` の `lookRef`・`handleSelectLook`・`handleArDecide`・各画面props を変更
5. `SuggestScreen.jsx` を HeroCard + エクスプローラー構成に全面改修
6. `ResultScreen.jsx` の props と表示ロジックを更新
7. `i18n/ja.js` / `en.js` / `ko.js` にキーを追加
8. デプロイ・動作確認

### コミット単位

```
feat: makeupLooks — recommendLooks() 追加（PC×スコアからBase+Color自動選定）
refactor: MakeupCanvas — baseLook/colorLook 2レイヤー描画に変更（styleTab廃止）
refactor: ArTryOnScreen — Baseカテゴリパネル追加、baseLook/colorLook props対応
refactor: App — lookRef拡張（baseLook/colorLook分離）、handleSelectLook変更
feat: SuggestScreen — ヒーローカード＋エクスプローラー構成に全面改修
refactor: ResultScreen — baseLook/colorLook統合表示
feat: i18n — SuggestScreen改修に伴うキー追加
```

---

## 9. 検証チェックリスト

- [ ] SuggestScreen にヒーローカードが表示される
- [ ] ヒーローカードの推薦ルックがPCタイプ・くすみスコアに応じて変化する
- [ ] 「他のルックも見る」をタップするとエクスプローラーが開閉する
- [ ] エクスプローラーのタブ順が Base / Color / Skin care になっている
- [ ] エクスプローラーでBaseカードをタップするとARにそのBaseが引き継がれる
- [ ] エクスプローラーでColorカードをタップするとARにそのColorが引き継がれる
- [ ] ARトライオンのカテゴリパネル先頭が「🧴 ベース」になっている
- [ ] ARでベースカテゴリ選択中、別のBaseルックに切り替えるとCanvasが更新される
- [ ] ARでリップを変えてもBaseレイヤーが消えない（両方が同時描画される）
- [ ] 「このメイクで決定」でキャプチャされた画像にBaseとColorが両方写っている
- [ ] ResultScreenのKIREI SELECTにBase商品とColor商品が両方表示される
- [ ] Skin careタブは従来通り（ARスキップ）動作する
- [ ] `personalColor === null` の場合でもヒーローカードが表示される（フォールバック）
- [ ] JA / EN / KO すべての言語で表示が崩れない
