import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { Button } from '../../components/common/Button.js';
import { ArrowLeft } from 'lucide-react';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!agreeTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      return;
    }

    setIsLoading(true);
    try {
      await register(name, email, password);
      // New users flow straight into onboarding
      navigate('/onboarding', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf8] flex flex-col justify-center py-12 px-5 sm:px-6 lg:px-8 relative">
      <Link
        to="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm font-semibold text-[#6b6b6b] hover:text-[#2a2a2a]"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to home</span>
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
          Create your account
        </h2>
        <p className="text-sm text-[#6b6b6b]">
          Personalised meals and one smart list in five minutes.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-[28px] shadow-[0_12px_32px_rgba(42,42,42,0.08)] border border-[#2a2a2a]/6">
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6b6b6b] mb-1.5">
                Your Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Smith"
                className="w-full px-4 py-3 rounded-xl border border-[#2a2a2a]/15 text-[#2a2a2a] focus:outline-none focus:border-[#8bc020] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6b6b6b] mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                className="w-full px-4 py-3 rounded-xl border border-[#2a2a2a]/15 text-[#2a2a2a] focus:outline-none focus:border-[#8bc020] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6b6b6b] mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-4 py-3 rounded-xl border border-[#2a2a2a]/15 text-[#2a2a2a] focus:outline-none focus:border-[#8bc020] text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6b6b6b] mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-4 py-3 rounded-xl border border-[#2a2a2a]/15 text-[#2a2a2a] focus:outline-none focus:border-[#8bc020] text-sm"
              />
            </div>

            <div className="flex items-start gap-2.5 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-[#8bc020] focus:ring-[#8bc020] border-gray-300"
              />
              <label htmlFor="terms" className="text-xs text-[#6b6b6b] leading-tight select-none">
                I agree to the{' '}
                <Link to="/terms" target="_blank" className="text-[#8bc020] underline font-semibold">
                  Terms of Service
                </Link>{' '}
                (including allergy disclosures) and{' '}
                <Link to="/privacy" target="_blank" className="text-[#8bc020] underline font-semibold">
                  Privacy Policy
                </Link>.
              </label>
            </div>

            <div className="pt-2">
              <Button type="submit" isLoading={isLoading} className="w-full">
                Get Started
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-[#6b6b6b]">
            Already have an account?{' '}
            <Link to="/auth/login" className="font-bold text-[#8bc020] hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
