import { Lock, BarChart3, Folder } from "lucide-react";
import LogoMark from "../components/LogoMark";
import { PrivacyBadge } from "../components/PrivacyBadge";

export function Home({onGetStarted, onSamples}:{onGetStarted:()=>void; onSamples:()=>void;}){
  return (
    <div className="min-h-screen">
      {/* Premium Hero Section - Improvements #1, #2, #3, #8, #10 */}
      <section className="relative min-h-[min(90vh,900px)]" style={{ animation: 'gradient-shift 60s ease-in-out infinite' }}>
        {/* Animated background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand/5 rounded-full blur-3xl" style={{ animation: 'float 20s ease-in-out infinite' }}></div>
          <div className="absolute top-32 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" style={{ animation: 'float 25s ease-in-out infinite reverse' }}></div>
        </div>

        {/* Responsive hero spacing - improved spacing under navbar */}
        <div className="relative max-w-[1120px] mx-auto px-6 sm:px-12 lg:px-16 pt-28 pb-32 text-center">
          {/* New Magnifying Glass Logo */}
          <div className="flex justify-center mb-8 animate-fade-in">
            <LogoMark size={120} animated={true} />
          </div>

          {/* Main heading - fixed clipping with proper line-height and guard space */}
          <div className="inline-block pb-2">
            <h1
              className="text-[clamp(40px,6vw,96px)] font-bold tracking-[0] bg-gradient-to-r from-brand via-accent to-pos animate-fade-in"
              style={{
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: '1.1',
                animationDelay: '0.1s',
                paddingBottom: '6px'
              }}
            >
              AlgorithmLens
            </h1>
          </div>

          {/* Slogan - responsive typography */}
          <p
            className="text-[clamp(16px,2.2vw,28px)] text-inkDim mt-4 mb-6 max-w-2xl mx-auto font-normal animate-fade-in"
            style={{
              lineHeight: '1.35',
              animationDelay: '0.2s'
            }}
          >
            See what your algorithm sees in you.
          </p>

          {/* Description */}
          <p className="text-base sm:text-lg md:text-xl text-inkMuted mb-10 max-w-xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.3s' }}>
            Upload your feed data to discover how algorithms shape what you see.
          </p>

          {/* CTA buttons with better hierarchy */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-brand to-accent text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all shadow-e2 focus-visible:outline focus-visible:outline-2 outline-brand"
            >
              Get Started
            </button>
            <button
              onClick={onSamples}
              className="w-full sm:w-auto px-8 py-4 bg-panel border border-line text-ink rounded-xl font-semibold hover:border-brand hover:bg-brand/5 transition-all shadow-e1 focus-visible:outline focus-visible:outline-2 outline-brand"
            >
              Try Sample Data
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-inkMuted">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-brand" />
              <span>100% Local</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-pos" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>No Tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Instant Analysis</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-[1120px] mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-panel rounded-2xl border border-line shadow-e1 p-8 text-center">
            <Lock className="w-12 h-12 text-brand mx-auto mb-4"/>
            <h3 className="text-xl font-semibold mb-2">Privacy First</h3>
            <p className="text-inkMuted">100% local processing. Your data never leaves your device. No servers, no tracking, no telemetry.</p>
          </div>
          <div className="bg-panel rounded-2xl border border-line shadow-e1 p-8 text-center">
            <BarChart3 className="w-12 h-12 text-accent mx-auto mb-4"/>
            <h3 className="text-xl font-semibold mb-2">Deep Insights</h3>
            <p className="text-inkMuted">Topic mix, sentiment trends, echo scores, ad ratios, and creator diversity—all visualized beautifully.</p>
          </div>
          <div className="bg-panel rounded-2xl border border-line shadow-e1 p-8 text-center">
            <Folder className="w-12 h-12 text-pos mx-auto mb-4"/>
            <h3 className="text-xl font-semibold mb-2">Smart Import</h3>
            <p className="text-inkMuted">Supports Instagram, TikTok, X (Twitter), YouTube, Facebook, and Reddit. Drop your exports and go.</p>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="max-w-[1120px] mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center font-semibold">1</div>
            <div>
              <h4 className="font-semibold mb-1">Request Your Data</h4>
              <p className="text-inkMuted">Download your data export from Instagram, TikTok, X, YouTube, Facebook, or Reddit (usually in Settings → Privacy → Download Data).</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center font-semibold">2</div>
            <div>
              <h4 className="font-semibold mb-1">Upload Your Files</h4>
              <p className="text-inkMuted">Drag and drop your .zip, .json, or .js files into Algorithm Lens. We'll parse and classify everything locally.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-brand text-white rounded-full flex items-center justify-center font-semibold">3</div>
            <div>
              <h4 className="font-semibold mb-1">Explore Your Insights</h4>
              <p className="text-inkMuted">See topic breakdowns, sentiment over time, echo scores, ad ratios, and top creators—all in beautiful, interactive charts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Statement */}
      <section className="max-w-[1120px] mx-auto px-6 py-16">
        <PrivacyBadge />
      </section>

      {/* Footer */}
      <footer className="border-t border-line mt-16 py-8">
        <div className="max-w-[1120px] mx-auto px-6 text-center text-sm text-inkMuted space-y-3">
          <p className="font-medium text-ink">Algorithm Lens • Built with privacy in mind</p>
          <p>All processing happens locally in your browser. Your data never leaves your device.</p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
            <a
              href="https://goodish.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline focus-visible:outline focus-visible:outline-2 outline-brand rounded px-2 py-1"
            >
              Made with ❤️ by Goodish
            </a>
            <span className="text-neu">•</span>
            <button
              onClick={()=>window.location.hash='#privacy'}
              className="text-inkMuted hover:text-brand hover:underline focus-visible:outline focus-visible:outline-2 outline-brand rounded px-2 py-1"
            >
              Privacy Policy
            </button>
            <span className="text-neu">•</span>
            <a
              href="mailto:hello@goodish.org"
              className="text-inkMuted hover:text-brand hover:underline focus-visible:outline focus-visible:outline-2 outline-brand rounded px-2 py-1"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
