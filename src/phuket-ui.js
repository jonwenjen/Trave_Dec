/**
 * Trave_Dec — Phuket 與離岸島嶼（桃園出發）UI
 *
 * 數字全部來自 src/data/phuket.js 與 src/phuket-helpers.js，這裡只負責排版與互動。
 * 費用試算與人數連動既有甲米區塊共用。
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
  PHUKET_AXES,
  planDaysCount,
  phuketPlanScore,
  rankPhuketPlans,
  recommendPhuketPlan,
  comparePhuketAxes,
  offshoreReefsByVisibility,
  phuketParkFeeTHB,
  departureSavingsHours,
  formatFlightRoute,
  THB_TO_TWD_ASSUMED,
} from './phuket-helpers.js';
import { planTotalTHB, splitTHB } from './krabi-helpers.js';

const DAY_LABELS = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9'];

const CROWD_TONE = { low: '低', mid: '中', high: '高' };

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function fmtTHB(n) {
  return `฿${Math.round(n).toLocaleString('en-US')}`;
}

function rankOf(plan) {
  return rankPhuketPlans().findIndex((r) => r.plan.id === plan.id) + 1;
}

function dayRow(day, i) {
  const buffer = Boolean(day.isBuffer);
  return `
        <li class="pkt__day${buffer ? ' pkt__day--buffer' : ''}">
          <div class="pkt__day-head">
            <span class="pkt__day-no">${esc(DAY_LABELS[i] || `D${i + 1}`)}</span>
            ${day.seaDay ? '<span class="pkt__day-sea">出海</span>' : '<span class="pkt__day-land">陸路</span>'}
            ${buffer ? '<span class="pkt__day-buffer">緩衝</span>' : ''}
          </div>
          <h4 class="pkt__day-title">${esc(day.title)}</h4>
          <p class="pkt__day-detail">${esc(day.detail)}</p>
          <p class="pkt__day-meta">
            <span class="pkt__day-transport">${esc(day.transport)}</span>
            ${day.costTHB ? `<span class="pkt__day-cost">${fmtTHB(day.costTHB)}</span>` : ''}
            ${day.parkFeeTHB ? `<span class="pkt__day-park">公園費 ${fmtTHB(day.parkFeeTHB)}</span>` : ''}
          </p>
        </li>`;
}

function planCard(plan, travelers) {
  const days = planDaysCount(plan);
  const rank = rankOf(plan);
  const total = planTotalTHB(plan);
  const per = splitTHB(total, travelers);
  const score = phuketPlanScore(plan);
  const parkFee = phuketParkFeeTHB(plan);
  const payDays = plan.days.filter((d) => d.costTHB).length;
  const badge = rank === 1
    ? '<span class="pkt__badge pkt__badge--top">五案最高分</span>'
    : `<span class="pkt__badge">五案第 ${rank}</span>`;

  return `
    <article class="pkt" id="pkt-${esc(plan.id)}" data-pkt-tag="${esc(plan.tag)}">
      <header class="pkt__head">
        <div class="pkt__head-top">
          <span class="pkt__tag" aria-hidden="true">${esc(plan.tag)}</span>
          ${badge}
          <span class="pkt__score" title="含能見度、秘境、自由潛水、涵蓋、移動、費用、公園費共 7 軸">${score.total}<small>/100</small></span>
        </div>
        <h3 class="pkt__name">${esc(plan.name)}</h3>
        <p class="pkt__positioning">${esc(plan.positioning)}</p>
      </header>

      <dl class="pkt__facts">
        <div class="pkt__fact">
          <dt>基地</dt><dd>${esc(plan.base)}</dd>
        </div>
        <div class="pkt__fact">
          <dt>進出</dt><dd class="pkt__fact-route">${esc(formatFlightRoute('桃園 TPE', '普吉 HKT', true))}</dd>
        </div>
        <div class="pkt__fact">
          <dt>天數</dt><dd>${days} 天 · ${plan.days.filter((d) => d.seaDay).length} 出海日</dd>
        </div>
        <div class="pkt__fact">
          <dt>浮潛點位</dt><dd>${plan.snorkelStops} 個 · 公園費 ${parkFee === 0 ? '免費' : fmtTHB(parkFee)}</dd>
        </div>
        <div class="pkt__fact">
          <dt>行程風險</dt>
          <dd><span class="pkt__risk pkt__risk--${esc(plan.riskLevel)}">${esc(plan.riskNote)}</span></dd>
        </div>
      </dl>

      <div class="pkt__cost">
        <div class="pkt__cost-row">
          <span class="pkt__cost-label">整團 ${travelers} 人</span>
          <span class="pkt__cost-value">${fmtTHB(total.min)} – ${fmtTHB(total.max)}</span>
        </div>
        <div class="pkt__cost-row pkt__cost-row--per">
          <span class="pkt__cost-label">每人（≈ TWD ${Math.round(per.min * THB_TO_TWD_ASSUMED).toLocaleString('en-US')} – ${Math.round(per.max * THB_TO_TWD_ASSUMED).toLocaleString('en-US')}）</span>
        </div>
        <p class="pkt__cost-note">${esc(plan.estimateTHB.note)}</p>
      </div>

      <p class="pkt__rationale"><strong>日期前提：</strong>${esc(plan.windowRationale)}</p>

      <div class="pkt__suits">
        <h4 class="pkt__sub">適合誰</h4>
        <p>${esc(plan.suits)}</p>
      </div>

      <div class="pkt__highlight">
        <h4 class="pkt__sub">這一案的重點</h4>
        <p>${esc(plan.highlight)}</p>
      </div>

      <details class="pkt__toggle">
        <summary class="pkt__summary">逐日行程（${days} 天，${payDays} 天有船資）</summary>
        <ol class="pkt__days">${plan.days.map(dayRow).join('')}
        </ol>
      </details>

      <ul class="pkt__sources">
        ${plan.sources.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a></li>`).join('')}
      </ul>
    </article>`;
}

function departureTable() {
  return `
        <div class="krabi-compare__scroll">
          <table class="krabi-table pkt__table">
            <caption class="visually-hidden">桃園與高雄出發至普吉與甲米的航線比較</caption>
            <thead>
              <tr>
                <th scope="col">航線</th>
                <th scope="col">直飛</th>
                <th scope="col">時間</th>
                <th scope="col">班次</th>
              </tr>
            </thead>
            <tbody>
              ${DEPARTURE_MATRIX.map((d) => `
                <tr>
                  <th scope="row">${esc(d.from)} → ${esc(d.to)}</th>
                  <td class="${d.direct ? 'is-best' : ''}">${d.direct ? '✅ 直飛' : '❌ 需轉機'}</td>
                  <td>${esc(d.duration)}</td>
                  <td>${esc(d.frequency)}</td>
                </tr>
                <tr class="pkt__note-row">
                  <td colspan="4">${esc(d.note)}${d.caveat !== '—' ? ` <em>（${esc(d.caveat)}）</em>` : ''}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
}

function offshoreTable() {
  const sorted = offshoreReefsByVisibility();
  return `
        <div class="krabi-compare__scroll">
          <table class="krabi-table pkt__table">
            <caption class="visually-hidden">普吉離岸珊瑚礁點位比較</caption>
            <thead>
              <tr>
                <th scope="col">島嶼</th>
                <th scope="col">船程</th>
                <th scope="col">能見度</th>
                <th scope="col">人潮</th>
                <th scope="col">公園費</th>
                <th scope="col">特色</th>
              </tr>
            </thead>
            <tbody>
              ${sorted.map((r) => `
                <tr>
                  <th scope="row">${esc(r.name)}</th>
                  <td>${r.boatMinutes} 分</td>
                  <td>${esc(r.visibility)}</td>
                  <td class="pkt__crowd pkt__crowd--${esc(r.crowd)}">${esc(r.crowdLabel)}</td>
                  <td class="${r.parkFeeTHB === 0 ? 'is-best' : ''}">${r.parkFeeTHB === 0 ? '免費' : fmtTHB(r.parkFeeTHB)}</td>
                  <td class="pkt__cell-note">${esc(r.highlight)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
}

function parkList() {
  return `
        <ul class="pkt__parks">
          ${MARINE_PARK_DESTINATIONS.map((d) => `
            <li class="pkt__park">
              <h4 class="pkt__park-name">${esc(d.name)}
                <span class="pkt__park-fee">${d.parkFeeTHB === 0 ? '免公園費' : `公園費 ${fmtTHB(d.parkFeeTHB)}`}</span>
              </h4>
              <p class="pkt__park-route"><span>普吉出發：</span>${esc(d.fromPhuket)}</p>
              ${d.fromKrabi ? `<p class="pkt__park-route"><span>甲米出發：</span>${esc(d.fromKrabi)}</p>` : ''}
              <p class="pkt__park-season"><span>季節：</span>${esc(d.season)}</p>
              ${d.keyIssue ? `<p class="pkt__park-issue">${esc(d.keyIssue)}</p>` : ''}
              <p class="pkt__park-verdict">→ ${esc(d.verdict)}</p>
            </li>`).join('')}
        </ul>`;
}

function freedivingBlock() {
  return `
        <div class="pkt__fd">
          <p class="pkt__fd-summary">${esc(PHUKET_FREEDIVING.summary)}</p>
          <ul class="pkt__fd-schools">
            ${PHUKET_FREEDIVING.schools.map((s) => `
              <li class="pkt__fd-school">
                <h4 class="pkt__fd-school-name">${esc(s.name)}</h4>
                <p class="pkt__fd-systems">${s.systems.map((x) => `<span class="pkt__chip">${esc(x)}</span>`).join('')}</p>
                <p class="pkt__fd-hl">${esc(s.highlight)}</p>
                <a class="pkt__fd-link" href="${esc(s.source)}" target="_blank" rel="noopener">官方頁面</a>
              </li>`).join('')}
          </ul>
          <dl class="pkt__fd-compare">
            <div><dt>普吉</dt><dd>${esc(PHUKET_FREEDIVING.comparison.phuket)}</dd></div>
            <div><dt>甲米／蘭塔</dt><dd>${esc(PHUKET_FREEDIVING.comparison.krabi)}</dd></div>
          </dl>
          <p class="pkt__fd-verdict"><strong>結論：</strong>${esc(PHUKET_FREEDIVING.comparison.verdict)}</p>
          <p class="pkt__fd-legal"><strong>法規提醒：</strong>${esc(PHUKET_FREEDIVING.legalNote)}</p>
        </div>`;
}

function boatsBlock() {
  const keys = ['longtail', 'speedboat', 'catamaran', 'joinTours'];
  return `
        <div class="pkt__boats">
          ${keys.map((k) => {
    const b = PHUKET_BOATS[k];
    const price = b.halfDay || b.fullDay || b.range;
    return `
            <div class="pkt__boat">
              <h4 class="pkt__boat-name">${esc(b.label)}</h4>
              <p class="pkt__boat-price">${esc(price)}</p>
              ${b.capacity ? `<p class="pkt__boat-cap">適合 ${esc(b.capacity)}</p>` : ''}
              <p class="pkt__boat-note">${esc(b.note)}</p>
            </div>`;
  }).join('')}
        </div>`;
}

function headToHead() {
  const label = { phuket: '普吉勝', krabi: '甲米勝', tie: '平手' };
  return `
        <ul class="pkt__h2h">
          ${HEAD_TO_HEAD.map((h) => `
            <li class="pkt__h2h-row pkt__h2h-row--${esc(h.winner)}">
              <span class="pkt__h2h-aspect">${esc(h.aspect)}</span>
              <span class="pkt__h2h-winner">${esc(label[h.winner])}</span>
              <span class="pkt__h2h-note">${esc(h.note)}</span>
            </li>`).join('')}
        </ul>`;
}

function compareBlock() {
  const axes = comparePhuketAxes();
  return `
        <div class="pkt__compare" id="pkt-compare">
          <div class="krabi-compare__axis-tabs" id="pkt-axis-tabs" role="tablist" aria-label="切換比較軸">
            ${axes.map((a, i) => `
              <button type="button" role="tab" class="krabi-compare__axis-tab${i === 0 ? ' is-active' : ''}"
                      id="pkt-axis-${esc(a.key)}" data-pkt-axis="${esc(a.key)}"
                      aria-selected="${i === 0}" aria-controls="pkt-compare-body"
                      title="${esc(a.hint)}">${esc(a.label)}</button>`).join('')}
          </div>
          <div class="krabi-compare__body" id="pkt-compare-body" role="tabpanel" aria-labelledby="pkt-axis-visibility"></div>
        </div>`;
}

function renderCompareBody(axisKey) {
  const body = document.getElementById('pkt-compare-body');
  if (!body) return;
  const axis = comparePhuketAxes().find((a) => a.key === axisKey) || comparePhuketAxes()[0];
  body.innerHTML = `
        <p class="pkt__axis-hint">${esc(axis.hint)}</p>
        <div class="krabi-compare__scroll">
          <table class="krabi-table pkt__table">
            <caption class="visually-hidden">五個普吉方案依「${esc(axis.label)}」比較</caption>
            <thead>
              <tr>
                <th scope="col">方案</th>
                <th scope="col">${esc(axis.label)}</th>
                <th scope="col">綜合評分</th>
              </tr>
            </thead>
            <tbody>
              ${axis.values.map((v) => {
    const plan = PHUKET_PLANS.find((p) => p.tag === v.tag);
    const isBest = v.tag === axis.best;
    return `<tr${isBest ? ' class="is-best-row"' : ''}>
                  <th scope="row">${esc(plan.name)}</th>
                  <td class="${isBest ? 'is-best' : ''}">${esc(v.display)}${isBest ? ' <span class="krabi-compare__best-mark" aria-label="最佳">★</span>' : ''}</td>
                  <td>${phuketPlanScore(plan).total}<small>/100</small></td>
                </tr>`;
  }).join('')}
            </tbody>
          </table>
        </div>`;
  body.setAttribute('aria-labelledby', `pkt-axis-${axis.key}`);
}

function caveatBlock() {
  return `
        <aside class="pkt__caveat" aria-labelledby="pkt-caveat-h">
          <h3 class="pkt__caveat-h" id="pkt-caveat-h">
            出發前必須重新查證（研究於 ${esc(PHUKET_DATA_CAVEAT.researchDate)}）
          </h3>
          <ul class="pkt__caveat-list">
            ${PHUKET_DATA_CAVEAT.items.map((i) => `<li>${esc(i)}</li>`).join('')}
          </ul>
          <p class="pkt__caveat-note">所有價格皆為 2026 年參考值，不含機票。</p>
        </aside>`;
}

/**
 * 建立 Phuket 區塊
 * @returns {{refreshTravelers:function, wire:function, destroy:function}}
 */
export function createPhuketSection({ travelers = 2 } = {}) {
  const section = document.getElementById('phuket');
  if (!section) return { refreshTravelers() {}, wire() {}, destroy() {} };

  let state = { travelers };
  const best = recommendPhuketPlan();
  const axes = PHUKET_AXES;

  const render = () => {
    const reefs = offshoreReefsByVisibility();
    section.innerHTML = `
      <div class="section-container">
        <div class="section-header">
          <p class="section-eyebrow">改由桃園出發</p>
          <h2 class="section-title" id="phuket-heading">普吉與離岸島嶼</h2>
          <p class="section-lead">
            換桃園出發後，普吉的交通前提徹底改變：<strong>TPE→HKT 直飛 4 小時 25 分</strong>，
            而 TPE→KBV 沒有直飛、必須經曼谷 13–16 小時。差距約
            <strong>${departureSavingsHours()} 小時</strong>——足以改變整個行程的移動預算。
            這是以高雄為前提時看不到的面向。
          </p>
        </div>

        <aside class="pkt__verdict" aria-labelledby="pkt-verdict-h">
          <h3 class="pkt__verdict-h" id="pkt-verdict-h">${esc(DEPARTURE_VERDICT.headline)}</h3>
          <p class="pkt__verdict-detail">${esc(DEPARTURE_VERDICT.detail)}</p>
          <p class="pkt__verdict-caveat"><strong>但：</strong>${esc(DEPARTURE_VERDICT.caveat)}</p>
        </aside>

        <div class="pkt__block">
          <h3 class="pkt__block-h">出發前提：桃園 vs 高雄</h3>
          ${departureTable()}
        </div>

        <div class="pkt__block">
          <h3 class="pkt__block-h">離岸珊瑚礁（15–75 分鐘快艇）</h3>
          <p class="pkt__block-lead">
            普吉的強項是<strong>選擇多且船程短</strong>，幾乎不受季風影響。
            Racha 群島能見度 20–30m 是全區最高之一，
            <strong>Koh Yao Noi 免公園費</strong>且幾乎無商業開發。
          </p>
          ${offshoreTable()}
          <p class="pkt__block-foot">共 ${reefs.length} 個離岸點位，涵蓋能見度由 20–30m 至中等的不同需求。</p>
        </div>

        <div class="pkt__block">
          <h3 class="pkt__block-h">國家公園（含 Similan 的誤區）</h3>
          <p class="pkt__block-lead">
            <strong>Similan 從普吉出發是常見誤區。</strong>
            除非你住的飯店明確主打「普吉出發快艇」，
            否則業者會用車把你載回 Thap Lamu 碼頭——等於多花 2 小時車程換同一趟船。
            Similan 本質上是 Khao Lak 行程，而 Khao Lak 離甲米機場只要 1.5 小時。
          </p>
          ${parkList()}
        </div>

        <div class="pkt__block">
          <h3 class="pkt__block-h">自由潛水：普吉反而更強</h3>
          <p class="pkt__block-lead">${esc(PHUKET_FREEDIVING.summary)}</p>
          ${freedivingBlock()}
        </div>

        <div class="pkt__block">
          <h3 class="pkt__block-h">包船與費用（2026 前季參考）</h3>
          ${boatsBlock()}
        </div>

        <div class="pkt__block pkt__list-block">
          <h3 class="pkt__block-h">五種方案</h3>
          <div class="pkt__list" id="pkt-list" aria-label="五個普吉方案">
            ${PHUKET_PLANS.map((p) => planCard(p, state.travelers)).join('')}
          </div>
        </div>

        <div class="pkt__block">
          <h3 class="pkt__block-h">五案比較（${axes.length} 軸）</h3>
          ${compareBlock()}
        </div>

        <div class="pkt__block">
          <h3 class="pkt__block-h">普吉 vs 甲米：誠實的權衡</h3>
          ${headToHead()}
          <p class="pkt__block-foot">
            這不是競爭關係，是互補。若主要目標是學自由潛水拿 AIDA 2，普吉勝；
            若想要更偏遠的秘境與較低的食宿成本，甲米勝。
          </p>
        </div>

        ${caveatBlock()}

        <p class="pkt__footnote">
          五案最高分是 <strong>${esc(best.tag)} ${esc(best.name)}</strong>
          （${phuketPlanScore(best).total}/100）。但每個方案在不同軸奪冠——
          沒有單一壓倒性勝者，這是刻意的：
          <strong>P3 自由潛水、P2 秘境與費用、P1 移動負擔、P4 能見度、P5 涵蓋廣度</strong>，
          沒有哪一項能同時贏下所有面向。
        </p>
      </div>`;
  };

  const wire = () => {
    const tabs = document.getElementById('pkt-axis-tabs');
    if (tabs) {
      tabs.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-pkt-axis]');
        if (!btn) return;
        for (const t of tabs.querySelectorAll('[data-pkt-axis]')) {
          const on = t === btn;
          t.classList.toggle('is-active', on);
          t.setAttribute('aria-selected', String(on));
        }
        renderCompareBody(btn.dataset.pktAxis);
      });
      tabs.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const list = [...tabs.querySelectorAll('[data-pkt-axis]')];
        const i = list.indexOf(document.activeElement);
        if (i < 0) return;
        e.preventDefault();
        const next = list[(i + (e.key === 'ArrowRight' ? 1 : list.length - 1)) % list.length];
        next.focus();
        next.click();
      });
    }
    renderCompareBody('visibility');
  };

  render();
  wire();

  return {
    refreshTravelers(next) {
      state.travelers = next;
      const list = document.getElementById('pkt-list');
      if (list) list.innerHTML = PHUKET_PLANS.map((p) => planCard(p, next)).join('');
    },
    wire,
    destroy() {
      section.innerHTML = '';
    },
  };
}
