import rateLimit from 'express-rate-limit';

/**
 * Dynamic rate limit resolver:
 * Defaults to 100 requests per 15 minutes in production and development.
 * Can be overridden in test environments via RATE_LIMIT_MAX.
 */
export const getAuthRateLimitMax = (): number => {
  if (process.env.RATE_LIMIT_MAX) {
    const custom = parseInt(process.env.RATE_LIMIT_MAX, 10);
    if (!isNaN(custom)) return custom;
  }
  return 100;
};

/**
 * Rate Limiter for sensitive authentication endpoints:
 * - /auth/login
 * - /auth/register
 * - /auth/forgot-password
 * - /auth/reset-password
 *
 * Applied at the route level to uniformly cover both /api/v1 and /api aliases
 * without double-counting.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: () => getAuthRateLimitMax(),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Only permit test client IP override strictly during automated test runs.
    // In production and development environments, client-supplied headers are NEVER trusted.
    if (process.env.NODE_ENV === 'test' && req.headers['x-test-client-ip']) {
      return req.headers['x-test-client-ip'] as string;
    }
    return req.ip || '127.0.0.1';
  },
  message: { success: false, error: 'Too many requests, please try again later.' },
});

/**
 * Rate Limiter for AI endpoints (/api/v1/ai/*):
 * Protects against rapid automated abuse and API credit exhaustion.
 */
export const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: () => {
    if (process.env.AI_RATE_LIMIT_MAX) {
      const custom = parseInt(process.env.AI_RATE_LIMIT_MAX, 10);
      if (!isNaN(custom)) return custom;
    }
    return 15;
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    if (process.env.NODE_ENV === 'test' && req.headers['x-test-client-ip']) {
      return req.headers['x-test-client-ip'] as string;
    }
    return (req as any).user?.id || req.ip || '127.0.0.1';
  },
  message: {
    success: false,
    error: 'Too many AI requests. Please wait a few minutes before trying again.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});
