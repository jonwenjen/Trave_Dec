# Trave_Dec — implementation brief

## Product
Create an original, mobile-first trip companion inspired by the user's Japan ski itinerary at https://jonwenjen.github.io/japan-ski-2026/. Keep the useful itinerary facts and general concepts, but do not clone its UI. Interface language: Traditional Chinese with Japanese place names preserved.

Primary surface: **Operate** — travelers need to quickly decide what is next, catch transit risks, and share field information. Build a calm, high-utility trip dashboard rather than a marketing landing page.

## Required experience
- Reusable trip workspace with a populated sample trip matching the source: Dec 11–20, 2026, Narita → Takasaki → Marunuma → Takamine → Nagano → Shiga Kogen/Yokoteyama → Yokohama → Narita; party size 6.
- Daily itinerary with clear day navigation, ordered events, time, place, status/booking markers, notes, and source/freshness caveats. Preserve uncertainty (e.g. unconfirmed lodging/season timetables); never present estimates or old schedules as live/confirmed.
- Helpful transfer risk indicators and simple editable connection-buffer controls; group-size-aware per-person cost estimate.
- Useful trip budget categories with editable amounts and totals.
- Offline-ready field kit: Japanese destination cards, phrasebook with browser speech synthesis where supported, emergency contacts, plus visible offline status. No network required for core content.
- Export trip data as JSON; generate an .ics calendar; copy/share link if browser supports it; local persistence with a reset/sample-data option.
- Search/filter itinerary and field content, responsive mobile navigation, accessible keyboard/focus, reduced-motion support.
- Clear source links and last-checked/verification labels. Live data must be explicitly marked unavailable/not connected; do not fake live weather, snow, lift, or train status.

## Technical direction
- Keep dependencies minimal; must run as static site with `npm run dev` and be publishable on GitHub Pages.
- Write tests first for itinerary/budget/calendar helper behavior; use Node's built-in test runner if practical.
- Add README with setup, features, data accuracy cautions, sources, roadmap, and attribution.
- Attribution in README: Project lead — Hermes Agent; primary implementation — Claude CLI; research/review — Gemini CLI. Never claim unsupported model versions; record the actual selected model reported by the CLI.
- Avoid external service credentials and private data. Do not copy proprietary design/content beyond factual itinerary details supplied by the user.
