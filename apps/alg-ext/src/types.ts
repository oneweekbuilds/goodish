/**
 * Core event type matching the ingest API schema
 */
export type LensEvent = {
  id: string;
  sessionId: string;
  platformGuess: 'reddit' | 'youtube' | 'instagram' | 'x' | 'facebook' | 'unknown';
  seenAt: number;
  block: {
    text: string;
    lines: { t: string; conf: number }[];
    lang?: string;
  };
  features: {
    author?: string;
    ageHint?: string;
    metrics?: {
      likes?: number;
      comments?: number;
      reposts?: number;
      views?: number;
    };
    links?: string[];
    hashtags?: string[];
  };
  quality: {
    ocrConfidenceAvg?: number;
    frameQuality?: 'high' | 'med' | 'low';
    dedupScore?: number;
  };
  source: 'dom_capture';
  schema: 2;
};

/**
 * Queued event in IndexedDB
 */
export type QueuedEvent = {
  id: string;
  accountId: string;
  deviceId: string;
  sessionId: string;
  seenAt: number;
  event: LensEvent;
  retries?: number;
  createdAt: number;
};

/**
 * Device registration info
 */
export type DeviceInfo = {
  deviceId: string;
  deviceToken: string;
  expiresAt: number;
  accountId: string;
};

/**
 * Session info
 */
export type SessionInfo = {
  sessionId: string;
  accountId: string;
  deviceId: string;
  startedAt: number;
  status: 'active' | 'finished';
};

/**
 * Extension settings
 */
export type ExtensionSettings = {
  accountId: string;
  apiBaseUrl: string;
  enabledSites: {
    reddit: boolean;
    youtube: boolean;
    instagram: boolean;
    x: boolean;
    facebook: boolean;
  };
};

/**
 * Capture state
 */
export type CaptureState = {
  isCapturing: boolean;
  session: SessionInfo | null;
  device: DeviceInfo | null;
  queueSize: number;
  lastUpload: {
    timestamp: number;
    accepted: number;
    skipped: number;
  } | null;
};

/**
 * Messages between components
 */
export type Message =
  | { type: 'START_CAPTURE'; session: SessionInfo; device: DeviceInfo }
  | { type: 'STOP_CAPTURE' }
  | { type: 'TOGGLE_CAPTURE' }
  | { type: 'GET_STATE' }
  | { type: 'STATE_UPDATE'; state: CaptureState }
  | { type: 'QUEUE_EVENT'; event: LensEvent; accountId: string; deviceId: string; sessionId: string }
  | { type: 'UPLOAD_BATCH' };
