import React from "react";
import { cn } from "../../lib/utils";
import { ChevronDown } from "lucide-react";

interface ScrollIndicatorProps extends React.HTMLAttributes<HTMLDivElement> { }

export const ScrollIndicator = React.forwardRef<HTMLDivElement, ScrollIndicatorProps>(
    ({ className, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "flex flex-col items-center justify-center gap-2 animate-pulse-soft text-neutral-graphite/50",
                    className
                )}
                {...props}
            >
                <span className="text-xs font-medium uppercase tracking-widest">Scroll</span>
                <ChevronDown className="w-5 h-5 animate-bounce" />
            </div>
        );
    }
);

ScrollIndicator.displayName = "ScrollIndicator";
