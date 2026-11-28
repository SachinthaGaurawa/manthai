/* =========================================================================
   House of MANTHAI · Private Circle sign-in
   Three ways in, and only three: a passwordless Private Access Key by email
   (link, plus a 6-digit code where code delivery is active), Continue with
   Google, and a Face ID / Touch ID passkey (WebAuthn) linked from the
   Private Circle. There is no Apple, Facebook, Instagram or X sign-in.

   Modes for the Private Access Key:
   - live:    Firebase email-link sign-in (M.CONFIG.firebase). A link is sent;
              no code, because Firebase does not send one-time codes.
   - code:    M.CONFIG.auth.codeEndpoint set. POST {email} sends link + code,
              POST {email, code} to the same endpoint verifies it.
   - preview: no mail service, or ?authpreview=1. Nothing is sent; the code
              is shown on screen so the flow can be reviewed end to end.
   Passkeys: when the passkey service (/api/passkey, FIREBASE_SERVICE_ACCOUNT
   set on Vercel) answers, every passkey is registered and verified on the
   server and a verified passkey signs the member into the same Firebase
   account on any device: iCloud Keychain / Google Password Manager sync,
   or a phone scanning the code. Without the service the earlier on-device
   flow (C.state.passkeys) stays in place, so nothing breaks.
   ========================================================================= */
(function () {
  'use strict';
  var M = window.MANTHAI, C = M.core, ui = M.ui, esc = C.esc, $ = C.$;
  var CFG = M.CONFIG.auth || {};
  var SEAL = '<svg viewBox="0 0 1000 860" aria-hidden="true" focusable="false"><use href="#spiral-seal"/></svg>';
  var G = '<svg class="pc-btn__g" viewBox="0 0 48 48" width="18" height="18" aria-hidden="true" focusable="false"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
  var PK = '<svg class="pc-btn__pk" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M4 8V6a2 2 0 012-2h2M16 4h2a2 2 0 012 2v2M20 16v2a2 2 0 01-2 2h-2M8 20H6a2 2 0 01-2-2v-2" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M9.5 9.5v1M14.5 9.5v1M12 9.5v3.2l-1 .6M9.6 15.2c1.4 1 3.4 1 4.8 0" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>';

  /* ---------- state ---------- */
  var st = { view: 'email', email: '', mode: 'preview', code: '', msg: '', pkMsg: '', resendAt: 0, busy: false };
  var tick = 0;
  function preview() { return /[?&]authpreview=1\b/.test(location.search); }
  function modeNow() { return preview() ? 'preview' : CFG.codeEndpoint ? 'code' : ui.auth && ui.auth.live() ? 'live' : 'preview'; }
  function secsLeft() { return Math.max(0, Math.ceil((st.resendAt - Date.now()) / 1000)); }

  /* ---------- markup ---------- */
  function emailView(c) {
    return '<span class="pc-auth__seal">' + SEAL + '</span>' +
      '<h' + c.level + ' class="pc-auth__title" id="' + c.titleId + '" tabindex="-1">Enter the Private Circle</h' + c.level + '>' +
      '<p class="pc-auth__sub">Passwordless access to your Wardrobe, Digital Vault, and acquisitions.</p>' +
      (st.msg ? '<p class="pc-auth__msg" role="alert">' + esc(st.msg) + '</p>' : '') +
      '<form class="pc-auth__form" data-auth-email novalidate>' +
        '<div class="field"><label for="' + c.p + '-email">Email address <span class="req" aria-hidden="true">*</span></label>' +
        '<input id="' + c.p + '-email" name="email" type="email" autocomplete="email" inputmode="email" placeholder="name@example.com" required value="' + esc(st.email) + '" aria-describedby="' + c.p + '-email-e">' +
        '<span class="field__error" id="' + c.p + '-email-e" role="alert"></span></div>' +
        '<button class="pc-btn pc-btn--key" type="submit"' + (st.busy ? ' disabled' : '') + '>' + (st.busy ? 'Sending your key…' : 'Send Private Access Key') + '</button>' +
      '</form>' +
      '<p class="pc-auth__or"><span>Or continue instantly</span></p>' +
      '<div class="pc-auth__stack">' +
        '<button class="pc-btn pc-btn--google" type="button" data-auth-google>' + G + '<span>Continue with Google</span></button>' +
        '<button class="pc-btn pc-btn--passkey" type="button" data-auth-passkey>' + PK + '<span>Unlock with Face ID / Touch ID Passkey</span></button>' +
      '</div>' +
      '<p class="pc-auth__pk" role="status" aria-live="polite">' + esc(st.pkMsg) + '</p>' +
      '<p class="pc-auth__guest">Prefer not to create an account? Guest checkout is always available on every acquisition.</p>';
  }
  function otpBoxes(c) {
    var h = '<fieldset class="pc-otp"><legend class="sr-only">Your 6-digit code</legend><div class="pc-otp__row">';
    for (var i = 0; i < 6; i++) h += '<input class="pc-otp__d" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" ' + (i === 0 ? 'autocomplete="one-time-code"' : 'autocomplete="off"') + ' aria-label="Digit ' + (i + 1) + ' of 6" data-otp="' + i + '"' + (i === 0 ? ' id="' + c.p + '-otp"' : '') + '>';
    return h + '</div><p class="field__error pc-otp__e" role="alert"></p></fieldset>';
  }
  function verifyView(c) {
    var s = secsLeft(), withCode = st.mode !== 'live';
    return '<span class="pc-auth__seal">' + SEAL + '</span>' +
      '<h' + c.level + ' class="pc-auth__title" id="' + c.titleId + '" tabindex="-1">Your Private Access Key</h' + c.level + '>' +
      '<p class="pc-auth__sub pc-auth__sub--wide">' + (withCode
        ? 'We have sent a Private Access Link and a 6-digit code to <b>' + esc(st.email) + '</b>. Click the link on any device, or enter your 6-digit code below.'
        : 'We have sent a Private Access Link to <b>' + esc(st.email) + '</b>. Click the link on any device to enter the Private Circle.') + '</p>' +
      (st.msg ? '<p class="pc-auth__msg" role="alert">' + esc(st.msg) + '</p>' : '') +
      (withCode ? '<form class="pc-auth__form" data-auth-code novalidate>' + otpBoxes(c) +
        '<button class="pc-btn pc-btn--key" type="submit"' + (st.busy ? ' disabled' : '') + '>Enter the Private Circle</button></form>' : '') +
      (st.mode === 'preview' ? '<p class="pc-auth__demo"><b>Preview.</b> No email is sent in preview. Your code is <span class="pc-auth__democode">' + esc(st.code.replace(/(\d{3})/, '$1 ')) + '</span>.</p>' : '') +
      '<p class="pc-auth__links"><button class="pc-link" type="button" data-auth-resend' + (s ? ' disabled' : '') + '>' + (s ? 'Resend key (' + s + 's)' : 'Resend key') + '</button>' +
      '<span aria-hidden="true">&middot;</span><button class="pc-link" type="button" data-auth-reset>Use a different email</button></p>' +
      (withCode ? '' : '<p class="pc-auth__guest">Nothing yet? Look in your spam or promotions folder. The link works once and expires soon.</p>');
  }
  function inner(c) { return st.view === 'verify' ? verifyView(c) : emailView(c); }
  function ctxOf(el) { return { p: el.getAttribute('data-p'), titleId: el.getAttribute('data-title'), level: el.getAttribute('data-level') }; }
  function paint(focusSel) {
    C.$$('.pc-auth').forEach(function (el) { el.innerHTML = inner(ctxOf(el)); });
    if (focusSel) { var f = C.$$(focusSel).filter(function (x) { return x.offsetParent; })[0]; if (f) f.focus(); }
  }

  /* ---------- the code: six boxes that behave like one field ---------- */
  function boxes(el) { return C.$$('.pc-otp__d', el.closest('.pc-otp')); }
  function fill(list, from, digits) {
    for (var i = 0; i < digits.length && from + i < 6; i++) list[from + i].value = digits.charAt(i);
    var next = Math.min(5, from + digits.length); list[next].focus();
    if (list.every(function (b) { return b.value; })) submitCode(list[0].closest('form'));
  }
  document.addEventListener('input', function (e) {
    var b = e.target; if (!b.classList || !b.classList.contains('pc-otp__d')) return;
    var digits = b.value.replace(/\D/g, ''), list = boxes(b), i = +b.getAttribute('data-otp');
    var err = b.closest('form').querySelector('.pc-otp__e'); if (err) err.textContent = '';
    if (!digits) { b.value = ''; return; }
    b.value = digits.charAt(0);
    if (digits.length > 1) fill(list, i, digits); else if (i < 5) list[i + 1].focus(); else fill(list, i, '');
  });
  document.addEventListener('keydown', function (e) {
    var b = e.target; if (!b.classList || !b.classList.contains('pc-otp__d')) return;
    var list = boxes(b), i = +b.getAttribute('data-otp');
    if (e.key === 'Backspace' && !b.value && i > 0) { e.preventDefault(); list[i - 1].value = ''; list[i - 1].focus(); }
    else if (e.key === 'ArrowLeft' && i > 0) { e.preventDefault(); list[i - 1].focus(); }
    else if (e.key === 'ArrowRight' && i < 5) { e.preventDefault(); list[i + 1].focus(); }
  });
  document.addEventListener('paste', function (e) {
    var b = e.target; if (!b.classList || !b.classList.contains('pc-otp__d')) return;
    var t = ((e.clipboardData || window.clipboardData).getData('text') || '').replace(/\D/g, '').slice(0, 6); if (!t) return;
    e.preventDefault(); fill(boxes(b), t.length === 6 ? 0 : +b.getAttribute('data-otp'), t);
  });

  /* ---------- sending and checking the key ---------- */
  function startTimer() {
    st.resendAt = Date.now() + 45000; clearInterval(tick);
    tick = setInterval(function () {
      var s = secsLeft();
      C.$$('[data-auth-resend]').forEach(function (r) { r.disabled = !!s; r.textContent = s ? 'Resend key (' + s + 's)' : 'Resend key'; });
      if (!s) clearInterval(tick);
    }, 1000);
  }
  function post(body) {
    return fetch(CFG.codeEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { if (!r.ok) throw new Error('auth ' + r.status); return r.json().catch(function () { return {}; }); });
  }
  function send(email) {
    st.email = email; st.msg = ''; st.mode = modeNow();
    var done = function () { st.busy = false; st.view = 'verify'; startTimer(); paint('.pc-otp__d[data-otp="0"], .pc-auth [data-auth-resend]'); };
    var fail = function (e) { st.busy = false; st.msg = st.mode === 'live' ? ui.auth.errText(e) : 'We could not send your key just now. Please try again, or continue with Google.'; paint(); };
    if (st.mode === 'preview') { st.code = String(Math.floor(100000 + Math.random() * 900000)); done(); return; }
    st.busy = true; paint();
    (st.mode === 'code' ? post({ email: email }) : ui.auth.sendLink(email)).then(done, fail);
  }
  function submitCode(form) {
    if (!form || st.busy) return;
    var list = C.$$('.pc-otp__d', form), code = list.map(function (b) { return b.value; }).join(''), err = form.querySelector('.pc-otp__e');
    if (!/^\d{6}$/.test(code)) { err.textContent = 'Enter all six digits of your code.'; (list.filter(function (b) { return !b.value; })[0] || list[0]).focus(); return; }
    var ok = function () { var em = st.email; reset(); ui.auth.complete({ email: em }, 'email'); };
    var bad = function () { st.busy = false; err.textContent = 'That code does not match. Check the latest email from the House, or resend your key.'; list.forEach(function (b) { b.value = ''; }); list[0].focus(); };
    if (st.mode === 'preview') { if (code === st.code) ok(); else bad(); return; }
    st.busy = true; post({ email: st.email, code: code }).then(function (r) { st.busy = false; if (r && r.ok !== false) ok(); else bad(); }, bad);
  }
  function reset() { st.view = 'email'; st.code = ''; st.msg = ''; st.pkMsg = ''; st.busy = false; clearInterval(tick); st.resendAt = 0; }

  /* ---------- passkeys (WebAuthn) ---------- */
  function b64u(buf) { var s = '', b = new Uint8Array(buf); for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function unb64u(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; var r = atob(s), a = new Uint8Array(r.length); for (var i = 0; i < r.length; i++) a[i] = r.charCodeAt(i); return a.buffer; }
  function rand(n) { var a = new Uint8Array(n); crypto.getRandomValues(a); return a; }
  function supported() { return !!(window.PublicKeyCredential && navigator.credentials && navigator.credentials.create && window.isSecureContext); }
  function platformReady() {
    if (!supported()) return Promise.resolve(false);
    try { return PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().catch(function () { return false; }); } catch (e) { return Promise.resolve(false); }
  }
  function keys() { return C.state.passkeys || (C.state.passkeys = {}); }
  function keyFor(email) { return keys()[String(email || '').toLowerCase()] || null; }
  function deviceLabel() {
    var u = navigator.userAgent, os = /iPhone/.test(u) ? 'iPhone' : /iPad/.test(u) ? 'iPad' : /Android/.test(u) ? 'Android' : /Mac OS X/.test(u) ? 'Mac' : /Windows/.test(u) ? 'Windows PC' : /CrOS/.test(u) ? 'Chromebook' : 'This device';
    var br = /Edg\//.test(u) ? 'Edge' : /OPR\//.test(u) ? 'Opera' : /Firefox\//.test(u) ? 'Firefox' : /CriOS|Chrome\//.test(u) ? 'Chrome' : /Safari\//.test(u) ? 'Safari' : 'Browser';
    var bio = os === 'iPhone' || os === 'iPad' ? 'Face ID' : os === 'Mac' ? 'Touch ID' : os === 'Windows PC' ? 'Windows Hello' : 'Device biometrics';
    return os + ' · ' + br + ' · ' + bio;
  }
  /* ---------- the passkey service ---------- */
  var serverP = null;
  function server() {
    return serverP || (serverP = fetch('/api/passkey/status', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (j) { return !!(j && j.ready && j.rpId === location.hostname); })
      .catch(function () { return false; }));
  }
  function api(op, data, token) {
    var h = { 'Content-Type': 'application/json' }; if (token) h.Authorization = 'Bearer ' + token;
    return fetch('/api/passkey/' + op, { method: 'POST', headers: h, body: JSON.stringify(data || {}), cache: 'no-store' }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) { var e = new Error(j.error || 'server_error'); e.code = j.error || 'server_error'; throw e; }
        return j;
      });
    });
  }
  function creationOptions(o) {
    var p = Object.assign({}, o);
    p.challenge = unb64u(o.challenge);
    p.user = Object.assign({}, o.user, { id: unb64u(o.user.id) });
    p.excludeCredentials = (o.excludeCredentials || []).map(function (c) { return Object.assign({}, c, { id: unb64u(c.id) }); });
    return p;
  }
  function requestOptions(o) {
    var p = Object.assign({}, o);
    p.challenge = unb64u(o.challenge);
    p.allowCredentials = (o.allowCredentials || []).map(function (c) { return Object.assign({}, c, { id: unb64u(c.id) }); });
    return p;
  }
  function ext(c) { try { return c.getClientExtensionResults ? c.getClientExtensionResults() : {}; } catch (e) { return {}; } }
  function regJSON(c) {
    var r = c.response, t = [];
    try { t = r.getTransports ? r.getTransports() : []; } catch (e) { t = []; }
    return { id: c.id, rawId: b64u(c.rawId), type: c.type, authenticatorAttachment: c.authenticatorAttachment || undefined, clientExtensionResults: ext(c),
      response: { clientDataJSON: b64u(r.clientDataJSON), attestationObject: b64u(r.attestationObject), transports: t } };
  }
  function authJSON(c) {
    var r = c.response;
    return { id: c.id, rawId: b64u(c.rawId), type: c.type, authenticatorAttachment: c.authenticatorAttachment || undefined, clientExtensionResults: ext(c),
      response: { clientDataJSON: b64u(r.clientDataJSON), authenticatorData: b64u(r.authenticatorData), signature: b64u(r.signature), userHandle: r.userHandle ? b64u(r.userHandle) : undefined } };
  }
  /* tell the browser's password manager a passkey no longer opens an account, where it can listen */
  function forget(id) { try { if (window.PublicKeyCredential && PublicKeyCredential.signalUnknownCredential) PublicKeyCredential.signalUnknownCredential({ rpId: location.hostname, credentialId: id }).catch(function () {}); } catch (e) { /* older browsers */ } }
  /* passkeys made before devices were linked carry the email as their user handle; the server never knew them */
  function legacyHandle(email) { return b64u(new TextEncoder().encode(String(email || '').toLowerCase().slice(0, 64))); }
  /* keep the password manager in step with the server: only the passkeys the server holds stay offered for this member,
     earlier on-device passkeys for the same email are retired, and the name shown in the picker is current */
  function tidy(m, list) {
    var P = window.PublicKeyCredential; if (!P || !m || !m.uid) return;
    var rpId = location.hostname, uid = b64u(new TextEncoder().encode(m.uid));
    try {
      if (P.signalAllAcceptedCredentials) {
        P.signalAllAcceptedCredentials({ rpId: rpId, userId: uid, allAcceptedCredentialIds: list.map(function (k) { return k.id; }) }).catch(function () {});
        if (m.email) P.signalAllAcceptedCredentials({ rpId: rpId, userId: legacyHandle(m.email), allAcceptedCredentialIds: [] }).catch(function () {});
      }
      if (P.signalCurrentUserDetails && list.length) P.signalCurrentUserDetails({ rpId: rpId, userId: uid, name: m.email || m.uid, displayName: m.name || m.email || 'Private Circle member' }).catch(function () {});
    } catch (e) { /* older browsers */ }
  }
  function pkError(e, during) {
    var n = e && (typeof e.code === 'string' ? e.code : e.name);
    if (n === 'NotAllowedError' || n === 'AbortError') return during === 'in' ? 'Face ID / Touch ID was cancelled. Try again, or choose another way in.' : 'Setup was cancelled. You can enable it at any time.';
    if (n === 'InvalidStateError') return 'This device already holds a passkey for your Private Circle.';
    if (n === 'legacy_passkey') return 'That was an earlier passkey, saved before your devices were linked, and it has now been retired. Choose Face ID / Touch ID once more and pick your newer passkey, or continue with Google or your Private Access Key.';
    if (n === 'already_here') return 'This device already holds your passkey, shared through iCloud Keychain or Google Password Manager, so there is nothing more to add here.';
    if (n === 'unknown_passkey') return 'That passkey is not linked to a Private Circle account. Continue with Google or your Private Access Key, then enable Face ID / Touch ID in Profile, Addresses & Security.';
    if (n === 'sign_in_required') return 'Please sign in again, then enable Face ID / Touch ID.';
    if (n === 'too_many_passkeys') return 'Your Private Circle already holds ten passkeys. Remove one you no longer use, then add this device.';
    if (n === 'challenge_expired') return 'That took a little too long. Please try once more.';
    return during === 'in' ? 'Your passkey could not be used just now. Continue with Google or your Private Access Key.' : 'Your passkey could not be created on this device just now.';
  }

  /* ---------- a sign-in challenge waiting before the tap ----------
     The service answers in two round trips (status, then a fresh challenge), and the first call of the day also
     wakes the server. Doing that on the tap kept the Face ID / Touch ID sheet waiting about two and a half
     seconds. So the challenge is fetched as soon as a sign-in panel is on screen (or the pointer nears it), and
     the tap opens the system sheet at once, still inside the tap, as Safari prefers. A challenge lives five
     minutes on the server; one older than four is fetched again. */
  var pre = null, PRE_TTL = 4 * 60 * 1000;
  function warm() {
    if (!supported() || C.state.member || st.busy) return;
    if (pre && (pre.j ? Date.now() - pre.at < PRE_TTL : true)) return;
    var mine = pre = { at: Date.now(), j: null };
    server().then(function (ok) {
      if (!ok || pre !== mine) { if (pre === mine) pre = null; return; }
      return api('login-options').then(function (j) { if (pre === mine) { mine.j = j; mine.at = Date.now(); } });
    }).catch(function () { if (pre === mine) pre = null; });
  }
  function takeReady() {
    var x = pre; pre = null;
    return x && x.j && Date.now() - x.at < PRE_TTL ? x.j : null;
  }
  function panelOnScreen() {
    return C.$$('[data-auth-passkey]').some(function (b) { return b.offsetParent && b.getClientRects().length; });
  }
  var warmT = 0;
  function warmSoon() { clearTimeout(warmT); warmT = setTimeout(function () { if (panelOnScreen()) warm(); }, 120); }
  try { new MutationObserver(warmSoon).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden', 'open', 'aria-hidden'] }); } catch (e) { /* older browsers */ }
  ['pointerover', 'focusin', 'touchstart'].forEach(function (ev) {
    document.addEventListener(ev, function (e) { if (e.target.closest && e.target.closest('.pc-auth')) warm(); }, { passive: true });
  });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) warmSoon(); });
  setTimeout(warmSoon, 400);

  function pkSignIn() {
    var say = function (t) { st.pkMsg = t; C.$$('.pc-auth__pk').forEach(function (p) { p.textContent = t; }); };
    if (!supported()) { say('This browser does not support passkeys. Continue with Google or your Private Access Key.'); return; }
    if (st.busy) return;
    say('');
    var ready = takeReady();
    st.busy = true;
    /* the challenge is already here: open the system sheet in this same tap */
    if (ready) { pkUse(ready, say); return; }
    server().then(function (ok) {
      if (!ok) { st.busy = false; return pkSignInLocal(say); }
      return api('login-options').then(function (j) { pkUse(j, say); }, function (e) { st.busy = false; say(pkError(e, 'in')); warmSoon(); });
    });
  }
  /* discoverable request: the browser offers passkeys synced through iCloud Keychain or Google Password Manager,
     and "use a phone or tablet" (scan a code) for a passkey that lives on the member's phone */
  function pkUse(j, say) {
    var cid = '', legacy = false;
    navigator.credentials.get({ publicKey: requestOptions(j.options) }).then(function (c) {
      cid = c.id; say('Verifying your passkey…');
      try { legacy = !!c.response.userHandle && /@/.test(new TextDecoder().decode(c.response.userHandle)); } catch (e) { legacy = false; }
      return api('login-verify', { challengeId: j.challengeId, response: authJSON(c) });
    }).then(function (j2) { return ui.auth.tokenSignIn(j2.token); })
      .then(function () {
        st.busy = false; reset(); say('');
        if (M.account && ui.curRoute && ui.curRoute() === 'account') M.account.render(ui.curSlug() || 'overview');
      })
      .catch(function (e) {
        st.busy = false;
        if (e && e.code === 'unknown_passkey' && cid) { forget(cid); if (legacy) e = { code: 'legacy_passkey' }; }
        say(pkError(e, 'in'));
        /* a fresh challenge waits again, so "try once more" is just as quick */
        warmSoon();
      });
  }
  /* the earlier on-device flow, used only while the passkey service is not configured */
  function pkSignInLocal(say) {
    var list = Object.keys(keys()).map(function (k) { return keys()[k]; });
    navigator.credentials.get({ publicKey: { challenge: rand(32), rpId: location.hostname, userVerification: 'required', timeout: 120000 } })
      .then(function (cred) {
        var id = cred && b64u(cred.rawId), k = list.filter(function (x) { return x.id === id; })[0];
        var handle = '';
        try { handle = cred.response.userHandle ? new TextDecoder().decode(cred.response.userHandle) : ''; } catch (e) { handle = ''; }
        var email = k ? k.email : /@/.test(handle) ? handle : '';
        if (!email) { say(pkError({ code: 'unknown_passkey' }, 'in')); return; }
        if (!k) { k = keys()[email.toLowerCase()] = { id: id, email: email, name: '', provider: 'email', label: deviceLabel() + ' (synced)', added: new Date().toISOString() }; }
        k.lastUsed = new Date().toISOString(); C.save(); reset();
        ui.auth.complete({ email: k.email, name: k.name }, k.provider || 'email');
      })
      .catch(function (e) { say(pkError(e, 'in')); });
  }

  function pkEnable(btn) {
    var m = C.state.member; if (!m) return;
    var note = $('#pkNote');
    btn.disabled = true; if (note) note.textContent = '';
    server().then(function (ok) {
      if (!ok || !m.fb) return pkEnableLocal(btn, m, note);
      var tok = '';
      return ui.auth.idToken().then(function (t) { tok = t; return api('register-options', {}, tok); })
        .then(function (j) {
          return navigator.credentials.create({ publicKey: creationOptions(j.options) }).then(function (c) {
            if (note) note.textContent = 'Linking this device…';
            return api('register-verify', { challengeId: j.challengeId, response: regJSON(c), label: deviceLabel() }, tok);
          });
        })
        .then(function () {
          delete keys()[String(m.email).toLowerCase()]; C.save();
          C.toast('Face ID / Touch ID is now linked to your Private Circle.');
          if (M.account) M.account.render('profile');
        })
        .catch(function (e) {
          btn.disabled = false;
          /* a device that already holds a synced passkey for this member refuses a second one (excludeCredentials) */
          var n = e && (typeof e.code === 'string' ? e.code : e.name);
          if (st.synced && (n === 'InvalidStateError' || n === 'NotAllowedError')) e = { code: 'already_here' };
          if (note) note.textContent = pkError(e, 'enable');
        });
    });
  }
  function pkEnableLocal(btn, m, note) {
    navigator.credentials.create({ publicKey: {
      challenge: rand(32), rp: { name: 'House of MANTHAI', id: location.hostname },
      user: { id: new TextEncoder().encode(String(m.email).toLowerCase().slice(0, 64)), name: m.email, displayName: m.name || m.email },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: 'platform', residentKey: 'required', requireResidentKey: true, userVerification: 'required' },
      timeout: 60000, attestation: 'none' } })
      .then(function (cred) {
        keys()[String(m.email).toLowerCase()] = { id: b64u(cred.rawId), email: m.email, name: m.name, provider: m.provider, label: deviceLabel(), added: new Date().toISOString() };
        C.save(); C.toast('Face ID / Touch ID is now linked to your Private Circle on this device.');
        if (M.account) M.account.render('profile');
      })
      .catch(function (e) { btn.disabled = false; if (note) note.textContent = pkError(e, 'enable'); });
  }
  function pkRemove(id, btn) {
    var note = $('#pkNote'); btn.disabled = true;
    ui.auth.idToken().then(function (t) { return api('remove', { id: id }, t); })
      .then(function () { forget(id); C.toast('The passkey is removed from your Private Circle. It can no longer open your account.'); if (M.account) M.account.render('profile'); })
      .catch(function (e) { btn.disabled = false; if (note) note.textContent = e && e.code === 'sign_in_required' ? pkError(e) : 'The passkey could not be removed just now. Please try again.'; });
  }
  function fmtDay(iso) { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); }

  /* ---------- the security section inside Profile, Addresses & Security ---------- */
  function securityHTML(m) {
    var k = keyFor(m.email), google = m.provider === 'google';
    var row = function (name, sub, on, action) { return '<li class="pc-method"><div><p class="pc-method__n">' + name + '</p><p class="pc-method__s">' + sub + '</p></div>' + (on ? '<span class="acct-pill is-on">Connected</span>' : action) + '</li>'; };
    return '<section class="acct-sec" id="acctSecurity" aria-labelledby="acctSecH"><h2 class="acct-h2" id="acctSecH">Sign-In &amp; Biometric Security</h2>' +
      '<p class="acct-fine">Connected sign-in methods. The Private Circle never uses a password.</p>' +
      '<ul class="pc-methods">' +
        row('Google', google ? esc(m.email) : 'One tap with your Google account', google, '<button class="acct-link" type="button" data-auth-google>Link Google</button>') +
        row('Email Private Key', esc(m.email) + (google ? '' : ' · link and code by email'), !google, '<span class="acct-pill">Available</span>') +
      '</ul>' +
      '<div class="pc-passkey"><div class="pc-passkey__head">' + PK + '<p class="pc-passkey__t">Biometric Passkey (Face ID / Touch ID)</p></div>' +
        '<p class="pc-passkey__d">Link Face ID, Touch ID, or device biometrics directly to your Google or Email Private Circle account. Unlock your Wardrobe and Digital Vault with a single glance or touch. No passwords required.</p>' +
        '<p class="acct-fine">Passkeys saved to iCloud Keychain or Google Password Manager follow you to your other devices. On any other computer, choose Face ID / Touch ID and scan the code with your phone.</p>' +
        '<div class="pc-passkey__body" id="pkBody">' + (k ? '<dl class="pc-passkey__meta"><div><dt>Device</dt><dd>' + esc(k.label) + '</dd></div><div><dt>Added</dt><dd>' + esc(new Date(k.added).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })) + '</dd></div></dl>' +
          '<div class="pc-passkey__row"><span class="acct-pill is-on">Enabled on this device</span><button class="acct-link acct-link--quiet" type="button" data-pk-remove>Remove Passkey</button></div>'
          : '<div class="pc-passkey__row"><button class="btn btn--ghost btn--sm" type="button" data-pk-enable disabled>Enable Face ID / Touch ID Passkey</button></div>') + '</div>' +
        '<p class="acct-fine" id="pkNote" role="status" aria-live="polite"></p>' +
      '</div>' +
      '<p class="acct-fine">Active session: this browser, signed in ' + esc(new Date(m.since || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })) + '. Sign out below to end it.</p></section>';
  }
  /* once the section is on the page: with the passkey service, list the member's passkeys from the server;
     otherwise ask the device whether it can hold an on-device passkey */
  function armSecurity() {
    var body = $('#pkBody'), m = C.state.member; if (!body || !m) return;
    server().then(function (ok) {
      if (!ok || !m.fb) return armLocal();
      body.setAttribute('aria-busy', 'true');
      body.innerHTML = '<p class="acct-fine">Checking the devices linked to your Private Circle…</p>';
      ui.auth.idToken().then(function (t) { return api('list', {}, t); }).then(function (j) { paintKeys(body, j.passkeys || []); })
        .catch(function () { body.removeAttribute('aria-busy'); body.innerHTML = '<p class="acct-fine">Your linked devices could not be loaded just now. Please refresh to try again.</p>'; });
    });
  }
  function paintKeys(body, list) {
    var can = supported(), m = C.state.member;
    st.synced = list.some(function (k) { return k.synced; });
    tidy(m, list);
    body.removeAttribute('aria-busy');
    body.innerHTML = (list.length ? '<ul class="pc-pks" aria-label="Passkeys linked to your Private Circle">' + list.map(function (k) {
      var sub = ['Added ' + fmtDay(k.added)];
      if (k.lastUsed) sub.push('Last used ' + fmtDay(k.lastUsed));
      if (k.synced) sub.push('Synced to your other devices');
      return '<li class="pc-pk"><div class="pc-pk__txt"><p class="pc-pk__n">' + esc(k.label) + '</p><p class="pc-pk__s">' + esc(sub.join(' · ')) + '</p></div>' +
        '<button class="acct-link acct-link--quiet" type="button" data-pk-del="' + esc(k.id) + '" aria-label="Remove the passkey ' + esc(k.label) + '">Remove</button></li>';
    }).join('') + '</ul>' : '') +
      '<div class="pc-passkey__row">' + (list.length ? '<span class="acct-pill is-on">Enabled · ' + list.length + (list.length === 1 ? ' passkey' : ' passkeys') + '</span>' : '') +
        '<button class="btn btn--ghost btn--sm" type="button" data-pk-enable' + (can ? '' : ' disabled') + '>' + (list.length ? 'Add This Device' : 'Enable Face ID / Touch ID Passkey') + '</button></div>' +
      (st.synced ? '<p class="acct-fine">Devices on the same Apple or Google account already share this passkey. Add This Device is only needed on a device outside that account, such as a Windows PC or an Android phone.</p>' : '');
    if (!can) { var n = $('#pkNote'); if (n) n.textContent = 'This browser does not support passkeys. Try Safari, Chrome or Edge on a recent device.'; }
  }
  function armLocal() {
    var b = $('[data-pk-enable]'); if (!b) return;
    platformReady().then(function (ok) {
      b.disabled = !ok;
      var n = $('#pkNote'); if (n && !ok) n.textContent = supported() ? 'This device has no Face ID, Touch ID or fingerprint sensor available to the browser. You can enable a passkey from your phone or laptop.' : 'This browser does not support passkeys. Try Safari, Chrome or Edge on a recent device.';
    });
  }

  /* ---------- events ---------- */
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (f.hasAttribute('data-auth-email')) {
      e.preventDefault();
      var i = f.elements.email;
      if (!C.validEmail(i.value)) { C.setError(i, 'Enter a valid email address, such as name@example.com.'); i.focus(); return; }
      C.setError(i, ''); send(i.value.trim().toLowerCase());
    } else if (f.hasAttribute('data-auth-code')) { e.preventDefault(); submitCode(f); }
  });
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-auth-google], [data-auth-passkey], [data-auth-resend], [data-auth-reset], [data-pk-enable], [data-pk-remove], [data-pk-del]');
    if (!t) return;
    if (t.hasAttribute('data-auth-google')) { ui.googleSignIn(function () { if (M.account && ui.curRoute() === 'account') M.account.render(ui.curSlug() || 'overview'); }); }
    else if (t.hasAttribute('data-auth-passkey')) pkSignIn();
    else if (t.hasAttribute('data-auth-resend')) { if (!secsLeft()) send(st.email); }
    else if (t.hasAttribute('data-auth-reset')) { var em = st.email; reset(); st.email = em; paint('.pc-auth input[type=email]'); }
    else if (t.hasAttribute('data-pk-enable')) pkEnable(t);
    else if (t.hasAttribute('data-pk-del')) pkRemove(t.getAttribute('data-pk-del'), t);
    else if (t.hasAttribute('data-pk-remove')) { var m = C.state.member; if (m) { delete keys()[String(m.email).toLowerCase()]; C.save(); C.toast('The passkey is removed from this device.'); if (M.account) M.account.render('profile'); } }
  });
  C.on('member', function () { if (C.state.member) reset(); });

  M.auth = {
    /* ctx: { p: id prefix, titleId, level: heading level } */
    cardHTML: function (c) { return '<div class="pc-auth" data-p="' + c.p + '" data-title="' + c.titleId + '" data-level="' + (c.level || 2) + '">' + inner({ p: c.p, titleId: c.titleId, level: c.level || 2 }) + '</div>'; },
    securityHTML: securityHTML,
    armSecurity: armSecurity
  };
})();
