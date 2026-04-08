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
   *     summary: Upload an image (max 10 MB — converted to WebP, thumbnail generated)
   *     description: |
   *       Accepts JPEG, PNG, GIF, WebP. Converts to WebP at max 1920×1080.
   *       A 320×320 thumbnail is also generated.
   *       Store `secureUrl` and `publicId` — pass `secureUrl` to POST /posts or messages,
   *       use `publicId` to delete the file later via Cloudinary.
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
   *                 description: Cloudinary sub-folder for organisation
   *     responses:
   *       200:
   *         description: Image uploaded successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data: { $ref: '#/components/schemas/UploadResult' }
   *       400:
   *         description: No file provided, unsupported MIME type, or file too large
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Error' }
   *       401:
   *         description: Unauthorized
   *       429:
   *         description: Rate limit exceeded (20 uploads/min)
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
   *     summary: Upload a video (max 50 MB — poster thumbnail auto-generated)
   *     description: Accepts MP4, WebM, MOV, AVI. A poster thumbnail is generated at the 1s mark.
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
   *     responses:
   *       200:
   *         description: Video uploaded successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data: { $ref: '#/components/schemas/UploadResult' }
   *       400:
   *         description: No file, unsupported MIME type, or exceeds 50 MB limit
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Error' }
   *       401:
   *         description: Unauthorized
   *       429:
   *         description: Rate limit exceeded (20 uploads/min)
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
   *     summary: Upload a document or binary file (max 25 MB)
   *     description: Accepts PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, TXT, ZIP, CSV. Stored as raw (no transformation).
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
   *     responses:
   *       200:
   *         description: File uploaded successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data: { $ref: '#/components/schemas/UploadResult' }
   *       400:
   *         description: No file, unsupported MIME type, or exceeds 25 MB limit
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Error' }
   *       401:
   *         description: Unauthorized
   *       429:
   *         description: Rate limit exceeded (20 uploads/min)
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
   *     summary: Upload a user avatar (auto-cropped to 500×500 square, face-gravity)
   *     description: |
   *       Accepts JPEG, PNG, GIF, WebP (max 10 MB).
   *       Cloudinary auto-detects faces and centers the crop on the face.
   *       Use the returned `secureUrl` as the user's `avatar` field.
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
   *     responses:
   *       200:
   *         description: Avatar uploaded and cropped successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success: { type: boolean, example: true }
   *                 data: { $ref: '#/components/schemas/UploadResult' }
   *       400:
   *         description: No file, unsupported MIME type, or exceeds 10 MB limit
   *         content:
   *           application/json:
   *             schema: { $ref: '#/components/schemas/Error' }
   *       401:
   *         description: Unauthorized
   *       429:
   *         description: Rate limit exceeded (20 uploads/min)
   */
  async uploadAvatar(req: AuthRequest, res: Response): Promise<Response> {
    const file = req.file;
    if (!file) throw new AppError('No file provided', 400, 'NO_FILE');

    const result = await this.uploadService.uploadAvatar(file.buffer, file.mimetype);
    return ResponseHandler.success(res, result, 'Avatar uploaded successfully');
  }
}
