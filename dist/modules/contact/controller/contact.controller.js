"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactController = contactController;
exports.getSubmissionsController = getSubmissionsController;
exports.updateSubmissionController = updateSubmissionController;
const contact_dto_1 = require("../dto/contact.dto");
const contact_service_1 = require("../service/contact.service");
const contactService = new contact_service_1.ContactService();
/**
 * Submit contact form
 * POST /api/v1/contact
 */
async function contactController(req, res) {
    const data = contact_dto_1.contactSchema.parse(req.body);
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
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
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
    }
    catch (error) {
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
async function getSubmissionsController(req, res) {
    const status = req.query.status || 'all';
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
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
async function updateSubmissionController(req, res) {
    const { id } = req.params;
    const { status, notes } = (req.body ?? {});
    if (!id || !status)
        return res.status(400).json({ message: 'Geçersiz istek' });
    const updated = await contactService.updateStatus(id, status, notes);
    res.status(200).json(updated);
}
