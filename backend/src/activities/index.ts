import { LLMService } from '../services/llmService';
import { TOOL_IMPLEMENTATIONS } from '../tools';
import { Message, ToolCall, ToolResult, AgentConfig, ToolDefinition, ActivityResult } from '../shared/types';

const llmService = new LLMService();

/**
 * Activity to generate AI response based on conversation history
 */
export async function generateAIResponse(
  messages: Message[], 
  config?: Partial<AgentConfig>
): Promise<ActivityResult<string>> {
  try {
    const response = await llmService.generateText(messages, config);
    return {
      success: true,
      data: response
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Activity to generate tool calls based on conversation and available tools
 */
export async function generateToolCalls(
  messages: Message[], 
  tools: ToolDefinition[]
): Promise<ActivityResult<ToolCall[]>> {
  try {
    const toolCalls = await llmService.generateToolCalls(messages, tools);
    return {
      success: true,
      data: toolCalls
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Activity to execute a specific tool
 */
export async function executeTool(
  toolCall: ToolCall
): Promise<ActivityResult<any>> {
  try {
    const toolImplementation = TOOL_IMPLEMENTATIONS[toolCall.name as keyof typeof TOOL_IMPLEMENTATIONS];
    
    if (!toolImplementation) {
      return {
        success: false,
        error: `Tool '${toolCall.name}' not found`
      };
    }

    const result = await toolImplementation(toolCall.parameters as any);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Activity to summarize conversation history when it gets too long
 */
export async function summarizeConversation(
  messages: Message[]
): Promise<ActivityResult<string>> {
  try {
    const summary = await llmService.summarizeConversation(messages);
    return {
      success: true,
      data: summary
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Activity to check if user input is relevant to the current goal
 */
export async function checkInputRelevance(
  userInput: string, 
  currentGoal: string
): Promise<ActivityResult<{ isRelevant: boolean; reason?: string }>> {
  try {
    const relevanceCheck = await llmService.checkUserInputRelevance(userInput, currentGoal);
    return {
      success: true,
      data: relevanceCheck
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: { isRelevant: true } // Default to relevant if check fails
    };
  }
}

/**
 * Activity to validate tool parameters before execution
 */
export async function validateToolParameters(
  toolCall: ToolCall, 
  toolDefinition: ToolDefinition
): Promise<ActivityResult<boolean>> {
  try {
    const { properties, required = [] } = toolDefinition.parameters;
    
    // Check required parameters
    for (const requiredParam of required) {
      if (!(requiredParam in toolCall.parameters)) {
        return {
          success: false,
          error: `Missing required parameter: ${requiredParam}`
        };
      }
    }

    // Basic type validation
    for (const [paramName, paramValue] of Object.entries(toolCall.parameters)) {
      const paramDef = properties[paramName];
      if (paramDef) {
        switch (paramDef.type) {
          case 'string':
            if (typeof paramValue !== 'string') {
              return {
                success: false,
                error: `Parameter '${paramName}' must be a string`
              };
            }
            break;
          case 'number':
            if (typeof paramValue !== 'number') {
              return {
                success: false,
                error: `Parameter '${paramName}' must be a number`
              };
            }
            break;
          case 'boolean':
            if (typeof paramValue !== 'boolean') {
              return {
                success: false,
                error: `Parameter '${paramName}' must be a boolean`
              };
            }
            break;
        }
      }
    }

    return {
      success: true,
      data: true
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Activity to store conversation state (could be extended to use database)
 */
export async function storeConversationState(
  sessionId: string,
  messages: Message[],
  goals: any[],
  status: string
): Promise<ActivityResult<boolean>> {
  try {
    // In a real implementation, this would store to a database
    // For now, we'll just log it
    console.log(`Storing conversation state for session ${sessionId}:`, {
      messageCount: messages.length,
      goalsCount: goals.length,
      status
    });

    return {
      success: true,
      data: true
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 