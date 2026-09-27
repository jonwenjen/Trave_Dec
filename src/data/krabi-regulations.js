/**
 * Trave_Dec — 泰國浮潛與自由潛水法規（2025/4/22 生效）
 *
 * 這一節不是「建議」，是全國性法律。列在此處是為了讓規劃不會建立在過時的假設上：
 * 2025 年之前的攻略都沒寫這條，而它直接影響「自行包船是否可行」與「能否自己拍照」。
 *
 * 法源：Measures for the Protection of Coral Reef Resources from Diving Tourism Activities,
 *       B.E. 2568 (2025)，自然資源與環境部發布，皇家公報公布。
 * 依據：《海洋與海岸資源管理法》(Marine and Coastal Resources Management Act)
 */

export const THAILAND_SNORKEL_RULES = {
  title: '泰國浮潛與潛水新規',
  authority: 'Natural Resources and Environment（自然資源與環境部）',
  gazette: '皇家公報 Royal Gazette',
  effectiveDate: '2025-04-22',
  legalBasis: 'Marine and Coastal Resources Management Act（海洋與海岸資源管理法）',
  duration: '至少 5 年（現行版本至 2030 年 4 月）',
  scope: '全國海岸線，含甲米、Phi Phi、Similan、普吉、Racha 等所有熱門區域',
  operatorMust: '業者負有執行義務，地方機關可檢查合規情形。',
  sourceUrl: 'https://www.tatnews.org/2025/05/stricter-regulations-for-diving-activities-now-in-effect-in-thailand',
  clauseSourceUrl: 'http://www.private-scuba.com/diving/marine-protection-rules.html',

  clauses: [
    {
      key: 'life-jacket',
      title: '救生衣強制',
      severity: 'critical',
      summary: '浮潛者必須穿救生衣，除非持有認可的自由潛水或水肺證照。',
      detail:
        '持證者可向執法人員出示證照後豁免。這不是旅行社的建議，而是法律義務——' +
        '若船長以「穿救生衣很煩」為由拒絕提供，那是違法，不是服務好。',
    },
    {
      key: 'certified-operator',
      title: '必須與有資格的業者同行',
      severity: 'critical',
      summary: '浮潛者須與具備潛水旅遊經驗的合格業者同行。',
      detail:
        '這一條改變了「自己到碼頭找船」的可行性：自行找船屬灰色地帶，取決於該業者是否' +
        '持有旅遊業執照。實務上甲米與蘭塔多數長尾船業者本就是正式旅遊公司，' +
        '建議透過 Klook／GetYourGuide 的私人包船產品，或直接指定有 TAT 執照的業者。',
    },
    {
      key: 'two-metre',
      title: '礁面上方至少 2 公尺水深',
      severity: 'warn',
      summary: '浮潛時必須保持礁面或海底上方至少 2 公尺的水深。',
      detail: '淺礁區最容易犯這個錯。若水域本身不到 2 公尺深，該處不適合浮潛。',
    },
    {
      key: 'supervisor-ratio',
      title: '督導人數比例',
      severity: 'info',
      summary: '浮潛與自由潛水：1 名督導最多 20 人；超過須加派。',
      detail:
        '水肺深潛為 1 名督導最多 4 人；入門體驗課為 1 名督導對 2 名學員；' +
        '認證教學為 1 名教練對 4 名學生。',
    },
    {
      key: 'mandatory-briefing',
      title: '活動前必須簡報',
      severity: 'info',
      summary: '督導須在活動開始前說明適用法規與責任潛水守則。',
      detail:
        '在國家公園或指定海洋區，額外的法定要求也必須一併說明。' +
        '因此每個公園的深度與人數上限都應在行前確認。',
    },
    {
      key: 'fins-check',
      title: '蛙鞋控制檢查',
      severity: 'warn',
      summary: '業者須在進入礁區前確認遊客能安全控制蛙鞋。',
      detail: '這是為了避免踢珊瑚。業者依法必須執行，別把它當成延誤。',
    },
  ],

  coralAreaDefinition:
    '「珊瑚礁區」包含活珊瑚與死珊瑚、柳珊瑚海扇，以及人工礁。' +
    '這代表幾乎所有會去的點位都適用，沒有「非珊瑚區所以免穿救生衣」的退路。',
};

/** 珊瑚礁區內明文禁止的事項 */
export const CORAL_PROHIBITIONS = [
  {
    key: 'touch',
    action: '觸碰珊瑚或以蛙鞋踢珊瑚',
    consequence: '破壞珊瑚骨骼，是新規最核心的保護對象',
  },
  {
    key: 'handle',
    action: '移動或處理任何海洋生物',
    consequence: '包含觸摸海膽、海參等；受保護物種尤為嚴格',
  },
  {
    key: 'sediment',
    action: '攪動沙泥使其覆蓋珊瑚',
    consequence: '濁水會窒息珊瑚群落，恢復需時數年',
  },
  {
    key: 'feed',
    action: '餵食任何生物（包含海膽、米粒等人造物）',
    consequence:
      '最容易被無心犯規的一條。餵食會讓魚群攻擊珊瑚，海膽甚至會被餵成「美食热点」而被聚集捕撈',
  },
  {
    key: 'litter',
    action: '丟棄廢棄物或垃圾於海中與海灘',
    consequence: '',
  },
];

/** 水下攝影限制——2025 新規最容易被忽略的一條 */
export const PHOTO_RULE = {
  title: '水下攝影限制',
  requiredCertification: 'Advanced Open Water（含等級）以上，或已記錄 40 潛以上',
  rules: [
    '休閒潛水時攜帶或使用水下攝影機（相機、GoPro 等）者，必須符合上述資歷',
    '須能在被要求時出示潛水日誌或認證卡',
    '培訓與教學潛水全面禁止拍照（不論學生成績）',
  ],
  appliesToFreediving:
    '自由潛水證照（AIDA 2 等）不足以讓你帶攝影器材下水。' +
    '自由潛水豁免的是救生衣義務，不是攝影限制。',
  altPaths: [
    '報名合格教練的水下攝影課程，課程潛水不受此限',
    '使用有攝影師隨行的業者（如 Krabi Nice Sea 的水下照片服務）',
    '接受「有些體驗本來就難以用照片說服別人」——翡翠洞就是這種',
  ],
  note:
    '新規的理由是：相機會讓經驗不足的潛水者分心，導致失去浮力、誤觸珊瑚或攪起沉積物。',
};

/**
 * AIDA 證照與救生衣豁免的關係
 * 使用者常問「AIDA 2 能不能不穿救生衣」——可以，但 AIDA 1 不夠。
 */
export const AIDA_EXEMPTION = {
  legalPoint:
    '法規的豁免條款是「持有認可的自由潛水證照者」。AIDA 是三大認可系統之一' +
    '（AIDA／SSI／PADI），因此 AIDA 認證符合豁免條件。',
  aida1: {
    name: 'AIDA 1 Introduction to Freediving',
    isFullCertification: false,
    duration: '1 日',
    waterSessions: 1,
    maxDepth: '10m',
    prerequisite: '能連游 100m',
    output: '入門體驗證明',
    note: '定位在 AIDA 2 之下，性質是一日入門體驗，不宜作為法規豁免的依據。',
  },
  aida2: {
    name: 'AIDA 2 Freediver',
    isFullCertification: true,
    duration: '2.5–3 日',
    waterSessions: '池中 + 開放水域',
    maxDepth: '20m',
    prerequisite: '能連游 200m（穿蛙鞋 300m）',
    output: '正式認證卡',
    note: '第一個完整認證等級，也是全球最廣泛認可的入門自由潛水認證。',
  },
  technicalNote:
    '即使沒有法規，實務上自由潛水進行中本來就不穿救生衣：中性浮力是自由潛水的技術基礎，' +
    '救生衣會把你往上推，使等壓與深度控制失效。AIDA 靜態閉氣項目更明文禁止使用蛙鞋與浮力輔助。',
  practicalPattern:
    '船程穿救生衣 → 到點後脫下交給船長或教練 → 自由潛水 → 上船後重新穿上。' +
    '認證卡須隨身攜帶（防水袋），執法人員可能要求出示。',
  remainingObligations:
    '豁免只免「穿救生衣」的義務，不免除其他規則：珊瑚區五項禁止、2 公尺深度限制、' +
    '督導與簡報要求、水下攝影限制，全部照舊。',
};

/** 跨方案通用的合規檢查清單 */
export const COMPLIANCE_CHECKLIST = [
  // 下水前
  { key: 'operator-license', phase: '下水前', label: '業者持有旅遊業執照', detail: '法規要求「與有資格的業者同行」。訂購時直接索取。' },
  { key: 'life-jacket-onboard', phase: '下水前', label: '船上有足夠救生衣', detail: '無自由潛水或水肺證照者必穿；確認件數足夠全團。' },
  { key: 'briefing', phase: '下水前', label: '督導會做法規簡報', detail: '法規要求。此時可順便問公園的額外要求。' },
  { key: 'park-rules', phase: '下水前', label: '確認公園額外要求', detail: '各公園的深度上限與人數上限不同，出發前查。' },
  { key: 'dive-light', phase: '下水前', label: '備妥 dive light', detail: '翡翠洞等洞穴型點位必備。' },
  { key: 'tide-check', phase: '下水前', label: '查潮汐表', detail: '翡翠洞只在低潮至中潮開放，滿潮會淹。' },
  { key: 'rash-guard', phase: '下水前', label: '備妥長袖水母衣', detail: '防曬傷、防水母、防礁石割傷。甲米全年有水母。' },
  // 下水時
  { key: 'two-metre-rule', phase: '下水時', label: '保持礁面上方 2m 水深', detail: '淺礁區最常犯的錯。' },
  { key: 'no-kick', phase: '下水時', label: '不觸碰、不踢珊瑚（含死珊瑚）', detail: '死珊瑚與海扇同樣受保護。' },
  { key: 'no-feeding', phase: '下水時', label: '不餵食任何生物', detail: '包含觀賞魚；米粒也會讓魚群攻擊珊瑚。' },
  { key: 'no-sediment', phase: '下水時', label: '不攪動沙泥', detail: '用蛙鞋貼近底部就會揚沙。' },
  { key: 'fins-control', phase: '下水時', label: '依示範控制蛙鞋', detail: '業者依法須在入礁區前檢查。' },
  { key: 'buddy', phase: '下水時', label: '保持 buddy 視線內', detail: '自由潛水浮出後再盯 30 秒——淺水昏厥高危時刻。' },
];
