# KIREI v2 デモ ステップ③ 実装仕様書
# ARトライオン レイヤー化 ＋ アクセサリー対応 ＋ キャプチャ → 結果画面

> Claude Code はこのファイルを読んで実装する。判断に迷う箇所はこの仕様に従うこと。
> ステップ②で構築済みのプロジェクトに追加する差分仕様。

---

## 概要: 何を変えるか

### 現状の問題

ARトライオン画面（ArTryOnScreen）はメイク（リップ・チーク・アイシャドウ）専用で、
カテゴリが単一。「メイクしながらメガネも試す」ができない。

### あるべき姿

ARトライオン画面を**レイヤー合成アーキテクチャ**に変更する。

```
カメラ映像
  └─ Layer 1: Base makeup（ファンデ・コンシーラー）
  └─ Layer 2: Color makeup（リップ・チーク・アイシャドウ）
  └─ Layer 3: Accessories（メガネ・イヤリング）  ← 新規追加
```

全レイヤーが同時に Canvas に描画されるため、「ウォームグロウルックを試しながら
ゴールドフープイヤリングも合わせてみる」が1画面で完結する。

また、**「このメイクで決定」ボタン押下でキャプチャ**し、
結果画面の最上部にARメイク＋アクセサリー合成済み写真を表示する。

---

## 1. ARトライオン画面のUI変更

### 1-1. カテゴリ切替パネル

現状の「リップカラー」パレット単体表示を、4カテゴリのタブパネルに置き換える。

```
[ 💄 リップ ] [ 🌸 チーク ] [ 👓 メガネ ] [ 💍 イヤリング ]
```

- アクティブなカテゴリのみアイテム選択UIを表示
- **他カテゴリの選択状態は維持**（リップを選んでからメガネを選んでもリップの色は変わらない）

#### state 追加

```js
// ArTryOnScreen.jsx に追加
const [activeCategory, setActiveCategory] = useState('lip');
// 'lip' | 'cheek' | 'glasses' | 'earring'

const [selectedGlasses, setSelectedGlasses] = useState('none');
const [selectedEarring, setSelectedEarring] = useState('none');

const CATEGORIES = [
  { id: 'lip',     label: 'リップ',    icon: '💄' },
  { id: 'cheek',   label: 'チーク',    icon: '🌸' },
  { id: 'glasses', label: 'メガネ',    icon: '👓' },
  { id: 'earring', label: 'イヤリング', icon: '💍' },
];
```

#### カテゴリタブUI

```jsx
{/* カテゴリ切替タブ */}
<div style={{
  display: 'flex', gap: 0,
  background: 'rgba(0,0,0,0.3)', borderRadius: 12,
  overflow: 'hidden', marginBottom: 10,
}}>
  {CATEGORIES.map(cat => (
    <button key={cat.id} onClick={() => setActiveCategory(cat.id)} style={{
      flex: 1, padding: '8px 0',
      background: activeCategory === cat.id
        ? 'rgba(255,255,255,0.2)' : 'transparent',
      border: 'none',
      borderBottom: activeCategory === cat.id
        ? '2px solid #fff' : '2px solid transparent',
      color: '#fff',
      fontSize: 10, fontWeight: activeCategory === cat.id ? 700 : 400,
      cursor: 'pointer', transition: 'background 0.2s',
    }}>
      <div style={{ fontSize: 16 }}>{cat.icon}</div>
      <div>{cat.label}</div>
    </button>
  ))}
</div>
```

#### カテゴリごとの選択UI

```jsx
{/* リップ */}
{activeCategory === 'lip' && (
  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
    {['#e8607c','#c05070','#d4826a','#b85050','#cf6080','#e07070'].map(c => (
      <div key={c} onClick={() => setLipColor(c)} style={{
        width: 32, height: 32, borderRadius: '50%', background: c, cursor: 'pointer',
        border: lipColor === c ? '3px solid #fff' : '2px solid rgba(255,255,255,0.3)',
        boxShadow: lipColor === c ? '0 0 10px rgba(255,255,255,0.3)' : 'none',
        transition: 'all 0.2s',
      }}/>
    ))}
  </div>
)}

{/* チーク */}
{activeCategory === 'cheek' && (
  <div style={{ display: 'flex', gap: 8 }}>
    {[
      'rgba(232,96,124,0.4)',
      'rgba(255,150,100,0.4)',
      'rgba(200,160,200,0.4)',
      'rgba(255,180,120,0.4)',
    ].map(c => (
      <div key={c} onClick={() => setCheekColor(c)} style={{
        width: 32, height: 32, borderRadius: '50%', background: c, cursor: 'pointer',
        border: cheekColor === c ? '3px solid #fff' : '2px solid rgba(255,255,255,0.3)',
        transition: 'all 0.2s',
      }}/>
    ))}
  </div>
)}

{/* メガネ */}
{activeCategory === 'glasses' && (
  <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
    {GLASSES_ITEMS.map(item => (
      <button key={item.id} onClick={() => setSelectedGlasses(item.id)} style={{
        padding: '6px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600,
        background: selectedGlasses === item.id
          ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
        border: selectedGlasses === item.id
          ? '2px solid #fff' : '1px solid rgba(255,255,255,0.2)',
        color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap',
        flexShrink: 0,
      }}>
        {item.emoji} {item.name}
      </button>
    ))}
  </div>
)}

{/* イヤリング */}
{activeCategory === 'earring' && (
  <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
    {EARRING_ITEMS.map(item => (
      <button key={item.id} onClick={() => setSelectedEarring(item.id)} style={{
        padding: '6px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600,
        background: selectedEarring === item.id
          ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
        border: selectedEarring === item.id
          ? '2px solid #fff' : '1px solid rgba(255,255,255,0.2)',
        color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap',
        flexShrink: 0,
      }}>
        {item.emoji} {item.name}
      </button>
    ))}
  </div>
)}
```

### 1-2. 濃さスライダーの扱い

- リップ・チークのアクティブ時のみスライダーを表示する
- メガネ・イヤリングのアクティブ時はスライダーを非表示にする

```jsx
{(activeCategory === 'lip' || activeCategory === 'cheek') && (
  <div style={{ marginTop: 8 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>メイクの強さ</span>
      <span style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>{intensity}%</span>
    </div>
    <input type="range" min="0" max="100" value={intensity}
      onChange={e => setIntensity(Number(e.target.value))}
      style={{ width: '100%', marginTop: 4, accentColor: '#ec4899' }}/>
  </div>
)}
```

---

## 2. アクセサリーデータ

**ファイル**: `src/data/accessories.js`（新規作成）

```js
// src/data/accessories.js

export const GLASSES_ITEMS = [
  {
    id: 'none',
    name: 'なし',
    emoji: '✕',
    price: 0,
  },
  {
    id: 'round-gold',
    name: 'ラウンドゴールド',
    emoji: '👓',
    color: '#c8a840',
    shape: 'round',
    price: 18900,
  },
  {
    id: 'square-black',
    name: 'スクエアブラック',
    emoji: '🕶️',
    color: '#1a1a1a',
    shape: 'square',
    price: 22000,
  },
  {
    id: 'oval-silver',
    name: 'オーバルシルバー',
    emoji: '👓',
    color: '#c0c0c0',
    shape: 'oval',
    price: 16500,
  },
  {
    id: 'sunglass-tort',
    name: 'サングラス トータス',
    emoji: '🕶️',
    color: '#8a5a2a',
    shape: 'wayfarer',
    lensColor: 'rgba(60,40,20,0.55)',
    price: 14800,
  },
];

export const EARRING_ITEMS = [
  {
    id: 'none',
    name: 'なし',
    emoji: '✕',
    price: 0,
  },
  {
    id: 'pearl-drop',
    name: 'パールドロップ',
    emoji: '💎',
    color: '#f8f4f0',
    type: 'drop',
    price: 3800,
  },
  {
    id: 'gold-hoop',
    name: 'ゴールドフープ',
    emoji: '💛',
    color: '#c8a840',
    type: 'hoop',
    price: 5200,
  },
  {
    id: 'crystal-stud',
    name: 'クリスタルスタッド',
    emoji: '✨',
    color: '#e8f4ff',
    type: 'stud',
    price: 2900,
  },
  {
    id: 'silver-chain',
    name: 'シルバーチェーン',
    emoji: '🔗',
    color: '#c0c0c0',
    type: 'chain',
    price: 4600,
  },
];
```

---

## 3. ARキャンバス描画（MakeupCanvas.jsx への追加）

### 3-1. メガネの描画

ランドマーク座標:
- 鼻梁中心: `#6`
- 左耳: `#234`
- 右耳: `#454`

```js
// MakeupCanvas.jsx に追加

function drawGlasses(ctx, landmarks, item, canvasW, canvasH) {
  if (!item || item.id === 'none') return;

  const nose    = landmarks[6];
  const leftEar = landmarks[234];
  const rightEar = landmarks[454];

  const cx = nose.x * canvasW;
  const cy = nose.y * canvasH;
  // フレーム幅は耳間距離の1.1倍（耳まで伸びるテンプル分を含む）
  const frameWidth  = Math.abs(rightEar.x - leftEar.x) * canvasW * 1.1;
  const frameHeight = frameWidth * 0.38;
  const lw = frameWidth * 0.03; // フレーム線幅

  ctx.save();
  ctx.strokeStyle = item.color;
  ctx.lineWidth = lw;

  const lensR = frameWidth * 0.23; // レンズ半径（round用）
  const lensW = frameWidth * 0.43; // レンズ幅（square/oval用）
  const lensH = frameHeight * 0.92;

  // テンプル（つる）を先に描画（レンズの後ろに来るように）
  ctx.beginPath();
  ctx.moveTo(cx - frameWidth * 0.5 + lw, cy);
  ctx.lineTo(leftEar.x * canvasW, leftEar.y * canvasH);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx + frameWidth * 0.5 - lw, cy);
  ctx.lineTo(rightEar.x * canvasW, rightEar.y * canvasH);
  ctx.stroke();

  // ブリッジ
  ctx.beginPath();
  ctx.moveTo(cx - frameWidth * 0.07, cy);
  ctx.lineTo(cx + frameWidth * 0.07, cy);
  ctx.stroke();

  // レンズ（形状ごとに分岐）
  const drawLens = (lx, ly) => {
    if (item.shape === 'round') {
      ctx.beginPath();
      ctx.arc(lx, ly, lensR, 0, Math.PI * 2);
    } else if (item.shape === 'oval') {
      ctx.beginPath();
      ctx.ellipse(lx, ly, lensR * 1.15, lensR * 0.75, 0, 0, Math.PI * 2);
    } else {
      // square / wayfarer: 角丸矩形
      const r = item.shape === 'wayfarer' ? lensH * 0.15 : lensH * 0.08;
      const x0 = lx - lensW / 2, y0 = ly - lensH / 2;
      ctx.beginPath();
      ctx.moveTo(x0 + r, y0);
      ctx.lineTo(x0 + lensW - r, y0);
      ctx.quadraticCurveTo(x0 + lensW, y0, x0 + lensW, y0 + r);
      ctx.lineTo(x0 + lensW, y0 + lensH - r);
      ctx.quadraticCurveTo(x0 + lensW, y0 + lensH, x0 + lensW - r, y0 + lensH);
      ctx.lineTo(x0 + r, y0 + lensH);
      ctx.quadraticCurveTo(x0, y0 + lensH, x0, y0 + lensH - r);
      ctx.lineTo(x0, y0 + r);
      ctx.quadraticCurveTo(x0, y0, x0 + r, y0);
      ctx.closePath();
    }

    // サングラスはレンズ塗りつぶし
    if (item.lensColor) {
      ctx.fillStyle = item.lensColor;
      ctx.fill();
    }
    ctx.stroke();
  };

  const lOffset = frameWidth * 0.28;
  drawLens(cx - lOffset, cy);
  drawLens(cx + lOffset, cy);

  ctx.restore();
}
```

### 3-2. イヤリングの描画

ランドマーク座標:
- 左耳珠: `#132`
- 右耳珠: `#361`

```js
function drawEarrings(ctx, landmarks, item, canvasW, canvasH) {
  if (!item || item.id === 'none') return;

  const positions = [
    { x: landmarks[132].x * canvasW, y: landmarks[132].y * canvasH },
    { x: landmarks[361].x * canvasW, y: landmarks[361].y * canvasH },
  ];

  positions.forEach(pos => {
    ctx.save();
    ctx.fillStyle = item.color;
    ctx.strokeStyle = item.color;

    switch (item.type) {
      case 'stud':
        // 半球スタッド
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        break;

      case 'drop':
        // ピアス土台 + 雫
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(pos.x, pos.y + 16, 5, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        break;

      case 'hoop':
        // フープ（半円）
        ctx.beginPath();
        ctx.arc(pos.x, pos.y + 10, 11, 0, Math.PI * 2);
        ctx.strokeStyle = item.color;
        ctx.lineWidth = 3;
        ctx.stroke();
        break;

      case 'chain':
        // チェーン（縦線で表現）
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y + 6 + i * 7, 3, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;
    }

    ctx.restore();
  });
}
```

### 3-3. rAFループへの組み込み

`MakeupCanvas.jsx` の描画ループ末尾に追加する。
`selectedGlasses` と `selectedEarring` は props で受け取る。

```js
// MakeupCanvas.jsx のrAFループ内（既存のdrawLip, drawCheek等の後）
drawGlasses(ctx, landmarks, glassesItem, canvas.width, canvas.height);
drawEarrings(ctx, landmarks, earringItem, canvas.width, canvas.height);
```

```jsx
// ArTryOnScreen.jsx → MakeupCanvas.jsx への props追加
<MakeupCanvas
  // ... 既存props
  glassesItem={GLASSES_ITEMS.find(i => i.id === selectedGlasses)}
  earringItem={EARRING_ITEMS.find(i => i.id === selectedEarring)}
/>
```

---

## 4. 「このメイクで決定」→ キャプチャ → 結果画面

### 4-1. ArTryOnScreen のボタン処理

```js
// ArTryOnScreen.jsx
const handleDecide = () => {
  // rAFを止めてから取得すると最終フレームが確実に取れる
  // （すでにrAFが動いている場合はそのままでも問題ない）
  const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.92);

  const glassesItem = GLASSES_ITEMS.find(i => i.id === selectedGlasses);
  const earringItem = EARRING_ITEMS.find(i => i.id === selectedEarring);

  // 価格0円のアイテム（なし）と選択外アイテムは除外
  const accessoryProducts = [
    ...(glassesItem && glassesItem.id !== 'none'
      ? [{ emoji: glassesItem.emoji, name: glassesItem.name,
           shade: glassesItem.shape || '', price: glassesItem.price,
           category: 'glasses' }]
      : []),
    ...(earringItem && earringItem.id !== 'none'
      ? [{ emoji: earringItem.emoji, name: earringItem.name,
           shade: earringItem.type || '', price: earringItem.price,
           category: 'earring' }]
      : []),
  ];

  onDecide({
    capturedImage: dataUrl,
    look: selectedLook,
    products: [
      ...(selectedLook?.products || []),
      ...accessoryProducts,
    ],
  });
};
```

```jsx
{/* ボタン */}
<button onClick={handleDecide} style={{
  flex: 1, padding: 12,
  background: 'linear-gradient(135deg, #a855f7, #ec4899)',
  border: 'none', borderRadius: 14, fontSize: 13, fontWeight: 700,
  color: '#fff', cursor: 'pointer',
}}>
  このメイクで決定 ✓
</button>
```

### 4-2. App.jsx / 画面遷移ロジック

`onDecide` の戻り値を `capturedImage` と `products` として保持し、
ResultScreen に渡す。

```js
// App.jsx または画面遷移管理箇所
const [capturedImage, setCapturedImage] = useState(null);
const [finalProducts, setFinalProducts] = useState([]);

// ArTryOnScreen の onDecide ハンドラ
const handleArDecide = ({ capturedImage, look, products }) => {
  setCapturedImage(capturedImage);
  setFinalProducts(products);
  setSelectedLook(look);
  setScreen(SC.RESULT);
};
```

### 4-3. ResultScreen の変更

```jsx
// ResultScreen.jsx
// props に capturedImage, products を追加

{/* 最上部にキャプチャ写真 */}
{capturedImage && (
  <div style={{ position: 'relative' }}>
    <img
      src={capturedImage}
      style={{ width: '100%', display: 'block', borderRadius: '0 0 24px 24px' }}
      alt="今日のメイク"
    />
    {/* SNSシェアCTA（任意） */}
    <button style={{
      position: 'absolute', bottom: 12, right: 12,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      border: '1px solid rgba(255,255,255,0.3)',
      borderRadius: 20, padding: '6px 14px',
      color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer',
    }}>
      📸 シェアする
    </button>
  </div>
)}

{/* 使用アイテム（コスメ + アクセサリー混在） */}
<div style={{ padding: '16px 16px 0' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
    <span style={{ fontSize: 11, fontWeight: 700, color: '#a855f7', letterSpacing: '0.05em' }}>
      KIREI SELECT
    </span>
    <span style={{ fontSize: 11, color: '#94a3b8' }}>使用アイテム</span>
  </div>
  {products.map((p, i) => (
    <div key={i} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px', marginBottom: 8,
      background: '#fff', borderRadius: 14,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <span style={{ fontSize: 22 }}>{p.emoji}</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#334155', margin: 0 }}>{p.name}</p>
        <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{p.shade}</p>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#a855f7', margin: 0 }}>
          ¥{p.price.toLocaleString()}
        </p>
        <p style={{ fontSize: 9, color: '#a855f7', margin: 0 }}>KIREI SELECT</p>
      </div>
    </div>
  ))}

  {/* 合計金額 */}
  <div style={{ textAlign: 'right', padding: '4px 4px 12px' }}>
    <span style={{ fontSize: 12, color: '#64748b' }}>合計 </span>
    <span style={{ fontSize: 16, fontWeight: 800, color: '#a855f7' }}>
      ¥{products.reduce((s, p) => s + p.price, 0).toLocaleString()}
    </span>
  </div>
</div>
```

---

## 5. 実装順序

1. `src/data/accessories.js` を新規作成（GLASSES_ITEMS, EARRING_ITEMS）
2. `MakeupCanvas.jsx` に `drawGlasses()`, `drawEarrings()` を追加し、propsで受け取る
3. `ArTryOnScreen.jsx` に `activeCategory` / `selectedGlasses` / `selectedEarring` state を追加
4. `ArTryOnScreen.jsx` の下部パネルUIをカテゴリタブ方式に置き換え
5. `ArTryOnScreen.jsx` の `handleDecide` を実装（canvasキャプチャ + onDecide）
6. `App.jsx` で `capturedImage` / `finalProducts` を state に追加し、ResultScreen に渡す
7. `ResultScreen.jsx` に `capturedImage` の表示と products の統合表示を追加
8. 動作確認

### コミット単位

```
feat: アクセサリーデータ追加（GLASSES_ITEMS, EARRING_ITEMS）
feat: MakeupCanvas にメガネ/イヤリングの描画レイヤー追加
feat: ARトライオン画面をカテゴリパネル方式に変更（リップ/チーク/メガネ/イヤリング）
feat: 「このメイクで決定」でcanvasキャプチャ → 結果画面に写真＋商品表示
```

---

## 6. 検証チェックリスト

- [ ] ARトライオン画面下部に4カテゴリタブが表示される（リップ/チーク/メガネ/イヤリング）
- [ ] カテゴリ切替でパレット/アイテム選択UIが入れ替わる
- [ ] リップを選択 → メガネタブへ切替 → リップの色が維持されている
- [ ] メガネが鼻梁ランドマーク中心に配置され、両耳まで伸びるテンプルが描画される
- [ ] round / square / wayfarer でフレーム形状が異なる
- [ ] サングラス（wayfarer）にはレンズの色がつく
- [ ] イヤリングが左右の耳珠ランドマークに配置される
- [ ] stud / drop / hoop / chain で見た目が異なる
- [ ] リップ+チーク+メガネ+イヤリングが同時に描画される
- [ ] 「なし」選択時はそのカテゴリが描画されない
- [ ] メガネ/イヤリングアクティブ時は濃さスライダーが非表示
- [ ] 「このメイクで決定」でカメラがシャッターを切る（フラッシュ演出任意）
- [ ] 結果画面の最上部にARメイク＋アクセサリー合成済み写真が表示される
- [ ] 結果画面の使用アイテムリストにコスメとアクセサリーが混在して表示される
- [ ] 「なし」を選んだアクセサリーは商品リストに含まれない
- [ ] 合計金額が正しく計算される
