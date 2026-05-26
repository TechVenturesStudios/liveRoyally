export function isMissingAwsCredentialsError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === "CredentialsProviderError" ||
    error.message.includes("Could not load credentials from any providers")
  );
}

export function missingAwsCredentialsMessage(action: string) {
  return [
    `AWS credentials are required to ${action}.`,
    "Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY, or set AWS_PROFILE to a local profile with Cognito permissions.",
  ].join(" ");
}
