// Political lexicon for detecting political content and lean
// Balanced coverage of left-leaning, right-leaning, and neutral/civic terms

export interface PoliticalTerm {
  term: string;
  lean: 'left' | 'right' | 'neutral';
  weight: number; // 0.5 = weak signal, 1.0 = strong signal, 2.0 = very strong signal
  category?: 'policy' | 'figure' | 'outlet' | 'hashtag' | 'phrase';
}

/**
 * Political terms lexicon with 200+ entries
 * Designed to detect political content while maintaining balance
 */
export const POLITICAL_TERMS: PoliticalTerm[] = [
  // LEFT-LEANING TERMS (70 entries)

  // Policy/Issues
  { term: 'universal healthcare', lean: 'left', weight: 1.5, category: 'policy' },
  { term: 'medicare for all', lean: 'left', weight: 2.0, category: 'policy' },
  { term: 'green new deal', lean: 'left', weight: 2.0, category: 'policy' },
  { term: 'climate action', lean: 'left', weight: 1.0, category: 'policy' },
  { term: 'climate justice', lean: 'left', weight: 1.5, category: 'policy' },
  { term: 'living wage', lean: 'left', weight: 1.5, category: 'policy' },
  { term: 'minimum wage increase', lean: 'left', weight: 1.5, category: 'policy' },
  { term: 'wealth tax', lean: 'left', weight: 2.0, category: 'policy' },
  { term: 'tax the rich', lean: 'left', weight: 2.0, category: 'policy' },
  { term: 'progressive taxation', lean: 'left', weight: 1.5, category: 'policy' },
  { term: 'student debt cancellation', lean: 'left', weight: 2.0, category: 'policy' },
  { term: 'free college', lean: 'left', weight: 1.5, category: 'policy' },
  { term: 'workers rights', lean: 'left', weight: 1.0, category: 'policy' },
  { term: 'union organizing', lean: 'left', weight: 1.5, category: 'policy' },
  { term: 'collective bargaining', lean: 'left', weight: 1.0, category: 'policy' },
  { term: 'reproductive rights', lean: 'left', weight: 1.5, category: 'policy' },
  { term: 'pro choice', lean: 'left', weight: 2.0, category: 'policy' },
  { term: 'abortion rights', lean: 'left', weight: 1.5, category: 'policy' },
  { term: 'bodily autonomy', lean: 'left', weight: 1.0, category: 'policy' },
  { term: 'lgbtq rights', lean: 'left', weight: 1.0, category: 'policy' },
  { term: 'trans rights', lean: 'left', weight: 1.5, category: 'policy' },
  { term: 'marriage equality', lean: 'left', weight: 1.0, category: 'policy' },
  { term: 'gun control', lean: 'left', weight: 1.5, category: 'policy' },
  { term: 'gun reform', lean: 'left', weight: 1.5, category: 'policy' },
  { term: 'assault weapons ban', lean: 'left', weight: 2.0, category: 'policy' },
  { term: 'racial justice', lean: 'left', weight: 1.0, category: 'policy' },
  { term: 'criminal justice reform', lean: 'left', weight: 1.0, category: 'policy' },
  { term: 'police reform', lean: 'left', weight: 1.5, category: 'policy' },
  { term: 'defund police', lean: 'left', weight: 2.0, category: 'policy' },
  { term: 'systemic racism', lean: 'left', weight: 1.5, category: 'policy' },
  { term: 'affirmative action', lean: 'left', weight: 1.5, category: 'policy' },
  { term: 'immigration reform', lean: 'left', weight: 1.0, category: 'policy' },
  { term: 'pathway to citizenship', lean: 'left', weight: 1.5, category: 'policy' },
  { term: 'dreamer', lean: 'left', weight: 1.0, category: 'policy' },
  { term: 'sanctuary city', lean: 'left', weight: 1.5, category: 'policy' },

  // Figures/Organizations
  { term: 'bernie sanders', lean: 'left', weight: 1.5, category: 'figure' },
  { term: 'aoc', lean: 'left', weight: 2.0, category: 'figure' },
  { term: 'alexandria ocasio-cortez', lean: 'left', weight: 2.0, category: 'figure' },
  { term: 'elizabeth warren', lean: 'left', weight: 1.5, category: 'figure' },
  { term: 'ilhan omar', lean: 'left', weight: 1.5, category: 'figure' },
  { term: 'rashida tlaib', lean: 'left', weight: 1.5, category: 'figure' },
  { term: 'the squad', lean: 'left', weight: 2.0, category: 'figure' },
  { term: 'aclu', lean: 'left', weight: 1.0, category: 'figure' },
  { term: 'planned parenthood', lean: 'left', weight: 1.5, category: 'figure' },
  { term: 'democratic socialists', lean: 'left', weight: 2.0, category: 'figure' },

  // Outlets
  { term: 'msnbc', lean: 'left', weight: 1.0, category: 'outlet' },
  { term: 'cnn', lean: 'left', weight: 0.5, category: 'outlet' },
  { term: 'huffpost', lean: 'left', weight: 1.5, category: 'outlet' },
  { term: 'mother jones', lean: 'left', weight: 1.5, category: 'outlet' },
  { term: 'the nation', lean: 'left', weight: 1.5, category: 'outlet' },
  { term: 'democracy now', lean: 'left', weight: 1.5, category: 'outlet' },
  { term: 'jacobin', lean: 'left', weight: 2.0, category: 'outlet' },

  // Hashtags/Phrases
  { term: 'resistance', lean: 'left', weight: 1.5, category: 'hashtag' },
  { term: 'blm', lean: 'left', weight: 1.5, category: 'hashtag' },
  { term: 'black lives matter', lean: 'left', weight: 1.5, category: 'hashtag' },
  { term: 'metoo', lean: 'left', weight: 1.0, category: 'hashtag' },
  { term: 'believe women', lean: 'left', weight: 1.5, category: 'hashtag' },
  { term: 'woke', lean: 'left', weight: 1.0, category: 'phrase' },
  { term: 'social justice', lean: 'left', weight: 1.0, category: 'phrase' },
  { term: 'equity', lean: 'left', weight: 0.5, category: 'phrase' },
  { term: 'intersectionality', lean: 'left', weight: 1.5, category: 'phrase' },
  { term: 'marginalized communities', lean: 'left', weight: 1.0, category: 'phrase' },
  { term: 'progressive', lean: 'left', weight: 1.0, category: 'phrase' },
  { term: 'liberal', lean: 'left', weight: 0.5, category: 'phrase' },
  { term: 'left wing', lean: 'left', weight: 1.5, category: 'phrase' },
  { term: 'democratic party', lean: 'left', weight: 0.5, category: 'phrase' },
  { term: 'vote blue', lean: 'left', weight: 2.0, category: 'hashtag' },
  { term: 'blue wave', lean: 'left', weight: 2.0, category: 'hashtag' },
  { term: 'resistance movement', lean: 'left', weight: 1.5, category: 'phrase' },
  { term: 'anti-fascist', lean: 'left', weight: 1.5, category: 'phrase' },

  // RIGHT-LEANING TERMS (70 entries)

  // Policy/Issues
  { term: 'tax cuts', lean: 'right', weight: 1.5, category: 'policy' },
  { term: 'lower taxes', lean: 'right', weight: 1.0, category: 'policy' },
  { term: 'small government', lean: 'right', weight: 1.5, category: 'policy' },
  { term: 'limited government', lean: 'right', weight: 1.5, category: 'policy' },
  { term: 'free market', lean: 'right', weight: 1.5, category: 'policy' },
  { term: 'deregulation', lean: 'right', weight: 1.5, category: 'policy' },
  { term: 'school choice', lean: 'right', weight: 1.5, category: 'policy' },
  { term: 'voucher program', lean: 'right', weight: 1.5, category: 'policy' },
  { term: 'border security', lean: 'right', weight: 1.5, category: 'policy' },
  { term: 'build the wall', lean: 'right', weight: 2.0, category: 'policy' },
  { term: 'illegal immigration', lean: 'right', weight: 1.5, category: 'policy' },
  { term: 'second amendment', lean: 'right', weight: 1.5, category: 'policy' },
  { term: '2a rights', lean: 'right', weight: 2.0, category: 'policy' },
  { term: 'gun rights', lean: 'right', weight: 1.5, category: 'policy' },
  { term: 'shall not be infringed', lean: 'right', weight: 2.0, category: 'policy' },
  { term: 'pro life', lean: 'right', weight: 2.0, category: 'policy' },
  { term: 'right to life', lean: 'right', weight: 1.5, category: 'policy' },
  { term: 'unborn', lean: 'right', weight: 1.0, category: 'policy' },
  { term: 'sanctity of life', lean: 'right', weight: 1.5, category: 'policy' },
  { term: 'traditional values', lean: 'right', weight: 1.5, category: 'policy' },
  { term: 'family values', lean: 'right', weight: 1.5, category: 'policy' },
  { term: 'religious freedom', lean: 'right', weight: 1.5, category: 'policy' },
  { term: 'religious liberty', lean: 'right', weight: 1.5, category: 'policy' },
  { term: 'states rights', lean: 'right', weight: 1.5, category: 'policy' },
  { term: 'law and order', lean: 'right', weight: 1.5, category: 'policy' },
  { term: 'back the blue', lean: 'right', weight: 2.0, category: 'policy' },
  { term: 'blue lives matter', lean: 'right', weight: 2.0, category: 'policy' },
  { term: 'tough on crime', lean: 'right', weight: 1.5, category: 'policy' },
  { term: 'energy independence', lean: 'right', weight: 1.0, category: 'policy' },
  { term: 'fossil fuels', lean: 'right', weight: 1.0, category: 'policy' },
  { term: 'drill baby drill', lean: 'right', weight: 2.0, category: 'policy' },
  { term: 'parental rights', lean: 'right', weight: 1.5, category: 'policy' },
  { term: 'anti-woke', lean: 'right', weight: 2.0, category: 'policy' },
  { term: 'critical race theory', lean: 'right', weight: 1.5, category: 'policy' },
  { term: 'crt', lean: 'right', weight: 1.5, category: 'policy' },

  // Figures/Organizations
  { term: 'donald trump', lean: 'right', weight: 1.5, category: 'figure' },
  { term: 'trump', lean: 'right', weight: 1.0, category: 'figure' },
  { term: 'maga', lean: 'right', weight: 2.0, category: 'figure' },
  { term: 'make america great again', lean: 'right', weight: 2.0, category: 'figure' },
  { term: 'ron desantis', lean: 'right', weight: 1.5, category: 'figure' },
  { term: 'marjorie taylor greene', lean: 'right', weight: 1.5, category: 'figure' },
  { term: 'matt gaetz', lean: 'right', weight: 1.5, category: 'figure' },
  { term: 'lauren boebert', lean: 'right', weight: 1.5, category: 'figure' },
  { term: 'ted cruz', lean: 'right', weight: 1.5, category: 'figure' },
  { term: 'mitch mcconnell', lean: 'right', weight: 1.0, category: 'figure' },
  { term: 'nra', lean: 'right', weight: 1.5, category: 'figure' },
  { term: 'heritage foundation', lean: 'right', weight: 1.5, category: 'figure' },
  { term: 'turning point', lean: 'right', weight: 1.5, category: 'figure' },

  // Outlets
  { term: 'fox news', lean: 'right', weight: 1.5, category: 'outlet' },
  { term: 'breitbart', lean: 'right', weight: 2.0, category: 'outlet' },
  { term: 'daily wire', lean: 'right', weight: 1.5, category: 'outlet' },
  { term: 'newsmax', lean: 'right', weight: 1.5, category: 'outlet' },
  { term: 'oann', lean: 'right', weight: 2.0, category: 'outlet' },
  { term: 'national review', lean: 'right', weight: 1.5, category: 'outlet' },
  { term: 'washington examiner', lean: 'right', weight: 1.0, category: 'outlet' },

  // Hashtags/Phrases
  { term: 'america first', lean: 'right', weight: 2.0, category: 'hashtag' },
  { term: 'wwg1wga', lean: 'right', weight: 2.0, category: 'hashtag' },
  { term: 'stop the steal', lean: 'right', weight: 2.0, category: 'hashtag' },
  { term: 'election integrity', lean: 'right', weight: 1.5, category: 'hashtag' },
  { term: 'voter fraud', lean: 'right', weight: 1.5, category: 'phrase' },
  { term: 'fake news', lean: 'right', weight: 1.5, category: 'phrase' },
  { term: 'mainstream media', lean: 'right', weight: 1.0, category: 'phrase' },
  { term: 'deep state', lean: 'right', weight: 2.0, category: 'phrase' },
  { term: 'swamp', lean: 'right', weight: 1.5, category: 'phrase' },
  { term: 'drain the swamp', lean: 'right', weight: 2.0, category: 'phrase' },
  { term: 'conservative', lean: 'right', weight: 1.0, category: 'phrase' },
  { term: 'right wing', lean: 'right', weight: 1.5, category: 'phrase' },
  { term: 'republican party', lean: 'right', weight: 0.5, category: 'phrase' },
  { term: 'vote red', lean: 'right', weight: 2.0, category: 'hashtag' },
  { term: 'red wave', lean: 'right', weight: 2.0, category: 'hashtag' },
  { term: 'patriot', lean: 'right', weight: 1.0, category: 'phrase' },
  { term: 'freedom fighter', lean: 'right', weight: 1.5, category: 'phrase' },
  { term: 'cancel culture', lean: 'right', weight: 1.5, category: 'phrase' },
  { term: 'woke mob', lean: 'right', weight: 2.0, category: 'phrase' },

  // NEUTRAL/CIVIC TERMS (60 entries)

  // General political
  { term: 'congress', lean: 'neutral', weight: 0.5, category: 'figure' },
  { term: 'senate', lean: 'neutral', weight: 0.5, category: 'figure' },
  { term: 'house of representatives', lean: 'neutral', weight: 0.5, category: 'figure' },
  { term: 'supreme court', lean: 'neutral', weight: 0.5, category: 'figure' },
  { term: 'white house', lean: 'neutral', weight: 0.5, category: 'figure' },
  { term: 'president', lean: 'neutral', weight: 0.5, category: 'figure' },
  { term: 'election', lean: 'neutral', weight: 0.5, category: 'policy' },
  { term: 'voting', lean: 'neutral', weight: 0.5, category: 'policy' },
  { term: 'ballot', lean: 'neutral', weight: 0.5, category: 'policy' },
  { term: 'campaign', lean: 'neutral', weight: 0.5, category: 'policy' },
  { term: 'debate', lean: 'neutral', weight: 0.5, category: 'policy' },
  { term: 'primary', lean: 'neutral', weight: 0.5, category: 'policy' },
  { term: 'caucus', lean: 'neutral', weight: 0.5, category: 'policy' },
  { term: 'legislation', lean: 'neutral', weight: 0.5, category: 'policy' },
  { term: 'bill', lean: 'neutral', weight: 0.5, category: 'policy' },
  { term: 'policy', lean: 'neutral', weight: 0.5, category: 'policy' },
  { term: 'reform', lean: 'neutral', weight: 0.5, category: 'policy' },

  // Civic engagement
  { term: 'register to vote', lean: 'neutral', weight: 0.5, category: 'policy' },
  { term: 'voter registration', lean: 'neutral', weight: 0.5, category: 'policy' },
  { term: 'civic duty', lean: 'neutral', weight: 0.5, category: 'phrase' },
  { term: 'civic engagement', lean: 'neutral', weight: 0.5, category: 'phrase' },
  { term: 'town hall', lean: 'neutral', weight: 0.5, category: 'policy' },
  { term: 'public comment', lean: 'neutral', weight: 0.5, category: 'policy' },
  { term: 'community meeting', lean: 'neutral', weight: 0.5, category: 'policy' },
  { term: 'local government', lean: 'neutral', weight: 0.5, category: 'policy' },
  { term: 'city council', lean: 'neutral', weight: 0.5, category: 'policy' },
  { term: 'school board', lean: 'neutral', weight: 0.5, category: 'policy' },

  // Issues (neutral framing)
  { term: 'healthcare', lean: 'neutral', weight: 0.5, category: 'policy' },
  { term: 'education', lean: 'neutral', weight: 0.5, category: 'policy' },
  { term: 'infrastructure', lean: 'neutral', weight: 0.5, category: 'policy' },
  { term: 'economy', lean: 'neutral', weight: 0.5, category: 'policy' },
  { term: 'jobs', lean: 'neutral', weight: 0.5, category: 'policy' },
  { term: 'unemployment', lean: 'neutral', weight: 0.5, category: 'policy' },
  { term: 'inflation', lean: 'neutral', weight: 0.5, category: 'policy' },
  { term: 'budget', lean: 'neutral', weight: 0.5, category: 'policy' },
  { term: 'deficit', lean: 'neutral', weight: 0.5, category: 'policy' },
  { term: 'national debt', lean: 'neutral', weight: 0.5, category: 'policy' },
  { term: 'foreign policy', lean: 'neutral', weight: 0.5, category: 'policy' },
  { term: 'national security', lean: 'neutral', weight: 0.5, category: 'policy' },
  { term: 'defense', lean: 'neutral', weight: 0.5, category: 'policy' },
  { term: 'trade', lean: 'neutral', weight: 0.5, category: 'policy' },
  { term: 'tariff', lean: 'neutral', weight: 0.5, category: 'policy' },
  { term: 'immigration', lean: 'neutral', weight: 0.5, category: 'policy' },
  { term: 'border', lean: 'neutral', weight: 0.5, category: 'policy' },
  { term: 'climate', lean: 'neutral', weight: 0.5, category: 'policy' },
  { term: 'environment', lean: 'neutral', weight: 0.5, category: 'policy' },
  { term: 'energy', lean: 'neutral', weight: 0.5, category: 'policy' },

  // Centrist outlets
  { term: 'reuters', lean: 'neutral', weight: 0.5, category: 'outlet' },
  { term: 'associated press', lean: 'neutral', weight: 0.5, category: 'outlet' },
  { term: 'ap news', lean: 'neutral', weight: 0.5, category: 'outlet' },
  { term: 'bbc', lean: 'neutral', weight: 0.5, category: 'outlet' },
  { term: 'pbs', lean: 'neutral', weight: 0.5, category: 'outlet' },
  { term: 'npr', lean: 'neutral', weight: 0.5, category: 'outlet' },
  { term: 'c-span', lean: 'neutral', weight: 0.5, category: 'outlet' },
  { term: 'wall street journal', lean: 'neutral', weight: 0.5, category: 'outlet' },

  // General phrases
  { term: 'democracy', lean: 'neutral', weight: 0.5, category: 'phrase' },
  { term: 'constitution', lean: 'neutral', weight: 0.5, category: 'phrase' },
  { term: 'constitutional', lean: 'neutral', weight: 0.5, category: 'phrase' },
  { term: 'bipartisan', lean: 'neutral', weight: 0.5, category: 'phrase' },
  { term: 'compromise', lean: 'neutral', weight: 0.5, category: 'phrase' },
  { term: 'moderate', lean: 'neutral', weight: 0.5, category: 'phrase' },
  { term: 'centrist', lean: 'neutral', weight: 0.5, category: 'phrase' }
];

/**
 * Build lookup map for fast term matching
 * @returns Map of lowercase terms to political entries
 */
export function buildPoliticsLookup(): Map<string, PoliticalTerm> {
  const lookup = new Map<string, PoliticalTerm>();

  for (const term of POLITICAL_TERMS) {
    lookup.set(term.term.toLowerCase(), term);
  }

  return lookup;
}

/**
 * Detect political terms in text
 * @param text - Text to analyze
 * @returns Array of matched political terms
 */
export function detectPoliticalTerms(text: string): PoliticalTerm[] {
  const lowerText = text.toLowerCase();
  const matches: PoliticalTerm[] = [];
  const lookup = buildPoliticsLookup();

  // Check each term
  for (const [term, entry] of lookup) {
    if (lowerText.includes(term)) {
      matches.push(entry);
    }
  }

  return matches;
}

/**
 * Calculate political lean score from matched terms
 * @param matches - Array of matched political terms
 * @returns Score from -100 (left) to +100 (right), 0 = neutral
 */
export function calculatePoliticalLean(matches: PoliticalTerm[]): number {
  if (matches.length === 0) return 0;

  let leftScore = 0;
  let rightScore = 0;

  for (const match of matches) {
    if (match.lean === 'left') {
      leftScore += match.weight;
    } else if (match.lean === 'right') {
      rightScore += match.weight;
    }
    // Neutral terms don't affect the score
  }

  const totalScore = leftScore + rightScore;
  if (totalScore === 0) return 0;

  // Scale to -100 to +100
  const netScore = rightScore - leftScore;
  const normalizedScore = (netScore / totalScore) * 100;

  return Math.round(normalizedScore);
}

/**
 * Get political lean label from score
 * @param score - Score from -100 to +100
 * @returns Human-readable label
 */
export function getPoliticalLabel(score: number): string {
  if (score < -40) return 'Left-leaning';
  if (score > 40) return 'Right-leaning';
  return 'Centrist/Neutral';
}
