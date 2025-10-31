"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("./config/env");
const securityHeaders_1 = require("./middlewares/securityHeaders");
const rateLimit_1 = require("./middlewares/rateLimit");
const notFoundHandler_1 = require("./middlewares/notFoundHandler");
const errorHandler_1 = require("./middlewares/errorHandler");
const routes_1 = __importDefault(require("./modules/auth/routes"));
const routes_2 = __importDefault(require("./modules/users/routes"));
const routes_3 = __importDefault(require("./modules/projects/routes"));
const routes_4 = __importDefault(require("./modules/drafts/routes"));
const routes_5 = __importDefault(require("./modules/message-cards/routes"));
const routes_6 = __importDefault(require("./modules/designers/routes"));
const routes_7 = __importDefault(require("./modules/orders/routes"));
const routes_8 = __importDefault(require("./modules/contact/routes"));
const routes_9 = __importDefault(require("./modules/payments/routes"));
const routes_10 = __importDefault(require("./modules/organizations/routes"));
const routes_11 = __importDefault(require("./modules/templates/routes"));
const routes_12 = __importDefault(require("./modules/categories/routes"));
const routes_13 = __importDefault(require("./modules/comments/routes"));
const routes_14 = __importDefault(require("./modules/search/routes"));
const routes_15 = __importDefault(require("./modules/notifications/routes"));
const routes_16 = __importDefault(require("./modules/assets/routes"));
const routes_17 = __importDefault(require("./modules/wallet/routes"));
const routes_18 = __importDefault(require("./modules/likes/routes"));
const routes_19 = __importDefault(require("./modules/addresses/routes"));
const routes_20 = __importDefault(require("./modules/returns/routes"));
const routes_21 = __importDefault(require("./modules/ai/routes"));
const routes_22 = __importDefault(require("./modules/shipments/routes"));
const routes_23 = __importDefault(require("./modules/locations/routes"));
// Lazy-load swagger only if installed
let swaggerUi = null;
let yaml = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    swaggerUi = require('swagger-ui-express');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    yaml = require('yamljs');
}
catch { }
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const metrics_1 = require("./middlewares/metrics");
const ai_queue_1 = require("./queue/ai.queue");
const asyncHandler_1 = require("./shared/helpers/asyncHandler");
const auth_service_1 = require("./modules/auth/service/auth.service");
const express_2 = require("express");
const app = (0, express_1.default)();
app.set('trust proxy', 1);
// Tek bir helmet konfigürü kullanmak için securityHeaders yeterlidir
app.use((0, securityHeaders_1.securityHeaders)());
app.use((0, cors_1.default)({
    origin: (origin, cb) => {
        if (!origin)
            return cb(null, true);
        if (env_1.env.ALLOWED_ORIGINS.includes(origin))
            return cb(null, true);
        cb(Object.assign(new Error('CORS not allowed'), { status: 403 }));
    },
    credentials: true,
}));
app.use(express_1.default.json({ limit: '2mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// Metrics middleware (must be before routes to capture durations)
app.use(metrics_1.metricsMiddleware);
// CSRF token üret (yoksa set et) – kriptografik güçlü token
app.use((req, res, next) => {
    if (!req.cookies?.csrf) {
        const token = crypto_1.default.randomBytes(16).toString('hex');
        const base = { httpOnly: false, sameSite: 'lax', secure: env_1.env.COOKIE_SECURE };
        const opts = env_1.env.COOKIE_DOMAIN ? { ...base, domain: env_1.env.COOKIE_DOMAIN } : base;
        res.cookie('csrf', token, opts);
    }
    next();
});
// Test kolaylığı için CSRF token'ı tetikleyen endpoint
app.get('/csrf', (req, res) => {
    let token = req.cookies?.csrf;
    if (!token) {
        token = crypto_1.default.randomBytes(16).toString('hex');
        const base = { httpOnly: false, sameSite: 'lax', secure: env_1.env.COOKIE_SECURE };
        const opts = env_1.env.COOKIE_DOMAIN ? { ...base, domain: env_1.env.COOKIE_DOMAIN } : base;
        res.cookie('csrf', token, opts);
    }
    res.status(200).json({ token });
});
// CSRF double-submit doğrulaması (state-changing)
app.use((req, res, next) => {
    if (env_1.env.NODE_ENV === 'test')
        return next();
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS')
        return next();
    const bypass = new Set([
        // legacy
        '/api/auth/refresh',
        '/api/payments/callback',
        '/api/shipments/webhook/mock',
        '/api/auth/register',
        '/api/auth/login',
        '/api/contact',
        // versioned
        '/api/v1/auth/refresh',
        '/api/v1/payments/callback',
        '/api/v1/shipments/webhook/mock',
        '/api/v1/auth/register',
        '/api/v1/auth/login',
        '/api/v1/likes/toggle',
        '/api/v1/contact',
    ]);
    if (bypass.has(req.path))
        return next();
    const csrfCookie = req.cookies?.csrf;
    const csrfHeader = req.headers['x-csrf-token'];
    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
        return res.status(403).json({ message: 'CSRF token invalid' });
    }
    next();
});
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});
// Prometheus metrics endpoint
app.get('/metrics', (0, asyncHandler_1.asyncHandler)(metrics_1.metricsController));
// Background metrics updater for AI queue depth
if (ai_queue_1.aiQueue) {
    setInterval(() => {
        void (async () => {
            try {
                const queueAny = ai_queue_1.aiQueue;
                const counts = await queueAny.getJobCounts('waiting', 'delayed');
                const waiting = Number(counts?.waiting || 0);
                const delayed = Number(counts?.delayed || 0);
                metrics_1.aiJobsGauge.set(waiting + delayed);
            }
            catch {
                // ignore metrics errors
            }
        })();
    }, 10000);
}
// API versioning (mount both legacy /api and versioned /api/v1 during transition)
const v1 = (0, express_2.Router)();
v1.use('/auth', (req, res, next) => { void (0, rateLimit_1.rateLimitMiddleware)(req, res, next); }, routes_1.default);
v1.use('/users', routes_2.default);
v1.use('/projects', routes_3.default);
v1.use('/drafts', routes_4.default);
v1.use('/message-cards', routes_5.default);
v1.use('/orders', routes_7.default);
v1.use('/contact', (req, res, next) => { void (0, rateLimit_1.rateLimitMiddleware)(req, res, next); }, routes_8.default);
v1.use('/designers', routes_6.default);
v1.use('/payments', routes_9.default);
v1.use('/organizations', routes_10.default);
v1.use('/templates', routes_11.default);
v1.use('/categories', routes_12.default);
v1.use('/comments', routes_13.default);
v1.use('/search', routes_14.default);
v1.use('/notifications', routes_15.default);
v1.use('/assets', routes_16.default);
v1.use('/wallet', routes_17.default);
v1.use('/likes', routes_18.default);
v1.use('/addresses', routes_19.default);
v1.use('/returns', routes_20.default);
v1.use('/ai', routes_21.default);
v1.use('/shipments', routes_22.default);
v1.use('/locations', routes_23.default);
app.use('/api/v1', v1);
// Legacy (to be removed after FE cutover)
app.use('/api', v1);
// Swagger UI (public docs)
try {
    if (swaggerUi && yaml) {
        const openapi = yaml.load(path_1.default.join(process.cwd(), 'src', 'docs', 'openapi.yaml'));
        app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));
    }
}
catch {
    // ignore if yamljs not available or file missing
}
// Handle email verification links from emails (GET /verify-email?token=...)
app.get('/verify-email', (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const token = String(req.query.token || '').trim();
    if (!token)
        return res.status(400).json({ message: 'Token is required' });
    const service = new auth_service_1.AuthService();
    await service.verifyEmail(token);
    const redirectTo = env_1.env.EMAIL_REDIRECT_TO || 'http://localhost:3001/pages/user-Login.html';
    res.redirect(302, redirectTo);
}));
// Serve uploaded files read-only from PUBLIC upload dir (outside of API namespaces)
const publicUploadAbs = path_1.default.isAbsolute(env_1.env.UPLOAD_PUBLIC_DIR) ? env_1.env.UPLOAD_PUBLIC_DIR : path_1.default.join(process.cwd(), env_1.env.UPLOAD_PUBLIC_DIR);
const privateUploadAbs = path_1.default.isAbsolute(env_1.env.UPLOAD_PRIVATE_DIR) ? env_1.env.UPLOAD_PRIVATE_DIR : path_1.default.join(process.cwd(), env_1.env.UPLOAD_PRIVATE_DIR);
if (!fs_1.default.existsSync(publicUploadAbs))
    fs_1.default.mkdirSync(publicUploadAbs, { recursive: true });
if (!fs_1.default.existsSync(privateUploadAbs))
    fs_1.default.mkdirSync(privateUploadAbs, { recursive: true });
app.use('/uploads', express_1.default.static(publicUploadAbs, { fallthrough: false, dotfiles: 'ignore', etag: true, immutable: false, maxAge: '7d' }));
app.use(notFoundHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
exports.default = app;
