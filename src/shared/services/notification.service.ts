import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { sendEmail } from '../email/mailer';

interface NotificationPayload {
  userId: string;
  type: string;
  payload?: any;
}

interface EmailNotification {
  to: string;
  subject: string;
  template?: string;
  data?: any;
}

export class NotificationService {
  async send(notification: NotificationPayload): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          userId: notification.userId,
          type: notification.type,
          payload: notification.payload
        }
      });

      const user = await prisma.user.findUnique({
        where: { id: notification.userId },
        select: {
          email: true,
          name: true,
          profile: { select: { preferences: true } }
        }
      });

      if (!user) return;

      const preferences = (user.profile?.preferences as any) || {};
      const emailEnabled = preferences.emailNotifications !== false;

      if (emailEnabled && user.email) {
        await this.sendEmailNotification(user.email, notification.type, {
          userName: user.name,
          ...notification.payload
        });
      }
    } catch (error) {
      logger.error({ error, notification }, 'Failed to send notification');
    }
  }

  private async sendEmailNotification(
    email: string,
    type: string,
    data: any
  ): Promise<void> {
    const emailTemplates: { [key: string]: EmailNotification } = {
      draft_preview_ready: {
        to: email,
        subject: 'Tasarımınız Hazır!',
        template: 'preview-ready',
        data
      },
      draft_revision_requested: {
        to: email,
        subject: 'Revizyon Talebi Alındı',
        template: 'revision-requested',
        data
      },
      draft_design_approved: {
        to: email,
        subject: 'Tasarım Onaylandı',
        template: 'design-approved',
        data
      },
      draft_draft_canceled: {
        to: email,
        subject: 'Taslak İptal Edildi',
        template: 'draft-canceled',
        data
      }
    };

    const emailConfig = emailTemplates[type];

    if (!emailConfig) {
      logger.warn({ type }, 'No email template configured for notification type');
      return;
    }

    try {
      const text = this.generateEmailText(type, data);
      await sendEmail({ to: emailConfig.to, subject: emailConfig.subject, text });
    } catch (error) {
      logger.error({ error, email, type }, 'Failed to send email notification');
    }
  }

  private generateEmailText(type: string, data: any): string {
    const templates: { [key: string]: (data: any) => string } = {
      draft_preview_ready: (d) => `
Merhaba ${d.userName || 'Müşteri'},

Tasarımınız hazır! Tasarımcı ${d.designerName || 'tasarımcı'} tarafından hazırlanan önizlemeyi inceleyebilirsiniz.

Taslak ID: ${d.draftId}

Tasarımı beğenmediyseniz, ${3 - (d.revisionCount || 0)} revizyon hakkınız bulunmaktadır.

İyi günler!
      `.trim(),
      draft_revision_requested: (d) => `
Merhaba ${d.designerName || 'Tasarımcı'},

Müşteri ${d.customerName || 'müşteri'} tarafından revizyon talebi gönderildi.

Taslak ID: ${d.draftId}
Revizyon Numarası: ${d.revisionNumber}
${d.notes ? `\nRevizyon Notları:\n${d.notes}` : ''}

Lütfen tasarımı güncellemeyi unutmayın.

İyi çalışmalar!
      `.trim(),
      draft_design_approved: (d) => `
Merhaba ${d.designerName || 'Tasarımcı'},

Tebrikler! Müşteri ${d.customerName || 'müşteri'} tasarımınızı onayladı.

Taslak ID: ${d.draftId}

İyi günler!
      `.trim(),
      draft_draft_canceled: (d) => `
Merhaba ${d.designerName || 'Tasarımcı'},

Müşteri ${d.customerName || 'müşteri'} tarafından taslak iptal edildi.

Taslak ID: ${d.draftId}
${d.reason ? `\nİptal Nedeni: ${d.reason}` : ''}

İyi günler!
      `.trim()
    };

    const template = templates[type];
    return template ? template(data) : 'Bir bildiriminiz var.';
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true }
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, read: false } });
  }

  async getUserNotifications(
    userId: string,
    options?: { page?: number; limit?: number; unreadOnly?: boolean }
  ) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (options?.unreadOnly) where.read = false;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.notification.count({ where })
    ]);

    return {
      data: notifications,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }
}


