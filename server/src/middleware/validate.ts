import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        }));
        const messageSummary = issues.map((i) => (i.field ? `${i.field}: ${i.message}` : i.message)).join(', ');
        res.status(400).json({
          success: false,
          error: messageSummary || 'Validation failed',
          details: issues,
        });
        return;
      }
      res.status(400).json({ success: false, error: 'Invalid request data' });
    }
  };
};
