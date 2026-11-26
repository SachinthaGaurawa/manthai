/* ==========================================================================
   MANTHAI  |  shop: gallery, product drawer, loupe, size guide, bag, checkout
   ========================================================================== */
(function () {
  'use strict';
  var M = window.MANTHAI, C = M.core, $ = C.$, $$ = C.$$, esc = C.esc;
  var shop = (M.shop = {});
  var X = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="1.1"/></svg>';

  function P(lkr) { return '<span data-price="' + lkr + '">' + C.price(lkr) + '</span>'; }
  function pieceNo(p) { return p.edition ? p.edition - p.remaining + 1 : 0; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  /* ======================= collection gallery ======================= */
  var tab = 'All', occ = '', io;
  function rowPlan(n) { if (n <= 3) return [n]; var out = [], left = n, cyc = [3, 2], k = 0; while (left > 0) { var t = Math.min(cyc[k % 2], left); if (left - t === 1) t += 1; out.push(t); left -= t; k++; } return out; }
  function filtered() {
    return M.PRODUCTS.filter(function (p) {
      return (tab === 'All' || p.tabs.indexOf(tab) > -1) && (!occ || (p.occasions || []).indexOf(occ) > -1);
    });
  }
  shop.editionTag = function (p) { return p.edition ? 'Atelier Edition · ' + p.edition + ' Pieces' : p.collection; };

  function renderTabs() {
    $('#filterTabs').innerHTML = M.TABS.map(function (t) {
      var on = t === tab && !occ;
      return '<button class="tab" role="tab" type="button" data-tab="' + esc(t) + '" aria-selected="' + on + '" tabindex="' + (t === tab ? 0 : -1) + '">' + esc(t) + '</button>';
    }).join('');
    $('#occasionChip').innerHTML = occ ? '<span class="chip">Cut for ' + esc(occ) + '<button type="button" data-clear-occ aria-label="Clear occasion filter">' + X.replace('width="22" height="22"', 'width="14" height="14"') + '</button></span>' : '';
  }
  function sizesHTML(p) {
    return '<p class="card__sizes"><span class="sr-only">Sizes: </span>' + M.SIZECHART.sizes.map(function (z) {
      var out = p.soldOut.indexOf(z) > -1;
      return '<span' + (out ? ' class="is-out" title="Sold out"' : '') + '>' + z + (out ? '<span class="sr-only"> (sold out)</span>' : '') + '</span>';
    }).join('') + '</p>';
  }
  function cardHTML(p, i, size, row) {
    var cls = 'card' + (size === 2 ? ' is-wide' : '') + (size === 1 ? ' is-solo' : '');
    if ((size === 2 && row === 1) || (size === 3 && row === 1)) cls += ' is-drop';
    return '<article class="' + cls + '" data-id="' + p.id + '">' +
      '<button class="card__frame" type="button" data-open="' + p.id + '" tabindex="-1" aria-hidden="true" data-cursor="View" data-media-slot="' + p.id + '" data-prompt="' + esc(p.prompt) + '">' +
      '<span class="plate plate--a">' + C.plateHTML(p, 'form') + '</span><span class="plate plate--b">' + C.plateHTML(p, 'move') + '</span>' +
      '<span class="card__quick">Quick view</span></button>' +
      '<div class="card__meta"><p class="card__edition">' + esc(shop.editionTag(p)) + '</p>' +
      '<h3 class="card__name"><button type="button" data-open="' + p.id + '">' + esc(p.name) + '</button></h3>' +
      '<p class="card__price">' + P(p.price) + '</p>' + sizesHTML(p) + '</div></article>';
  }
  function renderGallery() {
    var list = filtered(), plan = rowPlan(list.length), html = '', idx = 0;
    plan.forEach(function (size) {
      for (var j = 0; j < size; j++) { var p = list[idx++]; if (!p) break; html += cardHTML(p, idx, size, j === 1 ? 1 : 0); }
    });
    var g = $('#gallery'); g.innerHTML = html || '<div class="empty"><p>No piece in this edition is cut for that yet.</p><button class="link-btn" type="button" data-tab-all>See every piece</button></div>';
    var what = occ ? ' cut for ' + occ : (tab === 'All' ? '' : ' in ' + tab);
    $('#collectionCount').textContent = list.length + (list.length === 1 ? ' piece' : ' pieces') + what;
    observeCards();
  }
  function observeCards() {
    var cards = $$('#gallery .card');
    if (!('IntersectionObserver' in window)) { cards.forEach(function (c) { c.classList.add('in'); }); return; }
    if (io) io.disconnect();
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.style.transitionDelay = (Math.min(cards.indexOf(e.target) % 3, 2) * 110) + 'ms'; e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    cards.forEach(function (c) { io.observe(c); });
  }
  shop.setFilter = function (t, scroll) {
    if (M.TABS.indexOf(t) < 0) t = 'All';
    tab = t; occ = ''; renderTabs(); renderGallery();
    if (scroll) C.scrollTo('collection');
  };
  shop.setOccasion = function (o, scroll) {
    if (M.OCCASIONS.indexOf(o) < 0) o = '';
    tab = 'All'; occ = o; renderTabs(); renderGallery();
    if (scroll) C.scrollTo('collection');
  };
  $('#filterTabs').addEventListener('click', function (e) { var b = e.target.closest('.tab'); if (b) shop.setFilter(b.getAttribute('data-tab')); });
  $('#occasionChip').addEventListener('click', function (e) { if (e.target.closest('[data-clear-occ]')) shop.setFilter('All'); });
  $('#filterTabs').addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    var i = M.TABS.indexOf(tab) + (e.key === 'ArrowRight' ? 1 : -1); i = (i + M.TABS.length) % M.TABS.length;
    shop.setFilter(M.TABS[i]); var nb = $('.tab[aria-selected="true"]'); if (nb) nb.focus();
  });
  $('#gallery').addEventListener('click', function (e) {
    if (e.target.closest('[data-tab-all]')) { shop.setFilter('All'); return; }
    var b = e.target.closest('[data-open]'); if (b) shop.openProduct(b.getAttribute('data-open'), b);
  });

  /* ======================= product drawer ======================= */
  var pdp = null, loupeApi = null;
  var VIEWS = [['form', 'Front View', 'Front'], ['back', 'Back View', 'Back'], ['detail', 'Bodice & Textile 4x Macro', 'Macro 4x'], ['move', 'Drape in Motion', 'In motion']];

  function pdpHTML(p) {
    var line = (p.edition ? 'Piece ' + pad(pieceNo(p)) + ' of ' + p.edition : 'Atelier series') + ' · Hand-Finished in Colombo Atelier';
    var sizes = ['XS', 'S', 'M', 'L', 'XL'].map(function (s) {
      var out = p.soldOut.indexOf(s) > -1;
      return '<button type="button" class="size" role="radio" data-size="' + s + '" aria-checked="false"' + (out ? ' aria-disabled="true" title="Sold out"' : '') + '>' + s + '</button>';
    }).join('');
    var fit = typeof p.fit === 'number' ? p.fit : 1, fitIdx = Math.round(fit);
    var fitWord = fit < 0.85 ? 'Runs slightly small' : fit > 1.15 ? 'Runs slightly large' : 'True to size';
    var wished = (C.state.wishlist || []).indexOf(p.id) > -1;
    var pairs = (p.pairs || []).map(C.product).filter(Boolean).slice(0, 3);
    return '' +
      '<div class="pdp on-light">' +
      '<button class="icon-btn pdp__close" type="button" data-close aria-label="Close product">' + X + '</button>' +
      '<div class="pdp__gallery">' +
        '<div class="viewtabs" role="group" aria-label="Choose an angle">' + VIEWS.map(function (v, i) { return '<button type="button" class="viewtab" data-view="' + v[0] + '" aria-pressed="' + (i === 0) + '">' + v[1] + '</button>'; }).join('') + '</div>' +
        '<div class="stage" id="stage" tabindex="0" role="group" aria-label="' + esc(p.name) + ' images" aria-describedby="stageHint" data-cursor="Zoom" data-media-slot="' + p.id + '-gallery" data-prompt="' + esc(p.prompt) + '">' +
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
        '<p class="pdp__edition">' + esc(line) + '</p>' +
        '<h2 class="pdp__name" id="pdpTitle">' + esc(p.name) + '</h2>' +
        '<p class="pdp__price">' + P(p.price) + '</p>' +
        '<p class="pdp__summary">' + esc(p.summary) + '</p>' +
        '<div class="pdp__size"><div class="opt-label"><span id="sizeLabel">Size</span><button class="link-btn" type="button" data-sizeguide>Size &amp; fit guide</button></div>' +
          '<div class="sizes" role="radiogroup" aria-labelledby="sizeLabel" id="sizes">' + sizes + '</div>' +
          '<p class="field__error" id="sizeError" role="alert"></p>' +
          '<p class="model-note">Model is ' + M.MODEL.height + ' and wears Size ' + M.MODEL.size + '.</p>' +
          '<div class="fitbar"><p class="fitbar__title">Fit consensus <span>' + esc(fitWord) + '</span></p>' +
            '<div class="fitbar__track" role="img" aria-label="Fit consensus from atelier fittings: ' + esc(fitWord.toLowerCase()) + '"><span class="fitbar__mark" style="left:' + (fit / 2 * 100).toFixed(0) + '%"></span></div>' +
            '<div class="fitbar__labels" aria-hidden="true">' + M.FIT_LABELS.map(function (l, i) { return '<span' + (i === fitIdx ? ' class="is-on"' : '') + '>' + l + '</span>'; }).join('') + '</div></div>' +
        '</div>' +
        '<div class="pdp__cta">' +
          '<button class="btn btn--solid" type="button" data-add><span class="btn__label">Reserve in Your Bag</span></button>' +
          '<button class="btn btn--ghost btn--block" type="button" data-stylist>Speak with a Maison Stylist</button>' +
          '<button class="wish-btn" type="button" data-wish aria-pressed="' + wished + '">' + (wished ? 'Saved to your wishlist' : 'Save this silhouette') + '</button>' +
        '</div>' +
        '<div class="assure">' +
          '<p><b id="pdpShip"></b><span id="pdpWhen"></span></p>' +
          '<p>Exchanges and complimentary atelier alterations within 14 days of delivery.</p>' +
        '</div>' +
        '<div class="pdp__acc">' +
          '<details><summary>Fabric &amp; atelier craft</summary><p>' + esc(p.story) + '</p><p><b>Materials.</b> ' + esc(p.materials) + '</p><p><b>Provenance.</b> ' + esc(p.provenance) + '.</p></details>' +
          '<details><summary>Garment care</summary><p>' + esc(p.care) + '</p><ul class="care-list">' + M.CARE.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul></details>' +
          '<details><summary>Packaging &amp; verification card</summary><p>Your piece arrives in a rigid black linen box stamped with the Unbounded Spiral Seal, folded in acid-free tissue inside a cotton garment bag. A Story Card and a micro-foil Verification Card with your edition number travel with it; tap the card or scan its code to open the authenticity record.</p><button class="link-btn" type="button" data-passport="' + p.id + '">Open a sample record</button></details>' +
        '</div>' +
        (pairs.length ? '<section class="pairing" aria-labelledby="pairTitle"><h3 id="pairTitle">Complete the silhouette</h3><div class="pairing__list">' + pairs.map(function (q) {
          return '<button class="pair" type="button" data-pair="' + q.id + '"><span class="pair__plate">' + C.plateHTML(q, 'form') + '</span><span class="pair__name">' + esc(q.short) + '</span><span class="pair__price">' + P(q.price) + '</span></button>';
        }).join('') + '</div></section>' : '') +
      '</div></div>' +
      '<div class="pdp__sticky"><span class="pdp__sticky-meta"><span class="pdp__sticky-name">' + esc(p.short) + '</span><span class="pdp__price">' + P(p.price) + '</span></span><button class="btn btn--solid" type="button" data-add><span class="btn__label">Reserve in Your Bag</span></button></div>';
  }
  function syncShip() {
    var b = $('#pdpShip'), w = $('#pdpWhen'); if (!b) return;
    b.textContent = 'Complimentary insured delivery'; w.textContent = ' · ' + C.deliveryWhen('colombo') + ' in Colombo';
  }

  shop.openProduct = function (id) {
    var p = C.product(id); if (!p) return;
    pdp = { p: p, size: p.sizing === 'apparel' ? null : p.sizeLabel, view: 'form' };
    $('#pdpPanel').innerHTML = pdpHTML(p);
    $('#layerPdp').setAttribute('aria-labelledby', 'pdpTitle');
    var fs = C.state.fitSize; if (fs && p.soldOut.indexOf(fs) < 0) { pdp.size = fs; var sb = $('#sizes [data-size="' + fs + '"]'); if (sb) sb.setAttribute('aria-checked', 'true'); }
    C.open($('#layerPdp'));
    initLoupe();
    syncAddButtons(); syncShip();
  };

  function syncAddButtons() {
    if (!pdp) return;
    var a = C.available(pdp.p);
    $$('#pdpPanel [data-add]').forEach(function (b) {
      b.disabled = a <= 0;
      if (!b.classList.contains('is-reserved')) b.querySelector('.btn__label').textContent = a <= 0 ? 'Held in private bags' : 'Reserve in Your Bag';
    });
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
    if (C.available(p) <= 0) { C.toast('Every piece of this edition is already reserved.'); return; }
    var size = pdp.size, key = C.lineKey(p.id, size, false);
    var line = C.state.bag.filter(function (l) { return l.key === key; })[0];
    if (line) line.qty += 1; else C.state.bag.push({ key: key, id: p.id, size: size, qty: 1 });
    C.save(); C.updateBagUI(); C.emit('bag');
    $$('#pdpPanel [data-add]').forEach(function (b) {
      b.classList.add('is-reserved'); b.querySelector('.btn__label').textContent = 'Reserved in Your Private Bag';
      setTimeout(function () { b.classList.remove('is-reserved'); syncAddButtons(); }, 2600);
    });
    setTimeout(function () { if ($('#layerPdp').open) shop.openBag(); }, C.reduced() ? 0 : 700);
  }

  $('#pdpPanel').addEventListener('click', function (e) {
    if (!pdp) return;
    var t;
    if ((t = e.target.closest('.thumb, .viewtab'))) { setView(t.getAttribute('data-view')); return; }
    if (e.target.closest('[data-sizeguide]')) { shop.openSize(pdp.p.id); return; }
    if ((t = e.target.closest('.size'))) {
      if (t.getAttribute('aria-disabled') === 'true') { C.toast('That size is sold out in this edition.'); return; }
      pdp.size = t.getAttribute('data-size'); $$('#sizes .size').forEach(function (s) { s.setAttribute('aria-checked', s === t); }); $('#sizeError').textContent = ''; return;
    }
    if (e.target.closest('[data-add]')) { addToBag(); return; }
    if ((t = e.target.closest('[data-wish]'))) { var on = shop.toggleWish(pdp.p.id); t.setAttribute('aria-pressed', on); t.textContent = on ? 'Saved to your wishlist' : 'Save this silhouette'; return; }
    if ((t = e.target.closest('[data-pair]'))) { shop.openProduct(t.getAttribute('data-pair')); $('#pdpPanel').scrollTop = 0; return; }
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
          row('Bust', S.bust) + row('Waist', S.waist) + row('Hip', S.hip) + row('Hollow-to-Hem', hollow) +
          ['UK', 'EU', 'US'].map(function (k) { return '<tr class="intl"><th scope="row">' + k + ' size</th>' + M.SIZE_INTL[k].map(function (v) { return '<td>' + v + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' +
        '<p class="field__hint">Hollow-to-Hem is measured from the hollow at the base of the neck, straight down to the hem. Between sizes, choose the larger, or ask the stylist.</p>' +
        '<button class="btn btn--gold btn--block" type="button" data-size-fitting>Book a private atelier fitting</button>' +
      '</div>';
  }
  shop.openSize = function (pid) { renderSize(pid); C.open($('#layerSize')); };
  $('#sizePanel').addEventListener('click', function (e) {
    var u = e.target.closest('[data-sunit]'); if (u) { guideUnit = u.getAttribute('data-sunit'); renderSize($('#sizePanel').getAttribute('data-product')); var b = $('#sizePanel [data-sunit="' + guideUnit + '"]'); if (b) b.focus(); return; }
    if (e.target.closest('[data-size-fitting]')) { var id = $('#sizePanel').getAttribute('data-product'); C.close($('#layerSize')); setTimeout(function () { M.ui.openStylist(id, M.FITTING); }, 620); }
  });

  /* ======================= bag and checkout ======================= */
  var bagView = 'bag', lastOrder = null;
  var PAY = {
    payhere: { label: 'PayHere secure card payment', text: 'Visa, Mastercard and American Express, in Sri Lankan rupees.', marks: ['Visa', 'Mastercard', 'AMEX'] },
    lankaqr: { label: 'LankaQR instant pay', text: 'Scan with any Sri Lankan banking or wallet app.', marks: ['LankaQR'] },
    bank: { label: 'Private bank transfer', text: 'An instant payment reference, with the Maison account details sent by email.', marks: [] }
  };
  var co = { step: 1, d: {} };
  function req(label) { return label + ' <span class="req" aria-hidden="true">*</span>'; }
  function opt(label) { return label + ' <span class="opt">(optional)</span>'; }
  function coField(id, name, label, attrs, val) {
    return '<div class="field"><label for="' + id + '">' + label + '</label><input id="' + id + '" name="' + name + '" ' + attrs + ' value="' + esc(val || '') + '" aria-describedby="' + id + '-e"><span class="field__error" id="' + id + '-e" role="alert"></span></div>';
  }
  /* Phase 1: Sri Lankan fulfilment and payment only */
  function shipOptions() { return ['colombo', 'island', 'atelier']; }
  function payOptions() { return ['payhere', 'lankaqr', 'bank']; }
  function giftState() { return C.state.gift || (C.state.gift = { on: false, note: '' }); }

  function bagHead(title, back) {
    return '<div class="panel-head">' + (back ? '<button class="link-btn" type="button" data-back>Back to your bag</button>' : '<h2 id="bagTitle">Private Bag <small class="bag-qty">' + C.bagCount() + '</small></h2>') +
      (back ? '<span class="sr-only" id="bagTitle">' + title + '</span>' : '') +
      '<button class="icon-btn" type="button" data-close aria-label="Close bag">' + X + '</button></div>';
  }
  function renderBag() {
    var panel = $('#bagPanel'), bag = C.state.bag;
    if (bagView === 'done') { renderDone(panel); return; }
    if (bagView === 'checkout' && bag.length) { renderCheckout(panel); return; }
    bagView = 'bag';
    if (!bag.length) {
      panel.innerHTML = bagHead() + '<div class="bag-empty"><h3>Your Private Bag is empty</h3><p>Choose a piece from Edition 01, or ask a Maison Stylist to help you find one.</p><button class="btn btn--gold" type="button" data-browse>Explore the Collection</button><button class="link-btn" type="button" data-stylist>Speak with a Maison Stylist</button></div>';
      return;
    }
    var g = giftState();
    var lines = bag.map(function (l) {
      var p = C.product(l.id), a = C.available(p);
      return '<div class="bag-line" data-key="' + esc(l.key) + '"><div class="bag-line__thumb">' + C.plateHTML(p, 'form') + '</div>' +
        '<div><p class="bag-line__name">' + esc(p.short) + '</p><p class="bag-line__meta">Size ' + esc(l.size) + '</p></div>' +
        '<p class="bag-line__price">' + P(p.price * l.qty) + '</p>' +
        '<div class="bag-line__ctl"><div class="qty" role="group" aria-label="Quantity for ' + esc(p.short) + '"><button type="button" data-dec aria-label="Decrease quantity">−</button><output aria-live="polite">' + l.qty + '</output><button type="button" data-inc aria-label="Increase quantity"' + (a <= 0 ? ' disabled' : '') + '>+</button></div>' +
        '<button class="link-btn" type="button" data-remove>Remove</button></div></div>';
    }).join('');
    panel.innerHTML = bagHead() + '<div class="bag-lines">' + lines + '</div>' +
      '<div class="bag-foot">' +
        '<label class="gift"><input type="checkbox" data-gift' + (g.on ? ' checked' : '') + '><span><b>Prepare as a gift</b><span>A complimentary calligraphy note card inside the rigid box. Prices are never shown in the parcel.</span></span></label>' +
        '<div class="field gift-note"' + (g.on ? '' : ' hidden') + '><label for="giftNote">' + opt('Your note') + '</label><textarea id="giftNote" data-gift-note maxlength="240" rows="2" placeholder="Written by hand on the card">' + esc(g.note) + '</textarea></div>' +
        '<div class="totals"><span>Subtotal</span><output>' + P(C.bagTotalLKR()) + '</output></div>' +
        '<p class="fine-print">' + 'Complimentary insured delivery across Sri Lanka. ' + C.deliveryWhen('colombo') + ' in Colombo.' + '</p>' +
        '<button class="btn btn--gold btn--block" type="button" data-checkout>Proceed to Acquisition</button>' +
        '<button class="link-btn" type="button" data-browse style="justify-self:center">Continue browsing</button></div>';
  }

  function stepHead(n, title, done) {
    return '<header class="co-step__head"><h3><span class="co-n" aria-hidden="true">' + n + '</span>' + title + '</h3>' + (done ? '<button class="link-btn" type="button" data-edit="' + n + '">Edit<span class="sr-only"> ' + title + '</span></button>' : '') + '</header>';
  }
  function renderCheckout(panel) {
    var m = C.state.member, d = co.d, g = giftState();
    if (!d.email && m) { d.email = m.email; d.name = d.name || m.name; }
    d.country = M.MARKET.countryName;
    if (shipOptions().indexOf(d.ship) < 0) d.ship = shipOptions()[0];
    if (payOptions().indexOf(d.pay) < 0) d.pay = payOptions()[0];
    if (d.gift === undefined) { d.gift = g.on; d.giftNote = g.note; }
    var s1 = co.step === 1, s2 = co.step === 2, s3 = co.step === 3;
    var n = C.bagCount();
    var h = bagHead('Acquisition', true) + '<div class="checkout" id="checkout">' +
      '<div class="co-intro"><p class="co-total"><span>' + n + (n === 1 ? ' piece' : ' pieces') + '</span><output>' + P(C.bagTotalLKR()) + '</output></p>' +
      (m ? '<p class="fine-print">Signed in to the Private Circle as ' + esc(m.email) + '.</p>' : '<p class="fine-print">Complete your acquisition as a guest. You may save your Private Circle profile in one click afterward.</p>') + '</div>';

    /* step 1: contact and delivery */
    h += '<section class="co-step' + (s1 ? ' is-open' : ' is-done') + '" aria-labelledby="coh1">' + stepHead(1, '<span id="coh1">Contact &amp; delivery</span>', !s1);
    if (s1) {
      h += '<form class="co-form" id="coStep1" novalidate><p class="fine-print">Fields marked <span class="req">*</span> are required.</p>' +
        coField('co-email', 'email', req('Email'), 'type="email" autocomplete="email" inputmode="email"', d.email) +
        coField('co-phone', 'phone', req('Mobile'), 'type="tel" autocomplete="tel" inputmode="tel"', d.phone) +
        coField('co-name', 'name', req('Full name'), 'autocomplete="name"', d.name) +
        coField('co-addr', 'addr', req('Address'), 'autocomplete="address-line1"', d.addr) +
        coField('co-addr2', 'addr2', opt('Apartment, suite or floor'), 'autocomplete="address-line2"', d.addr2) +
        '<div class="row-2">' + coField('co-city', 'city', req('City'), 'autocomplete="address-level2"', d.city) + coField('co-post', 'post', opt('Postal code'), 'autocomplete="postal-code"', d.post) + '</div>' +
        '<div class="field"><span class="field__label-static">Country</span><p class="field__static">Sri Lanka</p><input type="hidden" name="country" value="Sri Lanka"></div>' +
        '<button class="btn btn--gold btn--block" type="submit">Continue to fulfilment</button></form>';
    } else {
      h += '<div class="co-sum"><p>' + esc(d.name) + '<br>' + esc(d.email) + ' · ' + esc(d.phone) + '</p><p>' + esc([d.addr, d.addr2, d.city, d.post, d.country].filter(Boolean).join(', ')) + '</p></div>';
    }
    h += '</section>';

    /* step 2: fulfilment and gift wrapping */
    h += '<section class="co-step' + (s2 ? ' is-open' : co.step > 2 ? ' is-done' : ' is-next') + '" aria-labelledby="coh2">' + stepHead(2, '<span id="coh2">Fulfilment &amp; gift wrapping</span>', co.step > 2);
    if (s2) {
      h += '<form class="co-form" id="coStep2" novalidate><div class="choices" role="radiogroup" aria-label="Delivery">' + shipOptions().map(function (k) {
          var o = C.DELIVERY[k];
          return '<label class="choice"><input type="radio" name="ship" value="' + k + '"' + (d.ship === k ? ' checked' : '') + '><span><b>' + esc(o.label) + '</b><span class="when">' + esc(C.deliveryWhen(k)) + (o.atelier ? ', Colombo atelier' : '') + '</span>' +
            '<span>' + (k === 'colombo' ? 'A Maison courier brings it to you and waits while you open it.' : k === 'island' ? 'Insured, tracked and signed for, anywhere in Sri Lanka.' : k === 'atelier' ? 'Collect in person, with a fitting if you wish.' : 'Delivered duty paid: nothing is collected at your door.') + '</span></span></label>';
        }).join('') + '</div>' +
        '<label class="gift"><input type="checkbox" name="gift"' + (d.gift ? ' checked' : '') + '><span><b>Prepare as a gift</b><span>A complimentary calligraphy note card inside the rigid box.</span></span></label>' +
        '<div class="field gift-note"' + (d.gift ? '' : ' hidden') + '><label for="co-note">' + opt('Gift note') + '</label><textarea id="co-note" name="giftNote" maxlength="240" rows="2">' + esc(d.giftNote || '') + '</textarea></div>' +
        '<div class="field"><label for="co-instr">' + opt('Delivery instructions') + '</label><input id="co-instr" name="instr" autocomplete="off" value="' + esc(d.instr || '') + '"></div>' +
        '<button class="btn btn--gold btn--block" type="submit">Continue to payment</button></form>';
    } else if (co.step > 2) {
      h += '<div class="co-sum"><p>' + esc(C.DELIVERY[d.ship].label) + '<br><span class="when">' + esc(C.deliveryWhen(d.ship)) + '</span></p>' + (d.gift ? '<p>Prepared as a gift' + (d.giftNote ? ': “' + esc(d.giftNote) + '”' : '') + '</p>' : '') + '</div>';
    }
    h += '</section>';

    /* step 3: payment */
    h += '<section class="co-step' + (s3 ? ' is-open' : ' is-next') + '" aria-labelledby="coh3">' + stepHead(3, '<span id="coh3">Payment</span>', false);
    if (s3) {
      h += '<form class="co-form" id="coStep3" novalidate><div class="choices pay-choices" role="radiogroup" aria-label="Payment method">' + payOptions().map(function (k) {
          var o = PAY[k];
          return '<label class="choice"><input type="radio" name="pay" value="' + k + '"' + (d.pay === k ? ' checked' : '') + '><span><b>' + esc(o.label) + '</b><span>' + esc(o.text) + '</span>' + (o.marks.length ? '<span class="marks">' + o.marks.map(function (x) { return '<i>' + x + '</i>'; }).join('') + '</span>' : '') + '</span></label>';
        }).join('') + '</div>' +
        '<p class="secure-note">Payments are encrypted and processed by PayHere, a licensed Sri Lankan payment gateway. MANTHAI never sees or stores your card number.</p>' +
        '<div class="summary-rows">' + C.state.bag.map(function (l) { var p = C.product(l.id); return '<div class="summary-row"><span>' + esc(p.short) + ' · ' + esc(l.size) + (l.qty > 1 ? ' × ' + l.qty : '') + '</span><span>' + P(p.price * l.qty) + '</span></div>'; }).join('') +
          '<div class="summary-row"><span>' + esc(C.DELIVERY[d.ship].label) + '</span><span>Complimentary</span></div>' + (d.gift ? '<div class="summary-row"><span>Gift preparation</span><span>Complimentary</span></div>' : '') +
          '</div>' +
        '<div class="totals"><span>Total</span><output>' + P(C.bagTotalLKR()) + '</output></div>' +
        '<p class="fine-print">Demonstration storefront: no payment is taken and no email is sent.</p>' +
        '<button class="btn btn--solid" type="submit"><span class="btn__label">Complete acquisition</span></button></form>';
    }
    h += '</section></div>';
    panel.innerHTML = h;
  }

  function renderDone(panel) {
    var o = lastOrder; if (!o) { bagView = 'bag'; renderBag(); return; }
    var first = (o.name || '').split(' ')[0] || 'you', m = C.state.member;
    var payNote = o.method === 'bank' ? '<p class="notice"><strong>Bank transfer.</strong> Use the reference <b>' + esc(o.ref) + '</b>. The Maison account details are sent to ' + esc(o.email) + ', and your piece is prepared as soon as the transfer arrives.</p>'
      : o.method === 'lankaqr' ? '<p class="notice"><strong>LankaQR.</strong> In the live store, a LankaQR code appears here to scan with your banking app.</p>'
      : '<p class="notice"><strong>Card payment.</strong> In the live store, you complete payment on PayHere’s secure page and return here.</p>';
    panel.innerHTML = bagHead() +
      '<div class="confirm"><svg class="seal-mark seal-mark--record" viewBox="0 0 1000 860" aria-hidden="true"><use href="#spiral-seal"/></svg><h3>Thank you, ' + esc(first) + '.</h3><p class="order-ref" aria-label="Order reference">' + esc(o.ref) + '</p>' +
      '<p><b>' + esc(C.DELIVERY[o.ship].label) + '</b><br>' + esc(o.when) + '</p>' + payNote +
      (o.gift ? '<p class="fine-print">Prepared as a gift, with your note written by hand on the card.</p>' : '') +
      '<div><p class="search-hint">Authenticity records</p><div class="pass-list">' + o.items.map(function (it) { return '<div class="pass-item"><span>' + esc(it.short) + ' · ' + esc(it.size) + '</span><button class="link-btn" type="button" data-passport-open="' + esc(it.passport) + '">View record</button></div>'; }).join('') + '</div></div>' +
      (m ? '<p class="fine-print">Saved to your Private Circle as ' + esc(m.email) + '.</p>'
         : '<div class="circle-invite"><h4>Save your Private Circle profile</h4><p>Keep this order, your delivery address and the authenticity records of your pieces together. One click, no password.</p>' +
           '<button class="google-btn" type="button" data-google>Continue with Google</button>' +
           '<button class="btn btn--ghost btn--block" type="button" data-circle-link>Send a sign-in link to ' + esc(o.email) + '</button></div>') +
      '<p class="fine-print">Demonstration storefront: no payment was taken.</p>' +
      '<button class="btn btn--gold btn--block" type="button" data-close>Continue</button></div>';
  }

  shop.openBag = function () { bagView = C.state.bag.length ? bagView : 'bag'; if (bagView === 'done' && !lastOrder) bagView = 'bag'; renderBag(); C.open($('#layerBag')); };
  var bagPanel = $('#bagPanel');
  function bagChanged() { C.save(); C.updateBagUI(); renderBag(); C.emit('bag'); }
  bagPanel.addEventListener('click', function (e) {
    var line = e.target.closest('.bag-line'), key = line && line.getAttribute('data-key'), t;
    var l = key && C.state.bag.filter(function (x) { return x.key === key; })[0];
    if (e.target.closest('[data-inc]') && l) { if (C.available(C.product(l.id)) > 0) { l.qty += 1; bagChanged(); } return; }
    if (e.target.closest('[data-dec]') && l) { l.qty -= 1; if (l.qty <= 0) C.state.bag = C.state.bag.filter(function (x) { return x !== l; }); bagChanged(); return; }
    if (e.target.closest('[data-remove]') && l) { C.state.bag = C.state.bag.filter(function (x) { return x !== l; }); bagChanged(); C.toast('Removed from your Private Bag.'); return; }
    if (e.target.closest('[data-checkout]')) { co = { step: 1, d: {} }; bagView = 'checkout'; renderBag(); bagPanel.scrollTop = 0; var f = $('#co-email'); if (f && !f.value) f.focus({ preventScroll: true }); return; }
    if (e.target.closest('[data-back]')) { bagView = 'bag'; renderBag(); return; }
    if ((t = e.target.closest('[data-edit]'))) { co.step = Number(t.getAttribute('data-edit')); renderBag(); var first = $('#checkout .is-open input, #checkout .is-open select'); if (first) first.focus(); return; }
    if (e.target.closest('[data-browse]')) { C.close($('#layerBag')); setTimeout(function () { C.scrollTo('collection'); }, 600); return; }
    if (e.target.closest('[data-stylist]')) { M.ui.openStylist(); return; }
    if (e.target.closest('[data-salon]')) { M.ui.openSalon(); return; }
    var pp = e.target.closest('[data-passport-open]'); if (pp) { M.ui.openPassport(null, pp.getAttribute('data-passport-open')); return; }
    if (e.target.closest('[data-google]')) { M.ui.googleSignIn(function () { C.toast('Your Private Circle profile is saved.'); if (bagView === 'done') renderBag(); }); return; }
    if (e.target.closest('[data-circle-link]') && lastOrder) { M.ui.sendCircleLink(lastOrder.email); }
  });
  bagPanel.addEventListener('change', function (e) {
    var t = e.target;
    if (t.matches('[data-gift]')) { giftState().on = t.checked; C.save(); var gn = $('.gift-note', bagPanel); if (gn) gn.hidden = !t.checked; return; }
    if (t.form && t.form.id === 'coStep2' && t.name === 'gift') { var n2 = $('.gift-note', t.form); if (n2) n2.hidden = !t.checked; }
  });
  bagPanel.addEventListener('input', function (e) { if (e.target.matches('[data-gift-note]')) { giftState().note = e.target.value; C.save(); } });
  bagPanel.addEventListener('submit', function (e) {
    var f = e.target; if (!/^coStep[123]$/.test(f.id)) return;
    e.preventDefault();
    var bad = null, d = co.d;
    function need(name, ok, msg) { var i = f.elements[name]; if (!ok(i.value)) { C.setError(i, msg); bad = bad || i; } else C.setError(i, ''); }
    if (f.id === 'coStep1') {
      need('email', C.validEmail, 'Enter a valid email address, such as name@example.com.');
      need('phone', C.validPhone, 'Enter a mobile number with at least 7 digits.');
      need('name', function (v) { return v.trim().length > 1; }, 'Enter your full name.');
      need('addr', function (v) { return v.trim().length > 4; }, 'Enter your delivery address.');
      need('city', function (v) { return v.trim().length > 1; }, 'Enter your city.');
      if (bad) { bad.focus(); return; }
      ['email', 'phone', 'name', 'addr', 'addr2', 'city', 'post', 'country'].forEach(function (k) { d[k] = f.elements[k].value.trim(); });
      co.step = 2;
    } else if (f.id === 'coStep2') {
      d.ship = (f.querySelector('input[name=ship]:checked') || {}).value || shipOptions()[0];
      d.gift = f.elements.gift.checked; d.giftNote = f.elements.giftNote.value.trim(); d.instr = f.elements.instr.value.trim();
      var g = giftState(); g.on = d.gift; g.note = d.giftNote; C.save();
      co.step = 3;
    } else {
      d.pay = (f.querySelector('input[name=pay]:checked') || {}).value || payOptions()[0];
      placeOrder(); return;
    }
    renderBag();
    var open = $('#checkout .is-open'); if (open) { open.scrollIntoView({ block: 'nearest', behavior: C.reduced() ? 'auto' : 'smooth' }); var fi = $('input, select', open); if (fi) fi.focus({ preventScroll: true }); }
  });
  function placeOrder() {
    var d = co.d, items = [];
    C.state.bag.forEach(function (l) { var p = C.product(l.id); for (var i = 0; i < l.qty; i++) items.push({ id: p.id, short: p.short, name: p.name, size: l.size, price: p.price, passport: C.uid('MNT') }); });
    var order = { ref: C.uid('ORD'), date: new Date().toISOString(), items: items, totalLKR: C.bagTotalLKR(), currency: C.state.currency, display: C.price(C.bagTotalLKR()),
      method: d.pay, country: d.country, email: d.email, name: d.name, phone: d.phone, ship: d.ship, when: C.deliveryWhen(d.ship), gift: d.gift, giftNote: d.giftNote,
      address: [d.addr, d.addr2, d.city, d.post, d.country].filter(Boolean).join(', '), step: 0 };
    C.state.orders.unshift(order);
    var addrs = C.state.addresses || (C.state.addresses = []);
    if (addrs.indexOf(order.address) < 0) addrs.unshift(order.address);
    C.state.bag = []; C.state.gift = { on: false, note: '' }; C.save(); C.updateBagUI(); C.emit('bag');
    lastOrder = order; bagView = 'done'; renderBag(); bagPanel.scrollTop = 0;
  }
  C.on('close', function (dlg) { if (dlg.id === 'layerBag' && bagView === 'done') { bagView = 'bag'; lastOrder = null; } });
  C.on('member', function () { if ($('#layerBag').open && bagView === 'done') renderBag(); });

  /* live updates when stock changes */
  C.on('bag', function () { syncAddButtons(); });

  /* ======================= wishlist ======================= */
  shop.toggleWish = function (id) {
    var w = C.state.wishlist || (C.state.wishlist = []), i = w.indexOf(id);
    if (i > -1) w.splice(i, 1); else w.unshift(id);
    C.save(); C.emit('wishlist');
    C.toast(i > -1 ? 'Removed from your wishlist.' : (C.state.member ? 'Saved to your Private Circle wishlist.' : 'Saved to your wishlist on this device.'));
    return i < 0;
  };

  /* ======================= init ======================= */
  renderTabs(); renderGallery(); C.updateBagUI();
  $('#bagBtn').addEventListener('click', shop.openBag);
})();
