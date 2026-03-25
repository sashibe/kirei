import { rgbToLab, rgbToHsv, normalizeIllumination, deltaE2000 } from './colorUtils.js';

// 口腔領域の色分類（RGB + Lab + HSV 複合条件）
function classifyOralPixel(r, g, b) {
  const [h, s, v] = rgbToHsv(r, g, b);
  const [l, a, bVal] = rgbToLab(r, g, b);

  // 歯（白〜黄色系、高明度・低彩度）
  // Lab: L > 65, |a*| < 10, b* < 25
  if (l > 65 && s < 0.35 && v > 0.5 && Math.abs(a) < 15 && bVal < 30) return 'tooth';

  // 歯茎（ピンク〜赤系、中明度、a*が正=赤み）
  // HSV: 赤〜ピンク範囲, Lab: a* > 5
  if ((h <= 25 || h >= 330) && s > 0.12 && a > 3 && l > 25 && l < 80) return 'gum';

  return 'other';
}

// 口腔領域のピクセルを分類（座標付き）
function classifyOralRegion(imageData) {
  const data = imageData.data;
  const w = imageData.width;
  const teeth = [];
  const gums = [];

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const type = classifyOralPixel(r, g, b);
    const idx = i / 4;
    const px = { r, g, b, x: idx % w, y: Math.floor(idx / w) };
    if (type === 'tooth') teeth.push(px);
    else if (type === 'gum') gums.push(px);
  }

  return { teeth, gums };
}

// 健康な歯茎のリファレンスLab値（サーモンピンク）
const HEALTHY_GUM_LAB = [55, 22, 12];

// 歯茎スコア: 健康色との色差 + 均一性
function scoreGums(gums) {
  if (gums.length < 50) return 50;

  const labs = gums.map(p => rgbToLab(p.r, p.g, p.b));

  // 平均色と健康色のΔE2000
  const avgL = labs.reduce((s, l) => s + l[0], 0) / labs.length;
  const avgA = labs.reduce((s, l) => s + l[1], 0) / labs.length;
  const avgB = labs.reduce((s, l) => s + l[2], 0) / labs.length;
  const colorDist = deltaE2000([avgL, avgA, avgB], HEALTHY_GUM_LAB);

  // 均一性: 歯茎内部の色のばらつき
  const varA = Math.sqrt(labs.reduce((s, l) => s + (l[1] - avgA) ** 2, 0) / labs.length);
  const varB = Math.sqrt(labs.reduce((s, l) => s + (l[2] - avgB) ** 2, 0) / labs.length);
  const uniformity = (varA + varB) / 2;

  // ΔE 0〜25 → 95〜40、均一性ペナルティ
  const colorScore = 95 - colorDist * 2.2;
  const uniformityPenalty = Math.max(0, uniformity - 5) * 1.5;
  return Math.round(Math.max(40, Math.min(95, colorScore - uniformityPenalty)));
}

// 歯並びスコア: 左右対称性 + 歯領域の連続性
function scoreAlignment(imageData, teeth) {
  if (teeth.length < 50) return 50;

  const w = imageData.width;
  const centerX = w / 2;

  // 左右の歯ピクセル統計
  let leftCount = 0, rightCount = 0;
  let leftYSum = 0, rightYSum = 0;
  let leftXSum = 0, rightXSum = 0;

  for (const p of teeth) {
    if (p.x < centerX) {
      leftCount++; leftYSum += p.y; leftXSum += p.x;
    } else {
      rightCount++; rightYSum += p.y; rightXSum += p.x;
    }
  }

  if (leftCount < 10 || rightCount < 10) return 50;

  // 左右の数バランス
  const countRatio = Math.min(leftCount, rightCount) / Math.max(leftCount, rightCount);

  // 左右の高さバランス
  const leftAvgY = leftYSum / leftCount;
  const rightAvgY = rightYSum / rightCount;
  const yDiff = Math.abs(leftAvgY - rightAvgY) / imageData.height;

  // 左右の横方向の対称性（中心からの距離が近いほど対称）
  const leftAvgDist = (centerX - leftXSum / leftCount) / centerX;
  const rightAvgDist = (rightXSum / rightCount - centerX) / centerX;
  const xSymmetry = 1 - Math.abs(leftAvgDist - rightAvgDist);

  // 歯領域の垂直方向の幅の一貫性（歯列が揃っているか）
  const yValues = teeth.map(p => p.y);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);
  const ySpread = (yMax - yMin) / imageData.height;
  const verticalConsistency = Math.max(0, 1 - ySpread * 3);

  const score = countRatio * 0.3 + (1 - Math.min(1, yDiff * 8)) * 0.25
    + xSymmetry * 0.25 + verticalConsistency * 0.2;
  return Math.round(Math.max(40, Math.min(95, score * 95)));
}

// 理想的な白い歯のLab値
const IDEAL_TOOTH_LAB = [92, -1, 5];

// 着色スコア: ΔE2000で理想白との色差を精密計算
function scoreStaining(teeth) {
  if (teeth.length < 50) return 50;

  const labs = teeth.map(p => rgbToLab(p.r, p.g, p.b));

  // 各歯ピクセルと理想白のΔE2000を算出
  // サンプリング（全ピクセルは重いので1/4で計算）
  const step = Math.max(1, Math.floor(labs.length / 500));
  let totalDE = 0, sampleCount = 0;
  for (let i = 0; i < labs.length; i += step) {
    totalDE += deltaE2000(labs[i], IDEAL_TOOTH_LAB);
    sampleCount++;
  }
  const avgDE = sampleCount > 0 ? totalDE / sampleCount : 30;

  // 黄ばみ方向の偏り（b*値）
  const avgB = labs.reduce((s, l) => s + l[2], 0) / labs.length;
  const yellowPenalty = Math.max(0, avgB - 8) * 0.8;

  // ΔE 5〜35 → スコア 95〜40
  const deScore = 95 - (avgDE - 5) * (55 / 30);
  return Math.round(Math.max(40, Math.min(95, deScore - yellowPenalty)));
}

// 軽量な口元位置検出（自動シャッター用）
// ガイド矩形: GuideFrame の viewBox(0-100) で x=20, y=30, w=60, h=35
// → 正規化座標
const MOUTH_GUIDE = { x: 0.20, y: 0.30, w: 0.60, h: 0.35 };

export function detectMouthPosition(imageData) {
  const data = imageData.data;
  const w = imageData.width;
  const h = imageData.height;
  const step = 4;

  let insideTeeth = 0, insideGums = 0, insideSampled = 0;

  const gx1 = MOUTH_GUIDE.x;
  const gy1 = MOUTH_GUIDE.y;
  const gx2 = MOUTH_GUIDE.x + MOUTH_GUIDE.w;
  const gy2 = MOUTH_GUIDE.y + MOUTH_GUIDE.h;

  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const nx = x / w;
      const ny = y / h;
      // ガイド矩形の内側かチェック
      const isInside = nx >= gx1 && nx <= gx2 && ny >= gy1 && ny <= gy2;

      if (isInside) {
        insideSampled++;
        const i = (y * w + x) * 4;
        const type = classifyOralPixel(data[i], data[i + 1], data[i + 2]);
        if (type === 'tooth') insideTeeth++;
        else if (type === 'gum') insideGums++;
      }
    }
  }

  const oralCount = insideTeeth + insideGums;
  const ratio = insideSampled > 0 ? oralCount / insideSampled : 0;
  const hasTeeth = insideTeeth > 5;
  const hasGums = insideGums > 5;

  // 判定: ガイド枠内に歯または歯茎が5%以上
  const inFrame = ratio > 0.05 && (hasTeeth || hasGums);

  return { ratio, inFrame, hasTeeth, hasGums };
}

// メインの分析関数
export function analyzeDental(imageData) {
  if (!imageData) {
    return { gums: { score: 0 }, alignment: { score: 0 }, staining: { score: 0 } };
  }

  // 照明正規化（最重要！）
  const normalized = normalizeIllumination(imageData);
  const { teeth, gums } = classifyOralRegion(normalized);

  // 口腔領域が十分に検出できなかった場合
  const totalOral = teeth.length + gums.length;
  const totalPixels = imageData.width * imageData.height / 4;
  if (totalOral / totalPixels < 0.03) {
    return {
      gums: { score: 0 },
      alignment: { score: 0 },
      staining: { score: 0 },
      error: '口元が検出できませんでした。口を開けて近づけてください。',
    };
  }

  return {
    gums: { score: scoreGums(gums) },
    alignment: { score: scoreAlignment(normalized, teeth) },
    staining: { score: scoreStaining(teeth) },
  };
}
