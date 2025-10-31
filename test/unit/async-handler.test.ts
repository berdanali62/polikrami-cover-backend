import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../src/shared/helpers/asyncHandler';

describe('Async Handler', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('when handler succeeds', () => {
    it('should execute synchronous handler successfully', async () => {
      const handler = (req: Request, res: Response, next: NextFunction) => {
        res.status(200).send('success');
      };

      const wrappedHandler = asyncHandler(handler);
      await wrappedHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith('success');
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should execute async handler successfully', async () => {
      jest.useFakeTimers();
      
      const handler = async (req: Request, res: Response, next: NextFunction) => {
        await new Promise(resolve => {
          setTimeout(() => {
            res.status(200).json({ message: 'async success' });
            resolve(undefined);
          }, 10);
        });
      };

      const wrappedHandler = asyncHandler(handler);
      
      const promise = wrappedHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      jest.advanceTimersByTime(10);
      await promise;

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'async success' });
      expect(mockNext).not.toHaveBeenCalled();
      
      jest.useRealTimers();
    });

    it('should pass request and response to handler', async () => {
      const handler = (req: Request, res: Response, next: NextFunction) => {
        expect(req).toBeDefined();
        expect(res).toBeDefined();
        res.status(200).send('success');
      };

      const wrappedHandler = asyncHandler(handler);
      await wrappedHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
    });
  });

  describe('when handler throws error', () => {
    it('should catch synchronous errors and pass to next', async () => {
      const handler = (req: Request, res: Response, next: NextFunction) => {
        throw new Error('Test error');
      };

      const wrappedHandler = asyncHandler(handler);
      await wrappedHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should catch async errors and pass to next', async () => {
      jest.useFakeTimers();
      
      const handler = async (req: Request, res: Response, next: NextFunction) => {
        await new Promise((resolve, reject) => {
          setTimeout(() => reject(new Error('Async test error')), 10);
        });
      };

      const wrappedHandler = asyncHandler(handler);
      
      const promise = wrappedHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      jest.advanceTimersByTime(10);
      await promise;

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockResponse.status).not.toHaveBeenCalled();
      
      jest.useRealTimers();
    });

    it('should catch rejections and pass to next', async () => {
      const handler = async (req: Request, res: Response, next: NextFunction) => {
        await Promise.reject(new Error('Promise rejection'));
      };

      const wrappedHandler = asyncHandler(handler);
      await wrappedHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle TypeErrors', async () => {
      const handler = (req: Request, res: Response, next: NextFunction) => {
        // @ts-ignore - Intentionally causing a TypeError
        const result = undefined.someProperty;
        res.send(result);
      };

      const wrappedHandler = asyncHandler(handler);
      await wrappedHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(TypeError));
    });

    it('should handle ReferenceErrors', async () => {
      const handler = (req: Request, res: Response, next: NextFunction) => {
        // @ts-ignore - Intentionally causing a ReferenceError
        const result = nonExistentVariable.property;
        res.send(result);
      };

      const wrappedHandler = asyncHandler(handler);
      await wrappedHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(ReferenceError));
    });
  });

  describe('when handler calls next manually', () => {
    it('should allow next to be called', async () => {
      const handler = (req: Request, res: Response, next: NextFunction) => {
        next();
      };

      const wrappedHandler = asyncHandler(handler);
      await wrappedHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow next to be called with error', async () => {
      const error = new Error('Manual error');
      const handler = (req: Request, res: Response, next: NextFunction) => {
        next(error);
      };

      const wrappedHandler = asyncHandler(handler);
      await wrappedHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('integration scenarios', () => {
    it('should work with complex async operations', async () => {
      jest.useFakeTimers();
      
      const handler = async (req: Request, res: Response, next: NextFunction) => {
        const data = await new Promise(resolve => {
          setTimeout(() => resolve({ status: 'ok' }), 10);
        });
        res.json(data);
      };

      const wrappedHandler = asyncHandler(handler);
      
      const promise = wrappedHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      jest.advanceTimersByTime(10);
      await promise;

      expect(mockResponse.json).toHaveBeenCalledWith({ status: 'ok' });
      expect(mockNext).not.toHaveBeenCalled();
      
      jest.useRealTimers();
    });

    it('should work with chained promises', async () => {
      const handler = async (req: Request, res: Response, next: NextFunction) => {
        const data = await new Promise<any>(resolve => resolve({ id: 1 }))
          .then(data => ({ ...data, processed: true }))
          .then(data => ({ ...data, status: 'complete' }));
        res.json(data);
      };

      const wrappedHandler = asyncHandler(handler);
      await wrappedHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        id: 1,
        processed: true,
        status: 'complete',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle errors in chained promises', async () => {
      const handler = async (req: Request, res: Response, next: NextFunction) => {
        await Promise.resolve()
          .then(() => {
            throw new Error('Chain error');
          });
      };

      const wrappedHandler = asyncHandler(handler);
      await wrappedHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('edge cases', () => {
    it('should handle handlers that return nothing', async () => {
      const handler = (req: Request, res: Response, next: NextFunction) => {
        // No operation
      };

      const wrappedHandler = asyncHandler(handler);
      await wrappedHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle handlers with setTimeout', async () => {
      jest.useFakeTimers();
      
      const handler = async (req: Request, res: Response, next: NextFunction) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        res.send('delayed response');
      };

      const wrappedHandler = asyncHandler(handler);
      
      const promise = wrappedHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      jest.advanceTimersByTime(50);
      await promise;

      expect(mockResponse.send).toHaveBeenCalledWith('delayed response');
      expect(mockNext).not.toHaveBeenCalled();
      
      jest.useRealTimers();
    });

    it('should handle errors after timeout', async () => {
      jest.useFakeTimers();
      
      const handler = async (req: Request, res: Response, next: NextFunction) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        throw new Error('Timeout error');
      };

      const wrappedHandler = asyncHandler(handler);
      
      const promise = wrappedHandler(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      jest.advanceTimersByTime(10);
      await promise;

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      
      jest.useRealTimers();
    });
  });

  describe('concurrent operations', () => {
    it('should handle multiple concurrent handler calls', async () => {
      jest.useFakeTimers();
      
      const handler = async (req: Request, res: Response, next: NextFunction) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        res.send('success');
      };

      const wrappedHandler = asyncHandler(handler);
      const promises = Array.from({ length: 5 }, () =>
        wrappedHandler(
          mockRequest as Request,
          mockResponse as Response,
          mockNext
        )
      );

      jest.advanceTimersByTime(10);
      await Promise.all(promises);

      expect(mockResponse.send).toHaveBeenCalledTimes(5);
      expect(mockNext).not.toHaveBeenCalled();
      
      jest.useRealTimers();
    });
  });

  describe('return value', () => {
    it('should return a RequestHandler', () => {
      const handler = (req: Request, res: Response, next: NextFunction) => {
        res.send('test');
      };

      const wrappedHandler = asyncHandler(handler);
      
      expect(typeof wrappedHandler).toBe('function');
      expect(wrappedHandler.length).toBe(3); // req, res, next
    });
  });
});
