'use client';

import { useState } from 'react';
import { useParticipants, useLocalParticipant } from '@livekit/components-react';
import { api } from '@/lib/api';
import { SpeakingIndicator } from './VideoGrid';
import Button from '@/components/Button';

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
        className="fixed inset-0 bg-black/30 z-30"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-80 bg-surface-900 border-l border-border-subtle z-40 flex flex-col animate-fade-in shadow-2xl">
        {/* Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-border-subtle shrink-0">
          <h2 className="text-sm font-semibold text-text-primary">
            Participants ({visibleParticipants.length})
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-700 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Participant list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {visibleParticipants.map((participant) => {
            const isParticipantHost = participant.identity === hostId;
            const isLocal = participant.identity === localParticipant.identity;

            return (
              <div
                key={participant.identity}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-surface-800 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-surface-600 flex items-center justify-center text-xs font-medium text-text-primary border border-border-subtle shrink-0">
                    {(participant.name || participant.identity).charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary truncate">
                        {participant.name || participant.identity}
                      </span>
                      {isLocal && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent-light font-medium">
                          You
                        </span>
                      )}
                      {isParticipantHost && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-status-live/10 text-status-live font-medium">
                          Host
                        </span>
                      )}
                    </div>
                    {participant.isSpeaking && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <SpeakingIndicator />
                        <span className="text-[10px] text-accent-light">Speaking</span>
                      </div>
                    )}
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
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={handleKick}
        disabled={loading}
        className="w-7 h-7 rounded flex items-center justify-center text-text-muted hover:text-status-error hover:bg-status-error/10 transition-colors cursor-pointer disabled:opacity-50"
        title="Remove from meeting"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
        </svg>
      </button>
    </div>
  );
}
