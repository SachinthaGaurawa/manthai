/* ==========================================================================
   MANTHAI  |  The Private Circle at /account (Directive V3, phase E)
   A full-page client portal: overview, acquisitions with on-site tracking,
   the Digital Vault, saved silhouettes, profile and addresses, and the
   Colombo stylist concierge. Signed out, the same address offers sign-in.
   Everything is kept in this browser (C.state) until a client database exists.
   ========================================================================== */
(function () {
  'use strict';
  var M = window.MANTHAI, C = M.core, ui = M.ui;
  var $ = C.$, esc = C.esc;
  function P(n) { return C.price(n); }
  var acct = M.account = {};

  var TABS = [
    ['overview', 'Overview'],
    ['orders', 'Acquisitions &amp; Orders'],
    ['vault', 'Wardrobe &amp; Digital Vault'],
    ['saved', 'Saved Silhouettes'],
    ['profile', 'Profile, Addresses &amp; Security'],
    ['concierge', 'Private Concierge &amp; Care']
  ];
  var DISTRICTS = ['Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya', 'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee', 'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla', 'Monaragala', 'Ratnapura', 'Kegalle'];
  var TOPICS = ['Occasion & Wardrobe Styling', 'Size & Silhouette Guidance', 'Private Gift Curation', 'Garment Care & Exchange Support'];
  var FORMATS = ['Video Styling Consultation', 'WhatsApp Personal Styling'];
  var TIMES = ['10:00 AM', '11:30 AM', '1:00 PM', '2:30 PM', '4:00 PM', '5:30 PM'];
  var STAGES = ['Confirmed', 'Atelier Inspection', 'Sealed in Lacquered Box', 'Insured Courier Delivery'];
  var tab = 'overview', ui$ = { openOrder: null, form: null, editAddr: null, receipt: null, verify: false, saved: '', banner: '' };

  /* ---------- small helpers ---------- */
  function firstName(n) { var pn = C.person(); return (pn && pn.first) || String(n || '').trim().split(/\s+/)[0] || ''; }
  function initials(n) { var pn = C.person(); if (pn && pn.first && pn.last) return C.initialsOf(pn); return initials0(n); }
  function initials0(n) { var w = String(n || '').trim().split(/\s+/); return ((w[0] || '').charAt(0) + (w.length > 1 ? w[w.length - 1].charAt(0) : '')).toUpperCase() || 'M'; }
  function longDate(d) { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); }
  function shortDate(d) { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  function stamp(d) { d = new Date(d); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); }
  function at(d, h, m) { d = new Date(d); d.setHours(h, m || 0, 0, 0); return d; }
  function req(l) { return l + ' <span class="req" aria-hidden="true">*</span>'; }
  function opt(l) { return l + ' <span class="opt">(optional)</span>'; }
  function field(id, label, control, hint) {
    return '<div class="field"><label for="' + id + '">' + label + '</label>' + control + (hint ? '<span class="field__hint" id="' + id + '-h">' + hint + '</span>' : '') + '<span class="field__error" id="' + id + '-e" role="alert"></span></div>';
  }
  function input(id, name, attrs, val) { return '<input id="' + id + '" name="' + name + '" ' + (attrs || '') + ' value="' + esc(val || '') + '" aria-describedby="' + id + '-e">'; }
  function select(id, name, list, val, attrs, blank) {
    return '<select id="' + id + '" name="' + name + '" ' + (attrs || '') + ' aria-describedby="' + id + '-e">' + (blank ? '<option value="">' + blank + '</option>' : '') +
      list.map(function (x) { return '<option' + (x === val ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select>';
  }
  function toggle(name, label, on, hint) {
    return '<label class="cx-toggle acct-toggle"><input type="checkbox" name="' + name + '"' + (on ? ' checked' : '') + '><span class="cx-toggle__ui" aria-hidden="true"></span><span>' + label + (hint ? '<small>' + hint + '</small>' : '') + '</span></label>';
  }
  /* date of birth: typed as DD / MM / YYYY, stored as YYYY-MM-DD, never in the future */
  function todayISO() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function dobShow(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? m[3] + ' / ' + m[2] + ' / ' + m[1] : ''; }
  function dobISO(v) {
    var m = /^(\d{2})\D*(\d{2})\D*(\d{4})$/.exec(String(v || '').trim()); if (!m) return '';
    var d = new Date(+m[3], +m[2] - 1, +m[1]); if (d.getDate() !== +m[1] || d.getMonth() !== +m[2] - 1) return '';
    return m[3] + '-' + m[2] + '-' + m[1];
  }
  var SEAL = '<svg viewBox="0 0 1000 860" aria-hidden="true"><use href="#spiral-seal"/></svg>';
  var WA = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z" fill="none" stroke="currentColor" stroke-width="1.1"/></svg>';

  /* ---------- the order model: stages follow the clock ---------- */
  function orderTimeline(o) {
    var placed = new Date(o.date), sealed = at(C.addBusinessDays(1, placed), 10, 30), arrive = at(o.arrive, 14, 0);
    return [
      [placed, 'Order confirmed and edition assigned'],
      [new Date(placed.getTime() + 5 * 3600 * 1000), 'Quality inspection in the Colombo atelier'],
      [sealed, o.ship === 'atelier' ? 'Sealed in the lacquered box, ready for collection' : 'Sealed in the lacquered box, encased in its protective outer carton and handed to the courier'],
      [arrive, o.ship === 'atelier' ? 'Collected from the Colombo atelier' : 'Delivered by insured courier, signed for on receipt']
    ];
  }
  function stageOf(o) { var now = Date.now(), n = 0; orderTimeline(o).forEach(function (e, i) { if (e[0].getTime() <= now) n = i; }); return n; }
  function statusOf(o) {
    if (o.cancelled) return ['Cancellation Requested', 'is-hold'];
    if (o.request) return [(o.request.kind === 'exchange' ? 'Size Exchange Requested' : 'Return Requested'), 'is-hold'];
    var s = stageOf(o);
    return [['Confirmed · Preparing in Atelier', 'Confirmed · Atelier Inspection', o.ship === 'atelier' ? 'Ready for Collection' : 'Dispatched · With Courier', o.ship === 'atelier' ? 'Collected' : 'Delivered'][s], s >= 3 ? 'is-done' : 'is-live'];
  }
  function expected(o) {
    var d = new Date(o.arrive);
    if (o.ship === 'atelier') return 'Ready ' + C.fmtDay(d) + ', 2:00 PM IST';
    if (o.ship === 'colombo') return 'Arrives ' + C.fmtDay(d) + ' · 2:00 PM – 5:00 PM IST';
    return 'Arrives by ' + C.fmtDay(d);
  }
  function courier(o) { return o.ship === 'colombo' ? 'Priority Colombo Insured Courier, signature on receipt' : o.ship === 'atelier' ? 'Private Colombo Collection, House of MANTHAI atelier' : 'Islandwide Insured Courier, signature on receipt'; }
  function trackRef(o) { var d = new Date(o.date); return 'MNT-TRK-' + d.getFullYear() + '-' + String(o.ref).replace(/^ORD-/, ''); }
  function orders() { return C.state.orders || []; }
  function activeOrder() { return orders().filter(function (o) { return !o.cancelled && stageOf(o) < 3; })[0]; }
  function vaultItems() { var m = C.state.member; return m ? C.reg.ownedBy(m.email) : []; }
  function wish() { return (C.state.wishlist || []).map(C.product).filter(Boolean); }

  /* ---------- addresses: structured, with a default ---------- */
  function book() {
    var b = C.state.addressBook;
    if (!b) {
      b = C.state.addressBook = (C.state.addresses || []).map(function (line, i) { return { id: 'A' + Date.now().toString(36) + i, line: line, isDefault: i === 0 }; });
      C.save();
    }
    return b;
  }
  function addrText(a) { return a.line || [a.addr, a.addr2, a.city, a.post, a.district ? a.district + ' District' : '', 'Sri Lanka'].filter(Boolean).join(', '); }

  /* ======================= signed out: the sign-in view ======================= */
  function signInView() {
    return '<div class="acct-in"><div class="acct-in__card">' + M.auth.cardHTML({ p: 'ai', titleId: 'acctTitle', level: 1 }) + '</div></div>';
  }

  /* ======================= signed in: the portal ======================= */
  function sidebar(m) {
    var b = '<div class="acct-side"><div class="acct-side__in">' +
      '<div class="acct-id"><span class="acct-mono" aria-hidden="true">' + esc(initials(m.name)) + '</span><div><p class="acct-id__name">' + esc(C.formalName(C.person() || {}) || m.name) + '</p><p class="acct-id__meta">Private Circle · ' + esc(m.id || '') + '</p><p class="acct-id__meta">Member since ' + esc(longDate(m.since || Date.now())) + '</p></div></div>' +
      '<nav class="acct-nav" aria-label="Private Circle sections"><ul>' + TABS.map(function (t) {
        return '<li><a href="/account' + (t[0] === 'overview' ? '' : '/' + t[0]) + '" data-atab="' + t[0] + '"' + (t[0] === tab ? ' aria-current="page"' : '') + '>' + t[1] + '</a></li>';
      }).join('') + '</ul></nav>' +
      '<button class="acct-signout" type="button" data-acct-signout>Sign out</button></div></div>';
    return b;
  }
  function head(title, sub, action) {
    return '<header class="acct-head"><div><h1 class="acct-title" id="acctTitle" tabindex="-1">' + title + '</h1>' + (sub ? '<p class="acct-sub">' + sub + '</p>' : '') + '</div>' + (action || '') + '</header>';
  }
  function banner() { var b = ui$.banner; ui$.banner = ''; return b ? '<p class="acct-banner" role="status">' + b + '</p>' : ''; }
  function empty(title, text, cta) { return '<div class="acct-empty"><p class="acct-empty__t">' + title + '</p><p>' + text + '</p>' + (cta || '') + '</div>'; }

  /* ---------- Tab 1: Overview ---------- */
  function vOverview(m) {
    var o = activeOrder(), v = vaultItems().length, w = wish().length;
    var cards = [
      ['orders', 'Active Acquisition', o ? esc(statusOf(o)[0]) : 'No active acquisition', o ? esc(expected(o)) : 'Your next piece will be tracked here.'],
      ['vault', 'Digital Vault', v + (v === 1 ? ' inscribed piece' : ' inscribed pieces'), v ? 'Ownership certificates open instantly.' : 'Pieces appear here once inscribed with their Vault Card.'],
      ['saved', 'Saved Silhouettes', w + (w === 1 ? ' silhouette' : ' silhouettes'), w ? 'Reserve any of them in one click.' : 'Save a piece and it waits for you here.']
    ];
    return head('Welcome back, ' + esc(firstName(m.name) || 'friend'), 'Everything you hold with the House, in one place.') + banner() +
      '<div class="acct-cards">' + cards.map(function (c) {
        return '<a class="acct-card" href="/account/' + c[0] + '" data-atab="' + c[0] + '"><span class="acct-card__k">' + c[1] + '</span><span class="acct-card__v">' + c[2] + '</span><span class="acct-card__s">' + c[3] + '</span><span class="acct-card__go" aria-hidden="true">View</span></a>';
      }).join('') + '</div>' +
      '<h2 class="acct-h2">Quick Access</h2><ul class="acct-quick">' +
        '<li><a href="/account/orders" data-atab="orders"' + (o ? ' data-open-order="' + esc(o.ref) + '"' : '') + '>Track Active Order</a></li>' +
        '<li><a href="/verify" data-verify-page>Register a New Piece</a></li>' +
        '<li><a href="/account/profile" data-atab="profile" data-jump="acctAddresses">Manage Sri Lankan Addresses</a></li>' +
        '<li><a href="' + waHref('Good day, I am a Private Circle client and would like to speak with my Colombo stylist.') + '" target="_blank" rel="noopener">Message Colombo Stylist<span class="sr-only"> (opens WhatsApp)</span></a></li></ul>';
  }
  function waHref(t) { return 'https://wa.me/' + M.CONFIG.whatsapp + '?text=' + encodeURIComponent(t); }

  /* ---------- Tab 2: Acquisitions & Orders ---------- */
  function orderCard(o) {
    var st = statusOf(o), s = stageOf(o), open = ui$.openOrder === o.ref, first = o.items[0], p = C.product(first.id), tl = orderTimeline(o);
    var pre = !o.cancelled && !o.request && s < 2;
    var h = '<article class="acct-order" id="ord-' + esc(o.ref) + '">' +
      '<header class="acct-order__head"><div><p class="acct-order__ref">' + esc(o.ref) + '</p><p class="acct-order__date">' + esc(longDate(o.date)) + '</p></div><span class="acct-pill ' + st[1] + '">' + esc(st[0]) + '</span></header>' +
      '<div class="acct-order__body"><div class="acct-order__thumb">' + (p ? C.plateHTML(p, 'form', 'thumb') : C.archivePlate()) + '</div>' +
        '<div class="acct-order__info"><p class="acct-order__name">' + esc(first.name) + (o.items.length > 1 ? ' <span>and ' + (o.items.length - 1) + ' more</span>' : '') + '</p>' +
        '<p class="acct-order__meta">Size ' + esc(first.size) + (o.items.length > 1 ? ' · ' + o.items.length + ' pieces' : '') + '</p>' +
        '<p class="acct-order__when">' + (o.cancelled ? 'Cancellation confirmation sent to ' + esc(o.email) : esc(expected(o))) + '</p></div>' +
        '<p class="acct-order__total">' + P(o.totalLKR) + '</p></div>' +
      '<div class="acct-order__actions"><button class="acct-link" type="button" data-track="' + esc(o.ref) + '" aria-expanded="' + open + '" aria-controls="trk-' + esc(o.ref) + '">' + (open ? 'Hide Dispatch' : 'Track Dispatch') + '</button>' +
        '<button class="acct-link" type="button" data-receipt="' + esc(o.ref) + '">View Digital Receipt</button>' +
        (!o.cancelled && !o.request ? '<button class="acct-link" type="button" data-return="' + esc(o.ref) + '">Request Size Exchange / Return</button>' : '') +
        (pre ? '<button class="acct-link acct-link--quiet" type="button" data-cancel="' + esc(o.ref) + '">Request Cancellation</button>' : '') + '</div>';
    if (open) {
      h += '<div class="acct-track" id="trk-' + esc(o.ref) + '">' +
        '<dl class="acct-track__meta"><div><dt>Expected</dt><dd>' + esc(expected(o)) + '</dd></div><div><dt>Courier</dt><dd>' + esc(courier(o)) + '</dd></div>' +
          '<div><dt>Tracking Reference</dt><dd><button class="acct-trk" type="button" data-trk-log="' + esc(o.ref) + '">' + esc(trackRef(o)) + '</button></dd></div></dl>' +
        '<ol class="acct-stages" aria-label="Dispatch progress">' + STAGES.map(function (n, i) {
          return '<li class="' + (i < s ? 'is-done' : i === s ? 'is-on' : '') + '"' + (i === s ? ' aria-current="step"' : '') + '><span>' + (i + 1) + '. ' + (o.ship === 'atelier' && i === 3 ? 'Private Collection' : n) + '</span></li>';
        }).join('') + '</ol>' +
        '<div class="acct-track__grid"><div><h3 class="acct-h3">Dispatch History</h3><ol class="acct-log" id="log-' + esc(o.ref) + '">' + tl.filter(function (e, i) { return i <= s; }).reverse().map(function (e) {
          return '<li><time>' + esc(stamp(e[0])) + '</time><span>' + esc(e[1]) + '</span></li>';
        }).join('') + '</ol></div>' +
        '<div><h3 class="acct-h3">In the Box</h3><ul class="acct-contents">' + o.items.map(function (it) { return '<li>' + esc(it.name) + ' <small>Size ' + esc(it.size) + '</small></li>'; }).join('') +
          '<li>Lacquered gatefold box, lined in velvet garnet</li><li>Solid Metal Vault Card' + (o.items.length > 1 ? 's' : '') + ' in the Private Circle Presentation Case</li>' + (o.gift ? '<li>Calligraphy gift card</li>' : '') + '</ul></div></div></div>';
    }
    if (ui$.form && ui$.form.ref === o.ref && ui$.form.kind === 'return') h += returnForm(o);
    if (ui$.receipt === o.ref) h += receipt(o);
    return h + '</article>';
  }
  function returnForm(o) {
    var sizes = M.SIZECHART.sizes;
    return '<form class="acct-form acct-return" id="returnForm" data-ref="' + esc(o.ref) + '" novalidate><h3 class="acct-h3">Size Exchange or Return</h3>' +
      '<p class="acct-fine">Within 14 days of delivery. Refunds always go back to your original payment method, never to store credit.</p>' +
      '<fieldset class="cx-fs"><legend class="cx-fs__legend">What would you like?</legend><div class="choices">' +
        '<label class="choice"><input type="radio" name="kind" value="exchange" checked><span><b>Complimentary 14-Day Size Exchange</b><span>We send your new size as soon as the original returns to the atelier.</span></span></label>' +
        '<label class="choice"><input type="radio" name="kind" value="return"><span><b>Return for a Full Refund</b><span>Refunded in full to your original payment method.</span></span></label></div></fieldset>' +
      '<div class="row-2">' + field('rf-piece', req('Piece'), select('rf-piece', 'piece', o.items.map(function (it) { return it.name + ' · ' + it.size; }), null, '')) +
        field('rf-size', opt('New Size'), select('rf-size', 'size', sizes, null, '', 'Choose')) + '</div>' +
      toggle('pickup', 'Complimentary Colombo Pickup', true, 'A Maison courier collects the piece from your address.') +
      field('rf-note', opt('Note for the Atelier'), '<textarea id="rf-note" name="note" rows="2" maxlength="300"></textarea>') +
      '<div class="acct-form__row"><button class="btn btn--solid" type="submit"><span class="btn__label">Submit Request</span></button><button class="acct-link" type="button" data-form-cancel>Cancel</button></div></form>';
  }
  function receipt(o) {
    return '<section class="acct-receipt" id="receipt-' + esc(o.ref) + '" aria-label="Digital receipt ' + esc(o.ref) + '">' +
      '<header class="acct-receipt__head"><svg class="wordmark" viewBox="120 30 796 120" aria-hidden="true"><use href="#wm-paths"/></svg></header>' + C.issuerHTML() +
      '<dl class="acct-receipt__meta"><div><dt>Receipt</dt><dd>' + esc(o.ref) + '</dd></div><div><dt>Date</dt><dd>' + esc(longDate(o.date)) + '</dd></div><div><dt>Client</dt><dd>' + esc(o.name) + '</dd></div><div><dt>Payment</dt><dd>' + esc({ payhere: 'PayHere Secure Card', lankaqr: 'LankaQR Instant Pay', bank: 'Private Bank Transfer' }[o.method] || 'PayHere Secure Card') + '</dd></div></dl>' +
      '<table class="acct-receipt__table"><thead><tr><th scope="col">Piece</th><th scope="col">Size</th><th scope="col">Passport ID</th><th scope="col">Amount</th></tr></thead><tbody>' +
        o.items.map(function (it) { return '<tr><td>' + esc(it.name) + '</td><td>' + esc(it.size) + '</td><td>' + esc(it.passport) + '</td><td>' + P(it.price) + '</td></tr>'; }).join('') +
        '</tbody><tfoot><tr><td colspan="3">Insured delivery</td><td>Complimentary</td></tr><tr class="is-total"><td colspan="3">Total (LKR)</td><td>' + P(o.totalLKR) + '</td></tr></tfoot></table>' +
      '<p class="acct-fine">Delivered to: ' + esc(o.address || '') + '</p>' +
      '<div class="acct-form__row"><button class="btn btn--ghost" type="button" data-print-receipt="' + esc(o.ref) + '">Print Receipt</button><button class="acct-link" type="button" data-receipt-close>Close Receipt</button></div></section>';
  }
  function vOrders() {
    var list = orders();
    return head('Acquisitions &amp; Orders', 'Track every piece from the atelier to your door, on this page.') + banner() +
      (list.length ? '<div class="acct-orders">' + list.map(orderCard).join('') + '</div>'
        : empty('No acquisitions yet', 'When you acquire a piece, its order, dispatch tracking and receipt live here.', '<a class="btn btn--solid" href="/" data-acct-shop><span class="btn__label">Explore Edition 01</span></a>'));
  }

  /* ---------- Tab 3: Wardrobe & Digital Vault ---------- */
  var CHK = '<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
  function pieceOf(e) { return C.product(e.pid); }
  function transferPanel(e) {
    if (e.transfer) {
      var link = M.vault ? M.vault.transferLink(e) : '';
      return '<div class="acct-xfer acct-xfer--on" id="xfer-' + esc(e.id) + '"><p class="acct-xfer__t">Transfer Pending</p>' +
        '<p class="acct-fine">A Private Transfer Invitation for <b>' + esc(e.transfer.email) + '</b>, valid until ' + esc(longDate(e.transfer.expires)) + '. Share it privately; the new custodian accepts it in their own name.</p>' +
        '<div class="acct-xfer__link"><input type="text" readonly value="' + esc(link) + '" aria-label="Private Transfer Invitation Link" data-xfer-field><button class="btn btn--ghost btn--sm" type="button" data-xfer-copy="' + esc(e.id) + '"><span class="btn__label">Copy Link</span></button></div>' +
        '<button class="acct-link acct-link--quiet" type="button" data-xfer-cancel="' + esc(e.id) + '">Cancel Transfer</button></div>';
    }
    if (ui$.transfer !== e.id) return '';
    return '<form class="acct-form acct-xfer" id="xferForm" data-id="' + esc(e.id) + '" novalidate><p class="acct-xfer__t">Transfer Ownership</p>' +
      '<p class="acct-xfer__lede">Pass this creation to a new custodian. Once accepted, your Digital Product Passport will archive as a prior custodian and the new owner will inscribe the piece in their name.</p>' +
      field('xf-email', req('New Custodian’s Email Address'), input('xf-email', 'email', 'type="email" autocomplete="off" inputmode="email" required')) +
      field('xf-word', req('Type TRANSFER to confirm'), input('xf-word', 'word', 'autocomplete="off" autocapitalize="characters" spellcheck="false" required')) +
      '<div class="acct-form__row"><button class="btn btn--solid" type="submit"><span class="btn__label">Create Private Transfer Invitation</span></button><button class="acct-link" type="button" data-form-cancel>Keep Ownership</button></div></form>';
  }
  function vVault() {
    var m = C.state.member, me = String(m.email).toLowerCase(), items = vaultItems(), all = C.reg.all();
    var mine = Object.keys(all).map(function (k) { return all[k]; }).filter(function (e) { return e.buyer === me && !e.specimen; });
    var awaiting = mine.filter(function (e) { return e.status === 'UNCLAIMED' && !e.gift; }), gifts = mine.filter(function (e) { return e.gift; });
    var cta = '<a class="btn btn--solid btn--sm" href="/verify" data-verify-page><span class="btn__label">Register a New Piece</span></a>';
    var owned = items.length ? '<ul class="acct-vault">' + items.map(function (e) {
        var p = pieceOf(e), r = ui.passportRecord ? ui.passportRecord(e.id) : null;
        return '<li class="acct-vcard' + (e.transfer ? ' is-pending' : '') + '"><div class="acct-vcard__thumb">' + (p ? C.plateHTML(p, 'form', 'thumb') : C.archivePlate()) + '</div>' +
          '<div class="acct-vcard__info"><p class="acct-vcard__name">' + esc(p ? p.name : e.id) + '</p>' +
          '<dl class="acct-vcard__meta"><div><dt>Size</dt><dd>' + esc(e.size || '') + '</dd></div><div><dt>Edition</dt><dd>' + esc((r && r.edition) || e.edition || C.editionLabel(p)) + '</dd></div>' +
          '<div><dt>Passport ID</dt><dd class="acct-serial">' + esc(e.id) + '</dd></div><div><dt>Inscribed</dt><dd>' + esc(shortDate(e.inscribedAt)) + '</dd></div></dl>' +
          '<p class="acct-verified">' + CHK + (e.transfer ? 'Transfer Pending' : 'Inscribed to ' + esc(C.formalName(e.owner, true))) + '</p></div>' +
          '<div class="acct-vcard__acts"><button class="btn btn--solid acct-vcard__cta" type="button" data-cert="' + esc(e.id) + '"><span class="btn__label">View Ownership Certificate</span></button>' +
            '<button class="acct-link" type="button" data-cert-pdf="' + esc(e.id) + '"><span class="cert__lbl">Download Certificate (PDF)</span></button>' +
            (e.transfer ? '' : '<button class="acct-link acct-link--quiet" type="button" data-transfer="' + esc(e.id) + '" aria-expanded="' + (ui$.transfer === e.id) + '">Transfer Ownership</button>') + '</div>' +
          transferPanel(e) + '</li>';
      }).join('') + '</ul>'
      : empty('Your vault is waiting', 'When your piece arrives, inscribe it here with the Archive Serial and Vault Key of its Solid Metal Vault Card. Its ownership certificate is then issued in your name.', '<button class="acct-link" type="button" data-cert-sample>See a sample certificate</button>');
    var wait = awaiting.length ? '<h2 class="acct-h2">Awaiting Your Inscription</h2><ul class="acct-await">' + awaiting.map(function (e) {
        var p = pieceOf(e);
        return '<li><span class="acct-await__n">' + esc(p ? p.short : e.id) + ' <small>Size ' + esc(e.size) + ' · ' + esc(e.id) + '</small></span><a class="acct-link" href="/verify?piece=' + esc(e.id) + '" data-verify-page="piece=' + esc(e.id) + '">Inscribe with Vault Card</a></li>';
      }).join('') + '</ul><p class="acct-fine">Each piece is dispatched uninscribed. Its Solid Metal Vault Card, inside the Private Circle Presentation Case, registers it to you permanently.</p>' : '';
    var gave = gifts.length ? '<h2 class="acct-h2">Pieces You Have Gifted</h2><ul class="acct-await">' + gifts.map(function (e) {
        var p = pieceOf(e);
        return '<li><span class="acct-await__n">' + esc(p ? p.short : e.id) + ' <small>Size ' + esc(e.size) + ' · ' + esc(e.id) + '</small></span><span class="acct-await__s">' + (e.status === 'CLAIMED' ? 'Inscribed by its new owner' : 'Awaiting the recipient’s inscription') + '</span></li>';
      }).join('') + '</ul>' : '';
    return head('Wardrobe &amp; Digital Vault', 'Every piece inscribed in your name, with its Digital Product Passport.' + C.dref(6), cta) + banner() + owned + wait + gave;
  }

  /* ---------- Tab 4: Saved Silhouettes ---------- */
  function vSaved() {
    var list = wish(), alerts = C.state.stockAlerts || {}, picks = C.state.savedSize || {};
    return head('Saved Silhouettes', 'Kept on this device and in your Private Circle.') + banner() +
      (list.length ? '<ul class="acct-saved">' + list.map(function (p) {
        var sel = picks[p.id] || '';
        return '<li class="acct-sv" data-sv="' + esc(p.id) + '"><a class="acct-sv__plate" href="/pieces/' + esc(p.id) + '" data-piece="' + esc(p.id) + '">' + C.plateHTML(p, 'form', 'card') + '</a>' +
          '<button class="acct-sv__x" type="button" data-unwish="' + esc(p.id) + '" aria-label="Remove ' + esc(p.short) + ' from Saved Silhouettes"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.1"/></svg></button>' +
          '<div class="acct-sv__info"><a class="acct-sv__name" href="/pieces/' + esc(p.id) + '" data-piece="' + esc(p.id) + '">' + esc(p.short) + '</a><p class="acct-sv__price">' + P(p.price) + '</p>' +
          '<div class="acct-sizes" role="radiogroup" aria-label="Size for ' + esc(p.short) + '">' + M.SIZECHART.sizes.map(function (z) {
            var out = p.soldOut.indexOf(z) > -1;
            return '<button type="button" role="radio" class="size acct-size" data-svsize="' + z + '" aria-checked="' + (z === sel) + '"' + (out ? ' aria-disabled="true"' : '') + ' aria-label="Size ' + z + (out ? ', currently reserved' : '') + '">' + z + '</button>';
          }).join('') + '</div><p class="acct-sv__err" role="alert"></p>' +
          '<button class="btn btn--solid btn--block btn--sheen" type="button" data-sv-add' + (C.available(p) <= 0 ? ' disabled' : '') + '><span class="btn__label">' + (C.available(p) <= 0 ? 'Held in Private Bags' : 'Reserve in Your Bag') + '</span></button>' +
          toggle('alert-' + p.id, 'Notify me if stock is low or a size returns', !!alerts[p.id]) + '</div></li>';
      }).join('') + '</ul>'
        : empty('Nothing saved yet', 'Choose Save Silhouette on any piece and it waits for you here, with one-click reservation.', '<a class="btn btn--solid" href="/" data-acct-shop><span class="btn__label">Explore Edition 01</span></a>'));
  }

  /* ---------- Tab 5: Profile, Addresses & Security ---------- */
  function addrForm(a) {
    a = a || {};
    return '<form class="acct-form acct-addr-form" id="addrForm" data-id="' + esc(a.id || '') + '" novalidate><h3 class="acct-h3">' + (a.id ? 'Edit Address' : 'New Address') + '</h3>' +
      field('ad-addr', req('Street Address'), input('ad-addr', 'addr', 'autocomplete="address-line1" required', a.addr || a.line)) +
      '<button class="cx-more" type="button" data-addr2 aria-expanded="false" aria-controls="adAddr2"' + (a.addr2 ? ' hidden' : '') + '>+ Add apartment, suite, or landmark <span class="opt">(optional)</span></button>' +
      '<div class="cx-addr2" id="adAddr2"' + (a.addr2 ? '' : ' hidden') + '>' + field('ad-addr2', opt('Apartment, Suite or Landmark'), input('ad-addr2', 'addr2', 'autocomplete="address-line2"', a.addr2)) + '</div>' +
      '<div class="row-2">' + field('ad-district', req('District'), select('ad-district', 'district', DISTRICTS, a.district, 'autocomplete="address-level1" required', 'Choose')) +
        field('ad-city', req('City or Town'), input('ad-city', 'city', 'autocomplete="address-level2" required', a.city)) + '</div>' +
      '<div class="row-2">' + field('ad-post', opt('Postal Code'), input('ad-post', 'post', 'autocomplete="postal-code" inputmode="numeric" maxlength="5" placeholder="00700"', a.post)) +
        '<div class="field acct-field-static"><span class="field__label-static">Country</span><p class="field__static">Sri Lanka</p></div></div>' +
      toggle('isDefault', 'Use as my default delivery address', !!a.isDefault || !book().length) +
      '<div class="acct-form__row"><button class="btn btn--solid" type="submit"><span class="btn__label">Save Address</span></button><button class="acct-link" type="button" data-form-cancel>Cancel</button></div></form>';
  }
  function vProfile(m) {
    var pr = C.state.profile || {}, n = C.state.notify || {}, sec = C.state.security || {}, b = book();
    var phone = pr.phone || (orders()[0] && orders()[0].phone ? orders()[0].phone.replace(/^\+94\s?/, '') : '');
    var personal = '<section class="acct-sec" aria-labelledby="acctPersonal"><h2 class="acct-h2" id="acctPersonal">Personal Details</h2>' +
      '<form class="acct-form" id="profileForm" novalidate>' +
      '<div class="cx-names">' + field('pf-title', opt('Title'), select('pf-title', 'title', C.TITLES, pr.title, 'class="acct-select" autocomplete="honorific-prefix"', 'Choose')) +
        field('pf-first', req('First Name'), input('pf-first', 'first', 'autocomplete="given-name" required maxlength="60"', (C.person() || {}).first)) +
        field('pf-last', req('Last Name'), input('pf-last', 'last', 'autocomplete="family-name" required maxlength="60"', (C.person() || {}).last)) + '</div>' +
      '<div class="field"><span class="field__label-static">Email Address</span><p class="field__static acct-email">' + esc(m.email) + '<span class="acct-badge">' + (m.provider === 'google' ? 'Signed in with Google' : 'Signed in with a private link') + '</span></p></div>' +
      '<div class="row-2"><div class="field field--phone"><label for="pf-phone">' + opt('Mobile Number (+94)') + '</label><div class="phone-wrap"><span class="phone-cc" aria-hidden="true">+94</span><input id="pf-phone" name="phone" type="tel" autocomplete="tel-national" inputmode="numeric" placeholder="77 123 4567" maxlength="13" value="' + esc(phone) + '" aria-describedby="pf-phone-e"></div><span class="field__error" id="pf-phone-e" role="alert"></span></div>' +
        field('pf-dob', opt('Date of Birth'), input('pf-dob', 'dob', 'type="text" inputmode="numeric" autocomplete="bday" placeholder="DD / MM / YYYY" maxlength="14" data-dob data-max="' + todayISO() + '"', dobShow(pr.dob)), 'For private Maison gestures only.') + '</div>' +
      '<fieldset class="cx-fs"><legend class="cx-fs__legend">Preferred Size <span class="opt">(optional)</span></legend><div class="acct-sizes acct-sizes--pref" role="radiogroup" aria-label="Preferred size">' + M.SIZECHART.sizes.map(function (z) {
        return '<button type="button" role="radio" class="size" data-pref="' + z + '" aria-checked="' + (z === C.state.fitSize) + '">' + z + '</button>';
      }).join('') + '</div><p class="acct-fine">Preselected for you on every piece.</p></fieldset>' +
      '<div class="acct-form__row"><button class="btn btn--solid" type="submit"><span class="btn__label">Save Details</span></button>' + (ui$.saved === 'profile' ? '<p class="acct-saved-note" role="status">Your details are saved.</p>' : '') + '</div></form></section>';
    var addrs = '<section class="acct-sec" id="acctAddresses" aria-labelledby="acctAddrH"><h2 class="acct-h2" id="acctAddrH">Sri Lankan Delivery Addresses</h2>' +
      (b.length ? '<ul class="acct-addrs">' + b.map(function (a) {
        if (ui$.editAddr === a.id) return '<li class="acct-addr acct-addr--edit">' + addrForm(a) + '</li>';
        return '<li class="acct-addr"><p>' + esc(addrText(a)) + (a.isDefault ? ' <span class="acct-pill is-default">Default</span>' : '') + '</p><div class="acct-addr__ctl">' +
          '<button class="acct-link" type="button" data-addr-edit="' + esc(a.id) + '">Edit</button>' + (a.isDefault ? '' : '<button class="acct-link" type="button" data-addr-default="' + esc(a.id) + '">Set as Default</button>') +
          '<button class="acct-link acct-link--quiet" type="button" data-addr-remove="' + esc(a.id) + '">Remove</button></div></li>';
      }).join('') + '</ul>' : '<p class="acct-fine">No saved addresses yet. Your delivery address is saved from your first acquisition, or add one now.</p>') +
      (ui$.editAddr === 'new' ? addrForm() : '<button class="acct-add" type="button" data-addr-new>+ Add New Address</button>') + '</section>';
    var security = M.auth.securityHTML(m) + '<section class="acct-sec" aria-labelledby="acctPrefH"><h2 class="acct-h2" id="acctPrefH">Communication Preferences</h2><div class="acct-prefs">' +
      toggle('archive', 'Private archive and new edition previews', !!n.archive) +
      toggle('restock', 'Saved silhouette stock alerts', !!n.restock) +
      '<div class="acct-inline" role="radiogroup" aria-label="Preferred channel"><span class="acct-inline__k">Preferred channel</span>' + ['Email', 'WhatsApp'].map(function (k) { return '<label class="acct-radio"><input type="radio" name="channel" value="' + k + '"' + ((n.channel || 'Email') === k ? ' checked' : '') + '><span>' + k + '</span></label>'; }).join('') + '</div>' +
      '</div></section>';
    return head('Profile, Addresses &amp; Security', 'Your details, kept privately by the House.') + banner() + personal + addrs + security;
  }

  /* ---------- Tab 6: Private Concierge & Care ---------- */
  function vConcierge(m) {
    var list = (C.state.consults || []).slice().sort(function (a, b) { return (a.date + a.time).localeCompare(b.date + b.time); });
    var min = new Date(); min.setDate(min.getDate() + 1); var minS = min.toISOString().slice(0, 10);
    var resch = ui$.form && ui$.form.kind === 'resched' ? ui$.form.id : null;
    var left = '<div class="acct-col"><div class="acct-wa"><p class="acct-card__k">Your Colombo Stylist</p><p class="acct-wa__t">A named stylist in the Colombo atelier answers you personally, Monday to Saturday, 10:00 AM to 7:00 PM IST.</p>' +
      '<a class="btn btn--solid btn--block" href="' + waHref('Good day, I am ' + (m.name || 'a Private Circle client') + ' and would like to speak with my Colombo stylist.') + '" target="_blank" rel="noopener"><span class="btn__label">Message on WhatsApp</span><span class="sr-only"> (opens WhatsApp)</span></a></div>' +
      '<h2 class="acct-h2">My Scheduled Consultations</h2>' +
      (list.length ? '<ul class="acct-consults">' + list.map(function (c) {
        if (resch === c.id) return '<li class="acct-consult"><form class="acct-form" id="reschedForm" data-id="' + esc(c.id) + '" novalidate><p class="acct-consult__t">' + esc(c.topic) + '</p><div class="row-2">' +
          field('rs-date', req('New Date'), input('rs-date', 'date', 'type="date" min="' + minS + '" required', c.date)) + field('rs-time', req('Time (IST)'), select('rs-time', 'time', TIMES, c.time, 'required')) + '</div>' +
          '<div class="acct-form__row"><button class="btn btn--solid btn--sm" type="submit"><span class="btn__label">Confirm New Time</span></button><button class="acct-link" type="button" data-form-cancel>Keep Current Time</button></div></form></li>';
        return '<li class="acct-consult"><p class="acct-consult__when">' + esc(C.fmtDay(new Date(c.date + 'T12:00:00'))) + ' · ' + esc(c.time) + ' IST</p><p class="acct-consult__t">' + esc(c.topic) + '</p><p class="acct-fine">' + esc(c.format) + '</p>' +
          '<div class="acct-addr__ctl"><button class="acct-link" type="button" data-resched="' + esc(c.id) + '">Reschedule</button><button class="acct-link acct-link--quiet" type="button" data-consult-cancel="' + esc(c.id) + '">Cancel</button></div></li>';
      }).join('') + '</ul>' : '<p class="acct-fine">No consultations booked. Request one and it appears here at once.</p>') + '</div>';
    var right = '<div class="acct-col"><form class="acct-form acct-book" id="bookForm" novalidate><h2 class="acct-h2">Request a Private Styling Consultation</h2>' +
      '<div class="row-2">' + field('bk-first', req('First Name'), input('bk-first', 'first', 'autocomplete="given-name" required', (C.person() || {}).first)) + field('bk-last', req('Last Name'), input('bk-last', 'last', 'autocomplete="family-name" required', (C.person() || {}).last)) + '</div>' +
      field('bk-email', req('Email Address'), input('bk-email', 'email', 'type="email" autocomplete="email" required', m.email)) +
      field('bk-format', req('Format'), select('bk-format', 'format', FORMATS, FORMATS[0], 'required')) +
      field('bk-topic', req('Topic'), select('bk-topic', 'topic', TOPICS, null, 'required', 'Choose a topic')) +
      '<div class="row-2">' + field('bk-date', req('Preferred Date'), input('bk-date', 'date', 'type="date" min="' + minS + '" required')) + field('bk-time', req('Time (IST)'), select('bk-time', 'time', TIMES, null, 'required', 'Choose')) + '</div>' +
      field('bk-note', opt('Anything we should prepare?'), '<textarea id="bk-note" name="note" rows="3" maxlength="400"></textarea>') +
      '<button class="btn btn--solid btn--block btn--sheen" type="submit"><span class="btn__label">Request Consultation</span></button></form></div>';
    return head('Private Concierge &amp; Care', 'Styling, gifting and garment care from the Colombo atelier.') + banner() + '<div class="acct-concierge">' + left + right + '</div>';
  }

  /* ======================= render ======================= */
  var VIEWS = { overview: vOverview, orders: vOrders, vault: vVault, saved: vSaved, profile: vProfile, concierge: vConcierge };
  function workspace(m) { return VIEWS[tab](m); }
  acct.render = function (t) {
    var root = $('#acctPanel'); if (!root) return;
    tab = VIEWS[t] ? t : 'overview';
    var m = C.state.member;
    document.documentElement.classList.toggle('acct-signed-in', !!m);
    if (!m) { root.innerHTML = signInView(); return; }
    root.innerHTML = '<div class="acct-wrap">' + sidebar(m) + '<div class="acct-main" id="acctMain">' + workspace(m) + '</div></div>';
    /* on a phone the tab bar scrolls sideways: keep the current tab in view */
    var cur = root.querySelector('.acct-nav [aria-current]'), bar = cur && cur.closest('ul');
    if (bar && bar.scrollWidth > bar.clientWidth) bar.scrollLeft += cur.getBoundingClientRect().left - bar.getBoundingClientRect().left - 20;
    if (tab === 'profile') M.auth.armSecurity();
  };
  function rerender(focusSel) {
    var main = $('#acctMain'), m = C.state.member;
    if (!main || !m) { acct.render(tab); return; }
    main.innerHTML = workspace(m);
    if (tab === 'profile') M.auth.armSecurity();
    if (focusSel) { var f = $(focusSel); if (f) { try { f.focus({ preventScroll: false }); } catch (e) { f.focus(); } } }
  }
  function go(t, then) {
    if (ui.curRoute() !== 'account') { ui.route('account', null, true, t); if (then) setTimeout(then, C.reduced() ? 60 : 520); return; }
    if (t !== tab) { try { history.pushState({ route: 'account', slug: t }, '', '/account' + (t === 'overview' ? '' : '/' + t)); } catch (e) { /* file:// */ } }
    ui.$acctTab = t; acct.render(t); ui.syncAccountSlug && ui.syncAccountSlug(t);
    var top = $('#acctMain'); if (top && window.innerWidth < 900) { var y = top.getBoundingClientRect().top + window.scrollY - 140; if (window.scrollY > y) window.scrollTo(0, y); }
    else window.scrollTo(0, 0);
    var h = $('#acctTitle'); if (h) h.focus({ preventScroll: true });
    if (then) then();
  }

  /* ======================= events ======================= */
  var page = $('#accountPage');
  function findOrder(ref) { return orders().filter(function (o) { return o.ref === ref; })[0]; }
  page.addEventListener('click', function (e) {
    var t, m = C.state.member;
    if ((t = e.target.closest('[data-atab]'))) {
      e.preventDefault();
      var dest = t.getAttribute('data-atab'), oref = t.getAttribute('data-open-order'), jump = t.getAttribute('data-jump');
      if (oref) ui$.openOrder = oref;
      if (t.hasAttribute('data-verify-open')) ui$.verify = true;
      go(dest, jump ? function () { var j = document.getElementById(jump); if (j) j.scrollIntoView({ block: 'start' }); } : null);
      return;
    }
    if (e.target.closest('[data-acct-google]')) { ui.googleSignIn(function () { C.toast('Welcome to the Private Circle.'); acct.render(tab); }); return; }
    if (e.target.closest('[data-acct-signout]')) { ui.signOut(); return; }
    if (e.target.closest('[data-acct-shop]')) { e.preventDefault(); ui.route('home', 'collection'); return; }
    if ((t = e.target.closest('[data-piece]'))) { e.preventDefault(); M.shop.openProduct(t.getAttribute('data-piece')); return; }
    if (!m) return;
    if ((t = e.target.closest('[data-track]'))) { var r = t.getAttribute('data-track'); ui$.openOrder = ui$.openOrder === r ? null : r; rerender('[data-track="' + r + '"]'); return; }
    if ((t = e.target.closest('[data-trk-log]'))) { var lg = document.getElementById('log-' + t.getAttribute('data-trk-log')); if (lg) { lg.scrollIntoView({ block: 'nearest', behavior: C.reduced() ? 'auto' : 'smooth' }); lg.classList.add('is-flash'); setTimeout(function () { lg.classList.remove('is-flash'); }, 1200); } return; }
    if ((t = e.target.closest('[data-receipt]'))) { ui$.receipt = t.getAttribute('data-receipt'); ui$.form = null; rerender('#receipt-' + ui$.receipt + ' [data-print-receipt]'); return; }
    if (e.target.closest('[data-receipt-close]')) { var rr = ui$.receipt; ui$.receipt = null; rerender('[data-receipt="' + rr + '"]'); return; }
    if ((t = e.target.closest('[data-print-receipt]'))) { document.documentElement.classList.add('print-receipt'); window.print(); setTimeout(function () { document.documentElement.classList.remove('print-receipt'); }, 400); return; }
    if ((t = e.target.closest('[data-return]'))) { ui$.form = { kind: 'return', ref: t.getAttribute('data-return') }; ui$.receipt = null; rerender('#returnForm input'); return; }
    if ((t = e.target.closest('[data-cancel]'))) {
      var oc = findOrder(t.getAttribute('data-cancel')); if (!oc) return;
      oc.cancelled = new Date().toISOString(); C.save();
      ui$.banner = 'Cancellation requested for ' + esc(oc.ref) + '. A confirmation has been sent to ' + esc(oc.email) + '. Demonstration storefront: no email is sent.';
      rerender('.acct-banner'); return;
    }
    if (e.target.closest('[data-form-cancel]')) { ui$.form = null; ui$.editAddr = null; ui$.transfer = null; rerender(); return; }
    if (e.target.closest('[data-verify-open]')) { ui$.verify = !ui$.verify; rerender(ui$.verify ? '#vf-code' : null); return; }
    if ((t = e.target.closest('[data-cert]'))) { ui.openPassport(null, t.getAttribute('data-cert')); return; }
    if ((t = e.target.closest('[data-transfer]'))) { var tid = t.getAttribute('data-transfer'); ui$.transfer = ui$.transfer === tid ? null : tid; rerender(ui$.transfer ? '#xf-email' : '[data-transfer="' + tid + '"]'); return; }
    if ((t = e.target.closest('[data-xfer-cancel]'))) { var cxid = t.getAttribute('data-xfer-cancel'); C.reg.cancelTransfer(cxid); ui$.banner = 'The transfer is cancelled. The piece remains inscribed to you.'; rerender('.acct-banner'); return; }
    if ((t = e.target.closest('[data-xfer-copy]'))) {
      var fld = t.parentNode.querySelector('[data-xfer-field]'), lbl = t.querySelector('.btn__label');
      var done = function () { lbl.textContent = 'Link Copied'; setTimeout(function () { lbl.textContent = 'Copy Link'; }, 2000); };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(fld.value).then(done, function () { fld.select(); }); else { fld.select(); try { document.execCommand('copy'); done(); } catch (er) { /* ignore */ } }
      return;
    }
    if (e.target.closest('[data-cert-sample]')) { ui.openPassport(); return; }
    if ((t = e.target.closest('[data-unwish]'))) { M.shop.toggleWish(t.getAttribute('data-unwish'), true); ui$.banner = 'Removed from your Saved Silhouettes.'; rerender('.acct-banner'); return; }
    if ((t = e.target.closest('[data-svsize]'))) {
      if (t.getAttribute('aria-disabled') === 'true') return;
      var li = t.closest('[data-sv]'), id = li.getAttribute('data-sv'), picks = C.state.savedSize || (C.state.savedSize = {});
      picks[id] = t.getAttribute('data-svsize'); C.save();
      C.$$('[data-svsize]', li).forEach(function (b) { b.setAttribute('aria-checked', b === t ? 'true' : 'false'); });
      $('.acct-sv__err', li).textContent = ''; return;
    }
    if ((t = e.target.closest('[data-sv-add]'))) {
      var sv = t.closest('[data-sv]'), pid = sv.getAttribute('data-sv'), size = (C.state.savedSize || {})[pid];
      if (!size) { $('.acct-sv__err', sv).textContent = 'Please choose a size.'; var f1 = $('[data-svsize]:not([aria-disabled="true"])', sv); if (f1) f1.focus(); return; }
      if (M.shop.addPiece(pid, size)) { t.querySelector('.btn__label').textContent = 'Reserved in Your Private Bag'; setTimeout(M.shop.openBag, C.reduced() ? 0 : 500); }
      return;
    }
    if ((t = e.target.closest('[data-pref]'))) {
      C.$$('[data-pref]', page).forEach(function (b) { b.setAttribute('aria-checked', b === t && b.getAttribute('aria-checked') !== 'true' ? 'true' : 'false'); });
      return;
    }
    if (e.target.closest('[data-addr-new]')) { ui$.editAddr = 'new'; rerender('#ad-addr'); return; }
    if ((t = e.target.closest('[data-addr-edit]'))) { ui$.editAddr = t.getAttribute('data-addr-edit'); rerender('#ad-addr'); return; }
    if ((t = e.target.closest('[data-addr-default]'))) { var did = t.getAttribute('data-addr-default'); book().forEach(function (a) { a.isDefault = a.id === did; }); C.save(); ui$.banner = 'Default delivery address updated.'; rerender('.acct-banner'); return; }
    if ((t = e.target.closest('[data-addr-remove]'))) {
      var rid = t.getAttribute('data-addr-remove'), bk = book(), wasDef = bk.filter(function (a) { return a.id === rid && a.isDefault; }).length;
      C.state.addressBook = bk.filter(function (a) { return a.id !== rid; }); if (wasDef && C.state.addressBook[0]) C.state.addressBook[0].isDefault = true; C.save();
      ui$.banner = 'Address removed.'; rerender('.acct-banner'); return;
    }
    if ((t = e.target.closest('[data-addr2]'))) { t.hidden = true; var w = $('#adAddr2'); w.hidden = false; $('input', w).focus(); return; }
    if ((t = e.target.closest('[data-resched]'))) { ui$.form = { kind: 'resched', id: t.getAttribute('data-resched') }; rerender('#rs-date'); return; }
    if ((t = e.target.closest('[data-consult-cancel]'))) { var cid = t.getAttribute('data-consult-cancel'); C.state.consults = (C.state.consults || []).filter(function (c) { return c.id !== cid; }); C.save(); ui$.banner = 'Your consultation has been cancelled.'; rerender('.acct-banner'); }
  });
  /* the date of birth types itself into DD / MM / YYYY */
  page.addEventListener('input', function (e) {
    var t = e.target; if (!t.hasAttribute || !t.hasAttribute('data-dob') || (e.inputType && e.inputType.indexOf('delete') === 0)) return;
    var d = t.value.replace(/\D/g, '').slice(0, 8);
    t.value = d.length > 4 ? d.slice(0, 2) + ' / ' + d.slice(2, 4) + ' / ' + d.slice(4) : d.length > 2 ? d.slice(0, 2) + ' / ' + d.slice(2) : d;
  });
  page.addEventListener('change', function (e) {
    var t = e.target, m = C.state.member; if (!m) return;
    var n = C.state.notify || (C.state.notify = {}), sec = C.state.security || (C.state.security = {});
    if (/^alert-/.test(t.name)) { var al = C.state.stockAlerts || (C.state.stockAlerts = {}); al[t.name.slice(6)] = t.checked; C.save(); C.toast(t.checked ? 'We will tell you if stock runs low or a size returns.' : 'Stock alert switched off.'); return; }
    if (t.name === 'twofa') { sec.twofa = t.checked; C.save(); C.toast(t.checked ? 'Two-factor verification is on.' : 'Two-factor verification is off.'); rerender('[name=twofa]'); return; }
    if (t.name === 'twofaBy') { sec.by = t.value; C.save(); return; }
    if (t.name === 'archive' || t.name === 'restock') { n[t.name] = t.checked; C.save(); C.toast('Preference saved.'); return; }
    if (t.name === 'channel') { n.channel = t.value; C.save(); C.toast('We will reach you by ' + t.value + '.'); return; }
    if (t.form && t.form.id === 'returnForm' && t.name === 'kind') { var sz = $('#rf-size'); if (sz) sz.closest('.field').hidden = t.value !== 'exchange'; }
  });
  page.addEventListener('submit', function (e) {
    var f = e.target; e.preventDefault();
    var bad = null;
    function need(name, ok, msg) { var i = f.elements[name]; if (!ok(i.value)) { C.setError(i, msg); bad = bad || i; } else C.setError(i, ''); }
    if (f.id === 'acctSignIn') {
      need('email', C.validEmail, 'Enter a valid email address, such as name@example.com.'); if (bad) { bad.focus(); return; }
      ui.sendLink(f.elements.email.value.trim()); return;
    }
    var m = C.state.member; if (!m) return;
    if (f.id === 'returnForm') {
      var o = findOrder(f.getAttribute('data-ref')), kind = (f.querySelector('input[name=kind]:checked') || {}).value;
      if (kind === 'exchange') need('size', function (v) { return !!v; }, 'Choose the size you would like instead.');
      if (bad) { bad.focus(); return; }
      o.request = { kind: kind, piece: f.elements.piece.value, size: f.elements.size.value, pickup: f.elements.pickup.checked, note: f.elements.note.value.trim(), at: new Date().toISOString() }; C.save();
      ui$.form = null;
      ui$.banner = (kind === 'exchange' ? 'Size exchange requested for ' + esc(o.ref) + '. ' : 'Return requested for ' + esc(o.ref) + '. Your refund goes back to your original payment method. ') + (o.request.pickup ? 'A Maison courier will contact you to arrange the complimentary pickup.' : 'We will email the return instructions.');
      rerender('.acct-banner'); return;
    }
    if (f.id === 'xferForm') {
      need('email', C.validEmail, 'Enter the new custodian’s email address.');
      need('word', function (v) { return v.trim().toUpperCase() === 'TRANSFER'; }, 'Type the word TRANSFER to confirm.');
      if (!bad && f.elements.email.value.trim().toLowerCase() === String(m.email).toLowerCase()) { C.setError(f.elements.email, 'This piece is already inscribed to you. Enter the new custodian’s email.'); bad = f.elements.email; }
      if (bad) { bad.focus(); return; }
      var xid = f.getAttribute('data-id'); C.reg.startTransfer(xid, f.elements.email.value);
      ui$.transfer = null; ui$.banner = 'Private Transfer Invitation created. Copy the link and share it with the new custodian; it is valid for 7 days.';
      rerender('[data-xfer-copy="' + xid + '"]'); return;
    }
    if (f.id === 'verifyForm') {
      need('code', function (v) { return /^MNT-[A-Z0-9]{4,}$/i.test(v.trim()); }, 'Enter the Passport ID shown on your Digital Product Passport, such as MNT-8L76T55.');
      if (bad) { bad.focus(); return; }
      var code = f.elements.code.value.trim().toUpperCase(), hit = vaultItems().filter(function (x) { return x.it.passport === code; })[0];
      if (!hit) { C.setError(f.elements.code, 'We could not find that Passport ID. Check the serial, or message your stylist for help.'); f.elements.code.focus(); return; }
      ui.openPassport(null, code); return;
    }
    if (f.id === 'profileForm') {
      need('first', C.validName, 'Enter your first name, using letters only.');
      need('last', C.validName, 'Enter your last name. Multi-word and hyphenated names are welcome, such as De Silva.');
      need('phone', function (v) { return !v.trim() || /^7\d{8}$/.test(v.replace(/\D/g, '').replace(/^(94|0)/, '')); }, 'Enter a Sri Lankan mobile number, such as 77 123 4567.');
      need('dob', function (v) { return !v.trim() || (dobISO(v) && dobISO(v) <= todayISO() && dobISO(v) >= '1900-01-01'); }, 'Enter your date of birth as DD / MM / YYYY, such as 14 / 02 / 1992.');
      if (bad) { bad.focus(); return; }
      var pr = C.state.profile || (C.state.profile = {});
      pr.title = f.elements.title.value; pr.phone = f.elements.phone.value.trim(); pr.dob = dobISO(f.elements.dob.value);
      var pref = $('[data-pref][aria-checked="true"]', f); C.state.fitSize = pref ? pref.getAttribute('data-pref') : '';
      C.setPerson({ title: f.elements.title.value, first: f.elements.first.value, last: f.elements.last.value });
      C.save(); C.emit('member'); ui$.saved = 'profile';
      acct.render(tab); var sn = $('.acct-saved-note'); if (sn) sn.setAttribute('tabindex', '-1'), sn.focus();
      setTimeout(function () { ui$.saved = ''; }, 100); return;
    }
    if (f.id === 'addrForm') {
      need('addr', function (v) { return v.trim().length > 4; }, 'Enter the street address.');
      need('district', function (v) { return !!v; }, 'Choose the district.');
      need('city', function (v) { return v.trim().length > 1; }, 'Enter the city or town.');
      need('post', function (v) { return !v.trim() || /^\d{5}$/.test(v.trim()); }, 'A Sri Lankan postal code has five digits, such as 00700.');
      if (bad) { bad.focus(); return; }
      var bk = book(), id = f.getAttribute('data-id'), a = id ? bk.filter(function (x) { return x.id === id; })[0] : null;
      if (!a) { a = { id: 'A' + Date.now().toString(36) }; bk.push(a); }
      a.line = ''; a.addr = f.elements.addr.value.trim(); a.addr2 = f.elements.addr2.value.trim(); a.district = f.elements.district.value; a.city = f.elements.city.value.trim(); a.post = f.elements.post.value.trim();
      if (f.elements.isDefault.checked || bk.length === 1) bk.forEach(function (x) { x.isDefault = x === a; });
      C.save(); ui$.editAddr = null; ui$.banner = id ? 'Address updated.' : 'Address added.'; rerender('.acct-banner'); return;
    }
    if (f.id === 'bookForm' || f.id === 'reschedForm') {
      var minD = new Date(); minD.setDate(minD.getDate() + 1); var minS = minD.toISOString().slice(0, 10);
      if (f.id === 'bookForm') {
        need('first', C.validName, 'Enter your first name.');
        need('last', C.validName, 'Enter your last name.');
        need('email', C.validEmail, 'Enter a valid email address.');
        need('topic', function (v) { return !!v; }, 'Choose a topic.');
      }
      need('date', function (v) { return !!v && v >= minS; }, 'Choose a date from tomorrow onward.');
      need('time', function (v) { return !!v; }, 'Choose a time.');
      if (bad) { bad.focus(); return; }
      var list = C.state.consults || (C.state.consults = []);
      if (f.id === 'reschedForm') {
        var c = list.filter(function (x) { return x.id === f.getAttribute('data-id'); })[0];
        if (c) { c.date = f.elements.date.value; c.time = f.elements.time.value; }
        ui$.form = null; ui$.banner = 'Rescheduled to ' + esc(C.fmtDay(new Date(c.date + 'T12:00:00'))) + ' at ' + esc(c.time) + ' IST.';
      } else {
        var nc = { id: 'CN' + Date.now().toString(36), name: C.formalName({ first: f.elements.first.value, last: f.elements.last.value }), email: f.elements.email.value.trim(), format: f.elements.format.value, topic: f.elements.topic.value, date: f.elements.date.value, time: f.elements.time.value, note: f.elements.note.value.trim() };
        list.push(nc);
        ui$.banner = 'Requested: ' + esc(nc.topic) + ', ' + esc(C.fmtDay(new Date(nc.date + 'T12:00:00'))) + ' at ' + esc(nc.time) + ' IST. Your stylist confirms by ' + (nc.format.indexOf('WhatsApp') > -1 ? 'WhatsApp' : 'email') + '.';
      }
      C.save(); rerender('.acct-banner');
    }
  });

  /* ======================= header account dropdown ======================= */
  var btn = $('#salonBtn'), dd = document.createElement('div');
  dd.className = 'acct-dd'; dd.id = 'acctMenu'; dd.hidden = true;
  btn.parentNode.style.position = 'relative'; btn.parentNode.appendChild(dd);
  btn.setAttribute('aria-haspopup', 'true'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'acctMenu');
  function ddHTML(m) {
    var primary = [['overview', 'Account Overview'], ['orders', 'Acquisitions &amp; Orders'], ['vault', 'Wardrobe &amp; Digital Vault'], ['saved', 'Saved Silhouettes']];
    var secondary = [['profile', 'Profile, Addresses &amp; Security'], ['concierge', 'Private Concierge &amp; Care'], ['verify', 'Verify a Piece']];
    function li(x, cls) { return '<li><a class="' + cls + '" href="' + (x[0] === 'verify' ? '/verify' : '/account' + (x[0] === 'overview' ? '' : '/' + x[0])) + '" data-dd="' + x[0] + '">' + x[1] + '</a></li>'; }
    return '<div class="acct-dd__head"><p class="acct-dd__name">' + esc(C.formalName(C.person() || {}) || m.name) + '</p><p class="acct-dd__id">Private Circle · ' + esc(m.id || '') + '</p></div>' +
      '<ul class="acct-dd__list">' + primary.map(function (x) { return li(x, 'acct-dd__p'); }).join('') + '</ul>' +
      '<ul class="acct-dd__list acct-dd__list--2">' + secondary.map(function (x) { return li(x, 'acct-dd__s'); }).join('') + '</ul>' +
      '<button class="acct-dd__out" type="button" data-dd-out>Sign out</button>';
  }
  function ddClose(focusBtn) { if (dd.hidden) return; dd.hidden = true; btn.setAttribute('aria-expanded', 'false'); if (focusBtn) btn.focus(); }
  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    var m = C.state.member;
    if (!m) { ui.route('account'); return; }
    if (!dd.hidden) { ddClose(); return; }
    dd.innerHTML = ddHTML(m); dd.hidden = false; btn.setAttribute('aria-expanded', 'true');
    var f = $('a', dd); if (f) f.focus();
  });
  dd.addEventListener('click', function (e) {
    var t = e.target.closest('[data-dd]');
    if (t) { e.preventDefault(); ddClose(); if (t.getAttribute('data-dd') === 'verify') ui.route('verify'); else go(t.getAttribute('data-dd')); return; }
    if (e.target.closest('[data-dd-out]')) { ddClose(true); ui.signOut(); }
  });
  dd.addEventListener('keydown', function (e) {
    var items = C.$$('a, button', dd), i = items.indexOf(document.activeElement);
    if (e.key === 'Escape') { e.preventDefault(); ddClose(true); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    else if (e.key === 'Tab' && ((e.shiftKey && i === 0) || (!e.shiftKey && i === items.length - 1))) ddClose();
  });
  document.addEventListener('click', function (e) { if (!dd.hidden && !dd.contains(e.target)) ddClose(); });
  C.on('route', function () { ddClose(); });

  /* ======================= keep the page in step ======================= */
  C.on('member', function () {
    var m = C.state.member;
    btn.setAttribute('aria-label', m ? 'Private Circle menu, signed in as ' + m.name : 'Private Circle, sign in');
    if (ui.curRoute() === 'account') { var had = !!$('#acctMain'); acct.render(tab); if (!had || !m) { var h = $('#acctTitle'); if (h) h.focus({ preventScroll: true }); } }
  });
  C.on('wishlist', function () { if (ui.curRoute() === 'account' && (tab === 'saved' || tab === 'overview')) rerender(); });
  if (C.state.member) btn.setAttribute('aria-label', 'Private Circle menu, signed in as ' + C.state.member.name);
  /* the router rendered before this file loaded: draw the page now */
  if (ui.curRoute() === 'account') acct.render(ui.curSlug() || 'overview');
})();
