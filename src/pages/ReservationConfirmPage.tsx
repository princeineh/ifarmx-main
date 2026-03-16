import { motion } from 'framer-motion';
import {
  Sprout, CheckCircle, ArrowRight, Shield, Timer, Mail, Package
} from 'lucide-react';

interface ReservationConfirmPageProps {
  email: string;
  onEnterPlatform: () => void;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function ReservationConfirmPage({ email, onEnterPlatform }: ReservationConfirmPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#020805] via-[#071a10] to-[#0a1a12] landing-page flex items-center justify-center">
      <div className="absolute inset-0 landing-grid-bg opacity-20 pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-[#00FF9F]/[0.04] blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-cyan-500/[0.03] blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-md mx-auto px-4 py-12">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="text-center"
        >
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#00FF9F]/20 border border-[#00FF9F]/30 mb-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            >
              <CheckCircle className="w-10 h-10 text-[#00FF9F]" />
            </motion.div>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-3xl sm:text-4xl font-black text-white mb-3"
          >
            Your Batch 1 Spot is{' '}
            <span className="bg-gradient-to-r from-[#00FF9F] to-cyan-400 bg-clip-text text-transparent">
              Reserved!
            </span>
          </motion.h1>

          <motion.div variants={fadeUp} className="space-y-4 mb-8">
            <p className="text-gray-400 leading-relaxed">
              No payment required until April 1. We{'\u2019'}ll send a secure payment link on
              April 1 ({'\u20A6'}24,999 per kit + shipping).
            </p>

            <div className="glass-morphism rounded-xl p-4 text-left">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#00FF9F]/10 flex items-center justify-center flex-shrink-0">
                  <Package className="w-4 h-4 text-[#00FF9F]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Batch 1 Limited to 125 Kits</p>
                  <p className="text-xs text-gray-500">Your spot is secured</p>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                  <Timer className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Payment Opens April 1</p>
                  <p className="text-xs text-gray-500">Delivery 5{'\u2013'}7 working days after payment</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Confirmation Sent</p>
                  <p className="text-xs text-gray-500">Check {email}</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#00FF9F]/10 bg-[#00FF9F]/[0.03]">
              <p className="text-sm text-gray-300 leading-relaxed">
                Start exploring the platform now to see how you{'\u2019'}ll monitor your farm,
                get guidance, and scale. A guided tour will walk you through everything.
              </p>
            </div>
          </motion.div>

          <motion.div variants={fadeUp}>
            <button
              onClick={onEnterPlatform}
              className="landing-cta-btn group w-full relative px-8 py-4 rounded-xl text-base font-bold text-[#040a07] bg-gradient-to-r from-[#00FF9F] to-cyan-400 hover:shadow-[0_0_50px_rgba(0,255,159,0.3)] transition-all duration-300 overflow-hidden neon-pulse-box"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Enter iFarmX & Take the Tour
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-[#00FF9F] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-600">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-[#00FF9F]/40" />
              No payment until April 1
            </span>
            <span className="flex items-center gap-1.5">
              <Sprout className="w-3 h-3 text-[#00FF9F]/40" />
              NIFOR Certified Seeds
            </span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
