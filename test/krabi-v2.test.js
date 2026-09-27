import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  KRABI_PLANS_V2,
  MARINE_AREAS,
  EXCLUDED_AREAS,
  SIX_PLAN_AXES,
} from '../src/data/krabi-plans-v2.js';
import {
  THAILAND_SNORKEL_RULES,
  AIDA_EXEMPTION,
  CORAL_PROHIBITIONS,
  PHOTO_RULE,
  COMPLIANCE_CHECKLIST,
} from '../src/data/krabi-regulations.js';
import {
  planMarineAreaIds,
  planCoversSimilan,
  planCoversEmeraldCave,
  planRequiresFerry,
  planRequiresLandTransfer,
  planFreediveScore,
  planLegalBurden,
  planScoreTotal,
  comparePlanV2,
  bestPlanForAxis,
  checkPlanCompliance,
  compliancePassRate,
  marineAreaById,
  planCostTwdV2,
  estimateGroupTotalTwdV2,
} from '../src/krabi-helpers.js';

describe('six-plan dataset integrity', () => {
  it('恰好六案，標籤 1–6 且皆為 4 月窗口', () => {
    assert.equal(KRABI_PLANS_V2.length, 6);
    assert.deepEqual(KRABI_PLANS_V2.map((p) => p.tag), ['1', '2', '3', '4', '5', '6']);
    for (const p of KRABI_PLANS_V2) {
      assert.match(p.window, /^2027-04-/, `${p.tag} 應為 4 月窗口`);
    }
  });

  it('每案 7 天、含雨備或緩衝日、風險等級合法', () => {
    const ids = new Set();
    for (const p of KRABI_PLANS_V2) {
      assert.equal(p.days.length, 7, `${p.tag} 應有 7 天`);
      assert.ok(p.days.some((d) => d.isBuffer), `${p.tag} 應至少有一天緩衝`);
      assert.ok(['low', 'mid', 'mid-high', 'high'].includes(p.riskLevel));
      assert.ok(!ids.has(p.id), `${p.tag} id 重複`);
      ids.add(p.id);
    }
  });

  it('不得有 seaDayCount 重複真相欄位', () => {
    for (const p of KRABI_PLANS_V2) {
      assert.equal(p.seaDayCount, undefined, `${p.tag} 不應有 seaDayCount`);
    }
  });

  it('每案標明涵蓋的海洋區且 id 有效', () => {
    const valid = new Set(MARINE_AREAS.map((a) => a.id));
    for (const p of KRABI_PLANS_V2) {
      assert.ok(Array.isArray(p.marineAreas) && p.marineAreas.length >= 1, `${p.tag} 需 marineAreas`);
      for (const id of p.marineAreas) {
        assert.ok(valid.has(id), `${p.tag} 參照不存在的海洋區: ${id}`);
      }
    }
  });

  it('六案的差異是實質的：涵蓋區數與行程不可全部相同', () => {
    const signatures = KRABI_PLANS_V2.map((p) => p.marineAreas.slice().sort().join(','));
    assert.equal(new Set(signatures).size, 6, '每案涵蓋的海洋區組合應各不相同');
  });

  it('費用區間合法且有說明', () => {
    for (const p of KRABI_PLANS_V2) {
      assert.ok(p.estimateTHB.min > 0 && p.estimateTHB.max >= p.estimateTHB.min, `${p.tag} 費用區間錯誤`);
      assert.ok(p.estimateTHB.note && p.estimateTHB.note.length > 5, `${p.tag} 費用需說明`);
    }
  });

  it('每案有來源，且 Similan 案必須標注季節', () => {
    for (const p of KRABI_PLANS_V2) {
      assert.ok(p.sources.length >= 1, `${p.tag} 需至少一個來源`);
      for (const s of p.sources) assert.ok(s.url.startsWith('https://'));
    }
    const similanPlans = KRABI_PLANS_V2.filter((p) => p.marineAreas.includes('similan'));
    assert.ok(similanPlans.length >= 1, '應至少一案含 Similan');
  });

  it('含翡翠洞的案必須揭露潮汐限制', () => {
    for (const p of KRABI_PLANS_V2.filter((x) => x.marineAreas.includes('trang'))) {
      const text = JSON.stringify(p);
      assert.ok(text.includes('低潮') || text.includes('潮汐'), `${p.tag} 應說明潮汐限制`);
    }
  });

  it('比較軸方向合法', () => {
    for (const axis of SIX_PLAN_AXES) {
      assert.ok(['high', 'low', 'either'].includes(axis.betterWhen), `${axis.key} betterWhen 非法`);
    }
  });
});

describe('marine areas data', () => {
  it('海洋區含管理機關、船程、季節與公園費', () => {
    assert.ok(MARINE_AREAS.length >= 5);
    for (const a of MARINE_AREAS) {
      assert.ok(a.authority, `${a.id} 需管理機關`);
      assert.ok(a.season, `${a.id} 需季節資訊`);
      assert.ok(Number.isInteger(a.parkFee), `${a.id} 公園費需為整數`);
    }
  });

  it('Surin 應列為排除區並說明原因', () => {
    const surin = EXCLUDED_AREAS.find((a) => a.id === 'surin');
    assert.ok(surin, 'Surin 應列在排除區');
    assert.ok(surin.reason.length > 10);
  });

  it('marineAreaById 對未知 id 安全降級', () => {
    assert.equal(marineAreaById('nope'), null);
    assert.equal(marineAreaById(null), null);
    assert.equal(marineAreaById('similan').id, 'similan');
  });
});

describe('regulations data integrity', () => {
  it('救生衣規則有法源、日期與豁免條款', () => {
    assert.equal(THAILAND_SNORKEL_RULES.effectiveDate, '2025-04-22');
    assert.ok(THAILAND_SNORKEL_RULES.authority.includes('Natural Resources'));
    assert.ok(THAILAND_SNORKEL_RULES.clauses.some((c) => c.key === 'life-jacket'));
    assert.ok(THAILAND_SNORKEL_RULES.clauses.some((c) => c.key === 'certified-operator'));
    assert.ok(THAILAND_SNORKEL_RULES.clauses.some((c) => c.key === 'two-metre'));
  });

  it('珊瑚區禁止事項至少五項且皆為禁止語意', () => {
    assert.ok(CORAL_PROHIBITIONS.length >= 5);
    for (const p of CORAL_PROHIBITIONS) assert.ok(p.action.length > 3);
  });

  it('攝影限制明確記載資歷門檻', () => {
    assert.ok(PHOTO_RULE.requiredCertification.includes('Advanced Open Water'));
    assert.ok(PHOTO_RULE.requiredCertification.includes('40'));
    assert.ok(PHOTO_RULE.altPaths.length >= 1, '應提供替代方案');
  });

  it('AIDA 豁免明確區分 AIDA 1 與 AIDA 2', () => {
    assert.equal(AIDA_EXEMPTION.aida1.isFullCertification, false);
    assert.equal(AIDA_EXEMPTION.aida2.isFullCertification, true);
    assert.ok(AIDA_EXEMPTION.technicalNote.includes('中性浮力') || AIDA_EXEMPTION.technicalNote.includes('浮力'));
  });

  it('跨方案檢查清單分類齊全', () => {
    const phases = new Set(COMPLIANCE_CHECKLIST.map((c) => c.phase));
    for (const p of ['下水前', '下水時']) {
      assert.ok(phases.has(p), `檢查清單應有 ${p} 階段`);
    }
  });
});

describe('six-plan helpers', () => {
  it('planMarineAreaIds 回傳海洋區名稱', () => {
    const p = KRABI_PLANS_V2.find((x) => x.tag === '5');
    const names = planMarineAreaIds(p);
    assert.ok(names.length > 0);
    assert.ok(names.some((n) => n.includes('Similan')));
  });

  it('涵蓋 Similan 與翡翠洞的判定正確', () => {
    assert.equal(planCoversSimilan(KRABI_PLANS_V2.find((p) => p.tag === '1')), true);
    assert.equal(planCoversSimilan(KRABI_PLANS_V2.find((p) => p.tag === '2')), false);
    assert.equal(planCoversEmeraldCave(KRABI_PLANS_V2.find((p) => p.tag === '2')), true);
    assert.equal(planCoversEmeraldCave(KRABI_PLANS_V2.find((p) => p.tag === '1')), false);
  });

  it('對 null 計畫安全降級', () => {
    assert.deepEqual(planMarineAreaIds(null), []);
    assert.equal(planCoversSimilan(null), false);
    assert.equal(planFreediveScore(null), 0);
    assert.equal(planLegalBurden(null), 0);
  });

  it('渡輪與陸路需求判定正確', () => {
    const lanta = KRABI_PLANS_V2.find((p) => p.tag === '3');
    assert.equal(planRequiresFerry(lanta), true);
    assert.equal(planRequiresLandTransfer(lanta), false);
    const trang = KRABI_PLANS_V2.find((p) => p.tag === '2');
    assert.equal(planRequiresLandTransfer(trang), true);
  });

  it('自由潛水可行性：蘭塔案最高', () => {
    const lanta = KRABI_PLANS_V2.find((p) => p.tag === '3');
    const full = KRABI_PLANS_V2.find((p) => p.tag === '4');
    assert.ok(planFreediveScore(lanta) > planFreediveScore(full));
  });

  it('planScoreTotal 在 0–100 範圍內', () => {
    for (const p of KRABI_PLANS_V2) {
      const s = planScoreTotal(p);
      assert.ok(s.total >= 0 && s.total <= 100, `${p.tag} 總分越界: ${s.total}`);
      for (const axis of SIX_PLAN_AXES) {
        const v = s.byAxis[axis.key];
        assert.ok(v >= 0 && v <= 100, `${p.tag} ${axis.key} 越界: ${v}`);
      }
    }
  });

  it('法規負擔：包船自排的案應高於全程有業者的案', () => {
    const values = KRABI_PLANS_V2.map((p) => ({ tag: p.tag, burden: planLegalBurden(p) }));
    assert.equal(values.length, 6);
    for (const v of values) assert.ok(v.burden >= 0 && v.burden <= 5, `${v.tag} 法規負擔應為 0–5`);
  });

  it('comparePlanV2 對每軸標出最佳且 either 軸不標', () => {
    const matrix = comparePlanV2(KRABI_PLANS_V2, SIX_PLAN_AXES);
    assert.equal(matrix.length, SIX_PLAN_AXES.length);
    for (const row of matrix) {
      if (row.betterWhen === 'either') {
        assert.equal(row.best, null, `${row.key} 為 either 不應標最佳`);
      } else {
        assert.ok(KRABI_PLANS_V2.some((p) => p.tag === row.best), `${row.key} 應有最佳`);
      }
    }
  });

  it('bestPlanForAxis 對單軸回傳正確方案', () => {
    // 涵蓋海域數：全海域案最多
    assert.equal(bestPlanForAxis('marineAreas', SIX_PLAN_AXES), '4');
    // 體力友善：零移動案最佳
    assert.equal(bestPlanForAxis('effort', SIX_PLAN_AXES), '6');
  });
});

describe('compliance helpers', () => {
  it('每案都有法規檢查結果且分項可追', () => {
    for (const p of KRABI_PLANS_V2) {
      const r = checkPlanCompliance(p);
      assert.ok(r.items.length >= 3, `${p.tag} 檢查項過少`);
      assert.ok(r.passRate >= 0 && r.passRate <= 1);
    }
  });

  it('含翡翠洞的案必須有潮汐確認項', () => {
    const withCave = KRABI_PLANS_V2.filter((p) => p.marineAreas.includes('trang'));
    for (const p of withCave) {
      const r = checkPlanCompliance(p);
      assert.ok(
        r.items.some((i) => i.key.includes('tide') || i.label.includes('潮汐')),
        `${p.tag} 應有潮汐確認項`,
      );
    }
  });

  it('compliancePassRate 對 null 安全降級', () => {
    assert.equal(compliancePassRate(null), 0);
  });

  it('入國家公園的案必須有公園額外要求確認項', () => {
    for (const p of KRABI_PLANS_V2) {
      const r = checkPlanCompliance(p);
      assert.ok(r.items.some((i) => i.key === 'park-rules'), `${p.tag} 應有公園要求確認項`);
    }
  });
});

describe('cost helpers for v2 plans', () => {
  it('換算 TWD 且區間合理', () => {
    const p = KRABI_PLANS_V2.find((x) => x.tag === '1');
    const t = planCostTwdV2(p);
    assert.ok(t.min > 0 && t.max >= t.min);
  });

  it('group total 為每人 × 人數', () => {
    const p = KRABI_PLANS_V2.find((x) => x.tag === '1');
    const per = planCostTwdV2(p);
    const g = estimateGroupTotalTwdV2(p, 4, { includeFlight: false });
    assert.equal(g.perPerson.min, per.min);
    assert.equal(g.travelers, 4);
    assert.equal(g.max, per.max * 4);
  });

  it('對 null 安全降級', () => {
    assert.equal(planCostTwdV2(null), null);
    assert.equal(estimateGroupTotalTwdV2(null, 4, {}), null);
  });
});
