import express from 'express';
import cors from 'cors';
import aiAgentRoutes from './api/aiAgentRoutes';
import config from './config/config';

const app = express();
const PORT = config.server.port;

// Middleware
app.use(cors({
  origin: config.server.corsOrigins,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/agent', aiAgentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Temporal AI Agent API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Temporal AI Agent API',
    version: '1.0.0',
    environment: config.server.environment,
    endpoints: {
      health: '/health',
      agent: '/api/agent',
    },
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: config.development.enableDetailedErrors ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Temporal AI Agent API Server started');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 AI Agent API: http://localhost:${PORT}/api/agent`);
  console.log(`🧠 LLM Model: ${config.llm.defaultModel}`);
  console.log(`⚡ Environment: ${config.server.environment}`);
});

export default app;
