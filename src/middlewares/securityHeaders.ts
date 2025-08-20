import { HelmetOptions } from 'helmet';
import helmet from 'helmet';
import { env } from '../config/env';

export function securityHeaders() {
  const csp: HelmetOptions['contentSecurityPolicy'] = {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "img-src": ["'self'", 'data:', 'blob:'],
      "script-src": ["'self'"],
      "style-src": ["'self'", "'unsafe-inline'"],
      "font-src": ["'self'", 'data:'],
      // Allow API to be called from configured front-end origins
      "connect-src": ["'self'", ...env.ALLOWED_ORIGINS],
    },
  };
  return helmet({ contentSecurityPolicy: csp, hsts: true, referrerPolicy: { policy: 'no-referrer' } });
}

