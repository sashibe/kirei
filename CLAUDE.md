# KIREI - AI ビューティーミラーアプリ

## プロジェクト概要

**KIREI**は、スマホのカメラを鏡に見立てて**肌診断**と**口腔チェック**を統合的に行うAIセルフチェックアプリ。  
旧称「SmileCheck」から発展し、口腔だけでなく肌分析も統合した「AIビューティーミラー」コンセプトへ進化した。

### コアフロー
1. **ミラー画面** — カメラで顔を映すと自動で肌分析（トーン・毛穴・くすみ）
2. **デンタルチェック** — 口元を映すと歯茎の色味・歯並び・着色を自動分析
3. **結果画面** — 肌スコア＋デンタルスコアを統合表示、ケアグッズ提案、提携歯科への送客、YouTube「歯腸ドクターズ」への導線

### ポジショニング
- **「診断」ではなく「気づき」のツール**。体重計が医療機器でないのと同じ位置づけ
- 薬機法に抵触しないよう「健康チェック」「セルフケアのヒント」の表現に留める
- 必ず `※本アプリは医療診断を行うものではありません` の免責を表示する

---

## リポジトリ情報

- **ローカルパス**: `C:\dev\kirei`
- **GitHub**: https://github.com/sashibe/kirei.git
- **ホスティング**: GitHub Pages（`sashibe.github.io/kirei/`）を想定

---

## 開発スタイル

### ウェブ版Claude（企画・設計）→ Claude Code（実装）の分業体制

- **企画・仕様決定**: ウェブ版Claude（claude.ai）のプロジェクト機能で行う。プロトタイプのJSX/HTMLもここで作成・検証する
- **実装・コーディング**: Claude Code（CLIツール）が担当。このCLAUDE.mdを読んで方針を理解し、コードを書く
- **バージョン管理**: git + GitHub。`git push` でGitHub Pagesに自動デプロイ

### コミットメッセージ規約
日本語で簡潔に。例:
```
feat: 肌スコア表示にアニメーション追加
fix: デンタルチェックのプログレスバー修正
refactor: Kirariコンポーネントを分離
docs: README更新
```

## ウェブ版Claudeとの連携ルール

- コードを書いたら必ず `git push origin main` する
- 変更したファイルのパスをウェブ版Claudeに報告する
- ウェブ版Claudeはこのリポジトリのraw URLでファイルを読む
  例: https://raw.githubusercontent.com/sashibe/kirei/main/{ファイルパス}

---

## ビジネスコンテキスト

### 収益モデル（Cocomi三層構造を踏襲）
1. **表面レイヤー**: 無料のビューティー/ヘルスチェック → ユーザー獲得
2. **送客レイヤー**: 提携歯科への予約導線、ケアグッズのアフィリエイト/EC（KIREI SELECT）
3. **データレイヤー**: 匿名化された口腔/肌データの分析・提供（将来）

### 提携先
- **山田兄弟歯科グループ**（医療法人尚歯会） — 大阪・心斎橋（Wellness Dental Clinic）、千里中央、奈良・学園前の3拠点
- 自費診療（ホワイトニング・矯正・インプラント）に積極的で、送客の客単価が高い

### YouTube連動
- **チャンネル**: 歯腸ドクターズ（山田正人先生 × 三吉範克先生）
- **連動企画**: 動画内でKIREIアプリを使い、AIスコア vs プロの診察を比較するコンテンツ
- アプリ結果画面から「歯腸ドクターズを見る」でYouTubeへ導線
- 三吉先生は阪大消化器外科の助教＋ハーバードポスドク＋AI医療開発者。アプリの医療監修としての権威性あり

---

## 技術スタック

### 現在（プロトタイプ）
- **React** (JSX) — 単一コンポーネント構成
- **インラインCSS** — Tailwind等は未導入
- **静的デモ** — カメラ連携はモック（固定画像）、AI分析はシミュレーション

### MVP目標
- **フレームワーク**: React + Vite（または Next.js）
- **カメラ**: WebRTC（`getUserMedia`）でリアルタイムプレビュー
- **AI分析**:
  - 肌: HSV/Lab色空間での色分析、テクスチャ解析
  - 口腔: セグメンテーション（歯/歯茎/舌の領域分割）、色味分析、対称性検出
  - モデル候補: TensorFlow.js（ブラウザ推論）、または Anthropic Claude Vision API（サーバーサイド）
- **バックエンド**: 軽量API（ユーザー履歴、スコア記録）
- **データベース**: Supabase or Firebase

### 最重要技術課題
**照明条件が変わっても歯茎の色分析が安定するか** — ここが成立しないと後続すべてが破綻する。Phase 0のPOCで最優先検証。

---

## マスコットキャラクター「キラリ」

- **モチーフ**: 鏡の妖精（ティンカーベル的）
- **デザイン**: 紫髪、星のヘアクリップ、半透明の羽、小さな手鏡の杖を持つ
- **表情パターン**: `happy` / `thinking` / `sparkle` / `wink`
- **役割**: チェック中のナビゲーション、結果のコメント、ケア提案の語りかけ
- **トーン**: フレンドリー、親しみやすい日本語（「〜だよ♪」「〜してみてね！」）
- **実装**: SVGコンポーネント `<Kirari size={48} expression="happy" bounce />`

---

## プロジェクト構造（予定）

```
C:\dev\kirei\
├── CLAUDE.md              ← このファイル
├── README.md
├── package.json
├── index.html             ← GitHub Pages用エントリ
├── src/
│   ├── App.jsx
│   ├── components/
│   │   ├── Kirari.jsx         ← マスコットSVG
│   │   ├── Bubble.jsx         ← 吹き出しUI
│   │   ├── Score.jsx          ← サークルゲージ
│   │   ├── ProductCard.jsx    ← ケアグッズカード
│   │   ├── MirrorScreen.jsx   ← 画面1: ビューティーミラー
│   │   ├── DentalScreen.jsx   ← 画面2: デンタルチェック
│   │   └── ResultScreen.jsx   ← 画面3: 結果表示
│   ├── hooks/
│   │   └── useCamera.js       ← WebRTCカメラ制御
│   ├── analysis/
│   │   ├── skinAnalyzer.js    ← 肌分析ロジック
│   │   └── dentalAnalyzer.js  ← 口腔分析ロジック
│   ├── data/
│   │   ├── products.js        ← ケアグッズマスタ
│   │   └── clinics.js         ← 提携歯科マスタ
│   └── styles/
│       └── theme.js           ← カラーパレット・共通スタイル
├── public/
│   └── assets/
└── prototype/
    ├── KIREI_Prototype.jsx    ← ウェブ版Claudeで作成したプロトタイプ
    └── KIREI_Prototype.html   ← HTML版プロトタイプ
```

---

## デザインシステム

### カラーパレット
```js
const colors = {
  // ブランドカラー
  primary:     '#a855f7',  // パープル（メインブランド）
  accent:      '#ec4899',  // ピンク（アクセント）
  gradient:    'linear-gradient(135deg, #a855f7, #ec4899)',

  // 機能カラー
  skinScore:   '#a855f7',  // 肌スコア
  dentalScore: '#22c55e',  // デンタルスコア
  
  // スコア項目
  skinTone:    '#e879f9',
  pores:       '#a78bfa',
  dullness:    '#2dd4bf',
  gums:        '#22c55e',
  alignment:   '#f59e0b',
  staining:    '#f97316',

  // 背景
  bg: 'linear-gradient(180deg, #faf5ff 0%, #fdf2f8 35%, #fff 65%, #f0fdf4 100%)',
};
```

### フォント
- **Noto Sans JP** (400/500/600/700/800)
- アプリ全体で統一

### UIパターン
- **角丸**: 12px〜24px（カード・ボタン）
- **影**: `box-shadow: 0 2px 12px rgba(139,92,246,0.08)` 程度の控えめなもの
- **ガラスモーフィズム**: カメラ画面上のオーバーレイに `backdrop-filter: blur(8px)`

---

## 他プロジェクトとの共有リソース

### Cocomiから流用可能
- 三層ビジネス構造の設計パターン
- ユーザーデータの匿名化フレームワーク
- 提携先との送客レポーティング設計

### GLEAMから流用可能
- フロントエンドのデザインシステム/コンポーネント設計手法
- アニメーション・マイクロインタラクションのパターン

### Claudeスキル
- `/mnt/skills/public/frontend-design/SKILL.md` — UI作成時に参照
- `/mnt/skills/user/sakura-reviewer/SKILL.md` — 安全性レビューの手法を応用

---

## 開発フェーズ

### Phase 0: 技術POC ✅
- [x] プロトタイプ作成（JSX/HTML、ウェブ版Claudeで完成済み）
- [x] リポジトリ初期化、CLAUDE.md配置
- [x] プロトタイプをリポジトリに移行
- [x] GitHub Pagesでデモ公開

### Phase 1: MVP ✅
- [x] Viteプロジェクト構築
- [x] コンポーネント分離（プロトタイプから抽出）
- [x] WebRTCカメラ統合
- [x] 照明正規化POC（グレーワールド補正＋明度正規化）
- [x] 簡易スコアリングロジック実装（肌: HSV/Lab、デンタル: 色分類）
- [x] ガイド枠内の自動シャッター（肌色/口腔ピクセル密度ベース判定）
- [x] シャッター→静止画凍結→スキャン演出フロー
- [x] カメラフルスクリーン＋オーバーレイUI
- [x] PCブラウザ用iPhoneモックアップフレーム
- [x] GitHub Actions自動デプロイ

### Phase 2: 提携歯科導入
- [ ] 山田兄弟歯科グループとのテスト運用
- [ ] 送客導線の実装（予約フォーム連携）
- [ ] YouTube「歯腸ドクターズ」との連動機能

### Phase 3: 成長
- [ ] KIREI SELECT（ケアグッズEC）
- [ ] スコア履歴・トレンド表示
- [ ] プッシュ通知（定期チェックリマインダー）

### 技術的な既知の制約（デモ版）
- MediaPipe FaceLandmarker導入済みだが、手で顔を部分的に隠してもメッシュが推定される（Hand Landmarker併用で解決可能）
- 口の開閉判定はランドマークベース（上下唇距離/口幅>15%）で実装済み
- 低照度環境では検出精度が低下（HSVフォールバック + 低照度緩和条件で対応）

---

## コーディングガイドライン

### 一般
- TypeScriptへの移行は Phase 1 の途中で検討。初期はJSXで速度重視
- コンポーネントは関数コンポーネント + Hooks のみ。クラスコンポーネント禁止
- ファイル1つにつきエクスポート1つ（`export default`）

### 命名規則
- コンポーネント: PascalCase (`MirrorScreen.jsx`)
- フック: camelCase + use接頭辞 (`useCamera.js`)
- 定数: UPPER_SNAKE_CASE (`SKIN_SCORE_WEIGHTS`)
- CSS変数/テーマ: camelCase (`primaryColor`)

### 医療表現の注意事項
- 「診断」「治療」「病気」等の医療用語は使用禁止
- OK: 「チェック」「ケア」「スコア」「気になる点」「歯科医に相談」
- NG: 「診断結果」「歯周病です」「治療が必要です」
- 結果画面には必ず免責表示を含めること

---

## トラブルシューティング

### Windows環境での注意
- 開発環境は Windows（`C:\dev\kirei`）
- パス区切りは `\` だが、コード内では `/` で統一
- `cp` ではなく `copy`、`rm` ではなく `del`（コマンドプロンプト使用時）
- Node.js / npm はインストール済み

### GitHub Pages
- GitHub Actionsで自動デプロイ（`.github/workflows/deploy.yml`）
- `git push origin main` → ビルド → dist/ をデプロイ
- デプロイ後数分で反映
- URL: https://sashibe.github.io/kirei/
