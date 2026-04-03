import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

// MediaPipe の FACE_LANDMARKS 接続定義は FaceLandmarker の静的プロパティ
const FACE_LANDMARKS_TESSELATION  = FaceLandmarker.FACE_LANDMARKS_TESSELATION;
const FACE_LANDMARKS_RIGHT_EYE    = FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE;
const FACE_LANDMARKS_LEFT_EYE     = FaceLandmarker.FACE_LANDMARKS_LEFT_EYE;
const FACE_LANDMARKS_RIGHT_EYEBROW = FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW;
const FACE_LANDMARKS_LEFT_EYEBROW = FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW;
const FACE_LANDMARKS_FACE_OVAL    = FaceLandmarker.FACE_LANDMARKS_FACE_OVAL;
const FACE_LANDMARKS_LIPS         = FaceLandmarker.FACE_LANDMARKS_LIPS;
const FACE_LANDMARKS_RIGHT_IRIS   = FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS;
const FACE_LANDMARKS_LEFT_IRIS    = FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS;

// 描画モード定義
const DRAW_MODES = {
  mesh:     { label: 'Full Mesh',     key: 'mesh' },
  contour:  { label: 'Contours Only', key: 'contour' },
  points:   { label: 'Points',        key: 'points' },
  regions:  { label: 'Regions',       key: 'regions' },
};

export default function FaceMeshLab() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const rafRef = useRef(null);
  const streamRef = useRef(null);

  const [status, setStatus] = useState('loading'); // loading | ready | active | error
  const [drawMode, setDrawMode] = useState('mesh');
  const [showFps, setShowFps] = useState(true);
  const [opacity, setOpacity] = useState(0.6);
  const fpsRef = useRef({ frames: 0, last: performance.now(), value: 0 });

  // --- FaceLandmarker 初期化 ---
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
        );
        if (cancelled) return;

        detectorRef.current = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
          minFaceDetectionConfidence: 0.7,
          minFacePresenceConfidence: 0.7,
          minTrackingConfidence: 0.5,
        });

        if (!cancelled) setStatus('ready');
      } catch (e) {
        console.error('FaceLandmarker init failed:', e);
        if (!cancelled) setStatus('error');
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // --- カメラ起動 ---
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      video.srcObject = stream;
      video.setAttribute('playsinline', '');
      await video.play();
      setStatus('active');
    } catch (e) {
      console.error('Camera error:', e);
      setStatus('error');
    }
  }, []);

  // --- カメラ停止 ---
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  // --- メインループ（検出 + 描画） ---
  useEffect(() => {
    if (status !== 'active') return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !detectorRef.current) return;

    const ctx = canvas.getContext('2d');

    function loop() {
      if (!video.videoWidth) {
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
      const result = detectorRef.current.detectForVideo(video, performance.now());

      if (result.faceLandmarks?.length) {
        const landmarks = result.faceLandmarks[0];
        drawLandmarks(ctx, landmarks, canvas.width, canvas.height, drawMode, opacity);
      }

      // FPS
      const fps = fpsRef.current;
      fps.frames++;
      const now = performance.now();
      if (now - fps.last >= 1000) {
        fps.value = fps.frames;
        fps.frames = 0;
        fps.last = now;
      }
      if (showFps) {
        ctx.fillStyle = '#00ff00';
        ctx.font = '16px monospace';
        ctx.fillText(`${fps.value} FPS`, 10, 24);
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [status, drawMode, showFps, opacity]);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>KIREI Lab</h1>
        <span style={styles.subtitle}>Face Mesh Experiment</span>
      </header>

      <div style={styles.viewport}>
        <video
          ref={videoRef}
          style={styles.video}
          playsInline
          muted
        />
        <canvas ref={canvasRef} style={styles.canvas} />

        {status === 'loading' && (
          <div style={styles.overlay}>
            <div style={styles.spinner} />
            <p>Loading FaceLandmarker model...</p>
          </div>
        )}
        {status === 'ready' && (
          <div style={styles.overlay}>
            <button style={styles.startBtn} onClick={startCamera}>
              Start Camera
            </button>
          </div>
        )}
        {status === 'error' && (
          <div style={styles.overlay}>
            <p style={{ color: '#f87171' }}>Failed to initialize. Check console.</p>
          </div>
        )}
      </div>

      {/* コントロールパネル */}
      <div style={styles.controls}>
        <div style={styles.controlRow}>
          <label style={styles.label}>Draw Mode</label>
          <div style={styles.modeButtons}>
            {Object.values(DRAW_MODES).map(m => (
              <button
                key={m.key}
                style={{
                  ...styles.modeBtn,
                  ...(drawMode === m.key ? styles.modeBtnActive : {}),
                }}
                onClick={() => setDrawMode(m.key)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.controlRow}>
          <label style={styles.label}>Opacity: {Math.round(opacity * 100)}%</label>
          <input
            type="range" min="0.1" max="1" step="0.05"
            value={opacity}
            onChange={e => setOpacity(Number(e.target.value))}
            style={styles.slider}
          />
        </div>

        <div style={styles.controlRow}>
          <label style={styles.label}>
            <input
              type="checkbox" checked={showFps}
              onChange={e => setShowFps(e.target.checked)}
            />
            {' '}Show FPS
          </label>
        </div>
      </div>

      <div style={styles.info}>
        <p>478-point MediaPipe FaceLandmarker</p>
        <p style={{ fontSize: 11, opacity: 0.6 }}>Tesselation / Contour / Points / Region rendering modes</p>
      </div>
    </div>
  );
}

// ============================
// 描画関数
// ============================

function drawLandmarks(ctx, landmarks, w, h, mode, opacity) {
  ctx.globalAlpha = opacity;

  switch (mode) {
    case 'mesh':
      drawTesselation(ctx, landmarks, w, h);
      drawContourLines(ctx, landmarks, w, h);
      break;
    case 'contour':
      drawContourLines(ctx, landmarks, w, h);
      break;
    case 'points':
      drawPoints(ctx, landmarks, w, h);
      break;
    case 'regions':
      drawRegions(ctx, landmarks, w, h);
      break;
  }

  ctx.globalAlpha = 1;
}

// テッセレーション（三角形メッシュ）
function drawTesselation(ctx, lms, w, h) {
  ctx.strokeStyle = 'rgba(180, 180, 255, 0.3)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (const conn of FACE_LANDMARKS_TESSELATION) {
    const a = lms[conn.start];
    const b = lms[conn.end];
    ctx.moveTo(a.x * w, a.y * h);
    ctx.lineTo(b.x * w, b.y * h);
  }
  ctx.stroke();
}

// 輪郭ライン（顔・目・眉・唇・虹彩）
function drawContourLines(ctx, lms, w, h) {
  const groups = [
    { conns: FACE_LANDMARKS_FACE_OVAL, color: '#a855f7', width: 2 },
    { conns: FACE_LANDMARKS_LEFT_EYE, color: '#22d3ee', width: 1.5 },
    { conns: FACE_LANDMARKS_RIGHT_EYE, color: '#22d3ee', width: 1.5 },
    { conns: FACE_LANDMARKS_LEFT_EYEBROW, color: '#facc15', width: 1.5 },
    { conns: FACE_LANDMARKS_RIGHT_EYEBROW, color: '#facc15', width: 1.5 },
    { conns: FACE_LANDMARKS_LIPS, color: '#ec4899', width: 2 },
    { conns: FACE_LANDMARKS_LEFT_IRIS, color: '#34d399', width: 1.5 },
    { conns: FACE_LANDMARKS_RIGHT_IRIS, color: '#34d399', width: 1.5 },
  ];

  for (const { conns, color, width } of groups) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    for (const conn of conns) {
      const a = lms[conn.start];
      const b = lms[conn.end];
      ctx.moveTo(a.x * w, a.y * h);
      ctx.lineTo(b.x * w, b.y * h);
    }
    ctx.stroke();
  }
}

// ポイント描画（全478点）
function drawPoints(ctx, lms, w, h) {
  ctx.fillStyle = '#a855f7';
  for (let i = 0; i < lms.length; i++) {
    const p = lms[i];
    ctx.beginPath();
    ctx.arc(p.x * w, p.y * h, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

// リージョン（領域ごとに色分け塗りつぶし）
function drawRegions(ctx, lms, w, h) {
  const regions = [
    { conns: FACE_LANDMARKS_FACE_OVAL, color: 'rgba(168,85,247,0.15)' },
    { conns: FACE_LANDMARKS_LEFT_EYE, color: 'rgba(34,211,238,0.3)' },
    { conns: FACE_LANDMARKS_RIGHT_EYE, color: 'rgba(34,211,238,0.3)' },
    { conns: FACE_LANDMARKS_LIPS, color: 'rgba(236,72,153,0.35)' },
    { conns: FACE_LANDMARKS_LEFT_IRIS, color: 'rgba(52,211,153,0.4)' },
    { conns: FACE_LANDMARKS_RIGHT_IRIS, color: 'rgba(52,211,153,0.4)' },
  ];

  for (const { conns, color } of regions) {
    // 接続リストから順序付きポイントリストを構築
    const points = buildOrderedPoints(conns, lms, w, h);
    if (points.length < 3) continue;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.closePath();
    ctx.fill();
  }

  // 輪郭線も重ねる
  drawContourLines(ctx, lms, w, h);
}

// 接続リストから順序付きポイント列を構築
function buildOrderedPoints(connections, lms, w, h) {
  if (!connections || connections.length === 0) return [];

  // 隣接リスト構築
  const adj = new Map();
  for (const conn of connections) {
    if (!adj.has(conn.start)) adj.set(conn.start, []);
    if (!adj.has(conn.end)) adj.set(conn.end, []);
    adj.get(conn.start).push(conn.end);
    adj.get(conn.end).push(conn.start);
  }

  // 最初の接続から辿る
  const visited = new Set();
  const ordered = [];
  let current = connections[0].start;

  while (current !== undefined && !visited.has(current)) {
    visited.add(current);
    const p = lms[current];
    ordered.push([p.x * w, p.y * h]);

    const neighbors = adj.get(current) || [];
    current = neighbors.find(n => !visited.has(n));
  }

  return ordered;
}

// ============================
// スタイル
// ============================

const styles = {
  container: {
    fontFamily: '"Noto Sans JP", sans-serif',
    background: '#0f0f1a',
    color: '#e2e8f0',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px',
    margin: 0,
  },
  header: {
    textAlign: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    background: 'linear-gradient(135deg, #a855f7, #ec4899)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0,
  },
  subtitle: {
    fontSize: 13,
    opacity: 0.5,
  },
  viewport: {
    position: 'relative',
    width: '100%',
    maxWidth: 640,
    aspectRatio: '4/3',
    background: '#000',
    borderRadius: 12,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: 'scaleX(-1)',
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    transform: 'scaleX(-1)',
    pointerEvents: 'none',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.7)',
    gap: 12,
  },
  spinner: {
    width: 40,
    height: 40,
    border: '3px solid rgba(168,85,247,0.3)',
    borderTop: '3px solid #a855f7',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  startBtn: {
    padding: '12px 32px',
    fontSize: 16,
    fontWeight: 600,
    color: '#fff',
    background: 'linear-gradient(135deg, #a855f7, #ec4899)',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  },
  controls: {
    width: '100%',
    maxWidth: 640,
    marginTop: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  controlRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  label: {
    fontSize: 13,
    fontWeight: 500,
    minWidth: 80,
  },
  modeButtons: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
  },
  modeBtn: {
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 500,
    color: '#94a3b8',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6,
    cursor: 'pointer',
  },
  modeBtnActive: {
    color: '#fff',
    background: 'rgba(168,85,247,0.3)',
    borderColor: '#a855f7',
  },
  slider: {
    flex: 1,
    accentColor: '#a855f7',
  },
  info: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 12,
    opacity: 0.4,
  },
};

// スピナーアニメーション用のグローバルCSS注入
if (typeof document !== 'undefined' && !document.getElementById('lab-styles')) {
  const style = document.createElement('style');
  style.id = 'lab-styles';
  style.textContent = `
    @keyframes spin { to { transform: rotate(360deg); } }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { margin: 0; background: #0f0f1a; }
  `;
  document.head.appendChild(style);
}
