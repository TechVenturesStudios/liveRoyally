param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$Version,

  [string]$Region = "us-east-2",
  [string]$AccountId = "609948378142",
  [string]$Repository = "live-royally",
  [string]$AwsProfile = "live-royally",
  # ECS hosts are Graviton (ARM). Pass linux/amd64 only for an x86 task definition.
  [string]$Platform = "linux/arm64"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

Set-Location $PSScriptRoot
Set-Location ..

$registry = "$AccountId.dkr.ecr.$Region.amazonaws.com"
$localTag = "${Repository}:$Version"
$remoteTag = "${registry}/${Repository}:$Version"

Write-Host "Logging in to ECR registry $registry using AWS profile '$AwsProfile'..."
aws ecr get-login-password --profile $AwsProfile --region $Region | docker login --username AWS --password-stdin $registry

Write-Host "Building image $localTag for $Platform..."
docker build --platform $Platform -t $localTag .

Write-Host "Tagging image as $remoteTag..."
docker tag $localTag $remoteTag

Write-Host "Pushing image $remoteTag..."
docker push $remoteTag

# Matching image for one-off database tasks (infra/scripts/deploy-prod.ps1 runs
# its migrations before rolling out $remoteTag). The task runs on x86.
$migrateTag = "${registry}/${Repository}:$Version-migrate"
Write-Host "Building and pushing $migrateTag..."
docker build --platform linux/amd64 --target migrate -t $migrateTag .
docker push $migrateTag

Write-Host "Done. Pushed $remoteTag and $migrateTag"
