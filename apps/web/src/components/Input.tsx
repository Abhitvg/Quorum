import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-4 py-2.5 rounded-[var(--radius-md)]
            bg-surface-800 border border-border-medium
            text-text-primary placeholder:text-text-muted
            transition-all duration-200
            hover:border-border-accent
            focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30
            ${error ? 'border-status-error focus:border-status-error focus:ring-status-error/30' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="text-xs text-status-error">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
export default Input;
