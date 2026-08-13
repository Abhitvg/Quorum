'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import Logo from '@/components/Logo';
import Button from '@/components/Button';
import Input from '@/components/Input';

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (user) {
      loadMeetings();
    }
  }, [user, loading, router]);

  const loadMeetings = async () => {
    try {
      const res = await api.meetings.list();
      setMeetings(res.meetings);
    } catch (err) {
      console.error('Failed to load meetings', err);
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setCreating(true);
    try {
      const res = await api.meetings.create(newTitle);
      router.push(`/room/${res.meeting.id}`);
    } catch (err) {
      console.error('Failed to create meeting', err);
      setCreating(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-surface-900">
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

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 animate-fade-in">
        {/* Left col: Create Meeting */}
        <div className="md:col-span-1">
          <div className="glass rounded-xl p-6 shadow-glow border-border-accent/20">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Start a meeting</h2>
            <form onSubmit={handleCreateMeeting} className="flex flex-col gap-4">
              <Input
                placeholder="Meeting topic (e.g. Q3 Planning)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                autoFocus
              />
              <Button type="submit" loading={creating} className="w-full">
                Join now
              </Button>
            </form>
          </div>
        </div>

        {/* Right col: Recent Meetings */}
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold text-text-primary mb-6">Recent meetings</h2>
          
          <div className="flex flex-col gap-3">
            {meetings.length === 0 ? (
              <div className="py-12 text-center text-text-muted border border-dashed border-border-subtle rounded-xl">
                No meetings yet. Start your first one!
              </div>
            ) : (
              meetings.map((m) => (
                <div key={m.id} className="glass rounded-lg p-4 flex items-center justify-between group hover:border-border-accent/50 transition-colors">
                  <div>
                    <h3 className="font-medium text-text-primary">{m.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-text-muted mt-1">
                      <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                      <span className="w-1 h-1 rounded-full bg-border-medium" />
                      <span>{m.status === 'live' ? (
                        <span className="text-status-live flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-status-live animate-pulse" /> Live
                        </span>
                      ) : m.status}</span>
                    </div>
                  </div>
                  
                  <Button 
                    variant={m.status === 'live' ? 'primary' : 'secondary'} 
                    size="sm"
                    onClick={() => router.push(`/room/${m.id}`)}
                  >
                    {m.status === 'live' ? 'Join' : 'View'}
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
