"use client";

import { Lock } from "lucide-react";
import { cn } from "../../lib/utils";

export type DashboardTabId =
  | "patterns"
  | "politics"
  | "creators"
  | "ads"
  | "algorithm";

interface TabConfig {
  id: DashboardTabId;
  label: string;
  color: "blue" | "green";
  premiumOnly?: boolean;
}

const TABS: TabConfig[] = [
  { id: "patterns", label: "Patterns in Your Feed", color: "blue" },
  { id: "politics", label: "Politics & Worldview", color: "green" },
  { id: "creators", label: "Creators & Voices", color: "green" },
  { id: "ads", label: "Ads & Influence", color: "blue" },
  { id: "algorithm", label: "What the Algorithm Thinks", color: "blue", premiumOnly: true },
];

interface DashboardTabsProps {
  activeTab: DashboardTabId;
  onTabChange: (tab: DashboardTabId) => void;
  currentPlan: "free" | "premium";
  className?: string;
}

export function DashboardTabs({
  activeTab,
  onTabChange,
  currentPlan,
  className,
}: DashboardTabsProps) {
  const isPremium = currentPlan === "premium";

  return (
    <div
      className={cn(
        "w-full border-b border-border bg-card",
        className
      )}
    >
      <div className="flex overflow-x-auto scrollbar-hide -mb-px">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const isLocked = tab.premiumOnly && !isPremium;
          const colorClass = tab.color === "blue"
            ? "border-[var(--dashboard-blue)]"
            : "border-[var(--dashboard-green)]";

          return (
            <button
              key={tab.id}
              onClick={() => {
                if (!isLocked) {
                  onTabChange(tab.id);
                }
              }}
              disabled={isLocked}
              className={cn(
                "relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200",
                "border-b-2 border-transparent",
                "hover:text-foreground hover:bg-muted/50",
                isActive && [
                  "text-foreground",
                  colorClass,
                ],
                !isActive && "text-muted-foreground",
                isLocked && "opacity-60 cursor-not-allowed"
              )}
            >
              <span>{tab.label}</span>
              {isLocked && (
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { TABS };
