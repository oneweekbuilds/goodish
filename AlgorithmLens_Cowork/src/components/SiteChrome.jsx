/**
 * SiteChrome: the header and footer for the pages the single-page app
 * still serves (/terms and /methodology). The landing page, the explorer
 * and the privacy policy are static files under public/, so this chrome
 * links across to them with plain anchors, not router links.
 *
 * The former Coming Soon gate (banner, waitlist, route guard) is retired;
 * the web app's own routes redirect to the front page in vercel.json.
 */
import React from 'react';

export function SiteHeader() {
  return (
    <header className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 flex items-center justify-between gap-4 border-b border-border-light/50 min-h-[72px]">
      <a href="/" aria-label="AlgorithmLens home" className="flex items-center min-h-[44px] w-[150px]">
        <svg viewBox="0 0 436 88" role="img" aria-label="AlgorithmLens" className="block w-full h-auto">
          <use href="/static/img/wordmark.svg#wordmark" />
        </svg>
      </a>
      <nav aria-label="Site" className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        <a href="/" className="inline-flex items-center min-h-[44px] underline-offset-4 hover:underline">Front page</a>
        <a href="/explore/" className="inline-flex items-center min-h-[44px] underline-offset-4 hover:underline">Explore the example</a>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="max-w-3xl mx-auto px-4 sm:px-6 py-8 mt-12 border-t border-border-light/50 text-sm text-text-muted">
      <nav aria-label="Legal and more" className="flex flex-wrap gap-x-6 gap-y-1">
        <a href="/" className="inline-flex items-center min-h-[44px] underline-offset-4 hover:underline">Front page</a>
        <a href="/privacy/" className="inline-flex items-center min-h-[44px] underline-offset-4 hover:underline">Privacy policy</a>
        <a href="/terms" className="inline-flex items-center min-h-[44px] underline-offset-4 hover:underline">Terms</a>
        <a href="/methodology" className="inline-flex items-center min-h-[44px] underline-offset-4 hover:underline">Methodology</a>
        <a href="mailto:privacy@algorithmlens.com" className="inline-flex items-center min-h-[44px] underline-offset-4 hover:underline">privacy@algorithmlens.com</a>
      </nav>
    </footer>
  );
}
