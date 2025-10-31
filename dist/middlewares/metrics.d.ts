import { Request, Response, NextFunction, RequestHandler } from 'express';
export declare const httpRequestDuration: any;
export declare const httpRequestsTotal: any;
export declare function metricsMiddleware(req: Request, res: Response, next: NextFunction): void;
export declare const metricsController: RequestHandler;
export declare const aiJobsGauge: any;
export declare const aiJobsFailedCounter: any;
