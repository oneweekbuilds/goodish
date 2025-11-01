import React, { useState } from "react";
import { AlertCircle, Copy, Check, ChevronDown, ChevronUp, X } from "lucide-react";

interface ErrorEntry {
  id: string;
  timestamp: number;
  filename: string;
  message: string;
}

interface ErrorConsoleProps {
  errors: ErrorEntry[];
  onClear: () => void;
}

export function ErrorConsole({ errors, onClear }: ErrorConsoleProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (errors.length === 0) return null;

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const copyAllErrors = () => {
    const allErrors = errors
      .map((e) => {
        const date = new Date(e.timestamp).toLocaleString();
        return `[${date}] ${e.filename}\n${e.message}\n`;
      })
      .join("\n");
    copyToClipboard(allErrors, "all");
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-fixed border-t border-neg/20 bg-panel shadow-e4">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-negLight border-b border-neg/20">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-neg" />
          <h3 className="font-semibold text-ink">
            Error Console
            <span className="ml-2 px-2 py-0.5 rounded-full bg-neg text-white text-xs font-bold">
              {errors.length}
            </span>
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyAllErrors}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-panel hover:bg-grid transition-colors text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
            title="Copy all errors"
          >
            {copiedId === "all" ? (
              <>
                <Check className="w-4 h-4 text-pos" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy All</span>
              </>
            )}
          </button>

          <button
            onClick={onClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-panel hover:bg-neg hover:text-white transition-colors text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
            title="Clear errors"
          >
            <X className="w-4 h-4" />
            <span>Clear</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-panel hover:bg-grid transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronUp className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Error list */}
      {isExpanded && (
        <div className="max-h-64 overflow-y-auto bg-panel">
          {errors.map((error) => {
            const date = new Date(error.timestamp).toLocaleString();
            return (
              <div
                key={error.id}
                className="px-4 py-3 border-b border-line hover:bg-grid transition-colors group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-inkMuted">{date}</span>
                      <span className="text-xs font-mono text-accent px-2 py-0.5 rounded bg-accentLight">
                        {error.filename}
                      </span>
                    </div>
                    <p className="text-sm text-neg font-medium break-words">{error.message}</p>
                  </div>

                  <button
                    onClick={() =>
                      copyToClipboard(`[${date}] ${error.filename}\n${error.message}`, error.id)
                    }
                    className="flex-shrink-0 p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-brandLight transition-all focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                    title="Copy error"
                  >
                    {copiedId === error.id ? (
                      <Check className="w-4 h-4 text-pos" />
                    ) : (
                      <Copy className="w-4 h-4 text-inkMuted" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Minimized state */}
      {!isExpanded && (
        <div className="px-4 py-2 text-sm text-inkMuted">
          {errors.length} error{errors.length > 1 ? "s" : ""} • Click to expand
        </div>
      )}
    </div>
  );
}
