"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
const jwt_1 = require("../shared/helpers/jwt");
async function requireAuth(req, res, next) {
    const bearer = req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.substring(7)
        : undefined;
    const token = req.cookies?.access || bearer;
    if (!token)
        return res.status(401).json({ message: 'Unauthorized' });
    const payload = (0, jwt_1.verifyToken)(token, 'access');
    if (!payload)
        return res.status(401).json({ message: 'Unauthorized' });
    // Use role from JWT (no DB query needed)
    req.user = { id: payload.userId, role: payload.role };
    next();
}
function requireRole(role) {
    return async function roleCheck(req, res, next) {
        // First ensure user is authenticated
        let authCompleted = false;
        await new Promise((resolve) => {
            requireAuth(req, res, () => {
                authCompleted = true;
                resolve();
            });
        });
        // If requireAuth sent a response, don't proceed
        if (res.headersSent) {
            return;
        }
        // Check role
        if (!req.user?.role || req.user.role !== role) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        next();
    };
}
