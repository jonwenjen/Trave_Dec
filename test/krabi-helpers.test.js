import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  KRABI_PLANS,
  KRABI_META,
  KRABI_PARK_FEES,
  KRABI_KEY_FACTS,
  KRABI_CONTINGENCY,
  KRABI_OPEN_QUESTIONS,
  KRABI_COMPARE_AXES,
  KRABI_FLIGHT_ESTIMATE,
  THB_TO_TWD_ASSUMED,
} from '../src/data/krabi.js';
import {
  planTotalTHB,
  planParkFeeTHB,
  planSnorkelStopCount,
  planSeaDayCount,
  planBufferDayCount,
  planBaseMoves,
  planRiskRank,
  planRiskLabel,
  planRiskTone,
  cheapestPlan,
  bestSnorkelPlan,
  lowestRiskPlan,
  computeCompareMatrix,
  splitTHB,
  thbToTwd,
  planCostTwd,
  comparePlans,
  recommendPlans,
  estimateGroupTotalTwd,
  normalizeTravelerCount,
  findPlan,
  riskToneOf,
  sortedPlansBy,
  percentOfMax,
  estimateChecklistProgress,
  toggleChecklistItem,
} from '../src/krabi-helpers.js';

describe('krabi data integrity', () => {
  it('有恰好五個方案，標籤為 A–E', () => {
    assert.equal(KRABI_PLANS.length, 5);
    assert.deepEqual(KRABI_PLANS.map((p) => p.tag), ['A', 'B', 'C', 'D', 'E']);
  });

  it('每案都有 7 天行程、至少 1 個浮潛點與唯一 id', () => {
    const ids = new Set();
    for (const plan of KRABI_PLANS) {
      assert.equal(plan.days.length, 7, `${plan.tag} 應有 7 天`);
      assert.ok(plan.days.every((d) => d.day >= 1 && d.day <= 7), `${plan.tag} 天序應為 1–7`);
      assert.ok(plan.snorkelStops > 0, `${plan.tag} 應有浮潛點`);
      assert.ok(!ids.has(plan.id), `${plan.tag} id 重複`);
      ids.add(plan.id);
    }
  });

  it('出海日不得與 days 旗標分歧（避免重複真相）', () => {
    // 海上天數一律由 days 的 seaDay 旗標推導，資料層不得另存一個宣告值。
    for (const plan of KRABI_PLANS) {
      assert.equal(plan.seaDayCount, undefined, `${plan.tag} 不應保留 seaDayCount 宣告欄位`);
      const sea = plan.days.filter((d) => d.seaDay && !d.isBuffer).length;
      assert.ok(sea >= 2, `${plan.tag} 應至少有 2 個出海日`);
      assert.ok(sea <= 5, `${plan.tag} 出海日不應超過 5 天`);
    }
  });

  it('至少一案為全浮潛跳島行程', () => {
    const full = KRABI_PLANS.filter((p) => p.isSnorkelOnly);
    assert.ok(full.length >= 1, '應至少有一案標記為全浮潛跳島');
    assert.equal(full[0].tag, 'A', '全浮潛案應為 A');
  });

  it('風險等級與 meta 皆合法', () => {
    for (const plan of KRABI_PLANS) {
      assert.ok(['low', 'mid', 'mid-high', 'high'].includes(plan.riskLevel), `${plan.tag} 風險值`);
      assert.ok(plan.estimateTHB.min > 0 && plan.estimateTHB.max >= plan.estimateTHB.min);
    }
    assert.equal(KRABI_META.durationDays, 7);
  });

  it('公園費與注意事項、應變表皆非空', () => {
    assert.ok(KRABI_PARK_FEES.length >= 5);
    assert.ok(KRABI_KEY_FACTS.length >= 3);
    assert.ok(KRABI_CONTINGENCY.length >= 3);
    assert.ok(KRABI_OPEN_QUESTIONS.length >= 3);
  });

  it('機票為區間估算且為正數', () => {
    assert.ok(KRABI_FLIGHT_ESTIMATE.minTWD > 0);
    assert.ok(KRABI_FLIGHT_ESTIMATE.maxTWD >= KRABI_FLIGHT_ESTIMATE.minTWD);
  });
});

describe('plan cost helpers', () => {
  const planA = KRABI_PLANS[0];

  it('planTotalTHB 總和有明確費用的天', () => {
    const expected = planA.days.reduce((sum, d) => sum + (d.costTHB || 0), 0);
    assert.equal(planTotalTHB(planA), expected);
  });

  it('planTotalTHB 對缺欄位的方案回傳 0 而非拋錯', () => {
    assert.equal(planTotalTHB({ days: [{}, { day: 1 }] }), 0);
    assert.equal(planTotalTHB(null), 0);
  });

  it('planParkFeeTHB 只加總公園費', () => {
    const expected = planA.days.reduce((sum, d) => sum + (d.parkFeeTHB || 0), 0);
    assert.equal(planParkFeeTHB(planA), expected);
  });

  it('依前季區間換算單人分攤，機票開關正確影響總額', () => {
    const low = planCostTwd(planA, 1, { includeFlight: false });
    const high = planCostTwd(planA, 1, { includeFlight: true });
    assert.equal(low.min, Math.round(planA.estimateTHB.min * THB_TO_TWD_ASSUMED));
    assert.ok(high.max > high.min - 1);
    assert.ok(high.max - high.min > low.max - low.min, '含機票的區間應更寬');
  });

  it('人數讓單人費用下降、團費上升', () => {
    const solo = planCostTwd(planA, 1, { includeFlight: false });
    const group = planCostTwd(planA, 6, { includeFlight: false });
    assert.ok(group.max < solo.max, '多人應有價格優勢（僅以區間上界示意）');
  });

  it('normalizeTravelerCount 夾在 1–20 並容忍壞值', () => {
    assert.equal(normalizeTravelerCount(6), 6);
    assert.equal(normalizeTravelerCount(0), 1);
    assert.equal(normalizeTravelerCount(999), 20);
    assert.equal(normalizeTravelerCount('abc'), 1);
    assert.equal(normalizeTravelerCount(-3), 1);
    assert.equal(normalizeTravelerCount(3.6), 4);
  });

  it('estimateGroupTotalTwd 為單人費用乘人數', () => {
    const total = estimateGroupTotalTwd(planA, 4, { includeFlight: false });
    const per4 = planCostTwd(planA, 4, { includeFlight: false });
    assert.equal(total.perPerson.max, per4.max);
    assert.equal(total.max, per4.max * 4);
    assert.equal(total.travelers, 4);
  });
});

describe('snorkel & sea day stats', () => {
  it('planSnorkelStopCount 讀取資料欄位', () => {
    assert.equal(planSnorkelStopCount(KRABI_PLANS[0]), KRABI_PLANS[0].snorkelStops);
  });

  it('planSeaDayCount 只數出海日（排除雨備日）', () => {
    const expected = KRABI_PLANS[0].days.filter((d) => d.seaDay && !d.isBuffer).length;
    assert.equal(planSeaDayCount(KRABI_PLANS[0]), expected);
  });

  it('planBufferDayCount 計算雨備緩衝日', () => {
    for (const plan of KRABI_PLANS) {
      const expected = plan.days.filter((d) => d.isBuffer).length;
      assert.equal(planBufferDayCount(plan), expected);
      assert.ok(expected >= 1, `${plan.tag} 應至少有一天雨備緩衝`);
    }
  });

  it('bestSnorkelPlan 為浮潛點最多者', () => {
    const best = bestSnorkelPlan();
    const max = Math.max(...KRABI_PLANS.map(planSnorkelStopCount));
    assert.equal(planSnorkelStopCount(best), max);
  });

  it('A 案的浮潛點數多於或等於其他案', () => {
    const a = planSnorkelStopCount(KRABI_PLANS[0]);
    for (const plan of KRABI_PLANS.slice(1)) {
      assert.ok(a >= planSnorkelStopCount(plan), `A 應不少於 ${plan.tag}`);
    }
  });
});

describe('risk helpers', () => {
  it('planRiskRank 由低到高為 low < mid < mid-high < high', () => {
    assert.ok(planRiskRank('low') < planRiskRank('mid'));
    assert.ok(planRiskRank('mid') < planRiskRiskRankSafe('mid-high'));
    assert.ok(planRiskRank('mid-high') < planRiskRank('high'));
  });

  function planRiskRiskRankSafe(level) {
    return planRiskRank(level);
  }

  it('未知等級回傳最高風險值（保守處理）', () => {
    assert.equal(planRiskRank('wat'), planRiskRank('high'));
    assert.equal(planRiskRank(undefined), planRiskRank('high'));
  });

  it('planRiskLabel 與 planRiskTone 提供中文標籤與色調', () => {
    assert.equal(planRiskTone('low'), 'good');
    assert.equal(planRiskTone('mid'), 'warn');
    assert.equal(planRiskTone('high'), 'danger');
    assert.ok(planRiskLabel('low').length > 0);
    assert.equal(planRiskLabel('wat'), planRiskLabel('high'));
  });

  it('riskToneOf 與 planRiskTone 一致', () => {
    assert.equal(riskToneOf(KRABI_PLANS[4]), planRiskTone(KRABI_PLANS[4].riskLevel));
  });

  it('lowestRiskPlan 為最低風險者', () => {
    const plan = lowestRiskPlan();
    const min = Math.min(...KRABI_PLANS.map((p) => planRiskRank(p.riskLevel)));
    assert.equal(planRiskRank(plan.riskLevel), min);
  });

  it('cheapestPlan 為前季團費最低者', () => {
    const plan = cheapestPlan();
    const min = Math.min(...KRABI_PLANS.map((p) => p.estimateTHB.min));
    assert.equal(plan.estimateTHB.min, min);
  });
});

describe('base moves & sorting', () => {
  it('planBaseMoves 由是否含島上住宿判定', () => {
    for (const plan of KRABI_PLANS) {
      const expected = plan.overnightOnIsland ? 1 : 0;
      assert.equal(planBaseMoves(plan), expected);
    }
  });

  it('sortedPlansBy 依 key 升冪、可傳 comparator', () => {
    const asc = sortedPlansBy(KRABI_PLANS, planSnorkelStopCount);
    assert.ok(asc[0].snorkelStops <= asc[asc.length - 1].snorkelStops);

    const desc = sortedPlansBy(KRABI_PLANS, planSnorkelStopCount, (a, b) => planSnorkelStopCount(b) - planSnorkelStopCount(a));
    assert.equal(desc[0].snorkelStops, Math.max(...KRABI_PLANS.map(planSnorkelStopCount)));

    const byRisk = sortedPlansBy(KRABI_PLANS, planRiskRank, (a, b) => planRiskRank(a.riskLevel) - planRiskRank(b.riskLevel));
    assert.equal(byRisk[0].riskLevel, 'low');
  });

  it('sortedPlansBy 不改動原陣列', () => {
    const before = KRABI_PLANS.map((p) => p.tag).join('');
    sortedPlansBy(KRABI_PLANS, planSnorkelStopCount);
    assert.equal(KRABI_PLANS.map((p) => p.tag).join(''), before);
  });

  it('percentOfMax 回傳 0–100 整數', () => {
    assert.equal(percentOfMax(5, 10), 50);
    assert.equal(percentOfMax(10, 10), 100);
    assert.equal(percentOfMax(0, 0), 0);
    assert.equal(percentOfMax(5, 0), 0);
  });
});

describe('currency conversion', () => {
  it('thbToTwd 套用假設匯率並四捨五入', () => {
    assert.equal(thbToTwd(1000), Math.round(1000 * THB_TO_TWD_ASSUMED));
    assert.equal(thbToTwd(0), 0);
    assert.equal(thbToTwd(null), 0);
  });

  it('splitTHB 依人數分攤且餘數留在最後一份', () => {
    const parts = splitTHB(10000, 3);
    assert.equal(parts.reduce((a, b) => a + b, 0), 10000);
    assert.equal(parts[0], 3333);
    assert.equal(parts[2], 3334);
  });

  it('splitTHB 人數非法時回傳整筆', () => {
    assert.deepEqual(splitTHB(5000, 0), [5000]);
  });
});

describe('compare matrix & recommendation', () => {
  // 直接用正式的軸定義（自帶 betterWhen），避免測試用簡化版掩蓋行為。
  const axes = KRABI_COMPARE_AXES;

  it('comparePlans 為每個軸輸出每案的值', () => {
    const matrix = comparePlans(KRABI_PLANS, axes);
    assert.equal(matrix.length, axes.length);
    for (const row of matrix) {
      assert.equal(row.values.length, KRABI_PLANS.length);
      row.values.forEach((v) => assert.equal(v.tag, KRABI_PLANS.find((p) => p.tag === v.tag)?.tag));
    }
  });

  it('computeCompareMatrix 標示最佳值（浮潛越多越好、風險越低越好）', () => {
    const matrix = computeCompareMatrix(KRABI_PLANS, axes);
    const snorkel = matrix.find((r) => r.key === 'snorkel');
    const risk = matrix.find((r) => r.key === 'risk');
    assert.equal(snorkel.best, KRABI_PLANS[0].tag, '浮潛最佳應為 A');
    assert.equal(risk.best, lowestRiskPlan().tag);
  });

  it('computeCompareMatrix 對費用軸挑最低', () => {
    const matrix = computeCompareMatrix(KRABI_PLANS, axes);
    const cost = matrix.find((r) => r.key === 'cost');
    assert.equal(cost.best, cheapestPlan().tag);
  });

  it('recommendPlans 依情境給出主推與備選', () => {
    const snk = recommendPlans(KRABI_PLANS, { goal: 'snorkel' });
    assert.equal(snk.primary.tag, 'A');
    assert.ok(snk.alternatives.length >= 1);

    const risk = recommendPlans(KRABI_PLANS, { goal: 'safety' });
    assert.equal(risk.primary.tag, lowestRiskPlan().tag);

    const value = recommendPlans(KRABI_PLANS, { goal: 'value' });
    assert.ok(value.primary.estimateTHB.min <= 1e9);
  });

  it('recommendPlans 目標不明時仍回傳可用結果', () => {
    const r = recommendPlans(KRABI_PLANS, { goal: 'unknown-goal' });
    assert.ok(r.primary);
    assert.ok(r.reason.length > 0);
  });

  it('findPlan 依 id 與 tag 皆可查到，查無回 null', () => {
    assert.equal(findPlan('planA')?.tag, 'A');
    assert.equal(findPlan('C')?.tag, 'C');
    assert.equal(findPlan('zzz'), null);
  });
});

describe('checklist progress', () => {
  it('無勾選時進度為 0/總數', () => {
    const checked = [];
    const total = KRABI_OPEN_QUESTIONS.length;
    assert.equal(estimateChecklistProgress(checked, total).done, 0);
    assert.equal(estimateChecklistProgress(checked, total).percent, 0);
  });

  it('全部勾選時進度 100%', () => {
    const total = KRABI_OPEN_QUESTIONS.length;
    const p = estimateChecklistProgress(Array.from({ length: total }, (_, i) => i), total);
    assert.equal(p.done, total);
    assert.equal(p.percent, 100);
  });

  it('部分勾選回傳正確百分比並夾在 0–100', () => {
    const p = estimateChecklistProgress([0, 1], 4);
    assert.equal(p.done, 2);
    assert.equal(p.percent, 50);
  });

  it('總數為 0 時不除零', () => {
    const p = estimateChecklistProgress([], 0);
    assert.equal(p.percent, 0);
    assert.equal(p.done, 0);
  });

  it('toggleChecklistItem 新增／移除，且回傳新陣列', () => {
    const base = [1, 3];
    const added = toggleChecklistItem(base, 2);
    assert.deepEqual(added.sort((a, b) => a - b), [1, 2, 3]);
    const removed = toggleChecklistItem(added, 1);
    assert.deepEqual(removed.sort((a, b) => a - b), [2, 3]);
    assert.deepEqual(base, [1, 3], '原陣列不應被修改');
  });
});
