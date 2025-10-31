"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSms = sendSms;
const env_1 = require("../../config/env");
const logger_1 = require("../../utils/logger");
async function sendSms(params) {
    const provider = env_1.env.SMS_PROVIDER;
    if (provider === 'twilio' && env_1.env.TWILIO_ACCOUNT_SID && env_1.env.TWILIO_AUTH_TOKEN && env_1.env.TWILIO_FROM) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const twilio = require('twilio');
            const client = twilio(env_1.env.TWILIO_ACCOUNT_SID, env_1.env.TWILIO_AUTH_TOKEN);
            await client.messages.create({ to: params.to, from: env_1.env.TWILIO_FROM, body: params.body });
            return;
        }
        catch (error) {
            logger_1.logger.error({ error }, 'Failed to send SMS via Twilio');
        }
    }
    // Mock fallback
    logger_1.logger.info({ to: params.to, body: params.body }, '[SMS][mock]');
}
