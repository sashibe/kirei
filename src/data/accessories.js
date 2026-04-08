// src/data/accessories.js

// カラコンデータ
export const CONTACT_LENS_ITEMS = [
  { id: 'none', name: { ja: 'なし', ko: '없음', en: 'None' }, emoji: '✕', price: 0 },
  { id: 'brown-natural', name: { ja: 'ナチュラルブラウン', ko: '내추럴 브라운', en: 'Natural Brown' }, emoji: '🟤', color: '#8B5E3C', price: 1800 },
  { id: 'brown-choco', name: { ja: 'チョコブラウン', ko: '초코 브라운', en: 'Choco Brown' }, emoji: '🟤', color: '#5C3A1E', price: 1800 },
  { id: 'brown-hazel', name: { ja: 'ヘーゼル', ko: '헤이즐', en: 'Hazel' }, emoji: '🟤', color: '#A67B4B', price: 1900 },
  { id: 'gray-light', name: { ja: 'ライトグレー', ko: '라이트 그레이', en: 'Light Gray' }, emoji: '🩶', color: '#9E9E9E', price: 1900 },
  { id: 'gray-charcoal', name: { ja: 'チャコールグレー', ko: '차콜 그레이', en: 'Charcoal Gray' }, emoji: '🩶', color: '#5A5A5A', price: 1900 },
  { id: 'gray-silver', name: { ja: 'シルバーグレー', ko: '실버 그레이', en: 'Silver Gray' }, emoji: '🩶', color: '#B0B0B0', price: 2000 },
  { id: 'blue-aqua', name: { ja: 'アクアブルー', ko: '아쿠아 블루', en: 'Aqua Blue' }, emoji: '🔵', color: '#4A90C4', price: 2100 },
  { id: 'blue-sapphire', name: { ja: 'サファイア', ko: '사파이어', en: 'Sapphire' }, emoji: '🔵', color: '#2E5B8A', price: 2100 },
  { id: 'blue-ice', name: { ja: 'アイスブルー', ko: '아이스 블루', en: 'Ice Blue' }, emoji: '🔵', color: '#7EC8E3', price: 2200 },
  { id: 'green-olive', name: { ja: 'オリーブ', ko: '올리브', en: 'Olive' }, emoji: '🟢', color: '#6B8E4E', price: 2100 },
  { id: 'green-emerald', name: { ja: 'エメラルド', ko: '에메랄드', en: 'Emerald' }, emoji: '🟢', color: '#3A8A5C', price: 2200 },
  { id: 'green-jade', name: { ja: 'ジェイド', ko: '제이드', en: 'Jade' }, emoji: '🟢', color: '#5FAD7A', price: 2100 },
  { id: 'purple-lavender', name: { ja: 'ラベンダー', ko: '라벤더', en: 'Lavender' }, emoji: '🟣', color: '#9B7DB8', price: 2200 },
  { id: 'purple-amethyst', name: { ja: 'アメジスト', ko: '아메시스트', en: 'Amethyst' }, emoji: '🟣', color: '#7B4F9E', price: 2300 },
  { id: 'purple-violet', name: { ja: 'バイオレット', ko: '바이올렛', en: 'Violet' }, emoji: '🟣', color: '#6A3D9A', price: 2200 },
];

export const GLASSES_ITEMS = [
  { id: 'none', name: { ja: 'なし', ko: '없음', en: 'None' }, emoji: '✕', price: 0 },
  { id: 'round-gold', name: { ja: 'ラウンドゴールド', ko: '라운드 골드', en: 'Round Gold' }, emoji: '👓', color: '#c8a840', shape: 'round', price: 18900 },
  { id: 'square-black', name: { ja: 'スクエアブラック', ko: '스퀘어 블랙', en: 'Square Black' }, emoji: '🕶️', color: '#1a1a1a', shape: 'square', price: 22000 },
  { id: 'oval-silver', name: { ja: 'オーバルシルバー', ko: '오벌 실버', en: 'Oval Silver' }, emoji: '👓', color: '#c0c0c0', shape: 'oval', price: 16500 },
  { id: 'sunglass-tort', name: { ja: 'サングラス トータス', ko: '선글라스 토터스', en: 'Sunglasses Tortoise' }, emoji: '🕶️', color: '#8a5a2a', shape: 'wayfarer', lensColor: 'rgba(60,40,20,0.55)', price: 14800 },
];

export const EARRING_ITEMS = [
  { id: 'none', name: { ja: 'なし', ko: '없음', en: 'None' }, emoji: '✕', price: 0 },
  { id: 'pearl-drop', name: { ja: 'パールドロップ', ko: '펄 드롭', en: 'Pearl Drop' }, emoji: '💎', color: '#f8f4f0', type: 'drop', price: 3800 },
  { id: 'gold-hoop', name: { ja: 'ゴールドフープ', ko: '골드 후프', en: 'Gold Hoop' }, emoji: '💛', color: '#c8a840', type: 'hoop', price: 5200 },
  { id: 'crystal-stud', name: { ja: 'クリスタルスタッド', ko: '크리스탈 스터드', en: 'Crystal Stud' }, emoji: '✨', color: '#e8f4ff', type: 'stud', price: 2900 },
  { id: 'silver-chain', name: { ja: 'シルバーチェーン', ko: '실버 체인', en: 'Silver Chain' }, emoji: '🔗', color: '#c0c0c0', type: 'chain', price: 4600 },
];
