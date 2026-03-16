import { useState } from 'react';
import { ArrowLeft, Mail, Loader2, CheckCircle, Leaf } from 'lucide-react';

interface ForgotPasswordPageProps {
  onNavigate: (page: string) => void;
}

export function ForgotPasswordPage({ onNavigate }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-password-reset`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('Failed to send reset email');
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen african-warm-bg adinkra-bg flex flex-col">
      <div className="kente-stripe w-full" />

      <div className="max-w-7xl mx-auto w-full px-4 pt-4">
        <button
          onClick={() => onNavigate('login')}
          className="inline-flex items-center gap-1.5 text-sm text-earth-600 hover:text-kente-green transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="african-card rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="relative inline-flex items-center justify-center w-20 h-20 mb-5">
                <div className="absolute inset-0 bg-gradient-to-br from-kente-green via-emerald-600 to-kente-green rounded-2xl rotate-3 opacity-90" />
                <Leaf className="relative w-10 h-10 text-white drop-shadow-md" />
              </div>
              <h1 className="font-african text-2xl font-bold text-earth-900 mb-1">Reset Password</h1>
              <p className="text-earth-600 text-sm">Enter your email and we'll send you a reset link</p>
            </div>

            {sent ? (
              <div className="text-center py-4">
                <CheckCircle className="w-16 h-16 text-kente-green mx-auto mb-4" />
                <h2 className="text-lg font-bold text-earth-900 mb-2">Check Your Email</h2>
                <p className="text-earth-600 text-sm mb-6">
                  We've sent a password reset link to <strong>{email}</strong>. Click the link in the email to set a new password.
                </p>
                <p className="text-earth-500 text-xs mb-6">
                  Didn't receive it? Check your spam folder or try again in a few minutes.
                </p>
                <button
                  onClick={() => { setSent(false); setEmail(''); }}
                  className="text-kente-green font-semibold hover:text-emerald-700 transition-colors text-sm"
                >
                  Try a different email
                </button>
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
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-earth-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-earth-50 border border-earth-200 rounded-xl focus:ring-2 focus:ring-kente-green/30 focus:border-kente-green transition-colors"
                        placeholder="your@email.com"
                        required
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
                        Sending...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </button>
                </form>
              </>
            )}

            <div className="mt-6 text-center">
              <p className="text-earth-600 text-sm">
                Remember your password?{' '}
                <button
                  onClick={() => onNavigate('login')}
                  className="text-kente-green font-semibold hover:text-emerald-700 transition-colors"
                >
                  Sign In
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
