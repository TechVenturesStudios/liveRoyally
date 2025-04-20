
export type UserType = "member" | "provider" | "partner" | "admin";

export interface BaseUser {
  id: string;
  networkName: string;
  networkCode: string;
  email: string;
  userType: UserType;
  notificationEnabled: boolean;
  termsAccepted: boolean;
}

export interface MemberUser extends BaseUser {
  userType: "member";
  firstName: string;
  lastName: string;
  zipCode: string;
  phoneNumber?: string;
  ethnicity?: string;
  ageGroup?: string;
  gender?: string;
}

export interface ProviderUser extends BaseUser {
  userType: "provider";
  agentFirstName: string;
  agentLastName: string;
  agentPhone: string;
  businessName: string;
  businessCategory: string;
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessZip: string;
  businessEmail: string;
  businessPhone: string;
}

export interface PartnerUser extends BaseUser {
  userType: "partner";
  agentFirstName: string;
  agentLastName: string;
  agentPhone: string;
  organizationName: string;
  organizationAddress: string;
  organizationCity: string;
  organizationState: string;
  organizationZip: string;
  organizationCategory: string;
  organizationEmail: string;
  organizationPhone: string;
}

export interface AdminUser extends BaseUser {
  userType: "admin";
  firstName?: string;
  lastName?: string;
  department?: string;
}

export type User = MemberUser | ProviderUser | PartnerUser | AdminUser;
