import express from 'express';
import { container } from 'tsyringe';
import { AIAgentController } from './ai-agent.controller.js';
import { authenticate } from '@middlewares/auth-guard.js';

const router: express.Router = express.Router();
const controller: AIAgentController = container.resolve(AIAgentController);

router.post('/execute', authenticate, controller.executeAgent);
router.get('/conversations', authenticate, controller.getUserConversations);
router.get('/conversations/:conversationId/history', authenticate, controller.getConversationHistory);

export default router;