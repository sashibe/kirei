import { useState, useEffect, useCallback, useRef } from 'react';

// --- セリフパターン定義 ---

// B. ヒント系
const HINT_IDLE = 'タップすると肌チェックできるよ✨';
const HINT_LONG_PRESS = 'タップして、今日のコンディション確認してみて♪';

// C. 継続応援系
const STREAK_LINES = {
  3: '3日連続チェック！コツコツが一番きれいへの近道だよ',
  7: '1週間続けてる！肌の変化、気づいてきた？',
  30: '1ヶ月続けてること、すごいよ。肌記録、確実に積み重なってるよ',
};

// D. ランダム（ふとした一言）
const RANDOM_LINES = [
  'おはよ♪ 今日もいい顔してるよ',
  '昨日と今日、肌の調子どう？',
  '鏡に映る自分、毎日少しずつ変わってるんだよ',
  '今日は何色のリップにする？',
  'ちょっとくすんでる日でも、大丈夫。チェックしてみて',
];

// A. 天気・環境連動（weather オブジェクトから判定）
function getWeatherLine(weather) {
  if (!weather) return null;
  const { temp, humidity, uvIndex, rainProb } = weather;
  // 花粉シーズン（3〜5月）
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5 && rainProb < 50) {
    return '花粉の季節。肌が敏感になってる人も多いよ';
  }
  if (humidity > 70) return '今日は湿気多めだって。崩れにくいメイクがいいかも';
  if (humidity < 40) return '今日は乾燥注意日。肌の水分、確認してみて';
  if (uvIndex >= 6) return 'UV強めの日だよ。日焼け止め忘れずに！';
  if (temp <= 10) return '寒い日は肌が敏感になりやすいよ。やさしくチェックしてみて';
  if (temp >= 30) return '今日は暑くなりそう。皮脂多めの日かも';
  if (rainProb >= 70) return '雨の予報だよ。ウォータープルーフのアイテム、チェックしてみて';
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
 * @returns {{ message: string|null, visible: boolean, dismiss: () => void }}
 */
export default function useKirari({ weather = null, isChecking = false } = {}) {
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
      const line = getWeatherLine(weather);
      if (line) {
        const timer = setTimeout(() => show(line, 6000), 3000);
        return () => clearTimeout(timer);
      }
    }

    // 優先度2: 連続日数
    if (streak === 3 || streak === 7 || streak === 30) {
      const timer = setTimeout(() => show(STREAK_LINES[streak], 6000), 3000);
      return () => clearTimeout(timer);
    }

    // 優先度3: ランダム（10回に1回）
    if (Math.random() < 0.1) {
      const timer = setTimeout(() => show(randomPick(RANDOM_LINES), 5000), 3000);
      return () => clearTimeout(timer);
    }

    // 優先度4: 5秒放置でヒント
    idleTimerRef.current = setTimeout(() => {
      if (!shownRef.current) {
        show(HINT_IDLE, 5000);
      }
    }, 5000);

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [weather, isChecking, show]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  return { message, visible, dismiss };
}

export { getWeatherLine, STREAK_LINES, RANDOM_LINES, HINT_IDLE, HINT_LONG_PRESS };
