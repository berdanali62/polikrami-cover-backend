import { Request, Response } from 'express';
import { contactSchema } from '../dto/contact.dto';
import { ContactService } from '../service/contact.service';

const contactService = new ContactService();

/**
 * Submit contact form
 * POST /api/v1/contact
 */
export async function contactController(req: Request, res: Response) {
  const data = contactSchema.parse(req.body);

  // Check honeypot
  if (data.website) {
    // Bot detected (filled honeypot field)
    console.warn('[Contact] Bot detected (honeypot):', {
      ip: req.ip,
      email: data.email
    });
    
    // Return success to not tip off the bot
    return res.status(200).json({ success: true });
  }

  // Get IP and User-Agent for tracking
  const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
    || req.ip
    || undefined;
  
  const userAgent = req.headers['user-agent'] || undefined;

  try {
    await contactService.submitContact({
      name: data.name,
      email: data.email,
      phone: data.phone,
      message: data.message,
      ipAddress,
      userAgent
    });

    res.status(200).json({ 
      success: true,
      message: 'Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.'
    });

  } catch (error: any) {
    // If it's a known error (rate limit, validation), return it
    if (error.statusCode === 400) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    // For unknown errors, log but return success for privacy
    console.error('[Contact] Submission error:', error);
    
    res.status(200).json({
      success: true,
      message: 'Mesajınız alındı. İşlem sırasında bir sorun oluştu, ancak kaydınız alınmıştır.'
    });
  }
}

/**
 * Get contact submissions (admin only)
 * GET /api/v1/contact/submissions
 */
export async function getSubmissionsController(req: Request, res: Response) {
  const status = (req.query.status as string) || 'all';
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

  const result = await contactService.getSubmissions({
    status,
    page,
    limit
  });

  res.status(200).json(result);
}

/**
 * Update submission status (admin only)
 * PATCH /api/v1/contact/submissions/:id
 */
export async function updateSubmissionController(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const { status, notes } = (req.body ?? {}) as { status?: string; notes?: string };
  if (!id || !status) return res.status(400).json({ message: 'Geçersiz istek' });

  const updated = await contactService.updateStatus(id, status, notes);

  res.status(200).json(updated);
}