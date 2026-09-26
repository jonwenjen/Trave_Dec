# 實作簡報：甲米五方案比較頁（Trave_Dec 新區塊）

## 目標
在既有 Trave_Dec 網站新增一個**自帶資料的新區塊**「甲米 2027・跳島浮潛五方案」，把 `docs/krabi-2027-05-plans.md` 的五案規劃做成可互動比較的頁面。**不重構**日本滑雪行程的既有架構、資料或 tab。

## 架構約束（重要）
- 新增 `src/data/krabi.js`：五案資料（結構見下）。**不要**改動 `src/data/itinerary.js` 的既有結構，也不要把甲米資料塞進它。
- 新增 helper 於 `src/helpers.js`（或新檔 `src/krabi-helpers.js`）：方案總成本、浮潛點數統計、風險等級、地區分組、方案推薦比對等純函式，**必須先寫 Node 測試**（`test/`）再實作。
- UI 渲染於 `src/main.js` 新增區塊（錨點導航加一項「甲米五方案」），樣式於 `src/style.css` 新增，沿用既有深色編輯風（深松綠 hero、珊瑚 `#e8553a` accent、Noto Serif TC 標題 / Noto Sans TC 內文 / DM Sans 數字）。
- 錨點：從頁面任何處可跳到 `#krabi`，並可從該區塊跳回其他 section。

## 資料結構（`src/data/krabi.js`）
```
KRABI_TRIP = {
  meta: { title, subtitle, dest, dates: '2027/05', durationDays: 7, origin: '高雄 KHH', destAirport: 'KBV', travelers, researchDate: '2026-09' },
  keyFacts: [ {label, value, note?, severity?: 'info'|'warn'|'critical'} ],  // 三個前提 + 日期
  plans: [ {
    id, tag: 'A'..'E', name, positioning, base, seaDays, snorkelScore(1-5),
    riskLevel: 'low'|'mid'|'mid-high'|'high', riskLabel, suits, highlight,
    days: [ { day, title, detail, transport, costTHB?, costNote?, parkFeeTHB?, isBuffer?: bool } ],
    snorkelStops, highlights: [], sources: [{label, url}],
    estimateTHB: { min, max, note },
  } ],
  compare: { axes: [{key,label}], },
  parkFees: [ {place, adultTHB, season, note, url} ],
  contingency: [ {situation, action} ],   // 船班取消 / 浪大 / 暈船 / 受傷 …
  openQuestions: [ ... ]                  // 待查證清單
}
```
內容請**照抄** `docs/krabi-2027-05-plans.md` 的事實（五案行程、費用估算、風險、公園費、待補清單），不得新增或改動數字。

## 必要功能
1. **五方案卡**：並排（桌機）/ 堆疊（行動），每卡顯示定位、基地、海上天數、浮潛強度（視覺星等或條）、風險徽章（顏色分級）、前季團費區間。
2. **方案比較表**：可切換的比較軸（浮潛點數、海上天數、是否住島、搬運次數、5 月雨季風險、船取消後可替代性、費用）。桌機表格、行動版改卡片式。軸值由 helper 計算，非硬寫死。
3. **展開式每日行程**：點卡片展開該案 7 日，含交通、費用（฿）、公園費、**雨備日標記**。行動版友善、鍵盤可操作。
4. **三前提警示卡**：把「無直飛／5 月季風過渡／蘭塔渡輪 5 月停駛」放在區塊頂部顯眼處（critical 級用珊瑚色警示），並標明「2027 實際船班待查證」。
5. **費用試算**：人數可調（1–20），即時換算各案團費分攤（用 helper），可選「含機票」開關（機票前季參考 TWD 10,700–14,600），顯示 TWD 與 THB（匯率標「規劃假設值，可自行調整」）。
6. **雨季應變對照表**：情況 → 動作（依 `contingency`）。
7. **待查證清單**：可勾選（勾選狀態存 localStorage，不影響其他資料）。
8. **官方來源連結**：公園費、Similan／Surin 季、渡輪時刻、免簽／TDAC 等，外部連結 `target="_blank" rel="noopener"`。

## 資料誠實性（硬性）
- 所有時刻、票價、船班、公園費一律標「**前季參考／規劃估算，出發前請查證官方網站**」。
- 不得假造即時天氣、海況、船班狀態、免簽最新規定。
- 匯率是假設值必須明示。
- 台灣護照免簽、TDAC 須標「須查證最新規定」。
- Similan／Surin 季末（5/15）與瑪雅灣季節性關閉（8/1–9/30）要如實呈現為「2027 待確認」。
- 繁體中文，保留英文島名（Koh Rok、Phi Phi 等）。

## 品質要求
- mobile-first；觸控熱區 ≥44px；`:focus-visible` 明顯；`prefers-reduced-motion` 支援；鍵盤可操作（Enter/Space 展開、Esc 收合）；新增區塊不破壞既有深色模式與淺色模式。
- 尊重既有 `prefers-color-scheme` 與手動主題切換。
- 新區塊也要能被 service worker 正常快取（沿用現有 SW 策略，不需大改）。

## 驗證
- `npm test` 與 `npm run build` 全綠（新增測試須涵蓋：方案總成本試算、風險分級、浮潛點統計、公園費加總、匯率換算等 helper）。
- 不 commit、不 push、不改 README 歸屬。最後簡短回報改了哪些檔與驗證結果。
