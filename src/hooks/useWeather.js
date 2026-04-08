import { useState, useEffect } from 'react';

const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';
const GEOCODE_API = 'https://nominatim.openstreetmap.org/reverse';

// 天気コード → テキスト
const WEATHER_TEXT = {
  ja: { 0: '快晴', 1: '晴れ', 2: '晴れのち曇り', 3: '曇り', 45: '霧', 48: '霧', 51: '小雨', 53: '雨', 55: '大雨', 61: '小雨', 63: '雨', 65: '大雨', 71: '小雪', 73: '雪', 75: '大雪', 80: 'にわか雨', 81: '雨', 82: '豪雨', 95: '雷雨', 96: '雷雨（雹）', 99: '雷雨（雹）' },
  en: { 0: 'Clear sky', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Fog', 51: 'Light drizzle', 53: 'Rain', 55: 'Heavy rain', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain', 71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 80: 'Rain showers', 81: 'Rain', 82: 'Heavy rain', 95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm' },
  ko: { 0: '맑음', 1: '대체로 맑음', 2: '구름 조금', 3: '흐림', 45: '안개', 48: '안개', 51: '이슬비', 53: '비', 55: '폭우', 61: '약한 비', 63: '비', 65: '폭우', 71: '약한 눈', 73: '눈', 75: '폭설', 80: '소나기', 81: '비', 82: '폭우', 95: '뇌우', 96: '뇌우', 99: '뇌우' },
};

const WEATHER_EMOJI = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌧️', 55: '🌧️', 61: '🌦️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '🌨️', 80: '🌦️', 81: '🌧️', 82: '🌧️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
};

async function fetchWeather(lat, lon) {
  const url = `${WEATHER_API}?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,precipitation_probability,uv_index,weather_code` +
    `&hourly=precipitation_probability,weather_code` +
    `&daily=temperature_2m_max,temperature_2m_min,uv_index_max` +
    `&forecast_days=2&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();

  // 現在時刻のインデックス
  const now = new Date();
  const hours = data.hourly?.time || [];

  // 午後(12-18時)の降水確率最大値（今日）
  const todayAfternoon = hours
    .map((t, i) => ({ t: new Date(t), prob: data.hourly.precipitation_probability[i] }))
    .filter(h => h.t.getDate() === now.getDate() && h.t.getHours() >= 12 && h.t.getHours() <= 18);
  const afternoonRainMax = todayAfternoon.length > 0
    ? Math.max(...todayAfternoon.map(h => h.prob))
    : null;

  // 明日の天気コード（12時の値）
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowNoon = hours.findIndex(t => {
    const d = new Date(t);
    return d.getDate() === tomorrow.getDate() && d.getHours() === 12;
  });
  const tomorrowCode = tomorrowNoon >= 0 ? data.hourly.weather_code[tomorrowNoon] : null;

  // 今日・明日の最高/最低気温, UV最大値
  const todayMax = data.daily?.temperature_2m_max?.[0] ?? null;
  const todayMin = data.daily?.temperature_2m_min?.[0] ?? null;
  const todayUvMax = data.daily?.uv_index_max?.[0] ?? null;
  const tomorrowMax = data.daily?.temperature_2m_max?.[1] ?? null;
  const tomorrowMin = data.daily?.temperature_2m_min?.[1] ?? null;

  return {
    temp: data.current.temperature_2m,
    humidity: data.current.relative_humidity_2m,
    uvIndex: data.current.uv_index,
    rainProb: data.current.precipitation_probability,
    weatherCode: data.current.weather_code,
    afternoonRainMax,
    tomorrowCode,
    todayMax,
    todayMin,
    todayUvMax,
    tomorrowMax,
    tomorrowMin,
  };
}

async function fetchLocationName(lat, lon) {
  try {
    const res = await fetch(
      `${GEOCODE_API}?lat=${lat}&lon=${lon}&format=json&accept-language=ja`,
      { headers: { 'User-Agent': 'KIREI-App' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    // 市区町村名を返す
    return data.address?.city || data.address?.town || data.address?.village
      || data.address?.county || data.address?.state || null;
  } catch { return null; }
}

/**
 * useWeather - 位置情報から天気データ+地名を取得
 * @returns {Object|null} { temp, humidity, uvIndex, rainProb, weatherCode, afternoonRainMax, tomorrowCode, locationName }
 */
export default function useWeather() {
  const [weather, setWeather] = useState(() => {
    const cached = sessionStorage.getItem('kirei_weather');
    return cached ? JSON.parse(cached) : null;
  });

  useEffect(() => {
    if (sessionStorage.getItem('kirei_weather')) return;
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const [data, locName] = await Promise.all([
            fetchWeather(pos.coords.latitude, pos.coords.longitude),
            fetchLocationName(pos.coords.latitude, pos.coords.longitude),
          ]);
          if (data) {
            const result = { ...data, locationName: locName };
            sessionStorage.setItem('kirei_weather', JSON.stringify(result));
            setWeather(result);
          }
        } catch { /* skip */ }
      },
      () => { /* 位置情報拒否 */ },
      { timeout: 5000, maximumAge: 300000 }
    );
  }, []);

  return weather;
}

// 天気テキスト・絵文字のエクスポート
export { WEATHER_TEXT, WEATHER_EMOJI };
