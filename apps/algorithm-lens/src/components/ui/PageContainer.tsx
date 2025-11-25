import React from "react";
import { cn } from "../../lib/utils";

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: "default" | "wide" | "narrow";
}

export const PageContainer = React.forwardRef<HTMLDivElement, PageContainerProps>(
    ({ className, size = "default", children, ...props }, ref) => {
        const sizes = {
            default: "max-w-5xl",
            wide: "max-w-7xl",
            narrow: "max-w-3xl",
        };

        return (
            <div
                ref={ref}
                className={cn(
                    "mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12",
                    sizes[size],
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

PageContainer.displayName = "PageContainer";
