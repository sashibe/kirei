// === 肌ケアグッズ ===
// tag が対応するスコア項目、forScore で推奨スコア帯を指定
export const SKIN_PRODUCTS = [
  // トーン系
  {
    emoji: "🧴", name: "ビタミンC美容液", reason: "肌トーンの均一化に",
    tag: "トーン", tagColor: "#e879f9", forScore: "tone", maxScore: 75,
    brand: "KIREI SELECT / スキンケア", price: 3280, size: "30ml",
    kirpicomment: "ビタミンC誘導体で透明感アップを狙おう♪ 朝晩の洗顔後に使ってね！",
    features: ["高濃度ビタミンC誘導体15%配合", "肌のくすみ・トーンムラにアプローチ", "保湿成分ヒアルロン酸Na配合", "無香料・パラベンフリー"],
  },
  {
    emoji: "☀️", name: "トーンアップUV下地", reason: "紫外線から肌を守りながらトーンアップ",
    tag: "トーン", tagColor: "#e879f9", forScore: "tone", maxScore: 85,
    brand: "KIREI SELECT / ベースメイク", price: 1680, size: "30g",
    kirpicomment: "UVケアしながらトーンアップできる一石二鳥アイテム♪",
    features: ["SPF50+ PA++++の高いUVカット力", "ラベンダーカラーで肌を明るく補正", "軽いつけ心地でメイク下地にも", "スキンケア成分配合で乾燥しにくい"],
  },
  // 毛穴系
  {
    emoji: "🧊", name: "毛穴引き締めパック", reason: "週2回の集中ケアに",
    tag: "毛穴", tagColor: "#a78bfa", forScore: "pores", maxScore: 70,
    brand: "KIREI SELECT / スペシャルケア", price: 1980, size: "7枚入り",
    kirpicomment: "週2回このパックで集中ケアすれば、グッとスコアが上がるよ〜",
    features: ["クレイ+炭の吸着処方で毛穴汚れをオフ", "引き締め成分ハマメリスエキス配合", "使用後すぐに毛穴が目立たなくなる実感", "個包装で衛生的・旅行にも◎"],
  },
  {
    emoji: "💧", name: "ナイアシンアミド美容液", reason: "毛穴ケア+肌のキメを整える",
    tag: "毛穴", tagColor: "#a78bfa", forScore: "pores", maxScore: 80,
    brand: "KIREI SELECT / スキンケア", price: 2480, size: "30ml",
    kirpicomment: "ナイアシンアミドは毛穴の開きとキメの両方にアプローチしてくれるよ♪",
    features: ["ナイアシンアミド10%配合", "皮脂分泌を抑制して毛穴を目立たなくする", "肌荒れ防止・肌のバリア機能強化", "べたつかないジェルテクスチャ"],
  },
  // くすみ系
  {
    emoji: "✨", name: "酵素洗顔パウダー", reason: "古い角質をやさしくオフ",
    tag: "くすみ", tagColor: "#2dd4bf", forScore: "dullness", maxScore: 75,
    brand: "KIREI SELECT / クレンジング", price: 1580, size: "32包",
    kirpicomment: "週2-3回の酵素洗顔で古い角質を落とせば、肌の透明感がグンとアップするよ♪",
    features: ["パパイン酵素がたんぱく質汚れを分解", "個包装で1回分が使いやすい", "泡立ちが良くモコモコ泡で洗える", "敏感肌にもやさしい低刺激処方"],
  },
  {
    emoji: "🌙", name: "レチノールナイトクリーム", reason: "寝ている間にターンオーバー促進",
    tag: "くすみ", tagColor: "#2dd4bf", forScore: "dullness", maxScore: 85,
    brand: "KIREI SELECT / ナイトケア", price: 3980, size: "30g",
    kirpicomment: "レチノールはターンオーバーを促進してくすみをケアするよ！夜専用だから注意してね♪",
    features: ["カプセル化レチノールで刺激を抑えて浸透", "セラミド配合で保湿力もキープ", "夜塗って朝にはワントーン明るい実感", "エイジングケアにも効果的"],
  },
  // 維持系（高スコア向け）
  {
    emoji: "🧖", name: "保湿ミスト化粧水", reason: "今の好調をキープ！日中の保湿に",
    tag: "維持", tagColor: "#60a5fa", forScore: "maintenance", maxScore: 100,
    brand: "KIREI SELECT / デイリーケア", price: 1280, size: "150ml",
    kirpicomment: "スコアが高い人は維持が大事♪ 日中の乾燥対策でキレイをキープしよう！",
    features: ["ミスト状で手軽にシュッと保湿", "メイクの上からでも使える", "セラミド+ヒアルロン酸のWうるおい", "持ち運びに便利なコンパクトサイズ"],
  },
];

// === デンタルケアグッズ ===
export const DENTAL_PRODUCTS = [
  // 歯茎系
  {
    emoji: "🪥", name: "やわらか歯ブラシ", reason: "歯茎にやさしい超極細毛",
    tag: "歯茎", tagColor: "#22c55e", forScore: "gums", maxScore: 80,
    brand: "KIREI SELECT / オーラルケア", price: 580, size: "1本",
    kirpicomment: "超極細毛で歯茎をいたわりながら、もっとスコアを上げていこう♪",
    features: ["0.01mm超極細毛が歯周ポケットに届く", "歯茎を傷つけにくいラウンドカット加工", "コンパクトヘッドで奥歯までしっかり届く", "歯科医推奨のやさしい磨き心地"],
  },
  {
    emoji: "💊", name: "歯茎ケアジェル", reason: "マッサージで歯茎の血行を促進",
    tag: "歯茎", tagColor: "#22c55e", forScore: "gums", maxScore: 70,
    brand: "KIREI SELECT / オーラルケア", price: 980, size: "40g",
    kirpicomment: "歯茎をマッサージしながらジェルを塗ると、血行が良くなってピンク色に近づくよ♪",
    features: ["ビタミンE配合で歯茎の血行促進", "殺菌成分が歯周ポケットをケア", "マッサージしやすいジェルテクスチャ", "ミント風味で口の中がすっきり"],
  },
  // 着色系
  {
    emoji: "🧵", name: "歯間ブラシ SSS", reason: "歯間のステイン除去に",
    tag: "着色", tagColor: "#f97316", forScore: "staining", maxScore: 65,
    brand: "KIREI SELECT / オーラルケア", price: 480, size: "20本入り",
    kirpicomment: "歯間の着色は歯ブラシだけじゃ取れないから、毎日使ってね♪",
    features: ["SSSサイズで初めてでも使いやすい", "ナイロンブラシが歯間の着色を除去", "折れにくいワイヤー設計", "携帯ケース付きで外出先でも使える"],
  },
  {
    emoji: "✨", name: "ステイン除去歯磨き粉", reason: "毎日のブラッシングで白い歯に",
    tag: "着色", tagColor: "#f97316", forScore: "staining", maxScore: 75,
    brand: "KIREI SELECT / オーラルケア", price: 1280, size: "100g",
    kirpicomment: "毎日のブラッシングでステインを浮かせて落とす処方だよ♪",
    features: ["微粒子シリカがステインを浮かせて除去", "フッ素1450ppm配合で虫歯予防も", "研磨剤控えめでエナメル質にやさしい", "爽やかミント味で口臭ケアも同時に"],
  },
  {
    emoji: "🫧", name: "ホワイトニングリンス", reason: "うがいするだけで着色予防",
    tag: "着色", tagColor: "#f97316", forScore: "staining", maxScore: 85,
    brand: "KIREI SELECT / オーラルケア", price: 880, size: "500ml",
    kirpicomment: "食後にサッとうがいするだけで着色予防になるよ！手軽に続けられるのがポイント♪",
    features: ["ポリリン酸ナトリウムがステイン付着を防止", "口臭予防成分も配合", "アルコールフリーで刺激が少ない", "大容量で約1ヶ月分"],
  },
  // 歯並び系
  {
    emoji: "🦷", name: "マウスピース型リテーナー", reason: "軽度の歯列矯正に",
    tag: "歯並び", tagColor: "#f59e0b", forScore: "alignment", maxScore: 65,
    brand: "KIREI SELECT / 矯正ケア", price: 2980, size: "上下セット",
    kirpicomment: "軽い歯並びの気になりには、まずリテーナーから試してみてね♪ 本格矯正は歯科に相談！",
    features: ["透明で目立ちにくい薄型設計", "BPAフリーの安全素材", "就寝中に装着するだけ", "※重度の場合は歯科医に要相談"],
  },
  // 維持系
  {
    emoji: "🧼", name: "フロスピック", reason: "毎日のケアで白い歯をキープ",
    tag: "維持", tagColor: "#60a5fa", forScore: "maintenance", maxScore: 100,
    brand: "KIREI SELECT / デイリーケア", price: 380, size: "50本入り",
    kirpicomment: "デンタルスコアが高い人は毎日のフロスで維持するのが大事だよ♪",
    features: ["極細フロスが歯間の汚れをキャッチ", "持ちやすいY字型ホルダー", "フッ素コーティングで虫歯予防", "大容量で気兼ねなく使える"],
  },
];

// スコアに基づいて関連商品を選択
export function selectAdvice(scores, products) {
  const scoreEntries = Object.entries(scores);

  // 全体スコアが高い場合は維持系を含める
  const avgScore = scoreEntries.reduce((s, [, v]) => s + v.score, 0) / scoreEntries.length;
  const isHighPerformer = avgScore >= 78;

  // 各スコア項目に対して、スコアが低いほど優先度が高い商品を選択
  const selected = [];

  for (const [key, val] of scoreEntries) {
    const matching = products.filter(p =>
      p.forScore === key && val.score < p.maxScore
    );
    if (matching.length > 0) {
      // スコアが低いほど maxScore の低い（=より基本的な）商品を優先
      matching.sort((a, b) => a.maxScore - b.maxScore);
      selected.push(matching[0]);
    }
  }

  // 高スコアの場合は維持系を追加
  if (isHighPerformer) {
    const maintenance = products.find(p => p.forScore === 'maintenance');
    if (maintenance) selected.push(maintenance);
  }

  // 最低2つ、最大3つに調整
  if (selected.length < 2) {
    for (const p of products) {
      if (!selected.includes(p)) { selected.push(p); if (selected.length >= 2) break; }
    }
  }

  return selected.slice(0, 3);
}

// 後方互換性のために旧名もエクスポート
export const SKIN_ADVICE = SKIN_PRODUCTS.filter(p => p.forScore !== 'maintenance').slice(0, 2);
export const DENTAL_ADVICE = DENTAL_PRODUCTS.filter(p => p.forScore !== 'maintenance').slice(0, 3);
