import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  COMPRESSED_PLANS,
  FLIGHT_COSTS,
  LODGING,
  FOOD,
  COMPRESSION_NOTES,
  PRICE_CAVEAT,
  THB_TO_TWD_ASSUMED,
  USD_TO_TWD_ASSUMED,
} from '../src/data/pricing-2026.js';
import {
  lodgingTHB,
  foodTHB,
  flightTWD,
  planTotalTWD,
  planTotalTWDPerPerson,
  planBreakdown,
  cheapestPlans,
  flightSavingsTWD,
  flightDateCaveat,
  cheapestRegionPlan,
  compareRegions,
  compressionImpact,
  boatsTHB,
  parkFeeTHB,
} from '../src/pricing-helpers.js';

describe('2026 pricing dataset', () => {
  it('十四案（甲米九 ＋ 普吉五）', () => {
    assert.equal(COMPRESSED_PLANS.length, 14);
    assert.equal(new Set(COMPRESSED_PLANS.map((p) => p.id)).size, 14);
    assert.equal(COMPRESSED_PLANS.filter((p) => p.region === 'krabi').length, 9);
    assert.equal(COMPRESSED_PLANS.filter((p) => p.region === 'phuket').length, 5);
  });

  it('每案皆為 7 天 6 晚', () => {
    for (const p of COMPRESSED_PLANS) {
      assert.equal(p.days, 7, `${p.id} 天數應為 7`);
      assert.equal(p.nights, 6, `${p.id} 夜數應為 6`);
    }
  });

  it('9 天與 8 天的原案必須標註被砍掉什麼', () => {
    for (const p of COMPRESSED_PLANS) {
      if (/原 [89] 天/.test(p.compressedFrom)) {
        assert.ok(p.tradeoff && p.tradeoff.length > 20, `${p.id} 缺少 tradeoff 說明`);
      } else {
        assert.equal(p.tradeoff, null, `${p.id} 原就 7 天，不應有 tradeoff`);
      }
    }
  });

  it('每案住宿夜數加總等於 nights', () => {
    for (const p of COMPRESSED_PLANS) {
      const sum = Object.values(p.lodging).reduce((a, b) => a + b, 0);
      assert.equal(sum, p.nights, `${p.id} 住宿夜數 ${sum} ≠ ${p.nights}`);
    }
  });

  it('每案住宿類型皆存在於 LODGING', () => {
    for (const p of COMPRESSED_PLANS) {
      for (const key of Object.keys(p.lodging)) {
        assert.ok(LODGING[key], `${p.id} 引用不存在的住宿類型 ${key}`);
      }
    }
  });

  it('每案餐費等級與機場皆存在', () => {
    for (const p of COMPRESSED_PLANS) {
      assert.ok(FOOD[p.food], `${p.id} 餐費等級無效`);
      assert.ok(FLIGHT_COSTS[p.flight], `${p.id} 機場無效`);
    }
  });

  it('甲米案用 KBV、普吉案用 HKT 直飛', () => {
    for (const p of COMPRESSED_PLANS) {
      if (p.region === 'krabi') assert.equal(p.flight, 'tpe-kbv', `${p.id} 應走 KBV`);
      if (p.region === 'phuket') assert.equal(p.flight, 'tpe-hkt-direct', `${p.id} 應走 HKT 直飛`);
    }
  });

  it('被標記不推薦的案必須說明理由或替代天數', () => {
    for (const p of COMPRESSED_PLANS.filter((x) => x.notRecommended)) {
      const hasWhy = p.tradeoff && p.tradeoff.length > 20;
      assert.ok(hasWhy || p.alternativeDays, `${p.id} 需說明不推薦理由`);
    }
  });

  it('匯率為正且合理', () => {
    assert.ok(THB_TO_TWD_ASSUMED > 0.05 && THB_TO_TWD_ASSUMED < 0.15);
    assert.ok(USD_TO_TWD_ASSUMED > 25 && USD_TO_TWD_ASSUMED < 40);
  });

  it('機票都有來源與說明', () => {
    for (const f of Object.values(FLIGHT_COSTS)) {
      assert.ok(f.basis.length > 10, `${f.id} 缺價格依據`);
      assert.ok(f.source.startsWith('https://'));
      assert.ok(f.twd.min <= f.twd.max);
    }
  });

  it('壓縮說明誠實標明代價', () => {
    assert.ok(COMPRESSION_NOTES.honest.includes('代價'));
    assert.ok(COMPRESSION_NOTES.principle.includes('6 晚'));
  });

  it('價格時效警告至少 5 項且標明研究日期', () => {
    assert.ok(PRICE_CAVEAT.items.length >= 5);
    assert.equal(PRICE_CAVEAT.researchDate, '2026-09-27');
  });
});

describe('pricing helpers', () => {
  it('lodgingTHB 依夜數與房型計算', () => {
    const p = COMPRESSED_PLANS.find((x) => x.region === 'phuket');
    const l = lodgingTHB(p);
    assert.ok(l.min > 0 && l.max >= l.min);
    assert.ok(l.max <= l.min * 4, '區間不應過寬');
  });

  it('foodTHB 依天數計算每人餐費（回傳 TWD）', () => {
    const p = COMPRESSED_PLANS[0];
    const f = foodTHB(p);
    // 7 天 × ฿350–950 × 0.093 ≈ TWD 228–618
    assert.ok(f.min > 200 && f.max < 700, `實得 ${f.min}–${f.max}`);
  });

  it('flightTWD 回傳 TWD 區間', () => {
    const f = flightTWD(COMPRESSED_PLANS[0]);
    assert.ok(f.min >= 7900 && f.max <= 21500);
  });

  it('flightSavingsTWD 反映普吉直飛可能比甲米轉機貴（負值）', () => {
    // 2026-09 實測：直飛 US$315–670 vs 甲米轉機 US$231–275
    // 這是實情，不應被修飾成「普吉比較便宜」
    assert.ok(flightSavingsTWD() < 0, `實得 ${flightSavingsTWD()}，應為負`);
  });

  it('flightDateCaveat 明確聲明報價非目標日期票價', () => {
    const c = flightDateCaveat('2027-04-06');
    assert.equal(c.isTargetDatePrice, false);
    assert.equal(c.targetDate, '2027-04-06');
    assert.ok(c.daysAhead > 150 && c.daysAhead < 220, `實得 ${c.daysAhead} 天`);
    assert.equal(c.bookBy, '2027-02-25');
  });

  it('flightSavingsTWD 回傳數字（負值代表普吉直飛較貴）', () => {
    const s = flightSavingsTWD();
    assert.equal(typeof s, 'number');
    // 實測約 -4,300 TWD：普吉直飛比甲米轉機貴
    assert.ok(s < 0);
  });

  it('planTotalTWD = 機票 ＋ （住宿 ＋ 船資 ＋ 公園費）÷2 ＋ 餐費（每人）', () => {
    for (const p of COMPRESSED_PLANS) {
      const t = planTotalTWD(p);
      const sum = flightTWD(p).min
        + (lodgingTHB(p).min + boatsTHB(p).min + parkFeeTHB(p).min) / 2
        + foodTHB(p).min;
      assert.ok(Math.abs(t.min - sum) < 2, `${p.id} 總額與分項不符`);
    }
  });

  it('單人入住的每人費用高於兩人（住宿與船資無法分攤）', () => {
    const p = COMPRESSED_PLANS[0];
    const alone = planTotalTWDPerPerson(p, 1);
    const pair = planTotalTWDPerPerson(p, 2);
    assert.ok(alone.max > pair.max, `單人 ${alone.max} 應高於兩人 ${pair.max}`);
  });

  it('人數增加時每人費用下降（住宿分攤）', () => {
    const p = COMPRESSED_PLANS.find((x) => x.id === 'pkt-1-7d');
    const one = planTotalTWDPerPerson(p, 1).max;
    const four = planTotalTWDPerPerson(p, 4).max;
    assert.ok(four < one, `4 人應比 1 人便宜：${four} vs ${one}`);
  });

  it('所有方案的每人總額落在合理區間（含船資）', () => {
    for (const p of COMPRESSED_PLANS) {
      const t = planTotalTWDPerPerson(p, 2);
      assert.ok(t.min > 8000 && t.max < 26000, `${p.id} 總額 ${t.min}–${t.max} 超出合理區間`);
    }
  });

  it('方案之間的費用差異來自船資，不是只有食宿', () => {
    const t2 = COMPRESSED_PLANS.map((p) => planTotalTWDPerPerson(p, 2).max);
    assert.ok(Math.max(...t2) - Math.min(...t2) > 3000, '2 人時費用落差應 >3000');
    // 單人時整團費用無法分攤，落差更明顯
    const t1 = COMPRESSED_PLANS.map((p) => planTotalTWDPerPerson(p, 1).max);
    assert.ok(Math.max(...t1) - Math.min(...t1) > 4000, '1 人時費用落差應 >4000');
  });

  it('每案都有船資與公園費資料', () => {
    for (const p of COMPRESSED_PLANS) {
      assert.ok(p.boats && p.boats.thb.min > 0, `${p.id} 缺船資`);
      assert.ok(typeof p.parkFeeTHB === 'number', `${p.id} 缺公園費`);
    }
  });

  it('公園費最高的案應是涵蓋最多國家公園者', () => {
    const max = Math.max(...COMPRESSED_PLANS.map((p) => p.parkFeeTHB));
    const p = COMPRESSED_PLANS.find((x) => x.parkFeeTHB === max);
    assert.ok(p.parkFeeTHB >= 2000, `公園費最高的 ${p.id} 僅 ${max}`);
  });

  it('planBreakdown 回傳完整分項', () => {
    const p = COMPRESSED_PLANS[0];
    const b = planBreakdown(p);
    for (const k of ['flight', 'lodging', 'boats', 'parkFee', 'food', 'total']) {
      assert.ok(b[k], `缺 ${k}`);
      assert.ok(b[k].min <= b[k].max);
    }
  });

  it('cheapestPlans 依每人最低價遞增', () => {
    const c = cheapestPlans(5);
    assert.equal(c.length, 5);
    for (let i = 1; i < c.length; i += 1) {
      assert.ok(c[i - 1].totalTWD.max <= c[i].totalTWD.max, '應依費用遞增');
    }
  });

  it('cheapestRegionPlan 分區別回傳最低價', () => {
    assert.equal(cheapestRegionPlan('krabi').plan.region, 'krabi');
    assert.equal(cheapestRegionPlan('phuket').plan.region, 'phuket');
    assert.ok(cheapestRegionPlan('krabi').totalTWD.max > 0);
  });

  it('compareRegions 明確指出便宜與貴的一方', () => {
    const c = compareRegions();
    assert.ok(c.cheaper, '應指出較便宜的區域');
    assert.ok(c.dearther);
    assert.notEqual(c.cheaper.region, c.dearther.region);
  });

  it('compressionImpact 標記被壓縮的案與不推薦的案', () => {
    const c = compressionImpact();
    const compressed = c.plans.filter((p) => p.compressed);
    assert.ok(compressed.length >= 5, `壓縮案應 ≥5，實得 ${compressed.length}`);
    const notRec = c.plans.filter((p) => p.notRecommended);
    assert.ok(notRec.length >= 2, '不推薦案應 ≥2');
    for (const p of c.plans) {
      if (p.notRecommended) assert.ok(p.reason, `${p.id} 需不推薦理由`);
    }
  });
});
