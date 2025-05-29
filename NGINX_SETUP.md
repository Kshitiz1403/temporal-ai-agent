# Dual Nginx Setup

This project uses a dual nginx architecture for optimal performance and separation of concerns.

## Architecture

```
Internet → Reverse Proxy (nginx) → Frontend (nginx) + Backend (Node.js)
           (Port 80)                 (Internal)        (Internal)

Temporal UI: Direct access on Port 3012
```

## Services

### 1. Frontend nginx (`temporal-agent-frontend`)
- **Purpose**: Serves React static files
- **Location**: Inside frontend container
- **Features**: 
  - SPA routing support (`try_files`)
  - Static asset caching
  - Gzip compression
  - Health check at `/frontend-health`

### 2. Reverse Proxy nginx (`temporal-agent-reverse-proxy`)
- **Purpose**: Routes traffic between frontend and backend
- **Port**: 80 (exposed to host)
- **Features**:
  - Upstream load balancing
  - API routing (`/api/*` → backend)
  - Frontend routing (`/*` → frontend nginx)
  - Health checks and monitoring
  - Security headers

## Request Flow

### Frontend Requests
```
Browser → Reverse Proxy → Frontend nginx → React App
  ↓
http://localhost/ → temporal-agent-reverse-proxy:80 → temporal-agent-frontend:80
```

### API Requests
```
Browser → Reverse Proxy → Backend API
  ↓
http://localhost/api/* → temporal-agent-reverse-proxy:80 → temporal-agent-api-server:3000
```

### Temporal UI Requests
```
Browser → Temporal Server (Direct)
  ↓
http://localhost:3012 → temporal-server:8233
```

## Configuration Files

### Frontend nginx (`frontend/Dockerfile`)
- Embedded configuration in Dockerfile
- Handles SPA routing and static file serving
- Optimized for React applications

### Reverse Proxy nginx (`nginx/nginx.conf`)
- External configuration file
- Defines upstream servers
- Routes traffic based on path patterns

## Health Checks

- **Frontend**: `http://localhost/frontend-health` (proxied through reverse proxy)
- **Backend**: `http://localhost/api/health` (proxied through reverse proxy)  
- **Reverse Proxy**: `http://localhost/proxy-health`
- **Temporal UI**: `http://localhost:3012` (direct access)

## Access Points

- **Main Application**: `http://localhost/` (React frontend)
- **API**: `http://localhost/api/*` (Backend REST API)
- **Temporal Web UI**: `http://localhost:3012` (Workflow monitoring - direct access)

## Benefits

1. **Separation of Concerns**: Frontend nginx handles static files, reverse proxy handles routing
2. **Performance**: Static files served directly by nginx, API requests routed efficiently
3. **Scalability**: Easy to add multiple frontend/backend instances
4. **Security**: Single entry point with security headers
5. **Flexibility**: Can easily add SSL termination, rate limiting, etc.

## Development vs Production

### Development
For local development, you can run services individually:
```bash
# Frontend only
cd frontend && npm run dev

# Backend only  
cd backend && npm run dev && npm run worker
```

### Production (Docker)
```bash
# Full stack with dual nginx
docker compose up --build
```

## Customization

### Adding SSL
Add to reverse proxy configuration:
```nginx
server {
    listen 443 ssl;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    # ... rest of config
}
```

### Load Balancing
Add multiple backend instances:
```nginx
upstream backend {
    server temporal-agent-api-server-1:3000;
    server temporal-agent-api-server-2:3000;
}
```

## Troubleshooting

### Common Issues

#### API Routes Not Working  
- Check CORS configuration in backend
- Verify proxy headers are being set correctly
- Check network connectivity between containers

#### Temporal UI Not Loading
- Ensure Temporal server is running: `docker compose ps temporal`
- Access directly at `http://localhost:3012`
- Check Temporal server logs: `docker compose logs temporal` 