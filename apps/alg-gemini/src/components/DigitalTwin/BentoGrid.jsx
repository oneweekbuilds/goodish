import React from 'react';
import GlassCard from './GlassCard';
import { User, Activity, BarChart3, TrendingUp } from 'lucide-react';

const BentoGrid = () => {
    return (
        <section className="w-full py-20">
            <div className="max-w-5xl mx-auto grid grid-cols-12 gap-6 p-6">

                {/* Card A: Political (Portrait) - col-span-12 md:col-span-4 aspect-[4/5] */}
                <div className="col-span-12 md:col-span-4 aspect-[4/5]">
                    <GlassCard className="h-full flex flex-col justify-between bg-gradient-to-br from-blue-50/50 to-white/30">
                        <div className="flex justify-start">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <BarChart3 size={24} />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-3xl font-extrabold text-slate-900 mb-4">Left-Leaning</h3>
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600 w-[88%]" />
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Card B: Age (Landscape) - col-span-12 md:col-span-4 aspect-[4/2.3] */}
                {/* Note: The spec asks for col-span-4 but aspect-[4/2.3] which is landscape. 
            If it's col-span-4 it will be narrow. I will assume it should stack or fit in the grid flow.
            Actually, let's follow the grid flow. 
            If A is col-4, B is col-4, C is col-4? 
            Spec says:
            A: col-span-4
            B: col-span-4
            C: col-span-4 (Wait, spec says C is col-span-6 md:col-span-4 aspect-square)
            D: col-span-8
            
            Let's arrange them:
            Row 1: A (4), B (4), C (4) ?
            Row 2: D (8) ... and empty space?
            
            Let's re-read spec carefully:
            Card A: col-span-12 md:col-span-4 aspect-[4/5]
            Card B: col-span-12 md:col-span-4 aspect-[4/2.3]
            Card C: col-span-6 md:col-span-4 aspect-square
            Card D: col-span-12 md:col-span-8 aspect-[4/2]
            
            This grid might leave gaps if not careful. 
            Row 1: A (4), B (4), C (4) -> Total 12. Perfect.
            Row 2: D (8) ... + 4 empty? 
            
            Wait, A is aspect [4/5] (tall). B is [4/2.3] (short). C is square.
            They won't align in height if they are in the same row.
            Masonry would handle this, but CSS Grid requires explicit rows or auto-flow.
            
            I will place them as requested and let the grid auto-flow or use a wrapper if needed.
            Actually, to make it look good, I might need to wrap B and C in a column if A is tall.
            But strict spec says "Do not infer styles".
            I will follow the col-spans exactly.
        */}

                {/* Wrapper for B and C to stack next to A? No, spec implies direct children of grid.
            I will place them directly.
        */}

                {/* Card B: Age */}
                <div className="col-span-12 md:col-span-4 aspect-[4/2.3]">
                    <GlassCard className="h-full flex flex-col justify-center bg-gradient-to-br from-orange-50/50 to-white/30">
                        <div className="text-4xl font-bold text-slate-900">24-30</div>
                        <div className="text-sm text-slate-500 mt-2">Predicted Age</div>
                    </GlassCard>
                </div>

                {/* Card C: Anxiety */}
                <div className="col-span-6 md:col-span-4 aspect-square">
                    <GlassCard className="h-full flex flex-col justify-center items-center bg-white/40 border-red-100">
                        <Activity size={32} className="text-red-500 mb-2" />
                        <div className="text-xl font-bold text-red-500">High Anxiety</div>
                    </GlassCard>
                </div>

                {/* Card D: Engagement */}
                <div className="col-span-12 md:col-span-8 aspect-[4/2]">
                    <GlassCard className="h-full flex items-center justify-center bg-gradient-to-r from-green-50 to-emerald-50">
                        <div className="text-center">
                            <div className="text-green-600 font-bold text-2xl md:text-3xl">Top 5% Valuable User</div>
                            <div className="text-slate-500 text-sm mt-1">Engagement Score</div>
                        </div>
                    </GlassCard>
                </div>

            </div>
        </section>
    );
};

export default BentoGrid;
