import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'Is iFarmX an investment platform?',
    answer: 'No. iFarmX is a self-farming platform. You own and manage your own farming activities. No financial returns are guaranteed.',
  },
  {
    question: 'When do oil palms typically begin yielding?',
    answer: 'Tenera palms usually begin producing fruit ~3\u20134 years after planting, depending on care, climate, and soil conditions.',
  },
  {
    question: 'What happens if my seedling fails?',
    answer: 'Seedling survival depends on proper care. We provide guidance tools and documentation. Replacement is not guaranteed.',
  },
  {
    question: 'Can institutions sponsor participants?',
    answer: 'Yes. Organisations can sponsor kits, track progress, and receive structured reports via the institutional access program.',
  },
  {
    question: 'How do I get started?',
    answer: 'Purchase a Starter Kit, and once delivered you activate your kit code on the platform. You can then start planting and logging your progress immediately.',
  },
];

export function FAQSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f2518] via-[#0c2014] to-[#0f2518]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-warmth-500/20 to-transparent" />
      <div className="absolute bottom-1/3 left-0 w-[350px] h-[350px] rounded-full bg-warmth-500/[0.04] blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <span className="text-warmth-400 text-sm font-semibold uppercase tracking-widest mb-3 block">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4">
            Frequently Asked{' '}
            <span className="font-serif-display italic bg-gradient-to-r from-grove-300 to-warmth-300 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto text-base">
            Everything you need to know before getting started with iFarmX.
          </p>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-xl glass-morphism overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="text-sm font-semibold text-white pr-4">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-grove-400 flex-shrink-0 transition-transform duration-300 ${
                    openIndex === i ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-5 pb-5 pt-0">
                  <div className="h-px bg-white/[0.06] mb-4" />
                  <p className="text-sm text-gray-400 leading-relaxed">{faq.answer}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
