import { StatusCodes } from 'http-status-codes';
import { AppError } from './AppError.js';

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, StatusCodes.UNAUTHORIZED, true, 'UNAUTHORIZED');
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}
