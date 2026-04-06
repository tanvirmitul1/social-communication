import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { singleton, inject } from 'tsyringe';
import axios from 'axios';
import { config } from '../../config/env';
import { AIConversationRepository } from './ai-conversation.repository';
import { AIChatMessageRepository } from './ai-chat-message.repository';

@singleton()
export class AIAgentService {
  private openai: OpenAI | null = null;
  private googleAI: GoogleGenerativeAI | null = null;

  constructor(
    @inject('AIConversationRepository') private conversationRepo: AIConversationRepository,
    @inject('AIChatMessageRepository') private messageRepo: AIChatMessageRepository
  ) {
    // Initialize AI clients if API keys are available
    if (config.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });
    }
    
    if (config.GOOGLE_AI_API_KEY) {
      this.googleAI = new GoogleGenerativeAI(config.GOOGLE_AI_API_KEY);
    }
  }

  async executeAgent(userId: string, userInput: string, conversationId?: string) {
    let convId = conversationId;
    
    // Create or retrieve conversation
    if (!convId) {
      const conversation = await this.conversationRepo.create({
        userId,
        title: userInput.substring(0, 50), // Use first 50 chars of input as title
      });
      convId = conversation.id;
    } else {
      // Verify conversation belongs to user
      const existingConv = await this.conversationRepo.findById(convId);
      if (existingConv) {
        if (existingConv.userId !== userId) {
          throw new Error('Unauthorized: You do not have permission to access this conversation');
        }
        // If conversation exists and belongs to user, use it
        convId = existingConv.id;
      } else {
        // If conversation doesn't exist, create a new one (treat as if no ID was provided)
        const conversation = await this.conversationRepo.create({
          userId,
          title: userInput.substring(0, 50), // Use first 50 chars of input as title
        });
        convId = conversation.id;
      }
    }

    // Save user message
    await this.messageRepo.create({
      conversationId: convId,
      sender: 'user',
      content: userInput,
    });

    // Generate AI response with fallback mechanism
    let aiResponse: string;
    try {
      aiResponse = await this.generateResponseWithFallback(userInput);
    } catch (error) {
      console.error('AI generation failed:', error);
      aiResponse = 'Sorry, I encountered an error processing your request. Please try again.';
    }

    // Save AI response
    await this.messageRepo.create({
      conversationId: convId,
      sender: 'ai',
      content: aiResponse,
    });

    return {
      conversationId: convId,
      response: aiResponse,
    };
  }

  private async generateResponseWithFallback(prompt: string): Promise<string> {
    // Try OpenAI first
    if (this.openai) {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
        });
        
        return response.choices[0].message.content || 'No response generated.';
      } catch (openaiError) {
        console.warn('OpenAI request failed:', openaiError);
      }
    }

    // Try Google AI if OpenAI fails
    if (this.googleAI) {
      try {
        const model = this.googleAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        return response.text() || 'No response generated.';
      } catch (googleError) {
        console.warn('Google AI request failed:', googleError);
      }
    }

    // Try DeepSeek AI if both OpenAI and Google AI fail
    try {
      const response = await axios.post(
        'https://api.deepseek.com/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
        },
        {
          headers: {
            'Authorization': `Bearer ${config.DEEPSEEK_AI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.choices[0].message?.content || 'No response generated.';
    } catch (deepseekError) {
      console.error('DeepSeek AI request failed:', deepseekError);
      throw new Error('All AI providers failed to generate a response.');
    }
  }

  async getConversationHistory(conversationId: string) {
    return this.messageRepo.findByConversationId(conversationId, 0, 100); // Last 100 messages
  }

  async getUserConversations(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    return this.conversationRepo.findByUserId(userId, skip, limit);
  }
}