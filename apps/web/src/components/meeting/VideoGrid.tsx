'use client';

import { useMemo } from 'react';
import {
  useTracks,
  ParticipantName,
  ParticipantTile,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';
import ScreenShareView from './ScreenShareView';

const AGENT_IDENTITY_PREFIX = process.env.NEXT_PUBLIC_AGENT_IDENTITY || 'quo-agent';

export default function VideoGrid() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
      { source: Track.Source.Microphone, withPlaceholder: true }, // We need mic for the agent
    ],
    { onlySubscribed: false },
  );

  // We filter out audio tracks for normal users so we don't render them as tiles,
  // but we keep the agent's tile.
  const visibleTracks = useMemo(
    () => tracks.filter((t) => {
        // Agent's track
        if (t.participant.identity.startsWith(AGENT_IDENTITY_PREFIX)) {
            // Agent doesn't have a camera, so we render their audio track as their tile
            return t.source === Track.Source.Microphone;
        }
        // Human users render their camera tracks
        return t.source === Track.Source.Camera || t.source === Track.Source.ScreenShare;
    }),
    [tracks],
  );

  const screenShares = useMemo(
    () => visibleTracks.filter((t) => t.source === Track.Source.ScreenShare),
    [visibleTracks],
  );

  const cameraTracks = useMemo(
    () => visibleTracks.filter((t) => t.source !== Track.Source.ScreenShare),
    [visibleTracks],
  );

  if (screenShares.length > 0) {
    return (
      <ScreenShareView
        screenShare={screenShares[0]}
        cameraTracks={cameraTracks}
      />
    );
  }

  const gridCols = getGridCols(cameraTracks.length);

  return (
    <div className={`w-full h-full grid ${gridCols} gap-3 auto-rows-fr`}>
      {cameraTracks.map((trackRef) => {
        if (trackRef.participant.identity.startsWith(AGENT_IDENTITY_PREFIX)) {
            return <AgentTile key={trackRef.participant.identity} trackRef={trackRef} />;
        }
        return <ParticipantCard key={trackRef.participant.identity + trackRef.source} trackRef={trackRef} />;
      })}
    </div>
  );
}

function getGridCols(count: number): string {
  if (count <= 1) return 'grid-cols-1';
  if (count <= 2) return 'grid-cols-2';
  if (count <= 4) return 'grid-cols-2';
  if (count <= 9) return 'grid-cols-3';
  return 'grid-cols-4';
}

export function ParticipantCard({
  trackRef,
}: {
  trackRef: TrackReferenceOrPlaceholder;
}) {
  return (
    <div className="relative rounded-xl overflow-hidden bg-surface-800 border border-border-subtle shadow-card group transition-all duration-200 hover:border-border-accent/30">
      <ParticipantTile
        trackRef={trackRef}
        className="w-full h-full [&_video]:object-cover"
      />
      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs font-medium text-white flex items-center gap-2">
        <ParticipantName participant={trackRef.participant} />
        {trackRef.participant.isSpeaking && <SpeakingIndicator />}
      </div>
    </div>
  );
}

export function AgentTile({
  trackRef,
}: {
  trackRef: TrackReferenceOrPlaceholder;
}) {
  // Read an attribute from the participant to determine state.
  // In Phase 5, the python agent updates its attributes: e.g., { agentState: 'idle' | 'researching' | 'responding' }
  const stateStr = trackRef.participant.attributes?.agentState || 'idle';
  
  // Subtle state-based color mapping
  const bgColors = {
      idle: 'bg-surface-800',
      researching: 'bg-indigo-900/40',
      responding: 'bg-accent/20'
  };
  const colorClass = bgColors[stateStr as keyof typeof bgColors] || bgColors.idle;

  return (
    <div className={`relative rounded-xl overflow-hidden ${colorClass} border border-border-subtle shadow-card transition-all duration-500 flex flex-col items-center justify-center`}>
      {/* Orb representation */}
      <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${
          stateStr === 'idle' ? 'bg-surface-600/50 scale-100' :
          stateStr === 'researching' ? 'bg-indigo-500/30 scale-105 animate-pulse' :
          'bg-accent/40 scale-110'
      }`}>
         <div className={`w-16 h-16 rounded-full transition-all duration-200 ${
             stateStr === 'idle' ? 'bg-surface-500/50' :
             stateStr === 'researching' ? 'bg-indigo-400/50' :
             'bg-accent animate-pulse'
         }`} />
      </div>
      
      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs font-medium text-white flex items-center gap-2">
        <ParticipantName participant={trackRef.participant} />
        {trackRef.participant.isSpeaking && <SpeakingIndicator />}
      </div>
    </div>
  );
}

export function SpeakingIndicator() {
  return (
    <div className="flex items-center gap-0.5 h-2">
      <span className="w-0.5 h-full bg-accent animate-pulse" />
      <span className="w-0.5 h-1/2 bg-accent animate-pulse [animation-delay:75ms]" />
      <span className="w-0.5 h-3/4 bg-accent animate-pulse [animation-delay:150ms]" />
    </div>
  );
}
