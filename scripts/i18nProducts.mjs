// scripts/i18nProducts.mjs — products.jsの全商品名+カラー名を3言語化
import { readFileSync, writeFileSync } from 'fs';

const I18N = {
  // === 商品名 ===
  'リリミュウ センシュアルフィックスティント': { ko: 'Ririmew 센슈얼 픽스 틴트', en: 'Ririmew Sensual Fix Tint' },
  'ロムアンド ジューシーラスティングティント': { ko: '롬앤 쥬시 래스팅 틴트', en: 'rom&nd Juicy Lasting Tint' },
  'YSL ラブシャイン キャンディグロウバーム': { ko: 'YSL 러브샤인 캔디 글로우 밤', en: 'YSL Love Shine Candy Glow Balm' },
  'カイリジュメイ フラワーリップ': { ko: '카이리쥬메이 플라워립', en: 'Kailijumei Flower Lip' },
  'カイリジュメイ 色が変わるリップ': { ko: '카이리쥬메이 컬러체인지 립', en: 'Kailijumei Color Change Lip' },
  'トムフォード アイカラークォード': { ko: '톰포드 아이 컬러 쿼드', en: 'Tom Ford Eye Color Quad' },
  'CLIO プロアイパレット エアー': { ko: 'CLIO 프로 아이 팔레트 에어', en: 'CLIO Pro Eye Palette Air' },
  'リリミュウ インザミラーアイパレット': { ko: 'Ririmew 인더미러 아이팔레트', en: 'Ririmew In The Mirror Eye Palette' },
  'NOR. エアフィットクリームアイシャドウ': { ko: 'NOR. 에어핏 크림 아이섀도', en: 'NOR. Air Fit Cream Eyeshadow' },
  'YSL クチュールミニクラッチ': { ko: 'YSL 꾸뛰르 미니 클러치', en: 'YSL Couture Mini Clutch' },
  'MAC グロープレイ クッショニーブラッシュ': { ko: 'MAC 글로우플레이 쿠셔니 블러셔', en: 'MAC Glow Play Cushiony Blush' },
  'dasique ブレンディングムードチーク': { ko: 'dasique 블렌딩 무드 치크', en: 'dasique Blending Mood Cheek' },
  'ディアエー フラッフィーブラッシュ': { ko: '디어에이 플러피 블러셔', en: 'Dear A Fluffy Blush' },
  'MAC エクストラディメンション ブラッシュ': { ko: 'MAC 엑스트라 디멘션 블러셔', en: 'MAC Extra Dimension Blush' },
  'ペリペラ ピュアブラッシュド サンシャインチーク': { ko: '페리페라 퓨어 블러셔드 선샤인 치크', en: 'Peripera Pure Blushed Sunshine Cheek' },
  'レステモ BBクリーム': { ko: '레스테모 BB크림', en: 'Lesthemo BB Cream' },
  'ビタミンC リキッドファンデーション': { ko: '비타민C 리퀴드 파운데이션', en: 'Vitamin C Liquid Foundation' },
  'ロングフィット BBクリーム SPF50+': { ko: '롱핏 BB크림 SPF50+', en: 'Long Fit BB Cream SPF50+' },
  'ベルリッチ オイルフリーリキッドファンデ': { ko: '벨리치 오일프리 리퀴드 파운데이션', en: 'Belrich Oil-Free Liquid Foundation' },
  'ベルリッチ リキッドファンデ お試し': { ko: '벨리치 리퀴드 파운데이션 체험판', en: 'Belrich Liquid Foundation Trial' },
  'エバーカラーワンデーナチュラル': { ko: '에버컬러 원데이 내추럴', en: 'EverColor 1day Natural' },
  'ReVIA 1day COLOR': { ko: 'ReVIA 1day COLOR', en: 'ReVIA 1day COLOR' },
  'シード アイコフレワンデー UV M': { ko: '시드 아이코프레 원데이 UV M', en: 'Seed Eye Coffret 1day UV M' },
  'ネオサイトワンデーリングUV': { ko: '네오사이트 원데이 링 UV', en: 'Neo Sight 1day Ring UV' },
  'ラヴェール 倖田來未カラコン': { ko: '라베일 코다쿠미 컬러렌즈', en: 'Loveil Koda Kumi Color Lens' },
  'ロムアンド ハンオールブロウカラ': { ko: '롬앤 한올 브로우 컬러', en: "rom&nd Han All Brow Color" },
  'キャシードール 4Dアイブロウ': { ko: '캐시돌 4D 아이브로우', en: 'Cathy Doll 4D Eyebrow' },
  'アテニア アイブロウ ペンシル': { ko: '아테니아 아이브로우 펜슬', en: 'Attenir Eyebrow Pencil' },
  'ニューアイブロウスタンプ': { ko: '뉴 아이브로우 스탬프', en: 'New Eyebrow Stamp' },
  'メイベリン ファッションブロウ パウダーインペンシル': { ko: '메이벨린 패션브로우 파우더인펜슬', en: 'Maybelline Fashion Brow Powder-In-Pencil' },
  'ドーリーウインク つけまつげ ナチュラル': { ko: '돌리윙크 속눈썹 내추럴', en: 'Dolly Wink False Lashes Natural' },
  'ドーリーウインク 部分用つけまつげ': { ko: '돌리윙크 부분 속눈썹', en: 'Dolly Wink Partial Lashes' },
  'MISS IN つけまつげ 5ペア': { ko: 'MISS IN 속눈썹 5쌍', en: 'MISS IN False Lashes 5 Pairs' },
  'ドーリーウインク アイラッシュ': { ko: '돌리윙크 아이래시', en: 'Dolly Wink Eyelash' },
  'リバイブラッシュ まつげ美容液': { ko: '리바이브래시 속눈썹 에센스', en: 'Revive Lash Eyelash Serum' },
};

// === カラー名 ===
const COLOR_I18N = {
  'カーディナルローズ': { ko: '카디널 로즈', en: 'Cardinal Rose' },
  'クラシカルプラム': { ko: '클래시컬 플럼', en: 'Classical Plum' },
  'サンゴブロッサム': { ko: '산호 블라썸', en: 'Coral Blossom' },
  'シナモンナッツ': { ko: '시나몬 넛', en: 'Cinnamon Nut' },
  'カヌレブラウン': { ko: '까눌레 브라운', en: 'Canelé Brown' },
  'フィグフィグ': { ko: '피그피그', en: 'Fig Fig' },
  'ライチコーラル': { ko: '라이치 코랄', en: 'Lychee Coral' },
  'ポメロスキン': { ko: '포멜로 스킨', en: 'Pomelo Skin' },
  'ピーチミー': { ko: '피치미', en: 'Peach Me' },
  'アップルブラウン': { ko: '애플 브라운', en: 'Apple Brown' },
  'ヌード': { ko: '누드', en: 'Nude' },
  'ベアピンク': { ko: '베어 핑크', en: 'Bare Pink' },
  'ローズ': { ko: '로즈', en: 'Rose' },
  'コーラル': { ko: '코랄', en: 'Coral' },
  'レッド': { ko: '레드', en: 'Red' },
  'ピンクゴールド': { ko: '핑크 골드', en: 'Pink Gold' },
  'ヌードピンク': { ko: '누드 핑크', en: 'Nude Pink' },
  'クリア→ピンク': { ko: '클리어→핑크', en: 'Clear→Pink' },
  'クリア→レッド': { ko: '클리어→레드', en: 'Clear→Red' },
  'クリア→コーラル': { ko: '클리어→코랄', en: 'Clear→Coral' },
  'ゴールデンミンク': { ko: '골든 밍크', en: 'Golden Mink' },
  'ローズゴールド': { ko: '로즈 골드', en: 'Rose Gold' },
  'スモーキーブラウン': { ko: '스모키 브라운', en: 'Smoky Brown' },
  'ディープブラウン': { ko: '딥 브라운', en: 'Deep Brown' },
  'シャンパン': { ko: '샴페인', en: 'Champagne' },
  'ベージュ': { ko: '베이지', en: 'Beige' },
  'テラコッタ': { ko: '테라코타', en: 'Terracotta' },
  'バーント': { ko: '번트', en: 'Burnt' },
  'チョコブラウン': { ko: '초코 브라운', en: 'Choco Brown' },
  'ローズブラウン': { ko: '로즈 브라운', en: 'Rose Brown' },
  'スノーピンク': { ko: '스노우 핑크', en: 'Snow Pink' },
  'コーラルピンク': { ko: '코랄 핑크', en: 'Coral Pink' },
  'モーブ': { ko: '모브', en: 'Mauve' },
  'バーガンディ': { ko: '버건디', en: 'Burgundy' },
  'ミルクブラウン': { ko: '밀크 브라운', en: 'Milk Brown' },
  'ミルクベージュ': { ko: '밀크 베이지', en: 'Milk Beige' },
  'ピーチコーラル': { ko: '피치 코랄', en: 'Peach Coral' },
  'モーブローズ': { ko: '모브 로즈', en: 'Mauve Rose' },
  'テラブラウン': { ko: '테라 브라운', en: 'Terra Brown' },
  'グレーブラウン': { ko: '그레이 브라운', en: 'Gray Brown' },
  'ヌードベージュ': { ko: '누드 베이지', en: 'Nude Beige' },
  'タフィーブラウン': { ko: '타피 브라운', en: 'Toffee Brown' },
  'スモーキーグレー': { ko: '스모키 그레이', en: 'Smoky Gray' },
  'ディープカーキ': { ko: '딥 카키', en: 'Deep Khaki' },
  'ブラック': { ko: '블랙', en: 'Black' },
  'ラブジョイ': { ko: '러브조이', en: 'Love Joy' },
  'ファントム': { ko: '팬텀', en: 'Phantom' },
  'ブリーズ': { ko: '브리즈', en: 'Breeze' },
  'スリル': { ko: '스릴', en: 'Thrill' },
  'ローズベージュ': { ko: '로즈 베이지', en: 'Rose Beige' },
  'コーラルピーチ': { ko: '코랄 피치', en: 'Coral Peach' },
  'モーブピンク': { ko: '모브 핑크', en: 'Mauve Pink' },
  'スウィートピーチ': { ko: '스위트 피치', en: 'Sweet Peach' },
  'ベリーピンク': { ko: '베리 핑크', en: 'Berry Pink' },
  'コーラルレッド': { ko: '코랄 레드', en: 'Coral Red' },
  'サンラッシュ': { ko: '선러쉬', en: 'Sun Rush' },
  'ダブルグレーズ': { ko: '더블 글레이즈', en: 'Double Glaze' },
  'ピーチツイスト': { ko: '피치 트위스트', en: 'Peach Twist' },
  'オーシャンローズ': { ko: '오션 로즈', en: 'Ocean Rose' },
  'ピーチサンシャイン': { ko: '피치 선샤인', en: 'Peach Sunshine' },
  'ローズサンシャイン': { ko: '로즈 선샤인', en: 'Rose Sunshine' },
  'コーラルサンシャイン': { ko: '코랄 선샤인', en: 'Coral Sunshine' },
  'ライト': { ko: '라이트', en: 'Light' },
  'ナチュラル': { ko: '내추럴', en: 'Natural' },
  'オークル': { ko: '오클', en: 'Ochre' },
  'ダーク': { ko: '다크', en: 'Dark' },
  'ダークブラウン': { ko: '다크 브라운', en: 'Dark Brown' },
  'ブラウン': { ko: '브라운', en: 'Brown' },
  'ヘーゼル': { ko: '헤이즐', en: 'Hazel' },
  'グレー': { ko: '그레이', en: 'Gray' },
  'ボリューム': { ko: '볼륨', en: 'Volume' },
  'クリア': { ko: '클리어', en: 'Clear' },
};

const src = readFileSync('src/data/products.js', 'utf-8');
const match = src.match(/export const PRODUCTS = (\[[\s\S]*\]);/);
const products = JSON.parse(match[1]);

let changed = 0;
products.forEach(p => {
  // 商品名
  if (typeof p.name === 'string' && I18N[p.name]) {
    p.name = { ja: p.name, ko: I18N[p.name].ko, en: I18N[p.name].en };
    changed++;
  }
  // カラー名
  p.colors.forEach(c => {
    if (typeof c.name === 'string' && COLOR_I18N[c.name]) {
      c.name = { ja: c.name, ko: COLOR_I18N[c.name].ko, en: COLOR_I18N[c.name].en };
    }
  });
});

const output = `// src/data/products.js
// 楽天APIデータ + 仕様書カラー・商品名・ローカル画像をマージ
// 全商品名・カラー名 i18n化済み
// 生成日: ${new Date().toISOString()}

export const PRODUCTS = ${JSON.stringify(products, null, 2)};
`;

writeFileSync('src/data/products.js', output, 'utf-8');
console.log(`完了: ${changed}商品名を i18n 化`);
