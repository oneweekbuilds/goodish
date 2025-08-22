'use client'

import React, { useState } from "react";
import { cn } from '@goodish/lib'

/**
 * Reusable subscribe form that posts directly to Beehiiv's endpoint.
 * Props:
 * - variant: "wide" | "compact"
 * - formId: Beehiiv form ID (goodheart or goodish)
 * - onSuccess?: optional callback (e.g., navigate to quiz results)
 * - bgBlendClass?: optional Tailwind to blend with section (e.g., "bg-[#E3F5F5]")
 */
export interface SubscribeFormProps {
  variant?: "wide" | "compact";
  formId: "goodheart" | "goodish";
  onSuccess?: () => void;
  bgBlendClass?: string;
  showHeading?: boolean;
}

export default function SubscribeForm({
  variant = "wide",
  formId,
  onSuccess,
  bgBlendClass = "",
  showHeading = true,
}: SubscribeFormProps) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Beehiiv form configurations
  const formConfigs = {
    goodheart: {
      formId: "b8677a39-0139-4404-84df-df3b8e1d5c2f",
      action: "https://subscribe-forms.beehiiv.com/api/submit"
    },
    goodish: {
      formId: "9be0df98-11eb-4934-aee0-98b2fc6f4fd2", 
      action: "https://subscribe-forms.beehiiv.com/api/submit"
    }
  };

  const config = formConfigs[formId];
  const isCompact = variant === "compact";

  const containerBase = isCompact ? "w-full" : "w-full flex justify-center";
  const containerPad = isCompact ? "py-2" : "py-8";
  const cardBase = isCompact ? "w-full" : "w-full rounded-2xl shadow-md";
  const cardWidth = isCompact ? "" : "max-w-2xl";
  const cardPad = isCompact ? "p-0" : "p-6";
  const cardBg = bgBlendClass || (isCompact ? "bg-transparent" : "bg-white");

  const labelCls = "block text-sm font-medium mb-2";
  const rowCls = "mt-2 flex items-stretch gap-2";
  const inputCls = "flex-1 h-12 px-4 rounded-xl border border-black/15 focus:outline-none focus:ring-2 focus:ring-black/10";
  const btnCls = "h-12 px-5 rounded-xl border border-black/20 hover:border-black/30 transition disabled:opacity-60 bg-white";

  const headingCls = isCompact
    ? "text-lg font-semibold text-center"
    : "text-xl font-semibold text-center";

  const subtextCls = isCompact
    ? "text-sm text-center text-black/60"
    : "text-base text-center text-black/60";

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

      // Post directly to Beehiiv
      const res = await fetch(config.action, {
        method: "POST",
        body: formData,
        mode: 'no-cors' // Beehiiv endpoints may not support CORS
      });

      // With no-cors mode, we can't check response status, so assume success
      setSuccess(true);
      setEmail("");
      
      if (onSuccess) {
        // Delay navigation slightly to show success state
        setTimeout(() => onSuccess(), 1000);
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className={cn(containerBase, containerPad)}>
        <div className={cn(cardBase, cardWidth, cardPad, cardBg)}>
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
      </div>
    );
  }

  return (
    <div className={cn(containerBase, containerPad)}>
      <div className={cn(cardBase, cardWidth, cardPad, cardBg)}>
        {showHeading && (
          <div className="mb-4">
            <h3 className={headingCls}>Stay updated</h3>
            <p className={subtextCls}>
              Get launch updates and new features. No spam.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full" aria-label="Newsletter subscribe">
          <label htmlFor="subscribe-email" className={labelCls}>
            Email address
          </label>
          <div className={rowCls}>
            <input
              id="subscribe-email"
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
    </div>
  );
}