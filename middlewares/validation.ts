import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '@common/errors.js';

export const validate = (schema: ZodSchema, source?: 'body' | 'params' | 'query') => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      let dataToValidate: unknown;

      if (source) {
        // If source is explicitly specified, validate only that part
        dataToValidate = req[source];
      } else {
        // Auto-detect: Check if schema has 'body', 'params', or 'query' keys
        // by attempting to parse a test object and checking the error path
        const testParse = schema.safeParse({ params: {}, query: {}, body: {} });

        if (!testParse.success) {
          const hasStructuredKeys = testParse.error.errors.some((err) =>
            err.path[0] === 'body' || err.path[0] === 'params' || err.path[0] === 'query'
          );

          if (hasStructuredKeys) {
            // Schema expects structured request (e.g., { body: {...}, params: {...}, query: {...} })
            dataToValidate = { params: req.params, query: req.query, body: req.body };
          } else {
            // Schema expects direct body data (backward compatibility)
            dataToValidate = req.body;
          }
        } else {
          // If test parse succeeds with empty object, assume direct body validation
          dataToValidate = req.body;
        }
      }

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
