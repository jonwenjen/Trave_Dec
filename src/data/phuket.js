/**
 * Trave_Dec — Phuket 與離岸島嶼（由桃園 TPE 出發）
 *
 * 為什麼有這個區塊：桃園出發時，甲米與普吉的交通成本差距是結構性的。
 * TPE→KBV 無直飛（13–16h、必經曼谷），TPE→HKT 有直飛（4h25m）。
 * 這在規劃邏輯上意味著「普吉從桃園出發比甲米省半天」，是先前以高雄
 * 為前提的評估看不到的面向。
 *
 * 兩項必須誠實標註的限制：
 *  1. TPE→HKT 每週僅約 2 班，不是每日班表 → 行程日期受航班約束
 *  2. 2027/04 班表尚未公布，所有航班資訊為 2026 年參考
 *
 * 所有價格為 2026 前季參考，不含機票。
 */

import { THB_TO_TWD_ASSUMED } from './krabi.js';

export { THB_TO_TWD_ASSUMED };

/* ═══════════════════════════════════════════════════════════════
   出發前提：桃園 vs 高雄
   ═══════════════════════════════════════════════════════════════ */

export const DEPARTURE_MATRIX = [
  {
    id: 'tpe-hkt',
    from: '桃園 TPE',
    to: '普吉 HKT',
    direct: true,
    duration: '4h25m',
    frequency: '每週約 2 班（2026 年資料）',
    note:
      'Tigerair Taiwan 直飛。全案唯一不需要曼谷轉機的選項，' +
      '但班次少，日期必須配合航班而非自由選。',
    caveat: '2027/04 班表尚未公布，須重新確認',
  },
  {
    id: 'khh-hkt',
    from: '高雄 KHH',
    to: '普吉 HKT',
    direct: true,
    duration: '約 3h（區間）',
    frequency: '有班次',
    note: '台灣虎航官網列有 KHH→HKT 航線。若堅持高雄出發仍可直飛。',
    caveat: '須確認 2027/04 是否有該航線',
  },
  {
    id: 'tpe-kbv',
    from: '桃園 TPE',
    to: '甲米 KBV',
    direct: false,
    duration: '13–16h（1 stop，經 BKK 或 DMK）',
    frequency: '每日多班',
    note:
      '無直飛。最快約 6h40m 純飛行時間，加上轉機總計 13–16h。' +
      '這是甲米案在桃園出發下的結構性劣勢。',
    caveat: '—',
  },
  {
    id: 'khm-kbv',
    from: '高雄 KHH',
    to: '甲米 KBV',
    direct: false,
    duration: '12–16h（經曼谷）',
    frequency: '每日多班',
    note: '與桃園出發的情況相同，皆需曼谷轉機。',
    caveat: '—',
  },
];

/** 交通前提的結論（供 UI 顯示） */
export const DEPARTURE_VERDICT = {
  headline: '桃園出發時，普吉比甲米少半天的交通成本',
  detail:
    'TPE→HKT 直飛 4h25m，TPE→KBV 需經曼谷 13–16h。差距約 9–11 小時，' +
    '足以改變整個行程的移動預算——這是以高雄為前提時看不到的面向。',
  caveat:
    '但代價是班次少：TPE→HKT 每週約 2 班，不是每日班表。' +
    '若選不到對應日期，整個方案就不成立。',
  source: 'https://skyscanner.net/routes/tpe/hkt/taipei-taiwan-taoyuan-to-phuket.html',
};

/* ═══════════════════════════════════════════════════════════════
   離岸島嶼對照
   ═══════════════════════════════════════════════════════════════ */

/** 類別 A：離岸珊瑚礁（15–75 分鐘快艇，幾乎不受季風影響） */
export const OFFSHORE_REEFS = [
  {
    id: 'racha-yai',
    name: 'Koh Racha Yai',
    boatMinutes: 45,
    visibility: '15–20m',
    crowd: 'mid',
    crowdLabel: '中',
    parkFeeTHB: 0,
    highlight: '三個灣：Bang Tao、Siam、Batok。住宿與餐飲選擇齊全。',
    bestFor: '想住得舒服又能浮潛',
    source: 'https://www.rawai.com/racha-island-phuket',
  },
  {
    id: 'racha-noi',
    name: 'Koh Racha Noi',
    boatMinutes: 55,
    visibility: '20–30m',
    crowd: 'low',
    crowdLabel: '低',
    parkFeeTHB: 0,
    highlight:
      '無居民，比大 Racha 安靜。能見度 20–30m 是全區最高之一，' +
      '也是普吉共識的自由潛水訓練點。',
    bestFor: '自由潛水、能見度、避開人潮',
    source: 'https://evephuket.com/blog/snorkeling-phuket-guide',
  },
  {
    id: 'coral-island',
    name: 'Coral Island（Koh Hae）',
    boatMinutes: 30,
    visibility: '中',
    crowd: 'high',
    crowdLabel: '高',
    parkFeeTHB: 0,
    highlight: '最近、團客最多。半日遊最便宜，但體驗也最擁擠。',
    bestFor: '預算優先、體力有限',
    source: 'https://evephuket.com/blog/snorkeling-phuket-guide',
  },
  {
    id: 'khai',
    name: 'Khai 群島',
    boatMinutes: 40,
    visibility: '中',
    crowd: 'high',
    crowdLabel: '高',
    parkFeeTHB: 300,
    highlight: '4–5 座小島，含 Phang Nga 側的 Khai。國家公園範圍內。',
    bestFor: '半天輕鬆行程',
    source: 'https://phuketsnorkelingtours.com/product/khai-island-half-day-tour/',
  },
  {
    id: 'koh-yao',
    name: 'Koh Yao Noi',
    boatMinutes: 40,
    visibility: '中',
    crowd: 'low',
    crowdLabel: '極低',
    parkFeeTHB: 0,
    highlight:
      'Phang Nga Bay 正中，幾乎無商業開發、無海灘俱樂部。' +
      '**無公園費**，是唯一免費的秘境型選項。前方為 40 座喀斯特島群。',
    bestFor: '人少、無公園費、想住島上',
    source: 'https://blog.ilp.org/koh-yao-noi-thailand',
  },
  {
    id: 'shark-point',
    name: 'Shark Point／Anemone Reef',
    boatMinutes: 50,
    visibility: '約 15m',
    crowd: 'mid',
    crowdLabel: '中',
    parkFeeTHB: 0,
    highlight: '以水肺為主的點位，浮潛價值較低。斑馬鯊目擊已較少。',
    bestFor: '有水肺證照者',
    source: 'https://www.sunrise-divers.com/dive-sites/shark-point-phuket/',
  },
];

/** 類別 B：國家公園（需長船程或過夜） */
export const MARINE_PARK_DESTINATIONS = [
  {
    id: 'similan',
    name: 'Similan 群島',
    fromPhuket: '快艇 2–2.5h，或陸路 1.5–2h ＋ 船 60–90 分',
    fromKrabi: '陸路 1.5h 到 Thap Lamu，船 60–90 分',
    season: '10/15–5/15（季末日期每年浮動 1–2 週）',
    parkFeeTHB: 500,
    activityFeeTHB: 200,
    snippetDay: '2,500–3,000',
    snippetLiveaboard: '12,000–14,000（2 天 1 夜）',
    keyIssue:
      '**從普吉出發多數是誤區**：除非飯店主打普吉出發快艇，' +
      '否則業者會用車把你載回 Thap Lamu，等於多花 2 小時車程換同一趟船。',
    verdict: 'Similan 本質上是 Khao Lak 行程，不是普吉行程',
  },
  {
    id: 'phi-phi',
    name: 'Phi Phi 群島',
    fromPhuket: '快艇 45–60 分',
    fromKrabi: '快艇 45 分',
    season: '全年',
    parkFeeTHB: 400,
    snippetDay: '1,900–2,850',
    keyIssue: '瑪雅灣有季節性限制（8/1–9/30 部分時段限制入內）',
    verdict: '兩地船程幾乎相同，普吉沒有優勢',
  },
  {
    id: 'phang-nga',
    name: 'Phang Nga Bay（007／James Bond）',
    fromPhuket: '快艇 45 分 ＋ 陸路 1.5–2h',
    fromKrabi: '陸路 1.5–2h ＋ 船 45 分',
    season: '全年',
    parkFeeTHB: 350,
    keyIssue:
      '**能見度差是先天限制**（Phang Nga 灣泥沙多），' +
      '以浮潛為目的價值低。主要看石灰岩地形與獨木舟。',
    verdict: '地理景觀價值高，浮潛價值低',
  },
  {
    id: 'koh-yao-detail',
    name: 'Koh Yao Noi／Yai',
    fromPhuket: '快艇 30–45 分（Ao Po Grande 或 Bang Rong 碼頭）',
    fromKrabi: '陸路 1.5h ＋ 船 40 分',
    season: '全年',
    parkFeeTHB: 0,
    keyIssue: '無公園費。門到門約 1h40m。',
    verdict: '普吉版秘境，無公園費是最大優勢',
  },
];

/* ═══════════════════════════════════════════════════════════════
   自由潛水生態
   ═══════════════════════════════════════════════════════════════ */

export const PHUKET_FREEDIVING = {
  summary:
    '普吉的自由潛水訓練生態比甲米完整——這點與直覺相反，但對「想拿證照」是決定性的。',
  schools: [
    {
      name: 'SSS Phuket（Kata Beach）',
      systems: ['AIDA', 'SSI', 'Molchanovs', 'PADI'],
      highlight: '島上唯一四系統訓練中心；AIDA 1 課程 1–2 天',
      source: 'https://www.sssphuket.com/phuket-freediving/',
    },
    {
      name: 'NĀMA（Molchanovs）',
      systems: ['Molchanovs'],
      highlight: 'Racha 群島一日 freedive',
      source: 'https://www.namafreediving.com/',
    },
    {
      name: 'ORO Freediving Phuket',
      systems: ['Molchanovs'],
      highlight: '三天課程，小團制',
      source: 'https://freedivingphuket.com/',
    },
  ],
  comparison: {
    phuket: '四系統齊備、明確的 AIDA 課程、Racha Yai 是共識訓練點（20–30m）',
    krabi: '有導潛服務（Phoenix ฿3,000／2 潛）但同時段上限 2 人',
    verdict: '想正經拿 AIDA 2 證照，普吉勝；純玩水，甲米／蘭塔勝',
  },
  legalNote:
    'AIDA 2 為完整認證，符合 2025 泰國潛水法規的救生衣豁免；' +
    'AIDA 1 是一日入門體驗，不符合。',
};

/* ═══════════════════════════════════════════════════════════════
   包船與費用（2026 前季參考）
   ═══════════════════════════════════════════════════════════════ */

export const PHUKET_BOATS = {
  longtail: {
    label: '私人長尾船',
    halfDay: '฿1,500–2,500',
    fullDay: '฿2,500–4,000',
    capacity: '6–10 人',
    note: 'Rawai／Chalong 碼頭。含船長，最平價的私人選項。',
    source: 'https://phuketexpatguide.com/blog/phuket-longtail-boat-guide',
  },
  speedboat: {
    label: '私人快艇',
    fullDay: '฿8,000–18,000 ＋ 油資',
    capacity: '4–8 人',
    note: '4 人以內時每人分攤高，8 人以上才划算。',
    source: 'https://phuketexpatguide.com/blog/phuket-boat-rental-guide',
  },
  catamaran: {
    label: '雙體帆船',
    fullDay: '฿15,000–35,000',
    capacity: '6–10 人',
    note: 'Luxury 檔次。4 人以下不划算。',
    source: 'https://phuketexpatguide.com/blog/phuket-boat-rental-guide',
  },
  joinTours: {
    label: '併團快艇（join-in）',
    range: '฿800–2,800／人',
    note: 'Racha Noi／Yai 併團約 ฿2,200；Coral Island 半日 ฿800–2,000。含裝備與午餐為多數。',
    source: 'https://chillpainai.com/public/en/products/SeaStar-RachaNoi-Speedboat-mkp',
  },
};

/* ═══════════════════════════════════════════════════════════════
   權衡表：普吉 vs 甲米（4 月，桃園出發）
   ═══════════════════════════════════════════════════════════════ */

export const HEAD_TO_HEAD = [
  { aspect: '交通（桃園出發）', winner: 'phuket', note: '直飛 4h25m vs 經曼谷 13–16h' },
  { aspect: 'Similan 交通', winner: 'krabi', note: '甲米 1.5h 車程 vs 普吉 2.5–3h' },
  { aspect: '自由潛水訓練', winner: 'phuket', note: '四系統、AIDA 明確 vs 導潛上限 2 人' },
  { aspect: '秘境程度', winner: 'krabi', note: 'Trang 更偏遠、翡翠洞無可取代' },
  { aspect: '公園費負擔', winner: 'phuket', note: 'Koh Yao 與 Racha 免費' },
  { aspect: '離岸點位多樣性', winner: 'phuket', note: '5–6 個點、船程 15–75 分' },
  { aspect: '住宿與餐飲成本', winner: 'krabi', note: '普吉為渡假型' },
  { aspect: '季風遮蔽', winner: 'krabi', note: '安達曼海東岸受山脈遮蔽' },
  { aspect: '包船價格', winner: 'tie', note: '兩地相近' },
];

/* ═══════════════════════════════════════════════════════════════
   五種方案
   ═══════════════════════════════════════════════════════════════ */

export const PHUKET_PLANS = [
  {
    id: 'pkt-1',
    tag: 'P1',
    name: '七日・普吉經典（直飛最短）',
    positioning:
      '把直飛的交通優勢用到極致：落地即出海，全程住在普吉，完全不移動基地。' +
      '適合假期珍貴、想住得舒服的人。',
    base: '普吉（Patong／Kata／Rawai 一帶）',
    window: '2027-04（須配合 TPE→HKT 班次）',
    windowRationale:
      '這案的可行性完全取決於直飛班次。每週約 2 班意味著日期不可自由選，' +
      '須先確認 2027/04 是否有班，再回頭看行程安排。',
    entryPoint: 'HKT（普吉）',
    exitPoint: 'HKT（普吉）',
    marineAreas: ['racha', 'coral-island', 'khai'],
    snorkelStops: 12,
    riskLevel: 'mid',
    riskNote: 'Coral Island 與 Khai 人潮多，體驗取決於時段',
    suits: '想住度假村，不想換飯店、想省下移動時間',
    highlight:
      '交通成本最低（來回省約 1 天）。Racha 群島能見度 20–30m，' +
      '是甲米近岸點位無法比擬的。',
    days: [
      { day: 1, title: '桃園 → 普吉（直飛 4h25m）', detail: '落地後接駁至住宿區，晚上休息。', transport: '航空＋接駁', seaDay: false },
      { day: 2, title: 'Racha Yai ＋ Racha Noi', detail: 'Chalong 碼頭出發。能見度 20–30m，自由潛水與浮潛都適合。', transport: '私人長尾船', costTHB: 3500, seaDay: true },
      { day: 3, title: '自由潛水訓練日（Racha Noi）', detail: '可安排 SSS Phuket 或 NĀMA 的教練陪同。', transport: '教練＋船', costTHB: 4000, seaDay: true },
      { day: 4, title: 'Coral Island ＋ Banana Beach', detail: '近程半日遊，人潮多但省時。', transport: '併團或私人', costTHB: 2000, seaDay: true },
      { day: 5, title: 'Khai 群島（4–5 座）', detail: '國家公園範圍，含 Phang Nga 側的 Khai。', transport: '併團', costTHB: 1800, parkFeeTHB: 300, seaDay: true },
      { day: 6, title: '彈性日・依海況決定', detail: '天氣好則加訂 Racha 第二次，或前往 Mai Ton 看海豚。', transport: '船', costTHB: 2500, isBuffer: true, seaDay: true },
      { day: 7, title: '普吉 → 桃園（直飛）', detail: '返程。', transport: '航空', seaDay: false },
    ],
    estimateTHB: { min: 12500, max: 16000, note: '前季參考，不含機票、不含自由潛水課程證書費。4 人分攤。含 Phuket 住宿（渡假型偏貴）。' },
    sources: [
      { label: 'Racha 與各點能見度', url: 'https://evephuket.com/blog/snorkeling-phuket-guide' },
      { label: '普吉私人長尾船價目', url: 'https://phuketexpatguide.com/blog/phuket-longtail-boat-guide' },
    ],
  },

  {
    id: 'pkt-2',
    tag: 'P2',
    name: '七日・Koh Yao 秘境駐紮',
    positioning:
      '不住普吉，直接住 Koh Yao Noi。整趟只去一個海域，但那個海域人少、無公園費、' +
      '而且是普吉系統裡最接近「秘境」的點。',
    base: 'Koh Yao Noi 3 晚 ＋ 普吉 3 晚',
    window: '2027-04（須配合 TPE→HKT 班次）',
    windowRationale:
      'Koh Yao 門到門約 1h40m（機場→碼頭 30–45 分車 ＋ 30–45 分船），' +
      '因此案 2 的基地切換成本遠低於甲米的蘭塔渡輪（1.5–2h 船程）。',
    entryPoint: 'HKT（普吉）',
    exitPoint: 'HKT（普吉）',
    marineAreas: ['koh-yao', 'phang-nga', 'khai'],
    snorkelStops: 14,
    riskLevel: 'low',
    riskNote: '船程短、變數少；但 Khai 公園在 Phang Nga 側需留意潮汐',
    suits: '明確想要人少、想避開團客、不想付公園費',
    highlight:
      '**唯一的免費秘境**：Koh Yao 無公園費，Phang Nga 灣有 40 座喀斯特島。' +
      '島上幾乎無商業開發——無海灘俱樂部、無人潮壓力。',
    days: [
      { day: 1, title: '桃園 → 普吉 → Ao Po 碼頭 → Koh Yao Noi', detail: '落地後直接前往碼頭搭船，避免多住一晚普吉。', transport: '航空＋接駁＋快艇', costTHB: 900, seaDay: true },
      { day: 2, title: 'Koh Yao Noi 周邊浮潛', detail: '島邊淺礁，另可包船前往喀斯特島群。', transport: '私人長尾船', costTHB: 2500, seaDay: true },
      { day: 3, title: 'Phang Nga Bay（007／James Bond）', detail: '石灰岩地形與獨木舟為主。能見度差是先天限制，別抱浮潛期待。', transport: '併團', costTHB: 2000, parkFeeTHB: 350, seaDay: true },
      { day: 4, title: '回普吉住 2 晚', detail: '下午抵達 Patong，晚上自由活動。', transport: '快艇＋接駁', costTHB: 900, seaDay: true },
      { day: 5, title: 'Racha Yai ＋ Racha Noi', detail: '能見度 20–30m，補上 Koh Yao 缺乏的高能見度。', transport: '私人長尾船', costTHB: 3500, isBuffer: true, seaDay: true },
      { day: 6, title: '自由潛水訓練日（Racha Noi）', detail: 'SSS Phuket 或 NĀMA。', transport: '教練＋船', costTHB: 4000, seaDay: true },
      { day: 7, title: '普吉 → 桃園（直飛）', detail: '返程。', transport: '航空', seaDay: false },
    ],
    estimateTHB: { min: 12000, max: 15000, note: '前季參考，不含機票、不含自由潛水課程證書費。4 人分攤。Koh Yao 住宿比普吉市區便宜。' },
    sources: [
      { label: 'Koh Yao Noi 秘境特性', url: 'https://blog.ilp.org/koh-yao-noi-thailand' },
      { label: 'Ao Po 到 Koh Yao 船程', url: 'https://viamo.net/ferries/phuket-to-koh-yao-noi' },
    ],
  },

  {
    id: 'pkt-3',
    tag: 'P3',
    name: '八日・自由潛水專程（拿 AIDA 證照）',
    positioning:
      '如果主要目標是學自由潛水，這是唯一值得選的方案。普吉有四系統教練中心，' +
      'AIDA 課程明確，而 Racha Noi 是共識訓練點。',
    base: '普吉（Kata Beach 一帶，靠近教練中心）',
    window: '2027-04（須配合 TPE→HKT 班次）',
    windowRationale:
      'AIDA 2 完整認證需 3 天以上課程 ＋ 實習，連同出海日與緩衝，' +
      '7 天勉強、8 天合理。若課程排不滿 8 天，等於沒有緩衝。',
    entryPoint: 'HKT（普吉）',
    exitPoint: 'HKT（普吉）',
    marineAreas: ['racha', 'coral-island'],
    snorkelStops: 10,
    riskLevel: 'low',
    riskNote: '基地不移動；主要變數是課程本身的排程',
    suits: '主要目標是學自由潛水並拿 AIDA 2 證照',
    highlight:
      '**這是普吉相對甲米最強的一項**。SSS Phuket 是島上唯一四系統中心，' +
      'AIDA 1 僅需 1–2 天；相較甲米／蘭塔的導潛日（上限 2 人）' +
      '這裡能給的是完整教學與認證。',
    days: [
      { day: 1, title: '桃園 → 普吉（直飛）', detail: '入住 Kata Beach，緊鄰教練中心。', transport: '航空＋接駁', seaDay: false },
      { day: 2, title: '課程第 1 天（池中）', detail: '呼吸技巧、等壓技巧。池中可脫離海況限制。', transport: '教練', costTHB: 4500, seaDay: false },
      { day: 3, title: '課程第 2 天（開放水域）', detail: 'Racha Noi 出海實習。', transport: '教練＋船', costTHB: 4500, seaDay: true },
      { day: 4, title: '課程第 3 天（認證評估）', detail: '依教練安排完成認證。', transport: '教練＋船', costTHB: 4500, seaDay: true },
      { day: 5, title: '休息 ＋ 自主潛水', detail: '認證後可自主反覆潛，或安排第二次教練日。', transport: '船', costTHB: 2500, isBuffer: true, seaDay: true },
      { day: 6, title: 'Coral Island 輕鬆日', detail: '換到輕鬆行程，恢復體力。', transport: '併團', costTHB: 1800, seaDay: true },
      { day: 7, title: '彈性日・依海況決定', detail: '天氣好則加訂 Racha 第二次。', transport: '船', costTHB: 2500, isBuffer: true, seaDay: true },
      { day: 8, title: '普吉 → 桃園（直飛）', detail: '返程。', transport: '航空', seaDay: false },
    ],
    estimateTHB: { min: 18000, max: 24000, note: '前季參考，不含機票。**含 AIDA 課程費用**（估 ฿10,000–14,000）。4 人分攤。教練 1:4 比，4 人以下較划算。' },
    sources: [
      { label: 'SSS Phuket 四系統與 AIDA 課程', url: 'https://www.sssphuket.com/phuket-freediving/' },
      { label: 'NĀMA Racha freedive', url: 'https://www.namafreediving.com/' },
    ],
  },

  {
    id: 'pkt-4',
    tag: 'P4',
    name: '九日・普吉進、Similan 出（交通最省）',
    positioning:
      '直飛省下的時間剛好補上陸路到 Khao Lak 的成本，而且路線順行不是折返。' +
      '這是唯一能同時吃到普吉直飛與 Similan 能見度的方案。',
    base: '普吉 3 晚 → Khao Lak 3 晚 → HKT 出發',
    window: '2027-04-06 – 04-14（9 天，須配合 TPE→HKT 班次）',
    windowRationale:
      'Similan 僅 10/15–5/15 營運，且需 1–2 週提前預訂。' +
      '從普吉陸路南下 Khao Lak 需 2.5–3 小時，' +
      '因此必須住 Khao Lak 而非當天往返——否則等於浪費 5 小時車程。',
    entryPoint: 'HKT（普吉）',
    exitPoint: 'HKT（普吉）',
    marineAreas: ['racha', 'koh-yao', 'similan'],
    snorkelStops: 18,
    riskLevel: 'mid',
    riskNote: 'Similan 季末能見度可能下降；且需自普吉回程再飛',
    suits: '想吃 Similan 能見度，且願意接受基地移動與較長天數',
    highlight:
      '**這條路解決了原本最大的矛盾**：TPE→HKT 直飛省下的 9–11 小時，' +
      '剛好補上陸路到 Khao Lak 的成本。Racha 的 20–30m 與 Similan 的能見度同時吃到。',
    days: [
      { day: 1, title: '桃園 → 普吉（直飛 4h25m）', detail: '落地住 Patong 或 Kata。', transport: '航空＋接駁', seaDay: false },
      { day: 2, title: 'Racha Yai ＋ Racha Noi', detail: '先拿普吉側最高能見度。', transport: '私人長尾船', costTHB: 3500, seaDay: true },
      { day: 3, title: 'Koh Yao Noi（來回或住一晚）', detail: '若時間允許住一晚，否則半日遊。', transport: '快艇', costTHB: 2500, seaDay: true },
      { day: 4, title: '陸路南下 Khao Lak（2.5–3h）', detail: '移動日，途中可停 Phang Nga Bay。', transport: '陸路', costTHB: 1800, isBuffer: true, seaDay: false },
      { day: 5, title: 'Similan（Coral Garden／Anita’s Reef）', detail: '自 Thap Lamu 出發，60–90 分船程。', transport: '快艇', costTHB: 4500, parkFeeTHB: 500, seaDay: true },
      { day: 6, title: 'Similan 第二次（Sail Rock）', detail: '天氣好才出發，不好的話改 Khao Lak 近岸。', transport: '快艇', costTHB: 4500, parkFeeTHB: 500, isBuffer: true, seaDay: true },
      { day: 7, title: 'Khao Lak 近岸浮潛', detail: '若 Similan 因風浪取消，這天就是替代。', transport: '船', costTHB: 2500, isBuffer: true, seaDay: true },
      { day: 8, title: 'Khao Lak → 普吉（2.5–3h）', detail: '回普吉住一晚，隔天好從容退機。', transport: '陸路', costTHB: 1800, seaDay: false },
      { day: 9, title: '普吉 → 桃園（直飛）', detail: '返程。', transport: '航空', seaDay: false },
    ],
    estimateTHB: { min: 17000, max: 21000, note: '前季參考，不含機票。含多 2 晚住宿與 Khao Lak 段。4 人分攤。Similan 公園費通常另計。' },
    sources: [
      { label: 'Similan 從 Phuket 與 Khao Lak 出發比較', url: 'https://thailandknowhow.com/similan-islands-guide-diving-snorkeling-and-boat-trips/' },
      { label: 'Similan 季別與費用', url: 'https://evephuket.com/blog/snorkeling-phuket-guide' },
    ],
  },

  {
    id: 'pkt-5',
    tag: 'P5',
    name: '八日・全離岸島嶼（涵蓋最廣）',
    positioning:
      '把普吉系統裡能到的點位都走一遍：離岸礁 ＋ 國家公園 ＋ Phang Nga 秘境。' +
      '與甲米「全海域六區」的差別是——這裡船程都短，所以不需要每天搬行李。',
    base: '普吉 3 晚 → Koh Yao Noi 2 晚 → 普吉 2 晚',
    window: '2027-04-06 – 04-13（8 天，須配合 TPE→HKT 班次）',
    windowRationale:
      '普吉的離岸點位船程 15–75 分鐘，這是它相對甲米最大的結構優勢——' +
      '不需要把時間花在移動上。8 天足以涵蓋 5 類不同海域。',
    entryPoint: 'HKT（普吉）',
    exitPoint: 'HKT（普吉）',
    marineAreas: ['racha', 'coral-island', 'khai', 'koh-yao', 'phang-nga'],
    snorkelStops: 22,
    riskLevel: 'mid',
    riskNote: '涵蓋 5 個點位，合法確認項最多；Coral Island 與 Khai 人潮多',
    suits: '想「把普吉能看的都看完」，且能接受較高費用',
    highlight:
      '涵蓋 5 個海域且**沒有一個需要超過 90 分鐘船程**。' +
      '這是甲米「全海域六區」（Similan 船程 2h、Trang 陸路 3h）做不到的。',
    days: [
      { day: 1, title: '桃園 → 普吉（直飛）', detail: '落地住普吉。', transport: '航空＋接駁', seaDay: false },
      { day: 2, title: 'Racha Yai ＋ Racha Noi', detail: '能見度 20–30m，最能見度的一站。', transport: '私人長尾船', costTHB: 3500, seaDay: true },
      { day: 3, title: 'Phang Nga Bay（007）', detail: '石灰岩地形、獨木舟、紅樹林。能見度差是先天限制。', transport: '併團', costTHB: 2200, parkFeeTHB: 350, seaDay: true },
      { day: 4, title: 'Koh Yao Noi（住 2 晚）', detail: '快艇前往，下午在島上。', transport: '快艇', costTHB: 900, seaDay: true },
      { day: 5, title: 'Koh Yao 周邊喀斯特島群', detail: '包船前往 Phang Nga Bay 的石灰岩群島。', transport: '私人長尾船', costTHB: 3500, seaDay: true },
      { day: 6, title: 'Koh Yao → 普吉', detail: '回普吉住 2 晚。', transport: '快艇＋接駁', costTHB: 900, seaDay: true },
      { day: 7, title: '彈性日・Coral Island ＋ Khai 群島', detail: '天氣好則出發；不好則改為 Mai Ton 看海豚或島上休息。兩站船程都短，可當日來回。', transport: '私人長尾船', costTHB: 3000, parkFeeTHB: 300, isBuffer: true, seaDay: true },
      { day: 8, title: '普吉 → 桃園（直飛）', detail: '返程。', transport: '航空', seaDay: false },
    ],
    estimateTHB: { min: 15500, max: 19000, note: '前季參考，不含機票。含 Koh Yao 2 晚住宿。4 人分攤。Phang Nga 公園費 2026 年資料不一致，須確認。' },
    sources: [
      { label: 'Phang Nga Bay 島嶼與水質', url: 'https://visitjamesbondisland.com/phang-nga-bay.html' },
      { label: '普吉浮潛點位總覽', url: 'https://evephuket.com/blog/snorkeling-phuket-guide' },
    ],
  },
];

/** 資料時效警告（顯示於 UI） */
export const PHUKET_DATA_CAVEAT = {
  researchDate: '2026-09-27',
  items: [
    'TPE→HKT 直飛班次（2026 年為每週約 2 班，2027 須確認）',
    'Phang Nga NP 公園費（2026 年資料在 ฿300 與 ฿400 之間不一致）',
    'Koh Yao 2027 年快艇與渡輪班次',
    'Similan 2027 開園日（10/15 與 5/15 為慣例，每年浮動）',
    '各業者是否已含公園費（慣例不一致，常見現場爭議）',
    '保險與 TDAC 入境規定',
  ],
};
