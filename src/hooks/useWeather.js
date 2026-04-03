import { useState, useEffect } from 'react';

const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';

async function fetchWeather(lat, lon) {
  const url = `${WEATHER_API}?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,precipitation_probability,uv_index` +
    `&timezone=Asia/Tokyo`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return {
    temp: data.current.temperature_2m,
    humidity: data.current.relative_humidity_2m,
    uvIndex: data.current.uv_index,
    rainProb: data.current.precipitation_probability,
  };
}

/**
 * useWeather - 位置情報から天気データを取得するフック
 *
 * - navigator.geolocation で位置取得
 * - 拒否された場合は null を返す（天気連動セリフをスキップ）
 * - sessionStorage にキャッシュ（同一セッション内は再取得しない）
 *
 * @returns {Object|null} { temp, humidity, uvIndex, rainProb } or null
 */
export default function useWeather() {
  const [weather, setWeather] = useState(() => {
    const cached = sessionStorage.getItem('kirei_weather');
    return cached ? JSON.parse(cached) : null;
  });

  useEffect(() => {
    // キャッシュがあれば再取得しない
    if (sessionStorage.getItem('kirei_weather')) return;

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const data = await fetchWeather(pos.coords.latitude, pos.coords.longitude);
          if (data) {
            sessionStorage.setItem('kirei_weather', JSON.stringify(data));
            setWeather(data);
          }
        } catch {
          // API失敗時は天気連動をスキップ
        }
      },
      () => {
        // 位置情報拒否時: 天気連動セリフをスキップ
      },
      { timeout: 5000, maximumAge: 300000 }
    );
  }, []);

  return weather;
}
