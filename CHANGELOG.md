# CHANGELOG

## 2026-04-09 — fix: PCカードプレースホルダー追加

### MirrorScreenV3
- パーソナルカラー未判定時に「🎨 パーソナルカラー判定中…」プレースホルダーを常時表示（判定成功時に実結果へ切替）

### i18n
- `pc.analyzing` キー追加（ja/en/ko）

---

## 2026-04-09 — feat: 肌診断結果カード統合 + バグ修正

### MirrorScreenV3
- **肌診断結果カードの統合**: PC badge（左上）と3つのScoreBadge（右上）を1枚のガラスモーフィズムカードに統合
  - ヘッダー: 🪞「あなたの肌診断結果」（i18n対応）
  - パーソナルカラー行: 絵文字 + メインタイプ + サブタイプ + 信頼度ドット
  - スコア行: 3項目を横並びで表示、60点以上=緑、未満=アンバー、「スコア/100」形式
- ScoreBadgeインポート削除（カード内に統合）

### MakeupCanvas
- **顔未検出時のAR描画バグ修正**: `result.landmarks` が空配列`[]`（truthy）の場合にキャッシュをクリアしないバグを修正。`length > 0` チェックに変更し、顔が消えた瞬間にAR描画も即時クリアされるように

### i18n
- `mirror.result_title` キー追加（ja/en/ko）

---

## 2026-04-09 — fix: UI/UXレビュー11項目改善

### ArTryOnScreen
- **peekアニメーション**: 画面マウント後0.5秒で下部カテゴリパネルが40px浮き上がり1秒表示（初回のみ、sessionStorage管理）
- **購買促進ポップアップ 60秒ルール**: 商品選択後60秒未満でカテゴリ移動した場合はポップアップを出さず、カテゴリタブにピンクドットバッジを表示。60秒以上経過後のみポップアップ
- **カテゴリタブスクロールインジケーター**: 右端に到達するまで白フェードグラデーションを表示

### PurchaseModal
- **朝夜セクションヘッダー**: 「☀️ 朝のルーティン」「🌙 夜のルーティン」の区切り行を追加
- **兼用商品の統合表示**: 朝・夜で同一商品（name.ja 一致）は1行に統合し「（朝・夜兼用）」ラベルを付与。価格は1個分のみカウント

### ResultScreen
- **キャプチャ画像を3:4縦長クロップ**: `aspect-ratio: 3/4` + `object-fit: cover` でCSSのみ対応
- **商品名を2行表示**: `whiteSpace: nowrap` を廃止し `-webkit-line-clamp: 2` に変更
- **外部遷移注記追加**: 「商品を購入する」ボタン下に「※外部サイト（MUSINSA）に移動します」

### LanguageSwitcher
- **タップ領域拡大**: padding拡大 + `minWidth: 36px` / `minHeight: 32px` / font 11px以上

### App.jsx
- **?demo=true でPROTOTYPEバッジ非表示**: URLパラメータでピッチデモ時にバッジを隠せる

### ResultScreen / SkincareARScreen
- **シェアボタンのテキストラベル化**: 📤アイコンのみ → 「📤 シェア」付きピル型ボタンに変更

---

## 2026-04-07 — feat: 3層商品UI + 実商品データ

### 3層UI（ArTryOnScreen）
- Layer 1: カテゴリータブ（既存）
- Layer 2: 商品カード横スクロール（ProductLayer）— 商品画像/カラーチップサムネ/名前/価格
- Layer 3: カラーパレット + 濃さスライダー — 商品選択後に展開、タップ即AR反映
- lip/eyeshadow/cheek/contacts の4カテゴリに適用（glasses/earringは既存UIを維持）

### 実商品データ（products.js）
- 13商品: リップ3、アイシャドウ4（PC別）、チーク2、ベース2、カラコン2
- 各商品にcolors配列（カラー展開）を定義
- 楽天API連携は後日（Access Keyの認証方式要確認）

### scripts/fetchRakutenProducts.mjs
- 楽天API取得スクリプト作成（API認証解決後に使用）

---

## 2026-04-07 — feat: Supabaseスコア履歴機能

### 新規ファイル
- `src/lib/supabase.js` — Supabaseクライアント初期化
- `src/lib/scoreHistory.js` — saveScore / fetchScoreHistory
- `src/hooks/useGuestId.js` — 匿名ゲストID（localStorageにUUID保存）
- `src/components/ScoreHistory.jsx` — 履歴表示UI（トレンドチャート + 差分表示）

### 変更
- MirrorScreenV3: スキャン完了時にsaveScore呼び出し（サイレント失敗）
- ResultScreen: ScoreHistoryコンポーネントを追加

### 設計
- ログイン不要（ゲストID方式）
- 保存失敗してもアプリは止めない
- 個人を特定できる情報は一切保存しない

---

## 2026-04-07 — feat: パーソナルカラー16タイプ対応 + バッジ表示更新

### personalColor.js
- 12サブタイプ → 16タイプに拡張（仕様書準拠）
- `SEASON_DISPLAY`: 16タイプの表記（main/sub/desc/color/emoji）
- `SEASON_LOOK_MAP`: シーズン別推薦ルック・カラー対応表
- `SEASON_KIRARI`: シーズン別キラリセリフ
- `savePersonalColor`/`loadPersonalColor`/`clearPersonalColor`: localStorageキャッシュ
- `detectSubtype()`: season + avgL/avgC から16タイプIDを判定

### MirrorScreenV3 バッジ表示
- 16タイプ表記対応（main: 「イエベ春」、sub: 「ライトスプリング」）
- バッジサイズ拡大（emoji 16px、main 13px太字、sub 9px）
- 色はSEASON_DISPLAYのcolorフィールドを使用

---

## 2026-04-07 — fix: バグ⑧カラーパレット横スクロール化 + バグ⑨アイシャドウカテゴリ追加

### バグ⑧ カラーパレット横スクロール化
- リップ・チーク・カラコンのカラーチップを `flexWrap:wrap` → `flexWrap:nowrap; overflowX:auto` に変更
- パネル高さが1行分に安定し、カメラ領域が広がる
- `SCROLL_ROW` 共通スタイルで全カテゴリ統一

### バグ⑨ アイシャドウカテゴリ追加
- CATEGORIESに `eyeshadow` タブ追加（リップとチークの間）
- EYESHADOW_COLORS: 8色パレット（コーラルブラウン/モーブ/テラコッタ/ネイビー等）
- `eyeshadowColor` stateで即反映、濃さスライダー対応
- i18n: JA「アイシャドウ」/ EN「Eye」/ KO「아이섀도우」

---

## 2026-04-07 — feat: AR全画面化 + レターボックス解消 + バグ修正

### AR全画面化（MirrorScreen方式）
- App.jsxの`showScrollable`からar/skincare-arを除外 → `height:"100%"` + `overflow:"hidden"`
- MirrorScreenV3と同じ方式: ルート `position:relative; width/height:100%`
- カテゴリパネルを `position:absolute; bottom:0` のオーバーレイで配置
- PCデバイスフレーム（390x844px）内でもスマホフルスクリーンでも正しく動作

### レターボックス解消
- video `objectFit: cover` で全画面を隙間なく埋める
- MakeupCanvasに `coverFit` prop追加: canvasのCSS width/height/left/topを毎フレーム動的に計算し、videoのcover表示と位置・サイズを一致させる

### PC環境対応の試行錯誤と解決
- position:fixed → PCデバイスフレーム外にはみ出す ✗
- position:absolute → overflow:autoコンテナ内で非表示 ✗
- position:relative + height:100% → MirrorScreenと同方式で解決 ✅
- objectFit:contain → レターボックス発生 → cover + coverFit計算で解決 ✅

### 後回しにした項目
- ファンデーション目くり抜き: coverFit座標系との整合が必要。clip('evenodd')で目が黒塗りになる問題が未解決
- おでこ輪郭拡張: expandForehead()がオーバルを過度に伸長。座標系整理後に再実装

### 変更ファイル
- `src/App.jsx` — showScrollableからar/skincare-arを除外
- `src/components/ArTryOnScreen.jsx` — 全画面レイアウト + 下部オーバーレイパネル
- `src/components/SkincareARScreen.jsx` — 全画面レイアウト + スライダーオーバーレイ
- `src/rendering/makeupRenderer.js` — expandForehead()追加

---

## 2026-04-07 — fix: AR画面レイアウトを動作版ベースに復元

- 全画面化（position:fixed/absolute）を撤回し、動作していたスクロールレイアウトに復元
- ArTryOnScreen: `padding: '12px 0'` + `aspectRatio` + `maxHeight: '55vh'` の元構造を維持
- SkincareARScreen: 完全にSTEP4前の動作版に復元
- 新機能（カラコン、長押しビフォーアフター、7カテゴリタブ）は元レイアウト内に追加

---

## 2026-04-07 — fix: AR画面 position:relative + height:100% 方式に変更

- `position: absolute` だと `.kirei-app-container` の `overflow-y:auto` と相性が悪く真っ白になる問題を修正
- `position: relative; width:100%; height:100%; overflow:hidden` でブロック要素として親を100%埋める方式に変更
- video/canvas は内部で `position: absolute; inset:0` により相対配置
- PC（デバイスフレーム）でもスマホ（フルスクリーン）でも正常に表示

---

## 2026-04-07 — fix: AR全画面の position:fixed → absolute 修正

- PC表示ではiPhoneモックアップ（390x844px）内にレンダリングされるが、`position:fixed` + `100vw/100vh` はビューポート全体を基準にするためモック外にはみ出していた
- `position: absolute` + `width/height: 100%` に変更し、親コンテナ基準で描画
- ArTryOnScreen / SkincareARScreen 両方を修正
- video `objectFit: cover` で親コンテナを隙間なく埋める

---

## 2026-04-06 — fix: PC環境でARカメラとCanvasの位置ずれ修正（v2）

- CSS min()/vw/vh計算がデバイスフレーム内で機能しない問題を修正
- ResizeObserver + JS で wrapper の clientWidth/clientHeight を計測し、ビデオアスペクト比に合わせてpx指定する方式に変更
- video と canvas が同一サイズの inner div に収まるため、objectFit 不要

---

## 2026-04-06 — fix: ランドマーク二重反転を修正

- Canvas要素にCSS `scaleX(-1)` が既に適用されていたため、JS側で `(1-lm.x)*W` とすると二重反転になっていた
- `lmX(lm, w) = lm.x * w` に戻し、CSS側のみでミラー処理する方式に統一
- makeupRenderer.js + MakeupCanvas.jsx のメッシュ描画を修正

---

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
