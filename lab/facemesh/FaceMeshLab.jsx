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
  off:      { label: 'OFF',           key: 'off' },
};

// メイクARの定義
const MAKEUP_ITEMS = {
  lip:        { label: 'Lip',        emoji: '💋', color: '#e8396b' },
  eyeshadow:  { label: 'Eye Shadow', emoji: '👁', color: '#b07cd8' },
  foundation: { label: 'Foundation', emoji: '✨', color: '#e8b87a' },
};

// メイクARカラープリセット
const LIP_COLORS = ['#e8396b', '#c2185b', '#d4456a', '#a83250', '#ff6b8a', '#8b2252'];
const EYESHADOW_COLORS = ['#b07cd8', '#7c5cbf', '#d4a0e8', '#5c4a8a', '#e8a0c8', '#4a6fa0'];
const FOUNDATION_COLORS = ['#e8b87a', '#d4a06a', '#f0c896', '#c8946a', '#f5d4a8', '#b88a5a'];

// ===========================
// 唇の内側ランドマーク（上唇内側 + 下唇内側で閉じた領域）
// ===========================
const UPPER_LIP_OUTER = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291];
const LOWER_LIP_OUTER = [291, 375, 321, 405, 314, 17, 84, 181, 91, 146, 61];
const UPPER_LIP_INNER = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308];
const LOWER_LIP_INNER = [308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78];

// ===========================
// アイシャドウ用ランドマーク（目の上の領域）
// ===========================
// 左目の上側 — 眉下～まぶたの領域
const LEFT_EYESHADOW = [
  // 上まぶたのライン（外→内）
  263, 466, 388, 387, 386, 385, 384, 398,
  // 眉の下ライン（内→外）に沿って戻る
  362, 382, 381, 380, 374, 373, 390, 249, 263,
];
// 右目の上側
const RIGHT_EYESHADOW = [
  33, 246, 161, 160, 159, 158, 157, 173,
  133, 155, 154, 153, 145, 144, 163, 7, 33,
];

export default function FaceMeshLab() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const rafRef = useRef(null);
  const streamRef = useRef(null);

  const [status, setStatus] = useState('loading');
  const [drawMode, setDrawMode] = useState('mesh');
  const [showFps, setShowFps] = useState(true);
  const [opacity, setOpacity] = useState(0.6);
  const fpsRef = useRef({ frames: 0, last: performance.now(), value: 0 });

  // メイクAR state
  const [makeupActive, setMakeupActive] = useState({ lip: false, eyeshadow: false, foundation: false });
  const [makeupColors, setMakeupColors] = useState({
    lip: LIP_COLORS[0],
    eyeshadow: EYESHADOW_COLORS[0],
    foundation: FOUNDATION_COLORS[0],
  });

  // メイク設定をrefに保持（ループ内で最新値を参照するため）
  const makeupRef = useRef({ active: makeupActive, colors: makeupColors });
  useEffect(() => {
    makeupRef.current = { active: makeupActive, colors: makeupColors };
  }, [makeupActive, makeupColors]);

  const toggleMakeup = (key) => {
    setMakeupActive(prev => ({ ...prev, [key]: !prev[key] }));
  };

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

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const result = detectorRef.current.detectForVideo(video, performance.now());

      if (result.faceLandmarks?.length) {
        const landmarks = result.faceLandmarks[0];
        const w = canvas.width;
        const h = canvas.height;

        // メッシュ描画（OFFでなければ）
        if (drawMode !== 'off') {
          drawLandmarks(ctx, landmarks, w, h, drawMode, opacity);
        }

        // メイクAR描画
        const mk = makeupRef.current;
        if (mk.active.foundation) {
          drawFoundation(ctx, landmarks, w, h, mk.colors.foundation, opacity);
        }
        if (mk.active.eyeshadow) {
          drawEyeshadow(ctx, landmarks, w, h, mk.colors.eyeshadow, opacity);
        }
        if (mk.active.lip) {
          drawLip(ctx, landmarks, w, h, mk.colors.lip, opacity);
        }
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

  const anyMakeupActive = makeupActive.lip || makeupActive.eyeshadow || makeupActive.foundation;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>KIREI Lab</h1>
        <span style={styles.subtitle}>Face Mesh + Makeup AR</span>
      </header>

      <div style={styles.viewport}>
        <video ref={videoRef} style={styles.video} playsInline muted />
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

      {/* メイクARボタン */}
      <div style={styles.controls}>
        <div style={styles.controlRow}>
          <label style={styles.label}>Makeup AR</label>
          <div style={styles.modeButtons}>
            {Object.entries(MAKEUP_ITEMS).map(([key, item]) => (
              <button
                key={key}
                style={{
                  ...styles.makeupBtn,
                  ...(makeupActive[key] ? {
                    color: '#fff',
                    background: item.color + '40',
                    borderColor: item.color,
                    boxShadow: `0 0 12px ${item.color}60`,
                  } : {}),
                }}
                onClick={() => toggleMakeup(key)}
              >
                {item.emoji} {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* カラーピッカー（アクティブなメイクのみ表示） */}
        {makeupActive.lip && (
          <ColorPicker
            label="Lip Color"
            colors={LIP_COLORS}
            selected={makeupColors.lip}
            onSelect={c => setMakeupColors(p => ({ ...p, lip: c }))}
          />
        )}
        {makeupActive.eyeshadow && (
          <ColorPicker
            label="Eye Shadow"
            colors={EYESHADOW_COLORS}
            selected={makeupColors.eyeshadow}
            onSelect={c => setMakeupColors(p => ({ ...p, eyeshadow: c }))}
          />
        )}
        {makeupActive.foundation && (
          <ColorPicker
            label="Foundation"
            colors={FOUNDATION_COLORS}
            selected={makeupColors.foundation}
            onSelect={c => setMakeupColors(p => ({ ...p, foundation: c }))}
          />
        )}

        <div style={{ ...styles.controlRow, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
          <label style={styles.label}>Mesh</label>
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
    </div>
  );
}

// ============================
// カラーピッカーコンポーネント
// ============================

function ColorPicker({ label, colors, selected, onSelect }) {
  return (
    <div style={styles.controlRow}>
      <label style={{ ...styles.label, fontSize: 11, opacity: 0.7 }}>{label}</label>
      <div style={{ display: 'flex', gap: 6 }}>
        {colors.map(c => (
          <button
            key={c}
            onClick={() => onSelect(c)}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: c,
              border: selected === c ? '2px solid #fff' : '2px solid transparent',
              cursor: 'pointer',
              boxShadow: selected === c ? `0 0 8px ${c}` : 'none',
              transition: 'all 0.15s',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ============================
// メイクAR描画関数
// ============================

function drawLip(ctx, lms, w, h, color, opacity) {
  ctx.save();
  ctx.globalAlpha = opacity * 0.65;
  ctx.globalCompositeOperation = 'multiply';

  // 外側唇を塗りつぶし
  fillLandmarkPath(ctx, lms, UPPER_LIP_OUTER.concat(LOWER_LIP_OUTER.slice(1)), w, h, color);

  // 内側はより濃く
  ctx.globalAlpha = opacity * 0.4;
  ctx.globalCompositeOperation = 'multiply';
  fillLandmarkPath(ctx, lms, UPPER_LIP_INNER.concat(LOWER_LIP_INNER.slice(1)), w, h, color);

  // ハイライト（唇中央の上部に薄い白）
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = opacity * 0.15;
  const centerTop = lms[13]; // 上唇中央
  const centerBot = lms[14]; // 下唇中央
  const cx = centerTop.x * w;
  const cy = (centerTop.y * h + centerBot.y * h) * 0.45; // やや上寄り
  const rx = Math.abs(lms[291].x - lms[61].x) * w * 0.3;
  const ry = Math.abs(centerBot.y - centerTop.y) * h * 0.3;

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
  grad.addColorStop(0, 'rgba(255,255,255,0.6)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawEyeshadow(ctx, lms, w, h, color, opacity) {
  ctx.save();

  // グラデーションで自然な見た目
  for (const indices of [LEFT_EYESHADOW, RIGHT_EYESHADOW]) {
    // 領域の中心と範囲を計算
    let cx = 0, cy = 0, minY = Infinity, maxY = -Infinity;
    for (const i of indices) {
      cx += lms[i].x; cy += lms[i].y;
      minY = Math.min(minY, lms[i].y);
      maxY = Math.max(maxY, lms[i].y);
    }
    cx = (cx / indices.length) * w;
    cy = (cy / indices.length) * h;

    // 上方向にグラデーション
    const grad = ctx.createLinearGradient(cx, minY * h, cx, maxY * h);
    grad.addColorStop(0, color + 'B0');   // 上は濃い
    grad.addColorStop(0.6, color + '60'); // 下に向かって薄く
    grad.addColorStop(1, color + '10');

    ctx.globalAlpha = opacity * 0.55;
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = grad;

    ctx.beginPath();
    const first = indices[0];
    ctx.moveTo(lms[first].x * w, lms[first].y * h);
    for (let i = 1; i < indices.length; i++) {
      ctx.lineTo(lms[indices[i]].x * w, lms[indices[i]].y * h);
    }
    ctx.closePath();
    ctx.fill();

    // シマー効果（ラメ感）
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = opacity * 0.12;
    const shimmer = ctx.createRadialGradient(cx, cy, 0, cx, cy, (maxY - minY) * h * 0.8);
    shimmer.addColorStop(0, 'rgba(255,255,255,0.5)');
    shimmer.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shimmer;
    ctx.beginPath();
    ctx.moveTo(lms[first].x * w, lms[first].y * h);
    for (let i = 1; i < indices.length; i++) {
      ctx.lineTo(lms[indices[i]].x * w, lms[indices[i]].y * h);
    }
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function drawFoundation(ctx, lms, w, h, color, opacity) {
  ctx.save();

  // Face Oval の接続からポイントリストを構築
  const points = buildOrderedPoints(FACE_LANDMARKS_FACE_OVAL, lms, w, h);
  if (points.length < 3) { ctx.restore(); return; }

  // 中心を計算
  let cx = 0, cy = 0;
  for (const [px, py] of points) { cx += px; cy += py; }
  cx /= points.length;
  cy /= points.length;

  // 放射状グラデーション（中心が濃く、輪郭に向かって薄く）
  const maxR = Math.max(...points.map(([px, py]) =>
    Math.sqrt((px - cx) ** 2 + (py - cy) ** 2)
  ));

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
  grad.addColorStop(0, color + '50');
  grad.addColorStop(0.6, color + '35');
  grad.addColorStop(0.85, color + '18');
  grad.addColorStop(1, color + '00');

  ctx.globalAlpha = opacity * 0.45;
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = grad;

  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0], points[i][1]);
  }
  ctx.closePath();
  ctx.fill();

  // ソフトフォーカス効果
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = opacity * 0.08;
  const soft = ctx.createRadialGradient(cx, cy * 0.95, 0, cx, cy, maxR * 0.7);
  soft.addColorStop(0, 'rgba(255,255,255,0.3)');
  soft.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = soft;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0], points[i][1]);
  }
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// ヘルパー: ランドマークインデックス配列からパスを塗りつぶし
function fillLandmarkPath(ctx, lms, indices, w, h, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(lms[indices[0]].x * w, lms[indices[0]].y * h);
  for (let i = 1; i < indices.length; i++) {
    ctx.lineTo(lms[indices[i]].x * w, lms[indices[i]].y * h);
  }
  ctx.closePath();
  ctx.fill();
}

// ============================
// メッシュ描画関数
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

function drawPoints(ctx, lms, w, h) {
  ctx.fillStyle = '#a855f7';
  for (let i = 0; i < lms.length; i++) {
    const p = lms[i];
    ctx.beginPath();
    ctx.arc(p.x * w, p.y * h, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

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

  drawContourLines(ctx, lms, w, h);
}

function buildOrderedPoints(connections, lms, w, h) {
  if (!connections || connections.length === 0) return [];

  const adj = new Map();
  for (const conn of connections) {
    if (!adj.has(conn.start)) adj.set(conn.start, []);
    if (!adj.has(conn.end)) adj.set(conn.end, []);
    adj.get(conn.start).push(conn.end);
    adj.get(conn.end).push(conn.start);
  }

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
  makeupBtn: {
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 600,
    color: '#94a3b8',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  slider: {
    flex: 1,
    accentColor: '#a855f7',
  },
};

// グローバルCSS
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
