# Trave_Dec — implementation brief

## Product
A single-trip planning site for **泰國甲米跳島浮潛 2027/04** (Krabi, Thailand island-hopping and
snorkeling, 7 days, departing 高雄 KHH). The site's job is to let a group **compare six concrete
plans side by side** and choose one on evidence — not to sell them a generic "top 10 islands" list.

**The date is 2027/04, not 2027/05** — see "Why April" below. The May plans remain only as a
documented reassessment, not as live options.

Interface language: Traditional Chinese, with island names kept in English (Koh Rok, Phi Phi…).

## Why April, and why six plans
The 2026/27 season is a **super El Niño** (NOAA: >90% chance of "very strong" through
2027-01, persisting to 2027-03/05). This inverts the usual assumption — rain is likely *below*
average, so May's monsoon-transition risk shrinks while **heat becomes the hazard**. The
reliable TMD figure is **April temperatures +1.5–2.5°C**, heat index up to 50–54°C.

April wins on structure, not just weather: the Ao Nang→Koh Lanta ferry **runs in April** (it
does not May–October), and **Similan is in season** (10/15–5/15). Both of May's disqualifiers
disappear. April 13–15 is Songkran, so the recommended window is **4/6–4/12** to avoid it.

The five May plans and five April plans were then **merged into six** once the 2025 Thai diving
regulations and freediving feasibility were known — those findings changed the feasible set.
See `docs/krabi-all-plans-reassessment.md`.

## 2025 diving regulations — legally binding, easy to miss
Effective **2025-04-22** nationwide (MNRE, *Measures for the Protection of Coral Reef Resources
from Diving Tourism Activities, B.E. 2568*), enforceable under the Marine and Coastal Resources
Management Act, in force at least 5 years. This is law, not operator advice, and pre-2025 guides
almost never mention it:
- Life vests **mandatory for snorkelers** unless holding a recognised freediving/scuba cert.
  AIDA 2 exempts; **AIDA 1 does not** (it is a one-day intro, not a full certification).
- Snorkelers must be **with a qualified operator** — this is what makes "just hire your own
  boat at the pier" a grey area. Recommend licensed operators, not informal charters.
- 2 m clearance above reef; 1 supervisor per 20 snorkelers; briefing required before activity.
- **Underwater cameras** need Advanced Open Water+ or 40 logged dives. A freediving cert does
  not unlock photography.
- "Coral reef area" includes **dead** coral, gorgonian fans and artificial reefs — so it covers
  effectively everywhere we snorkel.
- Operator penalties reach ฿200,000.

## Core surface
One page, one trip, four things:

1. **Three decisive constraints** surfaced at the top, not buried: no direct KHH→KBV flight
   (must connect via BKK); May 2027 is the monsoon-transition shoulder; and the Ao Nang→Koh Lanta
   passenger ferry does **not** run May–October. These three facts are what make the five plans
   genuinely different from each other — they are not decoration.
2. **Five plan cards** (A 全浮潛跳島 / B Phi Phi 過夜 / C 蘭塔駐紮 / D 遠端大島 / E 雨季保險),
   each with 7 days, per-day cost, park fees, risk level, and a marked rain-contingency day.
   Cards expand to reveal the full day-by-day breakdown.
3. **Switchable comparison matrix** across 7 axes (snorkel stops, sea days, island overnight,
   base moves, monsoon risk, substitutability if boats cancel, cost), with the best plan starred
   per axis.
4. **Honest support material**: park fees with season windows, a monsoon contingency table, and a
   checkable "verify before booking" list persisted to localStorage.

## Required experience
- Traveler count (1–20) drives an instant cost recalculation; optional "include flights" toggle.
- Expand/collapse plan cards, axis switching, checklist ticking — all keyboard operable,
  `focus-visible` states, touch targets ≥44px, `prefers-reduced-motion` respected.
- Dark/light theme following `prefers-color-scheme` with manual override persisted to
  localStorage.
- Offline-capable via service worker (core content readable after first load).

## Data accuracy — non-negotiable
This is the part that matters most. 2027-05 data **does not exist yet**.
- Every time, fare, boat schedule and park fee is labeled 前季參考／規劃估算, with official source
  links. No fabricated live weather, sea state, or boat status — ever.
- Seasonal closures are stated as 待確認 for 2027: Similan/Surin season ends 5/15 (so 5/10 is the
  deadline to try Similan); Maya Bay closes 8/1–9/30.
- The THB→TWD rate is an **adjustable planning assumption**, labeled as such.
- Visa-free entry and TDAC must be marked 須查證最新規定.
- Never let a derived display value silently disagree with the underlying day flags — a
  `seaDayCount` field duplicating the `days[].seaDay` flags is exactly the kind of drift that
  produced a real bug; derive it in helpers and test the invariant instead.

## Technical direction
- Vite + vanilla JS, static site, deployable to GitHub Pages with `base: '/Trave_Dec/'`.
- Keep dependencies minimal. No runtime API keys, no external JS/CDN.
- Pure helpers in `src/krabi-helpers.js`, **tests first** via Node's built-in test runner
  (`npm test` must be green). Data lives in `src/data/krabi.js`; UI in `src/krabi-ui.js`.
- README must carry truthful attribution: Project lead — Hermes Agent; research — Gemini CLI
  (`gemini-3.8-flash-high`). Record only models the runtime actually reported; never invent
  version labels.
