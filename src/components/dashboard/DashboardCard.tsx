
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface DashboardCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  color: string;
  stats?: string;
}

const DashboardCard = ({
  title,
  description,
  icon: Icon,
  path,
  color,
  stats,
}: DashboardCardProps) => {
  const navigate = useNavigate();

  return (
    <Card 
      className="p-6 cursor-pointer hover:shadow-md transition-all"
      onClick={() => navigate(path)}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-barlow font-bold text-lg mb-2">{title}</h3>
          <p className="text-gray-500 text-sm">{description}</p>
          {stats && (
            <p className="text-brand-purple font-medium mt-4">{stats}</p>
          )}
        </div>
        <div className={`rounded-full p-3 ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
};

export default DashboardCard;
