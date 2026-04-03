import { useState, useEffect, useRef } from 'react';

const NIGHT_THRESHOLD = 30; // 輝度スコア（0-255）がこれ以下でナイトモード
const CHECK_INTERVAL = 2000; // 2秒ごとにチェック（バッテリー配慮）
const CONSECUTIVE_COUNT = 3; // 3回連続で閾値以下ならナイトモード開始

function measureBrightness(videoElement) {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoElement, 0, 0, 64, 64);
  const data = ctx.getImageData(0, 0, 64, 64).data;
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    // 輝度 = 0.299R + 0.587G + 0.114B（ITU-R BT.601）
    sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  return sum / (64 * 64);
}

/**
 * useNightMode - カメラ映像の輝度からナイトモードを自動検知
 *
 * @param {React.RefObject} videoRef - video要素のref
 * @returns {boolean} isNight
 */
export default function useNightMode(videoRef) {
  const [isNight, setIsNight] = useState(false);
  const countRef = useRef(0); // 連続暗検知カウント
  const brightCountRef = useRef(0); // 連続明るい検知カウント

  useEffect(() => {
    const interval = setInterval(() => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      try {
        const brightness = measureBrightness(videoRef.current);

        if (brightness < NIGHT_THRESHOLD) {
          countRef.current++;
          brightCountRef.current = 0;
          if (countRef.current >= CONSECUTIVE_COUNT) {
            setIsNight(true);
          }
        } else {
          brightCountRef.current++;
          countRef.current = 0;
          if (brightCountRef.current >= 2) {
            setIsNight(false);
          }
        }
      } catch {
        // Canvas access error (e.g., CORS) — skip
      }
    }, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [videoRef]);

  return isNight;
}
