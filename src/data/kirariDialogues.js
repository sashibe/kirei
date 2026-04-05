// src/data/kirariDialogues.js

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
