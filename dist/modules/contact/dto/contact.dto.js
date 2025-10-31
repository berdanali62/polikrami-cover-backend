"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactSchema = void 0;
const zod_1 = require("zod");
/**
 * Contact form schema with enhanced validation
 */
exports.contactSchema = zod_1.z.object({
    name: zod_1.z.string()
        .min(2, { message: 'Ad soyad en az 2 karakter olmalıdır.' })
        .max(100, { message: 'Ad soyad çok uzun.' })
        .regex(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/, {
        message: 'Ad soyad sadece harf içermelidir.'
    })
        .transform(val => val.trim()),
    email: zod_1.z.string()
        .email({ message: 'Geçerli bir e-posta adresi giriniz.' })
        .max(100, { message: 'E-posta adresi çok uzun.' })
        .toLowerCase()
        .refine((email) => !isDisposableEmail(email), { message: 'Geçici e-posta adresleri kabul edilmemektedir.' }),
    phone: zod_1.z.string()
        .max(50, { message: 'Telefon numarası çok uzun.' })
        .regex(/^[\d\s\-\+\(\)]*$/, {
        message: 'Geçersiz telefon numarası formatı.'
    })
        .optional()
        .nullable()
        .transform(val => val?.trim() || null),
    message: zod_1.z.string()
        .min(10, { message: 'Mesaj en az 10 karakter olmalıdır.' })
        .max(5000, { message: 'Mesaj en fazla 5000 karakter olabilir.' })
        .transform(val => val.trim())
        .refine((msg) => !isSpamMessage(msg), { message: 'Mesajınız spam olarak algılandı. Lütfen tekrar deneyin.' }),
    website: zod_1.z.string()
        .max(0, { message: 'Bu alan boş bırakılmalıdır.' })
        .optional()
        .default(''),
    captchaToken: zod_1.z.string().optional()
});
/**
 * Check if email is from disposable/temporary email service
 */
function isDisposableEmail(email) {
    const disposableDomains = [
        'tempmail.com',
        'temp-mail.org',
        'guerrillamail.com',
        'mailinator.com',
        '10minutemail.com',
        'throwaway.email',
        'yopmail.com',
        'maildrop.cc'
        // Add more as needed
    ];
    const domain = email.split('@')[1]?.toLowerCase();
    return disposableDomains.some(d => domain?.includes(d));
}
/**
 * Basic spam detection (keyword-based)
 */
function isSpamMessage(message) {
    const spamKeywords = [
        'viagra',
        'cialis',
        'casino',
        'lottery',
        'winner',
        'bitcoin',
        'crypto',
        'loan',
        'investment',
        'click here',
        'act now'
    ];
    const lowerMessage = message.toLowerCase();
    // Check for spam keywords
    const hasSpamKeyword = spamKeywords.some(keyword => lowerMessage.includes(keyword));
    // Check for excessive URLs
    const urlCount = (message.match(/https?:\/\//gi) || []).length;
    if (urlCount > 3)
        return true;
    // Check for excessive caps
    const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length;
    if (capsRatio > 0.5 && message.length > 20)
        return true;
    return hasSpamKeyword;
}
