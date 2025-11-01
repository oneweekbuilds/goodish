// Brand detection dictionary with aliases and URL patterns
// Used by productAffinity metric to identify commercial content

export interface BrandEntry {
  canonical: string;
  category: string;
  aliases: string[];
  urlPatterns: string[];
}

export const PRODUCT_CATEGORIES = [
  'fitness',
  'beauty',
  'tech',
  'fashion',
  'food',
  'home',
  'finance',
  'auto',
  'games',
  'outdoors',
  'health_supplements'
] as const;

export type ProductCategory = typeof PRODUCT_CATEGORIES[number];

/**
 * Brand dictionary with 120+ entries across 11 categories
 * Each entry includes canonical name, category, aliases, and URL patterns
 */
export const BRANDS: BrandEntry[] = [
  // FITNESS (12 brands)
  {
    canonical: 'Nike',
    category: 'fitness',
    aliases: ['nike', 'nikesportswear', 'justdoit'],
    urlPatterns: ['nike.com', 'nike.co']
  },
  {
    canonical: 'Adidas',
    category: 'fitness',
    aliases: ['adidas', 'adidasoriginals', 'threestripes'],
    urlPatterns: ['adidas.com', 'adidas.co']
  },
  {
    canonical: 'Lululemon',
    category: 'fitness',
    aliases: ['lululemon', 'lulu', 'lululemonathletics'],
    urlPatterns: ['lululemon.com']
  },
  {
    canonical: 'Peloton',
    category: 'fitness',
    aliases: ['peloton', 'onepeloton', 'pelotoncycle'],
    urlPatterns: ['onepeloton.com', 'peloton.com']
  },
  {
    canonical: 'Under Armour',
    category: 'fitness',
    aliases: ['underarmour', 'ua', 'uasportswear'],
    urlPatterns: ['underarmour.com']
  },
  {
    canonical: 'Gymshark',
    category: 'fitness',
    aliases: ['gymshark', 'gym_shark'],
    urlPatterns: ['gymshark.com']
  },
  {
    canonical: 'Reebok',
    category: 'fitness',
    aliases: ['reebok', 'reebokclassic'],
    urlPatterns: ['reebok.com']
  },
  {
    canonical: 'New Balance',
    category: 'fitness',
    aliases: ['newbalance', 'nb', 'nbrunning'],
    urlPatterns: ['newbalance.com']
  },
  {
    canonical: 'ASICS',
    category: 'fitness',
    aliases: ['asics', 'asicsrunning'],
    urlPatterns: ['asics.com']
  },
  {
    canonical: 'Puma',
    category: 'fitness',
    aliases: ['puma', 'pumaperformance'],
    urlPatterns: ['puma.com']
  },
  {
    canonical: 'Fitbit',
    category: 'fitness',
    aliases: ['fitbit', 'fitbitcharge', 'fitbitversa'],
    urlPatterns: ['fitbit.com']
  },
  {
    canonical: 'Garmin',
    category: 'fitness',
    aliases: ['garmin', 'garminconnect', 'garminforerunner'],
    urlPatterns: ['garmin.com']
  },

  // BEAUTY (15 brands)
  {
    canonical: 'Sephora',
    category: 'beauty',
    aliases: ['sephora', 'sephorabeauty', 'sephorahaul'],
    urlPatterns: ['sephora.com']
  },
  {
    canonical: 'Ulta',
    category: 'beauty',
    aliases: ['ulta', 'ultabeauty'],
    urlPatterns: ['ulta.com']
  },
  {
    canonical: 'Fenty Beauty',
    category: 'beauty',
    aliases: ['fentybeauty', 'fenty', 'fentyface'],
    urlPatterns: ['fentybeauty.com']
  },
  {
    canonical: 'Glossier',
    category: 'beauty',
    aliases: ['glossier', 'glossiergirl'],
    urlPatterns: ['glossier.com']
  },
  {
    canonical: 'MAC Cosmetics',
    category: 'beauty',
    aliases: ['maccosmetics', 'mac', 'macmakeup'],
    urlPatterns: ['maccosmetics.com']
  },
  {
    canonical: 'Maybelline',
    category: 'beauty',
    aliases: ['maybelline', 'maybellineny'],
    urlPatterns: ['maybelline.com']
  },
  {
    canonical: "L'Oréal",
    category: 'beauty',
    aliases: ['loreal', 'lorealparis', 'lorealusa'],
    urlPatterns: ['loreal.com', 'lorealparisusa.com']
  },
  {
    canonical: 'Estée Lauder',
    category: 'beauty',
    aliases: ['esteelauder', 'estee', 'esteelaudercompanies'],
    urlPatterns: ['esteelauder.com']
  },
  {
    canonical: 'CeraVe',
    category: 'beauty',
    aliases: ['cerave', 'ceraveskincare'],
    urlPatterns: ['cerave.com']
  },
  {
    canonical: 'The Ordinary',
    category: 'beauty',
    aliases: ['theordinary', 'deciem'],
    urlPatterns: ['theordinary.com', 'deciem.com']
  },
  {
    canonical: 'Drunk Elephant',
    category: 'beauty',
    aliases: ['drunkelephant', 'drunkelephantskincare'],
    urlPatterns: ['drunkelephant.com']
  },
  {
    canonical: 'Neutrogena',
    category: 'beauty',
    aliases: ['neutrogena', 'neutrogenausa'],
    urlPatterns: ['neutrogena.com']
  },
  {
    canonical: 'Olaplex',
    category: 'beauty',
    aliases: ['olaplex', 'olaplexhair'],
    urlPatterns: ['olaplex.com']
  },
  {
    canonical: 'Urban Decay',
    category: 'beauty',
    aliases: ['urbandecay', 'urbandecaycosmetics'],
    urlPatterns: ['urbandecay.com']
  },
  {
    canonical: 'Anastasia Beverly Hills',
    category: 'beauty',
    aliases: ['anastasiabeverlyhills', 'abh', 'abhcosmetics'],
    urlPatterns: ['anastasiabeverlyhills.com']
  },

  // TECH (15 brands)
  {
    canonical: 'Apple',
    category: 'tech',
    aliases: ['apple', 'iphone', 'ipad', 'macbook', 'applewatch'],
    urlPatterns: ['apple.com']
  },
  {
    canonical: 'Samsung',
    category: 'tech',
    aliases: ['samsung', 'galaxys', 'galaxynote', 'samsunggalaxy'],
    urlPatterns: ['samsung.com']
  },
  {
    canonical: 'Microsoft',
    category: 'tech',
    aliases: ['microsoft', 'xbox', 'surface', 'windows'],
    urlPatterns: ['microsoft.com', 'xbox.com']
  },
  {
    canonical: 'Google',
    category: 'tech',
    aliases: ['google', 'pixel', 'googlepixel', 'nest'],
    urlPatterns: ['google.com', 'store.google.com']
  },
  {
    canonical: 'Amazon',
    category: 'tech',
    aliases: ['amazon', 'alexa', 'kindle', 'amazonecho'],
    urlPatterns: ['amazon.com']
  },
  {
    canonical: 'Sony',
    category: 'tech',
    aliases: ['sony', 'playstation', 'ps5', 'sonyelectronics'],
    urlPatterns: ['sony.com', 'playstation.com']
  },
  {
    canonical: 'Dell',
    category: 'tech',
    aliases: ['dell', 'dellxps', 'alienware'],
    urlPatterns: ['dell.com']
  },
  {
    canonical: 'HP',
    category: 'tech',
    aliases: ['hp', 'hewlettpackard', 'hpprinting'],
    urlPatterns: ['hp.com']
  },
  {
    canonical: 'Lenovo',
    category: 'tech',
    aliases: ['lenovo', 'thinkpad'],
    urlPatterns: ['lenovo.com']
  },
  {
    canonical: 'ASUS',
    category: 'tech',
    aliases: ['asus', 'rog', 'asusrog'],
    urlPatterns: ['asus.com']
  },
  {
    canonical: 'Bose',
    category: 'tech',
    aliases: ['bose', 'boseheadphones'],
    urlPatterns: ['bose.com']
  },
  {
    canonical: 'Sonos',
    category: 'tech',
    aliases: ['sonos', 'sonosaudio'],
    urlPatterns: ['sonos.com']
  },
  {
    canonical: 'Canon',
    category: 'tech',
    aliases: ['canon', 'canonusa', 'canonphotography'],
    urlPatterns: ['canon.com', 'usa.canon.com']
  },
  {
    canonical: 'Nikon',
    category: 'tech',
    aliases: ['nikon', 'nikonusa', 'nikonphotography'],
    urlPatterns: ['nikon.com', 'nikonusa.com']
  },
  {
    canonical: 'GoPro',
    category: 'tech',
    aliases: ['gopro', 'goprohero'],
    urlPatterns: ['gopro.com']
  },

  // FASHION (15 brands)
  {
    canonical: 'Zara',
    category: 'fashion',
    aliases: ['zara', 'zaraofficial'],
    urlPatterns: ['zara.com']
  },
  {
    canonical: 'H&M',
    category: 'fashion',
    aliases: ['hm', 'handm', 'hmfashion'],
    urlPatterns: ['hm.com']
  },
  {
    canonical: 'Uniqlo',
    category: 'fashion',
    aliases: ['uniqlo', 'uniqlousa'],
    urlPatterns: ['uniqlo.com']
  },
  {
    canonical: 'Gap',
    category: 'fashion',
    aliases: ['gap', 'gapinc'],
    urlPatterns: ['gap.com']
  },
  {
    canonical: 'Old Navy',
    category: 'fashion',
    aliases: ['oldnavy', 'oldnavystyle'],
    urlPatterns: ['oldnavy.gap.com']
  },
  {
    canonical: 'Forever 21',
    category: 'fashion',
    aliases: ['forever21', 'f21'],
    urlPatterns: ['forever21.com']
  },
  {
    canonical: 'Shein',
    category: 'fashion',
    aliases: ['shein', 'sheinofficial', 'sheinhaul'],
    urlPatterns: ['shein.com']
  },
  {
    canonical: 'Fashion Nova',
    category: 'fashion',
    aliases: ['fashionnova', 'novababe'],
    urlPatterns: ['fashionnova.com']
  },
  {
    canonical: 'American Eagle',
    category: 'fashion',
    aliases: ['americaneagle', 'ae', 'aerie'],
    urlPatterns: ['ae.com', 'aerie.com']
  },
  {
    canonical: 'Abercrombie & Fitch',
    category: 'fashion',
    aliases: ['abercrombie', 'abercrombieanditch', 'anf'],
    urlPatterns: ['abercrombie.com']
  },
  {
    canonical: 'Hollister',
    category: 'fashion',
    aliases: ['hollister', 'hollisterco'],
    urlPatterns: ['hollisterco.com']
  },
  {
    canonical: 'Urban Outfitters',
    category: 'fashion',
    aliases: ['urbanoutfitters', 'uo', 'uoonyou'],
    urlPatterns: ['urbanoutfitters.com']
  },
  {
    canonical: 'Free People',
    category: 'fashion',
    aliases: ['freepeople', 'fpme'],
    urlPatterns: ['freepeople.com']
  },
  {
    canonical: 'Anthropologie',
    category: 'fashion',
    aliases: ['anthropologie', 'anthro'],
    urlPatterns: ['anthropologie.com']
  },
  {
    canonical: 'Nordstrom',
    category: 'fashion',
    aliases: ['nordstrom', 'nordstromrack'],
    urlPatterns: ['nordstrom.com', 'nordstromrack.com']
  },

  // FOOD (12 brands)
  {
    canonical: 'Starbucks',
    category: 'food',
    aliases: ['starbucks', 'starbuckscoffee', 'sbux'],
    urlPatterns: ['starbucks.com']
  },
  {
    canonical: "McDonald's",
    category: 'food',
    aliases: ['mcdonalds', 'mcd', 'mcds'],
    urlPatterns: ['mcdonalds.com']
  },
  {
    canonical: 'Chipotle',
    category: 'food',
    aliases: ['chipotle', 'chipotlemexicangrill'],
    urlPatterns: ['chipotle.com']
  },
  {
    canonical: 'Chick-fil-A',
    category: 'food',
    aliases: ['chickfila', 'cfa', 'chickfilalove'],
    urlPatterns: ['chick-fil-a.com']
  },
  {
    canonical: 'Taco Bell',
    category: 'food',
    aliases: ['tacobell', 'tacobelllife'],
    urlPatterns: ['tacobell.com']
  },
  {
    canonical: 'Dominos',
    category: 'food',
    aliases: ['dominos', 'dominospizza'],
    urlPatterns: ['dominos.com']
  },
  {
    canonical: 'Pizza Hut',
    category: 'food',
    aliases: ['pizzahut', 'thehut'],
    urlPatterns: ['pizzahut.com']
  },
  {
    canonical: 'Subway',
    category: 'food',
    aliases: ['subway', 'subwayrestaurants'],
    urlPatterns: ['subway.com']
  },
  {
    canonical: 'Dunkin',
    category: 'food',
    aliases: ['dunkin', 'dunkindonuts', 'dunkincoffee'],
    urlPatterns: ['dunkindonuts.com']
  },
  {
    canonical: 'Panera Bread',
    category: 'food',
    aliases: ['panera', 'panerabread'],
    urlPatterns: ['panerabread.com']
  },
  {
    canonical: 'Whole Foods',
    category: 'food',
    aliases: ['wholefoods', 'wholefoodsmarket'],
    urlPatterns: ['wholefoodsmarket.com']
  },
  {
    canonical: "Trader Joe's",
    category: 'food',
    aliases: ['traderjoes', 'traderjoeslist'],
    urlPatterns: ['traderjoes.com']
  },

  // HOME (12 brands)
  {
    canonical: 'IKEA',
    category: 'home',
    aliases: ['ikea', 'ikeausa', 'ikeahome'],
    urlPatterns: ['ikea.com']
  },
  {
    canonical: 'Target',
    category: 'home',
    aliases: ['target', 'targetstyle', 'targetdoesitagain'],
    urlPatterns: ['target.com']
  },
  {
    canonical: 'Walmart',
    category: 'home',
    aliases: ['walmart', 'walmartfinds'],
    urlPatterns: ['walmart.com']
  },
  {
    canonical: 'Wayfair',
    category: 'home',
    aliases: ['wayfair', 'wayfairhome'],
    urlPatterns: ['wayfair.com']
  },
  {
    canonical: 'West Elm',
    category: 'home',
    aliases: ['westelm', 'westelmhome'],
    urlPatterns: ['westelm.com']
  },
  {
    canonical: 'Pottery Barn',
    category: 'home',
    aliases: ['potterybarn', 'pb'],
    urlPatterns: ['potterybarn.com']
  },
  {
    canonical: 'Crate & Barrel',
    category: 'home',
    aliases: ['crateandbarrel', 'cb2'],
    urlPatterns: ['crateandbarrel.com', 'cb2.com']
  },
  {
    canonical: 'HomeGoods',
    category: 'home',
    aliases: ['homegoods', 'homegoodsfinds'],
    urlPatterns: ['homegoods.com']
  },
  {
    canonical: 'Bed Bath & Beyond',
    category: 'home',
    aliases: ['bedbathandbeyond', 'bbb'],
    urlPatterns: ['bedbathandbeyond.com']
  },
  {
    canonical: 'The Container Store',
    category: 'home',
    aliases: ['containerstore', 'thecontainerstore'],
    urlPatterns: ['containerstore.com']
  },
  {
    canonical: 'Williams Sonoma',
    category: 'home',
    aliases: ['williamssonoma', 'wshome'],
    urlPatterns: ['williams-sonoma.com']
  },
  {
    canonical: 'Sur La Table',
    category: 'home',
    aliases: ['surlatable', 'slt'],
    urlPatterns: ['surlatable.com']
  },

  // FINANCE (10 brands)
  {
    canonical: 'American Express',
    category: 'finance',
    aliases: ['americanexpress', 'amex', 'amexcards'],
    urlPatterns: ['americanexpress.com']
  },
  {
    canonical: 'Chase',
    category: 'finance',
    aliases: ['chase', 'jpmorgan', 'chasecredit'],
    urlPatterns: ['chase.com']
  },
  {
    canonical: 'Bank of America',
    category: 'finance',
    aliases: ['bankofamerica', 'bofa'],
    urlPatterns: ['bankofamerica.com']
  },
  {
    canonical: 'Capital One',
    category: 'finance',
    aliases: ['capitalone', 'capitalonecards'],
    urlPatterns: ['capitalone.com']
  },
  {
    canonical: 'Wells Fargo',
    category: 'finance',
    aliases: ['wellsfargo', 'wf'],
    urlPatterns: ['wellsfargo.com']
  },
  {
    canonical: 'Discover',
    category: 'finance',
    aliases: ['discover', 'discovercard'],
    urlPatterns: ['discover.com']
  },
  {
    canonical: 'Visa',
    category: 'finance',
    aliases: ['visa', 'visacard'],
    urlPatterns: ['visa.com']
  },
  {
    canonical: 'Mastercard',
    category: 'finance',
    aliases: ['mastercard', 'mastercardglobal'],
    urlPatterns: ['mastercard.com', 'mastercard.us']
  },
  {
    canonical: 'PayPal',
    category: 'finance',
    aliases: ['paypal', 'paypalofficial'],
    urlPatterns: ['paypal.com']
  },
  {
    canonical: 'Venmo',
    category: 'finance',
    aliases: ['venmo', 'venmoofficial'],
    urlPatterns: ['venmo.com']
  },

  // AUTO (10 brands)
  {
    canonical: 'Tesla',
    category: 'auto',
    aliases: ['tesla', 'teslamotors', 'teslamodel3'],
    urlPatterns: ['tesla.com']
  },
  {
    canonical: 'Toyota',
    category: 'auto',
    aliases: ['toyota', 'toyotausa'],
    urlPatterns: ['toyota.com']
  },
  {
    canonical: 'Ford',
    category: 'auto',
    aliases: ['ford', 'fordmotorcompany', 'fordtrucks'],
    urlPatterns: ['ford.com']
  },
  {
    canonical: 'Chevrolet',
    category: 'auto',
    aliases: ['chevrolet', 'chevy'],
    urlPatterns: ['chevrolet.com']
  },
  {
    canonical: 'Honda',
    category: 'auto',
    aliases: ['honda', 'hondausa'],
    urlPatterns: ['honda.com']
  },
  {
    canonical: 'BMW',
    category: 'auto',
    aliases: ['bmw', 'bmwusa'],
    urlPatterns: ['bmw.com', 'bmwusa.com']
  },
  {
    canonical: 'Mercedes-Benz',
    category: 'auto',
    aliases: ['mercedesbenz', 'mercedes', 'mbusa'],
    urlPatterns: ['mbusa.com', 'mercedes-benz.com']
  },
  {
    canonical: 'Audi',
    category: 'auto',
    aliases: ['audi', 'audiusa'],
    urlPatterns: ['audi.com', 'audiusa.com']
  },
  {
    canonical: 'Jeep',
    category: 'auto',
    aliases: ['jeep', 'jeepofficial', 'jeepwrangler'],
    urlPatterns: ['jeep.com']
  },
  {
    canonical: 'Subaru',
    category: 'auto',
    aliases: ['subaru', 'subaruusa'],
    urlPatterns: ['subaru.com']
  },

  // GAMES (10 brands)
  {
    canonical: 'Nintendo',
    category: 'games',
    aliases: ['nintendo', 'nintendoswitch', 'nintendoamerica'],
    urlPatterns: ['nintendo.com']
  },
  {
    canonical: 'PlayStation',
    category: 'games',
    aliases: ['playstation', 'ps5', 'ps4', 'psn'],
    urlPatterns: ['playstation.com']
  },
  {
    canonical: 'Xbox',
    category: 'games',
    aliases: ['xbox', 'xboxseriesx', 'xboxgamepass'],
    urlPatterns: ['xbox.com']
  },
  {
    canonical: 'Steam',
    category: 'games',
    aliases: ['steam', 'steamgames', 'valvesoftware'],
    urlPatterns: ['steampowered.com']
  },
  {
    canonical: 'Epic Games',
    category: 'games',
    aliases: ['epicgames', 'fortnite', 'unrealengine'],
    urlPatterns: ['epicgames.com']
  },
  {
    canonical: 'Activision',
    category: 'games',
    aliases: ['activision', 'callofduty', 'cod'],
    urlPatterns: ['activision.com']
  },
  {
    canonical: 'EA Sports',
    category: 'games',
    aliases: ['ea', 'easports', 'electronicarts'],
    urlPatterns: ['ea.com']
  },
  {
    canonical: 'Ubisoft',
    category: 'games',
    aliases: ['ubisoft', 'ubisoftgames'],
    urlPatterns: ['ubisoft.com']
  },
  {
    canonical: 'Rockstar Games',
    category: 'games',
    aliases: ['rockstargames', 'gta', 'grandtheftauto'],
    urlPatterns: ['rockstargames.com']
  },
  {
    canonical: 'Blizzard',
    category: 'games',
    aliases: ['blizzard', 'blizzardent', 'overwatch', 'wow'],
    urlPatterns: ['blizzard.com']
  },

  // OUTDOORS (8 brands)
  {
    canonical: 'Patagonia',
    category: 'outdoors',
    aliases: ['patagonia', 'patagoniaoutdoors'],
    urlPatterns: ['patagonia.com']
  },
  {
    canonical: 'The North Face',
    category: 'outdoors',
    aliases: ['thenorthface', 'northface', 'tnf'],
    urlPatterns: ['thenorthface.com']
  },
  {
    canonical: "REI",
    category: 'outdoors',
    aliases: ['rei', 'reicoop'],
    urlPatterns: ['rei.com']
  },
  {
    canonical: 'Columbia',
    category: 'outdoors',
    aliases: ['columbia', 'columbiasportswear'],
    urlPatterns: ['columbia.com']
  },
  {
    canonical: 'Arc\'teryx',
    category: 'outdoors',
    aliases: ['arcteryx', 'arcteryxofficial'],
    urlPatterns: ['arcteryx.com']
  },
  {
    canonical: 'Yeti',
    category: 'outdoors',
    aliases: ['yeti', 'yeticoolers'],
    urlPatterns: ['yeti.com']
  },
  {
    canonical: 'Osprey',
    category: 'outdoors',
    aliases: ['osprey', 'ospreypacks'],
    urlPatterns: ['osprey.com']
  },
  {
    canonical: 'Hydro Flask',
    category: 'outdoors',
    aliases: ['hydroflask', 'hydroflaskofficial'],
    urlPatterns: ['hydroflask.com']
  },

  // HEALTH_SUPPLEMENTS (11 brands)
  {
    canonical: 'Optimum Nutrition',
    category: 'health_supplements',
    aliases: ['optimumnutrition', 'on', 'goldstandard'],
    urlPatterns: ['optimumnutrition.com']
  },
  {
    canonical: 'MyProtein',
    category: 'health_supplements',
    aliases: ['myprotein', 'myproteinus'],
    urlPatterns: ['myprotein.com']
  },
  {
    canonical: 'GNC',
    category: 'health_supplements',
    aliases: ['gnc', 'gnclivewell'],
    urlPatterns: ['gnc.com']
  },
  {
    canonical: 'Vital Proteins',
    category: 'health_supplements',
    aliases: ['vitalproteins', 'vitalproteinscollagen'],
    urlPatterns: ['vitalproteins.com']
  },
  {
    canonical: 'Huel',
    category: 'health_supplements',
    aliases: ['huel', 'huelofficial'],
    urlPatterns: ['huel.com']
  },
  {
    canonical: 'Athletic Greens',
    category: 'health_supplements',
    aliases: ['athleticgreens', 'ag1'],
    urlPatterns: ['athleticgreens.com', 'drinkag1.com']
  },
  {
    canonical: 'Ritual',
    category: 'health_supplements',
    aliases: ['ritual', 'ritualvitamins'],
    urlPatterns: ['ritual.com']
  },
  {
    canonical: 'Nature Made',
    category: 'health_supplements',
    aliases: ['naturemade', 'naturemadevitamins'],
    urlPatterns: ['naturemade.com']
  },
  {
    canonical: 'Garden of Life',
    category: 'health_supplements',
    aliases: ['gardenoflife', 'golsupplements'],
    urlPatterns: ['gardenoflife.com']
  },
  {
    canonical: 'Quest Nutrition',
    category: 'health_supplements',
    aliases: ['questnutrition', 'questbars'],
    urlPatterns: ['questnutrition.com']
  },
  {
    canonical: 'Orgain',
    category: 'health_supplements',
    aliases: ['orgain', 'orgainorganic'],
    urlPatterns: ['orgain.com']
  }
];

/**
 * Build brand lookup map for fast matching
 * @returns Map of lowercase brand names to canonical entries
 */
export function buildBrandLookup(): Map<string, BrandEntry> {
  const lookup = new Map<string, BrandEntry>();

  for (const brand of BRANDS) {
    // Add canonical name
    lookup.set(brand.canonical.toLowerCase(), brand);

    // Add all aliases
    for (const alias of brand.aliases) {
      lookup.set(alias.toLowerCase(), brand);
    }
  }

  return lookup;
}

/**
 * Match text against brand patterns
 * @param text - Text to search for brands
 * @returns Array of matched brand entries
 */
export function detectBrands(text: string): BrandEntry[] {
  const lowerText = text.toLowerCase();
  const matches = new Set<BrandEntry>();
  const lookup = buildBrandLookup();

  // Check each word for brand matches
  const words = lowerText.split(/\s+/);
  for (const word of words) {
    const cleanWord = word.replace(/[^a-z0-9]/g, '');
    const match = lookup.get(cleanWord);
    if (match) {
      matches.add(match);
    }
  }

  // Check URL patterns
  for (const brand of BRANDS) {
    for (const pattern of brand.urlPatterns) {
      if (lowerText.includes(pattern)) {
        matches.add(brand);
      }
    }
  }

  return Array.from(matches);
}
