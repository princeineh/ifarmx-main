import { useState } from 'react';
import { CheckSquare, Square, User, Star, MapPin, Briefcase, Calendar, Eye } from 'lucide-react';

export interface ApplicantRow {
  application_id: string;
  user_id: string;
  display_name: string | null;
  email: string;
  state_of_origin: string | null;
  lga: string | null;
  location: string | null;
  date_of_birth: string | null;
  occupation: string | null;
  gender: string | null;
  disabilities: string | null;
  health_challenge: string | null;
  applied_at: string;
  status: string;
  is_platform_user: boolean;
  has_plants: boolean;
  requested_kits: number;
}

interface ApplicantListProps {
  applicants: ApplicantRow[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onViewApplicant: (applicant: ApplicantRow) => void;
}

function getAge(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

export function ApplicantList({ applicants, selectedIds, onToggleSelect, onSelectAll, onDeselectAll, onViewApplicant }: ApplicantListProps) {
  const [sortBy, setSortBy] = useState<'platform' | 'date' | 'name'>('platform');
  const allSelected = applicants.length > 0 && applicants.every(a => selectedIds.has(a.application_id));

  const sorted = [...applicants].sort((a, b) => {
    if (sortBy === 'platform') {
      if (a.is_platform_user !== b.is_platform_user) return a.is_platform_user ? -1 : 1;
      if (a.has_plants !== b.has_plants) return a.has_plants ? -1 : 1;
      return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime();
    }
    if (sortBy === 'name') return (a.display_name || '').localeCompare(b.display_name || '');
    return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime();
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-emerald-600"
          >
            {allSelected ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4" />}
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
          {selectedIds.size > 0 && (
            <span className="text-sm text-emerald-600 font-semibold">{selectedIds.size} selected</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="text-xs border border-gray-200 rounded-md px-2 py-1 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="platform">Platform Users First</option>
            <option value="date">Application Date</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {sorted.map((applicant) => {
          const isSelected = selectedIds.has(applicant.application_id);
          const age = getAge(applicant.date_of_birth);

          return (
            <div
              key={applicant.application_id}
              onClick={() => onToggleSelect(applicant.application_id)}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'border-emerald-400 bg-emerald-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex-shrink-0">
                {isSelected ? (
                  <CheckSquare className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Square className="w-5 h-5 text-gray-400" />
                )}
              </div>

              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-100 to-amber-100 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-emerald-700" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 text-sm truncate">
                    {applicant.display_name || 'Unknown User'}
                  </span>
                  {applicant.is_platform_user && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-100 text-amber-700">
                      <Star className="w-3 h-3" /> Active User
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">{applicant.email}</p>
              </div>

              <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500 flex-shrink-0">
                {applicant.state_of_origin && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {applicant.state_of_origin}
                    {applicant.lga && `, ${applicant.lga}`}
                  </span>
                )}
                {age && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {age}yrs
                  </span>
                )}
                {applicant.occupation && (
                  <span className="inline-flex items-center gap-1">
                    <Briefcase className="w-3 h-3" />
                    {applicant.occupation}
                  </span>
                )}
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); onViewApplicant(applicant); }}
                className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex-shrink-0"
                title="View farming stats"
              >
                <Eye className="w-4 h-4" />
              </button>

              <div className="text-xs text-gray-400 flex-shrink-0">
                {new Date(applicant.applied_at).toLocaleDateString()}
              </div>
            </div>
          );
        })}

        {sorted.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <User className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No applicants match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
