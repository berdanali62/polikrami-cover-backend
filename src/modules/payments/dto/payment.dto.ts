import { z } from 'zod';

export const initiatePaymentSchema = z.object({
  orderId: z.string().uuid({ message: 'Geçerli bir sipariş ID (UUID) giriniz.' }),
  paymentMethod: z.enum(['credit_card', 'bank_transfer', 'digital_wallet'], {
    message: 'Geçerli ödeme yöntemi seçiniz: credit_card, bank_transfer, digital_wallet'
  }),
  returnUrl: z.string().url({ message: 'Geçerli bir dönüş URL\'i giriniz.' }).optional(),
  cancelUrl: z.string().url({ message: 'Geçerli bir iptal URL\'i giriniz.' }).optional(),
});

export const creditCardPaymentSchema = z.object({
  orderId: z.string().uuid({ message: 'Geçerli bir sipariş ID (UUID) giriniz.' }),
  cardDetails: z.object({
    cardNumber: z.string().regex(/^\d{16}$/, { message: 'Kart numarası 16 haneli olmalıdır.' }),
    expiryMonth: z.string().regex(/^(0[1-9]|1[0-2])$/, { message: 'Geçerli ay giriniz (01-12).' }),
    expiryYear: z.string().regex(/^\d{2}$/, { message: 'Geçerli yıl giriniz (YY formatında).' }),
    cvv: z.string().regex(/^\d{3,4}$/, { message: 'CVV 3 veya 4 haneli olmalıdır.' }),
    cardHolderName: z.string().min(2, { message: 'Kart sahibi adı en az 2 karakter olmalıdır.' }),
  }),
  billingAddress: z.object({
    firstName: z.string().min(2, { message: 'Ad en az 2 karakter olmalıdır.' }),
    lastName: z.string().min(2, { message: 'Soyad en az 2 karakter olmalıdır.' }),
    address: z.string().min(5, { message: 'Adres en az 5 karakter olmalıdır.' }),
    city: z.string().min(2, { message: 'Şehir en az 2 karakter olmalıdır.' }),
    country: z.string().min(2, { message: 'Ülke kodu en az 2 karakter olmalıdır.' }),
    zipCode: z.string().min(5, { message: 'Posta kodu en az 5 karakter olmalıdır.' }),
    phone: z.string().min(10, { message: 'Telefon numarası en az 10 karakter olmalıdır.' }),
    email: z.string().email({ message: 'Geçerli bir e-posta adresi giriniz.' }),
  }),
  installments: z.number().int().min(1).max(12).default(1),
});

export const paymentCallbackSchema = z.object({
  orderId: z.string().uuid(),
  paymentId: z.string(),
  status: z.enum(['success', 'failed', 'cancelled']),
  transactionId: z.string().optional(),
  errorMessage: z.string().optional(),
  amount: z.number().positive().optional(),
  currency: z.string().length(3).default('TRY'),
});

export const refundPaymentSchema = z.object({
  paymentId: z.string().uuid({ message: 'Geçerli bir ödeme ID (UUID) giriniz.' }),
  amount: z.number().positive({ message: 'İade tutarı pozitif olmalıdır.' }).optional(),
  reason: z.string().min(5, { message: 'İade nedeni en az 5 karakter olmalıdır.' }),
});

export type InitiatePaymentDto = z.infer<typeof initiatePaymentSchema>;
export type CreditCardPaymentDto = z.infer<typeof creditCardPaymentSchema>;
export type PaymentCallbackDto = z.infer<typeof paymentCallbackSchema>;
export type RefundPaymentDto = z.infer<typeof refundPaymentSchema>;
