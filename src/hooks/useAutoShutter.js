import { useState, useEffect, useRef, useCallback } from 'react';
import { detectFacePosition } from '../analysis/skinAnalyzer.js';
import { detectMouthPosition } from '../analysis/dentalAnalyzer.js';

const INTERVAL = 300;
const STABLE_FRAMES = 2;
const TIMEOUT = 8000;

export default function useAutoShutter({ cameraRef, mode = 'face', enabled = true }) {
  const [status, setStatus] = useState('searching');
  const [confidence, setConfidence] = useState(0);
  const [epoch, setEpoch] = useState(0); // reset時にインクリメントしてeffectを再起動
  const stableCountRef = useRef(0);
  const triggeredRef = useRef(false);
  const elapsedRef = useRef(0);

  const reset = useCallback(() => {
    setStatus('searching');
    setConfidence(0);
    stableCountRef.current = 0;
    triggeredRef.current = false;
    elapsedRef.current = 0;
    setEpoch(e => e + 1);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    // reset後にtriggeredRefはfalseに戻されている
    triggeredRef.current = false;
    elapsedRef.current = 0;
    stableCountRef.current = 0;

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

      if (elapsedRef.current >= TIMEOUT) {
        setStatus('ready');
        triggeredRef.current = true;
      }
    }, INTERVAL);

    return () => clearInterval(iv);
  }, [enabled, mode, cameraRef, epoch]);

  return { status, confidence, reset };
}
