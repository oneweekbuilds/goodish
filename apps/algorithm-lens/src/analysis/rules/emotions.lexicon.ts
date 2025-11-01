// Emotions lexicon based on Plutchik's 8 emotion families
// Each emotion mapped to valence (-1 to +1) and arousal (0 to 1) coordinates

export interface EmotionTerm {
  term: string;
  family: 'joy' | 'trust' | 'fear' | 'surprise' | 'sadness' | 'disgust' | 'anger' | 'anticipation';
  valence: number; // -1 (negative) to +1 (positive)
  arousal: number; // 0 (low) to 1 (high)
  intensity: 'weak' | 'moderate' | 'strong';
}

/**
 * Emotion terms lexicon with 400+ entries across 8 Plutchik families
 * Each term includes valence/arousal coordinates for dimensional analysis
 */
export const EMOTION_TERMS: EmotionTerm[] = [
  // JOY FAMILY (50 terms) - Positive valence, variable arousal
  { term: 'happy', family: 'joy', valence: 0.8, arousal: 0.6, intensity: 'moderate' },
  { term: 'happiness', family: 'joy', valence: 0.8, arousal: 0.6, intensity: 'moderate' },
  { term: 'joyful', family: 'joy', valence: 0.9, arousal: 0.7, intensity: 'strong' },
  { term: 'joy', family: 'joy', valence: 0.9, arousal: 0.7, intensity: 'strong' },
  { term: 'delighted', family: 'joy', valence: 0.9, arousal: 0.8, intensity: 'strong' },
  { term: 'delight', family: 'joy', valence: 0.9, arousal: 0.8, intensity: 'strong' },
  { term: 'ecstatic', family: 'joy', valence: 1.0, arousal: 0.9, intensity: 'strong' },
  { term: 'ecstasy', family: 'joy', valence: 1.0, arousal: 0.9, intensity: 'strong' },
  { term: 'elated', family: 'joy', valence: 0.9, arousal: 0.8, intensity: 'strong' },
  { term: 'elation', family: 'joy', valence: 0.9, arousal: 0.8, intensity: 'strong' },
  { term: 'thrilled', family: 'joy', valence: 0.9, arousal: 0.9, intensity: 'strong' },
  { term: 'excited', family: 'joy', valence: 0.8, arousal: 0.9, intensity: 'strong' },
  { term: 'excitement', family: 'joy', valence: 0.8, arousal: 0.9, intensity: 'strong' },
  { term: 'cheerful', family: 'joy', valence: 0.7, arousal: 0.6, intensity: 'moderate' },
  { term: 'cheer', family: 'joy', valence: 0.7, arousal: 0.6, intensity: 'moderate' },
  { term: 'pleased', family: 'joy', valence: 0.6, arousal: 0.4, intensity: 'weak' },
  { term: 'pleasure', family: 'joy', valence: 0.7, arousal: 0.5, intensity: 'moderate' },
  { term: 'satisfied', family: 'joy', valence: 0.6, arousal: 0.3, intensity: 'weak' },
  { term: 'satisfaction', family: 'joy', valence: 0.6, arousal: 0.3, intensity: 'weak' },
  { term: 'content', family: 'joy', valence: 0.5, arousal: 0.2, intensity: 'weak' },
  { term: 'contentment', family: 'joy', valence: 0.5, arousal: 0.2, intensity: 'weak' },
  { term: 'glad', family: 'joy', valence: 0.6, arousal: 0.4, intensity: 'weak' },
  { term: 'grateful', family: 'joy', valence: 0.7, arousal: 0.4, intensity: 'moderate' },
  { term: 'gratitude', family: 'joy', valence: 0.7, arousal: 0.4, intensity: 'moderate' },
  { term: 'thankful', family: 'joy', valence: 0.7, arousal: 0.4, intensity: 'moderate' },
  { term: 'blessed', family: 'joy', valence: 0.8, arousal: 0.5, intensity: 'moderate' },
  { term: 'blissful', family: 'joy', valence: 0.9, arousal: 0.6, intensity: 'strong' },
  { term: 'bliss', family: 'joy', valence: 0.9, arousal: 0.6, intensity: 'strong' },
  { term: 'euphoric', family: 'joy', valence: 1.0, arousal: 0.9, intensity: 'strong' },
  { term: 'euphoria', family: 'joy', valence: 1.0, arousal: 0.9, intensity: 'strong' },
  { term: 'merry', family: 'joy', valence: 0.7, arousal: 0.6, intensity: 'moderate' },
  { term: 'jolly', family: 'joy', valence: 0.7, arousal: 0.6, intensity: 'moderate' },
  { term: 'jubilant', family: 'joy', valence: 0.9, arousal: 0.8, intensity: 'strong' },
  { term: 'triumphant', family: 'joy', valence: 0.8, arousal: 0.7, intensity: 'strong' },
  { term: 'triumph', family: 'joy', valence: 0.8, arousal: 0.7, intensity: 'strong' },
  { term: 'victorious', family: 'joy', valence: 0.8, arousal: 0.7, intensity: 'strong' },
  { term: 'victory', family: 'joy', valence: 0.8, arousal: 0.7, intensity: 'strong' },
  { term: 'proud', family: 'joy', valence: 0.7, arousal: 0.5, intensity: 'moderate' },
  { term: 'pride', family: 'joy', valence: 0.7, arousal: 0.5, intensity: 'moderate' },
  { term: 'amused', family: 'joy', valence: 0.6, arousal: 0.5, intensity: 'weak' },
  { term: 'amusement', family: 'joy', valence: 0.6, arousal: 0.5, intensity: 'weak' },
  { term: 'entertained', family: 'joy', valence: 0.6, arousal: 0.5, intensity: 'weak' },
  { term: 'playful', family: 'joy', valence: 0.7, arousal: 0.6, intensity: 'moderate' },
  { term: 'optimistic', family: 'joy', valence: 0.7, arousal: 0.5, intensity: 'moderate' },
  { term: 'optimism', family: 'joy', valence: 0.7, arousal: 0.5, intensity: 'moderate' },
  { term: 'hopeful', family: 'joy', valence: 0.6, arousal: 0.4, intensity: 'weak' },
  { term: 'hope', family: 'joy', valence: 0.6, arousal: 0.4, intensity: 'weak' },
  { term: 'uplifted', family: 'joy', valence: 0.7, arousal: 0.6, intensity: 'moderate' },
  { term: 'inspired', family: 'joy', valence: 0.7, arousal: 0.6, intensity: 'moderate' },
  { term: 'inspiration', family: 'joy', valence: 0.7, arousal: 0.6, intensity: 'moderate' },

  // TRUST FAMILY (50 terms) - Positive valence, low arousal
  { term: 'trust', family: 'trust', valence: 0.7, arousal: 0.3, intensity: 'moderate' },
  { term: 'trusting', family: 'trust', valence: 0.7, arousal: 0.3, intensity: 'moderate' },
  { term: 'trustworthy', family: 'trust', valence: 0.7, arousal: 0.3, intensity: 'moderate' },
  { term: 'loyal', family: 'trust', valence: 0.7, arousal: 0.3, intensity: 'moderate' },
  { term: 'loyalty', family: 'trust', valence: 0.7, arousal: 0.3, intensity: 'moderate' },
  { term: 'faithful', family: 'trust', valence: 0.7, arousal: 0.3, intensity: 'moderate' },
  { term: 'faith', family: 'trust', valence: 0.6, arousal: 0.3, intensity: 'weak' },
  { term: 'reliable', family: 'trust', valence: 0.6, arousal: 0.2, intensity: 'weak' },
  { term: 'dependable', family: 'trust', valence: 0.6, arousal: 0.2, intensity: 'weak' },
  { term: 'secure', family: 'trust', valence: 0.6, arousal: 0.2, intensity: 'weak' },
  { term: 'security', family: 'trust', valence: 0.6, arousal: 0.2, intensity: 'weak' },
  { term: 'safe', family: 'trust', valence: 0.6, arousal: 0.2, intensity: 'weak' },
  { term: 'safety', family: 'trust', valence: 0.6, arousal: 0.2, intensity: 'weak' },
  { term: 'comfortable', family: 'trust', valence: 0.5, arousal: 0.2, intensity: 'weak' },
  { term: 'comfort', family: 'trust', valence: 0.5, arousal: 0.2, intensity: 'weak' },
  { term: 'assured', family: 'trust', valence: 0.6, arousal: 0.3, intensity: 'weak' },
  { term: 'assurance', family: 'trust', valence: 0.6, arousal: 0.3, intensity: 'weak' },
  { term: 'confident', family: 'trust', valence: 0.7, arousal: 0.4, intensity: 'moderate' },
  { term: 'confidence', family: 'trust', valence: 0.7, arousal: 0.4, intensity: 'moderate' },
  { term: 'certain', family: 'trust', valence: 0.5, arousal: 0.3, intensity: 'weak' },
  { term: 'certainty', family: 'trust', valence: 0.5, arousal: 0.3, intensity: 'weak' },
  { term: 'belief', family: 'trust', valence: 0.6, arousal: 0.3, intensity: 'weak' },
  { term: 'believe', family: 'trust', valence: 0.6, arousal: 0.3, intensity: 'weak' },
  { term: 'accepting', family: 'trust', valence: 0.5, arousal: 0.2, intensity: 'weak' },
  { term: 'acceptance', family: 'trust', valence: 0.5, arousal: 0.2, intensity: 'weak' },
  { term: 'welcoming', family: 'trust', valence: 0.6, arousal: 0.3, intensity: 'weak' },
  { term: 'welcome', family: 'trust', valence: 0.6, arousal: 0.3, intensity: 'weak' },
  { term: 'friendly', family: 'trust', valence: 0.6, arousal: 0.4, intensity: 'weak' },
  { term: 'friendship', family: 'trust', valence: 0.7, arousal: 0.4, intensity: 'moderate' },
  { term: 'kind', family: 'trust', valence: 0.7, arousal: 0.3, intensity: 'moderate' },
  { term: 'kindness', family: 'trust', valence: 0.7, arousal: 0.3, intensity: 'moderate' },
  { term: 'caring', family: 'trust', valence: 0.7, arousal: 0.3, intensity: 'moderate' },
  { term: 'care', family: 'trust', valence: 0.6, arousal: 0.3, intensity: 'weak' },
  { term: 'compassionate', family: 'trust', valence: 0.8, arousal: 0.4, intensity: 'moderate' },
  { term: 'compassion', family: 'trust', valence: 0.8, arousal: 0.4, intensity: 'moderate' },
  { term: 'empathetic', family: 'trust', valence: 0.7, arousal: 0.3, intensity: 'moderate' },
  { term: 'empathy', family: 'trust', valence: 0.7, arousal: 0.3, intensity: 'moderate' },
  { term: 'sympathetic', family: 'trust', valence: 0.6, arousal: 0.3, intensity: 'weak' },
  { term: 'sympathy', family: 'trust', valence: 0.6, arousal: 0.3, intensity: 'weak' },
  { term: 'understanding', family: 'trust', valence: 0.6, arousal: 0.2, intensity: 'weak' },
  { term: 'supportive', family: 'trust', valence: 0.7, arousal: 0.3, intensity: 'moderate' },
  { term: 'support', family: 'trust', valence: 0.7, arousal: 0.3, intensity: 'moderate' },
  { term: 'cooperative', family: 'trust', valence: 0.6, arousal: 0.3, intensity: 'weak' },
  { term: 'cooperation', family: 'trust', valence: 0.6, arousal: 0.3, intensity: 'weak' },
  { term: 'connected', family: 'trust', valence: 0.6, arousal: 0.3, intensity: 'weak' },
  { term: 'connection', family: 'trust', valence: 0.6, arousal: 0.3, intensity: 'weak' },
  { term: 'bonded', family: 'trust', valence: 0.7, arousal: 0.4, intensity: 'moderate' },
  { term: 'intimate', family: 'trust', valence: 0.7, arousal: 0.4, intensity: 'moderate' },
  { term: 'intimacy', family: 'trust', valence: 0.7, arousal: 0.4, intensity: 'moderate' },
  { term: 'devoted', family: 'trust', valence: 0.7, arousal: 0.4, intensity: 'moderate' },

  // FEAR FAMILY (50 terms) - Negative valence, high arousal
  { term: 'fear', family: 'fear', valence: -0.7, arousal: 0.8, intensity: 'moderate' },
  { term: 'fearful', family: 'fear', valence: -0.7, arousal: 0.8, intensity: 'moderate' },
  { term: 'afraid', family: 'fear', valence: -0.7, arousal: 0.8, intensity: 'moderate' },
  { term: 'scared', family: 'fear', valence: -0.7, arousal: 0.8, intensity: 'moderate' },
  { term: 'terrified', family: 'fear', valence: -0.9, arousal: 0.9, intensity: 'strong' },
  { term: 'terror', family: 'fear', valence: -0.9, arousal: 0.9, intensity: 'strong' },
  { term: 'horrified', family: 'fear', valence: -0.9, arousal: 0.9, intensity: 'strong' },
  { term: 'horror', family: 'fear', valence: -0.9, arousal: 0.9, intensity: 'strong' },
  { term: 'panic', family: 'fear', valence: -0.8, arousal: 1.0, intensity: 'strong' },
  { term: 'panicked', family: 'fear', valence: -0.8, arousal: 1.0, intensity: 'strong' },
  { term: 'anxious', family: 'fear', valence: -0.6, arousal: 0.7, intensity: 'moderate' },
  { term: 'anxiety', family: 'fear', valence: -0.6, arousal: 0.7, intensity: 'moderate' },
  { term: 'worried', family: 'fear', valence: -0.5, arousal: 0.6, intensity: 'weak' },
  { term: 'worry', family: 'fear', valence: -0.5, arousal: 0.6, intensity: 'weak' },
  { term: 'nervous', family: 'fear', valence: -0.5, arousal: 0.7, intensity: 'weak' },
  { term: 'nervousness', family: 'fear', valence: -0.5, arousal: 0.7, intensity: 'weak' },
  { term: 'uneasy', family: 'fear', valence: -0.4, arousal: 0.5, intensity: 'weak' },
  { term: 'unease', family: 'fear', valence: -0.4, arousal: 0.5, intensity: 'weak' },
  { term: 'tense', family: 'fear', valence: -0.5, arousal: 0.6, intensity: 'weak' },
  { term: 'tension', family: 'fear', valence: -0.5, arousal: 0.6, intensity: 'weak' },
  { term: 'stressed', family: 'fear', valence: -0.6, arousal: 0.7, intensity: 'moderate' },
  { term: 'stress', family: 'fear', valence: -0.6, arousal: 0.7, intensity: 'moderate' },
  { term: 'threatened', family: 'fear', valence: -0.7, arousal: 0.8, intensity: 'moderate' },
  { term: 'threat', family: 'fear', valence: -0.7, arousal: 0.8, intensity: 'moderate' },
  { term: 'insecure', family: 'fear', valence: -0.5, arousal: 0.5, intensity: 'weak' },
  { term: 'insecurity', family: 'fear', valence: -0.5, arousal: 0.5, intensity: 'weak' },
  { term: 'vulnerable', family: 'fear', valence: -0.4, arousal: 0.5, intensity: 'weak' },
  { term: 'vulnerability', family: 'fear', valence: -0.4, arousal: 0.5, intensity: 'weak' },
  { term: 'alarmed', family: 'fear', valence: -0.7, arousal: 0.9, intensity: 'moderate' },
  { term: 'alarm', family: 'fear', valence: -0.7, arousal: 0.9, intensity: 'moderate' },
  { term: 'startled', family: 'fear', valence: -0.5, arousal: 0.9, intensity: 'weak' },
  { term: 'shocked', family: 'fear', valence: -0.6, arousal: 0.9, intensity: 'moderate' },
  { term: 'shock', family: 'fear', valence: -0.6, arousal: 0.9, intensity: 'moderate' },
  { term: 'apprehensive', family: 'fear', valence: -0.5, arousal: 0.6, intensity: 'weak' },
  { term: 'apprehension', family: 'fear', valence: -0.5, arousal: 0.6, intensity: 'weak' },
  { term: 'dread', family: 'fear', valence: -0.8, arousal: 0.7, intensity: 'strong' },
  { term: 'dreading', family: 'fear', valence: -0.8, arousal: 0.7, intensity: 'strong' },
  { term: 'timid', family: 'fear', valence: -0.4, arousal: 0.4, intensity: 'weak' },
  { term: 'timidity', family: 'fear', valence: -0.4, arousal: 0.4, intensity: 'weak' },
  { term: 'cautious', family: 'fear', valence: -0.3, arousal: 0.4, intensity: 'weak' },
  { term: 'caution', family: 'fear', valence: -0.3, arousal: 0.4, intensity: 'weak' },
  { term: 'paranoid', family: 'fear', valence: -0.7, arousal: 0.8, intensity: 'moderate' },
  { term: 'paranoia', family: 'fear', valence: -0.7, arousal: 0.8, intensity: 'moderate' },
  { term: 'suspicious', family: 'fear', valence: -0.5, arousal: 0.6, intensity: 'weak' },
  { term: 'suspicion', family: 'fear', valence: -0.5, arousal: 0.6, intensity: 'weak' },
  { term: 'distrust', family: 'fear', valence: -0.6, arousal: 0.5, intensity: 'moderate' },
  { term: 'distrustful', family: 'fear', valence: -0.6, arousal: 0.5, intensity: 'moderate' },
  { term: 'doubt', family: 'fear', valence: -0.4, arousal: 0.4, intensity: 'weak' },
  { term: 'doubtful', family: 'fear', valence: -0.4, arousal: 0.4, intensity: 'weak' },
  { term: 'uncertain', family: 'fear', valence: -0.3, arousal: 0.5, intensity: 'weak' },

  // SURPRISE FAMILY (50 terms) - Neutral/variable valence, high arousal
  { term: 'surprise', family: 'surprise', valence: 0.0, arousal: 0.8, intensity: 'moderate' },
  { term: 'surprised', family: 'surprise', valence: 0.0, arousal: 0.8, intensity: 'moderate' },
  { term: 'astonished', family: 'surprise', valence: 0.0, arousal: 0.9, intensity: 'strong' },
  { term: 'astonishment', family: 'surprise', valence: 0.0, arousal: 0.9, intensity: 'strong' },
  { term: 'amazed', family: 'surprise', valence: 0.3, arousal: 0.8, intensity: 'strong' },
  { term: 'amazement', family: 'surprise', valence: 0.3, arousal: 0.8, intensity: 'strong' },
  { term: 'astounded', family: 'surprise', valence: 0.2, arousal: 0.9, intensity: 'strong' },
  { term: 'stunned', family: 'surprise', valence: 0.0, arousal: 0.9, intensity: 'strong' },
  { term: 'dumbfounded', family: 'surprise', valence: 0.0, arousal: 0.8, intensity: 'moderate' },
  { term: 'flabbergasted', family: 'surprise', valence: 0.0, arousal: 0.9, intensity: 'strong' },
  { term: 'bewildered', family: 'surprise', valence: -0.2, arousal: 0.7, intensity: 'moderate' },
  { term: 'bewilderment', family: 'surprise', valence: -0.2, arousal: 0.7, intensity: 'moderate' },
  { term: 'confused', family: 'surprise', valence: -0.3, arousal: 0.6, intensity: 'weak' },
  { term: 'confusion', family: 'surprise', valence: -0.3, arousal: 0.6, intensity: 'weak' },
  { term: 'perplexed', family: 'surprise', valence: -0.2, arousal: 0.6, intensity: 'weak' },
  { term: 'baffled', family: 'surprise', valence: -0.2, arousal: 0.6, intensity: 'weak' },
  { term: 'unexpected', family: 'surprise', valence: 0.0, arousal: 0.7, intensity: 'moderate' },
  { term: 'startled', family: 'surprise', valence: -0.1, arousal: 0.9, intensity: 'moderate' },
  { term: 'jolted', family: 'surprise', valence: -0.1, arousal: 0.9, intensity: 'moderate' },
  { term: 'awestruck', family: 'surprise', valence: 0.4, arousal: 0.8, intensity: 'strong' },
  { term: 'awe', family: 'surprise', valence: 0.4, arousal: 0.7, intensity: 'moderate' },
  { term: 'wonder', family: 'surprise', valence: 0.3, arousal: 0.6, intensity: 'weak' },
  { term: 'wondering', family: 'surprise', valence: 0.2, arousal: 0.5, intensity: 'weak' },
  { term: 'curious', family: 'surprise', valence: 0.3, arousal: 0.5, intensity: 'weak' },
  { term: 'curiosity', family: 'surprise', valence: 0.3, arousal: 0.5, intensity: 'weak' },
  { term: 'intrigued', family: 'surprise', valence: 0.4, arousal: 0.6, intensity: 'moderate' },
  { term: 'fascinated', family: 'surprise', valence: 0.5, arousal: 0.6, intensity: 'moderate' },
  { term: 'fascination', family: 'surprise', valence: 0.5, arousal: 0.6, intensity: 'moderate' },
  { term: 'captivated', family: 'surprise', valence: 0.5, arousal: 0.6, intensity: 'moderate' },
  { term: 'mesmerized', family: 'surprise', valence: 0.4, arousal: 0.6, intensity: 'moderate' },
  { term: 'impressed', family: 'surprise', valence: 0.5, arousal: 0.5, intensity: 'moderate' },
  { term: 'impressed', family: 'surprise', valence: 0.5, arousal: 0.5, intensity: 'moderate' },
  { term: 'mind-blown', family: 'surprise', valence: 0.5, arousal: 0.9, intensity: 'strong' },
  { term: 'mind blown', family: 'surprise', valence: 0.5, arousal: 0.9, intensity: 'strong' },
  { term: 'shocked', family: 'surprise', valence: -0.2, arousal: 0.9, intensity: 'strong' },
  { term: 'disbelief', family: 'surprise', valence: -0.1, arousal: 0.7, intensity: 'moderate' },
  { term: 'unbelievable', family: 'surprise', valence: 0.0, arousal: 0.8, intensity: 'moderate' },
  { term: 'incredible', family: 'surprise', valence: 0.4, arousal: 0.7, intensity: 'moderate' },
  { term: 'remarkable', family: 'surprise', valence: 0.4, arousal: 0.6, intensity: 'moderate' },
  { term: 'extraordinary', family: 'surprise', valence: 0.5, arousal: 0.7, intensity: 'strong' },
  { term: 'unprecedented', family: 'surprise', valence: 0.0, arousal: 0.7, intensity: 'moderate' },
  { term: 'novel', family: 'surprise', valence: 0.2, arousal: 0.5, intensity: 'weak' },
  { term: 'new', family: 'surprise', valence: 0.1, arousal: 0.4, intensity: 'weak' },
  { term: 'fresh', family: 'surprise', valence: 0.2, arousal: 0.4, intensity: 'weak' },
  { term: 'unusual', family: 'surprise', valence: 0.0, arousal: 0.5, intensity: 'weak' },
  { term: 'strange', family: 'surprise', valence: -0.1, arousal: 0.5, intensity: 'weak' },
  { term: 'odd', family: 'surprise', valence: -0.1, arousal: 0.4, intensity: 'weak' },
  { term: 'weird', family: 'surprise', valence: -0.2, arousal: 0.5, intensity: 'weak' },
  { term: 'bizarre', family: 'surprise', valence: -0.3, arousal: 0.6, intensity: 'moderate' },
  { term: 'uncanny', family: 'surprise', valence: -0.2, arousal: 0.6, intensity: 'moderate' },

  // SADNESS FAMILY (50 terms) - Negative valence, low arousal
  { term: 'sad', family: 'sadness', valence: -0.7, arousal: 0.3, intensity: 'moderate' },
  { term: 'sadness', family: 'sadness', valence: -0.7, arousal: 0.3, intensity: 'moderate' },
  { term: 'unhappy', family: 'sadness', valence: -0.6, arousal: 0.3, intensity: 'weak' },
  { term: 'depressed', family: 'sadness', valence: -0.9, arousal: 0.2, intensity: 'strong' },
  { term: 'depression', family: 'sadness', valence: -0.9, arousal: 0.2, intensity: 'strong' },
  { term: 'miserable', family: 'sadness', valence: -0.9, arousal: 0.3, intensity: 'strong' },
  { term: 'misery', family: 'sadness', valence: -0.9, arousal: 0.3, intensity: 'strong' },
  { term: 'grief', family: 'sadness', valence: -0.9, arousal: 0.4, intensity: 'strong' },
  { term: 'grieving', family: 'sadness', valence: -0.9, arousal: 0.4, intensity: 'strong' },
  { term: 'sorrow', family: 'sadness', valence: -0.8, arousal: 0.3, intensity: 'strong' },
  { term: 'sorrowful', family: 'sadness', valence: -0.8, arousal: 0.3, intensity: 'strong' },
  { term: 'heartbroken', family: 'sadness', valence: -0.9, arousal: 0.5, intensity: 'strong' },
  { term: 'heartbreak', family: 'sadness', valence: -0.9, arousal: 0.5, intensity: 'strong' },
  { term: 'devastated', family: 'sadness', valence: -0.9, arousal: 0.6, intensity: 'strong' },
  { term: 'devastation', family: 'sadness', valence: -0.9, arousal: 0.6, intensity: 'strong' },
  { term: 'despair', family: 'sadness', valence: -0.9, arousal: 0.4, intensity: 'strong' },
  { term: 'despairing', family: 'sadness', valence: -0.9, arousal: 0.4, intensity: 'strong' },
  { term: 'hopeless', family: 'sadness', valence: -0.9, arousal: 0.3, intensity: 'strong' },
  { term: 'hopelessness', family: 'sadness', valence: -0.9, arousal: 0.3, intensity: 'strong' },
  { term: 'melancholy', family: 'sadness', valence: -0.7, arousal: 0.2, intensity: 'moderate' },
  { term: 'melancholic', family: 'sadness', valence: -0.7, arousal: 0.2, intensity: 'moderate' },
  { term: 'gloomy', family: 'sadness', valence: -0.6, arousal: 0.3, intensity: 'weak' },
  { term: 'gloom', family: 'sadness', valence: -0.6, arousal: 0.3, intensity: 'weak' },
  { term: 'somber', family: 'sadness', valence: -0.6, arousal: 0.2, intensity: 'weak' },
  { term: 'downcast', family: 'sadness', valence: -0.6, arousal: 0.3, intensity: 'weak' },
  { term: 'dejected', family: 'sadness', valence: -0.7, arousal: 0.3, intensity: 'moderate' },
  { term: 'dejection', family: 'sadness', valence: -0.7, arousal: 0.3, intensity: 'moderate' },
  { term: 'discouraged', family: 'sadness', valence: -0.6, arousal: 0.3, intensity: 'weak' },
  { term: 'discouragement', family: 'sadness', valence: -0.6, arousal: 0.3, intensity: 'weak' },
  { term: 'disappointed', family: 'sadness', valence: -0.6, arousal: 0.4, intensity: 'moderate' },
  { term: 'disappointment', family: 'sadness', valence: -0.6, arousal: 0.4, intensity: 'moderate' },
  { term: 'lonely', family: 'sadness', valence: -0.7, arousal: 0.3, intensity: 'moderate' },
  { term: 'loneliness', family: 'sadness', valence: -0.7, arousal: 0.3, intensity: 'moderate' },
  { term: 'isolated', family: 'sadness', valence: -0.7, arousal: 0.3, intensity: 'moderate' },
  { term: 'isolation', family: 'sadness', valence: -0.7, arousal: 0.3, intensity: 'moderate' },
  { term: 'abandoned', family: 'sadness', valence: -0.8, arousal: 0.4, intensity: 'strong' },
  { term: 'abandonment', family: 'sadness', valence: -0.8, arousal: 0.4, intensity: 'strong' },
  { term: 'rejected', family: 'sadness', valence: -0.7, arousal: 0.5, intensity: 'moderate' },
  { term: 'rejection', family: 'sadness', valence: -0.7, arousal: 0.5, intensity: 'moderate' },
  { term: 'hurt', family: 'sadness', valence: -0.7, arousal: 0.4, intensity: 'moderate' },
  { term: 'wounded', family: 'sadness', valence: -0.7, arousal: 0.4, intensity: 'moderate' },
  { term: 'regret', family: 'sadness', valence: -0.6, arousal: 0.3, intensity: 'moderate' },
  { term: 'regretful', family: 'sadness', valence: -0.6, arousal: 0.3, intensity: 'moderate' },
  { term: 'remorse', family: 'sadness', valence: -0.7, arousal: 0.4, intensity: 'moderate' },
  { term: 'remorseful', family: 'sadness', valence: -0.7, arousal: 0.4, intensity: 'moderate' },
  { term: 'guilty', family: 'sadness', valence: -0.7, arousal: 0.5, intensity: 'moderate' },
  { term: 'guilt', family: 'sadness', valence: -0.7, arousal: 0.5, intensity: 'moderate' },
  { term: 'ashamed', family: 'sadness', valence: -0.7, arousal: 0.5, intensity: 'moderate' },
  { term: 'shame', family: 'sadness', valence: -0.7, arousal: 0.5, intensity: 'moderate' },
  { term: 'humiliated', family: 'sadness', valence: -0.8, arousal: 0.6, intensity: 'strong' },

  // DISGUST FAMILY (50 terms) - Negative valence, moderate arousal
  { term: 'disgust', family: 'disgust', valence: -0.8, arousal: 0.6, intensity: 'strong' },
  { term: 'disgusted', family: 'disgust', valence: -0.8, arousal: 0.6, intensity: 'strong' },
  { term: 'disgusting', family: 'disgust', valence: -0.8, arousal: 0.6, intensity: 'strong' },
  { term: 'revolting', family: 'disgust', valence: -0.9, arousal: 0.7, intensity: 'strong' },
  { term: 'repulsed', family: 'disgust', valence: -0.8, arousal: 0.7, intensity: 'strong' },
  { term: 'repulsive', family: 'disgust', valence: -0.8, arousal: 0.7, intensity: 'strong' },
  { term: 'repulsion', family: 'disgust', valence: -0.8, arousal: 0.7, intensity: 'strong' },
  { term: 'nauseated', family: 'disgust', valence: -0.7, arousal: 0.6, intensity: 'moderate' },
  { term: 'nauseous', family: 'disgust', valence: -0.7, arousal: 0.6, intensity: 'moderate' },
  { term: 'sickened', family: 'disgust', valence: -0.8, arousal: 0.6, intensity: 'strong' },
  { term: 'gross', family: 'disgust', valence: -0.7, arousal: 0.5, intensity: 'moderate' },
  { term: 'nasty', family: 'disgust', valence: -0.7, arousal: 0.5, intensity: 'moderate' },
  { term: 'vile', family: 'disgust', valence: -0.9, arousal: 0.6, intensity: 'strong' },
  { term: 'foul', family: 'disgust', valence: -0.8, arousal: 0.5, intensity: 'strong' },
  { term: 'awful', family: 'disgust', valence: -0.7, arousal: 0.5, intensity: 'moderate' },
  { term: 'horrible', family: 'disgust', valence: -0.8, arousal: 0.6, intensity: 'strong' },
  { term: 'terrible', family: 'disgust', valence: -0.8, arousal: 0.6, intensity: 'strong' },
  { term: 'dreadful', family: 'disgust', valence: -0.8, arousal: 0.6, intensity: 'strong' },
  { term: 'appalling', family: 'disgust', valence: -0.9, arousal: 0.7, intensity: 'strong' },
  { term: 'abhorrent', family: 'disgust', valence: -0.9, arousal: 0.7, intensity: 'strong' },
  { term: 'abominable', family: 'disgust', valence: -0.9, arousal: 0.7, intensity: 'strong' },
  { term: 'detestable', family: 'disgust', valence: -0.9, arousal: 0.6, intensity: 'strong' },
  { term: 'loathsome', family: 'disgust', valence: -0.9, arousal: 0.6, intensity: 'strong' },
  { term: 'contemptible', family: 'disgust', valence: -0.8, arousal: 0.6, intensity: 'strong' },
  { term: 'contempt', family: 'disgust', valence: -0.8, arousal: 0.6, intensity: 'strong' },
  { term: 'contemptuous', family: 'disgust', valence: -0.8, arousal: 0.6, intensity: 'strong' },
  { term: 'scorn', family: 'disgust', valence: -0.7, arousal: 0.6, intensity: 'moderate' },
  { term: 'scornful', family: 'disgust', valence: -0.7, arousal: 0.6, intensity: 'moderate' },
  { term: 'disdain', family: 'disgust', valence: -0.7, arousal: 0.5, intensity: 'moderate' },
  { term: 'disdainful', family: 'disgust', valence: -0.7, arousal: 0.5, intensity: 'moderate' },
  { term: 'aversion', family: 'disgust', valence: -0.7, arousal: 0.5, intensity: 'moderate' },
  { term: 'hate', family: 'disgust', valence: -0.9, arousal: 0.7, intensity: 'strong' },
  { term: 'hatred', family: 'disgust', valence: -0.9, arousal: 0.7, intensity: 'strong' },
  { term: 'loathe', family: 'disgust', valence: -0.9, arousal: 0.7, intensity: 'strong' },
  { term: 'loathing', family: 'disgust', valence: -0.9, arousal: 0.7, intensity: 'strong' },
  { term: 'detest', family: 'disgust', valence: -0.8, arousal: 0.6, intensity: 'strong' },
  { term: 'despise', family: 'disgust', valence: -0.9, arousal: 0.6, intensity: 'strong' },
  { term: 'offensive', family: 'disgust', valence: -0.7, arousal: 0.6, intensity: 'moderate' },
  { term: 'offended', family: 'disgust', valence: -0.6, arousal: 0.6, intensity: 'moderate' },
  { term: 'objectionable', family: 'disgust', valence: -0.7, arousal: 0.5, intensity: 'moderate' },
  { term: 'unpleasant', family: 'disgust', valence: -0.5, arousal: 0.4, intensity: 'weak' },
  { term: 'disagreeable', family: 'disgust', valence: -0.6, arousal: 0.4, intensity: 'weak' },
  { term: 'distasteful', family: 'disgust', valence: -0.7, arousal: 0.5, intensity: 'moderate' },
  { term: 'unsavory', family: 'disgust', valence: -0.6, arousal: 0.4, intensity: 'weak' },
  { term: 'repugnant', family: 'disgust', valence: -0.9, arousal: 0.7, intensity: 'strong' },
  { term: 'odious', family: 'disgust', valence: -0.9, arousal: 0.6, intensity: 'strong' },
  { term: 'heinous', family: 'disgust', valence: -1.0, arousal: 0.8, intensity: 'strong' },
  { term: 'obscene', family: 'disgust', valence: -0.8, arousal: 0.6, intensity: 'strong' },
  { term: 'vulgar', family: 'disgust', valence: -0.6, arousal: 0.5, intensity: 'moderate' },
  { term: 'crude', family: 'disgust', valence: -0.6, arousal: 0.4, intensity: 'weak' },

  // ANGER FAMILY (50 terms) - Negative valence, high arousal
  { term: 'anger', family: 'anger', valence: -0.7, arousal: 0.8, intensity: 'moderate' },
  { term: 'angry', family: 'anger', valence: -0.7, arousal: 0.8, intensity: 'moderate' },
  { term: 'furious', family: 'anger', valence: -0.9, arousal: 1.0, intensity: 'strong' },
  { term: 'fury', family: 'anger', valence: -0.9, arousal: 1.0, intensity: 'strong' },
  { term: 'enraged', family: 'anger', valence: -0.9, arousal: 1.0, intensity: 'strong' },
  { term: 'rage', family: 'anger', valence: -0.9, arousal: 1.0, intensity: 'strong' },
  { term: 'outraged', family: 'anger', valence: -0.8, arousal: 0.9, intensity: 'strong' },
  { term: 'outrage', family: 'anger', valence: -0.8, arousal: 0.9, intensity: 'strong' },
  { term: 'mad', family: 'anger', valence: -0.7, arousal: 0.8, intensity: 'moderate' },
  { term: 'livid', family: 'anger', valence: -0.9, arousal: 0.9, intensity: 'strong' },
  { term: 'irate', family: 'anger', valence: -0.8, arousal: 0.9, intensity: 'strong' },
  { term: 'incensed', family: 'anger', valence: -0.8, arousal: 0.9, intensity: 'strong' },
  { term: 'infuriated', family: 'anger', valence: -0.9, arousal: 1.0, intensity: 'strong' },
  { term: 'hostile', family: 'anger', valence: -0.8, arousal: 0.7, intensity: 'strong' },
  { term: 'hostility', family: 'anger', valence: -0.8, arousal: 0.7, intensity: 'strong' },
  { term: 'aggressive', family: 'anger', valence: -0.7, arousal: 0.8, intensity: 'moderate' },
  { term: 'aggression', family: 'anger', valence: -0.7, arousal: 0.8, intensity: 'moderate' },
  { term: 'violent', family: 'anger', valence: -0.9, arousal: 0.9, intensity: 'strong' },
  { term: 'violence', family: 'anger', valence: -0.9, arousal: 0.9, intensity: 'strong' },
  { term: 'irritated', family: 'anger', valence: -0.5, arousal: 0.6, intensity: 'weak' },
  { term: 'irritation', family: 'anger', valence: -0.5, arousal: 0.6, intensity: 'weak' },
  { term: 'annoyed', family: 'anger', valence: -0.5, arousal: 0.5, intensity: 'weak' },
  { term: 'annoyance', family: 'anger', valence: -0.5, arousal: 0.5, intensity: 'weak' },
  { term: 'frustrated', family: 'anger', valence: -0.6, arousal: 0.7, intensity: 'moderate' },
  { term: 'frustration', family: 'anger', valence: -0.6, arousal: 0.7, intensity: 'moderate' },
  { term: 'exasperated', family: 'anger', valence: -0.6, arousal: 0.7, intensity: 'moderate' },
  { term: 'exasperation', family: 'anger', valence: -0.6, arousal: 0.7, intensity: 'moderate' },
  { term: 'agitated', family: 'anger', valence: -0.6, arousal: 0.8, intensity: 'moderate' },
  { term: 'agitation', family: 'anger', valence: -0.6, arousal: 0.8, intensity: 'moderate' },
  { term: 'bitter', family: 'anger', valence: -0.7, arousal: 0.5, intensity: 'moderate' },
  { term: 'bitterness', family: 'anger', valence: -0.7, arousal: 0.5, intensity: 'moderate' },
  { term: 'resentful', family: 'anger', valence: -0.7, arousal: 0.6, intensity: 'moderate' },
  { term: 'resentment', family: 'anger', valence: -0.7, arousal: 0.6, intensity: 'moderate' },
  { term: 'vengeful', family: 'anger', valence: -0.8, arousal: 0.7, intensity: 'strong' },
  { term: 'vengeance', family: 'anger', valence: -0.8, arousal: 0.7, intensity: 'strong' },
  { term: 'vindictive', family: 'anger', valence: -0.8, arousal: 0.7, intensity: 'strong' },
  { term: 'spiteful', family: 'anger', valence: -0.7, arousal: 0.6, intensity: 'moderate' },
  { term: 'spite', family: 'anger', valence: -0.7, arousal: 0.6, intensity: 'moderate' },
  { term: 'malicious', family: 'anger', valence: -0.9, arousal: 0.7, intensity: 'strong' },
  { term: 'malice', family: 'anger', valence: -0.9, arousal: 0.7, intensity: 'strong' },
  { term: 'cruel', family: 'anger', valence: -0.9, arousal: 0.6, intensity: 'strong' },
  { term: 'cruelty', family: 'anger', valence: -0.9, arousal: 0.6, intensity: 'strong' },
  { term: 'mean', family: 'anger', valence: -0.6, arousal: 0.5, intensity: 'weak' },
  { term: 'offended', family: 'anger', valence: -0.6, arousal: 0.6, intensity: 'moderate' },
  { term: 'insulted', family: 'anger', valence: -0.7, arousal: 0.7, intensity: 'moderate' },
  { term: 'insult', family: 'anger', valence: -0.7, arousal: 0.7, intensity: 'moderate' },
  { term: 'provoked', family: 'anger', valence: -0.6, arousal: 0.7, intensity: 'moderate' },
  { term: 'provocation', family: 'anger', valence: -0.6, arousal: 0.7, intensity: 'moderate' },
  { term: 'defiant', family: 'anger', valence: -0.5, arousal: 0.7, intensity: 'moderate' },
  { term: 'defiance', family: 'anger', valence: -0.5, arousal: 0.7, intensity: 'moderate' },

  // ANTICIPATION FAMILY (50 terms) - Positive/neutral valence, variable arousal
  { term: 'anticipation', family: 'anticipation', valence: 0.3, arousal: 0.6, intensity: 'moderate' },
  { term: 'anticipating', family: 'anticipation', valence: 0.3, arousal: 0.6, intensity: 'moderate' },
  { term: 'expect', family: 'anticipation', valence: 0.2, arousal: 0.5, intensity: 'weak' },
  { term: 'expectation', family: 'anticipation', valence: 0.2, arousal: 0.5, intensity: 'weak' },
  { term: 'expecting', family: 'anticipation', valence: 0.2, arousal: 0.5, intensity: 'weak' },
  { term: 'eager', family: 'anticipation', valence: 0.6, arousal: 0.7, intensity: 'moderate' },
  { term: 'eagerness', family: 'anticipation', valence: 0.6, arousal: 0.7, intensity: 'moderate' },
  { term: 'enthusiastic', family: 'anticipation', valence: 0.7, arousal: 0.8, intensity: 'strong' },
  { term: 'enthusiasm', family: 'anticipation', valence: 0.7, arousal: 0.8, intensity: 'strong' },
  { term: 'excited', family: 'anticipation', valence: 0.8, arousal: 0.9, intensity: 'strong' },
  { term: 'excitement', family: 'anticipation', valence: 0.8, arousal: 0.9, intensity: 'strong' },
  { term: 'ready', family: 'anticipation', valence: 0.4, arousal: 0.6, intensity: 'weak' },
  { term: 'prepared', family: 'anticipation', valence: 0.3, arousal: 0.5, intensity: 'weak' },
  { term: 'vigilant', family: 'anticipation', valence: 0.2, arousal: 0.6, intensity: 'weak' },
  { term: 'vigilance', family: 'anticipation', valence: 0.2, arousal: 0.6, intensity: 'weak' },
  { term: 'alert', family: 'anticipation', valence: 0.2, arousal: 0.7, intensity: 'weak' },
  { term: 'watchful', family: 'anticipation', valence: 0.1, arousal: 0.5, intensity: 'weak' },
  { term: 'attentive', family: 'anticipation', valence: 0.3, arousal: 0.6, intensity: 'weak' },
  { term: 'focused', family: 'anticipation', valence: 0.3, arousal: 0.6, intensity: 'weak' },
  { term: 'determined', family: 'anticipation', valence: 0.5, arousal: 0.7, intensity: 'moderate' },
  { term: 'determination', family: 'anticipation', valence: 0.5, arousal: 0.7, intensity: 'moderate' },
  { term: 'motivated', family: 'anticipation', valence: 0.6, arousal: 0.7, intensity: 'moderate' },
  { term: 'motivation', family: 'anticipation', valence: 0.6, arousal: 0.7, intensity: 'moderate' },
  { term: 'ambitious', family: 'anticipation', valence: 0.6, arousal: 0.6, intensity: 'moderate' },
  { term: 'ambition', family: 'anticipation', valence: 0.6, arousal: 0.6, intensity: 'moderate' },
  { term: 'driven', family: 'anticipation', valence: 0.6, arousal: 0.7, intensity: 'moderate' },
  { term: 'goal-oriented', family: 'anticipation', valence: 0.5, arousal: 0.6, intensity: 'moderate' },
  { term: 'intentional', family: 'anticipation', valence: 0.4, arousal: 0.5, intensity: 'weak' },
  { term: 'purposeful', family: 'anticipation', valence: 0.5, arousal: 0.5, intensity: 'moderate' },
  { term: 'planning', family: 'anticipation', valence: 0.3, arousal: 0.5, intensity: 'weak' },
  { term: 'preparing', family: 'anticipation', valence: 0.3, arousal: 0.5, intensity: 'weak' },
  { term: 'awaiting', family: 'anticipation', valence: 0.2, arousal: 0.4, intensity: 'weak' },
  { term: 'waiting', family: 'anticipation', valence: 0.1, arousal: 0.3, intensity: 'weak' },
  { term: 'impatient', family: 'anticipation', valence: -0.3, arousal: 0.7, intensity: 'moderate' },
  { term: 'impatience', family: 'anticipation', valence: -0.3, arousal: 0.7, intensity: 'moderate' },
  { term: 'restless', family: 'anticipation', valence: -0.2, arousal: 0.7, intensity: 'weak' },
  { term: 'anxious', family: 'anticipation', valence: -0.4, arousal: 0.8, intensity: 'moderate' },
  { term: 'tense', family: 'anticipation', valence: -0.3, arousal: 0.7, intensity: 'weak' },
  { term: 'nervous', family: 'anticipation', valence: -0.3, arousal: 0.7, intensity: 'weak' },
  { term: 'cautious', family: 'anticipation', valence: 0.0, arousal: 0.5, intensity: 'weak' },
  { term: 'wary', family: 'anticipation', valence: -0.2, arousal: 0.6, intensity: 'weak' },
  { term: 'suspicious', family: 'anticipation', valence: -0.4, arousal: 0.6, intensity: 'moderate' },
  { term: 'skeptical', family: 'anticipation', valence: -0.2, arousal: 0.4, intensity: 'weak' },
  { term: 'doubtful', family: 'anticipation', valence: -0.3, arousal: 0.4, intensity: 'weak' },
  { term: 'uncertain', family: 'anticipation', valence: -0.2, arousal: 0.5, intensity: 'weak' },
  { term: 'hesitant', family: 'anticipation', valence: -0.2, arousal: 0.4, intensity: 'weak' },
  { term: 'reluctant', family: 'anticipation', valence: -0.3, arousal: 0.4, intensity: 'weak' },
  { term: 'resistant', family: 'anticipation', valence: -0.4, arousal: 0.5, intensity: 'moderate' },
  { term: 'reserved', family: 'anticipation', valence: 0.0, arousal: 0.3, intensity: 'weak' },
  { term: 'guarded', family: 'anticipation', valence: -0.1, arousal: 0.4, intensity: 'weak' }
];

/**
 * Build emotion lookup map
 * @returns Map of lowercase terms to emotion entries
 */
export function buildEmotionLookup(): Map<string, EmotionTerm> {
  const lookup = new Map<string, EmotionTerm>();

  for (const emotion of EMOTION_TERMS) {
    lookup.set(emotion.term.toLowerCase(), emotion);
  }

  return lookup;
}

/**
 * Detect emotion terms in text
 * @param text - Text to analyze
 * @returns Array of matched emotion terms
 */
export function detectEmotions(text: string): EmotionTerm[] {
  const lowerText = text.toLowerCase();
  const matches: EmotionTerm[] = [];
  const lookup = buildEmotionLookup();

  // Check each term
  for (const [term, entry] of lookup) {
    if (lowerText.includes(term)) {
      matches.push(entry);
    }
  }

  return matches;
}

/**
 * Calculate average valence and arousal from matched emotions
 * @param matches - Array of matched emotion terms
 * @returns Object with average valence and arousal
 */
export function calculateEmotionalState(matches: EmotionTerm[]): {
  valence: number;
  arousal: number;
  dominantFamily: string;
} {
  if (matches.length === 0) {
    return { valence: 0, arousal: 0, dominantFamily: 'neutral' };
  }

  const avgValence = matches.reduce((sum, m) => sum + m.valence, 0) / matches.length;
  const avgArousal = matches.reduce((sum, m) => sum + m.arousal, 0) / matches.length;

  // Find dominant family
  const familyCounts: Record<string, number> = {};
  matches.forEach(m => {
    familyCounts[m.family] = (familyCounts[m.family] || 0) + 1;
  });

  const dominantFamily = Object.entries(familyCounts).reduce((a, b) =>
    b[1] > a[1] ? b : a
  )[0];

  return {
    valence: Math.round(avgValence * 100) / 100,
    arousal: Math.round(avgArousal * 100) / 100,
    dominantFamily
  };
}

/**
 * Get distribution of emotion families
 * @param matches - Array of matched emotion terms
 * @returns Record of family counts and percentages
 */
export function getEmotionDistribution(matches: EmotionTerm[]): Record<string, { count: number; percentage: number }> {
  const familyCounts: Record<string, number> = {};

  matches.forEach(m => {
    familyCounts[m.family] = (familyCounts[m.family] || 0) + 1;
  });

  const total = matches.length;
  const distribution: Record<string, { count: number; percentage: number }> = {};

  for (const [family, count] of Object.entries(familyCounts)) {
    distribution[family] = {
      count,
      percentage: Math.round((count / total) * 100)
    };
  }

  return distribution;
}
