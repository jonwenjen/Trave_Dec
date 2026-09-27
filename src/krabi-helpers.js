/**
 * Trave_Dec — 甲米五方案比較・純函式 helper
 *
 * 全部函式皆為無副作用、可在 Node 直接測試的純邏輯。
 * 風險與費用的處理一律保守：資料缺漏時不拋錯、不假造，回退到安全值。
 */

import {
  KRABI_PLANS,
  KRABI_COMPARE_AXES,
  KRABI_FLIGHT_ESTIMATE,
  THB_TO_TWD_ASSUMED,
} from './data/krabi.js';

export { THB_TO_TWD_ASSUMED, KRABI_FLIGHT_ESTIMATE };

/* ═════════════════════════════════════════════════════════════════
   基本統計
   ═════════════════════════════════════════════════════════════════ */

/** 方案所有「有明確金額」的行程費用總和（THB）。缺欄位視為 0。 */
export function planTotalTHB(plan) {
  if (!plan || !Array.isArray(plan.days)) return 0;
  return plan.days.reduce((sum, day) => sum + (Number(day && day.costTHB) || 0), 0);
}

/** 方案行程中列出的公園費總和（THB）。 */
export function planParkFeeTHB(plan) {
  if (!plan || !Array.isArray(plan.days)) return 0;
  return plan.days.reduce((sum, day) => sum + (Number(day && day.parkFeeTHB) || 0), 0);
}

/** 浮潛點總數（讀取資料欄位，缺漏為 0）。 */
export function planSnorkelStopCount(plan) {
  return Math.max(0, Number(plan && plan.snorkelStops) || 0);
}

/** 實際出海天數：seaDay 為真且非雨備日。 */
export function planSeaDayCount(plan) {
  if (!plan || !Array.isArray(plan.days)) return 0;
  return plan.days.filter((d) => d && d.seaDay && !d.isBuffer).length;
}

/** 雨天緩衝日天數。 */
export function planBufferDayCount(plan) {
  if (!plan || !Array.isArray(plan.days)) return 0;
  return plan.days.filter((d) => d && d.isBuffer).length;
}

/** 是否需要更換住宿基地：含島上過夜即為 1 次搬運。 */
export function planBaseMoves(plan) {
  return plan && plan.overnightOnIsland ? 1 : 0;
}

/* ═════════════════════════════════════════════════════════════════
   風險
   ═════════════════════════════════════════════════════════════════ */

const RISK_RANK = { low: 1, mid: 2, 'mid-high': 3, high: 4 };

const RISK_LABEL = {
  low: '低',
  mid: '中',
  'mid-high': '中高',
  high: '高',
};

const RISK_TONE = { low: 'good', mid: 'warn', 'mid-high': 'warn', high: 'danger' };

/**
 * 風險數值排序：low < mid < mid-high < high。
 * 未知等級一律視為最高風險（保守處理），避免把壞資料誤判成安全。
 */
export function planRiskRank(level) {
  return RISK_RANK[level] || RISK_RANK.high;
}

/** 風險的中文標籤；未知等級回退為「高」。 */
export function planRiskLabel(level) {
  return RISK_LABEL[level] || RISK_LABEL.high;
}

/** 風險對應的色調（good / warn / danger），供 UI 決定徽章配色。 */
export function planRiskTone(level) {
  return RISK_TONE[level] || RISK_TONE.high;
}

/** 由整個 plan 物件取色調。 */
export function riskToneOf(plan) {
  return planRiskTone(plan && plan.riskLevel);
}

/* ═════════════════════════════════════════════════════════════════
   挑選與排序
   ═════════════════════════════════════════════════════════════════ */

const PLANS = Array.isArray(KRABI_PLANS) ? KRABI_PLANS : [];

/** 依 id 或 tag 查找方案；查無回 null。 */
export function findPlan(key) {
  if (!key) return null;
  const k = String(key).toLowerCase();
  return PLANS.find((p) => p.id.toLowerCase() === k || p.tag.toLowerCase() === k) || null;
}

/** 浮潛點最多的方案。 */
export function bestSnorkelPlan() {
  return PLANS.reduce((best, p) => (planSnorkelStopCount(p) > planSnorkelStopCount(best) ? p : best), PLANS[0]);
}

/** 雨季風險最低的方案。 */
export function lowestRiskPlan() {
  return PLANS.reduce((best, p) => (planRiskRank(p.riskLevel) < planRiskRank(best.riskLevel) ? p : best), PLANS[0]);
}

/** 前季團費（不含機票）最低的方案。 */
export function cheapestPlan() {
  return PLANS.reduce(
    (best, p) => ((p.estimateTHB.min < best.estimateTHB.min ? p : best)),
    PLANS[0],
  );
}

/**
 * 依 keyfn 排序；傳入 comparator 時採用之。不改動原陣列。
 * @param {Array} plans
 * @param {(p:any)=>number} keyfn
 * @param {(a:any,b:any)=>number} [comparator]
 */
export function sortedPlansBy(plans, keyfn, comparator) {
  const copy = [...(plans || [])];
  if (typeof comparator === 'function') {
    return copy.sort(comparator);
  }
  return copy.sort((a, b) => keyfn(a) - keyfn(b));
}

/** value 佔 max 的百分比，整數 0–100；max 為 0 時回 0（不除零）。 */
export function percentOfMax(value, max) {
  const v = Number(value) || 0;
  const m = Number(max) || 0;
  if (m <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((v / m) * 100)));
}

/* ═════════════════════════════════════════════════════════════════
   費用試算
   ═════════════════════════════════════════════════════════════════ */

/** 人數夾在 1–20；壞值（例如 NaN）回 1。 */
export function normalizeTravelerCount(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(20, n);
}

/** THB → TWD（套用可調整的假設匯率），四捨五入至整數。 */
export function thbToTwd(thb, rate) {
  const r = Number.isFinite(Number(rate)) ? Number(rate) : THB_TO_TWD_ASSUMED;
  return Math.round((Number(thb) || 0) * r);
}

/**
 * 單人費用試算。
 * @param {object} plan
 * @param {number} travelers 人數（影響區間上界的分攤示意）
 * @param {{includeFlight?: boolean, rate?: number}} [opts]
 * @returns {{min:number, max:number, rate:number, includeFlight:boolean}}
 */
export function planCostTwd(plan, travelers, opts = {}) {
  const rate = Number.isFinite(Number(opts.rate)) ? Number(opts.rate) : THB_TO_TWD_ASSUMED;
  const includeFlight = Boolean(opts.includeFlight);
  const n = normalizeTravelerCount(travelers);

  const est = (plan && plan.estimateTHB) || { min: 0, max: 0 };
  // 多人分攤以每人的上界示意遞減（船票／住宿可攤），下限不變。
  const shareFactor = n > 1 ? 0.85 + 0.15 / n : 1;
  const minTHB = (Number(est.min) || 0) * shareFactor;
  const maxTHB = (Number(est.max) || 0) * shareFactor;

  // 團費為 THB，需換算為 TWD；機票本來就是 TWD，直接相加不再換算。
  let minTWD = minTHB * rate;
  let maxTWD = maxTHB * rate;

  if (includeFlight) {
    minTWD += Number(KRABI_FLIGHT_ESTIMATE.minTWD) || 0;
    maxTWD += Number(KRABI_FLIGHT_ESTIMATE.maxTWD) || 0;
  }

  return { min: Math.round(minTWD), max: Math.round(maxTWD), rate, includeFlight };
}

/** 全團費用總計 = 單人費用 × 人數。 */
export function estimateGroupTotalTwd(plan, travelers, opts) {
  const n = normalizeTravelerCount(travelers);
  const per = planCostTwd(plan, n, opts);
  return { min: per.min * n, max: per.max * n, perPerson: per, travelers: n };
}

/**
 * 依人數分攤一筆 THB 金額；餘數留在最後一份，確保總和一致。
 * 人數非法時回傳原值單一元素。
 */
export function splitTHB(amount, travelers) {
  const total = Math.round(Number(amount) || 0);
  const n = normalizeTravelerCount(travelers);
  if (n === 1) return [total];
  if (travelers === undefined || Number(travelers) < 1) return [total];

  const base = Math.floor(total / n);
  const remainder = total - base * n;
  const parts = new Array(n).fill(base);
  parts[n - 1] = base + remainder;
  return parts;
}

/* ═════════════════════════════════════════════════════════════════
   比較矩陣
   ═════════════════════════════════════════════════════════════════ */

/** 某方案的單一比較軸數值。 */
export function axisValue(plan, key) {
  switch (key) {
    case 'snorkel':
      return planSnorkelStopCount(plan);
    case 'seaDays':
      return planSeaDayCount(plan);
    case 'islandStay':
      return plan.overnightOnIsland ? 1 : 0;
    case 'baseMoves':
      return planBaseMoves(plan);
    case 'risk':
      return planRiskRank(plan.riskLevel);
    case 'flexibility':
      return Number(plan.flexibilityScore) || 0;
    case 'cost':
      return Number(plan.estimateTHB && plan.estimateTHB.min) || 0;
    default:
      return 0;
  }
}

/** 軸值的顯示文字。 */
export function axisDisplay(plan, key) {
  switch (key) {
    case 'snorkel':
      return `${planSnorkelStopCount(plan)} 點`;
    case 'seaDays':
      return `${planSeaDayCount(plan)} 天`;
    case 'islandStay':
      return plan.overnightOnIsland ? '有' : '無';
    case 'baseMoves':
      return planBaseMoves(plan) ? `${planBaseMoves(plan)} 次` : '不需搬運';
    case 'risk':
      return `${planRiskLabel(plan.riskLevel)}${plan.riskNote ? `（${plan.riskNote}）` : ''}`;
    case 'flexibility':
      return plan.flexibilityLabel || `${Number(plan.flexibilityScore) || 0}/5`;
    case 'cost':
      return `฿${(plan.estimateTHB.min || 0).toLocaleString('en-US')}–${(plan.estimateTHB.max || 0).toLocaleString('en-US')}`;
    default:
      return '—';
  }
}

/**
 * 輸出每個軸、每個方案的比較列。
 * @returns {Array<{key:string,label:string,hint?:string,betterWhen?:string,best?:string,values:Array<{tag:string,value:number,display:string}>}>}
 */
export function comparePlans(plans, axes) {
  const list = plans || PLANS;
  const axisList = axes || KRABI_COMPARE_AXES;
  return axisList.map((axis) => ({
    key: axis.key,
    label: axis.label,
    hint: axis.hint,
    betterWhen: axis.betterWhen,
    values: list.map((plan) => ({
      tag: plan.tag,
      value: axisValue(plan, axis.key),
      display: axisDisplay(plan, axis.key),
    })),
  }));
}

/**
 * 同上，但額外標出每個軸的最佳方案。
 * betterWhen='high' 取最大值、'low' 取最小值、'either' 不標最佳。
 */
export function computeCompareMatrix(plans, axes) {
  const rows = comparePlans(plans, axes);
  return rows.map((row) => {
    if (row.betterWhen === 'either' || row.values.length === 0) {
      return { ...row, best: null };
    }
    const best = row.values.reduce((acc, v) => {
      if (!acc) return v;
      if (row.betterWhen === 'low') return v.value < acc.value ? v : acc;
      return v.value > acc.value ? v : acc;
    }, null);
    return { ...row, best: best ? best.tag : null };
  });
}

/**
 * 依使用情境給出主推方案與備選。
 * goal: 'snorkel' | 'safety' | 'value' | 'cost' | 其他
 */
export function recommendPlans(plans, opts = {}) {
  const list = plans && plans.length ? plans : PLANS;
  const goal = opts.goal;

  let primary = list[0];
  let reason = '';

  if (goal === 'snorkel') {
    primary = bestSnorkelPlan();
    reason = `浮潛點最多（${planSnorkelStopCount(primary)} 點），${planSeaDayCount(primary)} 天出海，是把時間全給海的設計。`;
  } else if (goal === 'safety') {
    primary = lowestRiskPlan();
    reason = `雨季風險最低（${planRiskLabel(primary.riskLevel)}），出海天數最少，錢多花在能改期的部分。`;
  } else if (goal === 'value' || goal === 'cost') {
    primary = cheapestPlan();
    reason = `前季團費最低（฿${primary.estimateTHB.min.toLocaleString('en-US')} 起），出海 ${planSeaDayCount(primary)} 天。`;
  } else {
    primary = bestSnorkelPlan();
    reason = `未指定情境，預設以浮潛點數最多者為主推。`;
  }

  // 備選：去掉主推後依需求排序取前 2 名。
  const others = list.filter((p) => p.tag !== primary.tag);
  const score = (p) => {
    if (goal === 'safety') return -planRiskRank(p.riskLevel);
    if (goal === 'value' || goal === 'cost') return p.estimateTHB.min;
    return planSnorkelStopCount(p);
  };
  const alternatives = [...others].sort((a, b) => score(a) - score(b)).slice(0, 2);

  return { primary, alternatives, goal: goal || 'snorkel', reason };
}

/* ═════════════════════════════════════════════════════════════════
   待查證清單
   ═════════════════════════════════════════════════════════════════ */

/** 清單完成度；total 為 0 時不除零。 */
export function estimateChecklistProgress(checked, total) {
  const done = Array.isArray(checked) ? checked.length : 0;
  const t = Number(total) || 0;
  if (t <= 0) return { done: 0, total: 0, percent: 0 };
  const percent = Math.max(0, Math.min(100, Math.round((done / t) * 100)));
  return { done, total: t, percent };
}

/** 切換勾選狀態；回傳新陣列，不修改原陣列。 */
export function toggleChecklistItem(checked, id) {
  const list = Array.isArray(checked) ? [...checked] : [];
  const index = list.indexOf(id);
  if (index >= 0) {
    list.splice(index, 1);
  } else {
    list.push(id);
  }
  return list;
}


/* ═════════════════════════════════════════════════════════════════
   2026/27 ENSO 衝擊評估 — 純函式
   資料來源見 src/data/krabi-climate.js
   ═════════════════════════════════════════════════════════════════ */

import {
  ENSO_CURRENT,
  ENSO_IMPACT_ANALYSIS,
  DATE_WINDOWS as CLIMATE_DATE_WINDOWS,
  WINDOW_AXES as CLIMATE_WINDOW_AXES,
} from './data/krabi-climate.js';
import {
  KRABI_PLANS_APRIL,
  APRIL_PARK_FEES as _APRIL_FEES,
} from './data/krabi-april.js';

export {
  ENSO_CURRENT,
  ENSO_IMPACT_ANALYSIS,
  CLIMATE_DATE_WINDOWS as DATE_WINDOWS,
  CLIMATE_WINDOW_AXES as WINDOW_AXES,
  KRABI_PLANS_APRIL,
};

/** 非數值欄位的正規化對照（供比較與顯示用） */
const WINDOW_STATE_SCORE = {
  similanStatus: { 'in-season': 5, 'late-season': 3, closed: 1 },
  songkranImpact: { none: 5, residual: 3, direct: 1 },
};

const WINDOW_STATE_LABEL = {
  similanStatus: { 'in-season': '季內', 'late-season': '季末風險', closed: '關閉' },
  songkranImpact: { none: '無影響', residual: '節後餘波', direct: '正面撞上' },
};

/**
 * 單一窗口某一軸的 0–100 分數。
 *
 * 兩類軸都必須正規化成同一個尺度再平均——這裡曾有 bug：字串狀態軸
 * （Similan 季內、宋干節影響）直接回傳 0–5 的原始碼值，卻被 windowScore
 * 當成 0–100 使用，導致這兩項決定性優勢的權重只有數字軸的四分之一。
 */
function windowAxisScore(value, axis) {
  const table = WINDOW_STATE_SCORE[axis.key];
  if (table) {
    const raw = table[value] ?? 0; // 0–5
    return Math.round(((raw - 1) / 4) * 100);
  }
  const n = Number(value) || 0;
  // 1–5 正規化為 0–100
  return Math.round(((Math.max(1, Math.min(5, n)) - 1) / 4) * 100);
}

function windowAxisDisplay(w, axis) {
  const table = WINDOW_STATE_LABEL[axis.key];
  if (table) return table[w[axis.key]] ?? '—';
  return `${w[axis.key]} / 5`;
}

/**
 * 單一日期窗口的綜合評分。
 * 每個軸依 betterWhen 轉成 0–100，總分為平均。
 * @returns {{total:number, byAxis:Object<string,number>}}
 */
export function windowScore(w, axes) {
  if (!w) return { total: 0, byAxis: {} };
  const axisList = axes || CLIMATE_WINDOW_AXES;
  const byAxis = {};
  let sum = 0;
  let n = 0;

  for (const axis of axisList) {
    const raw = windowAxisScore(w[axis.key], axis);
    const score = axis.betterWhen === 'low' ? 100 - raw : raw;
    byAxis[axis.key] = score;
    sum += score;
    n += 1;
  }

  return { total: n ? Math.round(sum / n) : 0, byAxis };
}

/** 推薦的日期窗口（資料中僅一個標為 recommended） */
export function recommendedWindow() {
  return CLIMATE_DATE_WINDOWS.find((w) => w.recommended) || CLIMATE_DATE_WINDOWS[0];
}

/** 單一軸的最佳窗口；either 軸不參與，回傳 null */
export function bestWindowForAxis(key, axes) {
  const axis = (axes || CLIMATE_WINDOW_AXES).find((a) => a.key === key);
  if (!axis || axis.betterWhen === 'either') return null;
  return CLIMATE_DATE_WINDOWS.reduce((best, w) => {
    const a = windowAxisScore(w[key], axis);
    const b = windowAxisScore(best[key], axis);
    return axis.betterWhen === 'low' ? (a < b ? w : best) : (a > b ? w : best);
  }, CLIMATE_DATE_WINDOWS[0]).id;
}

/**
 * 比較矩陣：每個軸 × 每個窗口，並標出最佳。
 * @returns {Array<{key,label,hint?,betterWhen,best:?string,values:Array<{id,score,display}>}>}
 */
export function compareWindows(windows, axes) {
  const list = windows || CLIMATE_DATE_WINDOWS;
  const axisList = axes || CLIMATE_WINDOW_AXES;

  return axisList.map((axis) => {
    const values = list.map((w) => ({
      id: w.id,
      label: w.label,
      score: windowAxisScore(w[axis.key], axis),
      display: windowAxisDisplay(w, axis),
    }));
    let best = null;
    if (axis.betterWhen !== 'either' && values.length) {
      const reduceBy = axis.betterWhen === 'low' ? 'min' : 'max';
      const pick = values.reduce((acc, v) => {
        if (!acc) return v;
        if (reduceBy === 'min') return v.score < acc.score ? v : acc;
        return v.score > acc.score ? v : acc;
      }, null);
      best = pick ? pick.id : null;
    }
    return {
      key: axis.key,
      label: axis.label,
      hint: axis.hint,
      betterWhen: axis.betterWhen,
      best,
      values,
    };
  });
}

/** 依方向取出 ENSO 影響（favourable / adverse / unclear） */
export function impactByDirection(direction) {
  return ENSO_IMPACT_ANALYSIS.effects.filter((e) => e.direction === direction);
}

/** 一段可直接顯示的 ENSO 摘要 */
export function summarizeEnso() {
  return (
    `${ENSO_IMPACT_ANALYSIS.headline}。` +
    `NOAA 於 ${ENSO_CURRENT.issuedDate} 發布診斷：${ENSO_CURRENT.summary}` +
    `但須注意：${ENSO_IMPACT_ANALYSIS.caveats[0]}`
  );
}

/**
 * 依日期判斷 El Niño 下的高溫風險。
 * 4 月下旬至 5 月初為最高（El Niño 峰值後的熱帶高溫）。
 */
export function heatRiskLevel(isoDate) {
  const s = String(isoDate || '');
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return 'unknown';
  const month = Number(m[2]);
  const day = Number(m[3]);

  if (month === 4) {
    if (day <= 15) return 'moderate';
    return 'high';
  }
  if (month === 5) {
    if (day <= 10) return 'high';
    return 'moderate';
  }
  if (month >= 3) return 'moderate';
  return 'low';
}

/** 4 月方案中，哪些確實含 Similan */
export function aprilPlansWithSimilan() {
  return KRABI_PLANS_APRIL.filter((p) => JSON.stringify(p).includes('Similan'));
}

/**
 * 4 月方案的秘境可達性評分（0–5）。
 * 以是否提及 Trang 群島的秘境為依據。
 */
export function aprilPlanSecretScore(plan) {
  if (!plan) return 0;
  const text = JSON.stringify(plan);
  const markers = ['Koh Mook', 'Koh Kradan', 'Koh Chueak', 'Koh Ngai', 'Koh Libong', '翡翠洞', 'Trang'];
  let hits = 0;
  for (const m of markers) if (text.includes(m)) hits += 1;
  return Math.min(5, hits);
}

/** Similan 季節窗口查證（開放季前季為 10/15–5/15） */
export function verifySimilanWindow(isoDate) {
  const s = String(isoDate || '');
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) {
    return { inSeason: false, note: '日期格式無法解析，請確認後再查證。' };
  }
  const month = Number(m[2]);
  const day = Number(m[3]);
  const md = month * 100 + day;

  // 10/15 – 隔年 5/15
  if (md >= 1015 || md <= 515) {
    const late = md > 501 && md <= 515;
    return {
      inSeason: true,
      note: late
        ? '仍在季內，但已接近 5/15 季末，出發前務必確認 2026–27 季的確切公告。'
        : '在季內（10/15–5/15），2027 年確切開放日須以官方公告為準。',
    };
  }
  return {
    inSeason: false,
    note: '已過前季開放期（10/15–5/15），2026–27 季的確切起訖日須查證。',
  };
}

/** 4 月方案的公園費總和 */
export function totalParkFeeByPlan(plan) {
  if (!plan || !Array.isArray(plan.days)) return 0;
  return plan.days.reduce((sum, d) => sum + (Number(d && d.parkFeeTHB) || 0), 0);
}


/* ═════════════════════════════════════════════════════════════════
   六案重評 — 純函式
   資料見 src/data/krabi-plans-v2.js 與 src/data/krabi-regulations.js
   ═════════════════════════════════════════════════════════════════ */

import {
  KRABI_PLANS_V2,
  MARINE_AREAS,
  EXCLUDED_AREAS,
  SIX_PLAN_AXES,
  PLAN_LEGAL_NOTES,
} from './data/krabi-plans-v2.js';
import { COMPLIANCE_CHECKLIST } from './data/krabi-regulations.js';

export {
  KRABI_PLANS_V2,
  MARINE_AREAS,
  EXCLUDED_AREAS,
  SIX_PLAN_AXES,
  PLAN_LEGAL_NOTES,
};

/** 依 id 取得海洋區；未知 id 安全降級為 null */
export function marineAreaById(id) {
  if (!id) return null;
  return MARINE_AREAS.find((a) => a.id === id) || null;
}

/** 方案涵蓋的海洋區名稱（中英並列） */
export function planMarineAreaIds(plan) {
  if (!plan || !Array.isArray(plan.marineAreas)) return [];
  return plan.marineAreas
    .map((id) => marineAreaById(id))
    .filter(Boolean)
    .map((a) => `${a.zh}（${a.name}）`);
}

export function planCoversSimilan(plan) {
  return Boolean(plan && Array.isArray(plan.marineAreas) && plan.marineAreas.includes('similan'));
}

export function planCoversEmeraldCave(plan) {
  return Boolean(plan && Array.isArray(plan.marineAreas) && plan.marineAreas.includes('trang'));
}

export function planRequiresFerry(plan) {
  if (!plan) return false;
  if (Array.isArray(plan.marineAreas) && plan.marineAreas.includes('koh-lanta')) return true;
  // 普吉方案：住 Koh Yao Noi 需以快艇往返碼頭，性質等同渡輪轉移
  if (Array.isArray(plan.marineAreas) && plan.marineAreas.includes('koh-yao')) return true;
  return false;
}

/**
 * 是否需要陸路轉移。
 * 注意：涵蓋 Trang 不等於需要陸路——直飛 Trang（TST）的方案從 Trang 直接出海，
 * 只有先飛甲米再南下者才需陸路。以基地位置判斷，而非以海域判斷。
 */
export function planRequiresLandTransfer(plan) {
  if (!plan) return false;
  const base = String(plan.base || '');
  const areas = Array.isArray(plan.marineAreas) ? plan.marineAreas : [];
  // 甲米：基地在甲米／Ao Nang 且要下 Trang → 需陸路
  const basedInKrabi = /Ao Nang|Krabi|甲米/i.test(base) && !/^Trang/.test(base.trim());
  if (basedInKrabi && areas.includes('trang')) return true;
  // 普吉：住普吉但要去 Khao Lak 出 Similan → 需陸路南下 2.5–3 小時
  if (/普吉|Phuket/i.test(base) && areas.includes('similan')) return true;
  return false;
}

/** 海上天數：由 days 旗標推導，不另存宣告欄位 */
export function planSeaDayCountV2(plan) {
  if (!plan || !Array.isArray(plan.days)) return 0;
  return plan.days.filter((d) => d && d.seaDay && !d.isBuffer).length;
}

/** 公園費合計（由 days 的 parkFeeTHB 推導） */
export function planParkFeeTotalV2(plan) {
  if (!plan || !Array.isArray(plan.days)) return 0;
  return plan.days.reduce((sum, d) => sum + (Number(d && d.parkFeeTHB) || 0), 0);
}

function normalize(v) {
  const n = Number(v) || 0;
  return (Math.max(1, Math.min(5, n)) - 1) / 4;
}

/**
 * 自由潛水可行性 0–5。
 * 住島上（能反覆練習）與教練推薦點位是主要依據。
 */
export function planFreediveScore(plan) {
  if (!plan) return 0;
  const text = JSON.stringify(plan);
  let score = 1;
  if (plan.marineAreas.includes('koh-lanta')) score += 2; // 住島上可反覆練習
  if (text.includes('Koh Haa') || text.includes('Koh Bida')) score += 1; // 教練推薦點位
  if (text.includes('導潛')) score += 1;
  return Math.min(5, score);
}

/**
 * 法規負擔 0–5（數字越高代表越麻煩）。
 *
 * 設計原則：行前確認成本是**固定的**——不論涵蓋幾個公園，都要查一遍規定、
 * 選業者、確認救生衣與督導。真正增加成本的是「點位本身的額外要求」
 * （翡翠洞的潮汐與 dive light）與「跨公園轉移」。
 *
 * 早期版本用 marineAreas.length 線性累加，導致「只去一個海域」自動拿滿分、
 * 把真正有內容的多區方案壓下去——那是評分權重設計錯誤，不是方案較差。
 */
export function planLegalBurden(plan) {
  if (!plan) return 0;
  let burden = 0.5; // 行前確認的固定基數
  if (planCoversEmeraldCave(plan)) burden += 1.5; // 潮汐時段 + dive light + 頭頂受限
  if (planCoversSimilan(plan)) burden += 0.5; // 國家公園專屬的深度與人數規定
  if (planRequiresLandTransfer(plan)) burden += 0.5; // 跨公園轉移
  return Math.min(5, burden);
}

/** 體力友善 1–5：5 = 零移動 */
export function planEffortScore(plan) {
  if (!plan) return 0;
  let load = 0;
  if (planRequiresLandTransfer(plan)) load += 2;
  if (planRequiresFerry(plan)) load += 1;
  const sea = planSeaDayCountV2(plan);
  if (sea >= 5) load += 1;
  return Math.max(1, 5 - load);
}

/** 能見度機會 1–5：含 Similan 或 Koh Rok 加分 */
export function planVisibilityScore(plan) {
  if (!plan) return 0;
  const text = JSON.stringify(plan);
  let score = 2;
  if (planCoversSimilan(plan)) score += 2;
  if (text.includes('Koh Rok')) score += 1;
  return Math.min(5, score);
}

/** 人少程度 1–5：秘境加分、團客多的點位扣分 */
export function planSecrecyScore(plan) {
  if (!plan) return 0;
  const text = JSON.stringify(plan);
  let score = 3;
  if (planCoversEmeraldCave(plan)) score += 2;
  if (text.includes('Koh Yawabon')) score += 1;
  if (plan.marineAreas.includes('phi-phi')) score -= 2;
  if (plan.marineAreas.length >= 4) score -= 1;
  return Math.max(1, Math.min(5, score));
}

/** 成本效率 1–5：費用越低越高 */
export function planCostEfficiency(plan) {
  if (!plan || !plan.estimateTHB) return 0;
  const mid = (plan.estimateTHB.min + plan.estimateTHB.max) / 2;
  // 10,250 = 5 分；15,000 = 1 分（線性對映後夾在 1–5）
  const score = 5 - ((mid - 10250) / (15000 - 10250)) * 4;
  return Math.max(1, Math.min(5, score));
}

/** 法規輕鬆度 1–5：與 legalBurden 相反 */
export function planLegalEase(plan) {
  if (!plan) return 0;
  return Math.max(1, Math.min(5, 6 - planLegalBurden(plan)));
}

function axisRawValue(plan, key) {
  switch (key) {
    case 'marineAreas': return Array.isArray(plan.marineAreas) ? plan.marineAreas.length : 0;
    case 'seaDays': return planSeaDayCountV2(plan);
    case 'visibility': return planVisibilityScore(plan);
    case 'secrecy': return planSecrecyScore(plan);
    case 'effort': return planEffortScore(plan);
    case 'legalEase': return planLegalEase(plan);
    case 'freedive': return planFreediveScore(plan);
    case 'cost': return planCostEfficiency(plan);
    default: return 0;
  }
}

function axisDisplayV2(plan, key) {
  switch (key) {
    case 'marineAreas': return `${(plan.marineAreas || []).length} 區`;
    case 'seaDays': return `${planSeaDayCountV2(plan)} 天`;
    case 'visibility': return `${planVisibilityScore(plan)} / 5`;
    case 'secrecy': return `${planSecrecyScore(plan)} / 5`;
    case 'effort': return `${planEffortScore(plan)} / 5`;
    case 'legalEase': return `${planLegalEase(plan)} / 5`;
    case 'freedive': return `${planFreediveScore(plan)} / 5`;
    case 'cost': return `฿${plan.estimateTHB.min.toLocaleString('en-US')}–${plan.estimateTHB.max.toLocaleString('en-US')}`;
    default: return '—';
  }
}

/**
 * 六案綜合評分：每軸轉 0–100 後取平均。
 * @returns {{total:number, byAxis:Object<string,number>}}
 */
export function planScoreTotal(plan, axes) {
  if (!plan) return { total: 0, byAxis: {} };
  const list = axes || SIX_PLAN_AXES;
  const byAxis = {};
  let sum = 0;
  for (const axis of list) {
    const v = Math.round(normalize(axisRawValue(plan, axis.key)) * 100);
    byAxis[axis.key] = v;
    sum += v;
  }
  return { total: list.length ? Math.round(sum / list.length) : 0, byAxis };
}

/**
 * 六案比較矩陣，每軸標出最佳方案。
 * @returns {Array<{key,label,hint?,betterWhen,best:?string,values:Array<{tag,value,display}>}>}
 */
export function comparePlanV2(plans, axes) {
  const list = plans && plans.length ? plans : KRABI_PLANS_V2;
  const axisList = axes || SIX_PLAN_AXES;

  return axisList.map((axis) => {
    const values = list.map((p) => ({
      tag: p.tag,
      value: axisRawValue(p, axis.key),
      display: axisDisplayV2(p, axis.key),
    }));
    let best = null;
    if (axis.betterWhen !== 'either' && values.length) {
      let pick = values[0];
      for (const v of values.slice(1)) {
        if (axis.betterWhen === 'high' ? v.value > pick.value : v.value < pick.value) pick = v;
      }
      best = pick ? pick.tag : null;
    }
    return { key: axis.key, label: axis.label, hint: axis.hint, betterWhen: axis.betterWhen, best, values };
  });
}

/** 單一軸的最佳方案 tag；either 軸回傳 null */
export function bestPlanForAxis(key, axes) {
  const axis = (axes || SIX_PLAN_AXES).find((a) => a.key === key);
  if (!axis || axis.betterWhen === 'either') return null;
  let best = null;
  for (const p of KRABI_PLANS_V2) {
    if (!best) { best = p; continue; }
    const a = axisRawValue(p, key);
    const b = axisRawValue(best, key);
    if (axis.betterWhen === 'high' ? a > b : a < b) best = p;
  }
  return best ? best.tag : null;
}

/**
 * 依方案內容產生適用的法規檢查項。
 * 共通項（法規要求）＋ 依涵蓋海域追加的項目。
 */
export function checkPlanCompliance(plan) {
  if (!plan) return { items: [], passRate: 0 };
  const areas = Array.isArray(plan.marineAreas) ? plan.marineAreas : [];
  const items = COMPLIANCE_CHECKLIST.filter((c) => {
    if (c.key === 'tide-check') return areas.includes('trang');
    if (c.key === 'dive-light') return areas.includes('trang');
    return true;
  }).map((c) => ({ ...c }));

  // 涵蓋公園數直接影響法規確認量
  if (areas.length > 1) {
    items.push({
      key: 'multi-park-rules',
      phase: '下水前',
      label: `確認 ${areas.length} 個公園各自的額外規定`,
      detail: areas.map((id) => (marineAreaById(id) || {}).authority).filter(Boolean).join('；'),
    });
  }
  return { items, passRate: compliancePassRate(plan) };
}

/** 合規準備度：以涵蓋公園數推估，公園少者較輕鬆（0–1） */
export function compliancePassRate(plan) {
  if (!plan) return 0;
  const areas = Array.isArray(plan.marineAreas) ? plan.marineAreas.length : 0;
  if (areas === 0) return 0;
  return Math.round((1 / (1 + (areas - 1) * 0.35)) * 100) / 100;
}

/** 六案費用換算為 TWD（不含機票） */
export function planCostTwdV2(plan) {
  if (!plan || !plan.estimateTHB) return null;
  const rate = THB_TO_TWD_ASSUMED;
  return {
    min: Math.round(plan.estimateTHB.min * rate),
    max: Math.round(plan.estimateTHB.max * rate),
    rate,
    rateIsAssumption: true,
  };
}

/** 六案團費試算（每人 × 人數） */
export function estimateGroupTotalTwdV2(plan, travelers, opts = {}) {
  const per = planCostTwdV2(plan);
  if (!per) return null;
  const n = Math.max(1, Number(travelers) || 1);
  const includeFlight = Boolean(opts.includeFlight);
  const flight = includeFlight ? KRABI_FLIGHT_ESTIMATE : null;
  return {
    travelers: n,
    includeFlight,
    perPerson: {
      min: per.min + (flight ? flight.min : 0),
      max: per.max + (flight ? flight.max : 0),
    },
    min: (per.min + (flight ? flight.min : 0)) * n,
    max: (per.max + (flight ? flight.max : 0)) * n,
    rate: per.rate,
  };
}
