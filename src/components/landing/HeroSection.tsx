import { motion } from 'framer-motion';
import {
  Leaf, ChevronDown, Heart, Award, Shield, BarChart3,
  Sprout, FileCheck, TrendingUp, Building2
} from 'lucide-react';
import { ParticleCanvas } from './ParticleCanvas';

interface HeroSectionProps {
  onGetStarted: () => void;
  onInstitutional?: () => void;
}

const keyBenefits = [
  {
    icon: Leaf,
    text: 'Own and nurture your farming journey from anywhere — balcony, backyard, or field',
  },
  {
    icon: BarChart3,
    text: 'Full traceability & reports: One-touch logs, real-time health analytics, audit-ready documentation',
  },
  {
    icon: FileCheck,
    text: 'Legal & verification safety: Transparent agreements and verification records',
  },
  {
    icon: TrendingUp,
    text: 'Stats-based ecosystem: Select partners based on performance, not promises',
  },
  {
    icon: Heart,
    text: 'Start with Palm Oil — Fishery, Poultry, Cash Crops coming. Grow at your own pace.',
  },
];

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.4 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export function HeroSection({ onGetStarted, onInstitutional }: HeroSectionProps) {
  const scrollToKit = () => {
    document.getElementById('kit')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#071208] via-[#0c2014] to-[#0f2318]" />
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_15%_45%,rgba(46,125,50,0.15),transparent_55%),radial-gradient(ellipse_at_85%_25%,rgba(212,160,60,0.10),transparent_50%),radial-gradient(ellipse_at_50%_85%,rgba(46,125,50,0.08),transparent_45%)]" />
      <ParticleCanvas />
      <div className="absolute inset-0 landing-grid-bg opacity-30 pointer-events-none" />

      {/* Organic floating shapes */}
      <div className="absolute top-[15%] right-[5%] w-24 h-32 border border-grove-500/10 rounded-[40%] rotate-12 float-holo pointer-events-none hidden sm:block" />
      <div className="absolute top-[60%] right-[15%] w-16 h-16 border border-warmth-500/10 rounded-full float-holo-alt pointer-events-none hidden sm:block" />
      <div className="absolute top-[40%] left-[3%] w-20 h-20 border border-grove-500/[0.08] rounded-[30%] -rotate-6 float-holo-alt pointer-events-none hidden sm:block" style={{ animationDelay: '2s' }} />

      {/* Warm ambient glows */}
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-grove-500/[0.05] blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-warmth-500/[0.05] blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-20 sm:pt-36 sm:pb-28">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="max-w-4xl"
        >
          <motion.div variants={fadeUp} className="mb-6 flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-grove-500/30 bg-grove-500/10 text-grove-300 text-xs font-bold tracking-wide uppercase">
              <Award className="w-3 h-3" />
              NIFOR EWS Seeds
            </span>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-warmth-500/30 bg-warmth-500/10 text-warmth-300 text-xs font-bold tracking-wide uppercase">
              <Shield className="w-3 h-3" />
              Structured Monitoring
            </span>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-soul-500/30 bg-soul-500/10 text-soul-300 text-xs font-bold tracking-wide uppercase">
              <Heart className="w-3 h-3" />
              Grow With Care
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-5 tracking-tight"
          >
            Plant With Patience.
            <br />
            <span className="font-serif-display italic bg-gradient-to-r from-grove-300 via-warmth-300 to-grove-300 bg-clip-text text-transparent">
              Grow With Love.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg sm:text-xl text-gray-300 max-w-2xl mb-3 leading-relaxed font-medium"
          >
            Africa's structured self-farming platform — where every seedling you nurture is an act of persistence, ownership, and self-care.
          </motion.p>

          <motion.p
            variants={fadeUp}
            className="text-sm sm:text-base text-gray-400 max-w-2xl mb-6 leading-relaxed"
          >
            Built from real farming experience. Start with Palm Oil.
            Monitor. Document. Grow at your own pace{' \u2014 '}because real growth takes time.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 mb-4">
            <button
              onClick={onGetStarted}
              className="landing-cta-btn group relative px-8 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-grove-600 to-grove-500 hover:shadow-[0_0_50px_rgba(46,125,50,0.3)] transition-all duration-300 overflow-hidden neon-pulse-box border border-grove-400/20"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Sprout className="w-5 h-5" />
                Begin Your Journey
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-grove-500 to-grove-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>

            <button
              onClick={onInstitutional || onGetStarted}
              className="px-8 py-4 rounded-xl text-base font-semibold text-warmth-300 border border-warmth-500/30 hover:bg-warmth-500/10 hover:border-warmth-400/50 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Building2 className="w-5 h-5" />
              Institutional Access
            </button>
          </motion.div>

          <motion.p
            variants={fadeUp}
            className="text-xs text-gray-500 max-w-xl mb-10 leading-relaxed"
          >
            Nationwide delivery 5{'\u2013'}7 working days after confirmed payment (shipping fees apply, calculated at checkout).
          </motion.p>

          <motion.div
            variants={stagger}
            className="space-y-2.5 mb-8"
          >
            {keyBenefits.map((point) => (
              <motion.div
                key={point.text}
                variants={fadeUp}
                className="flex items-center gap-3 group"
              >
                <div className="w-8 h-8 rounded-lg bg-grove-500/10 flex items-center justify-center flex-shrink-0 border border-grove-500/10">
                  <point.icon className="w-4 h-4 text-grove-300" />
                </div>
                <p className="text-sm text-gray-400 leading-snug">{point.text}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.p
            variants={fadeUp}
            className="text-xs text-gray-600 max-w-lg leading-relaxed italic"
          >
            Designed for long-term biological growth cycles {'\u2014'} not instant returns. Patience is the seed of every harvest.
          </motion.p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <button onClick={scrollToKit} className="text-gray-600 hover:text-grove-400 transition-colors animate-bounce">
          <ChevronDown className="w-6 h-6" />
        </button>
      </motion.div>
    </section>
  );
}
