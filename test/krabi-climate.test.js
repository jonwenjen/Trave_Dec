import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  ENSO_CURRENT,
  TMD_WARNINGS,
  ENSO_IMPACT_ANALYSIS,
  DATE_WINDOWS,
  WINDOW_AXES,
  HEAT_PREPARATIONS,
  ENSO_PHASE,
  ENSO_FRESHNESS_NOTE,
} from '../src/data/krabi-climate.js';
import {
  KRABI_PLANS_APRIL,
  APRIL_KEY_FACTS,
  APRIL_PARK_FEES,
  APRIL_COMPARE_AXES,
  APRIL_CONTINGENCY,
} from '../src/data/krabi-april.js';
import {
  windowScore,
  recommendedWindow,
  compareWindows,
  bestWindowForAxis,
  impactByDirection,
  summarizeEnso,
  heatRiskLevel,
  aprilPlansWithSimilan,
  aprilPlanSecretScore,
  verifySimilanWindow,
  totalParkFeeByPlan,
} from '../src/krabi-helpers.js';

describe('ENSO data integrity', () => {
  it('ENSO 現況標記為強 El Niño 且有來源', () => {
    assert.equal(ENSO_CURRENT.phase, 'strong');
    assert.ok(ENSO_CURRENT.source.startsWith('https://'));
    assert.ok(ENSO_CURRENT.timeline.length >= 3);
  });

  it('TMD 警告至少三項且皆有數值', () => {
    assert.ok(TMD_WARNINGS.items.length >= 3);
    for (const item of TMD_WARNINGS.items) {
      assert.ok(item.value, `${item.id} 應有量化值`);
      assert.ok(['warn', 'danger', 'info'].includes(item.tone));
    }
  });

  it('影響分析含雙面性，且有誠實的限制聲明', () => {
    assert.ok(ENSO_IMPACT_ANALYSIS.effects.length >= 3);
    assert.ok(ENSO_IMPACT_ANALYSIS.caveats.length >= 2, '應明確聲明統計傾向非預報');
    // 必須同時有有利與不利，否則就是單方面誇大
    const dirs = ENSO_IMPACT_ANALYSIS.effects.map((e) => e.direction);
    assert.ok(dirs.includes('favourable'));
    assert.ok(dirs.includes('adverse'));
  });

  it('日期窗口含三個且僅一個標為推薦', () => {
    assert.equal(DATE_WINDOWS.length, 3);
    assert.equal(DATE_WINDOWS.filter((w) => w.recommended).length, 1);
    assert.equal(recommendedWindow().id, 'apr-early');
  });

  it('各比較軸的數值都在 1–5 或合法狀態', () => {
    const allowed = { similanStatus: ['in-season', 'late-season', 'closed'], songkranImpact: ['none', 'residual', 'direct'] };
    for (const w of DATE_WINDOWS) {
      for (const axis of WINDOW_AXES) {
        const v = w[axis.key];
        if (allowed[axis.key]) {
          assert.ok(allowed[axis.key].includes(v), `${w.id} ${axis.key} 值不合法: ${v}`);
        } else {
          assert.ok(v >= 1 && v <= 5, `${w.id} ${axis.key} 應在 1–5，實得 ${v}`);
        }
      }
    }
  });

  it('高溫準備有具體可執行項目', () => {
    assert.ok(HEAT_PREPARATIONS.length >= 3);
    for (const p of HEAT_PREPARATIONS) assert.ok(p.detail.length > 5);
  });
});

describe('April plan data integrity', () => {
  it('恰好五案，標籤 A–E 且窗口一致', () => {
    assert.equal(KRABI_PLANS_APRIL.length, 5);
    assert.deepEqual(KRABI_PLANS_APRIL.map((p) => p.tag), ['A', 'B', 'C', 'D', 'E']);
    for (const p of KRABI_PLANS_APRIL) assert.match(p.window, /^2027-04-/);
  });

  it('每案 7 天、含雨備日、風險等級合法', () => {
    const ids = new Set();
    for (const p of KRABI_PLANS_APRIL) {
      assert.equal(p.days.length, 7, `${p.tag} 應有 7 天`);
      assert.ok(p.days.some((d) => d.isBuffer), `${p.tag} 應至少有一天緩衝`);
      assert.ok(['low', 'mid', 'mid-high', 'high'].includes(p.riskLevel));
      assert.ok(!ids.has(p.id), `${p.tag} id 重複`);
      ids.add(p.id);
    }
  });

  it('不得保留重複真相的 seaDayCount', () => {
    for (const p of KRABI_PLANS_APRIL) {
      assert.equal(p.seaDayCount, undefined, `${p.tag} 不應有 seaDayCount 宣告欄位`);
    }
  });

  it('翡翠洞案必須揭露潮汐與游泳限制', () => {
    const b = KRABI_PLANS_APRIL.find((p) => p.tag === 'B');
    const text = JSON.stringify(b);
    assert.ok(text.includes('低潮') || text.includes('中潮'), '應說明潮汐限制');
    assert.ok(text.includes('游泳') || text.includes('會游泳'), '應說明必須會游泳');
  });

  it('4 月前提含宋干節警示', () => {
    const songkran = APRIL_KEY_FACTS.find((f) => f.id === 'songkran');
    assert.ok(songkran, '應有宋干節前提');
    assert.equal(songkran.severity, 'critical');
    assert.ok(songkran.detail.includes('4/13'), '應給出宋干節日期區間');
  });

  it('公園費含 Similan 與翡翠洞', () => {
    assert.ok(APRIL_PARK_FEES.some((f) => f.id === 'similan'));
    assert.ok(APRIL_PARK_FEES.some((f) => f.id === 'hat-chao-mai'));
    for (const f of APRIL_PARK_FEES) assert.ok(f.url.startsWith('https://'));
  });

  it('應變表涵蓋潮汐與高溫（4 月的重點）', () => {
    const ids = APRIL_CONTINGENCY.map((c) => c.id);
    assert.ok(ids.includes('tide'));
    assert.ok(ids.includes('heat'));
  });
});

describe('window scoring helpers', () => {
  it('windowScore 給 4 月首選最高綜合評分', () => {
    const early = windowScore(DATE_WINDOWS.find((w) => w.id === 'apr-early'));
    const may = windowScore(DATE_WINDOWS.find((w) => w.id === 'may-early'));
    assert.ok(early.total > may.total, '4/6–4/12 應優於 5/3–5/9');
  });

  it('windowScore 尊重 betterWhen 方向', () => {
    const w = DATE_WINDOWS.find((x) => x.id === 'apr-early');
    // seaStability 為 high-better，值 5 應得滿分
    assert.equal(windowScore(w).byAxis.seaStability, 100);
    // crowdLevel 為 low-better，值 2 應得高分
    assert.ok(windowScore(w).byAxis.crowdLevel >= 60);
  });

  it('windowScore 對每個軸都回傳 0–100', () => {
    for (const w of DATE_WINDOWS) {
      const s = windowScore(w);
      for (const axis of WINDOW_AXES) {
        const v = s.byAxis[axis.key];
        assert.ok(v >= 0 && v <= 100, `${w.id} ${axis.key} 分數越界: ${v}`);
      }
    }
  });

  it('compareWindows 對每個軸標出最佳窗口', () => {
    const matrix = compareWindows(DATE_WINDOWS, WINDOW_AXES);
    assert.equal(matrix.length, WINDOW_AXES.length);
    for (const row of matrix) {
      if (row.betterWhen === 'either') {
        assert.equal(row.best, null, `${row.key} 為 either 不應標最佳`);
      } else {
        assert.ok(DATE_WINDOWS.some((w) => w.id === row.best), `${row.key} 應有最佳窗口`);
      }
    }
  });

  it('海況與人潮的最佳者都是 4 月首選', () => {
    const matrix = compareWindows(DATE_WINDOWS, WINDOW_AXES);
    assert.equal(matrix.find((r) => r.key === 'seaStability').best, 'apr-early');
    assert.equal(matrix.find((r) => r.key === 'crowdLevel').best, 'apr-early');
  });

  it('bestWindowForAxis 對單軸回傳正確窗口', () => {
    // heatLevel 為 low-better：4/6 窗口的高溫負擔（3）最低，非 4 月下旬
    assert.equal(bestWindowForAxis('heatLevel', WINDOW_AXES), 'apr-early');
    assert.equal(bestWindowForAxis('seaStability', WINDOW_AXES), 'apr-early');
    assert.equal(bestWindowForAxis('rainRisk', WINDOW_AXES), 'apr-early');
    // either 軸不參與比較
    assert.equal(bestWindowForAxis('similanStatus', WINDOW_AXES), null);
  });
});

describe('ENSO helper functions', () => {
  it('impactByDirection 依方向分組', () => {
    const fav = impactByDirection('favourable');
    const adv = impactByDirection('adverse');
    assert.ok(fav.length >= 1 && adv.length >= 1);
    assert.ok(fav.every((e) => e.direction === 'favourable'));
  });

  it('summarizeEnso 產出可用的摘要字串', () => {
    const s = summarizeEnso();
    assert.ok(s.length > 20);
    assert.ok(s.includes('El Niño'));
    assert.ok(s.includes('5 個方案') === false, '摘要不應混入方案數');
  });

  it('heatRiskLevel 依日期月份判斷高溫風險', () => {
    assert.equal(heatRiskLevel('2027-04-06'), 'moderate');
    assert.equal(heatRiskLevel('2027-04-25'), 'high');
    assert.ok(['low', 'moderate', 'high'].includes(heatRiskLevel('2027-05-10')));
  });

  it('heatRiskLevel 對壞日期安全降級', () => {
    assert.equal(heatRiskLevel('garbage'), 'unknown');
    assert.equal(heatRiskLevel(''), 'unknown');
  });

  it('ENSO 相關字串皆不得宣稱為確定預報', () => {
    // 防止未來有人把 caveat 刪掉
    assert.ok(ENSO_FRESHNESS_NOTE.includes('2027'));
    assert.ok(ENSO_IMPACT_ANALYSIS.caveats.some((c) => c.includes('統計傾向')));
  });
});

describe('april plan helpers', () => {
  it('aprilPlansWithSimilan 找出含 Similan 的方案', () => {
    const withS = aprilPlansWithSimilan();
    assert.ok(withS.length >= 1);
    for (const p of withS) {
      assert.ok(JSON.stringify(p).includes('Similan'), `${p.tag} 應確實含 Similan`);
    }
  });

  it('aprilPlanSecretScore 對含 Trang 的方案給高分', () => {
    const b = KRABI_PLANS_APRIL.find((p) => p.tag === 'B');
    const a = KRABI_PLANS_APRIL.find((p) => p.tag === 'A');
    assert.ok(aprilPlanSecretScore(b) > aprilPlanSecretScore(a));
  });

  it('aprilPlanSecretScore 對缺欄位的方案不拋錯', () => {
    assert.equal(aprilPlanSecretScore(null), 0);
    assert.equal(aprilPlanSecretScore({}), 0);
  });

  it('verifySimilanWindow 對 4 月與 5 月下旬給出不同結論', () => {
    const april = verifySimilanWindow('2027-04-15');
    const lateMay = verifySimilanWindow('2027-05-20');
    assert.equal(april.inSeason, true);
    assert.equal(lateMay.inSeason, false);
    assert.ok(lateMay.note.length > 5);
  });

  it('totalParkFeeByPlan 加總公園費', () => {
    const a = KRABI_PLANS_APRIL.find((p) => p.tag === 'A');
    const expected = a.days.reduce((s, d) => s + (d.parkFeeTHB || 0), 0);
    assert.equal(totalParkFeeByPlan(a), expected);
    assert.equal(totalParkFeeByPlan(null), 0);
  });
});
