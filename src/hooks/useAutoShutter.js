import { useState, useEffect, useRef, useCallback } from 'react';
import { detectFacePosition } from '../analysis/skinAnalyzer.js';
import { detectMouthPosition } from '../analysis/dentalAnalyzer.js';

const INTERVAL = 300; // ms
const STABLE_FRAMES = 2; // 連続2フレームで発火
const TIMEOUT = 8000; // 8秒で検出できなくても強制発火

export default function useAutoShutter({ captureFrame, isActive, mode = 'face', enabled = true }) {
  const [status, setStatus] = useState('searching');
  const [confidence, setConfidence] = useState(0);
  const stableCountRef = useRef(0);
  const triggeredRef = useRef(false);
  const frameCountRef = useRef(0);

  const reset = useCallback(() => {
    setStatus('searching');
    setConfidence(0);
    stableCountRef.current = 0;
    triggeredRef.current = false;
    frameCountRef.current = 0;
  }, []);

  useEffect(() => {
    if (!enabled || triggeredRef.current) return;

    const detect = mode === 'face' ? detectFacePosition : detectMouthPosition;

    const iv = setInterval(() => {
      if (triggeredRef.current) return;
      frameCountRef.current++;

      // captureFrame が利用可能かチェック
      const frame = typeof captureFrame === 'function' ? captureFrame() : null;

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

      // タイムアウト: 一定時間検出できなくても強制的にreadyにする
      if (frameCountRef.current * INTERVAL >= TIMEOUT) {
        setStatus('ready');
        triggeredRef.current = true;
      }
    }, INTERVAL);

    return () => clearInterval(iv);
  }, [enabled, isActive, mode, captureFrame]);

  return { status, confidence, reset, triggered: triggeredRef.current };
}
