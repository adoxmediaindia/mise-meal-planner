import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app, { isOriginAllowed } from '../src/index.js';
import { User } from '../src/models/User.js';
import { EmailService } from '../src/services/emailService.js';

describe('Phase 7.2 — Security & Audit Fixes Verification Suite', () => {
  beforeAll(async () => {
    const mongoUri = 'mongodb://127.0.0.1:27017/mise_meal_planner_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@security-test\.com$/ });
    delete process.env.RATE_LIMIT_MAX;
  });

  beforeEach(async () => {
    await User.deleteMany({ email: /@security-test\.com$/ });
  });

  describe('Fix 1: Password Recovery Security', () => {
    it('NEVER exposes resetToken in production API responses', async () => {
      // Create test user
      await User.create({
        name: 'Sec User',
        email: 'prod-forgot@security-test.com',
        password: 'Password123!',
        subscriptionTier: 'free',
        subscriptionStatus: 'trial',
      });

      // Switch to production mode with configured Resend mock
      const prevEnv = process.env.NODE_ENV;
      const prevKey = process.env.RESEND_API_KEY;
      process.env.NODE_ENV = 'production';
      process.env.RESEND_API_KEY = 're_test_mock_key';
      EmailService.setMockClient({ emails: { send: vi.fn().mockResolvedValue({ data: { id: 'msg_1' }, error: null }) } });

      try {
        const res = await request(app)
          .post('/api/v1/auth/forgot-password')
          .send({ email: 'prod-forgot@security-test.com' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('If an account exists with that email address, password reset instructions have been generated.');
        // resetToken MUST be undefined in production
        expect(res.body.resetToken).toBeUndefined();

        // Verify token was generated in database for email dispatch
        const dbUser = await User.findOne({ email: 'prod-forgot@security-test.com' });
        expect(dbUser?.resetPasswordToken).toBeDefined();
        expect(dbUser?.resetPasswordExpires).toBeDefined();
      } finally {
        process.env.NODE_ENV = prevEnv;
        if (prevKey) process.env.RESEND_API_KEY = prevKey;
        else delete process.env.RESEND_API_KEY;
        EmailService.setMockClient(null);
      }
    });

    it('exposes resetToken only in non-production environments for testing', async () => {
      await User.create({
        name: 'Dev User',
        email: 'dev-forgot@security-test.com',
        password: 'Password123!',
        subscriptionTier: 'free',
        subscriptionStatus: 'trial',
      });

      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'dev-forgot@security-test.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.resetToken).toBeDefined();
      expect(typeof res.body.resetToken).toBe('string');
      expect(res.body.resetToken.length).toBe(64);
    });

    it('rejects expired password reset tokens', async () => {
      const expiredUser = await User.create({
        name: 'Expired Token User',
        email: 'expired@security-test.com',
        password: 'OldPassword123!',
        resetPasswordToken: 'expired_token_hex_12345',
        resetPasswordExpires: new Date(Date.now() - 60000), // 1 minute in the past
      });

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'expired_token_hex_12345',
          newPassword: 'BrandNewSecurePassword2026!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('invalid or has expired');

      // Password remains unchanged
      const freshUser = await User.findById(expiredUser._id);
      const isMatch = await freshUser!.comparePassword('OldPassword123!');
      expect(isMatch).toBe(true);
    });

    it('enforces single-use behavior: token cannot be reused after password reset', async () => {
      const user = await User.create({
        name: 'Single Use User',
        email: 'single-use@security-test.com',
        password: 'OriginalPassword123!',
        resetPasswordToken: 'valid_single_use_token_999',
        resetPasswordExpires: new Date(Date.now() + 3600000), // 1 hour in future
      });

      // First reset: should succeed
      const firstRes = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'valid_single_use_token_999',
          newPassword: 'FirstNewPassword2026!',
        });

      expect(firstRes.status).toBe(200);
      expect(firstRes.body.success).toBe(true);

      // Verify token cleared from database
      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.resetPasswordToken).toBeUndefined();
      expect(updatedUser?.resetPasswordExpires).toBeUndefined();

      // Second reset attempt with same token: MUST FAIL (replay protection)
      const secondRes = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'valid_single_use_token_999',
          newPassword: 'AttackerReplayPassword2026!',
        });

      expect(secondRes.status).toBe(400);
      expect(secondRes.body.success).toBe(false);
      expect(secondRes.body.error).toContain('invalid or has expired');
    });
  });

  describe('Fix 2: CORS Allowlist & Origin Validation', () => {
    it('allows explicitly configured frontend origin with credentials', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:5173');

      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('allows production frontend origin https://mise-meal-planner-pi.vercel.app with credentials', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'https://mise-meal-planner-pi.vercel.app');

      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('https://mise-meal-planner-pi.vercel.app');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
      expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
    });

    it('successfully handles CORS OPTIONS preflight requests from production origin', async () => {
      const res = await request(app)
        .options('/api/v1/auth/register')
        .set('Origin', 'https://mise-meal-planner-pi.vercel.app')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type, Authorization');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe('https://mise-meal-planner-pi.vercel.app');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
      expect(res.headers['access-control-allow-methods']).toContain('POST');
      expect(res.headers['access-control-allow-headers']).toContain('Content-Type');
    });

    it('supports FRONTEND_URL and strips trailing slashes', () => {
      const prevFrontend = process.env.FRONTEND_URL;
      try {
        process.env.FRONTEND_URL = 'https://custom-domain.com/, https://preview-app.vercel.app/ ';
        expect(isOriginAllowed('https://custom-domain.com')).toBe(true);
        expect(isOriginAllowed('https://preview-app.vercel.app')).toBe(true);
      } finally {
        if (prevFrontend) process.env.FRONTEND_URL = prevFrontend;
        else delete process.env.FRONTEND_URL;
      }
    });

    it('blocks arbitrary unapproved Vercel origins (*.vercel.app) during preflight', async () => {
      const res = await request(app)
        .options('/api/v1/auth/register')
        .set('Origin', 'https://unauthorized-fork.vercel.app')
        .set('Access-Control-Request-Method', 'POST');

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('blocks arbitrary unapproved Vercel origins (*.vercel.app)', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'https://malicious-attacker.vercel.app');

      expect(res.status).toBe(200);
      // Access-Control-Allow-Origin must NOT be present
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('blocks spoofed origins containing localhost as substring', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'http://attacker-localhost.com');

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('permits requests with NO Origin header (native mobile clients, curl, server-to-server)', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('unit helper isOriginAllowed validates origins strictly', () => {
      // Local development on localhost ports
      expect(isOriginAllowed('http://localhost:5173')).toBe(true);
      expect(isOriginAllowed('http://localhost:3000')).toBe(true);
      expect(isOriginAllowed('http://127.0.0.1:5173')).toBe(true);

      // Allowed production frontend
      expect(isOriginAllowed('https://mise-meal-planner-pi.vercel.app')).toBe(true);
      expect(isOriginAllowed('https://mise-meal-planner-pi.vercel.app/')).toBe(true);

      // Malicious or unapproved origins
      expect(isOriginAllowed('https://evil-site.vercel.app')).toBe(false);
      expect(isOriginAllowed('http://localhost.attacker.com')).toBe(false);
      expect(isOriginAllowed('https://evil-domain.com')).toBe(false);
    });
  });

  describe('Fix 3: Rate Limiting Coverage', () => {
    it('applies rate-limiting headers to /api/v1/auth/login and /api/auth/login alias', async () => {
      const res1 = await request(app).post('/api/v1/auth/login').send({
        email: 'nonexistent@security-test.com',
        password: 'Password123!',
      });
      expect(res1.headers['ratelimit-limit']).toBeDefined();

      const res2 = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@security-test.com',
        password: 'Password123!',
      });
      expect(res2.headers['ratelimit-limit']).toBeDefined();
    });

    it('applies rate-limiting headers to /api/v1/auth/register and /api/auth/register alias', async () => {
      const res1 = await request(app).post('/api/v1/auth/register').send({});
      expect(res1.headers['ratelimit-limit']).toBeDefined();

      const res2 = await request(app).post('/api/auth/register').send({});
      expect(res2.headers['ratelimit-limit']).toBeDefined();
    });

    it('applies rate-limiting headers to /api/v1/auth/forgot-password and /api/auth/forgot-password alias', async () => {
      const res1 = await request(app).post('/api/v1/auth/forgot-password').send({
        email: 'forgot@security-test.com',
      });
      expect(res1.headers['ratelimit-limit']).toBeDefined();

      const res2 = await request(app).post('/api/auth/forgot-password').send({
        email: 'forgot@security-test.com',
      });
      expect(res2.headers['ratelimit-limit']).toBeDefined();
    });

    it('returns HTTP 429 when rate limit is exceeded on an endpoint', async () => {
      // Temporarily configure small limit of 3 for testing
      process.env.RATE_LIMIT_MAX = '3';

      const email = 'spam@security-test.com';
      const testIp = '192.168.99.55';

      // 3 allowed requests
      for (let i = 0; i < 3; i++) {
        const res = await request(app)
          .post('/api/v1/auth/login')
          .set('x-test-client-ip', testIp)
          .send({ email, password: 'BadPassword!' });
        expect(res.status).toBe(401);
      }

      // 4th request from same IP must be rejected with 429 Too Many Requests
      const blockedRes = await request(app)
        .post('/api/v1/auth/login')
        .set('x-test-client-ip', testIp)
        .send({ email, password: 'BadPassword!' });

      expect(blockedRes.status).toBe(429);
      expect(blockedRes.body.success).toBe(false);
      expect(blockedRes.body.error).toContain('Too many requests');

      // Cleanup
      delete process.env.RATE_LIMIT_MAX;
    });

    it('strictly ignores x-test-client-ip in production to prevent spoofing bypass', async () => {
      const prevEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      process.env.RATE_LIMIT_MAX = '2';

      try {
        const email = 'spoof@security-test.com';

        // 2 requests with different spoofed IP headers
        await request(app)
          .post('/api/v1/auth/login')
          .set('x-test-client-ip', '10.200.1.1')
          .send({ email, password: 'Bad' });

        await request(app)
          .post('/api/v1/auth/login')
          .set('x-test-client-ip', '10.200.1.2')
          .send({ email, password: 'Bad' });

        // 3rd request with yet another spoofed IP: MUST be blocked because production keys on actual req.ip
        const blockedRes = await request(app)
          .post('/api/v1/auth/login')
          .set('x-test-client-ip', '10.200.1.3')
          .send({ email, password: 'Bad' });

        expect(blockedRes.status).toBe(429);
        expect(blockedRes.body.error).toContain('Too many requests');
      } finally {
        process.env.NODE_ENV = prevEnv;
        delete process.env.RATE_LIMIT_MAX;
      }
    });

    it('does NOT apply rate limiter to general public endpoints', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.headers['ratelimit-limit']).toBeUndefined();
    });
  });
});
