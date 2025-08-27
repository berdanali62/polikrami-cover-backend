import nodemailer from 'nodemailer';
import { env } from '../../config/env';
import { prisma } from '../../config/database';

export interface SendEmailParams {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  /**
   * If true, send to the exact 'to' address ignoring EMAIL_REDIRECT_TO.
   * Useful for user-facing confirmations in development.
   */
  bypassRedirect?: boolean;
}

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  tls: env.SMTP_TLS_INSECURE ? { rejectUnauthorized: false } : undefined,
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
    });
    await prisma.emailQueue.update({
      where: { id: queued.id },
      data: { status: 'sent', sentAt: new Date(), error: null },
    });
    if (process.env.NODE_ENV !== 'production') {
      console.log('[MAIL] sent', { to, subject: params.subject, messageId: info.messageId });
    }
  } catch (err: any) {
    try {
      await prisma.emailQueue.update({
        where: { id: queued.id },
        data: { status: 'failed', error: String(err?.message ?? err) },
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


