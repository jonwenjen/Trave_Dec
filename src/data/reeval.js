/**
 * Trave_Dec — 2027/03/29 – 04/05 行程重評
 *
 * 交通前提（使用者指定）：
 *   出發 2027-03-29（週一）晚上，桃園或高雄出發，隔天早上到普吉 HKT
 *   回程 2027-04-05（週一）晚上，回桃園或高雄
 *
 * 因為是雙向夜航，實際在泰國有 7 個完整白天（3/30 – 4/5）。
 * 這比「7 天出發、回程」更充裕——多出的是一整天，不是半天。
 *
 * 價格全部是 2026-09-27 查得的當期價（8–9 月航班、當前船價），
 * **不是 2027-03 的價格**。須於 2027-02-25 前後重新查證。
 */

import { DESTINATIONS, THB_TO_TWD_ASSUMED, USD_TO_TWD_ASSUMED } from './destinations.js';

export { DESTINATIONS, THB_TO_TWD_ASSUMED, USD_TO_TWD_ASSUMED };

/* ───────────── 行程窗口 ───────────── */

export const TRIP_WINDOW = {
  depart: '2027-03-29',
  return: '2027-04-05',
  departWeekday: '週一',
  returnWeekday: '週一',
  calendarDays: 8,
  fullDays: 7,
  firstFullDay: '2027-03-30',
  lastFullDay: '2027-04-05',
  songkranInRange: false,
  chakriDay: '2027-04-06',
  note:
    '**雙向夜航 → 7 個完整白天。**宋干節（4/13–15）不在範圍內，'
    + '4/6 Chakri Day 落在回程抵台日，影響有限。',
};

/* ───────────── 夜航航班（使用者指定方向） ───────────── */

export const NIGHT_FLIGHT = {
  departure: '21:55',
  arrival: '08:10',
  arrivalDayOffset: 1,
  routes: [
    {
      id: 'khh-hkt',
      label: '高雄 KHH 21:55 → 普吉 HKT 08:10⁺¹',
      duration: '11h15m',
      stops: 1,
      roundTripTWD: { min: 8659, max: 9121 },
      baggageTWD: { min: 1380, max: 1900 },
      airline: '泰國亞航／獅子',
      note: '**最推薦的夜航走法。**晚飯後到小港，早上 8:10 抵普吉，當天整天可用。',
    },
    {
      id: 'tpe-hkt',
      label: '桃園 TPE 00:55 → 普吉 HKT 08:20⁺¹',
      duration: '8h25m',
      stops: 1,
      roundTripTWD: { min: 7053, max: 7571 },
      baggageTWD: { min: 1380, max: 1900 },
      airline: '酷航',
      note: '最短的夜航，但出發時間是凌晨 1 點，須 23:00 前抵桃園。',
    },
  ],
  returnRoutes: [
    {
      id: 'hkt-khh',
      label: '普吉 HKT 16:50 → 高雄 KHH 09:40⁺¹',
      duration: '15h50m',
      stops: 1,
      roundTripTWD: { min: 8659, max: 9262 },
      airline: '泰國亞航／獅子',
      note: '**上午 9:40 就到家**，不妨礙前一天出海。',
    },
    {
      id: 'hkt-tpe',
      label: '普吉 HKT 20:35 → 桃園 TPE 12:20⁺¹',
      duration: '14h45m',
      stops: 1,
      oneWayTWD: { min: 3625, max: 3678 },
      airline: '泰國亞航',
      note: '傍晚出發、隔天中午到桃園。回程當天不能出海。',
    },
  ],
};

/** 實際採用的方案航班（使用者指定：晚上出、晚上回、機場 HKT） */
export const FLIGHT_OPTIONS = {
  ...NIGHT_FLIGHT.routes[0],
  // 回程以 20:35 桃園為基準（回程當天不需出海，節省半天）
  returnLabel: '普吉 HKT 20:35 → 桃園／高雄 12:20⁺¹',
  returnDuration: '14h45m',
  note:
    '雙向夜航的關鍵效果：**7 個完整白天**。'
    + '3/29 晚上出門，3/30 早上 8:10 到，4/5 晚上回。',
};

export const PRICING_2026 = {
  researchDate: '2026-09-27',
  caveat:
    '所有價格為 2026-09-27 查得的當期價（8–9 月航班、當前船班報價），'
    + '**不是 2027-03/04 的價格**。2027 年須重新查證，建議 2027-02-25。',
};


/* ───────────── 6 人團體・2 人提前 2 天回 ───────────── */

/**
 * 分批回程的交通前提。
 *
 * **關鍵限制：4/4 是週日，直飛只飛週二與週六 → 提前回的人必須轉機。**
 * 這不是偏好問題，是班表問題。
 */
export const SPLIT_GROUP = {
  total: 6,
  earlyReturners: 2,
  fullGroup: 4,
  earlyReturnDate: '2027-04-04',
  earlyReturnWeekday: '週日',
  mainReturnDate: '2027-04-05',
  mainReturnWeekday: '週一',

  earlyOptions: [
    {
      id: 'early-night',
      label: 'HKT 20:50 → 高雄 KHH 07:15⁺¹',
      duration: '9h25m',
      stops: 1,
      oneWayTWD: { min: 9206, max: 9262 },
      dayUsable: true,
      note: '**推薦。**4/4 整天可用，航後 9.4 小時多但晚上出發影響較小。',
    },
    {
      id: 'early-morning',
      label: 'HKT 10:40 → 高雄 KHH 09:40⁺¹',
      duration: '22h',
      stops: 1,
      oneWayTWD: { min: 9135, max: 9206 },
      dayUsable: false,
      note: '省時間但代價大：4/4 整天不能出海，且 22 小時轉機。',
    },
  ],

  mainOptions: [
    {
      id: 'main-night',
      label: 'HKT 20:35 → 桃園／高雄 12:20⁺¹',
      duration: '14h45m',
      stops: 1,
      oneWayTWD: { min: 3625, max: 3678 },
      note: '主團體沿用原定夜航，4/5 白天可自由使用。',
    },
  ],

  directAvailableEarly: false,
  directDays: [2, 6],
  directNote:
    '**4/4 週日沒有直飛。**虎航直飛僅每週二、週六，' +
    '因此提前 2 天回的人只能轉機——這是班表決定，不是選擇。',
  impact:
    '提前的 2 人比主團體少 2 個海上日、2 晚住宿。' +
    '船資若為整團包船，早退者的份額不會減少（船照開），' +
    '但住宿與餐費會實際少兩天。',
};

/** 提前回程者的來回交通（每人 TWD，含托運 20kg） */
export function earlyTravelerTWD(option = 'early-night') {
  const opt = SPLIT_GROUP.earlyOptions.find((o) => o.id === option)
    || SPLIT_GROUP.earlyOptions[0];
  const flightOut = FLIGHT_OPTIONS.roundTripTWD;
  const returnLeg = opt.oneWayTWD;
  const bag = FLIGHT_OPTIONS.baggageTWD;
  return {
    min: flightOut.min + returnLeg.min + bag.min,
    max: flightOut.max + returnLeg.max + bag.max,
    option: opt.id,
  };
}

/** 主團體回程的來回交通（每人 TWD，含托運 20kg） */
export function mainTravelerTWD() {
  const f = FLIGHT_OPTIONS;
  return {
    min: f.roundTripTWD.min + f.baggageTWD.min,
    max: f.roundTripTWD.max + f.baggageTWD.max,
  };
}

/* ───────────── 住宿基準（每晚每間双人房，THB） ───────────── */

export const LODGING = {
  'phuket-budget': { label: '普吉 Patong／Kata 平價', thb: { min: 1200, max: 2000 } },
  'phuket-mid': { label: '普吉 Patong／Kata 中價', thb: { min: 2500, max: 4500 } },
  'koh-yao-mid': { label: 'Koh Yao Noi 中價', thb: { min: 2000, max: 3600 } },
  'koh-siray-resort': { label: 'Koh Siray 度假村', thb: { min: 5000, max: 9000 } },
  'ao-nang-mid': { label: 'Ao Nang 中價度假村', thb: { min: 1800, max: 3200 } },
  'khaolak-mid': { label: 'Khao Lak 中價', thb: { min: 1400, max: 2600 } },
  'krab-town-mid': { label: 'Krabi Town 中價', thb: { min: 1500, max: 2800 } },
  'koh-lanta-mid': { label: 'Koh Lanta 中價', thb: { min: 1500, max: 2800 } },
  'trang-mid': { label: 'Trang 市區中價', thb: { min: 1200, max: 2200 } },
  'koh-miang-park': { label: 'Koh Miang 國家公園住宿（限量）', thb: { min: 1200, max: 1800 } },
  'phi-phi-mid': { label: 'Phi Phi Don 中價', thb: { min: 1800, max: 3500 } },
};

/** 餐費（每人每天，THB） */
export const FOOD = {
  budget: { label: '經濟', thbPerDay: { min: 350, max: 550 } },
  mid: { label: '中價', thbPerDay: { min: 600, max: 950 } },
  resort: { label: '度假區', thbPerDay: { min: 1000, max: 1600 } },
};

/* ───────────── 11 個方案 ───────────── */

const d = (sea, title, detail, spots = [], base = null, food = 'mid') => ({
  sea, title, detail, spots, base, food,
});

export const PLANS = [
  {
    id: 'p01',
    tag: '1',
    name: '普吉經典三點',
    cn: '最穩的第一次：Racha ＋ Phi Phi ＋ 攀牙',
    crowdPreference: 'medium',
    bases: 1,
    summary: '住普吉不換基地，三個熱門點位各一天，剩餘時間休息與彈性。',
    pros: ['基地不變，移動負擔最低', '能見度與交通都合格', '船班好訂，備案多'],
    cons: ['人潮較多', '沒有秘境體驗', '深度有限'],
    songkranRisk: false,
    days: [
      d(true, '抵達・休息', '3/30 早上 8:10 抵普吉，專車接送至飯店，休息與調整時差', []),
      d(true, 'Racha Yai ＋ Noi', '快艇出海，能見度最佳段。整日浮潛', ['racha-yai', 'racha-noi']),
      d(true, 'Phi Phi 一日', '快艇或大船跳島，Viewpoint 值得爬', ['phi-phi']),
      d(false, '休息日・古鎮', 'Phuket Old Town，探索與補給，非潛店日', []),
      d(true, '攀牙灣', '划獨木舟進海蝕洞，觀景為主', ['phang-nga', 'koh-panyi']),
      d(false, '彈性日', '依海況調整，補拍浮潛或休息', []),
      d(false, '回程', '4/5 白天整理，晚上回台', []),
    ],
    lodgingTHB: { min: 1200 * 6, max: 2000 * 6 },
    foodLevel: 'mid',
    boatTHB: { min: 7200, max: 10500 },
    parkFeeTHB: 1900,
  },
  {
    id: 'p02',
    tag: '2',
    name: 'Koh Yao Noi 秘境慢遊',
    cn: '住小島，兩天不出海',
    crowdPreference: 'low',
    bases: 2,
    summary: '兩晚住 Koh Yao Noi（免公園費、人少），以它為基地跑 Racha 與 Koh Hong。',
    pros: ['**最推薦的冷門路線**', '無公園費', '基地安靜，夜間品質好'],
    cons: ['夜航抵當天即轉移，較趕', '快艇班次受天候影響', '小島餐廳選擇少'],
    songkranRisk: false,
    days: [
      d(false, '抵達・轉往 Koh Yao', '早上抵普吉後直接前往 Bang Rong 碼頭搭快艇，約 30 分', [], 'koh-yao-mid'),
      d(true, 'Racha 群', '自 Koh Yao Noi 出發能見度佳，離普吉較遠人較少', ['racha-yai', 'racha-noi']),
      d(true, 'Koh Hong', '自 Noi 出發最合理，紅色岩壁下的浮潛', ['koh-hong']),
      d(true, 'Koh Maphrao', '國家公園邊緣安靜小島', ['koh-maphrao']),
      d(false, '休息・稻田散步', 'Koh Yao Noi 特有的稻田與橡膠園', [], 'koh-yao-mid'),
      d(true, '返回普吉', '上午出海活動，下午回 Patong 住一晚', ['koh-nak']),
      d(false, '回程', '4/5 白天整理，晚上回台', []),
    ],
    lodgingTHB: { min: 2000 * 4 + 1200 * 2, max: 3600 * 4 + 2000 * 2 },
    foodLevel: 'mid',
    boatTHB: { min: 10500, max: 14500 },
    parkFeeTHB: 600,
  },
  {
    id: 'p03',
    tag: '3',
    name: '自由潛水專程',
    cn: '取得 AIDA 2，全程共識訓練點',
    crowdPreference: 'medium',
    bases: 2,
    summary: '以普吉的 SSS（多系統潛水中心）為基地，密集安排 Racha 與能見度好的點位。',
    pros: ['**AIDA 2 是法定救生衣豁免依據**', '普吉的教學資源優於甲米／蘭塔', 'Racha Noi 能見度 20–30m'],
    cons: ['課程費用另計', '受課程排程約束，行程較硬', '需確認 2027 課表'],
    songkranRisk: false,
    days: [
      d(false, '抵達・課程報到', '抵普吉，與潛店確認 AIDA 2 課程與課表', [], 'phuket-mid'),
      d(true, 'Racha Noi 共識訓練', '能見度最佳段，適合作為第一天適應', ['racha-noi']),
      d(true, 'Racha Noi 第二場', '重複同一水域建立共識與深度控制', ['racha-noi']),
      d(true, '課堂・技巧練習', '靜水技巧、救生程序、天候判斷', [], 'phuket-mid'),
      d(true, '開放水域實習', '依當日海況選點', ['racha-yai']),
      d(false, '休息・筆記', '整理深度紀錄與訓練數據', []),
      d(false, '回程', '4/5 白天整理，晚上回台', []),
    ],
    lodgingTHB: { min: 2500 * 6, max: 4500 * 6 },
    foodLevel: 'mid',
    boatTHB: { min: 9800, max: 14000 },
    parkFeeTHB: 800,
    courseFeeTHB: { min: 12000, max: 18000 },
  },
  {
    id: 'p04',
    tag: '4',
    name: 'Similan 能見度優先',
    cn: '住 Khao Lak 以縮短船程',
    crowdPreference: 'medium',
    bases: 2,
    summary: '移往 Khao Lak 住，Similan 從 Thap Lamu 出發船程僅 60–90 分，而非自普吉的 2.5 小時。',
    pros: ['**Similan 能見度最高**', 'Khao Lak 陸路更近', 'Thap Lamu 出發省時'],
    cons: ['基地搬遷', 'Similan 旺季擁擠', '國家公園費最高'],
    songkranRisk: false,
    days: [
      d(false, '抵達・轉往 Khao Lak', '自普吉往北約 2 小時車程', [], 'khaolak-mid'),
      d(true, 'Similan No.9 ＋ 浮潛', '快艇自 Thap Lamu 出發，能見度最佳', ['similan', 'koh-tachai']),
      d(true, 'Koh Tachai', '安達曼海少數 30m 能見度點位', ['koh-tachai']),
      d(false, '休息日', 'Khao Lak 灘上休息', [], 'khaolak-mid'),
      d(true, '返回普吉', '南下列島，傍晚住 Patong', ['koh-bon']),
      d(true, '自由安排', '依海況選 Racha 或 Coral', ['koh-hai']),
      d(false, '回程', '4/5 白天整理，晚上回台', []),
    ],
    lodgingTHB: { min: 1400 * 3 + 1200 * 3, max: 2600 * 3 + 2000 * 3 },
    foodLevel: 'mid',
    boatTHB: { min: 14000, max: 19500 },
    parkFeeTHB: 1400,
  },
  {
    id: 'p05',
    tag: '5',
    name: 'Phi Phi 過夜體驗',
    cn: '住一晚，跳島的節奏會不一樣',
    crowdPreference: 'high',
    bases: 2,
    summary: 'Phi Phi 住一晚，避開一日遊團的白晝時段，傍晚與清晨的 Phi Phi 完全是另一個地方。',
    pros: ['**避開團客時段**', '清晨 Leapfrog 潛水點人少', '體驗層次不同'],
    cons: ['Phi Phi 過夜費高', '行李搬運麻煩', '人仍多，僅時段不同'],
    songkranRisk: false,
    days: [
      d(false, '抵達・Phi Phi', '快艇 45–60 分，Leh 島登山道', ['phi-phi'], 'phi-phi-mid'),
      d(true, 'Phi Phi 清晨浮潛', 'Leapfrog、Giant Clam，避開團客', ['phi-phi']),
      d(false, '返回普吉', '上午回 Patong，剩餘時間休息', [], 'phuket-budget'),
      d(true, 'Racha 群', '能見度最佳段', ['racha-yai', 'racha-noi']),
      d(true, '攀牙灣', '獨木舟與海蝕洞', ['phang-nga', 'koh-klai']),
      d(false, '彈性日', '依海況調整', []),
      d(false, '回程', '4/5 白天整理，晚上回台', []),
    ],
    lodgingTHB: { min: 1800 * 1 + 1200 * 5, max: 3500 * 1 + 2000 * 5 },
    foodLevel: 'mid',
    boatTHB: { min: 8000, max: 12000 },
    parkFeeTHB: 1600,
  },
  {
    id: 'p06',
    tag: '6',
    name: '甲米四島入門',
    cn: '從普吉反方向，經典且便宜',
    crowdPreference: 'high',
    bases: 2,
    summary: '以普吉為入口，第一天快艇到 Krabi，之後走甲米經典四島。價格是全部方案中最親和的。',
    pros: ['**船價最便宜（฿650–1,500）**', '四島各有特色', '已含 Phra Nang'],
    cons: ['移動時間長', '人潮多', '基於普吉出發但主要玩甲米，較浪費交通'],
    songkranRisk: false,
    days: [
      d(false, '抵達・前往 Krabi', '快艇 90–120 分轉移，時間成本高', [], 'krab-town-mid'),
      d(true, '甲米四島', 'Tup、Chicken、Poda、Phra Nang', ['krabi-4islands']),
      d(true, 'Phi Phi（自 Krabi 更近）', '自 Krabi 45 分', ['phi-phi']),
      d(false, '休息日', 'Krabi Town 採買與休息', [], 'krab-town-mid'),
      d(true, 'Ao Nang 一日', 'Railay 或 Tong 安排', ['koh-khai']),
      d(false, '返回普吉', '上午移動，傍晚住 Patong', [], 'phuket-budget'),
      d(false, '回程', '4/5 白天整理，晚上回台', []),
    ],
    lodgingTHB: { min: 1500 * 4 + 1200 * 2, max: 2800 * 4 + 2000 * 2 },
    foodLevel: 'mid',
    boatTHB: { min: 7500, max: 11000 },
    parkFeeTHB: 1600,
  },
  {
    id: 'p07',
    tag: '7',
    name: 'Trang 秘境深度',
    cn: '翡翠洞與 Koh Kradan，人少水清',
    crowdPreference: 'low',
    bases: 2,
    summary: '深入 Trang 一帶，Koh Kradan 能見度極佳且人比蘭塔少。翡翠洞有技術門檻。',
    pros: ['**Koh Kradan 人少能見度佳**', '翡翠洞獨特', '極少團客路線'],
    cons: ['陸路移動長', '**翡翠洞不適合初學者自由潛水**', 'Trang 餐食選擇少'],
    songkranRisk: false,
    days: [
      d(false, '抵達・前往 Trang', '普吉至 Trang 約 4 小時車程，時間成本高', [], 'trang-mid'),
      d(true, 'Koh Kradan', 'Trang 出發 30–40 分，能見度極佳', ['koh-kradan']),
      d(true, 'Koh Kradan 第二場', '重複以取得穩定能見度', ['koh-kradan']),
      d(true, '翡翠洞（僅浮潛參觀）', '**頭頂受限、黑暗通道、湧浪，勿做自由潛水**', ['koh-mook']),
      d(false, '休息日', 'Trang 市區休息', [], 'trang-mid'),
      d(true, '返回普吉', '上午移動，傍晚住 Patong', ['koh-khai']),
      d(false, '回程', '4/5 白天整理，晚上回台', []),
    ],
    lodgingTHB: { min: 1200 * 4 + 1200 * 2, max: 2200 * 4 + 2000 * 2 },
    foodLevel: 'mid',
    boatTHB: { min: 12000, max: 16000 },
    parkFeeTHB: 1600,
  },
  {
    id: 'p08',
    tag: '8',
    name: 'Koh Lanta 駐紮',
    cn: '住大島，Rok 與 Haa 都在附近',
    crowdPreference: 'low',
    bases: 2,
    summary: '住 Koh Lanta 三晚，以它為基地跑 Koh Rok 與 Koh Haa — 兩個能見度極佳但人潮遠低於 Phi Phi 的點位。',
    pros: ['**Koh Haa 人少且能見度極佳**', '駐紮反覆練習', '避開主流路線'],
    cons: ['需要渡輪或快艇轉移', '餐食選擇有限', 'Lanta 交通靠摩托車'],
    songkranRisk: false,
    days: [
      d(false, '抵達・前往 Koh Lanta', 'Krabi 出發渡輪 90 分或快艇 45 分', [], 'koh-lanta-mid'),
      d(true, 'Koh Rok', '峭壁島，能見度極佳', ['koh-rok']),
      d(true, 'Koh Haa', '**安達曼海最佳組合之一：人少、能見度極佳**', ['koh-haa']),
      d(true, 'Koh Haa 第二場', '重複同一水域', ['koh-haa']),
      d(false, 'Lanta 休息日', '海灘與按摩', [], 'koh-lanta-mid'),
      d(true, '返回普吉', '上午移動，傍晚住 Patong', ['krabi-4islands']),
      d(false, '回程', '4/5 白天整理，晚上回台', []),
    ],
    lodgingTHB: { min: 1500 * 4 + 1200 * 2, max: 2800 * 4 + 2000 * 2 },
    foodLevel: 'mid',
    boatTHB: { min: 13000, max: 17500 },
    parkFeeTHB: 1800,
  },
  {
    id: 'p09',
    tag: '9',
    name: '雙區並進',
    cn: '普吉為主，甲米一日插入',
    crowdPreference: 'medium',
    bases: 3,
    summary: '以普吉為主，中間插入甲米一日。不追求覆蓋面，追求兩區都摸到。',
    pros: ['兩種水色與地形都體驗到', '甲米四島便宜', '普吉交通方便'],
    cons: ['基地三次搬遷，**最累的方案之一**', '移動時間被吃掉', '兩邊都不深入'],
    songkranRisk: false,
    days: [
      d(false, '抵達・住普吉', '調整時差', [], 'phuket-budget'),
      d(true, 'Racha 群', '能見度最佳段', ['racha-yai', 'racha-noi']),
      d(true, '甲米四島', '快艇 90–120 分，移動時間長', ['krabi-4islands'], 'krab-town-mid'),
      d(true, '返回普吉', '上午移動，傍晚住 Patong', [], 'phuket-budget'),
      d(true, 'Phi Phi', '經典一日', ['phi-phi']),
      d(false, '彈性日', '依海況調整', []),
      d(false, '回程', '4/5 白天整理，晚上回台', []),
    ],
    lodgingTHB: { min: 1200 * 4 + 1500 * 2, max: 2000 * 4 + 2800 * 2 },
    foodLevel: 'mid',
    boatTHB: { min: 13500, max: 18000 },
    parkFeeTHB: 2100,
  },
  {
    id: 'p10',
    tag: '10',
    name: 'Koh Siray 度假慢活',
    cn: '不住 Patong，住得比較好',
    crowdPreference: 'low',
    bases: 2,
    summary: '住 Koh Siray 的度假村而非 Patong 海灘。錢花在住宿上，換安靜與品質。',
    pros: ['**住宿品質是全部方案中最好的**', '避開 Patong 的人潮', '快艇 15 分即到 Chalong'],
    cons: ['**最貴的住宿**', '周邊餐食選擇少', '若想省錢則完全相反'],
    songkranRisk: false,
    days: [
      d(false, '抵達・前往 Koh Siray', '快艇 15 分', [], 'koh-siray-resort'),
      d(true, 'Tung Kaen ＋ Coral', '鄰近點位，輕鬆的一天', ['tung-kaen', 'koh-hae']),
      d(true, 'Racha 群', '能見度最佳段', ['racha-yai', 'racha-noi']),
      d(false, '度假村日', '不出海，休息', [], 'koh-siray-resort'),
      d(true, '攀牙灣', '獨木舟與海蝕洞', ['phang-nga', 'koh-panyi']),
      d(false, '回 Patong 住一晚', '為回程緩衝', [], 'phuket-budget'),
      d(false, '回程', '4/5 白天整理，晚上回台', []),
    ],
    lodgingTHB: { min: 5000 * 5 + 1200, max: 9000 * 5 + 2000 },
    foodLevel: 'resort',
    boatTHB: { min: 8500, max: 12500 },
    parkFeeTHB: 1400,
  },
  {
    id: 'p11',
    tag: '11',
    name: '極致跳島（全程在海上）',
    cn: '6 天出海，9 座以上島嶼，兩晚 Koh Miang',
    crowdPreference: 'low',
    bases: 3,
    isExtreme: true,
    summary:
      '**全程極致跳島。**住普吉 2 晚 → Koh Miang 國家公園 2 晚 → 回普吉 2 晚，'
      + '6 天出海涵蓋 9 座以上島嶼，含 Koh Tachai 的 30m 能見度。'
      + '以包船方式執行，時間與點位完全自訂。',
    pros: [
      '**能見度與覆蓋面在全部方案中最高**',
      'Koh Miang 過夜是最難取得的體驗（限量住宿）',
      '包船可依海況即時調整點位',
      '人少 — 國家公園住宿本身即為低人流',
    ],
    cons: [
      '**最貴**（包船 4 人分攤後每人最高）',
      '連續 6 天出海，疲勞風險高',
      'Koh Miang 住宿限量，須極早預訂',
      '包船須確認法規要求的督導與保險',
    ],
    songkranRisk: false,
    days: [
      d(true, '抵達・整備＋輕量首航', '3/30 早上 8:10 到，下午採買後短程出海暖身，順遊 Koh Yao Noi', ['koh-yao-noi', 'koh-siray'], 'phuket-mid'),
      d(true, 'Racha 群 ＋ Koh Khai', '第一段密集出海', ['racha-yai', 'racha-noi', 'koh-khai']),
      d(true, 'Similan ＋ Koh Tachai', '**能見度最高段**。轉往 Thap Lamu', ['similan', 'koh-tachai']),
      d(true, 'Koh Miang 國家公園', '**過夜國家公園**，8 號島觀景台', ['similan'], 'koh-miang-park'),
      d(true, 'Koh Miang ＋ 回 Thap Lamu', '上午國家公園潛水，下午南返經 Koh Bon', ['similan', 'koh-bon'], 'koh-miang-park'),
      d(true, 'Koh Hong ＋ Koh Klai', '自攀牙灣深處的秘境', ['koh-hong', 'koh-klai'], 'phuket-mid'),
      d(false, '回程', '4/5 白天整理，晚上回台', []),
    ],
    lodgingTHB: { min: 2500 * 3 + 1200 * 2 + 2000 * 2, max: 4500 * 3 + 1800 * 2 + 3600 * 2 },
    foodLevel: 'mid',
    boatTHB: { min: 52000, max: 72000 },
    parkFeeTHB: 3100,
  },
];

/** 全程極致跳島方案的 id */
export const EXTREME_PLAN_ID = 'p11';
