'use client';

import { useState, useEffect, useRef } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent, RemoteParticipant } from 'livekit-client';

interface NoteEntry {
  id: string;
  author: string;
  authorName: string;
  text: string;
  timestamp: number;
  isAction: boolean; // action item vs note
}

interface SharedNotesProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SharedNotes({ isOpen, onClose }: SharedNotesProps) {
  const room = useRoomContext();
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isAction, setIsAction] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'notes' | 'actions'>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleData = (payload: Uint8Array, participant?: RemoteParticipant) => {
      try {
        const decoded = new TextDecoder().decode(payload);
        const parsed = JSON.parse(decoded);
        
        if (parsed.type === 'shared-note' && participant) {
          const newNote: NoteEntry = {
            id: parsed.id,
            author: participant.identity,
            authorName: participant.name || participant.identity,
            text: parsed.text,
            timestamp: parsed.timestamp,
            isAction: parsed.isAction,
          };
          setNotes(prev => {
            if (prev.find(n => n.id === parsed.id)) return prev;
            return [...prev, newNote];
          });
        }

        if (parsed.type === 'delete-note' && participant) {
          setNotes(prev => prev.filter(n => n.id !== parsed.id));
        }
      } catch {}
    };

    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room]);

  // Auto-scroll to bottom when new notes arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [notes]);

  const submitNote = () => {
    if (!inputValue.trim()) return;

    const noteId = `${room.localParticipant.identity}-${Date.now()}`;
    const noteData = {
      type: 'shared-note',
      id: noteId,
      text: inputValue.trim(),
      timestamp: Date.now(),
      isAction: isAction,
    };

    const data = new TextEncoder().encode(JSON.stringify(noteData));
    room.localParticipant.publishData(data, { reliable: true });

    // Add locally
    setNotes(prev => [...prev, {
      id: noteId,
      author: room.localParticipant.identity,
      authorName: room.localParticipant.name || room.localParticipant.identity,
      text: inputValue.trim(),
      timestamp: Date.now(),
      isAction: isAction,
    }]);

    setInputValue('');
  };

  const deleteNote = (id: string) => {
    const data = new TextEncoder().encode(JSON.stringify({ type: 'delete-note', id }));
    room.localParticipant.publishData(data, { reliable: true });
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const downloadNotes = () => {
    const content = notes
      .map(n => `[${new Date(n.timestamp).toLocaleTimeString()}] ${n.isAction ? '☐ ACTION' : '📝 NOTE'} (${n.authorName}): ${n.text}`)
      .join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-notes-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = notes.filter(n => {
    if (filterMode === 'notes') return !n.isAction;
    if (filterMode === 'actions') return n.isAction;
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 bottom-0 z-50 flex">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      {/* Panel */}
      <div className="relative ml-auto w-full max-w-md bg-surface-900 border-l border-white/10 shadow-2xl flex flex-col h-full animate-slide-in-right">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-surface-800/50 shrink-0">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-xl">📋</span> Shared Notes
            <span className="bg-surface-700 text-text-muted text-xs px-2 py-0.5 rounded-full font-mono">
              {notes.length}
            </span>
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadNotes}
              className="p-2 rounded-lg text-text-muted hover:text-white hover:bg-white/10 transition-colors"
              title="Download Notes"
            >
              ⬇️
            </button>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-white hover:bg-white/10 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-4 py-2 border-b border-white/5 flex gap-2 shrink-0">
          {(['all', 'notes', 'actions'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-1.5 text-xs rounded-full font-medium transition-all ${
                filterMode === mode
                  ? 'bg-accent/20 text-accent-light border border-accent/30'
                  : 'text-text-muted hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {mode === 'all' ? '📋 All' : mode === 'notes' ? '📝 Notes' : '☐ Actions'}
            </button>
          ))}
        </div>

        {/* Notes List */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-text-muted">
              <span className="text-4xl block mb-3">📝</span>
              <p className="text-sm">No notes yet. Start typing below!</p>
            </div>
          ) : (
            filtered.map(note => (
              <div
                key={note.id}
                className={`p-3 rounded-xl border transition-all animate-fade-in group ${
                  note.isAction
                    ? 'bg-yellow-500/5 border-yellow-500/20'
                    : 'bg-surface-800 border-white/5'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs">{note.isAction ? '☐' : '📝'}</span>
                      <span className="text-xs text-text-muted font-medium">{note.authorName}</span>
                      <span className="text-xs text-text-muted opacity-50">
                        {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-white leading-relaxed">{note.text}</p>
                  </div>
                  {note.author === room.localParticipant.identity && (
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-status-error transition-all"
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/10 shrink-0 bg-surface-800/50">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setIsAction(!isAction)}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-all ${
                isAction
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : 'bg-surface-700 text-text-muted border border-transparent hover:text-white'
              }`}
            >
              {isAction ? '☐ Action Item' : '📝 Note'}
            </button>
          </div>
          <div className="flex gap-2">
            <input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitNote(); } }}
              placeholder={isAction ? "Add an action item..." : "Add a note..."}
              className="flex-1 bg-surface-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
            />
            <button
              onClick={submitNote}
              disabled={!inputValue.trim()}
              className="px-4 py-2.5 rounded-xl bg-accent text-white font-medium text-sm hover:bg-accent-dark disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-glow"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
