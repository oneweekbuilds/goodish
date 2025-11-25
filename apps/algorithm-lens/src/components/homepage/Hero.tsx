import React, { useState } from 'react';
import { XCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface HeroProps {
  onNavigate?: (page: string) => void;
}

export function Hero({ onNavigate }: HeroProps) {
  const [email, setEmail] = useState('');

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && onNavigate) {
      onNavigate('signin');
    }
  };

  return (
    <section className="relative overflow-hidden bg-[#F8F9FA] pt-32 pb-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-5xl mx-auto mb-20">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <span className="inline-block bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-widest">
              Built at MIT
            </span>
          </motion.div>

          {/* Massive Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-6xl md:text-8xl font-extrabold tracking-tighter text-slate-900 leading-[1.1] mb-8"
          >
            See your algorithm.{' '}
            <span className="text-slate-500">Understand your feed.</span>
          </motion.h1>

          {/* Subhead */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            Algorithms quietly learn what you like — and feed it back to you.
            Finally see what they see in you.
          </motion.p>

          {/* Unified Input */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <form onSubmit={handleEmailSubmit} className="flex w-full max-w-md mx-auto bg-white p-2 rounded-full shadow-xl border border-slate-200 focus-within:ring-4 focus-within:ring-blue-100 transition-all">
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 bg-transparent px-6 py-3 text-lg outline-none text-slate-700 placeholder:text-slate-400"
              />
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold transition-colors flex items-center gap-2">
                Analyze <ArrowRight size={18} />
              </button>
            </form>
            <p className="mt-4 text-sm text-slate-500">
              100% free analysis. No credit card required.
            </p>
          </motion.div>
        </div>

        {/* Pro Comparison Cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto"
        >
          {/* Before Card */}
          <div className="bg-white rounded-2xl p-10 shadow-2xl shadow-slate-200/60 border border-slate-200 border-t-4 border-t-slate-300 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <XCircle size={120} className="text-slate-900" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Before AlgorithmLens</h3>
              </div>

              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-slate-600">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-lg">Unaware of why you see what you see</span>
                </li>
                <li className="flex items-start gap-3 text-slate-600">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-lg">Reactive to emotional triggers</span>
                </li>
                <li className="flex items-start gap-3 text-slate-600">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span className="text-lg">Trapped in an invisible echo chamber</span>
                </li>
              </ul>
            </div>
          </div>

          {/* After Card */}
          <div className="bg-white rounded-2xl p-10 shadow-2xl shadow-slate-200/60 border border-slate-200 border-t-4 border-t-blue-500 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <CheckCircle2 size={120} className="text-blue-600" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">With AlgorithmLens</h3>
              </div>

              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-slate-700 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-lg">Clear visibility into your feed's bias</span>
                </li>
                <li className="flex items-start gap-3 text-slate-700 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-lg">Empowered to choose what you consume</span>
                </li>
                <li className="flex items-start gap-3 text-slate-700 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-lg">Break free from the algorithm's control</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
