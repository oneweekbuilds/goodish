import { getAllSamples } from '../db';

// Category mapping for product tags
const CATEGORY_MAP: Record<string, string> = {
  'iphone': 'Technology',
  'macbook': 'Technology',
  'laptop': 'Technology',
  'phone': 'Technology',
  'tech': 'Technology',
  'software': 'Technology',
  'gadget': 'Technology',
  'apple': 'Technology',
  'google': 'Technology',
  'microsoft': 'Technology',

  'wellness': 'Wellness',
  'health': 'Wellness',
  'fitness': 'Wellness',
  'yoga': 'Wellness',
  'meditation': 'Wellness',
  'peloton': 'Wellness',
  'gym': 'Wellness',

  'finance': 'Finance',
  'bank': 'Finance',
  'credit': 'Finance',
  'loan': 'Finance',
  'investment': 'Finance',
  'crypto': 'Finance',
  'trading': 'Finance',

  'fashion': 'Fashion',
  'clothing': 'Fashion',
  'shoes': 'Fashion',
  'apparel': 'Fashion',
  'style': 'Fashion',
  'nike': 'Fashion',
  'adidas': 'Fashion',

  'food': 'Food',
  'restaurant': 'Food',
  'delivery': 'Food',
  'meal': 'Food',
  'cooking': 'Food',
  'recipe': 'Food'
};

export interface ProductCategory {
  category: string;
  count: number;
  percentage: number;
  color: string;
}

export interface ProductCategories {
  categories: ProductCategory[];
  totalAds: number;
}

export async function getTopProductCategories(limit = 5): Promise<ProductCategory[]> {
  const items = await getAllSamples();
  const adItems = items.filter(item => item.type === 'ad');

  const categoryCount: Record<string, number> = {};

  for (const item of adItems) {
    if (!item.productTags || item.productTags.length === 0) continue;

    for (const tag of item.productTags) {
      const category = CATEGORY_MAP[tag.toLowerCase()] || 'Other';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    }
  }

  const total = Object.values(categoryCount).reduce((sum, count) => sum + count, 0);

  const categories = Object.entries(categoryCount)
    .map(([category, count]) => ({
      category,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      color: getCategoryColor(category)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  return categories;
}

export async function calculateProductCategories(limit = 5): Promise<ProductCategories> {
  const items = await getAllSamples();
  const adItems = items.filter(item => item.type === 'ad');

  const categoryCount: Record<string, number> = {};

  for (const item of adItems) {
    if (!item.productTags || item.productTags.length === 0) continue;

    for (const tag of item.productTags) {
      const category = CATEGORY_MAP[tag.toLowerCase()] || 'Other';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    }
  }

  const total = Object.values(categoryCount).reduce((sum, count) => sum + count, 0);

  const categories = Object.entries(categoryCount)
    .map(([category, count]) => ({
      category,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      color: getCategoryColor(category)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  return {
    categories,
    totalAds: adItems.length
  };
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'Technology': '#3B82F6',
    'Wellness': '#10B981',
    'Finance': '#F59E0B',
    'Fashion': '#EF4444',
    'Food': '#8B5CF6',
    'Other': '#6B7280'
  };
  return colors[category] || '#6B7280';
}
