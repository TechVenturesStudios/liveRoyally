
import React, { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import RepresentativesTab from "@/components/providers/RepresentativesTab";
import { mockAuthorizedReps, mockNetworkMembers } from "@/data/providerMockData";

const ProviderRepresentativesPage = () => {
  const [authorizedReps, setAuthorizedReps] = useState(mockAuthorizedReps);
  const [networkMembers] = useState(mockNetworkMembers);

  const handleAddRepresentative = (selectedMemberId: string) => {
    const selectedMember = networkMembers.find(member => member.id === selectedMemberId);
    if (selectedMember) {
      setAuthorizedReps([...authorizedReps, {
        id: selectedMember.id,
        name: selectedMember.name,
        email: selectedMember.email,
        phone: "Not provided",
        role: "Assistant Representative",
        status: "active"
      }]);
    }
  };

  const handleRemoveRepresentative = (repId: string) => {
    setAuthorizedReps(authorizedReps.filter(rep => rep.id !== repId));
  };

  return (
    <DashboardLayout>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-3xl font-bold royal-header">Representatives</h1>
        <p className="text-muted-foreground text-xs sm:text-base mt-1 sm:mt-2">
          Manage authorized representatives for your business
        </p>
      </div>

      <RepresentativesTab
        representatives={authorizedReps}
        networkMembers={networkMembers}
        onAddRepresentative={handleAddRepresentative}
        onRemoveRepresentative={handleRemoveRepresentative}
      />
    </DashboardLayout>
  );
};

export default ProviderRepresentativesPage;
