import React from 'react';
import { Monitor, Smartphone, Bug } from 'lucide-react';

/**
 * DebugPanel - Shows diagnostic information for QA testing (#14)
 * Extracted from ResultsPage for maintainability.
 * Visible when ?debug=1 query param is present or when toggle is clicked.
 */
const DebugPanel = ({ result, scanId, displayData }) => {
  if (!result) return null;

  const source = displayData?.source || 'unknown';
  const scanData = result.result || result.scan || result;
  const scanMeta = scanData.scan_metadata || result.scan_metadata || {};
  const aggregates = scanData.aggregates || {};
  const environment = scanData.environment || {};
  const debugInfo = scanData.debug || {};

  const totalPosts = aggregates.total_feed_items || 0;
  const totalAds = aggregates.total_ads || 0;
  const adPercentage = aggregates.ad_percentage || 0;
  const platform = scanMeta.platform || result.platform || 'Unknown';
  const createdAt = scanMeta.created_at || result.created_at;
  const sourceType = scanMeta.source_type || result.source_type || 'N/A';

  const deviceType = environment.device_type || 'N/A';
  const browserName = environment.browser_name || 'N/A';
  const videoDuration = environment.video_capture?.duration_seconds;
  const hasExtensionCapture = !!environment.extension_capture;

  const processingTime = debugInfo.processing_time_seconds;
  const framesExtracted = debugInfo.frames_extracted;
  const warnings = debugInfo.warnings || [];
  const errors = debugInfo.errors || [];

  return (
    <div className="bg-white rounded-xl shadow-md border border-border-light p-5 relative">
      <div className="absolute top-3 right-3">
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold uppercase tracking-wider rounded bg-status-warning/10 text-status-warning border border-status-warning/20">
          <Bug size={12} />
          Debug
        </span>
      </div>

      <h3 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
        <Bug size={20} className="text-status-warning" />
        Debug Panel (Desktop Scan QA)
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
        <DebugRow label="Source">
          <span className="font-medium text-text-main flex items-center gap-1">
            {source === 'desktop' ? (
              <>
                <Monitor size={14} className="text-primary-blue" />
                Desktop (Extension)
              </>
            ) : (
              <>
                <Smartphone size={14} className="text-accent-green" />
                Mobile upload
              </>
            )}
          </span>
        </DebugRow>

        <DebugRow label="Platform">
          <span className="font-medium text-text-main capitalize">{platform}</span>
        </DebugRow>

        <DebugRow label="Source Type (raw)">
          <span className="font-mono text-xs text-text-muted bg-primary-blue/5 px-2 py-0.5 rounded">{sourceType}</span>
        </DebugRow>

        <DebugRow label="Scan ID">
          <span className="font-mono text-xs text-text-muted bg-primary-blue/5 px-2 py-0.5 rounded truncate max-w-[180px]" title={scanId}>
            {scanId || scanMeta.scan_id || 'N/A'}
          </span>
        </DebugRow>

        <DebugRow label="Total Posts (backend)">
          <span className="font-bold text-text-main">{totalPosts}</span>
        </DebugRow>

        <DebugRow label="Ads Detected (backend)">
          <span className="font-bold text-text-main">{totalAds}</span>
        </DebugRow>

        <DebugRow label="Ads % (backend)">
          <span className="font-bold text-text-main">{Math.round(adPercentage * 100)}%</span>
        </DebugRow>

        <DebugRow label="Created At">
          <span className="text-text-muted">{createdAt ? new Date(createdAt).toLocaleString() : 'N/A'}</span>
        </DebugRow>

        <DebugRow label="Device Type">
          <span className="text-text-muted">{deviceType}</span>
        </DebugRow>

        <DebugRow label="Browser">
          <span className="text-text-muted">{browserName}</span>
        </DebugRow>

        {videoDuration !== undefined && (
          <DebugRow label="Video Duration">
            <span className="text-text-muted">{Math.round(videoDuration)}s</span>
          </DebugRow>
        )}

        <DebugRow label="Extension Capture">
          <span className={`font-medium ${hasExtensionCapture ? 'text-primary-blue' : 'text-text-muted/50'}`}>
            {hasExtensionCapture ? 'Yes' : 'No'}
          </span>
        </DebugRow>

        <DebugRow label="Desktop scanner version">
          <span className="font-mono text-xs text-text-muted bg-primary-blue/5 px-2 py-0.5 rounded">
            {(() => {
              const version = scanMeta.metadata?.scanner_version ||
                             scanData.metadata?.scanner_version ||
                             result?.metadata?.scanner_version;
              if (version) {
                return version.startsWith('v') ? version : `v${version}`;
              }
              return 'unknown';
            })()}
          </span>
        </DebugRow>

        {processingTime !== undefined && (
          <DebugRow label="Processing Time">
            <span className="text-text-muted">{processingTime.toFixed(2)}s</span>
          </DebugRow>
        )}

        {framesExtracted !== undefined && (
          <DebugRow label="Frames Extracted">
            <span className="text-text-muted">{framesExtracted}</span>
          </DebugRow>
        )}

        <DebugRow label="AI Consent Given">
          <span className={`font-medium ${debugInfo.gemini_consent ? 'text-status-success' : 'text-text-muted/50'}`}>
            {debugInfo.gemini_consent ? 'Yes' : 'No'}
          </span>
        </DebugRow>

        <DebugRow label="AI Analysis Used">
          <span className={`font-medium ${debugInfo.gemini_used ? 'text-status-success' : 'text-text-muted/50'}`}>
            {debugInfo.gemini_used ? 'Yes' : 'No'}
          </span>
        </DebugRow>

        {debugInfo.gemini_reason && (
          <DebugRow label="AI Reason">
            <span className="font-mono text-xs text-text-muted bg-primary-blue/5 px-2 py-0.5 rounded">
              {debugInfo.gemini_reason}
            </span>
          </DebugRow>
        )}
      </div>

      {(warnings.length > 0 || errors.length > 0) && (
        <div className="mt-4 pt-4 border-t border-border-light">
          {errors.length > 0 && (
            <div className="mb-2">
              <span className="text-xs font-semibold text-status-error uppercase">Errors ({errors.length})</span>
              <ul className="mt-1 text-xs text-status-error">
                {errors.slice(0, 3).map((e, i) => (
                  <li key={i} className="truncate">&bull; {e.message || e.code}</li>
                ))}
              </ul>
            </div>
          )}
          {warnings.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-status-warning uppercase">Warnings ({warnings.length})</span>
              <ul className="mt-1 text-xs text-status-warning">
                {warnings.slice(0, 3).map((w, i) => (
                  <li key={i} className="truncate">&bull; {w.message || w.code}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/** Reusable debug row */
const DebugRow = ({ label, children }) => (
  <div className="flex justify-between py-1 border-b border-border-light/50">
    <span className="text-text-muted">{label}</span>
    {children}
  </div>
);

export default DebugPanel;
