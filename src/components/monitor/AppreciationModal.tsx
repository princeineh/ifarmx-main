import { useState } from 'react';
import {
  X, Send, Star, Trophy, TrendingUp, Award, Heart,
  Loader2, CheckCircle, AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ParticipantAvatar } from './ParticipantAvatar';
import type { ParticipantStats } from './types';
import type { BadgeType, PeriodType } from '../../types/database';

interface AppreciationModalProps {
  recipients: ParticipantStats[];
  programId: string;
  period: PeriodType;
  onClose: () => void;
  onSent: () => void;
}

const badgeOptions: { key: BadgeType; label: string; icon: typeof Trophy; color: string }[] = [
  { key: 'top_performer', label: 'Top Performer', icon: Trophy, color: 'text-amber-500 bg-amber-50 border-amber-200' },
  { key: 'most_improved', label: 'Most Improved', icon: TrendingUp, color: 'text-blue-500 bg-blue-50 border-blue-200' },
  { key: 'consistent', label: 'Consistent Effort', icon: Award, color: 'text-green-500 bg-green-50 border-green-200' },
  { key: 'special', label: 'Special Recognition', icon: Heart, color: 'text-rose-500 bg-rose-50 border-rose-200' },
];

function getPeriodLabel(period: PeriodType): string {
  const now = new Date();
  switch (period) {
    case 'daily':
      return now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    case 'weekly': {
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - diff);
      return `Week of ${weekStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`;
    }
    case 'monthly':
      return now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    case 'yearly':
      return now.getFullYear().toString();
    default:
      return '';
  }
}

const defaultMessages: Record<BadgeType, string> = {
  top_performer: "Congratulations! Your dedication and hard work have made you one of our top performers. Keep up the outstanding work - you're setting a great example for everyone!",
  most_improved: "We've noticed incredible improvement in your farming journey! Your commitment to getting better every day is truly inspiring. Keep pushing forward!",
  consistent: "Your consistency in caring for your plants hasn't gone unnoticed. Day after day, you show up and do the work. That's what makes a great farmer!",
  special: "We wanted to take a moment to recognize your contributions to our program. Your efforts are truly appreciated!",
};

export function AppreciationModal({ recipients, programId, period, onClose, onSent }: AppreciationModalProps) {
  const { user, profile } = useAuth();
  const [badge, setBadge] = useState<BadgeType>('top_performer');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState(defaultMessages.top_performer);
  const [sendEmail, setSendEmail] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBulk = recipients.length > 1;
  const periodLabel = getPeriodLabel(period);

  const handleBadgeChange = (newBadge: BadgeType) => {
    setBadge(newBadge);
    if (!title || title === getBadgeTitle(badge)) {
      setTitle(getBadgeTitle(newBadge));
    }
    setMessage(defaultMessages[newBadge]);
  };

  function getBadgeTitle(b: BadgeType): string {
    return badgeOptions.find(o => o.key === b)?.label || 'Appreciation';
  }

  const handleSend = async () => {
    if (!user || !message.trim()) return;
    setSending(true);
    setError(null);

    try {
      const appreciations = recipients.map(r => ({
        program_id: programId,
        sender_id: user.id,
        recipient_id: r.user_id,
        title: title || getBadgeTitle(badge),
        message: message.trim(),
        badge_type: badge,
        period_type: period,
        period_label: periodLabel,
        email_sent: false,
        read: false,
      }));

      const { error: insertError } = await supabase
        .from('appreciations')
        .insert(appreciations);

      if (insertError) throw insertError;

      const notifications = recipients.map(r => ({
        user_id: r.user_id,
        type: 'appreciation' as const,
        title: title || getBadgeTitle(badge),
        message: message.trim(),
        metadata: { link_type: 'appreciation', link_id: programId },
        read: false,
      }));

      await supabase.from('notifications').insert(notifications);

      if (sendEmail) {
        try {
          const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-appreciation`;
          await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              recipient_ids: recipients.map(r => r.user_id),
              recipient_emails: recipients.map(r => r.email).filter(e => e !== 'Unknown'),
              recipient_names: recipients.map(r => r.display_name || 'Farmer'),
              sender_name: profile?.display_name || 'Your Program Organizer',
              title: title || getBadgeTitle(badge),
              message: message.trim(),
              badge_type: badge,
              period_label: periodLabel,
            }),
          });
        } catch {
          // Email sending is best-effort
        }
      }

      setSent(true);
      setTimeout(() => {
        onSent();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to send appreciation');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {sent ? (
          <div className="p-10 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Appreciation Sent!</h3>
            <p className="text-gray-500 text-sm">
              {isBulk ? `${recipients.length} participants` : recipients[0]?.display_name || 'The participant'} will receive your message{sendEmail ? ' and an email notification' : ''}.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold text-gray-900">
                  {isBulk ? `Appreciate ${recipients.length} Participants` : 'Send Appreciation'}
                </h2>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {!isBulk && recipients[0] && (
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                  <ParticipantAvatar avatarUrl={recipients[0].avatar_url} displayName={recipients[0].display_name} size="md" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{recipients[0].display_name || 'Unnamed'}</p>
                    <p className="text-xs text-gray-500">Score: {recipients[0].health_score} | Compliance: {recipients[0].compliance}%</p>
                  </div>
                </div>
              )}

              {isBulk && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center -space-x-2 mb-2">
                    {recipients.slice(0, 5).map((r) => (
                      <ParticipantAvatar key={r.user_id} avatarUrl={r.avatar_url} displayName={r.display_name} size="sm" />
                    ))}
                    {recipients.length > 5 && (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 ring-2 ring-white">
                        +{recipients.length - 5}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{recipients.length} participants selected</p>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 block">Badge Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {badgeOptions.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => handleBadgeChange(opt.key)}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${
                        badge === opt.key
                          ? `${opt.color} border-current`
                          : 'border-gray-100 hover:border-gray-200 bg-white'
                      }`}
                    >
                      <opt.icon className={`w-5 h-5 ${badge === opt.key ? '' : 'text-gray-400'}`} />
                      <span className={`text-sm font-semibold ${badge === opt.key ? '' : 'text-gray-600'}`}>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 block">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={getBadgeTitle(badge)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 block">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Send Email</p>
                  <p className="text-xs text-gray-500">Also notify via email</p>
                </div>
                <button
                  onClick={() => setSendEmail(!sendEmail)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    sendEmail ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 transition-transform ${
                    sendEmail ? 'translate-x-5' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="text-xs text-gray-400 flex items-center gap-1">
                <span>Period: {periodLabel}</span>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !message.trim()}
                className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {sending ? 'Sending...' : `Send${isBulk ? ` to ${recipients.length}` : ''}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
