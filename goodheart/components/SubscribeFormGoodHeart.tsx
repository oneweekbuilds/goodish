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
      // Extract UTM parameters from URL
      const urlParams = new URLSearchParams(window.location.search);
      const utm_source = urlParams.get('utm_source') || '';
      const utm_medium = urlParams.get('utm_medium') || '';
      const utm_campaign = urlParams.get('utm_campaign') || '';

      // Build payload for same-origin API route
      const payload = {
        email,
        utm_source,
        utm_medium,
        utm_campaign,
      };

      console.info('GH_SUBMIT: using /api/subscribe', payload);

      // Call same-origin API route
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("[SubscribeFormGoodHeart] response", res.status);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error("[SubscribeFormGoodHeart] API error:", errorData);
        // Show friendly error, don't render raw HTML
        const friendlyError = typeof errorData.error === 'string' && errorData.error.length < 200
          ? errorData.error 
          : 'Subscription failed. Please try again.';
        setError(friendlyError);
        return;
      }

      const result = await res.json();
      console.log("[SubscribeFormGoodHeart] success:", result);

      setSuccess(true);
      setEmail("");
      
      if (onSuccess) {
        // Delay navigation slightly to show success state
        setTimeout(() => onSuccess(), 1000);
      }
    } catch (err: any) {
      console.error("[SubscribeFormGoodHeart] exception:", err.message);
      setError(`Network error: ${err.message}`);
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
      {process.env.NODE_ENV !== 'production' ? (
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
          Wired to: <code>/api/subscribe</code>
        </div>
      ) : null}
    </div>
  );
}