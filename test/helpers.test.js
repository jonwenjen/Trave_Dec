import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  formatCurrency,
  perPersonCost,
  eventCostPerPerson,
  computeDayBudget,
  computeItineraryCost,
  computeTotalBudget,
  mergeBudgetEdits,
  budgetTotals,
  timeToMinutes,
  minutesToTime,
  sortEventsByTime,
  getNextEvent,
  dayIndexOf,
  filterDaysByRange,
  parseISODate,
  formatShortDate,
  getDayProgress,
  daysUntil,
  resolveActiveDay,
  normalizeBufferPolicy,
  getTransferRisk,
  effectiveBuffer,
  resolveEventRisk,
  collectTransferRisks,
  searchItinerary,
  filterEventsByType,
  countByType,
  searchFieldContent,
  summarizeDay,
  collectLodgingToConfirm,
  applyEdits,
  generateICS,
  icsEscape,
  foldICSLine,
  toICSDate,
  toICSDateTime,
  shiftICSDate,
  exportTripJSON,
  importTripJSON,
  encodeShareState,
  decodeShareState,
  buildShareURL,
  clampDayNumber,
  eventEditsFromDays,
  calculateArrivalBuffer,
  computeArrivalOptionCost,
  computeArrivalOptionSummary,
  filterDiningPlaces,
  getDiningRegions,
} from '../src/helpers.js';
import {
  SAMPLE_ITINERARY,
  TRIP_META,
  SAMPLE_BUDGET,
  FRIEND_ARRIVAL_OPTIONS,
  DINING_PLACES,
} from '../src/data/itinerary.js';

describe('金額', () => {
  describe('formatCurrency', () => {
    it('formats 0', () => assert.strictEqual(formatCurrency(0), '¥0'));
    it('formats 6140', () => assert.strictEqual(formatCurrency(6140), '¥6,140'));
    it('formats 195000', () => assert.strictEqual(formatCurrency(195000), '¥195,000'));
    it('rounds fractions', () => assert.strictEqual(formatCurrency(1000.4), '¥1,000'));
    it('survives NaN', () => assert.strictEqual(formatCurrency(undefined), '¥0'));
  });

  describe('perPersonCost', () => {
    it('splits total', () => assert.strictEqual(perPersonCost(6000, 6, false), 1000));
    it('already per person', () => assert.strictEqual(perPersonCost(6140, 6, true), 6140));
    it('handles 0', () => assert.strictEqual(perPersonCost(0, 6, true), 0));
    it('never divides by zero party', () => assert.strictEqual(perPersonCost(6000, 0, false), 6000));
  });

  describe('eventCostPerPerson', () => {
    it('uses per-person cost as-is', () => {
      assert.strictEqual(eventCostPerPerson({ costYen: 6140, perPerson: true }, 6), 6140);
    });
    it('splits costTotal by party size', () => {
      assert.strictEqual(eventCostPerPerson({ costTotal: 6000 }, 6), 1000);
    });
    it('returns 0 for events with no cost', () => {
      assert.strictEqual(eventCostPerPerson({ title: '滑雪' }, 6), 0);
    });
    it('reacts to party size changes', () => {
      assert.strictEqual(eventCostPerPerson({ costTotal: 10500 }, 3), 3500);
    });
  });

  describe('computeDayBudget', () => {
    it('sums per-person costs from events', () => {
      const events = [
        { costYen: 6140, perPerson: true },
        { costYen: 6000, perPerson: false },
      ];
      assert.strictEqual(computeDayBudget(events, 6), 7140);
    });
    it('includes taxi costTotal split across the party', () => {
      // 12/12：巴士 ¥1,850/人 + 計程車 ¥6,000 全團
      const events = [
        { costYen: 1850, perPerson: true },
        { costTotal: 6000 },
      ];
      assert.strictEqual(computeDayBudget(events, 6), 2850);
    });
  });

  it('computeItineraryCost adds every day', () => {
    const days = [
      { events: [{ costYen: 1000, perPerson: true }] },
      { events: [{ costTotal: 600 }] },
    ];
    assert.strictEqual(computeItineraryCost(days, 6), 1100);
  });

  it('computeTotalBudget sums estimatedYen across categories', () => {
    assert.strictEqual(computeTotalBudget([{ estimatedYen: 35000 }, { estimatedYen: 25000 }]), 60000);
  });

  describe('mergeBudgetEdits', () => {
    it('overrides an edited category', () => {
      const merged = mergeBudgetEdits([{ id: 'flight', estimatedYen: 35000 }], { flight: 42000 });
      assert.strictEqual(merged[0].estimatedYen, 42000);
      assert.strictEqual(merged[0].edited, true);
    });
    it('ignores invalid overrides', () => {
      const merged = mergeBudgetEdits([{ id: 'flight', estimatedYen: 35000 }], { flight: -5 });
      assert.strictEqual(merged[0].estimatedYen, 35000);
    });
    it('does not mutate the source array', () => {
      const src = [{ id: 'flight', estimatedYen: 35000 }];
      mergeBudgetEdits(src, { flight: 1 });
      assert.strictEqual(src[0].estimatedYen, 35000);
    });
  });

  it('budgetTotals multiplies by party size', () => {
    const totals = budgetTotals([{ estimatedYen: 1000 }, { estimatedYen: 500 }], 6);
    assert.deepStrictEqual(totals, { perPerson: 1500, group: 9000, partySize: 6 });
  });
});

describe('時間', () => {
  it('timeToMinutes parses HH:MM', () => assert.strictEqual(timeToMinutes('14:45'), 885));
  it('timeToMinutes rejects junk', () => assert.strictEqual(timeToMinutes('晚上'), null));
  it('timeToMinutes rejects impossible clock values', () =>
    assert.strictEqual(timeToMinutes('25:00'), null));
  it('minutesToTime round-trips', () => assert.strictEqual(minutesToTime(885), '14:45'));
  it('minutesToTime wraps past midnight', () => assert.strictEqual(minutesToTime(1500), '01:00'));

  it('sortEventsByTime orders chronologically and keeps untimed last', () => {
    const sorted = sortEventsByTime([
      { id: 'c', time: '18:00' },
      { id: 'a' },
      { id: 'b', time: '06:35' },
    ]);
    assert.deepStrictEqual(sorted.map((e) => e.id), ['b', 'c', 'a']);
  });

  describe('getNextEvent', () => {
    const day = { events: [{ id: 'a', time: '08:30' }, { id: 'b', time: '12:00' }] };
    it('returns first event when the day is not today', () => {
      assert.strictEqual(getNextEvent(day, null).id, 'a');
    });
    it('returns the next upcoming event', () => {
      assert.strictEqual(getNextEvent(day, timeToMinutes('09:00')).id, 'b');
    });
    it('returns null once the day is over', () => {
      assert.strictEqual(getNextEvent(day, timeToMinutes('23:00')), null);
    });
  });
});

describe('日期', () => {
  it('dayIndexOf accepts dayNumber or dayNum', () => {
    assert.strictEqual(dayIndexOf({ dayNumber: 3 }), 3);
    assert.strictEqual(dayIndexOf({ dayNum: 4 }), 4);
  });

  it('filterDaysByRange filters days (dayNum)', () => {
    const days = [{ dayNum: 1 }, { dayNum: 2 }, { dayNum: 3 }, { dayNum: 4 }, { dayNum: 5 }];
    const res = filterDaysByRange(days, 3, 5);
    assert.strictEqual(res.length, 3);
    assert.strictEqual(res[0].dayNum, 3);
    assert.strictEqual(res[2].dayNum, 5);
  });

  it('filterDaysByRange also works on the real itinerary (dayNumber)', () => {
    const res = filterDaysByRange(SAMPLE_ITINERARY, 5, 8);
    assert.strictEqual(res.length, 4);
    assert.strictEqual(res[0].date, '2026-12-15');
  });

  it('parseISODate keeps the calendar date regardless of timezone', () => {
    const d = parseISODate('2026-12-11');
    assert.strictEqual(d.getFullYear(), 2026);
    assert.strictEqual(d.getMonth(), 11);
    assert.strictEqual(d.getDate(), 11);
  });

  it('formatShortDate renders M/D', () => assert.strictEqual(formatShortDate('2026-12-11'), '12/11'));

  describe('getDayProgress', () => {
    it('returns 0 before trip', () => {
      assert.strictEqual(getDayProgress(new Date('2023-10-01'), new Date('2023-11-01'), new Date('2023-11-10')), 0);
    });
    it('returns 100 after trip', () => {
      assert.strictEqual(getDayProgress(new Date('2023-12-01'), new Date('2023-11-01'), new Date('2023-11-10')), 100);
    });
    it('returns percentage mid trip', () => {
      assert.strictEqual(
        getDayProgress(new Date('2023-11-05').getTime(), new Date('2023-11-01').getTime(), new Date('2023-11-09').getTime()),
        50
      );
    });
  });

  it('daysUntil counts whole days', () => {
    assert.strictEqual(daysUntil('2026-12-11', new Date(2026, 11, 1, 23, 0)), 10);
    assert.strictEqual(daysUntil('2026-12-11', new Date(2026, 11, 11, 6, 0)), 0);
    assert.strictEqual(daysUntil('2026-12-11', new Date(2026, 11, 12, 6, 0)), -1);
  });

  describe('resolveActiveDay', () => {
    it('sits on day 1 before departure', () => {
      assert.deepStrictEqual(resolveActiveDay(SAMPLE_ITINERARY, new Date(2026, 8, 23)), {
        dayNumber: 1,
        phase: 'before',
      });
    });
    it('jumps to today during the trip', () => {
      assert.deepStrictEqual(resolveActiveDay(SAMPLE_ITINERARY, new Date(2026, 11, 16, 9, 0)), {
        dayNumber: 6,
        phase: 'during',
      });
    });
    it('stays on the last day after the trip', () => {
      assert.deepStrictEqual(resolveActiveDay(SAMPLE_ITINERARY, new Date(2027, 0, 5)), {
        dayNumber: 10,
        phase: 'after',
      });
    });
  });
});

describe('轉乘風險', () => {
  describe('getTransferRisk', () => {
    it('returns high for < 15 min', () => assert.strictEqual(getTransferRisk(10), 'high'));
    it('returns medium for 15-30 min', () => assert.strictEqual(getTransferRisk(20), 'medium'));
    it('returns low for > 30 min', () => assert.strictEqual(getTransferRisk(40), 'low'));
    it('returns unknown for undefined', () => assert.strictEqual(getTransferRisk(undefined), 'unknown'));
    it('honours a stricter user policy', () => {
      const policy = { tightMinutes: 30, safeMinutes: 60 };
      assert.strictEqual(getTransferRisk(25, policy), 'high');
      assert.strictEqual(getTransferRisk(45, policy), 'medium');
      assert.strictEqual(getTransferRisk(90, policy), 'low');
    });
  });

  it('normalizeBufferPolicy repairs inverted thresholds', () => {
    assert.deepStrictEqual(normalizeBufferPolicy({ tightMinutes: 40, safeMinutes: 10 }), {
      tightMinutes: 40,
      safeMinutes: 40,
    });
    assert.deepStrictEqual(normalizeBufferPolicy({}), { tightMinutes: 15, safeMinutes: 30 });
  });

  it('effectiveBuffer prefers the user override', () => {
    assert.strictEqual(effectiveBuffer({ id: 'e1', bufferMinutes: 75 }, { e1: 20 }), 20);
    assert.strictEqual(effectiveBuffer({ id: 'e1', bufferMinutes: 75 }, {}), 75);
  });

  describe('resolveEventRisk', () => {
    it('computes from the buffer when present', () => {
      const risk = resolveEventRisk({ id: 'e1', bufferMinutes: 75 }, {}, undefined);
      assert.deepStrictEqual(risk, { level: 'low', bufferMinutes: 75, source: 'buffer' });
    });
    it('falls back to the annotated risk level', () => {
      const risk = resolveEventRisk({ id: 'e2', riskLevel: 'high' }, {}, undefined);
      assert.strictEqual(risk.level, 'high');
      assert.strictEqual(risk.source, 'annotated');
    });
    it('reports unknown when there is nothing to go on', () => {
      assert.strictEqual(resolveEventRisk({ id: 'e3' }, {}, undefined).source, 'none');
    });
    it('re-rates a leg when the user tightens the buffer', () => {
      const event = { id: 'd1-e2', bufferMinutes: 75 };
      assert.strictEqual(resolveEventRisk(event, { 'd1-e2': 10 }, undefined).level, 'high');
    });
  });

  it('collectTransferRisks surfaces the 16:18 last bus first', () => {
    const risks = collectTransferRisks(SAMPLE_ITINERARY, {}, undefined);
    assert.ok(risks.length > 0);
    assert.strictEqual(risks[0].level, 'high');
    assert.ok(risks[0].event.title.includes('末班巴士'));
  });
});

describe('搜尋與篩選', () => {
  it('finds query in events', () => {
    const days = [{ events: [{ title: '高崎' }] }, { events: [{ title: 'Tokyo' }] }];
    const res = searchItinerary(days, '高崎');
    assert.strictEqual(res.length, 1);
    assert.strictEqual(res[0].events[0].title, '高崎');
  });
  it('returns empty on empty query', () => {
    assert.deepStrictEqual(searchItinerary([{ events: [{ title: '高崎' }] }], ''), []);
  });
  it('is case-insensitive', () => {
    assert.strictEqual(searchItinerary([{ events: [{ title: 'Tokyo' }] }], 'tok').length, 1);
  });
  it('matches Japanese place names', () => {
    const res = searchItinerary(SAMPLE_ITINERARY, '横手山');
    assert.ok(res.length >= 2);
  });
  it('matches notes, not just titles', () => {
    const res = searchItinerary([{ events: [{ title: '晚餐', notes: '焼鳥コの字' }] }], '焼鳥');
    assert.strictEqual(res.length, 1);
  });
  it('returns the whole day when the day itself matches', () => {
    const res = searchItinerary(SAMPLE_ITINERARY, '志賀高原');
    assert.ok(res.some((d) => d.matchedOn === 'day'));
  });

  it('filterEventsByType filters, empty list means all', () => {
    const events = [{ type: 'ski' }, { type: 'meal' }, { type: 'transit' }];
    assert.strictEqual(filterEventsByType(events, ['ski', 'transit']).length, 2);
    assert.strictEqual(filterEventsByType(events, []).length, 3);
  });

  it('countByType tallies events', () => {
    assert.deepStrictEqual(countByType([{ type: 'ski' }, { type: 'ski' }, { type: 'meal' }]), {
      ski: 2,
      meal: 1,
    });
  });

  it('searchFieldContent finds destinations and phrases', () => {
    const dest = [{ nameZh: '長野站', nameJa: '長野駅' }];
    const cats = [{ label: '交通', phrases: [{ zh: '末班車幾點？', ja: '最終バスは何時ですか？', roma: 'Saishuu basu' }] }];
    assert.strictEqual(searchFieldContent(dest, cats, '長野').destinations.length, 1);
    assert.strictEqual(searchFieldContent(dest, cats, 'saishuu').phrases.length, 1);
    assert.strictEqual(searchFieldContent(dest, cats, '').destinations.length, 1);
  });
});

describe('當日摘要', () => {
  const day = SAMPLE_ITINERARY[3]; // 12/14 高峰山 → 長野

  it('summarizes first/last time and event count', () => {
    const s = summarizeDay(day, 6, {}, undefined);
    assert.strictEqual(s.eventCount, 7);
    assert.strictEqual(s.firstTime, '08:20');
    assert.strictEqual(s.lastTime, '19:00');
  });

  it('counts the high-risk last bus', () => {
    const s = summarizeDay(day, 6, {}, undefined);
    assert.ok(s.highRiskCount >= 1);
  });

  it('flags unconfirmed lodging', () => {
    assert.strictEqual(summarizeDay(day, 6, {}, undefined).lodgingNeedsConfirm, true);
    assert.strictEqual(summarizeDay(SAMPLE_ITINERARY[4], 6, {}, undefined).lodgingNeedsConfirm, false);
  });

  it('scales the day cost with party size', () => {
    const six = summarizeDay(SAMPLE_ITINERARY[1], 6, {}, undefined).costPerPerson;
    const three = summarizeDay(SAMPLE_ITINERARY[1], 3, {}, undefined).costPerPerson;
    assert.ok(three > six, '人越少，計程車均攤越貴');
  });

  it('collectLodgingToConfirm lists every night with a status', () => {
    const rows = collectLodgingToConfirm(SAMPLE_ITINERARY, {});
    assert.ok(rows.some((r) => r.status === 'unconfirmed'));
    assert.ok(rows.some((r) => r.status === 'confirmed' && r.name.includes('2307')));
  });

  it('collectLodgingToConfirm honours user edits', () => {
    const rows = collectLodgingToConfirm(SAMPLE_ITINERARY, {
      '2026-12-11': { name: 'Hotel Metropolitan 高崎', status: 'confirmed' },
    });
    const first = rows.find((r) => r.date === '2026-12-11');
    assert.strictEqual(first.status, 'confirmed');
    assert.strictEqual(first.name, 'Hotel Metropolitan 高崎');
  });
});

describe('applyEdits', () => {
  it('applies buffer, note and lodging overrides without mutating the sample', () => {
    const merged = applyEdits(SAMPLE_ITINERARY, {
      bufferEdits: { 'd1-e2': 20 },
      eventEdits: { 'd1-e2': { userNote: '記得買 Skyliner 票' } },
      lodgingEdits: { '2026-12-11': { name: 'APA 高崎', status: 'confirmed' } },
    });
    const day1 = merged[0];
    const leg = day1.events.find((e) => e.id === 'd1-e2');
    assert.strictEqual(leg.bufferMinutes, 20);
    assert.strictEqual(leg.bufferEdited, true);
    assert.strictEqual(leg.userNote, '記得買 Skyliner 票');
    assert.strictEqual(day1.lodging, 'APA 高崎');
    assert.strictEqual(day1.lodgingStatus, 'confirmed');
    // 原始資料不變
    assert.strictEqual(SAMPLE_ITINERARY[0].events[1].bufferMinutes, 75);
    assert.strictEqual(SAMPLE_ITINERARY[0].lodgingStatus, 'unconfirmed');
  });

  it('leaves untouched days alone', () => {
    const merged = applyEdits(SAMPLE_ITINERARY, {});
    assert.strictEqual(merged.length, SAMPLE_ITINERARY.length);
    assert.strictEqual(merged[4].lodgingStatus, 'confirmed');
  });
});

describe('行事曆 .ics', () => {
  const ics = generateICS(TRIP_META, SAMPLE_ITINERARY, { dtstamp: '20260101T000000Z' });

  it('generates valid ICS string', () => {
    const simple = generateICS(
      { name: 'Japan Trip' },
      [{ date: '2023-11-01', title: 'Day 1', events: [{ summary: 'Tokyo' }] }],
      { dtstamp: '20260101T000000Z' }
    );
    assert.ok(simple.startsWith('BEGIN:VCALENDAR'));
    assert.ok(simple.includes('END:VCALENDAR'));
    assert.ok(simple.includes('BEGIN:VEVENT'));
    assert.ok(simple.includes('Tokyo'));
  });

  it('uses CRLF line endings throughout', () => {
    const bare = ics.replace(/\r\n/g, '');
    assert.ok(!bare.includes('\n'), '不應有單獨的 LF');
  });

  it('balances BEGIN/END blocks', () => {
    const begins = (ics.match(/BEGIN:VEVENT/g) || []).length;
    const ends = (ics.match(/END:VEVENT/g) || []).length;
    assert.strictEqual(begins, ends);
    assert.ok(begins > SAMPLE_ITINERARY.length, '每日總覽之外還要有逐項行程');
  });

  it('declares the Asia/Tokyo timezone and uses it', () => {
    assert.ok(ics.includes('BEGIN:VTIMEZONE'));
    assert.ok(ics.includes('TZID:Asia/Tokyo'));
    assert.ok(ics.includes('DTSTART;TZID=Asia/Tokyo:20261211T144500'));
  });

  it('gives every event a UID and DTSTAMP', () => {
    const uids = ics.match(/UID:/g) || [];
    const stamps = ics.match(/DTSTAMP:/g) || [];
    assert.strictEqual(uids.length, stamps.length);
  });

  it('derives DTEND from endTime when available', () => {
    assert.ok(ics.includes('DTSTART;TZID=Asia/Tokyo:20261212T100000'));
    assert.ok(ics.includes('DTEND;TZID=Asia/Tokyo:20261212T150000'));
  });

  it('adds reminders to transit and flights only', () => {
    assert.ok(ics.includes('TRIGGER:-PT30M'));
    const alarms = (ics.match(/BEGIN:VALARM/g) || []).length;
    const events = (ics.match(/BEGIN:VEVENT/g) || []).length;
    assert.ok(alarms > 0 && alarms < events);
  });

  it('marks estimates as tentative', () => {
    assert.ok(ics.includes('STATUS:TENTATIVE'));
    assert.ok(ics.includes('STATUS:CONFIRMED'));
  });

  it('carries the planning-only disclaimer into descriptions', () => {
    assert.ok(ics.includes('規劃估算'));
  });

  it('folds long lines to 75 octets', () => {
    for (const line of ics.split('\r\n')) {
      assert.ok(Buffer.byteLength(line, 'utf8') <= 75, `行太長: ${line.slice(0, 40)}`);
    }
  });

  it('escapes commas and semicolons', () => {
    const escaped = generateICS(
      { title: 'T' },
      [{ date: '2026-12-11', title: 'a,b;c', events: [] }],
      { dtstamp: '20260101T000000Z' }
    );
    assert.ok(escaped.includes('a\\,b\\;c'));
  });

  it('icsEscape handles newlines and backslashes', () => {
    assert.strictEqual(icsEscape('a\nb\\c'), 'a\\nb\\\\c');
  });

  it('foldICSLine leaves short lines untouched', () => {
    assert.strictEqual(foldICSLine('SUMMARY:短'), 'SUMMARY:短');
  });

  it('date helpers', () => {
    assert.strictEqual(toICSDate('2026-12-11'), '20261211');
    assert.strictEqual(toICSDateTime('2026-12-11', '14:45'), '20261211T144500');
    assert.strictEqual(toICSDateTime('2026-12-11', '晚上'), null);
    assert.strictEqual(shiftICSDate('2026-12-31', 1), '20270101');
  });
});

describe('匯出 / 匯入 / 分享', () => {
  it('exportTripJSON returns valid JSON string', () => {
    const json = exportTripJSON({ name: 'Trip' }, [], {}, 2);
    const obj = JSON.parse(json);
    assert.ok('meta' in obj);
    assert.ok('days' in obj);
    assert.ok('budget' in obj);
    assert.ok('partySize' in obj);
    assert.strictEqual(obj.version, 1);
    assert.ok(obj.disclaimer.includes('規劃估算'));
  });

  it('round-trips the real trip', () => {
    const json = exportTripJSON(TRIP_META, SAMPLE_ITINERARY, SAMPLE_BUDGET, 6);
    const back = importTripJSON(json);
    assert.strictEqual(back.days.length, 10);
    assert.strictEqual(back.partySize, 6);
  });

  it('parses valid JSON', () => {
    const obj = importTripJSON(JSON.stringify({ meta: {}, days: [], budget: {}, partySize: 2 }));
    assert.ok(Array.isArray(obj.days));
  });
  it('throws on invalid JSON', () => assert.throws(() => importTripJSON('invalid')));
  it('throws when days missing', () => {
    assert.throws(() => importTripJSON(JSON.stringify({ meta: {}, budget: {}, partySize: 2 })));
  });
  it('throws when partySize is nonsense', () => {
    assert.throws(() => importTripJSON(JSON.stringify({ days: [], partySize: 0 })));
  });

  it('share state round-trips', () => {
    const state = { partySize: 4, day: 6, bufferPolicy: { tightMinutes: 20, safeMinutes: 45 } };
    assert.deepStrictEqual(decodeShareState(encodeShareState(state)), state);
  });
  it('decodeShareState tolerates garbage', () => {
    assert.strictEqual(decodeShareState('%%%'), null);
    assert.strictEqual(decodeShareState(''), null);
  });
  it('buildShareURL puts state in the hash', () => {
    const url = buildShareURL('https://example.com/Trave_Dec/?a=1', { day: 3 });
    assert.ok(url.startsWith('https://example.com/Trave_Dec/?a=1#s='));
    assert.deepStrictEqual(decodeShareState(url.split('#s=')[1]), { day: 3 });
  });

  describe('eventEditsFromDays', () => {
    it('picks up the notes a traveller typed on the road', () => {
      const edits = eventEditsFromDays([
        { events: [{ id: 'd1-e2', userNote: '月台在 3 番線' }, { id: 'd1-e3' }] },
      ]);
      assert.deepStrictEqual(edits, { 'd1-e2': { userNote: '月台在 3 番線' } });
    });

    it('ignores blank notes and events with no id', () => {
      const edits = eventEditsFromDays([
        { events: [{ id: 'a', userNote: '   ' }, { userNote: '沒有 id' }, { id: 'b' }] },
      ]);
      assert.deepStrictEqual(edits, {});
    });

    it('tolerates junk input', () => {
      assert.deepStrictEqual(eventEditsFromDays(null), {});
      assert.deepStrictEqual(eventEditsFromDays([{}, { events: null }]), {});
    });

    it('round-trips notes through export → import', () => {
      const withNote = applyEdits(SAMPLE_ITINERARY, {
        eventEdits: { 'd4-e4': { userNote: '末班巴士，16:00 就到乘車處' } },
      });
      const parsed = importTripJSON(exportTripJSON(TRIP_META, withNote, SAMPLE_BUDGET, 6));
      assert.deepStrictEqual(eventEditsFromDays(parsed.days), {
        'd4-e4': { userNote: '末班巴士，16:00 就到乘車處' },
      });
    });
  });
});

describe('clampDayNumber', () => {
  it('keeps a day that exists', () => assert.strictEqual(clampDayNumber(7, 10), 7));
  it('pulls a too-large day back to the last day', () =>
    assert.strictEqual(clampDayNumber(9999, 10), 10));
  it('pushes a too-small day up to day 1', () => {
    assert.strictEqual(clampDayNumber(0, 10), 1);
    assert.strictEqual(clampDayNumber(-4, 10), 1);
  });
  it('falls back to day 1 on junk', () => {
    assert.strictEqual(clampDayNumber('nope', 10), 1);
    assert.strictEqual(clampDayNumber(undefined, 10), 1);
  });
  it('rounds fractions', () => assert.strictEqual(clampDayNumber(3.7, 10), 4));
  it('survives an empty trip', () => assert.strictEqual(clampDayNumber(5, 0), 1));
});

describe('範例資料完整性', () => {
  it('covers 2026-12-11 → 12-20', () => {
    assert.strictEqual(SAMPLE_ITINERARY.length, 10);
    assert.strictEqual(SAMPLE_ITINERARY[0].date, TRIP_META.startDate);
    assert.strictEqual(SAMPLE_ITINERARY[9].date, TRIP_META.endDate);
  });

  it('numbers days 1..10 consecutively', () => {
    SAMPLE_ITINERARY.forEach((day, i) => assert.strictEqual(day.dayNumber, i + 1));
  });

  it('gives every event a unique id, a type and a status', () => {
    const ids = new Set();
    for (const day of SAMPLE_ITINERARY) {
      for (const event of day.events) {
        assert.ok(event.id, `缺少 id: ${event.title}`);
        assert.ok(!ids.has(event.id), `id 重複: ${event.id}`);
        ids.add(event.id);
        assert.ok(event.type, `缺少 type: ${event.title}`);
        assert.ok(
          ['confirmed', 'unconfirmed', 'estimate', 'reference'].includes(event.status),
          `status 不合法: ${event.status}`
        );
      }
    }
  });

  it('never marks a timetable estimate as confirmed without a caveat', () => {
    for (const day of SAMPLE_ITINERARY) {
      for (const event of day.events) {
        if (event.type === 'transit' && event.status === 'confirmed') {
          assert.fail(`交通不應標為已確認: ${event.title}`);
        }
      }
    }
  });

  it('keeps source URLs https', () => {
    for (const day of SAMPLE_ITINERARY) {
      for (const event of day.events) {
        if (event.sourceUrl) assert.ok(event.sourceUrl.startsWith('https://'), event.sourceUrl);
      }
    }
  });

  it('budget categories are unique and non-negative', () => {
    const ids = new Set();
    for (const cat of SAMPLE_BUDGET) {
      assert.ok(!ids.has(cat.id));
      ids.add(cat.id);
      assert.ok(cat.estimatedYen >= 0);
    }
  });
});

describe('朋友抵達方案 (12/15 NRT T3 → 2307)', () => {
  describe('calculateArrivalBuffer', () => {
    it('calculates positive buffer when arriving before 19:00 with checkmark', () => {
      const res = calculateArrivalBuffer('15:45', '19:00');
      assert.strictEqual(res.bufferMinutes, 195);
      assert.strictEqual(res.isMet, true);
      assert.strictEqual(res.statusSymbol, '✓');
      assert.ok(res.formattedBuffer.includes('195'));
    });

    it('considers arriving exactly at 19:00 as met', () => {
      const res = calculateArrivalBuffer('19:00', '19:00');
      assert.strictEqual(res.bufferMinutes, 0);
      assert.strictEqual(res.isMet, true);
      assert.strictEqual(res.statusSymbol, '✓');
    });

    it('flags late arrival with warning symbol when arriving after 19:00', () => {
      const res = calculateArrivalBuffer('19:20', '19:00');
      assert.strictEqual(res.bufferMinutes, -20);
      assert.strictEqual(res.isMet, false);
      assert.strictEqual(res.statusSymbol, '⚠');
      assert.ok(res.formattedBuffer.includes('超時'));
    });

    it('defaults target to 19:00 if omitted', () => {
      const res = calculateArrivalBuffer('16:30');
      assert.strictEqual(res.bufferMinutes, 150);
      assert.strictEqual(res.isMet, true);
      assert.strictEqual(res.statusSymbol, '✓');
    });

    it('handles invalid or missing time gracefully', () => {
      const res = calculateArrivalBuffer('invalid');
      assert.strictEqual(res.bufferMinutes, null);
      assert.strictEqual(res.isMet, false);
      assert.strictEqual(res.statusSymbol, '⚠');
    });
  });

  describe('computeArrivalOptionCost', () => {
    const sampleOption = {
      legs: [
        { name: 'Skyliner', costYen: 2580, perPerson: true },
        { name: '新幹線', costYen: 8340, perPerson: true },
        { name: '計程車', costTotal: 15000 },
      ],
    };

    it('splits vehicle costTotal across party size', () => {
      const cost5 = computeArrivalOptionCost(sampleOption, 5);
      // 2580 + 8340 + (15000 / 5 = 3000) = 13920
      assert.strictEqual(cost5.perPerson, 13920);
      assert.strictEqual(cost5.group, 69600);
      assert.strictEqual(cost5.partySize, 5);
    });

    it('recalculates per person cost when party size changes', () => {
      const cost3 = computeArrivalOptionCost(sampleOption, 3);
      // 2580 + 8340 + (15000 / 3 = 5000) = 15920
      assert.strictEqual(cost3.perPerson, 15920);
      assert.strictEqual(cost3.group, 47760);
    });

    it('survives partySize <= 0 or junk by falling back to 1', () => {
      const cost = computeArrivalOptionCost(sampleOption, 0);
      assert.strictEqual(cost.partySize, 1);
      assert.strictEqual(cost.perPerson, 2580 + 8340 + 15000);
    });
  });

  describe('computeArrivalOptionSummary', () => {
    it('enriches option with costs, duration, and buffer info', () => {
      const opt = FRIEND_ARRIVAL_OPTIONS[0]; // Plan A
      const summary = computeArrivalOptionSummary(opt, 5, '19:00');
      assert.ok(summary.costPerPerson > 0);
      assert.ok(summary.costGroup > 0);
      assert.strictEqual(summary.isMet, true);
      assert.strictEqual(summary.statusSymbol, '✓');
      assert.ok(summary.bufferMinutes > 0);
      assert.ok(summary.formattedDuration.includes('小時'));
    });
  });

  describe('FRIEND_ARRIVAL_OPTIONS 資料完整性', () => {
    it('contains exactly 4 options: A, B, C, D', () => {
      assert.strictEqual(FRIEND_ARRIVAL_OPTIONS.length, 4);
      const ids = FRIEND_ARRIVAL_OPTIONS.map((o) => o.id);
      assert.deepStrictEqual(ids, ['plan-a', 'plan-b', 'plan-c', 'plan-d']);
    });

    it('each option has legs chain, estimatedArrival, and official sources', () => {
      for (const opt of FRIEND_ARRIVAL_OPTIONS) {
        assert.ok(opt.name, `缺少名稱: ${opt.id}`);
        assert.ok(opt.estimatedArrival, `缺少抵達時間: ${opt.id}`);
        assert.ok(Array.isArray(opt.legs) && opt.legs.length > 0, `缺少腿段: ${opt.id}`);
        assert.ok(opt.sourceUrl && opt.sourceUrl.startsWith('https://'), `缺少合法 sourceUrl: ${opt.id}`);
        assert.ok(opt.statusNote && opt.statusNote.includes('規劃估算'), `缺少估算說明: ${opt.id}`);
      }
    });

    it('Plan D is marked as 需確認', () => {
      const planD = FRIEND_ARRIVAL_OPTIONS.find((o) => o.id === 'plan-d');
      assert.ok(planD.badge.includes('需確認') || planD.name.includes('需確認'));
      assert.strictEqual(planD.status, 'unconfirmed');
    });

    it('supports taxi cost sharing in Plan C', () => {
      const planC = FRIEND_ARRIVAL_OPTIONS.find((o) => o.id === 'plan-c');
      const taxiLeg = planC.legs.find((leg) => leg.mode === 'taxi' || leg.costTotal != null);
      assert.ok(taxiLeg, 'Plan C 應有計程車腿段');
      assert.ok(taxiLeg.costTotal > 0, '計程車腿段應有 costTotal 全團費用');
    });
  });
});

describe('更多吃喝 (Dining & Drinks)', () => {
  describe('filterDiningPlaces', () => {
    it('returns all places when no filters are set', () => {
      const res = filterDiningPlaces(DINING_PLACES);
      assert.strictEqual(res.length, DINING_PLACES.length);
    });

    it('filters by category: eat vs drink', () => {
      const eats = filterDiningPlaces(DINING_PLACES, { category: 'eat' });
      const drinks = filterDiningPlaces(DINING_PLACES, { category: 'drink' });
      assert.ok(eats.length > 0);
      assert.ok(drinks.length > 0);
      assert.ok(eats.every((p) => p.category === 'eat'));
      assert.ok(drinks.every((p) => p.category === 'drink'));
    });

    it('filters by region', () => {
      const takasaki = filterDiningPlaces(DINING_PLACES, { region: '高崎' });
      assert.ok(takasaki.length >= 3);
      assert.ok(takasaki.every((p) => p.region === '高崎'));
    });

    it('filters by keyword search', () => {
      const res = filterDiningPlaces(DINING_PLACES, { query: '羅宋湯' });
      assert.ok(res.length >= 1);
      assert.ok(res[0].name.includes('橫手山頂ヒュッテ') || res[0].nameJa.includes('横手山頂ヒュッテ'));
    });

    it('combines category, region and search query', () => {
      const res = filterDiningPlaces(DINING_PLACES, {
        region: '長野',
        category: 'drink',
        query: '地酒',
      });
      assert.ok(res.length >= 1);
      assert.strictEqual(res[0].region, '長野');
      assert.strictEqual(res[0].category, 'drink');
    });
  });

  describe('getDiningRegions', () => {
    it('extracts unique regions from dining list', () => {
      const regions = getDiningRegions(DINING_PLACES);
      assert.ok(regions.includes('高崎'));
      assert.ok(regions.includes('佐久平'));
      assert.ok(regions.includes('長野'));
      assert.ok(regions.includes('橫濱'));
      assert.ok(regions.some((r) => r.includes('志賀高原')));
    });
  });

  describe('DINING_PLACES 資料完整性', () => {
    it('contains over 30 verified places from docs and cities', () => {
      assert.ok(DINING_PLACES.length >= 30, `實際只有 ${DINING_PLACES.length} 間`);
    });

    it('every dining place has required fields and valid category', () => {
      const ids = new Set();
      for (const p of DINING_PLACES) {
        assert.ok(p.id, `缺少 id: ${p.name}`);
        assert.ok(!ids.has(p.id), `重複 id: ${p.id}`);
        ids.add(p.id);
        assert.ok(p.name, `缺少中文名: ${p.id}`);
        assert.ok(p.nameJa, `缺少日文名: ${p.id}`);
        assert.ok(['eat', 'drink'].includes(p.category), `category 須為 eat 或 drink: ${p.id}`);
        assert.ok(p.region, `缺少地區: ${p.id}`);
        assert.ok(p.genre, `缺少型態: ${p.id}`);
        assert.ok(p.notes, `缺少備註: ${p.id}`);
        if (p.sourceUrl) {
          assert.ok(p.sourceUrl.startsWith('https://'), `sourceUrl 需為 https: ${p.sourceUrl}`);
        }
      }
    });

    it('includes Yokoteyama Hutte and Daruma Shokudo and Teppa Room', () => {
      assert.ok(DINING_PLACES.some((p) => p.name.includes('橫手山頂ヒュッテ')));
      assert.ok(DINING_PLACES.some((p) => p.name.includes('だるま食堂')));
      assert.ok(DINING_PLACES.some((p) => p.name.includes('TEPPA ROOM')));
    });
  });
});

