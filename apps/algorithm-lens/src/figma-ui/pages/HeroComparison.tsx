import React from "react";

function XIcon({ className = "" }) {
  return (
    <svg className={`w-4 h-4 ${className}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}

function CheckIcon({ className = "" }) {
  return (
    <svg className={`w-4 h-4 ${className}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.5 7.5a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L8.5 12.086l6.793-6.793a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

export default function HeroComparison() {
  return (
    <section className="max-w-5xl mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* BEFORE card — muted, gray, centered */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 shadow-sm text-center">
          <div className="mx-auto mb-2 inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-gray-500">
            <XIcon className="text-gray-400" />
            <span>Before AlgorithmLens</span>
          </div>

          <h3 className="text-2xl font-semibold text-gray-700 mb-2">
            You absorb what your feed feeds you.
          </h3>
          <p className="text-sm text-gray-500 mb-5">
            You scroll, you absorb, you react, without realizing why.
          </p>

          <ul className="mx-auto inline-flex flex-col gap-2 text-left">
            <li className="flex items-center gap-2 text-gray-600">
              <XIcon className="text-gray-400" />
              <span className="text-sm">Unaware</span>
            </li>
            <li className="flex items-center gap-2 text-gray-600">
              <XIcon className="text-gray-400" />
              <span className="text-sm">Reactive</span>
            </li>
            <li className="flex items-center gap-2 text-gray-600">
              <XIcon className="text-gray-400" />
              <span className="text-sm">Easily influenced</span>
            </li>
            <li className="flex items-center gap-2 text-gray-600">
              <XIcon className="text-gray-400" />
              <span className="text-sm">Scrolling mindlessly</span>
            </li>
          </ul>
        </div>

        {/* WITH card — AlgorithmLens brand gradient matching button, centered */}
        <div className="relative rounded-2xl border border-cyan-300 shadow-lg bg-gradient-to-br from-cyan-200 via-indigo-200 to-emerald-200 before:absolute before:inset-0 before:bg-white/55 before:rounded-2xl text-center hover:shadow-xl transition duration-200 ease-out hover:scale-[1.01]">
          <div className="relative z-10 p-8">
            <div className="mx-auto mb-2 inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase text-indigo-600">
              <CheckIcon className="text-cyan-600" />
              <span>With AlgorithmLens</span>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              You see your feed with awareness.
            </h3>
            <p className="text-sm text-gray-800 mb-5">
              You notice what you are shown and decide what to believe.
            </p>

            <ul className="mx-auto inline-flex flex-col gap-2 text-left">
              <li className="flex items-center gap-2 text-gray-800">
                <CheckIcon className="text-emerald-600" />
                <span className="text-sm">Aware</span>
              </li>
              <li className="flex items-center gap-2 text-gray-800">
                <CheckIcon className="text-emerald-600" />
                <span className="text-sm">In control</span>
              </li>
              <li className="flex items-center gap-2 text-gray-800">
                <CheckIcon className="text-emerald-600" />
                <span className="text-sm">Empowered</span>
              </li>
              <li className="flex items-center gap-2 text-gray-800">
                <CheckIcon className="text-emerald-600" />
                <span className="text-sm">Clear-minded</span>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </section>
  );
}
