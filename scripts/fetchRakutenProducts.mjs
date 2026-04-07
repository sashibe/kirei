// scripts/fetchRakutenProducts.mjs
// 実行: node scripts/fetchRakutenProducts.mjs

import { writeFileSync } from 'fs';

const APP_ID       = 'pk_bMcKgnAQXQbnGFAOnxiLLPsnsO1jgJAz7Pup11QiGT1';
const AFFILIATE_ID = '529d62d4.9af01a4d.529d62d5.1d5e6732';
const BASE_URL     = 'https://app.rakuten.co.jp/services/api/IchibaItem/Search/20170706';

const SEARCHES = [
  { category: 'lip',       label: 'リップ',       keyword: '口紅 ティント コスメ',         hits: 5 },
  { category: 'eyeshadow', label: 'アイシャドウ', keyword: 'アイシャドウ パレット コスメ', hits: 5 },
  { category: 'cheek',     label: 'チーク',        keyword: 'チーク ブラッシュ コスメ',     hits: 5 },
  { category: 'base',      label: 'ベース',        keyword: 'BBクリーム リキッドファンデ',  hits: 5 },
  { category: 'contacts',  label: 'カラコン',      keyword: 'カラーコンタクト ワンデー',    hits: 5 },
];

async function fetchCategory({ category, keyword, hits }) {
  const params = new URLSearchParams({
    applicationId: APP_ID,
    affiliateId:   AFFILIATE_ID,
    keyword,
    hits: String(hits),
    sort:          '-reviewCount',
    imageFlag:     '1',
    format:        'json',
  });

  const res  = await fetch(`${BASE_URL}?${params}`);
  const json = await res.json();

  if (!json.Items) {
    console.warn(`[${category}] 取得失敗:`, json);
    return [];
  }

  return json.Items.map(({ Item: item }) => ({
    id:           item.itemCode.replace(/:/g, '_'),
    category,
    name:         item.itemName.slice(0, 40),
    price:        item.itemPrice,
    image:        (item.mediumImageUrls?.[0]?.imageUrl ?? '').replace('?_ex=128x128', '?_ex=200x200'),
    affiliateUrl: item.affiliateUrl || item.itemUrl,
    rakutenUrl:   item.itemUrl,
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

  const output = `// src/data/products.js
// 楽天APIから取得した実商品データ
// 生成日: ${new Date().toISOString()}
// ※ colors・baseColor は目視で追記すること

export const PRODUCTS = ${JSON.stringify(allProducts, null, 2)};
`;

  writeFileSync('src/data/products.js', output, 'utf-8');
  console.log(`\n完了: ${allProducts.length}件を src/data/products.js に書き出しました`);
}

main().catch(console.error);
