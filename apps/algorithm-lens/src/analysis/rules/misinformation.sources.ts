// Misinformation sources registry
// Illustrative list for detecting low-credibility content
// IMPORTANT: This is for educational purposes and content analysis only

export interface MisinfoSource {
  domain?: string;
  handle?: string;
  type: 'website' | 'account' | 'pattern';
  riskScore: number; // 0-100, higher = more unreliable
  category: 'conspiracy' | 'satire' | 'clickbait' | 'propaganda' | 'unverified' | 'hyperpartisan';
  disclaimer: string;
}

/**
 * DISCLAIMER: This list is illustrative and for educational purposes.
 * It demonstrates how misinformation detection could work in principle.
 * Real-world implementations should use verified, maintained databases
 * from fact-checking organizations (e.g., IFCN signatories).
 *
 * Users should always verify information from multiple trusted sources.
 */
export const MISINFO_SOURCES: MisinfoSource[] = [
  // Conspiracy Theory Sites (illustrative examples)
  {
    domain: 'infowars.com',
    type: 'website',
    riskScore: 95,
    category: 'conspiracy',
    disclaimer: 'Known for promoting conspiracy theories and misinformation. Cross-reference with fact-checking sites.'
  },
  {
    domain: 'naturalnews.com',
    type: 'website',
    riskScore: 90,
    category: 'conspiracy',
    disclaimer: 'Frequently publishes pseudoscientific health claims. Verify with medical sources.'
  },
  {
    domain: 'beforeitsnews.com',
    type: 'website',
    riskScore: 85,
    category: 'conspiracy',
    disclaimer: 'User-generated content site with no editorial oversight. High misinformation risk.'
  },

  // Satire Sites (legitimate satire, but can be misunderstood)
  {
    domain: 'theonion.com',
    type: 'website',
    riskScore: 10,
    category: 'satire',
    disclaimer: 'Satirical news site. Content is intentionally fictional for humor.'
  },
  {
    domain: 'babylonbee.com',
    type: 'website',
    riskScore: 10,
    category: 'satire',
    disclaimer: 'Satirical news site with conservative slant. Content is intentionally fictional.'
  },
  {
    domain: 'clickhole.com',
    type: 'website',
    riskScore: 10,
    category: 'satire',
    disclaimer: 'Satirical clickbait parody site. Content is intentionally absurd.'
  },

  // Clickbait & Sensationalism
  {
    domain: 'buzzfeed.com/news',
    type: 'website',
    riskScore: 30,
    category: 'clickbait',
    disclaimer: 'Mix of legitimate news and clickbait. Verify important claims independently.'
  },
  {
    domain: 'upworthy.com',
    type: 'website',
    riskScore: 40,
    category: 'clickbait',
    disclaimer: 'Sensationalized headlines. Original reporting is limited.'
  },

  // Hyperpartisan Sites (heavy bias, selective facts)
  {
    domain: 'occupydemocrats.com',
    type: 'website',
    riskScore: 70,
    category: 'hyperpartisan',
    disclaimer: 'Extreme left bias. Often misleading headlines and selective facts.'
  },
  {
    domain: 'theblaze.com',
    type: 'website',
    riskScore: 65,
    category: 'hyperpartisan',
    disclaimer: 'Strong right bias. Opinion mixed with news reporting.'
  },
  {
    domain: 'thegatewaypundit.com',
    type: 'website',
    riskScore: 85,
    category: 'hyperpartisan',
    disclaimer: 'Extreme right bias with history of publishing false information.'
  },
  {
    domain: 'bipartisanreport.com',
    type: 'website',
    riskScore: 75,
    category: 'hyperpartisan',
    disclaimer: 'Despite name, extreme left bias with misleading content.'
  },

  // Propaganda & State-Controlled Media
  {
    domain: 'rt.com',
    type: 'website',
    riskScore: 80,
    category: 'propaganda',
    disclaimer: 'Russian state-controlled media. Reported propaganda and disinformation.'
  },
  {
    domain: 'sputniknews.com',
    type: 'website',
    riskScore: 80,
    category: 'propaganda',
    disclaimer: 'Russian state-controlled media outlet. Known for spreading disinformation.'
  },
  {
    domain: 'presstv.ir',
    type: 'website',
    riskScore: 75,
    category: 'propaganda',
    disclaimer: 'Iranian state media. Reports government perspective, not independent.'
  },

  // Unverified/Low-Quality Health Information
  {
    domain: 'mercola.com',
    type: 'website',
    riskScore: 70,
    category: 'unverified',
    disclaimer: 'Alternative medicine site. Claims often not supported by scientific evidence.'
  },
  {
    domain: 'healthimpactnews.com',
    type: 'website',
    riskScore: 80,
    category: 'unverified',
    disclaimer: 'Anti-vaccine advocacy site. Medical claims lack scientific support.'
  },

  // Content Farm / Ad-Revenue Sites
  {
    domain: 'worldtruth.tv',
    type: 'website',
    riskScore: 85,
    category: 'unverified',
    disclaimer: 'Content aggregation site with no fact-checking. High misinformation rate.'
  },
  {
    domain: 'yournewswire.com',
    type: 'website',
    riskScore: 90,
    category: 'conspiracy',
    disclaimer: 'Known for publishing fake news and conspiracy theories.'
  },
  {
    domain: 'newspunch.com',
    type: 'website',
    riskScore: 90,
    category: 'conspiracy',
    disclaimer: 'Formerly YourNewsWire. Publishes conspiracy theories and false information.'
  },

  // Pattern-based detection (generic indicators)
  {
    type: 'pattern',
    riskScore: 50,
    category: 'unverified',
    disclaimer: 'Content contains unverified claims. Check multiple sources.'
  }
];

/**
 * Check if domain is in misinformation registry
 * @param url - URL or domain to check
 * @returns MisinfoSource entry or undefined
 */
export function checkMisinfoSource(url: string): MisinfoSource | undefined {
  const lowerUrl = url.toLowerCase();

  // Check exact domain matches
  for (const source of MISINFO_SOURCES) {
    if (source.domain && lowerUrl.includes(source.domain)) {
      return source;
    }
    if (source.handle && lowerUrl.includes(source.handle)) {
      return source;
    }
  }

  return undefined;
}

/**
 * Get risk assessment for content source
 * @param url - URL or domain to assess
 * @returns Risk score (0-100) and category
 */
export function assessSourceRisk(url: string): { riskScore: number; category: string; disclaimer: string } {
  const match = checkMisinfoSource(url);

  if (match) {
    return {
      riskScore: match.riskScore,
      category: match.category,
      disclaimer: match.disclaimer
    };
  }

  // Default for unknown sources
  return {
    riskScore: 20,
    category: 'unknown',
    disclaimer: 'Source not in registry. Verify information independently.'
  };
}

/**
 * Detect common misinformation patterns in text
 * @param text - Text to analyze
 * @returns Array of detected pattern indicators
 */
export function detectMisinfoPatterns(text: string): string[] {
  const patterns: string[] = [];
  const lowerText = text.toLowerCase();

  // Sensational language patterns
  const sensationalPhrases = [
    'they don\'t want you to know',
    'the truth they\'re hiding',
    'what they won\'t tell you',
    'mainstream media won\'t report',
    'msm blackout',
    'wake up sheeple',
    'do your own research',
    'connect the dots',
    'follow the money'
  ];

  for (const phrase of sensationalPhrases) {
    if (lowerText.includes(phrase)) {
      patterns.push('sensational_language');
      break;
    }
  }

  // All-caps excessive use (shouting)
  const wordsInAllCaps = text.match(/\b[A-Z]{4,}\b/g);
  if (wordsInAllCaps && wordsInAllCaps.length > 3) {
    patterns.push('excessive_caps');
  }

  // Excessive punctuation (!!!, ???)
  if (/[!?]{3,}/.test(text)) {
    patterns.push('excessive_punctuation');
  }

  // Conspiracy keywords clustering
  const conspiracyKeywords = ['hoax', 'false flag', 'crisis actor', 'cover-up', 'deep state', 'illuminati', 'new world order', 'plandemic', 'scamdemic'];
  let conspiracyCount = 0;
  for (const keyword of conspiracyKeywords) {
    if (lowerText.includes(keyword)) {
      conspiracyCount++;
    }
  }
  if (conspiracyCount >= 2) {
    patterns.push('conspiracy_keywords');
  }

  // Health misinformation patterns
  const healthMisinfoPatterns = [
    'doctors hate',
    'big pharma doesn\'t want',
    'natural cure they',
    'miracle cure',
    'one weird trick'
  ];
  for (const pattern of healthMisinfoPatterns) {
    if (lowerText.includes(pattern)) {
      patterns.push('health_misinfo_pattern');
      break;
    }
  }

  // Urgent/fear-based language
  const urgentPhrases = [
    'act now',
    'before it\'s too late',
    'time is running out',
    'they\'re coming for'
  ];
  for (const phrase of urgentPhrases) {
    if (lowerText.includes(phrase)) {
      patterns.push('urgency_manipulation');
      break;
    }
  }

  return patterns;
}

/**
 * Calculate overall misinformation risk for content
 * @param url - Source URL (optional)
 * @param text - Content text (optional)
 * @returns Risk assessment object
 */
export function calculateMisinfoRisk(url?: string, text?: string): {
  overallRisk: number;
  sourceRisk: number;
  patternRisk: number;
  patterns: string[];
  recommendation: string;
} {
  let sourceRisk = 0;
  let patternRisk = 0;
  let patterns: string[] = [];

  // Check source credibility
  if (url) {
    const sourceAssessment = assessSourceRisk(url);
    sourceRisk = sourceAssessment.riskScore;
  }

  // Check content patterns
  if (text) {
    patterns = detectMisinfoPatterns(text);
    patternRisk = Math.min(patterns.length * 15, 60); // Cap at 60
  }

  // Weighted overall risk (source more important than patterns)
  const overallRisk = Math.round(sourceRisk * 0.7 + patternRisk * 0.3);

  // Recommendation based on risk level
  let recommendation = '';
  if (overallRisk >= 80) {
    recommendation = 'High risk: Likely unreliable. Seek information from trusted sources.';
  } else if (overallRisk >= 60) {
    recommendation = 'Moderate-high risk: Verify all claims with multiple credible sources.';
  } else if (overallRisk >= 40) {
    recommendation = 'Moderate risk: Cross-reference important facts with mainstream sources.';
  } else if (overallRisk >= 20) {
    recommendation = 'Low-moderate risk: Generally reliable, but verify important claims.';
  } else {
    recommendation = 'Low risk: Source appears credible, but always verify important information.';
  }

  return {
    overallRisk,
    sourceRisk,
    patternRisk,
    patterns,
    recommendation
  };
}

/**
 * Get trusted fact-checking resources
 * @returns Array of trusted fact-checking organizations
 */
export function getTrustedFactCheckers(): Array<{ name: string; url: string; description: string }> {
  return [
    {
      name: 'Snopes',
      url: 'https://www.snopes.com',
      description: 'Independent fact-checking of rumors and misinformation'
    },
    {
      name: 'FactCheck.org',
      url: 'https://www.factcheck.org',
      description: 'Nonpartisan fact-checking from Annenberg Public Policy Center'
    },
    {
      name: 'PolitiFact',
      url: 'https://www.politifact.com',
      description: 'Pulitzer Prize-winning fact-checking of political claims'
    },
    {
      name: 'AP Fact Check',
      url: 'https://apnews.com/ap-fact-check',
      description: 'Associated Press fact-checking service'
    },
    {
      name: 'Reuters Fact Check',
      url: 'https://www.reuters.com/fact-check',
      description: 'Reuters verification and fact-checking'
    },
    {
      name: 'Media Bias/Fact Check',
      url: 'https://mediabiasfactcheck.com',
      description: 'Source credibility and bias ratings'
    },
    {
      name: 'NewsGuard',
      url: 'https://www.newsguardtech.com',
      description: 'Website credibility ratings and nutrition labels'
    }
  ];
}

/**
 * ETHICAL USE GUIDELINES:
 *
 * 1. This tool is for personal awareness and education, not censorship
 * 2. Always provide users with the ability to view flagged content
 * 3. Show disclaimers and recommendations, don't hide information
 * 4. Encourage critical thinking and independent verification
 * 5. Update registry regularly based on fact-checker assessments
 * 6. Be transparent about limitations and potential false positives
 * 7. Respect diverse viewpoints while flagging demonstrable falsehoods
 */
