/**
 * MakeupCanvas — カメラ映像上にリアルタイムメイクAR + メッシュを描画するCanvas
 */

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { FaceLandmarker } from '@mediapipe/tasks-vision';
import { useFaceLandmarkerCtx } from '../contexts/FaceLandmarkerContext.jsx';
import {
  drawLip, drawEyeshadow, drawCheek,
  drawFoundation, drawConcealer, drawBrow,
  drawGlasses, drawEarrings, drawContactLens, drawLashes,
} from '../rendering/makeupRenderer.js';

// メッシュ描画用の接続定義
const FACE_OVAL    = FaceLandmarker.FACE_LANDMARKS_FACE_OVAL;
const LEFT_EYE     = FaceLandmarker.FACE_LANDMARKS_LEFT_EYE;
const RIGHT_EYE    = FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE;
const LEFT_BROW    = FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW;
const RIGHT_BROW   = FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW;
const LIPS         = FaceLandmarker.FACE_LANDMARKS_LIPS;
const TESSELATION  = FaceLandmarker.FACE_LANDMARKS_TESSELATION;

const MakeupCanvas = forwardRef(function MakeupCanvas({ getVideo, baseLook, colorLook, intensity, showMesh, glassesItem, earringItem, contactLensItem, lashesItem, coverFit }, ref) {
  const canvasRef = useRef(null);
  useImperativeHandle(ref, () => canvasRef.current);
  const rafRef = useRef(null);
  const { ready, detect } = useFaceLandmarkerCtx();

  // props を ref に同期（ループ内で最新値参照）
  const propsRef = useRef({ baseLook, colorLook, intensity, showMesh, glassesItem, earringItem, contactLensItem, lashesItem, coverFit });
  useEffect(() => {
    propsRef.current = { baseLook, colorLook, intensity, showMesh, glassesItem, earringItem, contactLensItem, lashesItem, coverFit };
  }, [baseLook, colorLook, intensity, showMesh, glassesItem, earringItem, contactLensItem, lashesItem, coverFit]);

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

      // coverFit: match canvas CSS to objectFit:cover positioning
      if (propsRef.current.coverFit && canvas.parentElement) {
        const cW = canvas.parentElement.clientWidth;
        const cH = canvas.parentElement.clientHeight;
        const vA = video.videoWidth / video.videoHeight;
        const cA = cW / cH;
        let dW, dH;
        if (cA > vA) {
          dW = cW; dH = cW / vA;
        } else {
          dH = cH; dW = cH * vA;
        }
        canvas.style.width = dW + 'px';
        canvas.style.height = dH + 'px';
        canvas.style.left = ((cW - dW) / 2) + 'px';
        canvas.style.top = ((cH - dH) / 2) + 'px';
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // フレームスキップ: 2フレームに1回だけ検出（描画は毎フレーム）
      const frame = frameCountRef.current++;
      let lms = lastLandmarksRef.current;

      if (frame % 2 === 0) {
        const result = detect(video, performance.now());
        // 顔未検出（空配列）の場合はキャッシュをクリア
        lms = (result?.landmarks?.length > 0) ? result.landmarks : null;
        lastLandmarksRef.current = lms;
      }

      if (!lms) {
        // 顔なし → clearRect済みのまま次フレームへ
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const w = canvas.width;
      const h = canvas.height;
      const { baseLook: base, colorLook: color, intensity: inten, showMesh: mesh,
              glassesItem: glasses, earringItem: earring, contactLensItem: contactLens, lashesItem: lashes } = propsRef.current;
      const opacity = (inten || 70) / 100;

      // Layer 1: ベース（ファンデ・コンシーラー・眉）
      if (base) {
        if (base.base)      drawFoundation(ctx, lms, w, h, base.base, opacity);
        if (base.concealer) drawConcealer(ctx, lms, w, h, base.concealer, opacity);
        if (base.brow)      drawBrow(ctx, lms, w, h, base.brow, opacity);
      }

      // Layer 2: カラー（アイシャドウ・チーク・リップ）
      if (color) {
        if (color.cheek)     drawCheek(ctx, lms, w, h, color.cheek, opacity);
        if (color.eyeshadow) drawEyeshadow(ctx, lms, w, h, color.eyeshadow, opacity);
        if (color.lip)       drawLip(ctx, lms, w, h, color.lip, opacity);
      }

      // Layer 3: アクセサリー描画
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      drawGlasses(ctx, lms, glasses, w, h);
      drawEarrings(ctx, lms, earring, w, h);
      drawContactLens(ctx, lms, contactLens, w, h, opacity);
      drawLashes(ctx, lms, lashes, w, h, opacity);

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
});

export default MakeupCanvas;

// ============================================================
// メッシュ描画（テッセレーション + 輪郭ライン）
// ============================================================

function drawMeshOverlay(ctx, lms, w, h) {
  // Canvas has CSS scaleX(-1), so use raw coordinates
  const mx = (lm) => lm.x * w;
  const my = (lm) => lm.y * h;

  ctx.globalAlpha = 0.85;

  // テッセレーション（しっかり見える濃さ）
  ctx.strokeStyle = 'rgba(160, 170, 255, 0.5)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (const conn of TESSELATION) {
    const a = lms[conn.start], b = lms[conn.end];
    ctx.moveTo(mx(a), my(a));
    ctx.lineTo(mx(b), my(b));
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
      ctx.moveTo(mx(a), my(a));
      ctx.lineTo(mx(b), my(b));
    }
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}
