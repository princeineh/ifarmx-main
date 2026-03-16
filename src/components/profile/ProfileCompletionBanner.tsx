import { CheckCircle, AlertCircle } from 'lucide-react';
import type { UserProfile } from '../../types/database';

interface ProfileCompletionBannerProps {
  profile: UserProfile;
}

const FIELDS: (keyof UserProfile)[] = [
  'display_name', 'phone_number', 'gender', 'date_of_birth',
  'state_of_origin', 'lga', 'location', 'occupation',
  'avatar_url',
];

export function getCompletionStats(profile: UserProfile) {
  const filled = FIELDS.filter(f => {
    const val = profile[f];
    return val !== null && val !== undefined && val !== '';
  }).length;
  return { filled, total: FIELDS.length, pct: Math.round((filled / FIELDS.length) * 100) };
}

export function ProfileCompletionBanner({ profile }: ProfileCompletionBannerProps) {
  const { filled, total, pct } = getCompletionStats(profile);
  const isComplete = pct === 100;

  return (
    <div className={`rounded-xl p-4 border ${isComplete ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
      <div className="flex items-center gap-3">
        {isComplete ? (
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
        ) : (
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${isComplete ? 'text-emerald-800' : 'text-amber-800'}`}>
            {isComplete ? 'Profile Complete' : `Profile ${pct}% Complete`}
          </p>
          <p className={`text-xs mt-0.5 ${isComplete ? 'text-emerald-600' : 'text-amber-600'}`}>
            {isComplete
              ? 'Great job! Your profile is fully filled out.'
              : `${filled} of ${total} key fields completed. Fill in the rest to get the most out of iFarm.`
            }
          </p>
        </div>
      </div>
      {!isComplete && (
        <div className="mt-3 w-full h-2 bg-amber-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
