import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface ProfileFormSectionProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  completionCount?: number;
  totalFields?: number;
}

export function ProfileFormSection({ title, icon, children, defaultOpen = true, completionCount, totalFields }: ProfileFormSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  const pct = completionCount !== undefined && totalFields ? Math.round((completionCount / totalFields) * 100) : null;

  return (
    <div className="bg-white rounded-xl border border-earth-200/60 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-earth-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            {icon}
          </div>
          <h3 className="font-semibold text-earth-900 text-sm">{title}</h3>
        </div>
        <div className="flex items-center gap-3">
          {pct !== null && (
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-earth-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-emerald-500' : 'bg-amber-400'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className={`text-[10px] font-semibold ${pct === 100 ? 'text-emerald-600' : 'text-earth-400'}`}>
                {pct}%
              </span>
            </div>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-earth-400" /> : <ChevronDown className="w-4 h-4 text-earth-400" />}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-earth-100">
          {children}
        </div>
      )}
    </div>
  );
}
