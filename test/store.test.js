import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  STORAGE_KEY,
  TAB_IDS,
  getDefaultState,
  normalizeState,
  loadState,
  saveState,
  resetState,
  hasSavedState,
  isOffline,
} from '../src/store.js';

/** 最小 localStorage 替身 */
function fakeStorage(initial) {
  const map = new Map(Object.entries(initial || {}));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    get size() {
      return map.size;
    },
  };
}

function throwingStorage() {
  return {
    getItem() {
      throw new Error('blocked');
    },
    setItem() {
      throw new Error('quota exceeded');
    },
    removeItem() {
      throw new Error('blocked');
    },
  };
}

describe('getDefaultState', () => {
  it('defaults to a party of six on day one', () => {
    const s = getDefaultState();
    assert.strictEqual(s.partySize, 6);
    assert.strictEqual(s.currentDay, 1);
    assert.strictEqual(s.activeTab, 'operate');
    assert.deepStrictEqual(s.bufferPolicy, { tightMinutes: 15, safeMinutes: 30 });
  });

  it('returns a fresh object each time', () => {
    const a = getDefaultState();
    a.budgetEdits.flight = 1;
    assert.deepStrictEqual(getDefaultState().budgetEdits, {});
  });
});

describe('normalizeState', () => {
  it('keeps valid values', () => {
    const s = normalizeState({ partySize: 4, currentDay: 7, activeTab: 'budget' });
    assert.strictEqual(s.partySize, 4);
    assert.strictEqual(s.currentDay, 7);
    assert.strictEqual(s.activeTab, 'budget');
  });

  it('rejects an impossible party size', () => {
    assert.strictEqual(normalizeState({ partySize: 0 }).partySize, 6);
    assert.strictEqual(normalizeState({ partySize: -3 }).partySize, 6);
    assert.strictEqual(normalizeState({ partySize: 'six' }).partySize, 6);
    assert.strictEqual(normalizeState({ partySize: 500 }).partySize, 6);
  });

  it('rounds fractional party sizes', () => {
    assert.strictEqual(normalizeState({ partySize: 4.6 }).partySize, 5);
  });

  it('repairs an inverted buffer policy', () => {
    const s = normalizeState({ bufferPolicy: { tightMinutes: 60, safeMinutes: 5 } });
    assert.deepStrictEqual(s.bufferPolicy, { tightMinutes: 60, safeMinutes: 60 });
  });

  it('keeps a partial buffer policy merged with defaults', () => {
    const s = normalizeState({ bufferPolicy: { safeMinutes: 45 } });
    assert.deepStrictEqual(s.bufferPolicy, { tightMinutes: 15, safeMinutes: 45 });
  });

  it('drops non-object edit maps', () => {
    const s = normalizeState({ budgetEdits: 'nope', eventEdits: null, typeFilters: 'ski' });
    assert.deepStrictEqual(s.budgetEdits, {});
    assert.deepStrictEqual(s.eventEdits, {});
    assert.deepStrictEqual(s.typeFilters, []);
  });

  it('keeps edit maps it understands', () => {
    const s = normalizeState({
      budgetEdits: { flight: 42000 },
      bufferEdits: { 'd1-e2': 20 },
      lodgingEdits: { '2026-12-11': { name: 'APA', status: 'confirmed' } },
      typeFilters: ['ski', 'transit'],
    });
    assert.strictEqual(s.budgetEdits.flight, 42000);
    assert.strictEqual(s.bufferEdits['d1-e2'], 20);
    assert.strictEqual(s.lodgingEdits['2026-12-11'].name, 'APA');
    assert.deepStrictEqual(s.typeFilters, ['ski', 'transit']);
  });

  it('tolerates undefined input', () => {
    assert.deepStrictEqual(normalizeState(undefined), getDefaultState());
  });

  it('accepts every real tab id', () => {
    for (const tab of TAB_IDS) {
      assert.strictEqual(normalizeState({ activeTab: tab }).activeTab, tab);
    }
  });

  it('falls back to 行程 for a tab that does not exist', () => {
    // 一個被手改過的分享連結不該讓整個畫面變空白
    assert.strictEqual(normalizeState({ activeTab: 'bogus' }).activeTab, 'operate');
    assert.strictEqual(normalizeState({ activeTab: '' }).activeTab, 'operate');
    assert.strictEqual(normalizeState({ activeTab: 42 }).activeTab, 'operate');
  });

  it('clamps a day number that is past the end of the trip', () => {
    assert.strictEqual(normalizeState({ currentDay: 9999 }).currentDay, TRIP_DAY_COUNT);
    assert.strictEqual(normalizeState({ currentDay: 0 }).currentDay, 1);
  });
});

describe('load / save / reset', () => {
  it('round-trips through storage', () => {
    const storage = fakeStorage();
    const state = { ...getDefaultState(), partySize: 4, budgetEdits: { flight: 42000 } };
    assert.strictEqual(saveState(state, storage), true);
    const loaded = loadState(storage);
    assert.strictEqual(loaded.partySize, 4);
    assert.strictEqual(loaded.budgetEdits.flight, 42000);
    assert.ok(loaded.lastSaved, 'should stamp lastSaved');
  });

  it('returns defaults when nothing is saved', () => {
    assert.deepStrictEqual(loadState(fakeStorage()), getDefaultState());
  });

  it('returns defaults when the saved blob is corrupt', () => {
    const storage = fakeStorage({ [STORAGE_KEY]: '{not json' });
    assert.deepStrictEqual(loadState(storage), getDefaultState());
  });

  it('sanitizes a tampered save', () => {
    const storage = fakeStorage({ [STORAGE_KEY]: JSON.stringify({ partySize: -1, currentDay: 0 }) });
    const loaded = loadState(storage);
    assert.strictEqual(loaded.partySize, 6);
    assert.strictEqual(loaded.currentDay, 1);
  });

  it('reset clears the save', () => {
    const storage = fakeStorage();
    saveState(getDefaultState(), storage);
    assert.strictEqual(hasSavedState(storage), true);
    assert.strictEqual(resetState(storage), true);
    assert.strictEqual(hasSavedState(storage), false);
  });

  it('degrades gracefully when storage throws', () => {
    const storage = throwingStorage();
    assert.deepStrictEqual(loadState(storage), getDefaultState());
    assert.strictEqual(saveState(getDefaultState(), storage), false);
    assert.strictEqual(resetState(storage), false);
    assert.strictEqual(hasSavedState(storage), false);
  });

  it('degrades gracefully with no storage at all', () => {
    assert.deepStrictEqual(loadState(null), getDefaultState());
  });
});

describe('isOffline', () => {
  it('assumes online when navigator is unavailable', () => {
    assert.strictEqual(isOffline(), false);
  });
});
