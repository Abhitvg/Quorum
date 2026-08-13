'use client';

import { useEffect, useState, useRef } from 'react';
import Logo from '@/components/Logo';

interface MeetingHeaderProps {
  title: string;
  participantCount: number;
  isRecording?: boolean;
  isScreenSharing?: boolean;
  onToggleParticipants: () => void;
  onToggleTranscript?: () => void;
}

export default function MeetingHeader({
  title,
  participantCount,
  isRecording = false,
  isScreenSharing = false,
  onToggleParticipants,
  onToggleTranscript,
}: MeetingHeaderProps) {
  const [elapsed, setElapsed] = useState(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
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
    <header className="h-14 border-b border-border-subtle flex items-center justify-between px-4 bg-surface-900/50 backdrop-blur-md relative z-10 shrink-0">
      <div className="flex items-center gap-4">
        <Logo />
        <div className="w-px h-4 bg-border-medium" />
        <h1 className="font-medium text-text-primary text-sm truncate max-w-[200px] sm:max-w-md">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Elapsed time */}
        <span className="text-xs font-mono text-text-muted tabular-nums">
          {formatTime(elapsed)}
        </span>

        {/* Recording indicator */}
        {isRecording && (
          <span className="text-xs font-medium px-2 py-1 rounded bg-status-error/10 text-status-error border border-status-error/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-status-error animate-pulse" />
            REC
          </span>
        )}

        {/* Screen share indicator */}
        {isScreenSharing && (
          <span className="text-xs font-medium px-2 py-1 rounded bg-accent/10 text-accent-light border border-accent/20 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Sharing
          </span>
        )}

        {/* Live badge */}
        <span className="text-xs font-medium px-2 py-1 rounded bg-status-live/10 text-status-live border border-status-live/20 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-status-live animate-pulse" />
          Live
        </span>

        {/* Participant count (clickable) */}
        <button
          onClick={onToggleParticipants}
          className="text-xs font-medium px-2 py-1 rounded bg-surface-700 text-text-secondary border border-border-medium hover:border-border-accent hover:text-text-primary transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          {participantCount}
        </button>
      </div>
    </header>
  );
}
