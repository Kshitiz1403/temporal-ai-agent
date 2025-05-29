// Frontend configuration
const config = {
 // API Configuration
 api: {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3010/api/agent',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,
 },

 // App Configuration
 app: {
  name: import.meta.env.VITE_APP_NAME || 'Temporal AI Agent',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  environment: import.meta.env.VITE_APP_ENV || 'development',
 },

 // Polling Configuration
 polling: {
  interval: parseInt(import.meta.env.VITE_POLL_INTERVAL) || 2000,
  maxRetries: parseInt(import.meta.env.VITE_MAX_RETRIES) || 5,
 },

 // UI Configuration
 ui: {
  debounceDelay: parseInt(import.meta.env.VITE_DEBOUNCE_DELAY) || 300,
  errorDisplayTime: parseInt(import.meta.env.VITE_ERROR_DISPLAY_TIME) || 3000,
 }
};

export default config; 