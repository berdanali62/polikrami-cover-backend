interface ContactData {
    name: string;
    email: string;
    phone?: string | null;
    message: string;
    ipAddress?: string;
    userAgent?: string;
}
export declare class ContactService {
    /**
     * Process contact form submission
     */
    submitContact(data: ContactData): Promise<{
        success: boolean;
    }>;
    /**
     * Check if user has submitted recently (rate limiting)
     */
    private checkRecentSubmission;
    /**
     * Send notification emails
     */
    private sendNotificationEmails;
    /**
     * Admin email template
     */
    private getAdminEmailTemplate;
    /**
     * Admin email text version
     */
    private getAdminEmailText;
    /**
     * User confirmation email template
     */
    private getUserEmailTemplate;
    /**
     * User confirmation text version
     */
    private getUserEmailText;
    /**
     * Escape HTML to prevent XSS
     */
    private escapeHtml;
    /**
     * Get all contact submissions (admin only)
     */
    getSubmissions(params: {
        status?: string;
        page: number;
        limit: number;
    }): Promise<{
        submissions: {
            email: string;
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userAgent: string | null;
            status: import(".prisma/client").$Enums.ContactStatus;
            message: string;
            phone: string | null;
            notes: string | null;
            ipAddress: string | null;
            emailSent: boolean;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    /**
     * Update submission status (admin only)
     */
    updateStatus(id: string, status: string, notes?: string): Promise<{
        email: string;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userAgent: string | null;
        status: import(".prisma/client").$Enums.ContactStatus;
        message: string;
        phone: string | null;
        notes: string | null;
        ipAddress: string | null;
        emailSent: boolean;
    }>;
}
export {};
