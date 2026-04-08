# KIREI 未実装まとめ修正仕様書

> Claude Code はこのファイル1本を読んで実装する。
> `docs/FIX_SPEC.md` に配置してpushすること。
> 既存の SUGGEST_AR_REDESIGN_SPEC / SUGGEST_AR_REDESIGN_SPEC_UPDATE /
> SKINCARE_AR_SPEC の内容をこのファイルに統合している。

---

## 未実装一覧

| # | ファイル | 内容 |
|---|---|---|
| 1 | `MirrorScreenV3.jsx` | ボタン1本→2本（スキンケア優先） |
| 2 | `App.jsx` | mode ルーティング・skincare-ar 画面追加 |
| 3 | `makeupLooks.js` | `recommendLooks()` 追記 |
| 4 | `SuggestScreen.jsx` | ヒーローカード＋2タブ化（Skin care 廃止） |
| 5 | `ArTryOnScreen.jsx` | ベースカテゴリタブを先頭に追加 |
| 6 | `ResultScreen.jsx` | スキンケアCTAカード追加 |
| 7 | `SkincareARScreen.jsx` | 新規作成（2週間後プレビュー） |
| 8 | `SkincareRoutineView.jsx` | `skinScores` props・「なぜ2週間？」追加 |
| 9 | `i18n/ja.js` / `en.js` / `ko.js` | 新規キー追加 |

実装順序は上記 # 順に従うこと。

---

## 1. MirrorScreenV3.jsx

### 変更箇所

`skinScores` が存在するときのボタン表示部分（現在の「結果を見る →」1本）を2本に差し替える。

```jsx
// 変更前
<button
  className="btn-primary"
  onClick={() => onResult({ skinScores, personalColor, dentalScores: null })}
  style={{ width: '100%', padding: 12,
    background: 'linear-gradient(135deg, #a855f7, #ec4899)',
    border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700,
    color: '#fff', cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(168,85,247,0.3)' }}
>
  {t('mirror.view_result')}
</button>

// 変更後（2ボタン）
<button
  onClick={() => onResult({ skinScores, personalColor, mode: 'skincare' })}
  style={{ width: '100%', padding: 14, marginBottom: 8,
    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
    border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700,
    color: '#fff', cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(34,197,94,0.3)' }}
>
  {t('mirror.start_skincare')}
</button>
<button
  onClick={() => onResult({ skinScores, personalColor, mode: 'makeup' })}
  style={{ width: '100%', padding: 11,
    background: 'rgba(255,255,255,0.85)',
    border: '1px solid rgba(168,85,247,0.3)',
    borderRadius: 14, fontSize: 13, fontWeight: 600,
    color: '#a855f7', cursor: 'pointer' }}
>
  {t('mirror.try_makeup')}
</button>
```

---

## 2. App.jsx

### 2-1. handleResult に mode ルーティングを追加

```js
// 変更前
const handleResult = useCallback(({ skinScores, personalColor }) => {
  scoresRef.current = { skinScores, personalColor };
  setScreen('suggest');
}, []);

// 変更後
const handleResult = useCallback(({ skinScores, personalColor, mode }) => {
  scoresRef.current = { skinScores, personalColor };
  setScreen(mode === 'skincare' ? 'skincare-ar' : 'suggest');
}, []);
```

### 2-2. handleSkipToResult を削除

SuggestScreen から Skin care タブが廃止されるため不要。

### 2-3. 新規ハンドラー追加

```js
const handleSkincareARNext = useCallback(() => {
  setScreen('skincare-routine');
}, []);

const handleSkincareBack = useCallback(() => {
  // スキンケアARへの入口が mirror か result かを問わず result へ戻す
  // mirror から直行した場合は mirror へ（prevScreenRef で管理）
  setScreen(prevScreenRef.current === 'mirror' ? 'mirror' : 'result');
}, []);
```

### 2-4. showScrollable に追加

```js
// 変更前
const showScrollable = screen === 'suggest' || screen === 'result' || screen === 'ar';

// 変更後
const showScrollable = screen === 'suggest' || screen === 'result'
                    || screen === 'ar' || screen === 'skincare-ar'
                    || screen === 'skincare-routine';
```

### 2-5. import 追加

```js
import SkincareARScreen from './components/SkincareARScreen.jsx';
```

### 2-6. 画面レンダリング追加

既存の `{screen === 'result' && ...}` の直後に追加する。

```jsx
{screen === 'skincare-ar' && (
  <SkincareARScreen
    skinScores={scoresRef.current.skinScores}
    onNext={handleSkincareARNext}
    onBack={handleSkincareBack}
  />
)}

{screen === 'skincare-routine' && (
  <div style={{ padding: '12px 0' }}>
    <button
      onClick={() => setScreen('skincare-ar')}
      style={{ background: 'none', border: 'none', fontSize: 13,
        color: '#94a3b8', cursor: 'pointer',
        padding: '0 16px 8px', fontWeight: 600 }}
    >
      {'<'} {t('skincare_ar.back_to_ar')}
    </button>
    <SkincareRoutineView
      skinScores={scoresRef.current.skinScores}
      onNext={() => setScreen('result')}
    />
  </div>
)}
```

### 2-7. ResultScreen に onSkincareAR を追加

```jsx
{screen === 'result' && (
  <ResultScreen
    skinScores={scoresRef.current.skinScores}
    personalColor={scoresRef.current.personalColor}
    onRestart={handleRestart}
    onSkincareAR={() => {           // ← 追加
      prevScreenRef.current = 'result';
      setScreen('skincare-ar');
    }}
    styleTab={lookRef.current.styleTab}
    selectedLook={lookRef.current.selectedLook}
    capturedImage={captureRef.current.capturedImage}
    products={captureRef.current.finalProducts}
  />
)}
```

### 2-8. SuggestScreen から onSkipToResult を削除

```jsx
// 変更前
<SuggestScreen
  skinScores={scoresRef.current.skinScores}
  personalColor={scoresRef.current.personalColor}
  onSelectLook={handleSelectLook}
  onSkipToResult={handleSkipToResult}
/>

// 変更後
<SuggestScreen
  skinScores={scoresRef.current.skinScores}
  personalColor={scoresRef.current.personalColor}
  onSelectLook={handleSelectLook}
/>
```

---

## 3. makeupLooks.js

ファイル末尾に以下を追記する。既存データは変更しない。

```js
// src/data/makeupLooks.js 末尾に追記

/**
 * PC×スコアからBase＋Colorの組み合わせを1つ推薦する
 */
export function recommendLooks(personalColor, skinScores) {
  const season = personalColor?.season ?? null;
  const dullness = skinScores?.dullness?.score ?? 70;
  const tone     = skinScores?.tone?.score     ?? 70;
  const needsCoverage = dullness < 60 || tone < 60;

  // Base 選択
  const baseCandidates = season
    ? BASE_LOOKS.filter(l => l.pcSeasons.includes(season))
    : BASE_LOOKS;

  const baseLook = needsCoverage
    ? (baseCandidates.find(l => l.id !== 'weekend-fresh')
       ?? BASE_LOOKS.find(l => l.id !== 'weekend-fresh')
       ?? BASE_LOOKS[0])
    : (baseCandidates[0] ?? BASE_LOOKS[0]);

  // Color 選択
  const colorLook = (season
    ? COLOR_LOOKS.find(l => l.pcSeasons.includes(season))
    : null) ?? COLOR_LOOKS[0];

  return { baseLook, colorLook };
}
```

---

## 4. SuggestScreen.jsx

### 4-1. 全体方針

- タブを **Base / Color の2タブ**に変更（Skin care 廃止）
- **ヒーローカード**をトップに配置（PC×スコアから1組推薦）
- ヒーローカードの下に**「他のルックも見る ▼」**エクスプローラー
- `onSkipToResult` prop を削除

### 4-2. import 変更

```js
// 追加
import { COLOR_LOOKS, BASE_LOOKS, recommendLooks } from '../data/makeupLooks.js';
import { getPcColors } from '../analysis/personalColor.js';

// 削除
import SkincareRoutineView from './SkincareRoutineView.jsx';
```

### 4-3. props 変更

```js
// 変更前
export default function SuggestScreen({ skinScores, personalColor, onSelectLook, onSkipToResult })

// 変更後
export default function SuggestScreen({ skinScores, personalColor, onSelectLook })
```

### 4-4. state 変更

```js
// 変更前
const [styleTab, setStyleTab] = useState(() => {
  const saved = localStorage.getItem('kirei_style_tab');
  return saved !== null ? Number(saved) : 0;
});

// 変更後（タブ0=Base、タブ1=Color。旧インデックス2は0にリセット）
const [styleTab, setStyleTab] = useState(() => {
  const saved = localStorage.getItem('kirei_style_tab');
  const n = saved !== null ? Number(saved) : 0;
  return n > 1 ? 0 : n;
});
const [explorerOpen, setExplorerOpen] = useState(false);
const [explorerTab, setExplorerTab]   = useState(0); // 0=Base 1=Color
```

### 4-5. JSX 全体構成

```jsx
export default function SuggestScreen({ skinScores, personalColor, onSelectLook }) {
  const { t } = useT();
  const [styleTab, setStyleTab] = useState(() => {
    const saved = localStorage.getItem('kirei_style_tab');
    const n = saved !== null ? Number(saved) : 0;
    return n > 1 ? 0 : n;
  });
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [explorerTab, setExplorerTab]   = useState(0);

  useEffect(() => {
    localStorage.setItem('kirei_style_tab', String(styleTab));
  }, [styleTab]);

  const { baseLook, colorLook } = recommendLooks(personalColor, skinScores);

  return (
    <div style={{ padding: '12px 0', minHeight: '100%' }}>

      {/* ヒーローカード */}
      <HeroCard
        baseLook={baseLook}
        colorLook={colorLook}
        personalColor={personalColor}
        skinScores={skinScores}
        onTry={() => onSelectLook({ baseLook, colorLook })}
        t={t}
      />

      {/* 「他のルックも見る」トグル */}
      <button
        onClick={() => setExplorerOpen(v => !v)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 6, width: '100%', padding: '10px 0',
          background: 'none', border: 'none',
          fontSize: 12, fontWeight: 600, color: '#94a3b8', cursor: 'pointer' }}
      >
        {explorerOpen ? '▲' : '▼'} {t('suggest.see_other_looks')}
      </button>

      {/* エクスプローラー */}
      {explorerOpen && (
        <div style={{ padding: '0 16px' }}>
          {/* タブ: Base / Color */}
          <div style={{ display: 'flex', marginBottom: 10, borderRadius: 12,
            overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            {[t('suggest.tab_base'), t('suggest.tab_color')].map((label, i) => (
              <button key={i} onClick={() => setExplorerTab(i)} style={{
                flex: 1, padding: '9px 0', fontSize: 12,
                fontWeight: explorerTab === i ? 700 : 400,
                background: explorerTab === i ? '#fff' : 'transparent',
                color: explorerTab === i ? '#a855f7' : '#94a3b8',
                border: 'none', borderRight: i === 0 ? '1px solid #e2e8f0' : 'none',
                cursor: 'pointer',
              }}>
                {label}
              </button>
            ))}
          </div>

          {/* Base カード一覧 */}
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

          {/* Color カード一覧 */}
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
        </div>
      )}
    </div>
  );
}
```

### 4-6. HeroCard コンポーネント

```jsx
function HeroCard({ baseLook, colorLook, personalColor, skinScores, onTry, t }) {
  const pcColors = personalColor ? getPcColors(personalColor.season) : null;
  const pcIcon   = { spring: '🌸', summer: '🌊', autumn: '🍂', winter: '❄️' };
  const swatches = [colorLook.lip, colorLook.cheek, colorLook.eyeshadow].filter(Boolean);
  const dullness = skinScores?.dullness?.score ?? 70;
  const pcLabel  = personalColor?.label?.ja ?? '';

  const reason = dullness < 60 && personalColor
    ? `${pcLabel}タイプのあなたに、${t(baseLook.name)}でくすみをカバーして${t(colorLook.name)}で仕上げる組み合わせだよ♪`
    : personalColor
      ? `${pcLabel}タイプにぴったりな${t(colorLook.name)}をチョイスしたよ♪`
      : `あなたの肌に合わせて${t(colorLook.name)}を選んだよ♪`;

  return (
    <div style={{ margin: '0 16px 8px' }}>
      {/* キラリ */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
        <Kirari size={36} expression="sparkle" />
        <Bubble>
          <p style={{ fontSize: 12, color: '#334155', margin: 0, lineHeight: 1.6 }}>
            {reason}
          </p>
        </Bubble>
      </div>

      {/* カード本体 */}
      <div style={{ background: 'linear-gradient(135deg, #faf5ff, #fdf2f8)',
        borderRadius: 20, padding: '16px',
        border: '1.5px solid #ede9fe',
        boxShadow: '0 4px 16px rgba(139,92,246,0.10)' }}>

        {/* PCバッジ */}
        {pcColors && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4,
            background: pcColors.bg, border: `1px solid ${pcColors.border}`,
            borderRadius: 20, padding: '3px 10px', marginBottom: 10 }}>
            <span style={{ fontSize: 11 }}>{pcIcon[personalColor.season]}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: pcColors.color }}>
              {personalColor.label.ja} おすすめ
            </span>
          </div>
        )}

        {/* ルック名 */}
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 4 }}>
          <div>
            <p style={{ fontSize: 10, color: '#94a3b8', margin: '0 0 2px' }}>
              Base: {t(baseLook.name)}
            </p>
            <p style={{ fontSize: 16, fontWeight: 800, color: '#334155', margin: 0 }}>
              {t(colorLook.name)}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {swatches.map((c, i) => (
              <div key={i} style={{ width: 26, height: 26, borderRadius: '50%',
                background: c, border: '2px solid rgba(255,255,255,0.8)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }} />
            ))}
          </div>
        </div>

        <p style={{ fontSize: 11, color: '#7c3aed', margin: '4px 0 12px', fontStyle: 'italic' }}>
          {t(colorLook.reason)}
        </p>

        <button onClick={onTry} style={{ width: '100%', padding: 14,
          background: 'linear-gradient(135deg, #a855f7, #ec4899)',
          border: 'none', borderRadius: 14,
          fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(168,85,247,0.3)' }}>
          これで試す →
        </button>
      </div>
    </div>
  );
}
```

### 4-7. SmallLookCard コンポーネント

```jsx
function SmallLookCard({ look, personalColor, isActive, onSelect, t }) {
  const isColorLook = !!(look.lip || look.eyeshadow);
  const swatches = isColorLook
    ? [look.lip, look.cheek, look.eyeshadow].filter(Boolean)
    : [look.base, look.concealer].filter(Boolean);
  const pcMatch  = personalColor && look.pcSeasons?.includes(personalColor.season);
  const pcColors = pcMatch ? getPcColors(personalColor.season) : null;

  return (
    <div onClick={onSelect} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: '#fff', borderRadius: 14, padding: '10px 14px',
      border: isActive ? '2px solid #a855f7' : '1px solid #ede9fe',
      boxShadow: isActive ? '0 0 0 3px rgba(168,85,247,0.1)'
                          : '0 1px 4px rgba(139,92,246,0.06)',
      cursor: 'pointer', transition: 'all 0.15s',
    }}>
      <div style={{ display: 'flex', gap: 3 }}>
        {swatches.map((c, i) => (
          <div key={i} style={{ width: 20, height: 20, borderRadius: '50%',
            background: c, border: '1.5px solid rgba(0,0,0,0.06)' }} />
        ))}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#334155', margin: 0,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {t(look.name)}
        </p>
        <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>
          ¥{look.products.reduce((s, p) => s + p.price, 0).toLocaleString()}
        </p>
      </div>
      {pcColors && !isActive && (
        <span style={{ fontSize: 10, fontWeight: 600, color: pcColors.color,
          background: pcColors.bg, borderRadius: 8, padding: '2px 6px',
          border: `1px solid ${pcColors.border}` }}>✨</span>
      )}
      {isActive && <span style={{ fontSize: 16, color: '#a855f7' }}>✓</span>}
    </div>
  );
}
```

### 4-8. App.jsx の handleSelectLook 変更

SuggestScreen が `{ baseLook, colorLook }` を渡すよう変わるため、App.jsx 側も更新する。

```js
// 変更前
const handleSelectLook = useCallback((look, styleTab) => {
  lookRef.current = { selectedLook: look, styleTab };
  setScreen('ar');
}, []);

// 変更後
const handleSelectLook = useCallback(({ baseLook, colorLook }) => {
  lookRef.current = { ...lookRef.current, baseLook, colorLook, styleTab: 1 };
  setScreen('ar');
}, []);
```

ArTryOnScreen への props も更新する。

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

---

## 5. ArTryOnScreen.jsx

### 5-1. CATEGORIES 先頭に Base を追加

```js
// 変更前
const CATEGORIES = [
  { id: 'lip',     label: 'リップ',    icon: '💄' },
  { id: 'cheek',   label: 'チーク',    icon: '🌸' },
  { id: 'glasses', label: 'メガネ',    icon: '👓' },
  { id: 'earring', label: 'イヤリング', icon: '💍' },
];

// 変更後
const CATEGORIES = [
  { id: 'base',    label: 'ベース',    icon: '🧴' },
  { id: 'lip',     label: 'リップ',    icon: '💄' },
  { id: 'cheek',   label: 'チーク',    icon: '🌸' },
  { id: 'glasses', label: 'メガネ',    icon: '👓' },
  { id: 'earring', label: 'イヤリング', icon: '💍' },
];
```

### 5-2. props 変更

```js
// 変更前
export default function ArTryOnScreen({ look, styleTab, personalColor, onDecide, onBack })

// 変更後
export default function ArTryOnScreen({ baseLook, colorLook, personalColor, onDecide, onBack })
```

### 5-3. state 変更

```js
// 追加
const [selectedBaseId, setSelectedBaseId] = useState(baseLook?.id ?? 'clean-natural');

// 変更
const [lipColor, setLipColor]     = useState(colorLook?.lip   || '#e8607c');
const [cheekColor, setCheekColor] = useState(colorLook?.cheek || 'rgba(232,96,124,0.4)');

// activeCategory のデフォルトを 'base' に
const [activeCategory, setActiveCategory] = useState('base');

// isColor / isBase の判定を削除（常に両レイヤーを描画するため不要）
```

### 5-4. activeLook の構成変更

```js
const currentBase  = BASE_LOOKS.find(l => l.id === selectedBaseId) ?? baseLook;
const activeLook   = {
  // Base レイヤー
  base:      currentBase?.base,
  concealer: currentBase?.concealer,
  brow:      currentBase?.brow,
  // Color レイヤー
  lip:       lipColor,
  cheek:     cheekColor,
  eyeshadow: colorLook?.eyeshadow || 'rgba(232,150,120,0.2)',
};
```

### 5-5. Baseカテゴリパネル UI（カテゴリタブ内）

```jsx
{activeCategory === 'base' && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {BASE_LOOKS.map(item => (
      <button key={item.id} onClick={() => setSelectedBaseId(item.id)} style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px', borderRadius: 10, textAlign: 'left',
        background: selectedBaseId === item.id
          ? 'rgba(168,85,247,0.12)' : 'rgba(139,92,246,0.04)',
        border: selectedBaseId === item.id
          ? '2px solid #a855f7' : '1px solid #ede9fe',
        cursor: 'pointer',
      }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%',
          background: item.base || item.brow || '#e8d8c8',
          border: '1.5px solid rgba(0,0,0,0.06)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#334155', margin: 0 }}>
            {t(item.name)}
          </p>
          <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>
            {t(item.desc)}
          </p>
        </div>
        {selectedBaseId === item.id && (
          <span style={{ color: '#a855f7', fontSize: 16 }}>✓</span>
        )}
      </button>
    ))}
  </div>
)}
```

`BASE_LOOKS` は `makeupLooks.js` から import する。

```js
import { BASE_LOOKS } from '../data/makeupLooks.js';
```

### 5-6. handleDecide 変更

```js
const handleDecide = () => {
  // ... 既存のキャプチャ処理（変更なし） ...

  onDecide({
    capturedImage: dataUrl,
    baseLook: currentBase,
    colorLook: { ...colorLook, lip: lipColor, cheek: cheekColor },
    products: [
      ...(currentBase?.products || []),
      ...(colorLook?.products   || []),
      ...accessoryProducts,
    ],
  });
};
```

### 5-7. ARバッジを2段表示に

```jsx
// 変更前（1行）
<p style={{ fontSize: 11, fontWeight: 700, ... }}>{lookName}</p>

// 変更後（2行）
<p style={{ fontSize: 8, color: 'rgba(255,255,255,0.6)', margin: '0 0 1px' }}>
  {t(currentBase?.name ?? baseLook?.name)}
</p>
<p style={{ fontSize: 11, fontWeight: 700, color: '#fff', margin: 0 }}>
  {t(colorLook?.name)}
</p>
```

### 5-8. MakeupCanvas への props 変更

```jsx
// 変更前
<MakeupCanvas
  ref={canvasRef}
  getVideo={getVideo}
  look={activeLook}
  styleTab={styleTab}
  ...
/>

// 変更後（styleTab を廃止し、activeLook に Base+Color を統合して渡す）
<MakeupCanvas
  ref={canvasRef}
  getVideo={getVideo}
  look={activeLook}      // base・concealer・brow・lip・cheek・eyeshadow をすべて含む
  styleTab={0}           // 常に Color モードで描画（Base は look の各プロパティで制御）
  intensity={intensity}
  showMesh={showMesh}
  glassesItem={glassesItem}
  earringItem={earringItem}
/>
```

**注意**: `MakeupCanvas` / `makeupRenderer.js` 側で Base 系プロパティ（base, concealer, brow）が
`look` に含まれていれば描画するよう実装されている前提。未実装の場合は
`makeupRenderer.js` の Base 描画関数を確認して対応すること。

### 5-9. handleArDecide の更新（App.jsx）

```js
const handleArDecide = useCallback(({ capturedImage, baseLook, colorLook, products }) => {
  captureRef.current = { capturedImage, finalProducts: products };
  lookRef.current = { ...lookRef.current, baseLook, colorLook };
  setScreen('result');
}, []);
```

---

## 6. ResultScreen.jsx

### 6-1. props 追加

```js
// 変更前
export default function ResultScreen({ skinScores, personalColor, onRestart, styleTab, selectedLook, capturedImage, products })

// 変更後
export default function ResultScreen({ skinScores, personalColor, onRestart, onSkincareAR,
                                       styleTab, selectedLook, baseLook, colorLook,
                                       capturedImage, products })
```

### 6-2. スキンケアCTAカードを追加

`===== 3. Coord hint + CTA =====` セクションの直後に挿入する。

```jsx
{/* ===== 3.5. スキンケアAR CTA ===== */}
{skinScores && onSkincareAR && (
  <div style={{ margin: '0 16px 12px', padding: '14px 16px',
    background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
    borderRadius: 18, border: '1px solid #bbf7d0' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
      <Kirari size={28} expression="sparkle" />
      <div>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#15803d', margin: '0 0 3px' }}>
          {t('result.skincare_cta_title')}
        </p>
        <p style={{ fontSize: 11, color: '#166534', margin: 0, lineHeight: 1.5 }}>
          {t('result.skincare_cta_desc')}
        </p>
      </div>
    </div>
    <button onClick={onSkincareAR} style={{
      width: '100%', padding: 12,
      background: 'linear-gradient(135deg, #22c55e, #16a34a)',
      border: 'none', borderRadius: 12,
      fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(34,197,94,0.3)',
    }}>
      {'✨'} {t('result.skincare_cta_btn')}
    </button>
  </div>
)}
```

---

## 7. SkincareARScreen.jsx（新規作成）

```jsx
// src/components/SkincareARScreen.jsx

import { useState, useEffect } from 'react';
import Kirari from './Kirari.jsx';
import Bubble from './Bubble.jsx';
import useCamera from '../hooks/useCamera.js';
import { useT } from '../i18n/index.jsx';

function computeFilter(skinScores, t) {
  const dullness = skinScores?.dullness?.score ?? 70;
  const tone     = skinScores?.tone?.score     ?? 70;
  const pores    = skinScores?.pores?.score    ?? 70;

  const dullnessGain   = ((100 - dullness) / 100) * 0.22;
  const saturationGain = ((100 - dullness) / 100) * 0.18;
  const contrastGain   = ((100 - tone)     / 100) * 0.12;
  const poresGain      = ((100 - pores)    / 100) * 0.08;

  return (t) => {
    const brightness = 1 + (dullnessGain + poresGain) * t;
    const contrast   = 1 + contrastGain  * t;
    const saturate   = 1 + saturationGain * t;
    return `brightness(${brightness.toFixed(3)}) contrast(${contrast.toFixed(3)}) saturate(${saturate.toFixed(3)})`;
  };
}

export default function SkincareARScreen({ skinScores, onNext, onBack }) {
  const { t } = useT();
  const [sliderValue, setSliderValue] = useState(100);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const { videoRef, isActive, error: cameraError } = useCamera({ enabled: true });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlaying = () => setVideoPlaying(true);
    if (video.readyState >= 2) { onPlaying(); return; }
    video.addEventListener('loadeddata', onPlaying);
    return () => video.removeEventListener('loadeddata', onPlaying);
  }, [isActive, videoRef]);

  const getFilter = computeFilter(skinScores);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.style.filter = getFilter(sliderValue / 100);
    video.style.transition = 'filter 0.15s ease';
  }, [sliderValue, videoRef]);

  const cameraLive = isActive && !cameraError && videoPlaying;
  const dullness   = skinScores?.dullness?.score ?? 70;
  const pores      = skinScores?.pores?.score    ?? 70;

  return (
    <div style={{ paddingBottom: 24 }}>

      {/* 戻るボタン */}
      <button onClick={onBack} style={{ background: 'none', border: 'none',
        fontSize: 13, color: '#94a3b8', cursor: 'pointer',
        padding: '8px 16px', fontWeight: 600 }}>
        {'<'} {t('skincare_ar.back')}
      </button>

      {/* カメラ映像 */}
      <div style={{ position: 'relative', margin: '0 16px 12px',
        borderRadius: 20, overflow: 'hidden', background: '#111',
        aspectRatio: cameraLive ? 'auto' : '3/4', maxHeight: '52vh' }}>
        <video ref={videoRef}
          style={{ width: '100%', height: '100%', objectFit: 'contain',
            transform: 'scaleX(-1)', display: cameraLive ? 'block' : 'none' }}
          playsInline muted autoPlay />

        {/* 状態ラベル */}
        <div style={{ position: 'absolute', top: 12, left: 12,
          background: sliderValue >= 50
            ? 'linear-gradient(135deg, rgba(34,197,94,0.85), rgba(22,163,74,0.85))'
            : 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(8px)',
          borderRadius: 12, padding: '5px 12px',
          transition: 'background 0.3s ease' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#fff', margin: 0 }}>
            {sliderValue >= 80 ? t('skincare_ar.label_future')
              : sliderValue <= 20 ? t('skincare_ar.label_now')
              : `${sliderValue}%`}
          </p>
        </div>
      </div>

      {/* スライダー */}
      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: '12px 14px',
          boxShadow: '0 2px 8px rgba(139,92,246,0.06)', border: '1px solid #ede9fe' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
              {t('skincare_ar.label_now')}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#22c55e' }}>
              {t('skincare_ar.label_future')}
            </span>
          </div>
          <input type="range" min="0" max="100" step="1" value={sliderValue}
            onChange={e => setSliderValue(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#22c55e' }} />
        </div>
      </div>

      {/* キラリ */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8,
        padding: '0 16px 10px' }}>
        <Kirari size={36} expression="sparkle" />
        <Bubble>
          <p style={{ fontSize: 12, color: '#334155', margin: 0, lineHeight: 1.6 }}>
            {sliderValue >= 80 ? t('skincare_ar.kirari_future')
              : sliderValue >= 40 ? t('skincare_ar.kirari_mid')
              : t('skincare_ar.kirari_now')}
          </p>
        </Bubble>
      </div>

      {/* なぜ2週間？ アコーディオン */}
      <div style={{ padding: '0 16px 14px' }}>
        <div style={{ background: '#faf5ff', borderRadius: 14,
          border: '1px solid #e9d5ff', overflow: 'hidden' }}>
          <button onClick={() => setWhyOpen(v => !v)}
            style={{ width: '100%', padding: '12px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'none', border: 'none', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 18, height: 18, borderRadius: '50%',
                background: '#a855f7', color: '#fff', fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0 }}>?</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#7c3aed' }}>
                {t('skincare_ar.why_title')}
              </span>
            </div>
            <span style={{ fontSize: 11, color: '#a78bfa',
              transform: whyOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s', display: 'inline-block' }}>▼</span>
          </button>

          {whyOpen && (
            <div style={{ padding: '0 16px 14px', fontSize: 12,
              color: '#475569', lineHeight: 1.8 }}>
              <p style={{ margin: '0 0 8px' }}>{t('skincare_ar.why_p1')}</p>

              {/* ターンオーバー図 */}
              <svg viewBox="0 0 280 70"
                style={{ width: '100%', height: 'auto', margin: '4px 0 8px' }}>
                <line x1="20" y1="35" x2="260" y2="35" stroke="#e2e8f0" strokeWidth="2"/>
                <circle cx="20"  cy="35" r="5" fill="#a855f7"/>
                <circle cx="140" cy="35" r="6" fill="#22c55e"/>
                <circle cx="260" cy="35" r="5" fill="#a855f7"/>
                <line x1="140" y1="12" x2="140" y2="29"
                  stroke="#22c55e" strokeWidth="1.5" strokeDasharray="3,2"/>
                <text x="140" y="10" textAnchor="middle"
                  fontSize="9" fontWeight="bold" fill="#22c55e">
                  {t('skincare_ar.two_weeks')}
                </text>
                <text x="20"  y="55" textAnchor="middle" fontSize="9" fill="#64748b">0{t('skincare_ar.day')}</text>
                <text x="140" y="55" textAnchor="middle" fontSize="9" fill="#64748b">14{t('skincare_ar.day')}</text>
                <text x="260" y="55" textAnchor="middle" fontSize="9" fill="#64748b">28{t('skincare_ar.day')}</text>
                <text x="140" y="68" textAnchor="middle" fontSize="8" fill="#94a3b8">
                  {t('skincare_ar.turnover_label')}
                </text>
              </svg>

              <p style={{ margin: '0 0 8px' }}>{t('skincare_ar.why_p2')}</p>

              {/* スコア連動メッセージ */}
              {(dullness < 65 || pores < 65) && (
                <div style={{ background: 'rgba(168,85,247,0.08)', borderRadius: 10,
                  padding: '8px 12px', border: '1px solid rgba(168,85,247,0.15)' }}>
                  {dullness < 65 && (
                    <p style={{ fontSize: 11, color: '#7c3aed', margin: '0 0 4px', lineHeight: 1.6 }}>
                      {t('skincare_ar.why_personal_dullness').replace('{score}', String(dullness))}
                    </p>
                  )}
                  {pores < 65 && (
                    <p style={{ fontSize: 11, color: '#7c3aed', margin: 0, lineHeight: 1.6 }}>
                      {t('skincare_ar.why_personal_pores').replace('{score}', String(pores))}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '0 16px' }}>
        <button onClick={onNext} style={{ width: '100%', padding: 14,
          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
          border: 'none', borderRadius: 14,
          fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(34,197,94,0.25)' }}>
          {t('skincare_ar.cta')}
        </button>
      </div>
    </div>
  );
}
```

---

## 8. SkincareRoutineView.jsx

### 8-1. props 追加

```js
// 変更前
export default function SkincareRoutineView({ onNext })

// 変更後
export default function SkincareRoutineView({ onNext, skinScores })
```

### 8-2. 「なぜ2週間？」セクションを合計金額の直後・CTAの直前に挿入

```jsx
{/* なぜ2週間？ */}
<WhyTwoWeeksSection skinScores={skinScores} t={t} />

{/* CTA（既存） */}
<button onClick={onNext} ...>
```

### 8-3. WhyTwoWeeksSection コンポーネント

```jsx
function WhyTwoWeeksSection({ skinScores, t }) {
  const [open, setOpen] = useState(false);
  const dullness = skinScores?.dullness?.score ?? 70;
  const pores    = skinScores?.pores?.score    ?? 70;

  return (
    <div style={{ marginBottom: 14, background: '#faf5ff', borderRadius: 14,
      border: '1px solid #e9d5ff', overflow: 'hidden' }}>
      <button onClick={() => setOpen(v => !v)}
        style={{ width: '100%', padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'none', border: 'none', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 18, height: 18, borderRadius: '50%',
            background: '#a855f7', color: '#fff', fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>?</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#7c3aed' }}>
            {t('skincare_ar.why_title')}
          </span>
        </div>
        <span style={{ fontSize: 11, color: '#a78bfa',
          transform: open ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.2s', display: 'inline-block' }}>▼</span>
      </button>

      {open && (
        <div style={{ padding: '0 16px 14px', fontSize: 12,
          color: '#475569', lineHeight: 1.8 }}>
          <p style={{ margin: '0 0 8px' }}>{t('skincare_ar.why_p1')}</p>
          <p style={{ margin: '0 0 10px' }}>{t('skincare_ar.why_p2')}</p>
          <div style={{ background: 'rgba(168,85,247,0.06)', borderRadius: 10,
            padding: '10px 12px', border: '1px solid rgba(168,85,247,0.12)' }}>
            {dullness < 65 && (
              <p style={{ fontSize: 11, color: '#7c3aed', margin: '0 0 4px', lineHeight: 1.6 }}>
                {t('skincare_ar.why_personal_dullness').replace('{score}', String(dullness))}
              </p>
            )}
            {pores < 65 && (
              <p style={{ fontSize: 11, color: '#7c3aed', margin: '0 0 4px', lineHeight: 1.6 }}>
                {t('skincare_ar.why_personal_pores').replace('{score}', String(pores))}
              </p>
            )}
            <p style={{ fontSize: 11, color: '#7c3aed', margin: 0, lineHeight: 1.6 }}>
              {t('skincare_ar.why_encouragement')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
```

`useState` のインポートが未追加の場合は追加すること。

---

## 9. i18n/ja.js / en.js / ko.js

### ja.js に追加

```js
// mirror
'mirror.start_skincare': '✨ 肌ケアを始める →',
'mirror.try_makeup':     '💄 メイクを試す',

// suggest
'suggest.see_other_looks': '他のルックも見る',

// skincare_ar（SkincareARScreen・SkincareRoutineView 共通）
'skincare_ar.back':                  '結果に戻る',
'skincare_ar.back_to_ar':            '2週間後プレビューに戻る',
'skincare_ar.label_now':             '今',
'skincare_ar.label_future':          '2週間後',
'skincare_ar.kirari_now':            '今の肌の状態だよ♪ スライダーを右に動かして2週間後を見てみて！',
'skincare_ar.kirari_mid':            'ちょっと変わってきたでしょ♪ もう少し動かしてみて！',
'skincare_ar.kirari_future':         'これは2週間ケアを続けた後のあなたの肌♪ 今日から始めよう！',
'skincare_ar.why_title':             'なぜ2週間後なの？',
'skincare_ar.why_p1':                '肌は約28日周期で新しい細胞に生まれ変わる「ターンオーバー」を繰り返しています。',
'skincare_ar.why_p2':                'ケアを始めて約2週間（半サイクル）経つと、新しく生まれた細胞が表面に出てき始め、くすみや毛穴の目立ちにくさが変わりはじめます。',
'skincare_ar.why_personal_dullness': 'あなたのくすみスコアは{score}点。集中ケアで2週間後に差が出やすいポイントです。',
'skincare_ar.why_personal_pores':    'あなたの毛穴スコアは{score}点。保湿ケアを続けると毛穴が引き締まってきますよ。',
'skincare_ar.why_encouragement':     '上のルーティンを2週間続けることで、肌の変化を実感しやすくなりますよ♪',
'skincare_ar.cta':                   'このルーティンを始める →',
'skincare_ar.day':                   '日',
'skincare_ar.two_weeks':             '2週間後',
'skincare_ar.turnover_label':        '肌のターンオーバー（約28日）',

// result
'result.skincare_cta_title': 'ケアを続けた2週間後の肌を見てみよう',
'result.skincare_cta_desc':  'あなたのくすみ・毛穴スコアをもとにシミュレーションするよ♪',
'result.skincare_cta_btn':   '2週間後の自分を見てみる →',
```

### en.js / ko.js

意味が同等であれば訳は任意。キーは ja.js と完全に一致させること。

---

## 10. 実装順序

```
1. makeupLooks.js       — recommendLooks() 追記
2. i18n/ja.js 等        — 新規キー追加
3. SkincareARScreen.jsx — 新規作成
4. SkincareRoutineView  — skinScores props + WhyTwoWeeksSection
5. MirrorScreenV3.jsx   — ボタン2本化
6. App.jsx              — mode ルーティング・新規画面・handlers
7. SuggestScreen.jsx    — ヒーローカード・2タブ化
8. ArTryOnScreen.jsx    — ベースタブ追加・props変更
9. ResultScreen.jsx     — スキンケアCTA追加
```

### コミット単位

```
feat: makeupLooks — recommendLooks() 追加
feat: i18n — SkincareAR・SuggestScreen改修キー追加
feat: SkincareARScreen — 新規作成（2週間後フィルター・なぜ2週間？）
feat: SkincareRoutineView — skinScores props・なぜ2週間？セクション追加
feat: MirrorScreenV3 — 分析後ボタンをスキンケア優先2択に変更
feat: App — mode ルーティング・skincare-ar/routine 画面追加
feat: SuggestScreen — ヒーローカード＋2タブ（Base/Color）に全面改修
feat: ArTryOnScreen — ベースカテゴリタブ追加・baseLook/colorLook props対応
feat: ResultScreen — スキンケアARへの誘導CTAカード追加
```

---

## 11. 検証チェックリスト

**MirrorScreen**
- [ ] 分析完了後にグリーンの「肌ケアを始める」ボタンが上に表示される
- [ ] 「肌ケアを始める」でSkincareARScreenに遷移する
- [ ] 「メイクを試す」でSuggestScreenに遷移する

**SuggestScreen**
- [ ] タブが `Base makeup` / `Color makeup` の2つのみ
- [ ] タブ先頭が Base makeup
- [ ] Skin care タブが存在しない
- [ ] ヒーローカードがトップに表示される
- [ ] ヒーローカードにPCバッジが表示される（PC判定成功時）
- [ ] 「これで試す」でARに遷移する
- [ ] 「他のルックも見る」でエクスプローラーが開閉する
- [ ] エクスプローラーでルックをタップするとARに遷移する

**ARトライオン**
- [ ] カテゴリパネル先頭が「🧴 ベース」
- [ ] ベースタブでBASE_LOOKSの3種が選択できる
- [ ] ベースを切り替えるとカメラ映像のARが更新される
- [ ] ベースとカラーが同時に描画される

**ResultScreen**
- [ ] グリーンの「2週間後の自分を見てみる」CTAが表示される
- [ ] CTAタップでSkincareARScreenに遷移する

**SkincareARScreen**
- [ ] カメラが起動し映像が表示される
- [ ] スライダーを右に動かすとフィルターが強くなる
- [ ] スライダー最左でフィルターがオフになる
- [ ] キラリのセリフがスライダー位置で3段階変化する
- [ ] 「なぜ2週間後なの？」をタップするとアコーディオンが展開・収納する
- [ ] SVGのターンオーバー図が表示される
- [ ] くすみ/毛穴スコアが65未満のときスコア連動メッセージが出る
- [ ] 「このルーティンを始める」でSkincareRoutineViewに遷移する

**SkincareRoutineView**
- [ ] 「なぜ2週間後なの？」セクションが商品リストの下・CTAの上に表示される
- [ ] スコア連動メッセージが表示される

**共通**
- [ ] JA / EN / KO すべての言語で表示が崩れない
- [ ] `skinScores === null` / `personalColor === null` のときクラッシュしない
- [ ] 旧localStorage インデックス2が残っていてもSuggestScreenがクラッシュしない
