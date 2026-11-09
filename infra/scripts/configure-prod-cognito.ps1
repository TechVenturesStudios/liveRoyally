# Points the prod Cognito user pool at SES (instead of Cognito's 50/day default
# sender) and attaches the branded custom-message Lambda from the prod stack.
# UpdateUserPool resets any setting it is not given, so every current setting
# is copied over and only the email sender and trigger are changed.
param(
  [string]$UserPoolId = "us-east-2_SPfoA3iIC",
  [string]$SesIdentity = "localmetrics.net",
  [string]$FromAddress = "Local Metrics <noreply@localmetrics.net>",
  [string]$StackName = "live-royally-prod",
  [string]$Region = "us-east-2",
  [string]$AccountId = "609948378142",
  [string]$AwsProfile = "live-royally"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$aws = @("--profile", $AwsProfile, "--region", $Region)

$customMessageArn = aws cloudformation describe-stacks --stack-name $StackName --query "Stacks[0].Outputs[?OutputKey=='CustomMessageFunctionArn'].OutputValue | [0]" --output text @aws
if (-not $customMessageArn -or $customMessageArn -eq "None") { throw "Stack $StackName has no CustomMessageFunctionArn output" }

$pool = (aws cognito-idp describe-user-pool --user-pool-id $UserPoolId --output json @aws | ConvertFrom-Json).UserPool

$updatable = @(
  "Policies", "DeletionProtection", "LambdaConfig", "AutoVerifiedAttributes",
  "SmsVerificationMessage", "EmailVerificationMessage", "EmailVerificationSubject",
  "VerificationMessageTemplate", "SmsAuthenticationMessage", "UserAttributeUpdateSettings",
  "MfaConfiguration", "DeviceConfiguration", "EmailConfiguration", "SmsConfiguration",
  "UserPoolTags", "AdminCreateUserConfig", "UserPoolAddOns", "AccountRecoverySetting",
  "PoolName", "UserPoolTier"
)

$update = [ordered]@{ UserPoolId = $UserPoolId }
foreach ($name in $updatable) {
  if ($pool.PSObject.Properties.Name -contains $name -and $null -ne $pool.$name) {
    $update[$name] = $pool.$name
  }
}

$lambdaConfig = if ($update.Contains("LambdaConfig")) { $update["LambdaConfig"] } else { [pscustomobject]@{} }
$lambdaConfig | Add-Member -NotePropertyName CustomMessage -NotePropertyValue $customMessageArn -Force
$update["LambdaConfig"] = $lambdaConfig

$update["EmailConfiguration"] = [ordered]@{
  EmailSendingAccount = "DEVELOPER"
  SourceArn = "arn:aws:ses:${Region}:${AccountId}:identity/$SesIdentity"
  From = $FromAddress
}

$inputFile = Join-Path ([System.IO.Path]::GetTempPath()) "live-royally-prod-cognito-update.json"
$update | ConvertTo-Json -Depth 20 | Out-File -FilePath $inputFile -Encoding ascii

aws cognito-idp update-user-pool --cli-input-json "file://$inputFile" @aws
if ($LASTEXITCODE -ne 0) { throw "update-user-pool failed" }

Remove-Item $inputFile
Write-Host "Cognito pool $UserPoolId now sends through SES ($SesIdentity) with the custom-message trigger."
