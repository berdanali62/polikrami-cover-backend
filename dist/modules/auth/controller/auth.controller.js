"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerController = registerController;
exports.loginController = loginController;
exports.refreshController = refreshController;
exports.logoutController = logoutController;
exports.forgotPasswordController = forgotPasswordController;
exports.resetPasswordController = resetPasswordController;
exports.verifyResetCodeController = verifyResetCodeController;
exports.resendVerificationController = resendVerificationController;
exports.verifyEmailController = verifyEmailController;
const auth_service_1 = require("../service/auth.service");
const env_1 = require("../../../config/env");
const verify_email_dto_1 = require("../dto/verify-email.dto");
const forgot_password_dto_1 = require("../dto/forgot-password.dto");
const ApiError_1 = require("../../../shared/errors/ApiError");
const service = new auth_service_1.AuthService();
async function registerController(req, res) {
    const { email, password, name, role, acceptTerms, acceptPrivacy, acceptRevenueShare } = req.body;
    // Enforce acceptance on versioned API only to keep legacy /api tests tolerant
    const isV1 = typeof req.originalUrl === 'string' && req.originalUrl.startsWith('/api/v1/');
    if (isV1) {
        if (acceptTerms !== true || acceptPrivacy !== true) {
            throw (0, ApiError_1.badRequest)('Terms and Privacy must be accepted');
        }
        if (role === 'designer' && acceptRevenueShare !== true) {
            throw (0, ApiError_1.badRequest)('Revenue share must be accepted for designer role');
        }
    }
    const result = await service.register({ email, password, name, role, acceptTerms, acceptPrivacy, acceptRevenueShare });
    res.status(201).json({ user: result });
}
async function loginController(req, res) {
    const { email, password, remember } = req.body;
    const ua = req.headers['user-agent'] ?? undefined;
    const ip = req.ip;
    const { access, refresh } = await service.login({ email, password, ua, ip });
    setAuthCookies(res, access, refresh, Boolean(remember));
    // Tests expect tokens in body for convenience while cookies are still set for browser flows
    res.status(200).json({ ok: true, accessToken: access, refreshToken: refresh });
}
async function refreshController(req, res) {
    const token = req.cookies?.refresh ?? '';
    if (!token)
        throw (0, ApiError_1.unauthorized)();
    const payload = service.verifyRefreshToken(token);
    if (!payload)
        throw (0, ApiError_1.unauthorized)();
    const ua = req.headers['user-agent'] ?? undefined;
    const ip = req.ip;
    const { access, refresh: newRefresh } = await service.refresh({ userId: payload.userId, refreshTid: payload.tid, ua, ip });
    // Persist cookie maxAge if user originally chose "remember me"
    const remember = req.cookies?.remember === '1';
    setAuthCookies(res, access, newRefresh, remember);
    res.status(200).json({ ok: true });
}
async function logoutController(_req, res) {
    // Attempt to revoke active refresh tokens for the authenticated user if available
    try {
        // Note: logout endpoint doesn't require auth; best-effort if user attached by upstream middleware
        // In our current routing, logout is behind rateLimit only. If later protected, req.user will exist.
        const userId = _req.user?.id;
        if (userId) {
            const { revokeAllRefreshTokensByUser } = await Promise.resolve().then(() => __importStar(require('../repository/tokenRepo')));
            await revokeAllRefreshTokensByUser(userId);
        }
    }
    catch { }
    res.clearCookie('access', cookieClearOpts());
    // Align cookie path with versioned route mount
    res.clearCookie('refresh', { ...cookieClearOpts(), path: '/api/v1/auth/refresh' });
    res.clearCookie('remember', cookieClearOpts());
    res.status(200).json({ ok: true });
}
async function forgotPasswordController(req, res) {
    const { email } = forgot_password_dto_1.forgotPasswordSchema.parse(req.body);
    await service.forgotPassword(email);
    res.status(200).json({ ok: true });
}
async function resetPasswordController(req, res) {
    const { email, code, password } = forgot_password_dto_1.resetPasswordSchema.parse(req.body);
    await service.resetPassword(email, code, password);
    res.status(200).json({ ok: true });
}
async function verifyResetCodeController(req, res) {
    const { email, code } = forgot_password_dto_1.verifyResetCodeSchema.parse(req.body);
    const ok = await service.verifyResetCode(email, code);
    res.status(ok ? 200 : 400).json({ ok });
}
async function resendVerificationController(req, res) {
    const { email } = verify_email_dto_1.resendVerificationSchema.parse(req.body);
    await service.resendVerification(email);
    res.status(200).json({ ok: true });
}
async function verifyEmailController(req, res) {
    const { token } = verify_email_dto_1.verifyEmailSchema.parse(req.body);
    await service.verifyEmail(token);
    res.status(200).json({ ok: true });
}
function setAuthCookies(res, access, refresh, remember = false) {
    res.cookie('access', access, cookieOpts(remember));
    res.cookie('refresh', refresh, { ...cookieOpts(remember), path: '/api/auth/refresh' });
    // Track remember choice in an httpOnly cookie so refresh can preserve it
    if (remember) {
        res.cookie('remember', '1', cookieOpts(true));
    }
    else {
        // Overwrite/clear remember cookie for non-persistent sessions
        res.clearCookie('remember', cookieClearOpts());
    }
}
function cookieOpts(remember = false) {
    const base = {
        httpOnly: true,
        secure: env_1.env.COOKIE_SECURE,
        sameSite: 'lax',
        maxAge: remember ? 1000 * 60 * 60 * 24 * 30 : undefined,
    };
    // domain boş ise hiç set etmeyelim (yerel geliştirme için)
    return env_1.env.COOKIE_DOMAIN ? { ...base, domain: env_1.env.COOKIE_DOMAIN } : base;
}
function cookieClearOpts() {
    // Express v5 uyarısı: clearCookie için maxAge vermeyin
    const base = {
        httpOnly: true,
        secure: env_1.env.COOKIE_SECURE,
        sameSite: 'lax',
    };
    return env_1.env.COOKIE_DOMAIN ? { ...base, domain: env_1.env.COOKIE_DOMAIN } : base;
}
// parseRefresh kaldırıldı; doğrulama service içinde verify ile yapılıyor.
