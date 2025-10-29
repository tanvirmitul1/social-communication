import { nanoid } from 'nanoid';

export { ResponseHandler } from './response.js';
export { asyncHandler } from './asyncHandler.js';

export class Helpers {
  static generateId(size: number = 21): string {
    return nanoid(size);
  }

  static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static sanitizeUser(user: unknown): unknown {
    if (typeof user !== 'object' || user === null) return user;
    const { passwordHash: _passwordHash, ...sanitized } = user as Record<string, unknown>;
    return sanitized;
  }

  static paginate(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    return { skip, take: limit };
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
    return usernameRegex.test(username);
  }

  static extractTokenFromHeader(header: string | undefined): string | null {
    if (!header || !header.startsWith('Bearer ')) {
      return null;
    }
    return header.substring(7);
  }
}
