/* ==========================================================================
   MANTHAI  |  signatory: the one place that names who signs the certificate
   (The site has no build step, so this plain script plays the role of a
   src/config/signatory.ts module.) Both the 3D landscape certificate in the
   unboxing ritual (shot IX) and the A4 portrait PDF read everything below,
   so changing it here changes both certificates identically.
   ========================================================================== */
(function () {
  'use strict';
  var M = (window.MANTHAI = window.MANTHAI || {});
  var S = M.SIGNATORY = {
    SIGNATORY_LABEL: 'AUTHORIZED SIGNATORY',
    /* Sovereign executive title across apparel and the future Maison chapters.
       Switch this one constant to 'Founder & Creative Director' if preferred. */
    SIGNATORY_TITLE: 'Maison Director',
    SIGNATORY_ENTITY: 'House of Manthai (Private) Limited',
    /* Drop a transparent signature PNG or SVG into /assets/house-signature.png (or .svg) and set its path
       here, e.g. '/assets/house-signature.png', to replace the placeholder stroke on BOTH the 3D Certificate
       and the A4 Portrait PDF. It is fitted inside the same locked box (contain), so nothing shifts.
       While this is null, the placeholder calligraphic stroke below is used. */
    SIGNATURE_IMAGE_URL: null,
    /* the placeholder stroke, drawn in a 164 x 52 box */
    PLACEHOLDER_PATH: 'M6 40C10 31 15 19 20 13C23 9.5 26 10 25.5 15C25 21 23 30 23.5 36C26 27 31 16 36 12C39.5 9.5 41.5 11.5 40.5 17C39.5 23 38 30 39.5 35C42.5 29 46.5 23.5 50.5 23C53.5 22.7 53.5 26.5 52 30C50.8 33 51.5 35.5 54.5 35C59 34.3 62.5 27.5 66.5 26.5C69.5 25.8 70 28.5 68.8 31.5C67.8 34 68.8 35.6 71.8 35C77 34 81 25 86 24C89.6 23.3 90 26.4 88.6 29.6C87.6 32 88.4 34 91.4 33.4C98 32 104 21 111 17.5C114.5 15.8 116.5 17.5 115 21.5C113.2 26.5 111 31 113.5 32C118 33.6 126 26 132 24.6M13 47C42 41.5 82 39 128 36.5C140 35.8 150 35.6 158 36',
    BOX: [164, 52]
  };

  /* the 3D certificate: caption from the config, and the signature image when one is set */
  function apply() {
    document.querySelectorAll('[data-signatory]').forEach(function (el) {
      el.textContent = S.SIGNATORY_TITLE + ' · House of Manthai';
    });
    if (!S.SIGNATURE_IMAGE_URL) return;
    document.querySelectorAll('.ub-cert__sig').forEach(function (svg) {
      var img = document.createElement('img');
      img.className = 'ub-cert__sig ub-cert__sig--img';
      img.src = S.SIGNATURE_IMAGE_URL; img.alt = ''; img.decoding = 'async';
      svg.parentNode.replaceChild(img, svg);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply); else apply();
})();
