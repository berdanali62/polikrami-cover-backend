import { Request, Response, NextFunction, RequestHandler } from 'express';
import * as client from 'prom-client';

// Default metrics (process, GC, heap, event loop)
client.collectDefaultMetrics({ prefix: 'polikrami_' });

export const httpRequestDuration = new client.Histogram({
  name: 'polikrami_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'] as const,
  buckets: [0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5]
});

export const httpRequestsTotal = new client.Counter({
  name: 'polikrami_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'] as const,
});

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();
  const method = req.method;
  // route label will be filled on finish using req.route?.path if available
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1e9;
    const status = String(res.statusCode);
    const route = (req as any).route?.path || req.path || 'unknown';
    httpRequestDuration.labels(method, route, status).observe(duration);
    httpRequestsTotal.labels(method, route, status).inc();
  });
  next();
}

export const metricsController: RequestHandler = async (_req, res) => {
  res.setHeader('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
};

export const aiJobsGauge = new client.Gauge({
  name: 'polikrami_ai_jobs_queued',
  help: 'Number of AI jobs in queued state',
});

export const aiJobsFailedCounter = new client.Counter({
  name: 'polikrami_ai_jobs_failed_total',
  help: 'Total number of failed AI jobs',
});


