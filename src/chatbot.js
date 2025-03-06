/**
 * SIP Assistant Server
 * Main entry point for the SIP Assistant server
 */

const path = require('path');
const fs = require('fs');
const { ServerService } = require('./services/server');
const { ApiService } = require('./services/api');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('.env file not found at:', envPath);
  process.exit(1);
}
require('dotenv').config({ path: envPath });

// Create server service
const serverService = new ServerService({
  port: process.env.PORT || 3000
});

// Create API service
const apiService = new ApiService(serverService.getApp());

// Set API service in server service
serverService.setApiService(apiService);

// Start the server
serverService.start().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Export the app for testing
module.exports = serverService.getApp();