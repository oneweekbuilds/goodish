import React from "react";
import { cn } from "../../lib/utils";

interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    description?: string;
    align?: "left" | "center" | "right";
}

export const SectionHeader = React.forwardRef<HTMLDivElement, SectionHeaderProps>(
    ({ className, title, description, align = "left", ...props }, ref) => {
        const alignments = {
            left: "text-left",
            center: "text-center mx-auto",
            right: "text-right ml-auto",
        };

        return (
            <div
                ref={ref}
                className={cn("mb-8 md:mb-12 max-w-3xl", alignments[align], className)}
                {...props}
            >
                <h2 className="font-heading text-3xl md:text-4xl font-bold text-neutral-graphite mb-4 tracking-tight">
                    {title}
                </h2>
                {description && (
                    <p className="text-lg text-neutral-graphite/70 leading-relaxed font-sans">
                        {description}
                    </p>
                )}
            </div>
        );
    }
);

SectionHeader.displayName = "SectionHeader";
