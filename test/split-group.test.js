import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SPLIT_GROUP } from '../src/data/reeval.js';
import {
  splitGroupBreakdown,
  splitGroupByTotal,
  earlyReturnSaving,
  EARLY_NIGHTS,
} from '../src/helpers-split-group.js';
import { PLANS } from '../src/data/reeval.js';
import { boatTHB, parkFeeTHB } from '../src/helpers-reeval.js';

describe('6 人團體・2 人提前 2 天回', () => {
  it('4/4 是週日且無直飛 — 這是班表限制不是偏好', () => {
    assert.equal(SPLIT_GROUP.total, 6);
    assert.equal(SPLIT_GROUP.earlyReturners, 2);
    assert.equal(SPLIT_GROUP.fullGroup, 4);
    assert.equal(SPLIT_GROUP.earlyReturnDate, '2027-04-04');
    assert.equal(SPLIT_GROUP.earlyReturnWeekday, '週日');
    assert.equal(SPLIT_GROUP.directAvailableEarly, false);
    // 直飛日為週二(2)與週六(6)，週日(7) 不在其中
    assert.ok(!SPLIT_GROUP.directDays.includes(7));
  });

  it('提前者住宿 4 晚、主團 6 晚', () => {
    assert.equal(EARLY_NIGHTS, 4);
  });

  it('早退者機票比主團體貴（4/4 無直飛必須買貴的轉機單程）', () => {
    const b = splitGroupBreakdown(PLANS[0]);
    assert.ok(
      b.early.flight.min > b.main.flight.min,
      `早退 ${b.early.flight.min} 應高於主團 ${b.main.flight.min}`,
    );
  });

  it('早退者公園費不高於主團體（少參訪點位）', () => {
    const b = splitGroupBreakdown(PLANS[0]);
    assert.ok(
      b.early.parkFee.max <= b.main.parkFee.max,
      `早退公園費 ${b.early.parkFee.max} 不應高於主團 ${b.main.parkFee.max}`,
    );
  });

  it('船資分攤對早退者不減少（船照開）', () => {
    for (const plan of PLANS) {
      const b = splitGroupBreakdown(plan);
      assert.deepEqual(b.main.boats, b.early.boats,
        `${plan.tag} 早退者船資份額不該改變`);
    }
  });

  it('早退者餐費低於主團體（少 2 天）', () => {
    const b = splitGroupBreakdown(PLANS[0]);
    assert.ok(b.early.food.max < b.main.food.max);
  });

  it('團體總額 = 主團 4 人 + 早退 2 人 + 住宿整團', () => {
    const b = splitGroupBreakdown(PLANS[0]);
    const expectedMin = b.main.total.min * 4 + b.early.total.min * 2 + b.lodgingTotal.min;
    const expectedMax = b.main.total.max * 4 + b.early.total.max * 2 + b.lodgingTotal.max;
    assert.ok(Math.abs(expectedMin - b.groupTotal.min) <= 1);
    assert.ok(Math.abs(expectedMax - b.groupTotal.max) <= 1);
  });

  it('住宿總額 = 前 4 晚 3 間 + 後 2 晚 2 間（共 16 房晚）', () => {
    const b = splitGroupBreakdown(PLANS[0]);
    // 早退的 4 晚已含在那 3 間房裡，不可重複計算
    const expectedRoomNights = 3 * EARLY_NIGHTS + 2 * (6 - EARLY_NIGHTS);
    assert.equal(expectedRoomNights, 16);
    const perNightMin = b.lodgingTotal.min / expectedRoomNights;
    const perNightMax = b.lodgingTotal.max / expectedRoomNights;
    assert.ok(perNightMin > 0 && perNightMax >= perNightMin);
  });

  it('11 個方案都能算，且團體總額 TWD 為正值', () => {
    const rows = splitGroupByTotal();
    assert.equal(rows.length, 11);
    for (const r of rows) {
      assert.ok(r.breakdown.groupTotalTWD.min > 0, `${r.plan.tag} TWD 應為正`);
      assert.ok(r.breakdown.groupTotalTWD.max >= r.breakdown.groupTotalTWD.min);
    }
  });

  it('依團體總額由低到高排序', () => {
    const rows = splitGroupByTotal();
    for (let i = 1; i < rows.length; i++) {
      assert.ok(rows[i - 1].breakdown.groupTotal.max <= rows[i].breakdown.groupTotal.max,
        `第 ${i} 項排序錯誤`);
    }
  });

  it('提前回不等於省錢：4/4 須買貴的轉機單程，抵銷少住的 2 晚', () => {
    // 這是本模型最重要的發現，測試要把它釘住避免日後被「修正」成省錢的說法
    const b = splitGroupBreakdown(PLANS[0]);
    assert.ok(
      b.early.flight.min > b.main.flight.min,
      '早退者單程票應比主團體貴（4/4 週日無直飛）',
    );
    const s = earlyReturnSaving(PLANS[0]);
    // 區間可跨 0，但中位數應為負 → 提前回整體不省錢
    const mid = (r) => (r.min + r.max) / 2;
    assert.ok(mid(s) < 0, `提前回的中位數省額應為負（實際 ${mid(s)}）`);
  });

  it('公園費仍由總人數分攤（不是早退人數）', () => {
    for (const plan of PLANS) {
      const park = parkFeeTHB(plan);
      const b = splitGroupBreakdown(plan);
      const boat = boatTHB(plan);
      // 整團公園費 = 每人 × 6；船資 = 每人 × 6
      assert.ok(Math.abs(b.main.parkFee.min * 6 - park.min) <= 2,
        `${plan.tag} 公園費分攤基準應為 6 人`);
      assert.ok(Math.abs(b.main.boats.min * 6 - boat.min) <= 2,
        `${plan.tag} 船資分攤基準應為 6 人`);
    }
  });
});
