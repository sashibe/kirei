// scripts/mergeProducts.mjs
// rakutenProducts.js のAPIデータに仕様書の名前・colors・画像をマージ
import { readFileSync, writeFileSync } from 'fs';

const src = readFileSync('src/data/rakutenProducts.js', 'utf-8');
const match = src.match(/export const RAKUTEN_PRODUCTS = (\[[\s\S]*\]);/);
const products = JSON.parse(match[1]);

// 仕様書に基づく商品名・カラー・画像データ（順番はAPIデータと一致）
const SPEC_DATA = [
  // 0: lip - リリミュウ
  { name: 'リリミュウ センシュアルフィックスティント', localImage: 'lip_ririmew_sensual.jpg', season: 'winter',
    colors: [
      { id: 'c01', name: 'カーディナルローズ', hex: '#C4607A' },
      { id: 'c02', name: 'クラシカルプラム',   hex: '#8B4060' },
      { id: 'c03', name: 'サンゴブロッサム',   hex: '#E8826A' },
      { id: 'c04', name: 'シナモンナッツ',     hex: '#B86840' },
      { id: 'c05', name: 'カヌレブラウン',     hex: '#8B5030' },
    ], baseColor: '#C4607A' },

  // 1: lip - ロムアンド
  { name: 'ロムアンド ジューシーラスティングティント', localImage: 'lip_romand_juicy.jpg', season: 'spring',
    colors: [
      { id: 'c01', name: 'フィグフィグ',       hex: '#C84050' },
      { id: 'c02', name: 'ライチコーラル',     hex: '#E87060' },
      { id: 'c03', name: 'ポメロスキン',       hex: '#E8906A' },
      { id: 'c04', name: 'ピーチミー',         hex: '#E8A080' },
      { id: 'c05', name: 'アップルブラウン',   hex: '#A06040' },
    ], baseColor: '#C84050' },

  // 2: lip - YSL
  { name: 'YSL ラブシャイン キャンディグロウバーム', localImage: 'lip_ysl_loveshyne.jpg', season: 'summer',
    colors: [
      { id: 'c01', name: 'ヌード',             hex: '#D4906A' },
      { id: 'c02', name: 'ベアピンク',         hex: '#E8A090' },
      { id: 'c03', name: 'ローズ',             hex: '#D4708A' },
      { id: 'c04', name: 'コーラル',           hex: '#E87860' },
      { id: 'c05', name: 'レッド',             hex: '#C04050' },
    ], baseColor: '#D4708A' },

  // 3: lip - カイリジュメイ フラワーリップ
  { name: 'カイリジュメイ フラワーリップ', localImage: 'lip_kaijumei_flower.jpg', season: 'spring',
    colors: [
      { id: 'c01', name: 'ピンクゴールド',     hex: '#E890A0' },
      { id: 'c02', name: 'ローズ',             hex: '#D06080' },
      { id: 'c03', name: 'ヌードピンク',       hex: '#E8B0A0' },
    ], baseColor: '#E890A0' },

  // 4: lip - カイリジュメイ 色が変わるリップ
  { name: 'カイリジュメイ 色が変わるリップ', localImage: 'lip_kaijumei_change.jpg', season: 'spring',
    colors: [
      { id: 'c01', name: 'クリア→ピンク',     hex: '#E8A0B0' },
      { id: 'c02', name: 'クリア→レッド',     hex: '#D06070' },
      { id: 'c03', name: 'クリア→コーラル',   hex: '#E88070' },
    ], baseColor: '#E8A0B0' },

  // 5: eyeshadow - トムフォード
  { name: 'トムフォード アイカラークォード', localImage: 'eye_tomford_quad.jpg', season: 'autumn',
    colors: [
      { id: 'c01', name: 'ゴールデンミンク',   hex: '#C4956A' },
      { id: 'c02', name: 'ローズゴールド',     hex: '#C48070' },
      { id: 'c03', name: 'スモーキーブラウン', hex: '#7A5040' },
      { id: 'c04', name: 'ディープブラウン',   hex: '#4A2820' },
      { id: 'c05', name: 'シャンパン',         hex: '#E8D4A8' },
    ], baseColor: '#C4956A' },

  // 6: eyeshadow - CLIO
  { name: 'CLIO プロアイパレット エアー', localImage: 'eye_clio_pro.jpg', season: 'autumn',
    colors: [
      { id: 'c01', name: 'ベージュ',           hex: '#D4B090' },
      { id: 'c02', name: 'テラコッタ',         hex: '#C07050' },
      { id: 'c03', name: 'バーント',           hex: '#8B4830' },
      { id: 'c04', name: 'チョコブラウン',     hex: '#5A3020' },
      { id: 'c05', name: 'ローズブラウン',     hex: '#C08070' },
    ], baseColor: '#D4B090' },

  // 7: eyeshadow - リリミュウ
  { name: 'リリミュウ インザミラーアイパレット', localImage: 'eye_ririmew_mirror.jpg', season: 'summer',
    colors: [
      { id: 'c01', name: 'スノーピンク',       hex: '#F0D0D0' },
      { id: 'c02', name: 'コーラルピンク',     hex: '#E8A090' },
      { id: 'c03', name: 'モーブ',             hex: '#C090A0' },
      { id: 'c04', name: 'バーガンディ',       hex: '#904060' },
      { id: 'c05', name: 'ミルクブラウン',     hex: '#C0A080' },
    ], baseColor: '#F0D0D0' },

  // 8: eyeshadow - NOR.
  { name: 'NOR. エアフィットクリームアイシャドウ', localImage: 'eye_nor_airfit.jpg', season: 'spring',
    colors: [
      { id: 'c01', name: 'ミルクベージュ',     hex: '#E8D4B8' },
      { id: 'c02', name: 'ピーチコーラル',     hex: '#E8A888' },
      { id: 'c03', name: 'モーブローズ',       hex: '#C89098' },
      { id: 'c04', name: 'テラブラウン',       hex: '#A86848' },
      { id: 'c05', name: 'グレーブラウン',     hex: '#888078' },
    ], baseColor: '#E8D4B8' },

  // 9: eyeshadow - YSL
  { name: 'YSL クチュールミニクラッチ', localImage: 'eye_ysl_couture.jpg', season: 'winter',
    colors: [
      { id: 'c01', name: 'ヌードベージュ',     hex: '#D4B898' },
      { id: 'c02', name: 'タフィーブラウン',   hex: '#A07858' },
      { id: 'c03', name: 'スモーキーグレー',   hex: '#888888' },
      { id: 'c04', name: 'ディープカーキ',     hex: '#606848' },
      { id: 'c05', name: 'ブラック',           hex: '#282828' },
    ], baseColor: '#D4B898' },

  // 10: cheek - MAC グロープレイ
  { name: 'MAC グロープレイ クッショニーブラッシュ', localImage: 'cheek_mac_glowplay.jpg', season: 'spring',
    colors: [
      { id: 'c01', name: 'ラブジョイ',         hex: '#F0A888' },
      { id: 'c02', name: 'ファントム',         hex: '#E88878' },
      { id: 'c03', name: 'ブリーズ',           hex: '#E090A0' },
      { id: 'c04', name: 'スリル',             hex: '#E8A0B0' },
    ], baseColor: '#F0A888' },

  // 11: cheek - dasique
  { name: 'dasique ブレンディングムードチーク', localImage: 'cheek_dasique_blending.jpg', season: 'autumn',
    colors: [
      { id: 'c01', name: 'ローズベージュ',     hex: '#D4907A' },
      { id: 'c02', name: 'コーラルピーチ',     hex: '#E8A080' },
      { id: 'c03', name: 'モーブピンク',       hex: '#C888A0' },
      { id: 'c04', name: 'テラコッタ',         hex: '#C07858' },
    ], baseColor: '#D4907A' },

  // 12: cheek - ディアエー
  { name: 'ディアエー フラッフィーブラッシュ', localImage: 'cheek_dearea_fluffy.jpg', season: 'spring',
    colors: [
      { id: 'c01', name: 'スウィートピーチ',   hex: '#F0B090' },
      { id: 'c02', name: 'ベリーピンク',       hex: '#E090A8' },
      { id: 'c03', name: 'コーラルレッド',     hex: '#E07868' },
    ], baseColor: '#F0B090' },

  // 13: cheek - MAC エクストラディメンション
  { name: 'MAC エクストラディメンション ブラッシュ', localImage: 'cheek_mac_extradimension.jpg', season: 'autumn',
    colors: [
      { id: 'c01', name: 'サンラッシュ',       hex: '#E8B888' },
      { id: 'c02', name: 'ダブルグレーズ',     hex: '#D09888' },
      { id: 'c03', name: 'ピーチツイスト',     hex: '#F0A878' },
      { id: 'c04', name: 'オーシャンローズ',   hex: '#C88898' },
    ], baseColor: '#E8B888' },

  // 14: cheek - ペリペラ
  { name: 'ペリペラ ピュアブラッシュド サンシャインチーク', localImage: 'cheek_peripera_sunshine.jpg', season: 'spring',
    colors: [
      { id: 'c01', name: 'ピーチサンシャイン', hex: '#F0B080' },
      { id: 'c02', name: 'ローズサンシャイン', hex: '#E898A8' },
      { id: 'c03', name: 'コーラルサンシャイン', hex: '#E88870' },
    ], baseColor: '#F0B080' },

  // 15: base - レステモ
  { name: 'レステモ BBクリーム', localImage: 'base_restemo_bb.jpg', season: null,
    colors: [
      { id: 'c01', name: 'ライト', hex: '#F5E0CC' },
      { id: 'c02', name: 'ナチュラル', hex: '#EDD0B0' },
      { id: 'c03', name: 'オークル', hex: '#D4A880' },
      { id: 'c04', name: 'ダーク', hex: '#B88860' },
    ], baseColor: '#EDD0B0' },

  // 16: base - ビタミンC
  { name: 'ビタミンC リキッドファンデーション', localImage: 'base_vitaminc_liquid.jpg', season: null,
    colors: [
      { id: 'c01', name: 'ライト', hex: '#F5E0CC' },
      { id: 'c02', name: 'ナチュラル', hex: '#EDD0B0' },
      { id: 'c03', name: 'オークル', hex: '#D4A880' },
      { id: 'c04', name: 'ダーク', hex: '#B88860' },
    ], baseColor: '#EDD0B0' },

  // 17: base - ロングフィット
  { name: 'ロングフィット BBクリーム SPF50+', localImage: 'base_longfit_bb.jpg', season: null,
    colors: [
      { id: 'c01', name: 'ライト', hex: '#F5E0CC' },
      { id: 'c02', name: 'ナチュラル', hex: '#EDD0B0' },
      { id: 'c03', name: 'オークル', hex: '#D4A880' },
      { id: 'c04', name: 'ダーク', hex: '#B88860' },
    ], baseColor: '#EDD0B0' },

  // 18: base - ベルリッチ
  { name: 'ベルリッチ オイルフリーリキッドファンデ', localImage: 'base_belrich_liquid.jpg', season: null,
    colors: [
      { id: 'c01', name: 'ライト', hex: '#F5E0CC' },
      { id: 'c02', name: 'ナチュラル', hex: '#EDD0B0' },
      { id: 'c03', name: 'オークル', hex: '#D4A880' },
      { id: 'c04', name: 'ダーク', hex: '#B88860' },
    ], baseColor: '#EDD0B0' },

  // 19: base - ベルリッチ お試し
  { name: 'ベルリッチ リキッドファンデ お試し', localImage: 'base_belrich_trial.jpg', season: null,
    colors: [
      { id: 'c01', name: 'ライト', hex: '#F5E0CC' },
      { id: 'c02', name: 'ナチュラル', hex: '#EDD0B0' },
      { id: 'c03', name: 'オークル', hex: '#D4A880' },
      { id: 'c04', name: 'ダーク', hex: '#B88860' },
    ], baseColor: '#EDD0B0' },

  // 20: contacts - エバーカラー
  { name: 'エバーカラーワンデーナチュラル', localImage: 'colorcon_evercolor_natural.jpg', season: null,
    colors: [
      { id: 'c01', name: 'ブラック', hex: '#282828' },
      { id: 'c02', name: 'ダークブラウン', hex: '#4A2810' },
      { id: 'c03', name: 'ブラウン', hex: '#7A4820' },
      { id: 'c04', name: 'ヘーゼル', hex: '#8B6840' },
      { id: 'c05', name: 'グレー', hex: '#808088' },
    ], baseColor: '#4A2810' },

  // 21: contacts - ReVIA
  { name: 'ReVIA 1day COLOR', localImage: 'colorcon_revia_1day.jpg', season: null,
    colors: [
      { id: 'c01', name: 'ブラック', hex: '#282828' },
      { id: 'c02', name: 'ダークブラウン', hex: '#4A2810' },
      { id: 'c03', name: 'ブラウン', hex: '#7A4820' },
      { id: 'c04', name: 'ヘーゼル', hex: '#8B6840' },
      { id: 'c05', name: 'グレー', hex: '#808088' },
    ], baseColor: '#4A2810' },

  // 22: contacts - アイコフレ
  { name: 'シード アイコフレワンデー UV M', localImage: 'colorcon_seed_eyecoffre.jpg', season: null,
    colors: [
      { id: 'c01', name: 'ブラック', hex: '#282828' },
      { id: 'c02', name: 'ダークブラウン', hex: '#4A2810' },
      { id: 'c03', name: 'ブラウン', hex: '#7A4820' },
      { id: 'c04', name: 'ヘーゼル', hex: '#8B6840' },
      { id: 'c05', name: 'グレー', hex: '#808088' },
    ], baseColor: '#4A2810' },

  // 23: contacts - ネオサイト
  { name: 'ネオサイトワンデーリングUV', localImage: 'colorcon_neosight_ring.jpg', season: null,
    colors: [
      { id: 'c01', name: 'ブラック', hex: '#282828' },
      { id: 'c02', name: 'ダークブラウン', hex: '#4A2810' },
      { id: 'c03', name: 'ブラウン', hex: '#7A4820' },
      { id: 'c04', name: 'ヘーゼル', hex: '#8B6840' },
      { id: 'c05', name: 'グレー', hex: '#808088' },
    ], baseColor: '#4A2810' },

  // 24: contacts - ラヴェール
  { name: 'ラヴェール 倖田來未カラコン', localImage: 'colorcon_laviere_koda.jpg', season: null,
    colors: [
      { id: 'c01', name: 'ブラック', hex: '#282828' },
      { id: 'c02', name: 'ダークブラウン', hex: '#4A2810' },
      { id: 'c03', name: 'ブラウン', hex: '#7A4820' },
      { id: 'c04', name: 'ヘーゼル', hex: '#8B6840' },
      { id: 'c05', name: 'グレー', hex: '#808088' },
    ], baseColor: '#4A2810' },
];

// Merge
products.forEach((p, i) => {
  if (!SPEC_DATA[i]) return;
  const spec = SPEC_DATA[i];
  p.name = spec.name;
  p.colors = spec.colors;
  p.baseColor = spec.baseColor;
  p.season = spec.season;
  p.localImage = spec.localImage;
});

const output = `// src/data/products.js
// 楽天APIデータ + 仕様書カラー・商品名・ローカル画像をマージ
// 生成日: ${new Date().toISOString()}

export const PRODUCTS = ${JSON.stringify(products, null, 2)};
`;

writeFileSync('src/data/products.js', output, 'utf-8');
console.log('完了: products.js に書き出しました');
