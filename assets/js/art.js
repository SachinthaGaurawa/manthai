/* ==========================================================================
   MANTHAI  |  atmospheric placeholder imagery
   Procedural SVG plates that stand in for photography and film until real
   assets are dropped in. Every plate is a 400 x 500 (4:5) portrait unless noted.
   Real files: set product.media.{form,move,detail} in catalog.js, or replace
   the hero <video> sources. Real media always wins over these plates.
   ========================================================================== */
(function () {
  'use strict';
  var M = window.MANTHAI;
  var n = 0;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function seeded(seed) { var s = seed || 7; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  function wrap(inner, label, vb) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + (vb || '0 0 400 500') + '" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' + esc(label) + '">' + inner + '</svg>';
  }
  function grad(id, c1, c2, o) {
    o = o || { x1: 0, y1: 0, x2: 0, y2: 1 };
    return '<linearGradient id="' + id + '" x1="' + o.x1 + '" y1="' + o.y1 + '" x2="' + o.x2 + '" y2="' + o.y2 + '"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient>';
  }
  function beam(id, strength) {
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3d8a0" stop-opacity="0"/><stop offset=".5" stop-color="#f3d8a0" stop-opacity="' + (strength || 0.2) + '"/><stop offset="1" stop-color="#f3d8a0" stop-opacity="0"/></linearGradient>';
  }

  /* ---------------- product plates ---------------- */
  var G = '#C5A059', G2 = '#e6c682';

  function petals(cx, cy, count, size, rot, rnd, fill) {
    var out = '';
    for (var i = 0; i < count; i++) {
      var a = rot + (360 / count) * i + rnd() * 14;
      out += '<ellipse cx="' + cx + '" cy="' + (cy - size * 0.62) + '" rx="' + (size * 0.28) + '" ry="' + (size * 0.62) + '" transform="rotate(' + a.toFixed(1) + ' ' + cx + ' ' + cy + ')" fill="' + (fill || G) + '" opacity="' + (0.55 + rnd() * 0.35).toFixed(2) + '"/>';
    }
    return out + '<circle cx="' + cx + '" cy="' + cy + '" r="' + (size * 0.12) + '" fill="#fbeccb"/>';
  }

  var forms = {
    gown: function (id, p, r) {
      var s = '<defs>' + grad(id + 'v', '#8a2236', '#2a070c') + grad(id + 'v2', '#5d1524', '#1b0508', { x1: 1, y1: 0, x2: 0, y2: 1 }) + '</defs>';
      s += '<path d="M200 66 C170 88 158 128 166 172 C146 236 126 340 92 484 L338 484 C304 384 284 300 240 200 C248 150 238 98 200 66 Z" fill="url(#' + id + 'v)"/>';
      s += '<path d="M166 172 C222 200 292 262 338 484 L252 484 C250 380 226 270 166 172 Z" fill="url(#' + id + 'v2)" opacity=".9"/>';
      s += '<path d="M200 66 C186 110 190 150 204 196" stroke="#c0455a" stroke-opacity=".35" stroke-width="2" fill="none"/>';
      s += petals(196, 150, 5, 34, 12, r) + petals(222, 196, 6, 26, 70, r) + petals(178, 232, 5, 22, 30, r) + petals(258, 280, 6, 30, 5, r) + petals(228, 352, 5, 24, 40, r);
      for (var i = 0; i < 46; i++) { var t = i / 45; var x = 166 + t * 172 + Math.sin(t * 6) * 6, y = 172 + t * 312; s += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (1.4 + r() * 1.6).toFixed(1) + '" fill="#f3dca2" opacity=".85"/>'; }
      return s;
    },
    lace: function (id, p, r) {
      var s = '<defs>' + grad(id + 'v', '#8a2236', '#240709') + lacePattern(id + 'l', 26) + '</defs>';
      s += '<path d="M168 70 C150 96 150 140 176 196 C186 214 190 226 172 252 C140 330 120 400 100 484 L330 484 C312 400 276 330 236 262 C214 230 216 214 226 196 C252 150 250 96 232 70 Z" fill="url(#' + id + 'v)"/>';
      s += '<path d="M168 70 C150 96 150 140 176 196 C186 214 190 226 172 252 C140 330 120 400 100 484 L330 484 C312 400 276 330 236 262 C214 230 216 214 226 196 C252 150 250 96 232 70 Z" fill="url(#' + id + 'l)"/>';
      s += '<path d="M174 232 C200 250 230 232 252 262" stroke="' + G2 + '" stroke-opacity=".55" stroke-width="2" fill="none"/><path d="M172 252 C204 232 232 258 238 262" stroke="#13040a" stroke-opacity=".7" stroke-width="5" fill="none"/>';
      return s;
    },
    blazer: function (id, p, r) {
      var s = '<defs>' + grad(id + 'w', '#26262a', '#0e0e10') + grad(id + 's', '#3d3d43', '#141416', { x1: 0, y1: 0, x2: 1, y2: 1 }) + '</defs>';
      s += '<path d="M118 96 L200 70 L282 96 L336 156 L350 484 L50 484 L64 156 Z" fill="url(#' + id + 'w)"/>';
      s += '<path d="M200 70 L146 238 L206 330 L222 196 Z" fill="url(#' + id + 's)" stroke="' + G + '" stroke-opacity=".55"/>';
      s += '<path d="M200 70 L254 224 L212 296" fill="none" stroke="#2b2b30" stroke-width="2"/>';
      s += '<path d="M206 330 L236 484" stroke="#0b0b0c" stroke-width="3"/><path d="M96 350 L158 346 M242 352 L304 358" stroke="#050506" stroke-width="3"/>';
      s += '<path d="M200 70 L128 146 M200 70 L272 146" stroke="' + G + '" stroke-opacity=".45" fill="none"/>';
      return s;
    },
    shirt: function (id, p, r) {
      var s = '<defs>' + grad(id + 'w', '#f3eee1', '#cbc2ac', { x1: 0, y1: 0, x2: 1, y2: 1 }) + '</defs>';
      s += '<path d="M150 80 L200 100 L250 80 L330 128 L372 280 L318 296 L304 232 L300 484 L100 484 L96 232 L82 296 L28 280 L70 128 Z" fill="url(#' + id + 'w)"/>';
      s += '<path d="M150 80 L200 118 L250 80 L232 74 L200 94 L168 74 Z" fill="#faf6ec" stroke="#b9ae93" stroke-width="1"/>';
      s += '<path d="M200 118 L200 484" stroke="#b9ae93" stroke-width="1.2"/>';
      for (var i = 0; i < 6; i++) s += '<circle cx="200" cy="' + (160 + i * 54) + '" r="5" fill="#fbf9f1" stroke="#c9bfa5"/><circle cx="198.5" cy="' + (158.5 + i * 54) + '" r="1.5" fill="#fff"/>';
      s += '<path d="M120 200 C150 300 140 400 128 484" stroke="#fff" stroke-opacity=".45" stroke-width="10" fill="none"/>';
      return s;
    },
    bag: function (id, p, r) {
      var s = '<defs>' + grad(id + 'b', '#2a2a2e', '#0c0c0d', { x1: 0, y1: 0, x2: 1, y2: 1 }) + grad(id + 'g', '#f0d596', '#9b7a33') + '</defs>';
      s += '<path d="M-20 440 C60 400 120 470 220 430 L260 520 L-20 520 Z" fill="#0E3B2E" opacity=".85"/>';
      s += '<path d="M140 262 C130 150 270 150 260 262" stroke="#050506" stroke-width="11" fill="none"/><path d="M146 258 C140 170 260 170 254 258" stroke="#3a3a40" stroke-width="2" fill="none"/>';
      s += '<path d="M88 262 L312 262 L346 424 L54 424 Z" fill="url(#' + id + 'b)"/><path d="M88 262 L312 262 L318 300 L82 300 Z" fill="#141416"/>';
      s += '<rect x="184" y="286" width="32" height="40" fill="url(#' + id + 'g)"/><path d="M190 300 C194 292 198 292 200 300 C202 292 206 292 210 300" stroke="#4d3a12" fill="none"/>';
      s += '<path d="M64 424 L336 424" stroke="' + G + '" stroke-opacity=".35"/>';
      return s;
    },
    mina: function (id, p, r) {
      var s = '<defs>' + grad(id + 'a', '#f6f1e4', '#d2c8b0', { x1: 0, y1: 0, x2: 1, y2: 1 }) + grad(id + 'g', '#f0d596', '#9b7a33') + '</defs>';
      s += '<path d="M110 160 C110 60 290 60 290 160" stroke="' + G + '" stroke-width="3" stroke-dasharray="7 4" fill="none"/>';
      s += '<rect x="96" y="214" width="208" height="150" fill="url(#' + id + 'a)" stroke="url(#' + id + 'g)" stroke-width="7"/>';
      s += '<rect x="108" y="226" width="184" height="126" fill="none" stroke="' + G + '" stroke-opacity=".6"/>';
      s += '<rect x="190" y="206" width="20" height="14" fill="url(#' + id + 'g)"/>';
      s += '<path d="M96 160 C96 200 100 210 110 214 M304 160 C304 200 300 210 290 214" stroke="' + G + '" stroke-width="3" fill="none"/>';
      s += '<ellipse cx="200" cy="384" rx="104" ry="9" fill="#000" opacity=".16"/>';
      return s;
    },
    parfum: function (id, p, r, k) {
      var liq = k === 'saffron' ? ['#f2cf6e', '#a56d12'] : ['#c98a2c', '#5b3308'];
      var s = '<defs>' + grad(id + 'gl', '#3a3a40', '#0f0f11', { x1: 0, y1: 0, x2: 1, y2: 0 }) + grad(id + 'li', liq[0], liq[1]) + '</defs>';
      s += '<rect x="0" y="410" width="400" height="90" fill="#050506"/><rect x="0" y="414" width="400" height="1" fill="' + G + '" opacity=".4"/>';
      s += '<rect x="118" y="196" width="164" height="222" fill="url(#' + id + 'gl)" stroke="#8c8f98" stroke-opacity=".55"/>';
      s += '<rect x="130" y="214" width="140" height="190" fill="url(#' + id + 'li)" opacity=".92"/>';
      s += '<rect x="150" y="262" width="100" height="62" fill="none" stroke="' + G + '" stroke-opacity=".8"/><path d="M164 292 L236 292" stroke="' + G + '" stroke-opacity=".8"/>';
      s += '<rect x="138" y="128" width="124" height="68" fill="#0b0b0c" stroke="' + G + '" stroke-opacity=".7"/><rect x="138" y="190" width="124" height="6" fill="' + G + '"/>';
      s += '<rect x="130" y="214" width="8" height="190" fill="#fff" opacity=".18"/>';
      for (var i = 0; i < 18; i++) s += '<circle cx="' + (60 + r() * 280).toFixed(0) + '" cy="' + (60 + r() * 220).toFixed(0) + '" r="' + (1 + r() * 2.4).toFixed(1) + '" fill="' + G2 + '" opacity="' + (0.25 + r() * 0.5).toFixed(2) + '"/>';
      return s;
    }
  };

  function lacePattern(id, sz) {
    var h = sz / 2;
    return '<pattern id="' + id + '" width="' + sz + '" height="' + sz + '" patternUnits="userSpaceOnUse"><circle cx="' + h + '" cy="' + h + '" r="' + (sz * 0.33) + '" fill="none" stroke="' + G + '" stroke-opacity=".6"/><circle cx="0" cy="0" r="' + (sz * 0.33) + '" fill="none" stroke="' + G + '" stroke-opacity=".4"/><circle cx="' + sz + '" cy="' + sz + '" r="' + (sz * 0.33) + '" fill="none" stroke="' + G + '" stroke-opacity=".4"/><path d="M' + h + ' ' + (h - sz * 0.33) + ' q' + (sz * 0.18) + ' ' + (sz * 0.33) + ' 0 ' + (sz * 0.66) + ' q-' + (sz * 0.18) + ' -' + (sz * 0.33) + ' 0 -' + (sz * 0.66) + '" fill="' + G + '" opacity=".35"/></pattern>';
  }

  var details = {
    gown: function (id, p, r) {
      var s = '<defs>' + grad(id + 'v', '#8a2236', '#240709', { x1: 0, y1: 0, x2: 1, y2: 1 }) + '</defs><rect width="400" height="500" fill="url(#' + id + 'v)"/>';
      for (var i = 0; i < 26; i++) { var y = r() * 520; s += '<path d="M-20 ' + y.toFixed(0) + ' C120 ' + (y - 40 + r() * 80).toFixed(0) + ' 260 ' + (y + 30).toFixed(0) + ' 430 ' + (y - 20 + r() * 40).toFixed(0) + '" stroke="#b8344c" stroke-opacity=".12" stroke-width="' + (1 + r() * 3).toFixed(1) + '" fill="none"/>'; }
      s += petals(150, 190, 6, 120, 8, r) + petals(300, 340, 5, 90, 40, r) + petals(90, 400, 5, 64, 0, r);
      s += '<path d="M40 120 C140 60 250 130 380 70" stroke="' + G2 + '" stroke-width="5" stroke-linecap="round" fill="none" opacity=".8"/><path d="M20 300 C120 240 240 330 390 250" stroke="' + G + '" stroke-width="3" stroke-linecap="round" fill="none" opacity=".7"/>';
      for (var j = 0; j < 22; j++) { var cx = 20 + r() * 360, cy = 20 + r() * 460; s += '<circle cx="' + cx.toFixed(0) + '" cy="' + cy.toFixed(0) + '" r="' + (4 + r() * 5).toFixed(1) + '" fill="#f3dca2"/><circle cx="' + (cx - 1.5).toFixed(0) + '" cy="' + (cy - 1.5).toFixed(0) + '" r="1.6" fill="#fff"/>'; }
      return s;
    },
    lace: function (id) {
      return '<defs>' + grad(id + 'v', '#8a2236', '#1f0507') + lacePattern(id + 'l', 54) + '</defs><rect width="400" height="500" fill="url(#' + id + 'v)"/><rect width="400" height="500" fill="url(#' + id + 'l)"/><path d="M0 330 C120 290 260 370 400 310" stroke="' + G2 + '" stroke-width="2" fill="none" opacity=".6"/>';
    },
    blazer: function (id) {
      var s = '<defs>' + grad(id + 's', '#4a4a52', '#16161a', { x1: 0, y1: 0, x2: 1, y2: 1 }) + '</defs><rect width="400" height="500" fill="#101012"/>';
      for (var i = -12; i < 40; i++) s += '<path d="M' + (i * 16) + ' 0 L' + (i * 16 + 220) + ' 500" stroke="#2a2a2f" stroke-width="3"/>';
      s += '<path d="M0 300 C120 200 260 240 400 120 L400 500 L0 500 Z" fill="url(#' + id + 's)" opacity=".9"/><path d="M0 300 C120 200 260 240 400 120" stroke="' + G + '" stroke-opacity=".7" fill="none"/>';
      s += '<g transform="translate(112 396) scale(.19)" color="' + G + '"><rect x="-26" y="-26" width="470" height="150" fill="#0b0b0c" stroke="' + G + '" stroke-opacity=".6" stroke-width="3"/><use href="#wm-paths" transform="translate(-122 -35) translate(8 14) scale(.5)"/></g>';
      return s;
    },
    shirt: function (id) {
      var s = '<defs>' + grad(id + 'w', '#fbf8ef', '#cfc5ad', { x1: 0, y1: 0, x2: 1, y2: 1 }) + grad(id + 'p', '#fdfaf1', '#c8bfa7') + '<radialGradient id="' + id + 'mp" cx=".35" cy=".3"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#e8e1d2"/><stop offset="1" stop-color="#b7c3be"/></radialGradient></defs><rect width="400" height="500" fill="url(#' + id + 'w)"/>';
      for (var i = 0; i < 9; i++) s += '<path d="M-20 ' + (i * 60 + 10) + ' C100 ' + (i * 60 - 40) + ' 260 ' + (i * 60 + 80) + ' 420 ' + (i * 60 + 10) + '" stroke="#fff" stroke-opacity=".5" stroke-width="14" fill="none"/><path d="M-20 ' + (i * 60 + 38) + ' C100 ' + (i * 60 - 12) + ' 260 ' + (i * 60 + 108) + ' 420 ' + (i * 60 + 38) + '" stroke="#b7ad92" stroke-opacity=".3" stroke-width="6" fill="none"/>';
      s += '<circle cx="200" cy="250" r="86" fill="url(#' + id + 'mp)" stroke="#a79e86"/><circle cx="178" cy="228" r="7" fill="#9a927c"/><circle cx="222" cy="228" r="7" fill="#9a927c"/><circle cx="178" cy="272" r="7" fill="#9a927c"/><circle cx="222" cy="272" r="7" fill="#9a927c"/>';
      return s;
    },
    bag: function (id, p, r) {
      var s = '<defs>' + grad(id + 'g', '#f6dc9c', '#8f6f2b') + '<pattern id="' + id + 'gr" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1.1" fill="#000" opacity=".5"/><circle cx="4.5" cy="4.5" r="1" fill="#fff" opacity=".07"/></pattern></defs><rect width="400" height="500" fill="#161618"/><rect width="400" height="500" fill="url(#' + id + 'gr)"/>';
      s += '<path d="M0 120 L400 120" stroke="#9c9ca5" stroke-opacity=".5" stroke-dasharray="8 7"/><path d="M0 400 L400 400" stroke="#9c9ca5" stroke-opacity=".5" stroke-dasharray="8 7"/>';
      s += '<rect x="132" y="170" width="136" height="190" fill="url(#' + id + 'g)"/><rect x="146" y="184" width="108" height="162" fill="none" stroke="#5a431a" stroke-width="2"/>';
      s += '<g color="#4d3a12" transform="translate(160 214) scale(.043)"><use href="#crest-path"/></g>';
      s += '<path d="M0 470 C120 440 220 500 400 450 L400 500 L0 500 Z" fill="#0E3B2E"/>';
      return s;
    },
    mina: function (id) {
      var s = '<defs>' + grad(id + 'g', '#f6dc9c', '#8f6f2b') + grad(id + 'a', '#fbf7ec', '#cdc3aa', { x1: 0, y1: 0, x2: 1, y2: 1 }) + '</defs><rect width="400" height="500" fill="url(#' + id + 'a)"/>';
      for (var i = 0; i < 8; i++) s += '<path d="M-10 ' + (i * 70) + ' C120 ' + (i * 70 + 60) + ' 280 ' + (i * 70 - 50) + ' 410 ' + (i * 70 + 20) + '" stroke="#fff" stroke-opacity=".7" stroke-width="18" fill="none"/><path d="M-10 ' + (i * 70 + 30) + ' C120 ' + (i * 70 + 90) + ' 280 ' + (i * 70 - 20) + ' 410 ' + (i * 70 + 50) + '" stroke="#b8ad90" stroke-opacity=".35" stroke-width="8" fill="none"/>';
      s += '<path d="M0 360 L400 360 L400 410 L0 410 Z" fill="url(#' + id + 'g)"/><circle cx="200" cy="140" r="38" fill="none" stroke="#a3947a" stroke-width="2" opacity=".6"/><circle cx="200" cy="140" r="26" fill="none" stroke="#a3947a" stroke-width="1" opacity=".5"/>';
      return s;
    },
    parfum: function (id, p, r, k) {
      var liq = k === 'saffron' ? ['#f6d77c', '#b9791a'] : ['#d79a36', '#6a3d09'];
      var s = '<defs>' + grad(id + 'li', liq[0], liq[1]) + grad(id + 'gl', '#454550', '#0c0c0d', { x1: 0, y1: 0, x2: 1, y2: 1 }) + '</defs><rect width="400" height="500" fill="url(#' + id + 'gl)"/>';
      s += '<polygon points="40,500 120,60 230,500" fill="url(#' + id + 'li)" opacity=".7"/><polygon points="170,500 280,40 400,500" fill="url(#' + id + 'li)" opacity=".4"/>';
      s += '<polygon points="0,200 160,0 320,240 90,500" fill="#fff" opacity=".05"/>';
      for (var i = 0; i < 26; i++) s += '<circle cx="' + (r() * 400).toFixed(0) + '" cy="' + (r() * 500).toFixed(0) + '" r="' + (2 + r() * 8).toFixed(1) + '" fill="' + G2 + '" opacity="' + (0.15 + r() * 0.5).toFixed(2) + '"/>';
      return s;
    }
  };

  var fineLayer = {
    gown: function (id) { return '<pattern id="' + id + 'f" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(25)"><path d="M0 0 L0 9" stroke="#e98aa0" stroke-opacity=".28" stroke-width=".8"/><path d="M4.5 0 L4.5 9" stroke="#000" stroke-opacity=".22" stroke-width=".8"/></pattern>'; },
    lace: function (id) { return '<pattern id="' + id + 'f" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r=".7" fill="' + G2 + '" opacity=".55"/></pattern>'; },
    blazer: function (id) { return '<pattern id="' + id + 'f" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0 L0 5" stroke="#8a8a92" stroke-opacity=".35" stroke-width=".9"/></pattern>'; },
    shirt: function (id) { return '<pattern id="' + id + 'f" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 0 L4 0 M0 0 L0 4" stroke="#a79e86" stroke-opacity=".3" stroke-width=".6"/></pattern>'; },
    bag: function (id) { return '<pattern id="' + id + 'f" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="#000" opacity=".5"/><circle cx="5.5" cy="5.5" r=".8" fill="#fff" opacity=".12"/></pattern>'; },
    mina: function (id) { return '<pattern id="' + id + 'f" width="3" height="14" patternUnits="userSpaceOnUse"><path d="M0 0 L0 14" stroke="#fff" stroke-opacity=".5" stroke-width=".8"/></pattern>'; },
    parfum: function (id) { return '<pattern id="' + id + 'f" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="5" cy="6" r="1.2" fill="' + G2 + '" opacity=".6"/><circle cx="16" cy="15" r=".8" fill="#fff" opacity=".5"/></pattern>'; }
  };

  function bgFor(id, p, view) {
    var light = p.palette[0] === '#EAE4D7';
    var s = '<defs>' + grad(id + 'bg', p.palette[0], p.palette[1], { x1: 0.2, y1: 0, x2: 0.8, y2: 1 }) + beam(id + 'bm', light ? 0.32 : 0.2) + '</defs>';
    s += '<rect width="400" height="500" fill="url(#' + id + 'bg)"/>';
    if (p.kind === 'parfum' || p.kind === 'bag') s += '<rect width="400" height="500" fill="#0B0B0C" opacity=".55"/>';
    return s;
  }

  function plate(product, view) {
    var p = product, id = 'p' + (++n) + '_';
    var rnd = seeded(p.id.length * 97 + (view === 'move' ? 13 : view === 'detail' ? 31 : 3));
    var label = p.name + ', ' + (view === 'detail' ? 'macro detail' : view === 'move' ? 'in movement' : 'portrait');
    var inner = '';
    var fine = '<defs>' + fineLayer[p.kind](id) + '</defs><rect class="fine" width="400" height="500" fill="url(#' + id + 'f)"/>';
    if (view === 'detail') {
      inner = details[p.kind](id, p, rnd, p.variant) + fine + '<polygon points="0,0 400,0 400,500" fill="url(#' + id + 'bm)" opacity=".5"/>';
      inner = '<defs>' + beam(id + 'bm', 0.22) + '</defs>' + inner;
    } else {
      var obj = forms[p.kind](id, p, rnd, p.variant);
      inner = bgFor(id, p) + '<polygon points="40,0 190,0 400,420 400,500 300,500" fill="url(#' + id + 'bm)"/>';
      if (view === 'move') {
        inner += '<g transform="rotate(-3.5 200 300) translate(16 -8) scale(1.03)">' + obj + '</g>';
        for (var i = 0; i < 7; i++) inner += '<rect x="' + (rnd() * 300).toFixed(0) + '" y="' + (rnd() * 460).toFixed(0) + '" width="' + (80 + rnd() * 200).toFixed(0) + '" height="1.5" fill="#fff" opacity=".12"/>';
      } else {
        inner += obj;
      }
      inner += fine;
    }
    return wrap(inner, label);
  }

  /* ---------------- navigation panel and lookbook scenes ---------------- */
  function panel(item) {
    if (item.kind === 'crest') {
      var id = 'c' + (++n) + '_';
      return wrap('<defs>' + grad(id, '#1c1c1f', '#0b0b0c') + beam(id + 'b', .16) + '</defs><rect width="400" height="500" fill="url(#' + id + ')"/><polygon points="0,0 220,0 400,300 400,500" fill="url(#' + id + 'b)"/><g color="' + G + '" transform="translate(112 112) scale(.095)"><use href="#crest-path"/></g>', item.image);
    }
    var prod = M.PRODUCTS.filter(function (x) { return x.kind === item.kind; })[0];
    return plate(prod, 'form');
  }

  function look(item) {
    var id = 'l' + (++n) + '_', r = seeded(item.id.length * 53), s = '';
    if (item.kind === 'courtyard') {
      s = '<defs>' + grad(id + 'w', '#d9c29a', '#5b452a') + grad(id + 'f', '#8a6a42', '#2a1d10') + beam(id + 'b', .38) + '</defs><rect width="400" height="500" fill="url(#' + id + 'w)"/>';
      s += '<path d="M0 500 L0 150 C0 70 80 40 100 40 C120 40 200 70 200 150 L200 500 Z" fill="#2a1d10" opacity=".55"/><path d="M200 500 L200 150 C200 70 280 40 300 40 C320 40 400 70 400 150 L400 500 Z" fill="#2a1d10" opacity=".4"/>';
      s += '<rect y="400" width="400" height="100" fill="url(#' + id + 'f)"/><circle cx="330" cy="130" r="48" fill="#ffd994" opacity=".7"/><polygon points="330,130 160,500 400,500 400,260" fill="url(#' + id + 'b)"/>';
      s += '<path d="M140 150 C100 230 70 330 52 460 L196 460 C184 340 176 240 160 150 Z" fill="#f4eee0"/><path d="M114 220 C80 270 60 340 52 460" stroke="#fff" stroke-width="10" fill="none" opacity=".6"/><circle cx="150" cy="118" r="16" fill="#8d6a4c"/>';
      s += '<path d="M262 120 L290 112 L318 120 L328 170 L330 460 L252 460 L254 170 Z" fill="#0b0b0c"/><circle cx="290" cy="92" r="15" fill="#6d4e36"/>';
    } else if (item.kind === 'basalt') {
      s = '<defs>' + grad(id + 'b', '#2b2b2f', '#0a0a0b') + grad(id + 'g', '#f0d596', '#9b7a33') + '</defs><rect width="400" height="500" fill="url(#' + id + 'b)"/><path d="M0 330 C100 300 200 360 400 320 L400 500 L0 500Z" fill="#050506"/><path d="M0 330 C100 300 200 360 400 320" stroke="' + G + '" stroke-opacity=".6" fill="none"/>';
      s += '<path d="M-10 480 C80 400 150 470 240 410 L240 520 L-10 520 Z" fill="#0E3B2E"/>';
      s += '<path d="M70 330 L214 330 L236 420 L48 420 Z" fill="#161618" stroke="' + G + '" stroke-opacity=".35"/><path d="M96 330 C92 260 190 260 186 330" stroke="#050506" stroke-width="8" fill="none"/><rect x="132" y="342" width="22" height="26" fill="url(#' + id + 'g)"/>';
      s += '<rect x="262" y="290" width="84" height="130" fill="#2a2a30" stroke="#8c8f98" stroke-opacity=".5"/><rect x="270" y="300" width="68" height="104" fill="#b3781f" opacity=".85"/><rect x="272" y="258" width="64" height="34" fill="#0b0b0c" stroke="' + G + '" stroke-opacity=".7"/>';
      s += '<rect y="426" width="400" height="74" fill="#fff" opacity=".04"/>';
    } else if (item.kind === 'table') {
      s = '<defs>' + grad(id + 'w', '#7a5535', '#3b2615') + beam(id + 'b', .35) + '</defs><rect width="400" height="500" fill="url(#' + id + 'w)"/>';
      for (var i = 0; i < 14; i++) s += '<path d="M0 ' + (i * 38) + ' C130 ' + (i * 38 - 8) + ' 260 ' + (i * 38 + 8) + ' 400 ' + (i * 38) + '" stroke="#2a1a0d" stroke-opacity=".35" fill="none"/>';
      s += '<rect x="50" y="120" width="300" height="250" fill="#f2ead7" transform="rotate(-4 200 245)"/>';
      s += '<g transform="rotate(-4 200 245)">' + petals(150, 230, 5, 46, 20, r) + petals(244, 280, 6, 36, 60, r) + '<path d="M80 320 C140 290 200 330 320 300" stroke="' + G2 + '" stroke-width="4" stroke-linecap="round" fill="none"/></g>';
      s += '<path d="M280 150 L360 80" stroke="#0b0b0c" stroke-width="10"/><path d="M280 150 L296 168" stroke="' + G + '" stroke-width="10"/>';
      for (var j = 0; j < 14; j++) s += '<circle cx="' + (60 + r() * 120).toFixed(0) + '" cy="' + (400 + r() * 60).toFixed(0) + '" r="3" fill="#e7e1d2"/>';
      s += '<polygon points="0,0 200,0 400,400 400,500" fill="url(#' + id + 'b)"/>';
    } else {
      s = '<defs>' + grad(id + 'b', '#17171a', '#050506') + '<pattern id="' + id + 'd" width="44" height="44" patternUnits="userSpaceOnUse"><path d="M22 3 L41 22 L22 41 L3 22 Z" fill="none" stroke="#2a2a2f" stroke-width="1.4"/><circle cx="22" cy="22" r="3" fill="#2a2a2f"/></pattern>' + beam(id + 'm', .4) + '</defs><rect width="400" height="500" fill="url(#' + id + 'b)"/><rect width="400" height="500" fill="url(#' + id + 'd)"/>';
      s += '<g color="' + G + '" transform="translate(22 232) scale(.43)"><use href="#wm-paths" transform="translate(-122 -35)"/></g><polygon points="0,120 160,0 260,0 60,500 0,500" fill="url(#' + id + 'm)" opacity=".7"/>';
    }
    return wrap(s, item.caption);
  }

  /* ---------------- hero film placeholder reel (1600 x 900) ---------------- */
  function film() {
    var VB = '0 0 1600 900', r = seeded(11);
    var shot1 = '<defs>' + grad('f1v', '#4a121c', '#0b0b0c', { x1: 0, y1: 1, x2: 1, y2: 0 }) + '<linearGradient id="f1s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd994" stop-opacity="0"/><stop offset=".5" stop-color="#ffd994" stop-opacity=".34"/><stop offset="1" stop-color="#ffd994" stop-opacity="0"/></linearGradient></defs><rect width="1600" height="900" fill="url(#f1v)"/>';
    for (var i = 0; i < 18; i++) { var y = r() * 950; shot1 += '<path d="M-40 ' + y.toFixed(0) + ' C400 ' + (y - 80 + r() * 160).toFixed(0) + ' 1000 ' + (y + 60).toFixed(0) + ' 1700 ' + (y - 40 + r() * 80).toFixed(0) + '" stroke="#b8344c" stroke-opacity=".13" stroke-width="' + (2 + r() * 8).toFixed(1) + '" fill="none"/>'; }
    for (var k = 0; k < 7; k++) { var yy = 120 + k * 110 + r() * 40; shot1 += '<path d="M' + (120 + r() * 200).toFixed(0) + ' ' + yy.toFixed(0) + ' C600 ' + (yy - 90).toFixed(0) + ' 1000 ' + (yy + 90).toFixed(0) + ' ' + (1300 + r() * 220).toFixed(0) + ' ' + (yy - 20).toFixed(0) + '" stroke="' + (k % 2 ? G : G2) + '" stroke-opacity=".55" stroke-width="' + (3 + r() * 7).toFixed(1) + '" stroke-linecap="round" fill="none"/>'; }
    shot1 += '<polygon points="520,0 980,0 1360,900 760,900" fill="url(#f1s)" class="sweep"/>';

    var shot2 = '<defs>' + grad('f2w', '#d9c29a', '#4f3a22') + '<radialGradient id="f2sun" cx=".78" cy=".3" r=".7"><stop offset="0" stop-color="#ffe1a6" stop-opacity=".95"/><stop offset=".4" stop-color="#e7b96b" stop-opacity=".35"/><stop offset="1" stop-color="#e7b96b" stop-opacity="0"/></radialGradient></defs><rect width="1600" height="900" fill="url(#f2w)"/><rect width="1600" height="900" fill="url(#f2sun)"/>';
    for (var a = 0; a < 4; a++) { var ax = 40 + a * 400; shot2 += '<path d="M' + ax + ' 900 L' + ax + ' 360 C' + ax + ' 190 ' + (ax + 360) + ' 190 ' + (ax + 360) + ' 360 L' + (ax + 360) + ' 900 Z" fill="#2a1d10" opacity="' + (0.5 - a * 0.06).toFixed(2) + '"/>'; }
    shot2 += '<rect y="740" width="1600" height="160" fill="#2a1d10" opacity=".6"/>';
    shot2 += '<g class="sway"><path d="M520 250 C430 400 380 600 350 790 L690 790 C660 600 620 400 570 250 Z" fill="#f4eee0" opacity=".96"/><path d="M470 330 C420 460 400 620 390 790" stroke="#fff" stroke-width="22" opacity=".5" fill="none"/></g><circle cx="545" cy="206" r="34" fill="#8d6a4c"/>';
    shot2 += '<path d="M1030 240 L1100 220 L1170 240 L1196 330 L1200 790 L1000 790 L1004 330 Z" fill="#0b0b0c"/><circle cx="1100" cy="180" r="32" fill="#6d4e36"/>';

    var shot3 = '<defs><radialGradient id="f3m" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#f0cf84" stop-opacity=".9"/><stop offset="1" stop-color="#f0cf84" stop-opacity="0"/></radialGradient>' + grad('f3g', '#f6dc9c', '#8f6f2b') + '</defs><rect width="1600" height="900" fill="#0b0b0c"/><ellipse cx="1180" cy="440" rx="520" ry="360" fill="url(#f3m)" opacity=".28"/>';
    shot3 += '<path d="M120 640 L640 640 L700 820 L60 820 Z" fill="#161618" stroke="' + G + '" stroke-opacity=".35"/><path d="M200 640 C190 480 560 480 560 640" stroke="#050506" stroke-width="22" fill="none"/><rect x="340" y="668" width="70" height="86" fill="url(#f3g)"/><circle cx="375" cy="700" r="60" fill="url(#f3m)" class="glint"/>';
    shot3 += '<rect x="1010" y="360" width="250" height="340" fill="#2a2a30" stroke="#8c8f98" stroke-opacity=".5"/><rect x="1030" y="384" width="210" height="290" fill="#b3781f" opacity=".85"/><rect x="1040" y="260" width="190" height="100" fill="#0b0b0c" stroke="' + G + '" stroke-opacity=".7"/>';
    shot3 += '<g class="mist">';
    for (var m = 0; m < 22; m++) shot3 += '<circle cx="' + (760 + r() * 760).toFixed(0) + '" cy="' + (140 + r() * 520).toFixed(0) + '" r="' + (6 + r() * 26).toFixed(0) + '" fill="url(#f3m)" opacity="' + (0.2 + r() * 0.5).toFixed(2) + '" style="animation-delay:-' + (r() * 9).toFixed(1) + 's"/>';
    shot3 += '</g>';

    var shot4 = '<defs><pattern id="f4d" width="76" height="76" patternUnits="userSpaceOnUse"><path d="M38 6 L70 38 L38 70 L6 38 Z" fill="none" stroke="#26262b" stroke-width="2"/><circle cx="38" cy="38" r="5" fill="#26262b"/></pattern><linearGradient id="f4s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f6e2b0" stop-opacity="0"/><stop offset=".5" stop-color="#f6e2b0" stop-opacity=".42"/><stop offset="1" stop-color="#f6e2b0" stop-opacity="0"/></linearGradient></defs><rect width="1600" height="900" fill="#060607"/><rect width="1600" height="900" fill="url(#f4d)"/>';
    shot4 += '<g color="' + G + '" transform="translate(360 372) scale(1.18)"><use href="#wm-paths" transform="translate(-122 -35)"/></g><rect x="-400" y="0" width="560" height="900" fill="url(#f4s)" class="sweep"/>';

    return [shot1, shot2, shot3, shot4].map(function (inner, i) {
      return '<div class="shot shot--' + (i + 1) + '"><svg xmlns="http://www.w3.org/2000/svg" viewBox="' + VB + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + inner + '</svg></div>';
    }).join('');
  }

  M.Art = { plate: plate, panel: panel, look: look, film: film, esc: esc };
})();
