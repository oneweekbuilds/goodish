import React from "react";
import { cn } from "../../lib/utils";

interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: "default" | "primary" | "secondary" | "accent";
}

export const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
    ({ className, variant = "default", children, ...props }, ref) => {
        const variants = {
            default: "bg-neutral-150 text-neutral-graphite",
            primary: "bg-primary-teal/10 text-primary-teal",
            secondary: "bg-secondary-lavender text-primary-indigo",
            accent: "bg-accent-yellow/30 text-neutral-graphite",
        };

        return (
            <span
                ref={ref}
                className={cn(
                    "inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-medium transition-colors",
                    variants[variant],
                    className
                )}
                {...props}
            >
                {children}
            </span>
        );
    }
);

Tag.displayName = "Tag";
