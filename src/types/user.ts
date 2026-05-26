export const USER_TYPES = {
  member: "member",
  provider: "provider",
  partner: "partner",
  admin: "admin",
} as const;

export type UserType = (typeof USER_TYPES)[keyof typeof USER_TYPES];

export interface BaseUser {
  id: string;
  networkName: string;
  networkCode: string;
  email: string;
  userType: UserType;
  notificationEnabled?: boolean;
  termsAccepted?: boolean;
  displayId?: string;
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
  partnerId?: string;
  partnerName?: string;
  agentFirstName: string;
  agentLastName: string;
  agentPhone: string;
  agentEmail?: string;
  businessName: string;
  businessCity: string;
  businessState: string;
  businessZip: string;
  businessCategory: string;
  businessAddress: string;
  businessEmail: string;
  businessPhone: string;
}

export interface PartnerUser extends BaseUser {
  userType: "partner";
  partnerCode: string;
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
