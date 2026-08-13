'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  ControlBar,
  ConnectionStateToast,
  useParticipants,
} from '@livekit/components-react';
import '@livekit/components-styles';

import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import Button from '@/components/Button';
import MeetingHeader from '@/components/meeting/MeetingHeader';
import VideoGrid from '@/components/meeting/VideoGrid';
import ParticipantList from '@/components/meeting/ParticipantList';

export default function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const roomId = resolvedParams.id;

  const router = useRouter();
  const { user, loading } = useAuth();

  const [token, setToken] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [meeting, setMeeting] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    api.meetings
      .getToken(roomId)
      .then((res) => {
        setToken(res.token);
        setServerUrl(res.url);
      })
      .catch((err) => setError(err.message || 'Failed to join meeting'));

    api.meetings
      .get(roomId)
      .then((res) => setMeeting(res.meeting))
      .catch(console.error);
  }, [roomId, user, loading, router]);

  if (loading || (!token && !error)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#050505]">
        <div className="glass p-8 rounded-2xl max-w-md text-center">
          <div className="w-12 h-12 rounded-full bg-status-error/10 text-status-error flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Connection Error</h2>
          <p className="text-text-secondary mb-6">{error}</p>
          <Button onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#050505] overflow-hidden">
      <LiveKitRoom
        video={true}
        audio={true}
        token={token}
        serverUrl={serverUrl}
        data-lk-theme="default"
        className="h-full flex flex-col"
        onDisconnected={() => router.push('/dashboard')}
      >
        <RoomContent
          meetingId={roomId}
          meetingTitle={meeting?.title || 'Meeting Room'}
          hostId={meeting?.hostId || ''}
        />
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

      <main className="flex-1 relative p-4 h-[calc(100vh-3.5rem-5rem)]">
        <VideoGrid />
      </main>

      <RoomAudioRenderer />
      <ConnectionStateToast />
      <ControlBar
        variation="minimal"
        controls={{ screenShare: true, chat: false }}
        className="bg-surface-900/80 backdrop-blur-md border-t border-border-subtle"
      />

      <ParticipantList
        meetingId={meetingId}
        hostId={hostId}
        isOpen={showParticipants}
        onClose={() => setShowParticipants(false)}
      />
    </>
  );
}
