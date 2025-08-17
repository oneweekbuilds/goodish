import { Logo } from "@/src/components/logo"
import Link from "next/link"

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#fdfaf4", fontFamily: "Inter, sans-serif" }}>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Logo size="md" />
        <h1 className="text-3xl font-bold text-[#111] mb-6 mt-8">
          Privacy Policy
        </h1>
        
        <div className="prose max-w-none">
          <p className="text-lg text-[#444] mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <p className="text-[#444] mb-6" style={{ fontFamily: "Inter, sans-serif" }}>
            We care deeply about your privacy and transparency. This Privacy Policy explains how GoodHeart ("we," "our," or "us") collects, uses, and protects your information when you use our website and services.
          </p>

          <h2 className="text-2xl font-bold text-[#111] mb-4 mt-8" style={{ fontFamily: "Inter, sans-serif" }}>
            Information We Collect
          </h2>
          
          <h3 className="text-xl font-semibold text-[#111] mb-3 mt-6" style={{ fontFamily: "Inter, sans-serif" }}>
            Data Collection
          </h3>
          <p className="text-[#444] mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
            We collect information you provide directly to us, such as:
          </p>
          <ul className="list-disc pl-6 mb-6 text-[#444]" style={{ fontFamily: "Inter, sans-serif" }}>
            <li>Quiz responses and giving preferences</li>
            <li>Email addresses when you sign up for updates</li>
            <li>Usage data and website interactions</li>
            <li>Device and browser information</li>
          </ul>

          <h3 className="text-xl font-semibold text-[#111] mb-3 mt-6" style={{ fontFamily: "Inter, sans-serif" }}>
            Email Communication
          </h3>
          <p className="text-[#444] mb-6" style={{ fontFamily: "Inter, sans-serif" }}>
            When you provide your email address, we may send you:
          </p>
          <ul className="list-disc pl-6 mb-6 text-[#444]" style={{ fontFamily: "Inter, sans-serif" }}>
            <li>Quiz results and charity recommendations</li>
            <li>Updates about GoodHeart features and services</li>
            <li>Educational content about effective giving</li>
            <li>Occasional newsletters (you can unsubscribe anytime)</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#111] mb-4 mt-8" style={{ fontFamily: "Inter, sans-serif" }}>
            How We Use Your Information
          </h2>
          <p className="text-[#444] mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-6 mb-6 text-[#444]" style={{ fontFamily: "Inter, sans-serif" }}>
            <li>Provide personalized charity recommendations</li>
            <li>Improve our quiz algorithm and user experience</li>
            <li>Send relevant updates and educational content</li>
            <li>Analyze usage patterns to enhance our services</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#111] mb-4 mt-8" style={{ fontFamily: "Inter, sans-serif" }}>
            Donation Tracking
          </h2>
          <p className="text-[#444] mb-6" style={{ fontFamily: "Inter, sans-serif" }}>
            When you click donation links to Every.org or other charity platforms, we may track these interactions to understand the impact of our recommendations. We do not process payments directly or store your financial information. All donations are handled securely by the respective charity platforms.
          </p>

          <h2 className="text-2xl font-bold text-[#111] mb-4 mt-8" style={{ fontFamily: "Inter, sans-serif" }}>
            Third-Party Services
          </h2>
          <p className="text-[#444] mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
            We work with trusted third-party services including:
          </p>
          <ul className="list-disc pl-6 mb-6 text-[#444]" style={{ fontFamily: "Inter, sans-serif" }}>
            <li><strong>Every.org:</strong> For charity donation processing</li>
            <li><strong>Analytics providers:</strong> To understand website usage</li>
            <li><strong>Email service providers:</strong> To send updates and communications</li>
            <li><strong>Hosting services:</strong> To deliver our website securely</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#111] mb-4 mt-8" style={{ fontFamily: "Inter, sans-serif" }}>
            Analytics
          </h2>
          <p className="text-[#444] mb-6" style={{ fontFamily: "Inter, sans-serif" }}>
            We use analytics tools to understand how users interact with our website. This helps us improve the user experience and make our charity matching more effective. We may use cookies and similar technologies to collect this information.
          </p>

          <h2 className="text-2xl font-bold text-[#111] mb-4 mt-8" style={{ fontFamily: "Inter, sans-serif" }}>
            Data Security
          </h2>
          <p className="text-[#444] mb-6" style={{ fontFamily: "Inter, sans-serif" }}>
            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no internet transmission is completely secure, and we cannot guarantee absolute security.
          </p>

          <h2 className="text-2xl font-bold text-[#111] mb-4 mt-8" style={{ fontFamily: "Inter, sans-serif" }}>
            Your Rights
          </h2>
          <p className="text-[#444] mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
            Depending on your location, you may have certain rights regarding your personal information:
          </p>
          <ul className="list-disc pl-6 mb-6 text-[#444]" style={{ fontFamily: "Inter, sans-serif" }}>
            <li>Access and portability of your data</li>
            <li>Correction of inaccurate information</li>
            <li>Deletion of your personal information</li>
            <li>Opt-out of marketing communications</li>
            <li>Restriction of processing in certain circumstances</li>
          </ul>

          <h2 className="text-2xl font-bold text-[#111] mb-4 mt-8" style={{ fontFamily: "Inter, sans-serif" }}>
            GDPR & CCPA Compliance
          </h2>
          <p className="text-[#444] mb-6" style={{ fontFamily: "Inter, sans-serif" }}>
            We comply with applicable data protection laws, including the General Data Protection Regulation (GDPR) for EU users and the California Consumer Privacy Act (CCPA) for California residents.
          </p>

          <h2 className="text-2xl font-bold text-[#111] mb-4 mt-8" style={{ fontFamily: "Inter, sans-serif" }}>
            Children's Privacy
          </h2>
          <p className="text-[#444] mb-6" style={{ fontFamily: "Inter, sans-serif" }}>
            Our services are not directed to children under 13, and we do not knowingly collect personal information from children under 13. If we become aware that we have collected such information, we will take steps to delete it.
          </p>

          <h2 className="text-2xl font-bold text-[#111] mb-4 mt-8" style={{ fontFamily: "Inter, sans-serif" }}>
            Changes to This Policy
          </h2>
          <p className="text-[#444] mb-6" style={{ fontFamily: "Inter, sans-serif" }}>
            We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on our website and updating the "Last updated" date.
          </p>

          <p className="text-gray-600 mb-6" style={{ fontFamily: "Inter, sans-serif" }}>
            GoodHeart does not currently offer a public contact method. Thank you for your support.
          </p>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500" style={{ fontFamily: "Inter, sans-serif" }}>
              This policy reflects our commitment to transparency and your privacy rights. We believe in giving with joy while protecting the trust you place in us.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: "Privacy Policy | GoodHeart",
  description:
    "Learn about our privacy practices and how we protect your data. We care deeply about your privacy and transparency.",
}