interface NotificationPayload {
    userId: string;
    type: string;
    payload?: any;
}
export declare class NotificationService {
    send(notification: NotificationPayload): Promise<void>;
    private sendEmailNotification;
    private generateEmailText;
    markAsRead(notificationId: string, userId: string): Promise<void>;
    getUnreadCount(userId: string): Promise<number>;
    getUserNotifications(userId: string, options?: {
        page?: number;
        limit?: number;
        unreadOnly?: boolean;
    }): Promise<{
        data: {
            id: string;
            createdAt: Date;
            userId: string;
            type: string;
            payload: import("@prisma/client/runtime/library").JsonValue | null;
            read: boolean;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
}
export {};
