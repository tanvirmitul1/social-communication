import { StatusCodes } from 'http-status-codes';
import { AppError } from './AppError.js';

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, StatusCodes.NOT_FOUND, true, 'NOT_FOUND');
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}
