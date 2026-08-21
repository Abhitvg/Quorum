'use client';

import { useState, useEffect, useRef } from 'react';
import { useRoomContext, useParticipants } from '@livekit/components-react';

interface SpeakerStats {
  identity: string;
  name: string;
  totalMs: number;
  speakCount: number;
}

export default function SpeakerStatsPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const room = useRoomContext();
  const participants = useParticipants();
  const [stats, setStats] = useState<Map<string, SpeakerStats>>(new Map());
  const activeSpeakers = useRef<Map<string, number>>(new Map());
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll speaking state every 500ms
  useEffect(() => {
    let lastTick = Date.now();
    tickRef.current = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTick;
      lastTick = now;
      
      setStats(prev => {
        const updated = new Map(prev);
        participants.forEach(p => {
          if (p.isSpeaking) {
            const existing = updated.get(p.identity) || {
              identity: p.identity,
              name: p.name || p.identity,
              totalMs: 0,
              speakCount: 0,
            };
            
            let newSpeakCount = existing.speakCount;
            if (!activeSpeakers.current.has(p.identity)) {
              activeSpeakers.current.set(p.identity, 1);
              newSpeakCount += 1;
            }
            
            updated.set(p.identity, {
              ...existing,
              totalMs: existing.totalMs + delta,
              speakCount: newSpeakCount,
            });
          } else {
            if (activeSpeakers.current.has(p.identity)) {
              activeSpeakers.current.delete(p.identity);
            }
          }
        });
        return updated;
      });
    }, 500);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [participants]);

  const sortedStats = Array.from(stats.values()).sort((a, b) => b.totalMs - a.totalMs);
  const maxMs = sortedStats.length > 0 ? sortedStats[0].totalMs : 1;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface-900 border border-white/10 rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-surface-800/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-2xl">📊</span> Speaker Stats
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-white hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Stats */}
        <div className="p-4 max-h-96 overflow-y-auto space-y-3">
          {sortedStats.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <span className="text-4xl block mb-3">🎙️</span>
              <p className="text-sm">No speaking activity tracked yet.</p>
              <p className="text-xs mt-1">Stats will appear as participants speak.</p>
            </div>
          ) : (
            sortedStats.map((stat, index) => {
              const isCurrentlySpeaking = participants.find(p => p.identity === stat.identity)?.isSpeaking || false;
              const liveMs = stat.totalMs;
              const pct = Math.min((liveMs / maxMs) * 100, 100);

              return (
                <div key={stat.identity} className="animate-fade-in">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-text-muted w-5">#{index + 1}</span>
                      <span className={`text-sm font-medium ${isCurrentlySpeaking ? 'text-accent-light' : 'text-white'}`}>
                        {stat.name}
                        {stat.identity === room.localParticipant.identity && (
                          <span className="text-accent-light text-xs ml-1">(You)</span>
                        )}
                      </span>
                      {isCurrentlySpeaking && (
                        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-muted">
                      <span>{formatDuration(liveMs)}</span>
                      <span className="text-text-muted/50">•</span>
                      <span>{stat.speakCount} times</span>
                    </div>
                  </div>
                  <div className="h-2 bg-surface-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCurrentlySpeaking
                          ? 'bg-gradient-to-r from-accent to-accent-light animate-pulse'
                          : 'bg-gradient-to-r from-accent/60 to-accent'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 text-center">
          <p className="text-xs text-text-muted">
            Total speaking time: {formatDuration(sortedStats.reduce((acc, s) => acc + s.totalMs, 0))}
          </p>
        </div>
      </div>
    </div>
  );
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}
