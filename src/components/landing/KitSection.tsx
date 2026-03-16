import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  Sprout, Package, Mountain, ShoppingBag,
  Hand, BookOpen, FileText, BookMarked, SprayCan,
  Check, Award, ArrowRight, Timer, Users
} from 'lucide-react';

interface KitSectionProps {
  onGetStarted: () => void;
}

const kitContents = [
  { icon: Sprout, name: '3 Tenera Sprouted Seeds (NIFOR EWS)', desc: 'Premium high-yield certified hybrids' },
  { icon: Package, name: 'Organic Manure', desc: 'Nutrient boost for strong root development' },
  { icon: Mountain, name: 'Refined Sand', desc: 'Optimal drainage for healthy germination' },
  { icon: ShoppingBag, name: '3 Grower Bags', desc: 'Individual bags for each seedling' },
  { icon: Hand, name: 'Disposable Gloves', desc: 'Safe and hygienic handling' },
  { icon: BookOpen, name: 'NIFOR Reference Book', desc: 'Official oil palm cultivation guide' },
  { icon: FileText, name: 'Quick Start Pamphlet', desc: 'First-day planting instructions' },
  { icon: BookMarked, name: 'iFarmX Manual', desc: 'Step-by-step guide and app setup' },
  { icon: SprayCan, name: 'Water Sprayer', desc: 'Precise and consistent watering' },
];

const benefits = [
  'NIFOR-certified premium quality seeds with proven genetics',
  'Unlocks full platform: in-app agronomy guidance (24/7 chat), activity logs, growth timeline',
  'Farm anywhere for the first 6 months: balcony, backyard, small plot',
  'Shareable for family or group farming through the app',
  'Complete growth tracking from germination to transplant-ready',
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.2 } },
};

export function KitSection({ onGetStarted }: KitSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="kit" className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c2014] via-[#0a1c12] to-[#0f2518]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-grove-500/30 to-transparent" />
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] rounded-full bg-grove-500/[0.04] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[350px] h-[350px] rounded-full bg-warmth-500/[0.04] blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <span className="text-grove-300 text-sm font-semibold uppercase tracking-widest mb-3 block">
            Everything You Need
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
            Oil Palm Launch Kit{' \u2013 '}
            <span className="bg-gradient-to-r from-warmth-300 to-warmth-400 bg-clip-text text-transparent">
              {'\u20A6'}24,999
            </span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-base">
            1 Person Per Kit {'\u2013'} Dedicated Monitoring & Growth.
            <br className="hidden sm:block" />
            Families: Buy One Per Person for Group Dashboard.
            <br className="hidden sm:block" />
            <span className="text-gray-500">Batch-Limited Pre-Order. Includes free access to the iFarmX monitoring platform.</span>
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative rounded-2xl overflow-hidden border border-white/[0.06]"
          >
            <div className="relative aspect-[4/3] bg-gradient-to-br from-[#0c2014] to-[#0a1c12]">
              <img
                src="/make_this_background_same_as_the_website_(1).jpeg"
                alt="Oil Palm Launch Kit"
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1a0e] via-transparent to-transparent" />

              <div className="absolute top-4 left-4 flex gap-2">
                <span className="px-3 py-1 rounded-full bg-grove-400/90 text-[#0a1a0e] text-xs font-bold">
                  NIFOR Certified
                </span>
                <span className="px-3 py-1 rounded-full bg-warmth-500/90 text-[#0a1a0e] text-xs font-bold flex items-center gap-1">
                  <Timer className="w-3 h-3" />
                  Limited Batch
                </span>
              </div>

              <div className="absolute bottom-4 left-4 right-4">
                <div className="glass-morphism rounded-xl p-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Price per kit</p>
                      <p className="text-3xl font-black text-white">
                        {'\u20A6'}24,999
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Users className="w-3 h-3 text-warmth-300" />
                        <p className="text-xs text-warmth-300 font-semibold">1 kit per person</p>
                      </div>
                      <p className="text-xs text-grove-300 font-semibold">Nationwide delivery</p>
                      <p className="text-xs text-gray-500">5{'\u2013'}7 working days (fees apply)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 bg-white/[0.02]">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-grove-300" />
                What This Kit Unlocks
              </h3>
              <div className="space-y-2">
                {benefits.map((b) => (
                  <div key={b} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-grove-300 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-gray-400">{b}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <div>
            <motion.div
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              variants={stagger}
              className="mb-8"
            >
              <motion.h3 variants={fadeUp} className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <Package className="w-5 h-5 text-warmth-400" />
                What{'\u2019'}s Inside Your Kit
              </motion.h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {kitContents.map((item) => (
                  <motion.div
                    key={item.name}
                    variants={fadeUp}
                    className="flex items-start gap-3 p-3.5 rounded-xl glass-morphism transition-all duration-300 group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-grove-500/10 border border-grove-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-grove-500/20 group-hover:border-grove-500/20 transition-colors">
                      <item.icon className="w-4 h-4 text-grove-300" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white leading-tight">{item.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <div className="mb-4">
                <span className="inline-block px-3 py-1.5 rounded-full bg-warmth-500/20 border border-warmth-500/30 text-warmth-300 text-xs font-bold">
                  Limited kits available {' \u2013 '} start your journey today
                </span>
              </div>

              <button
                onClick={onGetStarted}
                className="landing-cta-btn group w-full relative px-8 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-grove-600 to-grove-500 hover:shadow-[0_0_50px_rgba(46,125,50,0.25)] transition-all duration-300 overflow-hidden neon-pulse-box flex items-center justify-center gap-2 border border-grove-400/20"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Begin Your Journey
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-grove-500 to-grove-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>

              <p className="text-xs text-gray-600 text-center mt-3">
                Nationwide delivery within 5{' \u2013 '}7 working days after payment.
              </p>

              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-600">
                <span className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-grove-400/50" />
                  NIFOR Certified
                </span>
                <span className="w-px h-3 bg-gray-700" />
                <span className="flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-grove-400/50" />
                  5{'\u2013'}7 Days Delivery
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
