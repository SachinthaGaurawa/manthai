/* ==========================================================================
   MANTHAI  |  catalog, navigation and configuration data
   Single source of truth. All prices are authored in LKR.
   ========================================================================== */
(function () {
  'use strict';
  var M = (window.MANTHAI = window.MANTHAI || {});

  /* ---------- Site configuration (replace values when going live) ---------- */
  M.CONFIG = {
    /* Maison concierge WhatsApp number, international format, digits only. */
    whatsapp: '94778787998',
    /* Atelier film. Add real files and the film modal plays them instead of the placeholder reel. */
    film: { webm: '', mp4: '', poster: 'assets/media/hero/hero-poster.webp' },
    /* Optional ambient bed. When empty the page synthesises a very quiet drone. */
    ambientSrc: '',
    /* Google Identity Services client id. Empty means the Private Circle sign-in runs in demo mode. */
    googleClientId: '487193961323-hlfr6d51tmkjettelvsvubibkabvpqm9.apps.googleusercontent.com',
    /* Firebase web app config (Firebase console, Project settings, General, Your apps). Public values, safe to commit.
       When set, the Private Circle uses Firebase Authentication for Google and email-link sign-in and real accounts. */
    firebase: { apiKey: 'AIzaSyAQKp1atDL4gb0a9KNqm5f2ppYilIROK_w', authDomain: 'manthai.firebaseapp.com', projectId: 'manthai', storageBucket: 'manthai.firebasestorage.app', messagingSenderId: '487193961323', appId: '1:487193961323:web:b2af503cbc18082711222e' },
    storageKey: 'manthai.v1'
  };

  /* ---------- Market. Phase 1 sells in Sri Lanka only, priced in LKR.
     Phase 2: add currencies here (code, rate, locale) and enable a selector; every price already
     passes through MANTHAI.core.formatPrice(amountLKR), so nothing else needs to change. ---------- */
  M.MARKET = { country: 'LK', countryName: 'Sri Lanka', currency: 'LKR' };
  M.CURRENCIES = {
    LKR: { code: 'LKR', rate: 1, locale: 'en-LK' }
  };

  /* ---------- Collection filters (Phase 1: ladies luxury apparel only) ---------- */
  M.TABS = ['All', 'Evening Gowns', 'Midi & Cocktail', 'Tailoring', 'Silk Separates', 'Limited Editions'];
  /* Occasion-led discovery. Each product lists the occasions it is cut for. */
  M.OCCASIONS = ['Evening & Gala', 'Cocktail & Private Dinner', 'Modern Reception', 'Elevated Day-to-Evening'];
  /* Fit consensus, from atelier fittings: 0 runs small, 1 true to size, 2 runs large (decimals sit between). */
  M.FIT_LABELS = ['Runs small', 'True to size', 'Runs large'];

  /* ---------- Fit information ---------- */
  M.FITTING = 'Private Colombo Atelier Fitting';
  M.MODEL = { height: '173 cm / 5′8″', size: 'S' };
  /* International size conversion for women's apparel */
  M.SIZE_INTL = { UK: [6, 8, 10, 12, 14], EU: [34, 36, 38, 40, 42], US: [2, 4, 6, 8, 10] };
  /* Body measurements in cm. Hollow-to-hem is per piece (product.hollow, size S) and moves 1.5 cm per size. */
  M.SIZECHART = {
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    bust:  [80, 84, 88, 93, 98],
    waist: [62, 66, 70, 75, 80],
    hip:   [88, 92, 96, 101, 106],
    hollowStep: 1.5
  };
  /* Universal preservation notes shown in the Material & garment care accordion */
  M.CARE = [
    'Dry clean by a couture specialist only. Never machine wash, tumble dry or soak.',
    'Steam gently from a distance of at least 20 cm, on the reverse of the cloth. Never press an iron directly onto silk-velvet, hand-painted pigment or beadwork.',
    'Store hanging on a padded hanger inside the supplied breathable cotton garment bag, wrapped in acid-free tissue. Never use plastic.',
    'Keep away from direct sun, perfume and heat. Rest the piece for a day between wears.',
    'Bring any piece back to the Colombo atelier for refreshing, repair or re-beading, for life.'
  ];

  /* ---------- Catalogue ----------
     media: drop real photography paths here. Any non-empty value replaces the atmospheric placeholder.
       form   = front view, 4:5 portrait
       back   = back view
       detail = bodice and textile macro (the 4x loupe reads this too)
       move   = drape in motion
     hollow = hollow-to-hem in cm for size S.
     prompt fields are the director's prompts for generating each asset. */
  M.PRODUCTS = [
    {
      id: 'aurelia-gown',
      name: 'Aurelia Liquid Silk-Velvet Evening Gown',
      short: 'Aurelia Silk-Velvet Gown',
      tabs: ['Evening Gowns', 'Limited Editions'], collection: 'Evening & Gala Gowns',
      price: 185000, edition: 15, stock: { XS: 2, S: 3, M: 4, L: 2, XL: 0 }, kind: 'gown', sizing: 'apparel', hollow: 146,
      summary: '22-momme silk-velvet, a sculpted asymmetric neckline and a full silk crepe lining.',
      provenance: 'Cut on the stand and hand-finished in the Colombo atelier',
      story: 'The silk-velvet is cut on the stand so the asymmetric neckline sits exactly where the body turns, then the gown falls in one unbroken line to the floor. Under light the pile moves from deep shadow to a warm, liquid sheen.',
      materials: '22-momme silk-velvet shell. Silk crepe de chine lining. Concealed side closure and inner waist stay.',
      feel: { fabric: '22-Momme Silk-Velvet', hand: 'Dense, liquid drape that warms in the hand, with a full breathable silk crepe de chine lining', gsm: 280 },
      weight: 'Heavy evening weight, 280 GSM. Falls straight and holds the floor without lifting in a breeze.',
      drape: 'Cut on the stand with an asymmetric neckline. Fully lined in silk crepe de chine, so it never clings.',
      care: 'Silk-velvet crushes under pressure: never iron or press the pile. Steam from the reverse at a distance and store hanging in the supplied garment bag.',
      palette: ['#3a2618', '#100b08', '#C9AF7E'],
      occasions: ['Evening & Gala'], fit: 1, pairs: ['nocturne-cape-top', 'meridian-blazer'],
      media: { form: 'assets/media/products/temp/aurelia-gown-form.webp', back: '', detail: 'assets/media/products/temp/aurelia-gown-detail.webp', move: 'assets/media/products/temp/aurelia-gown-move.webp' }, /* TEMPORARY reference photos for the test build: replace with the MANTHAI shoot before launch */
      prompt: 'Liquid silk-velvet evening gown with a sculpted asymmetric neckline, deep warm sheen, chiaroscuro golden light, 35mm editorial photography'
    },
    {
      id: 'solstice-midi',
      name: 'Solstice Draped Garnet Midi Dress',
      short: 'Solstice Garnet Midi',
      tabs: ['Midi & Cocktail'], collection: 'Sculpted Midi & Cocktail',
      price: 98000, edition: 20, stock: { XS: 3, S: 4, M: 5, L: 4, XL: 2 }, kind: 'lace', sizing: 'apparel', hollow: 118,
      summary: 'Velvet-garnet satin twill, a single sculpted twist at the waist and a fluid midi hem.',
      provenance: 'Draped and finished by hand in the Colombo atelier',
      story: 'One length of garnet satin twill is twisted once at the waist and released into a fluid midi hem, so the dress moves a beat after you do. The colour is the house signature: deep, quiet and unmistakable.',
      materials: 'Velvet-garnet silk satin twill. Silk crepe lining. Hand-finished seams and an invisible back zip.',
      feel: { fabric: '19-Momme Silk Satin Twill', hand: 'Smooth, cool and weighted, with a soft diagonal sheen and a full silk lining', gsm: 165 },
      weight: 'Mid weight, 165 GSM. Enough body to hold the waist twist, light enough to move.',
      drape: 'Bias-released skirt from a single twisted waist. Lined in silk crepe to the hem.',
      care: 'Satin twill waterspots: keep dry and blot at once. Steam on the reverse.',
      palette: ['#4C1722', '#1d070c', '#8a2a3a'],
      occasions: ['Cocktail & Private Dinner', 'Modern Reception'], fit: 1, pairs: ['meridian-blazer', 'nocturne-cape-top'],
      media: { form: 'assets/media/products/temp/solstice-midi-form.webp', back: '', detail: 'assets/media/products/temp/solstice-midi-detail.webp', move: 'assets/media/products/temp/solstice-midi-move.webp' }, /* TEMPORARY reference photos for the test build: replace with the MANTHAI shoot before launch */
      prompt: 'Velvet-garnet satin twill midi dress with a sculpted waist twist and fluid hem, soft window light on ivory, editorial womenswear'
    },
    {
      id: 'meridian-blazer',
      name: 'Meridian Structured Ivory Tailored Blazer',
      short: 'Meridian Ivory Blazer',
      tabs: ['Tailoring'], collection: 'Architectural Tailoring',
      price: 115000, edition: 20, stock: { XS: 3, S: 4, M: 4, L: 3, XL: 2 }, kind: 'blazer', sizing: 'apparel', hollow: 64,
      summary: 'Tropical virgin wool-silk, a sharp sculpted shoulder and a concealed horn clasp.',
      provenance: 'Cut, canvassed and pressed by hand in the Colombo atelier',
      story: 'A sharp shoulder, a nipped waist and nothing on the front but a concealed horn clasp. The tropical wool-silk breathes in Colombo heat and still holds an architectural line through a long evening.',
      materials: 'Tropical virgin wool-silk. Half horsehair canvas. Silk twill lining. Concealed natural horn clasp. Woven damask neck label.',
      feel: { fabric: 'Tropical Virgin Wool-Silk', hand: 'Crisp and dry to the touch, cool against the skin, with a silk twill lining that slides on', gsm: 210 },
      weight: 'Tropical weight, 210 GSM. Structured enough for a sharp shoulder, light enough for Colombo heat.',
      drape: 'Half-canvassed for shape, lined in silk twill. Single concealed horn clasp at the waist.',
      care: 'Brush gently with a soft garment brush after wearing. Steam, never press the lapel roll flat.',
      palette: ['#2a2018', '#0E0D0C', '#C9AF7E'],
      occasions: ['Elevated Day-to-Evening', 'Cocktail & Private Dinner'], fit: 1, pairs: ['meridian-trousers', 'alabaster-slip'],
      media: { form: 'assets/media/products/temp/meridian-blazer-form.webp', back: '', detail: 'assets/media/products/temp/meridian-blazer-detail.webp', move: 'assets/media/products/temp/meridian-blazer-move.webp' }, /* TEMPORARY reference photos for the test build: replace with the MANTHAI shoot before launch */
      prompt: 'Structured ivory tailored blazer in tropical wool-silk with a sharp shoulder and concealed horn clasp, soft window light, editorial womenswear'
    },
    {
      id: 'meridian-trousers',
      name: 'Meridian High-Waist Wide Silk Trousers',
      short: 'Meridian Wide Silk Trousers',
      tabs: ['Tailoring', 'Silk Separates'], collection: 'Architectural Tailoring',
      price: 62000, edition: 0, batch: 24, stock: { XS: 4, S: 6, M: 6, L: 5, XL: 3 }, kind: 'trouser', sizing: 'apparel', hollow: 128,
      summary: 'Double-faced crepe, a high waist with a tailored pleat and silk-lined pockets.',
      provenance: 'Pleated and hand-finished in the Colombo atelier',
      story: 'A single tailored pleat at a high waist releases into a wide leg that falls straight to the floor. The double-faced crepe needs no lining, so the trouser moves like a long skirt and stays cool.',
      materials: 'Double-faced silk-blend crepe. Silk pocket lining. Concealed side closure. Hand-finished hem.',
      feel: { fabric: 'Double-Faced Crepe', hand: 'Fine, matte grain on both faces with a weighted, swinging fall; pockets lined in silk', gsm: 240 },
      weight: 'Weighted crepe, 240 GSM. The wide leg swings and settles without creasing.',
      drape: 'Unlined double-faced crepe, finished clean inside. Silk-lined pockets and a silk waistband facing.',
      care: 'Hang by the waistband on a padded clip hanger. Steam on the reverse; never press the pleat flat.',
      palette: ['#26262a', '#0E0D0C', '#C9AF7E'],
      occasions: ['Elevated Day-to-Evening'], fit: 0.9, pairs: ['meridian-blazer', 'alabaster-slip'],
      media: { form: 'assets/media/products/temp/meridian-trousers-form.webp', back: '', detail: 'assets/media/products/temp/meridian-trousers-detail.webp', move: 'assets/media/products/temp/meridian-trousers-move.webp' }, /* TEMPORARY reference photos for the test build: replace with the MANTHAI shoot before launch */
      prompt: 'High-waist wide-leg double-faced crepe trousers with a tailored pleat, fluid motion, soft light on an ivory wall'
    },
    {
      id: 'alabaster-slip',
      name: 'Alabaster Bias-Cut Mulberry Silk Slip Dress',
      short: 'Alabaster Silk Slip Dress',
      tabs: ['Silk Separates'], collection: 'Silk Separates',
      price: 76000, edition: 0, batch: 18, stock: { XS: 2, S: 3, M: 4, L: 3, XL: 2 }, kind: 'column', sizing: 'apparel', hollow: 120,
      summary: '19-momme mulberry silk, cut on the bias and finished with hand-rolled French seams.',
      provenance: 'Cut on the bias and hand-finished in the Colombo atelier',
      story: 'Cut on the bias so the silk follows the body without a single dart, then finished inside with hand-rolled French seams. Worn alone for evening, or under the Meridian blazer by day.',
      materials: '19-momme mulberry silk charmeuse. Hand-rolled French seams. Adjustable silk rouleau straps.',
      feel: { fabric: '19-Momme Mulberry Silk', hand: 'Cool, liquid and weightless, with a soft pearl lustre that moves with the body', gsm: 82 },
      weight: 'Light weight, 82 GSM. Floats on the body and layers without bulk.',
      drape: 'Bias-cut, so it drapes and skims without darts. Unlined, with hand-rolled French seams throughout.',
      care: 'Mulberry silk waterspots: keep dry and blot at once. Steam on the reverse at a distance.',
      palette: ['#2a2018', '#0E0D0C', '#C9AF7E'],
      occasions: ['Modern Reception', 'Cocktail & Private Dinner'], fit: 1.1, pairs: ['meridian-blazer', 'nocturne-cape-top'],
      media: { form: 'assets/media/products/temp/alabaster-slip-form.webp', back: '', detail: 'assets/media/products/temp/alabaster-slip-detail.webp', move: 'assets/media/products/temp/alabaster-slip-move.webp' }, /* TEMPORARY reference photos for the test build: replace with the MANTHAI shoot before launch */
      prompt: 'Ivory bias-cut mulberry silk slip dress, liquid pearl sheen, hand-rolled seams, soft window light, editorial womenswear'
    },
    {
      id: 'nocturne-cape-top',
      name: 'Nocturne Hand-Beaded Sheer Organza Cape Top',
      short: 'Nocturne Beaded Cape Top',
      tabs: ['Limited Editions'], collection: 'Atelier Limited Editions',
      price: 128000, edition: 12, stock: { XS: 1, S: 2, M: 3, L: 2, XL: 1 }, kind: 'cape', sizing: 'apparel', hollow: 64,
      summary: 'Sheer silk organza, a fluid cape line and tonal hand-beading set one bead at a time.',
      provenance: '36 artisan hours of tonal hand-beading in the Colombo atelier',
      story: 'Silk organza is cut into a cape that floats from the shoulder, then beaded by hand in tones so close to the cloth that the work only shows when light crosses it. Twelve are made, each numbered.',
      materials: 'Silk organza. Tonal glass bead and bugle embroidery. Silk crepe bandeau underlayer. Single hook closure.',
      feel: { fabric: 'Sheer Silk Organza', hand: 'Crisp, airy and translucent, with the cool weight of hand-set beads along the hem', gsm: 45 },
      weight: 'Featherweight organza, 45 GSM, with a weighted beaded hem that keeps the cape line.',
      drape: 'Floats from the shoulder over a silk crepe bandeau. Closes with a single hook at the neck.',
      care: 'Beadwork snags easily: remove rings when dressing. Steam at a distance, never press, and store flat in tissue.',
      palette: ['#16110a', '#0E0D0C', '#C9AF7E'],
      occasions: ['Evening & Gala', 'Modern Reception'], fit: 1, pairs: ['aurelia-gown', 'meridian-trousers'],
      media: { form: 'assets/media/products/temp/nocturne-cape-top-form.webp', back: '', detail: 'assets/media/products/temp/nocturne-cape-top-detail.webp', move: 'assets/media/products/temp/nocturne-cape-top-move.webp' }, /* TEMPORARY reference photos for the test build: replace with the MANTHAI shoot before launch */
      prompt: 'Sheer silk organza cape top with tonal hand-beading catching the light, numbered atelier edition, dark warm chiaroscuro'
    }
  ];
  /* per-size stock drives sold-out sizes, the low-stock cue and the remaining count */
  M.PRODUCTS.forEach(function (p) {
    var st = p.stock || {}, sizes = M.SIZECHART.sizes;
    p.soldOut = sizes.filter(function (z) { return !(st[z] > 0); });
    p.remaining = sizes.reduce(function (n, z) { return n + (st[z] || 0); }, 0);
    p.crafted = p.edition || p.batch || p.remaining;
  });

  /* ---------- Navigation: four items. Only Collections opens the Atelier Panel. ----------
     actions: filter:<tab>  occasion:<name>  product:<id>  stylist  fitting  salon  film  anchor:<id>  route:<home|maison>  info:<key>  seal */
  M.NAV = [
    { key: 'new', label: 'New Arrivals', action: 'filter:All' },
    { key: 'collections', label: 'Collections', title: 'Ladies ready-to-wear, cut in the Colombo atelier.',
      product: 'aurelia-gown', image: 'Aurelia, Meridian and Alabaster', src: 'assets/media/editorial/temp/collections-panel.webp', /* TEMPORARY reference photos */
      groups: [
        { title: 'Categories', links: [
          { label: 'Evening & Gala Gowns', action: 'filter:Evening Gowns' },
          { label: 'Sculpted Midi & Cocktail', action: 'filter:Midi & Cocktail' },
          { label: 'Architectural Tailoring', action: 'filter:Tailoring' },
          { label: 'Silk Separates', action: 'filter:Silk Separates' },
          { label: 'Atelier Limited Editions', action: 'filter:Limited Editions' }
        ] },
        { title: 'By occasion', links: [
          { label: 'Evening & Gala', action: 'occasion:Evening & Gala' },
          { label: 'Cocktail & Private Dinner', action: 'occasion:Cocktail & Private Dinner' },
          { label: 'Modern Reception', action: 'occasion:Modern Reception' },
          { label: 'Elevated Day-to-Evening', action: 'occasion:Elevated Day-to-Evening' }
        ] }
      ] },
    { key: 'lookbook', label: 'Lookbook', action: 'anchor:campaign' },
    { key: 'maison', label: 'The Maison', action: 'route:maison' }
  ];

  /* ---------- Editorial pillars (60/40 category showcase) ---------- */
  M.PILLARS = [
    { title: 'Evening Sculpture', text: 'Silk-velvet and organza cut on the stand for the evenings that are remembered.', product: 'aurelia-gown', action: 'filter:Evening Gowns', link: 'Explore evening gowns' },
    { title: 'Modern Tailoring', text: 'A sharp shoulder, a high waist and a wide silk leg that answer each other.', product: 'meridian-blazer', action: 'filter:Tailoring', link: 'Explore tailoring' },
    { title: 'Fluid Silk Editions', text: 'Bias-cut mulberry silk and garnet satin that move a beat after you do.', product: 'alabaster-slip', action: 'filter:Silk Separates', link: 'Explore silk separates' }
  ];

  /* ---------- The Unbounded Spiral Seal: the four meanings shown in the decoder (group ids in index.html) ---------- */
  M.SEAL_PARTS = [
    { key: 'core', title: 'The Origin Thread', group: 'spiral-core',
      text: 'Rooted in the logarithmic curve mathematician Jakob Bernoulli named Spira Mirabilis (\u201cThough changed, I shall arise the same\u201d), this unbroken central coil embodies the single thread of craft discipline that anchors every MANTHAI silhouette, however boldly the house evolves.' },
    { key: 'foundation', title: 'Chambers of Mastery', group: 'chambers-foundation',
      text: 'Like nature\u2019s chambered shells that perfect each space before expanding into the next, these foundational arcs represent quiet atelier patience: textile curation, structural pattern work, and finishing built to outlive seasonal noise.' },
    { key: 'crescendo', title: 'The Crescendo', group: 'chambers-crescendo',
      text: 'Rising progressively wider in measured proportion, the upper chambers express sculptural volume, architectural pleating, and a house that refuses stagnation, outgrowing yesterday\u2019s ceiling with every collection.' },
    { key: 'arch', title: 'The Unbounded Horizon', group: 'unbounded-arch',
      text: 'Deliberately open rather than closed into a circle, the sweeping outer arch flows like liquid silk in motion, declaring our founding conviction that true fashion has no cage, no border, and no final limit.' }
  ];

  /* ---------- Lookbook stills (campaign media slots) ---------- */
  M.LOOKBOOK = [
    /* src: TEMPORARY reference photos for the test build (assets/media/lookbook/temp). Replace with the MANTHAI campaign shoot before launch. */
    { id: 'emporium', title: 'The Great Hall', filter: 'Evening Gowns', kind: 'courtyard', src: 'assets/media/lookbook/temp/emporium.webp',
      caption: 'Ivory tailoring and a hand-worked column skirt under a travertine arch.',
      prompt: 'Ultra-luxury haute couture campaign still, ivory tailoring in a minimalist travertine hall with soft directional light' },
    { id: 'studio', title: 'Sculpted Tailoring', filter: 'Tailoring', kind: 'studio', src: 'assets/media/lookbook/temp/studio.webp',
      caption: 'Black tailoring cut with an ivory silk drape, high above the city.',
      prompt: 'Luxury womenswear editorial, black tailored jacket with an ivory silk drape, wide trousers, penthouse window light' },
    { id: 'atelier', title: 'On the Stand', filter: 'Limited Editions', kind: 'table', src: 'assets/media/lookbook/temp/atelier.webp',
      caption: 'A hand-embroidered bodice and a full silk skirt, finished on the stand.',
      prompt: 'Hand-embroidered bodice and silk skirt on a dress form in a sunlit atelier' },
    { id: 'ivory', title: 'Ivory Hour', filter: 'Tailoring', kind: 'damask', src: 'assets/media/lookbook/temp/ivory.webp',
      caption: 'A wrap jacket embroidered by hand, worn with wide ivory trousers.',
      prompt: 'Ivory wrap jacket with hand embroidery and wide trousers, soft morning light through sheer curtains' }
  ];

  /* ---------- Unboxing and authenticity ritual: four objects ----------
     parts = which drawn objects light up in the exploded view */
  M.RITUAL = [
    { id: 'box',     name: 'Rigid Linen Gatefold Box', spec: 'Midnight navy linen, magnetic doors, gold foil', parts: ['box', 'seal'],
      text: 'A rigid apparel box wrapped in matte midnight navy linen. Two doors close on hidden magnets and open from the centre: the left carries the MANTHAI wordmark, the right the Unbounded Spiral Seal, both in burnished gold foil, and both are lined in velvet garnet. Each box is made in proportion to the piece it holds, and it is made to be kept.' },
    { id: 'garment', name: 'Silk Piece in Acid-Free Tissue', spec: 'Folded by hand, sealed with a gold wafer', parts: ['garment'],
      text: 'Your piece is folded by hand on a bed of acid-free Alabaster tissue, wrapped in two leaves and sealed with a small gold wafer bearing the Seal. It lifts out as one, tissue and all, so the silk is never handled twice.' },
    { id: 'label',   name: 'Woven Neck and Origin Labels', spec: 'Silk damask, set under the back facing', parts: ['label'],
      text: 'Inside the back neck, under the facing, sits a woven silk-damask label with the MANTHAI wordmark in gold. Beneath it, a soft satin label gives the size and the words Crafted in Sri Lanka. Both are woven in proportion to the garment and stitched into the neck seam, so nothing rests against the skin.' },
    { id: 'elite',   name: 'MANTHAI Elite Club Case', spec: 'Magnetic lid, velvet tray, domed resin Seal', parts: ['card'],
      text: 'Under the piece, a velvet insert holds the MANTHAI Elite Club case. Its lid closes on magnets and is lined with the words Sovereignty in Every Detail. Step Into Privilege. Inside, a velvet tray holds your Verification Card and the Seal, cast in gold under a clear resin dome.' },
    { id: 'card',    name: 'Verification Card and Story Card', spec: 'Black metal, QR and NFC; thick cotton', parts: ['card'],
      text: 'The Verification Card is cut from black brushed metal and carries the Seal, your edition number and an NFC and QR link to the authenticity record. Under the case lies a thick cotton Story Card that tells the provenance of your piece.' }
  ];

  /* ---------- Short policy texts for the footer info layer ---------- */
  M.INFO = {
    delivery: { title: 'Delivery',
      body: ['Complimentary white-glove insured delivery in Colombo, usually within two working days. A Maison courier brings the piece to you and waits while you open it.',
             'Islandwide insured courier across Sri Lanka, usually within four working days, also complimentary. You may also collect from the Colombo atelier.',
             'Delivery is always complimentary. Every order is prepaid by card, LankaQR or bank transfer; cash on delivery is not offered.'] },
    care: { title: 'Care and repair',
      body: ['Every piece comes with care notes on its Story Card. The atelier in Colombo repairs and refreshes MANTHAI pieces for life.',
             'Scan the NFC tag inside your piece to open its Digital Product Passport and request care at any time.'] },
    privacy: { title: 'Privacy',
      body: ['This storefront stores your bag and Private Circle details in your own browser. Sign-in is handled by Google Firebase Authentication; orders are not sent to a server in this build.',
             'Draft text. Final policy wording is to be confirmed before launch.'] },
    terms: { title: 'Terms of sale',
      body: ['Prices are shown and charged in Sri Lankan rupees (LKR), with complimentary delivery across Sri Lanka.',
             'Draft text. Final terms are to be confirmed before launch.'] }
  };
})();
