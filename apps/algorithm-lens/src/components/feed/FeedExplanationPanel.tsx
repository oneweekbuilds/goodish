import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

export function FeedExplanationPanel() {
    const [isOpen, setIsOpen] = useState(true);
    const [hasInitialized, setHasInitialized] = useState(false);

    useEffect(() => {
        const savedState = localStorage.getItem('feedExplanationOpen');
        if (savedState !== null) {
            setIsOpen(savedState === 'true');
        }
        setHasInitialized(true);
    }, []);

    const toggleOpen = () => {
        const newState = !isOpen;
        setIsOpen(newState);
        localStorage.setItem('feedExplanationOpen', String(newState));
    };

    if (!hasInitialized) return null; // Prevent hydration mismatch or flash

    return (
        <div className="w-full max-w-3xl mx-auto mb-8">
            <div className="bg-white/80 backdrop-blur-md border border-secondary-mint/30 rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                {/* Header / Toggle */}
                <button
                    onClick={toggleOpen}
                    className="w-full px-6 py-4 flex items-center justify-between text-left group"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-secondary-mint/10 text-primary-teal">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <span className="font-heading font-bold text-neutral-graphite text-sm">
                            What is this simulation?
                        </span>
                    </div>
                    <div className="text-neutral-graphite/40 transition-colors group-hover:text-primary-teal">
                        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                </button>

                {/* Collapsible Content */}
                <AnimatePresence initial={false}>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                            <div className="px-6 pb-6 pt-0">
                                <div className="pl-[52px] space-y-4">
                                    <p className="text-sm text-neutral-graphite/70 leading-relaxed">
                                        Algorithms quietly learn from how you scroll. This simulated feed shows how your behavior shapes what platforms think you want. Try scrolling, pausing, or re-reading a post — then see what the algorithm "sees."
                                    </p>

                                    <button
                                        className="inline-flex items-center gap-2 text-sm font-bold text-primary-teal hover:text-primary-indigo transition-colors group"
                                        onClick={() => console.log("Navigate to real analysis")} // Placeholder for now
                                    >
                                        Analyze My Real Feed
                                        <span className="transition-transform group-hover:translate-x-1">→</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
