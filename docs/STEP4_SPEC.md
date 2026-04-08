# KIREI UI/UX 改善仕様書（STEP 4）
# Be Makeup+ 競合調査を踏まえた改善指示

> Claude Code はこのファイルを読んで実装する。
> STEP3完了後に着手すること。判断に迷う箇所はこの仕様に従う。

---

## 背景

マツキヨ「Be Makeup+」（Revieve SDK製）の実機調査により、以下が判明した。

**ARエンジンの精度は高いが、UI/UXの設計ミスで体験が死んでいる。**

KIREIは現段階（Canvas2D）でARエンジン精度では劣るが、
UI/UX設計で圧倒することで体験品質を逆転できる。
本仕様書はその改善を具体的に指示する。

---

## 改善 1｜ARの「試すコスト」を限りなくゼロに近づける

### 問題（Be Makeup+）
1アイテムを試すのに 6〜7アクション必要。
10個試すだけで心が折れる。

### 目標（KIREI）
**タップ1回で即AR反映。ボタン操作を挟まない。**

### 実装仕様

#### カラーチップのタップ即反映
```jsx
// Before（現状）: 「試す」ボタンを押してからARに反映
<button onClick={() => setPreviewProduct(product)}>試す</button>

// After（目標）: カラーチップをタップした瞬間に即反映
<div
  onClick={() => applyMakeupImmediately(color)}
  style={{ width: 28, height: 28, borderRadius: '50%', background: color.hex, cursor: 'pointer' }}
/>
```

「試す」ボタンは廃止する。カラーチップのタップ = AR即反映。

#### スワイプで次のカラーへ
カラーチップエリアで横スワイプすると、次のカラーに自動で切り替わる。
```
← スワイプ: 前のカラー
→ スワイプ: 次のカラー
```

#### 長押しでビフォーアフター
ARカメラ映像エリアを長押し中: ARオフ（素顔）
離したとき: ARオン（メイクあり）
キラリセリフ: 「長押しで素顔と比べられるよ✨」

---

## 改善 2｜顔エリアを死守する

### 問題（Be Makeup+）
商品カードが顔の大半を覆い、ARを確認できない。
カラー選択パネルを開くと顔が上1/3しか見えなくなる。

### 目標（KIREI）
**顔エリア（画面上部60%）は何があっても侵さない。**

### 実装仕様

```jsx
// ARカメラエリアのレイアウト固定
const FACE_AREA_HEIGHT = '60vh'; // 絶対に変更しない
const PANEL_AREA_HEIGHT = '40vh'; // 商品パネルはここに収める

// カラー選択パネルが開いても顔エリアは縮まない
// パネルは下から上にスライドインするが、顔エリアを押し上げない
```

カラー選択パネルは `position: fixed; bottom: 0` で顔の上に被せず、
顔エリアを縮小させない設計にする。

---

## 改善 3｜ボタン設計の原則

### 問題（Be Makeup+）
- 「カートに入れる」が3行に折り返す
- 同じサイズのボタンが3つ並んでCTAの優先度が不明

### 目標（KIREI）
**ボタンテキストは絶対に折り返さない。アイコン+最大6文字。**

### 実装ルール
```jsx
// NG
<button>カートに入れる</button>  // 折り返す可能性あり

// OK
<button><CartIcon /> カートへ</button>  // アイコン+短テキスト

// ボタン優先度の原則
// Primary（塗り）: 購入・決定系 → 1つだけ
// Secondary（線）: 操作系（色を変える等）→ 最大1つ
// Tertiary（テキストのみ）: 取り消し系
```

---

## 改善 4｜ARカテゴリーにカラコンを追加

### 背景
つけまつげ・カラコンはARメイクの重要カテゴリー。
Be Makeup+にはなく、KIREIの差別化になる。

### 実装範囲（Canvas2D段階）

#### カラコン（今すぐ実装）
MediaPipe ランドマークから瞳の中心座標を取得し、
円形マスクで虹彩領域に色を重ねる近似実装。

```js
// 瞳中心のランドマーク番号
const LEFT_IRIS_CENTER = 468;  // MediaPipe FaceLandmarker拡張点
const RIGHT_IRIS_CENTER = 473;

// 瞳半径の推定: 目頭〜目尻の距離の約20%
const irisRadius = eyeWidth * 0.20;

// 描画
ctx.save();
ctx.globalCompositeOperation = 'multiply';
ctx.globalAlpha = intensity * 0.6;
ctx.beginPath();
ctx.arc(irisX, irisY, irisRadius, 0, Math.PI * 2);
ctx.fillStyle = colorHex;
ctx.fill();
ctx.restore();
```

カラーパレット: ブラウン系・グレー系・ブルー系・グリーン系・パープル系 各3色

#### つけまつげ（スタブのみ、WebGL移行後に実装）
カテゴリータブには表示するが「近日公開」バッジを付けてタップ不可にする。
WebGL移行後にシェーダー実装。

### ARTryOnScreenのカテゴリータブ更新
```
現状: Eyes / Lips / Face
変更後: Eyes / Lips / Face / カラコン / まつげ(近日)
```

タブが5つになるので横スクロール対応にする。
```jsx
<div style={{ display: 'flex', overflowX: 'auto', gap: 8, padding: '0 16px' }}>
  {CATEGORIES.map(cat => <CategoryTab key={cat.id} {...cat} />)}
</div>
```

---

## 改善 5｜セット提案 + パーツ単位カスタマイズ + カート積み上げ

### 問題（現状KIREI）
キラリがおすすめセットを提案するが、そこからの変更ができない。
ユーザーが「このリップだけ別の色にしたい」と思っても詰んでいる。
結果、購買単価が固定されてしまう。

### 目標
**セット提案を入口に保ちつつ、パーツ単位で差し替えられる。
気に入ったものだけカートに積んで合計金額をリアルタイム表示。**

### UXフロー
```
キラリのおすすめセット表示（入口）
  ↓
「このまま購入」→ セット一括でアフィリエイトリンクへ
「カスタマイズする」→ パーツ別差し替えモードへ
  ↓
パーツ別差し替えモード:
  各パーツ（リップ/アイ/チーク/ファンデ/カラコン）に
  別の商品候補を横スワイプで表示
  タップした商品がARに即反映 + カートに追加
  ↓
カートサマリー（画面下部に常時表示）:
  選択中のアイテム数 / 合計金額
  「まとめて購入する」→ 各商品のアフィリエイトリンクを順次開く
```

### コンポーネント設計

#### CartSummaryBar（新規）
```jsx
// 画面下部に常時固定表示
const CartSummaryBar = ({ cartItems, onCheckout }) => (
  <div style={{
    position: 'fixed', bottom: 0, left: 0, right: 0,
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(12px)',
    padding: '12px 16px',
    borderTop: '1px solid #ede9fe',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  }}>
    <div>
      <span style={{ fontSize: 12, color: '#94a3b8' }}>{cartItems.length}アイテム</span>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>
        ¥{totalPrice.toLocaleString()}
      </div>
    </div>
    <button onClick={onCheckout} style={{
      background: 'linear-gradient(135deg, #a855f7, #ec4899)',
      color: '#fff', border: 'none', borderRadius: 24,
      padding: '12px 24px', fontWeight: 700, fontSize: 15,
    }}>
      まとめて購入
    </button>
  </div>
);
```

#### カートstate管理
```js
// useCart hook（新規作成: src/hooks/useCart.js）
const [cartItems, dispatch] = useReducer(cartReducer, []);

// アクション
dispatch({ type: 'ADD', payload: { partId: 'lip', product } });
dispatch({ type: 'REMOVE', payload: { partId: 'lip' } });
dispatch({ type: 'REPLACE', payload: { partId: 'lip', product } }); // 差し替え

// 同一パーツは1商品のみ（差し替え）
// 合計金額 = cartItems.reduce((sum, item) => sum + item.price, 0)
```

#### まとめて購入の実装
```js
const handleCheckout = () => {
  // 各商品のアフィリエイトURLを順次開く（ポップアップブロック対策で500ms間隔）
  cartItems.forEach((item, i) => {
    setTimeout(() => {
      window.open(item.affiliateUrl, '_blank');
    }, i * 500);
  });
};
```

---

## 改善 6｜スキンケアのカート統合

### 基本方針
メイクとスキンケアは**同一カートに統合**する。
ボタン名はメイク・スキンケアで区別せず**「カートに追加」で統一**。

### cartItemsのデータ構造
```js
// src/hooks/useCart.js
cartItems = [
  // メイク系
  { partId: 'lip',          type: 'makeup',   product: { name, price, affiliateUrl, ... } },
  { partId: 'eye',          type: 'makeup',   product: { ... } },
  // スキンケア系
  { partId: 'serum',        type: 'skincare', product: { ... } },
  { partId: 'moisturizer',  type: 'skincare', product: { ... } },
]
// 同一partIdは1商品のみ（後から追加したもので上書き）
```

### CartSummaryBarの表示
```
┌──────────────────────────────────────┐
│ 💄 3点  🧴 2点          合計 ¥12,480 │
│            [ まとめて購入する ]        │
└──────────────────────────────────────┘
```
- 💄 メイク点数 / 🧴 スキンケア点数 をラベルで区別
- 合計金額は一本化
- 「まとめて購入する」で全商品のアフィリエイトリンクを500ms間隔で順次開く

### スキンケアのカート追加フロー
ARトライオンがないため、メイクと異なる導線になる。

```
肌スコア表示（今の課題が見える）
  ↓
キラリが課題と商品を紐づけて説明
  例:「くすみスコアが低めだから、ビタミンC系を入れてみよう」
  ↓
商品カードに「カートに追加」ボタン
  ↓
CartSummaryBarに即反映（点数・合計金額が更新される）
```

### スキンケア商品カードのUI
```jsx
<div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
  <img src={product.image} style={{ width: 56, height: 56, borderRadius: 8 }} />
  <div style={{ flex: 1 }}>
    <div style={{ fontSize: 12, color: '#94a3b8' }}>{product.concern}</div> {/* 対応する課題 */}
    <div style={{ fontSize: 14, fontWeight: 600 }}>{product.name}</div>
    <div style={{ fontSize: 15, fontWeight: 700, color: '#a855f7' }}>¥{product.price.toLocaleString()}</div>
  </div>
  <button
    onClick={() => dispatch({ type: 'ADD', payload: { partId: product.partId, type: 'skincare', product } })}
    style={{
      background: 'linear-gradient(135deg, #a855f7, #ec4899)',
      color: '#fff', border: 'none', borderRadius: 20,
      padding: '8px 16px', fontWeight: 700, fontSize: 13,
      whiteSpace: 'nowrap', // 折り返し禁止
    }}
  >
    カートに追加
  </button>
</div>
```

### カートに追加済みの状態
同じ商品が追加済みの場合、ボタンを「✓ 追加済み」に変えてグレーアウト。
再タップでカートから除外（トグル動作）。

```jsx
const isInCart = cartItems.some(item => item.partId === product.partId);
<button onClick={() => dispatch({ type: isInCart ? 'REMOVE' : 'ADD', payload: ... })}>
  {isInCart ? '✓ 追加済み' : 'カートに追加'}
</button>
```

---

## 改善 7｜キラリのセリフ強化（AR操作ガイド）

Be Makeup+はARの使い方が直感的でなく、ユーザーが迷う。
KIREIはキラリが操作を自然にナビゲートする。

### 追加セリフ（useKirari.jsに追記）

```js
const AR_GUIDE_DIALOGUES = {
  onFirstOpen: 'カラーをタップすると即試せるよ✨',
  onLongPress: 'そう！長押しで素顔と比べられるよ',
  onCartAdd: (itemName) => `${itemName}、カートに入れたよ🛒`,
  onColorChange: (colorName) => `${colorName}、似合ってる！`,
  onCategorySwitch: (category) => `${category}を見てみようか`,
  onCustomize: 'パーツごとに変えられるよ。気に入ったのだけでOK！',
  onCheckout: (count, price) => `${count}アイテム、合計¥${price.toLocaleString()}。いい選択だね✨`,
};
```

---

## 実装順序

1. **改善2**（顔エリア死守のレイアウト固定）— 基盤。先にやる
2. **改善1**（タップ即反映・スワイプ・長押し）— UXの核心
3. **改善3**（ボタン設計統一）— 全画面に適用
4. **改善5**（カート積み上げ）— ResultScreen + ArTryOnScreen の変更
5. **改善4**（カラコン追加）— 新カテゴリー
6. **改善6**（キラリセリフ追記）— useKirari.jsに追記

---

## やらないこと（Be Makeup+の轍を踏まない）

| やらないこと | 理由 |
|------------|------|
| ARモード選択画面（カメラ/写真/モデル）を最初に出す | 鏡を開いたら即カメラ起動が原則 |
| 分析結果を1枚ずつスワイプで見せる | キラリが1セリフで読み上げる |
| 「試す」ボタンを商品カードに置く | タップ即反映で不要 |
| 同じサイズのボタンを3つ以上並べる | CTAの優先度を明確にする |
| 外部SDK名をUIに表示する | ブランド体験を損なう |
| アンケート形式の事前質問 | カメラ解析とGPSで自動取得 |

---

## 改善 8｜ARトライオン画面の全画面化【最優先】

### 問題（現状）
スクリーンショット確認済み。カメラ映像が角丸ボックスに収まっており、
ヘッダー・戻るボタン・キラリ吹き出しがカメラ外に配置されている。
顔が画面の約半分しか使えておらず、ARの没入感がない。

### 目標
**カメラ映像を100vw × 100vhの全画面に。すべてのUI要素をカメラ映像の上にオーバーレイする。**

### レイアウト構造

```
position: fixed; inset: 0        ← カメラ映像（全画面）
  ↓ その上に position: absolute で重ねる

[左上] ルック名ラベル
[右上] Meshトグル
[左上・その下] 戻るボタン
[中央下] キラリ吹き出し         ← backdrop-filter: blur で半透明
[最下部] カテゴリータブバー      ← backdrop-filter: blur で半透明
[タブバー上] CartSummaryBar      ← カート有の時のみ表示
```

### 実装仕様

```jsx
// ArTryOnScreen.jsx の最外層コンテナ
<div style={{
  position: 'fixed',
  inset: 0,
  width: '100vw',
  height: '100vh',
  background: '#000',
  overflow: 'hidden',
}}>

  {/* カメラ映像 + Canvasを全画面に */}
  <video style={{
    position: 'absolute', inset: 0,
    width: '100%', height: '100%',
    objectFit: 'cover',
    objectPosition: 'center top', // 顔が切れる場合は上寄せ
  }} />
  <canvas style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

  {/* 左上: ルック名 */}
  <div style={{
    position: 'absolute',
    top: 'env(safe-area-inset-top, 16px)', left: 16,
    background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)',
    borderRadius: 12, padding: '6px 12px', color: '#fff',
  }}>
    <div style={{ fontSize: 11, opacity: 0.7 }}>{look.category}</div>
    <div style={{ fontSize: 14, fontWeight: 700 }}>{look.name}</div>
  </div>

  {/* 右上: Meshトグル */}
  <div style={{ position: 'absolute', top: 'env(safe-area-inset-top, 16px)', right: 16 }}>
    <MeshToggle />
  </div>

  {/* 戻るボタン */}
  <button style={{
    position: 'absolute',
    top: 'calc(env(safe-area-inset-top, 16px) + 56px)', left: 16,
    background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)',
    border: 'none', borderRadius: 20, color: '#fff',
    padding: '6px 14px', fontSize: 13, cursor: 'pointer',
  }}>
    ← 戻る
  </button>

  {/* キラリ吹き出し */}
  <div style={{
    position: 'absolute',
    bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)',
    left: 16, right: 16,
    background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
    borderRadius: 16, padding: '10px 14px',
    display: 'flex', alignItems: 'center', gap: 10,
  }}>
    <KirariIcon size={36} />
    <p style={{ fontSize: 14, margin: 0 }}>{kirariMessage}</p>
  </div>

  {/* カテゴリータブバー */}
  <div style={{
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(16px)',
    borderTop: '1px solid rgba(255,255,255,0.4)',
    display: 'flex', overflowX: 'auto',
  }}>
    {CATEGORIES.map(cat => <CategoryTab key={cat.id} {...cat} />)}
  </div>

  {/* CartSummaryBar: カート有の時のみ */}
  {cartItems.length > 0 && <CartSummaryBar />}

</div>
```

### viewport設定（index.html確認・追加）
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```
`viewport-fit=cover` がないとsafe-area-inset-*が効かない。必須。

---

## 実装順序（更新）

1. **改善8**（ARトライオン全画面化）— **最優先。見た目の差が最も大きい**
2. **改善2**（顔エリア死守）— 全画面化と同時に対応
3. **改善1**（タップ即反映・スワイプ・長押し）— UXの核心
4. **改善3**（ボタン設計統一・折り返し禁止）— 全画面に適用
5. **改善5**（カート積み上げ・useCart hook）— ResultScreen + ArTryOnScreen
6. **改善6**（スキンケアカート統合）— SuggestScreen（Skincare tab）
7. **改善4**（カラコン追加）— 新カテゴリー
8. **改善7**（キラリセリフ追記）— useKirari.jsに追記

---

## 改善 9｜2週間後プレビュー画面の全画面化

### 問題（現状・スクリーンショット確認済み）
- カメラが画面上半分のボックスに収まっている
- スライダー・キラリ・FAQ・CTAが縦積みでカメラ外にある
- ボタン名が「このルーティンを始める」になっている（「カートに追加」に統一が必要）
- 左上の「87%」バッジがUIとして浮いていて意味が不明瞭

### 目標
**顔を全画面に。スライダーを顔の上にオーバーレイ。
「今 ←→ 2週間後」をリアルタイムで比較しながら操作できる。**

### レイアウト構造

```
position: fixed; inset: 0        ← 顔（2週間後フィルター適用）全画面
  ↓ その上に position: absolute で重ねる

[顔の下部 30%エリア]
  今 ━━━━━━●──── 2週間後     ← スライダー（オーバーレイ）
  スライダー値に連動して顔フィルター強度が変化

[スライダーの下]
  キラリ吹き出し（小）

[最下部]
  [なぜ2週間後？▼]  [カートに追加]
```

### 実装仕様

```jsx
<div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', background: '#000' }}>

  {/* 顔映像（フィルター適用済み）全画面 */}
  <video style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
  <canvas style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

  {/* スキンスコアバッジ: 左上（小さく） */}
  <div style={{
    position: 'absolute',
    top: 'env(safe-area-inset-top, 16px)', left: 16,
    background: 'rgba(168,85,247,0.85)', backdropFilter: 'blur(8px)',
    borderRadius: 20, padding: '4px 12px', color: '#fff', fontSize: 13, fontWeight: 700,
  }}>
    肌スコア {skinScore}
  </div>

  {/* 顔下部オーバーレイエリア */}
  <div style={{
    position: 'absolute', bottom: 0, left: 0, right: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
    padding: '24px 20px',
    paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)',
  }}>

    {/* 今 ←→ 2週間後 スライダー */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, whiteSpace: 'nowrap' }}>今</span>
      <input
        type="range" min={0} max={100} value={filterStrength}
        onChange={e => setFilterStrength(Number(e.target.value))}
        style={{ flex: 1, accentColor: '#a855f7' }}
      />
      <span style={{ color: '#a855f7', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>2週間後</span>
    </div>

    {/* キラリ吹き出し（コンパクト版） */}
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
    }}>
      <KirariIcon size={28} />
      <span style={{ color: '#fff', fontSize: 13 }}>{kirariMessage}</span>
    </div>

  </div>

  {/* 最下部: FAQ + CTA */}
  <div style={{
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)',
    borderTop: '1px solid rgba(255,255,255,0.4)',
    padding: '12px 16px',
  }}>

    {/* なぜ2週間後？アコーディオン */}
    <button
      onClick={() => setFaqOpen(v => !v)}
      style={{
        width: '100%', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', background: 'none', border: 'none',
        fontSize: 14, color: '#a855f7', fontWeight: 600, cursor: 'pointer',
        marginBottom: faqOpen ? 8 : 12,
      }}
    >
      <span>❓ なぜ2週間後なの？</span>
      <span>{faqOpen ? '▲' : '▼'}</span>
    </button>
    {faqOpen && (
      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12, lineHeight: 1.6 }}>
        スキンケアの効果が肌のターンオーバーを通じて現れるのに
        おおよそ2週間かかるためです。個人差があります。
      </p>
    )}

    {/* CTA: カートに追加 */}
    <button style={{
      width: '100%',
      background: 'linear-gradient(135deg, #a855f7, #ec4899)',
      color: '#fff', border: 'none', borderRadius: 28,
      padding: '16px', fontSize: 16, fontWeight: 700, cursor: 'pointer',
      whiteSpace: 'nowrap',
    }}>
      カートに追加
    </button>

  </div>

</div>
```

### ボタン名の修正
- ❌ 「このルーティンを始める」→ ✅ **「カートに追加」**
- メイク・スキンケア全画面で統一

### スライダーと顔フィルターの連動
```js
// filterStrength: 0（今）〜 100（2週間後）
// Canvas上でフィルター強度を変化させる
const applySkincareFilter = (ctx, strength) => {
  const alpha = strength / 100;
  // 肌の平滑化（ぼかし強度）
  // トーンアップ（白オーバーレイのアルファ）
  // くすみ軽減（overlay）
  // → 既存のスキンケアAR実装と連動
};
```

### スキンスコアバッジの整理
「87%」が何の数値か不明瞭だった問題を解消する。
- 「87%」→「肌スコア 87」にラベルを付ける
- バッジをタップすると詳細スコアが展開するようにする（将来実装）


---

## 改善 10｜スキンケアルーティン画面のCTA・購入フロー修正

### 問題（現状・スクリーンショット確認済み）

**ボタン名と画面の実態が一致していない。**

| 現状ボタン名 | 実際の遷移先 | 問題 |
|------------|------------|------|
| 「商品をまとめて見る」 | チェックリスト＋購入画面 | 「見る」なのに購入画面が出る |
| 「選択した商品を購入する」 | MUSINSAへ遷移 | これはOK、実態と一致 |
| 「✨ 結果を見る →」 | 別画面へ | 「商品を購入する」と2つ並んでCTAが競合 |

**全アイテムがデフォルト全選択になっており押しつけがましい。**
9アイテム¥20,520を一括で選択状態にするのは心理的障壁が高い。

### 修正仕様

#### ボタン名の修正
```
❌ 「商品をまとめて見る」
✅ 「商品を購入する」

理由: 次画面がチェックリスト＋購入フローなので
     「見る」は実態と乖離している
```

#### CTAの優先度整理
ルーティン一覧画面の末尾に並ぶ2ボタンを整理する。

```
❌ 現状（2つのPrimaryボタンが縦並び）
  [🛒 商品をまとめて見る]   ← Primary
  [✨ 結果を見る →]         ← Primary
  → どちらが主導線か不明

✅ 修正後（優先度を明確化）
  [🛒 商品を購入する]       ← Primary（グラデーション塗り）
  [結果を見る →]            ← Secondary（テキストのみ or 線ボタン）
```

#### デフォルト選択の修正
全アイテムをデフォルト全選択にしない。
**肌スコアで「Care」判定になった課題に紐づく商品のみデフォルト選択。**
それ以外はオフにしておく。

```js
// 商品データに concern フィールドを持たせる
const products = [
  { id: 'vitamin-c', name: 'ビタミンC美容液', concern: 'dullness', ... },
  { id: 'retinol',   name: 'レチノールリフト美容液', concern: 'texture', ... },
  ...
];

// デフォルト選択: スコアがCare以下の課題に紐づく商品のみ
const defaultSelected = products
  .filter(p => skinConcerns.includes(p.concern))
  .map(p => p.id);

const [selectedItems, setSelectedItems] = useState(defaultSelected);
```

キラリセリフ例:
「くすみが気になるから、ビタミンCとトーニングローションを選んでおいたよ。他も見てみてね」

#### 合計金額表示の改善
全選択時¥20,520は心理的障壁になる。
チェックを外すと合計が下がる動きを見せることで「自分でコントロールできる」感を出す。

```jsx
// 選択中の合計をリアルタイム表示
<div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px' }}>
  <span style={{ fontSize: 14, color: '#64748b' }}>
    選択中（{selectedItems.length}件）
  </span>
  <span style={{ fontSize: 18, fontWeight: 700, color: '#a855f7' }}>
    ¥{selectedTotal.toLocaleString()}
  </span>
</div>
```

