"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initiatePaymentController = initiatePaymentController;
exports.initiateCreditCardPaymentController = initiateCreditCardPaymentController;
exports.paymentCallbackController = paymentCallbackController;
exports.getPaymentStatusController = getPaymentStatusController;
exports.refundPaymentController = refundPaymentController;
exports.mockPaymentSuccessController = mockPaymentSuccessController;
exports.mockPaymentFailureController = mockPaymentFailureController;
const payment_service_1 = require("../service/payment.service");
const payment_dto_1 = require("../dto/payment.dto");
const paymentService = new payment_service_1.PaymentService();
async function initiatePaymentController(req, res) {
    const { orderId, paymentMethod, returnUrl, cancelUrl } = payment_dto_1.initiatePaymentSchema.parse(req.body);
    const userId = req.user.id;
    const result = await paymentService.initiatePayment({
        orderId,
        paymentMethod,
        returnUrl,
        cancelUrl
    });
    res.status(201).json(result);
}
async function initiateCreditCardPaymentController(req, res) {
    const { orderId, cardDetails, billingAddress, installments } = payment_dto_1.creditCardPaymentSchema.parse(req.body);
    const userId = req.user.id;
    const result = await paymentService.initiatePayment({
        orderId,
        paymentMethod: 'credit_card',
        cardDetails,
        billingAddress,
        installments
    });
    res.status(201).json(result);
}
async function paymentCallbackController(req, res) {
    const { orderId, paymentId, status, transactionId, errorMessage } = payment_dto_1.paymentCallbackSchema.parse(req.body);
    const result = await paymentService.processCallback({
        orderId,
        paymentId,
        providerData: {
            status,
            transactionId,
            errorMessage,
            ...req.body
        }
    });
    res.status(200).json(result);
}
async function getPaymentStatusController(req, res) {
    const { paymentId } = req.params;
    const userId = req.user.id;
    const payment = await paymentService.getPaymentStatus(paymentId, userId);
    res.status(200).json(payment);
}
async function refundPaymentController(req, res) {
    const { paymentId, amount, reason } = payment_dto_1.refundPaymentSchema.parse(req.body);
    const userId = req.user.id;
    const result = await paymentService.refundPayment({
        paymentId,
        amount,
        reason,
        userId
    });
    res.status(200).json(result);
}
// Mock payment success endpoint (test için)
async function mockPaymentSuccessController(req, res) {
    const { orderId, paymentId } = req.query;
    if (!orderId || !paymentId) {
        return res.status(400).json({ message: 'Missing orderId or paymentId' });
    }
    try {
        const result = await paymentService.processCallback({
            orderId,
            paymentId,
            providerData: {
                status: 'success',
                transactionId: `mock_txn_${Date.now()}`,
                mockCallback: true
            }
        });
        res.status(200).json({
            message: 'Payment completed successfully!',
            status: result.status,
            transactionId: result.transactionId
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Payment processing failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
// Mock payment failure endpoint (test için)
async function mockPaymentFailureController(req, res) {
    const { orderId, paymentId } = req.query;
    if (!orderId || !paymentId) {
        return res.status(400).json({ message: 'Missing orderId or paymentId' });
    }
    try {
        const result = await paymentService.processCallback({
            orderId,
            paymentId,
            providerData: {
                status: 'failed',
                errorMessage: 'Mock payment failed - insufficient funds',
                mockCallback: true
            }
        });
        res.status(200).json({
            message: 'Payment failed',
            status: result.status,
            error: result.errorMessage
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Payment processing failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
