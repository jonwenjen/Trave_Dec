# UX research notes

## Reference
The original 2307 Carve Log is a 10-day ski trip planner (Dec 11–20, 2026) for a group of six, spanning Narita, Takasaki, Marunuma, Takamine, Nagano, Shiga Kogen/Yokoteyama, Yokohama, and Narita. Strengths to preserve: detailed daily logistics, transit option comparisons, snow-sports details, local dining, calendar export, offline Japanese phrase cards, and emergency contacts.

## Gemini CLI review (Gemini 3.8 Flash High / thinking)
Highest-value improvements: party-aware transfer and per-person cost context; make unconfirmed hotels editable anchors; distinguish suggested vs last-safe transit legs; surface official resort/bus status links; and show estimated budget/payment caveats. Offline/contingency priorities: cache core trip info, snow disruption playbook, large Japanese situation cards, richer ICS notes/reminders, and emergency/meeting-point shortcuts. Trust model: explicit confirmed / historic-estimate / unconfirmed states, source provenance, captured-date context, and no automatic “confirmed” upgrade without verified live data.

Trave_Dec applies the feasible static-site subset: editable party size/cost splits, transparent planning-only timetable notes and official links, field cards/phrases, ICS/JSON export, and local persistence. No live traffic/weather/lift feeds or GPS tracking are represented as available.

## Official source links reviewed
- Shiga Kogen winter bus access information: https://www.shigakogen.gr.jp/english/topics/shiga-kogen-bus-service-information.html
- Shiga Kogen resort/lift operations: https://www.shigakogen-ski.or.jp/english/index.php
- Japan National Tourism Organization, Shiga Kogen access overview: https://www.japan.travel/en/spot/2051/

Seasonal schedules and operating status can change. The sample trip's historical/snapshot details are planning context only; verify with the operator before departure.
