import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { createNotification } from '../services/notifications';
import { LogIn, Leaf, Sprout, TreePine, Eye, EyeOff, ArrowLeft } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

export function LoginPage({ onNavigate }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const tapRef = useRef({ count: 0, lastTap: 0 });
  const [logoActive, setLogoActive] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ifarmx_remember_me');
    if (saved !== null) setRememberMe(saved === 'true');
    const savedEmail = localStorage.getItem('ifarmx_saved_email');
    if (savedEmail) setEmail(savedEmail);
  }, []);

  const handleLogoTap = () => {
    const now = Date.now();
    if (now - tapRef.current.lastTap > 1200) {
      tapRef.current.count = 1;
    } else {
      tapRef.current.count += 1;
    }
    tapRef.current.lastTap = now;

    if (tapRef.current.count >= 5) {
      sessionStorage.setItem('_ap', '1');
      tapRef.current.count = 0;
      setLogoActive(true);
      setTimeout(() => setLogoActive(false), 600);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        createNotification(
          data.user.id,
          'login_alert',
          'New Sign-In Detected',
          `A new sign-in was detected on your iFarmX account on ${new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}. If this was you, no action is needed. If you don't recognize this activity, please change your password immediately to secure your account.`
        );
      }

      localStorage.setItem('ifarmx_remember_me', String(rememberMe));
      if (rememberMe) {
        localStorage.setItem('ifarmx_saved_email', email);
        localStorage.removeItem('ifarmx_session_temp');
      } else {
        localStorage.removeItem('ifarmx_saved_email');
        localStorage.setItem('ifarmx_session_temp', '1');
        sessionStorage.setItem('ifarmx_active', '1');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen african-warm-bg adinkra-bg flex flex-col">
      <div className="kente-stripe w-full" />

      <div className="max-w-7xl mx-auto w-full px-4 pt-4">
        <button
          onClick={() => onNavigate('landing')}
          className="inline-flex items-center gap-1.5 text-sm text-earth-600 hover:text-kente-green transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="african-card rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div
                onClick={handleLogoTap}
                className="relative inline-flex items-center justify-center w-20 h-20 mb-5 cursor-pointer select-none"
              >
                <div className={`absolute inset-0 bg-gradient-to-br from-kente-green via-emerald-600 to-kente-green rounded-2xl rotate-3 transition-opacity duration-300 ${logoActive ? 'opacity-100' : 'opacity-90'}`} />
                <div className={`absolute inset-0 bg-gradient-to-br from-kente-gold/20 to-transparent rounded-2xl rotate-3 transition-all duration-300 ${logoActive ? 'scale-110 opacity-60' : ''}`} />
                <Leaf className={`relative w-10 h-10 text-white drop-shadow-md transition-transform duration-300 ${logoActive ? 'scale-110' : ''}`} />
              </div>
              <h1 className="font-african text-3xl font-bold text-earth-900 mb-1">iFarmX</h1>
              <p className="text-earth-600 text-sm">Grow your own. Feed your future.</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-kente-red/10 border border-kente-red/20 rounded-lg text-kente-red text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleEmailLogin} className="space-y-4 mb-5">
              <div>
                <label className="block text-sm font-semibold text-earth-800 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-earth-50 border border-earth-200 rounded-xl focus:ring-2 focus:ring-kente-green/30 focus:border-kente-green transition-colors"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-earth-800 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-11 bg-earth-50 border border-earth-200 rounded-xl focus:ring-2 focus:ring-kente-green/30 focus:border-kente-green transition-colors"
                    placeholder="Enter password"
                    required
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

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-earth-300 text-kente-green focus:ring-kente-green/30"
                  />
                  <span className="text-sm text-earth-600">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => onNavigate('forgot-password')}
                  className="text-sm text-kente-green font-medium hover:text-emerald-700 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-kente-green to-emerald-700 text-white py-3 rounded-xl font-semibold hover:from-emerald-700 hover:to-kente-green transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-kente-green/20"
              >
                <LogIn className="w-5 h-5" />
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-earth-600">
                Don't have an account?{' '}
                <button
                  onClick={() => onNavigate('signup')}
                  className="text-kente-green font-semibold hover:text-emerald-700 transition-colors"
                >
                  Join iFarmX
                </button>
              </p>
            </div>
          </div>

          <div className="mt-6 text-center space-y-2">
            <div className="flex items-center justify-center gap-3 text-earth-500">
              <Sprout className="w-4 h-4 text-kente-green" />
              <p className="text-sm font-medium">Oil Palm Revolution Starter Kit -- Now Available</p>
              <TreePine className="w-4 h-4 text-kente-green" />
            </div>
            <p className="text-xs text-earth-400">More crop kits coming soon. 100% Free Platform. Community-Driven.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
