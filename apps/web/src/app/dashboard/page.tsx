'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/Logo';
import Button from '@/components/Button';
import { api, type MeetingItem } from '@/lib/api';

export default function Dashboard() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [roomName, setRoomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchMeetings = async () => {
      if (!user) return;
      try {
        const response = await api.meetings.list();
        setMeetings(response.meetings || []);
      } catch (error) {
        console.error('Failed to fetch meetings', error);
      } finally {
        setLoadingMeetings(false);
      }
    };
    fetchMeetings();
  }, [user]);

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    
    setIsCreating(true);
    try {
      const response = await api.meetings.create(roomName);
      router.push(`/room/${response.meeting.id}`);
    } catch (error) {
      console.error('Failed to create meeting', error);
      setIsCreating(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const activeMeetings = meetings.filter(m => m.status === 'live');
  const pastMeetings = meetings.filter(m => m.status !== 'live');

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[500px] bg-mesh opacity-20 blur-[150px] pointer-events-none" />
      
      {/* Header */}
      <header className="h-16 border-b border-border-subtle flex items-center justify-between px-6 bg-surface-900/50 backdrop-blur-md sticky top-0 z-10">
        <Logo />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-surface-700 flex items-center justify-center text-sm font-medium text-text-primary border border-border-medium">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-text-secondary hidden sm:block">
              {user.name}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Sign out
          </Button>
        </div>
      </header>
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 relative z-10 flex flex-col md:flex-row gap-10">
        
        {/* Left Column: Create & Active */}
        <div className="w-full md:w-[400px] flex flex-col gap-8 shrink-0">
          
          {/* Welcome Card */}
          <div className="glass-premium rounded-3xl p-8 animate-slide-up hover-lift">
            <h1 className="text-3xl font-bold text-white mb-2">
              Hello, {user.name.split(' ')[0]} 👋
            </h1>
            <p className="text-text-secondary mb-8">
              Ready for your next great meeting?
            </p>
            
            <form onSubmit={handleCreateMeeting} className="flex flex-col gap-4">
              <div className="relative">
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Enter a meeting topic"
                  className="w-full bg-surface-800/50 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all pl-11"
                  required
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
                  #
                </span>
              </div>
              <Button
                type="submit"
                variant="primary"
                loading={isCreating}
                className="w-full justify-center h-12 shadow-glow"
              >
                Start Meeting
              </Button>
            </form>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="glass rounded-2xl p-5 hover-lift">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Total Meetings</p>
              <p className="text-3xl font-bold text-white">{meetings.length}</p>
              <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-status-live">
                <span className="w-4 h-4 rounded-full bg-status-live/20 flex items-center justify-center">↑</span>
                {activeMeetings.length} live now
              </div>
            </div>
            <div className="glass rounded-2xl p-5 hover-lift">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">Completed</p>
              <p className="text-3xl font-bold text-white">{pastMeetings.length}</p>
              <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                Meetings held
              </div>
            </div>
          </div>

          {/* Active Meetings */}
          {activeMeetings.length > 0 && (
            <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-status-live animate-pulse" />
                Live Now
              </h3>
              <div className="space-y-3">
                {activeMeetings.map((meeting) => (
                  <div key={meeting.id} className="glass rounded-xl p-4 flex items-center justify-between group hover:border-white/20 transition-colors">
                    <div>
                      <p className="text-white font-medium mb-1">{meeting.title}</p>
                      <p className="text-xs text-text-secondary font-mono">/{meeting.id}</p>
                    </div>
                    <Button 
                      onClick={() => router.push(`/room/${meeting.id}`)}
                      size="sm"
                      variant="secondary"
                      className="bg-white/5 border-white/10 group-hover:bg-accent/10 group-hover:text-accent-light group-hover:border-accent/30"
                    >
                      Join
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: History & Activity */}
        <div className="flex-1 flex flex-col gap-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h2 className="text-xl font-bold text-white">Meeting History</h2>
            <button className="text-sm font-medium text-accent hover:text-accent-light transition-colors">
              View All
            </button>
          </div>

          {loadingMeetings ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-accent animate-spin" />
            </div>
          ) : pastMeetings.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 glass border-dashed border-white/10 rounded-3xl">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-2xl mb-4">
                📅
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No past meetings</h3>
              <p className="text-sm text-text-secondary max-w-sm">
                Your completed meetings, AI summaries, and recordings will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pastMeetings.map((meeting) => (
                <div key={meeting.id} className="glass rounded-2xl p-5 hover-lift group relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-accent to-indigo opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1 group-hover:text-accent-light transition-colors">
                        {meeting.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs font-medium text-text-secondary">
                        <span className="flex items-center gap-1.5">
                          🕒 {new Date(meeting.createdAt || '').toLocaleDateString()}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span>
                          {meeting.endedAt && meeting.createdAt
                            ? `${Math.round((new Date(meeting.endedAt).getTime() - new Date(meeting.createdAt).getTime()) / 60000)} mins`
                            : 'Duration N/A'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" size="sm" className="bg-white/5 border-white/10">
                        Summary
                      </Button>
                      <Button variant="secondary" size="sm" className="bg-white/5 border-white/10">
                        Recording
                      </Button>
                    </div>
                  </div>
                  
                  {/* Mock AI Insight */}
                  <div className="mt-4 pt-4 border-t border-white/5 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo/20 flex items-center justify-center shrink-0 mt-0.5">
                      🤖
                    </div>
                    <div>
                      <p className="text-xs font-bold text-indigo-400 mb-1 uppercase tracking-wider">AI Insight</p>
                      <p className="text-sm text-text-secondary leading-relaxed line-clamp-2">
                        Key decision: Proceed with V7 redesign. Next steps: Sarah to review CSS architecture, James to finalize auth flow by Friday.
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
