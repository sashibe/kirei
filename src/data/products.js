// === 肌ケアグッズ ===
// tag が対応するスコア項目、forScore で推奨スコア帯を指定
export const SKIN_PRODUCTS = [
  // トーン系
  {
    emoji: "🧴",
    name: { ja: "ビタミンC美容液", en: "Vitamin C Serum", ko: "비타민C 세럼" },
    reason: { ja: "肌トーンの均一化に", en: "For even skin tone", ko: "피부 톤 균일화에" },
    tag: { ja: "トーン", en: "Tone", ko: "톤" },
    tagColor: "#e879f9", forScore: "tone", maxScore: 75,
    brand: { ja: "KIREI SELECT / スキンケア", en: "KIREI SELECT / Skincare", ko: "KIREI SELECT / 스킨케어" },
    price: 3280, size: "30ml",
    kirpicomment: { ja: "ビタミンC誘導体で透明感アップを狙おう♪ 朝晩の洗顔後に使ってね！", en: "Aim for brighter skin with vitamin C derivatives♪ Use after cleansing morning and night!", ko: "비타민C 유도체로 투명감 업을 노려보자♪ 아침저녁 세안 후에 사용해!" },
    features: [
      { ja: "高濃度ビタミンC誘導体15%配合", en: "15% high-concentration vitamin C derivative", ko: "고농도 비타민C 유도체 15% 함유" },
      { ja: "肌のくすみ・トーンムラにアプローチ", en: "Targets dullness and uneven tone", ko: "칙칙함과 톤 불균형 케어" },
      { ja: "保湿成分ヒアルロン酸Na配合", en: "Contains hyaluronic acid for hydration", ko: "보습 성분 히알루론산 함유" },
      { ja: "無香料・パラベンフリー", en: "Fragrance-free, paraben-free", ko: "무향료·파라벤 프리" },
    ],
  },
  {
    emoji: "☀️",
    name: { ja: "トーンアップUV下地", en: "Tone-Up UV Primer", ko: "톤업 UV 베이스" },
    reason: { ja: "紫外線から肌を守りながらトーンアップ", en: "UV protection with tone-up effect", ko: "자외선 차단과 톤업 효과" },
    tag: { ja: "トーン", en: "Tone", ko: "톤" },
    tagColor: "#e879f9", forScore: "tone", maxScore: 85,
    brand: { ja: "KIREI SELECT / ベースメイク", en: "KIREI SELECT / Base Makeup", ko: "KIREI SELECT / 베이스 메이크업" },
    price: 1680, size: "30g",
    kirpicomment: { ja: "UVケアしながらトーンアップできる一石二鳥アイテム♪", en: "Two-in-one: UV care and tone-up in one product♪", ko: "UV 케어하면서 톤업까지 가능한 일석이조 아이템♪" },
    features: [
      { ja: "SPF50+ PA++++の高いUVカット力", en: "SPF50+ PA++++ high UV protection", ko: "SPF50+ PA++++ 높은 자외선 차단력" },
      { ja: "ラベンダーカラーで肌を明るく補正", en: "Lavender color brightens skin tone", ko: "라벤더 컬러로 피부를 밝게 보정" },
      { ja: "軽いつけ心地でメイク下地にも", en: "Lightweight feel, works as makeup base", ko: "가벼운 사용감으로 메이크업 베이스로도" },
      { ja: "スキンケア成分配合で乾燥しにくい", en: "Skincare ingredients prevent dryness", ko: "스킨케어 성분 배합으로 건조하지 않음" },
    ],
  },
  // 毛穴系
  {
    emoji: "🧊",
    name: { ja: "毛穴引き締めパック", en: "Pore Tightening Mask", ko: "모공 수축 팩" },
    reason: { ja: "週2回の集中ケアに", en: "For twice-weekly intensive care", ko: "주 2회 집중 케어에" },
    tag: { ja: "毛穴", en: "Pores", ko: "모공" },
    tagColor: "#a78bfa", forScore: "pores", maxScore: 70,
    brand: { ja: "KIREI SELECT / スペシャルケア", en: "KIREI SELECT / Special Care", ko: "KIREI SELECT / 스페셜 케어" },
    price: 1980, size: { ja: "7枚入り", en: "7 sheets", ko: "7매입" },
    kirpicomment: { ja: "週2回このパックで集中ケアすれば、グッとスコアが上がるよ〜", en: "Use this mask twice a week for intensive care and boost your score~", ko: "주 2회 이 팩으로 집중 케어하면 점수가 쑥 올라갈 거야~" },
    features: [
      { ja: "クレイ+炭の吸着処方で毛穴汚れをオフ", en: "Clay + charcoal formula removes pore impurities", ko: "클레이+숯 흡착 처방으로 모공 오염 제거" },
      { ja: "引き締め成分ハマメリスエキス配合", en: "Witch hazel extract for tightening", ko: "수축 성분 위치하젤 엑기스 함유" },
      { ja: "使用後すぐに毛穴が目立たなくなる実感", en: "Visible pore reduction after use", ko: "사용 후 바로 모공이 눈에 띄게 줄어드는 느낌" },
      { ja: "個包装で衛生的・旅行にも◎", en: "Individually wrapped, hygienic & travel-friendly", ko: "개별 포장으로 위생적·여행에도 ◎" },
    ],
  },
  {
    emoji: "💧",
    name: { ja: "ナイアシンアミド美容液", en: "Niacinamide Serum", ko: "나이아신아마이드 세럼" },
    reason: { ja: "毛穴ケア+肌のキメを整える", en: "Pore care + refine skin texture", ko: "모공 케어+피부결 정리" },
    tag: { ja: "毛穴", en: "Pores", ko: "모공" },
    tagColor: "#a78bfa", forScore: "pores", maxScore: 80,
    brand: { ja: "KIREI SELECT / スキンケア", en: "KIREI SELECT / Skincare", ko: "KIREI SELECT / 스킨케어" },
    price: 2480, size: "30ml",
    kirpicomment: { ja: "ナイアシンアミドは毛穴の開きとキメの両方にアプローチしてくれるよ♪", en: "Niacinamide targets both pore size and skin texture♪", ko: "나이아신아마이드는 모공 넓어짐과 피부결 둘 다 케어해 줘♪" },
    features: [
      { ja: "ナイアシンアミド10%配合", en: "10% niacinamide formula", ko: "나이아신아마이드 10% 함유" },
      { ja: "皮脂分泌を抑制して毛穴を目立たなくする", en: "Controls sebum to minimize pore appearance", ko: "피지 분비를 억제하여 모공을 눈에 띄지 않게" },
      { ja: "肌荒れ防止・肌のバリア機能強化", en: "Prevents irritation, strengthens skin barrier", ko: "피부 트러블 방지·피부 장벽 기능 강화" },
      { ja: "べたつかないジェルテクスチャ", en: "Non-sticky gel texture", ko: "끈적임 없는 젤 텍스처" },
    ],
  },
  // くすみ系
  {
    emoji: "✨",
    name: { ja: "酵素洗顔パウダー", en: "Enzyme Cleansing Powder", ko: "효소 세안 파우더" },
    reason: { ja: "古い角質をやさしくオフ", en: "Gently removes dead skin cells", ko: "묵은 각질을 부드럽게 제거" },
    tag: { ja: "くすみ", en: "Dullness", ko: "칙칙함" },
    tagColor: "#2dd4bf", forScore: "dullness", maxScore: 75,
    brand: { ja: "KIREI SELECT / クレンジング", en: "KIREI SELECT / Cleansing", ko: "KIREI SELECT / 클렌징" },
    price: 1580, size: { ja: "32包", en: "32 packets", ko: "32포" },
    kirpicomment: { ja: "週2-3回の酵素洗顔で古い角質を落とせば、肌の透明感がグンとアップするよ♪", en: "Use enzyme cleansing 2-3 times a week to remove dead skin and boost radiance♪", ko: "주 2-3회 효소 세안으로 묵은 각질을 제거하면 피부 투명감이 크게 올라가♪" },
    features: [
      { ja: "パパイン酵素がたんぱく質汚れを分解", en: "Papain enzyme breaks down protein-based dirt", ko: "파파인 효소가 단백질 오염을 분해" },
      { ja: "個包装で1回分が使いやすい", en: "Individual packets for easy single use", ko: "개별 포장으로 1회분 사용이 편리" },
      { ja: "泡立ちが良くモコモコ泡で洗える", en: "Rich, fluffy lather for gentle cleansing", ko: "거품이 풍성하게 일어나 부드럽게 세안" },
      { ja: "敏感肌にもやさしい低刺激処方", en: "Gentle, low-irritation formula for sensitive skin", ko: "민감한 피부에도 순한 저자극 처방" },
    ],
  },
  {
    emoji: "🌙",
    name: { ja: "レチノールナイトクリーム", en: "Retinol Night Cream", ko: "레티놀 나이트 크림" },
    reason: { ja: "寝ている間にターンオーバー促進", en: "Promotes turnover while you sleep", ko: "자는 동안 턴오버 촉진" },
    tag: { ja: "くすみ", en: "Dullness", ko: "칙칙함" },
    tagColor: "#2dd4bf", forScore: "dullness", maxScore: 85,
    brand: { ja: "KIREI SELECT / ナイトケア", en: "KIREI SELECT / Night Care", ko: "KIREI SELECT / 나이트 케어" },
    price: 3980, size: "30g",
    kirpicomment: { ja: "レチノールはターンオーバーを促進してくすみをケアするよ！夜専用だから注意してね♪", en: "Retinol boosts turnover and cares for dullness! Night-only, so be careful♪", ko: "레티놀은 턴오버를 촉진해서 칙칙함을 케어해! 야간 전용이니 주의해♪" },
    features: [
      { ja: "カプセル化レチノールで刺激を抑えて浸透", en: "Encapsulated retinol for gentle, deep penetration", ko: "캡슐화 레티놀로 자극을 줄이고 침투" },
      { ja: "セラミド配合で保湿力もキープ", en: "Ceramide formula maintains hydration", ko: "세라마이드 배합으로 보습력도 유지" },
      { ja: "夜塗って朝にはワントーン明るい実感", en: "Apply at night, wake up one tone brighter", ko: "밤에 바르고 아침에 한 톤 밝아진 느낌" },
      { ja: "エイジングケアにも効果的", en: "Effective for anti-aging care", ko: "안티에이징 케어에도 효과적" },
    ],
  },
  // 維持系（高スコア向け）
  {
    emoji: "🧖",
    name: { ja: "保湿ミスト化粧水", en: "Hydrating Mist Toner", ko: "보습 미스트 토너" },
    reason: { ja: "今の好調をキープ！日中の保湿に", en: "Keep your great condition! Daytime hydration", ko: "좋은 상태를 유지! 낮 시간 보습에" },
    tag: { ja: "維持", en: "Maintain", ko: "유지" },
    tagColor: "#60a5fa", forScore: "maintenance", maxScore: 100,
    brand: { ja: "KIREI SELECT / デイリーケア", en: "KIREI SELECT / Daily Care", ko: "KIREI SELECT / 데일리 케어" },
    price: 1280, size: "150ml",
    kirpicomment: { ja: "スコアが高い人は維持が大事♪ 日中の乾燥対策でキレイをキープしよう！", en: "High scorers need maintenance♪ Keep beautiful with daytime hydration!", ko: "점수가 높은 사람은 유지가 중요♪ 낮 시간 건조 대책으로 예쁨을 유지하자!" },
    features: [
      { ja: "ミスト状で手軽にシュッと保湿", en: "Convenient mist spray for instant hydration", ko: "미스트 형태로 간편하게 촉촉하게" },
      { ja: "メイクの上からでも使える", en: "Can be used over makeup", ko: "메이크업 위에서도 사용 가능" },
      { ja: "セラミド+ヒアルロン酸のWうるおい", en: "Double moisture with ceramide + hyaluronic acid", ko: "세라마이드+히알루론산의 더블 보습" },
      { ja: "持ち運びに便利なコンパクトサイズ", en: "Compact size, easy to carry", ko: "휴대하기 편한 컴팩트 사이즈" },
    ],
  },
];

// === デンタルケアグッズ ===
export const DENTAL_PRODUCTS = [
  // 歯茎系
  {
    emoji: "🪥",
    name: { ja: "やわらか歯ブラシ", en: "Soft Toothbrush", ko: "부드러운 칫솔" },
    reason: { ja: "歯茎にやさしい超極細毛", en: "Ultra-fine bristles gentle on gums", ko: "잇몸에 부드러운 초극세모" },
    tag: { ja: "歯茎", en: "Gums", ko: "잇몸" },
    tagColor: "#22c55e", forScore: "gums", maxScore: 80,
    brand: { ja: "KIREI SELECT / オーラルケア", en: "KIREI SELECT / Oral Care", ko: "KIREI SELECT / 구강 케어" },
    price: 580, size: { ja: "1本", en: "1 pc", ko: "1개" },
    kirpicomment: { ja: "超極細毛で歯茎をいたわりながら、もっとスコアを上げていこう♪", en: "Care for your gums with ultra-fine bristles and improve your score♪", ko: "초극세모로 잇몸을 보호하면서 점수를 더 올려보자♪" },
    features: [
      { ja: "0.01mm超極細毛が歯周ポケットに届く", en: "0.01mm ultra-fine bristles reach periodontal pockets", ko: "0.01mm 초극세모가 치주 포켓에 도달" },
      { ja: "歯茎を傷つけにくいラウンドカット加工", en: "Round-cut tips prevent gum damage", ko: "잇몸을 다치지 않게 라운드 컷 가공" },
      { ja: "コンパクトヘッドで奥歯までしっかり届く", en: "Compact head reaches back teeth", ko: "컴팩트 헤드로 어금니까지 꼼꼼하게" },
      { ja: "歯科医推奨のやさしい磨き心地", en: "Dentist-recommended gentle brushing", ko: "치과의사 추천 부드러운 양치감" },
    ],
  },
  {
    emoji: "💊",
    name: { ja: "歯茎ケアジェル", en: "Gum Care Gel", ko: "잇몸 케어 젤" },
    reason: { ja: "マッサージで歯茎の血行を促進", en: "Massage to improve gum circulation", ko: "마사지로 잇몸 혈행 촉진" },
    tag: { ja: "歯茎", en: "Gums", ko: "잇몸" },
    tagColor: "#22c55e", forScore: "gums", maxScore: 70,
    brand: { ja: "KIREI SELECT / オーラルケア", en: "KIREI SELECT / Oral Care", ko: "KIREI SELECT / 구강 케어" },
    price: 980, size: "40g",
    kirpicomment: { ja: "歯茎をマッサージしながらジェルを塗ると、血行が良くなってピンク色に近づくよ♪", en: "Massage the gel into your gums to improve circulation and get them pinker♪", ko: "잇몸을 마사지하면서 젤을 바르면 혈행이 좋아져서 핑크색에 가까워져♪" },
    features: [
      { ja: "ビタミンE配合で歯茎の血行促進", en: "Vitamin E promotes gum blood circulation", ko: "비타민E 배합으로 잇몸 혈행 촉진" },
      { ja: "殺菌成分が歯周ポケットをケア", en: "Antibacterial ingredients care for periodontal pockets", ko: "살균 성분이 치주 포켓을 케어" },
      { ja: "マッサージしやすいジェルテクスチャ", en: "Gel texture ideal for massage", ko: "마사지하기 좋은 젤 텍스처" },
      { ja: "ミント風味で口の中がすっきり", en: "Mint flavor for a fresh feeling", ko: "민트 향으로 입 안이 상쾌" },
    ],
  },
  // 着色系
  {
    emoji: "🧵",
    name: { ja: "歯間ブラシ SSS", en: "Interdental Brush SSS", ko: "치간 브러시 SSS" },
    reason: { ja: "歯間のステイン除去に", en: "Remove stains between teeth", ko: "치간 착색 제거에" },
    tag: { ja: "着色", en: "Staining", ko: "착색" },
    tagColor: "#f97316", forScore: "staining", maxScore: 65,
    brand: { ja: "KIREI SELECT / オーラルケア", en: "KIREI SELECT / Oral Care", ko: "KIREI SELECT / 구강 케어" },
    price: 480, size: { ja: "20本入り", en: "20 pcs", ko: "20개입" },
    kirpicomment: { ja: "歯間の着色は歯ブラシだけじゃ取れないから、毎日使ってね♪", en: "Stains between teeth can't be removed by brushing alone, so use daily♪", ko: "치간 착색은 칫솔만으로는 안 되니까 매일 사용해♪" },
    features: [
      { ja: "SSSサイズで初めてでも使いやすい", en: "SSS size, easy even for beginners", ko: "SSS 사이즈로 처음이어도 사용하기 쉬움" },
      { ja: "ナイロンブラシが歯間の着色を除去", en: "Nylon bristles remove interdental stains", ko: "나일론 브러시가 치간 착색을 제거" },
      { ja: "折れにくいワイヤー設計", en: "Durable wire design", ko: "잘 부러지지 않는 와이어 설계" },
      { ja: "携帯ケース付きで外出先でも使える", en: "Comes with carry case for on-the-go use", ko: "휴대 케이스 포함으로 외출 시에도 사용 가능" },
    ],
  },
  {
    emoji: "✨",
    name: { ja: "ステイン除去歯磨き粉", en: "Stain Removal Toothpaste", ko: "착색 제거 치약" },
    reason: { ja: "毎日のブラッシングで白い歯に", en: "Whiter teeth with daily brushing", ko: "매일 양치로 하얀 치아로" },
    tag: { ja: "着色", en: "Staining", ko: "착색" },
    tagColor: "#f97316", forScore: "staining", maxScore: 75,
    brand: { ja: "KIREI SELECT / オーラルケア", en: "KIREI SELECT / Oral Care", ko: "KIREI SELECT / 구강 케어" },
    price: 1280, size: "100g",
    kirpicomment: { ja: "毎日のブラッシングでステインを浮かせて落とす処方だよ♪", en: "Daily brushing formula that lifts and removes stains♪", ko: "매일 양치로 착색을 떠올려 제거하는 처방이야♪" },
    features: [
      { ja: "微粒子シリカがステインを浮かせて除去", en: "Fine silica particles lift and remove stains", ko: "미립자 실리카가 착색을 떠올려 제거" },
      { ja: "フッ素1450ppm配合で虫歯予防も", en: "1450ppm fluoride for cavity prevention", ko: "불소 1450ppm 배합으로 충치 예방도" },
      { ja: "研磨剤控えめでエナメル質にやさしい", en: "Low abrasive, gentle on enamel", ko: "연마제 자제로 에나멜질에 순함" },
      { ja: "爽やかミント味で口臭ケアも同時に", en: "Refreshing mint for breath care too", ko: "상쾌한 민트 맛으로 구취 케어도 동시에" },
    ],
  },
  {
    emoji: "🫧",
    name: { ja: "ホワイトニングリンス", en: "Whitening Rinse", ko: "화이트닝 린스" },
    reason: { ja: "うがいするだけで着色予防", en: "Prevent stains just by rinsing", ko: "가글만으로 착색 예방" },
    tag: { ja: "着色", en: "Staining", ko: "착색" },
    tagColor: "#f97316", forScore: "staining", maxScore: 85,
    brand: { ja: "KIREI SELECT / オーラルケア", en: "KIREI SELECT / Oral Care", ko: "KIREI SELECT / 구강 케어" },
    price: 880, size: "500ml",
    kirpicomment: { ja: "食後にサッとうがいするだけで着色予防になるよ！手軽に続けられるのがポイント♪", en: "Just rinse after meals to prevent staining! Easy to keep up is the point♪", ko: "식후에 가볍게 가글만 하면 착색 예방이 돼! 쉽게 계속할 수 있는 게 포인트♪" },
    features: [
      { ja: "ポリリン酸ナトリウムがステイン付着を防止", en: "Sodium polyphosphate prevents stain adhesion", ko: "폴리인산나트륨이 착색 부착을 방지" },
      { ja: "口臭予防成分も配合", en: "Contains breath-freshening ingredients", ko: "구취 예방 성분도 배합" },
      { ja: "アルコールフリーで刺激が少ない", en: "Alcohol-free, low irritation", ko: "알코올 프리로 자극이 적음" },
      { ja: "大容量で約1ヶ月分", en: "Large capacity, about 1 month supply", ko: "대용량으로 약 1개월분" },
    ],
  },
  // 歯並び系
  {
    emoji: "🦷",
    name: { ja: "マウスピース型リテーナー", en: "Clear Retainer", ko: "투명 리테이너" },
    reason: { ja: "軽度の歯列矯正に", en: "For mild alignment correction", ko: "경미한 치열 교정에" },
    tag: { ja: "歯並び", en: "Alignment", ko: "치열" },
    tagColor: "#f59e0b", forScore: "alignment", maxScore: 65,
    brand: { ja: "KIREI SELECT / 矯正ケア", en: "KIREI SELECT / Ortho Care", ko: "KIREI SELECT / 교정 케어" },
    price: 2980, size: { ja: "上下セット", en: "Upper & Lower Set", ko: "상하 세트" },
    kirpicomment: { ja: "軽い歯並びの気になりには、まずリテーナーから試してみてね♪ 本格矯正は歯科に相談！", en: "For mild alignment concerns, start with a retainer♪ Consult a dentist for serious cases!", ko: "가벼운 치열이 신경 쓰이면 먼저 리테이너부터 해 봐♪ 본격 교정은 치과에 상담!" },
    features: [
      { ja: "透明で目立ちにくい薄型設計", en: "Clear, thin design that's barely visible", ko: "투명하고 눈에 띄지 않는 얇은 설계" },
      { ja: "BPAフリーの安全素材", en: "BPA-free safe material", ko: "BPA 프리 안전 소재" },
      { ja: "就寝中に装着するだけ", en: "Just wear while sleeping", ko: "취침 중에 착용하기만 하면 OK" },
      { ja: "※重度の場合は歯科医に要相談", en: "*Consult a dentist for severe cases", ko: "※심한 경우 치과의사에게 상담 필요" },
    ],
  },
  // 維持系
  {
    emoji: "🧼",
    name: { ja: "フロスピック", en: "Floss Picks", ko: "치실 픽" },
    reason: { ja: "毎日のケアで白い歯をキープ", en: "Keep white teeth with daily care", ko: "매일 케어로 하얀 치아 유지" },
    tag: { ja: "維持", en: "Maintain", ko: "유지" },
    tagColor: "#60a5fa", forScore: "maintenance", maxScore: 100,
    brand: { ja: "KIREI SELECT / デイリーケア", en: "KIREI SELECT / Daily Care", ko: "KIREI SELECT / 데일리 케어" },
    price: 380, size: { ja: "50本入り", en: "50 pcs", ko: "50개입" },
    kirpicomment: { ja: "デンタルスコアが高い人は毎日のフロスで維持するのが大事だよ♪", en: "High dental scorers should maintain with daily flossing♪", ko: "덴탈 점수가 높은 사람은 매일 치실로 유지하는 게 중요해♪" },
    features: [
      { ja: "極細フロスが歯間の汚れをキャッチ", en: "Ultra-thin floss catches interdental debris", ko: "극세 치실이 치간 오염을 캐치" },
      { ja: "持ちやすいY字型ホルダー", en: "Easy-grip Y-shaped holder", ko: "잡기 쉬운 Y자형 홀더" },
      { ja: "フッ素コーティングで虫歯予防", en: "Fluoride coating prevents cavities", ko: "불소 코팅으로 충치 예방" },
      { ja: "大容量で気兼ねなく使える", en: "Large pack for worry-free daily use", ko: "대용량으로 부담 없이 사용 가능" },
    ],
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
