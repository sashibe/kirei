// scripts/mergeProducts.mjs
// rakutenProducts.js のAPIデータに colors/baseColor/season を追記して products.js を生成
import { readFileSync, writeFileSync } from 'fs';

const src = readFileSync('src/data/rakutenProducts.js', 'utf-8');
const match = src.match(/export const RAKUTEN_PRODUCTS = (\[[\s\S]*\]);/);
const products = JSON.parse(match[1]);

// 仕様書に基づくカラーデータ（商品順）
const COLOR_DATA = [
  // 0: リリミュウ センシュアルフィックスティント
  { colors: [
    { id: 'c01', name: 'カーディナルローズ', hex: '#C4607A' },
    { id: 'c02', name: 'クラシカルプラム',   hex: '#8B4060' },
    { id: 'c03', name: 'サンゴブロッサム',   hex: '#E8826A' },
    { id: 'c04', name: 'シナモンナッツ',     hex: '#B86840' },
    { id: 'c05', name: 'カヌレブラウン',     hex: '#8B5030' },
  ], baseColor: '#C4607A', season: 'winter' },

  // 1: ロムアンド
  { colors: [
    { id: 'c01', name: 'フィグフィグ',       hex: '#C84050' },
    { id: 'c02', name: 'ライチコーラル',     hex: '#E87060' },
    { id: 'c03', name: 'ポメロスキン',       hex: '#E8906A' },
    { id: 'c04', name: 'ピーチミー',         hex: '#E8A080' },
    { id: 'c05', name: 'アップルブラウン',   hex: '#A06040' },
  ], baseColor: '#C84050', season: 'spring' },

  // 2: YSL ラブシャイン
  { colors: [
    { id: 'c01', name: 'ヌード',             hex: '#D4906A' },
    { id: 'c02', name: 'ベアピンク',         hex: '#E8A090' },
    { id: 'c03', name: 'ローズ',             hex: '#D4708A' },
    { id: 'c04', name: 'コーラル',           hex: '#E87860' },
    { id: 'c05', name: 'レッド',             hex: '#C04050' },
  ], baseColor: '#D4708A', season: 'summer' },

  // 3: カイリジュメイ フラワーリップ
  { colors: [
    { id: 'c01', name: 'ピンクゴールド',     hex: '#E890A0' },
    { id: 'c02', name: 'ローズ',             hex: '#D06080' },
    { id: 'c03', name: 'ヌードピンク',       hex: '#E8B0A0' },
  ], baseColor: '#E890A0', season: 'spring' },

  // 4: カイリジュメイ 色が変わるリップ
  { colors: [
    { id: 'c01', name: 'クリア→ピンク',     hex: '#E8A0B0' },
    { id: 'c02', name: 'クリア→レッド',     hex: '#D06070' },
    { id: 'c03', name: 'クリア→コーラル',   hex: '#E88070' },
  ], baseColor: '#E8A0B0', season: 'spring' },

  // 5: トムフォード アイカラークォード
  { colors: [
    { id: 'c01', name: 'ゴールデンミンク',   hex: '#C4956A' },
    { id: 'c02', name: 'ローズゴールド',     hex: '#C48070' },
    { id: 'c03', name: 'スモーキーブラウン', hex: '#7A5040' },
    { id: 'c04', name: 'ディープブラウン',   hex: '#4A2820' },
    { id: 'c05', name: 'シャンパン',         hex: '#E8D4A8' },
  ], baseColor: '#C4956A', season: 'autumn' },

  // 6: CLIO プロアイパレット
  { colors: [
    { id: 'c01', name: 'ベージュ',           hex: '#D4B090' },
    { id: 'c02', name: 'テラコッタ',         hex: '#C07050' },
    { id: 'c03', name: 'バーント',           hex: '#8B4830' },
    { id: 'c04', name: 'チョコブラウン',     hex: '#5A3020' },
    { id: 'c05', name: 'ローズブラウン',     hex: '#C08070' },
  ], baseColor: '#D4B090', season: 'autumn' },

  // 7: リリミュウ インザミラーアイパレット
  { colors: [
    { id: 'c01', name: 'スノーピンク',       hex: '#F0D0D0' },
    { id: 'c02', name: 'コーラルピンク',     hex: '#E8A090' },
    { id: 'c03', name: 'モーブ',             hex: '#C090A0' },
    { id: 'c04', name: 'バーガンディ',       hex: '#904060' },
    { id: 'c05', name: 'ミルクブラウン',     hex: '#C0A080' },
  ], baseColor: '#F0D0D0', season: 'summer' },

  // 8: NOR. エアフィットクリームアイシャドウ
  { colors: [
    { id: 'c01', name: 'ミルクベージュ',     hex: '#E8D4B8' },
    { id: 'c02', name: 'ピーチコーラル',     hex: '#E8A888' },
    { id: 'c03', name: 'モーブローズ',       hex: '#C89098' },
    { id: 'c04', name: 'テラブラウン',       hex: '#A86848' },
    { id: 'c05', name: 'グレーブラウン',     hex: '#888078' },
  ], baseColor: '#E8D4B8', season: 'spring' },

  // 9: YSL クチュールミニクラッチ
  { colors: [
    { id: 'c01', name: 'ヌードベージュ',     hex: '#D4B898' },
    { id: 'c02', name: 'タフィーブラウン',   hex: '#A07858' },
    { id: 'c03', name: 'スモーキーグレー',   hex: '#888888' },
    { id: 'c04', name: 'ディープカーキ',     hex: '#606848' },
    { id: 'c05', name: 'ブラック',           hex: '#282828' },
  ], baseColor: '#D4B898', season: 'winter' },

  // 10: MAC グロープレイ
  { colors: [
    { id: 'c01', name: 'ラブジョイ',         hex: '#F0A888' },
    { id: 'c02', name: 'ファントム',         hex: '#E88878' },
    { id: 'c03', name: 'ブリーズ',           hex: '#E090A0' },
    { id: 'c04', name: 'スリル',             hex: '#E8A0B0' },
  ], baseColor: '#F0A888', season: 'spring' },

  // 11: dasique ブレンディングムードチーク
  { colors: [
    { id: 'c01', name: 'ローズベージュ',     hex: '#D4907A' },
    { id: 'c02', name: 'コーラルピーチ',     hex: '#E8A080' },
    { id: 'c03', name: 'モーブピンク',       hex: '#C888A0' },
    { id: 'c04', name: 'テラコッタ',         hex: '#C07858' },
  ], baseColor: '#D4907A', season: 'autumn' },

  // 12: ディアエー フラッフィーブラッシュ
  { colors: [
    { id: 'c01', name: 'スウィートピーチ',   hex: '#F0B090' },
    { id: 'c02', name: 'ベリーピンク',       hex: '#E090A8' },
    { id: 'c03', name: 'コーラルレッド',     hex: '#E07868' },
  ], baseColor: '#F0B090', season: 'spring' },

  // 13: MAC エクストラディメンション
  { colors: [
    { id: 'c01', name: 'サンラッシュ',       hex: '#E8B888' },
    { id: 'c02', name: 'ダブルグレーズ',     hex: '#D09888' },
    { id: 'c03', name: 'ピーチツイスト',     hex: '#F0A878' },
    { id: 'c04', name: 'オーシャンローズ',   hex: '#C88898' },
  ], baseColor: '#E8B888', season: 'autumn' },

  // 14: ペリペラ
  { colors: [
    { id: 'c01', name: 'ピーチサンシャイン', hex: '#F0B080' },
    { id: 'c02', name: 'ローズサンシャイン', hex: '#E898A8' },
    { id: 'c03', name: 'コーラルサンシャイン', hex: '#E88870' },
  ], baseColor: '#F0B080', season: 'spring' },

  // 15-19: ベース（共通カラー）
  ...Array(5).fill({
    colors: [
      { id: 'c01', name: 'ライト',           hex: '#F5E0CC' },
      { id: 'c02', name: 'ナチュラル',       hex: '#EDD0B0' },
      { id: 'c03', name: 'オークル',         hex: '#D4A880' },
      { id: 'c04', name: 'ダーク',           hex: '#B88860' },
    ], baseColor: '#EDD0B0', season: null,
  }),

  // 20-24: カラコン（共通カラー）
  ...Array(5).fill({
    colors: [
      { id: 'c01', name: 'ブラック',         hex: '#282828' },
      { id: 'c02', name: 'ダークブラウン',   hex: '#4A2810' },
      { id: 'c03', name: 'ブラウン',         hex: '#7A4820' },
      { id: 'c04', name: 'ヘーゼル',         hex: '#8B6840' },
      { id: 'c05', name: 'グレー',           hex: '#808088' },
    ], baseColor: '#4A2810', season: null,
  }),
];

// Merge
products.forEach((p, i) => {
  if (COLOR_DATA[i]) {
    p.colors = COLOR_DATA[i].colors;
    p.baseColor = COLOR_DATA[i].baseColor;
    p.season = COLOR_DATA[i].season;
  }
  // Shorten name
  p.name = p.name.replace(/^【[^】]*】/g, '').trim().slice(0, 35);
});

const output = `// src/data/products.js
// 楽天APIデータ + 仕様書カラーデータをマージ
// 生成日: ${new Date().toISOString()}

export const PRODUCTS = ${JSON.stringify(products, null, 2)};
`;

writeFileSync('src/data/products.js', output, 'utf-8');
console.log('完了: products.js に書き出しました');
