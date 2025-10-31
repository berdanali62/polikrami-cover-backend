import { Request, Response } from 'express';
export declare function initiatePaymentController(req: Request, res: Response): Promise<void>;
export declare function initiateCreditCardPaymentController(req: Request, res: Response): Promise<void>;
export declare function paymentCallbackController(req: Request, res: Response): Promise<void>;
export declare function getPaymentStatusController(req: Request, res: Response): Promise<void>;
export declare function refundPaymentController(req: Request, res: Response): Promise<void>;
export declare function mockPaymentSuccessController(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function mockPaymentFailureController(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
