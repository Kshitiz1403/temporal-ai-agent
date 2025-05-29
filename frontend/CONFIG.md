# Frontend Configuration

The frontend can be configured using environment variables (prefixed with `VITE_`).

## Available Configuration Options

### API Configuration
- **VITE_API_BASE_URL**: Base URL for the API server
  - Default: `http://localhost:3010/api/agent`
  - Production: `/api/agent` (uses nginx proxy)
  - Development: `http://localhost:3000/api/agent`

- **VITE_API_TIMEOUT**: API request timeout in milliseconds
  - Default: `30000` (30 seconds)

### App Configuration
- **VITE_APP_NAME**: Application name displayed in the UI
  - Default: `Temporal AI Agent`

- **VITE_APP_VERSION**: Application version
  - Default: `1.0.0`

- **VITE_APP_ENV**: Environment mode
  - Default: `development`
  - Options: `development`, `production`

### Polling Configuration
- **VITE_POLL_INTERVAL**: Interval for polling conversation updates (ms)
  - Default: `2000` (2 seconds)

- **VITE_MAX_RETRIES**: Maximum consecutive errors before stopping polling
  - Default: `5`

### UI Configuration
- **VITE_DEBOUNCE_DELAY**: Input debounce delay (ms)
  - Default: `300`

- **VITE_ERROR_DISPLAY_TIME**: Error message display duration (ms)
  - Default: `3000` (3 seconds)

## Usage Examples

### Development (Local API Server)
```bash
# .env.development
VITE_API_BASE_URL=http://localhost:3000/api/agent
VITE_APP_ENV=development
```

### Production (Docker with nginx proxy)
```bash
# docker-compose.yml build args
VITE_API_BASE_URL=/api/agent
VITE_APP_ENV=production
```

### Custom Configuration
```bash
# Custom API server
VITE_API_BASE_URL=https://my-api.example.com/api/agent
VITE_POLL_INTERVAL=5000
VITE_MAX_RETRIES=3
```

## Docker Configuration

In Docker Compose, these are set as build arguments:

```yaml
frontend:
  build:
    args:
      - VITE_API_BASE_URL=/api/agent
      - VITE_APP_NAME=My Custom AI Agent
      - VITE_POLL_INTERVAL=3000
```

## Local Development

For local development, create a `.env.local` file:

```env
VITE_API_BASE_URL=http://localhost:3000/api/agent
VITE_APP_NAME=Temporal AI Agent (Dev)
VITE_APP_ENV=development
``` 