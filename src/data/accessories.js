// src/data/accessories.js

// カラコンデータ（改善4: カラコンARカテゴリー追加）
export const CONTACT_LENS_ITEMS = [
  { id: 'none', name: 'なし', emoji: '✕', price: 0 },
  // ブラウン系
  { id: 'brown-natural', name: 'ナチュラルブラウン', emoji: '🟤', color: '#8B5E3C', price: 1800 },
  { id: 'brown-choco', name: 'チョコブラウン', emoji: '🟤', color: '#5C3A1E', price: 1800 },
  { id: 'brown-hazel', name: 'ヘーゼル', emoji: '🟤', color: '#A67B4B', price: 1900 },
  // グレー系
  { id: 'gray-light', name: 'ライトグレー', emoji: '🩶', color: '#9E9E9E', price: 1900 },
  { id: 'gray-charcoal', name: 'チャコールグレー', emoji: '🩶', color: '#5A5A5A', price: 1900 },
  { id: 'gray-silver', name: 'シルバーグレー', emoji: '🩶', color: '#B0B0B0', price: 2000 },
  // ブルー系
  { id: 'blue-aqua', name: 'アクアブルー', emoji: '🔵', color: '#4A90C4', price: 2100 },
  { id: 'blue-sapphire', name: 'サファイア', emoji: '🔵', color: '#2E5B8A', price: 2100 },
  { id: 'blue-ice', name: 'アイスブルー', emoji: '🔵', color: '#7EC8E3', price: 2200 },
  // グリーン系
  { id: 'green-olive', name: 'オリーブ', emoji: '🟢', color: '#6B8E4E', price: 2100 },
  { id: 'green-emerald', name: 'エメラルド', emoji: '🟢', color: '#3A8A5C', price: 2200 },
  { id: 'green-jade', name: 'ジェイド', emoji: '🟢', color: '#5FAD7A', price: 2100 },
  // パープル系
  { id: 'purple-lavender', name: 'ラベンダー', emoji: '🟣', color: '#9B7DB8', price: 2200 },
  { id: 'purple-amethyst', name: 'アメジスト', emoji: '🟣', color: '#7B4F9E', price: 2300 },
  { id: 'purple-violet', name: 'バイオレット', emoji: '🟣', color: '#6A3D9A', price: 2200 },
];

export const GLASSES_ITEMS = [
  {
    id: 'none',
    name: 'なし',
    emoji: '✕',
    price: 0,
  },
  {
    id: 'round-gold',
    name: 'ラウンドゴールド',
    emoji: '👓',
    color: '#c8a840',
    shape: 'round',
    price: 18900,
  },
  {
    id: 'square-black',
    name: 'スクエアブラック',
    emoji: '🕶️',
    color: '#1a1a1a',
    shape: 'square',
    price: 22000,
  },
  {
    id: 'oval-silver',
    name: 'オーバルシルバー',
    emoji: '👓',
    color: '#c0c0c0',
    shape: 'oval',
    price: 16500,
  },
  {
    id: 'sunglass-tort',
    name: 'サングラス トータス',
    emoji: '🕶️',
    color: '#8a5a2a',
    shape: 'wayfarer',
    lensColor: 'rgba(60,40,20,0.55)',
    price: 14800,
  },
];

export const EARRING_ITEMS = [
  {
    id: 'none',
    name: 'なし',
    emoji: '✕',
    price: 0,
  },
  {
    id: 'pearl-drop',
    name: 'パールドロップ',
    emoji: '💎',
    color: '#f8f4f0',
    type: 'drop',
    price: 3800,
  },
  {
    id: 'gold-hoop',
    name: 'ゴールドフープ',
    emoji: '💛',
    color: '#c8a840',
    type: 'hoop',
    price: 5200,
  },
  {
    id: 'crystal-stud',
    name: 'クリスタルスタッド',
    emoji: '✨',
    color: '#e8f4ff',
    type: 'stud',
    price: 2900,
  },
  {
    id: 'silver-chain',
    name: 'シルバーチェーン',
    emoji: '🔗',
    color: '#c0c0c0',
    type: 'chain',
    price: 4600,
  },
];
