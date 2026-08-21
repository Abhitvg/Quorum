'use client';

import { useState, useEffect, useRef } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent, RemoteParticipant } from 'livekit-client';

interface Message {
  id: string;
  sender: string;
  senderName: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export default function MeetingChat({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const room = useRoomContext();
  const [messages, setMessages] = useState<Message[]>(() => [{
    id: 'system-welcome',
    sender: 'system',
    senderName: 'Quorum',
    text: 'Welcome to the meeting chat! Messages are visible to all participants.',
    timestamp: Date.now(),
    isSystem: true,
  }]);
  const [inputValue, setInputValue] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleData = (payload: Uint8Array, participant?: RemoteParticipant) => {
      try {
        const decoded = new TextDecoder().decode(payload);
        const parsed = JSON.parse(decoded);

        if (parsed.type === 'chat-message' && participant) {
          const msg: Message = {
            id: parsed.id,
            sender: participant.identity,
            senderName: participant.name || participant.identity,
            text: parsed.text,
            timestamp: parsed.timestamp,
          };
          setMessages(prev => {
            if (prev.find(m => m.id === parsed.id)) return prev;
            return [...prev, msg];
          });
          if (!isOpen) {
            setUnreadCount(prev => prev + 1);
          }
        }
      } catch {}
    };

    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room, isOpen]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (isOpen && unreadCount > 0) {
    setUnreadCount(0);
  }

  // Expose unread count globally for the control bar badge
  useEffect(() => {
    // @ts-expect-error global variable used for cross-component state without context
    window.__quorumChatUnread = unreadCount;
  }, [unreadCount]);

  const sendMessage = () => {
    if (!inputValue.trim()) return;

    const msgId = `${room.localParticipant.identity}-${Date.now()}`;
    const payload = {
      type: 'chat-message',
      id: msgId,
      text: inputValue.trim(),
      timestamp: Date.now(),
    };

    const data = new TextEncoder().encode(JSON.stringify(payload));
    room.localParticipant.publishData(data, { reliable: true });

    // Add locally
    setMessages(prev => [...prev, {
      id: msgId,
      sender: room.localParticipant.identity,
      senderName: room.localParticipant.name || room.localParticipant.identity,
      text: inputValue.trim(),
      timestamp: Date.now(),
    }]);

    setInputValue('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 bottom-0 z-50 flex">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative ml-auto w-full max-w-sm bg-surface-900 border-l border-white/10 shadow-2xl flex flex-col h-full animate-slide-in-right">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-surface-800/50 shrink-0">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-xl">💬</span> Chat
          </h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-white hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`animate-fade-in ${msg.isSystem ? 'text-center' : ''}`}
            >
              {msg.isSystem ? (
                <p className="text-xs text-text-muted bg-surface-800/50 inline-block px-3 py-1.5 rounded-full border border-white/5">
                  {msg.text}
                </p>
              ) : (
                <div className={`flex flex-col ${msg.sender === room.localParticipant.identity ? 'items-end' : 'items-start'}`}>
                  <span className="text-xs text-text-muted mb-1 px-1">{msg.senderName}</span>
                  <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === room.localParticipant.identity
                      ? 'bg-accent text-white rounded-br-md'
                      : 'bg-surface-800 text-white border border-white/5 rounded-bl-md'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-text-muted mt-1 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/10 shrink-0 bg-surface-800/50">
          <div className="flex gap-2">
            <input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Type a message..."
              className="flex-1 bg-surface-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
            />
            <button
              onClick={sendMessage}
              disabled={!inputValue.trim()}
              className="px-4 py-2.5 rounded-xl bg-accent text-white font-medium text-sm hover:bg-accent-dark disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
