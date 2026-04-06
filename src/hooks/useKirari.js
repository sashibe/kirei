import { useState, useEffect, useCallback, useRef } from 'react';
import { getHoursSinceLastCheck, getTotalChecks } from '../utils/logger.js';
import {
  getCheckPromptLine,
  shouldShowCheckPrompt,
  getTimeBasedLine,
  pickLine,
} from '../data/kirariDialogues.js';

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
export default function useKirari({ weather = null, isChecking = false, t = (k) => k } = {}) {
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

    // 初回は3秒後に表示（毎回表示）
    const firstTimer = setTimeout(() => {
      show(t(firstKey));
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
