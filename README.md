# Azure Microservices Lab — SE4010 (SLIIT 2026)

Complete project for the Azure Microservices Deployment Lab.

## Project Structure

```
azure-microservices-lab/
├── gateway/               # Node.js Express gateway microservice
│   ├── server.js
│   ├── package.json
│   ├── Dockerfile
│   └── .dockerignore
└── frontend/              # React static web app
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── App.js
    │   ├── App.css
    │   └── index.js
    └── package.json
```

## Quick Start (Local)

### Gateway
```bash
cd gateway
npm install
npm start
# Runs on http://localhost:3000
```

### Frontend
```bash
cd frontend
npm install
npm start
# Runs on http://localhost:3001
```

## Azure Deployment Commands

### Variables (update with your values)
```bash
REGISTRY=sliitmicroregistry        # or sliitmicroregistry<yourStudentID>
RG=microservices-rg
LOCATION=eastus
```

### Task 1 – Login
```bash
az login
az account show
```

### Task 2 – Resource Group & ACR
```bash
az group create --name $RG --location $LOCATION

az acr create --resource-group $RG --name $REGISTRY --sku Basic

az acr login --name $REGISTRY
```

### Task 3 – Build & Push Docker Image
```bash
docker build -t $REGISTRY.azurecr.io/gateway:v1 ./gateway

docker push $REGISTRY.azurecr.io/gateway:v1

az acr repository list --name $REGISTRY --output table
```

### Task 4 – Deploy Container App
```bash
az provider register --namespace Microsoft.App --wait
az provider register --namespace Microsoft.OperationalInsights --wait

az containerapp env create \
  --name micro-env \
  --resource-group $RG \
  --location $LOCATION

az acr update -n $REGISTRY --admin-enabled true

ACR_PASSWORD=$(az acr credential show --name $REGISTRY --query "passwords[0].value" -o tsv)

az containerapp create \
  --name gateway \
  --resource-group $RG \
  --environment micro-env \
  --image $REGISTRY.azurecr.io/gateway:v1 \
  --target-port 3000 \
  --ingress external \
  --registry-server $REGISTRY.azurecr.io \
  --registry-username $REGISTRY \
  --registry-password $ACR_PASSWORD

# Get the public URL
az containerapp show \
  --name gateway \
  --resource-group $RG \
  --query properties.configuration.ingress.fqdn \
  --output tsv
```

### Task 5 – Deploy Static Web App
```bash
az staticwebapp create \
  --name sliit-frontend-app \
  --resource-group $RG \
  --location eastus \
  --source https://github.com/<your-username>/<your-repo> \
  --branch main \
  --app-location "/frontend" \
  --output-location "build"

# Set API URL to point to gateway
az staticwebapp appsettings set \
  --name sliit-frontend-app \
  --resource-group $RG \
  --setting-names REACT_APP_API_URL=https://<gateway-fqdn>

# Get frontend URL
az staticwebapp show \
  --name sliit-frontend-app \
  --resource-group $RG \
  --query defaultHostname \
  --output tsv
```

### Task 6 – Verify & Cleanup
```bash
# List all resources
az resource list --resource-group $RG --output table

# Test gateway health endpoint
curl https://<gateway-fqdn>/health

# View logs
az containerapp logs show --name gateway --resource-group $RG --follow false

# CLEANUP (run after screenshots)
az group delete --name $RG --yes
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Service info & available endpoints |
| GET | `/health` | Health check — returns `{ "status": "ok" }` |
| GET | `/api/info` | Gateway runtime info |
| GET | `/api/services` | List of deployed services |
