import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import PointsCircle from "@/components/ui/PointsCircle";

export interface DetailRow {
  label: string;
  value: React.ReactNode;
}

interface EventDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  points?: number;
  rows: DetailRow[];
  actions?: React.ReactNode;
}

const EventDetailDialog = ({
  open,
  onOpenChange,
  title,
  description,
  points,
  rows,
  actions,
}: EventDetailDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>
            {points !== undefined && <PointsCircle points={points} />}
          </div>
        </DialogHeader>
        <ScrollArea className="flex-1 min-h-0 px-6 pb-6">
          <div className="space-y-3 pt-4">
            {rows.map((row, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                  {row.label}
                </span>
                <div className="text-sm text-foreground">{row.value}</div>
              </div>
            ))}
          </div>
          {actions && <div className="pt-4 mt-4 border-t">{actions}</div>}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailDialog;
