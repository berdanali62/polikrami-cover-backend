"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const database_1 = require("../../../config/database");
const env_1 = require("../../../config/env");
const ApiError_1 = require("../../../shared/errors/ApiError");
const logger_1 = require("../../../utils/logger");
const crypto_1 = __importDefault(require("crypto"));
// Mock Payment Provider (Test için)
class MockPaymentProvider {
    name = 'mock';
    async initiatePayment(params) {
        // Test ortamında mock ödeme
        const paymentId = crypto_1.default.randomUUID();
        // %80 başarı oranı ile mock
        const isSuccess = Math.random() > 0.2;
        if (isSuccess) {
            return {
                paymentId,
                redirectUrl: `${env_1.env.APP_URL}/payment/success?paymentId=${paymentId}&orderId=${params.orderId}`,
                status: 'pending',
                providerResponse: { mockProvider: true, amount: params.amount }
            };
        }
        else {
            return {
                paymentId,
                status: 'failed',
                providerResponse: { mockProvider: true, error: 'Mock payment failed' }
            };
        }
    }
    async processCallback(params) {
        // Mock callback processing
        const isSuccess = Math.random() > 0.1; // %90 başarı oranı
        if (isSuccess) {
            return {
                status: 'success',
                transactionId: `mock_txn_${Date.now()}`
            };
        }
        else {
            return {
                status: 'failed',
                errorMessage: 'Mock payment processing failed'
            };
        }
    }
    async refundPayment(params) {
        return {
            refundId: crypto_1.default.randomUUID(),
            status: 'success'
        };
    }
}
// Iyzico Payment Provider (Gerçek entegrasyon)
class IyzicoPaymentProvider {
    name = 'iyzico';
    Iyzipay;
    constructor() {
        // Dynamically import iyzipay to avoid issues if not installed
        try {
            this.Iyzipay = require('iyzipay');
        }
        catch (error) {
            logger_1.logger.warn('Iyzipay package not found. Install with: npm install iyzipay');
        }
    }
    getIyzicoClient() {
        if (!this.Iyzipay) {
            throw new Error('Iyzipay package not installed');
        }
        if (!env_1.env.IYZICO_API_KEY || !env_1.env.IYZICO_SECRET_KEY) {
            throw new Error('Iyzico credentials not configured');
        }
        return new this.Iyzipay({
            apiKey: env_1.env.IYZICO_API_KEY,
            secretKey: env_1.env.IYZICO_SECRET_KEY,
            uri: env_1.env.IYZICO_BASE_URL
        });
    }
    async initiatePayment(params) {
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
                callbackUrl: `${env_1.env.APP_URL}/api/payments/callback`,
                enabledInstallments: [1, 2, 3, 6, 9, 12],
                buyer: {
                    id: crypto_1.default.randomUUID(),
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
                    iyzipay.payment.create(paymentRequest, (err, result) => {
                        if (err) {
                            logger_1.logger.error({ error: err }, 'Iyzico payment creation failed');
                            reject(new Error('Payment creation failed'));
                            return;
                        }
                        if (result.status === 'success') {
                            resolve({
                                paymentId: result.paymentId,
                                status: 'success',
                                providerResponse: result
                            });
                        }
                        else {
                            resolve({
                                paymentId: result.paymentId || crypto_1.default.randomUUID(),
                                status: 'failed',
                                providerResponse: result
                            });
                        }
                    });
                });
            }
            else {
                // 3D Secure ile ödeme formu
                return new Promise((resolve, reject) => {
                    iyzipay.checkoutFormInitialize.create(request, (err, result) => {
                        if (err) {
                            logger_1.logger.error({ error: err }, 'Iyzico checkout form creation failed');
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
                        }
                        else {
                            resolve({
                                paymentId: crypto_1.default.randomUUID(),
                                status: 'failed',
                                providerResponse: result
                            });
                        }
                    });
                });
            }
        }
        catch (error) {
            logger_1.logger.error({ error, params }, 'Iyzico payment initiation failed');
            throw error;
        }
    }
    async processCallback(params) {
        const iyzipay = this.getIyzicoClient();
        try {
            const request = {
                locale: 'tr',
                conversationId: params.orderId,
                token: params.paymentId
            };
            return new Promise((resolve, reject) => {
                iyzipay.checkoutForm.retrieve(request, (err, result) => {
                    if (err) {
                        logger_1.logger.error({ error: err }, 'Iyzico callback processing failed');
                        reject(new Error('Callback processing failed'));
                        return;
                    }
                    if (result.status === 'success' && result.paymentStatus === 'SUCCESS') {
                        resolve({
                            status: 'success',
                            transactionId: result.paymentId
                        });
                    }
                    else {
                        resolve({
                            status: 'failed',
                            errorMessage: result.errorMessage || 'Payment failed'
                        });
                    }
                });
            });
        }
        catch (error) {
            logger_1.logger.error({ error, params }, 'Iyzico callback processing failed');
            throw error;
        }
    }
    async refundPayment(params) {
        const iyzipay = this.getIyzicoClient();
        try {
            const request = {
                locale: 'tr',
                conversationId: crypto_1.default.randomUUID(),
                paymentTransactionId: params.paymentId,
                price: params.amount?.toString() || '1.0',
                currency: 'TRY',
                ip: '85.34.78.112'
            };
            return new Promise((resolve, reject) => {
                iyzipay.refund.create(request, (err, result) => {
                    if (err) {
                        logger_1.logger.error({ error: err }, 'Iyzico refund failed');
                        reject(new Error('Refund failed'));
                        return;
                    }
                    if (result.status === 'success') {
                        resolve({
                            refundId: result.paymentId,
                            status: 'success'
                        });
                    }
                    else {
                        resolve({
                            refundId: crypto_1.default.randomUUID(),
                            status: 'failed',
                            errorMessage: result.errorMessage || 'Refund failed'
                        });
                    }
                });
            });
        }
        catch (error) {
            logger_1.logger.error({ error, params }, 'Iyzico refund failed');
            throw error;
        }
    }
}
class PaymentService {
    providers = new Map();
    constructor() {
        // Register payment providers
        this.providers.set('mock', new MockPaymentProvider());
        this.providers.set('iyzico', new IyzicoPaymentProvider());
    }
    getProvider(name = 'mock') {
        const provider = this.providers.get(name);
        if (!provider) {
            throw (0, ApiError_1.badRequest)(`Payment provider '${name}' not found`);
        }
        return provider;
    }
    async initiatePayment(params) {
        // Validate payment request
        const { PaymentValidator } = await Promise.resolve().then(() => __importStar(require('../validation/payment-validator')));
        const validator = new PaymentValidator(database_1.prisma);
        const validation = await validator.validatePaymentInitiation({
            orderId: params.orderId,
            amountCents: 0, // Will be set from order
            currency: 'TRY',
            paymentMethod: params.paymentMethod,
            userId: '' // Will be set from order
        });
        if (!validation.isValid) {
            throw (0, ApiError_1.badRequest)(`Payment validation failed: ${validation.errors.join(', ')}`);
        }
        // Get order details
        const order = await database_1.prisma.order.findUnique({
            where: { id: params.orderId },
            include: { user: true }
        });
        if (!order) {
            throw (0, ApiError_1.notFound)('Order not found');
        }
        if (order.status !== 'pending') {
            throw (0, ApiError_1.badRequest)('Order is not in pending status');
        }
        // Select payment provider based on configuration
        const providerName = env_1.env.PAYMENT_PROVIDER;
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
            const payment = await database_1.prisma.payment.create({
                data: {
                    orderId: params.orderId,
                    provider: providerName,
                    providerPaymentId: paymentResponse.paymentId,
                    status: paymentResponse.status,
                    amountCents: order.totalCents
                }
            });
            logger_1.logger.info({
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
        }
        catch (error) {
            logger_1.logger.error({
                error,
                orderId: params.orderId,
                provider: providerName
            }, 'Payment initiation failed');
            throw (0, ApiError_1.internal)('Payment initiation failed');
        }
    }
    async processCallback(params) {
        // Get payment record
        const payment = await database_1.prisma.payment.findFirst({
            where: {
                orderId: params.orderId,
                providerPaymentId: params.paymentId
            },
            include: { order: true }
        });
        if (!payment) {
            throw (0, ApiError_1.notFound)('Payment not found');
        }
        const provider = this.getProvider(payment.provider);
        try {
            // Process callback with provider
            const callbackResponse = await provider.processCallback({
                orderId: params.orderId,
                paymentId: params.paymentId,
                providerData: params.providerData
            });
            // Idempotent update: only transition if still pending
            const result = await database_1.prisma.$transaction(async (tx) => {
                const updated = await tx.payment.updateMany({
                    where: { id: payment.id, status: 'pending' },
                    data: {
                        status: callbackResponse.status,
                        receiptUrl: callbackResponse.transactionId ? `${env_1.env.APP_URL}/receipts/${callbackResponse.transactionId}` : null
                    }
                });
                if (updated.count === 0) {
                    return { processed: false };
                }
                // Update order status if payment transitioned
                if (callbackResponse.status === 'success') {
                    await tx.order.updateMany({ where: { id: params.orderId, status: 'pending' }, data: { status: 'paid' } });
                }
                else if (callbackResponse.status === 'failed') {
                    await tx.order.updateMany({ where: { id: params.orderId, status: 'pending' }, data: { status: 'failed' } });
                }
                return { processed: true };
            });
            logger_1.logger.info({ orderId: params.orderId, paymentId: payment.id, status: callbackResponse.status, processed: result.processed }, 'Payment callback processed');
            return { ...callbackResponse, processed: result.processed };
        }
        catch (error) {
            logger_1.logger.error({
                error,
                orderId: params.orderId,
                paymentId: payment.id
            }, 'Payment callback processing failed');
            throw (0, ApiError_1.internal)('Payment callback processing failed');
        }
    }
    async refundPayment(params) {
        // Get payment record
        const payment = await database_1.prisma.payment.findUnique({
            where: { id: params.paymentId },
            include: { order: { include: { user: true } } }
        });
        if (!payment) {
            throw (0, ApiError_1.notFound)('Payment not found');
        }
        // Check if user owns this payment
        if (payment.order.user.id !== params.userId) {
            throw (0, ApiError_1.badRequest)('Not authorized to refund this payment');
        }
        if (payment.status !== 'success') {
            throw (0, ApiError_1.badRequest)('Payment is not in success status');
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
            await database_1.prisma.$transaction(async (tx) => {
                await tx.payment.update({
                    where: { id: payment.id },
                    data: { status: 'refunded' }
                });
                await tx.order.update({
                    where: { id: payment.orderId },
                    data: { status: 'refunded' }
                });
            });
            logger_1.logger.info({
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
        }
        catch (error) {
            logger_1.logger.error({
                error,
                paymentId: params.paymentId
            }, 'Payment refund failed');
            throw (0, ApiError_1.internal)('Payment refund failed');
        }
    }
    async getPaymentStatus(paymentId, userId) {
        const payment = await database_1.prisma.payment.findUnique({
            where: { id: paymentId },
            include: { order: { include: { user: true } } }
        });
        if (!payment) {
            throw (0, ApiError_1.notFound)('Payment not found');
        }
        // Check if user owns this payment
        if (payment.order.user.id !== userId) {
            throw (0, ApiError_1.badRequest)('Not authorized to view this payment');
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
exports.PaymentService = PaymentService;
