'use client';

import { useState, useEffect } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';

interface MoodCheckProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MoodVote {
  identity: string;
  name: string;
  mood: string;
  timestamp: number;
}

const MOODS = [
  { emoji: '🔥', label: 'Energized' },
  { emoji: '😊', label: 'Happy' },
  { emoji: '🤔', label: 'Thinking' },
  { emoji: '😐', label: 'Neutral' },
  { emoji: '😴', label: 'Tired' },
  { emoji: '😰', label: 'Stressed' },
  { emoji: '🤯', label: 'Overwhelmed' },
  { emoji: '☕', label: 'Need Coffee' },
];

export default function MoodCheck({ isOpen, onClose }: MoodCheckProps) {
  const room = useRoomContext();
  const [votes, setVotes] = useState<Map<string, MoodVote>>(new Map());
  const [localMood, setLocalMood] = useState<string | null>(null);

  useEffect(() => {
    const handleData = (payload: Uint8Array, participant?: RemoteParticipant) => {
      try {
        const decoded = new TextDecoder().decode(payload);
        const parsed = JSON.parse(decoded);

        if (parsed.type === 'mood-vote' && participant) {
          setVotes(prev => {
            const updated = new Map(prev);
            updated.set(participant.identity, {
              identity: participant.identity,
              name: participant.name || participant.identity,
              mood: parsed.mood,
              timestamp: Date.now(),
            });
            return updated;
          });
        }
      } catch {}
    };

    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room]);

  const castVote = (emoji: string) => {
    setLocalMood(emoji);

    const payload = JSON.stringify({ type: 'mood-vote', mood: emoji });
    const data = new TextEncoder().encode(payload);
    room.localParticipant.publishData(data, { reliable: true });

    // Update local
    setVotes(prev => {
      const updated = new Map(prev);
      updated.set(room.localParticipant.identity, {
        identity: room.localParticipant.identity,
        name: room.localParticipant.name || room.localParticipant.identity,
        mood: emoji,
        timestamp: Date.now(),
      });
      return updated;
    });
  };

  // Aggregate mood distribution
  const moodCounts = new Map<string, number>();
  votes.forEach(v => {
    moodCounts.set(v.mood, (moodCounts.get(v.mood) || 0) + 1);
  });
  const totalVotes = votes.size;
  const topMood = Array.from(moodCounts.entries()).sort((a, b) => b[1] - a[1])[0];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface-900 border border-white/10 rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-surface-800/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🫶</span> Mood Check
            {totalVotes > 0 && (
              <span className="bg-surface-700 text-text-muted text-xs px-2 py-0.5 rounded-full font-mono">
                {totalVotes} voted
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

        <div className="p-5 space-y-5">
          {/* Mood Selector */}
          <div>
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">How are you feeling?</h3>
            <div className="grid grid-cols-4 gap-2">
              {MOODS.map(mood => (
                <button
                  key={mood.emoji}
                  onClick={() => castVote(mood.emoji)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-300 ${
                    localMood === mood.emoji
                      ? 'bg-accent/20 border-accent/40 shadow-[0_0_15px_rgba(6,182,212,0.15)] scale-110'
                      : 'bg-surface-800 border-white/5 hover:border-white/15 hover:scale-105'
                  }`}
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className="text-[10px] text-text-muted leading-tight">{mood.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          {totalVotes > 0 && (
            <div className="space-y-3 animate-fade-in">
              <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Team Mood</h3>
              
              {/* Top Mood */}
              {topMood && (
                <div className="text-center p-4 bg-surface-800/50 rounded-xl border border-white/5">
                  <span className="text-5xl block mb-2">{topMood[0]}</span>
                  <span className="text-sm text-text-muted">
                    {MOODS.find(m => m.emoji === topMood[0])?.label || 'Unknown'} · {topMood[1]} of {totalVotes}
                  </span>
                </div>
              )}

              {/* Distribution Bars */}
              <div className="space-y-2">
                {Array.from(moodCounts.entries())
                  .sort((a, b) => b[1] - a[1])
                  .map(([emoji, count]) => (
                    <div key={emoji} className="flex items-center gap-3">
                      <span className="text-lg w-8 text-center">{emoji}</span>
                      <div className="flex-1 h-2 bg-surface-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-accent/60 to-accent rounded-full transition-all duration-500"
                          style={{ width: `${(count / totalVotes) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-text-muted font-mono w-8 text-right">{count}</span>
                    </div>
                  ))
                }
              </div>

              {/* Who voted what */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {Array.from(votes.values()).map(v => (
                  <span
                    key={v.identity}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-surface-800 border border-white/5 rounded-full text-xs text-text-muted"
                  >
                    <span>{v.mood}</span>
                    <span className="text-white font-medium">{v.name}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
