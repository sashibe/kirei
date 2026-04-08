# KIREI 残修正仕様書（4件）

> Claude Code はこのファイル1本を読んで実装する。
> `docs/FIX_SPEC_2.md` に配置してpushすること。

---

## 実装済み確認（対応不要）

- ResultScreen: PC見出し・メイク未実行時CTA・スキンケアCTA「もう一度見る」✅
- ArTryOnScreen: カテゴリタブ labelKey i18n ✅
- SkincareRoutineView: 肌スコア表示・商品effect表示・WhyTwoWeeksSection ✅

---

## 未実装 4件

---

## 1. SuggestScreen.jsx — エクスプローラーボタンをピルボタン化

### 変更箇所

「他のルックも見る」ボタンのスタイルを変更する。

```jsx
// 変更前
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

// 変更後
<div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
  <button
    onClick={() => setExplorerOpen(v => !v)}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: explorerOpen ? '#f3e8ff' : '#faf5ff',
      border: '1px solid #e9d5ff',
      borderRadius: 20, padding: '7px 18px',
      fontSize: 12, fontWeight: 600,
      color: '#a855f7', cursor: 'pointer',
    }}
  >
    {explorerOpen ? '▲' : '▼'} {t('suggest.see_other_looks')}
  </button>
</div>
```

---

## 2. ResultScreen.jsx — シェアボタン実装

### 変更箇所

キャプチャ写真右下のシェアボタンに `onClick` を追加する。

```jsx
// 変更前（onClick なし）
<button style={{ ... }}>
  {'📸'} {t('result.share') || 'シェアする'}
</button>

// 変更後
<button
  onClick={async () => {
    try {
      const blob = await fetch(capturedImage).then(r => r.blob());
      if (navigator.share) {
        // モバイル: ネイティブシェートシート
        const file = new File([blob], 'kirei-look.jpg', { type: 'image/jpeg' });
        await navigator.share({
          title: 'KIREI - Today\'s Look',
          text: `${displayLookName} ✨ #KIREI`,
          files: navigator.canShare?.({ files: [file] }) ? [file] : undefined,
        });
      } else {
        // PC: クリップボードにコピー
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/jpeg': blob })
        ]);
        alert(t('result.share_copied'));
      }
    } catch {
      // キャンセルまたは非対応は無視
    }
  }}
  style={{ ... }}
>
  {'📸'} {t('result.share') || 'シェアする'}
</button>
```

### i18n 追加

```js
// ja.js
'result.share_copied': '画像をクリップボードにコピーしました！',

// en.js
'result.share_copied': 'Image copied to clipboard!',

// ko.js
'result.share_copied': '이미지를 클립보드에 복사했습니다!',
```

---

## 3. ResultScreen.jsx — KIREI SELECT 購入モーダル

### state 追加

```js
const [showPurchaseModal, setShowPurchaseModal] = useState(false);
```

### 購入ボタン追加

合計金額表示（`result.total`）の直後に追加する。

```jsx
{products.length > 0 && (
  <button
    onClick={() => setShowPurchaseModal(true)}
    style={{
      width: '100%', padding: 13, marginTop: 8,
      background: 'linear-gradient(135deg, #a855f7, #ec4899)',
      border: 'none', borderRadius: 14,
      fontSize: 13, fontWeight: 700, color: '#fff',
      cursor: 'pointer',
      boxShadow: '0 4px 16px rgba(168,85,247,0.25)',
    }}
  >
    🛒 {t('result.purchase_btn')}
  </button>
)}
```

### PurchaseModal コンポーネント（ResultScreen.jsx 末尾に追加）

```jsx
function PurchaseModal({ products, onClose, t }) {
  const total = products.reduce((s, p) => s + p.price, 0);
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-end',
    }}>
      <div style={{
        width: '100%', maxWidth: 400, margin: '0 auto',
        background: '#fff', borderRadius: '24px 24px 0 0',
        padding: '20px 16px 32px',
        maxHeight: '80vh', overflowY: 'auto',
      }}>
        {/* ヘッダー */}
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#334155' }}>
            KIREI SELECT
          </h2>
          <button onClick={onClose} style={{
            background: '#f1f5f9', border: 'none', borderRadius: 10,
            width: 32, height: 32, fontSize: 16, cursor: 'pointer', color: '#64748b',
          }}>✕</button>
        </div>

        {/* 商品リスト */}
        {products.map((p, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 0',
            borderBottom: i < products.length - 1 ? '1px solid #f1f5f9' : 'none',
          }}>
            <span style={{ fontSize: 22, width: 32, textAlign: 'center' }}>{p.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#334155', margin: 0 }}>
                {typeof p.name === 'object' ? t(p.name) : p.name}
              </p>
              <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>
                {typeof p.shade === 'object' ? t(p.shade) : p.shade}
              </p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#a855f7', margin: '0 0 2px' }}>
                ¥{p.price.toLocaleString()}
              </p>
              <a
                href={`https://www.amazon.co.jp/s?k=${encodeURIComponent(typeof p.name === 'object' ? p.name.ja : p.name)}`}
                target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 9, color: '#a855f7', textDecoration: 'none' }}
              >
                {t('result.check_item')} →
              </a>
            </div>
          </div>
        ))}

        {/* 合計 + CTA */}
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>{t('result.total')}</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#a855f7' }}>
              ¥{total.toLocaleString()}
            </span>
          </div>
          <a
            href="https://www.amazon.co.jp/s?k=スキンケア+コスメ"
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'block', width: '100%', padding: 14, boxSizing: 'border-box',
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              borderRadius: 14, textAlign: 'center',
              fontSize: 14, fontWeight: 700, color: '#fff', textDecoration: 'none',
            }}
          >
            🛒 {t('result.purchase_all')}
          </a>
          <p style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center', margin: '8px 0 0' }}>
            {t('result.purchase_note')}
          </p>
        </div>
      </div>
    </div>
  );
}
```

### モーダルのレンダリング（return 内の末尾に追加）

```jsx
{showPurchaseModal && (
  <PurchaseModal
    products={products}
    onClose={() => setShowPurchaseModal(false)}
    t={t}
  />
)}
```

### i18n 追加

```js
// ja.js
'result.purchase_btn':  'まとめて購入する',
'result.check_item':    '商品を見る',
'result.purchase_all':  'まとめてチェックする',
'result.purchase_note': '※外部サイト（Amazon）に移動します',

// en.js
'result.purchase_btn':  'Buy all items',
'result.check_item':    'View item',
'result.purchase_all':  'Check all items',
'result.purchase_note': '* Opens external site (Amazon)',

// ko.js
'result.purchase_btn':  '모아서 구매하기',
'result.check_item':    '상품 보기',
'result.purchase_all':  '모아서 확인하기',
'result.purchase_note': '※ 외부 사이트(Amazon)로 이동합니다',
```

---

## 4. ResultScreen.jsx — 天気データをリアルタイム化

### import 追加

```js
// 追加
import useWeather from '../hooks/useWeather.js';
```

### WEATHER の定義を差し替え

```js
// 変更前（ハードコード・削除）
const WEATHER = { icon: '\u2600\uFE0F', temp: 22, label: '晴れ' };

// 変更後（コンポーネント内の先頭に追加）
const weatherData = useWeather();
const WEATHER = weatherData
  ? {
      icon:  weatherData.rainProb >= 70 ? '🌧️'
           : weatherData.rainProb >= 40 ? '🌥️'
           : weatherData.temp >= 30     ? '🌞'
           : '☀️',
      temp:  weatherData.temp,
      label: weatherData.rainProb >= 70 ? '雨'
           : weatherData.rainProb >= 40 ? '曇り'
           : weatherData.temp >= 30     ? '猛暑'
           : weatherData.temp >= 25     ? '晴れ・暑め'
           : weatherData.temp >= 15     ? '晴れ'
           : '晴れ・寒め',
    }
  : { icon: '☀️', temp: 22, label: '晴れ' }; // フォールバック
```

---

## コミットメッセージ

```
fix: SuggestScreen — エクスプローラーボタンをピルボタン化
feat: ResultScreen — シェアボタン実装（Web Share API + クリップボードfallback）
feat: ResultScreen — KIREI SELECT 購入モーダル追加
feat: ResultScreen — 天気データをuseWeather()でリアルタイム化
feat: i18n — share/purchase関連キー追加（JA/EN/KO）
```
