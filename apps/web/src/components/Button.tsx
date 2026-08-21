import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  iconOnly?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, iconOnly, children, className = '', disabled, ...props }, ref) => {
    const base =
      'magnetic-button inline-flex items-center justify-center font-medium rounded-[var(--radius-md)] focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-300';

    const variants = {
      primary:
        'bg-accent text-white hover:bg-accent-light shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.5)] border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]',
      secondary:
        'bg-surface-700 text-text-primary border border-white/10 hover:bg-surface-600 hover:border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]',
      ghost:
        'bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-800',
      danger:
        'bg-status-error/10 text-status-error border border-status-error/30 hover:bg-status-error/20 hover:shadow-[0_0_20px_rgba(244,63,94,0.2)]',
    };

    const sizes = iconOnly
      ? {
          sm: 'w-7 h-7',
          md: 'w-9 h-9',
          lg: 'w-11 h-11',
        }
      : {
          sm: 'text-sm px-3 py-1.5 gap-1.5',
          md: 'text-sm px-4 py-2.5 gap-2',
          lg: 'text-base px-6 py-3 gap-2.5',
        };

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {!iconOnly && children}
      </button>
    );
  },
);

Button.displayName = 'Button';
export default Button;
