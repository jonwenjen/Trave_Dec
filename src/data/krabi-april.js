/**
 * Trave_Dec — 2027/04 六天五夜・甲米＋Trang 跳島浮潛・五種方案（4 月首選窗口）
 *
 * 與 5 月版（src/data/krabi.js 的 KRABI_PLANS）的差異，都來自「4 月仍是乾季」這件事：
 *  1. Similan 在季內（10/15–5/15）→ 能見度最佳的選擇成立
 *  2. 奧南→蘭塔渡輪仍有班 → 不必 3–4.5 小時陸路折騰
 *  3. 雨季船班取消風險解除 → 原 5 月版的「雨備日」不再是核心設計
 *  4. 代價是 El Niño 下的高溫（見 src/data/krabi-climate.js）
 *
 * 資料誠實性：所有時刻、船班、費用皆為前季參考；2027 年 4 月的實際班表尚未公布。
 * 秘境（Koh Mook 翡翠洞等）附潮汐與季節限制說明，不假造可通行時間。
 */

import { THB_TO_TWD_ASSUMED } from './krabi.js';

export { THB_TO_TWD_ASSUMED };

/** 4 月窗口的三個決定性前提（與 5 月版不同，故獨立定義） */
export const APRIL_KEY_FACTS = [
  {
    id: 'dry-season-end',
    severity: 'info',
    label: '4 月仍在乾季',
    value: '海況穩定、能見度 15–25m',
    detail:
      '安達曼海乾季為 11–4 月，4 月中下旬海面仍平穩，是全年能見度最佳區間之一。' +
      '與 5 月最大的差別：船班因風浪取消的風險大幅降低。',
  },
  {
    id: 'similan-season',
    severity: 'info',
    label: 'Similan 在季內',
    value: '開放季 10/15 – 5/15',
    detail:
      '2027 年 4 月完全在季內，能見度最佳的選擇成立。5 月下旬即進入季末風險。' +
      '2026–27 季的確切開放日須以官方公告為準。',
  },
  {
    id: 'songkran',
    severity: 'critical',
    label: '必須避開宋干節',
    value: '2027 推估 4/13 – 4/15',
    // detail 會顯示於卡片，日期區間以完整形式呈現
    detail:
      '宋干節（2027 推估 4/13 – 4/15）是泰國最盛大的一週，甲米與普吉會非常擁擠、住宿價格飆高、機票貴。' +
      '本窗口（4/6–4/12）完全避開；若改選 4 月下旬則緊接節後，人潮退去但價格尚未完全回落。' +
      '宋干節 2027 確切日期須以官方公告為準。',
  },
];

/** 4 月版國家公園／保護區入場費 */
export const APRIL_PARK_FEES = [
  {
    id: 'similan',
    place: 'Mu Ko Similan（斯米蘭）',
    adultTHB: 500,
    childTHB: 250,
    season: '僅 10/15–5/15 季',
    note: '4 月完全在季內。這是安達曼海能見度最佳的浮潛點，但快艇航程長、風浪大時會停駛。',
    url: 'https://siamtourandrealty.com/similan-or-surin-islands',
  },
  {
    id: 'hat-chao-mai',
    place: 'Hat Chao Mai NP（Koh Mook 翡翠洞）',
    adultTHB: 200,
    childTHB: 100,
    season: '全年',
    note:
      '翡翠洞 Tham Morakot 位於此保護區。80 公尺黑暗隧道，只在低潮至中潮開放，' +
      '滿潮時隧道太低會淹。須由嚮導依潮汐調整進入時機。',
    url: 'https://thailandknowhow.com/emerald-cave-koh-mook-how-to-visit-tham-morakot',
  },
  {
    id: 'phi-phi',
    place: 'Mu Ko Phi Phi（含瑪雅灣、Pileh Lagoon）',
    adultTHB: 400,
    childTHB: 200,
    season: '全年',
    note: '瑪雅灣於 8/1–9/30 例行關閉，4 月為開放期。2027 狀態待確認。',
    url: 'https://outthailand.com/guide/phi-phi-islands/',
  },
  {
    id: 'mu-ko-lanta',
    place: 'Mu Ko Lanta（Koh Rok、Koh Haa）',
    adultTHB: 400,
    childTHB: 200,
    season: '全年',
    note: '4 月渡輪有班，可從 Ao Nang 直達蘭塔，不需陸路折騰。',
    url: 'https://godiving.co/travel/koh-haa-and-koh-rok-snorkel-guide/',
  },
  {
    id: 'hong',
    place: 'Hong 群島（Than Bok Khorani）',
    adultTHB: 300,
    childTHB: 200,
    season: '全年',
    note: '含紅樹林、007 島、女王洞。',
    url: 'https://hongislandkrabi.com/plan-your-trip/national-park-fees',
  },
];

/** 4 月版五種方案 */
export const KRABI_PLANS_APRIL = [
  {
    id: 'aprA',
    tag: 'A',
    name: 'Similan 能見度首選',
    positioning:
      '把整趟壓在安達曼海能見度最好的地方。Similan 在季內，加上近岸四島與 Koh Rok，7 天有 5 天出海。',
    base: 'Krabi Town（不換基地）＋ Thap Lamu 碼頭一日往返',
    window: '2027-04-06 – 04-12',
    snorkelStops: 15,
    snorkelScore: 5,
    isSnorkelOnly: false,
    overnightOnIsland: false,
    riskLevel: 'low',
    riskNote: '乾季尾，風浪小',
    suits: '把「水有多清」放在第一位、願意早起搭早鳥船',
    highlight: 'Similan 珊瑚花園與能見度是整個安達曼海的頂點；4 月在季內，是全年唯一能安心安排此行程的窗口之一。',
    flexibilityLabel: '中',
    flexibilityScore: 3,
    days: [
      { day: 1, title: '高雄 → 曼谷 → 甲米', detail: '經曼谷轉機，抵達後入住 Krabi Town。建議訂前一天下午抵 BKK、次日上午接 KBV 的航班。', transport: '航空＋接駁', costNote: '機票前季參考 TWD 10,700–14,600', seaDay: false },
      {
        day: 2,
        title: '四島浮潛（暖身）',
        detail: '雞島 Koh Gai（淺灘珊瑚）、Tup 島沙洲、Podа 島浮潛、萊利海灘登陸。先用近岸行程適應水溫與裝備。',
        transport: '長尾船',
        costTHB: 1500,
        parkFeeTHB: 400,
        seaDay: true,
      },
      {
        day: 3,
        title: 'Similan 一日（早鳥出發）',
        detail: '從 Thap Lamu 碼頭搭早鳥快艇出海，浮潛於 9 號島（Koh Ba Ngu，珊瑚與海龜）、Sail Rock 等點。航程約 1.5–2 小時，風浪大時會停駛。',
        transport: '快艇（Thap Lamu 碼頭）',
        costTHB: 4500,
        parkFeeTHB: 500,
        costNote: '早鳥班通常較貴但海況較穩',
        seaDay: true,
      },
      {
        day: 4,
        title: 'Koh Rok 浮潛（能見度第二把交椅）',
        detail: 'Koh Rok Noi／Rok Yai 之間水道能見度可達 30m，珊瑚密度極高，且人潮只有 Similan 的一半。需從蘭塔或直接快艇前往。',
        transport: '快艇',
        costTHB: 3500,
        parkFeeTHB: 400,
        seaDay: true,
      },
      {
        day: 5,
        title: 'Hong 群島＋007 島',
        detail: '紅樹林獨木舟、007 島環礁、女王洞浮潛。',
        transport: '大型快艇',
        costTHB: 2800,
        parkFeeTHB: 300,
        seaDay: true,
      },
      {
        day: 6,
        title: '加值日／緩衝日',
        detail: '視前幾日海況：若全晴，加訂 Koh Tub 沙洲或 Ao Nang 近岸浮潛；若遇突發狀況，此日即為吸收變數的緩衝。',
        transport: '船',
        costTHB: 1200,
        isBuffer: true,
        seaDay: true,
      },
      { day: 7, title: '買場・Krabibot 機場・返高雄', detail: '甲米市區採買，搭機返高雄。', transport: '航空', seaDay: false },
    ],
    estimateTHB: { min: 13000, max: 16000, note: '前季參考，不含機票；含 Similan 較高的船票與公園費。' },
    sources: [
      { label: 'Similan 能見度與季節', url: 'https://thailandaddict.com/en/similan-islands-guide' },
      { label: 'Koh Rok 與 Similan 能見度比較', url: 'https://www.siamdive.com/en/blogs/30-metres-clear-half-the-boats-koh-rok-vs-similans' },
      { label: '四島一日遊', url: 'https://klook.com/en-US/activity/1433-4-islands-day-tour-krabi' },
    ],
  },
  {
    id: 'aprB',
    tag: 'B',
    name: 'Trang 秘境：翡翠洞＋白色沙灘',
    positioning:
      '跳開甲米熱門區，往南到 Trang 群島。最受歡迎的是 Koh Mook 的翡翠洞——80 公尺黑暗隧道通往一座私藏潟湖。',
    base: 'Trang 市區 2 晚 ＋ Koh Mook 1 晚',
    window: '2027-04-06 – 04-12',
    snorkelStops: 11,
    snorkelScore: 4,
    isSnorkelOnly: false,
    overnightOnIsland: true,
    riskLevel: 'mid',
    riskNote: '翡翠洞受潮汐限制',
    suits: '想要「照片說不出感受」的體驗、願意為秘境移動',
    highlight: '翡翠洞只在低潮至中潮開放，滿潮會淹；必須會游泳。建議 10:00–12:00 進洞，當時光線最好。',
    flexibilityLabel: '中',
    flexibilityScore: 3,
    days: [
      { day: 1, title: '高雄 → 曼谷 → 甲米', detail: '抵達後住 Krabi Town。', transport: '航空＋接駁', seaDay: false },
      {
        day: 2,
        title: '陸路南下 Trang',
        detail: '甲米 → Trang 約 84–148 km，minivan 便宜、私人包車較舒適，車程 2–3 小時。到 Trang 後可逛中式葡萄牙老城與小販市場。',
        transport: '陸路（minivan 或包車）',
        costTHB: 800,
        seaDay: false,
      },
      {
        day: 3,
        title: 'Koh Mook 翡翠洞（Tham Morakot）',
        detail:
          '在正確潮汐時機，游過 80 公尺全黑石灰岩隧道，一隻手扶岩壁，盡頭豁然開朗——被峭壁環繠、陽光直瀉的私藏潟湖。' +
          '洞內有莫拉鰻（moray eel）。低潮時洞口在海面上完全看不見。',
        transport: '船（Pak Meng 碼頭出發）',
        costTHB: 2200,
        parkFeeTHB: 200,
        costNote: '須依潮汐安排時段',
        seaDay: true,
      },
      {
        day: 4,
        title: 'Koh Kradan ＋ Koh Chueak ＋ Koh Ngai',
        detail: 'Trang 群島的白沙灘與浮潛點，人數遠少於 Koh Phi Phi。Koh Kradan 是群島中最白的沙灘之一。',
        transport: '長尾船',
        costTHB: 2000,
        seaDay: true,
      },
      {
        day: 5,
        title: 'Koh Libong 尋海牛（半日）',
        detail:
          'Libong 群島野生動物保護區，淺海海草床是泰國最後仍可遇見海牛（dugong）的地方之一。' +
          '注意：此處能見度僅 5–12m，適合「看稀有生物」而非「看清水」。',
        transport: '長尾船',
        costTHB: 1500,
        seaDay: true,
      },
      {
        day: 6,
        title: 'Trang 市區 ＋ 陸路回甲米',
        detail: '若時間允許，可安排 Khao Kob 洞穴（Kantang）作為雨天備案，再陸路返回甲米住一晚。',
        transport: '陸路',
        costTHB: 800,
        isBuffer: true,
        seaDay: false,
      },
      { day: 7, title: 'Krabibot 機場・返高雄', detail: '自 Trang 或 Krabibot 返程。', transport: '航空', seaDay: false },
    ],
    estimateTHB: { min: 11500, max: 14000, note: '前季參考，不含機票；含 Trang 住宿與陸路接駁。' },
    sources: [
      { label: '翡翠洞造訪指南（潮汐／安全）', url: 'https://thailandknowhow.com/emerald-cave-koh-mook-how-to-visit-tham-morakot' },
      { label: 'Trang 群島與 Krabi 的行程規劃', url: 'https://thailandaddict.com/en/krabi-trang-plan' },
      { label: 'Koh Muk 與 Trang 島嶼指南', url: 'https://www.travelfish.org/location/thailand/southern_thailand/trang/ko_muk' },
    ],
  },
  {
    id: 'aprC',
    tag: 'C',
    name: '蘭塔駐紮・渡輪直達',
    positioning:
      '4 月渡輪有班，不必像 5 月那樣陸路折騰 3–4.5 小時。住在 Koh Lanta 三天，每天出海。',
    base: 'Koh Lanta Yai 3 晚（Ao Nang 渡輪 4 月有班）',
    window: '2027-04-06 – 04-12',
    snorkelStops: 10,
    snorkelScore: 4,
    isSnorkelOnly: false,
    overnightOnIsland: true,
    riskLevel: 'low',
    riskNote: '渡輪有班，移動成本低',
    suits: '想住島上、把時間平均分配到三個不同浮潛區的人',
    highlight: '渡輪直達是 4 月相對 5 月最大的結構性優勢：省下半天折騰，换來更多浮潛時間。',
    flexibilityLabel: '高',
    flexibilityScore: 4,
    days: [
      { day: 1, title: '高雄 → 曼谷 → 甲米', detail: '抵達後住 Ao Nang，為隔天渡輪做準備。', transport: '航空＋接駁', seaDay: false },
      {
        day: 2,
        title: '渡輪直達 Koh Lanta',
        detail: 'Ao Nang → Koh Lanta 渡輪（4 月有班，約 1.5–2 小時），或快艇。入住後可在 Long Beach 看日落。',
        transport: '渡輪／快艇',
        costTHB: 700,
        seaDay: true,
      },
      {
        day: 3,
        title: 'Koh Rok 浮潛',
        detail: '距蘭塔 47km。Rok Noi／Rok Yai 間水道能見度可達 30m，硬珊瑚與海龜。',
        transport: '快艇',
        costTHB: 2000,
        parkFeeTHB: 400,
        seaDay: true,
      },
      {
        day: 4,
        title: 'Koh Haa 五島群＋Bamboo Bay 岸潛',
        detail: '平靜潟湖，初學者友善。Koh Haa 為五個小島群組成的保護區。',
        transport: '快艇',
        costTHB: 2000,
        parkFeeTHB: 400,
        seaDay: true,
      },
      {
        day: 5,
        title: 'Similan 或島上慢遊',
        detail: '若想衝 Similan 可從蘭塔安排一日；否則可安排島上浮潛（Ao Mai pai 岸潛）與慢遊。',
        transport: '快艇／步行',
        costTHB: 2500,
        seaDay: true,
      },
      {
        day: 6,
        title: '緩衝日・回 Ao Nang',
        detail: '渡輪返回 Ao Nang，作為回程前的緩衝，或加訂近岸浮潛。',
        transport: '渡輪',
        costTHB: 700,
        isBuffer: true,
        seaDay: true,
      },
      { day: 7, title: '買場・機場・返高雄', detail: 'Ao Nang 或甲米市區採買，搭機返高雄。', transport: '航空', seaDay: false },
    ],
    estimateTHB: { min: 11000, max: 13500, note: '前季參考，不含機票；含蘭塔住宿。' },
    sources: [
      { label: 'Koh Rok 與 Koh Haa 浮潛指南', url: 'https://godiving.co/travel/koh-haa-and-koh-rok-snorkel-guide/' },
      { label: 'Ao Nang 至 Koh Lanta 交通（渡輪季節）', url: 'https://amazinglanta.com/how-to-travel-from-koh-lanta-to-ao-nang/' },
    ],
  },
  {
    id: 'aprD',
    tag: 'D',
    name: 'Phi Phi 過夜＋Trang 延伸',
    positioning: '經典 Phi Phi 過夜，加上 Trang 群島的秘境。兼顧「火山口地形」與「人少秘境」。',
    base: 'Ao Nang 為主 ＋ Phi Phi Don 1 晚 ＋ Trang 1 晚',
    window: '2027-04-06 – 04-12',
    snorkelStops: 12,
    snorkelScore: 4,
    isSnorkelOnly: false,
    overnightOnIsland: true,
    riskLevel: 'low',
    riskNote: '乾季，過夜行程穩定',
    suits: '想一次看到「代表性島」與「秘境」的團體',
    highlight: '一次行程同時涵蓋兩種截然不同的泰國安達曼海體驗。',
    flexibilityLabel: '中',
    flexibilityScore: 3,
    days: [
      { day: 1, title: '高雄 → 曼谷 → 甲米', detail: '抵達後住 Ao Nang。', transport: '航空＋接駁', seaDay: false },
      { day: 2, title: '四島一日', detail: '雞島、沙洲、Podа、萊利海灘。', transport: '長尾船', costTHB: 1500, parkFeeTHB: 400, seaDay: true },
      {
        day: 3,
        title: '快艇至 Phi Phi Don，過夜',
        detail: '約 45 分快艇。Ton Sai 村、沙灘、浮潛；夜間酒吧街。',
        transport: '快艇',
        costTHB: 4200,
        costNote: '含住宿',
        seaDay: true,
      },
      { day: 4, title: '早安浮潛 → Phi Phi Leh 瑪雅灣 → 回 Ao Nang', detail: '可搭早鳥班，避開人潮。', transport: '快艇', costTHB: 1900, parkFeeTHB: 400, seaDay: true },
      {
        day: 5,
        title: '陸路南下 Trang（可作為緩衝）',
        detail:
          '車程 2–3 小時，住 Trang 市區。本日無固定海上承諾，若前段行程延誤或體力不足，' +
          '可改為提早出發、在 Trang 老城與小販市場多作休息，把時間留給隔日的翡翠洞。',
        transport: '陸路',
        costTHB: 800,
        isBuffer: true,
        seaDay: false,
      },
      {
        day: 6,
        title: 'Koh Mook 翡翠洞 ＋ Koh Kradan',
        detail: '依潮汐安排翡翠洞時段（建議 10:00–12:00），下午前往 Koh Kradan。',
        transport: '船（Pak Meng 碼頭）',
        costTHB: 2800,
        parkFeeTHB: 200,
        isBuffer: false,
        seaDay: true,
      },
      { day: 7, title: '返高雄', detail: '自 Trang（TST）或 Krabibot（KBV）返程。', transport: '航空', seaDay: false },
      // 說明：本案 7 天含兩段移動（甲米→Trang 陸路、兩地住宿），無完整閒置日。
      // D5 上午若體力不足可放棄 Koh Libong 改在 Trang 市區休息，作為變數緩衝。
    ],
    estimateTHB: { min: 12000, max: 15000, note: '前季參考，不含機票；含 Phi Phi 與 Trang 兩段住宿。' },
    sources: [
      { label: 'Phi Phi 兩日一夜行程', url: 'https://thailandaddict.com/en/krabi-island-plan' },
      { label: 'Trang 群島行程', url: 'https://thailandaddict.com/en/krabi-trang-plan' },
    ],
  },
  {
    id: 'aprE',
    tag: 'E',
    name: '翡翠洞專注・低強度',
    positioning:
      '只選一到兩個最值得的點，把節奏放慢。適合不想每天趕船、或成員中有不熟水性者。',
    base: 'Trang 市區 3 晚',
    window: '2027-04-06 – 04-12',
    snorkelStops: 7,
    snorkelScore: 3,
    isSnorkelOnly: false,
    overnightOnIsland: false,
    riskLevel: 'low',
    riskNote: '出海天數少，變數小',
    suits: '想深度體驗秘境而非廣泛打卡；或成員中有怕水、長輩同行',
    highlight: '把兩天給 Trang 群島（翡翠洞＋Koh Kradan），另留多日備用或陸地活動。',
    flexibilityLabel: '高',
    flexibilityScore: 5,
    days: [
      { day: 1, title: '高雄 → 曼谷 → Trang', detail: '可飛 Trang（TST）省去陸路折騰。抵達後住 Trang 市區。', transport: '航空＋接駁', seaDay: false },
      { day: 2, title: 'Trang 市區・老城・小販市場', detail: '中式葡萄牙風格老城、海鮮與小販市場，調整時差與體力。', transport: '步行', costTHB: 400, seaDay: false },
      {
        day: 3,
        title: 'Koh Mook 翡翠洞',
        detail: '依潮汐安排時段的 80 公尺黑暗隧道。建議 10:00–12:00 進洞，光線最好。',
        transport: '船（Pak Meng 碼頭）',
        costTHB: 2200,
        parkFeeTHB: 200,
        seaDay: true,
      },
      { day: 4, title: 'Koh Kradan 沙灘日', detail: 'Trang 群島最白的沙灘之一，浮潛與放鬆。', transport: '長尾船', costTHB: 1500, seaDay: true },
      { day: 5, title: '備用日／加值日', detail: '若前幾日順利，可加訂 Koh Libong 尋海牛或 Ko Kho 水洞；此日亦作為變數緩衝。', transport: '船', costTHB: 1500, isBuffer: true, seaDay: true },
      { day: 6, title: 'Huai Yot 水洞（雨備首選）', detail: 'Trang 著名的水洞行程，全天候可行，適合作為下雨時的替代。', transport: '船', costTHB: 1800, seaDay: true },
      { day: 7, title: '返高雄', detail: '自 Trang（TST）返程。', transport: '航空', seaDay: false },
    ],
    estimateTHB: { min: 10000, max: 12500, note: '前季參考，不含機票。' },
    sources: [
      { label: '翡翠洞造訪指南', url: 'https://thailandknowhow.com/emerald-cave-koh-mook-how-to-visit-tham-morakot' },
      { label: 'Trang 四日行程（含 Huai Yot）', url: 'https://thailandaddict.com/en/trang-krabi-plan' },
    ],
  },
];

/** 4 月窗口的比較軸（新增「秘境可達性」與「Similan 季節」） */
export const APRIL_COMPARE_AXES = [
  { key: 'snorkel', label: '浮潛點數', betterWhen: 'high', hint: '整趟可下水的點位總數' },
  { key: 'seaDays', label: '海上天數', betterWhen: 'high', hint: '實際出海的天數（不含雨備日）' },
  { key: 'risk', label: '4 月風險', betterWhen: 'low', hint: '乾季尾的整體穩定度（不同於 5 月版）' },
  { key: 'flexibility', label: '船取消後可替代性', betterWhen: 'high', hint: '停駛時能否就地改行程' },
  { key: 'cost', label: '前季團費', betterWhen: 'low', hint: '不含機票，每人前季參考區間' },
];

/** 4 月版的應變對照（乾季：重點在潮汐與高溫，而非風浪） */
export const APRIL_CONTINGENCY = [
  {
    id: 'tide',
    situation: '翡翠洞潮汐不合（滿潮進不去）',
    action: '翡翠洞只在低潮至中潮開放，滿潮時隧道太低會淹。須在訂行程前確認當日潮汐表，讓嚮導調整順序或改日再訪。不要硬闖。',
  },
  {
    id: 'swim',
    situation: '成員不會游泳或怕水',
    action: '翡翠洞 80 公尺黑暗隧道必須會游泳。怕水者不建議；可改為岸邊等候，或選 4 月的 C／E 案以岸潛為主。',
  },
  {
    id: 'heat',
    situation: '正午高溫過高（El Niño 加劇）',
    action: '把浮潛排在早晚，正午安排午餐或休息。補水每人每日 3L、SPF50 與物理遮陽。熱指數可能極高，須主動降溫。',
  },
  {
    id: 'thunder',
    situation: '午後雷雨（4 月熱帶對流季）',
    action: '午後雷雨仍可能。出海前查當日預報與船公司公告；Trang 的 Huai Yot 水洞是全天候的備案。',
  },
  {
    id: 'similan-close',
    situation: 'Similan 臨時關閉或船班取消',
    action: '4 月雖在季內但風浪大仍會停駛。備案改 Koh Rok（能見度同級、人更少）或近岸四島。',
  },
  {
    id: 'injury',
    situation: '浮潛受傷或礁石割傷',
    action: '以清水沖洗並覆蓋傷口；泰國撥打 1669（醫療）或 191（警察）；保險理賠須保留就診單據。',
  },
];
