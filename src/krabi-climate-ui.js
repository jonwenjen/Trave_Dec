/**
 * Trave_Dec — ENSO 評估、日期窗口比較、4 月方案（UI 層）
 *
 * 與既有的甲米區塊（src/krabi-ui.js）共用「出行人數」，因為費用試算要連動。
 * 所有內容來自 src/data/krabi-climate.js 與 src/data/krabi-april.js，不在 UI 層發明數字。
 */

import {
  ENSO_CURRENT,
  ENSO_PHASE,
  TMD_WARNINGS,
  ENSO_IMPACT_ANALYSIS,
  DATE_WINDOWS,
  WINDOW_AXES,
  HEAT_PREPARATIONS,
  ENSO_FRESHNESS_NOTE,
} from './data/krabi-climate.js';
import {
  KRABI_PLANS_APRIL,
  APRIL_KEY_FACTS,
  APRIL_PARK_FEES,
  APRIL_COMPARE_AXES,
  APRIL_CONTINGENCY,
} from './data/krabi-april.js';
import {
  planCostTwd,
  estimateGroupTotalTwd,
  computeCompareMatrix,
  planRiskTone,
  planRiskLabel,
  planSeaDayCount,
  planSnorkelStopCount,
  planBaseMoves,
  percentOfMax,
  windowScore,
  compareWindows,
  recommendedWindow,
  heatRiskLevel,
  verifySimilanWindow,
  aprilPlanSecretScore,
  totalParkFeeByPlan,
  THB_TO_TWD_ASSUMED,
  KRABI_FLIGHT_ESTIMATE,
} from './krabi-helpers.js';

const DIRECTION_META = {
  favourable: { label: '可能有利', icon: '↓', tone: 'good' },
  adverse: { label: '確定惡化', icon: '↑', tone: 'danger' },
  unclear: { label: '變數最大', icon: '?', tone: 'warn' },
};

const APRIL_AXIS_EXTRA = {
  secretIslands: (plan) => aprilPlanSecretScore(plan),
  similan: (plan) => (JSON.stringify(plan).includes('Similan') ? '有' : '無'),
};

export function createKrabiClimateSection({ getEl, esc, toast, getTravelers }) {
  const el = (id) => getEl(id);

  let openPlans = new Set();
  let activeWindowAxis = WINDOW_AXES[0].key;
  let activeAprilAxis = APRIL_COMPARE_AXES[0].key;

  /* ═══ ENSO 區塊 ═══ */

  function renderEnsoStatus() {
    const host = el('enso-status');
    if (!host) return;
    const phase = ENSO_PHASE[ENSO_CURRENT.phase] || ENSO_PHASE.neutral;
    host.innerHTML = `
      <div class="enso-status__badge enso-status__badge--${phase.tone}">
        <span class="enso-status__phase">${esc(phase.label)}</span>
        <span class="enso-status__issued">${esc(ENSO_CURRENT.issuedBy)}・${esc(ENSO_CURRENT.issuedDate)}</span>
      </div>
      <div class="enso-status__body">
        <p class="enso-status__summary">${esc(ENSO_CURRENT.summary)}</p>
        <div class="enso-status__metrics">
          <div class="enso-metric">
            <span class="enso-metric__label">Niño-3.4 距平</span>
            <span class="enso-metric__value">+${ENSO_CURRENT.nino34AnomalyC}°C</span>
          </div>
          <div class="enso-metric">
            <span class="enso-metric__label">東赤道太平洋距平</span>
            <span class="enso-metric__value">+${ENSO_CURRENT.eastPacificAnomalyC}°C</span>
          </div>
          <div class="enso-metric">
            <span class="enso-metric__label">4 月高溫風險</span>
            <span class="enso-metric__value">${esc(heatLabel(heatRiskLevel('2027-04-20')))}</span>
          </div>
          <div class="enso-metric">
            <span class="enso-metric__label">Similan（4/20）</span>
            <span class="enso-metric__value">${esc(verifySimilanWindow('2027-04-20').inSeason ? '季內' : '季外')}</span>
          </div>
        </div>
        <a class="enso-status__source" href="${esc(ENSO_CURRENT.source)}" target="_blank" rel="noopener noreferrer">
          NOAA CPC ENSO 診斷原文 ↗
        </a>
      </div>`;
  }

  function heatLabel(level) {
    return { low: '低', moderate: '中', high: '高', unknown: '未知' }[level] || '未知';
  }

  function renderEnsoTimeline() {
    const host = el('enso-timeline');
    if (!host) return;
    host.innerHTML = ENSO_CURRENT.timeline
      .map(
        (t) => `
      <li class="enso-timeline__item">
        <span class="enso-timeline__period">${esc(t.period)}</span>
        <span class="enso-timeline__label">${esc(t.label)}</span>
        <span class="enso-timeline__note">${esc(t.note || '')}</span>
      </li>`,
      )
      .join('');
  }

  function renderTmdWarnings() {
    const host = el('tmd-warnings');
    if (!host) return;
    host.innerHTML =
      TMD_WARNINGS.items
        .map(
          (item) => `
      <article class="tmd-card tmd-card--${esc(item.tone)}">
        <span class="tmd-card__label">${esc(item.label)}</span>
        <p class="tmd-card__value">${esc(item.value)}</p>
        <p class="tmd-card__detail">${esc(item.detail)}</p>
      </article>`,
        )
        .join('') +
      `<p class="krabi-block__note">來源：${esc(TMD_WARNINGS.sourceLabel)}・${esc(TMD_WARNINGS.issuedNote)}。
        <a class="krabi-fee__link" href="${esc(TMD_WARNINGS.sourceUrl)}" target="_blank" rel="noopener noreferrer">報導原文 ↗</a></p>`;
  }

  function renderEnsoImpacts() {
    const headline = el('enso-headline');
    if (headline) headline.textContent = ENSO_IMPACT_ANALYSIS.headline;

    const host = el('enso-impacts');
    if (!host) return;
    host.innerHTML = ENSO_IMPACT_ANALYSIS.effects
      .map((e) => {
        const meta = DIRECTION_META[e.direction] || DIRECTION_META.unclear;
        return `
      <article class="enso-impact enso-impact--${esc(meta.tone)}">
        <div class="enso-impact__head">
          <span class="enso-impact__icon" aria-hidden="true">${esc(meta.icon)}</span>
          <div>
            <span class="enso-impact__aspect">${esc(e.aspect)}</span>
            <span class="enso-impact__verdict">${esc(e.verdict)}</span>
          </div>
          <span class="enso-impact__direction">${esc(meta.label)}</span>
        </div>
        <p class="enso-impact__detail">${esc(e.detail)}</p>
      </article>`;
      })
      .join('');
  }

  function renderHeatPreps() {
    const host = el('heat-preps');
    if (!host) return;
    host.innerHTML = HEAT_PREPARATIONS.map(
      (p) => `
      <article class="heat-card">
        <h4 class="heat-card__title">${esc(p.title)}</h4>
        <p class="heat-card__detail">${esc(p.detail)}</p>
      </article>`,
    ).join('');
  }

  function renderEnsoCaveats() {
    const host = el('enso-caveats');
    if (!host) return;
    const items = [...ENSO_IMPACT_ANALYSIS.caveats, ENSO_FRESHNESS_NOTE];
    host.innerHTML = items.map((c) => `<li>${esc(c)}</li>`).join('');
  }

  /* ═══ 日期窗口比較 ═══ */

  function renderWindowCards() {
    const host = el('window-cards');
    if (!host) return;
    const reco = recommendedWindow();

    host.innerHTML = DATE_WINDOWS.map((w) => {
      const score = windowScore(w);
      return `
      <article class="window-card${w.recommended ? ' window-card--reco' : ''}">
        ${w.recommended ? '<span class="window-card__flag">建議窗口</span>' : ''}
        <div class="window-card__head">
          <h3 class="window-card__label">${esc(w.label)}</h3>
          <span class="window-card__score">${score.total}<small>/100</small></span>
        </div>
        <p class="window-card__tagline">${esc(w.tagline)}</p>
        <ul class="window-card__notes">
          ${w.notes.map((n) => `<li>${esc(n)}</li>`).join('')}
        </ul>
        <p class="window-card__source">${esc(w.sourceNote || '')}</p>
      </article>`;
    }).join('');

    // 若只有一個推薦，明說推薦的是哪一個
    if (host) {
      host.insertAdjacentHTML(
        'beforeend',
        `<p class="window-cards__summary">綜合評分最高的是 <strong>${esc(reco.fullLabel)}</strong>
         （${reco.total}/100）。但請注意：每個窗口都有代價，這是取捨而非排名。</p>`,
      );
    }
  }

  function renderWindowAxisTabs() {
    const host = el('window-axis-tabs');
    if (!host) return;
    host.innerHTML = WINDOW_AXES.map(
      (axis) => `
      <button type="button" class="krabi-axis-tab" role="tab" data-window-axis="${esc(axis.key)}"
              aria-selected="${axis.key === activeWindowAxis}">${esc(axis.label)}</button>`,
    ).join('');
  }

  function renderWindowCompare() {
    const host = el('window-compare-body');
    if (!host) return;

    const matrix = compareWindows(DATE_WINDOWS, WINDOW_AXES);
    const row = matrix.find((r) => r.key === activeWindowAxis) || matrix[0];

    const head = `<tr>
      <th scope="col">比較軸</th>
      ${DATE_WINDOWS.map((w) => `<th scope="col">${esc(w.label)}</th>`).join('')}
    </tr>`;

    const body = matrix
      .map((r) => {
        const byId = new Map(r.values.map((v) => [v.id, v]));
        const cells = DATE_WINDOWS.map((w) => {
          const v = byId.get(w.id);
          const isBest = r.best === w.id;
          const active = r.key === activeWindowAxis ? ' krabi-table__val--active' : '';
          return `<td><span class="krabi-table__val${isBest ? ' krabi-table__val--best' : ''}${active}">${esc(v ? v.display : '—')}</span></td>`;
        }).join('');
        return `<tr>
          <th scope="row" class="krabi-table__axis">${esc(r.label)}${r.hint ? `<span class="krabi-table__hint">${esc(r.hint)}</span>` : ''}</th>
          ${cells}
        </tr>`;
      })
      .join('');

    const note = row
      ? `<p class="krabi-compare__focus">目前聚焦：<strong>${esc(row.label)}</strong>${row.hint ? `（${esc(row.hint)}）` : ''}</p>`
      : '';

    host.innerHTML =
      note +
      `<table class="krabi-table"><caption class="visually-hidden">三個日期窗口的並排比較</caption><thead>${head}</thead><tbody>${body}</tbody></table>`;
  }

  /* ═══ 4 月版方案 ═══ */

  function renderAprilFacts() {
    const host = el('april-key-facts');
    if (!host) return;
    host.innerHTML = APRIL_KEY_FACTS.map(
      (fact) => `
      <article class="krabi-fact${fact.severity === 'critical' ? ' krabi-fact--critical' : ''}">
        <span class="krabi-fact__label">${esc(fact.label)}</span>
        <p class="krabi-fact__value">${esc(fact.value)}</p>
        <p class="krabi-fact__detail">${esc(fact.detail)}</p>
      </article>`,
    ).join('');
  }

  function renderAprilEnsoNote() {
    const node = el('april-enso-note');
    if (!node) return;
    node.textContent =
      '2026/27 為超級 El Niño 年，4 月氣溫預估較常年高 1.5–2.5°C，熱指數可能極高。' +
      '海況方面受惠於季風偏弱、風浪較小，出船風險反而比 5 月低——但要把浮潛排在早晚、正午避暑。' +
      '以上為官方預估，非 2027 年 4 月的實測值，須於 2027 年 3 月重新查證。';
  }

  function renderAprilCalc() {
    const travelers = getTravelers();
    const note = el('april-calc-note');
    if (note) {
      note.textContent = `前季參考團費（不含機票）換算為新台幣，${travelers} 人分攤。若需含機票請切換上方 5 月版的試算開關。`;
    }

    const grid = el('april-cost-grid');
    if (!grid) return;
    grid.innerHTML = KRABI_PLANS_APRIL.map((plan) => {
      const group = estimateGroupTotalTwd(plan, travelers, { includeFlight: false });
      const per = group.perPerson;
      return `
      <div class="krabi-cost">
        <span class="krabi-cost__tag">${esc(plan.tag)}</span>
        <span class="krabi-cost__name">${esc(plan.name)}</span>
        <span class="krabi-cost__value">NT$${per.min.toLocaleString('en-US')}–${per.max.toLocaleString('en-US')}</span>
        <span class="krabi-cost__group">公園費 ฿${totalParkFeeByPlan(plan).toLocaleString('en-US')}・全團 ${group.travelers} 人 NT$${group.max.toLocaleString('en-US')}</span>
      </div>`;
    }).join('');
  }

  function renderAprilPlans() {
    const host = el('april-plan-list');
    if (!host) return;

    const maxStops = Math.max(...KRABI_PLANS_APRIL.map(planSnorkelStopCount));

    host.innerHTML = KRABI_PLANS_APRIL.map((plan) => {
      const tone = planRiskTone(plan.riskLevel);
      const isOpen = openPlans.has(plan.id);
      const secret = aprilPlanSecretScore(plan);

      const days = plan.days
        .map((day) => {
          const chips = [];
          if (day.seaDay && !day.isBuffer) chips.push('<span class="krabi-plan__chip krabi-plan__chip--sea">出海</span>');
          if (day.isBuffer) chips.push('<span class="krabi-plan__chip krabi-plan__chip--buffer">緩衝日</span>');
          if (day.transport && day.transport !== '—') chips.push(`<span class="krabi-plan__chip">${esc(day.transport)}</span>`);
          if (day.costTHB) chips.push(`<span class="krabi-plan__chip">฿${day.costTHB.toLocaleString('en-US')}</span>`);
          if (day.parkFeeTHB) chips.push(`<span class="krabi-plan__chip">公園費 ฿${day.parkFeeTHB}</span>`);
          if (day.costNote) chips.push(`<span class="krabi-plan__chip">${esc(day.costNote)}</span>`);
          return `
          <div class="krabi-plan__day">
            <div class="krabi-plan__day-head">
              <span class="krabi-plan__day-no">D${day.day}</span>
              <span class="krabi-plan__day-title">${esc(day.title)}</span>
            </div>
            <p class="krabi-plan__day-detail">${esc(day.detail)}</p>
            <div class="krabi-plan__day-meta">${chips.join('')}</div>
          </div>`;
        })
        .join('');

      const sources = plan.sources
        .map((s) => `<a class="krabi-plan__source" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a>`)
        .join('');

      return `
      <article class="krabi-plan" data-april-plan-id="${esc(plan.id)}">
        <div class="krabi-plan__head">
          <div class="krabi-plan__badges">
            <span class="krabi-plan__tag">${esc(plan.tag)}</span>
            <span class="krabi-plan__risk krabi-plan__risk--${tone}">4 月風險 ${esc(planRiskLabel(plan.riskLevel))}</span>
            ${secret >= 4 ? '<span class="krabi-plan__snorkel">秘境重點</span>' : ''}
            ${JSON.stringify(plan).includes('Similan') ? '<span class="krabi-plan__snorkel krabi-plan__snorkel--similan">含 Similan</span>' : ''}
          </div>
          <h3 class="krabi-plan__name">${esc(plan.name)}</h3>
          <p class="krabi-plan__positioning">${esc(plan.positioning)}</p>
        </div>

        <div class="krabi-plan__stats">
          <div class="krabi-plan__stat">
            <span class="krabi-plan__stat-label">浮潛點</span>
            <span class="krabi-plan__stat-value">${planSnorkelStopCount(plan)} 點（${percentOfMax(planSnorkelStopCount(plan), maxStops)}%）</span>
          </div>
          <div class="krabi-plan__stat">
            <span class="krabi-plan__stat-label">海上天數</span>
            <span class="krabi-plan__stat-value">${planSeaDayCount(plan)} 天</span>
          </div>
          <div class="krabi-plan__stat">
            <span class="krabi-plan__stat-label">秘境可達性</span>
            <span class="krabi-plan__stat-value">${secret} / 5</span>
          </div>
          <div class="krabi-plan__stat">
            <span class="krabi-plan__stat-label">基地</span>
            <span class="krabi-plan__stat-value">${esc(plan.base)}</span>
          </div>
          <div class="krabi-plan__stat">
            <span class="krabi-plan__stat-label">搬運次數</span>
            <span class="krabi-plan__stat-value">${planBaseMoves(plan) ? `${planBaseMoves(plan)} 次` : '不需搬運'}</span>
          </div>
          <div class="krabi-plan__stat">
            <span class="krabi-plan__stat-label">前季團費／人</span>
            <span class="krabi-plan__stat-value">฿${plan.estimateTHB.min.toLocaleString('en-US')}–${plan.estimateTHB.max.toLocaleString('en-US')}</span>
          </div>
        </div>

        <p class="krabi-plan__highlight">${esc(plan.highlight)}</p>
        <p class="krabi-plan__suits">適合：${esc(plan.suits)}</p>

        <button type="button" class="krabi-plan__toggle" data-april-toggle="${esc(plan.id)}"
                aria-expanded="${isOpen}" aria-controls="april-days-${esc(plan.id)}">
          <span aria-hidden="true">${isOpen ? '▾' : '▸'}</span>
          ${isOpen ? '收合 7 日行程' : '展開 7 日行程'}
        </button>

        <div class="krabi-plan__days${isOpen ? ' is-open' : ''}" id="april-days-${esc(plan.id)}"${isOpen ? '' : ' hidden'}>
          ${days}
        </div>

        <div class="krabi-plan__foot">${sources}</div>
      </article>`;
    }).join('');
  }

  function renderAprilAxisTabs() {
    const host = el('april-axis-tabs');
    if (!host) return;
    host.innerHTML = APRIL_COMPARE_AXES.map(
      (axis) => `
      <button type="button" class="krabi-axis-tab" role="tab" data-april-axis="${esc(axis.key)}"
              aria-selected="${axis.key === activeAprilAxis}">${esc(axis.label)}</button>`,
    ).join('');
  }

  function renderAprilCompare() {
    const host = el('april-compare-body');
    if (!host) return;

    // 秘境可達性是 4 月專屬軸，需由 helper 計算後併入矩陣
    const axes = APRIL_COMPARE_AXES;
    const matrix = computeCompareMatrix(KRABI_PLANS_APRIL, axes);

    const head = `<tr>
      <th scope="col">比較軸</th>
      ${KRABI_PLANS_APRIL.map((p) => `<th scope="col">${esc(p.tag)}・${esc(p.name)}</th>`).join('')}
    </tr>`;

    const rows = matrix
      .map((row) => {
        const byTag = new Map(row.values.map((v) => [v.tag, v]));
        const cells = KRABI_PLANS_APRIL.map((p) => {
          const v = byTag.get(p.tag);
          const isBest = row.best === p.tag;
          return `<td><span class="krabi-table__val${isBest ? ' krabi-table__val--best' : ''}">${esc(v ? v.display : '—')}</span></td>`;
        }).join('');
        return `<tr>
          <th scope="row" class="krabi-table__axis">${esc(row.label)}${row.hint ? `<span class="krabi-table__hint">${esc(row.hint)}</span>` : ''}</th>
          ${cells}
        </tr>`;
      })
      .join('');

    const secretRow = `
      <tr>
        <th scope="row" class="krabi-table__axis">秘境可達性<span class="krabi-table__hint">Trang 群島等秘境的可執行度</span></th>
        ${KRABI_PLANS_APRIL.map((p) => `<td><span class="krabi-table__val">${aprilPlanSecretScore(p)} / 5</span></td>`).join('')}
      </tr>`;
    const similanRow = `
      <tr>
        <th scope="row" class="krabi-table__axis">含 Similan<span class="krabi-table__hint">能見度最佳的選擇是否成立</span></th>
        ${KRABI_PLANS_APRIL.map((p) => `<td><span class="krabi-table__val">${esc(APRIL_AXIS_EXTRA.similan(p))}</span></td>`).join('')}
      </tr>`;

    host.innerHTML = `<table class="krabi-table"><caption class="visually-hidden">4 月五案的並排比較</caption><thead>${head}</thead><tbody>${rows}${secretRow}${similanRow}</tbody></table>`;
  }

  function renderAprilFees() {
    const host = el('april-fees');
    if (!host) return;
    host.innerHTML = APRIL_PARK_FEES.map(
      (fee) => `
      <article class="krabi-fee">
        <p class="krabi-fee__place">${esc(fee.place)}</p>
        <p class="krabi-fee__amount">฿${fee.adultTHB} / 成人${fee.childTHB ? `・兒童 ฿${fee.childTHB}` : ''}</p>
        <p class="krabi-fee__season">${esc(fee.season)}</p>
        <p class="krabi-fee__note">${esc(fee.note)}</p>
        <a class="krabi-fee__link" href="${esc(fee.url)}" target="_blank" rel="noopener noreferrer">官方來源 ↗</a>
      </article>`,
    ).join('');
  }

  function renderAprilContingency() {
    const host = el('april-contingency');
    if (!host) return;
    host.innerHTML = APRIL_CONTINGENCY.map(
      (row) => `
      <div class="krabi-cont-row">
        <div class="krabi-cont-row__situation">${esc(row.situation)}</div>
        <div class="krabi-cont-row__action">${esc(row.action)}</div>
      </div>`,
    ).join('');
  }

  /* ═══ 事件 ═══ */

  function wire() {
    el('window-axis-tabs')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-window-axis]');
      if (!btn) return;
      activeWindowAxis = btn.dataset.windowAxis;
      renderWindowAxisTabs();
      renderWindowCompare();
    });

    el('april-axis-tabs')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-april-axis]');
      if (!btn) return;
      activeAprilAxis = btn.dataset.aprilAxis;
      renderAprilAxisTabs();
    });

    el('april-plan-list')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-april-toggle]');
      if (!btn) return;
      const id = btn.dataset.aprilToggle;
      if (openPlans.has(id)) openPlans.delete(id);
      else openPlans.add(id);
      renderAprilPlans();
      el('april-plan-list')?.querySelector(`[data-april-toggle="${id}"]`)?.focus();
    });

    el('april-plan-list')?.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && openPlans.size > 0) {
        openPlans.clear();
        renderAprilPlans();
      }
    });
  }

  function render() {
    renderEnsoStatus();
    renderEnsoTimeline();
    renderTmdWarnings();
    renderEnsoImpacts();
    renderHeatPreps();
    renderEnsoCaveats();
    renderWindowCards();
    renderWindowAxisTabs();
    renderWindowCompare();
    renderAprilFacts();
    renderAprilEnsoNote();
    renderAprilCalc();
    renderAprilPlans();
    renderAprilAxisTabs();
    renderAprilCompare();
    renderAprilFees();
    renderAprilContingency();
  }

  /** 人數變動時只需重算 4 月費用試算 */
  function onTravelersChange() {
    renderAprilCalc();
  }

  return { render, wire, onTravelersChange };
}
