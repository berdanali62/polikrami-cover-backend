"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAccountLock = checkAccountLock;
exports.recordLoginFailure = recordLoginFailure;
exports.recordLoginSuccess = recordLoginSuccess;
const database_1 = require("../config/database");
const env_1 = require("../config/env");
async function checkAccountLock(req, res, next) {
    try {
        const email = req.body?.email?.toLowerCase?.();
        if (!email)
            return next();
        const user = await database_1.prisma.user.findFirst({ where: { email } });
        if (!user)
            return next(); // Do not reveal
        const since = new Date(Date.now() - env_1.env.LOGIN_LOCKOUT_WINDOW_MINUTES * 60 * 1000);
        const fails = await database_1.prisma.event.count({ where: { userId: user.id, type: 'login_failed', createdAt: { gt: since } } });
        if (fails >= env_1.env.MAX_FAILED_LOGIN_ATTEMPTS)
            return res.status(429).json({ message: 'Too many failed attempts. Please try again later.' });
        next();
    }
    catch (err) {
        next(err);
    }
}
async function recordLoginFailure(userId) {
    try {
        await database_1.prisma.event.create({ data: { userId, type: 'login_failed' } });
    }
    catch { /* ignore */ }
}
async function recordLoginSuccess(userId) {
    try {
        await database_1.prisma.event.create({ data: { userId, type: 'login_success' } });
    }
    catch { /* ignore */ }
}
