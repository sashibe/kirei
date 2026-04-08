# KIREI 実商品データ取得・3層UI実装仕様書

> Claude Code はこのファイルを読んで実装する。
> 楽天APIで実商品データを取得し、カテゴリー→商品→カラーパレットの3層UIを実装する。

---

## 環境変数

`.env.local` に以下を追記する:

```
VITE_RAKUTEN_APP_ID=fea85589-cff0-4ce0-afbd-f249bb6adf15
VITE_RAKUTEN_AFFILIATE_ID=529d62d4.9af01a4d.529d62d5.1d5e6732
```

---

## Step 1｜商品データ取得スクリプト

`scripts/fetchRakutenProducts.mjs` を新規作成する。
Node.jsで実行してJSONを生成し `src/data/products.js` に書き出す。

```js
// scripts/fetchRakutenProducts.mjs
// 実行: node scripts/fetchRakutenProducts.mjs

import { writeFileSync } from 'fs';

const APP_ID       = 'fea85589-cff0-4ce0-afbd-f249bb6adf15';
const AFFILIATE_ID = '529d62d4.9af01a4d.529d62d5.1d5e6732';
const BASE_URL     = 'https://app.rakuten.co.jp/services/api/IchibaItem/Search/20170706';

const SEARCHES = [
  { category: 'lip',       label: 'リップ',       keyword: '口紅 ティント コスメ',         hits: 5 },
  { category: 'eyeshadow', label: 'アイシャドウ', keyword: 'アイシャドウ パレット コスメ', hits: 5 },
  { category: 'cheek',     label: 'チーク',        keyword: 'チーク ブラッシュ コスメ',     hits: 5 },
  { category: 'base',      label: 'ベース',        keyword: 'BBクリーム リキッドファンデ',  hits: 5 },
  { category: 'colorcon',  label: 'カラコン',      keyword: 'カラーコンタクト ワンデー',    hits: 5 },
];

async function fetchCategory({ category, keyword, hits }) {
  const params = new URLSearchParams({
    applicationId: APP_ID,
    affiliateId:   AFFILIATE_ID,
    keyword,
    hits,
    sort:          '-reviewCount',
    imageFlag:     1,
    genreId:       '558885',
    format:        'json',
  });

  const res  = await fetch(`${BASE_URL}?${params}`);
  const json = await res.json();

  if (!json.Items) {
    console.warn(`[${category}] 取得失敗:`, json);
    return [];
  }

  return json.Items.map(({ Item: item }) => ({
    id:           item.itemCode.replace(':', '_'),
    category,
    name:         item.itemName.slice(0, 40),
    price:        item.itemPrice,
    image:        item.mediumImageUrls[0]?.imageUrl ?? '',
    affiliateUrl: item.affiliateUrl,
    rakutenUrl:   item.itemUrl,
    colors:       [], // 手動で追記
    baseColor:    '#000000', // 手動で追記
  }));
}

async function main() {
  const allProducts = [];

  for (const search of SEARCHES) {
    console.log(`取得中: ${search.label}...`);
    const items = await fetchCategory(search);
    allProducts.push(...items);
    console.log(`  → ${items.length}件取得`);
    await new Promise(r => setTimeout(r, 1100)); // 1QPS制限
  }

  const output = `// src/data/products.js
// 楽天APIから取得した実商品データ
// 生成日: ${new Date().toISOString()}
// ※ colors・baseColor は目視で追記すること

export const PRODUCTS = ${JSON.stringify(allProducts, null, 2)};
`;

  writeFileSync('src/data/products.js', output, 'utf-8');
  console.log(`完了: ${allProducts.length}件を src/data/products.js に書き出しました`);
}

main().catch(console.error);
```

実行:
```
node scripts/fetchRakutenProducts.mjs
```

---

## Step 2｜色情報を手動追記

スクリプト実行後、`src/data/products.js` の各商品に
`colors`（カラー展開）と `baseColor`（デフォルト色）を追記する。

```js
// 追記例（リップ）
colors: [
  { id: 'c01', name: 'ロゼベージュ',   hex: '#C4826A' },
  { id: 'c02', name: 'コーラルピンク', hex: '#E8705A' },
  { id: 'c03', name: 'モーブローズ',   hex: '#B06080' },
  { id: 'c04', name: 'レッド',         hex: '#C03030' },
  { id: 'c05', name: 'テラコッタ',     hex: '#A05040' },
],
baseColor: '#C4826A',
```

---

## Step 3｜3層UI実装（ArTryOnScreen.jsx）

### 追加するstate

```js
const [selectedProduct, setSelectedProduct] = useState(null);
const [selectedColor,   setSelectedColor]   = useState(null);
```

### Layer 2｜商品カード（横スクロール）

カテゴリータブの下に追加する。

```jsx
const categoryProducts = PRODUCTS.filter(p => p.category === activeCategory);

<div style={{
  display: 'flex', overflowX: 'auto', gap: 10,
  padding: '10px 16px', scrollbarWidth: 'none',
}}>
  {categoryProducts.map(product => (
    <div
      key={product.id}
      onClick={() => {
        setSelectedProduct(product);
        const defaultColor = product.colors[0];
        if (defaultColor) {
          setSelectedColor(defaultColor);
          applyMakeup(product.category, defaultColor.hex, intensity);
        }
      }}
      style={{
        flexShrink: 0, width: 80, cursor: 'pointer',
        opacity:   selectedProduct?.id === product.id ? 1 : 0.6,
        transform: selectedProduct?.id === product.id ? 'scale(1.05)' : 'scale(1)',
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{
        width: 80, height: 80, borderRadius: 12, overflow: 'hidden',
        border: selectedProduct?.id === product.id
          ? '2px solid #a855f7' : '2px solid transparent',
      }}>
        <img src={product.image} alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      <div style={{ fontSize: 10, fontWeight: 600, marginTop: 4,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {product.name}
      </div>
      <div style={{ fontSize: 10, color: '#a855f7', fontWeight: 700 }}>
        ¥{product.price.toLocaleString()}
      </div>
    </div>
  ))}
</div>
```

### Layer 3｜カラーパレット + スライダー + カートボタン

```jsx
{selectedProduct && selectedProduct.colors.length > 0 && (
  <div style={{ padding: '8px 16px' }}>

    {/* 商品名 */}
    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
      {selectedProduct.name}
    </div>

    {/* カラーチップ */}
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto',
      scrollbarWidth: 'none', paddingBottom: 4 }}>
      {selectedProduct.colors.map(color => (
        <div
          key={color.id}
          onClick={() => {
            setSelectedColor(color);
            applyMakeup(selectedProduct.category, color.hex, intensity);
          }}
          style={{
            flexShrink: 0, width: 32, height: 32, borderRadius: '50%',
            background: color.hex, cursor: 'pointer',
            border: selectedColor?.id === color.id
              ? '3px solid #a855f7' : '3px solid transparent',
            transition: 'border 0.1s',
          }}
          title={color.name}
        />
      ))}
    </div>

    {/* 強さスライダー */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
      <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
        メイクの強さ
      </span>
      <input type="range" min={0} max={100} value={intensity}
        onChange={e => {
          setIntensity(Number(e.target.value));
          if (selectedColor)
            applyMakeup(selectedProduct.category, selectedColor.hex, Number(e.target.value));
        }}
        style={{ flex: 1, accentColor: '#a855f7' }}
      />
      <span style={{ fontSize: 12, color: '#a855f7', fontWeight: 700, minWidth: 32 }}>
        {intensity}%
      </span>
    </div>

    {/* カートに追加 */}
    {selectedColor && (() => {
      const isInCart = cartItems.some(i => i.partId === selectedProduct.category);
      return (
        <button
          onClick={() => dispatch({
            type: isInCart ? 'REMOVE' : 'ADD',
            payload: {
              partId: selectedProduct.category,
              type: 'makeup',
              product: {
                ...selectedProduct,
                selectedColor,
                displayName: `${selectedProduct.name}（${selectedColor.name}）`,
              },
            },
          })}
          style={{
            width: '100%', marginTop: 10,
            background: isInCart ? '#e2e8f0'
              : 'linear-gradient(135deg, #a855f7, #ec4899)',
            color: isInCart ? '#94a3b8' : '#fff',
            border: 'none', borderRadius: 24,
            padding: '12px', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          {isInCart ? '✓ カートに追加済み' : 'カートに追加'}
        </button>
      );
    })()}
  </div>
)}
```

### メガネ・イヤリングの扱い

カラーパレットではなくアイテム選択形式を維持する。

```jsx
{['glasses', 'earring'].includes(activeCategory)
  ? <ItemSelector ... />      // 既存のアイテム選択UI
  : <ColorPaletteLayer ... /> // 上記の3層UI
}
```

---

## 実装順序

1. `scripts/fetchRakutenProducts.mjs` を作成
2. `node scripts/fetchRakutenProducts.mjs` を実行
3. 生成された `src/data/products.js` を確認し、各商品に `colors` と `baseColor` を追記
4. `ArTryOnScreen.jsx` を3層UIに変更
5. 動作確認（商品タップ → AR反映 → カラー切替 → カート追加）

---

## 全25商品のcolorsデータ

以下を `src/data/products.js` の各商品に追記すること。
商品の順番はカテゴリー順（リップ→アイシャドウ→チーク→ベース→カラコン）。

```js
export const PRODUCTS = [

  // ── リップ ──────────────────────────────────────────

  {
    // 1. リリミュウ センシュアルフィックスティント
    category: 'lip',
    localImage: 'lip_ririmew_sensual.jpg',
    colors: [
      { id: 'c01', name: 'カーディナルローズ', hex: '#C4607A' },
      { id: 'c02', name: 'クラシカルプラム',   hex: '#8B4060' },
      { id: 'c03', name: 'サンゴブロッサム',   hex: '#E8826A' },
      { id: 'c04', name: 'シナモンナッツ',     hex: '#B86840' },
      { id: 'c05', name: 'カヌレブラウン',     hex: '#8B5030' },
    ],
    baseColor: '#C4607A',
    season: 'winter',
  },

  {
    // 2. ロムアンド ジューシーラスティングティント
    category: 'lip',
    localImage: 'lip_romand_juicy.jpg',
    colors: [
      { id: 'c01', name: 'フィグフィグ',       hex: '#C84050' },
      { id: 'c02', name: 'ライチコーラル',     hex: '#E87060' },
      { id: 'c03', name: 'ポメロスキン',       hex: '#E8906A' },
      { id: 'c04', name: 'ピーチミー',         hex: '#E8A080' },
      { id: 'c05', name: 'アップルブラウン',   hex: '#A06040' },
    ],
    baseColor: '#C84050',
    season: 'spring',
  },

  {
    // 3. YSL ラブシャイン キャンディ グロウ バーム
    category: 'lip',
    localImage: 'lip_ysl_loveshyne.jpg',
    colors: [
      { id: 'c01', name: 'ヌード',             hex: '#D4906A' },
      { id: 'c02', name: 'ベアピンク',         hex: '#E8A090' },
      { id: 'c03', name: 'ローズ',             hex: '#D4708A' },
      { id: 'c04', name: 'コーラル',           hex: '#E87860' },
      { id: 'c05', name: 'レッド',             hex: '#C04050' },
    ],
    baseColor: '#D4708A',
    season: 'summer',
  },

  {
    // 4. カイリジュメイ フラワーリップ ピンクゴールド
    category: 'lip',
    localImage: 'lip_kaijumei_flower.jpg',
    colors: [
      { id: 'c01', name: 'ピンクゴールド',     hex: '#E890A0' },
      { id: 'c02', name: 'ローズ',             hex: '#D06080' },
      { id: 'c03', name: 'ヌードピンク',       hex: '#E8B0A0' },
    ],
    baseColor: '#E890A0',
    season: 'spring',
  },

  {
    // 5. カイリジュメイ 色が変わるリップ
    category: 'lip',
    localImage: 'lip_kaijumei_change.jpg',
    colors: [
      { id: 'c01', name: 'クリア→ピンク',     hex: '#E8A0B0' },
      { id: 'c02', name: 'クリア→レッド',     hex: '#D06070' },
      { id: 'c03', name: 'クリア→コーラル',   hex: '#E88070' },
    ],
    baseColor: '#E8A0B0',
    season: 'spring',
  },

  // ── アイシャドウ ─────────────────────────────────────

  {
    // 6. トムフォード アイカラークォード
    category: 'eyeshadow',
    localImage: 'eye_tomford_quad.jpg',
    colors: [
      { id: 'c01', name: 'ゴールデンミンク',   hex: '#C4956A' },
      { id: 'c02', name: 'ローズゴールド',     hex: '#C48070' },
      { id: 'c03', name: 'スモーキーブラウン', hex: '#7A5040' },
      { id: 'c04', name: 'ディープブラウン',   hex: '#4A2820' },
      { id: 'c05', name: 'シャンパン',         hex: '#E8D4A8' },
    ],
    baseColor: '#C4956A',
    season: 'autumn',
  },

  {
    // 7. CLIO プロアイパレット エアー
    category: 'eyeshadow',
    localImage: 'eye_clio_pro.jpg',
    colors: [
      { id: 'c01', name: 'ベージュ',           hex: '#D4B090' },
      { id: 'c02', name: 'テラコッタ',         hex: '#C07050' },
      { id: 'c03', name: 'バーント',           hex: '#8B4830' },
      { id: 'c04', name: 'チョコブラウン',     hex: '#5A3020' },
      { id: 'c05', name: 'ローズブラウン',     hex: '#C08070' },
    ],
    baseColor: '#D4B090',
    season: 'autumn',
  },

  {
    // 8. リリミュウ インザミラーアイパレット
    category: 'eyeshadow',
    localImage: 'eye_ririmew_mirror.jpg',
    colors: [
      { id: 'c01', name: 'スノーピンク',       hex: '#F0D0D0' },
      { id: 'c02', name: 'コーラルピンク',     hex: '#E8A090' },
      { id: 'c03', name: 'モーブ',             hex: '#C090A0' },
      { id: 'c04', name: 'バーガンディ',       hex: '#904060' },
      { id: 'c05', name: 'ミルクブラウン',     hex: '#C0A080' },
    ],
    baseColor: '#F0D0D0',
    season: 'summer',
  },

  {
    // 9. NOR. エアフィットクリームアイシャドウ
    category: 'eyeshadow',
    localImage: 'eye_nor_airfit.jpg',
    colors: [
      { id: 'c01', name: 'ミルクベージュ',     hex: '#E8D4B8' },
      { id: 'c02', name: 'ピーチコーラル',     hex: '#E8A888' },
      { id: 'c03', name: 'モーブローズ',       hex: '#C89098' },
      { id: 'c04', name: 'テラブラウン',       hex: '#A86848' },
      { id: 'c05', name: 'グレーブラウン',     hex: '#888078' },
    ],
    baseColor: '#E8D4B8',
    season: 'spring',
  },

  {
    // 10. YSL クチュールミニクラッチ
    category: 'eyeshadow',
    localImage: 'eye_ysl_couture.jpg',
    colors: [
      { id: 'c01', name: 'ヌードベージュ',     hex: '#D4B898' },
      { id: 'c02', name: 'タフィーブラウン',   hex: '#A07858' },
      { id: 'c03', name: 'スモーキーグレー',   hex: '#888888' },
      { id: 'c04', name: 'ディープカーキ',     hex: '#606848' },
      { id: 'c05', name: 'ブラック',           hex: '#282828' },
    ],
    baseColor: '#D4B898',
    season: 'winter',
  },

  // ── チーク ──────────────────────────────────────────

  {
    // 11. MAC グロープレイ クッショニーブラッシュ
    category: 'cheek',
    localImage: 'cheek_mac_glowplay.jpg',
    colors: [
      { id: 'c01', name: 'ラブジョイ',         hex: '#F0A888' },
      { id: 'c02', name: 'ファントム',         hex: '#E88878' },
      { id: 'c03', name: 'ブリーズ',           hex: '#E090A0' },
      { id: 'c04', name: 'スリル',             hex: '#E8A0B0' },
    ],
    baseColor: '#F0A888',
    season: 'spring',
  },

  {
    // 12. dasique ブレンディングムードチーク
    category: 'cheek',
    localImage: 'cheek_dasique_blending.jpg',
    colors: [
      { id: 'c01', name: 'ローズベージュ',     hex: '#D4907A' },
      { id: 'c02', name: 'コーラルピーチ',     hex: '#E8A080' },
      { id: 'c03', name: 'モーブピンク',       hex: '#C888A0' },
      { id: 'c04', name: 'テラコッタ',         hex: '#C07858' },
    ],
    baseColor: '#D4907A',
    season: 'autumn',
  },

  {
    // 13. ディアエー フラッフィーブラッシュ
    category: 'cheek',
    localImage: 'cheek_dearea_fluffy.jpg',
    colors: [
      { id: 'c01', name: 'スウィートピーチ',   hex: '#F0B090' },
      { id: 'c02', name: 'ベリーピンク',       hex: '#E090A8' },
      { id: 'c03', name: 'コーラルレッド',     hex: '#E07868' },
    ],
    baseColor: '#F0B090',
    season: 'spring',
  },

  {
    // 14. MAC エクストラディメンション ブラッシュ
    category: 'cheek',
    localImage: 'cheek_mac_extradimension.jpg',
    colors: [
      { id: 'c01', name: 'サンラッシュ',       hex: '#E8B888' },
      { id: 'c02', name: 'ダブルグレーズ',     hex: '#D09888' },
      { id: 'c03', name: 'ピーチツイスト',     hex: '#F0A878' },
      { id: 'c04', name: 'オーシャンローズ',   hex: '#C88898' },
    ],
    baseColor: '#E8B888',
    season: 'autumn',
  },

  {
    // 15. ペリペラ ピュアブラッシュド サンシャインチーク
    category: 'cheek',
    localImage: 'cheek_peripera_sunshine.jpg',
    colors: [
      { id: 'c01', name: 'ピーチサンシャイン', hex: '#F0B080' },
      { id: 'c02', name: 'ローズサンシャイン', hex: '#E898A8' },
      { id: 'c03', name: 'コーラルサンシャイン', hex: '#E88870' },
    ],
    baseColor: '#F0B080',
    season: 'spring',
  },

  // ── ベース ──────────────────────────────────────────

  {
    // 16〜20. ベース商品共通（肌色トーン展開）
    category: 'base',
    localImage: 'base_restemo_bb.jpg',       // 16: レステモ
    colors: [
      { id: 'c01', name: 'ライト',           hex: '#F5E0CC' },
      { id: 'c02', name: 'ナチュラル',       hex: '#EDD0B0' },
      { id: 'c03', name: 'オークル',         hex: '#D4A880' },
      { id: 'c04', name: 'ダーク',           hex: '#B88860' },
    ],
    baseColor: '#EDD0B0',
    season: null, // ベースはPCに依存しない
  },

  // ── カラコン ─────────────────────────────────────────

  {
    // 21〜25. カラコン商品共通（レンズカラー展開）
    category: 'colorcon',
    localImage: 'colorcon_evercolor_natural.jpg', // 21: エバーカラー
    colors: [
      { id: 'c01', name: 'ブラック',         hex: '#282828' },
      { id: 'c02', name: 'ダークブラウン',   hex: '#4A2810' },
      { id: 'c03', name: 'ブラウン',         hex: '#7A4820' },
      { id: 'c04', name: 'ヘーゼル',         hex: '#8B6840' },
      { id: 'c05', name: 'グレー',           hex: '#808088' },
    ],
    baseColor: '#4A2810',
    season: null,
  },

];
```

> **注意**: ベース（16〜20）とカラコン（21〜25）は各商品で `localImage` のファイル名だけ変えること。colorsは共通で問題ない。

---

## 画像ファイル命名規則

`src/assets/products/` 以下に配置する画像のファイル名一覧:

```
lip_ririmew_sensual.jpg
lip_romand_juicy.jpg
lip_ysl_loveshyne.jpg
lip_kaijumei_flower.jpg
lip_kaijumei_change.jpg
eye_tomford_quad.jpg
eye_clio_pro.jpg
eye_ririmew_mirror.jpg
eye_nor_airfit.jpg
eye_ysl_couture.jpg
cheek_mac_glowplay.jpg
cheek_dasique_blending.jpg
cheek_dearea_fluffy.jpg
cheek_mac_extradimension.jpg
cheek_peripera_sunshine.jpg
base_restemo_bb.jpg
base_vitaminc_liquid.jpg
base_longfit_bb.jpg
base_belrich_liquid.jpg
base_belrich_trial.jpg
colorcon_evercolor_natural.jpg
colorcon_revia_1day.jpg
colorcon_seed_eyecoffre.jpg
colorcon_neosight_ring.jpg
colorcon_laviere_koda.jpg
```

画像は後からソリさんが用意して配置する。それまでは楽天URLを暫定使用。

---

## アイブロウ商品 colorsデータ（追加分）

```js
// ── アイブロウ ─────────────────────────────────────────

{
  // 1. ロムアンド ハンオールブロウカラ
  // 全12色展開。人気色: 01グレーストープ・02マイルドウッディー・03モダンベージュ
  category: 'eyebrow',
  localImage: 'eyebrow_01.jpg',
  colors: [
    { id: 'c01', name: { ja: 'グレーストープ',   ko: '그레이 스톤', en: 'Gray Taupe'    }, hex: '#7A7870' },
    { id: 'c02', name: { ja: 'マイルドウッディー', ko: '마일드 우디', en: 'Mild Woody'   }, hex: '#8A6848' },
    { id: 'c03', name: { ja: 'モダンベージュ',   ko: '모던 베이지', en: 'Modern Beige'  }, hex: '#A89070' },
    { id: 'c04', name: { ja: 'ダスキーローズ',   ko: '더스키 로즈', en: 'Dusky Rose'   }, hex: '#A07878' },
    { id: 'c05', name: { ja: 'ムーングレー',     ko: '문 그레이',  en: 'Moon Gray'     }, hex: '#909098' },
  ],
  baseColor: '#7A7870',
  season: 'summer',
},

{
  // 2. キャシードール 4Dアイブロウ（ペンシル・パウダー・マスカラ・ハイライト4in1）
  category: 'eyebrow',
  localImage: 'eyebrow_02.jpg',
  colors: [
    { id: 'c01', name: { ja: 'ナチュラルブラウン', ko: '내추럴 브라운', en: 'Natural Brown' }, hex: '#7A5030' },
    { id: 'c02', name: { ja: 'アッシュブラウン',  ko: '애쉬 브라운',  en: 'Ash Brown'    }, hex: '#6A6050' },
    { id: 'c03', name: { ja: 'ダークブラウン',    ko: '다크 브라운',  en: 'Dark Brown'   }, hex: '#4A3020' },
  ],
  baseColor: '#7A5030',
  season: 'autumn',
},

{
  // 3. アテニア アイブロウ ペンシル（繰り出し式・芯が折れにくい）
  category: 'eyebrow',
  localImage: 'eyebrow_03.jpg',
  colors: [
    { id: 'c01', name: { ja: 'ナチュラルブラウン', ko: '내추럴 브라운', en: 'Natural Brown'  }, hex: '#7A5030' },
    { id: 'c02', name: { ja: 'アッシュブラウン',  ko: '애쉬 브라운',  en: 'Ash Brown'     }, hex: '#706050' },
    { id: 'c03', name: { ja: 'ダークブラウン',    ko: '다크 브라운',  en: 'Dark Brown'    }, hex: '#4A3020' },
    { id: 'c04', name: { ja: 'グレーブラウン',    ko: '그레이 브라운', en: 'Gray Brown'   }, hex: '#706870' },
  ],
  baseColor: '#7A5030',
  season: 'autumn',
},

{
  // 4. ニューアイブロウスタンプ（スタンプ式・簡単眉）
  // スタンプ式のため色展開は限定的
  category: 'eyebrow',
  localImage: 'eyebrow_04.jpg',
  colors: [
    { id: 'c01', name: { ja: 'ナチュラルブラウン', ko: '내추럴 브라운', en: 'Natural Brown' }, hex: '#8A6848' },
    { id: 'c02', name: { ja: 'ダークブラウン',    ko: '다크 브라운',  en: 'Dark Brown'   }, hex: '#4A3020' },
    { id: 'c03', name: { ja: 'グレー',           ko: '그레이',       en: 'Gray'          }, hex: '#808088' },
  ],
  baseColor: '#8A6848',
  season: null,
},

{
  // 5. メイベリン ファッションブロウ パウダーインペンシル
  category: 'eyebrow',
  localImage: 'eyebrow_05.jpg',
  colors: [
    { id: 'c01', name: { ja: 'ナチュラルブラウン', ko: '내추럴 브라운', en: 'Natural Brown'  }, hex: '#8A6040' },
    { id: 'c02', name: { ja: 'アッシュブラウン',  ko: '애쉬 브라운',  en: 'Ash Brown'     }, hex: '#706858' },
    { id: 'c03', name: { ja: 'ダークブラウン',    ko: '다크 브라운',  en: 'Dark Brown'    }, hex: '#4A3020' },
    { id: 'c04', name: { ja: 'ブラック',          ko: '블랙',         en: 'Black'         }, hex: '#282828' },
  ],
  baseColor: '#8A6040',
  season: null,
},
```

### 画像ファイル命名規則（アイブロウ追加分）

```
src/assets/products/
  eyebrow_01.jpg  ← ロムアンド ハンオールブロウカラ
  eyebrow_02.jpg  ← キャシードール 4Dアイブロウ
  eyebrow_03.jpg  ← アテニア アイブロウ ペンシル
  eyebrow_04.jpg  ← ニューアイブロウスタンプ
  eyebrow_05.jpg  ← メイベリン ファッションブロウ
```
