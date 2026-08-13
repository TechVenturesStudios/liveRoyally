import { createHash, createHmac, type BinaryLike } from "node:crypto";

type SendSesEmailInput = {
  toEmail: string;
  subject: string;
  textBody: string;
  htmlBody: string;
  replyToAddresses?: string[];
  configurationSetName?: string;
};

type SendSesEmailResult = {
  messageId: string;
};

function getRegion() {
  return process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-2";
}

function getFromEmailAddress() {
  const fromEmail =
    process.env.SES_FROM_EMAIL ||
    process.env.SES_FROM_ADDRESS ||
    process.env.AWS_SES_FROM_EMAIL ||
    "";

  if (!fromEmail.trim()) {
    throw new Error("Missing env var SES_FROM_EMAIL");
  }

  return fromEmail.trim();
}

function getConfigurationSetName() {
  return (
    process.env.SES_CONFIGURATION_SET_NAME ||
    process.env.AWS_SES_CONFIGURATION_SET_NAME ||
    ""
  ).trim();
}

function toAmzDate(date: Date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function sha256Hex(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function hmacBuffer(key: BinaryLike, value: string) {
  return createHmac("sha256", key).update(value, "utf8").digest();
}

function hmacHex(
  key: BinaryLike,
  value: string,
) {
  return createHmac("sha256", key).update(value, "utf8").digest("hex");
}

function getSigningKey(secretAccessKey: string, dateStamp: string, region: string, service: string) {
  const kDate = hmacBuffer(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmacBuffer(kDate, region);
  const kService = hmacBuffer(kRegion, service);
  return hmacBuffer(kService, "aws4_request");
}

function normalizeHeaderValue(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function buildCanonicalHeaders(headers: Record<string, string>) {
  const sortedHeaderNames = Object.keys(headers).sort();
  const canonicalHeaders = sortedHeaderNames
    .map((name) => `${name}:${normalizeHeaderValue(headers[name])}\n`)
    .join("");

  return {
    canonicalHeaders,
    signedHeaders: sortedHeaderNames.join(";"),
  };
}

export async function sendSesSimpleEmail(
  input: SendSesEmailInput
): Promise<SendSesEmailResult> {
  const region = getRegion();
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
  const sessionToken = process.env.AWS_SESSION_TOKEN?.trim();
  const fromEmailAddress = getFromEmailAddress();
  const configurationSetName = input.configurationSetName || getConfigurationSetName();

  if (!accessKeyId || !secretAccessKey) {
    throw new Error("Missing AWS credentials for SES");
  }

  const endpoint = `https://email.${region}.amazonaws.com/v2/email/outbound-emails`;
  const payload = JSON.stringify({
    FromEmailAddress: fromEmailAddress,
    Destination: {
      ToAddresses: [input.toEmail],
    },
    Content: {
      Simple: {
        Subject: {
          Data: input.subject,
          Charset: "UTF-8",
        },
        Body: {
          Text: {
            Data: input.textBody,
            Charset: "UTF-8",
          },
          Html: {
            Data: input.htmlBody,
            Charset: "UTF-8",
          },
        },
      },
    },
    ...(configurationSetName ? { ConfigurationSetName: configurationSetName } : {}),
    ...(input.replyToAddresses && input.replyToAddresses.length > 0
      ? { ReplyToAddresses: input.replyToAddresses }
      : {}),
  });

  const now = new Date();
  const amzDate = toAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(payload);
  const host = `email.${region}.amazonaws.com`;
  const canonicalHeadersInput: Record<string, string> = {
    "content-type": "application/json",
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };

  if (sessionToken) {
    canonicalHeadersInput["x-amz-security-token"] = sessionToken;
  }

  const { canonicalHeaders, signedHeaders } = buildCanonicalHeaders(canonicalHeadersInput);
  const canonicalRequest = [
    "POST",
    "/v2/email/outbound-emails",
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");
  const algorithm = "AWS4-HMAC-SHA256";
  const credentialScope = `${dateStamp}/${region}/ses/aws4_request`;
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");
  const signature = hmacHex(getSigningKey(secretAccessKey, dateStamp, region, "ses"), stringToSign);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Amz-Content-Sha256": payloadHash,
      "X-Amz-Date": amzDate,
      ...(sessionToken ? { "X-Amz-Security-Token": sessionToken } : {}),
      Authorization: `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
    body: payload,
  });

  const responseText = await response.text();
  let parsedResponse: { MessageId?: string; message?: string; Message?: string } | null = null;

  if (responseText.trim()) {
    try {
      parsedResponse = JSON.parse(responseText) as typeof parsedResponse;
    } catch {
      parsedResponse = null;
    }
  }

  if (!response.ok) {
    throw new Error(
      parsedResponse?.message ||
        parsedResponse?.Message ||
        responseText ||
        `SES send failed with status ${response.status}`
    );
  }

  const messageId = parsedResponse?.MessageId?.trim();
  if (!messageId) {
    throw new Error("SES did not return a message ID");
  }

  return { messageId };
}
