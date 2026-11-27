/* ==========================================================================
   MANTHAI  |  maison: navigation, layers, hero film, Private Circle, Stylist, Passport
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
    else if (k === 'occasion') M.shop.setOccasion(v, true);
    else if (k === 'seal') C.scrollTo('seal');
    else if (k === 'product') M.shop.openProduct(v);
    else if (k === 'stylist') ui.openStylist();
    else if (k === 'salon') ui.openSalon();
    else if (k === 'film') ui.openFilm();
    else if (k === 'anchor') C.scrollTo(v);
    else if (k === 'route') ui.route(v);
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
    return n.groups
      ? '<li><button class="nav-item" type="button" data-nav="' + n.key + '" aria-expanded="false" aria-controls="atelierPanel">' + esc(n.label) + '</button></li>'
      : '<li><button class="nav-item" type="button" data-go="' + esc(n.action) + '">' + esc(n.label) + '</button></li>';
  }).join('');
  function navItem(key) { return M.NAV.filter(function (n) { return n.key === key; })[0]; }
  function openPanel(key) {
    var item = navItem(key); if (!item) return;
    clearTimeout(hideT); clearTimeout(leaveT);
    if (key !== curKey) {
      $('#apTitle').textContent = item.title;
      $('#apLinks').innerHTML = item.groups.map(function (g) {
        return '<li class="ap-group"><p class="ap-group__title">' + esc(g.title) + '</p><ul>' + g.links.map(function (l) { return '<li><button type="button" data-go="' + esc(l.action) + '">' + esc(l.label) + '</button></li>'; }).join('') + '</ul></li>';
      }).join('');
      $('#apFigure').innerHTML = (item.src ? '<img src="' + esc(item.src) + '" alt="' + esc(item.image) + '" decoding="async">' : M.Art.panel(item)) + '<figcaption>' + esc(item.image) + '</figcaption>';
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
    var b = e.target.closest('[data-nav]');
    if (!b) { if (panelOpen && e.target.closest('.nav-item')) { clearTimeout(overT); overT = setTimeout(function () { closePanel(); }, 120); } return; }
    clearTimeout(overT); overT = setTimeout(function () { openPanel(b.getAttribute('data-nav')); }, 80);
  });
  navList.addEventListener('pointerout', function () { clearTimeout(overT); });
  header.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') clearTimeout(leaveT); });
  header.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'mouse' || !panelOpen) return; clearTimeout(leaveT); leaveT = setTimeout(function () { closePanel(); }, 240); });
  header.addEventListener('focusout', function (e) { if (panelOpen && e.relatedTarget && !header.contains(e.relatedTarget)) closePanel(); });
  navList.addEventListener('keydown', function (e) {
    var b = e.target.closest('.nav-item'); if (!b) return;
    if (e.key === 'ArrowDown' && b.hasAttribute('data-nav')) { e.preventDefault(); openPanel(b.getAttribute('data-nav')); var f = $('#apLinks button'); if (f) f.focus(); }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      var all = $$('.nav-item'), i = all.indexOf(b) + (e.key === 'ArrowRight' ? 1 : -1); all[(i + all.length) % all.length].focus();
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panelOpen) { var k = curKey; closePanel(); var b = $('.nav-item[data-nav="' + k + '"]'); if (b) b.focus(); }
  });
  document.addEventListener('click', function (e) {
    if (panelOpen && !header.contains(e.target)) closePanel();
  });

  /* ======================= mobile menu ======================= */
  $('#menuBody').innerHTML = M.NAV.map(function (n, i) {
    if (!n.groups) return '<div class="menu-group"><button type="button" class="menu-link" data-go="' + esc(n.action) + '">' + esc(n.label) + '</button></div>';
    return '<div class="menu-group"><button type="button" aria-expanded="false" aria-controls="mg-' + i + '">' + esc(n.label) + '</button><ul id="mg-' + i + '" hidden>' +
      n.groups.map(function (g) { return '<li class="mg-title">' + esc(g.title) + '</li>' + g.links.map(function (l) { return '<li><button type="button" data-go="' + esc(l.action) + '">' + esc(l.label) + '</button></li>'; }).join(''); }).join('') + '</ul></div>';
  }).join('') + '<div class="menu-group"><button type="button" class="menu-link" data-go="stylist">Speak with a Maison Stylist</button></div>';
  $('#menuBody').addEventListener('click', function (e) {
    var b = e.target.closest('.menu-group > button'); if (!b || b.hasAttribute('data-go')) return;
    var open = b.getAttribute('aria-expanded') === 'true';
    $$('.menu-group > button').forEach(function (x) { x.setAttribute('aria-expanded', 'false'); $('#' + x.getAttribute('aria-controls')).hidden = true; });
    if (!open) { b.setAttribute('aria-expanded', 'true'); $('#' + b.getAttribute('aria-controls')).hidden = false; }
  });
  $('#menuToggle').addEventListener('click', function () { C.open($('#layerMenu')); });

  /* ======================= search ======================= */
  var KIND_WORDS = { shirt: 'shirt blouse top silk separates charmeuse', trouser: 'trouser trousers pants wide-leg silk separates', gown: 'dress gown couture evening velvet painted', mullet: 'gown evening rosette train silk', column: 'gown evening strapless bow satin pearl', lace: 'dress lace midi velvet garnet', silkmidi: 'dress midi silk twisted asymmetric', blazer: 'jacket tailoring blazer ruffle peplum', mini: 'dress mini scarf tailored', cape: 'cape lace sheer pearl' };
  function hay(p) { return [p.name, p.short, p.summary, p.materials, p.collection, p.tabs.join(' '), (p.occasions || []).join(' '), KIND_WORDS[p.kind] || '', p.provenance, ''].join(' ').toLowerCase(); }
  var index = M.PRODUCTS.map(function (p) { return { p: p, h: hay(p) }; });
  var SUGGEST = ['gown', 'silk', 'tailoring', 'lace', 'bridal'];
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
  /* A decoder can also freeze while the element still reports "playing" (seen in Safari): play() alone does
     nothing then. After two still checks, step the playhead a frame forward to wake the decoder; if it is still
     frozen after that, reload the source and resume at the same moment. */
  var lastT = -1, frozen = 0, kicks = 0;
  function unstick() {
    var t = video.currentTime || 0, d = video.duration || 0;
    if (kicks++ < 2) {
      try { video.currentTime = d && t + 0.08 >= d ? 0 : t + 0.08; } catch (e) {}
      revive();
    } else {
      kicks = 0;
      var resume = function () { video.removeEventListener('loadedmetadata', resume); try { video.currentTime = t; } catch (e) {} revive(); };
      video.addEventListener('loadedmetadata', resume);
      try { video.load(); } catch (e) {}
    }
  }
  setInterval(function () {
    if (!shouldRun() || video.readyState < 1) { frozen = 0; lastT = -1; return; }
    if (video.paused) { revive(); lastT = video.currentTime; return; }
    if (Math.abs(video.currentTime - lastT) < 0.01) { if (++frozen >= 2) { frozen = 0; unstick(); } }
    else { frozen = 0; kicks = 0; }
    lastT = video.currentTime;
  }, 1200);
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

  /* ======================= unboxing ritual: cinematic gatefold box ======================= */
  var ub = $('#unbox'), ubCam = $('#unboxCam'), ubCap = $('#unboxCap'), boxBtn = $('#boxToggle'), playBtn = $('#boxPlay');
  var SHOTS = {
    closed:  ['I', 'High-gloss midnight navy lacquer, closed on hidden magnets.'],
    open:    ['II', 'The doors part from the centre, lined in velvet garnet.'],
    garment: ['III', 'Your piece, folded in acid-free tissue under a gold wafer.'],
    label:   ['IV', 'The woven label and its origin and size label, set under the back facing.'],
    insert:  ['V', 'Beneath the piece, a velvet insert cut to hold the Private Circle Presentation Case.'],
    elite:   ['VI', 'The Private Circle Presentation Case. Crafted to Endure.'],
    card:    ['VII', 'The black metal Verification Card. Select it to turn it over.'],
    story:   ['VIII', 'Beneath the case, cut to its exact size, the Story Card of your piece.']
  };
  var ORDER = ['closed', 'open', 'garment', 'label', 'insert', 'elite', 'card', 'story'];
  var PART_SHOT = { box: 'closed', garment: 'garment', label: 'label', elite: 'elite', card: 'card', story: 'story' };
  var moveT = 0, capT = 0, cutT = 0, chainT = 0, playT = [], playing = false;
  $('#partsList').innerHTML = M.RITUAL.map(function (r) {
    return '<li><button class="part-btn" type="button" data-part="' + r.id + '" aria-pressed="false"><span class="part-btn__name">' + esc(r.name) + '</span><span class="part-btn__spec">' + esc(r.spec) + '</span></button></li>';
  }).join('');
  $('#partDetail').textContent = 'Select a part to see what it is made of.';
  /* the woven label, the Verification Card and the Story Card are shown at screen scale: note 2 says so */
  var SCALE_NOTE = { label: 1, card: 1, story: 1 };
  function detailHTML(r) { return r ? esc(r.name + '. ' + r.text) + (SCALE_NOTE[r.id] ? C.dref(2) : '') : 'Select a part to see what it is made of.'; }
  /* The detail line changes length with every shot. Reserve the height of the longest one so the
     column never resizes, and the box beside it (centred in the same grid row) never shifts. */
  function holdDetail() {
    var d = $('#partDetail'), keep = d.innerHTML, max = 0;
    d.style.minHeight = '0px';
    ['Select a part to see what it is made of.'].concat(M.RITUAL.map(detailHTML)).forEach(function (t) { d.innerHTML = t; max = Math.max(max, d.offsetHeight); });
    d.innerHTML = keep; d.style.minHeight = max + 'px';
  }
  holdDetail();
  var hdT = 0; window.addEventListener('resize', function () { clearTimeout(hdT); hdT = setTimeout(holdDetail, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(holdDetail);
  /* Moving between the tissue layer and the Presentation Case layer is a cinematic cut:
     a short dip to black hides the swap, so no two layers ever cross in 3D. */
  var TOP = { open: 1, garment: 1, label: 1 }, CASE = { insert: 1, elite: 1, card: 1, story: 1 };
  function shot(name, opts) {
    opts = opts || {};
    var cur = ub.getAttribute('data-state');
    clearTimeout(chainT);
    if (cur === name && !opts.force) return;
    /* the Verification Card goes home and the camera settles on the case before the lid shuts and the case rises */
    if (cur === 'card' && name === 'story') { shot('elite'); chainT = setTimeout(function () { shot('story'); }, C.reduced() ? 0 : 2300); return; }
    clearTimeout(cutT); ub.classList.remove('is-swap');
    var cut = !C.reduced() && ((TOP[cur] && CASE[name]) || (CASE[cur] && (TOP[name] || name === 'closed')));
    if (!cut) { ub.classList.remove('is-cut'); apply(name); return; }
    ub.classList.add('is-cut');
    ubCap.classList.remove('is-on');
    cutT = setTimeout(function () {
      ub.classList.add('is-swap'); apply(name); void ub.offsetWidth;
      cutT = setTimeout(function () { ub.classList.remove('is-swap', 'is-cut'); }, 60);
    }, 420);
  }
  function apply(name) {
    ub.setAttribute('data-prev', ub.getAttribute('data-state') || '');
    ub.setAttribute('data-state', name);
    if (name !== 'card') ub.setAttribute('data-flip', 'false');
    var open = name !== 'closed';
    boxBtn.setAttribute('aria-pressed', String(open)); boxBtn.textContent = open ? 'Close the box' : 'Open the box';
    if (!C.reduced()) { ub.classList.add('is-moving'); clearTimeout(moveT); moveT = setTimeout(function () { ub.classList.remove('is-moving'); }, 2200); }
    ubCap.classList.remove('is-on'); clearTimeout(capT);
    capT = setTimeout(function () { var c = SHOTS[name]; ubCap.innerHTML = '<b>' + c[0] + '</b>' + esc(c[1]); ubCap.classList.add('is-on'); }, C.reduced() ? 0 : 700);
    var part = { closed: 'box', garment: 'garment', label: 'label', insert: 'elite', elite: 'elite', card: 'card', story: 'story' }[name];
    $$('.part-btn').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-part') === part)); });
    var r = part && M.RITUAL.filter(function (x) { return x.id === part; })[0];
    $('#partDetail').innerHTML = detailHTML(r);
  }
  function stopPlay() { playing = false; rewinding = false; playT.forEach(clearTimeout); playT = []; playBtn.textContent = 'Play the ritual'; }
  /* Closing never jumps: the film runs backwards, one shot at a time, from wherever the viewer is,
     until the doors meet again. */
  var PREV = { story: 'elite', card: 'elite', elite: 'insert', insert: 'label', label: 'garment', garment: 'open', open: 'closed' };
  var rewinding = false;
  function rewind() {
    var st = ub.getAttribute('data-state');
    if (st === 'closed' || rewinding) return;
    stopPlay(); rewinding = true;
    var t = 0, steps = [];
    if (st === 'card' && ub.getAttribute('data-flip') === 'true') { steps.push(['flip', 0]); t = 1300; }
    var cur = st;
    while (PREV[cur]) {
      var nx = PREV[cur], crossing = (TOP[cur] && CASE[nx]) || (CASE[cur] && TOP[nx]);
      steps.push([nx, t]);
      t += C.reduced() ? 900 : (crossing ? 2300 : nx === 'open' ? 1900 : 1700);
      cur = nx;
    }
    steps.forEach(function (s, i) {
      playT.push(setTimeout(function () {
        if (s[0] === 'flip') ub.setAttribute('data-flip', 'false'); else shot(s[0]);
        if (i === steps.length - 1) { rewinding = false; playT = []; }
      }, s[1]));
    });
  }
  function play() {
    if (playing) { stopPlay(); return; }
    playing = true; playBtn.textContent = 'Stop';
    var seq = [['closed', 0], ['open', 1600], ['garment', 5000], ['label', 8400], ['insert', 12000], ['elite', 15600], ['card', 19200], ['flip', 22800], ['story', 26000], ['elite', 34500]];
    if (C.reduced()) seq = seq.map(function (s, i) { return [s[0], i * 2600]; });
    seq.forEach(function (s, i) {
      playT.push(setTimeout(function () {
        if (s[0] === 'flip') ub.setAttribute('data-flip', 'true'); else shot(s[0], { force: i === 0 });
        if (i === seq.length - 1) stopPlay();
      }, s[1]));
    });
  }
  /* on a phone the list sits below the box: bring the box back into view so the camera move is seen */
  function frameBox() {
    var r = ub.getBoundingClientRect(); if (r.top >= 56 && r.bottom <= window.innerHeight) return;
    var top = r.top + window.scrollY - Math.max(64, (window.innerHeight - r.height) / 2);
    if (C.lenis) C.lenis.scrollTo(top, { immediate: C.reduced(), duration: 1 }); else window.scrollTo({ top: top, behavior: C.reduced() ? 'auto' : 'smooth' });
  }
  $('#partsList').addEventListener('click', function (e) { var b = e.target.closest('[data-part]'); if (b) { stopPlay(); frameBox(); shot(PART_SHOT[b.getAttribute('data-part')]); } });
  ub.addEventListener('click', function (e) {
    stopPlay();
    var h = e.target.closest('[data-hit]'), st = ub.getAttribute('data-state'), k = h && h.getAttribute('data-hit');
    if (st === 'closed') { shot('open'); return; }
    if (st === 'story') { shot('elite'); return; }
    if (k === 'story') { shot('story'); return; }
    if (k === 'vcard') { if (st === 'card') ub.setAttribute('data-flip', String(ub.getAttribute('data-flip') !== 'true')); else shot(st === 'elite' ? 'card' : 'elite'); return; }
    if (k === 'case') { shot(st === 'elite' ? 'card' : 'elite'); return; }
    if (k === 'label') { shot('label'); return; }
    if (k === 'garment') { shot(st === 'garment' || st === 'label' ? 'insert' : 'garment'); return; }
    shot(st === 'open' ? 'closed' : 'open');
  });
  ub.setAttribute('tabindex', '0'); ub.setAttribute('role', 'img'); ub.setAttribute('aria-describedby', 'unboxDesc');
  ub.setAttribute('aria-label', 'Interactive MANTHAI box. Use the arrow keys, the list of parts or the buttons below to move the camera.');
  ub.addEventListener('keydown', function (e) {
    var i = ORDER.indexOf(ub.getAttribute('data-state'));
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (i === 0) { stopPlay(); shot('open'); } else rewind(); }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); stopPlay(); shot(ORDER[Math.min(i + 1, ORDER.length - 1)]); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); stopPlay(); shot(ORDER[Math.max(i - 1, 0)]); }
  });
  boxBtn.addEventListener('click', function () { var st = ub.getAttribute('data-state'); if (st === 'closed') { stopPlay(); shot('open'); } else rewind(); });
  playBtn.addEventListener('click', function () { if (!playing) frameBox(); play(); });
  /* a gentle hand-held drift that follows the pointer */
  if (!C.reduced() && window.matchMedia('(hover: hover)').matches) {
    ub.addEventListener('pointermove', function (e) {
      var r = ub.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      ubCam.style.setProperty('--px', (x * 6).toFixed(2) + 'deg'); ubCam.style.setProperty('--py', (y * -4).toFixed(2) + 'deg');
    });
    ub.addEventListener('pointerleave', function () { ubCam.style.setProperty('--px', '0deg'); ubCam.style.setProperty('--py', '0deg'); });
  }
  /* the first time the ritual comes into view, the doors open on their own */
  shot('closed', { force: true });
  if ('IntersectionObserver' in window) {
    var ubIO = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { ubIO.disconnect(); setTimeout(function () { if (!playing && ub.getAttribute('data-state') === 'closed') shot('open'); }, C.reduced() ? 0 : 900); }
    }, { threshold: .55 });
    ubIO.observe(ub);
  }

  /* ======================= the hidden Sun & Moon cipher ======================= */
  (function () {
    var sec = $('#cipher'), btn = $('#cipherBtn'), status = $('#cipherStatus');
    if (!sec || !btn) return;
    function set(open) {
      sec.setAttribute('data-state', open ? 'revealed' : 'concealed');
      sec.removeAttribute('data-focus');
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? 'Conceal the Cipher' : 'Discover the Hidden Sun & Moon Cipher';
      status.textContent = open ? 'Cipher revealed. The first A: a rising solar horizon. The H: a lunar crescent cradling a solar orb. The second A: a waxing lunar crescent. Enduring as the Sun and Moon.' : 'Cipher concealed.';
    }
    btn.addEventListener('click', function () { set(sec.getAttribute('data-state') !== 'revealed'); });
    /* hovering or focusing a caption (or its letter) lights that stroke alone */
    function focusOn(k) { if (sec.getAttribute('data-state') !== 'revealed') return; if (k) sec.setAttribute('data-focus', k); else sec.removeAttribute('data-focus'); }
    sec.addEventListener('pointerover', function (e) { var t = e.target.closest('[data-c]'); focusOn(t && t.getAttribute('data-c')); });
    sec.addEventListener('pointerleave', function () { focusOn(null); });
    sec.addEventListener('focusin', function (e) { var t = e.target.closest('.cipher__note'); focusOn(t && t.getAttribute('data-c')); });
    sec.addEventListener('focusout', function () { focusOn(null); });
    /* tapping a letter on the wordmark reveals the cipher */
    $('.cipher__svg', sec).addEventListener('click', function () { if (sec.getAttribute('data-state') !== 'revealed') set(true); });
    /* the first time the wordmark comes into view, one faint pass of light hints that something is hidden */
    if ('IntersectionObserver' in window && !C.reduced()) {
      var io = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return; io.disconnect();
        setTimeout(function () { if (sec.getAttribute('data-state') === 'concealed') { sec.classList.add('is-hint'); setTimeout(function () { sec.classList.remove('is-hint'); }, 2500); } }, 700);
      }, { threshold: .5 });
      io.observe($('.cipher__svg', sec));
    }
  })();

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
  var SLOTS = ['10:00', '12:00', '15:00', '17:00'], TOPICS = ['Occasion & Wardrobe Styling', 'Size & Silhouette Guidance', 'Private Gift Curation', 'Garment Care & Exchange Support'];
  var FORMATS = ['Video styling appointment', 'In person at the Colombo atelier', 'WhatsApp call'];
  function renderStylist(pid, topic) {
    var p = pid && C.product(pid), s = C.state.stylist || {}, mem = C.state.member || {};
    if (topic) s = Object.assign({}, s, { topic: topic });
    var msg = p ? 'Good day, I would like to speak with a Maison Stylist about the ' + p.short + '.' : 'Good day, I would like to speak with a Maison Stylist.';
    var body;
    if (styView === 'done' && s.ref) {
      body = '<div class="confirm"><h3>Thank you, ' + esc(firstName(s.name)) + '.</h3><p class="order-ref" aria-label="Request reference">' + esc(s.ref) + '</p>' +
        '<p>Your request for a ' + esc((s.format || FORMATS[0]).toLowerCase()) + ' on ' + esc(fmtDate(s.date)) + ' at ' + esc(s.time) + ' (Colombo time) is with the atelier. A stylist confirms the appointment by email within one working day.</p>' +
        '<p class="fine-print">Demonstration storefront: no email was sent.</p>' +
        '<div class="choices"><button class="btn btn--gold btn--block" type="button" data-ics>Add to calendar</button><a class="btn btn--ghost btn--block" href="' + waLink(msg) + '" target="_blank" rel="noopener">Message on WhatsApp</a></div>' +
        '<button class="link-btn" type="button" data-again>Request another time</button></div>';
    } else {
      body = '<form class="panel-body" id="stylistForm" novalidate>' +
        '<p class="lede lede--dark">A private conversation with someone who knows the atelier: fit, styling for an occasion, or anything you would ask in Colombo. A person answers, never a bot.</p>' +
        (p ? '<div class="notice"><strong>About:</strong> ' + esc(p.short) + '</div>' : '') +
        '<a class="btn btn--ghost btn--block" href="' + waLink(msg) + '" target="_blank" rel="noopener">Message on WhatsApp now</a>' +
        '<p class="sep">or book a time</p>' +
        fld('st-name', 'Full name', '<input id="st-name" name="name" type="text" autocomplete="name" value="' + esc(s.name || mem.name || '') + '">') +
        fld('st-email', 'Email', '<input id="st-email" name="email" type="email" autocomplete="email" inputmode="email" value="' + esc(s.email || mem.email || '') + '">') +
        fld('st-format', 'Appointment', '<select id="st-format" name="format">' + FORMATS.map(function (t) { return '<option' + (s.format === t ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select>') +
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
    C.state.stylist = { ref: C.uid('STY'), name: f.elements.name.value.trim(), email: f.elements.email.value.trim(), format: f.elements.format.value, topic: f.elements.topic.value, date: f.elements.date.value, time: f.elements.time.value, note: f.elements.note.value.trim(), at: new Date().toISOString() };
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
  ui.openPassport = function (pid, code) {
    var hit = code && findItem(code), p = (hit && C.product(hit.it.id)) || (pid && C.product(pid)) || M.PRODUCTS[0];
    var id = code || ('MNT-' + hash(p.id)), n = pieceNo(p) + (hit ? hit.ordinal : 0);
    var owner = hit ? (C.state.member ? 'Registered to ' + (C.state.member.name || 'you') : 'Registered to ' + hit.o.name) : 'Unclaimed. Registers to the first owner.';
    var sample = !hit;
    var steward = hit ? 'Registered. Eligible for complimentary care guidance and transfer of ownership.' : 'Eligible for complimentary care guidance and the 14-day size exchange.';
    /* A museum provenance certificate: plate, crest and ID on the left, the record on the right. Opens straight away, never behind a scanner. */
    $('#passportPanel').innerHTML = head('passportTitle', 'Digital Product Passport', 'Close passport') +
      '<div class="cert">' +
        '<div class="cert__side">' +
          '<div class="cert__plate">' + C.plateHTML(p, 'form') + '</div>' +
          '<svg class="cert__crest" viewBox="0 0 1000 860" aria-hidden="true"><use href="#spiral-seal"/></svg>' +
          '<p class="cert__id"><span>Passport ID</span><b class="order-ref">' + esc(id) + '</b></p>' +
          '<p class="cert__ok"><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>Verified Authentic</p>' +
        '</div>' +
        '<div class="cert__main">' +
          '<p class="cert__k">Museum Provenance Certificate<span class="cert__scale">Simulated preview, not shown at 1:1 scale' + C.dref(2) + '</span></p>' +
          '<dl class="cert__table">' +
            '<div><dt>Piece</dt><dd>' + esc(p.name) + '</dd></div>' +
            '<div><dt>Edition number</dt><dd>' + (p.edition ? 'Piece ' + pad(n) + ' of ' + p.edition : 'Atelier series') + '</dd></div>' +
            '<div><dt>Fibre composition</dt><dd>' + esc(p.materials) + '</dd></div>' +
            '<div><dt>Craft origin</dt><dd>' + esc(p.provenance) + '</dd></div>' +
            '<div><dt>Garment care</dt><dd>' + esc(p.care) + '</dd></div>' +
            '<div><dt>Owner</dt><dd>' + esc(owner) + '</dd></div>' +
            '<div><dt>Stewardship status</dt><dd>' + esc(steward) + '</dd></div>' +
          '</dl>' +
          '<p class="cert__note">Every piece carries an NFC tag in its woven label and on its Verification Card. Hold a phone to either, or scan the card, and this record opens.</p>' +
          (sample ? '<p class="cert__note">A sample certificate for the ' + esc(p.short) + '. Certificates for your own pieces appear in your Private Circle after you order.</p>' : '') +
        '</div>' +
      '</div>';
    C.open($('#layerPassport'));
  };

  /* ======================= Private Circle ======================= */
  var salonView = 'in', salonEmail = '', pendingCb = null, salonMsg = '';
  /* An account is created the first time an email signs in (Google or private link) and found again afterwards.
     Accounts are kept in this browser; a database is needed to share them across devices (see README). */
  function signIn(m, provider) {
    var key = String(m.email).trim().toLowerCase(), now = new Date().toISOString();
    var accts = C.state.accounts || (C.state.accounts = {}), a = accts[key], isNew = !a;
    if (isNew) a = accts[key] = { id: 'MNT-' + hash(key + (m.sub || '')), email: key, name: m.name || nameFromEmail(key), picture: m.picture || '', provider: provider || 'email', createdAt: now };
    else { if (m.name) a.name = m.name; if (m.picture) a.picture = m.picture; if (provider === 'google') a.provider = 'google'; }
    a.lastLogin = now;
    C.state.member = { id: a.id, email: a.email, name: a.name, picture: a.picture, provider: a.provider, since: a.createdAt };
    C.save(); C.emit('member');
    return isNew;
  }
  function welcomeToast(isNew) { C.toast(isNew ? 'Your Private Circle profile has been created. Welcome to the House.' : 'Welcome back to the Private Circle.'); }
  C.on('member', function () {
    var b = $('#salonBtn'), m = C.state.member;
    b.classList.toggle('is-member', !!m);
    b.setAttribute('aria-label', m ? 'Private Circle, signed in as ' + m.name : 'Private Circle account');
  });
  function gIcon() { return '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M12 12h8M20 12a8 8 0 01-2.4 5.7" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>'; }
  function renderSalon() {
    var m = C.state.member, h;
    /* once signed in, the Private Circle is the full page at /account, never a modal */
    if (m) { var sl = $('#layerSalon'); if (sl.open) { C.close(sl); later(function () { if (curRoute() !== 'account') ui.route('account'); }); } return; }
    else if (salonView === 'sent' && fbReady()) {
      h = head('salonTitle', 'Check your inbox', 'Close Private Circle') + '<div class="panel-body"><p>We have sent a private link to <strong>' + esc(salonEmail) + '</strong>. Open it on this device to enter the Private Circle.</p>' +
        '<p class="fine-print">Nothing yet? Look in your spam or promotions folder. The link works once and expires soon.</p>' +
        '<button class="link-btn" type="button" data-back>Use a different email</button></div>';
    } else if (salonView === 'confirm') {
      h = head('salonTitle', 'Confirm your email', 'Close Private Circle') + '<form class="panel-body" id="confirmForm" novalidate>' +
        '<p class="lede lede--dark">You opened your private link on a different device. Enter the email address it was sent to.</p>' +
        fld('c-email', 'Email', '<input id="c-email" name="email" type="email" autocomplete="email" inputmode="email">') +
        '<button class="btn btn--gold btn--block" type="submit">Open my Private Circle</button></form>';
    } else if (salonView === 'sent') {
      h = head('salonTitle', 'Check your inbox', 'Close Private Circle') + '<div class="panel-body"><p>A private link would be sent to <strong>' + esc(salonEmail) + '</strong>.</p>' +
        '<p class="notice"><strong>Demonstration.</strong> This storefront has no mail server, so no email is sent. Continue to enter your Private Circle.</p>' +
        '<button class="btn btn--gold btn--block" type="button" data-enter>Open my Private Circle</button><button class="link-btn" type="button" data-back>Use a different email</button></div>';
    } else if (salonView === 'google') {
      h = M.CONFIG.googleClientId
        ? head('salonTitle', 'Continue with Google', 'Close Private Circle') + '<div class="panel-body">' +
          '<p class="lede lede--dark">Choose your Google account. If you are new to MANTHAI, your account is created for you.</p>' +
          '<div id="gsiSlot" class="gsi-slot" aria-live="polite"><p class="fine-print">Loading Google sign-in&hellip;</p></div>' +
          '<button class="link-btn" type="button" data-back>Use email instead</button></div>'
        : head('salonTitle', 'Continue with Google', 'Close Private Circle') + '<form class="panel-body" id="googleForm" novalidate>' +
          '<p class="notice"><strong>Demonstration account chooser.</strong> Add a Google client ID in <code>assets/js/catalog.js</code> to use real Google sign-in.</p>' +
          fld('g-name', 'Name', '<input id="g-name" name="name" type="text" autocomplete="name">') +
          fld('g-email', 'Google email', '<input id="g-email" name="email" type="email" autocomplete="email" inputmode="email">') +
          '<button class="btn btn--gold btn--block" type="submit">Continue</button><button class="link-btn" type="button" data-back>Back</button></form>';
    } else {
      h = head('salonTitle', 'The Private Circle', 'Close Private Circle') + '<div class="panel-body">' +
        '<p class="lede lede--dark">A private room for clients of the House: your wardrobe and its authenticity records, saved silhouettes, delivery addresses and your Maison Stylist, in one place.</p>' +
        (salonMsg ? '<p class="notice" role="alert">' + esc(salonMsg) + '</p>' : '') +
        '<button class="google-btn" type="button" data-google>' + gIcon() + ' Continue with Google</button>' +
        '<p class="sep">or by email</p>' +
        '<form id="salonForm" novalidate class="salon-form">' + fld('s-email', 'Email', '<input id="s-email" name="email" type="email" autocomplete="email" inputmode="email" placeholder="name@example.com">') +
        '<button class="btn btn--gold btn--block" type="submit">Send me a private link</button></form>' +
        '<p class="fine-print">No password needed. You never need an account to acquire a piece.</p></div>';
    }
    $('#salonPanel').innerHTML = h;
    salonMsg = '';
    if (!m && salonView === 'google' && M.CONFIG.googleClientId) mountGoogle();
  }
  /* one-click activation from the order confirmation: a private sign-in link to the order email */
  ui.sendCircleLink = function (email) {
    salonEmail = email;
    var l = $('#layerSalon');
    if (fbReady()) { salonView = 'in'; renderSalon(); if (!l.open) C.open(l); fbSendLink(email); }
    else { salonView = 'sent'; renderSalon(); if (!l.open) C.open(l); }
  };
  ui.openSignInModal = function () { salonView = 'in'; renderSalon(); C.open($('#layerSalon')); if (fbReady()) fbLoad().catch(noop); };
  ui.openSalon = function (tab) { ui.route('account', null, true, tab || 'overview'); };
  ui.signOut = function () { if (FB && C.state.member && C.state.member.fb) FB.A.signOut(FB.auth).catch(noop); C.state.member = null; C.save(); C.emit('member'); salonView = 'in'; C.toast('You have left the Private Circle on this device.'); };
  ui.sendLink = function (email) {
    salonEmail = email;
    if (fbReady()) { salonView = 'in'; fbSendLink(email); var l = $('#layerSalon'); if (!l.open) { renderSalon(); C.open(l); } }
    else { salonView = 'sent'; renderSalon(); C.open($('#layerSalon')); }
  };
  var salonPanel = $('#salonPanel');
  salonPanel.addEventListener('click', function (e) {
    var t;
    if (e.target.closest('[data-google]')) { if (fbReady()) { pendingCb = null; fbGoogle(); } else ui.googleSignIn(null); return; }
    if (e.target.closest('[data-back]')) { salonView = 'in'; renderSalon(); return; }
    if (e.target.closest('[data-enter]')) { var nw = signIn({ email: salonEmail }, 'email'); renderSalon(); welcomeToast(nw); return; }
    if (e.target.closest('[data-signout]')) { if (FB && C.state.member && C.state.member.fb) FB.A.signOut(FB.auth).catch(noop); C.state.member = null; C.save(); C.emit('member'); salonView = 'in'; renderSalon(); C.toast('You have left the Private Circle on this device.'); return; }
    if ((t = e.target.closest('[data-unwish]'))) { M.shop.toggleWish(t.getAttribute('data-unwish')); renderSalon(); return; }
    if (e.target.closest('[data-stylist-open]')) { ui.openStylist(); return; }
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
      salonEmail = i.value.trim();
      if (fbReady()) { var sb = e.target.querySelector('button[type=submit]'); if (sb) { sb.disabled = true; sb.textContent = 'Sending\u2026'; } fbSendLink(salonEmail); return; }
      salonView = 'sent'; renderSalon();
    } else if (e.target.id === 'confirmForm') {
      var ci = e.target.elements.email;
      if (!C.validEmail(ci.value)) { C.setError(ci, 'Enter the email address the link was sent to.'); ci.focus(); return; }
      fbFinishLink(ci.value.trim());
    } else if (e.target.id === 'googleForm') {
      var f = e.target, em = f.elements.email, nm = f.elements.name;
      if (!C.validEmail(em.value)) { C.setError(em, 'Enter the Google email you would like to use.'); em.focus(); return; }
      var mem = { email: em.value.trim(), name: nm.value.trim() || nameFromEmail(em.value) };
      var nw2 = signIn(mem, 'google'); var cb = pendingCb; pendingCb = null;
      if (cb) { C.close($('#layerSalon')); later(function () { cb(C.state.member); }); } else renderSalon();
      welcomeToast(nw2);
    }
  });
  C.on('close', function (d) { if (d.id === 'layerSalon') pendingCb = null; });
  C.on('bag', noop);

  /* ======================= Firebase Authentication ======================= */
  /* Google and email-link sign-in with real accounts, kept in the Firebase project. The SDK loads on demand from Google's CDN. */
  var FB = null, fbP = null;
  function fbReady() { var c = M.CONFIG.firebase; return !!(c && c.apiKey && c.projectId); }
  function fbLoad() {
    if (fbP) return fbP;
    var base = 'https://www.gstatic.com/firebasejs/13.4.0/';
    fbP = Promise.all([import(base + 'firebase-app.js'), import(base + 'firebase-auth.js')]).then(function (m) {
      var A = m[1], auth = A.getAuth(m[0].initializeApp(M.CONFIG.firebase));
      FB = { A: A, auth: auth };
      A.onAuthStateChanged(auth, fbSync);
      return FB;
    }).catch(function (e) { fbP = null; throw e; });
    return fbP;
  }
  function fbSync(u) {
    var cur = C.state.member;
    if (u) {
      var g = (u.providerData || []).some(function (p) { return p.providerId === 'google.com'; });
      var created = u.metadata && u.metadata.creationTime ? new Date(u.metadata.creationTime).toISOString() : new Date().toISOString();
      C.state.member = { id: 'MNT-' + String(u.uid).slice(0, 7).toUpperCase(), uid: u.uid, fb: true, email: u.email || '', name: u.displayName || nameFromEmail(u.email || 'guest'), picture: u.photoURL || '', provider: g ? 'google' : 'email', since: created };
      C.save(); C.emit('member');
      if ($('#layerSalon').open) renderSalon();
    } else if (cur && cur.fb) {
      C.state.member = null; C.save(); C.emit('member');
      if ($('#layerSalon').open) renderSalon();
    }
  }
  var FB_ERR = {
    'auth/unauthorized-domain': 'This web address is not authorised for sign-in yet. Add it under Firebase, Authentication, Settings, Authorized domains.',
    'auth/popup-blocked': 'Your browser blocked the Google window. Allow pop-ups for this site and try again.',
    'auth/network-request-failed': 'Network problem. Check your connection and try again.',
    'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
    'auth/invalid-email': 'Enter a valid email address, such as name@example.com.',
    'auth/operation-not-allowed': 'This sign-in method is not switched on yet.',
    'auth/expired-action-code': 'That link has expired. Request a new one.',
    'auth/invalid-action-code': 'That link is no longer valid. Request a new one.',
    'auth/quota-exceeded': 'We cannot send more sign-in emails right now. Please try again later or use Google.'
  };
  function fbFail(e) {
    var code = (e && e.code) || '';
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return;
    salonMsg = FB_ERR[code] || 'Sign-in did not complete. Please try again.';
    if (window.console) console.warn('[MANTHAI sign-in]', code || e);
    salonView = 'in'; renderSalon();
    if (!$('#layerSalon').open) C.open($('#layerSalon'));
  }
  function fbDone(res) {
    var info = FB.A.getAdditionalUserInfo(res), isNew = !!(info && info.isNewUser);
    fbSync(res.user);
    var cb = pendingCb; pendingCb = null; salonView = 'in';
    if (cb) { C.close($('#layerSalon')); later(function () { cb(C.state.member); }); }
    else { renderSalon(); if (!$('#layerSalon').open) C.open($('#layerSalon')); }
    welcomeToast(isNew);
  }
  function fbGoogle() {
    function go() { var p = new FB.A.GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' }); return FB.A.signInWithPopup(FB.auth, p).then(fbDone).catch(fbFail); }
    if (FB) go(); else fbLoad().then(go).catch(fbFail);
  }
  function fbSendLink(email) {
    function go() {
      return FB.A.sendSignInLinkToEmail(FB.auth, email, { url: location.origin + '/', handleCodeInApp: true }).then(function () {
        try { window.localStorage.setItem('manthai.emailForSignIn', email); } catch (e) { /* ignore */ }
        salonEmail = email; salonView = 'sent'; renderSalon();
      }).catch(fbFail);
    }
    if (FB) go(); else fbLoad().then(go).catch(fbFail);
  }
  function fbFinishLink(email) {
    FB.A.signInWithEmailLink(FB.auth, email, location.href).then(function (res) {
      try { window.localStorage.removeItem('manthai.emailForSignIn'); } catch (e) { /* ignore */ }
      try { history.replaceState(null, '', location.pathname); } catch (e) { /* ignore */ }
      fbDone(res);
    }).catch(fbFail);
  }
  function fbInit() {
    if (!fbReady()) return;
    if (/[?&]oobCode=/.test(location.search) && /[?&]mode=signIn/.test(location.search)) {
      fbLoad().then(function () {
        if (!FB.A.isSignInWithEmailLink(FB.auth, location.href)) return;
        var email = ''; try { email = window.localStorage.getItem('manthai.emailForSignIn') || ''; } catch (e) { /* ignore */ }
        if (email) fbFinishLink(email); else { salonView = 'confirm'; renderSalon(); C.open($('#layerSalon')); }
      }).catch(fbFail);
    } else if (C.state.member && C.state.member.fb) fbLoad().catch(noop);
  }

  /* Google sign-in: the official Google button (Google Identity Services) rendered inside the Salon panel.
     It opens Google's own account chooser, so it does not depend on One Tap, which browsers often suppress. */
  var gsiState = 'idle', gsiInit = false;
  function decodeJwt(t) {
    var b = t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'); while (b.length % 4) b += '=';
    return JSON.parse(decodeURIComponent(Array.prototype.map.call(atob(b), function (c) { return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2); }).join('')));
  }
  function gsiFail(msg, title) {
    var slot = $('#gsiSlot'); if (!slot) return;
    slot.innerHTML = '<p class="notice"><strong>' + (title || 'Google sign-in is unavailable here.') + '</strong> ' + esc(msg) + '</p>';
  }
  function onGoogle(r) {
    var j;
    try { j = decodeJwt(r.credential); } catch (err) { gsiFail('Google returned a response we could not read. Please try again.', 'Sign-in did not complete.'); return; }
    var okIss = j.iss === 'https://accounts.google.com' || j.iss === 'accounts.google.com';
    if (!okIss || j.aud !== M.CONFIG.googleClientId || (j.exp && j.exp * 1000 < Date.now() - 60000) || !j.email || j.email_verified === false) { gsiFail('That Google response could not be verified. Please try again.', 'Sign-in did not complete.'); return; }
    var isNew = signIn({ email: j.email, name: j.name || j.given_name, picture: j.picture, sub: j.sub }, 'google');
    var cb = pendingCb; pendingCb = null;
    if (cb) { C.close($('#layerSalon')); later(function () { cb(C.state.member); }); } else if ($('#layerSalon').open) renderSalon();
    welcomeToast(isNew);
  }
  function drawGoogle() {
    var slot = $('#gsiSlot'); if (!slot || !(window.google && window.google.accounts && window.google.accounts.id)) return;
    try {
      if (!gsiInit) { window.google.accounts.id.initialize({ client_id: M.CONFIG.googleClientId, callback: onGoogle, auto_select: false, cancel_on_tap_outside: true, ux_mode: 'popup' }); gsiInit = true; }
      slot.innerHTML = '';
      window.google.accounts.id.renderButton(slot, { type: 'standard', theme: 'filled_black', size: 'large', text: 'continue_with', shape: 'rectangular', logo_alignment: 'left', width: Math.min(340, Math.max(220, (slot.clientWidth || 320))), locale: 'en' });
    } catch (err) { gsiFail('Please use the email option instead.'); }
  }
  function mountGoogle() {
    if (window.google && window.google.accounts && window.google.accounts.id) { drawGoogle(); return; }
    if (gsiState === 'loading') return;
    if (gsiState === 'failed') gsiState = 'idle';
    gsiState = 'loading';
    var s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.defer = true;
    s.onload = function () { gsiState = 'ready'; drawGoogle(); };
    s.onerror = function () { gsiState = 'failed'; s.remove(); gsiFail('The Google script could not be loaded on this connection. Please use the email option instead.'); };
    document.head.appendChild(s);
    setTimeout(function () { if (gsiState === 'loading') { gsiState = 'failed'; gsiFail('Google did not respond. Please check your connection or use the email option instead.'); } }, 8000);
  }
  ui.googleSignIn = function (cb) {
    if (fbReady()) { pendingCb = cb || null; fbGoogle(); return; }
    pendingCb = cb || null; salonView = 'google'; renderSalon();
    var l = $('#layerSalon'); if (!l.open) C.open(l);
  };


  /* ======================= routes: the home shell and /the-maison ======================= */
  /* One document, two views. Sections carry data-view; html[data-route] hides the other view.
     Vercel rewrites /the-maison to this file, so the address is shareable and survives a reload. */
  var desc = document.querySelector('meta[name="description"]'), ogUrl = document.querySelector('meta[property="og:url"]'), ogTitle = document.querySelector('meta[property="og:title"]');
  var ROUTES = { home: { path: '/', title: document.title, desc: desc && desc.content, og: ogTitle && ogTitle.content },
                 maison: { path: '/the-maison', title: 'The Maison | House of MANTHAI, Colombo', og: 'The Maison | House of MANTHAI',
                   desc: 'The Maison of MANTHAI: the Colombo atelier, the Unbounded Spiral Seal, and the unboxing ritual of every piece, from the lacquered gatefold box to the Private Circle Presentation Case and its Verification Card.' } };
  ROUTES.piece = { path: '/pieces/' };
  ROUTES.checkout = { path: '/checkout', title: 'Secure Acquisition | House of MANTHAI', og: 'Secure Acquisition | House of MANTHAI', desc: 'Complete your acquisition from House of MANTHAI, with complimentary insured delivery across Sri Lanka.' };
  ROUTES.confirmed = { path: '/checkout/confirmed', title: 'Acquisition Confirmed | House of MANTHAI', og: 'Acquisition Confirmed | House of MANTHAI', desc: 'Your Digital Acquisition Record from House of MANTHAI.' };
  ROUTES.account = { path: '/account', title: 'Private Circle | House of MANTHAI', og: 'Private Circle | House of MANTHAI', desc: 'The Private Circle of House of MANTHAI: your acquisitions, Digital Vault, saved silhouettes, addresses and Colombo stylist concierge.' };
  ROUTES.legal = { path: '/legal/' };
  var LEGAL_DOCS = ['terms', 'shipping-exchanges', 'privacy', 'authenticity'];
  function docFromPath(p) { var m = /\/legal\/([a-z-]+)\/?$/.exec(p || location.pathname); return m && LEGAL_DOCS.indexOf(m[1]) > -1 ? m[1] : null; }
  var ACCOUNT_TABS = ['overview', 'orders', 'vault', 'saved', 'profile', 'concierge'];
  function tabFromPath(p) { var m = /\/account(?:\/([a-z-]+))?\/?$/.exec(p || location.pathname); return m ? (ACCOUNT_TABS.indexOf(m[1]) > -1 ? m[1] : 'overview') : null; }
  var robots = document.querySelector('meta[name="robots"]'), robotsBase = robots && robots.content;
  var canon = document.querySelector('link[rel="canonical"]'), curSlug = null;
  function slugFromPath(p) { var m = /\/pieces\/([a-z0-9-]+)\/?$/.exec(p || location.pathname); return m && C.product(m[1]) ? m[1] : null; }
  function routeFromPath(p) { p = p || location.pathname; return /\/the-maison\/?$/.test(p) ? 'maison' : /\/checkout\/confirmed\/?$/.test(p) ? 'confirmed' : /\/checkout\/?$/.test(p) ? 'checkout' : docFromPath(p) ? 'legal' : tabFromPath(p) ? 'account' : slugFromPath(p) ? 'piece' : 'home'; }
  function curRoute() { return document.documentElement.getAttribute('data-route') || 'home'; }
  function pathFor(name, slug) { return name === 'piece' ? '/pieces/' + slug : name === 'legal' ? '/legal/' + slug : name === 'account' ? '/account' + (slug && slug !== 'overview' ? '/' + slug : '') : (ROUTES[name] || ROUTES.home).path; }
  function slugFor(name, p) { return name === 'account' ? tabFromPath(p) : name === 'legal' ? docFromPath(p) : slugFromPath(p); }
  function applyRoute(name, slug) {
    var r = ROUTES[name] || ROUTES.home, title = r.title, d = r.desc, og = r.og;
    if (name === 'piece') {
      var p = C.product(slug); curSlug = slug;
      title = p.name + ' | House of MANTHAI'; og = p.name + ' | House of MANTHAI'; d = p.name + '. ' + p.summary + ' ' + C.price(p.price) + ', complimentary insured delivery across Sri Lanka.';
      M.shop.renderPiece(slug);
    } else if (name === 'legal') {
      var L = M.legal.render(slug); curSlug = slug;
      title = L.title + ' | House of MANTHAI'; og = title; d = L.desc;
    } else if (name === 'account') { slug = ACCOUNT_TABS.indexOf(slug) > -1 ? slug : 'overview'; curSlug = slug; if (M.account) M.account.render(slug); }
    else curSlug = null;
    /* an empty bag has nothing to acquire, and a record needs an order: both fall back to the home shell */
    if ((name === 'checkout' && !M.shop.renderCheckoutPage()) || (name === 'confirmed' && !M.shop.renderConfirmed())) {
      name = 'home'; r = ROUTES.home; title = r.title; d = r.desc; og = r.og;
      try { history.replaceState({ route: 'home', slug: null }, '', '/'); } catch (e) { /* file:// */ }
    }
    if (robots) robots.content = name === 'checkout' || name === 'confirmed' || name === 'account' ? 'noindex, nofollow' : robotsBase;
    document.documentElement.setAttribute('data-route', name);
    document.title = title;
    if (canon) canon.href = 'https://manthai.vercel.app' + pathFor(name, slug);
    if (ogUrl) ogUrl.content = 'https://manthai.vercel.app' + pathFor(name, slug);
    if (desc && d) desc.content = d;
    if (ogTitle && og) ogTitle.content = og;
    C.emit('route', name);
  }
  function scrollTopNow() { if (C.lenis) C.lenis.scrollTo(0, { immediate: true }); window.scrollTo(0, 0); }
  ui.route = function (name, target, push, slug) {
    if (!ROUTES[name] || (name === 'piece' && !C.product(slug)) || (name === 'legal' && LEGAL_DOCS.indexOf(slug) < 0)) name = 'home';
    if (name === 'account' && ACCOUNT_TABS.indexOf(slug) < 0) slug = 'overview';
    var same = name === curRoute() && ((name !== 'piece' && name !== 'account' && name !== 'legal') || slug === curSlug);
    var finish = function () {
      if (target && document.getElementById(target)) C.scrollTo(target); else if (!same) scrollTopNow();
    };
    if (same) { if (target) C.scrollTo(target); else window.scrollTo({ top: 0, behavior: C.reduced() ? 'auto' : 'smooth' }); return; }
    if (push === 'replace') { try { history.replaceState({ route: name, slug: slug || null }, '', pathFor(name, slug)); } catch (e) { /* file:// */ } }
    else if (push !== false) { try { history.pushState({ route: name, slug: slug || null }, '', pathFor(name, slug) + (target ? '#' + target : '')); } catch (e) { /* file:// */ } }
    var veil = $('#veil');
    var swap = function () {
      applyRoute(name, slug); scrollTopNow();
      requestAnimationFrame(function () { requestAnimationFrame(function () { finish(); if (veil) veil.classList.remove('is-on'); }); });
      var h = name === 'maison' ? $('#maisonPageTitle') : name === 'piece' ? $('#pdpTitle') : name === 'checkout' ? $('#cxTitle') : name === 'confirmed' ? $('#recTitle') : name === 'account' ? $('#acctTitle') : name === 'legal' ? $('#legalTitle') : $('#hero h1');
      if (h) { h.setAttribute('tabindex', '-1'); try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); } }
    };
    if (veil && !C.reduced()) { veil.classList.add('is-on'); setTimeout(swap, 280); } else swap();
  };
  ui.curRoute = curRoute;
  ui.curSlug = function () { return curSlug; };
  ui.syncAccountSlug = function (t) { curSlug = t; };
  /* a scroll target inside the other view switches route first */
  var baseScrollTo = C.scrollTo;
  C.scrollTo = function (id) {
    var el = document.getElementById(id), v = el && el.closest('[data-view]');
    var want = v ? v.getAttribute('data-view') : null;
    if (want && want !== curRoute()) { ui.route(want, id); return; }
    baseScrollTo(id);
  };
  window.addEventListener('popstate', function () {
    var name = routeFromPath(), slug = slugFor(name);
    if (name !== curRoute() || ((name === 'piece' || name === 'account' || name === 'legal') && slug !== curSlug) || name === 'checkout') { applyRoute(name, slug); scrollTopNow(); }
    var id = location.hash.slice(1);
    if (id && document.getElementById(id)) requestAnimationFrame(function () { baseScrollTo(id); });
  });
  applyRoute(routeFromPath(), slugFor(routeFromPath()));
  if (location.hash && document.getElementById(location.hash.slice(1))) {
    var hashId = location.hash.slice(1);
    window.addEventListener('load', function () { setTimeout(function () { baseScrollTo(hashId); }, 60); });
  }

  /* the dark Seal teaser draws its emblem once it enters the viewport */
  (function () {
    var t = $('#teaser'); if (!t) return;
    if (!('IntersectionObserver' in window) || C.reduced()) { t.classList.add('in'); return; }
    var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { t.classList.add('in'); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(t);
  })();

  /* ======================= global handlers ======================= */
  document.addEventListener('click', function (e) {
    var t;
    if ((t = e.target.closest('[data-go]'))) { e.preventDefault(); go(t.getAttribute('data-go')); return; }
    if ((t = e.target.closest('[data-info]'))) { ui.openInfo(t.getAttribute('data-info')); return; }
    if ((t = e.target.closest('[data-legal]'))) { e.preventDefault(); var dlg = t.closest('dialog'); if (dlg && dlg.open) C.close(dlg); ui.route('legal', null, true, t.getAttribute('data-legal')); return; }
    if ((t = e.target.closest('[data-action]'))) {
      var a = t.getAttribute('data-action');
      if (a === 'scroll-collection') { e.preventDefault(); C.scrollTo('collection'); }
      else if (a === 'film') ui.openFilm();
      else if (a === 'stylist') ui.openStylist();
      else if (a === 'salon') { if ($('#layerMenu').open) { C.close($('#layerMenu')); later(ui.openSalon); } else ui.openSalon(); }
      else if (a === 'passport') ui.openPassport();
      return;
    }
    if ((t = e.target.closest('a[data-route]'))) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
      e.preventDefault(); closePanel(true);
      var md = $('#layerMenu'); if (md && md.open) { C.close(md); later(function () { ui.route(t.getAttribute('data-route')); }); } else ui.route(t.getAttribute('data-route'));
      return;
    }
    var link = e.target.closest('a[href^="#"]');
    if (link) {
      var id = link.getAttribute('href').slice(1);
      if (id === 'top' && curRoute() !== 'home') { e.preventDefault(); ui.route('home'); }
      else if (id === 'top') { e.preventDefault(); window.scrollTo({ top: 0, behavior: C.reduced() ? 'auto' : 'smooth' }); }
      else if (document.getElementById(id)) { e.preventDefault(); C.scrollTo(id); }
    }
  });

  /* clear a field's error as soon as the person starts correcting it */
  document.addEventListener('input', function (e) {
    var f = e.target.closest && e.target.closest('.field.has-error');
    if (f && e.target.matches('input, select, textarea')) C.setError(e.target, '');
  });

  /* ======================= init ======================= */
  /* always start at the top on load and when restored from the back/forward cache */
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
  if (!location.hash) window.scrollTo(0, 0);
  window.addEventListener('pageshow', function (e) { if (e.persisted && !location.hash) window.scrollTo(0, 0); });
  window.addEventListener('beforeunload', function () { if (!location.hash) window.scrollTo(0, 0); });

  $('#year').textContent = new Date().getFullYear();
  C.emit('member');
  fbInit();
  C.updateBagUI();
})();
