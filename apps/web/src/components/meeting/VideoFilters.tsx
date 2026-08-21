'use client';

import { useState, useEffect, useCallback } from 'react';

type FilterType = 'none' | 'blur-light' | 'blur-heavy' | 'grayscale' | 'sepia' | 'contrast' | 'warm' | 'cool';

interface FilterOption {
  id: FilterType;
  label: string;
  icon: string;
  css: string;
}

declare global {
  interface Window {
    __quorumVideoFilter?: string;
  }
}

const FILTERS: FilterOption[] = [
  { id: 'none', label: 'None', icon: '🚫', css: '' },
  { id: 'blur-light', label: 'Soft Focus', icon: '🌫️', css: 'blur(2px)' },
  { id: 'blur-heavy', label: 'Heavy Blur', icon: '💨', css: 'blur(6px)' },
  { id: 'grayscale', label: 'B&W', icon: '🖤', css: 'grayscale(100%)' },
  { id: 'sepia', label: 'Vintage', icon: '🎞️', css: 'sepia(80%)' },
  { id: 'contrast', label: 'High Contrast', icon: '🌓', css: 'contrast(150%) saturate(120%)' },
  { id: 'warm', label: 'Warm', icon: '🔥', css: 'sepia(30%) saturate(140%) hue-rotate(-10deg)' },
  { id: 'cool', label: 'Cool', icon: '🧊', css: 'saturate(80%) hue-rotate(15deg) brightness(105%)' },
];

export default function VideoFilters({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('none');

  const applyFilter = useCallback((filter: FilterType) => {
    setActiveFilter(filter);
    const filterCss = FILTERS.find(f => f.id === filter)?.css || '';
    
    // Apply CSS filter to all local video elements
    document.querySelectorAll('[data-lk-local-participant] video').forEach((el) => {
      (el as HTMLElement).style.filter = filterCss;
    });

    // Also set a global CSS variable for any custom renderers
    document.documentElement.style.setProperty('--quorum-video-filter', filterCss || 'none');
    
    // Store preference
    window.__quorumVideoFilter = filterCss;
  }, []);

  // Apply filter to new video elements that appear
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const filterCss = FILTERS.find(f => f.id === activeFilter)?.css || '';
      document.querySelectorAll('[data-lk-local-participant] video').forEach((el) => {
        (el as HTMLElement).style.filter = filterCss;
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [activeFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface-900 border border-white/10 rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-surface-800/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🎨</span> Video Filters
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-white hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Filter Grid */}
        <div className="p-6">
          <div className="grid grid-cols-4 gap-3">
            {FILTERS.map(filter => (
              <button
                key={filter.id}
                onClick={() => applyFilter(filter.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-300 ${
                  activeFilter === filter.id
                    ? 'bg-accent/20 border-accent/40 shadow-[0_0_15px_rgba(6,182,212,0.15)] scale-105'
                    : 'bg-surface-800 border-white/5 hover:border-white/15 hover:bg-surface-700'
                }`}
              >
                <span className="text-2xl">{filter.icon}</span>
                <span className={`text-xs font-medium ${
                  activeFilter === filter.id ? 'text-accent-light' : 'text-text-muted'
                }`}>
                  {filter.label}
                </span>
              </button>
            ))}
          </div>

          {activeFilter !== 'none' && (
            <div className="mt-4 text-center">
              <p className="text-xs text-text-muted">
                Filter applied to your camera feed. Others see the original video.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
