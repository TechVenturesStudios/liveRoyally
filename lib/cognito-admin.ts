import {
  AdminCreateUserCommand,
  AdminGetUserCommand,
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";

import {
  isMissingAwsCredentialsError,
  missingAwsCredentialsMessage,
} from "./aws-errors";

type CreateCognitoUserArgs = {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  userType?: string | null;
};

function getUserPoolId() {
  const userPoolId = process.env.COGNITO_USER_POOL_ID;

  if (!userPoolId) {
    throw new Error("Missing env var COGNITO_USER_POOL_ID");
  }

  return userPoolId;
}

function normalizeUsername(email: string) {
  return email.toLowerCase().trim();
}

async function getSub(
  cognito: CognitoIdentityProviderClient,
  userPoolId: string,
  username: string
) {
  const response = await cognito.send(
    new AdminGetUserCommand({ UserPoolId: userPoolId, Username: username })
  );
  const sub = response.UserAttributes?.find((attribute) => attribute.Name === "sub")?.Value;

  if (!sub) {
    throw new Error("Could not read Cognito sub for created user");
  }

  return sub;
}

export async function createOrGetCognitoUser(args: CreateCognitoUserArgs) {
  const userPoolId = getUserPoolId();
  const region = process.env.AWS_REGION || "us-east-2";
  const cognito = new CognitoIdentityProviderClient({ region });
  const username = normalizeUsername(args.email);
  const firstName = String(args.firstName || "").trim();
  const lastName = String(args.lastName || "").trim();
  const rawPhone = args.phoneNumber ? String(args.phoneNumber).trim() : "";
  const phone = rawPhone
    ? rawPhone.startsWith("+")
      ? rawPhone
      : `+1${rawPhone.replace(/\D/g, "")}`
    : undefined;

  try {
    await cognito.send(
      new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: username,
        DesiredDeliveryMediums: ["EMAIL"],
        UserAttributes: [
          { Name: "email", Value: username },
          { Name: "email_verified", Value: "true" },
          ...(firstName || lastName
            ? [{ Name: "name", Value: `${firstName} ${lastName}`.trim() }]
            : []),
          ...(phone ? [{ Name: "phone_number", Value: phone }] : []),
          ...(args.userType ? [{ Name: "custom:userType", Value: args.userType }] : []),
        ],
      })
    );
  } catch (error) {
    if (!(error instanceof Error) || error.name !== "UsernameExistsException") {
      throw error;
    }
  }

  const cognitoSub = await getSub(cognito, userPoolId, username);

  return { cognitoSub, username };
}

export function mapCognitoError(error: unknown) {
  if (isMissingAwsCredentialsError(error)) {
    return missingAwsCredentialsMessage("create Cognito users");
  }

  return error instanceof Error ? error.message : "Failed to create Cognito user";
}
