import { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';

interface FeedCardProps {
    post: {
        id: number;
        user: string;
        avatar: string;
        imageUrl: string;
        caption: string;
        likes: string;
        comments: string;
        timestamp: string;
        insight: string;
    };
    isActive: boolean;
    onActive: (id: number, metrics: any) => void;
}



export function FeedCard({ post, isActive, onActive }: FeedCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [viewTime, setViewTime] = useState(0);
    const [clickCount, setClickCount] = useState(0);
    const startTimeRef = useRef<number | null>(null);
    const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Track view time when active (scroll) or hovered
    useEffect(() => {
        if (isActive || isHovered) {
            if (!startTimeRef.current) {
                startTimeRef.current = Date.now();
                intervalRef.current = setInterval(() => {
                    setViewTime((prev) => prev + 1);
                }, 1000);
            }
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            startTimeRef.current = null;
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isActive, isHovered]);

    // Report metrics effect
    useEffect(() => {
        if (isActive || isHovered) {
            onActive(post.id, {
                viewTime,
                clickCount,
                engagementScore: Math.min(100, (viewTime * 5) + (clickCount * 10))
            });
        }
    }, [viewTime, clickCount, isActive, isHovered, post.id, onActive]);

    const handleMouseEnter = () => {
        setIsHovered(true);
        // Immediate update on hover
        onActive(post.id, {
            viewTime,
            clickCount,
            engagementScore: Math.min(100, (viewTime * 5) + (clickCount * 10))
        });
    };

    const handleInteraction = () => {
        setClickCount(prev => prev + 1);
    };

    return (
        <Card
            className={cn(
                "overflow-hidden bg-white border transition-all duration-500 ease-out cursor-default relative mx-auto w-full",
                "rounded-post shadow-post", // Enforced tokens
                "max-w-md", // Reduced width
                isActive || isHovered
                    ? "border-primary-teal ring-2 ring-primary-teal/30 -translate-y-1 z-10"
                    : "border-neutral-200 hover:shadow-lg hover:-translate-y-0.5"
            )}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setIsHovered(false)}
            onFocus={handleMouseEnter}
            tabIndex={0}
        >
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between bg-white/50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm",
                        post.avatar
                    )}>
                        {post.user.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-heading font-bold text-sm text-neutral-graphite leading-none">
                            {post.user}
                        </span>
                        <span className="text-[10px] text-neutral-graphite/50 font-medium mt-0.5">
                            Suggested for you
                        </span>
                    </div>
                </div>
                <span className="text-[10px] font-bold text-neutral-graphite/30">
                    ...
                </span>
            </div>

            {/* Image - Reduced aspect ratio (2:1) */}
            <div className="aspect-[2/1] w-full relative overflow-hidden bg-neutral-100">
                <img
                    src={post.imageUrl}
                    alt={post.caption}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    loading="lazy"
                />
            </div>

            {/* Actions & Caption */}
            <div className="px-4 py-3 space-y-2 bg-white">
                <div className="flex items-center gap-4">
                    <Heart
                        className="w-5 h-5 text-neutral-graphite hover:text-red-500 transition-colors cursor-pointer"
                        onClick={handleInteraction}
                    />
                    <MessageCircle
                        className="w-5 h-5 text-neutral-graphite hover:text-primary-indigo transition-colors cursor-pointer"
                        onClick={handleInteraction}
                    />
                    <Share2
                        className="w-5 h-5 text-neutral-graphite hover:text-primary-teal transition-colors cursor-pointer"
                        onClick={handleInteraction}
                    />
                </div>

                <div className="space-y-1">
                    <div className="font-heading font-bold text-xs text-neutral-graphite">
                        {post.likes} likes
                    </div>
                    <div className="font-sans text-sm leading-snug text-neutral-graphite line-clamp-2">
                        <span className="font-bold mr-1.5">{post.user}</span>
                        {post.caption}
                    </div>
                    <div className="font-sans text-[10px] text-neutral-graphite/40 font-medium pt-1 uppercase tracking-wide">
                        {post.timestamp}
                    </div>
                </div>
            </div>
        </Card>
    );
}
