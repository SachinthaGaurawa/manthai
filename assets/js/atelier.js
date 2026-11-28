/* ==========================================================================
   House of MANTHAI | The Private Atelier (/admin/atelier)
   For the House only. Anyone who arrives here sees "page not found"; the
   Founder opens /admin/atelier#enter, signs in with Google, and presents the
   Atelier Key. Every action is checked again by /api/atelier, which answers
   404 to anyone else, so this page holds no secret of its own.
     I    Metal Vault Card Pool   import a lot (archiveSerial,vaultKey)
     II   Pair & Seal Piece       seal tap + Vault Card -> Passport ID
     III  Archive Ledger          states, seal counters, pauses, concierge
   ========================================================================== */
(function () {
  'use strict';
  var M = window.MANTHAI || {}, host = document.getElementById('at');
  var DEV = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  var KEY = 'manthai.atelierKey';
  var S = { user: null, key: '', tab: 'pair', pool: null, me: null, ledger: null, q: '', busy: false, result: null, card: null, cardMsg: '', seal: null, form: {}, err: '', concierge: null, importRes: null };
  var FB = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(s, r) { return (r || document).querySelector(s); }
  function store(k, v) { try { if (v === undefined) return sessionStorage.getItem(k) || ''; if (v) sessionStorage.setItem(k, v); else sessionStorage.removeItem(k); } catch (e) { return ''; } }
  function digits(s) { return String(s || '').replace(/\D/g, ''); }
  function fmtSerial(d) { d = digits(d).slice(0, 12); return d ? 'MNT · ' + d.slice(0, 4) + (d.length > 4 ? ' · ' + d.slice(4) : '') : ''; }
  function longDate(iso) { var d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  /* ---------------------------------------------------------------- sign-in */
  function firebase() {
    if (FB) return FB;
    var base = 'https://www.gstatic.com/firebasejs/13.4.0/';
    FB = Promise.all([import(base + 'firebase-app.js'), import(base + 'firebase-auth.js')]).then(function (m) {
      var app = m[0].initializeApp(M.CONFIG.firebase, 'atelier'), A = m[1], auth = A.getAuth(app);
      return { A: A, auth: auth };
    });
    return FB;
  }
  function token() {
    if (DEV && S.user && S.user.dev) return Promise.resolve('dev');
    return firebase().then(function (f) { return f.auth.currentUser ? f.auth.currentUser.getIdToken() : ''; });
  }
  function api(op, body, q) {
    return token().then(function (t) {
      var url = '/api/atelier/' + op + (q ? '?' + q : '');
      return fetch(url, { method: body ? 'POST' : 'GET', cache: 'no-store', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t, 'X-Atelier-Key': S.key }, body: body ? JSON.stringify(body) : undefined })
        .then(function (r) { return r.json().then(null, function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j.error || 'server'); e.code = j.error || 'server'; e.status = r.status; e.extra = j; throw e; } return j; }); },
          function () { var e = new Error('offline'); e.code = 'offline'; throw e; });
    });
  }

  /* ---------------------------------------------------------------- the closed door */
  function notFound() {
    document.documentElement.setAttribute('data-gate', 'closed');
    document.title = 'Page not found · MANTHAI';
    host.innerHTML = '<section class="at-nf"><p class="at-k">Error 404</p><h1 class="at-nf__t">This page does not exist.</h1><p><a class="at-link" href="/">Return to the House</a></p></section>';
  }
  function enterHTML() {
    var signed = !!S.user;
    return '<section class="at-door" aria-labelledby="atDoorT"><p class="at-k">House of MANTHAI</p><h1 class="at-door__t" id="atDoorT" tabindex="-1">The Private Atelier</h1>' +
      (signed ? '<p class="at-door__p">Signed in as <b>' + esc(S.user.email) + '</b>. Present the Atelier Key to continue.</p>' +
        '<form class="at-form" id="atKeyForm" novalidate><label class="at-f"><span>Atelier Key</span><input type="password" id="atKey" autocomplete="current-password" required></label>' +
        (S.err ? '<p class="at-err" role="alert">' + esc(S.err) + '</p>' : '') +
        '<button class="at-btn" type="submit"' + (S.busy ? ' disabled' : '') + '>' + (S.busy ? 'Consulting the House Archive…' : 'Enter the Atelier') + '</button></form>' +
        '<button class="at-link" type="button" data-out>Use another account</button>'
      : '<p class="at-door__p">For the Founder and the atelier team only. Sign in with the Google account the House has allowed.</p>' +
        (S.err ? '<p class="at-err" role="alert">' + esc(S.err) + '</p>' : '') +
        '<button class="at-btn" type="button" data-google>Continue with Google</button>' +
        (DEV ? '<button class="at-link" type="button" data-dev>Localhost preview (the server still refuses it)</button>' : '')) + '</section>';
  }

  /* ---------------------------------------------------------------- the Atelier */
  var TABS = [['pool', 'I', 'Metal Vault Card Pool'], ['pair', 'II', 'Pair & Seal Piece'], ['ledger', 'III', 'Archive Ledger']];
  function shell(inner) {
    return '<nav class="at-tabs" role="tablist" aria-label="Atelier">' + TABS.map(function (t) {
      var on = S.tab === t[0];
      return '<button class="at-tab" role="tab" type="button" id="atTab-' + t[0] + '" aria-selected="' + on + '" aria-controls="atPane" tabindex="' + (on ? 0 : -1) + '" data-tab="' + t[0] + '"><span class="at-tab__n">' + t[1] + '</span>' + esc(t[2]) + '</button>';
    }).join('') + '</nav>' + (S.me && (!S.me.pepper || !S.me.seal) ? '<p class="at-warn" role="status">' + (!S.me.pepper ? 'VAULT_PEPPER is not set on the server. ' : '') + (!S.me.seal ? 'NFC_SDM_MAC_KEY is not set on the server.' : '') + '</p>' : '') +
      '<div class="at-pane" id="atPane" role="tabpanel" aria-labelledby="atTab-' + S.tab + '">' + inner + '</div>';
  }
  function poolCounts() {
    var p = S.pool;
    var n = function (v, l, k) { return '<div class="at-stat' + (k ? ' at-stat--' + k : '') + '"><b>' + (p ? v : '–') + '</b><span>' + l + '</span></div>'; };
    return '<div class="at-stats">' + n(p && p.available, 'Available') + n(p && p.paired, 'Paired, awaiting client') + n(p && p.claimed, 'Claimed &amp; sealed', 'quiet') + '</div>';
  }
  function poolHTML() {
    var r = S.importRes;
    return '<section class="at-sec"><header class="at-sec__h"><h2 class="at-h" tabindex="-1">Metal Vault Card Pool</h2><p class="at-p">Import each lot of Solid Metal Vault Cards once, when it arrives. The server keeps only peppered digests: the Vault Keys are never stored.</p></header>' +
      poolCounts() +
      '<form class="at-form at-form--import" id="atImport" novalidate>' +
        '<label class="at-f"><span>Lot name</span><input id="atLot" maxlength="40" placeholder="Lot 01 · December 2026"></label>' +
        '<label class="at-f"><span>CSV file from the card maker</span><input type="file" id="atCsvFile" accept=".csv,text/csv,text/plain"></label>' +
        '<label class="at-f at-f--wide"><span>Or paste the rows <small>archiveSerial,vaultKey</small></span><textarea id="atCsv" rows="6" spellcheck="false" placeholder="archiveSerial,vaultKey&#10;48291074,7392"></textarea></label>' +
        '<button class="at-btn" type="submit"' + (S.busy ? ' disabled' : '') + '>' + (S.busy ? 'Sealing the lot…' : 'Import the Lot') + '</button>' +
      '</form>' +
      (r ? '<div class="at-note" role="status"><p><b>' + r.added + '</b> cards added to ' + esc(r.lot) + '.' + (r.duplicates ? ' ' + r.duplicates + ' already in the pool were left untouched.' : '') + '</p>' +
        (r.invalid && r.invalid.length ? '<p>Rows not imported (check them): ' + r.invalid.slice(0, 30).join(', ') + (r.invalid.length > 30 ? '…' : '') + '</p>' : '') + '</div>' : '') +
      (S.err ? '<p class="at-err" role="alert">' + esc(S.err) + '</p>' : '') +
      '<p class="at-fine">After a successful import, delete the CSV from every computer and inbox. The House Archive can check a card without it.</p></section>';
  }

  /* the piece being sealed */
  function product(id) { return (M.PRODUCTS || []).filter(function (p) { return p.id === id; })[0] || null; }
  function editionLabel(f) {
    var p = product(f.pid); if (!p) return '';
    if (p.edition) { var n = parseInt(f.no, 10); return n >= 1 && n <= p.edition ? 'Edition 01 · Piece ' + pad2(n) + ' of ' + pad2(p.edition) : ''; }
    return 'Edition 01 · Batch of ' + pad2(p.batch || 0);
  }
  /* The garment seal input takes a tap URL, or a UID typed by a reader in Keyboard Emulation
     (with or without colons, hyphens or spaces). NXP NTAG 424 DNA UIDs always start with 04. */
  var MSG_REV = 'This UID appears reversed (LSB-first). Switch your ACR1552U Keyboard Emulation output to MSB-first Hex.';
  var MSG_DEC = 'Reader output appears to be Decimal. Configure ACR1552U Keyboard Emulation to 7-byte MSB-first Hex.';
  function uidCheck(c) {
    if (/^[0-9a-f]{14}$/i.test(c)) {
      c = c.toLowerCase();
      if (c.slice(0, 2) === '04') return { uid: c };
      return { bad: true, why: c.slice(-2) === '04' ? MSG_REV : 'This is not an NXP NTAG 424 DNA UID: those always start with 04.' };
    }
    if (/^\d+$/.test(c)) return { bad: true, why: MSG_DEC };
    return { bad: true, why: 'This is not a seal URL or a 14-character UID.' };
  }
  function sealInfo(v) {
    var t = String(v || '').trim(); if (!t) return null;
    var m = /[?&]uid=([^&#\s]*)/i.exec(t);
    if (m) {
      var u = uidCheck(decodeURIComponent(m[1]).replace(/[\s:-]/g, ''));
      if (u.bad) return u;
      u.tap = /[?&]ctr=[0-9a-f]{6}(&|#|$)/i.test(t) && /[?&]cmac=[0-9a-f]{16}(&|#|$)/i.test(t);
      u.value = u.tap ? t : u.uid;
      return u;
    }
    if (/^[a-z]+:\/\//i.test(t)) return { bad: true, why: 'This link has no seal UID in it.' };
    var r = uidCheck(t.replace(/[\s:-]/g, '')); r.value = r.uid; return r;
  }
  function sealMsg(s) {
    if (!s) return '';
    if (s.bad) return esc(s.why);
    return s.tap ? '&#10003; Tap URL read · UID ' + esc(s.uid) + ' · its signature is checked when you seal' : '&#10003; UID ' + esc(s.uid) + ' · a tap URL is preferred: it proves the chip was encoded with the House key';
  }
  function pairHTML() {
    if (S.result) return certHTML(S.result);
    var f = S.form, p = product(f.pid), seal = sealInfo(f.nfc), ed = editionLabel(f);
    var opts = (M.PRODUCTS || []).map(function (x) { return '<option value="' + esc(x.id) + '"' + (f.pid === x.id ? ' selected' : '') + '>' + esc(x.name) + '</option>'; }).join('');
    var sizes = ['XS', 'S', 'M', 'L', 'XL'].map(function (s) { return '<option' + (f.size === s ? ' selected' : '') + '>' + s + '</option>'; }).join('');
    var titles = ['', 'Ms.', 'Mrs.', 'Miss', 'Mr.', 'Dr.', 'Prof.', 'Hon.', 'Rev.'].map(function (t) { return '<option value="' + t + '"' + ((f.rTitle || '') === t ? ' selected' : '') + '>' + (t || 'Title (optional)') + '</option>'; }).join('');
    var card = S.card;
    return '<section class="at-sec"><header class="at-sec__h"><h2 class="at-h" tabindex="-1">Pair &amp; Seal Piece</h2><p class="at-p">The garment seal, its Solid Metal Vault Card and a new Passport ID are bound in one step. The card leaves the pool for good.</p></header>' +
      '<form class="at-form at-pair" id="atPair" novalidate>' +
      '<fieldset class="at-set"><legend><span class="at-set__n">1</span>The piece</legend>' +
        '<label class="at-f at-f--wide"><span>Garment</span><select id="atPid" data-f="pid"><option value="">Choose the garment</option>' + opts + '</select></label>' +
        '<label class="at-f"><span>Size</span><select id="atSize" data-f="size"><option value="">Size</option>' + sizes + '</select></label>' +
        (p && p.edition ? '<label class="at-f"><span>Piece number <small>of ' + pad2(p.edition) + '</small></span><input id="atNo" data-f="no" inputmode="numeric" maxlength="2" value="' + esc(f.no || '') + '"></label>' : '') +
        '<p class="at-ed" aria-live="polite">' + (ed ? esc(ed) : (p ? 'Enter the piece number from the edition register.' : '')) + '</p>' +
      '</fieldset>' +
      '<fieldset class="at-set"><legend><span class="at-set__n">2</span>The order</legend>' +
        '<label class="at-f"><span>Order reference</span><input data-f="orderRef" maxlength="24" value="' + esc(f.orderRef || '') + '" placeholder="ORD-8F2K1Q" autocapitalize="characters"></label>' +
        '<label class="at-f"><span>Buyer email</span><input data-f="buyerEmail" type="email" maxlength="120" value="' + esc(f.buyerEmail || '') + '" autocomplete="off"></label>' +
        '<label class="at-check"><input type="checkbox" data-f="gift"' + (f.gift ? ' checked' : '') + '> <span>A gift: the recipient inscribes it under their own email</span></label>' +
        (f.gift ? '<div class="at-gift"><label class="at-f"><span>Title</span><select data-f="rTitle">' + titles + '</select></label>' +
          '<label class="at-f"><span>Recipient first name</span><input data-f="rFirst" maxlength="60" value="' + esc(f.rFirst || '') + '"></label>' +
          '<label class="at-f"><span>Recipient last name</span><input data-f="rLast" maxlength="60" value="' + esc(f.rLast || '') + '"></label>' +
          '<p class="at-fine">The buyer will see only the piece and a neutral status, never the recipient&rsquo;s keys or certificate.</p></div>' : '') +
      '</fieldset>' +
      '<fieldset class="at-set"><legend><span class="at-set__n">3</span>The Concealed Authenticity Seal</legend>' +
        '<label class="at-f at-f--wide"><span>Tap the garment seal on the reader, or paste its tap URL or UID</span><input id="atNfc" data-f="nfc" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="next" aria-describedby="atNfcMsg" value="' + esc(f.nfc || '') + '" placeholder="https://…/v?uid=…&amp;ctr=…&amp;cmac=…"></label>' +
        '<p class="at-ok' + (seal && seal.bad ? ' is-bad' : '') + '" id="atNfcMsg" aria-live="polite">' + sealMsg(seal) + '</p>' +
      '</fieldset>' +
      '<fieldset class="at-set"><legend><span class="at-set__n">4</span>The Solid Metal Vault Card</legend>' +
        '<div class="at-scan" id="atScan" data-state="' + (S.scanning ? 'live' : 'idle') + '"><video id="atVideo" playsinline muted aria-hidden="true"></video><span class="at-scan__beam" aria-hidden="true"></span></div>' +
        '<button class="at-btn at-btn--quiet" type="button" data-scan>' + (S.scanning ? 'Stop the camera' : 'Optical Vault Scan') + '</button>' +
        '<label class="at-f"><span>Archive Serial</span><input id="atSerial" data-f="serial" inputmode="numeric" autocomplete="off" value="' + esc(fmtSerial(f.serial)) + '" placeholder="MNT · 4829 · 1074"></label>' +
        '<label class="at-f"><span>Vault Key</span><input id="atVKey" data-f="key" inputmode="numeric" maxlength="4" autocomplete="off" value="' + esc(f.key || '') + '" placeholder="4 digits"></label>' +
        '<p class="at-ok' + (card && card.state !== 'available' ? ' is-bad' : '') + '" aria-live="polite">' + esc(S.cardMsg) + '</p>' +
      '</fieldset>' +
      (S.err ? '<p class="at-err" role="alert">' + esc(S.err) + '</p>' : '') +
      '<button class="at-btn at-btn--seal" type="submit"' + (S.busy ? ' disabled aria-busy="true"' : '') + '>' + (S.busy ? 'Sealing…' : 'Seal &amp; Pair Piece') + '</button>' +
      '</form></section>';
  }
  function certHTML(r) {
    return '<section class="at-sec"><div class="at-cert" id="atCert"><p class="at-k">House of MANTHAI &middot; Certificate Summary</p>' +
      '<h2 class="at-cert__t" tabindex="-1">' + esc(r.name) + '</h2>' +
      '<dl class="at-dl"><div><dt>Passport ID</dt><dd>' + esc(r.id) + '</dd></div><div><dt>Piece</dt><dd>' + esc(r.name) + ', size ' + esc(r.size) + '</dd></div>' +
      '<div><dt>Edition</dt><dd>' + esc(r.edition) + '</dd></div><div><dt>Sealed</dt><dd>' + esc(longDate(r.issued)) + '</dd></div></dl>' +
      '<p class="at-cert__f">Verify by tapping the Concealed Authenticity Seal in the lower-left inner seam. Inscription requires the Solid Metal Vault Card in this box.</p></div>' +
      '<p class="at-note" role="status">Paired and sealed. ' + (r.sealVerified ? 'The seal&rsquo;s signature was verified.' : 'The seal was entered by UID: tap it once on a phone before closing the box to confirm it opens this record.') + (r.isGift ? ' Gift privacy is on.' : '') + '</p>' +
      '<div class="at-acts"><button class="at-btn" type="button" data-print>Print for the Box</button><button class="at-btn at-btn--quiet" type="button" data-next>Seal the Next Piece</button></div></section>';
  }
  function ledgerHTML() {
    var L = S.ledger, c = S.concierge;
    var row = function (r) {
      var cls = r.state === 'Inscribed' ? 'ok' : r.state === 'Awaiting Activation' ? 'wait' : r.state === 'Transfer Pending' ? 'move' : 'alert';
      return '<tr><td><b>' + esc(r.id) + '</b><span>' + esc(r.orderRef || '–') + '</span></td><td>' + esc(r.name) + '<span>' + esc(r.size) + ' · ' + esc(r.edition) + (r.isGift ? ' · gift' : '') + '</span></td>' +
        '<td><span class="at-pill at-pill--' + cls + '">' + esc(r.state) + '</span>' + (r.owner ? '<span>' + esc(r.owner) + (r.via === 'concierge' ? ' · concierge' : r.via === 'transfer' ? ' · transfer' : '') + '</span>' : '') + (r.fails ? '<span>' + r.fails + ' wrong card attempt' + (r.fails === 1 ? '' : 's') + '</span>' : '') + '</td>' +
        '<td class="at-num" data-l="Seal counter">' + (r.lastCtr == null ? '–' : r.lastCtr < 0 ? 'not tapped' : r.lastCtr) + (r.sealVerified ? '' : '<span>entered by UID</span>') + '</td>' +
        '<td class="at-act">' + (r.lockedUntil ? '<button class="at-link" type="button" data-release="' + esc(r.id) + '">Lift the pause</button>' : '') +
          (r.state === 'Awaiting Activation' ? '<button class="at-link" type="button" data-concierge="' + esc(r.id) + '">Concierge registration</button>' : '') + '</td></tr>';
    };
    return '<section class="at-sec"><header class="at-sec__h"><h2 class="at-h" tabindex="-1">Archive Ledger &amp; Security Monitor</h2><p class="at-p">Every sealed piece, its state and the last counter its seal reported.</p></header>' +
      '<form class="at-search" id="atSearch" role="search"><label class="at-f"><span>Search</span><input id="atQ" type="search" value="' + esc(S.q) + '" placeholder="Passport ID, order, piece, UID or surname"></label><button class="at-btn at-btn--quiet" type="submit">Search</button></form>' +
      (c ? conciergeHTML(c) : '') +
      (S.err ? '<p class="at-err" role="alert">' + esc(S.err) + '</p>' : '') +
      (!L ? '<p class="at-p">Consulting the House Archive…</p>' : !L.rows.length ? '<p class="at-p">No sealed pieces' + (S.q ? ' match this search' : ' yet') + '.</p>' :
        '<div class="at-table"><table><thead><tr><th scope="col">Passport ID</th><th scope="col">Piece</th><th scope="col">State</th><th scope="col">Seal counter</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>' + L.rows.map(row).join('') + '</tbody></table></div>') +
      '</section>';
  }
  function conciergeHTML(c) {
    var titles = ['', 'Ms.', 'Mrs.', 'Miss', 'Mr.', 'Dr.', 'Prof.', 'Hon.', 'Rev.'].map(function (t) { return '<option value="' + t + '">' + (t || 'Title (optional)') + '</option>'; }).join('');
    return '<form class="at-form at-conc" id="atConc" novalidate><h3 class="at-h3">Concierge-Assisted Registration &middot; ' + esc(c.id) + '</h3>' +
      '<p class="at-p">Only after a member of the House has seen the client, the garment and the Vault Card. The client must already hold a Private Circle account with a verified email.</p>' +
      '<label class="at-f"><span>Client email</span><input name="email" type="email" required></label>' +
      '<label class="at-f"><span>Title</span><select name="title">' + titles + '</select></label>' +
      '<label class="at-f"><span>First name</span><input name="first" required maxlength="60"></label><label class="at-f"><span>Last name</span><input name="last" required maxlength="60"></label>' +
      '<label class="at-f at-f--wide"><span>How the client was verified</span><input name="note" required maxlength="240" placeholder="Seen at the atelier with ID and the Vault Card, 29 November"></label>' +
      '<div class="at-acts"><button class="at-btn" type="submit">Inscribe for the Client</button><button class="at-link" type="button" data-conc-cancel>Cancel</button></div></form>';
  }

  /* ---------------------------------------------------------------- painting */
  function paint(focus) {
    stopScan(true);
    var open = S.user && S.me;
    document.documentElement.setAttribute('data-gate', open ? 'open' : 'door');
    document.title = open ? 'Private Atelier · MANTHAI' : 'The Private Atelier · MANTHAI';
    Array.prototype.forEach.call(document.querySelectorAll('[data-when="open"]'), function (n) { n.hidden = !open; });
    host.innerHTML = open ? shell(S.tab === 'pool' ? poolHTML() : S.tab === 'ledger' ? ledgerHTML() : pairHTML()) : enterHTML();
    var f = focus && $(focus, host); if (f) f.focus({ preventScroll: false });
  }
  function open() {
    S.busy = true; paint();
    api('whoami').then(function (me) {
      S.me = me; S.busy = false; S.err = ''; store(KEY, S.key);
      paint('.at-h'); refreshPool();
    }, function (e) {
      S.busy = false; S.me = null; S.key = ''; store(KEY, '');
      S.err = e.code === 'offline' ? 'The House Archive could not be reached. Please try again.' : 'This account or Atelier Key is not recognised. After five attempts the Atelier pauses for 30 minutes.';
      paint('#atKey');
    });
  }
  function refreshPool() { api('pool').then(function (p) { S.pool = p; if (S.tab === 'pool') paint(); }, function () {}); }
  function loadLedger() { S.ledger = null; api('ledger', null, 'q=' + encodeURIComponent(S.q)).then(function (l) { S.ledger = l; if (S.tab === 'ledger') paint(); }, fail); }
  var ERR = {
    card_unknown: 'This Vault Card is not in the pool. Import its lot first, or check the Archive Serial.',
    card_mismatch: 'The Vault Key does not match this Archive Serial.',
    card_used: 'This Vault Card is already paired to another piece.',
    seal_paired: 'This garment seal is already paired to another piece.',
    seal_invalid: 'The tap URL did not verify with the House key. Re-encode the chip, or tap again.',
    seal_format: 'Tap the seal, or paste its tap URL or 14-character UID.', seal_reversed: MSG_REV,
    edition_taken: 'This edition number is already sealed for this garment.',
    edition_format: 'Choose the garment and its piece number.', piece_format: 'Choose the garment.', size_format: 'Choose the size.',
    email_invalid: 'Check the email address.', gift_buyer_email: 'A gift needs the buyer email, so the buyer sees it as dispatched.',
    name_first: 'Enter the first name.', name_last: 'Enter the last name.', keys_format: 'The Archive Serial has 8 to 12 digits and the Vault Key 4.',
    note_required: 'Write how the client was verified.', client_unknown: 'No Private Circle account uses this email yet. Ask the client to sign in once.',
    client_unverified: 'The client has not verified this email yet.', already_claimed: 'This piece is already inscribed.',
    empty: 'No valid rows were found in this CSV.', too_many: 'Import at most 5,000 cards at a time.',
    not_configured: 'The server keys are not set yet (VAULT_PEPPER, NFC_SDM_MAC_KEY).', offline: 'The House Archive could not be reached. Please try again.'
  };
  function fail(e) {
    S.busy = false;
    if (e && e.status === 404 && e.code === 'not_found') { S.me = null; S.key = ''; store(KEY, ''); S.err = 'Your Atelier session ended. Please present the Atelier Key again.'; paint('#atKey'); return; }
    S.err = (e && ERR[e.code]) || 'Something did not go through. Please try again.'; paint('.at-err');
  }

  /* ---------------------------------------------------------------- the Vault Card camera (jsQR) */
  var stream = null, timer = 0, canvas = null, jsqr = null;
  function loadJsQR() {
    if (window.jsQR) return Promise.resolve(window.jsQR);
    jsqr = jsqr || new Promise(function (ok, no) { var s = document.createElement('script'); s.src = '/assets/vendor/jsQR.js?v=1.4.0'; s.onload = function () { ok(window.jsQR); }; s.onerror = no; document.head.appendChild(s); });
    return jsqr;
  }
  function stopScan(keepFlag) { clearTimeout(timer); if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; } if (!keepFlag) S.scanning = false; }
  function startScan() {
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) { S.cardMsg = 'This browser cannot open the camera. Enter the serial and key.'; paint(); return; }
    S.scanning = true; paint();
    Promise.all([navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false }), loadJsQR()]).then(function (r) {
      var v = $('#atVideo'); if (!v || !S.scanning) { r[0].getTracks().forEach(function (t) { t.stop(); }); return; }
      stream = r[0]; v.srcObject = stream; var pl = v.play(); if (pl && pl.catch) pl.catch(function () {});
      canvas = canvas || document.createElement('canvas'); var ctx = canvas.getContext('2d', { willReadFrequently: true });
      (function tick() {
        if (!stream) return;
        if (v.readyState >= 2 && v.videoWidth) {
          var side = Math.min(v.videoWidth, v.videoHeight), sc = Math.min(1, 720 / side), w = Math.round(side * sc);
          canvas.width = w; canvas.height = w; ctx.drawImage(v, (v.videoWidth - side) / 2, (v.videoHeight - side) / 2, side, side, 0, 0, w, w);
          var code = null; try { code = r[1](ctx.getImageData(0, 0, w, w).data, w, w, { inversionAttempts: 'attemptBoth' }); } catch (e) { code = null; }
          var m = code && /MNT\D*(\d{8,12})\D+(\d{4})(?!\d)/i.exec(code.data);
          if (m) { stopScan(); S.form.serial = m[1]; S.form.key = m[2]; paint('#atVKey'); checkCard(); return; }
        }
        timer = setTimeout(tick, 140);
      })();
    }, function () { S.scanning = false; S.cardMsg = 'The camera could not be opened. Enter the serial and key.'; paint(); });
  }
  var checkSeq = 0;
  function checkCard() {
    var s = digits(S.form.serial), k = digits(S.form.key);
    S.card = null; S.cardMsg = '';
    if (s.length < 8 || k.length !== 4) { var m = $('#atPair .at-set:nth-of-type(4) .at-ok'); if (m) { m.textContent = ''; m.classList.remove('is-bad'); } return; }
    var mine = ++checkSeq;
    api('card-check', { serial: s, key: k }).then(function (c) {
      if (mine !== checkSeq) return;
      S.card = c; S.cardMsg = c.state === 'available' ? '✓ In the pool and unassigned' : c.state === 'used' ? 'Already paired to ' + (c.pieceId || 'another piece') : c.state === 'mismatch' ? 'The Vault Key does not match this Archive Serial' : 'Not in the pool: import its lot first';
      var el = $('#atPair .at-set:nth-of-type(4) .at-ok'); if (el) { el.textContent = S.cardMsg; el.classList.toggle('is-bad', c.state !== 'available'); }
    }, function () {});
  }

  /* ---------------------------------------------------------------- events */
  document.addEventListener('click', function (e) {
    var t;
    if (e.target.closest('[data-google]')) {
      S.err = '';
      firebase().then(function (f) { var p = new f.A.GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' }); return f.A.signInWithPopup(f.auth, p); })
        .then(null, function (err) { S.err = err && err.code === 'auth/popup-closed-by-user' ? '' : 'Google sign-in did not complete. Please try again.'; paint(); });
      return;
    }
    if (e.target.closest('[data-dev]')) { S.err = ''; S.user = { email: 'founder@localhost', dev: true }; paint('#atKey'); return; }
    if (e.target.closest('[data-out]')) {
      store(KEY, ''); S.key = ''; S.me = null; S.err = '';
      if (S.user && S.user.dev) { S.user = null; paint(); return; }
      firebase().then(function (f) { return f.A.signOut(f.auth); }); return;
    }
    if ((t = e.target.closest('[data-tab]'))) { S.tab = t.getAttribute('data-tab'); S.err = ''; if (S.tab === 'ledger') loadLedger(); if (S.tab === 'pool') refreshPool(); paint('.at-h'); return; }
    if (e.target.closest('[data-scan]')) { if (S.scanning) { stopScan(); paint(); } else startScan(); return; }
    if (e.target.closest('[data-print]')) { window.print(); return; }
    if (e.target.closest('[data-next]')) { var keep = { pid: S.form.pid, size: S.form.size, orderRef: '', buyerEmail: '' }; S.form = keep; S.result = null; S.card = null; S.cardMsg = ''; paint('#atNfc'); return; }
    if ((t = e.target.closest('[data-release]'))) { api('release', { id: t.getAttribute('data-release') }).then(loadLedger, fail); return; }
    if ((t = e.target.closest('[data-concierge]'))) { S.concierge = { id: t.getAttribute('data-concierge') }; S.err = ''; paint('#atConc input'); return; }
    if (e.target.closest('[data-conc-cancel]')) { S.concierge = null; paint(); return; }
  });
  function showSeal(el) {
    var s = sealInfo(el.value), ok = $('#atNfcMsg');
    if (ok) { ok.classList.toggle('is-bad', !!(s && s.bad)); ok.innerHTML = sealMsg(s); }
    el.setAttribute('aria-invalid', s && s.bad ? 'true' : 'false');
    return s;
  }
  /* a keyboard-wedge reader types the UID and then presses Enter: normalise it and move on to the Vault Card, never submit */
  document.addEventListener('keydown', function (e) {
    if (e.target.id !== 'atNfc' || (e.key !== 'Enter' && e.keyCode !== 13)) return;
    e.preventDefault(); e.stopPropagation();
    var el = e.target, s = showSeal(el);
    if (!s || s.bad) { el.select(); return; }
    if (!s.tap) { el.value = s.uid; S.form.nfc = s.uid; }
    var next = $('#atSerial'); if (next) { next.focus(); next.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  }, true);
  document.addEventListener('keydown', function (e) {
    var t = e.target.closest && e.target.closest('[role="tab"]'); if (!t || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
    var i = TABS.map(function (x) { return x[0]; }).indexOf(t.getAttribute('data-tab')), n = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length][0];
    S.tab = n; if (n === 'ledger') loadLedger(); paint('#atTab-' + n);
  });
  document.addEventListener('input', function (e) {
    var el = e.target, k = el.getAttribute && el.getAttribute('data-f'); if (!k) return;
    S.form[k] = el.type === 'checkbox' ? el.checked : el.value;
    if (k === 'serial') { var d = digits(el.value).slice(0, 12); S.form.serial = d; }
    if (k === 'key') { S.form.key = digits(el.value).slice(0, 4); el.value = S.form.key; }
    if (k === 'serial' || k === 'key') { checkCard(); return; }
    if (k === 'pid' || k === 'gift') { if (k === 'pid') S.form.no = ''; paint('[data-f="' + k + '"]'); return; }
    if (k === 'no') { var ed = $('.at-ed'); if (ed) ed.textContent = editionLabel(S.form) || 'Enter the piece number from the edition register.'; return; }
    if (k === 'nfc') showSeal(el);
  });
  document.addEventListener('change', function (e) {
    if (e.target.id === 'atCsvFile' && e.target.files && e.target.files[0]) {
      var fr = new FileReader(); fr.onload = function () { var ta = $('#atCsv'); if (ta) ta.value = String(fr.result || '').slice(0, 400000); }; fr.readAsText(e.target.files[0]);
    }
    if (e.target.getAttribute && e.target.getAttribute('data-f') === 'serial') e.target.value = fmtSerial(S.form.serial);
  });
  document.addEventListener('submit', function (e) {
    var f = e.target; e.preventDefault();
    if (f.id === 'atKeyForm') { var k = $('#atKey').value; if (k) { S.key = k; open(); } return; }
    if (f.id === 'atImport') {
      var csv = $('#atCsv').value; if (!csv.trim()) { S.err = 'Choose the CSV file or paste its rows.'; paint(); return; }
      S.busy = true; S.err = ''; paint();
      api('import', { csv: csv, lot: $('#atLot').value }).then(function (r) { S.busy = false; S.importRes = r; S.pool = r.pool; paint('.at-note'); }, fail);
      return;
    }
    if (f.id === 'atPair') {
      var F = S.form, p = product(F.pid), ed = editionLabel(F);
      S.err = !p ? ERR.piece_format : !F.size ? ERR.size_format : !ed ? ERR.edition_format : !sealInfo(F.nfc) ? ERR.seal_format : sealInfo(F.nfc).bad ? sealInfo(F.nfc).why : digits(F.serial).length < 8 || digits(F.key).length !== 4 ? ERR.keys_format : '';
      if (S.err) { paint('.at-err'); return; }
      S.busy = true; paint();
      api('pair', { pid: p.id, name: p.name, size: F.size, edition: ed, nfc: sealInfo(F.nfc).value, serial: F.serial, key: F.key, orderRef: F.orderRef, buyerEmail: F.buyerEmail,
        gift: !!F.gift, recipient: F.gift ? { title: F.rTitle || '', first: F.rFirst, last: F.rLast } : null })
        .then(function (r) { S.busy = false; S.result = r.piece; S.pool = r.pool; S.card = null; S.cardMsg = ''; paint('.at-cert__t'); }, fail);
      return;
    }
    if (f.id === 'atSearch') { S.q = $('#atQ').value.trim(); loadLedger(); paint('#atQ'); return; }
    if (f.id === 'atConc') {
      var d = new FormData(f);
      api('concierge', { id: S.concierge.id, email: d.get('email'), note: d.get('note'), person: { title: d.get('title'), first: d.get('first'), last: d.get('last') } })
        .then(function () { S.concierge = null; S.err = ''; loadLedger(); paint(); }, fail);
    }
  });

  /* ---------------------------------------------------------------- start */
  if (!/^#enter$/.test(location.hash)) { notFound(); window.addEventListener('hashchange', function () { if (location.hash === '#enter') location.reload(); }); return; }
  try { history.replaceState(null, '', location.pathname); } catch (e) { /* ignore */ }
  S.key = store(KEY);
  paint();
  if (!(M.CONFIG && M.CONFIG.firebase)) return;
  firebase().then(function (f) {
    f.A.onAuthStateChanged(f.auth, function (u) {
      if (S.user && S.user.dev) return;
      S.user = u ? { email: String(u.email || '').toLowerCase() } : null; S.me = null;
      if (u && S.key) open(); else paint(u ? '#atKey' : null);
    });
  }, function () { S.err = 'Sign-in could not load on this connection.'; paint(); });
})();
