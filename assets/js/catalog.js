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

  /* ---------- Currencies. Rates are indicative; swap FX.refresh() for a live feed ---------- */
  M.CURRENCIES = {
    LKR: { code: 'LKR', region: 'Sri Lanka',     rate: 1,        label: 'Sri Lanka · LKR',      locale: 'en-LK' },
    USD: { code: 'USD', region: 'United States', rate: 0.0033,   label: 'United States · USD',  locale: 'en-US' },
    EUR: { code: 'EUR', region: 'Europe',        rate: 0.00285,  label: 'Europe · EUR',         locale: 'en-IE' },
    GBP: { code: 'GBP', region: 'United Kingdom',rate: 0.00246,  label: 'United Kingdom · GBP', locale: 'en-GB' },
    AED: { code: 'AED', region: 'United Arab Emirates', rate: 0.01212, label: 'UAE · AED',     locale: 'en-AE' }
  };

  /* ---------- Collection filters (Phase 1: ladies luxury apparel only) ---------- */
  M.TABS = ['All', 'Evening Gowns', 'Midi & Cocktail', 'Tailoring', 'Silk Separates', 'Limited Atelier'];
  /* Occasion-led discovery. Each product lists the occasions it is cut for. */
  M.OCCASIONS = ['Gala & Black Tie', 'Private Cocktail', 'Modern Bridal & Reception', 'Day-to-Evening Statement'];
  /* Fit consensus, from atelier fittings: 0 runs small, 1 true to size, 2 runs large (decimals sit between). */
  M.FIT_LABELS = ['Runs small', 'True to size', 'Runs large'];

  /* ---------- Fit information ---------- */
  M.FITTING = 'Private Colombo Atelier Fitting';
  M.MODEL = { height: '175 cm / 5′9″', size: 'S' };
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
      id: 'alstroemeria-gown',
      name: 'Alstroemeria Hand-Painted Velvet Couture Gown',
      short: 'Alstroemeria Velvet Couture Gown',
      tabs: ['Evening Gowns', 'Limited Atelier'], collection: 'Atelier Limited Edition',
      price: 295000, edition: 12, remaining: 10, kind: 'gown', sizing: 'apparel', soldOut: ['XL'], hollow: 146,
      summary: 'Hand-painted Alstroemeria silk-velvet bodice, sculptural asymmetric drape, 48 artisan hours of hand beadwork.',
      provenance: '48 artisan hours, hand-painted and beaded in the Colombo atelier',
      story: 'Every Alstroemeria petal is painted by hand onto the silk-velvet before the bodice is cut, so no two gowns carry the same bloom. Glass beads are then set one at a time along the asymmetric drape.',
      materials: 'Silk-velvet bodice hand-painted with metallic gold and mineral pigment. Silk crepe drape. Hand-set glass beadwork. Concealed corsetry.',
      care: 'Painted pigment and beadwork are fragile. Steam only on the reverse and never press. Store hanging in the supplied cotton garment bag.',
      palette: ['#4A121C', '#1b0508', '#C5A059'],
      occasions: ['Gala & Black Tie'], fit: 1, pairs: ['sovereign-wave-blazer', 'mannar-pearl-cape'],
      media: { form: '', back: '', detail: '', move: '' },
      prompt: 'Hand-painted Alstroemeria silk-velvet sculpted evening gown, fluid fabric motion, brushwork and beadwork shimmer, 35mm anamorphic film grain, chiaroscuro golden light'
    },
    {
      id: 'ceylon-rosette-mullet',
      name: 'Ceylon Rosette 3D Sculpted Mullet Gown',
      short: 'Ceylon Rosette Mullet Gown',
      tabs: ['Evening Gowns'], collection: 'Evening & Gala Gowns',
      price: 245000, edition: 15, remaining: 11, kind: 'mullet', sizing: 'apparel', soldOut: [], hollow: 150,
      summary: 'Alabaster Silk, three-dimensional hand-sculpted silk rosettes and a cathedral train, short at the front and long behind.',
      provenance: 'Rosettes folded and stitched by hand in the Colombo atelier',
      story: 'Each rosette is folded from a single length of Alabaster Silk and stitched petal by petal, then set along the bodice and down the train. The hem lifts at the front and falls behind in a sweeping train.',
      materials: 'Alabaster Silk, hand-sculpted three-dimensional silk rosettes, boned bodice, silk-lined train.',
      care: 'Keep rosettes uncrushed: store the gown hanging with the train supported in tissue. Steam on the reverse only.',
      palette: ['#2a2018', '#0b0b0c', '#C5A059'],
      occasions: ['Gala & Black Tie', 'Modern Bridal & Reception'], fit: 1, pairs: ['mannar-pearl-cape', 'meridian-silk-shirt'],
      media: { form: '', back: '', detail: '', move: '' },
      prompt: 'Alabaster Silk mullet evening gown with three-dimensional sculpted silk rosettes and a sweeping train, chiaroscuro golden light, 35mm anamorphic film grain'
    },
    {
      id: 'serendib-column',
      name: 'Serendib Strapless Bow-Sculpted Column Gown',
      short: 'Serendib Bow Column Gown',
      tabs: ['Evening Gowns'], collection: 'Evening & Gala Gowns',
      price: 215000, edition: 15, remaining: 12, kind: 'column', sizing: 'apparel', soldOut: [], hollow: 144,
      summary: 'Mannar Pearl duchesse satin, strapless sculpted column, with an architectural origami bow across the back.',
      provenance: 'Cut, boned and folded by hand in the Colombo atelier',
      story: 'A single clean line from neckline to floor, held by internal boning, with the one flourish saved for the back: an origami bow folded from the same duchesse satin.',
      materials: 'Mannar Pearl duchesse satin, internal boning, silk lining, hand-folded origami bow.',
      care: 'Duchesse satin marks easily: blot, never rub. Steam on the reverse. Store hanging in the supplied garment bag.',
      palette: ['#2a2018', '#0b0b0c', '#C5A059'],
      occasions: ['Gala & Black Tie', 'Modern Bridal & Reception'], fit: 0.7, pairs: ['mannar-pearl-cape', 'sovereign-wave-blazer'],
      media: { form: '', back: '', detail: '', move: '' },
      prompt: 'Strapless Mannar Pearl duchesse satin column gown with a sculpted origami back bow, museum-quality fashion photography, warm chiaroscuro'
    },
    {
      id: 'mahatittha-lace-midi',
      name: 'Mahatittha Draped Garnet Lace Midi Dress',
      short: 'Mahatittha Garnet Lace Midi',
      tabs: ['Midi & Cocktail'], collection: 'Sculpted Dresses',
      price: 148000, edition: 20, remaining: 14, kind: 'lace', sizing: 'apparel', soldOut: [], hollow: 118,
      summary: 'Deep Garnet Velvet draped lace, architectural twisted waist, concealed silk lining.',
      provenance: 'Draped and finished by hand in the Colombo atelier',
      story: 'Named for the Great Emporium, the dress twists once at the waist and falls in a single sculpted line, lace over velvet the colour of Mantai garnet.',
      materials: 'Garnet velvet, corded lace, concealed silk lining, hand-finished seams.',
      care: 'Steam lace on the reverse, never press. Rest the dress for a day between wears.',
      palette: ['#4A121C', '#240709', '#8a2a3a'],
      occasions: ['Private Cocktail'], fit: 1, pairs: ['mannar-pearl-cape', 'sovereign-wave-blazer'],
      media: { form: '', back: '', detail: '', move: '' },
      prompt: 'Deep garnet velvet draped lace midi dress with an architectural twisted waist, warm chiaroscuro'
    },
    {
      id: 'anuradhapura-silk-midi',
      name: 'Anuradhapura Asymmetric Twisted Silk Midi',
      short: 'Anuradhapura Twisted Silk Midi',
      tabs: ['Midi & Cocktail'], collection: 'Sculpted Dresses',
      price: 128000, edition: 18, remaining: 13, kind: 'silkmidi', sizing: 'apparel', soldOut: [], hollow: 112,
      summary: 'Liquid Obsidian mulberry silk crepe, a single twisted drape at the hip and an asymmetric hem.',
      provenance: 'Draped on the stand and hand-finished in the Colombo atelier',
      story: 'The silk is draped directly on the stand and twisted once at the hip, so the hem rises on one side and falls on the other. It moves like dark water.',
      materials: 'Liquid Obsidian heavy mulberry silk crepe, silk lining, hand-rolled hem.',
      care: 'Mulberry silk waterspots: keep dry and blot at once. Steam on the reverse.',
      palette: ['#26262a', '#0b0b0c', '#C5A059'],
      occasions: ['Private Cocktail', 'Day-to-Evening Statement'], fit: 1.3, pairs: ['sovereign-wave-blazer', 'meridian-silk-shirt'],
      media: { form: '', back: '', detail: '', move: '' },
      prompt: 'Liquid obsidian mulberry silk crepe asymmetric twisted midi dress in fluid motion, golden rim light on black'
    },
    {
      id: 'sovereign-wave-blazer',
      name: 'Sovereign Wave-Ruffle Tailored Blazer',
      short: 'Sovereign Wave-Ruffle Blazer',
      tabs: ['Tailoring'], collection: 'Architectural Tailoring',
      price: 135000, edition: 20, remaining: 12, kind: 'blazer', sizing: 'apparel', soldOut: [], hollow: 64,
      summary: 'Alabaster Silk, a wave-ruffle peplum hem, satin peak lapels and an interior woven damask wordmark label.',
      provenance: 'Cut, canvassed and pressed by hand in the Colombo atelier',
      story: 'Architectural tailoring with a soft edge: a nipped waist, satin peak lapels, and a peplum that breaks into a hand-shaped wave. Inside the collar sits the woven damask label that bears only the MANTHAI wordmark.',
      materials: 'Alabaster Silk, horsehair canvas, satin peak lapels, wave-ruffle peplum, woven damask neck label.',
      care: 'Brush gently with a soft garment brush. Steam the peplum on the reverse to keep its wave.',
      palette: ['#2a2018', '#0b0b0c', '#C5A059'],
      occasions: ['Day-to-Evening Statement'], fit: 1, pairs: ['mantai-silk-trouser', 'meridian-silk-shirt'],
      media: { form: '', back: '', detail: '', move: '' },
      prompt: 'Alabaster Silk tailored blazer with a wave-ruffle peplum hem and satin peak lapels, soft window light, editorial womenswear'
    },
    {
      id: 'kotiya-noir-mini',
      name: 'Kotiya Noir Scarf-Neck Tailored Mini Dress',
      short: 'Kotiya Noir Scarf-Neck Mini',
      tabs: ['Midi & Cocktail'], collection: 'Sculpted Dresses',
      price: 112000, edition: 25, remaining: 15, kind: 'mini', sizing: 'apparel', soldOut: [], hollow: 84,
      summary: 'Obsidian wool-silk crepe tailored mini with a detachable silk scarf at the neck.',
      provenance: 'Tailored and hand-finished in the Colombo atelier',
      story: 'A sharply cut mini in obsidian wool-silk crepe, finished at the neck with a detachable silk scarf that can be tied, draped or worn loose.',
      materials: 'Obsidian wool-silk crepe, silk lining, detachable Alabaster silk scarf.',
      care: 'Steam on the reverse. Dry clean the dress and scarf separately.',
      palette: ['#151517', '#0b0b0c', '#C5A059'],
      occasions: ['Private Cocktail', 'Day-to-Evening Statement'], fit: 0.8, pairs: ['sovereign-wave-blazer', 'mannar-pearl-cape'],
      media: { form: '', back: '', detail: '', move: '' },
      prompt: 'Obsidian wool-silk crepe tailored mini dress with an ivory silk scarf at the neck, dramatic chiaroscuro'
    },
    {
      id: 'mannar-pearl-cape',
      name: 'Mannar Pearl Sheer Lace Atelier Cape',
      short: 'Mannar Pearl Lace Cape',
      tabs: ['Tailoring', 'Limited Atelier'], collection: 'Atelier Limited Edition',
      price: 74000, edition: 10, remaining: 9, kind: 'cape', sizing: 'apparel', soldOut: [], hollow: 112,
      summary: 'Champagne-ivory sheer lace, a scalloped hem and a single hand-set gold hook closure at the neck.',
      provenance: 'Cut and scalloped by hand in the Colombo atelier',
      story: 'Light as breath and long enough to move with the walk. The lace is cut so its scalloped edge falls along the hem, and one gold hook closes the neck.',
      materials: 'Champagne-ivory sheer lace, silk organza facing, gold-plated hook closure.',
      care: 'Lace snags easily: remove rings and jewellery when wearing. Steam on the reverse at a distance.',
      palette: ['#16110a', '#0b0b0c', '#C5A059'],
      occasions: ['Modern Bridal & Reception', 'Gala & Black Tie'], fit: 1, pairs: ['serendib-column', 'ceylon-rosette-mullet'],
      media: { form: '', back: '', detail: '', move: '' },
      prompt: 'Champagne-ivory sheer lace atelier cape with a scalloped hem and a gold hook closure, soft backlight'
    },
    {
      id: 'meridian-silk-shirt',
      name: 'Meridian Silk Charmeuse Column Shirt',
      short: 'Meridian Silk Charmeuse Shirt',
      tabs: ['Silk Separates'], collection: 'Silk Separates',
      price: 86000, edition: 0, remaining: 24, kind: 'shirt', sizing: 'apparel', soldOut: [], hollow: 72,
      summary: 'Champagne silk charmeuse, an elongated column shirt with a hidden placket and hand-rolled cuffs.',
      provenance: 'Cut on the grain and hand-finished in the Colombo atelier',
      story: 'A shirt cut long and clean, so it can be worn loose over the silk trouser or tucked into tailoring. The placket is hidden, the cuffs are rolled by hand, and the silk falls straight from the shoulder.',
      materials: 'Champagne mulberry silk charmeuse, hidden mother-of-pearl buttons, hand-rolled cuffs and hem.',
      care: 'Silk charmeuse waterspots: keep dry and blot at once. Steam on the reverse at a distance.',
      palette: ['#2a2018', '#0b0b0c', '#C5A059'],
      occasions: ['Day-to-Evening Statement', 'Private Cocktail'], fit: 1.2, pairs: ['mantai-silk-trouser', 'sovereign-wave-blazer'],
      media: { form: '', back: '', detail: '', move: '' },
      prompt: 'Champagne silk charmeuse elongated column shirt with a hidden placket, liquid sheen, soft window light, editorial womenswear'
    },
    {
      id: 'mantai-silk-trouser',
      name: 'Mantai Wide-Leg Liquid Silk Trouser',
      short: 'Mantai Wide-Leg Silk Trouser',
      tabs: ['Silk Separates'], collection: 'Silk Separates',
      price: 92000, edition: 0, remaining: 24, kind: 'trouser', sizing: 'apparel', soldOut: [], hollow: 128,
      summary: 'Obsidian heavy silk crepe, a high sculpted waist and a wide leg that moves like a long skirt.',
      provenance: 'Pleated and hand-finished in the Colombo atelier',
      story: 'Two soft pleats at a high, sculpted waistband release into a wide leg that falls to the floor. In movement it reads as a long skirt; standing still it is pure line.',
      materials: 'Obsidian heavy silk crepe, silk-lined waistband, concealed side closure, hand-finished hem.',
      care: 'Hang by the waistband on a padded clip hanger. Steam on the reverse; never press the pleats flat.',
      palette: ['#26262a', '#0b0b0c', '#C5A059'],
      occasions: ['Day-to-Evening Statement', 'Private Cocktail'], fit: 0.9, pairs: ['meridian-silk-shirt', 'sovereign-wave-blazer'],
      media: { form: '', back: '', detail: '', move: '' },
      prompt: 'Obsidian heavy silk crepe wide-leg trouser with a high sculpted waist, fluid motion, golden rim light on black'
    }
  ];

  /* ---------- Navigation: four items. Only Collections opens the Atelier Panel. ----------
     actions: filter:<tab>  occasion:<name>  product:<id>  stylist  fitting  salon  film  anchor:<id>  info:<key>  seal */
  M.NAV = [
    { key: 'new', label: 'New Arrivals', action: 'filter:All' },
    { key: 'collections', label: 'Collections', title: 'Ladies apparel, cut in the Colombo atelier.',
      product: 'ceylon-rosette-mullet', image: 'Ceylon Rosette Mullet Gown',
      groups: [
        { title: 'Categories', links: [
          { label: 'Evening & Gala Gowns', action: 'filter:Evening Gowns' },
          { label: 'Sculpted Dresses', action: 'filter:Midi & Cocktail' },
          { label: 'Architectural Tailoring', action: 'filter:Tailoring' },
          { label: 'Silk Separates', action: 'filter:Silk Separates' },
          { label: 'Atelier Limited Editions', action: 'filter:Limited Atelier' }
        ] },
        { title: 'By occasion', links: [
          { label: 'Gala & Black Tie', action: 'occasion:Gala & Black Tie' },
          { label: 'Private Cocktail', action: 'occasion:Private Cocktail' },
          { label: 'Modern Bridal & Reception', action: 'occasion:Modern Bridal & Reception' },
          { label: 'Day-to-Evening Statement', action: 'occasion:Day-to-Evening Statement' }
        ] }
      ] },
    { key: 'lookbook', label: 'Lookbook', action: 'anchor:campaign' },
    { key: 'maison', label: 'The Maison', action: 'anchor:maison' }
  ];

  /* ---------- Editorial pillars (60/40 category showcase) ---------- */
  M.PILLARS = [
    { title: 'Sculpted Evening Silhouettes', text: 'Gowns built on the stand for the grandest rooms: boned, folded and hand-set.', product: 'ceylon-rosette-mullet', action: 'filter:Evening Gowns', link: 'Explore evening gowns' },
    { title: 'Architectural Tailoring & Co-ords', text: 'Nipped waists, peaked lapels and silk separates that answer each other.', product: 'sovereign-wave-blazer', action: 'filter:Tailoring', link: 'Explore tailoring' },
    { title: 'Hand-Finished Wearable Art', text: 'Painted, beaded and scalloped by hand in numbered atelier editions.', product: 'alstroemeria-gown', action: 'filter:Limited Atelier', link: 'Explore limited editions' }
  ];

  /* ---------- The Unbounded Spiral Seal: the four meanings shown in the decoder (group ids in index.html) ---------- */
  M.SEAL_PARTS = [
    { key: 'core', title: 'The Origin Thread', group: 'spiral-core',
      text: 'Rooted in the logarithmic curve mathematician Jakob Bernoulli named Spira Mirabilis \u2014 \u201cThough changed, I shall arise the same\u201d \u2014 this unbroken central coil embodies the single thread of craft discipline that anchors every MANTHAI silhouette, however boldly the house evolves.' },
    { key: 'foundation', title: 'Chambers of Mastery', group: 'chambers-foundation',
      text: 'Like nature\u2019s chambered shells that perfect each space before expanding into the next, these foundational arcs represent quiet atelier patience \u2014 textile curation, structural pattern work, and finishing built to outlive seasonal noise.' },
    { key: 'crescendo', title: 'The Crescendo', group: 'chambers-crescendo',
      text: 'Rising progressively wider in measured proportion, the upper chambers express sculptural volume, architectural pleating, and a house that refuses stagnation \u2014 outgrowing yesterday\u2019s ceiling with every collection.' },
    { key: 'arch', title: 'The Unbounded Horizon', group: 'unbounded-arch',
      text: 'Deliberately open rather than closed into a circle, the sweeping outer arch flows like liquid silk in motion \u2014 declaring our founding conviction that true fashion has no cage, no border, and no final limit.' }
  ];

  /* ---------- Lookbook stills (campaign media slots) ---------- */
  M.LOOKBOOK = [
    { id: 'emporium', title: 'The Great Emporium', filter: 'Evening Gowns', kind: 'courtyard',
      caption: 'Two gowns in a sandstone courtyard at sunset.',
      prompt: 'Ultra-luxury Parisian-Ceylonese haute couture campaign film still, dramatic chiaroscuro warm golden sunset beam inside a minimalist dark architectural travertine pavilion, two poised South Asian and international high-fashion women wearing a hand-painted floral silk-velvet sculpted evening gown and a black silk column gown, fluid fabric motion, 35mm anamorphic film grain, Vogue Italia editorial aesthetic, obsidian black, alabaster ivory, burnished antique gold, deep garnet' },
    { id: 'studio', title: 'Sculpted Tailoring', filter: 'Tailoring', kind: 'studio',
      caption: 'The wave-ruffle blazer on the stand, with a lace cape laid over the arm.',
      prompt: 'Museum-grade luxury womenswear photography, an Alabaster Silk wave-ruffle peplum blazer with satin peak lapels on a dress form, a champagne-ivory sheer lace cape draped over the arm, dark wet basalt floor, subtle golden rim lighting, razor-sharp macro focus' },
    { id: 'atelier', title: 'The Atelier', filter: 'Limited Atelier', kind: 'table',
      caption: 'A couturier’s hands painting gold Alstroemeria onto ivory velvet.',
      prompt: 'Intimate editorial close-up of a master couturier’s hands delicately painting metallic gold and soft Alstroemeria petals onto ivory silk velvet with a fine sable brush on a sunlit wooden atelier table, antique brass scissors and tiny glass beads beside the fabric, warm chiaroscuro shadows' },
    { id: 'label', title: 'The Label', filter: 'Tailoring', kind: 'damask',
      caption: 'The woven damask neck label, bearing only the MANTHAI wordmark.',
      prompt: 'Extreme macro light sweep across a black woven damask label revealing the gold MANTHAI wordmark, deep obsidian silk folds' }
  ];

  /* ---------- Unboxing and authenticity ritual: four objects ----------
     parts = which drawn objects light up in the exploded view */
  M.RITUAL = [
    { id: 'box',     name: 'Rigid Linen Apparel Box', spec: 'Matte black linen, 2.5 mm board', parts: ['box', 'seal'],
      text: 'A rigid apparel box wrapped in matte black linen and stamped in burnished gold with the Unbounded Spiral Seal and the MANTHAI wordmark. It closes on hidden magnets, and it is made to be kept.' },
    { id: 'garment', name: 'Couture Garment Bag and Tissue', spec: 'Breathable cotton, acid-free tissue', parts: ['garment'],
      text: 'Your piece rests inside a breathable cotton garment bag, folded in acid-free Alabaster tissue and sealed with a small gold wafer bearing the Seal. Keep the bag: it is how the piece should always be stored.' },
    { id: 'label',   name: 'Woven Silk-Damask Neck Label', spec: '65 mm × 24 mm', parts: ['label'],
      text: 'Every garment carries a woven silk-damask neck label, tack-stitched at all four corners. It bears only the MANTHAI wordmark, with no emblem and no other text.' },
    { id: 'card',    name: 'Story Card and Verification Card', spec: 'Thick cotton, micro-foil seal', parts: ['card'],
      text: 'A thick cotton Story Card tells the provenance of your piece. Beside it, a micro-foil Verification Card carries the embossed Seal, your unique edition number and an NFC and QR link to the authenticity record.' }
  ];

  /* ---------- Short policy texts for the footer info layer ---------- */
  M.INFO = {
    delivery: { title: 'Delivery and duties',
      body: ['Complimentary white-glove insured delivery in Colombo, usually within two working days. A Maison courier brings the piece to you and waits while you open it.',
             'Islandwide insured courier across Sri Lanka, usually within four working days, also complimentary. You may also collect from the Colombo atelier.',
             'International orders travel by DHL Express, delivered duty paid (DDP). All duties and taxes are included in the price you see at checkout, so nothing is collected at your door.',
             'Delivery is always complimentary. Every order is prepaid by card, LankaQR or bank transfer; cash on delivery is not offered.'] },
    care: { title: 'Care and repair',
      body: ['Every piece comes with care notes on its Story Card. The atelier in Colombo repairs and refreshes MANTHAI pieces for life.',
             'Scan the NFC tag inside your piece to open its Digital Product Passport and request care at any time.'] },
    privacy: { title: 'Privacy',
      body: ['This storefront stores your bag, currency and Private Circle details in your own browser. Sign-in is handled by Google Firebase Authentication; orders are not sent to a server in this build.',
             'Draft text. Final policy wording is to be confirmed before launch.'] },
    terms: { title: 'Terms of sale',
      body: ['Prices are shown in your chosen currency at an indicative rate and are charged as confirmed at checkout.',
             'Draft text. Final terms are to be confirmed before launch.'] }
  };
})();
