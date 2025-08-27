import { Request, Response } from 'express';
import { contactSchema } from '../dto/contact.dto';
import { env } from '../../../config/env';
import { sendEmail } from '../../../shared/email/mailer';

export async function contactController(req: Request, res: Response) {
  const { name, email, phone, message } = contactSchema.parse(req.body);
  const to = env.CONTACT_TO || env.EMAIL_FROM;
  
  try {
    // 1) Admin/biz bildirimi
    await sendEmail({
      to,
      subject: `Yeni İletişim Mesajı: ${name}`,
      text: `İsim: ${name}\nE-posta: ${email}\nTelefon: ${phone ?? '-'}\n\nMesaj:\n${message}`,
      html: `<p><strong>İsim:</strong> ${name}</p><p><strong>E-posta:</strong> ${email}</p><p><strong>Telefon:</strong> ${phone ?? '-'}</p><p><strong>Mesaj:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>`,
    });
    
    // 2) Gönderen kullanıcıya bilgilendirme/teyit e-postası
    await sendEmail({
      to: email,
      subject: 'Mesajınızı aldık',
      text: `Merhaba ${name},\n\nMesajınızı aldık ve en kısa sürede sizinle iletişime geçeceğiz.\n\nMesajınızın özeti:\n${message}\n\nİyi günler dileriz.`,
      html: `<p>Merhaba ${name},</p><p>Mesajınızı aldık ve en kısa sürede sizinle iletişime geçeceğiz.</p><p><strong>Mesaj özeti:</strong><br/>${message.replace(/\n/g, '<br/>')}</p><p>İyi günler dileriz.</p>`,
      bypassRedirect: true,
    });
    
    res.status(200).json({ ok: true });
  } catch (error) {
    const { logger } = await import('../../../utils/logger');
    logger.error({ error, contactData: { name, email } }, 'Contact form email sending failed');
    // Even if email fails, we should respond success to user for privacy
    res.status(200).json({ ok: true });
  }
}


