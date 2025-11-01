/**
 * Robust parsing utilities with Zod validation
 * Handles JSON, JavaScript modules, and various platform formats
 */

import { z } from 'zod';
import { logService } from './logService';

/**
 * Safely parse JSON or JavaScript module syntax
 * Handles: JSON, module.exports = ..., export default ..., window.YTD = ...
 */
export function safeParseJSON(input: string, filename: string): any {
  // Try standard JSON first
  try {
    return JSON.parse(input);
  } catch (jsonError) {
    // Not valid JSON, try JavaScript module patterns
    try {
      // Check for common module patterns
      if (input.includes('module.exports') || input.includes('export default') || input.includes('window.')) {
        // Create a sandboxed function to extract the data
        const sandbox: any = {
          module: { exports: {} },
          exports: {},
          window: {}
        };

        // Wrap in function to avoid global scope pollution
        const func = new Function('module', 'exports', 'window', input + '; return module.exports || exports.default || window;');
        const result = func(sandbox.module, sandbox.exports, sandbox.window);

        // Extract the actual data from various possible locations
        if (result.module?.exports) return result.module.exports;
        if (result.exports) return result.exports;

        // For window.YTD patterns (Twitter/X)
        if (result.window?.YTD) {
          const keys = Object.keys(result.window.YTD);
          if (keys.length > 0) {
            return result.window.YTD[keys[0]];
          }
        }

        // Try to find the first non-empty object/array
        const values = Object.values(result).filter(v => v && (Array.isArray(v) || typeof v === 'object'));
        if (values.length > 0) return values[0];

        return result;
      }

      throw new Error('Unrecognized JavaScript module format');
    } catch (jsError) {
      logService.error(
        `Failed to parse ${filename}`,
        `Not valid JSON or recognized JavaScript format`,
        { jsonError: (jsonError as Error).message, jsError: (jsError as Error).message }
      );
      throw new Error(`Failed to parse ${filename}: ${(jsError as Error).message}`);
    }
  }
}

/**
 * Zod schemas for each platform
 */

// Instagram schema
export const instagramSchema = z.array(z.object({
  title: z.string().optional(),
  media_list_data: z.array(z.any()).optional(),
  string_list_data: z.array(z.object({
    timestamp: z.number(),
    value: z.string().optional(),
  })).optional(),
}).passthrough());

// TikTok schema
export const tiktokSchema = z.object({
  Activity: z.object({
    'Video Browsing History': z.array(z.object({
      Date: z.string(),
      VideoLink: z.string().optional(),
    })).optional(),
  }).passthrough().optional(),
}).passthrough().or(z.array(z.any()));

// X/Twitter schema
export const xSchema = z.array(z.object({
  tweet: z.object({
    created_at: z.string(),
    id_str: z.string(),
    full_text: z.string(),
    favorite_count: z.number().optional(),
    retweet_count: z.number().optional(),
  }).passthrough(),
}).passthrough());

// YouTube schema
export const youtubeSchema = z.array(z.object({
  header: z.string().optional(),
  title: z.string().optional(),
  titleUrl: z.string().optional(),
  time: z.string().optional(),
  products: z.array(z.string()).optional(),
  subtitles: z.array(z.object({
    name: z.string(),
    url: z.string().optional(),
  })).optional(),
}).passthrough());

// Facebook schema
export const facebookSchema = z.array(z.object({
  timestamp: z.number(),
  data: z.array(z.object({
    post: z.string().optional(),
  }).passthrough()).optional(),
  title: z.string().optional(),
}).passthrough()).or(z.object({
  posts: z.array(z.any()),
}).passthrough());

// Reddit schema
export const redditSchema = z.array(z.object({
  kind: z.string().optional(),
  data: z.object({
    created_utc: z.number().optional(),
    title: z.string().optional(),
    selftext: z.string().optional(),
    body: z.string().optional(),
    subreddit: z.string().optional(),
  }).passthrough(),
}).passthrough()).or(z.object({
  comments: z.array(z.any()).optional(),
  posts: z.array(z.any()).optional(),
}).passthrough());

/**
 * Validate and parse platform-specific data
 */
export function validatePlatformData(data: any, platform: string, filename: string): any {
  try {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return instagramSchema.parse(data);
      case 'tiktok':
        return tiktokSchema.parse(data);
      case 'x':
      case 'twitter':
        return xSchema.parse(data);
      case 'youtube':
        return youtubeSchema.parse(data);
      case 'facebook':
        return facebookSchema.parse(data);
      case 'reddit':
        return redditSchema.parse(data);
      default:
        logService.warn(`Unknown platform: ${platform}`, `Skipping validation for ${filename}`);
        return data; // Return as-is if platform unknown
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      logService.error(
        `Schema validation failed for ${filename}`,
        `${firstError.path.join('.')}: ${firstError.message}`,
        { platform, errors: error.errors.slice(0, 3) }
      );
      throw new Error(`Invalid ${platform} data format in ${filename}`);
    }
    throw error;
  }
}

/**
 * Detect platform from filename
 */
export function detectPlatform(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.includes('instagram')) return 'instagram';
  if (lower.includes('tiktok')) return 'tiktok';
  if (lower.includes('tweet') || lower.includes('twitter') || lower.includes('x_')) return 'x';
  if (lower.includes('youtube') || lower.includes('watch')) return 'youtube';
  if (lower.includes('facebook')) return 'facebook';
  if (lower.includes('reddit')) return 'reddit';
  return 'unknown';
}
