// === 色空間変換ユーティリティ ===

// RGB → sRGB リニア化
function linearize(c) {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

// sRGB リニア → gamma
function gammaize(c) {
  return c <= 0.0031308
    ? Math.round(Math.min(255, 12.92 * c * 255))
    : Math.round(Math.min(255, (1.055 * Math.pow(c, 1 / 2.4) - 0.055) * 255));
}

// RGB [0-255] → XYZ (D65)
export function rgbToXyz(r, g, b) {
  const rl = linearize(r);
  const gl = linearize(g);
  const bl = linearize(b);
  return [
    rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375,
    rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750,
    rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041,
  ];
}

// XYZ → Lab (D65 白色点)
const D65 = [0.95047, 1.0, 1.08883];
function labF(t) {
  return t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
}

export function xyzToLab(x, y, z) {
  const fx = labF(x / D65[0]);
  const fy = labF(y / D65[1]);
  const fz = labF(z / D65[2]);
  return [
    116 * fy - 16,        // L: 0-100
    500 * (fx - fy),      // a: green(-) to red(+)
    200 * (fy - fz),      // b: blue(-) to yellow(+)
  ];
}

// RGB → Lab ショートカット
export function rgbToLab(r, g, b) {
  const [x, y, z] = rgbToXyz(r, g, b);
  return xyzToLab(x, y, z);
}

// RGB → HSV
export function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + 6) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  const s = max === 0 ? 0 : d / max;
  return [h, s, max]; // H: 0-360, S: 0-1, V: 0-1
}

// ΔE2000 色差計算（簡易版）
// 2つのLab色の知覚的な差を算出
export function deltaE2000(lab1, lab2) {
  const [L1, a1, b1] = lab1;
  const [L2, a2, b2] = lab2;
  const avgL = (L1 + L2) / 2;
  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const avgC = (C1 + C2) / 2;

  const G = 0.5 * (1 - Math.sqrt(avgC ** 7 / (avgC ** 7 + 25 ** 7)));
  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);
  const C1p = Math.sqrt(a1p * a1p + b1 * b1);
  const C2p = Math.sqrt(a2p * a2p + b2 * b2);

  const h1p = Math.atan2(b1, a1p) * 180 / Math.PI;
  const h2p = Math.atan2(b2, a2p) * 180 / Math.PI;
  const h1pn = h1p >= 0 ? h1p : h1p + 360;
  const h2pn = h2p >= 0 ? h2p : h2p + 360;

  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  let dhp = h2pn - h1pn;
  if (Math.abs(dhp) > 180) dhp -= 360 * Math.sign(dhp);
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(dhp * Math.PI / 360);

  const SL = 1 + 0.015 * (avgL - 50) ** 2 / Math.sqrt(20 + (avgL - 50) ** 2);
  const SC = 1 + 0.045 * (C1p + C2p) / 2;
  const SH = 1 + 0.015 * (C1p + C2p) / 2;

  return Math.sqrt((dLp / SL) ** 2 + (dCp / SC) ** 2 + (dHp / SH) ** 2);
}

// Laplacian フィルタ（エッジ検出・テクスチャ粗さ計測）
// 入力: ImageData, 出力: 各肌ピクセルのLaplacian応答の平均
export function laplacianResponse(imageData, isSkinFn) {
  const data = imageData.data;
  const w = imageData.width;
  const h = imageData.height;
  // 輝度画像
  const lum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const i4 = i * 4;
    lum[i] = 0.299 * data[i4] + 0.587 * data[i4 + 1] + 0.114 * data[i4 + 2];
  }

  let total = 0, count = 0;
  // Laplacian kernel: [0,1,0; 1,-4,1; 0,1,0]
  for (let y = 1; y < h - 1; y += 2) {
    for (let x = 1; x < w - 1; x += 2) {
      const idx = y * w + x;
      const i4 = idx * 4;
      if (!isSkinFn(data[i4], data[i4 + 1], data[i4 + 2])) continue;

      const lap = -4 * lum[idx]
        + lum[(y - 1) * w + x]
        + lum[(y + 1) * w + x]
        + lum[y * w + (x - 1)]
        + lum[y * w + (x + 1)];
      total += Math.abs(lap);
      count++;
    }
  }

  return count > 0 ? total / count : 0;
}

// === 照明正規化 ===

// グレーワールド仮定によるホワイトバランス補正
// 画像全体の平均色をニュートラルグレーに補正する
export function grayWorldCorrection(imageData) {
  const data = imageData.data;
  const len = data.length;
  let sumR = 0, sumG = 0, sumB = 0;
  const pixelCount = len / 4;

  // 平均RGB算出
  for (let i = 0; i < len; i += 4) {
    sumR += data[i];
    sumG += data[i + 1];
    sumB += data[i + 2];
  }

  const avgR = sumR / pixelCount;
  const avgG = sumG / pixelCount;
  const avgB = sumB / pixelCount;
  const avgGray = (avgR + avgG + avgB) / 3;

  // 補正係数（0除算防止）
  const scaleR = avgR > 0 ? avgGray / avgR : 1;
  const scaleG = avgG > 0 ? avgGray / avgG : 1;
  const scaleB = avgB > 0 ? avgGray / avgB : 1;

  // 新しい ImageData を作成（元データは変更しない）
  const corrected = new Uint8ClampedArray(len);
  for (let i = 0; i < len; i += 4) {
    corrected[i] = Math.min(255, data[i] * scaleR);
    corrected[i + 1] = Math.min(255, data[i + 1] * scaleG);
    corrected[i + 2] = Math.min(255, data[i + 2] * scaleB);
    corrected[i + 3] = data[i + 3];
  }

  return new ImageData(corrected, imageData.width, imageData.height);
}

// 明度ヒストグラム正規化（Lab L チャネル）
// 暗い照明でも明るい照明でもコントラストを一定範囲に収める
export function normalizeLightness(imageData) {
  const data = imageData.data;
  const len = data.length;
  const pixelCount = len / 4;

  // 全ピクセルのL値を計算
  const lValues = new Float32Array(pixelCount);
  let minL = 100, maxL = 0;

  for (let i = 0, j = 0; i < len; i += 4, j++) {
    const [l] = rgbToLab(data[i], data[i + 1], data[i + 2]);
    lValues[j] = l;
    if (l < minL) minL = l;
    if (l > maxL) maxL = l;
  }

  const rangeL = maxL - minL;
  if (rangeL < 5) return imageData; // ほぼ均一なら補正不要

  // ターゲット範囲: L = 20〜85（自然な見え方の範囲）
  const targetMin = 20;
  const targetMax = 85;
  const targetRange = targetMax - targetMin;

  // L値を正規化してRGBに戻す
  const corrected = new Uint8ClampedArray(len);
  for (let i = 0, j = 0; i < len; i += 4, j++) {
    const normalizedL = targetMin + ((lValues[j] - minL) / rangeL) * targetRange;
    const scale = lValues[j] > 0 ? normalizedL / lValues[j] : 1;

    // 明度スケーリング（色相を保持しつつ明るさだけ調整）
    const rl = linearize(data[i]);
    const gl = linearize(data[i + 1]);
    const bl = linearize(data[i + 2]);

    corrected[i] = gammaize(Math.min(1, rl * scale));
    corrected[i + 1] = gammaize(Math.min(1, gl * scale));
    corrected[i + 2] = gammaize(Math.min(1, bl * scale));
    corrected[i + 3] = data[i + 3];
  }

  return new ImageData(corrected, imageData.width, imageData.height);
}

// 統合照明正規化パイプライン
export function normalizeIllumination(imageData) {
  const step1 = grayWorldCorrection(imageData);
  const step2 = normalizeLightness(step1);
  return step2;
}
