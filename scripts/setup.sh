#!/bin/bash

# Temporal AI Agent - Docker Setup Script
set -e

echo "🚀 Setting up Temporal AI Agent with Docker..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
# ===========================================
# TEMPORAL AI AGENT - ENVIRONMENT VARIABLES
# ===========================================

# ===========================================
# LLM PROVIDER API KEYS (Required)
# ===========================================
# Add at least one API key below:

# OpenAI Configuration
OPENAI_API_KEY=

# Anthropic Configuration  
ANTHROPIC_API_KEY=

# Google AI Configuration
GOOGLE_AI_API_KEY=

# ===========================================
# DEFAULT CONFIGURATION
# ===========================================
NODE_ENV=production
LLM_DEFAULT_PROVIDER=google
LLM_DEFAULT_MODEL=gemini-1.5-pro
LOG_LEVEL=info
TEMPORAL_ADDRESS=temporal:7233
TEMPORAL_NAMESPACE=default
TEMPORAL_TASK_QUEUE=ai-agent-queue
EOF

    echo "⚠️  Please edit .env file and add your LLM API keys before continuing!"
    echo "   You need at least one API key (OpenAI, Anthropic, or Google AI)"
    echo ""
    read -p "Press Enter after updating .env file to continue..."
fi

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p backend/logs

# Pull required images
echo "📦 Pulling Docker images..."
docker-compose pull temporal

# Build application images
echo "🔨 Building application images..."
docker-compose build

# Start the application
echo "🌟 Starting Temporal AI Agent..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo "🔍 Checking service health..."

# Check Temporal Server
timeout 30s bash -c 'until docker-compose exec -T temporal temporal workflow list &>/dev/null; do sleep 1; done' || {
    echo "❌ Temporal server failed to start"
    docker-compose logs temporal
    exit 1
}

# Check API Server
timeout 30s bash -c 'until curl -f http://localhost:3010/api/health &>/dev/null; do sleep 1; done' || {
    echo "❌ API server failed to start"
    docker-compose logs api-server
    exit 1
}

# Check Frontend
timeout 30s bash -c 'until curl -f http://localhost:3011/health &>/dev/null; do sleep 1; done' || {
    echo "❌ Frontend failed to start"
    docker-compose logs frontend
    exit 1
}

echo ""
echo "✅ Temporal AI Agent is now running!"
echo ""
echo "🌐 Services:"
echo "   Frontend:      http://localhost:3011"
echo "   API Server:    http://localhost:3010"
echo "   Temporal Web:  http://localhost:3012"
echo ""
echo "📝 Commands:"
echo "   View logs:     docker-compose logs -f"
echo "   Stop:          docker-compose down"
echo "   Restart:       docker-compose restart"
echo "   Full cleanup:  docker-compose down -v"
echo ""
echo "🎉 Happy chatting with your AI agent!" 