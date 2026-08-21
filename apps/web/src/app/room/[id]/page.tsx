'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  LiveKitRoom,
  ConnectionStateToast,
  useParticipants,
} from '@livekit/components-react';
import { ExternalE2EEKeyProvider } from 'livekit-client';
import '@livekit/components-styles';

import { useAuth } from '@/hooks/useAuth';
import { api, type MeetingItem } from '@/lib/api';
import Button from '@/components/Button';
import Logo from '@/components/Logo';
import MeetingHeader from '@/components/meeting/MeetingHeader';
import VideoGrid from '@/components/meeting/VideoGrid';
import ParticipantList from '@/components/meeting/ParticipantList';
import MeetingControls from '@/components/meeting/MeetingControls';
import LiveCaptions from '@/components/meeting/LiveCaptions';
import ReactionsLayer from '@/components/meeting/ReactionsLayer';
import SpatialAudioRenderer from '@/components/meeting/SpatialAudioRenderer';
import { WhisperProvider } from '@/components/meeting/WhisperContext';

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const roomId = resolvedParams.id;

  const router = useRouter();
  const { user, loading } = useAuth();

  const [token, setToken] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [meeting, setMeeting] = useState<MeetingItem | null>(null);
  const [error, setError] = useState('');
  const [joined, setJoined] = useState(false);
  const [disconnected, setDisconnected] = useState(false);

  // Dynamic public API states for lobby
  const [bgImageUrl, setBgImageUrl] = useState('');
  const [trivia, setTrivia] = useState<{ q: string; a: string } | null>(null);
  const [showTriviaAnswer, setShowTriviaAnswer] = useState(false);
  const [catFact, setCatFact] = useState('');
  const [kanyeQuote, setKanyeQuote] = useState('Join meeting');
  
  // E2EE
  const [e2eeKey, setE2eeKey] = useState('');
  const [e2eeProvider, setE2eeProvider] = useState<ExternalE2EEKeyProvider | undefined>(undefined);

  useEffect(() => {
    if (!joined) {
      // 1. Random Picsum background
      const randomId = Math.floor(Math.random() * 1000);
      setTimeout(() => setBgImageUrl(`https://picsum.photos/id/${randomId}/1920/1080`), 0);

      // 2. Open Trivia DB
      fetch('https://opentdb.com/api.php?amount=1')
        .then((res) => res.json())
        .then((data) => {
          if (data.results && data.results[0]) {
            // Decode HTML entities
            const decode = (str: string) => {
              const txt = document.createElement('textarea');
              txt.innerHTML = str;
              return txt.value;
            };
            setTrivia({
              q: decode(data.results[0].question),
              a: decode(data.results[0].correct_answer),
            });
          }
        })
        .catch(() => {});

      // 3. Cat Facts
      fetch('https://catfact.ninja/fact')
        .then((res) => res.json())
        .then((data) => {
          if (data.fact) setCatFact(data.fact);
        })
        .catch(() => {});

      // 4. Kanye Rest API for Join Tooltip
      fetch('https://api.kanye.rest')
        .then((res) => res.json())
        .then((data) => {
          if (data.quote) setKanyeQuote(`" ${data.quote} " - Kanye`);
        })
        .catch(() => {});
    }
  }, [joined]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    api.meetings
      .get(roomId)
      .then((res) => setMeeting(res.meeting))
      .catch((err) => setError(err.message || 'Meeting not found'));
  }, [roomId, user, loading, router]);

  const handleJoin = async () => {
    try {
      const res = await api.meetings.getToken(roomId);
      setToken(res.token);
      setServerUrl(res.url);
      
      if (e2eeKey.trim()) {
        const provider = new ExternalE2EEKeyProvider();
        await provider.setKey(e2eeKey.trim());
        setE2eeProvider(provider);
      }
      
      setJoined(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to join meeting';
      setError(message);
    }
  };

  const handleDisconnect = () => {
    setDisconnected(true);
    setTimeout(() => router.push('/dashboard'), 2000);
  };

  // Loading state
  if (loading || (!meeting && !error)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-900 animate-fade-in">
        <Logo size="lg" className="mb-6" />
        <div className="flex items-center gap-3">
          <div className="animate-spin w-5 h-5 border-2 border-accent border-t-transparent rounded-full" />
          <span className="text-text-secondary text-sm">Finding your meeting...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-surface-900 animate-fade-in">
        <div className="glass-noise p-8 rounded-2xl max-w-md text-center">
          <div className="w-14 h-14 rounded-2xl bg-status-error/10 text-status-error flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2 text-text-primary">Connection Error</h2>
          <p className="text-text-secondary mb-6 text-sm">{error}</p>
          <Button onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  // Disconnected state
  if (disconnected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-900 animate-fade-in">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-accent-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">You left the meeting</h2>
          <p className="text-text-secondary text-sm mb-6">Redirecting to dashboard...</p>
          <div className="w-32 h-1 bg-surface-700 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-accent rounded-full" style={{ animation: 'progressGrow 2s ease-out forwards' }} />
          </div>
        </div>
      </div>
    );
  }

  // Pre-join lobby
  if (!joined) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#000] relative overflow-hidden">
        {/* Dynamic Image Background */}
        {bgImageUrl && (
          <div 
            className="fixed inset-0 pointer-events-none opacity-40 transition-opacity duration-1000 bg-cover bg-center"
            style={{ backgroundImage: `url(${bgImageUrl})` }}
          />
        )}
        {/* Gradient Overlay for blend */}
        <div className="fixed inset-0 pointer-events-none mix-blend-multiply bg-gradient-to-br from-surface-900/80 to-[#000]" />
        
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 w-full max-w-lg animate-scale-in">
          {/* Preview card */}
          <div className="glass-noise rounded-2xl p-8 text-center border border-white/10 shadow-2xl backdrop-blur-3xl bg-black/40">
            <Logo className="justify-center mb-6" />
            <h1 className="text-2xl font-bold text-white mb-6">
              {meeting?.title || 'Meeting Room'}
            </h1>

            {/* Camera preview placeholder */}
            <div className="aspect-video rounded-xl bg-surface-800/80 border border-white/10 mb-4 flex flex-col items-center justify-center overflow-hidden backdrop-blur-md relative">
              <div className="flex flex-col items-center gap-3">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-3xl font-bold text-white shadow-glow">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-white">{user?.name}</span>
              </div>
              
              {/* Cat Fact overlay */}
              {catFact && (
                <div className="absolute bottom-0 inset-x-0 p-3 bg-black/60 backdrop-blur-sm border-t border-white/10 text-xs text-text-secondary text-left">
                  <span className="font-bold text-accent-light">Cat Fact:</span> {catFact}
                </div>
              )}
            </div>
            
            {/* Trivia Section */}
            {trivia ? (
              <div className="mb-6 bg-white/5 border border-white/10 rounded-xl p-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🤔</span>
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Trivia Time</span>
                </div>
                <p className="text-sm text-white font-medium mb-3">{trivia.q}</p>
                {showTriviaAnswer ? (
                  <p className="text-sm text-accent-light animate-fade-in font-bold">A: {trivia.a}</p>
                ) : (
                  <button 
                    onClick={() => setShowTriviaAnswer(true)}
                    className="text-xs px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    Reveal Answer
                  </button>
                )}
              </div>
            ) : (
              <div className="h-24 mb-6" /> // spacer if loading
            )}

            {/* Controls preview */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <button className="w-12 h-12 rounded-full bg-surface-700 border border-border-medium flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-600 transition-all cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
              <button className="w-12 h-12 rounded-full bg-surface-700 border border-border-medium flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-600 transition-all cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            
            {/* E2EE Input */}
            <div className="mb-6 text-left">
              <label className="block text-xs font-medium text-text-secondary mb-1">
                E2EE Key (Optional) <span title="End-to-End Encryption mathematically guarantees privacy.">🔒</span>
              </label>
              <input
                type="password"
                value={e2eeKey}
                onChange={(e) => setE2eeKey(e.target.value)}
                placeholder="Enter shared secret for absolute privacy"
                className="w-full bg-surface-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent text-sm"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => router.push('/dashboard')}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleJoin}
                title={kanyeQuote} // Kanye API Tooltip
              >
                Join now
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active meeting
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-cyan-900/40 via-surface-900 to-purple-900/40 overflow-hidden relative">
      {/* Background Mesh */}
      <div className="absolute inset-0 bg-mesh opacity-20 pointer-events-none mix-blend-overlay" />
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={serverUrl}
        options={{
          e2ee: e2eeProvider ? { 
            keyProvider: e2eeProvider,
            worker: new Worker(new URL('livekit-client/e2ee-worker', import.meta.url))
          } : undefined
        }}
        data-lk-theme="default"
        className="h-full flex flex-col"
        onDisconnected={handleDisconnect}
      >
        <WhisperProvider>
          <RoomContent
            meetingId={roomId}
            meetingTitle={meeting?.title || 'Meeting Room'}
            hostId={meeting?.hostId || ''}
          />
        </WhisperProvider>
      </LiveKitRoom>
    </div>
  );
}

/**
 * Inner component that has access to LiveKit room context.
 * Must be a child of <LiveKitRoom>.
 */
function RoomContent({
  meetingId,
  meetingTitle,
  hostId,
}: {
  meetingId: string;
  meetingTitle: string;
  hostId: string;
}) {
  const [showParticipants, setShowParticipants] = useState(false);
  const participants = useParticipants();

  // Filter out agent identity for count
  const AGENT_PREFIX = process.env.NEXT_PUBLIC_AGENT_IDENTITY || 'quo-agent';
  const visibleCount = participants.filter(
    (p) => !p.identity.startsWith(AGENT_PREFIX),
  ).length;

  // Detect screen share
  const isScreenSharing = participants.some((p) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Array.from(p.videoTrackPublications.values() as Iterable<any>).some(
      (pub) => pub.source === 'screen_share' && pub.isSubscribed,
    ),
  );

  return (
    <>
      <MeetingHeader
        title={meetingTitle}
        participantCount={visibleCount}
        isScreenSharing={isScreenSharing}
        onToggleParticipants={() => setShowParticipants(!showParticipants)}
      />

      <main className="flex-1 relative p-3 md:p-4 h-[calc(100vh-3.5rem-5rem)]">
        <VideoGrid />
      </main>

      <SpatialAudioRenderer />
      <ConnectionStateToast />
      <MeetingControls />

      <ReactionsLayer />
      <LiveCaptions />
      <ParticipantList
        meetingId={meetingId}
        hostId={hostId}
        isOpen={showParticipants}
        onClose={() => setShowParticipants(false)}
      />
    </>
  );
}
