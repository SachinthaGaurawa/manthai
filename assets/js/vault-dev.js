/* ==========================================================================
   House of MANTHAI | Developer House Archive (localhost only)
   Loaded by core.js only when the site runs on localhost, 127.0.0.1 or [::1].
   It mirrors the rules of api/vault/_logic.js in this browser's storage so the
   two-gate ritual can be rehearsed without seals, keys or a database:
   rising tap counters (a replay is refused), 10-minute sessions bound to one
   piece, five tries then a 30-minute pause, the gift-buyer check, the
   member's vault, acquisitions and Ownership Transfers.
   Production never loads this file and has no simulator of any kind.
   ========================================================================== */
(function () {
  'use strict';
  var M = window.MANTHAI = window.MANTHAI || {};
  var KEY = 'manthai.devArchive';
  var SESSION_TTL = 10 * 60 * 1000, LOCK_TTL = 30 * 60 * 1000, MAX_FAILS = 5, TRANSFER_TTL = 7 * 24 * 3600 * 1000;
  var TITLES = ['Mr.', 'Mrs.', 'Ms.', 'Miss', 'Dr.', 'Prof.', 'Hon.', 'Rev.'];
  var NAME = /^[\p{L}][\p{L}\p{M} '’.-]{0,59}$/u;
  var EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;

  /* three test pieces: one to inscribe, one gifted by whoever is signed in, one already inscribed to someone else */
  var SEED = [
    { uid: '04A1B2C3D4E5F6', label: 'Aurelia Gown', serial: '48291074', key: '7392',
      p: { id: 'MNT-7KQ2M9P', pid: 'aurelia-gown', name: 'Aurelia Gown', size: 'S', edition: 'Edition 01 · Piece 05 of 15', orderRef: 'ORD-8F2K1Q', buyer: 'self', isGift: false } },
    { uid: '04B7C8D9E0F1A2', label: 'Solstice Midi (gift)', serial: '51730962', key: '2048',
      p: { id: 'MNT-3RT8W2L', pid: 'solstice-midi', name: 'Solstice Midi', size: 'M', edition: 'Edition 01 · Piece 02 of 12', orderRef: 'ORD-4M7P2C', buyer: 'self', isGift: true,
        intendedRecipientName: { title: 'Ms.', first: 'Anjali', last: 'De Silva' } } },
    { uid: '04C3D4E5F6A7B8', label: 'Vespera Blazer (inscribed)', serial: '60418237', key: '5561',
      p: { id: 'MNT-9HX4N6D', pid: 'vespera-blazer', name: 'Vespera Blazer', size: 'M', edition: 'Edition 01 · Piece 07 of 20', orderRef: 'ORD-2Z9K5T', buyer: 'other@example.com', isGift: false,
        owner: { uid: 'dev-someone-else', email: 'other@example.com', title: 'Mr.', first: 'Ravin', last: 'Perera' } } }
  ];

  function fresh() {
    var db = { pieces: {}, uids: {}, sessions: {}, attempts: {}, transfers: {}, ctr: {} };
    SEED.forEach(function (s) {
      var p = JSON.parse(JSON.stringify(s.p));
      p.issued = '2026-11-20T09:00:00.000Z'; p.nfcUid = s.uid; p.serial = s.serial; p.key = s.key;
      p.status = p.owner ? 'CLAIMED' : 'UNCLAIMED'; p.vaultKeyStatus = p.owner ? 'SEALED' : 'ACTIVE';
      if (p.owner) p.inscribedAt = '2026-11-24T10:30:00.000Z';
      p.prior = []; p.transfer = null;
      db.pieces[p.id] = p; db.uids[s.uid] = { pieceId: p.id, lastCtr: -1 }; db.ctr[s.uid] = 0;
    });
    return db;
  }
  function load() { try { var j = JSON.parse(localStorage.getItem(KEY) || 'null'); if (j && j.pieces) return j; } catch (e) {} return fresh(); }
  function save(db) { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} }
  function err(code, extra) { var e = new Error(code); e.code = code; e.extra = extra || {}; return e; }
  function tok() { var a = new Uint8Array(24); crypto.getRandomValues(a); return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }
  function digits(s) { return String(s || '').replace(/\D/g, ''); }
  function hex(n, len) { var s = n.toString(16).toUpperCase(); while (s.length < len) s = '0' + s; return s; }

  /* the signed-in member as the server would see them (a dev email is taken as verified) */
  function who(m) { if (!m) return null; return { uid: m.uid || m.id, email: String(m.email || '').toLowerCase(), emailVerified: !!m.email }; }
  function buyerOf(p, w) { return p.buyer === 'self' ? (w && w.email) || '' : p.buyer; }

  function person(p) {
    p = p || {};
    var first = String(p.first || '').trim().replace(/\s+/g, ' '), last = String(p.last || '').trim().replace(/\s+/g, ' ');
    if (!NAME.test(first)) throw err('name_first');
    if (!NAME.test(last)) throw err('name_last');
    return { title: TITLES.indexOf(p.title) >= 0 ? p.title : '', first: first, last: last };
  }
  function pub(p) { return { id: p.id, pid: p.pid, name: p.name, size: p.size, edition: p.edition, issued: p.issued, status: p.status }; }
  function ownerRec(p) {
    var o = pub(p);
    o.owner = p.owner ? { title: p.owner.title || '', first: p.owner.first, last: p.owner.last } : null;
    o.inscribedAt = p.inscribedAt || ''; o.via = p.via || 'card'; o.prior = p.prior || [];
    o.transfer = p.transfer ? { email: p.transfer.email, expires: p.transfer.expires } : null;
    return o;
  }
  function view(p, w) {
    if (w && p.owner && p.owner.uid === w.uid) { var o = ownerRec(p); o.mine = true; return o; }
    var x = pub(p); x.mine = false; x.claimed = p.status === 'CLAIMED'; return x;
  }

  var OPS = {
    status: function () { return { ready: true, archive: true, seal: true, pairing: true, dev: true }; },
    tap: function (db, b, w) {
      var u = db.uids[String(b.uid || '').toUpperCase()];
      if (!/^DE[0-9A-F]{14}$/.test(String(b.cmac || '').toUpperCase()) && String(b.cmac || '').length !== 16) throw err('seal_invalid');
      if (!u) throw err('seal_unknown');
      var c = parseInt(String(b.ctr || ''), 16);
      if (!(c > u.lastCtr)) throw err('seal_replayed');
      u.lastCtr = c;
      var p = db.pieces[u.pieceId], out = { piece: view(p, w), verified: true };
      if (p.status === 'UNCLAIMED') {
        var s = tok(), exp = Date.now() + SESSION_TTL;
        db.sessions[s] = { pieceId: p.id, exp: exp }; out.session = s; out.exp = exp;
        if (p.isGift) {
          var buyer = !!(w && w.email && w.email === buyerOf(p, w));
          out.gift = { forBuyer: buyer, recipientFirst: p.intendedRecipientName.first };
          if (!buyer) out.suggestedName = p.intendedRecipientName;
        }
      }
      return out;
    },
    session: function (db, b) {
      var s = db.sessions[b.session];
      if (!s || s.exp < Date.now()) throw err('tap_required');
      var at = db.attempts[s.pieceId] || { fails: 0, lockedUntil: 0 }, locked = at.lockedUntil > Date.now() ? at.lockedUntil : 0;
      return { piece: pub(db.pieces[s.pieceId]), exp: s.exp, lockedUntil: locked, remaining: MAX_FAILS - (locked ? 0 : at.fails || 0) };
    },
    claim: function (db, b, w) {
      if (!w) throw err('sign_in_required');
      var pe = person(b.person), serial = digits(b.serial), key = digits(b.key), now = Date.now();
      if (serial.length < 8 || serial.length > 12 || key.length !== 4) throw err('keys_format');
      var s = db.sessions[b.session];
      if (!s || s.exp < now) throw err('tap_required');
      var p = db.pieces[s.pieceId], at = db.attempts[p.id] || { fails: 0, lockedUntil: 0 };
      if (at.lockedUntil > now) throw err('locked', { lockedUntil: at.lockedUntil });
      if (p.status !== 'UNCLAIMED') throw err('already_claimed');
      if (p.isGift && w.email === buyerOf(p, w) && !b.keepForSelf) throw err('gift_buyer', { recipientFirst: p.intendedRecipientName.first });
      if (serial !== p.serial || key !== p.key) {
        var fails = (at.lockedUntil && at.lockedUntil <= now ? 0 : at.fails || 0) + 1;
        if (fails >= MAX_FAILS) { db.attempts[p.id] = { fails: 0, lockedUntil: now + LOCK_TTL }; save(db); throw err('locked', { lockedUntil: now + LOCK_TTL }); }
        db.attempts[p.id] = { fails: fails, lockedUntil: 0 }; save(db);
        throw err('mismatch', { remaining: MAX_FAILS - fails });
      }
      p.status = 'CLAIMED'; p.vaultKeyStatus = 'SEALED'; p.via = 'card'; p.inscribedAt = new Date(now).toISOString();
      p.owner = { uid: w.uid, email: w.email, title: pe.title, first: pe.first, last: pe.last };
      if (p.isGift) { p.giftStatus = 'INSCRIBED_BY_RECIPIENT'; p.buyer = buyerOf(p, w); }
      else if (p.buyer === 'self') p.buyer = w.email;
      delete db.sessions[b.session]; delete db.attempts[p.id];
      return { piece: view(p, w) };
    },
    piece: function (db, b, w) { var p = db.pieces[String(b.id || '').toUpperCase()]; if (!p) throw err('not_found'); return { piece: view(p, w) }; },
    mine: function (db, b, w) {
      if (!w) throw err('sign_in_required');
      return { pieces: Object.keys(db.pieces).map(function (k) { return db.pieces[k]; }).filter(function (p) { return p.owner && p.owner.uid === w.uid; })
        .map(function (p) { var o = ownerRec(p); o.mine = true; return o; }) };
    },
    acquisitions: function (db, b, w) {
      if (!w) throw err('sign_in_required');
      var awaiting = [], gifts = [];
      Object.keys(db.pieces).forEach(function (k) {
        var p = db.pieces[k]; if (buyerOf(p, w) !== w.email) return;
        var base = { pid: p.pid, name: p.name, size: p.size, orderRef: p.orderRef };
        if (p.isGift) { base.status = p.status === 'CLAIMED' ? 'Inscribed by Recipient' : 'Dispatched · Awaiting Recipient’s Inscription'; gifts.push(base); }
        else if (p.status === 'UNCLAIMED') awaiting.push(base);
      });
      return { awaiting: awaiting, gifts: gifts };
    },
    'transfer-start': function (db, b, w) {
      if (!w) throw err('sign_in_required');
      var email = String(b.email || '').trim().toLowerCase();
      if (!EMAIL.test(email)) throw err('email_invalid');
      if (email === w.email) throw err('email_self');
      var p = db.pieces[String(b.id || '').toUpperCase()];
      if (!p || !p.owner || p.owner.uid !== w.uid) throw err('not_owner');
      if (p.transfer) delete db.transfers[p.transfer.token];
      var t = tok(), exp = Date.now() + TRANSFER_TTL;
      db.transfers[t] = { pieceId: p.id, email: email, exp: exp };
      p.transfer = { email: email, expires: new Date(exp).toISOString(), token: t };
      return { piece: view(p, w), token: t };
    },
    'transfer-cancel': function (db, b, w) {
      if (!w) throw err('sign_in_required');
      var p = db.pieces[String(b.id || '').toUpperCase()];
      if (!p || !p.owner || p.owner.uid !== w.uid) throw err('not_owner');
      if (p.transfer) delete db.transfers[p.transfer.token];
      p.transfer = null; return { piece: view(p, w) };
    },
    'transfer-view': function (db, b) {
      var d = db.transfers[b.token]; if (!d) throw err('transfer_invalid'); if (d.exp < Date.now()) throw err('transfer_expired');
      var e = d.email, at = e.indexOf('@');
      return { piece: pub(db.pieces[d.pieceId]), to: e.slice(0, 1) + '•••' + e.slice(at), expires: new Date(d.exp).toISOString() };
    },
    'transfer-accept': function (db, b, w) {
      if (!w) throw err('sign_in_required');
      var pe = person(b.person), d = db.transfers[b.token];
      if (!d) throw err('transfer_invalid'); if (d.exp < Date.now()) throw err('transfer_expired');
      if (d.email !== w.email) throw err('transfer_email');
      var p = db.pieces[d.pieceId], prev = p.owner || {}, now = new Date().toISOString();
      p.prior = (p.prior || []).concat([{ initials: ((prev.first || '').charAt(0) + (prev.last || '').charAt(0)).toUpperCase(), from: p.inscribedAt || '', to: now }]);
      p.owner = { uid: w.uid, email: w.email, title: pe.title, first: pe.first, last: pe.last };
      p.inscribedAt = now; p.via = 'transfer'; p.transfer = null; delete db.transfers[b.token];
      return { piece: view(p, w) };
    }
  };

  M.vaultDev = {
    /* the same contract as /api/vault/<op>: resolves with the JSON, or rejects with an Error carrying .code and .extra */
    call: function (op, body, member) {
      return new Promise(function (ok, no) {
        setTimeout(function () {
          var fn = OPS[op]; if (!fn) { no(err('unknown_op')); return; }
          var db = load();
          try { var out = fn(db, body || {}, who(member)); save(db); ok(JSON.parse(JSON.stringify(out))); } catch (e) { no(e.code ? e : err('server')); }
        }, 280);
      });
    },
    /* the test cards, printed on the simulator so the ritual can be completed */
    pieces: function () { return SEED.map(function (s) { return { uid: s.uid, label: s.label, serial: s.serial, key: s.key }; }); },
    /* what a genuine tap would put in the URL: the counter rises on every tap */
    tapURL: function (uid) {
      var db = load(); db.ctr[uid] = (db.ctr[uid] || 0) + 1; save(db);
      return Promise.resolve({ uid: uid, ctr: hex(db.ctr[uid], 6), cmac: 'DE' + hex(db.ctr[uid], 14) });
    },
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} }
  };
})();
