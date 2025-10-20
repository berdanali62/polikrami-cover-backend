import { env } from '../../config/env';
import { logger } from '../../utils/logger';

export async function sendSms(params: { to: string; body: string }): Promise<void> {
  const provider = env.SMS_PROVIDER;
  if (provider === 'twilio' && env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const twilio = require('twilio');
      const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
      await client.messages.create({ to: params.to, from: env.TWILIO_FROM, body: params.body });
      return;
    } catch (error) {
      logger.error({ error }, 'Failed to send SMS via Twilio');
    }
  }
  // Mock fallback
  logger.info({ to: params.to, body: params.body }, '[SMS][mock]');
}


