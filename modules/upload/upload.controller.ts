import { injectable, inject } from 'tsyringe';
import { Response } from 'express';
import { UploadService, UploadFolder } from '@infrastructure/upload.service.js';
import { ResponseHandler } from '@common/utils.js';
import { AuthRequest } from '@middlewares/auth-guard.js';
import { AppError } from '@common/errors.js';

@injectable()
export class UploadController {
  constructor(@inject('UploadService') private uploadService: UploadService) {
    this.uploadImage = this.uploadImage.bind(this);
    this.uploadVideo = this.uploadVideo.bind(this);
    this.uploadFile = this.uploadFile.bind(this);
    this.uploadAvatar = this.uploadAvatar.bind(this);
  }

  /**
   * @swagger
   * /upload/image:
   *   post:
   *     summary: Upload an image (post/message media)
   *     tags: [Upload]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required: [file]
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   *               folder:
   *                 type: string
   *                 enum: [posts, messages, groups]
   *                 default: posts
   *     responses:
   *       200:
   *         description: Image uploaded successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 url: { type: string }
   *                 secureUrl: { type: string }
   *                 publicId: { type: string }
   *                 width: { type: integer }
   *                 height: { type: integer }
   *                 size: { type: integer }
   *                 thumbnailUrl: { type: string }
   */
  async uploadImage(req: AuthRequest, res: Response): Promise<Response> {
    const file = req.file;
    if (!file) throw new AppError('No file provided', 400, 'NO_FILE');

    const folder = (req.body?.folder as UploadFolder) || 'posts';
    const result = await this.uploadService.uploadImage(file.buffer, file.mimetype, folder);

    return ResponseHandler.success(res, result, 'Image uploaded successfully');
  }

  /**
   * @swagger
   * /upload/video:
   *   post:
   *     summary: Upload a video
   *     tags: [Upload]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required: [file]
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   */
  async uploadVideo(req: AuthRequest, res: Response): Promise<Response> {
    const file = req.file;
    if (!file) throw new AppError('No file provided', 400, 'NO_FILE');

    const result = await this.uploadService.uploadVideo(file.buffer, file.mimetype);
    return ResponseHandler.success(res, result, 'Video uploaded successfully');
  }

  /**
   * @swagger
   * /upload/file:
   *   post:
   *     summary: Upload a document/file
   *     tags: [Upload]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required: [file]
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   */
  async uploadFile(req: AuthRequest, res: Response): Promise<Response> {
    const file = req.file;
    if (!file) throw new AppError('No file provided', 400, 'NO_FILE');

    const result = await this.uploadService.uploadFile(file.buffer, file.mimetype);
    return ResponseHandler.success(res, result, 'File uploaded successfully');
  }

  /**
   * @swagger
   * /upload/avatar:
   *   post:
   *     summary: Upload a user avatar (square crop, max 500x500)
   *     tags: [Upload]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required: [file]
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   */
  async uploadAvatar(req: AuthRequest, res: Response): Promise<Response> {
    const file = req.file;
    if (!file) throw new AppError('No file provided', 400, 'NO_FILE');

    const result = await this.uploadService.uploadAvatar(file.buffer, file.mimetype);
    return ResponseHandler.success(res, result, 'Avatar uploaded successfully');
  }
}
