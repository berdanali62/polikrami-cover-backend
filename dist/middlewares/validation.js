"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = validateBody;
exports.validateQuery = validateQuery;
exports.validateParams = validateParams;
function validateBody(schema) {
    return (req, res, next) => {
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
function validateQuery(schema) {
    return (req, res, next) => {
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
function validateParams(schema) {
    return (req, res, next) => {
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
