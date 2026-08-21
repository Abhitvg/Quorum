'use client';

import { useEffect, useState } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';

interface Reaction {
  id: string;
  emoji: string;
  x: number;
}

export default function ReactionsLayer() {
  const room = useRoomContext();
  const [reactions, setReactions] = useState<Reaction[]>([]);

  const addReaction = (emoji: string) => {
    const newReaction: Reaction = {
      id: Math.random().toString(36).substring(7),
      emoji,
      // Random horizontal position between 10% and 90%
      x: 10 + Math.random() * 80,
    };

    setReactions((prev) => [...prev, newReaction]);

    // Remove reaction after animation completes (approx 3 seconds)
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
    }, 3000);
  };

  useEffect(() => {
    const handleData = (payload: Uint8Array) => {
      try {
        const decoded = new TextDecoder().decode(payload);
        const parsed = JSON.parse(decoded);
        if (parsed.type === 'reaction' && parsed.emoji) {
          addReaction(parsed.emoji);
        }
      } catch {
        // ignore JSON parse errors
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    
    const handleLocal = (e: Event) => addReaction((e as CustomEvent).detail);
    window.addEventListener('local-reaction', handleLocal);
    
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
      window.removeEventListener('local-reaction', handleLocal);
    };
  }, [room]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {reactions.map((reaction) => (
        <div
          key={reaction.id}
          className="absolute bottom-20 text-4xl animate-float-up"
          style={{ left: `${reaction.x}%` }}
        >
          {reaction.emoji}
        </div>
      ))}
    </div>
  );
}
