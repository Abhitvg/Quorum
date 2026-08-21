import type { ReactNode } from 'react';

type BadgeVariant = 'live' | 'host' | 'you' | 'recording' | 'sharing' | 'default' | 'accent';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  icon?: ReactNode;
  pulse?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  live: 'bg-status-live/10 text-status-live border-status-live/20',
  host: 'bg-status-live/10 text-status-live border-status-live/20',
  you: 'bg-accent/10 text-accent-light border-accent/20',
  recording: 'bg-status-error/10 text-status-error border-status-error/20',
  sharing: 'bg-accent/10 text-accent-light border-accent/20',
  default: 'bg-surface-700 text-text-secondary border-border-medium',
  accent: 'bg-accent/10 text-accent-light border-accent/20',
};

export default function Badge({
  variant = 'default',
  children,
  icon,
  pulse = false,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md border
        ${variantStyles[variant]}
        ${className}`}
    >
      {pulse && (
        <span
          className={`w-1.5 h-1.5 rounded-full animate-pulse ${
            variant === 'live' || variant === 'host'
              ? 'bg-status-live'
              : variant === 'recording'
                ? 'bg-status-error'
                : 'bg-accent-light'
          }`}
        />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
