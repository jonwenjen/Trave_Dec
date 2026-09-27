/**
 * Trave_Dec — 九日三案（放寬天數 ＋ 雙點進出）
 *
 * 這三案存在的原因：原六案全部鎖死 7 天，導致 Similan 能見度與翡翠洞秘境
 * 必須二選一。本區塊誠實地把「放寬了什麼、代價是什麼」寫在卡片上，
 * 避免看起來像只是把 7 天案拉長。
 */

import {
  KRABI_PLANS_V3,
  V3_PREMISE,
  planDaysCount,
  planUsesOpenJaw,
  planTotalScoreV3,
  rankPlansV3,
  THB_TO_TWD_ASSUMED,
} from './krabi-helpers-v3.js';
import { planTotalTHB, splitTHB } from './krabi-helpers.js';

const DAY_LABELS = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9'];

const EXTRA_AXIS_LABELS = {
  duration: '天數餘裕',
  openJaw: '雙點進出',
};

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function fmtTHB(n) {
  return `฿${Math.round(n).toLocaleString('en-US')}`;
}

/** 九案聯合排名中的名次（1-based） */
function rankOf(plan) {
  const ranked = rankPlansV3();
  const idx = ranked.findIndex((r) => r.plan.id === plan.id);
  return idx + 1;
}

function dayRow(day, i) {
  const buffer = Boolean(day.isBuffer);
  return `
      <li class="plan9__day${buffer ? ' plan9__day--buffer' : ''}">
        <div class="plan9__day-head">
          <span class="plan9__day-no">${esc(DAY_LABELS[i] || `D${i + 1}`)}</span>
          ${day.seaDay ? '<span class="plan9__day-sea">出海</span>' : '<span class="plan9__day-land">陸路</span>'}
          ${buffer ? '<span class="plan9__day-buffer">緩衝</span>' : ''}
        </div>
        <h4 class="plan9__day-title">${esc(day.title)}</h4>
        <p class="plan9__day-detail">${esc(day.detail)}</p>
        <p class="plan9__day-meta">
          <span class="plan9__day-transport">${esc(day.transport)}</span>
          ${day.costTHB ? `<span class="plan9__day-cost">${fmtTHB(day.costTHB)}</span>` : ''}
          ${day.parkFeeTHB ? `<span class="plan9__day-park">公園費 ${fmtTHB(day.parkFeeTHB)}</span>` : ''}
        </p>
      </li>`;
}

function planCard(plan, travelers) {
  const days = plan.days.length;
  const rank = rankOf(plan);
  const total = planTotalTHB(plan);
  const per = splitTHB(total, travelers);
  const score = planTotalScoreV3(plan);
  const parkSum = plan.days.reduce((a, d) => a + (d.parkFeeTHB || 0), 0);
  const payDays = plan.days.filter((d) => d.costTHB).length;
  const totalLabel = `D${days} · ${esc(plan.window.replace(/（.*/, ''))}`;

  const badge = rank <= 2
    ? `<span class="plan9__badge plan9__badge--top">九案第 ${rank}</span>`
    : `<span class="plan9__badge">九案第 ${rank}</span>`;

  return `
    <article class="plan9" id="plan9-${esc(plan.id)}" data-plan9-tag="${esc(plan.tag)}">
      <header class="plan9__head">
        <div class="plan9__head-top">
          <span class="plan9__tag" aria-hidden="true">${esc(plan.tag)}</span>
          ${badge}
          <span class="plan9__score" title="含天數與雙點進出共 10 軸">${score.total}<small>/100</small></span>
        </div>
        <h3 class="plan9__name">${esc(plan.name)}</h3>
        <p class="plan9__positioning">${esc(plan.positioning)}</p>
        <p class="plan9__window">${esc(totalLabel)}</p>
      </header>

      <dl class="plan9__facts">
        <div class="plan9__fact">
          <dt>基地</dt><dd>${esc(plan.base)}</dd>
        </div>
        <div class="plan9__fact">
          <dt>進出</dt><dd class="plan9__fact-oj">${esc(plan.entryPoint)} → ${esc(plan.exitPoint)}</dd>
        </div>
        <div class="plan9__fact">
          <dt>天數</dt><dd>${days} 天 · ${plan.days.filter((d) => d.seaDay).length} 出海日</dd>
        </div>
        <div class="plan9__fact">
          <dt>浮潛點位</dt><dd>${plan.snorkelStops} 個</dd>
        </div>
        <div class="plan9__fact">
          <dt>公園費</dt><dd>合計 ${fmtTHB(parkSum)}</dd>
        </div>
        <div class="plan9__fact">
          <dt>行程風險</dt>
          <dd>
            <span class="plan9__risk plan9__risk--${esc(plan.riskLevel)}">${esc(plan.riskNote)}</span>
          </dd>
        </div>
      </dl>

      <div class="plan9__cost">
        <div class="plan9__cost-row">
          <span class="plan9__cost-label">整團 ${travelers} 人</span>
          <span class="plan9__cost-value">${fmtTHB(total.min)} – ${fmtTHB(total.max)}</span>
        </div>
        <div class="plan9__cost-row plan9__cost-row--per">
          <span class="plan9__cost-label">每人（≈ TWD ${Math.round(per.min * THB_TO_TWD_ASSUMED).toLocaleString('en-US')} – ${Math.round(per.max * THB_TO_TWD_ASSUMED).toLocaleString('en-US')}）</span>
        </div>
        <p class="plan9__cost-note">${esc(plan.estimateTHB.note)}</p>
      </div>

      <p class="plan9__rationale"><strong>為什麼要 9 天：</strong>${esc(plan.windowRationale)}</p>

      <div class="plan9__suits">
        <h4 class="plan9__sub">適合誰</h4>
        <p>${esc(plan.suits)}</p>
      </div>

      <div class="plan9__highlight">
        <h4 class="plan9__sub">這一案的重點</h4>
        <p>${esc(plan.highlight)}</p>
      </div>

      <details class="plan9__toggle">
        <summary class="plan9__summary">逐日行程（${days} 天，${payDays} 天有船資）</summary>
        <ol class="plan9__days">${plan.days.map(dayRow).join('')}
        </ol>
      </details>

      <ul class="plan9__sources">
        ${plan.sources.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a></li>`).join('')}
      </ul>
    </article>`;
}

/** 九案 × 額外兩軸 比較表 */
function extraAxesTable() {
  const rows = [
    { label: '天數', get: (p) => planDaysCount(p) },
    { label: '雙點進出', get: (p) => (planUsesOpenJaw(p) ? `${p.entryPoint}→${p.exitPoint}` : '單點往返') },
  ];
  return `
      <div class="krabi-compare__scroll">
        <table class="krabi-table plan9__table">
          <caption class="visually-hidden">三個九日方案與放寬前提比較</caption>
          <thead>
            <tr>
              <th scope="col">比較項目</th>
              ${KRABI_PLANS_V3.map((p) => `<th scope="col">案 ${esc(p.tag)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.map((row) => {
    const values = KRABI_PLANS_V3.map((p) => row.get(p));
    const nums = KRABI_PLANS_V3.map((p) => planDaysCount(p));
    const best = Math.max(...nums);
    return `<tr>
                <th scope="row">${esc(row.label)}</th>
                ${KRABI_PLANS_V3.map((p, i) => {
      const isBest = row.label === '天數' && nums[i] === best;
      return `<td${isBest ? ' class="is-best"' : ''}>${esc(values[i])}${isBest ? ' <span class="krabi-compare__best-mark" aria-label="最佳">★</span>' : ''}</td>`;
    }).join('')}
              </tr>`;
  }).join('')}
            <tr>
              <th scope="row">綜合評分</th>
              ${KRABI_PLANS_V3.map((p) => `<td>${planTotalScoreV3(p).total}<small>/100</small></td>`).join('')}
            </tr>
          </tbody>
        </table>
      </div>`;
}

/**
 * 建立九日三案區塊
 * @returns {{refreshTravelers:function, destroy:function}}
 */
export function createKrabiV3Section({ travelers = 2, onTravelersChange } = {}) {
  const section = document.getElementById('plans9');
  if (!section) return { refreshTravelers() {}, destroy() {} };

  let state = { travelers };

  const render = () => {
    const best = rankPlansV3()[0];
    section.innerHTML = `
      <div class="section-container">
        <div class="section-header">
          <p class="section-eyebrow">放寬兩個前提</p>
          <h2 class="section-title" id="plans9-heading">九日三案</h2>
          <p class="section-lead">
            前面六案全部鎖死在 7 天。7 天塞不下 Similan（船程 1.5–2 小時）與翡翠洞（陸路 2–3 小時），
            所以「能見度」與「秘境」必須二選一。放寬兩件事就不必二選一：<strong>天數 7 → 9</strong>、
            <strong>雙點進出</strong>（回程直接從 Trang 出發）。
          </p>
        </div>

        <aside class="plan9__premise" aria-labelledby="plan9-premise-h">
          <h3 class="plan9__premise-h" id="plan9-premise-h">這三案放寬了什麼，代價是什麼</h3>
          <dl class="plan9__premise-list">
            <div>
              <dt>天數 ${V3_PREMISE.days.from} → ${V3_PREMISE.days.to} 天</dt>
              <dd>${esc(V3_PREMISE.days.why)}</dd>
            </div>
            <div>
              <dt>雙點進出（open-jaw）</dt>
              <dd>${esc(V3_PREMISE.openJaw.why)}</dd>
            </div>
            <div class="plan9__premise-cost">
              <dt>代價</dt>
              <dd>
                多 2 晚住宿與餐費；${esc(V3_PREMISE.openJaw.cost)}
              </dd>
            </div>
          </dl>
        </aside>

        <div class="plan9__list" id="plans9-list" aria-label="三個九日方案">
          ${KRABI_PLANS_V3.map((p) => planCard(p, state.travelers)).join('')}
        </div>

        <div class="plan9__compare" id="plans9-compare">
          <h3 class="plan9__sub">三案比較</h3>
          ${extraAxesTable()}
        </div>

        <p class="plan9__footnote">
          九案中的最高分是 <strong>案 ${esc(best.plan.tag)}</strong>（${esc(best.plan.name)}，${best.score.total}/100，含天數與雙點進出共 10 軸）。
          評分只反映行程設計，實際選擇仍取決於你們的體力、預算與是否願意多請兩天假。
        </p>
      </div>`;
  };

  render();

  return {
    refreshTravelers(next) {
      state.travelers = next;
      const list = document.getElementById('plans9-list');
      if (list) {
        list.innerHTML = KRABI_PLANS_V3.map((p) => planCard(p, next)).join('');
      }
      if (typeof onTravelersChange === 'function') onTravelersChange(next);
    },
    destroy() {
      section.innerHTML = '';
    },
  };
}

export { EXTRA_AXIS_LABELS };
