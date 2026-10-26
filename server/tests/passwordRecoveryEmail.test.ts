import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import crypto from 'crypto';
import app from '../src/index.js';
import { User } from '../src/models/User.js';
import { EmailService } from '../src/services/emailService.js';

describe('Phase 7.4 — Password Recovery Resend Email Integration Suite', () => {
  beforeAll(async () => {
    const mongoUri = 'mongodb://127.0.0.1:27017/mise_meal_planner_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@email-test\.com$/ });
    EmailService.setMockClient(null);
  });

  beforeEach(async () => {
    await User.deleteMany({ email: /@email-test\.com$/ });
    EmailService.setMockClient(null);
  });

  describe('1. Mocked Provider Successful Dispatch & SHA-256 Hashing', () => {
    it('dispatches email via Resend, stores SHA-256 hash in DB, and includes raw token only in email link', async () => {
      const user = await User.create({
        name: 'Sarah Connor',
        email: 'sarah@email-test.com',
        password: 'OriginalPassword123!',
        subscriptionTier: 'free',
        subscriptionStatus: 'trial',
      });

      const mockSend = vi.fn().mockResolvedValue({
        data: { id: 'msg_resend_mock_abc123' },
        error: null,
      });

      EmailService.setMockClient({ emails: { send: mockSend } });
      process.env.RESEND_API_KEY = 're_test_mock_api_key_valid';
      process.env.FRONTEND_URL = 'https://misemealplanner.com';
      process.env.EMAIL_FROM = 'Mise <auth@misemealplanner.com>';

      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'sarah@email-test.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('password reset instructions have been generated');

      // Verify Resend client was called
      expect(mockSend).toHaveBeenCalledTimes(1);
      const sendArgs = mockSend.mock.calls[0][0];
      expect(sendArgs.to).toBe('sarah@email-test.com');
      expect(sendArgs.from).toBe('Mise <auth@misemealplanner.com>');
      expect(sendArgs.subject).toBe('Reset your Mise Meal Planner password');

      // Extract raw token from the email reset link
      const resetLink = sendArgs.html.match(/href="([^"]+)"/)[1];
      expect(resetLink).toContain('https://misemealplanner.com/auth/reset-password?token=');
      const url = new URL(resetLink);
      const rawTokenFromEmail = url.searchParams.get('token');
      expect(rawTokenFromEmail).toBeDefined();
      expect(rawTokenFromEmail!.length).toBe(64);

      // Verify that database does NOT store the raw token, but its SHA-256 hash
      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.resetPasswordToken).not.toBe(rawTokenFromEmail);

      const expectedHash = crypto.createHash('sha256').update(rawTokenFromEmail!).digest('hex');
      expect(updatedUser?.resetPasswordToken).toBe(expectedHash);
      expect(updatedUser?.resetPasswordExpires).toBeDefined();

      // Verify that the user can reset password using the raw token extracted from email
      const resetRes = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: rawTokenFromEmail,
          newPassword: 'BrandNewSecurePassword2026!',
        });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.success).toBe(true);

      // Verify token cleared after successful reset (single-use)
      const freshUser = await User.findById(user._id);
      expect(freshUser?.resetPasswordToken).toBeUndefined();
      expect(freshUser?.resetPasswordExpires).toBeUndefined();

      // Verify new password works
      const isNewMatch = await freshUser!.comparePassword('BrandNewSecurePassword2026!');
      expect(isNewMatch).toBe(true);
    });
  });

  describe('2. Provider Delivery Failure Handling', () => {
    it('catches provider errors safely, rolls back database token, and returns uniform HTTP 200 without leaking account existence or leaving ghost tokens', async () => {
      const user = await User.create({
        name: 'Failure Test User',
        email: 'fail@email-test.com',
        password: 'Password123!',
      });

      // Mock provider rejection (e.g. rate limit, connection drop, Resend error)
      const mockSend = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Domain not verified or Resend API unavailable' },
      });

      EmailService.setMockClient({ emails: { send: mockSend } });
      process.env.RESEND_API_KEY = 're_test_mock_api_key_valid';

      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'fail@email-test.com' });

      // Response must be uniform generic HTTP 200 to prevent account enumeration
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('password reset instructions have been generated');
      expect(res.body.resetToken).toBeUndefined();

      // Verify database token was rolled back so no unusable ghost token remains
      const freshUser = await User.findById(user._id);
      expect(freshUser?.resetPasswordToken).toBeUndefined();
      expect(freshUser?.resetPasswordExpires).toBeUndefined();

      // Verify non-existent user receives the identical response
      const nonExistentRes = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'does-not-exist@email-test.com' });

      expect(nonExistentRes.status).toBe(res.status);
      expect(nonExistentRes.body.success).toBe(res.body.success);
      expect(nonExistentRes.body.message).toBe(res.body.message);
    });
  });

  describe('3. Invalid Configuration in Production', () => {
    it('returns HTTP 503 when RESEND_API_KEY is unconfigured in production without leaking user existence', async () => {
      await User.create({
        name: 'Existing User',
        email: 'exists@email-test.com',
        password: 'Password123!',
      });

      const prevEnv = process.env.NODE_ENV;
      const prevKey = process.env.RESEND_API_KEY;
      process.env.NODE_ENV = 'production';
      delete process.env.RESEND_API_KEY;
      EmailService.setMockClient(null);

      try {
        // Request for existing user
        const resExisting = await request(app)
          .post('/api/v1/auth/forgot-password')
          .send({ email: 'exists@email-test.com' });

        expect(resExisting.status).toBe(503);
        expect(resExisting.body.success).toBe(false);
        expect(resExisting.body.error).toContain('temporarily unavailable');

        // Request for non-existing user returns identical 503 (no enumeration leak)
        const resNonExistent = await request(app)
          .post('/api/v1/auth/forgot-password')
          .send({ email: 'unknown@email-test.com' });

        expect(resNonExistent.status).toBe(503);
        expect(resNonExistent.body.success).toBe(false);
        expect(resNonExistent.body.error).toContain('temporarily unavailable');
      } finally {
        process.env.NODE_ENV = prevEnv;
        if (prevKey) process.env.RESEND_API_KEY = prevKey;
      }
    });
  });

  describe('4. Token Privacy & Non-Enumeration', () => {
    it('returns generic message for non-existent users without leaking account state', async () => {
      const mockSend = vi.fn().mockResolvedValue({ data: { id: 'msg_123' }, error: null });
      EmailService.setMockClient({ emails: { send: mockSend } });
      process.env.RESEND_API_KEY = 're_test_mock_api_key_valid';

      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@email-test.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('password reset instructions have been generated');
      // No email should be sent for non-existent user
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('never includes resetToken in production response body', async () => {
      await User.create({
        name: 'Privacy User',
        email: 'privacy@email-test.com',
        password: 'Password123!',
      });

      const mockSend = vi.fn().mockResolvedValue({ data: { id: 'msg_123' }, error: null });
      EmailService.setMockClient({ emails: { send: mockSend } });
      process.env.RESEND_API_KEY = 're_test_mock_api_key_valid';

      const prevEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      try {
        const res = await request(app)
          .post('/api/v1/auth/forgot-password')
          .send({ email: 'privacy@email-test.com' });

        expect(res.status).toBe(200);
        expect(res.body.resetToken).toBeUndefined();
      } finally {
        process.env.NODE_ENV = prevEnv;
      }
    });
  });

  describe('5. Expiration & Single-Use Verification', () => {
    it('rejects expired tokens (token lifetime is 1 hour)', async () => {
      const rawToken = 'raw_expired_token_12345';
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      await User.create({
        name: 'Expired User',
        email: 'expired-test@email-test.com',
        password: 'OldPassword123!',
        resetPasswordToken: hashedToken,
        resetPasswordExpires: new Date(Date.now() - 1000), // 1 second in past
      });

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: rawToken,
          newPassword: 'BrandNewPassword2026!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('invalid or has expired');
    });

    it('rejects reuse of already-used reset token', async () => {
      const rawToken = 'raw_single_use_token_abc';
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      await User.create({
        name: 'Single Use User',
        email: 'single-use-test@email-test.com',
        password: 'OldPassword123!',
        resetPasswordToken: hashedToken,
        resetPasswordExpires: new Date(Date.now() + 3600000),
      });

      // 1st reset succeeds
      const firstRes = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: rawToken, newPassword: 'FirstNewPassword2026!' });
      expect(firstRes.status).toBe(200);

      // 2nd reset with same token fails
      const secondRes = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: rawToken, newPassword: 'SecondNewPassword2026!' });
      expect(secondRes.status).toBe(400);
      expect(secondRes.body.error).toContain('invalid or has expired');
    });
  });
});
