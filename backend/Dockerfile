# Backend Dockerfile for Temporal AI Agent
FROM node:20 AS base

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY src/ ./src/

# Development stage
FROM base AS development

WORKDIR /app

# Expose port
EXPOSE 3000

# Default command for development
CMD ["npm", "run", "dev"]

# Production stage
FROM node:20 AS production

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (we need dev deps for ts-node)
RUN npm ci

# Copy source code from base stage
COPY --from=base /app/src ./src

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3000

# Default command (can be overridden)
CMD ["npm", "run", "start"] 