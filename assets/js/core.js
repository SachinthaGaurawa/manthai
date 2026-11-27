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
  /* a numbered disclosure reference: a quiet superscript that leads to note N in the Maison Notes band */
  C.dref = function (n) { return '<a class="dref" href="#maison-disclosure-' + n + '" data-dref="' + n + '" aria-label="Read disclosure note ' + n + '">' + n + '</a>'; };
  /* the formal issuer block at the top of every receipt and record */
  C.issuerHTML = function () {
    var c = M.CONFIG.company || {}, reg = [['Company Reg. No.', c.regNo], ['TIN', c.tin], ['VAT No.', c.vat]].filter(function (x) { return x[1]; });
    return '<div class="issuer"><p class="issuer__n">' + C.esc(c.name) + '</p><p>' + C.esc(c.line) + '</p><p><a href="mailto:' + C.esc(c.email) + '">' + C.esc(c.email) + '</a></p>' +
      (reg.length ? '<p class="issuer__reg">' + reg.map(function (x) { return C.esc(x[0]) + ' ' + C.esc(x[1]); }).join(' · ') + '</p>' : '') + '</div>';
  };
  C.reduced = function () { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; };
  C.product = function (id) { return M.PRODUCTS.filter(function (p) { return p.id === id; })[0]; };

  /* ---------- tiny event bus ---------- */
  var handlers = {};
  C.on = function (ev, fn) { (handlers[ev] = handlers[ev] || []).push(fn); };
  C.emit = function (ev, data) { (handlers[ev] || []).forEach(function (fn) { fn(data); }); };

  /* ---------- state (persisted in this browser only) ---------- */
  var DEFAULTS = { currency: 'LKR', bag: [], member: null, accounts: {}, orders: [], notify: {}, stylist: null, wishlist: [], gift: { on: false, note: '' }, addresses: [], fitSize: '' };
  C.state = JSON.parse(JSON.stringify(DEFAULTS));
  try {
    var raw = window.localStorage.getItem(M.CONFIG.storageKey);
    if (raw) { var saved = JSON.parse(raw); Object.keys(DEFAULTS).forEach(function (k) { if (saved[k] !== undefined) C.state[k] = saved[k]; }); }
  } catch (e) { /* storage unavailable: run in memory */ }
  C.state.currency = M.MARKET.currency; /* Phase 1: storefront locked to Sri Lanka, LKR */
  C.state.bag = (C.state.bag || []).filter(function (l) { return C.product(l.id); });
  C.save = function () { try { window.localStorage.setItem(M.CONFIG.storageKey, JSON.stringify(C.state)); } catch (e) { /* ignore */ } };

  /* ---------- pricing: the single formatter every price passes through ----------
     Amounts are authored in LKR. Phase 1 renders LKR only ("LKR 48,000"). For Phase 2, add a currency
     to M.CURRENCIES and pass its code; conversion and rounding already live here. */
  C.formatPrice = function (amountLKR, code) {
    var c = M.CURRENCIES[code || C.state.currency] || M.CURRENCIES.LKR;
    var v = amountLKR * c.rate;
    v = c.code === 'LKR' ? Math.round(v) : Math.round(v / 5) * 5;
    return c.code + ' ' + v.toLocaleString('en-US');
  };
  C.price = C.formatPrice;
  M.formatPrice = C.formatPrice;
  C.isLocal = function () { return true; };

  /* ---------- bag helpers ---------- */
  C.qtyOf = function (id) { return C.state.bag.reduce(function (n, l) { return n + (l.id === id ? l.qty : 0); }, 0); };
  C.available = function (p) { return Math.max(0, p.remaining - C.qtyOf(p.id)); };
  C.bagCount = function () { return C.state.bag.reduce(function (n, l) { return n + l.qty; }, 0); };
  C.bagTotalLKR = function () { return C.state.bag.reduce(function (n, l) { return n + l.qty * C.product(l.id).price; }, 0); };
  C.lineKey = function (id, size) { return id + '|' + (size || '-'); };
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
    dlg.showModal();
    /* layers marked data-history close with the browser's Back button instead of leaving the page */
    if (dlg.hasAttribute('data-history')) { try { history.pushState({ layer: dlg.id, route: history.state && history.state.route, slug: history.state && history.state.slug }, ''); dlg._pushed = true; } catch (e) { /* ignore */ } }
    locks += 1; document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(function () { requestAnimationFrame(function () { dlg.classList.add('is-in'); }); });
    C.emit('open', dlg);
  };
  C.close = function (dlg) {
    if (!dlg || !dlg.open || dlg._closing) return;
    dlg._closing = true; dlg.classList.remove('is-in');
    if (dlg._pushed) { dlg._pushed = false; if (!dlg._popped && history.state && history.state.layer === dlg.id) { try { history.back(); } catch (e) { /* ignore */ } } }
    dlg._popped = false;
    setTimeout(function () {
      dlg.close(); dlg._closing = false;
      locks = Math.max(0, locks - 1); if (!locks) document.documentElement.style.overflow = '';
      var o = dlg._opener; if (o && document.contains(o) && o.focus) { try { o.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
      C.emit('close', dlg);
    }, C.reduced() ? 0 : 560);
  };
  window.addEventListener('popstate', function () {
    C.$$('dialog.layer[data-history]').forEach(function (d) {
      if (d.open && d._pushed && !(history.state && history.state.layer === d.id)) { d._popped = true; C.close(d); }
    });
  });
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
  /* Short hops glide (Lenis when it is running). Long jumps pass under a brief obsidian veil instead of a long scroll. */
  C.scrollTo = function (id) {
    var el = document.getElementById(id); if (!el) return;
    var cn = document.querySelector('.chapnav'), sub = cn && cn.offsetParent ? cn.offsetHeight : 0;
    var off = -(parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10) || 72) - sub + 1;
    var top = el.getBoundingClientRect().top + window.scrollY + off, far = Math.abs(top - window.scrollY) > window.innerHeight * 1.6;
    var veil = C.$('#veil');
    function jump(smooth) {
      if (C.lenis) C.lenis.scrollTo(top, { immediate: !smooth, duration: 1.1 });
      else window.scrollTo({ top: top, behavior: smooth ? 'smooth' : 'auto' });
    }
    if (C.reduced()) { jump(false); return; }
    if (far && veil) {
      veil.classList.add('is-on');
      setTimeout(function () { jump(false); requestAnimationFrame(function () { veil.classList.remove('is-on'); }); }, 260);
    } else jump(true);
  };

  /* ---------- delivery dates: business days, Colombo calendar ---------- */
  C.addBusinessDays = function (n, from) {
    var d = new Date(from || Date.now());
    while (n > 0) { d.setDate(d.getDate() + 1); var w = d.getDay(); if (w !== 0 && w !== 6) n -= 1; }
    return d;
  };
  C.fmtDay = function (d) { return d.toLocaleDateString('en-GB', { weekday: 'long' }) + ', ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };
  C.DELIVERY = {
    colombo: { label: 'Complimentary Priority Colombo Delivery (Colombo 01–15)', days: 2 },
    island: { label: 'Complimentary Insured Courier Delivery (Islandwide)', days: 4 },
    atelier: { label: 'Private Colombo Collection', days: 1, atelier: true }
  };
  C.deliveryWhen = function (key) {
    var o = C.DELIVERY[key] || C.DELIVERY.colombo;
    if (o.atelier) return 'Ready ' + C.fmtDay(C.addBusinessDays(o.days)) + ', 2:00 PM IST';
    return 'Arrives by ' + C.fmtDay(C.addBusinessDays(o.days));
  };

  /* ---------- plate html (real photo wins over placeholder) ---------- */
  C.plateHTML = function (p, view) {
    var src = p.media && p.media[view];
    if (src) return '<img src="' + C.esc(src) + '" alt="' + C.esc(p.name) + '" loading="lazy" decoding="async" data-ph-id="' + C.esc(p.id) + '" data-ph-view="' + C.esc(view) + '">';
    return M.Art.plate(p, view);
  };

  /* real photos wait on the pearl well and fade in once loaded */
  document.addEventListener('load', function (e) { var t = e.target; if (t && t.tagName === 'IMG' && t.hasAttribute('data-ph-id')) t.classList.add('is-loaded'); }, true);

  /* a missing or broken photo falls back to the atmospheric plate instead of showing a broken image */
  document.addEventListener('error', function (e) {
    var t = e.target; if (!t || t.tagName !== 'IMG') return;
    var id = t.getAttribute('data-ph-id'), p = id && C.product(id); if (!p) return;
    var holder = document.createElement('span'); holder.innerHTML = M.Art.plate(p, t.getAttribute('data-ph-view'));
    if (holder.firstChild) t.replaceWith(holder.firstChild);
  }, true);

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
