# Temporal AI Agent - Node.js Implementation

A Node.js implementation of the [temporal-community/temporal-ai-agent](https://github.com/temporal-community/temporal-ai-agent) that demonstrates multi-turn conversations with an AI agent running inside a Temporal workflow.

## Features

- **Multi-turn AI Conversations**: Persistent conversations that survive restarts
- **Tool Execution**: AI can execute tools like searching events, flights, creating invoices
- **Human Approval**: Optional approval workflow for sensitive operations
- **Multiple LLM Support**: OpenAI, Anthropic, Google via Vercel AI SDK
- **Conversation Management**: Summarization, relevance checking, state persistence
- **RESTful API**: Complete API for managing conversations and interactions

## Architecture

This implementation follows the same architectural principles as the original Python version:

1. **Temporal Workflows**: Manage conversation state and orchestrate AI interactions
2. **Activities**: Execute individual operations (LLM calls, tool execution)
3. **Tools**: Pluggable functions the AI can call (search, email, payments)
4. **LLM Service**: Unified interface for different AI providers
5. **API Layer**: REST endpoints for external interaction

## Prerequisites

- Node.js 18+ and npm
- Temporal Server running locally or accessible remotely
- API keys for your chosen LLM provider(s)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy the environment template and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Temporal Configuration
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
TEMPORAL_TASK_QUEUE=ai-agent-task-queue

# LLM Configuration
OPENAI_API_KEY=your-openai-api-key-here
LLM_MODEL=gpt-4o

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 3. Start Temporal Server

If you don't have Temporal running locally:

```bash
# Using Docker
docker run --rm -p 7233:7233 temporalio/auto-setup:latest

# Or using Temporal CLI
temporal server start-dev
```

### 4. Start the Worker

The worker processes workflows and activities:

```bash
npm run worker
```

### 5. Start the API Server

In another terminal:

```bash
npm run dev
```

## Usage

### Starting a Conversation

```bash
curl -X POST http://localhost:3000/api/agent/conversations \
  -H "Content-Type: application/json" \
  -d '{
    "systemPrompt": "You are a helpful travel planning assistant.",
    "initialGoals": [
      {
        "id": "travel_planning",
        "name": "travel_planning", 
        "description": "Help plan a trip by finding events and flights",
        "tools": ["search_events", "search_flights"],
        "completed": false
      }
    ]
  }'
```

### Sending Messages

```bash
curl -X POST http://localhost:3000/api/agent/conversations/{sessionId}/messages \
  -H "Content-Type: application/json" \
  -d '{"message": "I want to plan a trip to San Francisco next month"}'
```

### Getting Conversation State

```bash
curl http://localhost:3000/api/agent/conversations/{sessionId}
```

### Approving Tool Execution

When the AI wants to execute a tool that requires approval:

```bash
curl -X POST http://localhost:3000/api/agent/conversations/{sessionId}/approve \
  -H "Content-Type: application/json" \
  -d '{"toolCallId": "tool_123", "approved": true}'
```

## Available Tools

The system comes with several built-in tools:

- **search_events**: Find public events in a location and date range
- **search_flights**: Search for flights between locations
- **create_invoice**: Create test invoices (requires approval)
- **send_email**: Send email notifications (requires approval)

## Configuration

### LLM Models

Switch between different models by changing the `LLM_MODEL` environment variable:

```env
# OpenAI
LLM_MODEL=gpt-4o
LLM_MODEL=gpt-3.5-turbo

# Anthropic
LLM_MODEL=claude-3-5-sonnet-20241022
LLM_MODEL=claude-3-haiku-20240307

# Google
LLM_MODEL=gemini-1.5-pro
LLM_MODEL=gemini-1.5-flash
```

### Agent Configuration

Customize agent behavior when starting conversations:

```json
{
  "agentConfig": {
    "model": "gpt-4o",
    "maxTokens": 2000,
    "temperature": 0.7,
    "enableConversationSummary": true,
    "maxConversationHistory": 50,
    "enableHumanApproval": true
  }
}
```

## API Reference

### Conversations

- `POST /api/agent/conversations` - Start new conversation
- `GET /api/agent/conversations` - List active conversations
- `GET /api/agent/conversations/:id` - Get conversation state
- `DELETE /api/agent/conversations/:id` - Terminate conversation

### Messages

- `POST /api/agent/conversations/:id/messages` - Send message
- `GET /api/agent/conversations/:id/status` - Get conversation status

### Tool Management

- `POST /api/agent/conversations/:id/approve` - Approve/reject tool execution
- `PUT /api/agent/conversations/:id/goals` - Update conversation goals

### Health

- `GET /api/agent/health` - Service health check

## Development

### Project Structure

```
src/
├── activities/          # Temporal activities
├── api/                # REST API routes
├── services/           # Business logic services
├── shared/             # Shared types and interfaces
├── tools/              # Tool implementations
├── workflows/          # Temporal workflows
├── index.ts           # API server entry point
└── worker.ts          # Temporal worker entry point
```

### Adding New Tools

1. Create tool implementation in `src/tools/`
2. Add tool definition to `src/tools/index.ts`
3. Update goal configurations as needed

### Scripts

- `npm run dev` - Start development server
- `npm run worker` - Start Temporal worker
- `npm run build` - Build TypeScript
- `npm start` - Start production server

## Comparison with Original

This Node.js implementation provides the same core functionality as the original Python version:

- ✅ Multi-turn conversations with state persistence
- ✅ Tool execution with approval workflows
- ✅ Multiple LLM provider support
- ✅ Conversation summarization and relevance checking
- ✅ RESTful API for external integration
- ✅ Temporal workflow orchestration

Key differences:
- Uses Vercel AI SDK instead of LiteLLM
- TypeScript for better type safety
- Express.js for the API layer
- Slightly different project structure

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For questions and support:
- Check the [original repository](https://github.com/temporal-community/temporal-ai-agent) documentation
- Review Temporal documentation for workflow concepts
- Check Vercel AI SDK docs for LLM integration patterns 