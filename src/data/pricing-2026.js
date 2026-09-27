/**
 * Trave_Dec — 2026 前季價格模型（先期評估用）
 *
 * 目的：把十四案統一壓縮到 7 天，並以 2026 年實際查得的價格給出可比較的總費用。
 *
 * 三個必須誠實標明的限制：
 *  1. 機票是最不穩定的變項。TPE→HKT 直飛與 TPE→KBV 轉機的價差會隨季節、
 *     訂票時點、是否含行李而大幅變動。這裡用的是 2026 年 9 月查得的價格。
 *  2. 住宿以「兩人一房、每人分攤」計算，單人入住需另加差額。
 *  3. 7 天壓縮必然犧牲某些點位——每案都在 compressedFrom 標明被砍掉什麼。
 *
 * 所有金額為 2026 前季參考，不構成報價。
 */

/* ───────────── 匯率與基準（2026-09 查得） ───────────── */

/** THB → TWD 假設匯率（約 0.093） */
export const THB_TO_TWD_ASSUMED = 0.093;

/** USD → TWD（2026-09 實測約 31.5） */
export const USD_TO_TWD_ASSUMED = 31.5;

/* ───────────── 機票（2026-09 查得，來回每人） ───────────── */

export const FLIGHT_COSTS = {
  'tpe-hkt': {
    id: 'tpe-hkt',
    route: '桃園 TPE → 普吉 HKT',
    direct: true,
    twd: { min: 7400, max: 8400 },
    basis: 'Skyscanner 2026-09 顯示直飛來回 US$231–250（約 TWD 7,400–8,000）；3 月最便宜，約 40 天前訂最優',
    note: '每週僅約 2 班，日期受限。US$231 為最低價，實際常見 US$250 以上。',
    source: 'https://www.skyscanner.net/routes/tpe/hkt/taipei-taiwan-taoyuan-to-phuket.html',
  },
  'tpe-kbv': {
    id: 'tpe-kbv',
    route: '桃園 TPE → 甲米 KBV',
    direct: false,
    twd: { min: 8600, max: 11500 },
    basis: 'Trip.com 2026-09 顯示來回 US$231–275（約 TWD 7,300–8,700），但有 21 小時的離譜組合票',
    note:
      '**票價看似與普吉相當，總時間卻差很多**：直飛 4h25m vs 轉機 13–16h。' +
      '若只看機票會誤判——真正的成本是一天的移動量，以及轉機失敗的風險。',
    source: 'https://us.trip.com/flights/taipei-to-krabi-town/airfares-tpe-kbv/',
  },
  'khm-hkt': {
    id: 'khm-hkt',
    route: '高雄 KHH → 普吉 HKT',
    direct: true,
    twd: { min: 6800, max: 8200 },
    basis: '台灣虎航 KHH 出發；US$231 基準下略低於 TPE',
    note: '若同行者住高雄可省一段國內線，但需自行前往桃園或高雄小港。',
    source: 'https://www.tigerairtw.com/',
  },
};

/* ───────────── 住宿（每晚每間双人房，2026-04 前季） ───────────── */

export const LODGING = {
  'aonang-budget': { label: 'Ao Nang 平價旅館', thb: { min: 800, max: 1400 } },
  'aonang-mid': { label: 'Ao Nang 中價度假村', thb: { min: 1800, max: 3200 } },
  'lanta-mid': { label: 'Koh Lanta 中價', thb: { min: 1500, max: 2800 } },
  'kohyao-mid': { label: 'Koh Yao Noi 中價', thb: { min: 2000, max: 3600 } },
  'phuket-budget': { label: '普吉 Patong／Kata 平價', thb: { min: 1200, max: 2000 } },
  'phuket-mid': { label: '普吉 Patong／Kata 中價', thb: { min: 2500, max: 4500 } },
  'khaolak-mid': { label: 'Khao Lak 中價', thb: { min: 1400, max: 2600 } },
  'trang-mid': { label: 'Trang 市區中價', thb: { min: 1200, max: 2200 } },
  'similan-miang': { label: 'Koh Miang 國家公園住宿（限量）', thb: { min: 1200, max: 1800 } },
};

/* ───────────── 餐費（每人每天，2026 前季） ───────────── */

export const FOOD = {
  budget: { label: '經濟（路邊攤與小館）', thbPerDay: { min: 350, max: 550 } },
  mid: { label: '中價（一般餐館含 occasional 海鮮）', thbPerDay: { min: 600, max: 950 } },
  resort: { label: '度假區（普吉／蘭塔旺季）', thbPerDay: { min: 1000, max: 1600 } },
};

/* ───────────── 7 天壓縮規則 ───────────── */

/**
 * 每個 7 天方案的住宿夜數分配。
 * 7 天 ＝ 6 晚（出發日與回程日通常不住或只住機場附近）。
 */
export const COMPRESSION_NOTES = {
  principle:
    '7 天 ＝ 6 晚。這意味著任何「多基地」的行程都會被壓縮——' +
    '原本 9 天的九案在 7 天裡每個基地只剩 1–2 晚，等於把旅行變成趕場。',
  honest:
    '**壓縮到 7 天是有代價的，不是免費的。**被砍掉的不是「多餘的時間」，' +
    '而是緩衝日與第二個出海機會。若海況不佳，7 天版本沒有退路。',
  whenOk:
    '7 天版本適合理性明確、只想看特定幾個點、且願意接受「一天一點」的人。' +
    '不適合想慢慢玩、想重複下水、或需要因應天氣彈性調整的人。',
};

/**
 * 十四案的 7 天壓縮結果。
 * compressedFrom 說明原本幾天、砍了什麼、砍掉的代價是什麼。
 */
export const COMPRESSED_PLANS = [
  // ───── 甲米 7 天六案：原本就是 7 天，只補上機票 ─────
  {
    id: 'krabi-1-7d', sourceTag: '1', region: 'krabi', days: 7, nights: 6,
    name: 'Similan 能見度優先・7 天',
    compressedFrom: '原 7 天，不需壓縮',
    tradeoff: null,
    lodging: { 'aonang-mid': 4, 'khaolak-mid': 2 },
    food: 'mid',
    flight: 'tpe-kbv',
    boats: { basis: '整團', thb: { min: 16500, max: 21000 } },
    parkFeeTHB: 1600,
  },
  {
    id: 'krabi-2-7d', sourceTag: '2', region: 'krabi', days: 7, nights: 6,
    name: 'Trang 秘境深度・7 天',
    compressedFrom: '原 7 天，不需壓縮',
    tradeoff: null,
    lodging: { 'aonang-mid': 1, 'trang-mid': 5 },
    food: 'mid',
    flight: 'tpe-kbv',
    boats: { basis: '整團', thb: { min: 7200, max: 9500 } },
    parkFeeTHB: 200,
  },
  {
    id: 'krabi-3-7d', sourceTag: '3', region: 'krabi', days: 7, nights: 6,
    name: '蘭塔駐紮・7 天',
    compressedFrom: '原 7 天，不需壓縮',
    tradeoff: null,
    lodging: { 'aonang-budget': 1, 'lanta-mid': 5 },
    food: 'mid',
    flight: 'tpe-kbv',
    boats: { basis: '整團', thb: { min: 9400, max: 12500 } },
    parkFeeTHB: 800,
  },
  {
    id: 'krabi-4-7d', sourceTag: '4', region: 'krabi', days: 7, nights: 6,
    name: '全海域六區・7 天',
    compressedFrom: '原 7 天，不需壓縮',
    tradeoff: null,
    lodging: { 'aonang-mid': 6 },
    food: 'mid',
    flight: 'tpe-kbv',
    boats: { basis: '整團', thb: { min: 16700, max: 21500 } },
    parkFeeTHB: 2000,
  },
  {
    id: 'krabi-5-7d', sourceTag: '5', region: 'krabi', days: 7, nights: 6,
    name: '三區精華・7 天',
    compressedFrom: '原 7 天，不需壓縮',
    tradeoff: null,
    lodging: { 'aonang-mid': 4, 'trang-mid': 2 },
    food: 'mid',
    flight: 'tpe-kbv',
    boats: { basis: '整團', thb: { min: 14000, max: 18000 } },
    parkFeeTHB: 1500,
  },
  {
    id: 'krabi-6-7d', sourceTag: '6', region: 'krabi', days: 7, nights: 6,
    name: '翡翠洞專注・7 天',
    compressedFrom: '原 7 天，不需壓縮',
    tradeoff: null,
    lodging: { 'trang-mid': 6 },
    food: 'budget',
    flight: 'tpe-kbv',
    boats: { basis: '整團', thb: { min: 7400, max: 9800 } },
    parkFeeTHB: 200,
  },

  // ───── 甲米 9 天三案：壓縮到 7 天，必須砍掉兩個基地 ─────
  {
    id: 'krabi-7-7d', sourceTag: '7', region: 'krabi', days: 7, nights: 6,
    name: '能見度與秘境兼得・壓縮 7 天',
    compressedFrom: '原 9 天（4/6–4/14）壓縮到 7 天',
    tradeoff:
      '砍掉「蘭塔 2 晚」與「緩衝日」。後果：Similan 與翡翠洞之間的陸路 2–3 小時' +
      '變成硬趕路，且沒有任何一天能因天氣調整。**這是所有壓縮案中最勉強的一個**——' +
      '原本設計成 9 天就是因為 7 天塞不下。',
    lodging: { 'aonang-mid': 3, 'trang-mid': 3 },
    food: 'mid',
    flight: 'tpe-kbv',
    boats: { basis: '整團', thb: { min: 20000, max: 26000 } },
    parkFeeTHB: 2100,
  },
  {
    id: 'krabi-8-7d', sourceTag: '8', region: 'krabi', days: 7, nights: 6,
    name: '蘭塔駐紮反覆練習・壓縮 7 天',
    compressedFrom: '原 9 天（住蘭塔 5 晚）壓縮到 7 天',
    tradeoff:
      '蘭塔從 5 晚砍到 4 晚，緩衝日 1 個減為 0。**這是壓縮後仍成立的案**——' +
      '因為重點是「住在同一片水域」而不是「去哪幾個點」，少一晚影響有限。' +
      '但原本設計的理由就是「住夠才練得動」，4 晚是底線而非理想值。',
    lodging: { 'aonang-budget': 1, 'lanta-mid': 5 },
    food: 'mid',
    flight: 'tpe-kbv',
    boats: { basis: '整團', thb: { min: 17500, max: 23000 } },
    parkFeeTHB: 1300,
  },
  {
    id: 'krabi-9-7d', sourceTag: '9', region: 'krabi', days: 7, nights: 6,
    name: '全海域慢慢走・壓縮 7 天',
    compressedFrom: '原 9 天（涵蓋 5 個海洋區）壓縮到 7 天',
    tradeoff:
      '**壓縮後這案失去存在意義。**它原本的價值就是「每個區住夠、玩夠」；' +
      '7 天裡 5 個區各停 1 天，與原來的「全海域六區」沒有差別，且多付了基地搬運成本。' +
      '建議直接改選案 4（七天全海域）而非壓縮此案。',
    lodging: { 'aonang-mid': 3, 'lanta-mid': 2, 'trang-mid': 1 },
    food: 'mid',
    flight: 'tpe-kbv',
    boats: { basis: '整團', thb: { min: 24000, max: 31000 } },
    parkFeeTHB: 2400,
    notRecommended: true,
  },

  // ───── 普吉五案 ─────
  {
    id: 'pkt-1-7d', sourceTag: 'P1', region: 'phuket', days: 7, nights: 6,
    name: '普吉經典・7 天',
    compressedFrom: '原 7 天，不需壓縮',
    tradeoff: null,
    lodging: { 'phuket-mid': 6 },
    food: 'resort',
    flight: 'tpe-hkt',
    boats: { basis: '整團', thb: { min: 13800, max: 18000 } },
    parkFeeTHB: 300,
  },
  {
    id: 'pkt-2-7d', sourceTag: 'P2', region: 'phuket', days: 7, nights: 6,
    name: 'Koh Yao 秘境駐紮・7 天',
    compressedFrom: '原 7 天，不需壓縮',
    tradeoff: null,
    lodging: { 'kohyao-mid': 3, 'phuket-mid': 3 },
    food: 'mid',
    flight: 'tpe-hkt',
    boats: { basis: '整團', thb: { min: 13800, max: 17500 } },
    parkFeeTHB: 650,
  },
  {
    id: 'pkt-3-7d', sourceTag: 'P3', region: 'phuket', days: 7, nights: 6,
    name: '自由潛水專程（拿 AIDA 證照）・壓縮 7 天',
    compressedFrom: '原 8 天壓縮到 7 天',
    tradeoff:
      '**壓縮後認證變得勉強。**AIDA 2 完整課程需 3 天以上，原案安排 3 天課程 ＋ 2 天緩衝。' +
      '7 天版本只能保住 3 天課程、砍掉全部緩衝。若教練排不滿或任一天海況不佳，' +
      '認證就無法完成——而你是專程為認證飛過去的。**建議維持 8 天，不要壓縮此案。**',
    lodging: { 'phuket-mid': 6 },
    food: 'mid',
    flight: 'tpe-hkt',
    boats: { basis: '整團', thb: { min: 20000, max: 27000 } },
    parkFeeTHB: 0,
    notRecommended: true,
    alternativeDays: 8,
  },
  {
    id: 'pkt-4-7d', sourceTag: 'P4', region: 'phuket', days: 7, nights: 6,
    name: '普吉進 Similan 出・壓縮 7 天',
    compressedFrom: '原 9 天（普吉 3 晚 → Khao Lak 3 晚 → 普吉 1 晚）壓縮到 7 天',
    tradeoff:
      '砍掉 Khao Lak 3 晚中的 1 晚與兩天 Similan 中的 1 天。**後果明確：**' +
      'Similan 從兩天出海變成一天，幾乎只能趕上主要點位，看不到 Sail Rock；' +
      '且 Khao Lak 住 2 晚仍然成立（不必當天來回），所以交通成本沒浪費。' +
      '代價是失去「天氣不好時的第二次機會」。',
    lodging: { 'phuket-budget': 2, 'khaolak-mid': 4 },
    food: 'mid',
    flight: 'tpe-hkt',
    boats: { basis: '整團', thb: { min: 20000, max: 26000 } },
    parkFeeTHB: 1350,
  },
  {
    id: 'pkt-5-7d', sourceTag: 'P5', region: 'phuket', days: 7, nights: 6,
    name: '全離岸島嶼・壓縮 7 天',
    compressedFrom: '原 8 天（普吉 3 晚 → Koh Yao 2 晚 → 普吉 2 晚）壓縮到 7 天',
    tradeoff:
      '**這是壓縮後最不受影響的一案**，因為普吉的點位船程都在 15–90 分鐘。' +
      '砍掉的是「Koh Yao 住 2 晚」變成一日來回（船程僅 30–45 分，代價小）。' +
      '涵蓋的 5 個海域全部保留。',
    lodging: { 'phuket-budget': 3, 'kohyao-mid': 3 },
    food: 'mid',
    flight: 'tpe-hkt',
    boats: { basis: '整團', thb: { min: 14000, max: 18000 } },
    parkFeeTHB: 650,
  },
];

/* ───────────── 資料時效 ───────────── */

export const PRICE_CAVEAT = {
  researchDate: '2026-09-27',
  headline: '2026 前季價格，用於先期評估',
  items: [
    '**機票最不穩定**：TPE→HKT 與 TPE→KBV 的價差會隨訂票時點變動數千元',
    '住宿以「兩人一房、每人分攤」計算；單人入住需另加單人房差',
    '餐費為一般水準，不含高檔海鮮與酒類',
    '不含：保險、TDAC 入境費、潛水裝備租借、Similan 活動費（每日約 ฿200）',
    '7 天壓縮案不含自由潛水課程證書費（P3 另計）',
    '2027/04 的實際價格須重新查證——旺季（12–2 月）通常高於此基準',
  ],
};
