# 🌐 Access Guide

Once you run `docker compose up --build`, all services are available through a single entry point at **http://localhost**

## 🎯 Main Access Points

### 🤖 AI Agent Frontend
- **URL**: http://localhost/
- **Description**: React frontend for chatting with the AI agent
- **Features**: Start conversations, send messages, approve tool executions

### 🔧 API Endpoints  
- **Base URL**: http://localhost/api/agent
- **Health Check**: http://localhost/health
- **Documentation**: RESTful API for AI agent interactions

### 📊 Temporal Web UI
- **URL**: http://localhost:3012  
- **Description**: Workflow monitoring and debugging interface
- **Features**: View workflows, activities, execution history
- **Note**: Direct access (not through reverse proxy)

## 🩺 Health Checks

### Service Health
- **Reverse Proxy**: http://localhost/proxy-health
- **Frontend**: http://localhost/frontend-health  
- **Backend API**: http://localhost/api/health

### Quick Status Check
```bash
# Check all services are running
curl http://localhost/proxy-health    # Reverse proxy
curl http://localhost/frontend-health # Frontend nginx  
curl http://localhost/api/health      # Backend API
curl http://localhost:3012           # Temporal UI (direct access)
```

## 🚀 Getting Started

1. **Start the application**:
   ```bash
   docker compose up --build
   ```

2. **Open in browser**: http://localhost/

3. **Start a conversation**: Click "Start New Chat"

4. **Monitor workflows**: Visit http://localhost:3012

## 🛠️ Development

### Local Development
If running services individually for development:
- Frontend: `cd frontend && npm run dev` (http://localhost:3000)
- Backend: `cd backend && npm run dev` (http://localhost:3000/api)
- Worker: `cd backend && npm run worker`

### Production  
Use Docker Compose for production deployment with the nginx reverse proxy.

## 🔐 Security Notes

- All services are behind the nginx reverse proxy
- Security headers are applied globally
- No direct service exposure except through port 80
- Internal service communication only 