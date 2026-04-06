// src/data/kirariDialogues.js

// --- 1-1. 前回チェックからの経過時間 × 促しセリフ ---
export function getCheckPromptLine(hoursSinceLastCheck, totalChecks) {
  if (totalChecks < 3) {
    return 'kirari.hint_idle'; // タップ操作案内
  }
  if (hoursSinceLastCheck === null) {
    return 'kirari.first_visit';
  }
  if (hoursSinceLastCheck > 72) return 'kirari.check_miss_long';
  if (hoursSinceLastCheck > 24) return 'kirari.check_miss_day';
  if (hoursSinceLastCheck > 12) return 'kirari.check_miss_half';
  if (hoursSinceLastCheck > 3)  return 'kirari.check_change';
  return null; // チェック直後は促さない
}

// 表示確率（経過時間が短いほど低い）
export function shouldShowCheckPrompt(hoursSinceLastCheck) {
  if (hoursSinceLastCheck === null) return true;
  if (hoursSinceLastCheck > 24) return true;
  if (hoursSinceLastCheck > 12) return Math.random() < 0.8;
  if (hoursSinceLastCheck > 3) return Math.random() < 0.5;
  return false;
}

// --- 1-2. スコア変化量 × パーソナライズセリフ ---
export function getScoreDeltaLine(currentScore, prevScore) {
  if (prevScore === null) return 'kirari.first_check_done';
  const delta = currentScore - prevScore;
  if (delta >= 10) return 'kirari.score_up_big';
  if (delta >= 5)  return 'kirari.score_up';
  if (delta <= -10) return 'kirari.score_down_big';
  if (delta <= -5)  return 'kirari.score_down';
  return 'kirari.score_stable';
}

// --- 1-3. 時間帯・曜日セリフ ---
export function getTimeBasedLine(hour, dayOfWeek) {
  if (hour < 7)  return 'kirari.time_early';
  if (hour < 10) return 'kirari.time_morning';
  if (hour >= 23) return 'kirari.time_late';
  if (hour >= 21) return 'kirari.time_night';
  if (dayOfWeek === 1) return 'kirari.time_monday';
  if (dayOfWeek === 5) return 'kirari.time_friday';
  return null;
}

// --- 1-4. セリフ重複回避 ---
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

export function getCoordLine(context, t) {
  const { styleTab, tpo, weather } = context;
  const tabNames = ['color', 'base', 'skincare'];
  const tab = tabNames[styleTab] || 'color';

  // 天気連動
  if (weather?.temp < 10) return t('coord.weather_cold');
  if (weather?.temp < 18) return t('coord.weather_cool');
  if (weather?.temp > 28) return t('coord.weather_hot');

  // タブ x TPO 連動
  if (tab === 'color' && tpo === 'office') return t('coord.color_office');
  if (tab === 'color' && tpo === 'date') return t('coord.color_date');
  if (tab === 'base' && tpo === 'office') return t('coord.base_office');
  if (tab === 'base' && tpo === 'casual') return t('coord.base_casual');
  if (tab === 'base' && tpo === 'date') return t('coord.base_date');

  return t('coord.default');
}

export function getPcLine(personalColor, t) {
  if (!personalColor) return null;
  const lines = {
    'bright-spring': 'kirari.pc_bright_spring',
    'true-spring':   'kirari.pc_true_spring',
    'clear-spring':  'kirari.pc_clear_spring',
    'light-summer':  'kirari.pc_light_summer',
    'true-summer':   'kirari.pc_true_summer',
    'soft-summer':   'kirari.pc_soft_summer',
    'soft-autumn':   'kirari.pc_soft_autumn',
    'true-autumn':   'kirari.pc_true_autumn',
    'deep-autumn':   'kirari.pc_deep_autumn',
    'clear-winter':  'kirari.pc_clear_winter',
    'true-winter':   'kirari.pc_true_winter',
    'deep-winter':   'kirari.pc_deep_winter',
  };
  return t(lines[personalColor.subtypeId] ?? 'kirari.pc_fallback');
}

export function getCoordHint(selectedLook, styleTab, t) {
  const tabNames = ['color', 'base', 'skincare'];
  const tab = tabNames[styleTab] || 'color';

  if (tab === 'color') {
    const lookName = selectedLook?.name
      ? (typeof selectedLook.name === 'object' ? t(selectedLook.name) : selectedLook.name)
      : t('coord.hint_look_fallback');
    return t('coord.hint_color', { look: lookName });
  }
  if (tab === 'base') {
    return t('coord.hint_base');
  }
  return t('coord.hint_skincare');
}
