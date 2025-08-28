'use client'

import React, { useState } from "react";

export interface SubscribeFormGoodHeartProps {
  variant?: "wide" | "compact";
  onSuccess?: () => void;
  bgBlendClass?: string;
  showHeading?: boolean;
}

export default function SubscribeFormGoodHeart({
  variant = "compact",
  onSuccess,
  bgBlendClass = "",
  showHeading = false,
}: SubscribeFormGoodHeartProps) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Beehiiv form configuration for GoodHeart (using local API proxy)
  const config = {
    formId: "b8677a39-0139-4404-84df-df3b8e1d5c2f",
    action: "/api/subscribe"
  };

  const isCompact = variant === "compact";
  const cardBg = bgBlendClass || "bg-transparent";

  const labelCls = "block text-sm font-medium mb-2";
  const rowCls = "mt-2 flex items-stretch gap-2";
  const inputCls = "flex-1 h-12 px-4 rounded-xl border border-black/15 focus:outline-none focus:ring-2 focus:ring-yellow-300";
  const btnCls = "h-12 px-5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-semibold transition disabled:opacity-60";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("form[email]", email);
      formData.append("form_id", config.formId);
      
      // Add optional UTM and referrer params (Beehiiv expects these)
      formData.append("utm_source", "");
      formData.append("utm_medium", "");
      formData.append("utm_campaign", "");
      formData.append("referrer", window.location.href);

      // Debug logging before submit
      const hiddenFields = { form_id: config.formId, utm_source: "", utm_medium: "", utm_campaign: "", referrer: window.location.href };
      console.log("[SubscribeFormGoodHeart] submitting", { action: config.action, hiddenKeys: Object.keys(hiddenFields) });

      // Post directly to Beehiiv
      const res = await fetch(config.action, {
        method: "POST",
        body: formData,
      });

      // Debug logging after submit
      console.log("[SubscribeFormGoodHeart] response", res.status);
      
      if (!res.ok) {
        const errorText = await res.text().catch(() => null);
        console.error("[SubscribeFormGoodHeart] error", errorText);
        const isNetwork = true;
        setError(isNetwork ? 'Network error. Please try again.' : 'Something went wrong. Please try again.');
        return;
      }

      setSuccess(true);
      setEmail("");
      
      if (onSuccess) {
        // Delay navigation slightly to show success state
        setTimeout(() => onSuccess(), 1000);
      }
    } catch (err: any) {
      console.error("[SubscribeFormGoodHeart] exception", err);
      const isNetwork = err?.message?.toLowerCase?.().includes('fetch') || err?.name === 'TypeError';
      setError(isNetwork ? 'Network error. Please try again.' : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className={`w-full ${cardBg} p-6`}>
        <div className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Successfully subscribed!</h3>
          <p className="text-sm text-black/60">
            You'll receive updates as new projects ship.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${cardBg}`}>
      {showHeading && (
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-center">Stay updated</h3>
          <p className="text-base text-center text-black/60">
            Get launch updates and new features. No spam.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full" aria-label="Newsletter subscribe">
        <label htmlFor="subscribe-email-goodheart" className={labelCls}>
          Email address
        </label>
        <div className={rowCls}>
          <input
            id="subscribe-email-goodheart"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
          <button
            type="submit"
            className={btnCls}
            disabled={submitting}
          >
            {submitting ? "Joining..." : "Join"}
          </button>
        </div>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}