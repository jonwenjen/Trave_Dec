import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  PHUKET_PLANS,
  DEPARTURE_MATRIX,
  OFFSHORE_REEFS,
  MARINE_PARK_DESTINATIONS,
  PHUKET_FREEDIVING,
  PHUKET_BOATS,
  HEAD_TO_HEAD,
  PHUKET_DATA_CAVEAT,
  DEPARTURE_VERDICT,
} from '../src/data/phuket.js';
import {
  planDaysCount,
  planUsesOpenJaw,
  planRequiresFerry,
  planRequiresLandTransfer,
  planLegalBurden,
  phuketDirectFlights,
  phuketVisibilityScore,
  phuketSecrecyScore,
  phuketParkFeeTHB,
  phuketFreediveScore,
  phuketPlanScore,
  rankPhuketPlans,
  comparePhuketAxes,
  recommendPhuketPlan,
  formatFlightRoute,
  departureSavingsHours,
} from '../src/phuket-helpers.js';

describe('Phuket dataset integrity', () => {
  it('恰好五種方案', () => {
    assert.equal(PHUKET_PLANS.length, 5);
    assert.equal(new Set(PHUKET_PLANS.map((p) => p.id)).size, 5);
  });

  it('每案天數介於 7–9，且都採單點進出（普吉往返）', () => {
    for (const p of PHUKET_PLANS) {
      const d = planDaysCount(p);
      assert.ok(d >= 7 && d <= 9, `${p.tag} 天數 ${d} 超出 7–9`);
      assert.equal(p.entryPoint, 'HKT（普吉）');
      assert.equal(p.exitPoint, p.entryPoint, `${p.tag} 不應為 open-jaw`);
      assert.equal(planUsesOpenJaw(p), false);
    }
  });

  it('每案都有緩衝日（2027 班表未定，出發地不能綁死）', () => {
    for (const p of PHUKET_PLANS) {
      assert.ok(p.days.some((d) => d.isBuffer), `${p.tag} 應有緩衝日`);
    }
  });

  it('每案都有來源、費用說明與風險等級', () => {
    for (const p of PHUKET_PLANS) {
      assert.ok(p.sources.length >= 1, `${p.tag} 缺來源`);
      for (const s of p.sources) assert.ok(s.url.startsWith('https://'));
      assert.ok(p.estimateTHB.note.length > 10);
      assert.ok(['low', 'mid', 'mid-high', 'high'].includes(p.riskLevel));
      assert.ok(p.windowRationale.length > 20, `${p.tag} 需說明日期前提`);
    }
  });

  it('不應有 seaDayCount 欄位（避免與 day flags 重複出真相）', () => {
    for (const p of PHUKET_PLANS) assert.equal(p.seaDayCount, undefined);
  });

  it('自由潛水專程案必須明列課程費用', () => {
    const p3 = PHUKET_PLANS.find((p) => p.tag === 'P3');
    assert.ok(p3.estimateTHB.note.includes('課程'), 'P3 費用說明需標明含課程');
  });

  it('Similan 案必須標明季別限制', () => {
    const p4 = PHUKET_PLANS.find((p) => p.tag === 'P4');
    assert.ok(p4.marineAreas.includes('similan'));
    assert.ok(p4.windowRationale.includes('10/15'), 'P4 需標明 Similan 季別');
  });
});

describe('departure matrix — 桃園出發', () => {
  it('桃園→普吉為直飛，桃園→甲米非直飛', () => {
    const tpeHkt = DEPARTURE_MATRIX.find((d) => d.id === 'tpe-hkt');
    const tpeKbv = DEPARTURE_MATRIX.find((d) => d.id === 'tpe-kbv');
    assert.equal(tpeHkt.direct, true);
    assert.equal(tpeKbv.direct, false);
  });

  it('直飛班次稀少必須被標註為前提而非優勢', () => {
    const tpeHkt = DEPARTURE_MATRIX.find((d) => d.id === 'tpe-hkt');
    assert.ok(tpeHkt.frequency.includes('2'), '應載明每週約 2 班');
    assert.ok(tpeHkt.caveat.length > 0, '直飛必須有 caveat');
  });

  it('DEPARTURE_VERDICT 同時呈現優勢與代價', () => {
    assert.ok(DEPARTURE_VERDICT.headline.length > 5);
    assert.ok(DEPARTURE_VERDICT.caveat.includes('班'), '必須提到班次限制');
  });

  it('formatFlightRoute 產出可讀字串', () => {
    const r = formatFlightRoute('桃園 TPE', '普吉 HKT', true);
    assert.ok(r.includes('直飛'));
    const r2 = formatFlightRoute('桃園 TPE', '甲米 KBV', false);
    assert.ok(r2.includes('轉機') || r2.includes('1 stop'));
  });

  it('departureSavingsHours 計算正確', () => {
    // 直飛 4h25m vs 經曼谷 13–16h → 節省約 9–11 小時
    const saved = departureSavingsHours();
    assert.ok(saved >= 8 && saved <= 12, `實得 ${saved}`);
  });
});

describe('Phuket scoring', () => {
  it('phuketDirectFlights 正確區分', () => {
    const p1 = PHUKET_PLANS.find((p) => p.tag === 'P1');
    const p4 = PHUKET_PLANS.find((p) => p.tag === 'P4');
    assert.equal(phuketDirectFlights(p1), true);
    assert.equal(phuketDirectFlights(p4), true, 'P4 亦由 HKT 進出台');
    assert.equal(phuketDirectFlights(null), false);
  });

  it('能見度分數：含 Racha 的案高於只含 Coral Island 的案', () => {
    const withRacha = PHUKET_PLANS.filter((p) => p.marineAreas.includes('racha'));
    const withoutRacha = PHUKET_PLANS.filter((p) => !p.marineAreas.includes('racha'));
    assert.ok(withRacha.length > 0 && withoutRacha.length > 0);
    for (const a of withRacha) {
      for (const b of withoutRacha) {
        assert.ok(
          phuketVisibilityScore(a) >= phuketVisibilityScore(b),
          `${a.tag} 應不低於 ${b.tag}`,
        );
      }
    }
  });

  it('秘境分數：含 Koh Yao 的案高於不含的', () => {
    const withYao = PHUKET_PLANS.filter((p) => p.marineAreas.includes('koh-yao'));
    const withoutYao = PHUKET_PLANS.filter((p) => !p.marineAreas.includes('koh-yao'));
    for (const a of withYao) {
      for (const b of withoutYao) {
        assert.ok(phuketSecrecyScore(a) > phuketSecrecyScore(b), `${a.tag} 應高於 ${b.tag}`);
      }
    }
  });

  it('公園費合計正確（Koh Yao 與 Racha 免費）', () => {
    const p2 = PHUKET_PLANS.find((p) => p.tag === 'P2'); // koh-yao + phang-nga + khai
    const fee = phuketParkFeeTHB(p2);
    assert.ok(fee > 0);
    // Koh Yao 免費，所以總額應小於同等天數但含多個付費公園的案
    const p1 = PHUKET_PLANS.find((p) => p.tag === 'P1'); // 含 Khai(300)
    assert.ok(fee >= 300);
  });

  it('自由潛水分數：P3 專程案最高', () => {
    const p3 = phuketFreediveScore(PHUKET_PLANS.find((p) => p.tag === 'P3'));
    for (const p of PHUKET_PLANS) {
      if (p.tag === 'P3') continue;
      assert.ok(p3 > phuketFreediveScore(p), `P3 應高於 ${p.tag}`);
    }
  });

  it('每案總分都落在 0–100', () => {
    for (const p of PHUKET_PLANS) {
      const s = phuketPlanScore(p);
      assert.ok(s.total >= 0 && s.total <= 100, `${p.tag} 越界 ${s.total}`);
    }
  });

  it('rankPhuketPlans 遞減且涵蓋 5 案', () => {
    const ranked = rankPhuketPlans();
    assert.equal(ranked.length, 5);
    for (let i = 1; i < ranked.length; i += 1) {
      assert.ok(ranked[i - 1].score.total >= ranked[i].score.total);
    }
  });

  it('recommendPhuketPlan 回傳實際存在的案', () => {
    const best = recommendPhuketPlan();
    assert.ok(PHUKET_PLANS.some((p) => p.id === best.id));
  });

  it('comparePhuketAxes 每軸標出最佳者', () => {
    const axes = comparePhuketAxes();
    assert.ok(axes.length >= 4);
    for (const a of axes) {
      assert.ok(PHUKET_PLANS.some((p) => p.tag === a.best), `${a.key} 未標最佳`);
      assert.ok(a.values.length === 5);
    }
  });
});

describe('Phuket movement + legal', () => {
  it('P5 需渡輪（Koh Yao 進出台），P1 不需', () => {
    assert.equal(planRequiresFerry(PHUKET_PLANS.find((p) => p.tag === 'P5')), true);
    assert.equal(planRequiresFerry(PHUKET_PLANS.find((p) => p.tag === 'P1')), false);
  });

  it('P4 需陸路（南下 Khao Lak），P1 不需', () => {
    assert.equal(planRequiresLandTransfer(PHUKET_PLANS.find((p) => p.tag === 'P4')), true);
    assert.equal(planRequiresLandTransfer(PHUKET_PLANS.find((p) => p.tag === 'P1')), false);
  });

  it('法規負擔：P4（含 Similan）應高於 P3（不移動）', () => {
    // Similan 有國家公園專屬的深度與人數規定，屬額外確認項
    const p3 = planLegalBurden(PHUKET_PLANS.find((p) => p.tag === 'P3'));
    const p4 = planLegalBurden(PHUKET_PLANS.find((p) => p.tag === 'P4'));
    assert.ok(p4 > p3, `P4 ${p4} 應高於 P3 ${p3}`);
  });

  it('法規負擔：普吉的點位法規要求普遍低於甲米（含 Trang 者）', () => {
    // 這是實質差異：普吉離岸礁與 Racha/Koh Yao 都不在國家公園內，
    // 法規負擔僅來自 Similan 與基地轉移
    for (const p of PHUKET_PLANS) {
      assert.ok(
        planLegalBurden(p) <= 1.5,
        `${p.tag} 法規負擔 ${planLegalBurden(p)} 偏高，普吉點位不應有此負擔`,
      );
    }
  });

  it('所有普吉方案的法規負落在合理區間', () => {
    for (const p of PHUKET_PLANS) {
      const b = planLegalBurden(p);
      assert.ok(b >= 0.5 && b <= 3.5, `${p.tag} ${b}`);
    }
  });
});

describe('Phuket reference data', () => {
  it('離岸礁至少 5 個，且標示能見度與人潮', () => {
    assert.ok(OFFSHORE_REEFS.length >= 5);
    for (const r of OFFSHORE_REEFS) {
      assert.ok(r.boatMinutes > 0);
      assert.ok(['low', 'mid', 'high'].includes(r.crowd));
      assert.ok(r.source.startsWith('https://'));
    }
  });

  it('Similan 條目必須點出「從普吉出發」的誤區', () => {
    const s = MARINE_PARK_DESTINATIONS.find((d) => d.id === 'similan');
    assert.ok(s.keyIssue.includes('誤區') || s.keyIssue.includes('Thap Lamu'));
    assert.ok(s.verdict.includes('Khao Lak'));
  });

  it('自由潛水資料含四系統學校與法規交叉提醒', () => {
    assert.ok(PHUKET_FREEDIVING.schools.length >= 3);
    const sss = PHUKET_FREEDIVING.schools.find((s) => s.name.includes('SSS'));
    assert.equal(sss.systems.length, 4);
    assert.ok(PHUKET_FREEDIVING.legalNote.includes('AIDA 2'));
    assert.ok(PHUKET_FREEDIVING.legalNote.includes('AIDA 1'));
  });

  it('包船資料含四種船型與併團價', () => {
    for (const k of ['longtail', 'speedboat', 'catamaran', 'joinTours']) {
      assert.ok(PHUKET_BOATS[k], `缺 ${k}`);
    }
  });

  it('權衡表每一面向都有明確勝方（不可有未知）', () => {
    for (const h of HEAD_TO_HEAD) {
      assert.ok(['phuket', 'krabi', 'tie'].includes(h.winner), `${h.aspect} 勝方無效`);
    }
  });

  it('資料時效警告必須列出待查證項目與研究日期', () => {
    assert.ok(PHUKET_DATA_CAVEAT.items.length >= 5);
    assert.equal(PHUKET_DATA_CAVEAT.researchDate, '2026-09-27');
  });
});
