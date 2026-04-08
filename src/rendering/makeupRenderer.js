/**
 * makeupRenderer.js — メイクAR描画モジュール
 *
 * MediaPipe FaceLandmarker の 478 点ランドマークを使い、
 * Canvas2D 上にリアルタイムでメイクオーバーレイを描画する。
 *
 * lab/facemesh/FaceMeshLab.jsx で実証済みのアルゴリズムを
 * 本体アプリ用に整理・拡張したもの。
 */

import { FaceLandmarker } from '@mediapipe/tasks-vision';

// ============================================================
// 座標変換ヘルパー
// ============================================================
// Canvas要素にCSS scaleX(-1)が適用されているため、
// JS側ではMediaPipeの座標をそのまま使用する（CSS側でミラー反転される）
const lmX = (lm, w) => lm.x * w;
const lmY = (lm, h) => lm.y * h;

// ============================================================
// ランドマーク定数
// ============================================================

// 唇（外側・内側）
const UPPER_LIP_OUTER = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291];
const LOWER_LIP_OUTER = [291, 375, 321, 405, 314, 17, 84, 181, 91, 146, 61];
const UPPER_LIP_INNER = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308];
const LOWER_LIP_INNER = [308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78];

// アイシャドウ（眉下～上まぶたクリース、白目に被らない）
const LEFT_EYESHADOW = [
  263, 466, 388, 387, 386, 385, 384, 398,
  336, 296, 334, 293, 300, 383, 372, 345, 352, 263,
];
const RIGHT_EYESHADOW = [
  33, 246, 161, 160, 159, 158, 157, 173,
  107, 66, 105, 63, 70, 156, 143, 116, 123, 33,
];

// 目の開口部（ファンデーションくり抜き用）
const RIGHT_EYE_HOLE = [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7];
const LEFT_EYE_HOLE  = [362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381, 382];

// コンシーラー（目の下クマ領域）
const LEFT_UNDEREYE = [463, 341, 256, 252, 253, 254, 339, 255, 359, 467, 463];
const RIGHT_UNDEREYE = [243, 112, 26, 22, 23, 24, 110, 25, 130, 247, 243];

// Face Oval / 眉（MediaPipe 静的プロパティ）
const FACE_OVAL = FaceLandmarker.FACE_LANDMARKS_FACE_OVAL;
const LEFT_EYEBROW = FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW;
const RIGHT_EYEBROW = FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW;

// ============================================================
// カラーパース
// ============================================================

/**
 * hex('#e8607c') or rgba('rgba(232,96,124,0.25)') → { hex: '#e8607c', alpha: 1 }
 */
export function parseColor(str) {
  if (!str) return { hex: '#888888', alpha: 0 };

  // hex
  if (str.startsWith('#')) return { hex: str.slice(0, 7), alpha: 1 };

  // rgba(r,g,b,a)
  const m = str.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\)/);
  if (m) {
    const r = Number(m[1]).toString(16).padStart(2, '0');
    const g = Number(m[2]).toString(16).padStart(2, '0');
    const b = Number(m[3]).toString(16).padStart(2, '0');
    return { hex: `#${r}${g}${b}`, alpha: m[4] !== undefined ? Number(m[4]) : 1 };
  }

  return { hex: str, alpha: 1 };
}

// ============================================================
// メイク描画関数
// ============================================================

/**
 * リップ — 外唇リングから内唇をくり抜き、口の中は塗らない
 */
export function drawLip(ctx, lms, w, h, colorStr, opacity) {
  const { hex, alpha } = parseColor(colorStr);
  const opa = opacity * alpha;
  ctx.save();

  const upperInner = [...UPPER_LIP_INNER].reverse();
  const lowerInner = [...LOWER_LIP_INNER].reverse();

  const traceLipRing = () => {
    ctx.beginPath();
    // 上唇リング
    ctx.moveTo(lmX(lms[UPPER_LIP_OUTER[0]], w), lmY(lms[UPPER_LIP_OUTER[0]], h));
    for (let i = 1; i < UPPER_LIP_OUTER.length; i++) {
      ctx.lineTo(lmX(lms[UPPER_LIP_OUTER[i]], w), lmY(lms[UPPER_LIP_OUTER[i]], h));
    }
    for (const idx of upperInner) {
      ctx.lineTo(lmX(lms[idx], w), lmY(lms[idx], h));
    }
    ctx.closePath();
    // 下唇リング
    ctx.moveTo(lmX(lms[LOWER_LIP_OUTER[0]], w), lmY(lms[LOWER_LIP_OUTER[0]], h));
    for (let i = 1; i < LOWER_LIP_OUTER.length; i++) {
      ctx.lineTo(lmX(lms[LOWER_LIP_OUTER[i]], w), lmY(lms[LOWER_LIP_OUTER[i]], h));
    }
    for (const idx of lowerInner) {
      ctx.lineTo(lmX(lms[idx], w), lmY(lms[idx], h));
    }
    ctx.closePath();
  };

  // ベースカラー
  ctx.globalAlpha = opa * 0.35;
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = hex;
  traceLipRing();
  ctx.fill();

  // ティント
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = opa * 0.4;
  ctx.fillStyle = hex;
  traceLipRing();
  ctx.fill();

  // ハイライト
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = opa * 0.18;
  const topLip = lms[13], botLip = lms[14];
  const cx = (lmX(topLip, w) + lmX(botLip, w)) * 0.5;
  const cy = lmY(botLip, h) * 0.65 + lmY(topLip, h) * 0.35;
  const rx = Math.abs(lmX(lms[291], w) - lmX(lms[61], w)) * 0.25;
  const ry = Math.abs(lmY(botLip, h) - lmY(topLip, h)) * 0.25;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
  grad.addColorStop(0, 'rgba(255,255,255,0.5)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.15)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * アイシャドウ — 眉下～上まぶたクリースにグラデーション + シマー
 */
export function drawEyeshadow(ctx, lms, w, h, colorStr, opacity) {
  const { hex, alpha } = parseColor(colorStr);
  const opa = opacity * alpha;
  ctx.save();

  for (const indices of [LEFT_EYESHADOW, RIGHT_EYESHADOW]) {
    let cx = 0, cy = 0, minY = Infinity, maxY = -Infinity;
    for (const i of indices) {
      cx += lms[i].x; cy += lms[i].y;
      minY = Math.min(minY, lms[i].y);
      maxY = Math.max(maxY, lms[i].y);
    }
    cx = (cx / indices.length) * w;
    cy = (cy / indices.length) * h;

    const grad = ctx.createLinearGradient(cx, minY * h, cx, maxY * h);
    grad.addColorStop(0, hex + 'B0');
    grad.addColorStop(0.6, hex + '60');
    grad.addColorStop(1, hex + '10');

    ctx.globalAlpha = opa * 0.55;
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = grad;

    traceIndices(ctx, lms, indices, w, h);
    ctx.fill();

    // シマー
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = opa * 0.12;
    const shimmer = ctx.createRadialGradient(cx, cy, 0, cx, cy, (maxY - minY) * h * 0.8);
    shimmer.addColorStop(0, 'rgba(255,255,255,0.5)');
    shimmer.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shimmer;
    traceIndices(ctx, lms, indices, w, h);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * チーク — 頬骨位置を計算で求めて楕円グラデーション
 * 頬の中心 = 目尻と口角の中間点を外側にオフセット
 */
export function drawCheek(ctx, lms, w, h, colorStr, opacity) {
  const { hex, alpha } = parseColor(colorStr);
  const opa = opacity * alpha;

  const eyeW = Math.abs(lmX(lms[133], w) - lmX(lms[33], w));
  const rw = Math.max(eyeW * 0.7, 14);
  const rh = rw * 0.55;

  // 頬中心を計算: 目尻(#33/#263)と口角(#61/#291)の中間点を外側にシフト
  const cheeks = [
    { eye: lms[33],  mouth: lms[61],  ear: lms[234] }, // 右頬
    { eye: lms[263], mouth: lms[291], ear: lms[454] }, // 左頬
  ];

  for (const { eye, mouth, ear } of cheeks) {
    // 目尻と口角の中間点
    const midX = (lmX(eye, w) + lmX(mouth, w)) / 2;
    const midY = (lmY(eye, h) + lmY(mouth, h)) / 2;
    // 耳方向に20%オフセット（頬骨の位置に寄せる）
    const cx = midX + (lmX(ear, w) - midX) * 0.2;
    const cy = midY;

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = opa * 0.35;

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rw);
    grad.addColorStop(0, hex);
    grad.addColorStop(0.5, hex + 'A0');
    grad.addColorStop(1, hex + '00');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.ellipse(cx, cy, rw, rh, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * おでこ拡張: フェイスオーバルの上部ポイントを生え際方向にシフト
 * MediaPipeの標準オーバルは眉上付近(#10)までしかカバーしないため、
 * 顔の高さの18%分だけ上方向にオフセットして生え際まで拡張する
 */
function expandForehead(points, lms, w, h) {
  const foreheadY = lmY(lms[10], h);
  const chinY = lmY(lms[152], h);
  const faceHeight = Math.abs(chinY - foreheadY);
  const expandAmount = faceHeight * 0.10;
  // 上部5%以内のポイントのみ検出してシフト
  const topY = Math.min(...points.map(p => p[1]));
  const threshold = topY + faceHeight * 0.06;

  return points.map(([x, y]) => {
    if (y < threshold) {
      // シフト量は上端に近いほど大きく
      const ratio = 1 - (y - topY) / (threshold - topY);
      return [x, y - expandAmount * ratio];
    }
    return [x, y];
  });
}

/**
 * ファンデーション — Face Oval全体のカバー + Tゾーン&頬ハイライト
 */
export function drawFoundation(ctx, lms, w, h, colorStr, opacity) {
  const { hex, alpha } = parseColor(colorStr);
  const opa = opacity * alpha;
  ctx.save();

  const points = buildOrderedPoints(FACE_OVAL, lms, w, h);
  if (points.length < 3) { ctx.restore(); return; }

  let cx = 0, cy = 0;
  for (const [px, py] of points) { cx += px; cy += py; }
  cx /= points.length;
  cy /= points.length;

  const maxR = Math.max(...points.map(([px, py]) =>
    Math.sqrt((px - cx) ** 2 + (py - cy) ** 2)
  ));

  const tracePath = () => {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.closePath();
  };

  // ベースカバー（clipされた領域内のみ描画される）
  const base = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
  base.addColorStop(0, hex + '80');
  base.addColorStop(0.5, hex + '65');
  base.addColorStop(0.8, hex + '40');
  base.addColorStop(1, hex + '00');
  ctx.globalAlpha = opa * 0.5;
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = base;
  tracePath(); ctx.fill();

  // ティント
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = opa * 0.3;
  const tint = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.9);
  tint.addColorStop(0, hex + '70');
  tint.addColorStop(0.7, hex + '30');
  tint.addColorStop(1, hex + '00');
  ctx.fillStyle = tint;
  tracePath(); ctx.fill();

  // Tゾーン + 頬ハイライト
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = opa * 0.2;
  const nose = lms[4], forehead = lms[10];
  const tZone = ctx.createLinearGradient(lmX(forehead, w), lmY(forehead, h), lmX(nose, w), lmY(nose, h));
  tZone.addColorStop(0, 'rgba(255,255,255,0.35)');
  tZone.addColorStop(0.5, 'rgba(255,255,255,0.2)');
  tZone.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = tZone;
  tracePath(); ctx.fill();

  ctx.globalAlpha = opa * 0.15;
  for (const cheekIdx of [234, 454]) {
    const cheek = lms[cheekIdx];
    const cr = maxR * 0.25;
    const cheekGrad = ctx.createRadialGradient(lmX(cheek, w), lmY(cheek, h), 0, lmX(cheek, w), lmY(cheek, h), cr);
    cheekGrad.addColorStop(0, 'rgba(255,255,255,0.4)');
    cheekGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = cheekGrad;
    tracePath(); ctx.fill();
  }

  ctx.restore();
}

/**
 * 眉ティント — 眉の上下ラインの間をソフトに塗りつぶし
 * 眉の内側80%のみ描画（外端を切り落とし自然な長さに）
 */
// 眉の上辺・下辺ランドマーク（内→外の順）
const RIGHT_BROW_TOP = [107, 66, 105, 63, 70];
const RIGHT_BROW_BOT = [107, 55, 65, 52, 53];
const LEFT_BROW_TOP  = [336, 296, 334, 293, 300];
const LEFT_BROW_BOT  = [336, 285, 295, 282, 283];

export function drawBrow(ctx, lms, w, h, colorStr, opacity) {
  const { hex, alpha } = parseColor(colorStr);
  const opa = opacity * alpha;

  const browPairs = [
    { top: RIGHT_BROW_TOP, bot: RIGHT_BROW_BOT },
    { top: LEFT_BROW_TOP,  bot: LEFT_BROW_BOT },
  ];

  for (const { top, bot } of browPairs) {
    // 内側80%のみ使う（外端カット）
    const useCount = Math.max(3, Math.ceil(top.length * 0.8));
    const topPts = top.slice(0, useCount).map(i => [lmX(lms[i], w), lmY(lms[i], h)]);
    const botPts = bot.slice(0, useCount).map(i => [lmX(lms[i], w), lmY(lms[i], h)]);

    // 上辺→下辺（逆順）で閉じたポリゴン
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = opa * 0.35;
    ctx.fillStyle = hex;

    ctx.beginPath();
    ctx.moveTo(topPts[0][0], topPts[0][1]);
    for (let i = 1; i < topPts.length; i++) ctx.lineTo(topPts[i][0], topPts[i][1]);
    for (let i = botPts.length - 1; i >= 0; i--) ctx.lineTo(botPts[i][0], botPts[i][1]);
    ctx.closePath();
    ctx.fill();

    // ソフトエッジ: 同じパスを少し大きく、低alphaで重ねる
    ctx.globalAlpha = opa * 0.15;
    ctx.beginPath();
    ctx.moveTo(topPts[0][0], topPts[0][1] - 2);
    for (let i = 1; i < topPts.length; i++) ctx.lineTo(topPts[i][0], topPts[i][1] - 2);
    for (let i = botPts.length - 1; i >= 0; i--) ctx.lineTo(botPts[i][0], botPts[i][1] + 2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

/**
 * コンシーラー — 目の下の領域に放射状パッチ
 */
export function drawConcealer(ctx, lms, w, h, colorStr, opacity) {
  const { hex, alpha } = parseColor(colorStr);
  const opa = opacity * alpha;
  ctx.save();

  for (const indices of [LEFT_UNDEREYE, RIGHT_UNDEREYE]) {
    ctx.globalAlpha = opa * 0.35;
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = hex + '60';

    traceIndices(ctx, lms, indices, w, h);
    ctx.fill();

    // 明るさ追加
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = opa * 0.15;

    let cx = 0, cy = 0;
    for (const i of indices) { cx += lms[i].x; cy += lms[i].y; }
    cx = (cx / indices.length) * w;
    cy = (cy / indices.length) * h;

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 20);
    grad.addColorStop(0, 'rgba(255,255,255,0.4)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    traceIndices(ctx, lms, indices, w, h);
    ctx.fill();
  }

  ctx.restore();
}

// ============================================================
// アクセサリー描画関数
// ============================================================

/**
 * メガネ — 鼻梁 #6, 左耳 #234, 右耳 #454
 */
export function drawGlasses(ctx, landmarks, item, canvasW, canvasH) {
  if (!item || item.id === 'none') return;

  const nose    = landmarks[6];
  const leftEar = landmarks[234];
  const rightEar = landmarks[454];

  const cx = lmX(nose, canvasW);
  const cy = lmY(nose, canvasH);
  const frameWidth  = Math.abs(lmX(rightEar, canvasW) - lmX(leftEar, canvasW)) * 1.1;
  const frameHeight = frameWidth * 0.38;
  const lw = frameWidth * 0.03;

  ctx.save();
  ctx.strokeStyle = item.color;
  ctx.lineWidth = lw;

  const lensR = frameWidth * 0.23;
  const lensW = frameWidth * 0.43;
  const lensH = frameHeight * 0.92;

  // テンプル（つる）
  ctx.beginPath();
  ctx.moveTo(cx - frameWidth * 0.5 + lw, cy);
  ctx.lineTo(lmX(leftEar, canvasW), lmY(leftEar, canvasH));
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx + frameWidth * 0.5 - lw, cy);
  ctx.lineTo(lmX(rightEar, canvasW), lmY(rightEar, canvasH));
  ctx.stroke();

  // ブリッジ
  ctx.beginPath();
  ctx.moveTo(cx - frameWidth * 0.07, cy);
  ctx.lineTo(cx + frameWidth * 0.07, cy);
  ctx.stroke();

  // レンズ描画
  const drawLens = (lx, ly) => {
    if (item.shape === 'round') {
      ctx.beginPath();
      ctx.arc(lx, ly, lensR, 0, Math.PI * 2);
    } else if (item.shape === 'oval') {
      ctx.beginPath();
      ctx.ellipse(lx, ly, lensR * 1.15, lensR * 0.75, 0, 0, Math.PI * 2);
    } else {
      // square / wayfarer: 角丸矩形
      const r = item.shape === 'wayfarer' ? lensH * 0.15 : lensH * 0.08;
      const x0 = lx - lensW / 2, y0 = ly - lensH / 2;
      ctx.beginPath();
      ctx.moveTo(x0 + r, y0);
      ctx.lineTo(x0 + lensW - r, y0);
      ctx.quadraticCurveTo(x0 + lensW, y0, x0 + lensW, y0 + r);
      ctx.lineTo(x0 + lensW, y0 + lensH - r);
      ctx.quadraticCurveTo(x0 + lensW, y0 + lensH, x0 + lensW - r, y0 + lensH);
      ctx.lineTo(x0 + r, y0 + lensH);
      ctx.quadraticCurveTo(x0, y0 + lensH, x0, y0 + lensH - r);
      ctx.lineTo(x0, y0 + r);
      ctx.quadraticCurveTo(x0, y0, x0 + r, y0);
      ctx.closePath();
    }

    if (item.lensColor) {
      ctx.fillStyle = item.lensColor;
      ctx.fill();
    }
    ctx.stroke();
  };

  const lOffset = frameWidth * 0.28;
  drawLens(cx - lOffset, cy);
  drawLens(cx + lOffset, cy);

  ctx.restore();
}

/**
 * イヤリング — 左耳珠 #132, 右耳珠 #361
 */
export function drawEarrings(ctx, landmarks, item, canvasW, canvasH) {
  if (!item || item.id === 'none') return;

  const positions = [
    { x: lmX(landmarks[132], canvasW), y: lmY(landmarks[132], canvasH) },
    { x: lmX(landmarks[361], canvasW), y: lmY(landmarks[361], canvasH) },
  ];

  positions.forEach(pos => {
    ctx.save();
    ctx.fillStyle = item.color;
    ctx.strokeStyle = item.color;

    switch (item.type) {
      case 'stud':
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        break;

      case 'drop':
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(pos.x, pos.y + 16, 5, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
        break;

      case 'hoop':
        ctx.beginPath();
        ctx.arc(pos.x, pos.y + 10, 11, 0, Math.PI * 2);
        ctx.strokeStyle = item.color;
        ctx.lineWidth = 3;
        ctx.stroke();
        break;

      case 'chain':
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y + 6 + i * 7, 3, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;
    }

    ctx.restore();
  });
}

/**
 * カラコン — 瞳中心 #468(左) / #473(右) に虹彩オーバーレイ
 */
export function drawContactLens(ctx, landmarks, item, canvasW, canvasH, opacity = 0.7) {
  if (!item || item.id === 'none') return;

  // MediaPipe FaceLandmarker extended iris landmarks
  const LEFT_IRIS_CENTER = 468;
  const RIGHT_IRIS_CENTER = 473;

  // 目頭・目尻の距離から虹彩半径を推定
  // 左目: #33(目頭), #133(目尻)  右目: #362(目頭), #263(目尻)
  const leftEyeWidth = Math.abs(lmX(landmarks[133], canvasW) - lmX(landmarks[33], canvasW));
  const rightEyeWidth = Math.abs(lmX(landmarks[362], canvasW) - lmX(landmarks[263], canvasW));

  const pairs = [
    { center: LEFT_IRIS_CENTER, eyeWidth: leftEyeWidth },
    { center: RIGHT_IRIS_CENTER, eyeWidth: rightEyeWidth },
  ];

  ctx.save();

  for (const { center, eyeWidth } of pairs) {
    const iris = landmarks[center];
    if (!iris) continue;

    const ix = lmX(iris, canvasW);
    const iy = lmY(iris, canvasH);
    const irisRadius = eyeWidth * 0.20;

    // Base color (multiply blend)
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = opacity * 0.55;
    const grad = ctx.createRadialGradient(ix, iy, 0, ix, iy, irisRadius);
    grad.addColorStop(0, item.color + 'CC');
    grad.addColorStop(0.6, item.color + '99');
    grad.addColorStop(1, item.color + '00');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ix, iy, irisRadius, 0, Math.PI * 2);
    ctx.fill();

    // Overlay tint for depth
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = opacity * 0.3;
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.arc(ix, iy, irisRadius * 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Pupil cutout (darken center)
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = opacity * 0.6;
    const pupilGrad = ctx.createRadialGradient(ix, iy, 0, ix, iy, irisRadius * 0.35);
    pupilGrad.addColorStop(0, '#1a1a1a');
    pupilGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = pupilGrad;
    ctx.beginPath();
    ctx.arc(ix, iy, irisRadius * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Highlight dot
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = opacity * 0.25;
    const hlGrad = ctx.createRadialGradient(
      ix - irisRadius * 0.2, iy - irisRadius * 0.25, 0,
      ix - irisRadius * 0.2, iy - irisRadius * 0.25, irisRadius * 0.3
    );
    hlGrad.addColorStop(0, 'rgba(255,255,255,0.7)');
    hlGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hlGrad;
    ctx.beginPath();
    ctx.arc(ix - irisRadius * 0.2, iy - irisRadius * 0.25, irisRadius * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ============================================================
// ヘルパー
// ============================================================

function traceIndices(ctx, lms, indices, w, h) {
  ctx.beginPath();
  ctx.moveTo(lmX(lms[indices[0]], w), lmY(lms[indices[0]], h));
  for (let i = 1; i < indices.length; i++) {
    ctx.lineTo(lmX(lms[indices[i]], w), lmY(lms[indices[i]], h));
  }
  ctx.closePath();
}

export function buildOrderedPoints(connections, lms, w, h) {
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
    ordered.push([lmX(p, w), lmY(p, h)]);
    const neighbors = adj.get(current) || [];
    current = neighbors.find(n => !visited.has(n));
  }

  return ordered;
}
