import { useState, useRef, useEffect } from 'react';
import { Filter, X, ChevronDown, Check } from 'lucide-react';
import {
  NIGERIAN_STATES, AGE_BRACKETS, COMMON_OCCUPATIONS,
  GENDERS, DISABILITIES, HEALTH_CHALLENGES
} from '../../data/nigerianStates';

export interface FilterValues {
  states: string[];
  ageBracket: string;
  occupation: string;
  gender: string;
  disability: string;
  healthChallenge: string;
  locationSearch: string;
}

interface ApplicantFiltersProps {
  filters: FilterValues;
  onChange: (filters: FilterValues) => void;
  matchCount: number;
  totalCount: number;
}

function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (val: string) => {
    onChange(
      selected.includes(val)
        ? selected.filter(s => s !== val)
        : [...selected, val]
    );
  };

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:border-emerald-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
      >
        <span className={selected.length > 0 ? 'text-gray-900' : 'text-gray-400'}>
          {selected.length === 0 ? `All ${label}` : `${selected.length} selected`}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {selected.length > 0 && (
            <button
              onClick={() => onChange([])}
              className="w-full text-left px-3 py-2 text-xs text-red-500 font-medium hover:bg-red-50 border-b border-gray-100"
            >
              Clear selection
            </button>
          )}
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => toggle(opt)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-emerald-50 transition-colors"
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                selected.includes(opt) ? 'bg-emerald-600 border-emerald-600' : 'border-gray-300'
              }`}>
                {selected.includes(opt) && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className={selected.includes(opt) ? 'font-medium text-gray-900' : 'text-gray-700'}>{opt}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ApplicantFilters({ filters, onChange, matchCount, totalCount }: ApplicantFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeCount =
    (filters.states.length > 0 ? 1 : 0) +
    (filters.ageBracket ? 1 : 0) +
    (filters.occupation ? 1 : 0) +
    (filters.gender ? 1 : 0) +
    (filters.disability ? 1 : 0) +
    (filters.healthChallenge ? 1 : 0) +
    (filters.locationSearch ? 1 : 0);

  const hasActiveFilters = activeCount > 0;

  const clearFilters = () => {
    onChange({
      states: [], ageBracket: '', occupation: '',
      gender: '', disability: '', healthChallenge: '', locationSearch: ''
    });
  };

  return (
    <div className="mb-4">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            isOpen || hasActiveFilters
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'
          }`}
        >
          <Filter className="w-4 h-4" />
          Select by Preference
          {hasActiveFilters && (
            <span className="bg-emerald-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <>
            <span className="text-sm text-gray-500">
              Showing <span className="font-semibold text-emerald-600">{matchCount}</span> of {totalCount}
            </span>
            <button
              onClick={clearFilters}
              className="text-sm text-red-500 hover:text-red-700 font-medium inline-flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          </>
        )}
      </div>

      {isOpen && (
        <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <MultiSelectDropdown
              label="State of Origin"
              options={NIGERIAN_STATES}
              selected={filters.states}
              onChange={(states) => onChange({ ...filters, states })}
            />

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Gender</label>
              <select
                value={filters.gender}
                onChange={(e) => onChange({ ...filters, gender: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">All Genders</option>
                {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Age Bracket</label>
              <select
                value={filters.ageBracket}
                onChange={(e) => onChange({ ...filters, ageBracket: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">All Ages</option>
                {AGE_BRACKETS.map(b => <option key={b.label} value={b.label}>{b.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Occupation</label>
              <select
                value={filters.occupation}
                onChange={(e) => onChange({ ...filters, occupation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">All Occupations</option>
                {COMMON_OCCUPATIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Disability</label>
              <select
                value={filters.disability}
                onChange={(e) => onChange({ ...filters, disability: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">All</option>
                {DISABILITIES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Health Challenge</label>
              <select
                value={filters.healthChallenge}
                onChange={(e) => onChange({ ...filters, healthChallenge: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">All</option>
                {HEALTH_CHALLENGES.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Location Search</label>
            <input
              type="text"
              value={filters.locationSearch}
              onChange={(e) => onChange({ ...filters, locationSearch: e.target.value })}
              placeholder="Search by LGA or location..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
