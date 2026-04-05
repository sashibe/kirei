// src/data/makeupLooks.js

// タブ 0: Color makeup
export const COLOR_LOOKS = [
  {
    id: 'glow',
    pcSeasons: ['spring', 'summer'],
    name: { ja: 'ツヤ肌ブルームルック', en: 'Dewy Bloom Look', ko: '윤기 블룸 룩' },
    desc: { ja: '血色感のあるコーラルピンクで自然なツヤを演出', en: 'Natural glow with vibrant coral pink', ko: '혈색감 있는 코럴 핑크로 자연스러운 윤기 연출' },
    reason: { ja: 'くすみスコアが良好なので、ツヤ肌が映えます', en: 'Your low dullness score means dewy skin will shine', ko: '칙칙함 점수가 양호해서 윤기 피부가 돋보여요' },
    lip: '#e8607c', cheek: 'rgba(232,96,124,0.25)', eyeshadow: 'rgba(232,150,120,0.2)',
    products: [
      { emoji: '💄', name: { ja: 'シアーグロウリップ', en: 'Sheer Glow Lip', ko: '시어 글로우 립' }, shade: { ja: 'コーラルピンク', en: 'Coral Pink', ko: '코럴 핑크' }, price: 2480 },
      { emoji: '🌸', name: { ja: 'ブルームチーク', en: 'Bloom Cheek', ko: '블룸 치크' }, shade: { ja: 'ピーチ', en: 'Peach', ko: '피치' }, price: 1980 },
    ],
  },
  {
    id: 'matte',
    pcSeasons: ['winter', 'autumn'],
    name: { ja: 'マットシックルック', en: 'Matte Chic Look', ko: '매트 시크 룩' },
    desc: { ja: '落ち着いたローズでクールな印象に', en: 'Cool impression with calm rose tones', ko: '차분한 로즈로 쿨한 인상으로' },
    reason: { ja: '肌トーンが安定しているので、マット仕上げが映えます', en: 'Your stable skin tone suits a matte finish', ko: '피부 톤이 안정적이어서 매트 마무리가 돋보여요' },
    lip: '#c45a6a', cheek: 'rgba(180,90,100,0.2)', eyeshadow: 'rgba(160,120,140,0.25)',
    products: [
      { emoji: '💄', name: { ja: 'ベルベットリップ', en: 'Velvet Lip', ko: '벨벳 립' }, shade: { ja: 'ダスティローズ', en: 'Dusty Rose', ko: '더스티 로즈' }, price: 2680 },
      { emoji: '✨', name: { ja: 'マットチーク', en: 'Matte Cheek', ko: '매트 치크' }, shade: { ja: 'ローズ', en: 'Rose', ko: '로즈' }, price: 2180 },
    ],
  },
  {
    id: 'warm',
    pcSeasons: ['spring', 'autumn'],
    name: { ja: 'ウォームグロウルック', en: 'Warm Glow Look', ko: '웜 글로우 룩' },
    desc: { ja: 'オレンジ系で健康的な血色感をプラス', en: 'Healthy warmth with orange tones', ko: '오렌지 계열로 건강한 혈색감 플러스' },
    reason: { ja: 'パーソナルカラーに合わせた暖色系で統一感UP', en: 'Warm tones matched to your personal color for unity', ko: '퍼스널 컬러에 맞춘 난색 계열로 통일감 UP' },
    lip: '#e07850', cheek: 'rgba(224,120,80,0.2)', eyeshadow: 'rgba(200,140,90,0.2)',
    products: [
      { emoji: '💄', name: { ja: 'ジューシーリップ', en: 'Juicy Lip', ko: '쥬시 립' }, shade: { ja: 'アプリコット', en: 'Apricot', ko: '아프리콧' }, price: 2380 },
      { emoji: '🌻', name: { ja: 'サンキスチーク', en: 'Sun Kiss Cheek', ko: '선키스 치크' }, shade: { ja: 'オレンジ', en: 'Orange', ko: '오렌지' }, price: 1880 },
    ],
  },
];

// タブ 1: Base makeup
export const BASE_LOOKS = [
  {
    id: 'clean-natural',
    pcSeasons: ['spring', 'summer'],
    name: { ja: 'クリーンナチュラル', en: 'Clean Natural', ko: '클린 내추럴' },
    desc: { ja: 'BBクリーム + コンシーラーで肌の色ムラを均一に', en: 'BB cream + concealer for even skin tone', ko: 'BB크림 + 컨실러로 피부 색 얼룩 균일하게' },
    reason: { ja: '肌トーンスコアを活かして清潔感のある印象に', en: 'Leverage your tone score for a clean impression', ko: '피부 톤 점수를 살려 청결감 있는 인상으로' },
    base: '#e8d8c8', concealer: '#d4c0a8',
    products: [
      { emoji: '🧴', name: { ja: 'ナチュラルBBクリーム', en: 'Natural BB Cream', ko: '내추럴 BB크림' }, shade: { ja: 'ライトベージュ', en: 'Light Beige', ko: '라이트 베이지' }, price: 1980 },
      { emoji: '✨', name: { ja: 'カバーコンシーラー', en: 'Cover Concealer', ko: '커버 컨실러' }, shade: { ja: 'ナチュラル', en: 'Natural', ko: '내추럴' }, price: 1480 },
    ],
  },
  {
    id: 'business-sharp',
    pcSeasons: ['winter', 'summer'],
    name: { ja: 'ビジネスシャープ', en: 'Business Sharp', ko: '비즈니스 샤프' },
    desc: { ja: 'トーンアップ下地 + 眉マスカラでキリッとした印象に', en: 'Tone-up base + brow mascara for a sharp look', ko: '톤업 베이스 + 눈썹 마스카라로 깔끔한 인상으로' },
    reason: { ja: 'パーソナルカラーに合わせた眉色で知的に仕上げる', en: 'Intellectual finish with brow color matched to your personal color', ko: '퍼스널 컬러에 맞춘 눈썹 색으로 지적인 마무리' },
    base: '#d8cfc0', brow: '#8a7a6a',
    products: [
      { emoji: '🧴', name: { ja: 'トーンアップ下地', en: 'Tone-Up Primer', ko: '톤업 베이스' }, shade: { ja: 'ラベンダー', en: 'Lavender', ko: '라벤더' }, price: 2280 },
      { emoji: '🖌️', name: { ja: 'アイブロウマスカラ', en: 'Brow Mascara', ko: '아이브로우 마스카라' }, shade: { ja: 'アッシュブラウン', en: 'Ash Brown', ko: '애쉬 브라운' }, price: 1280 },
    ],
  },
  {
    id: 'weekend-fresh',
    pcSeasons: ['spring', 'autumn'],
    name: { ja: 'ウィークエンドフレッシュ', en: 'Weekend Fresh', ko: '위크엔드 프레시' },
    desc: { ja: '軽いトーンアップ + リップバームで爽やかに', en: 'Light tone-up + lip balm for freshness', ko: '가벼운 톤업 + 립밤으로 상쾌하게' },
    reason: { ja: '休日のリラックスした印象をキープ', en: 'Keep a relaxed weekend vibe', ko: '휴일의 릴랙스한 인상을 유지' },
    base: '#f0e4d8', lip: '#d8a8a0',
    products: [
      { emoji: '🧴', name: { ja: 'トーンアップジェル', en: 'Tone-Up Gel', ko: '톤업 젤' }, shade: { ja: 'クリア', en: 'Clear', ko: '클리어' }, price: 1680 },
      { emoji: '💋', name: { ja: 'カラーリップバーム', en: 'Color Lip Balm', ko: '컬러 립밤' }, shade: { ja: 'ピンクベージュ', en: 'Pink Beige', ko: '핑크 베이지' }, price: 980 },
    ],
  },
];

// タブ 2: Skin care
export const SKINCARE_ROUTINE = {
  morning: [
    { step: { ja: '洗顔', en: 'Cleanser', ko: '세안' }, product: { ja: 'アミノ酸洗顔フォーム', en: 'Amino Acid Facial Foam', ko: '아미노산 세안 폼' }, price: 1480 },
    { step: { ja: '化粧水', en: 'Toner', ko: '토너' }, product: { ja: 'トーニングローション', en: 'Toning Lotion', ko: '토닝 로션' }, price: 1980 },
    { step: { ja: '乳液', en: 'Emulsion', ko: '유액' }, product: { ja: 'モイスチャーミルク', en: 'Moisture Milk', ko: '모이스처 밀크' }, price: 2280 },
    { step: { ja: '日焼け止め', en: 'Sunscreen', ko: '자외선 차단제' }, product: { ja: 'UVプロテクトジェル SPF50+', en: 'UV Protect Gel SPF50+', ko: 'UV 프로텍트 젤 SPF50+' }, price: 1680 },
  ],
  night: [
    { step: { ja: 'クレンジング', en: 'Cleansing', ko: '클렌징' }, product: { ja: 'ジェルクレンジング', en: 'Gel Cleansing', ko: '젤 클렌징' }, price: 1580 },
    { step: { ja: '洗顔', en: 'Cleanser', ko: '세안' }, product: { ja: 'アミノ酸洗顔フォーム', en: 'Amino Acid Facial Foam', ko: '아미노산 세안 폼' }, price: 1480 },
    { step: { ja: '美容液', en: 'Serum', ko: '세럼' }, product: { ja: 'ビタミンC美容液', en: 'Vitamin C Serum', ko: '비타민C 세럼' }, price: 3280 },
    { step: { ja: 'クリーム', en: 'Cream', ko: '크림' }, product: { ja: 'バリアリペアクリーム', en: 'Barrier Repair Cream', ko: '배리어 리페어 크림' }, price: 2480 },
  ],
};

/**
 * PC×スコアからベース＋カラーの組み合わせを1つ推薦する。
 *
 * @param {object|null} personalColor  analyzePersonalColor() の戻り値
 * @param {object|null} skinScores     { tone, pores, dullness } スコアオブジェクト
 * @returns {{ baseLook, colorLook }}
 */
export function recommendLooks(personalColor, skinScores) {
  const season      = personalColor?.season ?? null;
  const dullness    = skinScores?.dullness?.score ?? 70;
  const tone        = skinScores?.tone?.score    ?? 70;
  const needsCoverage = dullness < 60 || tone < 60;

  const baseCandidates = season
    ? BASE_LOOKS.filter(l => l.pcSeasons.includes(season))
    : BASE_LOOKS;

  let baseLook;
  if (needsCoverage) {
    baseLook = baseCandidates.find(l => l.id !== 'weekend-fresh')
            ?? BASE_LOOKS.find(l => l.id !== 'weekend-fresh')
            ?? BASE_LOOKS[0];
  } else {
    baseLook = baseCandidates[0] ?? BASE_LOOKS[0];
  }

  const colorLook = (season
    ? COLOR_LOOKS.find(l => l.pcSeasons.includes(season))
    : null) ?? COLOR_LOOKS[0];

  return { baseLook, colorLook };
}
