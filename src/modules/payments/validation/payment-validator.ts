import { PrismaClient } from '@prisma/client';
import { badRequest, notFound } from '../../../shared/errors/ApiError';

export interface PaymentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class PaymentValidator {
  constructor(private prisma: PrismaClient) {}

  /**
   * Validate payment initiation request
   */
  async validatePaymentInitiation(params: {
    orderId: string;
    amountCents: number;
    currency: string;
    paymentMethod: string;
    userId: string;
  }): Promise<PaymentValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Validate order exists and belongs to user
    const order = await this.prisma.order.findUnique({
      where: { id: params.orderId },
      include: { user: true }
    });

    if (!order) {
      errors.push('Order not found');
      return { isValid: false, errors, warnings };
    }

    if (order.userId !== params.userId) {
      errors.push('Order does not belong to user');
      return { isValid: false, errors, warnings };
    }

    // 2. Validate order status
    if (order.status !== 'pending') {
      errors.push(`Order is not in pending status (current: ${order.status})`);
    }

    // 3. Validate amount consistency
    if (order.totalCents !== params.amountCents) {
      errors.push(`Amount mismatch: order total ${order.totalCents}, provided ${params.amountCents}`);
    }

    // 4. Validate currency
    const allowedCurrencies = ['TRY', 'USD', 'EUR'];
    if (!allowedCurrencies.includes(params.currency)) {
      errors.push(`Invalid currency: ${params.currency}. Allowed: ${allowedCurrencies.join(', ')}`);
    }

    // 5. Validate payment method
    const allowedMethods = ['credit_card', 'digital_wallet', 'bank_transfer'];
    if (!allowedMethods.includes(params.paymentMethod)) {
      errors.push(`Invalid payment method: ${params.paymentMethod}. Allowed: ${allowedMethods.join(', ')}`);
    }

    // 6. Check for duplicate payments
    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        orderId: params.orderId,
        status: { in: ['pending', 'processing'] }
      }
    });

    if (existingPayment) {
      errors.push('Payment already exists for this order');
    }

    // 7. Validate amount limits
    const minAmount = 100; // 1 TRY
    const maxAmount = 10000000; // 100,000 TRY

    if (params.amountCents < minAmount) {
      errors.push(`Amount too small: minimum ${minAmount} cents`);
    }

    if (params.amountCents > maxAmount) {
      errors.push(`Amount too large: maximum ${maxAmount} cents`);
    }

    // 8. Check user payment history for fraud detection
    const recentPayments = await this.prisma.payment.count({
      where: {
        order: { userId: params.userId },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    if (recentPayments > 10) {
      warnings.push('High number of recent payments detected');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate payment callback
   */
  async validatePaymentCallback(params: {
    paymentId: string;
    status: string;
    amountCents?: number;
    signature?: string;
  }): Promise<PaymentValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Validate payment exists
    const payment = await this.prisma.payment.findUnique({
      where: { id: params.paymentId },
      include: { order: true }
    });

    if (!payment) {
      errors.push('Payment not found');
      return { isValid: false, errors, warnings };
    }

    // 2. Validate status transitions
    const validTransitions: Record<string, string[]> = {
      'pending': ['processing', 'success', 'failed', 'canceled'],
      'processing': ['success', 'failed', 'canceled'],
      'success': ['refunded'],
      'failed': ['pending'],
      'canceled': ['pending'],
      'refunded': []
    };

    const currentStatus = payment.status;
    const newStatus = params.status;

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      errors.push(`Invalid status transition: ${currentStatus} -> ${newStatus}`);
    }

    // 3. Validate amount consistency
    if (params.amountCents && payment.amountCents !== params.amountCents) {
      errors.push(`Amount mismatch: stored ${payment.amountCents}, callback ${params.amountCents}`);
    }

    // 4. Validate signature (if provided)
    if (params.signature) {
      const isValidSignature = await this.validateSignature(
        params.paymentId,
        params.status,
        params.amountCents || payment.amountCents,
        params.signature
      );

      if (!isValidSignature) {
        errors.push('Invalid payment signature');
      }
    }

    // 5. Check for callback replay
    const recentCallbacks = await this.prisma.paymentCallbackLog.count({
      where: {
        paymentId: params.paymentId,
        status: params.status,
        timestamp: { // Changed from createdAt to timestamp (schema field name)
          gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        }
      }
    });

    if (recentCallbacks > 0) {
      warnings.push('Potential callback replay detected');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate refund request
   */
  async validateRefund(params: {
    paymentId: string;
    amountCents: number;
    reason: string;
    requestedBy: string;
  }): Promise<PaymentValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Validate payment exists and is refundable
    const payment = await this.prisma.payment.findUnique({
      where: { id: params.paymentId },
      include: { order: true }
    });

    if (!payment) {
      errors.push('Payment not found');
      return { isValid: false, errors, warnings };
    }

    if (payment.status !== 'success') {
      errors.push(`Payment is not refundable (status: ${payment.status})`);
    }

    // 2. Validate refund amount
    if (params.amountCents <= 0) {
      errors.push('Refund amount must be positive');
    }

    if (params.amountCents > payment.amountCents) {
      errors.push('Refund amount exceeds payment amount');
    }

    // 3. Check existing refunds
    // NOTE: Refund model does not exist in schema. Using Payment records with 'refunded' status instead.
    const existingRefunds = await this.prisma.payment.findMany({
      where: { 
        orderId: payment.orderId,
        status: 'refunded'
      }
    });

    const totalRefunded = existingRefunds.reduce((sum: number, refund: any) => sum + (refund.amountCents || 0), 0);
    const remainingAmount = payment.amountCents - totalRefunded;

    if (params.amountCents > remainingAmount) {
      errors.push(`Refund amount exceeds remaining amount (${remainingAmount} cents)`);
    }

    // 4. Validate reason
    if (!params.reason || params.reason.trim().length < 10) {
      errors.push('Refund reason must be at least 10 characters');
    }

    if (params.reason.length > 500) {
      errors.push('Refund reason must be less than 500 characters');
    }

    // 5. Check refund frequency
    // NOTE: Refund model does not exist. Using Payment records with 'refunded' status.
    const recentRefunds = await this.prisma.payment.count({
      where: {
        order: { userId: payment.order.userId },
        status: 'refunded',
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    });

    if (recentRefunds > 5) {
      warnings.push('High refund frequency detected');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate payment method specific data
   */
  validatePaymentMethodData(method: string, data: any): PaymentValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    switch (method) {
      case 'credit_card':
        if (!data.cardNumber || !data.expiryDate || !data.cvv) {
          errors.push('Credit card data incomplete');
        }

        if (data.cardNumber && !this.validateCardNumber(data.cardNumber)) {
          errors.push('Invalid card number format');
        }

        if (data.expiryDate && !this.validateExpiryDate(data.expiryDate)) {
          errors.push('Invalid expiry date format');
        }

        if (data.cvv && !this.validateCVV(data.cvv)) {
          errors.push('Invalid CVV format');
        }
        break;

      case 'digital_wallet':
        if (!data.walletId || !data.walletType) {
          errors.push('Digital wallet data incomplete');
        }

        const allowedWalletTypes = ['apple_pay', 'google_pay', 'paypal'];
        if (data.walletType && !allowedWalletTypes.includes(data.walletType)) {
          errors.push(`Invalid wallet type: ${data.walletType}`);
        }
        break;

      case 'bank_transfer':
        if (!data.accountNumber || !data.routingNumber) {
          errors.push('Bank transfer data incomplete');
        }
        break;

      default:
        errors.push(`Unknown payment method: ${method}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private validateCardNumber(cardNumber: string): boolean {
    // Remove spaces and dashes
    const cleaned = cardNumber.replace(/[\s-]/g, '');
    
    // Check if it's all digits
    if (!/^\d+$/.test(cleaned)) return false;
    
    // Check length (13-19 digits)
    if (cleaned.length < 13 || cleaned.length > 19) return false;
    
    // Luhn algorithm
    return this.luhnCheck(cleaned);
  }

  private validateExpiryDate(expiryDate: string): boolean {
    const regex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!regex.test(expiryDate)) return false;
    
    const parts = expiryDate.split('/');
    const month = parts[0];
    const year = parts[1];
    if (!month || !year) return false;
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    const expYear = parseInt(year) + 2000;
    const expMonth = parseInt(month);
    
    if (expYear < currentDate.getFullYear()) return false;
    if (expYear === currentDate.getFullYear() && expMonth < currentMonth) return false;
    
    return true;
  }

  private validateCVV(cvv: string): boolean {
    return /^\d{3,4}$/.test(cvv);
  }

  private luhnCheck(cardNumber: string): boolean {
    let sum = 0;
    let isEven = false;
    
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      const char = cardNumber[i];
      if (!char) continue;
      let digit = parseInt(char);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }

  private async validateSignature(
    paymentId: string,
    status: string,
    amountCents: number,
    signature: string
  ): Promise<boolean> {
    // Implement signature validation logic
    // This would typically involve HMAC validation with a secret key
    return true; // Placeholder
  }
}
