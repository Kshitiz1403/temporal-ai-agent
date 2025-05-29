# 🐳 Docker Setup for Temporal AI Agent

This document provides instructions for running the Temporal AI Agent using Docker containers.

## 🏗️ Architecture

The containerized application consists of:

- **Frontend** (React + Nginx) - Port 3011
- **API Server** (Node.js/Express) - Port 3010  
- **Worker** (Temporal Worker) - Internal
- **Temporal Server** (SQLite) - Port 3012 (Web UI)

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- At least one LLM provider API key (OpenAI, Anthropic, or Google AI)

### 1. Setup

Run the automated setup script:

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

Or manually:

```bash
# Create environment file
cp .env.example .env
# Edit .env and add your API keys

# Create logs directory
mkdir -p backend/logs

# Start the application
docker-compose up -d
```

### 2. Access the Application

- **Frontend**: http://localhost:3011
- **API Server**: http://localhost:3010
- **Temporal Web UI**: http://localhost:3012

## 🔧 Development Mode

For development with hot reload:

```bash
# Start in development mode
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d

# View logs
docker-compose logs -f api-server worker
```

## 📋 Common Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f [service-name]

# Rebuild containers
docker-compose build

# Full cleanup (removes volumes)
docker-compose down -v

# Check service status
docker-compose ps
```

## 🔍 Troubleshooting

### Services won't start

1. Check logs:
   ```bash
   docker-compose logs [service-name]
   ```

2. Verify API keys in `.env` file

3. Ensure ports are not in use:
   ```bash
   lsof -i :3010 -i :3011 -i :3012
   ```

### API connection issues

1. Verify the API server is running:
   ```bash
   curl http://localhost:3010/api/health
   ```

2. Check container networking:
   ```bash
   docker network ls
   docker network inspect temporal-ai-agent_temporal-agent-network
   ```

### Temporal workflow issues

1. Check Temporal Web UI: http://localhost:3012
2. Verify worker is connected:
   ```bash
   docker-compose logs worker
   ```

## 📝 Environment Variables

Key environment variables (set in `.env`):

```env
# LLM Provider (required)
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here  
GOOGLE_AI_API_KEY=your_key_here

# Default provider
LLM_DEFAULT_PROVIDER=anthropic
LLM_DEFAULT_MODEL=claude-3-5-sonnet-20241022

# Server configuration
NODE_ENV=production
LOG_LEVEL=info
```

## 🐛 Development Tips

### Hot Reload Development

Use the development override:

```bash
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
```

This enables:
- Source code mounting for hot reload
- Development dependencies (nodemon)
- Debug logging
- Development-specific environment variables

### Container Shell Access

```bash
# API Server
docker-compose exec api-server sh

# Worker  
docker-compose exec worker sh

# Temporal
docker-compose exec temporal sh
```

### Local Development vs Container

You can also run services individually:

```bash
# Run only Temporal server in container
docker-compose up -d temporal

# Run API server and worker locally
cd backend
npm run dev        # API server
npm run worker:dev # Worker (in another terminal)
```

## 📦 Image Management

### Building Images

```bash
# Build all images
docker-compose build

# Build specific service
docker-compose build api-server

# Build without cache
docker-compose build --no-cache
```

### Image Cleanup

```bash
# Remove unused images
docker image prune

# Remove all stopped containers
docker container prune

# Full cleanup
docker system prune -a
```

## 🔐 Production Considerations

1. **Security**: Change default passwords and secrets
2. **Persistence**: Use external volumes for data
3. **Monitoring**: Add health checks and monitoring
4. **Scaling**: Consider using Docker Swarm or Kubernetes
5. **SSL**: Add SSL termination for production domains

## 📋 Port Reference

| Service | Container Port | Host Port | Description |
|---------|---------------|-----------|-------------|
| Frontend | 80 | 3011 | React app via Nginx |
| API Server | 3000 | 3010 | Express REST API |
| Worker | - | - | Temporal worker (internal) |
| Temporal | 7233/8233 | 3012 | Temporal server + Web UI | 