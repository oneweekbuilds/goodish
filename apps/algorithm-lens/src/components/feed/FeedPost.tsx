import { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';
import { useAlgorithm } from '../../context/algorithmContext';

interface FeedPostProps {
    post: {
        id: number;
        user: string;
        avatar: string;
        imageUrl: string;
        caption: string;
        likes: string;
        comments: string;
        timestamp: string;
    };
}

export function FeedPost({ post }: FeedPostProps) {
    const [isLiked, setIsLiked] = useState(false);
    const { updateMetrics } = useAlgorithm();

    const handleInteraction = () => {
        updateMetrics((prev) => ({ clickCount: prev.clickCount + 1 }));
    };

    const handleLike = () => {
        setIsLiked(!isLiked);
        handleInteraction();
    };

    const handleMouseEnter = () => {
        updateMetrics((prev) => ({ hoverCount: prev.hoverCount + 1 }));
    };

    return (
        <div className="w-full mx-auto">
            <Card
                className={cn(
                    "overflow-hidden rounded-xl bg-card border border-border shadow-sm transition-all duration-300",
                    "hover:shadow-md"
                )}
                onMouseEnter={handleMouseEnter}
            >
                {/* Header */}
                <div className="px-3 py-3 flex items-center justify-between bg-card">
                    <div className="flex items-center gap-2.5">
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm",
                            post.avatar
                        )}>
                            {post.user.charAt(0)}
                        </div>
                        <div className="flex flex-col leading-none gap-1">
                            <span className="font-heading font-bold text-sm text-neutral-graphite">
                                {post.user}
                            </span>
                            <span className="text-[10px] text-neutral-graphite/50 font-medium">
                                Original Audio
                            </span>
                        </div>
                    </div>
                    <div className="text-neutral-400 hover:text-neutral-600 cursor-pointer">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
                    </div>
                </div>

                {/* Image */}
                <div className="aspect-[3/2] w-full relative bg-neutral-100">
                    <img
                        src={post.imageUrl}
                        alt={post.caption}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                </div>

                {/* Actions */}
                <div className="px-3 pt-3 pb-3">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-4">
                            <Heart
                                className={cn(
                                    "w-6 h-6 transition-all cursor-pointer stroke-[1.5]",
                                    isLiked ? "fill-red-500 text-red-500" : "text-neutral-graphite hover:text-neutral-600"
                                )}
                                onClick={handleLike}
                            />
                            <MessageCircle
                                className="w-6 h-6 text-neutral-graphite hover:text-neutral-600 transition-all cursor-pointer stroke-[1.5]"
                                onClick={handleInteraction}
                            />
                            <Share2
                                className="w-6 h-6 text-neutral-graphite hover:text-neutral-600 transition-all cursor-pointer stroke-[1.5]"
                                onClick={handleInteraction}
                            />
                        </div>
                        <Bookmark
                            className="w-6 h-6 text-neutral-graphite hover:text-neutral-600 transition-all cursor-pointer stroke-[1.5]"
                            onClick={handleInteraction}
                        />
                    </div>

                    <div className="font-heading font-bold text-sm text-neutral-graphite mb-1">
                        {post.likes} likes
                    </div>

                    <div className="font-sans text-sm leading-snug text-neutral-graphite mb-1">
                        <span className="font-bold mr-1.5">{post.user}</span>
                        {post.caption}
                    </div>

                    <div className="font-sans text-[10px] text-neutral-graphite/40 font-medium uppercase tracking-wide mt-1">
                        {post.timestamp}
                    </div>
                </div>
            </Card>
        </div>
    );
}
