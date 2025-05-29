import dotenv from 'dotenv';
import { Algorithm } from "jsonwebtoken";

// Load environment variables
dotenv.config();

// ===========================================
// TEMPORAL AI AGENT CONFIGURATION
// ===========================================

const config = {
  // ===========================================
  // SERVER CONFIGURATION
  // ===========================================
  server: {
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || 'localhost',
    environment: process.env.NODE_ENV || 'development',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  },

  // ===========================================
  // LLM PROVIDER CONFIGURATION
  // ===========================================
  llm: {
    // Default provider and model
    defaultProvider: (process.env.LLM_DEFAULT_PROVIDER as 'openai' | 'anthropic' | 'google') || 'google',
    defaultModel: process.env.LLM_DEFAULT_MODEL || 'gemini-1.5-pro',
    
    // Global LLM settings
    settings: {
      maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '4000'),
      temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
      timeout: parseInt(process.env.LLM_TIMEOUT_MS || '30000'),
      retries: parseInt(process.env.LLM_RETRIES || '3'),
    },

    // Provider configurations
    providers: {
      openai: {
        apiKey: process.env.OPENAI_API_KEY,
        baseUrl: process.env.OPENAI_BASE_URL,
        organization: process.env.OPENAI_ORGANIZATION,
        models: {
          chat: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
          embedding: ['text-embedding-3-large', 'text-embedding-3-small', 'text-embedding-ada-002'],
        },
        defaultChatModel: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o',
        defaultEmbeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
      },
      
      anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY,
        baseUrl: process.env.ANTHROPIC_BASE_URL,
        models: {
          chat: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229'],
        },
        defaultChatModel: process.env.ANTHROPIC_DEFAULT_MODEL || 'claude-3-5-sonnet-20241022',
      },
      
      google: {
        apiKey: process.env.GOOGLE_AI_API_KEY,
        baseUrl: process.env.GOOGLE_AI_BASE_URL,
        models: {
          chat: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro', 'gemini-2.5-flash-preview-05-20', 'gemini-2.5-flash', 'gemini-2.0-flash-exp',],
        },
        defaultChatModel: process.env.GOOGLE_DEFAULT_MODEL || 'gemini-1.5-pro',
      },
    },

    // Model switching settings
    switching: {
      allowDynamicSwitching: process.env.ALLOW_DYNAMIC_MODEL_SWITCHING !== 'false',
      testModelBeforeSwitch: process.env.TEST_MODEL_BEFORE_SWITCH !== 'false',
      fallbackModel: process.env.FALLBACK_MODEL || 'google/gemini-1.5-flash',
    },
  },

  // ===========================================
  // TEMPORAL CONFIGURATION
  // ===========================================
  temporal: {
    server: {
      address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
      namespace: process.env.TEMPORAL_NAMESPACE || 'default',
      tls: process.env.TEMPORAL_TLS === 'true',
    },
    
    taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'ai-agent-queue',
    
    worker: {
      maxConcurrentActivities: parseInt(process.env.TEMPORAL_MAX_ACTIVITIES || '10'),
      maxConcurrentWorkflows: parseInt(process.env.TEMPORAL_MAX_WORKFLOWS || '5'),
      enableLogging: process.env.TEMPORAL_WORKER_LOGGING !== 'false',
    },
    
    workflows: {
      conversationTimeout: parseInt(process.env.CONVERSATION_TIMEOUT_MS || '3600000'), // 1 hour
      activityTimeout: parseInt(process.env.ACTIVITY_TIMEOUT_MS || '300000'), // 5 minutes
      retryPolicy: {
        maximumAttempts: parseInt(process.env.TEMPORAL_MAX_RETRY_ATTEMPTS || '3'),
        backoffCoefficient: parseFloat(process.env.TEMPORAL_BACKOFF_COEFFICIENT || '2.0'),
      },
    },
  },

  // ===========================================
  // CONVERSATION SETTINGS
  // ===========================================
  conversation: {
    // History management
    maxHistoryLength: parseInt(process.env.MAX_CONVERSATION_HISTORY || '100'),
    summarizationThreshold: parseInt(process.env.SUMMARIZATION_THRESHOLD || '50'),
    autoSummarize: process.env.AUTO_SUMMARIZE !== 'false',
    
    // Default conversation settings
    defaultGoal: process.env.DEFAULT_GOAL || 'Assist the user with their requests',
    defaultPersonality: process.env.DEFAULT_PERSONALITY || 'helpful, professional, and concise',
    
    // Input validation
    maxInputLength: parseInt(process.env.MAX_INPUT_LENGTH || '10000'),
    relevanceCheck: process.env.RELEVANCE_CHECK !== 'false',
    relevanceThreshold: parseFloat(process.env.RELEVANCE_THRESHOLD || '0.7'),
  },

  // ===========================================
  // TOOL CONFIGURATION
  // ===========================================
  tools: {
    // Tool execution settings
    approvalRequired: process.env.TOOL_APPROVAL_REQUIRED !== 'false',
    approvalTimeout: parseInt(process.env.TOOL_APPROVAL_TIMEOUT_MS || '300000'), // 5 minutes
    maxConcurrentTools: parseInt(process.env.MAX_CONCURRENT_TOOLS || '3'),
    
    // Tool categories that require approval
    approvalRequiredFor: (process.env.APPROVAL_REQUIRED_TOOLS || 'createInvoice,sendEmail,deleteData').split(','),
    
    // Mock tools for development
    enableMockTools: process.env.ENABLE_MOCK_TOOLS !== 'false',
    mockDelay: parseInt(process.env.MOCK_TOOL_DELAY_MS || '1000'),
  },

  // ===========================================
  // STORAGE CONFIGURATION
  // ===========================================
  storage: {
    // Redis for caching and sessions
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      ttl: {
        conversations: parseInt(process.env.REDIS_CONVERSATION_TTL || '86400'), // 24 hours
        toolApprovals: parseInt(process.env.REDIS_APPROVAL_TTL || '1800'), // 30 minutes
        modelCache: parseInt(process.env.REDIS_MODEL_CACHE_TTL || '3600'), // 1 hour
      },
    },
    
    // Database for persistent storage
  database: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      name: process.env.DB_NAME || 'temporal_ai_agent',
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      ssl: process.env.DB_SSL === 'true',
      maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
  },
  },

  // ===========================================
  // SECURITY & AUTHENTICATION
  // ===========================================
  security: {
    jwt: {
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      algorithm: 'HS256' as const,
    },
    
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    },
    
    apiKeys: {
      required: process.env.API_KEY_REQUIRED === 'true',
      keys: process.env.VALID_API_KEYS?.split(',') || [],
    },
  },

  // ===========================================
  // LOGGING & MONITORING
  // ===========================================
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING !== 'false',
    enableLLMLogging: process.env.ENABLE_LLM_LOGGING !== 'false',
    enableToolLogging: process.env.ENABLE_TOOL_LOGGING !== 'false',
    
    // Log destinations
    console: process.env.LOG_TO_CONSOLE !== 'false',
    file: {
      enabled: process.env.LOG_TO_FILE === 'true',
      path: process.env.LOG_FILE_PATH || './logs/app.log',
      maxSize: process.env.LOG_MAX_SIZE || '10m',
      maxFiles: parseInt(process.env.LOG_MAX_FILES || '5'),
    },
  },

  // ===========================================
  // DEVELOPMENT & DEBUGGING
  // ===========================================
  development: {
    enabled: process.env.NODE_ENV === 'development',
    enableDebugRoutes: process.env.ENABLE_DEBUG_ROUTES === 'true',
    enableDetailedErrors: process.env.ENABLE_DETAILED_ERRORS !== 'false',
    mockExternalServices: process.env.MOCK_EXTERNAL_SERVICES === 'true',
    
    // Testing settings
    enableTestMode: process.env.ENABLE_TEST_MODE === 'true',
    testApiKey: process.env.TEST_API_KEY || 'test-key',
    },

  // ===========================================
  // Logs
  // ===========================================
  logs: {
    level: process.env.LOG_LEVEL || 'info',
  },

};

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

// Get full model identifier (provider/model)
export const getFullModelId = (provider?: string, model?: string) => {
  const actualProvider = provider || config.llm.defaultProvider;
  const actualModel = model || config.llm.defaultModel;
  return `${actualProvider}/${actualModel}`;
};

// Check if a provider is configured
export const isProviderConfigured = (provider: 'openai' | 'anthropic' | 'google') => {
  const providerConfig = config.llm.providers[provider];
  return !!providerConfig.apiKey;
};

// Get configured providers
export const getConfiguredProviders = () => {
  return Object.keys(config.llm.providers).filter(provider => 
    isProviderConfigured(provider as 'openai' | 'anthropic' | 'google')
  );
};

// Validate model identifier
export const isValidModel = (modelId: string) => {
  if (modelId.includes('/')) {
    const [provider, model] = modelId.split('/');
    const providerConfig = config.llm.providers[provider as keyof typeof config.llm.providers];
    return providerConfig && providerConfig.models.chat.includes(model);
  }
  return config.llm.providers[config.llm.defaultProvider].models.chat.includes(modelId);
};

// Export the main config as default
export default config;

// Export specific configs for convenience
export const llmConfig = config.llm;
export const temporalConfig = config.temporal;
export const conversationConfig = config.conversation;
export const toolsConfig = config.tools;
export const securityConfig = config.security;
