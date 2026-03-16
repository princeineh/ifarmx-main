import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sprout, Users, UsersRound,
  ArrowRight, ArrowLeft, Building2, User, CheckCircle, FlaskConical
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { UserType } from '../../types/database';
import type { LucideIcon } from 'lucide-react';

interface GuidedTourProps {
  userId: string;
  displayName: string;
  onComplete: (selectedPath: UserType) => void;
}

const pathOptions: { value: UserType; icon: LucideIcon; label: string; desc: string; color: string }[] = [
  {
    value: 'individual',
    icon: User,
    label: 'Individual Farmer',
    desc: 'Grow your own palm seedlings. Log care activities, track growth, and get personalised agronomy guidance.',
    color: 'emerald',
  },
  {
    value: 'family',
    icon: UsersRound,
    label: 'Family / Group',
    desc: 'Farm together. Create a family group, assign kits to members, and monitor everyone\u2019s progress in one place.',
    color: 'blue',
  },
  {
    value: 'organization',
    icon: Building2,
    label: 'Organisation / Sponsor',
    desc: 'Lead at scale. Create programs, onboard participants, distribute kits, and track impact with real-time reports.',
    color: 'amber',
  },
];

const colorMap: Record<string, { bg: string; border: string; text: string; iconBg: string; iconText: string }> = {
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-300 ring-2 ring-emerald-200',
    text: 'text-emerald-700',
    iconBg: 'bg-emerald-100',
    iconText: 'text-emerald-600',
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-300 ring-2 ring-blue-200',
    text: 'text-blue-700',
    iconBg: 'bg-blue-100',
    iconText: 'text-blue-600',
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-300 ring-2 ring-amber-200',
    text: 'text-amber-700',
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-600',
  },
};

export function GuidedTour({ userId, displayName, onComplete }: GuidedTourProps) {
  const [step, setStep] = useState<0 | 1>(0);
  const [direction, setDirection] = useState(1);
  const [selectedPath, setSelectedPath] = useState<UserType>('individual');
  const [saving, setSaving] = useState(false);

  const finish = async () => {
    setSaving(true);
    await supabase
      .from('user_profiles')
      .update({ user_type: selectedPath })
      .eq('id', userId);
    sessionStorage.setItem('ifarmx_spotlight', selectedPath);
    setSaving(false);
    onComplete(selectedPath);
  };

  const pathLabel = selectedPath === 'organization'
    ? 'Organisation'
    : selectedPath === 'family'
    ? 'Family / Group'
    : 'Individual';

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 100 : -100, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -100 : 100, opacity: 0 }),
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-6">
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 0 ? 'flex-[2] bg-emerald-500' : 'flex-1 bg-emerald-200'}`} />
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 1 ? 'flex-[2] bg-emerald-500' : 'flex-1 bg-gray-200'}`} />
          </div>

          <AnimatePresence mode="wait" custom={direction}>
            {step === 0 ? (
              <motion.div
                key="welcome"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Sprout className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Step 1 of 2</p>
                    <h2 className="text-xl font-bold text-gray-900 leading-tight">Welcome, {displayName}!</h2>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  iFarmX helps you grow oil palm seedlings from your very first kit to a thriving farm.
                  Let's set you up -- we'll walk you through your dashboard and show you exactly where everything is.
                </p>
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                  <p className="text-xs text-emerald-700">Choose your farming path on the next step to personalise your experience.</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="paths"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Step 2 of 2</p>
                    <h2 className="text-xl font-bold text-gray-900 leading-tight">Choose Your Farming Path</h2>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  Select the path that best describes you. We'll then walk you through your dashboard and show you where everything is.
                </p>

                <div className="space-y-3 mb-4">
                  {pathOptions.map((opt) => {
                    const isSelected = selectedPath === opt.value;
                    const colors = colorMap[opt.color];
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSelectedPath(opt.value)}
                        className={`w-full flex items-start gap-3 p-3.5 rounded-xl border transition-all text-left ${
                          isSelected
                            ? `${colors.bg} ${colors.border}`
                            : 'border-gray-100 bg-gray-50/50 hover:border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.iconBg}`}>
                          <opt.icon className={`w-4 h-4 ${colors.iconText}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-semibold ${isSelected ? colors.text : 'text-gray-900'}`}>
                              {opt.label}
                            </p>
                            {isSelected && <CheckCircle className={`w-4 h-4 ${colors.iconText}`} />}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{opt.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mx-6 mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
          <FlaskConical className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          <p className="text-[11px] text-amber-700">Test Run — all features are live to explore. Payments begin April 1.</p>
        </div>

        <div className="flex items-center justify-between p-6 pt-0">
          {step === 1 ? (
            <button
              onClick={() => { setDirection(-1); setStep(0); }}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={() => {
              if (step === 0) {
                setDirection(1);
                setStep(1);
              } else {
                finish();
              }
            }}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-md disabled:opacity-50"
          >
            {saving
              ? 'Setting up...'
              : step === 0
              ? 'Next'
              : `Continue as ${pathLabel}`}
            {!saving && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
