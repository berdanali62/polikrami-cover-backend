import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      return res.status(400).json({
        message: 'Doğrulama hatası. Lütfen eksik veya hatalı alanları düzeltin.',
        errors: flat,
      });
    }
    req.body = parsed.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      return res.status(400).json({
        message: 'Doğrulama hatası. Lütfen sorgu parametrelerini kontrol edin.',
        errors: flat,
      });
    }
    // Note: Express Request genericleri ile bağlamak istenirse route seviyesinde tip verilebilir
    Object.assign(req.query, parsed.data);
    next();
  };
}

export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.params);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      return res.status(400).json({
        message: 'Doğrulama hatası. Lütfen adres parametrelerini (URL) kontrol edin.',
        errors: flat,
      });
    }
    Object.assign(req.params, parsed.data);
    next();
  };
}

