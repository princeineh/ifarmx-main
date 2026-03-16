import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Menu, X } from 'lucide-react';

interface LandingNavbarProps {
  onGetStarted: () => void;
  onLogin?: () => void;
}

export function LandingNavbar({ onGetStarted, onLogin }: LandingNavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };

  const links = [
    { label: 'Kit', id: 'kit' },
    { label: 'How It Works', id: 'how-it-works' },
    { label: 'Paths', id: 'paths' },
    { label: 'Roadmap', id: 'roadmap' },
    { label: 'FAQ', id: 'faq' },
  ];

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0a1a0e]/90 backdrop-blur-xl border-b border-grove-600/10 shadow-2xl'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-grove-500 to-warmth-500 flex items-center justify-center shadow-lg shadow-grove-500/20">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white tracking-tight">
                iFarm<span className="text-warmth-400">X</span>
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {links.map((l) => (
              <button
                key={l.id}
                onClick={() => scrollTo(l.id)}
                className="text-sm text-gray-400 hover:text-warmth-300 transition-colors font-medium"
              >
                {l.label}
              </button>
            ))}
            {onLogin && (
              <button
                onClick={onLogin}
                className="text-sm text-gray-400 hover:text-white transition-colors font-medium"
              >
                Log In
              </button>
            )}
            <button
              onClick={onGetStarted}
              className="landing-cta-btn px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-grove-600 to-grove-500 hover:shadow-[0_0_24px_rgba(46,125,50,0.3)] transition-all duration-300 border border-grove-400/20"
            >
              Start Growing
            </button>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-[#0a1a0e]/95 backdrop-blur-xl border-t border-grove-700/20 px-4 pb-6 pt-2"
        >
          {links.map((l) => (
            <button
              key={l.id}
              onClick={() => scrollTo(l.id)}
              className="block w-full text-left py-3 text-gray-300 hover:text-warmth-300 transition-colors font-medium text-sm border-b border-white/5"
            >
              {l.label}
            </button>
          ))}
          {onLogin && (
            <button
              onClick={() => { setMobileOpen(false); onLogin(); }}
              className="block w-full text-left py-3 text-gray-300 hover:text-white transition-colors font-medium text-sm border-b border-white/5"
            >
              Log In
            </button>
          )}
          <button
            onClick={() => { setMobileOpen(false); onGetStarted(); }}
            className="w-full mt-4 px-5 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-grove-600 to-grove-500"
          >
            Start Growing
          </button>
        </motion.div>
      )}
    </motion.nav>
  );
}
