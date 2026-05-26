import type { UserType } from "@/types/user";

type CreateCognitoUserInput = {
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  userType: UserType;
};

export async function createCognitoUser(input: CreateCognitoUserInput) {
  const response = await fetch("/api/create-cognito-user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to create Cognito user");
  }

  return data as { cognitoSub: string; username: string };
}
