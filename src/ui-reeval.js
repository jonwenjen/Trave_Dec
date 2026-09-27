/**
 * Trave_Dec — 2027/03/29 – 04/05 重評 UI
 *
 * 十一個方案，熱門與冷門並列，含一個全程極致跳島。
 * 每張卡可展開逐日行程、逐日費用、優缺點。
 */

import { SPLIT_GROUP, splitGroupByTotal, earlyReturnSaving } from './helpers-split-group.js';
import {
  PLANS,
  DESTINATIONS,
  FLIGHT_OPTIONS,
  TRIP_WINDOW,
  PRICING_2026,
  THB_TO_TWD_ASSUMED,
} from './data/reeval.js';
import {
  planSeaDays,
  planIslandCount,
  planTotalTHBPerPerson,
  planTotalTWDPerPerson,
  planBreakdown,
  plansByPrice,
  cheapestPlan,
  mostExpensivePlan,
  extremePlan,
  regionSummary,
  crowdRating,
  visibilityRating,
  crowdMix,
  planDays,
} from './helpers-reeval.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

const thb = (n) => `฿${Math.round(n).toLocaleString('en-US')}`;
const twd = (n) => `TWD ${Math.round(n).toLocaleString('en-US')}`;

const CROWD_CLS = { high: 'is-high', medium: 'is-medium', low: 'is-low' };
const VIS_CLS = { excellent: 'is-excellent', good: 'is-good', fair: 'is-fair', variable: 'is-var' };

function spotChip(id) {
  const s = DESTINATIONS[id];
  if (!s) return '';
  return `
    <li class="rv__spot">
      <span class="rv__spot-name">${esc(s.name)}<span class="rv__spot-cn">${esc(s.cn)}</span></span>
      <span class="rv__tags">
        <span class="rv__tag rv__tag--crowd ${CROWD_CLS[s.crowd]}">${esc(crowdRating(s.crowd))}</span>
        <span class="rv__tag rv__tag--vis ${VIS_CLS[s.visibility]}">${esc(visibilityRating(s.visibility))}</span>
        ${s.parkFeeTHB === 0 ? '<span class="rv__tag rv__tag--free">免公園費</span>' : ''}
      </span>
    </li>`;
}

function dayRow(day, i) {
  const spots = (day.spots || []).map(spotChip).join('');
  return `
    <li class="rv__day${day.sea ? ' is-sea' : ''}">
      <div class="rv__day-head">
        <span class="rv__day-num">D${i + 1}</span>
        <span class="rv__day-title">${esc(day.title)}</span>
        ${day.sea ? '<span class="rv__day-flag">出海</span>' : '<span class="rv__day-flag is-land">陸上</span>'}
      </div>
      <p class="rv__day-detail">${esc(day.detail)}</p>
      ${spots ? `<ul class="rv__spots">${spots}</ul>` : ''}
    </li>`;
}

function breakdownTable(plan, travelers) {
  const b = planBreakdown(plan, travelers);
  const row = (label, v, note = '') => `
    <tr>
      <th scope="row">${label}${note ? `<small>${note}</small>` : ''}</th>
      <td>${thb(v.min)} – ${thb(v.max)}</td>
    </tr>`;
  return `
    <table class="rv__price-table">
      <caption class="visually-hidden">${esc(plan.name)}的每人費用分項</caption>
      <tbody>
        ${row('機票', b.flight, '來回')}
        ${row('托運行李 20kg', b.baggage, '來回')}
        ${b.course.max > 0 ? row('自由潛水課程', b.course, 'AIDA 2') : ''}
        ${row('船資', b.boats, '整團分攤')}
        ${row('住宿', b.lodging, `${Math.ceil(travelers / 2)} 間分攤`)}
        ${row('國家公園費', b.parkFee, '整團分攤')}
        ${row('餐費', b.food, '7 天')}
        <tr class="rv__price-total">
          <th scope="row">每人合計<small>${travelers} 人同行</small></th>
          <td>${thb(b.totalTHB.min)} – ${thb(b.totalTHB.max)}<br>
              <span class="rv__twd">${twd(b.totalTWD.min)} – ${twd(b.totalTWD.max)}</span></td>
        </tr>
      </tbody>
    </table>`;
}

function planCard(plan, travelers) {
  const total = planTotalTHBPerPerson(plan, travelers);
  const mix = crowdMix(plan);
  const isExtreme = !!plan.isExtreme;
  return `
    <article class="rv__card${isExtreme ? ' is-extreme' : ''}" data-plan-id="${esc(plan.id)}">
      <header class="rv__card-head">
        <div class="rv__card-id">
          <span class="rv__card-tag${isExtreme ? ' is-extreme' : ''}">${esc(plan.tag)}</span>
          ${isExtreme ? '<span class="rv__card-badge">全程極致跳島</span>' : ''}
        </div>
        <h3 class="rv__card-name">${esc(plan.name)}</h3>
        <p class="rv__card-cn">${esc(plan.cn)}</p>
        <p class="rv__card-summary">${esc(plan.summary)}</p>
        <ul class="rv__card-stats">
          <li><strong>${planDays(plan)}</strong> 完整白天</li>
          <li><strong>${planSeaDays(plan)}</strong> 天出海</li>
          <li><strong>${planIslandCount(plan)}</strong> 座點位</li>
          <li><strong>${plan.bases}</strong> 個基地</li>
        </ul>
        <p class="rv__card-price">
          <span class="rv__card-price-label">每人</span>
          <strong>${thb(total.min)} – ${thb(total.max)}</strong>
          <span class="rv__twd">${twd(total.min * THB_TO_TWD_ASSUMED)} – ${twd(total.max * THB_TO_TWD_ASSUMED)}</span>
        </p>
        <button type="button" class="rv__toggle" aria-expanded="false" aria-controls="rv-body-${esc(plan.id)}">
          展開逐日行程與費用
        </button>
      </header>

      <div class="rv__card-body" id="rv-body-${esc(plan.id)}" hidden>
        <div class="rv__body-cols">
          <div class="rv__body-main">
            <h4 class="rv__sub-h">逐日行程</h4>
            <ol class="rv__days">${plan.days.map(dayRow).join('')}</ol>
          </div>
          <div class="rv__body-side">
            <h4 class="rv__sub-h">優點</h4>
            <ul class="rv__pros">${plan.pros.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
            <h4 class="rv__sub-h">缺點</h4>
            <ul class="rv__cons">${plan.cons.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
            <h4 class="rv__sub-h">人氣組成</h4>
            <p class="rv__mix">
              <span class="rv__tag rv__tag--crowd is-high">高 ${mix.high}</span>
              <span class="rv__tag rv__tag--crowd is-medium">中 ${mix.medium}</span>
              <span class="rv__tag rv__tag--crowd is-low">低 ${mix.low}</span>
            </p>
            <h4 class="rv__sub-h">每人費用（${travelers} 人）</h4>
            ${breakdownTable(plan, travelers)}
          </div>
        </div>
      </div>
    </article>`;
}

function compareTable(travelers) {
  const rows = plansByPrice(travelers);
  return `
    <div class="rv__compare-scroll">
      <table class="rv__compare">
        <caption class="visually-hidden">十一個方案的比較表</caption>
        <thead>
          <tr>
            <th scope="col">方案</th>
            <th scope="col">基地</th>
            <th scope="col">出海天</th>
            <th scope="col">點位</th>
            <th scope="col">人氣偏好</th>
            <th scope="col">最高能見度</th>
            <th scope="col">船資／人</th>
            <th scope="col">公園費／人</th>
            <th scope="col">每人總額</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((p) => {
    const b = planBreakdown(p, travelers);
    const mix = crowdMix(p);
    const best = mix.spots.some((s) => s.visibility === 'excellent')
      ? 'excellent' : mix.spots.some((s) => s.visibility === 'good') ? 'good' : 'fair';
    return `
            <tr data-price-id="${esc(p.id)}"${p.isExtreme ? ' class="is-extreme"' : ''}>
              <th scope="row">
                <span class="rv__card-tag${p.isExtreme ? ' is-extreme' : ''}">${esc(p.tag)}</span>
                ${esc(p.name)}
                ${p.isExtreme ? '<span class="rv__card-badge">極致</span>' : ''}
              </th>
              <td>${p.bases}</td>
              <td>${planSeaDays(p)}</td>
              <td>${planIslandCount(p)}</td>
              <td>${esc(crowdRating(p.crowdPreference))}</td>
              <td><span class="rv__tag rv__tag--vis ${VIS_CLS[best]}">${esc(visibilityRating(best))}</span></td>
              <td>${thb(b.boats.min)} – ${thb(b.boats.max)}</td>
              <td>${b.parkFee.max === 0 ? '<span class="is-free">免</span>' : thb(b.parkFee.max)}</td>
              <td class="rv__compare-total">${thb(b.totalTHB.min)} – ${thb(b.totalTHB.max)}</td>
            </tr>`;
  }).join('')}
        </tbody>
      </table>
    </div>`;
}

function regionPanel(travelers) {
  return `
    <div class="rv__regions">
      ${regionSummary(travelers).map((r) => `
        <div class="rv__region">
          <h4>${esc(r.region)}<span>${r.count} 案</span></h4>
          <p>平均每人 <strong>${thb(r.avgMin)} – ${thb(r.avgMax)}</strong></p>
          <p class="rv__region-plans">${r.plans.map((p) => esc(p.name)).join('、')}</p>
        </div>`).join('')}
    </div>`;
}

function flightPanel() {
  return `
    <aside class="rv__flight" aria-labelledby="rv-flight-h">
      <h3 class="rv__flight-h" id="rv-flight-h">交通：雙向夜航 → 7 個完整白天</h3>
      <p class="rv__flight-lead">
        出發 <strong>${esc(TRIP_WINDOW.depart)}（${esc(TRIP_WINDOW.departWeekday)}）晚上</strong>，
        回程 <strong>${esc(TRIP_WINDOW.return)}（${esc(TRIP_WINDOW.returnWeekday)}）晚上</strong>，
        機場皆為 HKT。因為是夜航，實際在泰國有
        <strong>${TRIP_WINDOW.fullDays} 個完整白天（${esc(TRIP_WINDOW.firstFullDay)} – ${esc(TRIP_WINDOW.lastFullDay)}）</strong>——
        比「7 天出發、回程」的排程多出一整天，不是半天。
      </p>
      <dl class="rv__flight-list">
        <dt>去程</dt><dd>${esc(FLIGHT_OPTIONS.label)}（${esc(FLIGHT_OPTIONS.duration)}，${esc(FLIGHT_OPTIONS.stops)} 站，${esc(FLIGHT_OPTIONS.airline)}）</dd>
        <dt>回程</dt><dd>${esc(FLIGHT_OPTIONS.returnLabel)}（${esc(FLIGHT_OPTIONS.returnDuration)}）</dd>
        <dt>機票＋托運 20kg</dt><dd>${twd(FLIGHT_OPTIONS.roundTripTWD.min)} – ${twd(FLIGHT_OPTIONS.roundTripTWD.max)} ＋ ${twd(FLIGHT_OPTIONS.baggageTWD.min)} – ${twd(FLIGHT_OPTIONS.baggageTWD.max)}</dd>
        <dt>宋干節風險</dt><dd>無。宋干節為 4/13–15，不在本次行程內；4/6 Chakri Day 落在回程抵台日。</dd>
      </dl>
      <p class="rv__flight-note">${esc(FLIGHT_OPTIONS.note)}</p>
      <p class="rv__flight-warn"><strong>⚠️ 報價日期不等於出行日期。</strong>${esc(PRICING_2026.caveat)}</p>
    </aside>`;
}

function splitGroupPanel() {
  const rows = splitGroupByTotal();
  const mid = (r) => (r.min + r.max) / 2;
  const th = (r) => `${thb(r.min)} – ${thb(r.max)}`;
  const tw = (r) => `${twd(r.min)} – ${twd(r.max)}`;

  const rowsHtml = rows.map(({ plan, breakdown: b }) => {
    const save = earlyReturnSaving(plan);
    const m = mid(save);
    const saveTxt = m < 0
      ? `<span class="sg-save sg-save--neg">多花 ${thb(Math.abs(m))}</span>`
      : `<span class="sg-save">省 ${thb(m)}</span>`;
    return `<tr${plan.isExtreme ? ' class="is-extreme"' : ''}>
        <th scope="row"><span class="sg-tag">${plan.tag}</span><span>${esc(plan.name)}</span></th>
        <td>${th(b.main.total)}</td>
        <td>${th(b.early.total)}</td>
        <td class="sg-total">${th(b.groupTotal)}</td>
        <td class="sg-twd">${tw(b.groupTotalTWD)}</td>
        <td>${saveTxt}</td>
      </tr>`;
  }).join('');

  const s0 = rows[0].breakdown;
  const detail = [
    ['出發 3/29 晚（來回票，已含托運）', th(s0.main.flight)],
    ['回程 4/5 晚・4 人（單程）', th(SPLIT_GROUP.mainOptions[0].oneWayTWD)],
    ['回程 4/4 晚・2 人提前（單程）', th(SPLIT_GROUP.earlyOptions[0].oneWayTWD)],
    ['整團船資 6 人分攤', th(s0.main.boats)],
    ['公園費 6 人分攤', th(s0.main.parkFee)],
    ['住宿整團（16 房晚）', th(s0.lodgingTotal)],
    ['餐費・主團 7 天', th(s0.main.food)],
    ['餐費・早退 5 天', th(s0.early.food)],
  ].map(([k, v]) => `<div class="sg-row"><span class="sg-row-k">${k}</span><span class="sg-row-v">${v}</span></div>`).join('');

  const optCard = (o, rec) => `<div class="sg-opt">
      ${rec ? '<span class="sg-opt-label sg-opt-label--rec">推薦</span>' : '<span class="sg-opt-label">代價大</span>'}
      <p class="sg-opt-f">${esc(o.label)}</p>
      <p class="sg-opt-d">${esc(o.duration)}・${th(o.oneWayTWD)}</p>
      <p class="sg-opt-n">${esc(o.note)}</p>
    </div>`;

  return `
    <div class="price__block" id="split-group">
      <h3 class="price__block-h">6 人團體・2 人提前 2 天回（團體估價）</h3>
      <p class="section-lead">
        6 人同行但只有 4 人待到最後：2 人於 <strong>4/4（週日）</strong>先回，
        4 人 <strong>4/5（週一）</strong>回。這個組合會改變機票、住宿與船資的分攤方式。
      </p>

      <div class="sg-warn">
        <h4 class="sg-warn-h">⚠️ 4/4 是週日，沒有直飛</h4>
        <p class="sg-warn-p">
          虎航 TPE↔HKT 直飛僅每週<strong>二</strong>與每週<strong>六</strong>各一班。
          4/4 落在週日，<strong>提前回的人只能轉機</strong>——這是班表限制，不是可以選擇的方案。
        </p>
        <div class="sg-opts">
          ${optCard(SPLIT_GROUP.earlyOptions[0], true)}
          ${optCard(SPLIT_GROUP.earlyOptions[1], false)}
        </div>
        <p class="sg-warn-impact"><strong>對行程的影響：</strong>${esc(SPLIT_GROUP.impact)}</p>
      </div>

      <div class="sg-key">
        <h4 class="sg-key-h">三個容易算錯的地方</h4>
        <ul class="sg-key-list">
          <li><strong>機票</strong> — 早退者回程日期不同，票也不同。而且 4/4 只能買轉機單程（約 ${thb(SPLIT_GROUP.earlyOptions[0].oneWayTWD.min)}），反而比主團體 4/5 的轉機單程（約 ${thb(SPLIT_GROUP.mainOptions[0].oneWayTWD.min)}）貴一倍以上。</li>
          <li><strong>船資不變</strong> — 船照開，早退者的份額不會減少，仍是整團船資 ÷ 6。</li>
          <li><strong>住宿真的少</strong> — 前 4 晚 6 人住 3 間，後 2 晚 4 人住 2 間，共 16 房晚（6 人全程則是 18 房晚），省下 2 房晚。</li>
        </ul>
      </div>

      <div class="price__table-scroll">
        <table class="sg-compare">
          <caption class="sg-caption">11 個方案的 6 人分批團體總額（THB，含機票與托運 20kg）</caption>
          <thead><tr>
            <th scope="col">方案</th>
            <th scope="col">主團 4 人<small>每人 THB・4/5 回</small></th>
            <th scope="col">早退 2 人<small>每人 THB・4/4 回</small></th>
            <th scope="col">團體總額<small>THB</small></th>
            <th scope="col">團體總額<small>TWD</small></th>
            <th scope="col">提前回<small>相對 6 人同行</small></th>
          </tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>

      <div class="sg-detail">
        <h4 class="sg-detail-h">以「${esc(rows[0].plan.name)}」為例的分項拆解</h4>
        <div class="sg-detail-grid">${detail}</div>
        <p class="sg-detail-note">
          價格為 2026-09-27 查得的當期價，非 2027-03 的實際價格。
        </p>
      </div>
    </div>`;
}

export function createReevalSection({ travelers = 2 } = {}) {
  const section = document.getElementById('reeval');
  if (!section) return { refreshTravelers() {}, destroy() {} };

  let state = { travelers };

  const render = () => {
    const c = cheapestPlan(state.travelers);
    const e = mostExpensivePlan(state.travelers);
    const x = extremePlan();

    section.innerHTML = `
      <div class="section-container">
        <div class="section-header">
          <p class="section-eyebrow">2027/03/29 – 04/05</p>
          <h2 class="section-title" id="reeval-heading">十一個方案：普吉周邊熱門與冷門重評</h2>
          <p class="section-lead">
            雙向夜航、機場 HKT，實際有 <strong>7 個完整白天</strong>。
            十一個方案涵蓋熱門路線（Phi Phi、Racha、Similan）與冷門秘境
            （Koh Yao Noi、Koh Haa、Koh Tachai、Koh Maphrao），
            並含一個<strong>全程極致跳島</strong>方案。
            價格含機票、托運行李 20kg、船資、住宿、公園費與餐費。
          </p>
        </div>

        ${flightPanel()}

        <div class="rv__callout">
          <p>
            最便宜：<strong>${esc(c.plan.name)}</strong>（${thb(c.totalTHB.min)} – ${thb(c.totalTHB.max)}／人）；
            最貴：<strong>${esc(x.name)}</strong>（${thb(planTotalTHBPerPerson(x, state.travelers).min)} – ${thb(planTotalTHBPerPerson(x, state.travelers).max)}／人）。
            落差 ${thb(planTotalTHBPerPerson(x, state.travelers).min - c.totalTHB.min)} – ${thb(planTotalTHBPerPerson(x, state.travelers).max - c.totalTHB.min)}／人，
            主要來自包船與住宿等級。
          </p>
        </div>

        <div class="rv__cards">
          ${plansByPrice(state.travelers).map((p) => planCard(p, state.travelers)).join('')}
        </div>

        ${splitGroupPanel()}

        <div class="price__block">
          <h3 class="price__block-h">十一案比較（${state.travelers} 人）</h3>
          ${compareTable(state.travelers)}
          ${regionPanel(state.travelers)}
        </div>

        <p class="price__footnote">
          **這張表回答的是「哪個方案比較便宜」，不是「哪個方案比較好」。**
          最便宜的方案（${esc(c.plan.name)}）與最貴的（${esc(x.name)}）相差不到一倍，
          但極致跳島多了 ${planIslandCount(x)} 座點位與 2 晚國家公園過夜——
          這是錢買不到的差異，也是最貴的理由。
        </p>
      </div>`;

    // 展開互動
    section.querySelectorAll('.rv__toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        const body = section.querySelector(`#${btn.getAttribute('aria-controls')}`);
        const open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        body.hidden = open;
        btn.textContent = open ? '展開逐日行程與費用' : '收合';
      });
    });
  };

  render();

  return {
    refreshTravelers(next) {
      state.travelers = next;
      render();
    },
    destroy() {
      section.innerHTML = '';
    },
  };
}
