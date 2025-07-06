'use client';

import { useUser } from '../../contexts/stream';

interface AvatarProps {
  userId?: string;
  userName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

// Array of colors for different user initials
const avatarColors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-red-500',
  'bg-yellow-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-cyan-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-lime-500',
  'bg-sky-500',
  'bg-fuchsia-500',
  'bg-slate-500',
  'bg-gray-500',
  'bg-zinc-500',
  'bg-neutral-500',
  'bg-stone-500',
];

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg'
};

export function Avatar({ userId, userName, size = 'md', className = '' }: AvatarProps) {
  const { getUserInitials } = useUser();

  // Generate initials from userName or userId
  const getInitials = () => {
    if (userName) {
      return getUserInitials(userName);
    }
    if (userId) {
      return userId.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Generate color based on initials
  const getColor = () => {
    const initials = getInitials();
    const charCode = initials.charCodeAt(0);
    const colorIndex = charCode % avatarColors.length;
    return avatarColors[colorIndex];
  };

  const initials = getInitials();
  const colorClass = getColor();

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full ${colorClass} flex items-center justify-center text-white font-semibold ${className}`}
      title={userName || userId || 'Unknown User'}
    >
      {initials}
    </div>
  );
} 