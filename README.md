# Temporal AI Agent (Node.js Implementation)

A Node.js implementation of the [temporal-ai-agent](https://github.com/temporal-community/temporal-ai-agent) repository, featuring a multi-turn conversation AI agent running inside Temporal workflows with a modern React frontend.

## Overview

This project demonstrates how to build reliable AI agents using Temporal workflows. The agent can:

- 🤖 **Multi-turn Conversations**: Engage in complex, stateful conversations
- 🔧 **Tool Execution**: Use various tools to accomplish tasks (search, flights, invoices, email)
- ✅ **Human-in-the-Loop**: Request approval for tool executions
- 🔄 **Self-Healing**: Automatically retry failed operations
- 📊 **State Management**: Maintain conversation state across failures
- 🌐 **Multi-Model Support**: Use OpenAI, Anthropic, or Google AI models via Vercel AI SDK

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │   Node.js API   │    │ Temporal Server │
│                 │    │                 │    │                 │
│ • Chat Interface│◄──►│ • REST Routes   │◄──►│ • Workflows     │
│ • Tool Approval │    │ • Session Mgmt  │    │ • Activities    │
│ • Real-time UI  │    │ • LLM Service   │    │ • State Mgmt    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Features

### Backend (Node.js + TypeScript)
- **Temporal Workflows**: Durable conversation orchestration
- **Multi-LLM Support**: OpenAI, Anthropic, Google AI via Vercel AI SDK
- **Tool System**: Pluggable tools with parameter validation
- **REST API**: Express.js routes for frontend communication
- **Type Safety**: Full TypeScript implementation
- **Error Handling**: Comprehensive error handling and retries

### Frontend (React + Vite)
- **Modern UI**: React 19 with Tailwind CSS
- **Real-time Chat**: Interactive conversation interface
- **Tool Approval**: Visual confirmation for tool executions
- **Session Management**: Automatic session handling
- **Responsive Design**: Works on desktop and mobile
- **Dark Mode**: Automatic theme switching

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Temporal Server (or Temporal CLI for development)

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd temporal-ai-agent
```

### 2. Start Temporal Server

```bash
# Using Temporal CLI (recommended for development)
temporal server start-dev

# Or using Docker
docker run --rm -p 7233:7233 temporalio/auto-setup:latest
```

### 3. Setup Backend

```bash
cd backend
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your API keys (OpenAI, Anthropic, or Google AI)

# Start the backend
npm run dev
```

### 4. Setup Frontend

```bash
cd frontend
npm install

# Start the frontend
npm run dev
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Temporal UI**: http://localhost:8233

## Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# LLM Configuration (choose one or more)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key  
GOOGLE_AI_API_KEY=your_google_key

# Default LLM settings
LLM_DEFAULT_PROVIDER=google
LLM_DEFAULT_MODEL=gemini-1.5-pro

# Temporal Configuration
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
TEMPORAL_TASK_QUEUE=ai-agent-queue

# Server Configuration
PORT=3000
NODE_ENV=development
```

### Available Tools

The system includes several mock tools for demonstration:

1. **Search Events**: Find public events by location and date
2. **Search Flights**: Find flights between cities
3. **Create Invoice**: Generate Stripe invoices
4. **Send Email**: Send emails (mock implementation)

## Usage

### Starting a Conversation

1. Open the frontend at http://localhost:5173
2. Click "Start New Chat"
3. Begin chatting with the AI agent
4. The agent will suggest tools and ask for approval when needed

### Example Conversation

```
User: "I want to attend a tech conference in San Francisco next month and need to book a flight from New York"

Agent: "I'll help you find tech conferences in San Francisco and flights from New York. Let me search for events first."

[Agent requests approval to use search tools]

User: "Yes, go ahead"

[Agent executes tools and provides results]
```

## Development

### Project Structure

```
temporal-ai-agent/
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── activities/      # Temporal activities
│   │   ├── workflows/       # Temporal workflows  
│   │   ├── api/            # REST API routes
│   │   ├── services/       # Business logic
│   │   ├── tools/          # Tool implementations
│   │   └── shared/         # Shared types
│   └── package.json
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API services
│   │   └── App.jsx         # Main app
│   └── package.json
└── README.md
```

### Adding New Tools

1. Create a tool implementation in `backend/src/tools/`
2. Add the tool to the registry in `backend/src/tools/index.ts`
3. Update the tool definitions for the LLM
4. Test the tool in the conversation

### Customizing LLM Behavior

- Modify prompts in `backend/src/prompts/`
- Adjust LLM settings in `backend/src/config/config.ts`
- Switch between providers by updating environment variables

## API Reference

### REST Endpoints

- `POST /api/agent/conversations` - Start a new conversation
- `POST /api/agent/conversations/:id/messages` - Send a message
- `GET /api/agent/conversations/:id` - Get conversation state
- `POST /api/agent/conversations/:id/approve` - Approve tool execution
- `GET /api/agent/health` - Health check

### Temporal Workflows

- **aiAgentWorkflow**: Main conversation orchestration
- **Activities**: LLM calls, tool executions, state management

## Deployment

### Backend Deployment

1. Build the application:
```bash
cd backend
npm run build
```

2. Set production environment variables
3. Deploy to your preferred platform (AWS, GCP, Azure, etc.)
4. Ensure Temporal Server is accessible

### Frontend Deployment

1. Build the application:
```bash
cd frontend
npm run build
```

2. Deploy the `dist` folder to a static hosting service
3. Update API base URL for production

## Troubleshooting

### Common Issues

1. **Temporal Connection Failed**
   - Ensure Temporal Server is running on localhost:7233
   - Check network connectivity
   - Verify Temporal CLI installation

2. **LLM API Errors**
   - Verify API keys are correct
   - Check rate limits and quotas
   - Ensure the model is available

3. **Frontend Connection Issues**
   - Verify backend is running on localhost:3000
   - Check CORS configuration
   - Ensure API endpoints are accessible

### Debug Mode

Enable debug logging by setting:
```env
LOG_LEVEL=debug
ENABLE_LLM_LOGGING=true
ENABLE_TOOL_LOGGING=true
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the original [temporal-ai-agent](https://github.com/temporal-community/temporal-ai-agent) repository for details.

## Acknowledgments

- Original Python implementation: [temporal-community/temporal-ai-agent](https://github.com/temporal-community/temporal-ai-agent)
- [Temporal](https://temporal.io/) for the workflow orchestration platform
- [Vercel AI SDK](https://sdk.vercel.ai/) for multi-model LLM support
- [React](https://react.dev/) and [Tailwind CSS](https://tailwindcss.com/) for the frontend

## Related Projects

- [Original Python Implementation](https://github.com/temporal-community/temporal-ai-agent)
- [Temporal Documentation](https://docs.temporal.io/)
- [Vercel AI SDK](https://sdk.vercel.ai/)

---

**Note**: This is a Node.js/TypeScript implementation of the original Python temporal-ai-agent. While it maintains the same core functionality and architecture, it uses different technologies and may have some variations in implementation details. 