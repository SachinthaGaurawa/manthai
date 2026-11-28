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
  shop.editionTag = function (p) { return shop.closed(p) ? 'Edition Closed · Permanently Archived' : p.edition ? 'Numbered Edition of ' + p.edition : 'Small-Batch Release · ' + p.crafted + ' Pieces'; };
  /* Single-run rule: every release is one numbered run. A size at 0 is fully acquired for good, and an edition at 0
     across every size is closed and archived. Never promise a size or a piece will come back. */
  shop.closed = function (p) { return !!p && !(p.remaining > 0); };
  shop.editionNo = function (p) { return 'Edition ' + ((p && p.release) || '01'); };
  shop.sizeGone = function (p) { return 'This size in ' + shop.editionNo(p) + ' has been fully acquired and will not be restocked.'; };
  shop.closedNote = function (p) { return 'All ' + (p.edition || p.crafted) + ' numbered pieces of this edition have been acquired. This silhouette is permanently retired in the House Archive and will never be reproduced.'; };
  /* the quiet secondary link on a closed edition: recorded with the Private Circle early access preference */
  shop.requestEarly = function (btn) {
    var n = C.state.notify || (C.state.notify = {}); n.early = true; C.save();
    if (btn) { btn.setAttribute('aria-pressed', 'true'); btn.textContent = 'Early Access Requested'; }
    C.toast('Noted. You will be invited privately before the next edition is released.');
  };
  shop.archivedHTML = function (p) {
    var asked = !!(C.state.notify || {}).early;
    return '<div class="archived" role="status"><p class="archived__k">Edition Closed · Permanently Archived</p>' +
      '<p class="archived__d">' + esc(shop.closedNote(p)) + '</p>' +
      '<button class="archived__link" type="button" data-early aria-pressed="' + asked + '">' + (asked ? 'Early Access Requested' : 'Request Early Access to Next Edition') + '</button></div>';
  };
  /* WhatsApp hand-off to the Colombo stylist, pre-filled with the garment and the chosen size */
  shop.stylistHref = function (p, size) {
    var msg = 'Hello House of MANTHAI, I would like to consult a Colombo stylist about the ' + p.name + (size ? ' in Size ' + size : '') + '.';
    return 'https://wa.me/' + M.CONFIG.whatsapp + '?text=' + encodeURIComponent(msg);
  };
  shop.lowStock = function (p, size) { var n = p.stock && size ? p.stock[size] : 0; return n > 0 && n <= 3 ? n : 0; };

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
      return '<span' + (out ? ' class="is-out" title="Fully acquired"' : '') + '>' + z + (out ? '<span class="sr-only"> (fully acquired)</span>' : '') + '</span>';
    }).join('') + '</p>';
  }
  function cardHTML(p, i, size, row) {
    var cls = 'card' + (size === 2 ? ' is-wide' : '') + (size === 1 ? ' is-solo' : '') + (shop.closed(p) ? ' is-archived' : '');
    if ((size === 2 && row === 1) || (size === 3 && row === 1)) cls += ' is-drop';
    return '<article class="' + cls + '" data-id="' + p.id + '">' +
      '<button class="card__frame" type="button" data-open="' + p.id + '" tabindex="-1" aria-hidden="true" data-cursor="View" data-media-slot="' + p.id + '" data-prompt="' + esc(p.prompt) + '">' +
      '<span class="plate plate--a">' + C.plateHTML(p, 'form', 'card') + '</span><span class="plate plate--b">' + C.plateHTML(p, 'move', 'card') + '</span>' +
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

  /* ======================= the piece page (/pieces/[slug]) ======================= */
  /* A full page, not a drawer: an unhurried vertical stack of 3:4 plates on the left, a calm sticky
     acquisition panel on the right. Every plate opens the inspection lightbox; there is no hover loupe. */
  var pdp = null, ctaIO = null;
  /* the plates a piece shows, in order: front, a second clean angle, then the textile and seam macro */
  function shotsFor(p) {
    var m = p.media || {}, out = [['form', 'Front']];
    out.push([m.back ? 'back' : 'move', 'Silhouette Detail']);
    out.push(['detail', 'Textile & Seam']);
    return out;
  }
  function crumbFor(p) { var t = (p.tabs || [])[0] || 'All'; return { tab: t, label: p.collection || t }; }
  function editionLine(p) { return esc(p.edition ? 'Edition of ' + p.edition : 'Small-Batch Release of ' + p.crafted) + C.dref(6) + ' · Cut &amp; Hand-Finished in Colombo'; }
  function wishLabel(on) { return on ? 'Silhouette Saved' : 'Save Silhouette'; }

  function pdpHTML(p) {
    var SH = shotsFor(p), cr = crumbFor(p), feel = p.feel || {};
    var sizes = M.SIZECHART.sizes.map(function (s) {
      var out = p.soldOut.indexOf(s) > -1;
      return '<button type="button" class="size" role="radio" data-size="' + s + '" aria-checked="false"' + (out ? ' aria-disabled="true" aria-label="' + s + ', fully acquired" title="' + esc(shop.sizeGone(p)) + '"' : '') + '>' + s + '</button>';
    }).join('');
    var fit = typeof p.fit === 'number' ? p.fit : 1, fitIdx = Math.round(fit);
    var fitWord = fit < 0.85 ? 'Runs slightly small' : fit > 1.15 ? 'Runs slightly large' : 'True to size';
    var wished = (C.state.wishlist || []).indexOf(p.id) > -1;
    var pairs = (p.pairs || []).map(C.product).filter(Boolean).slice(0, 3);
    var md = M.MODEL, closed = shop.closed(p);
    return '' +
      '<div class="pdp">' +
        '<div class="pdp__gallery" role="group" aria-label="' + esc(p.name) + ' photographs">' +
          SH.map(function (v, i) {
            return '<figure class="pdp__plate" data-shot="' + i + '">' +
              '<button class="pdp__frame" type="button" data-inspect="' + i + '" data-cursor="Inspect" aria-label="Inspect ' + esc(v[1].toLowerCase()) + ' in full screen">' + (i ? C.plateHTML(p, v[0], 'pdp') : C.plateHTML(p, v[0], 'pdp').replace(' loading="lazy"', ' fetchpriority="high"')) + '</button>' +
              '<figcaption class="pdp__cap"><span>' + esc(v[1]) + '</span><button class="pdp__inspect" type="button" data-inspect="' + i + '">Inspect Fabric &amp; Seam</button></figcaption>' +
            '</figure>';
          }).join('') +
        '</div>' +
        '<div class="pdp__details">' +
          '<nav class="crumb" aria-label="Breadcrumb"><a href="/" data-crumb="All">Collections</a><span aria-hidden="true">/</span><a href="/" data-crumb="' + esc(cr.tab) + '">' + esc(cr.label) + '</a></nav>' +
          '<h1 class="pdp__name" id="pdpTitle">' + esc(p.name) + '</h1>' +
          '<p class="pdp__edition">' + editionLine(p) + '</p>' +
          '<p class="pdp__price">' + P(p.price) + '</p>' +
          '<p class="pdp__summary">' + esc(p.summary) + '</p>' +
          '<div class="pdp__size' + (closed ? ' is-archived' : '') + '"><div class="opt-label"><span id="sizeLabel">Size</span><span class="opt-label__guide"><button class="link-btn" type="button" data-sizeguide>Size &amp; Fit Guide</button>' + C.dref(4) + '</span></div>' +
            '<div class="sizes" role="radiogroup" aria-labelledby="sizeLabel" id="sizes">' + sizes + '</div>' +
            '<p class="field__error" id="sizeError" role="alert"></p>' +
            '<p class="stock-cue" id="stockCue" aria-live="polite"></p>' +
            '<p class="model-note">Model is ' + md.height + ' · Bust ' + md.bust + ' cm · Waist ' + md.waist + ' cm · wears Size ' + md.size + '</p>' +
            '<div class="fitbar"><p class="fitbar__title">Fit consensus <span>' + esc(fitWord) + '</span></p>' +
              '<div class="fitbar__track" role="img" aria-label="Fit consensus: ' + esc(fitWord.toLowerCase()) + '"><span class="fitbar__mark" style="left:' + (fit / 2 * 100).toFixed(0) + '%"></span></div>' +
              '<div class="fitbar__labels" aria-hidden="true">' + M.FIT_LABELS.map(function (l, i) { return '<span' + (i === fitIdx ? ' class="is-on"' : '') + '>' + l + '</span>'; }).join('') + '</div></div>' +
          '</div>' +
          '<div class="pdp__cta' + (closed ? ' is-archived' : '') + '" id="pdpCta">' +
            (closed ? shop.archivedHTML(p) : '<button class="btn btn--solid btn--sheen" type="button" data-add><span class="btn__label">Reserve in Your Bag</span></button>') +
            '<div class="pdp__duo">' +
              '<button class="btn btn--ghost" type="button" data-wish aria-pressed="' + wished + '">' + wishLabel(wished) + '</button>' +
              '<a class="btn btn--ghost" id="stylistLink" href="' + esc(shop.stylistHref(p, null)) + '" target="_blank" rel="noopener" data-wa><span class="btn__label">Consult <span class="pdp__dlong">Colombo </span>Stylist</span></a>' +
            '</div>' +
          '</div>' +
          (closed ? '' : '<div class="clarity">' +
            '<p><b>Total: ' + P(p.price) + '</b> · Complimentary Insured Delivery <span id="pdpWhen"></span>' + C.dref(5) + '</p>' +
            '<p><b>Gifting included.</b> Complimentary sealed lacquered gift presentation and a handwritten calligraphy note, available at checkout. Prices are omitted on gift receipts.</p>' +
            '<p><b>Risk-free stewardship.</b> 14-day complimentary size exchange, subject to remaining availability within the numbered edition, or a transparent refund to your original payment method.</p>' +
          '</div>') +
          (feel.fabric ? '<div class="feel"><p class="feel__k">Feel &amp; Drape' + C.dref(3) + '</p><p class="feel__v">' + esc(feel.fabric) + ' · ' + esc(feel.hand) + ' · ' + feel.gsm + ' GSM</p></div>' : '') +
          '<div class="pdp__acc">' +
            '<details><summary>Atelier Craft &amp; Textile Provenance</summary><p>' + esc(p.story) + '</p><p><b>Materials.</b> ' + esc(p.materials) + '</p><p><b>Weight.</b> ' + esc(p.weight || '') + '</p><p><b>Drape and lining.</b> ' + esc(p.drape || '') + '</p><p><b>Provenance.</b> ' + esc(p.provenance) + '.</p></details>' +
            '<details><summary>Garment Care</summary><p>' + esc(p.care) + '</p><ul class="care-list">' + M.CARE.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul></details>' +
            '<details><summary>Packaging &amp; Verification Card</summary><p>Your piece arrives in a rigid gatefold box in high-gloss midnight navy lacquer, lined in velvet garnet and stamped in gold foil with the Unbounded Spiral Seal.' + C.dref(1) + ' Inside, it rests folded in acid-free tissue under a gold wafer, with a woven silk neck label. Beneath it, the Private Circle Presentation Case holds a brushed black metal Verification Card with NFC and QR, and under the case lie a thick cotton Story Card and, beneath it, your Certificate of Authenticity and Ownership. Tap the card or scan its code to open the authenticity record.</p><p>For couriered orders across Sri Lanka, your signature midnight-navy lacquered presentation box arrives safeguarded inside an unbranded, reinforced protective outer shipping carton.</p><button class="link-btn" type="button" data-passport="' + p.id + '">Open a sample record</button></details>' +
          '</div>' +
        '</div>' +
      '</div>' +
      (pairs.length ? '<section class="pairing" aria-labelledby="pairTitle"><div class="pairing__head"><p class="eyebrow">Curated by the House</p><h2 class="pairing__title" id="pairTitle">Complete the Silhouette</h2></div><div class="pairing__list" data-n="' + pairs.length + '">' + pairs.map(function (q) {
        return '<a class="pair" href="/pieces/' + q.id + '" data-pair="' + q.id + '"><span class="pair__plate">' + C.plateHTML(q, 'form', 'pair') + '</span><span class="pair__name">' + esc(q.name) + '</span><span class="pair__price">' + P(q.price) + '</span></a>';
      }).join('') + '</div></section>' : '') +
      (closed ? '' : '<div class="pdp__sticky" id="pdpSticky" aria-hidden="true"><span class="pdp__sticky-meta"><span class="pdp__sticky-name">' + esc(p.short) + '</span><span class="pdp__price">' + P(p.price) + '</span></span><button class="btn btn--solid btn--sheen" type="button" data-add tabindex="-1"><span class="btn__label">Reserve in Your Bag</span></button></div>');
  }
  function syncShip() {
    var w = $('#pdpWhen'); if (!w) return;
    w.textContent = '(Colombo 01–15 arrives by ' + C.fmtDay(C.addBusinessDays(1)) + '; Islandwide by ' + C.fmtDay(C.addBusinessDays(3)) + ')';
  }
  /* the frosted bar on phones appears once the main Reserve button has scrolled away */
  function watchCta() {
    if (ctaIO) ctaIO.disconnect();
    var cta = $('#pdpCta'), bar = $('#pdpSticky'); if (!cta || !bar || !('IntersectionObserver' in window)) return;
    ctaIO = new IntersectionObserver(function (en) {
      var show = !en[0].isIntersecting && en[0].boundingClientRect.top < 0;
      bar.classList.toggle('is-on', show); bar.setAttribute('aria-hidden', show ? 'false' : 'true');
      $$('button', bar).forEach(function (b) { b.tabIndex = show ? 0 : -1; });
    });
    ctaIO.observe(cta);
  }

  /* render the page for a piece (called by the router) */
  shop.renderPiece = function (id) {
    var p = C.product(id); if (!p) return;
    pdp = { p: p, size: null };
    $('#pdpPanel').innerHTML = pdpHTML(p);
    var fs = C.state.fitSize; if (fs && p.soldOut.indexOf(fs) < 0) { pdp.size = fs; var sb = $('#sizes [data-size="' + fs + '"]'); if (sb) sb.setAttribute('aria-checked', 'true'); }
    syncAddButtons(); syncShip(); syncSize(); watchCta();
  };
  /* every card, search hit, pairing and panel link arrives here */
  shop.openProduct = function (id) {
    if (!C.product(id)) return;
    ['#layerBag', '#layerSize', '#layerInspect'].forEach(function (s) { var d = $(s); if (d && d.open) C.close(d); });
    M.ui.route('piece', null, true, id);
  };

  function syncSize() {
    if (!pdp) return;
    var n = shop.lowStock(pdp.p, pdp.size), cue = $('#stockCue'), wa = $('#stylistLink');
    if (cue) { cue.classList.remove('is-gone'); cue.textContent = n ? 'Only ' + n + ' remaining in Size ' + pdp.size : ''; }
    if (wa) wa.href = shop.stylistHref(pdp.p, pdp.size);
  }
  function syncAddButtons() {
    if (!pdp) return;
    var a = C.available(pdp.p);
    $$('#pdpPanel [data-add]').forEach(function (b) {
      b.disabled = a <= 0;
      if (!b.classList.contains('is-reserved')) b.querySelector('.btn__label').textContent = a <= 0 ? 'Held in private bags' : 'Reserve in Your Bag';
    });
  }

  function addToBag() {
    var p = pdp.p, err = $('#sizeError');
    if (p.sizing === 'apparel' && !pdp.size) {
      err.textContent = 'Please choose a size.';
      var first = $('#sizes .size:not([aria-disabled="true"])');
      if (first) { if (first.getBoundingClientRect().top < 80) first.scrollIntoView({ block: 'center', behavior: C.reduced() ? 'auto' : 'smooth' }); first.focus({ preventScroll: true }); }
      return;
    }
    if (shop.closed(p)) { C.toast('Edition closed. Every numbered piece has been acquired.'); return; }
    if (C.available(p) <= 0) { C.toast('Every piece of this edition is already reserved.'); return; }
    var size = pdp.size, key = C.lineKey(p.id, size, false);
    var line = C.state.bag.filter(function (l) { return l.key === key; })[0];
    if (line) line.qty += 1; else C.state.bag.push({ key: key, id: p.id, size: size, qty: 1 });
    C.save(); C.updateBagUI(); C.emit('bag');
    $$('#pdpPanel [data-add]').forEach(function (b) {
      b.classList.add('is-reserved'); b.querySelector('.btn__label').textContent = 'Reserved in Your Private Bag';
      setTimeout(function () { b.classList.remove('is-reserved'); syncAddButtons(); }, 2600);
    });
    setTimeout(function () { if (M.ui.curRoute() === 'piece') shop.openBag(); }, C.reduced() ? 0 : 700);
  }

  $('#pdpPanel').addEventListener('click', function (e) {
    if (!pdp) return;
    var t;
    if ((t = e.target.closest('[data-inspect]'))) { shop.openInspect(+t.getAttribute('data-inspect')); return; }
    if ((t = e.target.closest('[data-crumb]'))) { e.preventDefault(); var tab = t.getAttribute('data-crumb'); M.ui.route('home', 'collection'); setTimeout(function () { shop.setFilter(tab); }, 420); return; }
    if (e.target.closest('[data-sizeguide]')) { shop.openSize(pdp.p.id); return; }
    if ((t = e.target.closest('.size'))) {
      if (t.getAttribute('aria-disabled') === 'true') { var cg = $('#stockCue'); if (cg) { cg.classList.add('is-gone'); cg.textContent = 'Size ' + t.getAttribute('data-size') + '. ' + shop.sizeGone(pdp.p); } return; }
      pdp.size = t.getAttribute('data-size'); $$('#sizes .size').forEach(function (s) { s.setAttribute('aria-checked', s === t); }); $('#sizeError').textContent = ''; syncSize(); return;
    }
    if (e.target.closest('[data-add]')) { addToBag(); return; }
    if ((t = e.target.closest('[data-early]'))) { shop.requestEarly(t); return; }
    if ((t = e.target.closest('[data-wish]'))) { var on = shop.toggleWish(pdp.p.id, true); t.setAttribute('aria-pressed', on); t.textContent = wishLabel(on); C.toast(on ? 'Saved to your silhouettes. They stay on this device and join your Private Circle when you sign in.' : 'Removed from your silhouettes.'); return; }
    if ((t = e.target.closest('[data-pair]'))) { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); shop.openProduct(t.getAttribute('data-pair')); return; }
    if ((t = e.target.closest('[data-passport]'))) { M.ui.openPassport(t.getAttribute('data-passport')); return; }
  });
  $('#pdpPanel').addEventListener('keydown', function (e) {
    var t = e.target.closest('.size'); if (!t || !pdp || pdp.p.sizing !== 'apparel') return;
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    var all = $$('#sizes .size:not([aria-disabled="true"])'), i = all.indexOf(t) + (e.key === 'ArrowRight' ? 1 : -1);
    i = (i + all.length) % all.length; all[i].focus(); all[i].click(); e.preventDefault();
  });

  /* ---------- inspection lightbox: click toggles a 2.5x macro, drag pans, pinch on touch ---------- */
  var insp = { i: 0, z: false, x: 0, y: 0 };
  function inspRender() {
    var p = pdp.p, SH = shotsFor(p), v = SH[insp.i];
    $('#inspectPanel').innerHTML =
      '<div class="inspect__bar"><p class="inspect__title"><span>' + esc(p.short) + '</span> · ' + esc(v[1]) + ' <span class="inspect__n">' + (insp.i + 1) + ' / ' + SH.length + '</span></p>' +
        '<button class="icon-btn" type="button" data-close aria-label="Close inspection">' + X + '</button></div>' +
      '<div class="inspect__stage" id="inspStage" tabindex="0" aria-label="' + esc(v[1]) + '. Click or press Enter to zoom; drag or use the arrow keys to move.">' +
        '<div class="inspect__img" id="inspImg">' + C.plateHTML(p, v[0], 'full').replace(' loading="lazy"', '') + '</div></div>' +
      '<div class="inspect__nav">' +
        '<button class="btn btn--ghost btn--sm" type="button" data-insp="-1" aria-label="Previous photograph">Previous</button>' +
        '<p class="inspect__hint" aria-hidden="true">Click to zoom 2.5x · Drag to explore</p>' +
        '<button class="btn btn--ghost btn--sm" type="button" data-insp="1" aria-label="Next photograph">Next</button></div>';
    insp.z = false; insp.x = 0; insp.y = 0; inspApply();
  }
  function inspApply() {
    var img = $('#inspImg'), st = $('#inspStage'); if (!img) return;
    img.style.transform = insp.z ? 'translate(' + insp.x + 'px,' + insp.y + 'px) scale(2.5)' : 'none';
    st.classList.toggle('is-zoomed', insp.z);
  }
  function inspClamp() {
    var st = $('#inspStage'); if (!st) return;
    var mx = st.clientWidth * 0.75, my = st.clientHeight * 0.75;
    insp.x = Math.max(-mx, Math.min(mx, insp.x)); insp.y = Math.max(-my, Math.min(my, insp.y));
  }
  function inspZoomAt(cx, cy) {
    var st = $('#inspStage'), r = st.getBoundingClientRect();
    if (insp.z) { insp.z = false; insp.x = 0; insp.y = 0; }
    else { insp.z = true; insp.x = (r.width / 2 - (cx - r.left)) * 1.5; insp.y = (r.height / 2 - (cy - r.top)) * 1.5; inspClamp(); }
    inspApply();
  }
  shop.openInspect = function (i) { if (!pdp) return; insp.i = i || 0; inspRender(); C.open($('#layerInspect')); };
  (function () {
    var panel = $('#inspectPanel'), drag = null, moved = false;
    panel.addEventListener('click', function (e) {
      var t = e.target.closest('[data-insp]');
      if (t) { var n = shotsFor(pdp.p).length; insp.i = (insp.i + (+t.getAttribute('data-insp')) + n) % n; inspRender(); return; }
    });
    panel.addEventListener('pointerdown', function (e) {
      if (!e.target.closest('#inspStage') || e.pointerType === 'touch') return;
      drag = { sx: e.clientX, sy: e.clientY, x: insp.x, y: insp.y }; moved = false;
    });
    window.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
      if (moved && insp.z) { insp.x = drag.x + dx; insp.y = drag.y + dy; inspClamp(); inspApply(); }
    });
    window.addEventListener('pointerup', function (e) {
      if (!drag) return; var was = moved; drag = null;
      if (!was && e.target.closest && e.target.closest('#inspStage')) inspZoomAt(e.clientX, e.clientY);
    });
    /* touch: double tap toggles the macro; pinch is left to the browser */
    var lastTap = 0;
    panel.addEventListener('touchend', function (e) {
      if (!e.target.closest('#inspStage') || e.changedTouches.length !== 1) return;
      var now = Date.now(), t = e.changedTouches[0];
      if (now - lastTap < 320) { inspZoomAt(t.clientX, t.clientY); lastTap = 0; e.preventDefault(); } else lastTap = now;
    });
    panel.addEventListener('keydown', function (e) {
      if (!e.target.closest('#inspStage')) return;
      var st = $('#inspStage'), r = st.getBoundingClientRect(), step = 60;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inspZoomAt(r.left + r.width / 2, r.top + r.height / 2); }
      else if (insp.z && /^Arrow/.test(e.key)) {
        e.preventDefault();
        if (e.key === 'ArrowLeft') insp.x += step; else if (e.key === 'ArrowRight') insp.x -= step; else if (e.key === 'ArrowUp') insp.y += step; else insp.y -= step;
        inspClamp(); inspApply();
      } else if (!insp.z && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) { var b = $('[data-insp="' + (e.key === 'ArrowLeft' ? -1 : 1) + '"]', panel); if (b) b.click(); var s2 = $('#inspStage'); if (s2) s2.focus(); }
    });
  })();


  /* ======================= size and fit guide ======================= */
  /* Product-specific: a gown reads bust, waist, hip and hollow-to-hem; a blazer reads shoulder and sleeve;
     trousers read waist, hip, rise and inseam. Body sizes and international conversions sit underneath. */
  var guideUnit = 'cm';
  function gv(cm) { return guideUnit === 'in' ? (Math.round(cm / 2.54 * 10) / 10).toFixed(1) : (Math.round(cm * 10) / 10).toString(); }
  function guideRows(p) {
    var S = M.SIZECHART, G = M.GUIDE_EXTRA, kind = p.kind;
    var lenS = function (step) { return S.sizes.map(function (_, i) { return p.hollow + (i - 1) * step; }); };
    if (kind === 'blazer') return [['Bust', S.bust], ['Waist', S.waist], ['Shoulder', G.shoulder], ['Sleeve', G.sleeve], ['Back Length', lenS(1)]];
    if (kind === 'cape') return [['Bust', S.bust], ['Shoulder', G.shoulder], ['Sleeve', G.sleeve], ['Back Length', lenS(1)]];
    if (kind === 'trouser') return [['Waist', S.waist], ['Hip', S.hip], ['Front Rise', G.rise], ['Inseam', G.inseam]];
    return [['Bust', S.bust], ['Waist', S.waist], ['Hip', S.hip], ['Hollow-to-Hem', lenS(S.hollowStep)]];
  }
  function guideHow(p) {
    var lower = p.kind === 'trouser';
    var steps = lower
      ? [['Waist', 'Around the natural waistline, the narrowest part of the torso.'], ['Hip', 'Around the fullest part of the hips, feet together.'], ['Front Rise', 'From the crotch seam to the top of the waistband.'], ['Inseam', 'From the crotch to the ankle bone, along the inner leg.']]
      : p.kind === 'blazer' || p.kind === 'cape'
      ? [['Bust', 'Around the fullest part of the bust, tape level.'], ['Shoulder', 'Across the back, from one shoulder point to the other.'], ['Sleeve', 'From the shoulder point to the wrist, arm relaxed.'], ['Back Length', 'From the base of the neck at the back, down to the hem.']]
      : [['Bust', 'Around the fullest part of the bust, tape level.'], ['Waist', 'Around the natural waistline, the narrowest part of the torso.'], ['Hip', 'Around the fullest part of the hips, feet together.'], ['Hollow-to-Hem', 'From the hollow at the base of the neck, straight down to the hem.']];
    var fig = '<svg class="howto__fig" viewBox="0 0 120 214" aria-hidden="true"><path class="howto__form" d="M52 10 C52 18 44 22 31 27 C22 31 26 50 30 62 C34 78 40 90 40 100 C40 112 28 124 28 138 C28 160 32 182 34 204 L86 204 C88 182 92 160 92 138 C92 124 80 112 80 100 C80 90 86 78 90 62 C94 50 98 31 89 27 C76 22 68 18 68 10 Z"/>' +
      (lower
        ? '<line x1="36" y1="100" x2="84" y2="100"/><line x1="24" y1="138" x2="96" y2="138"/><line x1="60" y1="100" x2="60" y2="150"/><line x1="70" y1="150" x2="70" y2="204"/><g class="howto__n"><circle cx="30" cy="100" r="5"/><text x="30" y="102.5">1</text><circle cx="18" cy="138" r="5"/><text x="18" y="140.5">2</text><circle cx="54" cy="125" r="5"/><text x="54" y="127.5">3</text><circle cx="78" cy="180" r="5"/><text x="78" y="182.5">4</text></g>'
        : p.kind === 'blazer' || p.kind === 'cape'
        ? '<line x1="26" y1="62" x2="94" y2="62"/><line x1="31" y1="28" x2="89" y2="28"/><line x1="96" y1="30" x2="104" y2="112"/><line x1="60" y1="12" x2="60" y2="140"/><g class="howto__n"><circle cx="20" cy="62" r="5"/><text x="20" y="64.5">1</text><circle cx="60" cy="20" r="5"/><text x="60" y="22.5">2</text><circle cx="108" cy="78" r="5"/><text x="108" y="80.5">3</text><circle cx="66" cy="120" r="5"/><text x="66" y="122.5">4</text></g>'
        : '<line x1="26" y1="62" x2="94" y2="62"/><line x1="36" y1="100" x2="84" y2="100"/><line x1="24" y1="138" x2="96" y2="138"/><line x1="60" y1="14" x2="60" y2="204"/><g class="howto__n"><circle cx="20" cy="62" r="5"/><text x="20" y="64.5">1</text><circle cx="30" cy="100" r="5"/><text x="30" y="102.5">2</text><circle cx="18" cy="138" r="5"/><text x="18" y="140.5">3</text><circle cx="66" cy="182" r="5"/><text x="66" y="184.5">4</text></g>') +
      '</svg>';
    return '<div class="howto"><h3 class="howto__title">How to Measure</h3><div class="howto__grid">' + fig + '<ol class="howto__list">' +
      steps.map(function (s) { return '<li><b>' + s[0] + '.</b> ' + s[1] + '</li>'; }).join('') + '</ol></div></div>';
  }
  function renderSize(pid) {
    var p = C.product(pid) || M.PRODUCTS[0], S = M.SIZECHART, md = M.MODEL;
    function row(label, arr) { return '<tr><th scope="row">' + label + '</th>' + arr.map(function (v) { return '<td>' + gv(v) + '</td>'; }).join('') + '</tr>'; }
    $('#sizePanel').setAttribute('data-product', p.id);
    $('#sizePanel').innerHTML =
      '<div class="panel-head"><h2 id="sizeTitle">Size &amp; Fit Guide</h2><button class="icon-btn" type="button" data-close aria-label="Close size guide">' + X + '</button></div>' +
      '<div class="panel-body">' +
        '<p class="sg-lede">' + esc(p.short) + '. Garment-specific measurements in ' + (guideUnit === 'in' ? 'inches' : 'centimetres') + '.' + C.dref(4) + '</p>' +
        '<p class="sg-model">Model is ' + md.height + ' · Bust ' + md.bust + ' cm · Waist ' + md.waist + ' cm · wears Size ' + md.size + '</p>' +
        '<div class="seg" role="group" aria-label="Units"><button type="button" data-sunit="cm" aria-pressed="' + (guideUnit === 'cm') + '">cm</button><button type="button" data-sunit="in" aria-pressed="' + (guideUnit === 'in') + '">in</button></div>' +
        '<div class="size-table-wrap"><table class="size-table"><caption class="sr-only">Size chart for the ' + esc(p.short) + ' in ' + (guideUnit === 'in' ? 'inches' : 'centimetres') + '</caption>' +
          '<thead><tr><th scope="col"><span class="sr-only">Measurement</span></th>' + S.sizes.map(function (z) { return '<th scope="col">' + z + '</th>'; }).join('') + '</tr></thead><tbody>' +
          guideRows(p).map(function (r) { return row(r[0], r[1]); }).join('') +
          ['UK', 'EU', 'US'].map(function (k) { return '<tr class="intl"><th scope="row">' + k + '</th>' + M.SIZE_INTL[k].map(function (v) { return '<td>' + v + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' +
        guideHow(p) +
        '<p class="field__hint">Between sizes, choose the larger, or ask the stylist.</p>' +
        '<p class="sg-ask">Unsure of your size? Our stylist replies on WhatsApp.</p>' +
        '<a class="btn btn--ghost btn--block" href="' + esc(shop.stylistHref(p, pdp && pdp.p.id === p.id ? pdp.size : null)) + '" target="_blank" rel="noopener" data-wa>Consult Our Colombo Stylist</a>' +
      '</div>';
  }
  shop.openSize = function (pid) { renderSize(pid); C.open($('#layerSize')); };
  $('#sizePanel').addEventListener('click', function (e) {
    var u = e.target.closest('[data-sunit]'); if (u) { guideUnit = u.getAttribute('data-sunit'); renderSize($('#sizePanel').getAttribute('data-product')); var b = $('#sizePanel [data-sunit="' + guideUnit + '"]'); if (b) b.focus(); return; }
  });

  /* ======================= bag and checkout ======================= */
  /* The bag stays a drawer. The acquisition itself is a distraction-free page at /checkout,
     and the Digital Acquisition Record lives at /checkout/confirmed. */
  var lastOrder = null, cxFrom = null;
  var PAY = {
    payhere: { label: 'PayHere Secure Card', text: 'Visa, Mastercard and American Express, charged in Sri Lankan rupees.', marks: ['Visa', 'Mastercard', 'AMEX'] },
    lankaqr: { label: 'LankaQR Instant Pay', text: 'Scan with any Sri Lankan banking or wallet app.', marks: ['LankaQR'] },
    bank: { label: 'Private Bank Transfer', text: 'From Commercial Bank, Sampath Bank, HNB or NTB, with a reference issued instantly.', marks: ['Commercial', 'Sampath', 'HNB', 'NTB'] }
  };
  var co = { step: 1, d: {} };
  /* Sri Lanka's 25 districts. Colombo 01 to 15 receive Priority Colombo Delivery; everywhere else, the insured islandwide courier. */
  var DISTRICTS = ['Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya', 'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee', 'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla', 'Monaragala', 'Ratnapura', 'Kegalle'];
  var COLOMBO_AREAS = ['Colombo 01 · Fort', 'Colombo 02 · Slave Island', 'Colombo 03 · Kollupitiya', 'Colombo 04 · Bambalapitiya', 'Colombo 05 · Havelock Town', 'Colombo 06 · Wellawatte', 'Colombo 07 · Cinnamon Gardens', 'Colombo 08 · Borella', 'Colombo 09 · Dematagoda', 'Colombo 10 · Maradana', 'Colombo 11 · Pettah', 'Colombo 12 · Hulftsdorp', 'Colombo 13 · Kotahena', 'Colombo 14 · Grandpass', 'Colombo 15 · Mattakkuliya'];
  var ELSEWHERE = 'Elsewhere in Colombo District';
  function inColombo(d) { return d.district === 'Colombo' && COLOMBO_AREAS.indexOf(d.area) > -1; }
  /* Sri Lankan postal codes 00100 to 01500 are Colombo 01 to 15 */
  function areaFromPost(v) { var m = /^0(0[1-9]|1[0-5])00$/.exec(String(v || '').replace(/\s/g, '')); return m ? COLOMBO_AREAS[Number(m[1]) - 1] : null; }
  var STEP_NAMES = ['Contact & Delivery', 'Fulfillment & Gifting', 'Payment'];
  var NOTE_MAX = 160;
  var ICON = {
    back: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M20 12H5m6-6-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.1"/></svg>',
    check: '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>',
    lock: '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><rect x="3" y="7" width="10" height="7" fill="none" stroke="currentColor" stroke-width="1"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="currentColor" stroke-width="1"/></svg>'
  };
  var WORDMARK = '<svg class="wordmark" viewBox="120 30 796 120" aria-hidden="true"><use href="#wm-paths"/></svg>';
  var SEAL = '<svg viewBox="0 0 1000 860" aria-hidden="true"><use href="#spiral-seal"/></svg>';

  function selectField(id, name, label, list, val, attrs, hint) {
    return '<div class="field"><label for="' + id + '">' + label + '</label><select id="' + id + '" name="' + name + '" ' + (attrs || '') + ' aria-describedby="' + (hint ? id + '-h ' : '') + id + '-e"><option value="">Choose</option>' +
      list.map(function (x) { return '<option' + (x === val ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select>' +
      (hint ? '<span class="field__hint" id="' + id + '-h">' + hint + '</span>' : '') + '<span class="field__error" id="' + id + '-e" role="alert"></span></div>';
  }
  function req(label) { return label + ' <span class="req" aria-hidden="true">*</span>'; }
  function opt(label) { return label + ' <span class="opt">(optional)</span>'; }
  function coField(id, name, label, attrs, val, hint) {
    return '<div class="field"><label for="' + id + '">' + label + '</label><input id="' + id + '" name="' + name + '" ' + attrs + ' value="' + esc(val || '') + '" aria-describedby="' + (hint ? id + '-h ' : '') + id + '-e">' +
      (hint ? '<span class="field__hint" id="' + id + '-h">' + hint + '</span>' : '') + '<span class="field__error" id="' + id + '-e" role="alert"></span></div>';
  }
  /* Phase 1: Sri Lankan fulfilment and payment only */
  function shipOptions() { return inColombo(co.d) ? ['colombo', 'island', 'atelier'] : ['island', 'atelier']; }
  function payOptions() { return ['payhere', 'lankaqr', 'bank']; }
  function giftState() { return C.state.gift || (C.state.gift = { on: false, note: '' }); }
  var SHIP_TEXT = {
    colombo: 'Encased in a discreet, reinforced outer shipping carton · Insured transit with signature confirmation',
    island: 'Double-boxed protective transit packaging · Full transit protection with signature confirmation',
    atelier: 'Collect in person from our Colombo atelier, by private appointment.'
  };

  /* ---------- the drawer ---------- */
  function bagHead() {
    return '<div class="panel-head"><h2 id="bagTitle">Private Bag <small class="bag-qty">' + C.bagCount() + '</small></h2>' +
      '<button class="icon-btn" type="button" data-close aria-label="Close bag">' + X + '</button></div>';
  }
  function renderBag() {
    var panel = $('#bagPanel'), bag = C.state.bag;
    if (!bag.length) {
      panel.innerHTML = bagHead() + '<div class="bag-empty"><h3>Your Private Bag is empty</h3><p>Choose a piece from Edition 01, or ask a Maison Stylist to help you find one.</p><button class="btn btn--gold" type="button" data-browse>Explore the Collection</button><button class="link-btn" type="button" data-stylist>Speak with a Maison Stylist</button></div>';
      return;
    }
    var g = giftState();
    var lines = bag.map(function (l) {
      var p = C.product(l.id), a = C.available(p);
      return '<div class="bag-line" data-key="' + esc(l.key) + '"><div class="bag-line__thumb">' + C.plateHTML(p, 'form', 'thumb') + '</div>' +
        '<div><p class="bag-line__name">' + esc(p.short) + '</p><p class="bag-line__meta">Size ' + esc(l.size) + '</p></div>' +
        '<p class="bag-line__price">' + P(p.price * l.qty) + '</p>' +
        '<div class="bag-line__ctl"><div class="qty" role="group" aria-label="Quantity for ' + esc(p.short) + '"><button type="button" data-dec aria-label="Decrease quantity">−</button><output aria-live="polite">' + l.qty + '</output><button type="button" data-inc aria-label="Increase quantity"' + (a <= 0 ? ' disabled' : '') + '>+</button></div>' +
        '<button class="link-btn" type="button" data-remove>Remove</button></div></div>';
    }).join('');
    panel.innerHTML = bagHead() + '<div class="bag-lines">' + lines + '</div>' +
      '<div class="bag-foot">' +
        '<label class="gift"><input type="checkbox" data-gift' + (g.on ? ' checked' : '') + '><span><b>Prepare as a gift</b><span>Hand-wrapped, with a complimentary calligraphy card inside the lacquered box.</span></span></label>' +
        '<div class="field gift-note"' + (g.on ? '' : ' hidden') + '><label for="giftNote">' + opt('Your note') + '</label><textarea id="giftNote" data-gift-note maxlength="' + NOTE_MAX + '" rows="2" placeholder="Written by hand on the card">' + esc(g.note) + '</textarea></div>' +
        '<div class="totals"><span>Subtotal</span><output>' + P(C.bagTotalLKR()) + '</output></div>' +
        '<p class="fine-print">Complimentary insured delivery across Sri Lanka. ' + C.deliveryWhen('colombo') + ' in Colombo.' + C.dref(5) + '</p>' +
        '<button class="btn btn--gold btn--block" type="button" data-checkout>Proceed to Acquisition</button>' +
        '<button class="link-btn" type="button" data-browse style="justify-self:center">Continue browsing</button></div>';
  }

  /* ---------- the acquisition page ---------- */
  function cxHead(label, note) {
    return '<header class="cx-head"><div class="cx-head__bar">' +
      '<a class="cx-head__back" href="/" data-cx-back>' + ICON.back + '<span>' + label + '</span></a>' +
      '<a class="cx-head__mark" href="/" data-cx-home aria-label="House of MANTHAI, home">' + WORDMARK + '</a>' +
      '<p class="cx-head__note">' + (note || 'Complimentary Insured Delivery <span aria-hidden="true">·</span> Sri Lanka') + '</p></div></header>';
  }
  function stepsHTML(step) {
    return '<ol class="cx-steps" aria-label="Acquisition progress">' + STEP_NAMES.map(function (n, i) {
      var k = i + 1, st = k < step ? 'is-done' : k === step ? 'is-on' : '';
      return '<li class="' + st + '"' + (k === step ? ' aria-current="step"' : '') + '><span class="cx-steps__n">' + k + '.</span> ' + esc(n) + (k < step ? '<span class="sr-only"> (completed)</span>' : '') + '</li>';
    }).join('') + '</ol>';
  }
  function zoneHTML(probe) {
    if (inColombo(probe)) return '<b>Priority Colombo Delivery unlocked.</b> ' + esc(probe.area.split(' · ')[0]) + ' receives complimentary priority delivery, arriving ' + esc(C.fmtDay(C.addBusinessDays(C.DELIVERY.colombo.days))) + '.';
    if (probe.district && probe.district !== 'Colombo') return 'Insured islandwide courier to ' + esc(probe.district) + ', arriving by ' + esc(C.fmtDay(C.addBusinessDays(C.DELIVERY.island.days))) + '.';
    return 'Colombo 01 to 15 receive Complimentary Priority Colombo Delivery. A Colombo postal code, such as 00700, is recognised instantly.';
  }
  function stepShell(n, body, sum) {
    var title = esc(STEP_NAMES[n - 1]), st = co.step === n ? 'is-open' : co.step > n ? 'is-done' : 'is-next';
    return '<section class="cx-step ' + st + '" id="cxs' + n + '" aria-labelledby="cxh' + n + '"><header class="cx-step__head"><h2 id="cxh' + n + '"><span class="cx-step__n" aria-hidden="true">' + (co.step > n ? ICON.check : n) + '</span>' + title + '</h2>' +
      (co.step > n ? '<button class="cx-edit" type="button" data-edit="' + n + '">Edit<span class="sr-only"> ' + title + '</span></button>' : '') + '</header>' +
      (co.step === n ? body() : co.step > n ? '<div class="cx-step__sum">' + sum() + '</div>' : '') + '</section>';
  }
  /* ---------- a signed-in client never retypes what the Private Circle already knows ---------- */
  function savedList() {
    if (!C.state.member) return [];
    return (C.state.addressBook || []).filter(function (a) { return a && a.addr && a.city && a.district; });
  }
  function savedText(a) { return [a.addr, a.addr2, a.city, a.post, a.district + ' District'].filter(Boolean).join(', '); }
  function applySaved(d, a) {
    d.addr = a.addr; d.addr2 = a.addr2 || ''; d.city = a.city; d.post = a.post || ''; d.district = a.district;
    d.area = a.district === 'Colombo' ? (a.area || areaFromPost(a.post) || '') : '';
  }
  function savedAddrHTML(d) {
    var list = savedList(); if (!list.length) return '';
    return '<fieldset class="cx-fs cx-saved"><legend class="cx-fs__legend">' + req('Deliver to') + '</legend><div class="cx-saved__list">' +
      list.map(function (a) {
        return '<label class="cx-addrcard"><input type="radio" name="addrPick" value="' + esc(a.id) + '"' + (d.addrPick === a.id ? ' checked' : '') + '><span class="cx-radio" aria-hidden="true"></span>' +
          '<span class="cx-addrcard__body"><b>' + esc(d.name || (C.state.member && C.state.member.name) || '') + (a.isDefault ? ' <span class="acct-pill is-default">Default</span>' : '') + '</b><span>' + esc(savedText(a)) + '</span></span></label>';
      }).join('') +
      '<label class="cx-addrcard cx-addrcard--new"><input type="radio" name="addrPick" value="new"' + (d.addrPick === 'new' ? ' checked' : '') + '><span class="cx-radio" aria-hidden="true"></span><span class="cx-addrcard__body"><b>Deliver to a new address</b><span>Add a Sri Lankan address for this acquisition.</span></span></label>' +
      '</div></fieldset>';
  }
  function prefill(d) {
    var m = C.state.member; if (!m) return;
    var pr = C.state.profile || {}, last = (C.state.orders || []).filter(function (o) { return o.email && String(o.email).toLowerCase() === String(m.email).toLowerCase(); })[0] || {};
    if (!d.email) d.email = m.email;
    if (!d.name) d.name = m.name;
    if (!d.phoneLocal) { var ph = String(pr.phone || last.phone || '').replace(/\D/g, '').replace(/^(94|0)/, ''); if (/^7\d{8}$/.test(ph)) d.phoneLocal = ph; }
    var list = savedList();
    if (!d.addrPick) {
      var def = list.filter(function (a) { return a.isDefault; })[0] || list[0];
      if (def) { d.addrPick = def.id; applySaved(d, def); } else d.addrPick = 'new';
    }
    /* a Colombo address without a recognisable area opens the form, so the client can name the area once */
    if (d.addrPick !== 'new' && d.district === 'Colombo' && !d.area) d.addrPick = 'new';
  }
  function step1() {
    var d = co.d;
    return '<form class="cx-form" id="coStep1" novalidate><p class="cx-legend">Fields marked <span class="req" aria-hidden="true">*</span> are required.</p>' +
      coField('co-email', 'email', req('Email Address'), 'type="email" autocomplete="email" inputmode="email" required', d.email, 'Your Digital Acquisition Record is sent here.') +
      '<div class="field field--phone"><label for="co-phone">' + req('Mobile Number (+94)') + '</label><div class="phone-wrap"><span class="phone-cc" aria-hidden="true">+94</span><input id="co-phone" name="phone" type="tel" autocomplete="tel-national" inputmode="numeric" placeholder="77 123 4567" maxlength="13" required value="' + esc(d.phoneLocal || '') + '" aria-describedby="co-phone-h co-phone-e"></div><span class="field__hint" id="co-phone-h">Used exclusively by our Colombo courier to coordinate your delivery window and signature on receipt.</span><span class="field__error" id="co-phone-e" role="alert"></span></div>' +
      coField('co-name', 'name', req('Full Name'), 'autocomplete="name" required', d.name) +
      savedAddrHTML(d) +
      '<div class="cx-newaddr" id="cxNewAddr"' + (savedList().length && d.addrPick !== 'new' ? ' hidden' : '') + '>' +
      coField('co-addr', 'addr', req('Street Address'), 'autocomplete="address-line1" required', d.addr) +
      '<button class="cx-more" type="button" data-addr2 aria-expanded="false" aria-controls="cxAddr2"' + (d.addr2 ? ' hidden' : '') + '>+ Add apartment, suite, or landmark <span class="opt">(optional)</span></button>' +
      '<div class="cx-addr2" id="cxAddr2"' + (d.addr2 ? '' : ' hidden') + '>' + coField('co-addr2', 'addr2', opt('Apartment, Suite or Landmark'), 'autocomplete="address-line2"', d.addr2) + '</div>' +
      '<div class="row-2">' + coField('co-city', 'city', req('City or Town'), 'autocomplete="address-level2" required', d.city) +
        coField('co-post', 'post', opt('Postal Code'), 'autocomplete="postal-code" inputmode="numeric" maxlength="5" placeholder="00700"', d.post) + '</div>' +
      '<div class="row-2">' + selectField('co-district', 'district', req('District'), DISTRICTS, d.district, 'autocomplete="address-level1" required') +
        '<div class="field co-area"' + (d.district === 'Colombo' ? '' : ' hidden') + '><label for="co-area">' + req('Colombo Area') + '</label><select id="co-area" name="area" aria-describedby="co-area-e"><option value="">Choose</option>' +
          COLOMBO_AREAS.concat([ELSEWHERE]).map(function (x) { return '<option' + (x === d.area ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') +
          '</select><span class="field__error" id="co-area-e" role="alert"></span></div></div>' +
      '<div class="field"><span class="field__label-static">Country</span><p class="field__static">Sri Lanka</p><input type="hidden" name="country" value="Sri Lanka"></div>' +
      (C.state.member ? '<label class="cx-toggle cx-saveaddr"><input type="checkbox" name="saveAddr"' + (d.saveAddr !== false ? ' checked' : '') + '><span class="cx-toggle__ui" aria-hidden="true"></span><span>Save this address to my Private Circle</span></label>' : '') +
      '</div>' +
      '<p class="cx-zone' + (inColombo(d) ? ' is-on' : '') + '" id="cxZone" aria-live="polite">' + zoneHTML(d) + '</p>' +
      '<button class="btn btn--solid btn--block cx-next" type="submit"><span class="btn__label">Continue to Fulfillment</span></button></form>';
  }
  function step1Sum() { var d = co.d; return '<p>' + esc(d.name) + '<br>' + esc(d.email) + ' · ' + esc(d.phone) + '</p><p>' + esc(addressOf(d)) + '</p>'; }
  function step2() {
    var d = co.d, len = (d.giftNote || '').length;
    return '<form class="cx-form" id="coStep2" novalidate><fieldset class="cx-fs"><legend class="cx-fs__legend">Delivery Method</legend><div class="choices cx-ship">' + shipOptions().map(function (k) {
        var o = C.DELIVERY[k];
        return '<label class="choice cx-choice"><input type="radio" name="ship" value="' + k + '"' + (d.ship === k ? ' checked' : '') + '><span><b>' + esc(o.label) + '</b><span class="when">' + esc(C.deliveryWhen(k)) + C.dref(5) + '</span><span>' + SHIP_TEXT[k] + '</span></span><span class="cx-choice__price">Complimentary</span></label>';
      }).join('') + '</div>' +
      (inColombo(d) ? '' : '<p class="cx-note">' + esc(d.district || 'Your district') + ' is served by Complimentary Insured Courier Delivery. Colombo 01 to 15 receive Priority Colombo Delivery.</p>') + '</fieldset>' +
      '<fieldset class="cx-fs"><legend class="cx-fs__legend">Gifting</legend>' +
      '<label class="gift"><input type="checkbox" name="gift"' + (d.gift ? ' checked' : '') + '><span><b>Prepare as a Gift</b><span>Hand-wrapped, with your message written in calligraphy on a cotton card.</span></span></label>' +
      '<div class="cx-giftpanel" id="cxGift"' + (d.gift ? '' : ' hidden') + '>' +
        '<div class="field"><label for="co-note">' + opt('Gift Message') + '</label><textarea id="co-note" name="giftNote" maxlength="' + NOTE_MAX + '" rows="3" aria-describedby="co-note-c" placeholder="Written by hand on the card">' + esc(d.giftNote || '') + '</textarea><span class="cx-count" id="co-note-c" aria-live="polite">' + len + ' / ' + NOTE_MAX + '</span></div>' +
        '<label class="cx-toggle"><input type="checkbox" name="omit"' + (d.omit !== false ? ' checked' : '') + '><span class="cx-toggle__ui" aria-hidden="true"></span><span>Omit prices on the enclosed acquisition record</span></label>' +
      '</div></fieldset>' +
      '<div class="field"><label for="co-instr">' + opt('Delivery Instructions') + '</label><input id="co-instr" name="instr" autocomplete="off" maxlength="160" placeholder="A gate code, or a preferred time" value="' + esc(d.instr || '') + '"></div>' +
      '<button class="btn btn--solid btn--block cx-next" type="submit"><span class="btn__label">Continue to Payment</span></button></form>';
  }
  function step2Sum() {
    var d = co.d;
    return '<p>' + esc(C.DELIVERY[d.ship].label) + '<br><span class="when">' + esc(C.deliveryWhen(d.ship)) + '</span></p>' +
      (d.gift ? '<p>Prepared as a gift' + (d.giftNote ? ': “' + esc(d.giftNote) + '”' : '') + (d.omit !== false ? '<br><span class="when">Prices omitted from the enclosed record</span>' : '') + '</p>' : '');
  }
  function step3() {
    var d = co.d;
    return '<form class="cx-form" id="coStep3" novalidate><fieldset class="cx-fs"><legend class="cx-fs__legend">Payment Method</legend><div class="cx-pay">' + payOptions().map(function (k) {
        var o = PAY[k];
        return '<label class="cx-paycard"><input type="radio" name="pay" value="' + k + '"' + (d.pay === k ? ' checked' : '') + '><span class="cx-radio" aria-hidden="true"></span><span class="cx-paycard__body"><b>' + esc(o.label) + '</b><span>' + esc(o.text) + '</span></span><span class="cx-marks" aria-hidden="true">' + o.marks.map(function (x) { return '<i>' + esc(x) + '</i>'; }).join('') + '</span></label>';
      }).join('') + '</div></fieldset>' +
      '<fieldset class="cx-fs cx-bill"><legend class="cx-fs__legend">Billing Details</legend>' +
        '<label class="cx-toggle"><input type="checkbox" name="billSame"' + (d.billSame !== false ? ' checked' : '') + '><span class="cx-toggle__ui" aria-hidden="true"></span><span>Bill to the same name and delivery address</span></label>' +
        '<div class="cx-billform" id="cxBill"' + (d.billSame !== false ? ' hidden' : '') + '>' +
          coField('co-bname', 'bname', req('Name on the Bill'), 'autocomplete="billing name"', (d.bill && d.bill.name) || '') +
          coField('co-baddr', 'baddr', req('Billing Street Address'), 'autocomplete="billing address-line1"', (d.bill && d.bill.addr) || '') +
          '<div class="row-2">' + coField('co-bcity', 'bcity', req('City or Town'), 'autocomplete="billing address-level2"', (d.bill && d.bill.city) || '') +
            coField('co-bpost', 'bpost', opt('Postal Code'), 'autocomplete="billing postal-code" inputmode="numeric" maxlength="5"', (d.bill && d.bill.post) || '') + '</div>' +
          selectField('co-bdistrict', 'bdistrict', req('District'), DISTRICTS, (d.bill && d.bill.district) || '', 'autocomplete="billing address-level1"') +
        '</div></fieldset>' +
      '<p class="cx-ssl">' + ICON.lock + '<span>256-bit SSL encryption. Card payments are processed by PayHere, a licensed Sri Lankan gateway; MANTHAI never sees or stores your card number.</span></p>' +
      '<button class="btn btn--solid btn--block btn--sheen cx-submit" type="submit"><span class="btn__label">Complete Acquisition · ' + P(C.bagTotalLKR()) + '</span></button>' +
      '<p class="cx-consent">By completing your acquisition you agree to our <a href="/legal/terms" data-legal="terms">Terms &amp; Conditions of Sale</a>, <a href="/legal/shipping-exchanges" data-legal="shipping-exchanges">Shipping &amp; Exchange Policy</a> and <a href="/legal/privacy" data-legal="privacy">Privacy Policy</a>.</p>' +
      '<p class="cx-demo">Demonstration storefront: no payment is taken and no email is sent.</p></form>';
  }
  function summaryHTML() {
    var d = co.d, bag = C.state.bag, n = C.bagCount(), total = P(C.bagTotalLKR());
    return '<section class="cx-sum" aria-labelledby="cxSumTitle">' +
      '<button class="cx-sum__toggle" type="button" aria-expanded="false" aria-controls="cxSumBody" data-sum-toggle><span>Order Summary <small>' + n + (n === 1 ? ' piece' : ' pieces') + '</small></span><output>' + total + '</output></button>' +
      '<div class="cx-sum__body" id="cxSumBody"><h2 class="cx-sum__title" id="cxSumTitle">Your Acquisition</h2>' +
      '<ul class="cx-lines">' + bag.map(function (l) {
        var p = C.product(l.id);
        return '<li class="cx-line"><div class="cx-line__thumb">' + C.plateHTML(p, 'form', 'thumb') + '</div><div class="cx-line__info"><p class="cx-line__name">' + esc(p.short) + '</p><p class="cx-line__meta">Size ' + esc(l.size) + ' <span aria-hidden="true">·</span> Qty ' + l.qty + '</p></div><p class="cx-line__price">' + P(p.price * l.qty) + '</p></li>';
      }).join('') + '</ul>' +
      '<dl class="cx-rows"><div><dt>Subtotal</dt><dd>' + total + '</dd></div><div><dt>Delivery</dt><dd>Complimentary</dd></div>' +
        '<div><dt>Gift Presentation</dt><dd>' + (d.gift ? 'Prepared as a gift' : 'Not selected') + '</dd></div>' +
        '<div class="cx-rows__total"><dt>Total</dt><dd>' + total + '</dd></div></dl>' +
      '<p class="cx-sum__note"><span class="cx-sum__seal">' + SEAL + '</span><span>Every piece arrives sealed in our lacquered gatefold box, with its own numbered Verification Card. For couriered orders across Sri Lanka, your signature midnight-navy lacquered presentation box arrives safeguarded inside an unbranded, reinforced protective outer shipping carton.</span></p></div></section>';
  }
  function renderCheckoutPage() {
    var root = $('#cxPanel'); if (!root) return;
    var m = C.state.member, d = co.d, g = giftState();
    prefill(d);
    d.country = M.MARKET.countryName;
    if (shipOptions().indexOf(d.ship) < 0) d.ship = shipOptions()[0];
    if (payOptions().indexOf(d.pay) < 0) d.pay = payOptions()[0];
    if (d.gift === undefined) { d.gift = g.on; d.giftNote = (g.note || '').slice(0, NOTE_MAX); }
    var wasOpen = $('.cx-sum.is-open', root);
    root.innerHTML = cxHead('<span class="cx-long">Return to </span>Bag') + '<div class="cx-wrap"><div class="cx-main">' +
      '<h1 class="cx-title" id="cxTitle">Secure Acquisition</h1>' + stepsHTML(co.step) +
      (m ? '<p class="cx-guest">Signed in to the Private Circle as <b>' + esc(m.email) + '</b>.</p>'
         : '<p class="cx-guest">You are acquiring as a guest. No account or password is needed; you may activate your Private Circle in one click once your acquisition is confirmed.</p>') +
      stepShell(1, step1, step1Sum) + stepShell(2, step2, step2Sum) + stepShell(3, step3, function () { return ''; }) +
      '</div>' + summaryHTML() + '</div>';
    if (wasOpen) { var s = $('.cx-sum', root); s.classList.add('is-open'); $('[data-sum-toggle]', s).setAttribute('aria-expanded', 'true'); }
  }
  function focusOpenStep(scroll) {
    var open = $('#cxPanel .cx-step.is-open'); if (!open) return;
    if (scroll) {
      var y = open.getBoundingClientRect().top + window.scrollY - 24;
      if (C.lenis) C.lenis.scrollTo(y, { immediate: C.reduced() }); else window.scrollTo({ top: y, behavior: C.reduced() ? 'auto' : 'smooth' });
    }
    var fi = $('input:not([type=hidden]), select', open); if (fi) fi.focus({ preventScroll: true });
  }

  /* ---------- the Digital Acquisition Record ---------- */
  function renderConfirmed(o) {
    var root = $('#cxDone'); if (!root || !o) return;
    var first = (o.name || '').split(' ')[0] || 'you', m = C.state.member, del = C.DELIVERY[o.ship] || C.DELIVERY.island;
    var payNote = o.method === 'bank' ? '<p class="rec__notice"><b>Private bank transfer.</b> Transfer from Commercial Bank, Sampath Bank, HNB or NTB using the reference <b>' + esc(o.ref) + '</b>. The Maison account details are sent to ' + esc(o.email) + ', and your piece is prepared as soon as the transfer arrives.</p>'
      : o.method === 'lankaqr' ? '<p class="rec__notice"><b>LankaQR.</b> In the live store, a LankaQR code appears here to scan with your banking app.</p>'
      : '<p class="rec__notice"><b>PayHere secure card.</b> In the live store, you complete payment on PayHere’s secure page and return to this record.</p>';
    var placed = new Date(o.date), arrive = new Date(o.arrive), dispatched = C.addBusinessDays(1, placed);
    var timeline = [
      ['Acquisition confirmed', C.fmtDay(placed)],
      ['Atelier inspection and pressing', C.fmtDay(placed)],
      [o.ship === 'atelier' ? 'Sealed and ready at the atelier' : 'Sealed in the lacquered box and dispatched', C.fmtDay(dispatched)],
      [o.ship === 'atelier' ? 'Private collection, 2:00 PM IST' : 'Delivered to your door', C.fmtDay(arrive)]
    ];
    var meta = [['Order Reference', '<span class="order-ref">' + esc(o.ref) + '</span>'], ['Acquired', esc(C.fmtDay(placed))],
      ['Delivery', esc(del.label) + '<br><span class="rec__when">' + esc(o.when) + '</span>'], ['Client', esc(o.name)],
      [o.ship === 'atelier' ? 'Collection' : 'Deliver to', esc(o.ship === 'atelier' ? 'The Colombo atelier, by private appointment' : o.address)], ['Payment', esc((PAY[o.method] || PAY.payhere).label)]];
    if (o.billing) meta.push(['Bill to', esc(o.billing.name) + '<br>' + esc(o.billing.address)]);
    root.innerHTML = cxHead('<span class="cx-long">Continue to the </span>Maison', 'Acquisition Confirmed') +
      '<div class="rec-wrap"><article class="rec" aria-labelledby="recTitle">' + C.issuerHTML() +
        '<header class="rec__head"><span class="rec__seal">' + SEAL + '</span><p class="rec__kicker">Digital Acquisition Record</p>' +
          '<h1 class="rec__title" id="recTitle" tabindex="-1">Thank you, ' + esc(first) + '.</h1>' +
          '<p class="rec__lede">Your acquisition is confirmed. Our Colombo atelier now inspects, presses and seals your ' + (o.items.length > 1 ? 'pieces' : 'piece') + ' by hand.</p></header>' +
        '<dl class="rec__meta">' + meta.map(function (x) { return '<div><dt>' + x[0] + '</dt><dd>' + x[1] + '</dd></div>'; }).join('') + '</dl>' +
        '<h2 class="rec__h">Pieces &amp; Verification Cards</h2>' +
        '<ul class="rec__pieces">' + o.items.map(function (it) {
          var p = C.product(it.id);
          return '<li><div class="rec__thumb">' + (p ? C.plateHTML(p, 'form', 'thumb') : C.archivePlate()) + '</div><div class="rec__piece"><p>' + esc(it.name) + '</p><small>Size ' + esc(it.size) + ' <span aria-hidden="true">·</span> ' + P(it.price) + '</small></div>' +
            '<button class="rec__vcard" type="button" data-passport-open="' + esc(it.passport) + '" aria-label="View Verification Card ' + esc(it.passport) + '"><span class="rec__vcard-seal">' + SEAL + '</span><span class="rec__vcard-k">Verification Card</span><span class="rec__vcard-id">' + esc(it.passport) + '</span><span class="rec__vcard-cta">View record</span></button></li>';
        }).join('') + '</ul>' +
        '<dl class="cx-rows rec__totals"><div><dt>Subtotal</dt><dd>' + P(o.totalLKR) + '</dd></div><div><dt>Delivery</dt><dd>Complimentary</dd></div>' + (o.gift ? '<div><dt>Gift Presentation</dt><dd>Complimentary</dd></div>' : '') + '<div class="cx-rows__total"><dt>Total</dt><dd>' + P(o.totalLKR) + '</dd></div></dl>' +
        '<h2 class="rec__h">Dispatch</h2>' +
        '<ol class="record__timeline" aria-label="Dispatch timeline">' + timeline.map(function (t, i) { return '<li' + (i === 0 ? ' class="is-done"' : '') + '><span>' + esc(t[0]) + '</span><time>' + esc(t[1]) + '</time></li>'; }).join('') + '</ol>' +
        payNote +
        (o.gift ? '<p class="rec__fine">Prepared as a gift' + (o.omit !== false ? ', with prices omitted from the record enclosed in the box' : '') + '.' + (o.giftNote ? '<br>Your message, in calligraphy: “' + esc(o.giftNote) + '”' : '') + '</p>' : '') +
        '<div class="rec__actions"><button class="btn btn--ghost" type="button" data-print>Print Receipt</button><a class="btn btn--solid" href="/" data-cx-home><span class="btn__label">Continue to the Maison</span></a></div>' +
        (m ? '<p class="rec__fine">Saved to your Private Circle as ' + esc(m.email) + '.</p>'
           : '<div class="rec__circle"><p class="rec__kicker">Private Circle</p><h2>Keep this record with you.</h2><p>Your Verification Cards, delivery address and this record, kept together under ' + esc(o.email) + '. One click, no password.</p>' +
             '<div class="rec__circle-cta"><button class="btn btn--solid" type="button" data-circle-link><span class="btn__label">Send My Activation Link</span></button><button class="google-btn" type="button" data-google>Continue with Google</button></div></div>') +
        '<p class="rec__fine rec__demo">Demonstration storefront: no payment was taken and no email was sent.</p>' +
      '</article></div>';
  }

  shop.openBag = function () { renderBag(); C.open($('#layerBag')); };
  /* add a piece from outside the piece page (Saved Silhouettes) */
  shop.addPiece = function (id, size) {
    var p = C.product(id); if (!p || C.available(p) <= 0) return false;
    var key = C.lineKey(p.id, size), line = C.state.bag.filter(function (l) { return l.key === key; })[0];
    if (line) line.qty += 1; else C.state.bag.push({ key: key, id: p.id, size: size, qty: 1 });
    C.save(); C.updateBagUI(); C.emit('bag'); return true;
  };
  /* the router asks for these; false sends the visitor home */
  shop.renderCheckoutPage = function () { if (!C.state.bag.length) return false; renderCheckoutPage(); return true; };
  shop.renderConfirmed = function () { var o = lastOrder || C.state.orders[0]; if (!o) return false; lastOrder = o; renderConfirmed(o); return true; };

  var bagPanel = $('#bagPanel');
  function bagChanged() { C.save(); C.updateBagUI(); renderBag(); C.emit('bag'); }
  bagPanel.addEventListener('click', function (e) {
    var line = e.target.closest('.bag-line'), key = line && line.getAttribute('data-key');
    var l = key && C.state.bag.filter(function (x) { return x.key === key; })[0];
    if (e.target.closest('[data-inc]') && l) { if (C.available(C.product(l.id)) > 0) { l.qty += 1; bagChanged(); } return; }
    if (e.target.closest('[data-dec]') && l) { l.qty -= 1; if (l.qty <= 0) C.state.bag = C.state.bag.filter(function (x) { return x !== l; }); bagChanged(); return; }
    if (e.target.closest('[data-remove]') && l) { C.state.bag = C.state.bag.filter(function (x) { return x !== l; }); bagChanged(); C.toast('Removed from your Private Bag.'); return; }
    if (e.target.closest('[data-checkout]')) {
      co = { step: 1, d: {} };
      cxFrom = { name: M.ui.curRoute(), slug: M.ui.curSlug ? M.ui.curSlug() : null };
      var bag = $('#layerBag'); bag._opener = null; C.close(bag);
      M.ui.route('checkout');
      setTimeout(function () { var h = $('#cxTitle'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } }, C.reduced() ? 20 : 640);
      return;
    }
    if (e.target.closest('[data-browse]')) { C.close($('#layerBag')); setTimeout(function () { C.scrollTo('collection'); }, 600); return; }
    if (e.target.closest('[data-stylist]')) { M.ui.openStylist(); return; }
  });
  bagPanel.addEventListener('change', function (e) {
    var t = e.target;
    if (t.matches('[data-gift]')) { giftState().on = t.checked; C.save(); var gn = $('.gift-note', bagPanel); if (gn) gn.hidden = !t.checked; }
  });
  bagPanel.addEventListener('input', function (e) { if (e.target.matches('[data-gift-note]')) { giftState().note = e.target.value; C.save(); } });

  /* ---------- checkout page handlers ---------- */
  var cxPage = $('#checkoutPage'), cxDonePage = $('#confirmPage');
  function leaveTo(name, slug) { M.ui.route(name || 'home', null, true, slug); }
  function syncZone(f) {
    var isCol = f.elements.district.value === 'Colombo', area = $('.co-area', f);
    if (area) area.hidden = !isCol;
    var probe = { district: f.elements.district.value, area: isCol ? f.elements.area.value : '' }, z = $('#cxZone');
    if (z) { z.innerHTML = zoneHTML(probe); z.classList.toggle('is-on', inColombo(probe)); }
  }
  cxPage.addEventListener('click', function (e) {
    var t;
    if (e.target.closest('[data-cx-back]')) {
      e.preventDefault(); var f = cxFrom || { name: 'home' };
      leaveTo(f.name === 'checkout' || f.name === 'confirmed' ? 'home' : f.name, f.slug);
      setTimeout(shop.openBag, C.reduced() ? 40 : 520); return;
    }
    if (e.target.closest('[data-cx-home]')) { e.preventDefault(); leaveTo('home'); return; }
    if ((t = e.target.closest('[data-edit]'))) { co.step = Number(t.getAttribute('data-edit')); renderCheckoutPage(); focusOpenStep(true); return; }
    if ((t = e.target.closest('[data-addr2]'))) { t.hidden = true; var w = $('#cxAddr2'); w.hidden = false; $('input', w).focus(); return; }
    if ((t = e.target.closest('[data-sum-toggle]'))) { var s = t.closest('.cx-sum'), on = !s.classList.contains('is-open'); s.classList.toggle('is-open', on); t.setAttribute('aria-expanded', on ? 'true' : 'false'); }
  });
  cxPage.addEventListener('change', function (e) {
    var t = e.target, f = t.form; if (!f) return;
    if (f.id === 'coStep1' && (t.name === 'district' || t.name === 'area')) { syncZone(f); if (t.value) C.setError(t, ''); }
    if (f.id === 'coStep1' && t.name === 'addrPick') {
      var box = $('#cxNewAddr'), d = co.d;
      if (t.value === 'new') {
        d.addrPick = 'new'; box.hidden = false;
        ['addr', 'addr2', 'city', 'post'].forEach(function (k) { f.elements[k].value = ''; C.setError(f.elements[k], ''); });
        f.elements.district.value = ''; f.elements.area.value = ''; syncZone(f); f.elements.addr.focus();
      } else {
        var a = savedList().filter(function (x) { return x.id === t.value; })[0]; if (!a) return;
        d.addrPick = a.id; applySaved(d, a);
        ['addr', 'addr2', 'city', 'post', 'district'].forEach(function (k) { f.elements[k].value = d[k] || ''; C.setError(f.elements[k], ''); });
        f.elements.area.value = d.area || ''; syncZone(f);
        /* a Colombo address with no recognisable area asks for it once, in place */
        box.hidden = !(d.district === 'Colombo' && !d.area);
      }
    }
    if (f.id === 'coStep3' && t.name === 'billSame') { var b = $('#cxBill'); b.hidden = t.checked; co.d.billSame = t.checked; if (!t.checked) { var i = $('input', b); if (i) i.focus(); } }
    if (f.id === 'coStep2' && t.name === 'gift') { $('#cxGift').hidden = !t.checked; co.d.gift = t.checked; var row = $('.cx-rows div:nth-child(3) dd', cxPage); if (row) row.textContent = t.checked ? 'Prepared as a gift' : 'Not selected'; }
  });
  cxPage.addEventListener('input', function (e) {
    var t = e.target, f = t.form; if (!f) return;
    if (t.name === 'post') {
      var a = areaFromPost(t.value);
      if (a) { f.elements.district.value = 'Colombo'; f.elements.area.value = a; C.setError(f.elements.district, ''); C.setError(f.elements.area, ''); if (!f.elements.city.value.trim()) { f.elements.city.value = 'Colombo'; } C.setError(f.elements.city, ''); syncZone(f); }
    }
    if (t.name === 'giftNote') { var c = $('#co-note-c'); if (c) c.textContent = t.value.length + ' / ' + NOTE_MAX; }
  });
  cxPage.addEventListener('submit', function (e) {
    var f = e.target; if (!/^coStep[123]$/.test(f.id)) return;
    e.preventDefault();
    var bad = null, d = co.d;
    function need(name, ok, msg) { var i = f.elements[name]; if (!ok(i.value)) { C.setError(i, msg); bad = bad || i; } else C.setError(i, ''); }
    if (f.id === 'coStep1') {
      need('email', C.validEmail, 'Enter a valid email address, such as name@example.com.');
      need('phone', function (v) { return /^7\d{8}$/.test(v.replace(/\D/g, '').replace(/^(94|0)/, '')); }, 'Enter a Sri Lankan mobile number, such as 77 123 4567.');
      need('name', function (v) { return v.trim().length > 1; }, 'Enter your full name.');
      need('addr', function (v) { return v.trim().length > 4; }, 'Enter your street address.');
      need('city', function (v) { return v.trim().length > 1; }, 'Enter your city or town.');
      need('post', function (v) { return !v.trim() || /^\d{5}$/.test(v.trim()); }, 'A Sri Lankan postal code has five digits, such as 00700.');
      need('district', function (v) { return !!v; }, 'Choose your district.');
      if (f.elements.district.value === 'Colombo') need('area', function (v) { return !!v; }, 'Choose your Colombo area.');
      if (bad) { bad.focus(); return; }
      ['email', 'name', 'addr', 'addr2', 'city', 'post', 'country', 'district'].forEach(function (k) { d[k] = f.elements[k].value.trim(); });
      d.area = d.district === 'Colombo' ? f.elements.area.value : '';
      d.phoneLocal = f.elements.phone.value.replace(/\D/g, '').replace(/^(94|0)/, '');
      d.phone = '+94 ' + d.phoneLocal.replace(/^(\d{2})(\d{3})(\d{4})$/, '$1 $2 $3');
      d.addrPick = (f.querySelector('input[name=addrPick]:checked') || {}).value || 'new';
      d.saveAddr = f.elements.saveAddr ? f.elements.saveAddr.checked : false;
      rememberClient(d);
      d.ship = shipOptions()[0];
      co.step = 2;
    } else if (f.id === 'coStep2') {
      d.ship = (f.querySelector('input[name=ship]:checked') || {}).value || shipOptions()[0];
      d.gift = f.elements.gift.checked; d.giftNote = f.elements.giftNote.value.trim().slice(0, NOTE_MAX); d.omit = f.elements.omit.checked; d.instr = f.elements.instr.value.trim();
      var g = giftState(); g.on = d.gift; g.note = d.giftNote; C.save();
      co.step = 3;
    } else {
      d.billSame = f.elements.billSame.checked;
      if (!d.billSame) {
        need('bname', function (v) { return v.trim().length > 1; }, 'Enter the name for the bill.');
        need('baddr', function (v) { return v.trim().length > 4; }, 'Enter the billing street address.');
        need('bcity', function (v) { return v.trim().length > 1; }, 'Enter the city or town.');
        need('bpost', function (v) { return !v.trim() || /^\d{5}$/.test(v.trim()); }, 'A Sri Lankan postal code has five digits, such as 00700.');
        need('bdistrict', function (v) { return !!v; }, 'Choose the district.');
        if (bad) { bad.focus(); return; }
        d.bill = { name: f.elements.bname.value.trim(), addr: f.elements.baddr.value.trim(), city: f.elements.bcity.value.trim(), post: f.elements.bpost.value.trim(), district: f.elements.bdistrict.value };
      } else d.bill = null;
      d.pay = (f.querySelector('input[name=pay]:checked') || {}).value || payOptions()[0];
      placeOrder(); return;
    }
    renderCheckoutPage(); focusOpenStep(true);
  });
  cxDonePage.addEventListener('click', function (e) {
    var t;
    if (e.target.closest('[data-cx-back], [data-cx-home]')) { e.preventDefault(); leaveTo('home'); return; }
    if (e.target.closest('[data-print]')) { window.print(); return; }
    if ((t = e.target.closest('[data-passport-open]'))) { M.ui.openPassport(null, t.getAttribute('data-passport-open')); return; }
    if (e.target.closest('[data-google]')) { M.ui.googleSignIn(function () { C.toast('Your Private Circle profile is saved.'); if (lastOrder) renderConfirmed(lastOrder); }); return; }
    if (e.target.closest('[data-circle-link]') && lastOrder) { M.ui.sendCircleLink(lastOrder.email); }
  });

  /* what the client typed once is kept in their Private Circle (and, when signed in, their cloud record) */
  function rememberClient(d) {
    var m = C.state.member; if (!m) return;
    var pr = C.state.profile || (C.state.profile = {});
    if (!pr.phone) pr.phone = d.phoneLocal;
    if (d.addrPick === 'new' && d.saveAddr) {
      var bk = C.state.addressBook || (C.state.addressBook = []);
      var same = bk.filter(function (a) { return a.addr === d.addr && a.city === d.city && a.district === d.district && (a.post || '') === d.post; })[0];
      if (!same) {
        same = { id: 'A' + Date.now().toString(36), addr: d.addr, addr2: d.addr2, city: d.city, post: d.post, district: d.district, area: d.area, isDefault: !savedList().length };
        bk.push(same);
      }
      d.addrPick = same.id;
    }
    C.save();
  }
  function addressOf(d) { return [d.addr, d.addr2, d.area && d.area !== ELSEWHERE ? d.area.split(' · ')[0] : '', d.city, d.post, d.district && !(d.area && d.area !== ELSEWHERE) ? d.district + ' District' : '', d.country].filter(Boolean).join(', '); }
  function placeOrder() {
    var d = co.d, items = [];
    C.state.bag.forEach(function (l) { var p = C.product(l.id); for (var i = 0; i < l.qty; i++) items.push({ id: p.id, short: p.short, name: p.name, size: l.size, price: p.price, passport: C.uid('MNT') }); });
    var order = { ref: C.uid('ORD'), date: new Date().toISOString(), items: items, totalLKR: C.bagTotalLKR(), currency: C.state.currency, display: C.price(C.bagTotalLKR()),
      method: d.pay, country: d.country, email: d.email, name: d.name, phone: d.phone, ship: d.ship, when: C.deliveryWhen(d.ship), gift: d.gift, giftNote: d.giftNote, omit: d.omit, instr: d.instr,
      arrive: C.addBusinessDays((C.DELIVERY[d.ship] || C.DELIVERY.island).days).toISOString(),
      address: addressOf(d), district: d.district, area: d.area, step: 0,
      billing: d.bill ? { name: d.bill.name, address: [d.bill.addr, d.bill.city, d.bill.post, d.bill.district + ' District', 'Sri Lanka'].filter(Boolean).join(', ') } : null };
    C.state.orders.unshift(order);
    var addrs = C.state.addresses || (C.state.addresses = []);
    if (addrs.indexOf(order.address) < 0) addrs.unshift(order.address);
    C.state.bag = []; C.state.gift = { on: false, note: '' }; C.save(); C.updateBagUI(); C.emit('bag');
    lastOrder = order; co = { step: 1, d: {} };
    /* the record replaces the checkout in history, so Back never returns to an empty form */
    M.ui.route('confirmed', null, 'replace');
  }
  C.on('member', function () {
    var r = M.ui.curRoute && M.ui.curRoute();
    if (r === 'confirmed' && lastOrder) renderConfirmed(lastOrder);
    else if (r === 'checkout' && C.state.bag.length) renderCheckoutPage();
  });

  /* live updates when stock changes */
  C.on('bag', function () { syncAddButtons(); });

  /* ======================= wishlist ======================= */
  shop.toggleWish = function (id, quiet) {
    var w = C.state.wishlist || (C.state.wishlist = []), i = w.indexOf(id);
    if (i > -1) w.splice(i, 1); else w.unshift(id);
    C.save(); C.emit('wishlist');
    if (!quiet) C.toast(i > -1 ? 'Removed from your wishlist.' : (C.state.member ? 'Saved to your Private Circle wishlist.' : 'Saved to your wishlist on this device.'));
    return i < 0;
  };

  /* ======================= init ======================= */
  renderTabs(); renderGallery(); C.updateBagUI();
  $('#bagBtn').addEventListener('click', shop.openBag);
})();
