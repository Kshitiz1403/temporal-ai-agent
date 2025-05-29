import { generateText, generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import { Message, AgentConfig, ToolDefinition, ToolCall, LLMProvider } from '../shared/types';
import config, { isProviderConfigured, isValidModel, getConfiguredProviders } from '../config/config';

const toolCallSchema = z.object({
  toolCalls: z.array(z.object({
    id: z.string(),
    name: z.string(),
    parameters: z.record(z.any()),
    requiresApproval: z.boolean().optional().default(false)
  }))
});

export class LLMService implements LLMProvider {
  private getModel(modelIdentifier?: string) {
    // Support multiple formats:
    // 1. "provider/model" (e.g., "openai/gpt-4o", "anthropic/claude-3-5-sonnet-20241022")
    // 2. Just model name (defaults to configured provider)
    // 3. No identifier (uses config defaults)
    
    let provider: string;
    let modelName: string;
    
    if (modelIdentifier?.includes('/')) {
      [provider, modelName] = modelIdentifier.split('/');
    } else {
      provider = config.llm.defaultProvider;
      modelName = modelIdentifier || config.llm.defaultModel;
    }

    try {
      switch (provider.toLowerCase()) {
        case 'openai':
          if (!isProviderConfigured('openai')) {
            throw new Error('OpenAI provider not configured - missing API key');
          }
          return openai(modelName) as any;
          
        case 'anthropic':
          if (!isProviderConfigured('anthropic')) {
            throw new Error('Anthropic provider not configured - missing API key');
          }
          return anthropic(modelName) as any;
          
        case 'google':
          if (!isProviderConfigured('google')) {
            throw new Error('Google AI provider not configured - missing API key');
          }

          const googleProvider = createGoogleGenerativeAI({
            apiKey: config.llm.providers.google.apiKey,
          });
          return googleProvider(modelName) as any;
          
        default:
          throw new Error(`Unsupported LLM provider: ${provider}`);
      }
    } catch (error) {
      console.error(`Error initializing ${provider} model ${modelName}:`, error);
      throw error;
    }
  }

  private convertMessagesToAIFormat(messages: Message[]) {
    return messages
      .filter(msg => {
        // Only include valid roles that the AI SDK accepts
        const validRoles = ['system', 'user', 'assistant'];
        return validRoles.includes(msg.role);
      })
      .map(msg => ({
        role: msg.role,
        content: msg.content,
      }));
  }

  async generateText(
    messages: Message[], 
    agentConfig?: Partial<AgentConfig>,
    modelOverride?: string
  ): Promise<string> {
    try {
      const modelToUse = modelOverride || agentConfig?.model || config.llm.defaultModel;
      const model = this.getModel(modelToUse);
      const aiMessages = this.convertMessagesToAIFormat(messages);

      const { text } = await generateText({
        model,
        messages: aiMessages,
        maxTokens: agentConfig?.maxTokens || config.llm.settings.maxTokens,
        temperature: agentConfig?.temperature || config.llm.settings.temperature,
      });

      return text;
    } catch (error) {
      console.error('Error generating text:', error);
      throw new Error(`Failed to generate text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateToolCalls(
    messages: Message[], 
    tools: ToolDefinition[],
    modelOverride?: string
  ): Promise<ToolCall[]> {
    try {
      const modelToUse = config.llm.defaultModel;
      const model = this.getModel(modelToUse);
      const aiMessages = this.convertMessagesToAIFormat(messages);

      const systemPrompt = this.buildToolCallPrompt(tools);
      
      // Handle system messages properly to avoid multiple system messages for Anthropic
      let messagesForModel: any[];
      
      // Check if there's already a system message
      const existingSystemIndex = aiMessages.findIndex(msg => msg.role === 'system');
      
      if (existingSystemIndex !== -1) {
        // Merge with existing system message
        messagesForModel = [...aiMessages];
        messagesForModel[existingSystemIndex] = {
          role: 'system',
          content: `${messagesForModel[existingSystemIndex].content}\n\n${systemPrompt}`
        };
      } else {
        // Add new system message at the beginning
        messagesForModel = [
          { role: 'system', content: systemPrompt },
          ...aiMessages
        ];
      }

      const { object } = await generateObject({
        model,
        messages: messagesForModel,
        schema: toolCallSchema,
        maxTokens: config.llm.settings.maxTokens,
        temperature: config.llm.settings.temperature,
      });

      // Ensure all required fields are present
      return object.toolCalls.map(toolCall => ({
        id: toolCall.id || `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: toolCall.name || '',
        parameters: toolCall.parameters || {},
        requiresApproval: toolCall.requiresApproval || config.tools.approvalRequired
      })) as ToolCall[];
    } catch (error) {
      console.error('Error generating tool calls:', error);
      throw new Error(`Failed to generate tool calls: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildToolCallPrompt(tools: ToolDefinition[]): string {
    const toolDescriptions = tools.map(tool => 
      `- ${tool.name}: ${tool.description}\n  Parameters: ${JSON.stringify(tool.parameters, null, 2)}`
    ).join('\n');

    return `You are an AI agent that can use tools to accomplish tasks. Based on the conversation history, determine if any tools should be called and return the appropriate tool calls.

Available tools:
${toolDescriptions}

Instructions:
1. Analyze the conversation to understand what the user wants
2. If tools need to be called, return them in the specified format
3. Generate unique IDs for each tool call
4. Set requiresApproval to true for actions that might affect external systems (like sending emails, creating invoices, booking flights)
5. Set requiresApproval to false for read-only operations (like searching)
6. If no tools are needed, return an empty array

Return your response as JSON in this format:
{
  "toolCalls": [
    {
      "id": "unique-id",
      "name": "tool-name", 
      "parameters": { "param1": "value1" },
      "requiresApproval": false
    }
  ]
}`;
  }

  async summarizeConversation(
    messages: Message[],
    currentGoal?: string,
    modelOverride?: string
  ): Promise<string> {
    try {
      const modelToUse = modelOverride || config.llm.defaultModel;
      const model = this.getModel(modelToUse);
      const conversationText = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n');

      const systemContent = currentGoal 
        ? `Summarize the following conversation, focusing on progress toward the goal: "${currentGoal}". Include key decisions, actions taken, and current status. Keep it concise but comprehensive.`
        : 'Summarize the following conversation, focusing on key decisions, actions taken, and important context. Keep it concise but comprehensive.';

      const { text } = await generateText({
        model,
        messages: [
          { role: 'system', content: systemContent },
          { role: 'user', content: conversationText }
        ] as any,
        maxTokens: Math.floor(config.llm.settings.maxTokens * 0.3), // Use 30% of max tokens for summary
        temperature: 0.3, // Lower temperature for more consistent summaries
      });

      return text;
    } catch (error) {
      console.error('Error summarizing conversation:', error);
      throw new Error(`Failed to summarize conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async checkUserInputRelevance(
    userInput: string, 
    currentGoal: string,
    modelOverride?: string
  ): Promise<{ isRelevant: boolean; reason?: string }> {
    try {
      const modelToUse = modelOverride || config.llm.defaultModel;
      const model = this.getModel(modelToUse);

      const schema = z.object({
        isRelevant: z.boolean(),
        reason: z.string().optional()
      });

      const { object } = await generateObject({
        model,
        messages: [
          {
            role: 'system',
            content: `You are analyzing whether user input is relevant to the current goal. The current goal is: "${currentGoal}"`
          },
          {
            role: 'user',
            content: `User input: "${userInput}"\n\nIs this input relevant to accomplishing the current goal? Consider input relevant if it:
1. Directly relates to the current goal
2. Asks for clarification about the goal
3. Requests to change or update the goal
4. Provides information that helps achieve the goal

Provide a brief reason for your decision.`
          }
        ] as any,
        schema,
        maxTokens: 300,
        temperature: 0.2, // Lower temperature for more consistent relevance checking
      });

      return {
        isRelevant: object.isRelevant ?? true,
        reason: object.reason
      };
    } catch (error) {
      console.error('Error checking input relevance:', error);
      return { isRelevant: true, reason: 'Unable to check relevance, proceeding with input.' };
    }
  }

  // Utility method to get available models for a provider
  getAvailableModels(provider?: string): { [provider: string]: string[] } {
    const providerToUse = provider || 'all';
    
    if (providerToUse === 'all') {
      return {
        openai: config.llm.providers.openai.models.chat,
        anthropic: config.llm.providers.anthropic.models.chat,
        google: config.llm.providers.google.models.chat,
      };
    }

    const providerConfig = config.llm.providers[providerToUse as keyof typeof config.llm.providers];
    if (!providerConfig) {
      return {};
    }

    return { [providerToUse]: providerConfig.models.chat };
  }

  // Utility method to test model availability
  async testModel(modelIdentifier: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate model first
      if (!isValidModel(modelIdentifier)) {
        return { 
          success: false, 
          error: `Invalid model identifier: ${modelIdentifier}` 
        };
      }

      const model = this.getModel(modelIdentifier);
      
      // Simple test generation
      await generateText({
        model,
        messages: [{ role: 'user', content: 'Test' }] as any,
        maxTokens: 10,
      });

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get provider status
  getProviderStatus() {
    const configuredProviders = getConfiguredProviders();
    
    return {
      configured: configuredProviders,
      available: ['openai', 'anthropic', 'google'],
      default: config.llm.defaultProvider,
      currentModel: config.llm.defaultModel,
    };
  }
} 