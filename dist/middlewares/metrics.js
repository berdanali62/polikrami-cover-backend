"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiJobsFailedCounter = exports.aiJobsGauge = exports.metricsController = exports.httpRequestsTotal = exports.httpRequestDuration = void 0;
exports.metricsMiddleware = metricsMiddleware;
const client = __importStar(require("prom-client"));
// Default metrics (process, GC, heap, event loop)
client.collectDefaultMetrics({ prefix: 'polikrami_' });
exports.httpRequestDuration = new client.Histogram({
    name: 'polikrami_http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5]
});
exports.httpRequestsTotal = new client.Counter({
    name: 'polikrami_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status'],
});
function metricsMiddleware(req, res, next) {
    const start = process.hrtime.bigint();
    const method = req.method;
    // route label will be filled on finish using req.route?.path if available
    res.on('finish', () => {
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1e9;
        const status = String(res.statusCode);
        const route = req.route?.path || req.path || 'unknown';
        exports.httpRequestDuration.labels(method, route, status).observe(duration);
        exports.httpRequestsTotal.labels(method, route, status).inc();
    });
    next();
}
const metricsController = async (_req, res) => {
    res.setHeader('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
};
exports.metricsController = metricsController;
exports.aiJobsGauge = new client.Gauge({
    name: 'polikrami_ai_jobs_queued',
    help: 'Number of AI jobs in queued state',
});
exports.aiJobsFailedCounter = new client.Counter({
    name: 'polikrami_ai_jobs_failed_total',
    help: 'Total number of failed AI jobs',
});
