export interface CharityData {
  name: string
  description: string
  donationUrl: string
  website?: string
  category: string
}

export interface SuperpowerCharities {
  topCharity: CharityData
  otherOption: CharityData
  additionalCharities?: CharityData[]
}

export const charityData: Record<string, SuperpowerCharities> = {
  "the-lifesaver": {
    topCharity: {
      name: "Against Malaria Foundation",
      description: "Distributes mosquito nets to prevent malaria — saves lives for ~$5 per net.",
      donationUrl: "https://www.every.org/againstmalaria",
      website: "https://www.againstmalaria.com",
      category: "Global Health"
    },
    otherOption: {
      name: "Malaria Consortium (SMC)",
      description: "Provides seasonal malaria prevention to children in high-risk regions.",
      donationUrl: "https://www.every.org/malaria-consortium",
      website: "https://www.malariaconsortium.org",
      category: "Global Health"
    }
  },
  "the-empowerer": {
    topCharity: {
      name: "GiveDirectly",
      description: "Delivers no-strings-attached cash to people in extreme poverty — proven to work.",
      donationUrl: "https://www.every.org/givedirectly",
      website: "https://www.givedirectly.org",
      category: "Poverty Alleviation"
    },
    otherOption: {
      name: "Taimaka Project",
      description: "Locally-led team fights childhood malnutrition in northeast Nigeria with agility and trust.",
      donationUrl: "https://www.every.org/taimaka?viewport=desktop",
      website: "https://www.taimakaproject.org",
      category: "Nutrition"
    }
  },
  "the-nurturer": {
    topCharity: {
      name: "Helen Keller Intl – Vitamin A Program",
      description: "Prevents blindness and early death in young children for just a few dollars per dose.",
      donationUrl: "https://www.every.org/hki?viewport=desktop",
      website: "https://www.hki.org",
      category: "Child Health"
    },
    otherOption: {
      name: "Lead Exposure Elimination Project (LEEP)",
      description: "Reduces lead poisoning — one of the most overlooked threats to child development.",
      donationUrl: "https://www.every.org/lead-exposure-elimination-project",
      website: "https://www.leadelimination.org",
      category: "Child Health"
    }
  },
  "the-health-defender": {
    topCharity: {
      name: "New Incentives",
      description: "Boosts infant vaccination rates by paying caregivers — highly cost-effective.",
      donationUrl: "https://www.every.org/new-incentives",
      website: "https://www.newincentives.org",
      category: "Public Health"
    },
    otherOption: {
      name: "Evidence Action – Deworm the World",
      description: "Treats parasitic infections in kids at scale, improving health and school attendance.",
      donationUrl: "https://www.every.org/evidenceaction",
      website: "https://www.evidenceaction.org",
      category: "Public Health"
    }
  },
  "the-animal-ally": {
    topCharity: {
      name: "The Humane League",
      description: "Leads corporate campaigns to end cruel farming practices — huge reach per dollar.",
      donationUrl: "https://www.every.org/thehumaneleague?viewport=desktop",
      website: "https://thehumaneleague.org",
      category: "Animal Welfare"
    },
    otherOption: {
      name: "Animal Charity Evaluators – Recommended Fund",
      description: "Supports a mix of top animal welfare orgs selected through rigorous analysis.",
      donationUrl: "https://www.every.org/animal-charity-evaluators",
      website: "https://animalcharityevaluators.org",
      category: "Animal Welfare"
    }
  },
  "the-earth-shielder": {
    topCharity: {
      name: "Clean Air Task Force",
      description: "Pushes for global decarbonization through smart policy and energy innovation.",
      donationUrl: "https://www.every.org/clean-air-task-force",
      website: "https://www.catf.us",
      category: "Climate Change"
    },
    otherOption: {
      name: "Carbon180",
      description: "Advances carbon removal science and policy to scale long-term solutions.",
      donationUrl: "https://www.every.org/carbon180",
      website: "https://carbon180.org",
      category: "Climate Change"
    }
  },
  "the-deep-feeler": {
    topCharity: {
      name: "Shrimp Welfare Project",
      description: "Improves conditions for billions of farmed shrimp — highly neglected cause.",
      donationUrl: "https://www.every.org/shrimp-welfare-project",
      website: "https://www.shrimpwelfareproject.org",
      category: "Animal Welfare"
    },
    otherOption: {
      name: "Fish Welfare Initiative",
      description: "Works with farmers to improve the lives of farmed fish at massive scale.",
      donationUrl: "https://www.every.org/fish-welfare-initiative",
      website: "https://www.fishwelfareinitiative.org",
      category: "Animal Welfare"
    }
  },
  "the-future-builder": {
    topCharity: {
      name: "Center for AI Safety",
      description: "Conducts technical and policy work to reduce existential risk from advanced AI.",
      donationUrl: "https://www.every.org/center-for-ai-safety",
      website: "https://www.safe.ai",
      category: "Existential Risk"
    },
    otherOption: {
      name: "Nuclear Threat Initiative (NTI)",
      description: "Works globally to reduce the risk of nuclear weapons and other catastrophic threats.",
      donationUrl: "https://www.every.org/nti?viewport=desktop",
      website: "https://www.nti.org",
      category: "Existential Risk"
    }
  },
  "the-food-reformer": {
    topCharity: {
      name: "Good Food Institute",
      description: "Supports alt-protein innovation to reduce factory farming and climate harm.",
      donationUrl: "https://www.every.org/good-food-institute",
      website: "https://www.gfi.org",
      category: "Food System Reform"
    },
    otherOption: {
      name: "Faunalytics",
      description: "Provides critical research to power smarter food system change.",
      donationUrl: "https://www.every.org/faunalytics",
      website: "https://faunalytics.org",
      category: "Food System Reform"
    }
  }
}

export function generateDonationUrl(
  baseUrl: string,
  superpower: string,
  charityName: string,
  source: 'top' | 'other' = 'top'
): string {
  const utmParams = new URLSearchParams({
    utm_source: 'goodheart',
    utm_medium: 'quiz_result',
    utm_campaign: 'giving_superpower',
    utm_content: `${superpower}_${source}`,
    utm_term: charityName.toLowerCase().replace(/\s+/g, '_')
  })

  const separator = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${separator}${utmParams.toString()}`
}

export function getCharitiesForSuperpower(superpower: string): SuperpowerCharities | null {
  return charityData[superpower] || null
}