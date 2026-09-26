/**
 * Trave_Dec — 甲米 2027/05 跳島浮潛・五方案比較（UI 層）
 *
 * 與日本滑雪行程完全獨立：不共用 state、不影響既有 tab 與資料。
 * 本地狀態只有三個：出行人數、是否含機票、目前展開的方案卡。
 * 勾選清單另存 localStorage（與行程存檔分開，避免影響既有 reset）。
 */

import {
  KRABI_META,
  KRABI_KEY_FACTS,
  KRABI_PLANS,
  KRABI_COMPARE_AXES,
  KRABI_CONTINGENCY,
  KRABI_PARK_FEES,
  KRABI_OPEN_QUESTIONS,
  KRABI_SOURCE_LINKS,
  KRABI_FRESHNESS_BANNER,
  KRABI_FLIGHT_ESTIMATE,
  THB_TO_TWD_ASSUMED,
} from './data/krabi.js';
import {
  planCostTwd,
  estimateGroupTotalTwd,
  normalizeTravelerCount,
  computeCompareMatrix,
  recommendPlans,
  planRiskTone,
  planRiskLabel,
  planSeaDayCount,
  planSnorkelStopCount,
  planBaseMoves,
  riskToneOf,
  percentOfMax,
  estimateChecklistProgress,
  toggleChecklistItem,
  THB_TO_TWD_ASSUMED as RATE,
} from './krabi-helpers.js';

const CHECKLIST_KEY = 'trave_dec_krabi_checklist';

export function createKrabiSection({ getEl, esc, toast }) {
  const el = (id) => getEl(id);

  let travelers = KRABI_META.defaultTravelers;
  let includeFlight = false;
  let activeAxis = KRABI_COMPARE_AXES[0].key;
  let openPlans = new Set();
  let checked = loadChecklist();

  function loadChecklist() {
    try {
      const raw = localStorage.getItem(CHECKLIST_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : [];
    } catch {
      return [];
    }
  }

  function saveChecklist() {
    try {
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(checked));
    } catch {
      /* 無痕模式或配額滿：靜默降級，不影響瀏覽 */
    }
  }

  /* ── 靜態區塊 ── */

  function renderFreshness() {
    const node = el('krabi-freshness-note');
    if (node) node.textContent = KRABI_FRESHNESS_BANNER;
  }

  function renderKeyFacts() {
    const host = el('krabi-key-facts');
    if (!host) return;
    host.innerHTML = KRABI_KEY_FACTS.map(
      (fact) => `
      <article class="krabi-fact${fact.severity === 'critical' ? ' krabi-fact--critical' : ''}">
        <span class="krabi-fact__label">${esc(fact.label)}</span>
        <p class="krabi-fact__value">${esc(fact.value)}</p>
        <p class="krabi-fact__detail">${esc(fact.detail)}</p>
      </article>`,
    ).join('');
  }

  function renderReco() {
    const host = el('krabi-reco');
    if (!host) return;
    // 預設以「浮潛點最多」為主推；理由直接引用 helper 的計算結果。
    const reco = recommendPlans(KRABI_PLANS, { goal: 'snorkel' });
    const alts = reco.alternatives
      .map((p) => `<span class="krabi-reco__alt">${esc(p.tag)}・${esc(p.name)}</span>`)
      .join('');
    host.innerHTML = `
      <p class="krabi-reco__label">依浮潛強度的主推方案</p>
      <p class="krabi-reco__primary">方案 ${esc(reco.primary.tag)}：${esc(reco.primary.name)}</p>
      <p class="krabi-reco__reason">${esc(reco.reason)} 若要更保守，見方案 ${esc(lowestRiskTag())}（雨季風險最低）；若要省錢，見方案 ${esc(cheapestTag())}（前季團費最低）。</p>
      <div class="krabi-reco__alts">${alts}</div>`;
  }

  function lowestRiskTag() {
    return KRABI_PLANS.reduce(
      (best, p) => (rankOf(p.riskLevel) < rankOf(best.riskLevel) ? p : best),
      KRABI_PLANS[0],
    ).tag;
  }

  function cheapestTag() {
    return KRABI_PLANS.reduce(
      (best, p) => (p.estimateTHB.min < best.estimateTHB.min ? p : best),
      KRABI_PLANS[0],
    ).tag;
  }

  function rankOf(level) {
    return { low: 1, mid: 2, 'mid-high': 3, high: 4 }[level] || 4;
  }

  /* ── 費用試算 ── */

  function renderCalc() {
    const note = el('krabi-calc-note');
    if (note) {
      note.textContent = `前季參考團費（不含機票）換算為新台幣，${travelers} 人分攤。`;
    }

    const grid = el('krabi-cost-grid');
    if (grid) {
      grid.innerHTML = KRABI_PLANS.map((plan) => {
        const group = estimateGroupTotalTwd(plan, travelers, { includeFlight });
        const per = group.perPerson;
        return `
        <div class="krabi-cost">
          <span class="krabi-cost__tag">${esc(plan.tag)}</span>
          <span class="krabi-cost__name">${esc(plan.name)}</span>
          <span class="krabi-cost__value">NT$${per.min.toLocaleString('en-US')}–${per.max.toLocaleString('en-US')}</span>
          <span class="krabi-cost__group">全團 ${group.travelers} 人：NT$${group.min.toLocaleString('en-US')}–${group.max.toLocaleString('en-US')}</span>
        </div>`;
      }).join('');
    }

    const rateNote = el('krabi-rate-note');
    if (rateNote) {
      rateNote.textContent = `匯率假設 1 THB ≈ ${THB_TO_TWD_ASSUMED} TWD，為可自行調整的規劃假設值；實際刷卡或現金匯率請以 banks／台灣銀行公告為準。機票為前季參考 TWD ${KRABI_FLIGHT_ESTIMATE.minTWD.toLocaleString('en-US')}–${KRABI_FLIGHT_ESTIMATE.maxTWD.toLocaleString('en-US')}，2027/05 實際票價須於訂票時確認。`;
    }
  }

  function syncCalcControls() {
    const input = el('krabi-people-input');
    if (input) input.value = travelers;
    const flight = el('krabi-include-flight');
    if (flight) flight.checked = includeFlight;
  }

  /* ── 五方案卡 ── */

  function renderPlans() {
    const host = el('krabi-plan-list');
    if (!host) return;

    const maxStops = Math.max(...KRABI_PLANS.map(planSnorkelStopCount));
    const reco = recommendPlans(KRABI_PLANS, { goal: 'snorkel' });

    host.innerHTML = KRABI_PLANS.map((plan) => {
      const tone = planRiskTone(plan.riskLevel);
      const isOpen = openPlans.has(plan.id);
      const isPrimary = plan.tag === reco.primary.tag;

      const days = plan.days
        .map((day) => {
          const chips = [];
          if (day.seaDay && !day.isBuffer) chips.push('<span class="krabi-plan__chip krabi-plan__chip--sea">出海</span>');
          if (day.isBuffer) chips.push('<span class="krabi-plan__chip krabi-plan__chip--buffer">雨備緩衝日</span>');
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
        .map(
          (s) =>
            `<a class="krabi-plan__source" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a>`,
        )
        .join('');

      return `
      <article class="krabi-plan${isPrimary ? ' krabi-plan--primary' : ''}" data-plan-id="${esc(plan.id)}">
        <div class="krabi-plan__head">
          <div class="krabi-plan__badges">
            <span class="krabi-plan__tag">${esc(plan.tag)}</span>
            <span class="krabi-plan__risk krabi-plan__risk--${tone}">雨季風險 ${esc(planRiskLabel(plan.riskLevel))}</span>
            ${plan.isSnorkelOnly ? '<span class="krabi-plan__snorkel">全浮潛跳島</span>' : ''}
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
            <span class="krabi-plan__stat-label">基地</span>
            <span class="krabi-plan__stat-value">${esc(plan.base)}</span>
          </div>
          <div class="krabi-plan__stat">
            <span class="krabi-plan__stat-label">搬運次數</span>
            <span class="krabi-plan__stat-value">${planBaseMoves(plan) ? `${planBaseMoves(plan)} 次` : '不需搬運'}</span>
          </div>
          <div class="krabi-plan__stat">
            <span class="krabi-plan__stat-label">船取消後可替代性</span>
            <span class="krabi-plan__stat-value">${esc(plan.flexibilityLabel)}</span>
          </div>
          <div class="krabi-plan__stat">
            <span class="krabi-plan__stat-label">前季團費／人</span>
            <span class="krabi-plan__stat-value">฿${plan.estimateTHB.min.toLocaleString('en-US')}–${plan.estimateTHB.max.toLocaleString('en-US')}</span>
          </div>
        </div>

        <p class="krabi-plan__highlight">${esc(plan.highlight)}</p>
        <p class="krabi-plan__suits">適合：${esc(plan.suits)}</p>

        <button type="button" class="krabi-plan__toggle" data-plan-toggle="${esc(plan.id)}"
                aria-expanded="${isOpen}" aria-controls="krabi-days-${esc(plan.id)}">
          <span class="krabi-plan__toggle-icon" aria-hidden="true">${isOpen ? '▾' : '▸'}</span>
          ${isOpen ? '收合 7 日行程' : '展開 7 日行程'}
        </button>

        <div class="krabi-plan__days${isOpen ? ' is-open' : ''}" id="krabi-days-${esc(plan.id)}"${isOpen ? '' : ' hidden'}>
          ${days}
        </div>

        <div class="krabi-plan__foot">${sources}</div>
      </article>`;
    }).join('');
  }

  /* ── 比較表 ── */

  function renderAxisTabs() {
    const host = el('krabi-axis-tabs');
    if (!host) return;
    host.innerHTML = KRABI_COMPARE_AXES.map(
      (axis) => `
      <button type="button" class="krabi-axis-tab" role="tab" data-krabi-axis="${esc(axis.key)}"
              aria-selected="${axis.key === activeAxis}">${esc(axis.label)}</button>`,
    ).join('');
  }

  function renderCompare() {
    const host = el('krabi-compare-body');
    if (!host) return;

    const matrix = computeCompareMatrix(KRABI_PLANS, KRABI_COMPARE_AXES);

    const head = `<tr>
      <th scope="col">比較軸</th>
      ${KRABI_PLANS.map((p) => `<th scope="col">${esc(p.tag)}・${esc(p.name)}</th>`).join('')}
    </tr>`;

    const rows = matrix
      .map((row) => {
        const byTag = new Map(row.values.map((v) => [v.tag, v]));
        const cells = KRABI_PLANS.map((p) => {
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

    host.innerHTML = `<table class="krabi-table"><caption class="visually-hidden">五種甲米方案的並排比較</caption><thead>${head}</thead><tbody>${rows}</tbody></table>`;
  }

  /* ── 應變對照 / 公園費 / 清單 / 來源 ── */

  function renderContingency() {
    const host = el('krabi-contingency');
    if (!host) return;
    host.innerHTML = KRABI_CONTINGENCY.map(
      (row) => `
      <div class="krabi-cont-row">
        <div class="krabi-cont-row__situation">${esc(row.situation)}</div>
        <div class="krabi-cont-row__action">${esc(row.action)}</div>
      </div>`,
    ).join('');
  }

  function renderFees() {
    const host = el('krabi-fees');
    if (!host) return;
    host.innerHTML = KRABI_PARK_FEES.map(
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

  function renderChecklist() {
    const host = el('krabi-checklist');
    if (!host) return;
    host.innerHTML = KRABI_OPEN_QUESTIONS.map(
      (q) => `
      <li>
        <label class="krabi-check">
          <input type="checkbox" data-krabi-check="${esc(q.id)}" ${checked.includes(q.id) ? 'checked' : ''} />
          <span class="krabi-check__text">${esc(q.text)}</span>
        </label>
      </li>`,
    ).join('');

    const progress = estimateChecklistProgress(checked, KRABI_OPEN_QUESTIONS.length);
    const p = el('krabi-checklist-progress');
    if (p) p.textContent = `已確認 ${progress.done} / ${progress.total}（${progress.percent}%）`;
  }

  function renderSources() {
    const host = el('krabi-sources');
    if (!host) return;
    host.innerHTML = KRABI_SOURCE_LINKS.map(
      (s) =>
        `<li><a class="krabi-source-link" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a></li>`,
    ).join('');
  }

  /* ── 事件 ── */

  function wire() {
    el('krabi-people-minus')?.addEventListener('click', () => setTravelers(travelers - 1));
    el('krabi-people-plus')?.addEventListener('click', () => setTravelers(travelers + 1));
    el('krabi-people-input')?.addEventListener('change', (e) => setTravelers(e.target.value));

    el('krabi-include-flight')?.addEventListener('change', (e) => {
      includeFlight = Boolean(e.target.checked);
      renderCalc();
    });

    el('krabi-plan-list')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-plan-toggle]');
      if (!btn) return;
      const id = btn.dataset.planToggle;
      if (openPlans.has(id)) {
        openPlans.delete(id);
      } else {
        openPlans.add(id);
      }
      renderPlans();
      // 重繪後把焦點還給同一顆按鈕，維持鍵盤操作連續性。
      const next = el('krabi-plan-list')?.querySelector(`[data-plan-toggle="${id}"]`);
      next?.focus();
    });

    el('krabi-axis-tabs')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-krabi-axis]');
      if (!btn) return;
      activeAxis = btn.dataset.krabiAxis;
      renderAxisTabs();
      renderCompare();
    });

    el('krabi-checklist')?.addEventListener('change', (e) => {
      const box = e.target.closest('[data-krabi-check]');
      if (!box) return;
      checked = toggleChecklistItem(checked, box.dataset.krabiCheck);
      saveChecklist();
      renderChecklist();
    });

    el('krabi-checklist-reset')?.addEventListener('click', () => {
      checked = [];
      saveChecklist();
      renderChecklist();
      toast?.('已重設待查證清單');
    });

    // Esc 收合所有展開的方案卡
    el('krabi-plan-list')?.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && openPlans.size > 0) {
        openPlans.clear();
        renderPlans();
      }
    });
  }

  function setTravelers(value) {
    const next = normalizeTravelerCount(value);
    if (next === travelers) {
      syncCalcControls();
      return;
    }
    travelers = next;
    syncCalcControls();
    renderCalc();
  }

  function render() {
    renderFreshness();
    renderKeyFacts();
    renderReco();
    syncCalcControls();
    renderCalc();
    renderPlans();
    renderAxisTabs();
    renderCompare();
    renderContingency();
    renderFees();
    renderChecklist();
    renderSources();
  }

  return { render, wire };
}
