
import React from "react";
import { Card } from "@/components/ui/card";
import { Crown, Building, User, Users } from "lucide-react";

import { UserType } from "@/types/user";

interface UserTypeSelectorProps {
  onSelect: (type: UserType) => void;
  selectedType: UserType | null;
}

const UserTypeSelector = ({ onSelect, selectedType }: UserTypeSelectorProps) => {
  const userTypes = [
    {
      id: "member",
      title: "Member",
      description: "Join as a customer and access exclusive deals",
      icon: User,
      color: "bg-blue-100 text-blue-600",
      borderColor: selectedType === "member" ? "border-royal" : "border-transparent"
    },
    {
      id: "provider",
      title: "Provider",
      description: "Join as a business and offer deals to members",
      icon: Building,
      color: "bg-green-100 text-green-600",
      borderColor: selectedType === "provider" ? "border-royal" : "border-transparent"
    },
    {
      id: "partner",
      title: "Partner",
      description: "Join as an organization and create events",
      icon: Users,
      color: "bg-purple-100 text-purple-600",
      borderColor: selectedType === "partner" ? "border-royal" : "border-transparent"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
      {userTypes.map((type) => (
        <Card 
          key={type.id}
          className={`p-6 cursor-pointer transition-all hover:shadow-md border-2 ${type.borderColor}`}
          onClick={() => onSelect(type.id as UserType)}
        >
          <div className="flex flex-col items-center text-center">
            <div className={`rounded-full p-3 mb-4 ${type.color}`}>
              <type.icon className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">{type.title}</h3>
            <p className="text-gray-500 text-sm">{type.description}</p>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default UserTypeSelector;
