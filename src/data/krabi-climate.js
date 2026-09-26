/**
 * Trave_Dec — 2026/27 ENSO（El Niño／Southern Oscillation）衝擊評估
 *
 * 為什麼有這一份：2027 年 4–5 月的甲米行程，成敗很大程度取決於 ENSO 當時的狀態，
 * 而 2026/09 正是「超級 El Niño」成形期。本檔把官方預警與其對跳島行程的
 * 實際意義分開陳述——統計傾向不等於特定日期的預報，這個界線必須對讀者誠實。
 *
 * 資料來源（研究於 2026-09-26）：
 *  - NOAA CPC ENSO Diagnostic Discussion（2026-09-10 發布）
 *  - 泰國氣象局（TMD）聲明，經 Bangkok Post／The Phuket News 報導
 *  - 安達曼海季節性資料
 */

/** El Niño 強度分級（用於 UI 的視覺標示） */
export const ENSO_PHASE = {
  strong: { id: 'strong', label: '強 El Niño', tone: 'danger' },
  moderate: { id: 'moderate', label: '中度 El Niño', tone: 'warn' },
  neutral: { id: 'neutral', label: 'ENSO 中性', tone: 'good' },
};

/**
 * NOAA CPC ENSO 診斷要點（2026-09-10）
 */
export const ENSO_CURRENT = {
  phase: 'strong',
  issuedDate: '2026-09-10',
  issuedBy: 'NOAA Climate Prediction Center',
  nino34AnomalyC: 1.8,
  eastPacificAnomalyC: 3.0,
  summary:
    'El Niño 正在增強，2026 年 9 月至 2027 年 1 月有超過 90% 機率出現「very strong」事件。',
  // 官方預估的時程階段
  timeline: [
    { period: '2026/09 – 2027/01', label: '強 El Niño 峰值期', note: ' Niño-3.4 距平最高，>90% 機率 very strong' },
    { period: '2026/10 – 2026/12', label: '可能為 1950 年以來最強', note: '泰國氣象局引述 NOAA 預估' },
    { period: '2027/01 – 2027/03', label: '逐漸減弱', note: '轉為溫和 El Niño' },
    { period: '2027/03 – 2027/05', label: '持續至初春', note: 'CPC 預估 El Niño 延續至此' },
    { period: '2027/04 – 2027/06', label: '55% 機率轉 ENSO 中性', note: 'CPC 官方機率' },
  ],
  source: 'https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc.shtml',
};

/**
 * 泰國氣象局（TMD）警告要點
 */
export const TMD_WARNINGS = {
  sourceLabel: '泰國氣象局（TMD）聲明',
  sourceUrl: 'https://www.bangkokpost.com/learning/easy/3295740/super-el-ni%C3%B1o-to-hit-thailand-next-year',
  issuedNote: '經 Bangkok Post 與 The Phuket News 報導',
  items: [
    {
      id: 'rainfall',
      label: '降雨偏少',
      value: '至少減少 10%',
      detail: '全國累積雨量目前已低於平均 10%。全國水資源廳警告本次乾旱可能比 2015 年更嚴重。',
      tone: 'warn',
    },
    {
      id: 'temperature',
      label: '氣溫上升',
      value: '2027 年 4 月升 1.5–2.5°C',
      detail: '曼谷平均可達 39–41°C，熱指數 50–54°C，有中暑風險。3–4 月可能出現強烈熱浪。',
      tone: 'danger',
    },
    {
      id: 'monsoon',
      label: '西南季風可能偏弱',
      value: '風浪或小於預期',
      detail: '對跳島是雙刃：船班較不易取消，但高溫與曝曬成為新的主要風險。',
      tone: 'warn',
    },
    {
      id: 'economic',
      label: '農業損失估計',
      value: 'THB 62 億（0.31% GDP）',
      detail: '影響稻米、甘蔗與木薯產量。與旅客行程無直接關係，但反映事件嚴重程度。',
      tone: 'info',
    },
  ],
};

/**
 * 對「跳島浮潛」這件事，El Niño 的雙面影響。
 * 這是本檔最重要的部分：方向與直覺相反。
 */
export const ENSO_IMPACT_ANALYSIS = {
  headline: '方向與直覺相反：雨可能更少，風險從「雨」轉為「熱」',
  effects: [
    {
      id: 'sea',
      aspect: '海況與船班',
      direction: 'favourable',
      verdict: '可能優於預期',
      detail:
        'El Niño 使西南季風偏弱，風浪或比一般雨季小，出船與船班取消的風險可能下降。' +
        '原本「5 月雨季太危險」的擔憂，方向上可能是錯的。',
    },
    {
      id: 'heat',
      aspect: '高溫與曝曬',
      direction: 'adverse',
      verdict: '確定惡化',
      detail:
        '2027 年 4 月氣溫預估升 1.5–2.5°C。正午 11:00–15:00 的岸上活動與浮潛曝曬都會更難耐，' +
        '中暑與曬傷風險顯著上升。',
    },
    {
      id: 'visibility',
      aspect: '能見度',
      direction: 'unclear',
      verdict: '變數最大',
      detail:
        '降雨減少通常利於水質與能見度，但超級 El Niño 可能伴隨區域性大氣異常，' +
        '仍須以出發前實測為準。此項無法事前斷言。',
    },
    {
      id: 'rain',
      aspect: '降雨本身',
      direction: 'favourable',
      verdict: '偏少',
      detail: '降雨量低於平均，「雨天泡掉整趟行程」的機率下降。但午後雷雨在熱帶對流季仍可能發生。',
    },
  ],
  caveats: [
    'ONI 與泰國降雨的關聯是統計傾向，不是 2027 年 4–5 月的定量預報。',
    'TMD 對 4 月高溫有明確數字，但 5 月的降雨與海況仍無官方定量預測。',
    '上述判斷須於 2027 年 3 月以實測資料重新查證，不可作為既定事實。',
  ],
};

/**
 * 三個候選日期窗口的並列比較。
 * rating 為 1–5 星，由輔助函式依各欄位計算，避免手寫星等與內容不一致。
 */
export const DATE_WINDOWS = [
  {
    id: 'apr-early',
    label: '4/6 – 4/12',
    fullLabel: '2027-04-06 – 04-12',
    tagline: '乾季末段・Similan 季內・避開宋干',
    recommended: true,
    seaStability: 5,
    similanStatus: 'in-season',
    songkranImpact: 'none',
    crowdLevel: 2,
    priceLevel: 2,
    heatLevel: 3,
    rainRisk: 1,
    secretIslands: 5,
    notes: [
      '仍屬乾季（11–4 月），海面平穩、能見度 15–25m。',
      'Similan 季內（10/15–5/15），能見度最佳的選擇成立。',
      '宋干節為 4/13–4/15，本窗口完全避開。',
      '奧南→蘭塔渡輪此時仍有班，C 案不必陸路折騰。',
      '4 月上旬尚未進入 4 月底的極熱高峰。',
    ],
    sourceNote: '宋干節 2027 日期為推估，須以官方公告為準。',
  },
  {
    id: 'apr-late',
    label: '4/20 – 4/26',
    fullLabel: '2027-04-20 – 04-26',
    tagline: '宋干節後・Similan 季內・但最熱',
    recommended: false,
    seaStability: 4,
    similanStatus: 'in-season',
    songkranImpact: 'residual',
    crowdLevel: 3,
    priceLevel: 3,
    heatLevel: 5,
    rainRisk: 2,
    secretIslands: 4,
    notes: [
      '海況仍穩，Similan 季內。',
      '緊接宋干節之後，人潮退去中但住宿價格尚未完全回落。',
      '4 月下旬是 El Niño 下最熱的時段，體感可能逼近 40°C。',
      '需把浮潛排在早晚，正午安排休息。',
    ],
    sourceNote: '宋干節後一週，熱度是本窗口的主要代價。',
  },
  {
    id: 'may-early',
    label: '5/3 – 5/9',
    fullLabel: '2027-05-03 – 05-09',
    tagline: '原案微調・季風轉換期・Similan 季末風險',
    recommended: false,
    seaStability: 3,
    similanStatus: 'late-season',
    songkranImpact: 'none',
    crowdLevel: 3,
    priceLevel: 2,
    heatLevel: 4,
    rainRisk: 3,
    secretIslands: 3,
    notes: [
      '進入季風轉換期，風浪與改程風險上升。',
      'Similan 季至 5/15，5 月上旬仍在季內但已是尾聲。',
      '5 月起奧南→蘭塔渡輪停駛，C 案只能陸路 3–4.5 小時。',
      '優點是已入雨季，住宿價格較低。',
    ],
    sourceNote: '原五方案的月份；保留供比較，不代表建議。',
  },
];

/** 欄位標籤（供比較表使用） */
export const WINDOW_AXES = [
  { key: 'seaStability', label: '海況穩定度', betterWhen: 'high', hint: '風浪與船班取消的風險' },
  { key: 'similanStatus', label: 'Similan 季節', betterWhen: 'either', hint: '季內 10/15–5/15' },
  { key: 'songkranImpact', label: '宋干節影響', betterWhen: 'either', hint: '2027 推估 4/13–4/15' },
  { key: 'crowdLevel', label: '人潮負擔', betterWhen: 'low', hint: '1 最少、5 最多' },
  { key: 'priceLevel', label: '價格水位', betterWhen: 'low', hint: '1 最便宜、5 最貴' },
  { key: 'heatLevel', label: '高溫負擔', betterWhen: 'low', hint: 'El Niño 加劇後的體感' },
  { key: 'rainRisk', label: '降雨風險', betterWhen: 'low', hint: '午後雷雨與全天受影響機率' },
  { key: 'secretIslands', label: '秘境可達性', betterWhen: 'high', hint: 'Trang 群島等秘境的可執行度' },
];

/** El Niño 下針對 4 月的具體準備 */
export const HEAT_PREPARATIONS = [
  {
    id: 'timing',
    title: '把浮潛排在早晚',
    detail: '正午 11:00–15:00 安排岸上活動、午餐或休息，避開最強曝曬時段。',
  },
  {
    id: 'hydration',
    title: '每人每日補水至少 3L',
    detail: '島上備椰子水與運動飲料；高溫下脫水比低溫更需要注意。',
  },
  {
    id: 'sun',
    title: 'SPF50 ＋ 物理遮陽',
    detail: '長袖水母衣本來就要穿，正好作為物理遮陽；補擦防曬乳。',
  },
  {
    id: 'thunder',
    title: '午後雷雨仍可能',
    detail: '4 月已進入熱帶對流季，出海前務必查當日預報與船公司公告。',
  },
  {
    id: 'shade',
    title: ' midday 安排遮陽處',
    detail: '有頂棚的餐廳、碼頭候船區、博物館，比海灘傘更安全。',
  },
];

/** 時效聲明（頁尾與警示區共用） */
export const ENSO_FRESHNESS_NOTE =
  'ENSO 為週期性氣候現象，2026/09 的官方預估不等於 2027 年 4–5 月的實測值。' +
  '本頁的 El Niño 相關判斷僅供行前風險評估參考，須於 2027 年 3 月重新查證 NOAA CPC 與泰國氣象局（TMD）的最新資料。';
