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
    /* Google Identity Services client id. Empty means the Salon sign-in runs in demo mode. */
    googleClientId: '487193961323-hlfr6d51tmkjettelvsvubibkabvpqm9.apps.googleusercontent.com',
    /* Firebase web app config (Firebase console, Project settings, General, Your apps). Public values, safe to commit.
       When set, the Private Salon uses Firebase Authentication for Google and email-link sign-in and real accounts. */
    firebase: null,
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

  /* ---------- Collection filter tabs (Phase 1: womenswear only) ---------- */
  M.TABS = ['All', 'Atelier Couture', 'Evening & Gowns', 'Midi & Occasion', 'Tailoring & Capes'];

  /* ---------- Fit information ---------- */
  M.FITTING = 'Private Colombo Atelier Fitting';
  M.MODEL = { height: '173 cm (5’8″)', size: 'S' };
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
      tabs: ['Atelier Couture', 'Evening & Gowns'], collection: 'Atelier Couture',
      price: 295000, edition: 12, remaining: 10, kind: 'gown', sizing: 'apparel', soldOut: ['XL'], hollow: 146,
      summary: 'Hand-painted Alstroemeria silk-velvet bodice, sculptural asymmetric drape, 48 artisan hours of hand beadwork.',
      provenance: '48 artisan hours, hand-painted and beaded in the Colombo atelier',
      story: 'Every Alstroemeria petal is painted by hand onto the silk-velvet before the bodice is cut, so no two gowns carry the same bloom. Glass beads are then set one at a time along the asymmetric drape.',
      materials: 'Silk-velvet bodice hand-painted with metallic gold and mineral pigment. Silk crepe drape. Hand-set glass beadwork. Concealed corsetry.',
      care: 'Painted pigment and beadwork are fragile. Steam only on the reverse and never press. Store hanging in the supplied cotton garment bag.',
      palette: ['#4A121C', '#1b0508', '#C5A059'],
      media: { form: '', back: '', detail: '', move: '' },
      prompt: 'Hand-painted Alstroemeria silk-velvet sculpted evening gown, fluid fabric motion, brushwork and beadwork shimmer, 35mm anamorphic film grain, chiaroscuro golden light'
    },
    {
      id: 'ceylon-rosette-mullet',
      name: 'Ceylon Rosette 3D Sculpted Mullet Gown',
      short: 'Ceylon Rosette Mullet Gown',
      tabs: ['Evening & Gowns'], collection: 'Evening & Gowns',
      price: 245000, edition: 15, remaining: 11, kind: 'mullet', sizing: 'apparel', soldOut: [], hollow: 150,
      summary: 'Alabaster Silk, three-dimensional hand-sculpted silk rosettes and a cathedral train, short at the front and long behind.',
      provenance: 'Rosettes folded and stitched by hand in the Colombo atelier',
      story: 'Each rosette is folded from a single length of Alabaster Silk and stitched petal by petal, then set along the bodice and down the train. The hem lifts at the front and falls behind in a sweeping train.',
      materials: 'Alabaster Silk, hand-sculpted three-dimensional silk rosettes, boned bodice, silk-lined train.',
      care: 'Keep rosettes uncrushed: store the gown hanging with the train supported in tissue. Steam on the reverse only.',
      palette: ['#2a2018', '#0b0b0c', '#C5A059'],
      media: { form: '', back: '', detail: '', move: '' },
      prompt: 'Alabaster Silk mullet evening gown with three-dimensional sculpted silk rosettes and a sweeping train, chiaroscuro golden light, 35mm anamorphic film grain'
    },
    {
      id: 'serendib-column',
      name: 'Serendib Strapless Bow-Sculpted Column Gown',
      short: 'Serendib Bow Column Gown',
      tabs: ['Evening & Gowns'], collection: 'Evening & Gowns',
      price: 215000, edition: 15, remaining: 12, kind: 'column', sizing: 'apparel', soldOut: [], hollow: 144,
      summary: 'Mannar Pearl duchesse satin, strapless sculpted column, with an architectural origami bow across the back.',
      provenance: 'Cut, boned and folded by hand in the Colombo atelier',
      story: 'A single clean line from neckline to floor, held by internal boning, with the one flourish saved for the back: an origami bow folded from the same duchesse satin.',
      materials: 'Mannar Pearl duchesse satin, internal boning, silk lining, hand-folded origami bow.',
      care: 'Duchesse satin marks easily: blot, never rub. Steam on the reverse. Store hanging in the supplied garment bag.',
      palette: ['#2a2018', '#0b0b0c', '#C5A059'],
      media: { form: '', back: '', detail: '', move: '' },
      prompt: 'Strapless Mannar Pearl duchesse satin column gown with a sculpted origami back bow, museum-quality fashion photography, warm chiaroscuro'
    },
    {
      id: 'mahatittha-lace-midi',
      name: 'Mahatittha Draped Garnet Lace Midi Dress',
      short: 'Mahatittha Garnet Lace Midi',
      tabs: ['Midi & Occasion'], collection: 'Midi & Occasion',
      price: 148000, edition: 20, remaining: 14, kind: 'lace', sizing: 'apparel', soldOut: [], hollow: 118,
      summary: 'Deep Garnet Velvet draped lace, architectural twisted waist, concealed silk lining.',
      provenance: 'Draped and finished by hand in the Colombo atelier',
      story: 'Named for the Great Emporium, the dress twists once at the waist and falls in a single sculpted line, lace over velvet the colour of Mantai garnet.',
      materials: 'Garnet velvet, corded lace, concealed silk lining, hand-finished seams.',
      care: 'Steam lace on the reverse, never press. Rest the dress for a day between wears.',
      palette: ['#4A121C', '#240709', '#8a2a3a'],
      media: { form: '', back: '', detail: '', move: '' },
      prompt: 'Deep garnet velvet draped lace midi dress with an architectural twisted waist, warm chiaroscuro'
    },
    {
      id: 'anuradhapura-silk-midi',
      name: 'Anuradhapura Asymmetric Twisted Silk Midi',
      short: 'Anuradhapura Twisted Silk Midi',
      tabs: ['Midi & Occasion'], collection: 'Midi & Occasion',
      price: 128000, edition: 18, remaining: 13, kind: 'silkmidi', sizing: 'apparel', soldOut: [], hollow: 112,
      summary: 'Liquid Obsidian mulberry silk crepe, a single twisted drape at the hip and an asymmetric hem.',
      provenance: 'Draped on the stand and hand-finished in the Colombo atelier',
      story: 'The silk is draped directly on the stand and twisted once at the hip, so the hem rises on one side and falls on the other. It moves like dark water.',
      materials: 'Liquid Obsidian heavy mulberry silk crepe, silk lining, hand-rolled hem.',
      care: 'Mulberry silk waterspots: keep dry and blot at once. Steam on the reverse.',
      palette: ['#26262a', '#0b0b0c', '#C5A059'],
      media: { form: '', back: '', detail: '', move: '' },
      prompt: 'Liquid obsidian mulberry silk crepe asymmetric twisted midi dress in fluid motion, golden rim light on black'
    },
    {
      id: 'sovereign-wave-blazer',
      name: 'Sovereign Wave-Ruffle Tailored Blazer',
      short: 'Sovereign Wave-Ruffle Blazer',
      tabs: ['Tailoring & Capes'], collection: 'Tailoring & Capes',
      price: 135000, edition: 20, remaining: 12, kind: 'blazer', sizing: 'apparel', soldOut: [], hollow: 64,
      summary: 'Alabaster Silk, a wave-ruffle peplum hem, satin peak lapels and an interior woven damask wordmark label.',
      provenance: 'Cut, canvassed and pressed by hand in the Colombo atelier',
      story: 'Architectural tailoring with a soft edge: a nipped waist, satin peak lapels, and a peplum that breaks into a hand-shaped wave. Inside the collar sits the woven damask label that bears only the MANTHAI wordmark.',
      materials: 'Alabaster Silk, horsehair canvas, satin peak lapels, wave-ruffle peplum, woven damask neck label.',
      care: 'Brush gently with a soft garment brush. Steam the peplum on the reverse to keep its wave.',
      palette: ['#2a2018', '#0b0b0c', '#C5A059'],
      media: { form: '', back: '', detail: '', move: '' },
      prompt: 'Alabaster Silk tailored blazer with a wave-ruffle peplum hem and satin peak lapels, soft window light, editorial womenswear'
    },
    {
      id: 'kotiya-noir-mini',
      name: 'Kotiya Noir Scarf-Neck Tailored Mini Dress',
      short: 'Kotiya Noir Scarf-Neck Mini',
      tabs: ['Midi & Occasion'], collection: 'Midi & Occasion',
      price: 112000, edition: 25, remaining: 15, kind: 'mini', sizing: 'apparel', soldOut: [], hollow: 84,
      summary: 'Obsidian wool-silk crepe tailored mini with a detachable Ceylon Emerald silk scarf at the neck.',
      provenance: 'Tailored and hand-finished in the Colombo atelier',
      story: 'A sharply cut mini in obsidian wool-silk crepe, finished at the neck with a detachable silk scarf that can be tied, draped or worn loose.',
      materials: 'Obsidian wool-silk crepe, silk lining, detachable Ceylon Emerald silk scarf.',
      care: 'Steam on the reverse. Dry clean the dress and scarf separately.',
      palette: ['#151517', '#0b0b0c', '#C5A059'],
      media: { form: '', back: '', detail: '', move: '' },
      prompt: 'Obsidian wool-silk crepe tailored mini dress with an emerald silk scarf at the neck, dramatic chiaroscuro'
    },
    {
      id: 'mannar-pearl-cape',
      name: 'Mannar Pearl Sheer Lace Atelier Cape',
      short: 'Mannar Pearl Lace Cape',
      tabs: ['Tailoring & Capes'], collection: 'Tailoring & Capes',
      price: 74000, edition: 10, remaining: 9, kind: 'cape', sizing: 'apparel', soldOut: [], hollow: 112,
      summary: 'Champagne-ivory sheer lace, a scalloped hem and a single hand-set gold hook closure at the neck.',
      provenance: 'Cut and scalloped by hand in the Colombo atelier',
      story: 'Light as breath and long enough to move with the walk. The lace is cut so its scalloped edge falls along the hem, and one gold hook closes the neck.',
      materials: 'Champagne-ivory sheer lace, silk organza facing, gold-plated hook closure.',
      care: 'Lace snags easily: remove rings and jewellery when wearing. Steam on the reverse at a distance.',
      palette: ['#16110a', '#0b0b0c', '#C5A059'],
      media: { form: '', back: '', detail: '', move: '' },
      prompt: 'Champagne-ivory sheer lace atelier cape with a scalloped hem and a gold hook closure, soft backlight'
    }
  ];

  /* ---------- Navigation: 6 womenswear items ----------
     actions: filter:<tab>  product:<id>  stylist  fitting  salon  film  anchor:<id>  info:<key> */
  M.NAV = [
    { key: 'couture', label: 'Atelier Couture', title: 'Hand-painted, hand-beaded, made once.',
      tone: ['#4A121C', '#1b0508'], product: 'alstroemeria-gown', kind: 'gown', image: 'Alstroemeria Velvet Couture Gown',
      links: [
        { label: 'Hand-Painted Wearable Art', action: 'filter:Atelier Couture' },
        { label: 'Evening Gala', action: 'filter:Evening & Gowns' },
        { label: 'Cocktail & Reception', action: 'filter:Midi & Occasion' },
        { label: 'Sculpted Tailoring', action: 'filter:Tailoring & Capes' },
        { label: 'Private Colombo Atelier Fitting', action: 'fitting' }
      ] },
    { key: 'evening', label: 'Evening & Gowns', title: 'Gowns sculpted for the grandest rooms.',
      tone: ['#2a2018', '#0b0b0c'], product: 'ceylon-rosette-mullet', kind: 'mullet', image: 'Ceylon Rosette Mullet Gown',
      links: [
        { label: 'All evening gowns', action: 'filter:Evening & Gowns' },
        { label: 'The Alstroemeria Gown', action: 'product:alstroemeria-gown' },
        { label: 'Ceylon Rosette Mullet Gown', action: 'product:ceylon-rosette-mullet' },
        { label: 'Serendib Bow Column Gown', action: 'product:serendib-column' }
      ] },
    { key: 'midi', label: 'Midi & Occasion', title: 'Dresses cut for the room after dark.',
      tone: ['#4A121C', '#240709'], product: 'mahatittha-lace-midi', kind: 'lace', image: 'Mahatittha Garnet Lace Midi',
      links: [
        { label: 'All midi and occasion', action: 'filter:Midi & Occasion' },
        { label: 'Mahatittha Garnet Lace Midi', action: 'product:mahatittha-lace-midi' },
        { label: 'Anuradhapura Twisted Silk Midi', action: 'product:anuradhapura-silk-midi' },
        { label: 'Kotiya Noir Scarf-Neck Mini', action: 'product:kotiya-noir-mini' }
      ] },
    { key: 'tailoring', label: 'Tailoring & Capes', title: 'Architecture for the shoulders.',
      tone: ['#2a2018', '#0b0b0c'], product: 'sovereign-wave-blazer', kind: 'blazer', image: 'Sovereign Wave-Ruffle Blazer',
      links: [
        { label: 'All tailoring and capes', action: 'filter:Tailoring & Capes' },
        { label: 'Sovereign Wave-Ruffle Blazer', action: 'product:sovereign-wave-blazer' },
        { label: 'Mannar Pearl Lace Cape', action: 'product:mannar-pearl-cape' },
        { label: 'Book a private fitting', action: 'fitting' }
      ] },
    { key: 'lookbook', label: 'Lookbook', title: 'The House in four chapters of light.',
      tone: ['#26262a', '#0b0b0c'], product: 'anuradhapura-silk-midi', view: 'move', kind: 'silkmidi', image: 'Anuradhapura Twisted Silk Midi, in motion',
      links: [
        { label: 'The campaign stills', action: 'anchor:campaign' },
        { label: 'Watch the Atelier Film', action: 'film' },
        { label: 'The unboxing ritual', action: 'anchor:ritual' },
        { label: 'Speak with a Maison Stylist', action: 'stylist' }
      ] },
    { key: 'maison', label: 'The Maison', title: 'Born where empires traded beauty.',
      tone: ['#151517', '#0B0B0C'], kind: 'crest', image: 'The crest of the House',
      links: [
        { label: 'Our origin', action: 'anchor:maison' },
        { label: 'The Hidden Sun & Moon Cipher', action: 'cipher' },
        { label: 'The evolution of the House', action: 'anchor:metiers' },
        { label: 'The Private Salon', action: 'salon' }
      ] }
  ];

  /* ---------- Lookbook stills (campaign media slots) ---------- */
  M.LOOKBOOK = [
    { id: 'emporium', title: 'The Great Emporium', filter: 'Evening & Gowns', kind: 'courtyard',
      caption: 'Two gowns in a sandstone courtyard at sunset.',
      prompt: 'Ultra-luxury Parisian-Ceylonese haute couture campaign film still, dramatic chiaroscuro warm golden sunset beam inside a minimalist dark architectural travertine pavilion, two poised South Asian and international high-fashion women wearing a hand-painted floral silk-velvet sculpted evening gown and a black silk column gown, fluid fabric motion, 35mm anamorphic film grain, Vogue Italia editorial aesthetic, obsidian black, alabaster ivory, burnished antique gold, deep garnet' },
    { id: 'studio', title: 'Sculpted Tailoring', filter: 'Tailoring & Capes', kind: 'studio',
      caption: 'The wave-ruffle blazer on the stand, with a lace cape laid over the arm.',
      prompt: 'Museum-grade luxury womenswear photography, an Alabaster Silk wave-ruffle peplum blazer with satin peak lapels on a dress form, a champagne-ivory sheer lace cape draped over the arm, dark wet basalt floor, subtle golden rim lighting, razor-sharp macro focus' },
    { id: 'atelier', title: 'The Atelier', filter: 'Atelier Couture', kind: 'table',
      caption: 'A couturier’s hands painting gold Alstroemeria onto ivory velvet.',
      prompt: 'Intimate editorial close-up of a master couturier’s hands delicately painting metallic gold and soft Alstroemeria petals onto ivory silk velvet with a fine sable brush on a sunlit wooden atelier table, antique brass scissors and tiny glass beads beside the fabric, warm chiaroscuro shadows' },
    { id: 'label', title: 'The Label', filter: 'Tailoring & Capes', kind: 'damask',
      caption: 'The woven damask neck label, bearing only the MANTHAI wordmark.',
      prompt: 'Extreme macro light sweep across a black woven damask label revealing the gold MANTHAI wordmark, deep obsidian silk folds' }
  ];

  /* ---------- Unboxing ritual, apparel edition: four objects ----------
     parts = which drawn objects light up in the exploded view */
  M.RITUAL = [
    { id: 'box',     name: 'Rigid Magnetic Apparel Box', spec: '2.5 mm Obsidian', parts: ['box', 'ribbon', 'crest'],
      text: 'A 2.5 mm Obsidian rigid magnetic apparel box, wrapped in soft-touch linen. The lid carries a Tier 1 gold-foiled, embossed crest and is tied with a Ceylon Emerald grosgrain ribbon. It closes on hidden magnets with a soft, deliberate sound, and it is made to be kept.' },
    { id: 'garment', name: 'Couture Garment Bag and Tissue', spec: 'Breathable cotton, acid-free silk tissue', parts: ['garment'],
      text: 'Your piece rests inside a Breathable Couture Cotton Garment Bag, folded in acid-free Alabaster Silk tissue and sealed with a Sovereign Gold emblem wafer. Keep the bag: it is how the piece should always be stored.' },
    { id: 'card',    name: 'Story Card', spec: '32 pt Gold-Gilded Uncoated Cotton', parts: ['card'],
      text: 'A heavy 32 pt Gold-Gilded Uncoated Cotton Story Card. It carries the provenance of your edition, links to your NFC Digital Product Passport, and holds the secret of the Sun, the Moon and the Mannar Pearl.' },
    { id: 'label',   name: 'Woven Damask Neck Label', spec: '65 mm × 24 mm', parts: ['label'],
      text: 'A 65 mm × 24 mm woven damask neck label, tack-stitched at all four corners, that bears only the 100% monochrome MANTHAI wordmark. No emblem and no other text appears on it.' }
  ];

  /* ---------- Future Métiers: the evolution of the House ---------- */
  M.METIERS = [
    { id: 'present', chapter: 'Chapter I', title: 'Present Collection', sub: 'Womenswear & Wearable Art Couture',
      text: 'Hand-painted velvet, sculpted eveningwear and architectural tailoring, made in the Colombo atelier.',
      badge: 'NOW AVAILABLE', cta: 'Explore the Collection', action: 'scroll-collection' },
    { id: 'next', chapter: 'Chapter II', title: 'Next Unveiling', sub: 'Architectural Menswear Tailoring',
      text: 'The same sovereign cut, drawn for the shoulder and the stride. Shown first to those on the list.',
      badge: 'IN THE ATELIER', cta: 'Request Private Preview', interest: 'Chapter II: Architectural Menswear Tailoring' },
    { id: 'future', chapter: 'Chapter III', title: 'Future Métiers', sub: 'Leather Goods & Haute Parfumerie',
      text: 'Calfskin handbags with solid brass Twin-Leopard hardware, and Mantai extrait de parfum.',
      badge: 'IN DEVELOPMENT', cta: 'Join Private Archive List', interest: 'Chapter III: Leather Goods & Haute Parfumerie' }
  ];

  /* ---------- Short policy texts for the footer info layer ---------- */
  M.INFO = {
    delivery: { title: 'Delivery and duties',
      body: ['Complimentary white-glove insured delivery across Sri Lanka. A Maison courier brings the piece to you and waits while you open it.',
             'International orders travel by DHL Express, delivered duty paid (DDP). All duties and taxes are included in the price you see at checkout, so nothing is collected at your door.',
             'Delivery is always free. Every order is prepaid; cash on delivery is not offered.'] },
    care: { title: 'Care and repair',
      body: ['Every piece comes with care notes on its Story Card. The atelier in Colombo repairs and refreshes MANTHAI pieces for life.',
             'Scan the NFC tag inside your piece to open its Digital Product Passport and request care at any time.'] },
    privacy: { title: 'Privacy',
      body: ['This storefront stores your bag, currency and Private Salon details only in your own browser. Nothing is sent to a server in this build.',
             'Draft text. Final policy wording is to be confirmed before launch.'] },
    terms: { title: 'Terms of sale',
      body: ['Prices are shown in your chosen currency at an indicative rate and are charged as confirmed at checkout.',
             'Draft text. Final terms are to be confirmed before launch.'] }
  };
})();
