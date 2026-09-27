/**
 * Trave_Dec — 九案合併評分（v2 六案 + v3 三案）
 *
 * 存在的理由：v3 三案放寬了兩個前提（天數 9、雙點進出），這兩件事對行程品質有實質影響，
 * 但 v2 的評分軸不知道它們的存在——結果 v3 案在「涵蓋海域」以外的軸都沒有加分理由。
 * 這裡補上 duration 與 openJaw 兩個軸，讓九案能被公平比較。
 *
 * 純函式，資料來自 src/data/krabi-plans-v3.js 與 src/krabi-helpers.js。
 */

import { KRABI_PLANS_V3, V3_PREMISE } from './data/krabi-plans-v3.js';
import {
  KRABI_PLANS_V2,
  planScoreTotal as _baseScore,
  planLegalBurden,
  SIX_PLAN_AXES,
} from './krabi-helpers.js';

export { KRABI_PLANS_V3, V3_PREMISE, SIX_PLAN_AXES };

// 匯率沿用 v2 的單一事實來源，避免兩處各寫一份
export { THB_TO_TWD_ASSUMED } from './krabi-helpers.js';

/** v3 額外的兩個軸：放寬前提本身帶來的價值 */
export const V3_EXTRA_AXES = [
  {
    key: 'duration',
    label: '天數餘裕',
    betterWhen: 'high',
    hint: '7 天只能二選一；9 天能兼得能見度與秘境',
  },
  {
    key: 'openJaw',
    label: '雙點進出',
    betterWhen: 'high',
    hint: '回程從 TST 出，讓南下 Trang 成為出口而非折返',
  },
];

/** v3 額外軸的正規化上限（用於 0–100 換算） */
const V3_AXIS_CEILING = { duration: 9, openJaw: 1 };

/** 全部九案：v2 六案 + v3 三案 */
export function allPlansV3() {
  return [...KRABI_PLANS_V2, ...KRABI_PLANS_V3];
}

/** 行程天數 */
export function planDaysCount(plan) {
  if (!plan || !Array.isArray(plan.days)) return 0;
  return plan.days.length;
}

/** 是否為放寬天數的方案（> 7 天） */
export function planIsMultiDayWindow(plan) {
  return planDaysCount(plan) > 7;
}

/**
 * 是否採雙點進出。
 * 以明確標記的 entryPoint / exitPoint 為準，不從基地字串推斷——
 * 判斷規則應該是資料，不是猜測。
 */
export function planUsesOpenJaw(plan) {
  if (!plan) return false;
  return Boolean(plan.entryPoint && plan.exitPoint && plan.entryPoint !== plan.exitPoint);
}

function extraAxisValue(plan, key) {
  switch (key) {
    case 'duration': return planDaysCount(plan);
    case 'openJaw': return planUsesOpenJaw(plan) ? 1 : 0;
    default: return 0;
  }
}

function extraAxisDisplay(plan, key) {
  switch (key) {
    case 'duration': return `${planDaysCount(plan)} 天`;
    case 'openJaw': return planUsesOpenJaw(plan)
      ? `${plan.entryPoint} → ${plan.exitPoint}`
      : '單點往返';
    default: return '—';
  }
}

/**
 * 九案總分 = v2 八軸平均 + 額外兩軸。
 * 分開計算再平均，避免天數多的方案單純因為「軸比較多」而分數變高。
 * @returns {{total:number, byAxis:Object<string,number>}}
 */
export function planTotalScoreV3(plan) {
  const base = _baseScore(plan);
  const byAxis = { ...base.byAxis };
  let extraSum = 0;
  for (const axis of V3_EXTRA_AXES) {
    const raw = extraAxisValue(plan, axis.key);
    const ceiling = V3_AXIS_CEILING[axis.key];
    const v = Math.round((raw / ceiling) * 100);
    byAxis[axis.key] = v;
    extraSum += v;
  }
  const nAxes = Object.keys(base.byAxis).length + V3_EXTRA_AXES.length;
  const baseSum = Object.values(base.byAxis).reduce((a, b) => a + b, 0);
  return { total: Math.round((baseSum + extraSum) / nAxes), byAxis };
}

/**
 * 九案排名（遞減），同分時天數多者在前（放寬前提本身就是價值）。
 * @returns {Array<{plan:Object, score:{total:number,byAxis:Object}>}>}
 */
export function rankPlansV3() {
  return allPlansV3()
    .map((plan) => ({ plan, score: planTotalScoreV3(plan) }))
    .sort((a, b) => {
      if (b.score.total !== a.score.total) return b.score.total - a.score.total;
      return planDaysCount(b.plan) - planDaysCount(a.plan);
    });
}

/** 額外軸的比較矩陣（僅供 v3 區塊顯示） */
export function compareExtraAxes(plans) {
  const list = plans && plans.length ? plans : KRABI_PLANS_V3;
  return V3_EXTRA_AXES.map((axis) => {
    const values = list.map((p) => ({
      tag: p.tag,
      value: extraAxisValue(p, axis.key),
      display: extraAxisDisplay(p, axis.key),
    }));
    const best = axis.betterWhen === 'high'
      ? values.reduce((a, b) => (b.value > a.value ? b : a), values[0])
      : null;
    return { ...axis, best: best ? best.tag : null, values };
  });
}

// 重新匯出，讓 v3 測試可獨立引用 v2 的核心 helper
export { planLegalBurden, _baseScore as planScoreTotal };
