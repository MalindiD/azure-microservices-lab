# Lab 07 - Tasks 2-4 (after Task 1: run `az login` and set subscription if needed)
# Usage: edit variables below, then: .\scripts\azure-lab-tasks-2-4.ps1
# Requires: Docker Desktop running, Azure CLI, logged-in `az` session.

$ErrorActionPreference = "Stop"

$ResourceGroup = "microservices-rg"
# SLIIT / Azure for Students often blocks "eastus" - use an allowed region (try southeastasia first).
$Location      = "southeastasia"
# Must be globally unique (5-50 chars, letters and digits only, lowercase):
$AcrName       = "sliitmicroregistryit22901644"
$EnvName       = "micro-env"
$AppName       = "gateway"
$ImageTag      = "v1"

$acrLoginServer = "$AcrName.azurecr.io"
$imageFull      = "$acrLoginServer/${AppName}:${ImageTag}"

Write-Host "Creating resource group..." -ForegroundColor Cyan
az group create --name $ResourceGroup --location $Location | Out-Null

Write-Host 'Registering Microsoft.ContainerRegistry provider (first-time; may take 1-2 min)...' -ForegroundColor Cyan
az provider register --namespace Microsoft.ContainerRegistry --wait

Write-Host "Creating Azure Container Registry ($AcrName) in $Location ..." -ForegroundColor Cyan
az acr create --resource-group $ResourceGroup --name $AcrName --sku Basic --location $Location

Write-Host "Logging Docker into ACR..." -ForegroundColor Cyan
az acr login --name $AcrName

$gatewayPath = Join-Path $PSScriptRoot "..\gateway" | Resolve-Path
Write-Host "Building image from $gatewayPath ..." -ForegroundColor Cyan
docker build -t $imageFull $gatewayPath

Write-Host "Pushing $imageFull ..." -ForegroundColor Cyan
docker push $imageFull

Write-Host "Ensuring containerapp CLI extension..." -ForegroundColor Cyan
az extension add --name containerapp

Write-Host "Registering providers (may take a minute)..." -ForegroundColor Cyan
az provider register --namespace Microsoft.App --wait
az provider register --namespace Microsoft.OperationalInsights --wait

Write-Host "Creating Container Apps environment..." -ForegroundColor Cyan
az containerapp env create --name $EnvName --resource-group $ResourceGroup --location $Location

Write-Host "Enabling ACR admin user for pull secret..." -ForegroundColor Cyan
az acr update -n $AcrName --admin-enabled true
$creds = az acr credential show --name $AcrName | ConvertFrom-Json
$acrUser = $creds.username
$acrPass = $creds.passwords[0].value

Write-Host "Creating container app..." -ForegroundColor Cyan
az containerapp create `
  --name $AppName `
  --resource-group $ResourceGroup `
  --environment $EnvName `
  --image $imageFull `
  --target-port 3000 `
  --ingress external `
  --registry-server $acrLoginServer `
  --registry-username $acrUser `
  --registry-password $acrPass

$fqdn = az containerapp show --name $AppName --resource-group $ResourceGroup --query "properties.configuration.ingress.fqdn" --output tsv
Write-Host ""
Write-Host "Gateway URL: https://$fqdn" -ForegroundColor Green
Write-Host "Health check: https://$fqdn/health" -ForegroundColor Green
