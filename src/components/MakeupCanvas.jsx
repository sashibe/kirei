/**
 * MakeupCanvas — カメラ映像上にリアルタイムメイクARを描画するCanvas
 *
 * requestAnimationFrame ループで FaceLandmarker → メイク描画を実行。
 * look/intensity/styleTab は useRef でループ内参照し、
 * state 変更でループ再起動を避ける。
 */

import { useEffect, useRef } from 'react';
import { useFaceLandmarkerCtx } from '../contexts/FaceLandmarkerContext.jsx';
import {
  drawLip, drawEyeshadow, drawCheek,
  drawFoundation, drawConcealer, drawBrow,
} from '../rendering/makeupRenderer.js';

export default function MakeupCanvas({ videoRef, look, styleTab, intensity }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const { ready, detect } = useFaceLandmarkerCtx();

  // props を ref に同期（ループ内で最新値参照）
  const propsRef = useRef({ look, styleTab, intensity });
  useEffect(() => {
    propsRef.current = { look, styleTab, intensity };
  }, [look, styleTab, intensity]);

  useEffect(() => {
    if (!ready) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function loop() {
      const video = videoRef.current;
      if (!video || !video.videoWidth) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // Canvas サイズ同期
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 検出
      const result = detect(video, performance.now());
      if (!result?.landmarks) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const lms = result.landmarks;
      const w = canvas.width;
      const h = canvas.height;
      const { look: lk, styleTab: tab, intensity: inten } = propsRef.current;
      const opacity = (inten || 70) / 100;

      if (!lk) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      if (tab === 0) {
        // Color メイク: lip + cheek + eyeshadow
        if (lk.cheek)     drawCheek(ctx, lms, w, h, lk.cheek, opacity);
        if (lk.eyeshadow) drawEyeshadow(ctx, lms, w, h, lk.eyeshadow, opacity);
        if (lk.lip)       drawLip(ctx, lms, w, h, lk.lip, opacity);
      } else {
        // Base メイク: foundation + concealer + brow (+ lip)
        if (lk.base)      drawFoundation(ctx, lms, w, h, lk.base, opacity);
        if (lk.concealer) drawConcealer(ctx, lms, w, h, lk.concealer, opacity);
        if (lk.brow)      drawBrow(ctx, lms, w, h, lk.brow, opacity);
        if (lk.lip)       drawLip(ctx, lms, w, h, lk.lip, opacity);
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [ready, detect, videoRef]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0, left: 0,
        width: '100%', height: '100%',
        transform: 'scaleX(-1)',
        pointerEvents: 'none',
      }}
    />
  );
}
