'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRoomContext, useLocalParticipant } from '@livekit/components-react';
import { RoomEvent, RemoteParticipant } from 'livekit-client';

interface SpeechRecognitionType {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: { resultIndex: number; results: { isFinal: boolean; [key: number]: { transcript: string } }[] }) => void;
  onerror: (event: { error: string }) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

interface QuorumWindow extends Window {
  downloadTranscript?: () => void;
  SpeechRecognition?: new () => SpeechRecognitionType;
  webkitSpeechRecognition?: new () => SpeechRecognitionType;
}

interface Caption {
  id: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export default function LiveCaptions() {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);

  // Maintain full transcript history
  const transcriptHistory = useRef<Caption[]>([]);

  const addCaption = useCallback((senderName: string, text: string) => {
    const newCaption: Caption = {
      id: Math.random().toString(36).substring(7),
      senderName,
      text,
      timestamp: Date.now(),
    };

    transcriptHistory.current.push(newCaption);

    setCaptions(prev => {
      const updated = [...prev, newCaption];
      // Keep only last 3 captions
      return updated.slice(-3);
    });
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    const w = window as unknown as QuorumWindow;
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: { resultIndex: number; results: { isFinal: boolean; [key: number]: { transcript: string } }[] }) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript.trim()) {
        const text = finalTranscript.trim();
        const payload = JSON.stringify({ type: 'caption', text, sender: localParticipant?.name || 'User' });
        const data = new TextEncoder().encode(payload);
        
        // Broadcast to others
        room.localParticipant.publishData(data, { reliable: true });

        // Add to local state
        addCaption(localParticipant?.name || 'You', text);
      }
    };

    recognition.onerror = (event: { error: string }) => {
      console.error('Speech recognition error', event.error);
    };

    recognition.onend = () => {
      // Auto-restart if still supposed to be listening
      if (isListening) {
        try {
          recognition.start();
        } catch {}
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [room, localParticipant?.name, isListening, addCaption]);

  // Toggle listening when mic state changes (optional, but good for privacy)
  useEffect(() => {
    if (localParticipant?.isMicrophoneEnabled && !isListening && recognitionRef.current) {
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch {}
    } else if (!localParticipant?.isMicrophoneEnabled && isListening && recognitionRef.current) {
      setIsListening(false);
      recognitionRef.current.stop();
    }
  }, [localParticipant?.isMicrophoneEnabled, isListening]);

  // Listen for incoming captions
  useEffect(() => {
    const handleData = (payload: Uint8Array, participant?: RemoteParticipant) => {
      try {
        const decoded = new TextDecoder().decode(payload);
        const parsed = JSON.parse(decoded);
        if (parsed.type === 'caption') {
          addCaption(parsed.sender || participant?.name || 'Unknown', parsed.text);
        }
      } catch {}
    };

    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room, addCaption]);

  useEffect(() => {
    // Expose download function to window for other components
    (window as unknown as QuorumWindow).downloadTranscript = () => {
      if (transcriptHistory.current.length === 0) return;
      
      const text = transcriptHistory.current
        .map(c => `[${new Date(c.timestamp).toLocaleTimeString()}] ${c.senderName}: ${c.text}`)
        .join('\n');
        
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quorum-transcript-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
  }, []);

  // Remove stale captions after 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCaptions(prev => prev.filter(c => now - c.timestamp < 5000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (captions.length === 0) return null;

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-40 w-full max-w-2xl px-4">
      {captions.map((caption) => (
        <div 
          key={caption.id}
          className="bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl shadow-xl animate-fade-in text-center max-w-full"
        >
          <span className="text-xs font-bold text-accent-light mr-2 uppercase tracking-wide opacity-80">
            {caption.senderName}
          </span>
          <span className="text-white text-lg font-medium drop-shadow-md">
            {caption.text}
          </span>
        </div>
      ))}
    </div>
  );
}
