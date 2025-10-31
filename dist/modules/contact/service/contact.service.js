"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactService = void 0;
const database_1 = require("../../../config/database");
const mailer_1 = require("../../../shared/email/mailer");
const env_1 = require("../../../config/env");
const ApiError_1 = require("../../../shared/errors/ApiError");
class ContactService {
    /**
     * Process contact form submission
     */
    async submitContact(data) {
        // Check for recent submissions from same email (anti-spam)
        const recentSubmission = await this.checkRecentSubmission(data.email);
        if (recentSubmission) {
            throw (0, ApiError_1.badRequest)('Son 10 dakika içinde zaten bir mesaj gönderdiniz. Lütfen bekleyin.');
        }
        // Save to database first (backup even if email fails)
        const submission = await database_1.prisma.contactSubmission.create({
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone,
                message: data.message,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                status: 'pending'
            }
        });
        // Send emails (async, don't block response)
        void this.sendNotificationEmails(submission).catch(err => {
            console.error('[Contact] Email sending failed:', err);
            // Mark as failed in DB
            void database_1.prisma.contactSubmission.update({
                where: { id: submission.id },
                data: { emailSent: false, notes: `Email failed: ${err.message}` }
            });
        });
        return { success: true };
    }
    /**
     * Check if user has submitted recently (rate limiting)
     */
    async checkRecentSubmission(email) {
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        const recent = await database_1.prisma.contactSubmission.findFirst({
            where: {
                email,
                createdAt: { gte: tenMinutesAgo }
            }
        });
        return !!recent;
    }
    /**
     * Send notification emails
     */
    async sendNotificationEmails(submission) {
        const to = env_1.env.CONTACT_TO || env_1.env.EMAIL_FROM;
        try {
            // 1. Notify admin
            await (0, mailer_1.sendEmail)({
                to,
                subject: `🔔 Yeni İletişim Mesajı: ${submission.name}`,
                html: this.getAdminEmailTemplate(submission),
                text: this.getAdminEmailText(submission)
            });
            // 2. Send confirmation to user
            await (0, mailer_1.sendEmail)({
                to: submission.email,
                subject: '✅ Mesajınızı Aldık - Polikrami',
                html: this.getUserEmailTemplate(submission),
                text: this.getUserEmailText(submission),
                bypassRedirect: true
            });
            // Mark as sent
            await database_1.prisma.contactSubmission.update({
                where: { id: submission.id },
                data: { emailSent: true }
            });
        }
        catch (error) {
            console.error('[Contact] Email notification failed:', error);
            throw error;
        }
    }
    /**
     * Admin email template
     */
    getAdminEmailTemplate(submission) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #FF6B00; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
          .field { margin-bottom: 15px; }
          .field strong { display: inline-block; width: 120px; color: #666; }
          .message-box { background: white; padding: 15px; border-left: 4px solid #FF6B00; margin-top: 10px; }
          .footer { text-align: center; padding: 15px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🔔 Yeni İletişim Mesajı</h2>
          </div>
          <div class="content">
            <div class="field">
              <strong>İsim:</strong> ${this.escapeHtml(submission.name)}
            </div>
            <div class="field">
              <strong>E-posta:</strong> 
              <a href="mailto:${submission.email}">${submission.email}</a>
            </div>
            <div class="field">
              <strong>Telefon:</strong> ${submission.phone || '-'}
            </div>
            <div class="field">
              <strong>Mesaj:</strong>
              <div class="message-box">
                ${this.escapeHtml(submission.message).replace(/\n/g, '<br/>')}
              </div>
            </div>
            <div class="field">
              <strong>Referans ID:</strong> ${submission.id}
            </div>
          </div>
          <div class="footer">
            Polikrami İletişim Formu
          </div>
        </div>
      </body>
      </html>
    `;
    }
    /**
     * Admin email text version
     */
    getAdminEmailText(submission) {
        return `
Yeni İletişim Mesajı

İsim: ${submission.name}
E-posta: ${submission.email}
Telefon: ${submission.phone || '-'}

Mesaj:
${submission.message}

Referans ID: ${submission.id}
    `.trim();
    }
    /**
     * User confirmation email template
     */
    getUserEmailTemplate(submission) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #FF6B00; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
          .icon { font-size: 48px; margin-bottom: 10px; }
          .message-preview { background: white; padding: 15px; border-left: 4px solid #FF6B00; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 30px; background: #FF6B00; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon">✅</div>
            <h2>Mesajınızı Aldık!</h2>
          </div>
          <div class="content">
            <p>Merhaba <strong>${this.escapeHtml(submission.name)}</strong>,</p>
            <p>
              Mesajınız tarafımıza ulaştı. Ekibimiz en kısa sürede sizinle iletişime geçecektir.
              Genellikle <strong>24 saat içinde</strong> geri dönüş yapıyoruz.
            </p>
            <div class="message-preview">
              <strong>Mesajınızın özeti:</strong><br/>
              ${this.escapeHtml(submission.message.substring(0, 150))}${submission.message.length > 150 ? '...' : ''}
            </div>
            <p style="margin-top: 20px;">
              Sorularınız veya acil bir durumunuz varsa, 
              <a href="mailto:${env_1.env.CONTACT_TO || env_1.env.EMAIL_FROM}">${env_1.env.CONTACT_TO || env_1.env.EMAIL_FROM}</a> 
              adresinden bize ulaşabilirsiniz.
            </p>
            <div style="text-align: center;">
              <a href="${env_1.env.APP_URL}" class="button">Siteye Dön</a>
            </div>
          </div>
          <div class="footer">
            <p>
              Bu e-posta, Polikrami iletişim formu üzerinden gönderdiğiniz mesaja yanıt olarak otomatik oluşturulmuştur.
            </p>
            <p>
              © 2024 Polikrami. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
    }
    /**
     * User confirmation text version
     */
    getUserEmailText(submission) {
        return `
Merhaba ${submission.name},

Mesajınız tarafımıza ulaştı ve en kısa sürede sizinle iletişime geçeceğiz.

Mesajınızın özeti:
${submission.message.substring(0, 150)}${submission.message.length > 150 ? '...' : ''}

İyi günler dileriz,
Polikrami Ekibi
    `.trim();
    }
    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return (text ?? '').replace(/[&<>"']/g, (m) => map[m] ?? m);
    }
    /**
     * Get all contact submissions (admin only)
     */
    async getSubmissions(params) {
        const { status, page, limit } = params;
        const skip = (page - 1) * limit;
        const where = status && status !== 'all'
            ? { status: status }
            : {};
        const [submissions, total] = await Promise.all([
            database_1.prisma.contactSubmission.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            database_1.prisma.contactSubmission.count({ where })
        ]);
        return {
            submissions,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    /**
     * Update submission status (admin only)
     */
    async updateStatus(id, status, notes) {
        return database_1.prisma.contactSubmission.update({
            where: { id },
            data: {
                status: status,
                notes: notes || undefined
            }
        });
    }
}
exports.ContactService = ContactService;
