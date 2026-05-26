import type { User } from "@/utils/userStorage";

type NewPasswordRequiredChallenge = {
  challengeName: "NEW_PASSWORD_REQUIRED";
  session: string;
  email: string;
};

export type LoginResult =
  | {
      user: User;
    }
  | NewPasswordRequiredChallenge;

async function readJsonOrThrow(response: Response, fallbackMessage: string) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  throw new Error(text || `${fallbackMessage} (${response.status})`);
}

export async function loginWithCognito(email: string, password: string) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await readJsonOrThrow(response, "Authentication failed");

  if (!response.ok) {
    throw new Error(data.error || "Authentication failed");
  }

  if (data.challengeName === "NEW_PASSWORD_REQUIRED") {
    return data as NewPasswordRequiredChallenge;
  }

  return { user: data.user as User };
}

export async function completeNewPasswordChallenge(
  email: string,
  session: string,
  newPassword: string
) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, session, newPassword }),
  });

  const data = await readJsonOrThrow(response, "Failed to set new password");

  if (!response.ok) {
    throw new Error(data.error || "Failed to set new password");
  }

  return data.user as User;
}

export async function confirmPasswordReset(
  email: string,
  code: string,
  newPassword: string
) {
  const response = await fetch("/api/auth/confirm-password-reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code, newPassword }),
  });

  const data = await readJsonOrThrow(response, "Failed to reset password");

  if (!response.ok) {
    throw new Error(data.error || "Failed to reset password");
  }

  return data as { message: string };
}

export async function logout() {
  await fetch("/api/auth/logout", {
    method: "POST",
  });
}
