import { useState } from 'react';
import { X, Send, Heart, Star, TrendingUp, Award } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import type { MonitorUser } from './types';

interface EncourageModalProps {
  users: MonitorUser[];
  onClose: () => void;
  onSent: () => void;
}

type MessagePreset = 'keep_going' | 'watering_reminder' | 'great_progress' | 'custom';

const PRESETS: { key: MessagePreset; label: string; icon: typeof Heart; title: string; message: string }[] = [
  {
    key: 'keep_going',
    label: 'Keep Going',
    icon: Heart,
    title: 'Keep Up the Great Work!',
    message: 'We see your effort and dedication to growing your palm seedlings. Every day of care brings you closer to a thriving harvest. Keep going - you are making a difference!',
  },
  {
    key: 'watering_reminder',
    label: 'Watering Tip',
    icon: Star,
    title: 'Your Plants Need You!',
    message: 'A friendly reminder: consistent watering is the foundation of healthy palm seedlings. Try to water at least 5 days a week for the best results. Your plants will thank you!',
  },
  {
    key: 'great_progress',
    label: 'Celebrate Progress',
    icon: TrendingUp,
    title: 'Amazing Progress!',
    message: 'Your farming journey is an inspiration! The care you have put into your plants shows real results. We are proud to have you as part of the iFarm community.',
  },
  {
    key: 'custom',
    label: 'Custom Message',
    icon: Award,
    title: '',
    message: '',
  },
];

export function EncourageModal({ users, onClose, onSent }: EncourageModalProps) {
  const { user: adminUser } = useAuth();
  const [selectedPreset, setSelectedPreset] = useState<MessagePreset>('keep_going');
  const [title, setTitle] = useState(PRESETS[0].title);
  const [message, setMessage] = useState(PRESETS[0].message);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handlePresetChange = (preset: MessagePreset) => {
    setSelectedPreset(preset);
    const p = PRESETS.find(pr => pr.key === preset);
    if (p && preset !== 'custom') {
      setTitle(p.title);
      setMessage(p.message);
    }
  };

  const handleSend = async () => {
    if (!adminUser || !title.trim() || !message.trim()) return;

    setSending(true);
    try {
      const notifications = users.map(u => ({
        user_id: u.user_id,
        type: 'system' as const,
        title: title.trim(),
        message: message.trim(),
        read: false,
        metadata: { link_type: 'encouragement', sent_by: 'admin' },
      }));

      await supabase.from('notifications').insert(notifications);
      setSent(true);
      setTimeout(() => onSent(), 1200);
    } finally {
      setSending(false);
    }
  };

  const isBulk = users.length > 1;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {sent ? 'Message Sent!' : 'Encourage Grower'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {isBulk
                ? `Sending to ${users.length} growers`
                : `To: ${users[0]?.display_name || 'Unknown'}`
              }
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {sent ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-7 h-7 text-emerald-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {isBulk
                ? `Encouragement sent to ${users.length} growers!`
                : `Encouragement sent to ${users[0]?.display_name}!`
              }
            </p>
            <p className="text-xs text-gray-500 mt-1">They will see it in their notifications.</p>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {isBulk && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="text-xs text-blue-700 font-medium">
                  Bulk sending to: {users.slice(0, 5).map(u => u.display_name).join(', ')}
                  {users.length > 5 && ` and ${users.length - 5} more`}
                </p>
              </div>
            )}

            {!isBulk && users[0] && (
              <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-sm font-bold text-emerald-700 flex-shrink-0">
                  {users[0].display_name[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{users[0].display_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      users[0].health_score >= 60 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {users[0].health_label} ({Math.round(users[0].health_score)}%)
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {users[0].care_logs_week} logs this week
                    </span>
                    {users[0].days_inactive >= 3 && (
                      <span className="text-[10px] text-red-500 font-medium">
                        {users[0].days_inactive}d inactive
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Quick Message</p>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map(p => (
                  <button
                    key={p.key}
                    onClick={() => handlePresetChange(p.key)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                      selectedPreset === p.key
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                    }`}
                  >
                    <p.icon className={`w-4 h-4 flex-shrink-0 ${selectedPreset === p.key ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <span className={`text-xs font-semibold ${selectedPreset === p.key ? 'text-emerald-700' : 'text-gray-600'}`}>
                      {p.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Enter message title..."
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                placeholder="Write your encouragement message..."
              />
            </div>

            <button
              onClick={handleSend}
              disabled={sending || !title.trim() || !message.trim()}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send to {users.length} Grower{users.length !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
