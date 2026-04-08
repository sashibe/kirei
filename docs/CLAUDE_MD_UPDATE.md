# CLAUDE.md 更新指示

> Claude Code はこのファイルの指示に従い、`CLAUDE.md` を更新して即pushすること。
> 変更は「実装済み事実の反映」のみ。設計方針・構想・ガイドラインは変更しない。

---

## 変更 1: 仕様書の管理ルール（docs/セクション）

### 変更前
```
docs/
  MIRROR_UX_SPEC.md     ← ミラーUX刷新仕様（実装中）
  STEP2_SPEC.md         ← ステップ2仕様（実装中）
```

### 変更後
```
docs/
  MIRROR_UX_SPEC.md     ← ミラーUX刷新仕様（実装完了）
  STEP2_SPEC.md         ← ステップ2仕様（実装完了）
  STEP3_SPEC.md         ← ステップ3仕様（未実装・次のターゲット）
```

---

## 変更 2: Screen 3 の説明

### 変更前
```
### Screen 3: ARトライオン（ArTryOnScreen）
- ライブカメラ + リアルタイムARメイクオーバーレイ（実装済み）
- パーツ: リップ・アイシャドウ・チーク・ファンデ・眉・コンシーラー（実装済み）
- 濃さスライダー、カラーパレット、ビフォーアフター長押し
```

### 変更後
```
### Screen 3: ARトライオン（ArTryOnScreen）
- ライブカメラ + リアルタイムARメイクオーバーレイ（実装済み）
- パーツ: リップ・アイシャドウ・チーク・ファンデ・眉・コンシーラー（実装済み）
- 濃さスライダー、カラーパレット、ビフォーアフター長押し（実装済み）
- styleTab に応じたメイクオーバーレイ切替（Color/Base）実装済み
- **未実装（STEP3）**: カテゴリパネル（リップ/チーク/メガネ/イヤリング）、メガネ・イヤリングARレイヤー、「このメイクで決定」キャプチャ
```

---

## 変更 3: プロジェクト構造

### 変更前（src/components/ の部分）
```
│   ├── components/
│   │   ├── Kirari.jsx
│   │   ├── Bubble.jsx
│   │   ├── Score.jsx
│   │   ├── ProductCard.jsx
│   │   ├── MirrorScreen.jsx       ← 現行版（変更しない）
│   │   ├── MirrorScreenV3.jsx     ← 新版（ピュアミラー設計）★実装予定
│   │   ├── MakeupScreen.jsx
│   │   ├── ArTryOnScreen.jsx
│   │   ├── MakeupCanvas.jsx
│   │   └── ResultScreen.jsx
```

### 変更後
```
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
```

### 変更前（src/data/ の部分）
```
│   ├── data/
│   │   ├── products.js
│   │   ├── makeupLooks.js
│   │   └── colorPalettes.js
```

### 変更後
```
│   ├── data/
│   │   ├── products.js
│   │   ├── makeupLooks.js         ← COLOR_LOOKS / BASE_LOOKS / SKINCARE_ROUTINE 定義済み
│   │   ├── coordItems.js          ← COORD_DATA（styleTab×TPOマトリクス）/ getCoordItems() 定義済み
│   │   ├── kirariDialogues.js     ← getCoordLine() / getCoordHint() 定義済み
│   │   ├── scores.js
│   │   ├── clinics.js
│   │   └── images.js
```

---

## 変更 4: Phase 1.5 チェックリスト

### 変更前
```
### Phase 1.5: ミラーUX刷新（現在）
- [ ] MirrorScreenV3実装（ピュアミラー・タップ診断）
- [ ] useKirari.js（アンビエント出現・天気連動セリフ）
- [x] useNightMode.js（輝度自動検知・実装済み。ナイトモードUIはデモ版では未実装、ネイティブ化Phase 2で再検討）
- [ ] useWeather.js（Open-Meteo連携）
- [ ] 初回チュートリアル（タップ波紋アニメーション）
- [ ] USE_MIRROR_V3フラグで旧版と並行稼働
- 詳細: `docs/MIRROR_UX_SPEC.md`
```

### 変更後
```
### Phase 1.5: ミラーUX刷新（完了）
- [x] MirrorScreenV3実装（ピュアミラー・タップ診断）
- [x] useKirari.js（アンビエント出現・天気連動・連続起動日数セリフ）
- [x] useNightMode.js（輝度自動検知。ナイトモードUIはPhase 2で再検討）
- [x] useWeather.js（Open-Meteo連携・sessionStorageキャッシュ）
- [x] 初回チュートリアル（タップ波紋アニメーション・6秒自動消去）
- [x] USE_MIRROR_V3=true（MirrorScreenV3が本番稼働中）
- [x] 低照度アラートUI（lowLight検知時にキラリメッセージ表示）
- 詳細: `docs/MIRROR_UX_SPEC.md`
```

---

## 変更 5: Phase 2 チェックリスト

### 変更前
```
### Phase 2: メイク提案＋EC導線
- [ ] パーソナルカラー判定ロジック（`personalColor.js`）
- [ ] メイクルック提案ロジック（`makeupRecommender.js`）
- [ ] MakeupScreen実装（スタイルタブ・ルック提案UI）
- [ ] 天気API連動（メイク提案の気象考慮）
- [ ] KIREI SELECT（コスメEC・アフィリエイトリンク）
- [ ] スコア履歴（Supabase or Firebase）
- [ ] Capacitor移行（iOS/Androidネイティブラッパー）
```

### 変更後
```
### Phase 2: メイク提案＋EC導線（一部完了）
- [ ] パーソナルカラー判定ロジック（`personalColor.js`）
- [ ] メイクルック提案ロジック（`makeupRecommender.js`）
- [x] SuggestScreen実装（スタイルタブ Color/Base/Skincare・ルックカード・SkincareRoutineView）
- [x] CoordinateOverlay実装（TPOセレクター・SVGシルエット・コーデデータマトリクス）
- [x] 天気API連動（useWeather・メイク提案・キラリセリフ連動）
- [x] KIREI SELECT（コスメ商品リスト・合計金額・購入CTA）
- [x] i18n対応（JA/EN/KO 三言語）
- [ ] ARトライオン：カテゴリパネル（メガネ/イヤリング）+ キャプチャ → 結果写真表示（STEP3）
- [ ] パーソナルカラー判定（`personalColor.js`）
- [ ] ナイトモードUI（Vanity Bulb / Ring Light演出）
- [ ] スコア履歴（Supabase or Firebase）
- [ ] Capacitor移行（iOS/Androidネイティブラッパー）
```

---

## コミットメッセージ

```
docs: CLAUDE.md更新（Phase 1.5完了・Phase 2進捗・STEP3仕様追加を反映）
```
