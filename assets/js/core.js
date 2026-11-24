/* ==========================================================================
   MANTHAI  |  core: state, currency, layers, toast, helpers
   ========================================================================== */
(function () {
  'use strict';
  var M = window.MANTHAI;
  var C = (M.core = {});

  C.$ = function (s, el) { return (el || document).querySelector(s); };
  C.$$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  C.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  C.reduced = function () { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; };
  C.product = function (id) { return M.PRODUCTS.filter(function (p) { return p.id === id; })[0]; };

  /* ---------- tiny event bus ---------- */
  var handlers = {};
  C.on = function (ev, fn) { (handlers[ev] = handlers[ev] || []).push(fn); };
  C.emit = function (ev, data) { (handlers[ev] || []).forEach(function (fn) { fn(data); }); };

  /* ---------- state (persisted in this browser only) ---------- */
  var DEFAULTS = { currency: 'LKR', bag: [], member: null, measurements: null, orders: [], notify: {}, stylist: null };
  C.state = JSON.parse(JSON.stringify(DEFAULTS));
  try {
    var raw = window.localStorage.getItem(M.CONFIG.storageKey);
    if (raw) { var saved = JSON.parse(raw); Object.keys(DEFAULTS).forEach(function (k) { if (saved[k] !== undefined) C.state[k] = saved[k]; }); }
  } catch (e) { /* storage unavailable: run in memory */ }
  if (!M.CURRENCIES[C.state.currency]) C.state.currency = 'LKR';
  C.state.bag = (C.state.bag || []).filter(function (l) { return C.product(l.id); });
  C.save = function () { try { window.localStorage.setItem(M.CONFIG.storageKey, JSON.stringify(C.state)); } catch (e) { /* ignore */ } };

  /* ---------- currency ---------- */
  var FX = (C.FX = {
    /* Indicative rates live in catalog.js. Replace refresh() with a live feed call that updates M.CURRENCIES[code].rate. */
    refresh: function () { return Promise.resolve(M.CURRENCIES); },
    convert: function (lkr, code) {
      code = code || C.state.currency;
      var v = lkr * M.CURRENCIES[code].rate;
      return code === 'LKR' ? Math.round(v) : Math.round(v / 5) * 5;
    },
    format: function (lkr, code) {
      code = code || C.state.currency;
      return code + ' ' + FX.convert(lkr, code).toLocaleString('en-US');
    }
  });
  C.price = function (lkr) { return FX.format(lkr); };
  C.setCurrency = function (code) {
    if (!M.CURRENCIES[code]) return;
    C.state.currency = code; C.save();
    document.documentElement.setAttribute('data-currency', code);
    C.$$('[data-price]').forEach(function (el) { el.textContent = C.price(Number(el.getAttribute('data-price'))); });
    C.$$('[data-region-code]').forEach(function (el) { el.textContent = code; });
    var rl = C.$('#regionLabel'); if (rl) rl.innerHTML = '<span class="rg-long">' + C.esc(M.CURRENCIES[code].region) + ' · </span>' + code;
    C.emit('currency', code);
  };
  C.isLocal = function () { return C.state.currency === 'LKR'; };

  /* ---------- bag helpers ---------- */
  C.qtyOf = function (id) { return C.state.bag.reduce(function (n, l) { return n + (l.id === id ? l.qty : 0); }, 0); };
  C.available = function (p) { return Math.max(0, p.remaining - C.qtyOf(p.id)); };
  C.bagCount = function () { return C.state.bag.reduce(function (n, l) { return n + l.qty; }, 0); };
  C.bagTotalLKR = function () { return C.state.bag.reduce(function (n, l) { return n + l.qty * C.product(l.id).price; }, 0); };
  C.lineKey = function (id, size, bespoke) { return id + '|' + (size || '-') + '|' + (bespoke ? 'b' : 's'); };
  C.updateBagUI = function () {
    var n = C.bagCount(), badge = C.$('#bagCount'), btn = C.$('#bagBtn');
    badge.textContent = n; badge.classList.toggle('has-items', n > 0);
    btn.setAttribute('aria-label', 'Private Bag, ' + n + (n === 1 ? ' item' : ' items'));
  };

  /* ---------- layers: native <dialog> with slide and fade transitions ---------- */
  var locks = 0;
  C.open = function (dlg) {
    if (!dlg || dlg.open) return;
    dlg._opener = document.activeElement;
    var pop = C.$('#regionPop'); if (pop && !pop.hidden) C.hideRegion();
    dlg.showModal();
    locks += 1; document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(function () { requestAnimationFrame(function () { dlg.classList.add('is-in'); }); });
    C.emit('open', dlg);
  };
  C.close = function (dlg) {
    if (!dlg || !dlg.open || dlg._closing) return;
    dlg._closing = true; dlg.classList.remove('is-in');
    setTimeout(function () {
      dlg.close(); dlg._closing = false;
      locks = Math.max(0, locks - 1); if (!locks) document.documentElement.style.overflow = '';
      var o = dlg._opener; if (o && document.contains(o) && o.focus) { try { o.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
      C.emit('close', dlg);
    }, C.reduced() ? 0 : 560);
  };
  C.$$('dialog.layer').forEach(function (dlg) {
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); C.close(dlg); });
    dlg.addEventListener('click', function (e) {
      var t = e.target.closest('[data-close]');
      if (t && dlg.contains(t)) { e.preventDefault(); C.close(dlg); }
    });
  });

  /* ---------- toast (popover so it sits above open dialogs) ---------- */
  var toastEl, toastTimer;
  C.toast = function (msg) {
    toastEl = toastEl || C.$('#toast');
    if (toastEl.popover === undefined || toastEl.popover === null) { /* no popover support: stays in normal flow */ }
    else if (!toastEl.hasAttribute('popover')) toastEl.setAttribute('popover', 'manual');
    toastEl.textContent = msg;
    try { if (toastEl.hasAttribute('popover') && toastEl.matches(':popover-open')) toastEl.hidePopover(); if (toastEl.hasAttribute('popover')) toastEl.showPopover(); } catch (e) { /* ignore */ }
    void toastEl.offsetWidth; toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('is-on');
      setTimeout(function () { try { if (toastEl.hasAttribute('popover') && toastEl.matches(':popover-open')) toastEl.hidePopover(); } catch (e) { /* ignore */ } }, 500);
    }, 3200);
  };

  /* ---------- scrolling ---------- */
  C.scrollTo = function (id) {
    var el = document.getElementById(id); if (!el) return;
    el.scrollIntoView({ behavior: C.reduced() ? 'auto' : 'smooth', block: 'start' });
  };

  /* ---------- plate html (real photo wins over placeholder) ---------- */
  C.plateHTML = function (p, view) {
    var src = p.media && p.media[view];
    if (src) return '<img src="' + C.esc(src) + '" alt="' + C.esc(p.name) + '" loading="lazy" decoding="async">';
    return M.Art.plate(p, view);
  };

  /* ---------- form helpers ---------- */
  C.setError = function (field, msg) {
    var wrap = field.closest('.field'); if (!wrap) return;
    var err = C.$('.field__error', wrap);
    wrap.classList.toggle('has-error', !!msg);
    field.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) err.textContent = msg || '';
  };
  C.validEmail = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim()); };
  C.validPhone = function (v) { return String(v).replace(/[^\d]/g, '').length >= 7; };
  C.uid = function (prefix) { return prefix + '-' + Math.random().toString(36).slice(2, 7).toUpperCase(); };
})();
