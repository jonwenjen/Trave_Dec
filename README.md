# Trave_Dec — 2307 志賀高原滑雪旅行

一個 mobile-first、以「操作」為核心的旅行駕駛艙（trip cockpit），把 10 日滑雪行程的交通鏈、轉乘風險、預算與離線隨身工具收在一頁。介面為繁體中文，保留日文地名。靈感來自 [jonwenjen.github.io/japan-ski-2026/](https://jonwenjen.github.io/japan-ski-2026/)，但為重新設計的原創實作，未複製其視覺。

## 現在能做什麼

- **行程駕駛艙**：按日導覽、當日摘要、依時間排序的事件流；事件標明時間、地點、資料狀態（已確認／估算／前季參考）與來源。
- **轉乘風險**：誠實標示緩衝與緊張銜接（例如末班巴士）；可自訂緩衝門檻，風險等級即時重算。
- **人數與分攤**：可編輯同行人數，計程車等「總價」項目依人數均攤，逐日與全程費用自動換算。
- **預算**：分類金額可編輯，總計依人數縮放。
- **住宿追蹤**：未確認住宿明確標記，並有「待確認住宿」清單。
- **隨身工具**：日文目的地大字卡、情境短句（支援瀏覽器語音朗讀）、110／119 與雪場緊急電話一鍵撥打、官方資訊連結。
- **離線**：service worker + web manifest，首次載入後核心內容可離線開啟。
- **匯出／分享**：行程 JSON 匯出／匯入、`.ics` 行事曆（含備忘與轉乘／航班提醒）、分享連結（狀態編進 URL hash）、一鍵重置回範例。

## 明確不做（避免誤導）

- **不顯示即時天氣／雪況／纜車／班次延誤**：這些需要官方 API，本專案不接，也不假造。相關位置標記為「需連網、請洽官方」。
- 時刻表與票價一律標為**規劃估算或前季參考**，未與營運單位即時核對。

## 開發

```bash
npm install
npm run dev      # 本機開發（Vite）
npm test         # Node 內建測試（118 個測試）
npm run build    # 產出 dist/
npm run preview  # 預覽建置結果
```

Vite `base` 已設為 `/Trave_Dec/`，對應 GitHub Pages 專案頁路徑。

## 資料時效與來源

範例行程擷取自 2026-09 的參考頁，非即時。官方來源請以以下連結複查（冬季班表與營運狀態會變動，26–27 賽季部分時刻 11 月才公布）：

- 志賀高原冬季巴士資訊：https://www.shigakogen.gr.jp/english/topics/shiga-kogen-bus-service-information.html
- 志賀高原雪場／纜車營運：https://www.shigakogen-ski.or.jp/english/index.php
- JNTO 志賀高原交通概述：https://www.japan.travel/en/spot/2051/
- 長電巴士急行（長野－志賀高原）：https://www.nagadenbus.co.jp/express/winter/shigakogen/

## 歸屬（attribution）

- **專案領導**：Hermes Agent（排程、協調、調研整合、驗證與發布）
- **主要實作**：Claude Code CLI — 實際選用模型 `claude-opus-5`
- **調研／審查**：Gemini CLI — `gemini-3.8-flash-high`（thinking）

## 路線圖（Roadmap）

- 接入官方即時班次／纜車／雪況 API（需授權與後端代理）
- 多日行程拖放編輯
- 離線地圖與集合點標註
- 語音短句加入可下載音檔
