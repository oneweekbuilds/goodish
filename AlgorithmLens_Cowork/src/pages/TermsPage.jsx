/**
 * TermsPage - Terms of Service for AlgorithmLens
 *
 * Covers:
 * - Acceptance of terms
 * - Description of service
 * - User accounts and responsibilities
 * - Acceptable use
 * - Intellectual property
 * - Payment terms and billing
 * - Free trial terms
 * - Limitation of liability
 * - Disclaimer of warranties
 * - Termination
 * - Changes to terms
 * - Governing law
 *
 * Last updated: February 2026
 */

import React from 'react';
import { FileText } from 'lucide-react';
import SEO from '../components/SEO';
import BackLink from '../components/ui/BackLink';

export default function TermsPage() {
  return (
    <>
      <SEO
        title="Terms of Service"
        description="Read AlgorithmLens Terms of Service for information about service usage, billing, and legal terms."
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
                Terms of Service
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
                These Terms of Service ("Terms") constitute a legal agreement between you ("User" or "you") and AlgorithmLens, operated by Goodish ("Company," "we," "us," or "our"). These Terms govern your access to and use of the AlgorithmLens service, including the Chrome extension, mobile applications (iOS/Android), and web dashboard at algorithmlens.com (collectively, the "Service").
              </p>
              <p className="text-text-muted leading-relaxed">
                By accessing, installing, or using AlgorithmLens in any way, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree with any provision of these Terms, you must not use the Service. We recommend that you save or print a copy of these Terms for your records.
              </p>
            </section>

            {/* Acceptance of Terms */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">1. Acceptance of Terms</h2>

              <p className="text-text-muted leading-relaxed mb-3">
                By using AlgorithmLens, you represent and warrant that:
              </p>

              <ul className="space-y-3 text-text-muted">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span>You are at least 13 years old (or the minimum age of digital consent in your jurisdiction)</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span>You have the legal capacity to enter into a binding contract</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span>You are not prohibited from using the Service under applicable law</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span>You will comply with all applicable laws and regulations in your jurisdiction</span>
                </li>
              </ul>
            </section>

            {/* Service Description */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">2. Service Description</h2>

              <p className="text-text-muted leading-relaxed mb-4">
                AlgorithmLens is a feed analysis tool that scans your social media feeds (TikTok, Instagram, YouTube, X, Facebook, LinkedIn, Reddit) and provides analytics about content distribution, ad prevalence, political bias, and emotional tone in your feed. The Service includes:
              </p>

              <ul className="space-y-3 text-text-muted">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span><strong>Chrome Extension:</strong> Captures feed content when you run a scan</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span><strong>Mobile Apps:</strong> iOS and Android applications for scanning on mobile</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span><strong>Web Dashboard:</strong> Displays your scan history, analytics, and insights</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span><strong>AI Analysis (optional):</strong> Uses Google Gemini to classify content, requires user consent</span>
                </li>
              </ul>

              <p className="text-text-muted leading-relaxed mt-4">
                AlgorithmLens is provided on an "as-is" basis. We make no guarantee that the Service will be available at all times or free from interruptions, errors, or security vulnerabilities.
              </p>
            </section>

            {/* User Accounts */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">3. User Accounts & Responsibilities</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-text-main mb-2">Account Creation</h3>
                  <p className="text-text-muted leading-relaxed">
                    To use AlgorithmLens, you must create an account using your email address. You will receive a magic link via email to authenticate — no password is required. You are responsible for maintaining the confidentiality and security of your email account.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">Account Information</h3>
                  <p className="text-text-muted leading-relaxed">
                    You are responsible for providing accurate, current, and complete information during account creation and maintaining this information. You agree to notify us immediately of any unauthorized use of your account or any breach of security.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">Account Security</h3>
                  <p className="text-text-muted leading-relaxed">
                    You are solely responsible for all activities that occur under your account. While AlgorithmLens uses magic link authentication (no passwords), you are responsible for protecting access to your email account. If you believe your account has been compromised, contact us immediately through the AlgorithmLens website.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">Account Termination</h3>
                  <p className="text-text-muted leading-relaxed">
                    You may delete your account anytime in Settings. Upon deletion, all personal data is deleted (scan data deleted within 30 days). Deletion is permanent and cannot be undone.
                  </p>
                </div>
              </div>
            </section>

            {/* Acceptable Use */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">4. Acceptable Use</h2>

              <p className="text-text-muted leading-relaxed mb-4">
                You agree to use AlgorithmLens only for lawful purposes and in a way that does not infringe upon the rights of others or restrict their use and enjoyment of the Service. Specifically, you agree not to:
              </p>

              <ul className="space-y-3 text-text-muted">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span>Attempt to reverse-engineer, decompile, or discover the source code or algorithms of AlgorithmLens</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span>Use the Service to scrape, harvest, or collect data from social media platforms in violation of their terms of service</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span>Use automated scripts, bots, or tools to access the Service (except for the official extensions and apps)</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span>Attempt to gain unauthorized access to AlgorithmLens systems or other users' data</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span>Use the Service to transmit viruses, malware, or harmful code</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span>Harass, threaten, or defame other users or third parties through AlgorithmLens</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span>Use the Service for any illegal activity or in violation of any applicable law or regulation</span>
                </li>
              </ul>

              <p className="text-text-muted leading-relaxed mt-4">
                We reserve the right to investigate violations and suspend or terminate your account if we determine that you have violated these Terms.
              </p>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">5. Intellectual Property Rights</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-text-main mb-2">Company IP</h3>
                  <p className="text-text-muted leading-relaxed">
                    The AlgorithmLens Service, including all software, code, designs, graphics, logos, trademarks, and content created by or for AlgorithmLens, are the exclusive property of Goodish and protected by copyright, trademark, and patent laws. You do not own, and we do not transfer to you, any right, title, or interest in or to the Service or any content therein.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">License Grant</h3>
                  <p className="text-text-muted leading-relaxed">
                    We grant you a limited, non-exclusive, non-transferable, revocable license to access and use AlgorithmLens solely for your personal, non-commercial use, subject to these Terms.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">Your Content</h3>
                  <p className="text-text-muted leading-relaxed">
                    Any data or information you provide to AlgorithmLens (account information, scan requests, feedback) remains your property. However, by providing such information, you grant us a non-exclusive, worldwide, royalty-free license to use it for operating and improving the Service.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">Third-Party Content</h3>
                  <p className="text-text-muted leading-relaxed">
                    Feed content from social media platforms (posts, videos, images) is owned by their respective creators and platforms. AlgorithmLens does not claim ownership of such content. Our analysis of this content for your personal use falls under fair use.
                  </p>
                </div>
              </div>
            </section>

            {/* Payment & Billing */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">6. Payment Terms & Billing</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-text-main mb-2">Free Plan</h3>
                  <p className="text-text-muted leading-relaxed">
                    AlgorithmLens offers a free tier that includes basic scanning and analytics features. Free accounts are limited to basic metrics and do not include advanced features like longitudinal trend analysis.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">Plus Tier Pricing</h3>
                  <p className="text-text-muted leading-relaxed">
                    The Plus tier provides access to all premium features including longitudinal trend analysis. Pricing is:
                  </p>
                  <ul className="space-y-2 text-text-muted mt-2">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0">•</span>
                      <span><strong>Monthly:</strong> $10/month (billed monthly)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0">•</span>
                      <span><strong>Annual:</strong> $96/year (billed annually, saves $24)</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">Billing Process</h3>
                  <p className="text-text-muted leading-relaxed">
                    Payments are processed by Stripe, our third-party payment processor. You authorize us to charge the payment method you provide for the subscription plan you select. All prices are in USD unless otherwise specified.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">Recurring Billing</h3>
                  <p className="text-text-muted leading-relaxed">
                    By subscribing to Plus, you authorize recurring charges on your payment method on the billing date you select (monthly or annually). Billing will continue until you cancel your subscription. You can cancel anytime through the Billing Portal in Settings.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">Payment Method</h3>
                  <p className="text-text-muted leading-relaxed">
                    You are responsible for ensuring that your payment method is valid and current. If a payment fails, we will attempt to retry per Stripe's standard retry policy. If payment ultimately fails, we may suspend your account until payment is received.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">Refunds</h3>
                  <p className="text-text-muted leading-relaxed">
                    Subscriptions are non-refundable. However, if you cancel your subscription during a billing cycle, you retain access to Plus features through the end of that cycle. If you are on a free trial and convert to a paid subscription, no refund is available. For billing errors or disputes, contact us through the AlgorithmLens website.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">Price Changes</h3>
                  <p className="text-text-muted leading-relaxed">
                    We may change our pricing at any time. Price changes will not apply to active subscriptions until the next renewal date. We will notify you of price changes at least 30 days in advance via email.
                  </p>
                </div>
              </div>
            </section>

            {/* Free Trial */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">7. Free Trial Terms</h2>

              <p className="text-text-muted leading-relaxed mb-4">
                AlgorithmLens offers a 14-day free trial of the Plus tier for eligible users. Free trial terms:
              </p>

              <ul className="space-y-3 text-text-muted">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span>You must provide a valid payment method to start the trial</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span>At the end of the 14-day trial, your account will convert to a paid subscription unless you cancel</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span>You will be charged the subscription price ($10/month or $96/year based on your selection)</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span>You may cancel anytime during the trial without charge</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span>Only one free trial per user account</span>
                </li>
              </ul>

              <p className="text-text-muted leading-relaxed mt-4">
                You can manage or cancel your trial subscription anytime in Settings by accessing the Billing Portal.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">8. Limitation of Liability</h2>

              <p className="text-text-muted leading-relaxed mb-4">
                <strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW,</strong> ALGORITHMLENS AND GOODISH SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO DAMAGES FOR LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
              </p>

              <p className="text-text-muted leading-relaxed mb-4">
                IN NO EVENT SHALL ALGORITHMLENS' TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATING TO THESE TERMS OR YOUR USE OF THE SERVICE EXCEED THE TOTAL AMOUNT YOU HAVE PAID TO US IN THE 12 MONTHS IMMEDIATELY PRECEDING THE CLAIM, OR IF YOU HAVE NOT PAID US ANYTHING, USD $100.
              </p>

              <p className="text-text-muted leading-relaxed">
                Some jurisdictions do not allow the exclusion of liability for certain damages, so some of these limitations may not apply to you.
              </p>
            </section>

            {/* Warranty Disclaimer */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">9. Disclaimer of Warranties</h2>

              <p className="text-text-muted leading-relaxed mb-4">
                <strong>THE SERVICE IS PROVIDED ON AN "AS-IS" AND "AS-AVAILABLE" BASIS</strong> WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
              </p>

              <p className="text-text-muted leading-relaxed mb-4">
                AlgorithmLens does not warrant that:
              </p>

              <ul className="space-y-3 text-text-muted mb-4">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span>The Service will be uninterrupted, secure, or error-free</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span>Any defects will be corrected</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span>AI analysis results are definitive or completely accurate</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 mt-1">•</span>
                  <span>The Service will meet your specific needs or expectations</span>
                </li>
              </ul>

              <p className="text-text-muted leading-relaxed">
                <strong>AI Analysis Disclaimer:</strong> AI-powered classification (political bias, emotional tone) reflects what the AI model detected, which may not capture full context. Results are observational and should not be treated as definitive claims about reality. We recommend using AlgorithmLens as one tool among many for understanding your feed.
              </p>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">10. Termination</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-text-main mb-2">Termination by You</h3>
                  <p className="text-text-muted leading-relaxed">
                    You may terminate your account and stop using AlgorithmLens at any time by deleting your account in Settings. Upon deletion, your personal data will be removed immediately, with scan data deleted within 30 days.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">Termination by Us</h3>
                  <p className="text-text-muted leading-relaxed">
                    We may suspend or terminate your account and access to the Service at any time, for any reason, including:
                  </p>
                  <ul className="space-y-2 text-text-muted mt-2">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0">•</span>
                      <span>Violation of these Terms</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0">•</span>
                      <span>Suspected fraudulent activity or security breach</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0">•</span>
                      <span>Violation of applicable law</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0">•</span>
                      <span>Non-payment of subscription fees</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-text-main mb-2">Effect of Termination</h3>
                  <p className="text-text-muted leading-relaxed">
                    Upon termination by either party, your right to use the Service ceases immediately. Sections of these Terms that survive termination include: Limitation of Liability, Warranty Disclaimer, Intellectual Property Rights, and Governing Law.
                  </p>
                </div>
              </div>
            </section>

            {/* Service Modifications */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">11. Modifications to the Service</h2>

              <p className="text-text-muted leading-relaxed mb-4">
                AlgorithmLens is a dynamic service and we may add, modify, or remove features at any time. We may also suspend or discontinue the Service (or any portion thereof) at any time. In the unlikely event that we discontinue AlgorithmLens, we will provide at least 30 days' notice and allow you to export your data.
              </p>

              <p className="text-text-muted leading-relaxed">
                We are not liable for any changes to the Service or for the consequences of such changes, including loss of access to features or data.
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">12. Changes to These Terms</h2>

              <p className="text-text-muted leading-relaxed mb-4">
                We may update these Terms at any time. When we do, we will update the "Last updated" date. If we make material changes that adversely affect your rights, we will notify you via email at least 30 days before the changes take effect.
              </p>

              <p className="text-text-muted leading-relaxed">
                Your continued use of AlgorithmLens after any changes to these Terms constitutes your acceptance of the updated Terms. If you do not agree with the updated Terms, you must stop using the Service.
              </p>
            </section>

            {/* Indemnification */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">13. Indemnification</h2>

              <p className="text-text-muted leading-relaxed">
                You agree to indemnify, defend, and hold harmless AlgorithmLens, Goodish, and their respective owners, managers, employees, agents, and representatives from any claims, damages, losses, liabilities, and expenses (including reasonable attorneys' fees) arising from or relating to: (a) your use of the Service; (b) your violation of these Terms; (c) your violation of any applicable law or regulation; or (d) your infringement or violation of any third-party rights.
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">14. Governing Law & Jurisdiction</h2>

              <p className="text-text-muted leading-relaxed mb-4">
                These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law principles. You agree to submit to the exclusive jurisdiction of the state and federal courts located in New York County, New York, for the resolution of any disputes arising from or relating to these Terms or your use of the Service.
              </p>

              <p className="text-text-muted leading-relaxed">
                However, we may initiate enforcement actions in any court of competent jurisdiction.
              </p>
            </section>

            {/* Severability */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">15. Severability</h2>

              <p className="text-text-muted leading-relaxed">
                If any provision of these Terms is found to be invalid, illegal, or unenforceable by a court of competent jurisdiction, such provision shall be reformed to the minimum extent necessary to make it valid and enforceable, or if such reformation is not possible, the provision shall be severed. The remaining provisions shall continue in full force and effect.
              </p>
            </section>

            {/* Entire Agreement */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">16. Entire Agreement</h2>

              <p className="text-text-muted leading-relaxed">
                These Terms, together with our Privacy Policy and any other policies or agreements we may publish, constitute the entire agreement between you and AlgorithmLens regarding the Service and supersede any prior agreements or understandings. If there is any conflict between these Terms and any other agreement, these Terms shall control.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-bold text-text-main mb-4">17. Contact Us</h2>

              <p className="text-text-muted leading-relaxed mb-4">
                If you have any questions about these Terms of Service, disputes with AlgorithmLens, or need to report a violation, please contact us:
              </p>

              <div className="bg-gray-50 rounded-xl p-5 border border-border-light">
                <p className="text-text-muted text-sm">
                  For legal, billing, or general support inquiries, please contact us through the AlgorithmLens website.
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
                  By using AlgorithmLens, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.
                </p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </>
  );
}
