/**
 * Trave_Dec — 三個額外方案（放寬至 9 天 ＋ 雙點進出）
 *
 * 為什麼需要這三案：原六案全部鎖死在 7 天，導致一個真實的取捨無解——
 * Similan 船程 1.5–2 小時、翡翠洞需陸路南下 2–3 小時，兩者加上蘭塔，
 * 7 天塞不下就必然要放棄其中一項。「全海域六區」因此變成每天搬行李。
 *
 * 放寬兩個前提即可同時吃到能見度與秘境：
 *   1. 天數 7 → 9：多出的兩天是船程與緩衝，不是多排景點
 *   2. 雙點進出（open-jaw）：高雄→曼谷→甲米（KBV）進，回程從 Trang（TST）出
 *      —— 這讓「南下 Trang」不再是去回折返，而是順路的出口
 *
 * 代價誠實說明：多 2 天＝多 2 晚住宿與餐費；雙點進出通常不便宜（open-jaw 票價），
 * 且行李需在 Trang 重新整理。費用區間已含這些影響。
 *
 * 所有費用為 2026 前季參考，不含機票。2027 年 4 月實際價格須重新確認。
 */

import { THB_TO_TWD_ASSUMED } from './krabi.js';

export { THB_TO_TWD_ASSUMED };

export const V3_EXTRA_PLAN_COUNT = 3;

/** 放寬前提的說明（顯示於 UI，避免使用者以為只是把 7 案拉長） */
export const V3_PREMISE = {
  days: {
    from: 7,
    to: 9,
    why:
      '多出的兩天不是多排景點，而是給船程與緩衝。Similan 單程 1.5–2 小時、' +
      'Trang 陸路 2–3 小時，這些時間在 7 天裡會被壓縮成趕路。',
  },
  openJaw: {
    why:
      '雙點進出讓「南下 Trang」從折返變成出口。若回程仍從甲米飛，' +
      'Trang 就是去回各一趟；改由 TST 出發後，路線本身就是順的。',
    cost:
      'open-jaw 機票通常較同日往返貴，且行李需在 Trang 重新整理。實際價差須在訂票時比較。',
  },
};

export const KRABI_PLANS_V3 = [
  {
    id: 'v3-1',
    tag: '7',
    name: '九日・能見度與秘境兼得',
    positioning:
      '放寬到 9 天後，Similan 的能見度與翡翠洞的秘境不必二選一。' +
      '這是七案在 7 天內做不到的組合。',
    base: 'Ao Nang 3 晚 → Koh Lanta 2 晚 → Trang 2 晚',
    window: '2027-04-06 – 04-14（9 天）',
    windowRationale:
      '需要 9 天才能容納 Similan（船程 1.5–2h）、蘭塔渡輪（1.5–2h）與 Trang 陸路（2–3h）' +
      '三段移動，且每段之間至少留半天緩衝。7 天版本必須犧牲其中一項。',
    entryPoint: 'KBV（甲米）',
    exitPoint: 'TST（Trang）',
    marineAreas: ['local-islands', 'similan', 'koh-lanta', 'trang'],
    snorkelStops: 18,
    riskLevel: 'mid',
    riskNote: '天數較長，受天氣變數影響的日數增加',
    suits: '想一次吃到安達曼海能見度最高處與最秘境，不想被迫二選一',
    highlight:
      '這是唯一同時包含 Similan（能見度 20–40m）、Koh Rok、Koh Haa 與翡翠洞的方案。' +
      '回程從 TST 出發，省下折返。',
    flexibilityLabel: '高',
    days: [
      { day: 1, title: '高雄 → 曼谷 → 甲米（KBV）', detail: '抵達後住 Ao Nang，隔天不必趕船。', transport: '航空＋接駁', seaDay: false },
      { day: 2, title: '近岸低島群（包半日）', detail: 'Koh Yawabon（人最少、最長 swim-through）＋ Koh Kai。適應水溫與裝備。', transport: '包船（半日）', costTHB: 3000, parkFeeTHB: 400, seaDay: true },
      { day: 3, title: 'Similan（早鳥出發）', detail: 'Thap Lamu 碼頭，Koh Ba Ngu、Sail Rock。安達曼海能見度頂點。', transport: '快艇', costTHB: 4500, parkFeeTHB: 500, seaDay: true },
      { day: 4, title: '緩衝日・Koh Tub 沙洲或 Ao Nang 岸潛', detail: '為兩天後的移動預留緩衝；若前幾日順利可加訂 Similan 第二次。', transport: '船', costTHB: 1500, isBuffer: true, seaDay: true },
      { day: 5, title: '渡輪至 Koh Lanta', detail: 'Ao Nang → 蘭塔渡輪（4 月有班）。入住後 Long Beach 看日落。', transport: '渡輪', costTHB: 700, seaDay: true },
      { day: 6, title: 'Koh Haa ＋ Koh Bida', detail: '教練推薦的自由潛水點，海況極安全。住島上可反覆下水。', transport: '包船', costTHB: 3000, parkFeeTHB: 400, seaDay: true },
      { day: 7, title: 'Koh Rok', detail: 'Rok Noi／Rok Yai 間水道能見度可達 30m，人潮只有 Similan 一半。', transport: '包船', costTHB: 3000, parkFeeTHB: 400, seaDay: true },
      { day: 8, title: '蘭塔 → 陸路南下 Trang → 翡翠洞', detail: '車程 2–3 小時至 Pak Meng 碼頭，依潮汐安排進洞時段。', transport: '渡輪＋陸路＋船', costTHB: 3800, parkFeeTHB: 200, seaDay: true },
      { day: 9, title: 'Koh Kradan 沙灘 → Trang（TST）・返高雄', detail: '上午白沙灘，午後機場。行李在 Trang 重新整理。', transport: '長尾船＋航空', costTHB: 2000, seaDay: true },
    ],
    estimateTHB: { min: 15500, max: 19000, note: '前季參考，不含機票；含多 2 晚住宿、Trang 段住宿與全部船資。4 人分攤。open-jaw 機票另計。' },
    sources: [
      { label: 'Similan 季節與能見度', url: 'https://thailandaddict.com/en/similan-islands-guide' },
      { label: '翡翠洞潮汐與安全', url: 'https://thailandknowhow.com/emerald-cave-koh-mook-how-to-visit-tham-morakot' },
    ],
  },

  {
    id: 'v3-2',
    tag: '8',
    name: '九日・蘭塔駐紮反覆練習',
    positioning:
      '住蘭塔 5 晚，不趕船。這是唯一能真正練到自由潛水進步的安排——' +
      '反覆下水是進步的唯一關鍵，一天去三個點等於沒去。',
    base: 'Ao Nang 1 晚 → Koh Lanta 5 晚 → Trang 1 晚',
    window: '2027-04-06 – 04-14（9 天）',
    windowRationale:
      '住 5 晚才能有 4 個完整出海日。以 7 天版本住 3 晚，扣掉移動日只剩 2 天，' +
      '不足以建立節奏。自由潛水的進步來自重複，不是從點數。',
    entryPoint: 'KBV（甲米）',
    exitPoint: 'TST（Trang）',
    marineAreas: ['koh-lanta', 'similan', 'trang'],
    snorkelStops: 16,
    riskLevel: 'low',
    riskNote: '單一基地、移動少，變數最低',
    suits: '想認真練自由潛水；或成員中有需要重複進出同一片水域的人',
    highlight:
      '可搭配 Phoenix Divers 的自由潛水導潛日（฿3,000／2 潛，同時段上限 2 人）' +
      '或完整認證課程。住 5 晚能安排 2 天導潛 ＋ 2 天自主練習。',
    flexibilityLabel: '高',
    days: [
      { day: 1, title: '高雄 → 曼谷 → 甲米（KBV）', detail: '住 Ao Nang 一晚，隔天渡輪不用趕。', transport: '航空＋接駁', seaDay: false },
      { day: 2, title: '渡輪至 Koh Lanta', detail: '入住後 Long Beach 看日落，調整體力。', transport: '渡輪', costTHB: 700, seaDay: true },
      { day: 3, title: 'Koh Haa 五島群', detail: '平靜潟湖，初學友善。教練列為最佳自由潛水點。', transport: '包船', costTHB: 2500, parkFeeTHB: 400, seaDay: true },
      { day: 4, title: 'Koh Bida ＋ 岸潛練習', detail: 'Bida 是另一教練推薦點；可安排有教練的練習或自主反覆潛。', transport: '包船', costTHB: 2500, parkFeeTHB: 400, seaDay: true },
      { day: 5, title: 'Similan（自蘭塔出發）', detail: '能見度頂點。若當日風浪大，蘭塔業者會改排近岸。', transport: '快艇', costTHB: 4500, parkFeeTHB: 500, seaDay: true },
      { day: 6, title: 'Koh Rok ＋ 重複練習日', detail: '上午 Koh Rok，午後回同一片礁反覆潛——這才是進步的來源。', transport: '包船', costTHB: 3000, parkFeeTHB: 400, seaDay: true },
      { day: 7, title: '彈性日・依海況決定', detail: '天氣好則加訂 Koh Ma 或 Ao Mai pai；不好則島上休息。這是住 5 晚才有的緩衝。', transport: '船', costTHB: 1500, isBuffer: true, seaDay: true },
      { day: 8, title: '蘭塔 → 陸路南下 Trang → 翡翠洞', detail: '車程 2–3 小時，依潮汐安排進洞。', transport: '渡輪＋陸路＋船', costTHB: 3800, parkFeeTHB: 200, seaDay: true },
      { day: 9, title: 'Trang（TST）・返高雄', detail: '上午 Trang 老城採買，午後機場。', transport: '航空', seaDay: false },
    ],
    estimateTHB: { min: 15000, max: 18500, note: '前季參考，不含機票、不含自由潛水課程或導潛。4 人分攤。open-jaw 機票另計。' },
    sources: [
      { label: '蘭塔自由潛水點與導潛', url: 'https://phoenixdivers-kohlanta.com/freediving-koh-lanta/' },
      { label: '蘭塔包船價目（2–4 人整團制）', url: 'https://kohlantalongtailboattours.com/private-boat-tours/' },
    ],
  },

  {
    id: 'v3-3',
    tag: '9',
    name: '九日・全海域慢慢走',
    positioning:
      '涵蓋六案的所有海洋區，但每個區都住夠、玩夠。7 天的「全海域」是每天搬行李；' +
      '這版是每個區至少兩天。',
    base: 'Ao Nang 2 晚 → Koh Lanta 3 晚 → Trang 2 晚',
    window: '2027-04-06 – 04-14（9 天）',
    windowRationale:
      '六個海域在 7 天可行，但每個海域只能停半天，等於走馬看花。' +
      '放寬到 9 天並把 Phi Phi 與 Hong 各自給一天，才算真的「看過」。',
    entryPoint: 'KBV（甲米）',
    exitPoint: 'TST（Trang）',
    marineAreas: ['local-islands', 'phi-phi', 'hong', 'similan', 'koh-lanta', 'trang'],
    snorkelStops: 20,
    riskLevel: 'mid',
    riskNote: '涵蓋 6 個公園，法規確認項最多；移動次數仍是本組最多',
    suits: '想「這趟把甲米看完」，且能接受相對高的費用與移動次數',
    highlight:
      '這是全海域方案的正確版本：涵蓋 5 個海洋區（Surin 仍排除），' +
      '但 Phi Phi 與 Hong 各給完整一天，不用趕。',
    flexibilityLabel: '中',
    days: [
      { day: 1, title: '高雄 → 曼谷 → 甲米（KBV）', detail: '住 Ao Nang。', transport: '航空＋接駁', seaDay: false },
      { day: 2, title: '近岸低島群（包半日）', detail: 'Koh Yawabon ＋ Koh Kai，人最少的點位先去。', transport: '包船（半日）', costTHB: 3000, parkFeeTHB: 400, seaDay: true },
      { day: 3, title: 'Phi Phi 群島（完整一日）', detail: '瑪雅灣、Pileh Lagoon、Phi Phi Don。快艇 45 分鐘，不用趕。', transport: '快艇', costTHB: 4500, parkFeeTHB: 400, seaDay: true },
      { day: 4, title: 'Hong 群島（完整一日）', detail: '007 島環礁、女王洞、紅樹林獨木舟。', transport: '大型快艇', costTHB: 4000, parkFeeTHB: 300, seaDay: true },
      { day: 5, title: 'Similan（早鳥）', detail: 'Thap Lamu 碼頭。能見度頂點。', transport: '快艇', costTHB: 4500, parkFeeTHB: 500, seaDay: true },
      { day: 6, title: '渡輪至 Koh Lanta', detail: '入住後 Long Beach 看日落。', transport: '渡輪', costTHB: 700, seaDay: true },
      { day: 7, title: 'Koh Haa ＋ Koh Rok', detail: '兩個蘭塔代表點分上下午，時間充裕。', transport: '包船', costTHB: 3500, parkFeeTHB: 800, isBuffer: true, seaDay: true },
      { day: 8, title: '蘭塔 → 陸路南下 Trang → 翡翠洞', detail: '車程 2–3 小時，依潮汐安排進洞。', transport: '渡輪＋陸路＋船', costTHB: 3800, parkFeeTHB: 200, seaDay: true },
      { day: 9, title: 'Koh Kradan → Trang（TST）・返高雄', detail: '上午白沙灘，午後機場。', transport: '長尾船＋航空', costTHB: 2000, seaDay: true },
    ],
    estimateTHB: { min: 18500, max: 22000, note: '前季參考，不含機票；本組最貴，因涵蓋最多公園且船票次數最多。4 人分攤。open-jaw 機票另計。' },
    sources: [
      { label: 'Phi Phi 公園與瑪雅灣規則', url: 'https://www.thainationalparks.com/hat-noppharat-thara-mu-ko-phi-phi-national-park' },
      { label: '翡翠洞潮汐與安全', url: 'https://thailandknowhow.com/emerald-cave-koh-mook-how-to-visit-tham-morakot' },
    ],
  },
];
