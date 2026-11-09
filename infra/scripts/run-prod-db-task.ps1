# Runs a one-off command against the prod database from inside the VPC, using
# the migrate image, prints its logs, and exits with the command's exit code.
#
#   .\infra\scripts\run-prod-db-task.ps1                                  # guarded migrate (scripts/safe-migrate.mjs)
#   .\infra\scripts\run-prod-db-task.ps1 npx prisma db seed
#   .\infra\scripts\run-prod-db-task.ps1 node scripts/import-network-codes.mjs scripts/network-codes.csv
[CmdletBinding(PositionalBinding = $false)]
param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$Command = @("node", "scripts/safe-migrate.mjs"),
  # Migration names safe-migrate.mjs may apply even though they delete data.
  [string[]]$AllowDestructiveMigration = @(),
  [string]$Region = "us-east-2",
  [string]$AwsProfile = "live-royally",
  [string]$StackName = "live-royally-prod",
  [string]$Cluster = "live-royally-cluster"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$aws = @("--profile", $AwsProfile, "--region", $Region)

$outputs = aws cloudformation describe-stacks --stack-name $StackName --query "Stacks[0].Outputs" --output json @aws | ConvertFrom-Json
function Get-Output([string]$key) { ($outputs | Where-Object { $_.OutputKey -eq $key }).OutputValue }

$network = "awsvpcConfiguration={subnets=[$(Get-Output 'SubnetIds')],securityGroups=[$(Get-Output 'AppSecurityGroupId')],assignPublicIp=ENABLED}"
$container = @{ name = "migrate"; command = $Command }
if ($AllowDestructiveMigration.Count -gt 0) {
  $container.environment = @(@{ name = "ALLOW_DESTRUCTIVE_MIGRATIONS"; value = ($AllowDestructiveMigration -join ",") })
}
$overrides = @{ containerOverrides = @($container) } | ConvertTo-Json -Depth 5 -Compress
$overridesFile = Join-Path ([System.IO.Path]::GetTempPath()) "live-royally-prod-db-task.json"
$overrides | Out-File -FilePath $overridesFile -Encoding ascii

Write-Host "Running: $($Command -join ' ')"
$taskArn = aws ecs run-task --cluster $Cluster --launch-type FARGATE `
  --task-definition (Get-Output 'MigrateTaskDefinitionArn') `
  --network-configuration $network `
  --overrides "file://$overridesFile" `
  --query "tasks[0].taskArn" --output text @aws
if ($LASTEXITCODE -ne 0 -or -not $taskArn -or $taskArn -eq "None") { throw "run-task failed" }

aws ecs wait tasks-stopped --cluster $Cluster --tasks $taskArn @aws

$task = (aws ecs describe-tasks --cluster $Cluster --tasks $taskArn --output json @aws | ConvertFrom-Json).tasks[0]
$taskId = $taskArn.Split("/")[-1]
# Prisma prints emoji and box-drawing characters that the default Windows
# console code page cannot encode, which makes the AWS CLI fail to print them.
$previousEncoding = [Console]::OutputEncoding
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
try {
  aws logs get-log-events --log-group-name /ecs/live-royally-prod --log-stream-name "migrate/migrate/$taskId" --start-from-head --query "events[].message" --output text @aws |
    ForEach-Object { $_ -split "`t" } | ForEach-Object { Write-Host $_ }
  if ($LASTEXITCODE -ne 0) { Write-Warning "Could not print task logs; see log stream migrate/migrate/$taskId in /ecs/live-royally-prod." }
} catch {
  Write-Warning "Could not print task logs: $_"
} finally {
  [Console]::OutputEncoding = $previousEncoding
}

$exitCode = $task.containers[0].exitCode
if ($null -eq $exitCode) {
  Write-Warning "Task stopped without an exit code: $($task.stoppedReason)"
  exit 1
}
Write-Host "Task exited with $exitCode."
exit $exitCode
