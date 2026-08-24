'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRoomContext } from '@livekit/components-react';

interface FocusModeProps {
  isOpen: boolean;
  onClose: () => void;
}

type FocusPreset = 'none' | 'deep-work' | 'presentation' | 'listening';

interface FocusConfig {
  label: string;
  icon: string;
  description: string;
  hideChat: boolean;
  hideReactions: boolean;
  muteNotifications: boolean;
  dimInactiveTiles: boolean;
  autoMute: boolean;
}

const PRESETS: Record<FocusPreset, FocusConfig> = {
  'none': {
    label: 'Normal Mode',
    icon: '🌐',
    description: 'All features active. Full engagement.',
    hideChat: false,
    hideReactions: false,
    muteNotifications: false,
    dimInactiveTiles: false,
    autoMute: false,
  },
  'deep-work': {
    label: 'Deep Work',
    icon: '🧠',
    description: 'Minimal distractions. Mute yourself, hide reactions & chat.',
    hideChat: true,
    hideReactions: true,
    muteNotifications: true,
    dimInactiveTiles: true,
    autoMute: true,
  },
  'presentation': {
    label: 'Presenter Mode',
    icon: '🎤',
    description: 'Focus on the active speaker. Dim inactive tiles.',
    hideChat: false,
    hideReactions: false,
    muteNotifications: true,
    dimInactiveTiles: true,
    autoMute: false,
  },
  'listening': {
    label: 'Listener Mode',
    icon: '👂',
    description: 'Stay muted. Minimize visual noise. Absorb the conversation.',
    hideChat: true,
    hideReactions: false,
    muteNotifications: true,
    dimInactiveTiles: false,
    autoMute: true,
  },
};

declare global {
  interface Window {
    __quorumFocusMode?: FocusPreset;
    __quorumFocusConfig?: FocusConfig;
  }
}

export default function FocusMode({ isOpen, onClose }: FocusModeProps) {
  const room = useRoomContext();
  const [activePreset, setActivePreset] = useState<FocusPreset>('none');
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const applyPreset = useCallback((preset: FocusPreset) => {
    setActivePreset(preset);
    const config = PRESETS[preset];

    // Apply global state via CSS custom properties & data attributes
    if (config.dimInactiveTiles) {
      document.documentElement.setAttribute('data-focus-dim', 'true');
    } else {
      document.documentElement.removeAttribute('data-focus-dim');
    }

    if (config.hideReactions) {
      document.documentElement.setAttribute('data-focus-no-reactions', 'true');
    } else {
      document.documentElement.removeAttribute('data-focus-no-reactions');
    }

    // Store globally for other components to check
    window.__quorumFocusMode = preset;
    window.__quorumFocusConfig = config;

    // Auto-mute if needed
    if (config.autoMute && room.localParticipant.isMicrophoneEnabled) {
      room.localParticipant.setMicrophoneEnabled(false);
    }
  }, [room]);

  // Pomodoro timer
  const startPomodoro = () => {
    setPomodoroActive(true);
    setPomodoroTimeLeft(pomodoroMinutes * 60);
  };

  const stopPomodoro = () => {
    setPomodoroActive(false);
    setPomodoroTimeLeft(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (pomodoroActive && pomodoroTimeLeft > 0) {
      timerRef.current = setInterval(() => {
        setPomodoroTimeLeft(prev => {
          if (prev <= 1) {
            setPomodoroActive(false);
            // Play notification sound
            try {
              const ctx = new AudioContext();
              const osc = ctx.createOscillator();
              osc.frequency.value = 880;
              osc.connect(ctx.destination);
              osc.start();
              osc.stop(ctx.currentTime + 0.3);
              setTimeout(() => ctx.close(), 500);
            } catch {}
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [pomodoroActive, pomodoroTimeLeft]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.documentElement.removeAttribute('data-focus-dim');
      document.documentElement.removeAttribute('data-focus-no-reactions');
    };
  }, []);

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface-900 border border-white/10 rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-surface-800/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🎯</span> Focus Mode
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-white hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Preset Cards */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Focus Presets</h3>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(PRESETS) as [FocusPreset, FocusConfig][]).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key)}
                  className={`p-4 rounded-xl border text-left transition-all duration-300 ${
                    activePreset === key
                      ? 'bg-accent/15 border-accent/40 shadow-[0_0_20px_rgba(6,182,212,0.1)]'
                      : 'bg-surface-800 border-white/5 hover:border-white/15 hover:bg-surface-700'
                  }`}
                >
                  <span className="text-2xl block mb-2">{config.icon}</span>
                  <span className={`text-sm font-bold block mb-1 ${activePreset === key ? 'text-accent-light' : 'text-white'}`}>
                    {config.label}
                  </span>
                  <span className="text-xs text-text-muted leading-relaxed block">{config.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active config details */}
          {activePreset !== 'none' && (
            <div className="bg-surface-800/50 rounded-xl p-4 border border-white/5 animate-fade-in">
              <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Active Rules</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {PRESETS[activePreset].hideChat && (
                  <div className="flex items-center gap-2 text-yellow-400"><span>🚫</span> Chat hidden</div>
                )}
                {PRESETS[activePreset].hideReactions && (
                  <div className="flex items-center gap-2 text-yellow-400"><span>🚫</span> Reactions hidden</div>
                )}
                {PRESETS[activePreset].muteNotifications && (
                  <div className="flex items-center gap-2 text-yellow-400"><span>🔕</span> Notifications muted</div>
                )}
                {PRESETS[activePreset].dimInactiveTiles && (
                  <div className="flex items-center gap-2 text-cyan-400"><span>🌑</span> Inactive tiles dimmed</div>
                )}
                {PRESETS[activePreset].autoMute && (
                  <div className="flex items-center gap-2 text-red-400"><span>🔇</span> Auto-muted</div>
                )}
              </div>
            </div>
          )}

          {/* Pomodoro Timer */}
          <div className="bg-surface-800/50 rounded-xl p-4 border border-white/5">
            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">🍅 Focus Timer (Pomodoro)</h4>
            {pomodoroActive ? (
              <div className="text-center">
                <div className="text-4xl font-mono font-black text-white mb-3">{formatTime(pomodoroTimeLeft)}</div>
                <button
                  onClick={stopPomodoro}
                  className="px-5 py-2 rounded-full bg-status-error/20 text-status-error border border-status-error/30 text-sm font-medium hover:bg-status-error/30 transition-all"
                >
                  Stop Timer
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 justify-center">
                <select
                  value={pomodoroMinutes}
                  onChange={e => setPomodoroMinutes(Number(e.target.value))}
                  className="bg-surface-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-accent"
                >
                  <option value={5}>5 min</option>
                  <option value={15}>15 min</option>
                  <option value={25}>25 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                </select>
                <button
                  onClick={startPomodoro}
                  className="px-5 py-2 rounded-full bg-accent text-white text-sm font-medium hover:bg-accent-dark shadow-glow transition-all"
                >
                  Start Focus Timer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
