import { useState, useEffect, useRef, useCallback } from 'react';
import { detectFacePosition } from '../analysis/skinAnalyzer.js';
import { detectMouthPosition } from '../analysis/dentalAnalyzer.js';

const INTERVAL = 300;
const STABLE_FRAMES = 3;
const TIMEOUT = 10000;

// 顔が遮蔽されていないか判定（キーポイントの配置チェック）
// 額(10) → 鼻先(1) → 顎(152) が上から下に適切な間隔で並んでいるか
function isFaceUnoccluded(landmarks) {
  const forehead = landmarks[10]; // 額の中央
  const noseTip = landmarks[1];   // 鼻先
  const chin = landmarks[152];     // 顎先
  const leftCheek = landmarks[234]; // 左頬
  const rightCheek = landmarks[454]; // 右頬

  // 縦方向: 額→鼻→顎が上から下に順番に並ぶ
  if (!(forehead.y < noseTip.y && noseTip.y < chin.y)) return false;

  // 顔の縦幅と横幅が妥当（極端に潰れていない）
  const faceHeight = chin.y - forehead.y;
  const faceWidth = Math.abs(rightCheek.x - leftCheek.x);
  if (faceHeight < 0.08 || faceWidth < 0.08) return false;

  // アスペクト比チェック（顔は縦長〜正方形。極端に横長はNG）
  const aspect = faceHeight / faceWidth;
  if (aspect < 0.5 || aspect > 2.5) return false;

  return true;
}

// 口の開き判定（ランドマークベース）
function isMouthOpen(landmarks) {
  const upperLip = landmarks[13];
  const lowerLip = landmarks[14];
  const leftCorner = landmarks[61];
  const rightCorner = landmarks[291];
  const mouthWidth = Math.abs(rightCorner.x - leftCorner.x);
  if (mouthWidth < 0.01) return false;
  const openRatio = (lowerLip.y - upperLip.y) / mouthWidth;
  return openRatio > 0.15;
}

// status: 'searching' | 'detected' | 'ready' | 'timeout'
export default function useAutoShutter({ cameraRef, videoRef, faceLandmarker, mode = 'face', enabled = true }) {
  const [status, setStatus] = useState('searching');
  const [confidence, setConfidence] = useState(0);
  const [epoch, setEpoch] = useState(0);
  const [lastLandmarks, setLastLandmarks] = useState(null);
  const stableCountRef = useRef(0);
  const triggeredRef = useRef(false);
  const elapsedRef = useRef(0);

  const reset = useCallback(() => {
    setStatus('searching');
    setConfidence(0);
    setLastLandmarks(null);
    stableCountRef.current = 0;
    triggeredRef.current = false;
    elapsedRef.current = 0;
    setEpoch(e => e + 1);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    triggeredRef.current = false;
    elapsedRef.current = 0;
    stableCountRef.current = 0;

    const iv = setInterval(() => {
      if (triggeredRef.current) return;
      elapsedRef.current += INTERVAL;

      let inFrame = false;
      let conf = 0;
      let detectedLandmarks = null;

      // 毎tick最新のready状態を参照
      const useLandmarker = faceLandmarker?.ready;
      const videoEl = videoRef?.current;
      let mpSuccess = false;

      if (useLandmarker && videoEl) {
        // === MediaPipe ランドマーク検出 ===
        try {
          const result = faceLandmarker.detect(videoEl, performance.now());
          if (result) {
            mpSuccess = true;
            detectedLandmarks = result.landmarks;
            const box = result.faceBox;

            // 顔が遮蔽されていないかチェック
            const unoccluded = isFaceUnoccluded(result.landmarks);

            if (mode === 'face') {
              const centered = box.x + box.w / 2 > 0.2 && box.x + box.w / 2 < 0.8;
              const largeEnough = box.w > 0.2 && box.h > 0.2;
              inFrame = centered && largeEnough && unoccluded;
              conf = unoccluded ? (inFrame ? 90 : 30) : 15;
            } else {
              const largeEnough = box.w > 0.15 && box.h > 0.15;
              inFrame = largeEnough && unoccluded && isMouthOpen(result.landmarks);
              conf = inFrame ? 90 : 40;
            }
          }
        } catch { /* detectForVideo失敗 → フォールバック */ }
      }
      if (!mpSuccess) {
        // === フォールバック: HSVヒューリスティック ===
        const cam = cameraRef?.current;
        const frame = cam?.isActive && typeof cam.captureFrame === 'function'
          ? cam.captureFrame()
          : null;

        if (frame) {
          const detect = mode === 'face' ? detectFacePosition : detectMouthPosition;
          const result = detect(frame);
          conf = Math.round(Math.min(100, result.ratio * 1000));
          inFrame = result.inFrame;
        }
      }

      setConfidence(conf);

      if (inFrame) {
        stableCountRef.current++;
        if (detectedLandmarks) setLastLandmarks(detectedLandmarks);
        if (stableCountRef.current >= STABLE_FRAMES) {
          setStatus('ready');
          triggeredRef.current = true;
          return;
        }
        setStatus('detected');
      } else {
        stableCountRef.current = Math.max(0, stableCountRef.current - 1);
        setStatus(conf > 5 ? 'detected' : 'searching');
      }

      if (elapsedRef.current >= TIMEOUT) {
        triggeredRef.current = true;
        setStatus('timeout');
      }
    }, INTERVAL);

    return () => clearInterval(iv);
  }, [enabled, mode, epoch]); // cameraRef/videoRef/faceLandmarkerはref的アクセスなので依存不要

  return { status, confidence, lastLandmarks, reset };
}
