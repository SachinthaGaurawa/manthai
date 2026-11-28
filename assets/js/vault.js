/* ==========================================================================
   MANTHAI  |  The Dual-Key Ownership Ritual at /verify
   Key one: the Concealed Authenticity Seal, an encrypted NFC seal softly
   enclosed in a satin leaf along the lower-left inner seam. A tap opens the
   piece's /passport/[id] record at once, with no sign-in and no price.
   Key two: the Solid Metal Vault Card, brushed black stainless steel with no
   electronics, laser-inscribed with an Archive Serial and a one-time Vault
   Key. Read by Optical Vault Scan or typed by hand, it inscribes the piece in
   the claimer's own name; the Vault Key is then sealed for ever.
   Also here: Complete Your Salon Profile (progressive profiling) and the
   Heirloom Ownership Transfer invitation.
   Front-end demonstration: the House Archive lives in this browser (C.reg).
   ========================================================================== */
(function () {
  'use strict';
  var M = window.MANTHAI, C = M.core, ui = M.ui, $ = C.$, esc = C.esc;
  var V = M.vault = {};
  var SEAL = '<svg viewBox="0 0 1000 860" aria-hidden="true" focusable="false"><use href="#spiral-seal"/></svg>';
  var CHECK = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
  var PENDING = 'manthai.pendingClaim';

  function fmtDate(iso) { try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return ''; } }
  function b64e(o) { try { return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); } catch (e) { return ''; } }
  function b64d(s) { try { s = String(s).replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return JSON.parse(decodeURIComponent(escape(atob(s)))); } catch (e) { return null; } }
  function q(name, query) { var m = new RegExp('(?:^|&)' + name + '=([^&]*)').exec(query || ''); return m ? decodeURIComponent(m[1]) : ''; }
  function req(l) { return l + ' <span class="req" aria-hidden="true">*</span>'; }
  function opt(l) { return l + ' <span class="opt">(optional)</span>'; }
  function selectTitle(id, val) {
    return '<select id="' + id + '" name="title" autocomplete="honorific-prefix" aria-describedby="' + id + '-e"><option value="">Choose</option>' +
      C.TITLES.map(function (t) { return '<option' + (t === val ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join('') + '</select>';
  }
  function fieldHTML(id, label, control) { return '<div class="field"><label for="' + id + '">' + label + '</label>' + control + '<span class="field__error" id="' + id + '-e" role="alert"></span></div>'; }
  function namesForm(pfx, n) {
    n = n || {};
    return '<div class="cx-names">' + fieldHTML(pfx + '-title', opt('Title'), selectTitle(pfx + '-title', n.title || '')) +
      fieldHTML(pfx + '-first', req('First Name'), '<input id="' + pfx + '-first" name="first" autocomplete="given-name" required maxlength="60" value="' + esc(n.first || '') + '" aria-describedby="' + pfx + '-first-e">') +
      fieldHTML(pfx + '-last', req('Last Name'), '<input id="' + pfx + '-last" name="last" autocomplete="family-name" required maxlength="60" value="' + esc(n.last || '') + '" aria-describedby="' + pfx + '-last-e">') + '</div>';
  }
  /* reads and checks a Title / First / Last trio; returns the name or null (errors shown in place) */
  function readNames(f) {
    var bad = null;
    [['first', 'Enter your first name, using letters only.'], ['last', 'Enter your last name. Multi-word and hyphenated names are welcome, such as De Silva.']].forEach(function (x) {
      var i = f.elements[x[0]]; if (!C.validName(i.value)) { C.setError(i, x[1]); bad = bad || i; } else C.setError(i, '');
    });
    if (bad) { bad.focus(); return null; }
    return { title: f.elements.title.value, first: f.elements.first.value, last: f.elements.last.value };
  }

  /* ======================= Complete Your Salon Profile ======================= */
  var RATIONALE = 'As you wish your name inscribed on Ownership Certificates and Private Circle correspondence.';
  function profileCardHTML(pfx, titleId, level) {
    var h = 'h' + (level || 2);
    return '<form class="salonp" id="' + pfx + 'Form" data-salon-profile novalidate><span class="salonp__seal">' + SEAL + '</span>' +
      '<' + h + ' class="salonp__t" id="' + titleId + '" tabindex="-1">Complete Your Salon Profile</' + h + '>' +
      '<p class="salonp__lede">' + RATIONALE + '</p>' + namesForm(pfx, C.person() || {}) +
      '<button class="btn btn--solid btn--block" type="submit"><span class="btn__label">Save My Name</span></button></form>';
  }
  var profDlg = $('#layerProfile');
  function openProfile() {
    if (!profDlg || profDlg.open) return;
    $('#profilePanel').innerHTML = '<div class="panel-head panel-head--quiet"><span></span><button class="icon-btn" type="button" data-close aria-label="Complete later"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.1"/></svg></button></div>' +
      '<div class="panel-body">' + profileCardHTML('lp', 'profileTitle', 2) + '<button class="link-btn salonp__later" type="button" data-close>Complete later</button></div>';
    C.open(profDlg);
    setTimeout(function () { var i = $('#lp-first'); if (i && !i.value) i.focus(); }, C.reduced() ? 30 : 420);
  }
  V.openProfile = openProfile;
  /* asked once per visit, after a sign-in that left the name incomplete; never over the claim ritual, which asks inline */
  var askedThisVisit = false;
  try { askedThisVisit = window.sessionStorage.getItem('manthai.askedName') === '1'; } catch (e) { /* ignore */ }
  C.on('member', function () {
    if (!C.state.member) return;
    C.reg.merge(C.state.inscriptions); C.reg.fromOrders();
    if (askedThisVisit || C.nameComplete() || ui.curRoute() === 'verify' || ui.curRoute() === 'checkout') return;
    askedThisVisit = true; try { window.sessionStorage.setItem('manthai.askedName', '1'); } catch (e) { /* ignore */ }
    setTimeout(function () { if (C.state.member && !C.nameComplete() && !document.querySelector('dialog.layer[open]')) openProfile(); }, 900);
  });
  document.addEventListener('submit', function (e) {
    var f = e.target; if (!f.hasAttribute || !f.hasAttribute('data-salon-profile')) return;
    e.preventDefault();
    var n = readNames(f); if (!n) return;
    C.setPerson(n); C.save(); C.emit('member');
    if (f.id === 'lpForm') { C.close(profDlg); C.toast('Thank you, ' + C.cleanName(n.first) + '. Your Salon Profile is complete.'); }
    else if (f.id === 'vpForm') proceed();
  });

  /* ======================= the claim state ======================= */
  var cs = fresh();
  function fresh() { return { step: 'enter', mode: 'scan', serial: '', key: '', ctx: '', via: 'card', err: '', entry: null, xfer: null, query: null, scan: 'idle', filled: false }; }
  function savePending() { try { window.localStorage.setItem(PENDING, JSON.stringify({ serial: cs.serial, key: cs.key, ctx: cs.ctx, via: cs.via, xfer: cs.xfer, at: Date.now() })); } catch (e) { /* ignore */ } }
  function readPending() { try { var p = JSON.parse(window.localStorage.getItem(PENDING) || 'null'); return p && Date.now() - p.at < 30 * 60000 ? p : null; } catch (e) { return null; } }
  function clearPending() { try { window.localStorage.removeItem(PENDING); } catch (e) { /* ignore */ } }

  /* ======================= rendering ======================= */
  var host = $('#vfPanel');
  function pieceStrip(e, note) {
    var p = e && C.product(e.pid); if (!p) return '';
    return '<div class="vf-piece"><div class="vf-piece__plate">' + C.plateHTML(p, 'form', 'thumb') + '</div><div class="vf-piece__t"><p class="vf-piece__n">' + esc(p.name) + '</p>' +
      '<p class="vf-piece__m">Size ' + esc(e.size || '') + ' <span aria-hidden="true">&middot;</span> ' + esc(e.edition || C.editionLabel(p)) + '</p>' + (note ? '<p class="vf-piece__ok">' + CHECK + note + '</p>' : '') + '</div></div>';
  }
  function cardDiagram() {
    /* the reverse of the Solid Metal Vault Card, drawn as a quiet guide: where the Optical Vault Code sits */
    return '<svg class="vf-diagram" viewBox="0 0 428 270" aria-hidden="true" focusable="false">' +
      '<rect x="1" y="1" width="426" height="268" rx="14" fill="#171514" stroke="#C9AF7E" stroke-opacity=".55"/>' +
      '<text x="30" y="52" fill="#ACA498" font-family="Tenor Sans, sans-serif" font-size="11" letter-spacing="2.4">THE PRIVATE CIRCLE · OWNERSHIP KEY</text>' +
      '<text x="30" y="104" fill="#8E877B" font-family="Tenor Sans, sans-serif" font-size="9" letter-spacing="2">ARCHIVE SERIAL</text>' +
      '<text x="30" y="126" fill="#C9AF7E" font-family="Tenor Sans, sans-serif" font-size="17" letter-spacing="3">MNT · 0000 · 0000</text>' +
      '<text x="30" y="160" fill="#8E877B" font-family="Tenor Sans, sans-serif" font-size="9" letter-spacing="2">VAULT KEY</text>' +
      '<text x="30" y="182" fill="#C9AF7E" font-family="Tenor Sans, sans-serif" font-size="17" letter-spacing="5">0000</text>' +
      '<rect class="vf-diagram__code" x="338" y="180" width="60" height="60" fill="none" stroke="#C9AF7E" stroke-width="1.2" stroke-dasharray="3 3"/>' +
      '<text x="368" y="168" text-anchor="middle" fill="#C9AF7E" font-family="Cormorant Garamond, serif" font-style="italic" font-size="13">Optical Vault Code</text></svg>';
  }
  function finderHTML() {
    return '<div class="vf-finder" id="vfFinder" data-state="' + cs.scan + '">' +
      '<video class="vf-finder__video" id="vfVideo" playsinline muted aria-hidden="true"></video>' +
      cardDiagram() +
      '<span class="vf-br vf-br--tl"></span><span class="vf-br vf-br--tr"></span><span class="vf-br vf-br--bl"></span><span class="vf-br vf-br--br"></span>' +
      '<span class="vf-beam" aria-hidden="true"></span>' +
      '<p class="vf-finder__ok" aria-hidden="true">' + CHECK + 'Vault Card Recognized</p></div>';
  }
  function serialShown(d) { d = String(d || '').replace(/\D/g, '').slice(0, 8); return d ? 'MNT · ' + d.slice(0, 4) + (d.length > 4 ? ' · ' + d.slice(4) : '') : ''; }
  function enterHTML() {
    var ctxE = cs.ctx && C.reg.get(cs.ctx), scan = cs.mode === 'scan';
    var tab = function (k, label, extra) { var on = cs.mode === k; return '<button class="vf-tab" type="button" role="tab" id="vfTab-' + k + '" aria-controls="vfPane-' + k + '" aria-selected="' + on + '" tabindex="' + (on ? 0 : -1) + '" data-vf-mode="' + k + '">' + label + (extra ? ' <small>' + extra + '</small>' : '') + '</button>'; };
    var key = String(cs.key || '');
    return (ctxE ? pieceStrip(ctxE, 'Concealed Authenticity Seal confirmed') : '') +
      '<div class="vf-tabs" role="tablist" aria-label="How to read your Vault Card">' + tab('scan', 'Optical Vault Scan', 'Recommended') + tab('manual', 'Enter Key Manually') + '</div>' +
      '<div class="vf-pane vf-pane--scan" id="vfPane-scan" role="tabpanel" aria-labelledby="vfTab-scan"' + (scan ? '' : ' hidden') + '>' +
        finderHTML() +
        '<p class="vf-hint">Hold the reverse of your Solid Metal Vault Card inside the frame. The Optical Vault Code sits in its lower-right corner.</p>' +
        '<div class="vf-scan__acts"><button class="btn btn--solid" type="button" data-scan-start><span class="btn__label">' + (cs.scan === 'live' ? 'Scanning…' : 'Begin Optical Vault Scan') + '</span></button>' +
        '<button class="vf-demo" type="button" data-scan-demo>Preview Instant Optical Scan · Sample Card</button></div>' +
        '<p class="vf-msg" id="vfScanMsg" role="status" aria-live="polite"></p>' +
      '</div>' +
      '<form class="vf-pane vf-pane--manual" id="vfForm" role="tabpanel" aria-labelledby="vfTab-manual" novalidate' + (scan ? ' hidden' : '') + '>' +
        '<div class="field vf-field"><label for="vf-serial">' + req('Archive Serial') + '</label><input class="vf-serial" id="vf-serial" name="serial" inputmode="numeric" autocomplete="off" spellcheck="false" placeholder="MNT · 4829 · 1074" maxlength="18" value="' + esc(serialShown(cs.serial)) + '" aria-describedby="vf-serial-e"><span class="field__error" id="vf-serial-e" role="alert"></span></div>' +
        '<fieldset class="vf-key"><legend>' + req('Vault Key') + '</legend><div class="vf-key__row">' +
          [0, 1, 2, 3].map(function (i) { return '<input class="vk-d" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" aria-label="Vault Key digit ' + (i + 1) + ' of 4" data-vk="' + i + '"' + (i === 0 ? ' id="vf-key"' : '') + ' value="' + esc(key.charAt(i)) + '">'; }).join('') +
        '</div><p class="field__error vf-key__e" role="alert"></p></fieldset>' +
        '<p class="vf-note">Locate the Archive Serial and 4-digit Vault Key laser-inscribed on the reverse of your Solid Metal Vault Card.</p>' +
        (cs.err ? '<div class="vf-err" role="alert">' + cs.err + '</div>' : '') +
        '<button class="btn btn--solid btn--block btn--sheen vf-submit" type="submit"><span class="btn__label">Inscribe in My Private Vault</span></button>' +
        (cs.via === 'card' && !cs.ctx ? '<p class="vf-tier">Verified via Solid Metal Vault Card &middot; Tap Concealed Garment Seal Anytime for Cryptographic Hardware Confirmation</p>' : '') +
      '</form>';
  }
  function authHTML() {
    return pieceStrip(cs.entry, 'Vault Card verified') +
      '<p class="vf-step">Enter the Private Circle to inscribe this piece in your name. Your Vault Card is held securely while you sign in.</p>' +
      '<div class="vf-auth">' + M.auth.cardHTML({ p: 'vf', titleId: 'vfAuthT', level: 2 }) + '</div>';
  }
  function profileHTML() { return pieceStrip(cs.entry, 'Vault Card verified') + '<div class="vf-prof">' + profileCardHTML('vp', 'vfProfT', 2) + '</div>'; }
  function ceremonyHTML() {
    return '<div class="vf-cer" id="vfCer" aria-live="polite"><div class="vf-cer__mark"><svg class="vf-cer__ring" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="96" fill="none" stroke="#C9AF7E" stroke-width="1" pathLength="1"/></svg>' + SEAL + '</div>' +
      '<p class="vf-cer__t">Inscribing in the House Archive</p></div>';
  }
  function doneHTML() {
    var e = cs.entry, p = C.product(e.pid), r = ui.passportRecord(e.id);
    return '<article class="vf-done" aria-labelledby="vfDoneT"><span class="vf-done__seal">' + SEAL + '</span>' +
      '<p class="vf-done__k">Inscription Confirmed</p>' +
      '<h2 class="vf-done__t" id="vfDoneT" tabindex="-1">Inscribed to ' + esc(C.formalName(e.owner, true)) + '</h2>' +
      '<dl class="vf-done__dl"><div><dt>Piece</dt><dd>' + esc(p ? p.name : e.id) + '</dd></div><div><dt>Size</dt><dd>' + esc(e.size || '') + '</dd></div>' +
        '<div><dt>Edition</dt><dd>' + esc((r && r.edition) || e.edition) + '</dd></div><div><dt>Passport ID</dt><dd class="order-ref">' + esc(e.id) + '</dd></div>' +
        '<div><dt>Date of Inscription</dt><dd>' + esc(fmtDate(e.inscribedAt)) + '</dd></div></dl>' +
      '<p class="vf-done__seal-note">' + CHECK + (e.via === 'transfer' ? 'The transfer is complete. The prior custodian&rsquo;s passport is archived.' : 'Your 4-digit Vault Key is now permanently sealed against unauthorized reuse.') + '</p>' +
      (e.via === 'card' ? '<p class="vf-tier">Verified via Solid Metal Vault Card &middot; Tap Concealed Garment Seal Anytime for Cryptographic Hardware Confirmation</p>' : '') +
      '<div class="vf-done__acts"><button class="btn btn--solid" type="button" data-cert-pdf="' + esc(e.id) + '"><span class="cert__lbl btn__label">Download Official Certificate (PDF)</span></button>' +
        '<a class="btn btn--ghost" href="/account/vault" data-open-vault><span class="btn__label">Enter My Private Vault</span></a></div>' +
      (e.specimen ? '<p class="vf-fine">The sample card is now sealed, just as yours will be. <button class="link-btn" type="button" data-specimen-reset>Reset the sample card</button> to try the ritual again.</p>' : '') +
    '</article>';
  }
  function xferHTML() {
    var x = cs.xfer, e = C.reg.get(x.id), m = C.state.member, expired = new Date(x.x).getTime() < Date.now();
    var body;
    if (!e || !e.transfer || e.transfer.token !== x.t) body = '<p class="vf-err" role="alert">This Private Transfer Invitation is no longer valid. It may have been accepted or cancelled by the previous owner.</p>';
    else if (expired) body = '<p class="vf-err" role="alert">This Private Transfer Invitation has expired. Invitations are valid for 7 days; please ask the previous owner to send a new one from their Private Circle Vault.</p>';
    else if (!m) body = '<p class="vf-step">Enter the Private Circle with the email address the invitation was sent to, then accept it in your own name.</p><div class="vf-auth">' + M.auth.cardHTML({ p: 'vx', titleId: 'vfAuthT', level: 2 }) + '</div>';
    else if (String(m.email).toLowerCase() !== e.transfer.email) body = '<p class="vf-err" role="alert">This invitation is addressed to a different email address. Sign out and enter the Private Circle with the address it was sent to.</p>';
    else if (!C.nameComplete()) body = '<div class="vf-prof">' + profileCardHTML('vp', 'vfProfT', 2) + '</div>';
    else body = '<div class="vf-accept"><p class="vf-step">You are invited to become the next custodian of this piece. Accept to inscribe it permanently as <b>' + esc(C.formalName(C.person(), true)) + '</b>.</p>' +
      '<button class="btn btn--solid btn--block btn--sheen" type="button" data-xfer-accept><span class="btn__label">Accept &amp; Inscribe in My Name</span></button>' +
      '<p class="vf-fine">Valid until ' + esc(fmtDate(e.transfer.expires)) + '.</p></div>';
    return pieceStrip(e || { pid: x.p, size: x.s, edition: x.e }, 'Verified authentic') + body;
  }
  function headHTML() {
    var xfer = cs.step === 'transfer';
    var t = xfer ? 'An Ownership Transfer Invitation' : cs.step === 'done' ? 'Welcome to Your Private Vault' : 'Register Your Piece';
    var l = xfer ? 'A prior custodian has passed this creation to you. Its history stays with it; its ownership becomes yours.'
      : 'Two keys prove a MANTHAI piece. The Concealed Authenticity Seal inside its seam confirms it is genuine; the Solid Metal Vault Card inscribes it, once, in your name.';
    return '<header class="vf-head"><span class="vf-head__seal">' + SEAL + '</span><p class="vf-head__k">House of MANTHAI &middot; Private Vault</p>' +
      '<h1 class="vf-head__t" id="vfTitle" tabindex="-1">' + t + '</h1><p class="vf-head__l">' + l + '</p></header>';
  }
  function asideHTML() {
    return '<aside class="vf-aside" aria-labelledby="vfAsideT"><h2 class="vf-aside__t" id="vfAsideT">The Two Keys of Ownership</h2>' +
      '<div class="vf-keyline"><p class="vf-keyline__n">The Concealed Authenticity Seal</p><p>An encrypted seal softly enclosed in a satin leaf along the lower-left inner seam. Tap it with a smartphone through the silk, without reversing the garment, to open the piece&rsquo;s record instantly.</p></div>' +
      '<div class="vf-keyline"><p class="vf-keyline__n">The Solid Metal Vault Card</p><p>Brushed black stainless steel, held in the Private Circle Presentation Case. Its reverse carries the Archive Serial and a one-time Vault Key that inscribe the piece in your name.' + C.dref(2) + '</p></div>' +
      '<div class="vf-keyline"><p class="vf-keyline__n">Sealed for good</p><p>Once used, the Vault Key is sealed in the House Archive and cannot be used again. A gifted or inherited piece passes on through an official Ownership Transfer.' + C.dref(6) + '</p></div>' +
      '<p class="vf-aside__help">Need a hand? <a href="https://wa.me/' + esc(M.CONFIG.whatsapp) + '?text=' + encodeURIComponent('Good day, I would like help registering my MANTHAI piece.') + '" target="_blank" rel="noopener">House Client Care on WhatsApp</a></p></aside>';
  }
  function paint(focusSel) {
    if (!host) return;
    stopScan();
    var body = cs.step === 'auth' ? authHTML() : cs.step === 'profile' ? profileHTML() : cs.step === 'ceremony' ? ceremonyHTML() : cs.step === 'done' ? doneHTML() : cs.step === 'transfer' ? xferHTML() : enterHTML();
    host.innerHTML = '<div class="wrap vf">' + headHTML() + '<div class="vf-grid"><div class="vf-main" data-step="' + cs.step + '">' + body + '</div>' + asideHTML() + '</div></div>';
    if (focusSel) { var f = $(focusSel, host); if (f) { try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); } } }
    var view = cs.step + '|' + cs.mode;
    if (view !== lastView) { var first = !lastView; lastView = view; if (!first) reveal(); }
  }
  /* each new stage of the ritual is brought into view, so the client never misses the keys setting into place */
  var lastView = '';
  function reveal() {
    var main = $('.vf-main', host); if (!main || ui.curRoute() !== 'verify') return;
    var hh = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10) || 72, r = main.getBoundingClientRect();
    if (r.top >= hh + 8 && r.top <= window.innerHeight * .55) return;
    var top = Math.max(0, r.top + window.scrollY - hh - 24);
    if (C.lenis) C.lenis.scrollTo(top, { immediate: C.reduced(), duration: 1 }); else window.scrollTo({ top: top, behavior: C.reduced() ? 'auto' : 'smooth' });
  }

  /* the router calls this for /verify (query: piece=ID, vk=MNT…-KEY, transfer=…, resume=1) */
  V.render = function (query) {
    query = query || ''; lastView = '';
    if (cs.query === query && cs.step !== 'enter' && cs.step !== 'transfer') { paint(); return; }
    var keep = cs; cs = fresh(); cs.query = query;
    var piece = q('piece', query).toUpperCase(), vk = q('vk', query), xfer = q('transfer', query), pend = readPending();
    if (xfer) {
      var x = b64d(xfer);
      if (x && x.id && x.t) {
        cs.xfer = x; cs.step = 'transfer';
        var e = C.reg.get(x.id);
        /* an invitation opened on the new custodian's own device: the archive learns of the piece from it */
        if (!e && C.product(x.p)) e = C.reg.put({ id: x.id, pid: x.p, size: x.s || '', edition: x.e || '', status: 'CLAIMED', owner: null, prior: [], remote: true, issued: new Date().toISOString() });
        if (e && !e.transfer && e.status === 'CLAIMED' && (!e.owner || e.owner.email !== x.em)) { e.transfer = { email: x.em, token: x.t, expires: new Date(x.x).toISOString(), created: new Date().toISOString() }; C.reg.put(e); }
      }
      paint(); return;
    }
    if (piece && (C.reg.get(piece) || piece === C.reg.SPECIMEN.id)) { if (piece === C.reg.SPECIMEN.id) C.reg.specimen(); cs.ctx = piece; cs.via = 'seal'; }
    if (vk) { var mm = /MNT\D*(\d{8})\D+(\d{4})/i.exec(vk); if (mm) { cs.serial = mm[1]; cs.key = mm[2]; cs.mode = 'manual'; } }
    if (pend && (q('resume', query) || (!vk && !piece && keep.step === 'auth'))) {
      cs.serial = pend.serial; cs.key = pend.key; cs.ctx = pend.ctx || cs.ctx; cs.via = pend.via || cs.via; cs.mode = 'manual';
      if (pend.xfer) { cs.xfer = pend.xfer; cs.step = 'transfer'; paint(); return; }
      var r = C.reg.check(cs.serial, cs.key, cs.ctx);
      if (r.entry) { cs.entry = r.entry; proceed(); return; }
    }
    paint();
  };

  /* after the keys check out: sign in, then the name, then the ceremony */
  function proceed() {
    if (cs.step === 'transfer' || cs.xfer) { cs.step = 'transfer'; paint('[data-xfer-accept], #vp-first, #vfAuthT'); return; }
    if (!C.state.member) { cs.step = 'auth'; savePending(); paint('#vfAuthT'); return; }
    if (!C.nameComplete()) { cs.step = 'profile'; savePending(); paint('#vp-first'); return; }
    inscribe();
  }
  function ceremony(then) {
    cs.step = 'ceremony'; paint();
    var c = $('#vfCer');
    requestAnimationFrame(function () { requestAnimationFrame(function () { if (c) c.classList.add('is-on'); }); });
    setTimeout(function () { if (c) c.classList.add('is-sealed'); }, C.reduced() ? 0 : 760);
    setTimeout(then, C.reduced() ? 80 : 1100);
  }
  function inscribe() {
    var n = C.person();
    var e = C.reg.claim(cs.entry.id, n, cs.via);
    if (!e) { cs.step = 'enter'; cs.mode = 'manual'; cs.err = ERR.claimed; paint('.vf-err'); return; }
    clearPending(); cs.entry = e;
    ceremony(function () { cs.step = 'done'; paint('#vfDoneT'); C.emit('vault'); });
  }
  var ERR = {
    mismatch: 'The Archive Serial and Vault Key do not correspond. Please review the reverse of your Solid Metal Vault Card or consult House Client Care on WhatsApp.',
    claimed: 'This Vault Key has already been inscribed and permanently sealed in the House Archive. If this piece was gifted or transferred to you, please request an official Ownership Transfer from the previous owner&rsquo;s Private Circle Vault.'
  };

  /* signing in mid-ritual carries straight on, with the scanned keys still in hand */
  C.on('member', function () {
    if (ui.curRoute() === 'verify') {
      if ((cs.step === 'auth' || cs.step === 'profile') && C.state.member) proceed();
      else if (cs.step === 'transfer') paint();
      return;
    }
    var pend = readPending();
    if (pend && C.state.member && ui.curRoute() !== 'checkout') setTimeout(function () { if (ui.curRoute() !== 'verify') ui.route('verify', null, true, 'resume=1'); }, 300);
  });

  /* ======================= the Optical Vault Scan ======================= */
  var stream = null, detector = null, scanT = 0;
  function msg(t) { var m = $('#vfScanMsg'); if (m) m.innerHTML = t || ''; }
  function setScan(state) { cs.scan = state; var f = $('#vfFinder'); if (f) f.setAttribute('data-state', state); var b = $('[data-scan-start] .btn__label', host); if (b) b.textContent = state === 'live' ? 'Scanning…' : 'Begin Optical Vault Scan'; }
  function stopScan() {
    clearTimeout(scanT); scanT = 0;
    if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
    if (cs.scan === 'live') cs.scan = 'idle';
  }
  V.stop = stopScan;
  function parseCode(raw) { var m = /MNT\D*(\d{8})\D+(\d{4})/i.exec(String(raw || '')); return m ? { serial: m[1], key: m[2] } : null; }
  function startScan() {
    if (cs.scan === 'live') return;
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) { msg('This browser cannot open the camera here. Enter the key manually instead.'); return; }
    if (!('BarcodeDetector' in window)) { msg('This browser cannot read the Optical Vault Code yet. Enter the key manually, or use Chrome on Android.'); return; }
    msg('Allow camera access to read the Optical Vault Code.');
    Promise.resolve(window.BarcodeDetector.getSupportedFormats ? window.BarcodeDetector.getSupportedFormats() : ['qr_code']).then(function (fm) {
      var want = ['qr_code', 'data_matrix'].filter(function (x) { return fm.indexOf(x) > -1; });
      if (!want.length) throw { name: 'NoFormat' };
      detector = new window.BarcodeDetector({ formats: want });
      return navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    }).then(function (s) {
      if (ui.curRoute() !== 'verify' || cs.mode !== 'scan') { s.getTracks().forEach(function (t) { t.stop(); }); return; }
      stream = s; var v = $('#vfVideo'); v.srcObject = s; v.play().catch(function () {});
      setScan('live'); msg('Hold the reverse of the card steady inside the frame.');
      var tick = function () {
        if (!stream) return;
        detector.detect(v).then(function (codes) {
          var hit = null; (codes || []).some(function (c) { hit = parseCode(c.rawValue); return !!hit; });
          if (hit) recognised(hit); else scanT = setTimeout(tick, 200);
        }, function () { scanT = setTimeout(tick, 400); });
      };
      tick();
    }).catch(function (err) {
      setScan('idle');
      msg(err && err.name === 'NotAllowedError' ? 'Camera access was declined. You may allow it in your browser settings, or enter the key manually.'
        : err && err.name === 'NoFormat' ? 'This browser cannot read the Optical Vault Code yet. Enter the key manually instead.'
        : 'The camera could not be opened. Please enter the key manually.');
    });
  }
  /* the wow: a soft champagne pulse, the frame folds away, and the keys set themselves into place */
  function recognised(hit) {
    stopScan(); setScan('found'); msg(''); cs.serial = hit.serial; cs.key = hit.key; cs.err = '';
    var f = $('#vfFinder');
    setTimeout(function () { if (f) f.classList.add('is-folding'); }, C.reduced() ? 0 : 650);
    setTimeout(function () { cs.mode = 'manual'; cs.scan = 'idle'; paintManual(true); }, C.reduced() ? 60 : 1050);
  }
  function paintManual(animate) {
    var s = cs.serial, k = cs.key;
    if (animate) { cs.serial = ''; cs.key = ''; }
    paint();
    if (!animate) return;
    var si = $('#vf-serial'), boxes = C.$$('.vk-d', host), i = 0;
    si.classList.add('is-filling');
    (function typeSerial() {
      i += 1; si.value = serialShown(s.slice(0, i));
      if (i < s.length) setTimeout(typeSerial, C.reduced() ? 0 : 38);
      else {
        cs.serial = s; si.classList.remove('is-filling'); si.classList.add('is-set');
        var j = 0;
        (function typeKey() {
          boxes[j].value = k.charAt(j); boxes[j].classList.add('is-snap'); j += 1;
          if (j < 4) setTimeout(typeKey, C.reduced() ? 0 : 110);
          else { cs.key = k; var b = $('.vf-submit', host); if (b) { b.classList.add('is-ready'); b.focus({ preventScroll: true }); } }
        })();
      }
    })();
  }

  /* ======================= events ======================= */
  function keyOf(form) { return C.$$('.vk-d', form).map(function (b) { return b.value; }).join(''); }
  function submitClaim(f) {
    var si = f.elements.serial, d = si.value.replace(/\D/g, ''), k = keyOf(f), bad = null, ke = $('.vf-key__e', f);
    if (d.length !== 8) { C.setError(si, 'Enter the Archive Serial as it appears on the card, such as MNT · 4829 · 1074.'); bad = si; } else C.setError(si, '');
    if (!/^\d{4}$/.test(k)) { ke.textContent = 'Enter all four digits of the Vault Key.'; bad = bad || C.$$('.vk-d', f).filter(function (b) { return !b.value; })[0]; } else ke.textContent = '';
    if (bad) { bad.focus(); return; }
    cs.serial = d; cs.key = k;
    var r = C.reg.check(d, k, cs.ctx);
    if (r.err) { cs.err = ERR[r.err]; paint('.vf-err'); return; }
    cs.err = ''; cs.entry = r.entry;
    if (cs.ctx && cs.ctx !== r.entry.id) { cs.err = ERR.mismatch; paint('.vf-err'); return; }
    proceed();
  }
  if (host) {
    host.addEventListener('click', function (e) {
      var t;
      if ((t = e.target.closest('[data-vf-mode]'))) { var md = t.getAttribute('data-vf-mode'); if (md !== cs.mode) { stopScan(); cs.mode = md; paint('#vfTab-' + md); } return; }
      if (e.target.closest('[data-scan-start]')) { startScan(); return; }
      if (e.target.closest('[data-scan-demo]')) {
        /* the sample card, recognised as if held to the camera */
        var s = C.reg.SPECIMEN, sp = C.reg.specimen();
        if (sp.status !== 'UNCLAIMED') { msg('The sample card has already been inscribed and sealed. <button class="link-btn" type="button" data-specimen-reset>Reset the sample card</button> to try again.'); return; }
        if (cs.ctx && cs.ctx !== s.id) cs.ctx = '';
        setScan('live'); msg('Reading the sample card…');
        setTimeout(function () { recognised({ serial: s.serial, key: s.key }); }, C.reduced() ? 0 : 900);
        return;
      }
      if (e.target.closest('[data-specimen-reset]')) { C.reg.resetSpecimen(); cs = fresh(); cs.query = ''; paint('#vfTitle'); C.toast('The sample card is ready to be inscribed again.'); return; }
      if (e.target.closest('[data-xfer-accept]')) {
        var x = cs.xfer, res = C.reg.acceptTransfer(x.id, x.t, C.person());
        if (res.err) { cs.xfer = x; paint(); C.toast(res.err === 'expired' ? 'This invitation has expired.' : res.err === 'email' ? 'This invitation is addressed to a different email.' : 'This invitation is no longer valid.'); return; }
        clearPending(); cs.entry = res.entry; cs.xfer = null;
        ceremony(function () { cs.step = 'done'; paint('#vfDoneT'); C.emit('vault'); });
      }
    });
    host.addEventListener('keydown', function (e) {
      var t = e.target;
      if (t.classList && t.classList.contains('vf-tab') && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { e.preventDefault(); var o = cs.mode === 'scan' ? 'manual' : 'scan'; stopScan(); cs.mode = o; paint('#vfTab-' + o); return; }
      if (!t.classList || !t.classList.contains('vk-d')) return;
      var list = C.$$('.vk-d', host), i = +t.getAttribute('data-vk');
      if (e.key === 'Backspace' && !t.value && i > 0) { e.preventDefault(); list[i - 1].value = ''; list[i - 1].focus(); }
      else if (e.key === 'ArrowLeft' && i > 0) { e.preventDefault(); list[i - 1].focus(); }
      else if (e.key === 'ArrowRight' && i < 3) { e.preventDefault(); list[i + 1].focus(); }
    });
    host.addEventListener('input', function (e) {
      var t = e.target;
      if (t.id === 'vf-serial') {
        if (e.inputType && e.inputType.indexOf('delete') === 0) { cs.serial = t.value.replace(/\D/g, ''); return; }
        var d = t.value.replace(/^\s*MNT/i, '').replace(/\D/g, '').slice(0, 8); t.value = serialShown(d); cs.serial = d;
        if (d.length === 8) { var b0 = $('.vk-d', host); if (b0 && !b0.value) b0.focus(); }
        return;
      }
      if (!t.classList.contains('vk-d')) return;
      var list = C.$$('.vk-d', host), i = +t.getAttribute('data-vk'), digits = t.value.replace(/\D/g, '');
      var ke = $('.vf-key__e', host); if (ke) ke.textContent = '';
      if (!digits) { t.value = ''; return; }
      for (var j = 0; j < digits.length && i + j < 4; j++) list[i + j].value = digits.charAt(j);
      list[Math.min(3, i + digits.length)].focus();
      cs.key = keyOf(t.form);
    });
    host.addEventListener('paste', function (e) {
      var t = e.target; if (!t.classList || !t.classList.contains('vk-d')) return;
      var d = ((e.clipboardData || window.clipboardData).getData('text') || '').replace(/\D/g, '').slice(0, 4); if (!d) return;
      e.preventDefault(); var list = C.$$('.vk-d', host); d.split('').forEach(function (c, j) { list[j].value = c; }); list[Math.min(3, d.length)].focus(); cs.key = keyOf(t.form);
    });
    host.addEventListener('submit', function (e) { if (e.target.id === 'vfForm') { e.preventDefault(); submitClaim(e.target); } });
  }
  C.on('route', function (name) { if (name !== 'verify') stopScan(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) { stopScan(); setScan('idle'); } });

  /* ======================= Heirloom transfer link ======================= */
  V.transferLink = function (e) {
    if (!e || !e.transfer) return '';
    return location.origin + '/verify?transfer=' + b64e({ id: e.id, p: e.pid, s: e.size, e: e.edition, t: e.transfer.token, x: e.transfer.expires, em: e.transfer.email });
  };

  /* the router drew /verify before this file loaded */
  if (ui.curRoute && ui.curRoute() === 'verify') V.render(ui.curSlug ? ui.curSlug() : '');
})();
