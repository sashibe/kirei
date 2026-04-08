# スキンケアAR画面 実装仕様書
# 「2週間後の自分」＋「なぜ2週間？」解説

> Claude Code はこのファイルを読んで実装する。
> `docs/SKINCARE_AR_SPEC.md` に配置してpushすること。

---

## 概要

### 追加・変更するもの

| ファイル | 種別 | 内容 |
|---|---|---|
| `src/components/SkincareARScreen.jsx` | 新規 | スキンケアAR画面本体 |
| `src/components/ResultScreen.jsx` | 修正 | スキンケアCTAカードを追加 |
| `src/components/SkincareRoutineView.jsx` | 修正 | 「なぜ2週間？」セクション追加 |
| `src/App.jsx` | 修正 | 画面ステート追加 |
| `src/i18n/ja.js` / `en.js` / `ko.js` | 修正 | キー追加 |

---

## 1. スキンケアAR画面（SkincareARScreen.jsx）

### 1-1. 概要

ライブカメラ映像に**CSSフィルター**を適用することで、
スキンケアを続けた後の肌改善を視覚的にプレビューする。
フィルター強度は肌スコアに連動させ、「このアプリが現状の問題点を理解して見せている」説得力を持たせる。

WebGLは使わず、`video`要素の `style.filter` を動的更新する方式。
ハードウェアアクセラレーションが効くため実機でも滑らか。

### 1-2. フィルター設計

```js
// src/components/SkincareARScreen.jsx 内

/**
 * スコアとスライダー値からCSSフィルター文字列を生成する
 *
 * @param {object} skinScores  { dullness: {score}, tone: {score}, pores: {score} }
 * @param {number} t           スライダー値 0.0（今）〜 1.0（2週間後）
 * @returns {string}           CSS filter 文字列
 */
function computeFilter(skinScores, t) {
  const dullness = skinScores?.dullness?.score ?? 70;
  const tone     = skinScores?.tone?.score     ?? 70;
  const pores    = skinScores?.pores?.score    ?? 70;

  // スコアが低いほど補正を強くする（最大補正上限を設定して盛りすぎを防ぐ）
  // dullness: 明度UP + 彩度UP でくすみ感を減らす
  const dullnessGain   = ((100 - dullness) / 100) * 0.22; // max +22% brightness
  const saturationGain = ((100 - dullness) / 100) * 0.18; // max +18% saturate
  // tone: コントラスト微調整で色ムラを均一化
  const contrastGain   = ((100 - tone) / 100)     * 0.12; // max +12% contrast
  // pores: 明るさを少し上げて毛穴の影を飛ばす（blur は使わない＝輪郭が崩れるため）
  const poresGain      = ((100 - pores) / 100)    * 0.08; // max +8% brightness

  const brightness = 1 + (dullnessGain + poresGain) * t;
  const contrast   = 1 + contrastGain * t;
  const saturate   = 1 + saturationGain * t;

  return `brightness(${brightness.toFixed(3)}) contrast(${contrast.toFixed(3)}) saturate(${saturate.toFixed(3)})`;
}
```

### 1-3. UI 構成

```
┌─────────────────────────────┐
│ < 結果に戻る                  │  ← 戻るボタン
├─────────────────────────────┤
│                             │
│   [ライブカメラ映像]           │  ← video要素にCSSフィルター適用
│   (2週間後フィルター)          │
│                             │
│   ┌─────────────────────┐   │
│   │ 今 ●───────── 2週間後 │   │  ← スライダー（左=フィルターなし、右=フル適用）
│   └─────────────────────┘   │
│                             │
├─────────────────────────────┤
│  [キラリ + 吹き出し]          │
│                             │
│  ┌─────────────────────────┐│
│  │ [？] なぜ2週間後なの？    ││  ← ② タップで展開
│  │ ▼（展開時）              ││
│  │  ターンオーバー解説...    ││
│  └─────────────────────────┘│
├─────────────────────────────┤
│  [このルーティンを始める →]    │  ← CTA
└─────────────────────────────┘
```

### 1-4. JSX 実装

```jsx
// src/components/SkincareARScreen.jsx

import { useState, useRef, useEffect, useCallback } from 'react';
import Kirari from './Kirari.jsx';
import Bubble from './Bubble.jsx';
import useCamera from '../hooks/useCamera.js';
import { useT } from '../i18n/index.jsx';

function computeFilter(skinScores, t) {
  // 上記 1-2 の実装
}

export default function SkincareARScreen({ skinScores, onNext, onBack }) {
  const { t } = useT();
  const [sliderValue, setSliderValue] = useState(100); // 0=今, 100=2週間後
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false); // 「なぜ2週間？」展開状態
  const { videoRef, isActive, error: cameraError } = useCamera({ enabled: true });

  // video の loadeddata 検知（ArTryOnScreen と同パターン）
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlaying = () => setVideoPlaying(true);
    if (video.readyState >= 2) { onPlaying(); return; }
    video.addEventListener('loadeddata', onPlaying);
    return () => video.removeEventListener('loadeddata', onPlaying);
  }, [isActive, videoRef]);

  const cameraLive = isActive && !cameraError && videoPlaying;

  // スライダーに応じてCSSフィルターをリアルタイム更新
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const t_val = sliderValue / 100;
    video.style.filter = computeFilter(skinScores, t_val);
    video.style.transition = 'filter 0.15s ease';
  }, [sliderValue, skinScores, videoRef]);

  // 「今」ラベルと「2週間後」ラベルの表示テキスト
  const sliderLabel = sliderValue === 0
    ? t('skincare_ar.label_now')
    : sliderValue === 100
      ? t('skincare_ar.label_future')
      : `${sliderValue}%`;

  return (
    <div style={{ paddingBottom: 24 }}>

      {/* 戻るボタン */}
      <button onClick={onBack} style={{
        background: 'none', border: 'none', fontSize: 13,
        color: '#94a3b8', cursor: 'pointer',
        padding: '8px 16px', fontWeight: 600,
      }}>
        {'<'} {t('skincare_ar.back')}
      </button>

      {/* カメラ映像 */}
      <div style={{
        position: 'relative', margin: '0 16px 12px',
        borderRadius: 20, overflow: 'hidden',
        background: '#111',
        aspectRatio: cameraLive ? 'auto' : '3/4',
        maxHeight: '52vh',
      }}>
        <video
          ref={videoRef}
          style={{
            width: '100%', height: '100%',
            objectFit: 'contain',
            transform: 'scaleX(-1)',
            display: cameraLive ? 'block' : 'none',
          }}
          playsInline muted autoPlay
        />

        {/* 左上: 状態ラベル */}
        <div style={{
          position: 'absolute', top: 12, left: 12,
          background: sliderValue >= 50
            ? 'linear-gradient(135deg, rgba(168,85,247,0.85), rgba(236,72,153,0.85))'
            : 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(8px)',
          borderRadius: 12, padding: '5px 12px',
          transition: 'background 0.3s ease',
        }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#fff', margin: 0 }}>
            {sliderLabel}
          </p>
        </div>
      </div>

      {/* スライダー: 今 ←→ 2週間後 */}
      <div style={{ padding: '0 16px 12px' }}>
        <div style={{
          background: '#fff', borderRadius: 16, padding: '12px 14px',
          boxShadow: '0 2px 8px rgba(139,92,246,0.06)',
          border: '1px solid #ede9fe',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 8,
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
              {t('skincare_ar.label_now')}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#a855f7' }}>
              {t('skincare_ar.label_future')}
            </span>
          </div>
          <input
            type="range" min="0" max="100" step="1"
            value={sliderValue}
            onChange={e => setSliderValue(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#a855f7' }}
          />
        </div>
      </div>

      {/* キラリ + 吹き出し */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 8,
        padding: '0 16px 10px',
      }}>
        <Kirari size={36} expression="sparkle" />
        <Bubble>
          <p style={{ fontSize: 12, color: '#334155', margin: 0, lineHeight: 1.6 }}>
            {sliderValue >= 80
              ? t('skincare_ar.kirari_future')
              : sliderValue >= 40
                ? t('skincare_ar.kirari_mid')
                : t('skincare_ar.kirari_now')}
          </p>
        </Bubble>
      </div>

      {/* ② なぜ2週間？ アコーディオン */}
      <div style={{ padding: '0 16px 14px' }}>
        <div style={{
          background: '#faf5ff', borderRadius: 14,
          border: '1px solid #e9d5ff', overflow: 'hidden',
        }}>
          <button
            onClick={() => setWhyOpen(v => !v)}
            style={{
              width: '100%', padding: '12px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'none', border: 'none', cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                width: 18, height: 18, borderRadius: '50%',
                background: '#a855f7', color: '#fff',
                fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>?</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#7c3aed' }}>
                {t('skincare_ar.why_title')}
              </span>
            </div>
            <span style={{
              fontSize: 11, color: '#a78bfa',
              transform: whyOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
            }}>▼</span>
          </button>

          {whyOpen && (
            <div style={{ padding: '0 16px 14px' }}>
              <TurnoverExplanation t={t} skinScores={skinScores} />
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '0 16px' }}>
        <button onClick={onNext} style={{
          width: '100%', padding: 14,
          background: 'linear-gradient(135deg, #a855f7, #ec4899)',
          border: 'none', borderRadius: 14,
          fontSize: 14, fontWeight: 700, color: '#fff',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(168,85,247,0.25)',
        }}>
          {t('skincare_ar.cta')}
        </button>
      </div>

    </div>
  );
}
```

### 1-5. TurnoverExplanation コンポーネント（② の内容）

```jsx
// SkincareARScreen.jsx 内に定義

function TurnoverExplanation({ t, skinScores }) {
  const dullness = skinScores?.dullness?.score ?? 70;

  return (
    <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.8 }}>

      {/* ターンオーバー基礎説明 */}
      <p style={{ margin: '0 0 10px' }}>
        {t('skincare_ar.why_p1')}
        {/* 「肌は約28日周期で新しい細胞に生まれ変わる「ターンオーバー」を繰り返しています。」 */}
      </p>

      {/* 図: 28日サイクル（シンプルなSVG） */}
      <TurnoverDiagram t={t} />

      <p style={{ margin: '10px 0 10px' }}>
        {t('skincare_ar.why_p2')}
        {/* 「ケアを始めて約2週間（半サイクル）経つと、新しく生まれた細胞が肌の表面に出てき始め、くすみや毛穴の目立ちにくさが変わりはじめます。」 */}
      </p>

      {/* スコア連動のパーソナライズメッセージ */}
      {dullness < 60 && (
        <div style={{
          background: 'rgba(168,85,247,0.08)',
          borderRadius: 10, padding: '8px 12px',
          border: '1px solid rgba(168,85,247,0.15)',
          marginTop: 4,
        }}>
          <p style={{ fontSize: 11, color: '#7c3aed', margin: 0, lineHeight: 1.6 }}>
            {t('skincare_ar.why_personal_dullness', { score: String(dullness) })}
            {/* 「あなたのくすみスコアは{score}点。集中ケアで2週間後に差が出やすいポイントです。」 */}
          </p>
        </div>
      )}
    </div>
  );
}

function TurnoverDiagram({ t }) {
  return (
    <svg viewBox="0 0 280 70" style={{ width: '100%', height: 'auto', margin: '4px 0' }}>
      {/* 28日ライン */}
      <line x1="20" y1="35" x2="260" y2="35" stroke="#e2e8f0" strokeWidth="2"/>

      {/* 0日 */}
      <circle cx="20" cy="35" r="5" fill="#a855f7"/>
      <text x="20" y="55" textAnchor="middle" fontSize="9" fill="#64748b">0{t('skincare_ar.day')}</text>

      {/* 14日（2週間） */}
      <circle cx="140" cy="35" r="6" fill="#ec4899"/>
      <line x1="140" y1="12" x2="140" y2="29" stroke="#ec4899" strokeWidth="1.5" strokeDasharray="3,2"/>
      <text x="140" y="10" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#ec4899">
        {t('skincare_ar.two_weeks')}
      </text>
      <text x="140" y="55" textAnchor="middle" fontSize="9" fill="#64748b">14{t('skincare_ar.day')}</text>

      {/* 28日 */}
      <circle cx="260" cy="35" r="5" fill="#a855f7"/>
      <text x="260" y="55" textAnchor="middle" fontSize="9" fill="#64748b">28{t('skincare_ar.day')}</text>

      {/* ラベル */}
      <text x="140" y="68" textAnchor="middle" fontSize="8" fill="#94a3b8">
        {t('skincare_ar.turnover_label')}
      </text>
    </svg>
  );
}
```

---

## 2. ResultScreen.jsx — スキンケアCTAカードを追加

`===== 3. Coord hint + CTA =====` の直後（セクション3.5として）に追加する。

```jsx
{/* ===== 3.5. スキンケアAR CTA ===== */}
{skinScores && (
  <div style={{ margin: '0 16px 12px', padding: '14px 16px',
    background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
    borderRadius: 18, border: '1px solid #bbf7d0',
  }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
      <Kirari size={28} expression="sparkle" />
      <div>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#15803d', margin: '0 0 3px' }}>
          {t('result.skincare_cta_title')}
          {/* 「ケアを続けた2週間後の肌を見てみよう」 */}
        </p>
        <p style={{ fontSize: 11, color: '#166534', margin: 0, lineHeight: 1.5 }}>
          {t('result.skincare_cta_desc')}
          {/* 「あなたのくすみ・毛穴スコアをもとにシミュレーションするよ♪」 */}
        </p>
      </div>
    </div>
    <button onClick={onSkincareAR} style={{
      width: '100%', padding: 12,
      background: 'linear-gradient(135deg, #22c55e, #16a34a)',
      border: 'none', borderRadius: 12,
      fontSize: 13, fontWeight: 700, color: '#fff',
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(34,197,94,0.3)',
    }}>
      {'✨'} {t('result.skincare_cta_btn')}
      {/* 「2週間後の自分を見てみる →」 */}
    </button>
  </div>
)}
```

`onSkincareAR` は props として受け取る:

```js
// 変更前
export default function ResultScreen({ skinScores, personalColor, onRestart, ... })

// 変更後
export default function ResultScreen({ skinScores, personalColor, onRestart, onSkincareAR, ... })
```

---

## 3. SkincareRoutineView.jsx — 「なぜ2週間？」セクション追加（③）

CTA ボタンの直前（合計金額の後）に追加する。

```jsx
{/* ③ なぜ2週間？ セクション */}
<WhyTwoWeeksSection skinScores={skinScores} t={t} />

{/* CTA（既存） */}
<button onClick={onNext} ...>
  {t('skincare.view_result')}
</button>
```

```jsx
// SkincareRoutineView.jsx 内に追加

function WhyTwoWeeksSection({ skinScores, t }) {
  const [open, setOpen] = useState(false);
  const dullness = skinScores?.dullness?.score ?? 70;
  const pores    = skinScores?.pores?.score    ?? 70;

  return (
    <div style={{
      marginBottom: 14,
      background: '#faf5ff', borderRadius: 14,
      border: '1px solid #e9d5ff', overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 18, height: 18, borderRadius: '50%',
            background: '#a855f7', color: '#fff',
            fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>?</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#7c3aed' }}>
            {t('skincare_ar.why_title')}
          </span>
        </div>
        <span style={{
          fontSize: 11, color: '#a78bfa',
          transform: open ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.2s',
        }}>▼</span>
      </button>

      {open && (
        <div style={{ padding: '0 16px 14px', fontSize: 12, color: '#475569', lineHeight: 1.8 }}>
          <p style={{ margin: '0 0 10px' }}>{t('skincare_ar.why_p1')}</p>
          <p style={{ margin: '0 0 10px' }}>{t('skincare_ar.why_p2')}</p>

          {/* スコア連動メッセージ: 商品購入の背中押しとして機能させる */}
          <div style={{
            background: 'rgba(168,85,247,0.06)',
            borderRadius: 10, padding: '10px 12px',
            border: '1px solid rgba(168,85,247,0.12)',
          }}>
            {dullness < 65 && (
              <p style={{ fontSize: 11, color: '#7c3aed', margin: '0 0 4px', lineHeight: 1.6 }}>
                {t('skincare_ar.why_personal_dullness', { score: String(dullness) })}
              </p>
            )}
            {pores < 65 && (
              <p style={{ fontSize: 11, color: '#7c3aed', margin: '0 0 4px', lineHeight: 1.6 }}>
                {t('skincare_ar.why_personal_pores', { score: String(pores) })}
              </p>
            )}
            <p style={{ fontSize: 11, color: '#7c3aed', margin: 0, lineHeight: 1.6 }}>
              {t('skincare_ar.why_encouragement')}
              {/* 「上のルーティンを2週間続けることで、肌の変化を実感しやすくなりますよ♪」 */}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
```

`skinScores` を props として受け取るよう変更:

```js
// 変更前
export default function SkincareRoutineView({ onNext })

// 変更後
export default function SkincareRoutineView({ onNext, skinScores })
```

---

## 4. App.jsx — 画面ステート追加

### 4-1. screen ステート追加

```js
// コメント更新
// screen: 'mirror' | 'suggest' | 'ar' | 'result' | 'skincare-ar' | 'guide'
```

### 4-2. ハンドラー追加

```js
const handleOpenSkincareAR = useCallback(() => {
  setScreen('skincare-ar');
}, []);

const handleSkincareARNext = useCallback(() => {
  // SkincareARScreen の「このルーティンを始める」→ スキンケア商品画面へ
  // SkincareRoutineView をオーバーレイで表示するため、
  // 'skincare-ar' 画面内の showRoutine state で制御する（App遷移不要）
  setScreen('skincare-routine');
}, []);
```

### 4-3. showScrollable に追加

```js
// 変更前
const showScrollable = screen === 'suggest' || screen === 'result' || screen === 'ar';

// 変更後
const showScrollable = screen === 'suggest' || screen === 'result'
                    || screen === 'ar' || screen === 'skincare-ar'
                    || screen === 'skincare-routine';
```

### 4-4. 画面レンダリング追加

```jsx
{screen === 'skincare-ar' && (
  <SkincareARScreen
    skinScores={scoresRef.current.skinScores}
    onNext={() => setScreen('skincare-routine')}
    onBack={() => setScreen('result')}
  />
)}

{screen === 'skincare-routine' && (
  <div style={{ padding: '12px 0' }}>
    <button onClick={() => setScreen('skincare-ar')} style={{
      background: 'none', border: 'none', fontSize: 13,
      color: '#94a3b8', cursor: 'pointer',
      padding: '0 16px 8px', fontWeight: 600,
    }}>
      {'<'} {t('skincare_ar.back_to_ar')}
    </button>
    <SkincareRoutineView
      skinScores={scoresRef.current.skinScores}
      onNext={() => setScreen('result')}
    />
  </div>
)}
```

### 4-5. ResultScreen に onSkincareAR を追加

```jsx
{screen === 'result' && (
  <ResultScreen
    skinScores={scoresRef.current.skinScores}
    personalColor={scoresRef.current.personalColor}
    onRestart={handleRestart}
    onSkincareAR={handleOpenSkincareAR}   // ← 追加
    styleTab={lookRef.current.styleTab}
    selectedLook={lookRef.current.selectedLook}
    capturedImage={captureRef.current.capturedImage}
    products={captureRef.current.finalProducts}
  />
)}
```

---

## 5. i18n キー

### ja.js に追加

```js
// SkincareARScreen
'skincare_ar.back':              '結果に戻る',
'skincare_ar.back_to_ar':        '2週間後プレビューに戻る',
'skincare_ar.label_now':         '今',
'skincare_ar.label_future':      '2週間後',
'skincare_ar.kirari_now':        '今の肌の状態だよ♪ スライダーを動かして2週間後を見てみて！',
'skincare_ar.kirari_mid':        'ちょっと変わってきたでしょ♪ もう少しスライダーを動かしてみて！',
'skincare_ar.kirari_future':     'これは2週間ケアを続けた後のあなたの肌♪ 今日から始めよう！',
'skincare_ar.why_title':         'なぜ2週間後なの？',
'skincare_ar.why_p1':            '肌は約28日周期で新しい細胞に生まれ変わる「ターンオーバー」を繰り返しています。',
'skincare_ar.why_p2':            'ケアを始めて約2週間（半サイクル）経つと、新しく生まれた細胞が肌の表面に出てき始め、くすみや毛穴の目立ちにくさが変わりはじめます。',
'skincare_ar.why_personal_dullness': 'あなたのくすみスコアは{score}点。集中ケアで2週間後に差が出やすいポイントです。',
'skincare_ar.why_personal_pores':    'あなたの毛穴スコアは{score}点。保湿ケアを続けると毛穴が引き締まってきますよ。',
'skincare_ar.why_encouragement': '上のルーティンを2週間続けることで、肌の変化を実感しやすくなりますよ♪',
'skincare_ar.cta':               'このルーティンを始める →',
'skincare_ar.day':               '日',
'skincare_ar.two_weeks':         '2週間後',
'skincare_ar.turnover_label':    '肌のターンオーバー（約28日）',

// ResultScreen
'result.skincare_cta_title':     'ケアを続けた2週間後の肌を見てみよう',
'result.skincare_cta_desc':      'あなたのくすみ・毛穴スコアをもとにシミュレーションするよ♪',
'result.skincare_cta_btn':       '2週間後の自分を見てみる →',
```

en.js / ko.js にも同様に追加すること（内容は意味が同等であれば訳は自由）。

---

## 6. 実装順序

1. `src/components/SkincareARScreen.jsx` を新規作成
2. `src/components/SkincareRoutineView.jsx` に `skinScores` props と `WhyTwoWeeksSection` を追加
3. `src/components/ResultScreen.jsx` にスキンケアCTAカードと `onSkincareAR` props を追加
4. `src/App.jsx` にステート・ハンドラー・レンダリングを追加
5. `src/i18n/ja.js` / `en.js` / `ko.js` にキーを追加
6. デプロイ・動作確認

### コミット単位

```
feat: SkincareARScreen — 2週間後フィルター＋「なぜ2週間？」アコーディオン
feat: SkincareRoutineView — skinScores props追加＋「なぜ2週間？」セクション(③)
feat: ResultScreen — スキンケアAR誘導CTAカード追加
feat: App — skincare-ar / skincare-routine 画面ステート追加
feat: i18n — スキンケアAR関連キー追加（JA/EN/KO）
```

---

## 7. 検証チェックリスト

- [ ] ResultScreenにグリーンのスキンケアCTAカードが表示される
- [ ] CTA「2週間後の自分を見てみる」タップでSkincareARScreenに遷移する
- [ ] SkincareARScreenでカメラが起動し、映像が表示される
- [ ] スライダーを右に動かすとリアルタイムでフィルターが強くなる
- [ ] スライダー最左（0）でフィルターが完全にオフになる
- [ ] くすみスコアが低いほどフィルターの明度変化が大きい（スコア連動）
- [ ] キラリのセリフがスライダー位置に応じて3段階で変わる
- [ ] 「なぜ2週間後なの？」をタップするとアコーディオンが展開・収納される
- [ ] SVGターンオーバー図が表示される（14日の位置にピンクのマーカー）
- [ ] くすみスコア65未満のとき個人向けメッセージが表示される
- [ ] 「このルーティンを始める」でSkincareRoutineViewに遷移する
- [ ] SkincareRoutineViewに「なぜ2週間？」セクションが表示される（③）
- [ ] SkincareRoutineViewの「なぜ2週間？」にもスコア連動メッセージが出る
- [ ] 「戻る」でResultScreen → SkincareARScreen → SkincareRoutineViewの戻り動線が機能する
- [ ] JA / EN / KO すべての言語で表示が崩れない
- [ ] `skinScores === null` のときResultScreenのCTAが表示されない（条件分岐）
