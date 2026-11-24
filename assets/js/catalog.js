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
    googleClientId: '',
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

  /* ---------- Collection filter tabs ---------- */
  M.TABS = ['All', 'Atelier Couture', 'Women', 'Men', 'Leather & Bags', 'Haute Parfumerie'];

  /* ---------- Catalogue ----------
     media: drop real photography paths here. Any non-empty value replaces the atmospheric placeholder.
       form   = hero product still, 4:5 portrait
       move   = human-model movement shot
       detail = macro textile or hardware detail
     prompt fields are the director's prompts for generating each asset. */
  M.PRODUCTS = [
    {
      id: 'alstroemeria-gown',
      name: 'Alstroemeria Hand-Painted Velvet Couture Gown',
      short: 'Alstroemeria Velvet Couture Gown',
      tabs: ['Atelier Couture', 'Women'], collection: 'Atelier Couture',
      price: 285000, edition: 12, remaining: 2, kind: 'gown', sizing: 'apparel', bespoke: true, soldOut: ['XL'],
      summary: 'Hand-painted floral silk-velvet bodice, sculptural asymmetric drape, 48 hours of hand beadwork.',
      provenance: '48 hours hand-painted and beaded in the Colombo atelier',
      story: 'Every Alstroemeria petal is painted by hand onto the silk-velvet before the bodice is cut, so no two gowns carry the same bloom. Glass beads are set one at a time along the asymmetric drape.',
      materials: 'Silk-velvet bodice, hand-painted with metallic gold and mineral pigment. Silk crepe drape. Hand-set glass beadwork. Concealed corsetry.',
      care: 'Dry clean by a couture specialist only. Store hanging in the supplied cotton garment bag.',
      palette: ['#4A121C', '#1b0508', '#C5A059'],
      media: { form: '', move: '', detail: '' },
      prompt: 'Hand-painted floral silk-velvet sculpted evening gown, fluid fabric motion, 35mm anamorphic film grain, chiaroscuro golden light'
    },
    {
      id: 'mahatittha-lace-midi',
      name: 'Mahatittha Sculpted Garnet Lace Midi Dress',
      short: 'Mahatittha Garnet Lace Midi',
      tabs: ['Women'], collection: 'Women',
      price: 148000, edition: 20, remaining: 6, kind: 'lace', sizing: 'apparel', bespoke: true, soldOut: [],
      summary: 'Deep Garnet Velvet draped lace, architectural twisted waist, concealed silk lining.',
      provenance: 'Draped and finished by hand in the Colombo atelier',
      story: 'Named for the Great Emporium, the dress twists once at the waist and falls in a single sculpted line, lace over velvet the colour of Mantai garnet.',
      materials: 'Garnet velvet, corded lace, concealed silk lining, hand-finished seams.',
      care: 'Dry clean only. Rest the dress for a day between wears.',
      palette: ['#4A121C', '#240709', '#8a2a3a'],
      media: { form: '', move: '', detail: '' },
      prompt: 'Deep garnet velvet draped lace midi dress with an architectural twisted waist, warm chiaroscuro'
    },
    {
      id: 'sovereign-obsidian-blazer',
      name: 'Sovereign Obsidian Asymmetric Tailored Blazer',
      short: 'Sovereign Obsidian Blazer',
      tabs: ['Men'], collection: 'Men',
      price: 165000, edition: 15, remaining: 4, kind: 'blazer', sizing: 'apparel', bespoke: true, soldOut: [],
      summary: 'Super-150s structured midnight wool, satin peak lapels, interior woven damask Ira-Handa neck label.',
      provenance: 'Cut, canvassed and pressed by hand in the Colombo atelier',
      story: 'A razor-sharp asymmetric closure over structured midnight wool. Inside the collar sits the woven damask label that carries only the Hidden Sun and Moon wordmark.',
      materials: 'Super-150s midnight wool, satin peak lapels, horsehair canvas, woven damask neck label.',
      care: 'Dry clean only. Brush with a soft garment brush after wear.',
      palette: ['#151517', '#0B0B0C', '#C5A059'],
      media: { form: '', move: '', detail: '' },
      prompt: 'Razor-sharp obsidian black bespoke tailored blazer, satin peak lapels, dramatic chiaroscuro'
    },
    {
      id: 'ceylon-silk-evening-shirt',
      name: 'Ceylon Silk Ceremonial Evening Shirt',
      short: 'Ceylon Silk Evening Shirt',
      tabs: ['Men'], collection: 'Men',
      price: 68500, edition: null, remaining: 9, kind: 'shirt', sizing: 'apparel', bespoke: true, soldOut: [],
      summary: 'Pure heavy mulberry silk in Alabaster Ivory, concealed placket, mother-of-pearl buttons.',
      provenance: 'Cut and sewn by hand in the Colombo atelier',
      story: 'Heavy mulberry silk that holds its line and moves like water. The placket is concealed, so the front falls unbroken from collar to hem.',
      materials: 'Pure heavy mulberry silk, mother-of-pearl buttons, concealed placket.',
      care: 'Dry clean or hand wash cold. Steam, do not press directly.',
      palette: ['#EAE4D7', '#cfc6b3', '#C5A059'],
      media: { form: '', move: '', detail: '' },
      prompt: 'Alabaster ivory heavy mulberry silk shirt, concealed placket, soft sheen, window light'
    },
    {
      id: 'kotiya-top-handle',
      name: 'The Kotiya Structured Calfskin Top-Handle Bag',
      short: 'The Kotiya Top-Handle Bag',
      tabs: ['Leather & Bags'], collection: 'Leather & Bags',
      price: 245000, edition: null, remaining: 7, kind: 'bag', sizing: 'single', sizeLabel: 'One size', bespoke: false, soldOut: [],
      summary: 'Full-grain Obsidian calfskin, brushed Sovereign Gold brass Tier 2 Twin-Leopard clasp, Ceylon Emerald suede interior, embedded NFC chip.',
      provenance: 'Structured and stitched by hand in the Colombo atelier',
      story: 'The twin leopards of the crest guard the clasp, brushed by hand to a low burnish. Inside, Ceylon Emerald suede and an NFC heritage tag that proves where it was made.',
      materials: 'Full-grain obsidian calfskin, brushed brass hardware, Ceylon Emerald suede lining, embedded NFC chip.',
      care: 'Wipe with a dry cloth. Store stuffed, in the supplied dust bag, away from direct sun.',
      palette: ['#151517', '#0E3B2E', '#C5A059'],
      media: { form: '', move: '', detail: '' },
      prompt: 'Structured matte obsidian calfskin top-handle handbag with brushed antique gold architectural clasp on dark wet basalt'
    },
    {
      id: 'mannar-pearl-minaudiere',
      name: 'Mannar Pearl Sculpted Evening Minaudière',
      short: 'Mannar Pearl Minaudière',
      tabs: ['Leather & Bags'], collection: 'Leather & Bags',
      price: 135000, edition: null, remaining: 5, kind: 'mina', sizing: 'single', sizeLabel: 'One size', bespoke: false, soldOut: [],
      summary: 'Architectural ivory satin and brass frame, delicate detachable gold chain, blind-debossed interior stamp.',
      provenance: 'Framed in brass and wrapped by hand in the Colombo atelier',
      story: 'A small architectural object for the evening. The detachable gold chain lets it be carried, worn, or simply set down like a piece of jewellery.',
      materials: 'Ivory satin, brushed brass frame, detachable gold chain, blind-debossed interior stamp.',
      care: 'Keep dry. Wipe the frame with a soft cloth. Store in its box.',
      palette: ['#EAE4D7', '#d8cfbc', '#C5A059'],
      media: { form: '', move: '', detail: '' },
      prompt: 'Ivory satin evening minaudiere with a brass frame and delicate gold chain, museum product photography'
    },
    {
      id: 'mantai-525',
      name: 'Mantai 525 AD, Extrait de Parfum (100 ml)',
      short: 'Mantai 525 AD',
      tabs: ['Haute Parfumerie'], collection: 'Haute Parfumerie',
      price: 58000, edition: null, remaining: 14, kind: 'parfum', variant: 'amber', sizing: 'single', sizeLabel: '100 ml', bespoke: false, soldOut: [],
      summary: 'Notes of Ceylon sandalwood, smoked aloeswood, black cardamom, Mannar sea amber and crimson rose. Heavy crystal flacon with 65g magnetic Zamac cap.',
      provenance: 'Blended and filled by hand, Colombo atelier',
      story: 'A scent from the age of the Great Emporium: smoked aloeswood and sandalwood warmed by black cardamom, with a sea-amber depth and a single crimson rose.',
      materials: 'Extrait de parfum, heavy crystal flacon, 65g magnetic Zamac cap, gilded story card.',
      care: 'Store upright, away from heat and light. Apply to pulse points.',
      palette: ['#0B0B0C', '#2a1a08', '#C5A059'],
      media: { form: '', move: '', detail: '' },
      prompt: 'Heavy rectangular crystal perfume flacon with matte black magnetic cap on dark wet basalt, golden rim lighting'
    },
    {
      id: 'ira-handa-nocturne',
      name: 'Ira-Handa Nocturne, Extrait de Parfum (100 ml)',
      short: 'Ira-Handa Nocturne',
      tabs: ['Haute Parfumerie'], collection: 'Haute Parfumerie',
      price: 64000, edition: null, remaining: 11, kind: 'parfum', variant: 'saffron', sizing: 'single', sizeLabel: '100 ml', bespoke: false, soldOut: [],
      summary: 'Solar bergamot and golden saffron colliding with nocturnal oud, velvet iris and white musk.',
      provenance: 'Blended and filled by hand, Colombo atelier',
      story: 'Sun and moon in one flacon. Bright bergamot and saffron open the scent, then give way to oud, velvet iris and a long white musk.',
      materials: 'Extrait de parfum, heavy crystal flacon, magnetic cap, gilded story card.',
      care: 'Store upright, away from heat and light. Apply to pulse points.',
      palette: ['#0B0B0C', '#0E3B2E', '#e0bd6c'],
      media: { form: '', move: '', detail: '' },
      prompt: 'Heavy crystal flacon holding golden saffron liquid, golden perfume mist suspended in dark air, emerald silk fold in shadow'
    }
  ];

  /* ---------- Navigation: 6 sovereign items ----------
     actions: filter:<tab>  product:<id>  stylist  salon  film  anchor:<id>  info:<key> */
  M.NAV = [
    { key: 'couture', label: 'Atelier Couture', title: 'Hand-painted, hand-beaded, made once.',
      tone: ['#4A121C', '#1b0508'], kind: 'gown', image: 'Alstroemeria Velvet Couture Gown',
      links: [
        { label: 'Hand-painted gowns', action: 'filter:Atelier Couture' },
        { label: 'The Alstroemeria Gown', action: 'product:alstroemeria-gown' },
        { label: 'Made-to-measure commissions', action: 'stylist' },
        { label: 'Archive previews', action: 'salon' }
      ] },
    { key: 'women', label: 'Women', title: 'Sculpted silhouettes in velvet and lace.',
      tone: ['#4A121C', '#240709'], kind: 'lace', image: 'Mahatittha Garnet Lace Midi',
      links: [
        { label: 'All women’s pieces', action: 'filter:Women' },
        { label: 'Mahatittha Lace Midi', action: 'product:mahatittha-lace-midi' },
        { label: 'Evening couture', action: 'filter:Atelier Couture' },
        { label: 'Speak with a stylist', action: 'stylist' }
      ] },
    { key: 'men', label: 'Men', title: 'Bespoke menswear with a sharper shoulder.',
      tone: ['#151517', '#0B0B0C'], kind: 'blazer', image: 'Sovereign Obsidian Blazer',
      links: [
        { label: 'All menswear', action: 'filter:Men' },
        { label: 'Sovereign Obsidian Blazer', action: 'product:sovereign-obsidian-blazer' },
        { label: 'Ceylon Silk Evening Shirt', action: 'product:ceylon-silk-evening-shirt' },
        { label: 'Bespoke tailoring', action: 'stylist' }
      ] },
    { key: 'leather', label: 'Leather & Bags', title: 'Architectural leather with a crest on the clasp.',
      tone: ['#0E3B2E', '#0B0B0C'], kind: 'bag', image: 'The Kotiya Top-Handle Bag',
      links: [
        { label: 'All leather goods', action: 'filter:Leather & Bags' },
        { label: 'The Kotiya Top-Handle', action: 'product:kotiya-top-handle' },
        { label: 'Mannar Pearl Minaudière', action: 'product:mannar-pearl-minaudiere' },
        { label: 'Digital Product Passport', action: 'passport' }
      ] },
    { key: 'parfum', label: 'Haute Parfumerie', title: 'Extraits in heavy crystal, filled by hand.',
      tone: ['#2a1a08', '#0B0B0C'], kind: 'parfum', image: 'Mantai 525 AD',
      links: [
        { label: 'All extraits', action: 'filter:Haute Parfumerie' },
        { label: 'Mantai 525 AD', action: 'product:mantai-525' },
        { label: 'Ira-Handa Nocturne', action: 'product:ira-handa-nocturne' },
        { label: 'The unboxing ritual', action: 'anchor:ritual' }
      ] },
    { key: 'maison', label: 'The Maison', title: 'Born where empires traded beauty.',
      tone: ['#151517', '#0B0B0C'], kind: 'crest', image: 'The crest of the House',
      links: [
        { label: 'Our origin', action: 'anchor:maison' },
        { label: 'The Hidden Sun & Moon Cipher', action: 'cipher' },
        { label: 'Watch the Atelier Film', action: 'film' },
        { label: 'The Private Salon', action: 'salon' }
      ] }
  ];

  /* ---------- Lookbook stills (campaign media slots) ---------- */
  M.LOOKBOOK = [
    { id: 'emporium', title: 'The Great Emporium', filter: 'Atelier Couture', kind: 'courtyard',
      caption: 'Gown and tailoring in a sandstone courtyard at sunset.',
      prompt: 'Ultra-luxury Parisian-Ceylonese haute couture campaign film still, dramatic chiaroscuro warm golden sunset beam inside a minimalist dark architectural travertine pavilion, poised South Asian and international high-fashion models wearing a hand-painted floral silk-velvet sculpted evening gown and a razor-sharp obsidian black bespoke tailored blazer, fluid fabric motion, 35mm anamorphic film grain, Vogue Italia editorial aesthetic, obsidian black, alabaster ivory, burnished antique gold, deep garnet' },
    { id: 'hardware', title: 'Leather and Scent', filter: 'Leather & Bags', kind: 'basalt',
      caption: 'A calfskin top-handle beside a crystal flacon on wet basalt.',
      prompt: 'Museum-grade luxury product photography, structured matte obsidian calfskin top-handle handbag with brushed antique gold architectural clasp beside a heavy rectangular crystal perfume flacon with matte black magnetic cap resting on dark wet basalt stone with subtle golden rim lighting, deep emerald silk fabric fold in shadow, razor-sharp macro focus' },
    { id: 'atelier', title: 'The Atelier', filter: 'Atelier Couture', kind: 'table',
      caption: 'A couturier’s hands painting gold Alstroemeria onto ivory velvet.',
      prompt: 'Intimate editorial close-up of a master couturier’s hands delicately painting metallic gold and soft Alstroemeria petals onto ivory silk velvet with a fine sable brush on a sunlit wooden atelier table, antique brass scissors and tiny glass beads beside the fabric, warm chiaroscuro shadows' },
    { id: 'label', title: 'The Label', filter: 'Men', kind: 'damask',
      caption: 'The woven damask neck label, bearing only the Hidden Sun and Moon wordmark.',
      prompt: 'Extreme macro light sweep across a black woven damask label revealing the gold MANTHAI wordmark, deep obsidian silk folds' }
  ];

  /* ---------- Unboxing ritual parts ---------- */
  M.RITUAL = [
    { id: 'box',    name: 'Rigid Magnetic Box', spec: '2.5 mm Obsidian',
      text: 'A rigid 2.5 mm obsidian box that closes on hidden magnets with a soft, deliberate sound. It is made to be kept.' },
    { id: 'ribbon', name: 'Silk Ribbon',        spec: 'Ceylon Emerald',
      text: 'A Ceylon Emerald silk ribbon, tied by hand in the atelier. Untie it slowly: the colour is the first thing the Maison wants you to remember.' },
    { id: 'card',   name: 'Story Card',         spec: '32 pt Gold-Gilded Uncoated Cotton',
      text: 'A heavy 32 pt uncoated cotton card with gilded edges. It tells the story of your piece and carries its edition number in the House’s ceremonial hand.' },
    { id: 'crest',  name: 'Brass Hardware Crest', spec: 'Tier 2',
      text: 'The Tier 2 brass crest: the Tree of Boundless Creation and its twin Ceylon leopards, cast in brass and brushed by hand to a low burnish.' },
    { id: 'label',  name: 'Woven Damask Neck Label', spec: '60 mm × 22 mm',
      text: 'A 60 mm × 22 mm woven damask neck label that bears only the Hidden Sun and Moon wordmark. No other text appears on it.' }
  ];

  /* ---------- Short policy texts for the footer info layer ---------- */
  M.INFO = {
    delivery: { title: 'Delivery and duties',
      body: ['Complimentary white-glove insured delivery across Sri Lanka. A Maison courier brings the piece to you and waits while you open it.',
             'International orders travel by DHL Express, delivered duty paid (DDP). All duties and taxes are included in the price you see at checkout, so nothing is collected at your door.',
             'Delivery is always free. Every order is prepaid; cash on delivery is not offered.',
             'Made-to-measure pieces are dispatched after final fit confirmation. Your stylist confirms the date with you.'] },
    care: { title: 'Care and repair',
      body: ['Every piece comes with care notes on its Story Card. The atelier in Colombo repairs and refreshes MANTHAI pieces for life.',
             'Scan the NFC tag inside your piece to open its Digital Product Passport and request care at any time.'] },
    privacy: { title: 'Privacy',
      body: ['This storefront stores your bag, currency and Private Salon details only in your own browser. Nothing is sent to a server in this build.',
             'Draft text. Final policy wording is to be confirmed before launch.'] },
    terms: { title: 'Terms of sale',
      body: ['Prices are shown in your chosen currency at an indicative rate and are charged as confirmed at checkout. Made-to-measure pieces are final sale once cutting begins.',
             'Draft text. Final terms are to be confirmed before launch.'] }
  };
})();
