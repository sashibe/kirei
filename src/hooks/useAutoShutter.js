import { useState, useEffect, useRef, useCallback } from 'react';
import { detectFacePosition } from '../analysis/skinAnalyzer.js';
import { detectMouthPosition } from '../analysis/dentalAnalyzer.js';

const INTERVAL = 250; // ms
const STABLE_FRAMES = 3; // 連続3フレームで発火

export default function useAutoShutter({ captureFrame, isActive, mode = 'face', enabled = true }) {
  const [status, setStatus] = useState('searching'); // searching | detected | ready
  const [confidence, setConfidence] = useState(0);
  const stableCountRef = useRef(0);
  const triggeredRef = useRef(false);

  const reset = useCallback(() => {
    setStatus('searching');
    setConfidence(0);
    stableCountRef.current = 0;
    triggeredRef.current = false;
  }, []);

  useEffect(() => {
    if (!enabled || !isActive || triggeredRef.current) return;

    const detect = mode === 'face' ? detectFacePosition : detectMouthPosition;

    const iv = setInterval(() => {
      if (triggeredRef.current) return;

      const frame = captureFrame?.();
      if (!frame) return;

      const result = detect(frame);
      const conf = Math.round(Math.min(100, result.ratio * 1000));
      setConfidence(conf);

      if (result.inFrame) {
        stableCountRef.current++;
        if (stableCountRef.current >= STABLE_FRAMES) {
          setStatus('ready');
          triggeredRef.current = true;
        } else {
          setStatus('detected');
        }
      } else {
        stableCountRef.current = Math.max(0, stableCountRef.current - 1);
        setStatus(conf > 10 ? 'detected' : 'searching');
      }
    }, INTERVAL);

    return () => clearInterval(iv);
  }, [enabled, isActive, mode, captureFrame]);

  return { status, confidence, reset, triggered: triggeredRef.current };
}
