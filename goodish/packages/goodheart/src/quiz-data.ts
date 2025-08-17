import { QuizQuestion, QuizResult } from './types';

export const questions: QuizQuestion[] = [
  {
    id: 'motivation',
    question: 'What motivates you most about giving?',
    options: [
      {
        id: 'impact',
        text: 'Maximizing the number of lives saved or improved',
        scores: { effective: 3, compassionate: 1, innovative: 1 }
      },
      {
        id: 'connection',
        text: 'Helping people I can personally connect with',
        scores: { compassionate: 3, effective: 1, innovative: 1 }
      },
      {
        id: 'innovation',
        text: 'Supporting cutting-edge solutions to big problems',
        scores: { innovative: 3, effective: 2, compassionate: 1 }
      },
      {
        id: 'community',
        text: 'Strengthening my local community',
        scores: { compassionate: 2, effective: 1, innovative: 1 }
      }
    ]
  },
  {
    id: 'approach',
    question: 'How do you prefer to approach problems?',
    options: [
      {
        id: 'data',
        text: 'With rigorous research and data analysis',
        scores: { effective: 3, innovative: 2, compassionate: 1 }
      },
      {
        id: 'empathy',
        text: 'By listening to and understanding those affected',
        scores: { compassionate: 3, effective: 1, innovative: 1 }
      },
      {
        id: 'creativity',
        text: 'Through creative and unconventional solutions',
        scores: { innovative: 3, effective: 1, compassionate: 2 }
      },
      {
        id: 'practical',
        text: 'With proven, practical interventions',
        scores: { effective: 2, compassionate: 2, innovative: 1 }
      }
    ]
  },
  {
    id: 'cause',
    question: 'Which cause area resonates most with you?',
    options: [
      {
        id: 'global-health',
        text: 'Global health and poverty reduction',
        scores: { effective: 2, compassionate: 3, innovative: 1 }
      },
      {
        id: 'climate',
        text: 'Climate change and environmental protection',
        scores: { innovative: 3, effective: 2, compassionate: 1 }
      },
      {
        id: 'education',
        text: 'Education and human development',
        scores: { compassionate: 2, effective: 2, innovative: 2 }
      },
      {
        id: 'animal',
        text: 'Animal welfare and rights',
        scores: { compassionate: 3, effective: 1, innovative: 2 }
      }
    ]
  },
  {
    id: 'timeframe',
    question: 'What timeframe do you focus on for impact?',
    options: [
      {
        id: 'immediate',
        text: 'Immediate relief and urgent needs',
        scores: { compassionate: 3, effective: 2, innovative: 1 }
      },
      {
        id: 'medium',
        text: 'Building sustainable systems (5-10 years)',
        scores: { effective: 3, compassionate: 2, innovative: 2 }
      },
      {
        id: 'long',
        text: 'Long-term systemic change (decades)',
        scores: { innovative: 3, effective: 2, compassionate: 1 }
      },
      {
        id: 'future',
        text: 'Preventing future catastrophes',
        scores: { innovative: 3, effective: 3, compassionate: 1 }
      }
    ]
  },
  {
    id: 'evidence',
    question: 'How important is evidence of impact to you?',
    options: [
      {
        id: 'critical',
        text: 'Critical - I need clear evidence and metrics',
        scores: { effective: 3, innovative: 1, compassionate: 1 }
      },
      {
        id: 'important',
        text: 'Important - I want some evidence but trust matters too',
        scores: { effective: 2, compassionate: 2, innovative: 2 }
      },
      {
        id: 'helpful',
        text: 'Helpful - I value stories and personal connections',
        scores: { compassionate: 3, effective: 1, innovative: 2 }
      },
      {
        id: 'flexible',
        text: 'Flexible - I support promising new approaches',
        scores: { innovative: 3, effective: 1, compassionate: 2 }
      }
    ]
  }
];

export const results: Record<string, QuizResult> = {
  effective: {
    type: 'effective',
    title: 'The Effective Altruist',
    description: 'You prioritize maximum impact per dollar and evidence-based giving. You want to help as many people as possible with your donations.',
    charities: [
      {
        name: 'Against Malaria Foundation',
        description: 'Provides long-lasting insecticidal nets to prevent malaria',
        website: 'https://www.againstmalaria.com/',
        focus: 'Global Health'
      },
      {
        name: 'GiveWell Top Charities',
        description: 'Rigorously vetted organizations with proven impact',
        website: 'https://www.givewell.org/charities/top-charities',
        focus: 'Multiple Areas'
      },
      {
        name: 'Malaria Consortium',
        description: 'Seasonal malaria chemoprevention for children',
        website: 'https://www.malariaconsortium.org/',
        focus: 'Global Health'
      }
    ]
  },
  compassionate: {
    type: 'compassionate',
    title: 'The Compassionate Helper',
    description: 'You focus on immediate human needs and building personal connections. You want to help specific people and communities you can relate to.',
    charities: [
      {
        name: 'Doctors Without Borders',
        description: 'Emergency medical care in crisis situations worldwide',
        website: 'https://www.doctorswithoutborders.org/',
        focus: 'Emergency Relief'
      },
      {
        name: 'Direct Relief',
        description: 'Medical aid to vulnerable populations worldwide',
        website: 'https://www.directrelief.org/',
        focus: 'Medical Aid'
      },
      {
        name: 'World Central Kitchen',
        description: 'Provides meals in response to humanitarian crises',
        website: 'https://wck.org/',
        focus: 'Food Security'
      }
    ]
  },
  innovative: {
    type: 'innovative',
    title: 'The Innovation Catalyst',
    description: 'You support cutting-edge solutions and systemic change. You want to fund breakthrough approaches to complex global challenges.',
    charities: [
      {
        name: 'Cool Earth',
        description: 'Innovative climate action through rainforest protection',
        website: 'https://www.coolearth.org/',
        focus: 'Climate Change'
      },
      {
        name: 'Machine Intelligence Research Institute',
        description: 'AI safety research for beneficial artificial intelligence',
        website: 'https://intelligence.org/',
        focus: 'AI Safety'
      },
      {
        name: 'New Incentives',
        description: 'Cash incentives to increase immunization rates',
        website: 'https://www.newincentives.org/',
        focus: 'Innovation in Health'
      }
    ]
  }
};