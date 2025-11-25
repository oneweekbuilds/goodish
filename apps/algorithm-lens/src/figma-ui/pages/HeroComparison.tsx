import { XCircle, CheckCircle2 } from 'lucide-react';

export default function HeroComparison() {
  return (
    <section className="max-w-5xl mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* BEFORE card — muted, gray, centered */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200 hover:shadow-2xl transition-shadow duration-300 text-center">
          <div className="mx-auto mb-2 inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-slate-500">
            <XCircle className="w-4 h-4 text-red-500" />
            <span>Before AlgorithmLens</span>
          </div>

          <h3 className="text-2xl font-semibold text-gray-700 mb-2">
            You absorb what your feed feeds you.
          </h3>
          <p className="text-sm text-gray-500 mb-5">
            You scroll, you absorb, you react, without realizing why.
          </p>

          <ul className="mx-auto inline-flex flex-col gap-2 text-left">
            <li className="flex items-center text-slate-600">
              <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mr-3" />
              <span className="text-sm">Unaware</span>
            </li>
            <li className="flex items-center text-slate-600">
              <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mr-3" />
              <span className="text-sm">Reactive</span>
            </li>
            <li className="flex items-center text-slate-600">
              <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mr-3" />
              <span className="text-sm">Easily influenced</span>
            </li>
            <li className="flex items-center text-slate-600">
              <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mr-3" />
              <span className="text-sm">Scrolling mindlessly</span>
            </li>
          </ul>
        </div>

        {/* WITH card — AlgorithmLens brand solid color matching button, centered */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200 hover:shadow-2xl transition-shadow duration-300 text-center">
          <div className="relative z-10">
            <div className="mx-auto mb-2 inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-blue-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>With AlgorithmLens</span>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              You see your feed with awareness.
            </h3>
            <p className="text-sm text-gray-800 mb-5">
              You notice what you are shown and decide what to believe.
            </p>

            <ul className="mx-auto inline-flex flex-col gap-2 text-left">
              <li className="flex items-center text-slate-800">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0 mr-3" />
                <span className="text-sm">Aware</span>
              </li>
              <li className="flex items-center text-slate-800">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0 mr-3" />
                <span className="text-sm">In control</span>
              </li>
              <li className="flex items-center text-slate-800">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0 mr-3" />
                <span className="text-sm">Empowered</span>
              </li>
              <li className="flex items-center text-slate-800">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0 mr-3" />
                <span className="text-sm">Clear-minded</span>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </section>
  );
}
