/**
 * textClassificationService.ts — Lightweight text-based Gemini classification.
 *
 * PIPELINE FIX (C-04, H-02): The WebView DOM scraping path was not populating
 * raw_data.analysis (which requires ai_analyzed=true and feed_items with
 * political/tone data). It relied on a fire-and-forget backend API call that
 * never wrote results back to the scan record.
 *
 * This service runs a single Gemini text classification call on captured post
 * texts BEFORE saving to Supabase, so that raw_data.analysis is populated
 * immediately with political and tone data.
 *
 * Design:
 * - Takes an array of captured posts (title + creator)
 * - Sends a single Gemini Flash text request to classify all posts
 * - Returns the analysis structure that computeDashboardData.ts expects
 * - Graceful degradation: returns null if API key is missing or call fails
 * - Timeout protection to avoid blocking the scan save flow
 */

import { safeJsonParse } from '../utils';
import { captureError, captureMessage } from '../sentry';

// ============================================
// Types
// ============================================

export interface CapturedPostForAnalysis {
  post_text: string;
  creator_handle: string | null;
  creator_display_name: string | null;
  is_ad: boolean;
  content_type: string;
}

export interface AnalyzedFeedItemResult {
  political: {
    is_political: boolean;
    stance_or_alignment: string;
  };
  emotions: {
    valence: string;
  };
  creator: {
    handle: string;
    name: string;
  };
}

export interface TextAnalysisResult {
  ai_analyzed: true;
  feed_items: AnalyzedFeedItemResult[];
  political_content_summary: {
    political_items: number;
    political_percentage: number;
  };
}

// ============================================
// Classification Prompt
// ============================================

/**
 * Gemini prompt for text-based political and tone classification.
 * Designed to match the output format that computeDashboardData.ts expects
 * in raw_data.analysis.feed_items.
 *
 * EXACT PROMPT TEXT (for reference per verification checklist):
 *
 * "You are a content classifier for AlgorithmLens. Classify each post for
 *  political content and emotional tone. For each post, determine:
 *  1. is_political: Is this about politics, government, elections, legislation,
 *     political figures, partisan issues, or policy debates?
 *  2. stance_or_alignment: If political, what is the apparent lean?
 *     "LEFT", "CENTER", "RIGHT", or "UNKNOWN". If not political, "NOT_POLITICAL".
 *  3. valence: What is the emotional tone? "POSITIVE", "NEUTRAL", "NEGATIVE", or "MIXED"."
 */
function buildClassificationPrompt(posts: CapturedPostForAnalysis[]): string {
  const postsJson = posts.map((p, i) => ({
    index: i,
    text: (p.post_text || '').substring(0, 500),
    creator: p.creator_display_name || p.creator_handle || 'unknown',
    is_ad: p.is_ad,
    type: p.content_type,
  }));

  return `You are a content classifier for AlgorithmLens, a social media transparency tool.

Classify each post below for political content and emotional tone.

POLITICAL CLASSIFICATION RULES:
- Political content is any post that references a political figure, party, or candidate by name, advocates for/against legislation or policy, is about elections/voting/campaigns, or takes a clear stance on a partisan issue.
- News about Fox News, CNN, MSNBC, political commentary channels, government actions, immigration enforcement (e.g., ICE raids), military actions, foreign policy, protests, or political debates IS political.
- News reporting about natural disasters, crime, or entertainment is NOT political unless it explicitly frames events in terms of policy or partisan blame.
- If a post title mentions a political figure (Trump, Biden, etc.) or political organization, it IS political.

TONE CLASSIFICATION:
- POSITIVE: Joy, excitement, celebration, gratitude, humor, encouragement
- NEGATIVE: Anger, sadness, fear, outrage, criticism, distress, alarming language
- NEUTRAL: Informational, factual, tutorial, review without strong emotion
- MIXED: Clearly combines both positive AND negative emotions

Posts to classify:
${JSON.stringify(postsJson)}

Return a JSON array with one object per post, in the same order:
[
  {
    "index": 0,
    "is_political": true/false,
    "stance_or_alignment": "LEFT"|"CENTER"|"RIGHT"|"UNKNOWN"|"NOT_POLITICAL",
    "valence": "POSITIVE"|"NEUTRAL"|"NEGATIVE"|"MIXED"
  }
]

RESPOND ONLY WITH VALID JSON. No markdown, no code fences, no explanation.`;
}

// ============================================
// Service
// ============================================

const GEMINI_MODEL = 'gemini-2.0-flash';
const REQUEST_TIMEOUT_MS = 25000; // 25 seconds — must complete before scan save

/**
 * Classifies captured posts for political content and emotional tone using Gemini Flash.
 *
 * @param posts - Array of captured posts with text and creator info
 * @param apiKey - Gemini API key (from EXPO_PUBLIC_GEMINI_API_KEY)
 * @returns Analysis structure matching computeDashboardData expectations, or null on failure
 */
export async function classifyPostTexts(
  posts: CapturedPostForAnalysis[],
  apiKey: string,
): Promise<TextAnalysisResult | null> {
  if (!apiKey || posts.length === 0) {
    return null;
  }

  try {
    const prompt = buildClassificationPrompt(posts);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let responseText: string;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0,
            topP: 0.8,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errorBody.substring(0, 200)}`);
      }

      const data = await response.json();
      const candidates = data.candidates;
      if (!candidates || candidates.length === 0 || !candidates[0].content?.parts?.[0]?.text) {
        throw new Error('Empty Gemini response');
      }

      responseText = candidates[0].content.parts[0].text;
    } finally {
      clearTimeout(timeout);
    }

    // Parse the classification response
    const classifications = safeJsonParse<any[]>(responseText);

    if (!Array.isArray(classifications)) {
      throw new Error('Gemini response is not an array');
    }

    // Build the analysis structure that computeDashboardData expects
    const feedItems: AnalyzedFeedItemResult[] = posts.map((post, i) => {
      const classification = classifications.find((c: any) => c.index === i) || classifications[i];

      const isPolitical = classification?.is_political === true;
      const stance = typeof classification?.stance_or_alignment === 'string'
        ? classification.stance_or_alignment.toUpperCase()
        : (isPolitical ? 'UNKNOWN' : 'NOT_POLITICAL');
      const valence = typeof classification?.valence === 'string'
        ? classification.valence.toUpperCase()
        : 'NEUTRAL';

      // Validate valence value
      const validValences = ['POSITIVE', 'NEUTRAL', 'NEGATIVE', 'MIXED'];
      const safeValence = validValences.includes(valence) ? valence : 'NEUTRAL';

      return {
        political: {
          is_political: isPolitical,
          stance_or_alignment: stance,
        },
        emotions: {
          valence: safeValence,
        },
        creator: {
          handle: post.creator_handle || '',
          name: post.creator_display_name || post.creator_handle || '',
        },
      };
    });

    const politicalCount = feedItems.filter(item => item.political.is_political).length;

    return {
      ai_analyzed: true,
      feed_items: feedItems,
      political_content_summary: {
        political_items: politicalCount,
        political_percentage: posts.length > 0
          ? Math.round((politicalCount / posts.length) * 100)
          : 0,
      },
    };
  } catch (error) {
    // Non-fatal: if classification fails, the scan still saves without AI analysis.
    // The dashboard will show "Enable AI analysis" prompt instead of empty data.
    const message = error instanceof Error ? error.message : String(error);
    if (__DEV__) {
      console.warn('[textClassificationService] Classification failed (non-fatal):', message);
    }
    captureMessage('Text classification failed', 'warning', { error: message });
    captureError(
      error instanceof Error ? error : new Error(message),
      'textClassificationService:classifyPostTexts',
    );
    return null;
  }
}
