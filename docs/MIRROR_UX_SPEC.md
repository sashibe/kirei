# KIREI — ミラーUX刷新仕様書

**対象ファイル**: `src/components/MirrorScreen.jsx`（新規: `MirrorScreenV3.jsx` として並行開発）  
**対象ブランチ**: `feature/mirror-ux-v3`（mainはそのまま保持）  
**ステータス**: 設計確定 / 実装待ち

---

## 背景と方針

### なぜ変えるか

競合調査（2025年4月実施）の結果、KIREIの真の競合は**シンプルミラーアプリ**（ナチュラルミラー等）であることが判明した。これらのアプリは：

- 「毎朝鏡を開く」という習慣を持つユーザーを既に抱えている
- UIがどれも10年以上進化していない（ズーム・明るさ・反転のみ）
- 広告（特に全画面広告）への不満レビューが多い

KIREIは「ミラーアプリとして最高の体験」を出発点にすることで、このユーザー層の乗り換え先になれる。肌チェックやAI機能はその上に乗る価値であり、まず鏡として信頼されることが優先。

### 変更の核心

| 現在 | 変更後 |
|---|---|
| 「肌チェック開始」ボタンが常時表示 | ボタン廃止。タップで診断開始 |
| キラリバーが常時表示（白背景） | キラリはたまに現れる存在に |
| 広告なしだが、UIが鏡の邪魔をしている | ピュアミラー画面。UIゼロが基本 |
| ナイトモードなし | 暗さ自動検知で自動切替 |

---

## 1. ピュアミラー設計

### 基本状態

```
┌─────────────────────┐
│                     │  ← ステータスバーのみ（OS標準）
│                     │
│    カメラ映像        │  ← フルスクリーン。UIゼロ
│   （ピュアミラー）   │
│                     │
│                     │
│      ∙              │  ← キラリ（小・半透明）がたまに端に現れる
└─────────────────────┘
```

- カメラ映像はフルスクリーン（`position: fixed; inset: 0`）
- KIREIロゴ・ボタン・バー類は**一切表示しない**
- 広告ゼロ（現行方針を維持・強化）
- 免責表示は診断結果画面のみに表示（ミラー画面には不要）

### タップで診断開始

- 画面をシングルタップ → 肌チェック開始
- タップ時エフェクト: 画面中央から波紋が広がり、スキャン開始のアニメーションへ遷移
- **ダブルタップ**: 将来的に別機能（ズーム等）のために予約しておく

---

## 2. ディスカバラビリティ設計（タップ操作の周知）

### 初回起動時のみ: チュートリアル

```jsx
// 初回フラグ
const isFirstLaunch = !localStorage.getItem('kirei_launched');

// チュートリアル表示条件
// - 初回起動のみ
// - カメラ映像が安定してから1.5秒後に表示
// - ユーザーがタップしたら即消える
```

**チュートリアルUI**:
- 画面中央にタップ波紋アニメーション（CSSのみ、繰り返し）
- キラリが小さく現れてセリフを表示:  
  `「タップすると今日の肌をチェックするよ♪」`
- 3秒後またはタップで自動消去
- `localStorage.setItem('kirei_launched', '1')` を記録

### 2回目以降: キラリによるアンビエントヒント

詳細は「3. キラリの挙動」セクション参照。

---

## 3. キラリの挙動設計

### 出現の原則

- **基本状態では非表示**。鏡として邪魔しない
- 以下のトリガーで画面端（右下）にふわっと現れ、セリフを言って消える
- 出現時間: 4〜6秒（セリフ長に応じて調整）
- フェードイン 0.4s → 表示 → フェードアウト 0.4s
- キラリアイコン（32px）+ 吹き出し（ガラスモーフィズム）の組み合わせ

### 出現トリガーと優先順位

```
優先度 高
  1. 初回起動（チュートリアル）
  2. アプリ起動から5秒放置（まだ何もしていない）
  3. 天気・環境系の情報がある場合（毎朝1回、起動後3秒）
優先度 中
  4. 連続起動◯日目（3日・7日・30日）
  5. ランダム出現（起動10回に1回程度）
優先度 低
  6. 長押し検知（3秒）→ ヒント表示
```

複数条件が重なる場合は最上位のみ表示（1日1回まで）。

### セリフパターン定義

#### A. 天気・環境連動（天気API取得後に判定）

| 条件 | セリフ |
|---|---|
| 湿度 70%以上 | 「今日は湿気多めだって。崩れにくいメイクがいいかも」 |
| 湿度 40%以下（乾燥） | 「今日は乾燥注意日。肌の水分、確認してみて」 |
| UV指数 高（6以上） | 「UV強めの日だよ。日焼け止め忘れずに！」 |
| 気温 10度以下 | 「寒い日は肌が敏感になりやすいよ。やさしくチェックしてみて」 |
| 気温 30度以上 | 「今日は暑くなりそう。皮脂多めの日かも」 |
| 雨・降水確率70%以上 | 「雨の予報だよ。ウォータープルーフのアイテム、チェックしてみて」 |
| 花粉（3〜5月、晴れ） | 「花粉の季節。肌が敏感になってる人も多いよ」 |

#### B. ヒント系

| トリガー | セリフ |
|---|---|
| 起動後5秒放置 | 「タップすると肌チェックできるよ✨」 |
| 長押し3秒 | 「タップして、今日のコンディション確認してみて♪」 |

#### C. 継続応援系

| 条件 | セリフ |
|---|---|
| 3日連続 | 「3日連続チェック！コツコツが一番きれいへの近道だよ」 |
| 7日連続 | 「1週間続けてる！肌の変化、気づいてきた？」 |
| 30日連続 | 「1ヶ月続けてること、すごいよ。肌記録、確実に積み重なってるよ」 |

#### D. ランダム（ふとした一言）

起動10回に1回程度。軽い言葉でKIREIの世界観を維持する。

```js
const RANDOM_LINES = [
  "おはよ♪ 今日もいい顔してるよ",
  "昨日と今日、肌の調子どう？",
  "鏡に映る自分、毎日少しずつ変わってるんだよ",
  "今日は何色のリップにする？",
  "ちょっとくすんでる日でも、大丈夫。チェックしてみて",
];
```

### 実装

```jsx
// hooks/useKirari.js

export function useKirari({ weather, streak }) {
  const [message, setMessage] = useState(null);
  const [visible, setVisible] = useState(false);

  const show = (text, duration = 5000) => {
    setMessage(text);
    setVisible(true);
    setTimeout(() => setVisible(false), duration);
  };

  useEffect(() => {
    // 天気連動（最優先）
    if (weather) {
      const line = getWeatherLine(weather); // 上記テーブルから選出
      if (line) { show(line, 6000); return; }
    }
    // 連続日数
    if (streak === 3 || streak === 7 || streak === 30) {
      show(STREAK_LINES[streak], 6000); return;
    }
    // ランダム（10回に1回）
    if (Math.random() < 0.1) {
      show(randomPick(RANDOM_LINES)); return;
    }
    // 5秒放置でヒント
    const timer = setTimeout(() => show('タップすると肌チェックできるよ✨'), 5000);
    return () => clearTimeout(timer);
  }, []);

  return { message, visible };
}
```

---

## 4. ナイトモード設計

> **デモ版では未実装。** `useNightMode.js`（輝度検知ロジック）は実装済みだが、ナイトモード専用UIはデモ版では提供しない。暗い環境では既存の低照度アラート（「ちょっと暗いかも💡 明るい場所で試してみてね！」）を表示する。ナイトモードUI（バニティライト/リングライト/画面フラッシュライト等）はネイティブ化（Phase 2）で再検討する。

---

## 5. ファイル構成

### 並行開発の戦略

```
src/components/
  ├── MirrorScreen.jsx         ← 現行版（変更しない）
  └── MirrorScreenV3.jsx       ← 新版（本仕様書の実装先）

src/hooks/
  ├── useKirari.js             ← 新規
  ├── useNightMode.js          ← 実装済み（UIはPhase 2で再検討）
  └── useCamera.js             ← 既存（変更なし）
```

### App.jsx での切り替え

```jsx
// App.jsx
const USE_MIRROR_V3 = true; // ← ここをfalseにすると旧版に戻る

import MirrorScreen from './components/MirrorScreen';
import MirrorScreenV3 from './components/MirrorScreenV3';

const Mirror = USE_MIRROR_V3 ? MirrorScreenV3 : MirrorScreen;
```

デプロイ時は `USE_MIRROR_V3 = true` がデフォルト。  
問題が起きたら `false` に戻してコミット → 即ロールバック可能。

---

## 6. 天気API統合

```js
// hooks/useWeather.js

const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';
// Open-Meteo: 無料・APIキー不要・日本対応

export async function fetchWeather(lat, lon) {
  const url = `${WEATHER_API}?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,precipitation_probability,uv_index` +
    `&timezone=Asia/Tokyo`;
  const res = await fetch(url);
  const data = await res.json();
  return {
    temp: data.current.temperature_2m,           // 気温 (°C)
    humidity: data.current.relative_humidity_2m,  // 湿度 (%)
    uvIndex: data.current.uv_index,              // UV指数
    rainProb: data.current.precipitation_probability, // 降水確率 (%)
  };
}
```

**位置情報の取得**:
- `navigator.geolocation.getCurrentPosition()` で取得
- 拒否された場合: 天気連動セリフのみスキップ。他の機能は正常動作
- 取得した位置情報はローカルのみで使用。サーバー送信しない

**キャッシュ**:
- `sessionStorage` に保存
- 同一セッション内は再取得しない（バッテリー・通信量配慮）

---

## 7. 実装順序（Claude Codeへの指示）

以下の順で実装すること。各ステップをコミットしてから次へ進む。

### Step 1: MirrorScreenV3の骨格
- `MirrorScreenV3.jsx` を新規作成
- カメラ映像フルスクリーン表示（`useCamera.js` 流用）
- タップで `onStartAnalysis()` コールバックを呼ぶ
- `App.jsx` に `USE_MIRROR_V3` フラグを追加
- コミット: `feat: MirrorScreenV3 骨格 + フラグ切替`

### Step 2: キラリシステム
- `useKirari.js` を実装
- セリフパターンをすべて定義
- MirrorScreenV3にキラリUIを組み込む（フェードイン/アウト）
- 天気APIなしの状態で動作確認
- コミット: `feat: キラリ アンビエント出現システム`

### Step 3: 天気API連動
- `useWeather.js` を実装（Open-Meteo使用）
- `useKirari.js` に天気データを渡す
- 位置情報拒否時のフォールバック確認
- コミット: `feat: 天気API連動 キラリセリフ`

### Step 4: 初回チュートリアル
- `localStorage` による初回判定
- タップ波紋アニメーション実装
- チュートリアル終了後の通常遷移確認
- コミット: `feat: 初回チュートリアル`

### Step 5〜6: ナイトモード
- `useNightMode.js` は実装済み（輝度検知ロジック）
- **ナイトモードUIはデモ版では未実装**。低照度時は既存アラートで対応
- ネイティブ化（Phase 2）でUI方式を再検討

---

## 8. 判断保留事項

以下はSoriとの確認後に決定する。

| 項目 | 選択肢 | 現在の仮設定 |
|---|---|---|
| キラリの出現頻度 | 適応型インターバル（15s→30s→45s） | 実装済み |
| 天気API | Open-Meteo / OpenWeatherMap | Open-Meteo（無料・キー不要）実装済み |
| ナイトモードUI | Phase 2で再検討 | デモ版では低照度アラートのみ |
