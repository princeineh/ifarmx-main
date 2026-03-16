import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, Sprout, Heart, Building2 } from 'lucide-react';

interface CTASectionProps {
  onGetStarted: () => void;
  onInstitutional?: () => void;
}

export function CTASection({ onGetStarted, onInstitutional }: CTASectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f2518] via-[#0c2014] to-[#0a1a0e]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(46,125,50,0.06),transparent_70%)]" />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-grove-500/[0.04] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-warmth-500/[0.06] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-grove-500/[0.08] pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-warmth-500/30 bg-warmth-500/10 text-warmth-300 text-xs font-semibold mb-8">
            <Heart className="w-3.5 h-3.5" />
            Nurture Your Growth
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] mb-4">
            Your Farming Journey{' '}
            <span className="font-serif-display italic bg-gradient-to-r from-grove-300 via-warmth-300 to-grove-300 bg-clip-text text-transparent">
              Starts Here
            </span>
          </h2>

          <p className="text-base sm:text-lg text-gray-400 mb-10 max-w-xl mx-auto leading-relaxed">
            Real seeds. Real tracking. Real agriculture.
            Join a community that believes in patience, persistence, and the power of growing something with your own hands.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <button
              onClick={onGetStarted}
              className="landing-cta-btn group relative inline-flex items-center gap-3 px-8 py-5 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-grove-600 to-grove-500 hover:shadow-[0_0_60px_rgba(46,125,50,0.3)] transition-all duration-500 overflow-hidden neon-pulse-box border border-grove-400/20"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Sprout className="w-5 h-5" />
                Begin Your Journey
              </span>
              <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-r from-grove-500 to-grove-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </button>

            <button
              onClick={onInstitutional || onGetStarted}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-warmth-300 border border-warmth-500/30 hover:bg-warmth-500/10 hover:border-warmth-400/50 transition-all duration-300"
            >
              <Building2 className="w-5 h-5" />
              Institutional Access
            </button>
          </div>

          <div className="mt-16 p-5 rounded-xl glass-morphism max-w-lg mx-auto">
            <p className="text-xs text-gray-500 leading-relaxed">
              <strong className="text-gray-400">Disclaimer:</strong> iFarmX is not an investment scheme,
              crowdfunding platform, or passive income opportunity. You are purchasing a physical farming
              kit and gaining access to an agricultural technology platform. All farming outcomes depend
              on your effort, conditions, and adherence to recommended practices. Results are not guaranteed.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
