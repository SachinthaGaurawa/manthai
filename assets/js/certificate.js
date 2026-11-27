/* ==========================================================================
   MANTHAI  |  certificate: the official A4 Certificate of Authenticity & Ownership
   A genuine vector PDF, drawn with jsPDF. The Seal and the wordmark are traced
   from the inline brand sprite, so they stay razor sharp at any zoom; the QR is
   drawn as vector squares. jsPDF, the QR encoder and the serif faces load only
   when a client asks for a certificate.
   ========================================================================== */
(function () {
  'use strict';
  var M = window.MANTHAI, C = M.core;
  var STAMP = '20261128q';
  var INK = '#141210', UMBER = '#59534B', BRONZE = '#755A2A', GOLD = '#C9AF7E', RULE = '#DBD3C5', IVORY = '#F7F4EE', FINE = '#8E867A';
  var ready = null;

  function script(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = src; s.async = true;
      s.onload = res; s.onerror = function () { rej(new Error('Could not load ' + src)); };
      document.head.appendChild(s);
    });
  }
  function font(url) {
    return fetch(url).then(function (r) { if (!r.ok) throw new Error('Font ' + url); return r.arrayBuffer(); }).then(function (buf) {
      var b = new Uint8Array(buf), s = '', CH = 0x8000;
      for (var i = 0; i < b.length; i += CH) s += String.fromCharCode.apply(null, b.subarray(i, i + CH));
      return btoa(s);
    });
  }
  function load() {
    if (ready) return ready;
    ready = Promise.all([
      window.jspdf ? null : script('/assets/vendor/jspdf.umd.min.js?v=' + STAMP),
      window.qrcode ? null : script('/assets/vendor/qrcode-generator.js?v=' + STAMP),
      font('/assets/fonts/pdf-cormorant-400.ttf'),
      font('/assets/fonts/pdf-cormorant-italic-400.ttf'),
      font('/assets/fonts/pdf-tenor-sans-400.ttf')
    ]).then(function (r) { return { serif: r[2], serifItalic: r[3], sans: r[4] }; })
      .catch(function (e) { ready = null; throw e; });
    return ready;
  }

  /* ---------- SVG path tracing (the sprite uses absolute M L C Q Z only) ---------- */
  function trace(d, tx, ty, s, ox, oy) {
    var tok = d.match(/[MLCQZ]|-?\d*\.?\d+(?:e-?\d+)?/gi) || [], i = 0, ops = [], cmd = '', cx = 0, cy = 0, sx = 0, sy = 0;
    function n() { return parseFloat(tok[i++]); }
    function X(v) { return ox + (v + tx) * s; }
    function Y(v) { return oy + (v + ty) * s; }
    while (i < tok.length) {
      if (/^[A-Za-z]$/.test(tok[i])) cmd = tok[i++].toUpperCase();
      if (cmd === 'M') { cx = n(); cy = n(); sx = cx; sy = cy; ops.push({ op: 'm', c: [X(cx), Y(cy)] }); cmd = 'L'; }
      else if (cmd === 'L') { cx = n(); cy = n(); ops.push({ op: 'l', c: [X(cx), Y(cy)] }); }
      else if (cmd === 'C') { var a = n(), b = n(), c = n(), e = n(); cx = n(); cy = n(); ops.push({ op: 'c', c: [X(a), Y(b), X(c), Y(e), X(cx), Y(cy)] }); }
      else if (cmd === 'Q') {
        var qx = n(), qy = n(), ex = n(), ey = n();
        ops.push({ op: 'c', c: [X(cx + 2 / 3 * (qx - cx)), Y(cy + 2 / 3 * (qy - cy)), X(ex + 2 / 3 * (qx - ex)), Y(ey + 2 / 3 * (qy - ey)), X(ex), Y(ey)] });
        cx = ex; cy = ey;
      }
      else if (cmd === 'Z') { ops.push({ op: 'h', c: [] }); cx = sx; cy = sy; cmd = ''; }
      else { i++; }
    }
    return ops;
  }
  function translateOf(el) {
    var m = /translate\(\s*(-?[\d.]+)[ ,]+(-?[\d.]+)\s*\)/.exec(el.getAttribute('transform') || '');
    return m ? [parseFloat(m[1]), parseFloat(m[2])] : [0, 0];
  }
  /* draws every shape of a sprite node, viewBox [vx vy vw vh], into a box width w at (x, y) */
  function drawSprite(doc, root, vb, x, y, w, color) {
    if (!root) return;
    var s = w / vb[2];
    doc.setFillColor(color);
    root.querySelectorAll('path, circle').forEach(function (el) {
      var tx = -vb[0], ty = -vb[1], g = el.parentNode;
      while (g && g !== root) { var t = translateOf(g); tx += t[0]; ty += t[1]; g = g.parentNode; }
      if (el.tagName.toLowerCase() === 'circle') {
        doc.circle(x + (+el.getAttribute('cx') + tx) * s, y + (+el.getAttribute('cy') + ty) * s, +el.getAttribute('r') * s, 'F');
        return;
      }
      doc.path(trace(el.getAttribute('d'), tx, ty, s, x, y)).fill();
    });
  }

  /* ---------- text helpers ---------- */
  function spaced(doc, text, size, track) { return doc.getTextWidth(text) + track * Math.max(0, text.length - 1); }
  function centred(doc, text, y, size, track, color, face, style) {
    doc.setFont(face, style || 'normal'); doc.setFontSize(size); doc.setTextColor(color);
    doc.setCharSpace(track || 0);
    doc.text(text, 105 - spaced(doc, text, size, track || 0) / 2, y);
    doc.setCharSpace(0);
  }

  /* r: { id, piece, edition, materials, origin, care, owner, steward, issued, url, sample } */
  function build(r, faces) {
    var doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4', compress: true });
    doc.addFileToVFS('Cormorant.ttf', faces.serif); doc.addFont('Cormorant.ttf', 'Cormorant', 'normal');
    doc.addFileToVFS('Cormorant-Italic.ttf', faces.serifItalic); doc.addFont('Cormorant-Italic.ttf', 'Cormorant', 'italic');
    doc.addFileToVFS('TenorSans.ttf', faces.sans); doc.addFont('TenorSans.ttf', 'Tenor', 'normal');
    doc.setProperties({ title: 'Certificate of Authenticity & Ownership ' + r.id, subject: r.piece, author: 'House of Manthai (Private) Limited', creator: 'House of MANTHAI Digital Registry', keywords: 'MANTHAI, Digital Product Passport, ' + r.id });

    /* ivory sheet, gold outer rule at 12mm, alabaster inner rule at 14.5mm */
    doc.setFillColor(IVORY); doc.rect(0, 0, 210, 297, 'F');
    doc.setDrawColor(GOLD); doc.setLineWidth(0.5 * 0.3528); doc.rect(12, 12, 186, 273, 'S');
    doc.setDrawColor(RULE); doc.setLineWidth(0.3 * 0.3528); doc.rect(14.5, 14.5, 181, 268, 'S');

    /* the Unbounded Spiral Seal, 14mm, and the official wordmark */
    var sealW = 14, sealH = sealW * 860 / 1000;
    drawSprite(doc, document.getElementById('spiral-seal'), [0, 0, 1000, 860], 105 - sealW / 2, 24, sealW, BRONZE);
    var wmW = 62, wmH = wmW * 120 / 796;
    drawSprite(doc, document.getElementById('wm-paths'), [120, 30, 796, 120], 105 - wmW / 2, 24 + sealH + 6, wmW, INK);

    var y = 24 + sealH + 6 + wmH + 9;
    centred(doc, 'HOUSE OF MANTHAI  ·  DIGITAL PRODUCT PASSPORT', y, 8, 0.9, BRONZE, 'Tenor');
    y += 11;
    centred(doc, 'Certificate of Authenticity & Ownership', y, 20, 0.15, INK, 'Cormorant');
    y += 8;
    centred(doc, 'PASSPORT ID: ' + r.id + '   ·   VERIFIED AUTHENTIC', y, 8, 0.7, UMBER, 'Tenor');
    y += 9;

    /* the record: two columns, 0.3pt alabaster dividers */
    var L = 32, V = 82, R = 178, VW = R - V;
    var rows = [
      ['Piece', r.piece],
      ['Edition Number', r.edition],
      ['Fibre Composition', r.materials],
      ['Craft Origin', r.origin],
      ['Garment Care', r.care],
      ['Registered Owner', r.owner],
      ['Issued & Certified By', 'House of Manthai (Private) Limited', 'An Avantio Ventures Company · Colombo, Sri Lanka'],
      ['Stewardship Status', r.steward],
      ['Date of Issue', r.issued]
    ];
    doc.setDrawColor(RULE); doc.setLineWidth(0.3 * 0.3528);
    doc.line(L, y, R, y);
    rows.forEach(function (row) {
      doc.setFont('Cormorant', 'normal'); doc.setFontSize(11.5);
      var lines = doc.splitTextToSize(String(row[1] || ''), VW), lh = 11.5 * 0.3528 * 1.32;
      var sub = row[2], h = lines.length * lh + (sub ? 4.2 : 0) + 6.4, top = y + 4.6;
      doc.setFont('Tenor', 'normal'); doc.setFontSize(7); doc.setTextColor(UMBER); doc.setCharSpace(0.5);
      doc.text(row[0].toUpperCase(), L, top + 0.4);
      doc.setCharSpace(0);
      doc.setFont('Cormorant', 'normal'); doc.setFontSize(11.5); doc.setTextColor(INK);
      doc.text(lines, V, top + 0.9, { lineHeightFactor: 1.32 });
      if (sub) { doc.setFont('Tenor', 'normal'); doc.setFontSize(7.5); doc.setTextColor(UMBER); doc.text(sub, V, top + 0.9 + lines.length * lh + 0.8); }
      y += h;
      doc.line(L, y, R, y);
    });

    /* live verification: vector QR, 26mm, ink on ivory */
    y += 10;
    var qr = window.qrcode(0, 'M'); qr.addData(r.url); qr.make();
    var count = qr.getModuleCount(), QS = 26, cell = QS / count;
    doc.setFillColor(INK);
    for (var row = 0; row < count; row++) {
      for (var col = 0; col < count; col++) {
        if (!qr.isDark(row, col)) continue;
        var run = 1; while (col + run < count && qr.isDark(row, col + run)) run++;
        doc.rect(L + col * cell, y + row * cell, cell * run + 0.01, cell + 0.01, 'F');
        col += run - 1;
      }
    }
    var TX = L + QS + 9, TW = R - TX;
    doc.setFont('Cormorant', 'italic'); doc.setFontSize(11); doc.setTextColor(UMBER);
    var copy = doc.splitTextToSize('Verify this document online at any time by scanning the QR code, tapping the piece’s NFC Verification Card, or visiting the live registry link below:', TW);
    doc.text(copy, TX, y + 4.5, { lineHeightFactor: 1.3 });
    var ly = y + 4.5 + copy.length * 11 * 0.3528 * 1.3 + 3;
    var shown = r.url.split('#')[0];
    doc.setFont('Tenor', 'normal'); doc.setFontSize(8); doc.setTextColor(BRONZE); doc.setCharSpace(0.25);
    var urlLines = doc.splitTextToSize(shown, TW);
    doc.text(urlLines, TX, ly, { lineHeightFactor: 1.4 });
    doc.setCharSpace(0);
    doc.link(TX, ly - 3.2, TW, urlLines.length * 4.2 + 1, { url: r.url });
    doc.link(L, y, QS, QS, { url: r.url });

    /* foot: the legal entity line and the registry note */
    doc.setDrawColor(RULE); doc.line(L, 262, R, 262);
    centred(doc, 'HOUSE OF MANTHAI (PRIVATE) LIMITED  ·  An Avantio Ventures Company', 267, 6.5, 0.4, UMBER, 'Tenor');
    centred(doc, 'Colombo, Sri Lanka  ·  concierge@manthai.lk', 271, 6.5, 0.4, UMBER, 'Tenor');
    centred(doc, (r.sample ? 'A sample certificate, issued for illustration. ' : '') + 'This certificate reflects the House digital registry at the time of issue. Live verification status always governs.', 276.5, 7, 0.05, FINE, 'Cormorant', 'italic');
    return doc;
  }

  M.certificate = {
    load: load,
    download: function (r) {
      return load().then(function (faces) {
        var doc = build(r, faces);
        doc.save('MANTHAI-Certificate-' + r.id + '.pdf');
        return true;
      });
    },
    /* for checks: the finished document as bytes, without saving */
    bytes: function (r) { return load().then(function (faces) { return build(r, faces).output('arraybuffer'); }); }
  };
})();
