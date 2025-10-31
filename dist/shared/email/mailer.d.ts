export interface SendEmailParams {
    to: string;
    subject: string;
    html?: string;
    text?: string;
    bypassRedirect?: boolean;
}
export declare function sendEmail(params: SendEmailParams): Promise<void>;
