import type { NextApiRequest, NextApiResponse } from "next";
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { prisma } from "../../../lib/prisma";
import {
  isMissingAwsCredentialsError,
  missingAwsCredentialsMessage,
} from "../../../lib/aws-errors";
import type { UserType } from "@/types/user";

type LoginResponse =
  | {
      user: {
        id: string;
        cognitoId: string;
        email: string;
        userType: UserType;
        displayId?: string;
        firstName?: string;
        lastName?: string;
      };
    }
  | {
      challengeName: "NEW_PASSWORD_REQUIRED";
      session: string;
      email: string;
    }
  | {
      error: string;
    };

function authCookie(name: string, value: string, maxAge: number) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${name}=${encodeURIComponent(value)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function cognitoAuthErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "Authentication failed";
  }

  switch (error.name) {
    case "NotAuthorizedException":
      return "Incorrect email or password.";
    case "PasswordResetRequiredException":
      return "This account requires a password reset before signing in.";
    case "UserNotConfirmedException":
      return "This account has not been confirmed yet.";
    case "UserNotFoundException":
      return "No account was found for that email address.";
    default:
      return error.message || "Authentication failed";
  }
}

async function signInWithAuthResult(
  authResult: {
    IdToken?: string;
    AccessToken?: string;
    RefreshToken?: string;
  },
  res: NextApiResponse<LoginResponse>
) {
  const idToken = authResult.IdToken;
  const accessToken = authResult.AccessToken;
  const refreshToken = authResult.RefreshToken;

  if (!idToken || !accessToken) {
    throw new Error("Cognito did not return an auth session");
  }

  const payload = JSON.parse(
    Buffer.from(idToken.split(".")[1], "base64url").toString("utf8")
  ) as { sub?: string };

  if (!payload.sub) {
    throw new Error("Could not read Cognito user id from token");
  }

  const user = await prisma.users.findUnique({
    where: { cognito_id: payload.sub },
    select: {
      user_id: true,
      cognito_id: true,
      email: true,
      user_type: true,
      display_id: true,
      first_name: true,
      last_name: true,
    },
  });

  if (!user?.user_type) {
    return res.status(404).json({ error: "User does not exist in database" });
  }

  const cookieMaxAge = 60 * 60;
  const cookies = [
    authCookie("lr_id_token", idToken, cookieMaxAge),
    authCookie("lr_access_token", accessToken, cookieMaxAge),
  ];

  if (refreshToken) {
    cookies.push(authCookie("lr_refresh_token", refreshToken, 60 * 60 * 24 * 30));
  }

  res.setHeader("Set-Cookie", cookies);

  return res.status(200).json({
    user: {
      id: user.user_id,
      cognitoId: user.cognito_id,
      email: user.email,
      userType: user.user_type as UserType,
      displayId: user.display_id ?? undefined,
      firstName: user.first_name ?? undefined,
      lastName: user.last_name ?? undefined,
    },
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const userPoolId = process.env.COGNITO_USER_POOL_ID;
    const clientId = process.env.COGNITO_CLIENT_ID;

    if (!userPoolId || !clientId) {
      throw new Error("Missing Cognito environment configuration");
    }

    const email = String(req.body?.email || "").toLowerCase().trim();
    const password = String(req.body?.password || "");
    const newPassword = String(req.body?.newPassword || "");
    const session = String(req.body?.session || "");

    if (!email || (!password && !newPassword)) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const cognito = new CognitoIdentityProviderClient({
      region: process.env.AWS_REGION || "us-east-2",
    });

    if (session && newPassword) {
      const challenge = await cognito.send(
        new RespondToAuthChallengeCommand({
          ClientId: clientId,
          ChallengeName: "NEW_PASSWORD_REQUIRED",
          Session: session,
          ChallengeResponses: {
            USERNAME: email,
            NEW_PASSWORD: newPassword,
          },
        })
      );

      if (challenge.ChallengeName) {
        return res.status(403).json({
          error: `Additional Cognito challenge required: ${challenge.ChallengeName}`,
        });
      }

      return signInWithAuthResult(challenge.AuthenticationResult ?? {}, res);
    }

    const auth = await cognito.send(
      new InitiateAuthCommand({
        ClientId: clientId,
        AuthFlow: "USER_PASSWORD_AUTH",
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      })
    );

    if (auth.ChallengeName) {
      if (auth.ChallengeName === "NEW_PASSWORD_REQUIRED" && auth.Session) {
        return res.status(200).json({
          challengeName: "NEW_PASSWORD_REQUIRED",
          session: auth.Session,
          email,
        });
      }

      return res.status(403).json({
        error: `Additional Cognito challenge required: ${auth.ChallengeName}`,
      });
    }

    return signInWithAuthResult(auth.AuthenticationResult ?? {}, res);
  } catch (error) {
    console.error(error);

    if (isMissingAwsCredentialsError(error)) {
      return res.status(500).json({
        error: missingAwsCredentialsMessage("authenticate with Cognito"),
      });
    }

    return res.status(401).json({
      error: cognitoAuthErrorMessage(error),
    });
  }
}
