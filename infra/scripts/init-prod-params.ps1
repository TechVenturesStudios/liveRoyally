# Creates the /live-royally/prod/* SSM parameters the prod app reads.
# Safe to re-run: existing parameters are left alone unless -Overwrite is passed.
# Square values are copied from staging (sandbox) so prod can be smoke-tested;
# replace them with production Square values before launch (see infra/README.md).
# The database password is not here: CloudFormation generates it in Secrets Manager.
param(
  [string]$Region = "us-east-2",
  [string]$AwsProfile = "live-royally",
  [string]$StagingTaskDefinition = "live-royally-staging:49",
  [switch]$Overwrite
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$aws = @("--profile", $AwsProfile, "--region", $Region)
$prefix = "/live-royally/prod"
$existing = @(aws ssm get-parameters-by-path --path $prefix --query "Parameters[].Name" --output json @aws | ConvertFrom-Json)

function New-RandomBytes([int]$count) {
  $bytes = New-Object byte[] $count
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  return $bytes
}

function Set-Param([string]$name, [string]$value, [string]$type) {
  if (-not $Overwrite -and $existing -contains "$prefix/$name") {
    Write-Host "kept    $name"
    return
  }
  if ([string]::IsNullOrEmpty($value)) { throw "No value for $name" }
  $null = aws ssm put-parameter --name "$prefix/$name" --value $value --type $type --tier Standard --overwrite @aws
  if ($LASTEXITCODE -ne 0) { throw "Failed to set $name" }
  Write-Host "set     $name ($type)"
}

# Generated secrets
Set-Param "EMAIL_SCHEDULER_SECRET" (-join ((New-RandomBytes 32) | ForEach-Object { $_.ToString("x2") })) "SecureString"
Set-Param "SQUARE_OAUTH_ENCRYPTION_KEY" ([Convert]::ToBase64String((New-RandomBytes 32))) "SecureString"
Set-Param "SQUARE_WEBHOOK_SIGNATURE_KEY" "REPLACE_WITH_PRODUCTION_WEBHOOK_SIGNATURE_KEY" "SecureString"

# Square values copied from staging (sandbox) until production credentials exist
$stagingEnv = aws ecs describe-task-definition --task-definition $StagingTaskDefinition --query "taskDefinition.containerDefinitions[0].environment" --output json @aws | ConvertFrom-Json
function Get-StagingValue([string]$name) { ($stagingEnv | Where-Object { $_.name -eq $name }).value }

Set-Param "SQUARE_ACCESS_TOKEN" (Get-StagingValue "SQUARE_ACCESS_TOKEN") "SecureString"
Set-Param "SQUARE_APPLICATION_SECRET" (Get-StagingValue "SQUARE_APPLICATION_SECRET") "SecureString"
foreach ($name in @(
  "SQUARE_ENVIRONMENT",
  "SQUARE_APP_ID",
  "SQUARE_LOCATION_ID",
  "SQUARE_PLAN_VARIATION_STARTER_ID",
  "SQUARE_PLAN_VARIATION_SPOTLIGHT_ID",
  "SQUARE_PLAN_VARIATION_STANDARD_ID",
  "SQUARE_PLAN_VARIATION_PREMIUM_ID",
  "SQUARE_PLAN_VARIATION_ENTERPRISE_ID"
)) {
  Set-Param $name (Get-StagingValue $name) "String"
}

Write-Host "Done. Parameters live under $prefix."
