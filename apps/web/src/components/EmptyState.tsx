import type { ReactNode } from 'react';
import Button from './Button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-20 px-6 text-center animate-spring-up glass-noise rounded-3xl border border-white/5 shadow-card ${className}`}
    >
      {icon ? (
        <div className="w-20 h-20 rounded-3xl bg-surface-800 border border-white/5 shadow-card flex items-center justify-center text-text-muted mb-6">
          {icon}
        </div>
      ) : (
        <div className="w-20 h-20 rounded-3xl bg-surface-800 border border-white/5 shadow-card flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
      )}

      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>

      {description && (
        <p className="text-base text-text-secondary max-w-sm mx-auto mb-8 leading-relaxed font-medium">{description}</p>
      )}

      {action && (
        <Button onClick={action.onClick} variant="primary" size="lg" className="shadow-[0_0_20px_rgba(6,182,212,0.3)]">
          {action.label}
        </Button>
      )}
    </div>
  );
}
