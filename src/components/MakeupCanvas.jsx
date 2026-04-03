/**
 * MakeupCanvas — カメラ映像上にリアルタイムメイクAR + メッシュを描画するCanvas
 */

import { useEffect, useRef } from 'react';
import { FaceLandmarker } from '@mediapipe/tasks-vision';
import { useFaceLandmarkerCtx } from '../contexts/FaceLandmarkerContext.jsx';
import {
  drawLip, drawEyeshadow, drawCheek,
  drawFoundation, drawConcealer, drawBrow,
} from '../rendering/makeupRenderer.js';

// メッシュ描画用の接続定義
const FACE_OVAL    = FaceLandmarker.FACE_LANDMARKS_FACE_OVAL;
const LEFT_EYE     = FaceLandmarker.FACE_LANDMARKS_LEFT_EYE;
const RIGHT_EYE    = FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE;
const LEFT_BROW    = FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW;
const RIGHT_BROW   = FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW;
const LIPS         = FaceLandmarker.FACE_LANDMARKS_LIPS;
const TESSELATION  = FaceLandmarker.FACE_LANDMARKS_TESSELATION;

export default function MakeupCanvas({ getVideo, look, styleTab, intensity, showMesh }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const { ready, detect } = useFaceLandmarkerCtx();

  // props を ref に同期（ループ内で最新値参照）
  const propsRef = useRef({ look, styleTab, intensity, showMesh });
  useEffect(() => {
    propsRef.current = { look, styleTab, intensity, showMesh };
  }, [look, styleTab, intensity, showMesh]);

  // 前回の検出結果をキャッシュ（フレームスキップ用）
  const lastLandmarksRef = useRef(null);
  const frameCountRef = useRef(0);

  useEffect(() => {
    if (!ready) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function loop() {
      const video = getVideo();
      if (!video || !video.videoWidth) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // フレームスキップ: 2フレームに1回だけ検出（描画は毎フレーム）
      const frame = frameCountRef.current++;
      let lms = lastLandmarksRef.current;

      if (frame % 2 === 0) {
        const result = detect(video, performance.now());
        if (result?.landmarks) {
          lms = result.landmarks;
          lastLandmarksRef.current = lms;
        }
      }

      if (!lms) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const w = canvas.width;
      const h = canvas.height;
      const { look: lk, styleTab: tab, intensity: inten, showMesh: mesh } = propsRef.current;
      const opacity = (inten || 70) / 100;

      // メイク描画
      if (lk) {
        if (tab === 0) {
          if (lk.cheek)     drawCheek(ctx, lms, w, h, lk.cheek, opacity);
          if (lk.eyeshadow) drawEyeshadow(ctx, lms, w, h, lk.eyeshadow, opacity);
          if (lk.lip)       drawLip(ctx, lms, w, h, lk.lip, opacity);
        } else {
          if (lk.base)      drawFoundation(ctx, lms, w, h, lk.base, opacity);
          if (lk.concealer) drawConcealer(ctx, lms, w, h, lk.concealer, opacity);
          if (lk.brow)      drawBrow(ctx, lms, w, h, lk.brow, opacity);
          if (lk.lip)       drawLip(ctx, lms, w, h, lk.lip, opacity);
        }
      }

      // メッシュ描画
      if (mesh) {
        drawMeshOverlay(ctx, lms, w, h);
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [ready, detect, getVideo]);

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

// ============================================================
// メッシュ描画（テッセレーション + 輪郭ライン）
// ============================================================

function drawMeshOverlay(ctx, lms, w, h) {
  ctx.globalAlpha = 0.85;

  // テッセレーション（しっかり見える濃さ）
  ctx.strokeStyle = 'rgba(160, 170, 255, 0.5)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (const conn of TESSELATION) {
    const a = lms[conn.start], b = lms[conn.end];
    ctx.moveTo(a.x * w, a.y * h);
    ctx.lineTo(b.x * w, b.y * h);
  }
  ctx.stroke();

  // 輪郭ライン（太く鮮やか）
  const groups = [
    { conns: FACE_OVAL, color: '#a855f7', width: 3 },
    { conns: LEFT_EYE,  color: '#22d3ee', width: 2.5 },
    { conns: RIGHT_EYE, color: '#22d3ee', width: 2.5 },
    { conns: LEFT_BROW,  color: '#facc15', width: 2.5 },
    { conns: RIGHT_BROW, color: '#facc15', width: 2.5 },
    { conns: LIPS,       color: '#ec4899', width: 3 },
  ];

  for (const { conns, color, width } of groups) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    for (const conn of conns) {
      const a = lms[conn.start], b = lms[conn.end];
      ctx.moveTo(a.x * w, a.y * h);
      ctx.lineTo(b.x * w, b.y * h);
    }
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}
