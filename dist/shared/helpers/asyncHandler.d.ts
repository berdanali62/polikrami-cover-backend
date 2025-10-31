import { RequestHandler } from 'express';
export declare function asyncHandler<T extends RequestHandler>(handler: T): RequestHandler;
