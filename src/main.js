/**
 * Trave_Dec — 2027/03/29 – 04/05 普吉與安達曼海重評
 *
 * 單一趟旅程的規劃頁。進入點只負責四件事：
 *  1. 主題（深／淺）切換與持久化
 *  2. 離線狀態徽章
 *  3. 人數調整（驅動所有費用試算）
 *  4. 把控制權交給重評區塊（src/ui-reeval.js）
 *
 * 網站刻意不連接即時天氣、海況或船班 API：2027 年 3 月的實際資料尚未公布。
 */

import './style.css';
import { createReevalSection } from './ui-reeval.js';

const $ = (id) => document.getElementById(id);

/* ═════════════════════════════════════════════════════════════════
   Toast
   ═════════════════════════════════════════════════════════════════ */

let toastTimer = null;
function toast(message) {
  const node = $('toast');
  if (!node) return;
  node.textContent = message;
  node.classList.add('toast--visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('toast--visible'), 2800);
}

/* ═════════════════════════════════════════════════════════════════
   主題（深／淺）
   ═════════════════════════════════════════════════════════════════ */

const THEME_KEY = 'trave_dec_theme';

function prefersDark() {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

function initTheme() {
  let saved = null;
  try {
    saved = localStorage.getItem(THEME_KEY);
  } catch {
    /* 無痕模式：退回系統偏好 */
  }
  if (saved === 'dark' || saved === 'light') {
    document.documentElement.setAttribute('data-theme', saved);
  } else {
    document.documentElement.setAttribute('data-theme', prefersDark() ? 'dark' : 'light');
  }
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const next = isDark ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    /* 儲存失敗不影響切換本身 */
  }
  toast(next === 'dark' ? '已切換為深色模式 🌙' : '已切換為暖紙淺色模式 ☀️');
}

/* ═════════════════════════════════════════════════════════════════
   離線狀態
   ═════════════════════════════════════════════════════════════════ */

function isOffline() {
  if (typeof navigator === 'undefined' || typeof navigator.onLine !== 'boolean') return false;
  return !navigator.onLine;
}

function renderOfflineBadge() {
  const badge = $('offline-badge');
  if (badge) badge.hidden = !isOffline();
}

/* ═════════════════════════════════════════════════════════════════
   人數（驅動所有費用試算）
   ═════════════════════════════════════════════════════════ */

const TRAVELERS_KEY = 'trave_dec_travelers';
let travelers = 2;

function loadTravelers() {
  try {
    const v = Number(localStorage.getItem(TRAVELERS_KEY));
    if (Number.isInteger(v) && v >= 1 && v <= 20) travelers = v;
  } catch {
    /* 保留預設 */
  }
}

function saveTravelers() {
  try {
    localStorage.setItem(TRAVELERS_KEY, String(travelers));
  } catch {
    /* 儲存失敗不影響試算 */
  }
}

let reeval = null;
const onTravelersChange = () => {
  if (reeval) reeval.refreshTravelers(travelers);
};

function renderTravelersInput() {
  const input = $('travelers-input');
  const out = $('travelers-out');
  if (input) input.value = String(travelers);
  if (out) out.textContent = `${travelers} 人`;
}

function wireTravelers() {
  const input = $('travelers-input');
  if (!input) return;
  input.addEventListener('input', () => {
    const v = Number(input.value);
    if (!Number.isInteger(v) || v < 1 || v > 20) return;
    travelers = v;
    saveTravelers();
    renderTravelersInput();
    onTravelersChange();
  });
}

/* ═════════════════════════════════════════════════════════════════
   啟動
   ═════════════════════════════════════════════════════════════════ */

function init() {
  initTheme();
  renderOfflineBadge();
  loadTravelers();

  $('theme-toggle')?.addEventListener('click', toggleTheme);
  window.addEventListener('online', renderOfflineBadge);
  window.addEventListener('offline', renderOfflineBadge);

  renderTravelersInput();
  wireTravelers();

  reeval = createReevalSection({ travelers });
  onTravelersChange();

  if ('serviceWorker' in navigator && import.meta.env && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
