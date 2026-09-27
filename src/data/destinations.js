/**
 * Trave_Dec — 普吉與安達曼海目的地資料
 *
 * 研究日期 2026-09-27。crowd（人氣）與 visibility（能見度）是這次重評的兩個主要軸：
 * 熱門點位能見度好但人擠，冷門點位人少但能見度或交通有代價。
 *
 * visibility 為當地常見共識值（當地潛店與旅遊業者的實測說法），非即時海況。
 * 2027 年 3 月須重新查證。
 */

/** THB → TWD 規劃用匯率（可調整假設） */
export const THB_TO_TWD_ASSUMED = 0.093;

/** USD → TWD 規劃用匯率 */
export const USD_TO_TWD_ASSUMED = 31.5;

export const CROWD_LABEL = {
  high: { label: '高', note: '郵輪與一日遊團的主要停靠點，旺季可能擁擠' },
  medium: { label: '中', note: '常見於一日遊路線，適當時段仍可避開人潮' },
  low: { label: '低', note: '需要特別安排前往，人少是主要價值' },
};

export const VISIBILITY_LABEL = {
  excellent: { label: '極佳', meters: '25–30m' },
  good: { label: '良好', meters: '15–25m' },
  fair: { label: '尚可', meters: '10–15m' },
  variable: { label: '多變', meters: '5–15m，視海況' },
};

export const DESTINATIONS = {
  /* ── 熱門 ── */
  'phi-phi': {
    name: 'Phi Phi Don／Leh',
    cn: '皮皮島',
    crowd: 'high',
    visibility: 'good',
    boatTime: '快艇 45–60 分（大船 90 分）',
    parkFeeTHB: 400,
    note: '**最熱門但值得。**Leh 島的 Viewpoint 值得爬；大船比快艇省錢且不易暈。',
  },
  'racha-yai': {
    name: 'Racha Yai',
    cn: '拉差島',
    crowd: 'medium',
    visibility: 'excellent',
    boatTime: '快艇 45–60 分',
    parkFeeTHB: 200,
    note: '**共識最佳浮潛點之一。**能見度 20–30m，離普吉適中，是自由潛水訓練的共識選擇。',
  },
  'racha-noi': {
    name: 'Racha Noi',
    cn: '拉差諾伊',
    crowd: 'low',
    visibility: 'excellent',
    boatTime: '快艇 60–75 分',
    parkFeeTHB: 200,
    note: 'Racha Yai 的姊妹島，**人少得多但能見度相當**。浮潛者首選。',
  },
  'similan': {
    name: 'Similan Islands',
    cn: '西米蘭',
    crowd: 'high',
    visibility: 'excellent',
    boatTime: '快艇自 Thap Lamu 60–90 分（自普吉 2–2.5h）',
    parkFeeTHB: 600,
    season: '10/15 – 5/15',
    note: '**安達曼海能見度最高的水域。**但本行程須留意：多數業者會安排陸路回 Thap Lamu 搭船，'
      + '若直接從普吉出海則船程長達 2–2.5 小時。',
  },
  'koh-hae': {
    name: 'Coral Island (Koh Hae)',
    cn: '珊瑚島',
    crowd: 'high',
    visibility: 'fair',
    boatTime: '快艇 20–25 分',
    parkFeeTHB: 200,
    note: '**離 Chalong 最近但最擁擠。**水淺、活動多，適合不介意人潮的首日。',
  },
  'tung-kaen': {
    name: 'Thung Kaen',
    cn: '通肯島',
    crowd: 'high',
    visibility: 'fair',
    boatTime: '快艇 20 分',
    parkFeeTHB: 200,
    note: '浮潛裝備一日遊的固定點，便利但商業化。',
  },

  /* ── Phang Nga Bay ── */
  'phang-nga': {
    name: 'Phang Nga Bay',
    cn: '攀牙灣',
    crowd: 'high',
    visibility: 'variable',
    boatTime: '快艇 30–45 分',
    parkFeeTHB: 300,
    note: '**UNESCO 石灰岩地形。**划獨木舟進海蝕洞是招牌體驗，但水下能見度不穩。',
  },
  'koh-hong': {
    name: 'Koh Hong',
    cn: '紅島',
    crowd: 'medium',
    visibility: 'good',
    boatTime: '快艇 30 分（自 Koh Yao Noi 出發）',
    parkFeeTHB: 200,
    note: '**自 Koh Yao Noi 出發最划算的秘境路線。**紅色岩壁下的浮潛點，水質清。',
  },
  'koh-panyi': {
    name: 'Koh Panyi',
    cn: '盤雅島',
    crowd: 'medium',
    visibility: 'variable',
    boatTime: '快艇 35 分',
    parkFeeTHB: 200,
    note: '水上村落，純觀光為主，不以浮潛取勝。',
  },
  'koh-klai': {
    name: 'Koh Klai',
    cn: '克里島',
    crowd: 'low',
    visibility: 'good',
    boatTime: '快艇 40 分',
    parkFeeTHB: 200,
    note: '攀牙灣深處，安靜、原始，浮潛品質不錯但交通時間長。',
  },

  /* ── 冷門 ── */
  'koh-yao-noi': {
    name: 'Koh Yao Noi',
    cn: '小 Yao 島',
    crowd: 'low',
    visibility: 'good',
    boatTime: '快艇 20–30 分（Bang Rong 碼頭）',
    parkFeeTHB: 0,
    note: '**普吉最推薦的冷門駐紮地。**稻田與橡膠園、無公園費、遊客少，'
      + '住幾晚就能把 Racha 與 Koh Hong 都跑完。',
  },
  'koh-yao-yai': {
    name: 'Koh Yao Yai',
    cn: '大 Yao 島',
    crowd: 'low',
    visibility: 'fair',
    boatTime: '陸路橋樑 20 分',
    parkFeeTHB: 0,
    note: '與 Noi 以橋相連，可安排一日步行與 mangrove 獨木舟。',
  },
  'koh-maphrao': {
    name: 'Koh Maphrao',
    cn: '馬普勞島',
    crowd: 'low',
    visibility: 'good',
    boatTime: '快艇 30 分',
    parkFeeTHB: 0,
    note: '**國家公園邊緣的安靜小島**，珊瑚保存良好、人少。',
  },
  'koh-siray': {
    name: 'Koh Siray',
    cn: '西萊島',
    crowd: 'low',
    visibility: 'fair',
    boatTime: '快艇 15 分（Chalong 對岸）',
    parkFeeTHB: 0,
    note: '有度假村的高端選擇，適合想住得好的冷門路線。',
  },
  'koh-khai': {
    name: 'Koh Khai',
    cn: '凱島',
    crowd: 'medium',
    visibility: 'fair',
    boatTime: '快艇 30 分',
    parkFeeTHB: 200,
    note: '每日浮潛團的常客點，能見度普通但海況穩定。',
  },
  'koh-nak': {
    name: 'Koh Nak',
    cn: '拿克島',
    crowd: 'low',
    visibility: 'good',
    boatTime: '快艇 40 分',
    parkFeeTHB: 0,
    note: '**較少人知道的北部小島**，珊瑚礁完整、人少。',
  },
  'koh-bon': {
    name: 'Koh Bon',
    cn: '本島',
    crowd: 'medium',
    visibility: 'good',
    boatTime: '快艇 35 分',
    parkFeeTHB: 0,
    note: 'Racha 與 Similan 之間，適合包船時順路加入。',
  },
  'koh-tachai': {
    name: 'Koh Tachai',
    cn: '達差島',
    crowd: 'low',
    visibility: 'excellent',
    boatTime: '快艇 60–75 分（自 Phuket）或自 Similan 30 分',
    parkFeeTHB: 200,
    note: '**安達曼海少數能見度達 30m 的點位。**通常由 Similan 路線順帶前往。',
  },

  /* ── 甲米側 ── */
  'krabi-4islands': {
    name: '甲米 4 島（Tup／Chicken／Poda／Phra Nang）',
    cn: '甲米四島',
    crowd: 'high',
    visibility: 'good',
    boatTime: '長尾船／快艇皆可，Ao Nang 出發',
    parkFeeTHB: 400,
    note: '經典路線。四個點位各具特色，價格親和（฿650–1,500）。',
  },
  'koh-kradan': {
    name: 'Koh Kradan',
    cn: '克雷丹島',
    crowd: 'medium',
    visibility: 'excellent',
    boatTime: 'Trang 出發 30–40 分',
    parkFeeTHB: 400,
    note: '**Trang 側的秘境。**從 Krabi 或 Ao Nang 過去都遠，Trang 出發最合理。',
  },
  'koh-mook': {
    name: 'Koh Mook（翡翠洞）',
    cn: '木洞島',
    crowd: 'medium',
    visibility: 'fair',
    boatTime: 'Trang 出發 35 分',
    parkFeeTHB: 200,
    note: '**翡翠洞在這裡。**頭頂受限、有黑暗通道與湧浪，'
      + '深度雖僅 3–5m 卻**不適合初學者自由潛水**。',
  },
  'koh-rok': {
    name: 'Koh Rok',
    cn: '洛克島',
    crowd: 'medium',
    visibility: 'excellent',
    boatTime: 'Koh Lanta 出發 45 分',
    parkFeeTHB: 300,
    note: '**能見度極佳的峭壁島**，適合浮潛者。',
  },
  'koh-haa': {
    name: 'Koh Haa',
    cn: '哈島群',
    crowd: 'low',
    visibility: 'excellent',
    boatTime: 'Koh Lanta 出發 50 分',
    parkFeeTHB: 300,
    note: '**安達曼海少數人少且能見度極佳的組合。**潛水者評價高於 Rok。',
  },
};
