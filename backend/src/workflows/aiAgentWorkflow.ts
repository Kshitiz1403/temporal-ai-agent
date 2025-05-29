import {
  defineSignal,
  defineQuery,
  setHandler,
  condition,
  proxyActivities,
  sleep,
  workflowInfo,
  uuid4
} from '@temporalio/workflow';
import type * as activities from '../activities';
import { 
  Message, 
  ToolCall, 
  ToolResult, 
  ConversationSession, 
  Goal, 
  AgentConfig,
  ActivityResult 
} from '../shared/types';
import { getAllToolDefinitions, getToolsForGoal, getToolDefinition } from '../tools';

// Configure activity options
const { 
  generateAIResponse,
  generateToolCalls,
  executeTool,
  summarizeConversation,
  checkInputRelevance,
  validateToolParameters,
  storeConversationState
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 minutes',
});

// Workflow signals for external communication
export const userMessageSignal = defineSignal<[string]>('userMessage');
export const approveToolSignal = defineSignal<[string, boolean]>('approveTool');
export const updateGoalsSignal = defineSignal<[Goal[]]>('updateGoals');

// Workflow queries for external status checking
export const getConversationQuery = defineQuery<ConversationSession>('getConversation');
export const getStatusQuery = defineQuery<string>('getStatus');

export interface AIAgentWorkflowParams {
  sessionId: string;
  initialGoals?: Goal[];
  agentConfig?: AgentConfig;
  systemPrompt?: string;
}

export async function aiAgentWorkflow(params: AIAgentWorkflowParams): Promise<ConversationSession> {
  const { sessionId, initialGoals = [], agentConfig, systemPrompt } = params;
  
  // Initialize conversation state
  let messages: Message[] = [];
  let goals: Goal[] = initialGoals;
  let currentGoal: string | undefined = goals.length > 0 ? goals[0].id : undefined;
  let status: 'active' | 'waiting_approval' | 'completed' | 'failed' = 'active';
  let pendingToolApprovals = new Map<string, { toolCall: ToolCall; resolve: (approved: boolean) => void }>();
  
  const config: AgentConfig = {
    maxTokens: 2000,
    temperature: 0.7,
    enableConversationSummary: true,
    maxConversationHistory: 50,
    enableHumanApproval: true,
    ...agentConfig
  };

  // Add system prompt if provided
  if (systemPrompt) {
    messages.push({
      id: uuid4(),
      role: 'system',
      content: systemPrompt,
      timestamp: new Date()
    });
  }

  // Set up signal handlers
  const userMessageQueue: string[] = [];
  setHandler(userMessageSignal, (message: string) => {
    userMessageQueue.push(message);
  });

  setHandler(approveToolSignal, (toolCallId: string, approved: boolean) => {
    const pending = pendingToolApprovals.get(toolCallId);
    if (pending) {
      pending.resolve(approved);
      pendingToolApprovals.delete(toolCallId);
    }
  });

  setHandler(updateGoalsSignal, (newGoals: Goal[]) => {
    goals = newGoals;
    currentGoal = goals.find(g => !g.completed)?.id || undefined;
  });

  // Set up query handlers
  setHandler(getConversationQuery, (): ConversationSession => ({
    id: sessionId,
    workflowId: workflowInfo().workflowId,
    runId: workflowInfo().runId,
    messages,
    goals,
    currentGoal,
    status,
    createdAt: new Date(workflowInfo().startTime),
    updatedAt: new Date()
  }));

  setHandler(getStatusQuery, () => status);

  // Send initial greeting message
  const greetingMessage: Message = {
    id: uuid4(),
    role: 'assistant',
    content: `Hello! I'm your AI assistant. I can help you with various tasks using the tools available to me. What would you like to do today?`,
    timestamp: new Date()
  };
  messages.push(greetingMessage);

  // Main conversation loop
  while (!['completed', 'failed'].includes(status)) {
    try {
      console.log(`[Workflow ${sessionId}] Waiting for user message. Status: ${status}`);
      // Wait for user input
      await condition(() => userMessageQueue.length > 0);
      
      const newUserMessage = userMessageQueue.shift();
      if (!newUserMessage) continue;

      // Check input relevance if we have a current goal
      if (currentGoal && config.enableHumanApproval) {
        const goal = goals.find(g => g.id === currentGoal);
        if (goal) {
          const relevanceResult = await checkInputRelevance(newUserMessage, goal.description);
          if (relevanceResult.success && !relevanceResult.data?.isRelevant) {
            // Add clarification message
            const clarificationMessage: Message = {
              id: uuid4(),
              role: 'assistant',
              content: `I notice your message might not be directly related to our current goal: "${goal.description}". ${relevanceResult.data?.reason || ''} Would you like to continue with the current goal or change direction?`,
              timestamp: new Date()
            };
            messages.push(clarificationMessage);
            continue;
          }
        }
      }

      // Add user message to conversation
      const userMessage: Message = {
        id: uuid4(),
        role: 'user',
        content: newUserMessage,
        timestamp: new Date()
      };
      messages.push(userMessage);

      // Summarize conversation if it gets too long
      if (config.enableConversationSummary && messages.length > config.maxConversationHistory) {
        const summaryResult = await summarizeConversation(messages.slice(0, -10));
        if (summaryResult.success) {
          const summaryMessage: Message = {
            id: uuid4(),
            role: 'system',
            content: `Conversation summary: ${summaryResult.data}`,
            timestamp: new Date()
          };
          messages = [summaryMessage, ...messages.slice(-10)];
        }
      }

      // Get available tools for current goal
      const availableTools = currentGoal 
        ? getToolsForGoal(goals.find(g => g.id === currentGoal)?.name || '')
        : getAllToolDefinitions();

      // Check if agent should use tools
      const toolCallsResult = await generateToolCalls(messages, availableTools);
      
      console.log(`[Workflow ${sessionId}] Tool calls result:`, { 
        success: toolCallsResult.success, 
        hasData: !!toolCallsResult.data, 
        toolCount: toolCallsResult.data?.length || 0,
        error: toolCallsResult.error 
      });

      console.log('toolCallsResult.data', JSON.stringify(toolCallsResult.data, null, 2));

      
      if (toolCallsResult.success && toolCallsResult.data && toolCallsResult.data.length > 0) {
        // Execute tool calls
        const toolResults: ToolResult[] = [];

        
        for (const toolCall of toolCallsResult.data) {
          const toolDefinition = getToolDefinition(toolCall.name);
          if (!toolDefinition) {
            toolResults.push({
              id: uuid4(),
              toolCallId: toolCall.id,
              result: null,
              error: `Tool '${toolCall.name}' not found`,
              approved: false
            });
            continue;
          }

          // Validate tool parameters
          const validationResult = await validateToolParameters(toolCall, toolDefinition);
          if (!validationResult.success) {
            toolResults.push({
              id: uuid4(),
              toolCallId: toolCall.id,
              result: null,
              error: validationResult.error,
              approved: false
            });
            continue;
          }

          // Check if tool requires approval
          if (toolCall.requiresApproval && config.enableHumanApproval) {
            status = 'waiting_approval';
            
            // Ask for approval
            const approvalMessage: Message = {
              id: uuid4(),
              role: 'assistant',
              content: `I'd like to execute the following action:\n\n**${toolCall.name}**\n${JSON.stringify(toolCall.parameters, null, 2)}\n\nDo you approve this action?`,
              timestamp: new Date()
            };
            messages.push(approvalMessage);

            // Wait for approval
            const approved = await new Promise<boolean>((resolve) => {
              pendingToolApprovals.set(toolCall.id, { toolCall, resolve });
            });

            status = 'active';

            if (!approved) {
              toolResults.push({
                id: uuid4(),
                toolCallId: toolCall.id,
                result: null,
                error: 'Action was not approved by user',
                approved: false
              });
              continue;
            }
          }

          // Execute the tool
          const executionResult = await executeTool(toolCall);
          toolResults.push({
            id: uuid4(),
            toolCallId: toolCall.id,
            result: executionResult.success ? executionResult.data : null,
            error: executionResult.success ? undefined : executionResult.error,
            approved: true
          });
        }

        // Add tool results to conversation
        const toolMessage: Message = {
          id: uuid4(),
          role: 'tool',
          content: `Tool execution results:\n${toolResults.map(r => 
            `${r.toolCallId}: ${r.error ? `Error: ${r.error}` : `Success: ${JSON.stringify(r.result)}`}`
          ).join('\n')}`,
          timestamp: new Date(),
          toolResults
        };
        messages.push(toolMessage);
      }

      // Generate AI response
      const responseResult = await generateAIResponse(messages, config);
      
      console.log(`[Workflow ${sessionId}] AI response result:`, { 
        success: responseResult.success, 
        hasData: !!responseResult.data,
        error: responseResult.error 
      });
      
      if (responseResult.success) {
        const aiMessage: Message = {
          id: uuid4(),
          role: 'assistant',
          content: responseResult.data || 'I apologize, but I encountered an issue generating a response.',
          timestamp: new Date()
        };
        messages.push(aiMessage);
      } else {
        status = 'failed';
        break;
      }

      // Check if goals are completed
      const allGoalsCompleted = goals.length > 0 && goals.every(goal => goal.completed);
      if (allGoalsCompleted) {
        status = 'completed';
      }

      // Store conversation state
      await storeConversationState(sessionId, messages, goals, status);

      console.log(`[Workflow ${sessionId}] Completed iteration. Status: ${status}, Message count: ${messages.length}`);

      // Small delay to prevent tight loops
      await sleep('100ms');

    } catch (error) {
      console.error('Error in AI agent workflow:', error);
      status = 'failed';
      
      const errorMessage: Message = {
        id: uuid4(),
        role: 'assistant',
        content: 'I encountered an error and need to stop our conversation. Please try starting a new session.',
        timestamp: new Date()
      };
      messages.push(errorMessage);
      break;
    }
  }

  // Return final conversation state
  return {
    id: sessionId,
    workflowId: workflowInfo().workflowId,
    runId: workflowInfo().runId,
    messages,
    goals,
    currentGoal,
    status,
    createdAt: new Date(workflowInfo().startTime),
    updatedAt: new Date()
  };
} 