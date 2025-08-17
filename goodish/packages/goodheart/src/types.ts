export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
}

export interface QuizOption {
  id: string;
  text: string;
  scores: Record<string, number>;
}

export interface QuizResult {
  type: string;
  title: string;
  description: string;
  charities: Charity[];
}

export interface Charity {
  name: string;
  description: string;
  website: string;
  focus: string;
}

export interface GivingProfile {
  type: string;
  scores: Record<string, number>;
}