import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import {
  Sprout, ArrowLeft, ArrowRight, Loader2, AlertCircle,
  Shield, Package, Phone, Mail, User, Check, MapPin, ChevronDown,
  FlaskConical, CalendarClock, UsersRound, Building2, Minus, Plus
} from 'lucide-react';
import { NIGERIAN_STATES } from '../data/nigerianStates';

interface ReservationPageProps {
  onNavigate: (page: string) => void;
  onReserved: (email: string) => void;
}

const futureKits = [
  { id: 'fishery', label: 'Fishery' },
  { id: 'poultry', label: 'Poultry' },
  { id: 'cash_crops', label: 'Cash Crops (Cocoa, Cassava, Rice)' },
];

const countryCodes = [
  { code: '+234', country: 'Nigeria', flag: 'NG' },
  { code: '+233', country: 'Ghana', flag: 'GH' },
  { code: '+254', country: 'Kenya', flag: 'KE' },
  { code: '+27', country: 'South Africa', flag: 'ZA' },
  { code: '+255', country: 'Tanzania', flag: 'TZ' },
  { code: '+256', country: 'Uganda', flag: 'UG' },
  { code: '+237', country: 'Cameroon', flag: 'CM' },
  { code: '+225', country: 'Ivory Coast', flag: 'CI' },
  { code: '+221', country: 'Senegal', flag: 'SN' },
  { code: '+251', country: 'Ethiopia', flag: 'ET' },
  { code: '+44', country: 'United Kingdom', flag: 'GB' },
  { code: '+1', country: 'United States', flag: 'US' },
  { code: '+971', country: 'UAE', flag: 'AE' },
  { code: '+966', country: 'Saudi Arabia', flag: 'SA' },
  { code: '+49', country: 'Germany', flag: 'DE' },
  { code: '+33', country: 'France', flag: 'FR' },
  { code: '+39', country: 'Italy', flag: 'IT' },
  { code: '+86', country: 'China', flag: 'CN' },
  { code: '+91', country: 'India', flag: 'IN' },
  { code: '+61', country: 'Australia', flag: 'AU' },
];

const countries = [
  'Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Tanzania', 'Uganda', 'Cameroon',
  'Ivory Coast', 'Senegal', 'Ethiopia', 'United Kingdom', 'United States', 'UAE',
  'Saudi Arabia', 'Germany', 'France', 'Italy', 'China', 'India', 'Australia', 'Other',
];

type JoinAs = 'individual' | 'family' | 'organisation';

const joinAsTiers: { value: JoinAs; label: string; desc: string; icon: React.ElementType; defaultSlots: number }[] = [
  {
    value: 'individual',
    label: 'Individual',
    desc: 'Grow your own farm',
    icon: User,
    defaultSlots: 1,
  },
  {
    value: 'family',
    label: 'Family / Group',
    desc: 'Farm together',
    icon: UsersRound,
    defaultSlots: 2,
  },
  {
    value: 'organisation',
    label: 'Organisation',
    desc: 'Lead at scale',
    icon: Building2,
    defaultSlots: 5,
  },
];

const KIT_PRICE = 24999;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function ReservationPage({ onNavigate, onReserved }: ReservationPageProps) {
  const [form, setForm] = useState({
    fullName: '',
    countryCode: '+234',
    phone: '',
    email: '',
    country: 'Nigeria',
    state: '',
    reservationType: 'test_run' as 'test_run' | 'reserve',
    futureInterests: [] as string[],
    joinAs: 'individual' as JoinAs,
    slots: 1,
  });
  const [detectingLocation, setDetectingLocation] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculatedAmount = form.reservationType === 'reserve' ? form.slots * KIT_PRICE : 0;

  useEffect(() => {
    const detectCountry = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) });
        if (res.ok) {
          const data = await res.json();
          const countryName = data.country_name || '';
          const matchedCountry = countries.find(c => c.toLowerCase() === countryName.toLowerCase());
          const matchedCode = countryCodes.find(c => c.country.toLowerCase() === countryName.toLowerCase());
          if (matchedCountry) {
            setForm(prev => ({
              ...prev,
              country: matchedCountry,
              countryCode: matchedCode?.code || prev.countryCode,
              state: data.region || '',
            }));
          }
        }
      } catch {
      } finally {
        setDetectingLocation(false);
      }
    };
    detectCountry();
  }, []);

  const toggleInterest = (id: string) => {
    setForm(prev => ({
      ...prev,
      futureInterests: prev.futureInterests.includes(id)
        ? prev.futureInterests.filter(i => i !== id)
        : [...prev.futureInterests, id],
    }));
  };

  const setJoinAs = (tier: JoinAs) => {
    const t = joinAsTiers.find(x => x.value === tier)!;
    setForm(prev => ({ ...prev, joinAs: tier, slots: t.defaultSlots }));
  };

  const adjustSlots = (delta: number) => {
    setForm(prev => ({ ...prev, slots: Math.max(1, prev.slots + delta) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const email = form.email.trim().toLowerCase();
      const password = crypto.randomUUID().replace(/-/g, '').slice(0, 16) + 'Ax1!';

      const reserveUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reserve-spot`;
      const res = await fetch(reserveUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          fullName: form.fullName.trim(),
          phone: `${form.countryCode}${form.phone.trim().replace(/^0+/, '')}`,
          country: form.country,
          state: form.state,
          kitCount: String(form.slots),
          reservationType: form.reservationType,
          futureInterests: form.futureInterests,
          joinAs: form.joinAs,
          slots: form.slots,
          calculatedAmount,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        if (result.error === 'already_registered') {
          throw new Error('This email is already registered. Please log in instead.');
        }
        throw new Error(result.error || 'Something went wrong. Please try again.');
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

      if (loginError) {
        throw new Error('Account created but could not sign in. Please try again.');
      }

      try {
        const confirmUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reservation-confirmation`;
        await fetch(confirmUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            name: form.fullName.trim(),
            joinAs: form.joinAs,
            slots: form.slots,
            calculatedAmount,
            reservationType: form.reservationType,
          }),
        });
      } catch {
        // email send failure is non-critical
      }

      onReserved(form.email.trim().toLowerCase());
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#020805] via-[#071a10] to-[#0a1a12] landing-page">
      <div className="absolute inset-0 landing-grid-bg opacity-20 pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.03] blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-cyan-500/[0.03] blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-lg mx-auto px-4 pt-8 pb-20">
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2 text-gray-500 hover:text-[#00FF9F] transition-colors mb-8 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
        >
          <motion.div variants={fadeUp} className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00FF9F] to-cyan-400 flex items-center justify-center shadow-lg shadow-[#00FF9F]/20">
              <Sprout className="w-6 h-6 text-[#040a07]" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              iFarm<span className="text-[#00FF9F]">X</span>
            </span>
          </motion.div>

          <motion.div variants={fadeUp} className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 mb-4">
              <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-amber-400 tracking-wide">Test Run Phase — Launching April 1</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">
              Join the{' '}
              <span className="bg-gradient-to-r from-[#00FF9F] to-cyan-400 bg-clip-text text-transparent">
                Revolution
              </span>
            </h1>
            <p className="text-gray-400 text-base mb-3 leading-relaxed">
              Explore every feature now and secure your place in the first 125 Oil Palm Launch Kits before April 1.
            </p>
            <p className="text-sm text-gray-500 leading-relaxed">
              No payment required today. We'll create your account instantly and walk you through the platform.
            </p>
          </motion.div>

          {error && (
            <motion.div variants={fadeUp} className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
              {error.includes('already registered') && (
                <button
                  onClick={() => onNavigate('login')}
                  className="mt-3 text-sm text-[#00FF9F] font-semibold hover:underline"
                >
                  Go to Login
                </button>
              )}
            </motion.div>
          )}

          <motion.form variants={fadeUp} onSubmit={handleSubmit} className="space-y-5">

            {/* Join As — 3-tier selector */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                I am joining as
              </label>
              <div className="grid grid-cols-3 gap-2">
                {joinAsTiers.map((tier) => {
                  const Icon = tier.icon;
                  const active = form.joinAs === tier.value;
                  return (
                    <button
                      key={tier.value}
                      type="button"
                      onClick={() => setJoinAs(tier.value)}
                      className={`flex flex-col items-center gap-1.5 py-3.5 px-2 rounded-xl border transition-all ${
                        active
                          ? 'bg-[#00FF9F]/10 border-[#00FF9F]/40 text-[#00FF9F]'
                          : 'bg-white/[0.03] border-white/[0.06] text-gray-500 hover:border-white/[0.12]'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${active ? 'text-[#00FF9F]' : 'text-gray-600'}`} />
                      <span className="text-xs font-semibold leading-tight text-center">{tier.label}</span>
                      <span className="text-[10px] text-center leading-tight opacity-60">{tier.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Full Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#00FF9F]/40 focus:border-[#00FF9F]/40 transition-all"
                  placeholder="Your full name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                WhatsApp / Phone <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-shrink-0">
                  <select
                    value={form.countryCode}
                    onChange={(e) => setForm({ ...form, countryCode: e.target.value })}
                    className="appearance-none w-[100px] pl-3 pr-7 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00FF9F]/40 focus:border-[#00FF9F]/40 transition-all"
                  >
                    {countryCodes.map((cc) => (
                      <option key={cc.code} value={cc.code} className="bg-gray-900 text-white">
                        {cc.code} {cc.flag}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                </div>
                <div className="relative flex-1">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#00FF9F]/40 focus:border-[#00FF9F]/40 transition-all"
                    placeholder="8012345678"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Email <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#00FF9F]/40 focus:border-[#00FF9F]/40 transition-all"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Country <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <select
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value, state: '' })}
                    className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#00FF9F]/40 focus:border-[#00FF9F]/40 transition-all"
                    required
                  >
                    {countries.map((c) => (
                      <option key={c} value={c} className="bg-gray-900 text-white">{c}</option>
                    ))}
                  </select>
                  {detectingLocation && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#00FF9F] animate-spin" />
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  State / Region
                </label>
                {form.country === 'Nigeria' ? (
                  <select
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#00FF9F]/40 focus:border-[#00FF9F]/40 transition-all"
                  >
                    <option value="" className="bg-gray-900 text-white">Select state</option>
                    {NIGERIAN_STATES.map((s) => (
                      <option key={s} value={s} className="bg-gray-900 text-white">{s}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#00FF9F]/40 focus:border-[#00FF9F]/40 transition-all"
                    placeholder="Your state or region"
                  />
                )}
              </div>
            </div>

            {/* Reserve a Spot toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Would you like to reserve kit slots?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, reservationType: 'test_run' })}
                  className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl border transition-all ${
                    form.reservationType === 'test_run'
                      ? 'bg-[#00FF9F]/10 border-[#00FF9F]/40 text-[#00FF9F]'
                      : 'bg-white/[0.03] border-white/[0.06] text-gray-500 hover:border-white/[0.12]'
                  }`}
                >
                  <FlaskConical className={`w-5 h-5 ${form.reservationType === 'test_run' ? 'text-[#00FF9F]' : 'text-gray-600'}`} />
                  <span className="text-sm font-semibold">Test Run Only</span>
                  <span className="text-[10px] text-center leading-tight opacity-70">Explore free, decide later</span>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, reservationType: 'reserve' })}
                  className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl border transition-all ${
                    form.reservationType === 'reserve'
                      ? 'bg-[#00FF9F]/10 border-[#00FF9F]/40 text-[#00FF9F]'
                      : 'bg-white/[0.03] border-white/[0.06] text-gray-500 hover:border-white/[0.12]'
                  }`}
                >
                  <CalendarClock className={`w-5 h-5 ${form.reservationType === 'reserve' ? 'text-[#00FF9F]' : 'text-gray-600'}`} />
                  <span className="text-sm font-semibold">Reserve a Spot</span>
                  <span className="text-[10px] text-center leading-tight opacity-70">Secure Batch 1 kit(s)</span>
                </button>
              </div>
            </div>

            {/* Slot calculator — shown only when reserving */}
            {form.reservationType === 'reserve' && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="rounded-xl border border-[#00FF9F]/20 bg-white/[0.03] p-4 space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-3">
                    Number of kit slots
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => adjustSlots(-1)}
                      className="w-10 h-10 rounded-lg bg-white/[0.06] border border-white/[0.10] text-gray-300 hover:bg-white/[0.10] flex items-center justify-center transition-all"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={form.slots}
                      onChange={(e) => setForm({ ...form, slots: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-20 text-center py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-[#00FF9F]/40 focus:border-[#00FF9F]/40 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => adjustSlots(1)}
                      className="w-10 h-10 rounded-lg bg-white/[0.06] border border-white/[0.10] text-gray-300 hover:bg-white/[0.10] flex items-center justify-center transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-500">kit{form.slots !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{form.slots} kit{form.slots !== 1 ? 's' : ''} × ₦24,999</span>
                    <span className="text-white font-semibold">₦{(calculatedAmount).toLocaleString('en-NG')}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-gray-500">Calculated at delivery</span>
                  </div>
                  <div className="pt-2 border-t border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <CalendarClock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <p className="text-[11px] text-amber-400/90 font-medium">No payment today — amount due April 1, 2025</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {form.reservationType === 'test_run' && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <FlaskConical className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <p className="text-[11px] text-amber-400/80">Explore free until April 1 &mdash; you can reserve kits anytime before then</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Interested in future kits? <span className="text-gray-600">(optional)</span>
              </label>
              <div className="space-y-2">
                {futureKits.map((kit) => (
                  <button
                    key={kit.id}
                    type="button"
                    onClick={() => toggleInterest(kit.id)}
                    className={`flex items-center gap-3 w-full p-3 rounded-xl border transition-all text-left ${
                      form.futureInterests.includes(kit.id)
                        ? 'bg-[#00FF9F]/10 border-[#00FF9F]/30 text-[#00FF9F]'
                        : 'bg-white/[0.02] border-white/[0.06] text-gray-500 hover:border-white/[0.12]'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 ${
                      form.futureInterests.includes(kit.id)
                        ? 'bg-[#00FF9F] border-[#00FF9F]'
                        : 'border-white/20'
                    }`}>
                      {form.futureInterests.includes(kit.id) && (
                        <Check className="w-3 h-3 text-[#040a07]" />
                      )}
                    </div>
                    <span className="text-sm">{kit.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !form.fullName || !form.phone || !form.email}
              className="landing-cta-btn group w-full relative px-8 py-4 rounded-xl text-base font-bold text-[#040a07] bg-gradient-to-r from-[#00FF9F] to-cyan-400 hover:shadow-[0_0_50px_rgba(0,255,159,0.3)] transition-all duration-300 overflow-hidden neon-pulse-box disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating your account...
                  </>
                ) : (
                  <>
                    {form.reservationType === 'reserve' ? 'Reserve My Spot' : 'Join the Test Run'}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-[#00FF9F] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>

            <div className="flex items-center justify-center gap-5 pt-2 text-xs text-gray-600">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-[#00FF9F]/40" />
                No payment yet
              </span>
              <span className="flex items-center gap-1.5">
                <Package className="w-3 h-3 text-[#00FF9F]/40" />
                125 kits only
              </span>
            </div>

            <p className="text-center text-xs text-gray-600 pt-2">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="text-[#00FF9F] font-semibold hover:underline"
              >
                Log in
              </button>
            </p>
          </motion.form>
        </motion.div>
      </div>
    </div>
  );
}
