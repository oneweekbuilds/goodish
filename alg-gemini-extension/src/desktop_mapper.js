/**
 * AlgorithmLens Desktop Mapper
 *
 * Converts DesktopPostItem[] from DOM scanning into UnifiedScanResult format.
 * Step 11B-2: Schema mapping (no backend calls)
 */

import { generateScanId } from './shared/generate-scan-id.js';
import { CAPTURE_DEBUG, debugLog } from './shared/debug.js';

// ============================================
// Constants & Heuristics
// ============================================

// Stop words to filter from topic extraction
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
  'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what',
  'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each', 'every',
  'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also',
  'now', 'here', 'there', 'then', 'if', 'your', 'my', 'his', 'her', 'its',
  'our', 'their', 'me', 'him', 'us', 'them', 'get', 'got', 'like', 'new',
  'one', 'two', 'first', 'last', 'good', 'great', 'best', 'well', 'back',
  'even', 'still', 'way', 'much', 'many', 'need', 'want', 'see', 'look',
  'make', 'take', 'come', 'go', 'know', 'think', 'say', 'try', 'use', 'find'
]);

// NOTE: Keyword-based heuristics for sentiment, wellbeing, and political detection
// were removed because they produced inaccurate results (false positives from
// partial word matches, lack of context understanding).
// These fields now return null/empty to indicate "not analyzed" rather than
// showing inaccurate guesses. Accurate analysis requires AI/LLM processing.

// ============================================
// Utility Functions
// ============================================

/**
 * Extract words from text, filtering stop words
 */
function extractKeywords(text) {
  if (!text) return [];
  
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s#@]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
  
  return words;
}

// NOTE: analyzeTone, detectWellbeingThemes, and isPolitical functions removed.
// Simple keyword matching produces too many false positives (e.g., "body" matching
// body_image for an NFL post, "left/right" matching political for sports content).
// Accurate sentiment/wellbeing/political detection requires LLM-based analysis.

/**
 * Extract domain from URL
 */
function extractDomain(url) {
  if (!url) return null;
  try {
    const urlObj = new URL(url.startsWith('http') ? url : 'https://' + url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return null;
  }
}

/**
 * Classify topic from keywords
 *
 * Expanded keyword patterns for better coverage when Gemini AI is not enabled.
 * When Gemini IS enabled, these are overwritten by AI-classified topics.
 */
function classifyTopic(keywords, hashtags) {
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Topic] classifyTopic called with:', { keywordsCount: keywords.length, hashtagsCount: hashtags.length, keywordsSample: keywords.slice(0, 10) });
  const combined = [...keywords, ...hashtags.map(h => h.replace('#', '').toLowerCase())];

  // Expanded topic patterns for better keyword coverage (~5000 terms across 15 categories)
  const topicPatterns = {
    'entertainment': [
      // Core terms
      'funny', 'comedy', 'meme', 'lol', 'humor', 'laugh', 'joke', 'entertainment',
      'viral', 'hilarious', 'sketch', 'parody', 'satire', 'roast', 'prank',
      'netflix', 'hulu', 'disney', 'hbo', 'streaming', 'binge', 'series',
      'movie', 'film', 'cinema', 'actor', 'actress', 'celebrity', 'celeb',
      'kardashian', 'reality', 'drama', 'show', 'episode', 'season', 'premiere',
      // Streaming platforms
      'peacock', 'paramount', 'appletv', 'primevideo', 'crunchyroll', 'funimation',
      'maxstream', 'discovery', 'showtime', 'starz', 'amc', 'britbox', 'acorn',
      // TV Networks
      'abc', 'nbc', 'cbs', 'fox', 'cw', 'tbs', 'tnt', 'usa', 'syfy', 'mtv', 'vh1',
      'bravo', 'lifetime', 'hallmark', 'tlc', 'hgtv', 'foodnetwork', 'history',
      // Popular shows
      'gameofthrones', 'got', 'strangerthings', 'squidgame', 'bridgerton', 'ozark',
      'succession', 'yellowstone', 'mandalorian', 'loki', 'wandavision', 'witcher',
      'peakyblinders', 'breakingbad', 'bettercallsaul', 'lastofus', 'houseofdragon',
      'wednesday', 'dahmer', 'euphoria', 'whiteLotus', 'bear', 'severance', 'shogun',
      'fallout', 'ripley', 'baby', 'reindeer', 'hacks', 'abbott', 'bluey', 'cocomelon',
      // Movie franchises
      'marvel', 'mcu', 'avengers', 'spiderman', 'batman', 'superman', 'dceu', 'dc',
      'starwars', 'jurassic', 'fastfurious', 'fastandfurious', 'harrypotter', 'lotr',
      'lordoftherings', 'transformers', 'xmen', 'deadpool', 'guardians', 'galaxy',
      'barbie', 'oppenheimer', 'barbenheimer', 'avatar', 'topgun', 'maverick',
      'johnwick', 'matrix', 'dune', 'wonka', 'minions', 'despicableme', 'frozen',
      'encanto', 'moana', 'coco', 'pixar', 'dreamworks', 'illumination', 'ghibli',
      // Celebrities
      'beyonce', 'rihanna', 'taylorswift', 'drake', 'kanye', 'kimk', 'kyliejenner',
      'kendalljenner', 'khloekardashian', 'selenagomez', 'justinbieber', 'arianagrande',
      'tomholland', 'zendaya', 'timothee', 'chalamet', 'chrishemsworth', 'chrispratt',
      'chrisevans', 'ryangosling', 'margotrobbie', 'florencepugh', 'jenniferaniston',
      'leonardodicaprio', 'bradpitt', 'angelinajolie', 'tomcruise', 'willsmith',
      'therock', 'dwaynejohnson', 'kevinhart', 'adamdriver', 'pedropascal',
      'jasonmomoa', 'henrycavill', 'idriselba', 'denzelwashington', 'samuelljackson',
      'morganfreeman', 'merylstreep', 'cateblanchett', 'violadavis', 'sandrabullock',
      'nicolekidman', 'reesewitherspoon', 'scarlettjohansson', 'emmawatson', 'emmastone',
      // Award shows
      'oscars', 'academy', 'emmy', 'emmys', 'goldenglobes', 'bafta', 'sag', 'sagawards',
      'mtvawards', 'vmas', 'peoples', 'choice', 'critics', 'sundance', 'cannes',
      'toronto', 'tiff', 'venice', 'berlinale', 'comiccon', 'sdcc', 'd23',
      // Entertainment terms
      'trailer', 'teaser', 'spoiler', 'spoilers', 'finale', 'cliffhanger', 'twist',
      'cameo', 'crossover', 'spinoff', 'reboot', 'remake', 'sequel', 'prequel',
      'franchise', 'cinematic', 'universe', 'blockbuster', 'boxoffice', 'opening',
      'weekend', 'rotten', 'tomatoes', 'imdb', 'letterboxd', 'watchlist', 'bingeing',
      'marathon', 'standup', 'comedian', 'improv', 'snl', 'latenight', 'talkshow',
      'jimmyfallon', 'jimmykimmel', 'colbert', 'conan', 'seth', 'meyers', 'trevor',
      'noah', 'johnoliver', 'lastweek', 'tonight', 'dailyshow', 'redcarpet', 'paparazzi',
      'tabloid', 'tmz', 'eonline', 'peoplemag', 'usweekly', 'buzzfeed', 'screenrant',
      'collider', 'deadline', 'variety', 'hollywood', 'reporter', 'bollywood', 'kpop',
      'kdrama', 'anime', 'manga', 'webtoon', 'cosplay', 'fandom', 'fanfic', 'shipper'
    ],
    'music': [
      // Core terms
      'music', 'song', 'artist', 'album', 'concert', 'singer', 'band', 'spotify',
      'playlist', 'track', 'listen', 'release', 'tour', 'lyrics', 'verse',
      'hiphop', 'rap', 'rock', 'pop', 'country', 'jazz', 'edm', 'electronic',
      'grammy', 'billboard', 'chart', 'remix', 'cover', 'acoustic', 'vinyl',
      'producer', 'beatmaker', 'dj', 'soundcloud', 'applemusic', 'tidal',
      // Streaming & platforms
      'pandora', 'deezer', 'audiomack', 'bandcamp', 'reverbnation', 'genius',
      'shazam', 'musixmatch', 'songkick', 'ticketmaster', 'livenation', 'axs',
      // Genres
      'rnb', 'soul', 'funk', 'disco', 'house', 'techno', 'trance', 'dubstep',
      'drum', 'bass', 'dnb', 'trap', 'drill', 'grime', 'reggae', 'dancehall',
      'ska', 'punk', 'metal', 'heavymetal', 'deathmetal', 'blackmetal', 'thrash',
      'hardcore', 'grunge', 'alternative', 'indie', 'folk', 'acoustic', 'bluegrass',
      'classical', 'orchestral', 'opera', 'symphony', 'choir', 'acapella', 'gospel',
      'christian', 'worship', 'latin', 'reggaeton', 'salsa', 'bachata', 'cumbia',
      'mariachi', 'norteño', 'corrido', 'afrobeat', 'afropop', 'highlife', 'amapiano',
      'kpop', 'jpop', 'cpop', 'bollywood', 'lofi', 'chillhop', 'vaporwave', 'synthwave',
      // Major artists
      'taylorswift', 'eras', 'swifties', 'drake', 'drizzy', 'beyonce', 'beyhive',
      'rihanna', 'badgalriri', 'kanye', 'ye', 'kendricklamar', 'kdot', 'jcole',
      'travisscott', 'cactusjack', 'postmalone', 'posty', 'theweeknd', 'xo', 'abel',
      'badbuny', 'badbunny', 'sza', 'doja', 'dojacat', 'lizzo', 'dualalipa', 'dua',
      'billieeilish', 'billie', 'oliviarodrigo', 'sabrinacarpenter', 'charli', 'xcx',
      'brat', 'ladygaga', 'adele', 'edsheeran', 'brunomars', 'silksonic', 'andersonpaak',
      'harrystyles', 'zayn', 'niall', 'horan', 'liam', 'payne', 'onedirection',
      'bts', 'army', 'blackpink', 'blinks', 'twice', 'seventeen', 'straykids', 'skz',
      'aespa', 'newjeans', 'itzy', 'ive', 'lesserafim', 'nct', 'exo', 'redvelvet',
      'coldplay', 'u2', 'radiohead', 'muse', 'arcticmonkeys', 'the1975', 'imagine',
      'dragons', 'maroon5', 'onerepublic', 'falloutboy', 'panicatthedisco', 'mcr',
      'mychemicalromance', 'paramore', 'greenday', 'blink182', 'linkinpark', 'foo',
      'fighters', 'redhotchilipeppers', 'rhcp', 'metallica', 'acdc', 'gunsnroses',
      'aerosmith', 'queen', 'beatles', 'rollingstones', 'pinkfloyd', 'ledZeppelin',
      'nirvana', 'pearljam', 'soundgarden', 'aliceinchains', 'tool', 'slipknot',
      'korn', 'limp', 'bizkit', 'eminem', 'slim', 'shady', '50cent', 'jayz', 'hov',
      'nas', 'snoop', 'dogg', 'dre', 'tupac', 'biggie', 'notorious', 'big', 'lilwayne',
      'weezy', 'nicki', 'minaj', 'cardib', 'megtheestallion', 'megan', 'stallion',
      'lilbaby', 'gunna', 'youngthug', 'futurethewizrd', 'future', 'lildurk', '21savage',
      'metro', 'boomin', 'juice', 'wrld', 'xxxtentacion', 'xxx', 'liluzi', 'vert',
      'playboi', 'carti', 'tyler', 'creator', 'frankocean', 'frank', 'ocean',
      // Music terms
      'hook', 'chorus', 'bridge', 'intro', 'outro', 'breakdown', 'drop', 'beat',
      'rhythm', 'melody', 'harmony', 'bass', 'treble', 'vocal', 'vocals', 'falsetto',
      'autotune', 'vocal', 'chops', 'sample', 'sampling', 'interpolation', 'mashup',
      'medley', 'setlist', 'encore', 'opener', 'headliner', 'headline', 'festival',
      'coachella', 'lollapalooza', 'bonnaroo', 'glastonbury', 'primavera', 'tomorrowland',
      'ultra', 'edc', 'electricdaisy', 'rollingloud', 'govball', 'austincitylimits',
      'aclfest', 'firefly', 'outsidelands', 'summerjam', 'essencefest', 'afropunk',
      // Music industry
      'recordlabel', 'interscope', 'atlantic', 'columbia', 'rca', 'epic', 'universal',
      'sony', 'warner', 'def', 'jam', 'republic', 'capitol', 'parlophone', 'xo',
      'topdawg', 'tde', 'ovo', 'goodmusic', 'dreamville', 'ymcmb', 'cashmoneyrecords',
      // Awards & charts
      'hotbillboard', 'hot100', 'billboard200', 'riaa', 'platinum', 'gold', 'diamond',
      'certify', 'certified', 'grammys', 'brit', 'awards', 'ama', 'americanmusic',
      'mtv', 'vma', 'vmas', 'ema', 'iheartradio', 'bet', 'soulawards'
    ],
    'fashion': [
      // Core terms
      'fashion', 'style', 'outfit', 'clothing', 'dress', 'shoes', 'ootd', 'wear',
      'designer', 'brand', 'runway', 'trend', 'wardrobe', 'accessory', 'jewelry',
      'sneaker', 'streetwear', 'vintage', 'thrift', 'luxury', 'gucci', 'prada',
      'nike', 'adidas', 'zara', 'hm', 'shein', 'uniqlo', 'nordstrom',
      // Luxury brands
      'louisvuitton', 'lv', 'chanel', 'hermes', 'birkin', 'dior', 'balenciaga',
      'versace', 'valentino', 'givenchy', 'burberry', 'fendi', 'bottega', 'veneta',
      'celine', 'saintlaurent', 'ysl', 'alexandermcqueen', 'tomford', 'armani',
      'dolce', 'gabbana', 'moncler', 'canada', 'goose', 'moschino', 'balmain',
      'loewe', 'jacquemus', 'offwhite', 'supreme', 'kith', 'stussy', 'palace',
      'bape', 'bathing', 'ape', 'carhartt', 'dickies', 'supreme', 'thrasher',
      // Fast fashion & retail
      'forever21', 'primark', 'asos', 'boohoo', 'fashionnova', 'prettylittlething',
      'plt', 'missguided', 'topshop', 'mango', 'reformation', 'everlane', 'gap',
      'oldnavy', 'banana', 'republic', 'jcrew', 'abercrombie', 'hollister', 'ae',
      'americaneagle', 'urbanoutfitters', 'uo', 'freepeople', 'anthropologie',
      'lululemon', 'athleta', 'target', 'walmart', 'amazon', 'essentials',
      // Sneaker brands & culture
      'jordan', 'jordans', 'airjordan', 'airmax', 'airforce', 'af1', 'dunks',
      'yeezy', 'newbalance', 'nb', 'converse', 'vans', 'puma', 'reebok', 'asics',
      'saucony', 'hoka', 'on', 'brooks', 'salomon', 'crocs', 'birkenstock',
      'drmartens', 'docs', 'timberland', 'ugg', 'uggs', 'sneakerhead', 'kicksonfire',
      'goat', 'stockx', 'snkrs', 'sneakers', 'kicks', 'hype', 'hypebeast', 'grail',
      'deadstock', 'ds', 'vnds', 'resell', 'resale', 'cop', 'drop', 'raffle',
      // Clothing items
      'jeans', 'denim', 'pants', 'trousers', 'shorts', 'skirt', 'blouse', 'shirt',
      'tshirt', 'tee', 'hoodie', 'sweater', 'cardigan', 'jacket', 'coat', 'blazer',
      'suit', 'tuxedo', 'gown', 'jumpsuit', 'romper', 'leggings', 'activewear',
      'athleisure', 'sportswear', 'loungewear', 'pajamas', 'lingerie', 'underwear',
      'swimsuit', 'bikini', 'swimwear', 'beachwear', 'sunglasses', 'handbag', 'purse',
      'tote', 'clutchbag', 'backpack', 'belt', 'watch', 'watches', 'bracelet', 'necklace',
      'earrings', 'ring', 'rings', 'scarf', 'hat', 'cap', 'beanie', 'boots',
      // Fashion events & media
      'fashionweek', 'nyfw', 'pfw', 'mfw', 'lfw', 'metgala', 'met', 'gala',
      'vogue', 'elle', 'harpersbazaar', 'wmagazine', 'gq', 'esquire', 'cosmopolitan',
      'glamour', 'instyle', 'allure', 'refinery29', 'whowhatwear', 'manrepeller',
      // Fashion terms
      'couture', 'hautecouture', 'readytowear', 'rtw', 'prêtàporter', 'capsule',
      'collection', 'lookbook', 'editorial', 'photoshoot', 'model', 'modeling',
      'supermodel', 'catwalk', 'fitting', 'tailored', 'bespoke', 'custom', 'sizing',
      'petite', 'plus', 'size', 'inclusive', 'sustainable', 'ethical', 'slow',
      'conscious', 'upcycle', 'secondhand', 'resale', 'consignment', 'depop', 'poshmark',
      'therealreal', 'vestiaire', 'collective', 'grailed', 'ebay'
    ],
    'beauty': [
      // Core terms - removed 'highlight' (conflicts with sports highlights), 'glow' (too generic)
      'beauty', 'makeup', 'skincare', 'cosmetics', 'hair', 'nails', 'glam',
      'foundation', 'lipstick', 'mascara', 'eyeshadow', 'contour', 'highlighter',
      'moisturizer', 'serum', 'cleanser', 'spf', 'sunscreen', 'acne',
      'sephora', 'ulta', 'drugstore', 'haul', 'grwm', 'routine', 'transformation',
      // Makeup products
      'concealer', 'primer', 'powder', 'blush', 'bronzer', 'illuminator', 'setting',
      'spray', 'eyeliner', 'brow', 'brows', 'eyebrow', 'lashes', 'falsies', 'extensions',
      'lipgloss', 'lipliner', 'lipbalm', 'chapstick', 'tint', 'stain', 'matte',
      'satin', 'dewy', 'glowy', 'natural', 'snatched', 'baking', 'blend',
      'blending', 'buffing', 'stippling', 'cutcrease', 'crease', 'smokey', 'smokeyeye',
      'wingedliner', 'cateye', 'liner', 'waterproof', 'longwear', 'fullcoverage', 'sheer',
      // Skincare
      'cleanser', 'toner', 'essence', 'ampoule', 'moisturizer', 'cream', 'lotion',
      'oil', 'balm', 'exfoliate', 'exfoliator', 'scrub', 'peel', 'mask', 'sheet',
      'clay', 'mud', 'overnight', 'sleeping', 'retinol', 'retinoid', 'vitamin',
      'vitaminc', 'niacinamide', 'hyaluronic', 'acid', 'aha', 'bha', 'salicylic',
      'glycolic', 'lactic', 'peptide', 'collagen', 'antioxidant', 'antiaging',
      'wrinkle', 'fine', 'lines', 'dark', 'spots', 'hyperpigmentation', 'melasma',
      'redness', 'rosacea', 'sensitive', 'oily', 'dry', 'combination', 'normal',
      'barrier', 'microbiome', 'ph', 'balance', 'hydrating', 'hydration', 'plump',
      'plumping', 'firming', 'brightening', 'radiant', 'radiance', 'dull', 'dullness',
      // Beauty brands
      'maccosmetics', 'mac', 'nars', 'urbandecay', 'toofaced', 'tartecosmetics',
      'benefitcosmetics', 'benefit', 'clinique', 'esteelauder', 'lancome', 'ysl',
      'charlottetilbury', 'ct', 'patmcgrath', 'fentybeauty', 'fenty', 'rarebeauty',
      'hauslabs', 'kyliecosmetics', 'kkwbeauty', 'kimkardashian', 'morphe', 'colourpop',
      'elfcosmetics', 'elf', 'nyx', 'maybelline', 'loreal', 'revlon', 'covergirl',
      'milani', 'wetandwild', 'essence', 'catrice', 'theordinary', 'cerave', 'cetaphil',
      'larochposay', 'larocheposay', 'neutrogena', 'aveeno', 'olay', 'garnier',
      'skinfix', 'drunk', 'elephant', 'drunkelephant', 'tatcha', 'skii', 'sulwhasoo',
      'laneige', 'innisfree', 'cosrx', 'etudehouse', 'missha', 'tonymoly', 'holika',
      'banilaco', 'heimish', 'klairs', 'purito', 'isntree', 'beauty', 'joseon',
      'glow', 'recipe', 'somebymi', 'roundlab', 'illiyoon', 'aesop', 'glossier',
      'summerfridays', 'supergoop', 'sundayriiley', 'olehenriksen', 'origins',
      'kiehl', 'kiehls', 'fresh', 'belief', 'lamer', 'skinceuticals',
      // Hair
      'haircare', 'shampoo', 'conditioner', 'hairmask', 'leavein', 'heatprotectant',
      'blowout', 'blowdry', 'curls', 'curly', 'curlyhair', 'curlygirl', 'cgm',
      'straight', 'straightening', 'flatiron', 'curlingiron', 'wand', 'waves',
      'wavy', 'beach', 'texture', 'volume', 'volumizing', 'thickening', 'thinning',
      'hairloss', 'growth', 'scalp', 'dandruff', 'oily', 'dry', 'damaged', 'repair',
      'bond', 'olaplex', 'kerastase', 'redken', 'joico', 'paul', 'mitchell',
      'bedhead', 'tigi', 'bumble', 'matrix', 'moroccan', 'moroccanoil', 'argan',
      'dye', 'color', 'balayage', 'lowlights', 'ombre', 'sombre', 'haircolor',
      'platinum', 'blonde', 'brunette', 'redhead', 'ginger', 'black', 'auburn',
      'salon', 'stylist', 'hairstylist', 'barber', 'haircut', 'trim', 'layers',
      'bangs', 'fringe', 'bob', 'lob', 'pixie', 'shag', 'mullet', 'fade', 'taper',
      // Nails
      'manicure', 'pedicure', 'nailart', 'gelnails', 'gel', 'acrylics', 'dip',
      'dippowder', 'polygel', 'shellac', 'opi', 'essie', 'sally', 'hansen',
      'orly', 'zoya', 'chanel', 'nailpolish', 'lacquer', 'topcoat', 'basecoat',
      'cuticle', 'nailtech', 'nailtechnician', 'pressons', 'nailstickers'
    ],
    'food': [
      // Core terms
      'food', 'recipe', 'cooking', 'eat', 'restaurant', 'delicious', 'yummy', 'foodie',
      'chef', 'kitchen', 'meal', 'dinner', 'lunch', 'breakfast', 'brunch', 'snack',
      'bake', 'baking', 'dessert', 'cake', 'cookie', 'pizza', 'burger', 'sushi',
      'vegan', 'vegetarian', 'keto', 'healthy', 'homemade', 'takeout', 'delivery',
      'michelin', 'yelp', 'doordash', 'ubereats', 'grubhub', 'mukbang', 'asmr',
      // Popular food accounts
      'giallozafferano', 'tasty', 'buzzfeedtasty', 'delish', 'foodnetwork', 'bonappetit',
      'epicurious', 'seriouseats', 'babish', 'bingingwithbabish', 'joshuaweissman',
      'gordonramsay', 'nigella', 'jamieoliver', 'minimalistbaker', 'halfbakedharvest',
      // Cuisines
      'italian', 'mexican', 'chinese', 'japanese', 'korean', 'thai', 'vietnamese',
      'indian', 'mediterranean', 'greek', 'french', 'spanish', 'american', 'southern',
      'cajun', 'creole', 'bbq', 'barbecue', 'tex', 'mex', 'texmex', 'caribbean',
      'cuban', 'brazilian', 'peruvian', 'argentinian', 'middle', 'eastern', 'lebanese',
      'turkish', 'moroccan', 'ethiopian', 'nigerian', 'ghanaian', 'jamaican', 'hawaiian',
      'filipino', 'indonesian', 'malaysian', 'singaporean', 'taiwanese', 'cantonese',
      'szechuan', 'sichuan', 'hunan', 'dimsum', 'ramen', 'udon', 'soba', 'pho',
      'bibimbap', 'bulgogi', 'kimchi', 'tacos', 'burritos', 'enchiladas', 'tamales',
      'pasta', 'risotto', 'gnocchi', 'lasagna', 'ravioli', 'carbonara', 'bolognese',
      'curry', 'tikka', 'masala', 'biryani', 'naan', 'samosa', 'tandoori', 'paneer',
      // Foods & dishes
      'chicken', 'beef', 'pork', 'lamb', 'steak', 'ribs', 'wings', 'seafood',
      'fish', 'salmon', 'tuna', 'shrimp', 'lobster', 'crab', 'oyster', 'scallops',
      'egg', 'eggs', 'bacon', 'sausage', 'pancake', 'waffle', 'french', 'toast',
      'omelette', 'omelet', 'scrambled', 'poached', 'benedict', 'avocado', 'toast',
      'sandwich', 'sub', 'wrap', 'salad', 'soup', 'stew', 'chili', 'gumbo',
      'fried', 'rice', 'noodles', 'stirfry', 'wok', 'dumplings', 'spring', 'rolls',
      'eggroll', 'wonton', 'gyoza', 'tempura', 'teriyaki', 'katsu', 'tonkatsu',
      'poke', 'sashimi', 'nigiri', 'maki', 'roll', 'omakase', 'kaiseki',
      // Baking & desserts
      'bread', 'sourdough', 'baguette', 'croissant', 'pastry', 'danish', 'muffin',
      'scone', 'biscuit', 'pie', 'tart', 'cobbler', 'crumble', 'brownie', 'blondie',
      'cupcake', 'cheesecake', 'tiramisu', 'creme', 'brulee', 'mousse', 'pudding',
      'custard', 'flan', 'gelato', 'icecream', 'sorbet', 'popsicle', 'macaron',
      'macaroon', 'meringue', 'eclair', 'profiterole', 'churro', 'donut', 'doughnut',
      'cinnamon', 'roll', 'chocolate', 'vanilla', 'strawberry', 'caramel', 'butterscotch',
      // Drinks
      'coffee', 'espresso', 'latte', 'cappuccino', 'americano', 'mocha', 'macchiato',
      'coldbrew', 'iced', 'frappuccino', 'starbucks', 'dunkin', 'tea', 'boba',
      'bubbletea', 'matcha', 'chai', 'smoothie', 'juice', 'lemonade', 'soda',
      'cocktail', 'mocktail', 'wine', 'beer', 'craft', 'ipa', 'lager', 'ale',
      'whiskey', 'bourbon', 'vodka', 'gin', 'rum', 'tequila', 'mezcal', 'sake',
      // Diets & trends
      'glutenfree', 'dairyfree', 'plantbased', 'whole30', 'paleo', 'lowcarb',
      'highprotein', 'organic', 'nongmo', 'farmtotable', 'locavore', 'sustainable',
      'mealprep', 'macros', 'iifym', 'calories', 'nutrition', 'nutritious',
      // Cooking methods
      'grill', 'grilling', 'roast', 'roasting', 'saute', 'sauteing', 'braise',
      'braising', 'simmer', 'simmering', 'boil', 'steam', 'steaming', 'poach',
      'poaching', 'sear', 'searing', 'smoke', 'smoking', 'sous', 'vide', 'sousvide',
      'airfryer', 'instantpot', 'slowcooker', 'crockpot', 'cast', 'iron', 'skillet',
      // Restaurant & food media
      'finedining', 'casual', 'fastfood', 'fast', 'food', 'drivethru', 'carryout',
      'reservation', 'opentable', 'resy', 'zagat', 'eater', 'bonappetit', 'bon',
      'appetit', 'foodnetwork', 'masterchef', 'hellskitchen', 'topchef', 'chopped',
      'gordonramsay', 'bobbyflay', 'guyfieri', 'ina', 'garten', 'barefoot', 'contessa',
      'altonbrown', 'kenji', 'seriouseats', 'americas', 'test', 'kitchen', 'atk',
      'tasty', 'buzzfeedtasty', 'delish', 'epicurious', 'allrecipes', 'foodgawker',
      // Restaurants & chains
      'mcdonalds', 'wendys', 'burgerking', 'chickfila', 'popeyes', 'kfc', 'taco',
      'bell', 'chipotle', 'qdoba', 'subway', 'jersey', 'mikes', 'panera', 'sweetgreen',
      'cava', 'shake', 'shack', 'innout', 'fiveguys', 'whataburger', 'culvers',
      'wingstop', 'buffalowildwings', 'bdubs', 'dominos', 'pizzahut', 'papajohns',
      'littlecaesars', 'olive', 'garden', 'chilis', 'applebees', 'tgifridays',
      'outback', 'steakhouse', 'cheesecakefactory', 'pf', 'changs', 'benihana'
    ],
    'fitness': [
      // Core terms
      'fitness', 'gym', 'workout', 'exercise', 'training', 'muscle', 'gains',
      'lift', 'lifting', 'weights', 'cardio', 'hiit', 'crossfit', 'yoga', 'pilates',
      'protein', 'supplements', 'bodybuilding', 'physique', 'strength', 'endurance',
      'marathon', 'running', 'jogging', 'cycling', 'swimming', 'athlete', 'coach',
      'peloton', 'orangetheory', 'equinox', 'planetfitness', 'pr', 'pb', 'reps', 'sets',
      // Exercises & movements
      'squat', 'squats', 'deadlift', 'deadlifts', 'bench', 'press', 'benchpress',
      'overhead', 'ohp', 'row', 'rows', 'pullup', 'pullups', 'chinup', 'chinups',
      'pushup', 'pushups', 'dip', 'dips', 'curl', 'curls', 'bicep', 'biceps',
      'tricep', 'triceps', 'shoulder', 'shoulders', 'chest', 'back', 'leg', 'legs',
      'glute', 'glutes', 'quad', 'quads', 'hamstring', 'hamstrings', 'calf', 'calves',
      'core', 'abs', 'abdominal', 'plank', 'crunch', 'crunches', 'situp', 'situps',
      'lunge', 'lunges', 'step', 'stepup', 'box', 'jump', 'burpee', 'burpees',
      'kettlebell', 'kb', 'dumbbell', 'db', 'barbell', 'bb', 'cable', 'machine',
      'freeweights', 'resistance', 'band', 'bands', 'trx', 'suspension', 'bodyweight',
      // Cardio & endurance
      'run', 'runner', 'runners', 'jog', 'jogger', 'sprint', 'sprints', 'sprinting',
      'interval', 'intervals', 'tempo', 'pace', 'mile', 'mileage', '5k', '10k',
      'halfmarathon', 'fullmarathon', 'ultra', 'ultramarathon', 'triathlon', 'ironman',
      'bike', 'biking', 'cyclist', 'spin', 'spinning', 'cycle', 'indoor', 'outdoor',
      'swim', 'swimmer', 'lap', 'laps', 'pool', 'openwater', 'elliptical', 'stairmaster',
      'treadmill', 'rower', 'rowing', 'ergometer', 'erg', 'assault', 'airbike', 'airdyne',
      // Yoga & flexibility
      'vinyasa', 'hatha', 'ashtanga', 'bikram', 'hot', 'yin', 'restorative', 'power',
      'flow', 'asana', 'pose', 'poses', 'downward', 'dog', 'warrior', 'sun', 'salutation',
      'namaste', 'om', 'breath', 'breathing', 'pranayama', 'meditation', 'mindful',
      'stretch', 'stretching', 'flexibility', 'mobility', 'foam', 'roller', 'rolling',
      'recovery', 'restday', 'activerecovery', 'deload', 'massage', 'sportstherapy',
      // Nutrition & supplements
      'preworkout', 'postworkout', 'pre', 'post', 'bcaa', 'creatine', 'whey', 'casein',
      'isolate', 'concentrate', 'mass', 'gainer', 'lean', 'bulk', 'bulking', 'cut',
      'cutting', 'shred', 'shredded', 'ripped', 'toned', 'definition', 'fat', 'loss',
      'fatloss', 'weightloss', 'transformation', 'before', 'after', 'progress', 'pic',
      'macro', 'macros', 'calorie', 'deficit', 'surplus', 'maintenance', 'tdee', 'bmr',
      // Fitness influencers & brands
      'myprotein', 'optimum', 'nutrition', 'on', 'bsn', 'cellucor', 'c4', 'ghost',
      'gorilla', 'mind', 'ryse', 'alani', 'nu', 'gymshark', 'alphalete', 'youngla',
      'vuori', 'outdoor', 'voices', 'alo', 'beyond', 'buffbunny', 'ptula', 'fabletics',
      'cbum', 'cbumstead', 'ronniecoleman', 'arnoldschwarzenegger', 'arnold', 'zyzz',
      'davidlaid', 'jeffnippard', 'athleanx', 'jeffcavaliere', 'gregdoucette', 'mpmd',
      'derekmpmd', 'natacha', 'oceane', 'whitneyysimmons', 'kayla', 'itsines', 'bbg',
      // Gyms & programs
      'goldsgym', 'lifetime', '24hour', 'anytime', 'la', 'crunch', 'ymca', 'blink',
      'f45', 'barrys', 'soulcycle', 'rumble', 'solidcore', 'club', 'pilates',
      'stronglifts', '5x5', 'starting', 'strength', 'ss', 'ppl', 'push', 'pull',
      'bro', 'split', 'upper', 'lower', 'full', 'body', 'program', 'routine',
      'plan', 'schedule', 'progressive', 'overload', 'volume', 'intensity', 'frequency'
    ],
    'travel': [
      // Core terms
      'travel', 'vacation', 'trip', 'adventure', 'explore', 'destination', 'wanderlust',
      'flight', 'airport', 'hotel', 'resort', 'airbnb', 'booking', 'itinerary',
      'beach', 'mountain', 'hiking', 'roadtrip', 'backpack', 'passport', 'visa',
      'tourist', 'sightseeing', 'landmark', 'bucket', 'list', 'getaway', 'escape',
      // Transportation
      'airline', 'airlines', 'plane', 'airplane', 'jet', 'fly', 'flying', 'layover',
      'connecting', 'direct', 'nonstop', 'firstclass', 'business', 'economy', 'upgrade',
      'boarding', 'pass', 'gate', 'terminal', 'tsa', 'precheck', 'global', 'entry',
      'lounge', 'priority', 'miles', 'rewardpoints', 'rewards', 'frequentflyer', 'airmiles',
      'delta', 'united', 'american', 'southwest', 'jetblue', 'alaska', 'spirit',
      'frontier', 'hawaiian', 'british', 'airways', 'lufthansa', 'airfrance', 'klm',
      'emirates', 'qatar', 'singapore', 'cathay', 'pacific', 'ana', 'jal', 'qantas',
      'train', 'rail', 'amtrak', 'eurostar', 'shinkansen', 'bullet', 'metro', 'subway',
      'bus', 'coach', 'cruise', 'cruiseship', 'carnival', 'royal', 'caribbean', 'norwegian',
      'princess', 'disney', 'msc', 'celebrity', 'holland', 'viking', 'ferry', 'boat',
      'car', 'rental', 'hertz', 'avis', 'enterprise', 'budget', 'national', 'alamo',
      'uber', 'lyft', 'taxi', 'cab', 'rideshare', 'transfer', 'shuttle',
      // Accommodations
      'hilton', 'marriott', 'hyatt', 'ihg', 'wyndham', 'choice', 'bestwestern', 'radisson',
      'sheraton', 'westin', 'ritz', 'carlton', 'ritzcarlton', 'fourseasons', 'stregis',
      'waldorf', 'astoria', 'park', 'intercontinental', 'sofitel', 'fairmont',
      'boutique', 'hostel', 'motel', 'inn', 'bnb', 'vrbo', 'homeaway', 'couchsurfing',
      'glamping', 'camping', 'tent', 'rv', 'camper', 'van', 'vanlife',
      // Popular destinations
      'paris', 'london', 'tokyo', 'newyork', 'nyc', 'la', 'losangeles', 'sanfrancisco',
      'miami', 'lasvegas', 'vegas', 'orlando', 'chicago', 'boston', 'seattle', 'denver',
      'austin', 'nashville', 'neworleans', 'nola', 'hawaii', 'maui', 'oahu', 'kauai',
      'cancun', 'cabo', 'puertovallarta', 'tulum', 'playadelcarmen', 'jamaica', 'bahamas',
      'puntacana', 'aruba', 'stlucia', 'barbados', 'bermuda', 'virgin', 'islands',
      'rome', 'florence', 'venice', 'milan', 'amalfi', 'coast', 'cinque', 'terre',
      'barcelona', 'madrid', 'ibiza', 'mallorca', 'lisbon', 'porto', 'algarve',
      'amsterdam', 'berlin', 'munich', 'vienna', 'prague', 'budapest', 'krakow',
      'athens', 'santorini', 'mykonos', 'crete', 'dubrovnik', 'split', 'croatia',
      'switzerland', 'alps', 'zurich', 'geneva', 'interlaken', 'iceland', 'reykjavik',
      'norway', 'fjord', 'fjords', 'sweden', 'stockholm', 'copenhagen', 'denmark',
      'ireland', 'dublin', 'scotland', 'edinburgh', 'highlands',
      'dubai', 'abudhabi', 'qatar', 'doha', 'maldives', 'seychelles', 'mauritius',
      'bali', 'indonesia', 'thailand', 'bangkok', 'phuket', 'chiangmai', 'vietnam',
      'hanoi', 'hochiminh', 'saigon', 'cambodia', 'angkor', 'wat', 'singapore',
      'malaysia', 'kualalumpur', 'philippines', 'boracay', 'palawan', 'cebu',
      'japan', 'kyoto', 'osaka', 'hokkaido', 'okinawa', 'korea', 'seoul', 'busan',
      'china', 'beijing', 'shanghai', 'hongkong', 'macau', 'taiwan', 'taipei',
      'australia', 'sydney', 'melbourne', 'brisbane', 'goldcoast', 'cairns', 'barrier',
      'reef', 'newzealand', 'auckland', 'queenstown', 'fiji', 'tahiti', 'bora',
      'southafrica', 'capetown', 'safari', 'kenya', 'tanzania', 'serengeti', 'morocco',
      'marrakech', 'egypt', 'cairo', 'pyramids', 'israel', 'jerusalem', 'telaviv',
      'peru', 'lima', 'machu', 'picchu', 'cusco', 'colombia', 'cartagena', 'medellin',
      'brazil', 'rio', 'janeiro', 'saopaulo', 'argentina', 'buenosaires', 'patagonia',
      'chile', 'santiago', 'costarica', 'panama', 'ecuador', 'galapagos',
      // Travel activities
      'snorkel', 'snorkeling', 'scuba', 'diving', 'dive', 'surf', 'surfing', 'kayak',
      'kayaking', 'paddleboard', 'sup', 'jet', 'ski', 'jetski', 'parasail', 'parasailing',
      'zipline', 'ziplining', 'bungee', 'skydive', 'skydiving', 'paraglide', 'paragliding',
      'trek', 'trekking', 'climb', 'climbing', 'summit', 'peak', 'trail', 'trails',
      'national', 'park', 'parks', 'yosemite', 'yellowstone', 'grandcanyon', 'zion',
      'glacier', 'acadia', 'everglades', 'joshua', 'tree', 'sequoia', 'redwoods',
      // Travel planning
      'expedia', 'kayak', 'skyscanner', 'google', 'flights', 'hopper', 'priceline',
      'orbitz', 'travelocity', 'tripadvisor', 'lonely', 'planet', 'fodors', 'frommers',
      'rick', 'steves', 'nomadic', 'matt', 'thepoints', 'guy', 'onebag', 'packing',
      'luggage', 'suitcase', 'carryon', 'checkedbag', 'duffel', 'travel', 'hack', 'hacks'
    ],
    'tech': [
      // Core terms
      'tech', 'technology', 'gadget', 'phone', 'computer', 'app', 'software', 'ai',
      'iphone', 'android', 'samsung', 'apple', 'google', 'microsoft', 'amazon',
      'laptop', 'tablet', 'smartwatch', 'airpods', 'headphones', 'device', 'upgrade',
      'chatgpt', 'openai', 'claude', 'gemini', 'llm', 'machine', 'learning',
      'crypto', 'bitcoin', 'ethereum', 'blockchain', 'nft', 'web3', 'metaverse',
      'startup', 'silicon', 'valley', 'founder', 'vc', 'funding', 'unicorn',
      // Devices & hardware
      'smartphone', 'mobile', 'cell', 'cellphone', 'ios', 'ipados', 'macos', 'windows',
      'linux', 'ubuntu', 'chromebook', 'chromeos', 'macbook', 'imac', 'mac', 'mini',
      'pro', 'max', 'air', 'studio', 'surface', 'thinkpad', 'dell', 'xps', 'hp',
      'lenovo', 'asus', 'acer', 'razer', 'msi', 'alienware', 'rog', 'legion',
      'pixel', 'galaxy', 'note', 'fold', 'flip', 'oneplus', 'xiaomi', 'oppo', 'vivo',
      'huawei', 'motorola', 'nothing', 'ipad', 'kindle', 'fire', 'echo', 'alexa',
      'homepod', 'nest', 'ring', 'blink', 'wyze', 'arlo', 'eufy', 'smartspeaker',
      'applewatch', 'watchos', 'fitbit', 'garmin', 'whoop', 'oura', 'wearable',
      'airpodspro', 'airpodsmax', 'buds', 'earbuds', 'wireless', 'bluetooth', 'anc',
      'noisecancelling', 'sony', 'wh1000xm', 'bose', 'sennheiser', 'jabra', 'beats',
      'jbl', 'soundbar', 'speaker', 'sonos', 'hometheatre', 'receiver', 'amplifier',
      'tv', 'television', 'oled', 'qled', 'miniled', 'microled', '4k', '8k', 'hdr',
      'lg', 'tcl', 'hisense', 'vizio', 'roku', 'firetv', 'appletv', 'chromecast',
      'monitor', 'display', 'ultrawide', 'curved', 'gaming', 'hz', '144hz', '240hz',
      'gpu', 'graphics', 'card', 'nvidia', 'rtx', 'geforce', 'amd', 'radeon', 'intel',
      'cpu', 'processor', 'chip', 'chipset', 'm1', 'm2', 'm3', 'arm', 'snapdragon',
      'ram', 'memory', 'ssd', 'storage', 'hard', 'drive', 'hdd', 'nvme', 'usb', 'typec',
      'thunderbolt', 'hdmi', 'displayport', 'dock', 'hub', 'charger', 'wireless', 'charging',
      'magsafe', 'qi', 'powerbank', 'battery', 'fast', 'charging',
      // Software & apps
      'ios', 'update', 'beta', 'release', 'version', 'download', 'install', 'appstore',
      'playstore', 'play', 'store', 'subscription', 'saas', 'cloud', 'aws', 'azure',
      'gcp', 'firebase', 'vercel', 'netlify', 'heroku', 'digitalocean', 'cloudflare',
      'notion', 'obsidian', 'roam', 'evernote', 'onenote', 'todoist', 'asana', 'trello',
      'monday', 'clickup', 'linear', 'jira', 'confluence', 'slack', 'teams', 'zoom',
      'meet', 'webex', 'figma', 'sketch', 'adobe', 'photoshop', 'illustrator', 'premiere',
      'aftereffects', 'lightroom', 'canva', 'finalcut', 'davinci', 'resolve', 'logic',
      'protools', 'ableton', 'fl', 'studio', 'garageband', 'vscode', 'visualstudio',
      'xcode', 'android', 'studio', 'intellij', 'pycharm', 'webstorm', 'sublime', 'vim',
      // Programming & development
      'code', 'coding', 'programming', 'developer', 'dev', 'devops', 'frontend', 'backend',
      'fullstack', 'web', 'dev', 'mobile', 'dev', 'api', 'rest', 'graphql', 'database',
      'sql', 'nosql', 'mongodb', 'postgres', 'mysql', 'redis', 'elasticsearch',
      'javascript', 'typescript', 'python', 'java', 'kotlin', 'swift', 'rust', 'go',
      'golang', 'cpp', 'csharp', 'ruby', 'php', 'scala', 'haskell', 'elixir',
      'react', 'vue', 'angular', 'svelte', 'nextjs', 'nuxt', 'remix', 'gatsby',
      'node', 'nodejs', 'deno', 'bun', 'express', 'fastapi', 'django', 'flask',
      'rails', 'laravel', 'spring', 'dotnet', 'docker', 'kubernetes', 'k8s', 'terraform',
      'git', 'github', 'gitlab', 'bitbucket', 'pr', 'pullrequest', 'merge', 'commit',
      'branch', 'repo', 'repository', 'opensource', 'oss', 'license', 'mit', 'apache',
      // AI & ML
      'artificial', 'intelligence', 'ml', 'deep', 'learning', 'neural', 'network',
      'transformer', 'gpt', 'gpt4', 'gpt5', 'anthropic', 'perplexity', 'midjourney',
      'dalle', 'dall', 'stablediffusion', 'stable', 'diffusion', 'imagen', 'sora',
      'copilot', 'cursor', 'replit', 'v0', 'bolt', 'lovable', 'windsurf', 'codeium',
      'tabnine', 'prompt', 'prompting', 'promptengineering', 'rag', 'retrieval',
      'augmented', 'generation', 'finetuning', 'finetune', 'lora', 'qlora', 'inference',
      'embedding', 'embeddings', 'vector', 'vectordb', 'pinecone', 'weaviate', 'chroma',
      'langchain', 'llamaindex', 'huggingface', 'hf', 'pytorch', 'tensorflow', 'jax',
      // Crypto & Web3
      'cryptocurrency', 'btc', 'eth', 'solana', 'sol', 'cardano', 'ada', 'polkadot',
      'dot', 'avalanche', 'avax', 'polygon', 'matic', 'chainlink', 'link', 'uniswap',
      'uni', 'aave', 'maker', 'dai', 'usdc', 'usdt', 'tether', 'stablecoin', 'defi',
      'decentralized', 'finance', 'dex', 'cex', 'exchange', 'coinbase', 'binance',
      'kraken', 'gemini', 'ftx', 'wallet', 'metamask', 'ledger', 'trezor', 'coldwallet',
      'hotwallet', 'seed', 'phrase', 'private', 'key', 'public', 'key', 'hash', 'mining',
      'miner', 'stake', 'staking', 'proof', 'work', 'pow', 'stake', 'pos', 'validator',
      'gas', 'fees', 'transaction', 'block', 'smart', 'contract', 'solidity', 'erc20',
      'erc721', 'dao', 'governance', 'token', 'tokenomics', 'airdrop', 'whitelist',
      'mint', 'minting', 'opensea', 'blur', 'rarible', 'foundation', 'superrare',
      // Tech news & influencers
      'techcrunch', 'verge', 'wired', 'engadget', 'gizmodo', 'arstechnica', 'cnet',
      'tomshardware', 'anandtech', 'ltt', 'linustechtips', 'mkbhd', 'marquesbrownlee',
      'unboxtherapy', 'ijustine', 'austinnevans', 'dave2d', 'mrwhosetheboss', 'jerryrig',
      'everything', 'jre', 'lexfridman', 'lex', 'fridman', 'elonmusk', 'elon', 'musk',
      'tesla', 'spacex', 'neuralink', 'boring', 'company', 'zuckerberg', 'meta',
      'facebook', 'instagram', 'whatsapp', 'threads', 'oculus', 'quest', 'vr', 'ar',
      'xr', 'mixed', 'reality', 'vision', 'pro', 'hololens', 'magicleap', 'pichai',
      'sundar', 'satyanadella', 'nadella', 'timcook', 'cook', 'jensen', 'huang', 'nvidia',
      'samaltman', 'altman', 'darioadomei', 'andrej', 'karpathy', 'ilya', 'sutskever'
    ],
    'gaming': [
      // Core terms - removed ambiguous words: game, stream, pc, meta, content, creator,
      // youtube, discord, league, update, patch, switch, epic (too common in sports/tech)
      'gaming', 'gamer', 'twitch', 'esports', 'playstation', 'xbox',
      'nintendo', 'ps5', 'steam', 'fortnite', 'minecraft',
      'valorant', 'legends', 'cod', 'warzone', 'apex', 'gta', 'zelda',
      'speedrun', 'achievement', 'trophy', 'dlc',
      'streamer', 'raid', 'clan', 'guild',
      // Platforms & hardware
      'playstation5', 'ps4', 'ps3', 'ps2', 'ps1', 'psp', 'vita', 'dualshock', 'dualsense',
      'xboxone', 'xboxseriesx', 'xboxseriess', 'xbox360', 'xboxlive', 'gamepass',
      'nintendoswitch', 'oled', 'lite', 'wii', 'wiiu', '3ds', '2ds', 'ds', 'gameboy',
      'joycon', 'procontroller', 'amiibo', 'eshop', 'direct', 'nintendodirect',
      'pcgaming', 'pcmasterrace', 'pcmr', 'battlestation', 'setup', 'rig', 'build',
      'steamdeck', 'deck', 'rogally', 'ally', 'legion', 'go', 'handheld', 'portable',
      'vr', 'virtualreality', 'oculus', 'quest2', 'quest3', 'psvr', 'psvr2', 'valve',
      'index', 'htcvive', 'vive', 'beatsaber', 'halflife', 'alyx',
      // Popular games
      'callofduty', 'modernwarfare', 'mw2', 'mw3', 'blackops', 'coldwar', 'vanguard',
      'battlefield', 'bf', 'halo', 'haloinfinite', 'destiny', 'destiny2', 'd2',
      'overwatch', 'ow2', 'overwatch2', 'csgo', 'cs2', 'counterstrike', 'siege',
      'rainbow', 'six', 'r6', 'pubg', 'battlegrounds', 'fortnite', 'fn', 'apex',
      'legends', 'apexlegends', 'warzone2', 'dmz', 'tarkov', 'escapefromtarkov', 'eft',
      'leagueoflegends', 'lol', 'dota', 'dota2', 'valorant', 'val', 'riot', 'riotgames',
      'gta5', 'gta6', 'gtaonline', 'rdr', 'rdr2', 'reddeadredemption', 'rockstar',
      'eldenring', 'elden', 'ring', 'darksouls', 'bloodborne', 'sekiro', 'fromsoftware',
      'fromsoft', 'soulslike', 'soulsborne', 'armored', 'core', 'armoredcore',
      'finalfantasy', 'ff', 'ff7', 'ff14', 'ff16', 'ffxiv', 'squareenix', 'square',
      'enix', 'kingdomhearts', 'kh', 'dragonquest', 'dq', 'nier', 'automata',
      'persona', 'persona5', 'p5', 'smt', 'shinmegamitensei', 'atlus', 'fire',
      'emblem', 'fireemblem', 'fe', 'xenoblade', 'chronicles', 'metroid', 'prime',
      'kirby', 'pokemon', 'scarlet', 'violet', 'sv', 'unite', 'pokemongo', 'pogo',
      'mariokart', 'mk8', 'smashbros', 'smash', 'ultimate', 'ssbu', 'splatoon',
      'splatoon3', 'animalcrossing', 'acnh', 'newhorizons', 'tearsofthekingdom',
      'totk', 'breathofthewild', 'botw', 'zeldatotk',
      'diablo', 'diablo4', 'd4', 'wow', 'worldofwarcraft', 'dragonflight', 'blizzard',
      'hearthstone', 'hs', 'starcraft', 'sc2', 'warcraft', 'bethesda', 'starfield',
      'skyrim', 'fallout', 'fallout4', 'fallout76', 'elderscrolls', 'tes', 'eso',
      'baldursgate', 'baldursgate3', 'bg3', 'larian', 'divinity', 'dos2',
      'hogwarts', 'legacy', 'hogwartslegacy', 'spiderman', 'spiderman2', 'miles',
      'morales', 'insomniac', 'ratchet', 'clank', 'godofwar', 'gow', 'ragnarok',
      'horizon', 'zerodawn', 'forbiddenwest', 'guerrilla', 'naughtydog', 'lastofus',
      'tlou', 'tlou2', 'uncharted', 'ghostoftsushima', 'got', 'suckerpunch',
      'fifa', 'fc24', 'ea', 'easports', 'madden', 'nba2k', '2k', 'mlbtheshow',
      'nhl', 'pga', 'golf', 'sims', 'sims4', 'simcity', 'citiesskylines',
      'stardewvalley', 'stardew', 'terraria', 'valheim', 'rust', 'ark', 'survival',
      'dayz', 'subnautica', 'satisfactory', 'factorio', 'rimworld', 'crusaderkings',
      'ck3', 'europa', 'universalis', 'eu4', 'paradox', 'civilization', 'civ', 'civ6',
      'totalwar', 'warhammer', '40k', 'aoe', 'ageofempires', 'rts', 'strategy',
      // Gaming terms - heavily reduced to avoid sports/tech overlap
      // Removed: pro, clutch, carry, throw, choke (sports), tournament, championship, finals, etc. (sports)
      // Removed: fps, frames, bug, glitch, build, input, latency (tech)
      'noob', 'newbie', 'tryhard', 'sweaty',
      'loot', 'rng', 'gg', 'ggez', 'glhf', 'poggers', 'pog', 'pogchamp',
      'kappa', 'pepega', 'sadge', 'omegalul', 'lulw', 'monkas', 'copium', 'hopium',
      'respawn', 'spawn', 'camping', 'camper', 'quickscope', 'noscope', 'headshot',
      'aimbot', 'nerf', 'buff', 'overpowered', 'tierlist',
      'loadout', 'cooldown', 'dps', 'healer', 'adc',
      'jungler', 'laning', 'gank', 'inting', 'afk', 'ragequit',
      // Esports orgs & streamers (specific names only)
      'faze', 'fazeclan', '100thieves', '100t', 'tsm', 'c9', 'cloud9', 'g2', 'fnatic',
      'teamliquid', 'evilgeniuses', 'sentinels',
      'ninja', 'shroud', 'pokimane', 'xqc', 'ludwig',
      'sodapoppin', 'lirik', 'drdisrespect', 'tfue', 'bugha',
      'jacksepticeye', 'markiplier', 'pewdiepie', 'asmongold'
    ],
    'education': [
      // Core terms
      'education', 'learn', 'tutorial', 'howto', 'tips', 'guide', 'study', 'school',
      'university', 'college', 'degree', 'course', 'class', 'lecture', 'professor',
      'student', 'graduate', 'scholarship', 'exam', 'test', 'homework', 'assignment',
      'textbook', 'research', 'thesis', 'dissertation', 'academic', 'science', 'math',
      // Academic levels
      'elementary', 'middleschool', 'highschool', 'freshman', 'sophomore', 'junior',
      'senior', 'undergrad', 'undergraduate', 'postgrad', 'postgraduate', 'masters',
      'mba', 'phd', 'doctorate', 'doctoral', 'postdoc', 'faculty', 'dean', 'provost',
      'chancellor', 'principal', 'teacher', 'instructor', 'tutor', 'tutoring',
      // Subjects & fields
      'stem', 'steam', 'mathematics', 'algebra', 'geometry', 'calculus', 'statistics',
      'physics', 'chemistry', 'biology', 'biochem', 'neuroscience', 'psychology',
      'sociology', 'anthropology', 'economics', 'political', 'science', 'history',
      'geography', 'philosophy', 'linguistics', 'literature', 'english', 'writing',
      'composition', 'creative', 'writing', 'journalism', 'communications', 'media',
      'art', 'design', 'architecture', 'music', 'theater', 'dance', 'film', 'studies',
      'engineering', 'mechanical', 'electrical', 'civil', 'chemical', 'computer',
      'aerospace', 'biomedical', 'environmental', 'industrial', 'materials',
      'medicine', 'nursing', 'pharmacy', 'dentistry', 'veterinary', 'law', 'legal',
      'business', 'accounting', 'finance', 'marketing', 'management', 'hospitality',
      // Online learning
      'coursera', 'udemy', 'edx', 'skillshare', 'masterclass', 'linkedin', 'learning',
      'codecademy', 'freecodecamp', 'khan', 'academy', 'khanacademy', 'brilliant',
      'duolingo', 'babbel', 'rosetta', 'stone', 'memrise', 'anki', 'quizlet',
      'chegg', 'bartleby', 'studycom', 'sparknotes', 'cliffsnotes', 'grammarly',
      'elearning', 'mooc', 'webinar', 'workshop', 'bootcamp', 'certification',
      'certificate', 'credential', 'accredited', 'accreditation', 'curriculum',
      // Universities
      'harvard', 'yale', 'princeton', 'stanford', 'mit', 'caltech', 'berkeley',
      'ucla', 'usc', 'columbia', 'nyu', 'cornell', 'upenn', 'penn', 'brown',
      'dartmouth', 'duke', 'northwestern', 'uchicago', 'vanderbilt', 'notredame',
      'michigan', 'umich', 'virginia', 'uva', 'georgetown', 'emory', 'rice',
      'washu', 'wustl', 'tufts', 'tulane', 'boston', 'college', 'bc', 'bu',
      'northeastern', 'purdue', 'illinois', 'uiuc', 'wisconsin', 'minnesota',
      'ohiostate', 'osu', 'pennstate', 'psu', 'texas', 'ut', 'utaustin', 'tamu',
      'florida', 'uf', 'gatech', 'georgiatech', 'unc', 'chapelhill', 'arizona',
      'asu', 'colorado', 'oregon', 'washington', 'uw', 'oxford', 'cambridge',
      'imperial', 'lse', 'ucl', 'edinburgh', 'manchester', 'toronto', 'uoft',
      'mcgill', 'ubc', 'waterloo', 'sydney', 'melbourne', 'anu', 'nus', 'ntu',
      // Test prep
      'sat', 'act', 'gre', 'gmat', 'lsat', 'mcat', 'usmle', 'nclex', 'bar',
      'cpa', 'cfa', 'pmp', 'aws', 'cisco', 'ccna', 'comptia', 'prep', 'practice',
      'kaplan', 'princeton', 'review', 'magoosh', 'manhattan', 'testmasters',
      // Education terms
      'syllabus', 'semester', 'quarter', 'trimester', 'credit', 'credits', 'gpa',
      'transcript', 'diploma', 'commencement', 'graduation', 'alumni', 'alumnus',
      'alumna', 'endowment', 'tuition', 'financial', 'aid', 'fafsa', 'pell',
      'grant', 'loan', 'loans', 'studentloan', 'studentdebt', 'workstudy'
    ],
    'news': [
      // Core terms
      'news', 'breaking', 'update', 'report', 'headline', 'story', 'journalist',
      'media', 'press', 'coverage', 'investigation', 'exclusive', 'source', 'leak',
      'alert', 'developing', 'confirmed', 'official', 'statement', 'announcement',
      // News organizations
      'cnn', 'foxnews', 'msnbc', 'nbc', 'abc', 'cbs', 'bbc', 'reuters', 'ap',
      'associatedpress', 'afp', 'nyt', 'newyorktimes', 'washingtonpost', 'wapo',
      'wsj', 'wallstreetjournal', 'usatoday', 'latimes', 'chicagotribune', 'nypost',
      'guardian', 'independent', 'telegraph', 'dailymail', 'mirror', 'sun', 'times',
      'economist', 'atlantic', 'newyorker', 'vox', 'axios', 'politico', 'thehill',
      'realclearpolitics', 'rcp', 'fivethirtyeight', '538', 'huffpost', 'huffington',
      'buzzfeednews', 'vice', 'vicenews', 'slate', 'salon', 'thedailybeast', 'beast',
      'motherjones', 'thenation', 'nationalreview', 'reason', 'jacobin', 'intercept',
      'propublica', 'npr', 'pbs', 'newshour', 'c', 'span', 'cspan', 'aljazeera',
      'dw', 'france24', 'euronews', 'rt', 'scmp', 'japantimes', 'nikkei',
      'bloomberg', 'cnbc', 'ft', 'financialtimes', 'marketwatch', 'barrons', 'fortune',
      'forbes', 'businessinsider', 'bi', 'quartz', 'fastcompany', 'inc', 'entrepreneur',
      // Journalism terms
      'reporter', 'correspondent', 'anchor', 'editor', 'editorial', 'oped', 'column',
      'columnist', 'pundit', 'analyst', 'commentator', 'contributor', 'freelance',
      'investigative', 'expose', 'scoop', 'byline', 'dateline', 'lede', 'lead',
      'headline', 'subhead', 'caption', 'quote', 'soundbite', 'presser', 'briefing',
      'pressconference', 'interview', 'ontherecord', 'offtherecord', 'background',
      'deepbackground', 'anonymous', 'sources', 'whistleblower', 'leak', 'leaked',
      // News categories
      'local', 'national', 'international', 'world', 'global', 'domestic', 'foreign',
      'politics', 'government', 'policy', 'economy', 'business', 'markets', 'finance',
      'tech', 'science', 'health', 'environment', 'climate', 'weather', 'disaster',
      'crime', 'justice', 'courts', 'legal', 'military', 'defense', 'war', 'conflict',
      'terrorism', 'immigration', 'education', 'religion', 'culture', 'arts',
      'entertainment', 'sports', 'lifestyle', 'travel', 'food', 'real', 'estate',
      'opinion', 'analysis', 'commentary', 'factcheck', 'verification', 'debunk',
      // Current events markers
      'today', 'tonight', 'yesterday', 'thisweek', 'thismonth', 'thisyear', 'latest',
      'recent', 'ongoing', 'continues', 'update', 'updates', 'live', 'liveblog',
      'liveupdate', 'justIn', 'urgent', 'flash', 'bulletin', 'alert', 'alerts'
    ],
    'sports': [
      // Core terms
      'sports', 'football', 'basketball', 'soccer', 'nfl', 'nba', 'game', 'team',
      'highlights', 'highlight', 'houseofhighlights', 'sportscenter', 'espn',
      'bleacherreport', 'thescore', 'recap', 'replays', 'plays', 'dunk', 'touchdown',
      // Popular sports accounts
      'clutchpoints', 'clutchpointsnba', 'clutchpointsnfl', 'ballislife', 'overtime',
      'overtimeszn', 'slamonline', 'slam', 'brgridiron', 'pabortsline', 'actionnetworkhq',
      'nbaontnt', 'nbatv', 'nflnetwork', 'mlbnetwork', 'nhlnetwork', 'foxsports',
      'cbssports', 'nbcsports', 'yaabortsbook', 'draftkings', 'fanduel', 'barstoolsports',
      // NFL teams
      'raiders', 'chiefs', 'cowboys', 'eagles', 'patriots', 'packers', 'niners',
      '49ers', 'broncos', 'seahawks', 'ravens', 'steelers', 'bills', 'dolphins',
      'jets', 'giants', 'bears', 'lions', 'vikings', 'saints', 'falcons', 'bucs',
      'buccaneers', 'panthers', 'chargers', 'rams', 'cardinals', 'commanders',
      'bengals', 'browns', 'texans', 'colts', 'jaguars', 'titans',
      // NBA teams
      'lakers', 'celtics', 'warriors', 'bulls', 'heat', 'knicks', 'nets', 'sixers',
      'suns', 'mavs', 'mavericks', 'spurs', 'rockets', 'clippers', 'nuggets', 'jazz',
      'blazers', 'thunder', 'grizzlies', 'pelicans', 'hawks', 'hornets', 'wizards',
      'pistons', 'pacers', 'bucks', 'cavs', 'cavaliers', 'raptors', 'magic', 'kings',
      // MLB teams
      'yankees', 'dodgers', 'redsox', 'cubs', 'mets', 'astros', 'braves', 'phillies',
      'padres', 'mariners', 'cardinals', 'giants', 'angels', 'twins', 'guardians',
      'rangers', 'orioles', 'rays', 'bluejays', 'whitesox', 'tigers', 'royals',
      'athletics', 'marlins', 'brewers', 'reds', 'pirates', 'rockies', 'diamondbacks',
      'nationals',
      // NHL teams
      'bruins', 'maple', 'leafs', 'canadiens', 'habs', 'blackhawks', 'redwings',
      'penguins', 'flyers', 'oilers', 'flames', 'canucks', 'kraken', 'knights',
      'avalanche', 'blues', 'predators', 'hurricanes', 'lightning', 'panthers',
      'islanders', 'devils', 'sabres', 'senators', 'jets', 'wild', 'stars', 'coyotes',
      'ducks', 'sharks', 'kings',
      // General sports terms
      'win', 'loss', 'score', 'goal', 'touchdown', 'homerun', 'slam', 'dunk',
      'playoff', 'playoffs', 'championship', 'finals', 'superbowl', 'worldseries',
      'stanleycup', 'mvp', 'allstar', 'draft', 'trade', 'roster', 'coach', 'player',
      'athlete', 'season', 'preseason', 'offseason', 'injury', 'comeback', 'upset',
      'rivalry', 'matchup', 'highlight', 'replay', 'sportscenter',
      // Sports awards & hall of fame
      'hof', 'halloffame', 'goat', 'legend', 'legendary', 'alltime', 'greatest',
      'rookie', 'rookieoftheyear', 'dpoy', 'roy', 'mvprace', 'firstteam', 'probowl',
      // Soccer/Football
      'premier', 'league', 'laliga', 'bundesliga', 'seriea', 'mls', 'ucl', 'uefa',
      'fifa', 'worldcup', 'manchester', 'united', 'city', 'liverpool', 'chelsea',
      'arsenal', 'tottenham', 'spurs', 'barcelona', 'madrid', 'real', 'bayern',
      'psg', 'juventus', 'inter', 'milan', 'messi', 'ronaldo', 'haaland', 'mbappe',
      // Tennis, Golf, etc.
      'tennis', 'golf', 'pga', 'masters', 'wimbledon', 'usopen', 'grandslam',
      'boxing', 'ufc', 'mma', 'wrestling', 'wwe', 'f1', 'formula', 'nascar', 'racing',
      // NFL players & personalities
      'mahomes', 'kelce', 'travis', 'taylormahomes', 'patrickmahomes', 'joshallen',
      'lamarjackson', 'lamar', 'jackson', 'jalen', 'hurts', 'jalenhurts', 'burrow',
      'joeburrow', 'herbert', 'justinherbert', 'tua', 'tuatagovailoa', 'prescott',
      'dak', 'rodgers', 'aaronrodgers', 'wilson', 'russellwilson', 'stafford',
      'brady', 'tombrady', 'brees', 'drewbrees', 'manning', 'peyton', 'eli',
      'henry', 'derrickhenry', 'chubb', 'nickchubb', 'mccaffrey', 'christian',
      'jefferson', 'justinjefferson', 'hill', 'tyreekhill', 'chase', 'jamarr',
      'diggs', 'stefon', 'adams', 'davante', 'watt', 'tj', 'tjwatt', 'jj', 'jjwatt',
      'donald', 'aarondonald', 'bosa', 'nick', 'joey', 'garrett', 'myles', 'parsons',
      'micah', 'micahparsons', 'belichick', 'bill', 'reid', 'andy', 'andyreid',
      'shanahan', 'kyle', 'mcvay', 'sean', 'seanmcvay', 'payton', 'seanpayton',
      // NBA players & personalities
      'lebron', 'lebronjames', 'kingjames', 'curry', 'stephcurry', 'steph', 'durant',
      'kevindurant', 'kd', 'giannis', 'antetokounmpo', 'greekfreak', 'jokic', 'nikola',
      'nikolajokic', 'embiid', 'joel', 'joelembiid', 'doncic', 'luka', 'lukadoncic',
      'tatum', 'jayson', 'jaysontatum', 'brown', 'jaylen', 'jaylenbrown', 'booker',
      'devin', 'devinbooker', 'morant', 'ja', 'jamorant', 'edwards', 'anthony',
      'ant', 'wemby', 'wembanyama', 'victor', 'victorwembanyama', 'lillard', 'dame',
      'damelillard', 'irving', 'kyrie', 'kyrieirving', 'harden', 'james', 'jamesharden',
      'westbrook', 'russell', 'russellwestbrook', 'george', 'paul', 'paulgeorge', 'pg',
      'leonard', 'kawhi', 'kawhileonard', 'butler', 'jimmy', 'jimmybutler', 'adebayo',
      'bam', 'mitchell', 'donovan', 'donovanmitchell', 'murray', 'jamal', 'jamalmurray',
      'jordan', 'michael', 'michaeljordan', 'mj', 'kobe', 'bryant', 'kobebryant',
      'shaq', 'shaquille', 'oneal', 'magic', 'johnson', 'bird', 'larry', 'larrybird',
      'duncan', 'tim', 'timduncan', 'garnett', 'kg', 'nowitzki', 'dirk', 'wade',
      'dwyane', 'dwyaneWade', 'iverson', 'allen', 'alleniverson', 'ai', 'pierce',
      // MLB players
      'ohtani', 'shohei', 'shoheiohtani', 'trout', 'mike', 'miketrout', 'betts',
      'mookie', 'mookiebetts', 'judge', 'aaron', 'aaronjudge', 'soto', 'juan',
      'juansoto', 'acuna', 'ronald', 'ronaldacuna', 'tatis', 'fernando', 'vladdy',
      'vlad', 'guerrero', 'vladguerrero', 'devers', 'rafael', 'arenado', 'nolan',
      'goldschmidt', 'paul', 'freeman', 'freddie', 'freddifreeman', 'lindor',
      'francisco', 'turner', 'trea', 'cole', 'gerrit', 'gerritcole', 'degrom',
      'jacob', 'jacobdegrom', 'scherzer', 'max', 'maxscherzer', 'verlander', 'justin',
      // NHL players
      'mcdavid', 'connor', 'connormcdavid', 'crosby', 'sidney', 'sidneycrosby',
      'ovechkin', 'alex', 'alexovechkin', 'ovi', 'mackinnon', 'nathan', 'draisaitl',
      'leon', 'leondraisaitl', 'makar', 'cale', 'calemakar', 'matthews', 'auston',
      'austonmatthews', 'marner', 'mitch', 'mitchmarner', 'kucherov', 'nikita',
      'vasilevskiy', 'andrei', 'hedman', 'victor', 'pastrnak', 'david', 'marchand',
      'brad', 'bradmarchand', 'kaprizov', 'kirill', 'hughes', 'jack', 'jackhughes',
      'quinn', 'quinnhughes', 'bedard', 'connor', 'connorbedard',
      // Combat sports
      'ufc', 'mma', 'mixedmartialarts', 'dana', 'white', 'danawhite', 'mcgregor',
      'conor', 'conormcgregor', 'jones', 'jon', 'jonjones', 'adesanya', 'israel',
      'izzy', 'makhachev', 'islam', 'oliveira', 'charles', 'volkanovski', 'alex',
      'pereira', 'poatan', 'chimaev', 'khamzat', 'omalley', 'sean', 'seanomalley',
      'ngannou', 'francis', 'usman', 'kamaru', 'masvidal', 'jorge', 'diaz', 'nate',
      'natediaz', 'poirier', 'dustin', 'gaethje', 'justin', 'holloway', 'max',
      'boxing', 'boxer', 'heavyweight', 'middleweight', 'lightweight', 'welterweight',
      'canelo', 'alvarez', 'caneloalvarez', 'fury', 'tyson', 'tysonfury', 'usyk',
      'oleksandr', 'joshua', 'anthony', 'anthonyjoshua', 'aj', 'wilder', 'deontay',
      'crawford', 'terence', 'terencecrawford', 'spence', 'errol', 'errolspence',
      'haney', 'devin', 'devinhaney', 'tank', 'davis', 'gervonta', 'gervontadavis',
      'knockout', 'ko', 'tko', 'decision', 'split', 'unanimous', 'submission',
      'choke', 'armbar', 'kimura', 'guillotine', 'rear', 'naked', 'round', 'rounds',
      // Motorsports
      'f1', 'formula1', 'formulaone', 'verstappen', 'max', 'maxverstappen', 'hamilton',
      'lewis', 'lewishamilton', 'leclerc', 'charles', 'charlesleclerc', 'sainz',
      'carlos', 'norris', 'lando', 'landonorris', 'piastri', 'oscar', 'russell',
      'george', 'georgerussell', 'perez', 'checo', 'checoperez', 'alonso', 'fernando',
      'redbull', 'ferrari', 'mercedes', 'mclaren', 'astonmartin', 'alpine', 'williams',
      'haas', 'alfa', 'romeo', 'alfaromeo', 'sauber', 'kicksauber', 'grandprix', 'gp',
      'monaco', 'monza', 'silverstone', 'spa', 'suzuka', 'cota', 'singapore', 'qatar',
      'bahrain', 'jeddah', 'miami', 'lasvegas', 'pit', 'pitstop', 'drs', 'overtake',
      'pole', 'position', 'poleposition', 'podium', 'constructors', 'drivers',
      'nascar', 'daytona', '500', 'daytona500', 'talladega', 'bristol', 'martinsville',
      'indycar', 'indy', '500', 'indy500', 'lemans', '24hours', 'endurance',
      // Tennis
      'djokovic', 'novak', 'novakdjokovic', 'nadal', 'rafa', 'rafanadal', 'federer',
      'roger', 'rogerfederer', 'alcaraz', 'carlos', 'carlosalcaraz', 'sinner',
      'jannik', 'janniksinner', 'medvedev', 'daniil', 'zverev', 'alexander', 'sascha',
      'tsitsipas', 'stefanos', 'rublev', 'andrey', 'ruud', 'casper', 'fritz', 'taylor',
      'tiafoe', 'frances', 'swiatek', 'iga', 'igaswiatek', 'sabalenka', 'aryna',
      'gauff', 'coco', 'cocogauff', 'rybakina', 'elena', 'pegula', 'jessica', 'osaka',
      'naomi', 'naomiosaka', 'williams', 'serena', 'venus', 'serenawilliams',
      'australianopen', 'ao', 'frenchopen', 'rolandgarros', 'wimbledon', 'usopen',
      'slam', 'grandslam', 'atp', 'wta', 'serve', 'ace', 'fault', 'break', 'tiebreak',
      'deuce', 'advantage', 'love', 'set', 'match', 'ralley', 'forehand', 'backhand',
      // Golf
      'golf', 'pga', 'pgatour', 'lpga', 'masters', 'augusta', 'usopen', 'theopen',
      'british', 'open', 'pga', 'championship', 'pgachampionship', 'rydercup',
      'presidentscup', 'fedexcup', 'liv', 'livgolf', 'scheffler', 'scottie',
      'scottiescheffler', 'mcilroy', 'rory', 'rorymcilroy', 'rahm', 'jon', 'jonrahm',
      'koepka', 'brooks', 'brookskoepka', 'dechambeau', 'bryson', 'thomas', 'jt',
      'justinthomas', 'spieth', 'jordan', 'jordanspieth', 'cantlay', 'patrick',
      'morikawa', 'collin', 'zalatoris', 'will', 'hovland', 'viktor', 'woods', 'tiger',
      'tigerwoods', 'nicklaus', 'jack', 'jacknicklaus', 'palmer', 'arnold', 'birdie',
      'eagle', 'bogey', 'par', 'under', 'over', 'cut', 'fairway', 'green', 'bunker',
      'sand', 'trap', 'rough', 'tee', 'drive', 'putt', 'putting', 'iron', 'wedge',
      'driver', 'putter', 'caddie', 'caddy', 'hole', 'holes', 'front', 'nine', 'back',
      // Sports media & betting
      'espn', 'sportscenter', 'firsttake', 'undisputed', 'getup', 'pti', 'around',
      'horn', 'fox', 'foxsports', 'fs1', 'skip', 'bayless', 'skipbayless', 'shannon',
      'sharpe', 'shannonsharpe', 'stephen', 'stephensmith', 'smithstephen', 'kellerman',
      'max', 'wilbon', 'kornheiser', 'tony', 'mike', 'cowherd', 'colin', 'colincowherd',
      'pat', 'mcafee', 'patmcafee', 'pmshow', 'nbaontnt', 'insidethena', 'shaq',
      'charles', 'barkley', 'charlesbarkley', 'ernie', 'johnson', 'kenny', 'smith',
      'draftkings', 'fanduel', 'betmgm', 'caesars', 'barstool', 'bet365', 'pointsbet',
      'sportsbook', 'betting', 'bet', 'spread', 'moneyline', 'overunder', 'parlay',
      'prop', 'propbet', 'odds', 'line', 'favorite', 'underdog', 'cover', 'ats',
      'fantasy', 'fantasysports', 'fantasyfootball', 'fantasybasketball', 'fantasybaseball',
      'dfs', 'dailyfantasy', 'sleeper', 'bust', 'breakout', 'waiver', 'wire', 'waiverWire'
    ],
    'lifestyle': [
      // Core terms
      'lifestyle', 'dailylife', 'routine', 'vlog', 'dayinthelife', 'morningroutine',
      'wellness', 'selfcare', 'mindfulness', 'meditation', 'mental', 'health',
      'productivity', 'organization', 'minimalist', 'aesthetic', 'cozy', 'hygge',
      'home', 'decor', 'interior', 'diy', 'crafts', 'garden', 'plant', 'pet',
      'dog', 'cat', 'puppy', 'kitten', 'parenting', 'mom', 'dad', 'family', 'kids',
      // Home & decor
      'homedecor', 'interiordesign', 'decoration', 'decorating', 'furniture',
      'living', 'room', 'livingroom', 'bedroom', 'bathroom', 'kitchen', 'dining',
      'office', 'homeoffice', 'apartment', 'house', 'condo', 'studio', 'loft',
      'rent', 'rental', 'renting', 'homeowner', 'homeownership', 'mortgage',
      'realestate', 'realtor', 'zillow', 'redfin', 'trulia', 'moving', 'move',
      'renovation', 'renovate', 'remodel', 'remodeling', 'fixer', 'upper', 'flip',
      'ikea', 'wayfair', 'westelm', 'cb2', 'crateandbarrel', 'potterybarn', 'target',
      'homegoods', 'tj', 'maxx', 'tjmaxx', 'marshalls', 'world', 'market', 'pier1',
      'couch', 'sofa', 'sectional', 'bed', 'mattress', 'desk', 'chair', 'table',
      'lamp', 'lighting', 'rug', 'curtains', 'blinds', 'shelves', 'shelving',
      'storage', 'closet', 'organizer', 'organizing', 'declutter', 'decluttering',
      'konmari', 'marie', 'kondo', 'mariekondo', 'sparkjoy', 'tidyup', 'tidying',
      // DIY & crafts
      'diy', 'doityourself', 'craft', 'crafts', 'crafting', 'handmade', 'homemade',
      'maker', 'makerspace', 'woodworking', 'woodwork', 'carpentry', 'woodshop',
      'sewing', 'sew', 'knitting', 'knit', 'crochet', 'crocheting', 'embroidery',
      'quilting', 'quilt', 'cross', 'stitch', 'crossstitch', 'macrame', 'weaving',
      'pottery', 'ceramics', 'clay', 'sculpting', 'sculpture', 'painting', 'paint',
      'drawing', 'sketch', 'sketching', 'illustration', 'illustrator', 'calligraphy',
      'lettering', 'journaling', 'journal', 'bullet', 'bujo', 'planner', 'scrapbook',
      'scrapbooking', 'cardmaking', 'papercrafts', 'origami', 'candle', 'candlemaking',
      'soapmaking', 'soap', 'resin', 'epoxy', 'jewelry', 'jewelrymaking', 'beading',
      'etsy', 'pinterest', 'michaels', 'joann', 'hobbylobby', 'blick',
      // Gardening & plants
      'garden', 'gardening', 'gardener', 'plant', 'plants', 'plantparent', 'plantmom',
      'plantdad', 'houseplant', 'houseplants', 'indoor', 'outdoor', 'patio', 'balcony',
      'backyard', 'frontyard', 'lawn', 'landscape', 'landscaping', 'flower', 'flowers',
      'floral', 'bouquet', 'succulent', 'succulents', 'cactus', 'cacti', 'fern',
      'monstera', 'pothos', 'philodendron', 'fiddle', 'leaf', 'fig', 'fiddleleaffig',
      'snake', 'plant', 'snakeplant', 'zz', 'palm', 'orchid', 'rose', 'roses', 'tulip',
      'sunflower', 'daisy', 'lily', 'peony', 'hydrangea', 'lavender', 'herb', 'herbs',
      'basil', 'mint', 'rosemary', 'thyme', 'cilantro', 'parsley', 'vegetable', 'veggie',
      'tomato', 'pepper', 'cucumber', 'lettuce', 'carrot', 'strawberry', 'blueberry',
      'compost', 'composting', 'mulch', 'soil', 'fertilizer', 'watering', 'pruning',
      'propagation', 'propagate', 'repot', 'repotting', 'planter', 'pot', 'terracotta',
      // Pets
      'pet', 'pets', 'petparent', 'furbaby', 'furry', 'friend', 'rescue', 'adopt',
      'adoption', 'shelter', 'foster', 'fostering', 'breeder', 'purebred', 'mutt',
      'dog', 'dogs', 'doggo', 'pupper', 'pup', 'puppy', 'puppies', 'dogmom', 'dogdad',
      'dogsofinstagram', 'instadog', 'goldenretriever', 'golden', 'labrador', 'lab',
      'germanshepherd', 'gsd', 'frenchbulldog', 'frenchie', 'bulldog', 'poodle',
      'beagle', 'rottweiler', 'yorkie', 'yorkshire', 'terrier', 'dachshund', 'weiner',
      'husky', 'malamute', 'corgi', 'shiba', 'inu', 'shibainu', 'pitbull', 'pit',
      'boxer', 'greatdane', 'bernese', 'mountain', 'aussie', 'australian', 'shepherd',
      'bordercollie', 'collie', 'pomeranian', 'pom', 'chihuahua', 'maltese', 'shih',
      'tzu', 'shihtzu', 'cavalier', 'cocker', 'spaniel', 'bichon', 'havanese',
      'cat', 'cats', 'kitty', 'kitten', 'kittens', 'catmom', 'catdad', 'catsofinstagram',
      'instacat', 'meow', 'purr', 'tabby', 'siamese', 'persian', 'maine', 'coon',
      'mainecoon', 'ragdoll', 'british', 'shorthair', 'bengal', 'sphynx', 'scottish',
      'fold', 'russianblue', 'abyssinian', 'birman', 'burmese', 'savannah',
      'fish', 'aquarium', 'fishtank', 'tropical', 'saltwater', 'freshwater', 'betta',
      'goldfish', 'koi', 'reef', 'coral', 'bird', 'birds', 'parrot', 'parakeet',
      'cockatiel', 'cockatoo', 'macaw', 'budgie', 'finch', 'canary', 'lovebird',
      'hamster', 'gerbil', 'guinea', 'pig', 'guineapig', 'rabbit', 'bunny', 'ferret',
      'hedgehog', 'chinchilla', 'reptile', 'snake', 'lizard', 'gecko', 'iguana', 'turtle',
      // Parenting & family
      'parent', 'parenting', 'parenthood', 'mom', 'momlife', 'mommy', 'mama', 'mother',
      'motherhood', 'dad', 'dadlife', 'daddy', 'papa', 'father', 'fatherhood',
      'baby', 'babies', 'newborn', 'infant', 'toddler', 'preschool', 'preschooler',
      'kid', 'kids', 'child', 'children', 'son', 'daughter', 'sibling', 'siblings',
      'brother', 'sister', 'twins', 'triplets', 'pregnancy', 'pregnant', 'expecting',
      'maternity', 'paternity', 'nursery', 'crib', 'stroller', 'carseat', 'diaper',
      'diapers', 'breastfeeding', 'nursing', 'formula', 'pumping', 'babyfood',
      'milestone', 'milestones', 'firstword', 'firststeps', 'pottytraining', 'potty',
      'sleep', 'training', 'sleeptraining', 'nap', 'naptime', 'bedtime', 'tantrum',
      'tantrums', 'terrible', 'twos', 'terribletwos', 'playdate', 'playground',
      'homeschool', 'homeschooling', 'unschool', 'waldorf', 'montessori',
      // Wellness & self-improvement
      'wellness', 'wellbeing', 'selfcare', 'selflove', 'selfimprovement', 'growth',
      'personalgrowth', 'personaldevelopment', 'mindset', 'mindfulness', 'mindful',
      'meditation', 'meditate', 'calm', 'headspace', 'insight', 'timer', 'breathwork',
      'breath', 'breathing', 'yoga', 'stretching', 'morning', 'routine', 'night',
      'evening', 'journal', 'journaling', 'gratitude', 'grateful', 'thankful',
      'affirmation', 'affirmations', 'manifest', 'manifesting', 'manifestation',
      'intention', 'intentional', 'intentionalliving', 'slowliving', 'slow', 'living',
      'hygge', 'cozy', 'comfort', 'comfortable', 'relaxation', 'relax', 'relaxing',
      'rest', 'recharge', 'unplug', 'disconnect', 'digital', 'detox', 'digitaldetox',
      'sleep', 'sleepwell', 'sleephygiene', 'insomnia', 'nap', 'skincare', 'selfcare',
      'pamper', 'spa', 'spaday', 'bath', 'bubble', 'bath', 'bathbomb', 'candle', 'candles',
      'aromatherapy', 'essential', 'oils', 'essentialoils', 'diffuser', 'lavender',
      'eucalyptus', 'peppermint', 'tea', 'teatime', 'herbal', 'herbaltea', 'chamomile'
    ],
    'business': [
      // Core terms
      'business', 'entrepreneur', 'startup', 'money', 'finance', 'investing', 'stock',
      'market', 'trading', 'portfolio', 'dividend', 'etf', 'index', 'fund', 'retire',
      'wealth', 'income', 'passive', 'sidehustle', 'freelance', 'remote', 'wfh',
      'career', 'job', 'interview', 'resume', 'linkedin', 'networking', 'salary',
      'economy', 'inflation', 'recession', 'fed', 'interest', 'rate', 'gdp', 'earnings',
      // Investing & markets
      'invest', 'investor', 'investment', 'stocks', 'shares', 'equity', 'equities',
      'bond', 'bonds', 'treasury', 'treasuries', 'mutual', 'funds', 'mutualfund',
      'indexfund', 'sp500', 'sandp', 'dow', 'dowjones', 'nasdaq', 'nyse', 'russell',
      'vanguard', 'fidelity', 'schwab', 'charlesschwab', 'etrade', 'tdameritrade',
      'robinhood', 'webull', 'sofi', 'acorns', 'betterment', 'wealthfront',
      'brokerage', 'broker', 'trade', 'trades', 'buy', 'sell', 'hold', 'long',
      'shortselling', 'optionstrading', 'calloption', 'putoption', 'strike', 'expiry',
      'futures', 'commodities', 'goldprice', 'silverprice', 'crudeoil', 'naturalgas',
      'forex', 'fx', 'currency', 'dollar', 'euro', 'yen', 'pound', 'yuan',
      'bull', 'bullish', 'bear', 'bearish', 'rally', 'correction', 'crash', 'dip',
      'buythedip', 'btd', 'alltime', 'high', 'ath', 'low', 'atl', 'volatile',
      'volatility', 'vix', 'momentum', 'swing', 'swingtrading', 'daytrading',
      'daytrade', 'daytrader', 'technical', 'analysis', 'fundamental', 'chart',
      'charts', 'pattern', 'support', 'resistance', 'breakout', 'breakdown',
      'moving', 'average', 'ma', 'ema', 'rsi', 'macd', 'bollinger', 'bands',
      'pe', 'ratio', 'peratio', 'eps', 'revenue', 'profit', 'margin', 'ebitda',
      'cashflow', 'balance', 'sheet', 'quarterly', 'earnings', 'earningscall',
      'guidance', 'estimate', 'beat', 'miss', 'upgrade', 'downgrade', 'target',
      'pricetarget', 'analyst', 'wallstreet', 'hedge', 'hedgefund', 'institutional',
      // Personal finance
      'personalfinance', 'budget', 'budgeting', 'save', 'saving', 'savings',
      'emergency', 'fund', 'emergencyfund', 'debt', 'debtfree', 'payoff', 'paydown',
      'creditcard', 'credit', 'score', 'creditscore', 'fico', 'loan', 'loans',
      'mortgage', 'refinance', 'refi', 'apr', 'interest', 'principal', 'amortization',
      'compound', 'compounding', 'compound', 'interest', 'compoundinterest',
      '401k', 'ira', 'rothira', 'roth', 'traditional', 'sep', 'pension', 'retire',
      'retirement', 'earlyretirement', 'fire', 'financialindependence', 'fi',
      'fatfire', 'leanfire', 'coastfire', 'baristafire', 'networth', 'asset',
      'assets', 'liability', 'liabilities', 'cashflow', 'passive', 'income',
      'passiveincome', 'multiple', 'streams', 'diversify', 'diversification',
      'tax', 'taxes', 'taxreturn', 'refund', 'deduction', 'deductions', 'write',
      'off', 'writeoff', 'cpa', 'accountant', 'turbotax', 'hrblock', 'taxact',
      // Career & work
      'career', 'job', 'jobs', 'work', 'working', 'worker', 'employee', 'employer',
      'employment', 'unemployed', 'unemployment', 'layoff', 'layoffs', 'fired',
      'hiring', 'hire', 'hired', 'recruit', 'recruiter', 'recruiting', 'headhunter',
      'resume', 'cv', 'coverletter', 'application', 'apply', 'applying', 'interview',
      'interviews', 'offer', 'joboffer', 'negotiate', 'negotiation', 'salary',
      'compensation', 'comp', 'bonus', 'raise', 'promotion', 'promoted', 'title',
      'jobtitle', 'role', 'position', 'fulltime', 'parttime', 'contract', 'contractor',
      'freelance', 'freelancer', 'consultant', 'consulting', 'gig', 'gigeconomy',
      'remote', 'remotework', 'wfh', 'workfromhome', 'hybrid', 'office', 'inoffice',
      'returntooffice', 'rto', 'commute', 'commuting', 'coworking', 'wework',
      'linkedin', 'indeed', 'glassdoor', 'ziprecruiter', 'monster', 'careerbuilder',
      'dice', 'angellist', 'wellfound', 'levels', 'fyi', 'levelsfyi', 'blind',
      'teamblind', 'fishbowl', 'workplace', 'culture', 'workculture', 'toxic',
      'burnout', 'worklife', 'balance', 'worklifebalance', 'overworked', 'stress',
      // Entrepreneurship & startups
      'entrepreneur', 'entrepreneurship', 'founder', 'cofounder', 'ceo', 'cto',
      'cfo', 'coo', 'cmo', 'vp', 'director', 'manager', 'executive', 'csuite',
      'startup', 'startups', 'launch', 'launching', 'bootstrap', 'bootstrapped',
      'bootstrapping', 'selfmade', 'sidehustle', 'side', 'hustle', 'smallbusiness',
      'smb', 'sme', 'business', 'owner', 'businessowner', 'solopreneur', 'solo',
      'agency', 'saas', 'b2b', 'b2c', 'd2c', 'dtc', 'ecommerce', 'dropshipping',
      'amazon', 'fba', 'shopify', 'etsy', 'ebay', 'marketplace', 'platform',
      'product', 'service', 'mvp', 'minimum', 'viable', 'pivot', 'scale', 'scaling',
      'growth', 'growthhacking', 'acquisition', 'retention', 'churn', 'arr', 'mrr',
      'ltv', 'cac', 'roi', 'kpi', 'metrics', 'analytics', 'funnel', 'conversion',
      'venture', 'capital', 'vc', 'angel', 'investor', 'seed', 'series', 'round',
      'funding', 'fundraising', 'pitch', 'pitchdeck', 'valuation', 'unicorn',
      'decacorn', 'ipo', 'spac', 'exit', 'acquisition', 'merger', 'ma',
      'yc', 'ycombinator', 'techstars', '500startups', 'sequoia', 'a16z',
      'andreessenhorowitz', 'benchmark', 'accel', 'greylock', 'kleiner', 'perkins',
      // Economy & macro
      'economy', 'economic', 'economics', 'macro', 'macroeconomics', 'micro',
      'gdp', 'gnp', 'growth', 'recession', 'recovery', 'expansion',
      'contraction', 'cycle', 'business', 'cycle', 'businesscycle', 'inflation',
      'deflation', 'stagflation', 'cpi', 'ppi', 'pce', 'fed', 'federal', 'reserve',
      'federalreserve', 'fomc', 'powell', 'jerome', 'jeromepowell', 'rate', 'rates',
      'interestrate', 'hike', 'cut', 'taper', 'tapering', 'qe', 'quantitative',
      'easing', 'qt', 'tightening', 'yield', 'curve', 'yieldcurve', 'inversion',
      'inverted', 'treasury', 'treasuries', 'tbill', 'tbond', 'note', 'bond',
      'employment', 'unemployment', 'jobs', 'report', 'jobsreport', 'nonfarm',
      'payroll', 'payrolls', 'claims', 'jobless', 'joblessclaims', 'labor',
      'labourmarket', 'workforce', 'participation', 'wage', 'wages', 'growth',
      'consumer', 'spending', 'retail', 'sales', 'housing', 'starts', 'permits',
      'manufacturing', 'pmi', 'ism', 'trade', 'deficit', 'surplus', 'tariff',
      'tariffs', 'import', 'export', 'balance', 'debt', 'ceiling', 'debtceiling',
      'fiscal', 'policy', 'fiscalpolicy', 'monetary', 'monetarypolicy', 'stimulus',
      'bailout', 'tarp', 'relief', 'aid', 'package', 'billionaires', 'wealth', 'gap'
    ],
    'politics': [
      // Core terms
      'politics', 'political', 'election', 'vote', 'voting', 'ballot', 'campaign',
      'democrat', 'republican', 'liberal', 'conservative', 'congress', 'senate',
      'house', 'president', 'governor', 'mayor', 'policy', 'legislation', 'bill',
      'supreme', 'court', 'scotus', 'law', 'rights', 'amendment', 'constitution',
      'trump', 'biden', 'obama', 'clinton', 'bush', 'desantis', 'newsom',
      'gop', 'dnc', 'rnc', 'midterm', 'primary', 'caucus', 'swing', 'battleground',
      'bipartisan', 'partisan', 'filibuster', 'impeach', 'veto', 'executive', 'order',
      // US politicians
      'donaldtrump', 'trump2024', 'maga', 'makeamericagreatagain', 'joebiden',
      'biden2024', 'kamala', 'harris', 'kamalaharris', 'vp', 'vicepresident',
      'pelosi', 'nancy', 'nancypelosi', 'schumer', 'chuck', 'chuckschumer',
      'mcconnell', 'mitch', 'mitchmcconnell', 'mccarthy', 'kevin', 'kevinmccarthy',
      'johnson', 'mike', 'mikejohnson', 'jeffries', 'hakeem', 'hakeemjeffries',
      'aoc', 'ocasiocortez', 'alexandria', 'bernie', 'sanders', 'berniesanders',
      'warren', 'elizabeth', 'elizabethwarren', 'buttigieg', 'pete', 'petebuttigieg',
      'cruz', 'ted', 'tedcruz', 'rubio', 'marco', 'marcorubio', 'hawley', 'josh',
      'joshhawley', 'cotton', 'tom', 'tomcotton', 'gaetz', 'matt', 'mattgaetz',
      'greene', 'mtg', 'marjorie', 'taylor', 'boebert', 'lauren', 'laurenboebert',
      'crenshaw', 'dan', 'dancrenshaw', 'desantis', 'ron', 'rondesantis',
      'newsom', 'gavin', 'gavinnewsom', 'pritzker', 'whitmer', 'gretchen',
      'abbott', 'greg', 'gregabbott', 'youngkin', 'glenn', 'haley', 'nikki',
      'nikkihaley', 'ramaswamy', 'vivek', 'vivekramaswamy', 'rfk', 'kennedy',
      'robertkennedy', 'junior', 'jd', 'vance', 'jdvance', 'walz', 'tim', 'timwalz',
      // Government & institutions
      'whitehouse', 'capitol', 'pentagon', 'stateDepartment', 'doj', 'justice',
      'department', 'fbi', 'cia', 'nsa', 'dhs', 'homeland', 'security', 'ice',
      'atf', 'dea', 'secret', 'service', 'military', 'army', 'navy', 'airforce',
      'marines', 'coastguard', 'spaceforce', 'national', 'guard', 'veteran',
      'veterans', 'va', 'cabinet', 'secretary', 'attorney', 'general', 'ag',
      'prosecutor', 'da', 'districtattorney', 'judge', 'justice', 'chief',
      'associate', 'circuit', 'appeals', 'district', 'federal', 'state', 'local',
      // Political parties & movements
      'democratic', 'party', 'democraticparty', 'republican', 'party', 'gop',
      'grandoldparty', 'libertarian', 'green', 'party', 'greenparty', 'independent',
      'progressive', 'progressives', 'moderate', 'moderates', 'centrist', 'center',
      'left', 'leftist', 'leftwing', 'right', 'rightwing', 'farright', 'farleft',
      'extremist', 'extremism', 'radical', 'activist', 'activism', 'protest',
      'protests', 'protester', 'protesters', 'demonstration', 'rally', 'march',
      'movement', 'grassroots', 'organizer', 'organizing', 'mobilize', 'mobilization',
      // Political issues
      'abortion', 'prochoice', 'prolife', 'roevwade', 'roe', 'reproductive', 'rights',
      'healthcare', 'medicare', 'medicaid', 'obamacare', 'aca', 'affordable',
      'care', 'act', 'singlepayer', 'universal', 'coverage', 'insurance',
      'immigration', 'immigrant', 'immigrants', 'border', 'wall', 'borderwall',
      'asylum', 'refugee', 'refugees', 'daca', 'dreamer', 'dreamers', 'deportation',
      'sanctuary', 'city', 'sanctuarycity', 'undocumented', 'illegal', 'alien',
      'climate', 'change', 'climatechange', 'global', 'warming', 'globalwarming',
      'environment', 'environmental', 'epa', 'greennewdeal', 'gnd', 'paris',
      'agreement', 'parisagreement', 'carbon', 'emissions', 'fossil', 'fuel',
      'renewable', 'energy', 'solar', 'wind', 'nuclear', 'fracking', 'pipeline',
      'gun', 'guns', 'firearm', 'firearms', 'secondamendment', '2a', 'nra',
      'guncontrol', 'gunrights', 'assault', 'weapon', 'ban', 'background', 'check',
      'backgroundcheck', 'concealedcarry', 'opencarry', 'shooting', 'mass',
      'massshooting', 'uvalde', 'parkland', 'sandyhook', 'gunviolence',
      'crime', 'criminal', 'justice', 'reform', 'police', 'policing', 'defund',
      'defundthepolice', 'bluelivesmatter', 'backtheblue', 'blacklivesmatter',
      'blm', 'civilrights', 'racism', 'racist', 'discrimination', 'equality',
      'equity', 'diversity', 'dei', 'affirmativeaction', 'woke', 'wokeism',
      'crt', 'criticalracetheory', 'lgbtq', 'lgbt', 'gay', 'marriage', 'gaymarriage',
      'samesex', 'transgender', 'trans', 'rights', 'transrights', 'bathroom',
      'drag', 'queen', 'gender', 'identity', 'pronoun', 'pronouns',
      'tax', 'taxes', 'taxation', 'taxcut', 'taxhike', 'taxreform', 'irs',
      'wealthy', 'rich', 'billionaire', 'taxtherich', 'wealth', 'tax', 'wealthtax',
      'minimumwage', 'wage', '15', 'dollar', 'fightfor15', 'union', 'unions',
      'labor', 'strike', 'strikes', 'collective', 'bargaining', 'worker', 'workers',
      'student', 'loan', 'studentloan', 'debt', 'forgiveness', 'cancellation',
      'education', 'school', 'voucher', 'charter', 'public', 'private', 'tuition',
      // Elections & voting
      'election', 'elections', 'electionday', 'vote', 'voter', 'voters', 'voting',
      'ballot', 'ballots', 'mailln', 'absentee', 'earlyvoting', 'pollstation',
      'poll', 'polls', 'polling', 'turnout', 'registration', 'register', 'registered',
      'electoral', 'college', 'electoralcollege', 'delegate', 'delegates', 'primary',
      'primaries', 'caucus', 'caucuses', 'convention', 'nominee', 'nomination',
      'swing', 'state', 'swingstate', 'battleground', 'red', 'blue', 'purple',
      'flip', 'flipped', 'recount', 'runoff', 'certification', 'certify',
      'gerrymandering', 'redistricting', 'district', 'congressional', 'constituency',
      'votersuppression', 'voterid', 'fraud', 'voterfraud', 'rigged', 'stolen',
      'election', 'stolenelection', 'stopthesteal', '2020', '2024', 'jan6',
      'january6', 'insurrection', 'capitol', 'riot', 'committee', 'hearing',
      // International politics
      'foreign', 'policy', 'foreignpolicy', 'diplomacy', 'diplomat', 'diplomatic',
      'embassy', 'ambassador', 'state', 'department', 'statedepartment', 'un',
      'unitednations', 'nato', 'eu', 'europeanunion', 'g7', 'g20', 'summit',
      'treaty', 'agreement', 'sanction', 'sanctions', 'tariff', 'tariffs', 'trade',
      'war', 'tradewar', 'ally', 'allies', 'alliance', 'adversary', 'enemy',
      'russia', 'russian', 'putin', 'vladimir', 'vladimirputin', 'kremlin', 'moscow',
      'ukraine', 'ukrainian', 'zelensky', 'volodymyr', 'kyiv', 'kiev', 'invasion',
      'china', 'chinese', 'beijing', 'xi', 'jinping', 'xijinping', 'ccp', 'taiwan',
      'taiwan', 'tensions', 'southchinasea', 'uyghur', 'hongkong', 'tibet',
      'iran', 'iranian', 'tehran', 'nuclear', 'deal', 'irannucleardeal', 'jcpoa',
      'israel', 'israeli', 'netanyahu', 'benjamin', 'bibi', 'palestine', 'palestinian',
      'gaza', 'westbank', 'hamas', 'hezbollah', 'twostate', 'solution', 'middleeast',
      'saudi', 'arabia', 'saudiarabia', 'mbs', 'bin', 'salman', 'opec', 'oil',
      'northkorea', 'dprk', 'kim', 'jong', 'un', 'kimjongun', 'pyongyang', 'missile',
      'icbm', 'nuclear', 'weapons', 'denuclearization', 'afghanistan', 'taliban',
      'withdrawal', 'kabul', 'iraq', 'syria', 'isis', 'terrorism', 'terrorist'
    ]
  };

  const topicCounts = {};

  // Create a Set for O(1) lookup of exact word matches
  const wordSet = new Set(combined);

  // Identify compound words (long words that might contain keywords)
  const compoundWords = combined.filter(w => w.length > 10);

  // DEBUG: Log first few posts to understand what we're matching
  if (combined.length > 0 && CAPTURE_DEBUG) {
    debugLog('[AlgorithmLens][Topic] Keywords extracted:', combined.slice(0, 20), '...(total:', combined.length, ')');
  }

  const matchedKeywords = [];
  for (const [topic, patterns] of Object.entries(topicPatterns)) {
    for (const pattern of patterns) {
      // First: exact word matching
      if (wordSet.has(pattern)) {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        matchedKeywords.push({ topic, pattern, type: 'exact' });
      }
      // Second: check if pattern (4+ chars) appears within compound words
      // This helps with usernames/hashtags like "houseofhighlights" → "highlights"
      else if (pattern.length >= 4) {
        for (const compound of compoundWords) {
          if (compound.includes(pattern)) {
            topicCounts[topic] = (topicCounts[topic] || 0) + 1;
            matchedKeywords.push({ topic, pattern, type: 'compound', in: compound });
            break; // Only count once per pattern
          }
        }
      }
    }
  }

  // DEBUG: Log matches
  if (CAPTURE_DEBUG) {
    if (matchedKeywords.length > 0) {
      debugLog('[AlgorithmLens][Topic] Matched keywords:', JSON.stringify(matchedKeywords));
    } else {
      debugLog('[AlgorithmLens][Topic] No keywords matched from:', combined.slice(0, 30));
    }
  }

  // Get top topic - use top match if available
  const sorted = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]);
  const finalTopic = sorted.length > 0 ? sorted[0][0] : 'general';

  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Topic] => Final topic:', finalTopic, '| Counts:', JSON.stringify(topicCounts));
  return finalTopic;
}

// ============================================
// Main Mapper Function
// ============================================

/**
 * Map DesktopPostItem[] to UnifiedScanResult
 * @param {Array} posts - Array of DesktopPostItem from DOM scanner
 * @param {string} platform - Platform name (tiktok, instagram, youtube, facebook, twitter, reddit)
 * @param {Object} options - Optional configuration
 * @param {string} options.scanId - Pre-generated scanId (from session start). If not provided, generates new one.
 * @param {string} options.createdAt - ISO timestamp when scan started. If not provided, uses current time.
 * @returns {Object} UnifiedScanResult
 */
export function mapDesktopPostsToUnifiedResult(posts = [], platform = 'unknown', options = {}) {
  const startTime = Date.now();
  // Use provided scanId from session state, or generate new one as fallback
  const scanId = options.scanId || generateScanId();
  const timestamp = options.createdAt || new Date().toISOString();
  
  // Ensure posts is an array
  if (!Array.isArray(posts)) {
    if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper] posts is not an array, defaulting to empty');
    posts = [];
  }

  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper] ======== MAPPING START ========');
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper] Input posts count:', posts.length);
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper] Platform:', platform);

  // Log platform distribution of input posts
  const inputPlatformSummary = {};
  for (const post of posts) {
    const p = post.platform || 'unknown';
    inputPlatformSummary[p] = (inputPlatformSummary[p] || 0) + 1;
  }
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper] Posts by platform (input):', inputPlatformSummary);
  
  // ============================================
  // Process each post into FeedItem format
  // ============================================
  
  const feedItems = [];
  const topicCounts = {};
  const hashtagCounts = {};
  const ctaCounts = {};

  posts.forEach((post, index) => {
    // Extract keywords from caption AND creator name
    // Creator name helps classify posts from known accounts (e.g., giallozafferano → food)
    const captionKeywords = extractKeywords(post.caption);
    const creatorKeywords = extractKeywords(post.creator);
    const keywords = [...captionKeywords, ...creatorKeywords];

    // Classify topic
    const primaryTopic = classifyTopic(keywords, post.hashtags || []);
    topicCounts[primaryTopic] = (topicCounts[primaryTopic] || 0) + 1;

    // Count hashtags
    (post.hashtags || []).forEach(tag => {
      const normalizedTag = tag.toLowerCase();
      hashtagCounts[normalizedTag] = (hashtagCounts[normalizedTag] || 0) + 1;
    });

    // Count CTAs
    if (post.ctaText) {
      const normalizedCta = post.ctaText.toLowerCase();
      ctaCounts[normalizedCta] = (ctaCounts[normalizedCta] || 0) + 1;
    }

    // Build FeedItem
    // NOTE: political, wellbeing, and valence fields are set to null/NOT_ANALYZED
    // because accurate detection requires AI/LLM analysis, not keyword matching.
    const feedItem = {
      position_in_feed: index + 1,
      approx_timestamp_offset_sec: null,
      content_type: post.mediaType || (platform === 'youtube' ? 'VIDEO' : 'POST'),
      is_ad: post.isSponsored || false,

      ad_metadata: post.isSponsored ? {
        ad_detected_reason: 'sponsored_label',
        sponsored_label_text: post.sponsoredEvidence?.matchedText || 'Sponsored',
        advertiser_name: post.creator || null,
        advertiser_domain: extractDomain(post.link),
        product_or_service: post.ctaText || null,
        detection_evidence: post.sponsoredEvidence || null
      } : null,

      account: {
        account_handle: post.creator || null,
        account_display_name: post.creator || null,
        account_category_guess: null
      },

      content_text: {
        captions: post.caption ? [post.caption] : [],
        hashtags: post.hashtags || [],
        on_screen_labels: []
      },

      topics: {
        primary_category: primaryTopic,
        secondary_categories: [],
        freeform_tags: keywords.slice(0, 10)
      },

      // Political detection requires AI analysis - keyword matching is too inaccurate
      political: {
        is_political: null, // null = not analyzed (requires AI)
        political_subtype: null,
        stance_or_alignment_guess: null,
        policy_area: null,
        geographic_focus: null
      },

      // Wellbeing detection requires AI analysis - keyword matching is too inaccurate
      wellbeing: {
        wellbeing_relevance: 'NOT_ANALYZED', // Indicates AI analysis needed
        valence: null, // null = not analyzed (requires AI)
        themes: [],
        potential_risk_flags: []
      },

      engagement_drivers: {
        hooks_detected: [],
        call_to_action_patterns: post.ctaText ? [post.ctaText] : [],
        urgency_or_scarcity_signals: []
      },
      
      repetition: {
        similar_to_previous_items: false,
        repetition_reasons: [],
        repetition_cluster_id: null
      },
      
      algorithm_inferences: {
        suggested_interests: keywords.slice(0, 5),
        suggested_audience_segments: []
      },
      
      source_details: {
        capture_source_type: 'DOM_SCRAPE',
        dom_metadata: {
          post_id: post.id || null,
          post_url: post.link || null,
          account_id: null
        },
        ocr_metadata: null
      },

      engagement: post.engagement ? {
        likes: post.engagement.likes ?? null,
        comments: post.engagement.comments ?? null,
        shares: post.engagement.shares ?? null,
        views: post.engagement.views ?? null
      } : null,

      source_type: post.sourceType || 'unknown',
      is_algorithmic: post.isAlgorithmic || false
    };

    feedItems.push(feedItem);
  });
  
  // ============================================
  // Build Aggregates
  // ============================================
  
  const totalItems = posts.length;
  
  // Count ads - ensure isSponsored is treated as boolean
  const totalAds = posts.filter(p => p.isSponsored === true).length;
  const adPercentage = totalItems > 0 ? totalAds / totalItems : 0;

  // Suggested vs. Followed counts
  const suggestedCount = posts.filter(p => p.sourceType === 'suggested').length;
  const followedCount = posts.filter(p => p.sourceType === 'followed').length;
  const adCount = posts.filter(p => p.sourceType === 'ad').length;
  const unknownSourceCount = posts.filter(p => !p.sourceType || p.sourceType === 'unknown').length;
  const suggestedPercentage = totalItems > 0 ? suggestedCount / totalItems : 0;
  const followedPercentage = totalItems > 0 ? followedCount / totalItems : 0;

  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper] ----------------------------------------');
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper] AGGREGATES:');
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper]   total_feed_items:', totalItems);
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper]   total_ads:', totalAds);
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper]   ad_percentage:', (adPercentage * 100).toFixed(1) + '%');
  
  // Topic distribution
  const topicDistribution = Object.entries(topicCounts)
    .map(([category, count]) => ({
      category,
      count,
      percentage: totalItems > 0 ? count / totalItems : 0
    }))
    .sort((a, b) => b.count - a.count);
  
  // Top hooks/CTAs
  const topHooks = Object.entries(ctaCounts)
    .map(([hook, count]) => ({ hook, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  // Calculate processing time
  const processingTime = (Date.now() - startTime) / 1000;
  
  // ============================================
  // Build UnifiedScanResult
  // ============================================
  
  const result = {
    schema_version: '1.0.0',
    
    scan_metadata: {
      scan_id: scanId,
      created_at: timestamp,
      source_type: 'DESKTOP_EXTENSION',
      platform: platform.toUpperCase(),
      user_identifier: null,
      app_scan_version: '0.1.0',
      insights_engine_version: '1.0.0-desktop'
    },
    
    environment: {
      device_type: 'DESKTOP',
      device_os: detectOS(),
      device_os_version: null,
      browser_name: 'Chrome',
      browser_version: null,
      screen_resolution: {
        width: typeof window !== 'undefined' ? window.screen?.width || 1920 : 1920,
        height: typeof window !== 'undefined' ? window.screen?.height || 1080 : 1080
      },
      video_capture: null,
      extension_capture: {
        is_dom_based: true,
        dom_capture_strategy: 'VISIBLE_FEED_ITEMS'
      }
    },
    
    feed_items: feedItems,
    
    aggregates: {
      total_feed_items: totalItems,
      total_ads: totalAds,
      ad_percentage: adPercentage,
      topic_distribution: topicDistribution,
      // NOTE: Wellbeing and political summaries show null/NOT_ANALYZED
      // because accurate detection requires AI/LLM analysis
      wellbeing_summary: {
        high_relevance_items: null, // Not analyzed - requires AI
        potential_risk_items: null, // Not analyzed - requires AI
        valence_distribution: null  // Not analyzed - requires AI
      },
      political_content_summary: {
        political_items: null, // Not analyzed - requires AI
        political_percentage: null // Not analyzed - requires AI
      },
      repetition_summary: {
        items_in_repetition_clusters: 0,
        largest_cluster_size: 0
      },
      engagement_pattern_summary: {
        top_hooks: topHooks
      },
      suggested_vs_followed: {
        suggested_count: suggestedCount,
        followed_count: followedCount,
        ad_count: adCount,
        unknown_count: unknownSourceCount,
        suggested_percentage: suggestedPercentage,
        followed_percentage: followedPercentage
      },
      engagement_summary: {
        total_likes: posts.reduce((sum, p) => sum + (p.engagement?.likes || 0), 0),
        total_comments: posts.reduce((sum, p) => sum + (p.engagement?.comments || 0), 0),
        total_shares: posts.reduce((sum, p) => sum + (p.engagement?.shares || 0), 0),
        total_views: posts.reduce((sum, p) => sum + (p.engagement?.views || 0), 0),
        posts_with_engagement: posts.filter(p => p.engagement && (p.engagement.likes || p.engagement.comments || p.engagement.shares || p.engagement.views)).length
      }
    },
    
    privacy: {
      user_identifiers_stored: false,
      profile_photos_stored: false,
      raw_text_stored: true,
      retention_policy_key: 'SHORT',
      redacted_fields: []
    },
    
    debug: {
      processing_time_seconds: processingTime,
      frames_extracted: null,
      frames_sampled_for_ocr: null,
      errors: [],
      warnings: [],
      raw_backend_payload: null
    }
  };
  
  // Add computed insights for easy access
  result._computed = {
    topHashtags: Object.entries(hashtagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count })),
    topTopics: topicDistribution.slice(0, 5),
    uniqueCreators: [...new Set(posts.map(p => p.creator).filter(Boolean))],
    wellbeingThemes: [], // Not analyzed - requires AI
    totalCTAs: Object.values(ctaCounts).reduce((a, b) => a + b, 0),
    suggestedPercent: Math.round(suggestedPercentage * 100),
    followedPercent: Math.round(followedPercentage * 100)
  };

  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper] ----------------------------------------');
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper] FINAL RESULT:');
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper]   scan_id:', result.scan_metadata.scan_id);
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper]   platform:', result.scan_metadata.platform);
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper]   total_feed_items:', result.aggregates.total_feed_items);
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper]   total_ads:', result.aggregates.total_ads);
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper]   ad_percentage:', (result.aggregates.ad_percentage * 100).toFixed(1) + '%');
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper]   suggested_count:', suggestedCount);
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper]   followed_count:', followedCount);
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper]   suggested_percentage:', (suggestedPercentage * 100).toFixed(1) + '%');
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper]   political_items: (not analyzed - requires AI)');
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper]   unique_creators:', result._computed.uniqueCreators.length);

  // Final platform summary for debugging (should match input summary)
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper] Posts after mapping, by platform:', inputPlatformSummary);
  if (CAPTURE_DEBUG) debugLog('[AlgorithmLens][Mapper] ======== MAPPING COMPLETE ========');
  
  return result;
}

/**
 * Detect operating system
 */
function detectOS() {
  if (typeof navigator === 'undefined') return 'UNKNOWN';
  
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('win')) return 'WINDOWS';
  if (userAgent.includes('mac')) return 'MACOS';
  if (userAgent.includes('linux')) return 'LINUX';
  if (userAgent.includes('cros')) return 'CHROMEOS';
  
  return 'UNKNOWN';
}

// Export for use in other modules
export default mapDesktopPostsToUnifiedResult;

