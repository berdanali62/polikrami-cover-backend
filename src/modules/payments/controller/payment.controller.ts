import { Request, Response } from 'express';
import { PaymentService } from '../service/payment.service';
import { 
  initiatePaymentSchema, 
  creditCardPaymentSchema, 
  paymentCallbackSchema,
  refundPaymentSchema 
} from '../dto/payment.dto';

const paymentService = new PaymentService();

export async function initiatePaymentController(req: Request, res: Response) {
  const { orderId, paymentMethod, returnUrl, cancelUrl } = initiatePaymentSchema.parse(req.body);
  const userId = req.user!.id;

  const result = await paymentService.initiatePayment({
    orderId,
    paymentMethod,
    returnUrl,
    cancelUrl
  });

  res.status(201).json(result);
}

export async function initiateCreditCardPaymentController(req: Request, res: Response) {
  const { orderId, cardDetails, billingAddress, installments } = creditCardPaymentSchema.parse(req.body);
  const userId = req.user!.id;

  const result = await paymentService.initiatePayment({
    orderId,
    paymentMethod: 'credit_card',
    cardDetails,
    billingAddress,
    installments
  });

  res.status(201).json(result);
}

export async function paymentCallbackController(req: Request, res: Response) {
  const { orderId, paymentId, status, transactionId, errorMessage } = paymentCallbackSchema.parse(req.body);

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

export async function getPaymentStatusController(req: Request, res: Response) {
  const { paymentId } = req.params as { paymentId: string };
  const userId = req.user!.id;

  const payment = await paymentService.getPaymentStatus(paymentId, userId);
  res.status(200).json(payment);
}

export async function refundPaymentController(req: Request, res: Response) {
  const { paymentId, amount, reason } = refundPaymentSchema.parse(req.body);
  const userId = req.user!.id;

  const result = await paymentService.refundPayment({
    paymentId,
    amount,
    reason,
    userId
  });

  res.status(200).json(result);
}

// Mock payment success endpoint (test için)
export async function mockPaymentSuccessController(req: Request, res: Response) {
  const { orderId, paymentId } = req.query as { orderId: string; paymentId: string };

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
  } catch (error) {
    res.status(500).json({
      message: 'Payment processing failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Mock payment failure endpoint (test için)
export async function mockPaymentFailureController(req: Request, res: Response) {
  const { orderId, paymentId } = req.query as { orderId: string; paymentId: string };

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
  } catch (error) {
    res.status(500).json({
      message: 'Payment processing failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
