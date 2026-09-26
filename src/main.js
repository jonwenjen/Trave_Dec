/**
 * Trave_Dec — 泰國甲米跳島浮潛 2027/05
 *
 * 單一趟旅程的規劃頁。進入點只負責三件事：
 *  1. 主題（深／淺）切換與持久化
 *  2. 離線狀態徽章
 *  3. 把控制權交給甲米區塊（src/krabi-ui.js）
 *
 * 網站刻意不連接即時天氣、海況或船班 API：2027 年 5 月的實際資料尚未公布。
 */

import './style.css';
import { createKrabiSection } from './krabi-ui.js';

const $ = (id) => document.getElementById(id);

/** HTML 跳脫保護 */
function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
   甲米區塊
   ═════════════════════════════════════════════════════════════════ */

const krabi = createKrabiSection({ getEl: $, esc, toast });

/* ═════════════════════════════════════════════════════════════════
   啟動
   ═════════════════════════════════════════════════════════════════ */

function init() {
  initTheme();
  renderOfflineBadge();

  $('theme-toggle')?.addEventListener('click', toggleTheme);
  window.addEventListener('online', renderOfflineBadge);
  window.addEventListener('offline', renderOfflineBadge);

  krabi.render();
  krabi.wire();

  // 註冊 Service Worker（離線支援核心內容）
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
