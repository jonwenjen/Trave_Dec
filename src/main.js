/**
 * Trave_Dec — 2307 志賀高原滑雪旅行
 * 全新重做：以知名旅遊網站設計語言與 2026 旅遊 UX 趨勢呈現
 * 包含：Hero 首屏、總覽、每日行程、朋友抵達方案、吃喝指南、滑雪全攻略、隨身工具、頁尾
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
  CONTINGENCY_PLAYBOOK,
  LIVE_DATA_SOURCES,
  FRIEND_ARRIVAL_OPTIONS,
  DINING_PLACES,
  GUIDE_CHAPTERS,
} from './data/itinerary.js';
import {
  loadState,
  saveState,
  resetState,
  getDefaultState,
  normalizeState,
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
  summarizeDay,
  computeDayBudget,
  eventCostPerPerson,
  mergeBudgetEdits,
  budgetTotals,
  collectTransferRisks,
  searchItinerary,
  applyEdits,
  exportTripJSON,
  importTripJSON,
  generateICS,
  buildShareURL,
  decodeShareState,
  computeArrivalOptionSummary,
  filterDiningPlaces,
  getDiningRegions,
  computeTripStats,
  formatGuideReadingTime,
} from './helpers.js';

/* ═════════════════════════════════════════════════════════════════
   狀態 (State)
   ═════════════════════════════════════════════════════════════════ */

let state = loadState();
let tripDays = applyEdits(SAMPLE_ITINERARY, state);
let currentDayIndex = 1;
let activeDiningCategory = 'all';
let activeDiningRegion = 'all';
let diningSearchQuery = '';
let itinerarySearchQuery = '';
let fieldSearchQuery = '';
let activePhraseCat = PHRASE_CATEGORIES[0].id;
let activeGuideChapterId = GUIDE_CHAPTERS[0].id;
let lastFocusedBeforeDialog = null;

const RISK_LABELS = {
  high: { label: '高風險', hint: '緩衝偏緊，錯過無替代班次' },
  medium: { label: '需留意', hint: '緩衝有限，建議先確認乘車處' },
  low: { label: '從容', hint: '緩衝充裕' },
  unknown: { label: '未估算', hint: '現場確認' },
};

const speechSupported =
  typeof window !== 'undefined' &&
  'speechSynthesis' in window &&
  typeof window.SpeechSynthesisUtterance === 'function';

/* ═════════════════════════════════════════════════════════════════
   小工具函式 (DOM & Utilities)
   ═════════════════════════════════════════════════════════════════ */

const $ = (id) => document.getElementById(id);

/** HTML 跳脫保護 */
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
  if (!node) return;
  node.textContent = message;
  node.classList.add('toast--visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('toast--visible'), 2800);
}

/** 檔案下載輔助 */
function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

let saveTimer = null;
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveState(state);
    renderStorageNote();
  }, 300);
}

function updateData() {
  tripDays = applyEdits(SAMPLE_ITINERARY, state);
}

/* ═════════════════════════════════════════════════════════════════
   主題管理 (Dark / Light Theme)
   ═════════════════════════════════════════════════════════════════ */

function initTheme() {
  const savedTheme = localStorage.getItem('trave_dec_theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const isDark = current === 'dark' || (!current && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const next = isDark ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  try {
    localStorage.setItem('trave_dec_theme', next);
  } catch {}
  toast(next === 'dark' ? '已切換為深色模式 🌙' : '已切換為暖紙淺色模式 ☀️');
}

/* ═════════════════════════════════════════════════════════════════
   渲染 1：頂部導航與人數控制
   ═════════════════════════════════════════════════════════════════ */

function renderTopNav() {
  const offlineBadge = $('offline-badge');
  if (offlineBadge) {
    offlineBadge.hidden = !isOffline();
  }

  const partyInput = $('party-size');
  if (partyInput) {
    partyInput.value = state.partySize;
  }

  const heroParty = $('hero-party-count');
  if (heroParty) {
    heroParty.textContent = state.partySize;
  }

  const arrivalParty = $('arrival-party-label');
  if (arrivalParty) {
    arrivalParty.textContent = state.partySize;
  }
}

function setPartySize(size) {
  const n = Math.max(1, Math.min(20, Math.round(Number(size) || 1)));
  if (state.partySize === n) return;
  state.partySize = n;
  scheduleSave();
  renderTopNav();
  renderOverview();
  renderItinerary();
  renderArrivalOptions();
}

/* ═════════════════════════════════════════════════════════════════
   渲染 2：全程總覽 (Overview & 關鍵數字)
   ═════════════════════════════════════════════════════════════════ */

function renderOverview() {
  const stats = computeTripStats(tripDays, state.partySize, SAMPLE_BUDGET);

  if ($('stat-total-days')) $('stat-total-days').textContent = stats.totalDays;
  if ($('stat-ski-days')) $('stat-ski-days').textContent = stats.skiDays;
  if ($('stat-party-size')) $('stat-party-size').textContent = stats.partySize;
  if ($('stat-budget-pp')) $('stat-budget-pp').textContent = formatCurrency(stats.budgetPerPerson);
  if ($('stat-budget-group')) $('stat-budget-group').textContent = formatCurrency(stats.budgetGroup);

  // 10 日橫向時間軸 (地圖條)
  const strip = $('days-strip');
  if (strip) {
    strip.innerHTML = tripDays
      .map((day) => {
        const isActive = day.dayNumber === currentDayIndex;
        return `
          <button type="button" class="strip-day-card ${isActive ? 'is-active' : ''}"
                  data-day="${day.dayNumber}" role="tab" aria-selected="${isActive}">
            <span class="strip-day-card__num">Day ${day.dayNumber}</span>
            <span class="strip-day-card__date">${formatShortDate(day.date)} (${day.weekday})</span>
            <span class="strip-day-card__title">${esc(day.title)}</span>
            <span class="strip-day-card__region">📍 ${esc(day.region)}</span>
          </button>
        `;
      })
      .join('');
  }

  // 預算詳細表格
  renderBudgetGrid();
}

function renderBudgetGrid() {
  const grid = $('budget-grid');
  if (!grid) return;

  const mergedBudget = mergeBudgetEdits(SAMPLE_BUDGET, state.budgetEdits);
  grid.innerHTML = mergedBudget
    .map((cat) => {
      return `
        <div class="budget-cat-card">
          <span class="budget-cat-card__label">${cat.icon} ${esc(cat.label)}</span>
          <div class="budget-cat-card__input-wrap">
            <span class="num">¥</span>
            <input type="number" class="budget-cat-card__input"
                   data-budget-id="${cat.id}"
                   value="${cat.estimatedYen}"
                   step="500" min="0" />
          </div>
        </div>
      `;
    })
    .join('');

  // 行程內項目費用對照
  const breakdownList = $('cost-breakdown');
  const costTotal = $('itinerary-cost-total');
  if (breakdownList && costTotal) {
    let total = 0;
    breakdownList.innerHTML = tripDays
      .map((day) => {
        const dayCost = computeDayBudget(day.events, state.partySize);
        total += dayCost;
        return `<li>Day ${day.dayNumber}（${formatShortDate(day.date)}）：${formatCurrency(dayCost)} / 人</li>`;
      })
      .join('');
    costTotal.textContent = `行程標註費用累計：${formatCurrency(total)} / 人（全團 ${formatCurrency(total * state.partySize)}）`;
  }
}

/* ═════════════════════════════════════════════════════════════════
   渲染 3：每日行程駕駛艙 (Itinerary)
   ═════════════════════════════════════════════════════════════════ */

function renderItinerary() {
  renderDayNav();
  renderTypeFilters();
  renderDayHero();
  renderTimeline();
  renderOperateCaveat();
}

function renderDayNav() {
  const nav = $('day-nav');
  if (!nav) return;

  nav.innerHTML = tripDays
    .map((day) => {
      const isActive = day.dayNumber === currentDayIndex;
      return `
        <button type="button" class="rail-day-btn ${isActive ? 'is-active' : ''}"
                data-day="${day.dayNumber}" role="tab" aria-selected="${isActive}">
          <span class="rail-day-btn__num">Day ${day.dayNumber}</span>
          <span class="rail-day-btn__date">${formatShortDate(day.date)}</span>
        </button>
      `;
    })
    .join('');

  const prevBtn = $('day-prev');
  const nextBtn = $('day-next');
  if (prevBtn) prevBtn.disabled = currentDayIndex <= 1;
  if (nextBtn) nextBtn.disabled = currentDayIndex >= tripDays.length;

  const todayBtn = $('btn-today');
  if (todayBtn) {
    const active = resolveActiveDay(tripDays, new Date());
    todayBtn.hidden = active.phase !== 'during';
  }
}

function renderTypeFilters() {
  const container = $('type-filters');
  if (!container) return;

  const types = Object.keys(EVENT_TYPE_LABELS);
  container.innerHTML = types
    .map((t) => {
      const meta = EVENT_TYPE_LABELS[t];
      const isSelected = state.typeFilters.includes(t);
      return `
        <button type="button" class="chip ${isSelected ? 'chip--active' : ''}"
                data-type="${t}" aria-pressed="${isSelected}">
          <span>${meta.icon}</span>
          <span>${meta.label}</span>
        </button>
      `;
    })
    .join('');
}

function renderDayHero() {
  const hero = $('day-hero');
  if (!hero) return;

  const day = tripDays.find((d) => d.dayNumber === currentDayIndex) || tripDays[0];
  if (!day) return;

  const dayCost = computeDayBudget(day.events, state.partySize);
  const lodgingConfirmed = day.lodgingStatus === 'confirmed';

  hero.innerHTML = `
    <div class="day-hero-card__meta">
      <span class="day-hero-card__badge">DAY ${day.dayNumber} · ${formatShortDate(day.date)} (${day.weekday})</span>
      <h3 class="day-hero-card__title">${esc(day.title)}</h3>
      <p class="day-hero-card__sub">${esc(day.subtitle || '')}</p>
    </div>
    <div class="day-hero-card__details">
      <span class="day-tag">📍 ${esc(day.region)}</span>
      <span class="day-tag" data-action="toggle-lodging" data-date="${day.date}" style="cursor: pointer;" title="點擊切換已確認/未確認狀態">
        🏨 ${esc(day.lodging || '未定')}
        <strong style="color: ${lodgingConfirmed ? 'var(--color-status-confirmed)' : 'var(--color-status-estimate)'}; margin-left: 4px;">
          ${lodgingConfirmed ? '✓ 已訂房' : '⚠️ 需確認'}
        </strong>
      </span>
      <span class="day-tag">
        💴 ${formatCurrency(dayCost)} / 人
        <small style="opacity: 0.75; margin-left: 4px;">(全團 ${formatCurrency(dayCost * state.partySize)})</small>
      </span>
    </div>
  `;
}

function renderTimeline() {
  const timeline = $('timeline');
  const emptyState = $('timeline-empty');
  if (!timeline) return;

  const day = tripDays.find((d) => d.dayNumber === currentDayIndex) || tripDays[0];
  if (!day) return;

  let events = sortEventsByTime(day.events);

  // 類型篩選
  if (state.typeFilters.length > 0) {
    events = events.filter((e) => state.typeFilters.includes(e.type));
  }

  if (events.length === 0) {
    timeline.innerHTML = '';
    if (emptyState) emptyState.hidden = false;
    return;
  }
  if (emptyState) emptyState.hidden = true;

  timeline.innerHTML = events
    .map((event) => {
      const typeMeta = EVENT_TYPE_LABELS[event.type] || { icon: '📌', label: '行動' };
      const statusLabel = STATUS_LABELS[event.status] || { label: '規劃估算' };
      const statusClass = `status-pill--${event.status || 'estimate'}`;
      
      const costPp = eventCostPerPerson(event, state.partySize);
      let costText = '';
      if (costPp > 0) {
        costText = `${formatCurrency(costPp)} / 人`;
        if (event.costTotal) {
          costText += ` <span class="event-card__cost-split">(全團 ${formatCurrency(event.costTotal)})</span>`;
        }
      }

      let riskHtml = '';
      if (event.riskLevel) {
        const riskMeta = RISK_LABELS[event.riskLevel] || RISK_LABELS.unknown;
        riskHtml = `<span class="risk-pill risk-pill--${event.riskLevel}" title="${esc(riskMeta.hint)}">${esc(riskMeta.label)}</span>`;
      }

      const noteContent = event.notes ? `<p>${esc(event.notes)}</p>` : '';
      const statusNote = event.statusNote ? `<p style="font-size: 0.8rem; color: var(--color-status-estimate); margin-top: 4px;">⚠️ ${esc(event.statusNote)}</p>` : '';
      const transferBuffer = event.transferBuffer ? `<p style="font-size: 0.82rem; color: var(--color-brand); margin-top: 4px;">⏱️ 轉乘緩衝：${esc(event.transferBuffer)}</p>` : '';
      const sourceLink = event.sourceUrl ? `
        <a href="${esc(event.sourceUrl)}" target="_blank" rel="noopener" class="event-card__source-link">
          🔗 來源：${esc(event.source || '官方資訊')}
        </a>
      ` : '';

      return `
        <li class="event-card" id="event-${event.id}">
          <div class="event-card__header">
            <div class="event-card__time-badge">
              <span class="event-card__type-icon" aria-hidden="true">${typeMeta.icon}</span>
              <span class="time">${esc(event.time || '')}${event.endTime ? ` – ${esc(event.endTime)}` : ''}</span>
            </div>
            <div class="event-card__pills">
              ${riskHtml}
              <span class="status-pill ${statusClass}">${esc(statusLabel.label)}</span>
            </div>
          </div>

          <h4 class="event-card__title">${esc(event.title)}</h4>
          ${event.titleJa ? `<p class="event-card__title-ja">${esc(event.titleJa)}</p>` : ''}
          ${costText ? `<p class="event-card__cost">${costText}</p>` : ''}

          <details class="event-card__details">
            <summary class="event-card__summary-btn">
              <span>詳細資訊與個人備忘</span>
              <span aria-hidden="true">▾</span>
            </summary>
            <div class="event-card__drawer">
              ${noteContent}
              ${transferBuffer}
              ${statusNote}
              ${sourceLink}
              <label style="display: block; margin-top: 10px;">
                <span style="font-size: 0.78rem; font-weight: 600; color: var(--color-text-subtle);">個人備忘</span>
                <input type="text" class="event-card__user-note-input"
                       data-event-id="${event.id}"
                       value="${esc(event.userNote || '')}"
                       placeholder="輸入你的個人提醒（自動保存於這台手機）..." />
              </label>
            </div>
          </details>
        </li>
      `;
    })
    .join('');
}

function renderOperateCaveat() {
  const caveat = $('operate-caveat');
  if (!caveat) return;
  caveat.innerHTML = `
    <strong>⚠️ 規劃估算說明</strong>：
    所有班次時刻、纜車票價與交通費用為 2026/09 擷取之公開估算值，非即時運行動態。出發前請向 JR、長電巴士與雪場官方查證。
  `;
}

/* ═════════════════════════════════════════════════════════════════
   渲染 4：12/15 朋友抵達方案 (Arrival Options 作戰板)
   ═════════════════════════════════════════════════════════════════ */

function renderArrivalOptions() {
  const container = $('plan-options');
  if (!container) return;

  container.innerHTML = FRIEND_ARRIVAL_OPTIONS
    .map((option) => {
      const summary = computeArrivalOptionSummary(option, state.partySize, '19:00');
      const isMet = summary.isMet;
      const isPlanA = option.id === 'plan-a';

      const legsHtml = (summary.legs || [])
        .map((leg) => {
          let legModeIcon = '🚌';
          if (leg.mode === 'train' || leg.mode === 'shinkansen') legModeIcon = '🚄';
          if (leg.mode === 'taxi') legModeIcon = '🚕';
          if (leg.mode === 'walk') legModeIcon = '🚶';

          const costStr = leg.costTotal
            ? `¥${leg.costTotal.toLocaleString()} 全團（每人約 ¥${Math.round(leg.costTotal / state.partySize).toLocaleString()}）`
            : leg.costYen
            ? `¥${leg.costYen.toLocaleString()} / 人`
            : '';

          return `
            <li class="arrival-leg-item">
              <span class="arrival-leg-item__icon">${legModeIcon}</span>
              <div>
                <strong>${esc(leg.name)}</strong>
                <span class="num" style="margin-left: 6px; font-size: 0.8rem; opacity: 0.85;">(${esc(leg.time || '')})</span>
                ${costStr ? `<div style="font-size: 0.78rem; color: var(--color-brand);">${costStr}</div>` : ''}
              </div>
            </li>
          `;
        })
        .join('');

      return `
        <div class="arrival-card ${isPlanA ? 'arrival-card--featured' : ''}" id="${option.id}">
          <div class="arrival-card__top">
            <span class="arrival-card__badge">${esc(option.badge || '替代方案')}</span>
            <span class="arrival-card__buffer-badge ${isMet ? 'arrival-card__buffer-badge--met' : 'arrival-card__buffer-badge--warn'}">
              ${summary.statusSymbol} ${esc(summary.formattedBuffer)}
            </span>
          </div>

          <h3 class="arrival-card__title">${esc(option.name)}</h3>
          
          <div class="arrival-card__time-info">
            <span>預估抵達：<strong class="time" style="font-size: 1.15rem; color: var(--color-brand);">${esc(option.estimatedArrival)}</strong></span>
            <span>總車程：<strong class="time">${esc(summary.formattedDuration)}</strong></span>
          </div>

          <div class="arrival-card__cost-row">
            <div>
              <span style="font-size: 0.78rem; color: var(--color-text-subtle);">每人交通分攤</span>
              <div class="arrival-card__cost-pp">${formatCurrency(summary.costPerPerson)}</div>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 0.78rem; color: var(--color-text-subtle);">全團 (${state.partySize} 人)</span>
              <div class="num" style="font-weight: 700;">${formatCurrency(summary.costGroup)}</div>
            </div>
          </div>

          <p style="font-size: 0.84rem; color: var(--color-text-secondary); margin-bottom: 10px;">
            ${esc(option.routeSummary)}
          </p>

          <details style="margin-top: auto; border-top: 1px solid var(--color-border-subtle); padding-top: 10px;">
            <summary style="font-size: 0.84rem; font-weight: 600; color: var(--color-brand); cursor: pointer;">
              查看詳細轉乘腿段（${option.legs.length} 段）
            </summary>
            <ul class="arrival-card__legs-list">
              ${legsHtml}
            </ul>
            <div style="font-size: 0.8rem; color: var(--color-text-subtle); margin-top: 8px;">
              <strong>優點</strong>：${esc(option.pros)}<br />
              <strong>缺點</strong>：${esc(option.cons)}
            </div>
          </details>
        </div>
      `;
    })
    .join('');
}

/* ═════════════════════════════════════════════════════════════════
   渲染 5：在地吃喝指南 (Dining)
   ═════════════════════════════════════════════════════════════════ */

function initDiningRegions() {
  const select = $('dining-region-select');
  if (!select) return;
  const regions = getDiningRegions(DINING_PLACES);
  select.innerHTML = '<option value="all">📍 全部區域</option>' +
    regions.map((r) => `<option value="${esc(r)}">${esc(r)}</option>`).join('');
}

function renderDiningList() {
  const container = $('dining-list');
  const countIndicator = $('dining-count');
  if (!container) return;

  const filtered = filterDiningPlaces(DINING_PLACES, {
    category: activeDiningCategory,
    region: activeDiningRegion,
    query: diningSearchQuery,
  });

  if (countIndicator) {
    countIndicator.textContent = `共找到 ${filtered.length} 間精選店家`;
  }

  container.innerHTML = filtered
    .map((place) => {
      const isEat = place.category === 'eat';
      return `
        <div class="dining-place-card" id="place-${place.id}">
          <div>
            <div class="dining-place-card__tags">
              <span class="dining-tag">${isEat ? '🍜 餐廳' : '🍺 酒吧'}</span>
              <span class="dining-tag">${esc(place.region)}</span>
              <span class="dining-tag">${esc(place.genre)}</span>
            </div>
            <h4 class="dining-place-card__title">${esc(place.name)}</h4>
            <p class="dining-place-card__title-ja">${esc(place.nameJa)}</p>
            <p class="dining-place-card__notes">${esc(place.notes)}</p>
          </div>

          <div class="dining-place-card__footer">
            ${place.sourceUrl ? `
              <a href="${esc(place.sourceUrl)}" target="_blank" rel="noopener" style="font-size: 0.78rem; color: var(--color-text-subtle);">
                🔗 ${esc(place.source || '官方')}
              </a>
            ` : '<span></span>'}
            <button type="button" class="dining-place-card__zoom-btn"
                    data-zoom-ja="${esc(place.nameJa)}"
                    data-zoom-zh="${esc(place.name)}"
                    data-zoom-address="${esc(place.address || '')}"
                    data-zoom-phone="${esc(place.phone || '')}">
              <span>⤢ 放大字卡</span>
            </button>
          </div>
        </div>
      `;
    })
    .join('');
}

/* ═════════════════════════════════════════════════════════════════
   渲染 6：志賀高原滑雪全攻略 (Editorial Guide)
   ═════════════════════════════════════════════════════════════════ */

function renderGuide() {
  const navContainer = $('guide-nav-bar');
  const articlesContainer = $('guide-articles');
  if (!navContainer || !articlesContainer) return;

  // 攻略導航列
  navContainer.innerHTML = GUIDE_CHAPTERS
    .map((ch) => {
      const isActive = ch.id === activeGuideChapterId;
      return `
        <button type="button" class="guide-nav-chip ${isActive ? 'is-active' : ''}"
                data-guide-target="${ch.id}">
          <span>${ch.icon}</span>
          <span>${esc(ch.title)}</span>
        </button>
      `;
    })
    .join('');

  // 6 大篇章
  articlesContainer.innerHTML = GUIDE_CHAPTERS
    .map((ch) => {
      const totalChars = ch.sections.reduce((sum, s) => sum + s.content.length, 0);
      const readTime = formatGuideReadingTime(totalChars);

      const sectionsHtml = ch.sections
        .map((sec) => {
          return `
            <article class="guide-section-block">
              <h4 class="guide-section-block__title">
                <span style="color: var(--color-brand);">✦</span>
                ${esc(sec.title)}
              </h4>
              <p class="guide-section-block__content">${esc(sec.content)}</p>
            </article>
          `;
        })
        .join('');

      return `
        <section class="guide-chapter" id="guide-chapter-${ch.id}" aria-labelledby="chapter-title-${ch.id}">
          <header class="guide-chapter__header">
            <div class="guide-chapter__topline">
              <span class="guide-chapter__icon" aria-hidden="true">${ch.icon}</span>
              <span class="guide-chapter__time">⏱️ ${readTime}</span>
            </div>
            <h3 class="guide-chapter__title" id="chapter-title-${ch.id}">${esc(ch.title)}</h3>
            <p class="guide-chapter__subtitle">${esc(ch.subtitle)}</p>
            <div class="guide-chapter__summary">
              <strong>章節導讀</strong>：${esc(ch.summary)}
            </div>
          </header>

          <div class="guide-sections-grid">
            ${sectionsHtml}
          </div>
        </section>
      `;
    })
    .join('');
}

/* ═════════════════════════════════════════════════════════════════
   渲染 7：隨身工具 (Field Kit)
   ═════════════════════════════════════════════════════════════════ */

function renderFieldKit() {
  renderDestCards();
  renderPhraseTabs();
  renderPhrases();
  renderEmergency();
  renderPlaybook();
  renderLiveStatus();
  renderStorageNote();
  renderOfficialLinks();
}

function renderDestCards() {
  const container = $('dest-cards');
  if (!container) return;

  const query = fieldSearchQuery.toLowerCase();
  const filtered = DESTINATION_CARDS.filter((card) => {
    if (!query) return true;
    return (
      card.nameZh.toLowerCase().includes(query) ||
      card.nameJa.toLowerCase().includes(query) ||
      (card.region && card.region.toLowerCase().includes(query))
    );
  });

  container.innerHTML = filtered
    .map((card) => {
      return `
        <div class="dest-card-item"
             data-card-ja="${esc(card.nameJa)}"
             data-card-zh="${esc(card.nameZh)}"
             data-card-address="${esc(card.address || '')}"
             data-card-phone="${esc(card.phone || '')}">
          <p class="dest-card-item__zh">${esc(card.nameZh)}</p>
          <p class="dest-card-item__ja">${esc(card.nameJa)}</p>
        </div>
      `;
    })
    .join('');
}

function renderPhraseTabs() {
  const container = $('phrase-cats');
  if (!container) return;

  container.innerHTML = PHRASE_CATEGORIES
    .map((cat) => {
      const isActive = cat.id === activePhraseCat;
      return `
        <button type="button" class="phrase-tab ${isActive ? 'is-active' : ''}"
                data-phrase-cat="${cat.id}">
          <span>${cat.icon}</span>
          <span>${esc(cat.label)}</span>
        </button>
      `;
    })
    .join('');
}

function renderPhrases() {
  const list = $('phrase-list');
  if (!list) return;

  const category = PHRASE_CATEGORIES.find((c) => c.id === activePhraseCat) || PHRASE_CATEGORIES[0];
  const query = fieldSearchQuery.toLowerCase();

  const phrases = category.phrases.filter((p) => {
    if (!query) return true;
    return (
      p.zh.toLowerCase().includes(query) ||
      p.ja.toLowerCase().includes(query) ||
      p.roma.toLowerCase().includes(query)
    );
  });

  list.innerHTML = phrases
    .map((p) => {
      return `
        <li class="phrase-item">
          <div class="phrase-item__text">
            <span class="phrase-item__zh">${esc(p.zh)}</span>
            <span class="phrase-item__ja">${esc(p.ja)}</span>
            <span class="phrase-item__roma">${esc(p.roma)}</span>
          </div>
          <button type="button" class="phrase-item__speak-btn"
                  data-speak-text="${esc(p.ja)}"
                  title="朗讀發音" aria-label="朗讀：${esc(p.ja)}">
            🔊
          </button>
        </li>
      `;
    })
    .join('');
}

function renderEmergency() {
  const list = $('emergency-list');
  if (!list) return;

  list.innerHTML = EMERGENCY_CONTACTS
    .map((c) => {
      const cleanTel = c.number.replace(/[^0-9+]/g, '');
      return `
        <div class="emergency-item-card">
          <span class="emergency-item-card__icon" aria-hidden="true">${c.icon}</span>
          <div>
            <p class="emergency-item-card__label">${esc(c.label)}</p>
            <a href="tel:${cleanTel}" class="emergency-item-card__phone">${esc(c.number)}</a>
          </div>
        </div>
      `;
    })
    .join('');
}

function renderPlaybook() {
  const container = $('playbook');
  if (!container) return;

  container.innerHTML = CONTINGENCY_PLAYBOOK
    .map((item) => {
      const actions = item.actions.map((a) => `<li>${esc(a)}</li>`).join('');
      return `
        <li class="playbook-item">
          <p class="playbook-item__trigger">⚡ 狀況：${esc(item.trigger)}</p>
          <ul class="playbook-item__actions">${actions}</ul>
        </li>
      `;
    })
    .join('');
}

function renderLiveStatus() {
  const container = $('live-status');
  if (!container) return;

  container.innerHTML = LIVE_DATA_SOURCES
    .map((s) => `<li class="live-status-pill">⚪ ${esc(s.label)}：離線靜態資料</li>`)
    .join('');
}

function renderStorageNote() {
  const note = $('storage-note');
  if (!note) return;
  const time = state.lastSaved ? new Date(state.lastSaved).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) : '未變更';
  note.textContent = `本機設定最後保存時間：${time}（本機離線保存）`;
}

function renderOfficialLinks() {
  const list = $('official-links');
  if (!list) return;

  list.innerHTML = OFFICIAL_LINKS
    .map((link) => `<li><a href="${esc(link.url)}" target="_blank" rel="noopener">↗ ${esc(link.label)}</a></li>`)
    .join('');
}

/* ═════════════════════════════════════════════════════════════════
   大字卡全螢幕彈窗 & 語音朗讀
   ═════════════════════════════════════════════════════════════════ */

function openCard({ ja, zh, address, phone }) {
  const card = $('fullscreen-card');
  if (!card) return;

  lastFocusedBeforeDialog = document.activeElement;
  $('fc-ja').textContent = ja || '';
  $('fc-zh').textContent = zh || '';
  $('fc-address').textContent = address || '';

  const phoneEl = $('fc-phone');
  if (phone) {
    phoneEl.textContent = `📞 ${phone}`;
    phoneEl.href = `tel:${phone.replace(/[^0-9+]/g, '')}`;
    phoneEl.hidden = false;
  } else {
    phoneEl.hidden = true;
  }

  card.hidden = false;
  document.body.classList.add('modal-open');
  const closeBtn = $('fullscreen-close');
  if (closeBtn) closeBtn.focus();
}

function closeCard() {
  const card = $('fullscreen-card');
  if (!card || card.hidden) return;
  card.hidden = true;
  document.body.classList.remove('modal-open');
  if (lastFocusedBeforeDialog && typeof lastFocusedBeforeDialog.focus === 'function') {
    lastFocusedBeforeDialog.focus();
  }
}

function speak(text) {
  if (!speechSupported) {
    toast('這台裝置的瀏覽器不支援語音合成');
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP';
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  } catch {
    toast('語音播放失敗');
  }
}

/* ═════════════════════════════════════════════════════════════════
   資料備份與分享 (Export / Import / Share)
   ═════════════════════════════════════════════════════════════════ */

function doExportICS() {
  const ics = generateICS(TRIP_META, tripDays);
  download('shiga-kogen-2026.ics', ics, 'text/calendar;charset=utf-8');
  toast('已下載 .ics 行事曆檔案');
}

function doExportJSON() {
  const json = exportTripJSON(TRIP_META, tripDays, SAMPLE_BUDGET, state.partySize);
  download('trave_dec_backup.json', json, 'application/json');
  toast('已匯出 JSON 備份檔');
}

function doImport(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = importTripJSON(e.target.result);
      state.partySize = parsed.partySize || state.partySize;
      state = normalizeState(state);
      updateData();
      scheduleSave();
      renderAll();
      toast('成功匯入行程設定！');
    } catch (err) {
      toast('匯入失敗：' + (err.message || '檔案格式錯誤'));
    }
  };
  reader.readAsText(file);
}

function doShare() {
  const url = buildShareURL(window.location.href, {
    partySize: state.partySize,
    day: currentDayIndex,
  });
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url)
      .then(() => toast('已複製分享連結至剪貼簿！'))
      .catch(() => toast(url));
  } else {
    toast('分享連結：' + url);
  }
}

function doReset() {
  if (!window.confirm('確定要清除所有本機修改，還原成範例行程嗎？')) return;
  resetState();
  state = getDefaultState();
  updateData();
  renderAll();
  toast('已還原為初始範例設定');
}

/* ═════════════════════════════════════════════════════════════════
   事件綁定 (Event Listeners)
   ═════════════════════════════════════════════════════════════════ */

function wireEvents() {
  // 主題切換
  $('theme-toggle')?.addEventListener('click', toggleTheme);

  // 人數調整按鈕
  $('party-minus')?.addEventListener('click', () => setPartySize(state.partySize - 1));
  $('party-plus')?.addEventListener('click', () => setPartySize(state.partySize + 1));
  $('party-size')?.addEventListener('change', (e) => setPartySize(e.target.value));

  // 總覽 10 日橫向時間軸點擊切換
  $('days-strip')?.addEventListener('click', (e) => {
    const card = e.target.closest('[data-day]');
    if (!card) return;
    const day = Number(card.dataset.day);
    currentDayIndex = day;
    renderOverview();
    renderItinerary();
    const itSection = $('itinerary');
    if (itSection) {
      itSection.scrollIntoView({ behavior: 'smooth' });
    }
  });

  // 日期軌道前一天/後一天/點擊換日
  $('day-prev')?.addEventListener('click', () => {
    if (currentDayIndex > 1) {
      currentDayIndex -= 1;
      renderOverview();
      renderItinerary();
    }
  });

  $('day-next')?.addEventListener('click', () => {
    if (currentDayIndex < tripDays.length) {
      currentDayIndex += 1;
      renderOverview();
      renderItinerary();
    }
  });

  $('btn-today')?.addEventListener('click', () => {
    const active = resolveActiveDay(tripDays, new Date());
    currentDayIndex = active.dayNumber;
    renderOverview();
    renderItinerary();
  });

  $('day-nav')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-day]');
    if (!btn) return;
    currentDayIndex = Number(btn.dataset.day);
    renderOverview();
    renderItinerary();
  });

  // 篩選行程類型
  $('type-filters')?.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-type]');
    if (!chip) return;
    const type = chip.dataset.type;
    const idx = state.typeFilters.indexOf(type);
    if (idx >= 0) {
      state.typeFilters.splice(idx, 1);
    } else {
      state.typeFilters.push(type);
    }
    renderTypeFilters();
    renderTimeline();
    scheduleSave();
  });

  // 行程全域搜尋
  $('search-input')?.addEventListener('input', (e) => {
    itinerarySearchQuery = e.target.value.trim();
    $('search-clear').hidden = !itinerarySearchQuery;
    const resultsPanel = $('search-results');
    if (!itinerarySearchQuery) {
      resultsPanel.hidden = true;
      return;
    }
    const matched = searchItinerary(tripDays, itinerarySearchQuery);
    resultsPanel.hidden = false;
    if (matched.length === 0) {
      resultsPanel.innerHTML = '<p style="color: var(--color-text-subtle);">未找到相關行程</p>';
      return;
    }
    resultsPanel.innerHTML = `
      <p style="font-weight: 700; margin-bottom: 8px;">搜尋結果（${matched.length} 天有符合）：</p>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${matched.map((m) => `
          <div style="cursor: pointer; padding: 6px 10px; background: var(--color-bg-paper); border-radius: var(--radius-btn);"
               data-jump-day="${m.dayNumber}">
            <strong>Day ${m.dayNumber}（${formatShortDate(m.date)}）</strong>：${esc(m.title)}
            <span style="font-size: 0.8rem; color: var(--color-brand); margin-left: 6px;">（${m.events.length} 項符合，點擊切換）</span>
          </div>
        `).join('')}
      </div>
    `;
  });

  $('search-clear')?.addEventListener('click', () => {
    $('search-input').value = '';
    itinerarySearchQuery = '';
    $('search-clear').hidden = true;
    $('search-results').hidden = true;
  });

  $('search-results')?.addEventListener('click', (e) => {
    const item = e.target.closest('[data-jump-day]');
    if (!item) return;
    currentDayIndex = Number(item.dataset.jumpDay);
    $('search-results').hidden = true;
    renderOverview();
    renderItinerary();
  });

  // 住宿確認切換
  $('day-hero')?.addEventListener('click', (e) => {
    const toggle = e.target.closest('[data-action="toggle-lodging"]');
    if (!toggle) return;
    const date = toggle.dataset.date;
    const day = tripDays.find((d) => d.date === date);
    if (!day) return;
    const nextStatus = day.lodgingStatus === 'confirmed' ? 'unconfirmed' : 'confirmed';
    state.lodgingEdits[date] = { name: day.lodging, status: nextStatus };
    updateData();
    renderDayHero();
    scheduleSave();
    toast(`已更新住宿狀態為：${nextStatus === 'confirmed' ? '已確認' : '未確認'}`);
  });

  // 個人備忘輸入
  $('timeline')?.addEventListener('input', (e) => {
    const input = e.target.closest('.event-card__user-note-input');
    if (!input) return;
    const eventId = input.dataset.eventId;
    state.eventEdits[eventId] = { userNote: input.value };
    scheduleSave();
  });

  // 預算編輯輸入
  $('budget-grid')?.addEventListener('change', (e) => {
    const input = e.target.closest('.budget-cat-card__input');
    if (!input) return;
    const catId = input.dataset.budgetId;
    const value = Math.max(0, Number(input.value) || 0);
    state.budgetEdits[catId] = value;
    scheduleSave();
    renderOverview();
  });

  $('budget-reset')?.addEventListener('click', () => {
    state.budgetEdits = {};
    scheduleSave();
    renderOverview();
    toast('預算已重設為預估金額');
  });

  // 吃喝分類 Tab 切換
  $('dining-cat-filters')?.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-dining-cat]');
    if (!tab) return;
    activeDiningCategory = tab.dataset.diningCat;
    document.querySelectorAll('.cat-tab').forEach((t) => {
      const isSel = t.dataset.diningCat === activeDiningCategory;
      t.classList.toggle('cat-tab--active', isSel);
      t.setAttribute('aria-pressed', isSel);
    });
    renderDiningList();
  });

  // 吃喝區域篩選
  $('dining-region-select')?.addEventListener('change', (e) => {
    activeDiningRegion = e.target.value;
    renderDiningList();
  });

  // 吃喝關鍵字搜尋
  $('dining-search-input')?.addEventListener('input', (e) => {
    diningSearchQuery = e.target.value;
    $('dining-search-clear').hidden = !diningSearchQuery;
    renderDiningList();
  });

  $('dining-search-clear')?.addEventListener('click', () => {
    $('dining-search-input').value = '';
    diningSearchQuery = '';
    $('dining-search-clear').hidden = true;
    renderDiningList();
  });

  // 吃喝字卡放大按鈕
  $('dining-list')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-zoom-ja]');
    if (!btn) return;
    openCard({
      ja: btn.dataset.zoomJa,
      zh: btn.dataset.zoomZh,
      address: btn.dataset.zoomAddress,
      phone: btn.dataset.zoomPhone,
    });
  });

  // 攻略導航列點擊錨點平滑滾動
  $('guide-nav-bar')?.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-guide-target]');
    if (!chip) return;
    const targetId = chip.dataset.guideTarget;
    activeGuideChapterId = targetId;
    document.querySelectorAll('.guide-nav-chip').forEach((c) => {
      c.classList.toggle('is-active', c.dataset.guideTarget === targetId);
    });
    const targetChapter = $(`guide-chapter-${targetId}`);
    if (targetChapter) {
      targetChapter.scrollIntoView({ behavior: 'smooth' });
    }
  });

  // 隨身工具搜尋
  $('field-search')?.addEventListener('input', (e) => {
    fieldSearchQuery = e.target.value;
    $('field-search-clear').hidden = !fieldSearchQuery;
    renderDestCards();
    renderPhrases();
  });

  $('field-search-clear')?.addEventListener('click', () => {
    $('field-search').value = '';
    fieldSearchQuery = '';
    $('field-search-clear').hidden = true;
    renderDestCards();
    renderPhrases();
  });

  // 日文大字卡點擊放大
  $('dest-cards')?.addEventListener('click', (e) => {
    const item = e.target.closest('[data-card-ja]');
    if (!item) return;
    openCard({
      ja: item.dataset.cardJa,
      zh: item.dataset.cardZh,
      address: item.dataset.cardAddress,
      phone: item.dataset.cardPhone,
    });
  });

  // 情境短句分類切換
  $('phrase-cats')?.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-phrase-cat]');
    if (!tab) return;
    activePhraseCat = tab.dataset.phraseCat;
    renderPhraseTabs();
    renderPhrases();
  });

  // 情境短句語音朗讀
  $('phrase-list')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-speak-text]');
    if (!btn) return;
    speak(btn.dataset.speakText);
  });

  // 全螢幕彈窗關閉
  $('fullscreen-close')?.addEventListener('click', closeCard);
  $('fullscreen-backdrop')?.addEventListener('click', closeCard);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCard();
  });

  // 點擊複製大字卡日文
  $('fc-ja')?.addEventListener('click', (e) => {
    const text = e.target.textContent;
    if (text && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => toast('已複製日文店名：' + text));
    }
  });

  // 資料備份與分享按鈕
  $('btn-export-ics')?.addEventListener('click', doExportICS);
  $('btn-export-json')?.addEventListener('click', doExportJSON);
  $('btn-share')?.addEventListener('click', doShare);
  $('btn-reset')?.addEventListener('click', doReset);

  $('btn-import-json')?.addEventListener('click', () => {
    $('import-file')?.click();
  });

  $('import-file')?.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) doImport(file);
    e.target.value = '';
  });

  // 網路狀態變化
  window.addEventListener('online', () => {
    renderTopNav();
    toast('已恢復網路連線');
  });

  window.addEventListener('offline', () => {
    renderTopNav();
    toast('已切換為離線模式');
  });

  // 滾動監聽：自動標註導航列高亮
  setupScrollSpy();
}

/** 滾動監聽標註當前章節導航 */
function setupScrollSpy() {
  const sections = ['overview', 'itinerary', 'arrival', 'dining', 'guide', 'tools'];
  const navLinks = document.querySelectorAll('.top-nav__link');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach((link) => {
            link.classList.toggle('is-active', link.dataset.navTarget === id);
          });
        }
      });
    },
    {
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0,
    }
  );

  sections.forEach((id) => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });
}

function applyShareHash() {
  if (typeof window === 'undefined') return;
  const hash = window.location.hash || '';
  if (hash.startsWith('#s=')) {
    const decoded = decodeShareState(hash.slice(3));
    if (decoded) {
      if (decoded.partySize) state.partySize = decoded.partySize;
      if (decoded.day) currentDayIndex = decoded.day;
      state = normalizeState(state);
      updateData();
      toast('已載入分享連結的團員設定！');
    }
  }
}

/* ═════════════════════════════════════════════════════════════════
   主初始化 (Init)
   ═════════════════════════════════════════════════════════════════ */

function renderAll() {
  renderTopNav();
  renderOverview();
  renderItinerary();
  renderArrivalOptions();
  renderDiningList();
  renderGuide();
  renderFieldKit();
}

function init() {
  initTheme();
  applyShareHash();

  // 若在行程期間，自動切換至今日
  const activeDay = resolveActiveDay(tripDays, new Date());
  if (activeDay.phase === 'during') {
    currentDayIndex = activeDay.dayNumber;
  }

  initDiningRegions();
  renderAll();
  wireEvents();

  // 註冊 Service Worker (離線支援)
  if ('serviceWorker' in navigator && import.meta.env && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }
}

// 啟動應用
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
