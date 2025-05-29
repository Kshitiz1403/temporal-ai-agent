import { Client, WorkflowHandle, Connection } from '@temporalio/client';
import { 
  aiAgentWorkflow, 
  userMessageSignal, 
  approveToolSignal,
  updateGoalsSignal,
  getConversationQuery,
  getStatusQuery,
  getPendingApprovalsQuery,
  AIAgentWorkflowParams
} from '../workflows/aiAgentWorkflow';
import { ConversationSession, Goal, ToolCall } from '../shared/types';
import { v4 as uuidv4 } from 'uuid';
import config from '@/config/config';

export class TemporalService {
  private client: Client;
  private activeWorkflows = new Map<string, WorkflowHandle<typeof aiAgentWorkflow>>();

  constructor() {
    this.client = new Client({
      connection: Connection.lazy({
        address: config.temporal.server.address || 'localhost:7233',
      }),
      namespace: config.temporal.server.namespace || 'default',
    });
  }

  async startConversation(params: {
    sessionId?: string;
    initialGoals?: Goal[];
    systemPrompt?: string;
    agentConfig?: any;
  }): Promise<{ sessionId: string; workflowId: string }> {
    const sessionId = params.sessionId || uuidv4();
    const workflowId = `ai-agent-${sessionId}`;

    const workflowParams: AIAgentWorkflowParams = {
      sessionId,
      initialGoals: params.initialGoals || [
        {
          id: 'travel_planning',
          name: 'travel_planning',
          description: 'Help plan a trip by finding events and flights, then create an invoice',
          tools: ['search_events', 'search_flights', 'create_invoice'],
          completed: false
        }
      ],
      agentConfig: params.agentConfig,
      systemPrompt: params.systemPrompt || `You are a helpful AI agent that assists users with travel planning. 

Your goal is to:
1. Understand what the user wants to do
2. Search for relevant events if they're interested in activities
3. Find flights to their destination
4. Create an invoice for their trip if requested

Be conversational and ask clarifying questions when you need more information. Always explain what you're doing when you use tools.`
    };

    console.log(`🚀 Starting conversation workflow: ${workflowId}`);

    const handle = await this.client.workflow.start(aiAgentWorkflow, {
      args: [workflowParams],
      taskQueue: config.temporal.taskQueue,
      workflowId,
    });

    this.activeWorkflows.set(sessionId, handle);

    return {
      sessionId,
      workflowId: handle.workflowId
    };
  }

  async sendMessage(sessionId: string, message: string): Promise<void> {
    const handle = this.activeWorkflows.get(sessionId);
    if (!handle) {
      throw new Error(`No active conversation found for session: ${sessionId}`);
    }

    console.log(`💬 Sending message to session ${sessionId}: ${message.substring(0, 100)}...`);
    await handle.signal(userMessageSignal, message);
  }

  async approveToolExecution(sessionId: string, toolCallId: string, approved: boolean): Promise<void> {
    const handle = this.activeWorkflows.get(sessionId);
    if (!handle) {
      throw new Error(`No active conversation found for session: ${sessionId}`);
    }

    console.log(`${approved ? '✅' : '❌'} Tool approval for session ${sessionId}, tool: ${toolCallId}`);
    await handle.signal(approveToolSignal, toolCallId, approved);
  }

  async updateGoals(sessionId: string, goals: Goal[]): Promise<void> {
    const handle = this.activeWorkflows.get(sessionId);
    if (!handle) {
      throw new Error(`No active conversation found for session: ${sessionId}`);
    }

    console.log(`🎯 Updating goals for session ${sessionId}`);
    await handle.signal(updateGoalsSignal, goals);
  }

  async getConversation(sessionId: string): Promise<ConversationSession | null> {
    const handle = this.activeWorkflows.get(sessionId);
    if (!handle) {
      return null;
    }

    try {
      return await handle.query(getConversationQuery);
    } catch (error) {
      console.error(`Error querying conversation for session ${sessionId}:`, error);
      return null;
    }
  }

  async getStatus(sessionId: string): Promise<string | null> {
    const handle = this.activeWorkflows.get(sessionId);
    if (!handle) {
      return null;
    }

    try {
      return await handle.query(getStatusQuery);
    } catch (error) {
      console.error(`Error querying status for session ${sessionId}:`, error);
      return null;
    }
  }

  async getPendingApprovals(sessionId: string): Promise<ToolCall[]> {
    const handle = this.activeWorkflows.get(sessionId);
    if (!handle) {
      return [];
    }

    try {
      return await handle.query(getPendingApprovalsQuery);
    } catch (error) {
      console.error(`Error querying pending approvals for session ${sessionId}:`, error);
      return [];
    }
  }

  async terminateConversation(sessionId: string, reason?: string): Promise<void> {
    const handle = this.activeWorkflows.get(sessionId);
    if (!handle) {
      throw new Error(`No active conversation found for session: ${sessionId}`);
    }

    console.log(`🛑 Terminating conversation for session ${sessionId}: ${reason || 'User requested'}`);
    await handle.terminate(reason);
    this.activeWorkflows.delete(sessionId);
  }

  async listActiveConversations(): Promise<string[]> {
    return Array.from(this.activeWorkflows.keys());
  }

  // Connect to an existing workflow (useful for reconnecting after server restart)
  async connectToExistingWorkflow(sessionId: string, workflowId: string): Promise<void> {
    try {
      const handle = this.client.workflow.getHandle(workflowId);
      this.activeWorkflows.set(sessionId, handle);
      console.log(`🔗 Connected to existing workflow: ${workflowId} for session: ${sessionId}`);
    } catch (error) {
      console.error(`Failed to connect to workflow ${workflowId}:`, error);
      throw error;
    }
  }

  async isWorkflowRunning(workflowId: string): Promise<boolean> {
    try {
      const handle = this.client.workflow.getHandle(workflowId);
      const description = await handle.describe();
      return description.status.name === 'RUNNING';
    } catch (error) {
      return false;
    }
  }
} 