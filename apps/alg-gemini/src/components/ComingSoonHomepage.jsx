import React from 'react';
import Logo from './Logo';
import WaitlistSignup from './WaitlistSignup';

/**
 * Coming Soon Homepage
 *
 * This component replaces the normal homepage when Coming Soon mode is enabled.
 * Features:
 * - Prominent "Coming Soon" hero banner with waitlist CTA
 * - Mid-page waitlist signup section
 * - Footer waitlist signup section
 *
 * Waitlist powered by Beehiiv Magic Link with AlgorithmLens UTM tracking.
 */

const ComingSoonHomepage = () => {
  return (
    <div className="min-h-screen bg-bg-page">
      {/* Hero Section with Coming Soon Banner */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Coming Soon Badge */}
          <div className="inline-block mb-8">
            <span className="px-6 py-2 bg-primary-blue/10 border border-primary-blue/30 rounded-full text-sm font-semibold text-primary-blue">
              Coming Soon
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-text-main mb-6 leading-tight">
            AlgorithmLens
          </h1>

          <p className="text-xl md:text-2xl text-text-muted mb-4 max-w-2xl mx-auto">
            Understand what social media algorithms see in your content
          </p>

          <p className="text-lg text-text-muted mb-12 max-w-xl mx-auto">
            Join the AlgorithmLens waitlist to be the first to try it when we launch
          </p>

          {/* Waitlist Form #1 - Hero */}
          <WaitlistSignup placement="hero" />
        </div>
      </section>

      {/* Features Preview Section */}
      <section className="py-20 px-6 bg-bg-page/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-text-main mb-12 text-center">
            What You'll Get
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-bg-page border border-primary-blue/10">
              <div className="w-12 h-12 rounded-full bg-primary-blue/10 flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-bold text-text-main mb-3">
                Deep Analytics
              </h3>
              <p className="text-text-muted">
                See how algorithms categorize and understand your social media content with detailed breakdowns.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-bg-page border border-primary-blue/10">
              <div className="w-12 h-12 rounded-full bg-primary-blue/10 flex items-center justify-center mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-xl font-bold text-text-main mb-3">
                Pattern Recognition
              </h3>
              <p className="text-text-muted">
                Identify patterns in your feed and discover what the algorithm thinks you're interested in.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-bg-page border border-primary-blue/10">
              <div className="w-12 h-12 rounded-full bg-primary-blue/10 flex items-center justify-center mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold text-text-main mb-3">
                Actionable Insights
              </h3>
              <p className="text-text-muted">
                Understand your digital footprint and make informed decisions about your online presence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mid-Page Waitlist Section */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-text-main mb-6">
            Get Early Access
          </h2>
          <p className="text-lg text-text-muted mb-8 max-w-xl mx-auto">
            Join the AlgorithmLens waitlist and we'll notify you as soon as we launch. No spam, just updates.
          </p>

          {/* Waitlist Form #2 - Mid-page */}
          <WaitlistSignup placement="mid-page" />
        </div>
      </section>

      {/* How It Works Preview */}
      <section className="py-20 px-6 bg-bg-page/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-text-main mb-12">
            Simple Process
          </h2>

          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-blue/10 flex items-center justify-center font-bold text-primary-blue">
                1
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-main mb-2">
                  Connect Your Feed
                </h3>
                <p className="text-text-muted text-sm">
                  Securely scan your social media feeds with our browser extension.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-blue/10 flex items-center justify-center font-bold text-primary-blue">
                2
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-main mb-2">
                  Get Analyzed
                </h3>
                <p className="text-text-muted text-sm">
                  Our AI analyzes what algorithms see in your content and feed patterns.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-blue/10 flex items-center justify-center font-bold text-primary-blue">
                3
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-main mb-2">
                  View Insights
                </h3>
                <p className="text-text-muted text-sm">
                  See your personalized dashboard with detailed breakdowns and insights.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Waitlist Section */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-text-main mb-6">
            Ready to See What Algorithms See?
          </h2>
          <p className="text-lg text-text-muted mb-8">
            Join the AlgorithmLens waitlist for early access
          </p>

          {/* Waitlist Form #3 - Footer */}
          <WaitlistSignup placement="footer" />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-bg-page border-t border-primary-blue/10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Logo variant="footer" />
          </div>
          <p className="text-sm text-text-muted font-medium">
            © {new Date().getFullYear()} AlgorithmLens. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ComingSoonHomepage;
