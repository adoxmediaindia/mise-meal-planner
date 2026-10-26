import { Resend } from 'resend';

export interface SendPasswordResetOptions {
  to: string;
  name?: string;
  resetLink: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EmailService {
  private static client: Resend | null = null;
  private static mockClient: any = null;

  /**
   * Verifies whether Resend API key is present and well-formed, or mock is active in tests.
   */
  public static isConfigured(): boolean {
    if (this.mockClient) return true;
    const apiKey = process.env.RESEND_API_KEY;
    return Boolean(apiKey && apiKey.trim() && apiKey.startsWith('re_'));
  }

  /**
   * Resolves configured sender address or defaults to Resend testing sender.
   */
  public static getFromAddress(): string {
    return process.env.EMAIL_FROM || 'Mise Meal Planner <onboarding@resend.dev>';
  }

  /**
   * Resolves validated frontend base URL for email link construction.
   * Prioritizes FRONTEND_URL, then CLIENT_URL, falling back to localhost.
   */
  public static getFrontendBaseUrl(): string {
    if (process.env.FRONTEND_URL && process.env.FRONTEND_URL.trim()) {
      return process.env.FRONTEND_URL.trim().replace(/\/$/, '');
    }
    if (process.env.CLIENT_URL && process.env.CLIENT_URL.trim()) {
      return process.env.CLIENT_URL.split(',')[0].trim().replace(/\/$/, '');
    }
    return 'http://localhost:5173';
  }

  /**
   * Constructs a secure password recovery URL using the validated frontend base URL.
   */
  public static buildResetLink(rawToken: string): string {
    const base = this.getFrontendBaseUrl();
    return `${base}/auth/reset-password?token=${encodeURIComponent(rawToken)}`;
  }

  /**
   * Injects a mock Resend client for automated unit and integration tests.
   */
  public static setMockClient(mock: any | null): void {
    this.mockClient = mock;
  }

  /**
   * Lazy-initializes and caches the Resend client instance (or returns mock in tests).
   */
  private static getClient(): Resend {
    if (this.mockClient) {
      return this.mockClient;
    }
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || !apiKey.trim()) {
      throw new Error('RESEND_API_KEY is not configured in server environment.');
    }
    if (!this.client || (this.client as any)._key !== apiKey) {
      this.client = new Resend(apiKey);
      (this.client as any)._key = apiKey;
    }
    return this.client;
  }

  /**
   * Dispatches password reset email via Resend with responsive HTML and plain-text fallbacks.
   */
  public static async sendPasswordResetEmail(
    options: SendPasswordResetOptions
  ): Promise<EmailSendResult> {
    const { to, name, resetLink } = options;

    if (!this.isConfigured() && process.env.NODE_ENV === 'production') {
      throw new Error('Email delivery cannot proceed: RESEND_API_KEY is missing or invalid.');
    }

    // In local development or testing without RESEND_API_KEY, simulate successful send
    if (!this.isConfigured() && process.env.NODE_ENV !== 'production' && !this.client) {
      return {
        success: true,
        messageId: `sim_${Date.now()}`,
      };
    }

    try {
      const resend = this.getClient();
      const from = this.getFromAddress();
      const displayName = name && name.trim() ? name.trim() : 'Mise Cook';

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset your Mise password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #faf9f5; padding: 40px 20px; color: #2a2a2a; margin: 0;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table width="560" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e5e5dc;">
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <h1 style="color: #0D5C3A; margin: 0; font-size: 28px; font-weight: 700;">Mise</h1>
              <p style="color: #767571; margin: 4px 0 0 0; font-size: 14px;">Smart Meal Planning & Grocery Engine</p>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 20px;">
              <h2 style="font-size: 20px; color: #2a2a2a; margin: 0 0 12px 0;">Password Reset Request</h2>
              <p style="font-size: 15px; line-height: 24px; color: #4a4a48; margin: 0 0 16px 0;">
                Hi ${displayName},
              </p>
              <p style="font-size: 15px; line-height: 24px; color: #4a4a48; margin: 0 0 24px 0;">
                We received a request to reset your password for your Mise Meal Planner account. Click the button below to choose a new password:
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom: 28px;">
              <a href="${resetLink}" style="background-color: #0D5C3A; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 32px; border-radius: 12px; display: inline-block;">
                Reset Password
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 16px; border-top: 1px solid #f0efe8; color: #8e8d89; font-size: 13px; line-height: 20px;">
              <p style="margin: 0 0 8px 0;">
                This link will expire in <strong>1 hour</strong>. For security, it can only be used once.
              </p>
              <p style="margin: 0 0 12px 0;">
                If you did not request this password reset, you can safely ignore this email — your account remains secure.
              </p>
              <p style="margin: 0; word-break: break-all; color: #a1a09b;">
                Button not working? Copy and paste this link into your browser:<br>
                <a href="${resetLink}" style="color: #0D5C3A;">${resetLink}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim();

      const text = `
Mise Meal Planner - Password Reset

Hi ${displayName},

We received a request to reset your password. Open the link below to set a new password:

${resetLink}

This link expires in 1 hour and can only be used once. If you did not request a password reset, you can safely ignore this email.
      `.trim();

      const response = await resend.emails.send({
        from,
        to,
        subject: 'Reset your Mise Meal Planner password',
        html,
        text,
      });

      if (response.error) {
        throw new Error(response.error.message || 'Resend provider rejected email dispatch');
      }

      return {
        success: true,
        messageId: response.data?.id,
      };
    } catch (err: any) {
      // Do not log raw tokens or credentials
      console.error('[EmailService] Failed to dispatch password recovery email:', err.message);
      throw err;
    }
  }
}
