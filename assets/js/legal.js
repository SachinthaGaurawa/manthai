/* =========================================================================
   House of MANTHAI · Maison Notes & Legal
   1. The numbered disclosure references (¹–⁶, built by C.dref) and the
      pre-footer "Maison Notes & Disclosures" band they lead to.
   2. The four legal documents served at /legal/:doc.
   Loads after core.js and before maison.js, which routes to M.legal.render.
   ========================================================================= */
(function () {
  'use strict';
  var M = window.MANTHAI, C = M.core, esc = C.esc, $ = C.$;

  /* ======================= 1. Maison Notes & Disclosures ======================= */
  var band = $('#maisonNotes'), toggle = band && $('.mnotes__toggle', band);
  var phone = window.matchMedia ? window.matchMedia('(max-width: 767px)') : { matches: false };
  var src = null, seq = 0, litT = 0, startT = 0;

  function setOpen(open) { if (!band) return; band.classList.toggle('is-open', open); toggle.setAttribute('aria-expanded', open ? 'true' : 'false'); }
  if (toggle) toggle.addEventListener('click', function () { setOpen(!band.classList.contains('is-open')); });

  function clearBack() { C.$$('.mnotes__back', band).forEach(function (b) { b.remove(); }); }
  function glideTo(top) {
    if (C.lenis) C.lenis.scrollTo(top, { immediate: C.reduced(), duration: 1.1 });
    else window.scrollTo({ top: top, behavior: C.reduced() ? 'auto' : 'smooth' });
  }

  /* a superscript: remember where the reader was, open the band on a phone, glide to the note and light it */
  function toNote(a) {
    var n = a.getAttribute('data-dref'), li = document.getElementById('maison-disclosure-' + n); if (!li) return;
    if (!a.id) a.id = 'dref-src-' + (++seq);
    var dlg = a.closest('dialog');
    src = { id: a.id, dlg: dlg && dlg.open ? dlg : null };
    if (src.dlg) C.close(src.dlg);
    if (phone.matches) setOpen(true);
    C.$$('.mnotes__item.is-lit', band).forEach(function (x) { x.classList.remove('is-lit'); });
    clearBack(); clearTimeout(litT); clearTimeout(startT);
    var back = document.createElement('a');
    back.className = 'mnotes__back'; back.href = '#' + a.id; back.innerHTML = '<span aria-hidden="true">↩</span> Back to section';
    li.querySelector('p').appendChild(back);
    startT = setTimeout(function () {
      C.scrollTo(li.id);
      setTimeout(function () {
        li.classList.add('is-lit');
        try { li.focus({ preventScroll: true }); } catch (e) { /* older browsers */ }
        litT = setTimeout(function () { li.classList.remove('is-lit'); }, 2200);
      }, C.reduced() ? 0 : 520);
    }, src.dlg ? 320 : 0);
  }

  /* the quiet return link: back to the superscript, or back into the layer it was read in */
  function toSource() {
    var s = src; clearBack(); src = null;
    if (!s) return;
    var el = document.getElementById(s.id);
    if (s.dlg) { C.open(s.dlg); if (el) setTimeout(function () { try { el.focus({ preventScroll: false }); } catch (e) { el.focus(); } }, 60); return; }
    if (!el || !el.offsetParent) return;
    var r = el.getBoundingClientRect();
    glideTo(Math.max(0, r.top + window.scrollY - window.innerHeight * 0.4));
    setTimeout(function () { try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } }, C.reduced() ? 0 : 700);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-dref]');
    if (a) { e.preventDefault(); e.stopPropagation(); toNote(a); return; }
    var b = e.target.closest && e.target.closest('.mnotes__back');
    if (b) { e.preventDefault(); e.stopPropagation(); toSource(); }
  }, true);

  /* ======================= 2. Legal documents ======================= */
  var ENTITY = 'House of Manthai (Private) Limited (An Avantio Ventures Company)';
  var JURISDICTION = 'Colombo, Democratic Socialist Republic of Sri Lanka';
  var UPDATED = '27 November 2026';
  var CARTON = 'For couriered orders across Sri Lanka, your signature midnight-navy lacquered presentation box arrives safeguarded inside an unbranded, reinforced protective outer shipping carton.';

  M.LEGAL = {
    terms: {
      title: 'Terms & Conditions of Sale',
      desc: 'The terms on which House of Manthai (Private) Limited sells MANTHAI pieces within Sri Lanka: pricing in LKR, order acceptance, payment, representation, liability and governing law.',
      intro: 'These terms govern every acquisition made from the House of MANTHAI flagship store. Please read them before completing an order; by completing an acquisition you accept them.',
      sections: [
        ['1. Who we are', ['The MANTHAI flagship store is operated by House of Manthai (Private) Limited, a company incorporated in Sri Lanka and a wholly owned subsidiary of Avantio Ventures (Private) Limited, Colombo. References to "the House", "we" and "us" mean House of Manthai (Private) Limited.']],
        ['2. Phase 1 scope', ['During Phase 1, the House sells exclusively to clients within Sri Lanka. All prices are displayed and charged in Sri Lankan rupees (LKR) and include delivery to addresses within Sri Lanka. Orders for delivery outside Sri Lanka cannot be accepted at this time.']],
        ['3. Order acceptance and stock confirmation', ['Every House of MANTHAI release is a strictly numbered, single-run limited edition; once all pieces of an edition are acquired, the silhouette is permanently archived and will not be restocked or reproduced. Placing an order is an offer to purchase; a contract is formed only when the House confirms your order by email or WhatsApp after verifying stock and payment. If a size or edition is no longer available, we will tell you promptly and refund any amount paid in full to the original payment method.', 'The House may decline or cancel an order where a pricing or listing error is evident, where payment cannot be verified, or where an order appears to be placed for resale.']],
        ['4. How pieces are represented', ['We photograph and describe every piece with care. Screen calibration, lighting and natural textiles mean silk luster, texture and colour may differ subtly in person. Interactive 3D unboxing previews, packaging renders and on-screen depictions of the Verification Card, Story Card, neck label and Digital Product Passport are illustrative and not shown at actual physical scale; presentation components may vary with silhouette, fabric volume and edition. Size and fit measurements are approximate and subject to tailoring tolerances of ±1–1.5 cm. These matters are explained in the Maison Notes & Disclosures at the foot of every page.']],
        ['5. Payment', ['The House accepts card payments processed by PayHere (Visa, Mastercard and American Express), LankaQR, and direct bank transfer. Orders paid by bank transfer are dispatched once the transfer has cleared. Cash on delivery is not offered at present. The House never sees or stores your full card number.']],
        ['6. Delivery and exchanges', ['Delivery, protective packaging, insured transit and the 14-day exchange and client care terms are set out in our Shipping, Protective Packaging & Exchanges policy, which forms part of these terms.']],
        ['7. Limitation of liability', ['Nothing in these terms limits any right you have as a consumer under the laws of Sri Lanka, including the Consumer Affairs Authority Act, No. 9 of 2003. Subject to that, the House is responsible for loss or damage that is a foreseeable result of our breach of these terms, and our total liability for any order is limited to the price paid for that order. We are not liable for delays or failures caused by events beyond our reasonable control.']],
        ['8. Governing law', ['These terms are governed by the laws of the Democratic Socialist Republic of Sri Lanka. Any dispute will be subject to the jurisdiction of the courts of Colombo, although we will always first try to resolve any concern directly through Client Care.']]
      ]
    },
    'shipping-exchanges': {
      title: 'Shipping, Protective Packaging & Exchanges',
      desc: 'How House of MANTHAI delivers within Sri Lanka: the lacquered presentation box inside a protective outer carton, insured courier timelines, signature on receipt, and the 14-day exchange.',
      intro: 'Every piece leaves the Colombo atelier sealed in its lacquered presentation box, and travels inside a second, protective carton. This policy explains how your order reaches you, and how exchanges work.',
      sections: [
        ['1. Protective packaging', ['Each piece is folded in acid-free tissue and sealed in the House’s midnight-navy lacquered presentation box. ' + CARTON + ' The outer carton carries no branding, so the contents are not apparent in transit.']],
        ['2. Delivery options and timelines', ['Complimentary Priority Colombo Delivery (Colombo 01–15): usually within two working days of order confirmation.', 'Complimentary Insured Courier Delivery (Islandwide): usually within four working days of order confirmation.', 'Private Colombo Collection: collect your piece from the Colombo atelier, by private appointment.', 'Displayed dates are good-faith estimates and may move because of public holidays, weather, payment verification or courier routing. We will keep you informed if a date changes.']],
        ['3. Insured transit and signature on receipt', ['Delivery is complimentary and insured against verified loss or physical damage until the order is signed for. A signature is required on receipt; the courier will not leave an order unattended. If the outer carton arrives visibly damaged, please note this when signing and contact Client Care the same day with photographs.']],
        ['4. 14-day exchange and client care', ['You may request a size exchange, or a refund to your original payment method, within 14 days of delivery. To qualify, the piece must be unworn, unwashed and unaltered, with its tags and Verification Card intact, returned in its original lacquered presentation box inside the protective outer carton.', '14-day unworn size exchanges are honoured subject to remaining availability within the numbered edition. Where the requested size in a closed edition is no longer available, House of Manthai (Private) Limited extends a Private Maison Credit toward a forthcoming edition or a full refund in accordance with our Terms & Conditions of Sale.', 'To begin an exchange, contact Client Care or use the Private Circle, and we will arrange the return with you. Refunds are made to the original payment method once the piece has been received and inspected at the atelier.', 'Pieces altered at your request, and pieces showing wear, cannot be exchanged. Care, repair and refreshing of MANTHAI pieces remain available through the atelier for life.']]
      ]
    },
    privacy: {
      title: 'Privacy Policy',
      desc: 'How House of Manthai (Private) Limited collects, uses and protects client information, in line with the Personal Data Protection Act, No. 9 of 2022 of Sri Lanka.',
      intro: 'We collect only what we need to make, deliver and care for your pieces, and we never sell client information. This policy is written in line with the Personal Data Protection Act, No. 9 of 2022 of Sri Lanka.',
      sections: [
        ['1. Information we collect', ['Order details: your name, email, mobile number, delivery address, the pieces and sizes you choose, gift messages and delivery instructions.', 'Private Circle details: your profile, saved addresses, saved silhouettes, sizing preferences, consultation requests and the pieces registered to your Digital Vault.', 'Stylist consultations: messages you send us through WhatsApp or email when you ask for styling advice.']],
        ['2. How we use it', ['To confirm, prepare and deliver your orders; to register your pieces and their Digital Product Passports; to provide exchanges, care and client support; and, only if you choose to receive them, to send you private previews of new editions.']],
        ['3. Sign-in and payment security', ['Sign-in to the Private Circle is passwordless and handled by Google Firebase Authentication. Card payments are processed by PayHere, a licensed Sri Lankan payment gateway; MANTHAI never sees or stores your full card number.']],
        ['4. Group processing', ['House of Manthai (Private) Limited is a wholly owned subsidiary of Avantio Ventures (Private) Limited, Colombo. Client information may be processed by Avantio Ventures (Private) Limited for shared group services, such as secure hosting, accounting and client care operations, under the same confidentiality and security obligations described here. It is never shared within the group for unrelated marketing, and never sold.']],
        ['5. Service providers', ['We share information only with providers who help us serve you: our courier partners (name, phone and address for delivery), PayHere (payment), Google Firebase (sign-in) and WhatsApp (if you choose to consult a stylist there). Each receives only what its task requires.']],
        ['6. Retention and your rights', ['We keep order records for as long as Sri Lankan tax and accounting law requires, and Private Circle details for as long as your account remains open. You may ask to see, correct or delete your information, or withdraw consent to marketing, at any time by writing to concierge@manthai.lk.']],
        ['7. Data controller', ['The data controller is House of Manthai (Private) Limited, Colombo, Sri Lanka. Questions about this policy may be sent to concierge@manthai.lk.']]
      ]
    },
    authenticity: {
      title: 'Authenticity & Intellectual Property Notice',
      desc: 'The numbered edition system, NFC and serial verification of the Digital Product Passport, and the proprietary marks of House of Manthai (Private) Limited.',
      intro: 'Every MANTHAI piece can be traced to the atelier that made it. This notice explains how authenticity is recorded, and which marks belong to the House.',
      sections: [
        ['1. Numbered editions', ['MANTHAI pieces are released in small batches. An edition number states the planned production quantity for that release, and each piece carries its own number within it, recorded on its Verification Card and in its Digital Product Passport.']],
        ['2. Digital Product Passport', ['Each piece has a Verification Card with an NFC tag and a QR code, and an NFC tag in its woven label. Tapping either with an NFC-compatible smartphone, or entering the serial code printed on the card, opens the piece’s Digital Product Passport: its edition, materials, origin, care and registered ownership. Clients without NFC hardware may verify a piece at any time using the serial code, or through Colombo Client Care. Passport screens shown before purchase are illustrative and may be updated over time.']],
        ['3. Ownership and transfer', ['A Passport registers to the first owner on acquisition. Ownership can be transferred through Client Care when a piece is gifted or passed on, so that its history stays with it.']],
        ['4. Proprietary marks', ['The MANTHAI wordmark, the Unbounded Spiral Seal, the Hidden Sun & Moon Cipher drawn into the wordmark, the lacquered presentation box, the Private Circle Presentation Case and all photography, film and text on this site are the property of House of Manthai (Private) Limited. They may not be reproduced, imitated or used in connection with any other goods without written permission.']],
        ['5. Reporting imitations', ['If you are offered a piece described as MANTHAI that cannot be verified, please write to concierge@manthai.lk. Only pieces with a valid Passport are recognised by the House.']]
      ]
    }
  };
  var ORDER = ['terms', 'shipping-exchanges', 'privacy', 'authenticity'];
  var SHORT = { terms: 'Terms of Sale', 'shipping-exchanges': 'Shipping & Exchanges', privacy: 'Privacy', authenticity: 'Authenticity & IP' };

  M.legal = {
    render: function (doc) {
      var L = M.LEGAL[doc] || M.LEGAL.terms, root = $('#legalPanel');
      if (root) root.innerHTML =
        '<div class="wrap legal__wrap">' +
          '<nav class="legal__nav" aria-label="Maison policies"><p class="legal__navk">Maison Policies</p><ul>' + ORDER.map(function (k) {
            return '<li><a href="/legal/' + k + '" data-legal="' + k + '"' + (k === doc ? ' aria-current="page"' : '') + '>' + esc(SHORT[k]) + '</a></li>';
          }).join('') + '</ul></nav>' +
          '<article class="legal__doc">' +
            '<p class="eyebrow">Maison Policies</p>' +
            '<h1 class="legal__title" id="legalTitle" tabindex="-1">' + esc(L.title) + '</h1>' +
            '<dl class="legal__meta"><div><dt>Entity</dt><dd>' + esc(ENTITY) + '</dd></div><div><dt>Jurisdiction</dt><dd>' + esc(JURISDICTION) + '</dd></div><div><dt>Last updated</dt><dd>' + UPDATED + '</dd></div></dl>' +
            '<p class="legal__intro">' + esc(L.intro) + '</p>' +
            L.sections.map(function (s) { return '<section class="legal__sec"><h2>' + esc(s[0]) + '</h2>' + s[1].map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') + '</section>'; }).join('') +
            '<p class="legal__contact">Questions about this policy: <a href="mailto:concierge@manthai.lk">concierge@manthai.lk</a></p>' +
          '</article>' +
        '</div>';
      return { title: L.title, desc: L.desc };
    }
  };
})();
