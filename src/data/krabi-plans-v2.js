/**
 * Trave_Dec — 六案重評（2027/04/06 – 04/12）
 *
 * 這是套用「2025 救生衣法規」與「自由潛水／包船可行性」之後的重新評估結果，
 * 取代原本分開的 5 月五案與 4 月五案。
 *
 * 為什麼 6 案都在 4 月：5 月有兩項結構性劣勢（蘭塔渡輪停駛、Similan 5/15 季末關閉），
 * 而 4 月兩項都不存在；加上 2026/27 El Niño 讓「怕雨」這個主要顧慮失去前提。
 *
 * 費用：前季參考（2026），不含機票。2027 年 4 月實際價格須重新確認。
 */

import { THB_TO_TWD_ASSUMED } from './krabi.js';

export { THB_TO_TWD_ASSUMED };

/** 甲米周邊可潛水域：分屬不同管理機關，各有船期、費率與季節限制 */
export const MARINE_AREAS = [
  {
    id: 'local-islands',
    name: 'Ao Nang 近岸低島群',
    zh: '甲米近岸低島群',
    authority: 'Hat Noppharat Thara–Mu Ko Phi Phi NP',
    distance: '視線內',
    boatTime: '30–45 分鐘',
    season: '全年',
    parkFee: 400,
    character: 'Koh Yawabon 最人少且有最長的 swim-through；Koh Kai、Koh Poda 為 12–13m 緩傾斜礁。',
    shallow: true,
  },
  {
    id: 'phi-phi',
    name: 'Phi Phi 群島',
    zh: 'Phi Phi 群島',
    authority: 'Hat Noppharat Thara–Mu Ko Phi Phi NP',
    distance: '35 km',
    boatTime: '45 分鐘（快艇）',
    season: '全年（瑪雅灣 8/1–9/30 例行關閉）',
    parkFee: 400,
    character: '瑪雅灣、Pileh Lagoon 為代表性地貌。遊客量高，但地點本身值得。',
    shallow: true,
  },
  {
    id: 'hong',
    name: 'Hong 群島',
    zh: 'Hong 群島',
    authority: 'Mu Ko Hong NP',
    distance: '—',
    boatTime: '約 2 小時',
    season: '全年',
    parkFee: 300,
    character: '007 島環礁、女王洞、紅樹林。2027 年是否有包船進入 007 島的限制待確認。',
    shallow: true,
  },
  {
    id: 'similan',
    name: 'Similan 群島',
    zh: 'Similan 斯米蘭',
    authority: 'Mu Ko Similan NP',
    distance: '60+ km',
    boatTime: '1.5–2 小時（快艇）',
    season: '僅 10/15 – 5/15',
    parkFee: 500,
    character:
      '安達曼海能見度最佳（20–40m）。珊瑚花園、海龜。4 月完全在季內，' +
      '是這趟最不可替代的點位之一。',
    shallow: false,
  },
  {
    id: 'koh-lanta',
    name: 'Koh Lanta 群島',
    zh: '蘭塔群島',
    authority: 'Mu Ko Lanta NP',
    distance: '30 km',
    boatTime: '渡輪 1.5–2 小時（4 月有班）',
    season: '全年',
    parkFee: 400,
    character:
      'Koh Haa 五島群與 Koh Bida 被教練列為最佳自由潛水點（海況極安全）；' +
      'Koh Rok 水道能見度可達 30m。4 月渡輪有班，5 月則停駛。',
    shallow: true,
  },
  {
    id: 'trang',
    name: 'Trang 群島（含翡翠洞）',
    zh: 'Trang 群島・翡翠洞',
    authority: 'Trang NP（南）',
    distance: '84–148 km',
    boatTime: '需陸路 2–3 小時至 Pak Meng 碼頭',
    season: '全年（翡翠洞受潮汐限制）',
    parkFee: 200,
    character:
      '翡翠洞為 80 公尺海蝕隧道通往私藏潟湖，遊覽船團不去。' +
      '同群島另有 Koh Kradan 白沙灘與尋海牛區。',
    shallow: true,
  },
];

/** 評估後排除的點位——說明為什麼不做，而不是默默消失 */
export const EXCLUDED_AREAS = [
  {
    id: 'surin',
    name: 'Koh Surin 群島',
    reason:
      '距陸地 60 km、需一小時以上快艇，且公園僅 11–4 月營運。雖在 4 月窗口內，' +
      '但船程與時間會吃掉整個行程，7 天塞不下。建議另作一趟而非併入。',
  },
  {
    id: 'hin-muang',
    name: 'Hin Daeng / Hin Muang',
    reason: '深 25–40 m，雖是世界級潛點但超出「15 m 內」條件，且自由潛水不適合。',
  },
  {
    id: 'koh-si-chang',
    name: 'Koh Si Chang',
    reason: '在泰國東岸羅勇府，與甲米／Trang 地理分離，需跨泰國內航班。',
  },
];

/** 六案重評：把四份研究套上同一組限制後的結果 */
export const KRABI_PLANS_V2 = [
  {
    id: 'v2-1',
    tag: '1',
    name: 'Similan 能見度優先',
    positioning:
      '把整趟壓在安達曼海能見度最好的地方。Similan 季內 + Koh Rok，7 天有 5 天出海。',
    base: 'Krabi Town／Ao Nang（不換基地）',
    window: '2027-04-06 – 04-12',
    marineAreas: ['local-islands', 'similan', 'koh-lanta', 'hong'],
    snorkelStops: 15,
    riskLevel: 'low',
    riskNote: '乾季尾，風浪小',
    suits: '把「水有多清」放在第一位、願意早起搭早鳥船',
    highlight:
      'Similan 珊瑚花園是安達曼海的能見度頂點（20–40m），4 月在季內。' +
      'Koh Rok 水道能見度同級但船只有 Similan 一半。',
    flexibilityLabel: '中',
    days: [
      { day: 1, title: '高雄 → 曼谷 → 甲米', detail: '抵達後住 Ao Nang。', transport: '航空＋接駁', costNote: '機票前季參考 TWD 10,700–14,600', seaDay: false },
      { day: 2, title: '近岸低島群浮潛（暖身）', detail: 'Koh Yawabon（人最少、有最長 swim-through）、Koh Kai、Tup 沙洲、萊利海灘登陸。', transport: '包船（半日）', costTHB: 3000, parkFeeTHB: 400, seaDay: true },
      { day: 3, title: 'Similan 一日（早鳥出發）', detail: 'Thap Lamu 碼頭搭早鳥快艇，Koh Ba Ngu（珊瑚與海龜）、Sail Rock。航程 1.5–2 小時，風浪大時停駛。', transport: '快艇', costTHB: 4500, parkFeeTHB: 500, costNote: '早鳥班較貴但海況較穩', seaDay: true },
      { day: 4, title: 'Koh Rok 浮潛', detail: 'Rok Noi／Rok Yai 間水道能見度可達 30m，硬珊瑚密度極高，人潮只有 Similan 一半。', transport: '快艇', costTHB: 3500, parkFeeTHB: 400, seaDay: true },
      { day: 5, title: 'Hong 群島＋007 島', detail: '紅樹林獨木舟、007 島環礁、女王洞。', transport: '大型快艇', costTHB: 4000, parkFeeTHB: 300, seaDay: true },
      { day: 6, title: '加值日／緩衝日', detail: '視前幾日海況：全晴則加訂 Koh Tub 沙洲；若有變數則此日吸收延誤。', transport: '船', costTHB: 1500, isBuffer: true, seaDay: true },
      { day: 7, title: '買場・Krabibot 機場・返高雄', detail: '甲米市區採買，搭機返高雄。', transport: '航空', seaDay: false },
    ],
    estimateTHB: { min: 10000, max: 12000, note: '前季參考，不含機票；含 Similan 較高的船票與公園費。4 人分攤。' },
    sources: [
      { label: 'Similan 能見度與季節', url: 'https://thailandaddict.com/en/similan-islands-guide' },
      { label: 'Koh Rok 與 Similan 能見度比較', url: 'https://www.siamdive.com/en/blogs/30-metres-clear-half-the-boats-koh-rok-vs-similans' },
    ],
  },

  {
    id: 'v2-2',
    tag: '2',
    name: 'Trang 秘境深度',
    positioning: '往南到 Trang 群島，避開甲米人潮，主打翡翠洞。節奏最慢，移動成本最高。',
    base: 'Krabi Town 1 晚 → 陸路南下 Trang 市區 3 晚',
    window: '2027-04-06 – 04-12',
    marineAreas: ['trang', 'koh-lanta'],
    snorkelStops: 11,
    riskLevel: 'mid',
    riskNote: '翡翠洞受潮汐限制，陸路移動 2–3 小時',
    suits: '想要「照片說不出感受」的體驗、願意為秘境移動',
    highlight:
      '翡翠洞 80 公尺黑暗隧道通往被峭壁環抱的私藏潟湖。' +
      '只在低潮至中潮開放，滿潮會淹；須會游泳。建議 10:00–12:00 進洞。',
    flexibilityLabel: '中',
    days: [
      { day: 1, title: '高雄 → 曼谷 → 甲米', detail: '抵達後住 Krabi Town。', transport: '航空＋接駁', seaDay: false },
      { day: 2, title: '陸路南下 Trang', detail: '84–148 km，minivan 便宜、私人包車較舒適，車程 2–3 小時。到 Trang 後逛老城與小販市場。', transport: '陸路', costTHB: 800, seaDay: false },
      { day: 3, title: 'Koh Mook 翡翠洞（Tham Morakot）', detail: '依潮汐時機游過 80 公尺全黑隧道，盡頭豁然開朗。洞內有莫拉鰻。須 dive light。', transport: '船（Pak Meng 碼頭）', costTHB: 2200, parkFeeTHB: 200, costNote: '須依潮汐安排時段', seaDay: true },
      { day: 4, title: 'Koh Kradan ＋ Koh Chueak ＋ Koh Ngai', detail: 'Trang 群島的白沙灘與浮潛點，人數遠少於 Koh Phi Phi。', transport: '長尾船', costTHB: 2000, seaDay: true },
      { day: 5, title: 'Koh Libong 尋海牛（半日）', detail: '野生動物保護區，淺海海草床是泰國最後仍可遇見海牛的地方之一。能見度僅 5–12m，適合看稀有生物而非看清水。', transport: '長尾船', costTHB: 1500, seaDay: true },
      { day: 6, title: '渡輪北上蘭塔・浮潛', detail: 'Trang → Koh Lanta 渡輪，抵達後浮潛。作為回程前的緩衝。', transport: '渡輪', costTHB: 700, isBuffer: true, seaDay: true },
      { day: 7, title: '蘭塔 → Krabibot・返高雄', detail: '蘭塔渡輪回甲米，或自 Trang（TST）返程。', transport: '渡輪＋航空', seaDay: false },
    ],
    estimateTHB: { min: 9000, max: 11000, note: '前季參考，不含機票；含 Trang 住宿與陸路接駁。4 人分攤。' },
    sources: [
      { label: '翡翠洞造訪指南（潮汐／安全）', url: 'https://thailandknowhow.com/emerald-cave-koh-mook-how-to-visit-tham-morakot' },
      { label: '翡翠洞潛點描述（深度與風險）', url: 'https://below.app/en-US/dive-sites/thailand/trang/emerald-cave' },
    ],
  },

  {
    id: 'v2-3',
    tag: '3',
    name: '蘭塔駐紮（可加自由潛水）',
    positioning:
      '住島上不必趕船，反覆下水是唯一能真正練到進步的方式。4 月渡輪有班，不需陸路折騰。',
    base: 'Koh Lanta Yai 3 晚（Ao Nang 渡輪 4 月有班）',
    window: '2027-04-06 – 04-12',
    marineAreas: ['koh-lanta', 'local-islands', 'similan'],
    snorkelStops: 12,
    riskLevel: 'low',
    riskNote: '渡輪有班，移動成本低',
    suits: '想住島上、把時間平均分配到三個不同海域；或想加自由潛水',
    highlight:
      '教練推薦 Koh Haa 與 Koh Bida 為蘭塔最佳自由潛水點（海況極安全）。' +
      'Phoenix Divers 有自由潛水導潛日 ฿3,000／2 潛，但同時段上限 2 人。',
    flexibilityLabel: '高',
    days: [
      { day: 1, title: '高雄 → 曼谷 → 甲米', detail: '抵達後住 Ao Nang，為隔天渡輪做準備。', transport: '航空＋接駁', seaDay: false },
      { day: 2, title: '渡輪直達 Koh Lanta', detail: 'Ao Nang → Koh Lanta 渡輪（4 月有班，1.5–2 小時）或快艇。入住後在 Long Beach 看日落。', transport: '渡輪／快艇', costTHB: 700, seaDay: true },
      { day: 3, title: 'Koh Haa 五島群＋Bamboo Bay', detail: '平靜潟湖，初學者友善。教練列為最佳自由潛水點之一。', transport: '包船', costTHB: 2500, parkFeeTHB: 400, seaDay: true },
      { day: 4, title: 'Koh Bida ＋ Koh Rok', detail: 'Bida 是另一個教練推薦的自由潛水點；Koh Rok 水道能見度可達 30m。', transport: '包船', costTHB: 3000, parkFeeTHB: 400, seaDay: true },
      { day: 5, title: 'Similan 或島上慢遊', detail: '若想衝 Similan 可從蘭塔安排一日；否則安排 Ao Mai pai 岸潛與慢遊。', transport: '快艇／步行', costTHB: 2500, seaDay: true },
      { day: 6, title: '緩衝日・回 Ao Nang', detail: '渡輪返回 Ao Nang 作為回程前緩衝，或加訂近岸浮潛。', transport: '渡輪', costTHB: 700, isBuffer: true, seaDay: true },
      { day: 7, title: '買場・機場・返高雄', detail: 'Ao Nang 或甲米市區採買，搭機返高雄。', transport: '航空', seaDay: false },
    ],
    estimateTHB: { min: 9500, max: 11500, note: '前季參考，不含機票、不含自由潛水課程或導潛。4 人分攤。' },
    sources: [
      { label: '蘭塔自由潛水點與導潛', url: 'https://phoenixdivers-kohlanta.com/freediving-koh-lanta/' },
      { label: '蘭塔包船價目（含 2–4 人整團制）', url: 'https://kohlantalongtailboattours.com/private-boat-tours/' },
    ],
  },

  {
    id: 'v2-4',
    tag: '4',
    name: '全海域六區',
    positioning:
      '7 天走完甲米周邊六個不同管理機關的海洋區。涵蓋最廣，代價是每天都在移動。',
    base: 'Ao Nang 為主 ＋ 蘭塔 1 晚',
    window: '2027-04-06 – 04-12',
    marineAreas: ['local-islands', 'phi-phi', 'hong', 'similan', 'koh-lanta'],
    snorkelStops: 14,
    riskLevel: 'mid',
    riskNote: '行程緊湊，緩衝空間少',
    suits: '想「這趟把甲米看完」的人',
    highlight:
      '涵蓋 5 個海洋區。Surin 已排除（距陸地 60km、需一小時以上快艇、僅 11–4 月營運）。' +
      '6 次移動中有 1 次渡輪、1 次陸路，是本組體力負擔最高的方案。',
    flexibilityLabel: '低',
    days: [
      { day: 1, title: '高雄 → 曼谷 → 甲米', detail: '抵達後住 Ao Nang。', transport: '航空＋接駁', seaDay: false },
      { day: 2, title: '近岸低島群', detail: 'Koh Yawabon ＋ Koh Kai，包半日。', transport: '包船（半日）', costTHB: 3000, parkFeeTHB: 400, seaDay: true },
      { day: 3, title: 'Phi Phi 群島', detail: '瑪雅灣、Pileh Lagoon、Phi Phi Don。', transport: '快艇', costTHB: 4500, parkFeeTHB: 400, seaDay: true },
      { day: 4, title: 'Hong 群島', detail: '007 島環礁、女王洞、紅樹林獨木舟。', transport: '大型快艇', costTHB: 4000, parkFeeTHB: 300, seaDay: true },
      { day: 5, title: 'Similan', detail: 'Thap Lamu 碼頭早鳥快艇。', transport: '快艇', costTHB: 4500, parkFeeTHB: 500, seaDay: true },
      { day: 6, title: '渡輪至 Koh Lanta 浮潛', detail: '渡輪至蘭塔後浮潛，晚間返回 Ao Nang。', transport: '渡輪', costTHB: 700, parkFeeTHB: 400, isBuffer: true, seaDay: true },
      { day: 7, title: '買場・機場・返高雄', detail: '採買後搭機返高雄。', transport: '航空', seaDay: false },
    ],
    estimateTHB: { min: 12000, max: 15000, note: '前季參考，不含機票；本組最貴，因船票次數最多。4 人分攤。' },
    sources: [
      { label: '甲米國家公園與周邊海洋區', url: 'https://www.thainationalparks.com/hat-noppharat-thara-mu-ko-phi-phi-national-park' },
      { label: 'Fast Manta 甲米價格表（船票基準）', url: 'https://fastmanta.com/pricing' },
    ],
  },

  {
    id: 'v2-5',
    tag: '5',
    name: '三區精華（推薦）',
    positioning:
      '放棄「很多人也能玩得不錯」的點，專注兩個不可替代的：Similan 的能見度與翡翠洞的秘境。',
    base: 'Ao Nang 3 晚 → 陸路南下 Trang 2 晚',
    window: '2027-04-06 – 04-12',
    marineAreas: ['local-islands', 'similan', 'trang'],
    snorkelStops: 14,
    riskLevel: 'mid',
    riskNote: '1 次陸路移動，翡翠洞受潮汐限制',
    suits: '想潛得深、看得清、又不趕路的人',
    highlight:
      '同時滿足能見度最高（Similan）、秘境最獨特（翡翠洞）、不趕路（只有 1 次陸路）。' +
      '放棄 Phi Phi 與 Hong 是刻意取捨——那兩個是「很多人也能玩得不錯」的點。',
    flexibilityLabel: '高',
    days: [
      { day: 1, title: '高雄 → 曼谷 → 甲米', detail: '抵達後住 Ao Nang。', transport: '航空＋接駁', seaDay: false },
      { day: 2, title: 'Koh Yawabon ＋ Koh Kai（包半日）', detail: '人最少的低島群，有最長的 swim-through。', transport: '包船（半日）', costTHB: 3000, parkFeeTHB: 400, seaDay: true },
      { day: 3, title: '四島共乘一日', detail: 'Koh Kai、Tup 沙洲、萊利海灘登陸。含午餐。', transport: '長尾船（共乘）', costTHB: 1500, parkFeeTHB: 400, seaDay: true },
      { day: 4, title: 'Similan 一日（早鳥）', detail: 'Thap Lamu 碼頭，Koh Ba Ngu、Sail Rock。安達曼海能見度最佳。', transport: '快艇', costTHB: 4500, parkFeeTHB: 500, seaDay: true },
      { day: 5, title: '陸路南下 Trang → 翡翠洞', detail: '車程 2–3 小時至 Pak Meng 碼頭，依潮汐安排 10:00–12:00 進洞。', transport: '陸路＋船', costTHB: 3000, parkFeeTHB: 200, seaDay: true },
      { day: 6, title: 'Koh Kradan 白沙灘（或回程緩衝）', detail: 'Trang 群島最白的沙灘之一；亦可作為彈性緩衝日。', transport: '長尾船', costTHB: 2000, isBuffer: true, seaDay: true },
      { day: 7, title: 'Trang（TST）或 Krabibot・返高雄', detail: '依回程航班選擇 Trang 或甲米機場。', transport: '航空', seaDay: false },
    ],
    estimateTHB: { min: 9500, max: 12000, note: '前季參考，不含機票；含一次陸路與 Trang 住宿。4 人分攤。' },
    sources: [
      { label: 'Similan 能見度與季節', url: 'https://thailandaddict.com/en/similan-islands-guide' },
      { label: '翡翠洞造訪指南（潮汐／安全）', url: 'https://thailandknowhow.com/emerald-cave-koh-mook-how-to-visit-tham-morakot' },
    ],
  },

  {
    id: 'v2-6',
    tag: '6',
    name: '翡翠洞專注・零移動',
    positioning:
      '直飛 Trang、住市區不搬運，把節奏放到最慢。最省錢也最不累，但只涵蓋一個海域。',
    base: 'Trang 市區 4 晚（全程不換住宿）',
    window: '2027-04-06 – 04-12',
    marineAreas: ['trang'],
    snorkelStops: 8,
    riskLevel: 'low',
    riskNote: '出海天數少，變數小',
    suits: '不想每天趕船；或成員中有怕水、長輩同行',
    highlight:
      'Huai Yot 水洞全天候可行，是 4 月偶發雷雨時的完美備案。' +
      '零移動是本組唯一完全不需要渡輪或陸路轉移的方案。',
    flexibilityLabel: '高',
    days: [
      { day: 1, title: '高雄 → 曼谷 → Trang（TST）', detail: '直飛 Trang 省會，省去陸路折騰。抵達後住市區。', transport: '航空＋接駁', seaDay: false },
      { day: 2, title: 'Trang 老城・小販市場', detail: '中式葡萄牙風格老城、海鮮與小販市場，調整時差與體力。', transport: '步行', costTHB: 400, seaDay: false },
      { day: 3, title: 'Koh Mook 翡翠洞', detail: '依潮汐安排時段的 80 公尺黑暗隧道。建議 10:00–12:00，光線最好。', transport: '船（Pak Meng 碼頭）', costTHB: 2200, parkFeeTHB: 200, seaDay: true },
      { day: 4, title: 'Koh Kradan 沙灘日', detail: 'Trang 群島最白的沙灘之一，浮潛與放鬆。', transport: '長尾船', costTHB: 1500, seaDay: true },
      { day: 5, title: '備用日／加值日', detail: '前幾日順利則加訂 Koh Libong 尋海牛；此日亦作為變數緩衝。', transport: '船', costTHB: 1500, isBuffer: true, seaDay: true },
      { day: 6, title: 'Huai Yot 水洞（全天候雨備）', detail: 'Trang 著名的水洞行程，全天候可行，適合作為下雨時的替代。', transport: '船', costTHB: 1800, seaDay: true },
      { day: 7, title: 'Trang（TST）・返高雄', detail: '市區採買後搭機返高雄。', transport: '航空', seaDay: false },
    ],
    estimateTHB: { min: 8500, max: 10500, note: '前季參考，不含機票；本組最省，因全程住同一地點。4 人分攤。' },
    sources: [
      { label: 'Trang 四日行程（含 Huai Yot）', url: 'https://thailandaddict.com/en/trang-krabi-plan' },
      { label: '翡翠洞造訪指南', url: 'https://thailandknowhow.com/emerald-cave-koh-mook-how-to-visit-tham-morakot' },
    ],
  },
];

/** 六案比較軸（1–5，5 最好） */
export const SIX_PLAN_AXES = [
  { key: 'marineAreas', label: '涵蓋海域數', betterWhen: 'high', hint: '走過幾個不同管理機關的海洋區' },
  { key: 'seaDays', label: '海上天數', betterWhen: 'high', hint: '實際出海的天數（不含緩衝日）' },
  { key: 'visibility', label: '能見度機會', betterWhen: 'high', hint: '清水體驗的潛力（Similan 與 Koh Rok 加分）' },
  { key: 'secrecy', label: '人少程度', betterWhen: 'high', hint: '秘境優先，團客多的點位扣分' },
  { key: 'effort', label: '體力友善', betterWhen: 'high', hint: '5 = 零移動從容；1 = 每天趕船' },
  { key: 'legalEase', label: '法規輕鬆度', betterWhen: 'high', hint: '涵蓋公園越多、需確認的額外規定越多' },
  { key: 'freedive', label: '自由潛水可行性', betterWhen: 'high', hint: '住島上能反覆練習者最佳' },
  { key: 'cost', label: '成本效率', betterWhen: 'high', hint: '4 人分攤每人花費，5 = 最省' },
];

/** 2025 法規與各案的相容性註記（供 UI 顯示） */
export const PLAN_LEGAL_NOTES = {
  'v2-1': 'Similan 屬國家公園，園區可能有額外深度與人數限制，須行前確認。',
  'v2-2': 'Trang NP 可能有額外要求；翡翠洞須 dive light 且受潮汐限制。',
  'v2-3': '住島上反覆下水時仍須每次確認公園規定；蘭塔包船業者已含旅行意外險。',
  'v2-4': '涵蓋 5 個公園，須確認 5 套不同的額外規定——本組法規負擔最高。',
  'v2-5': '涵蓋 3 個公園；Similan 與 Trang 兩處須行前確認。',
  'v2-6': '單一公園、單一基地，法規面最單純。',
};
