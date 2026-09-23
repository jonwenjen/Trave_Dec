/**
 * Trave_Dec — 純函式工具層
 *
 * 這裡只放不碰 DOM、不碰 localStorage 的純函式，
 * 讓 node --test 可以直接驗證行程／預算／行事曆的行為。
 */

/* ═══════════════════════════════════════════
   金額
   ═══════════════════════════════════════════ */

/** 日圓格式化：6140 → "¥6,140" */
export function formatCurrency(yen) {
  const n = Number(yen);
  if (!Number.isFinite(n)) return '¥0';
  return '¥' + Math.round(n).toLocaleString('en-US');
}

/**
 * 換算單人費用。
 * @param {number} amount - 金額
 * @param {number} partySize - 團員人數
 * @param {boolean} isPerPerson - amount 是否已經是每人金額
 */
export function perPersonCost(amount, partySize, isPerPerson) {
  const value = Number(amount) || 0;
  if (isPerPerson) return value;
  const size = Number(partySize);
  if (!Number.isFinite(size) || size < 1) return value;
  return value / size;
}

/**
 * 單一事件的每人費用。
 * costYen + perPerson:true → 直接採用；
 * costTotal（或 perPerson:false 的 costYen）→ 依人數均分。
 */
export function eventCostPerPerson(event, partySize) {
  if (!event) return 0;
  if (event.perPerson && event.costYen != null) {
    return Number(event.costYen) || 0;
  }
  const total = event.costTotal != null ? event.costTotal : event.costYen;
  return perPersonCost(total || 0, partySize, false);
}

/** 一天所有事件的每人費用小計 */
export function computeDayBudget(events, partySize) {
  return (events || []).reduce(
    (sum, event) => sum + eventCostPerPerson(event, partySize),
    0
  );
}

/** 全程行程內標註費用的每人合計 */
export function computeItineraryCost(days, partySize) {
  return (days || []).reduce(
    (sum, day) => sum + computeDayBudget(day.events, partySize),
    0
  );
}

/** 預算分類每人合計 */
export function computeTotalBudget(budgetCategories) {
  return (budgetCategories || []).reduce(
    (sum, cat) => sum + (Number(cat.estimatedYen) || 0),
    0
  );
}

/**
 * 把使用者改過的金額套回預算分類。
 * @param {Array} categories
 * @param {Object<string, number>} edits - 分類 id → 金額
 */
export function mergeBudgetEdits(categories, edits) {
  const overrides = edits || {};
  return (categories || []).map((cat) => {
    if (!Object.prototype.hasOwnProperty.call(overrides, cat.id)) return { ...cat };
    const value = Number(overrides[cat.id]);
    if (!Number.isFinite(value) || value < 0) return { ...cat };
    return { ...cat, estimatedYen: value, edited: true };
  });
}

/** 每人／全團金額摘要 */
export function budgetTotals(categories, partySize) {
  const perPerson = computeTotalBudget(categories);
  const size = Math.max(1, Number(partySize) || 1);
  return { perPerson, group: perPerson * size, partySize: size };
}

/* ═══════════════════════════════════════════
   時間
   ═══════════════════════════════════════════ */

/** "14:45" → 885；格式不對回傳 null */
export function timeToMinutes(time) {
  if (typeof time !== 'string') return null;
  const match = time.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

/** 885 → "14:45"（跨日會取模 24 小時） */
export function minutesToTime(minutes) {
  const total = ((Math.round(Number(minutes) || 0) % 1440) + 1440) % 1440;
  const h = String(Math.floor(total / 60)).padStart(2, '0');
  const m = String(total % 60).padStart(2, '0');
  return `${h}:${m}`;
}

/** 依時間排序事件（沒有時間的排最後，順序維持穩定） */
export function sortEventsByTime(events) {
  return (events || [])
    .map((event, index) => ({ event, index }))
    .sort((a, b) => {
      const ta = timeToMinutes(a.event.time);
      const tb = timeToMinutes(b.event.time);
      if (ta == null && tb == null) return a.index - b.index;
      if (ta == null) return 1;
      if (tb == null) return -1;
      if (ta !== tb) return ta - tb;
      return a.index - b.index;
    })
    .map((item) => item.event);
}

/**
 * 找出「接下來要做的事」。
 * @param {object} day
 * @param {number|null} nowMinutes - 當天已過的分鐘數；null 代表不是今天
 */
export function getNextEvent(day, nowMinutes) {
  const events = sortEventsByTime(day && day.events);
  if (!events.length) return null;
  if (nowMinutes == null) return events[0];
  const upcoming = events.find((e) => {
    const t = timeToMinutes(e.time);
    return t != null && t >= nowMinutes;
  });
  return upcoming || null;
}

/* ═══════════════════════════════════════════
   日期
   ═══════════════════════════════════════════ */

/** 取日序號，容忍 dayNumber / dayNum 兩種欄位 */
export function dayIndexOf(day) {
  if (!day) return null;
  const value = day.dayNumber != null ? day.dayNumber : day.dayNum;
  return value == null ? null : Number(value);
}

/** 以日序號區間篩選 */
export function filterDaysByRange(days, startDay, endDay) {
  return (days || []).filter((d) => {
    const n = dayIndexOf(d);
    return n != null && n >= startDay && n <= endDay;
  });
}

/** "2026-12-11" → Date（以當地時間中午建構，避免時區位移跨日） */
export function parseISODate(dateStr) {
  if (dateStr instanceof Date) return dateStr;
  if (typeof dateStr !== 'string') return null;
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
}

/** "2026-12-11" → "12/11" */
export function formatShortDate(dateStr) {
  const d = parseISODate(dateStr);
  if (!d) return '';
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** 行程進度百分比（0–100） */
export function getDayProgress(currentDate, tripStartDate, tripEndDate) {
  const current = new Date(currentDate).getTime();
  const start = new Date(tripStartDate).getTime();
  const end = new Date(tripEndDate).getTime();

  if (!Number.isFinite(current) || !Number.isFinite(start) || !Number.isFinite(end)) return 0;
  if (current < start) return 0;
  if (current > end) return 100;
  if (end === start) return 100;
  return Math.round(((current - start) / (end - start)) * 100);
}

/** 距離出發還有幾天；負數代表已出發，0 代表今天 */
export function daysUntil(targetDate, now) {
  const target = parseISODate(targetDate);
  const ref = now ? new Date(now) : new Date();
  if (!target) return null;
  const a = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  const b = Date.UTC(ref.getFullYear(), ref.getMonth(), ref.getDate());
  return Math.round((a - b) / 86400000);
}

/**
 * 決定開啟時要停在哪一天：行程中 → 今天；行程前 → 第一天；行程後 → 最後一天。
 * @returns {{dayNumber:number, phase:'before'|'during'|'after'}}
 */
export function resolveActiveDay(days, now) {
  const list = days || [];
  if (!list.length) return { dayNumber: 1, phase: 'before' };
  const ref = now ? new Date(now) : new Date();
  const today = Date.UTC(ref.getFullYear(), ref.getMonth(), ref.getDate());

  let first = null;
  let last = null;
  for (const day of list) {
    const d = parseISODate(day.date);
    if (!d) continue;
    const stamp = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    if (first == null) first = stamp;
    last = stamp;
    if (stamp === today) {
      return { dayNumber: dayIndexOf(day), phase: 'during' };
    }
  }
  if (first != null && today < first) {
    return { dayNumber: dayIndexOf(list[0]), phase: 'before' };
  }
  if (last != null && today > last) {
    return { dayNumber: dayIndexOf(list[list.length - 1]), phase: 'after' };
  }
  return { dayNumber: dayIndexOf(list[0]), phase: 'during' };
}

/* ═══════════════════════════════════════════
   轉乘風險
   ═══════════════════════════════════════════ */

/** 預設緩衝門檻（分鐘） */
export const DEFAULT_BUFFER_POLICY = { tightMinutes: 15, safeMinutes: 30 };

/** 正規化使用者調整過的門檻，確保 tight < safe 且為正整數 */
export function normalizeBufferPolicy(policy) {
  const tightRaw = Number(policy && policy.tightMinutes);
  const safeRaw = Number(policy && policy.safeMinutes);
  const tight = Number.isFinite(tightRaw) && tightRaw >= 0
    ? Math.round(tightRaw)
    : DEFAULT_BUFFER_POLICY.tightMinutes;
  let safe = Number.isFinite(safeRaw) && safeRaw >= 0
    ? Math.round(safeRaw)
    : DEFAULT_BUFFER_POLICY.safeMinutes;
  if (safe < tight) safe = tight;
  return { tightMinutes: tight, safeMinutes: safe };
}

/**
 * 依緩衝分鐘數判斷轉乘風險。
 * @param {number|undefined} bufferMinutes
 * @param {{tightMinutes:number, safeMinutes:number}} [policy]
 * @returns {'low'|'medium'|'high'|'unknown'}
 */
export function getTransferRisk(bufferMinutes, policy) {
  if (bufferMinutes === undefined || bufferMinutes === null || bufferMinutes === '') return 'unknown';
  const minutes = Number(bufferMinutes);
  if (!Number.isFinite(minutes)) return 'unknown';
  const { tightMinutes, safeMinutes } = normalizeBufferPolicy(policy || DEFAULT_BUFFER_POLICY);
  if (minutes < tightMinutes) return 'high';
  if (minutes <= safeMinutes) return 'medium';
  return 'low';
}

/** 事件實際採用的緩衝分鐘：使用者手動值優先 */
export function effectiveBuffer(event, bufferEdits) {
  if (!event) return undefined;
  const edits = bufferEdits || {};
  if (Object.prototype.hasOwnProperty.call(edits, event.id)) {
    const value = Number(edits[event.id]);
    if (Number.isFinite(value) && value >= 0) return value;
  }
  return event.bufferMinutes;
}

/**
 * 綜合風險：有緩衝分鐘就用分鐘算，否則採用資料裡人工標註的 riskLevel。
 */
export function resolveEventRisk(event, bufferEdits, policy) {
  const buffer = effectiveBuffer(event, bufferEdits);
  if (buffer != null && buffer !== '') {
    return { level: getTransferRisk(buffer, policy), bufferMinutes: Number(buffer), source: 'buffer' };
  }
  if (event && event.riskLevel) {
    return { level: event.riskLevel, bufferMinutes: null, source: 'annotated' };
  }
  return { level: 'unknown', bufferMinutes: null, source: 'none' };
}

/** 全程需要注意的轉乘，依風險高→低排序 */
export function collectTransferRisks(days, bufferEdits, policy) {
  const out = [];
  for (const day of days || []) {
    for (const event of sortEventsByTime(day.events)) {
      const risk = resolveEventRisk(event, bufferEdits, policy);
      if (risk.source === 'none') continue;
      if (risk.level === 'low' && !event.transferBuffer) continue;
      out.push({ day, event, ...risk });
    }
  }
  const order = { high: 0, medium: 1, unknown: 2, low: 3 };
  return out.sort((a, b) => {
    const diff = (order[a.level] ?? 9) - (order[b.level] ?? 9);
    if (diff !== 0) return diff;
    return (dayIndexOf(a.day) || 0) - (dayIndexOf(b.day) || 0);
  });
}

/* ═══════════════════════════════════════════
   搜尋與篩選
   ═══════════════════════════════════════════ */

const EVENT_SEARCH_FIELDS = ['title', 'titleJa', 'description', 'notes', 'statusNote', 'transferBuffer', 'source', 'userNote'];

function eventMatches(event, q) {
  return EVENT_SEARCH_FIELDS.some((field) => {
    const value = event[field];
    return typeof value === 'string' && value.toLowerCase().includes(q);
  });
}

function dayMatches(day, q) {
  return ['title', 'subtitle', 'region', 'lodging', 'weekday'].some((field) => {
    const value = day[field];
    return typeof value === 'string' && value.toLowerCase().includes(q);
  });
}

/**
 * 搜尋行程。標題、日文名、備註、資料狀態說明都會比對；
 * 若比對到的是「當日」欄位（標題／地區／住宿），則整天的事件都回傳。
 */
export function searchItinerary(days, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];
  const results = [];
  for (const day of days || []) {
    const events = day.events || [];
    if (dayMatches(day, q)) {
      results.push({ ...day, events: sortEventsByTime(events), matchedOn: 'day' });
      continue;
    }
    const matching = events.filter((e) => eventMatches(e, q));
    if (matching.length) {
      results.push({ ...day, events: sortEventsByTime(matching), matchedOn: 'event' });
    }
  }
  return results;
}

/** 依事件類型篩選（types 為空陣列代表全部） */
export function filterEventsByType(events, types) {
  if (!types || !types.length) return events || [];
  return (events || []).filter((e) => types.includes(e.type));
}

/** 統計一天各類型事件數量 */
export function countByType(events) {
  const counts = {};
  for (const event of events || []) {
    const key = event.type || 'other';
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

/** 搜尋隨身工具內容（大字卡／短句） */
export function searchFieldContent(destinations, phraseCategories, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return { destinations: destinations || [], phrases: [] };
  const dest = (destinations || []).filter((d) =>
    ['nameZh', 'nameJa', 'address', 'region'].some(
      (f) => typeof d[f] === 'string' && d[f].toLowerCase().includes(q)
    )
  );
  const phrases = [];
  for (const cat of phraseCategories || []) {
    for (const phrase of cat.phrases || []) {
      if (['zh', 'ja', 'roma'].some((f) => typeof phrase[f] === 'string' && phrase[f].toLowerCase().includes(q))) {
        phrases.push({ ...phrase, category: cat.label });
      }
    }
  }
  return { destinations: dest, phrases };
}

/* ═══════════════════════════════════════════
   當日摘要
   ═══════════════════════════════════════════ */

/**
 * 一天的行動摘要：起訖時間、費用、風險數、待確認項目。
 */
export function summarizeDay(day, partySize, bufferEdits, policy) {
  const events = sortEventsByTime(day && day.events);
  const timed = events.filter((e) => timeToMinutes(e.time) != null);
  const risks = events
    .map((event) => resolveEventRisk(event, bufferEdits, policy))
    .filter((r) => r.source !== 'none');

  return {
    eventCount: events.length,
    firstTime: timed.length ? timed[0].time : null,
    lastTime: timed.length ? timed[timed.length - 1].time : null,
    costPerPerson: computeDayBudget(events, partySize),
    counts: countByType(events),
    riskCount: risks.filter((r) => r.level === 'high' || r.level === 'medium').length,
    highRiskCount: risks.filter((r) => r.level === 'high').length,
    unconfirmedCount: events.filter((e) => e.status === 'estimate' || e.status === 'reference').length,
    lodgingNeedsConfirm: (day && day.lodgingStatus) === 'unconfirmed',
  };
}

/** 全程待確認的住宿 */
export function collectLodgingToConfirm(days, lodgingEdits) {
  const edits = lodgingEdits || {};
  const out = [];
  for (const day of days || []) {
    if (!day.lodging && !edits[day.date]) continue;
    const override = edits[day.date] || {};
    const status = override.status || day.lodgingStatus;
    out.push({
      date: day.date,
      dayNumber: dayIndexOf(day),
      region: day.region,
      name: override.name || day.lodging,
      status: status || 'unconfirmed',
    });
  }
  return out;
}

/* ═══════════════════════════════════════════
   編輯合併
   ═══════════════════════════════════════════ */

/**
 * 把持久化的編輯（緩衝分鐘、自訂備註、住宿）套用到範例行程，
 * 產生要顯示／匯出的行程。
 */
export function applyEdits(days, edits) {
  const { eventEdits = {}, bufferEdits = {}, lodgingEdits = {} } = edits || {};
  return (days || []).map((day) => {
    const lodging = lodgingEdits[day.date];
    return {
      ...day,
      lodging: lodging && lodging.name ? lodging.name : day.lodging,
      lodgingStatus: lodging && lodging.status ? lodging.status : day.lodgingStatus,
      lodgingEdited: Boolean(lodging),
      events: (day.events || []).map((event) => {
        const patch = eventEdits[event.id] || {};
        const buffer = effectiveBuffer(event, bufferEdits);
        return {
          ...event,
          ...patch,
          bufferMinutes: buffer,
          bufferEdited: Object.prototype.hasOwnProperty.call(bufferEdits, event.id),
        };
      }),
    };
  });
}

/* ═══════════════════════════════════════════
   匯出 / 匯入
   ═══════════════════════════════════════════ */

export const TRIP_FILE_VERSION = 1;

/** 匯出完整行程檔（含編輯後的資料與匯出時間） */
export function exportTripJSON(meta, days, budget, partySize, extra) {
  return JSON.stringify(
    {
      version: TRIP_FILE_VERSION,
      exportedAt: (extra && extra.exportedAt) || new Date().toISOString(),
      meta,
      partySize,
      budget,
      days,
      settings: (extra && extra.settings) || undefined,
      disclaimer: '所有時刻與費用為規劃估算，非即時確認資訊。',
    },
    null,
    2
  );
}

/** 匯入行程檔；格式不符會丟出錯誤 */
export function importTripJSON(jsonString) {
  const obj = JSON.parse(jsonString);
  if (!obj || typeof obj !== 'object') throw new Error('檔案格式不正確');
  if (!Array.isArray(obj.days)) throw new Error('缺少 days 欄位');
  if (obj.partySize != null) {
    const size = Number(obj.partySize);
    if (!Number.isFinite(size) || size < 1) throw new Error('partySize 不正確');
  }
  return obj;
}

/** 分享連結用的輕量狀態（只帶設定，不帶整份行程） */
export function encodeShareState(state) {
  return encodeURIComponent(JSON.stringify(state || {}));
}

/** 解析分享連結參數，失敗回傳 null */
export function decodeShareState(encoded) {
  if (!encoded) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(encoded));
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

/** 產生分享連結（保留現有 query，換掉 hash） */
export function buildShareURL(baseUrl, state) {
  const url = new URL(baseUrl);
  url.hash = 's=' + encodeShareState(state);
  return url.toString();
}

/* ═══════════════════════════════════════════
   行事曆 (.ics)
   ═══════════════════════════════════════════ */

/** RFC 5545 文字跳脫 */
export function icsEscape(text) {
  return String(text == null ? '' : text)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** RFC 5545 折行：每行最多 75 octet，續行以空白開頭 */
export function foldICSLine(line) {
  const chars = Array.from(String(line));
  const out = [];
  let current = '';
  let bytes = 0;
  const encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
  const sizeOf = (ch) => (encoder ? encoder.encode(ch).length : 1);

  for (const ch of chars) {
    const size = sizeOf(ch);
    if (bytes + size > 73) {
      out.push(current);
      current = ' ';
      bytes = 1;
    }
    current += ch;
    bytes += size;
  }
  out.push(current);
  return out.join('\r\n');
}

/** "2026-12-11" → "20261211" */
export function toICSDate(dateStr) {
  return String(dateStr || '').replace(/-/g, '').slice(0, 8);
}

/** 日期 + "14:45" → "20261211T144500" */
export function toICSDateTime(dateStr, time) {
  const date = toICSDate(dateStr);
  const minutes = timeToMinutes(time);
  if (!date || minutes == null) return null;
  const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mm = String(minutes % 60).padStart(2, '0');
  return `${date}T${hh}${mm}00`;
}

/** 日期往後加 n 天，回傳 "YYYYMMDD" */
export function shiftICSDate(dateStr, days) {
  const d = parseISODate(dateStr);
  if (!d) return toICSDate(dateStr);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

const VTIMEZONE_TOKYO = [
  'BEGIN:VTIMEZONE',
  'TZID:Asia/Tokyo',
  'BEGIN:STANDARD',
  'DTSTART:19700101T000000',
  'TZOFFSETFROM:+0900',
  'TZOFFSETTO:+0900',
  'TZNAME:JST',
  'END:STANDARD',
  'END:VTIMEZONE',
];

const ALARM_TYPES = new Set(['transit', 'flight']);

function eventDescription(event) {
  const parts = [];
  if (event.titleJa) parts.push(`日文：${event.titleJa}`);
  if (event.description) parts.push(event.description);
  if (event.notes) parts.push(event.notes);
  if (event.userNote) parts.push(`我的備註：${event.userNote}`);
  if (event.transferBuffer) parts.push(`轉乘：${event.transferBuffer}`);
  if (event.bufferMinutes != null) parts.push(`緩衝：約 ${event.bufferMinutes} 分鐘`);
  if (event.costYen != null) {
    parts.push(`費用：¥${event.costYen}${event.perPerson ? '／人' : ''}`);
  }
  if (event.costTotal != null) parts.push(`費用（全團）：¥${event.costTotal}`);
  if (event.statusNote) parts.push(`資料狀態：${event.statusNote}`);
  if (event.source) parts.push(`來源：${event.source}`);
  if (event.sourceUrl) parts.push(event.sourceUrl);
  parts.push('※ 規劃估算，非即時確認資訊。');
  return parts.join('\n');
}

/**
 * 產生 .ics。每天一則全天事件（當日總覽），
 * 每個有時間的事件再各自產生一則帶時區的行程，交通／航班附 30 分鐘提醒。
 *
 * @param {object} tripMeta
 * @param {Array} days
 * @param {{dtstamp?:string, alarmMinutes?:number}} [options]
 */
export function generateICS(tripMeta, days, options) {
  const opts = options || {};
  const dtstamp =
    opts.dtstamp || new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const alarmMinutes = opts.alarmMinutes == null ? 30 : opts.alarmMinutes;
  const tripName = (tripMeta && (tripMeta.title || tripMeta.name)) || 'Trave_Dec';

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Trave_Dec//Trip Companion//ZH-TW',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${icsEscape(tripName)}`,
    'X-WR-TIMEZONE:Asia/Tokyo',
    ...VTIMEZONE_TOKYO,
  ];

  (days || []).forEach((day, dayIdx) => {
    const events = sortEventsByTime(day.events);
    const dayNo = dayIndexOf(day) || dayIdx + 1;
    const dayTitle = day.title || `Day ${dayNo}`;
    const summaryBits = events.map((e) => {
      const label = e.title || e.summary || '';
      return e.time ? `${e.time} ${label}` : label;
    });

    // 當日總覽（全天）
    if (day.date) {
      lines.push(
        'BEGIN:VEVENT',
        `UID:day-${toICSDate(day.date)}@trave-dec`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART;VALUE=DATE:${toICSDate(day.date)}`,
        `DTEND;VALUE=DATE:${shiftICSDate(day.date, 1)}`,
        `SUMMARY:${icsEscape(`Day ${dayNo}｜${dayTitle}`)}`,
        `DESCRIPTION:${icsEscape(
          [
            day.subtitle,
            day.lodging
              ? `住宿：${day.lodging}${day.lodgingStatus === 'unconfirmed' ? '（未確認）' : ''}`
              : '',
            summaryBits.join('\n'),
          ]
            .filter(Boolean)
            .join('\n')
        )}`,
        day.region ? `LOCATION:${icsEscape(day.region)}` : null,
        'TRANSP:TRANSPARENT',
        'END:VEVENT'
      );
    }

    // 逐項行程
    events.forEach((event, idx) => {
      const start = toICSDateTime(day.date, event.time);
      if (!start) return;
      const startMinutes = timeToMinutes(event.time);
      const endMinutes = timeToMinutes(event.endTime);
      const end =
        endMinutes != null && endMinutes > startMinutes
          ? toICSDateTime(day.date, event.endTime)
          : toICSDateTime(day.date, minutesToTime(startMinutes + 45));

      lines.push(
        'BEGIN:VEVENT',
        `UID:${icsEscape(event.id || `d${dayNo}-${idx}`)}@trave-dec`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART;TZID=Asia/Tokyo:${start}`,
        `DTEND;TZID=Asia/Tokyo:${end}`,
        `SUMMARY:${icsEscape(event.title || event.summary || dayTitle)}`,
        `DESCRIPTION:${icsEscape(eventDescription(event))}`,
        `LOCATION:${icsEscape(event.titleJa || day.region || '')}`,
        `CATEGORIES:${icsEscape(event.type || 'activity')}`,
        event.status === 'confirmed' ? 'STATUS:CONFIRMED' : 'STATUS:TENTATIVE'
      );
      if (ALARM_TYPES.has(event.type) && alarmMinutes > 0) {
        lines.push(
          'BEGIN:VALARM',
          `TRIGGER:-PT${alarmMinutes}M`,
          'ACTION:DISPLAY',
          `DESCRIPTION:${icsEscape(`${alarmMinutes} 分鐘後：${event.title || ''}`)}`,
          'END:VALARM'
        );
      }
      lines.push('END:VEVENT');
    });
  });

  lines.push('END:VCALENDAR');

  return lines
    .filter((line) => line != null)
    .map(foldICSLine)
    .join('\r\n') + '\r\n';
}
