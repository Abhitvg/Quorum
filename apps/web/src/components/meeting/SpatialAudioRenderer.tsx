'use client';

import { useEffect, useRef, useState } from 'react';
import { useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useWhisper } from './WhisperContext';

export default function SpatialAudioRenderer() {
  const { localGroup, participantGroups } = useWhisper();
  const allTracks = useTracks([Track.Source.Microphone], { onlySubscribed: true });
  
  // Filter for whisper groups
  const tracks = allTracks.filter(t => (participantGroups[t.participant.identity] || null) === localGroup);
  
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  
  // Track sources and panners to avoid recreating
  const audioNodes = useRef<Map<string, { source: MediaStreamAudioSourceNode, panner: StereoPannerNode, element: HTMLAudioElement }>>(new Map());

  // Initialize AudioContext on first user interaction if not ready
  useEffect(() => {
    const handleInteraction = () => {
      if (!audioCtx) {
        // @ts-expect-error non-standard webkit prefix
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        setAudioCtx(ctx);
      }
    };
    
    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('touchstart', handleInteraction, { once: true });
    
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, [audioCtx]);

  useEffect(() => {
    if (!audioCtx) return;

    // Create or update audio nodes for each track
    tracks.forEach((trackRef, index) => {
      const trackId = trackRef.publication.trackSid || trackRef.participant.identity;
      const mediaStreamTrack = trackRef.publication.track?.mediaStreamTrack;
      
      if (!mediaStreamTrack || trackRef.participant.isLocal) return;
      
      if (!audioNodes.current.has(trackId)) {
        // Create an audio element to play the stream (must be muted natively if we route through WebAudio? 
        // Actually, creating a MediaStreamSource connects it to the graph. We need a dummy audio element to keep the track alive in some browsers, but we route it via WebAudio)
        const stream = new MediaStream([mediaStreamTrack]);
        
        // Some browsers require an <audio> element to be playing the stream for WebAudio to process it
        const audioElement = new Audio();
        audioElement.srcObject = stream;
        audioElement.muted = true; // Mute the raw element so we only hear the WebAudio output
        audioElement.play().catch(e => console.error('Spatial Audio play failed', e));

        const source = audioCtx.createMediaStreamSource(stream);
        const panner = audioCtx.createStereoPanner();
        
        // Calculate pan based on index (assuming a standard grid layout)
        // 0 = left (-1), 1 = right (1), 2 = mid-left (-0.5), 3 = mid-right (0.5), etc.
        const panValue = index % 2 === 0 ? -0.8 : 0.8;
        panner.pan.value = tracks.length <= 2 ? 0 : panValue; // If only 1 other person, keep it centered. Otherwise pan.

        source.connect(panner);
        panner.connect(audioCtx.destination);
        
        audioNodes.current.set(trackId, { source, panner, element: audioElement });
      } else {
        // Update pan if index changed
        const nodes = audioNodes.current.get(trackId);
        if (nodes) {
          const panValue = index % 2 === 0 ? -0.8 : 0.8;
          nodes.panner.pan.value = tracks.length <= 2 ? 0 : panValue;
        }
      }
    });

    // Cleanup disconnected tracks
    const currentTrackIds = new Set(tracks.map(t => t.publication.trackSid || t.participant.identity));
    audioNodes.current.forEach((nodes, id) => {
      if (!currentTrackIds.has(id)) {
        nodes.source.disconnect();
        nodes.panner.disconnect();
        nodes.element.srcObject = null;
        audioNodes.current.delete(id);
      }
    });

  }, [tracks, audioCtx]);

  // Clean up entirely on unmount
  useEffect(() => {
    const nodesMap = audioNodes.current;
    return () => {
      nodesMap.forEach(nodes => {
        nodes.source.disconnect();
        nodes.panner.disconnect();
        nodes.element.srcObject = null;
      });
      nodesMap.clear();
      if (audioCtx?.state !== 'closed') {
        audioCtx?.close();
      }
    };
  }, [audioCtx]);

  // We do not render visible UI. The native <audio> tags are hidden and routed through WebAudio.
  return null;
}
