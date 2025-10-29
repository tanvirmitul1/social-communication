/**
 * Common TypeScript Types and Interfaces
 */

import { Request } from 'express';
import { User } from '@prisma/client';

// Extend Express Request with user
export interface AuthRequest extends Request {
  user?: User;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
