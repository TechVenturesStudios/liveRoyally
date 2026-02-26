// src/utils/userStorage.ts
import { UserType } from "@/types/user";

export interface User {
  id: string;
  email: string;
  userType: UserType;

  displayId?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;

  profile?: {
    // Shared-ish
    networkName?: string;
    networkCode?: string;
    notificationEnabled?: boolean;
    termsAccepted?: boolean;

    // Member fields
    zipCode?: string;
    ethnicity?: string;
    ageGroup?: string;
    gender?: string;

    // Provider fields
    agentFirstName?: string;
    agentLastName?: string;
    agentPhone?: string;
    businessName?: string;
    businessCategory?: string;
    businessAddress?: string;
    businessCity?: string;
    businessState?: string;
    businessZip?: string;
    businessEmail?: string;
    businessPhone?: string;

    // Partner fields
    partnerAgentFirstName?: string;   // ✅ add
    partnerAgentLastName?: string;    // ✅ add
    partnerAgentPhone?: string;       // ✅ add

    organizationName?: string;
    organizationCategory?: string;
    organizationAddress?: string;
    organizationCity?: string;
    organizationState?: string;
    organizationZip?: string;
    organizationEmail?: string;
    organizationPhone?: string;
  };
}

export const getUserFromStorage = (): User | null => {
  if (typeof window === "undefined") return null;
  const userJson = localStorage.getItem("user");
  if (!userJson) return null;

  try {
    return JSON.parse(userJson) as User;
  } catch {
    return null;
  }
};

export const saveUserToStorage = (user: User) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("user", JSON.stringify(user));
};

export const removeUserFromStorage = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("user");
};
