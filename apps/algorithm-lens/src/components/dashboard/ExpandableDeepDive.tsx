"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";

interface ExpandableDeepDiveProps {
  title?: string;
  children: React.ReactNode;
  semanticColor: "blue" | "green";
  defaultOpen?: boolean;
  className?: string;
}

export function ExpandableDeepDive({
  title = "Explore deeper",
  children,
  semanticColor,
  defaultOpen = false,
  className,
}: ExpandableDeepDiveProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  const colorClass = semanticColor === "blue"
    ? "text-[var(--dashboard-blue)]"
    : "text-[var(--dashboard-green)]";

  const borderClass = semanticColor === "blue"
    ? "border-[var(--dashboard-blue-border)]"
    : "border-[var(--dashboard-green-border)]";

  const hoverBgClass = semanticColor === "blue"
    ? "hover:bg-[var(--dashboard-blue-tint)]"
    : "hover:bg-[var(--dashboard-green-tint)]";

  return (
    <div className={cn("w-full", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg border transition-all duration-200",
          borderClass,
          hoverBgClass,
          "bg-transparent"
        )}
      >
        <span className={cn("text-sm font-medium", colorClass)}>
          {title}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className={cn("w-4 h-4", colorClass)} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pt-6 space-y-6">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
