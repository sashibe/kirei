import { rgbToLab, rgbToHsv, normalizeIllumination } from './colorUtils.js';

// 口腔領域の簡易色分類
// 歯: 高明度 + 低彩度
// 歯茎: ピンク〜赤系
function classifyOralPixel(r, g, b) {
  const [h, s, v] = rgbToHsv(r, g, b);
  const [l, a, bVal] = rgbToLab(r, g, b);

  // 歯（白〜黄色、高明度・低彩度）
  if (l > 65 && s < 0.35 && v > 0.5) return 'tooth';
  // 歯茎（ピンク〜赤、中明度）
  if ((h <= 20 || h >= 340) && s > 0.15 && a > 5 && l > 30 && l < 75) return 'gum';
  return 'other';
}

// 口腔領域のピクセルを分類
function classifyOralRegion(imageData) {
  const data = imageData.data;
  const teeth = [];
  const gums = [];

  for (let i = 0; i < data.length; i += 4) {
    const type = classifyOralPixel(data[i], data[i + 1], data[i + 2]);
    if (type === 'tooth') teeth.push([data[i], data[i + 1], data[i + 2]]);
    else if (type === 'gum') gums.push([data[i], data[i + 1], data[i + 2]]);
  }

  return { teeth, gums };
}

// 歯茎スコア: 健康な歯茎はサーモンピンク（Lab: a*が適度に正、b*がやや正）
// 赤すぎ → 炎症気味、白っぽい → 貧血気味
function scoreGums(gums) {
  if (gums.length < 50) return 50;

  const labs = gums.map(([r, g, b]) => rgbToLab(r, g, b));
  const avgA = labs.reduce((s, l) => s + l[1], 0) / labs.length;
  const avgB = labs.reduce((s, l) => s + l[2], 0) / labs.length;

  // 健康な歯茎の目安: a* = 15〜25, b* = 5〜15
  const idealA = 20, idealB = 10;
  const distA = Math.abs(avgA - idealA);
  const distB = Math.abs(avgB - idealB);
  const dist = Math.sqrt(distA ** 2 + distB ** 2);

  // 色差 0〜30 を スコア 95〜40 にマッピング
  return Math.round(Math.max(40, Math.min(95, 95 - dist * 1.83)));
}

// 歯並びスコア: 歯領域の水平対称性
// 中心線から左右の歯の分布が対称なほど高スコア
function scoreAlignment(imageData, teeth) {
  if (teeth.length < 50) return 50;

  const data = imageData.data;
  const w = imageData.width;
  const centerX = w / 2;

  let leftCount = 0, rightCount = 0;
  let leftYSum = 0, rightYSum = 0;

  for (let i = 0; i < data.length; i += 4) {
    const pixelIdx = i / 4;
    const x = pixelIdx % w;
    const y = Math.floor(pixelIdx / w);
    const type = classifyOralPixel(data[i], data[i + 1], data[i + 2]);

    if (type === 'tooth') {
      if (x < centerX) { leftCount++; leftYSum += y; }
      else { rightCount++; rightYSum += y; }
    }
  }

  if (leftCount < 10 || rightCount < 10) return 50;

  // 左右の歯の数のバランス
  const countRatio = Math.min(leftCount, rightCount) / Math.max(leftCount, rightCount);
  // 左右の歯のY位置（高さ）の平均差
  const leftAvgY = leftYSum / leftCount;
  const rightAvgY = rightYSum / rightCount;
  const yDiff = Math.abs(leftAvgY - rightAvgY) / imageData.height;

  // 対称性スコア
  const symmetry = countRatio * 0.6 + (1 - Math.min(1, yDiff * 10)) * 0.4;
  return Math.round(Math.max(40, Math.min(95, symmetry * 95)));
}

// 着色スコア: 歯の白さ（Lab L値とb*値）
// L値が高く、b*値が低いほど白い → 高スコア
function scoreStaining(teeth) {
  if (teeth.length < 50) return 50;

  const labs = teeth.map(([r, g, b]) => rgbToLab(r, g, b));
  const avgL = labs.reduce((s, l) => s + l[0], 0) / labs.length;
  const avgB = labs.reduce((s, l) => s + l[2], 0) / labs.length;

  // 白い歯: L > 80, b* < 10
  // 着色: L < 70, b* > 20（黄ばみ）
  const whiteness = (avgL - 50) / 40; // 0〜1にマッピング
  const yellowness = Math.max(0, avgB - 5) / 25; // b*が高いほど黄色

  const score = whiteness * 0.6 - yellowness * 0.4;
  return Math.round(Math.max(40, Math.min(95, 40 + score * 55)));
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
