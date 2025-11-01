// Content taxonomy - hierarchical categorization of content types and themes

export interface TaxonomyNode {
  id: string;
  label: string;
  description: string;
  parent?: string;
  keywords: string[];
  children?: string[];
}

/**
 * Hierarchical content taxonomy
 * Organized as: Category > Subcategory > Specific Topic
 */
export const CONTENT_TAXONOMY: TaxonomyNode[] = [
  // ROOT CATEGORIES

  // Technology
  {
    id: 'tech',
    label: 'Technology',
    description: 'All technology-related content',
    keywords: ['technology', 'tech', 'digital', 'computer', 'software', 'hardware']
  },
  {
    id: 'tech.ai',
    label: 'Artificial Intelligence',
    description: 'AI, machine learning, and automation',
    parent: 'tech',
    keywords: ['ai', 'artificial intelligence', 'machine learning', 'deep learning', 'neural network', 'llm']
  },
  {
    id: 'tech.dev',
    label: 'Software Development',
    description: 'Programming and software engineering',
    parent: 'tech',
    keywords: ['coding', 'programming', 'developer', 'software', 'web dev', 'app development']
  },
  {
    id: 'tech.crypto',
    label: 'Cryptocurrency',
    description: 'Blockchain and digital currencies',
    parent: 'tech',
    keywords: ['crypto', 'bitcoin', 'ethereum', 'blockchain', 'nft', 'web3']
  },
  {
    id: 'tech.gadgets',
    label: 'Gadgets & Electronics',
    description: 'Consumer electronics and devices',
    parent: 'tech',
    keywords: ['gadget', 'smartphone', 'laptop', 'tablet', 'device', 'electronics']
  },

  // Health & Wellness
  {
    id: 'health',
    label: 'Health & Wellness',
    description: 'Physical and mental health topics',
    keywords: ['health', 'wellness', 'wellbeing', 'healthy', 'fitness']
  },
  {
    id: 'health.fitness',
    label: 'Fitness & Exercise',
    description: 'Physical fitness and training',
    parent: 'health',
    keywords: ['fitness', 'workout', 'exercise', 'gym', 'training', 'cardio', 'strength']
  },
  {
    id: 'health.nutrition',
    label: 'Nutrition & Diet',
    description: 'Food, diet, and nutrition',
    parent: 'health',
    keywords: ['nutrition', 'diet', 'food', 'eating', 'meal', 'calories', 'macros']
  },
  {
    id: 'health.mental',
    label: 'Mental Health',
    description: 'Psychology and emotional wellbeing',
    parent: 'health',
    keywords: ['mental health', 'therapy', 'anxiety', 'depression', 'mindfulness', 'meditation']
  },
  {
    id: 'health.medical',
    label: 'Medical & Healthcare',
    description: 'Medical topics and healthcare',
    parent: 'health',
    keywords: ['medical', 'doctor', 'healthcare', 'medicine', 'treatment', 'diagnosis']
  },

  // Business & Finance
  {
    id: 'business',
    label: 'Business & Finance',
    description: 'Commerce, economics, and financial topics',
    keywords: ['business', 'finance', 'money', 'economic', 'financial', 'commerce']
  },
  {
    id: 'business.entrepreneur',
    label: 'Entrepreneurship',
    description: 'Startups and business building',
    parent: 'business',
    keywords: ['entrepreneur', 'startup', 'founder', 'small business', 'side hustle']
  },
  {
    id: 'business.investing',
    label: 'Investing & Trading',
    description: 'Stock market and investments',
    parent: 'business',
    keywords: ['investing', 'stocks', 'trading', 'portfolio', 'market', 'dividend']
  },
  {
    id: 'business.personal_finance',
    label: 'Personal Finance',
    description: 'Money management and budgeting',
    parent: 'business',
    keywords: ['personal finance', 'budget', 'saving', 'debt', 'financial freedom']
  },
  {
    id: 'business.career',
    label: 'Career & Jobs',
    description: 'Professional development and employment',
    parent: 'business',
    keywords: ['career', 'job', 'work', 'employment', 'professional', 'hiring']
  },

  // Entertainment
  {
    id: 'entertainment',
    label: 'Entertainment',
    description: 'Media, arts, and entertainment',
    keywords: ['entertainment', 'media', 'arts', 'culture', 'fun']
  },
  {
    id: 'entertainment.movies',
    label: 'Movies & TV',
    description: 'Film and television content',
    parent: 'entertainment',
    keywords: ['movie', 'film', 'tv', 'television', 'series', 'show', 'cinema']
  },
  {
    id: 'entertainment.music',
    label: 'Music',
    description: 'Music and audio content',
    parent: 'entertainment',
    keywords: ['music', 'song', 'artist', 'album', 'concert', 'musician']
  },
  {
    id: 'entertainment.gaming',
    label: 'Gaming',
    description: 'Video games and esports',
    parent: 'entertainment',
    keywords: ['gaming', 'game', 'gamer', 'esports', 'video game', 'console']
  },
  {
    id: 'entertainment.books',
    label: 'Books & Literature',
    description: 'Reading and literary content',
    parent: 'entertainment',
    keywords: ['book', 'reading', 'literature', 'author', 'novel', 'fiction']
  },
  {
    id: 'entertainment.celebrities',
    label: 'Celebrities & Pop Culture',
    description: 'Celebrity news and pop culture',
    parent: 'entertainment',
    keywords: ['celebrity', 'famous', 'star', 'influencer', 'gossip']
  },

  // Lifestyle
  {
    id: 'lifestyle',
    label: 'Lifestyle',
    description: 'Personal lifestyle and interests',
    keywords: ['lifestyle', 'life', 'living', 'personal', 'daily']
  },
  {
    id: 'lifestyle.fashion',
    label: 'Fashion & Style',
    description: 'Clothing and fashion trends',
    parent: 'lifestyle',
    keywords: ['fashion', 'style', 'clothing', 'outfit', 'apparel', 'designer']
  },
  {
    id: 'lifestyle.beauty',
    label: 'Beauty & Skincare',
    description: 'Cosmetics and personal care',
    parent: 'lifestyle',
    keywords: ['beauty', 'skincare', 'makeup', 'cosmetics', 'skin', 'care']
  },
  {
    id: 'lifestyle.food',
    label: 'Food & Cooking',
    description: 'Culinary topics and recipes',
    parent: 'lifestyle',
    keywords: ['food', 'cooking', 'recipe', 'chef', 'meal', 'cuisine']
  },
  {
    id: 'lifestyle.travel',
    label: 'Travel & Tourism',
    description: 'Travel and vacation content',
    parent: 'lifestyle',
    keywords: ['travel', 'vacation', 'trip', 'tourism', 'destination', 'wanderlust']
  },
  {
    id: 'lifestyle.home',
    label: 'Home & Decor',
    description: 'Home improvement and decoration',
    parent: 'lifestyle',
    keywords: ['home', 'decor', 'interior', 'furniture', 'decoration', 'diy']
  },

  // Sports
  {
    id: 'sports',
    label: 'Sports',
    description: 'Athletic and competitive sports',
    keywords: ['sports', 'sport', 'athletic', 'game', 'team', 'competition']
  },
  {
    id: 'sports.football',
    label: 'Football/Soccer',
    description: 'American football and soccer',
    parent: 'sports',
    keywords: ['football', 'soccer', 'nfl', 'fifa', 'premier league']
  },
  {
    id: 'sports.basketball',
    label: 'Basketball',
    description: 'Basketball sports',
    parent: 'sports',
    keywords: ['basketball', 'nba', 'hoops', 'dunk']
  },
  {
    id: 'sports.other',
    label: 'Other Sports',
    description: 'Baseball, hockey, tennis, etc.',
    parent: 'sports',
    keywords: ['baseball', 'hockey', 'tennis', 'golf', 'racing', 'olympics']
  },

  // Society & Culture
  {
    id: 'society',
    label: 'Society & Culture',
    description: 'Social issues and cultural topics',
    keywords: ['society', 'social', 'culture', 'cultural', 'community']
  },
  {
    id: 'society.family',
    label: 'Family & Parenting',
    description: 'Family life and child-rearing',
    parent: 'society',
    keywords: ['family', 'parenting', 'parent', 'mom', 'dad', 'kids', 'children']
  },
  {
    id: 'society.relationships',
    label: 'Relationships & Dating',
    description: 'Romantic and interpersonal relationships',
    parent: 'society',
    keywords: ['relationship', 'dating', 'love', 'couple', 'romance', 'marriage']
  },
  {
    id: 'society.social_justice',
    label: 'Social Justice',
    description: 'Equity and justice issues',
    parent: 'society',
    keywords: ['justice', 'equality', 'rights', 'activism', 'discrimination']
  },

  // Education & Science
  {
    id: 'education',
    label: 'Education & Learning',
    description: 'Educational content and learning',
    keywords: ['education', 'learning', 'school', 'university', 'study', 'academic']
  },
  {
    id: 'science',
    label: 'Science & Research',
    description: 'Scientific topics and discoveries',
    keywords: ['science', 'research', 'study', 'scientist', 'experiment', 'discovery']
  },

  // Environment
  {
    id: 'environment',
    label: 'Environment & Nature',
    description: 'Environmental and ecological topics',
    keywords: ['environment', 'nature', 'climate', 'ecology', 'sustainability', 'green']
  },
  {
    id: 'environment.climate',
    label: 'Climate Change',
    description: 'Climate and environmental issues',
    parent: 'environment',
    keywords: ['climate change', 'global warming', 'carbon', 'emissions', 'renewable']
  },
  {
    id: 'environment.wildlife',
    label: 'Nature & Wildlife',
    description: 'Animals and natural habitats',
    parent: 'environment',
    keywords: ['wildlife', 'animals', 'nature', 'conservation', 'habitat']
  },

  // Hobbies & Interests
  {
    id: 'hobbies',
    label: 'Hobbies & Interests',
    description: 'Recreational activities and interests',
    keywords: ['hobby', 'interest', 'passion', 'recreation', 'leisure']
  },
  {
    id: 'hobbies.photography',
    label: 'Photography',
    description: 'Photography and photo content',
    parent: 'hobbies',
    keywords: ['photography', 'photo', 'photographer', 'camera', 'picture']
  },
  {
    id: 'hobbies.art',
    label: 'Art & Design',
    description: 'Visual arts and creative design',
    parent: 'hobbies',
    keywords: ['art', 'artist', 'design', 'creative', 'drawing', 'painting']
  },
  {
    id: 'hobbies.diy',
    label: 'DIY & Crafts',
    description: 'Do-it-yourself and crafting',
    parent: 'hobbies',
    keywords: ['diy', 'craft', 'handmade', 'project', 'maker']
  },

  // Other
  {
    id: 'pets',
    label: 'Pets & Animals',
    description: 'Pet care and animal content',
    keywords: ['pet', 'dog', 'cat', 'animal', 'puppy', 'kitten']
  },
  {
    id: 'automotive',
    label: 'Automotive',
    description: 'Cars and vehicles',
    keywords: ['car', 'auto', 'vehicle', 'automotive', 'driving']
  },
  {
    id: 'spirituality',
    label: 'Spirituality & Philosophy',
    description: 'Spiritual and philosophical topics',
    keywords: ['spirituality', 'philosophy', 'meditation', 'consciousness', 'wisdom']
  },
  {
    id: 'news',
    label: 'News & Current Events',
    description: 'News and current affairs',
    keywords: ['news', 'current events', 'breaking', 'headline', 'journalism']
  },
  {
    id: 'politics',
    label: 'Politics & Government',
    description: 'Political topics and governance',
    keywords: ['politics', 'political', 'government', 'election', 'policy']
  }
];

/**
 * Build taxonomy lookup map
 */
export function buildTaxonomyLookup(): Map<string, TaxonomyNode> {
  const lookup = new Map<string, TaxonomyNode>();
  for (const node of CONTENT_TAXONOMY) {
    lookup.set(node.id, node);
  }
  return lookup;
}

/**
 * Get taxonomy node by ID
 */
export function getTaxonomyNode(id: string): TaxonomyNode | undefined {
  return CONTENT_TAXONOMY.find(node => node.id === id);
}

/**
 * Get all children of a taxonomy node
 */
export function getTaxonomyChildren(parentId: string): TaxonomyNode[] {
  return CONTENT_TAXONOMY.filter(node => node.parent === parentId);
}

/**
 * Get root taxonomy categories (no parent)
 */
export function getRootCategories(): TaxonomyNode[] {
  return CONTENT_TAXONOMY.filter(node => !node.parent);
}

/**
 * Get full path from root to node
 */
export function getTaxonomyPath(nodeId: string): TaxonomyNode[] {
  const path: TaxonomyNode[] = [];
  let currentId: string | undefined = nodeId;

  while (currentId) {
    const node = getTaxonomyNode(currentId);
    if (!node) break;
    path.unshift(node); // Add to beginning
    currentId = node.parent;
  }

  return path;
}

/**
 * Classify text into taxonomy categories
 */
export function classifyContent(text: string): string[] {
  const lowerText = text.toLowerCase();
  const matches = new Set<string>();

  for (const node of CONTENT_TAXONOMY) {
    for (const keyword of node.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        matches.add(node.id);
        break; // One match per node is enough
      }
    }
  }

  return Array.from(matches);
}

/**
 * Get most specific category from a list of matches
 * (prefer child categories over parent categories)
 */
export function getMostSpecificCategory(categoryIds: string[]): string | undefined {
  if (categoryIds.length === 0) return undefined;
  if (categoryIds.length === 1) return categoryIds[0];

  // Build parent-child relationships
  const lookup = buildTaxonomyLookup();

  // Remove any parent if its child is also in the list
  const filtered = categoryIds.filter(id => {
    const node = lookup.get(id);
    if (!node) return true;

    // Check if any other category in the list is a child of this one
    const hasChildInList = categoryIds.some(otherId => {
      const otherNode = lookup.get(otherId);
      return otherNode && otherNode.parent === id;
    });

    return !hasChildInList;
  });

  // Return the first remaining one (or original first if none filtered)
  return filtered[0] || categoryIds[0];
}
