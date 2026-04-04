import { useState, useEffect, useCallback, useRef } from 'react';

// --- セリフパターン定義（翻訳キー） ---

// B. ヒント系
const HINT_IDLE_KEY = 'kirari.hint_idle';
const HINT_LONG_PRESS_KEY = 'kirari.hint_long_press';

// C. 継続応援系
const STREAK_KEYS = {
  3: 'kirari.streak_3',
  7: 'kirari.streak_7',
  30: 'kirari.streak_30',
};

// D. ランダム（ふとした一言）
const RANDOM_KEYS = [
  'kirari.random_morning',
  'kirari.random_condition',
  'kirari.random_change',
  'kirari.random_lip',
  'kirari.random_dull',
];

// A. 天気・環境連動（weather オブジェクトから判定）→ 翻訳キーを返す
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

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 連続起動日数の取得・更新
function getAndUpdateStreak() {
  const today = new Date().toISOString().slice(0, 10);
  const lastDate = localStorage.getItem('kirei_last_date');
  const streak = parseInt(localStorage.getItem('kirei_streak') || '0', 10);

  if (lastDate === today) {
    return streak; // 今日は既にカウント済み
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  let newStreak;
  if (lastDate === yesterday) {
    newStreak = streak + 1;
  } else {
    newStreak = 1; // 連続途切れ or 初回
  }

  localStorage.setItem('kirei_last_date', today);
  localStorage.setItem('kirei_streak', String(newStreak));
  return newStreak;
}

// 1日1回制限チェック
function hasShownToday() {
  const today = new Date().toISOString().slice(0, 10);
  return localStorage.getItem('kirei_kirari_shown') === today;
}
function markShownToday() {
  const today = new Date().toISOString().slice(0, 10);
  localStorage.setItem('kirei_kirari_shown', today);
}

/**
 * useKirari - キラリのアンビエント出現を管理するフック
 *
 * @param {Object} options
 * @param {Object|null} options.weather - 天気データ { temp, humidity, uvIndex, rainProb }
 * @param {boolean} options.isChecking - 肌チェック中かどうか
 * @param {Function} options.t - 翻訳関数 (key) => string
 * @returns {{ message: string|null, visible: boolean, dismiss: () => void }}
 */
export default function useKirari({ weather = null, isChecking = false, t = (k) => k } = {}) {
  const [message, setMessage] = useState(null);
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef(null);
  const shownRef = useRef(false); // この起動で既に表示したか
  const idleTimerRef = useRef(null);

  const show = useCallback((text, duration = 5000) => {
    setMessage(text);
    setVisible(true);
    markShownToday();
    shownRef.current = true;
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
    }, duration);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  }, []);

  // チェック中はキラリを非表示にする
  useEffect(() => {
    if (isChecking) {
      dismiss();
    }
  }, [isChecking, dismiss]);

  // メイン出現ロジック（マウント時 + weather変更時）
  useEffect(() => {
    // チェック中またはこの起動で既に表示済み
    if (isChecking || shownRef.current) {
      return;
    }

    const streak = getAndUpdateStreak();

    // 優先度1: 天気連動（起動後3秒）
    if (weather) {
      const key = getWeatherKey(weather);
      if (key) {
        const timer = setTimeout(() => show(t(key), 6000), 3000);
        return () => clearTimeout(timer);
      }
    }

    // 優先度2: 連続日数
    if (streak === 3 || streak === 7 || streak === 30) {
      const timer = setTimeout(() => show(t(STREAK_KEYS[streak]), 6000), 3000);
      return () => clearTimeout(timer);
    }

    // 優先度3: ランダム（10回に1回）
    if (Math.random() < 0.1) {
      const timer = setTimeout(() => show(t(randomPick(RANDOM_KEYS)), 5000), 3000);
      return () => clearTimeout(timer);
    }

    // 優先度4: 5秒放置でヒント
    idleTimerRef.current = setTimeout(() => {
      if (!shownRef.current) {
        show(t(HINT_IDLE_KEY), 5000);
      }
    }, 5000);

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [weather, isChecking, show, t]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  return { message, visible, dismiss };
}

export { getWeatherKey, STREAK_KEYS, RANDOM_KEYS, HINT_IDLE_KEY, HINT_LONG_PRESS_KEY };
