# KIREI v2 デモ ステップ① 実装仕様書

> Claude Code はこのファイルを読んで実装する。判断に迷う箇所はこの仕様に従うこと。

---

## 0. 前提: Vite プロジェクト化

単一JSXのプロトタイプ（`KIREI_v2_Prototype.jsx`）を Vite + React に移行する。

```bash
npm create vite@latest kirei-v2 -- --template react
cd kirei-v2
npm install
```

### ディレクトリ構成（ステップ①時点）

```
src/
├── App.jsx                    ← ルートコンポーネント（画面遷移管理）
├── main.jsx                   ← エントリポイント
├── index.css                  ← グローバルスタイル（セーフエリア、フォント）
├── components/
│   ├── Kirari.jsx             ← マスコットSVG（既存流用）
│   ├── Bubble.jsx             ← 吹き出しUI（既存流用）
│   ├── Score.jsx              ← サークルゲージ（既存流用）
│   ├── ScreenTransition.jsx   ← 画面遷移アニメーションラッパー
│   ├── LoadingOverlay.jsx     ← 分析中のローディング演出
│   └── WeatherBadge.jsx       ← 天気バッジ
├── screens/
│   ├── MirrorScreen.jsx       ← 画面1: ミラー（肌分析+PC判定）
│   ├── SuggestScreen.jsx      ← 画面2: メイク提案
│   ├── TryOnScreen.jsx        ← 画面3: ARトライオン
│   └── ResultScreen.jsx       ← 画面4: 結果
├── hooks/
│   ├── useCamera.js           ← WebRTCカメラ制御
│   └── useScreenTransition.js ← 画面遷移制御
├── data/
│   ├── skinScores.js          ← 肌スコアデータ（デモ用固定値）
│   ├── makeupLooks.js         ← メイクルック定義
│   ├── coordItems.js          ← コーデアイテム定義
│   └── kirariDialogues.js     ← キラリセリフツリー
└── styles/
    └── theme.js               ← カラーパレット・共通定数
```

---

## 1. useCamera hook

### ファイル: `src/hooks/useCamera.js`

```js
import { useRef, useState, useEffect, useCallback } from 'react';

export default function useCamera() {
  const videoRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | requesting | active | denied | error
  const [stream, setStream] = useState(null);

  const start = useCallback(async () => {
    setStatus('requesting');
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',         // フロントカメラ
          width: { ideal: 720 },
          height: { ideal: 960 },     // 3:4 アスペクト比
          frameRate: { ideal: 30 },
        },
        audio: false,
      });
      setStream(s);
      setStatus('active');
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setStatus('denied');
      } else {
        setStatus('error');
      }
    }
  }, []);

  const stop = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
      setStatus('idle');
    }
  }, [stream]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [stream]);

  return { videoRef, status, start, stop };
}
```

### 使用箇所

- **MirrorScreen**: マウント時に `start()` を呼ぶ。`<video>` に `ref={videoRef}` を設定。
- **TryOnScreen**: 同じく `start()` で起動。ARオーバーレイはこの `<video>` の上にCSS重畳。
- 画面遷移で MirrorScreen/TryOnScreen から離れる際に `stop()` を呼ぶ。

### フォールバック

`status === 'denied' || status === 'error'` の場合、既存のSVGイラスト（IMG_FACE）を表示。
UI上に「カメラを許可するとリアルタイムで分析できます」のメッセージをKirariに言わせる。

```jsx
// MirrorScreen.jsx 内
{camera.status === 'active' ? (
  <video ref={camera.videoRef} autoPlay playsInline muted
    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
) : (
  <img src={IMG_FACE} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
)}
```

**注意**: `transform: scaleX(-1)` でミラー反転。鏡アプリなので左右反転が自然。

---

## 2. 画面遷移アニメーション

### 方針

CSS Transition ベース。React の state 変更で className を切り替え、transform + opacity でスライド/フェード。

### ファイル: `src/hooks/useScreenTransition.js`

```js
import { useState, useCallback } from 'react';

export default function useScreenTransition(initialScreen = 0) {
  const [current, setCurrent] = useState(initialScreen);
  const [direction, setDirection] = useState('forward'); // forward | back
  const [transitioning, setTransitioning] = useState(false);

  const goTo = useCallback((nextScreen, dir = 'forward') => {
    setDirection(dir);
    setTransitioning(true);
    // フェードアウト: 150ms 待ってから切替
    setTimeout(() => {
      setCurrent(nextScreen);
      // フェードイン開始
      setTimeout(() => setTransitioning(false), 50);
    }, 150);
  }, []);

  const goForward = useCallback((screen) => goTo(screen, 'forward'), [goTo]);
  const goBack = useCallback((screen) => goTo(screen, 'back'), [goTo]);

  return { current, direction, transitioning, goForward, goBack };
}
```

### ファイル: `src/components/ScreenTransition.jsx`

```jsx
export default function ScreenTransition({ transitioning, direction, children }) {
  const baseStyle = {
    transition: 'opacity 0.15s ease, transform 0.2s ease',
    opacity: transitioning ? 0 : 1,
    transform: transitioning
      ? `translateX(${direction === 'forward' ? '30px' : '-30px'})`
      : 'translateX(0)',
  };

  return <div style={baseStyle}>{children}</div>;
}
```

### App.jsx での使い方

```jsx
import useScreenTransition from './hooks/useScreenTransition';
import ScreenTransition from './components/ScreenTransition';
// ... screens

export default function App() {
  const nav = useScreenTransition(0);
  // ... state

  return (
    <ScreenTransition transitioning={nav.transitioning} direction={nav.direction}>
      {nav.current === 0 && <MirrorScreen onNext={() => nav.goForward(1)} />}
      {nav.current === 1 && <SuggestScreen onNext={(look) => nav.goForward(2)} onBack={() => nav.goBack(0)} />}
      {nav.current === 2 && <TryOnScreen onNext={() => nav.goForward(3)} onBack={() => nav.goBack(1)} />}
      {nav.current === 3 && <ResultScreen onRestart={() => nav.goForward(0)} />}
    </ScreenTransition>
  );
}
```

---

## 3. ローディング演出

### 分析中（MirrorScreen）の3段階演出

| 段階 | 時間 | 演出 | キラリ |
|------|------|------|--------|
| 肌スキャン | 0〜3.2秒 | スキャンライン上下 + パーティクル | bounce, expression="thinking" |
| スコア表示 | 3.2秒 | バッジがフェードイン | expression="sparkle" |
| PC判定 | 3.2〜5.0秒 | 顔の下にカラーホイールが回転→バッジに収束 | expression="wink" |

### ファイル: `src/components/LoadingOverlay.jsx`

```jsx
export default function LoadingOverlay({ phase }) {
  // phase: 'scanning' | 'scored' | 'colorTyping' | 'done'

  if (phase === 'scanning') {
    return (
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {/* スキャンライン */}
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent, #e879f9, transparent)',
          animation: 'scanLine 2s ease-in-out infinite',
          boxShadow: '0 0 12px #e879f9',
        }}/>
        {/* パーティクル（軽量版: 4つの光点が顔周辺を浮遊） */}
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            position: 'absolute',
            width: 4, height: 4, borderRadius: '50%',
            background: ['#e879f9','#a78bfa','#2dd4bf','#38bdf8'][i],
            animation: `particle${i} 2.5s ease-in-out infinite`,
            opacity: 0.7,
          }}/>
        ))}
      </div>
    );
  }

  if (phase === 'colorTyping') {
    return (
      <div style={{
        position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)',
        width: 40, height: 40,
      }}>
        {/* 4色のドットが回転 */}
        <div style={{ animation: 'colorWheel 1.5s linear infinite', position: 'relative', width: '100%', height: '100%' }}>
          {['#f59e0b','#94a3b8','#d97706','#6366f1'].map((c, i) => (
            <div key={i} style={{
              position: 'absolute', width: 8, height: 8, borderRadius: '50%',
              background: c,
              top: i < 2 ? 0 : 32,
              left: i % 2 === 0 ? 0 : 32,
            }}/>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
```

### CSS アニメーション（index.css に追記）

```css
@keyframes scanLine {
  0%, 100% { top: 15%; }
  50% { top: 70%; }
}

@keyframes particle0 {
  0%, 100% { top: 20%; left: 25%; }
  50% { top: 60%; left: 30%; }
}
@keyframes particle1 {
  0%, 100% { top: 30%; right: 20%; left: auto; }
  50% { top: 55%; right: 25%; }
}
@keyframes particle2 {
  0%, 100% { top: 50%; left: 20%; }
  50% { top: 25%; left: 35%; }
}
@keyframes particle3 {
  0%, 100% { top: 45%; right: 15%; left: auto; }
  50% { top: 65%; right: 30%; }
}

@keyframes colorWheel {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

---

## 4. セーフエリア対応

### ファイル: `src/index.css`

```css
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;800&display=swap');

:root {
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left: env(safe-area-inset-left, 0px);
  --safe-right: env(safe-area-inset-right, 0px);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
}

body {
  font-family: 'Noto Sans JP', sans-serif;
  background: #faf5ff;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

/* 全画面共通ラッパー */
.screen {
  max-width: 430px;
  margin: 0 auto;
  min-height: 100dvh;       /* dvh: dynamic viewport height（iOS対応） */
  padding-top: var(--safe-top);
  padding-bottom: var(--safe-bottom);
  padding-left: var(--safe-left);
  padding-right: var(--safe-right);
}
```

### `<meta>` タグ（index.html）

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

### 適用ルール

- 各 Screen コンポーネントのルート `<div>` に `className="screen"` を付与
- ARトライオン画面（TryOnScreen）の操作パネルは `padding-bottom: calc(var(--safe-bottom) + 24px)` で下端を確保
- ヘッダー部分は `padding-top: calc(var(--safe-top) + 16px)` でノッチを回避

---

## 5. 動的キラリセリフ

### ファイル: `src/data/kirariDialogues.js`

```js
// セリフ選択関数: コンテキストに応じたセリフを返す
export function getKirariLine(context) {
  const { screen, phase, skinScores, pcType, weather, selectedLook } = context;

  // ─── ミラー画面 ───
  if (screen === 'mirror') {
    if (phase === 'scanning') return 'キラリだよ♪ お顔を映してね、肌の状態をチェックしてるよ〜';
    if (phase === 'scored') return '肌チェック完了！パーソナルカラーを判定してるよ〜';
    if (phase === 'done') return '肌チェック＆カラー判定完了♪ 今日の肌にぴったりのメイクを提案するね〜';
  }

  // ─── メイク提案画面 ───
  if (screen === 'suggest') {
    const pores = skinScores?.pores || 70;
    const dullness = skinScores?.dullness || 70;

    if (pores < 65 && dullness > 75) {
      return '毛穴がちょっと気になるけど、くすみスコアは優秀！カバー力のあるベースでツヤ肌を活かしてみて♪';
    }
    if (pores >= 75 && dullness >= 75) {
      return '今日の肌、絶好調じゃない？ どのルックもきれいに映えそう〜♪';
    }
    if (dullness < 65) {
      return '今日はちょっとくすみが気になるかも。血色感のあるコーラル系で明るく見せよう♪';
    }
    // 天気連動
    if (weather?.humidity > 70) {
      return '湿度が高めだから、崩れにくいセミマットルックがおすすめだよ♪';
    }
    if (weather?.uv >= 5) {
      return 'UV指数が強いみたい！SPF高めの下地にしておこうね〜';
    }
    return '今日はちょっと毛穴が気になるかも。でもくすみスコアは優秀！ツヤ肌で血色感をプラスしてみない？';
  }

  // ─── ARトライオン画面 ───
  if (screen === 'tryon') {
    // 選んだ色に応じて反応
    return 'おお！その色すっごく似合ってる〜♪ 濃さを調整してベストなバランスを見つけてね！';
  }

  // ─── 結果画面 ───
  if (screen === 'result') {
    const lookName = selectedLook?.name || 'メイク';
    return `今日のメイク、ばっちり決まったね♪ ${lookName}で血色感もアップしてるよ〜！`;
  }

  // ─── コーデ画面 ───
  if (screen === 'coordinate') {
    if (weather?.temp < 15) {
      return 'ちょっと寒い日だね。暖かみのあるアイテムを選んだよ♪ 重ね着でおしゃれに防寒しよう〜';
    }
    if (weather?.temp > 25) {
      return '今日は暑くなりそう！涼しげな素材でメイクが映えるコーデにしたよ♪';
    }
    return 'メイクに合わせたトータルコーデだよ♪ 気になるアイテムはタップしてチェックしてね〜';
  }

  return 'キラリだよ♪';
}

// キラリの表情を文脈に応じて返す
export function getKirariExpression(context) {
  const { screen, phase } = context;

  if (screen === 'mirror') {
    if (phase === 'scanning') return 'thinking';
    if (phase === 'scored') return 'sparkle';
    if (phase === 'done') return 'wink';
  }
  if (screen === 'suggest') return 'sparkle';
  if (screen === 'tryon') return 'wink';
  if (screen === 'result') return 'happy';
  if (screen === 'coordinate') return 'sparkle';

  return 'happy';
}
```

### 使い方

```jsx
import { getKirariLine, getKirariExpression } from '../data/kirariDialogues';

// コンポーネント内で
const context = { screen: 'suggest', skinScores: SKIN, weather: WEATHER };
const line = getKirariLine(context);
const expr = getKirariExpression(context);

<Kirari size={36} expression={expr} />
<Bubble><p>{line}</p></Bubble>
```

---

## 6. 実装順序（Claude Code向け）

1. `npm create vite@latest kirei-v2 -- --template react` でプロジェクト初期化
2. `index.css` にグローバルスタイル（セーフエリア、フォント、アニメーション）を配置
3. `index.html` に `viewport-fit=cover` の meta を追加
4. `src/styles/theme.js` にカラーパレット定数を移動
5. `src/components/` に Kirari, Bubble, Score を既存プロトタイプから分離
6. `src/hooks/useCamera.js` を作成
7. `src/hooks/useScreenTransition.js` を作成
8. `src/components/ScreenTransition.jsx` を作成
9. `src/components/LoadingOverlay.jsx` を作成
10. `src/data/kirariDialogues.js` を作成
11. `src/data/` にスコア・ルック・コーデのデータファイルを移動
12. 4つの Screen コンポーネントを作成（プロトタイプから分離＋カメラ統合＋セリフ統合）
13. `src/App.jsx` で画面遷移を統合
14. 動作確認 → `npm run build` → デプロイ

### コミット単位

```
feat: Viteプロジェクト初期化＋コンポーネント分離
feat: useCamera hook 実装（フロントカメラ＋フォールバック）
feat: 画面遷移アニメーション実装
feat: ローディング演出（スキャンライン＋パーティクル＋カラーホイール）
feat: キラリ動的セリフシステム実装
feat: セーフエリア対応（ノッチ＋ダイナミックアイランド）
```

---

## 7. 検証チェックリスト

- [ ] カメラ許可ダイアログが表示される
- [ ] カメラ起動後、ミラー反転（左右逆）で表示される
- [ ] カメラ拒否時にSVGイラストのフォールバックが表示される
- [ ] 画面遷移時にスライド＋フェードアニメーションが発生する
- [ ] 「戻る」操作で逆方向のスライドになる
- [ ] 分析中のスキャンラインが上下に動く
- [ ] パーソナルカラー判定中にカラーホイールが回転する
- [ ] 毛穴スコアが低い場合、キラリのセリフが毛穴カバーに言及する
- [ ] くすみスコアが高い場合、ツヤ肌を推奨する
- [ ] 天気の湿度が70%超の場合、セミマットを推奨する
- [ ] iPhone のノッチ/ダイナミックアイランドとコンテンツが重ならない
- [ ] ARトライオン画面の下部操作パネルがホームバーと干渉しない
