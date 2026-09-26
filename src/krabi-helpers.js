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
