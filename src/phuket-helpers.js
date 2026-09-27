/**
 * Trave_Dec — Phuket 與離岸島嶼的純函式
 *
 * 評分軸刻意選與甲米不同的項目，因為兩地的瓶頸不同：
 * 甲米的瓶頸是「移動時間」，普吉的瓶頸是「交通前提」與「課程品質」。
 * 硬套同一套軸只會得到沒有資訊量的分數。
 */

import {
  PHUKET_PLANS,
  DEPARTURE_MATRIX,
  DEPARTURE_VERDICT,
  OFFSHORE_REEFS,
  MARINE_PARK_DESTINATIONS,
  PHUKET_FREEDIVING,
  PHUKET_BOATS,
  HEAD_TO_HEAD,
  PHUKET_DATA_CAVEAT,
} from './data/phuket.js';
import { planDaysCount, planUsesOpenJaw } from './krabi-helpers-v3.js';
import { planRequiresFerry, planRequiresLandTransfer, planLegalBurden } from './krabi-helpers.js';
import { THB_TO_TWD_ASSUMED } from './data/krabi.js';

export {
  PHUKET_PLANS, DEPARTURE_MATRIX, DEPARTURE_VERDICT, OFFSHORE_REEFS, MARINE_PARK_DESTINATIONS,
  PHUKET_FREEDIVING, PHUKET_BOATS, HEAD_TO_HEAD, PHUKET_DATA_CAVEAT,
  planDaysCount, planUsesOpenJaw, planRequiresFerry, planRequiresLandTransfer, planLegalBurden,
  THB_TO_TWD_ASSUMED,
};

/** 普吉方案的評分軸 */
export const PHUKET_AXES = [
  {
    key: 'visibility',
    label: '能見度',
    betterWhen: 'high',
    hint: 'Racha 20–30m 為區內最高；Coral Island 與 Khai 為中等',
  },
  {
    key: 'secrecy',
    label: '秘境程度',
    betterWhen: 'high',
    hint: 'Koh Yao 幾乎無商業開發且免公園費',
  },
  {
    key: 'freedive',
    label: '自由潛水',
    betterWhen: 'high',
    hint: '四系統教練中心，Racha Noi 為共識訓練點',
  },
  {
    key: 'coverage',
    label: '涵蓋海域',
    betterWhen: 'high',
    hint: '涵蓋的點位類別數（離岸礁／國家公園／秘境）',
  },
  {
    key: 'mobility',
    label: '移動負擔',
    betterWhen: 'high',
    hint: '不需移動基地最佳；此軸分數越高代表負擔越低',
  },
  {
    key: 'cost',
    label: '費用親和',
    betterWhen: 'high',
    hint: '團費越低分數越高',
  },
  {
    key: 'parkFee',
    label: '公園費負擔',
    betterWhen: 'high',
    hint: 'Koh Yao 與 Racha 免費，Phang Nga 與 Khai 需付費',
  },
];

/* ───────────── 交通前提 ───────────── */

/**
 * 該案是否全程使用 HKT 直飛。
 * 以明確標記推斷，不從字串猜測。
 */
export function phuketDirectFlights(plan) {
  if (!plan) return false;
  return String(plan.entryPoint || '').includes('HKT');
}

/** 航線顯示字串 */
export function formatFlightRoute(from, to, direct) {
  return direct ? `${from} → ${to}（直飛）` : `${from} → ${to}（1 stop 轉機）`;
}

/**
 * 桃園出發時，普吉相對甲米省下的交通小時數。
 * 直飛 4h25m（約 4.4h）vs 經曼谷 13–16h（中位 14.5h）→ 約 10 小時。
 */
export function departureSavingsHours() {
  const direct = DEPARTURE_MATRIX.find((d) => d.id === 'tpe-hkt');
  const connect = DEPARTURE_MATRIX.find((d) => d.id === 'tpe-kbv');
  // duration 兩種格式：「4h25m」與「13–16h（…）」都要正確解析
  const parseHours = (s) => {
    const hm = String(s).match(/(\d+)h(\d+)m/);      // 4h25m
    if (hm) return Number(hm[1]) + Number(hm[2]) / 60;
    const range = String(s).match(/(\d+)[–-](\d+)\s*h/); // 13–16h
    if (range) return (Number(range[1]) + Number(range[2])) / 2;
    const single = String(s).match(/(\d+)\s*h/);
    if (single) return Number(single[1]);
    return 0;
  };
  const directH = parseHours(direct.duration);
  const connectH = parseHours(connect.duration);
  return Math.round(connectH - directH);
}

/* ───────────── 評分軸 ───────────── */

/** 能見度：Racha 20–30m 最高，其次 Similan，其次近程礁 */
export function phuketVisibilityScore(plan) {
  if (!plan || !Array.isArray(plan.marineAreas)) return 0;
  let score = 0;
  for (const a of plan.marineAreas) {
    if (a === 'racha') score += 50;
    else if (a === 'similan') score += 45;
    else if (a === 'koh-yao') score += 30;
    else if (a === 'khai' || a === 'coral-island') score += 20;
    else if (a === 'phang-nga') score += 5; // 能見度差是先天限制
  }
  return Math.min(100, score);
}

/** 秘境：Koh Yao 最高，Phang Nga 次之，Racha Noi 中等 */
export function phuketSecrecyScore(plan) {
  if (!plan || !Array.isArray(plan.marineAreas)) return 0;
  let score = 0;
  for (const a of plan.marineAreas) {
    if (a === 'koh-yao') score += 70;
    else if (a === 'phang-nga') score += 25;
    else if (a === 'racha') score += 15;
  }
  return Math.min(100, score);
}

/** 自由潛水：以是否安排教練／課程日為主軸 */
export function phuketFreediveScore(plan) {
  if (!plan || !Array.isArray(plan.days)) return 0;
  const coachDays = plan.days.filter((d) => String(d.transport || '').includes('教練')).length;
  const hasRacha = Array.isArray(plan.marineAreas) && plan.marineAreas.includes('racha');
  let score = coachDays * 30;
  if (hasRacha) score += 30; // Racha Noi 是共識訓練點
  if (plan.days.length >= 8) score += 10; // 天數夠才排得下課程
  return Math.min(100, score);
}

/** 涵蓋海域：不同類別的數量 */
export function phuketCoverageScore(plan) {
  if (!plan || !Array.isArray(plan.marineAreas)) return 0;
  return Math.min(100, plan.marineAreas.length * 25);
}

/** 公園費合計（依點位實際費率，不採列舉的估算欄位） */
export function phuketParkFeeTHB(plan) {
  if (!plan || !Array.isArray(plan.marineAreas)) return 0;
  const fees = {
    racha: 0,
    'coral-island': 0,
    'koh-yao': 0,
    khai: 300,
    'phang-nga': 350,
    similan: 500,
  };
  return plan.marineAreas.reduce((a, m) => a + (fees[m] || 0), 0);
}

/* ───────────── 總分 ───────────── */

function movementScore(plan) {
  const days = planDaysCount(plan);
  const bases = new Set(
    plan.days
      .map((d) => String(d.transport || ''))
      .filter((t) => t.includes('陸路') || t.includes('渡輪') || t.includes('快艇'))
  );
  let score = 100;
  if (bases.has('陸路')) score -= 30;
  if (Array.isArray(plan.marineAreas) && plan.marineAreas.includes('koh-yao')) score -= 10;
  if (days >= 8) score += 5; // 多天數本身就是緩衝
  return Math.max(0, Math.min(100, score));
}

function costScore(plan) {
  if (!plan || !plan.estimateTHB) return 0;
  const mid = (plan.estimateTHB.min + plan.estimateTHB.max) / 2;
  // ฿12,000 滿分、฿24,000 0 分
  return Math.max(0, Math.min(100, Math.round(((24000 - mid) / 12000) * 100)));
}

function parkFeeScore(plan) {
  const fee = phuketParkFeeTHB(plan);
  // ฿0 滿分、฿850 0 分
  return Math.max(0, Math.min(100, Math.round(((850 - fee) / 850) * 100)));
}

/** 單一軸的 0–100 分數 */
export function phuketAxisValue(plan, key) {
  switch (key) {
    case 'visibility': return phuketVisibilityScore(plan);
    case 'secrecy': return phuketSecrecyScore(plan);
    case 'freedive': return phuketFreediveScore(plan);
    case 'coverage': return phuketCoverageScore(plan);
    case 'mobility': return movementScore(plan);
    case 'cost': return costScore(plan);
    case 'parkFee': return parkFeeScore(plan);
    default: return 0;
  }
}

/** 單一軸的可讀顯示值 */
export function phuketAxisDisplay(plan, key) {
  switch (key) {
    case 'parkFee': return phuketParkFeeTHB(plan) === 0 ? '免費' : `฿${phuketParkFeeTHB(plan)}`;
    case 'coverage': return `${plan.marineAreas.length} 個`;
    case 'mobility': {
      const s = movementScore(plan);
      return s >= 90 ? '幾乎不移動' : s >= 65 ? '少量移動' : s >= 40 ? '需要移動' : '移動多';
    }
    case 'freedive': {
      const coachDays = plan.days.filter((d) => String(d.transport || '').includes('教練')).length;
      if (coachDays === 0) return '無課程';
      return coachDays >= 3 ? '完整認證課程' : `${coachDays} 天教練`;
    }
    case 'cost': return `฿${plan.estimateTHB.min.toLocaleString('en-US')}–${plan.estimateTHB.max.toLocaleString('en-US')}`;
    default: return String(phuketAxisValue(plan, key));
  }
}

/**
 * 綜合評分
 * @returns {{total:number, byAxis:Object<string,number>}}
 */
export function phuketPlanScore(plan) {
  const byAxis = {};
  let sum = 0;
  for (const axis of PHUKET_AXES) {
    const v = phuketAxisValue(plan, axis.key);
    byAxis[axis.key] = v;
    sum += v;
  }
  return { total: Math.round(sum / PHUKET_AXES.length), byAxis };
}

/** 排名（遞減） */
export function rankPhuketPlans() {
  return PHUKET_PLANS
    .map((plan) => ({ plan, score: phuketPlanScore(plan) }))
    .sort((a, b) => {
      if (b.score.total !== a.score.total) return b.score.total - a.score.total;
      return planDaysCount(b.plan) - planDaysCount(a.plan);
    });
}

/** 推薦方案：最高分者 */
export function recommendPhuketPlan() {
  return rankPhuketPlans()[0].plan;
}

/**
 * 比較矩陣
 * @returns {Array<{key,label,hint,betterWhen,values:Array,best:string|null}>}
 */
export function comparePhuketAxes(plans) {
  const list = plans && plans.length ? plans : PHUKET_PLANS;
  return PHUKET_AXES.map((axis) => {
    const values = list.map((p) => ({
      tag: p.tag,
      value: phuketAxisValue(p, axis.key),
      display: phuketAxisDisplay(p, axis.key),
    }));
    const best = values.reduce((a, b) => (b.value > a.value ? b : a), values[0]);
    return { ...axis, best: best.tag, values };
  });
}

/** 離岸礁依能見度排序（供 UI 顯示） */
export function offshoreReefsByVisibility() {
  const rank = (v) => {
    const m = String(v).match(/(\d+)/);
    return m ? Number(m[1]) : 0;
  };
  return [...OFFSHORE_REEFS].sort((a, b) => rank(b.visibility) - rank(a.visibility));
}
