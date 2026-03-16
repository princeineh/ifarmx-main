import { useRef, useState } from 'react';
import {
  Trophy, TrendingUp, Award, Heart, Star,
  Share2, X, Twitter, Facebook, Copy, Check, ExternalLink
} from 'lucide-react';

interface Appreciation {
  id: string;
  title: string;
  message: string;
  badge_type: string;
  period_label: string;
  created_at: string;
  sender_name: string;
  program_name: string;
}

interface AppreciationCardProps {
  appreciation: Appreciation;
  recipientName: string;
  recipientAvatar: string | null;
  onClose: () => void;
}

const badgeConfig: Record<string, { icon: typeof Trophy; gradient: string; accent: string; label: string; starColor: string }> = {
  top_performer: {
    icon: Trophy,
    gradient: 'from-amber-500 via-yellow-500 to-amber-600',
    accent: 'text-amber-400',
    label: 'Top Performer',
    starColor: 'text-amber-300',
  },
  most_improved: {
    icon: TrendingUp,
    gradient: 'from-sky-500 via-blue-500 to-sky-600',
    accent: 'text-sky-300',
    label: 'Most Improved',
    starColor: 'text-sky-200',
  },
  consistent: {
    icon: Award,
    gradient: 'from-emerald-500 via-green-500 to-emerald-600',
    accent: 'text-emerald-300',
    label: 'Consistent Effort',
    starColor: 'text-emerald-200',
  },
  special: {
    icon: Heart,
    gradient: 'from-rose-500 via-pink-500 to-rose-600',
    accent: 'text-rose-300',
    label: 'Special Recognition',
    starColor: 'text-rose-200',
  },
};

const HASHTAGS = '#ifarmafrica #selffarming';
const SITE_URL = 'https://ifarmafrica.com';

function getShareText(recipientName: string, title: string, senderName: string, programName: string): string {
  return `I just received a "${title}" appreciation from ${senderName} on the ${programName} program at iFarmX! ${HASHTAGS}`;
}

export function AppreciationCard({ appreciation, recipientName, recipientAvatar, onClose }: AppreciationCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const badge = badgeConfig[appreciation.badge_type] || badgeConfig.special;
  const BadgeIcon = badge.icon;

  const shareText = getShareText(recipientName, appreciation.title, appreciation.sender_name, appreciation.program_name);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${SITE_URL}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(SITE_URL)}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400');
  };

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SITE_URL)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400');
  };

  const handleShareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${SITE_URL}`)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `iFarmX - ${appreciation.title}`,
          text: shareText,
          url: SITE_URL,
        });
      } catch {
        setShowShare(true);
      }
    } else {
      setShowShare(true);
    }
  };

  const formattedDate = new Date(appreciation.created_at).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md">
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>

        <div ref={cardRef} className="overflow-hidden rounded-3xl shadow-2xl">
          <div className={`relative bg-gradient-to-br ${badge.gradient} px-6 pt-8 pb-12`}>
            <div className="absolute top-3 left-4 opacity-10">
              <Star className="w-16 h-16 text-white" fill="currentColor" />
            </div>
            <div className="absolute top-6 right-6 opacity-10">
              <Star className="w-10 h-10 text-white" fill="currentColor" />
            </div>
            <div className="absolute bottom-2 left-8 opacity-10">
              <Star className="w-8 h-8 text-white" fill="currentColor" />
            </div>
            <div className="absolute bottom-4 right-14 opacity-10">
              <Star className="w-12 h-12 text-white" fill="currentColor" />
            </div>

            <div className="relative text-center">
              <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 mb-4">
                <Star className={`w-3.5 h-3.5 ${badge.starColor}`} fill="currentColor" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">{badge.label}</span>
                <Star className={`w-3.5 h-3.5 ${badge.starColor}`} fill="currentColor" />
              </div>

              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 rounded-full border-4 border-white/40 shadow-xl overflow-hidden mx-auto bg-white/20">
                  {recipientAvatar ? (
                    <img src={recipientAvatar} alt={recipientName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-3xl font-bold text-white/80">
                        {recipientName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
                  <BadgeIcon className={`w-5 h-5 ${badge.accent.replace('text-', 'text-')}`} style={{ color: 'currentColor' }} />
                </div>
              </div>

              <h2 className="text-xl font-bold text-white mb-0.5">{recipientName}</h2>
              <p className={`text-sm ${badge.accent} font-semibold`}>{appreciation.title}</p>
            </div>
          </div>

          <div className="bg-white px-6 py-6 -mt-4 rounded-t-3xl relative">
            <div className="flex justify-center -mt-8 mb-4">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-amber-400 drop-shadow-sm"
                    fill="currentColor"
                  />
                ))}
              </div>
            </div>

            <p className="text-gray-700 text-sm leading-relaxed text-center mb-5">
              "{appreciation.message}"
            </p>

            <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-4 mb-4">
              <span>From: {appreciation.sender_name}</span>
              <span>{appreciation.period_label}</span>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400 mb-5">
              <span>{formattedDate}</span>
              <span>{appreciation.program_name}</span>
            </div>

            <div className="border-t border-dashed border-gray-200 pt-4">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-amber-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-[8px] font-bold">iF</span>
                </div>
                <span className="text-xs font-bold text-gray-500">iFarmX</span>
              </div>
              <p className="text-[10px] text-gray-400 text-center">{HASHTAGS}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-center">
          <button
            onClick={handleNativeShare}
            className="inline-flex items-center gap-2 bg-white text-gray-800 px-6 py-3 rounded-2xl font-bold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            <Share2 className="w-4 h-4" />
            Share This Award
          </button>
        </div>

        {showShare && (
          <div className="mt-3 bg-white rounded-2xl shadow-lg p-4 space-y-2">
            <p className="text-xs font-bold text-gray-700 text-center mb-3">Share on</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleShareTwitter}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors"
              >
                <Twitter className="w-4 h-4" />
                X (Twitter)
              </button>
              <button
                onClick={handleShareFacebook}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors"
              >
                <Facebook className="w-4 h-4" />
                Facebook
              </button>
              <button
                onClick={handleShareWhatsApp}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-xs font-semibold hover:bg-green-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                WhatsApp
              </button>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-200 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Text'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
