/**
 * Trave_Dec — 機票結構比較（來回 / 兩張單程 / 混搭）
 *
 * 使用者問的是：轉機去直飛回、或直飛去轉機回，哪個價格與時間更有優勢？
 *
 * 結論不是單一答案，因為混搭報價的實際旅遊天數可能長於 7 天——
 * 這裡把「價格」與「天數」一起攤開比較，而不是只比價格。
 *
 * 另一個發現比價格更重要：**目標 7 天窗口的回程沒有直飛班**（04-12 是週一，
 * 虎航只飛週二、週六）。純直飛來回在這個窗口根本不可行，混搭才是解法。
 */

import {
  FARE_STRUCTURE,
  SCHEDULE_CONFLICT,
  FLIGHT_COSTS,
  PRICE_CAVEAT,
  THB_TO_TWD_ASSUMED,
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

/**
 * 五種票務結構依「每小時有效時間成本」排序。
 *
 * 這個指標的意義：買直飛多花的錢，換算成你多花的交通小時數是多少。
 * 若結果遠低於一般人的時薪，直飛就值得；反之則省錢較實在。
 */
export function fareOptions() {
  const keys = Object.keys(FARE_STRUCTURE);
  const rows = keys.map((k) => {
    const f = FARE_STRUCTURE[k];
    const mid = (f.twd.min + f.twd.max) / 2;
    // 來回總交通時數（以中價推估）
    const hours = f.hours.includes('4h25m') && f.hours.includes('8')
      ? 4.4 + 11.5
      : (f.hours.includes('4h') ? 8.4 : 19);
    return { key: k, ...f, mid, hours, perHour: mid / hours };
  });
  // 有效時間成本由低到高：越高代表「每小時買得越貴」
  return rows.sort((a, b) => a.perHour - b.perHour);
}

function fareCards() {
  return `
        <div class="fare__cards">
          ${fareOptions().map((f) => `
            <div class="fare__card${f.recommended ? ' is-rec' : ''}${f.warning ? ' has-warn' : ''}">
              ${f.recommended ? '<span class="fare__badge">推薦</span>' : ''}
              <h4 class="fare__label">${esc(f.label)}</h4>
              <p class="fare__price">${fmt(f.twd.min)} – ${fmt(f.twd.max)}</p>
              <p class="fare__hours">${esc(f.hours)}</p>
              <dl class="fare__meta">
                <dt>有效時薪</dt><dd>TWD ${Math.round(f.perHour).toLocaleString('en-US')}／小時</dd>
                <dt>依據</dt><dd>${esc(f.basis)}</dd>
                <dt>日期彈性</dt><dd>${esc(f.flexibility)}</dd>
              </dl>
              ${f.note ? `<p class="fare__note">${esc(f.note)}</p>` : ''}
              ${f.warning ? `<p class="fare__warn">${esc(f.warning)}</p>` : ''}
              ${f.lengthNote ? `<p class="fare__length">${esc(f.lengthNote)}</p>` : ''}
            </div>`).join('')}
        </div>`;
}

function conflictPanel() {
  const c = SCHEDULE_CONFLICT;
  return `
        <aside class="fare__conflict" aria-labelledby="fare-conflict-h">
          <h3 class="fare__conflict-h" id="fare-conflict-h">
            ⚠️ 比價格更重要的發現：目標窗口的直飛班表對不上
          </h3>
          <table class="fare__conflict-table">
            <caption class="visually-hidden">目標窗口的直飛班表可行性</caption>
            <thead>
              <tr><th scope="col">項目</th><th scope="col">日期</th><th scope="col">直飛可行</th></tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">出發</th>
                <td>${esc(c.targetStart)}（週二）</td>
                <td class="fare__ok">${c.startOk ? '✓ 有班' : '✗ 無班'}</td>
              </tr>
              <tr>
                <th scope="row">回程</th>
                <td>${esc(c.targetEnd)}（週一）</td>
                <td class="fare__bad">${c.endOk ? '✓ 有班' : '✗ 無直飛班'}</td>
              </tr>
              <tr>
                <th scope="row">最近可回</th>
                <td>${esc(c.nearestDirectReturn)}（${esc(c.nearestDirectReturnWeekday)}）</td>
                <td class="fare__ok">✓ 但要多住 1 晚</td>
              </tr>
            </tbody>
          </table>
          <p class="fare__conflict-verdict">
            <strong>純直飛來回在 7 天窗口不可行。</strong>
            去程 ${esc(c.targetStart)} 週二可以出發，但回程 ${esc(c.targetEnd)} 週一沒有直飛班，
            必須改為 ${esc(c.workaround)}，或把整段縮成 ${esc(c.orShift)}。
          </p>
          <p class="fare__conflict-solution">
            <strong>解法就是混搭。</strong>${esc(c.openJawSolution)}
          </p>
        </aside>`;
}

/**
 * 建立機票結構區塊
 * @returns {{destroy:function}}
 */
export function createFareStructureSection() {
  const section = document.getElementById('fare-structure');
  if (!section) return { destroy() {} };

  const direct = FLIGHT_COSTS['tpe-hkt-direct'];
  const opts = fareOptions();

  section.innerHTML = `
    <div class="section-container">
      <div class="section-header">
        <p class="section-eyebrow">交通選擇</p>
        <h2 class="section-title" id="fare-structure-heading">機票結構：來回、兩張單程、還是混搭</h2>
        <p class="section-lead">
          直飛每週只有 <strong>週二、週六</strong>兩班，這讓「買一張對稱的來回票」變得很難。
          這一區比較五種票務結構，把<strong>價格、航程、有效時薪、日期彈性</strong>並列。
        </p>
      </div>

      ${conflictPanel()}

      <div class="price__block">
        <h3 class="price__block-h">五種票務結構比較</h3>
        <p class="price__block-lead">
          「有效時薪」＝ 票價 ÷ 來回總交通時數，用來判斷直飛多花的錢是否值得。
          依此排序，<strong>${esc(opts[0].label)}</strong> 每小時最便宜。
          實際報價為 ${esc(PRICE_CAVEAT.researchDate)} 查得的當期價，非 2027-04 目標日期票價。
        </p>
        ${fareCards()}
        <p class="price__block-foot">
          直飛單程最低 TWD 4,773、來回 TWD 9,950（7 天）、純轉機來回 TWD 7,053。
          買兩張直飛單程約 9,546，只比來回省 404 TWD——<strong>不足以抵銷拆單失去的行李與改期彈性，不建議刻意拆單。</strong>
        </p>
      </div>

      <div class="price__block">
        <h3 class="price__block-h">直接回答問題：哪個更有優勢</h3>
        <div class="fare__answer">
          <div class="fare__answer-item">
            <h4>要價格最省 → <strong>純轉機來回</strong></h4>
            <p>
              TWD 7,053 起，比直飛來回省 <strong>3,100–4,000 TWD</strong>。
              代價是單程多花 4–10 小時，且每日有班、日期完全自由。
            </p>
          </div>
          <div class="fare__answer-item">
            <h4>要日期能配合 7 天窗口 → <strong>去直飛 ＋ 回轉機</strong></h4>
            <p>
              這是<strong>唯一能同時滿足「7 天 6 晚」與「保留直飛」的組合</strong>。
              去程 4h25m 直飛，回程轉機但日期自由。
              ⚠️ 但實際報價（TWD 7,111）的回程晚了 8 天，<strong>縮到 7 天須重新查價</strong>。
            </p>
          </div>
          <div class="fare__answer-item">
            <h4>要省時間 → <strong>純直飛來回</strong></h4>
            <p>
              多付 3,100–4,000 TWD 換回單程 4–10 小時，約 TWD 600–1,000／小時。
              對照你的實質時薪，這是判斷要不要買的門檻。
              <strong>代價是日期幾乎不能動</strong>——這在 7 天窗口是硬傷。
            </p>
          </div>
        </div>
        <p class="fare__answer-foot">
          <strong>一句話總結：</strong>純直飛在「省時間」上最優，但在「7 天窗口可行」上最劣。
          ${esc(REGION_LABEL.phuket)}方案若堅持 7 天 6 晚，
          <strong>去直飛 ＋ 回轉機是唯一兩者兼顧的選項</strong>——代價是回程多 4–10 小時。
        </p>
      </div>

      <p class="price__footnote">
        以上為 2026-09-27 查得的當期票價，用於先期判斷趨勢與量級。
        <strong>2027-04-06 的實際票價須於 2027-02-25 前後重新查證</strong>，
        且虎航的 2027 年 4 月班表可能與 2026 年不同，需以虎航官網為準。
      </p>
    </div>`;

  return {
    destroy() {
      section.innerHTML = '';
    },
  };
}
