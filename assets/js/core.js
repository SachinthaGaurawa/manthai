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
  /* pieces from earlier collections resolve to the live Phase 1 piece that took their place, so every
     order, passport and Vault card reads its name, edition, fibre and care from the live catalogue */
  C.LEGACY = {
    'meridian-blazer': 'vespera-blazer', 'meridian-trousers': 'vespera-trousers',
    'meridian-silk-shirt': 'alabaster-slip', 'mantai-silk-trouser': 'vespera-trousers',
    'alstroemeria-gown': 'aurelia-gown', 'ceylon-rosette-mullet': 'solstice-midi', 'mahatittha-lace-midi': 'solstice-midi',
    'anuradhapura-silk-midi': 'solstice-midi', 'serendib-column': 'alabaster-slip', 'kotiya-noir-mini': 'alabaster-slip',
    'sovereign-wave-blazer': 'vespera-blazer', 'mannar-pearl-cape': 'nocturne-cape-top'
  };
  C.product = function (id) { id = C.LEGACY[id] || id; return M.PRODUCTS.filter(function (p) { return p.id === id; })[0]; };

  /* ---------- tiny event bus ---------- */
  var handlers = {};
  C.on = function (ev, fn) { (handlers[ev] = handlers[ev] || []).push(fn); };
  C.emit = function (ev, data) { (handlers[ev] || []).forEach(function (fn) { fn(data); }); };

  /* ---------- state (persisted in this browser only) ---------- */
  var DEFAULTS = { currency: 'LKR', bag: [], member: null, accounts: {}, orders: [], notify: {}, stylist: null, wishlist: [], gift: { on: false, note: '' }, addresses: [], fitSize: '',
    profile: {}, security: {}, passkeys: {}, consults: [], savedSize: {}, stockAlerts: {} };
  C.state = JSON.parse(JSON.stringify(DEFAULTS));
  try {
    var raw = window.localStorage.getItem(M.CONFIG.storageKey);
    /* every saved key comes back, not only the ones listed in DEFAULTS (profile, date of birth, addresses, security...) */
    if (raw) { var saved = JSON.parse(raw); if (saved && typeof saved === 'object') Object.keys(saved).forEach(function (k) { if (saved[k] !== undefined && saved[k] !== null || k === 'member' || k === 'stylist') C.state[k] = saved[k]; }); }
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

  /* ---------- older saved orders: renamed pieces keep their link, and every order carries a delivery date ---------- */
  var RENAMED = C.LEGACY;
  (C.state.wishlist || []).forEach(function (id, i, a) { if (RENAMED[id]) a[i] = RENAMED[id]; });
  if (C.state.wishlist) C.state.wishlist = C.state.wishlist.filter(function (id, i, a) { return a.indexOf(id) === i; });
  (C.state.orders || []).forEach(function (o) {
    (o.items || []).forEach(function (it) {
      if (!RENAMED[it.id]) return;
      it.id = RENAMED[it.id];
      var np = M.PRODUCTS.filter(function (x) { return x.id === it.id; })[0];
      if (np) { it.name = np.name; it.short = np.short; }
    });
    if (!C.DELIVERY[o.ship]) o.ship = 'colombo';
    if (!o.arrive || isNaN(new Date(o.arrive).getTime())) o.arrive = C.addBusinessDays(C.DELIVERY[o.ship].days, o.date || Date.now()).toISOString();
  });
  /* ---------- the House Archive: one item-bound record per physical piece ----------
     The archive lives on the House server (api/vault), never in this browser. A piece is paired at the
     atelier to its Concealed Authenticity Seal (NTAG 424 DNA) and its Solid Metal Vault Card. Ownership is
     inscribed only after a genuine seal tap (Gate 1) and the matching Archive Serial and Vault Key from a
     signed-in member (Gate 2). This file only asks the server and keeps, in memory, what it answered.
     On localhost alone, assets/js/vault-dev.js stands in for the server so the House can rehearse the ritual
     before the seals arrive; it is never loaded anywhere else. */
  try { window.localStorage.removeItem('manthai.registry'); window.localStorage.removeItem('manthai.passports'); } catch (e) { /* ignore */ }
  if (C.state.inscriptions) { delete C.state.inscriptions; }
  var DEV = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  var CACHE = {}, devLoading = null;
  function devServer() {
    if (M.vaultDev) return Promise.resolve(M.vaultDev);
    if (!devLoading) devLoading = new Promise(function (ok, no) {
      var sc = document.createElement('script'); sc.src = '/assets/js/vault-dev.js?v=' + Date.now();
      sc.onload = function () { ok(M.vaultDev); }; sc.onerror = no; document.head.appendChild(sc);
    });
    return devLoading;
  }
  function idToken() {
    if (!C.state.member || !M.ui || !M.ui.auth || !M.ui.auth.idToken) return Promise.resolve('');
    return M.ui.auth.idToken().then(null, function () { return ''; });
  }
  function fail(code, extra) { var e = new Error(code); e.code = code; e.extra = extra || {}; return e; }
  var reg = C.reg = {
    DEV: DEV,
    /* "48291074" -> "MNT · 4829 · 1074" */
    fmt: function (serial) { var d = String(serial || '').replace(/\D/g, ''); return 'MNT · ' + d.slice(0, 4) + ' · ' + d.slice(4); },
    get: function (id) { return CACHE[String(id || '').toUpperCase()] || null; },
    remember: function (r) { if (r && r.id) CACHE[r.id] = r; return r; },
    forget: function () { CACHE = {}; reg.loaded = false; },
    ownedBy: function () { return Object.keys(CACHE).map(function (k) { return CACHE[k]; }).filter(function (e) { return e.mine && e.status === 'CLAIMED'; })
      .sort(function (a, b) { return String(b.inscribedAt).localeCompare(String(a.inscribedAt)); }); },
    loaded: false,
    /* one call to the House Archive: { op, body } -> the server's JSON, or an Error with .code */
    call: function (op, body, method) {
      method = method || (body ? 'POST' : 'GET');
      return idToken().then(function (tok) {
        if (DEV) return devServer().then(function (d) { return d.call(op, body || {}, C.state.member); });
        var url = '/api/vault/' + op + (method === 'GET' && body ? '?' + Object.keys(body).map(function (k) { return k + '=' + encodeURIComponent(body[k]); }).join('&') : '');
        var h = { 'Content-Type': 'application/json' }; if (tok) h.Authorization = 'Bearer ' + tok;
        return fetch(url, { method: method, headers: h, body: method === 'POST' ? JSON.stringify(body || {}) : undefined, credentials: 'same-origin', cache: 'no-store' })
          .then(function (r) { return r.json().then(null, function () { return {}; }).then(function (j) { if (!r.ok) throw fail(j.error || 'server', j); return j; }); }, function () { throw fail('offline'); });
      });
    },
    tap: function (q) { return reg.call('tap', { uid: q.uid, ctr: q.ctr, cmac: q.cmac }).then(function (j) { if (j.piece && j.piece.mine) reg.remember(j.piece); return j; }); },
    session: function (s) { return reg.call('session', { session: s }); },
    claim: function (b) { return reg.call('claim', b).then(function (j) { reg.remember(j.piece); C.emit('vault'); return j; }); },
    piece: function (id) { return reg.call('piece', { id: id }, 'GET').then(function (j) { if (j.piece.mine) reg.remember(j.piece); return j.piece; }); },
    mine: function () {
      if (!C.state.member) { reg.forget(); return Promise.resolve([]); }
      return reg.call('mine', null, 'GET').then(function (j) {
        Object.keys(CACHE).forEach(function (k) { if (CACHE[k].mine) delete CACHE[k]; });
        (j.pieces || []).forEach(reg.remember); reg.loaded = true; return j.pieces || [];
      });
    },
    acquisitions: function () { return C.state.member ? reg.call('acquisitions', null, 'GET') : Promise.resolve({ awaiting: [], gifts: [] }); },
    startTransfer: function (id, email) { return reg.call('transfer-start', { id: id, email: email }).then(function (j) { j.piece.link = location.origin + '/verify?transfer=' + encodeURIComponent(j.token); reg.remember(j.piece); return j.piece; }); },
    cancelTransfer: function (id) { return reg.call('transfer-cancel', { id: id }).then(function (j) { reg.remember(j.piece); return j.piece; }); },
    viewTransfer: function (t) { return reg.call('transfer-view', { token: t }); },
    acceptTransfer: function (t, person) { return reg.call('transfer-accept', { token: t, person: person }).then(function (j) { reg.remember(j.piece); C.emit('vault'); return j.piece; }); }
  };

  /* a piece from an earlier collection, no longer in the catalogue: the House Seal stands in for its photograph */
  C.archivePlate = function () { return '<span class="plate-archive" aria-hidden="true"><svg viewBox="0 0 1000 860"><use href="#spiral-seal"/></svg></span>'; };
  /* the passport still opens for such a piece, from what its order recorded */
  C.archivedProduct = function (it) {
    return { id: it.id, name: it.name, short: it.short || it.name, archived: true, media: {}, edition: 0, remaining: 0,
      materials: 'Natural silk and fine wool, as woven on the origin label set beneath the back facing.',
      provenance: 'Cut on the stand and hand-finished in the Colombo atelier',
      care: 'Steam on the reverse at a distance and never press. Store hanging in the supplied garment bag.' };
  };
  /* "Edition 01 \u00b7 Piece 05 of 15": numbered editions and small batches share one form; offset numbers a second piece of the same order */
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  C.editionLabel = function (p, offset) {
    var total = p && (p.edition || p.batch);
    if (!total) return 'Edition 01';
    var n = Math.min(total, Math.max(1, total - (p.remaining || 0) + 1 + (offset || 0)));
    return 'Edition 01 \u00b7 Piece ' + pad2(n) + ' of ' + pad2(total);
  };
  /* an edition string carried by an older link (an older "Piece 3 of 15" form) is re-read in today's form */
  C.normEdition = function (e, p) {
    e = String(e || '');
    if (/^Edition \d+ \u00b7 Piece \d+ of \d+$/.test(e)) return e;
    var m = /Piece (\d+) of (\d+)/.exec(e);
    return m ? 'Edition 01 \u00b7 Piece ' + pad2(+m[1]) + ' of ' + pad2(+m[2]) : C.editionLabel(p);
  };

  /* ---------- plate html (real photo wins over placeholder) ---------- */
  /* product photos ship at 600, 900 and 1200 wide; the browser picks the one the frame needs */
  C.srcset = function (src) {
    if (!/\/assets\/media\/products\/.+\.webp$/.test(src)) return '';
    var b = src.slice(0, -5);
    return b + '-600.webp 600w, ' + b + '-900.webp 900w, ' + src + ' 1200w';
  };
  C.SIZES = { card: '(max-width: 768px) 92vw, 30vw', thumb: '160px', full: '100vw', pdp: '(max-width: 768px) 92vw, 52vw', pair: '(max-width: 768px) 46vw, 30vw', pillar: '(max-width: 768px) 94vw, 38vw' };
  C.plateHTML = function (p, view, sizes) {
    if (p && p.archived) return C.archivePlate();
    var src = p.media && p.media[view];
    var ss = src ? C.srcset(src) : '';
    if (src) return '<img src="' + C.esc(src) + '"' + (ss ? ' srcset="' + ss + '" sizes="' + (C.SIZES[sizes] || sizes || '(max-width: 768px) 92vw, 40vw') + '" width="1200" height="1500"' : '') + ' alt="' + C.esc(p.name) + '" loading="lazy" decoding="async" data-ph-id="' + C.esc(p.id) + '" data-ph-view="' + C.esc(view) + '">';
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
  /* ---------- names: Title (optional), First Name and Last Name, kept apart everywhere ----------
     Letters in any script, spaces, hyphens, apostrophes and full stops: De Silva, Perera-Fernando, O'Connor */
  C.TITLES = ['Mr.', 'Ms.', 'Mrs.', 'Miss', 'Dr.', 'Prof.', 'Mx.', 'Prefer not to say'];
  C.validName = function (v) {
    v = String(v == null ? '' : v).trim();
    if (!v || v.length > 60) return false;
    try { return /^[\p{L}\p{M}][\p{L}\p{M}\s'’.\-]*$/u.test(v); } catch (e) { return /^[A-Za-zÀ-ɏ][A-Za-zÀ-ɏ\s'’.\-]*$/.test(v); }
  };
  C.cleanName = function (v) { return String(v || '').trim().replace(/\s+/g, ' ').replace(/\s*-\s*/g, '-'); };
  /* an older single "full name" splits once: the first word is the first name, the rest the last name */
  C.splitName = function (full) {
    var w = C.cleanName(full).split(' ').filter(Boolean);
    return { first: w[0] || '', last: w.slice(1).join(' ') };
  };
  C.titleOf = function (t) { return t && t !== 'Prefer not to say' ? t : ''; };
  /* { title, first, last } -> "Ms. Amara De Silva" (withTitle) or "Amara De Silva" */
  C.formalName = function (n, withTitle) {
    if (!n) return '';
    var t = withTitle ? C.titleOf(n.title) : '';
    return [t, C.cleanName(n.first), C.cleanName(n.last)].filter(Boolean).join(' ');
  };
  C.initialsOf = function (n) { return ((String((n && n.first) || '').trim().charAt(0)) + (String((n && n.last) || '').trim().charAt(0))).toUpperCase() || 'M'; };
  /* the signed-in client's name, read from their profile (or split once from an older single name) */
  C.person = function () {
    var m = C.state.member, pr = C.state.profile || {};
    if (!m) return null;
    var n = { title: pr.title || '', first: pr.firstName || '', last: pr.lastName || '', email: m.email };
    if (!n.first && !n.last) { var s = C.splitName(m.name); n.first = s.first; n.last = s.last; }
    return n;
  };
  C.nameComplete = function () { var n = C.person(); return !!(n && C.validName(n.first) && C.validName(n.last)); };
  /* write a name to the profile and keep member.name (used by older screens) in step */
  C.setPerson = function (n) {
    var m = C.state.member; if (!m) return;
    var pr = C.state.profile || (C.state.profile = {});
    if (n.title !== undefined) pr.title = n.title;
    pr.firstName = C.cleanName(n.first); pr.lastName = C.cleanName(n.last);
    m.name = C.formalName({ first: pr.firstName, last: pr.lastName });
    var ac = C.state.accounts && C.state.accounts[String(m.email).toLowerCase()]; if (ac) { ac.name = m.name; ac.firstName = pr.firstName; ac.lastName = pr.lastName; }
  };
  /* Crockford-style ids without lookalikes (no 0, O, 1, I or L), so a serial read aloud or typed from a card is never mistaken */
  C.SAFE = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  C.safeCode = function (n, len) { var s = ''; n = n >>> 0; for (var i = 0; i < len; i++) { s = C.SAFE.charAt(n % 31) + s; n = Math.floor(n / 31); if (!n) n = (i + 7) * 2654435761 >>> 0; } return s; };
  C.uid = function (prefix) {
    var s = '';
    for (var i = 0; i < 5; i++) s += C.SAFE.charAt(Math.floor(Math.random() * C.SAFE.length));
    return prefix + '-' + s;
  };
})();
