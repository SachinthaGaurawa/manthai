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
  var G = '#C9AF7E', G2 = '#e6c682';

  function petals(cx, cy, count, size, rot, rnd, fill) {
    var out = '';
    for (var i = 0; i < count; i++) {
      var a = rot + (360 / count) * i + rnd() * 14;
      out += '<ellipse cx="' + cx + '" cy="' + (cy - size * 0.62) + '" rx="' + (size * 0.28) + '" ry="' + (size * 0.62) + '" transform="rotate(' + a.toFixed(1) + ' ' + cx + ' ' + cy + ')" fill="' + (fill || G) + '" opacity="' + (0.55 + rnd() * 0.35).toFixed(2) + '"/>';
    }
    return out + '<circle cx="' + cx + '" cy="' + cy + '" r="' + (size * 0.12) + '" fill="#fbeccb"/>';
  }

  /* silk rosette: concentric folded petals (detail ornament) */
  function rosette(cx, cy, s, a, b) {
    var out = '';
    [1, 0.74, 0.5, 0.28].forEach(function (k, i) {
      for (var j = 0; j < 7; j++) {
        var ang = j * (360 / 7) + i * 22;
        out += '<ellipse cx="' + cx + '" cy="' + (cy - s * k * 0.5) + '" rx="' + (s * k * 0.3) + '" ry="' + (s * k * 0.52) + '" transform="rotate(' + ang + ' ' + cx + ' ' + cy + ')" fill="' + (i % 2 ? b : a) + '" stroke="#9b8c68" stroke-opacity=".5" stroke-width=".8"/>';
      }
    });
    return out + '<circle cx="' + cx + '" cy="' + cy + '" r="' + (s * 0.1) + '" fill="#cdbf9c"/>';
  }
  function wave(x0, y, w, n, amp, stroke, sw) {
    var step = w / n, d = 'M' + x0 + ' ' + y + ' q' + (step / 2) + ' ' + (-amp) + ' ' + step + ' 0';
    for (var i = 1; i < n; i++) d += ' t' + step + ' 0';
    return '<path d="' + d + '" fill="none" stroke="' + stroke + '" stroke-width="' + (sw || 2) + '"/>';
  }

  var forms = {
    /* silk shirt (reserved form, not in the Phase 1 catalog) */
    shirt: function (id, p, r) {
      var s = '<defs>' + grad(id + 'c', '#efe2c6', '#a8916a', { x1: 0, y1: 0, x2: 1, y2: 1 }) + grad(id + 'h', '#fff6e2', '#cdb78e') + '</defs>';
      s += '<path d="M150 96 L104 140 L70 330 L104 338 L134 196 Z M250 96 L296 140 L330 330 L296 338 L266 196 Z" fill="url(#' + id + 'c)" stroke="#8f7a55" stroke-opacity=".45"/>';
      s += '<path d="M150 96 L200 84 L250 96 L270 196 L282 430 L118 430 L130 196 Z" fill="url(#' + id + 'c)"/>';
      s += '<path d="M176 88 L200 124 L224 88 L212 80 L200 96 L188 80 Z" fill="url(#' + id + 'h)" stroke="' + G + '" stroke-opacity=".55"/>';
      s += '<path d="M200 124 L200 430" stroke="#8f7a55" stroke-opacity=".45"/><path d="M150 200 C170 280 160 360 150 430 M250 200 C232 280 242 360 252 430" stroke="#fff6e2" stroke-opacity=".45" stroke-width="5" fill="none"/>';
      s += '<path d="M70 330 L104 338 L102 350 L68 342 Z M330 330 L296 338 L298 350 L332 342 Z" fill="#fff6e2" opacity=".7"/>';
      return s;
    },
    /* Meridian High-Waist Wide Silk Trousers */
    trouser: function (id, p, r) {
      var s = '<defs>' + grad(id + 't', '#3a3a40', '#08080a', { x1: 0, y1: 0, x2: 1, y2: 1 }) + '</defs>';
      s += '<path d="M138 70 L262 70 L266 110 L134 110 Z" fill="#1c1c20" stroke="' + G + '" stroke-opacity=".5"/>';
      s += '<path d="M134 110 L266 110 L330 484 L212 484 L200 230 L188 484 L70 484 Z" fill="url(#' + id + 't)"/>';
      s += '<path d="M170 110 C176 220 150 360 120 484 M230 110 C224 220 250 360 280 484" stroke="#5a5a62" stroke-opacity=".6" stroke-width="2" fill="none"/>';
      s += '<path d="M100 300 C110 380 96 440 84 484 M300 300 C292 380 306 440 316 484" stroke="#d8d2c4" stroke-opacity=".12" stroke-width="6" fill="none"/>';
      return s;
    },
    /* Aurelia Liquid Silk-Velvet Evening Gown: asymmetric neckline, one unbroken fall */
    gown: function (id, p, r) {
      var s = '<defs>' + grad(id + 'v', '#6b4a2e', '#170d07') + grad(id + 'v2', '#3e2716', '#0c0704', { x1: 1, y1: 0, x2: 0, y2: 1 }) + '</defs>';
      s += '<path d="M182 70 L236 92 C246 120 244 150 236 186 C262 260 300 360 338 484 L92 484 C122 380 146 290 166 200 C156 150 164 104 182 70 Z" fill="url(#' + id + 'v)"/>';
      s += '<path d="M236 186 C272 262 306 360 338 484 L262 484 C258 380 246 280 214 200 Z" fill="url(#' + id + 'v2)" opacity=".9"/>';
      s += '<path d="M182 70 L236 92" stroke="' + G + '" stroke-opacity=".6" stroke-width="2"/>';
      s += '<path d="M190 120 C184 240 160 360 132 484" stroke="#e9c99a" stroke-opacity=".22" stroke-width="14" fill="none"/><path d="M214 150 C222 260 236 380 248 484" stroke="#f3dcb4" stroke-opacity=".12" stroke-width="8" fill="none"/>';
      return s;
    },
    /* Solstice Draped Garnet Midi Dress: satin twill, one twist at the waist */
    lace: function (id, p, r) {
      var s = '<defs>' + grad(id + 'v', '#8a2236', '#240709') + lacePattern(id + 'l', 26) + '</defs>';
      s += '<path d="M168 70 C150 96 150 140 176 196 C186 214 190 226 172 252 C140 330 120 400 100 484 L330 484 C312 400 276 330 236 262 C214 230 216 214 226 196 C252 150 250 96 232 70 Z" fill="url(#' + id + 'v)"/>';
      s += '<path d="M150 300 C140 380 124 440 112 484 M266 300 C290 380 306 440 318 484" stroke="#c05a6c" stroke-opacity=".22" stroke-width="10" fill="none"/>';
      s += '<path d="M174 232 C200 250 230 232 252 262" stroke="' + G2 + '" stroke-opacity=".55" stroke-width="2" fill="none"/><path d="M172 252 C204 232 232 258 238 262" stroke="#13040a" stroke-opacity=".7" stroke-width="5" fill="none"/>';
      return s;
    },
    /* Ceylon Rosette 3D Sculpted Mullet Gown: short in front, long train behind */
    mullet: function (id, p, r) {
      var s = '<defs>' + grad(id + 'i', '#f8f3e6', '#c9bb98') + grad(id + 'j', '#ebe3cf', '#a89972', { x1: 1, y1: 0, x2: 0, y2: 1 }) + '</defs>';
      s += '<path d="M194 240 C150 330 92 420 44 484 L372 484 C336 420 286 330 240 240 Z" fill="url(#' + id + 'j)"/>';
      s += wave(44, 484, 328, 8, 14, '#f6efdc', 2.4);
      s += '<path d="M200 66 C170 88 160 128 168 176 C156 236 146 296 150 342 C182 358 232 348 254 330 C258 290 246 236 232 176 C240 128 230 88 200 66 Z" fill="url(#' + id + 'i)"/>';
      s += '<path d="M150 342 C182 358 232 348 254 330" stroke="#9b8c68" stroke-opacity=".5" stroke-width="2" fill="none"/>';
      s += '<path d="M176 346 L170 470 L192 470 L198 352 Z M218 346 L226 470 L248 470 L240 340 Z" fill="#8d6a4c" opacity=".8"/>';
      s += rosette(192, 150, 40, '#faf6ea', '#e3d8bd') + rosette(226, 202, 32, '#faf6ea', '#e3d8bd') + rosette(178, 252, 34, '#faf6ea', '#e3d8bd') + rosette(220, 300, 28, '#faf6ea', '#e3d8bd');
      s += rosette(130, 410, 46, '#f3ecd8', '#d8ccae') + rosette(236, 434, 54, '#f3ecd8', '#d8ccae') + rosette(300, 372, 36, '#f3ecd8', '#d8ccae');
      return s;
    },
    /* Alabaster Bias-Cut Mulberry Silk Slip Dress (column form) */
    column: function (id, p, r) {
      var s = '<defs>' + grad(id + 'a', '#f5f0e3', '#bcb092', { x1: 0, y1: 0, x2: 1, y2: 1 }) + '</defs>';
      s += '<path d="M152 130 C152 100 178 92 190 88 L210 88 C222 92 248 100 248 130 Z" fill="#8d6a4c" opacity=".85"/>';
      s += '<path d="M146 128 C170 112 230 112 254 128 L262 206 C270 300 276 390 286 484 L114 484 C124 390 130 300 138 206 Z" fill="url(#' + id + 'a)"/>';
      s += '<path d="M146 128 C172 150 228 150 254 128" stroke="#fff" stroke-opacity=".7" stroke-width="3" fill="none"/>';
      s += '<path d="M180 156 C172 300 166 400 160 484" stroke="#fff" stroke-opacity=".38" stroke-width="12" fill="none"/><path d="M226 170 C232 300 238 400 246 484" stroke="#8f836a" stroke-opacity=".35" stroke-width="8" fill="none"/>';
      s += '<path d="M240 372 L268 484" stroke="#7d7258" stroke-opacity=".6" stroke-width="2"/>';
      for (var i = 0; i < 9; i++) { var t = i / 8; s += '<circle cx="' + (154 + t * 92).toFixed(0) + '" cy="' + (134 + Math.sin(t * Math.PI) * 14).toFixed(0) + '" r="2.4" fill="#fffdf6" stroke="#cbbf9f" stroke-width=".6"/>'; }
      return s;
    },
    /* asymmetric silk midi (reserved form) */
    silkmidi: function (id, p, r) {
      var s = '<defs>' + grad(id + 'k', '#34343a', '#050506', { x1: 0, y1: 0, x2: 1, y2: 1 }) + '</defs>';
      s += '<path d="M150 118 C150 96 176 88 190 86 L212 86 C224 90 248 100 248 126 Z" fill="#8d6a4c" opacity=".85"/>';
      s += '<path d="M176 80 L204 72 C216 104 224 142 226 178 C252 232 280 304 308 388 C246 420 170 440 108 424 C122 338 150 252 170 182 C168 134 170 104 176 80 Z" fill="url(#' + id + 'k)"/>';
      s += '<path d="M170 242 C206 228 244 266 284 252 L290 282 C246 298 208 262 166 282 Z" fill="#050506" stroke="' + G + '" stroke-opacity=".4"/>';
      s += '<path d="M182 120 C176 220 156 320 126 418" stroke="#9ca0ac" stroke-opacity=".28" stroke-width="9" fill="none"/><path d="M230 210 C262 280 286 340 300 390" stroke="#9ca0ac" stroke-opacity=".22" stroke-width="7" fill="none"/>';
      s += '<path d="M108 424 C170 440 246 420 308 388" stroke="' + G + '" stroke-opacity=".5" stroke-width="2" fill="none"/>';
      s += '<path d="M150 424 L146 480 L168 480 L176 436 Z M218 410 L226 480 L248 480 L246 400 Z" fill="#8d6a4c" opacity=".8"/>';
      return s;
    },
    /* Meridian Structured Ivory Tailored Blazer */
    blazer: function (id, p, r) {
      var s = '<defs>' + grad(id + 'w', '#f7f2e5', '#c9bd9c', { x1: 0, y1: 0, x2: 1, y2: 1 }) + grad(id + 's', '#fffbf1', '#d3c6a4') + '</defs>';
      s += '<path d="M128 100 L84 160 L58 332 L98 340 L126 204 Z M272 100 L316 160 L342 332 L302 340 L274 204 Z" fill="url(#' + id + 'w)" stroke="#a89972" stroke-opacity=".5"/>';
      s += '<path d="M128 100 L200 74 L272 100 L292 352 L108 352 Z" fill="url(#' + id + 'w)" stroke="#a89972" stroke-opacity=".45"/>';
      s += '<path d="M200 74 L148 196 L200 264 L216 190 Z" fill="url(#' + id + 's)" stroke="' + G + '" stroke-opacity=".6"/><path d="M200 74 L252 196 L200 264 L184 190 Z" fill="url(#' + id + 's)" stroke="' + G + '" stroke-opacity=".6"/>';
      s += '<circle cx="200" cy="262" r="4" fill="' + G + '"/><path d="M200 264 L200 340" stroke="#a89972" stroke-opacity=".6"/>';
      return s;
    },
    /* tailored mini (reserved form) */
    mini: function (id, p, r) {
      var s = '<defs>' + grad(id + 'n', '#2e2e33', '#0a0a0b', { x1: 0, y1: 0, x2: 1, y2: 1 }) + grad(id + 'e', '#17604a', '#082a20') + '</defs>';
      s += '<path d="M158 340 L148 482 L176 482 L186 340 Z M214 340 L222 482 L252 482 L244 340 Z" fill="#8d6a4c" opacity=".82"/>';
      s += '<path d="M164 100 C176 90 224 90 236 100 L248 176 C254 230 264 282 272 340 L128 340 C136 282 146 230 152 176 Z" fill="url(#' + id + 'n)"/>';
      s += '<path d="M200 130 L200 340" stroke="#000" stroke-opacity=".4"/><path d="M176 190 C174 240 168 290 160 338" stroke="#8c8f98" stroke-opacity=".22" stroke-width="8" fill="none"/>';
      s += '<path d="M156 102 C182 132 218 132 244 102 L250 126 C222 156 178 156 150 126 Z" fill="url(#' + id + 'e)" stroke="' + G + '" stroke-opacity=".5"/>';
      s += '<path d="M214 144 C246 206 246 270 226 346 L250 340 C268 268 266 204 238 138 Z" fill="url(#' + id + 'e)" stroke="' + G + '" stroke-opacity=".45"/>';
      return s;
    },
    /* Nocturne Hand-Beaded Sheer Organza Cape Top */
    cape: function (id, p, r) {
      var s = '<defs>' + grad(id + 'c', '#f1e6c9', '#a89874') + lacePattern(id + 'l', 20) + '</defs>';
      s += '<path d="M170 88 C152 200 142 340 134 484 L266 484 C258 340 248 200 230 88 Z" fill="#0E0D0C" opacity=".7"/>';
      var cape = 'M200 62 C150 68 100 108 72 200 C56 300 50 400 36 484 L364 484 C350 400 344 300 328 200 C300 108 250 68 200 62 Z';
      s += '<path d="' + cape + '" fill="url(#' + id + 'c)" opacity=".3"/><path d="' + cape + '" fill="url(#' + id + 'l)"/>';
      s += wave(36, 484, 328, 12, 10, '#f1e6c9', 2);
      s += '<path d="M200 70 L200 484" stroke="' + G + '" stroke-opacity=".3" stroke-dasharray="6 6"/>';
      s += '<circle cx="200" cy="96" r="6" fill="url(#' + id + 'c)" stroke="' + G + '"/><path d="M194 100 C186 118 214 118 206 100" stroke="' + G + '" stroke-width="2" fill="none"/>';
      return s;
    }
  };

  function lacePattern(id, sz) {
    var h = sz / 2;
    return '<pattern id="' + id + '" width="' + sz + '" height="' + sz + '" patternUnits="userSpaceOnUse"><circle cx="' + h + '" cy="' + h + '" r="' + (sz * 0.33) + '" fill="none" stroke="' + G + '" stroke-opacity=".6"/><circle cx="0" cy="0" r="' + (sz * 0.33) + '" fill="none" stroke="' + G + '" stroke-opacity=".4"/><circle cx="' + sz + '" cy="' + sz + '" r="' + (sz * 0.33) + '" fill="none" stroke="' + G + '" stroke-opacity=".4"/><path d="M' + h + ' ' + (h - sz * 0.33) + ' q' + (sz * 0.18) + ' ' + (sz * 0.33) + ' 0 ' + (sz * 0.66) + ' q-' + (sz * 0.18) + ' -' + (sz * 0.33) + ' 0 -' + (sz * 0.66) + '" fill="' + G + '" opacity=".35"/></pattern>';
  }

  /* back-view overlays, drawn on top of the mirrored silhouette */
  var backs = {
    gown: function () { return '<path d="M200 90 L200 470" stroke="' + G2 + '" stroke-opacity=".5" stroke-dasharray="3 5"/>'; },
    column: function (id) {
      return '<path d="M200 206 L126 168 L134 240 Z M200 206 L274 168 L266 240 Z" fill="#faf6ea" stroke="#9b8c68" stroke-width="1.2"/><path d="M200 206 L134 240 L200 214 Z" fill="#d9ceb0"/><path d="M200 206 L266 240 L200 214 Z" fill="#d9ceb0"/><rect x="190" y="198" width="20" height="22" fill="#efe8d4" stroke="#9b8c68"/><path d="M196 220 L168 330 L186 336 L204 226 Z M204 220 L232 330 L214 336 L196 226 Z" fill="#f2ecdc" stroke="#9b8c68"/>';
    },
    mullet: function () { return '<path d="M200 120 L200 250" stroke="#9b8c68" stroke-opacity=".55"/>' + wave(70, 470, 260, 6, 12, '#fffaf0', 2); },
    silkmidi: function () { return '<path d="M200 90 L200 330" stroke="#000" stroke-opacity=".5"/>'; },
    mini: function () { return '<path d="M200 100 L200 340" stroke="' + G + '" stroke-opacity=".5"/>'; },
    cape: function () { return '<path d="M120 200 C150 250 250 250 280 200" stroke="' + G2 + '" stroke-opacity=".55" fill="none" stroke-width="2"/>'; },
    blazer: function () { return '<path d="M200 74 L200 340" stroke="#a89972" stroke-opacity=".6"/><path d="M140 110 C180 150 220 150 260 110" stroke="#a89972" stroke-opacity=".6" fill="none"/>'; }
  };

  function satin(id, a, b, hi) {
    var s = '<defs>' + grad(id + 'w', a, b, { x1: 0, y1: 0, x2: 1, y2: 1 }) + '</defs><rect width="400" height="500" fill="url(#' + id + 'w)"/>';
    for (var i = 0; i < 9; i++) s += '<path d="M-20 ' + (i * 60 + 10) + ' C100 ' + (i * 60 - 40) + ' 260 ' + (i * 60 + 80) + ' 420 ' + (i * 60 + 10) + '" stroke="' + hi + '" stroke-opacity=".5" stroke-width="14" fill="none"/><path d="M-20 ' + (i * 60 + 38) + ' C100 ' + (i * 60 - 12) + ' 260 ' + (i * 60 + 108) + ' 420 ' + (i * 60 + 38) + '" stroke="#000" stroke-opacity=".16" stroke-width="6" fill="none"/>';
    return s;
  }

  var details = {
    shirt: function (id) {
      var s = satin(id, '#efe2c6', '#b59d74', '#fff8e8');
      for (var i = 0; i < 4; i++) s += '<circle cx="200" cy="' + (110 + i * 90) + '" r="9" fill="#f6efe2" stroke="' + G + '" stroke-opacity=".7"/>';
      return s + '<path d="M200 0 L200 500" stroke="#8f7a55" stroke-opacity=".5" stroke-width="2"/>';
    },
    trouser: function (id) {
      var s = satin(id, '#2c2c31', '#09090b', '#4a4a52');
      return s + '<path d="M150 0 C160 160 140 330 120 500 M250 0 C240 160 262 330 282 500" stroke="#000" stroke-opacity=".45" stroke-width="6" fill="none"/>';
    },
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
    mullet: function (id, p, r) {
      var s = satin(id, '#f1e9d4', '#9f8f69', '#fffaf0');
      s += rosette(150, 190, 220, '#fbf7ec', '#e3d8bd') + rosette(318, 360, 150, '#f6efdc', '#d8ccae') + rosette(70, 410, 100, '#f6efdc', '#d8ccae');
      return s;
    },
    column: function (id) {
      var s = satin(id, '#f8f4ea', '#b7ab8d', '#ffffff');
      s += '<path d="M0 360 L400 360 L400 410 L0 410 Z" fill="#fff" opacity=".35"/>';
      for (var i = 0; i < 7; i++) s += '<circle cx="' + (40 + i * 54) + '" cy="385" r="16" fill="#fffdf6" stroke="#c9bfa5" stroke-width="1.4"/><circle cx="' + (34 + i * 54) + '" cy="379" r="4" fill="#fff"/>';
      s += '<path d="M200 100 L130 60 L136 150 Z M200 100 L270 60 L264 150 Z" fill="#efe8d4" stroke="#9b8c68" stroke-width="2"/><rect x="186" y="90" width="28" height="30" fill="#e4dcc4" stroke="#9b8c68" stroke-width="2"/>';
      return s;
    },
    silkmidi: function (id, p, r) {
      var s = '<defs>' + grad(id + 'k', '#2c2c32', '#050506', { x1: 0, y1: 0, x2: 1, y2: 1 }) + '</defs><rect width="400" height="500" fill="url(#' + id + 'k)"/>';
      for (var i = 0; i < 12; i++) s += '<path d="M-20 ' + (i * 46) + ' C100 ' + (i * 46 + 60) + ' 280 ' + (i * 46 - 50) + ' 420 ' + (i * 46 + 24) + '" stroke="#b3b6c2" stroke-opacity="' + (0.1 + (i % 3) * 0.08).toFixed(2) + '" stroke-width="' + (6 + (i % 4) * 5) + '" fill="none"/>';
      s += '<path d="M-10 400 C120 340 260 440 410 330" stroke="' + G2 + '" stroke-width="3" fill="none" opacity=".6"/>';
      return s;
    },
    mini: function (id) {
      var s = '<defs>' + grad(id + 'n', '#2a2a2f', '#0E0D0C', { x1: 0, y1: 0, x2: 1, y2: 1 }) + grad(id + 'e', '#17604a', '#082a20') + '</defs><rect width="400" height="500" fill="url(#' + id + 'n)"/>';
      for (var i = -12; i < 40; i++) s += '<path d="M' + (i * 14) + ' 0 L' + (i * 14 + 200) + ' 500" stroke="#3a3a40" stroke-opacity=".5" stroke-width="2"/>';
      s += '<path d="M-10 90 C140 130 250 70 410 170 L410 330 C250 250 140 330 -10 270 Z" fill="url(#' + id + 'e)" stroke="' + G + '" stroke-opacity=".5"/>';
      s += '<path d="M-10 150 C140 190 250 130 410 230" stroke="#4aa386" stroke-opacity=".35" stroke-width="6" fill="none"/>';
      return s;
    },
    cape: function (id, p, r) {
      var s = '<defs>' + lacePattern(id + 'l', 54) + grad(id + 'g', '#f6dc9c', '#8f6f2b') + '</defs><rect width="400" height="500" fill="#16110a"/><rect width="400" height="500" fill="url(#' + id + 'l)"/>';
      for (var i = 0; i < 10; i++) s += '<path d="M-10 ' + (i * 54) + ' C120 ' + (i * 54 + 40) + ' 280 ' + (i * 54 - 30) + ' 410 ' + (i * 54 + 14) + '" stroke="#f1e6c9" stroke-opacity=".13" stroke-width="10" fill="none"/>';
      s += '<circle cx="200" cy="250" r="34" fill="url(#' + id + 'g)"/><path d="M178 262 C170 310 230 310 222 262" stroke="url(#' + id + 'g)" stroke-width="10" fill="none"/>';
      return s;
    },
    blazer: function (id) {
      var s = satin(id, '#f7f2e5', '#bdb090', '#ffffff');
      s += wave(-10, 150, 420, 8, 26, '#9b8c68', 3) + wave(-10, 200, 420, 8, 26, '#b2a47f', 2) + wave(-10, 250, 420, 8, 26, '#b2a47f', 1.4);
      s += '<g transform="translate(112 376) scale(.19)" color="' + G + '"><rect x="-26" y="-26" width="470" height="150" fill="#0E0D0C" stroke="' + G + '" stroke-opacity=".6" stroke-width="3"/><use href="#wm-paths" transform="translate(-122 -35) translate(8 14) scale(.5)"/></g>';
      return s;
    }
  };

  var fineLayer = {
    shirt: function (id) { return '<pattern id="' + id + 'f" width="5" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(80)"><path d="M0 0 L0 12" stroke="#fff" stroke-opacity=".3" stroke-width=".8"/></pattern>'; },
    trouser: function (id) { return '<pattern id="' + id + 'f" width="4" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(75)"><path d="M0 0 L0 12" stroke="#b3b6c2" stroke-opacity=".2" stroke-width=".8"/></pattern>'; },
    gown: function (id) { return '<pattern id="' + id + 'f" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(25)"><path d="M0 0 L0 9" stroke="#e98aa0" stroke-opacity=".28" stroke-width=".8"/><path d="M4.5 0 L4.5 9" stroke="#000" stroke-opacity=".22" stroke-width=".8"/></pattern>'; },
    lace: function (id) { return '<pattern id="' + id + 'f" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r=".7" fill="' + G2 + '" opacity=".55"/></pattern>'; },
    mullet: function (id) { return '<pattern id="' + id + 'f" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><path d="M0 0 L0 6" stroke="#fff" stroke-opacity=".35" stroke-width=".8"/></pattern>'; },
    column: function (id) { return '<pattern id="' + id + 'f" width="3" height="14" patternUnits="userSpaceOnUse"><path d="M0 0 L0 14" stroke="#fff" stroke-opacity=".5" stroke-width=".8"/></pattern>'; },
    silkmidi: function (id) { return '<pattern id="' + id + 'f" width="4" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(70)"><path d="M0 0 L0 12" stroke="#b3b6c2" stroke-opacity=".22" stroke-width=".8"/></pattern>'; },
    mini: function (id) { return '<pattern id="' + id + 'f" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0 L0 5" stroke="#8a8a92" stroke-opacity=".3" stroke-width=".9"/></pattern>'; },
    cape: function (id) { return '<pattern id="' + id + 'f" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3.5" cy="3.5" r=".8" fill="' + G2 + '" opacity=".5"/></pattern>'; },
    blazer: function (id) { return '<pattern id="' + id + 'f" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 0 L4 0 M0 0 L0 4" stroke="#a79e86" stroke-opacity=".3" stroke-width=".6"/></pattern>'; }
  };

  function bgFor(id, p) {
    var s = '<defs>' + grad(id + 'bg', p.palette[0], p.palette[1], { x1: 0.2, y1: 0, x2: 0.8, y2: 1 }) + beam(id + 'bm', 0.2) + '</defs>';
    s += '<rect width="400" height="500" fill="url(#' + id + 'bg)"/>';
    return s;
  }

  /* views: form (front), back, detail (4x macro), move (drape in motion) */
  var VLABEL = { form: 'front view', back: 'back view', detail: 'bodice and textile macro', move: 'drape in motion' };
  function plate(product, view) {
    var p = product, id = 'p' + (++n) + '_';
    var rnd = seeded(p.id.length * 97 + (view === 'move' ? 13 : view === 'detail' ? 31 : view === 'back' ? 57 : 3));
    var label = p.name + ', ' + (VLABEL[view] || 'portrait');
    var inner = '';
    var fine = '<defs>' + fineLayer[p.kind](id) + '</defs><rect class="fine" width="400" height="500" fill="url(#' + id + 'f)"/>';
    if (view === 'detail') {
      inner = details[p.kind](id, p, rnd, p.variant) + fine + '<polygon points="0,0 400,0 400,500" fill="url(#' + id + 'bm)" opacity=".5"/>';
      inner = '<defs>' + beam(id + 'bm', 0.22) + '</defs>' + inner;
    } else {
      var obj = forms[p.kind](id, p, rnd, p.variant);
      inner = bgFor(id, p) + '<polygon points="40,0 190,0 400,420 400,500 300,500" fill="url(#' + id + 'bm)"/>';
      if (view === 'back') {
        inner += '<g transform="translate(400 0) scale(-1 1)">' + obj + '</g><g>' + (backs[p.kind] ? backs[p.kind](id) : '') + '</g>';
      } else if (view === 'move') {
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
    var prod = M.PRODUCTS.filter(function (x) { return item.product ? x.id === item.product : x.kind === item.kind; })[0];
    return plate(prod, item.view || 'form');
  }

  function look(item) {
    var id = 'l' + (++n) + '_', r = seeded(item.id.length * 53), s = '';
    if (item.kind === 'courtyard') {
      s = '<defs>' + grad(id + 'w', '#d9c29a', '#5b452a') + grad(id + 'f', '#8a6a42', '#2a1d10') + beam(id + 'b', .38) + '</defs><rect width="400" height="500" fill="url(#' + id + 'w)"/>';
      s += '<path d="M0 500 L0 150 C0 70 80 40 100 40 C120 40 200 70 200 150 L200 500 Z" fill="#2a1d10" opacity=".55"/><path d="M200 500 L200 150 C200 70 280 40 300 40 C320 40 400 70 400 150 L400 500 Z" fill="#2a1d10" opacity=".4"/>';
      s += '<rect y="400" width="400" height="100" fill="url(#' + id + 'f)"/><circle cx="330" cy="130" r="48" fill="#ffd994" opacity=".7"/><polygon points="330,130 160,500 400,500 400,260" fill="url(#' + id + 'b)"/>';
      s += '<path d="M140 150 C100 230 70 330 52 460 L196 460 C184 340 176 240 160 150 Z" fill="#f4eee0"/><path d="M114 220 C80 270 60 340 52 460" stroke="#fff" stroke-width="10" fill="none" opacity=".6"/><circle cx="150" cy="118" r="16" fill="#8d6a4c"/>';
      s += '<path d="M276 130 C262 190 272 330 244 460 L338 460 C318 330 330 190 312 130 C300 122 288 122 276 130 Z" fill="#0E0D0C"/><path d="M276 132 C290 170 300 250 306 460" stroke="' + G + '" stroke-opacity=".45" stroke-width="2" fill="none"/><circle cx="294" cy="106" r="15" fill="#6d4e36"/>';
    } else if (item.kind === 'studio') {
      s = '<defs>' + grad(id + 'b', '#2b2b2f', '#0a0a0b') + grad(id + 'i', '#f7f2e5', '#c9bd9c', { x1: 0, y1: 0, x2: 1, y2: 1 }) + lacePattern(id + 'l', 18) + '</defs><rect width="400" height="500" fill="url(#' + id + 'b)"/><path d="M0 410 C100 390 200 430 400 400 L400 500 L0 500Z" fill="#050506"/><path d="M0 410 C100 390 200 430 400 400" stroke="' + G + '" stroke-opacity=".6" fill="none"/>';
      s += '<path d="M200 330 L200 450 M150 456 L250 456" stroke="#8c8f98" stroke-opacity=".6" stroke-width="5"/><path d="M164 120 C152 190 158 260 172 330 L228 330 C242 260 248 190 236 120 C220 108 180 108 164 120 Z" fill="url(#' + id + 'i)"/><path d="M168 280 L232 280 C262 306 270 340 264 366 q-14 -12 -30 0 t-30 0 t-30 0 q-12 -12 -26 0 C128 340 138 306 168 280 Z" fill="url(#' + id + 'i)" stroke="#a89972" stroke-opacity=".6"/>';
      s += '<path d="M200 120 L168 204 L200 262 L214 200 Z M200 120 L232 204 L200 262 L186 200 Z" fill="#fffbf1" stroke="' + G + '" stroke-opacity=".6"/>';
      s += '<path d="M150 124 C80 190 64 320 52 450 L150 450 C150 340 158 230 170 150 Z" fill="#f1e6c9" opacity=".3"/><path d="M150 124 C80 190 64 320 52 450 L150 450 C150 340 158 230 170 150 Z" fill="url(#' + id + 'l)"/>';
      for (var q = 0; q < 6; q++) s += '<circle cx="' + (176 + q * 10) + '" cy="' + (290 + (q % 2) * 5) + '" r="2" fill="' + G + '"/>';
      s += '<polygon points="0,0 200,0 400,300 400,500" fill="#f3d8a0" opacity=".05"/>';
    } else if (item.kind === 'table') {
      s = '<defs>' + grad(id + 'w', '#7a5535', '#3b2615') + beam(id + 'b', .35) + '</defs><rect width="400" height="500" fill="url(#' + id + 'w)"/>';
      for (var i = 0; i < 14; i++) s += '<path d="M0 ' + (i * 38) + ' C130 ' + (i * 38 - 8) + ' 260 ' + (i * 38 + 8) + ' 400 ' + (i * 38) + '" stroke="#2a1a0d" stroke-opacity=".35" fill="none"/>';
      s += '<rect x="50" y="120" width="300" height="250" fill="#f2ead7" transform="rotate(-4 200 245)"/>';
      s += '<g transform="rotate(-4 200 245)">' + petals(150, 230, 5, 46, 20, r) + petals(244, 280, 6, 36, 60, r) + '<path d="M80 320 C140 290 200 330 320 300" stroke="' + G2 + '" stroke-width="4" stroke-linecap="round" fill="none"/></g>';
      s += '<path d="M280 150 L360 80" stroke="#0E0D0C" stroke-width="10"/><path d="M280 150 L296 168" stroke="' + G + '" stroke-width="10"/>';
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
    var shot1 = '<defs>' + grad('f1v', '#4a121c', '#0E0D0C', { x1: 0, y1: 1, x2: 1, y2: 0 }) + '<linearGradient id="f1s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd994" stop-opacity="0"/><stop offset=".5" stop-color="#ffd994" stop-opacity=".34"/><stop offset="1" stop-color="#ffd994" stop-opacity="0"/></linearGradient></defs><rect width="1600" height="900" fill="url(#f1v)"/>';
    for (var i = 0; i < 18; i++) { var y = r() * 950; shot1 += '<path d="M-40 ' + y.toFixed(0) + ' C400 ' + (y - 80 + r() * 160).toFixed(0) + ' 1000 ' + (y + 60).toFixed(0) + ' 1700 ' + (y - 40 + r() * 80).toFixed(0) + '" stroke="#b8344c" stroke-opacity=".13" stroke-width="' + (2 + r() * 8).toFixed(1) + '" fill="none"/>'; }
    for (var k = 0; k < 7; k++) { var yy = 120 + k * 110 + r() * 40; shot1 += '<path d="M' + (120 + r() * 200).toFixed(0) + ' ' + yy.toFixed(0) + ' C600 ' + (yy - 90).toFixed(0) + ' 1000 ' + (yy + 90).toFixed(0) + ' ' + (1300 + r() * 220).toFixed(0) + ' ' + (yy - 20).toFixed(0) + '" stroke="' + (k % 2 ? G : G2) + '" stroke-opacity=".55" stroke-width="' + (3 + r() * 7).toFixed(1) + '" stroke-linecap="round" fill="none"/>'; }
    shot1 += '<polygon points="520,0 980,0 1360,900 760,900" fill="url(#f1s)" class="sweep"/>';

    var shot2 = '<defs>' + grad('f2w', '#d9c29a', '#4f3a22') + '<radialGradient id="f2sun" cx=".78" cy=".3" r=".7"><stop offset="0" stop-color="#ffe1a6" stop-opacity=".95"/><stop offset=".4" stop-color="#e7b96b" stop-opacity=".35"/><stop offset="1" stop-color="#e7b96b" stop-opacity="0"/></radialGradient></defs><rect width="1600" height="900" fill="url(#f2w)"/><rect width="1600" height="900" fill="url(#f2sun)"/>';
    for (var a = 0; a < 4; a++) { var ax = 40 + a * 400; shot2 += '<path d="M' + ax + ' 900 L' + ax + ' 360 C' + ax + ' 190 ' + (ax + 360) + ' 190 ' + (ax + 360) + ' 360 L' + (ax + 360) + ' 900 Z" fill="#2a1d10" opacity="' + (0.5 - a * 0.06).toFixed(2) + '"/>'; }
    shot2 += '<rect y="740" width="1600" height="160" fill="#2a1d10" opacity=".6"/>';
    shot2 += '<g class="sway"><path d="M520 250 C430 400 380 600 350 790 L690 790 C660 600 620 400 570 250 Z" fill="#f4eee0" opacity=".96"/><path d="M470 330 C420 460 400 620 390 790" stroke="#fff" stroke-width="22" opacity=".5" fill="none"/></g><circle cx="545" cy="206" r="34" fill="#8d6a4c"/>';
    shot2 += '<g class="sway"><path d="M1100 250 C1040 400 1010 600 980 790 L1240 790 C1210 600 1170 400 1130 250 Z" fill="#0E0D0C"/><path d="M1070 330 C1040 460 1020 620 1010 790" stroke="' + G + '" stroke-opacity=".5" stroke-width="6" fill="none"/></g><circle cx="1116" cy="206" r="32" fill="#6d4e36"/>';

    var shot3 = '<defs><radialGradient id="f3m" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#f0cf84" stop-opacity=".9"/><stop offset="1" stop-color="#f0cf84" stop-opacity="0"/></radialGradient>' + grad('f3v', '#6a1a2b', '#14050a', { x1: 0, y1: 0, x2: 1, y2: 1 }) + '</defs><rect width="1600" height="900" fill="url(#f3v)"/>';
    for (var q = 0; q < 16; q++) { var qy = r() * 950; shot3 += '<path d="M-40 ' + qy.toFixed(0) + ' C400 ' + (qy - 80 + r() * 160).toFixed(0) + ' 1000 ' + (qy + 60).toFixed(0) + ' 1700 ' + (qy - 40 + r() * 80).toFixed(0) + '" stroke="#b8344c" stroke-opacity=".12" stroke-width="' + (2 + r() * 8).toFixed(1) + '" fill="none"/>'; }
    shot3 += petals(520, 420, 6, 520, 8, r) + petals(1120, 560, 5, 380, 40, r) + petals(1380, 220, 5, 220, 0, r);
    shot3 += '<path d="M120 300 C520 180 980 360 1500 200" stroke="' + G2 + '" stroke-width="12" stroke-linecap="round" fill="none" opacity=".75"/><ellipse cx="900" cy="450" rx="520" ry="330" fill="url(#f3m)" opacity=".2" class="glint"/>';
    shot3 += '<g class="mist">';
    for (var m = 0; m < 34; m++) shot3 += '<circle cx="' + (80 + r() * 1440).toFixed(0) + '" cy="' + (60 + r() * 780).toFixed(0) + '" r="' + (6 + r() * 20).toFixed(0) + '" fill="url(#f3m)" opacity="' + (0.25 + r() * 0.5).toFixed(2) + '" style="animation-delay:-' + (r() * 9).toFixed(1) + 's"/>';
    shot3 += '</g>';

    var shot4 = '<defs><pattern id="f4d" width="76" height="76" patternUnits="userSpaceOnUse"><path d="M38 6 L70 38 L38 70 L6 38 Z" fill="none" stroke="#26262b" stroke-width="2"/><circle cx="38" cy="38" r="5" fill="#26262b"/></pattern><linearGradient id="f4s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f6e2b0" stop-opacity="0"/><stop offset=".5" stop-color="#f6e2b0" stop-opacity=".42"/><stop offset="1" stop-color="#f6e2b0" stop-opacity="0"/></linearGradient></defs><rect width="1600" height="900" fill="#060607"/><rect width="1600" height="900" fill="url(#f4d)"/>';
    shot4 += '<g color="' + G + '" transform="translate(360 372) scale(1.18)"><use href="#wm-paths" transform="translate(-122 -35)"/></g><rect x="-400" y="0" width="560" height="900" fill="url(#f4s)" class="sweep"/>';

    return [shot1, shot2, shot3, shot4].map(function (inner, i) {
      return '<div class="shot shot--' + (i + 1) + '"><svg xmlns="http://www.w3.org/2000/svg" viewBox="' + VB + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + inner + '</svg></div>';
    }).join('');
  }

  M.Art = { plate: plate, panel: panel, look: look, film: film, esc: esc };
})();
