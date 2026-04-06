/**
 * UploadService — Cloudinary-backed media upload abstraction.
 *
 * Supports image and file uploads with automatic folder organisation,
 * image transformations (resize/compress), and signed deletion.
 *
 * Requires env vars:
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 */

import { injectable } from 'tsyringe';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { config } from '@config/env.js';
import { logger } from '@config/logger.js';
import { AppError } from '@common/errors.js';
import { Readable } from 'stream';

export interface UploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  resourceType: string;
  format: string;
  width?: number;
  height?: number;
  duration?: number;
  size: number;
  thumbnailUrl?: string;
}

export type UploadFolder = 'avatars' | 'posts' | 'messages' | 'groups';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB
const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]);
const ALLOWED_VIDEO_MIMES = new Set(['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']);
const ALLOWED_FILE_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]);

@injectable()
export class UploadService {
  private readonly isConfigured: boolean;

  constructor() {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = config as any;

    this.isConfigured = !!(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET);

    if (this.isConfigured) {
      cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET,
        secure: true,
      });
      logger.info('UploadService: Cloudinary configured');
    } else {
      logger.warn('UploadService: Cloudinary env vars not set — uploads will fail');
    }
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Upload an image file from a multer buffer.
   * Automatically resizes to max 1920×1080, converts to webp.
   */
  async uploadImage(
    buffer: Buffer,
    mimetype: string,
    folder: UploadFolder = 'posts'
  ): Promise<UploadResult> {
    this.assertConfigured();
    this.validateMime(mimetype, ALLOWED_IMAGE_MIMES, 'image');
    this.validateSize(buffer.length, MAX_IMAGE_BYTES, 'image');

    const result = await this.uploadToCloudinary(buffer, {
      folder: `social/${folder}`,
      resource_type: 'image',
      transformation: [
        { width: 1920, height: 1080, crop: 'limit', quality: 'auto', fetch_format: 'webp' },
      ],
    });

    // Generate thumbnail for images
    const thumbnailUrl = cloudinary.url(result.public_id, {
      width: 320,
      height: 320,
      crop: 'fill',
      quality: 'auto',
      fetch_format: 'webp',
    });

    return this.mapResult(result, thumbnailUrl);
  }

  /**
   * Upload a video file. Generates a poster thumbnail automatically.
   */
  async uploadVideo(buffer: Buffer, mimetype: string): Promise<UploadResult> {
    this.assertConfigured();
    this.validateMime(mimetype, ALLOWED_VIDEO_MIMES, 'video');
    this.validateSize(buffer.length, MAX_VIDEO_BYTES, 'video');

    const result = await this.uploadToCloudinary(buffer, {
      folder: 'social/posts',
      resource_type: 'video',
      // Auto-generate poster thumbnail at 1 second
      eager: [{ format: 'jpg', transformation: [{ start_offset: '1' }] }],
      eager_async: false,
    });

    const thumbnailUrl =
      result.eager?.[0]?.secure_url ??
      cloudinary.url(result.public_id, { resource_type: 'video', format: 'jpg' });

    return this.mapResult(result, thumbnailUrl);
  }

  /**
   * Upload a generic file (PDF, doc, etc.).
   */
  async uploadFile(buffer: Buffer, mimetype: string): Promise<UploadResult> {
    this.assertConfigured();
    this.validateMime(mimetype, ALLOWED_FILE_MIMES, 'file');
    this.validateSize(buffer.length, MAX_FILE_BYTES, 'file');

    const result = await this.uploadToCloudinary(buffer, {
      folder: 'social/files',
      resource_type: 'raw',
    });

    return this.mapResult(result);
  }

  /**
   * Upload an avatar image — square crop, max 500×500.
   */
  async uploadAvatar(buffer: Buffer, mimetype: string): Promise<UploadResult> {
    this.assertConfigured();
    this.validateMime(mimetype, ALLOWED_IMAGE_MIMES, 'image');
    this.validateSize(buffer.length, MAX_IMAGE_BYTES, 'image');

    const result = await this.uploadToCloudinary(buffer, {
      folder: 'social/avatars',
      resource_type: 'image',
      transformation: [
        { width: 500, height: 500, crop: 'fill', gravity: 'face', quality: 'auto', fetch_format: 'webp' },
      ],
    });

    return this.mapResult(result);
  }

  /**
   * Delete a previously uploaded resource by its public_id.
   */
  async deleteResource(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<void> {
    this.assertConfigured();
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (err) {
      logger.warn({ err, publicId }, 'Failed to delete Cloudinary resource');
    }
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private uploadToCloudinary(
    buffer: Buffer,
    options: Record<string, unknown>
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        options as any,
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            reject(new AppError(error?.message ?? 'Upload failed', 502, 'UPLOAD_ERROR'));
          } else {
            resolve(result);
          }
        }
      );

      Readable.from(buffer).pipe(stream);
    });
  }

  private mapResult(result: UploadApiResponse, thumbnailUrl?: string): UploadResult {
    return {
      url: result.url,
      secureUrl: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      format: result.format,
      width: result.width,
      height: result.height,
      duration: result.duration,
      size: result.bytes,
      thumbnailUrl,
    };
  }

  private assertConfigured(): void {
    if (!this.isConfigured) {
      throw new AppError('Media uploads are not configured on this server', 503, 'UPLOAD_NOT_CONFIGURED');
    }
  }

  private validateMime(mimetype: string, allowed: Set<string>, label: string): void {
    if (!allowed.has(mimetype)) {
      throw new AppError(`Unsupported ${label} type: ${mimetype}`, 400, 'UNSUPPORTED_MEDIA_TYPE');
    }
  }

  private validateSize(bytes: number, max: number, label: string): void {
    if (bytes > max) {
      const maxMB = Math.round(max / 1024 / 1024);
      throw new AppError(`${label} exceeds maximum size of ${maxMB}MB`, 400, 'FILE_TOO_LARGE');
    }
  }
}
