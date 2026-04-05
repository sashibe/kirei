# KIREI - AI ビューティーミラーアプリ

> **⚠️ 同期ルール（最重要）**
> このファイルは **GitHub が唯一の正（Single Source of Truth）**。
> web Claude（claude.ai）はセッション冒頭に必ず以下URLからfetchすること:
> `https://raw.githubusercontent.com/sashibe/kirei/main/CLAUDE.md`
> プロジェクトファイルのCLAUDE.mdは古い可能性があるため読まない。
> web Claudeが仕様変更した場合は差分をClaude Codeに渡し、Claude Codeが更新→即pushする。

---

## プロジェクト概要

**KIREI**は、スマホのカメラを鏡に見立てて**肌分析**と**メイクアップ指南**を行うAIビューティーミラーアプリ。

### ピボット履歴
- **v0**: SmileCheck（口腔チェック専用）
- **v1**: KIREI（肌＋口腔チェック統合ミラー）
- **v2（現在）**: KIREI（肌分析＋メイクAR）— デンタルチェック廃止、肌＋メイクに集中
- **v3（構想）**: 肌＋メイク＋ファッション統合ビューティーミラー

### コアフロー（v2）
```
鏡を開く → 肌分析 → メイク提案 → ARトライオン → 結果・購入導線
```

### ポジショニング
- **「毎朝の鏡」を置き換えるアプリ**。単発チェックツールではなく、日常動作への埋め込みでリテンションを構造的に解決する
- 真の競合は**シンプルミラーアプリ**（ナチュラルミラー等）。YouCamやSkanとは起動シーンが異なる
- 肌分析は「気づき」のツール。体重計が医療機器でないのと同じ位置づけ
- 薬機法：「セルフチェック」「ケアのヒント」の表現に留める。「診断」「治療」禁止
- 結果画面には必ず `※本アプリは医療診断を行うものではありません` を表示

---

## リポジトリ情報

- **ローカルパス**: `C:\dev\kirei`
- **GitHub**: https://github.com/sashibe/kirei.git
- **ホスティング**: GitHub Pages（`sashibe.github.io/kirei/`）
- **デプロイ**: GitHub Actions（`git push origin main` → 自動ビルド → dist/）

---

## 開発スタイル

### web Claude（企画・設計）→ Claude Code（実装）の分業体制

- **企画・仕様決定**: web Claude（claude.ai プロジェクト）で行う。仕様書は `/docs/` に出力
- **実装**: Claude Code（CLI）が担当。CLAUDE.mdを読んで方針を理解してからコードを書く
- **QA**: Claude in Chrome でデプロイURLを訪問して動作確認
- **ソースレビュー**: `https://raw.githubusercontent.com/sashibe/kirei/main/{filepath}` で確認

### 仕様書の管理ルール
```
docs/
  MIRROR_UX_SPEC.md     ← ミラーUX刷新仕様（実装完了）
  STEP2_SPEC.md         ← ステップ2仕様（実装完了）
  STEP3_SPEC.md         ← ステップ3仕様（実装完了）
```
- 仕様書は実装指示書。完了後はCLAUDE.mdに要約を反映してアーカイブ
- CLAUDE.mdには**実装済みの事実**のみ記録する

### コミットメッセージ規約
```
feat: ARリップオーバーレイ実装
fix: Face Meshランドマーク座標のY軸反転修正
refactor: 肌分析ロジックをhookに分離
docs: CLAUDE.md更新
```

---

## ビジネスコンテキスト

### 収益モデル（三層構造）
1. **表面レイヤー**: 無料の肌チェック＋メイク提案 → ユーザー獲得
2. **送客レイヤー**: ARトライオンからコスメ商品ページへのアフィリエイト/EC（KIREI SELECT）
3. **データレイヤー**: 匿名化された肌コンディション＋メイク選好データの分析・提供（将来）

### ターゲット
- **20〜30代**（日本市場）— ジェンダー不問
- 毎朝鏡を見る習慣がある層
- Z世代男性も対象（スキンケア関心層、ベースメイク入門層）

### KIREI SELECT（EC部門）
- 肌スコア・パーソナルカラーに基づくキュレーション商品群
- Phase 1〜3: コスメ（ファンデ・リップ・アイシャドウ・チーク・スキンケア）
- Phase 4〜: ファッション（構想段階）

### 歯腸ドクターズ・山田兄弟歯科との関係
- v2でデンタル機能廃止により直接連携は解消
- 間接連携は可能（「美容×健康」切り口コンテンツ等）
- 将来デンタル機能を復活させる可能性は残す

---

## 技術スタック

### 現在（v2実装済み）
- **React + Vite**（JSX）
- **WebRTC**（`getUserMedia`）リアルタイムカメラ
- **MediaPipe FaceLandmarker**（468ランドマーク、ブラウザ内推論）
- **Canvas2D**によるメイクAR描画
- **FaceLandmarkerContext**（MirrorScreen/ArTryOnScreen間で共有、二重ロード回避）

### v2 MVP 技術目標（未実装）
- **パーソナルカラー判定**: 頬・唇・瞳の色相からイエベ/ブルベ・四季タイプ推定
- **ARメイク品質向上**: WebGLシェーダーブレンド（multiply/softlight/overlay）
- **天気API連動**: Open-Meteo（無料・キー不要）でメイク提案に気象情報を反映
- **バックエンド**: スコア履歴記録（Supabase or Firebase）

### 最重要技術課題
**Face Meshランドマーク精度に依存するARメイクの自然さ** — リップ・チークの重畳が不自然だとコア体験が破綻する。

### 既知の制約（デモ版）
- 手で顔を部分的に隠してもメッシュが推定される（Hand Landmarker併用で解決可能）
- 口の開閉判定: ランドマークベース（上下唇距離/口幅 > 15%）で実装済み
- 低照度環境では検出精度が低下（HSVフォールバック + 低照度緩和条件で対応）

---

## マスコットキャラクター「キラリ」

- **モチーフ**: 鏡の妖精（ティンカーベル的）
- **デザイン**: 紫髪、星のヘアクリップ、半透明の羽、小さな手鏡の杖
- **表情パターン**: `happy` / `thinking` / `sparkle` / `wink`
- **実装**: SVGコンポーネント `<Kirari size={48} expression="happy" bounce />`
- **トーン**: フレンドリー、親しみやすい日本語（「〜だよ♪」「〜してみてね！」）
- **ジェンダーニュートラル**: 「女子力」「男らしい」等の表現禁止

### キラリのアンビエント出現システム（MirrorScreenV3で実装予定）
- 基本は非表示。以下のトリガーで右下にふわっと現れてセリフを言い、消える
- 初回起動: チュートリアル（タップ操作の周知）
- 天気連動: 湿度・UV・気温・降水確率に応じたセリフ（毎朝1回）
- 連続起動: 3日・7日・30日の節目
- ランダム: 10回に1回程度
- 詳細: `docs/MIRROR_UX_SPEC.md` 参照

---

## 画面設計（v2）

### Screen 1: ミラー画面（MirrorScreen / MirrorScreenV3）

**現行版（MirrorScreen.jsx）**:
- カメラプレビュー＋「肌チェック開始」ボタン常時表示
- キラリのメッセージバーが常時表示

**新版（MirrorScreenV3.jsx）— 実装予定**:
- **ピュアミラー設計**: フルスクリームカメラ。UIゼロが基本
- **タップで診断開始**（ボタン廃止）
- **低照度検知**: 暗い環境ではアラート表示（`useNightMode.js` は実装済み、ネイティブ化Phase 2でナイトモードUI再検討）
- **広告ゼロ**（ミラー画面はクリーンな鏡体験を最優先）
- `USE_MIRROR_V3` フラグで旧版と切替可能
- 詳細: `docs/MIRROR_UX_SPEC.md` 参照

### Screen 2: メイク提案画面（MakeupScreen）
- **スタイルタブ**: Color makeup / Base makeup / Skin care
- 今日の肌コンディション サマリー → おすすめルック2〜3パターン → ARトライオンへ
- 天気データ連動（Phase 2以降）: UV・湿度に応じたルック優先度調整

### Screen 3: ARトライオン（ArTryOnScreen）
- ライブカメラ + リアルタイムARメイクオーバーレイ（実装済み）
- パーツ: リップ・アイシャドウ・チーク・ファンデ・眉・コンシーラー（実装済み）
- 濃さスライダー、カラーパレット、ビフォーアフター長押し（実装済み）
- styleTab に応じたメイクオーバーレイ切替（Color/Base）実装済み
- カテゴリパネル（リップ/チーク/メガネ/イヤリング）4タブ切替（実装済み）
- メガネARレイヤー: 4形状（round/square/oval/wayfarer）、ランドマーク#6/#234/#454（実装済み）
- イヤリングARレイヤー: 4タイプ（stud/drop/hoop/chain）、ランドマーク#132/#361（実装済み）
- 「このメイクで決定」キャプチャ: video+canvas合成 → JPEG dataURL（実装済み）

### Screen 4: 結果画面（ResultScreen）
- 肌スコアサマリー、選んだメイクルックの記録
- キャプチャ写真表示（ARメイク+アクセサリー合成済み、シェアボタン付き）
- コスメ+アクセサリー統合商品リスト（KIREI SELECT）、合計金額、スコア履歴、SNSシェア

---

## ARメイクレンダリング仕様（実装済み）

### パーツ別実装
- **リップ**: ランドマーク #61〜#308 でポリゴン、multiplyブレンド
- **チーク**: ランドマーク #234/#454 付近を中心、ガウスぼかし、softlightブレンド
- **アイシャドウ**: 目周囲ランドマークでベジェ曲線領域、overlayブレンド
- **ファンデーション**: 顔全体メッシュ、softlightブレンド
- **眉・コンシーラー**: 実装済み
- **メガネ**: ランドマーク #6（鼻梁）/#234（左耳）/#454（右耳）、4形状（round/square/oval/wayfarer）、source-overブレンド
- **イヤリング**: ランドマーク #132（左耳珠）/#361（右耳珠）、4タイプ（stud/drop/hoop/chain）、source-overブレンド

### レンダリングパイプライン
```
カメラフレーム取得 (30fps目標)
  → MediaPipe FaceLandmarker推論 (468点)
  → ランドマーク座標 → パーツ領域ポリゴン生成
  → Layer 1-2: メイク描画（Canvas2D）
  → Layer 3: アクセサリー描画（メガネ・イヤリング）
  → Canvas2D描画（現在）/ WebGL（将来）
```

---

## 構想: デュアルミラーモード

- **🪞 リアルミラー**（デフォルト）: 正直な映り。肌チェック用
- **✨ マジックミラー**（スキンケアAR時）: 「3日後の自分」をリアルタイムプレビュー
  - 肌の平滑化、トーンアップ、軽い小顔補正
  - 「盛りすぎ」ではなく「信じられる範囲」の補正でKIREI SELECTへの自然な購買誘導

キラリのセリフ例:
- 「✨ これは3日後のあなた♪ 今日からケアすれば会えるよ！」

---

## 構想: スキンケアタブのAR化

- スキンケアタブにもARカメラを入れ「このルーティンを3日続けた後の肌」をプレビュー
- メイクARとは別パイプライン（肌自体をピクセル操作で補正）
- WebGL移行タイミングで実装するのが現実的

---

## 構想: ファッション拡張（Phase 4）

- パーソナルカラー判定（Phase 1で実装）が全レイヤーの共通基盤
- 天気×パーソナルカラー×骨格タイプ×TPOでコーデ提案
- **vs おしゃれ天気**: 天気は知っているが「あなたの顔」は知らない。KIREIは顔から逆算
- Phase 1〜3は肌＋メイクに集中。ファッションはPhase 4以降

---

## プロジェクト構造

```
C:\dev\kirei\
├── CLAUDE.md
├── README.md
├── package.json
├── index.html
├── docs/
│   ├── MIRROR_UX_SPEC.md      ← ミラーUX刷新仕様（実装完了）
│   ├── STEP2_SPEC.md          ← ステップ2仕様（実装完了）
│   └── STEP3_SPEC.md          ← ステップ3仕様（実装完了）
├── src/
│   ├── App.jsx                ← USE_MIRROR_V3フラグで画面切替
│   ├── components/
│   │   ├── Kirari.jsx
│   │   ├── Bubble.jsx
│   │   ├── Score.jsx
│   │   ├── ScoreBadge.jsx
│   │   ├── ProductCard.jsx
│   │   ├── ProductModal.jsx
│   │   ├── CameraView.jsx
│   │   ├── GuideFrame.jsx
│   │   ├── LanguageSwitcher.jsx
│   │   ├── MirrorScreen.jsx       ← レガシー版（参照用、App.jsxでは未使用）
│   │   ├── MirrorScreenV3.jsx     ← 現行版（USE_MIRROR_V3=true で稼働中）
│   │   ├── SuggestScreen.jsx      ← メイク提案（スタイルタブ実装済み）
│   │   ├── ArTryOnScreen.jsx
│   │   ├── MakeupCanvas.jsx
│   │   ├── ResultScreen.jsx
│   │   ├── CoordinateOverlay.jsx  ← TPOセレクター・スタイルボード実装済み
│   │   ├── BodySilhouette.jsx     ← SVG全身シルエット実装済み
│   │   ├── SkincareRoutineView.jsx ← スキンケアルーティン表示実装済み
│   │   ├── ClinicModal.jsx
│   │   └── DentalRotationModal.jsx
│   ├── contexts/
│   │   └── FaceLandmarkerContext.jsx
│   ├── rendering/
│   │   └── makeupRenderer.js
│   ├── hooks/
│   │   ├── useCamera.js
│   │   ├── useFaceLandmarker.js
│   │   ├── useKirari.js           ★実装済み
│   │   ├── useNightMode.js        ★実装済み（ナイトモードUIはPhase 2で再検討）
│   │   └── useWeather.js          ★実装済み
│   ├── analysis/
│   │   ├── skinAnalyzer.js
│   │   ├── personalColor.js       ★実装予定
│   │   └── makeupRecommender.js   ★実装予定
│   ├── data/
│   │   ├── products.js
│   │   ├── makeupLooks.js         ← COLOR_LOOKS / BASE_LOOKS / SKINCARE_ROUTINE 定義済み
│   │   ├── accessories.js         ← GLASSES_ITEMS / EARRING_ITEMS 定義済み
│   │   ├── coordItems.js          ← COORD_DATA（styleTab×TPOマトリクス）/ getCoordItems() 定義済み
│   │   ├── kirariDialogues.js     ← getCoordLine() / getCoordHint() 定義済み
│   │   ├── scores.js
│   │   ├── clinics.js
│   │   └── images.js
│   └── styles/
│       └── theme.js
├── lab/
│   └── facemesh/                  ← Face Mesh実験ページ
│       ├── index.html
│       ├── main.jsx
│       └── FaceMeshLab.jsx
├── public/
│   └── assets/
│       └── kirari/
└── prototype/
    ├── KIREI_Prototype.jsx        ← v1参考用
    └── KIREI_Prototype.html
```

---

## デザインシステム

### カラーパレット
```js
const colors = {
  primary:     '#a855f7',  // パープル
  accent:      '#ec4899',  // ピンク
  gradient:    'linear-gradient(135deg, #a855f7, #ec4899)',
  skinTone:    '#e879f9',
  pores:       '#a78bfa',
  dullness:    '#2dd4bf',
  moisture:    '#38bdf8',
  spring:      '#f59e0b',
  summer:      '#94a3b8',
  autumn:      '#d97706',
  winter:      '#6366f1',
  bg: 'linear-gradient(180deg, #faf5ff 0%, #fdf2f8 50%, #fff 100%)',
};
```

### フォント
- **Noto Sans JP** (400/500/600/700/800)

### UIパターン
- 角丸: 12px〜24px
- 影: `box-shadow: 0 2px 12px rgba(139,92,246,0.08)`
- ガラスモーフィズム: `backdrop-filter: blur(8px)`（カメラ画面上のオーバーレイ）
- `position: fixed` + `transform` の罠に注意 → `createPortal(…, document.body)` で回避

### ジェンダーニュートラル原則
- UI上に「男性用」「女性用」「メンズ」「レディース」の表記禁止
- スタイルタブは行為ベース（Color makeup / Base makeup / Skin care）
- OK: 「清潔感アップ」「血色感をプラス」／NG: 「女子力アップ」「メンズ向け」

---

## 開発フェーズ

### Phase 0: 技術POC ✅
- [x] プロトタイプ作成
- [x] リポジトリ初期化、CLAUDE.md配置
- [x] GitHub Pagesでデモ公開

### Phase 1: MVP ✅
- [x] Viteプロジェクト構築
- [x] コンポーネント分離
- [x] WebRTCカメラ統合
- [x] 照明正規化（グレーワールド補正＋明度正規化）
- [x] 簡易スコアリングロジック（肌: HSV/Lab）
- [x] 自動シャッター（肌色ピクセル密度ベース判定）
- [x] シャッター→静止画凍結→スキャン演出フロー
- [x] カメラフルスクリーン＋オーバーレイUI
- [x] GitHub Actions自動デプロイ
- [x] Face Meshワイヤーフレーム実験（lab/facemesh）
- [x] メイクARライブ化（リップ・アイシャドウ・チーク・ファンデ・眉・コンシーラー）
- [x] FaceLandmarkerContext（MirrorScreen/ArTryOnScreen間で共有）

### Phase 1.5: ミラーUX刷新（完了）
- [x] MirrorScreenV3実装（ピュアミラー・タップ診断）
- [x] useKirari.js（アンビエント出現・天気連動・連続起動日数セリフ）
- [x] useNightMode.js（輝度自動検知。ナイトモードUIはPhase 2で再検討）
- [x] useWeather.js（Open-Meteo連携・sessionStorageキャッシュ）
- [x] 初回チュートリアル（タップ波紋アニメーション・6秒自動消去）
- [x] USE_MIRROR_V3=true（MirrorScreenV3が本番稼働中）
- [x] 低照度アラートUI（lowLight検知時にキラリメッセージ表示）
- 詳細: `docs/MIRROR_UX_SPEC.md`

### Phase 2: メイク提案＋EC導線（一部完了）
- [ ] パーソナルカラー判定ロジック（`personalColor.js`）
- [ ] メイクルック提案ロジック（`makeupRecommender.js`）
- [x] SuggestScreen実装（スタイルタブ Color/Base/Skincare・ルックカード・SkincareRoutineView）
- [x] CoordinateOverlay実装（TPOセレクター・SVGシルエット・コーデデータマトリクス）
- [x] 天気API連動（useWeather・メイク提案・キラリセリフ連動）
- [x] KIREI SELECT（コスメ商品リスト・合計金額・購入CTA）
- [x] i18n対応（JA/EN/KO 三言語）
- [x] ARトライオン：カテゴリパネル（メガネ/イヤリング）+ キャプチャ → 結果写真表示（STEP3完了）
- [ ] パーソナルカラー判定（`personalColor.js`）
- [~] ナイトモードUI — デモ版では中止（ブラウザ輝度推定の精度不足）。Capacitor移行後に再実装
- [ ] スコア履歴（Supabase or Firebase）
- [ ] Capacitor移行（iOS/Androidネイティブラッパー）

### Phase 3: 成長
- [ ] デュアルミラーモード（リアル/マジックミラー切替）
- [ ] スキンケアタブのAR化（ビューティーフィルタ）
- [ ] SNSシェア最適化（ビフォーアフター自動生成）
- [ ] プッシュ通知（定期チェックリマインダー）

### Phase 4: ファッション拡張（構想）
- [ ] 骨格タイプ推定（MediaPipe Pose）
- [ ] コーデ提案エンジン（パーソナルカラー×骨格×天気×TPO）
- [ ] KIREI SELECT ファッション部門

---

## コーディングガイドライン

- TypeScript移行はPhase 2途中で検討。初期はJSX速度重視
- 関数コンポーネント + Hooks のみ。クラスコンポーネント禁止
- ファイル1つにつき `export default` 1つ
- 複雑な画面遷移には `useReducer` を使用

### 命名規則
- コンポーネント: PascalCase (`MirrorScreen.jsx`)
- フック: camelCase + use接頭辞 (`useCamera.js`)
- 定数: UPPER_SNAKE_CASE (`SKIN_SCORE_WEIGHTS`)

### 医療・美容表現の注意事項
- 禁止: 「診断」「治療」「病気」「あなたは○○タイプです」（断定）
- OK: 「チェック」「ケア」「スコア」「○○の傾向があります」
- コスメ推薦: 薬機法に抵触する効果効能の表現禁止（「シワが消える」等）
- 結果画面に必ず免責表示

---

## 技術的負債

### 非同期state/ナビゲーション問題
- **現状**: `applyScores()` 戻り値 + 500ms遅延で `onResult()` を呼ぶ
- **解決策**: `useReducer` で `dispatch({ type: 'ANALYSIS_COMPLETE', payload: scores })` に統一
- **対応**: Capacitor移行時（Phase 2）

### その他
- `position: fixed` + `transform` の罠 → `createPortal` で回避（既知）
- iOS Safari: `screen.orientation.lock()` 非対応 → v2でデンタル廃止により問題解消

### ナイトモードUI（検証済み・デモ版では中止）
- **検証結果**: `useNightMode.js`（輝度自動検知）は実装済みだが、
  WebRTC映像からのブラウザ内輝度推定では精度・応答速度ともに不十分と判断
- **デモ版**: Vanity Bulb / Ring Light演出は実装中止。低照度時はキラリの
  警告メッセージ表示のみ（`lowLight` フラグ連動）
- **ネイティブ化時の課題**: Capacitor移行後に AVFoundation（iOS）/
  Camera2 API（Android）の輝度データを直接取得することで解決見込み。
  UIコンセプト（Vanity Bulb温球 / Ring Light回転グロー）は `MIRROR_UX_SPEC.md` に保存済み

---

## トラブルシューティング

### Windows環境
- 開発: `C:\dev\kirei`
- パス: コード内は `/` 統一
- コマンド: `cp` → `copy`、`rm` → `del`
- マルチライン命令は1行ずつ実行

### GitHub Pages
- `git push origin main` → GitHub Actions自動ビルド → dist/デプロイ
- URL: https://sashibe.github.io/kirei/
