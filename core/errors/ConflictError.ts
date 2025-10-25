import { StatusCodes } from 'http-status-codes';
import { AppError } from './AppError.js';

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, StatusCodes.CONFLICT, true, 'CONFLICT');
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}
