import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  PLANS,
  DESTINATIONS,
  FLIGHT_OPTIONS,
  NIGHT_FLIGHT,
  PRICING_2026,
  THB_TO_TWD_ASSUMED,
  EXTREME_PLAN_ID,
  TRIP_WINDOW,
} from '../src/data/reeval.js';
import {
  planDays,
  planSeaDays,
  planIslandCount,
  planBaseAreas,
  planTotalTHBPerPerson,
  planBreakdown,
  planTotalTWDPerPerson,
  cheapestPlan,
  extremePlan,
  allPlans,
  regionSummary,
  crowdRating,
  visibilityRating,
} from '../src/helpers-reeval.js';

describe('reeval dataset', () => {
  it('至少 10 個方案', () => {
    assert.ok(PLANS.length >= 10, `只有 ${PLANS.length} 個方案`);
  });

  it('所有方案 id 唯一', () => {
    const ids = PLANS.map((p) => p.id);
    assert.equal(new Set(ids).size, ids.length, 'id 重複');
  });

  it('每個方案都有 7 個完整白天（3/30 – 4/5）', () => {
    for (const p of PLANS) {
      assert.equal(planDays(p), 7, `${p.id} 應為 7 天`);
    }
  });

  it('每個方案都有海的日子', () => {
    for (const p of PLANS) {
      assert.ok(planSeaDays(p) >= 2, `${p.id} 只有 ${planSeaDays(p)} 天出海`);
    }
  });

  it('至少一個全程極致跳島方案', () => {
    const x = extremePlan();
    assert.ok(x, '找不到極致跳島方案');
    assert.ok(x.isExtreme, `${x.id} 未標記 isExtreme`);
    assert.ok(x.days.filter((d) => d.sea).length >= 6, '極致跳島應 6 天以上出海');
    assert.ok(planIslandCount(x) >= 8, `極致跳島應含 8 座以上島嶼，實得 ${planIslandCount(x)}`);
  });

  it('涵蓋熱門與冷門點位', () => {
    const visited = new Set(PLANS.flatMap((p) => p.days.flatMap((d) => d.spots || [])));
    // 熱門
    for (const hot of ['phi-phi', 'racha-yai', 'similan', 'phang-nga']) {
      assert.ok(visited.has(hot), `缺少熱門點位 ${hot}`);
    }
    // 冷門
    for (const cold of ['koh-yao-noi', 'koh-hong', 'koh-maphrao']) {
      assert.ok(visited.has(cold), `缺少冷門點位 ${cold}`);
    }
  });

  it('目的地資料完整', () => {
    for (const id of Object.keys(DESTINATIONS)) {
      const d = DESTINATIONS[id];
      assert.ok(d.name, `${id} 缺 name`);
      assert.ok(d.crowd, `${id} 缺 crowd 評級`);
      assert.ok(d.visibility, `${id} 缺 visibility 評級`);
    }
  });

  it('有熱門點位也有冷門點位', () => {
    const crowds = Object.values(DESTINATIONS).map((d) => d.crowd);
    assert.ok(crowds.includes('high'), '缺高人氣點位');
    assert.ok(crowds.includes('low'), '缺低人氣點位');
  });

  it('航班為夜航（晚上出發、隔天到）', () => {
    assert.ok(NIGHT_FLIGHT.departure.startsWith('21:') || NIGHT_FLIGHT.departure.startsWith('22:') || NIGHT_FLIGHT.departure.startsWith('00:'),
      `去程非夜航：${NIGHT_FLIGHT.departure}`);
    assert.equal(NIGHT_FLIGHT.arrivalDayOffset, 1, '去程應隔天抵達');
  });

  it('行程窗口為 3/29 – 4/5，避開宋干節', () => {
    assert.equal(TRIP_WINDOW.depart, '2027-03-29');
    assert.equal(TRIP_WINDOW.return, '2027-04-05');
    assert.equal(TRIP_WINDOW.songkranInRange, false);
  });

  it('所有方案都避開宋干節', () => {
    for (const p of PLANS) {
      assert.equal(p.songkranRisk, false, `${p.id} 有宋干節風險`);
    }
  });

  it('每個方案都有價格資料（整團船資＋住宿分攤）', () => {
    for (const p of PLANS) {
      assert.ok(p.boatTHB && p.boatTHB.min > 0, `${p.id} 缺船資`);
      assert.ok(p.lodgingTHB && p.lodgingTHB.min > 0, `${p.id} 缺住宿`);
      assert.ok(typeof p.parkFeeTHB === 'number', `${p.id} 缺公園費`);
    }
  });

  it('極致跳島方案最貴', () => {
    const c = cheapestPlan();
    assert.ok(planTotalTHBPerPerson(extremePlan()).max > c.totalTHB.max, '極致跳島應最貴');
  });
});

describe('reeval helpers', () => {
  it('planSeaDays 計算正確', () => {
    for (const p of PLANS) {
      const expected = p.days.filter((d) => d.sea).length;
      assert.equal(planSeaDays(p), expected);
    }
  });

  it('planIslandCount 統計不重複的點位', () => {
    for (const p of PLANS) {
      const spots = new Set(p.days.flatMap((d) => d.spots || []));
      assert.equal(planIslandCount(p), spots.size, `${p.id} 島嶼數不符`);
    }
  });

  it('人數增加時整團費用被分攤', () => {
    const p = PLANS[0];
    const alone = planTotalTHBPerPerson(p, 1);
    const quad = planTotalTHBPerPerson(p, 4);
    assert.ok(quad.min < alone.min, `4 人 ${quad.min} 應低於單人 ${alone.min}`);
  });

  it('每人費用含托運行李', () => {
    const b = planBreakdown(PLANS[0], 2);
    assert.ok(b.baggage.min > 0, '應含托運行李');
  });

  it('breakdown 總額等於各項加總', () => {
    for (const p of PLANS.slice(0, 4)) {
      const b = planBreakdown(p, 2);
      // breakdown 各項已是「每人」值，不需再除以人數
      const sum = b.flight.min + b.baggage.min + b.course.min
        + b.boats.min + b.lodging.min + b.parkFee.min + b.food.min;
      assert.ok(Math.abs(b.totalTHB.min - sum) < 2, `${p.id} 總額與分項不符`);
    }
  });

  it('cheapestPlan 回傳最便宜者', () => {
    const c = cheapestPlan();
    for (const p of PLANS) {
      assert.ok(planTotalTHBPerPerson(p).max >= c.totalTHB.max, `${p.id} 竟比最便宜的便宜`);
    }
  });

  it('regionSummary 依區域彙總', () => {
    const s = regionSummary();
    assert.ok(s.length >= 2, '至少兩個區域');
    for (const r of s) {
      assert.ok(r.count > 0);
      assert.ok(r.avgMin > 0);
    }
  });

  it('crowdRating 給出人氣描述', () => {
    assert.ok(crowdRating('high'));
    assert.ok(crowdRating('low'));
  });

  it('allPlans 與 PLANS 一致', () => {
    assert.equal(allPlans().length, PLANS.length);
  });
});
