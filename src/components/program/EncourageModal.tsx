import { useState } from 'react';
import { X, Send, Heart, Loader2, CheckCircle, AlertCircle, AlertTriangle, ShieldAlert } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface EncourageModalProps {
  recipientUserId: string;
  recipientName: string;
  programId: string;
  programName: string;
  urgencyLevel?: 'critical' | 'warning' | 'mild' | null;
  onClose: () => void;
  onSent: () => void;
}

const criticalMessages = [
  "URGENT: We need you back! Your plants are at risk. Let's work together to save them. Can you log a care activity today?",
  "Critical Alert: Your farming journey needs immediate attention. We're here to help you get back on track RIGHT NOW!",
  "Emergency Support: Your plants haven't been cared for in too long. Please water them today and we'll guide you through recovery.",
  "RED ALERT: We're worried about your progress. Let's have a quick chat about how we can help you restart. Your success matters!",
  "Critical: Your participation is at risk. Don't lose all your progress! One simple care activity today can turn things around.",
];

const warningMessages = [
  "Heads up! We've noticed you're falling behind. Let's get you back on track before things get difficult!",
  "Warning: Your plants need more attention. Can you commit to checking on them this week?",
  "Important: Your care schedule has slipped. Let's prevent this from becoming a bigger issue. Water your plants today!",
  "Attention Needed: You're doing okay, but we can do better together. Let's boost your care routine this week!",
  "Alert: Your compliance is dropping. A little extra effort this week will make a huge difference!",
];

const mildMessages = [
  "Friendly reminder: Keep up the great work! Just a small push will take you to the next level.",
  "Hey there! You're doing well, but let's stay consistent. Your plants will thank you!",
  "Quick check-in: Everything looks good, but consistency is key. Keep those daily care logs going!",
  "Gentle nudge: You're on the right path! A bit more attention to watering will perfect your routine.",
  "Doing great! Just maintain this momentum and you'll see amazing results soon.",
];

const defaultMessages = [
  "Don't give up! Every small step counts. Water your plants today and you'll see the difference soon!",
  "We believe in you! Farming takes patience, and we're here to support you every step of the way.",
  "Your farming journey is important to us. Let's get back on track together - start with just one care activity today!",
  "Hey, we noticed things have slowed down. That's okay! The best time to restart is now. Your plants need you!",
  "Remember why you started. Your dedication matters, and even small efforts add up to great results over time.",
];

function getMessagesForUrgency(urgency: 'critical' | 'warning' | 'mild' | null | undefined): string[] {
  if (urgency === 'critical') return criticalMessages;
  if (urgency === 'warning') return warningMessages;
  if (urgency === 'mild') return mildMessages;
  return defaultMessages;
}

export function EncourageModal({ recipientUserId, recipientName, programId, programName, urgencyLevel, onClose, onSent }: EncourageModalProps) {
  const { user, profile } = useAuth();
  const presetMessages = getMessagesForUrgency(urgencyLevel);
  const [message, setMessage] = useState(presetMessages[0]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const urgencyConfig = {
    critical: {
      icon: ShieldAlert,
      bg: 'bg-red-50',
      border: 'border-red-200',
      badge: 'bg-red-600 text-white',
      iconColor: 'text-red-600',
      label: 'CRITICAL SUPPORT',
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      badge: 'bg-amber-600 text-white',
      iconColor: 'text-amber-600',
      label: 'NEEDS ATTENTION',
    },
    mild: {
      icon: AlertCircle,
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      badge: 'bg-yellow-600 text-white',
      iconColor: 'text-yellow-600',
      label: 'GENTLE REMINDER',
    },
  };

  const config = urgencyLevel ? urgencyConfig[urgencyLevel] : null;

  const handleSend = async () => {
    if (!user || !message.trim()) return;
    setSending(true);
    setError(null);

    try {
      await supabase.from('notifications').insert({
        user_id: recipientUserId,
        type: 'encouragement',
        title: `Encouragement from ${profile?.display_name || 'Your Organizer'}`,
        message: message.trim(),
        metadata: { link_type: 'program', link_id: programId },
        read: false,
      });

      setSent(true);
      setTimeout(() => {
        onSent();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {sent ? (
          <div className="p-10 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
            <p className="text-gray-500 text-sm">{recipientName} will receive your encouragement.</p>
          </div>
        ) : (
          <>
            <div className={`flex items-center justify-between p-5 border-b ${config ? config.border + ' ' + config.bg : 'border-gray-100'}`}>
              <div className="flex items-center gap-2">
                {config ? (
                  <config.icon className={`w-5 h-5 ${config.iconColor}`} />
                ) : (
                  <Heart className="w-5 h-5 text-rose-500" />
                )}
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Encourage {recipientName}</h2>
                  {config && (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 ${config.badge} text-[10px] font-bold rounded-full mt-1`}>
                      {config.label}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {config && (
                <div className={`${config.bg} ${config.border} border rounded-xl p-3`}>
                  <p className={`text-xs font-semibold ${config.iconColor} mb-1 uppercase tracking-wide`}>
                    {urgencyLevel === 'critical' && 'This participant needs urgent support!'}
                    {urgencyLevel === 'warning' && 'This participant is falling behind'}
                    {urgencyLevel === 'mild' && 'A gentle reminder can help maintain progress'}
                  </p>
                  <p className="text-xs text-gray-600">
                    Your message can make a real difference in their farming journey.
                  </p>
                </div>
              )}
              <p className="text-sm text-gray-600">
                Send an encouraging message to help this participant {urgencyLevel === 'critical' ? 'urgently get back' : 'stay'} on track in "{programName}".
              </p>

              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 block">Quick Messages</label>
                <div className="space-y-2">
                  {presetMessages.map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => setMessage(preset)}
                      className={`w-full text-left p-3 rounded-xl border-2 text-xs transition-all ${
                        message === preset
                          ? 'border-rose-300 bg-rose-50 text-rose-800'
                          : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 block">
                  Or write your own
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-400 focus:border-rose-400 resize-none"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-100 flex items-center justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !message.trim()}
                className="flex items-center gap-2 bg-rose-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? 'Sending...' : 'Send Encouragement'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
