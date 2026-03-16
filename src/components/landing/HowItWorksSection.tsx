import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Package, Smartphone, Sprout, BarChart3 } from 'lucide-react';

const steps = [
  {
    num: '01',
    icon: Package,
    title: 'Get a Starter Kit',
    desc: 'Reserve now, receive in 5\u20137 working days after April 1 payment (shipping fees apply).',
  },
  {
    num: '02',
    icon: Smartphone,
    title: 'Track & Care Through the App',
    desc: 'One-touch logs, automatic reminders, guidance tools, reports.',
  },
  {
    num: '03',
    icon: Sprout,
    title: 'Verified Transplant',
    desc: 'After ~6 months (subject to plant health): Verified transplant to field via structured land lease or marketplace options.',
  },
  {
    num: '04',
    icon: BarChart3,
    title: 'Trade & Institutional Unlock',
    desc: 'Aggregate, report, monetize.',
  },
];

const stepVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: 'easeOut', delay: i * 0.15 },
  }),
};

export function HowItWorksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section id="how-it-works" className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1810] via-[#0c2014] to-[#0f2518]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-warmth-500/20 to-transparent" />
      <div className="absolute top-1/3 right-0 w-[400px] h-[400px] rounded-full bg-grove-500/[0.04] blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="text-warmth-400 text-sm font-semibold uppercase tracking-widest mb-3 block">
            Your Journey
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
            4 Steps to{' '}
            <span className="font-serif-display italic bg-gradient-to-r from-grove-300 to-warmth-300 bg-clip-text text-transparent">
              Your Farm
            </span>
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto text-base">
            From kit to harvest. No farming experience needed {'\u2013'} iFarmX guides you every step of the way.
          </p>
        </motion.div>

        <div className="relative">
          <div className="absolute left-[23px] sm:left-[27px] top-0 bottom-0 w-px bg-gradient-to-b from-grove-400/40 via-warmth-500/20 to-transparent hidden sm:block" />

          <div className="space-y-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                custom={i}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
                variants={stepVariants}
                className="group relative flex items-start gap-5 sm:gap-8"
              >
                <div className="relative z-10 flex-shrink-0">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl glass-morphism border-grove-500/20 flex items-center justify-center group-hover:border-grove-500/40 group-hover:bg-grove-500/10 transition-all duration-500">
                    <step.icon className="w-5 h-5 sm:w-6 sm:h-6 text-grove-300" />
                  </div>
                </div>

                <div className="flex-1 pb-6 sm:pb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-mono text-warmth-400/60 tracking-wider">{step.num}</span>
                    <h3 className="text-lg sm:text-xl font-bold text-white">{step.title}</h3>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-lg">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
