/**
 * Trave_Dec — 2025 潛水法規專區 + 六案重評（UI 層）
 *
 * 數字全部來自 src/data/krabi-plans-v2.js 與 src/data/krabi-regulations.js，
 * 這裡只負責排版與互動。費用試算與人數連動既有甲米區塊共用。
 */

import {
  KRABI_PLANS_V2,
  MARINE_AREAS,
  EXCLUDED_AREAS,
  SIX_PLAN_AXES,
  PLAN_LEGAL_NOTES,
  planMarineAreaIds,
  planCoversSimilan,
  planCoversEmeraldCave,
  planSeaDayCountV2,
  planParkFeeTotalV2,
  planScoreTotal,
  planFreediveScore,
  planLegalBurden,
  planRequiresLandTransfer,
  planRequiresFerry,
  comparePlanV2,
  checkPlanCompliance,
  estimateGroupTotalTwdV2,
} from './krabi-helpers.js';
import {
  THAILAND_SNORKEL_RULES,
  CORAL_PROHIBITIONS,
  PHOTO_RULE,
  AIDA_EXEMPTION,
  COMPLIANCE_CHECKLIST,
} from './data/krabi-regulations.js';

const SEVERITY_LABEL = { critical: '必須遵守', warn: '容易踩雷', info: '注意事項' };
const CHECKLIST_KEY = 'trave_dec_compliance_v2';

const DECISIONS = [
  { priority: '水要最清', plan: '方案 1 或 5', note: '兩者都含 Similan；方案 5 另加翡翠洞。' },
  { priority: '要最秘境、人最少', plan: '方案 2 或 6', note: '兩者都在 Trang，遊覽船團不去的地方。' },
  { priority: '想加自由潛水', plan: '方案 3（蘭塔）', note: '唯一能配合導潛並反覆練習的基地。' },
  { priority: '要涵蓋最多', plan: '方案 4', note: '但要有心理準備每天在移動。' },
  { priority: '最平衡', plan: '方案 5', note: '能見度、秘境、不趕路三者兼顧。' },
  { priority: '最省錢最不累', plan: '方案 6', note: '零移動，全程住 Trang。' },
];

export function createKrabiRulesSection({ getEl, esc, getTravelers }) {
  const el = (id) => getEl(id);
  let openPlans = new Set();
  let activeAxis = SIX_PLAN_AXES[0].key;
  let checked = loadChecklist();

  function loadChecklist() {
    try {
      const raw = localStorage.getItem(CHECKLIST_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  }
  function saveChecklist() {
    try {
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify([...checked]));
    } catch {
      /* 隱私模式下無法儲存，不影響使用 */
    }
  }

  /* ═══ 法規專區 ═══ */

  function renderRuleHeader() {
    const host = el('rule-header');
    if (!host) return;
    const r = THAILAND_SNORKEL_RULES;
    host.innerHTML = `
      <dl class="rule-meta">
        <div><dt>發布單位</dt><dd>${esc(r.authority)}</dd></div>
        <div><dt>公布方式</dt><dd>${esc(r.gazette)}</dd></div>
        <div><dt>生效日</dt><dd class="rule-meta__date">${esc(r.effectiveDate)}</dd></div>
        <div><dt>法律依據</dt><dd>${esc(r.legalBasis)}</dd></div>
        <div><dt>效期</dt><dd>${esc(r.duration)}</dd></div>
        <div><dt>適用範圍</dt><dd>${esc(r.scope)}</dd></div>
      </dl>
      <p class="rule-operator">${esc(r.operatorMust)}</p>
      <div class="rule-sources">
        <a class="rule-source" href="${esc(r.sourceUrl)}" target="_blank" rel="noopener noreferrer">TAT 官方說明 ↗</a>
        <a class="rule-source" href="${esc(r.clauseSourceUrl)}" target="_blank" rel="noopener noreferrer">條文整理 ↗</a>
      </div>`;
  }

  function renderRuleClauses() {
    const host = el('rule-clauses');
    if (!host) return;
    host.innerHTML = THAILAND_SNORKEL_RULES.clauses
      .map(
        (c) => `
      <article class="rule-clause rule-clause--${esc(c.severity)}">
        <div class="rule-clause__head">
          <h3 class="rule-clause__title">${esc(c.title)}</h3>
          <span class="rule-clause__severity">${esc(SEVERITY_LABEL[c.severity] || '')}</span>
        </div>
        <p class="rule-clause__summary">${esc(c.summary)}</p>
        <p class="rule-clause__detail">${esc(c.detail)}</p>
      </article>`,
      )
      .join('');
  }

  function renderCoralDefinition() {
    const node = el('rule-coral-definition');
    if (node) node.textContent = THAILAND_SNORKEL_RULES.coralAreaDefinition;
  }

  function renderProhibitions() {
    const host = el('rule-prohibitions');
    if (!host) return;
    host.innerHTML = CORAL_PROHIBITIONS.map(
      (p) => `
      <div class="rule-prohibition">
        <span class="rule-prohibition__icon" aria-hidden="true">🚫</span>
        <div>
          <p class="rule-prohibition__action">${esc(p.action)}</p>
          ${p.consequence ? `<p class="rule-prohibition__why">${esc(p.consequence)}</p>` : ''}
        </div>
      </div>`,
    ).join('');
  }

  function renderAidaCompare() {
    const host = el('aida-compare');
    if (!host) return;
    const a = AIDA_EXEMPTION;
    const card = (key, data, cls) => `
      <article class="aida-card ${cls}">
        <div class="aida-card__head">
          <h4 class="aida-card__name">${esc(data.name)}</h4>
          <span class="aida-card__badge">${data.isFullCertification ? '完整認證' : '入門體驗'}</span>
        </div>
        <dl class="aida-card__list">
          <div><dt>天數</dt><dd>${esc(data.duration)}</dd></div>
          <div><dt>水下時間</dt><dd>${esc(data.waterSessions)}</dd></div>
          <div><dt>最大深度</dt><dd>${esc(data.maxDepth)}</dd></div>
          <div><dt>先備條件</dt><dd>${esc(data.prerequisite)}</dd></div>
          <div><dt>產出</dt><dd>${esc(data.output)}</dd></div>
        </dl>
        <p class="aida-card__note">${esc(data.note)}</p>
      </article>`;

    host.innerHTML =
      `<p class="aida-lead">${esc(a.legalPoint)}</p>
       <div class="aida-cards">
         ${card('aida1', a.aida1, 'aida-card--intro')}
         ${card('aida2', a.aida2, 'aida-card--full')}
       </div>
       <div class="aida-notes">
         <div class="aida-note">
           <h5 class="aida-note__title">技術上本來就不穿</h5>
           <p>${esc(a.technicalNote)}</p>
         </div>
         <div class="aida-note">
           <h5 class="aida-note__title">實務流程</h5>
           <p>${esc(a.practicalPattern)}</p>
         </div>
         <div class="aida-note aida-note--warn">
           <h5 class="aida-note__title">豁免不等於免責</h5>
           <p>${esc(a.remainingObligations)}</p>
         </div>
       </div>`;
  }

  function renderPhotoRule() {
    const host = el('photo-rule');
    if (!host) return;
    const p = PHOTO_RULE;
    host.innerHTML = `
      <div class="photo-rule__gate">
        <span class="photo-rule__label">需要</span>
        <p class="photo-rule__gate-text">${esc(p.requiredCertification)}</p>
      </div>
      <ul class="photo-rule__list">${p.rules.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
      <p class="photo-rule__note">${esc(p.appliesToFreediving)}</p>
      <div class="photo-rule__alt">
        <h5 class="photo-rule__alt-title">替代方案</h5>
        <ul>${p.altPaths.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
      </div>
      <p class="photo-rule__why">${esc(p.note)}</p>`;
  }

  /* ═══ 海洋區 ═══ */

  function renderAreaTable() {
    const body = el('area-table-body');
    if (!body) return;
    body.innerHTML = MARINE_AREAS.map(
      (a) => `
      <tr>
        <th scope="row" class="area-table__name">${esc(a.zh)}<span>${esc(a.name)}</span></th>
        <td class="area-table__authority">${esc(a.authority)}</td>
        <td>${esc(a.boatTime)}</td>
        <td class="${a.season.includes('僅') ? 'area-table__season--limited' : ''}">${esc(a.season)}</td>
        <td class="area-table__fee">฿${a.parkFee}</td>
        <td class="area-table__char">${esc(a.character)}</td>
      </tr>`,
    ).join('');

    const ex = el('excluded-areas');
    if (ex) {
      ex.innerHTML =
        '<h4 class="excluded-areas__title">評估後排除的點位</h4>' +
        EXCLUDED_AREAS.map(
          (a) => `
        <div class="excluded-area">
          <span class="excluded-area__name">${esc(a.name)}</span>
          <p class="excluded-area__reason">${esc(a.reason)}</p>
        </div>`,
        ).join('');
    }
  }

  /* ═══ 六案 ═══ */

  function renderPlans6Calc() {
    const travelers = getTravelers();
    const note = el('plans6-calc-note');
    if (note) {
      note.textContent = `前季參考團費（不含機票）換算為新台幣，${travelers} 人分攤。匯率為規劃用假設，非即時報價。`;
    }
    const grid = el('plans6-cost-grid');
    if (!grid) return;
    grid.innerHTML = KRABI_PLANS_V2.map((plan) => {
      const g = estimateGroupTotalTwdV2(plan, travelers, { includeFlight: false });
      return `
      <div class="krabi-cost${plan.tag === '5' ? ' krabi-cost--reco' : ''}">
        ${plan.tag === '5' ? '<span class="krabi-cost__flag">推薦</span>' : ''}
        <span class="krabi-cost__tag">${esc(plan.tag)}</span>
        <span class="krabi-cost__name">${esc(plan.name)}</span>
        <span class="krabi-cost__value">NT$${g.perPerson.min.toLocaleString('en-US')}–${g.perPerson.max.toLocaleString('en-US')}</span>
        <span class="krabi-cost__group">公園費 ฿${planParkFeeTotalV2(plan).toLocaleString('en-US')}・全團 ${g.travelers} 人 NT$${g.max.toLocaleString('en-US')}</span>
      </div>`;
    }).join('');
  }

  function renderPlans6() {
    const host = el('plans6-list');
    if (!host) return;

    host.innerHTML = KRABI_PLANS_V2.map((plan) => {
      const isOpen = openPlans.has(plan.id);
      const score = planScoreTotal(plan);
      const areas = planMarineAreaIds(plan);
      const badges = [];
      if (planCoversSimilan(plan)) badges.push('<span class="plan6-badge plan6-badge--similan">含 Similan</span>');
      if (planCoversEmeraldCave(plan)) badges.push('<span class="plan6-badge plan6-badge--cave">含翡翠洞</span>');
      if (planRequiresFerry(plan)) badges.push('<span class="plan6-badge">需渡輪</span>');
      if (planRequiresLandTransfer(plan)) badges.push('<span class="plan6-badge">需陸路</span>');
      if (plan.tag === '5') badges.push('<span class="plan6-badge plan6-badge--reco">推薦</span>');

      const days = plan.days
        .map((d) => {
          const chips = [];
          if (d.seaDay && !d.isBuffer) chips.push('<span class="krabi-plan__chip krabi-plan__chip--sea">出海</span>');
          if (d.isBuffer) chips.push('<span class="krabi-plan__chip krabi-plan__chip--buffer">緩衝日</span>');
          if (d.transport) chips.push(`<span class="krabi-plan__chip">${esc(d.transport)}</span>`);
          if (d.costTHB) chips.push(`<span class="krabi-plan__chip">฿${d.costTHB.toLocaleString('en-US')}</span>`);
          if (d.parkFeeTHB) chips.push(`<span class="krabi-plan__chip">公園費 ฿${d.parkFeeTHB}</span>`);
          if (d.costNote) chips.push(`<span class="krabi-plan__chip">${esc(d.costNote)}</span>`);
          return `
          <div class="krabi-plan__day">
            <div class="krabi-plan__day-head">
              <span class="krabi-plan__day-no">D${d.day}</span>
              <span class="krabi-plan__day-title">${esc(d.title)}</span>
            </div>
            <p class="krabi-plan__day-detail">${esc(d.detail)}</p>
            <div class="krabi-plan__day-meta">${chips.join('')}</div>
          </div>`;
        })
        .join('');

      const compliance = checkPlanCompliance(plan);
      const sources = plan.sources
        .map((s) => `<a class="krabi-plan__source" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.label)} ↗</a>`)
        .join('');

      return `
      <article class="krabi-plan plan6${plan.tag === '5' ? ' plan6--reco' : ''}" data-plan6-id="${esc(plan.id)}">
        <div class="plan6__head">
          <div class="plan6__badges">
            <span class="krabi-plan__tag">${esc(plan.tag)}</span>
            ${badges.join('')}
            <span class="plan6__score" title="綜合評分（八軸平均）">${score.total}<small>/100</small></span>
          </div>
          <h3 class="krabi-plan__name">${esc(plan.name)}</h3>
          <p class="krabi-plan__positioning">${esc(plan.positioning)}</p>
        </div>

        <div class="plan6__areas">
          <span class="plan6__areas-label">涵蓋海域</span>
          <ul>${areas.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
        </div>

        <div class="krabi-plan__stats">
          <div class="krabi-plan__stat"><span class="krabi-plan__stat-label">海上天數</span><span class="krabi-plan__stat-value">${planSeaDayCountV2(plan)} 天</span></div>
          <div class="krabi-plan__stat"><span class="krabi-plan__stat-label">浮潛點</span><span class="krabi-plan__stat-value">${plan.snorkelStops} 點</span></div>
          <div class="krabi-plan__stat"><span class="krabi-plan__stat-label">公園費</span><span class="krabi-plan__stat-value">฿${planParkFeeTotalV2(plan).toLocaleString('en-US')}</span></div>
          <div class="krabi-plan__stat"><span class="krabi-plan__stat-label">自由潛水</span><span class="krabi-plan__stat-value">${planFreediveScore(plan)} / 5</span></div>
          <div class="krabi-plan__stat"><span class="krabi-plan__stat-label">法規負擔</span><span class="krabi-plan__stat-value">${planLegalBurden(plan)} / 5</span></div>
          <div class="krabi-plan__stat"><span class="krabi-plan__stat-label">基地</span><span class="krabi-plan__stat-value">${esc(plan.base)}</span></div>
        </div>

        <p class="krabi-plan__highlight">${esc(plan.highlight)}</p>
        <p class="krabi-plan__suits">適合：${esc(plan.suits)}</p>
        <p class="plan6__legal"><strong>法規注意：</strong>${esc(PLAN_LEGAL_NOTES[plan.id] || '須確認所屬公園的額外規定。')}</p>

        <button type="button" class="krabi-plan__toggle" data-plan6-toggle="${esc(plan.id)}"
                aria-expanded="${isOpen}" aria-controls="plan6-days-${esc(plan.id)}">
          <span aria-hidden="true">${isOpen ? '▾' : '▸'}</span>
          ${isOpen ? '收合 7 日行程' : '展開 7 日行程'}
        </button>

        <div class="krabi-plan__days${isOpen ? ' is-open' : ''}" id="plan6-days-${esc(plan.id)}"${isOpen ? '' : ' hidden'}>
          ${days}
        </div>

        <div class="plan6__compliance">
          <span class="plan6__compliance-label">本方案法規檢查（${compliance.items.length} 項）</span>
          <ul>${compliance.items.map((i) => `<li><strong>${esc(i.phase)}</strong>：${esc(i.label)}</li>`).join('')}</ul>
        </div>

        <div class="krabi-plan__foot">${sources}</div>
      </article>`;
    }).join('');
  }

  function renderPlans6AxisTabs() {
    const host = el('plans6-axis-tabs');
    if (!host) return;
    host.innerHTML = SIX_PLAN_AXES.map(
      (a) => `
      <button type="button" class="krabi-axis-tab" role="tab" data-plan6-axis="${esc(a.key)}"
              aria-selected="${a.key === activeAxis}">${esc(a.label)}</button>`,
    ).join('');
  }

  function renderPlans6Compare() {
    const host = el('plans6-compare-body');
    if (!host) return;
    const matrix = comparePlanV2(KRABI_PLANS_V2, SIX_PLAN_AXES);

    const head = `<tr><th scope="col">比較軸</th>${KRABI_PLANS_V2.map((p) => `<th scope="col">${esc(p.tag)}・${esc(p.name)}</th>`).join('')}</tr>`;

    const body = matrix
      .map((row) => {
        const byTag = new Map(row.values.map((v) => [v.tag, v]));
        const cells = KRABI_PLANS_V2.map((p) => {
          const v = byTag.get(p.tag);
          const isBest = row.best === p.tag;
          const active = row.key === activeAxis ? ' krabi-table__val--active' : '';
          return `<td><span class="krabi-table__val${isBest ? ' krabi-table__val--best' : ''}${active}">${esc(v ? v.display : '—')}</span></td>`;
        }).join('');
        return `<tr>
          <th scope="row" class="krabi-table__axis">${esc(row.label)}${row.hint ? `<span class="krabi-table__hint">${esc(row.hint)}</span>` : ''}</th>
          ${cells}
        </tr>`;
      })
      .join('');

    const focus = matrix.find((r) => r.key === activeAxis);
    host.innerHTML =
      (focus
        ? `<p class="krabi-compare__focus">目前聚焦：<strong>${esc(focus.label)}</strong>${focus.hint ? `（${esc(focus.hint)}）` : ''}</p>`
        : '') +
      `<table class="krabi-table"><caption class="visually-hidden">六案並排比較</caption><thead>${head}</thead><tbody>${body}</tbody></table>`;
  }

  function renderDecisionGrid() {
    const host = el('decision-grid');
    if (!host) return;
    host.innerHTML = DECISIONS.map(
      (d) => `
      <div class="decision-card">
        <span class="decision-card__priority">${esc(d.priority)}</span>
        <span class="decision-card__plan">${esc(d.plan)}</span>
        <p class="decision-card__note">${esc(d.note)}</p>
      </div>`,
    ).join('');
  }

  function renderChecklist() {
    const host = el('compliance-checklist');
    if (!host) return;
    const phases = ['下水前', '下水時'];
    host.innerHTML = phases
      .map((phase) => {
        const items = COMPLIANCE_CHECKLIST.filter((c) => c.phase === phase);
        return `
        <div class="checklist__phase">
          <h4 class="checklist__phase-title">${esc(phase)}</h4>
          <ul class="checklist__list">
            ${items
              .map((c) => {
                const on = checked.has(c.key);
                return `
              <li>
                <label class="checklist__item${on ? ' is-checked' : ''}">
                  <input type="checkbox" class="checklist__box" data-checklist-key="${esc(c.key)}"${on ? ' checked' : ''} />
                  <span class="checklist__body">
                    <span class="checklist__label">${esc(c.label)}</span>
                    <span class="checklist__detail">${esc(c.detail)}</span>
                  </span>
                </label>
              </li>`;
              })
              .join('')}
          </ul>
        </div>`;
      })
      .join('');
  }

  /* ═══ 事件 ═══ */

  function wire() {
    el('plans6-axis-tabs')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-plan6-axis]');
      if (!btn) return;
      activeAxis = btn.dataset.plan6Axis;
      renderPlans6AxisTabs();
      renderPlans6Compare();
    });

    el('plans6-list')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-plan6-toggle]');
      if (!btn) return;
      const id = btn.dataset.plan6Toggle;
      if (openPlans.has(id)) openPlans.delete(id);
      else openPlans.add(id);
      renderPlans6();
      el('plans6-list')?.querySelector(`[data-plan6-toggle="${id}"]`)?.focus();
    });

    el('plans6-list')?.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && openPlans.size > 0) {
        openPlans.clear();
        renderPlans6();
      }
    });

    el('compliance-checklist')?.addEventListener('change', (e) => {
      const box = e.target.closest('[data-checklist-key]');
      if (!box) return;
      const key = box.dataset.checklistKey;
      if (box.checked) checked.add(key);
      else checked.delete(key);
      saveChecklist();
      box.closest('.checklist__item')?.classList.toggle('is-checked', box.checked);
    });
  }

  function render() {
    renderRuleHeader();
    renderRuleClauses();
    renderCoralDefinition();
    renderProhibitions();
    renderAidaCompare();
    renderPhotoRule();
    renderAreaTable();
    renderPlans6Calc();
    renderPlans6();
    renderPlans6AxisTabs();
    renderPlans6Compare();
    renderDecisionGrid();
    renderChecklist();
  }

  function onTravelersChange() {
    renderPlans6Calc();
  }

  return { render, wire, onTravelersChange };
}
