import { rgbToLab, rgbToHsv, normalizeIllumination, laplacianResponse } from './colorUtils.js';

// 肌領域の検出（HSV + RGB複合条件）
function isSkinPixel(r, g, b) {
  const [h, s, v] = rgbToHsv(r, g, b);
  // HSV条件: 暖色系 + 適度な彩度 + 暗すぎない
  if (!(h >= 0 && h <= 55 && s >= 0.08 && s <= 0.75 && v >= 0.15)) return false;
  // RGB条件: R > G > B（肌色の基本特性）
  if (!(r > g && g > b)) return false;
  // 均一色（壁など）除外: RGBの差が小さすぎるものは肌ではない
  if (r - b < 15) return false;
  return true;
}

// 肌ピクセルを抽出（座標付き）
function extractSkinPixels(imageData) {
  const data = imageData.data;
  const w = imageData.width;
  const pixels = [];
  for (let i = 0; i < data.length; i += 4) {
    if (isSkinPixel(data[i], data[i + 1], data[i + 2])) {
      const idx = i / 4;
      pixels.push({
        r: data[i], g: data[i + 1], b: data[i + 2],
        x: idx % w, y: Math.floor(idx / w),
      });
    }
  }
  return pixels;
}

// 肌トーンスコア: Lab a*b*平面での色ムラ + クラスタリング
function scoreTone(skinPixels) {
  if (skinPixels.length < 100) return 50;

  const labs = skinPixels.map(p => rgbToLab(p.r, p.g, p.b));
  const avgA = labs.reduce((s, l) => s + l[1], 0) / labs.length;
  const avgB = labs.reduce((s, l) => s + l[2], 0) / labs.length;

  // a*, b* の標準偏差（色ムラの指標）
  const varA = Math.sqrt(labs.reduce((s, l) => s + (l[1] - avgA) ** 2, 0) / labs.length);
  const varB = Math.sqrt(labs.reduce((s, l) => s + (l[2] - avgB) ** 2, 0) / labs.length);

  // 色相の分散方向も考慮（a*方向=赤み、b*方向=黄みのムラを別々に評価）
  const redUnevenness = varA * 1.2; // 赤みムラはトーン印象に影響大
  const yellowUnevenness = varB * 0.8;
  const colorVar = (redUnevenness + yellowUnevenness) / 2;

  // 外れ値の割合（平均から2σ以上離れたピクセルの比率）
  const threshold = (varA + varB);
  const outliers = labs.filter(l =>
    Math.sqrt((l[1] - avgA) ** 2 + (l[2] - avgB) ** 2) > threshold
  ).length / labs.length;

  // 分散 + 外れ値を総合してスコア算出
  const rawScore = 95 - colorVar * 2.5 - outliers * 30;
  return Math.round(Math.max(40, Math.min(95, rawScore)));
}

// 毛穴スコア: Laplacian フィルタによるテクスチャ粗さ
function scorePores(imageData) {
  const lapAvg = laplacianResponse(imageData, isSkinPixel);
  // Laplacian応答 0〜20 を スコア 95〜40 にマッピング
  // 応答が大きい = テクスチャが粗い = 毛穴が目立つ
  return Math.round(Math.max(40, Math.min(95, 95 - lapAvg * 2.75)));
}

// くすみスコア: L値の空間分布（中心 vs 周辺）
function scoreDullness(skinPixels, imageWidth, imageHeight) {
  if (skinPixels.length < 100) return 50;

  const labs = skinPixels.map(p => ({
    l: rgbToLab(p.r, p.g, p.b)[0],
    x: p.x, y: p.y,
  }));

  // 全体の平均L値
  const avgL = labs.reduce((s, p) => s + p.l, 0) / labs.length;

  // 顔の中心エリア vs 周辺の明度差
  const cx = imageWidth / 2, cy = imageHeight / 2;
  const centerR = Math.min(imageWidth, imageHeight) * 0.25;
  const center = labs.filter(p => Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2) < centerR);
  const peripheral = labs.filter(p => Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2) >= centerR);

  let uniformityBonus = 0;
  if (center.length > 20 && peripheral.length > 20) {
    const centerAvg = center.reduce((s, p) => s + p.l, 0) / center.length;
    const periAvg = peripheral.reduce((s, p) => s + p.l, 0) / peripheral.length;
    // 中心と周辺の差が小さい = 均一な明るさ = くすみが少ない
    uniformityBonus = Math.max(0, 10 - Math.abs(centerAvg - periAvg));
  }

  // L値の標準偏差（明暗ムラ）
  const varL = Math.sqrt(labs.reduce((s, p) => s + (p.l - avgL) ** 2, 0) / labs.length);

  // L値 40〜80 → スコア 40〜85、均一性ボーナス + 明暗ムラペナルティ
  const baseScore = 40 + (avgL - 40) * (45 / 40);
  const finalScore = baseScore + uniformityBonus - varL * 0.5;
  return Math.round(Math.max(40, Math.min(95, finalScore)));
}

// メインの分析関数
export function analyzeSkin(imageData) {
  if (!imageData) {
    return { tone: { score: 0 }, pores: { score: 0 }, dullness: { score: 0 } };
  }

  // 照明正規化
  const normalized = normalizeIllumination(imageData);
  const skinPixels = extractSkinPixels(normalized);

  // 肌が十分に検出できなかった場合
  const skinRatio = skinPixels.length / (imageData.width * imageData.height / 4);
  if (skinRatio < 0.05) {
    return {
      tone: { score: 0 },
      pores: { score: 0 },
      dullness: { score: 0 },
      error: '肌が検出できませんでした。顔全体が映るようにしてください。',
    };
  }

  return {
    tone: { score: scoreTone(skinPixels) },
    pores: { score: scorePores(normalized) },
    dullness: { score: scoreDullness(skinPixels, normalized.width, normalized.height) },
  };
}
