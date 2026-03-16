import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Sprout, Eye, BookOpen, FileText, TrendingUp, ArrowRight } from 'lucide-react';

const challenges = [
  {
    icon: Sprout,
    problem: 'Unverified Seedlings',
    detail: 'Cheap, non-certified seeds that never yield properly',
    solution: 'We supply only NIFOR EWS-certified Tenera seeds.',
  },
  {
    icon: Eye,
    problem: 'Inconsistent Monitoring',
    detail: 'Care is irregular, issues noticed too late, progress not tracked',
    solution: 'One-touch logging, automatic reminders, health timelines, and structured reporting ensure accountability.',
  },
  {
    icon: BookOpen,
    problem: 'Knowledge Gaps',
    detail: 'No reliable guidance at critical early stages',
    solution: 'In-app agronomy guidance powered by structured knowledge support (24/7 chat) + official NIFOR materials.',
  },
  {
    icon: FileText,
    problem: 'Lack of Documentation',
    detail: 'Disputes with workers, landowners, or buyers due to poor records',
    solution: 'Structured agreement templates & verification records built into the platform.',
  },
  {
    icon: TrendingUp,
    problem: 'Scaling Dead-Ends',
    detail: 'No clear pathway after nursery phase',
    solution: 'Verified transplant process + structured scaling path (subject to plant health).',
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut', delay: i * 0.1 },
  }),
};

export function ChallengesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="challenges" className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c2014] via-[#0e1a12] to-[#0c2014]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-soul-500/20 to-transparent" />
      <div className="absolute top-1/3 right-0 w-[400px] h-[400px] rounded-full bg-soul-500/[0.03] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-[300px] h-[300px] rounded-full bg-grove-500/[0.04] blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="text-soul-400 text-sm font-semibold uppercase tracking-widest mb-3 block">
            The Problem
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 max-w-3xl mx-auto">
            The Common Reasons Smallholder Farmers{' '}
            <span className="bg-gradient-to-r from-soul-400 to-warmth-400 bg-clip-text text-transparent">
              Face Preventable Challenges
            </span>
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-base">
            Many smallholder losses are not due to lack of effort {'\u2014'} but lack of structure,
            monitoring, and documentation. iFarmX is designed to reduce these preventable risks.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
          {challenges.map((c, i) => (
            <motion.div
              key={c.problem}
              custom={i}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              variants={cardVariants}
              className={`group relative rounded-2xl glass-morphism p-6 transition-all duration-500 hover:scale-[1.02] ${
                i === 4 ? 'md:col-span-2 md:max-w-lg md:mx-auto' : ''
              }`}
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-soul-500/0 group-hover:via-grove-400/40 to-transparent transition-all duration-500" />

              <div className="w-11 h-11 rounded-xl bg-soul-500/10 border border-soul-500/20 flex items-center justify-center mb-4 group-hover:bg-grove-500/10 group-hover:border-grove-500/20 transition-colors duration-500">
                <c.icon className="w-5 h-5 text-soul-400 group-hover:text-grove-300 transition-colors duration-500" />
              </div>

              <p className="text-sm font-bold text-soul-400 group-hover:text-soul-400/60 transition-colors mb-1 line-through decoration-soul-500/40">
                {c.problem}
              </p>
              <p className="text-xs text-gray-600 mb-3">{c.detail}</p>

              <div className="flex items-center gap-2 mb-2">
                <ArrowRight className="w-3.5 h-3.5 text-grove-300 flex-shrink-0" />
                <span className="text-xs font-semibold text-grove-300 uppercase tracking-wider">iFarmX Solution</span>
              </div>

              <p className="text-sm text-gray-400 leading-relaxed">
                {c.solution}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center"
        >
          <p className="text-sm text-gray-600 max-w-lg mx-auto">
            iFarmX doesn{'\u2019'}t just sell seeds. It provides the complete system
            {' \u2014 '} tools, intelligence, and structure {' \u2014 '} so farming actually works.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
