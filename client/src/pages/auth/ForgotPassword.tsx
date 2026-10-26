import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api.js';
import { Button } from '../../components/common/Button.js';
import { ArrowLeft, CheckCircle2, KeyRound, Mail, AlertCircle } from 'lucide-react';

interface ForgotPasswordProps {
  defaultMode?: 'request' | 'reset';
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ defaultMode = 'request' }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialToken = searchParams.get('token') || '';

  const [mode, setMode] = useState<'request' | 'reset'>(
    initialToken || defaultMode === 'reset' ? 'reset' : 'request'
  );

  // Request form state
  const [email, setEmail] = useState('');
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [safeMessage, setSafeMessage] = useState<string | null>(null);
  const [devResetToken, setDevResetToken] = useState<string | null>(null);

  // Reset form state
  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Status state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialToken) {
      setToken(initialToken);
      setMode('reset');
    }
  }, [initialToken]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await api.forgotPassword(email.trim());
      setRequestSubmitted(true);
      // Safe messaging: do not expose whether the account exists
      setSafeMessage(
        res.message || 'If an account exists with that email address, password reset instructions have been generated.'
      );
      if (res.resetToken) {
        setDevResetToken(res.resetToken);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to process password reset request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token.trim()) {
      setError('Please provide a valid password reset token.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.resetPassword({
        token: token.trim(),
        newPassword,
      });
      setResetSuccess(true);
      setSafeMessage(res.message || 'Your password has been reset successfully.');
    } catch (err: any) {
      setError(err.message || 'The reset token is invalid or has expired. Please request a new one.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf8] flex flex-col justify-center py-12 px-5 sm:px-6 lg:px-8 relative">
      <Link
        to="/auth/login"
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm font-semibold text-[#6b6b6b] hover:text-[#2a2a2a]"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to sign in</span>
      </Link>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-block relative w-[108px] h-[34px] overflow-hidden mb-6">
          <img
            src="/assets/mise-logo.png"
            alt="mise"
            className="absolute max-w-none w-[153px] h-[153px] -left-[22px] -top-[36px]"
          />
        </Link>
        <h2 className="font-serif text-3xl font-semibold text-[#2a2a2a] mb-2">
          {mode === 'request' ? 'Reset your password' : 'Create new password'}
        </h2>
        <p className="text-sm text-[#6b6b6b]">
          {mode === 'request'
            ? 'Enter your account email to receive a password recovery link.'
            : 'Enter your verification token and your new secure password.'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-[28px] shadow-[0_12px_32px_rgba(42,42,42,0.08)] border border-[#2a2a2a]/6">
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {resetSuccess ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 bg-[#8bc020]/15 text-[#0D5C3A] rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="font-semibold text-lg text-[#2a2a2a]">Password Reset Complete</h3>
              <p className="text-sm text-[#6b6b6b]">{safeMessage}</p>
              <div className="pt-2">
                <Button onClick={() => navigate('/auth/login')} className="w-full">
                  Sign in with new password
                </Button>
              </div>
            </div>
          ) : mode === 'request' ? (
            requestSubmitted ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-emerald-900 mb-1">Check your inbox</p>
                    <p className="text-xs text-emerald-700 leading-relaxed">{safeMessage}</p>
                  </div>
                </div>

                {devResetToken && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-2">
                    <p className="font-bold flex items-center gap-1.5 text-amber-900">
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      <span>Development/Verification Token</span>
                    </p>
                    <p className="font-mono bg-white/80 p-2 rounded border border-amber-200 text-amber-900 break-all select-all">
                      {devResetToken}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setToken(devResetToken);
                        setMode('reset');
                        setRequestSubmitted(false);
                      }}
                      className="w-full py-1.5 px-3 bg-[#0D5C3A] hover:bg-[#09432a] text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Prefill Token and Set New Password →
                    </button>
                  </div>
                )}

                <div className="pt-2 flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('reset');
                      setRequestSubmitted(false);
                    }}
                    className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    I already have a reset token
                  </button>
                  <Link
                    to="/auth/login"
                    className="w-full py-2.5 text-center text-xs font-bold text-[#6b6b6b] hover:text-[#2a2a2a]"
                  >
                    Return to sign in
                  </Link>
                </div>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleRequestReset}>
                <div>
                  <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-[#6b6b6b] mb-1.5">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#2a2a2a]/15 text-[#2a2a2a] focus:outline-none focus:border-[#8bc020] text-sm"
                    />
                    <Mail className="w-4 h-4 text-[#6b6b6b] absolute left-3.5 top-3.5 pointer-events-none" />
                  </div>
                </div>

                <div className="pt-2">
                  <Button type="submit" isLoading={isLoading} className="w-full">
                    Send Recovery Instructions
                  </Button>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-[#6b6b6b]">
                  <button
                    type="button"
                    onClick={() => setMode('reset')}
                    className="font-semibold text-[#0D5C3A] hover:underline cursor-pointer"
                  >
                    Have a reset token?
                  </button>
                  <Link to="/auth/login" className="font-semibold hover:underline">
                    Remember password?
                  </Link>
                </div>
              </form>
            )
          ) : (
            <form className="space-y-4" onSubmit={handleResetPassword}>
              <div>
                <label htmlFor="token" className="block text-xs font-bold uppercase tracking-wider text-[#6b6b6b] mb-1.5">
                  Reset Token
                </label>
                <div className="relative">
                  <input
                    id="token"
                    type="text"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Enter your 32-character reset token"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#2a2a2a]/15 text-[#2a2a2a] focus:outline-none focus:border-[#8bc020] text-sm font-mono"
                  />
                  <KeyRound className="w-4 h-4 text-[#6b6b6b] absolute left-3.5 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-xs font-bold uppercase tracking-wider text-[#6b6b6b] mb-1.5">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-4 py-3 rounded-xl border border-[#2a2a2a]/15 text-[#2a2a2a] focus:outline-none focus:border-[#8bc020] text-sm"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-bold uppercase tracking-wider text-[#6b6b6b] mb-1.5">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  className="w-full px-4 py-3 rounded-xl border border-[#2a2a2a]/15 text-[#2a2a2a] focus:outline-none focus:border-[#8bc020] text-sm"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" isLoading={isLoading} className="w-full">
                  Update Password
                </Button>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-[#6b6b6b]">
                <button
                  type="button"
                  onClick={() => {
                    setMode('request');
                    setError(null);
                  }}
                  className="font-semibold text-[#0D5C3A] hover:underline cursor-pointer"
                >
                  ← Request a new token
                </button>
                <Link to="/auth/login" className="font-semibold hover:underline">
                  Back to sign in
                </Link>
              </div>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-[#6b6b6b]">
            Don't have an account yet?{' '}
            <Link to="/auth/register" className="font-bold text-[#8bc020] hover:underline">
              Create one now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
