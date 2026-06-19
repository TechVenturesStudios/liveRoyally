param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$Version,

  [string]$Region = "us-east-2",
  [string]$AccountId = "609948378142",
  [string]$Repository = "live-royally"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

Set-Location $PSScriptRoot
Set-Location ..

$registry = "$AccountId.dkr.ecr.$Region.amazonaws.com"
$localTag = "${Repository}:$Version"
$remoteTag = "${registry}/${Repository}:$Version"

Write-Host "Logging in to ECR registry $registry..."
aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $registry

Write-Host "Building image $localTag..."
docker build -t $localTag .

Write-Host "Tagging image as $remoteTag..."
docker tag $localTag $remoteTag

Write-Host "Pushing image $remoteTag..."
docker push $remoteTag

Write-Host "Done. Pushed $remoteTag"
