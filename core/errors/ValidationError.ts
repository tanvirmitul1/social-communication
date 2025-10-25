import { StatusCodes } from 'http-status-codes';
import { AppError } from './AppError.js';

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, StatusCodes.BAD_REQUEST, true, 'VALIDATION_ERROR', details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
