import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export class ResponseHandler {
  static success<T>(
    res: Response,
    data?: T,
    message?: string,
    statusCode: number = StatusCodes.OK
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
    };
    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data?: T, message?: string): Response {
    return this.success(res, data, message, StatusCodes.CREATED);
  }

  static error(
    res: Response,
    message: string,
    statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
    error?: string
  ): Response {
    const response: ApiResponse = {
      success: false,
      message,
      error,
    };
    return res.status(statusCode).json(response);
  }

  static paginated<T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number,
    message?: string
  ): Response {
    const response: ApiResponse<T[]> = {
      success: true,
      message,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
    return res.status(StatusCodes.OK).json(response);
  }
}
