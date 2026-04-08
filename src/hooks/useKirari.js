import { useState, useEffect, useCallback, useRef } from 'react';
import { getHoursSinceLastCheck, getTotalChecks } from '../utils/logger.js';
import {
  getCheckPromptLine,
  shouldShowCheckPrompt,
  getTimeBasedLine,
  pickLine,
} from '../data/kirariDialogues.js';
import { WEATHER_TEXT, WEATHER_EMOJI } from './useWeather.js';

// --- セリフパターン定義（翻訳キー） ---

const HINT_IDLE_KEY = 'kirari.hint_idle';
const HINT_LONG_PRESS_KEY = 'kirari.hint_long_press';

const STREAK_KEYS = {
  3: 'kirari.streak_3',
  7: 'kirari.streak_7',
  30: 'kirari.streak_30',
};

const RANDOM_KEYS = [
  'kirari.random_morning',
  'kirari.random_condition',
  'kirari.random_change',
  'kirari.random_lip',
  'kirari.random_dull',
];

// 天気予報セリフを動的生成（日付・地名・時間帯を考慮）
function buildWeatherForecast(weather, lang = 'ja') {
  if (!weather) return null;
  const w = weather;
  const texts = WEATHER_TEXT[lang] || WEATHER_TEXT.ja;
  const loc = w.locationName || '';
  const hour = new Date().getHours();
  const isMorning = hour >= 5 && hour < 12;
  const isAfternoon = hour >= 12 && hour < 18;
  const isEvening = hour >= 18 || hour < 5;

  // 日付文字列
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const fmtDate = (d, l) => {
    const m = d.getMonth() + 1, day = d.getDate();
    if (l === 'ja') return `${m}/${day}`;
    if (l === 'ko') return `${m}/${day}`;
    return `${d.toLocaleDateString('en', { month: 'short', day: 'numeric' })}`;
  };
  const todayStr = fmtDate(today, lang);
  const tmrStr = fmtDate(tomorrow, lang);

  const lines = [];
  const L = (ja, ko, en) => lines.push(lang === 'ko' ? ko : lang === 'en' ? en : ja);

  // --- 今日の天気（常時） ---
  const cText = texts[w.weatherCode] || '';
  const cEmoji = WEATHER_EMOJI[w.weatherCode] || '🌤️';
  if (cText && loc) {
    L(`${todayStr} ${loc}の天気は${cEmoji}${cText}だよ♪`,
      `${todayStr} ${loc} 날씨는 ${cEmoji}${cText}♪`,
      `${todayStr} ${loc}: ${cEmoji} ${cText}♪`);
  }

  // --- 朝: 今日の最高気温 + コーデ提案 ---
  if (isMorning && w.todayMax != null) {
    if (w.todayMax >= 30)
      L(`今日(${todayStr})${loc}の最高気温は${w.todayMax}°C🌡️ 暑くなるよ！水分補給を忘れずに`,
        `오늘(${todayStr}) ${loc} 최고기온 ${w.todayMax}°C🌡️ 더워질 거야! 수분 보충 잊지 마세요`,
        `${todayStr} ${loc} high: ${w.todayMax}°C🌡️ It'll be hot! Stay hydrated`);
    else if (w.todayMax <= 15)
      L(`今日(${todayStr})${loc}の最高気温は${w.todayMax}°C🧥 暖かくしてお出かけしてね♪`,
        `오늘(${todayStr}) ${loc} 최고기온 ${w.todayMax}°C🧥 따뜻하게 입고 나가세요♪`,
        `${todayStr} ${loc} high: ${w.todayMax}°C🧥 Dress warmly!`);
  }

  // --- 朝: 最低気温 + 寒暖差 ---
  if (isMorning && w.todayMin != null && w.todayMin <= 10)
    L(`今朝の${loc}は${w.todayMin}°C❄️ 冷え込むから暖かくしてね！`,
      `오늘 아침 ${loc} ${w.todayMin}°C❄️ 추우니 따뜻하게!`,
      `This morning in ${loc}: ${w.todayMin}°C❄️ Bundle up!`);

  if (isMorning && w.todayMax != null && w.todayMin != null && (w.todayMax - w.todayMin) >= 12)
    L(`${loc}は${w.todayMin}°C→${w.todayMax}°C 寒暖差が大きい日☀️ 薄手の羽織り物があるといいかも♪`,
      `${loc} ${w.todayMin}°C→${w.todayMax}°C 기온차가 큰 날☀️ 가벼운 겉옷 챙기세요♪`,
      `${loc}: ${w.todayMin}°C→${w.todayMax}°C Big temp swing☀️ Bring a light layer♪`);

  // --- 午前〜午後: 降水確率 ---
  if ((isMorning || isAfternoon) && w.afternoonRainMax != null && w.afternoonRainMax >= 40)
    L(`${loc}の午後の降水確率は${w.afternoonRainMax}%☂️ お出かけの際は傘を忘れずに！`,
      `${loc} 오후 강수 확률 ${w.afternoonRainMax}%☂️ 외출 시 우산 잊지 마세요!`,
      `${loc} afternoon rain: ${w.afternoonRainMax}%☂️ Don't forget your umbrella!`);

  // --- 日中: UV指数 ---
  if (!isEvening && w.todayUvMax != null && w.todayUvMax >= 6)
    L(`今日(${todayStr})${loc}のUV指数は${Math.round(w.todayUvMax)}☀️ 日焼け対策は万全に！`,
      `오늘(${todayStr}) ${loc} UV지수 ${Math.round(w.todayUvMax)}☀️ 자외선 차단 철저히!`,
      `${todayStr} ${loc} UV: ${Math.round(w.todayUvMax)}☀️ Sun protection is a must!`);

  // --- 夕方〜夜: 明日の天気予報 ---
  if (isEvening && w.tomorrowCode != null) {
    const tmrText = texts[w.tomorrowCode] || '';
    const tmrEmoji = WEATHER_EMOJI[w.tomorrowCode] || '🌤️';
    if (tmrText)
      L(`明日(${tmrStr})${loc}は${tmrEmoji}${tmrText}の予報♪`,
        `내일(${tmrStr}) ${loc}은 ${tmrEmoji}${tmrText} 예보♪`,
        `Tomorrow(${tmrStr}) ${loc}: ${tmrEmoji} ${tmrText}♪`);
  }

  // --- 夕方〜夜: 明日の気温（当日ではなく翌日） ---
  if (isEvening && w.tomorrowMax != null)
    L(`明日(${tmrStr})${loc}の最高気温は${w.tomorrowMax}°C の予報♪`,
      `내일(${tmrStr}) ${loc} 최고기온 ${w.tomorrowMax}°C 예보♪`,
      `Tomorrow(${tmrStr}) ${loc} high: ${w.tomorrowMax}°C♪`);

  // --- 常時: 現在気温（軽い情報） ---
  if (loc)
    L(`今の${loc}の気温は${w.temp}°C${cEmoji}`,
      `지금 ${loc} 기온은 ${w.temp}°C${cEmoji}`,
      `Current temp in ${loc}: ${w.temp}°C${cEmoji}`);

  return lines.length > 0 ? lines[Math.floor(Math.random() * lines.length)] : null;
}

// 天気連動 → 翻訳キー
function getWeatherKey(weather) {
  if (!weather) return null;
  const { temp, humidity, uvIndex, rainProb } = weather;
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5 && rainProb < 50) return 'kirari.weather_pollen';
  if (humidity > 70) return 'kirari.weather_humid';
  if (humidity < 40) return 'kirari.weather_dry';
  if (uvIndex >= 6) return 'kirari.weather_uv';
  if (temp <= 10) return 'kirari.weather_cold';
  if (temp >= 30) return 'kirari.weather_hot';
  if (rainProb >= 70) return 'kirari.weather_rain';
  return null;
}

// 連続起動日数の取得・更新
function getAndUpdateStreak() {
  const today = new Date().toISOString().slice(0, 10);
  const lastDate = localStorage.getItem('kirei_last_date');
  const streak = parseInt(localStorage.getItem('kirei_streak') || '0', 10);

  if (lastDate === today) return streak;

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const newStreak = lastDate === yesterday ? streak + 1 : 1;
  localStorage.setItem('kirei_last_date', today);
  localStorage.setItem('kirei_streak', String(newStreak));
  return newStreak;
}

/**
 * 優先順位でセリフキーを選出
 * 1. 連続日数（3/7/30日）
 * 2. 前回チェックからの経過時間（促しセリフ）
 * 3. 時間帯・曜日
 * 4. 天気
 * 5. ランダムプール
 */
function selectFirstLineKey(streak, weatherKey) {
  // 1. 連続日数
  if (streak === 3 || streak === 7 || streak === 30) {
    return STREAK_KEYS[streak];
  }

  // 2. 前回チェックからの経過時間
  const hours = getHoursSinceLastCheck();
  const totalChecks = getTotalChecks();
  if (shouldShowCheckPrompt(hours)) {
    const promptKey = getCheckPromptLine(hours, totalChecks);
    if (promptKey) return promptKey;
  }

  // 3. 時間帯・曜日
  const now = new Date();
  const timeKey = getTimeBasedLine(now.getHours(), now.getDay());
  if (timeKey) return timeKey;

  // 4. 天気
  if (weatherKey) return weatherKey;

  // 5. フォールバック
  return HINT_IDLE_KEY;
}

// セリフプールを構築（リピート用）
function buildPool(weatherKey) {
  const pool = [...RANDOM_KEYS];
  if (weatherKey) pool.push(weatherKey);

  // 時間帯キーもプールに追加
  const now = new Date();
  const timeKey = getTimeBasedLine(now.getHours(), now.getDay());
  if (timeKey) pool.push(timeKey);

  // 経過時間系の促しも含める
  const hours = getHoursSinceLastCheck();
  const totalChecks = getTotalChecks();
  const promptKey = getCheckPromptLine(hours, totalChecks);
  if (promptKey) pool.push(promptKey);

  return pool;
}

// 適応型インターバル: 経過時間に応じて間隔を広げる
const DISPLAY_DURATION = 5000; // 表示時間 5秒（長文セリフに対応）
function getInterval(elapsedMs) {
  if (elapsedMs < 30000) return 8000;    // 0〜30秒: 8秒間隔
  if (elapsedMs < 120000) return 12000;  // 30秒〜2分: 12秒間隔
  return 20000;                          // 2分以降: 20秒間隔
}

/**
 * useKirari - キラリの適応型リピート出現を管理するフック
 *
 * v2: パーソナライズセリフ対応
 * - 毎回表示（10回に1回 → 毎回）
 * - 優先順位: 経過時間 > スコア変化 > 時間帯 > 天気 > 連続日数 > ランダム
 * - pickLine()で重複回避
 *
 * @param {Object} options
 * @param {Object|null} options.weather - 天気データ
 * @param {boolean} options.isChecking - 肌チェック中かどうか
 * @param {Function} options.t - 翻訳関数
 * @returns {{ message: string|null, visible: boolean, dismiss: () => void }}
 */
export default function useKirari({ weather = null, isChecking = false, t = (k) => k, lang = 'ja' } = {}) {
  const [message, setMessage] = useState(null);
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef(null);
  const repeatTimerRef = useRef(null);
  const lastKeyRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  const show = useCallback((text, duration = DISPLAY_DURATION) => {
    setMessage(text);
    setVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setVisible(false), duration);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  }, []);

  // チェック中はキラリを非表示にする
  useEffect(() => {
    if (isChecking) dismiss();
  }, [isChecking, dismiss]);

  // 適応型リピートループ
  useEffect(() => {
    if (isChecking) return;

    const streak = getAndUpdateStreak();
    const weatherKey = getWeatherKey(weather);
    const pool = buildPool(weatherKey);
    startTimeRef.current = Date.now();

    // 初回セリフを優先順位で選出
    const firstKey = selectFirstLineKey(streak, weatherKey);

    // 天気予報セリフ（動的生成）
    const forecastText = buildWeatherForecast(weather, lang);

    // 初回は3秒後に表示（毎回表示）
    const firstTimer = setTimeout(() => {
      // 天気データがあれば天気予報セリフを優先
      if (forecastText) {
        show(forecastText);
      } else {
        show(t(firstKey));
      }
      lastKeyRef.current = firstKey;
      scheduleNext();
    }, 3000);

    function scheduleNext() {
      const elapsed = Date.now() - startTimeRef.current;
      const interval = getInterval(elapsed);

      repeatTimerRef.current = setTimeout(() => {
        const roll = Math.random();
        // 20%: タップ促進メッセージ
        if (roll < 0.2) {
          const tapMsg = lang === 'ko' ? '\uD83D\uDC46 \uD654\uBA74\uC744 \uD0ED\uD558\uBA74 \uBA54\uC774\uD06C\uC5C5\uACFC \uC2A4\uD0A8\uCF00\uC5B4\uB97C \uCCB4\uD5D8\uD560 \uC218 \uC788\uC5B4\u266A'
            : lang === 'en' ? '\uD83D\uDC46 Tap the screen to try makeup & skincare\u266A'
            : '\uD83D\uDC46 \u753B\u9762\u30BF\u30C3\u30D7\u3067\u30E1\u30A4\u30AF\u3068\u30B9\u30AD\u30F3\u30B1\u30A2\u3092\u8A66\u305B\u308B\u3088\uFF01';
          show(tapMsg);
          lastKeyRef.current = '__tap__';
        }
        // 25%: 天気予報セリフ
        else if (roll < 0.45) {
          const newForecast = buildWeatherForecast(weather, lang);
          if (newForecast) {
            show(newForecast);
            lastKeyRef.current = '__forecast__';
          } else {
            const key = pickLine(pool.filter(k => k !== lastKeyRef.current));
            show(t(key));
            lastKeyRef.current = key;
          }
        }
        // 55%: 通常セリフ
        else {
          const key = pickLine(pool.filter(k => k !== lastKeyRef.current));
          show(t(key));
          lastKeyRef.current = key;
        }
        scheduleNext();
      }, interval);
    }

    return () => {
      clearTimeout(firstTimer);
      if (repeatTimerRef.current) clearTimeout(repeatTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [weather, isChecking, show, t]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (repeatTimerRef.current) clearTimeout(repeatTimerRef.current);
    };
  }, []);

  return { message, visible, dismiss };
}

// AR操作ガイドセリフ（改善7）
export const AR_GUIDE_KEYS = {
  onFirstOpen: 'kirari.ar_first_open',
  onLongPress: 'kirari.ar_long_press',
  onCartAdd: 'kirari.ar_cart_add',
  onColorChange: 'kirari.ar_color_change',
  onCategorySwitch: 'kirari.ar_category_switch',
  onCustomize: 'kirari.ar_customize',
  onCheckout: 'kirari.ar_checkout',
};

export { getWeatherKey, STREAK_KEYS, RANDOM_KEYS, HINT_IDLE_KEY, HINT_LONG_PRESS_KEY };
