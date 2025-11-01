// API Endpoint - single route for analysis
// POST /api/analyze with raw items → returns complete analysis report

import type { RawItem, Platform } from '../../types/content';
import type { AnalyzerOptions, AnalysisReport } from '../../types/analysis';
import { analyzeContent, quickAnalyze, analyzeBatch } from '../pipeline/mainAnalyzer';

/**
 * API request body format
 */
export interface AnalyzeRequest {
  items: RawItem[];
  platform: Platform;
  options?: AnalyzerOptions;
}

/**
 * Batch API request body format
 */
export interface BatchAnalyzeRequest {
  data: Array<{
    platform: Platform;
    items: RawItem[];
  }>;
  options?: AnalyzerOptions;
}

/**
 * API response format
 */
export interface AnalyzeResponse {
  success: boolean;
  report?: AnalysisReport;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Batch API response format
 */
export interface BatchAnalyzeResponse {
  success: boolean;
  reports?: Record<Platform, AnalysisReport>;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Main analysis endpoint handler
 * @param request - Analysis request
 * @returns Analysis response
 */
export async function handleAnalyzeRequest(
  request: AnalyzeRequest
): Promise<AnalyzeResponse> {
  try {
    // Validate request
    if (!request.items || !Array.isArray(request.items)) {
      return {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Request must include "items" array'
        }
      };
    }

    if (!request.platform) {
      return {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Request must include "platform" field'
        }
      };
    }

    // Validate platform
    const validPlatforms: Platform[] = [
      'twitter',
      'instagram',
      'facebook',
      'youtube',
      'tiktok',
      'reddit',
      'linkedin'
    ];

    if (!validPlatforms.includes(request.platform)) {
      return {
        success: false,
        error: {
          code: 'INVALID_PLATFORM',
          message: `Platform must be one of: ${validPlatforms.join(', ')}`
        }
      };
    }

    // Check minimum items
    if (request.items.length === 0) {
      return {
        success: false,
        error: {
          code: 'NO_ITEMS',
          message: 'No items provided for analysis'
        }
      };
    }

    // Run analysis
    const report = await analyzeContent(
      request.items,
      request.platform,
      request.options
    );

    // Check if analysis failed
    if (report.warnings.length > 0 && report.metadata.validItemCount === 0) {
      return {
        success: false,
        error: {
          code: 'ANALYSIS_FAILED',
          message: 'Analysis failed',
          details: report.warnings
        }
      };
    }

    return {
      success: true,
      report
    };

  } catch (error) {
    console.error('Analysis error:', error);

    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      }
    };
  }
}

/**
 * Quick analysis endpoint (minimal options)
 * @param request - Minimal request
 * @returns Analysis response
 */
export async function handleQuickAnalyze(
  request: Pick<AnalyzeRequest, 'items' | 'platform'>
): Promise<AnalyzeResponse> {
  try {
    if (!request.items || !request.platform) {
      return {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Items and platform required'
        }
      };
    }

    const report = await quickAnalyze(request.items, request.platform);

    return {
      success: true,
      report
    };

  } catch (error) {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Batch analysis endpoint
 * @param request - Batch request
 * @returns Batch response
 */
export async function handleBatchAnalyze(
  request: BatchAnalyzeRequest
): Promise<BatchAnalyzeResponse> {
  try {
    if (!request.data || !Array.isArray(request.data)) {
      return {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Request must include "data" array'
        }
      };
    }

    // Convert to map
    const platformData = new Map<Platform, RawItem[]>();

    for (const item of request.data) {
      if (!item.platform || !item.items) {
        return {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Each data item must have platform and items'
          }
        };
      }

      platformData.set(item.platform, item.items);
    }

    // Run batch analysis
    const resultsMap = await analyzeBatch(platformData, request.options);

    // Convert map to object
    const reports: Record<string, AnalysisReport> = {};
    for (const [platform, report] of resultsMap) {
      reports[platform] = report;
    }

    return {
      success: true,
      reports: reports as Record<Platform, AnalysisReport>
    };

  } catch (error) {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Express/Next.js compatible handler
 * Can be used in API routes
 */
export function createApiHandler() {
  return async (req: any, res: any) => {
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only POST requests allowed'
        }
      });
    }

    try {
      const body = req.body as AnalyzeRequest;
      const response = await handleAnalyzeRequest(body);

      const statusCode = response.success ? 200 : 400;
      return res.status(statusCode).json(response);

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Server error'
        }
      });
    }
  };
}

/**
 * Example usage in Next.js API route:
 *
 * // pages/api/analyze.ts
 * import { createApiHandler } from '@/analysis/api/analyze';
 * export default createApiHandler();
 */

/**
 * Example fetch usage:
 *
 * const response = await fetch('/api/analyze', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     items: rawItems,
 *     platform: 'twitter',
 *     options: {
 *       seed: 42,
 *       generateNarrative: true
 *     }
 *   })
 * });
 *
 * const { success, report, error } = await response.json();
 */
