'use client';

import { useMemo, useRef, useState } from 'react';
import {
  useTracks,
  ParticipantName,
  VideoTrack,
  ConnectionQualityIndicator,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import type { TrackReferenceOrPlaceholder } from '@livekit/components-core';
import ScreenShareView from './ScreenShareView';
import Avatar from '@/components/Avatar';
import { useWhisper } from './WhisperContext';

const AGENT_IDENTITY_PREFIX = process.env.NEXT_PUBLIC_AGENT_IDENTITY || 'quo-agent';

export default function VideoGrid() {
  const { localGroup, participantGroups } = useWhisper();
  
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
      { source: Track.Source.Microphone, withPlaceholder: true },
    ],
    { onlySubscribed: false },
  );

  const visibleTracks = useMemo(
    () => tracks.filter((t) => {
        const pGroup = participantGroups[t.participant.identity] || null;
        if (pGroup !== localGroup) return false;
        
        if (t.participant.identity.startsWith(AGENT_IDENTITY_PREFIX)) {
            return t.source === Track.Source.Microphone;
        }
        return t.source === Track.Source.Camera || t.source === Track.Source.ScreenShare;
    }),
    [tracks, localGroup, participantGroups],
  );

  const screenShares = useMemo(
    () => visibleTracks.filter((t) => t.source === Track.Source.ScreenShare),
    [visibleTracks],
  );

  const cameraTracks = useMemo(
    () => visibleTracks.filter((t) => t.source !== Track.Source.ScreenShare),
    [visibleTracks],
  );

  const [pinnedParticipantId, setPinnedParticipantId] = useState<string | null>(null);

  // Auto-Layout: Automatically unpin if participant leaves
  const activePinnedId = useMemo(() => {
    if (!pinnedParticipantId) return null;
    const stillExists = cameraTracks.some(t => t.participant.identity === pinnedParticipantId);
    return stillExists ? pinnedParticipantId : null;
  }, [cameraTracks, pinnedParticipantId]);

  if (screenShares.length > 0) {
    return (
      <ScreenShareView
        screenShare={screenShares[0]}
        cameraTracks={cameraTracks}
      />
    );
  }

  // Handle Spotlight Mode
  if (activePinnedId) {
    const pinnedTrack = cameraTracks.find(t => t.participant.identity === activePinnedId);
    const filmstripTracks = cameraTracks.filter(t => t.participant.identity !== activePinnedId);

    return (
      <div className="w-full h-full flex flex-col gap-4 p-4 animate-fade-in">
        {/* Spotlight Area */}
        <div className="flex-1 w-full min-h-0 relative">
          {pinnedTrack && (
            <ParticipantCard 
              trackRef={pinnedTrack} 
              isSpotlight 
              onTogglePin={() => setPinnedParticipantId(null)}
            />
          )}
        </div>
        
        {/* Filmstrip Area */}
        <div className="h-48 w-full flex gap-4 overflow-x-auto pb-2 snap-x hide-scrollbar">
          {filmstripTracks.map((trackRef, index) => {
             if (trackRef.participant.identity.startsWith(AGENT_IDENTITY_PREFIX)) {
                 return <div key={trackRef.participant.identity} className="w-64 flex-shrink-0 snap-start hover-lift"><AgentTile trackRef={trackRef} /></div>;
             }
             return (
               <div key={trackRef.participant.identity} className="w-64 flex-shrink-0 snap-start hover-lift">
                 <ParticipantCard
                   trackRef={trackRef}
                   index={index}
                   onTogglePin={() => setPinnedParticipantId(trackRef.participant.identity)}
                 />
               </div>
             );
          })}
        </div>
      </div>
    );
  }

  const gridCols = getGridCols(cameraTracks.length);

  return (
    <div className={`w-full h-full grid ${gridCols} gap-6 auto-rows-fr max-w-7xl mx-auto items-center p-4 animate-fade-in`}>
      {cameraTracks.map((trackRef, index) => {
        if (trackRef.participant.identity.startsWith(AGENT_IDENTITY_PREFIX)) {
            return <AgentTile key={trackRef.participant.identity} trackRef={trackRef} />;
        }
        return (
          <ParticipantCard
            key={trackRef.participant.identity + trackRef.source}
            trackRef={trackRef}
            index={index}
            onTogglePin={() => setPinnedParticipantId(trackRef.participant.identity)}
          />
        );
      })}
    </div>
  );
}

function getGridCols(count: number): string {
  if (count <= 1) return 'grid-cols-1';
  if (count <= 2) return 'grid-cols-2';
  if (count <= 4) return 'grid-cols-2 lg:grid-cols-2';
  if (count <= 9) return 'grid-cols-3';
  return 'grid-cols-4 lg:grid-cols-4';
}

export function ParticipantCard({
  trackRef,
  index = 0,
  isSpotlight = false,
  onTogglePin,
}: {
  trackRef: TrackReferenceOrPlaceholder;
  index?: number;
  isSpotlight?: boolean;
  onTogglePin?: () => void;
}) {
  const isSpeaking = trackRef.participant.isSpeaking;
  const isVideoEnabled = trackRef.participant.isCameraEnabled;
  const isAudioEnabled = trackRef.participant.isMicrophoneEnabled;
  const name = trackRef.participant.name || trackRef.participant.identity;
  const containerRef = useRef<HTMLDivElement>(null);

  const togglePiP = async () => {
    try {
      const video = containerRef.current?.querySelector('video');
      if (!video) return;

      if (document.pictureInPictureElement === video) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch (e) {
      console.error('PiP failed', e);
    }
  };

  return (
    <div
      ref={containerRef}
      onDoubleClick={onTogglePin}
      className={`relative w-full h-full ${isSpotlight ? '' : 'min-h-[192px] sm:min-h-[300px]'} rounded-[var(--radius-xl)] overflow-hidden transition-all duration-500 animate-spring-up group
        ${isSpeaking
          ? 'shadow-[0_0_40px_rgba(6,182,212,0.3)] scale-[1.02] border border-accent/50 z-10'
          : 'shadow-card border border-white/5 hover:border-white/10 hover:shadow-card-hover z-0'
        }`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Background Mesh (visible when video is off) */}
      <div className="absolute inset-0 bg-surface-800 -z-10" />
      <div className="absolute inset-0 bg-mesh opacity-20 pointer-events-none -z-10" />

      {/* Video or Fallback */}
      {isVideoEnabled ? (
        <div className="relative z-10 w-full h-full">
          <VideoTrack
            // @ts-expect-error type mismatch with trackRef
            trackRef={trackRef}
            className="w-full h-full object-cover rounded-[var(--radius-xl)]"
          />
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center relative z-10 glass-noise">
          <Avatar name={name} size="2xl" className={isSpeaking ? 'animate-breathe shadow-glow' : ''} />
          {isSpeaking && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <div className="w-32 h-32 rounded-full border-2 border-accent-glow animate-ripple" />
               <div className="w-32 h-32 rounded-full border-2 border-indigo-glow animate-ripple" style={{ animationDelay: '0.7s' }} />
             </div>
          )}
        </div>
      )}

      {/* Name tag overlay */}
      <div className={`absolute bottom-4 left-4 glass-strong px-3 py-1.5 rounded-full text-sm font-medium text-white flex items-center gap-2.5 transition-all
        ${isSpeaking ? 'border-accent/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'border-white/10'}`}>
        <ParticipantName participant={trackRef.participant} />
        {isSpeaking && <SpeakingIndicator />}
        
        {!isAudioEnabled && !isSpeaking && (
          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500/20 text-red-500 ml-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          </div>
        )}

        {/* Network Quality Indicator */}
        <div className="ml-1 opacity-70 scale-90">
          <ConnectionQualityIndicator participant={trackRef.participant} />
        </div>
      </div>

      {/* Pin/Unpin Button (visible on hover) */}
      {onTogglePin && (
        <button
          onClick={onTogglePin}
          className="absolute top-4 left-4 p-2 rounded-xl glass-strong border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10 hover:scale-105 active:scale-95"
          title={isSpotlight ? "Unpin" : "Pin (Spotlight)"}
        >
          <span className="text-sm">{isSpotlight ? '📌 Unpin' : '📌 Pin'}</span>
        </button>
      )}

      {/* PiP Button */}
      {isVideoEnabled && (
        <button
          onClick={togglePiP}
          className="absolute top-4 right-4 p-2 rounded-xl glass-strong border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10 hover:scale-105 active:scale-95"
          title="Picture-in-Picture"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11V9a2 2 0 00-2-2H7a2 2 0 00-2 2v6a2 2 0 002 2h2m4-8h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4a2 2 0 012-2z" />
          </svg>
        </button>
      )}
    </div>
  );
}

/* ========== Agent Tile — Premium Redesign ========== */

export function AgentTile({
  trackRef,
}: {
  trackRef: TrackReferenceOrPlaceholder;
}) {
  const stateStr = trackRef.participant.attributes?.agentState || 'idle';
  const isSpeaking = trackRef.participant.isSpeaking;

  const stateConfig = {
    idle: {
      bg: 'bg-surface-800',
      label: 'Idle',
      labelColor: 'text-text-muted',
      coreClass: 'bg-surface-600',
    },
    researching: {
      bg: 'bg-surface-800',
      label: 'Analyzing...',
      labelColor: 'text-indigo-400',
      coreClass: 'bg-indigo-600 shadow-[0_0_40px_rgba(99,102,241,0.5)] animate-pulse',
    },
    responding: {
      bg: 'bg-surface-800',
      label: 'Speaking...',
      labelColor: 'text-accent-light',
      coreClass: 'bg-accent shadow-[0_0_50px_rgba(6,182,212,0.6)]',
    },
  };

  const config = stateConfig[stateStr as keyof typeof stateConfig] || stateConfig.idle;

  return (
    <div className={`relative w-full h-full min-h-[192px] sm:min-h-[300px] rounded-[var(--radius-xl)] overflow-hidden ${config.bg} border border-white/5 shadow-card transition-all duration-700 flex flex-col items-center justify-center animate-spring-up
        ${(stateStr === 'responding' || isSpeaking) ? 'shadow-[0_0_60px_rgba(6,182,212,0.2)] border-accent/30' : ''}
    `}>
      <div className="absolute inset-0 bg-mesh opacity-10 pointer-events-none" />

      {/* Core visualization */}
      <div className="relative w-40 h-40 flex items-center justify-center z-10">
        
        {/* Expanding rings based on state */}
        {(stateStr === 'researching') && (
           <>
             <div className="absolute inset-0 rounded-full border border-indigo-500/30 animate-orb-expand" />
             <div className="absolute inset-0 rounded-full border border-indigo-500/20 animate-orb-expand" style={{ animationDelay: '1.5s' }} />
           </>
        )}

        {(stateStr === 'responding' || isSpeaking) && (
           <>
             <div className="absolute inset-0 rounded-full border border-accent/40 animate-orb-expand" />
             <div className="absolute inset-0 rounded-full border border-accent/20 animate-orb-expand" style={{ animationDelay: '1s' }} />
           </>
        )}

        {/* The AI Core */}
        <div className={`relative w-16 h-16 rounded-full transition-all duration-500 flex items-center justify-center border border-white/20 ${config.coreClass}`}>
          {/* Inner pulse */}
          <div className={`w-6 h-6 rounded-full bg-white transition-all duration-300 ${stateStr === 'idle' ? 'opacity-30 animate-breathe' : 'opacity-90'}`} />
        </div>

        {/* Audio waveform (responding state) */}
        {(stateStr === 'responding' || isSpeaking) && (
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-end gap-1 h-8">
            <span className="w-1 rounded-full bg-accent-light animate-waveform-1" />
            <span className="w-1 rounded-full bg-accent-light animate-waveform-2" />
            <span className="w-1 rounded-full bg-accent animate-waveform-3" />
            <span className="w-1 rounded-full bg-accent-light animate-waveform-1" style={{ animationDelay: '0.3s' }} />
            <span className="w-1 rounded-full bg-accent animate-waveform-2" style={{ animationDelay: '0.1s' }} />
          </div>
        )}
      </div>

      <p className={`mt-8 text-sm font-semibold tracking-wide ${config.labelColor} transition-colors duration-300`}>
        {config.label}
      </p>

      {/* Name tag */}
      <div className="absolute bottom-4 left-4 glass-strong px-3 py-1.5 rounded-full text-sm font-medium text-accent-light flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-accent-light animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
        <ParticipantName participant={trackRef.participant} />
      </div>
    </div>
  );
}

export function SpeakingIndicator() {
  return (
    <div className="flex items-center gap-[3px] h-3 ml-1">
      <span className="w-[3px] bg-accent-light rounded-full animate-waveform-1" style={{ height: '60%' }} />
      <span className="w-[3px] bg-accent rounded-full animate-waveform-2" style={{ height: '100%' }} />
      <span className="w-[3px] bg-accent-light rounded-full animate-waveform-3" style={{ height: '50%' }} />
    </div>
  );
}
