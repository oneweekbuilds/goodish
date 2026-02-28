/**
 * PrivacyPage - Privacy policy for AlgorithmLens
 *
 * Covers:
 * - What data is collected and how it's used
 * - AI processing and consent
 * - Third-party services and integrations
 * - User rights and data deletion
 * - Chrome extension and mobile app specifics
 * - Contact information
 *
 * Last updated: February 2026
 */

import React from 'react';
import { Shield } from 'lucide-react';
import SEO from '../components/SEO';
import BackLink from '../components/ui/BackLink';

export default function PrivacyPage() {
  return (
    <>
      <SEO
        title="Privacy Policy"
        description="Learn how AlgorithmLens collects, uses, and protects your data."
        path="/privacy"
      />
      <div className="min-h-[100dvh] bg-bg-page pt-20 md:pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          {/* Back link */}
          <BackLink to="/" label="Back to home" />

          {/* Header */}
          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary-blue/10 flex items-center justify-center flex-shrink-0">
              <Shield size={24} className="text-primary-blue" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-text-main tracking-tight-heading mb-2">
                Privacy Policy
              </h1>
              <p className="text-text-muted">
                Last updated: February 2026
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-sm max-w-none space-y-8">

            {/* Introduction */}
            <section>
              <p className="text-text-muted leading-relaxed">
                AlgorithmLens ("we," "us," "our," or the "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application, including the Chrome extension, mobile app (iOS/Android), and web dashboard at algorithmlens.com (collectively, the "Service").
              </p>
              <p className="text-text-muted leading-relaxed">
                Please read this Privacy Policy carefully. If you do not agree with our policies and practices, please do not use our Service. By accessing and using AlgorithmLens, you acknowledge that you have read, understood, and agree to be bound by all the provisions of this Privacy Policy.
              </p>
            </section>

            {/* Data Collection */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">1. What Data We Collect</h2>

              <div className="space-y-6">
                {/* Account Information */}
                <div>
                  <h3 className="text-lg font-semibold text-text-main mb-2">Account Information</h3>
                  <p className="text-text-muted leading-relaxed mb-3">
                    When you create an account, we collect:
                  </p>
                  <ul className="space-y-2 text-text-muted">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 mt-1">•</span>
                      <span><strong>Email address</strong> — used for authentication via magic links (no passwords stored)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 mt-1">•</span>
                      <span><strong>Account creation date</strong> — timestamp of when you joined</span>
                    </li>
                  </ul>
                </div>

                {/* Feed Scan Data */}
                <div>
                  <h3 className="text-lg font-semibold text-text-main mb-2">Feed Scan Data</h3>
                  <p className="text-text-muted leading-relaxed mb-3">
                    When you scan your social media feeds (TikTok, Instagram, YouTube, X, Facebook, LinkedIn, Reddit), we collect:
                  </p>
                  <ul className="space-y-2 text-text-muted">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 mt-1">•</span>
                      <span><strong>Feed snapshots</strong> — the DOM content visible on your screen at the time of the scan</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 mt-1">•</span>
                      <span><strong>Content metadata</strong> — post captions, timestamps, engagement metrics, creator information</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 mt-1">•</span>
                      <span><strong>Video/screenshot data</strong> — temporary captures for analysis (deleted after processing)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 mt-1">•</span>
                      <span><strong>Scan metadata</strong> — platform scanned, scan duration, timestamp, number of items analyzed</span>
                    </li>
                  </ul>
                </div>

                {/* Payment Information */}
                <div>
                  <h3 className="text-lg font-semibold text-text-main mb-2">Payment Information</h3>
                  <p className="text-text-muted leading-relaxed mb-3">
                    For users on the Plus tier ($10/month or $96/year), we process payments through Stripe:
                  </p>
                  <ul className="space-y-2 text-text-muted">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 mt-1">•</span>
                      <span><strong>Billing information</strong> — name, email, billing address</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 mt-1">•</span>
                      <span><strong>Payment method</strong> — credit card information (never stored by us; handled entirely by Stripe)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 mt-1">•</span>
                      <span><strong>Subscription status</strong> — plan tier, trial status, renewal dates, payment history</span>
                    </li>
                  </ul>
                </div>

                {/* Device & Usage Data */}
                <div>
                  <h3 className="text-lg font-semibold text-text-main mb-2">Device & Usage Data</h3>
                  <p className="text-text-muted leading-relaxed mb-3">
                    We collect limited usage data to improve the Service:
                  </p>
                  <ul className="space-y-2 text-text-muted">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 mt-1">•</span>
                      <span><strong>Device type</strong> — browser, operating system, app version</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 mt-1">•</span>
                      <span><strong>Usage statistics</strong> — features used, scan frequency, time spent in app</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 mt-1">•</span>
                      <span><strong>Error logs</strong> — crash reports sent to Sentry (PII stripped)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* AI Processing */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">2. AI Processing & Consent</h2>
              <p className="text-text-muted leading-relaxed mb-4">
                AlgorithmLens uses Google Gemini Flash API to analyze feed content for political bias and emotional tone. This analysis is <strong>optional and requires explicit user consent</strong>.
              </p>

              <div className="bg-blue-50 rounded-xl p-5 space-y-3 mb-4 border border-primary-blue/20">
                <p className="text-sm font-semibold text-text-main">What AI Analysis Does</p>
                <ul className="text-sm text-text-muted space-y-2">
                  <li>• Classifies content by political perspective (left, center, right)</li>
                  <li>• Analyzes emotional tone (positive, neutral, negative)</li>
                  <li>• Powers the Politics and Tone tabs on your dashboard</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-xl p-5 space-y-3 border border-border-light">
                <p className="text-sm font-semibold text-text-main">What AI Analysis Does NOT Do</p>
                <ul className="text-sm text-text-muted space-y-2">
                  <li>• Your scan data is never used to train Google's models</li>
                  <li>• We do not sell your data to train third-party AI systems</li>
                  <li>• Analysis results are observational classifications, not definitive claims about reality</li>
                  <li>• You can disable AI analysis anytime in Settings (basic metrics still work)</li>
                </ul>
              </div>

              <p className="text-text-muted leading-relaxed mt-4 text-sm">
                When AI analysis is enabled, feed content is sent to Google's servers for processing. We recommend reviewing Google's privacy policies for their data handling practices. Disabling AI analysis in Settings prevents any data from being sent to external AI providers.
              </p>
            </section>

            {/* Data Use */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">3. How We Use Your Data</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-text-main mb-2">Scan Analysis</h3>
                  <p className="text-text-muted leading-relaxed">
                    We process your feed snapshots to generate analytics: ad detection, political classification, tone analysis, and platform insights visible on your dashboard.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">Authentication & Account Management</h3>
                  <p className="text-text-muted leading-relaxed">
                    Your email is used to sign you in via secure magic links and manage your account.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">Payment Processing</h3>
                  <p className="text-text-muted leading-relaxed">
                    Billing information is used to process subscriptions via Stripe and manage your subscription status.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">Service Improvement</h3>
                  <p className="text-text-muted leading-relaxed">
                    Usage data and error logs help us fix bugs, improve performance, and develop new features.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">Communication</h3>
                  <p className="text-text-muted leading-relaxed">
                    We may send you transactional emails (account verification, subscription confirmations, billing updates). We do not send marketing emails without consent.
                  </p>
                </div>
              </div>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">4. Data Retention & Deletion</h2>

              <div className="space-y-4 text-text-muted leading-relaxed">
                <p>
                  <strong>Scan Data:</strong> Your feed snapshots and analysis results are retained in your account for review. You can manually delete scans from your History page anytime.
                </p>

                <p>
                  <strong>Video/Screenshot Files:</strong> Temporary video and screenshot captures are automatically deleted from our servers within 24 hours after processing, regardless of whether you keep the scan data.
                </p>

                <p>
                  <strong>Account Deletion:</strong> You can delete your account anytime in Settings. Account deletion is immediate and permanent. All associated scan data is deleted within 30 days.
                </p>

                <p>
                  <strong>Error Logs:</strong> Sentry error logs are retained for 30 days, then automatically deleted.
                </p>

                <p>
                  <strong>Subscription Data:</strong> After account deletion, Stripe retains billing information per their standard retention policy for regulatory and tax compliance.
                </p>
              </div>
            </section>

            {/* Third-Party Services */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">5. Third-Party Services</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-text-main mb-2">Supabase (Authentication & Database)</h3>
                  <p className="text-text-muted leading-relaxed mb-2">
                    Your email, account data, and scan data are stored on Supabase (hosted on AWS in US-East region).
                  </p>
                  <p className="text-sm text-text-muted italic">
                    <a href="https://supabase.com/privacy" className="text-primary-blue hover:underline">Supabase Privacy Policy</a>
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">Stripe (Payment Processing)</h3>
                  <p className="text-text-muted leading-relaxed mb-2">
                    Billing information and payment methods are processed by Stripe. AlgorithmLens does not store credit card data.
                  </p>
                  <p className="text-sm text-text-muted italic">
                    <a href="https://stripe.com/privacy" className="text-primary-blue hover:underline">Stripe Privacy Policy</a>
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">Google Gemini Flash (AI Analysis)</h3>
                  <p className="text-text-muted leading-relaxed mb-2">
                    When you enable AI analysis, feed content is sent to Google's API for content classification. This is optional and can be disabled anytime.
                  </p>
                  <p className="text-sm text-text-muted italic">
                    <a href="https://policies.google.com/privacy" className="text-primary-blue hover:underline">Google Privacy Policy</a>
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">Sentry (Error Tracking)</h3>
                  <p className="text-text-muted leading-relaxed mb-2">
                    Crash logs and error reports are sent to Sentry with PII stripped. This helps us identify and fix bugs.
                  </p>
                  <p className="text-sm text-text-muted italic">
                    <a href="https://sentry.io/privacy/" className="text-primary-blue hover:underline">Sentry Privacy Policy</a>
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">Vercel (Hosting)</h3>
                  <p className="text-text-muted leading-relaxed mb-2">
                    The AlgorithmLens web dashboard is hosted on Vercel.
                  </p>
                  <p className="text-sm text-text-muted italic">
                    <a href="https://vercel.com/privacy" className="text-primary-blue hover:underline">Vercel Privacy Policy</a>
                  </p>
                </div>
              </div>
            </section>

            {/* Chrome Extension */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">6. Chrome Extension Permissions</h2>

              <p className="text-text-muted leading-relaxed mb-4">
                The AlgorithmLens Chrome extension requests certain permissions to function. Here's what each one does:
              </p>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-text-main mb-2">activeTab & scripting</h3>
                  <p className="text-text-muted leading-relaxed">
                    Allows the extension to access the DOM of the social media page you're currently viewing to capture feed content for scanning.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">storage</h3>
                  <p className="text-text-muted leading-relaxed">
                    Stores your preferences (default scan duration, platform preferences) locally on your device.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">identity & identity.email</h3>
                  <p className="text-text-muted leading-relaxed">
                    Used for authenticating your account when logging in via the extension.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">host permissions</h3>
                  <p className="text-text-muted leading-relaxed">
                    Allows the extension to run on tiktok.com, instagram.com, youtube.com, x.com, facebook.com, linkedin.com, and reddit.com — the platforms AlgorithmLens supports.
                  </p>
                </div>
              </div>

              <p className="text-text-muted leading-relaxed mt-4">
                The extension does not track your browsing on other websites or sell your browsing data.
              </p>
            </section>

            {/* Mobile App */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">7. Mobile App Data Access</h2>

              <p className="text-text-muted leading-relaxed mb-4">
                The iOS and Android mobile apps use WebView to access social media feeds within the app:
              </p>

              <ul className="space-y-3 text-text-muted">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span><strong>Camera/Photo Library:</strong> Only requested if you choose to upload a screenshot for analysis.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span><strong>Network Access:</strong> Needed to load social media feeds and communicate with our servers.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span><strong>Local Storage:</strong> Preferences and scan history cached on your device.</span>
                </li>
              </ul>
            </section>

            {/* Cookies & Local Storage */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">8. Cookies & Local Storage</h2>

              <p className="text-text-muted leading-relaxed mb-4">
                AlgorithmLens uses minimal client-side storage:
              </p>

              <ul className="space-y-3 text-text-muted">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span><strong>Authentication tokens:</strong> Stored locally to keep you logged in between sessions.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span><strong>Preferences:</strong> Your scan settings and AI analysis consent are stored locally.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span><strong>No third-party tracking cookies:</strong> We do not use Google Analytics, Facebook Pixel, or other tracking pixels.</span>
                </li>
              </ul>
            </section>

            {/* User Rights */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">9. Your Privacy Rights</h2>

              <p className="text-text-muted leading-relaxed mb-4">
                Depending on your jurisdiction, you may have the following rights:
              </p>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-text-main mb-2">Right to Access</h3>
                  <p className="text-text-muted leading-relaxed">
                    You can access all your scan data from your dashboard. You can also request a complete data export in your Settings (JSON or CSV format).
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">Right to Delete</h3>
                  <p className="text-text-muted leading-relaxed">
                    You can delete individual scans, or delete your entire account and associated data anytime in Settings.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">Right to Opt-Out</h3>
                  <p className="text-text-muted leading-relaxed">
                    You can disable AI analysis anytime, preventing any feed data from being sent to Google Gemini.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">Right to Rectification</h3>
                  <p className="text-text-muted leading-relaxed">
                    You can update your email address and account information anytime.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">GDPR & CCPA Rights</h3>
                  <p className="text-text-muted leading-relaxed">
                    If you are a resident of the EU, UK, or California, you have additional rights under GDPR, GDPR UK, and CCPA. Contact us through the AlgorithmLens website to exercise these rights.
                  </p>
                </div>
              </div>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">10. Data Sharing & Sale</h2>

              <p className="text-text-muted leading-relaxed mb-4">
                <strong>We do not sell your data to third parties.</strong>
              </p>

              <p className="text-text-muted leading-relaxed mb-4">
                Your scan data is shared with the following third parties only as necessary to operate the Service:
              </p>

              <ul className="space-y-3 text-text-muted">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span><strong>Supabase:</strong> Stores your account and scan data (data processor)</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span><strong>Stripe:</strong> Processes payments for Plus tier (data processor)</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span><strong>Google Gemini:</strong> Analyzes feed content only if you enable AI analysis (data processor)</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span><strong>Sentry:</strong> Receives error logs with PII stripped for debugging (data processor)</span>
                </li>
              </ul>

              <p className="text-text-muted leading-relaxed mt-4">
                We require all data processors to maintain strict confidentiality and use data only for the purposes specified.
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">11. Children's Privacy</h2>

              <p className="text-text-muted leading-relaxed">
                AlgorithmLens is not intended for children under 13 years old. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will delete such information and terminate the child's account. If you believe we have collected information from a child under 13, please contact us immediately through the AlgorithmLens website.
              </p>
            </section>

            {/* Security */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">12. Security</h2>

              <p className="text-text-muted leading-relaxed mb-4">
                We implement industry-standard security measures to protect your data:
              </p>

              <ul className="space-y-3 text-text-muted">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span><strong>HTTPS encryption:</strong> All communication between your device and our servers is encrypted in transit</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span><strong>Database encryption:</strong> Data at rest is encrypted on Supabase servers</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span><strong>No passwords:</strong> Magic link authentication eliminates password-related security risks</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span><strong>Access controls:</strong> Only you can access your data; administrators do not have automatic access</span>
                </li>
              </ul>

              <p className="text-text-muted leading-relaxed mt-4">
                While we strive to use reasonable security measures, no system is completely secure. We cannot guarantee absolute security of your data.
              </p>
            </section>

            {/* Changes to Policy */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">13. Changes to This Privacy Policy</h2>

              <p className="text-text-muted leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the updated policy here and updating the "Last updated" date. Your continued use of AlgorithmLens after such changes constitutes your acceptance of the updated Privacy Policy. We encourage you to review this Privacy Policy periodically to stay informed about how we protect your data.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">14. Contact Us</h2>

              <p className="text-text-muted leading-relaxed mb-4">
                If you have any questions about this Privacy Policy or our privacy practices, please contact us:
              </p>

              <div className="bg-gray-50 rounded-xl p-5 border border-border-light">
                <p className="text-text-muted text-sm">
                  For privacy, legal, or general support inquiries, please contact us through the AlgorithmLens website.
                </p>
              </div>

              <p className="text-text-muted leading-relaxed mt-4 text-sm">
                Built by Justin at Goodish to increase human agency and transparency around algorithmic content curation.
              </p>
            </section>

          </div>
        </div>
      </div>
    </>
  );
}
