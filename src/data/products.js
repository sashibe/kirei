// src/data/products.js
// 実商品データ（楽天API取得予定・現在はハードコード）
// API連携成功後にfetchRakutenProducts.mjsで差し替え

export const PRODUCTS = [
  // === リップ ===
  {
    id: 'lip-001', category: 'lip',
    name: 'ウォーターティントリップ',
    price: 1320,
    image: '',
    affiliateUrl: '#',
    colors: [
      { id: 'l01', name: 'コーラルピンク', hex: '#E8705A' },
      { id: 'l02', name: 'ロゼベージュ',   hex: '#C4826A' },
      { id: 'l03', name: 'モーブローズ',   hex: '#B06080' },
      { id: 'l04', name: 'レッド',         hex: '#C03030' },
      { id: 'l05', name: 'テラコッタ',     hex: '#A05040' },
    ],
    baseColor: '#E8705A',
  },
  {
    id: 'lip-002', category: 'lip',
    name: 'マットリップスティック',
    price: 1980,
    image: '',
    affiliateUrl: '#',
    colors: [
      { id: 'l06', name: 'ヌードピンク',   hex: '#D4826A' },
      { id: 'l07', name: 'バーガンディ',   hex: '#8B2252' },
      { id: 'l08', name: 'ブリックレッド', hex: '#B85050' },
      { id: 'l09', name: 'プラムローズ',   hex: '#9F4070' },
    ],
    baseColor: '#D4826A',
  },
  {
    id: 'lip-003', category: 'lip',
    name: 'グロスティント',
    price: 880,
    image: '',
    affiliateUrl: '#',
    colors: [
      { id: 'l10', name: 'チェリー',     hex: '#CF3060' },
      { id: 'l11', name: 'ピーチ',       hex: '#FF9080' },
      { id: 'l12', name: 'ストロベリー', hex: '#E8607C' },
    ],
    baseColor: '#E8607C',
  },

  // === アイシャドウ ===
  {
    id: 'eye-001', category: 'eyeshadow',
    name: 'コーラルブラウンパレット',
    price: 1980,
    image: '',
    affiliateUrl: '#',
    colors: [
      { id: 'e01', name: 'コーラル',       hex: '#C4956A' },
      { id: 'e02', name: 'ピーチベージュ', hex: '#E8967A' },
      { id: 'e03', name: 'ゴールド',       hex: '#D4A86A' },
      { id: 'e04', name: 'ブラウン',       hex: '#8B6355' },
    ],
    baseColor: '#C4956A',
    season: 'spring',
  },
  {
    id: 'eye-002', category: 'eyeshadow',
    name: 'モーブピンクパレット',
    price: 2200,
    image: '',
    affiliateUrl: '#',
    colors: [
      { id: 'e05', name: 'モーブ',       hex: '#C8A2C8' },
      { id: 'e06', name: 'ラベンダー',   hex: '#D8BFD8' },
      { id: 'e07', name: 'ローズ',       hex: '#C48EA1' },
      { id: 'e08', name: 'グレイッシュ', hex: '#9B8A9E' },
    ],
    baseColor: '#C8A2C8',
    season: 'summer',
  },
  {
    id: 'eye-003', category: 'eyeshadow',
    name: 'テラコッタブラウンパレット',
    price: 1760,
    image: '',
    affiliateUrl: '#',
    colors: [
      { id: 'e09', name: 'テラコッタ', hex: '#D2691E' },
      { id: 'e10', name: 'カーキ',     hex: '#8B7355' },
      { id: 'e11', name: 'オリーブ',   hex: '#6B6340' },
      { id: 'e12', name: 'ディープ',   hex: '#5A3825' },
    ],
    baseColor: '#D2691E',
    season: 'autumn',
  },
  {
    id: 'eye-004', category: 'eyeshadow',
    name: 'ネイビーパープルパレット',
    price: 2640,
    image: '',
    affiliateUrl: '#',
    colors: [
      { id: 'e13', name: 'ネイビー', hex: '#483D8B' },
      { id: 'e14', name: 'パープル', hex: '#6A4C93' },
      { id: 'e15', name: 'シルバー', hex: '#A8A8A8' },
      { id: 'e16', name: 'ブラック', hex: '#2C2C3E' },
    ],
    baseColor: '#483D8B',
    season: 'winter',
  },

  // === チーク ===
  {
    id: 'cheek-001', category: 'cheek',
    name: 'パウダーブラッシュ',
    price: 1540,
    image: '',
    affiliateUrl: '#',
    colors: [
      { id: 'c01', name: 'コーラル',     hex: '#E8967A' },
      { id: 'c02', name: 'ピーチ',       hex: '#FFB6A0' },
      { id: 'c03', name: 'ローズ',       hex: '#DB7093' },
      { id: 'c04', name: 'プラム',       hex: '#C06080' },
    ],
    baseColor: '#E8967A',
  },
  {
    id: 'cheek-002', category: 'cheek',
    name: 'クリームチーク',
    price: 1100,
    image: '',
    affiliateUrl: '#',
    colors: [
      { id: 'c05', name: 'アプリコット', hex: '#FFAA80' },
      { id: 'c06', name: 'ベビーピンク', hex: '#FFB6C1' },
      { id: 'c07', name: 'オレンジ',     hex: '#FF8C60' },
    ],
    baseColor: '#FFAA80',
  },

  // === ベース ===
  {
    id: 'base-001', category: 'base',
    name: 'BBクリーム SPF50+',
    price: 1650,
    image: '',
    affiliateUrl: '#',
    colors: [
      { id: 'b01', name: 'ライトベージュ', hex: '#F5DEB3' },
      { id: 'b02', name: 'ナチュラル',     hex: '#E8D0B0' },
      { id: 'b03', name: 'オークル',       hex: '#D4B896' },
    ],
    baseColor: '#E8D0B0',
  },
  {
    id: 'base-002', category: 'base',
    name: 'リキッドファンデーション',
    price: 2420,
    image: '',
    affiliateUrl: '#',
    colors: [
      { id: 'b04', name: 'ピンクベージュ', hex: '#F0D0C0' },
      { id: 'b05', name: 'ベージュ',       hex: '#E0C8A8' },
      { id: 'b06', name: 'オークル',       hex: '#D0B890' },
    ],
    baseColor: '#E0C8A8',
  },

  // === カラコン ===
  {
    id: 'con-001', category: 'contacts',
    name: 'ナチュラルワンデー 10枚',
    price: 1760,
    image: '',
    affiliateUrl: '#',
    colors: [
      { id: 'cn01', name: 'ブラウン',       hex: '#8B6914' },
      { id: 'cn02', name: 'ヘーゼル',       hex: '#A07830' },
      { id: 'cn03', name: 'オリーブ',       hex: '#6B8E23' },
      { id: 'cn04', name: 'グレー',         hex: '#808080' },
    ],
    baseColor: '#8B6914',
  },
  {
    id: 'con-002', category: 'contacts',
    name: 'カラーレンズ 1day',
    price: 2200,
    image: '',
    affiliateUrl: '#',
    colors: [
      { id: 'cn05', name: 'アクアブルー', hex: '#4682B4' },
      { id: 'cn06', name: 'バイオレット', hex: '#8A2BE2' },
      { id: 'cn07', name: 'ダークブラウン', hex: '#5C3317' },
      { id: 'cn08', name: 'チョコ',       hex: '#7B3F00' },
    ],
    baseColor: '#4682B4',
  },
];
