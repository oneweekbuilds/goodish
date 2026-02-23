/**
 * Analysis module — Gemini 2.0 Flash feed analysis pipeline.
 *
 * Exports the core analysis service, pipeline orchestrator,
 * and prompt definitions for broadcast frame analysis.
 */

export { GeminiFlashService, GeminiApiError } from './geminiFlashService';
export {
  BroadcastAnalysisPipeline,
  PipelineError,
  type PipelineStage,
  type PipelineProgress,
  type PipelineCallbacks,
  type PipelineConfig,
} from './broadcastAnalysisPipeline';
export {
  GEMINI_SYSTEM_PROMPT,
  buildFramePrompt,
  buildDeduplicationPrompt,
  type GeminiFrameResponse,
  type GeminiExtractedItem,
  type GeminiDeduplicationResponse,
} from './analysisPrompts';
export {
  storeAnalysisData,
  consumeAnalysisData,
  hasAnalysisData,
  clearAnalysisData,
} from './analysisDataStore';
