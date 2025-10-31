"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.verifyToken = verifyToken;
exports.decodeWithoutVerify = decodeWithoutVerify;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
function signAccessToken(payload) {
    const options = { algorithm: 'HS256', expiresIn: durationToSeconds(env_1.env.ACCESS_EXPIRES_IN) };
    return jsonwebtoken_1.default.sign({ ...payload, typ: 'access' }, env_1.env.JWT_ACCESS_SECRET, options);
}
function signRefreshToken(payload) {
    const options = { algorithm: 'HS256', expiresIn: durationToSeconds(env_1.env.REFRESH_EXPIRES_IN) };
    return jsonwebtoken_1.default.sign({ ...payload, typ: 'refresh' }, env_1.env.JWT_REFRESH_SECRET, options);
}
function verifyToken(token, kind) {
    try {
        const secret = kind === 'access' ? env_1.env.JWT_ACCESS_SECRET : env_1.env.JWT_REFRESH_SECRET;
        return jsonwebtoken_1.default.verify(token, secret);
    }
    catch {
        return null;
    }
}
function decodeWithoutVerify(token) {
    try {
        const payload = jsonwebtoken_1.default.decode(token);
        return payload ?? null;
    }
    catch {
        return null;
    }
}
function durationToSeconds(spec) {
    // supports e.g. "900s", "15m", "1h", "30d"
    const m = spec.match(/^(\d+)([smhd])$/);
    if (!m)
        return 0;
    const v = Number(m[1]);
    const u = m[2];
    if (u === 's')
        return v;
    if (u === 'm')
        return v * 60;
    if (u === 'h')
        return v * 60 * 60;
    if (u === 'd')
        return v * 24 * 60 * 60;
    return 0;
}
