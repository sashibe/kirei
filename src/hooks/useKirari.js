import { useState, useEffect, useCallback, useRef } from 'react';

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

// セリフプールを構築（天気キーがあれば含む）
function buildPool(weatherKey) {
  const pool = [HINT_IDLE_KEY, ...RANDOM_KEYS];
  if (weatherKey) pool.push(weatherKey);
  return pool;
}

// シャッフルして同じセリフが連続しないようにする
function shuffleAvoid(pool, lastKey) {
  const filtered = pool.filter(k => k !== lastKey);
  if (filtered.length === 0) return pool[0];
  return filtered[Math.floor(Math.random() * filtered.length)];
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
 * ミラーモード起動中、適応型の間隔でセリフをリピート表示する。
 * - 0〜30秒: 15秒間隔
 * - 30秒〜2分: 30秒間隔
 * - 2分以降: 45秒間隔
 * 表示時間は一律4秒。同じセリフが連続しない。
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

    getAndUpdateStreak();
    const weatherKey = getWeatherKey(weather);
    const pool = buildPool(weatherKey);
    startTimeRef.current = Date.now();

    // 初回表示: 連続日数メッセージ or 通常プール
    const streak = parseInt(localStorage.getItem('kirei_streak') || '0', 10);
    let firstKey;
    if (streak === 3 || streak === 7 || streak === 30) {
      firstKey = STREAK_KEYS[streak];
    } else if (weatherKey) {
      firstKey = weatherKey;
    } else {
      firstKey = HINT_IDLE_KEY;
    }

    // 初回は3秒後に表示
    const firstTimer = setTimeout(() => {
      show(t(firstKey));
      lastKeyRef.current = firstKey;
      scheduleNext();
    }, 3000);

    function scheduleNext() {
      const elapsed = Date.now() - startTimeRef.current;
      const interval = getInterval(elapsed);

      repeatTimerRef.current = setTimeout(() => {
        const key = shuffleAvoid(pool, lastKeyRef.current);
        show(t(key));
        lastKeyRef.current = key;
        scheduleNext(); // 再帰的に次をスケジュール
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

export { getWeatherKey, STREAK_KEYS, RANDOM_KEYS, HINT_IDLE_KEY, HINT_LONG_PRESS_KEY };
