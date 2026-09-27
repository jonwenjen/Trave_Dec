/**
 * Trave_Dec — 2026 前季費用試算
 *
 * 這裡不假裝精確。目的是讓十四案在「同一個價格基準、同一個 7 天長度」下
 * 可比較——不是給報價。所有區間都會誠實標出寬度，因為寬度本身就是資訊：
 * 機票的區間最寬，住宿次之，餐費最窄。
 */

import {
  COMPRESSED_PLANS,
  FLIGHT_COSTS,
  LODGING,
  FOOD,
  COMPRESSION_NOTES,
  PRICE_CAVEAT,
  FARE_STRUCTURE,
  SCHEDULE_CONFLICT,
  THB_TO_TWD_ASSUMED,
  USD_TO_TWD_ASSUMED,
} from './data/pricing-2026.js';

export {
  COMPRESSED_PLANS, FLIGHT_COSTS, LODGING, FOOD,
  COMPRESSION_NOTES, PRICE_CAVEAT, FARE_STRUCTURE, SCHEDULE_CONFLICT,
  THB_TO_TWD_ASSUMED, USD_TO_TWD_ASSUMED,
};

const range = (min, max) => ({ min: Math.round(min), max: Math.round(max) });

/* ───────────── 分項 ───────────── */

/**
 * 住宿費用（整團，TWD）。
 * 依每種房型的夜數加總；回傳整團金額，分攤在 planTotalTWD 內處理。
 */
export function lodgingTHB(plan) {
  if (!plan || !plan.lodging) return { min: 0, max: 0 };
  let min = 0;
  let max = 0;
  for (const [key, nights] of Object.entries(plan.lodging)) {
    const tier = LODGING[key];
    if (!tier) continue;
    min += tier.thb.min * nights;
    max += tier.thb.max * nights;
  }
  return range(min * THB_TO_TWD_ASSUMED, max * THB_TO_TWD_ASSUMED);
}

/** 餐費（每人，TWD） */
export function foodTHB(plan) {
  if (!plan) return { min: 0, max: 0 };
  const tier = FOOD[plan.food] || FOOD.mid;
  return range(
    tier.thbPerDay.min * plan.days * THB_TO_TWD_ASSUMED,
    tier.thbPerDay.max * plan.days * THB_TO_TWD_ASSUMED,
  );
}

/** 機票（每人來回，TWD） */
export function flightTWD(plan) {
  if (!plan) return { min: 0, max: 0 };
  const f = FLIGHT_COSTS[plan.flight];
  if (!f) return { min: 0, max: 0 };
  return range(f.twd.min, f.twd.max);
}

/* ───────────── 總額 ───────────── */

/**
 * 船資與包船（整團 TWD）。
 *
 * 這是方案之間最大的成本差異來源：7,200（Trang 深度、單一基地）到
 * 31,000（全海域含多基地搬運）。住宿與餐費加起來還沒有它差得多——
 * 若只看機票加食宿，十四案會被算成幾乎一樣貴，那是誤導。
 */
export function boatsTHB(plan) {
  if (!plan || !plan.boats) return { min: 0, max: 0 };
  return range(
    plan.boats.thb.min * THB_TO_TWD_ASSUMED,
    plan.boats.thb.max * THB_TO_TWD_ASSUMED,
  );
}

/**
 * 公園費（整團 TWD）。
 * 國家公園入場費依實際參訪的公園數計算，通常不含在船資內。
 */
export function parkFeeTHB(plan) {
  if (!plan || !plan.parkFeeTHB) return { min: 0, max: 0 };
  return range(plan.parkFeeTHB * THB_TO_TWD_ASSUMED, plan.parkFeeTHB * THB_TO_TWD_ASSUMED);
}

/**
 * 每人總額（TWD），以「兩人一房、與另一人同行」為前提。
 * 住宿與船資、公園費皆為整團費用，需除以同行人數分攤。
 */
export function planTotalTWD(plan) {
  const f = flightTWD(plan);
  const l = lodgingTHB(plan);
  const d = foodTHB(plan);
  const b = boatsTHB(plan);
  const pk = parkFeeTHB(plan);
  return range(
    f.min + (l.min + b.min + pk.min) / 2 + d.min,
    f.max + (l.max + b.max + pk.max) / 2 + d.max,
  );
}

/**
 * 指定人數的每人費用。
 *
 * 整團費用（住宿、船資、公園費）一律除以「人數」而非房間數：
 * 包船是整條船的費用、住宿是整間房的費用，兩者都由全體人數分攤。
 * 用房間數分攤會低估人數增加時的攤平效果（2 人 1 房時房間數是 1，
 * 等於整團費用沒被分攤）。單人（n=1）自然得到最高成本——這是誠實的。
 */
export function planTotalTWDPerPerson(plan, travelers) {
  if (!plan) return { min: 0, max: 0 };
  const n = Math.max(1, Number(travelers) || 1);
  const f = flightTWD(plan);
  const l = lodgingTHB(plan);
  const d = foodTHB(plan);
  const b = boatsTHB(plan);
  const pk = parkFeeTHB(plan);
  return range(
    f.min + (l.min + b.min + pk.min) / n + d.min,
    f.max + (l.max + b.max + pk.max) / n + d.max,
  );
}

/** 分項明細（供 UI 表格） */
export function planBreakdown(plan, travelers = 2) {
  const n = Math.max(1, Number(travelers) || 1);
  const rooms = Math.ceil(n / 2);
  // 房間數僅供 UI 顯示；分攤一律除以人數（見 planTotalTWDPerPerson 的說明）
  const f = flightTWD(plan);
  const l = lodgingTHB(plan);
  const d = foodTHB(plan);
  const b = boatsTHB(plan);
  const pk = parkFeeTHB(plan);
  return {
    flight: f,
    lodging: range(l.min / n, l.max / n),
    boats: range(b.min / n, b.max / n),
    parkFee: range(pk.min / n, pk.max / n),
    food: d,
    total: range(
      f.min + (l.min + b.min + pk.min) / n + d.min,
      f.max + (l.max + b.max + pk.max) / n + d.max,
    ),
    rooms,
    travelers: n,
    lodgingLabel: Object.entries(plan.lodging)
      .map(([k, nights]) => `${LODGING[k].label} × ${nights} 晚`)
      .join(' ＋ '),
    foodLabel: FOOD[plan.food].label,
    flightLabel: FLIGHT_COSTS[plan.flight].route + (FLIGHT_COSTS[plan.flight].direct ? '（直飛）' : '（轉機）'),
  };
}

/* ───────────── 跨案比較 ───────────── */

/** 依每人最低費用排序 */
export function cheapestPlans(limit = 14, travelers = 2) {
  return COMPRESSED_PLANS
    .map((plan) => ({ plan, totalTWD: planTotalTWDPerPerson(plan, travelers) }))
    .sort((a, b) => a.totalTWD.max - b.totalTWD.max)
    .slice(0, limit);
}

/** 某區域最低價的方案 */
export function cheapestRegionPlan(region, travelers = 2) {
  const rows = COMPRESSED_PLANS
    .filter((p) => p.region === region)
    .map((plan) => ({ plan, totalTWD: planTotalTWDPerPerson(plan, travelers) }))
    .sort((a, b) => a.totalTWD.max - b.totalTWD.max);
  return rows[0];
}

/**
 * 機票省額（普吉相對甲米）。
 * **可能為負**——普吉直飛的票價比甲米轉機貴，這是實情，不修飾。
 */
export function flightSavingsTWD() {
  const hkt = FLIGHT_COSTS['tpe-hkt-direct'].twd;
  const kbv = FLIGHT_COSTS['tpe-kbv'].twd;
  return Math.round((kbv.min + kbv.max) / 2 - (hkt.min + hkt.max) / 2);
}

/**
 * 機票的日期落差。
 *
 * 這裡刻意不隱藏：所有價格都是 2026-09-27 查得的當期票價，
 * 對應 2026 年 10 月前後的航班，**不是 2027-04-06 的實際票價**。
 */
export function flightDateCaveat(targetDate = '2027-04-06') {
  const researchDate = PRICE_CAVEAT.researchDate;
  const days = Math.round(
    (new Date(targetDate).getTime() - new Date(researchDate).getTime()) / 864e5,
  );
  // 業界普遍建議：出發前約 40 天訂票為甜蜜點
  const bookBy = new Date(new Date(targetDate).getTime() - 40 * 864e5)
    .toISOString().slice(0, 10);
  return {
    researchDate,
    targetDate,
    daysAhead: days,
    bookBy,
    quotedFor: '2026 年 10 月前後航班',
    isTargetDatePrice: false,
  };
}

/**
 * 兩區比較：哪一區平均便宜、差多少。
 * 用每區全部案件的平均每人費用，避免只挑單一案造成誤導。
 */
export function compareRegions(travelers = 2) {
  const avg = (region) => {
    const rows = COMPRESSED_PLANS
      .filter((p) => p.region === region)
      .map((p) => {
        const t = planTotalTWDPerPerson(p, travelers);
        return (t.min + t.max) / 2;
      });
    return Math.round(rows.reduce((a, b) => a + b, 0) / rows.length);
  };
  const krabi = { region: 'krabi', label: '甲米', avgTWD: avg('krabi') };
  const phuket = { region: 'phuket', label: '普吉', avgTWD: avg('phuket') };
  const cheaper = krabi.avgTWD <= phuket.avgTWD ? krabi : phuket;
  const dearther = krabi.avgTWD <= phuket.avgTWD ? phuket : krabi;
  return {
    cheaper,
    dearther,
    diffTWD: Math.abs(krabi.avgTWD - phuket.avgTWD),
    travelers,
  };
}

/**
 * 壓縮影響：哪些案被壓縮、壓縮代價是什麼、哪些不值得壓縮。
 */
export function compressionImpact() {
  return {
    plans: COMPRESSED_PLANS.map((p) => ({
      ...p,
      compressed: /原 [89] 天/.test(p.compressedFrom),
      notRecommended: Boolean(p.notRecommended),
      reason: p.notRecommended
        ? (p.tradeoff && p.tradeoff.length > 20
          ? p.tradeoff
          : `建議維持 ${p.alternativeDays} 天，不要壓縮此案。`)
        : null,
    })),
    notes: COMPRESSION_NOTES,
    compressedCount: COMPRESSED_PLANS.filter((p) => /原 [89] 天/.test(p.compressedFrom)).length,
    notRecommendedCount: COMPRESSED_PLANS.filter((p) => p.notRecommended).length,
  };
}

/** 依區域回傳案件（供 UI 分組） */
export function plansByRegion(region) {
  return COMPRESSED_PLANS.filter((p) => p.region === region);
}
