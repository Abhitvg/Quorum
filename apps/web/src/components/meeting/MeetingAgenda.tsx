'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';

interface AgendaItem {
  id: string;
  title: string;
  durationMinutes: number;
  completed: boolean;
  isActive: boolean;
}

export default function MeetingAgenda({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const room = useRoomContext();
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDuration, setNewItemDuration] = useState(5);
  const [isEditing, setIsEditing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // Sync state
  const broadcastAgenda = useCallback((newItems: AgendaItem[]) => {
    const payload = JSON.stringify({ type: 'agenda-sync', items: newItems });
    const data = new TextEncoder().encode(payload);
    room.localParticipant.publishData(data, { reliable: true });
    setItems(newItems);
  }, [room]);

  useEffect(() => {
    const handleData = (payload: Uint8Array) => {
      try {
        const decoded = new TextDecoder().decode(payload);
        const parsed = JSON.parse(decoded);

        if (parsed.type === 'agenda-sync') {
          setItems(parsed.items);
        }
      } catch {}
    };

    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room]);

  // Timer for active item
  useEffect(() => {
    const activeItem = items.find(i => i.isActive);
    if (!activeItem) {
      const t = setTimeout(() => setTimeLeft(0), 0);
      return () => clearTimeout(t);
    }

    // Set initial time left if not set
    if (timeLeft === 0) {
      const t = setTimeout(() => setTimeLeft(activeItem.durationMinutes * 60), 0);
      return () => clearTimeout(t);
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time is up, we could play a sound here
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [items, timeLeft]);

  const addItem = () => {
    if (!newItemTitle.trim()) return;
    const newItem: AgendaItem = {
      id: Math.random().toString(36).substr(2, 9),
      title: newItemTitle.trim(),
      durationMinutes: newItemDuration,
      completed: false,
      isActive: items.length === 0, // First item is active by default
    };
    broadcastAgenda([...items, newItem]);
    setNewItemTitle('');
  };

  const removeItem = (id: string) => {
    broadcastAgenda(items.filter(i => i.id !== id));
  };

  const toggleComplete = (id: string) => {
    const newItems = [...items];
    const index = newItems.findIndex(i => i.id === id);
    if (index === -1) return;

    newItems[index].completed = !newItems[index].completed;
    
    // If we completed the active item, move to the next incomplete one
    if (newItems[index].completed && newItems[index].isActive) {
      newItems[index].isActive = false;
      const nextIncomplete = newItems.find(i => !i.completed);
      if (nextIncomplete) {
        nextIncomplete.isActive = true;
        setTimeLeft(nextIncomplete.durationMinutes * 60);
      }
    }

    broadcastAgenda(newItems);
  };

  const setActive = (id: string) => {
    const newItems = items.map(i => ({
      ...i,
      isActive: i.id === id
    }));
    const newActive = newItems.find(i => i.id === id);
    if (newActive) setTimeLeft(newActive.durationMinutes * 60);
    broadcastAgenda(newItems);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const totalDuration = items.reduce((acc, i) => acc + i.durationMinutes, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 bottom-0 z-50 flex">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative ml-auto w-full max-w-sm bg-surface-900 border-l border-white/10 shadow-2xl flex flex-col h-full animate-slide-in-right">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-surface-800/50 shrink-0">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-xl">📝</span> Meeting Agenda
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                isEditing ? 'bg-accent text-white' : 'text-text-muted hover:text-white hover:bg-white/10'
              }`}
            >
              {isEditing ? 'Done' : 'Edit'}
            </button>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-white hover:bg-white/10 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <span className="text-4xl block mb-3 opacity-50">📋</span>
              <p className="text-sm">No agenda items yet.</p>
              {isEditing && <p className="text-xs mt-1">Add items below to structure the meeting.</p>}
            </div>
          ) : (
            items.map(item => (
              <div
                key={item.id}
                className={`p-3 rounded-xl border transition-all animate-fade-in ${
                  item.isActive
                    ? 'bg-accent/10 border-accent/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                    : item.completed
                    ? 'bg-surface-800/50 border-white/5 opacity-60'
                    : 'bg-surface-800 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleComplete(item.id)}
                    className={`w-5 h-5 mt-0.5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                      item.completed
                        ? 'bg-status-live border-status-live text-white'
                        : 'border-white/20 hover:border-accent hover:bg-accent/10'
                    }`}
                  >
                    {item.completed && <span className="text-xs">✓</span>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-medium truncate ${item.completed ? 'line-through text-text-muted' : 'text-white'}`}>
                        {item.title}
                      </p>
                      {item.isActive ? (
                        <span className={`text-xs font-mono font-bold ${timeLeft < 60 ? 'text-status-error animate-pulse' : 'text-accent-light'}`}>
                          {formatTime(timeLeft)}
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted whitespace-nowrap">
                          {item.durationMinutes} min
                        </span>
                      )}
                    </div>
                    
                    {/* Controls */}
                    {isEditing && (
                      <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2">
                        {!item.isActive && !item.completed && (
                          <button
                            onClick={() => setActive(item.id)}
                            className="text-[10px] uppercase font-bold text-accent-light hover:text-white transition-colors"
                          >
                            Set Active
                          </button>
                        )}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-status-error text-sm hover:text-red-400 p-1 ml-auto"
                        >
                          🗑
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Progress bar for active item */}
                {item.isActive && (
                  <div className="mt-3 h-1 bg-black/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${timeLeft < 60 ? 'bg-status-error' : 'bg-accent'}`}
                      style={{ width: `${(timeLeft / (item.durationMinutes * 60)) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Editor Footer */}
        {isEditing && (
          <div className="p-4 border-t border-white/10 shrink-0 bg-surface-800/50 animate-slide-up">
            <div className="flex gap-2 mb-2">
              <input
                value={newItemTitle}
                onChange={e => setNewItemTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addItem(); }}
                placeholder="Topic..."
                className="flex-1 bg-surface-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent"
              />
              <select
                value={newItemDuration}
                onChange={e => setNewItemDuration(Number(e.target.value))}
                className="w-20 bg-surface-900 border border-white/10 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-accent"
              >
                <option value={5}>5m</option>
                <option value={10}>10m</option>
                <option value={15}>15m</option>
                <option value={30}>30m</option>
                <option value={60}>60m</option>
              </select>
            </div>
            <button
              onClick={addItem}
              disabled={!newItemTitle.trim()}
              className="w-full py-2 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add Item
            </button>
          </div>
        )}
        
        {/* Read-only Footer */}
        {!isEditing && items.length > 0 && (
          <div className="p-4 border-t border-white/10 shrink-0 bg-surface-800/50 text-center flex items-center justify-between">
            <div className="text-xs text-text-muted">
              {items.filter(i => i.completed).length} / {items.length} completed
            </div>
            <div className="text-xs font-medium text-white">
              Total: {totalDuration} min
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
