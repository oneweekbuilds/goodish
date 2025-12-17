import { cn } from "../../lib/utils";

interface DashboardHeroInsightProps {
  headline: string;
  supportingText?: string;
  semanticColor: "blue" | "green";
  className?: string;
}

export function DashboardHeroInsight({
  headline,
  supportingText,
  semanticColor,
  className,
}: DashboardHeroInsightProps) {
  const bgClass = semanticColor === "blue"
    ? "bg-[var(--dashboard-blue-tint)]"
    : "bg-[var(--dashboard-green-tint)]";

  const borderClass = semanticColor === "blue"
    ? "border-[var(--dashboard-blue-border)]"
    : "border-[var(--dashboard-green-border)]";

  return (
    <div
      className={cn(
        "w-full rounded-2xl border p-8 md:p-10",
        bgClass,
        borderClass,
        className
      )}
    >
      <h2
        className="text-xl md:text-2xl font-semibold text-foreground leading-relaxed"
        style={{ fontFamily: "var(--font-headline)" }}
      >
        {headline}
      </h2>
      {supportingText && (
        <p className="mt-3 text-base text-foreground-secondary leading-relaxed">
          {supportingText}
        </p>
      )}
    </div>
  );
}
