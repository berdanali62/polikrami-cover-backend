import { prisma } from '../../../config/database';
import { env } from '../../../config/env';
import { badRequest, notFound, internal } from '../../../shared/errors/ApiError';
import { logger } from '../../../utils/logger';
import crypto from 'crypto';

export interface PaymentProvider {
  name: string;
  initiatePayment(params: InitiatePaymentParams): Promise<PaymentResponse>;
  processCallback(params: CallbackParams): Promise<CallbackResponse>;
  refundPayment(params: RefundParams): Promise<RefundResponse>;
}

export interface InitiatePaymentParams {
  orderId: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  returnUrl?: string;
  cancelUrl?: string;
  paymentMethod: string;
  cardDetails?: any;
  billingAddress?: any;
  installments?: number;
}

export interface PaymentResponse {
  paymentId: string;
  redirectUrl?: string;
  status: 'pending' | 'success' | 'failed';
  providerResponse: any;
}

export interface CallbackParams {
  orderId: string;
  paymentId: string;
  providerData: any;
}

export interface CallbackResponse {
  status: 'success' | 'failed' | 'cancelled';
  transactionId?: string;
  errorMessage?: string;
}

export interface RefundParams {
  paymentId: string;
  amount?: number;
  reason: string;
}

export interface RefundResponse {
  refundId: string;
  status: 'success' | 'failed';
  errorMessage?: string;
}

// Mock Payment Provider (Test için)
class MockPaymentProvider implements PaymentProvider {
  name = 'mock';

  async initiatePayment(params: InitiatePaymentParams): Promise<PaymentResponse> {
    // Test ortamında mock ödeme
    const paymentId = crypto.randomUUID();
    
    // %80 başarı oranı ile mock
    const isSuccess = Math.random() > 0.2;
    
    if (isSuccess) {
      return {
        paymentId,
        redirectUrl: `${env.APP_URL}/payment/success?paymentId=${paymentId}&orderId=${params.orderId}`,
        status: 'pending',
        providerResponse: { mockProvider: true, amount: params.amount }
      };
    } else {
      return {
        paymentId,
        status: 'failed',
        providerResponse: { mockProvider: true, error: 'Mock payment failed' }
      };
    }
  }

  async processCallback(params: CallbackParams): Promise<CallbackResponse> {
    // Mock callback processing
    const isSuccess = Math.random() > 0.1; // %90 başarı oranı
    
    if (isSuccess) {
      return {
        status: 'success',
        transactionId: `mock_txn_${Date.now()}`
      };
    } else {
      return {
        status: 'failed',
        errorMessage: 'Mock payment processing failed'
      };
    }
  }

  async refundPayment(params: RefundParams): Promise<RefundResponse> {
    return {
      refundId: crypto.randomUUID(),
      status: 'success'
    };
  }
}

// Iyzico Payment Provider (Gerçek entegrasyon)
class IyzicoPaymentProvider implements PaymentProvider {
  name = 'iyzico';
  private Iyzipay: any;

  constructor() {
    // Dynamically import iyzipay to avoid issues if not installed
    try {
      this.Iyzipay = require('iyzipay');
    } catch (error) {
      logger.warn('Iyzipay package not found. Install with: npm install iyzipay');
    }
  }

  private getIyzicoClient() {
    if (!this.Iyzipay) {
      throw new Error('Iyzipay package not installed');
    }

    if (!env.IYZICO_API_KEY || !env.IYZICO_SECRET_KEY) {
      throw new Error('Iyzico credentials not configured');
    }

    return new this.Iyzipay({
      apiKey: env.IYZICO_API_KEY,
      secretKey: env.IYZICO_SECRET_KEY,
      uri: env.IYZICO_BASE_URL
    });
  }

  async initiatePayment(params: InitiatePaymentParams): Promise<PaymentResponse> {
    const iyzipay = this.getIyzicoClient();

    try {
      // Iyzico için gerekli request formatı
      const request = {
        locale: 'tr',
        conversationId: params.orderId,
        price: params.amount.toString(),
        paidPrice: params.amount.toString(),
        currency: params.currency,
        installment: params.installments || 1,
        basketId: params.orderId,
        paymentChannel: 'WEB',
        paymentGroup: 'PRODUCT',
        callbackUrl: `${env.APP_URL}/api/payments/callback`,
        enabledInstallments: [1, 2, 3, 6, 9, 12],
        buyer: {
          id: crypto.randomUUID(),
          name: params.customerName.split(' ')[0] || 'Ad',
          surname: params.customerName.split(' ')[1] || 'Soyad',
          gsmNumber: params.billingAddress?.phone || '+905555555555',
          email: params.customerEmail,
          identityNumber: '11111111111', // Test için
          lastLoginDate: new Date().toISOString().split('T')[0] + ' 12:00:00',
          registrationDate: new Date().toISOString().split('T')[0] + ' 12:00:00',
          registrationAddress: params.billingAddress?.address || 'Test Address',
          ip: '85.34.78.112', // Test IP
          city: params.billingAddress?.city || 'Istanbul',
          country: params.billingAddress?.country || 'Turkey',
          zipCode: params.billingAddress?.zipCode || '34732'
        },
        shippingAddress: {
          contactName: params.customerName,
          city: params.billingAddress?.city || 'Istanbul',
          country: params.billingAddress?.country || 'Turkey',
          address: params.billingAddress?.address || 'Test Address',
          zipCode: params.billingAddress?.zipCode || '34732'
        },
        billingAddress: {
          contactName: params.customerName,
          city: params.billingAddress?.city || 'Istanbul',
          country: params.billingAddress?.country || 'Turkey',
          address: params.billingAddress?.address || 'Test Address',
          zipCode: params.billingAddress?.zipCode || '34732'
        },
        basketItems: [
          {
            id: 'BI101',
            name: 'Kitap Kapağı Tasarımı',
            category1: 'Design',
            category2: 'Book Cover',
            itemType: 'VIRTUAL',
            price: params.amount.toString()
          }
        ]
      };

      // Kredi kartı bilgileri varsa direkt ödeme
      if (params.cardDetails) {
        const paymentRequest = {
          ...request,
          paymentCard: {
            cardHolderName: params.cardDetails.cardHolderName,
            cardNumber: params.cardDetails.cardNumber,
            expireMonth: params.cardDetails.expiryMonth,
            expireYear: params.cardDetails.expiryYear,
            cvc: params.cardDetails.cvv,
            registerCard: '0'
          }
        };

        return new Promise((resolve, reject) => {
          iyzipay.payment.create(paymentRequest, (err: any, result: any) => {
            if (err) {
              logger.error({ error: err }, 'Iyzico payment creation failed');
              reject(new Error('Payment creation failed'));
              return;
            }

            if (result.status === 'success') {
              resolve({
                paymentId: result.paymentId,
                status: 'success',
                providerResponse: result
              });
            } else {
              resolve({
                paymentId: result.paymentId || crypto.randomUUID(),
                status: 'failed',
                providerResponse: result
              });
            }
          });
        });
      } else {
        // 3D Secure ile ödeme formu
        return new Promise((resolve, reject) => {
          iyzipay.checkoutFormInitialize.create(request, (err: any, result: any) => {
            if (err) {
              logger.error({ error: err }, 'Iyzico checkout form creation failed');
              reject(new Error('Checkout form creation failed'));
              return;
            }

            if (result.status === 'success') {
              resolve({
                paymentId: result.token,
                redirectUrl: result.checkoutFormContent, // HTML form
                status: 'pending',
                providerResponse: result
              });
            } else {
              resolve({
                paymentId: crypto.randomUUID(),
                status: 'failed',
                providerResponse: result
              });
            }
          });
        });
      }
    } catch (error) {
      logger.error({ error, params }, 'Iyzico payment initiation failed');
      throw error;
    }
  }

  async processCallback(params: CallbackParams): Promise<CallbackResponse> {
    const iyzipay = this.getIyzicoClient();

    try {
      const request = {
        locale: 'tr',
        conversationId: params.orderId,
        token: params.paymentId
      };

      return new Promise((resolve, reject) => {
        iyzipay.checkoutForm.retrieve(request, (err: any, result: any) => {
          if (err) {
            logger.error({ error: err }, 'Iyzico callback processing failed');
            reject(new Error('Callback processing failed'));
            return;
          }

          if (result.status === 'success' && result.paymentStatus === 'SUCCESS') {
            resolve({
              status: 'success',
              transactionId: result.paymentId
            });
          } else {
            resolve({
              status: 'failed',
              errorMessage: result.errorMessage || 'Payment failed'
            });
          }
        });
      });
    } catch (error) {
      logger.error({ error, params }, 'Iyzico callback processing failed');
      throw error;
    }
  }

  async refundPayment(params: RefundParams): Promise<RefundResponse> {
    const iyzipay = this.getIyzicoClient();

    try {
      const request = {
        locale: 'tr',
        conversationId: crypto.randomUUID(),
        paymentTransactionId: params.paymentId,
        price: params.amount?.toString() || '1.0',
        currency: 'TRY',
        ip: '85.34.78.112'
      };

      return new Promise((resolve, reject) => {
        iyzipay.refund.create(request, (err: any, result: any) => {
          if (err) {
            logger.error({ error: err }, 'Iyzico refund failed');
            reject(new Error('Refund failed'));
            return;
          }

          if (result.status === 'success') {
            resolve({
              refundId: result.paymentId,
              status: 'success'
            });
          } else {
            resolve({
              refundId: crypto.randomUUID(),
              status: 'failed',
              errorMessage: result.errorMessage || 'Refund failed'
            });
          }
        });
      });
    } catch (error) {
      logger.error({ error, params }, 'Iyzico refund failed');
      throw error;
    }
  }
}

export class PaymentService {
  private providers: Map<string, PaymentProvider> = new Map();

  constructor() {
    // Register payment providers
    this.providers.set('mock', new MockPaymentProvider());
    this.providers.set('iyzico', new IyzicoPaymentProvider());
  }

  private getProvider(name: string = 'mock'): PaymentProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw badRequest(`Payment provider '${name}' not found`);
    }
    return provider;
  }

  async initiatePayment(params: {
    orderId: string;
    paymentMethod: string;
    returnUrl?: string;
    cancelUrl?: string;
    cardDetails?: any;
    billingAddress?: any;
    installments?: number;
  }) {
    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: params.orderId },
      include: { user: true }
    });

    if (!order) {
      throw notFound('Order not found');
    }

    if (order.status !== 'pending') {
      throw badRequest('Order is not in pending status');
    }

    // Select payment provider based on configuration
    const providerName = env.PAYMENT_PROVIDER;
    const provider = this.getProvider(providerName);

    try {
      // Initiate payment with provider
      const paymentResponse = await provider.initiatePayment({
        orderId: params.orderId,
        amount: order.totalCents / 100, // Convert cents to TRY
        currency: order.currency,
        customerEmail: order.user.email,
        customerName: order.user.name || 'Customer',
        returnUrl: params.returnUrl,
        cancelUrl: params.cancelUrl,
        paymentMethod: params.paymentMethod,
        cardDetails: params.cardDetails,
        billingAddress: params.billingAddress,
        installments: params.installments
      });

      // Save payment record
      const payment = await prisma.payment.create({
        data: {
          orderId: params.orderId,
          provider: providerName,
          providerPaymentId: paymentResponse.paymentId,
          status: paymentResponse.status,
          amountCents: order.totalCents
        }
      });

      logger.info({
        orderId: params.orderId,
        paymentId: payment.id,
        provider: providerName,
        amount: order.totalCents
      }, 'Payment initiated');

      return {
        paymentId: payment.id,
        redirectUrl: paymentResponse.redirectUrl,
        status: paymentResponse.status
      };

    } catch (error) {
      logger.error({
        error,
        orderId: params.orderId,
        provider: providerName
      }, 'Payment initiation failed');
      
      throw internal('Payment initiation failed');
    }
  }

  async processCallback(params: {
    orderId: string;
    paymentId: string;
    providerData: any;
  }) {
    // Get payment record
    const payment = await prisma.payment.findFirst({
      where: {
        orderId: params.orderId,
        providerPaymentId: params.paymentId
      },
      include: { order: true }
    });

    if (!payment) {
      throw notFound('Payment not found');
    }

    const provider = this.getProvider(payment.provider);

    try {
      // Process callback with provider
      const callbackResponse = await provider.processCallback({
        orderId: params.orderId,
        paymentId: params.paymentId,
        providerData: params.providerData
      });

      // Update payment status
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: callbackResponse.status,
            receiptUrl: callbackResponse.transactionId ? 
              `${env.APP_URL}/receipts/${callbackResponse.transactionId}` : null
          }
        });

        // Update order status if payment successful
        if (callbackResponse.status === 'success') {
          await tx.order.update({
            where: { id: params.orderId },
            data: { status: 'paid' }
          });
        } else if (callbackResponse.status === 'failed') {
          await tx.order.update({
            where: { id: params.orderId },
            data: { status: 'failed' }
          });
        }
      });

      logger.info({
        orderId: params.orderId,
        paymentId: payment.id,
        status: callbackResponse.status
      }, 'Payment callback processed');

      return callbackResponse;

    } catch (error) {
      logger.error({
        error,
        orderId: params.orderId,
        paymentId: payment.id
      }, 'Payment callback processing failed');
      
      throw internal('Payment callback processing failed');
    }
  }

  async refundPayment(params: {
    paymentId: string;
    amount?: number;
    reason: string;
    userId: string;
  }) {
    // Get payment record
    const payment = await prisma.payment.findUnique({
      where: { id: params.paymentId },
      include: { order: { include: { user: true } } }
    });

    if (!payment) {
      throw notFound('Payment not found');
    }

    // Check if user owns this payment
    if (payment.order.user.id !== params.userId) {
      throw badRequest('Not authorized to refund this payment');
    }

    if (payment.status !== 'success') {
      throw badRequest('Payment is not in success status');
    }

    const provider = this.getProvider(payment.provider);
    const refundAmount = params.amount || payment.amountCents;

    try {
      // Process refund with provider
      const refundResponse = await provider.refundPayment({
        paymentId: payment.providerPaymentId || payment.id,
        amount: refundAmount / 100, // Convert cents to TRY
        reason: params.reason
      });

      // Update payment and order status
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: 'refunded' }
        });

        await tx.order.update({
          where: { id: payment.orderId },
          data: { status: 'refunded' }
        });
      });

      logger.info({
        paymentId: params.paymentId,
        refundId: refundResponse.refundId,
        amount: refundAmount,
        reason: params.reason
      }, 'Payment refunded');

      return {
        refundId: refundResponse.refundId,
        status: refundResponse.status,
        amount: refundAmount
      };

    } catch (error) {
      logger.error({
        error,
        paymentId: params.paymentId
      }, 'Payment refund failed');
      
      throw internal('Payment refund failed');
    }
  }

  async getPaymentStatus(paymentId: string, userId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: { include: { user: true } } }
    });

    if (!payment) {
      throw notFound('Payment not found');
    }

    // Check if user owns this payment
    if (payment.order.user.id !== userId) {
      throw badRequest('Not authorized to view this payment');
    }

    return {
      id: payment.id,
      orderId: payment.orderId,
      status: payment.status,
      amount: payment.amountCents,
      provider: payment.provider,
      createdAt: payment.createdAt,
      receiptUrl: payment.receiptUrl
    };
  }
}
