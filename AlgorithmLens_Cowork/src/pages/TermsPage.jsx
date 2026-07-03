/**
 * TermsPage - Terms of service for AlgorithmLens
 *
 * Mirrors the mobile app's legal terms (mobile/legal/TERMS_OF_SERVICE.md).
 * If that document changes, this page must change with it.
 *
 * Covers:
 * - What AlgorithmLens does and eligibility
 * - Accounts and acceptable use
 * - Screen recording and consent
 * - AI analysis disclaimer
 * - Pricing (the app is free)
 * - Intellectual property, liability, indemnification
 * - Termination, third-party services, governing law
 *
 * Last updated: July 2026
 */

import React from 'react';
import { FileText } from 'lucide-react';
import SEO from '../components/SEO';
import BackLink from '../components/ui/BackLink';

export default function TermsPage() {
  return (
    <>
      <SEO
        title="Terms of service"
        description="The terms that govern your use of the AlgorithmLens app and website."
        path="/terms"
      />
      <div className="min-h-screen bg-bg-page pt-20 md:pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          {/* Back link */}
          <BackLink to="/" label="Back to home" />

          {/* Header */}
          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary-blue/10 flex items-center justify-center flex-shrink-0">
              <FileText size={24} className="text-primary-blue" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-text-main tracking-tight-heading mb-2">
                Terms of service
              </h1>
              <p className="text-text-muted">
                Last updated: July 2026
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-sm max-w-none space-y-8">

            {/* Introduction */}
            <section>
              <p className="text-text-muted leading-relaxed">
                Welcome to AlgorithmLens. These Terms of Service ("Terms") govern your use of the AlgorithmLens mobile application (the "App") and the algorithmlens.com website, operated by AlgorithmLens ("we," "us," or "our"). By creating an account or using the App, you agree to these Terms. If you do not agree, do not use the App.
              </p>
              <p className="text-text-muted leading-relaxed">
                These Terms match the terms shown inside the App; if you find a difference between the two, tell us and we will correct it.
              </p>
            </section>

            {/* What AlgorithmLens Does */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">1. What AlgorithmLens does</h2>

              <p className="text-text-muted leading-relaxed mb-4">
                AlgorithmLens is a tool that captures screenshots of your social media feed, uses AI to analyze the content, and presents you with a breakdown of what is in your feed (ads, political content, entertainment, and so on). The App uses Google's Gemini AI to perform this analysis.
              </p>

              <p className="text-text-muted leading-relaxed">
                <strong>AlgorithmLens is an informational tool.</strong> It provides AI-generated analysis of your social media feed for your personal insight and awareness. It is not a content moderation tool, fact-checker, mental health service, or professional advisory tool.
              </p>
            </section>

            {/* Eligibility */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">2. Eligibility</h2>

              <p className="text-text-muted leading-relaxed">
                You must be at least 13 years old (or 16 in the European Economic Area) to use AlgorithmLens. By using the App, you represent that you meet this age requirement. If we learn that a user is under the required age, we will terminate their account and delete their data.
              </p>
            </section>

            {/* Your Account */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">3. Your account</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-text-main mb-2">Account creation</h3>
                  <p className="text-text-muted leading-relaxed">
                    You can create an account using Google sign-in, Apple sign-in, or email and password. You are responsible for maintaining the security of your account credentials and for all activity that occurs under your account.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">One account per person</h3>
                  <p className="text-text-muted leading-relaxed">
                    Each account is for a single individual. Do not share your account credentials with others or create multiple accounts.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">Account security</h3>
                  <p className="text-text-muted leading-relaxed">
                    If you believe your account has been compromised, contact us immediately at support@algorithmlens.com. We are not liable for losses resulting from unauthorized use of your account.
                  </p>
                </div>
              </div>
            </section>

            {/* Acceptable Use */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">4. Acceptable use</h2>

              <p className="text-text-muted leading-relaxed mb-4">
                You agree to use AlgorithmLens only for its intended purpose: analyzing your own social media feeds for personal insight. You agree not to:
              </p>

              <ul className="space-y-3 text-text-muted">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span><strong>Use the App to monitor, surveil, or stalk other people.</strong> AlgorithmLens is for analyzing your own feed, not for tracking what other people post or consume</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span><strong>Scan content that you do not have the right to view.</strong> Only scan feeds from accounts you own or have legitimate access to</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span><strong>Attempt to extract, reverse-engineer, or abuse the AI analysis system,</strong> including sending crafted content designed to produce specific outputs, or using analysis results for automated decision-making about other people</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span><strong>Abuse the API or backend systems.</strong> Do not attempt to circumvent rate limits, overload our servers, reverse-engineer our APIs, extract API keys, or interfere with the App's infrastructure</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span><strong>Use the App for any illegal purpose,</strong> including violating privacy laws, intellectual property rights, or platform terms of service</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span><strong>Redistribute, resell, or commercially exploit</strong> the App, its analysis results, or any underlying technology without our written permission</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span><strong>Attempt to access other users' data.</strong> Our systems restrict each user to their own data. Attempting to access, modify, or delete another user's data is a violation of these Terms and may be a criminal offense</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span><strong>Use the App to generate datasets</strong> of social media content or creator information for commercial use, research, or any purpose beyond personal insight</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span><strong>Misrepresent the App's analysis results as definitive facts.</strong> AI analysis is approximate and should not be cited as authoritative classification of content</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span><strong>Publicly share analysis results in a way that defames or harms specific content creators.</strong> The App's AI classifications (for example, labeling content as "political" or "ad") may be inaccurate. Publicly attributing these AI-generated labels to specific creators as established fact could be harmful and may expose you to legal liability</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span><strong>Use the App in a way that violates the terms of service of the social media platforms you scan.</strong> You are solely responsible for your compliance with third-party platform terms</span>
                </li>
              </ul>
            </section>

            {/* Screen Recording and Consent */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">5. Screen recording and consent</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-text-main mb-2">Your device, your responsibility</h3>
                  <p className="text-text-muted leading-relaxed mb-3">
                    When you initiate a scan, the App captures screenshots of your device's screen. You are responsible for ensuring that:
                  </p>
                  <ul className="space-y-2 text-text-muted">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 mt-1">•</span>
                      <span>You have closed any apps or notifications containing sensitive information (banking, medical, passwords, private messages) before starting a scan</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 mt-1">•</span>
                      <span>You are not capturing content that you do not have the right to access or record</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 mt-1">•</span>
                      <span>You are not capturing other people's personal information without their consent</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 mt-1">•</span>
                      <span>You understand that if your screen recording captures illegal content, we may be legally obligated to report it to the appropriate authorities and may terminate your account immediately</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">System permissions</h3>
                  <p className="text-text-muted leading-relaxed">
                    Screen recording requires explicit system-level permission from your device. We cannot and do not capture your screen without this permission. You can revoke this permission at any time through your device settings.
                  </p>
                </div>
              </div>
            </section>

            {/* AI Analysis Disclaimer */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">6. AI analysis disclaimer</h2>

              <p className="text-text-muted leading-relaxed mb-4">
                <strong>This is important: the AI analysis provided by AlgorithmLens is not guaranteed to be accurate, complete, or reliable.</strong>
              </p>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-text-main mb-2">No guarantee of accuracy</h3>
                  <p className="text-text-muted leading-relaxed mb-3">
                    AlgorithmLens uses Google's Gemini AI to analyze screenshot content. AI systems can and do make mistakes. Specifically:
                  </p>
                  <ul className="space-y-2 text-text-muted">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 mt-1">•</span>
                      <span>Posts may be miscategorized (for example, a genuine post labeled as an ad, or an ad not detected)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 mt-1">•</span>
                      <span>Political classification may be inaccurate or reflect biases in the AI model</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 mt-1">•</span>
                      <span>Creator names, handles, or post text may be incorrectly extracted</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 mt-1">•</span>
                      <span>Content categorization is based on the AI's interpretation and may differ from your own</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 mt-1">•</span>
                      <span>Wellbeing assessments are approximate and should not be treated as professional health advice</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">Not professional advice</h3>
                  <p className="text-text-muted leading-relaxed">
                    AlgorithmLens does not provide legal advice, medical or mental health advice, financial advice, fact-checking or content verification, or professional content moderation. Do not make important decisions based solely on AlgorithmLens analysis results.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">AI limitations</h3>
                  <p className="text-text-muted leading-relaxed">
                    The AI analysis may be affected by image quality, screen layout variations, language limitations, rapidly changing social media interfaces, and adversarial content designed to manipulate AI systems. We continually work to improve accuracy but cannot guarantee specific performance levels.
                  </p>
                </div>
              </div>
            </section>

            {/* Pricing */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">7. Pricing</h2>

              <p className="text-text-muted leading-relaxed">
                AlgorithmLens is currently free to use. It does not offer subscriptions, paid tiers, or in-app purchases, and it does not process payments. If paid features are introduced in the future, these Terms will be updated with the applicable pricing and payment terms before any charges apply.
              </p>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">8. Intellectual property</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-text-main mb-2">Our rights</h3>
                  <p className="text-text-muted leading-relaxed">
                    The AlgorithmLens App, including its code, design, AI prompts, analysis methodologies, branding, and documentation, is owned by AlgorithmLens and protected by intellectual property laws. These Terms do not grant you any rights to our intellectual property beyond the limited license to use the App as described here.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">Your rights</h3>
                  <p className="text-text-muted leading-relaxed">
                    You retain ownership of your scan results and any data derived from your personal use of the App. We do not claim ownership of your content or analysis results.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">License to use the App</h3>
                  <p className="text-text-muted leading-relaxed">
                    We grant you a limited, non-exclusive, non-transferable, revocable license to use the App for personal, non-commercial purposes in accordance with these Terms.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">Feedback</h3>
                  <p className="text-text-muted leading-relaxed">
                    If you provide us with feedback, suggestions, or ideas about the App, you grant us the right to use that feedback without obligation to you.
                  </p>
                </div>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">9. Limitation of liability</h2>

              <p className="text-text-muted leading-relaxed mb-4">
                To the maximum extent permitted by applicable law:
              </p>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-text-main mb-2">No warranty</h3>
                  <p className="text-text-muted leading-relaxed">
                    The App is provided "as is" and "as available" without warranties of any kind, whether express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, accuracy, or non-infringement.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">Limitation of damages</h3>
                  <p className="text-text-muted leading-relaxed mb-3">
                    In no event shall AlgorithmLens, its officers, employees, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, or goodwill, arising out of or related to your use of the App, regardless of the theory of liability. This includes, without limitation, damages arising from:
                  </p>
                  <ul className="space-y-2 text-text-muted">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 mt-1">•</span>
                      <span>Inaccurate or incomplete AI analysis results</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 mt-1">•</span>
                      <span>Decisions you make based on the App's analysis</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 mt-1">•</span>
                      <span>Unauthorized access to your account due to your failure to secure your credentials</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 mt-1">•</span>
                      <span>Temporary unavailability of the App or its features</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 mt-1">•</span>
                      <span>Actions taken by third-party services (Google, Supabase, Sentry)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 mt-1">•</span>
                      <span>Sensitive content incidentally captured during screen recording</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 mt-1">•</span>
                      <span>Data breaches caused by third-party service providers</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">Maximum liability</h3>
                  <p className="text-text-muted leading-relaxed">
                    Our total liability to you for any claims arising from your use of the App shall not exceed the amount you paid us in the 12 months preceding the claim, or $50 USD, whichever is greater.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">Exceptions</h3>
                  <p className="text-text-muted leading-relaxed">
                    Some jurisdictions do not allow the exclusion or limitation of certain warranties or liabilities. In those jurisdictions, our liability is limited to the greatest extent permitted by law.
                  </p>
                </div>
              </div>
            </section>

            {/* Indemnification */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">10. Indemnification</h2>

              <p className="text-text-muted leading-relaxed">
                You agree to indemnify and hold harmless AlgorithmLens and its officers, employees, and affiliates from any claims, losses, damages, liabilities, and expenses (including reasonable legal fees) arising from your use of the App, your violation of these Terms, your violation of any third party's rights, or any content captured through your use of the screen recording feature.
              </p>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">11. Account suspension and termination</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-text-main mb-2">By you</h3>
                  <p className="text-text-muted leading-relaxed">
                    You may request deletion of your account at any time using the account deletion option in the App's settings (when available) or by contacting support@algorithmlens.com. Your account data, scan results, and profile information are then deleted from our servers.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">By us</h3>
                  <p className="text-text-muted leading-relaxed">
                    We may suspend or terminate your account if you violate these Terms, abuse the App's systems or infrastructure, use the App for illegal purposes, or engage in activity that harms other users or our service. We will make reasonable efforts to notify you before termination, except where immediate action is necessary to protect our systems or other users.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">Effect of termination</h3>
                  <p className="text-text-muted leading-relaxed">
                    Upon termination, your license to use the App is revoked, your access to your account and scan history ends, and we will delete your data in accordance with our Privacy Policy. The AI analysis disclaimer, limitation of liability, indemnification, and governing law sections survive termination.
                  </p>
                </div>
              </div>
            </section>

            {/* Third-Party Services */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">12. Third-party services</h2>

              <p className="text-text-muted leading-relaxed">
                AlgorithmLens relies on third-party services (Google Gemini, Supabase, Sentry). We are not responsible for the availability, performance, or policies of these services. Your use of these third-party services is subject to their respective terms and privacy policies. If a third-party service experiences downtime, changes its terms, or discontinues service, we will make reasonable efforts to find alternatives but are not liable for disruptions this may cause.
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">13. Governing law and disputes</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-text-main mb-2">Governing law</h3>
                  <p className="text-text-muted leading-relaxed">
                    These Terms are governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to conflict of law principles.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">Dispute resolution</h3>
                  <p className="text-text-muted leading-relaxed">
                    Any disputes arising from these Terms or your use of the App shall first be attempted to be resolved through good-faith negotiation. If negotiation fails, disputes shall be resolved through binding arbitration administered by the American Arbitration Association (AAA) under its Consumer Arbitration Rules. Arbitration shall take place in Delaware or, at your election, via video conference.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">Class action waiver</h3>
                  <p className="text-text-muted leading-relaxed">
                    You agree to resolve disputes with us on an individual basis. You waive the right to participate in a class action, class arbitration, or any other representative proceeding.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">Small claims exception</h3>
                  <p className="text-text-muted leading-relaxed">
                    Either party may bring qualifying claims in small claims court.
                  </p>
                </div>
              </div>
            </section>

            {/* Service Availability */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">14. Service availability</h2>

              <p className="text-text-muted leading-relaxed">
                AlgorithmLens is provided on an "as available" basis. We do not guarantee uninterrupted or error-free service. The App may be temporarily unavailable due to maintenance, updates, third-party service outages, changes to social media platform interfaces that affect scanning, or circumstances beyond our reasonable control. We will make reasonable efforts to restore service promptly but are not liable for any losses caused by service interruptions.
              </p>
            </section>

            {/* General Provisions */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">15. General provisions</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-text-main mb-2">Entire agreement</h3>
                  <p className="text-text-muted leading-relaxed">
                    These Terms, together with our Privacy Policy, constitute the entire agreement between you and AlgorithmLens regarding the App.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">Severability</h3>
                  <p className="text-text-muted leading-relaxed">
                    If any provision of these Terms is found to be unenforceable, the remaining provisions remain in full effect.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">Waiver</h3>
                  <p className="text-text-muted leading-relaxed">
                    Our failure to enforce any right or provision of these Terms does not constitute a waiver of that right or provision.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">Assignment</h3>
                  <p className="text-text-muted leading-relaxed">
                    You may not assign or transfer your rights under these Terms without our consent. We may assign our rights without restriction.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">Modifications</h3>
                  <p className="text-text-muted leading-relaxed">
                    We may update these Terms from time to time. We will notify you of material changes via in-app notification or email at least 30 days before the changes take effect. Your continued use of the App after changes become effective constitutes acceptance of the updated Terms.
                  </p>
                </div>
              </div>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">16. Contact us</h2>

              <p className="text-text-muted leading-relaxed mb-4">
                If you have questions about these Terms, contact us:
              </p>

              <div className="bg-gray-50 rounded-xl p-5 border border-border-light">
                <p className="text-text-muted text-sm">
                  <strong>Email:</strong> support@algorithmlens.com
                </p>
              </div>

              <p className="text-text-muted leading-relaxed mt-4 text-sm">
                Built by Justin at Goodish to increase human agency and transparency around algorithmic content curation.
              </p>
            </section>

            {/* Acceptance */}
            <section>
              <div className="bg-blue-50 rounded-xl p-5 border border-primary-blue/20">
                <p className="text-sm text-text-main">
                  By using AlgorithmLens, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree, please do not use the App.
                </p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </>
  );
}
