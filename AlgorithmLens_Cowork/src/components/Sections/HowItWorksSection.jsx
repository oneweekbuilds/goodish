import React from 'react';
import { motion } from 'framer-motion';
import { Database, Scan, UserCheck } from 'lucide-react';

const HowItWorksSection = () => {
    return (
        <section className="py-12 sm:py-24 bg-white overflow-hidden" aria-labelledby="how-it-works-heading" role="region">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center mb-10 sm:mb-16">
                <h2 id="how-it-works-heading" className="text-3xl sm:text-4xl md:text-5xl font-bold text-text-main mb-4 sm:mb-6">Your data stays yours.</h2>
                <p className="text-base sm:text-lg text-text-muted max-w-2xl mx-auto px-2">
                    See what the algorithm is optimizing for, so you can scroll with intention.
                </p>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-14">
                <StepCard
                    number={1}
                    icon={Database}
                    title="Ingest Activity"
                    desc="We capture a snapshot of your feed content locally."
                    color="blue"
                    delay={0.2}
                />
                <StepCard
                    number={2}
                    icon={Scan}
                    title="Detect Patterns"
                    desc="Our analysis categorizes the content that appeared in your feed snapshot."
                    color="green"
                    delay={0.4}
                />
                <StepCard
                    number={3}
                    icon={UserCheck}
                    title="See Your Patterns"
                    desc="See the composition of your feed and decide how you want to engage."
                    color="blue"
                    delay={0.6}
                />
            </div>
        </section>
    );
};

const StepCard = ({ number, icon: Icon, title, desc, color, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay, duration: 0.5 }}
        className="flex flex-col items-center text-center group"
    >
        <div className="relative mb-4 sm:mb-6">
            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-[28px] flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-soft ring-1 ${color === 'blue' ? 'bg-primary-blue/10 text-primary-blue ring-primary-blue/10' : 'bg-accent-green/10 text-accent-green ring-accent-green/10'
            }`}>
                <Icon size={32} className="sm:w-9 sm:h-9" strokeWidth={2} />
            </div>
            <span className="absolute -top-2 -right-2 inline-flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-primary-blue text-white text-xs sm:text-sm font-bold">
                {number}
            </span>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-text-main mb-2 sm:mb-3.5">{title}</h3>
        <p className="text-sm sm:text-base text-text-muted leading-relaxed font-medium">{desc}</p>
    </motion.div>
);

export default HowItWorksSection;
