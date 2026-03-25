import { useState, useEffect, useRef, useCallback } from 'react';
import { detectFacePosition } from '../analysis/skinAnalyzer.js';
import { detectMouthPosition } from '../analysis/dentalAnalyzer.js';

const INTERVAL = 300;
const STABLE_FRAMES = 3;
const TIMEOUT = 10000;

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

            if (mode === 'face') {
              // 顔が十分な大きさで中央付近にあるか
              const centered = box.x + box.w / 2 > 0.2 && box.x + box.w / 2 < 0.8;
              const largeEnough = box.w > 0.25 && box.h > 0.25;
              inFrame = centered && largeEnough;
              conf = inFrame ? 90 : 30;
            } else {
              // デンタル: 顔検出 + 口が十分に開いている
              const largeEnough = box.w > 0.2 && box.h > 0.2;
              inFrame = largeEnough && isMouthOpen(result.landmarks);
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
