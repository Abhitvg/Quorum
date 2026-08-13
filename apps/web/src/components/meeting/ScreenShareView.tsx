'use client';

import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';
import { ParticipantTile, ParticipantName } from '@livekit/components-react';
import { ParticipantCard } from './VideoGrid';

interface ScreenShareViewProps {
  screenShare: TrackReferenceOrPlaceholder;
  cameraTracks: TrackReferenceOrPlaceholder[];
}

/**
 * Promoted screen share layout: large share (75% width) with
 * camera feeds in a vertical strip on the right.
 * This layout spine will be reused for the transcript panel in Phase 4.
 */
export default function ScreenShareView({
  screenShare,
  cameraTracks,
}: ScreenShareViewProps) {
  return (
    <div className="w-full h-full flex gap-3">
      {/* Promoted screen share — main area */}
      <div className="flex-1 min-w-0 relative rounded-xl overflow-hidden bg-surface-800 border border-accent/20 shadow-glow">
        <ParticipantTile
          trackRef={screenShare}
          className="w-full h-full [&_video]:object-contain [&_video]:bg-black"
        />
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs font-medium text-white flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-accent-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <ParticipantName participant={screenShare.participant} />
          <span className="text-text-muted">is sharing</span>
        </div>
      </div>

      {/* Camera strip — right sidebar */}
      <div className="w-48 lg:w-56 shrink-0 flex flex-col gap-3 overflow-y-auto">
        {cameraTracks.map((trackRef) => (
          <div key={trackRef.participant.identity} className="aspect-video shrink-0">
            <ParticipantCard trackRef={trackRef} />
          </div>
        ))}
      </div>
    </div>
  );
}
