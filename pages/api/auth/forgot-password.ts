import type { NextApiRequest, NextApiResponse } from "next";
import {
  CognitoIdentityProviderClient,
  ForgotPasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import {
  isMissingAwsCredentialsError,
  missingAwsCredentialsMessage,
} from "../../../lib/aws-errors";

type ForgotPasswordResponse =
  | { message: string }
  | { error: string };

function cognitoForgotPasswordErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "Failed to send password reset email";
  }

  switch (error.name) {
    case "CodeDeliveryFailureException":
      return "Cognito could not deliver the password reset email. Please contact support.";
    case "InvalidParameterException":
      return error.message || "The email address cannot receive a password reset email.";
    case "LimitExceededException":
      return "Too many password reset requests. Please wait and try again.";
    case "UserNotFoundException":
      return "No account was found for that email address.";
    default:
      return error.message || "Failed to send password reset email";
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ForgotPasswordResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const clientId = process.env.COGNITO_CLIENT_ID;

    if (!clientId) {
      throw new Error("Missing Cognito environment configuration");
    }

    const email = String(req.body?.email || "").toLowerCase().trim();

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const cognito = new CognitoIdentityProviderClient({
      region: process.env.AWS_REGION || "us-east-2",
    });

    await cognito.send(
      new ForgotPasswordCommand({
        ClientId: clientId,
        Username: email,
      })
    );

    return res.status(200).json({
      message: "If an account exists for that email, a password reset code has been sent.",
    });
  } catch (error) {
    console.error(error);

    if (isMissingAwsCredentialsError(error)) {
      return res.status(500).json({
        error: missingAwsCredentialsMessage("send a Cognito password reset email"),
      });
    }

    return res.status(400).json({
      error: cognitoForgotPasswordErrorMessage(error),
    });
  }
}
