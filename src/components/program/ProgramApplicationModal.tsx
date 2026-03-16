import { useState, useEffect } from 'react';
import {
  X, Send, User, MapPin, Briefcase, Calendar, Phone,
  Loader2, CheckCircle, AlertCircle, ChevronDown
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { createNotification } from '../../services/notifications';
import { NIGERIAN_STATES, COMMON_OCCUPATIONS } from '../../data/nigerianStates';

interface ProgramInfo {
  id: string;
  name: string;
  description: string | null;
  org_name: string | null;
  target_participants: number;
  participant_count: number;
  start_date: string | null;
}

interface ProgramApplicationModalProps {
  program: ProgramInfo;
  onClose: () => void;
  onApplied: () => void;
}

interface ProfileForm {
  display_name: string;
  phone_number: string;
  state_of_origin: string;
  lga: string;
  location: string;
  date_of_birth: string;
  occupation: string;
}

export function ProgramApplicationModal({ program, onClose, onApplied }: ProgramApplicationModalProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [form, setForm] = useState<ProfileForm>({
    display_name: '',
    phone_number: '',
    state_of_origin: '',
    lga: '',
    location: '',
    date_of_birth: '',
    occupation: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name || '',
        phone_number: profile.phone_number || '',
        state_of_origin: profile.state_of_origin || '',
        lga: profile.lga || '',
        location: profile.location || '',
        date_of_birth: profile.date_of_birth || '',
        occupation: profile.occupation || '',
      });
    }
  }, [profile]);

  const missingFields = [];
  if (!form.display_name.trim()) missingFields.push('Full Name');
  if (!form.state_of_origin) missingFields.push('State of Origin');
  if (!form.date_of_birth) missingFields.push('Date of Birth');
  if (!form.occupation) missingFields.push('Occupation');

  const canSubmit = missingFields.length === 0;

  const handleSubmit = async () => {
    if (!user || !canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      const profileUpdates: Record<string, string> = {};
      if (form.display_name !== (profile?.display_name || '')) profileUpdates.display_name = form.display_name.trim();
      if (form.phone_number !== (profile?.phone_number || '')) profileUpdates.phone_number = form.phone_number.trim();
      if (form.state_of_origin !== (profile?.state_of_origin || '')) profileUpdates.state_of_origin = form.state_of_origin;
      if (form.lga !== (profile?.lga || '')) profileUpdates.lga = form.lga.trim();
      if (form.location !== (profile?.location || '')) profileUpdates.location = form.location.trim();
      if (form.date_of_birth !== (profile?.date_of_birth || '')) profileUpdates.date_of_birth = form.date_of_birth;
      if (form.occupation !== (profile?.occupation || '')) profileUpdates.occupation = form.occupation;

      if (Object.keys(profileUpdates).length > 0) {
        profileUpdates.updated_at = new Date().toISOString();
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update(profileUpdates)
          .eq('id', user.id);

        if (profileError) throw profileError;
      }

      const { error: appError } = await supabase
        .from('program_applications')
        .insert({
          program_id: program.id,
          user_id: user.id,
          status: 'pending',
          reviewed_at: null,
          reviewed_by: null,
          notes: null,
        });

      if (appError) {
        if (appError.message?.includes('duplicate') || appError.code === '23505') {
          throw new Error('You have already applied to this program.');
        }
        throw appError;
      }

      await createNotification(
        user.id,
        'program_update',
        'Application Submitted - Pending Review',
        `Your application to "${program.name}" has been submitted and is now pending review by the organizer (${program.org_name || 'the program organizer'}). You will be notified once a decision is made.`
      );

      const { data: progData } = await supabase
        .from('programs')
        .select('org_user_id')
        .eq('id', program.id)
        .maybeSingle();

      if (progData?.org_user_id) {
        await createNotification(
          progData.org_user_id,
          'program_update',
          'New Program Application Received',
          `${form.display_name || 'A new user'} has applied to your program "${program.name}". Review their application in your program dashboard.`
        );
      }

      await refreshProfile();
      setSuccess(true);
      setTimeout(() => {
        onApplied();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const spots = program.target_participants - program.participant_count;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {success ? (
          <div className="p-10 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Application Submitted!</h3>
            <p className="text-gray-500 text-sm">
              The organizer will review your application and you will be notified of the outcome.
            </p>
          </div>
        ) : (
          <>
            <div className="relative bg-gradient-to-br from-emerald-700 to-emerald-900 px-6 py-5 rounded-t-2xl">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-bold text-white mb-1">Apply to Program</h2>
              <p className="text-emerald-200 text-sm">{program.name}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-emerald-300">
                <span>by {program.org_name}</span>
                <span className="w-1 h-1 bg-emerald-400 rounded-full" />
                <span>{spots} spot{spots !== 1 ? 's' : ''} left</span>
                {program.start_date && (
                  <>
                    <span className="w-1 h-1 bg-emerald-400 rounded-full" />
                    <span>Starts {new Date(program.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </>
                )}
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              {profile && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-emerald-700 mb-1">Profile Auto-filled</p>
                  <p className="text-xs text-emerald-600">
                    Your existing profile details have been filled in. Please complete any missing fields marked with *.
                  </p>
                </div>
              )}

              {missingFields.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-800">Required fields missing</p>
                    <p className="text-xs text-amber-600">{missingFields.join(', ')}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  Full Name *
                </label>
                <input
                  type="text"
                  value={form.display_name}
                  onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Your full name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={form.phone_number}
                    onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="080xxxxxxxx"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    value={form.date_of_birth}
                    onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  State of Origin *
                </label>
                <div className="relative">
                  <select
                    value={form.state_of_origin}
                    onChange={(e) => setForm({ ...form, state_of_origin: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none"
                  >
                    <option value="">Select state...</option>
                    {NIGERIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">LGA</label>
                  <input
                    type="text"
                    value={form.lga}
                    onChange={(e) => setForm({ ...form, lga: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Local Government Area"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Location / Town</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Your town or city"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 mb-1.5 block flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                  Occupation *
                </label>
                <div className="relative">
                  <select
                    value={form.occupation}
                    onChange={(e) => setForm({ ...form, occupation: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none"
                  >
                    <option value="">Select occupation...</option>
                    {COMMON_OCCUPATIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {program.description && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-600 mb-1">About this program</p>
                  <p className="text-xs text-gray-500">{program.description}</p>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !canSubmit}
                className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
