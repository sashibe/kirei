# KIREI 緊急バグ修正指示書

> STEP4より先に対応すること。
> 3つのバグをすべて修正してからpushする。

---

## バグ① カラコンの位置ずれ

### 症状
カラコンが瞳の位置ではなく目頭の涙袋あたりに描画される。

### 原因
虹彩ランドマークの左右番号が逆、またはミラー反転の扱いが間違っている。

### 修正
`makeupRenderer.js` のカラコン描画部分を確認し、以下の番号を使う。

```js
// MediaPipe FaceLandmarker 虹彩ランドマーク
// refine_landmarks: true が必要（FaceLandmarkerの初期化オプションで有効化）
const RIGHT_IRIS_CENTER = 468; // 映像上では左側に見える（ミラー）
const LEFT_IRIS_CENTER  = 473; // 映像上では右側に見える（ミラー）

// 虹彩半径: 目頭(33)〜目尻(133)の距離の約18〜20%
const rightEyeWidth = dist(landmarks[33], landmarks[133]);
const leftEyeWidth  = dist(landmarks[362], landmarks[263]);
const rightIrisR = rightEyeWidth * 0.19;
const leftIrisR  = leftEyeWidth  * 0.19;

// 描画
function drawColorContact(ctx, cx, cy, radius, colorHex, intensity) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = intensity * 0.55;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = colorHex;
  ctx.fill();
  ctx.restore();
}
```

### 確認手順
修正後、カラコンを青に設定して瞳の中心に乗っているかを目視確認する。
ずれている場合は番号を468↔473で入れ替えてみる。

---

## バグ② ファンデーションが顔輪郭をはみ出す

### 症状
ファンデーションが首・耳周辺まで描画されており、顔のシルエットに沿っていない。

### 原因
フェイスオーバル領域のclipパスが設定されていないか、範囲が広すぎる。

### 修正
`makeupRenderer.js` のファンデーション描画関数に `ctx.clip()` を追加する。

```js
// フェイスオーバルのランドマーク番号（MediaPipe標準）
const FACE_OVAL_IDX = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
  397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
  172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
];

function drawFoundation(ctx, landmarks, W, H, colorHex, intensity) {
  ctx.save();

  // ① フェイスオーバルでclip（これが最重要）
  ctx.beginPath();
  FACE_OVAL_IDX.forEach((idx, i) => {
    const lm = landmarks[idx];
    const x = lm.x * W;
    const y = lm.y * H;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.clip(); // ← clip()の後に描画する

  // ② クリップ領域内にファンデを塗る
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = intensity * 0.35;
  ctx.fillStyle = colorHex;

  // フェイスオーバルと同じパスで塗りつぶす
  ctx.beginPath();
  FACE_OVAL_IDX.forEach((idx, i) => {
    const lm = landmarks[idx];
    i === 0 ? ctx.moveTo(lm.x * W, lm.y * H)
             : ctx.lineTo(lm.x * W, lm.y * H);
  });
  ctx.closePath();
  ctx.fill();

  ctx.restore(); // restoreでclipも解除される
}
```

### 確認手順
修正後、顔を横に向けても輪郭外にファンデが出ないことを確認する。

---

## バグ③ メガネ・イヤリングタブで商品が表示されない + スライダー消失

### 症状A
メガネ・イヤリングのカテゴリータブをタップしても商品カードが表示されない。

### 症状B
メイクのカラー変更スライダーが消えている（以前は表示されていた）。

### 原因の切り分け

**症状Aの原因候補:**
1. `products.js` にメガネ・イヤリングのデータが存在しない
2. カテゴリーIDのフィルタリング条件が間違っている
3. カテゴリーIDの文字列が `tab` 側と `products` 側で不一致

```js
// 確認: products.js のカテゴリーIDを確認する
// 例: 'glasses' と 'megane' が混在していないか
products.filter(p => p.category === activeCategory)
// activeCategory の値をconsole.logで確認
```

**症状Bの原因候補:**
1. スライダーコンポーネントのレンダリング条件が変わった
2. カテゴリー切り替え時にスライダーのstateがリセットされている
3. z-indexの問題でスライダーが他の要素の下に隠れている

### 修正手順

#### ステップ1: products.jsのカテゴリーID確認
```js
// products.js を開いて、メガネ・イヤリング商品のcategoryフィールドを確認
// ArTryOnScreen.jsx のCATEGORIES配列のidと完全一致しているか確認
```

#### ステップ2: カテゴリーフィルタのデバッグ
```js
// ArTryOnScreen.jsx に一時的にデバッグログを追加
const filteredProducts = products.filter(p => p.category === activeTab);
console.log('activeTab:', activeTab);
console.log('filteredProducts:', filteredProducts.length);
```

#### ステップ3: スライダーの表示条件確認
```js
// スライダーのJSXを確認し、表示条件が正しいか確認
// 例: activeTab === 'lip' のときだけ表示になっていないか
// → メイク系タブ全体で表示するように修正
const showSlider = ['base', 'lip', 'cheek', 'colorcon'].includes(activeTab);
```

#### ステップ4: メガネ・イヤリングのダミーデータ追加（商品データがない場合）
```js
// products.js にメガネ・イヤリングのサンプル商品を追加
{
  id: 'glasses-001',
  category: 'glasses', // ArTryOnScreenのCATEGORIES idと合わせる
  name: 'スクエアフレーム',
  price: 3980,
  affiliateUrl: '#',
  colors: ['#1a1a1a', '#8B4513', '#C0C0C0'],
},
{
  id: 'earring-001',
  category: 'earring',
  name: 'パールフープイヤリング',
  price: 2480,
  affiliateUrl: '#',
  colors: ['#F5F5DC', '#FFD700', '#C0C0C0'],
},
```

---

## 修正後の確認チェックリスト

- [ ] カラコンが両目の瞳中心に正確に描画される
- [ ] カラコンの色変更でリアルタイムに虹彩色が変わる
- [ ] ファンデーションが顔輪郭の内側だけに描画される
- [ ] 顔を横に向けてもファンデが輪郭外に出ない
- [ ] メガネタブで商品カードが表示される
- [ ] イヤリングタブで商品カードが表示される
- [ ] リップ・アイシャドウ等でスライダーが表示される
- [ ] カテゴリーを切り替えてもスライダーが消えない

---

## バグ④ 2週間後プレビュー画面から先に進めない

### 症状
スライダーとキラリセリフで画面が終わっており、
次の画面（スキンケアルーティン）への導線がない。

### 修正
キラリセリフの下に「商品を見る →」ボタンを1つ追加する。

```jsx
{/* キラリセリフの直下に配置 */}
<button
  onClick={() => onNavigate('suggest', { tab: 'skincare' })}
  style={{
    display: 'block',
    width: 'calc(100% - 32px)',
    margin: '12px 16px 0',
    padding: '16px',
    background: 'linear-gradient(135deg, #a855f7, #ec4899)',
    color: '#fff',
    border: 'none',
    borderRadius: 28,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  }}
>
  商品を見る →
</button>
```

### 遷移先
SuggestScreen の Skincare タブ（styleTab=2）を直接開く。
遷移時に `{ tab: 'skincare' }` を props または state で渡し、
SuggestScreen 側で `useEffect` により styleTab を 2 に設定する。

### 確認手順
- [ ] 「商品を見る →」ボタンが表示される
- [ ] タップするとスキンケアルーティン画面に遷移する
- [ ] 遷移先が Skincare タブで開いている

---

## バグ①-追記｜カラコンの円が巨大すぎる

### 症状
カラコンが瞳サイズではなく顔の半分を覆う巨大な円になっている。

### 原因
虹彩半径の計算で目幅ではなく顔幅・画面幅を参照している可能性が高い。

### 修正

```js
// ❌ NG: W（画面幅）やfaceWidthを使っている
const irisRadius = W * 0.19; // → 巨大になる

// ✅ OK: 目頭〜目尻の距離（目幅）の約19%
const rightEyeInner = landmarks[133]; // 右目目頭
const rightEyeOuter = landmarks[33];  // 右目目尻
const leftEyeInner  = landmarks[362]; // 左目目頭
const leftEyeOuter  = landmarks[263]; // 左目目尻

const rightEyeWidth = Math.hypot(
  (rightEyeOuter.x - rightEyeInner.x) * W,
  (rightEyeOuter.y - rightEyeInner.y) * H
);
const leftEyeWidth = Math.hypot(
  (leftEyeOuter.x - leftEyeInner.x) * W,
  (leftEyeOuter.y - leftEyeInner.y) * H
);

const rightIrisRadius = rightEyeWidth * 0.19;
const leftIrisRadius  = leftEyeWidth  * 0.19;
```

### 確認手順
- [ ] カラコンが瞳と同程度のサイズになっている
- [ ] 顔を近づけたり遠ざけたりしてもサイズが顔に追従する

---

## バグ⑤｜ARトライオン画面にチェックアウト導線がない

### 症状
ARトライオン（ArTryOnScreen）でメイクを試しても、
カートに追加・購入に進む手段がない。「このメイクで決定」的なCTAがない。

### 修正
カテゴリータブバーの上に **CartSummaryBar** を常時表示する。
商品カードに **「カートに追加」ボタン** を追加する。

#### 商品カードへのボタン追加

```jsx
// カテゴリーパネル内の各商品カード
<div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px' }}>
  {/* カラーチップ（タップでAR即反映） */}
  <div style={{ display: 'flex', gap: 6 }}>
    {product.colors.map(color => (
      <div
        key={color}
        onClick={() => applyMakeup(product, color)}
        style={{
          width: 28, height: 28, borderRadius: '50%',
          background: color,
          border: activeColor === color ? '2px solid #a855f7' : '2px solid transparent',
          cursor: 'pointer',
        }}
      />
    ))}
  </div>

  {/* 商品名・価格 */}
  <div style={{ flex: 1 }}>
    <div style={{ fontSize: 13, fontWeight: 600 }}>{product.name}</div>
    <div style={{ fontSize: 12, color: '#a855f7', fontWeight: 700 }}>
      ¥{product.price.toLocaleString()}
    </div>
  </div>

  {/* カートに追加ボタン */}
  <button
    onClick={() => dispatch({ type: 'ADD', payload: { partId: product.partId, type: 'makeup', product } })}
    style={{
      background: isInCart ? '#e2e8f0' : 'linear-gradient(135deg, #a855f7, #ec4899)',
      color: isInCart ? '#94a3b8' : '#fff',
      border: 'none', borderRadius: 16,
      padding: '6px 12px', fontSize: 12, fontWeight: 700,
      whiteSpace: 'nowrap', cursor: 'pointer',
    }}
  >
    {isInCart ? '✓ 追加済' : 'カートへ'}
  </button>
</div>
```

#### CartSummaryBar の配置

```jsx
// ArTryOnScreen の最下部・タブバーの上
{cartItems.length > 0 && (
  <div style={{
    position: 'absolute',
    bottom: TAB_BAR_HEIGHT, // タブバーの高さ分上
    left: 0, right: 0,
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(16px)',
    padding: '10px 16px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  }}>
    <div>
      <div style={{ fontSize: 12, color: '#94a3b8' }}>
        💄 {makeupCount}点  🧴 {skincareCount}点
      </div>
      <div style={{ fontSize: 17, fontWeight: 700, color: '#1e293b' }}>
        ¥{totalPrice.toLocaleString()}
      </div>
    </div>
    <button
      onClick={handleCheckout}
      style={{
        background: 'linear-gradient(135deg, #a855f7, #ec4899)',
        color: '#fff', border: 'none', borderRadius: 24,
        padding: '10px 20px', fontWeight: 700, fontSize: 14,
        whiteSpace: 'nowrap',
      }}
    >
      まとめて購入
    </button>
  </div>
)}
```

#### handleCheckout の実装

```js
// 各商品のアフィリエイトURLを500ms間隔で順次開く
const handleCheckout = () => {
  cartItems.forEach((item, i) => {
    setTimeout(() => {
      window.open(item.product.affiliateUrl, '_blank');
    }, i * 500);
  });
};
```

### 確認手順
- [ ] 商品カードに「カートへ」ボタンが表示される
- [ ] タップするとCartSummaryBarに点数・金額が表示される
- [ ] 追加済みの商品は「✓ 追加済」グレーに変わる
- [ ] 「まとめて購入」でアフィリエイトリンクが開く
- [ ] メイクとスキンケア両方のカートが統合されて合計が表示される

---

## バグ①-追記2｜カラコン：refine_landmarks の有効化確認

### メッシュ表示で判明したこと
カラコン（シアン）が上まぶた縁ラインに描画されている。
これは虹彩専用ランドマーク（468/473）が取得できておらず、
まぶたのランドマークを代わりに使っていることを示す。

虹彩ランドマーク（468〜477）はMediaPipeの
`outputFacialTransformationMatrixes` ではなく
**`refineLandmarks: true`** オプションで初期化した場合のみ取得できる。

### 確認・修正箇所

```js
// FaceLandmarkerContext.jsx または useFaceLandmarker.js
// FaceLandmarker の初期化オプションを確認する

const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
  baseOptions: {
    modelAssetPath: '...',
    delegate: 'GPU',
  },
  outputFaceBlendshapes: false,
  runningMode: 'VIDEO',
  numFaces: 1,
  refineLandmarks: true,  // ← これがfalseまたは未設定だと虹彩点が取れない
});
```

`refineLandmarks: true` を設定すると landmarks の配列が
468点から **478点**（+虹彩10点）に増える。

```
468: 右虹彩中心
469: 右虹彩上
470: 右虹彩右
471: 右虹彩下
472: 右虹彩左
473: 左虹彩中心
474: 左虹彩上
475: 左虹彩右
476: 左虹彩下
477: 左虹彩左
```

### 修正後のカラコン描画

```js
// refineLandmarks: true の場合
const RIGHT_IRIS_CENTER = 468;
const LEFT_IRIS_CENTER  = 473;

// 虹彩半径: 右虹彩左(472)〜右(470) の距離の半分
const rightIrisRadius = Math.hypot(
  (landmarks[470].x - landmarks[472].x) * W,
  (landmarks[470].y - landmarks[472].y) * H
) / 2;

const leftIrisRadius = Math.hypot(
  (landmarks[475].x - landmarks[477].x) * W,
  (landmarks[475].y - landmarks[477].y) * H
) / 2;
```

虹彩の左右端点から半径を直接計算するため、
目幅比率の推定が不要になり精度が大幅に上がる。

### 確認手順
- [ ] `refineLandmarks: true` が設定されている
- [ ] `landmarks.length` が 478 になっている（console.logで確認）
- [ ] カラコンが瞳の中心・サイズで正確に描画される

---

## バグ②-追記｜フェイスオーバルが顔輪郭に正確に沿っていない

### メッシュ表示で判明したこと（メガネなし確認）
紫のフェイスオーバルが実際の顔輪郭より内側にズレており、
特に左右の頬と顎のラインが正確でない。
このためファンデーションのclip範囲が顔より狭くなるか、
またはランドマーク番号が間違っていると逆に広すぎる。

### 正しいFACE_OVAL_IDXの確認

MediaPipeの公式フェイスオーバルランドマークは以下の順序で
顔の外周を一周する。現在の実装と照合すること。

```js
// MediaPipe 公式 Face Oval ランドマーク（時計回り）
const FACE_OVAL_IDX = [
  10,  338, 297, 332, 284, 251, 389, 356, 454, 323,
  361, 288, 397, 365, 379, 378, 400, 377, 152, 148,
  176, 149, 150, 136, 172, 58,  132, 93,  234, 127,
  162, 21,  54,  103, 67,  109, 10   // 10に戻って閉じる
];
```

### 確認手順

```js
// makeupRenderer.js または MakeupCanvas.jsx で
// フェイスオーバルを単独で描画してデバッグする

function debugFaceOval(ctx, landmarks, W, H) {
  ctx.save();
  ctx.strokeStyle = 'lime';
  ctx.lineWidth = 2;
  ctx.beginPath();
  FACE_OVAL_IDX.forEach((idx, i) => {
    const lm = landmarks[idx];
    i === 0
      ? ctx.moveTo(lm.x * W, lm.y * H)
      : ctx.lineTo(lm.x * W, lm.y * H);
  });
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}
// Mesh ONのときに呼び出して緑ラインが顔輪郭に沿うか確認
```

緑ラインが顔の外周に正確に沿っていれば番号は正しい。
ズレている場合は上記の公式番号に差し替える。

### 確認チェックリスト
- [ ] デバッグ用緑ラインが顔の外周（耳の前・顎ライン）に沿っている
- [ ] FACE_OVAL_IDXが公式番号と一致している
- [ ] ファンデーションがオーバル内だけに描画される

---

## バグ⑥｜目の輪郭（アイシャドウ領域）のサイズ・位置ズレ

### メッシュ表示で判明したこと
シアンの目輪郭が実際の目の開口部より大きく、
かつ上方向にズレている。
まぶたのクリース（折れ目）付近のランドマークを
目の輪郭として誤って使用していると思われる。

### 正しい目の輪郭ランドマーク

```js
// 目の「開口部」を正確に囲む点（上まぶた縁〜下まぶた縁）

// 右目（映像ではミラーで左に見える）
const RIGHT_EYE_CONTOUR = [
  // 上まぶた縁（左→右）
  33, 246, 161, 160, 159, 158, 157, 173, 133,
  // 下まぶた縁（右→左）
  155, 154, 153, 145, 144, 163, 7
];

// 左目（映像ではミラーで右に見える）
const LEFT_EYE_CONTOUR = [
  // 上まぶた縁
  362, 398, 384, 385, 386, 387, 388, 466, 263,
  // 下まぶた縁
  249, 390, 373, 374, 380, 381, 382
];
```

### アイシャドウ領域の修正

アイシャドウは目の開口部より**少し上・外側**に広げた領域に塗る。
目の開口部そのものではなくアイシャドウの自然な塗布範囲を再現する。

```js
function getEyeShadowRegion(eye_contour_landmarks, W, H, expandY = 0.3) {
  // 目の輪郭点を取得
  const points = eye_contour_landmarks.map(idx => ({
    x: landmarks[idx].x * W,
    y: landmarks[idx].y * H,
  }));

  // 上方向に expandY 分だけ拡張（アイシャドウは目より上）
  const eyeHeight = Math.max(...points.map(p => p.y)) - Math.min(...points.map(p => p.y));
  const expanded = points.map(p => ({
    x: p.x,
    y: p.y - eyeHeight * expandY, // 上にシフト
  }));

  return expanded;
}
```

### 確認手順

```js
// デバッグ: 目の輪郭を赤で描画して実際の目と比較
function debugEyeContour(ctx, landmarks, W, H) {
  [RIGHT_EYE_CONTOUR, LEFT_EYE_CONTOUR].forEach(contour => {
    ctx.save();
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    contour.forEach((idx, i) => {
      const lm = landmarks[idx];
      i === 0
        ? ctx.moveTo(lm.x * W, lm.y * H)
        : ctx.lineTo(lm.x * W, lm.y * H);
    });
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  });
}
// Mesh ONのときに呼び出して赤ラインが実際の目の縁に沿うか確認
```

- [ ] 赤ラインが実際の目の開口部（まぶたの縁）に正確に沿っている
- [ ] アイシャドウが目の上に自然な範囲で描画される
- [ ] 目より大きすぎる・上にズレすぎることがない

---

## バグ⑦【最重要】ランドマーク左右反転の未処理

### ユーザー手書き図で判明したこと
赤線（実際の顔）とメッシュ描画を比較した結果：

1. **フェイスオーバル（紫）が全周で実際の顔より一回り小さい**
2. **両目のシアン輪郭が鼻側に引き寄せられている**
   - 右目（画面左）→ 左にズレ
   - 左目（画面右）→ 右にズレ
   - 両目とも内側（鼻側）にズレ = 左右反転の典型パターン

### 根本原因
フロントカメラはミラー表示のため、MediaPipeのx座標を
そのまま使うとランドマークが左右逆に描画される。
x座標の反転処理（`1 - landmark.x`）が
一部または全部の描画関数で抜けている。

### 修正

```js
// makeupRenderer.js の全描画関数を統一的に修正

// ❌ NG: x座標をそのまま使う（左右が逆になる）
const x = landmark.x * W;
const y = landmark.y * H;

// ✅ OK: x座標を反転する
const x = (1 - landmark.x) * W;
const y = landmark.y * H;
```

### 修正箇所
`makeupRenderer.js` 内の以下すべての描画関数で統一する:
- `drawFoundation()`
- `drawLip()`
- `drawEyeShadow()`
- `drawCheek()`
- `drawBrow()`
- `drawConcealer()`
- `drawColorContact()`
- フェイスオーバルのclipパス生成部分

### 一括修正の推奨方法
個別修正ではなく、座標変換をヘルパー関数に集約する。

```js
// 座標変換ヘルパー（makeupRenderer.js の先頭に定義）
const lmX = (lm, W) => (1 - lm.x) * W;  // ミラー反転
const lmY = (lm, H) => lm.y * H;

// 使用例
ctx.moveTo(lmX(landmarks[idx], W), lmY(landmarks[idx], H));
```

既存コードで `landmark.x * W` となっている箇所を
すべて `lmX(landmark, W)` に置換する。
（`landmark.y * H` → `lmY(landmark, H)` は変更不要だが統一推奨）

### 確認手順
- [ ] Mesh ONで目の輪郭（シアン）が実際の目の位置に正確に重なる
- [ ] Mesh ONでフェイスオーバル（紫）が実際の顔輪郭に沿う
- [ ] メガネを外した状態でも両目が左右対称に描画される
- [ ] リップ・眉も実際の位置と一致する

### 優先度
**最高。** この1点を直すだけでオーバル・目・カラコン・
アイシャドウの位置ズレが全部改善する可能性が高い。
他のバグ修正より先に確認すること。

---

## バグ⑧｜カラーパレットの2行化でカメラ領域が狭くなる

### 症状
カラコンのカラーチップが15色で2行になり、
パネルが画面を圧迫してカメラ領域が狭くなる。
スマホを離さないと顔全体が映らない。

### 修正
カラーチップを横スクロール1行に変更する。

```js
// ArTryOnScreen.jsx のカラーパレット部分

// ❌ 現状
<div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>

// ✅ 修正: 横スクロール1行
<div style={{
  display: 'flex',
  flexWrap: 'nowrap',
  overflowX: 'auto',
  gap: 8,
  padding: '4px 2px',
  scrollbarWidth: 'none',      // Firefox
  msOverflowStyle: 'none',     // IE
}}>
// Webkit系はCSSで ::-webkit-scrollbar { display: none } を追加
```

カラコンだけでなく**全カテゴリーのカラーパレット**に同様に適用する。
パネルの高さを一定に保つことでカメラ領域が安定する。

### 確認手順
- [ ] カラーチップが1行横スクロールになっている
- [ ] スワイプで隠れた色にアクセスできる
- [ ] パネル高さが1行分に収まりカメラ領域が広がる

---

## バグ⑨｜アイシャドウカテゴリーの追加

### 概要
ARレンダラーにdrawEyeShadow()は実装済みだが
カテゴリータブに露出していない。追加する。

### ArTryOnScreenのCATEGORIES更新

```js
const CATEGORIES = [
  { id: 'base',      label: 'ベース',      emoji: '🧴' },
  { id: 'lip',       label: 'リップ',      emoji: '💄' },
  { id: 'eyeshadow', label: 'アイシャドウ', emoji: '✨' }, // ← 追加
  { id: 'cheek',     label: 'チーク',      emoji: '🌸' },
  { id: 'colorcon',  label: 'カラコン',    emoji: '👁'  },
  { id: 'glasses',   label: 'メガネ',      emoji: '👓' },
  { id: 'earring',   label: 'イヤリング',  emoji: '💍' },
  { id: 'lash',      label: 'まつげ',      emoji: '✨', soon: true },
];
```

### products.jsにアイシャドウ商品を追加

```js
// アイシャドウ商品サンプル（パーソナルカラー別）
{ id: 'eye-spring-01', category: 'eyeshadow',
  name: 'コーラルブラウンパレット', price: 1980,
  colors: ['#C4956A','#E8967A','#F4C2A1','#8B6355'],
  season: 'spring', affiliateUrl: '#' },
{ id: 'eye-summer-01', category: 'eyeshadow',
  name: 'モーブピンクパレット', price: 2200,
  colors: ['#C8A2C8','#D8BFD8','#E6E6FA','#9B6B8A'],
  season: 'summer', affiliateUrl: '#' },
{ id: 'eye-autumn-01', category: 'eyeshadow',
  name: 'テラコッタブラウンパレット', price: 1760,
  colors: ['#8B4513','#D2691E','#CD853F','#6B3A2A'],
  season: 'autumn', affiliateUrl: '#' },
{ id: 'eye-winter-01', category: 'eyeshadow',
  name: 'ネイビーパープルパレット', price: 2640,
  colors: ['#483D8B','#4B0082','#808080','#1C1C2E'],
  season: 'winter', affiliateUrl: '#' },
```

### makeupLooks.jsの各ルックにeyeshadowを追加

```js
// 既存の全ルックに eyeshadow フィールドを追加する
{
  id: 'clean-natural',
  name: 'クリーンナチュラル',
  base:      { color: '#F5DEB3', intensity: 0.3 },
  lip:       { color: '#E8967A', intensity: 0.5 },
  eyeshadow: { color: '#C4A882', intensity: 0.4 }, // ← 追加
  cheek:     { color: '#FFB6C1', intensity: 0.4 },
},
// 他のルックも同様に追加
```

### 確認手順
- [ ] アイシャドウタブが表示される
- [ ] タップでAR即反映される
- [ ] カラーチップが横スクロール1行になっている
- [ ] ルック適用時にアイシャドウも同時に描画される
