interface ParticipantAvatarProps {
  avatarUrl: string | null;
  displayName: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-24 h-24 text-2xl',
};

function getInitials(name: string | null): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

const bgColors = [
  'bg-emerald-500', 'bg-amber-500', 'bg-sky-500', 'bg-rose-500',
  'bg-teal-500', 'bg-orange-500', 'bg-cyan-500', 'bg-green-600',
];

function getColorFromName(name: string | null): string {
  if (!name) return bgColors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return bgColors[Math.abs(hash) % bgColors.length];
}

export function ParticipantAvatar({ avatarUrl, displayName, size = 'md' }: ParticipantAvatarProps) {
  const sizeClass = sizeMap[size];

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={displayName || 'Participant'}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-white shadow-sm`}
      />
    );
  }

  return (
    <div className={`${sizeClass} rounded-full ${getColorFromName(displayName)} flex items-center justify-center font-bold text-white ring-2 ring-white shadow-sm`}>
      {getInitials(displayName)}
    </div>
  );
}
