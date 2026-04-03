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
