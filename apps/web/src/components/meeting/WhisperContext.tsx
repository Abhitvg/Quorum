'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { RoomEvent, RemoteParticipant } from 'livekit-client';

interface WhisperContextType {
  localGroup: string | null;
  setLocalGroup: (group: string | null) => void;
  participantGroups: Record<string, string | null>;
}

const WhisperContext = createContext<WhisperContextType>({
  localGroup: null,
  setLocalGroup: () => {},
  participantGroups: {},
});

export function WhisperProvider({ children }: { children: ReactNode }) {
  const room = useRoomContext();
  const [localGroup, setLocalGroupState] = useState<string | null>(null);
  const [participantGroups, setParticipantGroups] = useState<Record<string, string | null>>({});

  useEffect(() => {
    const handleData = (payload: Uint8Array, participant?: RemoteParticipant) => {
      try {
        const decoded = new TextDecoder().decode(payload);
        const parsed = JSON.parse(decoded);
        
        if (parsed.type === 'whisper-group' && participant) {
          setParticipantGroups(prev => ({
            ...prev,
            [participant.identity]: parsed.group
          }));
        }
      } catch {
        // ignore parse error
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    
    // Also handle participant disconnected to clean up state
    const handleParticipantDisconnected = (participant: RemoteParticipant) => {
      setParticipantGroups(prev => {
        const newGroups = { ...prev };
        delete newGroups[participant.identity];
        return newGroups;
      });
    };
    
    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);

    return () => {
      room.off(RoomEvent.DataReceived, handleData);
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
    };
  }, [room]);

  // When local group changes, broadcast it
  const setLocalGroup = (group: string | null) => {
    setLocalGroupState(group);
    setParticipantGroups(prev => ({
      ...prev,
      [room.localParticipant.identity]: group
    }));
    
    const payload = JSON.stringify({ type: 'whisper-group', group });
    const data = new TextEncoder().encode(payload);
    room.localParticipant.publishData(data, { reliable: true });
  };

  // Re-broadcast our group to any new participants that join
  useEffect(() => {
    const handleParticipantConnected = () => {
      if (localGroup) {
        const payload = JSON.stringify({ type: 'whisper-group', group: localGroup });
        const data = new TextEncoder().encode(payload);
        room.localParticipant.publishData(data, { reliable: true });
      }
    };
    
    room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
    return () => {
      room.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
    };
  }, [room, localGroup]);

  return (
    <WhisperContext.Provider value={{ localGroup, setLocalGroup, participantGroups }}>
      {children}
    </WhisperContext.Provider>
  );
}

export const useWhisper = () => useContext(WhisperContext);
