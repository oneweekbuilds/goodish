import { useEffect, useRef } from 'react';
import { PageContainer } from '../ui/PageContainer';
import { LensGlow } from '../ui/LensGlow';
import { FeedPost } from './FeedPost';
import { InsightPanel } from '../insights/InsightPanel';
import { AlgorithmProvider, useAlgorithm } from '../../context/algorithmContext';
import { FloatingInsightOverlay } from './FloatingInsightOverlay';

// Mock Data - 10 Realistic Posts
// Mock Data - 10 Realistic Posts with Analysis Metadata
const FEED_POSTS = [
    {
        id: 1,
        user: "DopamineDrift",
        avatar: "bg-primary-teal",
        imageUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=400&fit=crop",
        caption: "Why we scroll for hours and feel nothing. A thread on digital dopamine loops 🧵",
        likes: "2.8k",
        comments: "156",
        timestamp: "3 HOURS AGO",
        topic: "Tech / AI",
        type: "Educational",
        insight: "You engage with dopamine-related content 3x more after 9 PM.",
        patternHint: "The algorithm flags this as a strong interest."
    },
    {
        id: 2,
        user: "SleepScience",
        avatar: "bg-primary-indigo",
        imageUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800&h=400&fit=crop",
        caption: "The blue light paradox: Why your 'relaxing' scroll is keeping you awake. #sleephealth",
        likes: "1.4k",
        comments: "89",
        timestamp: "5 HOURS AGO",
        topic: "Sleep / Wellness",
        type: "Health",
        insight: "Sleep-related posts appear more frequently when you browse late.",
        patternHint: "Late-night dwelling signals insomnia patterns."
    },
    {
        id: 3,
        user: "AnxietyAware",
        avatar: "bg-secondary-lavender",
        imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=400&fit=crop",
        caption: "Breathwork for the overwhelmed mind. Try this for 60 seconds.",
        likes: "3.1k",
        comments: "203",
        timestamp: "8 HOURS AGO",
        topic: "Nature / Calm",
        type: "Wellness",
        insight: "Anxiety content is prioritized after you engage with news feeds.",
        patternHint: "Pausing here reduces future high-stress content."
    },
    {
        id: 4,
        user: "FocusFlow",
        avatar: "bg-accent-blue",
        imageUrl: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=400&fit=crop",
        caption: "Deep work isn't dead. It's just been algorithmically deprioritized.",
        likes: "980",
        comments: "67",
        timestamp: "12 HOURS AGO",
        topic: "Productivity / Focus",
        type: "Career",
        insight: "Productivity posts spike when you search for focus techniques.",
        patternHint: "Clicking this boosts 'hustle culture' content."
    },
    {
        id: 5,
        user: "MinimalistMind",
        avatar: "bg-neutral-graphite",
        imageUrl: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=800&h=400&fit=crop",
        caption: "Declutter your digital space. Unfollow 5 accounts today that make you feel inadequate.",
        likes: "4.2k",
        comments: "312",
        timestamp: "1 DAY AGO",
        topic: "Productivity / Focus",
        type: "Lifestyle",
        insight: "The algorithm notices you pause on 'decluttering' content.",
        patternHint: "This engagement lowers ad density for shopping."
    },
    {
        id: 6,
        user: "TechBalance",
        avatar: "bg-primary-teal",
        imageUrl: "https://images.unsplash.com/photo-1515378960530-7c0da6231fb1?w=800&h=400&fit=crop",
        caption: "Is your phone a tool or a master? Reclaiming control starts with awareness.",
        likes: "1.1k",
        comments: "45",
        timestamp: "1 DAY AGO",
        topic: "Tech / AI",
        type: "Philosophy",
        insight: "You often click on 'digital detox' related headlines.",
        patternHint: "Signals a desire to disconnect."
    },
    {
        id: 7,
        user: "NutritionFacts",
        avatar: "bg-secondary-mint",
        imageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=400&fit=crop",
        caption: "Sugar crashes affect your mood more than you think. Here's the science.",
        likes: "2.5k",
        comments: "120",
        timestamp: "2 DAYS AGO",
        topic: "Sleep / Wellness",
        type: "Health",
        insight: "Health content engagement correlates with your morning browsing.",
        patternHint: "Morning scrolls trigger health-related ads."
    },
    {
        id: 8,
        user: "MindfulMoments",
        avatar: "bg-secondary-lavender",
        imageUrl: "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=800&h=400&fit=crop",
        caption: "Just breathe. 🌿",
        likes: "5.6k",
        comments: "89",
        timestamp: "2 DAYS AGO",
        topic: "Nature / Calm",
        type: "Wellness",
        insight: "Short, calming visual content has a high retention rate for you.",
        patternHint: "High retention here leads to more video content."
    },
    {
        id: 9,
        user: "ProductHunt",
        avatar: "bg-accent-yellow",
        imageUrl: "https://images.unsplash.com/photo-1531297424005-063400c6d2d5?w=800&h=400&fit=crop",
        caption: "Top 5 productivity apps launching this week. #3 will surprise you.",
        likes: "890",
        comments: "34",
        timestamp: "3 DAYS AGO",
        topic: "Productivity / Focus",
        type: "Tech",
        insight: "Listicles trigger a high click-through rate in your history.",
        patternHint: "Clickbait titles are effective on you."
    },
    {
        id: 10,
        user: "NatureEscape",
        avatar: "bg-primary-indigo",
        imageUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=400&fit=crop",
        caption: "Forest bathing: The antidote to screen fatigue.",
        likes: "3.3k",
        comments: "210",
        timestamp: "3 DAYS AGO",
        topic: "Nature / Calm",
        type: "Travel",
        insight: "Nature imagery increases your dwell time by 40%.",
        patternHint: "Visuals of nature increase session duration."
    },
];

function FeedContent() {
    const { updateMetrics, metrics } = useAlgorithm();
    const observerRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const lastScrollY = useRef(0);
    const lastScrollTime = useRef(Date.now());

    // Scroll Observer Logic
    useEffect(() => {
        const options = {
            root: null,
            rootMargin: '-10% 0px -10% 0px', // Trigger when element is in the middle 80% of screen
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const id = Number(entry.target.getAttribute('data-post-id'));
                    const post = FEED_POSTS.find(p => p.id === id);
                    if (post) {
                        updateMetrics({
                            activePostId: id,
                            activePostInsight: post.insight,
                            // We'll need to update the context to accept these new fields if strictly typed,
                            // but for now we can pass them and update the consumer side or context definition.
                            // Assuming updateMetrics accepts partial state merging.
                            // If context is strict, we might need to update it first.
                            // For this step, I'll assume I can pass extra data or I'll update the context next.
                            // Let's pass the whole post object or specific fields to a new 'activePost' state if possible,
                            // but sticking to the existing pattern:
                            activePostTopic: post.topic,
                            activePostType: post.type,
                            activePostPattern: post.patternHint
                        } as any);
                    }
                }
            });
        }, options);

        observerRefs.current.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, [updateMetrics]);

    // Dwell Time & Scroll Velocity Logic
    useEffect(() => {
        const interval = setInterval(() => {
            if (metrics.activePostId) {
                updateMetrics(prev => ({
                    dwellTime: prev.dwellTime + 0.1,
                    engagementScore: Math.min(100, prev.engagementScore + 0.5),
                    sessionInfluence: Math.min(100, prev.sessionInfluence + 0.2)
                }));
            }

            const currentScrollY = window.scrollY;
            const currentTime = Date.now();
            const timeDiff = currentTime - lastScrollTime.current;

            if (timeDiff > 100) {
                const distance = Math.abs(currentScrollY - lastScrollY.current);
                const velocity = distance / timeDiff;
                updateMetrics({ scrollVelocity: velocity });
                lastScrollY.current = currentScrollY;
                lastScrollTime.current = currentTime;
            }
        }, 100);

        return () => clearInterval(interval);
    }, [metrics.activePostId, updateMetrics]);

    return (
        <section className="bg-neutral-50 py-20 min-h-screen relative">
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white to-transparent pointer-events-none opacity-0" />

            <PageContainer>
                <div className="flex flex-col items-center gap-12">

                    {/* Header Area */}
                    <div className="text-center space-y-6 max-w-3xl mx-auto">
                        <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                            Your Feed, Decoded
                        </h2>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                            See what algorithms notice about you as you scroll.
                        </p>

                        {/* Disclaimer */}
                        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 max-w-lg mx-auto">
                            <p className="text-sm text-blue-800/80 text-center font-medium leading-relaxed">
                                🔒 This is a safe demo feed. Nothing here uses your real data.
                            </p>
                        </div>
                    </div>

                    <div className="w-full max-w-6xl relative">
                        {/* Decorative Elements */}
                        <LensGlow size="lg" variant="mint" className="top-20 -left-20 opacity-0" />
                        <LensGlow size="lg" variant="indigo" className="bottom-40 -right-20 opacity-0" />

                        {/* 2-Column Layout: Feed + Algorithm Panel */}
                        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-8 lg:gap-12 relative z-10 items-start">

                            {/* Left Column: Feed Cards */}
                            <div className="space-y-8 flex flex-col items-center lg:items-end">
                                {FEED_POSTS.map((post) => (
                                    <div
                                        key={post.id}
                                        ref={(el) => { if (el) observerRefs.current.set(post.id, el); }}
                                        data-post-id={post.id}
                                        className="scroll-mt-32 w-full max-w-[400px]"
                                    >
                                        <FeedPost post={post} />
                                    </div>
                                ))}
                            </div>

                            {/* Right Column: Sticky Algorithm Panel */}
                            <div className="hidden lg:block">
                                <div className="lg:sticky lg:top-8 lg:self-start space-y-6">
                                    {/* Instructions */}
                                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                                        <h3 className="font-heading font-bold text-base text-neutral-graphite mb-4">How to use this demo</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-start gap-3">
                                                <div className="w-7 h-7 rounded-full bg-primary-teal/10 flex items-center justify-center text-sm font-bold text-primary-teal shrink-0 mt-0.5">1</div>
                                                <p className="text-base text-neutral-graphite/80 leading-relaxed">Just scroll through the posts</p>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="w-7 h-7 rounded-full bg-primary-indigo/10 flex items-center justify-center text-sm font-bold text-primary-indigo shrink-0 mt-0.5">2</div>
                                                <p className="text-base text-neutral-graphite/80 leading-relaxed">Watch the metrics update as you browse</p>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="w-7 h-7 rounded-full bg-secondary-mint/20 flex items-center justify-center text-sm font-bold text-neutral-graphite shrink-0 mt-0.5">3</div>
                                                <p className="text-base text-neutral-graphite/80 leading-relaxed">See what the algorithm learns about you</p>
                                            </div>
                                        </div>
                                    </div>

                                    <InsightPanel />
                                </div>
                            </div>

                            {/* Mobile Algorithm Panel */}
                            <div className="lg:hidden mt-8 sticky bottom-4 z-50">
                                <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl border border-neutral-200 shadow-2xl">
                                    <InsightPanel />
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </PageContainer>
            <FloatingInsightOverlay />

        </section>
    );
}

export function FeedSection() {
    return (
        <AlgorithmProvider>
            <FeedContent />
        </AlgorithmProvider>
    );
}
