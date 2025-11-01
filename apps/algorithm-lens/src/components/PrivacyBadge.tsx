import React from 'react';
import { Shield, Eye, Server } from "lucide-react";

interface PrivacyBadgeProps {
  variant?: "full" | "compact";
}

export function PrivacyBadge({ variant = "full" }: PrivacyBadgeProps) {
  if (variant === "compact") {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-posLight border border-pos/20 text-sm">
        <Shield className="w-4 h-4 text-pos" />
        <span className="font-semibold text-pos">Zero Telemetry</span>
        <span className="text-inkMuted">• Your data stays local</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-posLight bg-gradient-to-br from-posLight/50 to-brandLight/30 p-6 shadow-e2">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl bg-pos/10 flex items-center justify-center flex-shrink-0">
          <Shield className="w-6 h-6 text-pos" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-ink mb-2">Absolute Privacy Guarantee</h3>
          <p className="text-sm text-inkMuted mb-4">
            Algorithm Lens has <strong className="text-ink">zero telemetry, zero tracking, and zero data collection.</strong>
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-panel flex items-center justify-center flex-shrink-0">
            <Server className="w-4 h-4 text-pos" />
          </div>
          <div>
            <div className="text-sm font-semibold text-ink mb-1">No Servers</div>
            <div className="text-xs text-inkMuted">100% browser-based</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-panel flex items-center justify-center flex-shrink-0">
            <Eye className="w-4 h-4 text-pos" />
          </div>
          <div>
            <div className="text-sm font-semibold text-ink mb-1">No Analytics</div>
            <div className="text-xs text-inkMuted">We can't see your data</div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-panel flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-pos" />
          </div>
          <div>
            <div className="text-sm font-semibold text-ink mb-1">No Tracking</div>
            <div className="text-xs text-inkMuted">Zero cookies or scripts</div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-pos/20">
        <p className="text-xs text-inkMuted text-center">
          Your imports, analysis, and insights stay on your device. Forever.{" "}
          <a
            href="#/privacy"
            className="text-brand font-semibold hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand rounded"
          >
            Read our privacy policy →
          </a>
        </p>
      </div>
    </div>
  );
}
