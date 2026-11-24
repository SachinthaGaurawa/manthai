/* ==========================================================================
   MANTHAI  |  shop: gallery, product drawer, loupe, measurements, bag, checkout
   ========================================================================== */
(function () {
  'use strict';
  var M = window.MANTHAI, C = M.core, $ = C.$, $$ = C.$$, esc = C.esc;
  var shop = (M.shop = {});
  var X = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="1.1"/></svg>';

  function P(lkr) { return '<span data-price="' + lkr + '">' + C.price(lkr) + '</span>'; }
  function pieceNo(p) { return p.edition ? p.edition - p.remaining + 1 : 0; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function editionLabel(p) { return p.edition ? 'EDITION ' + pad(pieceNo(p)) + ' / ' + p.edition : ''; }
  function scarcityText(p) {
    var a = C.available(p);
    if (a <= 0) return 'Every remaining piece is held in a private bag.';
    if (a <= 5) return 'Only ' + a + (a === 1 ? ' piece' : ' pieces') + ' remaining in this atelier edition.';
    return 'Held in the Colombo atelier and ready to be prepared.';
  }

  /* ======================= collection gallery ======================= */
  var tab = 'All', io;
  function rowPlan(n) { if (n === 8) return [3, 2, 3]; if (n <= 3) return [n]; var out = [], left = n, cyc = [3, 2], k = 0; while (left > 0) { var t = Math.min(cyc[k % 2], left); if (left - t === 1) t += 1; out.push(t); left -= t; k++; } return out; }
  function filtered() { return tab === 'All' ? M.PRODUCTS.slice() : M.PRODUCTS.filter(function (p) { return p.tabs.indexOf(tab) > -1; }); }

  function renderTabs() {
    $('#filterTabs').innerHTML = M.TABS.map(function (t) {
      return '<button class="tab" role="tab" type="button" data-tab="' + esc(t) + '" aria-selected="' + (t === tab) + '" tabindex="' + (t === tab ? 0 : -1) + '">' + esc(t) + '</button>';
    }).join('');
  }
  function cardHTML(p, i, size, row) {
    var cls = 'card' + (size === 2 ? ' is-wide' : '') + (size === 1 ? ' is-solo' : '');
    if ((size === 2 && row === 1) || (size === 3 && row === 1)) cls += ' is-drop';
    var ed = editionLabel(p);
    return '<article class="' + cls + '" data-id="' + p.id + '">' +
      '<button class="card__frame" type="button" data-open="' + p.id + '" tabindex="-1" aria-hidden="true" data-media-slot="' + p.id + '" data-prompt="' + esc(p.prompt) + '">' +
      '<span class="plate plate--a">' + C.plateHTML(p, 'form') + '</span><span class="plate plate--b">' + C.plateHTML(p, 'move') + '</span>' +
      '<span class="card__quick">Quick View</span></button>' +
      '<div class="card__meta">' + (ed ? '<p class="card__edition">' + ed + '</p>' : '') +
      '<h3 class="card__name"><button type="button" data-open="' + p.id + '">' + esc(p.name) + '</button></h3>' +
      '<p class="card__price">' + P(p.price) + '</p></div></article>';
  }
  function renderGallery() {
    var list = filtered(), plan = rowPlan(list.length), html = '', idx = 0;
    plan.forEach(function (size, row) {
      for (var j = 0; j < size; j++) { var p = list[idx++]; if (!p) break; html += cardHTML(p, idx, size, j === 1 ? 1 : 0); }
    });
    var g = $('#gallery'); g.innerHTML = html || '<p class="empty">Nothing in this room yet.</p>';
    $('#collectionCount').textContent = list.length + (list.length === 1 ? ' piece' : ' pieces') + (tab === 'All' ? '' : ' in ' + tab);
    observeCards();
  }
  function observeCards() {
    var cards = $$('#gallery .card');
    if (!('IntersectionObserver' in window)) { cards.forEach(function (c) { c.classList.add('in'); }); return; }
    if (io) io.disconnect();
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.style.transitionDelay = (Math.min(cards.indexOf(e.target), 3) * 90) + 'ms'; e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    cards.forEach(function (c) { io.observe(c); });
  }
  shop.setFilter = function (t, scroll) {
    if (M.TABS.indexOf(t) < 0) t = 'All';
    tab = t; renderTabs(); renderGallery();
    if (scroll) C.scrollTo('collection');
  };
  $('#filterTabs').addEventListener('click', function (e) { var b = e.target.closest('.tab'); if (b) shop.setFilter(b.getAttribute('data-tab')); });
  $('#filterTabs').addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    var i = M.TABS.indexOf(tab) + (e.key === 'ArrowRight' ? 1 : -1); i = (i + M.TABS.length) % M.TABS.length;
    shop.setFilter(M.TABS[i]); var nb = $('.tab[aria-selected="true"]'); if (nb) nb.focus();
  });
  $('#gallery').addEventListener('click', function (e) { var b = e.target.closest('[data-open]'); if (b) shop.openProduct(b.getAttribute('data-open'), b); });

  /* ======================= product drawer ======================= */
  var pdp = null, loupeApi = null;
  var VIEWS = [['form', 'Front View', 'Front'], ['back', 'Back View', 'Back'], ['detail', 'Bodice & Textile 4x Macro', 'Macro 4x'], ['move', 'Drape in Motion', 'In motion']];

  function pdpHTML(p) {
    var ed = editionLabel(p);
    var prov = p.provenance + (p.edition ? ' · Piece ' + pad(pieceNo(p)) + ' of ' + p.edition : '');
    var sizes = '';
    if (p.sizing === 'apparel') {
      sizes = ['XS', 'S', 'M', 'L', 'XL'].map(function (s) {
        var out = p.soldOut.indexOf(s) > -1;
        return '<button type="button" class="size" role="radio" data-size="' + s + '" aria-checked="false"' + (out ? ' aria-disabled="true" title="Sold out"' : '') + '>' + s + '</button>';
      }).join('');
    } else {
      sizes = '<button type="button" class="size" role="radio" aria-checked="true" data-size="' + esc(p.sizeLabel) + '">' + esc(p.sizeLabel) + '</button>';
    }
    return '' +
      '<div class="pdp on-light">' +
      '<button class="icon-btn pdp__close" type="button" data-close aria-label="Close product"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="1.1"/></svg></button>' +
      '<div class="pdp__gallery">' +
        '<div class="viewtabs" role="group" aria-label="Choose an angle">' + VIEWS.map(function (v, i) { return '<button type="button" class="viewtab" data-view="' + v[0] + '" aria-pressed="' + (i === 0) + '">' + v[1] + '</button>'; }).join('') + '</div>' +
        '<div class="stage" id="stage" tabindex="0" role="group" aria-label="' + esc(p.name) + ' images" aria-describedby="stageHint" data-media-slot="' + p.id + '-gallery" data-prompt="' + esc(p.prompt) + '">' +
          VIEWS.map(function (v, i) { return '<div class="plate' + (i === 0 ? ' is-on' : '') + '" data-view="' + v[0] + '">' + C.plateHTML(p, v[0]) + '</div>'; }).join('') +
          '<div class="loupe" id="loupe" aria-hidden="true"><div class="loupe__view"></div><span class="loupe__tag">4×</span></div>' +
          '<div class="stage__bar"><button class="btn btn--sm" type="button" id="loupeToggle" aria-pressed="true">Loupe 4×</button></div>' +
        '</div>' +
        '<p class="sr-only" id="stageHint">Loupe: move the pointer over the image, or focus it and use the arrow keys, to magnify the fabric four times.</p>' +
        '<div class="thumbs" role="group" aria-label="Choose an image">' + VIEWS.map(function (v, i) {
          return '<button class="thumb" type="button" data-view="' + v[0] + '" aria-pressed="' + (i === 0) + '" aria-label="' + v[1] + '">' + C.plateHTML(p, v[0]) + '<span>' + v[2] + '</span></button>';
        }).join('') + '</div>' +
      '</div>' +
      '<div class="pdp__details">' +
        (ed ? '<p class="pdp__edition">' + ed + '</p>' : '') +
        '<div><h2 class="pdp__name" id="pdpTitle">' + esc(p.name) + '</h2></div>' +
        '<p class="pdp__price">' + P(p.price) + '</p>' +
        '<p class="pdp__summary">' + esc(p.summary) + '</p>' +
        '<div class="provenance"><b>Artisanal provenance</b><span>' + esc(prov) + '</span></div>' +
        '<div><div class="opt-label"><span id="sizeLabel">Size</span><button class="link-btn" type="button" data-sizeguide>Size &amp; Fit Guide</button></div>' +
          '<div class="sizes" role="radiogroup" aria-labelledby="sizeLabel" id="sizes">' + sizes + '</div>' +
          '<p class="model-note">Model is ' + M.MODEL.height + ' and wears Size ' + M.MODEL.size + '.</p>' +
          '<p class="field__error" id="sizeError" role="alert"></p></div>' +
        '<p class="scarcity" id="scarcity">' + esc(scarcityText(p)) + '</p>' +
        '<div class="pdp__cta">' +
          '<button class="btn btn--solid" type="button" data-add><span class="btn__label">Add to Private Bag</span></button>' +
          '<button class="btn btn--ghost btn--block" type="button" data-stylist>Speak with a Maison Stylist</button>' +
          '<button class="badge-btn" type="button" data-passport="' + p.id + '">Verify via Digital Product Passport (NFC)</button>' +
          '<p class="cost-note">Complimentary White-Glove Insured Delivery across Sri Lanka · International DHL Express DDP (All Duties Included)</p>' +
        '</div>' +
        '<div>' +
          '<details><summary>The craft</summary><p>' + esc(p.story) + '</p></details>' +
          '<details><summary>Material &amp; garment care</summary><p><b>Materials.</b> ' + esc(p.materials) + '</p><p><b>This piece.</b> ' + esc(p.care) + '</p><ul class="care-list">' + M.CARE.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul></details>' +
          '<details><summary>Digital Product Passport</summary><p>Every piece carries an embedded NFC heritage tag. Tap it with a phone to open the passport: where the piece was made, its edition, and how to care for it. A 32 pt Gold-Gilded Uncoated Cotton Story Card arrives with it.</p></details>' +
        '</div>' +
      '</div></div>' +
      '<div class="pdp__sticky"><span class="pdp__price">' + P(p.price) + '</span><button class="btn btn--solid" type="button" data-add><span class="btn__label">Add to Private Bag</span></button></div>';
  }

  shop.openProduct = function (id) {
    var p = C.product(id); if (!p) return;
    pdp = { p: p, size: p.sizing === 'apparel' ? null : p.sizeLabel, view: 'form' };
    $('#pdpPanel').innerHTML = pdpHTML(p);
    $('#layerPdp').setAttribute('aria-labelledby', 'pdpTitle');
    C.open($('#layerPdp'));
    initLoupe();
    syncAddButtons();
  };

  function syncAddButtons() {
    if (!pdp) return;
    var a = C.available(pdp.p);
    $$('#pdpPanel [data-add]').forEach(function (b) {
      b.disabled = a <= 0;
      if (!b.classList.contains('is-reserved')) b.querySelector('.btn__label').textContent = a <= 0 ? 'Held in private bags' : 'Add to Private Bag';
    });
    var s = $('#scarcity'); if (s) s.textContent = scarcityText(pdp.p);
  }

  function setView(v) {
    pdp.view = v;
    $$('#stage .plate').forEach(function (pl) { pl.classList.toggle('is-on', pl.getAttribute('data-view') === v); });
    $$('#pdpPanel .thumb, #pdpPanel .viewtab').forEach(function (t) { t.setAttribute('aria-pressed', t.getAttribute('data-view') === v); });
    if (loupeApi) loupeApi.refresh();
  }

  function fittingBooked() { return !!(C.state.stylist && C.state.stylist.topic === M.FITTING); }
  function addToBag() {
    var p = pdp.p, err = $('#sizeError');
    if (p.sizing === 'apparel' && !pdp.size) {
      err.textContent = 'Please choose a size.';
      var first = $('#sizes .size:not([aria-disabled="true"])'); if (first) first.focus();
      return;
    }
    if (C.available(p) <= 0) { C.toast('Every remaining piece is held in a private bag.'); return; }
    var size = pdp.size, key = C.lineKey(p.id, size, false);
    var line = C.state.bag.filter(function (l) { return l.key === key; })[0];
    if (line) line.qty += 1; else C.state.bag.push({ key: key, id: p.id, size: size, qty: 1 });
    C.save(); C.updateBagUI(); C.emit('bag');
    $$('#pdpPanel [data-add]').forEach(function (b) {
      b.classList.add('is-reserved'); b.querySelector('.btn__label').textContent = 'Reserved in Your Bag';
      setTimeout(function () { b.classList.remove('is-reserved'); syncAddButtons(); }, 2400);
    });
    var s = $('#scarcity'); if (s) s.textContent = scarcityText(p);
    C.toast(p.short + ' is reserved in your Private Bag.');
  }

  $('#pdpPanel').addEventListener('click', function (e) {
    if (!pdp) return;
    var t;
    if ((t = e.target.closest('.thumb, .viewtab'))) { setView(t.getAttribute('data-view')); return; }
    if (e.target.closest('[data-sizeguide]')) { shop.openSize(pdp.p.id); return; }
    if ((t = e.target.closest('.size'))) {
      if (t.getAttribute('aria-disabled') === 'true') { C.toast('That size is sold out in this edition.'); return; }
      if (pdp.p.sizing !== 'apparel') return;
      pdp.size = t.getAttribute('data-size'); $$('#sizes .size').forEach(function (s) { s.setAttribute('aria-checked', s === t); }); $('#sizeError').textContent = ''; return;
    }
    if (e.target.closest('[data-add]')) { addToBag(); return; }
    if (e.target.closest('[data-stylist]')) { M.ui.openStylist(pdp.p.id); return; }
    if ((t = e.target.closest('[data-passport]'))) { M.ui.openPassport(t.getAttribute('data-passport')); return; }
    if (e.target.closest('#loupeToggle')) { loupeApi.toggle(); }
  });
  $('#pdpPanel').addEventListener('keydown', function (e) {
    var t = e.target.closest('.size'); if (!t || pdp.p.sizing !== 'apparel') return;
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    var all = $$('#sizes .size:not([aria-disabled="true"])'), i = all.indexOf(t) + (e.key === 'ArrowRight' ? 1 : -1);
    i = (i + all.length) % all.length; all[i].focus(); all[i].click(); e.preventDefault();
  });


  /* ---------- 4x macro loupe ---------- */
  function initLoupe() {
    var stage = $('#stage'), lp = $('#loupe'), view = $('.loupe__view', lp), tog = $('#loupeToggle');
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var enabled = finePointer, pressed = false, kx = 0.5, ky = 0.45, Z = 4;
    tog.setAttribute('aria-pressed', enabled); stage.classList.toggle('is-touch-loupe', enabled && !finePointer);
    function refresh() {
      var on = $('.plate.is-on', stage); var inner = on ? on.innerHTML : '';
      view.innerHTML = inner;
    }
    function place(px, py) {
      var r = stage.getBoundingClientRect(), L = lp.offsetWidth;
      view.style.width = r.width * Z + 'px'; view.style.height = r.height * Z + 'px';
      view.style.transform = 'translate(' + (L / 2 - px * Z) + 'px,' + (L / 2 - py * Z) + 'px)';
      lp.style.left = Math.max(0, Math.min(r.width - L, px - L / 2)) + 'px';
      lp.style.top = Math.max(0, Math.min(r.height - L, py - L / 2)) + 'px';
      lp.classList.add('is-on');
    }
    function hide() { lp.classList.remove('is-on'); }
    function pos(e) { var r = stage.getBoundingClientRect(); return [Math.max(0, Math.min(r.width, e.clientX - r.left)), Math.max(0, Math.min(r.height, e.clientY - r.top))]; }
    stage.addEventListener('pointermove', function (e) {
      if (!enabled || e.target.closest('.stage__bar')) { if (e.target.closest('.stage__bar')) hide(); return; }
      if (e.pointerType !== 'mouse' && !pressed) return;
      var q = pos(e); place(q[0], q[1]);
    });
    stage.addEventListener('pointerdown', function (e) { if (!enabled || e.target.closest('.stage__bar') || e.pointerType === 'mouse') return; pressed = true; var q = pos(e); place(q[0], q[1]); });
    ['pointerup', 'pointercancel'].forEach(function (ev) { stage.addEventListener(ev, function (e) { if (e.pointerType !== 'mouse') { pressed = false; hide(); } }); });
    stage.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') hide(); });
    stage.addEventListener('keydown', function (e) {
      if (e.target !== stage) return;
      var step = 0.06, used = true;
      if (e.key === 'ArrowLeft') kx = Math.max(0, kx - step); else if (e.key === 'ArrowRight') kx = Math.min(1, kx + step);
      else if (e.key === 'ArrowUp') ky = Math.max(0, ky - step); else if (e.key === 'ArrowDown') ky = Math.min(1, ky + step);
      else if (e.key === 'Enter' || e.key === ' ') { if (lp.classList.contains('is-on')) hide(); else used = 'show'; }
      else if (e.key === 'Escape' && lp.classList.contains('is-on')) { hide(); e.stopPropagation(); e.preventDefault(); return; }
      else used = false;
      if (used) { e.preventDefault(); var r = stage.getBoundingClientRect(); if (enabled || used === 'show') place(kx * r.width, ky * r.height); }
    });
    stage.addEventListener('blur', hide);
    loupeApi = {
      refresh: refresh,
      toggle: function () { enabled = !enabled; tog.setAttribute('aria-pressed', enabled); stage.classList.toggle('is-touch-loupe', enabled && !finePointer); if (!enabled) hide(); C.toast(enabled ? (finePointer ? 'Loupe on. Move across the image.' : 'Loupe on. Press and drag across the image.') : 'Loupe off.'); }
    };
    refresh();
  }


  /* ======================= size and fit guide ======================= */
  var guideUnit = 'cm';
  function gv(cm) { return guideUnit === 'in' ? (Math.round(cm / 2.54 * 10) / 10).toFixed(1) : (Math.round(cm * 10) / 10).toString(); }
  function renderSize(pid) {
    var p = C.product(pid) || M.PRODUCTS[0], S = M.SIZECHART;
    var hollow = S.sizes.map(function (_, i) { return p.hollow + (i - 1) * S.hollowStep; });
    function row(label, arr) { return '<tr><th scope="row">' + label + '</th>' + arr.map(function (v) { return '<td' + '>' + gv(v) + '</td>'; }).join('') + '</tr>'; }
    $('#sizePanel').setAttribute('data-product', p.id);
    $('#sizePanel').innerHTML =
      '<div class="panel-head"><h2 id="sizeTitle">Size &amp; Fit Guide</h2><button class="icon-btn" type="button" data-close aria-label="Close size guide">' + X + '</button></div>' +
      '<div class="panel-body">' +
        '<p class="lede lede--dark">' + esc(p.short) + '. Body measurements, not garment measurements. Model is ' + M.MODEL.height + ' and wears Size ' + M.MODEL.size + '.</p>' +
        '<div class="seg" role="group" aria-label="Units"><button type="button" data-sunit="cm" aria-pressed="' + (guideUnit === 'cm') + '">CM</button><button type="button" data-sunit="in" aria-pressed="' + (guideUnit === 'in') + '">Inches</button></div>' +
        '<div class="size-table-wrap"><table class="size-table"><caption class="sr-only">Size chart in ' + (guideUnit === 'in' ? 'inches' : 'centimetres') + '</caption>' +
          '<thead><tr><th scope="col"><span class="sr-only">Measurement</span></th>' + S.sizes.map(function (z) { return '<th scope="col">' + z + '</th>'; }).join('') + '</tr></thead><tbody>' +
          row('Bust', S.bust) + row('Waist', S.waist) + row('Hip', S.hip) + row('Hollow-to-Hem', hollow) + '</tbody></table></div>' +
        '<p class="field__hint">Hollow-to-Hem is measured from the hollow at the base of the neck, straight down to the hem. Between sizes, choose the larger, or ask the stylist.</p>' +
        '<button class="btn btn--gold btn--block" type="button" data-size-fitting>Book Private Colombo Atelier Fitting</button>' +
      '</div>';
  }
  shop.openSize = function (pid) { renderSize(pid); C.open($('#layerSize')); };
  $('#sizePanel').addEventListener('click', function (e) {
    var u = e.target.closest('[data-sunit]'); if (u) { guideUnit = u.getAttribute('data-sunit'); renderSize($('#sizePanel').getAttribute('data-product')); var b = $('#sizePanel [data-sunit="' + guideUnit + '"]'); if (b) b.focus(); return; }
    if (e.target.closest('[data-size-fitting]')) { var id = $('#sizePanel').getAttribute('data-product'); C.close($('#layerSize')); setTimeout(function () { M.ui.openStylist(id, M.FITTING); }, 620); }
  });

  /* ======================= bespoke measurements ======================= */
  var FIELDS = [
    ['chest', 'Bust', 'Around the fullest part.', 60, 170],
    ['waist', 'Waist', 'Around the natural waist.', 50, 160],
    ['hips', 'Hip', 'Around the fullest part.', 60, 180],
    ['height', 'Height', 'Standing, without shoes.', 130, 220],
    ['heel', 'Heel height', 'The heel you will wear with the piece. Enter 0 for flat.', 0, 16]
  ];
  var meas = { unit: 'cm', cb: null, cancel: null, saved: false, fitting: false };
  function toUnit(cm, u) { return u === 'in' ? Math.round(cm / 2.54 * 10) / 10 : Math.round(cm * 10) / 10; }
  shop.openMeasure = function (onSave, onCancel) {
    var saved = C.state.measurements; meas.unit = (saved && saved.unit) || 'cm'; meas.cb = onSave || null; meas.cancel = onCancel || null; meas.saved = false; meas.fitting = false;
    var vals = saved ? saved.cm : {};
    $('#measurePanel').innerHTML =
      '<div class="panel-head"><h2 id="measureTitle">Bespoke Made-to-Measure</h2><button class="icon-btn" type="button" data-close aria-label="Close measurements"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="1.1"/></svg></button></div>' +
      '<form class="panel-body" id="measureForm" novalidate>' +
        '<p class="lede lede--dark">Measure over light clothing, and ask someone to help. Your stylist reviews every set before cutting begins.</p>' +
        '<div class="notice"><strong>Prefer to be measured in person?</strong> Request a private fitting in the Colombo atelier instead.<br><button class="link-btn" type="button" data-fitting style="margin-top:10px">Book Private Colombo Atelier Fitting</button></div>' +
        '<div class="seg" role="group" aria-label="Units"><button type="button" data-unit="cm" aria-pressed="' + (meas.unit === 'cm') + '">Centimetres</button><button type="button" data-unit="in" aria-pressed="' + (meas.unit === 'in') + '">Inches</button></div>' +
        '<div class="measure-grid">' + FIELDS.map(function (f) {
          var v = vals[f[0]] != null ? toUnit(vals[f[0]], meas.unit) : '';
          return '<div class="field"><label for="m-' + f[0] + '">' + f[1] + ' (<span class="u">' + meas.unit + '</span>)</label><input id="m-' + f[0] + '" name="' + f[0] + '" type="number" inputmode="decimal" step="0.1" value="' + v + '" aria-describedby="m-' + f[0] + '-h m-' + f[0] + '-e"><span class="field__hint" id="m-' + f[0] + '-h">' + f[2] + '</span><span class="field__error" id="m-' + f[0] + '-e" role="alert"></span></div>';
        }).join('') + '</div>' +
        '<div class="field"><label for="m-notes">Fit notes</label><textarea id="m-notes" name="notes" placeholder="Posture, preferred ease, anything the atelier should know">' + esc(saved && saved.notes || '') + '</textarea></div>' +
        '<button class="btn btn--gold btn--block" type="submit">Save measurements</button>' +
        '<button class="btn btn--ghost btn--block" type="button" data-cancel>Cancel</button>' +
      '</form>';
    C.open($('#layerMeasure'));
  };
  $('#measurePanel').addEventListener('click', function (e) {
    var u = e.target.closest('[data-unit]');
    if (u) {
      var to = u.getAttribute('data-unit'); if (to === meas.unit) return;
      $$('#measureForm input[type=number]').forEach(function (i) { if (i.value !== '') { var cm = meas.unit === 'in' ? parseFloat(i.value) * 2.54 : parseFloat(i.value); i.value = toUnit(cm, to); } });
      meas.unit = to; $$('#measureForm .u').forEach(function (s) { s.textContent = to; });
      $$('#measureForm [data-unit]').forEach(function (b) { b.setAttribute('aria-pressed', b === u); });
      return;
    }
    if (e.target.closest('[data-cancel]')) { C.close($('#layerMeasure')); return; }
    if (e.target.closest('[data-fitting]')) { meas.fitting = true; C.close($('#layerMeasure')); setTimeout(function () { M.ui.openStylist(pdp && pdp.p.id, M.FITTING); }, 620); }
  });
  $('#measurePanel').addEventListener('submit', function (e) {
    e.preventDefault();
    var form = e.target, cm = {}, bad = null;
    FIELDS.forEach(function (f) {
      var i = form.elements[f[0]], raw = parseFloat(i.value), val = meas.unit === 'in' ? raw * 2.54 : raw;
      if (isNaN(raw)) { C.setError(i, 'Enter your ' + f[1].toLowerCase() + '.'); bad = bad || i; }
      else if (val < f[3] || val > f[4]) { C.setError(i, 'This looks outside the usual range. Please check the number.'); bad = bad || i; }
      else { C.setError(i, ''); cm[f[0]] = Math.round(val * 10) / 10; }
    });
    if (bad) { bad.focus(); return; }
    C.state.measurements = { unit: meas.unit, cm: cm, notes: form.elements.notes.value.trim(), savedAt: new Date().toISOString() };
    C.save(); meas.saved = true; C.emit('measurements');
    C.close($('#layerMeasure'));
    C.toast(C.state.member ? 'Measurements saved to your Private Salon.' : 'Measurements saved on this device.');
    if (meas.cb) setTimeout(meas.cb, 620);
  });
  C.on('close', function (dlg) { if (dlg.id === 'layerMeasure' && !meas.saved && !meas.fitting && meas.cancel) { var f = meas.cancel; meas.cancel = null; f(); } });

  /* ======================= bag and checkout ======================= */
  var bagView = 'bag', lastOrder = null;
  var COUNTRIES = ['Sri Lanka', 'United Arab Emirates', 'United Kingdom', 'United States', 'Ireland', 'France', 'Italy', 'Germany', 'Singapore', 'Maldives', 'India', 'Australia', 'Japan'];
  var CUR_COUNTRY = { LKR: 'Sri Lanka', USD: 'United States', EUR: 'France', GBP: 'United Kingdom', AED: 'United Arab Emirates' };

  function deliveryLine(country) {
    return country === 'Sri Lanka' ? 'Complimentary White-Glove Insured Delivery across Sri Lanka.' : 'International DHL Express DDP: all duties and taxes are included in your total.';
  }
  function bagHead(title, back) {
    return '<div class="panel-head">' + (back ? '<button class="link-btn" type="button" data-back>Back to Bag</button>' : '<h2 id="bagTitle">Private Bag <small style="font:400 .9rem var(--sans);letter-spacing:.08em;color:var(--muted-stone)">(' + C.bagCount() + ')</small></h2>') +
      (back ? '<span class="sr-only" id="bagTitle">' + title + '</span>' : '') +
      '<button class="icon-btn" type="button" data-close aria-label="Close bag">' + X + '</button></div>';
  }
  function renderBag() {
    var panel = $('#bagPanel'), bag = C.state.bag;
    if (bagView === 'done') { renderDone(panel); return; }
    if (bagView === 'checkout' && bag.length) { renderCheckout(panel); return; }
    bagView = 'bag';
    if (!bag.length) {
      panel.innerHTML = bagHead() + '<div class="bag-empty"><h3>Your Private Bag is empty</h3><p>Choose a piece from the collection, or ask a Maison stylist to help you find one.</p><button class="btn btn--gold" type="button" data-browse>Explore The Collection</button><button class="link-btn" type="button" data-stylist>Speak with a Maison Stylist</button></div>';
      return;
    }
    var lines = bag.map(function (l) {
      var p = C.product(l.id), a = C.available(p);
      return '<div class="bag-line" data-key="' + esc(l.key) + '"><div class="bag-line__thumb">' + C.plateHTML(p, 'form') + '</div>' +
        '<div><p class="bag-line__name">' + esc(p.short) + '</p><p class="bag-line__meta">' + esc(l.size === 'Bespoke' ? 'Bespoke Made-to-Measure' : l.size) + '</p></div>' +
        '<p class="bag-line__price">' + P(p.price * l.qty) + '</p>' +
        '<div class="bag-line__ctl"><div class="qty" role="group" aria-label="Quantity for ' + esc(p.short) + '"><button type="button" data-dec aria-label="Decrease quantity">−</button><output aria-live="polite">' + l.qty + '</output><button type="button" data-inc aria-label="Increase quantity"' + (a <= 0 ? ' disabled' : '') + '>+</button></div><button class="link-btn" type="button" data-remove>Remove</button></div></div>';
    }).join('');
    panel.innerHTML = bagHead() + '<div class="bag-lines">' + lines + '</div>' +
      '<div class="bag-foot"><div class="totals"><span>Subtotal</span><output>' + P(C.bagTotalLKR()) + '</output></div>' +
      '<p class="fine-print">' + (C.isLocal() ? 'Complimentary White-Glove Insured Delivery across Sri Lanka.' : 'International DHL Express DDP: all duties and taxes are included in this total.') + '</p>' +
      '<button class="btn btn--gold btn--block" type="button" data-checkout>Proceed to Checkout</button>' +
      '<button class="link-btn" type="button" data-browse style="justify-self:center">Continue browsing</button></div>';
  }

  function renderCheckout(panel) {
    var m = C.state.member, defCountry = CUR_COUNTRY[C.state.currency];
    var opts = COUNTRIES.map(function (c) { return '<option' + (c === defCountry ? ' selected' : '') + '>' + c + '</option>'; }).join('');
    var applePay = !!window.ApplePaySession;
    panel.innerHTML = bagHead('Checkout', true) +
      '<form class="checkout" id="checkoutForm" novalidate>' +
        '<section class="step" aria-labelledby="st1"><h3 id="st1">Your details</h3>' +
          '<div class="choices" role="radiogroup" aria-label="How would you like to continue">' +
            '<label class="choice"><input type="radio" name="mode" value="guest"' + (m ? '' : ' checked') + '><span><b>Continue as guest</b><span>No account is needed to order.</span></span></label>' +
            '<label class="choice"><input type="radio" name="mode" value="salon"' + (m ? ' checked' : '') + '><span><b>Unlock the Private Salon</b><span>Saved measurements, early archive previews, delivery tracking and your NFC ownership vault.</span></span></label>' +
          '</div>' +
          '<div id="salonOpts" ' + (m ? '' : 'hidden') + '><button class="google-btn" type="button" data-google>Continue with Google</button><p class="field__hint" style="margin-top:8px">Or use your email below. A one-time magic link signs you in, with no password.</p></div>' +
          '<div class="field"><label for="co-email">Email</label><input id="co-email" name="email" type="email" autocomplete="email" inputmode="email" value="' + esc(m ? m.email : '') + '" aria-describedby="co-email-e"><span class="field__error" id="co-email-e" role="alert"></span></div>' +
        '</section>' +
        '<section class="step" aria-labelledby="st2"><h3 id="st2">Delivery</h3>' +
          '<div class="row-2"><div class="field"><label for="co-name">Full name</label><input id="co-name" name="name" autocomplete="name" value="' + esc(m && m.name || '') + '" aria-describedby="co-name-e"><span class="field__error" id="co-name-e" role="alert"></span></div>' +
          '<div class="field"><label for="co-phone">Mobile</label><input id="co-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" aria-describedby="co-phone-e"><span class="field__error" id="co-phone-e" role="alert"></span></div></div>' +
          '<div class="field"><label for="co-addr">Address</label><input id="co-addr" name="addr" autocomplete="street-address" aria-describedby="co-addr-e"><span class="field__error" id="co-addr-e" role="alert"></span></div>' +
          '<div class="row-2"><div class="field"><label for="co-city">City</label><input id="co-city" name="city" autocomplete="address-level2" aria-describedby="co-city-e"><span class="field__error" id="co-city-e" role="alert"></span></div>' +
          '<div class="field"><label for="co-post">Postal code</label><input id="co-post" name="post" autocomplete="postal-code" aria-describedby="co-post-e"><span class="field__error" id="co-post-e" role="alert"></span></div></div>' +
          '<div class="field"><label for="co-country">Country</label><select id="co-country" name="country" autocomplete="country-name">' + opts + '</select></div>' +
          '<p class="notice" id="co-delivery"><strong>Delivery.</strong> ' + deliveryLine(defCountry) + '</p>' +
        '</section>' +
        '<section class="step" aria-labelledby="st3"><h3 id="st3">Payment</h3>' +
          '<div class="choices" role="radiogroup" aria-label="Payment method">' +
            '<label class="choice"><input type="radio" name="pay" value="payhere" checked><span><b>PayHere, in Sri Lankan rupees</b><span>Cards and LankaQR, processed securely by PayHere.</span><span class="marks"><i>Visa</i><i>Mastercard</i><i>AMEX</i><i>LankaQR</i></span></span></label>' +
            '<label class="choice"><input type="radio" name="pay" value="bank"><span><b>Private Bank Transfer</b><span>Your stylist sends the Maison account details by email.</span></span></label>' +
            '<label class="choice"><input type="radio" name="pay" value="intl"><span><b>International card' + (applePay ? ' or Apple Pay' : '') + '</b><span>Multi-currency card payment for orders outside Sri Lanka.</span><span class="marks"><i>Visa</i><i>Mastercard</i><i>AMEX</i>' + (applePay ? '<i>Apple Pay</i>' : '') + '</span></span></label>' +
          '</div>' +
        '</section>' +
        '<section class="step" aria-labelledby="st4"><h3 id="st4">Summary</h3>' +
          '<div class="summary-rows">' + C.state.bag.map(function (l) { var p = C.product(l.id); return '<div class="summary-row"><span>' + esc(p.short) + (l.qty > 1 ? ' × ' + l.qty : '') + '</span><span>' + P(p.price * l.qty) + '</span></div>'; }).join('') +
            '<div class="summary-row"><span>Delivery</span><span>Complimentary</span></div><div class="summary-row"><span>Duties and taxes</span><span id="co-duty">Included</span></div></div>' +
          '<div class="totals"><span>Total</span><output>' + P(C.bagTotalLKR()) + '</output></div>' +
          '<p class="fine-print">Demonstration storefront: no payment is taken and no email is sent.</p>' +
          '<button class="btn btn--gold btn--block" type="submit">Complete Order</button>' +
        '</section>' +
      '</form>';
  }

  function renderDone(panel) {
    var o = lastOrder; if (!o) { bagView = 'bag'; renderBag(); return; }
    var first = (o.name || '').split(' ')[0] || 'you';
    panel.innerHTML = bagHead() +
      '<div class="confirm"><h3>Thank you, ' + esc(first) + '.</h3><p class="order-ref" aria-label="Order reference">' + esc(o.ref) + '</p>' +
      '<p>' + (o.country === 'Sri Lanka' ? 'A Maison courier will bring your order to you, and your stylist will call to arrange a time.' : 'Your order will travel by DHL Express, delivered duty paid. Nothing is collected at your door.') + '</p>' +
      (o.method === 'bank' ? '<p class="notice"><strong>Bank transfer.</strong> Your stylist sends the Maison account details to ' + esc(o.email) + ' within one working day.</p>' : '') +
      '<div><p class="search-hint">Digital Product Passports</p><div class="pass-list">' + o.items.map(function (it) { return '<div class="pass-item"><span>' + esc(it.short) + '</span><button class="link-btn" type="button" data-passport-open="' + esc(it.passport) + '">View passport</button></div>'; }).join('') + '</div></div>' +
      '<p class="fine-print">Demonstration storefront: no payment was taken and no email was sent.</p>' +
      (C.state.member ? '' : '<div class="salon-upsell"><p>Keep your passports, measurements and delivery tracking in the Private Salon.</p><button class="btn btn--ghost btn--sm" type="button" data-salon>Open the Private Salon</button></div>') +
      '<button class="btn btn--gold btn--block" type="button" data-close>Continue</button></div>';
  }

  shop.openBag = function () { bagView = C.state.bag.length ? bagView : 'bag'; if (bagView === 'done' && !lastOrder) bagView = 'bag'; renderBag(); C.open($('#layerBag')); };
  var bagPanel = $('#bagPanel');
  bagPanel.addEventListener('click', function (e) {
    var line = e.target.closest('.bag-line'), key = line && line.getAttribute('data-key');
    var l = key && C.state.bag.filter(function (x) { return x.key === key; })[0];
    if (e.target.closest('[data-inc]') && l) { if (C.available(C.product(l.id)) > 0) { l.qty += 1; C.save(); C.updateBagUI(); renderBag(); C.emit('bag'); } return; }
    if (e.target.closest('[data-dec]') && l) { l.qty -= 1; if (l.qty <= 0) C.state.bag = C.state.bag.filter(function (x) { return x !== l; }); C.save(); C.updateBagUI(); renderBag(); C.emit('bag'); return; }
    if (e.target.closest('[data-remove]') && l) { C.state.bag = C.state.bag.filter(function (x) { return x !== l; }); C.save(); C.updateBagUI(); renderBag(); C.emit('bag'); C.toast('Removed from your Private Bag.'); return; }
    if (e.target.closest('[data-checkout]')) { bagView = 'checkout'; renderBag(); bagPanel.scrollTop = 0; return; }
    if (e.target.closest('[data-back]')) { bagView = 'bag'; renderBag(); return; }
    if (e.target.closest('[data-browse]')) { C.close($('#layerBag')); setTimeout(function () { C.scrollTo('collection'); }, 600); return; }
    if (e.target.closest('[data-stylist]')) { M.ui.openStylist(); return; }
    if (e.target.closest('[data-salon]')) { M.ui.openSalon(); return; }
    var pp = e.target.closest('[data-passport-open]'); if (pp) { M.ui.openPassport(null, pp.getAttribute('data-passport-open')); return; }
    if (e.target.closest('[data-google]')) { M.ui.googleSignIn(function (m) { var f = $('#checkoutForm'); if (f) { f.elements.email.value = m.email; if (!f.elements.name.value) f.elements.name.value = m.name; C.setError(f.elements.email, ''); } }); }
  });
  bagPanel.addEventListener('change', function (e) {
    var f = e.target.form; if (!f || f.id !== 'checkoutForm') return;
    if (e.target.name === 'mode') $('#salonOpts').hidden = e.target.value !== 'salon';
    if (e.target.name === 'country') { $('#co-delivery').innerHTML = '<strong>Delivery.</strong> ' + deliveryLine(e.target.value); $('#co-duty').textContent = 'Included'; var pay = f.elements.pay; if (e.target.value !== 'Sri Lanka') f.querySelector('input[name=pay][value=intl]').checked = true; else if (f.querySelector('input[name=pay]:checked').value === 'intl') f.querySelector('input[name=pay][value=payhere]').checked = true; }
  });
  bagPanel.addEventListener('submit', function (e) {
    if (e.target.id !== 'checkoutForm') return;
    e.preventDefault();
    var f = e.target, bad = null;
    function need(name, ok, msg) { var i = f.elements[name]; if (!ok(i.value)) { C.setError(i, msg); bad = bad || i; } else C.setError(i, ''); }
    need('email', C.validEmail, 'Enter a valid email address, such as name@example.com.');
    need('name', function (v) { return v.trim().length > 1; }, 'Enter your full name.');
    need('phone', C.validPhone, 'Enter a mobile number with at least 7 digits.');
    need('addr', function (v) { return v.trim().length > 4; }, 'Enter your delivery address.');
    need('city', function (v) { return v.trim().length > 1; }, 'Enter your city.');
    need('post', function (v) { return v.trim().length > 2; }, 'Enter your postal code.');
    if (bad) { bad.focus(); return; }
    var items = [];
    C.state.bag.forEach(function (l) { var p = C.product(l.id); for (var i = 0; i < l.qty; i++) items.push({ id: p.id, short: p.short, name: p.name, size: l.size, bespoke: l.bespoke, price: p.price, passport: C.uid('MNT') }); });
    var order = { ref: C.uid('ORD'), date: new Date().toISOString(), items: items, totalLKR: C.bagTotalLKR(), currency: C.state.currency, display: C.price(C.bagTotalLKR()), method: f.querySelector('input[name=pay]:checked').value, country: f.elements.country.value, email: f.elements.email.value.trim(), name: f.elements.name.value.trim(), step: 0 };
    C.state.orders.unshift(order);
    if (f.querySelector('input[name=mode]:checked').value === 'salon' && !C.state.member) { C.state.member = { email: order.email, name: order.name, since: order.date }; C.emit('member'); }
    C.state.bag = []; C.save(); C.updateBagUI(); C.emit('bag');
    lastOrder = order; bagView = 'done'; renderBag(); bagPanel.scrollTop = 0;
  });
  C.on('close', function (dlg) { if (dlg.id === 'layerBag' && bagView === 'done') { bagView = 'bag'; lastOrder = null; } });

  /* live updates when stock or currency change */
  C.on('bag', function () { syncAddButtons(); });
  C.on('currency', function () { var cc = $('#co-country'); if (cc && bagView === 'checkout' && C.state.currency) { /* keep typed values; prices update via data-price */ } });

  /* ======================= init ======================= */
  renderTabs(); renderGallery(); C.updateBagUI();
  $('#bagBtn').addEventListener('click', shop.openBag);
})();
