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
     A piece is registered to the piece itself the moment it is dispatched (ownershipStatus UNCLAIMED,
     "Awaiting Owner Inscription"). It becomes CLAIMED only when someone completes the Vault Card claim
     with its Archive Serial and Vault Key; the key is then sealed and can never be used again.
     Front-end demonstration: the archive lives in this browser until the House database exists. */
  var REG_KEY = 'manthai.registry', REG = {};
  try { REG = JSON.parse(window.localStorage.getItem(REG_KEY) || '{}') || {}; } catch (e) { REG = {}; }
  function regSave() { try { window.localStorage.setItem(REG_KEY, JSON.stringify(REG)); } catch (e) { /* ignore */ } }
  function fnv(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function digits(n, seed) { var out = '', x = seed >>> 0; while (out.length < n) { x = fnv(String(x) + out.length + seed); out += String(x % 10); } return out; }
  var reg = C.reg = {
    SPECIMEN: { id: 'MNT-A7Q2K9', pid: 'aurelia-gown', size: 'S', edition: 'Edition 01 · Piece 05 of 15', serial: '48291074', key: '7392' },
    all: function () { return REG; },
    get: function (id) { return REG[String(id || '').toUpperCase()] || null; },
    put: function (e) { REG[e.id] = e; regSave(); return e; },
    /* "48291074" -> "MNT · 4829 · 1074" */
    fmt: function (serial) { var d = String(serial || '').replace(/\D/g, ''); return 'MNT · ' + d.slice(0, 4) + ' · ' + d.slice(4, 8); },
    bySerial: function (serial) {
      var d = String(serial || '').replace(/\D/g, '');
      reg.specimen();
      return Object.keys(REG).map(function (k) { return REG[k]; }).filter(function (e) { return e.serial === d; })[0] || null;
    },
    /* a fresh Archive Serial (8 digits after MNT) and Vault Key (4 digits) that no other piece holds */
    credentials: function () {
      var serial, key, taken = {};
      Object.keys(REG).forEach(function (k) { taken[REG[k].serial] = 1; });
      do { serial = String(1 + Math.floor(Math.random() * 9)) + digits(7, Math.random() * 4294967295); } while (taken[serial] || serial === reg.SPECIMEN.serial);
      do { key = digits(4, Math.random() * 4294967295); } while (/^(\d)\1{3}$/.test(key));
      return { serial: serial, key: key };
    },
    /* the sample Solid Metal Vault Card shown on the Maison page: a real, claimable record so the ritual can be tried */
    specimen: function () {
      var s = reg.SPECIMEN;
      if (!REG[s.id]) REG[s.id] = { id: s.id, pid: s.pid, size: s.size, edition: s.edition, serial: s.serial, key: s.key, status: 'UNCLAIMED', specimen: true, issued: new Date().toISOString(), prior: [] };
      return REG[s.id];
    },
    resetSpecimen: function () { delete REG[reg.SPECIMEN.id]; regSave(); return reg.specimen(); },
    /* register a newly acquired piece to the piece itself */
    issue: function (it, order) {
      var c = reg.credentials();
      it.serial = c.serial; it.key = c.key;
      return reg.put({ id: it.passport, pid: it.id, size: it.size, edition: it.edition || '', serial: c.serial, key: c.key, status: 'UNCLAIMED',
        order: order.ref, buyer: String(order.email || '').toLowerCase(), gift: !!order.gift, issued: order.date, prior: [] });
    },
    /* the two keys of the card: Archive Serial + Vault Key */
    /* a one-way digest of a piece's two keys, carried in its public link (never the keys themselves) */
    hash: function (e) { return e.keyHash || fnv(e.id + '|' + e.serial + '|' + e.key).toString(36); },
    check: function (serial, key, ctxId) {
      var d = String(serial || '').replace(/\D/g, ''), e = reg.bySerial(d), ctx = ctxId && reg.get(ctxId);
      if (!e && ctx && ctx.keyHash && fnv(ctx.id + '|' + d + '|' + key).toString(36) === ctx.keyHash) { ctx.serial = d; ctx.key = String(key); reg.put(ctx); e = ctx; }
      if (!e || e.key !== String(key || '')) return { err: 'mismatch' };
      if (ctx && ctx.id !== e.id) return { err: 'mismatch' };
      if (e.status !== 'UNCLAIMED') return { err: 'claimed', entry: e };
      return { entry: e };
    },
    claim: function (id, person, via) {
      var e = reg.get(id); if (!e || e.status !== 'UNCLAIMED') return null;
      e.status = 'CLAIMED'; e.keySealed = true; e.via = via || 'card';
      e.owner = { title: person.title || '', first: C.cleanName(person.first), last: C.cleanName(person.last), email: String(person.email || '').toLowerCase() };
      e.inscribedAt = new Date().toISOString();
      reg.put(e); reg.mirror(e);
      return e;
    },
    /* the owner's own pieces ride in their Private Circle record, so the vault follows them to any device */
    mirror: function (e) {
      var list = (C.state.inscriptions || []).filter(function (x) { return x.id !== e.id; });
      var me = C.state.member && String(C.state.member.email).toLowerCase();
      if (e.owner && e.owner.email === me) list.push(JSON.parse(JSON.stringify(e)));
      C.state.inscriptions = list; C.save();
    },
    merge: function (list) {
      (list || []).forEach(function (x) { var cur = REG[x.id]; if (!cur || (x.inscribedAt || '') >= (cur.inscribedAt || '')) REG[x.id] = x; });
      regSave();
    },
    ownedBy: function (email) {
      email = String(email || '').toLowerCase();
      return Object.keys(REG).map(function (k) { return REG[k]; }).filter(function (e) { return e.status === 'CLAIMED' && e.owner && e.owner.email === email; })
        .sort(function (a, b) { return String(b.inscribedAt).localeCompare(String(a.inscribedAt)); });
    },
    /* Heirloom transfer: a private invitation, valid seven days, which the new custodian accepts in their own name */
    startTransfer: function (id, email) {
      var e = reg.get(id); if (!e || e.status !== 'CLAIMED') return null;
      e.transfer = { email: String(email).trim().toLowerCase(), token: digits(6, Math.random() * 4294967295) + fnv(id + Date.now()).toString(36).toUpperCase(), created: new Date().toISOString(), expires: new Date(Date.now() + 7 * 864e5).toISOString() };
      reg.put(e); reg.mirror(e); return e;
    },
    cancelTransfer: function (id) { var e = reg.get(id); if (!e) return null; e.transfer = null; reg.put(e); reg.mirror(e); return e; },
    acceptTransfer: function (id, token, person) {
      var e = reg.get(id);
      if (!e || !e.transfer || e.transfer.token !== token) return { err: 'invalid' };
      if (new Date(e.transfer.expires).getTime() < Date.now()) return { err: 'expired' };
      if (String(person.email).toLowerCase() !== e.transfer.email) return { err: 'email' };
      var prev = e.owner;
      (e.prior = e.prior || []).push({ from: e.inscribedAt, to: new Date().toISOString(), initials: prev ? C.initialsOf(prev) : '' });
      e.owner = { title: person.title || '', first: C.cleanName(person.first), last: C.cleanName(person.last), email: String(person.email).toLowerCase() };
      e.inscribedAt = new Date().toISOString(); e.via = 'transfer'; e.transfer = null;
      reg.put(e); reg.mirror(e);
      return { entry: e };
    }
  };
  /* every order this browser knows enters the archive: pieces acquired before the House Archive existed were
     bound to their buyer at acquisition and enter it as claimed; later pieces return awaiting inscription */
  reg.fromOrders = function () {
    var changed = false;
    (C.state.orders || []).forEach(function (o) {
      if (o.cancelled) return;
      (o.items || []).forEach(function (it) {
        if (!it.passport || REG[it.passport]) return;
        changed = true;
        if (it.serial && it.key) {
          REG[it.passport] = { id: it.passport, pid: it.id, size: it.size, edition: it.edition || '', serial: it.serial, key: it.key, status: 'UNCLAIMED',
            order: o.ref, buyer: String(o.email || '').toLowerCase(), gift: !!o.gift, issued: o.date, prior: [] };
          return;
        }
        var seed = fnv(it.passport);
        it.serial = String(1 + (seed % 9)) + digits(7, seed); it.key = digits(4, seed ^ 0x5bd1e995);
        var nm = C.splitName(o.name);
        REG[it.passport] = { id: it.passport, pid: it.id, size: it.size, edition: '', serial: it.serial, key: it.key, status: 'CLAIMED', keySealed: true, via: 'acquisition',
          owner: { title: '', first: nm.first, last: nm.last, email: String(o.email || '').toLowerCase() }, inscribedAt: o.date, order: o.ref, buyer: String(o.email || '').toLowerCase(), issued: o.date, prior: [] };
      });
    });
    if (changed) regSave();
  };
  reg.fromOrders();
  reg.merge(C.state.inscriptions);

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
