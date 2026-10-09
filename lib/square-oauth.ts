import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";

const squareEnvironment = (process.env.SQUARE_ENVIRONMENT ?? "sandbox").toLowerCase();
export const squareOauthApiBaseUrl =
  squareEnvironment === "production" || squareEnvironment === "prod"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";
export const squareOauthAuthorizeUrl =
  squareEnvironment === "production" || squareEnvironment === "prod"
    ? "https://connect.squareup.com/oauth2/authorize"
    : "https://connect.squareupsandbox.com/oauth2/authorize";

export const squareOauthScopes = (process.env.SQUARE_OAUTH_SCOPES || "PAYMENTS_WRITE MERCHANT_PROFILE_READ")
  .split(/[\s,]+/)
  .map((scope) => scope.trim())
  .filter(Boolean);

export function squareOauthRedirectUri() {
  const value = String(process.env.SQUARE_OAUTH_REDIRECT_URI || "").trim();
  if (!value) throw new Error("Missing env var SQUARE_OAUTH_REDIRECT_URI");
  return value;
}

function encryptionKey() {
  const raw = String(process.env.SQUARE_OAUTH_ENCRYPTION_KEY || "").trim();
  if (!raw) throw new Error("Missing env var SQUARE_OAUTH_ENCRYPTION_KEY");
  const key = /^[a-f0-9]{64}$/i.test(raw)
    ? Buffer.from(raw, "hex")
    : Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("SQUARE_OAUTH_ENCRYPTION_KEY must decode to 32 bytes");
  return key;
}

export function encryptSquareToken(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString("base64url")).join(".");
}

export function decryptSquareToken(value: string) {
  const [ivValue, tagValue, ciphertextValue] = value.split(".");
  if (!ivValue || !tagValue || !ciphertextValue) throw new Error("Invalid encrypted Square token");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivValue, "base64url"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function createSquareOauthState() {
  return randomBytes(32).toString("base64url");
}

export function hashSquareOauthState(state: string) {
  return createHash("sha256").update(state).digest("hex");
}

export type SquareTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_at?: string;
  merchant_id?: string;
  scopes?: string[];
  error?: string;
  error_description?: string;
};
