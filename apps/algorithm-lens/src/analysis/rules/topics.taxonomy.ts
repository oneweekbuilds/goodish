// Topics taxonomy with keywords and representative hashtags
// Used for topic diversity analysis

export interface TopicDefinition {
  topic: string;
  keywords: string[];
  hashtags: string[];
}

/**
 * Topics taxonomy with 40+ topics
 * Each topic includes keywords and representative hashtags for detection
 */
export const TOPICS: TopicDefinition[] = [
  // Technology (5 topics)
  {
    topic: 'artificial_intelligence',
    keywords: ['ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning', 'neural network', 'chatgpt', 'gpt', 'llm', 'openai', 'anthropic', 'claude', 'gemini', 'bard'],
    hashtags: ['ai', 'artificialintelligence', 'machinelearning', 'deeplearning', 'chatgpt', 'gpt4', 'llm', 'aiart', 'aitools', 'generativeai']
  },
  {
    topic: 'software_development',
    keywords: ['coding', 'programming', 'developer', 'software', 'web development', 'app development', 'javascript', 'python', 'react', 'github', 'git', 'open source', 'api', 'frontend', 'backend'],
    hashtags: ['coding', 'programming', 'developer', 'webdev', 'javascript', 'python', 'reactjs', 'nodejs', 'github', 'opensource', 'devlife', 'frontend', 'backend', 'fullstack']
  },
  {
    topic: 'cryptocurrency',
    keywords: ['crypto', 'cryptocurrency', 'bitcoin', 'ethereum', 'blockchain', 'nft', 'web3', 'defi', 'altcoin', 'hodl', 'mining', 'wallet'],
    hashtags: ['crypto', 'cryptocurrency', 'bitcoin', 'btc', 'ethereum', 'eth', 'blockchain', 'nft', 'web3', 'defi', 'altcoin', 'hodl']
  },
  {
    topic: 'gadgets_electronics',
    keywords: ['tech', 'gadget', 'smartphone', 'laptop', 'tablet', 'wearable', 'smartwatch', 'headphones', 'earbuds', 'electronics', 'device'],
    hashtags: ['tech', 'gadgets', 'technology', 'smartphone', 'iphone', 'android', 'laptop', 'electronics', 'techreview', 'unboxing']
  },
  {
    topic: 'gaming',
    keywords: ['gaming', 'gamer', 'video game', 'esports', 'twitch', 'stream', 'gameplay', 'console', 'pc gaming', 'xbox', 'playstation', 'nintendo'],
    hashtags: ['gaming', 'gamer', 'videogames', 'esports', 'twitch', 'gamingcommunity', 'gameplay', 'pcgaming', 'consolegaming', 'streamer']
  },

  // Health & Fitness (4 topics)
  {
    topic: 'fitness_exercise',
    keywords: ['fitness', 'workout', 'exercise', 'gym', 'training', 'strength', 'cardio', 'running', 'yoga', 'pilates', 'crossfit', 'bodybuilding'],
    hashtags: ['fitness', 'workout', 'exercise', 'gym', 'fitfam', 'training', 'gymlife', 'fitnessmotivation', 'gains', 'cardio', 'yoga']
  },
  {
    topic: 'nutrition_diet',
    keywords: ['nutrition', 'diet', 'healthy eating', 'meal prep', 'protein', 'calories', 'macros', 'vegan', 'vegetarian', 'keto', 'paleo', 'intermittent fasting'],
    hashtags: ['nutrition', 'diet', 'healthyeating', 'mealprep', 'cleaneating', 'vegan', 'vegetarian', 'keto', 'paleo', 'protein', 'macros']
  },
  {
    topic: 'mental_health',
    keywords: ['mental health', 'therapy', 'anxiety', 'depression', 'mindfulness', 'meditation', 'self care', 'wellness', 'stress', 'burnout'],
    hashtags: ['mentalhealth', 'mentalhealthawareness', 'therapy', 'anxiety', 'depression', 'mindfulness', 'meditation', 'selfcare', 'wellness', 'mentalhealthmatters']
  },
  {
    topic: 'medical_health',
    keywords: ['health', 'medical', 'doctor', 'healthcare', 'medicine', 'disease', 'treatment', 'vaccine', 'symptoms', 'diagnosis', 'patient'],
    hashtags: ['health', 'healthcare', 'medical', 'medicine', 'healthylifestyle', 'wellness', 'publichealth', 'healthyliving']
  },

  // Business & Finance (4 topics)
  {
    topic: 'entrepreneurship',
    keywords: ['entrepreneur', 'startup', 'business owner', 'founder', 'small business', 'side hustle', 'solopreneur', 'business growth', 'scaling'],
    hashtags: ['entrepreneur', 'entrepreneurship', 'startup', 'founder', 'smallbusiness', 'sidehustle', 'businessowner', 'startuplife', 'solopreneur']
  },
  {
    topic: 'investing_stocks',
    keywords: ['investing', 'stocks', 'market', 'trading', 'portfolio', 'dividend', 'index fund', 'etf', 'bonds', 'retirement', '401k', 'ira'],
    hashtags: ['investing', 'stocks', 'stockmarket', 'trading', 'investor', 'finance', 'portfolio', 'dividends', 'passiveincome']
  },
  {
    topic: 'personal_finance',
    keywords: ['money', 'finance', 'budget', 'saving', 'debt', 'credit', 'financial freedom', 'fire', 'frugal', 'emergency fund'],
    hashtags: ['personalfinance', 'moneytips', 'budgeting', 'saving', 'debtfree', 'financialfreedom', 'fire', 'frugal', 'moneysaving']
  },
  {
    topic: 'career_jobs',
    keywords: ['career', 'job', 'hiring', 'resume', 'interview', 'work', 'employment', 'job search', 'professional development', 'linkedin'],
    hashtags: ['career', 'jobs', 'hiring', 'jobsearch', 'careerdevelopment', 'professionaldevelopment', 'worklife', 'careeradvice']
  },

  // Lifestyle (5 topics)
  {
    topic: 'fashion',
    keywords: ['fashion', 'style', 'outfit', 'clothing', 'apparel', 'designer', 'runway', 'trend', 'accessories', 'shoes'],
    hashtags: ['fashion', 'style', 'ootd', 'outfitoftheday', 'fashionblogger', 'fashionista', 'instafashion', 'streetstyle', 'fashionweek']
  },
  {
    topic: 'beauty_skincare',
    keywords: ['beauty', 'skincare', 'makeup', 'cosmetics', 'skin', 'routine', 'serum', 'moisturizer', 'cleanser', 'sunscreen'],
    hashtags: ['beauty', 'skincare', 'makeup', 'beautyblogger', 'skincarerotine', 'beautytips', 'makeuptutorial', 'cosmetics']
  },
  {
    topic: 'food_cooking',
    keywords: ['food', 'cooking', 'recipe', 'chef', 'baking', 'meal', 'cuisine', 'restaurant', 'foodie', 'dinner', 'lunch'],
    hashtags: ['food', 'foodie', 'cooking', 'recipe', 'foodporn', 'instafood', 'foodphotography', 'homecooking', 'baking', 'chef']
  },
  {
    topic: 'travel',
    keywords: ['travel', 'vacation', 'trip', 'destination', 'tourism', 'wanderlust', 'adventure', 'explore', 'backpacking', 'hotel'],
    hashtags: ['travel', 'traveling', 'vacation', 'wanderlust', 'instatravel', 'travelgram', 'adventure', 'explore', 'tourism', 'travelphotography']
  },
  {
    topic: 'home_decor',
    keywords: ['home', 'decor', 'interior design', 'furniture', 'decoration', 'diy', 'home improvement', 'renovation', 'organize'],
    hashtags: ['homedecor', 'interiordesign', 'homedesign', 'homedecoration', 'furniture', 'diy', 'homeimprovement', 'renovation']
  },

  // Entertainment (4 topics)
  {
    topic: 'movies_tv',
    keywords: ['movie', 'film', 'cinema', 'tv show', 'series', 'netflix', 'streaming', 'actor', 'director', 'hollywood'],
    hashtags: ['movies', 'film', 'cinema', 'tvshow', 'netflix', 'streaming', 'movienight', 'filmreview', 'hollywood']
  },
  {
    topic: 'music',
    keywords: ['music', 'song', 'artist', 'album', 'concert', 'band', 'singer', 'spotify', 'musician', 'genre', 'playlist'],
    hashtags: ['music', 'musician', 'song', 'artist', 'newmusic', 'musicvideo', 'concert', 'spotify', 'playlist', 'musiclover']
  },
  {
    topic: 'books_reading',
    keywords: ['book', 'reading', 'author', 'novel', 'fiction', 'nonfiction', 'literature', 'bookworm', 'library', 'bookclub'],
    hashtags: ['books', 'reading', 'bookstagram', 'bookworm', 'booklover', 'bookclub', 'amreading', 'bookish', 'author']
  },
  {
    topic: 'celebrities',
    keywords: ['celebrity', 'celeb', 'famous', 'star', 'influencer', 'kardashian', 'beyonce', 'taylor swift', 'gossip', 'entertainment news'],
    hashtags: ['celebrity', 'celeb', 'celebrities', 'famous', 'entertainment', 'celebnews', 'gossip', 'hollywood']
  },

  // Sports (3 topics)
  {
    topic: 'sports_general',
    keywords: ['sports', 'athlete', 'championship', 'tournament', 'game', 'match', 'team', 'league', 'olympics', 'world cup'],
    hashtags: ['sports', 'athlete', 'championship', 'tournament', 'sportsnews', 'sportslife', 'teamwork']
  },
  {
    topic: 'football_soccer',
    keywords: ['football', 'soccer', 'nfl', 'premier league', 'champions league', 'messi', 'ronaldo', 'world cup', 'fifa'],
    hashtags: ['football', 'soccer', 'nfl', 'premierleague', 'championsleague', 'fifa', 'worldcup', 'footballseason']
  },
  {
    topic: 'basketball',
    keywords: ['basketball', 'nba', 'lebron', 'hoops', 'dunk', 'playoff', 'finals', 'ncaa'],
    hashtags: ['basketball', 'nba', 'hoops', 'basketball', 'nbabasketball', 'basketballlife', 'playoffs']
  },

  // Social & Relationships (3 topics)
  {
    topic: 'parenting',
    keywords: ['parenting', 'parent', 'mom', 'dad', 'child', 'kids', 'baby', 'toddler', 'family', 'motherhood', 'fatherhood'],
    hashtags: ['parenting', 'parenthood', 'mom', 'dad', 'momlife', 'dadlife', 'kids', 'baby', 'toddler', 'family']
  },
  {
    topic: 'relationships_dating',
    keywords: ['relationship', 'dating', 'love', 'couple', 'boyfriend', 'girlfriend', 'marriage', 'wedding', 'engagement', 'romance'],
    hashtags: ['relationship', 'dating', 'love', 'couple', 'couplegoals', 'relationshipgoals', 'married', 'wedding', 'engagement']
  },
  {
    topic: 'social_justice',
    keywords: ['justice', 'equality', 'rights', 'activism', 'protest', 'movement', 'advocacy', 'discrimination', 'inequality'],
    hashtags: ['socialjustice', 'equality', 'justice', 'activism', 'humanrights', 'civilrights', 'advocacy', 'protest']
  },

  // Education & Learning (2 topics)
  {
    topic: 'education',
    keywords: ['education', 'school', 'student', 'teacher', 'learning', 'university', 'college', 'academic', 'study', 'classroom'],
    hashtags: ['education', 'learning', 'school', 'student', 'teacher', 'university', 'college', 'study', 'classroom']
  },
  {
    topic: 'science',
    keywords: ['science', 'research', 'study', 'scientist', 'experiment', 'discovery', 'biology', 'chemistry', 'physics', 'lab'],
    hashtags: ['science', 'research', 'scientist', 'stem', 'biology', 'chemistry', 'physics', 'lab', 'scicomm']
  },

  // Environment & Sustainability (2 topics)
  {
    topic: 'climate_environment',
    keywords: ['climate change', 'global warming', 'environment', 'carbon', 'emissions', 'renewable', 'sustainability', 'eco-friendly', 'green'],
    hashtags: ['climatechange', 'globalwarming', 'environment', 'sustainability', 'ecofriendly', 'green', 'climateaction', 'renewable']
  },
  {
    topic: 'nature_wildlife',
    keywords: ['nature', 'wildlife', 'animals', 'conservation', 'endangered', 'habitat', 'ecology', 'biodiversity', 'outdoors'],
    hashtags: ['nature', 'wildlife', 'animals', 'conservation', 'naturephotography', 'outdoors', 'ecology', 'biodiversity']
  },

  // Hobbies & Interests (3 topics)
  {
    topic: 'photography',
    keywords: ['photography', 'photo', 'photographer', 'camera', 'picture', 'lens', 'portrait', 'landscape', 'editing'],
    hashtags: ['photography', 'photo', 'photographer', 'photooftheday', 'picoftheday', 'camera', 'portrait', 'landscape']
  },
  {
    topic: 'art_design',
    keywords: ['art', 'artist', 'design', 'creative', 'drawing', 'painting', 'illustration', 'graphic design', 'artwork'],
    hashtags: ['art', 'artist', 'artwork', 'design', 'creative', 'drawing', 'painting', 'illustration', 'graphicdesign', 'artistsoninstagram']
  },
  {
    topic: 'diy_crafts',
    keywords: ['diy', 'craft', 'handmade', 'crafting', 'project', 'tutorial', 'maker', 'creative'],
    hashtags: ['diy', 'crafts', 'handmade', 'crafting', 'diyproject', 'crafty', 'maker', 'creative', 'doityourself']
  },

  // Automotive (1 topic)
  {
    topic: 'cars_automotive',
    keywords: ['car', 'auto', 'vehicle', 'driving', 'automotive', 'tesla', 'electric vehicle', 'ev', 'racing', 'mechanic'],
    hashtags: ['cars', 'car', 'auto', 'automotive', 'carsofinstagram', 'carporn', 'racing', 'electricvehicle', 'ev']
  },

  // Pets (1 topic)
  {
    topic: 'pets',
    keywords: ['pet', 'dog', 'cat', 'puppy', 'kitten', 'animal', 'pet care', 'veterinary', 'adoption'],
    hashtags: ['pets', 'dog', 'cat', 'puppy', 'kitten', 'dogsofinstagram', 'catsofinstagram', 'petlove', 'petstagram']
  },

  // Spirituality & Philosophy (1 topic)
  {
    topic: 'spirituality',
    keywords: ['spirituality', 'meditation', 'mindfulness', 'consciousness', 'awakening', 'enlightenment', 'philosophy', 'wisdom'],
    hashtags: ['spirituality', 'meditation', 'mindfulness', 'consciousness', 'spiritual', 'awakening', 'philosophy', 'wisdom']
  },

  // News & Current Events (2 topics)
  {
    topic: 'news_current_events',
    keywords: ['news', 'breaking', 'current events', 'headline', 'report', 'journalism', 'press', 'media'],
    hashtags: ['news', 'breakingnews', 'currentevents', 'worldnews', 'journalism', 'media', 'press']
  },
  {
    topic: 'politics',
    keywords: ['politics', 'government', 'election', 'vote', 'policy', 'congress', 'senate', 'president', 'democracy'],
    hashtags: ['politics', 'political', 'government', 'election', 'vote', 'policy', 'democracy', 'congress']
  }
];

/**
 * Build topic lookup map by keywords
 * @returns Map of lowercase keywords to topic names
 */
export function buildTopicKeywordLookup(): Map<string, string> {
  const lookup = new Map<string, string>();

  for (const topic of TOPICS) {
    for (const keyword of topic.keywords) {
      lookup.set(keyword.toLowerCase(), topic.topic);
    }
  }

  return lookup;
}

/**
 * Build topic lookup map by hashtags
 * @returns Map of lowercase hashtags to topic names
 */
export function buildTopicHashtagLookup(): Map<string, string> {
  const lookup = new Map<string, string>();

  for (const topic of TOPICS) {
    for (const hashtag of topic.hashtags) {
      const cleanTag = hashtag.toLowerCase().replace(/^#/, '');
      lookup.set(cleanTag, topic.topic);
    }
  }

  return lookup;
}

/**
 * Detect topics in text using keywords
 * @param text - Text to analyze
 * @returns Array of matched topic names
 */
export function detectTopics(text: string): string[] {
  const lowerText = text.toLowerCase();
  const matches = new Set<string>();
  const keywordLookup = buildTopicKeywordLookup();

  // Check each keyword
  for (const [keyword, topic] of keywordLookup) {
    if (lowerText.includes(keyword)) {
      matches.add(topic);
    }
  }

  return Array.from(matches);
}

/**
 * Detect topics from hashtags
 * @param hashtags - Array of hashtags (with or without # prefix)
 * @returns Array of matched topic names
 */
export function detectTopicsFromHashtags(hashtags: string[]): string[] {
  const matches = new Set<string>();
  const hashtagLookup = buildTopicHashtagLookup();

  for (const hashtag of hashtags) {
    const cleanTag = hashtag.toLowerCase().replace(/^#/, '');
    const topic = hashtagLookup.get(cleanTag);
    if (topic) {
      matches.add(topic);
    }
  }

  return Array.from(matches);
}

/**
 * Get topic definition by name
 * @param topicName - Name of the topic
 * @returns Topic definition or undefined
 */
export function getTopicDefinition(topicName: string): TopicDefinition | undefined {
  return TOPICS.find(t => t.topic === topicName);
}

/**
 * Get all topic names
 * @returns Array of all topic names
 */
export function getAllTopics(): string[] {
  return TOPICS.map(t => t.topic);
}
