export type SuperpowerType = 
  | 'the-lifesaver'
  | 'the-empowerer'
  | 'the-nurturer'
  | 'the-health-defender'
  | 'the-animal-ally'
  | 'the-earth-shielder'
  | 'the-deep-feeler'
  | 'the-future-builder'
  | 'the-food-reformer'

// Enhanced scoring mapping based on the quiz questions
const answerToSuperpowerMapping: Record<string, Partial<Record<SuperpowerType, number>>> = {
  // Question 1: What motivates you most to give?
  'reduce-suffering': {
    'the-lifesaver': 3,
    'the-health-defender': 2,
    'the-nurturer': 1,
  },
  'help-unfairly': {
    'the-empowerer': 3,
    'the-nurturer': 1,
  },
  'protect-planet': {
    'the-earth-shielder': 3,
    'the-future-builder': 2,
    'the-food-reformer': 1,
  },
  'personal-experience': {
    'the-nurturer': 2,
    'the-empowerer': 2,
    'the-health-defender': 1,
  },
  'give-opportunities': {
    'the-empowerer': 3,
    'the-nurturer': 2,
  },

  // Question 2: Which headline would most move you?
  'water-vaccines': {
    'the-lifesaver': 3,
    'the-health-defender': 2,
    'the-nurturer': 2,
  },
  'health-gaps': {
    'the-empowerer': 3,
    'the-health-defender': 2,
  },
  'extreme-heat': {
    'the-earth-shielder': 3,
    'the-future-builder': 1,
  },
  'animal-suffering': {
    'the-animal-ally': 3,
    'the-deep-feeler': 2,
    'the-food-reformer': 1,
  },
  'mental-health-crisis': {
    'the-nurturer': 3,
    'the-health-defender': 2,
  },

  // Question 3: What would you want $1,000 to do?
  'save-lives': {
    'the-lifesaver': 3,
    'the-health-defender': 2,
  },
  'empower-communities': {
    'the-empowerer': 3,
    'the-nurturer': 1,
  },
  'protect-wildlife': {
    'the-animal-ally': 3,
    'the-deep-feeler': 2,
    'the-earth-shielder': 1,
  },
  'slow-climate': {
    'the-earth-shielder': 3,
    'the-future-builder': 2,
    'the-food-reformer': 1,
  },
  'mental-health-support': {
    'the-nurturer': 3,
    'the-health-defender': 1,
  },

  // Question 4: What type of impact matters most?
  'long-term': {
    'the-future-builder': 3,
    'the-earth-shielder': 2,
    'the-food-reformer': 1,
  },
  'help-most': {
    'the-lifesaver': 3,
    'the-health-defender': 2,
    'the-empowerer': 1,
  },
  'quality-life': {
    'the-nurturer': 3,
    'the-empowerer': 2,
  },
  'systemic-injustice': {
    'the-empowerer': 3,
    'the-future-builder': 1,
  },
  'protect-voiceless': {
    'the-animal-ally': 3,
    'the-deep-feeler': 3,
    'the-nurturer': 1,
  },

  // Question 5: What feels most urgent?
  'climate-change': {
    'the-earth-shielder': 3,
    'the-future-builder': 2,
    'the-food-reformer': 1,
  },
  'global-poverty': {
    'the-lifesaver': 3,
    'the-empowerer': 2,
    'the-health-defender': 1,
  },
  'racial-injustice': {
    'the-empowerer': 3,
    'the-nurturer': 1,
  },
  'mental-health': {
    'the-nurturer': 3,
    'the-health-defender': 1,
  },
  'animal-cruelty': {
    'the-animal-ally': 3,
    'the-deep-feeler': 2,
    'the-food-reformer': 1,
  },
  'just-want-good': {
    'the-lifesaver': 1,
    'the-empowerer': 1,
    'the-nurturer': 1,
    'the-health-defender': 1,
    'the-animal-ally': 1,
    'the-earth-shielder': 1,
    'the-deep-feeler': 1,
    'the-future-builder': 1,
    'the-food-reformer': 1,
  },

  // Question 6: Which feels most personal?
  'health-struggles': {
    'the-health-defender': 3,
    'the-nurturer': 2,
    'the-lifesaver': 1,
  },
  'care-animals': {
    'the-animal-ally': 3,
    'the-deep-feeler': 2,
    'the-food-reformer': 1,
  },
  'experienced-injustice': {
    'the-empowerer': 3,
    'the-nurturer': 1,
  },
  'worry-planet': {
    'the-earth-shielder': 3,
    'the-future-builder': 2,
    'the-food-reformer': 1,
  },
  'no-personal-link': {
    'the-lifesaver': 2,
    'the-empowerer': 1,
    'the-health-defender': 1,
  },
}

export function calculateSuperpower(answers: { [questionId: number]: string }): SuperpowerType {
  const scores: Record<SuperpowerType, number> = {
    'the-lifesaver': 0,
    'the-empowerer': 0,
    'the-nurturer': 0,
    'the-health-defender': 0,
    'the-animal-ally': 0,
    'the-earth-shielder': 0,
    'the-deep-feeler': 0,
    'the-future-builder': 0,
    'the-food-reformer': 0,
  }

  // Score each answer
  Object.values(answers).forEach((answerValue) => {
    const mapping = answerToSuperpowerMapping[answerValue]
    if (mapping) {
      Object.entries(mapping).forEach(([superpower, points]) => {
        scores[superpower as SuperpowerType] += points || 0
      })
    }
  })

  // Find the top score and all superpowers with that score
  const topScore = Math.max(...Object.values(scores))
  const topSuperpowers = Object.entries(scores)
    .filter(([_, score]) => score === topScore)
    .map(([superpower]) => superpower as SuperpowerType)

  let selectedSuperpower: SuperpowerType

  if (topSuperpowers.length === 1) {
    // Clear winner, no tie
    selectedSuperpower = topSuperpowers[0]
  } else {
    // Tiebreaker logic — prioritize high-impact causes
    const tiebreakerPriority: SuperpowerType[] = [
      'the-lifesaver',
      'the-nurturer', 
      'the-health-defender',
      'the-future-builder'
    ]

    const preferred = tiebreakerPriority.find(sp => topSuperpowers.includes(sp))
    selectedSuperpower = preferred || topSuperpowers[0]
  }

  return selectedSuperpower
}

export function getSuperpowerSlug(superpower: SuperpowerType): string {
  return superpower
}

export function getSuperpowerFromSlug(slug: string): SuperpowerType | null {
  const validSuperpowers: SuperpowerType[] = [
    'the-lifesaver',
    'the-empowerer', 
    'the-nurturer',
    'the-health-defender',
    'the-animal-ally',
    'the-earth-shielder',
    'the-deep-feeler',
    'the-future-builder',
    'the-food-reformer',
  ]
  
  return validSuperpowers.includes(slug as SuperpowerType) ? slug as SuperpowerType : null
}