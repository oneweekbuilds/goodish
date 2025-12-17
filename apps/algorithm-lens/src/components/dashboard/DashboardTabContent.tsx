import * as React from "react";
import { cn } from "../../lib/utils";

interface DashboardTabContentProps {
  hero: React.ReactNode;
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  deepDive?: React.ReactNode;
  summary: React.ReactNode;
  semanticColor: "blue" | "green";
  className?: string;
}

export function DashboardTabContent({
  hero,
  primary,
  secondary,
  deepDive,
  summary,
  className,
}: DashboardTabContentProps) {
  return (
    <div className={cn("space-y-10 md:space-y-12", className)}>
      {/* 1. Hero Insight Section */}
      <section className="w-full">
        {hero}
      </section>

      {/* 2. Primary Insight Card */}
      <section className="w-full">
        {primary}
      </section>

      {/* 3. Secondary Insight Grid (max 2 cards) */}
      {secondary && (
        <section className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {secondary}
          </div>
        </section>
      )}

      {/* 4. Expandable Deep-Dive Section */}
      {deepDive && (
        <section className="w-full">
          {deepDive}
        </section>
      )}

      {/* 5. Summary / Action Card */}
      <section className="w-full">
        {summary}
      </section>
    </div>
  );
}
