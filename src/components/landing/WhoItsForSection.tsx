import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  User, Users, Building2, ArrowRight, Check,
  Sprout, BarChart3, Heart, Shield, Globe, Target,
  Download, Activity
} from 'lucide-react';

interface WhoItsForSectionProps {
  onGetStarted: () => void;
}

const paths = [
  {
    id: 'individual',
    icon: User,
    label: 'Individual Farmer',
    tagline: 'Your Farm, Your Sanctuary',
    description: 'Full independence, personal dashboard, grow at your own pace.',
    points: [
      { icon: Sprout, text: '3 seedlings fully tracked on your personal dashboard' },
      { icon: BarChart3, text: 'One-touch logging, health timelines, and growth analytics' },
      { icon: Heart, text: 'In-app agronomy guidance (24/7 chat) for your exact plant stage' },
    ],
    cta: 'Start as Individual',
    accent: 'from-grove-400 to-grove-600',
    accentText: 'text-grove-300',
    glowBorder: 'group-hover:border-grove-400/30',
    image: '/Oil_palm_revolution_starter_kit,_girl_ copy copy.jpg',
  },
  {
    id: 'family',
    icon: Users,
    label: 'Family Group',
    tagline: 'Grow Together',
    description: 'One kit per person, shared progress, collaborative monitoring.',
    points: [
      { icon: Users, text: 'One kit per member with individual tracking' },
      { icon: Target, text: 'Shared family dashboard showing group progress' },
      { icon: Heart, text: 'Teach children about farming and food security' },
    ],
    cta: 'Start as Family',
    accent: 'from-warmth-400 to-warmth-600',
    accentText: 'text-warmth-300',
    glowBorder: 'group-hover:border-warmth-400/30',
    image: '/Oil_Palm_Revolution_Kit_Family.jpg',
  },
  {
    id: 'organization',
    icon: Building2,
    label: 'Organisation / Sponsor',
    tagline: 'Centralized Monitoring & Impact',
    description: 'Bulk sponsorship, participant tracking, survival rate analytics, ESG & impact reporting, region-based deployment controls, program scalability dashboard, real-time program visibility across all participants and regions.',
    points: [
      { icon: Globe, text: 'Bulk kit sponsorship with per-participant tracking' },
      { icon: BarChart3, text: 'Organisation dashboard: monitor all participants and tiers' },
      { icon: Shield, text: 'Full traceability for CSR, ESG, and agri-development goals' },
    ],
    cta: 'Start as Organisation',
    accent: 'from-soul-400 to-soul-600',
    accentText: 'text-soul-300',
    glowBorder: 'group-hover:border-soul-400/30',
    image: '/hailuo_1767028878.jpg',
  },
];

function OrgMockDashboard() {
  return (
    <div className="mt-4 rounded-xl bg-[#060e0a] border border-amber-500/10 p-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Program Dashboard Preview</span>
        <button className="flex items-center gap-1 text-[9px] text-gray-500 bg-white/5 px-2 py-0.5 rounded">
          <Download className="w-2.5 h-2.5" />
          Export
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white/[0.03] rounded-lg p-2.5 border border-white/[0.04]">
          <p className="text-[9px] text-gray-500 uppercase">Participants</p>
          <p className="text-lg font-black text-white">247</p>
        </div>
        <div className="bg-white/[0.03] rounded-lg p-2.5 border border-white/[0.04]">
          <p className="text-[9px] text-gray-500 uppercase">Seedling Health</p>
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-grove-300" />
            <p className="text-lg font-black text-grove-300">92%</p>
          </div>
        </div>
      </div>

      <div className="bg-white/[0.03] rounded-lg p-2.5 border border-white/[0.04]">
        <p className="text-[9px] text-gray-500 uppercase mb-2">Growth Distribution</p>
        <div className="flex gap-1 items-end h-10">
          {[40, 65, 80, 55, 70, 90, 75, 85, 60, 50, 95, 72].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-gradient-to-t from-amber-500/40 to-amber-400/80"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[8px] text-gray-600">Jan</span>
          <span className="text-[8px] text-gray-600">Dec</span>
        </div>
      </div>
    </div>
  );
}

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut', delay: i * 0.15 },
  }),
};

export function WhoItsForSection({ onGetStarted }: WhoItsForSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section id="paths" className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f2518] via-[#0a1c12] to-[#0c2014]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-grove-500/30 to-transparent" />
      <div className="absolute top-1/3 left-0 w-[350px] h-[350px] rounded-full bg-warmth-500/[0.04] blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] rounded-full bg-grove-500/[0.04] blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <span className="text-grove-300 text-sm font-semibold uppercase tracking-widest mb-3 block">
            Choose Your Path
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
            Farm as an{' '}
            <span className="bg-gradient-to-r from-grove-300 to-grove-400 bg-clip-text text-transparent">
              Individual
            </span>
            , Family, or{' '}
            <span className="bg-gradient-to-r from-soul-300 to-soul-400 bg-clip-text text-transparent">
              Organisation
            </span>
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-base">
            One platform, three powerful ways to grow. Whether you{'\u2019'}re starting solo,
            involving your family, or running a structured agricultural program{' \u2014 '}
            iFarmX adapts to your scale.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {paths.map((path, i) => (
            <motion.div
              key={path.id}
              custom={i}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              variants={cardVariants}
              className={`group relative rounded-2xl glass-morphism overflow-hidden transition-all duration-500 hover:scale-[1.02] ${path.glowBorder}`}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={path.image}
                  alt={path.label}
                  className="w-full h-full object-cover object-[center_55%] transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c1a12] via-[#0c1a12]/60 to-transparent" />

                <div className="absolute top-3 left-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${path.accent} text-[#040a07]`}>
                    <path.icon className="w-3.5 h-3.5" />
                    {path.label}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <p className={`text-xs font-semibold ${path.accentText} mb-1 uppercase tracking-wider`}>
                  {path.tagline}
                </p>
                <p className="text-sm text-gray-400 leading-relaxed mb-5">
                  {path.description}
                </p>

                <div className="space-y-3 mb-6">
                  {path.points.map((p) => (
                    <div key={p.text} className="flex items-start gap-2.5">
                      <Check className={`w-4 h-4 ${path.accentText} flex-shrink-0 mt-0.5`} />
                      <span className="text-xs text-gray-500 leading-snug">{p.text}</span>
                    </div>
                  ))}
                </div>

                {path.id === 'organization' && <OrgMockDashboard />}

                <button
                  onClick={onGetStarted}
                  className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r ${path.accent} hover:shadow-lg transition-all duration-300 ${path.id === 'organization' ? 'mt-4' : ''}`}
                >
                  {path.cta}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
