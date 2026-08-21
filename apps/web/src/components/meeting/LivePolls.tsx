'use client';

import { useEffect, useState } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent } from 'livekit-client';

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  isActive: boolean;
  votedBy: string[];
}

export default function LivePolls({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const room = useRoomContext();
  
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  
  // Create Poll State
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);

  useEffect(() => {
    const handleData = (payload: Uint8Array) => {
      try {
        const decoded = new TextDecoder().decode(payload);
        const parsed = JSON.parse(decoded);
        
        if (parsed.type === 'new-poll') {
          setActivePoll(parsed.poll);
        } else if (parsed.type === 'vote-poll') {
          setActivePoll(prev => {
            if (!prev || prev.id !== parsed.pollId) return prev;
            return {
              ...prev,
              options: prev.options.map(o => 
                o.id === parsed.optionId ? { ...o, votes: o.votes + 1 } : o
              ),
              votedBy: [...prev.votedBy, parsed.voterId]
            };
          });
        } else if (parsed.type === 'end-poll') {
          setActivePoll(prev => {
            if (!prev || prev.id !== parsed.pollId) return prev;
            return { ...prev, isActive: false };
          });
        }
      } catch {}
    };

    room.on(RoomEvent.DataReceived, handleData);
    
    // Also handle local events since data channels don't reflect back
    const handleLocal = (e: Event) => {
      const customEvent = e as CustomEvent;
      const parsed = customEvent.detail;
      if (parsed.type === 'new-poll') {
        setActivePoll(parsed.poll);
      } else if (parsed.type === 'vote-poll') {
        setActivePoll(prev => {
          if (!prev || prev.id !== parsed.pollId) return prev;
          return {
            ...prev,
            options: prev.options.map(o => 
              o.id === parsed.optionId ? { ...o, votes: o.votes + 1 } : o
            ),
            votedBy: [...prev.votedBy, parsed.voterId]
          };
        });
      } else if (parsed.type === 'end-poll') {
        setActivePoll(prev => {
          if (!prev || prev.id !== parsed.pollId) return prev;
          return { ...prev, isActive: false };
        });
      }
    };
    
    window.addEventListener('local-poll', handleLocal);
    
    return () => {
      room.off(RoomEvent.DataReceived, handleData);
      window.removeEventListener('local-poll', handleLocal);
    };
  }, [room]);

  const broadcastEvent = (payload: Record<string, unknown>) => {
    const data = new TextEncoder().encode(JSON.stringify(payload));
    room.localParticipant.publishData(data, { reliable: true });
    window.dispatchEvent(new CustomEvent('local-poll', { detail: payload }));
  };

  const createPoll = (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = options.filter(o => o.trim() !== '');
    if (!question.trim() || validOptions.length < 2) return;
    
    const newPoll: Poll = {
      id: Math.random().toString(36).substring(7),
      question: question.trim(),
      options: validOptions.map(text => ({ id: Math.random().toString(36).substring(7), text, votes: 0 })),
      isActive: true,
      votedBy: [],
    };
    
    broadcastEvent({ type: 'new-poll', poll: newPoll });
    onClose();
    setQuestion('');
    setOptions(['', '']);
  };

  const votePoll = (optionId: string) => {
    if (!activePoll || !activePoll.isActive || activePoll.votedBy.includes(room.localParticipant.identity)) return;
    broadcastEvent({ type: 'vote-poll', pollId: activePoll.id, optionId, voterId: room.localParticipant.identity });
  };

  const endPoll = () => {
    if (!activePoll) return;
    broadcastEvent({ type: 'end-poll', pollId: activePoll.id });
  };

  const totalVotes = activePoll?.options.reduce((sum, opt) => sum + opt.votes, 0) || 0;
  const hasVoted = activePoll?.votedBy.includes(room.localParticipant.identity) || false;

  return (
    <>
      {/* Poll Creation Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-md bg-surface-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-surface-800/50">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="text-2xl">📊</span> Create a Poll
              </h2>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-white hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={createPoll} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Question</label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g. What should we build next?"
                  className="w-full bg-surface-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text-secondary mb-1">Options</label>
                {options.map((opt, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOps = [...options];
                        newOps[idx] = e.target.value;
                        setOptions(newOps);
                      }}
                      placeholder={`Option ${idx + 1}`}
                      className="flex-1 bg-surface-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent"
                    />
                    {options.length > 2 && (
                      <button 
                        type="button" 
                        onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                        className="p-2 text-status-error hover:bg-status-error/10 rounded-lg"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button 
                  type="button"
                  onClick={() => setOptions([...options, ''])}
                  className="text-accent-light text-sm font-medium mt-2 hover:underline"
                >
                  + Add another option
                </button>
              </div>
              
              <div className="pt-4 flex justify-end">
                <button 
                  type="submit"
                  disabled={!question.trim() || options.filter(o => o.trim() !== '').length < 2}
                  className="px-6 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start Poll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Poll Widget Overlay */}
      {activePoll && (
        <div className="absolute top-24 right-6 z-40 w-80 bg-surface-900/90 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl p-4 animate-fade-in">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-white font-bold text-lg leading-tight">{activePoll.question}</h3>
            {!activePoll.isActive && (
              <span className="bg-white/10 text-text-muted text-xs px-2 py-1 rounded">Ended</span>
            )}
          </div>
          
          <div className="space-y-2 mb-4">
            {activePoll.options.map(opt => {
              const percent = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
              return (
                <div key={opt.id} className="relative">
                  <button
                    onClick={() => votePoll(opt.id)}
                    disabled={!activePoll.isActive || hasVoted}
                    className="w-full text-left relative z-10 p-2 rounded-lg border border-white/10 flex justify-between items-center transition-colors disabled:cursor-default"
                  >
                    <span className="text-sm text-white font-medium">{opt.text}</span>
                    {(hasVoted || !activePoll.isActive) && (
                      <span className="text-xs text-text-muted">{percent}% ({opt.votes})</span>
                    )}
                  </button>
                  {/* Progress Bar Background */}
                  {(hasVoted || !activePoll.isActive) && (
                    <div 
                      className="absolute inset-0 bg-accent/20 rounded-lg pointer-events-none transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-between items-center text-xs text-text-muted">
            <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
            {activePoll.isActive ? (
              <button onClick={endPoll} className="hover:text-status-error transition-colors">End Poll</button>
            ) : (
              <button onClick={() => setActivePoll(null)} className="hover:text-white transition-colors">Dismiss</button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
