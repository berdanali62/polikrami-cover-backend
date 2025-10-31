export type CreditTransactionType = 'spend' | 'refund' | 'purchase' | 'gift';
export declare const AI_COSTS: {
    readonly firstGeneration: 100;
    readonly secondGeneration: 200;
    readonly thirdGeneration: 300;
    readonly additionalGeneration: 400;
};
export declare const WELCOME_BONUS = 500;
export declare class WalletService {
    /**
     * Get or create wallet for user
     * Automatically gives welcome bonus on first creation
     */
    getOrCreateWallet(userId: string): Promise<{
        updatedAt: Date;
        userId: string;
        balance: number;
    }>;
    /**
     * Get current balance
     */
    getBalance(userId: string): Promise<number>;
    /**
     * Get transaction history with pagination and filters
     */
    getHistory(params: {
        userId: string;
        page: number;
        limit: number;
        type: string;
    }): Promise<{
        transactions: {
            id: string;
            createdAt: Date;
            userId: string;
            type: string;
            delta: number;
            refId: string | null;
            note: string | null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    /**
     * Increase credits (purchase, gift, refund)
     */
    increase(userId: string, amount: number, type: CreditTransactionType, note?: string, refId?: string): Promise<void>;
    /**
     * Decrease credits (spend)
     * Throws error if insufficient balance
     */
    decrease(userId: string, amount: number, type: CreditTransactionType, note?: string, refId?: string): Promise<void>;
    /**
     * Calculate AI generation cost based on attempt count
     */
    calculateAiCost(attemptNumber: number): number;
    /**
     * Charge for AI generation
     * Returns remaining balance
     */
    chargeForAiGeneration(userId: string, draftId: string, attemptNumber: number): Promise<{
        charged: number;
        remainingBalance: number;
    }>;
    /**
     * Refund AI generation credits
     * Used when AI generation fails
     */
    refundAiGeneration(userId: string, draftId: string, amount: number): Promise<void>;
    /**
     * Admin grant credits to user
     */
    grantCredits(params: {
        userId: string;
        amount: number;
        note?: string;
        adminId: string;
    }): Promise<void>;
    /**
     * Purchase credits (requires payment integration)
     */
    purchaseCredits(params: {
        userId: string;
        packageType: 'basic' | 'standard' | 'premium';
        orderId: string;
    }): Promise<{
        added: number;
        newBalance: number;
    }>;
    /**
     * Check if user has sufficient credits
     */
    hasSufficientCredits(userId: string, requiredAmount: number): Promise<boolean>;
    /**
     * Get wallet statistics
     */
    getStats(userId: string): Promise<{
        currentBalance: number;
        totalEarned: number;
        totalSpent: number;
        totalRefunded: number;
        transactionCount: number;
    }>;
}
export declare const walletService: WalletService;
