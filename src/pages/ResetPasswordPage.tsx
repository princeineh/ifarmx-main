import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Lock, Loader2, CheckCircle, Eye, EyeOff, Leaf } from 'lucide-react';

interface ResetPasswordPageProps {
  onNavigate: (page: string) => void;
  onComplete: () => void;
}

export function ResetPasswordPage({ onNavigate, onComplete }: ResetPasswordPageProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => onComplete(), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen african-warm-bg adinkra-bg flex flex-col">
      <div className="kente-stripe w-full" />

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="african-card rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="relative inline-flex items-center justify-center w-20 h-20 mb-5">
                <div className="absolute inset-0 bg-gradient-to-br from-kente-green via-emerald-600 to-kente-green rounded-2xl rotate-3 opacity-90" />
                <Leaf className="relative w-10 h-10 text-white drop-shadow-md" />
              </div>
              <h1 className="font-african text-2xl font-bold text-earth-900 mb-1">New Password</h1>
              <p className="text-earth-600 text-sm">Choose a strong password for your account</p>
            </div>

            {success ? (
              <div className="text-center py-4">
                <CheckCircle className="w-16 h-16 text-kente-green mx-auto mb-4" />
                <h2 className="text-lg font-bold text-earth-900 mb-2">Password Updated!</h2>
                <p className="text-earth-600 text-sm">
                  Your password has been changed. Redirecting to your dashboard...
                </p>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-4 p-3 bg-kente-red/10 border border-kente-red/20 rounded-lg text-kente-red text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-earth-800 mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-earth-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-11 py-2.5 bg-earth-50 border border-earth-200 rounded-xl focus:ring-2 focus:ring-kente-green/30 focus:border-kente-green transition-colors"
                        placeholder="At least 6 characters"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-earth-400 hover:text-earth-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-earth-800 mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-earth-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-earth-50 border border-earth-200 rounded-xl focus:ring-2 focus:ring-kente-green/30 focus:border-kente-green transition-colors"
                        placeholder="Repeat your password"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-kente-green to-emerald-700 text-white py-3 rounded-xl font-semibold hover:from-emerald-700 hover:to-kente-green transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-kente-green/20"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Set New Password'
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
