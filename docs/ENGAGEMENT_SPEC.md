# KIREI エンゲージメント設計仕様書

**作成日**: 2026-04-06  
**対象**: Claude Code  
**優先度**: 高（MUSINSA提携デモに向けた基盤）

---

## 概要

本仕様書は以下を一本化したものです：

1. キラリのセリフ設計刷新（パーソナライズ・頻度）
2. 行動ログ設計
3. Supabaseスキーマ設計（外部EC会員ID連携を含む）
4. パーソナルカラー判定の優先実装

---

## 1. キラリのセリフ設計刷新

### 基本方針

- **センテンスは短く**（1〜2文）、**内容はパーソナライズ**する
- 「天気予報的な一言」から「変化を読む友達的な一言」へ
- 頻度を上げても許容されるのは短文だから。バリエーションで飽きを防ぐ

### セリフのトリガー優先順位

```
1. 前回チェックからの経過時間（最優先）
2. スコアの変化量（前回比）
3. 時間帯・曜日
4. 天気（Open-Meteo連動・既存）
5. 起動回数・連続利用日数
```

### 1-1. 前回チェックからの経過時間 × 促しセリフ

```js
// src/data/kirariDialogues.js

export function getCheckPromptLine(hoursSinceLastCheck, totalChecks) {
  // チェック3回未満はタップ操作を毎回案内
  if (totalChecks < 3) {
    return 'タップすると肌チェックできるよ♪';
  }

  if (hoursSinceLastCheck === null) {
    return 'はじめまして！タップして肌チェックしてみてね♪';
  }
  if (hoursSinceLastCheck > 72) return '会いたかったよ〜！チェックしよ♪';
  if (hoursSinceLastCheck > 24) return '久しぶり！肌の様子どう？';
  if (hoursSinceLastCheck > 12) return '今日まだチェックしてないね';
  if (hoursSinceLastCheck > 3)  return 'さっきより変化あるかも♪';
  return null; // チェック直後は促さない
}
```

**表示頻度**:
- 3時間以内: 表示しない
- 3〜12時間: 低（ランダム50%）
- 12〜24時間: 高（ランダム80%）
- 24時間以上: 毎回必ず表示

### 1-2. スコア変化量 × パーソナライズセリフ

```js
export function getScoreDeltaLine(currentScore, prevScore) {
  if (prevScore === null) return '初めての肌チェック完了！これが基準になるよ♪';

  const delta = currentScore - prevScore;

  if (delta >= 10) return '肌の調子、めちゃいいじゃん！何かした？';
  if (delta >= 5)  return '昨日より上がってるよ、いい感じ♪';
  if (delta <= -10) return 'ちょっと下がったね、疲れてる？';
  if (delta <= -5)  return '今日は乾燥気味かも、水飲んだ？';
  return '今日もチェックできたね♪';
}
```

### 1-3. 時間帯・曜日セリフ

```js
export function getTimeBasedLine(hour, dayOfWeek) {
  if (hour < 7)  return '早起きえらい！朝ケアの効果が出やすい時間♪';
  if (hour < 10) return 'おはよう！今日の肌チェックしてみよ♪';
  if (hour >= 23) return '夜更かし？お肌のゴールデンタイムだよ';
  if (hour >= 21) return '夜チェックえらい、明日の肌が楽しみ♪';
  if (dayOfWeek === 1) return '今週もよろしく♪'; // 月曜
  if (dayOfWeek === 5) return '週末前！肌ケアして気持ちよく過ごそ'; // 金曜
  return null;
}
```

### 1-4. セリフのバリエーション管理

同じセリフが連続しないように制御する：

```js
// src/hooks/useKirari.js に追加

const RECENT_LINES_KEY = 'kirari_recent_lines';
const MAX_RECENT = 5;

export function pickLine(candidates) {
  const recent = JSON.parse(localStorage.getItem(RECENT_LINES_KEY) || '[]');
  const filtered = candidates.filter(line => !recent.includes(line));
  const pool = filtered.length > 0 ? filtered : candidates;
  const picked = pool[Math.floor(Math.random() * pool.length)];

  const updated = [picked, ...recent].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_LINES_KEY, JSON.stringify(updated));
  return picked;
}
```

### 1-5. 鏡を開いたときの表示頻度

**現状**: ランダム10回に1回  
**変更後**: 毎回表示

セリフは上記トリガー優先順位で自動選択。バリエーションが確保されているため毎回表示しても飽きにくい。

---

## 2. 行動ログ設計

### 2-1. 記録するイベント一覧

| イベント | タイミング | 保存先 |
|---|---|---|
| `app_open` | 起動時 | localStorage + Supabase |
| `mirror_enter` | ミラー画面表示時 | localStorage + Supabase |
| `mirror_exit` | ミラー画面離脱時（滞在時間を計算） | localStorage + Supabase |
| `check_start` | 肌チェック開始タップ時 | localStorage + Supabase |
| `check_complete` | スコア算出完了時 | localStorage + Supabase |
| `ar_open` | ARトライオン画面表示時 | localStorage + Supabase |
| `ar_part_change` | パーツ/カラー変更時 | localStorage + Supabase |
| `product_tap` | 商品カードタップ時 | localStorage + Supabase |
| `coord_open` | コーデオーバーレイ表示時 | localStorage + Supabase |

### 2-2. ローカルログの構造

```js
// src/utils/logger.js

const SESSION_KEY = 'kirei_session_log';
const LAST_CHECK_KEY = 'kirei_last_check';
const TOTAL_CHECKS_KEY = 'kirei_total_checks';

export function logEvent(eventName, payload = {}) {
  const entry = {
    event: eventName,
    ts: Date.now(),
    ...payload,
  };

  // セッションログに追記
  const log = JSON.parse(localStorage.getItem(SESSION_KEY) || '[]');
  log.push(entry);
  localStorage.setItem(SESSION_KEY, JSON.stringify(log.slice(-200))); // 最新200件

  // チェック完了時は専用キーも更新
  if (eventName === 'check_complete') {
    localStorage.setItem(LAST_CHECK_KEY, String(Date.now()));
    const prev = parseInt(localStorage.getItem(TOTAL_CHECKS_KEY) || '0');
    localStorage.setItem(TOTAL_CHECKS_KEY, String(prev + 1));
  }
}

export function getHoursSinceLastCheck() {
  const last = localStorage.getItem(LAST_CHECK_KEY);
  if (!last) return null;
  return (Date.now() - parseInt(last)) / 3600000;
}

export function getTotalChecks() {
  return parseInt(localStorage.getItem(TOTAL_CHECKS_KEY) || '0');
}
```

### 2-3. ミラー滞在時間の計測

```js
// MirrorScreenV3.jsx に追加

useEffect(() => {
  const enterTime = Date.now();
  logEvent('mirror_enter');

  return () => {
    const duration = Math.round((Date.now() - enterTime) / 1000); // 秒
    logEvent('mirror_exit', { duration_sec: duration });
  };
}, []);
```

---

## 3. Supabaseスキーマ設計

### 3-1. テーブル構成

```sql
-- ユーザーテーブル
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),

  -- 外部EC連携（MUSINSA等）
  musinsa_user_id TEXT UNIQUE,         -- MUSINSA会員ID
  external_ec_id TEXT,                 -- 将来の他EC用汎用カラム
  external_ec_provider TEXT,           -- 'musinsa' | 'zozotown' | etc.

  -- パーソナルカラー（実装後に使用）
  personal_color_type TEXT,            -- 'spring' | 'summer' | 'autumn' | 'winter'
  personal_color_tone TEXT,            -- 'warm' | 'cool'

  -- 同意管理（プライバシーポリシー・データ提供）
  consent_data_sharing BOOLEAN DEFAULT false,
  consent_at TIMESTAMPTZ
);

-- 肌スコア履歴テーブル
CREATE TABLE skin_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  checked_at TIMESTAMPTZ DEFAULT now(),

  -- スコア（0〜100）
  score_moisture INTEGER,
  score_texture INTEGER,
  score_brightness INTEGER,
  score_overall INTEGER,

  -- 環境情報
  weather_temp REAL,
  weather_humidity INTEGER,
  weather_uv REAL,

  -- デバイス情報
  device_hour INTEGER,                 -- 0〜23
  device_day_of_week INTEGER           -- 0=日, 1=月, ..., 6=土
);

-- 行動ログテーブル
CREATE TABLE user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  occurred_at TIMESTAMPTZ DEFAULT now(),
  payload JSONB DEFAULT '{}'
);

-- 商品タップログ（EC連携・レコメンド改善用）
CREATE TABLE product_taps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tapped_at TIMESTAMPTZ DEFAULT now(),
  product_id TEXT NOT NULL,
  product_name TEXT,
  ec_provider TEXT,                    -- 'musinsa' | 'kirei_select' | etc.
  skin_check_id UUID REFERENCES skin_checks(id),  -- タップ時の直近スコアと紐付け
  personal_color_type TEXT             -- タップ時のパーソナルカラー
);
```

### 3-2. MUSINSA連携を想定したID設計

```js
// src/utils/auth.js

// Phase 1: ローカルUUID（Supabase匿名ユーザー）
// Phase 2: MUSINSAのOAuth連携後、musinsa_user_idをuserテーブルに紐付け

export async function linkMusinsaAccount(musinsaUserId) {
  const { error } = await supabase
    .from('users')
    .update({
      musinsa_user_id: musinsaUserId,
      external_ec_provider: 'musinsa',
    })
    .eq('id', getCurrentUserId());

  if (error) throw error;
}
```

---

## 4. パーソナルカラー判定（優先実装）

MUSINSA提携の核心機能。「肌分析→パーソナルカラー→商品フィルタリング」の流れがデモの見せ場になる。

### 4-1. 判定ロジック

```js
// src/utils/personalColor.js

// MediaPipe FaceLandmarkerで取得した肌色から判定
// 参照ランドマーク: 頬（#234, #454）、額（#10）

export function detectPersonalColor(skinRGB) {
  const { r, g, b } = skinRGB;

  // HSLに変換
  const hsl = rgbToHsl(r, g, b);
  const hue = hsl[0];
  const lightness = hsl[2];

  // イエベ/ブルベ判定（簡易版）
  const isWarm = hue >= 15 && hue <= 45; // オレンジ〜黄系

  // 明度でSpring/Autumn（イエベ）、Summer/Winter（ブルベ）を分類
  if (isWarm) {
    return lightness > 0.6 ? 'spring' : 'autumn';
  } else {
    return lightness > 0.6 ? 'summer' : 'winter';
  }
}
```

### 4-2. MUSINSAへのパーソナルカラー送客

```js
// src/utils/musinsa.js

const PERSONAL_COLOR_QUERY = {
  spring:  '퍼스널컬러 봄웜',    // 春ウォーム
  summer:  '퍼스널컬러 여름쿨',   // 夏クール
  autumn:  '퍼스널컬러 가을웜',   // 秋ウォーム
  winter:  '퍼스널컬러 겨울쿨',   // 冬クール
};

export function buildMusinsaSearchUrl(personalColorType, category = '') {
  const query = PERSONAL_COLOR_QUERY[personalColorType];
  const base = 'https://www.musinsa.com/search/musinsa/integration';
  return `${base}?q=${encodeURIComponent(query + ' ' + category)}`;
}
```

---

## 5. 実装順序

```
Step 1: logger.js 作成（行動ログ基盤）
Step 2: useKirari.js にlocalStorageベースのパーソナライズセリフ統合
Step 3: kirariDialogues.js のセリフプール拡充（各トリガー20〜30本）
Step 4: MirrorScreenV3 に mirror_enter/exit ログ追加
Step 5: Supabaseテーブル作成（上記スキーマ）
Step 6: localStorageログのSupabase同期
Step 7: personalColor.js 作成（パーソナルカラー判定）
Step 8: MUSINSA送客URL生成（buildMusinsaSearchUrl）
Step 9: ResultScreen / SuggestScreen にMUSINSA送客CTAを追加
```

---

## 6. コミット単位

```
feat: 行動ログ基盤（logger.js）追加
feat: キラリセリフをパーソナライズ化（経過時間・スコア変化・時間帯）
feat: キラリ表示頻度を毎回に変更、セリフ重複回避ロジック追加
feat: Supabaseスキーマ作成（users / skin_checks / user_events / product_taps）
feat: localStorageログのSupabase同期
feat: パーソナルカラー判定ロジック実装
feat: MUSINSA送客URL生成・CTA追加
```

---

## 8. グローバル展開戦略（MUSINSA提携前提）

### 展開フェーズ

```
Phase 1   韓国（MUSINSA公式アプリとしてリリース）
           └ パーソナルカラー × K-beautyコスメ提案
           └ 韓国語UIを最優先

Phase 2   日本（K-beauty逆輸入の文脈）
           └ 韓国での実績データ・転換率を持って展開

Phase 3   東南アジア・北米
           └ K-beauty需要が高い市場（タイ・ベトナム・米国）
           └ 英語UIで共通対応
```

### 商品リンク先の切り替え

```
現状      Amazon（暫定）
↓
即時対応  「Amazonで見る」「MUSINSAで見る」の2ボタン並列
          → MUSINSA交渉のデモ材料になる
↓
提携後    MUSINSAをメイン導線に切り替え
```

### EC送客リンクの実装方針

```js
// src/utils/ecLinks.js

export function buildProductUrl(product, market = 'kr') {
  if (market === 'kr') {
    // MUSINSA：パーソナルカラー検索クエリで送客
    return buildMusinsaSearchUrl(product.personalColorType, product.category);
  }
  if (market === 'jp') {
    // 日本：提携EC（未定）またはAmazonフォールバック
    return product.amazonUrl;
  }
  // グローバル：英語Amazonフォールバック
  return product.amazonUrlGlobal;
}
```

### i18n対応状況と優先度

| 言語 | 現状 | 対応優先度 |
|---|---|---|
| 日本語（JA） | 実装済み ✅ | 維持 |
| 英語（EN） | 実装済み ✅ | 精度確認 |
| 韓国語（KO） | 実装済み ✅ | **抜け漏れ確認・最優先** |

**Claude Codeへの指示**：
韓国語UIの全文言を洗い出し、抜け漏れ・不自然な表現がないかチェックすること。
特にキラリのセリフ・スコアラベル・CTAボタン文言を重点確認。

### パーソナルカラーの韓国語対応

```js
// src/utils/personalColor.js に追加

export const PERSONAL_COLOR_LABELS = {
  spring:  { ja: 'スプリング', en: 'Spring', ko: '봄 웜톤' },
  summer:  { ja: 'サマー',     en: 'Summer', ko: '여름 쿨톤' },
  autumn:  { ja: 'オータム',   en: 'Autumn', ko: '가을 웜톤' },
  winter:  { ja: 'ウィンター', en: 'Winter', ko: '겨울 쿨톤' },
};
```

### 法規制・プライバシー対応（市場別）

| 市場 | 法規制 | 対応方針 |
|---|---|---|
| 韓国 | 個人情報保護法（PIPA） | 同意フロー・データ保存場所の確認が必要 |
| 日本 | 個人情報保護法 | 既存設計で概ね対応可 |
| EU | GDPR | Phase 3以降、専門家確認必須 |
| 米国 | CCPA等（州別） | Phase 3以降 |

**肌データの外部送信は全市場で明示的同意必須**。`consent_data_sharing`フラグは市場ごとに取得すること。

---

## 7. 注意事項

- **肌データをMUSINSAに送信する場合はユーザー同意必須**。`consent_data_sharing`フラグがtrueのユーザーのみ対象
- **医療・診断表現は禁止**。「チェック」「ケア」に統一
- **ジェンダー表現禁止**。UIにメンズ/レディース等の文言を入れない
- Supabaseのmusinsa_user_idカラムは提携決定前から確保するのみ。実際の連携実装は提携交渉後
