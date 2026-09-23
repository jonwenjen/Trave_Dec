/**
 * Trave_Dec — 應用進入點
 *
 * 四個面向：行程（駕駛艙）／計畫／預算／隨身工具。
 * 所有畫面都由 state + 範例資料重新算出來，沒有隱藏的可變狀態。
 */

import './style.css';
import {
  TRIP_META,
  SAMPLE_ITINERARY,
  SAMPLE_BUDGET,
  DESTINATION_CARDS,
  PHRASE_CATEGORIES,
  EMERGENCY_CONTACTS,
  OFFICIAL_LINKS,
  STATUS_LABELS,
  EVENT_TYPE_LABELS,
  TRANSFER_PLANS,
  CONTINGENCY_PLAYBOOK,
  LIVE_DATA_SOURCES,
} from './data/itinerary.js';
import {
  TAB_IDS,
  loadState,
  saveState,
  resetState,
  getDefaultState,
  normalizeState,
  hasSavedState,
  isOffline,
} from './store.js';
import {
  formatCurrency,
  formatShortDate,
  parseISODate,
  daysUntil,
  resolveActiveDay,
  dayIndexOf,
  sortEventsByTime,
  timeToMinutes,
  getNextEvent,
  summarizeDay,
  computeItineraryCost,
  computeDayBudget,
  eventCostPerPerson,
  mergeBudgetEdits,
  budgetTotals,
  normalizeBufferPolicy,
  resolveEventRisk,
  collectTransferRisks,
  collectLodgingToConfirm,
  searchItinerary,
  filterEventsByType,
  searchFieldContent,
  applyEdits,
  highlightText,
  exportTripJSON,
  importTripJSON,
  generateICS,
  buildShareURL,
  decodeShareState,
} from './helpers.js';

/* ═══════════════════════════════════════════
   狀態
   ═══════════════════════════════════════════ */

let state = loadState();
let tripDays = applyEdits(SAMPLE_ITINERARY, state);
let searchQuery = '';
let fieldQuery = '';
let activePhraseCat = PHRASE_CATEGORIES[0].id;
let lastFocusedBeforeDialog = null;

const RISK_LABELS = {
  high: { label: '高風險', hint: '緩衝不足，錯過就沒有替代班次' },
  medium: { label: '需留意', hint: '緩衝偏緊，建議先確認月台與乘車處' },
  low: { label: '從容', hint: '緩衝足夠' },
  unknown: { label: '未估算', hint: '沒有緩衝資料，現場再判斷' },
};

const PHASE_TEXT = {
  before: (d) => `出發前 ${d} 天 · 12/11 成田落地`,
  during: () => '旅程進行中',
  after: () => '旅程已結束 · 以下為存檔',
};

const speechSupported =
  typeof window !== 'undefined' &&
  'speechSynthesis' in window &&
  typeof window.SpeechSynthesisUtterance === 'function';

/* ═══════════════════════════════════════════
   小工具
   ═══════════════════════════════════════════ */

const $ = (id) => document.getElementById(id);

/** HTML 跳脫，使用者輸入一律經過這裡 */
function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

let toastTimer = null;
function toast(message) {
  const node = $('toast');
  node.textContent = message;
  node.classList.add('toast--visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('toast--visible'), 2800);
}

/**
 * Targeted DOM patch: update container content without losing interactive state.
 * Compares new HTML against existing DOM and only touches changed nodes.
 */
function patchHTML(container, newHTML) {
  // Capture interactive state
  const openDetails = new Set();
  container.querySelectorAll('details[open]').forEach(d => {
    const id = d.closest('[id]');
    if (id) openDetails.add(id.id);
  });

  const focusedEl = document.activeElement;
  const focusId = focusedEl && focusedEl.id ? focusedEl.id : null;
  const focusSelStart = focusedEl && typeof focusedEl.selectionStart === 'number' ? focusedEl.selectionStart : null;
  const focusSelEnd = focusedEl && typeof focusedEl.selectionEnd === 'number' ? focusedEl.selectionEnd : null;
  const isComposing = focusedEl && focusedEl.dataset && focusedEl.dataset._composing === '1';

  // If currently composing (IME), skip update for this container if it contains the focused element
  if (isComposing && container.contains(focusedEl)) return;

  // Build new DOM fragment
  const temp = document.createElement(container.tagName || 'div');
  temp.innerHTML = newHTML;

  // Fast path: if content is identical, do nothing
  if (container.innerHTML === newHTML) return;

  // Replace content
  container.innerHTML = newHTML;

  // Restore <details> open state
  openDetails.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      const details = el.querySelector('details') || (el.tagName === 'DETAILS' ? el : null);
      if (details) details.open = true;
    }
  });

  // Also restore by matching details that were open by their parent event id
  container.querySelectorAll('[id]').forEach(node => {
    if (openDetails.has(node.id)) {
      const d = node.querySelector('details');
      if (d) d.open = true;
    }
  });

  // Restore focus
  if (focusId) {
    const restored = document.getElementById(focusId);
    if (restored && restored !== document.activeElement) {
      restored.focus({ preventScroll: true });
      if (focusSelStart != null && typeof restored.setSelectionRange === 'function') {
        try { restored.setSelectionRange(focusSelStart, focusSelEnd); } catch {}
      }
    }
  }
}

let saveTimer = null;
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveState(state);
    renderStorageNote();
  }, 300);
}

/** 重新計算衍生資料並整頁重繪，重繪期間保留焦點與游標位置 */
function update({ rerender = true } = {}) {
  tripDays = applyEdits(SAMPLE_ITINERARY, state);
  scheduleSave();
  if (rerender) render();
}

function render() {
  renderTabs();
  renderPartyControl();
  renderOperate();
  renderPlan();
  renderBudget();
  renderFieldKit();
  renderStorageNote();
}

function currentDay() {
  return tripDays.find((d) => dayIndexOf(d) === state.currentDay) || tripDays[0];
}

function policy() {
  return normalizeBufferPolicy(state.bufferPolicy);
}

function statusPill(status) {
  const meta = STATUS_LABELS[status];
  if (!meta) return '';
  return `<span class="pill pill--${esc(status)}" title="${esc(meta.hint)}">${esc(meta.label)}</span>`;
}

function typeMeta(type) {
  return EVENT_TYPE_LABELS[type] || { label: '行動', icon: '📌' };
}

function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ═══════════════════════════════════════════
   分頁
   ═══════════════════════════════════════════ */

const TABS = ['operate', 'plan', 'budget', 'fieldkit'];
const PANEL_IDS = {
  operate: 'panel-operate',
  plan: 'panel-plan',
  budget: 'panel-budget',
  fieldkit: 'panel-fieldkit',
};

const tabScrollPositions = {};

function renderTabs() {
  for (const tab of TABS) {
    const btn = $(`tab-${tab}`);
    const panel = $(PANEL_IDS[tab]);
    const selected = state.activeTab === tab;
    btn.setAttribute('aria-selected', String(selected));
    btn.tabIndex = selected ? 0 : -1;
    panel.hidden = !selected;
  }
}

function setTab(tab, { focus = false } = {}) {
  if (!TABS.includes(tab)) return;
  tabScrollPositions[state.activeTab] = window.scrollY;
  state.activeTab = tab;
  renderTabs();
  scheduleSave();
  if (focus) $(`tab-${tab}`).focus();
  const saved = tabScrollPositions[tab];
  window.scrollTo({ top: saved || 0, behavior: 'auto' });
}

/* ═══════════════════════════════════════════
   人數
   ═══════════════════════════════════════════ */

function renderPartyControl() {
  const input = $('party-size');
  if (document.activeElement !== input) input.value = String(state.partySize);
  $('budget-party-label').textContent = String(state.partySize);
}

function setPartySize(next) {
  const size = Math.max(1, Math.min(20, Math.round(Number(next) || 1)));
  if (size === state.partySize) return;
  state.partySize = size;
  update();
}

/* ═══════════════════════════════════════════
   行程 OPERATE
   ═══════════════════════════════════════════ */

function renderOperate() {
  renderPhase();
  renderDayRail();
  renderHero();
  renderNowCard();
  renderTypeFilters();
  renderSearch();
  renderTimeline();
  renderOperateCaveat();
}

function renderPhase() {
  const { phase } = resolveActiveDay(tripDays, new Date());
  const remaining = daysUntil(TRIP_META.startDate, new Date());
  const text =
    phase === 'before'
      ? PHASE_TEXT.before(remaining)
      : phase === 'during'
        ? `${PHASE_TEXT.during()} · 第 ${state.currentDay} 天／共 ${tripDays.length} 天`
        : PHASE_TEXT.after();
  $('trip-phase').textContent = text;
}

function renderDayRail() {
  const track = $('day-nav');
  const today = new Date();
  const todayStamp = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;

  patchHTML(track, tripDays
    .map((day) => {
      const n = dayIndexOf(day);
      const summary = summarizeDay(day, state.partySize, state.bufferEdits, policy());
      const current = n === state.currentDay;
      return `
        <button type="button" class="day-chip${current ? ' day-chip--active' : ''}"
                data-day="${n}" aria-current="${current ? 'true' : 'false'}"
                aria-label="第 ${n} 天，${esc(formatShortDate(day.date))} 星期${esc(day.weekday)}，${esc(day.title)}">
          <span class="day-chip__num">${n}</span>
          <span class="day-chip__date">${esc(formatShortDate(day.date))}</span>
          ${day.date === todayStamp ? '<span class="day-chip__today" aria-hidden="true">今天</span>' : ''}
          ${summary.highRiskCount ? '<span class="day-chip__flag" aria-hidden="true"></span>' : ''}
        </button>`;
    })
    .join(''));

  const active = track.querySelector('.day-chip--active');
  if (active) active.scrollIntoView({ block: 'nearest', inline: 'center' });

  const todayDay = tripDays.find(d => d.date === todayStamp);
  const btnToday = $('btn-today');
  if (btnToday) {
    btnToday.hidden = !todayDay || dayIndexOf(todayDay) === state.currentDay;
  }
}

function renderHero() {
  const day = currentDay();
  const date = parseISODate(day.date);
  const lodging = day.lodging
    ? `<p class="day-hero__lodging">
         <span class="day-hero__lodging-label">住宿</span>
         <span>${esc(day.lodging)}</span>
         ${
           day.lodgingStatus === 'confirmed'
             ? '<span class="pill pill--confirmed">已訂房</span>'
             : '<span class="pill pill--unconfirmed">待確認</span>'
         }
       </p>`
    : '<p class="day-hero__lodging"><span class="day-hero__lodging-label">住宿</span><span>當晚返程，不住宿</span></p>';

  patchHTML($('day-hero'), `
    <p class="day-hero__eyebrow">
      <span class="day-hero__day">Day ${dayIndexOf(day)}</span>
      <span>${date.getMonth() + 1} 月 ${date.getDate()} 日（${esc(day.weekday)}）</span>
      <span class="day-hero__region">${esc(day.region)}</span>
    </p>
    <h1 class="day-hero__title">${esc(day.title)}</h1>
    <p class="day-hero__subtitle">${esc(day.subtitle)}</p>
    ${lodging}`);
}

function renderNowCard() {
  const day = currentDay();
  const now = new Date();
  const isToday = day.date === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const nowMinutes = isToday ? now.getHours() * 60 + now.getMinutes() : null;
  const next = getNextEvent(day, nowMinutes);
  const summary = summarizeDay(day, state.partySize, state.bufferEdits, policy());

  const nextBlock = next
    ? `<p class="now-card__event">
         <span class="now-card__time">${esc(next.time || '—')}</span>
         <span class="now-card__event-title">${typeMeta(next.type).icon} ${esc(next.title)}</span>
       </p>
       ${next.statusNote ? `<p class="now-card__note">${esc(next.statusNote)}</p>` : ''}`
    : '<p class="now-card__event"><span class="now-card__event-title">今天的行程都跑完了。</span></p>';

  patchHTML($('now-card'), `
    <p class="now-card__label">${isToday ? (next ? '接下來' : '今日收工') : '當日開場'}</p>
    ${nextBlock}
    <dl class="now-card__stats">
      <div class="stat"><dt>行程</dt><dd>${summary.eventCount} 項</dd></div>
      <div class="stat"><dt>每人費用</dt><dd>${formatCurrency(summary.costPerPerson)}</dd></div>
      <div class="stat${summary.riskCount ? ' stat--alert' : ''}"><dt>需留意轉乘</dt><dd>${summary.riskCount} 段</dd></div>
      <div class="stat"><dt>時段</dt><dd>${esc(summary.firstTime || '—')}–${esc(summary.lastTime || '—')}</dd></div>
    </dl>`);
}

function renderTypeFilters() {
  const present = new Set();
  for (const day of tripDays) for (const e of day.events) present.add(e.type);
  const types = Object.keys(EVENT_TYPE_LABELS).filter((t) => present.has(t));
  const all = state.typeFilters.length === 0;

  patchHTML($('type-filters'), [
    `<button type="button" class="chip${all ? ' chip--active' : ''}" data-type="__all" aria-pressed="${all}">全部</button>`,
    ...types.map((type) => {
      const on = state.typeFilters.includes(type);
      const meta = typeMeta(type);
      return `<button type="button" class="chip${on ? ' chip--active' : ''}" data-type="${esc(type)}" aria-pressed="${on}">${meta.icon} ${esc(meta.label)}</button>`;
    }),
  ].join(''));
}

function toggleTypeFilter(type) {
  if (type === '__all') {
    state.typeFilters = [];
  } else if (state.typeFilters.includes(type)) {
    state.typeFilters = state.typeFilters.filter((t) => t !== type);
  } else {
    state.typeFilters = [...state.typeFilters, type];
  }
  update();
}

function renderSearch() {
  const input = $('search-input');
  if (document.activeElement !== input) input.value = searchQuery;
  $('search-clear').hidden = !searchQuery;

  const box = $('search-results');
  const dayView = $('day-view');
  if (!searchQuery.trim()) {
    box.hidden = true;
    box.innerHTML = '';
    dayView.hidden = false;
    return;
  }

  const results = searchItinerary(tripDays, searchQuery);
  const hits = results.reduce((n, d) => n + d.events.length, 0);
  dayView.hidden = true;
  box.hidden = false;
  patchHTML(box, `
    <p class="search-results__count">在 ${results.length} 天中找到 ${hits} 個項目</p>
    ${
      results.length
        ? results
            .map(
              (day) => `
        <section class="search-day">
          <button type="button" class="search-day__head" data-day="${dayIndexOf(day)}">
            <span class="search-day__num">Day ${dayIndexOf(day)}</span>
            <span class="search-day__title">${highlightText(esc(formatShortDate(day.date)) + ' ' + esc(day.title), esc(searchQuery))}</span>
            <span class="search-day__go" aria-hidden="true">→</span>
          </button>
          <ul class="search-hits">
            ${day.events
              .map(
                (e) => `<li><span class="search-hits__time">${esc(e.time || '—')}</span>
                        <span>${typeMeta(e.type).icon} ${highlightText(esc(e.title), esc(searchQuery))}</span></li>`
              )
              .join('')}
          </ul>
        </section>`
            )
            .join('')
        : '<p class="empty-state">沒有符合的行程。試試地名、日文名稱或「巴士」「纜車」。</p>'
    }`);
}

function renderTimeline() {
  const day = currentDay();
  const events = filterEventsByType(sortEventsByTime(day.events), state.typeFilters);
  const list = $('timeline');
  const empty = $('timeline-empty');
  const now = new Date();
  const isToday = day.date === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const nowMinutes = isToday ? now.getHours() * 60 + now.getMinutes() : null;

  empty.hidden = events.length > 0;
  patchHTML(list, events.map((event) => renderEvent(event, nowMinutes)).join(''));
}

function renderEvent(event, nowMinutes = null) {
  const risk = resolveEventRisk(event, state.bufferEdits, policy());
  const meta = typeMeta(event.type);
  const cost = eventCostPerPerson(event, state.partySize);

  const costLabel = event.costTotal != null
    ? `${formatCurrency(event.costTotal)} 全團 · 每人 ${formatCurrency(cost)}`
    : cost
      ? `${formatCurrency(cost)}／人`
      : '';

  const riskBlock =
    risk.source === 'none'
      ? ''
      : `<div class="risk risk--${esc(risk.level)}">
           <p class="risk__head">
             <span class="risk__label">${esc(RISK_LABELS[risk.level].label)}</span>
             ${risk.bufferMinutes != null ? `<span class="risk__buffer">緩衝 ${risk.bufferMinutes} 分</span>` : ''}
             ${event.bufferEdited ? '<span class="risk__edited">已調整</span>' : ''}
           </p>
           ${event.transferBuffer ? `<p class="risk__text">${esc(event.transferBuffer)}</p>` : ''}
           <label class="risk__control">
             <span>設定緩衝（分鐘）</span>
             <input type="number" min="0" max="600" step="5" inputmode="numeric"
                    id="op-buffer-${esc(event.id)}" data-buffer-event="${esc(event.id)}"
                    value="${risk.bufferMinutes != null ? risk.bufferMinutes : ''}"
                    placeholder="未估算" />
           </label>
         </div>`;

  const sourceBits = [];
  if (event.source) {
    sourceBits.push(
      event.sourceUrl
        ? `<a class="source-link" href="${esc(event.sourceUrl)}" target="_blank" rel="noopener">${esc(event.source)} ↗</a>`
        : `<span class="source-tag">${esc(event.source)}</span>`
    );
  } else if (event.sourceUrl) {
    sourceBits.push(`<a class="source-link" href="${esc(event.sourceUrl)}" target="_blank" rel="noopener">官方頁面 ↗</a>`);
  }

  const isPast = nowMinutes != null && timeToMinutes(event.time) != null && timeToMinutes(event.time) < nowMinutes;

  return `
    <li class="event event--${esc(event.type)}${isPast ? ' event--past' : ''}" id="event-${esc(event.id)}">
      <div class="event__gutter" aria-hidden="true"><span class="event__dot"></span></div>
      <div class="event__body">
        <p class="event__head">
          <time class="event__time">${esc(event.time || '—')}</time>
          ${event.endTime ? `<span class="event__time-end">– ${esc(event.endTime)}</span>` : ''}
          ${statusPill(event.status)}
        </p>
        <h3 class="event__title">${esc(event.title)}</h3>
        ${event.titleJa ? `<p class="event__title-ja" lang="ja">${esc(event.titleJa)}</p>` : ''}
        ${event.description ? `<p class="event__desc">${esc(event.description)}</p>` : ''}
        ${event.notes ? `<p class="event__notes">${esc(event.notes)}</p>` : ''}
        <p class="event__meta">
          <span class="tag">${meta.icon} ${esc(meta.label)}</span>
          ${costLabel ? `<span class="tag tag--cost">${esc(costLabel)}</span>` : ''}
          ${sourceBits.join('')}
        </p>
        ${event.statusNote ? `<p class="event__caveat">ℹ️ ${esc(event.statusNote)}</p>` : ''}
        ${riskBlock}
        <details class="event__note-editor"${event.userNote ? ' open' : ''}>
          <summary>我的備註${event.userNote ? '（已填寫）' : ''}</summary>
          <textarea id="note-${esc(event.id)}" data-note-event="${esc(event.id)}" rows="2"
                    placeholder="現場記下來的事，只存在這台裝置">${esc(event.userNote || '')}</textarea>
        </details>
      </div>
    </li>`;
}

function renderOperateCaveat() {
  patchHTML($('operate-caveat'), `
    <strong>資料狀態</strong>：${esc(TRIP_META.caveat)}
    最後查核 ${esc(TRIP_META.lastChecked)}，來源
    <a href="${esc(TRIP_META.dataSourceUrl)}" target="_blank" rel="noopener">${esc(TRIP_META.dataSource)} ↗</a>。
    本頁不連接任何即時班次或雪況資料。`);
}

/* ═══════════════════════════════════════════
   計畫 PLAN
   ═══════════════════════════════════════════ */

function renderPlan() {
  const p = policy();
  const tight = $('buffer-tight');
  const safe = $('buffer-safe');
  if (document.activeElement !== tight) tight.value = String(p.tightMinutes);
  if (document.activeElement !== safe) safe.value = String(p.safeMinutes);
  $('buffer-summary').textContent =
    `目前：緩衝少於 ${p.tightMinutes} 分鐘標為高風險，${p.tightMinutes}–${p.safeMinutes} 分鐘標為需留意，超過 ${p.safeMinutes} 分鐘視為從容。`;

  renderRiskList();
  renderLodgingList();
  renderOverview();
  renderPlanOptions();
  renderPlaybook();
}

function renderRiskList() {
  const risks = collectTransferRisks(tripDays, state.bufferEdits, policy());
  patchHTML($('risk-list'), risks.length
    ? risks
        .map(
          ({ day, event, level, bufferMinutes }) => `
      <li class="risk-row risk-row--${esc(level)}">
        <div class="risk-row__main">
          <button type="button" class="risk-row__jump" data-day="${dayIndexOf(day)}">
            Day ${dayIndexOf(day)} · ${esc(formatShortDate(day.date))} ${esc(event.time || '')}
          </button>
          <p class="risk-row__title">${esc(event.title)}</p>
          ${event.transferBuffer ? `<p class="risk-row__note">${esc(event.transferBuffer)}</p>` : ''}
          <p class="risk-row__verdict">${esc(RISK_LABELS[level].label)} — ${esc(RISK_LABELS[level].hint)}</p>
        </div>
        <label class="risk-row__control">
          <span class="visually-hidden">${esc(event.title)} 的緩衝分鐘</span>
          <input type="number" min="0" max="600" step="5" inputmode="numeric"
                 id="plan-buffer-${esc(event.id)}" data-buffer-event="${esc(event.id)}"
                 value="${bufferMinutes != null ? bufferMinutes : ''}" placeholder="—" />
          <span class="risk-row__unit">分</span>
        </label>
      </li>`
        )
        .join('')
    : '<li class="empty-state">目前沒有標記風險的轉乘。</li>');
}

function renderLodgingList() {
  const rows = collectLodgingToConfirm(tripDays, {});
  patchHTML($('lodging-list'), rows
    .map(
      (row) => `
    <li class="lodging-row">
      <div class="lodging-row__head">
        <span class="lodging-row__date">Day ${row.dayNumber} · ${esc(formatShortDate(row.date))}</span>
        ${
          row.status === 'confirmed'
            ? '<span class="pill pill--confirmed">已訂房</span>'
            : '<span class="pill pill--unconfirmed">待確認</span>'
        }
      </div>
      <label class="lodging-row__field">
        <span class="visually-hidden">${esc(row.date)} 住宿名稱</span>
        <input type="text" id="lodging-name-${esc(row.date)}" data-lodging-date="${esc(row.date)}"
               value="${esc(row.name || '')}" placeholder="填入飯店名稱" />
      </label>
      <label class="lodging-row__check">
        <input type="checkbox" id="lodging-confirm-${esc(row.date)}" data-lodging-confirm="${esc(row.date)}"
               ${row.status === 'confirmed' ? 'checked' : ''} />
        <span>已訂房</span>
      </label>
    </li>`
    )
    .join(''));
}

function renderOverview() {
  patchHTML($('overview-list'), tripDays
    .map((day) => {
      const s = summarizeDay(day, state.partySize, state.bufferEdits, policy());
      return `
      <li>
        <button type="button" class="overview-row" data-day="${dayIndexOf(day)}">
          <span class="overview-row__day">Day ${dayIndexOf(day)}</span>
          <span class="overview-row__main">
            <span class="overview-row__title">${esc(day.title)}</span>
            <span class="overview-row__meta">${esc(formatShortDate(day.date))}（${esc(day.weekday)}）· ${esc(day.region)}</span>
          </span>
          <span class="overview-row__right">
            <span class="overview-row__cost">${formatCurrency(s.costPerPerson)}</span>
            ${s.highRiskCount ? '<span class="dot dot--high" title="有高風險轉乘"></span>' : ''}
            ${s.lodgingNeedsConfirm ? '<span class="dot dot--warn" title="住宿待確認"></span>' : ''}
          </span>
        </button>
      </li>`;
    })
    .join(''));
}

function renderPlanOptions() {
  patchHTML($('plan-options'), TRANSFER_PLANS.map(
    (plan) => `
    <li class="plan-option">
      <p class="plan-option__head">
        <span class="plan-option__label">${esc(plan.label)}</span>
        ${statusPill(plan.status)}
      </p>
      <p class="plan-option__eta">${esc(plan.eta)} · ${esc(plan.costNote)}</p>
      <p class="plan-option__pro">＋ ${esc(plan.pros)}</p>
      <p class="plan-option__con">− ${esc(plan.cons)}</p>
    </li>`
  ).join(''));
}

function renderPlaybook() {
  patchHTML($('playbook'), CONTINGENCY_PLAYBOOK.map(
    (item) => `
    <li class="playbook__item">
      <details>
        <summary>${esc(item.trigger)}</summary>
        <ul>${item.actions.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
      </details>
    </li>`
  ).join(''));
}

/* ═══════════════════════════════════════════
   預算 BUDGET
   ═══════════════════════════════════════════ */

function renderBudget() {
  const categories = mergeBudgetEdits(SAMPLE_BUDGET, state.budgetEdits);
  const totals = budgetTotals(categories, state.partySize);

  $('budget-total').textContent = formatCurrency(totals.perPerson);
  $('budget-group-total').textContent = formatCurrency(totals.group);
  $('budget-party-label').textContent = String(totals.partySize);

  patchHTML($('budget-grid'), categories
    .map(
      (cat) => `
    <div class="budget-item${cat.edited ? ' budget-item--edited' : ''}">
      <span class="budget-item__icon" aria-hidden="true">${cat.icon}</span>
      <span class="budget-item__info">
        <label class="budget-item__label" for="budget-input-${esc(cat.id)}">${esc(cat.label)}</label>
        <span class="budget-item__note">${esc(cat.note)}</span>
      </span>
      <span class="budget-item__amount">
        <span class="budget-item__yen" aria-hidden="true">¥</span>
        <input type="number" class="budget-item__input" id="budget-input-${esc(cat.id)}"
               data-budget="${esc(cat.id)}" min="0" step="500" inputmode="numeric"
               value="${Number(cat.estimatedYen) || 0}" />
      </span>
    </div>`
    )
    .join(''));

  // Budget proportion bar
  const totalBudget = totals.perPerson;
  const barHTML = totalBudget > 0 ? `
    <div class="budget-bar" aria-label="預算分類比例">
      ${categories.filter(c => c.estimatedYen > 0).map(cat => {
        const pct = ((cat.estimatedYen / totalBudget) * 100).toFixed(1);
        return `<div class="budget-bar__seg" style="flex:${cat.estimatedYen}" title="${esc(cat.label)} ${esc(pct)}%">
          <span class="budget-bar__label">${cat.icon} ${esc(pct)}%</span>
        </div>`;
      }).join('')}
    </div>` : '';
  
  const barEl = $('budget-bar-container');
  if (barEl) barEl.innerHTML = barHTML;

  const breakdown = tripDays
    .map((day) => ({ day, cost: computeDayBudget(day.events, state.partySize) }))
    .filter((row) => row.cost > 0);

  patchHTML($('cost-breakdown'), breakdown.length
    ? breakdown
        .map(
          ({ day, cost }) => `
      <li class="cost-row">
        <button type="button" class="cost-row__jump" data-day="${dayIndexOf(day)}">
          <span>Day ${dayIndexOf(day)} · ${esc(formatShortDate(day.date))} ${esc(day.title)}</span>
          <span class="cost-row__value">${formatCurrency(cost)}</span>
        </button>
      </li>`
        )
        .join('')
    : '<li class="empty-state">行程中沒有標註金額的項目。</li>');

  const itineraryTotal = computeItineraryCost(tripDays, state.partySize);
  $('itinerary-cost-total').textContent =
    `行程內標註費用合計：每人 ${formatCurrency(itineraryTotal)}（不含未標價的餐食與住宿）`;
}

/* ═══════════════════════════════════════════
   隨身工具 FIELD KIT
   ═══════════════════════════════════════════ */

function renderFieldKit() {
  const input = $('field-search');
  if (document.activeElement !== input) input.value = fieldQuery;
  $('field-search-clear').hidden = !fieldQuery;

  const { destinations, phrases } = searchFieldContent(DESTINATION_CARDS, PHRASE_CATEGORIES, fieldQuery);

  patchHTML($('dest-cards'), destinations.length
    ? destinations
        .map(
          (dest) => `
      <button type="button" class="dest-card" data-dest="${esc(dest.id)}">
        <span class="dest-card__ja" lang="ja">${esc(dest.nameJa)}</span>
        <span class="dest-card__zh">${esc(dest.nameZh)}${dest.region ? ` · ${esc(dest.region)}` : ''}</span>
        ${dest.address ? `<span class="dest-card__address" lang="ja">${esc(dest.address)}</span>` : ''}
        <span class="dest-card__cue" aria-hidden="true">放大 ⤢</span>
      </button>`
        )
        .join('')
    : '<p class="empty-state">沒有符合的地點。</p>');

  $('speech-note').textContent = speechSupported
    ? '按 🔊 用日語念出來，音量開大直接放給對方聽（語音由瀏覽器提供，離線是否可用依裝置而定）。按 ⤢ 可放大文字給對方看。'
    : '這個瀏覽器不支援語音合成，朗讀按鈕已停用。按 ⤢ 把日文放大給對方看，效果一樣好。';

  const showingSearch = Boolean(fieldQuery.trim());
  $('phrase-cats').hidden = showingSearch;
  if (!showingSearch) {
    patchHTML($('phrase-cats'), PHRASE_CATEGORIES.map((cat) => {
      const on = cat.id === activePhraseCat;
      return `<button type="button" class="chip${on ? ' chip--active' : ''}" role="tab"
               aria-selected="${on}" data-phrase-cat="${esc(cat.id)}">${cat.icon} ${esc(cat.label)}</button>`;
    }).join(''));
  }

  const list = showingSearch
    ? phrases
    : (PHRASE_CATEGORIES.find((c) => c.id === activePhraseCat) || PHRASE_CATEGORIES[0]).phrases;

  patchHTML($('phrase-list'), list.length
    ? list.map((phrase) => renderPhrase(phrase)).join('')
    : '<li class="empty-state">沒有符合的短句。</li>');

  patchHTML($('emergency-list'), EMERGENCY_CONTACTS.map(
    (contact) => `
    <li class="emergency-item">
      <span class="emergency-item__icon" aria-hidden="true">${contact.icon}</span>
      <span class="emergency-item__info">
        <span class="emergency-item__label">${esc(contact.label)}</span>
        ${contact.note ? `<span class="emergency-item__note">${esc(contact.note)}</span>` : ''}
      </span>
      <a class="emergency-item__link" href="tel:${esc(contact.number.replace(/[^+\d]/g, ''))}">${esc(contact.number)}</a>
    </li>`
  ).join(''));

  patchHTML($('official-links'), OFFICIAL_LINKS.map(
    (link) => `
    <li class="official-link-item">
      <a href="${esc(link.url)}" target="_blank" rel="noopener">${esc(link.label)}</a>
    </li>`
  ).join(''));

  patchHTML($('live-status'), LIVE_DATA_SOURCES.map(
    (src) => `
    <li class="live-status__item">
      <span>${esc(src.label)}</span>
      <span class="pill pill--offline">未連接</span>
    </li>`
  ).join(''));

  patchHTML($('source-caveat'), `
    <strong>資料來源</strong><br />
    擷取時間：${esc(TRIP_META.dataSnapshot)}（最後查核 ${esc(TRIP_META.lastChecked)}）<br />
    行程事實改編自 <a href="${esc(TRIP_META.dataSourceUrl)}" target="_blank" rel="noopener">${esc(TRIP_META.dataSource)} ↗</a><br />
    ${esc(TRIP_META.caveat)}`);
}

function renderPhrase(phrase) {
  const payload = esc(phrase.ja);
  return `
    <li class="phrase-item">
      <div class="phrase-item__text">
        <p class="phrase-item__ja" lang="ja">${payload}</p>
        <p class="phrase-item__zh">${esc(phrase.zh)}${phrase.category ? ` · ${esc(phrase.category)}` : ''}</p>
        <p class="phrase-item__roma">${esc(phrase.roma)}</p>
      </div>
      <div class="phrase-item__actions">
        <button type="button" class="icon-btn" data-copy="${payload}"
                aria-label="複製「${esc(phrase.zh)}」的日文">📋</button>
        <button type="button" class="icon-btn" data-zoom-ja="${payload}" data-zoom-zh="${esc(phrase.zh)}"
                aria-label="放大顯示「${esc(phrase.zh)}」的日文">⤢</button>
        <button type="button" class="icon-btn" data-speak="${payload}"
                ${speechSupported ? '' : 'disabled title="這個瀏覽器不支援語音合成"'}
                aria-label="朗讀「${esc(phrase.zh)}」的日文">🔊</button>
      </div>
    </li>`;
}

function renderStorageNote() {
  const saved = hasSavedState();
  const when = state.lastSaved ? new Date(state.lastSaved) : null;
  $('storage-note').textContent = saved
    ? `修改已存在這台裝置的瀏覽器中${when ? `（${when.toLocaleString('zh-TW', { hour12: false })}）` : ''}。分享連結會帶上人數、緩衝設定、預算與住宿修改，不含「我的備註」。`
    : '目前使用範例資料。任何修改都只會存在這台裝置，不會上傳。';
}

/* ═══════════════════════════════════════════
   語音 / 大字卡
   ═══════════════════════════════════════════ */

function speak(text) {
  if (!speechSupported) {
    toast('這個瀏覽器不支援語音合成，改用 ⤢ 放大給對方看');
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.9;
    const voice = window.speechSynthesis.getVoices().find((v) => /^ja/i.test(v.lang));
    if (voice) utterance.voice = voice;
    utterance.onerror = () => toast('朗讀失敗，改用 ⤢ 放大給對方看');
    window.speechSynthesis.speak(utterance);
  } catch {
    toast('朗讀失敗，改用 ⤢ 放大給對方看');
  }
}

function openCard({ ja, zh, address, phone }) {
  const dialog = $('fullscreen-card');
  lastFocusedBeforeDialog = document.activeElement;
  $('fc-ja').textContent = ja || '';
  $('fc-zh').textContent = zh || '';
  const addr = $('fc-address');
  addr.textContent = address || '';
  addr.hidden = !address;
  const tel = $('fc-phone');
  if (phone) {
    tel.hidden = false;
    tel.textContent = `📞 ${phone}`;
    tel.href = `tel:${phone.replace(/[^+\d]/g, '')}`;
  } else {
    tel.hidden = true;
    tel.removeAttribute('href');
  }
  dialog.hidden = false;
  document.body.classList.add('is-locked');
  $('fullscreen-close').focus();
}

function closeCard() {
  const dialog = $('fullscreen-card');
  if (dialog.hidden) return;
  dialog.hidden = true;
  document.body.classList.remove('is-locked');
  if (lastFocusedBeforeDialog && document.contains(lastFocusedBeforeDialog)) {
    lastFocusedBeforeDialog.focus();
  }
  lastFocusedBeforeDialog = null;
}

/* ═══════════════════════════════════════════
   匯出 / 匯入 / 分享
   ═══════════════════════════════════════════ */

function shareableSettings() {
  return {
    partySize: state.partySize,
    currentDay: state.currentDay,
    activeTab: state.activeTab,
    bufferPolicy: policy(),
    budgetEdits: state.budgetEdits,
    bufferEdits: state.bufferEdits,
    lodgingEdits: state.lodgingEdits,
    typeFilters: state.typeFilters,
  };
}

function doExportJSON() {
  const categories = mergeBudgetEdits(SAMPLE_BUDGET, state.budgetEdits);
  const json = exportTripJSON(
    { ...TRIP_META, exportedBy: 'Trave_Dec' },
    tripDays,
    categories,
    state.partySize,
    { settings: shareableSettings() }
  );
  download('trave-dec-2307-shiga.json', json, 'application/json');
  toast('已匯出行程 JSON');
}

function doExportICS() {
  const ics = generateICS(TRIP_META, tripDays);
  download('trave-dec-2307-shiga.ics', ics, 'text/calendar;charset=utf-8');
  toast('已下載 .ics，匯入行事曆後時區為 Asia/Tokyo');
}

async function doShare() {
  const url = buildShareURL(window.location.href.split('#')[0], shareableSettings());
  const payload = { title: TRIP_META.title, text: '2307 志賀高原滑雪行程（規劃估算）', url };
  if (navigator.share) {
    try {
      await navigator.share(payload);
      return;
    } catch (err) {
      if (err && err.name === 'AbortError') return;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast('連結已複製到剪貼簿');
    return;
  } catch {
    /* 繼續往下用 prompt */
  }
  window.prompt('複製這個連結分享目前設定：', url);
}

function doImport(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = importTripJSON(String(reader.result));
      const incoming = parsed.settings || { partySize: parsed.partySize };
      state = normalizeState(incoming, getDefaultState());
      update();
      const sameTrip =
        Array.isArray(parsed.days) && parsed.days.length === SAMPLE_ITINERARY.length;
      toast(
        sameTrip
          ? '已匯入設定與修改'
          : '已匯入設定；行程內容仍使用內建範例（本版本不取代行程資料）'
      );
    } catch (err) {
      toast(`匯入失敗：${err.message}`);
    }
  };
  reader.onerror = () => toast('讀取檔案失敗');
  reader.readAsText(file);
}

function doReset() {
  const ok = window.confirm('清除這台裝置上的所有修改（人數、預算、緩衝、住宿、備註），回到範例資料？');
  if (!ok) return;
  resetState();
  state = getDefaultState();
  state.currentDay = resolveActiveDay(SAMPLE_ITINERARY, new Date()).dayNumber;
  searchQuery = '';
  fieldQuery = '';
  update();
  toast('已回到範例資料');
}

/* ═══════════════════════════════════════════
   事件綁定
   ═══════════════════════════════════════════ */

function goToDay(n) {
  const day = tripDays.find((d) => dayIndexOf(d) === Number(n));
  if (!day) return;
  state.currentDay = Number(n);
  searchQuery = '';
  if (state.activeTab !== 'operate') setTab('operate');
  update();
  $('day-hero').scrollIntoView({ block: 'start', behavior: 'smooth' });
}

function stepDay(delta) {
  const next = state.currentDay + delta;
  if (next < 1 || next > tripDays.length) return;
  state.currentDay = next;
  update();
}

function wireEvents() {
  // 深色模式
  const THEME_KEY = 'trave_dec_theme';
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
  }
  function initTheme() {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark' || saved === 'light') {
        document.documentElement.setAttribute('data-theme', saved);
      }
    } catch {}
  }
  initTheme();
  const themeToggle = $('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      if (current === 'dark') applyTheme('light');
      else if (current === 'light') applyTheme('dark');
      else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(prefersDark ? 'light' : 'dark');
      }
    });
  }

  // Track IME composition to prevent DOM updates during input
  document.addEventListener('compositionstart', (e) => {
    if (e.target) e.target.dataset._composing = '1';
  });
  document.addEventListener('compositionend', (e) => {
    if (e.target) delete e.target.dataset._composing;
  });

  // 分頁
  document.querySelector('.tab-bar').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tab]');
    if (btn) setTab(btn.dataset.tab);
  });
  document.querySelector('.tab-bar').addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const i = TABS.indexOf(state.activeTab);
    const next = (i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length;
    setTab(TABS[next], { focus: true });
  });

  // 人數
  $('party-size').addEventListener('input', (e) => {
    // 欄位清空時先不動，等使用者輸入新數字或離開欄位
    if (e.target.value.trim() === '') return;
    setPartySize(e.target.value);
  });
  $('party-size').addEventListener('blur', () => renderPartyControl());
  $('party-minus').addEventListener('click', () => setPartySize(state.partySize - 1));
  $('party-plus').addEventListener('click', () => setPartySize(state.partySize + 1));

  // 日期導覽
  $('day-nav').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-day]');
    if (btn) goToDay(btn.dataset.day);
  });
  $('day-prev').addEventListener('click', () => stepDay(-1));
  $('day-next').addEventListener('click', () => stepDay(1));
  
  const btnToday = $('btn-today');
  if (btnToday) {
    btnToday.addEventListener('click', () => {
      const now = new Date();
      const todayStamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const todayDay = tripDays.find(d => d.date === todayStamp);
      if (todayDay) goToDay(dayIndexOf(todayDay));
    });
  }

  // 搜尋
  $('search-input').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderSearch();
  });
  $('search-clear').addEventListener('click', () => {
    searchQuery = '';
    renderSearch();
    $('search-input').focus();
  });
  $('search-results').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-day]');
    if (btn) goToDay(btn.dataset.day);
  });

  // 類型篩選
  $('type-filters').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-type]');
    if (btn) toggleTypeFilter(btn.dataset.type);
  });

  // 行程內的緩衝與備註
  document.addEventListener('input', (e) => {
    const target = e.target;
    if (target.dataset && target.dataset.bufferEvent) {
      const id = target.dataset.bufferEvent;
      const raw = target.value.trim();
      if (raw === '') delete state.bufferEdits[id];
      else state.bufferEdits[id] = Math.max(0, Math.round(Number(raw) || 0));
      update();
      return;
    }
    if (target.dataset && target.dataset.noteEvent) {
      const id = target.dataset.noteEvent;
      const text = target.value;
      if (text.trim() === '') delete state.eventEdits[id];
      else state.eventEdits[id] = { ...(state.eventEdits[id] || {}), userNote: text };
      tripDays = applyEdits(SAMPLE_ITINERARY, state);
      scheduleSave();
      return;
    }
    if (target.dataset && target.dataset.budget) {
      const id = target.dataset.budget;
      const value = Math.max(0, Math.round(Number(target.value) || 0));
      state.budgetEdits[id] = value;
      const categories = mergeBudgetEdits(SAMPLE_BUDGET, state.budgetEdits);
      const totals = budgetTotals(categories, state.partySize);
      $('budget-total').textContent = formatCurrency(totals.perPerson);
      $('budget-group-total').textContent = formatCurrency(totals.group);
      scheduleSave();
      return;
    }
    if (target.dataset && target.dataset.lodgingDate) {
      const date = target.dataset.lodgingDate;
      const name = target.value;
      const prev = state.lodgingEdits[date] || {};
      state.lodgingEdits[date] = { ...prev, name };
      tripDays = applyEdits(SAMPLE_ITINERARY, state);
      scheduleSave();
    }
  });

  document.addEventListener('change', (e) => {
    const target = e.target;
    if (target.dataset && target.dataset.lodgingConfirm) {
      const date = target.dataset.lodgingConfirm;
      const prev = state.lodgingEdits[date] || {};
      state.lodgingEdits[date] = { ...prev, status: target.checked ? 'confirmed' : 'unconfirmed' };
      update();
    }
  });

  // 計畫：緩衝門檻
  const applyPolicy = () => {
    state.bufferPolicy = normalizeBufferPolicy({
      tightMinutes: Number($('buffer-tight').value),
      safeMinutes: Number($('buffer-safe').value),
    });
    update();
  };
  $('buffer-tight').addEventListener('input', applyPolicy);
  $('buffer-safe').addEventListener('input', applyPolicy);
  $('buffer-reset').addEventListener('click', () => {
    state.bufferPolicy = { tightMinutes: 15, safeMinutes: 30 };
    update();
    toast('緩衝標準回到預設 15 / 30 分鐘');
  });

  // 計畫／預算裡的跳轉
  document.addEventListener('click', (e) => {
    const jump = e.target.closest('.risk-row__jump, .overview-row, .cost-row__jump');
    if (jump && jump.dataset.day) goToDay(jump.dataset.day);
  });

  // 預算還原
  $('budget-reset').addEventListener('click', () => {
    state.budgetEdits = {};
    update();
    toast('預算已還原為範例金額');
  });

  // 隨身工具
  $('field-search').addEventListener('input', (e) => {
    fieldQuery = e.target.value;
    renderFieldKit();
  });
  $('field-search-clear').addEventListener('click', () => {
    fieldQuery = '';
    renderFieldKit();
    $('field-search').focus();
  });
  $('phrase-cats').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-phrase-cat]');
    if (!btn) return;
    activePhraseCat = btn.dataset.phraseCat;
    renderFieldKit();
  });
  $('phrase-list').addEventListener('click', (e) => {
    const copyBtn = e.target.closest('[data-copy]');
    if (copyBtn) {
      navigator.clipboard.writeText(copyBtn.dataset.copy).then(() => toast('已複製')).catch(() => toast('複製失敗'));
      return;
    }
    const speakBtn = e.target.closest('[data-speak]');
    if (speakBtn) {
      speak(speakBtn.dataset.speak);
      return;
    }
    const zoomBtn = e.target.closest('[data-zoom-ja]');
    if (zoomBtn) openCard({ ja: zoomBtn.dataset.zoomJa, zh: zoomBtn.dataset.zoomZh });
  });
  $('dest-cards').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-dest]');
    if (!btn) return;
    const dest = DESTINATION_CARDS.find((d) => d.id === btn.dataset.dest);
    if (dest) openCard({ ja: dest.nameJa, zh: dest.nameZh, address: dest.address, phone: dest.phone });
  });

  // 大字卡
  $('fullscreen-close').addEventListener('click', closeCard);
  $('fullscreen-card').addEventListener('click', (e) => {
    if (e.target.id === 'fullscreen-card') closeCard();
  });
  $('fc-ja').addEventListener('click', (e) => {
    const text = e.target.textContent;
    if (text) {
      navigator.clipboard.writeText(text).then(() => toast('已複製')).catch(() => toast('複製失敗'));
    }
  });

  // 匯出 / 匯入 / 分享 / 重置
  $('btn-export-json').addEventListener('click', doExportJSON);
  $('btn-export-ics').addEventListener('click', doExportICS);
  $('btn-share').addEventListener('click', doShare);
  $('btn-reset').addEventListener('click', doReset);
  $('btn-import-json').addEventListener('click', () => $('import-file').click());
  $('import-file').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) doImport(file);
    e.target.value = '';
  });

  // 鍵盤
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!$('fullscreen-card').hidden) {
        closeCard();
        return;
      }
      if (document.activeElement === $('search-input') && searchQuery) {
        searchQuery = '';
        renderSearch();
      }
      return;
    }
    if (!$('fullscreen-card').hidden && e.key === 'Tab') {
      // 對話框只有兩個可聚焦元素，直接圈住
      const focusables = [$('fullscreen-close'), $('fc-phone')].filter((n) => n && !n.hidden);
      const idx = focusables.indexOf(document.activeElement);
      e.preventDefault();
      const next = focusables[(idx + (e.shiftKey ? focusables.length - 1 : 1)) % focusables.length];
      next.focus();
      return;
    }
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '');
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    if (state.activeTab !== 'operate') return;
    if (e.key === 'ArrowLeft') {
      stepDay(-1);
    } else if (e.key === 'ArrowRight') {
      stepDay(1);
    }
  });

  // ── 左右 swipe 手勢切換天數 ──
  {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    const SWIPE_THRESHOLD = 50;
    const SWIPE_TIME_LIMIT = 400;
    const SWIPE_ANGLE_LIMIT = 30; // degrees from horizontal

    const mainContent = $('main-content');
    mainContent.addEventListener('touchstart', (e) => {
      if (state.activeTab !== 'operate') return;
      const touch = e.changedTouches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartTime = Date.now();
    }, { passive: true });

    mainContent.addEventListener('touchend', (e) => {
      if (state.activeTab !== 'operate') return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;
      const dt = Date.now() - touchStartTime;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (dt > SWIPE_TIME_LIMIT || absDx < SWIPE_THRESHOLD) return;
      // Check angle is mostly horizontal
      const angle = Math.atan2(absDy, absDx) * (180 / Math.PI);
      if (angle > SWIPE_ANGLE_LIMIT) return;

      if (dx < 0) stepDay(1);  // swipe left → next day
      else stepDay(-1);        // swipe right → prev day
    }, { passive: true });
  }

  // 離線狀態
  const syncOnline = () => {
    const offline = isOffline();
    $('offline-badge').hidden = !offline;
    document.body.classList.toggle('is-offline', offline);
  };
  window.addEventListener('online', syncOnline);
  window.addEventListener('offline', syncOnline);
  syncOnline();
}

/* ═══════════════════════════════════════════
   啟動
   ═══════════════════════════════════════════ */

function applyShareLink() {
  const hash = window.location.hash;
  if (!hash.startsWith('#s=')) return false;
  const shared = decodeShareState(hash.slice(3));
  if (!shared) return false;
  state = normalizeState(shared, state);
  history.replaceState(null, '', window.location.pathname + window.location.search);
  return true;
}

function init() {
  $('trip-daterange').textContent = TRIP_META.dateRange;

  const fromShare = applyShareLink();
  if (!fromShare && !hasSavedState()) {
    state.currentDay = resolveActiveDay(SAMPLE_ITINERARY, new Date()).dayNumber;
  }
  if (!tripDays.find((d) => dayIndexOf(d) === state.currentDay)) {
    state.currentDay = 1;
  }

  tripDays = applyEdits(SAMPLE_ITINERARY, state);
  wireEvents();
  render();

  if (fromShare) toast('已套用分享連結中的設定');

  if (speechSupported && typeof window.speechSynthesis.getVoices === 'function') {
    // 有些瀏覽器要等 voiceschanged 才拿得到日文語音
    window.speechSynthesis.getVoices();
  }

  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register(`${import.meta.env.BASE_URL}sw.js`)
        .catch(() => {
          /* 註冊失敗不影響使用，只是少了離線快取 */
        });
    });
  }
}

init();
