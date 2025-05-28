import express from 'express';
import { TemporalService } from '../services/temporalService';
import { Goal } from '../shared/types';

const router = express.Router();
const temporalService = new TemporalService();

/**
 * POST /api/agent/conversations
 * Start a new conversation with the AI agent
 */
router.post('/conversations', (req, res) => {
  (async () => {
    try {
      const { systemPrompt, initialGoals, agentConfig } = req.body;

      const result = await temporalService.startConversation({
        systemPrompt,
        initialGoals,
        agentConfig
      });

      res.json({
        success: true,
        data: result,
        message: 'Conversation started successfully'
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start conversation',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  })();
});

/**
 * POST /api/agent/conversations/:sessionId/messages
 * Send a message to the AI agent
 */
router.post('/conversations/:sessionId/messages', (req, res) => {
  (async () => {
    try {
      const { sessionId } = req.params;
      const { message } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Message is required and must be a string'
        });
      }

      await temporalService.sendMessage(sessionId, message);

      res.json({
        success: true,
        message: 'Message sent successfully'
      });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send message',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  })();
});

/**
 * GET /api/agent/conversations/:sessionId
 * Get the current conversation state
 */
router.get('/conversations/:sessionId', (req, res) => {
  (async () => {
    try {
      const { sessionId } = req.params;

      const conversation = await temporalService.getConversation(sessionId);
      
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found'
        });
      }

      res.json({
        success: true,
        data: conversation
      });
    } catch (error) {
      console.error('Error getting conversation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get conversation',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  })();
});

/**
 * GET /api/agent/conversations/:sessionId/status
 * Get the current status of a conversation
 */
router.get('/conversations/:sessionId/status', (req, res) => {
  (async () => {
    try {
      const { sessionId } = req.params;

      const status = await temporalService.getStatus(sessionId);
      
      if (!status) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found'
        });
      }

      res.json({
        success: true,
        data: { status }
      });
    } catch (error) {
      console.error('Error getting status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  })();
});

/**
 * POST /api/agent/conversations/:sessionId/approve
 * Approve or reject a tool execution
 */
router.post('/conversations/:sessionId/approve', (req, res) => {
  (async () => {
    try {
      const { sessionId } = req.params;
      const { toolCallId, approved } = req.body;

      if (!toolCallId || typeof approved !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'toolCallId and approved (boolean) are required'
        });
      }

      await temporalService.approveToolExecution(sessionId, toolCallId, approved);

      res.json({
        success: true,
        message: `Tool execution ${approved ? 'approved' : 'rejected'}`
      });
    } catch (error) {
      console.error('Error approving tool execution:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process tool approval',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  })();
});

/**
 * PUT /api/agent/conversations/:sessionId/goals
 * Update the goals for a conversation
 */
router.put('/conversations/:sessionId/goals', (req, res) => {
  (async () => {
    try {
      const { sessionId } = req.params;
      const { goals }: { goals: Goal[] } = req.body;

      if (!Array.isArray(goals)) {
        return res.status(400).json({
          success: false,
          message: 'Goals must be an array'
        });
      }

      await temporalService.updateGoals(sessionId, goals);

      res.json({
        success: true,
        message: 'Goals updated successfully'
      });
    } catch (error) {
      console.error('Error updating goals:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update goals',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  })();
});

/**
 * DELETE /api/agent/conversations/:sessionId
 * Terminate a conversation
 */
router.delete('/conversations/:sessionId', (req, res) => {
  (async () => {
    try {
      const { sessionId } = req.params;
      const { reason } = req.body;

      await temporalService.terminateConversation(sessionId, reason);

      res.json({
        success: true,
        message: 'Conversation terminated successfully'
      });
    } catch (error) {
      console.error('Error terminating conversation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to terminate conversation',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  })();
});

/**
 * GET /api/agent/conversations
 * List all active conversations
 */
router.get('/conversations', (req, res) => {
  (async () => {
    try {
      const activeConversations = await temporalService.listActiveConversations();

      res.json({
        success: true,
        data: { activeConversations }
      });
    } catch (error) {
      console.error('Error listing conversations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to list conversations',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  })();
});

/**
 * GET /api/agent/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'AI Agent service is healthy',
    timestamp: new Date().toISOString()
  });
});

export default router; 