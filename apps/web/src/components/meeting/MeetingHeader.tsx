'use client';

import { useEffect, useState, useRef } from 'react';
import Logo from '@/components/Logo';
import Tooltip from '@/components/Tooltip';

interface MeetingHeaderProps {
  title: string;
  participantCount: number;
  isRecording?: boolean;
  isScreenSharing?: boolean;
  onToggleParticipants: () => void;
}

export default function MeetingHeader({
  title,
  participantCount,
  isRecording = false,
  isScreenSharing = false,
  onToggleParticipants,
}: MeetingHeaderProps) {
  const [elapsed, setElapsed] = useState(0);
  const startTime = useRef<number>(null);

  useEffect(() => {
    startTime.current = Date.now();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (startTime.current) {
        setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-surface-900/60 backdrop-blur-2xl relative z-10 shrink-0 animate-slide-down">
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/60 to-transparent" />
      
      <div className="flex items-center gap-5 min-w-0 relative z-10">
        <Logo size="sm" showText={false} />
        <div className="w-px h-5 bg-white/10 shrink-0" />
        <Tooltip content={title}>
          <div className="flex flex-col">
            <h1 className="font-semibold text-white text-sm truncate max-w-[150px] sm:max-w-xs md:max-w-md tracking-wide">
              {title}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-accent-light font-mono bg-accent/10 px-1.5 py-0.5 rounded-sm border border-accent/20 flex items-center gap-1">
                🔒 E2EE
              </span>
              {/* Elapsed time */}
              <span className="text-[10px] font-mono text-text-muted tabular-nums">
                {formatTime(elapsed)}
              </span>
            </div>
          </div>
        </Tooltip>
      </div>

      <div className="flex items-center gap-3 relative z-10">
        {/* Indicators Area */}
        <div className="flex items-center gap-2 bg-surface-800/50 rounded-full px-2 py-1 border border-white/5">
          {/* Recording indicator */}
          {isRecording && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-status-error/10 text-status-error rounded-full border border-status-error/20">
              <span className="w-1.5 h-1.5 rounded-full bg-status-error animate-pulse" />
              <span className="text-[10px] font-bold tracking-wider uppercase">REC</span>
            </div>
          )}

          {/* Screen share indicator */}
          {isScreenSharing && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-[10px] font-bold tracking-wider uppercase">Sharing</span>
            </div>
          )}

          {/* Live badge */}
          <div className="flex items-center gap-1.5 px-2 py-1 text-status-live">
            <span className="w-1.5 h-1.5 rounded-full bg-status-live animate-pulse" />
            <span className="text-[10px] font-bold tracking-wider uppercase">Live</span>
          </div>

          {/* Connection quality */}
          <Tooltip content="Connection: Excellent">
            <div className="flex items-end gap-[2px] h-3.5 px-2 border-l border-white/10 ml-1">
              <span className="w-[3px] h-[5px] rounded-sm bg-status-live" />
              <span className="w-[3px] h-[8px] rounded-sm bg-status-live" />
              <span className="w-[3px] h-[11px] rounded-sm bg-status-live" />
              <span className="w-[3px] h-[14px] rounded-sm bg-status-live" />
            </div>
          </Tooltip>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Fullscreen Toggle */}
          <Tooltip content="Toggle Fullscreen">
            <button
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen();
                } else {
                  document.exitFullscreen();
                }
              }}
              className="w-9 h-9 rounded-xl bg-surface-800 text-text-secondary border border-white/10 hover:border-white/30 hover:bg-white/5 hover:text-white transition-all flex items-center justify-center cursor-pointer hover-lift group"
            >
              <svg className="w-4 h-4 group-active:scale-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </Tooltip>

          {/* Participant count */}
          <Tooltip content="Participants">
            <button
              onClick={onToggleParticipants}
              className="h-9 px-3 rounded-xl bg-surface-800 text-text-secondary border border-white/10 hover:border-white/30 hover:bg-white/5 hover:text-white transition-all flex items-center gap-2 cursor-pointer hover-lift group"
            >
              <svg className="w-4 h-4 group-active:scale-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="font-semibold text-sm">{participantCount}</span>
            </button>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}
