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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../../config/env");
const database_1 = require("../../config/database");
const transporter = nodemailer_1.default.createTransport({
    name: env_1.env.SMTP_NAME || undefined,
    host: env_1.env.SMTP_HOST,
    port: env_1.env.SMTP_PORT,
    secure: env_1.env.SMTP_SECURE,
    requireTLS: env_1.env.SMTP_REQUIRE_TLS,
    ignoreTLS: env_1.env.SMTP_IGNORE_TLS,
    connectionTimeout: env_1.env.SMTP_CONNECTION_TIMEOUT_MS,
    greetingTimeout: env_1.env.SMTP_GREETING_TIMEOUT_MS,
    socketTimeout: env_1.env.SMTP_SOCKET_TIMEOUT_MS,
    auth: env_1.env.SMTP_USER && env_1.env.SMTP_PASS ? { user: env_1.env.SMTP_USER, pass: env_1.env.SMTP_PASS } : undefined,
    tls: Object.assign({}, env_1.env.SMTP_TLS_INSECURE ? { rejectUnauthorized: false } : {}, env_1.env.SMTP_TLS_MIN_VERSION ? { minVersion: env_1.env.SMTP_TLS_MIN_VERSION } : {}),
    logger: env_1.env.SMTP_LOGGER,
    debug: env_1.env.SMTP_DEBUG,
});
async function sendEmail(params) {
    const queued = await database_1.prisma.emailQueue.create({
        data: {
            to: params.to,
            subject: params.subject,
            template: undefined,
            payload: undefined,
            status: 'queued',
        },
    });
    const to = params.bypassRedirect ? params.to : (env_1.env.EMAIL_REDIRECT_TO || params.to);
    try {
        const info = await transporter.sendMail({
            from: env_1.env.EMAIL_FROM,
            to,
            subject: params.subject,
            text: params.text,
            html: params.html,
            // Use SMTP_USER as envelope sender to satisfy some SMTP servers while displaying a different From header
            envelope: {
                from: env_1.env.SMTP_USER || env_1.env.EMAIL_FROM,
                to,
            },
        });
        await database_1.prisma.emailQueue.update({
            where: { id: queued.id },
            data: { status: 'sent', sentAt: new Date(), error: null },
        });
        if (process.env.NODE_ENV !== 'production') {
            console.log('[MAIL] sent', { to, subject: params.subject, messageId: info.messageId });
        }
    }
    catch (err) {
        try {
            await database_1.prisma.emailQueue.update({
                where: { id: queued.id },
                data: { status: 'failed', error: String(err?.message ?? err) },
            });
        }
        catch (dbError) {
            const { logger } = await Promise.resolve().then(() => __importStar(require('../../utils/logger')));
            logger.error({ error: dbError }, 'Failed to update email queue status');
        }
        const { logger } = await Promise.resolve().then(() => __importStar(require('../../utils/logger')));
        logger.error({ error: err, emailTo: params.to }, 'Email sending failed');
        throw err;
    }
}
