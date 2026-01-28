import React from 'react';
import { motion } from 'framer-motion';
import { Database, Scan, UserCheck } from 'lucide-react';

const HowItWorksSection = () => {
    return (
        <section className="py-12 sm:py-24 bg-bg-page overflow-hidden">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center mb-10 sm:mb-16">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-main mb-4 sm:mb-6">Your data stays yours.</h2>
                <p className="text-base sm:text-lg text-text-muted max-w-2xl mx-auto px-2">
                    We reveal the patterns algorithms use so you can act with intention, not autopilot.
                </p>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-14">
                <StepCard
                    icon={Database}
                    title="Ingest Activity"
                    desc="We process your likes, scrolls, and dwell time locally."
                    color="blue"
                    delay={0.2}
                />
                <StepCard
                    icon={Scan}
                    title="Detect Patterns"
                    desc="Our models identify the clusters you've been placed in."
                    color="green"
                    delay={0.4}
                />
                <StepCard
                    icon={UserCheck}
                    title="Reveal Profile"
                    desc="See your digital identity and take back control."
                    color="blue"
                    delay={0.6}
                />
            </div>
        </section>
    );
};

const StepCard = ({ icon: Icon, title, desc, color, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay, duration: 0.5 }}
        className="flex flex-col items-center text-center group"
    >
        <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-[28px] flex items-center justify-center mb-4 sm:mb-6 transition-transform duration-300 group-hover:scale-110 shadow-soft ${color === 'blue' ? 'bg-primary-blue/10 text-primary-blue' : 'bg-accent-green/10 text-accent-green'
            }`}>
            <Icon size={32} className="sm:w-9 sm:h-9" strokeWidth={2} />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-text-main mb-2 sm:mb-3.5">{title}</h3>
        <p className="text-sm sm:text-base text-text-muted leading-relaxed font-medium">{desc}</p>
    </motion.div>
);

export default HowItWorksSection;
