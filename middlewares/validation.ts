import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '@common/errors.js';

export const validate = (schema: ZodSchema, source?: 'body' | 'params' | 'query') => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      // If source is specified, validate only that part of the request
      // Otherwise, validate the entire request object (for schemas with params/query/body structure)
      const dataToValidate = source ? req[source] : { params: req.params, query: req.query, body: req.body };
      schema.parse(dataToValidate);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError('Validation failed', formattedErrors);
      }
      next(error);
    }
  };
};
