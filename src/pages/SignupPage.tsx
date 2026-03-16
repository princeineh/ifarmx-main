import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { createNotification } from '../services/notifications';
import { Leaf, ArrowRight, ArrowLeft, Users, User, Sparkles, UsersRound, Eye, EyeOff } from 'lucide-react';
import type { UserType } from '../types/database';

interface SignupPageProps {
  onNavigate: (page: string) => void;
}

const funFacts = [
  "Palm oil has powered Nigerian kitchens, festivals, and economies for generations!",
  "From jollof to egusi, from Yoruba weddings to Igbo traditions - palm oil is our heritage!",
  "One palm tree can produce oil for 25 years - that's generational wealth!",
  "Nigerian palm oil once dominated global markets - let's bring back that glory!"
];

const favoriteDishes = [
  "Jollof Rice",
  "Egusi Soup",
  "Banga Soup",
  "Vegetable Soup",
  "Afang Soup",
  "Ofe Akwu",
  "Others"
];

const regionVibes = [
  "Lagos Hustle",
  "Delta Richness",
  "Yoruba Heritage",
  "Igbo Innovation",
  "Hausa Strength",
  "Cross River Culture",
  "Others"
];

export function SignupPage({ onNavigate }: SignupPageProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    userType: 'individual' as UserType,
    favoriteDish: '',
    regionVibe: '',
    inviteCode: ''
  });

  const nextFact = () => {
    setCurrentFactIndex((prev) => (prev + 1) % funFacts.length);
  };


  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: authData.user.id,
            user_type: formData.userType,
            favorite_dish: formData.favoriteDish || null,
            region_vibe: formData.regionVibe || null,
            display_name: formData.displayName || null,
          });

        if (profileError) throw profileError;

        createNotification(
          authData.user.id,
          'welcome',
          'Welcome to iFarmX!',
          `Welcome to iFarmX, ${formData.displayName || 'Farmer'}! Your account has been created successfully. You're now part of a growing community of smart farmers. Start by purchasing a kit, activating it, and tracking your plant growth daily. We're excited to have you on this journey!`
        );

        if (formData.inviteCode && formData.inviteCode.trim()) {
          const { data: invite, error: inviteCheckError } = await supabase
            .from('invites')
            .select('*, programs(*)')
            .eq('code', formData.inviteCode.trim())
            .eq('used', false)
            .maybeSingle();

          if (!inviteCheckError && invite) {
            await supabase
              .from('invites')
              .update({ used: true, used_by: authData.user.id })
              .eq('id', invite.id);

            await supabase
              .from('program_participants')
              .insert({
                program_id: invite.program_id,
                user_id: authData.user.id,
                status: 'active'
              });
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="font-african text-2xl font-bold text-earth-900 mb-2">
          Welcome to iFarmX!
        </h2>
        <p className="text-lg font-semibold text-kente-green mb-4">
          Grow Your Own. Feed Your Future.
        </p>
        <p className="text-earth-600 mb-4">
          Self-farming for every African home -- starting with palm oil!
        </p>

        <div className="bg-gradient-to-r from-earth-100 via-earth-50 to-earth-100 border border-earth-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <Sparkles className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <p className="text-sm text-gray-700 mx-3 flex-1">{funFacts[currentFactIndex]}</p>
            <button
              onClick={nextFact}
              className="text-green-600 hover:text-green-700 font-semibold text-sm flex-shrink-0"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="your@email.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 pr-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full px-4 py-2 pr-11 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                confirmPassword && confirmPassword !== formData.password
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
              }`}
              placeholder="••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirmPassword && confirmPassword !== formData.password && (
            <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Display Name
          </label>
          <input
            type="text"
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Your name"
          />
        </div>

        <button
          type="button"
          onClick={() => setStep(2)}
          disabled={!formData.email || !formData.password || formData.password !== confirmPassword}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          Continue
          <ArrowRight className="w-5 h-5" />
        </button>

      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <button
        onClick={() => setStep(1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Choose Your Path
        </h2>
        <p className="text-gray-600">
          How will you join the revolution?
        </p>
      </div>

      <div className="grid gap-4">
        <button
          onClick={() => {
            setFormData({ ...formData, userType: 'individual' });
            setStep(3);
          }}
          className="p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all text-left group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900 mb-2">Individual</h3>
              <p className="text-gray-600 text-sm mb-2">
                Grow your own palm like a true Naija farmer – turn your balcony, backyard or school into green gold!
              </p>
              <div className="text-2xl">🌴</div>
            </div>
          </div>
        </button>

        <button
          onClick={() => {
            setFormData({ ...formData, userType: 'family' });
            setStep(3);
          }}
          className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <UsersRound className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900 mb-2">Family/Group</h3>
              <p className="text-gray-600 text-sm mb-2">
                Farm together with family or friends! Share seeds, grow together, and build collective wealth.
              </p>
              <div className="text-2xl">👨‍👩‍👧‍👦</div>
            </div>
          </div>
        </button>

        <button
          onClick={() => {
            setFormData({ ...formData, userType: 'organization' });
            setStep(3);
          }}
          className="p-6 border-2 border-gray-200 rounded-xl hover:border-yellow-500 hover:bg-yellow-50 transition-all text-left group"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900 mb-2">Organization</h3>
              <p className="text-gray-600 text-sm mb-2">
                Lead the charge! Create programs that empower communities and make palm oil traceable across Naija.
              </p>
              <div className="text-2xl">☀️</div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <button
        onClick={() => setStep(2)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Tell Us About Yourself
        </h2>
        <p className="text-gray-600">
          Help us personalize your experience (optional)
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            What's your favorite Nigerian dish made with palm oil?
          </label>
          <select
            value={formData.favoriteDish}
            onChange={(e) => setFormData({ ...formData, favoriteDish: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Select a dish...</option>
            {favoriteDishes.map((dish) => (
              <option key={dish} value={dish}>{dish}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Which part of Naija vibes are you bringing to your farm?
          </label>
          <select
            value={formData.regionVibe}
            onChange={(e) => setFormData({ ...formData, regionVibe: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Select your vibe...</option>
            {regionVibes.map((vibe) => (
              <option key={vibe} value={vibe}>{vibe}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Organization Invite Code (optional)
          </label>
          <input
            type="text"
            value={formData.inviteCode}
            onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Enter code if you have one"
          />
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800 font-medium">
            💚 One seed today, plenty palm oil tomorrow – let's feed Naija sustainably!
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Account...' : "Join iFarmX!"}
        </button>

        <p className="text-center text-xs text-gray-600">
          You're now part of the future of traceable, proud Nigerian palm oil!
        </p>
      </div>
    </div>
  );

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
            <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4">
              <div className="absolute inset-0 bg-gradient-to-br from-kente-green via-emerald-600 to-kente-green rounded-2xl rotate-3 opacity-90" />
              <Leaf className="relative w-8 h-8 text-white" />
            </div>
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all ${
                    i === step
                      ? 'w-8 bg-green-500'
                      : i < step
                      ? 'w-2 bg-green-300'
                      : 'w-2 bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <button
                onClick={() => onNavigate('login')}
                className="text-kente-green font-semibold hover:text-emerald-700"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-earth-500">
          <p>Oil Palm Revolution Starter Kit -- Now Available. More crop kits coming soon.</p>
          <p className="mt-1 text-xs text-earth-400">100% Free Platform. Community-Driven.</p>
        </div>
      </div>
      </div>
    </div>
  );
}
