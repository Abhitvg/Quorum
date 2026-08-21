'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent, Participant, RemoteParticipant } from 'livekit-client';

interface HandRaiseEntry {
  identity: string;
  name: string;
  timestamp: number;
}

interface HandRaiseQueueProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HandRaiseQueue({ isOpen, onClose }: HandRaiseQueueProps) {
  const room = useRoomContext();
  const [queue, setQueue] = useState<HandRaiseEntry[]>([]);
  const [localRaised, setLocalRaised] = useState(false);

  useEffect(() => {
    const handleData = (payload: Uint8Array, participant?: RemoteParticipant) => {
      try {
        const decoded = new TextDecoder().decode(payload);
        const parsed = JSON.parse(decoded);
        
        if (parsed.type === 'hand-raise' && participant) {
          setQueue(prev => {
            const exists = prev.find(e => e.identity === participant.identity);
            if (exists) return prev;
            return [...prev, {
              identity: participant.identity,
              name: participant.name || participant.identity,
              timestamp: Date.now(),
            }];
          });
        }
        
        if (parsed.type === 'hand-lower' && participant) {
          setQueue(prev => prev.filter(e => e.identity !== participant.identity));
        }
      } catch {}
    };

    const handleDisconnect = (participant: Participant) => {
      setQueue(prev => prev.filter(e => e.identity !== participant.identity));
    };

    room.on(RoomEvent.DataReceived, handleData);
    room.on(RoomEvent.ParticipantDisconnected, handleDisconnect);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
      room.off(RoomEvent.ParticipantDisconnected, handleDisconnect);
    };
  }, [room]);

  const toggleHand = useCallback(() => {
    const type = localRaised ? 'hand-lower' : 'hand-raise';
    const payload = JSON.stringify({ type });
    const data = new TextEncoder().encode(payload);
    room.localParticipant.publishData(data, { reliable: true });

    if (localRaised) {
      setQueue(prev => prev.filter(e => e.identity !== room.localParticipant.identity));
    } else {
      setQueue(prev => {
        const exists = prev.find(e => e.identity === room.localParticipant.identity);
        if (exists) return prev;
        return [...prev, {
          identity: room.localParticipant.identity,
          name: room.localParticipant.name || room.localParticipant.identity,
          timestamp: Date.now(),
        }];
      });
    }
    setLocalRaised(!localRaised);
  }, [room, localRaised]);

  // Expose toggle for MeetingControls
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__quorumToggleHand = toggleHand;
    (window as unknown as Record<string, unknown>).__quorumHandRaised = localRaised;
    return () => {
      delete (window as unknown as Record<string, unknown>).__quorumToggleHand;
      delete (window as unknown as Record<string, unknown>).__quorumHandRaised;
    };
  }, [toggleHand, localRaised]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface-900 border border-white/10 rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-surface-800/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-2xl">✋</span> Raised Hands
            {queue.length > 0 && (
              <span className="bg-accent/20 text-accent-light text-xs px-2 py-0.5 rounded-full font-mono">
                {queue.length}
              </span>
            )}
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-white hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Queue */}
        <div className="p-4 max-h-80 overflow-y-auto">
          {queue.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <span className="text-4xl block mb-3">🤚</span>
              <p className="text-sm">No hands raised yet.</p>
              <p className="text-xs text-text-muted mt-1">Click the hand button to raise yours!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {queue.map((entry, index) => (
                <div
                  key={entry.identity}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all animate-fade-in ${
                    index === 0
                      ? 'bg-accent/10 border-accent/30 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                      : 'bg-surface-800 border-white/5'
                  }`}
                >
                  <span className="text-lg w-8 text-center font-mono text-text-muted">
                    {index === 0 ? '👆' : `#${index + 1}`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-white font-medium text-sm truncate block">
                      {entry.name}
                      {entry.identity === room.localParticipant.identity && (
                        <span className="text-accent-light text-xs ml-2">(You)</span>
                      )}
                    </span>
                    <span className="text-xs text-text-muted">
                      {formatTimeAgo(entry.timestamp)}
                    </span>
                  </div>
                  {index === 0 && (
                    <span className="text-xs text-accent-light font-bold px-2 py-1 rounded bg-accent/10">NEXT</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={toggleHand}
            className={`px-6 py-3 rounded-full font-semibold text-sm transition-all duration-300 ${
              localRaised
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30'
                : 'bg-accent text-white hover:bg-accent-dark shadow-glow'
            }`}
          >
            {localRaised ? '✋ Lower Hand' : '✋ Raise Hand'}
          </button>
          <span className="text-xs text-text-muted">{queue.length} in queue</span>
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ago`;
}
