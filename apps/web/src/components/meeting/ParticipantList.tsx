'use client';

import { useState } from 'react';
import { useParticipants, useLocalParticipant } from '@livekit/components-react';
import { api } from '@/lib/api';
import { SpeakingIndicator } from './VideoGrid';
import Avatar from '@/components/Avatar';
import Badge from '@/components/Badge';

/** Identity prefix used by the Quo agent — filtered out of participant list */
const AGENT_IDENTITY_PREFIX = process.env.NEXT_PUBLIC_AGENT_IDENTITY || 'quo-agent';

interface ParticipantListProps {
  meetingId: string;
  hostId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ParticipantList({
  meetingId,
  hostId,
  isOpen,
  onClose,
}: ParticipantListProps) {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const isHost = localParticipant.identity === hostId;

  // Filter out agent identity
  const visibleParticipants = participants.filter(
    (p) => !p.identity.startsWith(AGENT_IDENTITY_PREFIX),
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 animate-backdrop-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-80 bg-surface-900/95 backdrop-blur-xl border-l border-border-subtle z-40 flex flex-col animate-slide-in-right shadow-2xl">
        {/* Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-border-subtle shrink-0">
          <h2 className="text-sm font-semibold text-text-primary">
            Participants ({visibleParticipants.length})
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-700 transition-all cursor-pointer active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Participant list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {visibleParticipants.map((participant, index) => {
            const isParticipantHost = participant.identity === hostId;
            const isLocal = participant.identity === localParticipant.identity;
            const name = participant.name || participant.identity;
            const isMicMuted = !participant.isMicrophoneEnabled;

            return (
              <div
                key={participant.identity}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all group animate-fade-in-up
                  ${participant.isSpeaking ? 'bg-accent/5' : 'hover:bg-surface-800'}`}
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={name} size="sm" showOnline={!isMicMuted} />

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-medium text-text-primary truncate">
                        {name}
                      </span>
                      {isLocal && <Badge variant="you">You</Badge>}
                      {isParticipantHost && <Badge variant="host">Host</Badge>}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {participant.isSpeaking && (
                        <div className="flex items-center gap-1">
                          <SpeakingIndicator />
                          <span className="text-[10px] text-accent-light">Speaking</span>
                        </div>
                      )}
                      {isMicMuted && !participant.isSpeaking && (
                        <div className="flex items-center gap-1 text-text-muted">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                          </svg>
                          <span className="text-[10px]">Muted</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Host controls */}
                {isHost && !isLocal && (
                  <HostControls
                    meetingId={meetingId}
                    participantIdentity={participant.identity}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

/**
 * Host-only mute/kick controls for a participant.
 */
function HostControls({
  meetingId,
  participantIdentity,
}: {
  meetingId: string;
  participantIdentity: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleKick = async () => {
    if (!confirm('Remove this participant from the meeting?')) return;
    setLoading(true);
    try {
      await api.meetings.kickParticipant(meetingId, participantIdentity);
    } catch (err) {
      console.error('Failed to kick participant', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
      <button
        onClick={handleKick}
        disabled={loading}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-status-error hover:bg-status-error/10 transition-all cursor-pointer disabled:opacity-50 active:scale-90"
        title="Remove from meeting"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
        </svg>
      </button>
    </div>
  );
}
