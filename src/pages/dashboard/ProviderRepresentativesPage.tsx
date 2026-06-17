import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import RepresentativesTab from "@/components/providers/RepresentativesTab";
import { useToast } from "@/hooks/use-toast";
import { getUserFromStorage } from "@/utils/userStorage";
import {
  addAuthorizedRepresentative,
  fetchAuthorizedRepresentatives,
  removeAuthorizedRepresentative,
  type AuthorizedRepresentative,
  type NetworkMember,
} from "@/api/authorizedRepresentatives";

interface ProviderRepresentativesPageProps {
  ownerType?: "provider" | "partner";
}

type RepresentativeRow = {
  id: string;
  memberId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
};

const toRepresentativeRow = (rep: AuthorizedRepresentative): RepresentativeRow => ({
  id: rep.assignmentId,
  memberId: rep.memberId,
  name: rep.name,
  email: rep.email,
  phone: rep.phone || "Not provided",
  role: rep.role,
  status: rep.status,
});

const ProviderRepresentativesPage = ({ ownerType = "provider" }: ProviderRepresentativesPageProps) => {
  const { toast } = useToast();
  const [authorizedReps, setAuthorizedReps] = useState<RepresentativeRow[]>([]);
  const [networkMembers, setNetworkMembers] = useState<NetworkMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadReps = async () => {
      try {
        setLoading(true);
        setError("");
        const user = getUserFromStorage();
        const data = await fetchAuthorizedRepresentatives(user?.cognitoId);

        if (isMounted) {
          setAuthorizedReps(data.representatives.map(toRepresentativeRow));
          setNetworkMembers(data.networkMembers);
        }
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : "Failed to load authorized representatives";
        if (isMounted) {
          setError(message);
          toast({ title: "Could not load representatives", description: message, variant: "destructive" });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadReps();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const networkMemberRows = useMemo(
    () =>
      networkMembers.map((member) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        memberSince: member.memberSince,
      })),
    [networkMembers]
  );

  const handleAddRepresentative = async (selectedMemberId: string) => {
    const user = getUserFromStorage();
    const member = networkMembers.find((entry) => entry.id === selectedMemberId);
    if (!member) {
      toast({ title: "Member not found", description: "That member is not available in your network.", variant: "destructive" });
      return;
    }

    try {
      const result = await addAuthorizedRepresentative(selectedMemberId, user?.cognitoId);
      setAuthorizedReps((prev) => {
        if (prev.some((rep) => rep.id === result.assignment.assignmentId)) {
          return prev;
        }
        return [...prev, toRepresentativeRow(result.assignment)];
      });
      toast({ title: "Representative Added", description: `${member.name} has been added as a representative.` });
    } catch (addError) {
      const message = addError instanceof Error ? addError.message : "Failed to add representative";
      toast({ title: "Could not add representative", description: message, variant: "destructive" });
    }
  };

  const handleRemoveRepresentative = async (repId: string) => {
    const user = getUserFromStorage();

    try {
      await removeAuthorizedRepresentative(repId, user?.cognitoId);
      setAuthorizedReps((prev) => prev.filter((rep) => rep.id !== repId));
      toast({ title: "Representative Removed", description: "The representative was removed from your network." });
    } catch (removeError) {
      const message = removeError instanceof Error ? removeError.message : "Failed to remove representative";
      toast({ title: "Could not remove representative", description: message, variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-3xl font-bold royal-header">Representatives</h1>
        <p className="text-muted-foreground text-xs sm:text-base mt-1 sm:mt-2">
          Manage authorized representatives for your {ownerType === "partner" ? "partner organization" : "business"}
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <RepresentativesTab
        representatives={authorizedReps}
        networkMembers={networkMemberRows}
        onAddRepresentative={handleAddRepresentative}
        onRemoveRepresentative={handleRemoveRepresentative}
        loading={loading}
      />
    </DashboardLayout>
  );
};

export default ProviderRepresentativesPage;
