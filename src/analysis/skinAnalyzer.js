import { rgbToLab, rgbToHsv, normalizeIllumination } from './colorUtils.js';

// 肌領域の簡易検出（HSVベースのスキンカラー判定）
function isSkinPixel(r, g, b) {
  const [h, s, v] = rgbToHsv(r, g, b);
  return h >= 0 && h <= 50 && s >= 0.1 && s <= 0.8 && v >= 0.2;
}

// 肌ピクセルを抽出
function extractSkinPixels(imageData) {
  const data = imageData.data;
  const pixels = [];
  for (let i = 0; i < data.length; i += 4) {
    if (isSkinPixel(data[i], data[i + 1], data[i + 2])) {
      pixels.push([data[i], data[i + 1], data[i + 2]]);
    }
  }
  return pixels;
}

// 肌トーンスコア: Lab色空間での色の均一性
// 分散が小さいほどトーンが均一 → 高スコア
function scoreTone(skinPixels) {
  if (skinPixels.length < 100) return 50;

  const labs = skinPixels.map(([r, g, b]) => rgbToLab(r, g, b));
  const avgA = labs.reduce((s, l) => s + l[1], 0) / labs.length;
  const avgB = labs.reduce((s, l) => s + l[2], 0) / labs.length;

  // a*, b* の標準偏差（色ムラの指標）
  const varA = Math.sqrt(labs.reduce((s, l) => s + (l[1] - avgA) ** 2, 0) / labs.length);
  const varB = Math.sqrt(labs.reduce((s, l) => s + (l[2] - avgB) ** 2, 0) / labs.length);
  const colorVar = (varA + varB) / 2;

  // 分散 0〜20 を スコア 95〜40 にマッピング
  return Math.round(Math.max(40, Math.min(95, 95 - colorVar * 2.75)));
}

// 毛穴スコア: テクスチャの粗さ（隣接ピクセルとの差分）
// テクスチャが滑らかなほど高スコア
function scorePores(imageData, skinPixels) {
  if (skinPixels.length < 100) return 50;

  const data = imageData.data;
  const w = imageData.width;
  let totalDiff = 0;
  let count = 0;

  // サンプリング（全ピクセルだと重いのでステップ付き）
  const step = 2;
  for (let y = 1; y < imageData.height - 1; y += step) {
    for (let x = 1; x < w - 1; x += step) {
      const idx = (y * w + x) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      if (!isSkinPixel(r, g, b)) continue;

      // 4近傍との輝度差
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const neighbors = [
        (y - 1) * w + x, (y + 1) * w + x,
        y * w + (x - 1), y * w + (x + 1),
      ];
      for (const ni of neighbors) {
        const ni4 = ni * 4;
        const nLum = 0.299 * data[ni4] + 0.587 * data[ni4 + 1] + 0.114 * data[ni4 + 2];
        totalDiff += Math.abs(lum - nLum);
        count++;
      }
    }
  }

  const avgDiff = count > 0 ? totalDiff / count : 0;
  // 差分 0〜15 を スコア 95〜40 にマッピング
  return Math.round(Math.max(40, Math.min(95, 95 - avgDiff * 3.67)));
}

// くすみスコア: L値（明度）の平均
// 明るいほどくすみが少ない → 高スコア
function scoreDullness(skinPixels) {
  if (skinPixels.length < 100) return 50;

  const labs = skinPixels.map(([r, g, b]) => rgbToLab(r, g, b));
  const avgL = labs.reduce((s, l) => s + l[0], 0) / labs.length;

  // L値 40〜80 を スコア 40〜95 にマッピング
  return Math.round(Math.max(40, Math.min(95, 40 + (avgL - 40) * (55 / 40))));
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
    pores: { score: scorePores(normalized, skinPixels) },
    dullness: { score: scoreDullness(skinPixels) },
  };
}
