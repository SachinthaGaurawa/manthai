/* ==========================================================================
   MANTHAI  |  The Two-Gate Ownership Ritual at /verify (and /v, the seal's own address)
   Gate 1: the Concealed Authenticity Seal, an NTAG 424 DNA chip in a satin
   leaf along the lower-left inner seam. A tap opens /v?uid&ctr&cmac; the
   House server checks its cryptographic signature and rising counter, shows
   the piece as verified authentic (no sign-in, no price) and opens a
   10-minute session for that one piece. Without it, nothing below unlocks.
   Gate 2: inside that session, the client anchors ownership to a Private
   Circle account (Google or a passwordless email key), confirms the name for
   the certificate, and presents the Solid Metal Vault Card paired to THIS
   piece (Optical Vault Scan or by hand). Five wrong attempts pause the piece
   for 30 minutes. The server then inscribes it and seals the Vault Key.
   Also here: Complete Your Salon Profile and the Ownership Transfer invitation.
   There is no sample card, demo or reset. On localhost only, vault-dev.js
   offers a developer tap simulator (see core.js C.reg.DEV).
   ========================================================================== */
(function () {
  'use strict';
  var M = window.MANTHAI, C = M.core, ui = M.ui, $ = C.$, esc = C.esc;
  var V = M.vault = {};
  var SEAL = '<svg viewBox="0 0 1000 860" aria-hidden="true" focusable="false"><use href="#spiral-seal"/></svg>';
  var CHECK = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
  var SESS = 'manthai.nfcSession', RESUME = 'manthai.vaultResume';

  function fmtDate(iso) { try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return ''; } }
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
    else if (f.id === 'vpForm') next();
  });

  /* ======================= the ritual's state ======================= */
  var cs = fresh();
  function fresh() { return { step: 'gate1', mode: 'scan', serial: '', key: '', err: '', notice: '', sess: null, tapped: null, entry: null, xfer: null, query: null, scan: 'idle', certName: null, remaining: 5, lockedUntil: 0, busy: false }; }
  /* the Gate 1 session survives a reload, a sign-in by email link and a new tab for ten minutes, never longer */
  function saveSess(s) { try { if (s) window.localStorage.setItem(SESS, JSON.stringify(s)); else window.localStorage.removeItem(SESS); } catch (e) { /* ignore */ } }
  function readSess() { try { var s = JSON.parse(window.localStorage.getItem(SESS) || 'null'); return s && s.token && s.exp > Date.now() ? s : null; } catch (e) { return null; } }
  function setResume(on) { try { if (on) window.localStorage.setItem(RESUME, String(Date.now())); else window.localStorage.removeItem(RESUME); } catch (e) { /* ignore */ } }
  function wantsResume() { try { var t = +window.localStorage.getItem(RESUME); return !!t && Date.now() - t < 10 * 60000; } catch (e) { return false; } }
  function minsLeft() { return cs.sess ? Math.max(0, Math.ceil((cs.sess.exp - Date.now()) / 60000)) : 0; }

  /* ======================= rendering ======================= */
  var host = $('#vfPanel');
  function productOf(piece) { return piece && (C.product(piece.pid) || C.archivedProduct({ id: piece.pid, name: piece.name, short: piece.name })); }
  function pieceStrip(piece, note) {
    var p = productOf(piece); if (!p) return '';
    return '<div class="vf-piece"><div class="vf-piece__plate">' + (p.archived ? C.archivePlate() : C.plateHTML(p, 'form', 'thumb')) + '</div><div class="vf-piece__t"><p class="vf-piece__n">' + esc(p.name) + '</p>' +
      '<p class="vf-piece__m">Size ' + esc(piece.size || '') + ' <span aria-hidden="true">&middot;</span> ' + esc(piece.edition || C.editionLabel(p)) + '</p>' + (note ? '<p class="vf-piece__ok">' + CHECK + note + '</p>' : '') + '</div></div>';
  }
  /* Stage 1 result: the garment's own record, no price, no sign-in */
  function factsHTML(piece) {
    var p = productOf(piece); if (!p) return '';
    var row = function (k, v) { return v ? '<div><dt>' + k + '</dt><dd>' + esc(v) + '</dd></div>' : ''; };
    return '<dl class="vf-facts">' + row('Piece', p.name) + row('Size', piece.size) + row('Edition number', piece.edition || C.editionLabel(p)) +
      row('Fibre &amp; construction', p.materials) + row('Craft origin', String(p.provenance || '').replace(/Colombo atelier/, 'Colombo Atelier') + (p.provenance ? ', Sri Lanka' : '')) +
      row('Garment care', p.care) + row('Passport ID', piece.id) + '</dl>';
  }
  function verifiedHTML(piece) {
    return '<section class="vf-ok" aria-labelledby="vfOkT"><p class="vf-ok__pill">' + CHECK + '<span>Cryptographically Verified Authentic</span></p>' +
      '<h2 class="vf-ok__t" id="vfOkT" tabindex="-1">' + esc((productOf(piece) || {}).name || 'Your piece') + '</h2>' + pieceStrip(piece) + factsHTML(piece) + '</section>';
  }
  /* the 2-step header: where the client stands, and what is still locked */
  function stepperHTML() {
    var g1 = cs.step === 'gate1' || cs.step === 'checking' || cs.step === 'sealfail';
    var done = cs.step === 'done' || cs.step === 'ceremony';
    var s1 = g1 ? 'is-on' : 'is-done', s2 = g1 ? 'is-locked' : done ? 'is-done' : 'is-on';
    var LOCK = '<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="M7 11V8a5 5 0 0110 0v3M6 11h12v9H6z" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>';
    return '<ol class="vf-steps" aria-label="Registration progress">' +
      '<li class="vf-steps__i ' + s1 + '"' + (g1 ? ' aria-current="step"' : '') + '><span class="vf-steps__n">' + (g1 ? '1' : CHECK) + '</span><span class="vf-steps__l">Tap Garment Seal</span></li>' +
      '<li class="vf-steps__bar" aria-hidden="true"></li>' +
      '<li class="vf-steps__i ' + s2 + '"' + (!g1 && !done ? ' aria-current="step"' : '') + '><span class="vf-steps__n">' + (s2 === 'is-locked' ? LOCK : s2 === 'is-done' ? CHECK : '2') + '</span><span class="vf-steps__l">Vault Card Key' + (s2 === 'is-locked' ? '<span class="sr-only"> (locked until the seal is tapped)</span>' : '') + '</span></li></ol>';
  }
  /* the garment, seen from inside: the satin leaf in the lower-left side seam and a phone held to it */
  function seamDiagram() {
    return '<svg class="vf-seam" viewBox="0 0 520 360" role="img" aria-labelledby="vfSeamT"><title id="vfSeamT">A smartphone held against the lower-left inner side seam of the garment, where the concealed seal sits</title>' +
      '<g fill="none" stroke="#C9AF7E" stroke-width="1.2" stroke-linejoin="round">' +
        '<path d="M190 40 L226 28 Q260 54 294 28 L330 40 L372 84 L350 104 L334 92 L340 318 L180 318 L186 92 L170 104 L148 84 Z" stroke-opacity=".9"/>' +
        '<path d="M226 28 Q260 70 294 28" stroke-opacity=".5"/>' +
        '<path d="M190 96 L196 316" stroke-dasharray="3 4" stroke-opacity=".55"/><path d="M330 96 L324 316" stroke-dasharray="3 4" stroke-opacity=".55"/>' +
      '</g>' +
      '<rect x="186" y="246" width="18" height="30" rx="2" fill="#4C1722" stroke="#C9AF7E" stroke-width="1"/>' +
      '<g class="vf-seam__waves" fill="none" stroke="#C9AF7E" stroke-width="1" stroke-linecap="round"><path d="M164 252 q-8 9 0 18"/><path d="M154 246 q-14 15 0 30" stroke-opacity=".7"/><path d="M144 240 q-20 21 0 42" stroke-opacity=".45"/></g>' +
      '<g class="vf-seam__phone"><rect x="70" y="214" width="58" height="104" rx="9" fill="#171514" stroke="#C9AF7E" stroke-width="1.2"/><rect x="77" y="226" width="44" height="76" rx="2" fill="none" stroke="#ACA498" stroke-opacity=".5"/></g>' +
      '<path d="M206 261 L250 261 L262 249" fill="none" stroke="#ACA498" stroke-width=".8"/>' +
      '<text x="268" y="246" fill="#C9AF7E" font-family="Cormorant Garamond, serif" font-style="italic" font-size="15">Concealed Authenticity Seal</text>' +
      '<text x="268" y="266" fill="#ACA498" font-family="Tenor Sans, sans-serif" font-size="10" letter-spacing="1.6">LOWER-LEFT INNER SIDE SEAM</text></svg>';
  }
  function careLink(text, msgTxt) { return '<a href="https://wa.me/' + esc(M.CONFIG.whatsapp) + '?text=' + encodeURIComponent(msgTxt) + '" target="_blank" rel="noopener">' + text + '<span class="sr-only"> (opens WhatsApp)</span></a>'; }
  function gate1HTML() {
    return '<section class="vf-gate" aria-labelledby="vfG1T">' +
      '<h2 class="vf-gate__t" id="vfG1T" tabindex="-1">Step 1 &middot; Tap the Concealed Garment Seal</h2>' +
      (cs.notice ? '<p class="vf-notice" role="alert">' + cs.notice + '</p>' : '') +
      '<div class="vf-gate__fig">' + seamDiagram() + '</div>' +
      '<p class="vf-gate__p">To guarantee against counterfeiting, every ownership registration must begin by holding your smartphone directly against the concealed Authenticity Seal woven inside the lower-left inner seam of your garment. No app is required.</p>' +
      '<p class="vf-gate__p vf-gate__p--quiet">Orders in transit cannot be activated remotely. Physical possession of both the garment and your sealed Solid Metal Vault Card is required.</p>' +
      '<ol class="vf-gate__how"><li>Unlock your phone and keep the garment as it is worn, without reversing it.</li><li>Rest the top of the phone against the lower-left side seam for a moment.</li><li>The piece&rsquo;s record opens; step 2, the Vault Card Key, then unlocks for ten minutes.</li></ol>' +
      (C.reg.DEV ? devHTML() : '') +
      '<p class="vf-gate__esc">Using a device without NFC? ' + careLink('Request Concierge-Assisted Verification via House Client Care', 'Good day, my phone cannot read NFC. I would like concierge-assisted verification of my MANTHAI piece.') + '</p></section>';
  }
  function devHTML() {
    var d = M.vaultDev;
    return '<div class="vf-dev" data-ui><p class="vf-dev__t">Developer tap simulator &middot; localhost only, never in production</p>' +
      (d ? '<div class="vf-dev__row">' + d.pieces().map(function (x) { return '<button class="vf-dev__b" type="button" data-dev-tap="' + esc(x.uid) + '">' + esc(x.label) + '</button>'; }).join('') + '</div>' +
        '<p class="vf-dev__k">' + d.pieces().map(function (x) { return esc(x.label) + ': ' + esc(C.reg.fmt(x.serial)) + ' / ' + esc(x.key); }).join('<br>') + '</p>' +
        '<button class="vf-dev__b vf-dev__b--quiet" type="button" data-dev-reset>Reset the local test archive</button>'
        : '<button class="vf-dev__b" type="button" data-dev-load>Load the simulator</button>') + '</div>';
  }
  function checkingHTML() {
    return '<div class="vf-cer is-on" aria-live="polite"><div class="vf-cer__mark"><svg class="vf-cer__ring" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="96" fill="none" stroke="#C9AF7E" stroke-width="1" pathLength="1"/></svg>' + SEAL + '</div>' +
      '<p class="vf-cer__t">Verifying the Concealed Authenticity Seal</p></div>';
  }
  function sealFailHTML() {
    return '<section class="vf-gate" aria-labelledby="vfFailT"><h2 class="vf-gate__t" id="vfFailT" tabindex="-1">Security Notice</h2><p class="vf-notice" role="alert">' + cs.notice + '</p>' +
      '<div class="vf-gate__fig">' + seamDiagram() + '</div>' +
      '<p class="vf-gate__esc">' + careLink('Consult House Client Care', 'Good day, I need help verifying my MANTHAI piece.') + '</p></section>';
  }
  /* a piece already inscribed: authenticity for anyone, ownership only for its owner */
  function claimedHTML() {
    var e = cs.tapped, own;
    if (e.mine) own = '<div class="own own--mine"><h2 class="own__t">Inscribed to ' + esc(C.formalName(e.owner || {}, true)) + '</h2>' +
      (e.inscribedAt ? '<p class="own__p">Inscribed on ' + esc(fmtDate(e.inscribedAt)) + '. Your Vault Key is permanently sealed.</p>' : '') +
      '<div class="own__acts"><button class="btn btn--solid" type="button" data-cert-pdf="' + esc(e.id) + '"><span class="cert__lbl btn__label">Download Official Certificate (PDF)</span></button>' +
      '<a class="own__link" href="/account/vault" data-open-vault>View in My Private Vault</a></div></div>';
    else own = '<div class="own own--sealed"><h2 class="own__t">Registered to Private Owner (Verified)</h2><p class="own__p">Owner identity is withheld for client discretion. This piece&rsquo;s Vault Key is permanently sealed. A gifted or inherited piece passes on only through an official Ownership Transfer from its owner&rsquo;s Private Circle.</p></div>';
    if (e.mine && ui.passportRecord) ui.passportRecord(e.id);
    return verifiedHTML(e) + own;
  }
  function sessionLine() { var m = minsLeft(); return '<p class="vf-sess" role="status"><span class="vf-sess__dot" aria-hidden="true"></span>Seal session open &middot; ' + m + (m === 1 ? ' minute' : ' minutes') + ' remaining</p>'; }
  function gate2Lead() { return verifiedHTML(cs.sess.piece) + sessionLine(); }
  function verifiedStepHTML() {
    return gate2Lead() + '<div class="vf-next"><p class="vf-step">This piece awaits its owner. Step 2 inscribes it in your name with the Solid Metal Vault Card from its presentation box.</p>' +
      '<button class="btn btn--solid btn--block btn--sheen" type="button" data-vf-claim><span class="btn__label">Claim &amp; Inscribe in My Name</span></button></div>';
  }
  function giftHTML() {
    var who = (cs.sess.gift && cs.sess.gift.recipientFirst) || 'its recipient';
    return gate2Lead() + '<div class="vf-giftnote" role="note"><p class="vf-giftnote__t">A gift from you</p>' +
      '<p>You acquired this piece as a gift for ' + esc(who) + '. Ownership should be inscribed by the recipient under their own email so the official Certificate bears their name.</p>' +
      '<p class="vf-giftnote__p">Simply hand over the piece with its presentation box; ' + esc(who) + ' taps the seal and inscribes it in a moment.</p>' +
      '<button class="link-btn vf-giftnote__keep" type="button" data-vf-keep>I am keeping this piece for myself</button></div>';
  }
  function authHTML() {
    return gate2Lead() + '<div class="vf-auth">' + M.auth.cardHTML({ p: 'vf', titleId: 'vfAuthT', level: 2, anchor: true }) + '</div>';
  }
  function nameHTML(sub) {
    var n = cs.certName || (cs.sess && cs.sess.suggestedName && !cs.keep ? cs.sess.suggestedName : null) || C.person() || {};
    return (cs.xfer ? '' : gate2Lead()) + '<form class="vf-name salonp" id="vnForm" novalidate><span class="salonp__seal">' + SEAL + '</span>' +
      '<h2 class="salonp__t" id="vfNameT" tabindex="-1">Confirm Your Certificate Name</h2>' +
      '<p class="salonp__lede">' + (sub || (cs.sess && cs.sess.suggestedName && !cs.keep ? 'The giver suggested this spelling. Please confirm it exactly as it should appear on your Official Certificate.' : 'Exactly as it should appear on your Official Certificate and in the House Archive.')) + '</p>' +
      namesForm('vn', n) + '<button class="btn btn--solid btn--block" type="submit"><span class="btn__label">Confirm Name</span></button></form>';
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
  function serialShown(d) { d = String(d || '').replace(/\D/g, '').slice(0, 12); return d ? 'MNT · ' + d.slice(0, 4) + (d.length > 4 ? ' · ' + d.slice(4) : '') : ''; }
  function keysHTML() {
    var scan = cs.mode === 'scan', key = String(cs.key || '');
    var tab = function (k, label, extra) { var on = cs.mode === k; return '<button class="vf-tab" type="button" role="tab" id="vfTab-' + k + '" aria-controls="vfPane-' + k + '" aria-selected="' + on + '" tabindex="' + (on ? 0 : -1) + '" data-vf-mode="' + k + '">' + label + (extra ? ' <small>' + extra + '</small>' : '') + '</button>'; };
    var nm = cs.certName || C.person() || {};
    return pieceStrip(cs.sess.piece, 'Cryptographically verified authentic') + sessionLine() +
      '<p class="vf-step">Inscribing as <b>' + esc(C.formalName(nm, true)) + '</b>. <button class="link-btn" type="button" data-vf-rename>Change name</button></p>' +
      '<div class="vf-tabs" role="tablist" aria-label="How to read your Vault Card">' + tab('scan', 'Optical Vault Scan', 'Recommended') + tab('manual', 'Enter Key Manually') + '</div>' +
      '<div class="vf-pane vf-pane--scan" id="vfPane-scan" role="tabpanel" aria-labelledby="vfTab-scan"' + (scan ? '' : ' hidden') + '>' +
        finderHTML() +
        '<p class="vf-hint">Hold the reverse of your Solid Metal Vault Card inside the frame. The Optical Vault Code sits in its lower-right corner.</p>' +
        '<div class="vf-scan__acts"><button class="btn btn--solid" type="button" data-scan-start><span class="btn__label">' + (cs.scan === 'live' ? 'Scanning…' : 'Begin Optical Vault Scan') + '</span></button></div>' +
        '<p class="vf-msg" id="vfScanMsg" role="status" aria-live="polite"></p>' +
      '</div>' +
      '<form class="vf-pane vf-pane--manual" id="vfForm" role="tabpanel" aria-labelledby="vfTab-manual" novalidate' + (scan ? ' hidden' : '') + '>' +
        '<div class="field vf-field"><label for="vf-serial">' + req('Archive Serial') + '</label><input class="vf-serial" id="vf-serial" name="serial" inputmode="numeric" autocomplete="off" spellcheck="false" placeholder="MNT · 4829 · 1074" maxlength="22" value="' + esc(serialShown(cs.serial)) + '" aria-describedby="vf-serial-e"><span class="field__error" id="vf-serial-e" role="alert"></span></div>' +
        '<fieldset class="vf-key"><legend>' + req('Vault Key') + '</legend><div class="vf-key__row">' +
          [0, 1, 2, 3].map(function (i) { return '<input class="vk-d" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" aria-label="Vault Key digit ' + (i + 1) + ' of 4" data-vk="' + i + '"' + (i === 0 ? ' id="vf-key"' : '') + ' value="' + esc(key.charAt(i)) + '">'; }).join('') +
        '</div><p class="field__error vf-key__e" role="alert"></p></fieldset>' +
        '<p class="vf-note">Locate the Archive Serial and 4-digit Vault Key laser-inscribed on the reverse of the Solid Metal Vault Card that arrived with this piece.</p>' +
        (cs.err ? '<div class="vf-err" role="alert">' + cs.err + '</div>' : '') +
        '<button class="btn btn--solid btn--block btn--sheen vf-submit" type="submit"' + (cs.busy ? ' disabled aria-busy="true"' : '') + '><span class="btn__label">' + (cs.busy ? 'Consulting the House Archive…' : 'Inscribe in My Private Vault') + '</span></button>' +
      '</form>';
  }
  function lockedHTML() {
    var until = new Date(cs.lockedUntil), t = until.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return pieceStrip(cs.sess && cs.sess.piece) + '<div class="vf-lock" role="alert"><p class="vf-lock__t">Verification Paused</p>' +
      '<p>Verification temporarily paused for security after 5 unsuccessful attempts. Please wait 30 minutes, until ' + esc(t) + ', or ' + careLink('contact House Client Care', 'Good day, Vault Card verification for my MANTHAI piece was paused after 5 attempts.') + '.</p>' +
      '<p class="vf-fine">When the pause ends, tap the garment seal again to open a fresh session.</p></div>';
  }
  function ceremonyHTML() {
    return '<div class="vf-cer" id="vfCer" aria-live="polite"><div class="vf-cer__mark"><svg class="vf-cer__ring" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="96" fill="none" stroke="#C9AF7E" stroke-width="1" pathLength="1"/></svg>' + SEAL + '</div>' +
      '<p class="vf-cer__t">Inscribing in the House Archive</p></div>';
  }
  function doneHTML() {
    var e = cs.entry, p = productOf(e), r = ui.passportRecord ? ui.passportRecord(e.id) : null;
    return '<article class="vf-done" aria-labelledby="vfDoneT"><span class="vf-done__seal">' + SEAL + '</span>' +
      '<p class="vf-done__k">Inscription Confirmed</p>' +
      '<h2 class="vf-done__t" id="vfDoneT" tabindex="-1">Inscribed to ' + esc(C.formalName(e.owner || {}, true)) + '</h2>' +
      '<dl class="vf-done__dl"><div><dt>Piece</dt><dd>' + esc(p ? p.name : e.id) + '</dd></div><div><dt>Size</dt><dd>' + esc(e.size || '') + '</dd></div>' +
        '<div><dt>Edition</dt><dd>' + esc((r && r.edition) || e.edition) + '</dd></div><div><dt>Passport ID</dt><dd class="order-ref">' + esc(e.id) + '</dd></div>' +
        '<div><dt>Date of Inscription</dt><dd>' + esc(fmtDate(e.inscribedAt)) + '</dd></div></dl>' +
      '<p class="vf-done__seal-note">' + CHECK + (e.via === 'transfer' ? 'The transfer is complete. The prior custodian&rsquo;s passport is archived.' : 'Garment seal, Solid Metal Vault Card and your Private Circle are now bound. The Vault Key is permanently sealed.') + '</p>' +
      '<div class="vf-done__acts"><button class="btn btn--solid" type="button" data-cert-pdf="' + esc(e.id) + '"><span class="cert__lbl btn__label">Download Official Certificate (PDF)</span></button>' +
        '<a class="btn btn--ghost" href="/account/vault" data-open-vault><span class="btn__label">Enter My Private Vault</span></a></div>' +
    '</article>';
  }
  function xferHTML() {
    var x = cs.xfer, m = C.state.member, body;
    if (x.err) body = '<p class="vf-err" role="alert">' + x.err + '</p>';
    else if (!x.view) body = '<p class="vf-step" role="status">Consulting the House Archive…</p>';
    else if (!m) body = '<p class="vf-step">This invitation is addressed to ' + esc(x.view.to) + '. Enter the Private Circle with that email address, then accept it in your own name.</p><div class="vf-auth">' + M.auth.cardHTML({ p: 'vx', titleId: 'vfAuthT', level: 2, anchor: true }) + '</div>';
    else if (!cs.certName) body = nameHTML('As it should appear on your Official Certificate when this piece passes to you.');
    else body = '<div class="vf-accept"><p class="vf-step">You are invited to become the next custodian of this piece. Accept to inscribe it permanently as <b>' + esc(C.formalName(cs.certName, true)) + '</b>.</p>' +
      (cs.err ? '<p class="vf-err" role="alert">' + cs.err + '</p>' : '') +
      '<button class="btn btn--solid btn--block btn--sheen" type="button" data-xfer-accept' + (cs.busy ? ' disabled' : '') + '><span class="btn__label">Accept &amp; Inscribe in My Name</span></button>' +
      '<p class="vf-fine">Valid until ' + esc(fmtDate(x.view.expires)) + '.</p></div>';
    return (x.view ? pieceStrip(x.view.piece, 'Verified authentic') : '') + body;
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
      '<div class="vf-keyline"><p class="vf-keyline__n">1 &middot; The Concealed Authenticity Seal</p><p>An encrypted NFC seal softly enclosed in a satin leaf along the lower-left inner seam. Each tap carries a fresh cryptographic signature that cannot be copied or replayed, so only the garment itself can open its record.</p></div>' +
      '<div class="vf-keyline"><p class="vf-keyline__n">2 &middot; The Solid Metal Vault Card</p><p>Brushed black stainless steel, paired at the atelier to this one garment. Its reverse carries the Archive Serial and a one-time Vault Key that inscribe the piece in your name.' + C.dref(2) + '</p></div>' +
      '<div class="vf-keyline"><p class="vf-keyline__n">Sealed for good</p><p>Once used, the Vault Key is sealed in the House Archive. After five unsuccessful attempts, verification pauses for 30 minutes. A gifted or inherited piece passes on through an official Ownership Transfer.' + C.dref(6) + '</p></div>' +
      '<p class="vf-aside__help">Need a hand? ' + careLink('House Client Care on WhatsApp', 'Good day, I would like help registering my MANTHAI piece.') + '</p></aside>';
  }
  var BODY = { gate1: gate1HTML, checking: checkingHTML, sealfail: sealFailHTML, claimed: claimedHTML, verified: verifiedStepHTML, gift: giftHTML, auth: authHTML, name: function () { return nameHTML(); }, keys: keysHTML, locked: lockedHTML, ceremony: ceremonyHTML, done: doneHTML, transfer: xferHTML };
  function paint(focusSel) {
    if (!host) return;
    stopScan();
    var body = (BODY[cs.step] || gate1HTML)();
    host.innerHTML = '<div class="wrap vf">' + headHTML() + (cs.step === 'transfer' ? '' : stepperHTML()) + '<div class="vf-grid"><div class="vf-main" data-step="' + cs.step + '">' + body + '</div>' + asideHTML() + '</div></div>';
    if (focusSel) { var f = $(focusSel, host); if (f) { try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); } } }
    var view = cs.step + '|' + cs.mode;
    if (view !== lastView) { var first = !lastView; lastView = view; if (!first) reveal(); }
    armClock();
  }
  /* each new stage of the ritual is brought into view, so the client never misses it */
  var lastView = '';
  function reveal() {
    var main = $('.vf-main', host); if (!main || ui.curRoute() !== 'verify') return;
    var hh = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10) || 72, r = main.getBoundingClientRect();
    if (r.top >= hh + 8 && r.top <= window.innerHeight * .55) return;
    var top = Math.max(0, r.top + window.scrollY - hh - 24);
    if (C.lenis) C.lenis.scrollTo(top, { immediate: C.reduced(), duration: 1 }); else window.scrollTo({ top: top, behavior: C.reduced() ? 'auto' : 'smooth' });
  }
  /* the 10-minute Gate 1 session: the line counts down, and an expired session closes Gate 2 at once */
  var clock = 0;
  function armClock() {
    clearInterval(clock); clock = 0;
    if (!cs.sess || ['verified', 'gift', 'auth', 'name', 'keys'].indexOf(cs.step) < 0) return;
    clock = setInterval(function () {
      if (ui.curRoute() !== 'verify') return;
      if (!cs.sess || cs.sess.exp <= Date.now()) { expire(); return; }
      var l = $('.vf-sess', host); if (l) { var m = minsLeft(); l.lastChild.nodeValue = 'Seal session open · ' + m + (m === 1 ? ' minute' : ' minutes') + ' remaining'; }
    }, 15000);
  }
  function expire() {
    clearInterval(clock); saveSess(null); setResume(false);
    var keepName = cs.certName; cs = fresh(); cs.query = ''; cs.certName = keepName;
    cs.notice = 'Your 10-minute seal session has closed. For your security, please tap the garment seal again to continue.';
    paint('#vfG1T');
  }

  /* ======================= the router ======================= */
  /* /verify (no query), /v?uid=&ctr=&cmac= (the seal), /verify?transfer=TOKEN */
  V.render = function (query) {
    query = query || ''; lastView = '';
    /* an unfinished ritual survives a detour; a finished or failed one starts afresh */
    if (cs.query === query && !/^(gate1|done|claimed|sealfail)$/.test(cs.step)) { paint(); return; }
    cs = fresh(); cs.query = query;
    var uid = q('uid', query), ctr = q('ctr', query), mac = q('cmac', query), xfer = q('transfer', query);
    if (uid || ctr || mac) {
      /* the tap's one-time address never stays in the history or the address bar */
      try { history.replaceState({ route: 'verify', slug: '' }, '', '/verify'); } catch (e) { /* ignore */ }
      cs.query = ''; cs.step = 'checking'; paint();
      C.reg.tap({ uid: uid, ctr: ctr, cmac: mac }).then(tapped, sealFailed);
      return;
    }
    if (xfer) { cs.step = 'transfer'; cs.xfer = { token: xfer, view: null, err: '' }; if (C.nameComplete()) cs.certName = C.person(); paint(); loadTransfer(); return; }
    var s = readSess();
    if (s) { cs.sess = s; cs.keep = !!s.keep; cs.certName = s.certName || null; cs.step = s.gift && s.gift.forBuyer && !s.keep ? 'gift' : 'verified'; if (wantsResume()) { next(); refreshSession(); return; } paint(); refreshSession(); return; }
    paint();
    /* localhost: bring in the tap simulator so the gate can be rehearsed */
    if (C.reg.DEV && !M.vaultDev) C.reg.call('status', null, 'GET').then(function () { if (cs.step === 'gate1') paint(); }, function () { /* ignore */ });
  };
  function tapped(j) {
    if (j.session) {
      cs.sess = { token: j.session, exp: j.exp, piece: j.piece, gift: j.gift || null, suggestedName: j.suggestedName || null, keep: false };
      saveSess(cs.sess);
      cs.step = j.gift && j.gift.forBuyer ? 'gift' : 'verified';
      paint('#vfOkT');
    } else { cs.tapped = j.piece; cs.step = 'claimed'; paint('#vfOkT'); }
  }
  function sealFailed(err) {
    var c = err && err.code;
    cs.notice = c === 'seal_replayed' ? 'Security Notice: This verification link has expired or was previously used. Please tap the garment directly again.'
      : c === 'seal_unknown' || c === 'seal_invalid' ? 'This seal could not be verified by the House Archive. Please tap the garment directly again; if the notice remains, consult House Client Care before accepting the piece.'
      : c === 'not_configured' ? 'The House Archive opens with the first sealed pieces of Edition 01. Please consult House Client Care to verify your piece in the meantime.'
      : 'We could not reach the House Archive just now. Please check your connection and tap the garment again.';
    cs.step = 'sealfail'; paint('#vfFailT');
  }
  /* the server's view of the session: still open, attempts left, or paused */
  function refreshSession() {
    if (!cs.sess) return;
    C.reg.session(cs.sess.token).then(function (j) {
      cs.sess.exp = j.exp; saveSess(cs.sess); cs.remaining = j.remaining;
      if (j.lockedUntil) { cs.lockedUntil = j.lockedUntil; cs.step = 'locked'; paint(); }
    }, function (err) { if (err && err.code === 'tap_required') expire(); });
  }
  /* after the seal: the gift check, the anchor account, the certificate name, then the card */
  function next() {
    if (!cs.sess || cs.sess.exp <= Date.now()) { expire(); return; }
    setResume(false);
    if (cs.sess.gift && cs.sess.gift.forBuyer && !cs.keep) { cs.step = 'gift'; paint('.vf-giftnote__keep'); return; }
    if (!C.state.member) { cs.step = 'auth'; setResume(true); paint('#vfAuthT'); return; }
    var suggested = cs.sess.suggestedName && !cs.keep;
    if (!cs.certName && (suggested || !C.nameComplete())) { cs.step = 'name'; paint('#vn-first'); return; }
    if (!cs.certName) cs.certName = C.person();
    cs.step = 'keys'; paint(cs.mode === 'scan' ? '[data-scan-start]' : '#vf-serial');
  }

  /* ======================= Gate 2: the claim ======================= */
  var ERR = {
    mismatch: function (n) { return 'The Archive Serial and Vault Key do not match this piece. ' + n + (n === 1 ? ' attempt remaining.' : ' attempts remaining.'); },
    already_claimed: 'This piece has already been inscribed and its Vault Key permanently sealed. If it was gifted or passed to you, please ask the owner for an official Ownership Transfer from their Private Circle Vault.',
    keys_format: 'Enter the Archive Serial and the four-digit Vault Key exactly as they appear on the card.',
    email_unverified: 'Please confirm your email address with the Private Access Link we sent, then continue.',
    offline: 'We could not reach the House Archive just now. Please check your connection and try again.'
  };
  function submitClaim(f) {
    var si = f.elements.serial, d = si.value.replace(/^\s*MNT/i, '').replace(/\D/g, ''), k = keyOf(f), bad = null, ke = $('.vf-key__e', f);
    if (d.length < 8 || d.length > 12) { C.setError(si, 'Enter the Archive Serial as it appears on the card, such as MNT · 4829 · 1074.'); bad = si; } else C.setError(si, '');
    if (!/^\d{4}$/.test(k)) { ke.textContent = 'Enter all four digits of the Vault Key.'; bad = bad || C.$$('.vk-d', f).filter(function (b) { return !b.value; })[0]; } else ke.textContent = '';
    if (bad) { bad.focus(); return; }
    cs.serial = d; cs.key = k; inscribe();
  }
  function inscribe() {
    if (cs.busy) return;
    if (!cs.sess || cs.sess.exp <= Date.now()) { expire(); return; }
    cs.busy = true; cs.err = ''; cs.mode = 'manual'; paint();
    C.reg.claim({ session: cs.sess.token, serial: cs.serial, key: cs.key, person: cs.certName || C.person(), keepForSelf: !!cs.keep }).then(function (j) {
      cs.busy = false; saveSess(null); setResume(false);
      if (!C.nameComplete() && cs.certName) { C.setPerson(cs.certName); C.save(); }
      cs.entry = j.piece; cs.serial = ''; cs.key = '';
      ceremony(function () { cs.step = 'done'; paint('#vfDoneT'); });
    }, function (err) {
      cs.busy = false; var c = err && err.code, x = (err && err.extra) || {};
      if (c === 'mismatch') { cs.remaining = x.remaining; cs.key = ''; cs.err = ERR.mismatch(x.remaining); paint('.vf-err'); return; }
      if (c === 'locked') { cs.lockedUntil = x.lockedUntil; cs.step = 'locked'; cs.key = ''; cs.serial = ''; paint('.vf-lock'); return; }
      if (c === 'tap_required') { expire(); return; }
      if (c === 'gift_buyer') { cs.keep = false; cs.step = 'gift'; paint('.vf-giftnote__keep'); return; }
      if (c === 'sign_in_required') { cs.step = 'auth'; setResume(true); paint('#vfAuthT'); return; }
      if (c === 'name_first' || c === 'name_last') { cs.certName = null; cs.step = 'name'; paint('#vn-first'); return; }
      cs.err = typeof ERR[c] === 'string' ? ERR[c] : ERR.offline; paint('.vf-err');
    });
  }
  function ceremony(then) {
    cs.step = 'ceremony'; paint();
    var c = $('#vfCer');
    requestAnimationFrame(function () { requestAnimationFrame(function () { if (c) c.classList.add('is-on'); }); });
    setTimeout(function () { if (c) c.classList.add('is-sealed'); }, C.reduced() ? 0 : 760);
    setTimeout(then, C.reduced() ? 80 : 1100);
  }

  /* ======================= Ownership Transfer ======================= */
  function loadTransfer() {
    var x = cs.xfer;
    C.reg.viewTransfer(x.token).then(function (j) { if (cs.xfer !== x) return; x.view = j; paint(); }, function (err) {
      if (cs.xfer !== x) return;
      x.err = err && err.code === 'transfer_expired' ? 'This Private Transfer Invitation has expired. Invitations are valid for 7 days; please ask the owner to send a new one from their Private Circle Vault.'
        : err && err.code === 'offline' ? ERR.offline : 'This Private Transfer Invitation is no longer valid. It may have been accepted or cancelled by the owner.';
      paint();
    });
  }
  function acceptTransfer() {
    if (cs.busy) return;
    cs.busy = true; cs.err = ''; paint();
    C.reg.acceptTransfer(cs.xfer.token, cs.certName).then(function (piece) {
      cs.busy = false; cs.entry = piece; cs.xfer = null;
      if (!C.nameComplete()) { C.setPerson(cs.certName); C.save(); }
      ceremony(function () { cs.step = 'done'; paint('#vfDoneT'); });
    }, function (err) {
      cs.busy = false; var c = err && err.code;
      cs.err = c === 'transfer_email' ? 'This invitation is addressed to a different email address. Sign out and enter the Private Circle with the address it was sent to.'
        : c === 'transfer_expired' ? 'This invitation has expired.' : c === 'transfer_invalid' ? 'This invitation is no longer valid.' : c === 'email_unverified' ? ERR.email_unverified : ERR.offline;
      paint('.vf-err');
    });
  }

  /* signing in mid-ritual carries straight on, with the seal session still open */
  C.on('member', function () {
    if (ui.curRoute() === 'verify') {
      if (cs.step === 'auth' && C.state.member) next();
      else if (cs.step === 'transfer') paint();
      return;
    }
    if (C.state.member && wantsResume() && readSess() && ui.curRoute() !== 'checkout') setTimeout(function () { if (ui.curRoute() !== 'verify') ui.route('verify', null, true, ''); }, 300);
  });

  /* ======================= the Optical Vault Scan (any browser: jsQR on camera frames) ======================= */
  var stream = null, scanT = 0, canvas = null, jsqrLoading = null;
  function msg(t) { var m = $('#vfScanMsg'); if (m) m.innerHTML = t || ''; }
  function setScan(state) { cs.scan = state; var f = $('#vfFinder'); if (f) f.setAttribute('data-state', state); var b = $('[data-scan-start] .btn__label', host); if (b) b.textContent = state === 'live' ? 'Scanning…' : 'Begin Optical Vault Scan'; }
  function stopScan() {
    clearTimeout(scanT); scanT = 0;
    if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
    if (cs.scan === 'live') cs.scan = 'idle';
  }
  V.stop = stopScan;
  function loadJsQR() {
    if (window.jsQR) return Promise.resolve(window.jsQR);
    if (!jsqrLoading) jsqrLoading = new Promise(function (ok, no) {
      var s = document.createElement('script'); s.src = '/assets/vendor/jsQR.js?v=1.4.0'; s.async = true;
      s.onload = function () { window.jsQR ? ok(window.jsQR) : no(new Error('jsqr')); }; s.onerror = function () { jsqrLoading = null; no(new Error('jsqr')); };
      document.head.appendChild(s);
    });
    return jsqrLoading;
  }
  /* the Optical Vault Code reads "MNT<serial>-<key>" (separators may vary) */
  function parseCode(raw) { var m = /MNT\D*(\d{8,12})\D+(\d{4})(?!\d)/i.exec(String(raw || '')); return m ? { serial: m[1], key: m[2] } : null; }
  function startScan() {
    if (cs.scan === 'live') return;
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) { msg('This browser cannot open the camera here. Please enter the key manually instead.'); return; }
    msg('Allow camera access to read the Optical Vault Code.');
    var cam = navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
    Promise.all([cam, loadJsQR()]).then(function (r) {
      var s = r[0], read = r[1];
      if (ui.curRoute() !== 'verify' || cs.step !== 'keys' || cs.mode !== 'scan') { s.getTracks().forEach(function (t) { t.stop(); }); return; }
      stream = s; var v = $('#vfVideo'); v.setAttribute('playsinline', ''); v.muted = true; v.srcObject = s;
      var p = v.play(); if (p && p.catch) p.catch(function () {});
      setScan('live'); msg('Hold the reverse of the card steady inside the frame.');
      canvas = canvas || document.createElement('canvas');
      var ctx = canvas.getContext('2d', { willReadFrequently: true });
      var tick = function () {
        if (!stream) return;
        if (v.readyState >= 2 && v.videoWidth) {
          /* the central square of the frame, at most 720px, is enough for a code held in the frame */
          var side = Math.min(v.videoWidth, v.videoHeight), sc = Math.min(1, 720 / side), w = Math.round(side * sc);
          canvas.width = w; canvas.height = w;
          ctx.drawImage(v, (v.videoWidth - side) / 2, (v.videoHeight - side) / 2, side, side, 0, 0, w, w);
          var img = ctx.getImageData(0, 0, w, w), hit = null;
          /* laser-etched on black steel, the code is light on dark: both polarities are tried */
          try { var code = read(img.data, w, w, { inversionAttempts: 'attemptBoth' }); hit = code && parseCode(code.data); } catch (e) { hit = null; }
          if (hit) { recognised(hit); return; }
        }
        scanT = setTimeout(tick, 140);
      };
      tick();
    }).catch(function (err) {
      cam.then(function (s) { if (s !== stream) s.getTracks().forEach(function (t) { t.stop(); }); }, function () {});
      setScan('idle');
      msg(err && err.name === 'NotAllowedError' ? 'Camera access was declined. You may allow it in your browser settings, or enter the key manually.'
        : err && err.message === 'jsqr' ? 'The Optical Vault Scan could not load on this connection. Please enter the key manually.'
        : 'The camera could not be opened. Please enter the key manually.');
    });
  }
  /* a soft champagne pulse, the frame folds away, and the keys set themselves into place */
  function recognised(hit) {
    stopScan(); setScan('found'); msg(''); cs.err = '';
    if (navigator.vibrate) { try { navigator.vibrate(18); } catch (e) { /* ignore */ } }
    var f = $('#vfFinder');
    setTimeout(function () { if (f) f.classList.add('is-folding'); }, C.reduced() ? 0 : 650);
    setTimeout(function () { cs.mode = 'manual'; cs.scan = 'idle'; cs.serial = hit.serial; cs.key = hit.key; paintManual(true); }, C.reduced() ? 60 : 1050);
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
  if (host) {
    host.addEventListener('click', function (e) {
      var t;
      if ((t = e.target.closest('[data-vf-mode]'))) { var md = t.getAttribute('data-vf-mode'); if (md !== cs.mode) { stopScan(); cs.mode = md; paint('#vfTab-' + md); } return; }
      if (e.target.closest('[data-scan-start]')) { startScan(); return; }
      if (e.target.closest('[data-vf-claim]')) { next(); return; }
      if (e.target.closest('[data-vf-keep]')) { cs.keep = true; cs.sess.keep = true; saveSess(cs.sess); cs.certName = null; next(); return; }
      if (e.target.closest('[data-vf-rename]')) { cs.step = 'name'; paint('#vn-first'); return; }
      if (e.target.closest('[data-xfer-accept]')) { acceptTransfer(); return; }
      if (C.reg.DEV) {
        if (e.target.closest('[data-dev-load]')) { C.reg.call('status', null, 'GET').then(function () { paint(); }); return; }
        if ((t = e.target.closest('[data-dev-tap]'))) { cs.notice = ''; cs.step = 'checking'; paint(); M.vaultDev.tapURL(t.getAttribute('data-dev-tap')).then(function (qs) { C.reg.tap(qs).then(tapped, sealFailed); }); return; }
        if (e.target.closest('[data-dev-reset]')) { M.vaultDev.reset(); saveSess(null); cs = fresh(); cs.query = ''; paint(); C.toast('The local test archive is reset.'); return; }
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
        if (e.inputType && e.inputType.indexOf('delete') === 0) { cs.serial = t.value.replace(/^\s*MNT/i, '').replace(/\D/g, ''); return; }
        var d = t.value.replace(/^\s*MNT/i, '').replace(/\D/g, '').slice(0, 12); t.value = serialShown(d); cs.serial = d;
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
    host.addEventListener('submit', function (e) {
      var f = e.target;
      if (f.id === 'vfForm') { e.preventDefault(); submitClaim(f); return; }
      if (f.id === 'vnForm') {
        e.preventDefault();
        var n = readNames(f); if (!n) return;
        cs.certName = { title: n.title, first: C.cleanName(n.first), last: C.cleanName(n.last) };
        if (cs.sess) { cs.sess.certName = cs.certName; saveSess(cs.sess); }
        if (cs.step === 'transfer') { paint('[data-xfer-accept]'); return; }
        next();
      }
    });
  }
  C.on('route', function (name) { if (name !== 'verify') { stopScan(); clearInterval(clock); clock = 0; } else armClock(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) { stopScan(); setScan('idle'); } });

  /* the router drew /verify before this file loaded */
  if (ui.curRoute && ui.curRoute() === 'verify') V.render(ui.curSlug ? ui.curSlug() : '');
})();
