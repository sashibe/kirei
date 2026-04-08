# KIREI v2 デモ ステップ② 実装仕様書
# コーデ提案画面の修正 ＋ スタイルタブシステム（ジェンダー対応）

> Claude Code はこのファイルを読んで実装する。判断に迷う箇所はこの仕様に従うこと。
> ステップ①で構築済みの Vite + React プロジェクトに追加する差分仕様。

---

## 概要: 何を直すか

### 現状の問題
結果画面の「コーデ提案」タブが、コスメ提案と同じフォーマットの**フラットな商品リスト**になっている。
これは仕様と異なる。

### あるべき姿
コーデ提案は**スタイルボード形式**で表示する:
1. ARメイク済みの顔（上部）
2. SVG全身シルエット（服の色がアイテムに連動）
3. 各アイテムのフローティングラベル
4. TPOセレクター（Office / Casual / Date / Formal）で全身が切り替わる
5. アイテムリスト + 合計金額 + 「まとめて購入する」CTA

加えて、**スタイルタブシステム**を導入し、性別を聞かずにジェンダー対応する。

---

## 1. スタイルタブシステム

### 配置場所
メイク提案画面（SuggestScreen）の**上部**に3つのタブを横並びで配置。

```jsx
// タブUI: ピルグループスタイル
<div style={{
  display: 'flex', margin: '0 16px', borderRadius: 12,
  overflow: 'hidden', border: '1px solid #e2e8f0',
}}>
  {['Color makeup', 'Base makeup', 'Skin care'].map((label, i) => (
    <button key={i} onClick={() => setStyleTab(i)} style={{
      flex: 1, padding: '10px 0', fontSize: 13, fontWeight: styleTab === i ? 700 : 400,
      background: styleTab === i ? '#fff' : 'transparent',
      color: styleTab === i ? '#a855f7' : '#94a3b8',
      border: 'none', borderRight: i < 2 ? '1px solid #e2e8f0' : 'none',
      cursor: 'pointer',
      boxShadow: styleTab === i ? '0 1px 4px rgba(168,85,247,0.1)' : 'none',
    }}>
      {label}
    </button>
  ))}
</div>
```

### state 管理

```js
const [styleTab, setStyleTab] = useState(() => {
  // localStorage から前回のタブを復元。初回は 0 (Color makeup)
  const saved = localStorage.getItem('kirei_style_tab');
  return saved !== null ? Number(saved) : 0;
});

// タブ変更時に保存
useEffect(() => {
  localStorage.setItem('kirei_style_tab', String(styleTab));
}, [styleTab]);
```

### タブごとのルックデータ

```js
// src/data/makeupLooks.js

// タブ 0: Color makeup
export const COLOR_LOOKS = [
  {
    id: 'glow', name: 'ツヤ肌ブルームルック',
    desc: '血色感のあるコーラルピンクで自然なツヤを演出',
    reason: 'くすみスコアが良好なので、ツヤ肌が映えます',
    lip: '#e8607c', cheek: 'rgba(232,96,124,0.25)', eyeshadow: 'rgba(232,150,120,0.2)',
    products: [
      { emoji: '💄', name: 'シアーグロウリップ', shade: 'コーラルピンク', price: 2480 },
      { emoji: '🌸', name: 'ブルームチーク', shade: 'ピーチ', price: 1980 },
    ],
  },
  // ... matte, warm ルック（既存データを流用）
];

// タブ 1: Base makeup
export const BASE_LOOKS = [
  {
    id: 'clean-natural', name: 'クリーンナチュラル',
    desc: 'BBクリーム + コンシーラーで肌の色ムラを均一に',
    reason: '肌トーンスコアを活かして清潔感のある印象に',
    base: '#e8d8c8', concealer: '#d4c0a8',
    products: [
      { emoji: '🧴', name: 'ナチュラルBBクリーム', shade: 'ライトベージュ', price: 1980 },
      { emoji: '✨', name: 'カバーコンシーラー', shade: 'ナチュラル', price: 1480 },
    ],
  },
  {
    id: 'business-sharp', name: 'ビジネスシャープ',
    desc: 'トーンアップ下地 + 眉マスカラでキリッとした印象に',
    reason: 'パーソナルカラーに合わせた眉色で知的に仕上げる',
    base: '#d8cfc0', brow: '#8a7a6a',
    products: [
      { emoji: '🧴', name: 'トーンアップ下地', shade: 'ラベンダー', price: 2280 },
      { emoji: '🖌️', name: 'アイブロウマスカラ', shade: 'アッシュブラウン', price: 1280 },
    ],
  },
  {
    id: 'weekend-fresh', name: 'ウィークエンドフレッシュ',
    desc: '軽いトーンアップ + リップバームで爽やかに',
    reason: '休日のリラックスした印象をキープ',
    base: '#f0e4d8', lip: '#d8a8a0',
    products: [
      { emoji: '🧴', name: 'トーンアップジェル', shade: 'クリア', price: 1680 },
      { emoji: '💋', name: 'カラーリップバーム', shade: 'ピンクベージュ', price: 980 },
    ],
  },
];

// タブ 2: Skin care — ルックなし（スキンケアルーティン提案）
export const SKINCARE_ROUTINE = {
  morning: [
    { step: '洗顔', product: 'アミノ酸洗顔フォーム', price: 1480 },
    { step: '化粧水', product: 'トーニングローション', price: 1980 },
    { step: '乳液', product: 'モイスチャーミルク', price: 2280 },
    { step: '日焼け止め', product: 'UVプロテクトジェル SPF50+', price: 1680 },
  ],
  night: [
    { step: 'クレンジング', product: 'ジェルクレンジング', price: 1580 },
    { step: '洗顔', product: 'アミノ酸洗顔フォーム', price: 1480 },
    { step: '美容液', product: 'ビタミンC美容液', price: 3280 },
    { step: 'クリーム', product: 'バリアリペアクリーム', price: 2480 },
  ],
};
```

### SuggestScreen でのタブ分岐

```jsx
// SuggestScreen.jsx 内
const looks = styleTab === 0 ? COLOR_LOOKS
            : styleTab === 1 ? BASE_LOOKS
            : null; // Skin care はルックなし

// Skin care の場合
if (styleTab === 2) {
  // ルーティン提案を表示 → ARトライオンをスキップ → 結果画面へ直接遷移
  return <SkincareRoutineView onNext={() => nav.goForward(3)} />;
}

// Color / Base の場合
return (
  <>
    {/* タブ */}
    {/* 肌コンディションサマリー */}
    {/* ルックカード一覧（looks からマップ） */}
  </>
);
```

### ARトライオンのタブ対応

- **Color makeup**: 既存のリップ・チーク・アイシャドウのオーバーレイ
- **Base makeup**: BBクリーム（顔全体のトーンアップ: `softlight` ブレンド）＋コンシーラー（目の下にスポット）。カラーパレットはベージュ〜アイボリー系に差し替え
- **Skin care**: ARトライオン画面をスキップ

---

## 2. コーデ提案画面（スタイルボード方式）

### 現状との差分

**現状（修正前）**: 結果画面の「コーデ提案」タブにフラットなアイテムリストが並んでいる。

**修正後**: コーデ提案は以下の構成に変更する:

### 2-1. コーデ提案の起動

結果画面（ResultScreen）に表示する「コーデヒント」カードに**「おすすめコーデを見る →」ボタン**を配置。
ボタン押下で**コーデオーバーレイ**（フルスクリーン）を表示する。

```jsx
// ResultScreen.jsx 内
<div style={{ margin: '0 16px 12px', background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
  borderRadius: 18, padding: '14px 16px', border: '1px solid #fde68a' }}>
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
    <Kirari size={32} expression="sparkle"/>
    <div>
      <p style={{ fontSize: 12, fontWeight: 600, color: '#92400e', margin: '0 0 4px' }}>
        {WEATHER.icon} 今日のコーデヒント
      </p>
      <p style={{ fontSize: 11, color: '#78350f', margin: 0, lineHeight: 1.6 }}>
        {getCoordHint(selectedLook, styleTab, weather)}
      </p>
    </div>
  </div>
  <button onClick={() => setShowCoord(true)} style={{
    width: '100%', padding: 12,
    background: 'linear-gradient(135deg, #f59e0b, #f97316)',
    border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700,
    color: '#fff', cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
  }}>
    👗 おすすめコーデを見る →
  </button>
</div>
```

**注意**: 結果画面の「コスメ提案 / コーデ提案」の2タブ切替UIは**削除する**。コスメ提案は結果画面本体に表示し、コーデ提案は上記ボタンから別画面（オーバーレイ）で表示する。混在しない。

### 2-2. TPOセレクター

コーデオーバーレイの上部にピルボタン4つを配置。

```jsx
const TPO_OPTIONS = [
  { id: 'office',  label: 'Office',  icon: '💼' },
  { id: 'casual',  label: 'Casual',  icon: '☕' },
  { id: 'date',    label: 'Date',    icon: '🌙' },
  { id: 'formal',  label: 'Formal',  icon: '🎩' },
];

// UI
<div style={{ display: 'flex', gap: 6, padding: '0 16px', marginBottom: 12 }}>
  {TPO_OPTIONS.map(tpo => (
    <button key={tpo.id} onClick={() => setSelectedTPO(tpo.id)} style={{
      flex: 1, padding: '8px 0', borderRadius: 10, fontSize: 12, fontWeight: 600,
      border: selectedTPO === tpo.id ? '2px solid #f59e0b' : '1px solid #e2e8f0',
      background: selectedTPO === tpo.id ? '#fffbeb' : '#fff',
      color: selectedTPO === tpo.id ? '#d97706' : '#94a3b8',
      cursor: 'pointer',
    }}>
      {tpo.icon} {tpo.label}
    </button>
  ))}
</div>
```

### 2-3. コーデデータ構造

```js
// src/data/coordItems.js

// キー: `${styleTabId}_${tpoId}` の組合せ
// styleTabId: 'color' | 'base' | 'skincare'
// tpoId: 'office' | 'casual' | 'date' | 'formal'

export const COORD_DATA = {
  // ─── Color makeup ───
  color_office: [
    { part: 'トップス', name: 'シアーブラウス', shade: 'ラベンダー', price: 5900, color: '#d8c8e8' },
    { part: 'ボトムス', name: 'テーパードパンツ', shade: 'ネイビー', price: 6900, color: '#2c3e5a' },
    { part: 'アウター', name: 'ノーカラージャケット', shade: 'グレージュ', price: 12800, color: '#c8c0b8' },
    { part: 'バッグ', name: 'レザーハンドバッグ', shade: 'トープ', price: 8900, color: '#b0a090' },
    { part: 'シューズ', name: 'ポインテッドパンプス', shade: 'ベージュ', price: 7800, color: '#d8c8b0' },
  ],
  color_casual: [
    { part: 'トップス', name: 'リブニット', shade: 'アイボリー', price: 4980, color: '#faf5ef' },
    { part: 'ボトムス', name: 'フレアスカート', shade: 'ダスティローズ', price: 6280, color: '#f5d0d6' },
    { part: 'アウター', name: 'ライトカーデ', shade: 'ラベンダー', price: 5480, color: '#e9d5ff' },
    { part: 'バッグ', name: 'ミニショルダー', shade: 'ベージュ', price: 4280, color: '#e8dcc8' },
    { part: 'シューズ', name: 'フラットシューズ', shade: 'ヌードピンク', price: 5980, color: '#f0d0c0' },
  ],
  color_date: [
    { part: 'トップス', name: 'オフショルニット', shade: 'ベビーピンク', price: 5400, color: '#f8d8e0' },
    { part: 'ボトムス', name: 'プリーツスカート', shade: 'シャンパンゴールド', price: 7200, color: '#e8d8b8' },
    { part: 'アクセサリー', name: 'パールイヤリング', shade: 'ゴールド', price: 2900, color: '#e8d8b0' },
    { part: 'バッグ', name: 'チェーンバッグ', shade: 'ピンクベージュ', price: 6800, color: '#e8c8b8' },
    { part: 'シューズ', name: 'ストラップヒール', shade: 'シルバー', price: 8200, color: '#c8c8d0' },
  ],
  color_formal: [
    { part: 'ワンピース', name: 'Aラインドレス', shade: 'ネイビー', price: 15800, color: '#2a3a5a' },
    { part: 'アウター', name: 'ボレロジャケット', shade: 'ベージュ', price: 9800, color: '#d8ccb8' },
    { part: 'アクセサリー', name: 'パールネックレス', shade: 'ホワイト', price: 4800, color: '#f0ece8' },
    { part: 'バッグ', name: 'クラッチバッグ', shade: 'シャンパン', price: 5900, color: '#e0d0b8' },
    { part: 'シューズ', name: 'パンプス', shade: 'ブラック', price: 9200, color: '#2a2a2a' },
  ],

  // ─── Base makeup ───
  base_office: [
    { part: 'トップス', name: 'ホワイトシャツ', shade: 'ホワイト', price: 4980, color: '#f8f8f8' },
    { part: 'ボトムス', name: 'スラックス', shade: 'チャコール', price: 6980, color: '#4a4a4a' },
    { part: 'アウター', name: 'テーラードジャケット', shade: 'ネイビー', price: 14800, color: '#2c3e5a' },
    { part: 'バッグ', name: 'ビジネスブリーフ', shade: 'ブラック', price: 9800, color: '#333' },
    { part: 'シューズ', name: 'レザーシューズ', shade: 'ダークブラウン', price: 8900, color: '#5a3a20' },
  ],
  base_casual: [
    { part: 'トップス', name: 'クルーネックT', shade: 'ホワイト', price: 2980, color: '#f5f5f0' },
    { part: 'ボトムス', name: 'スリムテーパード', shade: 'ブラック', price: 5980, color: '#333' },
    { part: 'アウター', name: 'MA-1ジャケット', shade: 'カーキ', price: 8900, color: '#6a7a5a' },
    { part: 'バッグ', name: 'バックパック', shade: 'ブラック', price: 5900, color: '#2a2a2a' },
    { part: 'シューズ', name: 'ホワイトスニーカー', shade: 'ホワイト', price: 6900, color: '#f0f0f0' },
  ],
  base_date: [
    { part: 'トップス', name: 'ニットポロ', shade: 'ネイビー', price: 5400, color: '#2c3e5a' },
    { part: 'ボトムス', name: 'チノパン', shade: 'ベージュ', price: 5980, color: '#c8b898' },
    { part: 'アウター', name: 'リネンジャケット', shade: 'ライトグレー', price: 11800, color: '#c8c8c8' },
    { part: 'バッグ', name: 'レザーサコッシュ', shade: 'ブラウン', price: 4900, color: '#8a6a4a' },
    { part: 'シューズ', name: 'レザースニーカー', shade: 'ホワイト', price: 8200, color: '#f0ece8' },
  ],
  base_formal: [
    { part: 'トップス', name: 'ドレスシャツ', shade: 'サックスブルー', price: 5900, color: '#c8d8e8' },
    { part: 'ボトムス', name: 'ウールスラックス', shade: 'チャコール', price: 9800, color: '#4a4a4a' },
    { part: 'アウター', name: 'セットアップジャケット', shade: 'チャコール', price: 19800, color: '#4a4a4a' },
    { part: 'アクセサリー', name: 'シルクタイ', shade: 'バーガンディ', price: 4800, color: '#7a2a3a' },
    { part: 'シューズ', name: 'ストレートチップ', shade: 'ブラック', price: 12800, color: '#1a1a1a' },
  ],

  // ─── Skin care ───
  skincare_casual: [
    { part: 'トップス', name: 'オーバーサイズT', shade: 'オフホワイト', price: 3480, color: '#f5f0e8' },
    { part: 'ボトムス', name: 'ワイドパンツ', shade: 'ベージュ', price: 4980, color: '#d8ccb8' },
    { part: 'シューズ', name: 'コンフォートサンダル', shade: 'ブラウン', price: 4900, color: '#9a7a5a' },
  ],
  skincare_office: [
    { part: 'トップス', name: 'シンプルシャツ', shade: 'ホワイト', price: 3980, color: '#f8f8f8' },
    { part: 'ボトムス', name: 'ストレートパンツ', shade: 'グレー', price: 5480, color: '#8a8a8a' },
    { part: 'シューズ', name: 'プレーンローファー', shade: 'ブラック', price: 6980, color: '#333' },
  ],
};

// ルックアップ関数
export function getCoordItems(styleTabId, tpoId) {
  const key = `${styleTabId}_${tpoId}`;
  return COORD_DATA[key] || COORD_DATA[`${styleTabId}_casual`] || [];
}
```

### 2-4. コーデオーバーレイ コンポーネント

**ファイル**: `src/components/CoordinateOverlay.jsx`

このコンポーネントは `position: fixed` の全画面オーバーレイとして表示する。

#### 構成

```
┌─────────────────────────┐
│ Today's Total Look   [✕] │  ← ヘッダー
├─────────────────────────┤
│ キラリ + メッセージ        │
├─────────────────────────┤
│ [Office][Casual][Date].. │  ← TPOセレクター
├─────────────────────────┤
│                         │
│   ┌──────────────┐      │
│   │  AR顔（上部）  │      │  ← ARメイク済みの顔画像
│   └──────────────┘      │
│   ┌──────────────┐      │
│   │              │ ラベル │
│   │  SVG全身     │←───── │  ← 服の色がアイテムに連動
│   │  シルエット   │ ラベル │
│   │              │←───── │
│   └──────────────┘      │
│                         │
├─────────────────────────┤
│ アイテムリスト            │  ← カラースウォッチ + 名前 + 価格
│ ─────────────────────── │
│ コーデ合計 ¥XX,XXX       │
│ [🛒 まとめて購入する]     │  ← CTA
│ [結果画面に戻る]          │
└─────────────────────────┘
```

#### SVG全身シルエット

服の色はコーデアイテムの `color` プロパティから取得して反映する。
以下のSVGをベースに、各パーツの `fill` を動的に変更する。

```jsx
function BodySilhouette({ items }) {
  // items から各パーツの色を抽出
  const topColor = items.find(i => i.part === 'トップス' || i.part === 'ワンピース')?.color || '#f0e8e0';
  const outerColor = items.find(i => ['アウター','カーディガン'].includes(i.part))?.color;
  const bottomColor = items.find(i => i.part === 'ボトムス')?.color || '#d0c8c0';
  const shoeColor = items.find(i => i.part === 'シューズ')?.color || '#c0b0a0';
  const bagColor = items.find(i => i.part === 'バッグ' || i.part === 'アクセサリー')?.color;

  return (
    <svg viewBox="0 0 200 340" style={{ width: '55%', height: '70%' }}>
      {/* 首 */}
      <rect x="88" y="0" width="24" height="30" rx="8" fill="#f5d0b0"/>
      {/* トップス */}
      <path d="M60 30 Q60 20 88 18 L112 18 Q140 20 140 30 L145 120 Q145 135 130 140 L70 140 Q55 135 55 120 Z"
        fill={topColor}/>
      {/* アウター（存在する場合のみ） */}
      {outerColor && (
        <>
          <path d="M55 30 Q40 35 35 50 L30 110 Q30 120 40 122 L55 120 L55 30Z" fill={outerColor} opacity="0.85"/>
          <path d="M145 30 Q160 35 165 50 L170 110 Q170 120 160 122 L145 120 L145 30Z" fill={outerColor} opacity="0.85"/>
          <path d="M55 30 L65 30 L65 140 L55 120Z" fill={outerColor} opacity="0.5"/>
          <path d="M145 30 L135 30 L135 140 L145 120Z" fill={outerColor} opacity="0.5"/>
        </>
      )}
      {/* ボトムス */}
      <path d="M65 140 L55 250 Q55 260 70 260 L90 260 L100 145 L110 260 L130 260 Q145 260 145 250 L135 140 Z"
        fill={bottomColor}/>
      {/* 脚 */}
      <rect x="78" y="260" width="16" height="50" rx="6" fill="#f5d0b0"/>
      <rect x="106" y="260" width="16" height="50" rx="6" fill="#f5d0b0"/>
      {/* シューズ */}
      <ellipse cx="86" cy="314" rx="14" ry="8" fill={shoeColor}/>
      <ellipse cx="114" cy="314" rx="14" ry="8" fill={shoeColor}/>
      {/* バッグ（存在する場合） */}
      {bagColor && (
        <>
          <rect x="148" y="100" width="22" height="28" rx="4" fill={bagColor} stroke="#ccc" strokeWidth="0.5"/>
          <path d="M152 100 Q159 88 166 100" fill="none" stroke={bagColor} strokeWidth="2"/>
        </>
      )}
    </svg>
  );
}
```

#### アイテムのフローティングラベル

全身シルエットの左右に交互に配置。パーツ名と商品名を表示。

```jsx
{items.map((item, i) => (
  <div key={i} style={{
    position: 'absolute',
    top: ['34%','36%','58%','55%','82%'][i] || `${30 + i * 12}%`,
    ...(i % 2 === 0 ? { left: 8 } : { right: 8 }),
    background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)',
    borderRadius: 10, padding: '4px 8px', maxWidth: '35%',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.04)',
  }}>
    <p style={{ fontSize: 9, fontWeight: 600, color: '#a855f7', margin: 0 }}>{item.part}</p>
    <p style={{ fontSize: 10, fontWeight: 600, color: '#334155', margin: 0 }}>{item.name}</p>
  </div>
))}
```

#### ARメイク顔の配置

スタイルボード上部に、ミラー画面で取得した顔画像（またはカメラのスナップショット）をARメイク付きで表示。

```jsx
<div style={{
  position: 'absolute', top: '3%', left: '50%', transform: 'translateX(-50%)',
  width: '40%', aspectRatio: '3/4', borderRadius: '50% 50% 45% 45%', overflow: 'hidden',
}}>
  {/* カメラ映像またはフォールバック画像 */}
  <video ref={videoRef} ... />  {/* or <img src={...} /> */}
  {/* ARオーバーレイ（リップ・チーク等）をCSSブレンドで重畳 */}
</div>
```

### 2-5. キラリのセリフ分岐

```js
// src/data/kirariDialogues.js に追加

export function getCoordLine(context) {
  const { styleTab, tpo, weather } = context;
  const tabNames = ['color', 'base', 'skincare'];
  const tab = tabNames[styleTab] || 'color';

  // 天気連動
  if (weather?.temp < 10) return 'かなり冷え込むみたい。しっかりアウターで暖かく過ごそうね♪';
  if (weather?.temp < 18) return '少し肌寒い日だね。カーデやジャケットがあると安心♪';
  if (weather?.temp > 28) return '暑い日！涼しい素材で快適に、メイクも崩れにくいアイテムを♪';

  // タブ × TPO 連動
  if (tab === 'color' && tpo === 'office') return 'オフィスでも華やかさをキープ♪ メイクに合わせた上品コーデだよ〜';
  if (tab === 'color' && tpo === 'date') return 'デートコーデ♪ メイクの色味と合わせてトータルで可愛く〜';
  if (tab === 'base' && tpo === 'office') return 'クリーンなビジネススタイル♪ 清潔感バッチリだよ〜';
  if (tab === 'base' && tpo === 'casual') return 'シンプルだけどこなれ感のあるコーデ♪ 肌がきれいに見えるよ〜';
  if (tab === 'base' && tpo === 'date') return 'さりげなく好印象なスマートカジュアル♪ いい感じ〜';

  return 'メイクに合わせたトータルコーデだよ♪ 気になるアイテムはタップしてチェックしてね〜';
}
```

---

## 3. 結果画面の修正

### 修正点

1. **「コスメ提案 / コーデ提案」の2タブ切替UIを削除する**
   - コスメ提案は結果画面本体にそのまま表示
   - コーデ提案はコーデヒントカード内のCTAボタンからオーバーレイで開く
   - 2つを同一画面のタブで切り替えるのは情報の質が違いすぎるので分離する

2. **コーデヒントカードにCTAボタンを追加**（上記 2-1 参照）

3. **コーデオーバーレイを `ResultScreen` の子コンポーネントとして配置**
   ```jsx
   {showCoord && (
     <CoordinateOverlay
       styleTab={styleTab}
       selectedLook={selectedLook}
       lipColor={lipColor}
       cheekColor={cheekColor}
       intensity={intensity}
       weather={WEATHER}
       onClose={() => setShowCoord(false)}
     />
   )}
   ```

---

## 4. 実装順序

1. `src/data/makeupLooks.js` に `COLOR_LOOKS`, `BASE_LOOKS`, `SKINCARE_ROUTINE` を定義
2. `src/data/coordItems.js` に `COORD_DATA` と `getCoordItems()` を定義
3. `src/data/kirariDialogues.js` にコーデ用セリフを追加
4. `SuggestScreen` にスタイルタブUI追加 + タブに応じたルック表示分岐
5. `SkincareRoutineView` コンポーネント作成（Skin care タブ用）
6. `BodySilhouette` コンポーネント作成（SVG全身シルエット）
7. `CoordinateOverlay` コンポーネント作成（TPOセレクター + スタイルボード + アイテムリスト + CTA）
8. `ResultScreen` から「コスメ提案/コーデ提案」タブを削除、コーデヒントカード+CTAに置き換え
9. `ResultScreen` に `CoordinateOverlay` を子コンポーネントとして配置
10. 動作確認

### コミット単位

```
feat: スタイルタブシステム追加（Color/Base/Skincare切替）
feat: Base makeupルック＋Skincareルーティンデータ追加
feat: コーデ提案画面をスタイルボード方式に修正
feat: TPOセレクター実装（Office/Casual/Date/Formal）
feat: コーデデータをスタイルタブ×TPOのマトリクス化
refactor: 結果画面からタブUI削除、コーデはオーバーレイに分離
```

---

## 5. 検証チェックリスト

- [ ] メイク提案画面にスタイルタブ（3つ）が表示される
- [ ] タブ切替でルックカードが入れ替わる
- [ ] Base makeup タブではBBクリーム/コンシーラー系のルックが表示される
- [ ] Skin care タブではルーティン提案が表示され、ARトライオンがスキップされる
- [ ] タブの選択状態が次回起動時に復元される（localStorage）
- [ ] 結果画面の「コスメ提案/コーデ提案」タブが削除されている
- [ ] 結果画面のコーデヒントカードに「おすすめコーデを見る」ボタンがある
- [ ] コーデオーバーレイにTPOセレクター（4つ）が表示される
- [ ] TPO切替でSVGシルエットの服の色が変わる
- [ ] TPO切替でアイテムリストが入れ替わる
- [ ] Color makeup × Office と Base makeup × Office で異なるコーデが表示される
- [ ] アイテムリストに合計金額が表示される
- [ ] 「まとめて購入する」CTAが表示される
- [ ] UI上のどこにも「男性」「女性」「メンズ」「レディース」の文言がない
- [ ] キラリのセリフにスタイルタブ/TPOに応じた分岐がある
