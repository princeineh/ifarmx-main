import { Leaf } from 'lucide-react';

interface LandingFooterProps {
  onGetStarted: () => void;
}

export function LandingFooter({ onGetStarted }: LandingFooterProps) {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="relative border-t border-white/[0.04] bg-[#0a1a0e]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-grove-500 to-warmth-500 flex items-center justify-center shadow-md shadow-grove-500/20">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                iFarm<span className="text-warmth-400">X</span>
              </span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed max-w-xs">
              Plant with patience. Grow with love.
            </p>
            <p className="text-xs text-gray-700 mt-2">
              Powered by DotXan Tech
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">Platform</h4>
            <ul className="space-y-3">
              {[
                { label: 'Starter Kit', id: 'kit' },
                { label: 'How It Works', id: 'how-it-works' },
                { label: 'Choose Your Path', id: 'paths' },
                { label: 'Crop Roadmap', id: 'roadmap' },
                { label: 'FAQ', id: 'faq' },
              ].map((link) => (
                <li key={link.id}>
                  <button
                    onClick={() => scrollTo(link.id)}
                    className="text-sm text-gray-500 hover:text-grove-300 transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">Legal</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-gray-500 hover:text-grove-300 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-grove-300 transition-colors">Terms of Service</a></li>
              <li>
                <a href="mailto:hello@ifarmx.com" className="text-sm text-gray-500 hover:text-grove-300 transition-colors">
                  Contact: hello@ifarmx.com
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">Get Started</h4>
            <ul className="space-y-3">
              <li>
                <button onClick={onGetStarted} className="text-sm text-grove-300 hover:text-grove-200 transition-colors font-medium">
                  Begin Your Journey
                </button>
              </li>
              <li>
                <button onClick={() => scrollTo('kit')} className="text-sm text-gray-500 hover:text-grove-300 transition-colors">
                  View Kit Details
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/[0.06]">
          <p className="text-[11px] text-gray-600 leading-relaxed max-w-3xl mb-6">
            Agricultural outcomes depend on biological growth cycles and proper care. Not an investment scheme. Farming is a journey of patience and persistence.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-600">
              &copy; 2026 iFarmX {'\u2013'} Plant With Patience. Grow With Love.
            </p>
            <p className="text-xs text-gray-700">
              Powered by DotXan Tech
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
