import { Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { asyncHandler } from '@common/async-handler.js';
import { AIAgentService } from './ai-agent.service.js';
import { AuthRequest } from '@middlewares/auth-guard.js';

@injectable()
export class AIAgentController {
  constructor(@inject('AIAgentService') private aiAgentService: AIAgentService) {}

  /**
   * @swagger
   * /ai-agent/execute:
   *   post:
   *     summary: Execute AI Agent
   *     description: Sends user input to the AI agent and receives a response. The system maintains conversation context and supports multiple AI providers with fallback.
   *     tags: [AI-Agent]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/AIAgentExecuteRequest'
   *     responses:
   *       200:
   *         description: AI response generated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AIAgentExecuteResponse'
   *       400:
   *         description: Bad request
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - User does not have permission to access the conversation
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Internal server error
   */
  executeAgent = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userInput, conversationId } = req.body;
    const userId = req.user!.id;

    if (!userInput || typeof userInput !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'userInput is required and must be a string',
      });
    }

    try {
      const result = await this.aiAgentService.executeAgent(userId, userInput, conversationId);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      // Handle specific errors from the service
      if (error instanceof Error) {
        if (error.message.includes('Unauthorized') || error.message.includes('permission')) {
          return res.status(403).json({
            success: false,
            message: 'Forbidden: You do not have permission to access this conversation',
            error: error.message,
          });
        }
      }
      
      // For other errors, let the error handler handle it
      throw error;
    }
  });

  /**
   * @swagger
   * /ai-agent/conversations/{conversationId}/history:
   *   get:
   *     summary: Get conversation history
   *     description: Retrieves the message history for a specific conversation.
   *     tags: [AI-Agent]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: conversationId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: The ID of the conversation to retrieve history for
   *     responses:
   *       200:
   *         description: Conversation history retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AIAgentHistoryResponse'
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Conversation not found
   *       500:
   *         description: Internal server error
   */
  getConversationHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { conversationId } = req.params;
    const userId = req.user!.id;

    // Verify conversation belongs to user
    const conversation = await this.aiAgentService['conversationRepo'].findById(conversationId);
    if (!conversation || conversation.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found',
      });
    }

    const history = await this.aiAgentService.getConversationHistory(conversationId);

    return res.status(200).json({
      success: true,
      data: history,
    });
  });

  /**
   * @swagger
   * /ai-agent/conversations:
   *   get:
   *     summary: Get user conversations
   *     description: Retrieves a paginated list of conversations for the current user.
   *     tags: [AI-Agent]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Page number for pagination
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *           maximum: 100
   *         description: Number of conversations per page
   *     responses:
   *       200:
   *         description: Conversations retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AIAgentConversationsResponse'
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Internal server error
   */
  getUserConversations = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const conversations = await this.aiAgentService.getUserConversations(userId, page, limit);

    res.status(200).json({
      success: true,
      data: conversations,
    });
  });
}