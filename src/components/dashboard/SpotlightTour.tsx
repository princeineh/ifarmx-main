import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Sparkles, Sprout, FlaskConical } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { LucideIcon } from 'lucide-react';

export interface SpotlightStep {
  target: string;
  title: string;
  body: string;
  icon: LucideIcon;
  iconBg: string;
}

export interface DemoOffer {
  title: string;
  body: string;
  buttonLabel: string;
  loadingText: string;
}

interface SpotlightTourProps {
  steps: SpotlightStep[];
  userId: string;
  onComplete: () => void;
  onDemoRequested?: () => Promise<void>;
  demoOffer?: DemoOffer;
  skipDbSave?: boolean;
  finishLabel?: string;
}

export function SpotlightTour({
  steps,
  userId,
  onComplete,
  onDemoRequested,
  demoOffer,
  skipDbSave,
  finishLabel,
}: SpotlightTourProps) {
  const [current, setCurrent] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<'spotlight' | 'demo_offer' | 'setting_up'>('spotlight');
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipH, setTooltipH] = useState(0);

  const step = steps[current];
  const isFirst = current === 0;
  const isLast = current === steps.length - 1;

  const updateRect = useCallback(() => {
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (el) {
      setRect(el.getBoundingClientRect());
    } else {
      setRect(null);
    }
  }, [step.target]);

  useEffect(() => {
    if (phase !== 'spotlight') return;
    setReady(false);
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      const timer = setTimeout(() => {
        updateRect();
        setReady(true);
      }, 450);
      return () => clearTimeout(timer);
    } else {
      setReady(true);
    }
  }, [current, step.target, updateRect, phase]);

  useEffect(() => {
    if (tooltipRef.current) {
      setTooltipH(tooltipRef.current.offsetHeight);
    }
  }, [current, ready]);

  useEffect(() => {
    if (phase !== 'spotlight') return;
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [updateRect, phase]);

  const finish = async () => {
    setSaving(true);
    if (!skipDbSave) {
      await supabase
        .from('user_profiles')
        .update({ tour_completed: true })
        .eq('id', userId);
    }
    sessionStorage.removeItem('ifarmx_spotlight');
    setSaving(false);
    onComplete();
  };

  const next = () => {
    if (isLast) {
      if (onDemoRequested && demoOffer) {
        setPhase('demo_offer');
      } else {
        finish();
      }
      return;
    }
    setCurrent((c) => c + 1);
  };

  const prev = () => setCurrent((c) => c - 1);

  const handleSetupDemo = async () => {
    setPhase('setting_up');
    if (onDemoRequested) {
      await onDemoRequested();
    }
  };

  if (phase === 'demo_offer' && demoOffer) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="p-6 sm:p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{demoOffer.title}</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-6">{demoOffer.body}</p>
            <div className="space-y-3">
              <button
                onClick={handleSetupDemo}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-md"
              >
                <Sparkles className="w-4 h-4" />
                {demoOffer.buttonLabel}
              </button>
              <button
                onClick={finish}
                disabled={saving}
                className="w-full py-2.5 text-gray-500 hover:text-gray-700 font-medium text-sm transition-colors disabled:opacity-50"
              >
                {saving ? 'Finishing...' : "I'll explore on my own"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (phase === 'setting_up') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-5 stage-pulse">
            <Sprout className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            {demoOffer?.loadingText || 'Setting up your demo...'}
          </h3>
          <p className="text-white/70 text-sm">Preparing your dashboard</p>
        </motion.div>
      </div>
    );
  }

  const viewH = window.innerHeight;
  const viewW = window.innerWidth;
  const tooltipW = Math.min(380, viewW - 32);
  const pad = 10;

  const spotTop = rect ? rect.top - pad : 0;
  const spotLeft = rect ? rect.left - pad : 0;
  const spotW = rect ? rect.width + pad * 2 : 0;
  const spotH = rect ? rect.height + pad * 2 : 0;

  let tTop = 0;
  let tLeft = 0;
  let placement: 'below' | 'above' = 'below';

  if (rect) {
    const spaceBelow = viewH - rect.bottom - pad;
    const spaceAbove = rect.top - pad;
    const estH = tooltipH || 220;

    if (spaceBelow >= estH + 20 || spaceBelow > spaceAbove) {
      tTop = rect.bottom + pad + 14;
      placement = 'below';
    } else {
      tTop = rect.top - pad - estH - 14;
      placement = 'above';
    }

    tLeft = rect.left + rect.width / 2 - tooltipW / 2;
    tLeft = Math.max(16, Math.min(tLeft, viewW - tooltipW - 16));
    tTop = Math.max(16, Math.min(tTop, viewH - (estH + 20)));
  } else {
    tTop = viewH / 2 - 110;
    tLeft = (viewW - tooltipW) / 2;
  }

  const arrowLeft = rect
    ? Math.min(Math.max(24, rect.left + rect.width / 2 - tLeft), tooltipW - 24)
    : tooltipW / 2;

  const lastBtnLabel = saving
    ? 'Finishing...'
    : isLast
    ? onDemoRequested
      ? 'Continue'
      : finishLabel || 'Start Using iFarmX'
    : 'Next';

  return (
    <div className="fixed inset-0 z-[100]" style={{ pointerEvents: 'none' }}>
      {rect && ready ? (
        <>
          <motion.div
            className="fixed rounded-xl"
            initial={false}
            animate={{
              top: spotTop,
              left: spotLeft,
              width: spotW,
              height: spotH,
            }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            style={{
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.7)',
              pointerEvents: 'none',
            }}
          />
          <motion.div
            className="fixed rounded-xl"
            initial={false}
            animate={{
              top: spotTop - 3,
              left: spotLeft - 3,
              width: spotW + 6,
              height: spotH + 6,
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              top: { duration: 0.45, ease: [0.4, 0, 0.2, 1] },
              left: { duration: 0.45, ease: [0.4, 0, 0.2, 1] },
              width: { duration: 0.45, ease: [0.4, 0, 0.2, 1] },
              height: { duration: 0.45, ease: [0.4, 0, 0.2, 1] },
              opacity: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
            }}
            style={{
              border: '2px solid rgb(52, 211, 153)',
              borderRadius: '0.75rem',
              pointerEvents: 'none',
            }}
          />
        </>
      ) : (
        <div className="fixed inset-0 bg-black/70" style={{ pointerEvents: 'none' }} />
      )}

      <div
        className="fixed inset-0"
        style={{ pointerEvents: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      />

      <AnimatePresence mode="wait">
        {ready && (
          <motion.div
            key={current}
            ref={tooltipRef}
            initial={{ opacity: 0, y: placement === 'below' ? 12 : -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed bg-white rounded-2xl shadow-2xl overflow-visible"
            style={{
              top: tTop,
              left: tLeft,
              width: tooltipW,
              pointerEvents: 'auto',
              zIndex: 101,
            }}
          >
            {rect && placement === 'below' && (
              <div
                className="absolute -top-[6px] w-3 h-3 bg-white rotate-45 shadow-[-2px_-2px_4px_rgba(0,0,0,0.06)]"
                style={{ left: arrowLeft }}
              />
            )}
            {rect && placement === 'above' && (
              <div
                className="absolute -bottom-[6px] w-3 h-3 bg-white rotate-45 shadow-[2px_2px_4px_rgba(0,0,0,0.06)]"
                style={{ left: arrowLeft }}
              />
            )}

            <div className="p-5 pb-3">
              <div className="flex items-center gap-1.5 mb-4">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === current
                        ? 'flex-[2] bg-emerald-500'
                        : i < current
                        ? 'flex-1 bg-emerald-200'
                        : 'flex-1 bg-gray-200'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.iconBg} flex items-center justify-center flex-shrink-0 shadow-md`}
                  >
                    <step.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Step {current + 1} of {steps.length}
                    </p>
                    <h3 className="text-base font-bold text-gray-900 leading-tight">{step.title}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 border border-amber-200 flex-shrink-0">
                  <FlaskConical className="w-3 h-3 text-amber-500" />
                  <span className="text-[9px] font-bold text-amber-600 whitespace-nowrap">Test Run</span>
                </div>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed">{step.body}</p>
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
              {!isFirst ? (
                <button
                  onClick={prev}
                  className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-3">
                {!isLast && (
                  <button
                    onClick={finish}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Skip
                  </button>
                )}
                <button
                  onClick={next}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-sm disabled:opacity-50"
                >
                  {lastBtnLabel}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
