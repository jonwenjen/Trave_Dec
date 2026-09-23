# Trave_Dec — UX 改進計畫（agy / Claude Opus 4.6 Thinking 規劃）

參考：https://jonwenjen.github.io/japan-ski-2026/ ＋ 現有 Trave_Dec 實作（Vite PWA，四 tab：行程／計畫／預算／隨身工具）。

## P0 必做（出發前硬性必修）

1. **SW 離線白畫面** — `public/sw.js` 只預快取 `index.html / manifest / icon.svg`，沒有快取 Vite 打包後帶 hash 的 JS/CSS。山上斷線會白畫面。改法：安裝時抓取建置產物（或 runtime cache-first 把同源 JS/CSS 一併快取），並在 `activate` 清理舊版。
2. **innerHTML 全頁重繪** — 目前每次操作都重建整段 DOM，破壞 `<details>` 開合狀態、打斷 IME 輸入法。改法：改為目標式局部更新（render 只更新變動的區塊，保留焦點與開合）。
3. **無 swipe 手勢 + 箭頭太小** — 10 天行程在手機上逐日點擊很費力。改法：加左右滑動手勢切換天、加大觸控熱區（≥44px）、支援方向鍵。

## P1 應該做

- 已過事件灰化（當天已過時間的事件弱化顯示）
- 深色模式（`prefers-color-scheme` ＋ 手動切換，存入 localStorage）
- Tab 捲動位置記憶（切換 tab 不跳回頂部）
- 搜尋結果高亮（比對到的字串標示）
- 「回到今天」按鈕（行程中快速跳回當天）
- 預算比例條（各分類占總額的比例視覺化）
- 大字卡／短句一鍵複製按鈕
- PWA 圖標補全（目前只有 SVG，補 PNG/maskable 以利安裝）

## P2 可選

- 行程拖放編輯
- 集合點地圖標註

## 驗收

- `npm test` 全綠、`npm run build` 成功
- 手機視覺／觸控、離線快取、深色模式、搜尋高亮均可用
- 不改 README 歸屬（Hermes 領導／Gemini 調研／Claude 實作）
