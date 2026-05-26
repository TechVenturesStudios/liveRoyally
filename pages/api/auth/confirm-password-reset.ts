import type { NextApiRequest, NextApiResponse } from "next";
import {
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import {
  isMissingAwsCredentialsError,
  missingAwsCredentialsMessage,
} from "../../../lib/aws-errors";

type ConfirmPasswordResetResponse =
  | {
      message: string;
    }
  | {
      error: string;
    };

function cognitoResetErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "Failed to reset password";
  }

  switch (error.name) {
    case "CodeMismatchException":
      return "The verification code is incorrect.";
    case "ExpiredCodeException":
      return "The verification code has expired. Request a new password reset code.";
    case "InvalidPasswordException":
      return error.message || "The new password does not meet the password requirements.";
    case "LimitExceededException":
      return "Too many attempts. Please wait and try again.";
    case "UserNotFoundException":
      return "No account was found for that email address.";
    default:
      return error.message || "Failed to reset password";
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ConfirmPasswordResetResponse>
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
    const code = String(req.body?.code || "").trim();
    const newPassword = String(req.body?.newPassword || "");

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        error: "Email, verification code, and new password are required",
      });
    }

    const cognito = new CognitoIdentityProviderClient({
      region: process.env.AWS_REGION || "us-east-2",
    });

    await cognito.send(
      new ConfirmForgotPasswordCommand({
        ClientId: clientId,
        Username: email,
        ConfirmationCode: code,
        Password: newPassword,
      })
    );

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error(error);

    if (isMissingAwsCredentialsError(error)) {
      return res.status(500).json({
        error: missingAwsCredentialsMessage("reset Cognito passwords"),
      });
    }

    return res.status(400).json({
      error: cognitoResetErrorMessage(error),
    });
  }
}
