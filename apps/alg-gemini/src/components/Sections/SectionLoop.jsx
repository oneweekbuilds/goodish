import React from 'react';
import { motion } from 'framer-motion';

const SectionLoop = () => {
    return (
        <section className="py-24 bg-bg-page overflow-hidden">
            {/* Section Heading - Unchanged */}
            <div className="max-w-6xl mx-auto px-6 text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-text-main mb-6">The Feedback Loop</h2>
                <p className="text-lg text-text-muted max-w-2xl mx-auto">
                    It's a cycle designed to keep you engaged. Your behavior trains the model, which refines the content, which shapes your behavior.
                </p>
            </div>

            {/* Loop Container - 3x3 Grid */}
            <div className="relative max-w-5xl mx-auto mt-16 px-6">
                <div className="hidden md:grid gap-4 items-center justify-items-center"
                    style={{
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gridTemplateRows: '1fr 1fr 1fr',
                        gridTemplateAreas: `
                            "tl top tr"
                            "left center right"
                            "bl bottom br"
                        `
                    }}>

                    {/* Box 1: Top - Your behavior */}
                    <div style={{ gridArea: 'top' }} className="w-full h-full flex justify-center items-center">
                        <LoopCard
                            number={1}
                            title="Your behavior"
                            desc="Every tap, scroll, and pause teaches the algorithm."
                            delay={0.2}
                        />
                    </div>

                    {/* Box 2: Right - The algorithm's view */}
                    <div style={{ gridArea: 'right' }} className="w-full h-full flex justify-center items-center">
                        <LoopCard
                            number={2}
                            title="The algorithm's view"
                            desc="You are categorized into hidden labels."
                            delay={0.5}
                        />
                    </div>

                    {/* Box 3: Bottom - Tailored content */}
                    <div style={{ gridArea: 'bottom' }} className="w-full h-full flex justify-center items-center">
                        <LoopCard
                            number={3}
                            title="Tailored content"
                            desc="Your feed shifts to reinforce your inferred identity."
                            delay={0.8}
                        />
                    </div>

                    {/* Box 4: Left - Your worldview shifts */}
                    <div style={{ gridArea: 'left' }} className="w-full h-full flex justify-center items-center">
                        <LoopCard
                            number={4}
                            title="Your worldview shifts"
                            desc="Exposure shapes your beliefs, interests, and habits."
                            delay={1.1}
                        />
                    </div>

                    {/* Center Logo */}
                    <motion.div
                        style={{ gridArea: 'center' }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex justify-center items-center z-30"
                    >
                        <img
                            src="/logo-full.png"
                            alt="AlgorithmLens"
                            className="w-72 max-w-[300px]"
                            style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.08))' }}
                        />
                    </motion.div>

                    {/* Arrows */}
                    {/* TL: Left -> Top (0 deg) */}
                    <div style={{ gridArea: 'tl' }} className="w-full h-full flex justify-center items-center">
                        <LoopArrow rotation={0} delay={1.5} />
                    </div>

                    {/* TR: Top -> Right (90 deg) */}
                    <div style={{ gridArea: 'tr' }} className="w-full h-full flex justify-center items-center">
                        <LoopArrow rotation={90} delay={0.6} />
                    </div>

                    {/* BR: Right -> Bottom (180 deg) */}
                    <div style={{ gridArea: 'br' }} className="w-full h-full flex justify-center items-center">
                        <LoopArrow rotation={180} delay={0.9} />
                    </div>

                    {/* BL: Bottom -> Left (270 deg) */}
                    <div style={{ gridArea: 'bl' }} className="w-full h-full flex justify-center items-center">
                        <LoopArrow rotation={270} delay={1.2} />
                    </div>
                </div>

                {/* Mobile Layout - Vertical Stack */}
                <div className="flex flex-col gap-6 md:hidden items-center">
                    <LoopCard number={1} title="Your behavior" desc="Every tap, scroll, and pause teaches the algorithm." delay={0.2} />
                    <LoopCard number={2} title="The algorithm's view" desc="You are categorized into hidden labels." delay={0.4} />
                    <LoopCard number={3} title="Tailored content" desc="Your feed shifts to reinforce your inferred identity." delay={0.6} />
                    <LoopCard number={4} title="Your worldview shifts" desc="Exposure shapes your beliefs, interests, and habits." delay={0.8} />
                </div>
            </div>
        </section>
    );
};

const LoopCard = ({ number, title, desc, delay }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.5 }}
            className="bg-white rounded-3xl shadow-soft p-6 w-full max-w-sm border border-border-light h-full flex flex-col justify-center items-center text-center"
        >
            <div className="flex items-center gap-3 mb-3 justify-center">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-blue/10 text-sm font-bold text-primary-blue shrink-0">
                    {number}
                </span>
                <h3 className="text-lg font-bold text-text-main leading-tight">
                    {title}
                </h3>
            </div>
            <p className="text-sm text-text-muted leading-relaxed">
                {desc}
            </p>
        </motion.div>
    );
};

const LoopArrow = ({ rotation, delay }) => (
    <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay, duration: 0.5 }}
        className="w-full h-full flex items-center justify-center p-4"
        style={{ transform: `rotate(${rotation}deg)` }}
    >
        <svg viewBox="0 0 100 100" className="w-full h-full max-w-[120px] max-h-[120px] text-primary-blue overflow-visible">
            {/* Curve from Bottom-Center (50, 100) to Right-Center (100, 50) */}
            <path
                d="M 50 100 Q 50 50 100 50"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                markerEnd="url(#arrowhead-loop)"
            />
            <defs>
                <marker id="arrowhead-loop" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6" fill="currentColor" />
                </marker>
            </defs>
        </svg>
    </motion.div>
);

export default SectionLoop;
