/* ==========================================================================
   MANTHAI  |  maison: navigation, layers, hero film, Salon, Stylist, Passport
   Loaded last. Defines M.ui, which shop.js calls into.
   ========================================================================== */
(function () {
  'use strict';
  var M = window.MANTHAI, C = M.core, $ = C.$, $$ = C.$$, esc = C.esc;
  var ui = (M.ui = {});
  var X = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="1.1"/></svg>';
  function noop() {}
  function later(fn) { setTimeout(fn, C.reduced() ? 40 : 620); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function head(id, title, closeLabel) {
    return '<div class="panel-head"><h2 id="' + id + '">' + title + '</h2><button class="icon-btn" type="button" data-close aria-label="' + closeLabel + '">' + X + '</button></div>';
  }
  function fld(id, label, control, hint) {
    return '<div class="field"><label for="' + id + '">' + label + '</label>' + control + (hint ? '<span class="field__hint">' + hint + '</span>' : '') + '<p class="field__error" role="alert"></p></div>';
  }
  function fmtDate(iso) { try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return ''; } }
  function firstName(n) { return String(n || '').trim().split(/\s+/)[0] || 'friend'; }
  function nameFromEmail(e) { var s = String(e).split('@')[0].replace(/[._-]+/g, ' ').trim(); return s ? s.replace(/\b\w/g, function (c) { return c.toUpperCase(); }) : 'Guest'; }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ('0000000' + (h >>> 0).toString(36).toUpperCase()).slice(-7); }
  function download(name, type, text) {
    var blob = new Blob([text], { type: type }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400);
  }

  /* ======================= action router ======================= */
  function run(action) {
    var i = action.indexOf(':'), k = i < 0 ? action : action.slice(0, i), v = i < 0 ? '' : action.slice(i + 1);
    if (k === 'filter') M.shop.setFilter(v, true);
    else if (k === 'product') M.shop.openProduct(v);
    else if (k === 'stylist') ui.openStylist();
    else if (k === 'fitting') ui.openStylist(null, M.FITTING);
    else if (k === 'salon') ui.openSalon();
    else if (k === 'film') ui.openFilm();
    else if (k === 'anchor') C.scrollTo(v);
    else if (k === 'cipher') { C.scrollTo('cipher'); setTimeout(function () { setCipher(true); }, C.reduced() ? 0 : 700); }
    else if (k === 'passport') ui.openPassport();
    else if (k === 'info') ui.openInfo(v);
    else if (k === 'search') ui.openSearch();
  }
  function go(action) {
    var delay = false;
    closePanel(true);
    ['#layerMenu', '#layerSearch'].forEach(function (s) { var d = $(s); if (d.open) { C.close(d); delay = true; } });
    if (delay) later(function () { run(action); }); else run(action);
  }
  ui.run = go;

  /* ======================= header: solid on scroll ======================= */
  var header = $('#siteHeader');
  (function () {
    var s = document.createElement('div');
    s.setAttribute('aria-hidden', 'true');
    s.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:64px;pointer-events:none;visibility:hidden';
    document.body.insertBefore(s, document.body.firstChild);
    function set(solid) { header.classList.toggle('is-solid', solid); }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { set(!en[0].isIntersecting); }).observe(s);
    else window.addEventListener('scroll', function () { set(window.scrollY > 64); }, { passive: true });
  })();

  /* ======================= atelier panel (desktop navigation) ======================= */
  var panel = $('#atelierPanel'), navList = $('#primaryNavList'), curKey = null, panelOpen = false, hideT, overT, leaveT;
  navList.innerHTML = M.NAV.map(function (n) {
    return '<li><button class="nav-item" type="button" data-nav="' + n.key + '" aria-expanded="false" aria-controls="atelierPanel">' + esc(n.label) + '</button></li>';
  }).join('');
  function navItem(key) { return M.NAV.filter(function (n) { return n.key === key; })[0]; }
  function openPanel(key) {
    var item = navItem(key); if (!item) return;
    clearTimeout(hideT); clearTimeout(leaveT);
    if (key !== curKey) {
      $('#apTitle').textContent = item.title;
      $('#apLinks').innerHTML = item.links.map(function (l) { return '<li><button type="button" data-go="' + esc(l.action) + '">' + esc(l.label) + '</button></li>'; }).join('');
      $('#apFigure').innerHTML = M.Art.panel(item) + '<figcaption>' + esc(item.image) + '</figcaption>';
    }
    curKey = key; panelOpen = true;
    $$('.nav-item').forEach(function (b) { b.setAttribute('aria-expanded', String(b.getAttribute('data-nav') === key)); });
    header.classList.add('is-open');
    if (panel.hidden) { panel.hidden = false; requestAnimationFrame(function () { requestAnimationFrame(function () { panel.classList.add('is-in'); }); }); }
    else panel.classList.add('is-in');
  }
  function closePanel(immediate) {
    if (!panelOpen && panel.hidden) return;
    panelOpen = false; curKey = null;
    $$('.nav-item').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    panel.classList.remove('is-in'); header.classList.remove('is-open');
    clearTimeout(hideT);
    hideT = setTimeout(function () { if (!panelOpen) panel.hidden = true; }, immediate || C.reduced() ? 0 : 420);
  }
  navList.addEventListener('click', function (e) {
    var b = e.target.closest('[data-nav]'); if (!b) return;
    var key = b.getAttribute('data-nav'); if (panelOpen && curKey === key) closePanel(); else openPanel(key);
  });
  navList.addEventListener('pointerover', function (e) {
    if (e.pointerType !== 'mouse') return;
    var b = e.target.closest('[data-nav]'); if (!b) return;
    clearTimeout(overT); overT = setTimeout(function () { openPanel(b.getAttribute('data-nav')); }, 80);
  });
  navList.addEventListener('pointerout', function () { clearTimeout(overT); });
  header.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') clearTimeout(leaveT); });
  header.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'mouse' || !panelOpen) return; clearTimeout(leaveT); leaveT = setTimeout(function () { closePanel(); }, 240); });
  header.addEventListener('focusout', function (e) { if (panelOpen && e.relatedTarget && !header.contains(e.relatedTarget)) closePanel(); });
  navList.addEventListener('keydown', function (e) {
    var b = e.target.closest('[data-nav]'); if (!b) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); openPanel(b.getAttribute('data-nav')); var f = $('#apLinks button'); if (f) f.focus(); }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      var all = $$('.nav-item'), i = all.indexOf(b) + (e.key === 'ArrowRight' ? 1 : -1); all[(i + all.length) % all.length].focus();
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panelOpen) { var k = curKey; closePanel(); var b = $('.nav-item[data-nav="' + k + '"]'); if (b) b.focus(); }
  });
  document.addEventListener('click', function (e) {
    if (panelOpen && !header.contains(e.target)) closePanel();
    var rp = $('#regionPop'); if (!rp.hidden && !rp.contains(e.target) && !e.target.closest('#regionBtn')) C.hideRegion();
  });

  /* ======================= mobile menu ======================= */
  $('#menuBody').innerHTML = M.NAV.map(function (n, i) {
    return '<div class="menu-group"><button type="button" aria-expanded="false" aria-controls="mg-' + i + '">' + esc(n.label) + '</button><ul id="mg-' + i + '" hidden>' +
      n.links.map(function (l) { return '<li><button type="button" data-go="' + esc(l.action) + '">' + esc(l.label) + '</button></li>'; }).join('') + '</ul></div>';
  }).join('');
  $('#menuBody').addEventListener('click', function (e) {
    var b = e.target.closest('.menu-group > button'); if (!b) return;
    var open = b.getAttribute('aria-expanded') === 'true';
    $$('.menu-group > button').forEach(function (x) { x.setAttribute('aria-expanded', 'false'); $('#' + x.getAttribute('aria-controls')).hidden = true; });
    if (!open) { b.setAttribute('aria-expanded', 'true'); $('#' + b.getAttribute('aria-controls')).hidden = false; }
  });
  $('#menuToggle').addEventListener('click', function () { C.open($('#layerMenu')); });

  /* ======================= currency and region ======================= */
  var regionT;
  function regionNote() { return C.isLocal() ? 'Complimentary white-glove insured delivery across Sri Lanka.' : 'Delivered by DHL Express, duties and taxes included. Rates are indicative and confirmed at checkout.'; }
  function buildRegion() {
    $('#regionList').innerHTML = Object.keys(M.CURRENCIES).map(function (k) {
      var c = M.CURRENCIES[k];
      return '<button class="region-opt" type="button" role="radio" aria-checked="' + (k === C.state.currency) + '" data-cur="' + k + '"><span>' + esc(c.region) + '</span><small>' + k + '</small></button>';
    }).join('');
    $('#regionNote').textContent = regionNote();
  }
  C.showRegion = function () {
    var pop = $('#regionPop'); clearTimeout(regionT); closePanel(true);
    buildRegion(); pop.hidden = false; $('#regionBtn').setAttribute('aria-expanded', 'true');
    requestAnimationFrame(function () { requestAnimationFrame(function () { pop.classList.add('is-in'); var s = $('.region-opt[aria-checked="true"]', pop); if (s) s.focus({ preventScroll: true }); }); });
  };
  C.hideRegion = function () {
    var pop = $('#regionPop'); pop.classList.remove('is-in'); $('#regionBtn').setAttribute('aria-expanded', 'false');
    clearTimeout(regionT); regionT = setTimeout(function () { pop.hidden = true; }, C.reduced() ? 0 : 320);
  };
  $('#regionBtn').addEventListener('click', function () { if ($('#regionPop').hidden) C.showRegion(); else { C.hideRegion(); } });
  $('#regionList').addEventListener('click', function (e) {
    var b = e.target.closest('[data-cur]'); if (!b) return;
    var k = b.getAttribute('data-cur'); C.setCurrency(k); buildRegion();
    C.toast(k === 'LKR' ? 'Prices shown in Sri Lankan rupees.' : 'Prices shown in ' + k + ', duties included.');
    setTimeout(function () { C.hideRegion(); var rb = $('#regionBtn'); if (rb && rb.offsetParent) rb.focus({ preventScroll: true }); }, 260);
  });
  $('#regionPop').addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.stopPropagation(); C.hideRegion(); $('#regionBtn').focus(); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); var o = $$('.region-opt'), i = o.indexOf(document.activeElement) + (e.key === 'ArrowDown' ? 1 : -1); o[(i + o.length) % o.length].focus();
    }
  });
  $('[data-action="region-from-menu"]').addEventListener('click', function () { C.close($('#layerMenu')); later(function () { C.showRegion(); }); });
  C.on('currency', function () { var rn = $('#regionNote'); if (rn) rn.textContent = regionNote(); var mb = $('[data-action="region-from-menu"]'); if (mb) mb.textContent = M.CURRENCIES[C.state.currency].label; });

  /* ======================= search ======================= */
  var KIND_WORDS = { gown: 'dress gown couture evening velvet painted', mullet: 'gown evening rosette train silk', column: 'gown evening strapless bow satin pearl', lace: 'dress lace midi velvet garnet', silkmidi: 'dress midi silk twisted asymmetric', blazer: 'jacket tailoring blazer ruffle peplum', mini: 'dress mini scarf tailored', cape: 'cape lace sheer pearl' };
  function hay(p) { return [p.name, p.short, p.summary, p.materials, p.collection, p.tabs.join(' '), KIND_WORDS[p.kind] || '', p.provenance, p.bespoke ? 'bespoke made-to-measure' : ''].join(' ').toLowerCase(); }
  var index = M.PRODUCTS.map(function (p) { return { p: p, h: hay(p) }; });
  var SUGGEST = ['gown', 'velvet', 'lace', 'bespoke', 'silk'];
  function renderSearch(q) {
    var box = $('#searchResults'), terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) {
      box.innerHTML = '<p class="search-hint">Suggested</p><div class="search-suggest">' + SUGGEST.map(function (s) { return '<button class="link-btn" type="button" data-q="' + s + '">' + s + '</button>'; }).join('') + '</div>';
      return;
    }
    var hits = index.filter(function (x) { return terms.every(function (t) { return x.h.indexOf(t) > -1; }); });
    if (!hits.length) {
      box.innerHTML = '<p class="search-empty">Nothing in the collection matches &ldquo;' + esc(q) + '&rdquo;. Try &ldquo;velvet&rdquo;, &ldquo;lace&rdquo; or &ldquo;gown&rdquo;, or <button class="link-btn" type="button" data-go="stylist">ask a Maison Stylist</button>.</p>';
      return;
    }
    box.innerHTML = '<p class="search-hint">' + hits.length + (hits.length === 1 ? ' piece' : ' pieces') + '</p>' + hits.map(function (x) {
      var p = x.p;
      return '<button class="search-hit" type="button" data-product="' + p.id + '"><span class="search-hit__thumb">' + C.plateHTML(p, 'form') + '</span>' +
        '<span><span class="search-hit__name" style="display:block">' + esc(p.short) + '</span><span class="search-hit__meta" style="display:block">' + esc(p.collection) + (p.edition ? ' · Edition of ' + p.edition : '') + '</span></span>' +
        '<span class="search-hit__price" data-price="' + p.price + '">' + C.price(p.price) + '</span></button>';
    }).join('');
  }
  ui.openSearch = function () { closePanel(true); var i = $('#searchInput'); i.value = ''; renderSearch(''); C.open($('#layerSearch')); setTimeout(function () { i.focus(); }, 80); };
  $('#searchBtn').addEventListener('click', ui.openSearch);
  var searchT;
  $('#searchInput').addEventListener('input', function (e) { clearTimeout(searchT); var v = e.target.value; searchT = setTimeout(function () { renderSearch(v); }, 60); });
  $('#searchInput').addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); C.close($('#layerSearch')); } });
  $('#searchForm').addEventListener('submit', function (e) { e.preventDefault(); var h = $('.search-hit'); if (h) h.click(); });
  $('#searchResults').addEventListener('click', function (e) {
    var q = e.target.closest('[data-q]'); if (q) { var i = $('#searchInput'); i.value = q.getAttribute('data-q'); renderSearch(i.value); i.focus(); return; }
    var p = e.target.closest('[data-product]'); if (p) go('product:' + p.getAttribute('data-product'));
  });

  /* ======================= hero film ======================= */
  var hero = $('#hero'), video = $('#heroVideo'), reel = $('[data-film-reel]', hero), ftoggle = $('#filmToggle');
  reel.innerHTML = M.Art.film();
  var userPaused = C.reduced(), inView = true;
  video.addEventListener('loadeddata', function () { hero.classList.add('has-film'); applyFilm(); });
  if (video.readyState >= 2) hero.classList.add('has-film');
  function applyFilm() {
    var runIt = inView && !userPaused && !document.hidden;
    reel.classList.toggle('is-paused', !runIt);
    reel.classList.toggle('film--still', userPaused && C.reduced());
    if (video.readyState > 0) { if (runIt) { var pr = video.play(); if (pr && pr.catch) pr.catch(noop); } else video.pause(); }
    ftoggle.setAttribute('aria-pressed', String(userPaused));
    $('.ctl__label', ftoggle).textContent = userPaused ? 'Play film' : 'Pause film';
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { inView = en[0].intersectionRatio >= 0.5; applyFilm(); }, { threshold: [0, 0.25, 0.5, 0.75, 1] }).observe(hero);
  }
  document.addEventListener('visibilitychange', function () { applyFilm(); audioVisibility(); });
  ftoggle.addEventListener('click', function () { userPaused = !userPaused; applyFilm(); });
  applyFilm();

  /* keep the film alive: some browsers (iOS low-power mode, background tabs, flaky decoders)
     pause or stall a looping video on their own, so nudge it back whenever it should be playing */
  function shouldRun() { return inView && !userPaused && !document.hidden; }
  function revive() {
    if (!shouldRun() || video.readyState === 0) return;
    if (video.ended) { try { video.currentTime = 0; } catch (e) {} }
    var pr = video.play(); if (pr && pr.catch) pr.catch(noop);
  }
  ['pause', 'ended', 'stalled', 'suspend', 'emptied', 'abort'].forEach(function (ev) {
    video.addEventListener(ev, function () { setTimeout(revive, 120); });
  });
  video.addEventListener('error', function () { try { video.load(); } catch (e) {} setTimeout(revive, 400); });
  var lastT = -1, frozen = 0;
  setInterval(function () {
    if (!shouldRun() || video.readyState < 2) { frozen = 0; return; }
    if (video.paused || Math.abs(video.currentTime - lastT) < 0.01) { if (++frozen >= 2) { frozen = 0; revive(); } }
    else frozen = 0;
    lastT = video.currentTime;
  }, 1500);
  ['touchstart', 'pointerdown', 'keydown'].forEach(function (ev) {
    window.addEventListener(ev, function once() { if (video.paused && shouldRun()) revive(); }, { passive: true });
  });

  /* ambient sound: a file if configured, otherwise a very quiet synthesised drone */
  var snd = { on: false, ctx: null, master: null, el: null };
  function startAmbient() {
    if (M.CONFIG.ambientSrc) {
      snd.el = snd.el || new Audio(M.CONFIG.ambientSrc); snd.el.loop = true; snd.el.volume = 0.3;
      var pr = snd.el.play(); if (pr && pr.catch) pr.catch(noop); return true;
    }
    var Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return false;
    if (!snd.ctx) {
      var ctx = (snd.ctx = new Ctx()), master = (snd.master = ctx.createGain()), lp = ctx.createBiquadFilter();
      master.gain.value = 0; master.connect(ctx.destination); lp.type = 'lowpass'; lp.frequency.value = 420; lp.connect(master);
      [55, 82.41, 110, 164.81, 220.5].forEach(function (f, i) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = i < 2 ? 'sine' : 'triangle'; o.frequency.value = f; o.detune.value = i % 2 ? 5 : -5; g.gain.value = [0.5, 0.35, 0.25, 0.12, 0.06][i];
        o.connect(g); g.connect(lp); o.start();
      });
      var lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 160; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
    }
    snd.ctx.resume(); snd.master.gain.setTargetAtTime(0.2, snd.ctx.currentTime, 0.6); return true;
  }
  function stopAmbient() {
    if (snd.el) snd.el.pause();
    if (snd.ctx) { snd.master.gain.setTargetAtTime(0, snd.ctx.currentTime, 0.35); setTimeout(function () { if (!snd.on && snd.ctx) snd.ctx.suspend(); }, 1600); }
  }
  function audioVisibility() {
    if (!snd.on) return;
    if (document.hidden) { if (snd.ctx) snd.ctx.suspend(); if (snd.el) snd.el.pause(); }
    else { if (snd.ctx) snd.ctx.resume(); if (snd.el) { var p = snd.el.play(); if (p && p.catch) p.catch(noop); } }
  }
  $('#soundToggle').addEventListener('click', function () {
    var b = this;
    if (!snd.on) {
      if (!startAmbient()) { C.toast('Ambient sound is not available in this browser.'); return; }
      snd.on = true;
    } else { snd.on = false; stopAmbient(); }
    b.setAttribute('aria-pressed', String(snd.on));
    $('.ctl__label', b).textContent = snd.on ? 'Ambient sound on' : 'Ambient sound off';
  });

  /* ======================= campaign rail ======================= */
  $('#rail').innerHTML = M.LOOKBOOK.map(function (l) {
    var media = l.src ? '<img src="' + esc(l.src) + '" alt="' + esc(l.caption) + '" loading="lazy" decoding="async">' : M.Art.look(l);
    return '<figure class="look"><span class="look__frame" data-media-slot="lookbook-' + l.id + '" data-prompt="' + esc(l.prompt) + '">' + media + '</span>' +
      '<figcaption class="look__cap"><h3>' + esc(l.title) + '</h3><p>' + esc(l.caption) + '</p><button class="link-btn" type="button" data-go="filter:' + esc(l.filter) + '">Shop this story</button></figcaption></figure>';
  }).join('');
  $('#rail').addEventListener('keydown', function (e) {
    if (e.target !== this) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); this.scrollBy({ left: 340, behavior: C.reduced() ? 'auto' : 'smooth' }); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); this.scrollBy({ left: -340, behavior: C.reduced() ? 'auto' : 'smooth' }); }
  });

  /* ======================= hidden cipher ======================= */
  var cipher = $('#cipher'), cbtn = $('#cipherBtn');
  function setCipher(on) {
    if (on === cipher.classList.contains('is-lit')) return;
    cipher.classList.toggle('is-lit', on);
    cbtn.setAttribute('aria-expanded', String(on));
    cbtn.textContent = on ? 'Conceal the cipher' : 'Discover the Hidden Sun & Moon Cipher';
    $('#cipherNotes').setAttribute('aria-hidden', String(!on)); $('#cipherVow').setAttribute('aria-hidden', String(!on));
    $$('#cipherNotes li').forEach(function (li) { if (on) li.setAttribute('tabindex', '0'); else li.removeAttribute('tabindex'); });
    if (!on) $$('.is-focus', cipher).forEach(function (el) { el.classList.remove('is-focus'); });
    $('#cipherStatus').textContent = on ? 'Cipher revealed. The crossbars of the first A, the H and the second A are the Sun and Moon. Enduring as the Sun and Moon.' : 'Cipher hidden.';
  }
  cbtn.addEventListener('click', function () { setCipher(!cipher.classList.contains('is-lit')); });
  $('#cipherMark').addEventListener('click', function (e) { if (e.target.closest('.cipher-accent')) setCipher(true); });
  function barFocus(li, on) {
    var bar = li.getAttribute('data-bar');
    $$('.bar-' + bar, cipher).forEach(function (el) { el.classList.toggle('is-focus', on); });
  }
  $$('#cipherNotes li').forEach(function (li) {
    li.addEventListener('mouseenter', function () { barFocus(li, true); });
    li.addEventListener('mouseleave', function () { barFocus(li, false); });
    li.addEventListener('focus', function () { barFocus(li, true); });
    li.addEventListener('blur', function () { barFocus(li, false); });
  });

  /* ======================= unboxing ritual ======================= */
  var box = $('#boxSvg'), boxBtn = $('#boxToggle');
  $('#partsList').innerHTML = M.RITUAL.map(function (r) {
    return '<li><button class="part-btn" type="button" data-part="' + r.id + '" aria-pressed="false"><span class="part-btn__name">' + esc(r.name) + '</span><span class="part-btn__spec">' + esc(r.spec) + '</span></button></li>';
  }).join('');
  $('#partDetail').textContent = 'Select a part to see what it is made of.';
  function setBox(open) { box.setAttribute('data-open', String(open)); boxBtn.setAttribute('aria-pressed', String(open)); boxBtn.textContent = open ? 'Close the box' : 'Open the box'; }
  function pickPart(id) {
    var r = M.RITUAL.filter(function (x) { return x.id === id; })[0]; if (!r) return;
    box.setAttribute('data-part', id);
    $$('.part-btn').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-part') === id)); });
    $('#partDetail').textContent = r.name + '. ' + r.text;
    if (id !== 'box' && box.getAttribute('data-open') !== 'true') setBox(true);
  }
  $('#partsList').addEventListener('click', function (e) { var b = e.target.closest('[data-part]'); if (b) pickPart(b.getAttribute('data-part')); });
  box.addEventListener('click', function (e) { var g = e.target.closest('[data-part]'); if (g && g !== box) pickPart({ ribbon: 'box', crest: 'box' }[g.getAttribute('data-part')] || g.getAttribute('data-part')); });
  boxBtn.addEventListener('click', function () { setBox(box.getAttribute('data-open') !== 'true'); });

  /* ======================= info layer ======================= */
  ui.openInfo = function (key) {
    var i = M.INFO[key]; if (!i) return;
    $('#infoPanel').innerHTML = head('infoTitle', esc(i.title), 'Close') + '<div class="panel-body">' + i.body.map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') + '<button class="btn btn--ghost btn--block" type="button" data-close>Close</button></div>';
    C.open($('#layerInfo'));
  };

  /* ======================= film modal ======================= */
  ui.openFilm = function () {
    var f = M.CONFIG.film || {}, real = f.webm || f.mp4;
    var stage = real
      ? '<video controls autoplay playsinline poster="' + esc(f.poster || '') + '" aria-label="MANTHAI Atelier Film">' + (f.webm ? '<source src="' + esc(f.webm) + '" type="video/webm">' : '') + (f.mp4 ? '<source src="' + esc(f.mp4) + '" type="video/mp4">' : '') + '</video>'
      : '<div class="film" id="modalReel" role="img" aria-label="Atelier film placeholder: four shots of origin, craft, brushwork and the woven label reveal">' + M.Art.film() + '</div>';
    $('#filmPanel').innerHTML = '<div class="film-stage" data-media-slot="atelier-film"><button class="icon-btn film-close" type="button" data-close aria-label="Close film">' + X + '</button>' + stage + '</div>' +
      '<div class="film-bar"><p><b>Atelier Film.</b> ' + (real ? 'Press play to watch with sound.' : 'A placeholder reel. The finished film replaces it when the files are added.') + '</p>' +
      (real ? '' : '<button class="btn btn--ghost btn--sm" type="button" id="reelToggle" aria-pressed="false">Pause</button>') +
      '<button class="btn btn--ghost btn--sm" type="button" data-close>Close</button></div>';
    var rt = $('#reelToggle');
    if (rt) rt.addEventListener('click', function () { var p = rt.getAttribute('aria-pressed') !== 'true'; rt.setAttribute('aria-pressed', String(p)); rt.textContent = p ? 'Play' : 'Pause'; $('#modalReel').classList.toggle('is-paused', p); });
    C.open($('#layerFilm'));
  };
  C.on('close', function (d) { if (d.id === 'layerFilm') $('#filmPanel').innerHTML = ''; });

  /* ======================= Maison Stylist ======================= */
  var styView = 'form', styRef = null;
  function waLink(text) { return 'https://wa.me/' + M.CONFIG.whatsapp + '?text=' + encodeURIComponent(text); }
  function tomorrow() { var d = new Date(); d.setDate(d.getDate() + 1); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  var SLOTS = ['10:00', '12:00', '15:00', '17:00'], TOPICS = [M.FITTING, 'Made-to-measure and sizing', 'Choosing a piece', 'A gift or a commission', 'Delivery and duties', 'Care and repair'];
  function renderStylist(pid, topic) {
    var p = pid && C.product(pid), s = C.state.stylist || {}, mem = C.state.member || {};
    if (topic) s = Object.assign({}, s, { topic: topic });
    var msg = p ? 'Good day, I would like to speak with a Maison Stylist about the ' + p.short + '.' : 'Good day, I would like to speak with a Maison Stylist.';
    var body;
    if (styView === 'done' && s.ref) {
      body = '<div class="confirm"><h3>Thank you, ' + esc(firstName(s.name)) + '.</h3><p class="order-ref" aria-label="Request reference">' + esc(s.ref) + '</p>' +
        '<p>Your request for ' + esc(fmtDate(s.date)) + ' at ' + esc(s.time) + ' (Colombo time) is with the atelier. A stylist confirms the appointment by email within one working day.</p>' +
        '<p class="fine-print">Demonstration storefront: no email was sent.</p>' +
        '<div class="choices"><button class="btn btn--gold btn--block" type="button" data-ics>Add to calendar</button><a class="btn btn--ghost btn--block" href="' + waLink(msg) + '" target="_blank" rel="noopener">Message on WhatsApp</a></div>' +
        '<button class="link-btn" type="button" data-again>Request another time</button></div>';
    } else {
      body = '<form class="panel-body" id="stylistForm" novalidate>' +
        '<p class="lede lede--dark">A private conversation with someone who knows the atelier. Ask about fit, a commission or anything you would ask in the Colombo salon.</p>' +
        (p ? '<div class="notice"><strong>About:</strong> ' + esc(p.short) + '</div>' : '') +
        '<a class="btn btn--ghost btn--block" href="' + waLink(msg) + '" target="_blank" rel="noopener">Message on WhatsApp now</a>' +
        '<p class="sep">or book a time</p>' +
        fld('st-name', 'Full name', '<input id="st-name" name="name" type="text" autocomplete="name" value="' + esc(s.name || mem.name || '') + '">') +
        fld('st-email', 'Email', '<input id="st-email" name="email" type="email" autocomplete="email" inputmode="email" value="' + esc(s.email || mem.email || '') + '">') +
        fld('st-topic', 'What would you like to discuss', '<select id="st-topic" name="topic">' + TOPICS.map(function (t) { return '<option' + (s.topic === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select>') +
        '<div class="row-2">' +
          fld('st-date', 'Preferred date', '<input id="st-date" name="date" type="date" min="' + tomorrow() + '" value="' + esc(s.date || '') + '">') +
          fld('st-time', 'Time (Colombo)', '<select id="st-time" name="time">' + SLOTS.map(function (t) { return '<option' + (s.time === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select>') +
        '</div>' +
        fld('st-note', 'Anything we should know', '<textarea id="st-note" name="note" placeholder="Occasion, timing, preferred contact">' + esc(s.note || '') + '</textarea>') +
        '<button class="btn btn--gold btn--block" type="submit">Request appointment</button></form>';
    }
    $('#stylistPanel').innerHTML = head('stylistTitle', 'The Maison Stylist', 'Close stylist') + body;
    $('#stylistPanel').setAttribute('data-product', pid || '');
  }
  ui.openStylist = function (pid, topic) { styView = 'form'; renderStylist(pid, topic); C.open($('#layerStylist')); };
  $('#stylistPanel').addEventListener('click', function (e) {
    if (e.target.closest('[data-again]')) { styView = 'form'; renderStylist($('#stylistPanel').getAttribute('data-product')); return; }
    if (e.target.closest('[data-ics]')) {
      var s = C.state.stylist; if (!s) return;
      var parts = s.date.split('-').map(Number), hm = s.time.split(':').map(Number);
      var start = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], hm[0], hm[1]) - 330 * 60000), end = new Date(start.getTime() + 45 * 60000);
      function z(d) { return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + '00Z'; }
      download('manthai-stylist-appointment.ics', 'text/calendar', ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//House of MANTHAI//Stylist//EN', 'BEGIN:VEVENT', 'UID:' + s.ref + '@manthai', 'DTSTAMP:' + z(new Date()), 'DTSTART:' + z(start), 'DTEND:' + z(end), 'SUMMARY:Maison Stylist appointment (requested)', 'DESCRIPTION:' + String(s.topic).replace(/[,;]/g, ' ') + '. Reference ' + s.ref + '. Confirmation follows by email.', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n'));
      C.toast('Calendar file downloaded.');
    }
  });
  $('#stylistPanel').addEventListener('submit', function (e) {
    if (e.target.id !== 'stylistForm') return; e.preventDefault();
    var f = e.target, bad = null;
    function need(n, ok, msg) { var i = f.elements[n]; if (!ok(i.value)) { C.setError(i, msg); bad = bad || i; } else C.setError(i, ''); }
    need('name', function (v) { return v.trim().length > 1; }, 'Enter your full name.');
    need('email', C.validEmail, 'Enter a valid email address, such as name@example.com.');
    need('date', function (v) { return !!v && v >= tomorrow(); }, 'Choose a date from tomorrow onwards.');
    if (bad) { bad.focus(); return; }
    C.state.stylist = { ref: C.uid('STY'), name: f.elements.name.value.trim(), email: f.elements.email.value.trim(), topic: f.elements.topic.value, date: f.elements.date.value, time: f.elements.time.value, note: f.elements.note.value.trim(), at: new Date().toISOString() };
    C.save(); styView = 'done'; renderStylist($('#stylistPanel').getAttribute('data-product')); $('#stylistPanel').scrollTop = 0;
  });

  /* ======================= Digital Product Passport ======================= */
  function pieceNo(p) { return p.edition ? p.edition - p.remaining + 1 : 0; }
  function findItem(code) {
    var seen = {}, found = null;
    C.state.orders.slice().reverse().forEach(function (o) {
      o.items.forEach(function (it) { seen[it.id] = (seen[it.id] || 0); if (it.passport === code && !found) found = { o: o, it: it, ordinal: seen[it.id] }; seen[it.id] += 1; });
    });
    return found;
  }
  var NFC = '<svg viewBox="0 0 64 64" width="72" height="72" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M22 44c5-8 5-16 0-24"/><path d="M30 50c8-12 8-24 0-36"/><path d="M38 56c11-16 11-32 0-48"/></svg>';
  var scanT;
  ui.openPassport = function (pid, code) {
    var hit = code && findItem(code), p = (hit && C.product(hit.it.id)) || (pid && C.product(pid)) || M.PRODUCTS[0];
    var id = code || ('MNT-' + hash(p.id)), n = pieceNo(p) + (hit ? hit.ordinal : 0);
    var owner = hit ? (C.state.member ? 'Registered to ' + (C.state.member.name || 'you') : 'Registered to ' + hit.o.name) : 'Unclaimed. Registers to the first owner.';
    var sample = !hit;
    $('#passportPanel').innerHTML = head('passportTitle', 'Digital Product Passport', 'Close passport') +
      '<div class="panel-body"><p class="lede lede--dark">Every MANTHAI piece carries an NFC tag in its label. Hold a phone to it and the piece proves where and how it was made.</p>' +
      '<div class="phone" id="phone"><div class="nfc">' + NFC + '</div><p id="phoneMsg" class="fine-print">Hold your phone near the woven label.</p>' +
      '<div class="passport" id="passportOut" hidden aria-live="polite">' +
        '<span class="verified"><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>Authenticated by the House</span>' +
        '<dl><div><dt>Piece</dt><dd>' + esc(p.name) + '</dd></div>' +
        '<div><dt>Edition</dt><dd>' + (p.edition ? 'Piece ' + pad(n) + ' of ' + p.edition : 'Atelier series') + '</dd></div>' +
        '<div><dt>Provenance</dt><dd>' + esc(p.provenance) + '</dd></div>' +
        '<div><dt>Materials</dt><dd>' + esc(p.materials) + '</dd></div>' +
        '<div><dt>Care</dt><dd>' + esc(p.care) + '</dd></div>' +
        '<div><dt>Passport ID</dt><dd class="order-ref">' + esc(id) + '</dd></div>' +
        '<div><dt>Ownership</dt><dd>' + esc(owner) + '</dd></div></dl></div></div>' +
      '<button class="btn btn--gold btn--block" type="button" id="scanBtn">' + (hit ? 'Scan the label' : 'Simulate an NFC tap') + '</button>' +
      (sample ? '<p class="fine-print">This is a sample passport for the ' + esc(p.short) + '. Passports for your own pieces appear after you order.</p>' : '') + '</div>';
    C.open($('#layerPassport'));
    if (hit) { clearTimeout(scanT); scanT = setTimeout(scan, 500); }
  };
  function scan() {
    var ph = $('#phone'); if (!ph) return;
    var btn = $('#scanBtn'), msg = $('#phoneMsg'), out = $('#passportOut');
    out.hidden = true; msg.hidden = false; msg.textContent = 'Reading the tag…'; ph.classList.add('is-scanning'); btn.disabled = true;
    scanT = setTimeout(function () {
      ph.classList.remove('is-scanning'); msg.hidden = true; out.hidden = false; btn.disabled = false; btn.textContent = 'Scan again';
    }, C.reduced() ? 100 : 1500);
  }
  $('#passportPanel').addEventListener('click', function (e) { if (e.target.closest('#scanBtn')) scan(); });
  C.on('close', function (d) { if (d.id === 'layerPassport') clearTimeout(scanT); });

  /* ======================= Private Salon ======================= */
  var salonView = 'in', salonEmail = '', pendingCb = null;
  var STEPS = ['Order confirmed', 'In the atelier', 'Dispatched', 'Delivered'];
  var MLAB = { chest: 'Bust', waist: 'Waist', hips: 'Hip', height: 'Height', heel: 'Heel height' };
  function signIn(m) {
    C.state.member = { email: m.email, name: m.name || nameFromEmail(m.email), since: new Date().toISOString() };
    C.save(); C.emit('member');
  }
  C.on('member', function () {
    var b = $('#salonBtn'), m = C.state.member;
    b.classList.toggle('is-member', !!m);
    b.setAttribute('aria-label', m ? 'Private Salon, signed in as ' + m.name : 'Private Salon account');
  });
  function gIcon() { return '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M12 12h8M20 12a8 8 0 01-2.4 5.7" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>'; }
  function renderSalon() {
    var m = C.state.member, h;
    if (m) h = salonDash(m);
    else if (salonView === 'sent') {
      h = head('salonTitle', 'Check your inbox', 'Close Private Salon') + '<div class="panel-body"><p>A private link would be sent to <strong>' + esc(salonEmail) + '</strong>.</p>' +
        '<p class="notice"><strong>Demonstration.</strong> This storefront has no mail server, so no email is sent. Continue to see your Salon.</p>' +
        '<button class="btn btn--gold btn--block" type="button" data-enter>Open my Private Salon</button><button class="link-btn" type="button" data-back>Use a different email</button></div>';
    } else if (salonView === 'google') {
      h = head('salonTitle', 'Continue with Google', 'Close Private Salon') + '<form class="panel-body" id="googleForm" novalidate>' +
        '<p class="notice"><strong>Demonstration account chooser.</strong> Add a Google client ID in <code>assets/js/catalog.js</code> to use real Google sign-in.</p>' +
        fld('g-name', 'Name', '<input id="g-name" name="name" type="text" autocomplete="name">') +
        fld('g-email', 'Google email', '<input id="g-email" name="email" type="email" autocomplete="email" inputmode="email">') +
        '<button class="btn btn--gold btn--block" type="submit">Continue</button><button class="link-btn" type="button" data-back>Back</button></form>';
    } else {
      h = head('salonTitle', 'The Private Salon', 'Close Private Salon') + '<div class="panel-body">' +
        '<p class="lede lede--dark">A quiet room for people who have chosen the House. Keep your measurements, follow your deliveries, hear about archive previews first and hold the passports of every piece you own.</p>' +
        '<button class="google-btn" type="button" data-google>' + gIcon() + ' Continue with Google</button>' +
        '<p class="sep">or by email</p>' +
        '<form id="salonForm" novalidate class="salon-form">' + fld('s-email', 'Email', '<input id="s-email" name="email" type="email" autocomplete="email" inputmode="email" placeholder="name@example.com">') +
        '<button class="btn btn--gold btn--block" type="submit">Send me a private link</button></form>' +
        '<p class="fine-print">No password. Your details stay in this browser.</p></div>';
    }
    $('#salonPanel').innerHTML = h;
  }
  function salonDash(m) {
    var meas = C.state.measurements, notify = C.state.notify || {}, orders = C.state.orders;
    var items = []; orders.forEach(function (o) { o.items.forEach(function (it) { items.push(it); }); });
    var low = M.PRODUCTS.filter(function (p) { return p.remaining > 0 && p.remaining <= 4; });
    var mHtml = meas
      ? '<ul class="salon-list">' + Object.keys(MLAB).filter(function (k) { return meas.cm[k] != null; }).map(function (k) {
          var v = meas.unit === 'in' ? Math.round(meas.cm[k] / 2.54 * 10) / 10 : meas.cm[k]; return '<li>' + MLAB[k] + ': ' + v + ' ' + meas.unit + '</li>'; }).join('') + '</ul><button class="link-btn" type="button" data-measure>Edit measurements</button>'
      : '<p>No measurements yet. Save them once and every made-to-measure piece starts from them.</p><button class="link-btn" type="button" data-measure>Add measurements</button>';
    var oHtml = orders.length ? orders.map(function (o) {
      var st = Math.min(o.step || 0, 3);
      return '<div class="salon-order"><p><strong>' + esc(o.ref) + '</strong> · ' + esc(fmtDate(o.date)) + ' · ' + o.items.length + (o.items.length === 1 ? ' piece' : ' pieces') + ' · ' + esc(o.display) + '</p>' +
        '<div class="track" aria-hidden="true">' + STEPS.map(function (s, i) { return '<i class="' + (i <= st ? 'on' : '') + '"></i>'; }).join('') + '</div><p class="fine-print">' + STEPS[st] + (o.country === 'Sri Lanka' ? '. White-glove courier.' : '. DHL Express, duties included.') + '</p></div>';
    }).join('') : '<p>No orders yet. Pieces you reserve are tracked here.</p>';
    var vHtml = items.length ? '<div class="pass-list">' + items.map(function (it) { return '<div class="pass-item"><span>' + esc(it.short) + '</span><button class="link-btn" type="button" data-pass="' + esc(it.passport) + '">View passport</button></div>'; }).join('') + '</div>'
      : '<p>Passports appear here after your first order.</p><button class="link-btn" type="button" data-pass-sample>See a sample passport</button>';
    var aHtml = '<p>Members may reserve the last pieces of an edition before they are shown elsewhere.</p>' +
      (low.length ? '<div class="pass-list">' + low.map(function (p) { return '<div class="pass-item"><span>' + esc(p.short) + ' <small>(' + p.remaining + ' of ' + p.edition + ' remain)</small></span><button class="link-btn" type="button" data-product="' + p.id + '">View</button></div>'; }).join('') + '</div>' : '') +
      '<label class="toggle-row"><span>Tell me about new archive previews</span><input type="checkbox" data-notify="archive"' + (notify.archive ? ' checked' : '') + '></label>' +
      '<label class="toggle-row"><span>Tell me when a sold-out piece returns</span><input type="checkbox" data-notify="restock"' + (notify.restock ? ' checked' : '') + '></label>';
    return head('salonTitle', 'Welcome, ' + esc(firstName(m.name)), 'Close Private Salon') + '<div class="panel-body salon-grid">' +
      '<p class="fine-print">Member since ' + esc(fmtDate(m.since)) + ' · ' + esc(m.email) + '</p>' +
      '<section class="salon-card"><h3>Measurements</h3>' + mHtml + '</section>' +
      '<section class="salon-card"><h3>Orders and delivery</h3>' + oHtml + '</section>' +
      '<section class="salon-card"><h3>NFC passport vault</h3>' + vHtml + '</section>' +
      '<section class="salon-card"><h3>Archive previews</h3>' + aHtml + '</section>' +
      '<button class="btn btn--ghost btn--block" type="button" data-signout>Sign out</button></div>';
  }
  ui.openSalon = function () { salonView = 'in'; renderSalon(); C.open($('#layerSalon')); };
  var salonPanel = $('#salonPanel');
  salonPanel.addEventListener('click', function (e) {
    var t;
    if (e.target.closest('[data-google]')) { ui.googleSignIn(null); return; }
    if (e.target.closest('[data-back]')) { salonView = 'in'; renderSalon(); return; }
    if (e.target.closest('[data-enter]')) { signIn({ email: salonEmail }); renderSalon(); C.toast('Welcome to the Private Salon.'); return; }
    if (e.target.closest('[data-signout]')) { C.state.member = null; C.save(); C.emit('member'); salonView = 'in'; renderSalon(); C.toast('You have left the Private Salon on this device.'); return; }
    if (e.target.closest('[data-measure]')) { M.shop.openMeasure(function () { renderSalon(); }); return; }
    if ((t = e.target.closest('[data-pass]'))) { ui.openPassport(null, t.getAttribute('data-pass')); return; }
    if (e.target.closest('[data-pass-sample]')) { ui.openPassport(); return; }
    if ((t = e.target.closest('[data-product]'))) { var id = t.getAttribute('data-product'); C.close($('#layerSalon')); later(function () { M.shop.openProduct(id); }); }
  });
  salonPanel.addEventListener('change', function (e) {
    var n = e.target.getAttribute && e.target.getAttribute('data-notify'); if (!n) return;
    C.state.notify = C.state.notify || {}; C.state.notify[n] = e.target.checked; C.save();
    C.toast(e.target.checked ? 'We will let you know.' : 'Notification switched off.');
  });
  salonPanel.addEventListener('submit', function (e) {
    e.preventDefault();
    if (e.target.id === 'salonForm') {
      var i = e.target.elements.email;
      if (!C.validEmail(i.value)) { C.setError(i, 'Enter a valid email address, such as name@example.com.'); i.focus(); return; }
      salonEmail = i.value.trim(); salonView = 'sent'; renderSalon();
    } else if (e.target.id === 'googleForm') {
      var f = e.target, em = f.elements.email, nm = f.elements.name;
      if (!C.validEmail(em.value)) { C.setError(em, 'Enter the Google email you would like to use.'); em.focus(); return; }
      var mem = { email: em.value.trim(), name: nm.value.trim() || nameFromEmail(em.value) };
      signIn(mem); var cb = pendingCb; pendingCb = null;
      if (cb) { C.close($('#layerSalon')); later(function () { cb(C.state.member); }); } else renderSalon();
      C.toast('Signed in to the Private Salon.');
    }
  });
  C.on('close', function (d) { if (d.id === 'layerSalon') pendingCb = null; });
  C.on('bag', noop);

  /* Google sign-in: real Google Identity Services when a client id is configured, otherwise a demo chooser */
  function demoGoogle() { salonView = 'google'; renderSalon(); C.open($('#layerSalon')); }
  ui.googleSignIn = function (cb) {
    pendingCb = cb || null;
    var id = M.CONFIG.googleClientId; if (!id) { demoGoogle(); return; }
    function start() {
      try {
        window.google.accounts.id.initialize({ client_id: id, callback: function (r) {
          try {
            var b = r.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'), j = JSON.parse(decodeURIComponent(escape(atob(b))));
            signIn({ email: j.email, name: j.name }); var c2 = pendingCb; pendingCb = null; if (c2) c2(C.state.member); else if ($('#layerSalon').open) renderSalon();
            C.toast('Signed in to the Private Salon.');
          } catch (err) { demoGoogle(); }
        } });
        window.google.accounts.id.prompt(function (n) { if (n.isNotDisplayed && n.isNotDisplayed()) demoGoogle(); });
      } catch (err) { demoGoogle(); }
    }
    if (window.google && window.google.accounts) { start(); return; }
    var s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = start; s.onerror = demoGoogle; document.head.appendChild(s);
  };
  $('#salonBtn').addEventListener('click', ui.openSalon);

  /* ======================= global handlers ======================= */
  document.addEventListener('click', function (e) {
    var t;
    if ((t = e.target.closest('[data-go]'))) { e.preventDefault(); go(t.getAttribute('data-go')); return; }
    if ((t = e.target.closest('[data-info]'))) { ui.openInfo(t.getAttribute('data-info')); return; }
    if ((t = e.target.closest('[data-action]'))) {
      var a = t.getAttribute('data-action');
      if (a === 'scroll-collection') { e.preventDefault(); C.scrollTo('collection'); }
      else if (a === 'film') ui.openFilm();
      else if (a === 'stylist') ui.openStylist();
      else if (a === 'salon') { if ($('#layerMenu').open) { C.close($('#layerMenu')); later(ui.openSalon); } else ui.openSalon(); }
      else if (a === 'passport') ui.openPassport();
      return;
    }
    var link = e.target.closest('a[href^="#"]');
    if (link) {
      var id = link.getAttribute('href').slice(1);
      if (id === 'top') { e.preventDefault(); window.scrollTo({ top: 0, behavior: C.reduced() ? 'auto' : 'smooth' }); }
      else if (document.getElementById(id)) { e.preventDefault(); C.scrollTo(id); }
    }
  });

  /* clear a field's error as soon as the person starts correcting it */
  document.addEventListener('input', function (e) {
    var f = e.target.closest && e.target.closest('.field.has-error');
    if (f && e.target.matches('input, select, textarea')) C.setError(e.target, '');
  });

  /* ======================= Future Métiers and the Private Registry ======================= */
  $('#metiersGrid').innerHTML = M.METIERS.map(function (m) {
    var cta = m.action
      ? '<button class="btn btn--gold" type="button" data-action="' + m.action + '">' + esc(m.cta) + '</button>'
      : '<button class="btn btn--ghost" type="button" data-registry="' + esc(m.interest) + '">' + esc(m.cta) + '</button>';
    return '<li class="metier' + (m.action ? ' is-now' : '') + '"><p class="metier__chapter">' + esc(m.chapter) + '</p><h3 class="metier__title">' + esc(m.title) + '</h3><p class="metier__sub">' + esc(m.sub) + '</p>' +
      '<p class="metier__text">' + esc(m.text) + '</p><p class="metier__badge">' + esc(m.badge) + '</p>' + cta + '</li>';
  }).join('');
  var REG_CHAPTERS = M.METIERS.filter(function (m) { return m.interest; }).map(function (m) { return m.interest; });
  var regDone = false;
  function renderRegistry(interest) {
    var reg = C.state.registry || {}, p;
    if (regDone) {
      p = '<div class="confirm"><h3>Thank you, ' + esc(firstName(reg.name)) + '.</h3><p>Your name has been inscribed in the MANTHAI Private Registry.</p>' +
        '<p class="fine-print">Demonstration storefront: your entry is kept in this browser only and no message is sent.</p>' +
        '<button class="btn btn--gold btn--block" type="button" data-close>Continue</button></div>';
    } else {
      p = '<form class="panel-body" id="registryForm" novalidate>' +
        '<p class="lede lede--dark">Be among the first to see what the House builds next. Chapters are shown privately, in order, to those on the list.</p>' +
        fld('rg-name', 'Name', '<input id="rg-name" name="name" type="text" autocomplete="name" value="' + esc(reg.name || (C.state.member && C.state.member.name) || '') + '">') +
        fld('rg-contact', 'Email or WhatsApp', '<input id="rg-contact" name="contact" type="text" autocomplete="email" inputmode="email" value="' + esc(reg.contact || (C.state.member && C.state.member.email) || '') + '">') +
        fld('rg-interest', 'Chapter of interest', '<select id="rg-interest" name="interest">' + REG_CHAPTERS.map(function (c) { return '<option' + (c === interest ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select>') +
        '<button class="btn btn--gold btn--block" type="submit">Inscribe my name</button></form>';
    }
    $('#registryPanel').innerHTML = head('registryTitle', 'The Private Registry', 'Close registry') + p;
  }
  ui.openRegistry = function (interest) { regDone = false; renderRegistry(interest || REG_CHAPTERS[0]); C.open($('#layerRegistry')); };
  $('#registryPanel').addEventListener('submit', function (e) {
    if (e.target.id !== 'registryForm') return; e.preventDefault();
    var f = e.target, bad = null;
    function need(n, ok, msg) { var i = f.elements[n]; if (!ok(i.value)) { C.setError(i, msg); bad = bad || i; } else C.setError(i, ''); }
    need('name', function (v) { return v.trim().length > 1; }, 'Enter your name.');
    need('contact', function (v) { return C.validEmail(v) || C.validPhone(v); }, 'Enter an email address or a WhatsApp number.');
    if (bad) { bad.focus(); return; }
    C.state.registry = { name: f.elements.name.value.trim(), contact: f.elements.contact.value.trim(), interest: f.elements.interest.value, at: new Date().toISOString() };
    C.save(); regDone = true; renderRegistry(); $('#registryPanel').scrollTop = 0;
  });
  document.addEventListener('click', function (e) {
    var r = e.target.closest('[data-registry]'); if (r) ui.openRegistry(r.getAttribute('data-registry'));
  });

  /* ======================= init ======================= */
  /* always start at the top on load and when restored from the back/forward cache */
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
  if (!location.hash) window.scrollTo(0, 0);
  window.addEventListener('pageshow', function (e) { if (e.persisted && !location.hash) window.scrollTo(0, 0); });
  window.addEventListener('beforeunload', function () { if (!location.hash) window.scrollTo(0, 0); });

  $('#year').textContent = new Date().getFullYear();
  C.setCurrency(C.state.currency);
  C.emit('member');
  C.updateBagUI();
})();
