// scripts/fetchRakutenProducts.mjs
// 実行: node scripts/fetchRakutenProducts.mjs

import { writeFileSync } from 'fs';

const APP_ID       = 'fea85589-cff0-4ce0-afbd-f249bb6adf15';
const ACCESS_KEY   = 'pk_bMcKgnAQXQbnGFAOnxiLLPsnsO1jgJAz7Pup11QiGT1';
const AFFILIATE_ID = '529d62d4.9af01a4d.529d62d5.1d5e6732';
const BASE_URL     = 'https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20220601';
const REFERER      = 'https://sashibe.github.io/kirei/';

const SEARCHES = [
  { category: 'lip',       label: 'リップ',       keyword: '口紅 ティント コスメ',         hits: 5 },
  { category: 'eyeshadow', label: 'アイシャドウ', keyword: 'アイシャドウ パレット コスメ', hits: 5 },
  { category: 'cheek',     label: 'チーク',        keyword: 'チーク ブラッシュ コスメ',     hits: 5 },
  { category: 'base',      label: 'ベース',        keyword: 'BBクリーム リキッドファンデ',  hits: 5 },
  { category: 'contacts',  label: 'カラコン',      keyword: 'カラーコンタクト ワンデー',    hits: 5 },
  { category: 'eyebrow',   label: 'アイブロウ',   keyword: 'アイブロウ 眉マスカラ コスメ', hits: 5 },
];

async function fetchCategory({ category, keyword, hits }) {
  const params = new URLSearchParams({
    applicationId: APP_ID,
    accessKey:     ACCESS_KEY,
    affiliateId:   AFFILIATE_ID,
    keyword,
    hits: String(hits),
    sort:          '-reviewCount',
    imageFlag:     '1',
    format:        'json',
  });

  const res = await fetch(`${BASE_URL}?${params}`, {
    headers: { 'Referrer': REFERER, 'Origin': 'https://sashibe.github.io' },
  });
  const json = await res.json();

  if (!json.Items) {
    console.warn(`[${category}] 取得失敗:`, json);
    return [];
  }

  return json.Items.map(({ Item: item }) => ({
    id:           item.itemCode.replace(/:/g, '_'),
    category,
    name:         item.itemName.slice(0, 50),
    price:        item.itemPrice,
    image:        (item.mediumImageUrls?.[0]?.imageUrl ?? '').replace('?_ex=128x128', '?_ex=200x200'),
    affiliateUrl: item.affiliateUrl || item.itemUrl,
    rakutenUrl:   item.itemUrl,
    reviewCount:  item.reviewCount,
    reviewAvg:    item.reviewAverage,
    colors:       [],
    baseColor:    '#000000',
  }));
}

async function main() {
  const allProducts = [];

  for (const search of SEARCHES) {
    console.log(`取得中: ${search.label}...`);
    const items = await fetchCategory(search);
    allProducts.push(...items);
    console.log(`  → ${items.length}件取得`);
    await new Promise(r => setTimeout(r, 1100));
  }

  const output = `// src/data/rakutenProducts.js
// 楽天APIから取得した実商品データ
// 生成日: ${new Date().toISOString()}
// ※ colors・baseColor は目視で追記すること

export const RAKUTEN_PRODUCTS = ${JSON.stringify(allProducts, null, 2)};
`;

  writeFileSync('src/data/rakutenProducts.js', output, 'utf-8');
  console.log(`\n完了: ${allProducts.length}件を src/data/rakutenProducts.js に書き出しました`);
}

main().catch(console.error);
