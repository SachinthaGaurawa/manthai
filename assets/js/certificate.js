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
  var STAMP = '20261128y';
  var INK = '#141210', UMBER = '#59534B', BRONZE = '#755A2A', GOLD = '#C9AF7E', SEAL = '#9F824C', RULE = '#DBD3C5', IVORY = '#F7F4EE', LIMESTONE = '#EFEAE0', FINE = '#8E867A';
  var PT = 0.3528;
  /* who signs, and the signature itself: assets/js/signatory.js, shared with the 3D certificate */
  var SIG = M.SIGNATORY || {};
  var SIGNATURE = SIG.PLACEHOLDER_PATH || '';
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
  /* the founder's signature image, when signatory.js names one: rasterised at high DPI on a canvas */
  function signatureImage() {
    var url = SIG.SIGNATURE_IMAGE_URL;
    if (!url) return null;
    return new Promise(function (res) {
      var img = new Image();
      img.onload = function () {
        var k = Math.min(2400 / img.naturalWidth, 760 / img.naturalHeight, 4), c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.naturalWidth * k)); c.height = Math.max(1, Math.round(img.naturalHeight * k));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        try { res({ data: c.toDataURL('image/png'), w: c.width, h: c.height }); } catch (e) { res(null); }
      };
      img.onerror = function () { res(null); };
      img.src = url;
    });
  }
  function load() {
    if (ready) return ready;
    ready = Promise.all([
      window.jspdf ? null : script('/assets/vendor/jspdf.umd.min.js?v=' + STAMP),
      window.qrcode ? null : script('/assets/vendor/qrcode-generator.js?v=' + STAMP),
      font('/assets/fonts/pdf-cormorant-lf-400.ttf?v=' + STAMP),
      font('/assets/fonts/pdf-cormorant-lf-italic-400.ttf?v=' + STAMP),
      font('/assets/fonts/pdf-tenor-sans-400.ttf?v=' + STAMP),
      signatureImage()
    ]).then(function (r) { return { serif: r[2], serifItalic: r[3], sans: r[4], sig: r[5] }; })
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
  function setFace(doc, face, style, size, color) { doc.setFont(face, style || 'normal'); doc.setFontSize(size); doc.setTextColor(color); }
  function spaced(doc, text, track) { return doc.getTextWidth(text) + (track || 0) * Math.max(0, text.length - 1); }
  /* one line of text, tracked, aligned left / centre / right on x */
  function tracked(doc, text, x, y, track, align) {
    var w = spaced(doc, text, track);
    doc.setCharSpace(track || 0);
    doc.text(text, align === 'center' ? x - w / 2 : align === 'right' ? x - w : x, y);
    doc.setCharSpace(0);
    return w;
  }
  /* parts joined by a drawn dot (never a font glyph, so no viewer can run them together) or by an ASCII bar */
  function joined(doc, parts, x, y, o) {
    o = o || {};
    var track = o.track || 0, size = doc.getFontSize() * PT, gap = o.bar ? 0 : size * 0.62 + track * 1.6, r = size * 0.075;
    var sep = o.bar ? (o.sep || '  |  ') : '', sw = o.bar ? spaced(doc, sep, track) : gap * 2;
    var total = parts.reduce(function (n, t, i) { return n + spaced(doc, t, track) + (i ? sw : 0); }, 0);
    var cx = o.align === 'center' ? x - total / 2 : x;
    parts.forEach(function (t, i) {
      if (i) {
        if (o.bar) { tracked(doc, sep, cx, y, track); }
        else { doc.setFillColor(o.dot || doc.getTextColor()); doc.circle(cx + gap, y - size * 0.25, r, 'F'); }
        cx += sw;
      }
      cx += tracked(doc, t, cx, y, track);
    });
    return total;
  }

  function joinedWidth(doc, parts, track) {
    var sw = spaced(doc, '   |   ', track);
    return parts.reduce(function (n, t, i) { return n + spaced(doc, t, track) + (i ? sw : 0); }, 0);
  }

  /* the embossed House stamp: double ring, curved legend, the Seal at its heart */
  function stamp(doc, cx, cy, R) {
    doc.setDrawColor(SEAL);
    doc.setLineWidth(0.6 * PT); doc.circle(cx, cy, R, 'S');
    doc.setLineWidth(0.25 * PT); doc.circle(cx, cy, R - 0.8, 'S'); doc.circle(cx, cy, R * 0.6, 'S');
    var tR = R * 0.735, legend = ['HOUSE', 'OF', 'MANTHAI', '·', 'AUTHENTICATED', 'ARCHIVE', '·'];
    setFace(doc, 'Tenor', 'normal', 4.7, SEAL);
    var chars = [];
    legend.forEach(function (word, i) {
      if (i) chars.push({ sp: true });
      if (word === '·') chars.push({ dot: true, w: 0.9 });
      else word.split('').forEach(function (ch) { chars.push({ ch: ch, w: doc.getTextWidth(ch) }); });
    });
    chars.push({ sp: true });
    var spaceW = 0.75, ink = chars.reduce(function (n, c) { return n + (c.sp ? spaceW : c.w); }, 0);
    var extra = (2 * Math.PI * tR - ink) / chars.length, cap = 4.7 * PT * 0.7, head = 0;
    /* "HOUSE OF MANTHAI" is centred over the top of the ring */
    for (var k = 0; k < chars.length && !chars[k + 1].dot; k++) head += (chars[k].sp ? spaceW : chars[k].w) + extra;
    var along = -(head - extra) / 2;
    chars.forEach(function (c) {
      var w = c.sp ? spaceW : c.w, th = (along + w / 2) / tR;
      if (c.dot) { doc.setFillColor(SEAL); doc.circle(cx + (tR + cap / 2) * Math.sin(th), cy - (tR + cap / 2) * Math.cos(th), 0.22, 'F'); }
      else if (c.ch) {
        var t0 = th - (w / 2) / tR;
        doc.text(c.ch, cx + tR * Math.sin(t0), cy - tR * Math.cos(t0), { angle: -th * 180 / Math.PI });
      }
      along += w + extra;
    });
    var sw = R * 0.62;
    drawSprite(doc, document.getElementById('spiral-seal'), [0, 0, 1000, 860], cx - sw / 2, cy - sw * 0.43, sw, SEAL);
  }

  /* a real, scannable QR: ink modules on a white quiet zone, inside a fine champagne rule */
  function qrTile(doc, url, x, y, size) {
    var qr = window.qrcode(0, 'M'); qr.addData(url); qr.make();
    var n = qr.getModuleCount(), q = size * 0.085, cell = (size - 2 * q) / n;
    doc.setFillColor('#FFFFFF'); doc.rect(x, y, size, size, 'F');
    doc.setDrawColor(GOLD); doc.setLineWidth(0.4 * PT); doc.rect(x, y, size, size, 'S');
    doc.setFillColor(INK);
    for (var row = 0; row < n; row++) {
      for (var col = 0; col < n; col++) {
        if (!qr.isDark(row, col)) continue;
        var run = 1; while (col + run < n && qr.isDark(row, col + run)) run++;
        doc.rect(x + q + col * cell, y + q + row * cell, cell * run + 0.01, cell + 0.01, 'F');
        col += run - 1;
      }
    }
  }

  /* r: { id, piece, edition, materials, origin, care, owner, provenance, issued, url, digest, sample } */
  function build(r, faces) {
    var doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4', compress: true });
    doc.addFileToVFS('Cormorant.ttf', faces.serif); doc.addFont('Cormorant.ttf', 'Cormorant', 'normal');
    doc.addFileToVFS('Cormorant-Italic.ttf', faces.serifItalic); doc.addFont('Cormorant-Italic.ttf', 'Cormorant', 'italic');
    doc.addFileToVFS('TenorSans.ttf', faces.sans); doc.addFont('TenorSans.ttf', 'Tenor', 'normal');
    doc.setProperties({ title: 'Certificate of Authenticity & Ownership ' + r.id, subject: r.piece, author: 'House of Manthai (Private) Limited', creator: 'House of MANTHAI Digital Registry', keywords: 'MANTHAI, Digital Product Passport, ' + r.id });
    var seal = document.getElementById('spiral-seal'), CX = 105;

    /* ivory sheet; champagne outer rule at 10mm, alabaster inner rule at 13mm, gold corner ticks */
    doc.setFillColor(IVORY); doc.rect(0, 0, 210, 297, 'F');
    doc.setDrawColor(GOLD); doc.setLineWidth(0.6 * PT); doc.rect(10, 10, 190, 277, 'S');
    doc.setDrawColor(RULE); doc.setLineWidth(0.3 * PT); doc.rect(13, 13, 184, 271, 'S');
    doc.setDrawColor(GOLD); doc.setLineWidth(0.6 * PT);
    [[14.6, 14.6, 1, 1], [195.4, 14.6, -1, 1], [14.6, 282.4, 1, -1], [195.4, 282.4, -1, -1]].forEach(function (c) {
      doc.line(c[0], c[1], c[0] + 2.5 * c[2], c[1]); doc.line(c[0], c[1], c[0], c[1] + 2.5 * c[3]);
    });

    /* the Seal pressed faintly into the sheet, behind the record */
    doc.saveGraphicsState(); doc.setGState(new doc.GState({ opacity: 0.04 }));
    drawSprite(doc, seal, [0, 0, 1000, 860], CX - 47.5, 112, 95, GOLD);
    doc.restoreGraphicsState();

    /* header: the Unbounded Spiral Seal, 16mm, and the official wordmark, both traced vectors */
    var sealW = 16, sealH = sealW * 0.86, y = 20;
    drawSprite(doc, seal, [0, 0, 1000, 860], CX - sealW / 2, y, sealW, SEAL);
    var wmW = 60, wmH = wmW * 120 / 796; y += sealH + 5;
    drawSprite(doc, document.getElementById('wm-paths'), [120, 30, 796, 120], CX - wmW / 2, y, wmW, INK);
    y += wmH + 7.5;
    setFace(doc, 'Tenor', 'normal', 7.5, BRONZE);
    joined(doc, ['HOUSE OF MANTHAI', 'DIGITAL PRODUCT PASSPORT'], CX, y, { bar: true, track: 0.85, align: 'center' });
    y += 9.2;
    setFace(doc, 'Cormorant', 'normal', 20, INK);
    tracked(doc, 'Certificate of Authenticity & Ownership', CX, y, 0.12, 'center');

    /* status band between gold hairlines */
    y += 5.5;
    doc.setDrawColor(GOLD); doc.setLineWidth(0.3 * PT); doc.line(30, y, 180, y); doc.line(30, y + 7, 180, y + 7);
    setFace(doc, 'Tenor', 'normal', 6.6, UMBER);
    joined(doc, ['PASSPORT ID: ' + r.id, 'STATUS: ' + (r.sample ? 'ARCHIVE SPECIMEN' : 'VERIFIED AUTHENTIC'), 'EDITION: ' + String(r.edition).split(' · ')[0].toUpperCase()], CX, y + 4.55, { track: 0.55, align: 'center', dot: GOLD });
    y += 7 + 5.6;

    /* the record: labels 36% in bronze tracked caps, values 64% in ink, 0.25pt alabaster rules */
    var L = 24, R = 186, V = L + (R - L) * 0.36, VW = R - V, VS = 10.2, lh = VS * PT * 1.3;
    var rows = [
      { k: 'Piece', v: [r.piece] },
      { k: 'Edition Number', dots: String(r.edition).split(' · ') },
      { k: 'Fibre & Construction', v: [r.materials] },
      { k: 'Craft Origin', v: [r.origin] },
      { k: 'Garment Stewardship & Care', v: [r.care] },
      { k: 'Ownership Inscription', v: [r.owner], italic: r.sample },
      { k: 'Provenance & Transfer', v: [String(r.provenance).split(' · ').join('  |  ')], note: 'Single-run numbered edition  ·  Permanently retired upon completion, never restocked or reproduced.' },
      { k: 'Issued & Certified By', v: ['House of Manthai (Private) Limited'], sub: ['An Avantio Ventures Company', 'Colombo, Sri Lanka'] },
      { k: 'Date of Issue', v: [r.issued] }
    ];
    /* ---- vertical budget. The foot is locked to fixed baselines; the verification box must end at
       least 6mm of clear ivory above the first footer line. Measure every row first, then set the
       row padding so the whole record fits, compressing it (never the type) when copy runs long. ---- */
    var FOOT = r.sample ? [265.6, 269.6, 275.5, 279.0] : [269.5, 273.5, 279.0];
    var BH = 33, QS = 24, GAP_T = 5, SIGBLK = 0, BOX_MAX = Math.min(261, FOOT[0] - 1.8 - 6);   /* 1.8mm = cap height of the 7pt footer line */
    var nlh, bodySum, SIGTAIL = 12.5, sigH0 = (SIG.BOX || [164, 52])[1] * 50 / (SIG.BOX || [164, 52])[0];
    function measure() {
      lh = VS * PT * 1.3; nlh = (VS - 0.8) * PT * 1.3;
      rows.forEach(function (row) {
        setFace(doc, 'Cormorant', row.italic ? 'italic' : 'normal', VS, INK);
        row.lines = row.dots ? [''] : [].concat.apply([], row.v.map(function (t) { return doc.splitTextToSize(String(t || ''), VW); }));
        setFace(doc, 'Cormorant', 'italic', VS - 0.8, UMBER);
        row.noteLines = row.note ? doc.splitTextToSize(row.note, VW) : [];
        row.body = row.lines.length * lh + (row.sub ? 3.9 : 0) + (row.noteLines.length ? row.noteLines.length * nlh + 1.2 : 0);
      });
      bodySum = rows.reduce(function (n, row) { return n + row.body; }, 0);
      SIGBLK = sigH0 + 1.5 + SIGTAIL;
      return BOX_MAX - y - bodySum - GAP_T - SIGBLK - BH;
    }
    /* PAD is the space a row adds around its text: 3.6mm by default, down to 2.4mm when copy runs long.
       Only if that is still not enough do the attestation gaps close up, and last of all the value
       type steps down (never below 9pt), so the box can never reach the footer. */
    var room = measure();
    if (room < 2.4 * rows.length) { GAP_T = 3.5; SIGTAIL = 11; room = measure(); }
    while (room < 2.4 * rows.length && VS > 9) { VS = Math.round((VS - 0.2) * 10) / 10; room = measure(); }
    var PAD = Math.max(2.4, Math.min(3.6, room / rows.length));
    var TOPOFF = 4.2 - (3.6 - PAD) * 0.5;
    doc.setDrawColor(RULE); doc.setLineWidth(0.25 * PT); doc.line(L, y, R, y);
    rows.forEach(function (row) {
      var lines = row.lines, note = row.noteLines;
      setFace(doc, 'Cormorant', row.italic ? 'italic' : 'normal', VS, INK);
      var top = y + TOPOFF, h = row.body + PAD;
      setFace(doc, 'Tenor', 'normal', 6.4, BRONZE);
      tracked(doc, row.k.toUpperCase(), L, top - 0.15, 0.55);
      setFace(doc, 'Cormorant', row.italic ? 'italic' : 'normal', VS, INK);
      if (row.dots) joined(doc, row.dots, V, top, { dot: BRONZE });
      else doc.text(lines, V, top, { lineHeightFactor: 1.3 });
      if (note.length) { setFace(doc, 'Cormorant', 'italic', VS - 0.8, UMBER); doc.text(note, V, top + lines.length * lh + 1.2, { lineHeightFactor: 1.3 }); }
      if (row.sub) { setFace(doc, 'Tenor', 'normal', 6.6, UMBER); joined(doc, row.sub, V, top + lines.length * lh + 0.6, { bar: true, track: 0.2 }); }
      y += h;
      doc.setDrawColor(RULE); doc.setLineWidth(0.25 * PT); doc.line(L, y, R, y);
    });

    /* attestation: the Maison Director's signature over a champagne hairline; the House stamp */
    y += GAP_T;
    var sigW = 50, box = SIG.BOX || [164, 52], sigS = sigW / box[0], sigH = box[1] * sigS;
    if (faces.sig) {
      /* the official signature, fitted (contain) inside the same locked box as the placeholder stroke */
      var k = Math.min(sigW / faces.sig.w, sigH / faces.sig.h), iw = faces.sig.w * k, ih = faces.sig.h * k;
      doc.addImage(faces.sig.data, 'PNG', L + 3 + (sigW - iw) / 2, y + (sigH - ih), iw, ih);
    } else {
      doc.setDrawColor(INK); doc.setLineCap('round'); doc.setLineJoin('round');
      doc.setLineWidth(0.32); doc.path(trace(SIGNATURE, 0, 0, sigS, L + 3, y)).stroke();
      doc.setLineWidth(0.14); doc.path(trace(SIGNATURE, 0, 0.55, sigS, L + 3.1, y)).stroke();
    }
    var hy = y + sigH + 1.5;
    doc.setDrawColor(GOLD); doc.setLineWidth(0.4 * PT); doc.line(L, hy, L + 52, hy);
    setFace(doc, 'Tenor', 'normal', 6.2, BRONZE); tracked(doc, SIG.SIGNATORY_LABEL || 'AUTHORIZED SIGNATORY', L, hy + 4.2, 0.7);
    setFace(doc, 'Cormorant', 'italic', 9.2, UMBER); joined(doc, [SIG.SIGNATORY_TITLE || 'Maison Director', SIG.SIGNATORY_ENTITY || 'House of Manthai (Private) Limited'], L, hy + 8.4, { bar: true });
    stamp(doc, L + (R - L) * 0.55 + (R - L) * 0.45 / 2, y + 11.5, 11);
    y = hy + SIGTAIL;

    /* live registry verification band: 4.5mm of limestone above and below the QR */
    var pad = (BH - QS) / 2;
    doc.setFillColor(LIMESTONE); doc.setDrawColor(RULE); doc.setLineWidth(0.75 * PT); doc.rect(L, y, R - L, BH, 'FD');
    qrTile(doc, r.url, L + pad, y + pad, QS);
    doc.link(L + pad, y + pad, QS, QS, { url: r.url });
    var TX = L + pad + QS + 7, TW = R - TX - 6, ty = y + pad + 3.2;
    setFace(doc, 'Tenor', 'normal', 7.5, BRONZE); tracked(doc, 'LIVE REGISTRY VERIFICATION', TX, ty, 0.9);
    setFace(doc, 'Cormorant', 'italic', 9.6, UMBER);
    var copy = doc.splitTextToSize('Confirm real-time authenticity and ownership status by scanning this QR code, tapping the garment’s concealed Authenticity Seal, or visiting the live House registry:', TW);
    ty += 4.6; doc.text(copy, TX, ty, { lineHeightFactor: 1.25 });
    ty += copy.length * 9.6 * PT * 1.25 + 0.9;
    var shown = location.origin.replace(/^https?:\/\//, '') + '/passport/' + r.id;
    setFace(doc, 'Tenor', 'normal', 7.4, INK); var uw = tracked(doc, shown, TX, ty, 0.25);
    doc.link(TX, ty - 2.8, uw, 3.8, { url: r.url });
    ty += 4.4;
    doc.setFont('courier', 'normal'); doc.setFontSize(7.5); doc.setTextColor(UMBER);
    doc.text('ARCHIVAL DIGEST: ' + r.digest, TX, ty);

    var boxBottom = y + BH;

    /* foot: two balanced, centred lines and the registry note, every line held inside the box width */
    var FW = R - L;
    function fit(size, parts, track, bar) {
      while (size > 5 && (bar ? joinedWidth(doc, parts, track) : spaced(doc, parts[0], track)) > FW) { size -= 0.1; doc.setFontSize(size); }
    }
    setFace(doc, 'Tenor', 'normal', 7, UMBER);
    var f1 = ['HOUSE OF MANTHAI (PRIVATE) LIMITED', 'AN AVANTIO VENTURES COMPANY'];
    fit(7, f1, 0.35, true); joined(doc, f1, CX, FOOT[0], { bar: true, track: 0.35, align: 'center', sep: '   |   ' });
    setFace(doc, 'Tenor', 'normal', 6.8, '#6E675E');
    var f2 = ['Colombo, Sri Lanka', 'concierge@manthai.lk'];
    fit(6.8, f2, 0.2, true); joined(doc, f2, CX, FOOT[1], { bar: true, track: 0.2, align: 'center', sep: '   |   ' });
    setFace(doc, 'Cormorant', 'italic', 6.2, FINE);
    var disc = 'This certificate reflects the House of MANTHAI digital registry at the time of issue. Live verification status on the official registry always governs.';
    fit(6.2, [disc], 0.02, false); tracked(doc, disc, CX, FOOT[2], 0.02, 'center');
    if (r.sample) { doc.setFontSize(6.2); tracked(doc, 'A specimen certificate, issued for illustration.', CX, FOOT[3], 0.02, 'center'); }
    M.certificate.lastLayout = { pad: PAD, boxTop: boxBottom - BH, boxBottom: boxBottom, foot: FOOT, gap: FOOT[0] - 1.8 - boxBottom };
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
