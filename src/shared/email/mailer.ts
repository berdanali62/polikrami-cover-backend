import nodemailer from 'nodemailer';
import { env } from '../../config/env';
import { prisma } from '../../config/database';

export interface SendEmailParams {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  bypassRedirect?: boolean;
}

const transporter = nodemailer.createTransport({
  name: env.SMTP_NAME || undefined,
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  requireTLS: env.SMTP_REQUIRE_TLS,
  ignoreTLS: env.SMTP_IGNORE_TLS,
  connectionTimeout: env.SMTP_CONNECTION_TIMEOUT_MS,
  greetingTimeout: env.SMTP_GREETING_TIMEOUT_MS,
  socketTimeout: env.SMTP_SOCKET_TIMEOUT_MS,
  auth: env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  tls: Object.assign(
    {},
    env.SMTP_TLS_INSECURE ? { rejectUnauthorized: false } : {},
    env.SMTP_TLS_MIN_VERSION ? { minVersion: env.SMTP_TLS_MIN_VERSION } : {}
  ),
  logger: env.SMTP_LOGGER,
  debug: env.SMTP_DEBUG,
});

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const queued = await prisma.emailQueue.create({
    data: {
      to: params.to,
      subject: params.subject,
      template: undefined,
      payload: undefined,
      status: 'queued',
    },
  });
  const to = params.bypassRedirect ? params.to : (env.EMAIL_REDIRECT_TO || params.to);
  try {
    const info = await transporter.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject: params.subject,
      text: params.text,
      html: params.html,
      // Use SMTP_USER as envelope sender to satisfy some SMTP servers while displaying a different From header
      envelope: {
        from: env.SMTP_USER || env.EMAIL_FROM,
        to,
      },
    });
    await prisma.emailQueue.update({
      where: { id: queued.id },
      data: { status: 'sent', sentAt: new Date(), error: null },
    });
    if (process.env.NODE_ENV !== 'production') {
      console.log('[MAIL] sent', { to, subject: params.subject, messageId: info.messageId });
    }
  } catch (err: unknown) {
    try {
      await prisma.emailQueue.update({
        where: { id: queued.id },
        data: { status: 'failed', error: String((err as Error)?.message ?? err) },
      });
    } catch (dbError) {
      const { logger } = await import('../../utils/logger');
      logger.error({ error: dbError }, 'Failed to update email queue status');
    }
    const { logger } = await import('../../utils/logger');
    logger.error({ error: err, emailTo: params.to }, 'Email sending failed');
    throw err;
  }
}


