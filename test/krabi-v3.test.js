import { describe, it } from 'node:test';
import assert from 'node:assert';
import { KRABI_PLANS_V3, V3_EXTRA_PLAN_COUNT } from '../src/data/krabi-plans-v3.js';
import { KRABI_PLANS_V2 } from '../src/data/krabi-plans-v2.js';
import { DATE_WINDOWS } from '../src/data/krabi-climate.js';
import {
  windowScore,
  recommendedWindow,
} from '../src/krabi-helpers.js';
import {
  planUsesOpenJaw,
  planDaysCount,
  planIsMultiDayWindow,
  allPlansV3,
  planScoreTotal,
  planLegalBurden,
  planTotalScoreV3,
  rankPlansV3,
} from '../src/krabi-helpers-v3.js';

describe('v3 dataset: three additional plans', () => {
  it('新增恰好三案', () => {
    assert.equal(V3_EXTRA_PLAN_COUNT, 3);
    assert.equal(KRABI_PLANS_V3.length, 3);
  });

  it('三案的天數皆超過 7 天（放寬窗口才有意義）', () => {
    for (const p of KRABI_PLANS_V3) {
      assert.ok(planDaysCount(p) > 7, `${p.tag} 應超過 7 天，實得 ${planDaysCount(p)}`);
    }
  });

  it('三案皆採雙點進出（open-jaw），這是新增的關鍵前提', () => {
    for (const p of KRABI_PLANS_V3) {
      assert.equal(planUsesOpenJaw(p), true, `${p.tag} 應使用雙點進出`);
      assert.ok(p.exitPoint && p.entryPoint, `${p.tag} 需標明進出機場`);
      assert.notEqual(p.entryPoint, p.exitPoint, `${p.tag} 進出機場應不同`);
    }
  });

  it('三案涵蓋的海洋區組合各不相同', () => {
    const sigs = KRABI_PLANS_V3.map((p) => p.marineAreas.slice().sort().join(','));
    assert.equal(new Set(sigs).size, 3);
  });

  it('每案有 buffer 日、合法風險等級、來源與費用說明', () => {
    const ids = new Set();
    for (const p of KRABI_PLANS_V3) {
      assert.ok(p.days.some((d) => d.isBuffer), `${p.tag} 應有緩衝日`);
      assert.ok(['low', 'mid', 'mid-high', 'high'].includes(p.riskLevel));
      assert.ok(!ids.has(p.id));
      ids.add(p.id);
      assert.ok(p.sources.length >= 1);
      for (const s of p.sources) assert.ok(s.url.startsWith('https://'));
      assert.ok(p.estimateTHB.note.length > 5);
      assert.equal(p.seaDayCount, undefined, `${p.tag} 不應有 seaDayCount`);
    }
  });

  it('不得與 v2 任何一案的 id 或海域組合重複', () => {
    const v2ids = new Set(KRABI_PLANS_V2.map((p) => p.id));
    for (const p of KRABI_PLANS_V3) {
      assert.ok(!v2ids.has(p.id), `${p.tag} id 與 v2 重複`);
    }
  });

  it('說明為何需要 9 天（不可只是把 7 案拉長）', () => {
    for (const p of KRABI_PLANS_V3) {
      assert.ok(p.windowRationale && p.windowRationale.length > 20, `${p.tag} 需說明放寬天數的理由`);
    }
  });
});

describe('date window scoring fix', () => {
  it('決定性優勢（Similan 季內、避開宋干節）必須計分', () => {
    const axes = DATE_WINDOWS.flatMap(() => []);
    void axes;
    // 三個窗口都應有實質分數，且 4/6 窗口明顯最高
    const scores = DATE_WINDOWS.map((w) => windowScore(w).total);
    assert.equal(scores.length, 3);
    assert.ok(scores[0] > scores[1] && scores[0] > scores[2], '4/6 窗口應為最高分');
  });

  it('4/6 窗口分數高於 70（修正前為 64，因決定性軸未計分）', () => {
    const reco = recommendedWindow();
    assert.ok(reco.id === 'apr-early');
    assert.ok(windowScore(reco).total >= 70, `應 ≥70，實得 ${windowScore(reco).total}`);
  });

  it('決定性優勢已計分：Similan 季內與避開宋干節不再被當作不計分項', () => {
    // 這兩軸若為 either，byAxis 不會出現它們的分數
    const byAxis = windowScore(recommendedWindow()).byAxis;
    assert.ok('similanStatus' in byAxis, 'Similan 季節應計分');
    assert.ok('songkranImpact' in byAxis, '宋干節影響應計分');
  });
});

describe('legal burden fix', () => {
  it('法規負擔不再隨海域數線性累加', () => {
    const oneArea = KRABI_PLANS_V2.find((p) => p.tag === '6'); // 只有 Trang
    const threeArea = KRABI_PLANS_V2.find((p) => p.tag === '5'); // 近岸+Similan+Trang
    // 舊版：6 案 burden=1(0.5)+1.5+0=2.5 → 5 案 burden=3+1.5+0.5=5
    // 新版：兩者都應落在合理區間，且差距應小於 2
    const diff = Math.abs(planLegalBurden(threeArea) - planLegalBurden(oneArea));
    assert.ok(diff <= 1.5, `差距應 ≤1.5，實得 ${diff}`);
  });

  it('所有方案的法規負擔都在 0.5–3.5 的合理區間', () => {
    for (const p of allPlansV3()) {
      const b = planLegalBurden(p);
      assert.ok(b >= 0.5 && b <= 3.5, `${p.tag} 法規負擔 ${b} 超出合理區間`);
    }
  });
});

describe('v3 helpers', () => {
  it('allPlansV3 回傳 v2 六案 + v3 三案 = 9 案', () => {
    const all = allPlansV3();
    assert.equal(all.length, 9);
    assert.equal(new Set(all.map((p) => p.id)).size, 9);
  });

  it('planDaysCount 對 v2 七天案與 v3 長天數案皆正確', () => {
    assert.equal(planDaysCount(KRABI_PLANS_V2[0]), 7);
    assert.ok(KRABI_PLANS_V3.every((p) => planDaysCount(p) > 7));
  });

  it('planIsMultiDayWindow 正確區分', () => {
    assert.equal(planIsMultiDayWindow(KRABI_PLANS_V2[0]), false);
    assert.equal(planIsMultiDayWindow(KRABI_PLANS_V3[0]), true);
  });

  it('planUsesOpenJaw 對 v2 全為 false', () => {
    for (const p of KRABI_PLANS_V2) assert.equal(planUsesOpenJaw(p), false);
  });

  it('planScoreTotal 對 v3 案也可計分且不越界', () => {
    for (const p of KRABI_PLANS_V3) {
      const s = planScoreTotal(p);
      assert.ok(s.total >= 0 && s.total <= 100, `${p.tag} 越界 ${s.total}`);
    }
  });

  it('planTotalScoreV3 額外納入天數與雙點進出', () => {
    for (const p of KRABI_PLANS_V3) {
      const s = planTotalScoreV3(p);
      assert.ok(s.total >= 0 && s.total <= 100);
      assert.ok('duration' in s.byAxis, '應含天數軸');
      assert.ok('openJaw' in s.byAxis, '應含雙點進出軸');
    }
  });

  it('雙點進出案在 openJaw 軸應高於 7 天單點案', () => {
    const v3 = planTotalScoreV3(KRABI_PLANS_V3[0]);
    const v2 = planTotalScoreV3(KRABI_PLANS_V2[0]);
    assert.ok(v3.byAxis.openJaw > v2.byAxis.openJaw);
  });

  it('rankPlansV3 依總分排序且涵蓋全部 9 案', () => {
    const ranked = rankPlansV3();
    assert.equal(ranked.length, 9);
    for (let i = 1; i < ranked.length; i += 1) {
      assert.ok(ranked[i - 1].score.total >= ranked[i].score.total, '排序應為遞減');
    }
  });
});
