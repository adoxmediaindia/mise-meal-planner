import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { Button } from '../../components/common/Button.js';
import { ArrowLeft, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/app/plan';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = async () => {
    setEmail('chef@misemealplanner.com');
    setPassword('Password123!');
    setIsLoading(true);
    setError(null);
    try {
      await login('chef@misemealplanner.com', 'Password123!');
      navigate('/app/plan', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Could not log in with demo account.');
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
          Welcome back
        </h2>
        <p className="text-sm text-[#6b6b6b]">
          Sign in to access your weekly meal plan and smart shopping list.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-[28px] shadow-[0_12px_32px_rgba(42,42,42,0.08)] border border-[#2a2a2a]/6">
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Quick Demo Fill Button */}
          <button
            type="button"
            onClick={fillDemoAccount}
            className="w-full mb-6 py-2.5 px-4 bg-[#9ed034]/15 hover:bg-[#9ed034]/25 border border-[#9ed034]/40 rounded-xl text-xs sm:text-sm font-bold text-[#1f2a06] flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#8bc020]" />
            <span>Sign in with 1-Click Demo Chef Account</span>
          </button>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6b6b6b] mb-1.5">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="chef@misemealplanner.com"
                className="w-full px-4 py-3 rounded-xl border border-[#2a2a2a]/15 text-[#2a2a2a] focus:outline-none focus:border-[#8bc020] text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6b6b6b]">
                  Password
                </label>
                <Link
                  to="/auth/forgot-password"
                  className="text-xs font-semibold text-[#8bc020] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-[#2a2a2a]/15 text-[#2a2a2a] focus:outline-none focus:border-[#8bc020] text-sm"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" isLoading={isLoading} className="w-full">
                Sign in
              </Button>
            </div>
          </form>

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
