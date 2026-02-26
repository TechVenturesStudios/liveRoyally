
import React from "react";
import { UserType } from "@/types/user";
import DashboardCard from "./DashboardCard";
import { getDashboardCards } from "@/utils/dashboardCardItems";

interface DashboardCardsProps {
  userType: UserType;
}

const DashboardCards = ({ userType }: DashboardCardsProps) => {
  const dashboardCards = getDashboardCards(userType);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
      {dashboardCards.map((card, index) => (
        <DashboardCard
          key={index}
          title={card.title}
          description={card.description}
          icon={card.icon}
          path={card.path}
          color={card.color}
          stats={card.stats}
        />
      ))}
    </div>
  );
};

export default DashboardCards;
