/**
 * Trave_Dec — 2026 前季價格比較（十四案 7 天）
 *
 * 這是整站最後的決策工具：把甲米九案與普吉五案統一壓到 7 天、
 * 統一用 2026 年查得的價格，讓兩區可以直接比。
 *
 * 這裡刻意不做的事：不假裝精確。每個區間都標明寬度，
 * 因為寬度本身就是資訊——機票的區間最寬（訂票時點影響數千元），
 * 餐費最窄。區間窄不代表該項不重要，代表它好預估。
 */

import {
  COMPRESSED_PLANS,
  FLIGHT_COSTS,
  LODGING,
  FOOD,
  COMPRESSION_NOTES,
  PRICE_CAVEAT,
  planTotalTWD,
  planTotalTWDPerPerson,
  planBreakdown,
  compareRegions,
  flightSavingsTWD,
  compressionImpact,
  THB_TO_TWD_ASSUMED,
  USD_TO_TWD_ASSUMED,
} from './pricing-helpers.js';

const REGION_LABEL = { krabi: '甲米', phuket: '普吉' };

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function fmt(n) {
  return `TWD ${Math.round(n).toLocaleString('en-US')}`;
}

function row(plan, travelers) {
  const b = planBreakdown(plan, travelers);
  const total = b.total;
  return `
      <tr data-price-id="${esc(plan.id)}" data-region="${esc(plan.region)}">
        <th scope="row">
          <span class="price__tag price__tag--${esc(plan.region)}">${esc(plan.sourceTag)}</span>
          <span class="price__name">${esc(plan.name)}</span>
          ${plan.notRecommended ? '<span class="price__flag">不建議壓縮</span>' : ''}
        </th>
        <td>${esc(REGION_LABEL[plan.region])}</td>
        <td>${esc(b.flightLabel)}</td>
        <td>${fmt(b.baggage.min)} – ${fmt(b.baggage.max)}</td>
        <td>${esc(b.lodgingLabel)}</td>
        <td>${esc(b.foodLabel)}</td>
        <td>${fmt(b.boats.min)} – ${fmt(b.boats.max)}</td>
        <td class="${b.parkFee.max === 0 ? 'is-free' : ''}">${b.parkFee.max === 0 ? '免' : fmt(b.parkFee.max)}</td>
        <td class="price__total">${fmt(total.min)} – ${fmt(total.max)}</td>
      </tr>`;
}

function flightCards() {
  const keys = Object.keys(FLIGHT_COSTS);
  return `
        <div class="price__flights">
          ${keys.map((k) => {
    const f = FLIGHT_COSTS[k];
    return `
            <div class="price__flight">
              <h4 class="price__flight-route">${esc(f.route)}
                <span class="price__flight-direct ${f.direct ? 'is-direct' : ''}">${f.direct ? '直飛' : '轉機'}</span>
              </h4>
              <p class="price__flight-cost">${fmt(f.twd.min)} – ${fmt(f.twd.max)}<small>／人來回</small></p>
              <p class="price__flight-basis">${esc(f.basis)}</p>
              <p class="price__flight-note">${esc(f.note)}</p>
              <a class="price__flight-src" href="${esc(f.source)}" target="_blank" rel="noopener">價格來源</a>
            </div>`;
  }).join('')}
        </div>`;
}

function compressionPanel() {
  const c = compressionImpact();
  const compressed = c.plans.filter((p) => p.compressed);
  return `
        <aside class="price__compression" aria-labelledby="price-compress-h">
          <h3 class="price__compression-h" id="price-compress-h">7 天壓縮的代價</h3>
          <p class="price__compression-principle">${esc(c.notes.principle)}</p>
          <p class="price__compression-honest">${esc(c.notes.honest)}</p>
          <p class="price__compression-when">${esc(c.notes.whenOk)}</p>
          <p class="price__compression-count">
            十四案中 <strong>${c.compressedCount}</strong> 案需要壓縮（原本 8–9 天），
            其中 <strong>${c.notRecommendedCount}</strong> 案壓縮後失去意義或代價過高。
          </p>
          <ul class="price__compression-list">
            ${compressed.map((p) => `
              <li class="price__compression-item${p.notRecommended ? ' is-not-rec' : ''}">
                <h4>${esc(REGION_LABEL[p.region])} ${esc(p.sourceTag)} — ${esc(p.name)}</h4>
                <p class="price__compression-from">${esc(p.compressedFrom)}</p>
                <p>${esc(p.tradeoff)}</p>
                ${p.alternativeDays ? `<p class="price__compression-alt">建議改為 ${p.alternativeDays} 天。</p>` : ''}
              </li>`).join('')}
          </ul>
        </aside>`;
}

function regionCompare() {
  const c = compareRegions();
  return `
        <div class="price__region-compare">
          <p class="price__region-verdict">
            以 2 人、7 天計，<strong>${esc(c.cheaper.label)}平均每人便宜約 ${fmt(c.diffTWD)}</strong>
            （${esc(c.cheaper.label)}平均 ${fmt(c.cheaper.avgTWD)}，${esc(c.dearther.label)}平均 ${fmt(c.dearther.avgTWD)}）。
            主因是機票：<strong>普吉直飛 US$315–670 比甲米轉機 US$231–275 貴</strong>，
            換算差約 ${fmt(Math.abs(flightSavingsTWD()))}。
            <strong>托運行李再拉開差距</strong>：虎航直飛 20kg 來回 TWD 1,900–3,200，
            亞航轉機 TWD 1,380–1,900——直飛的行李還比轉機貴約 500 TWD。
          </p>
          <p class="price__region-caveat">
            **這修正了先前的判斷。**早期版本誤把普吉的「轉機價」當成「直飛價」，
            得出「普吉比較便宜」的結論。加上直飛的真實票價後，結論反轉。
            普吉的優勢在<strong>時間</strong>（省 10 小時）與<strong>自由潛水訓練</strong>，
            不在價格。
          </p>
        </div>`;
}

function caveatPanel() {
  return `
        <aside class="price__caveat" aria-labelledby="price-caveat-h">
          <h3 class="price__caveat-h" id="price-caveat-h">
            ${esc(PRICE_CAVEAT.headline)}（研究於 ${esc(PRICE_CAVEAT.researchDate)}）
          </h3>
          <p class="price__date-warning">
            <strong>⚠️ 報價日期不等於出行日期。</strong>
            上方機票是 <strong>2026-09-27 查得的當期價格</strong>，
            對應的是 2026 年 10 月前後的航班，<strong>不是 2027-04-06 的票價</strong>。
            目標出發日距今約 191 天，票價已進入可預訂範圍但仍會變動。
            建議於 <strong>2027-02-25</strong>（出發前 40 天）實際查價後再定案。
          </p>
          <ul class="price__caveat-list">
            ${PRICE_CAVEAT.items.map((i) => `<li>${esc(i)}</li>`).join('')}
          </ul>
          <p class="price__caveat-assume">
            匯率假設：1 THB ≈ ${THB_TO_TWD_ASSUMED} TWD；1 USD ≈ ${USD_TO_TWD_ASSUMED} TWD。
            這些是<strong>規劃用的可調整假設</strong>，匯率變動會直接影響結果。
          </p>
        </aside>`;
}

/**
 * 建立 2026 價格區塊
 * @returns {{refreshTravelers:function, destroy:function}}
 */
export function createPricingSection({ travelers = 2 } = {}) {
  const section = document.getElementById('pricing');
  if (!section) return { refreshTravelers() {}, destroy() {} };

  let state = { travelers };

  const render = () => {
    const krabiRows = COMPRESSED_PLANS.filter((p) => p.region === 'krabi');
    const phuketRows = COMPRESSED_PLANS.filter((p) => p.region === 'phuket');
    const cheapestPhuket = phuketRows
      .map((p) => ({ p, t: planTotalTWDPerPerson(p, state.travelers) }))
      .sort((a, b) => a.t.max - b.t.max)[0];
    const cheapestKrabi = krabiRows
      .map((p) => ({ p, t: planTotalTWDPerPerson(p, state.travelers) }))
      .sort((a, b) => a.t.max - b.t.max)[0];

    section.innerHTML = `
      <div class="section-container">
        <div class="section-header">
          <p class="section-eyebrow">先期評估</p>
          <h2 class="section-title" id="pricing-heading">2026 前季價格・十四案 7 天</h2>
          <p class="section-lead">
            把甲米九案與普吉五案<strong>統一壓縮到 7 天 6 晚</strong>，
            並用 2026-09-27 實際查得的價格重算，讓兩區可以直接比。
            費用含機票、<strong>托運行李 20kg</strong>、住宿、船資、公園費與餐費，每人計價。
            <strong class="price__lead-warn">價格對應 2026 年 10 月航班，非 2027-04-06 目標日期。</strong>
          </p>
        </div>

        <div class="price__block">
          <h3 class="price__block-h">機票（每人來回，2026-09-27 當期價，非 2027/04 票價）</h3>
          <p class="price__block-lead">
            這是兩區最大的結構差異：<strong>TPE→HKT 直飛</strong>對上
            <strong>TPE→KBV 經曼谷</strong>。**注意：直飛並不比轉機便宜**——
            轉機最便宜 US$255，直飛要 US$315–670，價差約 TWD 2,000–10,000。
            甲米多花 9–11 小時在轉機上，但省下的是票價，不是時間。
          </p>
          ${flightCards()}
        </div>

        ${compressionPanel()}

        <div class="price__block">
          <h3 class="price__block-h">十四案每人費用比較（${state.travelers} 人）</h3>
          <p class="price__block-lead">
            整團費用（住宿、船資、公園費）由全體人數分攤，機票與餐費則每人獨立計算。
            下方表格以每人費用由低到高排列。
          </p>
          <div class="krabi-compare__scroll">
            <table class="krabi-table price__table">
              <caption class="visually-hidden">十四個 7 天方案的每人費用分項比較</caption>
              <thead>
                <tr>
                  <th scope="col">方案</th>
                  <th scope="col">區域</th>
                  <th scope="col">機票</th>
                  <th scope="col">托運 20kg</th>
                  <th scope="col">住宿</th>
                  <th scope="col">餐費</th>
                  <th scope="col">船資／人</th>
                  <th scope="col">公園費／人</th>
                  <th scope="col">每人總額</th>
                </tr>
              </thead>
              <tbody>
                ${[...COMPRESSED_PLANS]
    .sort((a, b) => planTotalTWDPerPerson(a, state.travelers).max
      - planTotalTWDPerPerson(b, state.travelers).max)
    .map((p) => row(p, state.travelers)).join('')}
              </tbody>
            </table>
          </div>
          <p class="price__block-foot">
            本組最便宜：<strong>${esc(REGION_LABEL[cheapestPhuket.p.region])} ${esc(cheapestPhuket.p.sourceTag)}</strong>
            （${esc(cheapestPhuket.p.name)}）${fmt(cheapestPhuket.t.min)} – ${fmt(cheapestPhuket.t.max)}。
            甲米最便宜為 ${esc(cheapestKrabi.p.sourceTag)}（${esc(cheapestKrabi.p.name)}）
            ${fmt(cheapestKrabi.t.min)} – ${fmt(cheapestKrabi.t.max)}。
          </p>
        </div>

        <div class="price__block">
          <h3 class="price__block-h">甲米 vs 普吉：價格面</h3>
          ${regionCompare()}
        </div>

        <div class="price__block">
          <h3 class="price__block-h">價格依據</h3>
          <dl class="price__basis">
            ${Object.values(LODGING).map((l) => `
              <div><dt>${esc(l.label)}</dt><dd>฿${l.thb.min.toLocaleString('en-US')} – ฿${l.thb.max.toLocaleString('en-US')}／晚</dd></div>`).join('')}
            ${Object.values(FOOD).map((f) => `
              <div><dt>餐費：${esc(f.label)}</dt><dd>฿${f.thbPerDay.min} – ฿${f.thbPerDay.max}／人／天</dd></div>`).join('')}
          </dl>
        </div>

        ${caveatPanel()}

        <p class="price__footnote">
          這張表回答的是「哪個方案比較便宜」，不是「哪個方案比較好」。
          費用的真實差距（每人約 4,000–6,000 TWD）遠小於交通省下的 10 小時、
          或 Similan 與翡翠洞這類無法用錢替代的體驗。**便宜的方案不等於合適的方案。**
        </p>
      </div>`;
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
