'use client';

import { useEffect, useRef, type ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 bg-transparent m-0 p-0 w-full h-full max-w-none max-h-none"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md animate-backdrop-in" />

      {/* Content */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div
          ref={contentRef}
          className={`w-full ${sizeClasses[size]} glass-noise rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/10 animate-spring-up overflow-hidden relative`}
        >
          {/* Ambient mesh background inside modal */}
          <div className="absolute inset-0 bg-mesh opacity-10 pointer-events-none" />

          {/* Header */}
          {title && (
            <div className="flex items-center justify-between px-8 pt-8 pb-2 relative z-10">
              <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-text-muted hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Body */}
          <div className="p-8 relative z-10">
            {children}
          </div>
        </div>
      </div>
    </dialog>
  );
}
