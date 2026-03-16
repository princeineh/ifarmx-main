import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Sprout, Fish, Egg, Coffee, Check, Clock } from 'lucide-react';

const crops = [
  {
    icon: Sprout,
    name: 'Palm Oil',
    status: 'live' as const,
    label: 'Active (Now)',
    accent: 'text-grove-300',
    borderColor: 'border-grove-500/30',
    bgColor: 'bg-grove-500/10',
    dotColor: 'bg-grove-400',
  },
  {
    icon: Fish,
    name: 'Fishery',
    status: 'coming' as const,
    label: 'Coming Soon',
    accent: 'text-warmth-300',
    borderColor: 'border-warmth-400/20',
    bgColor: 'bg-warmth-400/10',
    dotColor: 'bg-warmth-400',
  },
  {
    icon: Egg,
    name: 'Poultry',
    status: 'coming' as const,
    label: 'Coming Soon',
    accent: 'text-soul-300',
    borderColor: 'border-soul-400/20',
    bgColor: 'bg-soul-400/10',
    dotColor: 'bg-soul-400',
  },
  {
    icon: Coffee,
    name: 'Cash Crops',
    subtitle: 'Cocoa, Cassava, Rice',
    status: 'planned' as const,
    label: 'Planned / Pilot',
    accent: 'text-gray-400',
    borderColor: 'border-gray-600/20',
    bgColor: 'bg-gray-600/10',
    dotColor: 'bg-gray-500',
  },
];

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut', delay: i * 0.12 },
  }),
};

export function RoadmapSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="roadmap" className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c2014] via-[#0a1c12] to-[#0f2518]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-grove-500/30 to-transparent" />
      <div className="absolute top-1/2 right-0 w-[350px] h-[350px] rounded-full bg-grove-500/[0.04] blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <span className="text-grove-300 text-sm font-semibold uppercase tracking-widest mb-3 block">
            Crop Roadmap
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
            Growing{' '}
            <span className="font-serif-display italic bg-gradient-to-r from-grove-300 to-warmth-300 bg-clip-text text-transparent">
              Beyond Oil Palm
            </span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-base">
            Oil palm is just the beginning. The iFarmX platform is being
            expanded to support multiple crops across Africa.
          </p>
        </motion.div>

        <div className="relative">
          <div className="hidden sm:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-grove-400/30 via-warmth-500/20 to-gray-700/20" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {crops.map((crop, i) => (
              <motion.div
                key={crop.name}
                custom={i}
                initial="hidden"
                animate={isInView ? 'visible' : 'hidden'}
                variants={itemVariants}
                className="relative"
              >
                <div className="hidden sm:flex absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <div className={`w-6 h-6 rounded-full ${crop.dotColor} border-4 border-[#0c2014] shadow-lg`} />
                </div>

                <div className={`rounded-2xl glass-morphism p-5 text-center transition-all duration-500 hover:scale-[1.03] ${crop.borderColor} sm:mt-6`}>
                  <div className={`w-12 h-12 rounded-xl ${crop.bgColor} border ${crop.borderColor} flex items-center justify-center mx-auto mb-3`}>
                    <crop.icon className={`w-6 h-6 ${crop.accent}`} />
                  </div>

                  <h3 className={`text-lg font-bold ${crop.status === 'live' ? 'text-white' : 'text-gray-300'} mb-1`}>
                    {crop.name}
                  </h3>
                  {'subtitle' in crop && (
                    <p className="text-xs text-gray-600 mb-2">{crop.subtitle}</p>
                  )}

                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    crop.status === 'live'
                      ? 'bg-grove-500/10 text-grove-300 border border-grove-500/20'
                      : crop.status === 'coming'
                      ? 'bg-white/5 text-gray-400 border border-gray-700'
                      : 'bg-white/[0.03] text-gray-600 border border-gray-800'
                  }`}>
                    {crop.status === 'live' ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                    {crop.label}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
