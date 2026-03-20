const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({
    service: 'Gateway Service',
    version: '1.0.0',
    description: 'API Gateway for Azure Microservices Lab',
    endpoints: [
      { method: 'GET', path: '/',          description: 'Service info' },
      { method: 'GET', path: '/health',    description: 'Health check' },
      { method: 'GET', path: '/api/info',  description: 'API information' },
      { method: 'GET', path: '/api/services', description: 'List available services' },
    ],
  });
});

// Health check endpoint (required by lab Task 6)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
  });
});

// API info
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Azure Microservices Lab - Gateway',
    version: '1.0.0',
    region: process.env.AZURE_REGION || 'eastus',
    runtime: `Node.js ${process.version}`,
  });
});

// List available services
app.get('/api/services', (req, res) => {
  res.json({
    services: [
      {
        name: 'gateway',
        status: 'running',
        type: 'Azure Container App',
        description: 'Routes incoming HTTP requests to backend services',
      },
      {
        name: 'frontend',
        status: 'running',
        type: 'Azure Static Web App',
        description: 'Serves the React frontend to end users',
      },
    ],
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Gateway service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
