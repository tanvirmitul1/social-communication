import { StatusCodes } from 'http-status-codes';
import { AppError } from './AppError.js';

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden') {
    super(message, StatusCodes.FORBIDDEN, true, 'FORBIDDEN');
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}
