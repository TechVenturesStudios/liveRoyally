import React from "react";
import { LucideIcon } from "lucide-react";

interface MobileFolderTabsProps {
  tabs: { value: string; label: string; icon: LucideIcon }[];
  activeTab: string;
  onTabChange: (value: string) => void;
}

const MobileFolderTabs = ({ tabs, activeTab, onTabChange }: MobileFolderTabsProps) => {
  return (
    <div className="sm:hidden mb-0">
      <div className="flex gap-1 px-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => onTabChange(tab.value)}
              className={`flex-1 flex flex-col items-center gap-0.5 px-2 pt-2.5 pb-2 rounded-t-xl text-[10px] font-medium transition-all ${
                isActive
                  ? "bg-background text-primary border border-b-0 border-border shadow-sm -mb-px z-10 relative"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted/70 border border-transparent"
              }`}
            >
              <tab.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="border border-border rounded-b-xl rounded-tr-none bg-background p-1" />
    </div>
  );
};

export default MobileFolderTabs;
