import { useState, useEffect, useRef, useCallback } from 'react';
import { detectFacePosition } from '../analysis/skinAnalyzer.js';
import { detectMouthPosition } from '../analysis/dentalAnalyzer.js';

const INTERVAL = 300;
const STABLE_FRAMES = 3;   // 3回連続 = 約900ms安定で発火
const TIMEOUT = 10000;

// status: 'searching' | 'detected' | 'ready' | 'timeout'
export default function useAutoShutter({ cameraRef, mode = 'face', enabled = true }) {
  const [status, setStatus] = useState('searching');
  const [confidence, setConfidence] = useState(0);
  const [epoch, setEpoch] = useState(0);
  const stableCountRef = useRef(0);
  const triggeredRef = useRef(false);
  const elapsedRef = useRef(0);
  const everDetectedRef = useRef(false); // 一度でも検出したか

  const reset = useCallback(() => {
    setStatus('searching');
    setConfidence(0);
    stableCountRef.current = 0;
    triggeredRef.current = false;
    elapsedRef.current = 0;
    everDetectedRef.current = false;
    setEpoch(e => e + 1);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    triggeredRef.current = false;
    elapsedRef.current = 0;
    stableCountRef.current = 0;
    everDetectedRef.current = false;

    const detect = mode === 'face' ? detectFacePosition : detectMouthPosition;

    const iv = setInterval(() => {
      if (triggeredRef.current) return;
      elapsedRef.current += INTERVAL;

      const cam = cameraRef?.current;
      const frame = cam?.isActive && typeof cam.captureFrame === 'function'
        ? cam.captureFrame()
        : null;

      if (frame) {
        const result = detect(frame);
        const conf = Math.round(Math.min(100, result.ratio * 1000));
        setConfidence(conf);

        if (result.inFrame) {
          everDetectedRef.current = true;
          stableCountRef.current++;
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
      }

      // タイムアウト: 検出できなかった場合は 'timeout' を返す（シャッターは切らない）
      if (elapsedRef.current >= TIMEOUT) {
        triggeredRef.current = true;
        setStatus('timeout');
      }
    }, INTERVAL);

    return () => clearInterval(iv);
  }, [enabled, mode, cameraRef, epoch]);

  return { status, confidence, reset };
}
