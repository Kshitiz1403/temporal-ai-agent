export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
}

export interface ToolCall {
  id: string;
  name: string;
  parameters: Record<string, any>;
  requiresApproval?: boolean;
}

export interface ToolResult {
  id: string;
  toolCallId: string;
  result: any;
  error?: string;
  approved?: boolean;
}

export interface Goal {
  id: string;
  name: string;
  description: string;
  tools: string[];
  requiredFields?: string[];
  completed: boolean;
}

export interface ConversationSession {
  id: string;
  workflowId: string;
  runId: string;
  messages: Message[];
  goals: Goal[];
  currentGoal?: string;
  status: 'active' | 'waiting_approval' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface StartConversationInput {
  conversationId: string;
  goal?: string;
  model?: string;
  agentConfig?: Partial<AgentConfig>;
  systemPrompt?: string;
}

export interface AgentConfig {
  model: string;
  maxTokens?: number;
  temperature?: number;
  enableConversationSummary: boolean;
  maxConversationHistory: number;
  enableHumanApproval: boolean;
}

export interface LLMProvider {
  generateText(messages: Message[], config?: Partial<AgentConfig>): Promise<string>;
  generateToolCalls(messages: Message[], tools: ToolDefinition[]): Promise<ToolCall[]>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      required?: boolean;
    }>;
    required?: string[];
  };
  requiresApproval?: boolean;
}

export interface ActivityResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  requiresApproval?: boolean;
} 