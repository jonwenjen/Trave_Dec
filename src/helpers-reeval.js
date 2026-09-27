/**
 * Trave_Dec — 2027/03/29 – 04/05 重評 helpers
 *
 * 這裡刻意不做的一件事：不假裝價格精確。所有區間都標明寬度，
 * 因為寬度本身就是資訊——機票最寬（訂票時點影響數千元），餐費最窄。
 */

import {
  PLANS,
  DESTINATIONS,
  LODGING,
  FOOD,
  FLIGHT_OPTIONS,
  TRIP_WINDOW,
  EXTREME_PLAN_ID,
  THB_TO_TWD_ASSUMED,
} from './data/reeval.js';

export { PLANS, DESTINATIONS, FLIGHT_OPTIONS, TRIP_WINDOW, EXTREME_PLAN_ID };

const range = (min, max) => ({ min: Math.round(min), max: Math.round(max) });

/* ───────────── 結構 ───────────── */

/** 完整白天數（雙向夜航 → 7 天） */
export function planDays(plan) {
  return plan.days.length;
}

/** 出海天數 */
export function planSeaDays(plan) {
  return plan.days.filter((d) => d.sea).length;
}

/** 不重複的點位數 */
export function planIslandCount(plan) {
  return new Set(plan.days.flatMap((d) => d.spots || [])).size;
}

/** 基地（住宿地點）數 */
export function planBaseAreas(plan) {
  const bases = new Set(plan.days.map((d) => d.base).filter(Boolean));
  return Math.max(1, bases.size + (plan.bases || 1) - 1);
}

/** 該方案涵蓋的點位資料 */
export function planSpots(plan) {
  const ids = new Set(plan.days.flatMap((d) => d.spots || []));
  return [...ids].map((id) => ({ id, ...DESTINATIONS[id] })).filter((x) => x.name);
}

/* ───────────── 價格 ───────────── */

/** 機票來回（每人 TWD，含托運 20kg） */
export function flightTHB(plan) {
  if (!plan) return { min: 0, max: 0 };
  const f = FLIGHT_OPTIONS;
  return range(f.roundTripTWD.min, f.roundTripTWD.max);
}

/** 托運行李 20kg 來回（每人 TWD） */
export function baggageTHB() {
  const f = FLIGHT_OPTIONS;
  return range(f.baggageTWD.min, f.baggageTWD.max);
}

/** 船資（整團 THB） */
export function boatTHB(plan) {
  if (!plan || !plan.boatTHB) return { min: 0, max: 0 };
  return range(plan.boatTHB.min, plan.boatTHB.max);
}

/** 住宿（整團 THB） */
export function lodgingTHB(plan) {
  if (!plan || !plan.lodgingTHB) return { min: 0, max: 0 };
  return range(plan.lodgingTHB.min, plan.lodgingTHB.max);
}

/** 公園費（整團 THB） */
export function parkFeeTHB(plan) {
  if (!plan || typeof plan.parkFeeTHB !== 'number') return { min: 0, max: 0 };
  return range(plan.parkFeeTHB, plan.parkFeeTHB);
}

/** 餐費（每人 THB） */
export function foodTHB(plan) {
  if (!plan) return { min: 0, max: 0 };
  const level = FOOD[plan.foodLevel] || FOOD.mid;
  const days = planDays(plan);
  return range(
    level.thbPerDay.min * days,
    level.thbPerDay.max * days,
  );
}

/** 課程費（自由潛水方案專用，每人 THB） */
export function courseTHB(plan) {
  if (!plan || !plan.courseFeeTHB) return { min: 0, max: 0 };
  return range(plan.courseFeeTHB.min, plan.courseFeeTHB.max);
}

/** 每人總額（THB），以「兩人同行」為前提 */
export function planTotalTHBPerPerson(plan, travelers = 2) {
  if (!plan) return { min: 0, max: 0 };
  const n = Math.max(1, Number(travelers) || 1);
  const f = flightTHB(plan);
  const g = baggageTHB();
  const b = boatTHB(plan);
  const l = lodgingTHB(plan);
  const pk = parkFeeTHB(plan);
  const d = foodTHB(plan);
  const c = courseTHB(plan);
  return range(
    f.min + g.min + c.min + (b.min + l.min + pk.min) / n + d.min,
    f.max + g.max + c.max + (b.max + l.max + pk.max) / n + d.max,
  );
}

/** 每人總額（TWD） */
export function planTotalTWDPerPerson(plan, travelers = 2) {
  const t = planTotalTHBPerPerson(plan, travelers);
  return range(t.min * THB_TO_TWD_ASSUMED, t.max * THB_TO_TWD_ASSUMED);
}

/** 分項明細（THB） */
export function planBreakdown(plan, travelers = 2) {
  if (!plan) return null;
  const n = Math.max(1, Number(travelers) || 1);
  const b = boatTHB(plan);
  const l = lodgingTHB(plan);
  const pk = parkFeeTHB(plan);
  const d = foodTHB(plan);
  const f = flightTHB(plan);
  const g = baggageTHB();
  const c = courseTHB(plan);
  return {
    flight: f,
    baggage: g,
    course: c,
    boats: range(b.min / n, b.max / n),
    lodging: range(l.min / n, l.max / n),
    parkFee: range(pk.min / n, pk.max / n),
    food: d,
    totalTHB: range(
      f.min + g.min + c.min + (b.min + l.min + pk.min) / n + d.min,
      f.max + g.max + c.max + (b.max + l.max + pk.max) / n + d.max,
    ),
    totalTWD: range(
      (f.min + g.min + c.min + (b.min + l.min + pk.min) / n + d.min) * THB_TO_TWD_ASSUMED,
      (f.max + g.max + c.max + (b.max + l.max + pk.max) / n + d.max) * THB_TO_TWD_ASSUMED,
    ),
    travelers: n,
    lodgingLabel: (plan.lodgingTHB ? '依方案' : '—'),
  };
}

/* ───────────── 比較 ───────────── */

export function allPlans() {
  return PLANS;
}

/** 全部方案依每人費用由低到高 */
export function plansByPrice(travelers = 2) {
  return [...PLANS].sort(
    (a, b) => planTotalTHBPerPerson(a, travelers).max - planTotalTHBPerPerson(b, travelers).max,
  );
}

export function cheapestPlan(travelers = 2) {
  const p = plansByPrice(travelers)[0];
  return { plan: p, totalTHB: planTotalTHBPerPerson(p, travelers) };
}

export function mostExpensivePlan(travelers = 2) {
  const p = plansByPrice(travelers).at(-1);
  return { plan: p, totalTHB: planTotalTHBPerPerson(p, travelers) };
}

/** 全程極致跳島方案 */
export function extremePlan() {
  return PLANS.find((p) => p.id === EXTREME_PLAN_ID) || null;
}

/** 依區域彙總（依是否移動到 Krabi 側判斷） */
export function regionSummary(travelers = 2) {
  const groups = new Map();
  for (const p of PLANS) {
    const spots = p.days.flatMap((d) => d.spots || []);
    const krabiSide = spots.some((s) => ['krabi-4islands', 'koh-kradan', 'koh-mook', 'koh-rok', 'koh-haa', 'koh-khai'].includes(s));
    const region = krabiSide ? '含甲米' : '普吉為主';
    if (!groups.has(region)) groups.set(region, []);
    groups.get(region).push(p);
  }
  return [...groups.entries()].map(([region, plans]) => {
    const totals = plans.map((p) => planTotalTHBPerPerson(p, travelers));
    return {
      region,
      plans,
      count: plans.length,
      avgMin: Math.round(totals.reduce((s, t) => s + t.min, 0) / totals.length),
      avgMax: Math.round(totals.reduce((s, t) => s + t.max, 0) / totals.length),
    };
  }).sort((a, b) => a.avgMin - b.avgMin);
}

/* ───────────── 評級 ───────────── */

export function crowdRating(level) {
  return { high: '高人氣', medium: '中等人氣', low: '低人氣' }[level] || '—';
}

export function visibilityRating(level) {
  return {
    excellent: '極佳（25–30m）',
    good: '良好（15–25m）',
    fair: '尚可（10–15m）',
    variable: '多變（5–15m）',
  }[level] || '—';
}

/** 方案的點位人氣組成（用來看「熱門 vs 冷門」的實際比例） */
export function crowdMix(plan) {
  const spots = planSpots(plan);
  const counts = { high: 0, medium: 0, low: 0 };
  for (const s of spots) if (counts[s.crowd] !== undefined) counts[s.crowd] += 1;
  return { ...counts, total: spots.length, spots };
}
