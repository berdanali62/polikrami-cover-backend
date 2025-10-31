"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refundPaymentSchema = exports.paymentCallbackSchema = exports.creditCardPaymentSchema = exports.initiatePaymentSchema = void 0;
const zod_1 = require("zod");
exports.initiatePaymentSchema = zod_1.z.object({
    orderId: zod_1.z.string().uuid({ message: 'Geçerli bir sipariş ID (UUID) giriniz.' }),
    paymentMethod: zod_1.z.enum(['credit_card', 'bank_transfer', 'digital_wallet'], {
        message: 'Geçerli ödeme yöntemi seçiniz: credit_card, bank_transfer, digital_wallet'
    }),
    returnUrl: zod_1.z.string().url({ message: 'Geçerli bir dönüş URL\'i giriniz.' }).optional(),
    cancelUrl: zod_1.z.string().url({ message: 'Geçerli bir iptal URL\'i giriniz.' }).optional(),
});
exports.creditCardPaymentSchema = zod_1.z.object({
    orderId: zod_1.z.string().uuid({ message: 'Geçerli bir sipariş ID (UUID) giriniz.' }),
    cardDetails: zod_1.z.object({
        cardNumber: zod_1.z.string().regex(/^\d{16}$/, { message: 'Kart numarası 16 haneli olmalıdır.' }),
        expiryMonth: zod_1.z.string().regex(/^(0[1-9]|1[0-2])$/, { message: 'Geçerli ay giriniz (01-12).' }),
        expiryYear: zod_1.z.string().regex(/^\d{2}$/, { message: 'Geçerli yıl giriniz (YY formatında).' }),
        cvv: zod_1.z.string().regex(/^\d{3,4}$/, { message: 'CVV 3 veya 4 haneli olmalıdır.' }),
        cardHolderName: zod_1.z.string().min(2, { message: 'Kart sahibi adı en az 2 karakter olmalıdır.' }),
    }),
    billingAddress: zod_1.z.object({
        firstName: zod_1.z.string().min(2, { message: 'Ad en az 2 karakter olmalıdır.' }),
        lastName: zod_1.z.string().min(2, { message: 'Soyad en az 2 karakter olmalıdır.' }),
        address: zod_1.z.string().min(5, { message: 'Adres en az 5 karakter olmalıdır.' }),
        city: zod_1.z.string().min(2, { message: 'Şehir en az 2 karakter olmalıdır.' }),
        country: zod_1.z.string().min(2, { message: 'Ülke kodu en az 2 karakter olmalıdır.' }),
        zipCode: zod_1.z.string().min(5, { message: 'Posta kodu en az 5 karakter olmalıdır.' }),
        phone: zod_1.z.string().min(10, { message: 'Telefon numarası en az 10 karakter olmalıdır.' }),
        email: zod_1.z.string().email({ message: 'Geçerli bir e-posta adresi giriniz.' }),
    }),
    installments: zod_1.z.number().int().min(1).max(12).default(1),
});
exports.paymentCallbackSchema = zod_1.z.object({
    orderId: zod_1.z.string().uuid(),
    paymentId: zod_1.z.string(),
    status: zod_1.z.enum(['success', 'failed', 'cancelled']),
    transactionId: zod_1.z.string().optional(),
    errorMessage: zod_1.z.string().optional(),
    amount: zod_1.z.number().positive().optional(),
    currency: zod_1.z.string().length(3).default('TRY'),
});
exports.refundPaymentSchema = zod_1.z.object({
    paymentId: zod_1.z.string().uuid({ message: 'Geçerli bir ödeme ID (UUID) giriniz.' }),
    amount: zod_1.z.number().positive({ message: 'İade tutarı pozitif olmalıdır.' }).optional(),
    reason: zod_1.z.string().min(5, { message: 'İade nedeni en az 5 karakter olmalıdır.' }),
});
