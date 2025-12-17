import { Lightbulb } from "lucide-react";
import { cn } from "../../lib/utils";

interface DashboardSummaryCardProps {
  text: string;
  suggestions?: string[];
  semanticColor: "blue" | "green";
  className?: string;
}

export function DashboardSummaryCard({
  text,
  suggestions,
  semanticColor,
  className,
}: DashboardSummaryCardProps) {
  const borderClass = semanticColor === "blue"
    ? "border-l-[var(--dashboard-blue)]"
    : "border-l-[var(--dashboard-green)]";

  const bgClass = semanticColor === "blue"
    ? "bg-[var(--dashboard-blue-tint)]"
    : "bg-[var(--dashboard-green-tint)]";

  const iconColorClass = semanticColor === "blue"
    ? "text-[var(--dashboard-blue)]"
    : "text-[var(--dashboard-green)]";

  return (
    <div
      className={cn(
        "w-full rounded-xl border border-l-4 p-6",
        borderClass,
        bgClass,
        className
      )}
    >
      <div className="flex gap-4">
        <div className={cn("flex-shrink-0 mt-0.5", iconColorClass)}>
          <Lightbulb className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-3">
          <p className="text-base text-foreground leading-relaxed font-medium">
            {text}
          </p>
          {suggestions && suggestions.length > 0 && (
            <ul className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="text-sm text-foreground-secondary leading-relaxed flex items-start gap-2"
                >
                  <span className="text-muted-foreground mt-1.5">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
