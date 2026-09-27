/**
 * Trave_Dec — 分批團體費用計算（6 人・2 人提前 2 天回）
 *
 * 這裡處理一個容易被算錯的情境：不是 6 人都走同一個價格。
 *
 * 三個必須分開的項目：
 *  1. **機票** — 提前的人回程日期不同，票價也不同（而且 4/4 沒直飛）
 *  2. **船資** — 若為整團包船，早退者的份額**不會減少**，因為船照開
 *  3. **住宿與餐費** — 早退者實際少 2 晚與 2 天，**會實際減少**
 *
 * 把這三項混為一談，就會得到一個看起來精確但實際錯誤的總額。
 */

import {
  PLANS,
  SPLIT_GROUP,
  FLIGHT_OPTIONS,
  LODGING,
  FOOD,
  THB_TO_TWD_ASSUMED,
} from './data/reeval.js';
import { boatTHB, parkFeeTHB, planSeaDays } from './helpers-reeval.js';

const range = (min, max) => ({ min: Math.round(min), max: Math.round(max) });

export { SPLIT_GROUP };

/** 住宿分級的每晚價格（單間） */
function nightlyTHB(plan) {
  // lodgingTHB 是整團總額，除以夜數回推每晚
  const nights = countNights(plan);
  if (!nights) return { min: 0, max: 0 };
  return range(plan.lodgingTHB.min / nights, plan.lodgingTHB.max / nights);
}

/** 方案住宿夜數（6 晚 3/30 – 4/5） */
export function countNights(plan) {
  return 6;
}

/** 提前 2 天回的人實際住幾晚（4 晚 3/30 – 4/3） */
export const EARLY_NIGHTS = 4;

/**
 * 分批團體的完整費用明細。
 *
 * 房間數計算：6 人 = 3 間（2 人一間）；提前 2 人 = 1 間。
 */
export function splitGroupBreakdown(plan, earlyOption = 'early-night') {
  const { total, earlyReturners, fullGroup } = SPLIT_GROUP;

  const earlyOpt = SPLIT_GROUP.earlyOptions.find((o) => o.id === earlyOption)
    || SPLIT_GROUP.earlyOptions[0];
  const mainOpt = SPLIT_GROUP.mainOptions[0];

  // ── 機票（每人）──
  const outLeg = FLIGHT_OPTIONS.roundTripTWD;   // 去程來回價已含，故拆兩段不精確 → 用比例
  const bag = FLIGHT_OPTIONS.baggageTWD;

  // 去程（6 人相同）以來回價的一半推估
  const outboundPerPerson = range(outLeg.min / 2, outLeg.max / 2);

  const mainFlight = range(
    outboundPerPerson.min + mainOpt.oneWayTWD.min + bag.min,
    outboundPerPerson.max + mainOpt.oneWayTWD.max + bag.max,
  );
  const earlyFlight = range(
    outboundPerPerson.min + earlyOpt.oneWayTWD.min + bag.min,
    outboundPerPerson.max + earlyOpt.oneWayTWD.max + bag.max,
  );

  // ── 船資（整團，早退者不減少份額）──
  const boat = boatTHB(plan);
  const perPersonBoat = range(boat.min / total, boat.max / total);

  // ── 公園費（每人各自付，少參訪點位者較便宜）──
  const park = parkFeeTHB(plan);
  const parkPerPerson = range(park.min / total, park.max / total);
  // 早退者少 2 天 → 保守估計參訪到 70% 的點位
  const parkEarly = range(parkPerPerson.min * 0.7, parkPerPerson.max * 0.7);

  // ── 住宿（整團）──
  //
  // 房晚數不能想成「6 間夜 3 間 + 早退 4 晚 1 間」——早退的 4 晚本來就在那 3 間房裡，
  // 沒有額外房間。實際是：
  //   前 4 晚：6 人 = 3 間 × 4 晚 = 12 房晚
  //   後 2 晚：4 人 = 2 間 × 2 晚 = 4 房晚
  //   合計 16 房晚（若 6 人全程同行則為 3 間 × 6 晚 = 18 房晚）
  const nightly = nightlyTHB(plan);
  const roomsFull = 3;      // 6 人 = 3 間
  const roomsAfter = 2;     // 提前 2 人走後剩 4 人 = 2 間
  const roomNightsFull = 3 * EARLY_NIGHTS;        // 12
  const roomNightsAfter = 2 * (6 - EARLY_NIGHTS); // 4
  const earlyRoomShare = range(
    nightly.min * roomsAfter * (6 - EARLY_NIGHTS),
    nightly.max * roomsAfter * (6 - EARLY_NIGHTS),
  );

  // ── 餐費（每人每天）──
  const foodLevel = FOOD[plan.foodLevel] || FOOD.mid;
  const daysFull = 7;
  const daysEarly = 5;     // 少 2 天
  const foodFull = range(foodLevel.thbPerDay.min * daysFull, foodLevel.thbPerDay.max * daysFull);
  const foodEarly = range(foodLevel.thbPerDay.min * daysEarly, foodLevel.thbPerDay.max * daysEarly);

  // ── 課程費（若有）──
  const course = plan.courseFeeTHB
    ? range(plan.courseFeeTHB.min, plan.courseFeeTHB.max)
    : { min: 0, max: 0 };

  // ── 每人總額 ──
  const mainTotal = range(
    mainFlight.min + course.min + perPersonBoat.min + parkPerPerson.min + foodFull.min,
    mainFlight.max + course.max + perPersonBoat.max + parkPerPerson.max + foodFull.max,
  );
  const earlyTotal = range(
    earlyFlight.min + course.min + perPersonBoat.min + parkEarly.min + foodEarly.min,
    earlyFlight.max + course.max + perPersonBoat.max + parkEarly.max + foodEarly.max,
  );

  // ── 團體總額 ──
  // 住宿：主團體 6 晚 3 間 + 提前者 4 晚 1 間
  const lodgingTotal = range(
    nightly.min * (roomNightsFull + roomNightsAfter),
    nightly.max * (roomNightsFull + roomNightsAfter),
  );

  const groupTotal = range(
    mainTotal.min * fullGroup + earlyTotal.min * earlyReturners + lodgingTotal.min,
    mainTotal.max * fullGroup + earlyTotal.max * earlyReturners + lodgingTotal.max,
  );

  return {
    plan,
    main: {
      count: fullGroup,
      flight: mainFlight,
      baggage: bag,
      course,
      boats: perPersonBoat,
      parkFee: parkPerPerson,
      food: foodFull,
      total: mainTotal,
    },
    early: {
      count: earlyReturners,
      flight: earlyFlight,
      baggage: bag,
      course,
      boats: perPersonBoat,
      parkFee: parkEarly,
      food: foodEarly,
      total: earlyTotal,
      lodgingShare: earlyRoomShare,
    },
    lodgingTotal,
    groupTotal,
    groupTotalTWD: range(
      groupTotal.min * THB_TO_TWD_ASSUMED,
      groupTotal.max * THB_TO_TWD_ASSUMED,
    ),
    savingsFromEarly: range(
      (mainTotal.min - earlyTotal.min) * earlyReturners,
      (mainTotal.max - earlyTotal.max) * earlyReturners,
    ),
    seaDaysMain: planSeaDays(plan),
    seaDaysEarly: Math.max(0, planSeaDays(plan) - 1),
  };
}

/** 全部 11 個方案的分批團體總額，由低到高 */
export function splitGroupByTotal(earlyOption = 'early-night') {
  return PLANS
    .map((p) => ({ plan: p, breakdown: splitGroupBreakdown(p, earlyOption) }))
    .sort((a, b) => a.breakdown.groupTotal.max - b.breakdown.groupTotal.max);
}

/** 與「6 人同行」的差異（提前回能省多少） */
export function earlyReturnSaving(plan, earlyOption = 'early-night') {
  const b = splitGroupBreakdown(plan, earlyOption);
  // 假設 6 人全程同行的團體總額
  const boat = boatTHB(plan);
  const park = parkFeeTHB(plan);
  const nightly = nightlyTHB(plan);
  const foodLevel = FOOD[plan.foodLevel] || FOOD.mid;
  const allSame = range(
    (b.main.flight.min + (boat.min + park.min + nightly.min * 6 * 3) / 6
      + foodLevel.thbPerDay.min * 7) * 6,
    (b.main.flight.max + (boat.max + park.max + nightly.max * 6 * 3) / 6
      + foodLevel.thbPerDay.max * 7) * 6,
  );
  // 用區間中位數比較：端點相減會在區間重疊時產生負值，誤導為「反而更貴」
  const mid = (r2) => (r2.min + r2.max) / 2;
  return range(
    mid(allSame) - mid(b.groupTotal) - Math.abs(allSame.max - allSame.min) / 2,
    mid(allSame) - mid(b.groupTotal) + Math.abs(allSame.max - allSame.min) / 2,
  );
}
