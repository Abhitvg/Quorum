interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string;
  height?: string;
  lines?: number;
}

export default function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  lines = 1,
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`animate-shimmer rounded h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
            style={{ width: i === lines - 1 ? '75%' : width }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`animate-shimmer ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
    />
  );
}

/* Pre-built skeleton patterns */

export function SkeletonMeetingCard() {
  return (
    <div className="glass-noise rounded-2xl p-5 flex items-center justify-between border border-white/5">
      <div className="flex items-center gap-5 flex-1 min-w-0">
        <Skeleton variant="circular" width="56px" height="56px" />
        <div className="flex-1">
          <Skeleton variant="text" width="60%" height="20px" className="mb-2" />
          <Skeleton variant="text" width="40%" height="14px" />
        </div>
      </div>
      <Skeleton variant="rectangular" width="100px" height="36px" className="rounded-lg" />
    </div>
  );
}

export function SkeletonParticipant() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <Skeleton variant="circular" width="32px" height="32px" />
      <Skeleton variant="text" width="120px" height="14px" />
    </div>
  );
}
