# Temporal AI Agent Frontend

This is the React frontend for the Temporal AI Agent application. It provides a modern, responsive chat interface for interacting with AI agents powered by Temporal workflows.

## Features

- **Modern React UI**: Built with React 19, Vite, and Tailwind CSS
- **Real-time Chat**: Interactive chat interface with the AI agent
- **Tool Approval**: Visual confirmation for tool executions
- **Session Management**: Start and manage conversation sessions
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Mode Support**: Automatic dark/light mode switching
- **Error Handling**: Graceful error handling with user feedback

## Technology Stack

- **React 19**: Modern React with hooks and functional components
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **PostCSS**: CSS processing with autoprefixer

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend server running on `http://localhost:3000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## API Integration

The frontend connects to the Node.js backend via REST API:

- **Base URL**: `http://localhost:3000/api/agent`
- **Session Management**: Automatic session creation and management
- **Real-time Updates**: Polling for conversation updates
- **Tool Approvals**: Interactive tool execution confirmations

## Components

### Core Components

- **App.jsx**: Main application component with session management
- **ChatWindow.jsx**: Chat interface with message rendering
- **MessageBubble.jsx**: Individual message display
- **LLMResponse.jsx**: AI response rendering with tool support
- **ConfirmInline.jsx**: Tool execution confirmation UI
- **NavBar.jsx**: Application header
- **LoadingIndicator.jsx**: Loading animation

### Services

- **api.js**: API service for backend communication

## Configuration

The frontend automatically connects to the backend at `http://localhost:3000/api/agent`. To change this, update the `API_BASE_URL` in `src/services/api.js`.

## Development

### File Structure

```
frontend/
├── src/
│   ├── components/     # React components
│   ├── services/       # API services
│   ├── App.jsx         # Main app component
│   ├── main.jsx        # Entry point
│   └── index.css       # Global styles
├── index.html          # HTML template
├── package.json        # Dependencies
├── vite.config.js      # Vite configuration
├── tailwind.config.js  # Tailwind configuration
└── postcss.config.js   # PostCSS configuration
```

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build

## Features in Detail

### Session Management
- Automatic session creation when starting a new chat
- Session persistence during the conversation
- Health checks to ensure backend connectivity

### Message Handling
- Support for user and assistant messages
- JSON parsing for structured AI responses
- Link detection and rendering in messages

### Tool Execution
- Visual confirmation dialogs for tool calls
- Argument display with collapsible details
- Real-time execution status updates

### Error Handling
- Network error detection and user feedback
- Graceful degradation when backend is unavailable
- Automatic retry mechanisms

## Customization

### Styling
The application uses Tailwind CSS for styling. You can customize the appearance by:
- Modifying `tailwind.config.js` for theme changes
- Updating component classes for specific styling
- Adding custom CSS in `index.css`

### API Configuration
Update `src/services/api.js` to:
- Change backend URL
- Modify request/response handling
- Add authentication headers
- Customize error handling

## Troubleshooting

### Common Issues

1. **Backend Connection Failed**
   - Ensure the backend is running on `http://localhost:3000`
   - Check CORS configuration in the backend
   - Verify API endpoints are accessible

2. **Build Errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check Node.js version compatibility
   - Verify all dependencies are installed

3. **Styling Issues**
   - Ensure Tailwind CSS is properly configured
   - Check PostCSS configuration
   - Verify CSS imports in main.jsx

## Contributing

1. Follow the existing code style and component patterns
2. Use TypeScript-style JSDoc comments for documentation
3. Test components thoroughly before submitting
4. Ensure responsive design works on all screen sizes

## License

This project is part of the Temporal AI Agent implementation and follows the same license as the main project. 