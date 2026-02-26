import React from "react";
import { LayoutGrid, List } from "lucide-react";

interface ViewToggleProps {
  viewMode: "grid" | "list";
  onViewChange: (mode: "grid" | "list") => void;
}

const ViewToggle = ({ viewMode, onViewChange }: ViewToggleProps) => {
  return (
    <div className="flex border rounded-md overflow-hidden">
      <button
        onClick={() => onViewChange("grid")}
        className={`p-1.5 transition-colors ${
          viewMode === "grid"
            ? "bg-primary text-primary-foreground"
            : "bg-background text-muted-foreground hover:text-foreground"
        }`}
        aria-label="Grid view"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button
        onClick={() => onViewChange("list")}
        className={`p-1.5 transition-colors ${
          viewMode === "list"
            ? "bg-primary text-primary-foreground"
            : "bg-background text-muted-foreground hover:text-foreground"
        }`}
        aria-label="List view"
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
};

export default ViewToggle;
