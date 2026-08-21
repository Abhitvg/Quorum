'use client';

import { useEffect, useState } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';

export default function MeetingTimer() {
  const room = useRoomContext();
  
  const [isActive, setIsActive] = useState(false);
  const [endTime, setEndTime] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  
  const [showConfig, setShowConfig] = useState(false);
  const [minutes, setMinutes] = useState(5);

  useEffect(() => {
    const handleData = (payload: Uint8Array) => {
      try {
        const decoded = new TextDecoder().decode(payload);
        const parsed = JSON.parse(decoded);
        
        if (parsed.type === 'start-timer') {
          setEndTime(parsed.endTime);
          setIsActive(true);
        } else if (parsed.type === 'stop-timer') {
          setIsActive(false);
        }
      } catch {
        // Handle parsing error silently
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    
    // Also handle local events
    const handleLocal = (e: Event) => {
      const customEvent = e as CustomEvent;
      const parsed = customEvent.detail;
      if (parsed.type === 'start-timer') {
        setEndTime(parsed.endTime);
        setIsActive(true);
      } else if (parsed.type === 'stop-timer') {
        setIsActive(false);
      } else if (parsed.type === 'toggle-timer-config') {
        setShowConfig(true);
      }
    };
    
    window.addEventListener('local-timer', handleLocal);
    
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
      window.removeEventListener('local-timer', handleLocal);
    };
  }, [room]);

  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 100); // 100ms for smoother sync
    
    return () => clearInterval(interval);
  }, [isActive, endTime]);

  const broadcastEvent = (payload: Record<string, unknown>) => {
    const data = new TextEncoder().encode(JSON.stringify(payload));
    room.localParticipant.publishData(data, { reliable: true });
    window.dispatchEvent(new CustomEvent('local-timer', { detail: payload }));
  };

  const startTimer = () => {
    const calculatedEndTime = Date.now() + (minutes * 60 * 1000);
    broadcastEvent({ type: 'start-timer', endTime: calculatedEndTime });
    setShowConfig(false);
  };

  const stopTimer = () => {
    broadcastEvent({ type: 'stop-timer' });
  };

  // Format time
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeString = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const isWarning = timeLeft > 0 && timeLeft <= 60; // Less than 1 minute warning
  const isDone = isActive && timeLeft === 0;

  return (
    <>
      {showConfig && !isActive && (
        <div className="absolute bottom-24 right-6 z-40 bg-surface-900 border border-white/10 rounded-2xl shadow-2xl p-4 animate-scale-in flex flex-col gap-3">
          <h3 className="text-white font-bold flex items-center gap-2">
            <span>⏱️</span> Set Timer
          </h3>
          <div className="flex gap-2">
            {[1, 5, 10, 15].map(m => (
              <button
                key={m}
                onClick={() => setMinutes(m)}
                className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-colors ${minutes === m ? 'bg-accent text-white' : 'bg-surface-800 text-text-muted hover:text-white hover:bg-white/5'}`}
              >
                {m}m
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <button onClick={() => setShowConfig(false)} className="flex-1 py-2 rounded-lg bg-surface-800 text-text-muted hover:text-white transition-colors">Cancel</button>
            <button onClick={startTimer} className="flex-1 py-2 rounded-lg bg-accent text-white font-medium hover:bg-accent-light transition-colors">Start</button>
          </div>
        </div>
      )}

      {isActive && (
        <div className={`absolute top-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 px-6 py-3 rounded-full backdrop-blur-md border shadow-2xl animate-fade-in ${
          isDone ? 'bg-status-error/20 border-status-error/50' : 
          isWarning ? 'bg-yellow-500/20 border-yellow-500/50' : 
          'bg-black/60 border-white/10'
        }`}>
          <span className="text-xl">⏱️</span>
          <span className={`text-2xl font-black font-mono tracking-wider ${
            isDone ? 'text-status-error animate-pulse' : 
            isWarning ? 'text-yellow-400' : 
            'text-white'
          }`}>
            {timeString}
          </span>
          <button 
            onClick={stopTimer}
            className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-text-muted hover:text-white hover:bg-status-error transition-colors ml-2"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
