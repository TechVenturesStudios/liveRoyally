# Packages the Lambdas and deploys infra/prod.yaml as the live-royally-prod stack.
# Parameters you leave out keep their current stack values. A new -AppImageTag
# applies pending database migrations (from <tag>-migrate) before the app rolls out.
#
#   .\infra\scripts\deploy-prod.ps1 -AppImageTag v45 -DesiredCount 1
param(
  [string]$AppImageTag,
  [string]$MigrateImageTag,
  [Nullable[int]]$DesiredCount,
  [ValidateSet("ENABLED", "DISABLED")]
  [string]$EmailSchedules,
  [switch]$SkipLambdaBuild,
  [switch]$SkipMigrations,
  # Migration names that may run even though they delete data (after review).
  [string[]]$AllowDestructiveMigration = @(),
  [int]$KeepMigrationSnapshots = 3,
  [string]$DbInstance = "live-royally-prod",
  [string]$Region = "us-east-2",
  [string]$AccountId = "609948378142",
  [string]$AwsProfile = "live-royally",
  [string]$StackName = "live-royally-prod",
  [string]$LoadBalancerName = "live-royally-load-balancer"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

Set-Location (Join-Path $PSScriptRoot "..\..")

$aws = @("--profile", $AwsProfile, "--region", $Region)
$registry = "$AccountId.dkr.ecr.$Region.amazonaws.com/live-royally"
$bucket = "live-royally-cfn-artifacts-$AccountId"

function Invoke-Aws {
  aws @args @aws
  if ($LASTEXITCODE -ne 0) { throw "aws $($args[0]) $($args[1]) failed" }
}

$existingBuckets = aws s3api list-buckets --query "Buckets[].Name" --output text @aws
if (($existingBuckets -split "\s+") -notcontains $bucket) {
  Write-Host "Creating artifact bucket $bucket..."
  Invoke-Aws s3api create-bucket --bucket $bucket --create-bucket-configuration "LocationConstraint=$Region" | Out-Null
  Invoke-Aws s3api put-public-access-block --bucket $bucket --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
  $lifecycle = Join-Path ([System.IO.Path]::GetTempPath()) "live-royally-artifacts-lifecycle.json"
  '{"Rules":[{"ID":"expire","Status":"Enabled","Filter":{},"Expiration":{"Days":90}}]}' | Out-File -FilePath $lifecycle -Encoding ascii
  Invoke-Aws s3api put-bucket-lifecycle-configuration --bucket $bucket --lifecycle-configuration "file://$lifecycle"
}

if (-not $SkipLambdaBuild) {
  npm run lambda:package
  if ($LASTEXITCODE -ne 0) { throw "lambda:package failed" }
}

$packaged = Join-Path ([System.IO.Path]::GetTempPath()) "live-royally-prod.packaged.yaml"
Invoke-Aws cloudformation package --template-file infra/prod.yaml --s3-bucket $bucket --s3-prefix prod --output-template-file $packaged | Out-Null

function Deploy-Stack([string[]]$overrides) {
  $deployArgs = @(
    "cloudformation", "deploy",
    "--stack-name", $StackName,
    "--template-file", $packaged,
    "--capabilities", "CAPABILITY_NAMED_IAM",
    "--no-fail-on-empty-changeset",
    "--tags", "Project=live-royally", "Environment=prod"
  )
  if ($overrides.Count -gt 0) { $deployArgs += @("--parameter-overrides") + $overrides }
  Invoke-Aws @deployArgs
}

# A new app image runs its migrations first, while the current version keeps
# serving. safe-migrate.mjs refuses data-deleting migrations, and a snapshot is
# taken before anything is applied. If migrating fails, the app is not updated.
if ($AppImageTag -and -not $SkipMigrations) {
  if (-not $MigrateImageTag) { $MigrateImageTag = "$AppImageTag-migrate" }
  aws ecr describe-images --repository-name live-royally --image-ids "imageTag=$MigrateImageTag" @aws | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Migrate image '$MigrateImageTag' not found. scripts/publish-ecr.ps1 pushes it as <version>-migrate; or pass -MigrateImageTag, or -SkipMigrations."
  }

  Write-Host "Pointing the migrate task at $MigrateImageTag..."
  Deploy-Stack @("MigrateImageUri=${registry}:$MigrateImageTag")

  $dbTask = Join-Path $PSScriptRoot "run-prod-db-task.ps1"
  & $dbTask -Command @("node", "scripts/safe-migrate.mjs", "--check") -AllowDestructiveMigration $AllowDestructiveMigration
  $check = $LASTEXITCODE
  if ($check -eq 2) { throw "A pending migration would delete data; nothing was deployed. See the BLOCKED line above." }
  if ($check -ne 0 -and $check -ne 10) { throw "Migration check failed (exit $check); nothing was deployed." }

  if ($check -eq 10) {
    $snapshotId = "$DbInstance-pre-migrate-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Write-Host "Snapshotting $DbInstance as $snapshotId..."
    Invoke-Aws rds create-db-snapshot --db-instance-identifier $DbInstance --db-snapshot-identifier $snapshotId | Out-Null
    Invoke-Aws rds wait db-snapshot-available --db-snapshot-identifier $snapshotId

    & $dbTask -AllowDestructiveMigration $AllowDestructiveMigration
    if ($LASTEXITCODE -ne 0) { throw "Migration failed (exit $LASTEXITCODE); the app was not updated. Pre-migration snapshot: $snapshotId" }

    $old = aws rds describe-db-snapshots --db-instance-identifier $DbInstance --snapshot-type manual @aws `
      --query "reverse(sort_by(DBSnapshots[?starts_with(DBSnapshotIdentifier, '$DbInstance-pre-migrate-')], &SnapshotCreateTime))[${KeepMigrationSnapshots}:].DBSnapshotIdentifier" --output text
    foreach ($id in ($old -split "\s+" | Where-Object { $_ -and $_ -ne "None" })) {
      Write-Host "Removing old pre-migration snapshot $id"
      Invoke-Aws rds delete-db-snapshot --db-snapshot-identifier $id | Out-Null
    }
  }
}

$overrides = @()
if ($AppImageTag) { $overrides += "AppImageUri=${registry}:$AppImageTag" }
if ($MigrateImageTag) { $overrides += "MigrateImageUri=${registry}:$MigrateImageTag" }
if ($null -ne $DesiredCount) { $overrides += "AppDesiredCount=$DesiredCount" }
if ($EmailSchedules) { $overrides += "EmailScheduleState=$EmailSchedules" }
Deploy-Stack $overrides

# The shared ALB is not part of this stack; make sure it carries the
# stack's ALB security group so prod tasks accept its traffic.
$albSg = aws cloudformation describe-stacks --stack-name $StackName --query "Stacks[0].Outputs[?OutputKey=='AlbSecurityGroupId'].OutputValue | [0]" --output text @aws
$lb = aws elbv2 describe-load-balancers --names $LoadBalancerName --query "LoadBalancers[0].[LoadBalancerArn,SecurityGroups]" --output json @aws | ConvertFrom-Json
$lbArn = $lb[0]
$lbGroups = @($lb[1])
if ($lbGroups -notcontains $albSg) {
  Write-Host "Attaching $albSg to $LoadBalancerName..."
  Invoke-Aws elbv2 set-security-groups --load-balancer-arn $lbArn --security-groups (@($lbGroups) + $albSg) | Out-Null
}

Write-Host "Deployed $StackName."
