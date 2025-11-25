import { useEffect, useRef, useState } from 'react';

interface ViewportTrackingResult {
    isVisible: boolean;
    viewTime: number;
}

/**
 * Custom hook to track how long an element is visible in the viewport
 * Returns isVisible state and total viewTime in seconds
 */
export function useViewportTracking(threshold = 0.5): ViewportTrackingResult {
    const [isVisible, setIsVisible] = useState(false);
    const [viewTime, setViewTime] = useState(0);
    const elementRef = useRef<HTMLDivElement>(null);
    const startTimeRef = useRef<number | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                setIsVisible(entry.isIntersecting);

                if (entry.isIntersecting) {
                    // Element just became visible - start tracking
                    startTimeRef.current = Date.now();
                    intervalRef.current = setInterval(() => {
                        if (startTimeRef.current) {
                            const elapsed = (Date.now() - startTimeRef.current) / 1000;
                            setViewTime((prev) => Math.floor(prev + 1));
                        }
                    }, 1000);
                } else {
                    // Element left viewport - stop tracking
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                    }
                    if (startTimeRef.current) {
                        startTimeRef.current = null;
                    }
                }
            },
            { threshold }
        );

        observer.observe(element);

        return () => {
            observer.disconnect();
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [threshold]);

    return { isVisible, viewTime };
}

export { useViewportTracking as default };
export type { ViewportTrackingResult };
