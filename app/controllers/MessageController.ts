import { injectable, inject } from 'tsyringe';
import { Response } from 'express';
import { MessageService } from '@services/MessageService.js';
import { ResponseHandler } from '@utils/index.js';
import { AuthRequest } from '@middlewares/auth.middleware.js';
import { SendMessageInput, EditMessageInput } from '@validations/index.js';
import { MessageStatus } from '@prisma/client';

@injectable()
export class MessageController {
  constructor(@inject('MessageService') private messageService: MessageService) {}

  async sendMessage(req: AuthRequest, res: Response): Promise<Response> {
    const senderId = req.user!.id;
    const data = req.body as SendMessageInput;

    const message = await this.messageService.sendMessage({
      senderId,
      ...data,
    });

    return ResponseHandler.created(res, message, 'Message sent successfully');
  }

  async getMessage(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;

    const message = await this.messageService.getMessage(id);

    return ResponseHandler.success(res, message);
  }

  async getGroupMessages(req: AuthRequest, res: Response): Promise<Response> {
    const { groupId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const result = await this.messageService.getGroupMessages(groupId, Number(page), Number(limit));

    return ResponseHandler.paginated(res, result.messages, result.page, result.limit, result.total);
  }

  async getDirectMessages(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { otherUserId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const result = await this.messageService.getDirectMessages(
      userId,
      otherUserId,
      Number(page),
      Number(limit)
    );

    return ResponseHandler.paginated(res, result.messages, result.page, result.limit, result.total);
  }

  async editMessage(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { id } = req.params;
    const { content } = req.body as EditMessageInput;

    const message = await this.messageService.editMessage(id, userId, content);

    return ResponseHandler.success(res, message, 'Message edited successfully');
  }

  async deleteMessage(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { id } = req.params;

    await this.messageService.deleteMessage(id, userId);

    return ResponseHandler.success(res, null, 'Message deleted successfully');
  }

  async markAsDelivered(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;

    const message = await this.messageService.updateMessageStatus(id, MessageStatus.DELIVERED);

    return ResponseHandler.success(res, message);
  }

  async markAsSeen(req: AuthRequest, res: Response): Promise<Response> {
    const { id } = req.params;

    const message = await this.messageService.updateMessageStatus(id, MessageStatus.SEEN);

    return ResponseHandler.success(res, message);
  }

  async addReaction(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { id } = req.params;
    const { emoji } = req.body;

    await this.messageService.addReaction(id, userId, emoji);

    return ResponseHandler.success(res, null, 'Reaction added');
  }

  async removeReaction(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { id } = req.params;
    const { emoji } = req.body;

    await this.messageService.removeReaction(id, userId, emoji);

    return ResponseHandler.success(res, null, 'Reaction removed');
  }

  async searchMessages(req: AuthRequest, res: Response): Promise<Response> {
    const userId = req.user!.id;
    const { query, page = 1, limit = 20 } = req.query;

    const result = await this.messageService.searchMessages(
      query as string,
      userId,
      Number(page),
      Number(limit)
    );

    return ResponseHandler.paginated(res, result.messages, result.page, result.limit, result.total);
  }
}
