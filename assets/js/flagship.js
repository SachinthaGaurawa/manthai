/* ==========================================================================
   MANTHAI  |  flagship: curtain reveal, Unbounded Spiral Seal decoder,
   editorial pillars, silk-curtain image reveals, smooth scroll, cursor,
   verification card tilt. Loaded with defer, after the core scripts.
   ========================================================================== */
(function () {
  'use strict';
  var M = window.MANTHAI, C = M.core, $ = C.$, $$ = C.$$, esc = C.esc;
  var root = document.documentElement;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------------- curtain reveal (first visit per session) ---------------- */
  var intro = $('#intro');
  function endIntro() {
    if (!root.classList.contains('intro')) return;
    root.classList.add('intro-out');
    setTimeout(function () { root.classList.remove('intro', 'intro-out'); if (intro) intro.hidden = true; }, C.reduced() ? 0 : 560);
  }
  if (root.classList.contains('intro')) {
    try { sessionStorage.setItem('manthai.intro', '1'); } catch (e) { /* ignore */ }
    var t0 = performance.now();
    /* the CSS choreography lasts 1.5 s; the class is removed just after it so nothing lingers */
    var left = Math.max(0, 1500 - t0);
    setTimeout(function () { root.classList.remove('intro'); if (intro) intro.hidden = true; }, left + 520);
    $('#introSkip').addEventListener('click', endIntro);
    ['keydown', 'wheel', 'touchstart'].forEach(function (ev) { window.addEventListener(ev, function once() { endIntro(); window.removeEventListener(ev, once); }, { passive: true }); });
    /* A trackpad flick that skips the curtain keeps sending momentum wheel events for a second or more. Without this
       the page would glide down under the curtain and the visitor would arrive mid-page instead of on the hero film.
       Scrolling stays held at the top until the curtain is gone and the gesture has come to rest. */
    C.introHold = true;
    var restT = 0, introGone = false;
    function release() {
      if (!C.introHold || !introGone) return;
      C.introHold = false; window.removeEventListener('wheel', swallow, { capture: true });
      if (!location.hash) window.scrollTo(0, 0);
      if (C.lenis) { C.lenis.scrollTo(0, { immediate: true, force: true }); C.lenis.start(); }
    }
    function swallow(e) {
      if (!C.introHold) return;
      e.preventDefault(); e.stopImmediatePropagation(); endIntro();
      clearTimeout(restT); restT = setTimeout(release, 260);
    }
    window.addEventListener('wheel', swallow, { capture: true, passive: false });
    var watch = setInterval(function () {
      if (root.classList.contains('intro')) return;
      clearInterval(watch); introGone = true;
      if (!location.hash) window.scrollTo(0, 0);
      clearTimeout(restT); restT = setTimeout(release, 260);
    }, 50);
  } else if (intro) intro.hidden = true;

  /* ---------------- editorial pillars (60/40) ---------------- */
  var pl = $('#pillarsList');
  if (pl) {
    pl.innerHTML = M.PILLARS.map(function (x, i) {
      var p = C.product(x.product);
      return '<article class="pillar pillar--' + (i + 1) + '">' +
        '<button class="pillar__frame reveal" type="button" data-go="' + esc(x.action) + '" data-cursor="Explore" aria-label="' + esc(x.link) + '">' + C.plateHTML(p, 'form') + '</button>' +
        '<div class="pillar__copy"><h3 class="pillar__title">' + esc(x.title) + '</h3><p>' + esc(x.text) + '</p><button class="link-btn" type="button" data-go="' + esc(x.action) + '">' + esc(x.link) + '</button></div></article>';
    }).join('');
  }
  var mp = $('#maisonPlate');
  if (mp) mp.innerHTML = '<span class="maison__plate-inner reveal">' + '<img src="assets/media/editorial/temp/maison-atelier.webp" alt="A hand-embroidered bodice on the stand in the atelier" loading="lazy" decoding="async">' + '</span><figcaption>In the Colombo atelier.</figcaption>';

  /* ---------------- silk-curtain reveals ---------------- */
  function observeReveals() {
    var els = $$('.reveal:not(.in)');
    if (!('IntersectionObserver' in window) || C.reduced()) { els.forEach(function (el) { el.classList.add('in'); }); return; }
    /* a fully clipped element never intersects, so the observer watches each frame's parent instead */
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (!e.isIntersecting) return;
        $$('.reveal:not(.in)', e.target).forEach(function (r) { if (r.parentElement === e.target) r.classList.add('in'); });
        io.unobserve(e.target);
      });
    }, { threshold: 0, rootMargin: '0px 0px -12% 0px' });
    els.forEach(function (el) { if (el.parentElement) io.observe(el.parentElement); });
  }
  $$('.look__frame').forEach(function (f) { f.classList.add('reveal'); f.setAttribute('data-cursor', 'View'); });
  observeReveals();

  /* ---------------- masked line reveals on serif headlines (once) ---------------- */
  function splitLines(el) {
    el.innerHTML = el._orig;
    var words = [];
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType !== 3) return;
      var frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(function (t) {
        if (!t) return;
        if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
        var w = document.createElement('span'); w.textContent = t; frag.appendChild(w); words.push(w);
      });
      n.parentNode.replaceChild(frag, n);
    });
    var lines = [], top = null;
    words.forEach(function (w) {
      if (top === null || Math.abs(w.offsetTop - top) > 4) { lines.push([]); top = w.offsetTop; }
      lines[lines.length - 1].push(w.textContent);
    });
    el.innerHTML = lines.map(function (l, i) {
      return '<span class="ln"><span class="ln__i" style="--ld:' + (i * 0.09).toFixed(2) + 's">' + esc(l.join(' ')) + '</span></span>';
    }).join('');
    el._lines = lines.length; el._w = el.clientWidth;
  }
  function initHeadlines() {
    var heads = $$('#main .display, #main .pillar__title').filter(function (h) {
      return !h._orig && Array.prototype.every.call(h.children, function (c) { return c.tagName === 'BR'; });
    });
    if (!heads.length || C.reduced() || !('IntersectionObserver' in window)) return;
    heads.forEach(function (h) { h._orig = h.innerHTML; h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim()); splitLines(h); });
    var hio = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (!e.isIntersecting) return;
        var h = e.target; hio.unobserve(h); h._shown = true;
        requestAnimationFrame(function () { h.classList.add('is-lined'); });
        /* once settled, the original markup returns so the heading wraps freely on resize */
        setTimeout(function () { h.innerHTML = h._orig; h.classList.remove('is-lined'); h.removeAttribute('aria-label'); }, 950 + h._lines * 90);
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    heads.forEach(function (h) { hio.observe(h); });
    var rt = 0;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { heads.forEach(function (h) { if (!h._shown && h.clientWidth !== h._w) splitLines(h); }); }, 180);
    }, { passive: true });
    /* headings in the hidden view measure as one line, so they are split again once their view shows */
    C.on('route', function () { requestAnimationFrame(function () { heads.forEach(function (h) { if (!h._shown && h.offsetParent) splitLines(h); }); }); });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(initHeadlines, initHeadlines); else initHeadlines();

  /* ---------------- Maison plate parallax, about 5% either way (scroll-timeline where supported) ---------------- */
  var plx = $('.maison__plate-inner');
  var plxNative = window.CSS && CSS.supports && CSS.supports('animation-timeline: view()');
  if (plx && !plxNative && !C.reduced() && 'IntersectionObserver' in window) {
    var plxOn = false, plxRaf = 0;
    var plxFrame = function () {
      plxRaf = 0; var img = plx.firstElementChild; if (!img) return;
      var r = plx.getBoundingClientRect(), vh = window.innerHeight;
      var k = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
      img.style.transform = 'translate3d(0,' + (-9.09 + 9.09 * k).toFixed(2) + '%,0)';
    };
    new IntersectionObserver(function (en) { plxOn = en[0].isIntersecting; if (plxOn) plxFrame(); }).observe(plx);
    window.addEventListener('scroll', function () { if (plxOn && !plxRaf) plxRaf = requestAnimationFrame(plxFrame); }, { passive: true });
  }

  /* ---------------- grid to PDP: the card image travels to the stage ---------------- */
  var openProduct = M.shop && M.shop.openProduct, pdpLayer = $('#layerPdp');
  if (openProduct && pdpLayer) {
    M.shop.openProduct = function (id, from) {
      var card = from && from.closest ? from.closest('.card') : null;
      var frame = card && $('.card__frame', card), src = frame && $('.plate--a', frame);
      var r = frame && frame.getBoundingClientRect();
      if (!src || C.reduced() || pdpLayer.open || !r.width || r.bottom < 0 || r.top > window.innerHeight) return openProduct.apply(this, arguments);
      pdpLayer.classList.add('is-handoff', 'is-awaiting');
      openProduct.apply(this, arguments);
      var ghost = document.createElement('div');
      ghost.className = 'handoff'; ghost.setAttribute('aria-hidden', 'true');
      ghost.appendChild(src.cloneNode(true));
      ghost.style.width = r.width + 'px'; ghost.style.height = r.height + 'px';
      ghost.style.transform = 'translate(' + r.left + 'px,' + r.top + 'px)';
      ghost.style.clipPath = 'inset(0px 0px 0px 0px)';
      pdpLayer.appendChild(ghost);
      var land = function () {
        if (!ghost.isConnected) return;
        pdpLayer.classList.remove('is-awaiting'); ghost.classList.add('is-done');
        setTimeout(function () { ghost.remove(); }, 260);
      };
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        var st = $('#stage'), t = st && st.getBoundingClientRect();
        if (!t || !t.width) { land(); return; }
        var s = Math.max(t.width / r.width, t.height / r.height);
        var cx = Math.max(0, (r.width - t.width / s) / 2), cy = Math.max(0, (r.height - t.height / s) / 2);
        ghost.style.transition = 'transform .62s cubic-bezier(0.22, 1, 0.36, 1), clip-path .62s cubic-bezier(0.22, 1, 0.36, 1)';
        ghost.style.transform = 'translate(' + (t.left - cx * s).toFixed(1) + 'px,' + (t.top - cy * s).toFixed(1) + 'px) scale(' + s.toFixed(4) + ')';
        ghost.style.clipPath = 'inset(' + cy.toFixed(1) + 'px ' + cx.toFixed(1) + 'px ' + cy.toFixed(1) + 'px ' + cx.toFixed(1) + 'px)';
        setTimeout(land, 660);
      }); });
    };
    C.on('close', function (d) { if (d === pdpLayer) pdpLayer.classList.remove('is-handoff', 'is-awaiting'); });
  }

  /* ---------------- Unbounded Spiral Seal decoder ---------------- */
  var stage = $('#decoderStage'), partsBox = $('#decoderParts'), meaning = $('#decoderMeaning');
  if (stage && partsBox) {
    var current = null;
    partsBox.innerHTML = M.SEAL_PARTS.map(function (p) {
      return '<button class="decoder__part" type="button" data-seal-part="' + p.key + '" aria-pressed="false" aria-controls="decoderMeaning">' + esc(p.title) + '</button>';
    }).join('');
    /* every meaning is laid out at once in a single grid cell, so the panel always keeps the height of the
       longest text: changing part never resizes the column, and the Seal beside it never jumps. */
    meaning.removeAttribute('aria-live');
    meaning.innerHTML = '<div class="decoder__panel is-on" data-panel=""><p class="decoder__hint">Hover or select a part of the Seal to read its meaning.</p></div>' +
      M.SEAL_PARTS.map(function (p) {
        return '<div class="decoder__panel" data-panel="' + p.key + '" aria-hidden="true"><h3 class="decoder__title">' + esc(p.title) + '</h3><p>' + esc(p.text) + '</p></div>';
      }).join('') + '<p class="sr-only" aria-live="polite" data-decoder-status></p>';
    var status = meaning.querySelector('[data-decoder-status]'), shown = '';
    function show(key, sticky) {
      key = key || '';
      var p = M.SEAL_PARTS.filter(function (x) { return x.key === key; })[0];
      stage.setAttribute('data-active', key);
      $$('.decoder__part', partsBox).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-seal-part') === key && !!sticky)); });
      if (key === shown) return;
      shown = key;
      $$('.decoder__panel', meaning).forEach(function (el) { var on = el.getAttribute('data-panel') === key; el.classList.toggle('is-on', on); el.setAttribute('aria-hidden', String(!on)); });
      status.textContent = p ? p.title + '. ' + p.text : '';
    }
    show(null);
    partsBox.addEventListener('click', function (e) {
      var b = e.target.closest('[data-seal-part]'); if (!b) return;
      var k = b.getAttribute('data-seal-part'); current = current === k ? null : k; show(current, true);
    });
    partsBox.addEventListener('pointerover', function (e) { var b = e.target.closest('[data-seal-part]'); if (b && e.pointerType === 'mouse') show(b.getAttribute('data-seal-part'), current === b.getAttribute('data-seal-part')); });
    partsBox.addEventListener('pointerleave', function () { show(current, true); });
    stage.addEventListener('pointerover', function (e) { var path = e.target.closest('.sp'); if (path) show(path.getAttribute('data-part'), current === path.getAttribute('data-part')); });
    stage.addEventListener('pointerleave', function () { show(current, true); });
    stage.addEventListener('click', function (e) { var path = e.target.closest('.sp'); if (!path) return; var k = path.getAttribute('data-part'); current = current === k ? null : k; show(current, true); });
    /* draw the Seal in once, when it first comes into view */
    if ('IntersectionObserver' in window && !C.reduced()) {
      var sio = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { stage.classList.add('is-drawn'); sio.disconnect(); } }, { threshold: 0.35 });
      sio.observe(stage);
    } else stage.classList.add('is-drawn');
  }

  /* ---------------- verification card: QR pattern and tilt ---------------- */
  var qr = $('.vcard__qr');
  if (qr) {
    var cells = '', seed = 7;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    for (var y = 0; y < 21; y++) for (var x = 0; x < 21; x++) {
      var finder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
      if (finder) {
        var fx = x > 13 ? x - 14 : x, fy = y > 13 ? y - 14 : y;
        if (fx === 0 || fx === 6 || fy === 0 || fy === 6 || (fx > 1 && fx < 5 && fy > 1 && fy < 5)) cells += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>';
      } else if (rnd() > 0.52) cells += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>';
    }
    qr.innerHTML = '<svg viewBox="-1 -1 23 23" aria-hidden="true"><g fill="currentColor">' + cells + '</g></svg>';
  }
  var card = $('#vcard');
  if (card && fine && !C.reduced()) {
    var raf = 0, tx = 0, ty = 0;
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(function () { raf = 0; card.style.setProperty('--rx', (-ty * 12).toFixed(2) + 'deg'); card.style.setProperty('--ry', (tx * 14).toFixed(2) + 'deg'); card.style.setProperty('--sx', ((tx + 0.5) * 100).toFixed(1) + '%'); });
    });
    card.addEventListener('pointerleave', function () { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); card.style.setProperty('--sx', '50%'); });
  }

  /* ---------------- smooth inertial scroll (Lenis, desktop pointer only) ---------------- */
  function startLenis() {
    if (!window.Lenis || C.reduced() || !fine || C.lenis) return;
    try {
      var lenis = new window.Lenis({ duration: 1.15, easing: function (t) { return 1 - Math.pow(1 - t, 4); }, smoothWheel: true,
        prevent: function (node) { return !!(node.closest && node.closest('dialog, .rail, .atelier-panel, .tabs')); } });
      C.lenis = lenis;
      if (C.introHold) lenis.stop();
      function frame(t) { lenis.raf(t); requestAnimationFrame(frame); }
      requestAnimationFrame(frame);
      root.style.scrollBehavior = 'auto';
      C.on('open', function () { lenis.stop(); });
      C.on('close', function () { if (!$$('dialog[open]').length) lenis.start(); });
    } catch (e) { C.lenis = null; }
  }
  if (document.readyState === 'complete') startLenis(); else window.addEventListener('load', startLenis);

  /* ---------------- custom cursor (fine pointers only) ---------------- */
  var cur = $('#cursor');
  if (cur && fine && !C.reduced()) {
    var label = $('.cursor__label', cur), cx = -100, cy = -100, dx = -100, dy = -100, running = false;
    root.classList.add('has-cursor');
    function loop() {
      dx += (cx - dx) * 0.22; dy += (cy - dy) * 0.22;
      cur.style.transform = 'translate3d(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px,0)';
      if (Math.abs(cx - dx) > 0.1 || Math.abs(cy - dy) > 0.1) requestAnimationFrame(loop); else running = false;
    }
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      cx = e.clientX; cy = e.clientY; cur.classList.add('is-on');
      if (!running) { running = true; requestAnimationFrame(loop); }
      var t = e.target.closest && e.target.closest('[data-cursor]');
      var word = t ? t.getAttribute('data-cursor') : '';
      if (t && t.closest('.stage') && $('#loupeToggle') && $('#loupeToggle').getAttribute('aria-pressed') === 'true') word = '';
      cur.classList.toggle('is-ring', !!word); if (word && label.textContent !== word) label.textContent = word;
    }, { passive: true });
    document.addEventListener('pointerleave', function () { cur.classList.remove('is-on'); });
    /* modal dialogs sit in the top layer above the cursor, so the native pointer returns while one is open */
    function sync() { root.classList.toggle('has-dialog', !!$$('dialog[open]').length); }
    C.on('open', sync); C.on('close', function () { setTimeout(sync, 0); });
  }
})();
