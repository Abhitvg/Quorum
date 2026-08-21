import Image from 'next/image';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showOnline?: boolean;
  className?: string;
}

const sizeMap = {
  xs: { container: 'w-6 h-6', px: 24, online: 'w-1.5 h-1.5 border' },
  sm: { container: 'w-8 h-8', px: 32, online: 'w-2 h-2 border' },
  md: { container: 'w-10 h-10', px: 40, online: 'w-2.5 h-2.5 border-2' },
  lg: { container: 'w-12 h-12', px: 48, online: 'w-3 h-3 border-2' },
  xl: { container: 'w-16 h-16', px: 64, online: 'w-3.5 h-3.5 border-2' },
  '2xl': { container: 'w-24 h-24', px: 96, online: 'w-5 h-5 border-[3px]' },
};

export default function Avatar({
  name,
  src,
  size = 'md',
  showOnline = false,
  className = '',
}: AvatarProps) {
  const s = sizeMap[size];

  // If no src is provided, we use the DiceBear API to generate a beautiful glassmorphic avatar
  // based deterministically on the user's name.
  const avatarSrc = src || `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(name)}`;

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {src ? (
        <Image
          src={avatarSrc}
          alt={name}
          width={s.px}
          height={s.px}
          className={`${s.container} rounded-full object-cover border border-border-medium`}
        />
      ) : (
        // For external DiceBear SVGs, we use a standard img tag to avoid Next.js domain config requirements
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={avatarSrc}
          alt={name}
          className={`${s.container} rounded-full object-cover border border-white/10 shadow-sm bg-surface-800`}
          width={s.px}
          height={s.px}
        />
      )}
      {showOnline && (
        <span
          className={`absolute bottom-0 right-0 ${s.online} rounded-full bg-status-live border-surface-900`}
        />
      )}
    </div>
  );
}
