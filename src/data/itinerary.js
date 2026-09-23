/**
 * Trave_Dec — 行程資料模組
 * 資料來源：jonwenjen.github.io/japan-ski-2026/（2026-09 擷取）
 * 所有時刻表與票價為規劃估算值，非即時確認資訊。
 * 住宿狀態：confirmed = 已訂房 / unconfirmed = 未定
 */

/** @typedef {'confirmed'|'unconfirmed'|'estimate'|'reference'} DataStatus */
/** @typedef {'transit'|'ski'|'meal'|'lodging'|'sightseeing'|'flight'|'activity'} EventType */

/**
 * @typedef {Object} TripEvent
 * @property {string} id
 * @property {string} time - 時間（如 "14:45"）
 * @property {string} [endTime]
 * @property {string} title - 事件標題
 * @property {string} [titleJa] - 日文名
 * @property {EventType} type
 * @property {string} [description]
 * @property {DataStatus} status
 * @property {string} [statusNote] - 資料狀態說明
 * @property {number} [costYen] - 每人費用（¥）
 * @property {number} [costTotal] - 總費用（¥），如計程車
 * @property {boolean} [perPerson] - costYen 是否為每人
 * @property {string} [transferBuffer] - 轉乘緩衝說明
 * @property {number} [bufferMinutes] - 緩衝分鐘數
 * @property {string} [riskLevel] - 'low'|'medium'|'high'
 * @property {string} [source] - 資料來源
 * @property {string} [sourceUrl]
 * @property {string} [notes]
 */

/**
 * @typedef {Object} TripDay
 * @property {number} dayNumber
 * @property {string} date - ISO date string
 * @property {string} weekday
 * @property {string} title
 * @property {string} subtitle
 * @property {string} region
 * @property {string} [lodging]
 * @property {string} [lodgingStatus] - 'confirmed'|'unconfirmed'
 * @property {TripEvent[]} events
 */

export const TRIP_META = {
  title: '2307 志賀高原滑雪旅行',
  dateRange: '2026/12/11 – 12/20',
  startDate: '2026-12-11',
  endDate: '2026-12-20',
  defaultPartySize: 6,
  dataSnapshot: '2026-09',
  lastChecked: '2026-09-23',
  dataSource: 'jonwenjen.github.io/japan-ski-2026/',
  dataSourceUrl: 'https://jonwenjen.github.io/japan-ski-2026/',
  caveat: '所有時刻表與票價為規劃估算或前季參考值，非即時確認。出發前請向營運單位查證。',
};

/**
 * 資料狀態的中文說明 — UI 與匯出共用，避免各處寫法不一致。
 */
export const STATUS_LABELS = {
  confirmed: { label: '已確認', hint: '已訂位／已預約，或雪場官方公布的固定資訊' },
  estimate: { label: '規劃估算', hint: '依現行時刻表推算，實際班次以營運單位公告為準' },
  reference: { label: '參考資訊', hint: '前季或第三方資料，出發前需再查證' },
  unconfirmed: { label: '未確認', hint: '尚未預訂或尚未公布' },
};

export const EVENT_TYPE_LABELS = {
  flight: { label: '航班', icon: '✈️' },
  transit: { label: '交通', icon: '🚃' },
  ski: { label: '滑雪', icon: '🎿' },
  meal: { label: '餐食', icon: '🍜' },
  lodging: { label: '住宿', icon: '🏨' },
  sightseeing: { label: '觀光', icon: '📷' },
  activity: { label: '行動', icon: '📌' },
};

/**
 * 12/15 友人上山的替代方案（作戰板）。
 * 全部為規劃估算，26-27 冬季時刻公布後需重新核對。
 */
export const TRANSFER_PLANS = [
  {
    id: 'plan-a',
    label: 'A 案：全程鐵路＋長電巴士',
    eta: '約 14:30 抵 2307',
    costNote: '每人約 ¥12,000',
    pros: '最便宜，雪板袋放行李區',
    cons: '轉乘 3 次，任一段誤點就會錯過山上末班巴士',
    status: 'estimate',
  },
  {
    id: 'plan-b',
    label: 'B 案：鐵路到長野 ＋ 包車上山',
    eta: '約 15:30 抵 2307',
    costNote: '包車全團約 ¥45,000（需分攤）',
    pros: '不受巴士班次限制，行李好處理',
    cons: '需事先預約，雪季路況可能延誤',
    status: 'reference',
  },
  {
    id: 'plan-c',
    label: 'C 案：慢行，中途休息',
    eta: '約 16:35 抵 2307',
    costNote: '每人約 ¥13,500',
    pros: '紅眼班機後最不趕，趕得上晚餐與泡湯',
    cons: '抵達後當天不滑雪',
    status: 'estimate',
  },
];

/**
 * 雪季突發狀況的應對清單 — 離線可讀，不依賴任何即時資料。
 */
export const CONTINGENCY_PLAYBOOK = [
  {
    id: 'bus-cancelled',
    trigger: '大雪導致巴士停駛／延誤',
    actions: [
      '先打雪場或飯店電話確認當日運行（見緊急聯絡）',
      '志賀高原內接駁巴士在雪場營業時段免費，可先移動到有住宿的區域',
      '山上末班巴士錯過就沒有替代班次，改叫計程車並準備現金',
    ],
  },
  {
    id: 'lift-hold',
    trigger: '強風導致纜車停開',
    actions: [
      '橫手山／澀峠風大時常停，改到熊之湯（朝北碗狀地形避風）',
      '雪場運行狀況只能現場或電話確認，本應用不連接即時纜車資料',
    ],
  },
  {
    id: 'train-delay',
    trigger: '新幹線誤點',
    actions: [
      '同區間下一班通常 30 分鐘內（佐久平→長野 備案 あさま 621）',
      '若持指定席券，誤點可改搭同日自由席',
    ],
  },
  {
    id: 'injury',
    trigger: '受傷',
    actions: [
      '雪場巡邏隊優先；叫救護車撥 119（日語為主）',
      '先用隨身工具的日文大字卡與短句說明位置與傷勢',
      '記下雪場名稱與纜車編號，救援較快',
    ],
  },
];

/**
 * 即時資料狀態 — 全部未連接，且刻意不提供假的即時值。
 */
export const LIVE_DATA_SOURCES = [
  { id: 'weather', label: '天氣', status: 'not-connected' },
  { id: 'snow', label: '雪況／積雪深度', status: 'not-connected' },
  { id: 'lifts', label: '纜車運行', status: 'not-connected' },
  { id: 'trains', label: '列車／巴士動態', status: 'not-connected' },
];

/** @type {TripDay[]} */
export const SAMPLE_ITINERARY = [
  {
    dayNumber: 1,
    date: '2026-12-11',
    weekday: '五',
    title: '落地 → 高崎',
    subtitle: 'Robin 先行，成田 T1 → 高崎',
    region: '成田・高崎',
    lodging: '高崎站周邊（未定）',
    lodgingStatus: 'unconfirmed',
    events: [
      {
        id: 'd1-e1',
        time: '14:45',
        title: 'UA838 抵達成田 T1',
        type: 'flight',
        status: 'reference',
        statusNote: '航班時刻為參考值，2026 年排班可能變動',
        source: 'FlightMapper',
        sourceUrl: 'https://info.flightmapper.net/flight/United_Airlines_UA_838',
      },
      {
        id: 'd1-e2',
        time: '16:19',
        title: '搭 Skyliner → 日暮里/上野',
        titleJa: 'スカイライナー',
        type: 'transit',
        status: 'estimate',
        statusNote: '備案 16:39 班次',
        transferBuffer: '入境＋提領行李約 60 分鐘，機場到月台約 15 分鐘',
        bufferMinutes: 75,
        riskLevel: 'medium',
        notes: '轉上越新幹線とき 337 或北陸新幹線あさま 623',
      },
      {
        id: 'd1-e3',
        time: '18:14',
        endTime: '18:18',
        title: '抵達高崎站',
        titleJa: '高崎駅',
        type: 'transit',
        status: 'estimate',
        statusNote: '新幹線時刻依 JR 東日本 2026/09 時刻表',
        costYen: 6140,
        perPerson: true,
        source: '駅探',
      },
      {
        id: 'd1-e4',
        time: '18:30',
        title: '晚餐：高崎站周邊',
        type: 'meal',
        status: 'reference',
        notes: '焼鳥コの字（食べログ 3.73）、暮らす和食のぼる（3.52）、炭焼き成吉思汗いし田（3.71）',
        statusNote: '營業資訊出發前請再確認',
      },
    ],
  },
  {
    dayNumber: 2,
    date: '2026-12-12',
    weekday: '六',
    title: '丸沼高原 → 佐久平',
    subtitle: '滑雪第一天，傍晚移動到佐久平',
    region: '沼田・丸沼・佐久平',
    lodging: '佐久平（未定）',
    lodgingStatus: 'unconfirmed',
    events: [
      {
        id: 'd2-e1',
        time: '07:30',
        title: '高崎 → 沼田（上越線）',
        titleJa: '上越線 高崎→沼田',
        type: 'transit',
        status: 'estimate',
        statusNote: 'NAVITIME 查詢 12/12 週六班次',
        costYen: 990,
        perPerson: true,
      },
      {
        id: 'd2-e2',
        time: '09:00',
        title: '關越交通巴士 沼田 → 鎌田',
        titleJa: '関越交通バス 沼田→鎌田',
        type: 'transit',
        status: 'estimate',
        statusNote: 'NAVITIME 查詢班次，冬季時刻可能調整',
        costYen: 1850,
        perPerson: true,
      },
      {
        id: 'd2-e3',
        time: '09:45',
        title: '鎌田 → 丸沼高原（計程車）',
        type: 'transit',
        status: 'estimate',
        statusNote: '冬季無固定路線巴士，需預約計程車',
        costTotal: 6000,
        notes: '直達巴士僅限新宿「片品 Snow Express」乘客。需事先跟關越交通計程車預約。',
        riskLevel: 'medium',
      },
      {
        id: 'd2-e4',
        time: '10:00',
        endTime: '15:00',
        title: '丸沼高原滑雪',
        titleJa: '丸沼高原スキー場',
        type: 'ski',
        status: 'confirmed',
        source: '丸沼高原',
        sourceUrl: 'https://www.marunuma.jp/winter/course-map/',
      },
      {
        id: 'd2-e5',
        time: '17:00',
        title: '移動到佐久平',
        type: 'transit',
        status: 'estimate',
        notes: '大件行李可在高崎寄到佐久平飯店',
      },
      {
        id: 'd2-e6',
        time: '19:00',
        title: '晚餐：佐久平站周邊',
        type: 'meal',
        status: 'reference',
        notes: 'とんかつ今井佐久平店、佐久の草笛。計程車可達：ピッツェリアジンガラ（食べログ佐久市第1，3.72）、麺匠文蔵本店',
        statusNote: '營業資訊出發前請再確認',
      },
    ],
  },
  {
    dayNumber: 3,
    date: '2026-12-13',
    weekday: '日',
    title: '高峰 Mountain Park 第一天',
    subtitle: '高峰山滑雪，住佐久平',
    region: '佐久平・高峰',
    lodging: '佐久平（未定，連住兩晚）',
    lodgingStatus: 'unconfirmed',
    events: [
      {
        id: 'd3-e1',
        time: '08:40',
        title: '佐久平 → 高峰 Mountain Park（JR 巴士關東）',
        titleJa: 'JRバス関東 高峰高原線',
        type: 'transit',
        status: 'estimate',
        statusNote: 'JR 巴士關東現行冬季時刻（11月中~4月下旬）',
        costYen: 1540,
        perPerson: true,
        notes: '佐久平站蓼科口 3 號乘車處 → 09:00 小諸站 → 09:40 高峰',
        source: 'JR 巴士關東',
        sourceUrl: 'https://www.jrbuskanto.co.jp/bus_etc/cntimep01.cfm?pa=1&pb=1&pc=j0460011&pd=0&st=1',
      },
      {
        id: 'd3-e2',
        time: '10:00',
        endTime: '16:00',
        title: '高峰 Mountain Park 滑雪',
        titleJa: '高峰マウンテンパーク（旧アサマ2000パーク）',
        type: 'ski',
        status: 'confirmed',
        source: '高峰 Mountain Park',
        sourceUrl: 'https://asama2000.com/slope.html',
      },
      {
        id: 'd3-e3',
        time: '19:00',
        title: '晚餐',
        type: 'meal',
        status: 'reference',
        notes: '想好好吃：職人館蕎麥懷石（食べログ 3.71，要預約、要開車）；或佐久平站周邊',
        statusNote: '營業資訊出發前請再確認',
      },
    ],
  },
  {
    dayNumber: 4,
    date: '2026-12-14',
    weekday: '一',
    title: '高峰山 → 長野',
    subtitle: '再滑一天，末班巴士下山後住長野',
    region: '高峰・佐久平・長野',
    lodging: '長野站周邊（未定）',
    lodgingStatus: 'unconfirmed',
    events: [
      {
        id: 'd4-e1',
        time: '08:20',
        title: '佐久平退房，行李放站內置物櫃',
        type: 'activity',
        status: 'estimate',
      },
      {
        id: 'd4-e2',
        time: '08:40',
        title: '佐久平 → 高峰 Mountain Park（JR 巴士關東）',
        titleJa: 'JRバス関東 高峰高原線',
        type: 'transit',
        status: 'estimate',
        statusNote: 'JR 巴士關東冬季時刻',
        costYen: 1540,
        perPerson: true,
        source: 'JR 巴士關東',
        sourceUrl: 'https://www.jrbuskanto.co.jp/bus_etc/cntimep01.cfm?pa=1&pb=1&pc=j0460011&pd=0&st=1',
      },
      {
        id: 'd4-e3',
        time: '09:40',
        endTime: '16:00',
        title: '高峰 Mountain Park 滑雪',
        titleJa: '高峰マウンテンパーク',
        type: 'ski',
        status: 'confirmed',
      },
      {
        id: 'd4-e4',
        time: '16:18',
        title: '末班巴士下山 → 17:00 小諸 → 17:20 佐久平',
        type: 'transit',
        status: 'estimate',
        statusNote: '冬季一天只有 10:10、16:18 兩班下山',
        riskLevel: 'high',
        transferBuffer: '錯過 16:18 末班就沒有巴士，只能搭計程車到佐久平（中型約 ¥10,500）',
        notes: '下車時付現或刷交通 IC 卡',
      },
      {
        id: 'd4-e5',
        time: '17:45',
        title: '佐久平 → 長野（はくたか 571）',
        titleJa: 'はくたか571号',
        type: 'transit',
        status: 'estimate',
        statusNote: '新幹線時刻依 2026/09 時刻表',
        costYen: 3400,
        perPerson: true,
        transferBuffer: '佐久平站取行李＋轉乘約 25 分鐘',
        bufferMinutes: 25,
        riskLevel: 'medium',
        notes: '趕不上改搭あさま 621（18:16→18:38）',
        source: '駅探',
        sourceUrl: 'https://ekitan.com/timetable/shinkansen/section/501/sf-3532/st-3646',
      },
      {
        id: 'd4-e6',
        time: '18:07',
        title: '抵達長野站',
        titleJa: '長野駅',
        type: 'transit',
        status: 'estimate',
      },
      {
        id: 'd4-e7',
        time: '19:00',
        title: '晚餐：長野站周邊',
        type: 'meal',
        status: 'reference',
        notes: 'すき亭本店壽喜燒（食べログ 3.60）、居酒屋うまいもん酒場ひのえさる（3.62）、だいだらぼっち二の坊（3.59）',
        statusNote: '營業資訊出發前請再確認',
      },
    ],
  },
  {
    dayNumber: 5,
    date: '2026-12-15',
    weekday: '二',
    title: '長野 → 2307・友人合流',
    subtitle: 'Robin 先上山；友人 NRT T3 06:35 著陸後上山',
    region: '長野・志賀高原・ほたる溫泉',
    lodging: 'Hotel & Onsen 2307',
    lodgingStatus: 'confirmed',
    events: [
      {
        id: 'd5-e1',
        time: '08:00',
        title: 'Robin：長野站搭長電巴士上山',
        titleJa: '長電バス 急行志賀高原線',
        type: 'transit',
        status: 'estimate',
        statusNote: '參考 25-26 冬季時刻，26-27 冬季時刻預計 11 月公布',
        source: '長電巴士',
        sourceUrl: 'https://www.nagadenbus.co.jp/express/winter/shigakogen/',
      },
      {
        id: 'd5-e2',
        time: '06:35',
        title: '友人 5 人：抵達 NRT T3',
        type: 'flight',
        status: 'reference',
        statusNote: '航班時刻為參考值',
        notes: '入境＋提領雪板袋約 60 分鐘',
      },
      {
        id: 'd5-e3',
        time: '10:00',
        title: '友人移動：依作戰板方案上山',
        type: 'transit',
        status: 'estimate',
        statusNote: '詳見 12/15 作戰板方案 A/B/C',
        notes: '新幹線＋長電巴士或計程車，約 16:35 抵達',
        riskLevel: 'medium',
      },
      {
        id: 'd5-e4',
        time: '13:00',
        title: 'Robin：熊之湯滑半天',
        titleJa: '熊の湯スキー場',
        type: 'ski',
        status: 'confirmed',
        costYen: 7500,
        perPerson: true,
        notes: '初滑期 1 日券 ¥7,500，2 日券 ¥14,500',
        source: '志賀高原',
        sourceUrl: 'https://shigakogen-ski.or.jp/winter/ticket/',
      },
      {
        id: 'd5-e5',
        time: '16:35',
        title: '友人抵達 2307（C 方案預估）',
        type: 'activity',
        status: 'estimate',
        notes: '泡溫泉 → 晚餐',
      },
      {
        id: 'd5-e6',
        time: '18:00',
        title: '晚餐：2307 一泊二食',
        type: 'meal',
        status: 'reference',
        costYen: 13200,
        perPerson: true,
        notes: '一泊二食 ¥13,200 起。想出去吃可搭計程車到一の瀬 TEPPA ROOM',
        statusNote: '住宿含晚餐方案價格為參考',
      },
      {
        id: 'd5-e7',
        time: '18:30',
        endTime: '21:00',
        title: '夜滑選項：熊之湯',
        titleJa: '熊の湯ナイター',
        type: 'ski',
        status: 'reference',
        costYen: 3000,
        perPerson: true,
        notes: '就在住處旁。友人當天長途移動會很累，要滑就先排早晚餐。26-27 冬季營業日待公布。',
        statusNote: '26-27 季營業日期未公布',
        source: '志賀高原',
        sourceUrl: 'https://shigakogen-ski.or.jp/winter/nighter/',
      },
    ],
  },
  {
    dayNumber: 6,
    date: '2026-12-16',
    weekday: '三',
    title: '橫手山・澀峠',
    subtitle: '全員雪板日，日本最高麵包店午餐',
    region: '志賀高原・橫手山',
    lodging: 'Hotel & Onsen 2307',
    lodgingStatus: 'confirmed',
    events: [
      {
        id: 'd6-e1',
        time: '08:30',
        title: '第一趟纜車上橫手山',
        titleJa: '横手山スキー場',
        type: 'ski',
        status: 'confirmed',
        notes: '平日早上壓雪面最適合練刻滑，先在澀峠山頂緩坡做直線換刃練習',
        source: '橫手山・澀峠',
        sourceUrl: 'https://shigakogen-ski.or.jp/lift/yokoteyama-shibutoge/',
      },
      {
        id: 'd6-e2',
        time: '11:30',
        title: '午餐：橫手山頂ヒュッテ',
        titleJa: '横手山頂ヒュッテ',
        type: 'meal',
        status: 'reference',
        notes: '號稱日本最高的麵包店，招牌是羅宋湯套餐。人多的話 11:00 前就去。',
        statusNote: '營業資訊出發前請再確認',
      },
      {
        id: 'd6-e3',
        time: '14:00',
        endTime: '16:30',
        title: '下午：澀峠第 1 纜車上方寬坡',
        titleJa: '渋峠スキー場',
        type: 'ski',
        status: 'confirmed',
        notes: '回到橫手山側繞纜車，人最少的區域。16:30 纜車停駛前收板。',
      },
      {
        id: 'd6-e4',
        time: '17:00',
        title: '加購選項：スノーモンスター（樹冰）行程',
        type: 'activity',
        status: 'reference',
        statusNote: '26-27 場次與費用需打 0269-34-2600 詢問，開幕後公布',
        notes: '橫手山山頂樹冰，雪場有雪上車行程，也辦過夜間星空版',
      },
      {
        id: 'd6-e5',
        time: '18:00',
        title: '晚餐：2307 一泊二食',
        type: 'meal',
        status: 'reference',
      },
    ],
  },
  {
    dayNumber: 7,
    date: '2026-12-17',
    weekday: '四',
    title: '熊之湯全天',
    subtitle: '全員雪板日，朝北碗狀地形',
    region: '志賀高原・熊之湯',
    lodging: 'Hotel & Onsen 2307',
    lodgingStatus: 'confirmed',
    events: [
      {
        id: 'd7-e1',
        time: '08:30',
        title: '熊之湯滑雪',
        titleJa: '熊の湯スキー場',
        type: 'ski',
        status: 'confirmed',
        notes: '從 2307 走到熊之湯雪場。朝北碗狀地形避風，雪況通常是志賀高原最穩的。',
      },
      {
        id: 'd7-e2',
        time: '12:00',
        title: '午餐：熊之湯雪場餐廳',
        titleJa: '熊の湯スキー場レストラン',
        type: 'meal',
        status: 'reference',
        notes: '或到熊の湯ホテル吃午餐',
      },
      {
        id: 'd7-e3',
        time: '15:30',
        title: '收板 → 熊の湯ホテル日歸溫泉',
        titleJa: '熊の湯ホテル',
        type: 'activity',
        status: 'reference',
        statusNote: '日歸溫泉營業時間出發前請確認',
      },
      {
        id: 'd7-e4',
        time: '17:00',
        title: '備案：燒額山或奧志賀半天',
        type: 'ski',
        status: 'reference',
        notes: '若已開放，可搭志賀高原內接駁巴士（雪場營業時段 8:30-17:30 免費）',
        statusNote: '開放狀況依當季雪量',
      },
      {
        id: 'd7-e5',
        time: '18:00',
        title: '晚餐：2307 一泊二食',
        type: 'meal',
        status: 'reference',
      },
      {
        id: 'd7-e6',
        time: '18:30',
        endTime: '21:00',
        title: '夜滑選項',
        type: 'ski',
        status: 'reference',
        notes: '熊之湯 18:30-21:00 ¥3,000、焼額山 18:00-20:00 ¥3,000、一之瀬 18:30-21:00 ¥2,500',
        costYen: 3000,
        perPerson: true,
        statusNote: '26-27 季營業日期待公布',
        source: '志賀高原',
        sourceUrl: 'https://shigakogen-ski.or.jp/winter/nighter/',
      },
    ],
  },
  {
    dayNumber: 8,
    date: '2026-12-18',
    weekday: '五',
    title: '2307 → 橫濱',
    subtitle: '上午滑雪，下午下山往橫濱',
    region: '志賀高原・長野・橫濱',
    lodging: '橫濱（未定）',
    lodgingStatus: 'unconfirmed',
    events: [
      {
        id: 'd8-e1',
        time: '08:30',
        title: '橫手山第一趟纜車',
        titleJa: '横手山スキー場',
        type: 'ski',
        status: 'confirmed',
        notes: '退房 10:00，先把行李寄放飯店',
      },
      {
        id: 'd8-e2',
        time: '14:30',
        title: '最後一趟下山，換衣服拿行李',
        type: 'activity',
        status: 'estimate',
      },
      {
        id: 'd8-e3',
        time: '15:00',
        title: '搭長電巴士下山 → 長野',
        titleJa: '長電バス 急行志賀高原線',
        type: 'transit',
        status: 'estimate',
        statusNote: '參考 25-26 冬季時刻，26-27 預計 11 月公布',
        notes: '山の駅末班 17:00（→18:45 長野）和 18:20（→20:05 長野）',
        riskLevel: 'medium',
        source: '長電巴士',
        sourceUrl: 'https://www.nagadenbus.co.jp/common/document/express/winter/sigakogen-express2025.pdf',
      },
      {
        id: 'd8-e4',
        time: '17:00',
        title: '長野 → 橫濱（北陸新幹線＋轉乘）',
        type: 'transit',
        status: 'estimate',
        statusNote: '新幹線時刻依 2026/09 時刻表',
        costYen: 8500,
        perPerson: true,
      },
      {
        id: 'd8-e5',
        time: '19:50',
        title: '抵達橫濱',
        titleJa: '横浜駅',
        type: 'transit',
        status: 'estimate',
      },
      {
        id: 'd8-e6',
        time: '20:00',
        title: '晚餐：橫濱',
        type: 'meal',
        status: 'reference',
        notes: '野毛的伸喜（烤雞串，食べログ 3.68，不接受預約）、洋食キムラ野毛店（3.66），或港未來中国料理眺遊楼（3.70，要預約）',
        statusNote: '營業資訊出發前請再確認',
      },
    ],
  },
  {
    dayNumber: 9,
    date: '2026-12-19',
    weekday: '六',
    title: '橫濱半日 → 友人回 T3',
    subtitle: '元町漫步，友人 22:25 起飛',
    region: '橫濱・成田',
    lodging: '橫濱（未定，Robin 連住）',
    lodgingStatus: 'unconfirmed',
    events: [
      {
        id: 'd9-e1',
        time: '09:00',
        title: '元町散步',
        titleJa: '元町',
        type: 'sightseeing',
        status: 'reference',
        notes: 'ウチキパン（1888 年創業）→ 喜久家洋菓子舗蘭姆球 → 近沢レース店',
      },
      {
        id: 'd9-e2',
        time: '11:00',
        title: 'Hotel New Grand「The Café」',
        titleJa: 'ホテルニューグランド ザ・カフェ',
        type: 'meal',
        status: 'reference',
        notes: '海鮮焗烤 ¥3,289、拿坡里義大利麵 ¥2,340、布丁 à la mode ¥2,024',
        source: 'Hotel New Grand',
        sourceUrl: 'https://www.hotel-newgrand.co.jp/the-cafe/',
      },
      {
        id: 'd9-e3',
        time: '13:00',
        title: '午餐',
        type: 'meal',
        status: 'reference',
        notes: '家系拉麵發源吉村家（食べログ 3.76）或橫浜中華そば維新商店（3.76）',
      },
      {
        id: 'd9-e4',
        time: '16:30',
        title: '回飯店拿行李 → 橫濱站',
        type: 'activity',
        status: 'estimate',
      },
      {
        id: 'd9-e5',
        time: '17:28',
        title: '友人搭 N\'EX → 成田',
        titleJa: 'N\'EX 成田エクスプレス',
        type: 'transit',
        status: 'estimate',
        statusNote: '週六時刻（每小時 :28），橫濱→東京 28 分，東京→空港第2ビル約 55 分',
        costYen: 4480,
        perPerson: true,
        transferBuffer: 'T3 的 LCC 報到通常在起飛前 45-60 分鐘截止，最保守截止線 21:25',
        bufferMinutes: 60,
        riskLevel: 'medium',
        notes: 'トクだ値 ¥3,640。備案：京急→山手線→日暮里 17:47 Skyliner 59→18:23 抵 T2',
        source: '駅探',
        sourceUrl: 'https://ekitan.com/transit/express/section/exm-110392/exs-110392002/sf-3260/st-2590',
      },
      {
        id: 'd9-e6',
        time: '22:25',
        title: '友人班機起飛（NRT T3）',
        type: 'flight',
        status: 'reference',
        statusNote: '航班時刻為參考值',
      },
    ],
  },
  {
    dayNumber: 10,
    date: '2026-12-20',
    weekday: '日',
    title: 'Robin 回程',
    subtitle: '橫濱 → 成田 T1',
    region: '橫濱・成田',
    lodging: null,
    lodgingStatus: null,
    events: [
      {
        id: 'd10-e1',
        time: '10:00',
        title: '橫濱站崎陽軒買燒賣伴手禮',
        titleJa: '崎陽軒',
        type: 'sightseeing',
        status: 'reference',
        notes: '冷藏款只能放托運行李',
      },
      {
        id: 'd10-e2',
        time: '13:28',
        title: '橫濱搭 N\'EX → 成田空港（T1）',
        titleJa: 'N\'EX 成田エクスプレス',
        type: 'transit',
        status: 'estimate',
        statusNote: 'N\'EX 時刻為參考值',
        costYen: 4480,
        perPerson: true,
      },
      {
        id: 'd10-e3',
        time: '14:55',
        title: '抵達成田空港站（T1）',
        titleJa: '成田空港駅',
        type: 'transit',
        status: 'estimate',
        transferBuffer: 'UA837 17:30 起飛，緩衝約 2 小時 35 分',
        bufferMinutes: 155,
        riskLevel: 'low',
      },
      {
        id: 'd10-e4',
        time: '17:30',
        title: 'UA837 NRT T1 南翼起飛',
        type: 'flight',
        status: 'reference',
        statusNote: '航班時刻為參考值，2026 年排班可能變動',
        source: 'FlightMapper',
        sourceUrl: 'https://info.flightmapper.net/flight/United_Airlines_UA_837',
      },
    ],
  },
];

/**
 * 預算分類
 * @typedef {Object} BudgetCategory
 * @property {string} id
 * @property {string} label
 * @property {string} icon
 * @property {number} estimatedYen - 每人預估
 * @property {string} note
 */

/** @type {BudgetCategory[]} */
export const SAMPLE_BUDGET = [
  { id: 'flight', label: '機票', icon: '✈️', estimatedYen: 35000, note: '依航空公司與購票時間而異' },
  { id: 'shinkansen', label: '新幹線', icon: '🚄', estimatedYen: 25000, note: '含多段新幹線乘車券＋特急券' },
  { id: 'local-transit', label: '在地交通', icon: '🚌', estimatedYen: 12000, note: '巴士、電車、計程車分攤' },
  { id: 'lodging', label: '住宿', icon: '🏨', estimatedYen: 55000, note: '10 晚平均，含 2307 一泊二食 3 晚' },
  { id: 'lift', label: '纜車票', icon: '🎿', estimatedYen: 28000, note: '初滑期票價，含夜滑' },
  { id: 'meals', label: '餐飲', icon: '🍜', estimatedYen: 30000, note: '不含住宿已含餐' },
  { id: 'gear', label: '雪具租借', icon: '🏔️', estimatedYen: 0, note: '自備雪具' },
  { id: 'misc', label: '雜費', icon: '💴', estimatedYen: 10000, note: '伴手禮、溫泉、置物櫃等' },
];

/**
 * 日文大字卡 — 目的地
 * @typedef {Object} DestinationCard
 * @property {string} id
 * @property {string} nameZh - 繁中名
 * @property {string} nameJa - 日文名
 * @property {string} [address] - 日文地址
 * @property {string} [phone]
 * @property {string} [region]
 */

/** @type {DestinationCard[]} */
export const DESTINATION_CARDS = [
  { id: 'dest-narita-t1', nameZh: '成田機場 T1', nameJa: '成田空港 第1ターミナル', region: '千葉' },
  { id: 'dest-narita-t3', nameZh: '成田機場 T3', nameJa: '成田空港 第3ターミナル', region: '千葉' },
  { id: 'dest-takasaki', nameZh: '高崎站', nameJa: '高崎駅', region: '群馬' },
  { id: 'dest-numata', nameZh: '沼田站', nameJa: '沼田駅', region: '群馬' },
  { id: 'dest-marunuma', nameZh: '丸沼高原滑雪場', nameJa: '丸沼高原スキー場', address: '群馬県利根郡片品村東小川4658-58', phone: '0278-58-2211', region: '群馬' },
  { id: 'dest-sakudaira', nameZh: '佐久平站', nameJa: '佐久平駅', region: '長野' },
  { id: 'dest-takamine', nameZh: '高峰 Mountain Park', nameJa: '高峰マウンテンパーク', address: '長野県小諸市高峰高原', region: '長野' },
  { id: 'dest-nagano', nameZh: '長野站', nameJa: '長野駅', region: '長野' },
  { id: 'dest-2307', nameZh: 'Hotel & Onsen 2307', nameJa: 'ホテル&温泉 2307 横手山・渋峠', address: '長野県下高井郡山ノ内町平穏7148', phone: '0269-34-2905', region: '志賀高原' },
  { id: 'dest-kumanoyu', nameZh: '熊之湯滑雪場', nameJa: '熊の湯スキー場', region: '志賀高原' },
  { id: 'dest-yokoteyama', nameZh: '橫手山滑雪場', nameJa: '横手山スキー場', region: '志賀高原', phone: '0269-34-2600' },
  { id: 'dest-yokohama', nameZh: '橫濱站', nameJa: '横浜駅', region: '神奈川' },
  { id: 'dest-motomachi', nameZh: '元町', nameJa: '元町', region: '橫濱' },
  { id: 'dest-newgrand', nameZh: 'Hotel New Grand', nameJa: 'ホテルニューグランド', address: '横浜市中区山下町10番地', region: '橫濱' },
];

/**
 * 日文情境短句
 */
export const PHRASE_CATEGORIES = [
  {
    id: 'greetings',
    label: '基本招呼',
    icon: '👋',
    phrases: [
      { zh: '你好', ja: 'こんにちは', roma: 'Konnichiwa' },
      { zh: '謝謝', ja: 'ありがとうございます', roma: 'Arigatou gozaimasu' },
      { zh: '不好意思', ja: 'すみません', roma: 'Sumimasen' },
      { zh: '請問⋯', ja: 'あの、すみません', roma: 'Ano, sumimasen' },
      { zh: '麻煩你了', ja: 'お願いします', roma: 'Onegai shimasu' },
    ],
  },
  {
    id: 'transit',
    label: '交通',
    icon: '🚃',
    phrases: [
      { zh: '請問這班車到○○嗎？', ja: 'この電車は○○に行きますか？', roma: 'Kono densha wa ○○ ni ikimasu ka?' },
      { zh: '我要到○○站', ja: '○○駅まで行きたいです', roma: '○○ eki made ikitai desu' },
      { zh: '請問在哪裡搭巴士？', ja: 'バス乗り場はどこですか？', roma: 'Basu noriba wa doko desu ka?' },
      { zh: '末班車幾點？', ja: '最終バスは何時ですか？', roma: 'Saishuu basu wa nanji desu ka?' },
      { zh: '到○○要多久？', ja: '○○までどのくらいかかりますか？', roma: '○○ made dono kurai kakarimasu ka?' },
      { zh: '可以放大件行李嗎？', ja: '大きい荷物を置けますか？', roma: 'Ookii nimotsu wo okemasu ka?' },
    ],
  },
  {
    id: 'ski',
    label: '滑雪',
    icon: '🎿',
    phrases: [
      { zh: '我要買一日券', ja: '1日券をお願いします', roma: 'Ichinichiken wo onegai shimasu' },
      { zh: '纜車幾點開始？', ja: 'リフトは何時からですか？', roma: 'Rifuto wa nanji kara desu ka?' },
      { zh: '今天哪些雪道有開？', ja: '今日はどのコースが開いていますか？', roma: 'Kyou wa dono koosu ga aiteimasu ka?' },
      { zh: '我的程度是中級', ja: '中級者です', roma: 'Chuukyuusha desu' },
      { zh: '請問哪裡可以寄放雪具？', ja: 'スキー用具はどこに預けられますか？', roma: 'Sukii yougu wa doko ni azukeraremasu ka?' },
      { zh: '夜間滑雪今天有開嗎？', ja: '今日ナイターは営業していますか？', roma: 'Kyou naitaa wa eigyou shiteimasu ka?' },
    ],
  },
  {
    id: 'dining',
    label: '餐飲',
    icon: '🍜',
    phrases: [
      { zh: '6 位，有座位嗎？', ja: '6名ですが、席はありますか？', roma: 'Roku mei desu ga, seki wa arimasu ka?' },
      { zh: '我要這個', ja: 'これをお願いします', roma: 'Kore wo onegai shimasu' },
      { zh: '推薦什麼？', ja: 'おすすめは何ですか？', roma: 'Osusume wa nan desu ka?' },
      { zh: '可以分開付嗎？', ja: '別々に会計できますか？', roma: 'Betsubetsu ni kaikei dekimasu ka?' },
      { zh: '結帳', ja: 'お会計お願いします', roma: 'Okaikei onegai shimasu' },
      { zh: '不能吃○○', ja: '○○が食べられません', roma: '○○ ga taberaremasen' },
    ],
  },
  {
    id: 'hotel',
    label: '住宿',
    icon: '🏨',
    phrases: [
      { zh: '我有訂房，姓○○', ja: '予約しています、○○です', roma: 'Yoyaku shiteimasu, ○○ desu' },
      { zh: '可以寄放行李嗎？', ja: '荷物を預かってもらえますか？', roma: 'Nimotsu wo azukatte moraemasu ka?' },
      { zh: '退房後可以泡溫泉嗎？', ja: 'チェックアウト後も温泉に入れますか？', roma: 'Chekkuauto go mo onsen ni hairemasu ka?' },
      { zh: '溫泉幾點開放？', ja: '温泉は何時からですか？', roma: 'Onsen wa nanji kara desu ka?' },
      { zh: 'Wi-Fi 密碼是什麼？', ja: 'Wi-Fiのパスワードは何ですか？', roma: 'Waifai no pasuwaado wa nan desu ka?' },
    ],
  },
  {
    id: 'emergency',
    label: '緊急',
    icon: '🚨',
    phrases: [
      { zh: '請幫幫我', ja: '助けてください', roma: 'Tasukete kudasai' },
      { zh: '請叫救護車', ja: '救急車を呼んでください', roma: 'Kyuukyuusha wo yonde kudasai' },
      { zh: '我受傷了', ja: 'けがをしました', roma: 'Kega wo shimashita' },
      { zh: '我迷路了', ja: '道に迷いました', roma: 'Michi ni mayoimashita' },
      { zh: '這裡的地址是？', ja: 'ここの住所は何ですか？', roma: 'Koko no juusho wa nan desu ka?' },
    ],
  },
  {
    id: 'shopping',
    label: '購物',
    icon: '🛒',
    phrases: [
      { zh: '可以免稅嗎？', ja: '免税できますか？', roma: 'Menzei dekimasu ka?' },
      { zh: '可以用信用卡嗎？', ja: 'クレジットカードは使えますか？', roma: 'Kurejitto kaado wa tsukaemasu ka?' },
      { zh: '這個多少錢？', ja: 'これはいくらですか？', roma: 'Kore wa ikura desu ka?' },
      { zh: '有其他顏色嗎？', ja: '他の色はありますか？', roma: 'Hoka no iro wa arimasu ka?' },
    ],
  },
];

/**
 * 緊急聯絡
 */
export const EMERGENCY_CONTACTS = [
  { label: '警察', number: '110', icon: '🚔', note: '英語對應可' },
  { label: '消防／救護車', number: '119', icon: '🚑', note: '日語為主' },
  { label: 'Hotel & Onsen 2307', number: '+81-269-34-2905', icon: '🏨' },
  { label: '橫手山滑雪場', number: '+81-269-34-2600', icon: '⛷️' },
  { label: '丸沼高原滑雪場', number: '+81-278-58-2211', icon: '⛷️' },
];

/**
 * 官方資源連結
 */
export const OFFICIAL_LINKS = [
  {
    label: '志賀高原冬季巴士資訊',
    url: 'https://www.shigakogen.gr.jp/english/topics/shiga-kogen-bus-service-information.html',
    category: 'transport',
  },
  {
    label: '志賀高原纜車運行狀況',
    url: 'https://www.shigakogen-ski.or.jp/english/index.php',
    category: 'resort',
  },
  {
    label: 'JNTO 志賀高原',
    url: 'https://www.japan.travel/en/spot/2051/',
    category: 'tourism',
  },
  {
    label: '長電巴士 志賀高原線（冬季）',
    url: 'https://www.nagadenbus.co.jp/express/winter/shigakogen/',
    category: 'transport',
  },
  {
    label: 'Hotel & Onsen 2307',
    url: 'https://www.hotel2307.com/en/',
    category: 'lodging',
  },
  {
    label: '志賀高原纜車票價',
    url: 'https://shigakogen-ski.or.jp/winter/ticket/',
    category: 'resort',
  },
];
