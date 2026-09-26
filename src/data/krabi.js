/**
 * Trave_Dec — 甲米 2027/05 七日跳島浮潛・五方案比較
 *
 * 資料誠實性原則：
 *  - 所有時刻、票價、船班、公園費皆為「前季參考／規劃估算」，出發前須查證官方網站。
 *  - 不提供即時天氣、海況、船班狀態；季風與季節性關閉（Similan／Surin 5/15、瑪雅灣 8/1–9/30）
 *    如實標示為「2027 待確認」。
 *  - 匯率為可自行調整的規劃假設值。
 *  - 事實來源：docs/krabi-2027-05-plans.md（研究於 2026-09）。
 */

export const KRABI_META = {
  title: '泰國甲米・跳島浮潛',
  subtitle: '2027 年 5 月・七日・五種方案比較',
  destination: 'Krabi, Thailand',
  origin: '高雄 KHH',
  destAirport: 'KBV',
  datesLabel: '2027/05',
  durationDays: 7,
  defaultTravelers: 4,
  researchDate: '2026-09',
  freshnessNote: '研究於 2026 年 9 月。2027 年 5 月的實際航班、船班、季風與公園費尚未公布，本頁所有數字皆為前季參考，出發前請務必查證官方網站。',
};

/** 機票前季參考（KHH→BKK→KBV，經濟艙來回） */
export const KRABI_FLIGHT_ESTIMATE = {
  minTWD: 10700,
  maxTWD: 14600,
  note: '高雄無直飛甲米，一律經曼谷轉機。2027/05 實際票價須於訂票時確認。',
};

/** 匯率假設值（1 THB ≈ N TWD），使用者可自行調整 */
export const THB_TO_TWD_ASSUMED = 0.9;

/** 三個決定性的前提（決定五案分化） */
export const KRABI_KEY_FACTS = [
  {
    id: 'no-direct',
    severity: 'warn',
    label: '沒有高雄直飛甲米',
    value: 'KHH → BKK → KBV 一律經曼谷轉機',
    detail:
      '可用泰航／泰微笑（TG 高雄-曼谷）、泰國亞洲航空（FD）、長榮／華航經曼谷。前季票價參考來回 TWD 10,700–14,600（經濟艙）。建議訂「前一天下午到 BKK、次日上午接 KBV」的組合，避免紅眼夜航。',
  },
  {
    id: 'monsoon',
    severity: 'critical',
    label: '2027/05 是季風過渡期',
    value: '乾季 11–4 月，5 月起進雨季（9–10 月最濕）',
    detail:
      '5 月通常仍可出船，但海況不穩，船班可能臨時取消或改程。因此五案都設有「雨天緩衝日（D6）」，用來吸收不確定性。',
  },
  {
    id: 'lanta-ferry',
    severity: 'critical',
    label: '奧南→蘭塔渡輪每年 5 月停駛',
    value: '僅 10 月至翌年 4 月營運',
    detail:
      '5 月前往 Koh Lanta 只能走陸路接駁 minivan＋車渡輪，約 3–4.5 小時、THB 400–600／人；或私人包車 2.5–3 小時、THB 1,500–2,500／車。這是「是否把蘭塔當基地」的分水嶺。',
  },
];

/** 國家公園入場費（成人，2026 前季參考） */
export const KRABI_PARK_FEES = [
  {
    id: 'phi-phi',
    place: 'Mu Ko Phi Phi（含瑪雅灣、Pileh Lagoon）',
    adultTHB: 400,
    childTHB: 200,
    season: '全年',
    note: '瑪雅灣於 8/1–9/30 例行關閉；5 月為開放期，2027 狀態待確認。',
    url: 'https://outthailand.com/guide/phi-phi-islands/',
  },
  {
    id: 'four-islands',
    place: '4 Islands（Poda、Chicken、Tup）',
    adultTHB: 400,
    childTHB: 200,
    season: '全年',
    note: '四島為最接近奧南的近岸行程，船程 20–40 分，雨季最不易取消。',
    url: 'https://krabitrek.com/articles/krabi-national-park-fees.php',
  },
  {
    id: 'hong',
    place: 'Hong 群島（Than Bok Khorani）',
    adultTHB: 300,
    childTHB: 200,
    season: '全年',
    note: '含紅樹林、007 島、女王洞；外海快艇行程，風浪大時停駛。',
    url: 'https://hongislandkrabi.com/plan-your-trip/national-park-fees',
  },
  {
    id: 'mu-ko-lanta',
    place: 'Mu Ko Lanta（Koh Rok、Koh Haa）',
    adultTHB: 400,
    childTHB: 200,
    season: '全年',
    note: '蘭塔國家公園，涵蓋 Koh Rok 與 Koh Haa 五島群。',
    url: 'https://godiving.co/travel/koh-haa-and-koh-rok-snorkel-guide/',
  },
  {
    id: 'surin',
    place: 'Mu Ko Surin（Surin 群島）',
    adultTHB: 500,
    childTHB: 250,
    season: '僅 10/15–5/15 季',
    note: '2027 年 5 月下旬可能已過季關閉，須查證當季公告。',
    url: 'https://www.surinislands.com/',
  },
  {
    id: 'similan',
    place: 'Mu Ko Similan（斯米蘭）',
    adultTHB: 500,
    childTHB: 250,
    season: '僅 10/15–5/15 季',
    note: '若想衝 Similan，須於 5/10 前抵達甲米才有機會，5 月下旬幾乎確定關閉。',
    url: 'https://siamtourandrealty.com/similan-or-surin-islands',
  },
];

/** 五種方案 */
export const KRABI_PLANS = [
  {
    id: 'planA',
    tag: 'A',
    name: '全浮潛跳島',
    positioning: '整趟只做一件事——浮潛。4 個出海日基地不搬家，另留 1 天可轉為出海或近岸的雨備日。',
    base: 'Krabi Town（全程不換基地）',
    snorkelStops: 14,
    snorkelScore: 5,
    isSnorkelOnly: true,
    overnightOnIsland: false,
    riskLevel: 'mid',
    riskNote: '4 出海日＋1 雨備',
    suits: '團體 4–6 人、有浮潛經驗、接受雨季',
    highlight: '浮潛點全案最多（12–16 點）；D6 雨備日可在全晴時追加近岸浮潛，變相成為第 5 個出海日。',
    flexibilityLabel: '中',
    flexibilityScore: 3,
    days: [
      {
        day: 1,
        title: '高雄 → 曼谷 → 甲米',
        detail: '經曼谷轉機，抵達後入住 Krabi Town。建議訂前一天下午抵 BKK、次日上午接 KBV 的航班。',
        transport: '航空＋機場接駁',
        costNote: '機票前季參考 TWD 10,700–14,600',
        seaDay: false,
      },
      {
        day: 2,
        title: '四島浮潛',
        detail:
          '雞島 Koh Gai（淺灘珊瑚）、Tup 島沙洲（退潮可走海上沙洲）、Podа 島浮潛、萊利海灘登陸。船程短，最不易因風浪取消。',
        transport: '長尾船（早鳥或一般）',
        costTHB: 1500,
        parkFeeTHB: 400,
        seaDay: true,
      },
      {
        day: 3,
        title: '皮皮島群浮潛一日',
        detail: 'Phi Phi Don Ton Sai → Phi Phi Leh 瑪雅灣／Pileh Lagoon → Bamboo 島浮潛。',
        transport: '快艇',
        costTHB: 2300,
        parkFeeTHB: 400,
        costNote: '含瑪雅灣費確認',
        seaDay: true,
      },
      {
        day: 4,
        title: 'Hong 群島＋007 島',
        detail: '紅樹林獨木舟、007 島（James Bond 島）環礁、女王洞浮潛。外海行程，風浪大時可能停駛。',
        transport: '大型快艇',
        costTHB: 2800,
        parkFeeTHB: 300,
        seaDay: true,
      },
      {
        day: 5,
        title: '海灘＋可選追加浮潛',
        detail: 'Ao Nang／Klong Khong 近岸自由潛，或加購 Koh Tub 沙洲。作為出海日的緩衝。',
        transport: '步行／船',
        costTHB: 600,
        seaDay: true,
      },
      {
        day: 6,
        title: '雨天緩衝日',
        detail:
          '預留一日吸收季風變數：若 D2–D4 有取消，於此補近岸浮潛。若全晴，可追加 Koh Hae（繞舌嶼）或 Ao Nang 浮潛。雨備：龍蓬寺、二級市場、水上排球。',
        transport: '步行／船',
        costTHB: 900,
        isBuffer: true,
        seaDay: false,
      },
      {
        day: 7,
        title: '買場・Krabibot 機場・返高雄',
        detail: 'Ao Nang／甲米市區採買，搭機返高雄。',
        transport: '航空',
        seaDay: false,
      },
    ],
    estimateTHB: { min: 9000, max: 12000, note: '前季參考，不含機票；浮潛裝備多含在船票內，租呼吸管另計約 THB 200–400／次。' },
    sources: [
      { label: '四島一日遊（Klook）', url: 'https://klook.com/en-US/activity/1433-4-islands-day-tour-krabi' },
      { label: 'Krabi 公園費', url: 'https://krabitrek.com/articles/krabi-national-park-fees.php' },
      { label: '甲米島嶼行程總覽', url: 'https://krabiboat.tours/island-hopping-itinerary' },
    ],
  },
  {
    id: 'planB',
    tag: 'B',
    name: 'Phi Phi 過夜＋四島',
    positioning: '經典均衡：唯一含「過夜島」的案子，夜間在 Ton Sai 是旅程高光。',
    base: 'Ao Nang 為主＋Phi Phi Don 1 晚',
    snorkelStops: 9,
    snorkelScore: 4,
    isSnorkelOnly: false,
    overnightOnIsland: true,
    riskLevel: 'mid-high',
    riskNote: '多一晚海上＋快艇',
    suits: '想要「火山口＋海灘＋浮潛」三者均衡',
    highlight: 'D3 快艇 45 分至 Phi Phi Don 過夜，兼顧深水與夜生活。',
    flexibilityLabel: '中',
    flexibilityScore: 3,
    days: [
      { day: 1, title: '高雄 → 曼谷 → 甲米', detail: '入住 Ao Nang。', transport: '航空＋接駁', seaDay: false },
      {
        day: 2,
        title: '四島一日',
        detail: '雞島、沙洲、Podа、萊利海灘。',
        transport: '長尾船',
        costTHB: 1500,
        parkFeeTHB: 400,
        seaDay: true,
      },
      {
        day: 3,
        title: '快艇至 Phi Phi Don，過夜一晚',
        detail: '約 45 分快艇。Ton Sai 村、沙灘、浮潛；夜間酒吧街。',
        transport: '快艇',
        costTHB: 4000,
        costNote: '含住宿 THB 2,500–5,000／房',
        seaDay: true,
      },
      {
        day: 4,
        title: '早安浮潛 → Phi Phi Leh 瑪雅灣 → 回 Ao Nang',
        detail: '可搭早鳥班，避開人潮。',
        transport: '快艇',
        costTHB: 1900,
        parkFeeTHB: 400,
        seaDay: true,
      },
      {
        day: 5,
        title: 'Hong 群島＋紅樹林或 007 島',
        detail: '可依前一日海況調整順序。',
        transport: '大型快艇',
        costTHB: 2800,
        parkFeeTHB: 300,
        seaDay: true,
      },
      {
        day: 6,
        title: '雨天緩衝日',
        detail: '萊利攀岩半日體驗（岩壁不受雨天影響，是雨季的可靠備案）；或按摩、龍蓬寺。',
        transport: '步行',
        costTHB: 2500,
        isBuffer: true,
        seaDay: false,
      },
      { day: 7, title: '返高雄', detail: 'Ao Nang 採買後赴 Krabibot 機場。', transport: '航空', seaDay: false },
    ],
    estimateTHB: { min: 11000, max: 14000, note: '前季參考，不含機票。' },
    sources: [
      { label: 'Phi Phi 兩日一夜行程', url: 'https://thailandaddict.com/en/krabi-island-plan' },
      { label: 'Phi Phi 島攻略', url: 'https://outthailand.com/guide/phi-phi-islands/' },
    ],
  },
  {
    id: 'planC',
    tag: 'C',
    name: '蘭塔島駐紮・礁石型',
    positioning: '浮潛品質至上：Koh Rok 是整個甲米區水色天花板，代價是多一次搬運。',
    base: 'Koh Lanta Yai 3 晚（其餘在甲米）',
    snorkelStops: 9,
    snorkelScore: 4,
    isSnorkelOnly: false,
    overnightOnIsland: true,
    riskLevel: 'mid',
    riskNote: '陸路接駁耗時',
    suits: '浮潛品質優先於移動次數、能接受長途接駁',
    highlight: '兩個長程出海日都鎖定 Koh Rok 與 Koh Haa；船班取消時可改同島岸潛。',
    flexibilityLabel: '高',
    flexibilityScore: 5,
    days: [
      { day: 1, title: '高雄 → 曼谷 → 甲米', detail: '入住 Krabi Town。', transport: '航空＋接駁', seaDay: false },
      {
        day: 2,
        title: '陸路接駁至 Koh Lanta Yai',
        detail:
          '5 月渡輪停駛，只能走陸路：minivan＋車渡輪 3–4.5 小時；或私人包車 2.5–3 小時。入住蘭塔。',
        transport: '陸路接駁',
        costTHB: 500,
        seaDay: false,
      },
      {
        day: 3,
        title: 'Koh Rok 浮潛一日',
        detail:
          '距蘭塔 47km。Rok Noi／Rok Yai 間水道能見度極佳，硬珊瑚與海龜。乾季常見 20–30m，5 月會下降但仍優於外海。',
        transport: '快艇',
        costTHB: 2000,
        parkFeeTHB: 400,
        seaDay: true,
      },
      {
        day: 4,
        title: 'Koh Haa 五島群＋Bamboo Bay 岸潛',
        detail: '平靜潟湖，初學者友善。',
        transport: '快艇',
        costTHB: 2000,
        parkFeeTHB: 400,
        seaDay: true,
      },
      {
        day: 5,
        title: '島上慢遊',
        detail: 'Long Beach／Klong Khong 日落、佛陀雕像、Ae Lanta 沙灘。可安排一次近岸浮潛。',
        transport: '租機車',
        costTHB: 1200,
        seaDay: false,
      },
      {
        day: 6,
        title: '雨天緩衝日',
        detail: '若 Koh Rok／Haa 因浪停駛，改蘭塔西側 Ao Mai pai 岸潛（受地形遮蔽，比外海安全）。',
        transport: '步行／船',
        costTHB: 800,
        isBuffer: true,
        seaDay: false,
      },
      {
        day: 7,
        title: '陸路回甲米・返高雄',
        detail: '需多留 4 小時緩衝。',
        transport: '陸路接駁＋航空',
        costTHB: 500,
        seaDay: false,
      },
    ],
    estimateTHB: { min: 11000, max: 14000, note: '前季參考，不含機票；含蘭塔住宿。' },
    sources: [
      { label: 'Koh Rok 與 Koh Haa 浮潛指南', url: 'https://godiving.co/travel/koh-haa-and-koh-rok-snorkel-guide/' },
      { label: '奧南至蘭塔交通（5 月渡輪停駛）', url: 'https://amazinglanta.com/how-to-travel-from-koh-lanta-to-ao-nang/' },
      { label: '蘭塔島接駁方式', url: 'https://www.southeastasiasimplified.com/blog/transfer-guides-5/krabi-to-koh-lanta-all-transfer-options-2026-176' },
    ],
  },
  {
    id: 'planD',
    tag: 'D',
    name: '遠端大島探險',
    positioning: '風險最高、驚喜最多：衝外海大船與保育區，珊瑚覆蓋率最高。',
    base: 'Krabi Town（不換基地）',
    snorkelStops: 7,
    snorkelScore: 3,
    isSnorkelOnly: false,
    overnightOnIsland: false,
    riskLevel: 'high',
    riskNote: '外海大船易停駛',
    suits: '浮潛經驗豐富、能接受「兩天可能只玩到一天」',
    highlight: '若要衝 Similan，須於 5/10 前抵達甲米（季到 5/15）。',
    flexibilityLabel: '低',
    flexibilityScore: 2,
    days: [
      { day: 1, title: '高雄 → 曼谷 → 甲米', detail: '入住 Krabi Town。', transport: '航空＋接駁', seaDay: false },
      {
        day: 2,
        title: 'Andaman 四珍珠：Hong＋007＋Pakbia',
        detail: '大型快艇一日，外海珊瑚覆蓋率最高。',
        transport: '大型快艇',
        costTHB: 3100,
        parkFeeTHB: 300,
        seaDay: true,
      },
      {
        day: 3,
        title: 'Surin 群島一日',
        detail: '保育區。5/15 前可能仍在季內，2027 季末日期待確認。',
        transport: '快艇',
        costTHB: 2700,
        parkFeeTHB: 500,
        costNote: '僅 10/15–5/15 季，過季可能關閉',
        seaDay: true,
      },
      {
        day: 4,
        title: '四島／近海一日',
        detail: '若 D2–D3 遇惡劣海況，於此補回近岸行程。',
        transport: '長尾船',
        costTHB: 1500,
        parkFeeTHB: 400,
        seaDay: true,
      },
      {
        day: 5,
        title: '浮潛專場',
        detail: 'Ao Nang 近岸，或加購 Koh Tub 沙洲＋沙灘。',
        transport: '船',
        costTHB: 1000,
        seaDay: true,
      },
      {
        day: 6,
        title: '雨天緩衝日',
        detail: '外海停駛時的替代：Krabi 龍蓬寺、藍池、紅樹林、按摩。',
        transport: '步行',
        costTHB: 800,
        isBuffer: true,
        seaDay: false,
      },
      { day: 7, title: '返高雄', detail: '甲米採買後赴 Krabibot 機場。', transport: '航空', seaDay: false },
    ],
    estimateTHB: { min: 12000, max: 15000, note: '前季參考，不含機票。' },
    sources: [
      { label: 'Similan 與 Surin 季別說明', url: 'https://siamtourandrealty.com/similan-or-surin-islands' },
      { label: 'Ao Nang 行程與價格', url: 'https://www.getyourguide.com/en-gb/ao-nang-l89867/' },
      { label: '甲米雨季與船班取消', url: 'https://thailandaddict.com/en/krabi-travel-tips' },
    ],
  },
  {
    id: 'planE',
    tag: 'E',
    name: '雨季保險型',
    positioning: '五月首度最穩：出海 2–3 天，其餘為全天候陸備，船班取消不致整趟崩潰。',
    base: 'Ao Nang（不換基地）',
    snorkelStops: 6,
    snorkelScore: 3,
    isSnorkelOnly: false,
    overnightOnIsland: false,
    riskLevel: 'low',
    riskNote: '出海天數最少',
    suits: '五月首次前往、不想被海取消行程',
    highlight: '2–3 天出海＋2–3 天全天候陸備；錢多花在能改期的部分。',
    flexibilityLabel: '高',
    flexibilityScore: 5,
    days: [
      { day: 1, title: '高雄 → 曼谷 → 甲米', detail: '入住 Ao Nang。', transport: '航空＋接駁', seaDay: false },
      {
        day: 2,
        title: '四島一日',
        detail: '近岸、船程 20–40 分，五月最不易取消的行程。',
        transport: '長尾船',
        costTHB: 1500,
        parkFeeTHB: 400,
        seaDay: true,
      },
      {
        day: 3,
        title: '皮皮島一日',
        detail: '快艇 45 分；若風浪偏大可改渡輪，穩定度更高。',
        transport: '快艇或渡輪',
        costTHB: 2000,
        parkFeeTHB: 400,
        seaDay: true,
      },
      {
        day: 4,
        title: '雨天備案主場景',
        detail: '龍蓬寺（Wat Tham Suea）、藍池、紅樹林、Krabibot 海洋博物館、按摩。全部雨天可行。',
        transport: '步行／計程車',
        costTHB: 1200,
        seaDay: false,
      },
      {
        day: 5,
        title: 'Hong 群島一日',
        detail: '風浪大時可改陸上行程（改 D4 的第二個陸備點）。',
        transport: '大型快艇',
        costTHB: 2800,
        parkFeeTHB: 300,
        seaDay: true,
      },
      {
        day: 6,
        title: '全程備用日',
        detail: '保留一日完全不排船班，由船班取消情況決定使用。',
        transport: '—',
        isBuffer: true,
        seaDay: false,
      },
      { day: 7, title: '返高雄', detail: 'Ao Nang 採買後赴 Krabibot 機場。', transport: '航空', seaDay: false },
    ],
    estimateTHB: { min: 7000, max: 10000, note: '前季參考，不含機票；五案中團費最低。' },
    sources: [
      { label: '甲米雨季何時該避開', url: 'https://www.excursionmania.com/zh-cn/article/when-to-avoid-visiting-krabi-blg-4615-blg4615' },
      { label: 'Krabi 旅遊提示（雨季與船班）', url: 'https://thailandaddict.com/en/krabi-travel-tips' },
    ],
  },
];

/** 比較軸定義 */
export const KRABI_COMPARE_AXES = [
  { key: 'snorkel', label: '浮潛點數', betterWhen: 'high', hint: '整趟可下水的點位總數' },
  { key: 'seaDays', label: '海上天數', betterWhen: 'high', hint: '實際出海的天數（不含雨備日）' },
  { key: 'islandStay', label: '住島上', betterWhen: 'either', hint: '是否有過夜島' },
  { key: 'baseMoves', label: '搬運基地', betterWhen: 'low', hint: '需更換住宿基地的次數' },
  { key: 'risk', label: '5 月雨季風險', betterWhen: 'low', hint: '季風過渡期的取消與改程風險' },
  { key: 'flexibility', label: '船取消後可替代性', betterWhen: 'high', hint: '停駛時能否就地改成岸潛或陸備' },
  { key: 'cost', label: '前季團費', betterWhen: 'low', hint: '不含機票，每人前季參考區間' },
];

/** 季風過渡期的應變對照 */
export const KRABI_CONTINGENCY = [
  {
    id: 'cancelled',
    situation: '出海行程因風浪取消',
    action: '改用當案的雨天緩衝日（D6）補回；若無緩衝日可改近岸浮潛或陸備景點。退費政策依船公司，務必在訂購時確認惡劣天氣退款條款。',
  },
  {
    id: 'reroute',
    situation: '船班改程或改走近岸',
    action: '接受改程，優先保住浮潛點；示意可改 Ao Nang／Klong Khong 近岸浮潛或蘭塔 Ao Mai pai 岸潛。',
  },
  {
    id: 'lanta-ferry',
    situation: '誤以為蘭塔渡輪有班',
    action: '5 月渡輪停駛，務必預訂陸路接駁（minivan＋車渡輪 3–4.5 小時），不可只買船票。',
  },
  {
    id: 'seasick',
    situation: '易暈船或不耐長距離快艇',
    action: '優先選長尾船或渡輪版本；出發前 1 小時服藥；B 案的攀岩與 E 案陸備行程可作替代。',
  },
  {
    id: 'injury',
    situation: '浮潛受傷或礁石割傷',
    action: '以清水沖洗並覆蓋傷口；泰國撥打 1669（醫療）或 191（警察）；保險理賠須保留就診單據。',
  },
  {
    id: 'monsoon-forecast',
    situation: '出發前預報連續降雨',
    action: '改選 E 案（雨季保險型）；出發前 3–5 天查當地氣象局與船公司的停駛公告。',
  },
];

/** 訂票前待查證清單 */
export const KRABI_OPEN_QUESTIONS = [
  { id: 'q1', text: 'KHH→BKK→KBV 於 2027/05 的實際班表與票價（泰航／FD／長榮）。' },
  { id: 'q2', text: '各船公司 2027 年 5 月是否照常出航，以及當地氣象局的浪高／風速預報。' },
  { id: 'q3', text: 'Similan／Surin 2026–27 季的確切開放起訖日（前季為 10/15–5/15）。' },
  { id: 'q4', text: 'Phi Phi 瑪雅灣 2027 年 5 月的開放狀態。' },
  { id: 'q5', text: '蘭塔島 5 月陸路接駁的實際班次與車況（渡輪停駛期）。' },
  { id: 'q6', text: '泰國入境規定：台灣護照免簽天數與所需文件、TDAC（泰國數位入境卡）填寫時程——須查證最新規定。' },
];

/** 官方／主要來源連結 */
export const KRABI_SOURCE_LINKS = [
  { label: '泰國觀光局 TAT（入境與簽證資訊）', url: 'https://www.tatnews.org/' },
  { label: '泰國觀光局中文（入境須知）', url: 'https://www.tatnews.org/th-articles/' },
  { label: 'Krabi 國家公園收費', url: 'https://krabitrek.com/articles/krabi-national-park-fees.php' },
  { label: 'Similan／Surin 季別與票價', url: 'https://siamtourandrealty.com/similan-or-surin-islands' },
  { label: '蘭塔渡輪營運期間（5–10 月停駛）', url: 'https://amazinglanta.com/how-to-travel-from-koh-lanta-to-ao-nang/' },
  { label: '甲米雨季與船班取消說明', url: 'https://thailandaddict.com/en/krabi-travel-tips' },
];

/** 全站共用的免責與時效標語 */
export const KRABI_FRESHNESS_BANNER =
  '所有時刻、票價、船班與公園費均為前季參考／規劃估算，2027 年 5 月的實際資料尚未公布，出發前請務必查證官方網站。本頁不提供即時天氣、海況或船班狀態。';
