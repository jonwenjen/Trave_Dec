/**
 * Trave_Dec — 持久化模組
 *
 * localStorage 讀寫。所有存取都容忍失敗（無痕模式、配額滿、被封鎖），
 * 失敗時退回預設狀態，讓 App 仍可離線使用。
 */

import { DEFAULT_BUFFER_POLICY, normalizeBufferPolicy } from './helpers.js';

export const STORAGE_KEY = 'trave_dec_state';
export const STATE_VERSION = 1;

/**
 * @typedef {Object} AppState
 * @property {number} version
 * @property {number} partySize
 * @property {number} currentDay
 * @property {string} activeTab
 * @property {string[]} typeFilters - 行程類型篩選
 * @property {{tightMinutes:number, safeMinutes:number}} bufferPolicy
 * @property {Object<string, number>} budgetEdits - 分類 id → 已修改金額
 * @property {Object<string, object>} eventEdits - 事件 id → 已修改欄位（目前為 userNote）
 * @property {Object<string, number>} bufferEdits - 事件 id → 自訂緩衝分鐘
 * @property {Object<string, {name?:string,status?:string}>} lodgingEdits - 日期 → 住宿
 * @property {string|null} lastSaved
 */

/** @returns {AppState} */
export function getDefaultState() {
  return {
    version: STATE_VERSION,
    partySize: 6,
    currentDay: 1,
    activeTab: 'operate',
    typeFilters: [],
    bufferPolicy: { ...DEFAULT_BUFFER_POLICY },
    budgetEdits: {},
    eventEdits: {},
    bufferEdits: {},
    lodgingEdits: {},
    lastSaved: null,
  };
}

const PLAIN_OBJECT_KEYS = ['budgetEdits', 'eventEdits', 'bufferEdits', 'lodgingEdits'];

function plainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

/**
 * 把任意來源（存檔、分享連結、匯入檔）的資料收斂成合法狀態。
 * @param {Partial<AppState>} raw
 * @param {AppState} [base]
 * @returns {AppState}
 */
export function normalizeState(raw, base) {
  const defaults = base || getDefaultState();
  const input = plainObject(raw);
  const state = { ...defaults };

  const partySize = Math.round(Number(input.partySize));
  if (Number.isFinite(partySize) && partySize >= 1 && partySize <= 99) {
    state.partySize = partySize;
  }

  const currentDay = Math.round(Number(input.currentDay));
  if (Number.isFinite(currentDay) && currentDay >= 1) {
    state.currentDay = currentDay;
  }

  if (typeof input.activeTab === 'string' && input.activeTab) {
    state.activeTab = input.activeTab;
  }

  if (Array.isArray(input.typeFilters)) {
    state.typeFilters = input.typeFilters.filter((t) => typeof t === 'string');
  }

  state.bufferPolicy = normalizeBufferPolicy({
    ...defaults.bufferPolicy,
    ...plainObject(input.bufferPolicy),
  });

  for (const key of PLAIN_OBJECT_KEYS) {
    state[key] = { ...defaults[key], ...plainObject(input[key]) };
  }

  if (typeof input.lastSaved === 'string') state.lastSaved = input.lastSaved;
  state.version = STATE_VERSION;
  return state;
}

function getStorage(storage) {
  if (storage) return storage;
  try {
    // 只在瀏覽器取用，避免在 Node 測試環境觸發實驗性 Web Storage。
    return (typeof window !== 'undefined' && window.localStorage) || null;
  } catch {
    return null;
  }
}

/** 從 localStorage 載入；沒有存檔或毀損就回預設 */
export function loadState(storage) {
  const store = getStorage(storage);
  if (!store) return getDefaultState();
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    return normalizeState(JSON.parse(raw));
  } catch {
    return getDefaultState();
  }
}

/** 儲存到 localStorage，回傳是否成功 */
export function saveState(state, storage) {
  const store = getStorage(storage);
  if (!store) return false;
  try {
    const toSave = { ...normalizeState(state), lastSaved: new Date().toISOString() };
    store.setItem(STORAGE_KEY, JSON.stringify(toSave));
    return true;
  } catch {
    return false;
  }
}

/** 清除存檔，回到範例資料 */
export function resetState(storage) {
  const store = getStorage(storage);
  if (!store) return false;
  try {
    store.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

/** 是否有存檔（用來顯示「已在本機保存」） */
export function hasSavedState(storage) {
  const store = getStorage(storage);
  if (!store) return false;
  try {
    return store.getItem(STORAGE_KEY) != null;
  } catch {
    return false;
  }
}

/** 偵測離線狀態；環境不支援時視為線上 */
export function isOffline() {
  if (typeof navigator === 'undefined' || typeof navigator.onLine !== 'boolean') return false;
  return !navigator.onLine;
}
