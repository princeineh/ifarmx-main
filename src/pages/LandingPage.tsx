import { LandingNavbar } from '../components/landing/LandingNavbar';
import { HeroSection } from '../components/landing/HeroSection';
import { ChallengesSection } from '../components/landing/ChallengesSection';
import { KitSection } from '../components/landing/KitSection';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { WhoItsForSection } from '../components/landing/WhoItsForSection';
import { RoadmapSection } from '../components/landing/RoadmapSection';
import { FAQSection } from '../components/landing/FAQSection';
import { CTASection } from '../components/landing/CTASection';
import { LandingFooter } from '../components/landing/LandingFooter';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin?: () => void;
}

export function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
  return (
    <div className="landing-page bg-[#0a1a0e] text-white overflow-x-hidden">
      <LandingNavbar onGetStarted={onGetStarted} onLogin={onLogin} />
      <HeroSection onGetStarted={onGetStarted} />
      <ChallengesSection />
      <KitSection onGetStarted={onGetStarted} />
      <HowItWorksSection />
      <WhoItsForSection onGetStarted={onGetStarted} />
      <RoadmapSection />
      <FAQSection />
      <CTASection onGetStarted={onGetStarted} />
      <LandingFooter onGetStarted={onGetStarted} />
    </div>
  );
}
