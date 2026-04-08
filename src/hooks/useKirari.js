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

// 天気予報セリフを動的生成（地名・天気・降水確率を含む）
function buildWeatherForecast(weather, lang = 'ja') {
  if (!weather) return null;
  const { weatherCode, afternoonRainMax, tomorrowCode, locationName, temp, rainProb } = weather;

  const texts = WEATHER_TEXT[lang] || WEATHER_TEXT.ja;
  const emoji = WEATHER_EMOJI[weatherCode] || '🌤️';
  const loc = locationName || '';

  const lines = [];

  // 現在の天気
  const currentText = texts[weatherCode] || '';
  if (currentText && loc) {
    if (lang === 'ja') lines.push(`${loc}の今日の天気は${emoji}${currentText}だよ♪`);
    else if (lang === 'ko') lines.push(`${loc} 오늘 날씨는 ${emoji}${currentText}♪`);
    else lines.push(`Today in ${loc}: ${emoji} ${currentText}♪`);
  }

  // 午後の降水確率
  if (afternoonRainMax != null && afternoonRainMax >= 40) {
    if (lang === 'ja') lines.push(`午後の降水確率は${afternoonRainMax}%☂️ 傘を忘れずにね！`);
    else if (lang === 'ko') lines.push(`오후 강수 확률 ${afternoonRainMax}%☂️ 우산 잊지 마세요!`);
    else lines.push(`Afternoon rain chance: ${afternoonRainMax}%☂️ Don't forget your umbrella!`);
  }

  // 明日の天気
  if (tomorrowCode != null) {
    const tmrText = texts[tomorrowCode] || '';
    const tmrEmoji = WEATHER_EMOJI[tomorrowCode] || '🌤️';
    if (tmrText) {
      if (lang === 'ja') lines.push(`明日は${tmrEmoji}${tmrText}の予報♪`);
      else if (lang === 'ko') lines.push(`내일은 ${tmrEmoji}${tmrText} 예보♪`);
      else lines.push(`Tomorrow: ${tmrEmoji} ${tmrText}♪`);
    }
  }

  // 最高気温
  if (weather.todayMax != null) {
    if (weather.todayMax >= 30) {
      if (lang === 'ja') lines.push(`今日の予想最高気温は${weather.todayMax}°C🌡️ 暑くなるから水分補給を忘れずに！`);
      else if (lang === 'ko') lines.push(`오늘 예상 최고기온 ${weather.todayMax}°C🌡️ 수분 보충 잊지 마세요!`);
      else lines.push(`Today's high: ${weather.todayMax}°C🌡️ Stay hydrated!`);
    } else if (weather.todayMax <= 15) {
      if (lang === 'ja') lines.push(`今日の予想最高気温は${weather.todayMax}°C🧥 暖かくしてお出かけしてね♪`);
      else if (lang === 'ko') lines.push(`오늘 예상 최고기온 ${weather.todayMax}°C🧥 따뜻하게 입고 나가세요♪`);
      else lines.push(`Today's high: ${weather.todayMax}°C🧥 Dress warmly!`);
    }
  }

  // 最低気温（寒暖差注意）
  if (weather.todayMax != null && weather.todayMin != null) {
    const diff = weather.todayMax - weather.todayMin;
    if (diff >= 12) {
      if (lang === 'ja') lines.push(`最低${weather.todayMin}°C〜最高${weather.todayMax}°C 寒暖差が大きいから薄手の羽織り物があるといいかも♪`);
      else if (lang === 'ko') lines.push(`최저${weather.todayMin}°C~최고${weather.todayMax}°C 기온차가 크니까 가벼운 겉옷을 챙기세요♪`);
      else lines.push(`Low ${weather.todayMin}°C / High ${weather.todayMax}°C — Big temp swing! Bring a light layer♪`);
    }
    if (weather.todayMin <= 10) {
      if (lang === 'ja') lines.push(`朝の最低気温は${weather.todayMin}°C❄️ 朝は冷え込むから体調に気をつけてね！`);
      else if (lang === 'ko') lines.push(`아침 최저기온 ${weather.todayMin}°C❄️ 아침은 추우니 건강 조심!`);
      else lines.push(`Morning low: ${weather.todayMin}°C❄️ Bundle up in the morning!`);
    }
  }

  // UV指数（日中最大値）
  if (weather.todayUvMax != null && weather.todayUvMax >= 6) {
    if (lang === 'ja') lines.push(`今日のUV指数は${Math.round(weather.todayUvMax)}☀️ 日焼け対策は万全に！`);
    else if (lang === 'ko') lines.push(`오늘 UV 지수 ${Math.round(weather.todayUvMax)}☀️ 자외선 차단 철저히!`);
    else lines.push(`Today's UV index: ${Math.round(weather.todayUvMax)}☀️ Sun protection is a must!`);
  } else if (weather.uvIndex >= 6) {
    if (lang === 'ja') lines.push('UV指数が高め☀️ 日焼け止めを塗ろうね！');
    else if (lang === 'ko') lines.push('UV 지수가 높아요☀️ 자외선 차단제 잊지 마세요!');
    else lines.push('High UV index☀️ Apply sunscreen!');
  }

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
const DISPLAY_DURATION = 4000; // 表示時間 4秒
function getInterval(elapsedMs) {
  if (elapsedMs < 30000) return 15000;   // 0〜30秒: 15秒間隔
  if (elapsedMs < 120000) return 30000;  // 30秒〜2分: 30秒間隔
  return 45000;                          // 2分以降: 45秒間隔
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
      // 天気系キーの場合は予報セリフを優先
      if (forecastText && firstKey?.includes('weather')) {
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
        const key = pickLine(pool.filter(k => k !== lastKeyRef.current));
        show(t(key));
        lastKeyRef.current = key;
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
