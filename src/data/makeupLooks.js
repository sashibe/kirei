// src/data/makeupLooks.js

// タブ 0: Color makeup
export const COLOR_LOOKS = [
  {
    id: 'glow', name: 'ツヤ肌ブルームルック',
    desc: '血色感のあるコーラルピンクで自然なツヤを演出',
    reason: 'くすみスコアが良好なので、ツヤ肌が映えます',
    lip: '#e8607c', cheek: 'rgba(232,96,124,0.25)', eyeshadow: 'rgba(232,150,120,0.2)',
    products: [
      { emoji: '💄', name: 'シアーグロウリップ', shade: 'コーラルピンク', price: 2480 },
      { emoji: '🌸', name: 'ブルームチーク', shade: 'ピーチ', price: 1980 },
    ],
  },
  {
    id: 'matte', name: 'マットシックルック',
    desc: '落ち着いたローズでクールな印象に',
    reason: '肌トーンが安定しているので、マット仕上げが映えます',
    lip: '#c45a6a', cheek: 'rgba(180,90,100,0.2)', eyeshadow: 'rgba(160,120,140,0.25)',
    products: [
      { emoji: '💄', name: 'ベルベットリップ', shade: 'ダスティローズ', price: 2680 },
      { emoji: '✨', name: 'マットチーク', shade: 'ローズ', price: 2180 },
    ],
  },
  {
    id: 'warm', name: 'ウォームグロウルック',
    desc: 'オレンジ系で健康的な血色感をプラス',
    reason: 'パーソナルカラーに合わせた暖色系で統一感UP',
    lip: '#e07850', cheek: 'rgba(224,120,80,0.2)', eyeshadow: 'rgba(200,140,90,0.2)',
    products: [
      { emoji: '💄', name: 'ジューシーリップ', shade: 'アプリコット', price: 2380 },
      { emoji: '🌻', name: 'サンキスチーク', shade: 'オレンジ', price: 1880 },
    ],
  },
];

// タブ 1: Base makeup
export const BASE_LOOKS = [
  {
    id: 'clean-natural', name: 'クリーンナチュラル',
    desc: 'BBクリーム + コンシーラーで肌の色ムラを均一に',
    reason: '肌トーンスコアを活かして清潔感のある印象に',
    base: '#e8d8c8', concealer: '#d4c0a8',
    products: [
      { emoji: '🧴', name: 'ナチュラルBBクリーム', shade: 'ライトベージュ', price: 1980 },
      { emoji: '✨', name: 'カバーコンシーラー', shade: 'ナチュラル', price: 1480 },
    ],
  },
  {
    id: 'business-sharp', name: 'ビジネスシャープ',
    desc: 'トーンアップ下地 + 眉マスカラでキリッとした印象に',
    reason: 'パーソナルカラーに合わせた眉色で知的に仕上げる',
    base: '#d8cfc0', brow: '#8a7a6a',
    products: [
      { emoji: '🧴', name: 'トーンアップ下地', shade: 'ラベンダー', price: 2280 },
      { emoji: '🖌️', name: 'アイブロウマスカラ', shade: 'アッシュブラウン', price: 1280 },
    ],
  },
  {
    id: 'weekend-fresh', name: 'ウィークエンドフレッシュ',
    desc: '軽いトーンアップ + リップバームで爽やかに',
    reason: '休日のリラックスした印象をキープ',
    base: '#f0e4d8', lip: '#d8a8a0',
    products: [
      { emoji: '🧴', name: 'トーンアップジェル', shade: 'クリア', price: 1680 },
      { emoji: '💋', name: 'カラーリップバーム', shade: 'ピンクベージュ', price: 980 },
    ],
  },
];

// タブ 2: Skin care
export const SKINCARE_ROUTINE = {
  morning: [
    { step: '洗顔', product: 'アミノ酸洗顔フォーム', price: 1480 },
    { step: '化粧水', product: 'トーニングローション', price: 1980 },
    { step: '乳液', product: 'モイスチャーミルク', price: 2280 },
    { step: '日焼け止め', product: 'UVプロテクトジェル SPF50+', price: 1680 },
  ],
  night: [
    { step: 'クレンジング', product: 'ジェルクレンジング', price: 1580 },
    { step: '洗顔', product: 'アミノ酸洗顔フォーム', price: 1480 },
    { step: '美容液', product: 'ビタミンC美容液', price: 3280 },
    { step: 'クリーム', product: 'バリアリペアクリーム', price: 2480 },
  ],
};
