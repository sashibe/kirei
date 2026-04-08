# SUGGEST_AR_REDESIGN_SPEC 追補仕様書
# スキンケア独立導線 ＋ SuggestScreen タブ簡略化

> `SUGGEST_AR_REDESIGN_SPEC.md` と併せて読むこと。
> 本ファイルに記載のある箇所はこちらを優先する。
> `docs/SUGGEST_AR_REDESIGN_SPEC_UPDATE.md` に配置してpushすること。

---

## 変更の背景

スキンケアはメイクより購買動機が明確で定期購買につながりやすい。
男性ユーザーを含めた幅広い層にとっても「肌ケア」の方が「メイク」より入口として自然。

これを踏まえて以下2点を変更する。

1. **MirrorScreenV3**: 分析完了後のボタンをスキンケア優先の2択に変更
2. **SuggestScreen**: `Skin care` タブを廃止し `Base / Color` の2タブに簡略化

---

## 1. MirrorScreenV3.jsx — ボタン構成の変更

### 変更前（現状）

```
[スコア表示切替]
[ミラーに戻る]
[結果を見る →]          ← 1本でSuggestScreenへ
```

### 変更後

```
[スコア表示切替]
[ミラーに戻る]
[✨ 肌ケアを始める →]    ← Primary（大・上・グリーン）→ スキンケアARへ直行
[💄 メイクを試す]        ← Secondary（小・下・パープル）→ SuggestScreenへ
```

#### 実装

```jsx
// 変更前（1ボタン）
<button
  className="btn-primary"
  onClick={() => onResult({ skinScores, personalColor, dentalScores: null })}
  style={{ width: '100%', padding: 12, ... }}
>
  {t('mirror.view_result')}
</button>

// 変更後（2ボタン）
<button
  onClick={() => onResult({ skinScores, personalColor, mode: 'skincare' })}
  style={{
    width: '100%', padding: 14,
    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
    border: 'none', borderRadius: 14,
    fontSize: 14, fontWeight: 700, color: '#fff',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(34,197,94,0.3)',
    marginBottom: 8,
  }}
>
  {'✨'} {t('mirror.start_skincare')}
</button>
<button
  onClick={() => onResult({ skinScores, personalColor, mode: 'makeup' })}
  style={{
    width: '100%', padding: 11,
    background: 'rgba(255,255,255,0.85)',
    border: '1px solid rgba(168,85,247,0.3)',
    borderRadius: 14,
    fontSize: 13, fontWeight: 600,
    color: '#a855f7', cursor: 'pointer',
  }}
>
  {'💄'} {t('mirror.try_makeup')}
</button>
```

---

## 2. App.jsx — mode によるルーティング変更

### handleResult の変更

```js
// 変更前
const handleResult = useCallback(({ skinScores, personalColor }) => {
  scoresRef.current = { skinScores, personalColor };
  setScreen('suggest');
}, []);

// 変更後
const handleResult = useCallback(({ skinScores, personalColor, mode }) => {
  scoresRef.current = { skinScores, personalColor };
  if (mode === 'skincare') {
    setScreen('skincare-ar');   // スキンケアARへ直行
  } else {
    setScreen('suggest');       // メイク提案へ
  }
}, []);
```

### onSkipToResult の削除

SuggestScreen から Skin care タブが廃止されるため不要になる。

```js
// 削除するハンドラー
const handleSkipToResult = useCallback((styleTab) => { ... }, []);

// SuggestScreen への props からも削除
// onSkipToResult={handleSkipToResult}  ← 削除
```

---

## 3. SuggestScreen.jsx — Skin care タブ廃止

### タブ構成変更

```
変更前: [ Color makeup ][ Base makeup ][ Skin care ]
変更後: [ Base makeup  ][ Color makeup ]
```

```js
// 変更前
const rawLooks = styleTab === 0 ? COLOR_LOOKS
              : styleTab === 1 ? BASE_LOOKS
              : null;

// 変更後（タブ0=Base、タブ1=Color）
const rawLooks = styleTab === 0 ? BASE_LOOKS : COLOR_LOOKS;

// localStorage からの復元: 旧インデックス2（Skin care）が残っている場合は0にリセット
const [styleTab, setStyleTab] = useState(() => {
  const saved = localStorage.getItem('kirei_style_tab');
  const n = saved !== null ? Number(saved) : 0;
  return n > 1 ? 0 : n;
});
```

### タブラベル

```js
// 変更前
const tabs = [t('suggest.tab_color'), t('suggest.tab_base'), t('suggest.tab_skincare')];

// 変更後
const tabs = [t('suggest.tab_base'), t('suggest.tab_color')];
```

### SkincareRoutineView を削除

```js
// 削除する import
import SkincareRoutineView from './SkincareRoutineView.jsx';

// 削除する分岐
if (styleTab === 2) { ... }

// 削除する prop
onSkipToResult
```

---

## 4. i18n 追加キー

```js
// ja.js
'mirror.start_skincare': '肌ケアを始める →',
'mirror.try_makeup':     'メイクを試す',

// en.js
'mirror.start_skincare': 'Start skin care →',
'mirror.try_makeup':     'Try makeup',

// ko.js
'mirror.start_skincare': '스킨케어 시작하기 →',
'mirror.try_makeup':     '메이크업 해보기',
```

---

## 5. 変更後のフロー全体像

```
ミラー（肌チェック完了）
  │
  ├─「✨ 肌ケアを始める →」（Primary・グリーン）
  │    └─ SkincareARScreen（2週間後プレビュー）
  │         └─「このルーティンを始める」
  │              └─ SkincareRoutineView（商品リスト＋なぜ2週間？）
  │
  └─「💄 メイクを試す」（Secondary・パープル）
       └─ SuggestScreen（Base / Color 2タブ）
            └─ ヒーローカード or エクスプローラー
                 └─ ArTryOnScreen（Base＋Colorレイヤー同時描画）
                      └─「このメイクで決定」
                           └─ ResultScreen
                                └─「✨ 2週間後の自分を見てみる」
                                     └─ SkincareARScreen（メイク後からも誘導）
```

スキンケアは**2つのエントリーポイント**を持つ。
ミラー直行（メイク不要なユーザー向け）と、メイク後の結果画面（メイクユーザーへのクロスセル）。

---

## 6. SUGGEST_AR_REDESIGN_SPEC からの差分まとめ

| 項目 | 元の仕様 | 本仕様（優先） |
|---|---|---|
| MirrorScreen ボタン | 1本（結果を見る） | 2本（スキンケア優先・グリーン） |
| SuggestScreen タブ数 | 3（Color/Base/Skincare） | 2（Base/Color） |
| タブ順序 | Color→Base→Skincare | Base→Color |
| タブ0のデータ | COLOR_LOOKS | BASE_LOOKS |
| onSkipToResult | あり | 削除 |
| SkincareRoutineView | SuggestScreen内 | MirrorScreen導線のみ |

---

## 7. 検証チェックリスト（追加分）

- [ ] 分析完了後にグリーンの「肌ケアを始める」ボタンが上に表示される
- [ ] 「肌ケアを始める」でSkincareARScreenに直行する（SuggestScreenを経由しない）
- [ ] 「メイクを試す」でSuggestScreenに遷移する
- [ ] SuggestScreenのタブが `Base makeup` / `Color makeup` の2つのみ
- [ ] タブ先頭が `Base makeup`（インデックス0）になっている
- [ ] Skin care タブが存在しない
- [ ] 旧インデックス2がlocalStorageに残っていてもクラッシュしない
- [ ] ResultScreenからもSkincareARScreenへの導線が機能する
