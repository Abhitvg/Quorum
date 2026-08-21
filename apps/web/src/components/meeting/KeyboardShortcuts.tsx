'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRoomContext } from '@livekit/components-react';

interface ShortcutDef {
  key: string;
  label: string;
  description: string;
  action: () => void;
}

interface QuorumWindow extends Window {
  __quorumToggleHand?: () => void;
  __quorumToggleChat?: () => void;
  __quorumToggleNotes?: () => void;
}

export default function KeyboardShortcuts() {
  const room = useRoomContext();
  const [showOverlay, setShowOverlay] = useState(false);

  const shortcuts: ShortcutDef[] = useMemo(() => [
    {
      key: 'm',
      label: 'M',
      description: 'Toggle microphone',
      action: () => {
        room.localParticipant.setMicrophoneEnabled(
          !room.localParticipant.isMicrophoneEnabled
        );
      },
    },
    {
      key: 'v',
      label: 'V',
      description: 'Toggle camera',
      action: () => {
        room.localParticipant.setCameraEnabled(
          !room.localParticipant.isCameraEnabled
        );
      },
    },
    {
      key: 's',
      label: 'S',
      description: 'Toggle screen share',
      action: () => {
        if (room.localParticipant.isScreenShareEnabled) {
          room.localParticipant.setScreenShareEnabled(false);
        } else {
          room.localParticipant.setScreenShareEnabled(true);
        }
      },
    },
    {
      key: 'h',
      label: 'H',
      description: 'Raise / lower hand',
      action: () => {
        if (typeof (window as unknown as QuorumWindow).__quorumToggleHand === 'function') {
          (window as unknown as QuorumWindow).__quorumToggleHand!();
        }
      },
    },
    {
      key: 'c',
      label: 'C',
      description: 'Toggle chat',
      action: () => {
        if (typeof (window as unknown as QuorumWindow).__quorumToggleChat === 'function') {
          (window as unknown as QuorumWindow).__quorumToggleChat!();
        }
      },
    },
    {
      key: 'n',
      label: 'N',
      description: 'Toggle notes',
      action: () => {
        if (typeof (window as unknown as QuorumWindow).__quorumToggleNotes === 'function') {
          (window as unknown as QuorumWindow).__quorumToggleNotes!();
        }
      },
    },
    {
      key: 'escape',
      label: 'Esc',
      description: 'Close modals',
      action: () => {
        setShowOverlay(false);
      },
    },
  ], [room]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    // Show/hide shortcut overlay
    if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
      e.preventDefault();
      setShowOverlay(prev => !prev);
      return;
    }

    const shortcut = shortcuts.find(s => s.key === e.key.toLowerCase());
    if (shortcut) {
      e.preventDefault();
      shortcut.action();
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!showOverlay) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowOverlay(false)} />
      <div className="relative w-full max-w-md bg-surface-900 border border-white/10 rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 bg-surface-800/50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              ⌨️ Keyboard Shortcuts
            </h2>
            <button 
              onClick={() => setShowOverlay(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-white hover:bg-white/10 transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-text-muted mt-1">Press <kbd className="shortcut-key">?</kbd> to toggle this overlay</p>
        </div>

        {/* Shortcuts Grid */}
        <div className="p-5 space-y-2">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.key}
              className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <kbd className="shortcut-key text-xs px-2 py-1 min-w-[28px] text-center group-hover:bg-accent/10 group-hover:text-accent-light group-hover:border-accent/30 transition-all">
                  {shortcut.label}
                </kbd>
                <span className="text-sm text-text-secondary group-hover:text-white transition-colors">
                  {shortcut.description}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 text-center">
          <p className="text-xs text-text-muted">Shortcuts are disabled when typing in inputs</p>
        </div>
      </div>
    </div>
  );
}
