# CHANGELOG

## 2026-04-06 — fix: PC環境でカメラ映像が顔を映さない問題

- ArTryOnScreen / SkincareARScreen の `objectFit: 'cover'` → `'contain'` に変更
- PCウェブカメラ（横長）を縦長ビューポートで `cover` すると顔がクロップされる問題を修正
- スマホでは影響なし（カメラとビューポートのアスペクト比が近いため）

---

## 2026-04-06 — バグ⑦: ランドマーク左右反転修正（最重要）

### 根本原因
フロントカメラはミラー表示だが、MediaPipeのx座標をそのまま `lm.x * W` で描画していたため、全メイクオーバーレイが左右反転していた。フェイスオーバル・目・カラコン・アイシャドウの位置ズレの共通原因。

### 修正内容
- `makeupRenderer.js` 先頭にミラー反転ヘルパー `lmX(lm, w) = (1 - lm.x) * w` を定義
- 全描画関数を一括修正: `drawLip`, `drawEyeshadow`, `drawCheek`, `drawFoundation`, `drawBrow`, `drawConcealer`, `drawContactLens`, `drawGlasses`, `drawEarrings`
- ヘルパー関数 `traceIndices`, `buildOrderedPoints` も同様に修正
- `MakeupCanvas.jsx` の `drawMeshOverlay`（テッセレーション + 輪郭ライン）も修正
- バグ①②⑥（カラコン位置ズレ、ファンデはみ出し、アイシャドウズレ）はこの修正で同時に改善される見込み

### 変更ファイル
- `src/rendering/makeupRenderer.js` — 全描画関数のx座標を `(1 - lm.x) * W` に統一
- `src/components/MakeupCanvas.jsx` — メッシュ描画のx座標を反転

---

## 2026-04-06 — STEP 4: UI/UX改善（Be Makeup+競合調査ベース）

仕様書: `docs/STEP4_SPEC.md`

### 全画面化
- **ArTryOnScreen**: `position: fixed; inset: 0` で100vw x 100vh全画面化。全UIをカメラ映像上にオーバーレイ（ルック名ラベル、Meshトグル、戻るボタン、キラリ吹き出し、カテゴリパネル）
- **SkincareARScreen**: 同様に全画面化。スライダー・キラリ・FAQ・CTAをグラデーションオーバーレイで配置。肌スコアバッジを「肌スコア XX」にラベル付き表示

### 操作性改善
- **タップ即反映**: カラーチップタップ = AR即反映（「試す」ボタン廃止済み）
- **長押しビフォーアフター**: カメラ映像エリアをpointerDown → ARオフ（素顔表示）、pointerUp → ARオン
- **ボタン設計統一**: 全ボタンに `whiteSpace: nowrap` 適用、Primary/Secondary/Tertiaryの優先度明確化

### 新機能
- **カラコンAR**: `drawContactLens()` — 瞳中心ランドマーク #468/#473 に虹彩オーバーレイ（multiply + overlay）。15色パレット（ブラウン/グレー/ブルー/グリーン/パープル 各3色）
- **まつげタブ**: 「近日公開」バッジ付きでカテゴリに表示（WebGL移行後に実装予定）
- **useCart hook**: メイク + スキンケア統合カート。同一partIdは1商品のみ（差し替え）。ADD/REMOVE/REPLACE/TOGGLE/CLEARアクション
- **CartSummaryBar**: カート固定バー。メイク/スキンケア点数ラベル + 合計金額 + 「まとめて購入」ボタン
- **キラリARガイドセリフ**: 7種追加（初回オープン、長押し、カート追加、カラー変更、カテゴリ切替、カスタマイズ、チェックアウト）

### CTA修正
- **SkincareRoutineView**: 「商品をまとめて見る」→「商品を購入する」に修正。購入 = Primaryボタン（グラデーション）、結果を見る = Secondary（アウトライン）に優先度整理

### インフラ
- `viewport-fit=cover` を index.html に追加（safe-area-inset-* サポート）
- i18n: JA/EN/KO 全言語に新キー追加

### 変更ファイル
- `src/components/ArTryOnScreen.jsx` — 全面書き換え（全画面化 + カラコン + 長押し）
- `src/components/SkincareARScreen.jsx` — 全面書き換え（全画面化）
- `src/components/MakeupCanvas.jsx` — contactLensItem prop追加
- `src/components/SkincareRoutineView.jsx` — CTA優先度修正
- `src/components/CartSummaryBar.jsx` — 新規作成
- `src/rendering/makeupRenderer.js` — drawContactLens() 追加
- `src/data/accessories.js` — CONTACT_LENS_ITEMS 追加
- `src/hooks/useCart.js` — 新規作成
- `src/hooks/useKirari.js` — AR_GUIDE_KEYS 追加
- `src/i18n/ja.js`, `en.js`, `ko.js` — 新キー追加
- `index.html` — viewport-fit=cover

---

## 2026-04-05 — エンゲージメント基盤 + SkincareARフィルター強化

- 行動ログ基盤 (`src/utils/logger.js`)
- キラリセリフのパーソナライズ化（優先順位ベース自動選出）
- 毎回表示（10回に1回→毎回）+ セリフ重複回避
- SkincareARScreen フィルター強化（デモ用強調値・hue-rotate追加）

## 2026-04-04 — PurchaseModal + MUSINSA送客

- PurchaseModal チェックボックス選択式
- MUSINSA送客URL生成

## 2026-04-03 — STEP 3: SuggestScreen/ArTryOn再設計 + SkincareAR

- SuggestScreen ヒーローカード + Base/Color 2タブエクスプローラー
- ArTryOnScreen Base+Color 2レイヤー同時描画
- MirrorScreenV3 分析後2択ボタン
- SkincareARScreen 新設
- CoordinateOverlay（TPOセレクター）
