// Mock data fixtures for testing
// Provides realistic sample data for all platforms

import type { RawItem, Platform } from '../../types/content';

/**
 * Generate mock Twitter items
 */
export function generateMockTwitterData(count: number = 20): RawItem[] {
  const items: RawItem[] = [];
  const now = Date.now();

  const templates = [
    { text: 'Just finished an amazing workout at the gym! 💪 #fitness #health', hasImage: true },
    { text: 'New AI model just dropped and it\'s incredible. The future is here. #AI #tech', hasImage: false },
    { text: 'Breaking: Major policy announcement expected today. Stay tuned. #news #politics', hasImage: false },
    { text: 'This new product is a game changer! Use code SAVE20 for 20% off. #ad #sponsored', hasImage: true },
    { text: 'Can\'t believe what\'s happening in the world right now. We need change! #activism', hasImage: false },
    { text: 'Just tried this new restaurant and WOW 😍 Best food ever! #foodie', hasImage: true },
    { text: 'Reading this fascinating book about psychology. Highly recommend! #books', hasImage: false },
    { text: 'Climate change is real and we need to act NOW. #climateaction #environment', hasImage: false },
    { text: 'New iPhone just announced. Time to upgrade? 🤔 #Apple #tech', hasImage: true },
    { text: 'Monday motivation: You got this! Keep pushing forward. #motivation', hasImage: false }
  ];

  for (let i = 0; i < count; i++) {
    const template = templates[i % templates.length];
    const timestamp = now - (i * 3600000); // 1 hour apart

    items.push({
      id: `tweet_${i}`,
      text: template.text,
      created_at: new Date(timestamp).toISOString(),
      user: {
        id: `user_${i % 5}`,
        screen_name: `user${i % 5}`,
        name: `Test User ${i % 5}`,
        followers_count: Math.floor(Math.random() * 100000),
        verified: i % 7 === 0
      },
      favorite_count: Math.floor(Math.random() * 1000),
      retweet_count: Math.floor(Math.random() * 200),
      reply_count: Math.floor(Math.random() * 50),
      entities: {
        hashtags: template.text.match(/#\w+/g)?.map(tag => ({ text: tag.replace('#', '') })) || [],
        urls: template.hasImage ? [{ expanded_url: 'https://example.com/image.jpg' }] : []
      }
    });
  }

  return items;
}

/**
 * Generate mock Instagram data
 */
export function generateMockInstagramData(count: number = 15): RawItem[] {
  const items: RawItem[] = [];
  const now = Date.now();

  const captions = [
    'Living my best life ✨ #lifestyle #blessed',
    'New skincare routine! Link in bio 💄 #beauty #skincare #ad',
    'Sunset vibes 🌅 #travel #photography',
    'Fitness journey progress! So proud 💪 #fitness #transformation',
    'Trying this new cafe ☕ #foodie #coffee',
    'OOTD: Feeling cute today 👗 #fashion #style',
    'Home makeover reveal! #homedecor #interior',
    'Beach day with friends 🏖️ #summer #fun',
    'New art piece finished! #art #artist',
    'Product review: This changed my life! Use code SAVE15 #sponsored'
  ];

  for (let i = 0; i < count; i++) {
    const timestamp = now - (i * 7200000); // 2 hours apart

    items.push({
      id: `ig_${i}`,
      caption: {
        text: captions[i % captions.length]
      },
      taken_at: Math.floor(timestamp / 1000),
      user: {
        pk: `iguser_${i % 4}`,
        username: `iguser${i % 4}`,
        full_name: `Instagram User ${i % 4}`,
        follower_count: Math.floor(Math.random() * 50000),
        is_verified: i % 8 === 0
      },
      like_count: Math.floor(Math.random() * 5000),
      comment_count: Math.floor(Math.random() * 300),
      media_type: i % 3 === 0 ? 2 : 1, // video or image
      is_paid_partnership: captions[i % captions.length].includes('#ad')
    });
  }

  return items;
}

/**
 * Generate politically diverse mock data for testing bias detection
 */
export function generatePoliticallyDiverseData(): RawItem[] {
  const items: RawItem[] = [];
  const now = Date.now();

  // Left-leaning content
  const leftContent = [
    'Medicare for all is the only moral choice. Healthcare is a human right! #progressive #healthcare',
    'We need stronger gun control laws NOW. Enough is enough. #guncontrol #safety',
    'Climate action can\'t wait. Green New Deal is essential for our future. #climatechange #GND',
    'Tax the billionaires! Wealth inequality is out of control. #taxtherich #equality',
    'Voting rights must be protected. Everyone deserves access to democracy. #votingrights'
  ];

  // Right-leaning content
  const rightContent = [
    'Second Amendment rights are non-negotiable. Shall not be infringed! #2A #gunrights',
    'Small government, low taxes. Let the free market work! #conservative #freedom',
    'Border security is national security. Build the wall! #immigration #security',
    'Traditional values matter. Protect religious liberty! #faith #family',
    'Lower taxes create jobs. Proven economic policy. #economy #capitalism'
  ];

  // Neutral content
  const neutralContent = [
    'Important election coming up. Make sure you\'re registered to vote! #election #vote',
    'New infrastructure bill passes Congress with bipartisan support. #infrastructure #politics',
    'Town hall meeting tonight at 7pm. Come voice your concerns! #community #localgovernment'
  ];

  // Add left content
  leftContent.forEach((text, i) => {
    items.push({
      id: `left_${i}`,
      text,
      created_at: new Date(now - i * 3600000).toISOString(),
      user: {
        id: `leftuser_${i}`,
        screen_name: `progressive${i}`,
        followers_count: 10000 + i * 1000,
        verified: false
      },
      favorite_count: 500 + i * 100,
      retweet_count: 50 + i * 10
    });
  });

  // Add right content
  rightContent.forEach((text, i) => {
    items.push({
      id: `right_${i}`,
      text,
      created_at: new Date(now - (i + 10) * 3600000).toISOString(),
      user: {
        id: `rightuser_${i}`,
        screen_name: `conservative${i}`,
        followers_count: 15000 + i * 1000,
        verified: false
      },
      favorite_count: 600 + i * 100,
      retweet_count: 60 + i * 10
    });
  });

  // Add neutral content
  neutralContent.forEach((text, i) => {
    items.push({
      id: `neutral_${i}`,
      text,
      created_at: new Date(now - (i + 20) * 3600000).toISOString(),
      user: {
        id: `neutraluser_${i}`,
        screen_name: `newssource${i}`,
        followers_count: 50000,
        verified: true
      },
      favorite_count: 1000,
      retweet_count: 200
    });
  });

  return items;
}

/**
 * Generate high echo chamber mock data
 */
export function generateEchoChamberData(): RawItem[] {
  const items: RawItem[] = [];
  const now = Date.now();

  // All from same source, same topic
  const sameSource = 'techblogger';
  const texts = [
    'New AI breakthrough announced! #AI #tech',
    'Machine learning is transforming everything #ML #tech',
    'Latest AI research shows amazing results #AI #research',
    'Tech industry embracing AI at record pace #tech #AI',
    'AI startup raises $100M in funding #AI #startups',
    'Deep learning models getting more powerful #AI #deeplearning',
    'Natural language processing makes huge leap #NLP #AI',
    'Computer vision AI reaches human-level #AI #computervision',
    'AI ethics debate heats up in tech community #AI #ethics',
    'New programming framework for AI released #AI #programming'
  ];

  texts.forEach((text, i) => {
    items.push({
      id: `echo_${i}`,
      text,
      created_at: new Date(now - i * 3600000).toISOString(),
      user: {
        id: 'same_user',
        screen_name: sameSource,
        followers_count: 50000,
        verified: true
      },
      favorite_count: 100 + i * 10,
      retweet_count: 20 + i * 2
    });
  });

  return items;
}

/**
 * Generate emotionally manipulative content
 */
export function generateManipulativeData(): RawItem[] {
  const items: RawItem[] = [];
  const now = Date.now();

  const manipulativeTexts = [
    'BREAKING: You WON\'T BELIEVE what they\'re hiding from you!!! 😱😱😱 #shocking',
    'This is OUTRAGEOUS! They don\'t want you to know the TRUTH! Share before it\'s deleted! ⚠️',
    'I\'m literally SHAKING right now. This is the most TERRIFYING thing ever! 😰',
    'URGENT: Time is running out! Act NOW before it\'s too late! ⏰🚨',
    'They\'re LYING to you! Wake up people! The mainstream media won\'t report this! 🤬',
    'This will make you SO ANGRY! What they did is UNFORGIVABLE! 😡😡',
    'HORRIBLE news that everyone needs to see! This is a DISASTER! 💔',
    'You need to be TERRIFIED about this! Spread the word! 😱⚠️',
    'SHOCKING revelation! Everything you thought you knew is WRONG! 🤯',
    'This is an EMERGENCY! Share immediately! Lives are at stake! 🚨🆘'
  ];

  manipulativeTexts.forEach((text, i) => {
    items.push({
      id: `manip_${i}`,
      text,
      created_at: new Date(now - i * 3600000).toISOString(),
      user: {
        id: `viral_${i % 3}`,
        screen_name: `viral_account${i % 3}`,
        followers_count: 100000 + i * 10000,
        verified: false
      },
      favorite_count: 5000 + i * 500,
      retweet_count: 1000 + i * 100,
      reply_count: 500 + i * 50
    });
  });

  return items;
}

/**
 * Generate heavily commercial content
 */
export function generateCommercialData(): RawItem[] {
  const items: RawItem[] = [];
  const now = Date.now();

  const commercialTexts = [
    'Just tried @Nike new running shoes! Use code SAVE20 for discount! #ad #sponsored #fitness',
    'Loving my new @Apple iPhone! Best phone ever! Link in bio! #ad #tech',
    'This @Sephora makeup is AMAZING! Swipe up to shop! #sponsored #beauty #ad',
    'Check out @Amazon Prime Day deals! So many savings! #affiliate #shopping',
    'My @Lululemon haul arrived! Use my code for 15% off! #ad #fitness #fashion',
    '@HelloFresh changed my life! Use code CHEF50 for discount! #sponsored #food #ad',
    'Obsessed with @Glossier! Shop the link in bio! #pr #beauty #sponsored',
    'Can\'t live without my @Peloton! Join me with this referral link! #ad #fitness',
    '@Target has the best deals! Check out my finds! #targethaul #shopping #affiliate',
    'New @Samsung phone is incredible! Pre-order now! #ad #tech #sponsored'
  ];

  commercialTexts.forEach((text, i) => {
    items.push({
      id: `commercial_${i}`,
      text,
      created_at: new Date(now - i * 3600000).toISOString(),
      user: {
        id: `influencer_${i % 4}`,
        screen_name: `influencer${i % 4}`,
        followers_count: 250000 + i * 50000,
        verified: true
      },
      favorite_count: 10000 + i * 1000,
      retweet_count: 500 + i * 50,
      sponsored: true,
      entities: {
        urls: [{ expanded_url: 'https://tracking.example.com/affiliate123' }]
      }
    });
  });

  return items;
}

/**
 * Generate diverse, healthy feed
 */
export function generateHealthyData(): RawItem[] {
  const items: RawItem[] = [];
  const now = Date.now();

  const diverseTopics = [
    { text: 'Fascinating article on marine biology research #science', topic: 'science' },
    { text: 'Just finished reading a great historical fiction novel #books', topic: 'books' },
    { text: 'Local farmers market has amazing produce today #food #local', topic: 'food' },
    { text: 'Important piece on climate policy from @Reuters #news', topic: 'news' },
    { text: 'Beautiful sunset photography from my hike today #nature #photography', topic: 'nature' },
    { text: 'Interesting perspective on urban planning #architecture', topic: 'architecture' },
    { text: 'New study shows benefits of mindfulness practice #health #wellness', topic: 'health' },
    { text: 'Community garden project making great progress #community', topic: 'community' },
    { text: 'Loved this documentary on space exploration #space #documentary', topic: 'space' },
    { text: 'Local musicians performing tonight at town square #music #local', topic: 'music' },
    { text: 'Volunteer day at animal shelter was wonderful #volunteering', topic: 'volunteering' },
    { text: 'Great discussion about education reform #education', topic: 'education' },
    { text: 'Weekend road trip to national park was amazing #travel', topic: 'travel' },
    { text: 'New art exhibition opens downtown this week #art', topic: 'art' },
    { text: 'Enjoyed the symphony performance last night #classicalmusic', topic: 'music' }
  ];

  diverseTopics.forEach((item, i) => {
    items.push({
      id: `healthy_${i}`,
      text: item.text,
      created_at: new Date(now - i * 3600000).toISOString(),
      user: {
        id: `diverse_user_${i}`,
        screen_name: `user_${item.topic}`,
        followers_count: 1000 + Math.floor(Math.random() * 10000),
        verified: i % 5 === 0
      },
      favorite_count: 50 + Math.floor(Math.random() * 200),
      retweet_count: 10 + Math.floor(Math.random() * 50)
    });
  });

  return items;
}

/**
 * Generate mixed platform data for platform contrast testing
 */
export function generateMultiPlatformData(): Map<Platform, RawItem[]> {
  const data = new Map<Platform, RawItem[]>();

  // Twitter: Tech-heavy
  data.set('twitter', generateMockTwitterData(15));

  // Instagram: Lifestyle-heavy
  data.set('instagram', generateMockInstagramData(15));

  return data;
}

/**
 * Get all mock datasets
 */
export const mockDatasets = {
  twitter: generateMockTwitterData,
  instagram: generateMockInstagramData,
  political: generatePoliticallyDiverseData,
  echoChamber: generateEchoChamberData,
  manipulative: generateManipulativeData,
  commercial: generateCommercialData,
  healthy: generateHealthyData,
  multiPlatform: generateMultiPlatformData
};
